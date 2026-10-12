import { expect, test } from 'vitest';
import { runSnapshotSchema } from '../interfaces/protocol/runs.js';
import { runSnapshot } from '../run/snapshot.js';
import { snapshotOf } from '../projections/snapshot.js';
import { runView } from '../projections/inputs.js';
import { constructedRecord, constructedRun, type Line } from './helpers/constructed.js';

const waiting: Line[] = [
  { type: 'operation-recovery-pausing', data: { occurrenceId: 'opr-0001', revision: 1 } },
  { type: 'operation-recovery-paused', data: { occurrenceId: 'opr-0001', revision: 2 } },
];

test('snapshot exposes settling and paused recovery independently of the ordinary pending phase', () => {
  const record = constructedRecord();
  for (const [length, state] of [[1, 'pausing'], [2, 'paused']] as const) {
    const view = runView(constructedRun(waiting.slice(0, length), record));
    const internal = runSnapshot(record, view.events);
    expect(internal.phase).toBe('analysis');
    expect(internal.recovery).toEqual({ occurrenceId: 'opr-0001', revision: length, state });
    expect(runSnapshotSchema.parse(snapshotOf(view)).recovery).toEqual(internal.recovery);
  }
});

test('resume and stop clear recovery visibility while historical snapshots retain absent state', () => {
  const resumed = runView(constructedRun([...waiting, { type: 'operation-recovery-resumed', data: { occurrenceId: 'opr-0001', revision: 3, group: 1,
    command: { commandId: 'resume-1', expectedVersion: 0, type: 'resume-recovery', payload: {} } } }]));
  expect(snapshotOf(resumed).recovery).toBeNull();
  const stopped = runView(constructedRun([...waiting, { type: 'job-stopped', data: {} }]));
  expect(snapshotOf(stopped)).toMatchObject({ state: 'stopped', phase: 'ended', recovery: null });
  expect(snapshotOf(runView(constructedRun([]))).recovery).toBeNull();
});
