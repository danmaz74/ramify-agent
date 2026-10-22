import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createScriptedAgent, type Script } from '../../subs/agent/src/scripted.js';
import type { AgentPort, SessionSpec } from '../../subs/agent/src/interfaces/port.js';
import { SessionDriverUnavailableError } from '../../subs/agent/src/interfaces/session-operations.js';
import { contextSelectorToolName, workOrientationToolName } from '../../subs/autonomous/subs/work-coordination/src/context-selection/submissions.js';
import { localArchitectToolName } from '../../subs/autonomous/subs/work-coordination/src/work/submission.js';
import { runLayout } from '../../subs/autonomous/src/run/records.js';
import { type InvocationOutcome } from '../../subs/task-execution/src/records.js';
import { announcingAudit } from './helpers/direct-check-execution.js';
import { declaringScenarios, withDefaultTurns } from './helpers/declarations.js';
import {
  committedGates, compositionCandidates, identityOf, logEvents, plan, scenarios,
  statedCommands, type Scenario,
} from './helpers/composition.js';
import { expectNoProcesses, forgetExternalTools } from './helpers/external-tools.js';
import { installTestRunner, openRuns, runPath, startRun, staleCrashLock, freeze, stopRun, testPolicy, until } from './helpers/runs.js';
import { copyFixture } from './helpers/fixture.js';
import { analysis, currentAnalysis, entry, requestCompletion } from './helpers/analysis.js';
import { assign, byRole, completionProposed, edit, outline, submit, treeInputs, write } from './helpers/iterations.js';
import { assertUnchangedGit, openUnchangedRuns } from './helpers/unchanged-run.js';
import { scenariosCommit } from './helpers/scripted-git.js';
import { nfrBoundaries } from '../../subs/autonomous/subs/acceptance/src/tests/helpers/nonfunctional-boundaries.js';
import { intakeToolName } from '../../subs/autonomous/subs/planning/src/extraction.js';
import { coordinatorAssessmentToolName, coordinatorActionToolName, nonfunctionalRepairToolName } from '../../subs/autonomous/subs/acceptance/src/nonfunctional/submissions.js';
import { reviewScript, reviewTarget, candidates as reviewCandidates, revisionGates, base as reviewBase, materialized as reviewMaterialized, store, notes, attemptRecord } from '../../subs/autonomous/subs/acceptance/src/tests/helpers/reviews.js';
import { gateGit, gateScenariosCommitFixture as gateScenariosCommit } from '../../subs/autonomous/subs/acceptance/src/tests/helpers/gate-git.js';
import { scriptedCandidates, testReviewPolicy } from '../../subs/autonomous/subs/acceptance/src/tests/helpers/candidates.js';
import { snapshotToolNames } from '../../subs/reviews/src/snapshot.js';
import { copyCapabilityFixture, openCapabilityRuns } from '../../subs/autonomous/subs/work-coordination/src/tests/helpers/capability.js';
import { capabilityFlowBoundaries } from '../../subs/autonomous/subs/work-coordination/src/tests/helpers/capability-flow-boundaries.js';
import { RunQueries } from '../../subs/projections/src/queries.js';
import { createQuerySource } from '../http/query-source.js';
import { scenarioGit } from './helpers/recovery-git.js';

vi.mock('node:child_process', async original =>
  (await import('./helpers/process-guard.js')).guardedChildProcess(await original<typeof import('node:child_process')>()));

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  try { for (const cleanup of cleanups.splice(0).reverse()) await cleanup(); expectNoProcesses(); }
  finally { forgetExternalTools(); }
});

function recoveryPolicy(root: string) {
  const policy = testPolicy(root, { recovery: true });
  return { ...policy, recovery: { ...policy.recovery!, baseDelayMs: 0, maxDelayMs: 1 } };
}

/**
 * Payloads stored before `lose()` read back as the disk store reads a deleted
 * file (null) or a damaged one (`Corrupt transcript payload`); storing the
 * same bytes again restores them. The disk store's own distinction is
 * verified in session-store's "isolates optional committed payload" cases.
 */
function losingPayloads(agent: AgentPort, loss: 'missing' | 'corrupt') {
  let lost = false;
  let unavailable = 0;
  const restored = new Set<string>();
  const port: AgentPort = { ...agent, bindSessionStore(store) {
    return agent.bindSessionStore!({ ...store,
      async putPayload(bytes) { const id = await store.putPayload(bytes); restored.add(id); return id; },
      async getPayload(id) {
        if (!lost || restored.has(id)) return store.getPayload(id);
        unavailable += 1;
        if (loss === 'missing') return null;
        throw new SessionDriverUnavailableError(`Corrupt transcript payload ${id}`);
      } });
  } };
  return { port, lose() { lost = true; restored.clear(); }, unavailable: () => unavailable };
}

/** The interruption precedes the fixture turn, so retry does not consume a semantic answer. */
function interruptOnce(script: Script, matches: (spec: SessionSpec) => boolean): Script {
  let interrupted = false;
  return spec => {
    if (!interrupted && matches(spec)) {
      interrupted = true;
      return [{ kind: 'fail', error: 'Scripted stream lost before submission', evidence: {
        classification: 'transport', diagnostic: 'Scripted stream lost before submission', code: 'ECONNRESET',
      } }];
    }
    return typeof script === 'function' ? script(spec) : script;
  };
}

async function composedCaller(scenario: Scenario, matches?: (spec: SessionSpec) => boolean, contextLoss?: 'missing' | 'corrupt') {
  const target = await scenario.target();
  cleanups.push(target.remove);
  const declared = declaringScenarios(scenario.script(target.root));
  // The outer wrapper includes extraction, orientation and selection callers that
  // the composition's declaration helper answers through its default turns.
  const agent = createScriptedAgent(matches ? interruptOnce(declared, matches) : declared);
  const losing = losingPayloads(agent, contextLoss ?? 'missing');
  const final = scenario.finalCandidate!;
  // New-policy pure preparation captures the retained partial candidate before
  // the next architect turn. The delegation has reached its first provider
  // commit at that boundary; final qualification later observes source-03.
  const preparationPreviews = scenario.name === 'iteration'
    ? [{ repositoryRoot: target.root, head: final.head, tree: final.tree }]
    : scenario.name === 'delegation' ? [{ repositoryRoot: target.root, head: 'source-01', tree: 'b'.repeat(40) }] : [];
  const git = scenarioGit(target.root, { ...scenario.git,
    ...(final === undefined ? {} : { previews: [...preparationPreviews,
      ...Array.from({ length: 4 }, () => ({ repositoryRoot: target.root, head: final.head, tree: final.tree }))] }),
  });
  const commands = statedCommands(target.root, scenario.commands ?? []);
  let contextLost = false;
  const opened = await openRuns(target.root, {
    agent: contextLoss === undefined ? agent : losing.port, git, candidates: compositionCandidates(target.root, scenario), inputs: scenario.inputs(),
    configuredAudit: announcingAudit(), commandExecution: commands, policy: recoveryPolicy,
    afterWrite: async (write, runId) => {
      if (!contextLoss || contextLost || write !== 'invocation-ended') return;
      const events = await logEvents(target.root, runId);
      if (!events.some(event => event.type === 'invocation-ended' && event.data.ended === 'failed')) return;
      contextLost = true;
      losing.lose();
    },
  });
  cleanups.push(() => opened.service.close());
  const receipt = await opened.service.execute(startRun(plan));
  await opened.service.settled(plan, receipt.jobId);
  expect(opened.service.getRun(plan, receipt.jobId)?.state, JSON.stringify(opened.service.getRun(plan, receipt.jobId)?.failure)).toBe(scenario.ends);
  commands.assertComplete(); git.assertComplete();
  return { ...opened, agent, unavailable: losing.unavailable(), git, root: target.root, runId: receipt.jobId, events: await logEvents(target.root, receipt.jobId) };
}

describe('ordinary recovery through actual workflow callers', () => {
  // Every caller reaches the same operation runtime; only the session it
  // starts from differs. Fresh starts and the continuation's fresh retry read
  // no stored context, so only a fork's retry observes the loss.
  const cases = [
    { caller: 'context selector fork', contextLoss: 'missing', scenario: scenarios.iteration,
      matches: (spec: SessionSpec) => spec.submission.name === contextSelectorToolName },
    { caller: 'global placement fork', contextLoss: 'corrupt', scenario: scenarios.placement,
      matches: (spec: SessionSpec) => spec.role === 'global-fork' },
  ] as const;
  for (const { caller, contextLoss, scenario, matches } of cases) {
    test(`${caller} restarts fresh with ${contextLoss} context without repeating accepted transitions`, async () => {
      const run = await composedCaller(scenario, matches, contextLoss);
      expect(run.service.getRun(plan, run.runId)?.state).toBe(scenario.ends);
      const failed = run.agent.sessions.filter(session => session.outcome?.kind === 'failed');
      expect(failed).toHaveLength(1);
      const first = failed[0]!;
      const next = run.agent.sessions[run.agent.sessions.indexOf(first) + 1]!;
      expect(next.spec.role).toBe(first.spec.role);
      expect(next.spec.submission.name).toBe(first.spec.submission.name);
      expect([first.spec.session.mode, next.start]).toEqual(['fork', { mode: 'fresh' }]);
      expect(run.unavailable, 'the restart read lost context').toBeGreaterThan(0);
      expect(next.outcome?.kind).toBe('submitted');
      expect(run.events.some(event => event.type === 'operation-recovery-attempt')).toBe(false);
      expect(run.events.some(event => event.type === 'operation-recovery-paused')).toBe(false);
      const identities = run.events.map(identityOf).filter(identity => identity !== null);
      expect(new Set(identities).size, 'accepted transitions keep distinct durable identities').toBe(identities.length);
      expect(committedGates(run.git)).toHaveLength(scenario.git.commits.filter(commit => commit.commit !== null).length);
      expect(run.events.filter(event => event.type === 'analysis-accepted')).toHaveLength(1);
    }, 60_000);
  }

  test('accepted orientation survives a lost session point and all optional provider history without another orientation', async () => {
    const scenario = scenarios.iteration;
    const target = await scenario.target(); cleanups.push(target.remove);
    const declared = declaringScenarios(scenario.script(target.root));
    const original = createScriptedAgent(declared);
    const firstAgent: AgentPort = { ...original, bindSessionStore(store) {
      const operations = original.bindSessionStore(store);
      return { ...operations, async continue(input) {
        const handle = await operations.continue(input);
        return input.task.submissionTool === workOrientationToolName
          ? { ...handle, receipt: handle.receipt.then(receipt => ({ ...receipt, point: null })) } : handle;
      } };
    } };
    const final = scenario.finalCandidate!;
    const git = scenarioGit(target.root, { ...scenario.git, previews: [
      { repositoryRoot: target.root, head: final.head, tree: final.tree },
      ...Array.from({ length: 4 }, () => ({ repositoryRoot: target.root, head: final.head, tree: final.tree })),
    ] });
    const commands = statedCommands(target.root, scenario.commands ?? []);
    const options = { git, candidates: compositionCandidates(target.root, scenario), inputs: scenario.inputs(),
      configuredAudit: announcingAudit(), commandExecution: commands, policy: recoveryPolicy };
    let interrupted = false; let acceptedInvocation = '';
    const first = await openRuns(target.root, { ...options, agent: firstAgent,
      afterWrite: async (write, runId) => {
        if (write !== 'invocation-ended' || original.sessions.at(-1)?.spec.submission.name !== workOrientationToolName) return;
        const event = (await logEvents(target.root, runId)).at(-1);
        if (event?.type !== 'invocation-ended' || event.data.ended !== 'submitted') return;
        acceptedInvocation = event.data.invocation; interrupted = true; await freeze();
      },
    });
    const receipt = await first.service.execute(startRun(plan));
    await until(() => interrupted, 20_000);
    const outcomePath = runPath(target.root, plan, receipt.jobId, runLayout.outcome(acceptedInvocation));
    const outcome = JSON.parse(await readFile(outcomePath, 'utf8')) as InvocationOutcome;
    expect(outcome).toMatchObject({ ended: 'submitted', disposition: 'applied', settled: { confirmed: true } });
    expect(outcome.session?.ref || null).toBeNull();
    const submissionPath = runPath(target.root, plan, receipt.jobId, runLayout.submission(acceptedInvocation));
    const acceptedBytes = await readFile(submissionPath);
    await staleCrashLock(target.root);
    const resumed = createScriptedAgent(declared);
    const losing = losingPayloads(resumed, 'missing');
    losing.lose();
    const reopened = await openRuns(target.root, { ...options, agent: losing.port });
    cleanups.push(() => reopened.service.close());
    await reopened.service.settled(plan, receipt.jobId);
    expect(reopened.service.getRun(plan, receipt.jobId)?.state, JSON.stringify(reopened.service.getRun(plan, receipt.jobId)?.failure)).toBe('completed');
    const events = await logEvents(target.root, receipt.jobId);
    expect(events.filter(event => event.type === 'work-orientation-recorded')).toMatchObject([
      { data: { invocation: acceptedInvocation, point: null } },
    ]);
    expect(resumed.sessions.filter(session => session.spec.submission.name === workOrientationToolName)).toHaveLength(0);
    expect(events.filter(event => event.type === 'invocation-started' && event.data.invocation === acceptedInvocation)).toHaveLength(1);
    expect(await readFile(submissionPath)).toEqual(acceptedBytes);
    commands.assertComplete(); git.assertComplete();
  }, 60_000);

  test('failure analyst retries its account before the responsible architect receives the retained digest', async () => {
    const fixture = await copyFixture(); cleanups.push(fixture.remove);
    await installTestRunner(fixture.root);
    const reviews = 'collection-review/workspace/reviews';
    const script = declaringScenarios(byRole({
      'initial-architect': [submit(currentAnalysis(analysis([entry('reviewer-note', reviews)]), 'document:review-notes-plan'))],
      'local-architect': [submit(assign(reviews, {}, outline())), submit(requestCompletion())],
      engineer: [[{ kind: 'end', message: 'The semantic result is unfinished.' }]],
    }));
    const agent = createScriptedAgent(interruptOnce(script, spec => spec.role === 'failure-analyst'));
    const opened = await openUnchangedRuns(fixture.root, {
      agent, inputs: treeInputs(), policy: recoveryPolicy,
      unchangedCheckpoints: [scenariosCommit(plan), 'work-item:reviewer-note', `final verification of plan "${plan}"`],
      previewCount: 5,
    });
    cleanups.push(() => opened.service.close());
    const receipt = await opened.service.execute(startRun(plan));
    await opened.service.settled(plan, receipt.jobId);
    assertUnchangedGit();
    expect(opened.service.getRun(plan, receipt.jobId)?.state, JSON.stringify(opened.service.getRun(plan, receipt.jobId)?.failure)).toBe('completed');
    const analysts = agent.sessions.filter(session => session.spec.role === 'failure-analyst');
    expect(analysts).toHaveLength(2);
    expect(analysts.map(session => session.outcome?.kind)).toEqual(['failed', 'submitted']);
    expect(agent.sessions.filter(session => session.spec.role === 'engineer')).toHaveLength(1);
    const events = await logEvents(fixture.root, receipt.jobId);
    expect(events.filter(event => event.type === 'iteration-closed')).toHaveLength(1);
    expect(events.some(event => event.type === 'operation-recovery-attempt')).toBe(false);
    expect(events.some(event => event.type === 'operation-recovery-paused')).toBe(false);
  }, 60_000);

  test.each(['transport', 'context'] as const)('reviewer %s recovery retains frozen candidate and required review coverage without spending semantic attempts', async mode => {
    const root = await reviewTarget(cleanups);
    const tree = 'c'.repeat(40);
    const first = reviewCandidates()['revision-01']!;
    const source = scriptedCandidates(root, { [reviewMaterialized]: reviewCandidates()[reviewMaterialized]!, 'revision-01': { ...first, tree, ...(mode === 'context' ? { files: { ...first.files, 'docs/notes.principles.md': 'Keep stores in memory.\n' } } : {}) } });
    const git = gateGit(root, { head: reviewBase, commits: [
      gateScenariosCommit(plan, reviewMaterialized, reviewBase), revisionGates[0]!, { commit: null }, { commit: null },
    ], previews: Array.from({ length: 4 }, () => ({ repositoryRoot: root, head: 'revision-01', tree })) });
    let time = new Date('2026-10-12T12:00:00Z').getTime();
    const script = declaringScenarios(reviewScript({
      architect: [submit(assign(notes, {}, outline())), submit(requestCompletion())],
      engineer: [submit(completionProposed('Added note store'), write(store, 'export const store = new Map(); // v1\n'))],
      reviewers: { 'rq-0001': [
        { kind: 'tool', tool: snapshotToolNames.diff, input: { path: store } },
        { kind: 'submit', input: { inspected: [store], missing: [], concerns: [] } },
      ], ...(mode === 'context' ? {
        'rq-0002': [{ kind: 'tool' as const, tool: snapshotToolNames.diff, input: { path: store } }, { kind: 'submit' as const, input: { inspected: [store], missing: [], concerns: [] } }],
        'rq-0003': [{ kind: 'tool' as const, tool: snapshotToolNames.diff, input: { path: store } }, { kind: 'submit' as const, input: { inspected: [store], missing: [], concerns: [] } }],
        orientation: [{ kind: 'submit' as const, input: { read: ['docs/notes.principles.md'], summary: 'Keep stores in memory.' } }],
      } : {}) },
    }));
    const contextInterrupted = new Set<string>();
    const interrupted = mode === 'transport' ? interruptOnce(script, spec => {
      if (spec.role !== 'reviewer') return false;
      time += 25;
      return true;
    }) : (spec: SessionSpec) => {
      const request = [...spec.prompt.matchAll(/(?:Code|Scope|Design) review (rq-\d{4})/gu)].at(-1)?.[1];
      if (spec.role === 'reviewer' && request && !contextInterrupted.has(request)) {
        contextInterrupted.add(request); time += 25;
        return [{ kind: 'resource' as const, resource: 'context' as const, reason: `Native compaction unavailable for frozen review ${request}` }];
      }
      return typeof script === 'function' ? script(spec) : script;
    };
    const agent = createScriptedAgent(interrupted);
    const opened = await openRuns(root, { agent, git: git.git, candidates: source, inputs: treeInputs(), now: () => new Date(time),
      policy: project => ({ ...recoveryPolicy(project), ...(mode === 'context' ? { ...testPolicy(project, { recovery: true, continuity: true }) } : {}), reviews: testReviewPolicy({ retries: 1, ...(mode === 'context' ? { kinds: ['code', 'scope', 'design'] } : {}) }) }) });
    cleanups.push(() => opened.service.close());
    const receipt = await opened.service.execute(startRun(plan));
    if (mode === 'context') {
      await until(() => opened.service.getRun(plan, receipt.jobId)?.state !== 'running' || opened.service.events(plan, receipt.jobId)!.some(event => event.type === 'operation-recovery-paused'));
      const held = await opened.service.recoveryInspection(plan, receipt.jobId);
      if (held) throw new Error(`Review recovery unexpectedly paused: ${JSON.stringify(held)}`);
    }
    await opened.service.settled(plan, receipt.jobId);
    expect(opened.service.getRun(plan, receipt.jobId)?.state, JSON.stringify(opened.service.getRun(plan, receipt.jobId)?.failure)).toBe('completed');
    git.assertComplete();
    const events = await logEvents(root, receipt.jobId);
    const starts = events.filter(event => event.type === 'review-attempt-started');
    expect(starts).toHaveLength(mode === 'context' ? 3 : 1);
    const attempt = await attemptRecord(root, receipt.jobId, starts[0]!.data.attempt);
    expect(attempt.id).toBe(starts[0]!.data.attempt);
    expect(attempt.settles).toBe(true);
    expect(new Date(attempt.finishedAt).getTime() - new Date(attempt.startedAt!).getTime()).toBeGreaterThanOrEqual(25);
    const projected = await new RunQueries(createQuerySource(opened.service)).reviews(plan, receipt.jobId, { workItem: null, after: null, limit: 100 });
    expect(projected.requests.find(request => request.attempts.some(value => value.id === attempt.id))!.attempts[0]!.transportInvocations).toEqual(attempt.transportInvocations);
    if (mode === 'transport') expect(agent.sessions.filter(session => session.spec.role === 'reviewer').map(session => session.outcome?.kind)).toEqual(['failed', 'submitted']);
    else {
      expect(contextInterrupted.size).toBe(3);
      expect(projected.requests.map(request => request.kind).sort()).toEqual(['code', 'design', 'scope']);
      for (const request of projected.requests) {
        expect(request.candidate).toBe('revision-01');
        expect(request.attempts).toHaveLength(1);
        expect(request.attempts[0]!.result).toBe('complete');
      }
    }
    expect(events.filter(event => event.type === 'iteration-closed')).toHaveLength(1);
    expect(events.some(event => event.type === 'operation-recovery-paused')).toBe(false);
  }, 60_000);

  test('semantic rejection and no submission do not consume automatic transport retries', async () => {
    for (const scenario of [scenarios['invalid-analysis'], scenarios['no-submission']]) {
      const run = await composedCaller(scenario);
      expect(run.service.getRun(plan, run.runId)?.state).toBe('failed');
      expect(run.agent.sessions.filter(session => session.spec.role === 'initial-architect')).toHaveLength(1);
      expect(run.events.filter(event => event.type === 'operation-recovery-attempt').every(event => event.data.predecessor === null && event.data.attempt === 0)).toBe(true);
      expect(run.events.some(event => event.type === 'operation-recovery-paused')).toBe(false);
    }
  }, 60_000);

  for (const tool of [coordinatorAssessmentToolName, coordinatorActionToolName, nonfunctionalRepairToolName]) {
    test(`nonfunctional ${tool} retries without repeating the accepted assessment or repair`, async () => {
      const fixture = await copyFixture(); cleanups.push(fixture.remove);
      const answers = nfrBoundaries(fixture.root, { repair: 'one-module' });
      const obligation = 'The review must retain an audit record.';
      const capturedPlan = join(fixture.root, 'plans/review-notes/plan.md');
      await writeFile(capturedPlan, `${await readFile(capturedPlan, 'utf8')}\n${obligation}\n`);
      const script = withDefaultTurns(spec => {
        if (spec.submission.name === intakeToolName) return submit({ goal: obligation, elements: [
          { key: 'draft:non-functional-requirement:audit', kind: 'non-functional', document: 'document:review-notes-plan', text: obligation, conditions: [], uncertainty: '' },
        ], incorporation: { documents: [{ document: 'document:review-notes-plan', scenarios: true, uncertainty: '' }], missing: [] } });
        if (spec.role === 'initial-architect') return submit(currentAnalysis(analysis([]), 'document:review-notes-plan'));
        if (spec.submission.name === coordinatorAssessmentToolName) return submit({ kind: 'assessment', results: [{
          nfr: 'non-functional-requirement:audit', result: spec.prompt.includes('(after-repair)') ? 'satisfied' : 'not-satisfied',
          inspectedScope: ['subs/workspace/subs/reviews/subs/core/src'], evidence: ['Current source inspected'], uncertainty: '',
        }] });
        if (spec.submission.name === coordinatorActionToolName) return submit({ kind: 'repair', nfrs: ['non-functional-requirement:audit'],
          startingModule: 'collection-review/workspace/reviews/core', task: 'Add audit record source', evidence: [], uncertainty: '' });
        if (spec.submission.name === nonfunctionalRepairToolName) {
          answers.repair();
          return submit({ kind: 'completed', summary: 'Audit record added', evidence: ['new source'], remaining: [] },
            write(join(fixture.root, 'subs/workspace/subs/reviews/subs/core/src/repair-recovery.ts'), 'export const auditRecord = true;\n'));
        }
        return [];
      });
      const agent = createScriptedAgent(interruptOnce(script, spec => spec.submission.name === tool));
      const opened = await openRuns(fixture.root, { ...answers.options, agent, policy: recoveryPolicy });
      cleanups.push(() => opened.service.close());
      const receipt = await opened.service.execute(startRun(plan));
      await opened.service.settled(plan, receipt.jobId);
      answers.assertComplete();
      expect(opened.service.getRun(plan, receipt.jobId)?.state, JSON.stringify(opened.service.getRun(plan, receipt.jobId)?.failure)).toBe('completed');
      const events = await logEvents(fixture.root, receipt.jobId);
      expect(events.filter(event => event.type === 'nonfunctional-phase-started')).toHaveLength(1);
      expect(events.filter(event => event.type === 'nonfunctional-assessed')).toHaveLength(2);
      expect(events.filter(event => event.type === 'nonfunctional-repair-assigned')).toHaveLength(1);
      expect(events.filter(event => event.type === 'nonfunctional-repair-committed')).toHaveLength(1);
      expect(events.some(event => event.type === 'operation-recovery-attempt')).toBe(false);
      expect(events.some(event => event.type === 'operation-recovery-paused')).toBe(false);
      expect(agent.sessions.filter(session => session.spec.submission.name === tool && session.outcome?.kind === 'failed')).toHaveLength(1);
    }, 60_000);
  }

  for (const boundary of ['qualification', 'fresh coordination', 'continued coordination']) {
    test(`capability ${boundary} retries without repeating its source capture or delegation`, async () => {
      const fixture = await copyCapabilityFixture(); cleanups.push(fixture.remove);
      const answers = capabilityFlowBoundaries(fixture.root, 'report', 'a+b');
      const a = 'capability-coordination/a', b = 'capability-coordination/b';
      let coordination = 0;
      const script = declaringScenarios(answers.script(spec => {
        if (spec.role === 'initial-architect') return submit(currentAnalysis(analysis([entry('richer-a-fact', a), entry('b-entry', b)]), 'document:need-plan'));
        if (spec.submission.name === localArchitectToolName) return submit(assign(a, {}, outline()));
        if (spec.submission.name === 'submit_capability_qualification') {
          const ids = [...spec.prompt.matchAll(/Use request (capability-request:[a-z0-9-]+) and invocation (inv-\d+)/gu)].at(-1)!;
          return submit({ kind: 'delegate-capability', request: ids[1], invocation: ids[2], taskKey: 'draft:capability-task:source-fact', provider: b,
            placementReason: 'B owns fact source', constraints: [], requirementRefs: [] });
        }
        if (spec.role === 'engineer') return [
          edit('caller.ts', 'return `Fact: ${value}`;', 'return `Fresh fact: ${value}`;'),
          ...submit({ kind: 'capability-needed', summary: 'A retains a provisional caller', request: {
            requestKey: 'draft:capability-request:source-fact', need: 'Read B fact with source for A', usage: [{ path: 'subs/a/src/caller.ts', use: 'Render richer result', prospective: false }],
            constraints: [], knownInterface: { kind: 'none-known' }, examples: [{ key: 'draft:capability-example:source-shown', title: 'A shows source', code: 'expect(renderA()).toContain("B")', designation: 'pseudocode' }],
          } }),
        ];
        if (spec.submission.name === 'submit_capability_action') {
          if (++coordination > 2) return [{ kind: 'wait', ms: 60_000 }];
          const ids = [...spec.prompt.matchAll(/Use task (capability-task:[a-z0-9-]+), planRevision (\d+) and invocation (inv-\d+)/gu)].at(-1)!;
          return submit({ kind: 'partial', task: ids[1], planRevision: Number(ids[2]), invocation: ids[3],
            progress: 'Read retained consumer and provider evidence', unfinished: ['Implement provider'] });
        }
        return [];
      }));
      const agent = createScriptedAgent(interruptOnce(script, spec => (
        boundary === 'qualification' ? spec.submission.name === 'submit_capability_qualification'
          : spec.submission.name === 'submit_capability_action' && (boundary === 'continued coordination' ? spec.session.mode === 'continue' : spec.session.mode === 'fresh'))));
      const opened = await openCapabilityRuns(fixture.root, { ...answers.options, agent, inputs: treeInputs(), policy: recoveryPolicy });
      cleanups.push(() => opened.service.close());
      const receipt = await opened.service.execute(startRun('need'));
      await until(() => coordination > 2 || opened.service.getRun('need', receipt.jobId)?.state === 'failed', 60_000);
      expect(opened.service.getRun('need', receipt.jobId)?.state, JSON.stringify(opened.service.getRun('need', receipt.jobId)?.failure)).not.toBe('failed');
      const current = opened.service.getRun('need', receipt.jobId)!;
      await opened.service.execute(stopRun('need', receipt.jobId, current.version));
      await opened.service.settled('need', receipt.jobId);
      answers.assertComplete();
      const events = opened.service.events('need', receipt.jobId)!;
      expect(events.filter(event => event.type === 'capability-requested')).toHaveLength(1);
      expect(events.filter(event => event.type === 'capability-delegated')).toHaveLength(1);
      expect(events.some(event => event.type === 'operation-recovery-attempt')).toBe(false);
      expect(events.some(event => event.type === 'operation-recovery-paused')).toBe(false);
      expect(agent.sessions.filter(session => session.outcome?.kind === 'failed')).toHaveLength(1);
      expect(agent.sessions.filter(session => session.spec.role === 'engineer')).toHaveLength(1);
    }, 60_000);
  }
});
