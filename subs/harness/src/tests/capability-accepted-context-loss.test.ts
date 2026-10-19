import { readFile, writeFile, rm, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { createScriptedAgent, type Script } from '../../subs/agent/src/scripted.js';
import type { AgentPort } from '../../subs/agent/src/interfaces/port.js';
import { declaringScenarios } from './helpers/declarations.js';
import { analysis, entry } from './helpers/analysis.js';
import { RunLog, type RunEvent } from '../run/log.js';
import { measurementSnapshotSchema, runLayout, snapshotId, type InvocationOutcome } from '../run/records.js';
import { committedRecords } from '../work/committed.js';
import { copyCapabilityFixture, openCapabilityRuns } from './helpers/capability.js';
import { assign, edit, outline, submit, treeInputs } from './helpers/iterations.js';
import { freeze, runEventsOnDisk, runPath, staleCrashLock, startRun, stopRun, testPolicy, until } from './helpers/runs.js';

import { recoveryBoundaries } from './helpers/recovery-boundaries.js';
import { resetSpawnAttempts, spawnAttempts } from './helpers/process-guard.js';
vi.mock('node:child_process', async importOriginal => {
  const { guardedChildProcess } = await import('./helpers/process-guard.js');
  return guardedChildProcess(await importOriginal<typeof import('node:child_process')>());
});
beforeEach(resetSpawnAttempts);
const answers: ReturnType<typeof recoveryBoundaries>[] = [];
const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  const errors: unknown[] = [];
  for (const cleanup of cleanups.splice(0).reverse()) try { await cleanup(); } catch (error) { errors.push(error); }
  for (const answer of answers.splice(0)) try { answer.assertComplete(); } catch (error) { errors.push(error); }
  try { expect(spawnAttempts(), 'ordinary recovery setup/flow/teardown process attempts').toEqual([]); } catch (error) { errors.push(error); }
  if (errors.length) throw new AggregateError(errors, 'Recovery fixture teardown failed');
});

// This proof owns optional provider persistence rather than the usual in-memory fixture.
vi.unmock('../../subs/session-store/src/session-store.js');

for (const boundary of ['accepted-no-point'] as const) {
  test(`CA05 CA20: restart after ${boundary} keeps one consumer question and answer`, async () => {
    const fixture = await copyCapabilityFixture();
    cleanups.push(fixture.remove);
    const boundaryAnswers = recoveryBoundaries(fixture.root, 'a');
    answers.push(boundaryAnswers);
    const a = 'capability-coordination/a';
    const b = 'capability-coordination/b';
    let closing: Promise<void> | undefined;
    let closeFirst: (() => Promise<void>) | undefined;
    let architectTurns = 0;
    const script: Script = spec => {
      if (spec.role === 'initial-architect') return submit(analysis([entry('a-reads-b', a)]));
      if (spec.submission.name === 'submit_work_item_result') return submit(assign(a, {}, outline()));
      if (spec.submission.name === 'submit_capability_qualification') {
        const ids = [...spec.prompt.matchAll(/Use request (need-\d+) and invocation (inv-\d+)/gu)].at(-1)!;
        return submit({ kind: 'delegate-capability', request: ids[1], invocation: ids[2], provider: b,
          placementReason: 'B owns the fact', constraints: [], requirementRefs: [] });
      }
      if (spec.submission.name === 'answer_capability_consultation') return submit({
        answer: 'A calls B and needs its original source', objections: [],
      });
      if (spec.role === 'engineer') return submit({ kind: 'capability-needed', summary: 'A needs source', request: {
        need: 'B fact with source for A', usage: [{ path: 'subs/a/src/caller.ts', use: 'Display source', prospective: false }],
        constraints: [], knownInterface: { kind: 'none-known' },
        examples: [{ title: 'source shown', code: 'expect(renderA()).toContain("B")', designation: 'pseudocode' }],
      } });
      if (spec.role === 'capability-architect') {
        architectTurns += 1;
        const ids = [...spec.prompt.matchAll(/Use task (cap-\d+), planRevision (\d+) and invocation (inv-\d+)/gu)].at(-1)!;
        return architectTurns === 1 ? submit({ task: ids[1], planRevision: Number(ids[2]), invocation: ids[3],
          kind: 'consult-consumer', question: 'How will A render the source?', sections: ['calling code'], references: [] })
          : [{ kind: 'wait', ms: 60_000 }];
      }
      return [];
    };
    const original = createScriptedAgent(declaringScenarios(script));
    const agent: AgentPort = { ...original, bindSessionStore(store) {
      const operations = original.bindSessionStore(store);
      return { ...operations, async continue(input) {
        const handle = await operations.continue(input);
        return boundary === 'accepted-no-point' && input.task.submissionTool === 'submit_capability_action'
          ? { ...handle, receipt: handle.receipt.then(receipt => ({ ...receipt, point: null })) } : handle;
      } };
    } };
    const options = { ...boundaryAnswers.options, agent, inputs: treeInputs(),
      afterWrite: async (write: string) => { if ((write === boundary || boundary === 'accepted-no-point' && write === 'invocation-ended' && architectTurns === 1) && closing === undefined) closing = closeFirst?.(); } };
    const first = await openCapabilityRuns(fixture.root, options);
    closeFirst = () => first.service.close();
    const receipt = await first.service.execute(startRun('need'));
    await until(() => closing !== undefined, 30_000);
    await closing;
    let acceptedInvocation: string | undefined;
    let acceptedBytes: Buffer | undefined;
    if (boundary === 'accepted-no-point') {
      const before = await runEventsOnDisk(fixture.root, 'need', receipt.jobId);
      const started = before.filter(event => event.type === 'invocation-started' && event.data.role === 'capability-architect').at(-1)!;
      if (started.type !== 'invocation-started') throw new Error('Missing accepted capability action');
      acceptedInvocation = started.data.invocation;
      const outcome = JSON.parse(await readFile(runPath(fixture.root, 'need', receipt.jobId, runLayout.outcome(acceptedInvocation)), 'utf8')) as InvocationOutcome;
      expect(outcome).toMatchObject({ disposition: 'applied', ended: 'submitted', settled: { confirmed: true } });
      expect(outcome.session?.ref || null).toBeNull();
      acceptedBytes = await readFile(runPath(fixture.root, 'need', receipt.jobId, runLayout.submission(acceptedInvocation)));
      const payloads = join(fixture.root, 'plans', '.harness', 'session-operations', 'store', 'payloads');
      for (const id of await readdir(payloads)) await rm(join(payloads, id));
      expect(before.filter(event => event.type === 'capability-exchange-opened')).toHaveLength(0);
    }
    const second = await openCapabilityRuns(fixture.root, options);
    cleanups.push(() => second.service.close());
    await until(() => (second.service.events('need', receipt.jobId) ?? []).filter(event =>
      event.type === 'invocation-started' && event.data.role === 'capability-architect' &&
      event.data.work.capabilityTask === 'cap-001').length >= 2 ||
      (second.service.events('need', receipt.jobId) ?? []).some(event => event.type === 'job-failed'), 30_000);
    const events = await runEventsOnDisk(fixture.root, 'need', receipt.jobId);
    expect(events.filter(event => event.type === 'job-failed'), JSON.stringify(events.slice(-12))).toHaveLength(0);
    expect(events.filter(event => event.type === 'capability-exchange-opened')).toHaveLength(1);
    expect(events.filter(event => event.type === 'capability-exchange-answered')).toHaveLength(1);
    if (acceptedInvocation !== undefined) expect(await readFile(runPath(fixture.root, 'need', receipt.jobId, runLayout.submission(acceptedInvocation)))).toEqual(acceptedBytes);
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const current = second.service.events('need', receipt.jobId)!;
      try { await second.service.execute(stopRun('need', receipt.jobId, current.at(-1)!.sequence)); break; }
      catch (error) { if (!String(error).includes('at version') || attempt === 19) throw error; }
    }
    await second.service.settled('need', receipt.jobId);
    // RunLog.open owns crash-tail repair. Inspect through it only after the
    // current writer drains; opening it during append can truncate a partial line.
    expect(second.service.events('need', receipt.jobId)!.at(-1)?.type).toBe('job-stopped');
    const path = runPath(fixture.root, 'need', receipt.jobId, runLayout.events);
    const settledBytes = await readFile(path);
    const records = committedRecords((await RunLog.open(path, receipt.jobId)).ledger.replay());
    expect(records.capabilityExchanges.get('cap-001-ex01')).toHaveLength(2);
    expect(records.capabilityExchanges.get('cap-001-ex01')?.[1]?.answer?.text).toContain('original source');
    expect(await readFile(path)).toEqual(settledBytes);
  }, 60_000);
}
