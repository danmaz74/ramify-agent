import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { expect, it } from 'vitest';
import { openSessionStore } from '../session-store.js';

it('shared local adapters exclude another process until the last writer closes and then reopen retained records', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'session-writer-'));
  const stores: Awaited<ReturnType<typeof openSessionStore>>[] = [];
  const child = async () => {
    const code = `
      const { openSessionStore } = await import(process.argv[2]);
      try {
        const store = await openSessionStore({ directory: process.argv[1] });
        try { console.log(JSON.stringify({ record: await store.read('run', 'session:s') })); }
        finally { await store.close(); }
      } catch (error) {
        if (error.name !== 'ProjectLockError') throw error;
        console.log(JSON.stringify({ refused: error.name }));
      }
    `;
    const result = await promisify(execFile)(process.execPath, ['--import', 'tsx', '--input-type=module', '--eval', code, directory, new URL('../session-store.ts', import.meta.url).href]);
    return JSON.parse(result.stdout);
  };
  try {
    const first = await openSessionStore({ directory }); stores.push(first);
    const second = await openSessionStore({ directory }); stores.push(second);
    const record = { runId: 'run', id: 'session:s', revision: 1, schema: 'ramify-agent.session/1' as const, body: { retained: true } };
    expect(await first.commit({ runId: 'run', expected: [{ id: record.id, revision: null }], records: [record], payloads: [] })).toEqual({ kind: 'committed' });
    const before = await readFile(join(directory, 'session-ledger.jsonl'));
    expect(await child()).toEqual({ refused: 'ProjectLockError' });
    await first.close();
    expect(await second.read('run', record.id)).toEqual(record);
    expect(await child()).toEqual({ refused: 'ProjectLockError' });
    expect(await readFile(join(directory, 'session-ledger.jsonl'))).toEqual(before);
    await second.close();
    expect(await child()).toEqual({ record });
    expect(await readFile(join(directory, 'session-ledger.jsonl'))).toEqual(before);
  } finally {
    for (const store of stores) await store.close();
    await rm(directory, { recursive: true, force: true });
  }
});
