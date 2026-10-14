import { describe, expect, test } from 'vitest';
import { lineageMetricSchema, type LineageMetric } from '../../../../src/interfaces/protocol/runs.js';
import { lineageMetrics, type LineageInputs, type SegmentFacts } from '../lineage.js';
import { lineageMetrics as baselineLineage } from '../../../../src/kpi/lineage.js';
const use = (input: number, cacheRead: number, cacheWrite: number, output: number) => ({ input, cacheRead, cacheWrite, output });
const segment = (invocation: string, session: string, extra: Partial<SegmentFacts> = {}): SegmentFacts => ({ invocation, session,
  role: 'engineer', ended: true, requested: 'fresh', actual: 'fresh', unknown: null, degraded: null, continues: null,
  generation: null, source: null, previous: null, startContext: 0, usage: use(0, 0, 0, 0), ...extra });
const global = { session: 'ses-0001', role: 'initial-architect' as const };
const inputs: LineageInputs = {
  generations: [1, 2],
  sessions: Array.from({ length: 8 }, (_, index) => ({ id: `ses-000${index + 1}`, replaces: index === 5 ? { session: 'ses-0005', reason: 'reconstructed' as const } : index === 6 ? { session: 'ses-0001', reason: 'context-rebuilt' as const } : null })),
  segments: [
    segment('inv-0001', 'ses-0001', { role: 'initial-architect', startContext: 20_000, usage: use(1000, 0, 5000, 2000) }),
    segment('inv-0002', 'ses-0002', { role: 'global-fork', requested: 'fork', actual: 'fork', source: global, generation: 1, startContext: 24_000, usage: use(200, 20_000, 300, 800) }),
    segment('inv-0003', 'ses-0003', { role: 'global-fork', requested: 'fork', actual: 'fork', source: global, generation: 1, startContext: 26_000, usage: use(400, 22_000, 500, 1200) }),
    segment('inv-0004', 'ses-0004', { role: 'local-architect', startContext: 8000, usage: use(900, 0, 4000, 700) }),
    segment('inv-0005', 'ses-0004', { role: 'local-architect', requested: 'continue', actual: 'continue', continues: 'placement-answered', previous: 'inv-0004', startContext: 11_000, usage: use(300, 9000, 800, 500) }),
    segment('inv-0006', 'ses-0004', { role: 'local-architect', requested: 'continue', actual: 'fresh', continues: 'iteration-closed', previous: 'inv-0005', startContext: 7000, usage: use(2000, 0, 3000, 600), degraded: { requested: 'continue', actual: 'fresh', reason: 'the session file is gone' } }),
    segment('inv-0007', 'ses-0005', { startContext: 10_000, usage: use(3000, 30_000, 1000, 4000) }),
    segment('inv-0008', 'ses-0005', { requested: 'continue', actual: 'continue', continues: 'repair', previous: 'inv-0007', startContext: 15_000, usage: use(500, 40_000, 200, 1000) }),
    segment('inv-0009', 'ses-0006', { startContext: 12_000, usage: use(2000, 20_000, 800, 3000) }),
    segment('inv-0010', 'ses-0007', { role: 'global-fork', startContext: 18_000, usage: use(5000, 0, 6000, 1500) }),
    segment('inv-0011', 'ses-0008', { role: 'global-fork', requested: 'fork', actual: 'fresh', source: { session: 'ses-0007', role: 'global-fork' }, generation: 2, startContext: 9000, usage: use(4000, 0, 4000, 1000), degraded: { requested: 'fork', actual: 'fresh', reason: 'this executor cannot fork' } }),
  ],
};
function computed(value = inputs): LineageMetric[] {
  const metrics = lineageMetrics(value);
  expect(metrics).toEqual(baselineLineage(value));
  metrics.forEach(metric => lineageMetricSchema.parse(metric));
  return metrics;
}
function find(metrics: readonly LineageMetric[], id: string): LineageMetric {
  const result = metrics.find(metric => metric.id === id);
  if (result === undefined) throw new Error(`missing ${id}`);
  return result;
}
describe('ST13 recorded-fact equivalents of projection calculations', () => {
  test('a fork\'s inherited context and cost by generation, beside the global forks that started fresh', () => {
    const metrics = computed();
    expect(find(metrics, 'fork.generation-1.start-context')).toMatchObject({ state: 'measured', value: 25_000, numerator: 50_000, denominator: 2, coverage: { covered: 2, total: 2 }, evidence: ['inv-0002 (ses-0002): 24000', 'inv-0003 (ses-0003): 26000'] });
    for (const [name, value] of [['input', 300], ['cache-read', 21_000], ['cache-write', 400], ['output', 1000]] as const) expect(find(metrics, `fork.generation-1.${name}`)).toMatchObject({ state: 'measured', value });
    expect(find(metrics, 'fork.generation-2.start-context')).toMatchObject({ state: 'not-applicable', value: null, coverage: { covered: 0, total: 0 }, note: 'No fork of generation 2 ended' });
    expect(find(metrics, 'fresh-fork.start-context')).toMatchObject({ state: 'measured', value: 13_500, numerator: 27_000, denominator: 2 });
    for (const [name, value] of [['input', 4500], ['cache-read', 0], ['cache-write', 5000], ['output', 1250]] as const) expect(find(metrics, `fresh-fork.${name}`)).toMatchObject({ state: 'measured', value });
    expect(find(metrics, 'fresh-fork.cache-read').numerator).toBe(0);
  });
  test('a continued session\'s growth: each continuation\'s start less its previous segment\'s, a degraded one excluded', () => {
    expect(find(computed(), 'continuation-growth')).toMatchObject({ state: 'measured', unit: 'tokens per continuation', value: 4000, numerator: 8000, denominator: 2, coverage: { covered: 2, total: 2 }, evidence: ['inv-0005 (ses-0004): 3000', 'inv-0008 (ses-0005): 5000'] });
  });
  test('a repair segment\'s cost, beside the engineer segments that started fresh', () => {
    const metrics = computed();
    expect(find(metrics, 'repair.start-context')).toMatchObject({ state: 'measured', value: 15_000, denominator: 1 });
    expect(find(metrics, 'repair.cache-read')).toMatchObject({ state: 'measured', value: 40_000 });
    expect(find(metrics, 'repair.output')).toMatchObject({ state: 'measured', value: 1000 });
    expect(find(metrics, 'fresh-engineer.start-context')).toMatchObject({ state: 'measured', value: 11_000, denominator: 2 });
    for (const [name, value] of [['input', 2500], ['cache-read', 25_000], ['cache-write', 900], ['output', 3500]] as const) expect(find(metrics, `fresh-engineer.${name}`)).toMatchObject({ state: 'measured', value });
  });
  test('degraded starts by requested relation, with the executor\'s reasons', () => {
    const metrics = computed();
    expect(find(metrics, 'degraded-starts')).toMatchObject({ state: 'measured', numerator: 2, denominator: 6, coverage: { covered: 6, total: 6 }, evidence: ['continue made fresh: the session file is gone (inv-0006)', 'fork made fresh: this executor cannot fork (inv-0011)'] });
    expect(find(metrics, 'degraded-starts').value).toBeCloseTo(1 / 3);
    expect(find(metrics, 'degraded-starts.continue')).toMatchObject({ state: 'measured', numerator: 1, denominator: 3 });
    expect(find(metrics, 'degraded-starts.fork')).toMatchObject({ state: 'measured', numerator: 1, denominator: 3 });
  });
  test('separate fresh fallback invocations retain their requested start without a fork relation', () => {
    const metrics = computed({ generations: [1], sessions: [], segments: [
      segment('inv-0010', 'ses-0010', { role: 'global-fork', requested: 'fork', actual: 'fresh', startContext: 100, usage: use(10, 0, 0, 1), degraded: { requested: 'fork', actual: 'fresh', reason: 'retained parent unavailable' } }),
      segment('inv-0011', 'ses-0011', { requested: 'continue', actual: 'fresh', startContext: 200, usage: use(20, 0, 0, 2), degraded: { requested: 'continue', actual: 'fresh', reason: 'retained work session unavailable' } }),
    ] });
    expect(find(metrics, 'degraded-starts')).toMatchObject({ state: 'measured', value: 1, numerator: 2, denominator: 2 });
    expect(find(metrics, 'degraded-starts.fork')).toMatchObject({ state: 'measured', value: 1, numerator: 1, denominator: 1 });
    expect(find(metrics, 'degraded-starts.continue')).toMatchObject({ state: 'measured', value: 1, numerator: 1, denominator: 1 });
    expect(find(metrics, 'fresh-fork.input')).toMatchObject({ state: 'measured', value: 10 });
    expect(find(metrics, 'fresh-engineer.input')).toMatchObject({ state: 'measured', value: 20 });
  });
  test('replacements by reason, and the forks each context generation served', () => {
    const metrics = computed();
    expect(find(metrics, 'replacements.reconstructed')).toMatchObject({ state: 'measured', value: 1 / 8, numerator: 1, denominator: 8, evidence: ['ses-0006 in place of ses-0005'] });
    expect(find(metrics, 'replacements.context-rebuilt')).toMatchObject({ state: 'measured', numerator: 1, denominator: 8, evidence: ['ses-0007 in place of ses-0001'] });
    expect(find(metrics, 'forks-served.generation-1')).toMatchObject({ state: 'measured', value: 2, evidence: ['ses-0002 (inv-0002)', 'ses-0003 (inv-0003)'] });
    expect(find(metrics, 'forks-served.generation-2')).toMatchObject({ state: 'measured', value: 0, evidence: ['ses-0008 (inv-0011) asked for a fork and started fresh'] });
  });
  test('the measurements come in the glossary\'s order, and every one is valid under lineage/2', () => {
    const metrics = computed();
    const profile = (prefix: string) => ['start-context', 'input', 'cache-read', 'cache-write', 'output'].map(name => `${prefix}.${name}`);
    expect(metrics.map(metric => metric.id)).toEqual([...profile('fork.generation-1'), ...profile('fork.generation-2'), ...profile('fork.local'), ...profile('fresh-fork'),
      'continuation-growth', ...profile('repair'), ...profile('fresh-engineer'), 'degraded-starts', 'degraded-starts.continue', 'degraded-starts.fork',
      'replacements.reconstructed', 'replacements.context-rebuilt', 'forks-served.generation-1', 'forks-served.generation-2', 'forks-served.local']);
    expect(metrics.every(metric => metric.policyVersion === 'lineage/2' && metric.measurementPolicy === null)).toBe(true);
    expect(find(metrics, 'fork.local.start-context')).toMatchObject({ state: 'not-applicable', note: 'No fork of a local session ended' });
    expect(find(metrics, 'forks-served.local')).toMatchObject({ state: 'measured', value: 0 });
  });
  test('a fork of a local session is measured in the local group, not in any generation\'s', () => {
    const metrics = computed({ generations: [1], sessions: [], segments: [segment('inv-0003', 'ses-0003', { role: 'reviewer', requested: 'fork', actual: 'fork', source: { session: 'ses-0002', role: 'local-architect' }, startContext: 13_000, usage: use(150, 12_000, 400, 300) })] });
    expect(find(metrics, 'fork.local.start-context')).toMatchObject({ state: 'measured', value: 13_000, numerator: 13_000, denominator: 1, coverage: { covered: 1, total: 1 }, evidence: ['inv-0003 (ses-0003): 13000'] });
    for (const [name, value] of [['input', 150], ['cache-read', 12_000], ['cache-write', 400], ['output', 300]] as const) expect(find(metrics, `fork.local.${name}`)).toMatchObject({ state: 'measured', value });
    expect(find(metrics, 'forks-served.local')).toMatchObject({ state: 'measured', value: 1, evidence: ['ses-0003 (inv-0003) from ses-0002'] });
    expect(find(metrics, 'fork.generation-1.start-context')).toMatchObject({ state: 'not-applicable' });
    expect(find(metrics, 'forks-served.generation-1')).toMatchObject({ state: 'measured', value: 0 });
  });
});
const missing: LineageInputs = { generations: [1], sessions: [], segments: [
  segment('inv-0002', 'ses-0002', { role: 'global-fork', requested: 'fork', actual: 'fork', generation: 1, startContext: { unavailable: 'it recorded no context observation: the executor reports no context size' }, usage: use(200, 20_000, 300, 800) }),
  segment('inv-0003', 'ses-0003', { role: 'global-fork', requested: 'fork', actual: null, generation: 1, unknown: 'its outcome records no start: The harness stopped while this invocation was running.', startContext: 25_000, usage: { unavailable: 'the harness stopped while the session was running' } }),
  segment('inv-0004', 'ses-0004', { role: 'global-fork', requested: 'fork', actual: 'fork', generation: 1, startContext: 30_000, usage: use(400, 22_000, 500, 1200) }),
  segment('inv-0005', 'ses-0005', { startContext: { unavailable: 'it recorded no context observation' }, usage: use(3000, 30_000, 1000, 4000) }),
  segment('inv-0006', 'ses-0005', { requested: 'continue', actual: 'continue', continues: 'repair', previous: 'inv-0005', startContext: 9000, usage: { unavailable: 'the session reported no usage' } }),
] };
describe('ST13 missing evidence', () => {
  test('a fork\'s start context: the known subtotal and coverage, and each missing input with its reason', () => {
    const metrics = computed(missing);
    expect(find(metrics, 'fork.generation-1.start-context')).toMatchObject({ state: 'unavailable', value: null, numerator: null, subtotal: 30_000, coverage: { covered: 1, total: 3 }, evidence: [
      'inv-0002 (ses-0002): it recorded no context observation: the executor reports no context size',
      'inv-0003 (ses-0003): its start is unknown: its outcome records no start: The harness stopped while this invocation was running.', 'inv-0004 (ses-0004): 30000'] });
    expect(find(metrics, 'fork.generation-1.cache-read')).toMatchObject({ state: 'unavailable', subtotal: 42_000, coverage: { covered: 2, total: 3 } });
  });
  test('a continuation whose previous segment has no start context has no growth', () => {
    const metrics = computed(missing);
    expect(find(metrics, 'continuation-growth')).toMatchObject({ state: 'unavailable', value: null, subtotal: null, coverage: { covered: 0, total: 1 }, evidence: ['inv-0006 (ses-0005): its previous segment inv-0005: it recorded no context observation'] });
    expect(find(metrics, 'repair.start-context')).toMatchObject({ state: 'measured', value: 9000 });
    expect(find(metrics, 'repair.output')).toMatchObject({ state: 'unavailable', subtotal: null, evidence: ['inv-0006 (ses-0005): the session reported no usage'] });
  });
  test('a fork whose start is unknown makes the degraded-start rate and the forks served partial', () => {
    const metrics = computed(missing);
    expect(find(metrics, 'degraded-starts.fork')).toMatchObject({ state: 'partial', value: null, numerator: 0, denominator: 2, coverage: { covered: 2, total: 3 } });
    expect(find(metrics, 'forks-served.generation-1')).toMatchObject({ state: 'partial', value: null, numerator: 2, coverage: { covered: 2, total: 3 } });
  });
  test('a group with no segment is not applicable, and a run without a rebuild has no generation 2', () => {
    const metrics = computed(missing);
    for (const id of ['fresh-fork.start-context', 'fresh-fork.output']) expect(find(metrics, id)).toMatchObject({ state: 'not-applicable', value: null, note: 'No global fork started fresh' });
    expect(find(metrics, 'degraded-starts.continue')).toMatchObject({ state: 'measured', value: 0, numerator: 0, denominator: 1 });
    expect(metrics.some(metric => metric.id.includes('generation-2'))).toBe(false);
  });
  test('unended segments are excluded and a wholly unknown requested start is unavailable', () => {
    const metrics = computed({ generations: [1], sessions: [], segments: [segment('running', 's', { ended: false, requested: 'fork', actual: 'fork', generation: 1 }), segment('unknown', 'u', { requested: 'continue', actual: null })] });
    expect(find(metrics, 'degraded-starts.continue')).toMatchObject({ state: 'unavailable', coverage: { covered: 0, total: 1 } });
    expect(find(metrics, 'forks-served.generation-1')).toMatchObject({ state: 'measured', value: 0 });
    expect(find(metrics, 'replacements.reconstructed')).toMatchObject({ state: 'not-applicable', denominator: 0 });
  });
});
