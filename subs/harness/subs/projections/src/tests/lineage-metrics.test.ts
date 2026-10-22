import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import { lineageMetricSchema, type LineageMetric, type Role } from '../../../../src/interfaces/protocol/runs.js';
import { runView } from '../inputs.js';
import { metricsOf } from '../metrics.js';
import { runSessionEntry, runSessionViews } from '../sessions.js';
import { snapshotOf } from '../snapshot.js';
import { reduceSessions } from '../../../autonomous/src/run/sessions.js';
import { runLayout } from '../../../autonomous/src/run/records.js';
import { invocationOutcomeSchema, invocationSchema, type ContinueRelation, type DegradeRelation, type ForkRelation, type ReplaceRelation } from '../../../task-execution/src/records.js';
import { constructedRun, hash, type Line } from '../../../../src/tests/helpers/constructed.js';

/*
 * ST13: each lineage measurement is computed from a run's records, the
 * lineage events, each invocation's usage and the first context observation
 * of each segment, and is unavailable with a reason when an input is
 * missing, never zero.
 *
 * The runs are constructed line by line with each invocation's observation
 * log on disk, and read through the metrics projection. The session reducer
 * reads every log first, so each one is a history the harness could have
 * recorded.
 */

const directories: string[] = [];
afterEach(async () => {
  await Promise.all(directories.splice(0).map(directory => rm(directory, { recursive: true, force: true })));
});

type Usage = { input: number; cacheRead: number; cacheWrite: number; output: number } | { unavailable: string };

interface Segment {
  readonly id: string;
  readonly session: string;
  readonly role: Role;
  /** The start relation: a first segment opens its session; a continued one names its point. */
  readonly continues?: ContinueRelation;
  readonly usage: Usage;
  /** Kept for another segment, or finished with a reason. */
  readonly kept: boolean;
  readonly degraded?: DegradeRelation;
  /** Ended by recovery: no start is recorded. */
  readonly interrupted?: boolean;
}

const mode = { fresh: 'fresh', continue: 'continued', fork: 'fork' } as const;

/** One segment's two lines: its start with its invocation record, and its end with its outcome. */
function segment(spec: Segment, requested: 'fresh' | 'fork'): Line[] {
  const asked = spec.continues === undefined ? requested : 'continue';
  const actual = spec.degraded?.actual ?? asked;
  const work = spec.role === 'engineer' ? { workItem: 'wi-001', iteration: 'wi-001.i01' } : {};
  const invocation = invocationSchema.parse({
    schema: 'ramify-agent.invocation/1', id: spec.id, role: spec.role, work, attempt: 1,
    session: { requested: mode[asked], actual: mode[asked], ref: '' },
    prompt: { package: spec.role, hash, inputsHash: hash },
    scope: { write: null, measurement: null, size: null },
    writer: false, base: 'abc', startedAt: '2026-09-21T08:00:00.000Z',
  });
  const usage = 'unavailable' in spec.usage ? spec.usage : { ...spec.usage, total: spec.usage.input + spec.usage.cacheRead + spec.usage.cacheWrite + spec.usage.output };
  const outcome = invocationOutcomeSchema.parse({
    schema: 'ramify-agent.invocation-outcome/1', invocation: spec.id,
    ended: spec.interrupted ? 'failed' : 'submitted', rejectedSubmissions: 0, disposition: spec.interrupted ? 'incomplete' : 'applied',
    ...(spec.interrupted ? { interruption: 'session-lost', error: 'The harness stopped while this invocation was running.' } : {
      session: { ref: `scripted@${spec.id}`, mode: mode[actual], ...(spec.degraded?.reason ? { degradedReason: spec.degraded.reason } : {}) },
    }),
    submission: null,
    settled: { confirmed: true, at: '2026-09-21T08:00:00.000Z', groupsKilled: 0, lateWrites: [] },
    outsideScope: [], usage, elapsedMs: 1,
  });
  const end = spec.kept ? { kept: true } : { kept: false, finished: spec.interrupted ? 'interrupted' : 'work-closed' };
  return [
    {
      type: 'invocation-started',
      data: {
        invocation: spec.id, role: spec.role, session: spec.session, work,
        start: spec.continues === undefined ? 'opened' : 'continued', ...(spec.continues === undefined ? {} : { continues: spec.continues }),
      },
      records: [{ path: runLayout.invocation(spec.id), body: invocation }],
    },
    {
      type: 'invocation-ended',
      data: { invocation: spec.id, ended: outcome.ended, submission: null, session: spec.session, ...end, ...(spec.degraded ? { degraded: spec.degraded } : {}) },
      records: [{ path: runLayout.outcome(spec.id), body: outcome }],
    },
  ];
}

function opened(session: string, role: Role, relations: { fork?: ForkRelation; replaces?: ReplaceRelation } = {}): Line {
  const work = role === 'engineer' ? { workItem: 'wi-001', iteration: 'wi-001.i01' } : {};
  return { type: 'session-opened', data: { session, role, work, executor: 'scripted', model: null, ...relations } };
}

/** A session opened with its first segment. */
function open(spec: Segment, relations: { fork?: ForkRelation; replaces?: ReplaceRelation } = {}): Line[] {
  return [opened(spec.session, spec.role, relations), ...segment(spec, relations.fork ? 'fork' : 'fresh')];
}

const continued = (spec: Segment): Line[] => segment(spec, 'fresh');

const use = (input: number, cacheRead: number, cacheWrite: number, output: number) => ({ input, cacheRead, cacheWrite, output });

/** A context observation line, and a coverage gap line. */
const context = (tokens: number | null) => ({ type: 'context', data: { tokens, window: 200_000, threshold: 150_000 } });
const noContext = { type: 'coverage-gap', data: { kind: 'context-unavailable', detail: 'the executor reports no context size' } };

/** The run on disk: every observation log it names, then its lines. */
async function run(lines: readonly Line[], logs: Readonly<Record<string, ReadonlyArray<{ type: string; data: unknown }>>>) {
  const directory = await mkdtemp(join(tmpdir(), 'ramify-agent-lineage-'));
  directories.push(directory);
  for (const [invocation, observations] of Object.entries(logs)) {
    const path = join(directory, runLayout.observations(invocation));
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, observations.map((line, index) => `${JSON.stringify({ n: index + 1, at: '2026-09-21T08:00:00.000Z', ...line })}\n`).join(''));
  }
  const committed = constructedRun([{ type: 'job-started', data: {} }, ...lines], undefined, directory);
  const view = runView(committed);
  reduceSessions(view.events);
  const response = await metricsOf(view);
  for (const metric of response.lineage.metrics) lineageMetricSchema.parse(metric);
  return response;
}

function find(metrics: readonly LineageMetric[], id: string): LineageMetric {
  const metric = metrics.find(candidate => candidate.id === id);
  if (metric === undefined) throw new Error(`no lineage measurement ${id}; there are ${metrics.map(candidate => candidate.id).join(', ')}`);
  return metric;
}

const point = (session: string, invocation: string) => ({ session, invocation });

describe('ST13: the lineage measurements of a scripted run', () => {
  /*
   * ses-0001  plan architect, generation 1's context; appended to at event 8; lost
   * ses-0002  fork of ses-0001 at inv-0001, generation 1
   * ses-0003  fork of ses-0001 at the append, generation 1
   * ses-0004  module architect, continued once, then a continuation the executor made fresh
   * ses-0005  engineer, continued for a repair, then lost
   * ses-0006  engineer reconstructed in place of ses-0005
   * ses-0007  global fork that rebuilt the context: generation 2, fresh
   * ses-0008  fork of generation 2 that the executor made fresh
   */
  const lines: Line[] = [
    ...open({ id: 'inv-0001', session: 'ses-0001', role: 'initial-architect', usage: use(1000, 0, 5000, 2000), kept: true }),
    ...open({ id: 'inv-0002', session: 'ses-0002', role: 'global-fork', usage: use(200, 20_000, 300, 800), kept: false },
      { fork: { from: point('ses-0001', 'inv-0001'), reason: 'placement-request', generation: 1, briefs: [] } }),
    { type: 'brief-appended', data: { decision: 'dec-0001', generation: 1, session: 'ses-0001', ref: 'scripted@append', outcome: 'appended' } },
    ...open({ id: 'inv-0003', session: 'ses-0003', role: 'global-fork', usage: use(400, 22_000, 500, 1200), kept: false },
      { fork: { from: { session: 'ses-0001', append: 8 }, reason: 'placement-request', generation: 1, briefs: ['dec-0001'] } }),
    ...open({ id: 'inv-0004', session: 'ses-0004', role: 'local-architect', usage: use(900, 0, 4000, 700), kept: true }),
    ...continued({ id: 'inv-0005', session: 'ses-0004', role: 'local-architect', usage: use(300, 9000, 800, 500), kept: true,
      continues: { from: point('ses-0004', 'inv-0004'), reason: 'placement-answered', briefs: [] } }),
    ...continued({ id: 'inv-0006', session: 'ses-0004', role: 'local-architect', usage: use(2000, 0, 3000, 600), kept: false,
      continues: { from: point('ses-0004', 'inv-0005'), reason: 'iteration-closed', briefs: [] },
      degraded: { requested: 'continue', actual: 'fresh', reason: 'the session file is gone' } }),
    ...open({ id: 'inv-0007', session: 'ses-0005', role: 'engineer', usage: use(3000, 30_000, 1000, 4000), kept: true }),
    ...continued({ id: 'inv-0008', session: 'ses-0005', role: 'engineer', usage: use(500, 40_000, 200, 1000), kept: true,
      continues: { from: point('ses-0005', 'inv-0007'), reason: 'repair', briefs: [] } }),
    { type: 'session-finished', data: { session: 'ses-0005', reason: 'replaced' } },
    ...open({ id: 'inv-0009', session: 'ses-0006', role: 'engineer', usage: use(2000, 20_000, 800, 3000), kept: false },
      { replaces: { session: 'ses-0005', reason: 'reconstructed' } }),
    { type: 'session-finished', data: { session: 'ses-0001', reason: 'lost' } },
    { type: 'global-context-rebuilt', data: { generation: 2, reason: 'the architect context of generation 1 can no longer be read' } },
    ...open({ id: 'inv-0010', session: 'ses-0007', role: 'global-fork', usage: use(5000, 0, 6000, 1500), kept: true },
      { replaces: { session: 'ses-0001', reason: 'context-rebuilt' } }),
    ...open({ id: 'inv-0011', session: 'ses-0008', role: 'global-fork', usage: use(4000, 0, 4000, 1000), kept: false,
      degraded: { requested: 'fork', actual: 'fresh', reason: 'this executor cannot fork' } },
    { fork: { from: point('ses-0007', 'inv-0010'), reason: 'placement-request', generation: 2, briefs: [] } }),
  ];
  const starts: Record<string, number> = {
    'inv-0001': 20_000, 'inv-0002': 24_000, 'inv-0003': 26_000, 'inv-0004': 8000, 'inv-0005': 11_000, 'inv-0006': 7000,
    'inv-0007': 10_000, 'inv-0008': 15_000, 'inv-0009': 12_000, 'inv-0010': 18_000, 'inv-0011': 9000,
  };
  // Each segment's first context observation is its start; later ones are not.
  const logs = Object.fromEntries(Object.entries(starts).map(([invocation, tokens]) => [invocation, [context(tokens), context(tokens + 5000)]]));

  // kpi/lineage.test.ts owns each calculation; these cases prove only that the
  // projection derives each fact from the run's records and observation logs.
  test('each segment\'s generation, previous segment, start context, degradation and replacement come from the run\'s records', async () => {
    const { lineage } = await run(lines, logs);
    expect(lineage.policyVersion).toBe('lineage/2');
    expect(find(lineage.metrics, 'fork.generation-1.start-context')).toMatchObject({ state: 'measured', evidence: ['inv-0002 (ses-0002): 24000', 'inv-0003 (ses-0003): 26000'] });
    expect(find(lineage.metrics, 'continuation-growth')).toMatchObject({ state: 'measured', evidence: ['inv-0005 (ses-0004): 3000', 'inv-0008 (ses-0005): 5000'] });
    expect(find(lineage.metrics, 'repair.cache-read')).toMatchObject({ state: 'measured', value: 40_000 });
    expect(find(lineage.metrics, 'degraded-starts')).toMatchObject({ evidence: ['continue made fresh: the session file is gone (inv-0006)', 'fork made fresh: this executor cannot fork (inv-0011)'] });
    expect(find(lineage.metrics, 'replacements.context-rebuilt')).toMatchObject({ evidence: ['ses-0007 in place of ses-0001'] });
    expect(find(lineage.metrics, 'forks-served.generation-2')).toMatchObject({ evidence: ['ses-0008 (inv-0011) asked for a fork and started fresh'] });
  });

  test('the same degraded starts are counted by each session of the project\'s list and by the run\'s snapshot', () => {
    const view = runView(constructedRun([{ type: 'job-started', data: {} }, ...lines]));
    const counted = runSessionViews(view).map(session => runSessionEntry('review-notes', view.record.jobId, session))
      .filter(entry => entry.degradedStarts > 0)
      .map(entry => [entry.ref.session, entry.degradedStarts]);
    expect(counted).toEqual([['ses-0004', 1], ['ses-0008', 1]]);
    expect(snapshotOf(view).counts.degradedStarts).toBe(2);
  });

});

describe('ST13: a measurement whose inputs are missing is unavailable with the reason, never zero', () => {
  const fork = (generation: number): { fork: ForkRelation } => ({
    fork: { from: point('ses-0001', 'inv-0001'), reason: 'placement-request', generation, briefs: [] },
  });
  const lines: Line[] = [
    ...open({ id: 'inv-0001', session: 'ses-0001', role: 'initial-architect', usage: use(1000, 0, 5000, 2000), kept: true }),
    // Its executor reported no context size.
    ...open({ id: 'inv-0002', session: 'ses-0002', role: 'global-fork', usage: use(200, 20_000, 300, 800), kept: false }, fork(1)),
    // Interrupted: no start was recorded and no usage was reported.
    ...open({ id: 'inv-0003', session: 'ses-0003', role: 'global-fork', usage: { unavailable: 'the harness stopped while the session was running' }, kept: false, interrupted: true }, fork(1)),
    ...open({ id: 'inv-0004', session: 'ses-0004', role: 'global-fork', usage: use(400, 22_000, 500, 1200), kept: false }, fork(1)),
    // A module engineer whose first segment has a readable empty observation log, continued for a repair.
    ...open({ id: 'inv-0005', session: 'ses-0005', role: 'engineer', usage: use(3000, 30_000, 1000, 4000), kept: true }),
    ...continued({ id: 'inv-0006', session: 'ses-0005', role: 'engineer', usage: { unavailable: 'the session reported no usage' }, kept: false,
      continues: { from: point('ses-0005', 'inv-0005'), reason: 'repair', briefs: [] } }),
  ];
  const logs = {
    'inv-0001': [context(20_000)],
    'inv-0002': [noContext],
    'inv-0003': [context(25_000)],
    'inv-0004': [context(30_000)],
    'inv-0005': [],
    'inv-0006': [context(9000)],
  };

  test('an interruption, an empty log and a coverage gap each become the reason a measurement is unavailable', async () => {
    const { lineage } = await run(lines, logs);
    expect(find(lineage.metrics, 'fork.generation-1.start-context').evidence).toEqual([
      'inv-0002 (ses-0002): it recorded no context observation: the executor reports no context size',
      'inv-0003 (ses-0003): its start is unknown: its outcome records no start: The harness stopped while this invocation was running.',
      'inv-0004 (ses-0004): 30000',
    ]);
    expect(find(lineage.metrics, 'continuation-growth').evidence).toEqual(['inv-0006 (ses-0005): its previous segment inv-0005: it recorded no context observation']);
  });

  test('a missing previous observation log remains unavailable with its actual read failure', async () => {
    const { 'inv-0005': emptyLog, ...missingLogs } = logs;
    expect(emptyLog).toEqual([]);
    const { lineage } = await run(lines, missingLogs);
    const path = join(directories.at(-1)!, runLayout.observations('inv-0005'));
    expect(find(lineage.metrics, 'continuation-growth')).toMatchObject({
      state: 'unavailable', value: null, subtotal: null, coverage: { covered: 0, total: 1 },
      evidence: [`inv-0006 (ses-0005): its previous segment inv-0005: invocations/inv-0005/observations.jsonl cannot be read: ENOENT: no such file or directory, open '${path}'`],
    });
    expect(find(lineage.metrics, 'repair.start-context')).toMatchObject({ state: 'measured', value: 9000 });
  });

});
