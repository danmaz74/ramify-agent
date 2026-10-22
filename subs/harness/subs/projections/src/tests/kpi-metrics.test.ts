import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { afterEach, describe, expect, test } from 'vitest';

const directories: string[] = [];
afterEach(async () => { for (const directory of directories.splice(0)) await rm(directory, { recursive: true, force: true }); });
import type { CandidateSource, ChangeHistory, LineCommit } from '../../../evidence/src/git.js';
import { metricSchema } from '../../../../src/interfaces/protocol/runs.js';
import { runView } from '../inputs.js';
import { metricsOf } from '../metrics.js';
import { runLayout } from '../../../autonomous/src/run/records.js';
import { invocationOutcomeSchema, invocationSchema, type ContinueRelation } from '../../../task-execution/src/records.js';
import { constructedRecord, constructedRun, hash, type Line } from '../../../../src/tests/helpers/constructed.js';
import { size, usage, find } from '../../../../src/tests/helpers/metric-fixtures.js';

describe('ST04: the projection groups invocations by the session they started in', () => {
  const work = { workItem: 'wi-001', iteration: 'wi-001.i01' };

  /** One invocation's three lines: its start with its record, and its end with its outcome, ending at an executor ref of its own. */
  function invocationLines(id: string, session: string, bytes: number, ref: string, continues?: ContinueRelation): Line[] {
    const invocation = invocationSchema.parse({
      schema: 'ramify-agent.invocation/1', id, role: 'engineer', work, attempt: 1,
      session: continues === undefined ? { requested: 'fresh', actual: 'fresh', ref: '' } : { requested: 'continued', actual: 'continued', ref: 'scripted-1@4#0', from: 'scripted-1@4#0' },
      prompt: { package: 'engineer', hash, inputsHash: hash },
      scope: { write: null, measurement: null, size: size(bytes) },
      writer: false, base: 'abc', startedAt: '2026-09-21T08:00:00.000Z',
    });
    const outcome = invocationOutcomeSchema.parse({
      schema: 'ramify-agent.invocation-outcome/1', invocation: id, ended: 'submitted', rejectedSubmissions: 0, disposition: 'applied',
      session: { ref, mode: continues === undefined ? 'fresh' : 'continued' }, submission: null,
      settled: { confirmed: true, at: '2026-09-21T08:00:00.000Z', groupsKilled: 0, lateWrites: [] },
      outsideScope: [], usage, elapsedMs: 1,
    });
    return [
      {
        type: 'invocation-started',
        data: { invocation: id, role: 'engineer', session, work, start: continues === undefined ? 'opened' : 'continued', ...(continues === undefined ? {} : { continues }) },
        records: [{ path: runLayout.invocation(id), body: invocation }],
      },
      { type: 'invocation-ended', data: { invocation: id, ended: 'submitted', submission: null, session, kept: true }, records: [{ path: runLayout.outcome(id), body: outcome }] },
    ];
  }

  const opened = (session: string): Line => ({ type: 'session-opened', data: { session, role: 'engineer', work, executor: 'scripted', model: null } });

  test('a continued session counts once in session-weighted-total, at its largest size, although each invocation ends at another ref', async () => {
    const run = constructedRun([
      { type: 'job-started', data: {} },
      opened('ses-0001'),
      ...invocationLines('inv-0001', 'ses-0001', 1000, 'scripted-1@4#0'),
      // The same session, continued for a repair, measured larger, and ending
      // at a ref of its own: a ref names a point, not a session.
      ...invocationLines('inv-0002', 'ses-0001', 3000, 'scripted-1@9#0', { from: { session: 'ses-0001', invocation: 'inv-0001' }, reason: 'repair', briefs: [] }),
      opened('ses-0002'),
      ...invocationLines('inv-0003', 'ses-0002', 500, 'scripted-2@3#0'),
    ]);
    const response = await metricsOf(runView(run));
    for (const metric of response.metrics) metricSchema.parse(metric);

    expect(find(response.metrics, 'session-count')).toMatchObject({
      state: 'measured', value: 2,
      evidence: ['ses-0001: inv-0001 submitted, inv-0002 submitted', 'ses-0002: inv-0003 submitted'],
    });
    // The constructed run froze no baseline, so the total is unavailable and
    // the sum of S_s is its subtotal: ses-0001 at 3000, not 1000 + 3000,
    // and ses-0002 at 500.
    expect(find(response.metrics, 'session-weighted-total')).toMatchObject({
      state: 'unavailable', value: null, subtotal: 3500, coverage: { covered: 2, total: 2 },
    });
  });

  test('a continued start the executor made fresh stays in its session, and counts again in session-weighted-total', async () => {
    const [started, ended] = invocationLines('inv-0002', 'ses-0001', 3000, 'scripted-1@9#0', { from: { session: 'ses-0001', invocation: 'inv-0001' }, reason: 'repair', briefs: [] });
    const run = constructedRun([
      { type: 'job-started', data: {} },
      opened('ses-0001'),
      ...invocationLines('inv-0001', 'ses-0001', 1000, 'scripted-1@4#0'),
      // The executor could not continue, so inv-0002 began a new context:
      // its scope was loaded again, and the session's later segments run in
      // that context.
      started!,
      { ...ended!, data: { ...(ended!.data as object), degraded: { requested: 'continue', actual: 'fresh', reason: 'the session file is gone' } } },
      ...invocationLines('inv-0003', 'ses-0001', 2000, 'scripted-1@12#0', { from: { session: 'ses-0001', invocation: 'inv-0002' }, reason: 'repair', briefs: [] }),
    ]);
    const response = await metricsOf(runView(run));

    expect(find(response.metrics, 'session-count')).toMatchObject({ state: 'measured', value: 1 });
    // ses-0001 at 1000 until the degraded start, then its new context at its
    // largest, 3000: 4000 rather than 3000.
    expect(find(response.metrics, 'session-weighted-total')).toMatchObject({
      state: 'unavailable', subtotal: 4000, coverage: { covered: 2, total: 2 },
      evidence: ['baseline: constructed', 'ses-0001 from inv-0002: a continued start the executor made fresh counts as a term of its own'],
    });
  });
});


describe('the delivered change of a run view, read through a scripted history', () => {
  const B = 'b'.repeat(40), S = 'c'.repeat(40), M = 'd'.repeat(40), G1 = '1'.repeat(40), R = 'e'.repeat(40), G2 = '2'.repeat(40);
  const feature = 'features/a.feature';
  const sha1 = (text: string) => createHash('sha1').update(`blob ${Buffer.byteLength(text)}\0`).update(text).digest('hex');
  /** `.gitignore` at each revision the collector reads: the base, the scratch commit and the final commit. */
  const ignore: Record<string, string> = { [B]: 'dist/\n', [S]: 'dist/\n**/src/tmp/\n', [G2]: 'dist/\n**/src/tmp/\n' };
  const row = (line: number, commit: string, sourceLine = line, sourcePath = '.gitignore'): LineCommit => ({ line, commit, boundary: false, sourceLine, sourcePath, projectPrefix: '' });

  function history(weights = [3, 2]): { history: { projectRoot: string; changes: ChangeHistory; candidates: CandidateSource }; calls: string[] } {
    const calls: string[] = [];
    const answer = <T>(name: string, value: T | undefined): Promise<T> => { calls.push(name); return value === undefined ? Promise.reject(new Error(`unscripted ${name}`)) : Promise.resolve(value); };
    const origins: Record<string, LineCommit[]> = {
      '.gitignore': [row(2, S)],
      // Four lines the materialization added, one of which the rewording rewrote.
      [feature]: [row(3, M, 3, feature), row(4, M, 4, feature), row(5, R, 5, feature), row(6, M, 6, feature)],
      'src/a.ts': Array.from({ length: weights[0]! }, (_, i) => row(i + 1, G1, i + 1, 'src/a.ts')),
      'src/b.ts': Array.from({ length: weights[1]! }, (_, i) => row(i + 1, G2, i + 1, 'src/b.ts')),
    };
    // The feature file's two base lines, its pending tags, were last held by the materialization; the first gate's commit dropped them.
    const seen: Record<string, LineCommit[]> = { [feature]: [row(1, M, 1, feature), row(2, M, 2, feature)] };
    const changes: ChangeHistory = {
      commitsBetween: (root, from, to) => answer(`commits ${from.slice(0, 1)}..${to.slice(0, 1)}`, root === '/project' && from === B && to === G2 ? [S, M, G1, R, G2] : undefined),
      changedFiles: (root, from, to) => answer('files', root === '/project' && from === B && to === G2 ? [
        { before: '.gitignore', after: '.gitignore', binary: false, added: [[2, 1]], deleted: [] },
        { before: feature, after: feature, binary: false, added: [[3, 4]], deleted: [[1, 2]] },
        { before: null, after: 'src/a.ts', binary: false, added: weights[0] === 0 ? [] : [[1, weights[0]!]], deleted: [] },
        { before: null, after: 'src/b.ts', binary: false, added: weights[1] === 0 ? [] : [[1, weights[1]!]], deleted: [] },
        { before: null, after: 'assets/logo.png', binary: true, added: [], deleted: [] },
      ] : undefined),
      lineOrigins: (_root, _from, _to, path) => answer(`origins ${path}`, origins[path]),
      lineLastSeen: (_root, _from, _to, path) => answer(`seen ${path}`, seen[path]),
    };
    const candidates: CandidateSource = {
      async treeEntries(_root, revision) { const text = ignore[revision]; if (text === undefined) throw new Error(`unscripted tree ${revision.slice(0, 1)}`); return [{ path: '.gitignore', kind: 'file', bytes: Buffer.byteLength(text), objectId: sha1(text) }]; },
      async readBlob(_root, revision, path) { if (path !== '.gitignore' || ignore[revision] === undefined) throw new Error(`unscripted blob ${revision.slice(0, 1)}:${path}`); return ignore[revision]!; },
      async commitTree() { throw new Error('unscripted commitTree'); }, async grepTree() { throw new Error('unscripted grepTree'); },
      async diffNameStatus() { throw new Error('unscripted diffNameStatus'); }, async diffPatch() { throw new Error('unscripted diffPatch'); },
    };
    return { history: { projectRoot: '/project', changes, candidates }, calls };
  }

  /** A writer's two lines, with its record and its outcome; a non-writer's the same with no size. */
  function invocation(id: string, role: 'engineer' | 'local-architect', bytes: number | null): Line[] {
    const work = role === 'engineer' ? { workItem: 'wi-001', iteration: 'wi-001.i01' } : {};
    const record = invocationSchema.parse({
      schema: 'ramify-agent.invocation/1', id, role, work, attempt: 1, session: { requested: 'fresh', actual: 'fresh', ref: '' },
      prompt: { package: role, hash, inputsHash: hash }, scope: { write: null, measurement: null, size: bytes === null ? null : size(bytes) },
      writer: role === 'engineer', base: B, startedAt: '2026-09-21T08:00:00.000Z',
    });
    const outcome = invocationOutcomeSchema.parse({
      schema: 'ramify-agent.invocation-outcome/1', invocation: id, ended: 'submitted', rejectedSubmissions: 0, disposition: 'applied',
      session: { ref: `scripted@${id}`, mode: 'fresh' }, submission: null, settled: { confirmed: true, at: '2026-09-21T08:00:00.000Z', groupsKilled: 0, lateWrites: [] },
      outsideScope: [], usage, elapsedMs: 1,
    });
    return [
      { type: 'invocation-started', data: { invocation: id, role, session: `ses-${id}`, work, start: 'opened' }, records: [{ path: runLayout.invocation(id), body: record }] },
      { type: 'invocation-ended', data: { invocation: id, ended: 'submitted', submission: null, session: `ses-${id}`, kept: false, finished: 'work-closed' }, records: [{ path: runLayout.outcome(id), body: outcome }] },
    ];
  }

  /** One gate attempt over wi-001.i01: its event and its record, with the commit it made. */
  function gate(id: string, verdict: 'passed' | 'failed', commit: string | null): Line {
    const body = {
      schema: 'ramify-agent.gate-attempt/3', id, checkpoint: 'iteration', subject: { workItem: 'wi-001', iteration: 'wi-001.i01' }, proposedBy: null,
      repairRound: 0, infrastructureAttempt: 0, head: B, commit, audited: commit, evidence: null, guardedChanges: [], commands: [],
      verdict, cause: verdict === 'passed' ? null : 'check-failed', next: verdict === 'passed' ? 'accept' : 'repair',
    };
    return { type: 'gate-attempted', data: { gate: id, checkpoint: 'iteration', verdict, next: body.next }, records: [{ path: runLayout.gate(id), body }] };
  }

  test('weights each writer by the lines its gate commit delivered; the harness commits and the feature files weigh no writer; a binary path has no lines', async () => {
    const record = constructedRecord();
    const run = constructedRun([
      { type: 'job-started', data: {} },
      { type: 'scratch-setting-up', data: { originalIgnoreBase64: Buffer.from(ignore[B]!).toString('base64') } },
      { type: 'scratch-setup-complete', data: { commit: S, appended: true } },
      { type: 'scenarios-materialized', data: { commit: M, files: [feature] } },
      ...invocation('inv-0001', 'engineer', 1000),
      // A failed attempt commits nothing, so the writer is still pending at the next gate.
      gate('ga-0001', 'failed', null),
      gate('ga-0002', 'passed', G1),
      { type: 'scenarios-rewording', data: { deviation: 'pd-001', rewording: 1, scenarios: ['sc-001'], files: [feature] } },
      { type: 'scenarios-reworded', data: { deviation: 'pd-001', commit: R } },
      ...invocation('inv-0003', 'local-architect', null),
      ...invocation('inv-0002', 'engineer', 3000),
      gate('ga-0003', 'passed', G2),
    ], { ...record, manifest: { ...record.manifest, source: { commit: B, dirty: false } } });
    const scripted = history();
    const response = await metricsOf(runView(run), scripted.history);
    for (const metric of response.metrics) metricSchema.parse(metric);

    // inv-0001's 3 lines of src/a.ts in ga-0002's commit at 1000 bytes, and
    // inv-0002's 2 lines of src/b.ts in ga-0003's at 3000: (3000 + 6000) / 5.
    const perLine = find(response.metrics, 'scope-bytes-per-changed-line');
    expect(perLine).toMatchObject({ state: 'measured', value: 1800, numerator: 9000, denominator: 5, coverage: { covered: 2, total: 2 } });
    expect(perLine.evidence).toEqual([
      `delivered change ${B.slice(0, 12)}..${G2.slice(0, 12)}`,
      'inv-0001: w_e = 3 lines, S_e = 1000 bytes',
      'inv-0002: w_e = 2 lines, S_e = 3000 bytes',
      // The scratch rule's 1 line by its verified identity, and the feature
      // file's 4 added and 2 deleted lines, the materialization's, the
      // rewording's and the first gate's dropped pending tags alike.
      'harness: 7 lines the harness delivered, which no writer is weighted by',
      'binary, without line weight: assets/logo.png',
    ]);
    expect(response.scopeComparisons?.total).toMatchObject({ attributedWeight: 5, completeSizeWeight: 5, unknownSizeWeight: 0, unattributedWeight: 0 });
    // The base is the manifest's source commit and the final the last passed
    // gate's audited commit, for the setup identities and the diff alike.
    const commits = scripted.calls.filter(call => call.startsWith('commits'));
    expect(commits.length).toBeGreaterThan(0);
    expect(new Set(commits)).toEqual(new Set([`commits ${B.slice(0, 1)}..${G2.slice(0, 1)}`]));
    // The feature file's lines were blamed once, for the setup identities, and
    // never for a weight: they are the harness's by path.
    expect(scripted.calls.filter(call => call === `origins ${feature}`)).toHaveLength(1);
  });

  async function weightedRun(second: number | null = 3000, partial = false) {
    const bucket = { production: { sourceFiles: 1, sourceBytes: 10000, resourceFiles: 0, resourceBytes: 0 }, tests: { sourceFiles: 0, sourceBytes: 0, resourceFiles: 0, resourceBytes: 0 }, documentation: { files: 0, bytes: 0 }, views: { ordinaryBytes: 0, testsBytes: 0 } };
    const snapshot = { schema: 'ramify-agent.measurement-snapshot/1', id: size(1000).snapshot, policy: 'scope-size/2', head: B,
      measure: { revision: 'rev/1:scripted:1', hash, document: { schema: 'ramify.measure/2', revision: 'rev/1:scripted:1', root: '/project', ownershipRule: 'nearest', views: 'measured', modules: [{ id: 'p', dir: '', parent: null, exact: bucket, subtree: bucket }], files: [] } },
      view: null, supplementary: [{ path: '.ramify-architect', bytes: 0 }] };
    const secondLines = invocation('inv-0002', 'engineer', second);
    if (partial) {
      const start = secondLines[0]!;
      const body = invocationSchema.parse(start.records![0]!.body);
      secondLines[0] = { ...start, records: [{ path: runLayout.invocation(body.id), body: { ...body, scope: { ...body.scope, size: { ...size(null, 'source component missing'), subtotal: 200 } } } }] };
    }
    const record = constructedRecord();
    const directory = await mkdtemp(join(tmpdir(), 'weighted-query-'));
    directories.push(directory);
    const path = join(directory, runLayout.measurement(snapshot.id));
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(snapshot));
    for (const [id, source] of [['inv-0001', 'src/a.ts'], ['inv-0002', 'src/b.ts']]) {
      const linesPath = join(directory, runLayout.lineEvents(id!));
      await mkdir(dirname(linesPath), { recursive: true });
      await writeFile(linesPath, JSON.stringify({ schema: 'ramify-agent.line-events/1', invocation: id,
        paths: [{ path: source, owner: 'p', added: 100, deleted: 200, binary: false, bytes: null }],
        unmapped: { paths: 0, added: 0, deleted: 0 }, coverage: 'complete', gaps: [] }));
    }
    return constructedRun([
      { type: 'job-started', data: {}, records: [{ path: runLayout.measurement(snapshot.id), body: snapshot }] },
      { type: 'scratch-setting-up', data: { originalIgnoreBase64: Buffer.from(ignore[B]!).toString('base64') } },
      { type: 'scratch-setup-complete', data: { commit: S, appended: true } },
      { type: 'scenarios-materialized', data: { commit: M, files: [feature] } },
      ...invocation('inv-0001', 'engineer', 1000), gate('ga-0001', 'passed', G1),
      ...secondLines, gate('ga-0002', 'passed', G2),
    ], { ...record, baseline: { measurement: { id: snapshot.id, revision: 1, hash } }, manifest: { ...record.manifest, source: { commit: B, dirty: false } } }, directory);
  }

  test.each([null, 42, true, 'not a measurement', []])('malformed measurement root %j leaves the baseline unavailable', async document => {
    const run = await weightedRun();
    const path = runLayout.measurement(size(1000).snapshot);
    await writeFile(join(run.directory, path), JSON.stringify(document));
    const response = await metricsOf(runView(run));
    expect(response.baseline).toEqual({ state: 'unavailable', reason: `${path} cannot be read: expected a measurement object`, subtotal: null });
  });

  test('retired measurement policy still names the expected form', async () => {
    const run = await weightedRun();
    const path = runLayout.measurement(size(1000).snapshot);
    const file = join(run.directory, path);
    const current = JSON.parse(await readFile(file, 'utf8')) as { policy: string };
    await writeFile(file, JSON.stringify({ ...current, policy: current.policy.replace(/2$/, '1') }));
    await expect(metricsOf(runView(run))).rejects.toThrow(`${path} run measurement: expected scope-size/2`);
  });

  test('exact weighted scope uses surviving 10/30 shares, not gross invocation edits', async () => {
    const scripted = history([10, 30]);
    const response = await metricsOf(runView(await weightedRun()), scripted.history);
    expect(response.baseline).toMatchObject({ state: 'measured', bytes: 10000 });
    expect(response.evaluation.invocations.map(row => row.lines)).toEqual([
      expect.objectContaining({ added: 100, deleted: 200 }), expect.objectContaining({ added: 100, deleted: 200 }),
    ]);
    expect(find(response.metrics, 'scope-bytes-per-changed-line')).toMatchObject({ state: 'measured', value: 2500, numerator: 100000, denominator: 40, policyVersion: 'kpi/1', measurementPolicy: 'scope-size/2', coverage: { covered: 2, total: 2 } });
    expect(find(response.metrics, 'scope-size-ratio')).toMatchObject({ state: 'measured', value: 0.25 });
    expect(find(response.metrics, 'reduction-factor')).toMatchObject({ state: 'measured', value: 4 });
    expect(response.scopeComparisons?.total).toMatchObject({ attributedWeight: 40, completeSizeWeight: 40, unknownSizeWeight: 0 });
    expect(find(response.metrics, 'scope-bytes-per-changed-line').evidence).toEqual(expect.arrayContaining(['inv-0001: w_e = 10 lines, S_e = 1000 bytes', 'inv-0002: w_e = 30 lines, S_e = 3000 bytes']));
    expect(scripted.calls.filter(call => call.startsWith('commits')).every(call => call === 'commits b..2')).toBe(true);
    expect(scripted.calls).toEqual(expect.arrayContaining(['files', 'origins src/a.ts', 'origins src/b.ts']));
  });

  test.each([false, true])('missing writer size preserves subtotal and incomplete denominator (partial component=%s)', async partial => {
    const scripted = history([10, 3]);
    const response = await metricsOf(runView(await weightedRun(null, partial)), scripted.history);
    expect(find(response.metrics, 'scope-bytes-per-changed-line')).toMatchObject({ state: 'unavailable', value: null, subtotal: partial ? 10600 : 10000, denominator: 10, coverage: { covered: 1, total: 2 } });
    expect(response.scopeComparisons?.total).toMatchObject({ attributedWeight: 13, completeSizeWeight: 10, unknownSizeWeight: 3 });
    expect(find(response.metrics, 'scope-bytes-per-changed-line').evidence.join('\n')).toContain('inv-0002');
    expect(scripted.calls).toEqual(expect.arrayContaining(['origins src/a.ts', 'origins src/b.ts']));
  });

  test('known zero surviving weight is not applicable; failed history is unavailable, never zero', async () => {
    const run = runView(await weightedRun());
    const scripted = history([0, 0]);
    const zero = await metricsOf(run, scripted.history);
    expect(find(zero.metrics, 'scope-bytes-per-changed-line')).toMatchObject({ state: 'not-applicable', value: null });
    const calls: string[] = [];
    const failed = await metricsOf(run, { ...scripted.history, changes: { ...scripted.history.changes, commitsBetween: async () => { calls.push('failed commits'); throw new Error('history read failed'); } } });
    expect(find(failed.metrics, 'scope-bytes-per-changed-line')).toMatchObject({ state: 'unavailable', value: null });
    expect(find(failed.metrics, 'scope-bytes-per-changed-line').evidence.join('\n')).toContain('history read failed');
    expect(calls.length).toBeGreaterThan(0);
    expect(find(zero.metrics, 'session-count')).toMatchObject({ state: 'measured', value: 2 });
    expect(find(zero.metrics, 'session-weighted-total')).toMatchObject({ state: 'measured', value: 0.4, numerator: 4000, denominator: 10000 });
  });
});
