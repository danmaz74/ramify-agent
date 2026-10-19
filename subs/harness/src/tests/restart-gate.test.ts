import { expect, test, vi } from 'vitest';
import { CommittingGates, type GateHost, type GateRun } from '../../subs/autonomous/src/run/committing-gate.js';
import { gateAttemptSchema } from '../../subs/autonomous/src/run/records.js';
import { defaultRunPolicy } from '../run/policy.js';
import { constructedRecord, constructedRun } from './helpers/constructed.js';
import type { WorkItem } from '../../subs/autonomous/subs/work-coordination/src/work/records.js';

test.each([true, false])('restored gate reuse requires current evidence applicability (applicable=%s)', async applicable => {
  const old = gateAttemptSchema.parse({ schema: 'ramify-agent.gate-attempt/3', id: 'ga-0001', checkpoint: 'work-item', subject: { workItem: 'wi-001' },
    proposedBy: 'inv-0001', repairRound: 0, infrastructureAttempt: 0, head: 'accepted', commit: 'accepted', audited: 'accepted', evidence: null,
    guardedChanges: [], commands: [], verdict: 'passed', cause: null, next: 'accept' });
  const entries = constructedRun([{ type: 'gate-attempted', data: { gate: old.id, checkpoint: 'work-item', verdict: 'passed', next: 'accept' },
    records: [{ path: 'gates/ga-0001/attempt.json', body: old }] }], constructedRecord()).entries;
  const event = { ...entries[0]!.transaction.event, sequence: -1 };
  const candidate = vi.fn(async () => ({ tree: 'candidate' }));
  const commitTree = vi.fn(async () => 'candidate');
  const host = { evidenceApplicable: () => applicable, previewCandidateTree: candidate, candidates: { commitTree },
    projectRoot: '/scripted', git: { currentHead: async () => 'accepted' }, afterWrite: async () => {}, ignoring: () => false } as unknown as GateHost<GateRun>;
  const run = { jobId: 'successor', planId: 'plan', policy: defaultRunPolicy({ projectRoot: '/scripted' }), writer: { requireSettled() {} },
    path: (path: string) => `/records/${path}`, log: { ledger: { replay: () => entries }, all: () => [event], count: () => 0 } } as unknown as GateRun;
  const gates = new CommittingGates(host);
  const fresh = { ...old, id: 'ga-0002' };
  const qualify = vi.spyOn(gates, 'committingCheckpoint').mockResolvedValue(fresh);
  expect(await gates.workItemGate(run, { id: 'wi-001' } as WorkItem, 'inv-0001', 0, 'Completion', undefined, true)).toEqual(applicable ? old : fresh);
  if (applicable) { expect(qualify).not.toHaveBeenCalled(); expect(commitTree).toHaveBeenCalledOnce(); }
  else { expect(qualify).toHaveBeenCalledOnce(); expect(candidate).not.toHaveBeenCalled(); }
});
