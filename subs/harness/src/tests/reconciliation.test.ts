import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { ScriptedAgent, ScriptStep } from '../../subs/agent/src/scripted.js';
import type { CheckFindingSummary } from '../../subs/check-findings/src/interfaces/check-findings.js';
import { CommandRejection } from '../jobs/commands.js';

import { runLayout } from '../../subs/autonomous/src/run/records.js';
import { reduceSessions } from '../../subs/autonomous/src/run/sessions.js';
import { iterationLayout } from '../../subs/autonomous/subs/work-coordination/src/work/iterations.js';
import { reconciliationLayout, type ReconciliationAssessment, type ReconciliationBasis } from '../../subs/autonomous/subs/acceptance/src/reviews/reconciliation.js';
import { snapshotToolNames } from '../../subs/reviews/src/snapshot.js';
import { requestCompletion } from './helpers/analysis.js';
import { scriptedCandidates, testReviewPolicy, type ScriptedCommit } from '../../subs/autonomous/subs/acceptance/src/tests/helpers/candidates.js';
import { expectNoProcesses, forgetExternalTools } from './helpers/external-tools.js';
import { assign, completionProposed, outline, submit, treeInputs, write } from './helpers/iterations.js';
import { concern as boundConcern, decision, dispose, report } from './helpers/check-findings.js';
import { gateGit } from '../../subs/autonomous/subs/acceptance/src/tests/helpers/gate-git.js';
import { interceptOperations, candidates, reviewEventsOf as eventsOf, finalReviewTree, gate, limit, notes, notesDirectory, plan, revisionGates, reviewRun, reviewTarget, store, tool, reviewUnchangedCommit as unchanged } from '../../subs/autonomous/subs/acceptance/src/tests/helpers/reviews.js';
import { onlyRun, openRuns, runEventsOnDisk, runPath, staleCrashLock, testPolicy, until } from './helpers/runs.js';

vi.mock('node:child_process', async original =>
  (await import('./helpers/process-guard.js')).guardedChildProcess(await original<typeof import('node:child_process')>()));

/*
 * Work-item reconciliation (Plan 12 iteration 5): at a completion request
 * the work item's reviews settle, and the CheckFindings they raised are
 * assessed by one fork of the module architect, at the point after that
 * request, in one submission. The assessment is committed before its brief
 * is appended to the architect's own session; a correction goes through the
 * ordinary iteration, gate and review; later rounds retain correction access; and
 * a completion is validated against the basis once more before it commits.
 *
 * The agent is the scripted fake, Git's answers for the gates and the
 * candidates are scripted, and no process is started.
 */

const cleanups: Array<() => Promise<void>> = [];
let concernSequence = 0;
beforeEach(() => { concernSequence = 0; });
afterEach(async () => {
  try {
    for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
    expectNoProcesses();
  } finally { concernSequence = 0; forgetExternalTools(); }
});

const index = `${notesDirectory}/src/index.ts`;
const correctedTree = 'd'.repeat(40);

/** The three engineers, and a fourth for a correction. */
const engineers: ReadonlyArray<readonly ScriptStep[]> = [
  submit(completionProposed('Added the note store.'), write(store, 'export const store = new Map(); // v1\n')),
  submit(completionProposed('Stated the note limit.'), write(limit, 'export const limit = (text: string) => text.length <= 50;\n')),
  submit(completionProposed('Exported the store.'), write(store, 'export const store = new Map(); // v3\n'), write(index, 'export * from \'./store.js\';\n')),
  submit(completionProposed('Corrected the limit.'), write(limit, 'export const limit = (text: string) => text.length <= 500;\n')),
];

type Risk = 'high' | 'medium' | 'low';
/** One concern about a path of the candidate. */
const concern = (path: string, summary: string, risk: Risk) => ({
  findingKey: `draft:finding:case-${String(++concernSequence).padStart(4, '0')}`,
  summary, consequence: `${summary}, so the behavior differs from the goal`, rationale: 'read the candidate diff', uncertainty: 'moderate',
  remedy: 'a bounded change in the named file', locations: [{ path, startLine: 1, endLine: 1 }], suggests: null, risk, ground: null,
});
/** A reviewer that reads each changed path's patch and submits these concerns. */
const review = (paths: readonly string[], concerns: readonly ReturnType<typeof concern>[] = []): ScriptStep[] => [
  ...paths.map(path => tool(snapshotToolNames.diff, { path })),
  { kind: 'submit', input: { inspected: [...paths], missing: [], concerns: [...concerns] } },
];
const changed = { 1: [store], 2: [limit], 3: [store, index], 4: [limit] } as const;

/** One disposition of a reconciliation submission. */
const disposition = (checkFinding: string, action: Record<string, unknown>, extra: Record<string, unknown> = {}) => ({
  checkFinding, rationale: `The assessment of ${checkFinding} against the current source.`, communication: { mode: 'quiet' }, action, ...extra,
});
const submission = (dispositions: readonly unknown[], next: Record<string, unknown>, relations: readonly unknown[] = []) => ({
  relations: [...relations], dispositions: [...dispositions], next, brief: 'The concerns were assessed together.',
});
const reconcile = (...inputs: unknown[]): ScriptStep[] => inputs.map(input => ({ kind: 'submit', input }) as ScriptStep);

/** The candidates, with a fourth that corrects the limit. */
function correctedCandidates(): Record<string, ScriptedCommit> {
  const scripted = candidates();
  return {
    ...scripted,
    'revision-04': {
      tree: correctedTree, base: 'revision-03', changes: [{ status: 'M', path: limit }],
      files: { ...scripted['revision-03']!.files, [limit]: 'export export const limit = (text: string) => text.length <= 500;\n' },
    },
  };
}
const correctionGates = [...revisionGates, { commit: 'revision-04', changes: [{ status: 'M', path: limit }] }, unchanged, unchanged];

/** The three assignments, the completion request, a correction and a second completion request. */
const architect = (correction = true, reviewReason: string | null = 'Inspect the substantial new behavior introduced by this correction.'): ReadonlyArray<readonly ScriptStep[]> => [
  submit(assign(notes, { goal: 'Add the note store.' }, outline())),
  submit(assign(notes, { goal: 'State the note limit.' })),
  submit(assign(notes, { goal: 'Export the store.' })),
  submit(requestCompletion()),
  ...(correction ? [submit(assign(notes, { goal: 'Correct the note limit to 500 characters.', kind: 'repair', ...(reviewReason === null ? {} : { reviewReason }) })), submit(requestCompletion())] : []),
];

function listOf(service: Awaited<ReturnType<typeof reviewRun>>['service'], runId: string): CheckFindingSummary[] {
  const list = service.checkFindings(plan, runId, { kind: 'list', owner: null, select: 'all', limit: 100 });
  if (list === undefined || !list.ok || list.view.kind !== 'list') throw new Error('no list');
  return [...list.view.items];
}

async function committed<T>(root: string, runId: string, path: string): Promise<T> {
  return JSON.parse(await readFile(runPath(root, plan, runId, path), 'utf8')) as T;
}

/**
 * A person's answer to a pending decision, sent at the run's version and
 * sent again at the version each refusal names. The run may still append
 * after the decision becomes visible (the brief's completion, a lost
 * session's end), and each append moves the version; the CheckFinding's
 * revision is what guards the decision itself.
 */
async function answerAtCurrentVersion(
  service: Awaited<ReturnType<typeof reviewRun>>['service'],
  runId: string,
  payload: { readonly checkFinding: string; readonly expectedRevision: number; readonly request: string; readonly option: string },
) {
  let expectedVersion = service.getRun(plan, runId)!.version;
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await service.execute({
        commandId: `answer-${payload.checkFinding}-${expectedVersion}`, expectedVersion, type: 'respond-to-check-finding',
        payload: { planId: plan, jobId: runId, responder: 'reviewer', ...payload },
      });
    } catch (error) {
      if (!(error instanceof CommandRejection) || error.code !== 'stale-version' || error.currentVersion === undefined || attempt >= 10) throw error;
      expectedVersion = error.currentVersion;
    }
  }
}

const reconcilerSessions = (agent: ScriptedAgent) => agent.sessions.filter(session => session.spec.submission.name === 'submit_reconciliation');

describe('CF08: nothing to assess', () => {
  test('clean reviews take the work item to its gate with no reconciliation and no assessment call', async () => {
    const root = await reviewTarget(cleanups);
    const run = await reviewRun(root, cleanups, {
      engineer: engineers.slice(0, 3),
      reviewers: { 'rq-0001': review(changed[1]), 'rq-0002': review(changed[2]), 'rq-0003': review(changed[3]) },
    });
    expect(onlyRun(run.service, plan).state).toBe('completed');
    const types = run.events.map(event => event.type);
    expect(types.filter(type => type.startsWith('reconciliation-'))).toEqual([]);
    expect(reconcilerSessions(run.agent!)).toEqual([]);
    // Every request settled before the gate; the gate followed the completion request.
    const completion = run.events.findIndex(event => event.type === 'outline-revised' && event.data.architectRef !== undefined);
    const gateAt = run.events.findIndex((event, position) => position > completion && event.type === 'gate-attempted');
    expect(eventsOf(run.events.slice(0, gateAt), 'review-attempt-finished')).toHaveLength(3);
    expect(eventsOf(run.events, 'work-item-completed')[0]!.data).toEqual({ workItem: 'work-item:review-notes', gate: expect.any(String) });
  }, 60_000);
});

describe('CF02, CF03 and CF12: one routine assessment', () => {
  test('parallel reports of one behavior are linked, same-file concerns stay distinct, a judgment is superseded, a later repair is fixed and a weak tension is waived as a material choice', async () => {
    const root = await reviewTarget(cleanups);
    const run = await reviewRun(root, cleanups, {
      policy: { concurrency: 1 },
      engineer: engineers.slice(0, 3),
      reviewers: {
        // finding:case-0001 and finding:case-0002: two distinct concerns about one file.
        'rq-0001': review(changed[1], [concern(store, 'The store is exported twice', 'high'), concern(store, 'The store could be a plain object', 'low')]),
        // finding:case-0003: a judgment the architect finds wrong.
        'rq-0002': review(changed[2], [concern(limit, 'The limit should count bytes', 'medium')]),
        // finding:case-0004: the same behavior as finding:case-0001, reported by another reader of a later candidate.
        'rq-0003': review(changed[3], [concern(store, 'The store has a doubled export keyword', 'high')]),
      },
      reconcilers: {
        'work-item:review-notes.rc01': reconcile(submission([
          disposition('finding:case-0001', { action: 'fixed', reassessed: ['cfr-0001'] }),
          disposition('finding:case-0004', { action: 'fixed', reassessed: ['cfr-0004'] }),
          disposition('finding:case-0002', { action: 'waive', uncertainty: 'A plain object would serve as well.' }, {
            communication: { mode: 'report', choice: 'The store stays a Map.', uncertainty: 'A plain object would serve as well.', reason: 'It departs from the reviewer\'s suggestion.' },
          }),
          disposition('finding:case-0003', { action: 'supersede', reassessed: ['cfr-0003'], replacement: 'The plan limits characters, not bytes.' }),
        ], { kind: 'complete' }, [
          { from: 'finding:case-0004', to: 'finding:case-0001', relation: 'same-issue', shared: 'The store module exports its store once.', evidence: [`${store}:1`], rationale: 'Both name the doubled export of the same declaration.' },
          { from: 'finding:case-0002', to: 'finding:case-0001', relation: 'related-but-distinct', shared: 'The store declaration.', evidence: [`${store}:1`], rationale: 'One is a defect, the other a simplification.' },
        ])),
      },
    });
    const { service, runId, events, agent } = run;
    expect(onlyRun(service, plan).state).toBe('completed');

    // One round, one fork at the architect's point after its completion request.
    const completion = eventsOf(events, 'outline-revised').find(event => event.data.architectRef !== undefined)!;
    expect(eventsOf(events, 'reconciliation-started').map(event => event.data)).toEqual([{ workItem: 'work-item:review-notes', reconciliation: 'work-item:review-notes.rc01', round: 1 }]);
    const basis = await committed<ReconciliationBasis>(root, runId, reconciliationLayout.basis('work-item:review-notes.rc01'));
    expect(basis).toMatchObject({
      round: 1, floor: 'any', source: { commit: 'revision-03', tree: finalReviewTree }, due: [],
      forkPoint: { kind: 'session', session: completion.data.architectRef!.session, ref: completion.data.architectRef!.ref },
      requests: [
        { request: 'rq-0001', attempt: 'rq-0001.a01', result: 'complete' },
        { request: 'rq-0002', attempt: 'rq-0002.a01', result: 'complete' },
        { request: 'rq-0003', attempt: 'rq-0003.a01', result: 'complete' },
      ],
    });
    // The attention set is in attention order: by risk, then credibility, then the most recent report.
    expect(basis.checkFindings.map(entry => entry.checkFinding)).toEqual(['finding:case-0004', 'finding:case-0001', 'finding:case-0003', 'finding:case-0002']);
    const [fork] = reconcilerSessions(agent!);
    expect(fork!.spec.session).toEqual({ mode: 'fork', from: JSON.stringify(JSON.parse(completion.data.architectRef!.ref).point) });
    expect(fork!.start).toEqual({ mode: 'fork' });
    expect(fork!.spec.submission.name).toBe('submit_reconciliation');
    expect(fork!.spec.prompt).toContain('A correction may be planned for any signal.');
    expect(fork!.spec.prompt).toContain('Risk: high; credibility: ungrounded');
    // The fork keeps the architect's working directory, the module's `src/`: its task environment names it.
    const parentTurn = agent!.sessions.find(session => session.spec.role === 'local-architect' && session.spec.submission.name !== 'submit_reconciliation')!;
    const moduleSource = join(root, notesDirectory, 'src');
    expect(parentTurn.spec.scope.workingDirectory).toBe(moduleSource);
    expect(fork!.spec.scope.workingDirectory).toBe(moduleSource);
    expect([...fork!.inherited, fork!.spec.prompt].join('\n')).toContain(
      `# Block environment:workingDirectory\n{\n  "workingDirectory": ${JSON.stringify(moduleSource)}\n}`);
    // Support paths name the harness's own prompt files, which no project agent can open: none reaches the fork.
    expect(fork!.spec.prompt).not.toContain('subs/harness/src/prompts/reconciliation.procedure.md');
    expect(fork!.spec.prompt).not.toContain('.schema.json');
    expect(fork!.spec.prompt).not.toContain('orientation.procedure.md');
    const opened = eventsOf(events, 'session-opened').find(event => event.data.fork?.reason === 'reconciliation')!;
    expect(opened.data.fork).toEqual({ from: { session: completion.data.architectRef!.session, invocation: completion.data.invocation }, reason: 'reconciliation', briefs: [] });

    // The relations and dispositions, committed as one line.
    const assessed = eventsOf(events, 'reconciliation-assessed');
    expect(assessed).toHaveLength(1);
    expect(assessed[0]!.data).toMatchObject({ reconciliation: 'work-item:review-notes.rc01', next: 'complete' });
    expect(assessed[0]!.data.checkFindings.map(event => event.type)).toEqual([
      'check-finding-related', 'check-finding-related', 'check-finding-decided', 'check-finding-decided', 'check-finding-decided', 'check-finding-decided',
    ]);
    const summaries = new Map(listOf(service, runId).map(summary => [summary.id, summary]));
    expect(summaries.get('finding:case-0001')).toMatchObject({ standing: 'closed', reason: 'fixed-by-assessment', group: { canonical: 'finding:case-0001', members: ['finding:case-0001', 'finding:case-0004'] } });
    expect(summaries.get('finding:case-0004')).toMatchObject({ standing: 'closed', reason: 'fixed-by-assessment', group: { canonical: 'finding:case-0001', members: ['finding:case-0001', 'finding:case-0004'] } });
    // Same file, distinct concerns: not grouped.
    expect(summaries.get('finding:case-0002')).toMatchObject({ standing: 'closed', reason: 'waived', group: null, materialChoice: { choice: 'The store stays a Map.' } });
    // A judgment superseded with no code change.
    expect(summaries.get('finding:case-0003')).toMatchObject({ standing: 'closed', reason: 'superseded' });
    const detail = service.checkFindings(plan, runId, { kind: 'detail', checkFinding: 'finding:case-0001' });
    expect(detail).toMatchObject({ ok: true, view: { decisions: { items: [{
      actor: { kind: 'agent', role: 'local-architect', invocation: assessed[0]!.data.invocation },
      source: { kind: 'tree', id: finalReviewTree },
      evidence: [{ kind: 'reconciliation-submission', ref: runLayout.submission(assessed[0]!.data.invocation), hash: expect.stringMatching(/^sha256:/u) }],
    }] } } });
    const waiver = service.checkFindings(plan, runId, { kind: 'detail', checkFinding: 'finding:case-0002' });
    expect(waiver).toMatchObject({ ok: true, view: { decisions: { items: [{ decision: { action: 'waive', authority: { kind: 'work-item-assessment', ref: 'work-item:review-notes.rc01' }, acceptedRisk: 'low' } }] } } });

    // The brief was appended to the architect's own session after the commit.
    const appended = eventsOf(events, 'reconciliation-brief-appended');
    expect(appended.map(event => event.data)).toEqual([{ reconciliation: 'work-item:review-notes.rc01', session: completion.data.architectRef!.session, ref: expect.any(String), outcome: 'appended', reason: null }]);
    expect(events.indexOf(appended[0]!)).toBeGreaterThan(events.indexOf(assessed[0]!));
    const record = await committed<ReconciliationAssessment>(root, runId, reconciliationLayout.assessment('work-item:review-notes.rc01'));
    expect(record.brief).toContain('finding:case-0003: supersede');
    expect(record).toMatchObject({ requestedStart: 'fork', actualStart: 'fork', next: 'complete', relations: ['cfl-0001', 'cfl-0002'] });

    // No human, and the gate still ran after the assessment and alone completed the work item.
    const workGate = eventsOf(events, 'gate-attempted').find(event => event.data.checkpoint === 'work-item')!;
    expect(events.indexOf(workGate)).toBeGreaterThan(events.indexOf(appended[0]!));
    expect(eventsOf(events, 'work-item-completed')[0]!.data).toEqual({ workItem: 'work-item:review-notes', gate: workGate.data.gate });
  }, 60_000);
});

test('an unavailable review arriving after completion gets an architect continuation with no findings and replays once', async () => {
  const root = await reviewTarget(cleanups);
  const completion = gate();
  let frozen = false;
  let crashAppend = true;
  const run = await reviewRun(root, cleanups, {
    agentReady: agent => interceptOperations(agent, operations => ({ ...operations, async appendContext(input) {
      if (crashAppend && input.additions.some(item => item.key === 'brief:work-item:review-notes.rc01')) { frozen = true; return new Promise(() => undefined); }
      return operations.appendContext(input);
    } })),
    detached: true, policy: { retries: 0 }, architect: architect(false), engineer: engineers.slice(0, 3),
    reviewers: {
      'rq-0001': review(changed[1]), 'rq-0002': review(changed[2]),
      'rq-0003': [{ kind: 'await', until: () => completion.opened }, { kind: 'end', message: 'Advisory provider unavailable after completion request.' }],
    },
    reconcilers: { 'work-item:review-notes.rc01': [{ kind: 'submit', input: { relations: [], dispositions: [], next: { kind: 'complete' },
      brief: 'Continue using the passing configured checks and engineer evidence; retain the unavailable advisory result.' } }] },
    afterWrite: async (write, id) => {
      if (write === 'outline-revised' && (await runEventsOnDisk(root, plan, id)).some(event => event.type === 'outline-revised' && event.data.architectRef != null)) completion.open();
    },
  });
  await until(() => frozen, 30_000);
  const before = await runEventsOnDisk(root, plan, run.runId);
  const requested = eventsOf(before, 'outline-revised').find(event => event.data.architectRef != null)!;
  const unavailable = eventsOf(before, 'review-attempt-finished').find(event => event.data.request === 'rq-0003')!;
  const decision = eventsOf(before, 'reconciliation-assessed')[0]!;
  expect(requested.sequence).toBeLessThan(unavailable.sequence);
  expect(unavailable.sequence).toBeLessThan(decision.sequence);
  expect(unavailable.data).toMatchObject({ result: 'not-verified', reason: 'invalid-output' });
  expect(listOf(run.service, run.runId)).toEqual([]);
  expect(before.some(event => event.type === 'work-item-completed')).toBe(false);
  const record = await committed<ReconciliationAssessment>(root, run.runId, reconciliationLayout.assessment('work-item:review-notes.rc01'));
  expect(record.submission).toMatchObject({ dispositions: [], next: { kind: 'complete' }, brief: expect.stringContaining('Continue using') });
  const fork = reconcilerSessions(run.agent!)[0]!;
  expect(fork.spec.prompt).toContain('An advisory review was unavailable.');
  expect(fork.spec.prompt).toContain('"checkFindings":[]');
  await staleCrashLock(root);
  crashAppend = false;
  const git = gateGit(root, { head: 'revision-03', commits: [unchanged, unchanged],
    previews: Array.from({ length: 4 }, () => ({ repositoryRoot: root, head: 'revision-03', tree: finalReviewTree })) });
  const reopened = await openRuns(root, { agent: run.agent!, inputs: treeInputs(), git: git.git,
    candidates: scriptedCandidates(root, candidates()), policy: projectRoot => testPolicy(projectRoot, { reviews: testReviewPolicy({ retries: 0 }) }) });
  cleanups.push(() => reopened.service.close());
  await reopened.service.settled(plan, run.runId);
  expect(onlyRun(reopened.service, plan).state).toBe('completed');
  const after = await runEventsOnDisk(root, plan, run.runId);
  expect(eventsOf(after, 'reconciliation-assessed')).toHaveLength(1);
  expect(eventsOf(after, 'review-attempt-finished').filter(event => event.data.request === 'rq-0003')).toEqual([unavailable]);
  expect(eventsOf(after, 'review-request-recorded')).toHaveLength(3);
  expect(listOf(reopened.service, run.runId)).toEqual([]);
  git.assertComplete();
}, 60_000);

describe('CF11 and CF15: correction rounds', () => {
  test.each([false, true])('selected correction completes with purposeful extra broad review = %s', async broad => {
    const root = await reviewTarget(cleanups);
    const run = await reviewRun(root, cleanups, {
      policy: { concurrency: 1 },
      commits: correctedCandidates(),
      gates: correctionGates,
      architect: architect(true, broad ? 'Inspect substantial new correction behavior.' : null),
      engineer: [...engineers.slice(0, 3), submit(completionProposed('Corrected the limit.'),
        write('tmp/correction.txt', 'correction evidence\n'),
        write(limit, 'export const limit = (text: string) => text.length <= 500;\n'))],
      reviewers: {
        'rq-0001': review(changed[1]),
        'rq-0002': review(changed[2], [concern(limit, 'The limit is 50 characters, and the plan asks for 500', 'high')]),
        'rq-0003': review(changed[3], [concern(store, 'The store could be a plain object', 'low')]),
        // The correction's own review raises one more low-risk signal.
        'rq-0004': review(changed[4], [concern(limit, 'The limit could be a named constant', 'low')]),
      },
      reconcilers: {
        'work-item:review-notes.rc01': reconcile(submission([
          disposition('finding:case-0001', { action: 'repair' }),
          disposition('finding:case-0002', { action: 'waive', uncertainty: 'Either shape serves.' }),
        ], { kind: 'correct', goal: 'Make the note limit 500 characters, as the plan asks.' })),
        'work-item:review-notes.rc02': reconcile(
          submission([
            disposition('finding:case-0001', { action: 'fixed', reassessed: ['cfr-0001'] }),
            ...(broad ? [disposition('finding:case-0003', { action: 'leave' })] : []),
          ], { kind: broad ? 'unresolved' : 'complete' }),
        ),
      },
    });
    const { service, runId, events, agent } = run;
    expect(onlyRun(service, plan).state, JSON.stringify(onlyRun(service, plan).failure)).toBe('completed');

    // Round 1 planned the repair with this reconciliation's intent.
    const [first, second] = eventsOf(events, 'reconciliation-assessed');
    expect(first!.data).toMatchObject({ reconciliation: 'work-item:review-notes.rc01', next: 'correct' });
    const planned = first!.data.checkFindings.find(event => event.type === 'check-finding-decided' && event.data.checkFinding === 'finding:case-0001');
    expect(planned).toMatchObject({ data: { decision: { decision: { action: 'plan-repair', repair: { kind: 'intent', ref: 'work-item:review-notes.rc01' } } } } });

    // The architect's own session was continued to assign the correction,
    // with the brief in its history, and the assignment resolves the intent.
    const parentTurns = agent!.sessions.filter(session => session.spec.role === 'local-architect' && session.spec.submission.name !== 'submit_reconciliation');
    const correctionTurn = parentTurns[5]!;
    expect(correctionTurn.spec.session.mode).toBe('continue');
    expect(correctionTurn.inherited.some(text => text.includes('Reconciliation work-item:review-notes.rc01 (round 1)'))).toBe(true);
    expect(correctionTurn.spec.prompt).toContain('## Reconciliation work-item:review-notes.rc01');
    expect(correctionTurn.spec.prompt).toContain('Make the note limit 500 characters, as the plan asks.');
    expect(correctionTurn.spec.prompt).toContain('Its brief was appended to your session.');
    const continued = eventsOf(events, 'invocation-started').find(event => event.data.continues?.reason === 'reconciliation');
    expect(continued!.data.continues!.briefs).toEqual(['work-item:review-notes.rc01']);
    const assigned = eventsOf(events, 'iteration-assigned');
    expect(assigned.map(event => event.data.corrects)).toEqual([undefined, undefined, undefined, 'work-item:review-notes.rc01']);

    // The correction closed accepted with the repair claim on its own line;
    // the CheckFinding stayed open until the next round fixed it.
    const closed = eventsOf(events, 'iteration-closed').find(event => event.data.iteration === 'work-item:review-notes.i04')!;
    await expect(readFile(join(root, notesDirectory, 'src/tmp/correction.txt'))).rejects.toMatchObject({ code: 'ENOENT' });
    expect(closed.data.checkFindings).toEqual([expect.objectContaining({
      type: 'check-finding-decided',
      data: expect.objectContaining({ checkFinding: 'finding:case-0001', decision: expect.objectContaining({ decision: { action: 'claim-repair', candidate: { kind: 'tree', id: correctedTree }, change: 'work-item:review-notes.i04' } }) }),
    })]);
    expect(eventsOf(events, 'review-request-recorded').map(event => event.data.iteration)).toEqual(['work-item:review-notes.i01', 'work-item:review-notes.i02', 'work-item:review-notes.i03', ...(broad ? ['work-item:review-notes.i04'] : [])]);
    const retained = await committed<{ reviewPolicy?: { mode: string; reason: string } }>(root, runId, iterationLayout.result('work-item:review-notes', 4));
    expect(retained.reviewPolicy?.mode).toBe(broad ? undefined : 'not-run');
    if (broad) {
      const extraReview = agent!.sessions.find(session => session.spec.role === 'reviewer' && session.spec.prompt.includes('Code review rq-0004'))!;
      expect(extraReview.spec.prompt).toContain('decision: waive');
      expect(extraReview.spec.prompt).toContain('The assessment of finding:case-0002 against the current source.');
      expect(extraReview.spec.prompt).toContain('Avoid repeating unchanged issues.');
    }

    // Round 2 can correct any risk; the architect explicitly leaves one open.
    const basis = await committed<ReconciliationBasis>(root, runId, reconciliationLayout.basis('work-item:review-notes.rc02'));
    expect(basis).toMatchObject({ round: 2, floor: 'any', source: { commit: 'revision-04', tree: correctedTree } });
    expect(basis.checkFindings.map(entry => entry.checkFinding)).toEqual(['finding:case-0001', ...(broad ? ['finding:case-0003'] : [])]);
    const [, refork] = reconcilerSessions(agent!);
    expect(refork!.spec.session).toEqual({ mode: 'fork', from: JSON.stringify(JSON.parse(eventsOf(events, 'outline-revised').filter(event => event.data.architectRef !== undefined)[1]!.data.architectRef!.ref).point) });
    expect(refork!.spec.prompt).toContain('A correction may be planned for any signal');
    expect(refork!.verdicts[0]).toMatchObject({ accepted: true });
    expect(second!.data).toMatchObject({ reconciliation: 'work-item:review-notes.rc02', next: broad ? 'unresolved' : 'complete' });

    const summaries = new Map(listOf(service, runId).map(summary => [summary.id, summary]));
    expect(summaries.get('finding:case-0001')).toMatchObject({ standing: 'closed', reason: 'fixed-by-assessment' });
    expect(summaries.get('finding:case-0002')).toMatchObject({ standing: 'closed', reason: 'waived' });
    if (broad) expect(summaries.get('finding:case-0003')).toMatchObject({ standing: 'open', reason: 'new', risk: 'low' });
    else expect(summaries.has('finding:case-0003')).toBe(false);
    // The work item completed through its gate, naming what it left open.
    expect(eventsOf(events, 'work-item-completed')[0]!.data.unresolved).toEqual(broad ? [{ checkFinding: 'finding:case-0003', reason: 'left-open' }] : undefined);
    expect(eventsOf(events, 'gate-attempted').every(event => event.data.verdict === 'passed')).toBe(true);
    run.git.assertComplete();
  }, 60_000);
});

describe('CF12: a strong authority conflict asks the user, with exact references', () => {
  test('the conflict cites an element\'s exact text and the catalog\'s revision, the work item waits for the answer, and the next round assesses it', async () => {
    const root = await reviewTarget(cleanups);
    // Part of functional-requirement:review-notes-acceptance, the entry's acceptance element as the frozen catalog holds it.
    const conflict = 'asks for draft:functional-requirement:review-notes-acceptance';
    const options = [
      { id: 'one-note', summary: 'Keep one note per review run', consequence: 'The plan stands; the reviewer\'s request is declined.' },
      { id: 'many-notes', summary: 'Allow several notes', consequence: 'The plan\'s constraint changes, which a person must approve.' },
    ];
    const ask = (text: string, document = 'functional-requirement:review-notes-acceptance') => submission([disposition('finding:case-0001', { action: 'request-user-decision', conflicts: [{ document, text }], options })], { kind: 'await-user' });
    const run = await reviewRun(root, cleanups, {
      detached: true,
      engineer: engineers.slice(0, 3),
      reviewers: {
        'rq-0001': review(changed[1], [concern(store, 'A review run should keep several notes', 'high')]),
        'rq-0002': review(changed[2]),
        'rq-0003': review(changed[3]),
      },
      reconcilers: {
        // The first citation is not the element's text, the second names the plan as the old document did; both are returned to the fork.
        'work-item:review-notes.rc01': reconcile(ask('A note belongs to one run.'), ask(conflict, 'plan'), ask(conflict)),
        'work-item:review-notes.rc02': reconcile(submission([
          disposition('finding:case-0001', { action: 'waive', uncertainty: 'None: the user chose.' }),
        ], { kind: 'complete' })),
      },
    });
    cleanups.push(() => run.service.close());
    const { service, runId } = run;
    const pending = () => {
      const detail = service.checkFindings(plan, runId, { kind: 'detail', checkFinding: 'finding:case-0001' });
      return detail?.ok === true && detail.view.kind === 'detail' && detail.view.summary.pendingUserDecision !== null ? detail.view : undefined;
    };
    await until(() => pending() !== undefined);
    const waiting = pending()!;
    const accepted = (await runEventsOnDisk(root, plan, runId)).find(event => event.type === 'analysis-accepted')!;
    const catalogHash = (accepted.data as { evidence: { catalog: { hash: string } } }).evidence.catalog.hash;
    expect(waiting.decisions.items.at(-1)).toMatchObject({
      decision: {
        action: 'request-user-decision', authority: { kind: 'work-item-assessment', ref: 'work-item:review-notes.rc01' }, options,
        conflicts: [{ text: conflict, document: 'functional-requirement:review-notes-acceptance', revision: `sha256:${catalogHash}` }],
      },
    });
    const verdicts = reconcilerSessions(run.agent!)[0]!.verdicts;
    expect(JSON.stringify(verdicts[0])).toContain('cite the conflicting text exactly');
    expect(JSON.stringify(verdicts[1])).toContain('is neither an element of the run\'s catalog nor a file of the source this reconciliation assesses');
    // The work item waits: no gate has run since the assessment.
    await new Promise(resolve => setTimeout(resolve, 200));
    const before = await runEventsOnDisk(root, plan, runId);
    const assessedAt = before.findIndex(event => event.type === 'reconciliation-assessed');
    expect(before.slice(assessedAt).some(event => event.type === 'gate-attempted' || event.type === 'work-item-completed')).toBe(false);
    expect(before[assessedAt]).toMatchObject({ data: { next: 'await-user' } });

    // A person answers through the protocol's command; the next round assesses the answer and settles it.
    // A reader may still append while the person answers; the answer is sent again at the version its refusal names.
    const receipt = await answerAtCurrentVersion(service, runId, {
      checkFinding: 'finding:case-0001', expectedRevision: waiting.summary.revision, request: waiting.summary.pendingUserDecision!, option: 'one-note',
    });
    expect((await runEventsOnDisk(root, plan, runId)).find(event => event.sequence === receipt.sequence))
      .toMatchObject({ type: 'check-findings-recorded', data: { cause: { kind: 'user-command', command: { commandId: receipt.commandId } } } });
    await service.settled(plan, runId);
    const events = await runEventsOnDisk(root, plan, runId);
    expect(onlyRun(service, plan).state).toBe('completed');
    expect(eventsOf(events, 'reconciliation-assessed').map(event => [event.data.reconciliation, event.data.next])).toEqual([
      ['work-item:review-notes.rc01', 'await-user'], ['work-item:review-notes.rc02', 'complete'],
    ]);
    expect(listOf(service, runId).find(summary => summary.id === 'finding:case-0001')).toMatchObject({ standing: 'closed', reason: 'waived' });
    expect(eventsOf(events, 'work-item-completed')[0]!.data.unresolved).toBeUndefined();
  }, 60_000);
});

describe('CF09 and CF16: a basis that no longer holds', () => {
  test('a changed revision refuses the assessment, a changed source and a later signal refuse completion, and a waiver outside the module is refused', async () => {
    const root = await reviewTarget(cleanups);
    let service!: Awaited<ReturnType<typeof reviewRun>>['service'];
    let runId = '';
    let raised = false;
    const userWaiver: ScriptStep = {
      kind: 'await',
      until: async () => {
        // While the fork assesses, a person waives finding:case-0001.
        await service.recordCheckFindings(plan, runId, {
          cause: { kind: 'user-response', command: 'waive-1' },
          commands: [dispose('finding:case-0001', 1, decision(
            { action: 'waive', authority: { kind: 'user-decision', ref: 'waive-1' }, acceptedRisk: 'high', uncertainty: 'The reviewer may be right.' },
            { actor: { kind: 'user', name: 'reviewer' } },
          ))],
        });
      },
    };
    const run = await reviewRun(root, cleanups, {
      detached: true,
      commits: {
        ...candidates(),
        // The work item's gate commits a change to the store, not a rendered feature file.
        'revision-04': { tree: correctedTree, base: 'revision-03', changes: [{ status: 'M', path: store }], files: candidates()['revision-03']!.files },
      },
      gates: [...revisionGates, { commit: 'revision-04', changes: [{ status: 'M', path: store }] }, unchanged, unchanged, unchanged],
      engineer: engineers.slice(0, 3),
      reviewers: {
        'rq-0001': review(changed[1]),
        'rq-0002': review(changed[2], [concern(limit, 'The limit is 50 characters, and the plan asks for 500', 'high')]),
        'rq-0003': review(changed[3], [concern(store, 'The store is not frozen', 'medium')]),
      },
      reconcilers: {
        'work-item:review-notes.rc01': [userWaiver, ...reconcile(submission([
          disposition('finding:case-0001', { action: 'waive', uncertainty: 'The limit is a detail.' }),
          disposition('finding:case-0002', { action: 'waive', uncertainty: 'Nothing mutates it.' }),
        ], { kind: 'complete' }))],
        'work-item:review-notes.rc02': reconcile(submission([
          disposition('finding:case-0002', { action: 'defer', revisit: 'When a caller mutates the store.' }),
        ], { kind: 'complete' })),
        'work-item:review-notes.rc03': reconcile(
          // finding:case-0003 concerns another module: this architect cannot waive it.
          submission([disposition('finding:case-0003', { action: 'waive', uncertainty: 'Not ours.' })], { kind: 'complete' }),
          submission([disposition('finding:case-0003', { action: 'leave' })], { kind: 'unresolved' }),
        ),
      },
      afterWrite: async (write, id) => {
        if (write !== 'gate-committed' || raised) return;
        const log = await runEventsOnDisk(root, plan, id);
        if (!log.some(event => event.type === 'reconciliation-refused' && event.data.stage === 'completion')) return;
        raised = true;
        await service.recordCheckFindings(plan, id, {
          cause: { kind: 'producer', producer: 'review:code', attempt: 'late' },
          commands: [report(boundConcern({ attempt: 'late', tree: correctedTree, summary: 'The cart module reads the notes store', findingKey: 'draft:finding:case-0003' }))],
        });
      },
    });
    service = run.service;
    runId = run.runId;
    cleanups.push(() => run.service.close());
    await service.settled(plan, runId);
    const events = await runEventsOnDisk(root, plan, runId);
    expect(onlyRun(service, plan).state).toBe('completed');

    // rc01 was refused at its commit: finding:case-0001 moved while the fork assessed it.
    const refused = eventsOf(events, 'reconciliation-refused').map(event => event.data);
    expect(refused[0]).toMatchObject({ reconciliation: 'work-item:review-notes.rc01', stage: 'assessment', reason: 'finding:case-0001 is at revision 2, not 1' });
    expect(eventsOf(events, 'reconciliation-assessed').map(event => event.data.reconciliation)).toEqual(['work-item:review-notes.rc02', 'work-item:review-notes.rc03']);
    const rc02 = await committed<ReconciliationBasis>(root, runId, reconciliationLayout.basis('work-item:review-notes.rc02'));
    expect(rc02.checkFindings).toEqual([{ checkFinding: 'finding:case-0002', revision: 1 }]);
    // The work item's first gate audited a changed store: its completion was refused.
    expect(refused[1]).toMatchObject({ reconciliation: 'work-item:review-notes.rc02', stage: 'completion', reason: expect.stringContaining(`${store} changed between the reconciled source revision-03 and the gate's revision-04`) });
    // The second gate met a signal raised after the basis: a round remained, and it was refused again.
    expect(refused[2]).toMatchObject({ stage: 'completion', reason: 'a CheckFinding became open after the basis' });
    expect(refused).toHaveLength(3);
    // The last round could not waive a signal of another module.
    const [, , last] = reconcilerSessions(run.agent!);
    expect(JSON.stringify(last!.verdicts[0])).toContain('insufficient-authority: finding:case-0003 concerns project/cart');
    const summaries = new Map(listOf(service, runId).map(summary => [summary.id, summary]));
    expect(summaries.get('finding:case-0001')).toMatchObject({ standing: 'closed', reason: 'waived' });
    expect(summaries.get('finding:case-0002')).toMatchObject({ standing: 'deferred', reason: 'deferred' });
    expect(summaries.get('finding:case-0003')).toMatchObject({ standing: 'open', modules: ['project/cart'] });
    expect(eventsOf(events, 'work-item-completed')[0]!.data.unresolved).toEqual([{ checkFinding: 'finding:case-0003', reason: 'left-open' }]);
    // Three work-item gates ran, each with its own verdict.
    expect(eventsOf(events, 'gate-attempted').filter(event => event.data.checkpoint === 'work-item').map(event => event.data.verdict)).toEqual(['passed', 'passed', 'passed']);
  }, 60_000);
});

/** The correction scenario's reviewers and forks: finding:case-0001 repaired in round 1, fixed in round 2. */
const correctionScenario = {
  policy: { concurrency: 1 },
  commits: correctedCandidates(),
  gates: correctionGates,
  architect: architect(),
  engineer: engineers,
  reviewers: {
    'rq-0001': review(changed[1]),
    'rq-0002': review(changed[2], [concern(limit, 'The limit is 50 characters, and the plan asks for 500', 'high')]),
    'rq-0003': review(changed[3]),
    'rq-0004': review(changed[4]),
  },
  reconcilers: {
    'work-item:review-notes.rc01': reconcile(submission([disposition('finding:case-0001', { action: 'repair' })], { kind: 'correct', goal: 'Make the note limit 500 characters.' })),
    'work-item:review-notes.rc02': reconcile(submission([disposition('finding:case-0001', { action: 'fixed', reassessed: ['cfr-0001'] })], { kind: 'complete' })),
  },
} as const;

describe('CF10: a missing fork point and a failed brief append', () => {
  test('a fork point that no longer exists starts fresh with the whole packet, and a brief that cannot be appended reaches the next architect input from the log', async () => {
    const root = await reviewTarget(cleanups);
    const run = await reviewRun(root, cleanups, {
      ...correctionScenario,
      agentReady: agent => {
        let lost = false;
        interceptOperations(agent, operations => ({ ...operations, async inspect(runId, sessionId, point) {
          if (!lost && point && existsSync(runPath(root, plan, runId, reconciliationLayout.basis('work-item:review-notes.rc01')))) {
            lost = true; agent.loseSession(point);
          }
          return operations.inspect(runId, sessionId, point);
        } }));
      },
    });
    const { service, runId, events, agent } = run;
    expect(onlyRun(service, plan).state).toBe('completed');

    const [first, second] = reconcilerSessions(agent!);
    expect(first!.spec.session.mode).toBe('fresh');
    expect(first!.start).toEqual({ mode: 'fresh' });
    expect(first!.spec.prompt).toContain('## CheckFindings needing attention (1)');
    expect(first!.spec.prompt).toContain('The plan asks for draft:functional-requirement:review-notes-request.');
    expect(first!.spec.prompt).toContain(`\`${notesDirectory}/src/tests/\``);
    const record = await committed<ReconciliationAssessment>(root, runId, reconciliationLayout.assessment('work-item:review-notes.rc01'));
    expect(record).toMatchObject({ requestedStart: 'fork', actualStart: 'fresh' });
    const forkEnded = eventsOf(events, 'invocation-ended').find(event => event.data.invocation === record.invocation)!;
    expect(forkEnded.data.degraded).toMatchObject({ requested: 'fork', actual: 'fresh' });

    // The decisions were committed; the append found the session lost, and the session was finished as lost.
    const appended = eventsOf(events, 'reconciliation-brief-appended');
    expect(appended[0]!.data).toMatchObject({ reconciliation: 'work-item:review-notes.rc01', outcome: 'session-lost', ref: null });
    expect(eventsOf(events, 'session-finished').some(event => event.data.session === appended[0]!.data.session && event.data.reason === 'lost')).toBe(true);
    // The next architect turn starts fresh, and its input carries the brief from the log.
    const parentTurns = agent!.sessions.filter(session => session.spec.role === 'local-architect' && session.spec.submission.name !== 'submit_reconciliation');
    const correctionTurn = parentTurns[5]!;
    expect(correctionTurn.spec.session).toEqual({ mode: 'fresh' });
    expect(correctionTurn.spec.prompt).toContain('could not be appended to your session (session-lost');
    expect(correctionTurn.spec.prompt).toContain('> Reconciliation work-item:review-notes.rc01 (round 1)');
    // The second round forks the new session's point, and its brief lands.
    expect(second!.start).toEqual({ mode: 'fork' });
    expect(appended[1]!.data).toMatchObject({ reconciliation: 'work-item:review-notes.rc02', outcome: 'appended' });
    expect(listOf(service, runId)[0]).toMatchObject({ id: 'finding:case-0001', standing: 'closed', reason: 'fixed-by-assessment' });
  }, 60_000);
});

describe('CF10: the brief append outcomes that land nothing', () => {
  test('an append the executor fails is recorded as failed, the session is kept, and the next architect input carries the brief from the log', async () => {
    const root = await reviewTarget(cleanups);
    const run = await reviewRun(root, cleanups, {
      ...correctionScenario,
      agentReady: agent => {
        interceptOperations(agent, operations => ({ ...operations, async appendContext(input) {
          if (input.additions.some(item => item.key === 'brief:work-item:review-notes.rc01')) throw new Error('the executor refused the append');
          return operations.appendContext(input);
        } }));
      },
    });
    const { service, runId, events, agent } = run;
    expect(onlyRun(service, plan).state).toBe('completed');
    const appended = eventsOf(events, 'reconciliation-brief-appended');
    expect(appended.map(event => event.data)).toEqual([
      { reconciliation: 'work-item:review-notes.rc01', session: expect.any(String), ref: null, outcome: 'failed', reason: 'the executor refused the append' },
      { reconciliation: 'work-item:review-notes.rc02', session: appended[0]!.data.session, ref: expect.any(String), outcome: 'appended', reason: null },
    ]);
    // Unlike a lost session, a failed append keeps it: the correction turn
    // continues it, and its input quotes the brief from the log.
    expect(eventsOf(events, 'session-finished').some(event => event.data.session === appended[0]!.data.session && event.data.reason === 'lost')).toBe(false);
    const parentTurns = agent!.sessions.filter(session => session.spec.role === 'local-architect' && session.spec.submission.name !== 'submit_reconciliation');
    const correctionTurn = parentTurns[5]!;
    expect(correctionTurn.spec.session.mode).toBe('continue');
    expect(correctionTurn.inherited.some(text => text.includes('Reconciliation work-item:review-notes.rc01'))).toBe(false);
    expect(correctionTurn.spec.prompt).toContain('could not be appended to your session (failed: the executor refused the append)');
    expect(correctionTurn.spec.prompt).toContain('> Reconciliation work-item:review-notes.rc01 (round 1)');
    expect(listOf(service, runId)[0]).toMatchObject({ id: 'finding:case-0001', standing: 'closed', reason: 'fixed-by-assessment' });
  }, 60_000);

  test('a round after the architect\'s session was lost has no session to append to, and records no-session', async () => {
    const root = await reviewTarget(cleanups);
    const options = [
      { id: 'one-note', summary: 'Keep one note per review run', consequence: 'The plan stands.' },
      { id: 'many-notes', summary: 'Allow several notes', consequence: 'The plan changes.' },
    ];
    const run = await reviewRun(root, cleanups, {
      detached: true,
      engineer: engineers.slice(0, 3),
      reviewers: {
        'rq-0001': review(changed[1], [concern(store, 'A review run should keep several notes', 'high')]),
        'rq-0002': review(changed[2]),
        'rq-0003': review(changed[3]),
      },
      agentReady: agent => {
        let lost = false;
        interceptOperations(agent, operations => ({ ...operations, async inspect(runId, sessionId, point) {
          if (!lost && point && existsSync(runPath(root, plan, runId, reconciliationLayout.basis('work-item:review-notes.rc01')))) {
            lost = true; agent.loseSession(point);
          }
          return operations.inspect(runId, sessionId, point);
        } }));
      },
      reconcilers: {
        'work-item:review-notes.rc01': reconcile(submission([
          disposition('finding:case-0001', { action: 'request-user-decision', conflicts: [{ document: 'functional-requirement:review-notes-acceptance', text: 'The plan asks for draft:functional-requirement:review-notes-acceptance.' }], options }),
        ], { kind: 'await-user' })),
        'work-item:review-notes.rc02': reconcile(submission([disposition('finding:case-0001', { action: 'waive', uncertainty: 'None: the user chose.' })], { kind: 'complete' })),
      },
    });
    cleanups.push(() => run.service.close());
    const { service, runId } = run;
    const pending = () => {
      const detail = service.checkFindings(plan, runId, { kind: 'detail', checkFinding: 'finding:case-0001' });
      return detail?.ok === true && detail.view.kind === 'detail' && detail.view.summary.pendingUserDecision !== null ? detail.view.summary : undefined;
    };
    await until(() => pending() !== undefined);
    const waiting = pending()!;
    // The decision is visible once the assessment is committed; the brief's
    // completion and the lost session's end are appended after it.
    await answerAtCurrentVersion(service, runId, {
      checkFinding: 'finding:case-0001', expectedRevision: waiting.revision, request: waiting.pendingUserDecision!, option: 'one-note',
    });
    await service.settled(plan, runId);
    const events = await runEventsOnDisk(root, plan, runId);
    expect(onlyRun(service, plan).state).toBe('completed');
    // Round 1's append found the session lost and finished it; round 2 came
    // straight after the answer, with no architect turn to start another.
    expect(eventsOf(events, 'reconciliation-brief-appended').map(event => [event.data.reconciliation, event.data.outcome, event.data.session])).toEqual([
      ['work-item:review-notes.rc01', 'session-lost', expect.any(String)],
      ['work-item:review-notes.rc02', 'no-session', null],
    ]);
    expect(eventsOf(events, 'reconciliation-brief-appended')[1]!.data.reason).toContain('was not kept');
    const record = await committed<ReconciliationAssessment>(root, runId, reconciliationLayout.assessment('work-item:review-notes.rc02'));
    expect(record).toMatchObject({ parent: null, next: 'complete' });
    // The decisions were committed all the same, and the gate completed the work item.
    expect(listOf(service, runId)[0]).toMatchObject({ id: 'finding:case-0001', standing: 'closed', reason: 'waived' });
    expect(eventsOf(events, 'work-item-completed')[0]!.data.unresolved).toBeUndefined();
  }, 60_000);
});

describe('CF15: a work item waits for actual review settlement', () => {
  test.each(['complete', 'unavailable'] as const)('a %s reader enters the reconciliation basis and the correction review still runs', async result => {
    const root = await reviewTarget(cleanups);
    const reading = gate();
    const run = await reviewRun(root, cleanups, {
      ...correctionScenario,
      policy: { concurrency: 2, retries: 0, attemptMs: 60_000, settleMs: 400 },
      architect: [
        ...architect().slice(0, 3),
        // The completion request comes while the third reader is running.
        [{ kind: 'await', until: () => reading.opened }, ...submit(requestCompletion())],
        ...architect().slice(4),
      ],
      reviewers: {
        ...correctionScenario.reviewers,
        'rq-0003': [{ kind: 'await', until: async () => { reading.open(); } },
          ...(result === 'complete' ? review(changed[3]) : [{ kind: 'end' as const, message: 'Provider ended without a review' }])],
      },
    });
    const { service, runId, events } = run;
    expect(onlyRun(service, plan).state).toBe('completed');
    const finished = eventsOf(events, 'review-attempt-finished');
    expect(finished.find(event => event.data.request === 'rq-0003')!.data).toMatchObject({ result: result === 'complete' ? 'complete' : 'not-verified', settles: true });
    const started = eventsOf(events, 'review-attempt-started').find(event => event.data.request === 'rq-0003')!;
    // The actual terminal review outcome is settled and its session is finished.
    const sessions = reduceSessions(events);
    expect(sessions.get(started.data.session)!.state).toBe('finished');
    // The actual review result is in the basis before the correction review runs.
    const basis = await committed<ReconciliationBasis>(root, runId, reconciliationLayout.basis('work-item:review-notes.rc01'));
    expect(basis.requests.find(request => request.request === 'rq-0003')).toEqual({ request: 'rq-0003', attempt: 'rq-0003.a01', result: result === 'complete' ? 'complete' : 'not-verified' });
    expect(finished.find(event => event.data.request === 'rq-0004')!.data).toMatchObject({ result: 'complete' });
    expect(service.reviews(plan, runId)!.coverage).toEqual({ state: 'available', requested: 4, complete: result === 'complete' ? 4 : 3, partial: 0, notVerified: result === 'complete' ? 0 : 1, pending: 0 });
  }, 60_000);
});


test('Plan 43 context observation retains the pending correction before ordinary final qualification', async () => {
  const root = await reviewTarget(cleanups);
  const original = architect();
  const run = await reviewRun(root, cleanups, {
    ...correctionScenario, continuity: true,
    architect: original.map((turn, index) => index === 4
      ? [{ kind: 'context' as const, tokens: 205_728, window: 272_000 }, ...turn] : turn),
  });
  const { service, runId, agent, events } = run;
  expect(onlyRun(service, plan).state).toBe('completed');
  const correction = eventsOf(events, 'iteration-assigned').find(event => event.data.corrects === 'work-item:review-notes.rc01')!;
  const accepted = eventsOf(events, 'iteration-closed').find(event => event.data.iteration === correction.data.iteration)!;
  expect(accepted.data).toMatchObject({ outcome: 'accepted', commit: 'revision-04' });
  expect(accepted.data.checkFindings).toEqual([expect.objectContaining({ type: 'check-finding-decided', data: expect.objectContaining({
    checkFinding: 'finding:case-0001', decision: expect.objectContaining({ decision: expect.objectContaining({ action: 'claim-repair', candidate: { kind: 'tree', id: correctedTree } }) }),
  }) })]);
  expect(listOf(service, runId).find(finding => finding.id === 'finding:case-0001')).toMatchObject({ standing: 'closed', reason: 'fixed-by-assessment' });
  const parentTurns = agent!.sessions.filter(session => session.spec.role === 'local-architect' && session.spec.submission.name !== 'submit_reconciliation');
  const correctionTurn = parentTurns.find(session => session.spec.prompt.includes('Reconciliation work-item:review-notes.rc01') && session.spec.submission.name === 'submit_work_item_result')!;
  expect(correctionTurn.spec.session.mode).toBe('continue');
  expect(eventsOf(events, 'invocation-ended').some(event => event.data.ended === 'context-budget-reached' || event.data.ended === 'resource-pending')).toBe(false);
  expect(eventsOf(events, 'operation-recovery-paused')).toHaveLength(0);
  const final = eventsOf(events, 'gate-attempted').find(event => event.data.checkpoint === 'final')!;
  expect(accepted.sequence).toBeLessThan(final.sequence);
  const finalRecord = JSON.parse(await readFile(runPath(root, plan, runId, runLayout.gate(final.data.gate)), 'utf8'));
  expect(finalRecord).toMatchObject({ verdict: 'passed', audited: 'revision-04' });
  expect(eventsOf(events, 'candidate-bound-to-gate').find(event => event.data.gate === final.data.gate)?.data.tree).toBe(correctedTree);
  run.git.assertComplete();
}, 60_000);
