import { afterEach, expect, test } from 'vitest';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createScriptedAgent } from '../../subs/agent/src/scripted.js';
import type { ConfiguredAuditPort } from '../../subs/audit/src/check-execution.js';
import { copyFixture } from './helpers/fixture.js';
import { fixtureScratchGit, mockGit } from './helpers/mock-git.js';
import { scriptedCandidates } from '../../subs/autonomous/subs/acceptance/src/tests/helpers/candidates.js';
import { declaringScenarios } from './helpers/declarations.js';
import { passingAudit } from './helpers/direct-check-execution.js';
import { emptyAnalysis, openRuns, runPath, startRun, testPolicy, until } from './helpers/runs.js';
import { commandResult } from './helpers/command-result.js';
import { gateAttemptSchema } from '../../subs/autonomous/subs/acceptance/src/gate-records.js';
import { runLayout } from '../../subs/autonomous/src/run/records.js';

const cleanup: Array<() => Promise<void>> = [];
afterEach(async () => { for (const close of cleanup.splice(0).reverse()) await close(); });

test.each(['environment', 'target'] as const)('a final check %s repair resumes qualification at the applicable assessment boundary', async area => {
  const copy = await copyFixture(); cleanup.push(copy.remove);
  const tree = 'a'.repeat(40);
  const repairedTree = 'b'.repeat(40); let changed = false, head = 'base';
  const path = 'src/operator-repair.ts';
  const git = fixtureScratchGit(mockGit({ currentHead: async () => head, isCleanRepository: async () => true,
    createRunBranch: async () => ({ branch: 'ramify-agent-run/fixture', created: true }), changedPaths: async () => changed ? [path] : [], changedEntries: async () => [],
    findCommitByTrailers: async () => null, commitAccepted: async () => { if (!changed) return null; head = 'corrected-head'; return head; },
    previewCandidateTree: async () => ({ repositoryRoot: copy.root, head, tree: changed ? repairedTree : tree }),
    recoveryStatus: async () => ({ index: 'index', staged: [], unstaged: [], untracked: changed && head === 'base' ? [path] : [] }),
  }));
  const sourceCandidates = scriptedCandidates(copy.root, { base: { tree, base: 'base', files: {}, changes: [] }, [tree]: { tree, base: 'base', files: {}, changes: [] },
    [repairedTree]: { tree: repairedTree, base: 'base', files: { [path]: 'export const corrected = true;\n' }, changes: [{ status: 'A', path }] },
    'corrected-head': { tree: repairedTree, base: 'base', files: { [path]: 'export const corrected = true;\n' }, changes: [{ status: 'A', path }] } });
  const candidates = { ...sourceCandidates, treeEntries: async (root: string, commit: string) => (await sourceCandidates.treeEntries(root, commit)).map(entry => ({ ...entry, objectId: 'c'.repeat(40) })) };
  const agent = createScriptedAgent(declaringScenarios([{ kind: 'submit', input: emptyAnalysis() }]));
  const audit = passingAudit(); let calls = 0;
  const configuredAudit: ConfiguredAuditPort = { read: (...args) => audit.read(...args), run: async input => {
    calls += 1;
    if (calls === 2) return { status: 'failed', requestId: `${input.runId}:${input.attemptId}`, mode: input.mode, nested: input.nested ?? false,
      projects: null, discovery: null, requestedSourceCommit: input.sourceCommit, auditedSourceCommit: null, reused: false, reuse: null,
      requestedMode: null, executedMode: null, fallbackReason: null, verdict: null, reportCommit: null, runRef: null, treeRef: null,
      definition: { path: input.configuration.path, blob: input.configuration.blob }, detail: 'Required executable missing',
      provider: { status: 'failed', error: { code: 'ENOENT', message: 'Required executable missing', retryable: false } }, checks: {} };
    return audit.run(input);
  } };
  const { service } = await openRuns(copy.root, { git, candidates, agent, configuredAudit, policy: root => testPolicy(root, { recovery: true }) });
  cleanup.push(() => service.close());
  const receipt = await service.execute(startRun('review-notes'));
  await until(() => service.events('review-notes', receipt.jobId)!.some(event => event.type === 'operation-recovery-paused'));
  const inspection = (await service.recoveryInspection('review-notes', receipt.jobId))!;
  expect(inspection).toMatchObject({ state: 'paused', canResume: true, boundary: { kind: 'gate' }, evidence: { classification: 'check-execution' } });
  const before = service.events('review-notes', receipt.jobId)!.filter(event => event.type === 'nonfunctional-assessed');
  expect(before).toHaveLength(1); expect(calls).toBe(2);
  if (area === 'target') { await writeFile(join(copy.root, path), 'export const corrected = true;\n'); changed = true; }
  await service.execute({ commandId: 'environment-correction', expectedVersion: 0, type: 'resume-recovery', payload: {
    planId: 'review-notes', jobId: receipt.jobId } });
  await service.settled('review-notes', receipt.jobId);
  const events = service.events('review-notes', receipt.jobId)!;
  expect(events.at(-1)?.type).toBe('job-completed'); expect(calls).toBe(3);
  if (area === 'environment') {
    expect(events.filter(event => event.type === 'nonfunctional-assessed')).toEqual(before);
    expect(events.filter(event => event.type === 'gate-attempted' && event.data.checkpoint === 'final')).toHaveLength(2);
  } else {
    expect(events.filter(event => event.type === 'nonfunctional-assessed')).toHaveLength(2);
    expect(events.filter(event => event.type === 'nonfunctional-final-invalidated')).toHaveLength(1);
    const finals = events.filter((event): event is Extract<(typeof events)[number], { type: 'gate-attempted' }> =>
      event.type === 'gate-attempted').filter(event => event.data.checkpoint === 'final');
    expect(finals).toHaveLength(2);
    expect(finals.map(event => event.data.verdict)).toEqual(['not-verified', 'passed']);
    const record = gateAttemptSchema.parse(JSON.parse(await readFile(runPath(copy.root, 'review-notes', receipt.jobId, runLayout.gate(finals[1]!.data.gate)), 'utf8')));
    expect(record.audited).toBe('corrected-head');
    expect(events.filter(event => event.type === 'candidate-bound-to-gate')).toMatchObject([
      { data: { gate: finals[1]!.data.gate, commit: 'corrected-head', tree: repairedTree } },
    ]);
    expect(events.filter(event => event.type === 'external-candidate-observed')).toHaveLength(1);
  }
  const attempted = events.filter(event => event.type === 'gate-attempted').map(event => event.data.gate);
  expect(new Set(attempted).size).toBe(attempted.length);
  expect(git.unexpected).toEqual([]);
});

test('a settled readiness audit pause reruns ordinary setup and its prerequisite', async () => {
  const copy = await copyFixture(); cleanup.push(copy.remove);
  await writeFile(join(copy.root, 'ramify-agent.json'), JSON.stringify({ schema: 'ramify-agent.project/1',
    setup: [{ name: 'setup-effect', command: ['setup-tool', 'prepare'], cwd: '.', timeoutMs: 30000 }] }));
  const tree = 'a'.repeat(40);
  const git = fixtureScratchGit(mockGit({ currentHead: async () => 'base', isCleanRepository: async () => true,
    createRunBranch: async () => ({ branch: 'ramify-agent-run/fixture', created: true }), changedPaths: async () => [], changedEntries: async () => [],
    findCommitByTrailers: async () => null, commitAccepted: async () => null,
    previewCandidateTree: async () => ({ repositoryRoot: copy.root, head: 'base', tree }), recoveryStatus: async () => ({ index: 'index', staged: [], unstaged: [], untracked: [] }) }));
  const candidates = scriptedCandidates(copy.root, { base: { tree, base: 'base', files: {}, changes: [] }, [tree]: { tree, base: 'base', files: {}, changes: [] } });
  const audit = passingAudit(); let calls = 0, setup = 0;
  const configuredAudit: ConfiguredAuditPort = { read: (...args) => audit.read(...args),
    run: async input => {
      calls += 1;
      if (calls === 1) return { status: 'failed', requestId: `${input.runId}:${input.attemptId}`, mode: input.mode, nested: input.nested ?? false,
        projects: null, discovery: null, requestedSourceCommit: input.sourceCommit, auditedSourceCommit: null, reused: false, reuse: null,
        requestedMode: null, executedMode: null, fallbackReason: null, verdict: null, reportCommit: null, runRef: null, treeRef: null,
        definition: { path: input.configuration.path, blob: input.configuration.blob }, detail: 'Service cannot execute the check',
        provider: { status: 'failed', error: { code: 'ENOENT', message: 'Service cannot execute the check', retryable: false } }, checks: {} };
      return audit.run(input);
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
  expect(inspection.boundary.kind).toBe('readiness'); expect(setup).toBe(1); expect(calls).toBe(1);
  await service.execute({ commandId: 'restore-readiness-service', expectedVersion: 0, type: 'resume-recovery', payload: {
    planId: 'review-notes', jobId: receipt.jobId } });
  await service.settled('review-notes', receipt.jobId);
  const events = service.events('review-notes', receipt.jobId)!;
  expect(events.at(-1)?.type, JSON.stringify(events.at(-1))).toBe('job-completed'); expect(setup).toBe(2); expect(calls).toBe(3);
  expect(events.filter(event => event.type === 'readiness-preparation-started')).toHaveLength(0);
  expect(events.filter(event => event.type === 'readiness-preparation-completed')).toHaveLength(0);
  expect(git.unexpected).toEqual([]);
});
