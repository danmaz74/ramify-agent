import { open, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import type { InvocationEvaluation } from '../../../src/interfaces/protocol/runs.js';
import {
  sessionBodyHashSchema, sessionQueryLimits,
  type RunSessionView, type RunSessionResponse, type RunSessionsResponse, type SessionBodyResponse, type SessionCursor, type SessionListResponse,
  type SessionRef, type SessionListEntry, type SessionTranscriptResponse, type SessionUpdatesResponse,
  type TranscriptPage, type UnservedSessionSource,
} from '../../../src/interfaces/protocol/sessions.js';
import { runLayout } from '../../autonomous/src/run/records.js';
import { TranscriptPages, type PageBounds, type TranscriptPageRead } from '../../task-execution/src/transcripts/pages.js';
import { readTranscript } from '../../task-execution/src/transcripts/writer.js';
import { ProjectionError, runView, type RunView } from './inputs.js';
import { invocationEvaluation } from './metrics.js';
import { evaluationOf, readObservationLog } from './metrics.js';
import { manualSessionIds, manualSessionRun, type ManualSessionRun } from './manual-sessions.js';
import { servedRun, type RunSource } from './queries.js';
import { manualSessionViews, orderSessions, runSessionEntry, runSessionViews } from './sessions.js';

/*
 * The session queries. Every answer is a projection of a run's log and
 * records or of a transcript; nothing here writes.
 *
 * A run's sessions are derived once per run version and kept: the project's
 * list and every poll compare each run's version with the one they were
 * derived at, and derive again only the runs that changed. An ended
 * invocation's evaluation is final, so it is read once; the evaluation of an
 * invocation still awaited is read by every query. Transcripts are read
 * through `TranscriptPages`, which reads only what was appended since.
 */

/** A run's sessions as its log derived them at one version. */
interface RunSessionsAt {
  readonly version: number;
  readonly view: RunView | ManualSessionRun;
  readonly sessions: readonly RunSessionView[];
}

const runKey = (planId: string, runId: string): string => `${planId}\u0000${runId}`;

export class SessionQueries {
  private readonly runs = new Map<string, RunSessionsAt>();
  private readonly evaluations = new Map<string, InvocationEvaluation>();
  private readonly pages = new TranscriptPages();

  constructor(private readonly source: RunSource) {}

  /** Every session of the project, in the project's order, one page from `offset`. */
  async list(offset: number): Promise<SessionListResponse> {
    const entries: SessionListEntry[] = [];
    const unserved: UnservedSessionSource[] = [];
    for (const { planId, runId, version } of this.source.runVersions()) {
      try {
        const at = await this.at(planId, runId, version);
        entries.push(...at.sessions.map(session => runSessionEntry(planId, runId, session)));
      } catch (error) {
        if (!(error instanceof ProjectionError)) throw error;
        unserved.push({ source: 'run', path: join('plans', planId, '.harness', 'jobs', runId), message: error.message });
      }
    }
    for (const runId of await manualSessionIds(this.source.projectRoot)) {
      try {
        const at = await this.at('sessions', runId);
        entries.push(...at.sessions.map(session => runSessionEntry('sessions', runId, session)));
      } catch (error) {
        if (!(error instanceof ProjectionError)) throw error;
        unserved.push({ source: 'run', path: join('plans', 'sessions', '.harness', 'jobs', runId), message: error.message });
      }
    }
    const ordered = orderSessions(entries);
    const page = ordered.slice(offset, offset + sessionQueryLimits.sessions);
    const next = offset + page.length;
    return { sessions: page, total: ordered.length, offset, next: next < ordered.length ? next : null, unserved };
  }

  /** A run's sessions with their invocations' evaluations, at the run's current version. */
  async runSessions(planId: string, runId: string): Promise<RunSessionsResponse> {
    const at = await this.at(planId, runId);
    const sessions = at.sessions.slice(0, sessionQueryLimits.runSessions);
    return { version: at.version, sessions: await this.evaluated(planId, runId, at, sessions), total: at.sessions.length };
  }

  /** A targeted session can be read even when it lies beyond the bounded run list. */
  async runSession(planId: string, runId: string, session: string): Promise<RunSessionResponse> {
    const at = await this.at(planId, runId);
    const found = at.sessions.find(candidate => candidate.session === session);
    if (found === undefined) throw new ProjectionError('not-found', `Run ${runId} has no session ${session}`);
    return { version: at.version, session: (await this.evaluated(planId, runId, at, [found]))[0]! };
  }

  /** The entries of one session after `after`. */
  async transcript(ref: SessionRef, after: number): Promise<SessionTranscriptResponse> {
    const path = this.transcriptOf(await this.at(ref.planId, ref.runId), ref.runId, ref.session);
    return { session: ref, page: pageOf(await this.pages.page(path, after, { entries: sessionQueryLimits.entries, bytes: sessionQueryLimits.pageBytes })) };
  }

  /**
   * One poll of a run: every session changed after `version`, and the
   * entries of each followed session after its cursor. The sessions are
   * derived first, so a state committed before the poll is in its answer;
   * an entry written after that version may arrive before the state it
   * belongs to, which the next poll brings. The pages share one byte bound,
   * in the request's order.
   */
  async updates(planId: string, runId: string, version: number, cursors: readonly SessionCursor[]): Promise<SessionUpdatesResponse> {
    const at = await this.at(planId, runId);
    if (version > at.version) {
      throw new ProjectionError('invalid-request', `Version ${version} is after run ${runId}'s last event, ${at.version}`);
    }
    const paths = cursors.map(cursor => this.transcriptOf(at, runId, cursor.session));
    const changed = at.sessions.filter(session => session.changed.sequence > version).slice(0, sessionQueryLimits.runSessions);
    const sessions = await this.evaluated(planId, runId, at, changed);
    let budget: number = sessionQueryLimits.pageBytes;
    const transcripts: SessionUpdatesResponse['transcripts'] = [];
    for (const [index, cursor] of cursors.entries()) {
      const bounds: PageBounds = budget > 0 ? { entries: sessionQueryLimits.entries, bytes: budget } : { entries: 0, bytes: 0 };
      const read = await this.pages.page(paths[index]!, cursor.after, bounds);
      budget -= read.bytes;
      transcripts.push({ session: cursor.session, page: pageOf(read) });
    }
    return { version: at.version, sessions, transcripts };
  }

  /** A body of the run's content store. */
  async runBody(planId: string, runId: string, hash: string): Promise<SessionBodyResponse> {
    const at = await this.at(planId, runId);
    return blobOf(join(at.view.directory, runLayout.blobs), hash);
  }

  /** A file one of the run's session transcripts names, relative to the run's directory. */
  async runFile(planId: string, runId: string, session: string, path: string): Promise<SessionBodyResponse> {
    const at = await this.at(planId, runId);
    return namedFile(at.view.directory, this.transcriptOf(at, runId, session), path);
  }

  /**
   * A served run's sessions at its current version: the kept ones where the
   * version has not moved, derived again where it has. `known` is the
   * version the caller already read, which saves looking it up.
   */
  private async at(planId: string, runId: string, known?: number): Promise<RunSessionsAt> {
    const version = known ?? this.source.runVersions().find(entry => entry.planId === planId && entry.runId === runId)?.version;
    const key = runKey(planId, runId);
    const cached = this.runs.get(key);
    if (version !== undefined && cached !== undefined && cached.version === version) return cached;
    if (version === undefined && planId === 'sessions') {
      const manual = await manualSessionRun(this.source.projectRoot, runId);
      if (manual !== null) {
        const current = manual.events.at(-1)?.sequence ?? 0;
        if (cached !== undefined && cached.version === current) return cached;
        const at: RunSessionsAt = { version: current, view: manual, sessions: manualSessionViews(manual) };
        this.runs.set(key, at);
        return at;
      }
    }
    const view = runView(await servedRun(this.source, planId, runId));
    const at: RunSessionsAt = { version: view.events.at(-1)?.sequence ?? 0, view, sessions: runSessionViews(view) };
    this.runs.set(key, at);
    return at;
  }

  /** The sessions, with each invocation's evaluation. */
  private async evaluated(planId: string, runId: string, at: RunSessionsAt, sessions: readonly RunSessionView[]): Promise<RunSessionView[]> {
    const result: RunSessionView[] = [];
    for (const session of sessions) {
      const invocations = [];
      for (const invocation of session.invocations) {
        invocations.push({ ...invocation, evaluation: await this.evaluation(planId, runId, at.view, invocation.invocation) });
      }
      result.push({ ...session, invocations });
    }
    return result;
  }

  private async evaluation(planId: string, runId: string, view: RunView | ManualSessionRun, id: string): Promise<InvocationEvaluation | null> {
    const key = `${runKey(planId, runId)}\u0000${id}`;
    const kept = this.evaluations.get(key);
    if (kept !== undefined) return kept;
    const invocation = view.records.invocations.get(id);
    if (invocation === undefined) return null;
    const evaluation = 'kind' in view.record && view.record.kind === 'manual'
      ? evaluationOf({ invocation, outcome: view.records.outcomes.get(id) ?? null,
        observations: await readObservationLog(join(view.directory, runLayout.observations(id)), runLayout.observations(id)),
        lines: { unavailable: 'Manual sessions do not record line events' } })
      : await invocationEvaluation(view as RunView, invocation);
    if (view.records.outcomes.has(id)) this.evaluations.set(key, evaluation);
    return evaluation;
  }

  /** A session's transcript file; a session the run never opened is not found. */
  private transcriptOf(at: RunSessionsAt, runId: string, session: string): string {
    if (!at.sessions.some(candidate => candidate.session === session)) {
      throw new ProjectionError('not-found', `Run ${runId} has no session ${session}`);
    }
    return join(at.view.directory, runLayout.transcript(session));
  }

}

/** A page as the protocol states it. */
function pageOf(read: TranscriptPageRead): TranscriptPage {
  return {
    file: read.missing ? 'missing' : 'present',
    entries: [...read.entries],
    cursor: read.cursor,
    more: read.more,
    partial: read.partial,
    unreadable: [...read.unreadable],
  };
}

/** One blob of a content store, by its hash. */
async function blobOf(directory: string, hash: string): Promise<SessionBodyResponse> {
  if (!sessionBodyHashSchema.safeParse(hash).success) throw new ProjectionError('invalid-request', `"${hash}" is not a content hash`);
  const body = await boundedRead(join(directory, hash));
  if (body === null) throw new ProjectionError('not-found', `The content store holds no body ${hash}`);
  return body;
}

/**
 * A file the transcript names as a body, relative to `root`. A path the
 * transcript does not name, or one outside `root`, is not served: a body
 * query reads raw output the transcript points to, nothing else of the
 * directory.
 */
async function namedFile(root: string, transcript: string, path: string): Promise<SessionBodyResponse> {
  const named = new Set<string>();
  for (const entry of (await readTranscript(transcript)).entries) collectFiles(entry, named);
  const absolute = join(root, ...path.split('/'));
  const inside = relative(root, absolute);
  if (!named.has(path) || inside.startsWith('..') || inside === '') {
    throw new ProjectionError('not-found', `The transcript names no file ${path}`);
  }
  const body = await boundedRead(absolute);
  if (body === null) throw new ProjectionError('not-found', `The file ${path} the transcript names is no longer there`);
  return body;
}

/** Every `file` body's path in an entry. */
function collectFiles(node: unknown, into: Set<string>): void {
  if (Array.isArray(node)) {
    for (const item of node) collectFiles(item, into);
    return;
  }
  if (node === null || typeof node !== 'object') return;
  const body = node as { stored?: unknown; path?: unknown };
  if (body.stored === 'file' && typeof body.path === 'string') into.add(body.path);
  for (const value of Object.values(node)) collectFiles(value, into);
}

/** At most the body bound of a file, cut at a character boundary; null where it is not there. */
async function boundedRead(path: string): Promise<SessionBodyResponse | null> {
  let size: number;
  try {
    const found = await stat(path);
    if (!found.isFile()) return null;
    size = found.size;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
  const limit = Math.min(size, sessionQueryLimits.bodyBytes);
  const handle = await open(path, 'r');
  try {
    const buffer = Buffer.alloc(limit);
    let read = 0;
    while (read < limit) {
      const { bytesRead } = await handle.read(buffer, read, limit - read, read);
      if (bytesRead === 0) break;
      read += bytesRead;
    }
    // A streaming decode leaves a character the bound cut in half undecoded.
    const content = new TextDecoder('utf-8').decode(buffer.subarray(0, read), { stream: size > limit });
    return { content, bytes: size, truncated: size > limit };
  } finally {
    await handle.close();
  }
}
