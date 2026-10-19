import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { copyFixture } from '../../../../src/tests/helpers/fixture.js';
import { analysis, entry } from '../../../../src/tests/helpers/analysis.js';
import { byRole, submit, treeInputs } from '../../../../src/tests/helpers/iterations.js';
import { mockGit } from '../../../../src/tests/helpers/mock-git.js';
import { scriptedCandidates } from '../../../../src/tests/helpers/candidates.js';
import { openRuns, startRun, stopRun, until } from '../../../../src/tests/helpers/runs.js';
import { runLayout } from '../run/records.js';

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0).reverse()) await cleanup(); });
const plan = 'review-notes', tree = 'a'.repeat(40);
async function failedTask() {
  const copied = await copyFixture(); cleanups.push(copied.remove);
  let interrupted = false, entered = false;
  const git = mockGit({ currentHead: async () => 'base', isCleanRepository: async () => true,
    createRunBranch: async () => ({ branch: 'retained-run', created: true }), commitAccepted: async () => null,
    changedPaths: async () => [], changedEntries: async () => [], worktreeLineChanges: async () => [],
    previewCandidateTree: async () => ({ repositoryRoot: copied.root, head: 'base', tree }),
  });
  const options = { git, inputs: treeInputs(),
    candidates: scriptedCandidates(copied.root, { [tree]: { tree, base: 'base', files: {}, changes: [] }, base: { tree, base: 'base', files: {}, changes: [] } }),
    script: byRole({ 'initial-architect': [submit(analysis([entry('review-notes', 'collection-review/workspace/reviews')]))],
      'local-architect': [[{ kind: 'await' as const, until: () => { entered = true; return new Promise(() => undefined); } }]] }),
    afterWrite: async (write: string) => { if (write === 'analysis-accepted' && !interrupted) { interrupted = true; throw new Error('Historical service failure'); } },
  };
  const opened = await openRuns(copied.root, options); cleanups.push(() => opened.service.close());
  const receipt = await opened.service.execute(startRun(plan));
  await opened.service.settled(plan, receipt.jobId);
  expect(opened.service.getRun(plan, receipt.jobId)?.state).toBe('failed');
  return { ...opened, root: copied.root, options, runId: receipt.jobId, entered: () => entered };
}

test('continuation preserves historical failure and accepted analysis without copying run history', async () => {
  const fixture = await failedTask();
  const directory = join(fixture.root, 'plans', plan, '.harness/jobs', fixture.runId);
  const before = await readFile(join(directory, runLayout.events), 'utf8');
  const sessions = fixture.agent!.sessions.filter(session => session.spec.role === 'initial-architect').length;
  const inspection = (await fixture.service.restartInspection(plan, fixture.runId))!;
  expect(inspection).toMatchObject({ canPrepare: true, successor: null });
  const command = { type: 'prepare-restart' as const, commandId: 'continue-once', expectedVersion: inspection.cursor, payload: { planId: plan, jobId: fixture.runId } };
  const [receipt, repeated] = await Promise.all([fixture.service.execute(command), fixture.service.execute(command)]);
  expect(repeated).toEqual(receipt);
  expect(receipt.jobId).toBe(fixture.runId);
  await until(fixture.entered);
  expect((await readFile(join(directory, runLayout.events), 'utf8')).startsWith(before)).toBe(true);
  expect(fixture.service.events(plan, fixture.runId)!.filter(event => event.type === 'job-continued')).toHaveLength(1);
  expect(fixture.service.events(plan, fixture.runId)!.filter(event => event.type === 'job-failed')).toHaveLength(1);
  expect(fixture.agent!.sessions.filter(session => session.spec.role === 'initial-architect')).toHaveLength(sessions);
  expect(await readdir(join(fixture.root, 'plans', plan, '.harness/jobs'))).toEqual([fixture.runId]);
  expect(await fixture.service.recoveryInspection(plan, fixture.runId)).toBeNull();
  await fixture.service.execute(stopRun(plan, fixture.runId, fixture.service.getRun(plan, fixture.runId)!.version));
});

test('continued history reopens and retains command deduplication', async () => {
  const fixture = await failedTask();
  const command = { type: 'prepare-restart' as const, commandId: 'continue-and-reopen', expectedVersion: fixture.service.getRun(plan, fixture.runId)!.version, payload: { planId: plan, jobId: fixture.runId } };
  const receipt = await fixture.service.execute(command);
  await until(fixture.entered);
  await fixture.service.execute(stopRun(plan, fixture.runId, fixture.service.getRun(plan, fixture.runId)!.version));
  await fixture.service.close();
  const reopened = await openRuns(fixture.root, { ...fixture.options, script: undefined, agent: fixture.agent, afterWrite: undefined }); cleanups.push(() => reopened.service.close());
  expect(await reopened.service.execute(command)).toEqual(receipt);
  expect(reopened.service.getRun(plan, fixture.runId)?.state).toBe('stopped');
  expect((await reopened.service.restartInspection(plan, fixture.runId))?.canPrepare).toBe(false);
});
