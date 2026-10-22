import { openUnchangedRuns as openRuns, assertUnchangedGit, unchangedGit } from '../../../../src/tests/helpers/unchanged-run.js';
import { expectNoProcesses, forgetExternalTools } from '../../../../src/tests/helpers/external-tools.js';
import { GitError } from '../../../evidence/src/git.js';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { copyFixture } from '../../../../src/tests/helpers/fixture.js';
import { emptyAnalysis, installTestRunner, onlyRun, openRuns as openRunsWithGit, runEventsOnDisk, runPath, startRun, stopRun, until } from '../../../../src/tests/helpers/runs.js';
import { runLayout } from '../run/records.js';
import { assign, byRole, outline, partialReport, submit, treeInputs } from '../../../../src/tests/helpers/iterations.js';
import { requestCompletion } from '../../../../src/tests/helpers/analysis.js';
import { RunQueries } from '../../../projections/src/queries.js';
import { createQuerySource } from '../../../../src/http/query-source.js';

/*
 * The smallest coherent run: one with no entry capabilities. It starts,
 * extracts its catalog beside the plan architect (the intake, the
 * architect, and the one plan document's checker), passes readiness, passes its final gate and
 * completes, with no client connected: the file system alone is watched.
 */

vi.mock('node:child_process', async original =>
  (await import('../../../../src/tests/helpers/process-guard.js')).guardedChildProcess(await original<typeof import('node:child_process')>()));

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) await cleanup();
  try { assertUnchangedGit(); expectNoProcesses(); } finally { forgetExternalTools(); }
});

/** A directory outside the project, where a counting command keeps its count. */
async function counterDirectory(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), 'ramify-agent-counter-'));
  cleanups.push(() => rm(path, { recursive: true, force: true }));
  return path;
}

/** A fixture copy that a run can work in: a git repository, with the runner readiness requires. */
async function target() {
  const fixture = await copyFixture();
  cleanups.push(fixture.remove);
  await installTestRunner(fixture.root);
  const head = 'unchanged-fixture-revision';
  return { root: fixture.root, head };
}

describe('an implementation run with no entry capabilities', () => {
  test('starts, passes readiness, passes its final gate and completes, with no client connected', async () => {
    const { root } = await target();
    const { service, agent } = await openRuns(root, {
      script: [{ kind: 'submit', input: emptyAnalysis() }],
      unchangedCheckpoints: ['final verification of plan "review-notes"'],
    });
    cleanups.push(() => service.close());

    const receipt = await service.execute(startRun('review-notes'));
    await service.settled('review-notes', receipt.jobId);

    const events = await runEventsOnDisk(root, 'review-notes', receipt.jobId);
    expect(events.map(event => event.type)).toEqual([
      'job-started',
      'document-manifest-committed',
      'session-opened',
      'invocation-started',
      'invocation-prepared', // The actual delivered packet is committed before model events.
      'invocation-prepared', // The original generic operation/source point is then committed.
      'invocation-ended',
      'session-opened',
      'invocation-started',
      'invocation-prepared', // The actual delivered packet is committed before model events.
      'invocation-prepared', // The original generic operation/source point is then committed.
      'invocation-ended',
      'session-opened',
      'invocation-started',
      'invocation-prepared', // The actual delivered packet is committed before model events.
      'invocation-prepared', // The original generic operation/source point is then committed.
      'invocation-ended',
      'analysis-accepted',
      'gate-started',
      'readiness-passed',
      'scratch-setting-up',
      'scratch-setup-complete',
      'nonfunctional-phase-started',
      'candidate-prepared',
      'nonfunctional-assessed',
      'nonfunctional-round-closed',
      'gate-committing',
      'gate-attempted',
      'candidate-bound-to-gate',
      'session-finished',
      'job-completed',
    ]);

    const snapshot = onlyRun(service, 'review-notes');
    expect(snapshot.state).toBe('completed');
    expect(snapshot.phase).toBe('ended');
    expect(snapshot.failure).toBeNull();
    expect(snapshot.counts.invocations).toBe(3);
    expect(snapshot.counts.readinessAttempts).toBe(1);

    // The intake, the plan architect and the plan document's checker,
    // each a fresh session, and each submitted.
    expect(agent!.sessions.map(session => [session.spec.role, session.spec.submission.name])).toEqual([
      ['catalog-extractor', 'submit_intake'], ['initial-architect', 'submit_initial_analysis'], ['catalog-extractor', 'submit_catalog_check'],
    ]);
    expect(agent!.sessions.every(session => session.verdicts.some(verdict => (verdict as { accepted?: unknown }).accepted === true))).toBe(true);
    expect(agent!.sessions[1]!.spec.context.compaction).toBe('allowed');
    expect(agent!.sessions[1]!.spec.context.budgetFraction).toBe(0.75);

    // Every record of the run is a file beneath it.
    const record = JSON.parse(await readFile(runPath(root, 'review-notes', receipt.jobId, runLayout.record), 'utf8')) as Record<string, unknown>;
    expect(record['schema']).toBe('ramify-agent.job/4');
    expect(record['kind']).toBe('implementation');
    const entries = JSON.parse(await readFile(runPath(root, 'review-notes', receipt.jobId, runLayout.entries), 'utf8')) as { entries: unknown[] };
    expect(entries.entries).toEqual([]);
    const attempt = JSON.parse(await readFile(runPath(root, 'review-notes', receipt.jobId, runLayout.readiness(1)), 'utf8')) as { verdict: string; steps: Array<{ step: string; outcome: string }> };
    expect(attempt.verdict).toBe('passed');
    expect(attempt.steps.every(step => step.outcome === 'passed')).toBe(true);
    expect(attempt.steps.map(step => step.step)).toEqual([
      'project-root', 'scratch-cleanup', 'git-clean', 'compiler-config', 'project-config',
      'ramify-daemon', 'audit-config', 'declared-packages', 'declared-preparation', 'configured-full-audit', 'run-branch',
    ]);
  }, 120_000);

  test('works on its own branch, and its own records are never committed', async () => {
    const { root } = await target();
    const { service, git } = await openRuns(root, {
      script: [{ kind: 'submit', input: emptyAnalysis() }],
      unchangedCheckpoints: ['final verification of plan "review-notes"'],
    });
    cleanups.push(() => service.close());

    const receipt = await service.execute(startRun('review-notes'));
    await service.settled('review-notes', receipt.jobId);

    expect(git.operations()['createRunBranch']).toBe(1);
    expect(git.branch()).toBe(`ramify-agent-run/${receipt.jobId}`);
    // Nothing changed, so the passing gate made no commit, and the tree is
    // clean although the run wrote its whole log into it.
    expect(git.operations()['commitAccepted']).toBe(1);
    expect(git.commits()).toEqual([]);
    const ignore = await readFile(runPath(root, 'review-notes', receipt.jobId, '..', '..', '.gitignore'), 'utf8');
    expect(ignore.trim().endsWith('*')).toBe(true);
  }, 120_000);

  test('a project without a valid committed audit configuration is refused before the run exists or any agent starts', async () => {
    const { root } = await target();
    const missing = 'ramify-audit.json is missing from audited commit unchanged-fixture-revision';
    const asked: string[] = [];
    const { service, agent } = await openRuns(root, {
      script: [{ kind: 'submit', input: emptyAnalysis() }],
      configuredAudit: {
        async read(_root, head) { asked.push(head); throw new Error(missing); },
        async run(): Promise<never> { throw new Error('no audit runs for a refused start'); },
      },
    });
    cleanups.push(() => service.close());

    const refused = await service.execute(startRun('review-notes')).then(() => null, (error: unknown) => error);
    expect(refused).toMatchObject({ code: 'unreadable' });
    expect((refused as Error).message).toContain('cannot be read, so no run can start');
    expect((refused as Error).message).toContain(missing);
    expect(asked).toEqual(['unchanged-fixture-revision']);
    expect(agent!.sessions).toEqual([]);
    expect(service.listRuns('review-notes')).toEqual([]);
    expect(existsSync(join(root, 'plans', 'review-notes', '.harness', 'jobs'))).toBe(false);
  }, 120_000);

  test('a run branch git refuses fails readiness at run-branch, with git\'s own message, before any work', async () => {
    const { root } = await target();
    const scripted = unchangedGit(root);
    const refusal = 'fatal: cannot lock ref \'refs/heads/ramify-agent-run/x\': \'refs/heads/ramify-agent-run\' exists';
    const git = {
      ...scripted,
      async createRunBranch(): Promise<never> {
        throw new GitError('`git switch --create ramify-agent-run/x` exited with 128', {
          argv: ['git', 'switch', '--create', 'ramify-agent-run/x'], outcome: { kind: 'completed', exitCode: 128 }, output: refusal,
        });
      },
    };
    const { service } = await openRunsWithGit(root, { git,  script: [{ kind: 'submit', input: emptyAnalysis() }] });
    cleanups.push(() => service.close());

    const receipt = await service.execute(startRun('review-notes'));
    await service.settled('review-notes', receipt.jobId);

    const snapshot = onlyRun(service, 'review-notes');
    expect(snapshot.state).toBe('failed');
    expect(snapshot.failure?.reason).toBe('readiness-failed');
    expect(snapshot.failure?.message).toContain('Readiness failed at run-branch');
    expect(snapshot.failure?.message).toContain(refusal);
    const events = await runEventsOnDisk(root, 'review-notes', receipt.jobId);
    expect(events.map(event => event.type)).toEqual([
      'job-started', 'document-manifest-committed', 'session-opened', 'invocation-started', 'invocation-prepared', 'invocation-prepared', 'invocation-ended',
      'session-opened', 'invocation-started', 'invocation-prepared', 'invocation-prepared', 'invocation-ended', 'session-opened', 'invocation-started', 'invocation-prepared', 'invocation-prepared', 'invocation-ended', 'analysis-accepted',
      'gate-started', 'readiness-failed', 'session-finished', 'job-failed',
    ]);
    expect(events.find(event => event.type === 'readiness-failed')?.data).toMatchObject({ step: 'run-branch', recovery: null, final: true });
    expect(scripted.operations()['commitAccepted']).toBeUndefined();
  }, 120_000);

  test('failed final verification returns to an architect, preserves correction work and verifies again in the same run', async () => {
    const { root } = await target();
    const module = 'collection-review/workspace/reviews';
    let finalChecks = 0;
    const { service, agent } = await openRuns(root, {
      inputs: treeInputs(),
      script: byRole({
        'initial-architect': [submit(emptyAnalysis())],
        'global-fork': [submit({ workItemKey: 'draft:work-item:correct-final-verification', module, goal: 'Correct the failing final verification.', rationale: 'Investigate its diagnostic and retain the existing implementation.' })],
        'local-architect': [submit(assign(module, {}, outline())), submit(requestCompletion())],
        engineer: [submit(partialReport(['Corrected the verification problem.'], ['Obtain final verification.']))],
      }),
      checkScript: ({ check, context }) => context.checkpoint === 'final' && check.kind === 'tests' && finalChecks++ === 0
        ? { outcome: { kind: 'completed', exitCode: 1 } } : {},
      unchangedCheckpoints: ['final verification of plan "review-notes"', 'work-item:correct-final-verification', 'final verification of plan "review-notes"'],
      previewCount: 7,
    });
    cleanups.push(() => service.close());
    const receipt = await service.execute(startRun('review-notes'));
    await service.settled('review-notes', receipt.jobId);
    const snapshot = onlyRun(service, 'review-notes');
    expect(snapshot.failure).toBeNull();
    expect(snapshot.state).toBe('completed');
    const events = await runEventsOnDisk(root, 'review-notes', receipt.jobId);
    expect(events.filter(event => event.type === 'analysis-accepted')).toHaveLength(1);
    expect(events.filter(event => event.type === 'final-correction-planned')).toHaveLength(1);
    expect(events.find(event => event.type === 'work-item-started')).toMatchObject({ data: { origin: 'final-verification' } });
    const workItems = await new RunQueries(createQuerySource(service)).workItems('review-notes', receipt.jobId);
    expect(workItems.workItems).toEqual([expect.objectContaining({ origin: 'final-verification' })]);
    expect(events.filter(event => event.type === 'nonfunctional-assessed')).toHaveLength(2);
    expect(events.filter(event => event.type === 'gate-attempted' && event.data.checkpoint === 'final')).toHaveLength(2);
    expect(events.some(event => event.type === 'job-failed')).toBe(false);
    expect(agent!.sessions.find(session => session.spec.role === 'global-fork')!.spec.prompt).toContain('ga-0002');
    const attempt = JSON.parse(await readFile(runPath(root, 'review-notes', receipt.jobId, runLayout.gate('ga-0002')), 'utf8'));
    expect(attempt).toMatchObject({ verdict: 'failed', cause: 'check-failed', audited: expect.any(String), evidence: expect.any(Object) });
  }, 120_000);

  test('a run stopped mid-invocation ends stopped, and the late submission is rejected', async () => {
    const { root } = await target();
    const { service, agent } = await openRuns(root, {
      script: [{ kind: 'stall', ms: 250, thenIgnoreStop: true }, { kind: 'submit', input: emptyAnalysis() }],
      stopGraceMs: 2000,
    });
    cleanups.push(() => service.close());

    const receipt = await service.execute(startRun('review-notes'));
    // The intake is the default turn; the plan architect's is the one that stalls.
    const architect = () => agent!.sessions.find(session => session.spec.role === 'initial-architect');
    await until(() => architect() !== undefined);
    await service.execute(stopRun('review-notes', receipt.jobId, service.getRun('review-notes', receipt.jobId)!.version));
    await service.settled('review-notes', receipt.jobId);

    const snapshot = onlyRun(service, 'review-notes');
    expect(snapshot.state).toBe('stopped');
    const events = await runEventsOnDisk(root, 'review-notes', receipt.jobId);
    expect(events.map(event => event.type)).toContain('stop-requested');
    expect(events.at(-1)!.type).toBe('job-stopped');

    // The submission the session made afterwards was refused, and nothing
    // of it was written.
    // Stop fences runtime admission before the submission callback, so no verdict is produced.
    expect(architect()!.verdicts).toEqual([]);
    const fencedOutcome = architect()!.outcome;
    expect(fencedOutcome?.kind).toBe('failed');
    if (fencedOutcome?.kind !== 'failed') throw new Error('Expected the late provider call to fail admission');
    expect(fencedOutcome.error).toBeOneOf([
      'Operation stopped', 'Operation runtime is closed', 'Current authority denied operation',
    ]);
    expect(architect()!.results).toEqual([]);
    expect(agent!.sessions.map(session => session.spec.role)).toEqual(['catalog-extractor', 'initial-architect']);
    await expect(readFile(runPath(root, 'review-notes', receipt.jobId, runLayout.entries), 'utf8')).rejects.toThrow();
  }, 120_000);
});
