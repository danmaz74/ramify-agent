import { readdir, readFile, rm } from 'node:fs/promises';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { ScriptStep } from '../../../../../agent/src/scripted.js';
import type { ConfiguredAuditPort } from '../../../../../audit/src/check-execution.js';
import type { RunEvent } from '../../../../src/run/log.js';
import { runLayout } from '../../../../src/run/records.js';

import { RunQueries } from '../../../../../projections/src/queries.js';
import { createQuerySource } from '../../../../../../src/http/query-source.js';
import { reviewLayout } from '../reviews/records.js';
import { snapshotToolNames } from '../../../../../reviews/src/snapshot.js';
import { scriptedCandidates, testReviewPolicy } from './helpers/candidates.js';
import { mappedAudit, passingAudit } from '../../../../../../src/tests/helpers/direct-check-execution.js';
import { expectNoProcesses, forgetExternalTools } from '../../../../../../src/tests/helpers/external-tools.js';
import { completionProposed, submit, treeInputs, write } from '../../../../../../src/tests/helpers/iterations.js';
import { disposition, reconcile, submission } from '../../../../../../src/tests/helpers/check-findings-composition.js';
import { mockGit } from '../../../../../../src/tests/helpers/mock-git.js';
import { attemptRecord, candidates, eventsOf, gate, limit, notes, notesDirectory, plan, reviewRun, reviewTarget, store, tool } from './helpers/reviews.js';
import { freeze, onlyRun, openRuns, runEventsOnDisk, runPath, staleCrashLock, stopRun, testPolicy, until } from '../../../../../../src/tests/helpers/runs.js';

vi.mock('node:child_process', async original =>
  (await import('../../../../../../src/tests/helpers/process-guard.js')).guardedChildProcess(await original<typeof import('node:child_process')>()));

/*
 * The lifecycle of review readers (Plan 12 iteration 3): a stop and the
 * explicit shutdown own every live reader and settle or fence each
 * attempt before the run's terminal event; a crash between a passing gate
 * and its request, or while a reader runs, is recovered once from the log;
 * a result committed before a crash is rebuilt without a reviewer; and a
 * slow gate audit no longer holds a reader's result back.
 */

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  try {
    for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
    expectNoProcesses();
  } finally { forgetExternalTools(); }
});

/** The only run of the project, whose ID a script step needs before the test has it. */
let currentRun = '';
const runIdOf = (): string => currentRun;

const never = (): ScriptStep => ({ kind: 'await', until: () => new Promise(() => undefined) });
/** A reader's turn that reads the path's patch through its tool, then submits a clean review of it. */
const clean = (inspected: string): ScriptStep[] => [tool(snapshotToolNames.diff, { path: inspected }), { kind: 'submit', input: { inspected: [inspected], missing: [], concerns: [] } }];
const concern = (path: string, summary: string): ScriptStep[] => [tool(snapshotToolNames.diff, { path }), { kind: 'submit', input: { inspected: [path], missing: [], concerns: [{
  summary, consequence: `${summary}, so the behavior differs from the goal`, rationale: 'read the candidate', uncertainty: 'low',
  remedy: 'a bounded change in the named file', locations: [{ path, startLine: 1, endLine: 1 }], suggests: null, risk: 'low', ground: null,
}] } }];

/** The three engineers of the scenario, the third starting only once `before` settles. */
function engineers(before?: () => Promise<unknown>, after?: ScriptStep) {
  return [
    submit(completionProposed('Added the note store.'), write(store, 'export const store = new Map(); // v1\n')),
    submit(completionProposed('Stated the note limit.'), write(limit, 'export const limit = (text: string) => text.length <= 50;\n')),
    submit(completionProposed('Exported the store.'),
      ...(before === undefined ? [] : [{ kind: 'await', until: before } as ScriptStep]),
      ...(after === undefined ? [] : [after]),
      write(store, 'export const store = new Map(); // v3\n'), write(`${notesDirectory}/src/index.ts`, 'export * from \'./store.js\';\n')),
  ];
}

/** The events of a run's log, once it stops changing. */
async function settledLog(root: string, runId: string): Promise<RunEvent[]> {
  let last = -1;
  for (;;) {
    const events = await runEventsOnDisk(root, plan, runId);
    if (events.length === last) return events;
    last = events.length;
    await new Promise(resolve => setTimeout(resolve, 150));
  }
}

/** A service opened over the crashed project: what recovery asks of Git is answered, and nothing is driven. */
async function restart(root: string) {
  const restarted = await openRuns(root, {
    // This reader-prefix projection control deliberately has no execution port.
    git: mockGit({ changedPaths: async () => [], currentHead: async () => 'revision-03' }),
    candidates: scriptedCandidates(root, candidates()),
    policy: projectRoot => testPolicy(projectRoot, { reviews: testReviewPolicy() }),
  });
  cleanups.push(() => restarted.service.close());
  return restarted;
}

describe('CF07: a stop owns every live reader, and a late result is fenced', () => {
  test('two live readers are stopped with the writer, each attempt is settled before job-stopped, and a reader that ignores its stop ingests nothing', async () => {
    const root = await reviewTarget(cleanups);
    const waiting = [gate(), gate()] as const;
    const signal = (index: 0 | 1): ScriptStep => ({ kind: 'await', until: async () => { waiting[index].open(); } });
    const run = await reviewRun(root, cleanups, {
      detached: true,
      stopGraceMs: 300,
      engineer: engineers(undefined, never()),
      reviewers: {
        'rq-0001': [tool(snapshotToolNames.diff, { path: store }), signal(0), never()],
        // This reader ignores its stop and submits a concern afterwards.
        'rq-0002': [signal(1), { kind: 'stall', ms: 1_500, thenIgnoreStop: true },
          ...concern(limit, 'A late concern that must not be ingested')],
      },
    });
    cleanups.push(() => run.service.close());
    const { service, runId } = run;
    await Promise.all(waiting.map(entry => entry.opened));
    // The third iteration's writer is live beside both readers: its session
    // has started, not only its invocation. A stop between the two ends the
    // invocation before any session exists, and there is none to stop.
    await until(async () => (await runEventsOnDisk(root, plan, runId)).some(event => event.type === 'invocation-started' && event.data.work.iteration === 'wi-001.i03')
      && run.agent!.sessions.filter(session => session.spec.role === 'engineer').length === 3);
    // Readers may still be writing, so the stop is sent at the version it finds.
    for (;;) {
      try {
        await service.execute(stopRun(plan, runId, service.getRun(plan, runId)!.version));
        break;
      } catch (error) {
        if ((error as { code?: string }).code !== 'stale-version') throw error;
      }
    }
    await service.settled(plan, runId);
    // The reader that ignored its stop has finished after the run ended.
    await until(() => run.agent!.sessions.some(session => session.spec.prompt.includes('rq-0002') && session.outcome !== undefined), 10_000);
    const events = await settledLog(root, runId);

    expect(onlyRun(service, plan).state).toBe('stopped');
    const stopped = events.find(event => event.type === 'job-stopped')!;
    expect(events.at(-1)).toBe(stopped);
    expect(stopped.data).toEqual({ settled: false });
    const finished = eventsOf(events, 'review-attempt-finished').sort((a, b) => (a.data.attempt < b.data.attempt ? -1 : 1));
    expect(finished.map(event => [event.data.attempt, event.data.result, event.data.reason, event.data.settles, event.data.checkFindings.length]))
      .toEqual([['rq-0001.a01', 'not-verified', 'stopped', true, 0], ['rq-0002.a01', 'not-verified', 'stopped', true, 0]]);
    expect(finished.every(event => event.sequence < stopped.sequence)).toBe(true);
    // Every reader and the writer were asked to stop.
    const reviewers = run.agent!.sessions.filter(session => session.spec.role === 'reviewer');
    expect(reviewers).toHaveLength(2);
    expect(reviewers.every(session => session.stopCalls > 0)).toBe(true);
    expect(run.agent!.sessions.find(session => session.spec.role === 'engineer' && session.stopCalls > 0)).toBeDefined();
    // Current authority fences the late snapshot call before its concern
    // reaches acceptance. No fabricated submission verdict is reported.
    const late = reviewers.find(session => session.spec.prompt.includes('rq-0002'))!;
    expect(late.verdicts).toEqual([]);
    expect(late.outcome).toMatchObject({ kind: 'failed' });
    expect(service.checkFindings(plan, runId, { kind: 'list', owner: null, select: 'all' })).toMatchObject({ ok: true, view: { total: 0 } });
    expect(service.reviews(plan, runId)!.coverage).toEqual({ state: 'available', requested: 2, complete: 0, partial: 0, notVerified: 2, pending: 0 });
  }, 60_000);

  test('a quiet reader outlives historical idle and settlement limits and completes before the final gate', async () => {
    const root = await reviewTarget(cleanups);
    const entered = gate(); const release = gate(); const completion = gate(); let revisions = 0;
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    try {
      const pending = reviewRun(root, cleanups, {
        policy: { settleMs: 300 },
        afterWrite: async write => { if (write === 'outline-revised' && ++revisions === 2) completion.open(); },
        engineer: engineers(),
        reviewers: { 'rq-0001': clean(store), 'rq-0002': clean(limit), 'rq-0003': [
          { kind: 'await', until: () => { entered.open(); return release.opened; } },
          tool(snapshotToolNames.diff, { path: store }), tool(snapshotToolNames.diff, { path: `${notesDirectory}/src/index.ts` }),
          { kind: 'submit', input: { inspected: [store, `${notesDirectory}/src/index.ts`], missing: [], concerns: [] } },
        ] },
      });
      await Promise.all([entered.opened, completion.opened]);
      await vi.advanceTimersByTimeAsync(60 * 60_000);
      release.open();
      const run = await pending;
      const { events, service, runId } = run;
      expect(onlyRun(service, plan).state).toBe('completed');
      const finished = eventsOf(events, 'review-attempt-finished');
      expect(finished).toHaveLength(3);
      expect(finished.every(event => event.data.result === 'complete' && event.data.reason === null)).toBe(true);
      const completed = events.find(event => event.type === 'job-completed')!;
      expect(finished.every(event => event.sequence < completed.sequence)).toBe(true);
      expect(service.reviews(plan, runId)!.coverage).toEqual({ state: 'available', requested: 3, complete: 3, partial: 0, notVerified: 0, pending: 0 });
    // Each reviewer's evaluation names the review request it served.
    const metrics = await new RunQueries(createQuerySource(service)).metrics(plan, runId);
    const served = new Map(eventsOf(events, 'review-attempt-started').map(event => [event.data.invocation, event.data.request]));
    const reviewers = metrics.evaluation.invocations.filter(evaluation => evaluation.role === 'reviewer');
    expect(reviewers).toHaveLength(3);
    expect(reviewers.map(evaluation => evaluation.request).sort()).toEqual(['rq-0001', 'rq-0002', 'rq-0003']);
    for (const evaluation of reviewers) expect(evaluation.request).toBe(served.get(evaluation.invocation));
      run.git.assertComplete();
    } finally { release.open(); vi.useRealTimers(); }
  }, 60_000);
});

describe('CF04: an unscheduled review', () => {
  test('a request beyond the queue\'s bound is finished as overflowed and never run', async () => {
    const root = await reviewTarget(cleanups);
    // One reader, one waiting request: the third request has no room while
    // the first reader waits for it to be refused. The reader also waits for
    // the work item's completion request, so the second request is always
    // still waiting when its deadline is set; `settleMs` above `attemptMs`
    // leaves it time to start then, as the trial policy does. With the two
    // equal, it was finished as having no time whenever the completion
    // request landed first, which under load it sometimes did.
    const run = await reviewRun(root, cleanups, {
      policy: { concurrency: 1, queue: 1, settleMs: 120_000 },
      afterWrite: async (_write, id) => { currentRun = id; },
      engineer: engineers(),
      reviewers: {
        'rq-0001': [{ kind: 'await', until: () => until(async () => {
          const events = await runEventsOnDisk(root, plan, runIdOf());
          return events.some(event => event.type === 'review-attempt-finished' && event.data.reason === 'queue-overflow')
            && events.some(event => event.type === 'outline-revised' && event.data.workItem === 'wi-001' && event.data.architectRef !== undefined);
        }) }, ...clean(store)],
        'rq-0002': clean(limit),
      },
    });
    const { events, service, runId } = run;
    expect(onlyRun(service, plan).state).toBe('completed');
    expect(eventsOf(events, 'review-attempt-finished').map(event => [event.data.attempt, event.data.result, event.data.reason])).toEqual([
      ['rq-0003.a01', 'not-verified', 'queue-overflow'], ['rq-0001.a01', 'complete', null], ['rq-0002.a01', 'complete', null],
    ]);
    expect(eventsOf(events, 'review-attempt-started').map(event => event.data.request)).toEqual(['rq-0001', 'rq-0002']);
    expect(await attemptRecord(root, runId, 'rq-0003.a01')).toMatchObject({ startedAt: null, invocation: null, result: { detail: expect.stringContaining('More than 1 review request') } });
  }, 60_000);
});

describe('CF06: a crash around a review is recovered exactly once', () => {
  test('a reopen without an execution agent retains the already requested candidate review', async () => {
    const root = await reviewTarget(cleanups);
    const crashed = gate();
    let frozen = false;
    const run = await reviewRun(root, cleanups, {
      detached: true,
      engineer: engineers(),
      reviewers: { 'rq-0001': clean(store) },
      afterWrite: async write => {
        if (frozen) return freeze();
        if (write !== 'iteration-closed') return;
        frozen = true;
        crashed.open();
        return freeze();
      },
    });
    await crashed.opened;
    const before = await settledLog(root, run.runId);
    expect(before.some(event => event.type === 'iteration-closed' && event.data.iteration === 'wi-001.i01')).toBe(true);
    expect(eventsOf(before, 'review-request-recorded')).toHaveLength(1);
    await staleCrashLock(root);

    const restarted = await restart(root);
    expect(restarted.agent).toBeUndefined();
    expect(restarted.recovery.reviews).toEqual([]);
    const after = await runEventsOnDisk(root, plan, run.runId);
    expect(eventsOf(after, 'iteration-candidate-prepared')).toEqual(eventsOf(before, 'iteration-candidate-prepared'));
    expect(after.slice(0, before.length)).toEqual(before);
    expect(after.slice(before.length).map(event => event.type)).toEqual(['invocation-ended']);
    expect(eventsOf(after, 'iteration-closed')[0]!.data).toMatchObject({ iteration: 'wi-001.i01', outcome: 'accepted' });
    expect(eventsOf(after, 'review-request-recorded')).toEqual(eventsOf(before, 'review-request-recorded'));
    expect(restarted.service.reviews(plan, run.runId)!.coverage).toMatchObject({ requested: 1 });

    // A second restart finds nothing owed and changes nothing.
    await restarted.service.close();
    cleanups.pop();
    const again = await restart(root);
    expect(again.recovery.reviews).toEqual([]);
    expect(await runEventsOnDisk(root, plan, run.runId)).toEqual(after);
  }, 60_000);

  test('a reopen without an execution agent retains an unfinished review attempt without inventing a result', async () => {
    const root = await reviewTarget(cleanups);
    const crashed = gate();
    let frozen = false;
    const run = await reviewRun(root, cleanups, {
      detached: true,
      engineer: engineers(),
      reviewers: { 'rq-0001': clean(store) },
      afterWrite: async (write, runId) => {
        if (frozen) return freeze();
        if (write !== 'invocation-started') return;
        if (!(await runEventsOnDisk(root, plan, runId)).some(event => event.type === 'review-attempt-started')) return;
        frozen = true;
        crashed.open();
        return freeze();
      },
    });
    await crashed.opened;
    const before = await settledLog(root, run.runId);
    const started = eventsOf(before, 'review-attempt-started');
    expect(started.map(event => event.data.attempt)).toEqual(['rq-0001.a01']);
    expect(before.some(event => event.type === 'review-attempt-finished')).toBe(false);
    await staleCrashLock(root);

    const restarted = await restart(root);
    expect(restarted.agent).toBeUndefined();
    expect(restarted.recovery.invocations).toContain(`${plan}/${run.runId}: ${started[0]!.data.invocation}`);
    expect(restarted.recovery.reviews).toEqual([]);
    const after = await runEventsOnDisk(root, plan, run.runId);
    expect(after.slice(0, before.length)).toEqual(before);
    for (const event of after.slice(before.length)) expect(event).toMatchObject({ type: 'invocation-ended', data: { finished: 'interrupted' } });
    expect(eventsOf(after, 'review-attempt-finished')).toEqual([]);
    expect(eventsOf(after, 'review-attempt-started')).toEqual(started);
    expect(restarted.service.reviews(plan, run.runId)!.coverage).toMatchObject({ requested: 1, pending: 1 });

    await restarted.service.close();
    cleanups.pop();
    const again = await restart(root);
    expect(again.recovery.reviews).toEqual([]);
    expect(await runEventsOnDisk(root, plan, run.runId)).toEqual(after);
  }, 60_000);

  test('a committed result is rebuilt from the log with its CheckFinding, and no reviewer runs again', async () => {
    const root = await reviewTarget(cleanups);
    const run = await reviewRun(root, cleanups, {
      engineer: engineers(),
      reviewers: { 'rq-0001': clean(store), 'rq-0002': concern(limit, 'The limit counts UTF-16 units'), 'rq-0003': clean(store) },
      reconcilers: { 'wi-001.rc01': reconcile(submission([disposition('cf-0001', { action: 'leave' })], { kind: 'unresolved' })) },
    });
    const { service, runId } = run;
    const coverage = service.reviews(plan, runId)!;
    const list = service.checkFindings(plan, runId, { kind: 'list', owner: null, select: 'all' });
    expect(list).toMatchObject({ ok: true, view: { total: 1 } });
    const attempt = await readFile(runPath(root, plan, runId, reviewLayout.attempt('rq-0002.a01')), 'utf8');
    await service.close();
    cleanups.splice(cleanups.indexOf(cleanups.at(-1)!), 1);

    // The crash lost every materialized review and CheckFinding record.
    await rm(runPath(root, plan, runId, 'reviews'), { recursive: true });
    await rm(runPath(root, plan, runId, 'check-findings'), { recursive: true });
    const restarted = await restart(root);
    expect(restarted.agent).toBeUndefined();
    expect(restarted.recovery.rematerialized).toEqual([expect.stringMatching(new RegExp(`^${plan}/${runId}: \\d+ record file\\(s\\)$`, 'u'))]);
    expect(restarted.recovery.reviews).toEqual([]);
    expect(restarted.service.reviews(plan, runId)).toEqual(coverage);
    expect(restarted.service.checkFindings(plan, runId, { kind: 'list', owner: null, select: 'all' })).toEqual(list);
    expect(await readFile(runPath(root, plan, runId, reviewLayout.attempt('rq-0002.a01')), 'utf8')).toBe(attempt);
    expect((await readdir(runPath(root, plan, runId, 'reviews'))).sort()).toEqual(['rq-0001', 'rq-0002', 'rq-0003']);
  }, 60_000);
});

describe('the gate audit and the run mutex', () => {
  test('a failed audit retains a clean review before returning repair work', async () => {
    const root = await reviewTarget(cleanups);
    const release = gate();
    const audit = mappedAudit(({ context, check }) => context.attemptId === 'ga-0002' && check.kind === 'tests'
      ? { outcome: { kind: 'completed', exitCode: 1 }, stdout: 'scripted failure' } : {});
    const run = await reviewRun(root, cleanups, {
      detached: true, configuredAudit: audit, engineer: engineers(),
      reviewers: { 'rq-0001': [{ kind: 'await', until: () => release.opened }, ...clean(store)] },
    });
    cleanups.push(() => run.service.close());
    await until(async () => (await runEventsOnDisk(root, plan, run.runId)).some(event =>
      event.type === 'gate-attempted' && event.data.gate === 'ga-0002'), 5_000);
    const during = await runEventsOnDisk(root, plan, run.runId);
    expect(eventsOf(during, 'gate-attempted').find(event => event.data.gate === 'ga-0002')?.data.verdict).toBe('failed');
    expect(during.some(event => event.type === 'review-request-recorded' && event.data.candidate === 'revision-01')).toBe(true);
    expect(during.some(event => event.type === 'iteration-closed' && event.data.iteration === 'wi-001.i01')).toBe(false);
    release.open();
    await run.service.settled(plan, run.runId);
    const events = await runEventsOnDisk(root, plan, run.runId);
    const reviewed = eventsOf(events, 'review-attempt-finished').find(event => event.data.request === 'rq-0001')!;
    const nextEngineer = events.find(event => event.type === 'invocation-started' && event.data.role === 'engineer'
      && event.sequence > events.find(entry => entry.type === 'gate-attempted' && entry.data.gate === 'ga-0002')!.sequence);
    expect(reviewed.data.result).toBe('complete');
    expect(nextEngineer).toBeDefined();
    expect(reviewed.sequence).toBeLessThan(nextEngineer!.sequence);
  }, 60_000);

  test('a later failed candidate is reviewed against the earlier accepted source', async () => {
    const root = await reviewTarget(cleanups);
    const release = gate();
    const audit = mappedAudit(({ context, check }) => context.attemptId === 'ga-0003' && check.kind === 'tests'
      ? { outcome: { kind: 'completed', exitCode: 1 }, stdout: 'scripted later failure' } : {});
    const run = await reviewRun(root, cleanups, {
      detached: true, configuredAudit: audit, engineer: engineers(),
      reviewers: { 'rq-0001': clean(store), 'rq-0002': [{ kind: 'await', until: () => release.opened }, ...clean(limit)] },
    });
    cleanups.push(() => run.service.close());
    await until(async () => (await runEventsOnDisk(root, plan, run.runId)).some(event =>
      event.type === 'gate-attempted' && event.data.gate === 'ga-0003'), 5_000);
    const during = await runEventsOnDisk(root, plan, run.runId);
    expect(eventsOf(during, 'iteration-candidate-prepared').find(event => event.data.gate === 'ga-0003')?.data)
      .toMatchObject({ candidate: 'revision-02', base: 'revision-01', tree: 'tree-02' });
    expect(eventsOf(during, 'gate-attempted').find(event => event.data.gate === 'ga-0003')?.data.verdict).toBe('failed');
    expect(during.some(event => event.type === 'review-request-recorded' && event.data.candidate === 'revision-02')).toBe(true);
    expect(during.some(event => event.type === 'iteration-closed' && event.data.iteration === 'wi-001.i02')).toBe(false);
    release.open();
    await run.service.settled(plan, run.runId);
    const events = await runEventsOnDisk(root, plan, run.runId);
    const reviewed = eventsOf(events, 'review-attempt-finished').find(event => event.data.request === 'rq-0002')!;
    const nextEngineer = events.find(event => event.type === 'invocation-started' && event.data.role === 'engineer'
      && event.sequence > events.find(entry => entry.type === 'gate-attempted' && entry.data.gate === 'ga-0003')!.sequence);
    expect(reviewed.data.result).toBe('complete');
    expect(nextEngineer).toBeDefined();
    expect(reviewed.sequence).toBeLessThan(nextEngineer!.sequence);
  }, 60_000);

  test('a passing audit warning reaches reconciliation after a clean candidate review', async () => {
    const root = await reviewTarget(cleanups);
    const passing = passingAudit();
    const warningAudit: ConfiguredAuditPort = { read: passing.read, async run(input) {
      const result = await passing.run(input);
      if (input.attemptId !== 'ga-0002') return result;
      const provider = result.provider as { summary: Record<string, unknown> };
      const entry = { checkId: 'tests', command: 'vitest', runner: 'vitest', project: 'node',
        path: `${notesDirectory}/src/tests/notes.test.ts`, kind: 'test', testId: 'the note limit' };
      return { ...result, provider: { ...provider, summary: { ...provider.summary,
        warningDispositions: [{ entry, basis: 'retained-instability' }], flakinessPolicy: { onFailure: 'warning' },
      } } };
    } };
    const run = await reviewRun(root, cleanups, {
      configuredAudit: warningAudit, engineer: engineers(),
      reviewers: { 'rq-0001': clean(store), 'rq-0002': clean(limit), 'rq-0003': clean(store) },
      reconcilers: { 'wi-001.rc01': reconcile({ ...submission([
        disposition('cf-0001', { action: 'waive', uncertainty: 'Existing test instability remains in the audit evidence.' }),
      ], { kind: 'complete' }), testOrigins: [{ checkFinding: 'cf-0001', origin: 'added',
        basis: 'A mistaken origin claim.' }] }, { ...submission([
        disposition('cf-0001', { action: 'waive', uncertainty: 'Existing test instability remains in the audit evidence.' }),
      ], { kind: 'complete' }), testOrigins: [{ checkFinding: 'cf-0001', origin: 'existing',
        basis: 'The exact test is present in the original execution baseline.' }] }) },
    });
    expect(onlyRun(run.service, plan).state, JSON.stringify(eventsOf(run.events, 'job-failed'))).toBe('completed');
    const finding = run.service.checkFindings(plan, run.runId, { kind: 'detail', checkFinding: 'cf-0001' });
    expect(finding?.ok && finding.view.kind === 'detail' ? finding.view.reports.items[0] : null)
      .toMatchObject({ observation: { kind: 'audit-instability', summary: expect.stringContaining('the note limit') }, source: { kind: 'tree', id: 'tree-01' } });
    expect(eventsOf(run.events, 'reconciliation-assessed')).toHaveLength(1);
    const prompt = run.agent!.sessions.find(session => session.spec.submission.name === 'submit_reconciliation')!.spec.prompt;
    expect(prompt).toContain('Original execution baseline for test origin:');
    expect(prompt).toContain(runLayout.gate('ga-0002'));
    expect(run.agent!.sessions.find(session => session.spec.submission.name === 'submit_reconciliation')!.verdicts)
      .toMatchObject([{ accepted: false }, { accepted: true }]);
    run.git.assertComplete();
  }, 60_000);

  test('a final-only warning receives an existing-test origin judgment before completion', async () => {
    const root = await reviewTarget(cleanups);
    const passing = passingAudit();
    const warningAudit: ConfiguredAuditPort = { read: passing.read, async run(input) {
      const result = await passing.run(input);
      if (input.attemptId !== 'ga-0006') return result;
      const provider = result.provider as { summary: Record<string, unknown> };
      return { ...result, provider: { ...provider, summary: { ...provider.summary,
        warningDispositions: [{ entry: { checkId: 'tests', command: 'vitest', runner: 'vitest', project: 'node',
          path: `${notesDirectory}/src/tests/notes.test.ts`, kind: 'test', testId: 'the note limit' }, basis: 'retained-instability' }],
        flakinessPolicy: { onFailure: 'warning' },
      } } };
    } };
    const run = await reviewRun(root, cleanups, { configuredAudit: warningAudit, engineer: engineers(), previewCount: 5,
      reviewers: { 'rq-0001': clean(store), 'rq-0002': clean(limit), 'rq-0003': clean(store) },
      reconcilers: { 'final-instability-ga-0006': reconcile({ ...submission([
        disposition('cf-0001', { action: 'waive', uncertainty: 'The original test remains unstable in the retained audit.' }),
      ], { kind: 'complete' }), testOrigins: [{ checkFinding: 'cf-0001', origin: 'existing',
        basis: 'The exact test is present in the original execution baseline.' }] }) },
    });
    expect(onlyRun(run.service, plan).state, JSON.stringify(eventsOf(run.events, 'job-failed'))).toBe('completed');
    expect(eventsOf(run.events, 'final-instability-reconciled')).toMatchObject([
      { data: { gate: 'ga-0006', candidate: 'cand-001', next: 'complete' } },
    ]);
    expect(eventsOf(run.events, 'final-correction-planned')).toHaveLength(0);
    const prompt = run.agent!.sessions.find(session => session.spec.prompt.includes('# Reconciliation final-instability-'))!.spec.prompt;
    expect(prompt).toContain('Original execution baseline for test origin:');
    expect(prompt).toContain(runLayout.gate('ga-0006'));
    run.git.assertComplete();
  }, 60_000);

  test('a final-only added-test warning cannot be waived and plans reliable coverage repair', async () => {
    const root = await reviewTarget(cleanups);
    const passing = passingAudit();
    const warningAudit: ConfiguredAuditPort = { read: passing.read, async run(input) {
      const result = await passing.run(input);
      if (input.attemptId !== 'ga-0006') return result;
      const provider = result.provider as { summary: Record<string, unknown> };
      return { ...result, provider: { ...provider, summary: { ...provider.summary,
        warningDispositions: [{ entry: { checkId: 'tests', command: 'vitest', runner: 'vitest', project: 'node',
          path: `${notesDirectory}/src/tests/notes.test.ts`, kind: 'test', testId: 'the note limit' }, basis: 'retained-instability' }],
        flakinessPolicy: { onFailure: 'warning' },
      } } };
    } };
    const planned = gate();
    const run = await reviewRun(root, cleanups, { detached: true, configuredAudit: warningAudit, engineer: engineers(),
      reviewers: { 'rq-0001': clean(store), 'rq-0002': clean(limit), 'rq-0003': clean(store) },
      reconcilers: { 'final-instability-ga-0006': reconcile(
        { ...submission([disposition('cf-0001', { action: 'waive', uncertainty: 'The warning is tolerable.' })], { kind: 'complete' }),
          testOrigins: [{ checkFinding: 'cf-0001', origin: 'added', basis: 'This test was introduced by the plan.' }] },
        { ...submission([disposition('cf-0001', { action: 'repair' })],
          { kind: 'correct', goal: 'Replace the unstable added test with reliable coverage of the same behavior.' }),
          testOrigins: [{ checkFinding: 'cf-0001', origin: 'added', basis: 'This test was introduced by the plan.' }] }) },
      globalFork: [submit({ module: notes, goal: 'Repair the added test while preserving its assertions.',
        rationale: 'The final audit retained provider instability for a plan-added test.' })],
      afterWrite: async (write, runId) => {
        if (write === 'work-item-started' && (await runEventsOnDisk(root, plan, runId)).some(event => event.type === 'final-correction-planned')) {
          planned.open(); return freeze();
        }
      },
    });
    await planned.opened;
    const events = await runEventsOnDisk(root, plan, run.runId);
    expect(eventsOf(events, 'final-instability-reconciled')).toMatchObject([{ data: { next: 'correct', gate: 'ga-0006' } }]);
    expect(eventsOf(events, 'final-correction-planned')).toHaveLength(1);
    expect(eventsOf(events, 'job-completed')).toHaveLength(0);
    expect(run.agent!.sessions.find(session => session.spec.prompt.includes('# Reconciliation final-instability-'))!.verdicts)
      .toMatchObject([{ accepted: false }, { accepted: true }]);
    await staleCrashLock(root);
  }, 60_000);

  test('a final-only warning with unknown origin stays unresolved', async () => {
    const root = await reviewTarget(cleanups);
    const passing = passingAudit();
    const warningAudit: ConfiguredAuditPort = { read: passing.read, async run(input) {
      const result = await passing.run(input);
      if (input.attemptId !== 'ga-0006') return result;
      const provider = result.provider as { summary: Record<string, unknown> };
      return { ...result, provider: { ...provider, summary: { ...provider.summary,
        warningDispositions: [{ entry: { checkId: 'tests', command: 'vitest', runner: 'vitest', project: 'node',
          path: `${notesDirectory}/src/tests/notes.test.ts`, kind: 'test', testId: 'the note limit' }, basis: 'retained-instability' }],
        flakinessPolicy: { onFailure: 'warning' },
      } } };
    } };
    const run = await reviewRun(root, cleanups, { configuredAudit: warningAudit, engineer: engineers(), previewCount: 4,
      reviewers: { 'rq-0001': clean(store), 'rq-0002': clean(limit), 'rq-0003': clean(store) },
      reconcilers: { 'final-instability-ga-0006': reconcile({ ...submission([
        disposition('cf-0001', { action: 'leave' }),
      ], { kind: 'unresolved' }), testOrigins: [{ checkFinding: 'cf-0001', origin: 'unknown',
        basis: 'The available original source does not establish this individual test’s origin.' }] }) },
    });
    expect(onlyRun(run.service, plan).state).toBe('failed');
    expect(eventsOf(run.events, 'final-instability-reconciled')).toMatchObject([{ data: { next: 'unresolved', checkFindings: [] } }]);
    expect(eventsOf(run.events, 'job-completed')).toHaveLength(0);
    expect(eventsOf(run.events, 'final-correction-planned')).toHaveLength(0);
    run.git.assertComplete();
  }, 60_000);

  test('the first candidate starts review while its own audit is still running', async () => {
    const root = await reviewTarget(cleanups);
    const auditing = gate(); const release = gate();
    const passing = passingAudit();
    const slowAudit: ConfiguredAuditPort = { read: passing.read, async run(input) {
      if (input.attemptId === 'ga-0002') { auditing.open(); await release.opened; }
      return passing.run(input);
    } };
    const run = await reviewRun(root, cleanups, {
      detached: true, configuredAudit: slowAudit, engineer: engineers(),
      reviewers: { 'rq-0001': clean(store), 'rq-0002': clean(limit), 'rq-0003': clean(store) },
    });
    cleanups.push(() => run.service.close());
    await auditing.opened;
    await until(async () => (await runEventsOnDisk(root, plan, run.runId)).some(event =>
      event.type === 'review-attempt-finished' && event.data.request === 'rq-0001'), 5_000);
    const during = await runEventsOnDisk(root, plan, run.runId);
    const prepared = during.find(event => event.type === 'iteration-candidate-prepared' && event.data.gate === 'ga-0002')!;
    const requested = during.find(event => event.type === 'review-request-recorded' && event.data.request === 'rq-0001')!;
    const reviewed = during.find(event => event.type === 'review-attempt-finished' && event.data.request === 'rq-0001')!;
    expect(prepared.data).toMatchObject({ candidate: 'revision-01', base: 'scenarios-00', tree: 'tree-01' });
    expect(prepared.sequence).toBeLessThan(requested.sequence);
    expect(requested.sequence).toBeLessThan(reviewed.sequence);
    expect(during.some(event => event.type === 'gate-attempted' && event.data.gate === 'ga-0002')).toBe(false);
    release.open();
    await run.service.settled(plan, run.runId);
    const events = await runEventsOnDisk(root, plan, run.runId);
    expect(events.find(event => event.type === 'gate-attempted' && event.data.gate === 'ga-0002')!.sequence).toBeGreaterThan(reviewed.sequence);
    expect(onlyRun(run.service, plan).state).toBe('completed');
    run.git.assertComplete();
  }, 60_000);

  test('restart reuses a reviewed committed candidate whose audit was unfinished', async () => {
    const root = await reviewTarget(cleanups);
    const auditing = gate(); const release = gate();
    const passing = passingAudit();
    const heldAudit: ConfiguredAuditPort = { read: passing.read, async run(input) {
      if (input.attemptId === 'ga-0002') { auditing.open(); await release.opened; }
      return passing.run(input);
    } };
    const run = await reviewRun(root, cleanups, {
      detached: true, configuredAudit: heldAudit, engineer: engineers(),
      reviewers: { 'rq-0001': clean(store) },
    });
    cleanups.push(() => run.service.close());
    await auditing.opened;
    await until(async () => (await runEventsOnDisk(root, plan, run.runId)).some(event =>
      event.type === 'review-attempt-finished' && event.data.request === 'rq-0001'), 5_000);
    const before = await runEventsOnDisk(root, plan, run.runId);
    expect(before.some(event => event.type === 'iteration-candidate-prepared' && event.data.gate === 'ga-0002')).toBe(true);
    expect(before.some(event => event.type === 'gate-attempted' && event.data.gate === 'ga-0002')).toBe(false);
    expect(before.some(event => event.type === 'iteration-closed' && event.data.iteration === 'wi-001.i01')).toBe(false);

    await staleCrashLock(root);
    const recoveredGit = mockGit({
      currentHead: async () => 'revision-01',
      changedPaths: async () => [],
      findCommitByTrailers: async () => 'revision-01',
      previewCandidateTree: async () => ({ repositoryRoot: root, head: 'revision-01', tree: 'tree-01' }),
    });
    const failedAudit = mappedAudit(({ context, check }) => context.attemptId === 'ga-0002' && check.kind === 'tests'
      ? { outcome: { kind: 'completed', exitCode: 1 }, stdout: 'scripted recovered failure' } : {});
    const restarted = await openRuns(root, {
      git: recoveredGit, candidates: scriptedCandidates(root, candidates()), configuredAudit: failedAudit,
      policy: projectRoot => testPolicy(projectRoot, { reviews: testReviewPolicy() }),
    });
    cleanups.push(() => restarted.service.close());
    release.open();
    await until(async () => (await runEventsOnDisk(root, plan, run.runId)).some(event =>
      event.type === 'gate-attempted' && event.data.gate === 'ga-0002'), 5_000);
    const after = await runEventsOnDisk(root, plan, run.runId);
    expect(eventsOf(after, 'iteration-candidate-prepared')).toEqual(eventsOf(before, 'iteration-candidate-prepared'));
    expect(after.filter(event => event.type === 'review-request-recorded' && event.data.candidate === 'revision-01')).toEqual(
      before.filter(event => event.type === 'review-request-recorded' && event.data.candidate === 'revision-01'));
    expect(after.filter(event => event.type === 'review-attempt-finished' && event.data.request === 'rq-0001')).toEqual(
      before.filter(event => event.type === 'review-attempt-finished' && event.data.request === 'rq-0001'));
    expect(eventsOf(after, 'gate-attempted').find(event => event.data.gate === 'ga-0002')?.data.verdict).toBe('failed');
    expect(after.some(event => event.type === 'iteration-closed' && event.data.iteration === 'wi-001.i01')).toBe(false);
    expect(after.filter(event => event.type === 'check-findings-recorded')).toHaveLength(0);
    expect(recoveredGit.findCommitByTrailers).toHaveBeenCalledTimes(1);
    expect(recoveredGit.commitAccepted).not.toHaveBeenCalled();
    await restarted.service.close();
    cleanups.pop();
    const again = await openRuns(root, {
      git: mockGit({ currentHead: async () => 'revision-01', changedPaths: async () => [] }),
      candidates: scriptedCandidates(root, candidates()), configuredAudit: failedAudit,
      policy: projectRoot => testPolicy(projectRoot, { reviews: testReviewPolicy() }),
    });
    cleanups.push(() => again.service.close());
    const twice = await runEventsOnDisk(root, plan, run.runId);
    expect(eventsOf(twice, 'iteration-candidate-prepared')).toEqual(eventsOf(after, 'iteration-candidate-prepared'));
    expect(eventsOf(twice, 'review-request-recorded')).toEqual(eventsOf(after, 'review-request-recorded'));
    expect(eventsOf(twice, 'gate-attempted')).toEqual(eventsOf(after, 'gate-attempted'));
    expect(eventsOf(twice, 'check-findings-recorded')).toEqual(eventsOf(after, 'check-findings-recorded'));
  }, 60_000);

  test.each(['iteration-candidate-prepared', 'gate-attempted'] as const)('restart after %s waits for a failed candidate review before repairing it', async freezeAt => {
    const root = await reviewTarget(cleanups);
    const crashed = gate(); const newReader = gate();
    let frozen = false;
    const audit = mappedAudit(({ context, check }) => context.attemptId === 'ga-0002' && check.kind === 'tests'
      ? { outcome: { kind: 'completed', exitCode: 1 }, stdout: 'scripted failure' } : {});
    const run = await reviewRun(root, cleanups, {
      detached: true, configuredAudit: audit, engineer: engineers(),
      reviewers: { 'rq-0001': [never()] },
      afterWrite: async (write, runId) => {
        if (frozen) return freeze();
        if (freezeAt === 'iteration-candidate-prepared') {
          if (write !== 'gate-committing' || !(await runEventsOnDisk(root, plan, runId)).some(event => event.type === 'iteration-candidate-prepared')) return;
        } else if (write !== freezeAt) return;
        frozen = true;
        crashed.open();
        return freeze();
      },
    });
    await crashed.opened;
    const before = await runEventsOnDisk(root, plan, run.runId);
    if (freezeAt === 'iteration-candidate-prepared') {
      expect(eventsOf(before, 'review-request-recorded')).toHaveLength(0);
      expect(eventsOf(before, 'gate-attempted').find(event => event.data.gate === 'ga-0002')).toBeUndefined();
    }
    expect(before.some(event => event.type === 'review-attempt-finished' && event.data.request === 'rq-0001')).toBe(false);
    await staleCrashLock(root);
    const recoveredGit = freezeAt === 'iteration-candidate-prepared' ? mockGit({
      currentHead: async () => 'revision-01', changedPaths: async () => [],
      findCommitByTrailers: async () => 'revision-01',
      previewCandidateTree: async () => ({ repositoryRoot: root, head: 'revision-01', tree: 'tree-01' }),
    }) : run.git.git;
    const restarted = await openRuns(root, {
      inputs: treeInputs(),
      script: spec => spec.role === 'reviewer' ? [{ kind: 'await', until: () => newReader.opened }, ...clean(store)]
        : spec.role === 'engineer' ? [never()] : [],
      git: recoveredGit, candidates: scriptedCandidates(root, candidates()), configuredAudit: audit,
      policy: projectRoot => testPolicy(projectRoot, { reviews: testReviewPolicy() }),
    });
    cleanups.push(() => restarted.service.close());
    await until(async () => (await runEventsOnDisk(root, plan, run.runId)).some(event =>
      event.type === 'gate-attempted' && event.data.gate === 'ga-0002'), 5_000);
    const held = await runEventsOnDisk(root, plan, run.runId);
    const failed = held.find(event => event.type === 'gate-attempted' && event.data.gate === 'ga-0002')!;
    expect(held.some(event => event.type === 'invocation-started' && event.data.role === 'engineer'
      && event.sequence > failed.sequence)).toBe(false);
    newReader.open();
    await until(async () => (await runEventsOnDisk(root, plan, run.runId)).some(event =>
      event.type === 'invocation-started' && event.data.role === 'engineer' && event.sequence > failed.sequence), 5_000);
    const after = await runEventsOnDisk(root, plan, run.runId);
    const reviewed = eventsOf(after, 'review-attempt-finished').find(event => event.data.request === 'rq-0001' && event.data.settles)!;
    const repair = after.find(event => event.type === 'invocation-started' && event.data.role === 'engineer'
      && event.sequence > failed.sequence)!;
    expect(reviewed.sequence).toBeLessThan(repair.sequence);
    await until(() => restarted.agent!.sessions.some(session => session.spec.role === 'engineer'), 5_000);
    const handback = restarted.agent!.sessions.find(session => session.spec.role === 'engineer')!.spec.prompt;
    expect(handback).toContain('review of candidate revision-01: complete');
    expect(eventsOf(after, 'review-request-recorded').filter(event => event.data.candidate === 'revision-01')).toHaveLength(1);
  }, 60_000);

  test('a reader\'s result is committed while the next iteration\'s audit is still running', async () => {
    const root = await reviewTarget(cleanups);
    const auditing = gate();
    const release = gate();
    const passing = passingAudit();
    const slowAudit: ConfiguredAuditPort = {
      read: passing.read,
      async run(input) {
        // The second iteration's gate audits slowly, as a real audit does.
        if (input.attemptId === 'ga-0003') {
          auditing.open();
          await release.opened;
        }
        return passing.run(input);
      },
    };
    const run = await reviewRun(root, cleanups, {
      detached: true,
      configuredAudit: slowAudit,
      engineer: engineers(),
      reviewers: {
        'rq-0001': [{ kind: 'await', until: () => auditing.opened }, ...clean(store)],
        'rq-0002': clean(limit),
        'rq-0003': clean(store),
      },
    });
    cleanups.push(() => run.service.close());
    await auditing.opened;
    await until(async () => (await runEventsOnDisk(root, plan, run.runId)).some(event => event.type === 'review-attempt-finished'), 5_000);
    const during = await runEventsOnDisk(root, plan, run.runId);
    // The audit is still held open: its attempt is not committed yet.
    expect(during.some(event => event.type === 'gate-committing' && event.data.gate === 'ga-0003')).toBe(true);
    expect(during.some(event => event.type === 'gate-attempted' && event.data.gate === 'ga-0003')).toBe(false);
    release.open();
    await run.service.settled(plan, run.runId);
    const events = await runEventsOnDisk(root, plan, run.runId);
    expect(onlyRun(run.service, plan).state).toBe('completed');
    const committing = events.find(event => event.type === 'gate-committing' && event.data.gate === 'ga-0003')!;
    const attempted = events.find(event => event.type === 'gate-attempted' && event.data.gate === 'ga-0003')!;
    const finished = events.find(event => event.type === 'review-attempt-finished' && event.data.attempt === 'rq-0001.a01')!;
    expect(committing.sequence).toBeLessThan(finished.sequence);
    expect(finished.sequence).toBeLessThan(attempted.sequence);
    // The gate's verdict and its record are what they were: a passing attempt.
    expect(attempted.data).toMatchObject({ verdict: 'passed', next: 'accept' });
    expect(JSON.parse(await readFile(runPath(root, plan, run.runId, runLayout.gate('ga-0003')), 'utf8'))).toMatchObject({ verdict: 'passed', audited: 'revision-02' });
    run.git.assertComplete();
  }, 60_000);
});
