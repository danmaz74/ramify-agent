import { afterEach, expect, test } from 'vitest';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { copyFixture } from './helpers/fixture.js';
import { fixtureScratchGit, mockGit } from './helpers/mock-git.js';
import { scriptedCandidates } from './helpers/candidates.js';
import { byRole, submit } from './helpers/iterations.js';
import { emptyAnalysis, openRuns, runPath, startRun, stopRun, testPolicy, until } from './helpers/runs.js';
import { passingAudit } from './helpers/direct-check-execution.js';
import type { ConfiguredAuditPort } from '../../subs/audit/src/check-execution.js';
import { runLayout } from '../run/records.js';
import { createScriptedAgent } from '../../subs/agent/src/scripted.js';
import { declaringScenarios } from './helpers/declarations.js';

const cleanup: Array<() => Promise<void>> = [];
afterEach(async () => { for (const close of cleanup.splice(0).reverse()) await close(); });

test('a declared executable lookup correction admits actual candidate configuration while preserving the original capture', async () => {
  const copy = await copyFixture(); cleanup.push(copy.remove);
  const oldTree = 'a'.repeat(40), newTree = 'b'.repeat(40); let fixed = false;
  const path = 'ramify-audit.json';
  await writeFile(join(copy.root, path), 'original configuration');
  const git = fixtureScratchGit(mockGit({ currentHead: async () => 'base', isCleanRepository: async () => true,
    changedPaths: async () => fixed ? [path] : [], previewCandidateTree: async () => ({ repositoryRoot: copy.root, head: 'base', tree: fixed ? newTree : oldTree }),
    recoveryStatus: async () => ({ index: 'unchanged-index', staged: [], unstaged: fixed ? [path] : [], untracked: [] }) }));
  const source = scriptedCandidates(copy.root, { [oldTree]: { tree: oldTree, base: 'base', files: { [path]: 'original configuration' }, changes: [] },
    [newTree]: { tree: newTree, base: 'base', files: { [path]: 'corrected configuration' }, changes: [{ status: 'M', path }] } });
  const candidates = { ...source, treeEntries: async (root: string, tree: string) => (await source.treeEntries(root, tree)).map(entry => ({ ...entry, objectId: tree === oldTree ? 'c'.repeat(40) : 'd'.repeat(40) })) };
  const audit = passingAudit();
  const configuredAudit: ConfiguredAuditPort = { run: input => audit.run(input), read: async (root, sourceCommit) => {
    const config = await audit.read(root, sourceCommit);
    return { ...config, blob: fixed ? 'corrected-config-blob' : 'original-config-blob', checks: [{ id: 'required-typecheck',
      executor: { kind: 'command', commands: [{ cmd: fixed ? '/installed/bin/npm' : '/missing/bin/npm', args: ['run', 'type-check'], cwd: '.' }] } }] };
  } };
  const { service, agent } = await openRuns(copy.root, { git, candidates, configuredAudit, policy: root => testPolicy(root, { recovery: true }),
    script: byRole({ 'initial-architect': [[{ kind: 'fail', error: 'adapter preparation defect', evidence: { classification: 'adapter-fault', diagnostic: 'original adapter exception' } }], submit(emptyAnalysis())] }) });
  cleanup.push(() => service.close());
  const receipt = await service.execute(startRun('review-notes', 'scripted', 'configuration-repair', true));
  await until(() => service.events('review-notes', receipt.jobId)!.some(event => event.type === 'operation-recovery-paused'));
  const inspection = (await service.recoveryInspection('review-notes', receipt.jobId))!;
  fixed = true; await writeFile(join(copy.root, path), 'corrected configuration');
  await service.execute({ commandId: 'admit-config-lookup', expectedVersion: 0, type: 'resume-recovery', payload: {
    planId: 'review-notes', jobId: receipt.jobId, occurrenceId: inspection.occurrenceId, expectedRevision: inspection.revision,
    repair: { areas: ['configuration'], explanation: 'Corrected lookup of the same required npm executable; all checks and arguments remain required' } } });
  await until(() => service.events('review-notes', receipt.jobId)!.some(event => event.type === 'review-requested'));
  const events = service.events('review-notes', receipt.jobId)!;
  const resumed = events.find(event => event.type === 'operation-recovery-resumed')!;
  expect(resumed.type).toBe('operation-recovery-resumed');
  if (resumed.type !== 'operation-recovery-resumed') throw new Error('Resume record missing');
  const admission = JSON.parse(await readFile(runPath(copy.root, 'review-notes', receipt.jobId,
    runLayout.operationRecovery(inspection.occurrenceId, resumed.data.revision)), 'utf8')) as { admission: { admitted: boolean; invalidatesQualification: boolean; changes: Array<{ path: string }>; before: { configuration: { policy: { blob: string } } }; after: { configuration: { policy: { blob: string } } } } };
  expect(admission.admission).toMatchObject({ admitted: true, invalidatesQualification: true, changes: [{ path }], before: { configuration: { policy: { blob: 'original-config-blob' } } }, after: { configuration: { policy: { blob: 'corrected-config-blob' } } } });
  expect(agent!.sessions.filter(session => session.spec.role === 'initial-architect')).toHaveLength(2);
  await service.execute(stopRun('review-notes', receipt.jobId, service.getRun('review-notes', receipt.jobId)!.version)); await service.settled('review-notes', receipt.jobId);
  expect(git.unexpected).toEqual([]);
});

test.each(['compatible', 'incompatible'] as const)('a %s runtime correction survives restart and waits for explicit operator admission', async compatibility => {
  const copy = await copyFixture(); cleanup.push(copy.remove);
  const tree = 'a'.repeat(40); let revised = false;
  const git = fixtureScratchGit(mockGit({ currentHead: async () => 'base', changedPaths: async () => [],
    previewCandidateTree: async () => ({ repositoryRoot: copy.root, head: 'base', tree }),
    recoveryStatus: async () => ({ index: 'retained-index', staged: [], unstaged: [], untracked: [] }) }));
  const candidates = scriptedCandidates(copy.root, { [tree]: { tree, base: 'base', files: {}, changes: [] } });
  const agent = createScriptedAgent(declaringScenarios(byRole({ 'initial-architect': [[{ kind: 'fail', error: 'ordinary adapter defect',
    evidence: { classification: 'adapter-fault', diagnostic: 'original adapter fault before compatible runtime correction' } }], submit(emptyAnalysis())] })));
  const options = { git, candidates, agent, policy: (root: string) => testPolicy(root, { recovery: true }), recoveryRuntime: async () => ({
    harness: revised ? 'new-installed-runtime' : 'original-runtime', provider: 'retained-provider', contracts: { policy: 'operation-recovery/1',
      records: 'records/1', submissions: 'validators/1', equipment: revised && compatibility === 'incompatible' ? 'incompatible-session-equipment/2' : 'session-equipment/1', authority: 'captured-authority/1' } }) };
  const first = await openRuns(copy.root, options); cleanup.push(() => first.service.close());
  const receipt = await first.service.execute(startRun('review-notes', 'scripted', `runtime-${compatibility}`, true));
  await until(() => first.service.events('review-notes', receipt.jobId)!.some(event => event.type === 'operation-recovery-paused'));
  const original = (await first.service.recoveryInspection('review-notes', receipt.jobId))!;
  await first.service.close(); revised = true;
  const reopened = await openRuns(copy.root, options); cleanup.push(() => reopened.service.close());
  const inspection = (await reopened.service.recoveryInspection('review-notes', receipt.jobId))!;
  expect(inspection).toMatchObject({ state: 'paused', occurrenceId: original.occurrenceId, revision: original.revision });
  expect(agent.sessions.filter(session => session.spec.role === 'initial-architect')).toHaveLength(1);
  const command = { commandId: `admit-runtime-${compatibility}`, expectedVersion: 0, type: 'resume-recovery' as const, payload: {
    planId: 'review-notes', jobId: receipt.jobId, occurrenceId: inspection.occurrenceId, expectedRevision: inspection.revision,
    repair: { areas: ['runtime' as const], explanation: 'Installed a runtime fix preserving captured policy, records, validators, equipment and authority contracts' } } };
  if (compatibility === 'incompatible') {
    await expect(reopened.service.execute(command)).rejects.toMatchObject({ code: 'conflict' });
    expect(agent.sessions.filter(session => session.spec.role === 'initial-architect')).toHaveLength(1);
  } else {
    await reopened.service.execute(command);
    await until(() => reopened.service.events('review-notes', receipt.jobId)!.some(event => event.type === 'review-requested'));
    const resumed = reopened.service.events('review-notes', receipt.jobId)!.find(event => event.type === 'operation-recovery-resumed')!;
    if (resumed.type !== 'operation-recovery-resumed') throw new Error('Missing resume receipt');
    const record = JSON.parse(await readFile(runPath(copy.root, 'review-notes', receipt.jobId, runLayout.operationRecovery(inspection.occurrenceId, resumed.data.revision)), 'utf8'));
    expect(record.admission).toMatchObject({ admitted: true, before: { runtime: { harness: 'original-runtime' } }, after: { runtime: { harness: 'new-installed-runtime' } } });
    expect(agent.sessions.filter(session => session.spec.role === 'initial-architect')).toHaveLength(2);
  }
  await reopened.service.execute(stopRun('review-notes', receipt.jobId, reopened.service.getRun('review-notes', receipt.jobId)!.version));
  await reopened.service.settled('review-notes', receipt.jobId); expect(git.unexpected).toEqual([]);
});
