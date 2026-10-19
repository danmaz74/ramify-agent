import { describe, expect, test } from 'vitest';
import { sessionMetrics, type SessionEntry } from '../sessions.js';
import type { LineEventSummary } from '../../../autonomous/src/run/records.js';

describe('M5: every session counts, whatever ended it', () => {
  test('failed, stopped, repaired, context-limited and no-change sessions are all in the session set', () => {
    const lines = (invocation: string, paths: number): LineEventSummary => ({
      schema: 'ramify-agent.line-events/1', invocation,
      paths: Array.from({ length: paths }, (_, index) => ({ path: `a${index}.ts`, owner: 'collection-review/workspace/reviews/notes', added: 3, deleted: 1, binary: false, bytes: null })),
      unmapped: { paths: 0, added: 0, deleted: 0 }, coverage: 'complete', gaps: [],
    });
    const usage = { input: 10, output: 5, cacheRead: 0, cacheWrite: 0, total: 15 };
    const entries: SessionEntry[] = [
      { invocation: 'inv-0001', role: 'engineer', ended: 'failed', usage, lines: lines('inv-0001', 1) },
      { invocation: 'inv-0002', role: 'engineer', ended: 'stopped', usage, lines: lines('inv-0002', 1) },
      { invocation: 'inv-0003', role: 'engineer', ended: 'submitted', usage, lines: lines('inv-0003', 2) },
      { invocation: 'inv-0004', role: 'engineer', ended: 'context-budget-reached', usage, lines: lines('inv-0004', 1) },
      { invocation: 'inv-0005', role: 'engineer', ended: 'submitted', usage, lines: lines('inv-0005', 0) },
    ];
    const metrics = sessionMetrics(entries);
    expect(metrics.sessions).toBe(5);
    expect(metrics.byEnd).toEqual({ failed: 1, stopped: 1, submitted: 2, 'context-budget-reached': 1 });
    expect(metrics.withChange).toBe(4);
    expect(metrics.withoutChange).toBe(1);
    expect(metrics.added).toBe(15);
    expect(metrics.deleted).toBe(5);
    expect(metrics.tokens).toBe(75);
    const withGap = sessionMetrics([...entries, {
      invocation: 'inv-0006', role: 'engineer', ended: 'ended', usage: { unavailable: 'the session reported no usage' },
    }]);
    expect(withGap.sessions).toBe(6);
    expect(withGap.tokens).toBeNull();
    expect(withGap.usageUnavailable).toBe(1);
  });
  test('empty input is a known zero, and later reported usage cannot replace an earlier unknown total', () => {
    expect(sessionMetrics([])).toEqual({ sessions: 0, withChange: 0, withoutChange: 0, added: 0, deleted: 0, tokens: 0, usageUnavailable: 0, byEnd: {} });
    expect(sessionMetrics([
      { invocation: 'one', role: 'engineer', ended: 'failed', usage: { unavailable: 'missing' } },
      { invocation: 'two', role: 'engineer', ended: 'submitted', usage: { input: 1, output: 2, cacheRead: 3, cacheWrite: 4, total: 10 } },
    ])).toMatchObject({ sessions: 2, withoutChange: 2, tokens: null, usageUnavailable: 1 });
  });
});
