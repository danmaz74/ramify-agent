import { afterEach, expect, test } from 'vitest';
import { createScriptedAgent } from '../../subs/agent/src/scripted.js';
import type { ConfiguredAuditPort } from '../../subs/audit/src/check-execution.js';
import { copyFixture } from './helpers/fixture.js';
import { fixtureScratchGit, mockGit } from './helpers/mock-git.js';
import { scriptedCandidates } from './helpers/candidates.js';
import { declaringScenarios } from './helpers/declarations.js';
import { passingAudit } from './helpers/direct-check-execution.js';
import { emptyAnalysis, openRuns, startRun, testPolicy, until } from './helpers/runs.js';

const cleanup: Array<() => Promise<void>> = [];
afterEach(async () => { for (const close of cleanup.splice(0).reverse()) await close(); });

test('restarting a pending final check uses ordinary qualification without a recovery admission', async () => {
  const copy = await copyFixture(); cleanup.push(copy.remove);
  const tree = 'a'.repeat(40);
  const git = fixtureScratchGit(mockGit({ currentHead: async () => 'base', isCleanRepository: async () => true,
    createRunBranch: async () => ({ branch: 'ramify-agent-run/fixture', created: true }), changedPaths: async () => [], changedEntries: async () => [],
    findCommitByTrailers: async () => null, commitAccepted: async () => null,
    previewCandidateTree: async () => ({ repositoryRoot: copy.root, head: 'base', tree }),
  }));
  const candidates = scriptedCandidates(copy.root, { base: { tree, base: 'base', files: {}, changes: [] }, [tree]: { tree, base: 'base', files: {}, changes: [] } });
  const audit = passingAudit(); let calls = 0;
  const configuredAudit: ConfiguredAuditPort = { read: (...args) => audit.read(...args), run: async input => {
    if (++calls === 2) return { status: 'failed', requestId: `${input.runId}:${input.attemptId}`, mode: input.mode, nested: input.nested ?? false,
      projects: null, discovery: null, requestedSourceCommit: input.sourceCommit, auditedSourceCommit: null, reused: false, reuse: null,
      requestedMode: null, executedMode: null, fallbackReason: null, verdict: null, reportCommit: null, runRef: null, treeRef: null,
      definition: { path: input.configuration.path, blob: input.configuration.blob }, detail: 'Required executable missing',
      provider: { status: 'failed', error: { code: 'ENOENT', message: 'Required executable missing', retryable: false } }, checks: {} };
    return audit.run(input);
  } };
  const options = { git, candidates, configuredAudit, policy: (root: string) => testPolicy(root, { recovery: true }) };
  const first = await openRuns(copy.root, { ...options, agent: createScriptedAgent(declaringScenarios([{ kind: 'submit', input: emptyAnalysis() }])) });
  cleanup.push(() => first.service.close());
  const receipt = await first.service.execute(startRun('review-notes'));
  await until(() => first.service.events('review-notes', receipt.jobId)!.some(event => event.type === 'operation-recovery-paused'));
  expect(calls).toBe(2);
  const assessment = first.service.events('review-notes', receipt.jobId)!.filter(event => event.type === 'nonfunctional-assessed');
  await first.service.close();
  const agent = createScriptedAgent(declaringScenarios([]));
  const second = await openRuns(copy.root, { ...options, agent }); cleanup.push(() => second.service.close());
  await second.service.execute({ type: 'resume-recovery', commandId: 'continue-final-task', expectedVersion: 0,
    payload: { planId: 'review-notes', jobId: receipt.jobId } });
  await second.service.settled('review-notes', receipt.jobId);
  const events = second.service.events('review-notes', receipt.jobId)!;
  expect(events.at(-1)?.type, JSON.stringify(events.at(-1))).toBe('job-completed');
  expect(events.filter(event => event.type === 'nonfunctional-assessed')).toEqual(assessment);
  expect(calls).toBe(3);
  expect(agent.sessions).toHaveLength(0);
  expect(git.unexpected).toEqual([]);
});
