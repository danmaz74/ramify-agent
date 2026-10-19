import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, expect, test } from 'vitest';
import type { Observation } from '../../../task-execution/src/observations.js';
import { runLayout } from '../../../autonomous/src/run/records.js';
import { invocationSchema, invocationOutcomeSchema } from '../../../task-execution/src/records.js';
import { recordPlan23Stimulus, plan23Identity, type Plan23Stimulus } from '../../../../src/tests/helpers/plan23-recorded.js';
import { constructedRun, hash } from '../../../../src/tests/helpers/constructed.js';
import { runView } from '../inputs.js';
import { metricsOf } from '../metrics.js';

const cleanups: (() => Promise<void>)[] = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0).reverse()) await cleanup(); });
async function fixture(kind: Plan23Stimulus) {
  const f = await recordPlan23Stimulus(kind); cleanups.push(f.cleanup); return f;
}
async function query(rows: readonly Observation[] | null) {
  const directory = await mkdtemp(join(tmpdir(), 'usage-search-query-'));
  cleanups.push(() => rm(directory, { recursive: true, force: true }));
  const id = 'inv-0001';
  const invocation = invocationSchema.parse({ schema: 'ramify-agent.invocation/1', id, role: 'engineer', work: {}, attempt: 1,
    session: { requested: 'fresh', actual: 'fresh', ref: '' }, sessionOperation: plan23Identity,
    prompt: { package: 'engineer', hash, inputsHash: hash }, scope: { write: null, measurement: null, size: null }, writer: false, base: 'b'.repeat(40),
    startedAt: '2026-10-08T00:00:00.000Z' });
  const outcome = invocationOutcomeSchema.parse({ schema: 'ramify-agent.invocation-outcome/1', invocation: id, ended: 'submitted', rejectedSubmissions: 0, disposition: 'applied',
    session: { ref: 'scripted', mode: 'fresh' }, submission: null, settled: { confirmed: true, at: '2026-10-08T00:00:05.000Z', groupsKilled: 0, lateWrites: [] },
    outsideScope: [], usage: { input: 100, cacheRead: 40, cacheWrite: 10, output: 20, total: 170 }, elapsedMs: 5000 });
  if (rows !== null) {
    const path = join(directory, runLayout.observations(id)); await mkdir(dirname(path), { recursive: true });
    await writeFile(path, rows.map(row => JSON.stringify(row) + '\n').join(''));
  }
  const run = constructedRun([
    { type: 'invocation-started', data: { invocation: id, role: 'engineer', session: 'ses-0001', work: {}, start: 'opened' }, records: [{ path: runLayout.invocation(id), body: invocation }] },
    { type: 'invocation-ended', data: { invocation: id, ended: 'submitted', submission: null, session: 'ses-0001', kept: true }, records: [{ path: runLayout.outcome(id), body: outcome }] },
  ], undefined, directory);
  return (await metricsOf(runView(run))).evaluation.invocations[0]!.efficiency!;
}

test('composed query preserves separate recorded usage/rates and unknown complete charge with known components', async () => {
  const f = await fixture('usage');
  const usage = f.rows.find(row => row.type === 'usage')!;
  const full = await query([usage]);
  expect(full.charges[0]).toMatchObject({ newInputTokens: 100, cachedInputTokens: 40, cacheWriteTokens: 10, outputTokens: 20,
    ratesPerMillion: { newInput: 2, cachedInput: 0.5, cacheWrite: 3, output: 4 }, newInput: 0.0002, cachedInput: 0.00002, cacheWrite: 0.00003, output: 0.00008, total: 0.00033 });
  expect(full.chargeTotal).toBeCloseTo(0.00033);
  const partial = await query([{ ...usage, data: { ...usage.data, charge: { ...usage.data.charge!, ratesPerMillion: { ...usage.data.charge!.ratesPerMillion, output: null }, output: null, total: null, coverage: ['output rate absent'] } } }]);
  expect(partial.chargeTotal).toBeNull(); expect(partial.chargeSubtotal).toBeCloseTo(0.00025);
  expect(partial.charges[0]).toMatchObject({ output: null, coverage: ['output rate absent'], newInput: 0.0002, cachedInput: 0.00002, cacheWrite: 0.00003 });
});

test('composed query distinguishes missing observations from zero searches', async () => {
  const zero = await query([]); const missing = await query(null);
  expect(zero.exploration.searches).toMatchObject({ completed: 0, failed: 0, outsideScope: { state: 'not-applicable', known: 0, coverage: { covered: 0, total: 0 } } });
  expect(missing.exploration.metrics.coverage.join('\n')).toContain('cannot be read');
  expect(missing.coverage.join('\n')).toContain('cannot be read');
  expect(missing.chargeTotal).toBeNull();
  const f = await fixture('undeclared');
  const unknown = await query(f.rows);
  expect(unknown.exploration.searches!.outsideScope).toEqual({ state: 'unavailable', known: 0, coverage: { covered: 0, total: 1 } });
  expect(unknown.exploration.observations[0]!.outsideScope).toBeNull();
});

test('composed query deduplicates replayed searches and excludes identity conflict even after another original', async () => {
  const f = await fixture('restoration');
  const search = f.rows.find(row => row.type === 'exploration' && row.data.kind === 'search')!;
  if (search.type !== 'exploration') throw new Error('search fixture missing');
  expect(search.sourceId).toBeDefined();
  const replayed = await query([search, { ...search, n: 100 }]);
  expect(replayed.exploration.metrics.searches).toBe(1);
  const conflicting = await query([search, { ...search, n: 100, data: { ...search.data, returnedBytes: (search.data.returnedBytes ?? 0) + 1 } }, { ...search, n: 101 }]);
  expect(conflicting.exploration.metrics.searches).toBe(0);
  expect(conflicting.exploration.observations).toEqual([]);
  expect(conflicting.coverage).toContain(`exploration:${search.sourceId}: conflicting source observation; excluded`);
  expect(conflicting.exploration.metrics.coverage).toContain(`exploration:${search.sourceId}: conflicting source observation; excluded`);
  expect(conflicting.timing.toolElapsedMs).toBeNull();
  expect(conflicting.chargeTotal).toBeNull();
});
