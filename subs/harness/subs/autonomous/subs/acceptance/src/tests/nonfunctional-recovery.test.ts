import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { copyFixture } from '../../../../../../src/tests/helpers/fixture.js';
import { createScriptedAgent } from '../../../../../agent/src/scripted.js';
import { coordinatorAssessmentToolName, coordinatorActionToolName, nonfunctionalRepairToolName } from '../nonfunctional/submissions.js';
import { intakeToolName } from '../../../planning/src/extraction.js';
import { withDefaultTurns } from '../../../../../../src/tests/helpers/declarations.js';
import { analysis } from '../../../../../../src/tests/helpers/analysis.js';
import { submit, write } from '../../../../../../src/tests/helpers/iterations.js';
import { RunQueries } from '../../../../../projections/src/queries.js';
import { createQuerySource } from '../../../../../../src/http/query-source.js';
import { emptyAnalysis, freeze, onlyRun, openRuns, runEventsOnDisk, runPath, staleCrashLock, startRun, stopRun, until } from '../../../../../../src/tests/helpers/runs.js';
import { runLayout } from '../../../../src/run/records.js';
import { type Invocation } from '../../../../../task-execution/src/records.js';
import type { RunWrite } from '../../../../src/run/log.js';

import { nfrBoundaries } from './helpers/nonfunctional-boundaries.js';
import { resetSpawnAttempts, spawnAttempts } from '../../../../../../src/tests/helpers/process-guard.js';
vi.mock('node:child_process', async importOriginal => {
  const { guardedChildProcess } = await import('../../../../../../src/tests/helpers/process-guard.js');
  return guardedChildProcess(await importOriginal<typeof import('node:child_process')>());
});
beforeEach(resetSpawnAttempts);
const answers: ReturnType<typeof nfrBoundaries>[] = [];

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  const errors: unknown[] = [];
  for (const cleanup of cleanups.splice(0).reverse()) try { await cleanup(); } catch (error) { errors.push(error); }
  for (const answer of answers.splice(0)) try { answer.assertComplete(); } catch (error) { errors.push(error); }
  try { expect(spawnAttempts(), 'ordinary NFR setup/flow/teardown process attempts').toEqual([]); } catch (error) { errors.push(error); }
  if (errors.length) throw new AggregateError(errors, 'NFR fixture teardown failed');
});

for (const boundary of ['nonfunctional-phase-started', 'candidate-prepared', 'nonfunctional-assessed'] as const satisfies readonly RunWrite[]) {
  test(`a phase run resumes after ${boundary} without repeating committed evidence`, async () => {
    const fixture = await copyFixture();
    cleanups.push(fixture.remove);
    const boundaryAnswers = nfrBoundaries(fixture.root);
    answers.push(boundaryAnswers);
    let frozen = false;
    const first = await openRuns(fixture.root, { ...boundaryAnswers.options,
      script: [{ kind: 'submit', input: emptyAnalysis() }],
      afterWrite: async write => { if (write === boundary) { frozen = true; await freeze(); } },
    });
    // A frozen service is abandoned, as a dead process is. Its lock record
    // becomes stale, and the next service owns the same run under a new lock.
    const receipt = await first.service.execute(startRun('review-notes'));
    await until(() => frozen, 30_000);
    await staleCrashLock(fixture.root);
    const reopened = await openRuns(fixture.root, { ...boundaryAnswers.options, script: [] });
    cleanups.push(() => reopened.service.close());
    await reopened.service.settled('review-notes', receipt.jobId);
    expect(onlyRun(reopened.service, 'review-notes').state).toBe('completed');
    const events = await runEventsOnDisk(fixture.root, 'review-notes', receipt.jobId);
    expect(events.filter(event => event.type === 'nonfunctional-phase-started')).toHaveLength(1);
    expect(events.filter(event => event.type === 'candidate-prepared')).toHaveLength(1);
    expect(events.filter(event => event.type === 'nonfunctional-assessed')).toHaveLength(1);
    expect(events.filter(event => event.type === 'gate-attempted' && event.data.checkpoint === 'final')).toHaveLength(1);
    expect(events.filter(event => event.type === 'job-completed')).toHaveLength(1);
  }, 60_000);
}

for (const boundary of ['gate-attempted', 'gate-committing', 'gate-committed'] as const satisfies readonly RunWrite[]) {
  test(`a final gate resumes after ${boundary} without a duplicate audit attempt`, async () => {
    const fixture = await copyFixture();
    cleanups.push(fixture.remove);
    const boundaryAnswers = nfrBoundaries(fixture.root, { lookups: boundary === 'gate-committing' ? 2 : 1, commits: boundary === 'gate-committing' ? 2 : 1 });
    answers.push(boundaryAnswers);
    let frozen = false;
    const first = await openRuns(fixture.root, { ...boundaryAnswers.options,
      script: [{ kind: 'submit', input: emptyAnalysis() }],
      afterWrite: async write => { if (write === boundary) { frozen = true; await freeze(); } },
    });
    const receipt = await first.service.execute(startRun('review-notes'));
    await until(() => frozen, 30_000);
    await staleCrashLock(fixture.root);
    const reopened = await openRuns(fixture.root, { ...boundaryAnswers.options, script: [] });
    cleanups.push(() => reopened.service.close());
    await reopened.service.settled('review-notes', receipt.jobId);
    expect(onlyRun(reopened.service, 'review-notes').state).toBe('completed');
    const events = await runEventsOnDisk(fixture.root, 'review-notes', receipt.jobId);
    expect(events.filter(event => event.type === 'gate-committing' && event.data.checkpoint === 'final')).toHaveLength(1);
    expect(events.filter(event => event.type === 'gate-attempted' && event.data.checkpoint === 'final')).toHaveLength(1);
    expect(events.filter(event => event.type === 'candidate-bound-to-gate')).toHaveLength(1);
    expect(events.filter(event => event.type === 'job-completed')).toHaveLength(1);
  }, 60_000);
}

/** An intake that reads the obligation as the plan's one non-functional requirement. */
function intake(obligation: string) {
  return { goal: 'Keep an audit record of reviews.', elements: [
    { key: 'audit', kind: 'non-functional', document: 'doc-001', text: obligation, conditions: [], uncertainty: '' },
  ], incorporation: { documents: [{ document: 'doc-001', scenarios: true, uncertainty: '' }], missing: [] } };
}

function repairAgent(root: string, obligation: string, boundaryAnswers: ReturnType<typeof nfrBoundaries>, noResult: false | 'end' | 'checkpoint' = false) {
  return createScriptedAgent(withDefaultTurns(spec => {
    if (spec.submission.name === 'submit_compaction_review') return submit({ action: 'handoff', reason: 'Return the retained repair to the coordinator.' });
    if (spec.submission.name === intakeToolName) return submit(intake(obligation));
    if (spec.role === 'initial-architect') return submit(analysis([]));
    if (spec.submission.name === coordinatorAssessmentToolName) return submit({ kind: 'assessment', results: [{
      nfr: 'nfr-001', result: spec.prompt.includes('(after-repair)') ? 'satisfied' : 'not-satisfied',
      inspectedScope: ['subs/workspace/subs/reviews/subs/core/src'], evidence: ['Current source inspected'], uncertainty: '',
    }] });
    if (spec.submission.name === coordinatorActionToolName) return submit({ kind: 'repair', nfrs: ['nfr-001'],
      startingModule: 'collection-review/workspace/reviews/core', task: 'Add audit record source', evidence: [], uncertainty: '' });
    if (spec.submission.name === nonfunctionalRepairToolName) {
      boundaryAnswers.repair();
      const edit = write(join(root, 'subs/workspace/subs/reviews/subs/core/src/repair-recovery.ts'), 'export const auditRecord = true;\n');
      return noResult ? [edit, noResult === 'checkpoint'
        ? { kind: 'compaction-checkpoint' as const, reason: 'threshold' as const }
        : { kind: 'end' as const, message: 'Retain my source edit for the coordinator.' }]
        : submit({ kind: 'completed', summary: 'Audit record added', evidence: ['new source'], remaining: [] }, edit);
    }
    return [];
  }));
}

const repairCrashes = [
  { boundary: 'nonfunctional-repair-assigned' },
  { boundary: 'nonfunctional-repair-assigned', mutateBeforeResume: true },
  { boundary: 'invocation-ended' },
  { boundary: 'invocation-ended', noResult: 'end' },
  { boundary: 'invocation-ended', noResult: 'checkpoint' },
  { boundary: 'nonfunctional-repair-committed' },
  { boundary: 'nonfunctional-assessed' },
  { boundary: 'writer-acquired' },
] as const satisfies readonly { readonly boundary: RunWrite; readonly mutateBeforeResume?: boolean; readonly noResult?: 'end' | 'checkpoint' }[];
for (const { boundary, ...variant } of repairCrashes) {
  const mutateBeforeResume = 'mutateBeforeResume' in variant && variant.mutateBeforeResume;
  const noResult = 'noResult' in variant ? variant.noResult : false;
  test(`a repair phase ${boundary} crash ${mutateBeforeResume ? 'retains downtime edits through ordinary repair' : noResult ? `retains ${noResult} result without re-execution` : 'resumes exactly once'}`, async () => {
    const fixture = await copyFixture();
    cleanups.push(fixture.remove);
    const boundaryAnswers = nfrBoundaries(fixture.root, { repair: 'one-module' });
    answers.push(boundaryAnswers);
    const obligation = 'The review must retain an audit record.';
    const plan = join(fixture.root, 'plans/review-notes/plan.md');
    await writeFile(plan, `${await readFile(plan, 'utf8')}\n${obligation}\n`);
    const firstAgent = repairAgent(fixture.root, obligation, boundaryAnswers, noResult);
    let frozen = false;
    let runId = '';
    const first = await openRuns(fixture.root, { ...boundaryAnswers.options, agent: firstAgent,
      afterWrite: async (write, id) => {
        if (write !== boundary) return;
        const currentEvents = write === 'invocation-ended' ? await runEventsOnDisk(fixture.root, 'review-notes', id) : [];
        const recent = currentEvents.at(-1);
        const repairStarted = recent?.type === 'invocation-ended' && currentEvents.some(event =>
          event.type === 'invocation-started' && event.data.invocation === recent.data.invocation
          && event.data.role === 'nonfunctional-repair-engineer');
        const assessed = write === 'nonfunctional-assessed' &&
          (await runEventsOnDisk(fixture.root, 'review-notes', id)).filter(event => event.type === 'nonfunctional-assessed').length === 2;
        if (boundary === 'writer-acquired' && !(await runEventsOnDisk(fixture.root, 'review-notes', id)).some(event => event.type === 'nonfunctional-repair-assigned')) return;
        if (boundary === 'invocation-ended' && !repairStarted) return;
        if (boundary === 'nonfunctional-assessed' && !assessed) return;
        frozen = true;
        await freeze();
      },
    });
    const receipt = await first.service.execute(startRun('review-notes'));
    runId = receipt.jobId;
    await until(() => frozen, 30_000);
    await staleCrashLock(fixture.root);
    if (mutateBeforeResume) { await writeFile(join(fixture.root, 'downtime-mutation.ts'), 'export const changed = true;\n'); boundaryAnswers.drift('downtime-mutation.ts'); }
    const resumedAgent = repairAgent(fixture.root, obligation, boundaryAnswers);
    const reopened = await openRuns(fixture.root, { ...boundaryAnswers.options, agent: resumedAgent });
    cleanups.push(() => reopened.service.close());
    await reopened.service.settled('review-notes', runId);
    const events = await runEventsOnDisk(fixture.root, 'review-notes', runId);
    if (mutateBeforeResume) expect(await readFile(join(fixture.root, 'downtime-mutation.ts'), 'utf8')).toBe('export const changed = true;\n');
    {
      expect(onlyRun(reopened.service, 'review-notes').state, JSON.stringify(onlyRun(reopened.service, 'review-notes').failure)).toBe('completed');
      expect(events.filter(event => event.type === 'nonfunctional-repair-assigned')).toHaveLength(1);
      expect(events.filter(event => event.type === 'nonfunctional-repair-committed')).toHaveLength(1);
      expect(events.filter(event => event.type === 'nonfunctional-assessed')).toHaveLength(2);
      expect(events.filter(event => event.type === 'nonfunctional-round-closed')).toHaveLength(1);
      expect(firstAgent.sessions.filter(session => session.spec.role === 'nonfunctional-repair-engineer').length
        + resumedAgent.sessions.filter(session => session.spec.role === 'nonfunctional-repair-engineer').length).toBe(1);
      // The repair engineer is a writer like any other: it has a scope
      // size, measured under the current policy, and its line events.
      const repair = events.filter(event => event.type === 'invocation-started' && event.data.role === 'nonfunctional-repair-engineer').at(-1);
      const id = repair?.type === 'invocation-started' ? repair.data.invocation : '';
      const invocation = JSON.parse(await readFile(runPath(fixture.root, 'review-notes', runId, runLayout.invocation(id)), 'utf8')) as Invocation;
      expect(invocation.writer).toBe(true);
      expect(invocation.scope.size).toMatchObject({ policy: 'scope-size/2', components: expect.arrayContaining([expect.objectContaining({ component: 'owned-source' })]) });
      // A crash once it ended leaves no snapshot after it; the line events
      // are then missing, which leaves a shared commit unattributed, not zero.
      if (boundary !== 'invocation-ended') {
        expect(JSON.parse(await readFile(runPath(fixture.root, 'review-notes', runId, runLayout.lineEvents(id)), 'utf8'))).toMatchObject({ schema: 'ramify-agent.line-events/1', invocation: id });
      }
    }
  }, 60_000);
}

function exhaustedAgent(obligation: string) {
  return createScriptedAgent(withDefaultTurns(spec => {
    if (spec.submission.name === intakeToolName) return submit(intake(obligation));
    if (spec.role === 'initial-architect') return submit(analysis([]));
    if (spec.submission.name === coordinatorAssessmentToolName) return submit({ kind: 'assessment', results: [{
      nfr: 'nfr-001', result: 'not-satisfied', inspectedScope: ['src/'], evidence: ['Audit record absent'], uncertainty: '',
    }] });
    if (spec.submission.name === coordinatorActionToolName) return submit({ kind: 'close', deviations: [{
      nfr: 'nfr-001', proposedAlternative: null, uncertainty: 'No supported alternative is known',
    }] });
    return [];
  }));
}

test('a coordinator command registration retains its settlement requirement after restart', async () => {
  const fixture = await copyFixture(); cleanups.push(fixture.remove);
  const boundaryAnswers = nfrBoundaries(fixture.root); answers.push(boundaryAnswers);
  const obligation = 'The review must retain an audit record.';
  const plan = join(fixture.root, 'plans/review-notes/plan.md');
  await writeFile(plan, `${await readFile(plan, 'utf8')}\n${obligation}\n`);
  const agent = createScriptedAgent(withDefaultTurns(spec => {
    if (spec.submission.name === intakeToolName) return submit(intake(obligation));
    if (spec.role === 'initial-architect') return submit(analysis([]));
    if (spec.submission.name === coordinatorAssessmentToolName) return [{ kind: 'tool', tool: 'shell', input: { command: 'git log -1' } }];
    return [];
  }));
  let frozen = false;
  let release!: () => void;
  const formerProcess = new Promise<void>(resolve => { release = resolve; });
  const first = await openRuns(fixture.root, { ...boundaryAnswers.options, agent,
    commandExecution: async request => {
      await request.registerProcessGroup!(42, 'scripted-process');
      throw new Error('The registration barrier is frozen');
    },
    afterWrite: async write => { if (write === 'writer-process-registered') { frozen = true; await formerProcess; } },
  });
  const receipt = await first.service.execute(startRun('review-notes'));
  await until(() => frozen || first.service.getRun('review-notes', receipt.jobId)?.state !== 'running', 10_000);
  expect(frozen, JSON.stringify(first.service.getRun('review-notes', receipt.jobId)?.failure)).toBe(true);
  await staleCrashLock(fixture.root);
  const resumedAgent = exhaustedAgent(obligation);
  let reopenedReady = false;
  const opening = openRuns(fixture.root, { ...boundaryAnswers.options, agent: resumedAgent }).then(value => { reopenedReady = true; return value; });
  await new Promise(resolve => setTimeout(resolve, 30));
  expect(reopenedReady).toBe(false); expect(resumedAgent.sessions).toHaveLength(0);
  release();
  const reopened = await opening;
  cleanups.push(() => reopened.service.close());
  await reopened.service.settled('review-notes', receipt.jobId);
  expect(onlyRun(reopened.service, 'review-notes').state, JSON.stringify(onlyRun(reopened.service, 'review-notes').failure)).toBe('completed');
  expect(resumedAgent.sessions.length).toBeGreaterThan(0);
  const events = await runEventsOnDisk(fixture.root, 'review-notes', receipt.jobId);
  expect(events.filter(event => event.type === 'writer-process-registered')).toHaveLength(1);
  expect(events.filter(event => event.type === 'job-completed')).toHaveLength(1);
}, 30_000);

test('a closed round exhausts and a late source change still refuses the final gate', async () => {
  const fixture = await copyFixture();
  cleanups.push(fixture.remove);
  const boundaryAnswers = nfrBoundaries(fixture.root);
  answers.push(boundaryAnswers);
  const obligation = 'The review must retain an audit record.';
  const plan = join(fixture.root, 'plans/review-notes/plan.md');
  await writeFile(plan, `${await readFile(plan, 'utf8')}\n${obligation}\n`);
  boundaryAnswers.afterFinalAudit = async () => {
    await writeFile(join(fixture.root, 'late-after-exhaustion.ts'), 'export const stale = true;\n');
    boundaryAnswers.drift('late-after-exhaustion.ts');
  };
  const { service } = await openRuns(fixture.root, { ...boundaryAnswers.options,
    agent: exhaustedAgent(obligation) });
  cleanups.push(() => service.close());
  const receipt = await service.execute(startRun('review-notes'));
  await service.settled('review-notes', receipt.jobId);
  const events = await runEventsOnDisk(fixture.root, 'review-notes', receipt.jobId);
  expect(events.filter(event => event.type === 'nonfunctional-assessed')).toHaveLength(1);
  expect(events.filter(event => event.type === 'nonfunctional-round-closed').map(event => event.data.outcome)).toEqual(['exhausted']);
  expect(onlyRun(service, 'review-notes').failure?.reason).toBe('inputs-changed');
  expect(events.filter(event => event.type === 'job-completed')).toHaveLength(0);
  expect(await readFile(join(fixture.root, 'late-after-exhaustion.ts'), 'utf8')).toBe('export const stale = true;\n');
}, 60_000);

test('an exhausted crash with changed source fails ordinary candidate verification', async () => {
  const fixture = await copyFixture();
  cleanups.push(fixture.remove);
  const boundaryAnswers = nfrBoundaries(fixture.root, { final: false, finalLookup: true, lookups: 2, commits: 1 });
  answers.push(boundaryAnswers);
  const obligation = 'The review must retain an audit record.';
  const plan = join(fixture.root, 'plans/review-notes/plan.md');
  await writeFile(plan, `${await readFile(plan, 'utf8')}\n${obligation}\n`);
  let frozen = false;
  const first = await openRuns(fixture.root, { ...boundaryAnswers.options, agent: exhaustedAgent(obligation),
    afterWrite: async (write, id) => {
      if (write !== 'gate-committing') return;
      const closed = (await runEventsOnDisk(fixture.root, 'review-notes', id))
        .filter(event => event.type === 'nonfunctional-round-closed');
      if (closed.length === 1) { frozen = true; await freeze(); }
    },
  });
  const receipt = await first.service.execute(startRun('review-notes'));
  await until(() => frozen, 30_000);
  await staleCrashLock(fixture.root);
  await writeFile(join(fixture.root, 'changed-after-exhaustion.ts'), 'export const changed = true;\n');
  boundaryAnswers.drift('changed-after-exhaustion.ts');
  const reopened = await openRuns(fixture.root, { ...boundaryAnswers.options, agent: exhaustedAgent(obligation) });
  cleanups.push(() => reopened.service.close());
  await until(async () => {
    const version = reopened.service.getRun('review-notes', receipt.jobId)!.version;
    return (await new RunQueries(createQuerySource(reopened.service)).mergeReadiness('review-notes', receipt.jobId, version)).readiness.status === 'gate-failed';
  });
  const events = await runEventsOnDisk(fixture.root, 'review-notes', receipt.jobId);
  expect(events.filter(event => event.type === 'nonfunctional-round-closed').map(event => event.data.outcome))
    .toEqual(['exhausted']);
  expect(events.filter(event => event.type === 'job-completed')).toHaveLength(0);
  expect(await readFile(join(fixture.root, 'changed-after-exhaustion.ts'), 'utf8')).toBe('export const changed = true;\n');
  const version = reopened.service.getRun('review-notes', receipt.jobId)!.version;
  expect((await new RunQueries(createQuerySource(reopened.service)).mergeReadiness('review-notes', receipt.jobId, version)).readiness.status)
    .toBe('gate-failed');
  if (onlyRun(reopened.service, 'review-notes').state === 'running') {
    await reopened.service.execute(stopRun('review-notes', receipt.jobId, reopened.service.getRun('review-notes', receipt.jobId)!.version));
    await reopened.service.settled('review-notes', receipt.jobId);
  }
}, 60_000);
