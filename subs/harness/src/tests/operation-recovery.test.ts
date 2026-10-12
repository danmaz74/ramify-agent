import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { createScriptedAgent, type Script } from '../../subs/agent/src/scripted.js';
import { interruptionEvidence } from '../../subs/agent/src/interfaces/port.js';
import { runLayout, invocationOutcomeSchema } from '../run/records.js';
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

test('R01: structured transport receives exactly two successor invocations then pauses with lineage and retained attempts', async () => {
  const { service, agent } = await recoveryFixture(byRole({ 'initial-architect': Array.from({ length: 3 }, () => [{ kind: 'fail' as const, error: 'stream disconnected', evidence: transport }]) }));
  const receipt = await service.execute(startRun(plan, 'scripted', 'r01', true));
  const inspection = await paused(service, receipt.jobId);
  expect(agent.sessions.filter(session => session.spec.role === 'initial-architect')).toHaveLength(3);
  expect(inspection).toMatchObject({ state: 'paused', group: 0, automaticAttempts: 2, canResume: true,
    evidence: { classification: 'transport', diagnostic: 'structured ECONNRESET' } });
  expect(inspection.attempts).toHaveLength(3);
  const events = service.events(plan, receipt.jobId)!;
  expect(events.filter(event => event.type === 'operation-recovery-attempt').map(event => event.data.predecessor)).toEqual([null, null, inspection.attempts[0], inspection.attempts[1]]);
  expect(service.getRun(plan, receipt.jobId)?.state).toBe('running');
  await service.execute(stopRun(plan, receipt.jobId, service.getRun(plan, receipt.jobId)!.version));
  await service.settled(plan, receipt.jobId);
});

test.each(['permanent', 'unknown', 'adapter-fault'] as const)('R02: %s evidence waits for one explicit group; exact commands deduplicate and stale occurrences refuse', async classification => {
  let calls = 0;
  const { service, agent } = await recoveryFixture(byRole({ 'initial-architect': [[{ kind: 'fail', error: 'temporary retry service unavailable', evidence: { classification, diagnostic: 'original provider diagnostic' } }], submit(emptyAnalysis())] }));
  const receipt = await service.execute(startRun(plan, 'scripted', `r02-${classification}`, true));
  const inspection = await paused(service, receipt.jobId);
  expect(agent.sessions.filter(session => session.spec.role === 'initial-architect')).toHaveLength(1);
  const command = { commandId: `resume-${classification}`, expectedVersion: 0, type: 'resume-recovery' as const,
    payload: { planId: plan, jobId: receipt.jobId, occurrenceId: inspection.occurrenceId, expectedRevision: inspection.revision, repair: { areas: ['environment' as const], explanation: 'Operator inspected and corrected the obstruction before this explicit attempt' } } };
  const [first, repeated] = await Promise.all([service.execute(command), service.execute(command)]);
  expect(repeated).toEqual(first);
  await expect(service.execute({ ...command, commandId: 'stale' })).rejects.toMatchObject({ code: 'conflict' });
  await until(() => service.events(plan, receipt.jobId)!.some(event => event.type === 'review-requested'));
  expect(agent.sessions.filter(session => session.spec.role === 'initial-architect')).toHaveLength(2);
  expect(await service.recoveryInspection(plan, receipt.jobId)).toBeNull();
  await service.execute(stopRun(plan, receipt.jobId, service.getRun(plan, receipt.jobId)!.version));
  await service.settled(plan, receipt.jobId);
});

test('R03: a paused run survives close/reopen and spends only the explicitly resumed group', async () => {
  let calls = 0;
  const opened = await recoveryFixture(byRole({ 'initial-architect': [[{ kind: 'fail', error: 'credentials rejected', evidence: { classification: 'permanent', diagnostic: 'rejected credentials', status: 401 } }], submit(emptyAnalysis())] }));
  const receipt = await opened.service.execute(startRun(plan, 'scripted', 'r03', true));
  const inspection = await paused(opened.service, receipt.jobId);
  await opened.service.close();
  const reopened = await openRuns(opened.root, opened.options); cleanup.push(() => reopened.service.close());
  expect(opened.agent.sessions.filter(session => session.spec.role === 'initial-architect')).toHaveLength(1);
  expect(await reopened.service.recoveryInspection(plan, receipt.jobId)).toMatchObject({ occurrenceId: inspection.occurrenceId, revision: inspection.revision, state: 'paused' });
  await reopened.service.execute({ commandId: 'r03-resume', expectedVersion: 0, type: 'resume-recovery', payload: {
    planId: plan, jobId: receipt.jobId, occurrenceId: inspection.occurrenceId, expectedRevision: inspection.revision,
    repair: { areas: ['environment'], explanation: 'Operator replaced rejected credentials without changing source' } } });
  await until(() => reopened.service.events(plan, receipt.jobId)!.some(event => event.type === 'review-requested'));
  expect(opened.agent.sessions.filter(session => session.spec.role === 'initial-architect')).toHaveLength(2);
  await reopened.service.execute(stopRun(plan, receipt.jobId, reopened.service.getRun(plan, receipt.jobId)!.version));
  await reopened.service.settled(plan, receipt.jobId);
});

test('R04: unstructured diagnostics are a classification gap and cannot trigger automatic retries', async () => {
  const { service, agent, root } = await recoveryFixture(byRole({ 'initial-architect': [[{ kind: 'fail', error: 'retryable network transport temporary 503 ECONNRESET' }]] }));
  const receipt = await service.execute(startRun(plan, 'scripted', 'r04', true));
  const inspection = await paused(service, receipt.jobId);
  expect(inspection.evidence.classification).toBe('unknown');
  expect(inspection.automaticAttempts).toBe(0);
  expect(agent.sessions.filter(session => session.spec.role === 'initial-architect')).toHaveLength(1);
  const before = agent.sessions.length;
  await writeFile(join(root, 'plans', plan, 'plan.md'), 'Changed captured instruction package');
  await expect(service.execute({ commandId: 'changed-input', expectedVersion: 0, type: 'resume-recovery', payload: {
    planId: plan, jobId: receipt.jobId, occurrenceId: inspection.occurrenceId, expectedRevision: inspection.revision } })).rejects.toMatchObject({ code: 'conflict' });
  expect(agent.sessions).toHaveLength(before);
  await service.execute(stopRun(plan, receipt.jobId, service.getRun(plan, receipt.jobId)!.version));
  await service.settled(plan, receipt.jobId);
});

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

test('R07: mutated durable job and ledger bytes refuse admission before any model operation', async () => {
  const { service, agent, root } = await recoveryFixture(byRole({ 'initial-architect': [[{ kind: 'fail', error: 'lost connection', evidence: transport }]] }),
    { policy: root => { const policy = testPolicy(root, { recovery: true }); return { ...policy, recovery: { ...policy.recovery!, automaticRetries: 0 } }; } });
  const receipt = await service.execute(startRun(plan, 'scripted', 'r07', true));
  const inspection = await paused(service, receipt.jobId);
  const directory = join(root, 'plans', plan, '.harness', 'jobs', receipt.jobId);
  const command = { commandId: 'r07-resume', expectedVersion: 0, type: 'resume-recovery' as const,
    payload: { planId: plan, jobId: receipt.jobId, occurrenceId: inspection.occurrenceId, expectedRevision: inspection.revision } };
  const count = agent.sessions.length;
  for (const path of [runLayout.record, runLayout.events]) {
    const original = await readFile(join(directory, path));
    await writeFile(join(directory, path), path === runLayout.events ? Buffer.concat([original, Buffer.from('altered durable tail')]) : Buffer.from('{"altered":true}'));
    await expect(service.execute(command)).rejects.toMatchObject({ code: 'conflict' });
    expect(agent.sessions).toHaveLength(count);
    await writeFile(join(directory, path), original);
  }
  await service.execute(stopRun(plan, receipt.jobId, service.getRun(plan, receipt.jobId)!.version));
  await service.settled(plan, receipt.jobId);
});

test('R08: operator waiting excludes only reached recovery wait and never renews spent invocation allowance', async () => {
  let clock = new Date('2026-10-12T15:00:00Z');
  const { service } = await recoveryFixture(byRole({ 'initial-architect': [[{ kind: 'fail', error: 'lost connection', evidence: transport }], submit(emptyAnalysis())] }),
    { now: () => clock, policy: root => { const policy = testPolicy(root, { recovery: true }); return { ...policy,
      recovery: { ...policy.recovery!, automaticRetries: 0 }, limits: { ...policy.limits, maxInvocationsPerRun: 3, runAbsoluteMs: 1000 } }; } });
  const receipt = await service.execute(startRun(plan, 'scripted', 'r08', true));
  const first = await paused(service, receipt.jobId);
  clock = new Date(clock.getTime() + 100000);
  const waiting = (await service.recoveryInspection(plan, receipt.jobId))!;
  expect(waiting.remaining).toEqual(first.remaining);
  expect(waiting.totalInvocations).toBe(first.totalInvocations);
  expect(waiting.timing?.activeMs).toBe(first.timing?.activeMs);
  expect(waiting.timing?.pausedMs).toBe(first.timing!.pausedMs + 100000);
  expect(waiting.timing?.currentPauseMs).toBe(100000);
  await service.execute({ commandId: 'r08-resume', expectedVersion: 0, type: 'resume-recovery', payload: {
    planId: plan, jobId: receipt.jobId, occurrenceId: first.occurrenceId, expectedRevision: first.revision } });
  await service.settled(plan, receipt.jobId);
  expect(service.getRun(plan, receipt.jobId)?.failure?.reason).toBe('limit-exceeded');
  expect(service.events(plan, receipt.jobId)!.filter(event => event.type === 'invocation-started')).toHaveLength(3);

});

test('R09: startup fences an unfinished original invocation and waits for explicit resume without dispatching a model', async () => {
  let frozen = false;
  const opened = await recoveryFixture(byRole({ 'initial-architect': [submit(emptyAnalysis())] }), {
    afterWrite: async write => { if (write === 'invocation-started') { frozen = true; await freeze(); } },
  }, true);
  const receipt = await opened.service.execute(startRun(plan, 'scripted', 'r09', true));
  await until(() => frozen);
  expect(opened.agent.sessions).toHaveLength(0);
  await staleCrashLock(opened.root);
  const reopened = await openRuns(opened.root, { ...opened.options, afterWrite: undefined }); cleanup.push(() => reopened.service.close());
  const inspection = (await reopened.service.recoveryInspection(plan, receipt.jobId))!;
  expect(inspection, JSON.stringify({ recovery: reopened.recovery, warnings: reopened.warnings, run: reopened.service.getRun(plan, receipt.jobId) })).toMatchObject({ state: 'paused', boundary: { role: 'catalog-extractor', kind: 'invocation' }, automaticAttempts: 0 });
  expect(opened.agent.sessions).toHaveLength(0);
  await reopened.service.execute({ commandId: 'r09-resume', expectedVersion: 0, type: 'resume-recovery', payload: {
    planId: plan, jobId: receipt.jobId, occurrenceId: inspection.occurrenceId, expectedRevision: inspection.revision } });
  await until(() => reopened.service.events(plan, receipt.jobId)!.some(event => event.type === 'review-requested'));
  expect(opened.agent.sessions.filter(session => session.spec.role === 'initial-architect')).toHaveLength(1);
  await reopened.service.execute(stopRun(plan, receipt.jobId, reopened.service.getRun(plan, receipt.jobId)!.version));
  await reopened.service.settled(plan, receipt.jobId);
});

test('R10: source-backed runtime identity rejects changed authority contracts and permits an adapter fix with retained contracts', async () => {
  const { recoveryRuntimeFromSources } = await import('../run/recovery-runtime.js');
  const sources = [{ path: '/installed/harness/src/run/service.js', hash: 'original-authority' },
    { path: '/installed/harness/subs/agent/subs/pi/src/session-operations.js', hash: 'original-adapter' }];
  const before = recoveryRuntimeFromSources('pi', sources, 'exact-provider-pins');
  const adapter = recoveryRuntimeFromSources('pi', [sources[0]!, { ...sources[1]!, hash: 'corrected-adapter' }], 'exact-provider-pins');
  const weakened = recoveryRuntimeFromSources('pi', [{ ...sources[0]!, hash: 'weakened-resume-authority' }, sources[1]!], 'exact-provider-pins');
  expect(adapter.provider).not.toBe(before.provider);
  expect(adapter.contracts).toEqual(before.contracts);
  expect(weakened.harness).not.toBe(before.harness);
  expect(weakened.contracts.authority).not.toBe(before.contracts.authority);
  const changedDependencies = recoveryRuntimeFromSources('pi', sources, 'changed-provider-pins');
  expect(changedDependencies.contracts.authority).not.toBe(before.contracts.authority);
  expect(changedDependencies.contracts.equipment).not.toBe(before.contracts.equipment);
});

test('R15: startup retains an accepted reviewer result beside an unfinished writer and pauses without replay', async () => {
  let acceptedReviewer = false;
  let unfinishedWriter = false;
  const scripted = createScriptedAgent(declaringScenarios(byRole({ 'initial-architect': [submit(emptyAnalysis())],
    reviewer: [submit({ kind: 'retained-review-result' })], engineer: [[{ kind: 'end' }]],
  })));
  const agent = { ...scripted, bindSessionStore(store: Parameters<typeof scripted.bindSessionStore>[0]) {
    const operations = scripted.bindSessionStore(store);
    return { ...operations, async continue(input: Parameters<typeof operations.continue>[0]) {
      const handle = await operations.continue(input);
      return input.task.role !== 'reviewer' ? handle : { ...handle, receipt: handle.receipt.then(async receipt => {
        if (receipt.outcome?.kind === 'submitted') { acceptedReviewer = true; await freeze(); }
        return receipt;
      }) };
    } };
  } };
  const runtime = { harness: 'mixed-startup-runtime', provider: 'scripted', contracts: {
    policy: 'policy', records: 'records', submissions: 'submissions', equipment: 'equipment', authority: 'authority' } };
  const opened = await recoveryFixture([], { agent, recoveryRuntime: async () => runtime }, true);
  const receipt = await opened.service.execute(startRun(plan, 'scripted', 'r15', true));
  await until(() => opened.service.events(plan, receipt.jobId)!.some(event => event.type === 'review-requested'));
  const packages = (await (await import('../prompts/packages.js')).loadPromptPackages()).packages;
  const internal = opened.service as unknown as { runs: Map<string, unknown>; recoverableInvocation<T>(run: unknown, actor: typeof opened.agent, request: import('../steps/runner.js').InvocationRequest<T>): Promise<unknown> };
  const run = [...internal.runs.values()][0];
  const reader: import('../steps/runner.js').InvocationRequest<{ kind: string }> = {
    role: 'reviewer', work: { request: 'retained-review' }, attempt: 1, loaded: packages.get('reviewer')!,
    systemPrompt: packages.get('reviewer')!.system, prompt: 'Inspect and submit the retained review', start: { mode: 'fresh' },
    toolName: 'submit_review', description: 'Submit the retained review', inputSchema: { type: 'object' }, submissionSchema: 'ramify-agent.mixed-review/1',
    brief: { kind: 'code', objective: 'Retain the completed review', goal: 'Verify interrupted peer reconciliation', requirements: ['Retain the authenticated accepted review'], sections: [],
      environment: { projectRoot: opened.root, workingDirectory: opened.root, candidate: tree, snapshot: tree, limits: testPolicy(opened.root, { recovery: true }).limits,
        availableTools: [], views: [], supportPaths: [], cucumberConfiguration: null } },
    validate: value => ({ ok: true, value: value as { kind: string } }),
    keep: () => ({ kept: false, finished: 'work-closed' }), scope: { write: null, measurement: null, size: null },
  };
  let failure: unknown;
  void internal.recoverableInvocation(run, opened.agent, reader).catch(error => { failure = error; });
  await until(async () => {
    if (failure) throw failure;
    const recovery = await opened.service.recoveryInspection(plan, receipt.jobId);
    if (recovery) throw new Error(`Reviewer unexpectedly paused: ${JSON.stringify(recovery)}`);
    return acceptedReviewer;
  }, 1500);
  const writer: import('../steps/runner.js').InvocationRequest<{ kind: string }> = { ...reader,
    role: 'engineer', work: { workItem: 'unfinished-writer' }, loaded: packages.get('engineer')!, systemPrompt: packages.get('engineer')!.system,
    toolName: 'submit_iteration_result', writer: true, scope: { write: 1, measurement: null, size: null },
    onStarted: async () => { unfinishedWriter = true; await freeze(); },
  };
  void internal.recoverableInvocation(run, opened.agent, writer).catch(error => { failure = error; });
  await until(() => { if (failure) throw failure; return unfinishedWriter; });
  const count = scripted.sessions.length;
  const pending = opened.service.events(plan, receipt.jobId)!.filter(event => event.type === 'invocation-started').slice(-2);
  expect(pending.map(event => event.data.role)).toEqual(['reviewer', 'engineer']);
  await staleCrashLock(opened.root);
  const reopened = await openRuns(opened.root, opened.options); cleanup.push(() => reopened.service.close());
  const inspection = (await reopened.service.recoveryInspection(plan, receipt.jobId))!;
  expect(inspection, JSON.stringify(reopened.warnings)).toMatchObject({ state: 'paused', boundary: { role: 'engineer', kind: 'invocation' }, automaticAttempts: 0 });
  expect(scripted.sessions).toHaveLength(count);
  const directory = join(opened.root, 'plans', plan, '.harness', 'jobs', receipt.jobId);
  const accepted = invocationOutcomeSchema.parse(JSON.parse(await readFile(join(directory, runLayout.outcome(pending[0]!.data.invocation)), 'utf8')));
  expect(accepted).toMatchObject({ ended: 'submitted', disposition: 'applied', settled: { confirmed: true } });
  expect(accepted.submission?.hash).toBeTruthy();
  expect(inspection.attempts).toEqual([pending[1]!.data.invocation]);
  await reopened.service.execute(stopRun(plan, receipt.jobId, reopened.service.getRun(plan, receipt.jobId)!.version));
  await reopened.service.settled(plan, receipt.jobId);
});

test('R16: a usable recovery pause waits for the peer review commit pipeline after its raw invocation settles', async () => {
  const reviews = await import('./helpers/reviews.js');
  const iterations = await import('./helpers/iterations.js');
  const analysis = await import('./helpers/analysis.js');
  const { testReviewPolicy } = await import('./helpers/candidates.js');
  const { gateGit, scenariosCommit } = await import('./helpers/gate-git.js');
  const root = await reviews.reviewTarget(cleanup);
  const first = reviews.candidates()['revision-01']!;
  const source = scriptedCandidates(root, { 'revision-01': { ...first, tree }, [tree]: { ...first, tree } });
  const { recoveryHash } = await import('../run/recovery-admission.js');
  const candidates = { ...source, treeEntries: async (project: string, commit: string) => (await source.treeEntries(project, commit)).map(entry => ({ ...entry, objectId: recoveryHash(entry).slice(0, 40) })) };
  const answers = gateGit(root, { head: reviews.base, commits: [scenariosCommit(plan, reviews.materialized, reviews.base), reviews.revisionGates[0]!, { commit: null }, { commit: null }] });
  const git = { ...answers.git, previewCandidateTree: async () => ({ repositoryRoot: root, head: answers.head(), tree }),
    recoveryStatus: async () => ({ index: 'review-index', staged: [], unstaged: [], untracked: [] }) };
  const script = reviews.reviewScript({ architect: [submit(iterations.assign(reviews.notes, {}, iterations.outline())), submit(analysis.requestCompletion())],
    engineer: [submit(iterations.completionProposed('Added note store'), iterations.write(reviews.store, 'export const store = new Map(); // v1\n'))],
    reviewers: { 'rq-0001': [{ kind: 'submit', input: { inspected: [], missing: [reviews.store], concerns: [] } }] } });
  const declared = declaringScenarios(script);
  const agent = createScriptedAgent(spec => spec.role === 'global-fork' ? [{ kind: 'fail', error: 'Peer reader stream interrupted', evidence: transport }]
    : typeof declared === 'function' ? declared(spec) : declared);
  const runtime = { harness: 'peer-review-runtime', provider: 'scripted', contracts: {
    policy: 'policy', records: 'records', submissions: 'submissions', equipment: 'equipment', authority: 'authority' } };
  const opened = await openRuns(root, { agent, git, candidates, inputs: iterations.treeInputs(), recoveryRuntime: async () => runtime,
    policy: project => { const policy = testPolicy(project, { recovery: true }); return { ...policy, reviews: testReviewPolicy({ retries: 0 }), recovery: { ...policy.recovery!, automaticRetries: 0 } }; } });
  cleanup.push(() => opened.service.close());
  const internal = opened.service as unknown as { runs: Map<string, { live: Map<string, unknown> }>; finishReview: (...args: unknown[]) => Promise<'committed' | 'fenced'>;
    recoverableInvocation<T>(run: unknown, actor: typeof agent, request: import('../steps/runner.js').InvocationRequest<T>): Promise<unknown> };
  const finish = internal.finishReview.bind(opened.service);
  let commitPending = false;
  let releaseReview!: () => void;
  const barrier = new Promise<void>(resolve => { releaseReview = resolve; });
  // Delay the actual owning commit, after the real reviewer and its tools are
  // settled. The scheduler remains responsible for this admitted pipeline.
  internal.finishReview = async (...args) => { commitPending = true; await barrier; return finish(...args); };
  const receipt = await opened.service.execute(startRun(plan));
  await until(() => commitPending);
  const run = [...internal.runs.values()][0]!;
  await until(() => run.live.size === 0);
  const loaded = (await (await import('../prompts/packages.js')).loadPromptPackages()).packages.get('global-fork')!;
  const request: import('../steps/runner.js').InvocationRequest<{ decision: string }> = {
    role: 'global-fork', work: { request: 'concurrent-peer' }, attempt: 1, loaded, systemPrompt: loaded.system, prompt: 'Read current peer evidence', start: { mode: 'fresh' },
    toolName: 'submit_placement_decision', description: 'Submit the reader decision', inputSchema: { type: 'object' }, submissionSchema: 'ramify-agent.peer-reader/1',
    validate: value => ({ ok: true, value: value as { decision: string } }), keep: () => ({ kept: false, finished: 'work-closed' }), scope: { write: null, measurement: null, size: null } };
  const execution = internal.recoverableInvocation(run, agent, request);
  await until(() => opened.service.events(plan, receipt.jobId)!.some(event => event.type === 'operation-recovery-pausing'));
  expect(run.live.size).toBe(0);
  expect(opened.service.events(plan, receipt.jobId)!.some(event => event.type === 'operation-recovery-paused')).toBe(false);
  releaseReview();
  await paused(opened.service, receipt.jobId);
  const events = opened.service.events(plan, receipt.jobId)!;
  expect(events.find(event => event.type === 'review-attempt-finished')!.sequence).toBeLessThan(events.find(event => event.type === 'operation-recovery-paused')!.sequence);
  await opened.service.execute(stopRun(plan, receipt.jobId, opened.service.getRun(plan, receipt.jobId)!.version));
  await execution;
  await opened.service.settled(plan, receipt.jobId);
});

test('R17: changed candidate prerequisites block a pending final effect after accepted results without replaying commits or models', async () => {
  let changed = false;
  let pendingEffect = false;
  let commits = 0;
  const repairedTree = 'b'.repeat(40);
  const runtime = { harness: 'pending-effect-runtime', provider: 'scripted', contracts: {
    policy: 'policy', records: 'records', submissions: 'submissions', equipment: 'equipment', authority: 'authority' } };
  const opened = await recoveryFixture(byRole({ 'initial-architect': [submit(emptyAnalysis())] }), {
    recoveryRuntime: async () => runtime,
    afterWrite: async current => { if (current === 'gate-attempted') { pendingEffect = true; await freeze(); } },
  }, true);
  const git = opened.options.git!;
  Object.assign(git, {
    previewCandidateTree: async () => ({ repositoryRoot: opened.root, head: 'base', tree: changed ? repairedTree : tree }),
    changedEntries: async () => [], findCommitByTrailers: async () => null,
    commitAccepted: async () => { commits++; return null; },
  });
  const receipt = await opened.service.execute(startRun(plan, 'scripted', 'r17'));
  await until(() => {
    const failed = opened.service.events(plan, receipt.jobId)!.find(event => event.type === 'job-failed');
    if (failed) throw new Error(JSON.stringify(failed));
    return pendingEffect;
  });
  const events = opened.service.events(plan, receipt.jobId)!;
  const intent = events.find(event => event.type === 'gate-committing')!;
  if (intent.type !== 'gate-committing') throw new Error('Final effect intent missing');
  const directory = join(opened.root, 'plans', plan, '.harness', 'jobs', receipt.jobId);
  const operation = JSON.parse(await readFile(join(directory, runLayout.gateOperation(intent.data.gate)), 'utf8'));
  expect(operation.finalAssessment).toMatchObject({ tree });
  const accepted = events.filter(event => event.type === 'invocation-ended' && event.data.ended === 'submitted');
  expect(accepted.length).toBeGreaterThan(0);
  const models = opened.agent.sessions.length;
  const beforeCommits = commits;
  changed = true;
  await staleCrashLock(opened.root);
  const reopened = await openRuns(opened.root, { ...opened.options, afterWrite: undefined }); cleanup.push(() => reopened.service.close());
  await reopened.service.settled(plan, receipt.jobId);
  expect(reopened.service.getRun(plan, receipt.jobId)?.failure).toMatchObject({ reason: 'recovery-exhausted', message: expect.stringMatching(/(?:source tree|candidate) changed after (?:the final|its retained) assessment/u) });
  expect(opened.agent.sessions).toHaveLength(models);
  expect(commits).toBe(beforeCommits);
  expect(reopened.service.events(plan, receipt.jobId)!.filter(event => event.type === 'invocation-ended' && event.data.ended === 'submitted')).toEqual(accepted);
  expect(await reopened.service.recoveryInspection(plan, receipt.jobId)).toBeNull();
});

test('R18: an interrupted ordinary operation with unconfirmed settlement stops for manual attention without a successor or usable pause', async () => {
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
  await service.settled(plan, receipt.jobId);
  expect(service.getRun(plan, receipt.jobId)?.failure).toMatchObject({ reason: 'writer-unsettled', message: expect.stringContaining('did not confirm settlement') });
  expect(scripted.sessions.filter(session => session.spec.role === 'initial-architect')).toHaveLength(1);
  expect(service.events(plan, receipt.jobId)!.some(event => event.type === 'operation-recovery-paused')).toBe(false);
  expect(await service.recoveryInspection(plan, receipt.jobId)).toBeNull();
  await expect(service.close()).rejects.toThrow('settlement was not confirmed');
});

test('R19: stop cancels a captured retry delay before any successor dispatch', async () => {
  const { service, agent } = await recoveryFixture(byRole({ 'initial-architect': [[{ kind: 'fail', error: 'transport disconnected', evidence: transport }], submit(emptyAnalysis())] }),
    { policy: root => { const policy = testPolicy(root, { recovery: true }); return { ...policy, recovery: { ...policy.recovery!, baseDelayMs: 5000, maxDelayMs: 5000 } }; } });
  const receipt = await service.execute(startRun(plan, 'scripted', 'r19'));
  await until(() => service.events(plan, receipt.jobId)!.some(event => event.type === 'invocation-ended' && event.data.ended === 'failed'));
  const before = Date.now();
  await service.execute(stopRun(plan, receipt.jobId, service.getRun(plan, receipt.jobId)!.version));
  await service.settled(plan, receipt.jobId);
  expect(Date.now() - before).toBeLessThan(1000);
  expect(agent.sessions.filter(session => session.spec.role === 'initial-architect')).toHaveLength(1);
  expect(service.getRun(plan, receipt.jobId)?.state).toBe('stopped');
});

test('R20: crash after a failed successor closes retains the consumed group before explicit recovery', async () => {
  let frozen = false;
  const runtime = { harness: 'closed-attempt-runtime', provider: 'scripted', contracts: {
    policy: 'policy', records: 'records', submissions: 'submissions', equipment: 'equipment', authority: 'authority' } };
  let opened!: Awaited<ReturnType<typeof recoveryFixture>>;
  opened = await recoveryFixture(byRole({ 'initial-architect': [[{ kind: 'fail', error: 'first transport interruption', evidence: transport }],
    [{ kind: 'fail', error: 'second transport interruption', evidence: transport }], submit(emptyAnalysis())] }), {
    recoveryRuntime: async () => runtime,
    afterWrite: async (write, runId) => {
      if (write === 'invocation-ended' && opened.agent.sessions.filter(session => session.spec.role === 'initial-architect').length === 2) {
        frozen = true; await freeze();
      }
    },
  }, true);
  const receipt = await opened.service.execute(startRun(plan, 'scripted', 'r20', true));
  await until(() => frozen);
  const attempts = opened.service.events(plan, receipt.jobId)!.flatMap(event => event.type === 'operation-recovery-attempt' && event.data.attempt > 0 ? [event.data] : []);
  expect(attempts.map(event => event.attempt)).toEqual([1]);
  await staleCrashLock(opened.root);
  const reopened = await openRuns(opened.root, { ...opened.options, afterWrite: undefined }); cleanup.push(() => reopened.service.close());
  const inspection = (await reopened.service.recoveryInspection(plan, receipt.jobId))!;
  expect(inspection).toMatchObject({ state: 'paused', automaticAttempts: 1, group: 0 });
  expect(inspection.attempts).toHaveLength(2);
  expect(opened.agent.sessions.filter(session => session.spec.role === 'initial-architect')).toHaveLength(2);
  await reopened.service.execute({ commandId: 'closed-attempt-resume', expectedVersion: 0, type: 'resume-recovery', payload: {
    planId: plan, jobId: receipt.jobId, occurrenceId: inspection.occurrenceId, expectedRevision: inspection.revision } });
  await until(() => reopened.service.events(plan, receipt.jobId)!.some(event => event.type === 'review-requested'));
  expect(opened.agent.sessions.filter(session => session.spec.role === 'initial-architect')).toHaveLength(3);
  await reopened.service.execute(stopRun(plan, receipt.jobId, reopened.service.getRun(plan, receipt.jobId)!.version));
  await reopened.service.settled(plan, receipt.jobId);
});

/** Source-mode witnesses execute the real shared runner against an authenticated
 * accepted parent. Ordinary caller integration is qualified separately. */
async function sourceOperation(mode: 'continue' | 'fork', loseSource = false, reconstruct = false) {
  const script = byRole({ 'initial-architect': [submit(emptyAnalysis())],
    'global-fork': [[{ kind: 'fail', error: 'source stream interrupted', evidence: transport }], submit({ decision: 'retained-source-read' })],
    'context-selector': [[{ kind: 'fail', error: 'reconstructed stream interrupted', evidence: transport }], submit({ decision: 'retained-source-read' })] });
  const declared = declaringScenarios(script);
  const agent = createScriptedAgent(spec => spec.role === 'context-selector' ? (script as Exclude<Script, readonly unknown[]>)(spec) : typeof declared === 'function' ? declared(spec) : declared);
  const opened = await recoveryFixture([], { agent,
    policy: root => { const policy = testPolicy(root, { recovery: true }); return { ...policy, recovery: { ...policy.recovery!, automaticRetries: 0 } }; } });
  const receipt = await opened.service.execute(startRun(plan, 'scripted', `source-${mode}-${loseSource}`, true));
  await until(() => opened.service.events(plan, receipt.jobId)!.some(event => event.type === 'review-requested'));
  const parent = opened.service.events(plan, receipt.jobId)!.find(event => event.type === 'invocation-started' && event.data.role === 'initial-architect')!;
  if (parent.type !== 'invocation-started') throw new Error('Original accepted source unavailable');
  const directory = join(opened.root, 'plans', plan, '.harness', 'jobs', receipt.jobId);
  const outcome = invocationOutcomeSchema.parse(JSON.parse(await readFile(join(directory, runLayout.outcome(parent.data.invocation)), 'utf8')));
  const ref = outcome.session!.ref;
  const { loadPromptPackages } = await import('../prompts/packages.js');
  const packages = await loadPromptPackages();
  const role = reconstruct ? 'context-selector' as const : 'global-fork' as const;
  const loaded = packages.packages.get(role)!;
  const request: import('../steps/runner.js').InvocationRequest<{ decision: string }> = {
    role, work: { request: `source-${mode}` }, attempt: 1, loaded, systemPrompt: loaded.system,
    prompt: 'Read the retained source and submit the bounded decision.',
    start: mode === 'continue' ? { mode: 'continue', ref } : { mode: 'fork', from: ref },
    ...(mode === 'continue' ? { session: parent.data.session, continuing: 'environment-resumed' as const }
      : { fork: { from: { session: parent.data.session, invocation: parent.data.invocation }, reason: 'unresolved-request' as const, briefs: [] } }),
    toolName: reconstruct ? 'select_context' : 'submit_placement_decision', description: 'Submit the bounded source-reading decision', inputSchema: { type: 'object', properties: { decision: { type: 'string' } }, required: ['decision'] },
    submissionSchema: 'ramify-agent.source-probe/1', validate: value => ({ ok: true, value: value as { decision: string } }),
    keep: () => ({ kept: false, finished: 'work-closed' }), scope: { write: null, measurement: null, size: null },
    allowFreshFallback: false,
  };
  const internal = opened.service as unknown as { runs: Map<string, unknown>; recoverableInvocation<T>(run: unknown, agent: typeof opened.agent, request: import('../steps/runner.js').InvocationRequest<T>): Promise<import('../steps/runner.js').InvocationResult<T>> };
  if (loseSource) {
    const { readSessionPointReference } = await import('../run/session-operations.js');
    expect(opened.agent.loseSession(readSessionPointReference(ref)!.point)).toBe(true);
  }
  let executable = request;
  if (reconstruct) {
    const { validateSelectorInputs } = await import('../steps/inputs.js');
    const { constructSelectorStep } = await import('../steps/local-architect.js');
    const record = [...internal.runs.values()][0] as { record: { policy: import('../run/records.js').RunPolicy } };
    const accepted = opened.service.events(plan, receipt.jobId)!.find(event => event.type === 'analysis-accepted')!;
    if (accepted.type !== 'analysis-accepted') throw new Error('Captured catalog unavailable');
    const catalog = JSON.parse(await readFile(join(directory, runLayout.catalogVersion(accepted.data.evidence.catalog.hash)), 'utf8'));
    const sourceInputs = validateSelectorInputs({ schema: 'ramify-agent.step-inputs/1', role: 'context-selector',
      run: { planId: plan, runId: receipt.jobId }, attempt: 1, capabilityWorkflow: false, limits: record.record.policy.limits,
      context: record.record.policy.context['context-selector'], work: { workItem: 'source-probe' }, kind: 'selection',
      goal: 'Read the captured source-backed catalog', requirements: ['The original catalog and captured plan remain authoritative'],
      packet: 'The retained catalog is the source of this reconstruction', catalog, planDeviations: [], workItemElements: [],
      orientation: { invocation: parent.data.invocation, point: ref }, workspace: { run: 'source-reconstruction' },
      known: { declaredChecks: { checks: [], paths: [] }, modules: [], testAreas: [], scenarioFeatures: [], stepDirectories: [] },
      startingPoints: [], architectView: [], start: { kind: 'fresh' } });
    const fallback = (reason: string) => {
      const fresh = validateSelectorInputs({ ...sourceInputs, start: { kind: 'fresh', degraded: { requested: 'fork', reason } } });
      const step = constructSelectorStep(fresh, { projectRoot: opened.root, packages: packages.packages });
      return { prompt: step.prompt, brief: step.brief, stepInputs: step.before.inputs };
    };
    const fresh = fallback('Source-backed reconstruction');
    const { contextSelectorToolName } = await import('../context-selection/submissions.js');
    executable = { ...request, allowFreshFallback: true, fallback, toolName: contextSelectorToolName,
      workingDirectory: join(directory, 'source-reconstruction'), prompt: fresh.prompt, brief: fresh.brief };
  }
  const execution = internal.recoverableInvocation([...internal.runs.values()][0], opened.agent, executable);
  const inspection = await paused(opened.service, receipt.jobId);
  return { ...opened, receipt, request, inspection, execution, directory, ref };
}

for (const mode of ['continue', 'fork'] as const) {
  test(`R11: durable ${mode} pause resumes the exact original source with a distinct successor identity`, async () => {
    const opened = await sourceOperation(mode);
    expect(opened.inspection.evidence, JSON.stringify(opened.inspection)).toMatchObject({ classification: 'transport' });
    const recovery = JSON.parse(await readFile(join(opened.directory, runLayout.operationRecovery(opened.inspection.occurrenceId, opened.inspection.revision)), 'utf8'));
    expect(recovery.boundary.start.mode).toBe(mode);
    expect(recovery.boundary.source).toBe(opened.ref);
    await opened.service.execute({ commandId: `source-resume-${mode}`, expectedVersion: 0, type: 'resume-recovery', payload: {
      planId: plan, jobId: opened.receipt.jobId, occurrenceId: opened.inspection.occurrenceId, expectedRevision: opened.inspection.revision } });
    const result = await opened.execution;
    expect(result.ended).toBe('submitted');
    const successor = JSON.parse(await readFile(join(opened.directory, runLayout.invocation(result.id)), 'utf8'));
    expect(successor.recoveryPredecessor).toBe(opened.inspection.attempts.at(-1));
    expect(successor.session.from).toBe(opened.ref);
    expect(successor.session.actual).toBe('fork');
    expect(opened.agent.sessions.filter(session => session.spec.role === 'global-fork')).toHaveLength(2);
    await opened.service.execute(stopRun(plan, opened.receipt.jobId, opened.service.getRun(plan, opened.receipt.jobId)!.version));
    await opened.service.settled(plan, opened.receipt.jobId);
  });
}

test('R12: unavailable fork source remains a prerequisite and never silently chooses a newer parent or a fresh context', async () => {
  const opened = await sourceOperation('fork', true);
  expect(opened.inspection.blockers).toContain('The exact recorded session source is unavailable');
  expect(opened.agent.sessions.filter(session => session.spec.role === 'global-fork')).toHaveLength(0);
  await expect(opened.service.execute({ commandId: 'unavailable-source', expectedVersion: 0, type: 'resume-recovery', payload: {
    planId: plan, jobId: opened.receipt.jobId, occurrenceId: opened.inspection.occurrenceId, expectedRevision: opened.inspection.revision } })).rejects.toMatchObject({ code: 'conflict' });
  expect(opened.agent.sessions.filter(session => session.spec.role === 'global-fork')).toHaveLength(0);
  await opened.service.execute(stopRun(plan, opened.receipt.jobId, opened.service.getRun(plan, opened.receipt.jobId)!.version));
  await opened.execution;
  await opened.service.settled(plan, opened.receipt.jobId);
});

test('R13: unavailable source can use only the named reconstruction from captured step inputs', async () => {
  const opened = await sourceOperation('fork', true, true);
  const recovery = JSON.parse(await readFile(join(opened.directory, runLayout.operationRecovery(opened.inspection.occurrenceId, opened.inspection.revision)), 'utf8'));
  expect(recovery.boundary.reconstruction).toMatchObject({ name: 'fresh-step-construction', mode: 'fresh' });
  expect(recovery.boundary.reconstruction.inputsHash).toHaveLength(64);
  expect(opened.inspection.blockers).not.toContain('The exact recorded session source is unavailable');
  expect(opened.agent.sessions.filter(session => session.spec.role === 'context-selector')).toHaveLength(1);
  await opened.service.execute({ commandId: 'reconstructed-source-resume', expectedVersion: 0, type: 'resume-recovery', payload: {
    planId: plan, jobId: opened.receipt.jobId, occurrenceId: opened.inspection.occurrenceId, expectedRevision: opened.inspection.revision } });
  let settled = false;
  void opened.execution.then(() => { settled = true; });
  await until(() => {
    const pauses = opened.service.events(plan, opened.receipt.jobId)!.filter(event => event.type === 'operation-recovery-paused');
    if (pauses.length > 1) throw new Error(JSON.stringify(opened.service.events(plan, opened.receipt.jobId)!.slice(-8)));
    return settled;
  });
  const result = await opened.execution;
  expect(result.ended).toBe('submitted');
  const successor = JSON.parse(await readFile(join(opened.directory, runLayout.invocation(result.id)), 'utf8'));
  expect(successor.session).toMatchObject({ actual: 'fresh', requested: 'fork' });
  expect(successor.session.degradedReason).toBeTruthy();
  expect(successor.recoveryPredecessor).toBeTruthy();
  expect(opened.agent.sessions.filter(session => session.spec.role === 'context-selector')).toHaveLength(2);
  await opened.service.execute(stopRun(plan, opened.receipt.jobId, opened.service.getRun(plan, opened.receipt.jobId)!.version));
  await opened.service.settled(plan, opened.receipt.jobId);
});

test('R14: unknown completion of a journaled mutating shell call forbids successors and a usable pause', async () => {
  let acknowledgementLost = false;
  let shellExecutions = 0;
  const scripted = createScriptedAgent(declaringScenarios(byRole({ 'initial-architect': [submit(emptyAnalysis())],
    engineer: [[{ kind: 'tool', tool: 'shell', input: { command: 'scripted-mutating-command' } },
      { kind: 'fail', error: 'stream failed after unknown shell acknowledgement', evidence: transport }]],
  })));
  const agent = { ...scripted, bindSessionStore(store: Parameters<typeof scripted.bindSessionStore>[0]) {
    const capture = store as typeof store & { commitCaptured?: typeof store.commit };
    const commit = async (input: Parameters<typeof store.commit>[0]) => {
      const result = await (capture.commitCaptured?.(input) ?? store.commit(input));
      if (!acknowledgementLost && input.records.some(record => {
        const effects = record.body['effects'];
        return Array.isArray(effects) && effects.some((effect: { tool?: string; phase?: string }) => effect.tool === 'shell' && effect.phase === 'intent');
      })) { acknowledgementLost = true; throw new Error('Scripted effect intent was durable but its acknowledgement was lost'); }
      return result;
    };
    return scripted.bindSessionStore({ ...store, commit, commitCaptured: commit });
  } };
  const opened = await recoveryFixture([], { agent });
  const receipt = await opened.service.execute(startRun(plan, 'scripted', 'r14', true));
  await until(() => opened.service.events(plan, receipt.jobId)!.some(event => event.type === 'review-requested'));
  const loaded = (await (await import('../prompts/packages.js')).loadPromptPackages()).packages.get('engineer')!;
  const policy = testPolicy(opened.root, { recovery: true });
  const request: import('../steps/runner.js').InvocationRequest<{ kind: string }> = { role: 'engineer', work: {}, attempt: 1, loaded,
    systemPrompt: loaded.system, prompt: 'Perform the bounded scripted shell operation', start: { mode: 'fresh' },
    brief: { kind: 'engineering', objective: 'Perform the bounded scripted shell operation', goal: 'Verify unknown effect handling', requirements: ['Retain captured authority and confirm shell completion'], sections: [],
      environment: { projectRoot: opened.root, workingDirectory: opened.root, candidate: tree, snapshot: null, limits: policy.limits,
        availableTools: ['shell'], views: [], supportPaths: [], cucumberConfiguration: null } },
    toolName: 'submit_iteration_result', description: 'Submit the bounded result', inputSchema: { type: 'object' }, submissionSchema: 'ramify-agent.effect-probe/1',
    validate: value => ({ ok: true, value: value as { kind: string } }), scope: { write: 1, measurement: null, size: null }, writer: true,
    keep: () => ({ kept: false, finished: 'work-closed' }), equip: () => ({ builtinTools: [], guard: async () => ({ allow: true }), tools: [{
      name: 'shell', description: 'A scripted external mutating command answer', mutating: true,
      inputSchema: { type: 'object', properties: { command: { type: 'string' } }, required: ['command'] },
      action: input => ({ kind: 'command', command: (input as { command: string }).command }),
      execute: async () => { shellExecutions++; return { text: 'Explicit scripted command answer' }; },
    }] }) };
  const internal = opened.service as unknown as { runs: Map<string, unknown>; recoverableInvocation<T>(run: unknown, agent: typeof opened.agent, request: import('../steps/runner.js').InvocationRequest<T>): Promise<import('../steps/runner.js').InvocationResult<T>> };
  let finished = false;
  const execution = internal.recoverableInvocation([...internal.runs.values()][0], opened.agent, request).finally(() => { finished = true; });
  await until(() => {
    const pause = opened.service.events(plan, receipt.jobId)!.find(event => event.type === 'operation-recovery-paused');
    return !!pause || finished;
  }, 1500).catch(() => { throw new Error(`Unknown effect operation did not finish: ${JSON.stringify(opened.service.events(plan, receipt.jobId)!.slice(-8))}; ack=${acknowledgementLost}, executions=${shellExecutions}, sessions=${JSON.stringify(scripted.sessions.at(-1)?.outcome)}`); });
  if (!finished) throw new Error(`Unexpected pause: ${JSON.stringify(await opened.service.recoveryInspection(plan, receipt.jobId))}; shellAcknowledgementLost=${acknowledgementLost}`);
  await execution;
  expect(acknowledgementLost).toBe(true);
  expect(shellExecutions).toBe(0);
  expect(scripted.sessions.filter(session => session.spec.role === 'engineer')).toHaveLength(1);
  expect(opened.service.getRun(plan, receipt.jobId)?.failure).toMatchObject({ reason: 'writer-unsettled' });
  expect(opened.service.events(plan, receipt.jobId)!.some(event => event.type === 'operation-recovery-paused')).toBe(false);
  expect(await opened.service.recoveryInspection(plan, receipt.jobId)).toBeNull();
  await opened.service.settled(plan, receipt.jobId);
});
