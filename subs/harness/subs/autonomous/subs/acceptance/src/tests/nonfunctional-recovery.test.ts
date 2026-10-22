import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { copyFixture } from '../../../../../../src/tests/helpers/fixture.js';
import { createScriptedAgent } from '../../../../../agent/src/scripted.js';
import type { ConfiguredAuditPort } from '../../../../../audit/src/check-execution.js';
import { coordinatorAssessmentToolName, coordinatorActionToolName, nonfunctionalRepairToolName } from '../nonfunctional/submissions.js';
import { intakeToolName } from '../../../planning/src/extraction.js';
import { withDefaultTurns } from '../../../../../../src/tests/helpers/declarations.js';
import { analysis, currentAnalysis } from '../../../../../../src/tests/helpers/analysis.js';
import { submit, write } from '../../../../../../src/tests/helpers/iterations.js';
import { emptyAnalysis, freeze, onlyRun, openRuns, runEventsOnDisk, runPath, staleCrashLock, startRun, until } from '../../../../../../src/tests/helpers/runs.js';
import { runLayout } from '../../../../src/run/records.js';
import { type Invocation } from '../../../../../task-execution/src/records.js';

import { nfrBoundaries } from './helpers/nonfunctional-boundaries.js';
import { disposition, reconcile, submission } from '../../../../../../src/tests/helpers/check-findings-composition.js';
import { resetSpawnAttempts, spawnAttempts } from '../../../../../../src/tests/helpers/process-guard.js';
vi.mock('node:child_process', async importOriginal => {
  const { guardedChildProcess } = await import('../../../../../../src/tests/helpers/process-guard.js');
  return guardedChildProcess(await importOriginal<typeof import('node:child_process')>());
});
beforeEach(resetSpawnAttempts);
const answers: ReturnType<typeof nfrBoundaries>[] = [];

const cleanups: Array<() => Promise<void>> = [];
const instabilityFinding = (testId: string): string => {
  const identity = JSON.stringify({ projectRoot: '.', checkId: 'tests', command: 'vitest', runner: 'vitest', project: 'node',
    path: 'src/tests/retained-coverage.test.ts', testId });
  const observationKey = createHash('sha256').update(identity).digest('hex');
  return `finding:audit-instability-${createHash('sha256').update(observationKey).digest('hex').slice(0, 16)}`;
};
afterEach(async () => {
  const errors: unknown[] = [];
  for (const cleanup of cleanups.splice(0).reverse()) try { await cleanup(); } catch (error) { errors.push(error); }
  for (const answer of answers.splice(0)) try { answer.assertComplete(); } catch (error) { errors.push(error); }
  try { expect(spawnAttempts(), 'ordinary NFR setup/flow/teardown process attempts').toEqual([]); } catch (error) { errors.push(error); }
  if (errors.length) throw new AggregateError(errors, 'NFR fixture teardown failed');
});

// nonfunctional-phase replays every crash prefix of the phase.
test('a phase run resumes after candidate-prepared without repeating committed evidence', async () => {
  const fixture = await copyFixture();
  cleanups.push(fixture.remove);
  const boundaryAnswers = nfrBoundaries(fixture.root);
  answers.push(boundaryAnswers);
  let frozen = false;
  const first = await openRuns(fixture.root, { ...boundaryAnswers.options,
    script: [{ kind: 'submit', input: emptyAnalysis() }],
    afterWrite: async write => { if (write === 'candidate-prepared') { frozen = true; await freeze(); } },
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

/** An intake that reads the obligation as the plan's one non-functional requirement. */
function intake(obligation: string) {
  return { goal: 'Keep an audit record of reviews.', elements: [
    { key: 'draft:non-functional-requirement:audit-record', kind: 'non-functional', document: 'document:review-notes-plan', text: obligation, conditions: [], uncertainty: '' },
  ], incorporation: { documents: [{ document: 'document:review-notes-plan', scenarios: true, uncertainty: '' }], missing: [] } };
}

function repairAgent(root: string, obligation: string, boundaryAnswers: ReturnType<typeof nfrBoundaries>, judgeWarnings = false) {
  return createScriptedAgent(withDefaultTurns(spec => {
    if (judgeWarnings && spec.submission.name === 'submit_reconciliation' && spec.prompt.includes('# Reconciliation final-instability-'))
      return reconcile({ ...submission([
        disposition(instabilityFinding('first'), { action: 'waive', uncertainty: 'The original test remains unstable.' }),
        disposition(instabilityFinding('second'), { action: 'waive', uncertainty: 'The original test remains unstable.' }),
      ], { kind: 'complete' }), testOrigins: [
        { checkFinding: instabilityFinding('first'), origin: 'existing', basis: 'The original execution baseline contains this test.' },
        { checkFinding: instabilityFinding('second'), origin: 'existing', basis: 'The original execution baseline contains this test.' },
      ] });
    if (spec.submission.name === intakeToolName) return submit(intake(obligation));
    if (spec.role === 'initial-architect') return submit(currentAnalysis(analysis([]), 'document:review-notes-plan'));
    if (spec.submission.name === coordinatorAssessmentToolName) return submit({ kind: 'assessment', results: [{
      nfr: 'non-functional-requirement:audit-record', result: spec.prompt.includes('(after-repair)') ? 'satisfied' : 'not-satisfied',
      inspectedScope: ['subs/workspace/subs/reviews/subs/core/src'], evidence: ['Current source inspected'], uncertainty: '',
    }] });
    if (spec.submission.name === coordinatorActionToolName) return submit({ kind: 'repair', nfrs: ['non-functional-requirement:audit-record'],
      startingModule: 'collection-review/workspace/reviews/core', task: 'Add audit record source', evidence: [], uncertainty: '' });
    if (spec.submission.name === nonfunctionalRepairToolName) {
      boundaryAnswers.repair();
      const edit = write(join(root, 'subs/workspace/subs/reviews/subs/core/src/repair-recovery.ts'), 'export const auditRecord = true;\n');
      return submit({ kind: 'completed', summary: 'Audit record added', evidence: ['new source'], remaining: [] }, edit);
    }
    return [];
  }));
}

test('a retained unsatisfied assessment cannot repair source before between-observations final warning reports are reconciled', async () => {
  const fixture = await copyFixture(); cleanups.push(fixture.remove);
  const obligation = 'The review must retain an audit record.';
  const planPath = join(fixture.root, 'plans/review-notes/plan.md');
  await writeFile(planPath, `${await readFile(planPath, 'utf8')}\n${obligation}\n`);
  const boundaryAnswers = nfrBoundaries(fixture.root, { repair: 'one-module' });
  answers.push(boundaryAnswers);
  const baseAudit = boundaryAnswers.options.configuredAudit;
  const calls: string[] = [];
  const warningAudit = { read: baseAudit.read, async run(input: Parameters<typeof baseAudit.run>[0]) {
    calls.push(input.attemptId);
    const result = await baseAudit.run(input);
    if (input.attemptId !== 'ga-0002') return result;
    const provider = result.provider as { summary: Record<string, unknown> };
    return { ...result, provider: { ...provider, summary: { ...provider.summary,
      warningDispositions: ['first', 'second'].map(testId => ({ entry: {
        checkId: 'tests', command: 'vitest', runner: 'vitest', project: 'node',
        path: 'src/tests/retained-coverage.test.ts', kind: 'test', testId,
      }, basis: 'retained-instability' })), flakinessPolicy: { onFailure: 'warning' },
    } } };
  } } satisfies ConfiguredAuditPort;
  let frozen = false;
  const firstAgent = repairAgent(fixture.root, obligation, boundaryAnswers, true);
  const first = await openRuns(fixture.root, { ...boundaryAnswers.options, configuredAudit: warningAudit, agent: firstAgent });
  const service = first.service;
  const owner = service as unknown as { commitCheckFindings: (run: { record: { jobId: string } }, build: unknown) => Promise<unknown> };
  const original = owner.commitCheckFindings.bind(service);
  owner.commitCheckFindings = async (run, build) => {
    const result = await original(run, build);
    const reports = service.events('review-notes', run.record.jobId)!.filter(event => event.type === 'check-findings-recorded'
      && event.data.cause.kind === 'producer' && event.data.cause.producer === 'check:audit-instability');
    if (reports.length === 1) {
      await until(() => service.events('review-notes', run.record.jobId)!.some(event => event.type === 'nonfunctional-assessed'));
      frozen = true; await freeze();
    }
    return result;
  };
  const receipt = await service.execute(startRun('review-notes'));
  await until(() => frozen, 30_000);
  const before = await runEventsOnDisk(fixture.root, 'review-notes', receipt.jobId);
  expect(before.filter(event => event.type === 'nonfunctional-assessed')).toHaveLength(1);
  expect(before.filter(event => event.type === 'check-findings-recorded')).toHaveLength(1);
  expect(before.filter(event => event.type === 'nonfunctional-repair-assigned')).toHaveLength(0);
  await staleCrashLock(fixture.root);
  const resumedAgent = repairAgent(fixture.root, obligation, boundaryAnswers, true);
  const reopened = await openRuns(fixture.root, { ...boundaryAnswers.options, configuredAudit: warningAudit, agent: resumedAgent });
  cleanups.push(() => reopened.service.close());
  await reopened.service.settled('review-notes', receipt.jobId);
  const events = await runEventsOnDisk(fixture.root, 'review-notes', receipt.jobId);
  expect(onlyRun(reopened.service, 'review-notes').state, JSON.stringify(onlyRun(reopened.service, 'review-notes').failure)).toBe('completed');
  expect(calls.filter(id => id === 'ga-0002')).toHaveLength(1);
  expect(events.filter(event => event.type === 'check-findings-recorded')).toHaveLength(2);
  const reconciled = events.find(event => event.type === 'final-instability-reconciled');
  const repair = events.find(event => event.type === 'nonfunctional-repair-assigned');
  expect(reconciled?.type).toBe('final-instability-reconciled');
  expect(repair?.type).toBe('nonfunctional-repair-assigned');
  expect(reconciled!.sequence).toBeLessThan(repair!.sequence);
  if (reconciled?.type === 'final-instability-reconciled') {
    expect(reconciled.data.checkFindings.map(change => change.type === 'check-finding-decided'
      ? change.data.checkFinding : null)).toEqual([instabilityFinding('first'), instabilityFinding('second')]);
  }
  expect(events.filter(event => event.type === 'nonfunctional-assessed')).toHaveLength(2);
  expect(events.filter(event => event.type === 'gate-attempted' && event.data.checkpoint === 'final')).toHaveLength(2);
}, 90_000);

// nonfunctional-phase replays the repair prefixes; nonfunctional-repair owns an
// ended repair engineer without a result.
test('a repair phase nonfunctional-repair-assigned crash retains downtime edits through ordinary repair', async () => {
  const fixture = await copyFixture();
  cleanups.push(fixture.remove);
  const boundaryAnswers = nfrBoundaries(fixture.root, { repair: 'one-module' });
  answers.push(boundaryAnswers);
  const obligation = 'The review must retain an audit record.';
  const plan = join(fixture.root, 'plans/review-notes/plan.md');
  await writeFile(plan, `${await readFile(plan, 'utf8')}\n${obligation}\n`);
  const firstAgent = repairAgent(fixture.root, obligation, boundaryAnswers);
  let frozen = false;
  const first = await openRuns(fixture.root, { ...boundaryAnswers.options, agent: firstAgent,
    afterWrite: async write => { if (write === 'nonfunctional-repair-assigned') { frozen = true; await freeze(); } },
  });
  const receipt = await first.service.execute(startRun('review-notes'));
  const runId = receipt.jobId;
  await until(() => frozen, 30_000);
  await staleCrashLock(fixture.root);
  await writeFile(join(fixture.root, 'downtime-mutation.ts'), 'export const changed = true;\n');
  boundaryAnswers.drift('downtime-mutation.ts');
  const resumedAgent = repairAgent(fixture.root, obligation, boundaryAnswers);
  const reopened = await openRuns(fixture.root, { ...boundaryAnswers.options, agent: resumedAgent });
  cleanups.push(() => reopened.service.close());
  await reopened.service.settled('review-notes', runId);
  const events = await runEventsOnDisk(fixture.root, 'review-notes', runId);
  expect(await readFile(join(fixture.root, 'downtime-mutation.ts'), 'utf8')).toBe('export const changed = true;\n');
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
  expect(JSON.parse(await readFile(runPath(fixture.root, 'review-notes', runId, runLayout.lineEvents(id)), 'utf8'))).toMatchObject({ schema: 'ramify-agent.line-events/1', invocation: id });
}, 60_000);

function exhaustedAgent(obligation: string) {
  return createScriptedAgent(withDefaultTurns(spec => {
    if (spec.submission.name === intakeToolName) return submit(intake(obligation));
    if (spec.role === 'initial-architect') return submit(currentAnalysis(analysis([]), 'document:review-notes-plan'));
    if (spec.submission.name === coordinatorAssessmentToolName) return submit({ kind: 'assessment', results: [{
      nfr: 'non-functional-requirement:audit-record', result: 'not-satisfied', inspectedScope: ['src/'], evidence: ['Audit record absent'], uncertainty: '',
    }] });
    if (spec.submission.name === coordinatorActionToolName) return submit({ kind: 'close', deviations: [{
      nfr: 'non-functional-requirement:audit-record', deviationKey: 'draft:plan-deviation:audit-record',
      findingKey: 'draft:finding:audit-record', proposedAlternative: null, uncertainty: 'No supported alternative is known',
    }] });
    return [];
  }));
}

test('a source change during concurrent final checks refuses the prepared candidate', async () => {
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
  expect(events.filter(event => event.type === 'nonfunctional-assessed')).toHaveLength(0);
  expect(events.filter(event => event.type === 'nonfunctional-round-closed')).toHaveLength(0);
  expect(onlyRun(service, 'review-notes').failure?.reason).toBe('inputs-changed');
  expect(events.filter(event => event.type === 'job-completed')).toHaveLength(0);
  expect(await readFile(join(fixture.root, 'late-after-exhaustion.ts'), 'utf8')).toBe('export const stale = true;\n');
}, 60_000);

test('a prepared final candidate changed during a crash fails ordinary recovery', async () => {
  const fixture = await copyFixture();
  cleanups.push(fixture.remove);
  const boundaryAnswers = nfrBoundaries(fixture.root, { final: false, finalLookup: true, lookups: 1, commits: 1 });
  answers.push(boundaryAnswers);
  const obligation = 'The review must retain an audit record.';
  const plan = join(fixture.root, 'plans/review-notes/plan.md');
  await writeFile(plan, `${await readFile(plan, 'utf8')}\n${obligation}\n`);
  let frozen = false;
  const first = await openRuns(fixture.root, { ...boundaryAnswers.options, agent: exhaustedAgent(obligation),
    afterWrite: async (write, id) => {
      if (write !== 'gate-committing') return;
      const prepared = (await runEventsOnDisk(fixture.root, 'review-notes', id))
        .filter(event => event.type === 'candidate-prepared');
      if (prepared.length === 1) { frozen = true; await freeze(); }
    },
  });
  const receipt = await first.service.execute(startRun('review-notes'));
  await until(() => frozen, 30_000);
  await staleCrashLock(fixture.root);
  await writeFile(join(fixture.root, 'changed-after-exhaustion.ts'), 'export const changed = true;\n');
  boundaryAnswers.drift('changed-after-exhaustion.ts');
  await expect(openRuns(fixture.root, { ...boundaryAnswers.options, agent: exhaustedAgent(obligation) }))
    .rejects.toThrow('The pending final effect candidate changed after preparation');
  const events = await runEventsOnDisk(fixture.root, 'review-notes', receipt.jobId);
  expect(events.filter(event => event.type === 'nonfunctional-round-closed')).toHaveLength(0);
  expect(events.filter(event => event.type === 'job-completed')).toHaveLength(0);
  expect(await readFile(join(fixture.root, 'changed-after-exhaustion.ts'), 'utf8')).toBe('export const changed = true;\n');
}, 60_000);
