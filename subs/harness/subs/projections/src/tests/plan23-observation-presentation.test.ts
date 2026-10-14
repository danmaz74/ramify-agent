import { afterEach, describe, expect, test, vi } from 'vitest';
import { invocationEfficiencySchema } from '../../../../src/interfaces/protocol/runs.js';
import { recordPlan23Stimulus, plan23Identity as identity, plan23Invocation as invocation, plan23Outcome as outcome, plan23Time as t, type Plan23Stimulus } from '../../../../src/tests/helpers/plan23-recorded.js';
import { evaluationOf, readObservationLog } from '../metrics.js';

vi.mock('node:child_process', async original => (await import('../../../../src/tests/helpers/process-guard.js')).guardedChildProcess(await original<typeof import('node:child_process')>()));
const cleanups: (() => Promise<void>)[] = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0).reverse()) await cleanup(); });
async function recorded(kind: Plan23Stimulus) { const f = await recordPlan23Stimulus(kind); cleanups.push(f.cleanup); return f; }

describe('Plan 23 F6 durable observation presentation', () => {
  test('snapshot inspection reaches exploration metrics with candidate-root paths from a separate reader workspace', async () => {
    const f = await recorded('snapshot'); const returnedBytes = f.returnedBytes;
    const projected = evaluationOf({ invocation: { ...invocation, role: 'reviewer', writer: false }, outcome, observations: f.rows, lines: null }).efficiency!;
    expect(projected.exploration.metrics).toMatchObject({ reads: 3, uniqueFilesRead: 1, repeatedReads: 2,
      searches: 3, broadSearches: 2, outsideScopeSearches: 0, returnedBytes, toolElapsedMs: 60 });
    expect(projected.exploration.metrics.coverage.join('\n')).toContain('matched files unknown');
  });
  test('captures original identities, exact output bytes, zero matches and recorded-rate estimates once across restoration', async () => {
    const f = await recorded('restoration');
    const projected = evaluationOf({ invocation, outcome, observations: f.rows, lines: null }).efficiency!;
    expect(projected.operation).toEqual(identity);
    expect(projected.exploration.metrics).toMatchObject({ reads: 2, uniqueFilesRead: 1, repeatedReads: 1, returnedBytes: 12, searches: 1, broadSearches: 1, outsideScopeSearches: 1, toolElapsedMs: 30 });
    expect(projected.exploration.zeroMatchSearches).toBe(1);
    expect(projected.charges).toEqual([{ model: 'fixed/model', sourceRevision: 'captured-model-r1', currency: 'USD', source: 'estimated-from-recorded-rates', newInputTokens: 100, cachedInputTokens: 40, cacheWriteTokens: 10, outputTokens: 20,
      ratesPerMillion: { newInput: 2, cachedInput: 0.5, cacheWrite: 3, output: 4 }, newInput: 0.0002, cachedInput: 0.00002, cacheWrite: 0.00003, output: 0.00008, total: 0.00033, coverage: [] }]);
    expect(projected.chargeSubtotal).toBeCloseTo(0.00033); expect(projected.chargeTotal).toBeCloseTo(0.00033);
    // The milestone is the edit at t(4), not the first read at t(1).
    expect(projected.timing).toMatchObject({ elapsedMs: 5000, milestone: 'first-engineering-action', toMilestoneMs: 4000, modelElapsedMs: 120, toolElapsedMs: 40, toolSubtotalMs: 40, checkElapsedMs: null });
    expect(projected.timing.coverage.filter(reason => /tool duration/i.test(reason))).toEqual([]);
    expect(projected.units).toEqual({ scope: 'bytes', returned: 'UTF-8 output bytes', duration: 'ms', charge: 'USD' });
    expect(invocationEfficiencySchema.safeParse(projected).success).toBe(true);
    expect(evaluationOf({ invocation, outcome, observations: f.restoredRows, lines: null }).efficiency).toEqual(projected);
  });
  test('a search the tool resolved nothing for is judged by the path it asked for, and failed apart from completed', async () => {
    const f = await recorded('failed-search');
    const { searches } = evaluationOf({ invocation, outcome, observations: f.rows, lines: null }).efficiency!.exploration;
    expect(searches).toEqual({ completed: 1, failed: 1,
      broad: { state: 'measured', known: 1, coverage: { covered: 2, total: 2 } },
      outsideScope: { state: 'measured', known: 1, coverage: { covered: 2, total: 2 } },
      zeroMatch: { state: 'measured', known: 1, coverage: { covered: 1, total: 1 } } });
  });
  test('an invocation with no declared roots leaves outside-scope status unknown, and its count unavailable rather than zero', async () => {
    const f = await recorded('undeclared');
    const exploration = evaluationOf({ invocation: { ...invocation, role: 'reviewer', writer: false }, outcome, observations: f.rows, lines: null }).efficiency!.exploration;
    expect(exploration.observations[0]!.outsideScope).toBeNull();
    expect(exploration.searches!.outsideScope).toEqual({ state: 'unavailable', known: 0, coverage: { covered: 0, total: 1 } });
    expect(invocationEfficiencySchema.parse(evaluationOf({ invocation: { ...invocation, role: 'reviewer', writer: false }, outcome, observations: f.rows, lines: null }).efficiency).exploration.searches).toBeDefined();
  });
  test('an invocation of no tool calls has a tool duration of 0 ms, one of an unreadable log none, and an incomplete one names its single known subtotal', async () => {
    const f = await recorded('duration');
    const none = evaluationOf({ invocation, outcome, observations: f.rows, lines: null }).efficiency!;
    expect(none.timing.toolElapsedMs).toBe(0); expect(none.timing.toolSubtotalMs).toBe(0);
    expect(none.timing.coverage.filter(reason => /tool duration/i.test(reason))).toEqual([]);
    const unreadable = evaluationOf({ invocation, outcome, observations: { unavailable: 'missing' }, lines: null }).efficiency!;
    expect(unreadable.timing.toolElapsedMs).toBeNull(); expect(unreadable.timing.toolSubtotalMs).toBe(0);
    const rows = f.laterRows.map(row => row.type === 'tool-duration' && row.data.callId === 'r1' ? { ...row, data: { ...row.data, elapsedMs: null } } : row);
    const partial = evaluationOf({ invocation, outcome, observations: rows, lines: null }).efficiency!;
    expect(partial.timing.toolElapsedMs).toBeNull(); expect(partial.timing.toolSubtotalMs).toBe(10);
    expect(partial.timing.coverage.filter(reason => /known subtotal/i.test(reason))).toEqual(['tool duration: known subtotal 10 ms over 1 of 2 tool calls; total unavailable']);
    expect(partial.exploration.metrics).toMatchObject({ toolElapsedMs: 10, coverage: [] });
  });
  test('plain immutable sibling/checkpoint fixtures keep actual zero and missing-rate states distinct', async () => {
    const f = await recorded('usage'); const source = f.rows;
    const L = { ...identity, sessionId: 'left', sourcePoint: { ...identity.sourcePoint, sessionId: 'left', checkpoint: 'left-C1' } };
    const R = { ...identity, operationId: 'right-op', sessionId: 'right', sourcePoint: { ...identity.sourcePoint, sessionId: 'right', checkpoint: 'right-C1' } };
    const left = evaluationOf({ invocation: { ...invocation, sessionOperation: L }, outcome, observations: source, lines: null }).efficiency!;
    const right = evaluationOf({ invocation: { ...invocation, sessionOperation: R }, outcome, observations: [], lines: null }).efficiency!;
    expect(left.operation).toEqual(L); expect(right.operation).toEqual(R); expect(left.operation?.turn).toBe(right.operation?.turn);
    expect(right.chargeTotal).toBeNull(); expect(right.chargeSubtotal).toBe(0);
    left.charges[0]!.ratesPerMillion.output = 99; left.charges[0]!.coverage.push('client-only');
    const retry = evaluationOf({ invocation: { ...invocation, sessionOperation: L }, outcome, observations: source, lines: null }).efficiency!;
    expect(retry.charges[0]?.ratesPerMillion.output).toBe(4); expect(retry.charges[0]?.coverage).toEqual([]);
    const recordedUsage = source.find(row => row.type === 'usage')!;
    const zero = { ...recordedUsage, data: { ...recordedUsage.data, usage: { input: 0, cacheRead: 0, cacheWrite: 0, output: 0, total: 0 }, charge: { ...recordedUsage.data.charge!, newInputTokens: 0, cachedInputTokens: 0, cacheWriteTokens: 0, outputTokens: 0, newInput: 0, cachedInput: 0, cacheWrite: 0, output: 0, total: 0 } } };
    const measuredZero = evaluationOf({ invocation, outcome, observations: [zero], lines: null }).efficiency!;
    expect(measuredZero.chargeTotal).toBe(0); expect(measuredZero.chargeSubtotal).toBe(0);
    const absentRate = { ...recordedUsage, data: { ...recordedUsage.data, charge: { ...recordedUsage.data.charge!, ratesPerMillion: { ...recordedUsage.data.charge!.ratesPerMillion, output: null }, output: null, total: null, coverage: ['output rate absent'] } } };
    const partial = evaluationOf({ invocation, outcome, observations: [absentRate], lines: null }).efficiency!;
    expect(partial.chargeTotal).toBeNull(); expect(partial.chargeSubtotal).toBeCloseTo(0.00025);
    for (const wire of [retry, right, measuredZero, partial]) expect(invocationEfficiencySchema.safeParse(JSON.parse(JSON.stringify(wire))).success).toBe(true);
  });
  test('keeps known subtotals after unreadable and torn rows without inventing zero usage or complete durations', async () => {
    const f = await recorded('torn');
    const log = await readObservationLog(f.path, 'observations.jsonl');
    const projected = evaluationOf({ invocation, outcome: null, observations: log, lines: null }).efficiency!;
    expect(projected.exploration.metrics.returnedBytes).toBe(9); expect(projected.exploration.metrics.reads).toBe(1);
    expect(projected.chargeTotal).toBeNull(); expect(projected.chargeSubtotal).toBe(0);
    expect(projected.timing.elapsedMs).toBeNull(); expect(projected.timing.modelElapsedMs).toBeNull();
    expect(projected.coverage.join('\n')).toContain('unreadable rows');
    expect(projected.exploration.metrics.coverage.join('\n')).toContain('files read unknown');
    const unknown = evaluationOf({ invocation: { id: 'old', role: 'engineer', work: {}, writer: true }, outcome: null, observations: { unavailable: 'missing' }, lines: null }).efficiency!;
    expect(unknown.operation).toBeNull(); expect(unknown.manifest).toBeNull(); expect(unknown.declared).toBeNull(); expect(unknown.readScope).toBeNull();
    expect(invocationEfficiencySchema.safeParse(unknown).success).toBe(true);
  });
  test('conflicting source identity remains excluded through a third original row and partial logs retain timing subtotals', async () => {
    const f = await recorded('conflict');
    const usage = f.rows.find(row => row.type === 'usage')!;
    const rows = [...f.rows, { ...usage, n: 100, data: { ...usage.data, modelElapsedMs: 999 } }, { ...usage, n: 101 },
      { n: 102, at: t(4), type: 'coverage-gap' as const, data: { kind: 'observation-truncated' as const, detail: 'Lost finish rows' } }];
    const projected = evaluationOf({ invocation, outcome, observations: rows, lines: null }).efficiency!;
    expect(projected.charges).toEqual([]); expect(projected.chargeTotal).toBeNull(); expect(projected.chargeSubtotal).toBe(0);
    expect(projected.timing.toolElapsedMs).toBeNull(); expect(projected.timing.toolSubtotalMs).toBe(10); expect(projected.exploration.metrics.returnedBytes).toBe(3);
    expect(projected.coverage.join('\n')).toContain('conflicting source observation');
  });
  test('reopens valid/malformed/valid/torn observation rows without weakening the session ledger or duplicating source effects', async () => {
    const f = await recorded('reopened');
    expect(evaluationOf({ invocation, outcome, observations: f.restoredRows, lines: null }).efficiency?.chargeSubtotal).toBeCloseTo(0.00033);
  });
});
