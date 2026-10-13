import { afterEach, describe, expect, test, vi } from 'vitest';
import type { AgentEvent, AgentSession, SessionOutcome } from '../../subs/agent/src/interfaces/port.js';
import { InvocationBounds } from '../run/port-events.js';
import { WriterBlockedError, WriterOwnership } from '../run/writer.js';

const limits = { invocationIdleMs: 100, invocationAbsoluteMs: 150, writerSettleMs: 20 };
function operation(stopSettles = true) {
  let finish!: (outcome: SessionOutcome) => void;
  const outcome = new Promise<SessionOutcome>(resolve => { finish = resolve; });
  const stop = vi.fn(async () => { if (stopSettles) finish({ kind: 'stopped' }); });
  const session: AgentSession = { outcome, start: { mode: 'fresh' }, ref: 'point', stop, settled: async () => stopSettles ? 'settled' : 'timed-out' };
  return { session, finish, stop };
}

afterEach(() => vi.useRealTimers());

describe('progress-based invocation recovery', () => {
  test('streaming model progress survives the former lifetime allowance without completing a tool', async () => {
    vi.useFakeTimers();
    const bounds = new InvocationBounds(limits);
    const work = operation();
    const pending = bounds.outcome(work.session);
    for (let i = 0; i < 4; i++) {
      await vi.advanceTimersByTimeAsync(80);
      bounds.observe({ type: 'progress', source: 'model-stream' });
    }
    expect(work.stop).not.toHaveBeenCalled();
    expect(bounds.interruption).toBeUndefined();
    work.finish({ kind: 'submitted', input: { completed: true } });
    expect(await pending).toEqual({ kind: 'submitted', input: { completed: true } });
    expect(vi.getTimerCount()).toBe(0);
  });

  test.each([
    { type: 'context-observed', tokens: 205728, window: 272000 },
    { type: 'progress', source: 'model-stream', replayed: true },
    { type: 'retry', phase: 'started', attempt: 1, maxAttempts: 3, delayMs: 1000, error: 'retrying' },
  ] as AgentEvent[])('passive observations and replayed progress cannot keep a stalled operation alive (%j)', async event => {
    vi.useFakeTimers();
    const bounds = new InvocationBounds(limits);
    const work = operation();
    const pending = bounds.outcome(work.session);
    await vi.advanceTimersByTimeAsync(80);
    bounds.observe(event);
    await vi.advanceTimersByTimeAsync(20);
    expect(work.stop).toHaveBeenCalledOnce();
    expect(await pending).toMatchObject({ kind: 'resource-pending', resource: 'stall' });
  });

  test('settlement observation expiry retains pending work and never invents a stopped receipt', async () => {
    vi.useFakeTimers();
    const bounds = new InvocationBounds(limits);
    const work = operation(false);
    const pending = bounds.outcome(work.session);
    await vi.advanceTimersByTimeAsync(120);
    expect(work.stop).toHaveBeenCalledOnce();
    expect(await pending).toMatchObject({ kind: 'resource-pending', resource: 'stall' });
    expect(bounds.interruption).toBe('idle-timeout');
    expect(vi.getTimerCount()).toBe(0);
  });

  test('held commands remain eligible beyond the former lifetime allowance then recover on idle expiry', async () => {
    vi.useFakeTimers();
    const bounds = new InvocationBounds(limits, 10);
    const work = operation();
    const pending = bounds.outcome(work.session);
    const release = bounds.hold(400);
    await vi.advanceTimersByTimeAsync(300);
    expect(work.stop).not.toHaveBeenCalled();
    release();
    await vi.advanceTimersByTimeAsync(99);
    expect(work.stop).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(await pending).toMatchObject({ kind: 'resource-pending', resource: 'stall' });
  });

  test('overlapping operator and test-lock waits pause stall detection until their final release', async () => {
    vi.useFakeTimers();
    const bounds = new InvocationBounds(limits);
    const releaseLock = bounds.pauseAbsoluteForTestLock();
    const work = operation();
    const pending = bounds.outcome(work.session);
    const releaseOperator = bounds.pauseForWait();
    await vi.advanceTimersByTimeAsync(500);
    releaseLock();
    releaseLock();
    await vi.advanceTimersByTimeAsync(500);
    expect(work.stop).not.toHaveBeenCalled();
    releaseOperator();
    await vi.advanceTimersByTimeAsync(100);
    expect(await pending).toMatchObject({ kind: 'resource-pending', resource: 'stall' });
  });
});

describe('unknown writer effects', () => {
  test('a retained process and session block replacement until the same occurrence is established settled', async () => {
    vi.useFakeTimers();
    let idle = false;
    const groups = new Set([42]);
    const changes: string[] = [];
    const writer = new WriterOwnership({ settleMs: 20, pollMs: 5,
      groups: { alive: pid => groups.has(pid), kill: () => undefined }, tree: { changed: async () => [...changes] } });
    writer.acquire('inv-0001');
    writer.register('inv-0001', 42);
    const releasing = writer.release('inv-0001', { settled: async () => idle ? 'settled' : 'timed-out' });
    await vi.advanceTimersByTimeAsync(20);
    expect(await releasing).toMatchObject({ confirmed: false });
    expect(writer.unsettledInvocation).toBe('inv-0001');
    expect(() => writer.acquire('inv-0002')).toThrow(WriterBlockedError);
    expect(() => writer.requireSettled('gate')).toThrow(WriterBlockedError);
    await expect(writer.reinspect('inv-0002')).rejects.toThrow('cannot settle inv-0001');
    // A subsequent mutation remains candidate evidence; no replay is needed.
    changes.push('partial.ts');
    idle = true;
    groups.clear();
    expect(await writer.reinspect('inv-0001')).toMatchObject({ confirmed: true, groupsKilled: 1 });
    expect(writer.isUnsettled).toBe(false);
    expect(changes).toEqual(['partial.ts']);
    writer.acquire('inv-0002');
    expect(writer.held).toBe('inv-0002');
  });

  test('a session that never answers stays unknown after the observation deadline', async () => {
    vi.useFakeTimers();
    const writer = new WriterOwnership({ settleMs: 20 });
    writer.acquire('inv-0001');
    const releasing = writer.release('inv-0001', { settled: async () => new Promise(() => undefined) });
    await vi.advanceTimersByTimeAsync(20);
    expect(await releasing).toMatchObject({ confirmed: false });
    expect(() => writer.requireSettled('gate')).toThrow(WriterBlockedError);
    expect(await writer.reinspect('inv-0001', { settled: async () => 'settled' })).toMatchObject({ confirmed: true });
  });

  test('missing candidate effects cannot be mistaken for an empty clean candidate', async () => {
    let available = false;
    const writer = new WriterOwnership({ settleMs: 20, tree: { changed: async () => { if (!available) throw new Error('unavailable'); return ['partial.ts']; } } });
    writer.acquire('inv-0001');
    expect(await writer.release('inv-0001', { settled: async () => 'settled' })).toMatchObject({ confirmed: false });
    expect(writer.blocked).toContain('candidate effects are unavailable');
    available = true;
    expect(await writer.reinspect('inv-0001')).toMatchObject({ confirmed: true });
  });
});
