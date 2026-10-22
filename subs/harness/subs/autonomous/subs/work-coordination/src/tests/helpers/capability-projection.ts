import { constructedRun, registered, hash, type Line } from '../../../../../../../src/tests/helpers/constructed.js';
import { fixturePlan, fixtureRequest, fixtureTask } from './capability.js';
import { invocationSchema } from '../../../../../../task-execution/src/records.js';
import type { GateAttempt } from '../../../../acceptance/src/checks/records.js';
import type { CommittedRun } from '../../../../../../projections/src/inputs.js';

export function capabilityProjectionLines(): Line[] {
  const request = fixtureRequest();
  const task = fixtureTask(request);
  const plan = fixturePlan(request, task);
  return [
    { type: 'capability-requested' as const, data: { request: request.id, parent: 'work-item:format-fact', assignment: request.assignment,
      invocation: request.invocation }, records: [{ path: 'requests/capability-request:format-fact.json', body: request }] },
    { type: 'capability-delegated' as const, data: { task: task.id, request: request.id, parent: 'work-item:format-fact',
      invocation: 'inv-0002', planRevision: 1 }, records: [
      { path: 'tasks/capability-task:provide-fact.json', body: task }, { path: 'plans/capability-task:provide-fact/1.json', body: plan },
      { path: 'registry/similar.json', body: registered('capability:format-b-fact') },
    ] },
    { type: 'capability-exchange-opened' as const, data: { task: task.id, exchange: 'capability-exchange:source-question', invocation: 'inv-0002' }, records: [
      { path: 'exchanges/capability-exchange:source-question/1.json', body: { schema: 'ramify-agent.capability-exchange/2', id: 'capability-exchange:source-question', task: task.id,
        request: request.id, planRevision: 1, question: 'Which source must A show?', references: ['subs/a/src/caller.ts'], answer: null } },
    ] },
    { type: 'capability-exchange-answered' as const, data: { task: task.id, exchange: 'capability-exchange:source-question', invocation: 'inv-0003' }, records: [
      { path: 'exchanges/capability-exchange:source-question/2.json', body: { schema: 'ramify-agent.capability-exchange/2', id: 'capability-exchange:source-question', task: task.id,
        request: request.id, planRevision: 1, question: 'Which source must A show?', references: ['subs/a/src/caller.ts'],
        answer: { invocation: 'inv-0003', text: 'Show B source metadata', objections: [] } } },
    ] },
    { type: 'invocation-started' as const, data: { invocation: 'inv-0004', role: 'capability-architect', session: 'ses-0002',
      work: { capabilityTask: task.id, request: request.id }, start: 'continued' }, records: [{ path: 'invocations/inv-0004/invocation.json',
      body: invocationSchema.parse({ schema: 'ramify-agent.invocation/1', id: 'inv-0004', role: 'capability-architect',
        work: { capabilityTask: task.id, request: request.id }, attempt: 2,
        session: { requested: 'continued', actual: 'continued', ref: '' },
        prompt: { package: 'capability-architect', hash, inputsHash: hash },
        scope: { write: null, measurement: null, size: null }, writer: false,
        base: 'abc', startedAt: '2026-09-21T08:00:00.000Z' }) }] },
    { type: 'gate-attempted' as const, data: { gate: 'ga-0001', checkpoint: 'work-item', verdict: 'failed', next: 'repair' },
      records: [{ path: 'gates/ga-0001/attempt.json', body: failedTaskGate }] },
  ];
}

/** The task's completion gate, proposed by its coordinator, failing a real test. */
const failedTaskGate: GateAttempt = {
  schema: 'ramify-agent.gate-attempt/3', id: 'ga-0001', checkpoint: 'work-item', subject: { workItem: 'capability-task:provide-fact' }, proposedBy: 'inv-0004',
  repairRound: 0, infrastructureAttempt: 0, head: 'abc', commit: null, audited: null, evidence: null, guardedChanges: [],
  commands: [], verdict: 'failed', cause: 'check-failed', next: 'repair',
};

/** The original registry/contract-only fixture, shared by decoding and public answers. */
export function capabilityContractRun(): CommittedRun {
  const contract = { schema: 'ramify-agent.contract/3', id: 'contract:format-b-fact', revision: 1,
    capability: { id: 'capability:format-b-fact', revision: 1, hash }, decision: null,
    authority: { kind: 'provider', owner: 'collection-review/workspace/reviews', rationale: 'Provider owns the interface' },
    provider: 'collection-review/workspace/reviews', behavior: 'Format a B fact', mode: 'fake-backed',
    artifacts: { interface: [{ path: 'subs/reviews/src/interfaces/fact.ts', exports: ['Fact'], hash }],
      conformance: [{ path: 'subs/reviews/src/tests/fact.test.ts', hash }],
      fake: [{ path: 'subs/reviews/src/fakes/fact.fake.ts', exports: ['createFactFake'], hash,
        standsFor: [{ fake: 'createFactFake', path: 'subs/reviews/src/fact.ts', export: 'createFact',
          exposure: { to: [], reexposed: [] } }] }], exposure: [] },
    establishedBy: { iteration: 'work-item:format-fact.i01', gate: 'ga-001' } };
  const run = constructedRun([{ type: 'job-started', data: {} },
    { type: 'analysis-accepted', data: {}, records: [{ path: 'registry/format-b-fact.json', body: registered('capability:format-b-fact') }] },
    { type: 'contract-registered', data: {}, records: [{ path: 'contracts/contract:format-b-fact.json', body: contract }] }]);
  return run;
}
