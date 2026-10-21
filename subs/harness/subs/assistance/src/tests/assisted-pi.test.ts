import { assistedReviewSubmissionSchema } from '../../../reviews/src/assisted.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSessionOperations } from '../../../agent/src/session-operations.js';
import { createScriptedSessionDriver } from '../../../agent/src/scripted.js';
import type { SessionDriverRuntime, SessionStore, SessionStoreRecord } from '../../../agent/src/interfaces/session-operations.js';
import { runPiAssessment, runAssistedPiReview } from '../pi.js';

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

afterEach(() => { vi.useRealTimers(); });

function deferred() {
  let resolve!: () => void; const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
}

describe('assisted Pi assessment', () => {
  it('delivers distinct final integration and architecture instructions to the real Pi task boundary', async () => {
    const store = memoryStore();
    const report = { concerns: [], codeAssessment: 'Integration holds.', scopeAssessment: 'Complete plan assessed.',
      design: { needed: false, reason: 'Existing decomposition suffices.', assessment: 'Clean module boundaries.' }, requirements: [] };
    const operations = createSessionOperations({ sessionStore: store, driver: createScriptedSessionDriver([{ kind: 'submit', input: report }]) });
    const result = await runAssistedPiReview({ runId: base.runId, operationId: 'final-review', projectRoot: base.projectRoot,
      candidate: base.candidate, tree: base.tree, operations, kind: 'final', prepared: {
        message: 'Complete captured plan and accepted iteration summaries.', candidateDiff: 'Diffs on demand.',
        tools: { definitions: [], read: () => new Map(), inspected: () => new Set(), denials: () => [] },
        validate: value => { const checked = assistedReviewSubmissionSchema.safeParse(value); return checked.success
          ? { ok: true, value: checked.data } : { ok: false, errors: [{ path: 'report', message: 'Invalid report' }] }; },
      } });
    expect(result.status).toBe('submitted');
    const recorded = JSON.stringify((await store.read(base.runId, 'operation:final-review'))?.body);
    for (const phrase of ['final plan completeness', 'cross-iteration integration', 'architectural quality', 'smallest useful correction', 'accepted iteration evidence']) expect(recorded).toContain(phrase);
    expect(recorded).not.toContain('Review code and intended scope together.');
    expect(recorded).toContain('evidenceRefs');
  });

  it('declares no evidenceRefs field to an iteration review', async () => {
    const store = memoryStore();
    const report = { concerns: [], codeAssessment: 'Code holds.', scopeAssessment: 'Scope complete.',
      design: { needed: false, reason: 'No boundary change.', assessment: 'Boundaries preserved.' }, requirements: [] };
    const operations = createSessionOperations({ sessionStore: store, driver: createScriptedSessionDriver([{ kind: 'submit', input: report }]) });
    const result = await runAssistedPiReview({ runId: base.runId, operationId: 'iteration-review', projectRoot: base.projectRoot,
      candidate: base.candidate, tree: base.tree, operations, prepared: {
        message: 'Combined code and scope review.', candidateDiff: 'diff', tools: { definitions: [], read: () => new Map(), inspected: () => new Set(), denials: () => [] },
        validate: value => { const checked = assistedReviewSubmissionSchema.safeParse(value); return checked.success
          ? { ok: true, value: checked.data } : { ok: false, errors: [{ path: 'report', message: 'Invalid report' }] }; },
      } });
    expect(result.status).toBe('submitted');
    const recorded = JSON.stringify((await store.read(base.runId, 'operation:iteration-review'))?.body);
    expect(recorded).toContain('submit_assisted_review');
    expect(recorded).not.toContain('evidenceRefs');
  });

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

  it.each(['submit', 'fail'] as const)('keeps a review pending beyond prior elapsed limits until the provider can %s', async outcome => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const entered = deferred(); const release = deferred();
    let runtime!: SessionDriverRuntime;
    const store = memoryStore();
    const operations = createSessionOperations({ sessionStore: store, driver: { async dispatch(_input, current) {
      runtime = current; entered.resolve(); await release.promise;
      if (outcome === 'fail') return { kind: 'failed', error: 'Provider unavailable' };
      const verdict = await current.submit('report', { answer: 'supported' });
      expect(verdict.accepted).toBe(true);
      return { kind: 'submitted', input: { answer: 'supported' } };
    } } });
    let ended = false;
    const pending = runPiAssessment({ ...base, operations }).then(value => { ended = true; return value; });
    await entered.promise;
    // Cross both the former ten-minute review limit and its settlement grace.
    await vi.advanceTimersByTimeAsync(60 * 60_000);
    expect(ended).toBe(false);
    expect(runtime.signal.aborted).toBe(false);
    expect((await store.read(base.runId, 'operation:review-1'))?.body['phase']).not.toBe('terminal');
    release.resolve();
    const result = await pending;
    expect(result.status).toBe(outcome === 'submit' ? 'submitted' : 'incomplete');
    if (outcome === 'submit') expect(result).toMatchObject({ value: { answer: 'supported' } });
    else expect(result).toMatchObject({ reason: expect.stringContaining('Pi assessment failed:') });
  });

  it('explicit cancellation still stops a long review and waits for the provider to settle', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const entered = deferred(); const aborted = deferred(); const release = deferred();
    const controller = new AbortController(); let accepted = 0;
    const operations = createSessionOperations({ sessionStore: memoryStore(), driver: { async dispatch(_input, runtime) {
      runtime.signal.addEventListener('abort', aborted.resolve, { once: true }); entered.resolve();
      await aborted.promise; await release.promise;
      expect((await runtime.submit('late-report', { answer: 'supported' })).accepted).toBe(false);
      return { kind: 'ended' };
    } } });
    let ended = false;
    const pending = runPiAssessment({ ...base, operations, signal: controller.signal,
      onSubmitted: async () => { accepted++; } }).then(value => { ended = true; return value; });
    await entered.promise;
    await vi.advanceTimersByTimeAsync(60 * 60_000);
    expect(ended).toBe(false);
    controller.abort(); await aborted.promise;
    await vi.advanceTimersByTimeAsync(60_000);
    expect(ended).toBe(false);
    release.resolve();
    expect(await pending).toMatchObject({ status: 'incomplete', reason: expect.stringContaining('stopped') });
    expect(accepted).toBe(0);
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
