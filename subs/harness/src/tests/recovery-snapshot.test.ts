import { expect, test } from 'vitest';
import { runSnapshotSchema } from '../interfaces/protocol/runs.js';
import { runSnapshot } from '../run/snapshot.js';
import { RunQueries } from '../../subs/projections/src/queries.js';
import type { CommittedRun } from '../../subs/projections/src/inputs.js';
import { constructedRecord, constructedRun, type Line } from './helpers/constructed.js';

const waiting: Line[] = [
  { type: 'operation-recovery-pausing', data: { occurrenceId: 'opr-0001', revision: 1 } },
  { type: 'operation-recovery-paused', data: { occurrenceId: 'opr-0001', revision: 2 } },
];

async function snapshot(run: CommittedRun) {
  const queries = new RunQueries({ projectRoot: '/nonexistent', agentName: undefined,
    committed: () => run, committedRuns: () => [run], runVersions: () => [] });
  return (await queries.run(run.record.planId, run.record.jobId)).run;
}

test('snapshot exposes settling and paused recovery independently of the ordinary pending phase', async () => {
  const record = constructedRecord();
  for (const [length, state] of [[1, 'pausing'], [2, 'paused']] as const) {
    const run = constructedRun(waiting.slice(0, length), record);
    const internal = runSnapshot(record, run.entries.map(line => line.transaction.event));
    expect(internal.phase).toBe('analysis');
    expect(internal.recovery).toEqual({ occurrenceId: 'opr-0001', revision: length, state });
    expect(runSnapshotSchema.parse(await snapshot(run)).recovery).toEqual(internal.recovery);
  }
});

test('resume and stop clear recovery visibility while historical snapshots retain absent state', async () => {
  const resumed = constructedRun([...waiting, { type: 'operation-recovery-resumed', data: { occurrenceId: 'opr-0001', revision: 3, group: 1,
    command: { commandId: 'resume-1', expectedVersion: 0, type: 'resume-recovery', payload: {} } } }]);
  expect((await snapshot(resumed)).recovery).toBeNull();
  const stopped = constructedRun([...waiting, { type: 'job-stopped', data: {} }]);
  expect(await snapshot(stopped)).toMatchObject({ state: 'stopped', phase: 'ended', recovery: null });
  expect((await snapshot(constructedRun([]))).recovery).toBeNull();
});
