import { describe, expect, it } from 'vitest';
import { scenarioRecordSchema, scenarioSourceHash } from '../../../scenarios/src/records.js';
import { identityTagOf } from '../../../scenarios/src/rendering.js';
import { gateAttemptSchema, gateAuditOutcomeSchema } from '../../../autonomous/subs/acceptance/src/gate-records.js';
import { entryAssignmentsSchema } from '../../../autonomous/subs/planning/src/records.js';
import { iterationAssignmentSchema, iterationResultSchema } from '../../../autonomous/subs/work-coordination/src/work/iterations.js';
import { executionCapabilityDetailSchema, executionNodeSchema, executionScenarioDetailSchema } from '../../../../src/interfaces/protocol/execution-map.js';
import { executionCapabilityDetailOf, executionCoreOf, executionScenarioDetailOf } from '../execution-map.js';
import { eventPage } from '../events.js';
import { snapshotOf } from '../snapshot.js';
import { runSnapshotSchema, scenarioListResponseSchema } from '../../../../src/interfaces/protocol/runs.js';
import { scenarioListOf } from '../scenarios.js';
import type { RunEvent } from '../../../autonomous/src/run/log.js';
import { runView } from '../inputs.js';
import { at, constructedRun, hash, item, registered, reviews, type Line } from '../../../../src/tests/helpers/constructed.js';

const description = `The full capability description.\n${'Retain this sentence. '.repeat(300)}`;
const source = ['Scenario: A complete block', '  Given the state is recorded', '  When the work runs', '  Then the whole block remains available'];
const scenario = scenarioRecordSchema.parse({
  schema: 'ramify-agent.scenario/2', id: 'scenario:case-001', kind: 'entry', entry: 'capability:full-description', owner: reviews,
  origin: { kind: 'architect', refs: ['functional-requirement:case-002'] }, citedElements: ['functional-requirement:case-002'], partOf: null, subScenarios: [],
  name: 'A complete block', source, hash: scenarioSourceHash(source), file: 'subs/reviews/src/tests/features/full.feature',
});
const entries = entryAssignmentsSchema.parse({ schema: 'ramify-agent.entry-assignments/2', view: { status: 'placeholder' },
  entries: [{ capability: 'full-description', description, owner: reviews, capabilityId: 'capability:full-description', functionalRequirementIds: [], functionalAcceptanceIds: [], contextIds: [], citations: [] }],
});

/**
 * A gate whose configured audit ran `scenarioId` through a Cucumber check, as
 * the provider's raw check record lists it; `unrun` is a gate whose audit ran
 * no scenario at all.
 */
function gate(id: string, status: 'passed' | 'failed', unrun: boolean, checkpoint: 'iteration' | 'readiness' | 'final' = 'iteration', scenarioId = 'scenario:case-001') {
  const ran = {
    uri: scenario.file, line: 1, name: scenarioId, tags: [identityTagOf(scenarioId)], outcome: status, messages: [],
    steps: status === 'failed' ? [{ text: source[3], status: 'FAILED', definitionLocations: [], errorMessage: 'failed' }] : [],
  };
  return gateAttemptSchema.parse({
    schema: 'ramify-agent.gate-attempt/3', id, checkpoint,
    subject: checkpoint === 'iteration' ? { workItem: 'work-item:case-001', iteration: 'work-item:case-001.i01' } : {},
    proposedBy: null, repairRound: 0, infrastructureAttempt: 0, head: 'before', commit: null,
    audited: checkpoint === 'readiness' ? null : 'audited-commit',
    evidence: checkpoint === 'readiness' ? null : { runRef: 'refs/audited/run', reportCommit: 'report', treeRef: 'refs/audited/tree' },
    ...(checkpoint === 'readiness' || unrun ? {} : { provider: { result: {}, checks: {
      scenarios: { status: status === 'passed' ? 'pass' : 'fail', commands: { cucumber: { cucumberMessages: { status: 'read', run: { scenarios: [ran] } } } } },
    } } }),
    guardedChanges: [], rules: [], commands: [], verdict: status, cause: status === 'failed' ? 'check-failed' : null, next: status === 'failed' ? 'repair' : 'accept',
  });
}

function recordedRun(extra: Line[] = []) {
  return constructedRun([
    { type: 'analysis-accepted', data: {}, records: [
      { path: 'analysis/entries.json', body: entries },
      { path: at('registry', 'capability:full-description'), body: registered('capability:full-description') },
      { path: 'scenarios/sc-001.json', body: scenario },
      { path: 'work-items/wi-001/item.json', body: item('work-item:case-001', { entry: 'capability:full-description' }) },
    ] },
    { type: 'obligation-reported', data: { id: 'scenario:case-001', judgment: 'done', basedOnRevision: 0, revision: 1, by: 'inv-001', submission: 'a'.repeat(64) } },
    ...extra,
  ]);
}

function assignment(id: string, workItem: string, revision: number) {
  return iterationAssignmentSchema.parse({
    schema: 'ramify-agent.iteration-assignment/2', id, workItem,
    outline: { id: workItem, revision, hash }, stage: 0, kind: 'ordinary', goal: `Do ${id}`, approach: 'Implement it.',
    scope: { revision, base: { module: reviews, included: [] },
      extra: [{ path: `subs/reviews/src/assignment-${revision}.ts`, purpose: 'contract' }], read: [], bootstrap: [], rationale: 'Recorded scope.',
      resolved: { excluded: [], included: [], ownership: { provider: 'ramify.affected-cli/4', ramifyVersion: 'scripted-lifecycle-only', inputId: 'scripted-scope', configuration: 'tsconfig.json', root: '/p', modules: [{ id: 'app', parent: null, directory: '.' }], exclusions: [] }, roots: [], files: [], view: { status: 'placeholder' } } },
    externalCapabilities: [], completionEvidence: 'Check it.', evidenceObligations: [],
    gate: { checkpoint: 'iteration', tests: { policy: 'owned-by-scope', exactOwners: [], subtrees: [], extraSuites: [] } },
    guarded: [], authorizations: [],
  });
}

describe('execution core from committed run records', () => {
  it('targets ordered gate history for a scenario beyond the capped list', () => {
    const many = Array.from({ length: 501 }, (_, index) => {
      const id = `scenario:case-${String(index + 1).padStart(3, '0')}`;
      return { path: `scenarios/${id}.json`, body: scenarioRecordSchema.parse({ ...scenario, id }) };
    });
    const run = constructedRun([
      { type: 'analysis-accepted', data: {}, records: many },
      { type: 'gate-attempted', data: {}, records: [{ path: 'gates/ga-last/attempt.json', body: gate('ga-last', 'failed', false, 'iteration', 'scenario:case-501') }] },
      { type: 'gate-attempted', data: {}, records: [{ path: 'gates/ga-repaired/attempt.json', body: gate('ga-repaired', 'passed', false, 'iteration', 'scenario:case-501') }] },
    ]);
    const view = runView(run);
    expect(scenarioListOf(view).scenarios).toHaveLength(500);
    expect(scenarioListOf(view).scenarios.some(row => row.id === 'scenario:case-501')).toBe(false);
    const detail = executionScenarioDetailSchema.parse(executionScenarioDetailOf(view, 'scenario:case-501')).detail;
    expect(detail.state).toBe('available');
    if (detail.state === 'available') expect(detail.gates.map(row => [row.gate, row.status])).toEqual([
      ['ga-last', 'failed'], ['ga-repaired', 'passed'],
    ]);
  });
  it('reads old gates without an audit fact and a failed published audit independently of verdict', () => {
    const old = gate('ga-old', 'failed', false);
    const failedAudit = gate('ga-audit-failed', 'failed', false);
    const run = recordedRun([
      { type: 'gate-attempted', data: { gate: 'ga-old', checkpoint: 'iteration', verdict: 'failed', next: 'repair' },
        records: [{ path: 'gates/ga-old/attempt.json', body: old }] },
      { type: 'gate-attempted', data: { gate: 'ga-audit-failed', checkpoint: 'iteration', verdict: 'failed', next: 'repair' },
        records: [
          { path: 'gates/ga-audit-failed/attempt.json', body: failedAudit },
          { path: 'gates/ga-audit-failed/audit-outcome.json', body: gateAuditOutcomeSchema.parse({
            schema: 'ramify-agent.gate-audit-outcome/1', gate: 'ga-audit-failed', overall: 'fail', audited: 'audited-commit',
          }) },
        ] },
    ]);
    const index = executionCoreOf(runView(run));
    expect(index.nodes.find(node => node.key === 'gate:ga-old')).toMatchObject({ verdict: 'failed', audit: 'unavailable' });
    expect(index.nodes.find(node => node.key === 'gate:ga-audit-failed')).toMatchObject({ verdict: 'failed', audit: 'failed', evidencePresent: true });
  });
  it('projects an indeterminate invocation verdict as indeterminate, never as a failed audit', () => {
    const run = recordedRun([
      { type: 'gate-attempted', data: { gate: 'ga-audit-open', checkpoint: 'final', verdict: 'not-verified', next: 'retry-infrastructure' },
        records: [
          { path: 'gates/ga-audit-open/attempt.json', body: gate('ga-audit-open', 'failed', false, 'final') },
          { path: 'gates/ga-audit-open/audit-outcome.json', body: gateAuditOutcomeSchema.parse({
            schema: 'ramify-agent.gate-audit-outcome/1', gate: 'ga-audit-open', overall: 'indeterminate', audited: 'audited-commit',
          }) },
        ] },
    ]);
    expect(executionCoreOf(runView(run)).nodes.find(node => node.key === 'gate:ga-audit-open')).toMatchObject({ audit: 'indeterminate', evidencePresent: true });
  });
  it('projects a readiness gate\'s recorded audit outcome, never not applicable', () => {
    const audited = (id: string) => gateAttemptSchema.parse({ ...gate(id, 'passed', false, 'readiness'), audited: 'audited-commit',
      evidence: { runRef: 'refs/audited/run', reportCommit: 'report', treeRef: 'refs/audited/tree' } });
    const outcome = (id: string, overall: 'pass' | 'fail') => ({ path: `gates/${id}/audit-outcome.json`, body: gateAuditOutcomeSchema.parse({
      schema: 'ramify-agent.gate-audit-outcome/1', gate: id, overall, audited: 'audited-commit',
    }) });
    const run = recordedRun([
      { type: 'readiness-failed', data: { attempt: 1, gate: 'ga-ready-failed', step: 'configured-full-audit', detail: 'failure', recovery: null, final: false },
        records: [{ path: 'gates/ga-ready-failed/attempt.json', body: audited('ga-ready-failed') }, outcome('ga-ready-failed', 'fail')] },
      { type: 'readiness-passed', data: { attempt: 2, gate: 'ga-ready-passed' },
        records: [{ path: 'gates/ga-ready-passed/attempt.json', body: audited('ga-ready-passed') }, outcome('ga-ready-passed', 'pass')] },
    ]);
    const nodes = executionCoreOf(runView(run)).nodes;
    expect(nodes.find(node => node.key === 'gate:ga-ready-failed')).toMatchObject({ checkpoint: 'readiness', audit: 'failed', evidencePresent: true });
    expect(nodes.find(node => node.key === 'gate:ga-ready-passed')).toMatchObject({ checkpoint: 'readiness', audit: 'passed', evidencePresent: true });
  });
  it('keeps full descriptions, latest real scenario status, every gate and every session', () => {
    const run = recordedRun([
      { type: 'session-opened', data: { session: 'ses-initial', role: 'initial-architect', work: {}, executor: 'scripted', model: null } },
      { type: 'session-finished', data: { session: 'ses-initial', reason: 'replaced' } },
      { type: 'session-opened', data: { session: 'ses-local', role: 'local-architect', work: { workItem: 'work-item:case-001' }, executor: 'scripted', model: null,
        replaces: { session: 'ses-initial', reason: 'reconstructed' } } },
      { type: 'gate-attempted', data: {}, records: [{ path: 'gates/ga-unrun/attempt.json', body: gate('ga-unrun', 'passed', true) }] },
      { type: 'gate-attempted', data: {}, records: [{ path: 'gates/ga-real/attempt.json', body: gate('ga-real', 'passed', false) }] },
      { type: 'gate-attempted', data: {}, records: [{ path: 'gates/ga-later/attempt.json', body: gate('ga-later', 'failed', false) }] },
      { type: 'readiness-passed', data: {}, records: [{ path: 'gates/ga-ready/attempt.json', body: gate('ga-ready', 'passed', false, 'readiness') }] },
    ]);
    const view = runView(run);
    const index = executionCoreOf(view);
    index.nodes.forEach(node => expect(executionNodeSchema.safeParse(node).success).toBe(true));
    expect(index.runVersion).toBe(run.entries.length);
    expect(index.nodes.filter(node => node.kind === 'capability').map(node => node.key)).toEqual(['capability:full-description']);
    expect(index.nodes.filter(node => node.kind === 'session').map(node => [node.key, node.state])).toEqual([
      ['session:ses-initial', 'finished'], ['session:ses-local', 'live'],
    ]);
    expect(index.nodes.filter(node => node.kind === 'gate').map(node => node.key)).toEqual([
      'gate:ga-unrun', 'gate:ga-real', 'gate:ga-later', 'gate:ga-ready',
    ]);
    expect(index.nodes.find(node => node.key === 'scenario:case-001')).toMatchObject({ state: 'done', latestRealResult: 'failed' });
    expect(index.nodes.find(node => node.key === 'capability:full-description')).toMatchObject({ scenarios: { failed: 1, passed: 0 } });
    expect(index.nodes.find(node => node.key === 'gate:ga-later')).toMatchObject({ verdict: 'failed', audit: 'unavailable', evidencePresent: true,
      cause: 'check-failed', subject: { workItem: 'work-item:case-001', iteration: 'work-item:case-001.i01' } });
    // A readiness gate that recorded no audit reads as one that has not started its audit.
    expect(index.nodes.find(node => node.key === 'gate:ga-ready')).toMatchObject({ audit: 'not-started' });
    expect(index.gaps).toContain('Audit result for gate ga-later is unavailable: the gate retains publication refs but no overall outcome.');
    expect(index.links.some(link => link.kind === 'tracks-scenario' && link.to.key === 'scenario:case-001')).toBe(true);
    expect(executionCapabilityDetailSchema.parse(executionCapabilityDetailOf(view, 'capability:full-description')).detail).toMatchObject({
      state: 'available', description,
    });
    expect(executionScenarioDetailSchema.parse(executionScenarioDetailOf(view, 'scenario:case-001')).detail).toMatchObject({
      state: 'available', source,
    });
    expect(executionCapabilityDetailOf(view, 'missing').detail.state).toBe('unavailable');
    expect(executionScenarioDetailOf(view, 'scenario:case-999').detail.state).toBe('unavailable');
    expect(executionCoreOf(runView(run)).nodes).toEqual(index.nodes); // durable replay, no mutable cache
  });

  it('does not let a passing gate whose audit ran no scenario color it green', () => {
    const view = runView(recordedRun([{ type: 'gate-attempted', data: {}, records: [{ path: 'gates/ga-unrun/attempt.json', body: gate('ga-unrun', 'passed', true) }] }]));
    expect(executionCoreOf(view).nodes.find(node => node.key === 'scenario:case-001')).toMatchObject({ latestRealResult: 'no-real-run' });
  });

  it('enumerates beyond the existing bounded work-item list', () => {
    const workItems = Array.from({ length: 205 }, (_, index) => {
      const id = `work-item:case-${String(index + 1).padStart(3, '0')}`;
      return { path: `work-items/${id}/item.json`, body: item(id, { entry: 'capability:full-description' }) };
    });
    const view = runView(constructedRun([{ type: 'analysis-accepted', data: {}, records: [
      { path: 'analysis/entries.json', body: entries },
      { path: at('registry', 'capability:full-description'), body: registered('capability:full-description') }, ...workItems,
    ] }]));
    const index = executionCoreOf(view);
    expect(index.nodes.filter(node => node.kind === 'work-item')).toHaveLength(205);
    expect(index.nodes.filter(node => node.kind === 'work-item').at(-1)?.key).toBe('work-item:case-205');
  });

  it('keeps two accepted roots, a lower provider, ordered assignments, final and active gates', () => {
    const secondEntries = entryAssignmentsSchema.parse({ ...entries, entries: [
      ...entries.entries,
      { capability: 'second-root', capabilityId: 'capability:second-root', description: 'The second full description.', owner: reviews,
        functionalRequirementIds: [], functionalAcceptanceIds: [], contextIds: [], citations: [] },
    ] });
    const first = assignment('work-item:case-001.i01', 'work-item:case-001', 1);
    const second = assignment('work-item:case-001.i02', 'work-item:case-001', 2);
    const result = iterationResultSchema.parse({ schema: 'ramify-agent.iteration-result/1', iteration: first.id,
      outcome: 'accepted', invocations: [], gate: 'ga-first', commit: 'accepted-commit', findings: [], changedAssumptions: [], artifacts: [] });
    const run = constructedRun([
      { type: 'analysis-accepted', data: {}, records: [
        { path: 'analysis/entries.json', body: secondEntries },
        { path: at('registry', 'capability:full-description'), body: registered('capability:full-description') },
        { path: at('registry', 'capability:second-root'), body: registered('capability:second-root') },
        { path: 'work-items/wi-001/item.json', body: item('work-item:case-001', { entry: 'capability:full-description' }) },
        { path: 'work-items/wi-002/item.json', body: item('work-item:case-002', { entry: 'capability:second-root' }) },
      ] },
      { type: 'contract-registered', data: {}, records: [{ path: at('registry', 'capability:shared-provider'),
        body: registered('capability:shared-provider', { origin: 'global-decision', behavior: 'Full provider behavior.',
          owner: `${reviews}/theme`, proposed: { parent: reviews, directory: 'subs/reviews/subs/theme', purpose: 'Own the shared theme.', tags: [] } }) }] },
      { type: 'iteration-assigned', data: {}, records: [{ path: 'work-items/wi-001/iterations/01/assignment.json', body: first }] },
      { type: 'iteration-closed', data: {}, records: [{ path: 'work-items/wi-001/iterations/01/result.json', body: result }] },
      { type: 'iteration-assigned', data: {}, records: [{ path: 'work-items/wi-001/iterations/02/assignment.json', body: second }] },
      { type: 'gate-attempted', data: {}, records: [{ path: 'gates/ga-final/attempt.json', body: gate('ga-final', 'passed', false, 'final') }] },
      { type: 'gate-committing', data: { gate: 'ga-running', checkpoint: 'iteration' } },
    ]);
    const view = runView(run);
    const index = executionCoreOf(view);
    expect(index.nodes.filter(node => node.kind === 'capability').map(node => [node.key, node.level])).toEqual([
      ['capability:full-description', 'entry'], ['capability:second-root', 'entry'], ['capability:shared-provider', 'lower'],
    ]);
    // A capability is labelled with its id as registered, never a title made from it, and carries its registered behavior.
    expect(index.nodes.find(node => node.key === 'capability:shared-provider')).toMatchObject({
      label: 'capability:shared-provider', behavior: 'Full provider behavior.',
      owner: `${reviews}/theme`, proposed: { parent: reviews, directory: 'subs/reviews/subs/theme' },
    });
    expect(index.nodes.filter(node => node.kind === 'iteration').map(node => [node.key, node.ordinal, node.outlineRevision, node.state, node.module])).toEqual([
      ['iteration:case-001.i01', 1, 1, 'completed', reviews], ['iteration:case-001.i02', 2, 2, 'assigned', reviews],
    ]);
    expect(index.nodes.find(node => node.key === 'iteration:case-001.i02')).toMatchObject({ scopeExceptions: [{ path: 'subs/reviews/src/assignment-2.ts', purpose: 'contract' }] });
    expect(index.nodes.filter(node => node.kind === 'gate').map(node => [node.key, node.active, node.verdict])).toEqual([
      ['gate:ga-final', false, 'passed'], ['gate:ga-running', true, null],
    ]);
    expect(executionCapabilityDetailOf(view, 'capability:shared-provider').detail).toMatchObject({ state: 'available', level: 'lower', description: 'Full provider behavior.' });
  });
});
