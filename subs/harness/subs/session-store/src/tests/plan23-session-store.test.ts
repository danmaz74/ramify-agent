import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.unmock('../session-store.js');
import { openSessionStore, type LedgerSessionStore } from '../session-store.js';
import type { SessionStoreRecord } from '../../../agent/src/interfaces/session-operations.js';

const stores: LedgerSessionStore[] = []; const directories: string[] = [];
afterEach(async () => { for (const store of stores.splice(0)) await store.close(); for (const directory of directories.splice(0)) await rm(directory, { recursive: true, force: true }); });
async function setup(directory?: string) {
  const path = directory ?? await mkdtemp(join(tmpdir(), 'plan23-store-')); if (!directory) directories.push(path);
  const store = await openSessionStore({ directory: path }); stores.push(store); return { path, store };
}

describe('Plan 23 ledger session store persistence', () => {
  it('immutable exact payload bytes and atomic multi-record CAS survive fresh adapters and missing materialized copies', async () => {
    const { path, store } = await setup(); const bytes = new Uint8Array([0, 255, 1, 10]); const id = await store.putPayload(bytes);
    expect(id).toMatch(/^[a-f0-9]{64}$/); expect(await store.putPayload(bytes)).toBe(id);
    const first: SessionStoreRecord = { runId: 'A', id: 'session:s', revision: 1, schema: 'ramify-agent.session/1', body: { refs: [id] } };
    const operation: SessionStoreRecord = { ...first, id: 'operation:o', schema: 'ramify-agent.session-operation/1', body: { outcome: 'completed' } };
    expect(await store.commit({ runId: 'A', expected: [{ id: first.id, revision: null }, { id: operation.id, revision: null }], records: [first, operation], payloads: [id] })).toEqual({ kind: 'committed' });
    const before = await readFile(join(path, 'session-ledger.jsonl'), 'utf8');
    expect((await store.commit({ runId: 'A', expected: [{ id: first.id, revision: 1 }, { id: operation.id, revision: null }], records: [{ ...first, revision: 2 }], payloads: [id] })).kind).toBe('conflict');
    expect(await readFile(join(path, 'session-ledger.jsonl'), 'utf8')).toBe(before);
    await rm(join(path, 'records'), { recursive: true }); await store.close();
    const reopened = (await setup(path)).store;
    expect(await reopened.read('A', first.id)).toEqual(first); expect(await reopened.read('A', operation.id)).toEqual(operation); expect(await reopened.getPayload(id)).toEqual(bytes);
    expect(await reopened.read('other-run', first.id)).toBeNull();
  });
  it('two store instances atomically allocate one operation key and do not accept missing/corrupt payloads', async () => {
    const { path, store } = await setup(); const second = (await setup(path)).store;
    const record: SessionStoreRecord = { runId: 'A', id: 'operation:new', revision: 1, schema: 'ramify-agent.session-operation/1', body: {} };
    const transaction = { runId: 'A', expected: [{ id: record.id, revision: null }], records: [record], payloads: [] };
    expect((await Promise.all([store.commit(transaction), second.commit(transaction)])).map(item => item.kind).sort()).toEqual(['committed', 'conflict']);
    const missing = 'a'.repeat(64);
    await expect(store.commit({ runId: 'A', expected: [{ id: 's', revision: null }], records: [{ ...record, id: 's' }], payloads: [missing] })).rejects.toThrow(/Missing committed payload/);
    await expect(store.getPayload('../escape')).rejects.toThrow(/Invalid transcript/);
    const id = await store.putPayload(new TextEncoder().encode('correct'));
    await writeFile(join(path, 'payloads', id), 'incorrect'); await expect(store.getPayload(id)).rejects.toThrow(/Corrupt transcript/);
    expect(await store.putPayload(new TextEncoder().encode('correct'))).toBe(id);
    expect(new TextDecoder().decode((await store.getPayload(id))!)).toBe('correct');
  });
});
