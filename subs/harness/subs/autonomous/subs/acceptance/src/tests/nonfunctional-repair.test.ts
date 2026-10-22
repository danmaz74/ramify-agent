import type { Observation } from '../../../../../task-execution/src/observations.js';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { createScriptedAgent, type ScriptStep } from '../../../../../agent/src/scripted.js';
import { coordinatorAssessmentToolName, coordinatorActionToolName, coordinatorInvestigationToolName, nonfunctionalRepairToolName } from '../nonfunctional/submissions.js';
import { intakeToolName, principleToolName } from '../../../planning/src/extraction.js';
import { copyFixture } from '../../../../../../src/tests/helpers/fixture.js';
import { withDefaultTurns } from '../../../../../../src/tests/helpers/declarations.js';
import { analysis, currentAnalysis } from '../../../../../../src/tests/helpers/analysis.js';
import { submit, write } from '../../../../../../src/tests/helpers/iterations.js';
import { onlyRun, openRuns, runEventsOnDisk, runPath, startRun, until } from '../../../../../../src/tests/helpers/runs.js';
import { runLayout } from '../../../../src/run/records.js';

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
  vi.useRealTimers();
  const errors: unknown[] = [];
  for (const cleanup of cleanups.splice(0).reverse()) try { await cleanup(); } catch (error) { errors.push(error); }
  for (const answer of answers.splice(0)) try { answer.assertComplete(); } catch (error) { errors.push(error); }
  try { expect(spawnAttempts(), 'ordinary NFR setup/flow/teardown process attempts').toEqual([]); } catch (error) { errors.push(error); }
  if (errors.length) throw new AggregateError(errors, 'NFR fixture teardown failed');
});

test.each([{ debug: false, noResult: false }, { debug: true, noResult: false }, { debug: false, noResult: true }])
('one authorized repair edits two modules from the chosen src, then verifies repaired/unresolved NFRs with retained satisfied judgments (%j)', async ({ debug, noResult }) => {
  const fixture = await copyFixture();
  cleanups.push(fixture.remove);
  const boundaryAnswers = nfrBoundaries(fixture.root, { repair: 'two-modules' });
  answers.push(boundaryAnswers);
  // Both normalized ownership carriers must survive the same driven assignment.
  // This is scripted workflow evidence; the registered CLI witness proves installation.
  const ramify = new Proxy(boundaryAnswers.options.ramify, { get(target, key, receiver) {
    if (key !== 'queryOwnershipAnswer') return Reflect.get(target, key, receiver);
    return async (root: string, paths?: readonly string[]) => {
      const answer = await target.queryOwnershipAnswer(root, paths);
      return debug ? { ...answer, schemaVersion: 'ramify.ownership/1' as const } : answer;
    };
  } });
  const plan = join(fixture.root, 'plans/review-notes/plan.md');
  const obligation = 'The review must retain an audit record.';
  const otherObligation = 'The catalog must expose the audit record.';
  const advice = 'Prefer a compact audit record.';
  const fixed = 'Every audit record names its author.';
  const original = await readFile(plan, 'utf8');
  await writeFile(plan, `${original}\n${obligation}\n${otherObligation}\n${advice}\n`);
  await writeFile(join(fixture.root, 'audit.principles.md'), `# Audit\n\n${fixed}\n`);
  const firstModule = 'collection-review/workspace/reviews/core';
  const firstSrc = join(fixture.root, 'subs/workspace/subs/reviews/subs/core/src');
  const otherFile = join(fixture.root, 'subs/workspace/subs/catalog/src/nonfunctional-repair.ts');
  let assessments = 0;
  let actions = 0;
  const inspectionCommand = 'git merge-base --is-ancestor prerequisite HEAD && cat plans/review-notes/.harness/jobs/*/job.json';
  const inspected: string[] = [];
  let registeredProcesses = 0;
  const quietReview = !debug && !noResult;
  const quiet = () => {
    let enter!: () => void; const entered = new Promise<void>(resolve => { enter = resolve; });
    let release!: () => void; const released = new Promise<void>(resolve => { release = resolve; });
    return { entered, release, step: { kind: 'await' as const, until: () => { enter(); return released; } } };
  };
  const assessmentWait = quiet(); const investigationWait = quiet();
  const agent = createScriptedAgent(withDefaultTurns(spec => {
    const steps = (() => {
    if (spec.submission.name === intakeToolName) {
      const document = 'document:review-notes-plan';
      return submit({ goal: 'Keep an audit record of reviews.', elements: [
        { key: 'draft:non-functional-requirement:case-001', kind: 'non-functional', document, text: obligation, conditions: [], uncertainty: '' },
        { key: 'draft:non-functional-requirement:case-002', kind: 'non-functional', document, text: otherObligation, conditions: [], uncertainty: '' },
        { key: 'draft:recommendation:case-001', kind: 'recommendation', document, text: advice, conditions: [], uncertainty: '' },
      ], incorporation: { documents: [{ document, scenarios: true, uncertainty: '' }], missing: [] } });
    }
    if (spec.submission.name === principleToolName) {
      const document = [...spec.prompt.matchAll(/document:[a-z0-9-]+/gu)][0]?.[0];
      if (!document) throw new Error('Missing captured principles document');
      return submit({ elements: [
        { key: 'draft:fixed-requirement:case-001', kind: 'fixed', document, text: fixed, conditions: [{ text: 'for every audit record', source: 'stated' }], uncertainty: '' },
      ] });
    }
    if (spec.role === 'initial-architect') return submit(currentAnalysis(analysis([]), 'document:review-notes-plan'));
    if (spec.submission.name === coordinatorAssessmentToolName) {
      assessments += 1;
      return submit({ kind: 'assessment', results: [{ nfr: 'non-functional-requirement:case-001',
        result: assessments === 1 ? 'undetermined' : 'satisfied',
        inspectedScope: ['subs/workspace/subs/reviews/subs/core/src', 'subs/workspace/subs/catalog/src'],
        evidence: [assessments === 1 ? 'Intermediate trace unavailable' : 'Audit record source present'],
        uncertainty: assessments === 1 ? 'Need an intermediate trace' : '' },
      { nfr: 'non-functional-requirement:case-002', result: assessments === 1 ? 'not-satisfied' : 'satisfied',
        inspectedScope: ['subs/workspace/subs/catalog/src'], evidence: ['Catalog source inspected'], uncertainty: '' },
      ...(assessments === 1 ? [{ nfr: 'fixed-requirement:case-001', result: 'satisfied', inspectedScope: ['subs/workspace/subs/reviews/subs/core/src'],
        evidence: ['Author is recorded'], uncertainty: '' }] : [])] });
    }
    if (spec.submission.name === coordinatorActionToolName) return ++actions === 1
      ? submit({ kind: 'investigate', nfrs: ['non-functional-requirement:case-001'], question: 'Inspect the intermediate audit trace', scope: ['.git', 'plans/review-notes/.harness', '/external/evidence'] })
      : submit({ kind: 'repair', nfrs: ['non-functional-requirement:case-001'], startingModule: firstModule,
        task: 'Add a cross-module audit record implementation', evidence: ['Intermediate trace inspected'], uncertainty: '' });
    if (spec.submission.name === coordinatorInvestigationToolName) return submit({ kind: 'investigation-result',
      summary: 'Intermediate trace is absent', findings: [{ nfr: 'non-functional-requirement:case-001', inspectedScope: ['src/'],
        evidence: ['No trace writer found'], uncertainty: 'The trace was not observed' }] });
    if (spec.submission.name === nonfunctionalRepairToolName) {
      boundaryAnswers.repair();
      const edits: ScriptStep[] = [write('nonfunctional-repair.ts', 'export const auditRecord = true;\n'),
        write(otherFile, 'export const catalogAuditRecord = true;\n'),
        write(plan, 'forbidden plan change\n')];
      return noResult ? [...edits, { kind: 'end' as const, message: 'I ran out of time before reporting the repair.' }]
        : submit({ kind: 'completed', summary: 'Added audit record source', evidence: ['Two source files written'], remaining: [] }, ...edits);
    }
    return [];
    })();
    if (spec.role !== 'nonfunctional-coordinator') return steps;
    expect([...spec.builtinTools, ...spec.tools.map(tool => tool.name)]).toEqual(expect.arrayContaining(['read', 'grep', 'ls', 'find', 'shell']));
    expect(spec.prompt).toContain('runDirectory');
    expect(spec.prompt).not.toContain('Git metadata and run records are excluded');
    return [{ kind: 'tool', tool: 'shell', input: { command: inspectionCommand } },
      ...(quietReview && spec.submission.name === coordinatorAssessmentToolName && assessments === 1 ? [assessmentWait.step] : []),
      ...(quietReview && spec.submission.name === coordinatorInvestigationToolName ? [investigationWait.step] : []),
      ...steps];
  }));
  const { service } = await openRuns(fixture.root, { ...boundaryAnswers.options, ramify, agent,
    groups: { alive: () => false, kill: () => { throw new Error('No scripted group remains alive'); } },
    commandExecution: async request => {
      expect(request.cwd).toBe(fixture.root);
      expect(request.argv.at(-1)).toBe(inspectionCommand);
      inspected.push(inspectionCommand);
      expect(request.registerProcessGroup).toBeTypeOf('function');
      await request.registerProcessGroup!(++registeredProcesses, 'scripted-process-identity');
      const stdout = 'prerequisite ancestry and captured run plan hash inspected';
      return { outcome: { kind: 'completed', exitCode: 0 }, startedAt: new Date().toISOString(), elapsedMs: 0,
        stdout, stderr: '', output: { path: request.outputFile ?? null, bytes: stdout.length, truncated: false, tail: stdout } };
    },
  });
  cleanups.push(() => service.close());
  const start = startRun('review-notes');
  if (start.type !== 'start-run') throw new Error('Unexpected command');
  if (quietReview) vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
  const receipt = await service.execute({ ...start, payload: { ...start.payload,
    ...(debug ? { breakpoint: 'before-agent:engineer' as const } : {}) } });
  if (quietReview) {
    for (const wait of [assessmentWait, investigationWait]) {
      await wait.entered;
      await vi.advanceTimersByTimeAsync(60 * 60_000);
      expect(onlyRun(service, 'review-notes').state).toBe('running');
      wait.release();
    }
  }
  if (debug) {
    await until(() => service.debugState('review-notes', receipt.jobId)?.state === 'paused');
    const pause = service.debugState('review-notes', receipt.jobId)!;
    expect(pause).toMatchObject({ role: 'nonfunctional-repair-engineer', taskState: 'pending',
      goal: 'Add a cross-module audit record implementation' });
    expect(agent.sessions.some(session => session.spec.role === 'nonfunctional-repair-engineer')).toBe(false);
    const inspected = await service.debugInspect('review-notes', receipt.jobId, pause.pauseId);
    expect(inspected.input.tools.map(tool => tool.name)).toEqual(expect.arrayContaining(['write', 'edit', 'shell']));
    expect(inspected.input.scope.workingDirectory).toBe(firstSrc);
    await service.execute({ commandId: 'nfr-chat', expectedVersion: 0, type: 'debug-message', payload: {
      planId: 'review-notes', jobId: receipt.jobId, pauseId: pause.pauseId, expectedRevision: pause.revision, message: 'Perform the authorized repair.' } });
    await until(() => service.debugResult('review-notes', receipt.jobId, 'nfr-chat')?.status === 'settled');
    expect(service.debugResult('review-notes', receipt.jobId, 'nfr-chat')?.taskState).toBe('accepted');
    expect(service.events('review-notes', receipt.jobId)!.some(event => event.type === 'nonfunctional-repair-committed')).toBe(false);
    await service.execute({ commandId: 'nfr-resume', expectedVersion: 0, type: 'debug-resume', payload: {
      planId: 'review-notes', jobId: receipt.jobId, pauseId: pause.pauseId, expectedRevision: pause.revision + 1,
    } });
  }
  await service.settled('review-notes', receipt.jobId);
  const run = onlyRun(service, 'review-notes');
  const events = await runEventsOnDisk(fixture.root, 'review-notes', receipt.jobId);
  expect(run.failure, JSON.stringify(agent.sessions.filter(session => session.spec.role === 'nonfunctional-coordinator').map(session => ({ outcome: session.outcome, results: session.results })))).toBeNull();
  expect(run.state).toBe('completed');
  const reviewers = agent.sessions.filter(session => session.spec.role === 'nonfunctional-coordinator');
  expect(reviewers.map(session => session.spec.submission.name)).toEqual(expect.arrayContaining([
    coordinatorAssessmentToolName, coordinatorActionToolName, coordinatorInvestigationToolName,
  ]));
  expect(inspected).toHaveLength(reviewers.length);
  expect(events.filter(event => event.type === 'writer-process-registered')).toHaveLength(reviewers.length);
  for (const event of events.filter(event => event.type === 'writer-process-registered')) {
    expect(events.find(release => release.type === 'writer-released' && release.data.invocation === event.data.invocation)?.data)
      .toMatchObject({ confirmed: true });
  }
  for (const reviewer of reviewers) expect(reviewer.results.find(result => result.tool === 'shell'))
    .toMatchObject({ isError: false, text: expect.stringContaining('prerequisite ancestry and captured run plan hash inspected') });
  const coordinator = agent.sessions.filter(session => session.spec.submission.name === coordinatorAssessmentToolName);
  expect(coordinator).toHaveLength(2);
  expect(coordinator[0]!.spec.prompt).toMatch(/^Elements: non-functional-requirement:case-001, non-functional-requirement:case-002, fixed-requirement:case-001$/mu);
  expect(coordinator[0]!.spec.prompt).toContain(`> ${fixed}`);
  expect(coordinator[0]!.spec.prompt).toContain('- stated: for every audit record');
  expect(coordinator[1]!.spec.prompt).toMatch(/^Elements: non-functional-requirement:case-001, non-functional-requirement:case-002$/mu);
  expect(coordinator[1]!.spec.prompt).not.toContain(`> ${fixed}`);
  expect(coordinator[1]!.spec.prompt).toContain('Do not restart the complete catalog by default.');
  expect(coordinator[1]!.spec.prompt).toContain('Author is recorded');
  for (const session of coordinator) {
    for (const text of [obligation, otherObligation]) expect(session.spec.prompt).toContain(`> ${text}`);
    expect(session.spec.prompt).not.toContain('recommendation:case-001');
    expect(session.spec.prompt).not.toContain(advice);
    expect(session.spec.prompt).toContain('\"name\":\"run-start\"');
    expect(session.spec.prompt).toContain('\"name\":\"accepted-boundary\"');
    expect(session.spec.prompt).toContain('An empty diff establishes no historical preservation.');
  }
  const investigator = agent.sessions.find(session => session.spec.submission.name === coordinatorInvestigationToolName)!;
  expect(investigator.spec.prompt).toMatch(/^Elements: non-functional-requirement:case-001$/mu);
  expect(investigator.spec.prompt).toContain(`### non-functional-requirement:case-001: non-functional requirement of the plan from plans/review-notes/plan.md\n\n> ${obligation}`);
  expect(investigator.spec.prompt).not.toContain(otherObligation);
  expect(investigator.spec.prompt).not.toContain(fixed);
  expect(events.find(event => event.type === 'analysis-accepted')?.data).toMatchObject({
    catalog: { context: 0, functional: 0, nonFunctional: 2, fixed: 1, recommendation: 1 } });
  const assessmentsOnDisk = events.filter(event => event.type === 'nonfunctional-assessed');
  expect(assessmentsOnDisk).toHaveLength(2);
  const focusedAssessment = JSON.parse(await readFile(runPath(fixture.root, 'review-notes', receipt.jobId,
    runLayout.assessment(assessmentsOnDisk[1]!.data.assessment)), 'utf8'));
  expect(focusedAssessment.followUp).toEqual({ assessment: assessmentsOnDisk[0]!.data.assessment, reviewed: ['non-functional-requirement:case-001', 'non-functional-requirement:case-002'] });
  expect(focusedAssessment.results).toContainEqual(expect.objectContaining({ nfr: 'fixed-requirement:case-001', result: 'satisfied', evidence: ['Author is recorded'] }));
  expect(events.filter(event => event.type === 'nonfunctional-investigated')).toMatchObject([{ data: { nfrs: ['non-functional-requirement:case-001'] } }]);
  expect(events.filter(event => event.type === 'nonfunctional-repair-assigned')).toHaveLength(1);
  const assigned = events.find(event => event.type === 'nonfunctional-repair-assigned')!;
  const recordedAssignment = JSON.parse(await readFile(runPath(fixture.root, 'review-notes', receipt.jobId,
    runLayout.nonfunctionalRepairAssignment(assigned.data.assignment)), 'utf8'));
  expect(recordedAssignment.scope.resolved.ownership.provider).toBe(debug ? 'ramify.ownership/1' : 'ramify.affected-cli/4');
  expect(events.find(event => event.type === 'nonfunctional-investigated')!.sequence).toBeLessThan(
    events.find(event => event.type === 'nonfunctional-repair-assigned')!.sequence);
  const investigation = events.find(event => event.type === 'nonfunctional-investigated')!;
  const actionSessions = agent.sessions.filter(session => session.spec.submission.name === coordinatorActionToolName);
  expect(actionSessions).toHaveLength(2);
  expect(actionSessions[1]!.spec.prompt).toContain(runPath(fixture.root, 'review-notes', receipt.jobId,
    runLayout.submission(investigation.data.invocation)));
  expect(actionSessions[1]!.spec.prompt).toContain('Intermediate trace unavailable');
  expect(events.filter(event => event.type === 'nonfunctional-repair-committed')).toHaveLength(1);
  expect(events.filter(event => event.type === 'nonfunctional-round-closed')).toMatchObject([{ data: { outcome: 'satisfied' } }]);
  const repair = agent.sessions.find(session => session.spec.role === 'nonfunctional-repair-engineer');
  expect(repair?.spec.scope.workingDirectory).toBe(firstSrc);
  expect(repair?.spec.prompt).toMatch(/^Elements: non-functional-requirement:case-001$/mu);
  // The repair engineer receives the changed-path section the coordinator received for the same candidate.
  expect(repair?.spec.prompt).toContain('"changedPaths":[');
  expect(repair?.spec.prompt).toContain('"snapshotScope":["."]');
  expect(repair?.spec.prompt).toContain(`> ${obligation}`);
  for (const text of [otherObligation, fixed, advice]) expect(repair?.spec.prompt).not.toContain(text);
  const repairStart = events.find(event => event.type === 'invocation-started' && event.data.role === 'nonfunctional-repair-engineer');
  if (repairStart?.type !== 'invocation-started') throw new Error('Missing actual repair invocation');
  if (noResult) {
    const repairEnd = events.find(event => event.type === 'invocation-ended'
      && event.data.invocation === repairStart.data.invocation);
    if (repairEnd?.type !== 'invocation-ended') throw new Error('Missing repair end');
    expect(repairEnd.data.ended).toBe('ended');
  }
  const deniedCall = `${repairStart.data.invocation}:call-3`;
  const observations = (await readFile(runPath(fixture.root, 'review-notes', receipt.jobId, runLayout.observations(repairStart.data.invocation)), 'utf8')).split('\n').filter(Boolean).map(line => JSON.parse(line) as Observation);
  expect(observations.flatMap(item => item.type === 'guard' && item.data.callId === deniedCall ? [item.data] : [])).toEqual([{
    callId: deniedCall, tool: 'write', requested: plan, resolved: plan, owner: null, scopeRevision: 1, verdict: 'blocked-scope',
    reason: `${plan} is written by the harness alone; no agent edits it`,
  }]);
  expect(observations.some(item => item.type === 'mutation' && item.data.callId === deniedCall)).toBe(false);
  expect(repair?.results.find(result => result.callId === 'call-3')).toMatchObject({ tool: 'write', isError: true, text: expect.stringContaining('Nothing was written.') });
  expect(await readFile(plan, 'utf8')).toBe(`${original}\n${obligation}\n${otherObligation}\n${advice}\n`);
  expect(await readFile(join(firstSrc, 'nonfunctional-repair.ts'), 'utf8')).toContain('auditRecord');
  expect(await readFile(otherFile, 'utf8')).toContain('catalogAuditRecord');
  const candidates = events.filter(event => event.type === 'candidate-prepared');
  expect(candidates).toHaveLength(2);
  expect(candidates[0]!.data.tree).not.toBe(candidates[1]!.data.tree);
  expect(events.find(event => event.type === 'candidate-bound-to-gate')?.data.tree).toBe(candidates[1]!.data.tree);
  const repaired = events.find(event => event.type === 'nonfunctional-repair-committed')!;
  const finalAssessmentEvent = assessmentsOnDisk[1]!;
  const closed = events.find(event => event.type === 'nonfunctional-round-closed')!;
  const finalGate = events.find(event => event.type === 'gate-attempted' && event.data.checkpoint === 'final')!;
  if (finalGate.type !== 'gate-attempted') throw new Error('Missing final gate');
  const completed = events.find(event => event.type === 'job-completed')!;
  expect(repaired.sequence).toBeLessThan(finalAssessmentEvent.sequence);
  expect(finalAssessmentEvent.sequence).toBeLessThan(closed.sequence);
  expect(closed.sequence).toBeLessThan(finalGate.sequence);
  expect(finalGate.sequence).toBeLessThan(completed.sequence);
  const gateRecord = JSON.parse(await readFile(runPath(fixture.root, 'review-notes', receipt.jobId,
    runLayout.gate(finalGate.data.gate)), 'utf8')) as { checkpoint: string; commands: unknown[]; audit?: { mode: string } };
  expect(gateRecord.checkpoint).toBe('final');
  // The final gate asks the committed audit for a full audit; the harness
  // plans no test or scenario command of its own.
  expect(gateRecord.audit).toMatchObject({ mode: 'full' });
  expect(gateRecord.commands).toEqual([]);
  const finalAssessment = await readFile(runPath(fixture.root, 'review-notes', receipt.jobId,
    runLayout.assessment('nfa-002')), 'utf8').then(JSON.parse);
  expect(finalAssessment.results.map((item: { nfr: string; result: string }) => [item.nfr, item.result])).toEqual([
    ['non-functional-requirement:case-001', 'satisfied'], ['non-functional-requirement:case-002', 'satisfied'], ['fixed-requirement:case-001', 'satisfied'],
  ]);
}, 60_000);
