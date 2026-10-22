import { describe, expect, it } from 'vitest';
import { contractRecordSchema, providerObligationSchema, consumerRequirementSchema } from '../../../autonomous/subs/work-coordination/src/contracts/records.js';
import { executionCoreOf } from '../execution-map.js';
import { runView } from '../inputs.js';
import { entryAssignmentsSchema } from '../../../autonomous/subs/planning/src/records.js';
import { gateAttemptSchema } from '../../../autonomous/subs/acceptance/src/gate-records.js';
import { at, constructedRecord, constructedRun, hash, item, obligation, registered, requirement, reviews, type Line } from '../../../../src/tests/helpers/constructed.js';

const provider = 'capability:shared-provider';
const first = 'capability:first-consumer';
const second = 'capability:second-consumer';
const contractId = 'contract:shared';
const firstRequirement = 'consumer-requirement:first';
const secondRequirement = 'consumer-requirement:second';

function contract(revision: number, mode: 'fake-backed' | 'access-only' = 'fake-backed') {
  return contractRecordSchema.parse({
    schema: 'ramify-agent.contract/3', id: contractId, revision,
    capability: { id: provider, revision: 1, hash }, decision: null,
    authority: { kind: 'provider', owner: reviews, rationale: 'Provider owns the behavior.' },
    provider: reviews, behavior: 'Shared behavior.', mode,
    artifacts: { interface: [], conformance: [], fake: [], exposure: [] },
    establishedBy: { iteration: 'work-item:first.i01', gate: 'ga-contract' },
  });
}

const entries = entryAssignmentsSchema.parse({
  schema: 'ramify-agent.entry-assignments/2', view: { status: 'placeholder' },
  entries: [first, second].map(capability => ({
    capability: capability.slice('capability:'.length), capabilityId: capability, description: `The ${capability} entry.`, owner: reviews,
    functionalRequirementIds: [], functionalAcceptanceIds: [], contextIds: [], citations: [],
  })),
});

function base(): Line[] {
  return [
    { type: 'analysis-accepted', data: {}, records: [
      { path: 'analysis/entries.json', body: entries },
      { path: at('registry', first), body: registered(first, { consumers: [{ capability: provider, workItem: 'work-item:provider' }] }) },
      { path: at('registry', second), body: registered(second) },
      { path: at('registry', provider), body: registered(provider, {
        origin: 'global-decision', consumers: [{ capability: first, workItem: 'work-item:first' }, { capability: second, workItem: 'work-item:second' }],
      }) },
      { path: at('work', 'work-item:first'), body: item('work-item:first', { entry: first }) },
      { path: at('work', 'work-item:second'), body: item('work-item:second', { entry: second }) },
      { path: at('work', 'work-item:provider'), body: item('work-item:provider', { obligation: { id: 'provider-obligation:shared', revision: 1, hash } }) },
    ] },
    { type: 'contract-registered', data: {
      contract: contractId, revision: 1, mode: 'fake-backed', iteration: 'work-item:first.i01',
      obligation: 'provider-obligation:shared', requirements: [firstRequirement, secondRequirement], providerWorkItem: 'work-item:provider',
    }, records: [
      { path: at('contracts', contractId), body: contract(1) },
      { path: at('obligations', 'provider-obligation:shared'), body: obligation(contractId, provider) },
      { path: at('requirements', firstRequirement), body: requirement(firstRequirement, 'work-item:first', first, contractId) },
      { path: at('requirements', secondRequirement), body: requirement(secondRequirement, 'work-item:second', second, contractId) },
    ] },
  ];
}

function projected(extra: Line[] = []) {
  return executionCoreOf(runView(constructedRun([...base(), ...extra])));
}

function node(index: ReturnType<typeof projected>, key: string) {
  return index.nodes.find(candidate => candidate.key === key);
}

describe('execution map causal projection', () => {
  it('projects a descriptive contract through its recorded obligation relationship after reload', () => {
    const providerId = 'capability:provide-preview';
    const consumerId = 'capability:use-preview';
    const agreementId = 'contract:preview-resolution';
    const obligationId = 'provider-obligation:provide-preview';
    const requirementId = 'consumer-requirement:use-preview';
    const descriptiveEntries = entryAssignmentsSchema.parse({ schema: 'ramify-agent.entry-assignments/2',
      view: { status: 'placeholder' }, entries: [providerId, consumerId].map(capability => ({
        capability: capability.slice('capability:'.length), capabilityId: capability, description: capability, owner: reviews,
        functionalRequirementIds: [], functionalAcceptanceIds: [], contextIds: [], citations: [],
      })) });
    const agreement = contractRecordSchema.parse({ ...contract(1), schema: 'ramify-agent.contract/3', id: agreementId,
      capability: { id: providerId, revision: 1, hash } });
    const providerObligation = providerObligationSchema.parse({ schema: 'ramify-agent.provider-obligation/2',
      id: obligationId, revision: 1, contract: { id: agreementId, revision: 1, hash }, capability: providerId,
      provider: reviews, behavior: 'Provide preview resolution.', evidence: { conformance: [], against: 'real' } });
    const consumerRequirement = consumerRequirementSchema.parse({ schema: 'ramify-agent.consumer-requirement/2',
      id: requirementId, revision: 1, workItem: 'work-item:use-preview', consumer: reviews,
      forCapability: consumerId, obligation: obligationId, contractRevision: 1, behavior: 'Use preview resolution.',
      evidence: { tests: { policy: 'owned-by-scope', exactOwners: [reviews], subtrees: [], extraSuites: [] }, fakeInjections: [] } });
    const run = constructedRun([
      { type: 'analysis-accepted', data: {}, records: [
        { path: 'analysis/entries.json', body: descriptiveEntries },
        { path: at('registry', providerId), body: registered(providerId, { schema: 'ramify-agent.capability/2' }) },
        { path: at('registry', consumerId), body: registered(consumerId, { schema: 'ramify-agent.capability/2' }) },
      ] },
      { type: 'contract-registered', data: { contract: agreementId, revision: 1, mode: 'fake-backed',
        iteration: 'work-item:first.i01', obligation: obligationId, requirements: [requirementId], providerWorkItem: null },
      records: [{ path: at('contracts', agreementId), body: agreement },
        { path: at('obligations', obligationId), body: providerObligation },
        { path: at('requirements', requirementId), body: consumerRequirement }] },
    ], constructedRecord());
    const index = executionCoreOf(runView(run));
    expect(index.gaps).toEqual([]);
    expect(node(index, agreementId)).toMatchObject({ state: 'working' });
    expect(node(index, requirementId)).toMatchObject({
      contract: agreementId, provider: providerId, state: 'working',
    });
    expect(index.links).toEqual(expect.arrayContaining([expect.objectContaining({ kind: 'verification-of',
      from: { coverage: 'shown', key: requirementId },
      to: { coverage: 'shown', key: agreementId } })]));
  });

  it('closes an access-only agreement at registration without inventing provider work', () => {
    const run = constructedRun([
      { type: 'analysis-accepted', data: {}, records: [
        { path: 'analysis/entries.json', body: entries },
        { path: at('registry', provider), body: registered(provider) },
      ] },
      { type: 'contract-registered', data: { contract: contractId, revision: 1, mode: 'access-only',
        iteration: 'work-item:first.i01', obligation: null, requirements: [], providerWorkItem: null },
      records: [{ path: at('contracts', contractId), body: contract(1, 'access-only') }] },
    ]);
    const index = executionCoreOf(runView(run));
    expect(node(index, contractId)).toMatchObject({ mode: 'access-only', state: 'conformed' });
    expect(index.nodes.some(candidate => candidate.kind === 'requirement' || candidate.kind === 'work-item')).toBe(false);
  });

  it('keeps one provider and separate current consumer verification stages, then reopens only current revisions', () => {
    const registered = projected();
    expect(registered.nodes.filter(candidate => candidate.key === provider)).toHaveLength(1);
    expect(node(registered, firstRequirement)).toMatchObject({ state: 'working', providerStage: 'not-started', provider: provider });
    expect(registered.links.filter(link => link.kind === 'provider-for' && link.from.key === provider)).toHaveLength(2);
    const providerWorking = projected([{ type: 'work-item-started', data: { workItem: 'work-item:provider', module: reviews, origin: 'obligation' } }]);
    expect(node(providerWorking, firstRequirement)).toMatchObject({ state: 'working', providerStage: 'working' });
    const conformed: Line = { type: 'provider-conformed', data: { obligation: 'provider-obligation:shared', revision: 1,
      workItem: 'work-item:provider', iteration: 'work-item:provider.i01', gate: 'ga-provider' } };
    const verified: Line = { type: 'requirement-verified', data: { requirement: firstRequirement, revision: 1,
      workItem: 'work-item:first', iteration: 'work-item:first.i01', gate: 'ga-first' } };
    const beforeReopen = projected([conformed, verified]);
    expect(node(beforeReopen, firstRequirement)).toMatchObject({ state: 'verified', verifiedRevision: 1, providerStage: 'conformed' });
    expect(node(beforeReopen, secondRequirement)).toMatchObject({ state: 'provider-conformed', verifiedRevision: null, providerStage: 'conformed' });
    expect(beforeReopen.links.filter(link => link.kind === 'depends-on' &&
      link.from.key === first && link.to.key === provider)).toHaveLength(1);
    expect(beforeReopen.links.some(link => link.kind === 'depends-on' &&
      link.from.key === provider && link.to.key === first)).toBe(true);
    const reopened = projected([conformed, verified, { type: 'evidence-reopened', data: {
      cause: 'changed interface', contract: contractId, revision: 2, iteration: 'work-item:first.i02',
      obligation: 'provider-obligation:shared', requirements: [firstRequirement, secondRequirement], bindings: [], followUps: [], superseded: [],
    }, records: [
      { path: at('contracts', contractId, 2), body: contract(2) },
      { path: at('obligations', 'provider-obligation:shared', 2), body: obligation(contractId, provider, 2) },
      { path: at('requirements', firstRequirement, 2), body: requirement(firstRequirement, 'work-item:first', first, contractId, 2) },
      { path: at('requirements', secondRequirement, 2), body: requirement(secondRequirement, 'work-item:second', second, contractId, 2) },
    ] }]);
    expect(node(reopened, firstRequirement)).toMatchObject({ state: 'reopened', currentRevision: 2, verifiedRevision: 1, providerStage: 'not-started' });
    expect(node(reopened, secondRequirement)).toMatchObject({ state: 'working', currentRevision: 2, verifiedRevision: null, providerStage: 'not-started' });
    expect(node(reopened, first)).toMatchObject({ directRequirements: { verified: 0 } });
  });

  it('shows a readiness gate only after a start event and clears Now on its recorded ending', () => {
    const old = projected();
    expect(old.current).toEqual({ awaitedSession: null, runningGate: null, source: null });
    const running = projected([{ type: 'gate-started', data: { gate: 'ga-readiness', checkpoint: 'readiness' } }]);
    expect(node(running, 'gate:ga-readiness')).toMatchObject({ active: true, verdict: null, audit: 'not-started' });
    expect(running.current.runningGate).toBe('gate:ga-readiness');
    const ended = projected([
      { type: 'gate-started', data: { gate: 'ga-readiness', checkpoint: 'readiness' } },
      { type: 'readiness-failed', data: { attempt: 1, gate: 'ga-readiness', step: 'baseline-tests', detail: 'failure', recovery: null, final: true } },
    ]);
    expect(ended.current.runningGate).toBeNull();
  });

  it('names the command a running gate started last, and nothing once the gate ended', () => {
    const started = { type: 'gate-started', data: { gate: 'ga-readiness', checkpoint: 'readiness' } } as const;
    const command = (position: number, kind: 'configured' | 'type-check') =>
      ({ type: 'gate-command-started', data: { gate: 'ga-readiness', checkpoint: 'readiness', kind, position, total: 4 } }) as const;
    const waiting = projected([started]);
    expect(waiting.current.gateCommand).toBeUndefined();
    const running = projected([started, command(1, 'configured'), command(2, 'type-check')]);
    expect(running.current.runningGate).toBe('gate:ga-readiness');
    expect(running.current.gateCommand).toMatchObject({ kind: 'type-check', position: 2, total: 4 });
    expect(running.current.gateCommand?.source.sequence).toBe(running.runVersion);
    const queued = projected([started, { type: 'gate-command-waiting', data: {
      gate: 'ga-readiness', checkpoint: 'readiness', kind: 'configured', position: 3, total: 4,
      line: 'Waiting for another test run (fixture)',
    } }]);
    expect(queued.current.gateCommand).toMatchObject({ kind: 'configured', waitingLine: 'Waiting for another test run (fixture)', position: 3 });
    const ended = projected([started, command(1, 'configured'),
      { type: 'readiness-failed', data: { attempt: 1, gate: 'ga-readiness', step: 'configured-full-audit', detail: 'failure', recovery: null, final: true } }]);
    expect(ended.current).toEqual({ awaitedSession: null, runningGate: null, source: null });
  });

  it('keeps failed and repaired attempts as separate cards with a typed repair edge', () => {
    const gate = (id: string, repairRound: number, verdict: 'failed' | 'passed') => gateAttemptSchema.parse({
      schema: 'ramify-agent.gate-attempt/3', id, checkpoint: 'iteration',
      subject: { workItem: 'work-item:first', iteration: `work-item:first.i0${repairRound + 1}` }, proposedBy: null,
      repairRound, infrastructureAttempt: 0, head: 'head', commit: null, audited: null, evidence: null,
      guardedChanges: [], commands: [], verdict, cause: verdict === 'failed' ? 'check-failed' : null,
      next: verdict === 'failed' ? 'repair' : 'accept',
    });
    const index = projected([
      { type: 'gate-attempted', data: { gate: 'ga-failed', checkpoint: 'iteration', verdict: 'failed', next: 'repair' },
        records: [{ path: 'gates/ga-failed/attempt.json', body: gate('ga-failed', 0, 'failed') }] },
      { type: 'gate-attempted', data: { gate: 'ga-repaired', checkpoint: 'iteration', verdict: 'passed', next: 'accept' },
        records: [{ path: 'gates/ga-repaired/attempt.json', body: gate('ga-repaired', 1, 'passed') }] },
    ]);
    expect(index.nodes.filter(candidate => candidate.kind === 'gate')).toHaveLength(2);
    expect(index.links.find(link => link.kind === 'repair-of')).toMatchObject({
      from: { key: 'gate:ga-repaired' }, to: { key: 'gate:ga-failed' },
    });
  });
});
