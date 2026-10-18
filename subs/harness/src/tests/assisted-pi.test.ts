import { describe, expect, it } from 'vitest';
import { createSessionOperations } from '../../subs/agent/src/session-operations.js';
import { createScriptedSessionDriver } from '../../subs/agent/src/scripted.js';
import type { SessionStore, SessionStoreRecord } from '../../subs/agent/src/interfaces/session-operations.js';
import { runPiAssessment } from '../assistance/pi.js';

function memoryStore(): SessionStore {
  const records = new Map<string, SessionStoreRecord>(); const payloads = new Map<string, Uint8Array>();
  const key = (runId: string, id: string) => `${runId}:${id}`;
  return {
    async read(runId, id) { return structuredClone(records.get(key(runId, id)) ?? null); },
    async putPayload(bytes) { const id = Buffer.from(bytes).toString('base64'); payloads.set(id, bytes); return id; },
    async getPayload(id) { return payloads.get(id) ?? null; },
    async commit(input) {
      for (const expected of input.expected) if ((records.get(key(input.runId, expected.id))?.revision ?? null) !== expected.revision) return { kind: 'conflict', reason: 'CAS' };
      for (const record of input.records) records.set(key(input.runId, record.id), structuredClone(record));
      return { kind: 'committed' };
    },
  };
}

const base = { runId: 'assisted-job-1', operationId: 'review-1', projectRoot: '/project', candidate: 'candidate-commit', tree: 'candidate-tree',
  message: 'Assess the pinned candidate.', systemPrompt: 'Review source read only.',
  tools: [{ name: 'snapshot_read', description: 'Read source', inputSchema: { type: 'object' }, mutating: false,
    execute: async () => ({ text: 'candidate source' }) }],
  submission: { name: 'submit_assessment', description: 'Submit assessment', inputSchema: { type: 'object' },
    validate: (value: unknown) => value && typeof value === 'object' && 'answer' in value && value.answer === 'supported'
      ? { ok: true as const, value: { answer: 'supported' } } : { ok: false as const, errors: [{ path: 'answer', message: 'Need supported answer' }] } },
};

describe('assisted Pi assessment', () => {
  it('runs read-only snapshot tools, returns only a validated submission and retains operation evidence', async () => {
    const store = memoryStore();
    const operations = createSessionOperations({ sessionStore: store, driver: createScriptedSessionDriver([
      { kind: 'tool', tool: 'snapshot_read', input: { path: 'src/a.ts' } },
      { kind: 'submit', input: { answer: 'invented' } },
      { kind: 'submit', input: { answer: 'supported' } },
    ]) });
    const events: string[] = [];
    const persisted: unknown[] = [];
    const result = await runPiAssessment({ ...base, operations, onEvent: event => events.push(event.type),
      onSubmitted: async value => { persisted.push(value); } });
    expect(result).toMatchObject({ status: 'submitted', value: { answer: 'supported' }, operationId: 'review-1' });
    expect(persisted).toEqual([{ answer: 'supported' }]);
    expect(events).toContain('tool-finished');
    expect((await store.read(base.runId, 'operation:review-1'))?.body).toMatchObject({ receipt: { status: 'completed' } });
    const recorded = (await store.read(base.runId, 'operation:review-1'))?.body;
    expect(JSON.stringify(recorded)).toContain('candidate-commit');
    expect(JSON.stringify(recorded)).toContain('snapshot_read');
    expect(JSON.stringify(recorded)).not.toContain('"write"');
    if (result.status === 'submitted') expect([...(await operations.inspect(base.runId, result.sessionId))!.activeTools].sort()).toEqual(['snapshot_read', 'submit_assessment']);
  });

  it('reports an incomplete assessment when Pi ends without an accepted report', async () => {
    const operations = createSessionOperations({ sessionStore: memoryStore(), driver: createScriptedSessionDriver([
      { kind: 'submit', input: { answer: 'invented' } }, { kind: 'end' },
    ]) });
    const result = await runPiAssessment({ ...base, operationId: 'review-2', operations });
    expect(result).toMatchObject({ status: 'incomplete', operationId: 'review-2' });
  });

  it('refuses a mutating assessment tool before starting a session', async () => {
    const operations = createSessionOperations({ sessionStore: memoryStore(), driver: createScriptedSessionDriver([]) });
    await expect(runPiAssessment({ ...base, operations, tools: [{ ...base.tools[0]!, mutating: true }] })).rejects.toThrow('read only');
  });

  it('does not dispatch Pi when cancellation lands just after session creation', async () => {
    const controller = new AbortController(); let dispatches = 0;
    const real = createSessionOperations({ sessionStore: memoryStore(), driver: { async dispatch() { dispatches++; return { kind: 'ended' }; } } });
    const operations = new Proxy(real, { get(target, property, receiver) {
      if (property === 'create') return async (input: Parameters<typeof real.create>[0]) => { const created = await real.create(input); controller.abort(); return created; };
      const value = Reflect.get(target, property, receiver);
      return typeof value === 'function' ? value.bind(target) : value;
    } });
    expect(await runPiAssessment({ ...base, operations, signal: controller.signal })).toMatchObject({ status: 'incomplete', reason: 'Assessment was cancelled before Pi started' });
    expect(dispatches).toBe(0);
  });
});
