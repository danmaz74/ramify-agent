import { describe, expect, it, vi } from 'vitest';
import { decideTaskReentry, mayRetryTask, taskRetryDelay, waitForTaskRetry } from '../reentry.js';

describe('ordinary task re-entry', () => {
  it('executes authorized pending work without session or runtime identity', () => {
    expect(decideTaskReentry({ authorized: true, settled: true })).toEqual({ action: 'execute' });
  });
  it('delivers an accepted result through the task owner', () => {
    expect(decideTaskReentry({ authorized: true, settled: true, accepted: { value: false } })).toEqual({ action: 'deliver', value: false });
  });
  it('keeps an explicit stop and actual settlement ahead of replacement', () => {
    expect(decideTaskReentry({ authorized: true, stopped: true, settled: true }).action).toBe('wait');
    expect(decideTaskReentry({ authorized: true, settled: false, accepted: { value: 'done' } }).action).toBe('wait');
    expect(decideTaskReentry({ authorized: false, settled: true }).action).toBe('wait');
  });
  it('names the particular consequential operation that remains ambiguous', () => {
    expect(decideTaskReentry({ authorized: true, settled: true, unresolved: ['commit c1'] })).toEqual({ action: 'wait', reason: 'Consequential operation outcomes remain unresolved: commit c1' });
  });
});

 it('bounds replacement attempts without counting source edits or reads as progress', () => {
   expect(mayRetryTask({ attempt: 0, limit: 2, classification: 'resource' })).toBe(true);
   expect(mayRetryTask({ attempt: 2, limit: 2, classification: 'transport' })).toBe(false);
   expect(mayRetryTask({ attempt: 0, limit: 2, classification: 'credentials' })).toBe(false);
 });

it('honors a bounded provider delay and cancellation without delaying resource handoffs', async () => {
  expect(taskRetryDelay({ attempt: 0, classification: 'transport', retryAfterMs: 90_000 })).toBe(30_000);
  expect(taskRetryDelay({ attempt: 0, classification: 'resource', retryAfterMs: 90_000 })).toBe(0);
  vi.useFakeTimers();
  try {
    const controller = new AbortController();
    const waiting = waitForTaskRetry(5000, controller.signal);
    controller.abort();
    await expect(waiting).resolves.toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  } finally { vi.useRealTimers(); }
});
