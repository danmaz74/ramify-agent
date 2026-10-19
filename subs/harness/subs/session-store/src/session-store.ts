import { createHash } from 'node:crypto';
import { mkdir, readFile } from 'node:fs/promises';
import { readFileSync, statSync, type BigIntStats } from 'node:fs';
import { join, resolve } from 'node:path';
import { z } from 'zod';
import { acquireSessionStoreLock, type SessionStoreLock } from '../../../src/store/lock.js';
import { SessionRecordUnavailableError, SessionDriverUnavailableError } from '../../agent/src/interfaces/session-operations.js';
import type { SessionStore, SessionStoreCommit, SessionStoreRecord } from '../../agent/src/interfaces/session-operations.js';
import { openLedger } from '../../ledger/src/ledger.js';
import { writeFileAtomic, writeFileExclusive } from '../../ledger/src/atomic.js';

/** Session adapters share this writer domain; ledger still rejects an unrelated concurrent process writer. */
const queues = new Map<string, Promise<unknown>>();
async function serialized<T>(path: string, work: () => Promise<T>): Promise<T> {
  const previous = queues.get(path) ?? Promise.resolve();
  const pending = previous.then(work, work);
  const tail = pending.then(() => undefined, () => undefined);
  queues.set(path, tail);
  try { return await pending; } finally { if (queues.get(path) === tail) queues.delete(path); }
}
const hash = (bytes: Uint8Array | string) => createHash('sha256').update(bytes).digest('hex');
const envelope = z.object({
  runId: z.string().min(1), id: z.string().min(1), revision: z.number().int().positive(),
  schema: z.enum(['ramify-agent.session/1', 'ramify-agent.session-operation/1']), body: z.record(z.string(), z.unknown()),
}).strict();
const contentId = z.string().regex(/^[a-f0-9]{64}$/);
const headerSchema = envelope.omit({ body: true }).extend({ bodyId: contentId }).strict();
const eventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('session-store-commit'), runId: z.string().min(1), records: z.array(envelope), payloads: z.array(contentId) }).strict(),
  z.object({ type: z.literal('session-store-commit/2'), runId: z.string().min(1), records: z.array(headerSchema), payloads: z.array(contentId) }).strict(),
]);
export interface LedgerSessionStoreOptions { readonly directory: string }
export interface LedgerSessionStore extends SessionStore {
  /** Fresh independently owned record with the native JSON normalization of read followed by a JSON clone. */
  readDetached(runId: string, id: string): Promise<SessionStoreRecord | null>;
  /** Captures complete logical JSON input before any queued writer work. */
  commitCaptured(input: SessionStoreCommit): ReturnType<SessionStore['commit']>;
  close(): Promise<void>;
}
type SessionLedger = Awaited<ReturnType<typeof openLedger<z.infer<typeof eventSchema>>>>;
type Fingerprint = Pick<BigIntStats, 'dev' | 'ino' | 'size' | 'mtimeNs' | 'ctimeNs'>;
const sameFingerprint = (left: Fingerprint | null, right: Fingerprint | null): boolean => left === right || (left !== null && right !== null && left.dev === right.dev && left.ino === right.ino && left.size === right.size && left.mtimeNs === right.mtimeNs && left.ctimeNs === right.ctimeNs);
/** Classified once per validated immutable body, never from a text pattern.
 * Native JSON cloning changes negative zero and non-finite parsed numbers.
 * Iteration preserves the existing acceptance of deeply nested JSON.
 */
function needsJsonNormalization(body: Readonly<Record<string, unknown>>): boolean {
  const pending: unknown[] = [body];
  while (pending.length > 0) {
    const value = pending.pop();
    if (typeof value === 'number' && (Object.is(value, -0) || !Number.isFinite(value))) return true;
    if (value !== null && typeof value === 'object') {
      for (const key of Object.keys(value)) pending.push((value as Record<string, unknown>)[key]);
    }
  }
  return false;
}
interface ValidatedState {
  readonly ledger: SessionLedger;
  readonly records: Map<string, SessionStoreRecord>;
  readonly serializedRecords: Map<string, string>;
  readonly bodyRefs: Map<string, string>;
  readonly payloads: Set<string>;
  log: Fingerprint | null;
}
interface WriterDomain {
  readonly lock: SessionStoreLock;
  references: number;
  state: ValidatedState | null;
  unavailable: string | null;
}
const writers = new Map<string, WriterDomain>();

/** Journal metadata detects an unexpected writer; payload bytes are checked on demand. */
function fingerprint(path: string): Fingerprint | null {
  try {
    const value = statSync(path, { bigint: true });
    if (!value.isFile()) throw new Error(`Session store path is not a file: ${path}`);
    return value;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}

/** Ledger replay, rather than materialized copies or provider files, is authoritative. */
export async function openSessionStore(options: LedgerSessionStoreOptions): Promise<LedgerSessionStore> {
  const directory = resolve(options.directory);
  const logPath = join(directory, 'session-ledger.jsonl');
  const payloadDirectory = join(directory, 'payloads');
  const bodyDirectory = join(directory, 'record-bodies');
  const writer = await serialized(directory, async () => {
    const prior = writers.get(directory);
    if (prior) { prior.references++; return prior; }
    const created: WriterDomain = { lock: await acquireSessionStoreLock(directory), references: 1, state: null, unavailable: null };
    writers.set(directory, created); return created;
  });
  let closed = false;
  const assertWriter = async () => {
    if (closed) throw new Error('Session store writer ownership unavailable');
    if (!await writer.lock.held()) {
      writer.state = null;
      writer.unavailable = 'Session store writer ownership unavailable';
    }
    if (writer.unavailable !== null) throw new Error(writer.unavailable);
  };
  await mkdir(payloadDirectory, { recursive: true });
  await mkdir(bodyDirectory, { recursive: true });
  const ledger = () => openLedger({ logPath, recordsRoot: join(directory, 'records'), eventSchema });
  function journalProof() {
    const before = fingerprint(logPath);
    let bytes: Buffer | null;
    try { bytes = readFileSync(logPath); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') bytes = null; else throw error; }
    const after = fingerprint(logPath);
    if (!sameFingerprint(before, after) || (before === null) !== (bytes === null)) {
      writer.state = null; writer.unavailable = 'Session ledger changed while validating'; throw new Error(writer.unavailable);
    }
    return { log: after, bytes: bytes ?? Buffer.alloc(0) };
  }
  const bodyPath = (id: string) => {
    if (!/^[a-f0-9]{64}$/.test(id)) throw new Error('Invalid session record body identity');
    return join(bodyDirectory, `${id}.json`);
  };
  function bodyBytes(id: string): Buffer {
    let bytes: Buffer;
    try { bytes = readFileSync(bodyPath(id)); }
    catch (error) { writer.state = null; if ((error as NodeJS.ErrnoException).code === 'ENOENT') throw new SessionRecordUnavailableError(`Committed session record body unavailable: ${id}`); throw error; }
    if (hash(bytes) !== id) { writer.state = null; throw new SessionRecordUnavailableError(`Corrupt session record body ${id}`); }
    return bytes;
  }
  function readBody(id: string): Record<string, unknown> {
    return z.record(z.string(), z.unknown()).parse(JSON.parse(bodyBytes(id).toString('utf8')));
  }
  function detachedRecord(state: ValidatedState, key: string, jsonNormalized = false): SessionStoreRecord | null {
    const record = state.records.get(key);
    if (!record) return null;
    const bodyId = state.bodyRefs.get(key);
    if (bodyId !== undefined) {
      // Parse the same physically read and hash-authenticated bytes. The owning
      // record validator only omits root keys; nested unknown values are intact.
      let body = readBody(bodyId);
      if (jsonNormalized && needsJsonNormalization(body)) body = JSON.parse(JSON.stringify(body)) as Record<string, unknown>;
      return { runId: record.runId, id: record.id, revision: record.revision, schema: record.schema, body };
    }
    return JSON.parse(state.serializedRecords.get(key)!) as SessionStoreRecord;
  }
  const payloadPaths = new Map<string, string>();
  const payloadPath = (id: string) => {
    const prior = payloadPaths.get(id);
    if (prior !== undefined) return prior;
    if (!/^[a-f0-9]{64}$/.test(id)) throw new Error('Invalid transcript payload identity');
    const path = join(payloadDirectory, id);
    payloadPaths.set(id, path);
    return path;
  };
  async function readPayload(id: string): Promise<Uint8Array | null> {
    let bytes: Uint8Array;
    try { bytes = await readFile(payloadPath(id)); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null; throw error; }
    if (hash(bytes) !== id) throw new SessionDriverUnavailableError(`Corrupt transcript payload ${id}`);
    return new Uint8Array(bytes);
  }
  async function validatePayload(id: string, missing = 'Committed transcript payload unavailable'): Promise<void> {
    const path = payloadPath(id);
    const before = fingerprint(path);
    if (before === null) throw new Error(`${missing}: ${id}`);
    if (await readPayload(id) === null) throw new Error(`${missing}: ${id}`);
    const after = fingerprint(path);
    if (!sameFingerprint(before, after)) throw new Error(`Transcript payload changed while validating: ${id}`);
  }
  async function load(): Promise<ValidatedState> {
    await assertWriter();
    const cached = writer.state;
    if (cached !== null) {
      const before = journalProof();
      if (!sameFingerprint(before.log, cached.log) || !cached.ledger.matchesCommittedContent(before.bytes)) {
        writer.state = null;
        writer.unavailable = 'Session ledger changed outside the owned writer';
        throw new Error(writer.unavailable);
      }
      const after = journalProof();
      if (!sameFingerprint(after.log, cached.log) || !after.bytes.equals(before.bytes) || !cached.ledger.matchesCommittedContent(after.bytes)) {
        writer.state = null;
        writer.unavailable = 'Session ledger changed outside the owned writer';
        throw new Error(writer.unavailable);
      }
      await assertWriter();
      return cached;
    }
    journalProof();
    const current = await ledger();
    const proof = journalProof();
    // The owner authenticates exactly the complete bytes it loaded, including
    // its legitimate torn-tail repair. Never reopen to learn a changed prefix.
    if (!current.matchesCommittedContent(proof.bytes)) {
      writer.state = null; writer.unavailable = 'Session ledger changed while opening'; throw new Error(writer.unavailable);
    }
    const records = new Map<string, SessionStoreRecord>();
    const bodyRefs = new Map<string, string>();
    const payloadIds = new Set<string>();
    for (const entry of current.replay()) {
      for (const item of entry.transaction.event.records) {
        if (item.runId !== entry.transaction.event.runId) throw new Error('Corrupt session transaction run identity');
        const id = JSON.stringify([item.runId, item.id]);
        const expected = (records.get(id)?.revision ?? 0) + 1;
        if (item.revision !== expected) throw new Error(`Corrupt session record revision for ${item.id}`);
        if (entry.transaction.event.type === 'session-store-commit/2') {
          const header = headerSchema.parse(item);
          // The ledger authenticates headers. A body is inspected only when its
          // record is requested or participates in CAS, isolating optional history.
          records.set(id, envelope.parse({ runId: header.runId, id: header.id, revision: header.revision, schema: header.schema, body: {} }));
          bodyRefs.set(id, header.bodyId);
        } else {
          records.set(id, envelope.parse(item));
          bodyRefs.delete(id);
        }
      }
      for (const id of entry.transaction.event.payloads) payloadIds.add(id);
    }
    // Transcript bytes are optional context: authenticate only when requested.
    // Retain committed identities so later lifecycle updates can reference lost context.
    const payloads = payloadIds;
    await assertWriter();
    const after = journalProof();
    if (!sameFingerprint(after.log, proof.log) || !after.bytes.equals(proof.bytes) || !current.matchesCommittedContent(after.bytes)) {
      writer.state = null; writer.unavailable = 'Session ledger changed while validating'; throw new Error(writer.unavailable);
    }
    const serializedRecords = new Map([...records].filter(([id]) => !bodyRefs.has(id)).map(([id, item]) => [id, JSON.stringify(item)]));
    const loaded: ValidatedState = { ledger: current, records, serializedRecords, bodyRefs, payloads, log: proof.log };
    writer.state = loaded;
    return loaded;
  }
  // Opening validates durable headers; individual bodies and optional context are read on demand.
  try { await serialized(logPath, () => load()); }
  catch (error) {
    await serialized(directory, async () => { writer.references--; if (writer.references === 0) { writers.delete(directory); await writer.lock.release(); } });
    throw error;
  }
  type Prepared = { readonly record: SessionStoreRecord; readonly bytes: string };
  function preparedBody(header: Record<string, unknown>, encoded: string, parsed = JSON.parse(encoded) as Record<string, unknown>): Prepared {
    const record = envelope.parse({ ...header, body: parsed });
    const keys = Object.keys(parsed);
    const validatedKeys = Object.keys(record.body);
    // The record parser can omit keys such as __proto__. Reuse bytes only
    // when validation retained every own key, its order and actual value.
    const unchanged = keys.length === validatedKeys.length && validatedKeys.every((key, index) => key === keys[index] && record.body[key] === parsed[key]);
    return { record, bytes: unchanged ? encoded : JSON.stringify(record.body) };
  }
  function prepareOrdinary(input: SessionStoreCommit): Prepared[] {
    return input.records.map(item => {
      const plain = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
      if (!plain(item) || !plain(item.body)) {
        // Retain the whole-envelope normalization and validation errors for
        // unsupported or invalid record/body shapes.
        const record = envelope.parse(JSON.parse(JSON.stringify(item)));
        return { record, bytes: JSON.stringify(record.body) };
      }
      const encoded = JSON.stringify(item.body);
      const parsed = JSON.parse(encoded) as Record<string, unknown>;
      const header = JSON.parse(JSON.stringify({ ...item, body: undefined }));
      return preparedBody(header, encoded, parsed);
    });
  }
  function commitOwned(input: SessionStoreCommit, admitted?: readonly Prepared[]): ReturnType<SessionStore['commit']> {
    return serialized(logPath, async () => {
      await assertWriter();
      if (!input.runId) throw new Error('Missing run identity');
      const prepared = admitted ?? prepareOrdinary(input);
      const records = prepared.map(item => item.record);
      const ids = records.map(item => item.id);
      if (new Set(ids).size !== ids.length || new Set(input.expected.map(item => item.id)).size !== input.expected.length) throw new Error('Duplicate CAS record identity');
      const state = await load();
      const current = state.records;
      const checkedExpected = input.expected.map(expected => {
        const key = JSON.stringify([input.runId, expected.id]);
        const bodyId = state.bodyRefs.get(key);
        // The complete owned journal authenticates the private header.
        // Validate every actual referenced body before deciding any conflict;
        // comparing its revision needs no additional decoded body copy.
        if (bodyId !== undefined) bodyBytes(bodyId);
        return { expected, actual: current.get(key) ?? null };
      });
      for (const { expected, actual } of checkedExpected) {
        if ((actual?.revision ?? null) !== expected.revision) return { kind: 'conflict' as const, reason: `Revision conflict for ${expected.id}` };
      }
      for (const item of records) {
        const expected = input.expected.find(value => value.id === item.id);
        if (item.runId !== input.runId || !expected || item.revision !== (expected.revision ?? 0) + 1) throw new Error(`Invalid CAS envelope for ${item.id}`);
      }
      const payloads = new Set(input.payloads);
      for (const id of payloads) {
        // New references must be present; historical references may have lost optional context.
        if (!state.payloads.has(id)) await validatePayload(id, 'Missing committed payload');
      }
      // Cache the JSON representation the ledger actually commits. In
      // particular, Dates, undefined fields and non-finite numbers must not
      // read differently before and after reopening the authoritative log.
      const headers: z.infer<typeof headerSchema>[] = [];
      for (const { record: item, bytes } of prepared) {
        const bodyId = hash(bytes);
        await writeFileExclusive(bodyPath(bodyId), bytes);
        bodyBytes(bodyId);
        headers.push({ runId: item.runId, id: item.id, revision: item.revision, schema: item.schema, bodyId });
      }
      const event = eventSchema.parse({ type: 'session-store-commit/2', runId: input.runId, records: headers, payloads: [...new Set(input.payloads)] });
      await assertWriter();
      const expectedBodyIds = new Set(input.expected.map(item => state.bodyRefs.get(JSON.stringify([input.runId, item.id]))).filter((id): id is string => id !== undefined));
      for (const id of expectedBodyIds) bodyBytes(id);
      for (const item of headers) bodyBytes(item.bodyId);
      const beforeAppend = journalProof();
      if (!sameFingerprint(beforeAppend.log, state.log) || !state.ledger.matchesCommittedContent(beforeAppend.bytes)) {
        writer.state = null; writer.unavailable = 'Session ledger changed outside the owned writer'; throw new Error(writer.unavailable);
      }
      try {
        // One flushed header transaction references complete authenticated
        // bodies already persisted atomically. Advisory record copies add
        // no recovery proof to this private adapter.
        await state.ledger.append({ event, records: [] });
        const proof = journalProof();
        if (proof.log === null || !state.ledger.matchesCommittedContent(proof.bytes)) {
          writer.unavailable = 'Session ledger changed outside the owned writer'; throw new Error(writer.unavailable);
        }
        for (const id of expectedBodyIds) bodyBytes(id);
        for (const item of headers) bodyBytes(item.bodyId);
        state.log = proof.log;
        await assertWriter();
      } catch (error) {
        // A failed append can leave a torn or complete durable line. Replay
        // is authoritative on the next operation; never publish speculative
        // records or keep the old ledger's potentially stale byte position.
        writer.state = null;
        throw error;
      }
      for (const item of records) {
        const key = JSON.stringify([item.runId, item.id]);
        current.set(key, item);
        state.serializedRecords.delete(key);
      }
      for (const item of headers) state.bodyRefs.set(JSON.stringify([item.runId, item.id]), item.bodyId);
      for (const id of payloads) state.payloads.add(id);
      return { kind: 'committed' as const };
    });
  }
  return {
    async close() {
      await serialized(logPath, async () => {
        if (closed) return; closed = true;
        await serialized(directory, async () => { writer.references--; if (writer.references === 0) { writers.delete(directory); await writer.lock.release(); } });
      });
    },
    async read(runId, id) {
      return serialized(logPath, async () => {
        return detachedRecord(await load(), JSON.stringify([runId, id]));
      });
    },
    async readDetached(runId, id) {
      return serialized(logPath, async () => detachedRecord(await load(), JSON.stringify([runId, id]), true));
    },
    async putPayload(bytes) {
      const copy = new Uint8Array(bytes);
      return serialized(logPath, async () => {
        await assertWriter();
        const id = hash(copy);
        await writeFileExclusive(payloadPath(id), copy);
        let stored: Uint8Array | null;
        try { stored = await readPayload(id); }
        catch (error) {
          if (!(error instanceof SessionDriverUnavailableError)) throw error;
          // Known bytes reconstitute this optional content-addressed cache entry.
          await assertWriter();
          await writeFileAtomic(payloadPath(id), copy);
          stored = await readPayload(id);
        }
        if (stored === null || !Buffer.from(stored).equals(Buffer.from(copy))) throw new Error(`Transcript payload identity collision: ${id}`);
        return id;
      });
    },
    getPayload: id => serialized(logPath, async () => { await assertWriter(); return readPayload(id); }),
    async commit(input: SessionStoreCommit) {
      const captured = structuredClone(input);
      return commitOwned(captured);
    },
    async commitCaptured(input: SessionStoreCommit) {
      // Body references are borrowed only inside this synchronous admission.
      // Copy every metadata field before body getters/toJSON run; never pass
      // a raw exotic body through structuredClone or into the queued writer.
      const items = [...input.records];
      const headers = items.map(item => {
        const header: Record<string, unknown> = {};
        // Unlike object rest, excluding the key this way does not invoke an
        // accessor on the envelope's body before metadata has been detached.
        for (const key of Object.keys(item)) if (key !== 'body') Object.defineProperty(header, key, {
          value: (item as unknown as Record<string, unknown>)[key], enumerable: true, writable: true, configurable: true,
        });
        return header;
      });
      const metadata = structuredClone({ runId: input.runId, expected: input.expected, payloads: input.payloads, headers });
      const prepared = items.map((item, index) => {
        const header = JSON.parse(JSON.stringify(metadata.headers[index]!)) as Record<string, unknown>;
        return preparedBody(header, JSON.stringify(item.body));
      });
      return commitOwned({ runId: metadata.runId, expected: metadata.expected, payloads: metadata.payloads, records: prepared.map(item => item.record) }, prepared);
    },
  };
}
