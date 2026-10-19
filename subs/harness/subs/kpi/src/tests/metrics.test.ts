import { size, usage, find } from './metric-fixtures.js';
import { describe, expect, test } from 'vitest';
import { metricSchema, type Metric } from '../../../../src/interfaces/protocol/runs.js';
import type { DeliveredChange } from '../delivered.js';
import { comparableScopeMetrics, kpiMetrics, type InvocationFacts, type MetricInputs } from '../metrics.js';
import type { Observation } from '../../../task-execution/src/observations.js';
import type { LineEventSummary } from '../../../autonomous/src/run/records.js';
import type { ScopeSize } from '../../../task-execution/src/records.js';
const guarded = { statement: 'Every observed mutation passed the guard (edit).', complete: true };
function lines(invocation: string, added: number, deleted: number, coverage: 'complete' | 'partial' = 'complete'): LineEventSummary {
  return { schema: 'ramify-agent.line-events/1', invocation,
    paths: added + deleted === 0 ? [] : [{ path: 'subs/x/src/a.ts', owner: 'p/x', added, deleted, binary: false, bytes: null }],
    unmapped: { paths: 0, added: 0, deleted: 0 }, coverage,
    gaps: coverage === 'partial' ? ['changed-paths-unknown: the snapshot after the session failed (git exited 128)'] : [] };
}
function writer(id: string, extra: Partial<InvocationFacts> = {}): InvocationFacts {
  return { id, role: 'engineer', workItem: 'wi-001', iteration: 'wi-001.i01', request: null, writer: true, session: `session-${id}`,
    outcome: { ended: 'submitted', usage, outsideScope: [] }, size: size(1000), lines: lines(id, 5, 5), observations: [], adaptation: null, ...extra };
}
function delivered(weights: ReadonlyArray<readonly [string, number]>, unattributed: ReadonlyArray<readonly [string, number]> = []): DeliveredChange {
  return { state: 'measured', base: 'a'.repeat(40), final: 'f'.repeat(40), weights: new Map(weights), unattributed: new Map(unattributed), harness: 0, binaryPaths: [] };
}
function inputs(invocations: InvocationFacts[], extra: Partial<MetricInputs> = {}): MetricInputs {
  const weights = invocations.flatMap(facts => {
    if (!facts.writer || facts.lines === null || 'unavailable' in facts.lines) return [];
    const weight = facts.lines.paths.reduce((total, path) => total + path.added + path.deleted, 0);
    return weight > 0 ? [[facts.id, weight] as const] : [];
  });
  return { baseline: { bytes: 10_000, snapshot: 'ms-0001' }, invocations, delivered: delivered(weights),
    gateAttempts: ['ga-0002', 'ga-0003'], acceptedIterations: ['wi-001.i01'], ...extra };
}
function computed(value: MetricInputs, guarding = guarded): Metric[] {
  const metrics = kpiMetrics(value, guarding);
  for (const metric of metrics) metricSchema.parse(metric);
  return metrics;
}

describe('M4: every metric keeps its numerator, denominator, version and coverage', () => {
  test('measured: sum(w_e * S_e) / sum(w_e), over B, and its inverse', () => {
    const metrics = computed(inputs([writer('inv-0002'), writer('inv-0003', { size: size(3000), lines: lines('inv-0003', 20, 10) })]));
    expect(find(metrics, 'scope-bytes-per-changed-line')).toMatchObject({ state: 'measured', value: 2500, numerator: 100_000, denominator: 40, coverage: { covered: 2, total: 2 }, policyVersion: 'kpi/1', measurementPolicy: 'scope-size/2' });
    expect(find(metrics, 'scope-bytes-per-changed-line').evidence).toEqual([
      `delivered change ${'a'.repeat(12)}..${'f'.repeat(12)}`, 'inv-0002: w_e = 10 lines, S_e = 1000 bytes', 'inv-0003: w_e = 30 lines, S_e = 3000 bytes',
    ]);
    expect(find(metrics, 'scope-size-ratio')).toMatchObject({ state: 'measured', value: 0.25, numerator: 2500, denominator: 10_000 });
    expect(find(metrics, 'reduction-factor')).toMatchObject({ state: 'measured', value: 4 });
    expect(find(metrics, 'gate-attempts-per-accepted-iteration')).toMatchObject({ state: 'measured', value: 2, numerator: 2, denominator: 1, measurementPolicy: null });
  });
  test('a missing size component reports unavailable with its known subtotal and coverage, never zero', () => {
    const metrics = computed(inputs([writer('inv-0002'), writer('inv-0003', { size: size(null, 'owned-source'), lines: lines('inv-0003', 3, 0) })]));
    const perLine = find(metrics, 'scope-bytes-per-changed-line');
    expect(perLine).toMatchObject({ state: 'unavailable', value: null, numerator: null, subtotal: 10_000, denominator: 10, coverage: { covered: 1, total: 2 }, note: expect.stringContaining('10 lines of the 13 lines delivered') });
    expect(perLine.evidence.join('\n')).toContain('inv-0003: w_e = 3 lines, S_e unknown: owned-source unknown');
    expect(find(metrics, 'scope-size-ratio')).toMatchObject({ state: 'unavailable', value: null, subtotal: 10_000 });
    expect(find(metrics, 'session-weighted-total')).toMatchObject({ state: 'unavailable', value: null, coverage: { covered: 1, total: 2 } });
  });
  test('sum(w_e) = 0 reports not-applicable', () => {
    const metrics = computed(inputs([writer('inv-0002', { lines: lines('inv-0002', 0, 0) }), writer('inv-0003', { lines: lines('inv-0003', 0, 0), size: size(null, 'owned-source') })]));
    expect(find(metrics, 'scope-bytes-per-changed-line')).toMatchObject({ state: 'not-applicable', value: null, numerator: 0, denominator: 0, note: expect.stringContaining('sum(w_e) = 0') });
    expect(find(metrics, 'scope-size-ratio')).toMatchObject({ state: 'not-applicable', value: null });
  });
  test('delivered lines no writer can be named for refuse a whole-run ratio; the attributed numerator and weight are shown', () => {
    const facts = [writer('inv-0002'), writer('inv-0003', { lines: lines('inv-0003', 50, 0, 'partial') })];
    const metrics = computed(inputs(facts, { delivered: delivered([['inv-0002', 10]], [['commit 0123456789ab holds no recorded writer\'s work', 50]]) }));
    const perLine = find(metrics, 'scope-bytes-per-changed-line');
    expect(perLine).toMatchObject({ state: 'partial', value: null, numerator: 10_000, denominator: 10, coverage: { covered: 2, total: 2 }, note: expect.stringContaining('50 lines of the 60 lines delivered are attributed to no writer') });
    expect(perLine.evidence).toContain('inv-0003: w_e = 0, it delivered no line');
    expect(perLine.evidence).toContain('unattributed: 50 lines: commit 0123456789ab holds no recorded writer\'s work');
    expect(find(metrics, 'scope-size-ratio')).toMatchObject({ state: 'partial', value: null, numerator: 10_000, denominator: 10 });
  });
  test('w_e is the delivered share: a writer whose lines a later writer replaced is weighted by what survived, a shared commit by its split', () => {
    const facts = [writer('inv-0002'), writer('inv-0003', { size: size(3000) }), writer('inv-0004', { size: size(5000) })];
    const metrics = computed(inputs(facts, { delivered: delivered([['inv-0002', 4], ['inv-0003', 4.5], ['inv-0004', 1.5]]) }));
    expect(find(metrics, 'scope-bytes-per-changed-line')).toMatchObject({ state: 'measured', value: 2500, numerator: 25_000, denominator: 10 });
    expect(find(metrics, 'scope-bytes-per-changed-line').evidence).toContain('inv-0003: w_e = 4.50 lines, S_e = 3000 bytes');
  });
  test('no accepted commit is not-applicable, and a delivered change Git cannot answer is unavailable, never zero', () => {
    const none = computed(inputs([writer('inv-0002')], { delivered: { state: 'not-applicable', reason: 'No commit was accepted after the run base' } }));
    expect(find(none, 'scope-bytes-per-changed-line')).toMatchObject({ state: 'not-applicable', value: null, numerator: 0, denominator: 0, note: expect.stringContaining('No commit was accepted') });
    expect(find(none, 'scope-size-ratio')).toMatchObject({ state: 'not-applicable', value: null });
    const unknown = computed(inputs([writer('inv-0002')], { delivered: { state: 'unavailable', reason: 'The delivered change could not be read from Git: git exited 128' } }));
    expect(find(unknown, 'scope-bytes-per-changed-line')).toMatchObject({ state: 'unavailable', value: null, subtotal: null, denominator: null, evidence: [expect.stringContaining('git exited 128')] });
    expect(find(unknown, 'reduction-factor')).toMatchObject({ state: 'unavailable', value: null });
  });
  test('a size taken under another measurement policy is refused, never mixed with the current one', () => {
    const old = { ...size(1000), policy: 'scope-size/1' as const };
    const metrics = computed(inputs([writer('inv-0002'), writer('inv-0003', { size: old })]));
    const perLine = find(metrics, 'scope-bytes-per-changed-line');
    expect(perLine).toMatchObject({ state: 'unavailable', value: null, subtotal: 10_000, denominator: 10 });
    expect(perLine.evidence.join('\n')).toContain('inv-0003: w_e = 10 lines, S_e unknown: its size was taken under scope-size/1, which is not comparable with scope-size/2');
    expect(find(metrics, 'session-weighted-total')).toMatchObject({ state: 'unavailable', value: null, coverage: { covered: 1, total: 2 } });
  });
  test('an unavailable baseline makes every ratio over B unavailable, with the reason', () => {
    const metrics = computed(inputs([writer('inv-0002')], { baseline: { unavailable: 'ramify measure could not be run' } }));
    expect(find(metrics, 'scope-bytes-per-changed-line').state).toBe('measured');
    for (const id of ['scope-size-ratio', 'reduction-factor', 'session-weighted-total']) {
      const metric = find(metrics, id);
      expect([id, metric.state, metric.value]).toEqual([id, 'unavailable', null]);
      expect(metric.evidence.join(' ')).toContain('ramify measure could not be run');
    }
  });
  test('usage stays separate by category, and one unreported session makes it unavailable, not zero', () => {
    const reported = computed(inputs([writer('inv-0002'), writer('inv-0003')]));
    expect(['input', 'cache-read', 'cache-write', 'output'].map(name => find(reported, `usage-tokens.${name}`).value)).toEqual([200, 2000, 100, 20]);
    expect(reported.some(metric => /cost|price|invoice|usd/i.test(`${metric.id} ${metric.unit}`))).toBe(false);
    const missing = computed(inputs([writer('inv-0002'), writer('inv-0003', { outcome: { ended: 'failed', usage: { unavailable: 'the harness stopped' }, outsideScope: [] } })]));
    expect(find(missing, 'usage-tokens.input')).toMatchObject({ state: 'unavailable', value: null, subtotal: 100, coverage: { covered: 1, total: 2 } });
    expect(find(missing, 'adaptation-usage-share.output')).toMatchObject({ state: 'unavailable', value: null });
  });
  test('sessions count every session, and a continued session counts each component once at its largest', () => {
    const facts = [writer('inv-0002', { session: 'la-1', role: 'local-architect', writer: false, lines: null, size: size(1000) }),
      writer('inv-0003', { session: 'la-1', role: 'local-architect', writer: false, lines: null, size: size(4000) }),
      writer('inv-0004', { outcome: { ended: 'failed', usage, outsideScope: [] }, lines: lines('inv-0004', 0, 0) }),
      writer('inv-0005', { outcome: { ended: 'context-budget-reached', usage, outsideScope: [] }, adaptation: 'iteration wi-001.i01 was unsuitable' })];
    const metrics = computed(inputs(facts));
    expect(find(metrics, 'session-count')).toMatchObject({ state: 'measured', value: 3 });
    expect(find(metrics, 'session-weighted-total')).toMatchObject({ state: 'measured', numerator: 6000, denominator: 10_000, value: 0.6 });
    expect(find(metrics, 'adaptation-session-share')).toMatchObject({ state: 'measured', numerator: 1, denominator: 3 });
    expect(find(metrics, 'budget-return-rate.engineer')).toMatchObject({ state: 'measured', numerator: 1, denominator: 2 });
    expect(find(metrics, 'budget-return-rate.global-fork')).toMatchObject({ state: 'not-applicable', value: null, denominator: 0 });
  });
  test('blocked writes are partial while an unguarded tool mutated, and say why', () => {
    const guard = (callId: string, verdict: 'allowed' | 'blocked-scope'): Observation => ({ n: 1, at: '2026-09-21T08:00:00.000Z', type: 'guard',
      data: { callId, tool: 'write', requested: 'a', resolved: 'a', owner: null, scopeRevision: 1, verdict, reason: 'r' } });
    const facts = [writer('inv-0002', { observations: [guard('c1', 'allowed'), guard('c2', 'blocked-scope')] })];
    const complete = computed(inputs(facts));
    expect(find(complete, 'blocked-write-attempts')).toMatchObject({ state: 'measured', value: 0.5, numerator: 1, denominator: 2, evidence: ['engineer write blocked-scope: 1'] });
    const statement = 'Guarded: write. Not guarded: shell. A count of blocked calls is not evidence that every write respected its scope; what an unguarded tool wrote is seen only in the tree afterwards.';
    const partial = computed(inputs(facts), { statement, complete: false });
    expect(find(partial, 'blocked-write-attempts')).toMatchObject({ state: 'partial', value: null, numerator: 1, denominator: 2, note: statement });
  });
  test('an unreadable observation log makes its counts partial or unavailable, never zero', () => {
    const facts = [writer('inv-0002', { observations: { unavailable: 'observations.jsonl cannot be read' } })];
    const metrics = computed(inputs(facts));
    expect(find(metrics, 'compactions.engineer')).toMatchObject({ state: 'unavailable', value: null, coverage: { covered: 0, total: 1 } });
    expect(find(metrics, 'compactions.initial-architect')).toMatchObject({ state: 'not-applicable', value: null, coverage: { covered: 0, total: 0 } });
    expect(find(metrics, 'blocked-write-attempts')).toMatchObject({ state: 'partial', value: null });
  });
  test('a transcript entry that could not be written is raw output: it lowers no observation coverage', () => {
    const gap = (kind: 'transcript-incomplete' | 'usage-unavailable'): Observation => ({ n: 1, at: '2026-09-23T08:00:00.000Z', type: 'coverage-gap', data: { kind, detail: 'why' } });
    const metrics = computed(inputs([writer('inv-0002', { observations: [gap('transcript-incomplete')] }), writer('inv-0003', { observations: [gap('usage-unavailable'), gap('transcript-incomplete')] }), writer('inv-0004')]));
    expect(find(metrics, 'observation-coverage')).toMatchObject({ state: 'measured', numerator: 2, denominator: 3, evidence: ['inv-0003'] });
    expect(find(metrics, 'observation-coverage.usage-unavailable')).toMatchObject({ value: 1, evidence: ['inv-0003'] });
    expect(metrics.some(metric => metric.id === 'observation-coverage.transcript-incomplete')).toBe(false);
  });
  test('no writer session: the change-weighted metrics are not-applicable, never zero', () => {
    const metrics = computed(inputs([], { gateAttempts: [], acceptedIterations: [] }));
    expect(find(metrics, 'scope-bytes-per-changed-line')).toMatchObject({ state: 'not-applicable', value: null });
    expect(find(metrics, 'gate-attempts-per-accepted-iteration')).toMatchObject({ state: 'not-applicable', value: null, denominator: 0 });
    expect(find(metrics, 'session-count')).toMatchObject({ state: 'measured', value: 0 });
  });
});

describe('Plan23 F6 corresponding scope components and weighted partial evidence', () => {
  const splitSize = (source: number, api: number, architect: number, support: number): ScopeSize => ({
    policy: 'scope-size/2', snapshot: 'ms-0001', bytes: source + api + architect + support, subtotal: source + api + architect + support, coverage: 'complete',
    components: [{ component: 'owned-source', detail: 'source', bytes: source, state: 'measured' }, { component: 'api-views', detail: 'api', bytes: api, state: 'measured' },
      { component: 'architect-view', detail: 'architect', bytes: architect, state: 'measured' }, { component: 'support-documents', detail: 'support and brief', bytes: support, state: 'measured' }] });
  const baseline = splitSize(100, 20, 30, 50);
  const one = splitSize(40, 10, 15, 25);
  test('project50/120 and total90/200 use their corresponding baselines; weights3,1 at90,50 mean80bytes', () => {
    const ratios = comparableScopeMetrics({ baseline, writers: new Map([['one', one]]), delivered: delivered([['one', 1]]) });
    expect(ratios.projectOnly.ratio).toMatchObject({ unit: 'dimensionless', value: 50 / 120, numerator: 50, denominator: 120 });
    expect(ratios.total.ratio).toMatchObject({ value: 90 / 200, numerator: 90, denominator: 200 });
    const weighted = comparableScopeMetrics({ baseline, writers: new Map([['one', one], ['two', splitSize(30, 5, 5, 10)]]), delivered: delivered([['one', 3], ['two', 1]]) });
    expect(weighted.total.mean).toMatchObject({ state: 'measured', value: 80, numerator: 320, denominator: 4, unit: 'bytes (change-weighted mean)' });
  });
  test('partial writers retain known byte-line subtotal and weight, overlaps retain unrelated known contribution', () => {
    const partial: ScopeSize = { ...one, bytes: null, subtotal: 80, coverage: 'partial', components: one.components.map(component =>
      component.component === 'support-documents' ? { ...component, bytes: null, state: 'unavailable', buckets: { known: 15 }, reason: 'missing support' } : component) };
    const value = comparableScopeMetrics({ baseline, writers: new Map([['one', one], ['two', partial]]), delivered: delivered([['one', 3], ['two', 1]], [['unknown overlapping writer', 2]]) });
    expect(value.total).toMatchObject({ attributedWeight: 4, completeSizeWeight: 3, unknownSizeWeight: 1, unattributedWeight: 2, mean: { state: 'partial', value: null, subtotal: 350, denominator: 4 }, ratio: { state: 'partial', value: null } });
    expect(value.projectOnly.mean).toMatchObject({ state: 'partial', subtotal: 200 });
    const old = computed(inputs([writer('one', { size: one }), writer('two', { size: partial })], { delivered: delivered([['one', 3], ['two', 1]]) }));
    expect(find(old, 'scope-bytes-per-changed-line')).toMatchObject({ state: 'unavailable', subtotal: 350, denominator: 3 });
  });
  test('missingB, zeroB, delivered-zero, incompatiblepolicy and frozen snapshot identities remain distinct', () => {
    const args = { writers: new Map([['one', one]]), delivered: delivered([['one', 1]]) };
    expect(comparableScopeMetrics({ ...args, baseline: { unavailable: 'missing baseline' } }).total.ratio).toMatchObject({ state: 'unavailable', value: null, subtotal: 90 });
    expect(comparableScopeMetrics({ ...args, baseline: splitSize(0, 0, 0, 0) }).total.ratio).toMatchObject({ state: 'not-applicable', value: null, denominator: 0 });
    expect(comparableScopeMetrics({ ...args, baseline, delivered: delivered([]) }).total.mean).toMatchObject({ state: 'not-applicable', numerator: 0, denominator: 0 });
    expect(comparableScopeMetrics({ ...args, baseline: { ...baseline, policy: 'scope-size/1' } }).total.ratio).toMatchObject({ state: 'unavailable' });
    const mismatch = comparableScopeMetrics({ ...args, baseline, writers: new Map([['one', { ...one, snapshot: 'ms-0002' }]]) });
    expect(mismatch.total).toMatchObject({ unknownSizeWeight: 1, mean: { state: 'partial', subtotal: 0 } });
    const zero = comparableScopeMetrics({ baseline, writers: new Map([['one', splitSize(0, 0, 0, 0)]]), delivered: delivered([['one', 1]]) });
    expect(zero.total.ratio).toMatchObject({ state: 'measured', value: 0 });
  });
});

test('Plan23 captured partial zero subtotal remains zero while absent scope remains unknown', () => {
  const captured = computed(inputs([writer('one', { size: size(null, 'owned-source') })], { delivered: delivered([['one', 1]]) }));
  expect(find(captured, 'scope-bytes-per-changed-line')).toMatchObject({ state: 'unavailable', subtotal: 0, value: null, denominator: null });
  expect(find(captured, 'session-weighted-total')).toMatchObject({ state: 'unavailable', subtotal: 0, value: null });
  const missing = computed(inputs([writer('one', { size: null })], { delivered: delivered([['one', 1]]) }));
  expect(find(missing, 'scope-bytes-per-changed-line')).toMatchObject({ state: 'unavailable', subtotal: null, value: null, denominator: null });
});

test('a degraded fresh continuation adds another scope history, not another harness session', () => {
  const metrics = computed(inputs([writer('one', { session: 's', size: size(1000) }), writer('two', { session: 's', history: 'fresh-two', size: size(3000) })]));
  expect(find(metrics, 'session-count')).toMatchObject({ value: 1 });
  expect(find(metrics, 'session-weighted-total')).toMatchObject({ value: 0.4, numerator: 4000, coverage: { covered: 2, total: 2 }, evidence: ['fresh-two: a continued start the executor made fresh counts as a term of its own'] });
});
