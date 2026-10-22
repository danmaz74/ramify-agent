import { expect, test } from 'vitest';
import { runSnapshot } from '../run/snapshot.js';
import type { RunEvent } from '../run/log.js';
import type { RunRecord } from '../run/records.js';

test('a retained descriptive analysis with count-only evidence resolves its scenario as accepted reports arrive', () => {
  const record = {
    jobId: 'retained-descriptive', planId: 'review-notes', agent: 'scripted',
    createdAt: '2026-10-22T00:00:00.000Z', identityContract: 'descriptive',
  } as RunRecord;
  const at = '2026-10-22T00:00:00.000Z';
  const event = (sequence: number, type: string, data: object) => ({
    sequence, jobId: record.jobId, at, type, data,
  }) as RunEvent;
  const accepted = event(1, 'analysis-accepted', { workItems: 1, scenarios: 1 });
  const bound = event(2, 'obligation-bound', { id: 'scenario:review-note-limit', fakes: [] });
  const done = event(3, 'obligation-reported', { id: 'scenario:review-note-limit', judgment: 'done' });

  expect(runSnapshot(record, [accepted]).counts.scenarios).toEqual({ pending: 1, bound: 0, done: 0 });
  expect(runSnapshot(record, [accepted, bound]).counts.scenarios).toEqual({ pending: 0, bound: 1, done: 0 });
  expect(runSnapshot(record, [accepted, bound, done]).counts.scenarios).toEqual({ pending: 0, bound: 0, done: 1 });
});
