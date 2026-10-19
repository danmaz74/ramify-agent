import { expect, test } from 'vitest';
import { runEventSchema, type RunEvent } from '../../../autonomous/src/run/log.js';
import { runEventRefKindSchema } from '../../../../src/interfaces/protocol/runs.js';
import { projectEvent } from '../events.js';

const hash64 = 'a'.repeat(64);

test('every reference kind of a projected event has a producer among the run log\'s events', () => {
  const r = { id: 'x', revision: 1, hash: hash64 };
  const events: Array<[RunEvent['type'], unknown]> = [
    ['repair-incident-recorded', { incidentId: 'apr-0001', revision: 1, stage: 'admitted' }],
    ['repair-export-recorded', { incidentId: 'apr-0001', revision: 2, state: 'exported' }],
    ['placement-requested', { request: 'pr-001', workItem: 'wi-001', requester: 'm', capability: 'c' }],
    ['decision-accepted', { request: 'pr-001', decision: 'gd-001', workItem: 'wi-001', invocation: 'inv-0002', registry: 0, hypotheses: 0 }],
    ['iteration-closed', { workItem: 'wi-001', iteration: 'wi-001.i01', outcome: 'accepted', gate: 'ga-0001', commit: 'abc', notices: [] }],
    ['contract-registered', { contract: 'ct-001', revision: 1, mode: 'fake-backed', iteration: 'wi-001.i02', obligation: 'ob-ct-001', requirements: ['rq-001'], providerWorkItem: 'wi-002' }],
    ['invocation-started', { invocation: 'inv-0001', role: 'engineer', session: 'ses-0001', work: {}, start: 'opened' }],
    ['revision-needed', { obligation: r, iteration: 'wi-002.i01', consumerWorkItem: 'wi-001' }],
    ['obligation-reported', { id: 'sc-001', judgment: 'done', basedOnRevision: 0, revision: 1, by: 'inv-0003', submission: hash64 }],
    ['capability-requested', { request: 'need-001', parent: 'wi-001', assignment: 'wi-001.i01', invocation: 'inv-0003' }],
    ['capability-delegated', { task: 'cap-001', request: 'need-001', parent: 'wi-001', invocation: 'inv-0003', planRevision: 1 }],
    ['capability-assigned', { task: 'cap-001', assignment: 'cap-001.i01', sequence: 1, invocation: 'inv-0004' }],
  ];
  const kinds = new Set(events.flatMap(([type, data], index) =>
    projectEvent(runEventSchema.parse({ sequence: index + 1, jobId: '20260920T101500Z-3f9a1c', at: '2026-09-20T10:15:00.000Z', type, data })).refs.map(ref => ref.kind)));
  expect([...kinds].sort()).toEqual([...runEventRefKindSchema.options].sort());
});
