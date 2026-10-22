import { expect, test } from 'vitest';
import { runEventSchema, type RunEvent } from '../../../autonomous/src/run/log.js';
import { runEventRefKindSchema } from '../../../../src/interfaces/protocol/runs.js';
import { projectEvent } from '../events.js';

const hash64 = 'a'.repeat(64);

test('every reference kind of a projected event has a producer among the run log\'s events', () => {
  const r = { id: 'provider-obligation:source-fact', revision: 1, hash: hash64 };
  const events: Array<[RunEvent['type'], unknown]> = [
    ['repair-incident-recorded', { incidentId: 'apr-0001', revision: 1, stage: 'admitted' }],
    ['repair-export-recorded', { incidentId: 'apr-0001', revision: 2, state: 'exported' }],
    ['placement-requested', { request: 'placement-request:source-fact', workItem: 'work-item:cart', requester: 'm', capability: 'capability:cart' }],
    ['decision-accepted', { request: 'placement-request:source-fact', decision: 'placement-decision:placement-source-fact', workItem: 'work-item:cart', invocation: 'inv-0002', registry: 0, hypotheses: 0 }],
    ['iteration-closed', { workItem: 'work-item:cart', iteration: 'work-item:cart.i01', outcome: 'accepted', gate: 'ga-0001', commit: 'abc', notices: [] }],
    ['contract-registered', { contract: 'contract:source-fact', revision: 1, mode: 'fake-backed', iteration: 'work-item:cart.i02', obligation: 'provider-obligation:source-fact', requirements: ['consumer-requirement:source-fact'], providerWorkItem: 'work-item:checkout' }],
    ['invocation-started', { invocation: 'inv-0001', role: 'engineer', session: 'ses-0001', work: {}, start: 'opened' }],
    ['revision-needed', { obligation: r, iteration: 'work-item:checkout.i01', consumerWorkItem: 'work-item:cart' }],
    ['obligation-reported', { id: 'scenario:source-fact', judgment: 'done', basedOnRevision: 0, revision: 1, by: 'inv-0003', submission: hash64 }],
    ['capability-requested', { request: 'capability-request:source-fact', parent: 'work-item:cart', assignment: 'work-item:cart.i01', invocation: 'inv-0003' }],
    ['capability-delegated', { task: 'capability-task:source-fact', request: 'capability-request:source-fact', parent: 'work-item:cart', invocation: 'inv-0003', planRevision: 1 }],
    ['capability-assigned', { task: 'capability-task:source-fact', assignment: 'capability-task:source-fact.i01', sequence: 1, invocation: 'inv-0004' }],
  ];
  const kinds = new Set(events.flatMap(([type, data], index) =>
    projectEvent(runEventSchema.parse({ sequence: index + 1, jobId: '20260920T101500Z-3f9a1c', at: '2026-09-20T10:15:00.000Z', type, data })).refs.map(ref => ref.kind)));
  expect([...kinds].sort()).toEqual([...runEventRefKindSchema.options].sort());
});
