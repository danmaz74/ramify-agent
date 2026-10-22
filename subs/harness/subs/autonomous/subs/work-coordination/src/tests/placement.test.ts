import { openUnchangedRuns as openRuns, assertUnchangedGit } from '../../../../../../src/tests/helpers/unchanged-run.js';
import { scenariosCommit } from '../../../../../../src/tests/helpers/scripted-git.js';
import { expectNoProcesses, forgetExternalTools } from '../../../../../../src/tests/helpers/external-tools.js';
import { readFile } from 'node:fs/promises';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createScriptedAgent, type ScriptedAgent } from '../../../../../agent/src/scripted.js';
import type { ArchitectIndex } from '../../../../../evidence/src/views.js';
import { analysisLayout, type Hypothesis, type RegistryEntry } from '../../../planning/src/records.js';
import { architectureLayout, globalDecisionId, placementRequestSchema, type PlacementDecision, type PlacementRequest } from '../architecture/records.js';
import { acceptDecision } from '../architecture/accept.js';
import type { RunInputs } from '../../../../src/run/inputs.js';
import { runLayout } from '../../../../src/run/records.js';
import { type InvocationOutcome } from '../../../../../task-execution/src/records.js';
import type { RunEvent, RunEventOf } from '../../../../src/run/log.js';
import { reduceSessions } from '../../../../src/run/sessions.js';
import { copyFixture } from '../../../../../../src/tests/helpers/fixture.js';
import { declaringScenarios } from '../../../../../../src/tests/helpers/declarations.js';
import { analysis, currentAnalysis, entry, hypothesis, requestCompletion } from '../../../../../../src/tests/helpers/analysis.js';
import { byRole, readDeclaredTree, submit, treeInputs } from '../../../../../../src/tests/helpers/iterations.js';
import { decision as placementDecisionFixture, forkDecision, forkPartial, registryChange, requestPlacement } from './helpers/placement.js';
import {
  installTestRunner, onlyRun, runEventsOnDisk, runPath, startRun,
} from '../../../../../../src/tests/helpers/runs.js';

/*
 * Capability identity and placement, resolved in sequential forks of one
 * long-lived architect context.
 *
 * Each request refreshes the architect view, records its identity, and forks
 * the recorded request-time parent point. The fork investigates and decides; the parent
 * is never invoked for the choice. The brief of an accepted decision is
 * appended to the parent without a model call, and the next fork inherits
 * it.
 *
 * There is no retained comparison baseline and no diff: each fork is given
 * the refreshed view and the committed records, and checks current facts.
 */

vi.mock('node:child_process', async original =>
  (await import('../../../../../../src/tests/helpers/process-guard.js')).guardedChildProcess(await original<typeof import('node:child_process')>()));

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
  try { assertUnchangedGit(); expectNoProcesses(); } finally { forgetExternalTools(); }
});

const core = 'collection-review/workspace/catalog/core';
const panel = 'collection-review/workspace/catalog/ui';
const unchangedPlacementCheckpoints = [scenariosCommit('revision-diff'), 'work-item:compare-revisions', 'work-item:compare-panel', 'final verification of plan "revision-diff"'] as const;

test('descriptive placement IDs preserve their work and capability origin through accepted records', () => {
  const request = 'placement-request:resolve-review-predecessors';
  const id = globalDecisionId(request);
  const accepted = acceptDecision({ id, authority: 'global', request, workItem: 'work-item:add-revision-preview',
    invocation: 'inv-0001', body: placementDecisionFixture({ capability: 'capability:resolve-review-predecessors' }),
    registry: [registryChange({ capability: 'capability:resolve-review-predecessors', owner: core })],
    view: { status: 'placeholder' }, brief: 'Core resolves review predecessors.',
    committed: { registry: new Map(), hypotheses: new Map() },
  });
  expect(request).toMatch(/^placement-request:/);
  expect(accepted.decision).toMatchObject({ schema: 'ramify-agent.placement-decision/2', id,
    capability: 'capability:resolve-review-predecessors', request });
  expect(accepted.registry[0]).toMatchObject({ schema: 'ramify-agent.capability/2', capability: 'capability:resolve-review-predecessors' });
  expect(accepted.records[0]?.path).toContain('placement-decision%3A');
  expect(id).toBe('placement-decision:placement-resolve-review-predecessors');
  expect(globalDecisionId('unresolved-request:resolve-review-predecessors'))
    .toBe('placement-decision:unresolved-resolve-review-predecessors');
  expect(() => globalDecisionId('capability-request:resolve-review-predecessors')).toThrow();
});

test('a capability task is an exact placement subject and obsolete records are refused', () => {
  const task = 'capability-task:provide-review-source';
  const id = 'placement-request:review-source';
  const request = { schema: 'ramify-agent.placement-request/2', id, workItem: 'work-item:review-source',
    requester: panel, forCapability: task, question: 'Where does source reading belong?',
    requiredBehavior: 'Provide source reading', findings: [], candidates: [], unresolved: [],
    hypotheses: [], localDecisions: [] };
  expect(placementRequestSchema.safeParse(request).success).toBe(true);
  expect(placementRequestSchema.safeParse({ ...request, forCapability: 'consumer-requirement:foreign' }).success).toBe(false);
  expect(placementRequestSchema.safeParse({ ...request, schema: 'ramify-agent.placement-request/1', id: 'placement-request:compare-revisions' }).success).toBe(false);
});

/** A copy of the fixture project, made a git repository with the runner readiness looks for. */
async function target(): Promise<string> {
  const fixture = await copyFixture();
  cleanups.push(fixture.remove);
  await installTestRunner(fixture.root);
  return fixture.root;
}

/** The analysis the placement tests start from: two entries and one forecast. */
function analysed() {
  return currentAnalysis(analysis(
    [entry('compare-revisions', core, 'Compares two revisions of one record, field by field.'),
      entry('compare-panel', panel, 'Shows the comparison of two revisions on the record card.')],
    [hypothesis('field-diff', {
      capability: 'field-diff', change: 'create', suggestedOwner: core,
      involvedModules: [core, panel], anticipatedConsumers: [panel],
      rationale: 'Comparing two field maps may be one capability both surfaces use.',
    })],
  ), 'document:revision-diff-plan');
}

/** The decision the first fork makes: the capability is created in the catalog core. */
function firstDecision(brief: string) {
  return forkDecision({
    decision: {
      question: 'Where does comparing two revisions field by field belong?',
      outcome: 'create',
      capability: 'capability:field-diff',
      changesExistingSymbols: false,
      owner: core,
      rationale: 'The core already holds the revision chain, and both surfaces read it from there.',
      constraints: ['The comparison is read-only.'],
      uncertainties: [],
      evidence: { citations: [{ module: core }], gaps: ['no dependency facts are published for this fixture'] },
    },
    registry: [registryChange({
      capability: 'capability:field-diff', owner: core,
      behavior: 'Compares two revisions of one record and names the fields that differ.',
    })],
    hypothesisRevisions: [{
      hypothesis: 'hypothesis:field-diff', standing: 'confirmed',
      reason: 'The core owns the revision chain, which is what the comparison reads.',
    }],
    brief,
  });
}

/** The decision the second fork makes: the registered capability is reused. */
function secondDecision() {
  return forkDecision({
    decision: {
      question: 'Does the panel need its own comparison?',
      outcome: 'reuse',
      capability: 'capability:field-diff',
      changesExistingSymbols: false,
      owner: core,
      rationale: 'The brief of placement-decision:placement-compare-revisions already placed it in the core, and the panel is the consumer it anticipated.',
      constraints: [],
      uncertainties: [],
      evidence: { citations: [{ module: core }], gaps: [] },
    },
    registry: [registryChange({
      capability: 'capability:field-diff', owner: core,
      behavior: 'Compares two revisions of one record and names the fields that differ.',
      consumers: [{ capability: 'capability:compare-panel', workItem: 'work-item:compare-panel' }],
    })],
    brief: 'The panel consumes field-diff from the catalog core; nothing new was placed.',
  });
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, 'utf8')) as T;
}

function types(events: readonly RunEvent[]): string[] {
  return events.map(event => event.type);
}

describe('G2, G3: two sequential placement forks, and the brief between them', () => {
  test('the first creates a capability and revises its hypothesis; the second inherits its brief and reuses the entry', async () => {
    const project = await target();
    const brief = 'field-diff belongs to the catalog core: it owns the revision chain the comparison reads. The panel is its anticipated consumer.';
    const agent: ScriptedAgent = createScriptedAgent(declaringScenarios(byRole({
      'initial-architect': [submit(analysed())],
      'local-architect': [
        submit(requestPlacement({
          forCapability: 'capability:compare-revisions', requestKey: 'draft:placement-request:compare-revisions',
          question: 'Does comparing two revisions belong here, or to the panel that shows it?',
          findings: [{ text: 'The core holds the revision chain.', citations: [{ module: core }] }],
          candidates: [{ owner: core, note: 'It already holds the chain.' }],
          hypotheses: [{ hypothesis: 'hypothesis:field-diff', stance: 'supports', evidence: 'The chain is here and nowhere else.' }],
        })),
        submit(requestCompletion()),
        submit(requestPlacement({
          forCapability: 'capability:compare-panel', requestKey: 'draft:placement-request:compare-panel',
          question: 'Does the panel need its own comparison of two revisions?',
          candidates: [{ capability: 'capability:field-diff', owner: core, note: 'The brief says the core owns it.' }],
        })),
        submit(requestCompletion()),
      ],
      'global-fork': [submit(firstDecision(brief)), submit(secondDecision())],
    })));

    /** How many sessions the fake had started at each boundary of the chain. */
    const sessions: Array<{ write: string; started: number }> = [];
    const opened = await openRuns(project, {
      agent,
      inputs: treeInputs(),
      unchangedCheckpoints: unchangedPlacementCheckpoints,
      afterWrite: async write => {
        if (write === 'decision-accepted' || write === 'brief-appended') {
          sessions.push({ write, started: agent.sessions.length });
        }
      },
    });
    cleanups.push(() => opened.service.close());

    const receipt = await opened.service.execute(startRun('revision-diff'));
    await opened.service.settled('revision-diff', receipt.jobId);
    const runId = receipt.jobId;
    expect(onlyRun(opened.service, 'revision-diff').state).toBe('completed');

    const events = await runEventsOnDisk(project, 'revision-diff', runId);
    // Requests run one at a time: each one is requested, its view refreshed,
    // one fork run, its decision accepted, its brief appended and the
    // decision delivered, before the next request begins.
    expect(types(events).filter(type => type.startsWith('placement-') || type.startsWith('view-') || type.startsWith('decision-') || type.startsWith('brief-'))).toEqual([
      'placement-requested', 'view-refreshed', 'decision-accepted', 'brief-appended', 'decision-delivered',
      'placement-requested', 'view-refreshed', 'decision-accepted', 'brief-appended', 'decision-delivered',
    ]);

    // G3: the append is storage. No session is started for it, and no
    // invocation lies between the decision and the brief.
    const between = events.slice(
      types(events).indexOf('decision-accepted'),
      types(events).indexOf('brief-appended'),
    );
    expect(types(between)).toEqual(['decision-accepted']);
    expect(sessions.map(entry => entry.write)).toEqual(['decision-accepted', 'brief-appended', 'decision-accepted', 'brief-appended']);
    expect(sessions[0]!.started).toBe(sessions[1]!.started);
    expect(sessions[2]!.started).toBe(sessions[3]!.started);

    // G3: the brief reaches the next fork's input, which is where it is
    // sent to a model for the first time.
    const forks = agent.sessions.filter(session => session.spec.role === 'global-fork');
    expect(forks).toHaveLength(2);
    expect(forks[0]!.start.mode).toBe('fork');
    expect(forks[0]!.inherited.join('\n')).not.toContain(brief);
    expect(forks[1]!.start.mode).toBe('fork');
    expect(forks[1]!.inherited.join('\n')).toContain(brief);
    // The brief carries the decision's own references, and the fork's text
    // unchanged.
    expect(forks[1]!.inherited.join('\n')).toContain('Decision placement-decision:placement-compare-revisions (request placement-request:compare-revisions)');
    const sources = await Promise.all(['placement-request:compare-revisions', 'placement-request:compare-panel'].map(id => readJson<PlacementRequest>(runPath(project, 'revision-diff', runId, architectureLayout.request(id)))));
    expect(sources.map(request => request.globalSource!.appended)).toEqual([[], ['placement-decision:placement-compare-revisions']]);
    expect(sources.map(request => request.globalSource!.pending)).toEqual([[], []]);
    // The second decision was accepted later, so it belongs to neither captured inherited prefix.
    expect(forks.every(fork => !fork.inherited.join('\n').includes('Decision placement-decision:placement-compare-panel (request placement-request:compare-panel)'))).toBe(true);

    // G2: the second decision reuses the registered entry rather than
    // naming a new slug.
    const first = await readJson<PlacementDecision>(runPath(project, 'revision-diff', runId, architectureLayout.decision('placement-decision:placement-compare-revisions')));
    const second = await readJson<PlacementDecision>(runPath(project, 'revision-diff', runId, architectureLayout.decision('placement-decision:placement-compare-panel')));
    expect(first.outcome).toBe('create');
    expect(first.authority).toBe('global');
    expect(first.request).toBe('placement-request:compare-revisions');
    expect(second.outcome).toBe('reuse');
    expect(second.capability).toBe('capability:field-diff');
    expect(second.registry.map(ref => `${ref.id}@${ref.revision}`)).toEqual(['capability:field-diff@2']);
    expect(second.proposed).toBeUndefined();

    // Three capabilities: the two entries and the one the first fork
    // created. The second fork registered no new slug.
    const registry = await readJson<RegistryEntry>(runPath(project, 'revision-diff', runId, analysisLayout.registry('capability:field-diff', 2)));
    expect(registry.owner).toBe(core);
    expect(registry.origin).toBe('global-decision');
    expect(registry.decision).toBe('placement-decision:placement-compare-panel');
    expect(registry.consumers).toEqual([{ capability: 'capability:compare-panel', workItem: 'work-item:compare-panel' }]);

    // The hypothesis was revised by the decision, and revision 1 stands.
    const revised = await readJson<Hypothesis>(runPath(project, 'revision-diff', runId, analysisLayout.hypothesis('hypothesis:field-diff', 2)));
    expect(revised.standing).toBe('confirmed');
    expect(revised.confirmedBy).toBe('placement-decision:placement-compare-revisions');
    expect(revised.cause).toEqual({ decision: 'placement-decision:placement-compare-revisions', reason: 'The core owns the revision chain, which is what the comparison reads.' });
    const original = await readJson<Hypothesis>(runPath(project, 'revision-diff', runId, analysisLayout.hypothesis('hypothesis:field-diff', 1)));
    expect(original.standing).toBe('tentative');

    // G2: no baseline is retained. Each request recorded the identity of the
    // view it was answered against, and each decision rests on its own.
    const refreshed = events.filter(event => event.type === 'view-refreshed');
    expect(refreshed).toHaveLength(2);
    for (const [index, decision] of [first, second].entries()) {
      expect(decision.evidence.view).toEqual(refreshed[index]!.data.view);
    }

    // The decision reached the module architect that asked, before it planned
    // anything further.
    const delivered = types(events).indexOf('decision-delivered');
    expect(types(events).slice(delivered).includes('outline-revised')).toBe(true);
    const request = await readJson<PlacementRequest>(runPath(project, 'revision-diff', runId, architectureLayout.request('placement-request:compare-revisions')));
    expect(request.workItem).toBe('work-item:compare-revisions');
    expect(request.requester).toBe(core);
    expect(request.hypotheses[0]).toMatchObject({ stance: 'supports' });
    expect(request.hypotheses[0]!.ref).toMatchObject({ id: 'hypothesis:field-diff', revision: 1 });

    // EP08: placement-decision:placement-compare-revisions places field-diff in work-item:compare-revisions's own module, and selects nothing again; placement-decision:placement-compare-panel adds the
    // core to work-item:compare-panel, whose selection is made again from its architect's point and supersedes the first.
    const selections = events.flatMap(event => (event.type === 'context-selection-recorded' ? [event.data] : []));
    expect(selections.map(selection => [selection.workItem, selection.supersedes ?? null])).toEqual([
      ['work-item:compare-revisions', null], ['work-item:compare-panel', null], ['work-item:compare-panel', selections[1]!.selection],
    ]);
    expect(selections[2]!.selection).not.toBe(selections[1]!.selection);
    expect(types(events).indexOf('context-selection-recorded', types(events).lastIndexOf('decision-accepted'))).toBeGreaterThan(types(events).lastIndexOf('decision-accepted'));
    const selectors = agent.sessions.filter(session => session.spec.role === 'context-selector');
    expect(selectors).toHaveLength(3);
    expect(selectors[2]!.spec.prompt).toContain('Placement decision `placement-decision:placement-compare-panel` placed `capability:field-diff`');
  }, 120_000);
});

describe('X1c: a fork that returns partial findings and no decision', () => {
  test('it consumes its retries, nothing is appended, and the local architect is told', async () => {
    const project = await target();
    const agent = createScriptedAgent(declaringScenarios(byRole({
      'initial-architect': [submit(analysed())],
      'local-architect': [
        submit(requestPlacement({ forCapability: 'capability:compare-revisions', requestKey: 'draft:placement-request:compare-revisions' })),
        submit(requestCompletion()),
        submit(requestCompletion()),
      ],
      'global-fork': [submit(forkPartial(['two modules could own it'], ['the view publishes no dependency facts']))],
    })));
    const opened = await openRuns(project, { agent, inputs: treeInputs(), unchangedCheckpoints: unchangedPlacementCheckpoints });
    cleanups.push(() => opened.service.close());

    const receipt = await opened.service.execute(startRun('revision-diff'));
    await opened.service.settled('revision-diff', receipt.jobId);
    const runId = receipt.jobId;
    expect(onlyRun(opened.service, 'revision-diff').state).toBe('completed');

    const events = await runEventsOnDisk(project, 'revision-diff', runId);
    // The policy allows two retries; a partial return counts one, so three
    // forks ran and the third exhausted them.
    const partials = events.filter(event => event.type === 'fork-returned-partial');
    expect(partials.map(event => event.data.retry)).toEqual([1, 2, 3]);
    expect(agent.sessions.filter(session => session.spec.role === 'global-fork')).toHaveLength(3);

    // Nothing was decided and nothing was appended. The parent was never
    // invoked to supply the choice the fork could not make.
    expect(types(events)).not.toContain('decision-accepted');
    expect(types(events)).not.toContain('brief-appended');
    expect(types(events)).not.toContain('decision-delivered');
    expect(agent.sessions.filter(session => session.spec.role === 'context-selector')).toHaveLength(2);
    expect(agent.sessions.filter(session => session.spec.role === 'local-architect' && session.spec.submission.name === 'submit_work_orientation')).toHaveLength(2);
    expect(agent.sessions.filter(session => session.spec.role === 'local-architect' && session.spec.submission.name === 'submit_work_item_result')).toHaveLength(3);

    // The unresolved outcome reached the module architect that asked.
    const architects = agent.sessions.filter(session => session.spec.role === 'local-architect' && session.spec.submission.name === 'submit_work_item_result');
    expect(architects[1]!.spec.prompt).toContain('placement-request:compare-revisions');
    expect(architects[1]!.spec.prompt).toContain('was not resolved');
    expect(architects[1]!.spec.prompt).toContain('two modules could own it');
    expect(architects[1]!.spec.prompt).toContain('the view publishes no dependency facts');
  }, 120_000);
});

describe('a view identity that changes under an investigation', () => {
  test('the evidence is revalidated, the investigation repeats, and one decision is made, not two', async () => {
    const project = await target();
    let identity = 1;
    const inputs: RunInputs = {
      ...treeInputs(),
      async refresh(projectRoot: string): Promise<ArchitectIndex> {
        const tree = await readDeclaredTree(projectRoot);
        return { ...tree, revision: `rev/1:declared:${identity}`, input: `input/1:declared-${identity}` };
      },
    };
    const agent = createScriptedAgent(declaringScenarios(byRole({
      'initial-architect': [submit(analysed())],
      'local-architect': [submit(requestPlacement({ forCapability: 'capability:compare-revisions', requestKey: 'draft:placement-request:compare-revisions' })), submit(requestCompletion()), submit(requestCompletion())],
      'global-fork': [submit(firstDecision('field-diff belongs to the catalog core.'))],
    })));
    const opened = await openRuns(project, {
      agent,
      inputs,
      unchangedCheckpoints: unchangedPlacementCheckpoints,
      // The source changes while the first fork is investigating, so the
      // evidence it decided on is no longer the evidence in front of the
      // harness.
      afterWrite: async write => {
        if (write === 'view-refreshed' && identity === 1) identity = 2;
      },
    });
    cleanups.push(() => opened.service.close());

    const receipt = await opened.service.execute(startRun('revision-diff'));
    await opened.service.settled('revision-diff', receipt.jobId);
    const runId = receipt.jobId;
    expect(onlyRun(opened.service, 'revision-diff').state).toBe('completed');

    const events = await runEventsOnDisk(project, 'revision-diff', runId);
    const refreshed = events.filter(event => event.type === 'view-refreshed');
    expect(refreshed.map(event => event.data.attempt)).toEqual([1, 2]);
    expect(refreshed.map(event => (event.data.view as { input?: string }).input)).toEqual(['input/1:declared-1', 'input/1:declared-2']);

    // Two investigations, one decision: the revisions were never combined.
    expect(agent.sessions.filter(session => session.spec.role === 'global-fork')).toHaveLength(2);
    expect(events.filter(event => event.type === 'decision-accepted')).toHaveLength(1);
    expect(events.filter(event => event.type === 'brief-appended')).toHaveLength(1);

    const decision = await readJson<PlacementDecision>(runPath(project, 'revision-diff', runId, architectureLayout.decision('placement-decision:placement-compare-revisions')));
    expect(decision.evidence.view).toEqual({
      status: 'materialized',
      revision: 'rev/1:declared:2',
      input: 'input/1:declared-2',
      coverageLimits: ['the view\'s own coverage limits could not be read, so absence in it is not proof of absence'],
    });

    // The second fork was told what changed and what that means.
    const forks = agent.sessions.filter(session => session.spec.role === 'global-fork');
    expect(forks[1]!.spec.prompt).toContain('The evidence changed under the earlier fork');
    expect(forks[1]!.spec.prompt).toContain('input/1:declared-1');
    expect(forks[1]!.spec.prompt).toContain('input/1:declared-2');
  }, 120_000);
});

describe('the invocation of a fork', () => {
  test('records the mode that was actual, and the point its history reached', async () => {
    const project = await target();
    const agent = createScriptedAgent(declaringScenarios(byRole({
      'initial-architect': [submit(analysed())],
      'local-architect': [submit(requestPlacement({ forCapability: 'capability:compare-revisions', requestKey: 'draft:placement-request:compare-revisions' })), submit(requestCompletion()), submit(requestCompletion())],
      'global-fork': [submit(firstDecision('field-diff belongs to the catalog core.'))],
    })));
    const opened = await openRuns(project, { agent, inputs: treeInputs(), unchangedCheckpoints: unchangedPlacementCheckpoints });
    cleanups.push(() => opened.service.close());
    const receipt = await opened.service.execute(startRun('revision-diff'));
    await opened.service.settled('revision-diff', receipt.jobId);
    const runId = receipt.jobId;

    const events = await runEventsOnDisk(project, 'revision-diff', runId);
    const fork = events.find(event => event.type === 'invocation-started' && event.data.role === 'global-fork');
    expect(fork).toBeDefined();
    const id = (fork!.data as { invocation: string }).invocation;
    const invocation = await readJson<{ session: { requested: string; actual: string; from?: string } }>(
      runPath(project, 'revision-diff', runId, runLayout.invocation(id)),
    );
    expect(invocation.session.requested).toBe('fork');
    expect(invocation.session.from).not.toBe('');

    const outcome = await readJson<InvocationOutcome>(runPath(project, 'revision-diff', runId, runLayout.outcome(id)));
    expect(outcome.session?.mode).toBe('fork');
    expect(outcome.session?.degradedReason).toBeUndefined();
    expect(outcome.session?.ref).not.toBe('');

    // The append names the point the parent's history reached, which is
    // what the next fork would fork from.
    const appended = events.find(event => event.type === 'brief-appended');
    expect(appended!.data).toMatchObject({ decision: 'placement-decision:placement-compare-revisions', generation: 1, outcome: 'appended' });
    expect((appended!.data as { session: string }).session).not.toBe('');
  }, 120_000);
});

describe('a start the executor could not honor', () => {
  test('is recorded at the invocation\'s end with what was requested, what was actual and the executor\'s reason', async () => {
    const project = await target();
    const agent = createScriptedAgent(declaringScenarios(byRole({
      'initial-architect': [submit(analysed())],
      'local-architect': [submit(requestPlacement({ forCapability: 'capability:compare-revisions', requestKey: 'draft:placement-request:compare-revisions' })), submit(requestCompletion()), submit(requestCompletion())],
      'global-fork': [submit(firstDecision('field-diff belongs to the catalog core.'))],
    })));
    // The executor forgets the architect context and the module architect's
    // session as soon as each first invocation ends, so the requested preserving fork must remain unavailable.
    let forgotInitial = false;
    let forgotLocal = false;
    const opened = await openRuns(project, {
      agent,
      inputs: treeInputs(),
      unchangedCheckpoints: unchangedPlacementCheckpoints,
      afterWrite: async write => {
        if (write !== 'invocation-ended') return;
        const last = agent.sessions.at(-1);
        if (last?.spec.role === 'initial-architect' && !forgotInitial) {
          forgotInitial = true;
          expect(agent.loseSession(JSON.parse(last.ref))).toBe(true);
        } else if (last?.spec.submission.name === 'submit_work_item_result' && !forgotLocal) {
          forgotLocal = true;
          expect(agent.loseSession(JSON.parse(last.ref))).toBe(true);
        }
      },
    });
    cleanups.push(() => opened.service.close());
    const receipt = await opened.service.execute(startRun('revision-diff'));
    await opened.service.settled('revision-diff', receipt.jobId);

    const events = await runEventsOnDisk(project, 'revision-diff', receipt.jobId);
    expect(events.filter(event => event.type === 'job-failed')).toHaveLength(0);
    const degraded = events.filter((event): event is RunEventOf<'invocation-ended'> => event.type === 'invocation-ended' && event.data.degraded?.actual === 'fresh');
    expect(degraded.map(event => event.data.degraded?.requested)).toEqual(['fork', 'continue']);
    expect(agent.sessions.filter(session => session.spec.role === 'global-fork')).toHaveLength(1);
    expect(agent.sessions.find(session => session.spec.role === 'global-fork')!.start.mode).toBe('fresh');
    const request = await readJson<PlacementRequest>(runPath(project, 'revision-diff', receipt.jobId, architectureLayout.request('placement-request:compare-revisions')));
    expect(request.globalSource?.ref).not.toBeNull();
    expect(events.filter(event => event.type === 'session-opened' && event.data.role === 'initial-architect')).toHaveLength(1);
  }, 120_000);
});

describe('a parent context that can no longer be read', () => {
  test('lost parent context uses ordinary fresh requests without rebuilding or promoting a replacement', async () => {
    const project = await target();
    const brief = 'field-diff belongs to the catalog core, which owns the revision chain.';
    const agent = createScriptedAgent(declaringScenarios(byRole({
      'initial-architect': [submit(analysed())],
      'local-architect': [
        submit(requestPlacement({ forCapability: 'capability:compare-revisions', requestKey: 'draft:placement-request:compare-revisions' })),
        submit(requestCompletion()),
        submit(requestPlacement({ forCapability: 'capability:compare-panel', requestKey: 'draft:placement-request:compare-panel' })),
        submit(requestCompletion()),
      ],
      'global-fork': [submit(firstDecision(brief)), submit(secondDecision())],
    })));

    let lost = false;
    const opened = await openRuns(project, {
      agent,
      inputs: treeInputs(),
      unchangedCheckpoints: unchangedPlacementCheckpoints,
      afterWrite: async write => {
        // The parent is lost while the first decision is committed and its
        // brief is not appended yet.
        if (write === 'decision-accepted' && !lost) {
          lost = true;
          expect(agent.loseSession(JSON.parse(agent.sessions.find(session => session.spec.role === 'initial-architect')!.ref))).toBe(true);
        }
      },
    });
    cleanups.push(() => opened.service.close());

    const receipt = await opened.service.execute(startRun('revision-diff'));
    await opened.service.settled('revision-diff', receipt.jobId);
    const runId = receipt.jobId;
    expect(onlyRun(opened.service, 'revision-diff').state).toBe('completed');

    const events = await runEventsOnDisk(project, 'revision-diff', runId);
    expect(events.filter(event => event.type === 'global-context-rebuilt')).toEqual([]);
    const missing = events.filter(event => event.type === 'brief-not-appended');
    expect(missing.map(event => event.data.decision)).toEqual(['placement-decision:placement-compare-revisions', 'placement-decision:placement-compare-panel']);
    expect(missing.every(event => event.data.generation === 1)).toBe(true);
    expect(events.filter(event => event.type === 'brief-appended')).toEqual([]);

    // The decision still reached the module architect that asked for it.
    expect(events.filter(event => event.type === 'decision-delivered')).toHaveLength(2);

    // The next fork was started fresh and oriented from the records, which
    // is where the first decision's brief is read from. Rebuilding cleared
    // the pending list: nothing appended placement-decision:placement-compare-revisions afterwards.
    const forks = agent.sessions.filter(session => session.spec.role === 'global-fork');
    expect(forks).toHaveLength(2);
    expect(forks[1]!.start.mode).toBe('fresh');
    expect(forks[1]!.inherited).toEqual([]);
    expect(forks[1]!.spec.prompt).not.toContain('rebuilt from');
    expect(forks[1]!.spec.prompt).toContain('The core already holds the revision chain');
    const source = (await readJson<PlacementRequest>(runPath(project, 'revision-diff', runId, architectureLayout.request('placement-request:compare-panel')))).globalSource!;
    expect(source).toMatchObject({ generation: 1, ref: null, appended: [], pending: ['placement-decision:placement-compare-revisions'] });
    const startedFresh = events.find(event => event.type === 'session-opened' && event.data.role === 'global-fork' && event.data.fork === undefined);
    expect(startedFresh?.type).toBe('session-opened');
    if (startedFresh?.type !== 'session-opened') throw new Error('Expected fresh global session');
    expect(startedFresh.data.replaces).toBeUndefined();
    expect(forks[1]!.spec.prompt).toContain('`capability:field-diff` → `collection-review/workspace/catalog/core`');

    // The invocation of that fork records what was requested and what was
    // actual, which is how a fork that became a fresh session is visible.
    const started = events.filter(event => event.type === 'invocation-started' && event.data.role === 'global-fork');
    const outcome = await readJson<InvocationOutcome>(
      runPath(project, 'revision-diff', runId, runLayout.outcome((started[1]!.data as { invocation: string }).invocation)),
    );
    expect(outcome.session?.mode).toBe('fresh');

    // The session that held the lost context is finished as lost, and the
    // fork that rebuilt the context is kept as the context itself: the
    // second brief is appended to it, and run end finishes it.
    const sessions = reduceSessions(events);
    const context = (started[0]!.data as { session: string }).session;
    expect(context).not.toBe('ses-0002');
    expect(sessions.get('ses-0002')).toMatchObject({ role: 'initial-architect', state: 'finished', finished: 'lost', appends: [] });
    const rebuiltContext = (started[1]!.data as { session: string }).session;
    expect(sessions.get(rebuiltContext)).toMatchObject({ role: 'global-fork', state: 'finished', finished: 'not-kept' });
    expect(sessions.get(rebuiltContext)!.appends).toHaveLength(0);
    expect(sessions.get(context)).toMatchObject({ state: 'finished', finished: 'not-kept' });
    // ST03: the first fork forked the architect context of generation 1 at
    // the plan architect's end; the fork that rebuilt the context names
    // the session it took the place of, and forks from nothing.
    expect(sessions.get(context)!.fork).toEqual({ from: { session: 'ses-0002', invocation: 'inv-0002' }, reason: 'placement-request', generation: 1, briefs: [] });
    expect(sessions.get(rebuiltContext)).toMatchObject({ fork: null, replaces: null });
  }, 120_000);
});

describe('a fork whose submissions are invalid', () => {
  test('the errors reach the same fork, a corrected submission is accepted, and nothing changed meanwhile', async () => {
    const project = await target();
    const agent = createScriptedAgent(declaringScenarios(byRole({
      'initial-architect': [submit(analysed())],
      'local-architect': [submit(requestPlacement({ forCapability: 'capability:compare-revisions', requestKey: 'draft:placement-request:compare-revisions' })), submit(requestCompletion()), submit(requestCompletion())],
      'global-fork': [[
        // The rule this iteration's guard names: an owner the refreshed
        // view does not have, with nothing proposing it.
        { kind: 'submit', input: forkDecision({
          decision: {
            question: 'Where does it belong?', outcome: 'create', capability: 'capability:field-diff',
            changesExistingSymbols: false, owner: 'collection-review/workspace/nowhere',
            rationale: 'r', constraints: [], uncertainties: [], evidence: { citations: [], gaps: [] },
          },
          registry: [],
        }) },
        { kind: 'submit', input: firstDecision('field-diff belongs to the catalog core.') },
      ]],
    })));
    const opened = await openRuns(project, { agent, inputs: treeInputs(), unchangedCheckpoints: unchangedPlacementCheckpoints });
    cleanups.push(() => opened.service.close());
    const receipt = await opened.service.execute(startRun('revision-diff'));
    await opened.service.settled('revision-diff', receipt.jobId);
    const runId = receipt.jobId;
    expect(onlyRun(opened.service, 'revision-diff').state).toBe('completed');

    // The rejection was answered to the same session, with its path, and the
    // correction was accepted.
    const fork = agent.sessions.find(session => session.spec.role === 'global-fork')!;
    const rejected = fork.results.find(result => result.isError)!;
    expect(rejected.text).toContain('"path": "decision.proposed"');
    expect(rejected.text).toContain('Correct every error above and call the tool again.');
    expect(fork.verdicts).toEqual([{ accepted: false, errors: [expect.any(String)] }, { accepted: true }]);

    const events = await runEventsOnDisk(project, 'revision-diff', runId);
    expect(events.filter(event => event.type === 'decision-accepted')).toHaveLength(1);
    const started = events.find(event => event.type === 'invocation-started' && event.data.role === 'global-fork')!;
    const id = (started.data as { invocation: string }).invocation;
    const outcome = await readJson<InvocationOutcome>(runPath(project, 'revision-diff', runId, runLayout.outcome(id)));
    expect(outcome.ended).toBe('submitted');
    expect(outcome.rejectedSubmissions).toBe(1);
    // Each rejection is an observation with its errors, and the input
    // itself is not stored.
    const observations = await readFile(runPath(project, 'revision-diff', runId, runLayout.observations(id)), 'utf8');
    expect(observations).toContain('"target":"submit_placement_decision"');
    expect(observations).toContain('decision.proposed');
  }, 120_000);

  test('four invalid fork submissions leave the same fork able to correct its decision', async () => {
    const project = await target();
    const broken = { kind: 'decision', decision: { question: 'where?' } };
    const agent = createScriptedAgent(declaringScenarios(byRole({
      'initial-architect': [submit(analysed())],
      'local-architect': [submit(requestPlacement({ forCapability: 'capability:compare-revisions', requestKey: 'draft:placement-request:compare-revisions' })), submit(requestCompletion()), submit(requestCompletion())],
      'global-fork': [[
        { kind: 'submit', input: broken },
        { kind: 'submit', input: broken },
        { kind: 'submit', input: broken },
        { kind: 'submit', input: broken },
        { kind: 'submit', input: firstDecision('field-diff belongs to the catalog core.') },
      ]],
    })));
    const opened = await openRuns(project, { agent, inputs: treeInputs(), unchangedCheckpoints: unchangedPlacementCheckpoints });
    cleanups.push(() => opened.service.close());
    const receipt = await opened.service.execute(startRun('revision-diff'));
    await opened.service.settled('revision-diff', receipt.jobId);
    const runId = receipt.jobId;

    const snapshot = onlyRun(opened.service, 'revision-diff');
    expect(snapshot.state).toBe('completed');

    const events = await runEventsOnDisk(project, 'revision-diff', runId);
    const types = events.map(event => event.type);
    expect(types).toContain('decision-accepted');
    expect(types).toContain('brief-appended');
    expect(types).toContain('decision-delivered');
    // The request itself stands, and one fork ran.
    expect(types.filter(type => type === 'placement-requested')).toHaveLength(1);
    expect(agent.sessions.filter(session => session.spec.role === 'global-fork')).toHaveLength(1);

    const forkStart = events.find(event => event.type === 'invocation-started' && event.data.role === 'global-fork')!;
    const forkId = (forkStart.data as { invocation: string }).invocation;
    const ended = events.find(event => event.type === 'invocation-ended' && event.data.invocation === forkId)!;
    expect(ended.data).toMatchObject({ ended: 'submitted' });
    const fork = agent.sessions.find(session => session.spec.role === 'global-fork')!;
    expect(fork.verdicts).toHaveLength(5);
    expect(fork.verdicts.slice(0, 4).every(verdict => (verdict as { accepted: boolean }).accepted === false)).toBe(true);
    expect(fork.verdicts[4]).toMatchObject({ accepted: true });
  }, 120_000);
});

describe('a decision that replaces an earlier one', () => {
  test('it names what it affects, and the consequence reaches that work item before its own turn', async () => {
    const project = await target();
    const consequence = 'The panel owns the comparison it was going to consume, so it implements it rather than importing it.';
    const agent = createScriptedAgent(declaringScenarios(byRole({
      'initial-architect': [submit(analysed())],
      'local-architect': [
        submit(requestPlacement({ forCapability: 'capability:compare-revisions', requestKey: 'draft:placement-request:compare-revisions' })),
        submit(requestPlacement({ forCapability: 'capability:compare-revisions', requestKey: 'draft:placement-request:compare-revisions-recheck', question: 'Is the core still the right owner now that only the panel reads it?' })),
        submit(requestCompletion()),
        submit(requestCompletion()),
      ],
      'global-fork': [
        submit(firstDecision('field-diff belongs to the catalog core.')),
        submit(forkDecision({
          decision: {
            question: 'Is the core still the right owner now that only the panel reads it?',
            outcome: 'extract',
            capability: 'capability:field-diff',
            changesExistingSymbols: true,
            owner: panel,
            rationale: 'The only reader is the panel, and the comparison has no other consumer.',
            constraints: [],
            uncertainties: [],
            evidence: { citations: [{ module: panel }], gaps: [] },
            revises: { decision: 'placement-decision:placement-compare-revisions', affected: [{ workItem: 'work-item:compare-panel', consequence }] },
          },
          registry: [registryChange({
            capability: 'capability:field-diff', owner: panel,
            behavior: 'Compares two revisions of one record and names the fields that differ.',
          })],
          brief: 'field-diff moves from the catalog core to the panel; placement-decision:placement-compare-revisions is replaced.',
        })),
      ],
    })));
    const opened = await openRuns(project, { agent, inputs: treeInputs(), unchangedCheckpoints: unchangedPlacementCheckpoints });
    cleanups.push(() => opened.service.close());
    const receipt = await opened.service.execute(startRun('revision-diff'));
    await opened.service.settled('revision-diff', receipt.jobId);
    const runId = receipt.jobId;
    expect(onlyRun(opened.service, 'revision-diff').state).toBe('completed');

    const second = await readJson<PlacementDecision>(runPath(project, 'revision-diff', runId, architectureLayout.decision('placement-decision:placement-compare-revisions-recheck')));
    expect(second.revises).toEqual({ decision: 'placement-decision:placement-compare-revisions', affected: [{ workItem: 'work-item:compare-panel', consequence }] });
    // The registry records where the capability was, which is what makes
    // the move visible rather than silent.
    const moved = await readJson<RegistryEntry>(runPath(project, 'revision-diff', runId, analysisLayout.registry('capability:field-diff', 2)));
    expect(moved.owner).toBe(panel);
    expect(moved.previousOwner).toBe(core);

    // The consequence reached the work item it names, at its own turn.
    const architects = agent.sessions.filter(session => session.spec.role === 'local-architect');
    const affected = architects.at(-1)!;
    expect(affected.spec.prompt).toContain('Perform assignment for {"workItem":"work-item:compare-panel"}');
    const received = [...affected.inherited, affected.spec.prompt].join('\n');
    expect(received).toContain('placement-decision:placement-compare-revisions-recheck');
    expect(received).toContain(consequence);
    expect(received).toContain('It replaces `placement-decision:placement-compare-revisions`.');
  }, 120_000);
});
