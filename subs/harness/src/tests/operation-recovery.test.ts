import { readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { createScriptedAgent, type Script } from '../../subs/agent/src/scripted.js';
import { interruptionEvidence } from '../../subs/agent/src/interfaces/port.js';
import { runLayout } from '../../subs/autonomous/src/run/records.js';
import { invocationOutcomeSchema } from '../../subs/task-execution/src/records.js';
import { copyFixture } from './helpers/fixture.js';
import { byRole, submit } from './helpers/iterations.js';
import { mockGit, fixtureScratchGit } from './helpers/mock-git.js';
import { scriptedCandidates } from './helpers/candidates.js';
import { declaringScenarios } from './helpers/declarations.js';
import { emptyAnalysis, openRuns, startRun, stopRun, testPolicy, until, freeze, staleCrashLock } from './helpers/runs.js';

const plan = 'review-notes';
const tree = 'a'.repeat(40);
const cleanup: Array<() => Promise<void>> = [];
afterEach(async () => { for (const close of cleanup.splice(0).reverse()) await close(); });

export async function recoveryFixture(script: Script, extra: Partial<Parameters<typeof openRuns>[1]> = {}, frozen = false) {
  const copied = await copyFixture(); cleanup.push(copied.remove);
  const git = fixtureScratchGit(mockGit({ currentHead: async () => 'base', isCleanRepository: async () => true,
    createRunBranch: async () => ({ branch: 'ramify-test', created: true }), changedPaths: async () => [],
    previewCandidateTree: async () => ({ repositoryRoot: copied.root, head: 'base', tree }),
    recoveryStatus: async () => ({ index: 'index-original', staged: [], unstaged: [], untracked: [] }),
  }));
  const candidates = scriptedCandidates(copied.root, { [tree]: { tree, base: 'base', files: {}, changes: [] } });
  const agent = (extra.agent ?? createScriptedAgent(declaringScenarios(script))) as import('../../subs/agent/src/scripted.js').ScriptedAgent;
  const options = { git, candidates, agent, policy: (root: string) => { const policy = testPolicy(root, { recovery: true });
    return { ...policy, recovery: { ...policy.recovery!, baseDelayMs: 0 } }; }, ...extra };
  const opened = await openRuns(copied.root, options);
  if (!frozen) cleanup.push(() => opened.service.close());
  return { ...opened, root: copied.root, git, agent, options };
}

async function paused(service: Awaited<ReturnType<typeof recoveryFixture>>['service'], runId: string) {
  await until(() => {
    const failed = service.events(plan, runId)!.find(event => event.type === 'job-failed');
    if (failed) throw new Error(JSON.stringify(failed.data));
    return service.events(plan, runId)!.some(event => event.type === 'operation-recovery-paused');
  });
  return (await service.recoveryInspection(plan, runId))!;
}
const transport = { classification: 'transport' as const, diagnostic: 'structured ECONNRESET', code: 'ECONNRESET' };

test('R05: structured status/code decides eligibility and bounded provider hints stay diagnostic evidence', () => {
  expect(interruptionEvidence(Object.assign(new Error('network unavailable'), { status: 401 }))).toMatchObject({ classification: 'permanent', status: 401 });
  expect(interruptionEvidence(Object.assign(new Error('bad model input'), { status: 503, retryAfterMs: 900000 }))).toMatchObject({ classification: 'transport', retryAfterMs: 900000 });
  expect(interruptionEvidence(new Error('503 ECONNRESET retryable temporary network'))).toMatchObject({ classification: 'unknown' });
});

test('R06: an accepted submission whose provider acknowledgement is lost completes without another model submission', async () => {
  const scripted = createScriptedAgent(declaringScenarios(byRole({ 'initial-architect': [submit(emptyAnalysis())] })));
  const agent = { ...scripted, bindSessionStore(store: Parameters<typeof scripted.bindSessionStore>[0]) {
    const operations = scripted.bindSessionStore(store);
    return { ...operations, async continue(input: Parameters<typeof operations.continue>[0]) {
      const handle = await operations.continue(input);
      return { ...handle, receipt: handle.receipt.then(receipt => receipt.outcome?.kind === 'submitted' && input.task.role === 'initial-architect'
        ? { ...receipt, status: 'failed' as const, outcome: { kind: 'failed' as const, error: 'Accepted submission acknowledgement lost', evidence: transport } } : receipt) };
    } };
  } };
  const { service, root } = await recoveryFixture([], { agent });
  const receipt = await service.execute(startRun(plan, 'scripted', 'r06', true));
  await until(() => service.events(plan, receipt.jobId)!.some(event => event.type === 'review-requested'));
  expect(scripted.sessions.filter(session => session.spec.role === 'initial-architect')).toHaveLength(1);
  expect(await service.recoveryInspection(plan, receipt.jobId)).toBeNull();
  const accepted = service.events(plan, receipt.jobId)!.find(event => event.type === 'analysis-accepted')!;
  if (accepted.type !== 'analysis-accepted') throw new Error('Analysis acceptance unavailable');
  const outcome = invocationOutcomeSchema.parse(JSON.parse(await readFile(join(root, 'plans', plan, '.harness', 'jobs', receipt.jobId, runLayout.outcome(accepted.data.invocation)), 'utf8')));
  expect(outcome).toMatchObject({ ended: 'submitted', disposition: 'applied', settled: { confirmed: true } });
  expect(outcome.submission?.hash).toBeTruthy();
  await service.execute(stopRun(plan, receipt.jobId, service.getRun(plan, receipt.jobId)!.version));
  await service.settled(plan, receipt.jobId);
});


test('bounded transport retries leave the task pending with its actual diagnostic', async () => {
  const { service, agent } = await recoveryFixture(byRole({ 'initial-architect': Array.from({ length: 3 }, () => [{ kind: 'fail' as const, error: 'stream disconnected', evidence: transport }]) }));
  const receipt = await service.execute(startRun(plan, 'scripted', 'bounded', true));
  const inspection = await paused(service, receipt.jobId);
  expect(agent.sessions.filter(session => session.spec.role === 'initial-architect')).toHaveLength(3);
  expect(inspection).toMatchObject({ state: 'paused', repairRequired: false, evidence: { diagnostic: 'structured ECONNRESET' } });
  expect(service.getRun(plan, receipt.jobId)?.state).toBe('running');
  await service.execute(stopRun(plan, receipt.jobId, service.getRun(plan, receipt.jobId)!.version));
  await service.settled(plan, receipt.jobId);
});

test.each(['permanent', 'unknown', 'adapter-fault'] as const)('ordinary continuation after %s needs no repair declaration or occurrence', async classification => {
  const { service, agent } = await recoveryFixture(byRole({ 'initial-architect': [[{ kind: 'fail', error: 'provider unavailable', evidence: { classification, diagnostic: 'actual provider diagnostic' } }], submit(emptyAnalysis())] }));
  const receipt = await service.execute(startRun(plan, 'scripted', `continue-${classification}`, true));
  await paused(service, receipt.jobId);
  const command = { commandId: `ordinary-${classification}`, expectedVersion: 0, type: 'resume-recovery' as const,
    payload: { planId: plan, jobId: receipt.jobId } };
  const [first, repeated] = await Promise.all([service.execute(command), service.execute(command)]);
  expect(repeated).toEqual(first);
  await until(() => service.events(plan, receipt.jobId)!.some(event => event.type === 'review-requested'));
  expect(agent.sessions.filter(session => session.spec.role === 'initial-architect')).toHaveLength(2);
  expect(await service.recoveryInspection(plan, receipt.jobId)).toBeNull();
  await service.execute(stopRun(plan, receipt.jobId, service.getRun(plan, receipt.jobId)!.version));
  await service.settled(plan, receipt.jobId);
});

test('service startup continues settled unfinished work without a recovery command', async () => {
  let frozen = false;
  const opened = await recoveryFixture(byRole({ 'initial-architect': [submit(emptyAnalysis())] }), {
    afterWrite: async write => { if (write === 'invocation-started') { frozen = true; await freeze(); } },
  }, true);
  const receipt = await opened.service.execute(startRun(plan, 'scripted', 'startup', true));
  await until(() => frozen);
  expect(opened.agent.sessions).toHaveLength(0);
  await staleCrashLock(opened.root);
  const reopened = await openRuns(opened.root, { ...opened.options, afterWrite: undefined }); cleanup.push(() => reopened.service.close());
  await until(() => reopened.service.events(plan, receipt.jobId)!.some(event => event.type === 'review-requested'));
  expect(opened.agent.sessions.filter(session => session.spec.role === 'initial-architect')).toHaveLength(1);
  expect(await reopened.service.recoveryInspection(plan, receipt.jobId)).toBeNull();
  await reopened.service.execute(stopRun(plan, receipt.jobId, reopened.service.getRun(plan, receipt.jobId)!.version));
  await reopened.service.settled(plan, receipt.jobId);
});

test('pending analysis approval survives startup without dispatching another task', async () => {
  const opened = await recoveryFixture(byRole({ 'initial-architect': [submit(emptyAnalysis())] }));
  const receipt = await opened.service.execute(startRun(plan, 'scripted', 'pending-approval', true));
  await until(() => opened.service.events(plan, receipt.jobId)!.some(event => event.type === 'review-requested'));
  const before = opened.agent.sessions.length;
  await opened.service.close();
  const reopened = await openRuns(opened.root, opened.options); cleanup.push(() => reopened.service.close());
  await Promise.resolve();
  expect(opened.agent.sessions).toHaveLength(before);
  expect(reopened.service.getRun(plan, receipt.jobId)?.phase).toBe('awaiting-review');
  await reopened.service.execute(stopRun(plan, receipt.jobId, reopened.service.getRun(plan, receipt.jobId)!.version));
});

test('R18: unconfirmed settlement retains a nonterminal hold and forbids successors', async () => {
  const scripted = createScriptedAgent(declaringScenarios(byRole({ 'initial-architect': [[{ kind: 'fail', error: 'transport ended while provider idle acknowledgement was lost', evidence: transport }]] })));
  const agent = { ...scripted, bindSessionStore(store: Parameters<typeof scripted.bindSessionStore>[0]) {
    const operations = scripted.bindSessionStore(store);
    return { ...operations, async continue(input: Parameters<typeof operations.continue>[0]) {
      const handle = await operations.continue(input);
      return input.task.role === 'initial-architect' ? { ...handle, settled: async () => new Promise<never>(() => undefined) } : handle;
    } };
  } };
  const { service } = await recoveryFixture([], { agent, policy: root => { const policy = testPolicy(root, { recovery: true }); return { ...policy,
    limits: { ...policy.limits, stopSettleMs: 20, writerSettleMs: 20 } }; } }, true);
  const receipt = await service.execute(startRun(plan, 'scripted', 'r18'));
  const inspection = await paused(service, receipt.jobId);
  expect(service.getRun(plan, receipt.jobId)?.state).toBe('running');
  expect(inspection.canResume).toBe(false);
  expect(inspection.blockers.some(blocker => blocker.includes('Settlement:'))).toBe(true);
  expect(scripted.sessions.filter(session => session.spec.role === 'initial-architect')).toHaveLength(1);
  await service.execute(stopRun(plan, receipt.jobId, service.getRun(plan, receipt.jobId)!.version));
  await service.settled(plan, receipt.jobId);
  await expect(service.close()).rejects.toThrow('settlement was not confirmed');

});

test('unreadable essential baseline reports its record while keeping the task pending', async () => {
  const opened = await recoveryFixture(byRole({ 'initial-architect': [[{ kind: 'fail', error: 'provider unavailable', evidence: { classification: 'permanent', diagnostic: 'provider unavailable' } }]] }));
  const receipt = await opened.service.execute(startRun(plan, 'scripted', 'missing-baseline', true));
  await paused(opened.service, receipt.jobId);
  await opened.service.close();
  await rm(join(opened.root, 'plans', plan, '.harness/jobs', receipt.jobId, runLayout.measurement('ms-0001')));
  const before = opened.agent.sessions.length;
  const reopened = await openRuns(opened.root, { ...opened.options, recoveryRuntime: async () => { throw new Error('optional runtime identity must never be requested'); } });
  cleanup.push(() => reopened.service.close());
  expect(opened.agent.sessions).toHaveLength(before);
  expect(await reopened.service.recoveryInspection(plan, receipt.jobId)).toMatchObject({ evidence: { diagnostic: expect.stringContaining('measurements/ms-0001.json') } });
  expect(reopened.service.getRun(plan, receipt.jobId)?.state).toBe('running');
  await reopened.service.execute(stopRun(plan, receipt.jobId, reopened.service.getRun(plan, receipt.jobId)!.version));
});

test('an explicit stop cancels transport backoff before a replacement dispatches', async () => {
  const { service, agent } = await recoveryFixture(byRole({ 'initial-architect': [[{ kind: 'fail', error: 'transport disconnected', evidence: transport }], submit(emptyAnalysis())] }));
  const receipt = await service.execute(startRun(plan, 'scripted', 'stop-backoff', true));
  await until(() => service.events(plan, receipt.jobId)!.some(event => event.type === 'invocation-ended' && event.data.ended === 'failed'));
  await service.execute(stopRun(plan, receipt.jobId, service.getRun(plan, receipt.jobId)!.version));
  await service.settled(plan, receipt.jobId);
  expect(agent.sessions.filter(session => session.spec.role === 'initial-architect')).toHaveLength(1);
  expect(service.getRun(plan, receipt.jobId)?.state).toBe('stopped');
});
