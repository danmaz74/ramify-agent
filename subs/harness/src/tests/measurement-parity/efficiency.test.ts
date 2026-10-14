import { describe, expect, test } from 'vitest';
import { estimateRecordedCharge, invocationTiming as ownedTiming, type InvocationTiming } from '../../../subs/kpi/src/efficiency.js';
import { invocationTiming as baselineTiming } from '../../kpi/efficiency.js';
import type { ExplorationObservation } from '../../../subs/kpi/src/exploration.js';
function invocationTiming(input: Pick<InvocationTiming, 'startedAt' | 'endedAt' | 'milestone' | 'milestoneAt'> & { readonly modelElapsedMs?: number | null; readonly checkElapsedMs?: number | null; readonly exploration?: readonly ExplorationObservation[]; readonly coverage?: readonly string[] }): InvocationTiming {
  const result = ownedTiming(input);
  expect(result).toEqual(baselineTiming(input));
  return result;
}
import { observation, fixture } from './exploration-fixtures.js';

describe('Plan23 F6 timing and charges with recorded inputs', () => {
  test('parallel 10ms tools sum to 20ms, while invocation wall time is 10ms and milestone is explicit', () => {
    const timing = invocationTiming({ startedAt: '2026-01-01T00:00:00.000Z', endedAt: '2026-01-01T00:00:00.010Z',
      milestone: 'first-engineering-action', milestoneAt: '2026-01-01T00:00:00.004Z', modelElapsedMs: 3, checkElapsedMs: 0,
      exploration: [observation('a', { elapsedMs: 10 }), observation('b', { elapsedMs: 10 })] });
    expect(timing).toMatchObject({ elapsedMs: 10, toolElapsedMs: 20, toMilestoneMs: 4, milestone: 'first-engineering-action', coverage: [] });
    expect(invocationTiming({ startedAt: timing.startedAt, endedAt: null, milestone: null, milestoneAt: null })).toMatchObject({ elapsedMs: null, toolElapsedMs: null, toMilestoneMs: null, milestone: null });
    expect(invocationTiming({ startedAt: timing.startedAt, endedAt: timing.endedAt, exploration: fixture, milestone: null, milestoneAt: null })).toMatchObject({ toolElapsedMs: null, coverage: expect.arrayContaining([expect.stringContaining('known subtotal 17 ms')]) });
    expect(invocationTiming({ startedAt: timing.startedAt, endedAt: timing.endedAt, milestone: 'first-designated-submission', milestoneAt: '2026-01-01T00:00:00.011Z' }).toMilestoneMs).toBeNull();
  });
  test('new/cached/write/output categories use recorded rates and preserve absent rates/usage as unknown', () => {
    const input = { model: 'recorded-model', newInputTokens: 100, cachedInputTokens: 50, cacheWriteTokens: 0, outputTokens: 10,
      ratesPerMillion: { newInput: 2, cachedInput: 0.2, cacheWrite: 0, output: 8 } };
    expect(estimateRecordedCharge(input)).toMatchObject({ source: 'estimated-from-recorded-rates', currency: 'USD',
      newInput: 0.0002, cachedInput: 0.00001, cacheWrite: 0, output: 0.00008, coverage: [] });
    expect(estimateRecordedCharge(input).total).toBeCloseTo(0.00029, 12);
    expect(estimateRecordedCharge({ ...input, cachedInputTokens: null })).toMatchObject({ newInput: 0.0002, cachedInput: null, total: null });
    expect(estimateRecordedCharge({ ...input, ratesPerMillion: { ...input.ratesPerMillion, output: null } })).toMatchObject({ output: null, total: null });
  });
  test('conflicting source durations do not become a known empty tool total', () => {
    const first = observation('one');
    const timing = invocationTiming({ startedAt: '2026-01-01T00:00:00.000Z', endedAt: '2026-01-01T00:00:00.010Z',
      milestone: null, milestoneAt: null, exploration: [first, { ...first, elapsedMs: 6 }], modelElapsedMs: 0, checkElapsedMs: 0 });
    expect(timing).toMatchObject({ elapsedMs: 10, modelElapsedMs: 0, checkElapsedMs: 0, toolElapsedMs: null });
    expect(timing.coverage).toEqual(['no explicit milestone recorded', 'tool duration: known subtotal 0 ms; total unknown',
      '["inv1","op1","session1",1,"one","read"]: conflicting observations of one source call; excluded']);
  });
});
