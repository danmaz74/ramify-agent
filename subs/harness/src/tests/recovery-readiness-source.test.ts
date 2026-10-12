import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import type { ConfiguredAuditPort } from '../../subs/audit/src/check-execution.js';
import { copyFixture } from './helpers/fixture.js';
import { fixtureScratchGit, mockGit } from './helpers/mock-git.js';
import { scriptedCandidates } from './helpers/candidates.js';
import { commandResult } from './helpers/command-result.js';
import { passingAudit } from './helpers/direct-check-execution.js';
import { emptyAnalysis, openRuns, runPath, startRun, testPolicy, until } from './helpers/runs.js';
import { runLayout } from '../run/records.js';

const cleanup: Array<() => Promise<void>> = [];
afterEach(async () => { for (const close of cleanup.splice(0).reverse()) await close(); });

test.each(['acknowledged', 'lost-acknowledgement'] as const)('readiness admits staged, unstaged, untracked and operational repairs through one %s run-branch commit', async outcome => {
  const copy = await copyFixture(); cleanup.push(copy.remove);
  await writeFile(join(copy.root, 'ramify-agent.json'), JSON.stringify({ schema: 'ramify-agent.project/1',
    setup: [{ name: 'setup-effect', command: ['setup-tool', 'prepare'], cwd: '.', timeoutMs: 30000 }] }));
  const oldTree = 'a'.repeat(40), repairedTree = 'b'.repeat(40), paths = ['ramify-audit.json', 'src/staged.ts', 'src/unstaged.ts', 'src/new.ts'];
  const oldConfigText = JSON.stringify({ checks: [{ id: 'type-check', cmd: '/missing/bin/npm', args: ['run', 'type-check'] }] });
  const newConfigText = JSON.stringify({ checks: [{ id: 'type-check', cmd: '/installed/bin/npm', args: ['run', 'type-check'] }] });
  await writeFile(join(copy.root, paths[0]!), oldConfigText);
  let repaired = false, dirty = false, committed = false, head = 'base', branch = 'main', writes = 0, setup = 0, audits = 0;
  const tree = () => repaired ? repairedTree : oldTree;
  const git = fixtureScratchGit(mockGit({ currentHead: async () => head, isCleanRepository: async () => !dirty,
    changedPaths: async () => repaired ? paths : [], changedEntries: async () => [],
    previewCandidateTree: async () => ({ repositoryRoot: copy.root, head, tree: tree() }),
    recoveryStatus: async () => ({ index: dirty ? 'operator-index' : 'clean-index', staged: dirty ? ['src/staged.ts'] : [],
      unstaged: dirty ? ['ramify-audit.json', 'src/unstaged.ts'] : [], untracked: dirty ? ['src/new.ts'] : [] }),
    createRunBranch: async (_root, id) => { const created = branch === 'main'; branch = `ramify-agent-run/${id}`; return { branch, created }; },
    findCommitByTrailers: async (_root, trailers) => trailers.some(trailer => trailer.key === 'Ramify-Gate' && trailer.value.startsWith('readiness-')) && committed ? 'repair-commit' : null,
    commitAccepted: async (_root, message) => {
      if (!dirty) return null;
      expect(branch).toMatch(/^ramify-agent-run\//u); expect(message).toContain('Ramify-Gate: readiness-opr-');
      writes += 1; committed = true; dirty = false; head = 'repair-commit';
      if (outcome === 'lost-acknowledgement') throw new Error('Git committed the admitted candidate before its acknowledgement was lost');
      return head;
    }, isAncestor: async (_root, accepted, current) => { expect(accepted).toBe('base'); expect(current).toBe('repair-commit'); return true; },
  }));
  const before = { 'ramify-audit.json': oldConfigText };
  const after = { 'ramify-audit.json': newConfigText, 'src/staged.ts': 'export const staged = true;\n',
    'src/unstaged.ts': 'export const unstaged = true;\n', 'src/new.ts': 'export const added = true;\n' };
  const source = scriptedCandidates(copy.root, { base: { tree: oldTree, base: 'base', files: before, changes: [] },
    [oldTree]: { tree: oldTree, base: 'base', files: before, changes: [] },
    [repairedTree]: { tree: repairedTree, base: 'base', files: after, changes: paths.map(path => ({ status: path === 'ramify-audit.json' ? 'M' : 'A', path })) },
    'repair-commit': { tree: repairedTree, base: 'base', files: after, changes: paths.map(path => ({ status: path === 'ramify-audit.json' ? 'M' : 'A', path })) } });
  const candidates = { ...source, treeEntries: async (root: string, candidate: string) => (await source.treeEntries(root, candidate)).map((entry, position) => ({ ...entry,
    objectId: (candidate === oldTree || candidate === 'base' ? 'c' : String(position + 1)).repeat(40) })) };
  const audit = passingAudit();
  const configuredAudit: ConfiguredAuditPort = { read: async (root, sourceCommit) => { const config = await audit.read(root, sourceCommit);
    return { ...config, blob: repaired ? 'configuration-fixed' : 'configuration-original', checks: config.checks.map(check => ({ ...check as object,
      executor: { kind: 'command', commands: [{ cmd: repaired ? '/installed/bin/npm' : '/missing/bin/npm', args: ['run', 'type-check'] }] } })) }; },
    run: async input => {
      audits += 1;
      if (audits === 1) return { status: 'failed', requestId: `${input.runId}:${input.attemptId}`, mode: input.mode, nested: input.nested ?? false,
        projects: null, discovery: null, requestedSourceCommit: input.sourceCommit, auditedSourceCommit: null, reused: false, reuse: null,
        requestedMode: null, executedMode: null, fallbackReason: null, verdict: null, reportCommit: null, runRef: null, treeRef: null,
        definition: { path: input.configuration.path, blob: input.configuration.blob }, detail: 'Required audit executable unavailable',
        provider: { status: 'failed', error: { code: 'ENOENT', message: 'Required audit executable unavailable', retryable: false } }, checks: {} };
      expect(input.sourceCommit).toBe('repair-commit'); expect(input.configuration.blob).toBe('configuration-fixed');
      const current = await audit.read(input.projectRoot, input.sourceCommit);
      const answer = await audit.run({ ...input, configuration: current });
      return { ...answer, definition: { path: input.configuration.path, blob: input.configuration.blob } };
    } };
  const { service } = await openRuns(copy.root, { git, candidates, configuredAudit, script: [{ kind: 'submit', input: emptyAnalysis() }],
    policy: root => testPolicy(root, { recovery: true }), commandExecution: async request => {
      expect(request.argv).toEqual(['setup-tool', 'prepare']); setup += 1;
      return commandResult(request, { outcome: { kind: 'completed', exitCode: 0 } });
    } });
  cleanup.push(() => service.close());
  const receipt = await service.execute(startRun('review-notes'));
  await until(() => service.events('review-notes', receipt.jobId)!.some(event => event.type === 'operation-recovery-paused'));
  const inspection = (await service.recoveryInspection('review-notes', receipt.jobId))!;
  expect(inspection.boundary.kind).toBe('readiness'); expect(setup).toBe(1);
  for (const [path, content] of Object.entries(after)) await writeFile(join(copy.root, path), content);
  repaired = true; dirty = true;
  await service.execute({ commandId: 'readiness-source-correction', expectedVersion: 0, type: 'resume-recovery', payload: {
    planId: 'review-notes', jobId: receipt.jobId, occurrenceId: inspection.occurrenceId, expectedRevision: inspection.revision,
    repair: { areas: ['target', 'configuration'], explanation: 'Corrected source and required executable lookup, retaining all checks and completed preparation' } } });
  await service.settled('review-notes', receipt.jobId);
  const events = service.events('review-notes', receipt.jobId)!;
  expect(events.at(-1)?.type, JSON.stringify(events.at(-1))).toBe('job-completed'); expect(writes).toBe(1); expect(setup).toBe(1); expect(audits).toBe(3);
  expect(events.filter(event => event.type === 'readiness-repair-committing')).toHaveLength(1);
  expect(events.filter(event => event.type === 'readiness-repair-committed')).toHaveLength(1);
  const committedEvent = events.find(event => event.type === 'readiness-repair-committed')!;
  if (committedEvent.type !== 'readiness-repair-committed') throw new Error('Readiness repair result missing');
  const result = JSON.parse(await readFile(runPath(copy.root, 'review-notes', receipt.jobId, `readiness/repairs/${committedEvent.data.id}/result.json`), 'utf8'));
  expect(result.acknowledgement).toMatchObject({ reconciled: outcome === 'lost-acknowledgement',
    diagnostic: outcome === 'lost-acknowledgement' ? expect.stringContaining('acknowledgement was lost') : null });
  const resumed = events.find(event => event.type === 'operation-recovery-resumed')!;
  if (resumed.type !== 'operation-recovery-resumed') throw new Error('Admission missing');
  const record = JSON.parse(await readFile(runPath(copy.root, 'review-notes', receipt.jobId, runLayout.operationRecovery(inspection.occurrenceId, resumed.data.revision)), 'utf8'));
  expect(record.admission.after.candidate).toMatchObject({ staged: ['src/staged.ts'], unstaged: ['ramify-audit.json', 'src/unstaged.ts'], untracked: ['src/new.ts'] });
  for (const [path, content] of Object.entries(after)) expect(await readFile(join(copy.root, path), 'utf8')).toBe(content);
  expect(git.unexpected).toEqual([]);
});
