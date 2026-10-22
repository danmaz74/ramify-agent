import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { invocationEvaluationSchema } from '../../../harness/src/interfaces/protocol/runs.js';
import { EvaluationFacts } from '../evaluation.js';
afterEach(cleanup);
test('session facts distinguish current occupancy, native settings, missing projected estimate and failed compaction', () => {
  const evaluation = invocationEvaluationSchema.parse({ invocation: 'inv-original', role: 'reviewer', workItem: null, iteration: null, request: 'review-frozen',
    ended: 'resource-pending', writer: false, guarding: { guarded: [], unguarded: [], verdicts: { allowed: 0, 'blocked-scope': 0, 'blocked-unresolved': 0 }, complete: false, statement: 'Unknown' },
    outsideScope: [], hookChecks: { passed: 0, findings: 0, notChecked: 0, newFindings: 0 }, excursions: [], gaps: [], lines: null, usage: { unavailable: 'Provider usage unavailable' },
    context: { observations: [{ at: '2026-10-13T06:00:00Z', tokens: 205728, window: 272000,
      native: { source: 'pi@1.3.0:SettingsManager', compaction: { enabled: true, reserveTokens: 16384, keepRecentTokens: 20000 }, occupancy: 'current', projectedTokens: null, coverage: ['Projected size unavailable'] } }],
      compactions: [{ at: '2026-10-13T06:00:01Z', trigger: 'overflow', succeeded: false, before: 205728, after: null, error: 'Summary provider unavailable' }], coverage: [] } });
  render(<EvaluationFacts evaluation={evaluation} />);
  expect(screen.getByText(/Current occupancy 205728 tokens; model window 272000/).textContent).toContain('Projected request unknown');
  expect(screen.getByText(/Native compaction enabled/).textContent).toContain('reserve 16384');
  expect(screen.getByText(/Compaction overflow: recovery needed/).textContent).toContain('Summary provider unavailable');
  expect(screen.getByText(/Provider usage unavailable/)).toBeTruthy();
});
