import { expect, test } from 'vitest';
import { runEventSchema } from '../../../../src/run/log.js';
import { projectEvent } from '../events.js';

test('the materialization summaries agree in number with their feature files', () => {
  const summary = (type: 'scenarios-materializing' | 'scenarios-materialized', files: string[]) => projectEvent(runEventSchema.parse({
    sequence: 1, jobId: '20260920T101500Z-3f9a1c', at: '2026-09-20T10:15:00.000Z', type, data: type === 'scenarios-materialized' ? { commit: 'c', files } : { files } })).summary;
  const one = ['src/tests/features/p/e.feature'];
  const two = [...one, 'src/tests/features/p/f.feature'];
  expect(summary('scenarios-materializing', one)).toBe('The feature file of the plan\'s scenarios is being written onto the run branch');
  expect(summary('scenarios-materialized', one)).toBe('The feature file of the plan\'s scenarios is on the run branch');
  expect(summary('scenarios-materializing', two)).toBe('The 2 feature files of the plan\'s scenarios are being written onto the run branch');
  expect(summary('scenarios-materialized', two)).toBe('The 2 feature files of the plan\'s scenarios are on the run branch');
});

test('a kept session whose invocation retained no point is not reported as simply kept', () => {
  const summary = (data: Record<string, unknown>) => projectEvent(runEventSchema.parse({ sequence: 1, jobId: '20260920T101500Z-3f9a1c', at: '2026-09-20T10:15:00.000Z', type: 'invocation-ended',
    data: { invocation: 'inv-0004', ended: 'submitted', submission: null, session: 'ses-0004', kept: true, ...data } })).summary;
  expect(summary({})).toBe('Invocation inv-0004 ended: submitted; session ses-0004 is kept');
  expect(summary({ pointRetained: false })).toBe('Invocation inv-0004 ended: submitted; session ses-0004 is kept, but retained no point to continue from');
});

test('each prepared revision of an invocation names the part it recorded', () => {
  const summary = (data: Record<string, unknown>) => projectEvent(runEventSchema.parse({ sequence: 1, jobId: '20260920T101500Z-3f9a1c', at: '2026-09-20T10:15:00.000Z', type: 'invocation-prepared',
    data: { invocation: 'inv-0001', ...data } })).summary;
  expect(summary({ recorded: 'delivered-inputs' })).toBe('Invocation inv-0001 prepared its actual delivered inputs');
  expect(summary({ recorded: 'operation-identity' })).toBe('Invocation inv-0001 recorded its session operation identity');
  expect(summary({})).toBe('Invocation inv-0001 prepared its actual delivered inputs and operation identity');
});
