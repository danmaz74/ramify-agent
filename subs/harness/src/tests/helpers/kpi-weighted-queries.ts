import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { RunQueries, type RunSource } from '../../../subs/projections/src/queries.js';
import type { CandidateSource, ChangeHistory, LineRange } from '../../../subs/evidence/src/git.js';
import { createQuerySource } from '../../http/query-source.js';
import { observationSchema } from '../../run/observations.js';
import { metricsResponseSchema } from '../../interfaces/protocol/runs.js';
import { invocationSchema, invocationOutcomeSchema, measurementSnapshotSchema, lineEventSummarySchema, gateAttemptSchema, runLayout } from '../../run/records.js';
import { constructedRecord, constructedRun, hash, runId, type Line } from './constructed.js';
import { size, usage, find } from './metric-fixtures.js';

const base = 'b'.repeat(40), first = '1'.repeat(40), final = '2'.repeat(40);
const revisions = [base, first, final];
const paths = ['subs/a/src/new.ts', 'subs/b/src/new.ts'];
const originalTree = { 'subs/a/src/existing.ts': 'a'.repeat(999) + '\n', 'subs/b/src/existing.ts': 'b'.repeat(2999) + '\n', 'src/existing.ts': 'c'.repeat(5999) + '\n' };
const charge = { model: 'fixed/model', currency: 'USD' as const, source: 'estimated-from-recorded-rates' as const, sourceRevision: 'fixture-rates/1',
  newInputTokens: 100, cachedInputTokens: 1000, cacheWriteTokens: 50, outputTokens: 10,
  ratesPerMillion: { newInput: 1, cachedInput: 1, cacheWrite: 1, output: 1 },
  newInput: 0.0001, cachedInput: 0.001, cacheWrite: 0.00005, output: 0.00001,
  total: 0.0001 + 0.001 + 0.00005 + 0.00001, coverage: [] };
const work = { workItem: 'wi-001', iteration: 'wi-001.i01' };
export type WeightedCase = 'complete' | 'missing' | 'zero';

/** Only external Git facts are scripted. These are complete trees: two added files,
 * no setup commits, removals, rewrites, ignored paths or hidden intermediate edits. */
export class FakeWeightedHistory implements ChangeHistory {
  readonly calls: string[] = [];
  readonly weights: readonly number[];
  readonly trees: Record<string, Record<string, string>>;
  constructor(readonly root: string, mode: WeightedCase, readonly fail = false) {
    this.weights = mode === 'zero' ? [0, 0] : mode === 'missing' ? [10, 3] : [10, 30];
    const text = (n: number, name: string) => Array.from({ length: n }, (_, i) => `${name}-${i + 1}\n`).join('');
    this.trees = { [base]: { ...originalTree }, [first]: { ...originalTree }, [final]: { ...originalTree } };
    this.weights.forEach((n, i) => { if (n) { this.trees[final]![paths[i]!] = text(n, paths[i]!); if (i === 0) this.trees[first]![paths[i]!] = text(n, paths[i]!); } });
  }
  range(root: string, from: string, to: string) { assert.deepEqual([root, from, to], [this.root, base, final]); }
  async commitsBetween(root: string, from: string, to: string) {
    this.range(root, from, to); this.calls.push('commits');
    if (this.fail) throw new Error('external weighted history read failed');
    return [first, final];
  }
  async changedFiles(root: string, from: string, to: string) {
    this.range(root, from, to); this.calls.push('files');
    return paths.flatMap((path, i) => this.weights[i] ? [{ before: null, after: path, binary: false, added: [[1, this.weights[i]!] as const], deleted: [] }] : []);
  }
  async lineOrigins(root: string, from: string, to: string, path: string, ranges: readonly LineRange[]) {
    this.range(root, from, to); const i = paths.indexOf(path); assert.ok(i >= 0);
    assert.deepEqual(ranges, [[1, this.weights[i]]]); this.calls.push(`origins ${path}`);
    const introducing = i === 0 ? first : final, previous = i === 0 ? base : first;
    assert.equal(this.trees[previous]![path], undefined);
    assert.equal(this.trees[introducing]![path], this.trees[final]![path]);
    assert.equal(this.trees[final]![path]!.split('\n').filter(Boolean).length, this.weights[i]);
    return Array.from({ length: this.weights[i]! }, (_, n) => ({ line: n + 1, commit: introducing, boundary: false, sourcePath: path, sourceLine: n + 1, projectPrefix: '' }));
  }
  async lineLastSeen(): Promise<never> { throw new Error('unscripted removals: fixture adds files only'); }
}

export class FakeWeightedCandidates implements CandidateSource {
  constructor(readonly facts: FakeWeightedHistory) {}
  async treeEntries(root: string, revision: string) {
    assert.equal(root, this.facts.root); assert.ok(revisions.includes(revision));
    return Object.entries(this.facts.trees[revision]!).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([path, text]) => ({ path, kind: 'file' as const, bytes: Buffer.byteLength(text), objectId: createHash('sha1').update(`blob ${Buffer.byteLength(text)}\0${text}`).digest('hex') }));
  }
  async readBlob(root: string, revision: string, path: string) {
    assert.equal(root, this.facts.root); const text = this.facts.trees[revision]?.[path]; assert.notEqual(text, undefined); return text!;
  }
  async commitTree(): Promise<never> { throw new Error('unscripted commitTree'); }
  async grepTree(): Promise<never> { throw new Error('unscripted grepTree'); }
  async diffNameStatus(): Promise<never> { throw new Error('unscripted diffNameStatus'); }
  async diffPatch(): Promise<never> { throw new Error('unscripted diffPatch'); }
}

export async function weightedQueryFixture(mode: WeightedCase) {
  const root = await mkdtemp(join(tmpdir(), 'weighted-public-query-'));
  const history = new FakeWeightedHistory(root, mode);
  const bucket = (bytes: number, files = 1) => ({ production: { sourceFiles: files, sourceBytes: bytes, resourceFiles: 0, resourceBytes: 0 }, tests: { sourceFiles: 0, sourceBytes: 0, resourceFiles: 0, resourceBytes: 0 }, documentation: { files: 0, bytes: 0 }, views: { ordinaryBytes: 0, testsBytes: 0 } });
  const document = { schema: 'ramify.measure/2', revision: 'rev/1:scripted:1', root, ownershipRule: 'nearest', views: 'measured', modules: [
    { id: 'p', dir: '', parent: null, exact: bucket(6000), subtree: bucket(10000, 3) },
    { id: 'p/a', dir: 'subs/a', parent: 'p', exact: bucket(1000), subtree: bucket(1000) },
    { id: 'p/b', dir: 'subs/b', parent: 'p', exact: bucket(3000), subtree: bucket(3000) },
  ], files: [] };
  assert.equal(Object.values(history.trees[base]!).reduce((n, text) => n + Buffer.byteLength(text), 0), 10000);
  const snapshot = measurementSnapshotSchema.parse({ schema: 'ramify-agent.measurement-snapshot/1', id: 'ms-0001', policy: 'scope-size/2', head: base,
    measure: { revision: document.revision, hash: createHash('sha256').update(JSON.stringify(document)).digest('hex'), document },
    view: null, supplementary: [{ path: '.ramify-architect', bytes: 0 }] });
  const snapshotHash = createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');
  async function persist(path: string, body: unknown) { const file = join(root, path); await mkdir(dirname(file), { recursive: true }); await writeFile(file, JSON.stringify(body)); }
  await persist(runLayout.measurement(snapshot.id), snapshot);
  const lines: Line[] = [{ type: 'job-started', data: {}, records: [{ path: runLayout.measurement(snapshot.id), body: snapshot }] }];
  const scopes = [size(1000), mode === 'missing' ? size(null, 'owned-source') : size(3000)];
  scopes.forEach((scope, i) => { scope.components[0]!.detail = `p/${i === 0 ? 'a' : 'b'}`; });
  // The baseline is measured, but this invocation's source-size observation was lost.
  // This is unknown evidence, not a claim that its module or bytes do not exist.
  if (mode === 'missing') scopes[1]!.components[0]!.reason = 'writer source size was not captured';
  for (let i = 0; i < 2; i++) {
    const id = `inv-000${i + 1}`, session = `ses-000${i + 1}`, commit = i === 0 ? first : final;
    const startedAt = `2026-09-21T08:00:0${2 + i * 4}.000Z`, endedAt = `2026-09-21T08:00:0${3 + i * 4}.000Z`;
    const invocation = invocationSchema.parse({ schema: 'ramify-agent.invocation/1', id, role: 'engineer', work, attempt: 1,
      session: { requested: 'fresh', actual: 'fresh', ref: '' }, prompt: { package: 'engineer', hash, inputsHash: hash },
      scope: { write: null, measurement: { id: snapshot.id, revision: 1, hash: snapshotHash }, size: scopes[i] }, writer: true, base: i === 0 ? base : first, startedAt });
    const outcome = invocationOutcomeSchema.parse({ schema: 'ramify-agent.invocation-outcome/1', invocation: id, ended: 'submitted', rejectedSubmissions: 0, disposition: 'applied', session: { ref: `scripted-${id}`, mode: 'fresh' }, submission: null,
      settled: { confirmed: true, at: endedAt, groupsKilled: 0, lateWrites: [] }, outsideScope: [], usage, elapsedMs: 1000 });
    const lineFacts = lineEventSummarySchema.parse({ schema: 'ramify-agent.line-events/1', invocation: id,
      paths: history.weights[i] ? [{ path: paths[i], owner: i === 0 ? 'p/a' : 'p/b', added: history.weights[i], deleted: 0, binary: false, bytes: Buffer.byteLength(history.trees[commit]![paths[i]!]!) }] : [],
      unmapped: { paths: 0, added: 0, deleted: 0 }, coverage: 'complete', gaps: [] });
    await persist(runLayout.lineEvents(id), lineFacts);
    const observation = observationSchema.parse({ n: 1, at: endedAt, sourceId: `usage-${id}`, type: 'usage', data: { usage, charge, modelElapsedMs: 1 } });
    await writeFile(join(root, 'invocations', id, 'observations.jsonl'), JSON.stringify(observation) + '\n');
    assert.deepEqual([charge.newInputTokens, charge.cachedInputTokens, charge.cacheWriteTokens, charge.outputTokens], [usage.input, usage.cacheRead, usage.cacheWrite, usage.output]);
    assert.equal(charge.total, (100 + 1000 + 50 + 10) / 1_000_000);
    const gate = gateAttemptSchema.parse({ schema: 'ramify-agent.gate-attempt/3', id: `ga-000${i + 1}`, checkpoint: 'iteration', subject: work, proposedBy: id, repairRound: 0, infrastructureAttempt: 0, head: invocation.base, commit, audited: commit, evidence: null, guardedChanges: [], commands: [], verdict: 'passed', cause: null, next: 'accept' });
    lines.push(
      { type: 'session-opened', data: { session, role: 'engineer', work, executor: 'scripted', model: null } },
      { type: 'invocation-started', data: { invocation: id, role: 'engineer', session, work, start: 'opened' }, records: [{ path: runLayout.invocation(id), body: invocation }] },
      { type: 'invocation-ended', data: { invocation: id, session, ended: 'submitted', submission: null, kept: false, finished: 'work-closed' }, records: [{ path: runLayout.outcome(id), body: outcome }] },
      { type: 'gate-attempted', data: { gate: gate.id, checkpoint: 'iteration', verdict: 'passed', next: 'accept' }, records: [{ path: runLayout.gate(gate.id), body: gate }] });
    // Independent factual check: each invocation creates exactly its file in its gate,
    // all lines survive, no other path changes. No KPI output is involved.
    const before = history.trees[invocation.base]!, after = history.trees[commit]!;
    assert.deepEqual(Object.keys(after).filter(path => before[path] !== after[path]), history.weights[i] ? [paths[i]] : []);
    assert.equal((after[paths[i]!] ?? '').split('\n').filter(Boolean).length, history.weights[i]);
    assert.equal(lineFacts.paths.reduce((n, p) => n + p.added + p.deleted, 0), history.weights[i]);
    assert.equal(invocation.scope.size?.bytes, i === 0 ? 1000 : mode === 'missing' ? null : 3000);
    assert.deepEqual(outcome.usage, usage);
  }
  const record = constructedRecord();
  const run = constructedRun(lines, { ...record, baseline: { measurement: { id: snapshot.id, revision: 1, hash: snapshotHash } }, manifest: { ...record.manifest, source: { commit: base, dirty: false } } }, root);
  const source: RunSource = { projectRoot: root, agentName: 'scripted', committed: (p, r) => p === record.planId && r === runId ? run : undefined,
    committedRuns: p => p === record.planId ? [run] : [], runVersions: () => [{ planId: record.planId, runId, version: run.entries.length }], changeHistory: history, candidateSource: new FakeWeightedCandidates(history) };
  let response: ReturnType<typeof metricsResponseSchema.parse> | undefined;
  const current = () => { assert.ok(response, 'query must run first'); return response; };
  const metric = (id: string) => find(current().metrics, id);
  return {
    async exercise() { response = metricsResponseSchema.parse(await new RunQueries(createQuerySource(source)).metrics(record.planId, runId)); },
    arithmetic() {
      assert.deepEqual(current().baseline, { state: 'measured', snapshot: 'ms-0001', bytes: 10000 });
      const m = metric('scope-bytes-per-changed-line');
      assert.equal(1000 * 10 + 3000 * 30, 100000); assert.equal(100000 / (10 + 30), 2500);
      assert.deepEqual([m.state, m.value, m.numerator, m.denominator, m.unit], ['measured', 2500, 100000, 40, 'bytes (change-weighted mean)']);
      assert.deepEqual(m.coverage, { covered: 2, total: 2 });
    },
    ratios() { assert.equal(metric('scope-size-ratio').value, 2500 / 10000); assert.equal(metric('reduction-factor').value, 10000 / 2500); },
    evidence() {
      assert.equal(current().policyVersion, 'kpi/1'); assert.equal(current().measurementPolicy, 'scope-size/2'); assert.equal(current().lineage.policyVersion, 'lineage/2');
      const m = metric('scope-bytes-per-changed-line'); assert.equal(m.policyVersion, 'kpi/1'); assert.equal(m.measurementPolicy, 'scope-size/2');
      assert.deepEqual(m.evidence, [`delivered change ${base.slice(0, 12)}..${final.slice(0, 12)}`, 'inv-0001: w_e = 10 lines, S_e = 1000 bytes', 'inv-0002: w_e = 30 lines, S_e = 3000 bytes']);
      assert.deepEqual(history.calls, ['commits', 'files', 'origins subs/a/src/new.ts', 'origins subs/b/src/new.ts', 'commits', 'files', 'origins subs/a/src/new.ts', 'origins subs/b/src/new.ts']);
      assert.deepEqual(current().evaluation.invocations.map(row => [row.invocation, row.lines?.added, row.lines?.deleted]), [['inv-0001', 10, 0], ['inv-0002', 30, 0]]);
    },
    unavailable() { const m = metric('scope-bytes-per-changed-line'); assert.equal(m.state, 'unavailable'); assert.equal(m.value, null); assert.equal(m.numerator, null); },
    subtotal() { const m = metric('scope-bytes-per-changed-line'); assert.equal(m.subtotal, 1000 * 10); assert.equal(m.denominator, 10); },
    missing() {
      const m = metric('scope-bytes-per-changed-line'); assert.deepEqual(m.coverage, { covered: 1, total: 2 });
      assert.deepEqual(m.evidence, ['inv-0002: w_e = 3 lines, S_e unknown: owned-source unknown: writer source size was not captured', `delivered change ${base.slice(0, 12)}..${final.slice(0, 12)}`, 'inv-0001: w_e = 10 lines, S_e = 1000 bytes', 'inv-0002: known scope subtotal 0 bytes contributes 0 byte-lines; weight 3 lines has incomplete size']);
      assert.equal(current().scopeComparisons?.total.attributedWeight, 13);
      assert.equal(current().scopeComparisons?.total.unknownSizeWeight, 3); assert.equal(current().scopeComparisons?.total.completeSizeWeight, 10);
    },
    notZero() {
      const declared = current().evaluation.invocations.find(row => row.invocation === 'inv-0002')?.efficiency?.declared;
      assert.deepEqual(declared, scopes[1]);
      assert.equal(declared!.bytes, null); assert.equal(declared!.components[0]!.bytes, null); assert.equal(declared!.components[0]!.state, 'unknown');
      assert.notEqual(metric('scope-bytes-per-changed-line').value, 10000 / 13);
    },
    zero() {
      for (const id of ['scope-bytes-per-changed-line', 'scope-size-ratio', 'reduction-factor']) { const m = metric(id); assert.equal(m.state, 'not-applicable', JSON.stringify(m)); assert.equal(m.value, null); }
      assert.equal(current().scopeComparisons?.total.attributedWeight, 0);
      assert.deepEqual(history.trees[base], history.trees[final]);
      assert.deepEqual(history.calls, ['commits', 'files', 'commits', 'files']);
    },
    costs() {
      const m = metric('session-weighted-total'); assert.deepEqual([m.state, m.value, m.numerator, m.denominator, m.policyVersion, m.measurementPolicy], ['measured', 0.4, 4000, 10000, 'kpi/1', 'scope-size/2']);
      assert.equal(metric('session-count').value, 2);
      for (const row of current().evaluation.invocations) {
        assert.ok(row.efficiency); assert.deepEqual(row.efficiency.charges, [charge]);
        assert.equal(row.efficiency.chargeTotal, (100 + 1000 + 50 + 10) / 1_000_000);
        assert.equal(row.efficiency.chargeSubtotal, charge.total); assert.equal(row.efficiency.units.charge, 'USD');
      }
      for (const [id, n] of [['input', 200], ['output', 20], ['cache-read', 2000], ['cache-write', 100]] as const) { const m = metric(`usage-tokens.${id}`); assert.equal(m.state, 'measured'); assert.equal(m.value, n); }
    },
    async failedHistory() {
      const failedHistory = new FakeWeightedHistory(root, mode, true);
      const failed = metricsResponseSchema.parse(await new RunQueries(createQuerySource({ ...source, changeHistory: failedHistory })).metrics(record.planId, runId));
      const m = find(failed.metrics, 'scope-bytes-per-changed-line'); assert.equal(m.state, 'unavailable'); assert.equal(m.value, null); assert.ok(m.evidence.some(line => line.includes('external weighted history read failed')), JSON.stringify(m));
      assert.deepEqual(failedHistory.calls, ['commits']);
      assert.deepEqual(find(failed.metrics, 'session-weighted-total'), metric('session-weighted-total'));
      assert.deepEqual(failed.evaluation.invocations.map(row => row.efficiency?.charges), current().evaluation.invocations.map(row => row.efficiency?.charges));
      assert.deepEqual(failed.evaluation.invocations.map(row => row.efficiency?.chargeTotal), [charge.total, charge.total]);
      assert.deepEqual(failed.evaluation.invocations.map(row => row.efficiency?.chargeSubtotal), [charge.total, charge.total]);
    },
    async close() { await rm(root, { recursive: true, force: true }); },
  };
}
