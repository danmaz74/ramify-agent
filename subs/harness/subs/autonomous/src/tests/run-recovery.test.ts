import { runEventSchema } from '../run/log.js';
import { readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { copyFixture } from '../../../../src/tests/helpers/fixture.js';
import {
  staleCrashLock, emptyAnalysis, freeze, installTestRunner, onlyRun, openRuns,
  runEventsOnDisk, runPath, startRun, stopRun, until } from '../../../../src/tests/helpers/runs.js';
import { expectNoProcesses, forgetExternalTools } from '../../../../src/tests/helpers/external-tools.js';
import { scenarioGit, untracked, type CommitResponse, type RecoveredCommit, type ScenarioGit } from '../../../../src/tests/helpers/recovery-git.js';
import { type IterationAssignment, iterationLayout } from '../../subs/work-coordination/src/work/iterations.js';
import {
  addModule, assign, byRole, completionProposed, installMiniRunner, outline,
  submit as submitStep, treeInputs, write,
} from '../../../../src/tests/helpers/iterations.js';
import { analysis as baseAnalysis, currentAnalysis, entry, requestCompletion } from '../../../../src/tests/helpers/analysis.js';
import { placementDecisionFixture as decisionBody, forkDecision, requestPlacement } from '../../subs/work-coordination/src/tests/helpers/placement.js';
import { createScriptedAgent, type Script } from '../../../agent/src/scripted.js';
import { declaringScenarios } from '../../../../src/tests/helpers/declarations.js';
import type { OpenRunsOptions } from '../../../../src/tests/helpers/runs.js';
import type { SessionSpec } from '../../../agent/src/interfaces/port.js';
import { FakeRamifyCli } from '../../../../src/tests/helpers/fake-ramify.js';
import { gateAttemptSchema } from '../../subs/acceptance/src/gate-records.js';
import { runLayout } from '../run/records.js';
import { type InvocationOutcome } from '../../../task-execution/src/records.js';
import type { RunWrite } from '../run/log.js';
import type { RunEvent } from '../run/log.js';
import { reduceSessions } from '../run/sessions.js';
import { readTranscript } from '../../../task-execution/src/transcripts/writer.js';
import { intakeToolName } from '../../subs/planning/src/extraction.js';

vi.mock('node:child_process', async original =>
  (await import('../../../../src/tests/helpers/process-guard.js')).guardedChildProcess(await original<typeof import('node:child_process')>()));

/*
 * Durable crash boundaries preserve task records and accepted transitions.
 * Reopening without an agent may reconcile a consequential operation through
 * its owner, while unfinished tasks remain pending for ordinary execution.
 *
 * These fixtures abandon a service at a durable boundary, then replace its
 * project ownership. Source changes and accepted records remain on disk.
 *
 * Git is external, and is answered rather than run: each scenario states
 * what its commits answer, and its answers outlive the crashed service,
 * because the commit an interrupted run made is the one its restart finds
 * again by the attempt's identity trailers. The commands readiness would
 * spawn are answered directly for the same reason.
 */

const cleanups: Array<() => Promise<void>> = [];
const analysis = (...args: Parameters<typeof baseAnalysis>) => currentAnalysis(baseAnalysis(...args), 'document:review-notes-plan');
afterEach(async () => {
  const errors: unknown[] = [];
  try {
    // Settle services before removing the fixtures they are still writing.
    for (const cleanup of cleanups.splice(0).reverse()) try { await cleanup(); } catch (error) { errors.push(error); }
    const unanswered = [...gits.values()].flatMap(git => [...git.unexpected]);
    gits.clear();
    try { expect(unanswered, 'Git operations a scenario states no answer for').toEqual([]); } catch (error) { errors.push(error); }
    try { expectNoProcesses(); } catch (error) { errors.push(error); }
  } finally { forgetExternalTools(); }
  if (errors.length) throw new AggregateError(errors, 'Recovery fixture teardown failed');
});

/** The revision every project of this file is on before its run commits anything. */
const base = 'source-00';
const source = (n: number) => `source-${String(n).padStart(2, '0')}`;
/** A checkpoint over a tree with nothing to commit. */
const unchanged = (against: string): CommitResponse => ({ commit: null, against });
/**
 * The harness's own commit of the feature files, once readiness has passed,
 * in a run whose analysis has scenarios; later boundaries are asked
 * against it.
 */
const materialized = 'scenarios-00';
const materialize: CommitResponse = { commit: materialized, against: base, changes: [] };

/**
 * The Git of each project this file drives, by that project's root: a
 * scenario states its answers when it prepares its target, and the crash and
 * every restart over that project are answered by the same one.
 */
const gits = new Map<string, ScenarioGit>();

/** These recovery cases use explicit empty source selection and the fixture's scenario declarations. */
const recoveryAgent = (script: Script) => createScriptedAgent(declaringScenarios(script));

function gitOf(root: string): ScenarioGit {
  const git = gits.get(root);
  if (git === undefined) throw new Error(`No Git was stated for ${root}`);
  return git;
}

function stateGit(
  root: string,
  commits: readonly CommitResponse[],
  recovered: readonly RecoveredCommit[] = [],
  after = base,
): void {
  gits.set(root, scenarioGit(root, { head: base, after, commits, recovered }));
}

/**
 * The one commit a gate makes over the file `changeTree` leaves in the
 * project after readiness, which is what the pending gate intent below is
 * about.
 */
const lateCommit: readonly CommitResponse[] = [materialize, { commit: source(1), against: materialized, changes: untracked('src/late.ts') }];

async function target(
  commits: readonly CommitResponse[] = [],
  recovered: readonly RecoveredCommit[] = [],
  after = base,
) {
  const fixture = await copyFixture();
  cleanups.push(fixture.remove);
  await installTestRunner(fixture.root);
  stateGit(fixture.root, commits, recovered, after);
  return fixture.root;
}

/**
 * Runs until the given write, then freezes: the driver never returns, so
 * nothing more is written, exactly as a crash leaves it.
 */
async function crashAfter(
  root: string,
  write: RunWrite,
  changeTree = false,
  script?: OpenRunsOptions['script'],
  inputs?: OpenRunsOptions['inputs'],
  agent?: OpenRunsOptions['agent'],
  freezeAt?: (current: RunWrite) => boolean,
  ready?: (types: readonly string[]) => boolean,
  commandExecution?: OpenRunsOptions['commandExecution'],
) {
  let runId = '';
  let frozenAtBoundary = false;
  const { service } = await openRuns(root, {
    git: gitOf(root),

    ...(commandExecution === undefined ? {} : { commandExecution }),
    ...(agent === undefined ? { script: script ?? [{ kind: 'submit', input: emptyAnalysis() }] } : { agent }),
    ...(inputs === undefined ? changeTree ? { inputs: treeInputs() } : {} : { inputs }),
    afterWrite: async (current, runId) => {
      void runId;
      if (changeTree && current === 'iteration-assigned') {
        await writeFile(join(root, 'src', 'late.ts'), 'export const late = true;\n');
      }
      if (freezeAt === undefined ? current === write : freezeAt(current)) {
        // The log line becomes visible before its record files finish
        // materializing. Mark the boundary only from this post-write hook so
        // the crash fixture cannot race ahead of the complete durable write.
        frozenAtBoundary = true;
        await freeze();
      }
    },
  });
  const receipt = await service.execute(startRun('review-notes'));
  runId = receipt.jobId;
  const path = runPath(root, 'review-notes', runId, runLayout.events);
  await until(async () => {
    const types = await eventTypes(path);
    if (types.includes('job-failed')) {
      const failed = (await runEventsOnDisk(root, 'review-notes', runId)).find(event => event.type === 'job-failed');
      throw new Error(`The fixture failed before ${write}: ${JSON.stringify(failed?.data)}`);
    }
    return (ready !== undefined || frozenAtBoundary)
      && (ready === undefined ? reached(root, runId, path, write) : ready(types));
  }, 90_000);
  await staleCrashLock(root);
  return { runId };
}

/** Whether the frozen run has written everything the boundary is named for. */
async function reached(root: string, runId: string, events: string, write: RunWrite): Promise<boolean> {
  const types = await eventTypes(events);
  const gateCommits = gitOf(root).commits().filter(call => call.gate !== 'scenarios' && call.commit !== null).length;
  switch (write) {
    // Linked-successor staging and admission have their own crash witnesses.
    case 'restart-staged': throw new Error('Use restart-service.test.ts for linked restart boundaries');
    // Debug-enabled recovery is interrupted before this ordinary replay table.
    case 'debug-exchange-admitted': return types.includes('debug-exchange-admitted');
    case 'repair-assignment-recorded':
    case 'repair-preparation-recorded':
    case 'repair-preparation-consumed':
    case 'repair-incident-recorded': return types.includes(write);
    case 'job-created': return types.length >= 1;
    case 'session-opened': return types.includes('session-opened');
    case 'invocation-started': return types.includes('invocation-started');
    case 'invocation-ended': return types.includes('invocation-ended');
    case 'session-finished': return types.includes('session-finished');
    case 'analysis-accepted': return types.includes('analysis-accepted');
    case 'work-orientation-recorded': return types.includes('work-orientation-recorded');
    case 'context-selection-recorded': return types.includes('context-selection-recorded');
    case 'context-package-append-requested': return types.includes('context-package-append-requested');
    case 'context-package-appended': return types.includes('context-package-appended');
    case 'analysis-evidence-staged': return types.includes('invocation-ended') && !types.includes('analysis-accepted');
    case 'readiness-attempted': return types.includes('readiness-passed') || types.includes('readiness-failed');
    case 'scratch-setting-up': case 'scratch-rule-appended': case 'scratch-committed': return types.includes('scratch-setting-up');
    case 'scratch-setup-complete': return types.includes('scratch-setup-complete');
    // The materialization's intent is in the log; its commit is made at the second.
    case 'scenarios-materializing': case 'scenarios-committed': return types.includes('scenarios-materializing');
    case 'scenarios-materialized': return types.includes('scenarios-materialized');
    case 'work-item-started': return types.includes('work-item-started');
    case 'hypotheses-delivered': return types.includes('hypotheses-delivered');
    case 'outline-revised': return types.includes('outline-revised');
    case 'obligation-reported': return types.includes('obligation-reported');
    case 'iteration-assigned': return types.includes('iteration-assigned');
    case 'writer-acquired': return types.includes('writer-acquired');
    case 'writer-process-registered': return types.includes('writer-process-registered');
    case 'writer-released': return types.includes('writer-released');
    case 'iteration-closed': return types.includes('iteration-closed');
    case 'work-item-completed': return types.includes('work-item-completed');
    // The operation intent is in the log and the commit is not made yet.
    case 'gate-attempted': return types.includes('gate-committing') && gateCommits === 0;
    // The commit is made and the exact revision has not completed audit yet.
    case 'gate-committing': return types.includes('gate-committing') && !types.includes('gate-attempted') && gateCommits === 1;
    // The complete attempt is the effect's completion line.
    case 'gate-committed': return types.includes('gate-attempted') && gateCommits === 1;
    case 'placement-requested': return types.includes('placement-requested');
    case 'view-refreshed': return types.includes('view-refreshed');
    case 'fork-returned-partial': return types.includes('fork-returned-partial');
    case 'fork-name-rejected': return types.includes('fork-name-rejected');
    // The decision is committed and its brief is not appended yet.
    case 'decision-accepted': return types.includes('decision-accepted');
    // The brief reached the parent and its completion is not in the log yet.
    case 'brief-appending': return types.includes('decision-accepted');
    case 'brief-appended': return types.includes('brief-appended') || types.includes('global-context-rebuilt');
    case 'decision-delivered': return types.includes('decision-delivered');
    case 'contract-requested': return types.includes('contract-requested');
    case 'contract-registered': return types.includes('contract-registered');
    case 'work-item-yielded': return types.includes('work-item-yielded');
    case 'work-item-resumed': return types.includes('work-item-resumed');
    case 'provider-conformed': return types.includes('provider-conformed');
    case 'requirement-verified': return types.includes('requirement-verified');
    case 'evidence-reopened': return types.includes('evidence-reopened');
    case 'revision-needed': return types.includes('revision-needed');
    case 'dependency-cycle-detected': return types.includes('dependency-cycle-detected');
    case 'capability-coordinator-resumed': return types.includes('capability-coordinator-resumed');
    case 'capability-verification-started': return types.includes('capability-verification-started');
    case 'capability-source-captured': return types.includes('invocation-ended');
    case 'capability-exchange-opened': return types.includes('capability-exchange-opened');
    case 'capability-exchange-answered': return types.includes('capability-exchange-answered');
    case 'capability-gate-recorded': return types.includes('gate-attempted');
    case 'capability-handed-back': return types.includes('capability-handed-back');
    case 'capability-assignment-settled': return types.includes('capability-assignment-settled');
    case 'capability-assigned': return types.includes('capability-assigned');
    case 'nonfunctional-phase-started':
    case 'nonfunctional-repair-assigned':
    case 'nonfunctional-repair-committed':
    case 'nonfunctional-assessed':
    case 'candidate-prepared': return types.includes(write);
    case 'job-completed': return types.includes('job-completed');
  }
}

async function eventTypes(path: string): Promise<string[]> {
  let text: string;
  try {
    text = await readFile(path, 'utf8');
  } catch {
    return [];
  }
  // The poller reads a log that is being appended to: a trailing partial
  // line is what a reader sees mid-write, and the ledger discards one too.
  const types: string[] = [];
  for (const line of text.split('\n').filter(Boolean)) {
    try {
      types.push((JSON.parse(line) as { event: RunEvent }).event.type);
    } catch {
      break;
    }
  }
  return types;
}

/** One entry capability, one hypothesis, and a module architect that asks for completion. */
function oneWorkItem(assignRoot = false): OpenRunsOptions['script'] {
  const submitted = analysis(
    [entry('reviewer-note', 'collection-review/workspace/reviews')],
    [{ id: 'note-storage', capability: 'note-storage', change: 'reuse' as const, changesExistingSymbols: false, suggestedOwner: 'collection-review/workspace/reviews',
      anticipatedConsumers: [], involvedModules: [], dependsOn: [], confidence: 'medium' as const,
      rationale: 'A note may already have somewhere to live.', assumptions: [], uncertainties: [], citations: [] }],
  );
  if (assignRoot) return byRole({ 'initial-architect': [submitStep(submitted)],
    'local-architect': [submitStep(assign('collection-review', {}, outline())), submitStep(requestCompletion())],
    engineer: [submitStep(completionProposed('Added the root-owned late source.'), write('late.ts', 'export const late = true;\n'))] });
  // The catalog extractor's turns are the default ones.
  return (spec: SessionSpec) => spec.role === 'catalog-extractor' ? []
    : [{ kind: 'submit' as const, input: spec.role === 'initial-architect' ? submitted : requestCompletion() }];
}

/** Reopens the project after the crash and answers what recovery did. */
async function reopen(root: string, agent?: OpenRunsOptions['agent']) {
  const reopened = await openRuns(root, {
    git: gitOf(root),

    ...(agent === undefined ? {} : { agent }),
  });
  cleanups.push(() => reopened.service.close());
  return reopened;
}

/** The capability of the one entry, and the request the module architect makes for it. */
const placementCapability = 'reviewer-note';

/**
 * A run that makes one placement request: one entry capability, a module
 * architect that asks where it belongs, and a fork that decides.
 */
function placementPlan(brief = 'The capability stays where the registry places it.') {
  return {
    'initial-architect': [submitStep(analysis([entry(placementCapability, 'collection-review/workspace/reviews')]))],
    'local-architect': [submitStep(requestPlacement({ forCapability: `capability:${placementCapability}` })), submitStep(requestCompletion())],
    'global-fork': [submitStep(forkDecision({
      decision: decisionBody({ capability: `capability:${placementCapability}`, owner: 'collection-review/workspace/reviews' }),
      brief,
    }))],
  };
}

describe('the recovery table', () => {
  test('a read-only reopen after session-opened preserves its pending task without dispatch', async () => {
    const root = await target();
    const { runId } = await crashAfter(root, 'session-opened');

    const { recovery, agent } = await reopen(root);
    expect(agent).toBeUndefined();
    expect(recovery.invocations).toEqual([]);
    const events = await runEventsOnDisk(root, 'review-notes', runId);
    expect(events.map(event => event.type)).toEqual(['job-started', 'document-manifest-committed', 'session-opened']);
    expect(reduceSessions(events).get('ses-0001')).toMatchObject({ state: 'live', invocations: [] });
  }, 180_000);

  test('a read-only reopen preserves published inputs and leaves the authorized run pending', async () => {
    const root = await target();
    const { runId } = await crashAfter(root, 'job-created');

    const { service, recovery } = await reopen(root);
    expect(recovery.interrupted).toEqual([]);
    expect(recovery.skipped).toEqual([]);
    const events = await runEventsOnDisk(root, 'review-notes', runId);
    expect(events.map(event => event.type)).toEqual(['job-started', 'document-manifest-committed']);
    expect(onlyRun(service, 'review-notes').state).toBe('running');
  }, 180_000);

  test('a crash after invocation-started closes that invocation without an agent call and without a second one', async () => {
    const root = await target();
    const { runId } = await crashAfter(root, 'invocation-started');

    const { service, recovery, agent } = await reopen(root);
    expect(agent).toBeUndefined();
    expect(recovery.invocations).toEqual([`review-notes/${runId}: inv-0001`]);
    const events = await runEventsOnDisk(root, 'review-notes', runId);
    expect(events.map(event => event.type)).toEqual(['job-started', 'document-manifest-committed', 'session-opened', 'invocation-started', 'invocation-ended']);
    expect(events.filter(event => event.type === 'invocation-started')).toHaveLength(1);
    // The interrupted invocation's session is finished with it.
    expect(events.find(event => event.type === 'invocation-ended')!.data).toMatchObject({ session: 'ses-0001', kept: false, finished: 'interrupted' });
    expect(reduceSessions(events).get('ses-0001')).toMatchObject({ state: 'finished', finished: 'interrupted', invocations: ['inv-0001'] });

    const outcome = JSON.parse(await readFile(runPath(root, 'review-notes', runId, runLayout.outcome('inv-0001')), 'utf8')) as InvocationOutcome;
    expect(outcome).toMatchObject({ ended: 'failed', interruption: 'session-lost', disposition: 'incomplete', submission: null });
    expect(outcome.settled.confirmed).toBe(true);
    expect(onlyRun(service, 'review-notes').counts.invocations).toBe(1);

    // This boundary precedes preparation of the actual packet. No model
    // call or transcript start happened; conservative recovery records its
    // interruption and point without inventing delivered prompt bytes.
    const transcript = await readTranscript(runPath(root, 'review-notes', runId, runLayout.transcript('ses-0001')));
    expect(transcript.entries.map(entry => [entry.n, entry.type])).toEqual([[1, 'ended'], [2, 'point']]);
    expect(transcript.entries[0]).toMatchObject({ invocation: 'inv-0001', ended: 'failed', interruption: 'session-lost', actual: null });
  }, 180_000);

  test('a crash after invocation-ended leaves the outcome as it was and appends no second end', async () => {
    const root = await target();
    const { runId } = await crashAfter(root, 'invocation-ended');

    const { recovery } = await reopen(root);
    expect(recovery.invocations).toEqual([]);
    const events = await runEventsOnDisk(root, 'review-notes', runId);
    expect(events.filter(event => event.type === 'invocation-ended')).toHaveLength(1);
    const outcome = JSON.parse(await readFile(runPath(root, 'review-notes', runId, runLayout.outcome('inv-0001')), 'utf8')) as InvocationOutcome;
    expect(outcome.ended).toBe('submitted');
    // The transcript's end was written with the log's, and not again.
    const transcript = await readTranscript(runPath(root, 'review-notes', runId, runLayout.transcript('ses-0001')));
    expect(transcript.entries.filter(entry => entry.type === 'ended')).toHaveLength(1);
    expect(transcript.entries.at(-1)).toMatchObject({ type: 'point', point: { session: 'ses-0001', invocation: 'inv-0001' } });
  }, 180_000);

  test('a crash after immutable analysis evidence is staged leaves no accepted analysis and a fresh run can use changed evidence', async () => {
    const root = await target();
    const { runId } = await crashAfter(root, 'analysis-evidence-staged');
    const directory = runPath(root, 'review-notes', runId);
    const staged = await readdir(join(directory, 'analysis', 'catalog'));
    expect(staged).toHaveLength(1);
    expect((await runEventsOnDisk(root, 'review-notes', runId)).some(event => event.type === 'analysis-accepted')).toBe(false);
    // The fresh run's intake reads a non-functional requirement the crashed
    // one did not, so its catalog, and the file it is staged in, differ.
    // Interrupt this historical prefix without an execution port before
    // starting the separately requested run with changed evidence.
    const interrupted = await reopen(root);
    expect(interrupted.recovery.interrupted).toEqual([]);
    await interrupted.service.execute(stopRun('review-notes', runId, onlyRun(interrupted.service, 'review-notes').version));
    await interrupted.service.settled('review-notes', runId);
    await interrupted.service.close();
    const resumed = await openRuns(root, { git: gitOf(root),
      script: spec => spec.submission.name === intakeToolName
        ? [{ kind: 'submit', input: { goal: 'Keep reviewer notes on a review run.', elements: [
          { key: 'draft:non-functional-requirement:bounded', kind: 'non-functional', document: 'document:review-notes-plan', text: 'Reviewer notes stay bounded.', conditions: [], uncertainty: '' },
        ], incorporation: { documents: [{ document: 'document:review-notes-plan', scenarios: true, uncertainty: '' }], missing: [] } } }]
        : spec.role === 'catalog-extractor' ? [] : [{ kind: 'submit', input: currentAnalysis(emptyAnalysis(), 'document:review-notes-plan') }] });
    cleanups.push(() => resumed.service.close());
    expect((await runEventsOnDisk(root, 'review-notes', runId)).map(event => event.type)).not.toContain('job-interrupted');
    const next = await resumed.service.execute(startRun('review-notes'));
    await until(async () => (await runEventsOnDisk(root, 'review-notes', next.jobId)).some(event => event.type === 'analysis-accepted'));
    const accepted = (await runEventsOnDisk(root, 'review-notes', next.jobId)).filter(event => event.type === 'analysis-accepted');
    expect(accepted).toHaveLength(1);
    expect(accepted[0]?.type === 'analysis-accepted' && accepted[0].data.evidence?.catalog.path).not.toContain(staged[0]);
    expect(accepted[0]?.type === 'analysis-accepted' && accepted[0].data.catalog).toEqual({ context: 0, functional: 0, nonFunctional: 1, fixed: 0, recommendation: 0 });
  }, 180_000);

  test('a crash after analysis-accepted re-materializes the entries and accepts no second analysis', async () => {
    const root = await target();
    const { runId } = await crashAfter(root, 'analysis-accepted');
    // The record file is removed, as a crash between the line and its file leaves it.
    await rm(runPath(root, 'review-notes', runId, runLayout.entries));

    const { recovery } = await reopen(root);
    expect(recovery.rematerialized.some(entry => entry.startsWith(`review-notes/${runId}`))).toBe(true);
    const entries = JSON.parse(await readFile(runPath(root, 'review-notes', runId, runLayout.entries), 'utf8')) as { schema: string; entries: unknown[] };
    expect(entries.schema).toBe('ramify-agent.entry-assignments/2');
    expect(entries.entries).toEqual([]);
    const events = await runEventsOnDisk(root, 'review-notes', runId);
    expect(events.filter(event => event.type === 'analysis-accepted')).toHaveLength(1);
  }, 180_000);

  test('a crash after readiness re-materializes the attempt and its gate, and runs readiness no second time', async () => {
    const root = await target();
    const { runId } = await crashAfter(root, 'readiness-attempted');
    await rm(runPath(root, 'review-notes', runId, runLayout.readiness(1)));

    const { recovery } = await reopen(root);
    expect(recovery.rematerialized.some(entry => entry.startsWith(`review-notes/${runId}`))).toBe(true);
    const attempt = JSON.parse(await readFile(runPath(root, 'review-notes', runId, runLayout.readiness(1)), 'utf8')) as { verdict: string };
    expect(attempt.verdict).toBe('passed');
    const events = await runEventsOnDisk(root, 'review-notes', runId);
    expect(events.filter(event => event.type === 'readiness-passed')).toHaveLength(1);
  }, 180_000);

  test('a fork interrupted mid-investigation leaves no decision, and its invocation is closed without an agent call', async () => {
    const root = await target([materialize], [], materialized);
    // The fork is still investigating when the harness stops: its session
    // never answers.
    const agent = recoveryAgent(byRole({
      ...placementPlan(),
      'global-fork': [[{ kind: 'hang' }]],
    }));
    const { runId } = await crashAfter(
      root, 'view-refreshed', false, undefined, undefined, agent,
      () => false,
      () => agent.sessions.filter(session => session.spec.role === 'global-fork').length === 1,
    );

    const sessionsBefore = agent.sessions.length;
    const { recovery } = await reopen(root);
    expect(agent.sessions).toHaveLength(sessionsBefore);
    const events = await runEventsOnDisk(root, 'review-notes', runId);
    const types = events.map(event => event.type);
    expect(types.filter(type => type === 'view-refreshed')).toHaveLength(1);
    expect(types).not.toContain('decision-accepted');
    expect(types).not.toContain('brief-appended');
    // The fork's invocation was closed by recovery, with no agent call and
    // no second fork.
    const fork = events.find(event => event.type === 'invocation-started' && event.data.role === 'global-fork');
    if (fork?.type !== 'invocation-started') throw new Error('The fixture started no placement fork');
    expect(recovery.invocations).toEqual([`review-notes/${runId}: ${fork.data.invocation}`]);
    const outcome = JSON.parse(await readFile(runPath(root, 'review-notes', runId, runLayout.outcome(fork.data.invocation)), 'utf8')) as InvocationOutcome;
    expect(outcome).toMatchObject({ ended: 'failed', interruption: 'session-lost' });
    // One fork ran and was interrupted; recovery started no second one.
    expect(agent.sessions.filter(session => session.spec.role === 'global-fork')).toHaveLength(1);
  }, 180_000);

  test.each(['unassigned-dirt', 'new-external-declaration'] as const)('PB3: pending gate intent refuses %s on restart before rendering or making a commit', async variant => {
    const root = await target(lateCommit, [{ gate: 'ga-0002', answers: [null] }], source(1));
    const git = gitOf(root);
    const { runId } = await crashAfter(root, 'gate-attempted', true, oneWorkItem(true));
    const beforeHead = git.head();
    const beforeCommits = [...git.commits()];
    const late = await readFile(join(root, 'src/late.ts'), 'utf8');
    const outside = 'subs/workspace/subs/reviews/src/unassigned.ts';
    const changed = vi.mocked(git.changedPaths).getMockImplementation()!;
    if (variant === 'unassigned-dirt') {
      await writeFile(join(root, outside), 'unassigned source must remain pending\n');
      vi.spyOn(git, 'changedPaths').mockImplementation(async (project, base) => [...await changed(project, base), outside]);
    } else {
      const declaration = join(root, 'module.ramify');
      await writeFile(declaration, `${await readFile(declaration, 'utf8')}\nexternal "src/late.ts"\n`);
    }
    const ramify = new FakeRamifyCli();
    const query = vi.spyOn(ramify, 'queryOwnership');
    const audit = vi.fn(async () => { throw new Error('A refused recovered candidate must not be audited'); });
    const restarted = await openRuns(root, { git, ramify, configuredAudit: { run: audit, read: async () => { throw new Error('A refused recovered candidate has no audit evidence to read'); } } });
    cleanups.push(() => restarted.service.close());
    const attempt = gateAttemptSchema.parse(JSON.parse(await readFile(runPath(root, 'review-notes', runId, runLayout.gate('ga-0002')), 'utf8')));
    expect(attempt).toMatchObject({ verdict: 'failed', cause: 'check-failed', next: 'repair', commit: null, audited: null, evidence: null });
    expect(attempt.rules?.find(rule => rule.rule === 'write-scope')).toMatchObject({ outcome: 'failed', violations: expect.arrayContaining([expect.objectContaining({ path: variant === 'unassigned-dirt' ? outside : 'src/late.ts' })]) });
    expect(audit).not.toHaveBeenCalled();
    expect(query).toHaveBeenCalledTimes(1);
    expect(git.head()).toBe(beforeHead);
    expect(git.commits()).toEqual(beforeCommits);
    expect(await readFile(join(root, 'src/late.ts'), 'utf8')).toBe(late);
    if (variant === 'unassigned-dirt') expect(await readFile(join(root, outside), 'utf8')).toBe('unassigned source must remain pending\n');
    else expect(await readFile(join(root, 'module.ramify'), 'utf8')).toContain('external "src/late.ts"');
    const events = await runEventsOnDisk(root, 'review-notes', runId);
    expect(events.filter(event => event.type === 'gate-attempted')).toHaveLength(1);
    expect(events.filter(event => event.type === 'gate-attempted')[0]!.data).toMatchObject({ gate: 'ga-0002', verdict: 'failed', next: 'repair' });
    expect(events.some(event => event.type === 'job-interrupted')).toBe(false);
  }, 180_000);
});

/*
 * The boundaries an iteration adds. A run is never resumed in place: it is
 * interrupted on load, every record file is re-materialized from the log,
 * and each external effect whose intent has no completion is performed
 * again. What was already closed stays closed.
 */
describe('the boundaries of an iteration', () => {
  const notes = 'collection-review/workspace/reviews/notes';
  const notesDirectory = 'subs/workspace/subs/reviews/subs/notes';

  /** A fixture copy with one module of this test's own and a runner that really runs its test. */
  async function iterationTarget(commits: readonly CommitResponse[] = [], after = materialized) {
    const fixture = await copyFixture();
    cleanups.push(fixture.remove);
    await addModule(fixture.root, notesDirectory, 'notes', {
      'src/notes.ts': 'export const noteLimit = 500;\n',
      'src/tests/notes.test.ts': [
        'import { test, expect } from \'vitest\';',
        'import { noteLimit } from \'../notes.ts\';',
        '',
        'test(\'the limit is the one the plan asks for\', () => { expect(noteLimit).toBe(500); });',
        '',
      ].join('\n'),
    });
    await installMiniRunner(fixture.root);
    stateGit(fixture.root, [materialize, ...commits], [], after);
    return fixture.root;
  }

  test('a crash after a breaking iteration-assigned rewrites its broad scope, guarded hashes and authorization, and assigns nothing twice', async () => {
    const root = await iterationTarget();
    const broken = outline({
      breakingChanges: [{ guarantee: 'The note limit is a plain number.', reason: 'The request asks for a structured limit.', affectedConsumers: [notes], citations: [] }],
      revisionReason: 'The limit changes shape, and the runner has to be told about its new suite.',
    });
    const script = byRole({
      'initial-architect': [submitStep(analysis([entry('review-note', notes)]))],
      'local-architect': [submitStep(assign(notes, {
        kind: 'breaking',
        scope: { base: { modules: [notes], rationale: 'The limit and its reader change together.' }, extra: [], read: [], rationale: 'r' },
        authorizations: [{ path: 'vitest.config.ts', rationale: 'The suite moves.' }],
      }, broken)), submitStep(requestCompletion())],
      engineer: [[{ kind: 'submit', input: completionProposed('Nothing to do.') }]],
    });
    const { runId } = await crashAfter(root, 'iteration-assigned', false, script, treeInputs());
    const path = runPath(root, 'review-notes', runId, iterationLayout.assignment('work-item:review-note', 1));
    const before = await readFile(path, 'utf8');
    await rm(path, { force: true });

    const { service, recovery, agent } = await reopen(root);
    expect(agent).toBeUndefined();
    expect(recovery.interrupted).toEqual([]);
    // The same bytes: the broad base with its rationale, the guarded hashes
    // it was captured with, and the authorization with the outline revision
    // that recorded it. Nothing is captured a second time.
    expect(await readFile(path, 'utf8')).toBe(before);
    const assignment = JSON.parse(before) as IterationAssignment;
    expect(assignment.kind).toBe('breaking');
    expect(assignment.gate.checkpoint).toBe('breaking-iteration');
    expect(assignment.scope.base).toEqual({ modules: [notes], rationale: 'The limit and its reader change together.' });
    expect(assignment.guarded.map(file => file.path)).toContain('vitest.config.ts');
    expect(assignment.authorizations).toEqual([{ path: 'vitest.config.ts', rationale: 'The suite moves.', by: expect.objectContaining({ id: 'work-item:review-note', revision: 1 }) }]);
    const events = await runEventsOnDisk(root, 'review-notes', runId);
    expect(events.filter(event => event.type === 'iteration-assigned')).toHaveLength(1);
    expect(events.some(event => event.type === 'gate-attempted')).toBe(false);
    expect(onlyRun(service, 'review-notes').state).toBe('running');
  }, 180_000);

  test('an interrupted run leaves every completed work item completed, and starts none of them again', async () => {
    // The first work item is completed with nothing written, so its
    // checkpoint has nothing to commit.
    const root = await iterationTarget([unchanged(materialized)]);
    // Two entry capabilities: the first work item is closed before the crash.
    const script = byRole({
      'initial-architect': [submitStep(analysis([entry('review-note', notes), entry('review-note-two', notes)]))],
      'local-architect': [submitStep(requestCompletion()), submitStep(assign(notes, {}, outline())), submitStep(requestCompletion())],
      engineer: [[{ kind: 'submit', input: completionProposed('Nothing needed changing.') }]],
    });
    const { runId } = await crashAfter(root, 'iteration-assigned', false, script, treeInputs());

    const first = await reopen(root);
    const events = await runEventsOnDisk(root, 'review-notes', runId);
    // The first work item stays closed, and the second stays open.
    const completed = events.filter(event => event.type === 'work-item-completed');
    expect(completed.map(event => (event.data as { workItem: string }).workItem)).toEqual(['work-item:review-note']);
    expect(events.filter(event => event.type === 'work-item-started')).toHaveLength(2);
    expect(events.some(event => event.type === 'job-interrupted')).toBe(false);
    expect(onlyRun(first.service, 'review-notes').state).toBe('running');

    // Loading the run again neither repeats the closed item nor resumes the
    // open one: an interrupted run is not driven further.
    await first.service.close();
    const again = await reopen(root);
    expect((await runEventsOnDisk(root, 'review-notes', runId)).length).toBe(events.length);
    expect(again.recovery.interrupted).toEqual([]);
    expect(onlyRun(again.service, 'review-notes').state).toBe('running');
  }, 180_000);
});

test('capability verification events retain their exact accepted task without completion evidence', () => {
  const event = { sequence: 1, jobId: '20261019T000000Z-abcdef', at: '2026-10-19T00:00:00.000Z', type: 'capability-verification-started', data: { task: 'capability-task:review-note', invocation: 'inv-001', gate: 'gate-001' } };
  expect(runEventSchema.parse(event)).toEqual(event);
  expect(runEventSchema.safeParse({ ...event, data: { ...event.data, completion: {} } }).success).toBe(false);
});
