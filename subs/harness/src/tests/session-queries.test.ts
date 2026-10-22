import { createHash } from 'node:crypto';
import { appendFile, mkdir, readFile, readdir, rename, stat, writeFile } from 'node:fs/promises';
import type { AddressInfo } from 'node:net';
import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { ScriptStep } from '../../subs/agent/src/scripted.js';
import { createApp } from '../http/app.js';
import { startServerWith } from '../http/server.js';
import { errorResponseSchema } from '../interfaces/protocol/errors.js';
import { protocolPaths } from '../interfaces/protocol/paths.js';
import { metricsResponseSchema } from '../interfaces/protocol/runs.js';
import {
  runSessionResponseSchema, runSessionsResponseSchema, sessionBodyResponseSchema, sessionListResponseSchema, sessionTranscriptResponseSchema,
  sessionUpdatesResponseSchema,
  type RunSessionView, type SessionCursor, type SessionRef,
} from '../interfaces/protocol/sessions.js';
import type { TranscriptBody, TranscriptEntry } from '../interfaces/protocol/transcripts.js';
import { runLayout } from '../../subs/autonomous/src/run/records.js';
import { RunLog } from '../../subs/autonomous/src/run/log.js';
import { SessionQueries } from '../../subs/projections/src/session-queries.js';
import { manualRunRecordSchema } from '../../subs/task-workflow/src/steps/records.js';
import { jobSchemaVersion } from '../jobs/records.js';
import { reduceSessions } from '../../subs/autonomous/src/run/sessions.js';
import { ContentStore } from '../../subs/task-execution/src/transcripts/store.js';
import { readTranscript, TranscriptWriter } from '../../subs/task-execution/src/transcripts/writer.js';
import { expectNoProcesses, forgetExternalTools, openRunsWithoutProcesses } from './helpers/external-tools.js';
import { FakeRamifyCli } from './helpers/fake-ramify.js';
import { copyFixture } from './helpers/fixture.js';
import { treeInputs } from './helpers/iterations.js';
import { fixtureScratchGit, mockGit } from './helpers/mock-git.js';
import { emptyAnalysis, runEventsOnDisk, runPath, startRun, stopRun, testPolicy, unscriptedChangeHistory, until } from './helpers/runs.js';
import { scriptedGit } from './helpers/scripted-git.js';
import { runSessionScenario } from './helpers/session-scenario.js';

vi.mock('node:child_process', async original =>
  (await import('./helpers/process-guard.js')).guardedChildProcess(await original<typeof import('node:child_process')>()));

/*
 * The session queries over HTTP, read by a plain Node client: `fetch` and
 * the protocol's schemas.
 *
 * A scripted run whose sessions take every relation is listed, derived and
 * read back through its transcripts and bodies.
 * A run followed while it runs is polled with cursors: the poll answers
 * only entries after each cursor and reports a state change in the poll
 * after it is committed.
 */

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  try {
    for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
    expectNoProcesses();
  } finally { forgetExternalTools(); }
});

const plan = 'review-notes';
const notes = 'collection-review/workspace/reviews/notes';

async function capturedFiles(root: string): Promise<Record<string, { sha256: string; mtime: number }>> {
  const files: Record<string, { sha256: string; mtime: number }> = {};
  async function walk(directory: string): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile()) files[path] = { sha256: createHash('sha256').update(await readFile(path)).digest('hex'),
        mtime: (await stat(path)).mtimeMs };
    }
  }
  await walk(root);
  return files;
}

async function get(origin: string, path: string): Promise<{ status: number; body: unknown }> {
  const response = await fetch(`${origin}${path}`);
  return { status: response.status, body: await response.json() };
}

async function ok<T>(origin: string, path: string, schema: { parse(value: unknown): T }): Promise<T> {
  const { status, body } = await get(origin, path);
  expect([path, status]).toEqual([path, 200]);
  return schema.parse(body);
}

async function refused(origin: string, path: string): Promise<[number, string]> {
  const { status, body } = await get(origin, path);
  return [status, errorResponseSchema.parse(body).error.code];
}

/** Every `file` body an entry names. */
function fileBodies(entry: TranscriptEntry): string[] {
  const found: string[] = [];
  const walk = (node: unknown): void => {
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (node === null || typeof node !== 'object') return;
    const body = node as TranscriptBody;
    if (body.stored === 'file') found.push(body.path);
    Object.values(node).forEach(walk);
  };
  walk(entry);
  return found;
}

describe('ST09: the project\'s sessions, a run\'s sessions, their transcripts and bodies', () => {
  test('two current manual runs are listed and paged over HTTP; a crashed invocation is interrupted under the server lock', async () => {
    const fixture = await copyFixture();
    cleanups.push(fixture.remove);
    const root = fixture.root;
    const runs = ['20261022T080000Z-000001', '20261022T080001Z-000002'] as const;
    for (const [index, runId] of runs.entries()) {
      const directory = join(root, 'plans', 'sessions', '.harness', 'jobs', runId);
      await mkdir(directory, { recursive: true });
      await writeFile(join(directory, runLayout.record), JSON.stringify(manualRunRecordSchema.parse({
        schema: jobSchemaVersion, jobId: runId, planId: 'sessions', kind: 'manual', createdAt: '2026-10-22T08:00:00.000Z',
        projectRoot: root, base: 'recorded-base', branch: null, origin: 'session', policy: testPolicy(root),
      })));
      const log = await RunLog.open(join(directory, runLayout.events), runId);
      await log.append({ type: 'session-opened', data: { session: 'ses-0001', role: 'engineer', work: {}, executor: 'scripted', model: null } });
      await log.append({ type: 'invocation-started', data: { invocation: `inv-${index + 1}`, session: 'ses-0001', role: 'engineer', work: {}, start: 'opened' } });
      const writer = new TranscriptWriter({ session: 'ses-0001', path: join(directory, runLayout.transcript('ses-0001')), root: directory,
        store: new ContentStore(join(directory, runLayout.blobs)), inlineBytes: 1024, now: () => new Date('2026-10-22T08:00:00.000Z') });
      await writer.append(async bodies => ({ type: 'message', invocation: `inv-${index + 1}`, role: 'user', blocks: [
        { type: 'text', body: await bodies.text(`Manual run ${index + 1}`) },
      ] }));
      await writer.drain();
      if (index === 0) await log.append({ type: 'invocation-ended', data: { invocation: `inv-${index + 1}`, session: 'ses-0001', ended: 'submitted', submission: null, kept: false, finished: 'work-closed' } });
    }
    const retired = join(root, 'plans', '.harness', 'sessions', '20261010T084131Z-725903');
    await mkdir(retired, { recursive: true });
    await writeFile(join(retired, 'session.json'), '{bad json');
    // Without server ownership, an in-progress manual command may still be writing.
    const unowned = new SessionQueries({ projectRoot: root, agentName: undefined, committed: () => undefined,
      committedRuns: () => [], runVersions: () => [] });
    expect((await unowned.runSession('sessions', runs[1], 'ses-0001')).session.state).toBe('live');
    const server = await startServerWith({ projectRoot: root, port: 0, assetsDirectory: join(root, 'no-such-build'), ramify: new FakeRamifyCli(),
      runs: { inputs: treeInputs(), git: fixtureScratchGit(mockGit()), changeHistory: unscriptedChangeHistory, warn: () => undefined } });
    cleanups.push(() => server.close());
    const before = await capturedFiles(root);
    const list = await ok(server.url, protocolPaths.sessions(), sessionListResponseSchema);
    expect(list.unserved).toEqual([]);
    expect(list.total).toBe(2);
    expect(list.sessions.map(entry => entry.ref)).toEqual(runs.slice().reverse().map(runId => ({ source: 'run', planId: 'sessions', runId, session: 'ses-0001' })));
    expect(list.sessions.map(entry => entry.state)).toEqual(['interrupted', 'finished']);
    for (const [index, runId] of runs.entries()) {
      const answer = await ok(server.url, protocolPaths.runSessions('sessions', runId), runSessionsResponseSchema);
      expect(answer.sessions).toMatchObject([{ session: 'ses-0001', state: index === 0 ? 'finished' : 'interrupted' }]);
      if (index === 1) expect(answer.sessions[0]).toMatchObject({ awaiting: 'inv-2', invocations: [{ ended: null }] });
      expect(await refused(server.url, protocolPaths.run('sessions', runId))).toEqual([404, 'not-found']);
      const page = await ok(server.url, protocolPaths.runSessionTranscript('sessions', runId, 'ses-0001', 0), sessionTranscriptResponseSchema);
      expect(page.session).toEqual({ source: 'run', planId: 'sessions', runId, session: 'ses-0001' });
      expect(page.page.entries).toHaveLength(1);
      expect(JSON.stringify(page.page.entries[0])).toContain(`Manual run ${index + 1}`);
      expect((await ok(server.url, protocolPaths.runSessionTranscript('sessions', runId, 'ses-0001', 1), sessionTranscriptResponseSchema)).page.entries).toEqual([]);
    }
    expect(await refused(server.url, protocolPaths.runSession('sessions', '20261010T084131Z-725903', 'ses-0001'))).toEqual([404, 'not-found']);
    expect(await capturedFiles(root)).toEqual(before);
  });
  test('a scripted run is read over HTTP and an earlier session directory is ignored', async () => {
    const scenario = await runSessionScenario({ cleanup: step => { cleanups.push(step); } });
    const { root, runId, events } = scenario;
    // The server takes the project lock.
    await scenario.service.close();
    const retired = join(root, 'plans', '.harness', 'sessions', '20261010T084131Z-725903');
    await mkdir(retired, { recursive: true });
    await writeFile(join(retired, 'session.json'), '{bad json');

    const server = await startServerWith({
      projectRoot: root, port: 0, assetsDirectory: join(root, 'no-such-build'), ramify: new FakeRamifyCli(),
      runs: { inputs: treeInputs(), git: fixtureScratchGit(mockGit()), changeHistory: unscriptedChangeHistory, warn: () => undefined },
    });
    cleanups.push(() => server.close());
    const origin = server.url;
    const sessions = reduceSessions(events);

    // The earlier directory is neither scanned nor reported.
    const list = await ok(origin, protocolPaths.sessions(), sessionListResponseSchema);
    expect([list.total, list.offset, list.next, list.unserved]).toEqual([sessions.size, 0, null, []]);
    expect(list.sessions.every(entry => entry.ref.source === 'run')).toBe(true);
    const times = list.sessions.map(entry => Date.parse(entry.changedAt));
    expect(times).toEqual([...times].sort((a, b) => b - a));
    for (const session of sessions.values()) {
      const entry = list.sessions.find(candidate => candidate.ref.source === 'run' && candidate.ref.session === session.id);
      expect(entry, session.id).toMatchObject({
        ref: { source: 'run', planId: plan, runId }, state: 'finished', finished: session.finished, role: session.role, work: session.work,
        executor: 'scripted', model: 'provider/model-7', invocations: session.invocations.length, degradedStarts: 0,
        startedAt: session.opened.at, changedAt: session.changed.at,
      });
    }
    expect(await refused(origin, '/api/v1/sessions?offset=x')).toEqual([400, 'invalid-request']);
    expect((await ok(origin, protocolPaths.sessions(list.total), sessionListResponseSchema)).sessions).toEqual([]);

    // The run's sessions: state, lineage, points and the elements each reaches.
    const answer = await ok(origin, protocolPaths.runSessions(plan, runId), runSessionsResponseSchema);
    expect([answer.version, answer.total]).toEqual([events.at(-1)!.sequence, sessions.size]);
    const views = new Map(answer.sessions.map(view => [view.session, view]));
    const targeted = await ok(origin, protocolPaths.runSession(plan, runId, 'ses-0001'), runSessionResponseSchema);
    expect(targeted).toEqual({ version: answer.version, session: views.get('ses-0001') });
    expect(await refused(origin, protocolPaths.runSession(plan, runId, 'ses-9999'))).toEqual([404, 'not-found']);
    expect([...views.keys()]).toEqual([...sessions.keys()]);
    // Repeated HTTP reads exercise the real reader's version cache, not a
    // canned endpoint response; finished run answers keep exact ordering.
    const captured = await capturedFiles(root);
    for (let read = 0; read < 3; read++) {
      expect(await ok(origin, protocolPaths.runSessions(plan, runId), runSessionsResponseSchema)).toEqual(answer);
      expect(await ok(origin, protocolPaths.sessions(), sessionListResponseSchema)).toEqual(list);
    }
    // Includes project content, durable events and transcripts: queries do not
    // rewrite copies or manufacture fresh evidence, even on cache hits.
    expect(await capturedFiles(root)).toEqual(captured);
    for (const session of sessions.values()) {
      expect(views.get(session.id), session.id).toMatchObject({
        state: 'finished', finished: session.finished, awaiting: null, point: session.point, opened: session.opened, changed: session.changed,
        lineage: { fork: session.fork, replaces: session.replaces },
      });
      expect(views.get(session.id)!.invocations.map(invocation => invocation.invocation)).toEqual(session.invocations);
    }
    // The analysis's intake and the plan architect both reach the run;
    // the architect context is the plan architect's session.
    expect(views.get('ses-0001')).toMatchObject({ role: 'catalog-extractor', reaches: { kind: 'run' } });
    expect(views.get('ses-0002')).toMatchObject({ role: 'initial-architect', reaches: { kind: 'run' } });
    const fork = [...views.values()].find(view => view.role === 'global-fork')!;
    expect(fork.reaches).toEqual({ kind: 'request', request: fork.work.request, workItem: 'wi-001', capability: 'review-notes' });
    expect(views.get('ses-0002')!.lineage.forks).toEqual([fork.session]);
    // The brief appended back to the architect context is a mark with its point.
    const appended = events.find(event => event.type === 'brief-appended')!;
    expect(views.get('ses-0002')!.appends).toEqual([expect.objectContaining({ appended: { sequence: appended.sequence, at: appended.at }, point: { session: 'ses-0002', append: appended.sequence } })]);
    const architect = [...views.values()].find(view => view.role === 'local-architect')!;
    expect(architect.reaches).toEqual({ kind: 'work-item', workItem: 'wi-001', capability: 'review-notes', module: notes });
    // A continued architect was suspended between its invocations, each gap
    // from an end that kept it to the next start.
    expect(architect.invocations.length).toBeGreaterThan(1);
    expect(architect.suspended.length).toBeGreaterThanOrEqual(architect.invocations.length - 1);
    architect.invocations.slice(1).forEach((invocation, index) => {
      expect(invocation).toMatchObject({ start: 'continued', continues: { from: architect.invocations[index]!.point } });
      expect(architect.suspended[index]).toEqual({ from: architect.invocations[index]!.ended, until: invocation.started });
    });
    // The contract sub-session names its requester and that requester's session, which lists it.
    const contract = [...views.values()].find(view => view.role === 'contract-engineer')!;
    const requester = contract.lineage.requestedBy!;
    expect(requester).toMatchObject({ reason: 'contract-needed', session: expect.stringMatching(/^ses-/) });
    expect(views.get(requester.session!)!.lineage.requested).toEqual([contract.session]);
    // The repaired engineer's second segment continues for the repair.
    expect([...views.values()].some(view => view.invocations.some(invocation => invocation.continues?.reason === 'repair'))).toBe(true);
    // Each invocation carries the evaluation the Run page's metrics show for it.
    const metrics = await ok(origin, protocolPaths.runMetrics(plan, runId), metricsResponseSchema);
    const evaluations = new Map(metrics.evaluation.invocations.map(evaluation => [evaluation.invocation, evaluation]));
    for (const invocation of answer.sessions.flatMap(view => view.invocations)) {
      expect(invocation.evaluation, invocation.invocation).toEqual(evaluations.get(invocation.invocation));
      expect(invocation.ended).not.toBeNull();
    }

    // Each transcript, page by page from a cursor: the same entries the file holds.
    const refOf = (session: string): SessionRef => ({ source: 'run', planId: plan, runId, session });
    for (const session of sessions.keys()) {
      const onDisk = (await readTranscript(scenario.path(runLayout.transcript(session)))).entries;
      const whole = await ok(origin, protocolPaths.runSessionTranscript(plan, runId, session, 0), sessionTranscriptResponseSchema);
      expect(whole).toEqual({ session: refOf(session), page: { file: 'present', entries: onDisk, cursor: onDisk.length, more: false, partial: false, unreadable: [] } });
      const rest = await ok(origin, protocolPaths.runSessionTranscript(plan, runId, session, 2), sessionTranscriptResponseSchema);
      expect(rest.page.entries).toEqual(onDisk.filter(entry => entry.n > 2));
    }
    const beyond = await ok(origin, protocolPaths.runSessionTranscript(plan, runId, 'ses-0001', 10_000), sessionTranscriptResponseSchema);
    expect(beyond.page).toMatchObject({ entries: [], cursor: 10_000, more: false });
    expect(await refused(origin, protocolPaths.runSessionTranscript(plan, runId, 'ses-0999', 0))).toEqual([404, 'not-found']);
    expect(await refused(origin, protocolPaths.runSessionTranscript(plan, runId, 'inv-0001', 0))).toEqual([404, 'not-found']);
    expect(await refused(origin, protocolPaths.runSessionTranscript(plan, '20200101T000000Z-000000', 'ses-0001', 0))).toEqual([404, 'not-found']);
    expect(await refused(origin, `${protocolPaths.runSessionTranscript(plan, runId, 'ses-0001', 0).replace('after=0', 'after=-1')}`)).toEqual([400, 'invalid-request']);

    // A stored body by its hash: the system prompt every architect shares.
    const started = (await readTranscript(scenario.path(runLayout.transcript('ses-0002')))).entries[0]!;
    expect(started.type).toBe('started');
    const prompt = (started as Extract<TranscriptEntry, { type: 'started' }>).systemPrompt;
    expect(prompt.stored).toBe('blob');
    const hash = (prompt as Extract<TranscriptBody, { stored: 'blob' }>).hash;
    const stored = await ok(origin, protocolPaths.runBody(plan, runId, hash), sessionBodyResponseSchema);
    const content = (await new ContentStore(scenario.path(runLayout.blobs)).read(hash))!;
    expect(stored).toEqual({ content, bytes: Buffer.byteLength(content), truncated: false });
    expect(await refused(origin, protocolPaths.runBody(plan, runId, '0'.repeat(64)))).toEqual([404, 'not-found']);
    expect(await refused(origin, protocolPaths.runBody(plan, runId, 'not-a-hash'))).toEqual([400, 'invalid-request']);

    // A file body the run's transcripts name, such as a hook check's log.
    const files: Array<{ session: string; path: string }> = [];
    for (const session of sessions.keys()) {
      for (const path of (await readTranscript(scenario.path(runLayout.transcript(session)))).entries.flatMap(fileBodies)) files.push({ session, path });
    }
    const file = files[0];
    expect(file, 'a run transcript names a file body').toBeDefined();
    const read = await ok(origin, protocolPaths.runSessionFile(plan, runId, file!.session, file!.path), sessionBodyResponseSchema);
    expect(read.content).toBe(await readFile(scenario.path(...file!.path.split('/')), 'utf8'));
    // Only what a transcript names, and nothing outside the run.
    for (const path of [runLayout.record, '../../../../../package.json', `${file!.path}/..`]) {
      expect(await refused(origin, protocolPaths.runSessionFile(plan, runId, file!.session, path)), path).toEqual([404, 'not-found']);
    }

    // A transcript whose file is missing is answered as missing; a complete
    // line that is not JSON is skipped and reported by its line number.
    const lines = (await readFile(scenario.path(runLayout.transcript('ses-0002')), 'utf8')).split('\n').filter(Boolean).length;
    await appendFile(scenario.path(runLayout.transcript('ses-0002')), 'not a JSON value\n');
    const damaged = await ok(origin, protocolPaths.runSessionTranscript(plan, runId, 'ses-0002', 0), sessionTranscriptResponseSchema);
    expect([damaged.page.entries.length, damaged.page.unreadable]).toEqual([lines, [lines + 1]]);
    await rename(scenario.path(runLayout.transcript('ses-0002')), scenario.path('transcripts', 'moved.jsonl'));
    const missing = await ok(origin, protocolPaths.runSessionTranscript(plan, runId, 'ses-0002', 4), sessionTranscriptResponseSchema);
    expect(missing.page).toEqual({ file: 'missing', entries: [], cursor: 4, more: false, partial: false, unreadable: [] });
  }, 240_000);
});

describe('ST09: following a run\'s sessions with one poll', () => {
  test('the poll answers only entries after each cursor, never resets a number, and reports a state change in the next poll', async () => {
    const fixture = await copyFixture();
    cleanups.push(fixture.remove);
    const root = fixture.root;
    let started = 0;
    // The first run's architect ignores the stop past its grace, so the run
    // ends with the session the log still says is live: interrupted. The
    // second's waits until it is stopped, and honors the stop.
    const script = (): ScriptStep[] => (++started === 1
      ? [{ kind: 'message', text: 'Orienting.' }, { kind: 'stall', ms: 1500, thenIgnoreStop: true }, { kind: 'submit', input: emptyAnalysis() }]
      : [{ kind: 'message', text: 'Orienting.' }, { kind: 'wait', ms: 60_000 }]);
    const { service, agent } = await openRunsWithoutProcesses(root, scriptedGit(root, { head: 'poll-base', checkpoints: [] }), { script, stopGraceMs: 200 });
    cleanups.push(() => service.close());
    const server = createApp({ projectRoot: root, runs: service }).listen(0, '127.0.0.1');
    await new Promise<void>(accept => server.once('listening', () => accept()));
    cleanups.push(() => new Promise<void>(accept => { server.close(() => accept()); server.closeAllConnections(); }));
    const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

    const entriesOf = async (runId: string): Promise<number> => (await readTranscript(runPath(root, plan, runId, runLayout.transcript('ses-0001')))).entries.length;
    const stop = async (runId: string): Promise<void> => {
      await service.execute(stopRun(plan, runId, service.getRun(plan, runId)!.version));
      await service.settled(plan, runId);
    };

    const first = (await service.execute(startRun(plan))).jobId;
    await until(async () => agent!.sessions.length === 1 && await entriesOf(first) >= 3);
    await stop(first);
    expect(service.getRun(plan, first)!.state).toBe('stopped');
    expect(reduceSessions(await runEventsOnDisk(root, plan, first)).get('ses-0001')!.state).toBe('live');

    const runId = (await service.execute(startRun(plan))).jobId;
    await until(async () => agent!.sessions.length === 2 && await entriesOf(runId) >= 3);

    // Live first, then the interrupted session of the run that ended.
    const list = await ok(origin, protocolPaths.sessions(), sessionListResponseSchema);
    expect(list.sessions.map(entry => [entry.ref.source === 'run' ? entry.ref.runId : null, entry.state])).toEqual([[runId, 'live'], [first, 'interrupted']]);
    const interrupted = await ok(origin, protocolPaths.runSessions(plan, first), runSessionsResponseSchema);
    expect(interrupted.sessions[0]).toMatchObject({ state: 'interrupted', awaiting: 'inv-0001', invocations: [{ ended: null, outcome: null }] });

    const live = await ok(origin, protocolPaths.runSessions(plan, runId), runSessionsResponseSchema);
    expect(live.sessions).toHaveLength(1);
    expect(live.sessions[0]).toMatchObject({ session: 'ses-0001', state: 'live', awaiting: 'inv-0001', invocations: [{ ended: null, kept: null, point: null }] });
    expect(live.sessions[0]!.invocations[0]!.evaluation).toMatchObject({ ended: null, usage: { unavailable: 'the invocation has not ended' } });
    const poll = (version: number, cursors: SessionCursor[]) => ok(origin, protocolPaths.runSessionUpdates(plan, runId, version, cursors), sessionUpdatesResponseSchema);

    // From nothing: the session, and its entries so far.
    const opening = await poll(0, [{ session: 'ses-0001', after: 0 }]);
    expect(opening.version).toBe(live.version);
    expect(opening.sessions.map(view => [view.session, view.state])).toEqual([['ses-0001', 'live']]);
    const [page] = opening.transcripts;
    expect(page!.page.entries.map(entry => entry.type)).toEqual(['started', 'message', 'message']);
    expect(page!.page.entries.map(entry => entry.n)).toEqual([1, 2, 3]);
    expect(page!.page.cursor).toBe(3);

    // Nothing changed: no session, no entry, and the cursor stays.
    const quiet = await poll(opening.version, [{ session: 'ses-0001', after: 3 }]);
    expect(quiet).toEqual({ version: opening.version, sessions: [], transcripts: [{ session: 'ses-0001', page: { ...page!.page, entries: [], cursor: 3 } }] });
    // Only the entries after the cursor.
    expect((await poll(opening.version, [{ session: 'ses-0001', after: 2 }])).transcripts[0]!.page.entries.map(entry => entry.n)).toEqual([3]);

    // The stop ends the invocation and finishes the session; the next poll says so.
    await stop(runId);
    const after = await poll(opening.version, [{ session: 'ses-0001', after: 3 }]);
    expect(after.version).toBeGreaterThan(opening.version);
    expect(after.sessions.map((view: RunSessionView) => [view.session, view.state, view.finished])).toEqual([['ses-0001', 'finished', 'run-ended']]);
    expect(after.sessions[0]!.invocations[0]).toMatchObject({ outcome: 'stopped', kept: false, point: { session: 'ses-0001', invocation: 'inv-0001' } });
    const newer = after.transcripts[0]!.page.entries;
    expect(newer.map(entry => entry.type)).toEqual(['ended', 'point']);
    expect(newer.map(entry => entry.n)).toEqual([4, 5]);
    expect(after.transcripts[0]!.page.cursor).toBe(5);
    expect(await poll(after.version, [{ session: 'ses-0001', after: 5 }])).toMatchObject({ version: after.version, sessions: [], transcripts: [{ page: { entries: [], cursor: 5 } }] });

    // A poll it cannot answer is refused, never guessed.
    const path = (query: string) => `${protocolPaths.runSessions(plan, runId)}/updates?${query}`;
    expect(await refused(origin, path(`version=${after.version + 1}&cursors=ses-0001:0`))).toEqual([400, 'invalid-request']);
    expect(await refused(origin, path('version=0&cursors=ses-0009:0'))).toEqual([404, 'not-found']);
    expect(await refused(origin, path('version=0&cursors=ses-0001'))).toEqual([400, 'invalid-request']);
    expect(await refused(origin, path('version=0&cursors=ses-0001:0,ses-0001:2'))).toEqual([400, 'invalid-request']);
    const many = Array.from({ length: 51 }, (_, index) => `ses-${String(index + 1).padStart(4, '0')}:0`).join(',');
    expect(await refused(origin, path(`version=0&cursors=${many}`))).toEqual([400, 'invalid-request']);
    expect((await poll(0, [])).transcripts).toEqual([]);
  }, 120_000);
});
