import { rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { coordinatorActionToolName, coordinatorAssessmentToolName } from '../nonfunctional/submissions.js';
import { intakeToolName } from '../../../planning/src/extraction.js';
import type { CheckFindingUserCommand } from '../../../../../../src/interfaces/protocol/check-findings.js';
import { RunQueries } from '../../../../../projections/src/queries.js';
import { CommandRejection } from '../../../../../../src/jobs/commands.js';
import { createQuerySource } from '../../../../../../src/http/query-source.js';
import { copyFixture } from '../../../../../../src/tests/helpers/fixture.js';
import { onlyRun, openRuns, runEventsOnDisk, runPath, startRun, stopRun, testPolicy, until } from '../../../../../../src/tests/helpers/runs.js';

import { nfrBoundaries } from './helpers/nonfunctional-boundaries.js';
import { currentAnalysis } from '../../../../../../src/tests/helpers/analysis.js';
import { concern, report } from '../../../../../../src/tests/helpers/check-findings.js';
import { runLayout } from '../../../../src/run/records.js';
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
/** The intake reads the one non-functional requirement; the architect finds nothing functional to place. */
const intake = { goal: 'Answer review notes quickly.', elements: [
  { key: 'draft:non-functional-requirement:case-001', kind: 'non-functional', document: 'document:review-notes-plan', text: quote, conditions: [], uncertainty: '' },
], incorporation: { documents: [{ document: 'document:review-notes-plan', scenarios: true, uncertainty: '' }], missing: [] } };
const analysis = currentAnalysis({ elements: [], entries: [], hypotheses: [], coverageLimits: [], scenarios: [], integrationScenarios: [] }, 'document:review-notes-plan');

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
        kind: 'assessment', results: [{ nfr: 'non-functional-requirement:case-001', result: 'not-satisfied',
          inspectedScope: ['subs/workspace'], evidence: ['Observed 87 milliseconds'], uncertainty: 'Load varies' }],
      } }];
      if (spec.submission.name === coordinatorActionToolName) return [{ kind: 'submit', input: {
        kind: 'close', deviations: [{ nfr: 'non-functional-requirement:case-001', deviationKey: 'draft:plan-deviation:case-0001',
          findingKey: 'draft:finding:case-0001', proposedAlternative: 'Use a cached read', uncertainty: 'Load varies' }],
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
        && events.some(event => event.type === 'nonfunctional-deviations-recorded');
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
  expect(events.filter(event => event.type === 'nonfunctional-deviations-recorded')).toHaveLength(1);
  const deviation = events.find(event => event.type === 'nonfunctional-deviations-recorded');
  if (deviation?.type !== 'nonfunctional-deviations-recorded') throw new Error('Missing nonfunctional deviation');
  expect(deviation.data.checkFindings.find(event => event.type === 'check-finding-opened')?.data.version).toBe(2);
  expect(events.filter(event => event.type === 'plan-deviation-recorded')).toHaveLength(0);
  expect(events.filter(event => event.type === 'work-item-started')).toHaveLength(0);
  expect(events.filter(event => event.type === 'unresolved-requested')).toHaveLength(0);
  const version = opened.service.getRun(plan, receipt.jobId)!.version;
  const readiness = await queries.mergeReadiness(plan, receipt.jobId, version);
  expect(readiness.readiness).toMatchObject({ status: 'pending-review', checkFindings: ['finding:case-0001'] });
  const findings = await queries.checkFindings(plan, receipt.jobId,
    { workItem: null, module: null, select: 'all', order: 'attention', after: null, limit: 20 }, version);
  expect(findings.items[0]?.planDeviation).toMatchObject({ origin: { kind: 'nonfunctional-assessment', nfr: 'non-functional-requirement:case-001' },
    element: { id: 'non-functional-requirement:case-001', document: 'document:review-notes-plan', text: quote }, sourcePath: `plans/${plan}/plan.md`, proposedAlternative: 'Use a cached read' });
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
  expect((await runEventsOnDisk(fixture.root, plan, receipt.jobId)).filter(event => event.type === 'candidate-bound-to-gate')).toEqual(gate ? [gate] : []);
  const revoke: CheckFindingUserCommand = { commandId: 'revoke-nfr-1', expectedVersion: afterAccept,
    type: 'revoke-check-finding-waiver', payload: { planId: plan, jobId: receipt.jobId, responder: 'dan',
      checkFinding: finding.id, expectedRevision: finding.revision + 1, reason: 'Reconsider the delay' } };
  await opened.service.execute(revoke);
  const afterRevoke = opened.service.getRun(plan, receipt.jobId)!.version;
  expect((await queries.mergeReadiness(plan, receipt.jobId, afterRevoke)).readiness.status).toBe('pending-review');
  await expect(opened.service.execute({ ...accept, commandId: 'stale-nfr-1', expectedVersion: afterRevoke })).rejects.toMatchObject({ code: 'conflict' });
  expect((await queries.mergeReadiness(plan, receipt.jobId, afterRevoke)).readiness.status).toBe('pending-review');
}, 30_000);

test('accepting an exhausted NFR cannot waive a failed final test gate', async () => {
  const { fixture, opened, receipt, queries } = await startExhaustedRun({ finalGateFails: true });
  const events = await runEventsOnDisk(fixture.root, plan, receipt.jobId);
  const failedGate = events.find(event => event.type === 'gate-attempted' && event.data.checkpoint === 'final');
  if (failedGate?.type !== 'gate-attempted') throw new Error('Missing failed final gate attempt');
  expect(failedGate.data.verdict).toBe('failed');
  const durableGate = await queries.gate(plan, receipt.jobId, failedGate.data.gate);
  expect(events.filter(event => event.type === 'nonfunctional-round-closed')).toHaveLength(1);
  expect(events.filter(event => event.type === 'nonfunctional-deviations-recorded')).toHaveLength(1);
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

test('a descriptive two-requirement close corrects an intervening name collision and survives reload', async () => {
  const fixture = await copyFixture(); cleanups.push(fixture.remove);
  const boundaryAnswers = nfrBoundaries(fixture.root); answers.push(boundaryAnswers);
  await writeFile(join(fixture.root, 'plans', plan, 'plan.md'), `# Review notes\n\n${quote}\n\nThe service must preserve a 30 second timeout.\n`);
  type Opened = Awaited<ReturnType<typeof openRuns>>;
  let opened: Opened | undefined;
  let activeRunId: string | undefined;
  let injected = false;
  const git = { ...boundaryAnswers.options.git,
    previewCandidateTree: async (...args: Parameters<NonNullable<typeof boundaryAnswers.options.git>['previewCandidateTree']>) => {
      const preview = await boundaryAnswers.options.git.previewCandidateTree(...args);
      const service = opened?.service;
      if (!injected && service && activeRunId && service.events(plan, activeRunId)?.some(event => event.type === 'nonfunctional-round-closed')) {
        injected = true;
        const occupied = report({ ...concern({ key: 'external-close-name' }), findingKey: 'draft:finding:preserve-service-timeout' });
        const result = await service.recordCheckFindings(plan, activeRunId, {
          cause: { kind: 'producer', producer: 'review:code', attempt: 'external-close-collision' }, commands: [occupied],
        });
        expect(result?.kind).toBe('committed');
      }
      return preview;
    },
  };
  let closeCalls = 0;
  opened = await openRuns(fixture.root, { ...boundaryAnswers.options, git,
    policy: root => testPolicy(root), script: spec => {
      if (spec.submission.name === intakeToolName) {
        const document = [...spec.prompt.matchAll(/document:[a-z0-9-]+/gu)][0]?.[0];
        if (!document) throw new Error('Missing descriptive plan document');
        return [{ kind: 'submit', input: { goal: 'Preserve response properties.', elements: [
          { key: 'draft:non-functional-requirement:answer-quickly', kind: 'non-functional', document,
            text: quote, conditions: [], uncertainty: '' },
          { key: 'draft:non-functional-requirement:preserve-timeout', kind: 'non-functional', document,
            text: 'The service must preserve a 30 second timeout.', conditions: [], uncertainty: '' },
        ], incorporation: { documents: [{ document, scenarios: true, uncertainty: '' }], missing: [] } } }];
      }
      if (spec.submission.name === 'submit_principle_elements') return [{ kind: 'submit', input: { elements: [] } }];
      if (spec.submission.name === 'submit_catalog_check') return [{ kind: 'submit', input: { corrections: [], entries: [], scenarios: [] } }];
      if (spec.role === 'initial-architect') return [{ kind: 'submit', input: analysis }];
      if (spec.submission.name === coordinatorAssessmentToolName) return [{ kind: 'submit', input: { kind: 'assessment', results: [
        { nfr: 'non-functional-requirement:answer-quickly', result: 'not-satisfied', inspectedScope: ['subs/workspace'], evidence: ['87 milliseconds'], uncertainty: 'Load varies' },
        { nfr: 'non-functional-requirement:preserve-timeout', result: 'not-satisfied', inspectedScope: ['subs/workspace'], evidence: ['45 seconds'], uncertainty: 'Configuration varies' },
      ] } }];
      if (spec.submission.name === coordinatorActionToolName) {
        closeCalls += 1;
        if (closeCalls === 2) {
          const source = opened?.service.committed(plan, activeRunId!);
          expect(source?.entries.some(line => line.transaction.event.type === 'nonfunctional-deviations-recorded')).toBe(false);
          expect(source?.entries.flatMap(line => line.transaction.records)
            .some(record => (record.body as { schema?: string }).schema === 'ramify-agent.nonfunctional-deviation/2')).toBe(false);
        }
        const suffix = closeCalls === 1 ? 'preserve-service-timeout' : 'preserve-service-timeout-qualified';
        return [{ kind: 'submit', input: { kind: 'close', deviations: [
          { nfr: 'non-functional-requirement:answer-quickly', deviationKey: 'draft:plan-deviation:answer-quickly',
            findingKey: 'draft:finding:answer-quickly', proposedAlternative: 'Use a cached read', uncertainty: 'Load varies' },
          { nfr: 'non-functional-requirement:preserve-timeout', deviationKey: `draft:plan-deviation:${suffix}`,
            findingKey: `draft:finding:${suffix}`, proposedAlternative: 'Configure 30 seconds', uncertainty: 'Configuration varies' },
        ] } }];
      }
      return [];
    },
  });
  cleanups.push(() => opened!.service.close());
  const receipt = await opened.service.execute(startRun(plan));
  activeRunId = receipt.jobId;
  await opened.service.settled(plan, receipt.jobId);
  const events = await runEventsOnDisk(fixture.root, plan, receipt.jobId);
  expect(injected).toBe(true);
  expect(closeCalls).toBe(2);
  const batches = events.filter(event => event.type === 'nonfunctional-deviations-recorded');
  expect(batches).toHaveLength(1);
  expect(batches[0]!.data.deviations).toHaveLength(2);
  expect(batches[0]!.data.deviations.map(entry => entry.deviation)).toEqual([
    'plan-deviation:answer-quickly', 'plan-deviation:preserve-service-timeout-qualified',
  ]);
  expect(batches[0]!.data.checkFindings.filter(event => event.type === 'check-finding-opened')).toHaveLength(2);
  expect(events.at(-1)).toMatchObject({ type: 'job-completed', data: { planDeviations: 2 } });
  const queries = new RunQueries(createQuerySource(opened.service));
  const version = opened.service.getRun(plan, receipt.jobId)!.version;
  expect((await queries.mergeReadiness(plan, receipt.jobId, version)).readiness).toMatchObject({ status: 'pending-review',
    checkFindings: ['finding:answer-quickly', 'finding:preserve-service-timeout-qualified'] });
  await opened.service.close();
  await rm(runPath(fixture.root, plan, receipt.jobId, runLayout.nonfunctionalDeviation(batches[0]!.data.deviations[1]!.deviation)));
  const reloaded = await openRuns(fixture.root, { ...boundaryAnswers.options });
  cleanups.push(() => reloaded.service.close());
  const rebuilt = new RunQueries(createQuerySource(reloaded.service));
  expect((await runEventsOnDisk(fixture.root, plan, receipt.jobId)).filter(event => event.type === 'nonfunctional-deviations-recorded')).toHaveLength(1);
  expect((await rebuilt.mergeReadiness(plan, receipt.jobId, version)).readiness.status).toBe('pending-review');
  for (const entry of batches[0]!.data.deviations) {
    const current = reloaded.service.getRun(plan, receipt.jobId)!.version;
    const item = await rebuilt.checkFinding(plan, receipt.jobId, entry.checkFinding, current);
    const request = item.summary.pendingUserDecision?.request;
    if (!request) throw new Error(`${entry.checkFinding} has no disposition request after reload`);
    await reloaded.service.execute({ commandId: `accept-${entry.checkFinding}`, expectedVersion: current,
      type: 'respond-to-check-finding', payload: { planId: plan, jobId: receipt.jobId, responder: 'reviewer',
        checkFinding: entry.checkFinding, expectedRevision: item.summary.revision, request, option: 'accept' } });
  }
  const acceptedVersion = reloaded.service.getRun(plan, receipt.jobId)!.version;
  expect((await rebuilt.mergeReadiness(plan, receipt.jobId, acceptedVersion)).readiness.status).toBe('ready');
}, 30_000);
