import { rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterAll, afterEach, beforeEach, expect, test, vi } from 'vitest';
import { coordinatorActionToolName, coordinatorAssessmentToolName } from '../nonfunctional/submissions.js';
import { intakeToolName } from '../../../planning/src/extraction.js';
import type { CheckFindingUserCommand } from '../../../../../../src/interfaces/protocol/check-findings.js';
import { RunQueries } from '../../../../../projections/src/queries.js';
import { CommandRejection } from '../../../../../../src/jobs/commands.js';
import { createQuerySource } from '../../../../../../src/http/query-source.js';
import { copyFixture } from '../../../../../../src/tests/helpers/fixture.js';
import { onlyRun, openRuns, runEventsOnDisk, startRun, stopRun, testPolicy, until } from '../../../../../../src/tests/helpers/runs.js';

import { nfrBoundaries } from './helpers/nonfunctional-boundaries.js';
import { resetSpawnAttempts, spawnAttempts } from '../../../../../../src/tests/helpers/process-guard.js';
vi.mock('node:child_process', async importOriginal => {
  const { guardedChildProcess } = await import('../../../../../../src/tests/helpers/process-guard.js');
  return guardedChildProcess(await importOriginal<typeof import('node:child_process')>());
});
beforeEach(resetSpawnAttempts);
const answers: ReturnType<typeof nfrBoundaries>[] = [];

const plan = 'review-notes';
const quote = 'The service must answer within 50 milliseconds.';
const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  const errors: unknown[] = [];
  for (const cleanup of cleanups.splice(0).reverse()) try { await cleanup(); } catch (error) { errors.push(error); }
  for (const answer of answers.splice(0)) try { answer.assertComplete(); } catch (error) { errors.push(error); }
  try { expect(spawnAttempts(), 'ordinary NFR setup/flow/teardown process attempts').toEqual([]); } catch (error) { errors.push(error); }
  if (errors.length) throw new AggregateError(errors, 'NFR fixture teardown failed');
});
const browserCases: Record<string, unknown> = {};
const trial: Record<string, unknown> = {};
afterAll(async () => {
  const target = process.env.PLAN13_READINESS_EXPORT;
  if (target) await writeFile(target, JSON.stringify({
    source: { kind: 'run-ledger-projection', test: 'nonfunctional-deviation-runtime.test.ts' },
    expected: { quote, sourcePath: `plans/${plan}/plan.md` }, trial, cases: browserCases,
  }, null, 2));
});

async function captureBrowserCase(name: string, queries: RunQueries, runId: string, version: number) {
  if (!process.env.PLAN13_READINESS_EXPORT) return;
  const page = await queries.events(plan, runId, 0);
  const findings = await queries.checkFindings(plan, runId,
    { workItem: null, module: null, select: 'all', order: 'attention', after: null, limit: 20 }, version);
  const details: Record<string, unknown> = {};
  for (const finding of findings.items) details[finding.id] = await queries.checkFinding(plan, runId, finding.id, version);
  browserCases[name] = { run: page.run, events: page.events, readiness: await queries.mergeReadiness(plan, runId, version),
    findings, details };
}

/** The intake reads the one non-functional requirement; the architect finds nothing functional to place. */
const intake = { goal: 'Answer review notes quickly.', elements: [
  { key: 'latency', kind: 'non-functional', document: 'doc-001', text: quote, conditions: [], uncertainty: '' },
], incorporation: { documents: [{ document: 'doc-001', scenarios: true, uncertainty: '' }], missing: [] } };
const analysis = { elements: [], entries: [], hypotheses: [], coverageLimits: [], scenarios: [], integrationScenarios: [] };

async function startExhaustedRun(options: { finalGateFails?: boolean;
  pauseAudit?: { entered(): void; wait(): Promise<void> };
  pauseAssessment?: { entered(): void; wait(): Promise<void> };
  beforeSettled?: (types: () => string[]) => Promise<void> } = {}) {
  const fixture = await copyFixture();
  cleanups.push(fixture.remove);
  const boundaryAnswers = nfrBoundaries(fixture.root, { finalGateFails: options.finalGateFails });
  answers.push(boundaryAnswers);
  await writeFile(join(fixture.root, 'plans', plan, 'plan.md'), `# Review notes\n\n${quote}\n`);
  const configuredAudit = { ...boundaryAnswers.options.configuredAudit,
    run: async (input: Parameters<typeof boundaryAnswers.options.configuredAudit.run>[0]) => {
      if (input.attemptId !== 'ga-0001' && options.pauseAudit) {
        options.pauseAudit.entered();
        await options.pauseAudit.wait();
      }
      return boundaryAnswers.options.configuredAudit.run(input);
    } };
  const opened = await openRuns(fixture.root, { ...boundaryAnswers.options, configuredAudit,
    policy: root => testPolicy(root),
    script: spec => {
      if (spec.submission.name === intakeToolName) return [{ kind: 'submit', input: intake }];
      if (spec.role === 'initial-architect') return [{ kind: 'submit', input: analysis }];
      if (spec.submission.name === coordinatorAssessmentToolName) return [
        ...(options.pauseAssessment ? [{ kind: 'await' as const, until: () => {
          options.pauseAssessment!.entered(); return options.pauseAssessment!.wait();
        } }] : []), { kind: 'submit' as const, input: {
        kind: 'assessment', results: [{ nfr: 'nfr-001', result: 'not-satisfied',
          inspectedScope: ['subs/workspace'], evidence: ['Observed 87 milliseconds'], uncertainty: 'Load varies' }],
      } }];
      if (spec.submission.name === coordinatorActionToolName) return [{ kind: 'submit', input: {
        kind: 'close', deviations: [{ nfr: 'nfr-001', proposedAlternative: 'Use a cached read', uncertainty: 'Load varies' }],
      } }];
      if (options.finalGateFails && spec.role === 'global-fork') return [{ kind: 'end', message: 'No correction decision was submitted.' }];
      return [];
    },
  });
  cleanups.push(() => opened.service.close());
  const receipt = await opened.service.execute(startRun(plan));
  await options.beforeSettled?.(() => opened.service.events(plan, receipt.jobId)?.map(event => event.type) ?? []);
  if (options.finalGateFails) {
    await until(() => {
      const events = opened.service.events(plan, receipt.jobId);
      return events?.some(event => event.type === 'gate-attempted' && event.data.checkpoint === 'final') === true
        && events.some(event => event.type === 'nonfunctional-deviation-recorded');
    });
    for (let attempt = 0; attempt < 20; attempt += 1) {
      try {
        await opened.service.execute(stopRun(plan, receipt.jobId, opened.service.getRun(plan, receipt.jobId)!.version));
        break;
      } catch (error) {
        if (!(error instanceof CommandRejection) || error.code !== 'stale-version' || attempt === 19) throw error;
      }
    }
    await opened.service.settled(plan, receipt.jobId);
  }
  else await opened.service.settled(plan, receipt.jobId);
  return { fixture, opened, receipt, boundaryAnswers, queries: new RunQueries(createQuerySource(opened.service)) };
}

function heldCheck() {
  let entered!: () => void;
  let release!: () => void;
  const started = new Promise<void>(resolve => { entered = resolve; });
  const held = new Promise<void>(resolve => { release = resolve; });
  return { started, release: () => release(), pause: { entered: () => entered(), wait: () => held } };
}

test.each(['audit-first', 'assessment-first'] as const)('final audit and assessment overlap and join (%s)', async order => {
  const audit = heldCheck(), assessment = heldCheck();
  const result = await startExhaustedRun({ pauseAudit: audit.pause, pauseAssessment: assessment.pause,
    beforeSettled: async types => {
      try {
        await Promise.all([audit.started, assessment.started]);
        expect(types()).toContain('candidate-prepared');
        expect(types()).not.toContain('job-completed');
        if (order === 'audit-first') {
          audit.release();
          await until(() => types().includes('gate-attempted'));
          expect(types()).not.toContain('nonfunctional-assessed');
        } else {
          assessment.release();
          await until(() => types().includes('nonfunctional-assessed'));
          expect(types()).not.toContain('gate-attempted');
        }
        expect(types()).not.toContain('job-completed');
      } finally {
        audit.release(); assessment.release();
      }
    } });
  expect(onlyRun(result.opened.service, plan).state).toBe('completed');
  const events = await runEventsOnDisk(result.fixture.root, plan, result.receipt.jobId);
  expect(events.filter(event => event.type === 'candidate-prepared')).toHaveLength(1);
  expect(events.filter(event => event.type === 'nonfunctional-assessed')).toHaveLength(1);
  expect(events.filter(event => event.type === 'gate-attempted' && event.data.checkpoint === 'final')).toHaveLength(1);
}, 30_000);

test('an NFR-only exhausted run completes pending review with an exact source-bound CheckFinding', async () => {
  const { fixture, opened, receipt, queries } = await startExhaustedRun();
  expect(onlyRun(opened.service, plan).state).toBe('completed');
  const events = await runEventsOnDisk(fixture.root, plan, receipt.jobId);
  expect(events.filter(event => event.type === 'nonfunctional-round-closed')).toHaveLength(1);
  expect(events.filter(event => event.type === 'nonfunctional-assessed')).toHaveLength(1);
  const acceptedCatalog = events.find(event => event.type === 'analysis-accepted');
  const boundCandidate = events.find(event => event.type === 'candidate-bound-to-gate');
  if (acceptedCatalog?.type !== 'analysis-accepted' || !acceptedCatalog.data.evidence
    || boundCandidate?.type !== 'candidate-bound-to-gate') throw new Error('Missing accepted catalog or bound candidate');
  Object.assign(trial, { runId: receipt.jobId, catalogHash: acceptedCatalog.data.evidence.catalog.hash,
    roundsClosed: 1, assessments: 1, candidate: boundCandidate.data.candidate, tree: boundCandidate.data.tree,
    finalGate: boundCandidate.data.gate, gateCommit: boundCandidate.data.commit,
    deviations: events.filter(event => event.type === 'nonfunctional-deviation-recorded').length });
  expect(events.filter(event => event.type === 'nonfunctional-deviation-recorded')).toHaveLength(1);
  expect(events.filter(event => event.type === 'plan-deviation-recorded')).toHaveLength(0);
  expect(events.filter(event => event.type === 'work-item-started')).toHaveLength(0);
  expect(events.filter(event => event.type === 'unresolved-requested')).toHaveLength(0);
  const version = opened.service.getRun(plan, receipt.jobId)!.version;
  const readiness = await queries.mergeReadiness(plan, receipt.jobId, version);
  expect(readiness.readiness).toMatchObject({ status: 'pending-review', checkFindings: ['cf-0001'] });
  await captureBrowserCase('pending', queries, receipt.jobId, version);
  const findings = await queries.checkFindings(plan, receipt.jobId,
    { workItem: null, module: null, select: 'all', order: 'attention', after: null, limit: 20 }, version);
  expect(findings.items[0]?.planDeviation).toMatchObject({ origin: { kind: 'nonfunctional-assessment', nfr: 'nfr-001' },
    element: { id: 'nfr-001', document: 'doc-001', text: quote }, sourcePath: `plans/${plan}/plan.md`, proposedAlternative: 'Use a cached read' });
  const finding = findings.items[0]!;
  const request = finding.pendingUserDecision?.request;
  if (!request) throw new Error('Exhausted NFR has no user decision request');
  const gate = events.find(event => event.type === 'candidate-bound-to-gate');
  const accept: CheckFindingUserCommand = { commandId: 'accept-nfr-1', expectedVersion: version,
    type: 'respond-to-check-finding', payload: { planId: plan, jobId: receipt.jobId, responder: 'dan',
      checkFinding: finding.id, expectedRevision: finding.revision, request, option: 'accept' } };
  const accepted = await opened.service.execute(accept);
  expect(await opened.service.execute(accept)).toEqual(accepted);
  const afterAccept = opened.service.getRun(plan, receipt.jobId)!.version;
  expect((await queries.mergeReadiness(plan, receipt.jobId, afterAccept)).readiness.status).toBe('ready');
  await captureBrowserCase('accepted', queries, receipt.jobId, afterAccept);
  expect((await runEventsOnDisk(fixture.root, plan, receipt.jobId)).filter(event => event.type === 'candidate-bound-to-gate')).toEqual(gate ? [gate] : []);
  const revoke: CheckFindingUserCommand = { commandId: 'revoke-nfr-1', expectedVersion: afterAccept,
    type: 'revoke-check-finding-waiver', payload: { planId: plan, jobId: receipt.jobId, responder: 'dan',
      checkFinding: finding.id, expectedRevision: finding.revision + 1, reason: 'Reconsider the delay' } };
  await opened.service.execute(revoke);
  const afterRevoke = opened.service.getRun(plan, receipt.jobId)!.version;
  expect((await queries.mergeReadiness(plan, receipt.jobId, afterRevoke)).readiness.status).toBe('pending-review');
  await expect(opened.service.execute({ ...accept, commandId: 'stale-nfr-1', expectedVersion: afterRevoke })).rejects.toMatchObject({ code: 'conflict' });
  expect((await queries.mergeReadiness(plan, receipt.jobId, afterRevoke)).readiness.status).toBe('pending-review');
  trial.acceptedAndRevokedCommands = (await runEventsOnDisk(fixture.root, plan, receipt.jobId))
    .filter(event => event.type === 'check-findings-recorded' && event.data.cause.kind === 'user-command').length;
  if (process.env.PLAN13_READINESS_EXPORT) {
    await rm(join(fixture.root, 'plans', plan, '.harness', 'jobs', receipt.jobId, acceptedCatalog.data.evidence.catalog.path));
    expect((await queries.mergeReadiness(plan, receipt.jobId, afterRevoke)).readiness.status).toBe('unavailable');
    await captureBrowserCase('source-unavailable', queries, receipt.jobId, afterRevoke);
  }
}, 30_000);

test('accepting an exhausted NFR cannot waive a failed final test gate', async () => {
  const { fixture, opened, receipt, queries } = await startExhaustedRun({ finalGateFails: true });
  const events = await runEventsOnDisk(fixture.root, plan, receipt.jobId);
  const failedGate = events.find(event => event.type === 'gate-attempted' && event.data.checkpoint === 'final');
  if (failedGate?.type !== 'gate-attempted') throw new Error('Missing failed final gate attempt');
  expect(failedGate.data.verdict).toBe('failed');
  const durableGate = await queries.gate(plan, receipt.jobId, failedGate.data.gate);
  expect(events.filter(event => event.type === 'nonfunctional-round-closed')).toHaveLength(1);
  expect(events.filter(event => event.type === 'nonfunctional-deviation-recorded')).toHaveLength(1);
  const version = opened.service.getRun(plan, receipt.jobId)!.version;
  expect((await queries.mergeReadiness(plan, receipt.jobId, version)).readiness.status).toBe('gate-failed');
  const findings = await queries.checkFindings(plan, receipt.jobId,
    { workItem: null, module: null, select: 'all', order: 'attention', after: null, limit: 20 }, version);
  const finding = findings.items[0]!;
  const request = finding.pendingUserDecision?.request;
  if (!request) throw new Error('Failed-gate run has no NFR decision request');
  await opened.service.execute({ commandId: 'accept-gate-failed-nfr', expectedVersion: version,
    type: 'respond-to-check-finding', payload: { planId: plan, jobId: receipt.jobId, responder: 'dan',
      checkFinding: finding.id, expectedRevision: finding.revision, request, option: 'accept' } });
  const after = opened.service.getRun(plan, receipt.jobId)!.version;
  expect((await queries.mergeReadiness(plan, receipt.jobId, after)).readiness.status).toBe('gate-failed');
  await captureBrowserCase('gate-failed', queries, receipt.jobId, after);
  expect((await runEventsOnDisk(fixture.root, plan, receipt.jobId)).filter(event => event.type === 'gate-attempted'
    && event.data.checkpoint === 'final')).toEqual([failedGate]);
  expect(await queries.gate(plan, receipt.jobId, failedGate.data.gate)).toEqual(durableGate);
}, 30_000);

test('a rejected NFR decision remains current after a ledger rebuild and requires follow-up', async () => {
  const { fixture, opened, receipt, queries, boundaryAnswers } = await startExhaustedRun();
  const version = opened.service.getRun(plan, receipt.jobId)!.version;
  const findings = await queries.checkFindings(plan, receipt.jobId,
    { workItem: null, module: null, select: 'all', order: 'attention', after: null, limit: 20 }, version);
  const finding = findings.items[0]!;
  const request = finding.pendingUserDecision?.request;
  if (!request) throw new Error('Exhausted NFR has no user decision request');
  const command: CheckFindingUserCommand = { commandId: 'reject-nfr-1', expectedVersion: version,
    type: 'respond-to-check-finding', payload: { planId: plan, jobId: receipt.jobId, responder: 'dan',
      checkFinding: finding.id, expectedRevision: finding.revision, request, option: 'reject',
      note: 'Rework the response path before merge' } };
  await opened.service.execute(command);
  const after = opened.service.getRun(plan, receipt.jobId)!.version;
  expect((await queries.mergeReadiness(plan, receipt.jobId, after)).readiness.status).toBe('rejected');
  await captureBrowserCase('rejected', queries, receipt.jobId, after);
  const rejected = await queries.checkFindings(plan, receipt.jobId,
    { workItem: null, module: null, select: 'all', order: 'attention', after: null, limit: 20 }, after);
  expect(rejected.items[0]?.planDeviation).toMatchObject({ followUp: 'Rework the response path before merge' });
  expect(rejected.items[0]?.standing).toBe('open');
  await opened.service.close();
  const reopened = await openRuns(fixture.root, { ...boundaryAnswers.options });
  cleanups.push(() => reopened.service.close());
  const rebuilt = new RunQueries(createQuerySource(reopened.service));
  const reconstructedVersion = reopened.service.getRun(plan, receipt.jobId)!.version;
  expect(reconstructedVersion).toBe(after);
  expect((await rebuilt.mergeReadiness(plan, receipt.jobId, reconstructedVersion)).readiness.status).toBe('rejected');
  expect((await rebuilt.checkFindings(plan, receipt.jobId,
    { workItem: null, module: null, select: 'all', order: 'attention', after: null, limit: 20 }, reconstructedVersion))
    .items[0]?.planDeviation).toMatchObject({ followUp: 'Rework the response path before merge' });
}, 30_000);
