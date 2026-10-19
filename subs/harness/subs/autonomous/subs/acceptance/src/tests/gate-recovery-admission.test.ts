import { gateFixturePorts, type GateFixture, type FixtureGateHost } from './helpers/gate-ports.js';
import { expect, test, vi } from 'vitest';
import { CommittingGates } from '../committing-gate.js';
import type { GateAttempt } from '../checks/records.js';
import { defaultRunPolicy } from '../../../../../../src/run/policy.js';
import type { CheckpointRequest } from '../gates.js';

test.each([true, false])('a peer recovery barrier admits no gate effects before release (continue=%s)', async proceed => {
  let reached!: () => void, release!: (value: boolean) => void;
  const waiting = new Promise<void>(resolve => { reached = resolve; });
  const permission = new Promise<boolean>(resolve => { release = resolve; });
  const policy = defaultRunPolicy({ projectRoot: '/scripted-project' });
  const run = { jobId: 'run', planId: 'plan', policy,
    log: { ledger: { replay: () => [] }, all: () => [] } } as unknown as GateFixture;
  const host = { awaitGateAdmission: async () => { reached(); return permission; }, ignoring: () => false } as unknown as FixtureGateHost;
  const gates = new CommittingGates(gateFixturePorts(run, host));
  const candidate = { schema: 'ramify-agent.gate-attempt/3', id: 'ga-0001', checkpoint: 'final', subject: {}, proposedBy: null,
    repairRound: 0, infrastructureAttempt: 0, head: 'retained-head', commit: null, audited: 'retained-head', evidence: null,
    guardedChanges: [], commands: [], verdict: 'passed', cause: null, next: 'accept' } as GateAttempt;
  const internal = gates as unknown as { committingCheckpointAttempt(request: CheckpointRequest): Promise<GateAttempt> };
  const effect = vi.spyOn(internal, 'committingCheckpointAttempt').mockResolvedValue(candidate);
  const result = gates.committingCheckpoint({ id: candidate.id, runId: run.jobId, checkpoint: 'final', projectRoot: '/scripted-project',
    directory: '/records/ga-0001', head: 'retained-head', policy });
  // Attach the rejection observer before releasing the blocked operation.
  const settled = result.then(value => ({ value }), error => ({ error: error as Error }));
  await waiting;
  expect(effect).not.toHaveBeenCalled();
  release(proceed);
  const outcome = await settled;
  if (proceed) {
    expect(outcome).toEqual({ value: candidate });
    expect(effect).toHaveBeenCalledOnce();
  } else {
    expect(outcome).toMatchObject({ error: { message: 'Gate admission stopped before any commit or check effect' } });
    expect(effect).not.toHaveBeenCalled();
  }
});
