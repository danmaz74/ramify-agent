import { afterEach, expect, test } from 'vitest';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { copyFixture } from './helpers/fixture.js';
import { fixtureScratchGit, mockGit } from './helpers/mock-git.js';
import { scriptedCandidates } from '../../subs/autonomous/subs/acceptance/src/tests/helpers/candidates.js';
import { byRole, submit } from './helpers/iterations.js';
import { emptyAnalysis, openRuns, runPath, startRun, stopRun, testPolicy, until } from './helpers/runs.js';
import { passingAudit } from './helpers/direct-check-execution.js';
import type { ConfiguredAuditPort } from '../../subs/audit/src/check-execution.js';
import { externalCandidatePath } from '../../subs/autonomous/subs/acceptance/src/candidate-attribution.js';

const cleanup: Array<() => Promise<void>> = [];
afterEach(async () => { for (const close of cleanup.splice(0).reverse()) await close(); });

test('an executable lookup correction is observed without a recovery admission record', async () => {
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
  fixed = true; await writeFile(join(copy.root, path), 'corrected configuration');
  await service.execute({ commandId: 'continue-config-lookup', expectedVersion: 0, type: 'resume-recovery', payload: {
    planId: 'review-notes', jobId: receipt.jobId } });
  await until(() => service.events('review-notes', receipt.jobId)!.some(event => event.type === 'review-requested'));
  const events = service.events('review-notes', receipt.jobId)!;
  const observation = events.find(event => event.type === 'external-candidate-observed');
  if (observation?.type !== 'external-candidate-observed') throw new Error('Missing candidate observation');
  const record = JSON.parse(await readFile(runPath(copy.root, 'review-notes', receipt.jobId,
    externalCandidatePath(observation.data.id)), 'utf8'));
  expect(record).toMatchObject({ beforeTree: oldTree, afterTree: newTree, changes: [{ path }] });
  expect(record).not.toHaveProperty('admission');
  expect(agent!.sessions.filter(session => session.spec.role === 'initial-architect')).toHaveLength(2);
  await service.execute(stopRun('review-notes', receipt.jobId, service.getRun('review-notes', receipt.jobId)!.version)); await service.settled('review-notes', receipt.jobId);
  expect(git.unexpected).toEqual([]);
});
