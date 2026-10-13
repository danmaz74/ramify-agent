import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { createAuditWorkspaceOwnership, inspectAuditSettlement } from '../run/audit-workspaces.js';

test('a commit or abandoned workspace alone cannot authenticate producer settlement', async () => {
  const root = await mkdtemp(join(tmpdir(), 'restart-audit-settlement-'));
  const runId = '20261012T214112Z-fe22d2', attemptId = 'ga-0003', sourceCommit = 'c'.repeat(40);
  const directory = join(root, 'plans/test-plan/.harness/jobs', runId);
  await mkdir(directory, { recursive: true });
  try {
    const owner = createAuditWorkspaceOwnership(root);
    const workspace = { repositoryRoot: root, gitCommonDirectory: join(root, '.git'), repositoryId: 'repository',
      temporaryDirectory: join(root, 'temporary'), worktreePath: join(root, 'temporary/worktree'), runId, attemptId, sourceCommit,
      process: { id: process.pid, startMarker: 'scripted-owner' } };
    await owner.recordIntendedWorkspace(workspace);
    expect(await inspectAuditSettlement(root, runId, attemptId, sourceCommit)).toEqual({ confirmed: false, evidence: [] });
    await owner.recordWorkspaceCleaned(workspace);
    const path = join(directory, 'gates', attemptId, 'audit-workspace.json');
    const before = await readFile(path);
    expect(await inspectAuditSettlement(root, runId, attemptId, sourceCommit)).toEqual({ confirmed: false, evidence: [] });
    await owner.recordAuditInvocation({ schema: 'ramify-agent.audit-invocation/1', runId, attemptId, sourceCommit, projectRoot: root,
      requestId: 'scripted-completed-request', projects: [{ projectRoot: root, verdict: 'indeterminate', execution: 'not-run', failures: ['Scripted producer outcome'],
        requestId: 'scripted-project-request', runId: null, record: null, reused: null, unpublished: null }],
      discovery: { status: 'complete', skipped: [], unavailable: [] }, invocationVerdict: 'indeterminate' });
    const confirmed = await inspectAuditSettlement(root, runId, attemptId, sourceCommit);
    expect(confirmed).toMatchObject({ confirmed: true, evidence: [expect.stringContaining('audit-workspace.json#sha256:'), expect.stringContaining('audit-invocation.json#sha256:')] });
    expect(await inspectAuditSettlement(root, runId, attemptId, 'other-commit')).toEqual({ confirmed: false, evidence: [] });
    expect(await readFile(path)).toEqual(before);
  } finally { await rm(root, { recursive: true, force: true }); }
});
