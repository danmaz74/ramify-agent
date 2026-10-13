import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';
import { copyFixture } from './helpers/fixture.js';
import { analysis, entry, requestCompletion, architectScenario } from './helpers/analysis.js';
import { byRole, byWork, submit, treeInputs } from './helpers/iterations.js';
import { mockGit } from './helpers/mock-git.js';
import { scriptedCandidates } from './helpers/candidates.js';
import { openRuns, startRun, stopRun, until } from './helpers/runs.js';
import { HarnessSessionOperations } from '../run/session-operations.js';
import { runLayout } from '../run/records.js';

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0).reverse()) await cleanup(); vi.restoreAllMocks(); });
const plan = 'review-notes', tree = 'a'.repeat(40);
async function failedArchitect(finish = false, extra: Partial<Parameters<typeof openRuns>[1]> = {}) {
  const copied = await copyFixture(); cleanups.push(copied.remove);
  const root = copied.root;
  let pendingArchitectEntered = false;
  let currentBranch = 'main'; const branches = new Map<string, string>();
  const git = mockGit({ currentHead: async () => 'base', isCleanRepository: async () => true,
    createRunBranch: async (_root, runId) => { const branch = `ramify-agent-run/${runId}`; const created = !branches.has(branch); branches.set(branch, 'base'); currentBranch = branch; return { branch, created }; },
    inspectRunBranch: async (_root, runId) => { const branch = `ramify-agent-run/${runId}`; return { branch, head: branches.get(branch) ?? null, current: currentBranch }; }, commitAccepted: async () => null,
    findCommitByTrailer: async () => null, findCommitByTrailers: async () => null,
    changedPaths: async () => [], changedEntries: async () => [], worktreeLineChanges: async () => [],
    previewCandidateTree: async () => ({ repositoryRoot: root, head: 'base', tree }),
    recoveryStatus: async () => ({ index: 'index', staged: [], unstaged: [], untracked: [] }),
  });
  const inputs = treeInputs();
  const options = { git, auditSettlement: vi.fn(async () => ({ confirmed: true, evidence: ['Scripted owner receipt confirms no admitted external audit producer remains'] })), recoveryRuntime: async () => ({ harness: 'installed-test-harness', provider: 'scripted-test-provider', contracts: { policy: 'policy', records: 'records', submissions: 'submissions', equipment: 'equipment', authority: 'authority' } }), inputs: { ...inputs, capture: async (...args: Parameters<typeof inputs.capture>) => {
    const capture = await inputs.capture(...args); return { ...capture, versions: { ...capture.versions, ramify: '0.5.0' } };
  } }, candidates: scriptedCandidates(root, { [tree]: { tree, base: 'base', files: {}, changes: [] }, base: { tree, base: 'base', files: {}, changes: [] } }),
    script: byRole({ 'initial-architect': [submit(analysis([entry('review-notes', 'collection-review/workspace/reviews')]))],
      'local-architect': [[{ kind: 'legacy-context-return' as const, tokens: 150_000 }], finish ? submit(requestCompletion()) : [{ kind: 'await' as const, until: () => { pendingArchitectEntered = true; return new Promise(() => undefined); } }]] }),
    ...extra,
  };
  const opened = await openRuns(root, options); cleanups.push(() => opened.service.close());
  const receipt = await opened.service.execute(startRun(plan)); await opened.service.settled(plan, receipt.jobId);
  expect(opened.service.getRun(plan, receipt.jobId)?.state).toBe('failed');
  return { ...opened, root, options, source: receipt.jobId, git, pendingArchitectEntered: () => pendingArchitectEntered };
}

/** Stop only after the scripted task is parked and both admission records are durable. */
async function parkedArchitect(fixture: Awaited<ReturnType<typeof failedArchitect>>, runId: string,
  entered: () => boolean = fixture.pendingArchitectEntered): Promise<void> {
  await until(() => {
    const events = fixture.service.events(plan, runId)!;
    const invocation = events.find(event => event.sequence > 0 && event.type === 'invocation-started' && event.data.role === 'local-architect');
    return entered() && invocation?.type === 'invocation-started' && events.some(event => event.type === 'invocation-prepared'
      && event.data.invocation === invocation.data.invocation && event.data.recorded === 'operation-identity');
  });
}

test('prepare commits one held successor without changing the failed source, and retries survive startup', async () => {
  const fixture = await failedArchitect();
  const sourcePath = join(fixture.root, 'plans', plan, '.harness/jobs', fixture.source, runLayout.events);
  const before = await readFile(sourcePath);
  const inspection = await fixture.service.restartInspection(plan, fixture.source);
  expect(inspection, JSON.stringify(inspection)).toMatchObject({ canPrepare: true, settlement: 'confirmed', boundary: { role: 'local-architect' } });
  const sessions = fixture.agent!.sessions.length;
  const commits = fixture.git.commitAccepted.mock.calls.length;
  const command = { type: 'prepare-restart' as const, commandId: 'prepare-once', expectedVersion: inspection!.cursor, payload: { planId: plan, jobId: fixture.source } };
  const [receipt, repeated] = await Promise.all([fixture.service.execute(command), fixture.service.execute(command)]);
  expect(repeated).toEqual(receipt); expect(receipt.jobId).not.toBe(fixture.source);
  expect(fixture.agent!.sessions).toHaveLength(sessions); expect(fixture.git.commitAccepted.mock.calls).toHaveLength(commits);
  expect(await readFile(sourcePath)).toEqual(before);
  const recovery = await fixture.service.recoveryInspection(plan, receipt.jobId);
  expect(recovery).toMatchObject({ state: 'paused', restart: { sourceRun: fixture.source }, repairRequired: true });
  await expect(fixture.service.execute({ ...command, commandId: 'competitor' })).rejects.toMatchObject({ code: 'conflict' });
  await expect(fixture.service.execute({ ...command, expectedVersion: 0 })).rejects.toMatchObject({ code: 'conflict' });
  await fixture.service.close();
  const reopened = await openRuns(fixture.root, { ...fixture.options, script: undefined, agent: fixture.agent }); cleanups.push(() => reopened.service.close());
  expect(await reopened.service.execute(command)).toEqual(receipt);
  expect(await reopened.service.recoveryInspection(plan, receipt.jobId)).toMatchObject({ occurrenceId: recovery!.occurrenceId, state: 'paused' });
  await reopened.service.execute(stopRun(plan, receipt.jobId, reopened.service.getRun(plan, receipt.jobId)!.version));
});

test('resume reconstructs the retained module architect in a fresh successor session without repeating analysis', async () => {
  const fixture = await failedArchitect();
  const inspection = (await fixture.service.restartInspection(plan, fixture.source))!;
  const prepared = await fixture.service.execute({ type: 'prepare-restart', commandId: 'fresh-prepare', expectedVersion: inspection.cursor, payload: { planId: plan, jobId: fixture.source } });
  const recovery = (await fixture.service.recoveryInspection(plan, prepared.jobId))!;
  const before = fixture.agent!.sessions.filter(session => session.spec.role === 'initial-architect').length;
  const sessionsBefore = fixture.agent!.sessions.length;
  await fixture.service.execute({ type: 'resume-recovery', commandId: 'fresh-resume', expectedVersion: 0, payload: { planId: plan, jobId: prepared.jobId,
    occurrenceId: recovery.occurrenceId, expectedRevision: recovery.revision, repair: { areas: ['runtime'], explanation: 'The compatible continuity runtime replaces the captured historical context cutoff' } } });
  await parkedArchitect(fixture, prepared.jobId);
  expect(fixture.agent!.sessions.filter(session => session.spec.role === 'initial-architect')).toHaveLength(before);
  await until(() => fixture.agent!.sessions.length > sessionsBefore);
  const started = fixture.service.events(plan, prepared.jobId)!.filter(event => event.type === 'invocation-started' && event.sequence > 0 && event.data.role === 'local-architect').at(-1)!;
  if (started.type !== 'invocation-started') throw new Error('Missing successor invocation');
  const invocation = JSON.parse(await readFile(join(fixture.root, 'plans', plan, '.harness/jobs', prepared.jobId, runLayout.invocation(started.data.invocation)), 'utf8'));
  expect(invocation.session.requested).toBe('fresh');
  expect(fixture.agent!.sessions.at(-1)!.spec.prompt).toContain('Source-backed reconstruction');
  await fixture.service.execute(stopRun(plan, prepared.jobId, fixture.service.getRun(plan, prepared.jobId)!.version));
});


test('the successor completes its retained architect obligation and runs fresh candidate qualification', async () => {
  const fixture = await failedArchitect(true);
  const source = fixture.service.events(plan, fixture.source)!;
  const initialCalls = fixture.agent!.sessions.filter(session => session.spec.role === 'initial-architect').length;
  const inspection = (await fixture.service.restartInspection(plan, fixture.source))!;
  const prepared = await fixture.service.execute({ type: 'prepare-restart', commandId: 'complete-prepare', expectedVersion: inspection.cursor, payload: { planId: plan, jobId: fixture.source } });
  const recovery = (await fixture.service.recoveryInspection(plan, prepared.jobId))!;
  await fixture.service.execute({ type: 'resume-recovery', commandId: 'complete-resume', expectedVersion: 0, payload: {
    planId: plan, jobId: prepared.jobId, occurrenceId: recovery.occurrenceId, expectedRevision: recovery.revision,
    repair: { areas: ['runtime'], explanation: 'Adopt the compatible continuity runtime and reassess the retained completion under current validators' } } });
  await fixture.service.settled(plan, prepared.jobId);
  expect(fixture.service.getRun(plan, prepared.jobId)?.state, JSON.stringify(fixture.service.getRun(plan, prepared.jobId))).toBe('completed');
  const events = fixture.service.events(plan, prepared.jobId)!;
  expect(events.filter(event => event.sequence > 0 && event.type === 'analysis-accepted')).toHaveLength(0);
  expect(events.filter(event => event.sequence > 0 && event.type === 'work-item-completed')).toHaveLength(1);
  expect(events.filter(event => event.sequence > 0 && event.type === 'gate-attempted' && event.data.checkpoint === 'final' && event.data.verdict === 'passed')).toHaveLength(1);
  expect(fixture.agent!.sessions.filter(session => session.spec.role === 'initial-architect')).toHaveLength(initialCalls);
  expect(fixture.service.events(plan, fixture.source)).toEqual(source);
  expect(fixture.git.unexpected).toEqual([]);
});


test.each(['restart-staged', 'restart-prepared'] as const)('crash after %s retains exactly the committed preparation authority', async boundary => {
  let crash = true;
  const fixture = await failedArchitect(false, { afterWrite: async write => { if (write === boundary && crash) { crash = false; throw new Error('Injected preparation crash'); } } });
  const inspection = (await fixture.service.restartInspection(plan, fixture.source))!;
  const command = { type: 'prepare-restart' as const, commandId: `crash-${boundary}`, expectedVersion: inspection.cursor, payload: { planId: plan, jobId: fixture.source } };
  await expect(fixture.service.execute(command)).rejects.toThrow('Injected preparation crash');
  const beforeRestart = fixture.agent!.sessions.length;
  await fixture.service.close();
  const reopened = await openRuns(fixture.root, { ...fixture.options, script: undefined, agent: fixture.agent }); cleanups.push(() => reopened.service.close());
  const committed = reopened.service.listRuns(plan).filter(run => run.jobId !== fixture.source);
  expect(committed).toHaveLength(boundary === 'restart-prepared' ? 1 : 0);
  const receipt = await reopened.service.execute(command);
  if (boundary === 'restart-prepared') expect(receipt.jobId).toBe(committed[0]!.jobId);
  expect(reopened.service.listRuns(plan).filter(run => run.jobId !== fixture.source)).toHaveLength(1);
  expect(fixture.agent!.sessions).toHaveLength(beforeRestart);
  await reopened.service.execute(stopRun(plan, receipt.jobId, reopened.service.getRun(plan, receipt.jobId)!.version));
});

test('unknown original effects and stale cursors refuse preparation without a successor', async () => {
  const fixture = await failedArchitect();
  const inspection = (await fixture.service.restartInspection(plan, fixture.source))!;
  const command = { type: 'prepare-restart' as const, commandId: 'unknown-effect', expectedVersion: inspection.cursor, payload: { planId: plan, jobId: fixture.source } };
  await expect(fixture.service.execute({ ...command, expectedVersion: inspection.cursor - 1 })).rejects.toMatchObject({ code: 'stale-version' });
  const observe = vi.spyOn(HarnessSessionOperations.prototype, 'unresolvedEffects').mockResolvedValue(['opaque-effect']);
  expect(await fixture.service.restartInspection(plan, fixture.source)).toMatchObject({ canPrepare: false, effects: 'unknown', blockers: expect.arrayContaining([expect.stringContaining('unknown external effect')]) });
  await expect(fixture.service.execute(command)).rejects.toMatchObject({ code: 'conflict' });
  expect(fixture.service.listRuns(plan)).toHaveLength(1); observe.mockRestore();
});

test('a corrupt imported artifact blocks resume and its committed successor claim survives startup', async () => {
  const fixture = await failedArchitect();
  const inspection = (await fixture.service.restartInspection(plan, fixture.source))!;
  const command = { type: 'prepare-restart' as const, commandId: 'tampered-import', expectedVersion: inspection.cursor, payload: { planId: plan, jobId: fixture.source } };
  const prepared = await fixture.service.execute(command);
  const recovery = (await fixture.service.recoveryInspection(plan, prepared.jobId))!;
  const path = join(fixture.root, 'plans', plan, '.harness/jobs', prepared.jobId, runLayout.restartImport);
  const imported = JSON.parse(await readFile(path, 'utf8')); imported.pending.work.workItem = 'wi-forged';
  await writeFile(path, JSON.stringify(imported));
  const calls = fixture.agent!.sessions.length;
  await expect(fixture.service.execute({ type: 'resume-recovery', commandId: 'tampered-resume', expectedVersion: 0, payload: { planId: plan, jobId: prepared.jobId,
    occurrenceId: recovery.occurrenceId, expectedRevision: recovery.revision, repair: { areas: ['runtime'], explanation: 'A declaration cannot authenticate tampered proof' } } })).rejects.toMatchObject({ code: 'conflict' });
  expect(fixture.agent!.sessions).toHaveLength(calls);
  await fixture.service.close();
  const reopened = await openRuns(fixture.root, { ...fixture.options, script: undefined, agent: fixture.agent }); cleanups.push(() => reopened.service.close());
  expect(await reopened.service.restartInspection(plan, fixture.source)).toMatchObject({ canPrepare: false, successor: prepared.jobId });
  await expect(reopened.service.execute({ ...command, commandId: 'tampered-competitor' })).rejects.toMatchObject({ code: 'conflict' });
});


test('two completed items and eight done reports remain history while the exact pending module architect resumes first', async () => {
  let pendingArchitectEntered = false;
  const owner = 'collection-review/workspace/reviews';
  const entries = [entry('first', owner), entry('second', owner), entry('pending', owner)];
  const scenarios = entries.flatMap((item, index) => Array.from({ length: index < 2 ? 4 : 1 }, (_, scenario) => architectScenario(item, `${item.capability}-${scenario}`)));
  const fixture = await failedArchitect(false, { script: byWork({
    'initial-architect': [submit(analysis(entries, [], [], scenarios))],
    'local-architect:wi-001': [submit(requestCompletion())], 'local-architect:wi-002': [submit(requestCompletion())],
    'local-architect:wi-003': [[{ kind: 'legacy-context-return', tokens: 150000 }], [{ kind: 'await', until: () => { pendingArchitectEntered = true; return new Promise(() => undefined); } }]],
  }) });
  const historical = fixture.service.events(plan, fixture.source)!;
  expect(historical.filter(event => event.type === 'work-item-completed')).toHaveLength(2);
  expect(historical.filter(event => event.type === 'obligation-reported' && event.data.judgment === 'done')).toHaveLength(8);
  const inspection = (await fixture.service.restartInspection(plan, fixture.source))!;
  expect(inspection).toMatchObject({ canPrepare: true, boundary: { work: { workItem: 'wi-003' } } });
  const prepared = await fixture.service.execute({ type: 'prepare-restart', commandId: 'plan43-shape', expectedVersion: inspection.cursor, payload: { planId: plan, jobId: fixture.source } });
  const recovery = (await fixture.service.recoveryInspection(plan, prepared.jobId))!;
  await fixture.service.execute({ type: 'resume-recovery', commandId: 'plan43-shape-resume', expectedVersion: 0, payload: { planId: plan, jobId: prepared.jobId, occurrenceId: recovery.occurrenceId, expectedRevision: recovery.revision,
    repair: { areas: ['runtime'], explanation: 'Keep accepted decomposition and reconstruct its pending module architect under continuity' } } });
  await parkedArchitect(fixture, prepared.jobId, () => pendingArchitectEntered);
  const next = fixture.service.events(plan, prepared.jobId)!.find(event => event.sequence > 0 && event.type === 'invocation-started' && event.data.role === 'local-architect')!;
  expect(next.data).toMatchObject({ work: { workItem: 'wi-003' } });
  expect(fixture.service.events(plan, fixture.source)).toEqual(historical);
  await fixture.service.execute(stopRun(plan, prepared.jobId, fixture.service.getRun(plan, prepared.jobId)!.version));
});

test('an authenticated lost gate acknowledgement preserves its source commit and runs a new audit without repeating that commit', async () => {
  let interrupted = false;
  const fixture = await failedArchitect(true, { script: byRole({
    'initial-architect': [submit(analysis([entry('review-notes', 'collection-review/workspace/reviews')]))],
    'local-architect': [submit(requestCompletion()), submit(requestCompletion())],
  }), afterWrite: async write => { if (write === 'gate-attempted' && !interrupted) { interrupted = true; throw new Error('Source lost gate acknowledgement'); } } });
  const intent = fixture.service.events(plan, fixture.source)!.find(event => event.type === 'gate-committing')!;
  if (intent.type !== 'gate-committing') throw new Error('Missing original gate intent');
  fixture.git.findCommitByTrailers.mockImplementation(async (_root, trailers) => trailers.some(trailer => trailer.key === 'Ramify-Run' && trailer.value === fixture.source)
    && trailers.some(trailer => trailer.key === 'Ramify-Gate' && trailer.value === intent.data.gate) ? 'base' : null);
  vi.mocked(fixture.git.isAncestor!).mockResolvedValue(true);
  const beforeCommitCalls = fixture.git.commitAccepted.mock.calls.length;
  const auditSettlement = vi.mocked(fixture.options.auditSettlement!).mockResolvedValueOnce({ confirmed: false, evidence: ['Original producer owner is unavailable'] });
  expect(await fixture.service.restartInspection(plan, fixture.source)).toMatchObject({ canPrepare: false, blockers: expect.arrayContaining([expect.stringContaining('audit producer settlement is unknown')]) });
  auditSettlement.mockClear();
  const inspection = (await fixture.service.restartInspection(plan, fixture.source))!;
  expect(inspection, JSON.stringify(inspection)).toMatchObject({ canPrepare: true, settlement: 'confirmed' });
  const prepared = await fixture.service.execute({ type: 'prepare-restart', commandId: 'receipt-prepare', expectedVersion: inspection.cursor, payload: { planId: plan, jobId: fixture.source } });
  const imported = JSON.parse(await readFile(join(fixture.root, 'plans', plan, '.harness/jobs', prepared.jobId, runLayout.restartImport), 'utf8'));
  expect(imported.recognizedEffects).toMatchObject([{ sourceRun: fixture.source, gate: intent.data.gate, commit: 'base', tree }]);
  const recovery = (await fixture.service.recoveryInspection(plan, prepared.jobId))!;
  await fixture.service.execute({ type: 'resume-recovery', commandId: 'receipt-resume', expectedVersion: 0, payload: { planId: plan, jobId: prepared.jobId,
    occurrenceId: recovery.occurrenceId, expectedRevision: recovery.revision, repair: { areas: ['runtime'], explanation: 'The independently retained source commit acknowledges the lost gate effect; reassess under the current producer' } } });
  await fixture.service.settled(plan, prepared.jobId);
  expect(fixture.service.getRun(plan, prepared.jobId)?.state, JSON.stringify(fixture.service.getRun(plan, prepared.jobId))).toBe('completed');
  const completed = fixture.service.events(plan, prepared.jobId)!.filter(event => event.type === 'gate-attempted').filter(event => event.sequence > 0);
  expect(completed.filter(event => event.data.checkpoint === 'work-item')).toHaveLength(1);
  expect(fixture.git.commitAccepted.mock.calls).toHaveLength(beforeCommitCalls + 1); // Only the successor's final gate may commit.
  expect(fixture.service.events(plan, fixture.source)!.filter(event => event.type === 'gate-attempted' && event.data.gate === intent.data.gate)).toHaveLength(0);
});

test('a supported final boundary retains its closed assessment rounds and qualifies again after producer repair', async () => {
  let gates = 0;
  const fixture = await failedArchitect(true, { script: byRole({
    'initial-architect': [submit(analysis([entry('review-notes', 'collection-review/workspace/reviews')]))],
    'local-architect': [submit(requestCompletion())],
  }), afterWrite: async write => { if (write === 'gate-committed' && ++gates === 2) throw new Error('Final publication interrupted after durable gate settlement'); } });
  const historical = fixture.service.events(plan, fixture.source)!;
  expect(historical.filter(event => event.type === 'work-item-completed')).toHaveLength(1);
  expect(historical.filter(event => event.type === 'nonfunctional-round-closed')).toHaveLength(1);
  const inspection = (await fixture.service.restartInspection(plan, fixture.source))!;
  expect(inspection, JSON.stringify(inspection)).toMatchObject({ canPrepare: true, boundary: { kind: 'gate' } });
  const prepared = await fixture.service.execute({ type: 'prepare-restart', commandId: 'final-import', expectedVersion: inspection.cursor, payload: { planId: plan, jobId: fixture.source } });
  const recovery = (await fixture.service.recoveryInspection(plan, prepared.jobId))!;
  await fixture.service.execute({ type: 'resume-recovery', commandId: 'final-import-resume', expectedVersion: 0, payload: { planId: plan, jobId: prepared.jobId,
    occurrenceId: recovery.occurrenceId, expectedRevision: recovery.revision, repair: { areas: ['runtime'], explanation: 'Fresh producer verification replaces historical qualification while retaining its semantic rounds' } } });
  await fixture.service.settled(plan, prepared.jobId);
  expect(fixture.service.getRun(plan, prepared.jobId)?.state, JSON.stringify(fixture.service.getRun(plan, prepared.jobId))).toBe('completed');
  const events = fixture.service.events(plan, prepared.jobId)!;
  expect(events.filter(event => event.sequence > 0 && event.type === 'nonfunctional-final-invalidated')).toHaveLength(1);
  expect(events.filter(event => event.type === 'nonfunctional-round-closed')).toHaveLength(2);
  expect(fixture.service.events(plan, fixture.source)).toEqual(historical);
});

test('a conflicting successor ref leaves the imported workflow held before any new session', async () => {
  const fixture = await failedArchitect();
  const inspection = (await fixture.service.restartInspection(plan, fixture.source))!;
  const prepared = await fixture.service.execute({ type: 'prepare-restart', commandId: 'branch-conflict', expectedVersion: inspection.cursor, payload: { planId: plan, jobId: fixture.source } });
  const recovery = (await fixture.service.recoveryInspection(plan, prepared.jobId))!;
  const observe = vi.mocked(fixture.git.inspectRunBranch!).getMockImplementation()!;
  vi.mocked(fixture.git.inspectRunBranch!).mockImplementation(async (root, runId) => runId === prepared.jobId
    ? { branch: `ramify-agent-run/${runId}`, head: 'conflicting-head', current: `ramify-agent-run/${fixture.source}` } : observe(root, runId));
  const sessions = fixture.agent!.sessions.length;
  await fixture.service.execute({ type: 'resume-recovery', commandId: 'branch-conflict-resume', expectedVersion: 0, payload: { planId: plan, jobId: prepared.jobId,
    occurrenceId: recovery.occurrenceId, expectedRevision: recovery.revision, repair: { areas: ['runtime'], explanation: 'Adopt the continuity runtime before executing the retained workflow' } } });
  expect(await fixture.service.recoveryInspection(plan, prepared.jobId)).toMatchObject({ state: 'paused', boundary: { kind: 'preparation', checkpoint: 'restart-branch' }, evidence: { diagnostic: expect.stringContaining('already exists') } });
  expect(fixture.agent!.sessions).toHaveLength(sessions); expect(fixture.git.createRunBranch.mock.calls).toHaveLength(1);
  await fixture.service.execute(stopRun(plan, prepared.jobId, fixture.service.getRun(plan, prepared.jobId)!.version));
});

test('a lost branch acknowledgement is reconciled from its admitted ref before fresh dispatch', async () => {
  const fixture = await failedArchitect();
  const inspection = (await fixture.service.restartInspection(plan, fixture.source))!;
  const prepared = await fixture.service.execute({ type: 'prepare-restart', commandId: 'branch-receipt', expectedVersion: inspection.cursor, payload: { planId: plan, jobId: fixture.source } });
  const recovery = (await fixture.service.recoveryInspection(plan, prepared.jobId))!;
  const create = fixture.git.createRunBranch.getMockImplementation()!;
  let interrupted = false;
  fixture.git.createRunBranch.mockImplementation(async (...args) => { const result = await create(...args); if (!interrupted && args[1] === prepared.jobId) { interrupted = true; throw new Error('Lost branch acknowledgement'); } return result; });
  await fixture.service.execute({ type: 'resume-recovery', commandId: 'branch-receipt-resume', expectedVersion: 0, payload: { planId: plan, jobId: prepared.jobId,
    occurrenceId: recovery.occurrenceId, expectedRevision: recovery.revision, repair: { areas: ['runtime'], explanation: 'Adopt the continuity runtime before branch setup' } } });
  const held = (await fixture.service.recoveryInspection(plan, prepared.jobId))!;
  expect(held).toMatchObject({ state: 'paused', boundary: { checkpoint: 'restart-branch' } });
  await fixture.service.execute({ type: 'resume-recovery', commandId: 'branch-receipt-second', expectedVersion: 0, payload: { planId: plan, jobId: prepared.jobId,
    occurrenceId: held.occurrenceId, expectedRevision: held.revision, repair: { areas: ['environment'], explanation: 'The owned branch ref and unchanged candidate authenticate completion despite the missing acknowledgement' } } });
  await parkedArchitect(fixture, prepared.jobId);
  expect(fixture.git.createRunBranch.mock.calls.filter(call => call[1] === prepared.jobId)).toHaveLength(1);
  expect(fixture.service.events(plan, prepared.jobId)!.filter(event => event.sequence > 0 && event.type === 'restart-branch-ready')).toHaveLength(1);
  await fixture.service.execute(stopRun(plan, prepared.jobId, fixture.service.getRun(plan, prepared.jobId)!.version));
});
