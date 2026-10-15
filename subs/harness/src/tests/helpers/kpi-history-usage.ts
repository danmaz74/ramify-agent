import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { RunQueries, type RunSource } from '../../../subs/projections/src/queries.js';
import { SessionQueries } from '../../../subs/projections/src/session-queries.js';
import { createQuerySource } from '../../http/query-source.js';
import { invocationSchema, invocationOutcomeSchema, runLayout, type Invocation } from '../../run/records.js';
import type { Role } from '../../interfaces/protocol/runs.js';
import { observationSchema, type Observation } from '../../run/observations.js';
import { constructedRun, constructedRecord, hash, runId, type Line } from './constructed.js';
import { size, find } from './metric-fixtures.js';

const at = (n: number) => new Date(Date.parse('2026-09-21T08:00:00Z') + n * 1000).toISOString();
const usage = { input: 100, cacheRead: 40, cacheWrite: 10, output: 20, total: 170 };
const charge = { model: 'fixed/model', currency: 'USD', source: 'estimated-from-recorded-rates', sourceRevision: 'recorded-rates/1',
  newInputTokens: 100, cachedInputTokens: 40, cacheWriteTokens: 10, outputTokens: 20,
  ratesPerMillion: { newInput: 2, cachedInput: 0.5, cacheWrite: 3, output: null },
  newInput: 0.0002, cachedInput: 0.00002, cacheWrite: 0.00003, output: null, total: null, coverage: ['output rate absent'] };

/** Historical supported records: no operation ledger is claimed. All request,
 * outcome, session and observation identities are recorded by this harness fixture. */
export async function historyUsageFixture(kind: 'lineage' | 'usage') {
  const directory = await mkdtemp(join(tmpdir(), 'kpi-history-usage-'));
  const lines: Line[] = [{ type: 'job-started', data: {} }];
  const requests: Invocation[] = [];
  async function segment(n: number, session: string, role: Role, requested: 'fresh' | 'continued' | 'fork', actual: 'fresh' | 'fork' | null, kept: boolean, relation?: object) {
    const id = `inv-000${n}`;
    const invocation = invocationSchema.parse({ schema: 'ramify-agent.invocation/1', id, role, work: {}, attempt: n,
      session: { requested, actual: actual ?? requested, ref: requested === 'continued' ? 'point-1' : '', ...(requested === 'fork' ? { from: n === 3 ? 'point-1' : 'point-4' } : {}) },
      prompt: { package: role, hash, inputsHash: hash }, scope: { write: null, measurement: null, size: size(n * 100) }, writer: false, base: 'b'.repeat(40), startedAt: at(lines.length) });
    const degraded = requested === 'continued' ? { requested: 'continue' as const, actual: 'fresh' as const, reason: 'retained session unavailable' } : undefined;
    const outcome = invocationOutcomeSchema.parse({ schema: 'ramify-agent.invocation-outcome/1', invocation: id,
      ended: actual === null ? 'failed' : 'submitted', rejectedSubmissions: 0, disposition: actual === null ? 'incomplete' : 'applied',
      ...(actual === null ? { interruption: 'session-lost', error: 'start not observed' } : { session: { ref: `point-${n}`, mode: actual, ...(degraded ? { degradedReason: degraded.reason } : {}) } }),
      submission: null, settled: { confirmed: true, at: at(lines.length + 1), groupsKilled: 0, lateWrites: [] }, outsideScope: [], usage, elapsedMs: 1000 });
    if (actual !== null) assert.equal(invocation.session.actual, outcome.session!.mode);
    if (degraded) assert.deepEqual([invocation.session.requested, outcome.session!.mode], ['continued', 'fresh']);
    assert.equal(usage.total, usage.input + usage.cacheRead + usage.cacheWrite + usage.output);
    assert.ok(Date.parse(outcome.settled.at) >= Date.parse(invocation.startedAt));
    if (actual === null) assert.equal(outcome.session, undefined); // A request is not an observed start.
    requests.push(invocation);
    lines.push({ type: 'invocation-started', data: { invocation: id, session, role, work: {}, start: requested === 'continued' ? 'continued' : 'opened', ...(relation ? { continues: relation } : {}) }, records: [{ path: runLayout.invocation(id), body: invocation }] },
      { type: 'invocation-ended', data: { invocation: id, session, ended: outcome.ended, submission: null, kept, ...(!kept ? { finished: actual === null ? 'interrupted' : 'work-closed' } : {}), ...(degraded ? { degraded } : {}) }, records: [{ path: runLayout.outcome(id), body: outcome }] });
    const observations: Observation[] = kind === 'usage' ? usageRows() : [observationSchema.parse({ n: 1, at: at(lines.length - 2), type: 'context', data: { tokens: n * 1000, window: 200000, threshold: 150000 } })];
    const path = join(directory, runLayout.observations(id)); await mkdir(dirname(path), { recursive: true });
    await writeFile(path, observations.map(row => JSON.stringify(row) + '\n').join(''));
  }
  function opened(session: string, role: Role, fork?: object) { lines.push({ type: 'session-opened', data: { session, role, work: {}, executor: 'scripted', model: 'recorded-model', ...(fork ? { fork } : {}) } }); }
  if (kind === 'lineage') {
    opened('ses-0001', 'local-architect'); await segment(1, 'ses-0001', 'local-architect', 'fresh', 'fresh', true);
    await segment(2, 'ses-0001', 'local-architect', 'continued', 'fresh', false, { from: { session: 'ses-0001', invocation: 'inv-0001' }, reason: 'iteration-closed', briefs: [] });
    opened('ses-0002', 'reviewer', { from: { session: 'ses-0001', invocation: 'inv-0001' }, reason: 'scope-review', briefs: [] });
    await segment(3, 'ses-0002', 'reviewer', 'fork', 'fork', false);
    opened('ses-0003', 'initial-architect'); await segment(4, 'ses-0003', 'initial-architect', 'fresh', 'fresh', true);
    opened('ses-0004', 'global-fork', { from: { session: 'ses-0003', invocation: 'inv-0004' }, reason: 'placement-request', generation: 1, briefs: [] });
    await segment(5, 'ses-0004', 'global-fork', 'fork', null, false);
  } else { opened('ses-0001', 'engineer'); await segment(1, 'ses-0001', 'engineer', 'fresh', 'fresh', false); }
  const record = constructedRecord();
  const run = constructedRun(lines, record, directory);
  const source: RunSource = { projectRoot: directory, agentName: 'scripted', committed: (p, r) => p === record.planId && r === runId ? run : undefined, committedRuns: () => [run], runVersions: () => [{ planId: record.planId, runId, version: lines.length }] };
  const querySource = createQuerySource(source);
  const queries = new RunQueries(querySource), sessions = new SessionQueries(querySource);
  async function exercise() { return { metrics: await queries.metrics(record.planId, runId), sessions: await sessions.runSessions(record.planId, runId) }; }
  return { exercise, requests, close: () => rm(directory, { recursive: true, force: true }) };
}
function usageRows(): Observation[] {
  const row = (n: number, sourceId: string, type: string, data: unknown) => observationSchema.parse({ n, at: at(3), sourceId, type, data });
  const search = row(2, 'search-original', 'exploration', { id: 'search-original', invocationId: 'inv-0001', operationId: 'inv-0001', role: 'engineer', sessionId: 'ses-0001', turn: 1, kind: 'search', callId: 'search', requestedScope: ['src'], resolvedScope: null, returnedBytes: 0, files: [], startedAt: at(2), endedAt: at(3), elapsedMs: 1000, outcome: 'completed', broad: null, outsideScope: null, coverage: ['Declared search scope unavailable'] });
  assert.equal(search.type, 'exploration');
  if (search.type !== 'exploration') throw new Error('fixture search missing');
  // Two originals: one replay is identical, the other identity conflicts and
  // remains excluded even when a later row replays its original bytes.
  const conflict = { ...search, n: 4, sourceId: 'search-conflict', data: { ...search.data, id: 'search-conflict', callId: 'other-search' } };
  assert.equal(charge.newInput, usage.input * charge.ratesPerMillion.newInput / 1_000_000);
  assert.equal(charge.cachedInput, usage.cacheRead * charge.ratesPerMillion.cachedInput / 1_000_000);
  assert.equal(charge.cacheWrite, usage.cacheWrite * charge.ratesPerMillion.cacheWrite / 1_000_000);
  assert.equal(charge.output, null); assert.equal(charge.ratesPerMillion.output, null);
  assert.deepEqual([search.data.invocationId, search.data.operationId, search.data.sessionId], ['inv-0001', 'inv-0001', 'ses-0001']);
  return [row(1, 'usage-original', 'usage', { usage, charge, modelElapsedMs: 120 }), search, { ...search, n: 3 }, conflict,
    observationSchema.parse({ ...conflict, n: 5, data: { ...conflict.data, returnedBytes: 1 } }), { ...conflict, n: 6 }];
}
export function assertLineage(result: Awaited<ReturnType<Awaited<ReturnType<typeof historyUsageFixture>>['exercise']>>) {
  const metric = (id: string) => { const value = result.metrics.lineage.metrics.find(row => row.id === id); assert.ok(value, id); return value; };
  const degraded = metric('degraded-starts.continue');
  assert.deepEqual([degraded.state, degraded.value, degraded.numerator, degraded.denominator], ['measured', 1, 1, 1]);
  assert.ok(degraded.evidence.some(text => text.includes('retained session unavailable')));
  const total = find(result.metrics.metrics, 'session-weighted-total');
  // Four harness sessions, but five actual histories: the fallback loads 200
  // bytes separately, rather than taking max(100,200) for ses-0001.
  assert.equal(find(result.metrics.metrics, 'session-count').value, 4);
  assert.equal(total.subtotal, 100 + 200 + 300 + 400 + 500);
  assert.deepEqual(total.coverage, { covered: 5, total: 5 });
  assert.ok(total.evidence.some(text => text.includes('a continued start the executor made fresh')));
  const local = metric('fork.local.start-context');
  assert.deepEqual([local.state, local.value, local.denominator], ['measured', 3000, 1]);
  assert.equal(metric('forks-served.local').value, 1);
  const unknown = metric('fork.generation-1.start-context');
  assert.equal(unknown.state, 'unavailable'); assert.equal(unknown.value, null);
  assert.deepEqual(unknown.coverage, { covered: 0, total: 1 });
  assert.ok(unknown.evidence.some(text => text.includes('start not observed')));
  assert.equal(metric('forks-served.generation-1').state, 'partial');
  assert.deepEqual(metric('degraded-starts.fork').coverage, { covered: 1, total: 2 });
  assert.equal(metric('degraded-starts.fork').state, 'partial');
  const [localSession, review, global, lost] = result.sessions.sessions;
  assert.deepEqual(localSession!.invocations.map(row => row.invocation), ['inv-0001', 'inv-0002']);
  assert.deepEqual(localSession!.invocations[1]!.degraded, { requested: 'continue', actual: 'fresh', reason: 'retained session unavailable' });
  assert.deepEqual(localSession!.invocations.map(row => row.evaluation?.efficiency?.declared?.bytes), [100, 200]);
  assert.deepEqual(review!.lineage.fork?.from, { session: 'ses-0001', invocation: 'inv-0001' });
  assert.equal(review!.lineage.fork?.generation, undefined);
  assert.equal(global!.session, 'ses-0003'); assert.equal(lost!.lineage.fork?.generation, 1);
  assert.equal(lost!.invocations[0]!.outcome, 'failed'); assert.equal(lost!.invocations[0]!.degraded, null);
}
export function assertUsage(result: Awaited<ReturnType<Awaited<ReturnType<typeof historyUsageFixture>>['exercise']>>) {
  const evaluation = result.sessions.sessions[0]!.invocations[0]!.evaluation!;
  assert.deepEqual(evaluation, result.metrics.evaluation.invocations[0]);
  assert.deepEqual(evaluation.usage, { input: 100, cacheRead: 40, cacheWrite: 10, output: 20 });
  const efficiency = evaluation.efficiency!;
  assert.deepEqual(efficiency.charges, [charge]);
  assert.equal(efficiency.chargeTotal, null); assert.ok(Math.abs(efficiency.chargeSubtotal! - 0.00025) < 1e-12);
  assert.deepEqual(efficiency.charges[0]!.coverage, ['output rate absent']);
  for (const [category, value] of [['input', 100], ['cache-read', 40], ['cache-write', 10], ['output', 20]] as const) assert.equal(find(result.metrics.metrics, `usage-tokens.${category}`).value, value);
  assert.equal(efficiency.exploration.metrics.searches, 1);
  assert.equal(efficiency.exploration.observations.length, 1);
  assert.equal(efficiency.exploration.observations[0]!.outsideScope, null);
  assert.deepEqual(efficiency.exploration.searches!.outsideScope, { state: 'unavailable', known: 0, coverage: { covered: 0, total: 1 } });
  const reason = 'exploration:search-conflict: conflicting source observation; excluded';
  assert.ok(efficiency.coverage.includes(reason)); assert.ok(efficiency.exploration.metrics.coverage.includes(reason));
}
