import { afterEach, expect, test, vi } from 'vitest';
import type { EventEmitter } from 'node:events';

interface ScriptedChild {
  stdout: EventEmitter;
  stderr: EventEmitter;
  kill: ReturnType<typeof vi.fn>;
  complete: (error?: Error) => void;
  options: Record<string, unknown>;
}
const script = vi.hoisted(() => ({ child: undefined as ScriptedChild | undefined }));
vi.mock('node:child_process', async () => {
  const { EventEmitter } = await import('node:events');
  return { execFile: vi.fn((_command: string, _args: string[], options: Record<string, unknown>, callback: (error: Error | null, stdout: string, stderr: string) => void) => {
    const stdout = new EventEmitter();
    const stderr = new EventEmitter();
    let output = '';
    stdout.on('data', (part: string) => { output += part; });
    const complete = (error?: Error) => callback(error ?? null, output, 'RAMIFY_GROUP:0\n');
    const kill = vi.fn(() => { queueMicrotask(() => complete(Object.assign(new Error('Stopped'), { killed: true, signal: 'SIGTERM' }))); return true; });
    script.child = { stdout, stderr, kill, complete, options };
    (options['signal'] as AbortSignal | undefined)?.addEventListener('abort', () => complete(Object.assign(new Error('Cancelled'), { name: 'AbortError' })), { once: true });
    queueMicrotask(() => stderr.emit('data', 'RAMIFY_GROUP:0\n'));
    return { stdout, stderr, kill, stdin: { end() {}, destroy() {} } };
  }) };
});

import { runCommand } from '../run-command.js';

afterEach(() => { vi.useRealTimers(); script.child = undefined; });

test('actual command output continues beyond the former absolute timeout', async () => {
  vi.useFakeTimers();
  const progress = vi.fn();
  const result = runCommand({ argv: ['scripted'], cwd: '.', env: {}, timeoutMs: 100, onProgress: progress });
  await vi.advanceTimersByTimeAsync(90);
  script.child!.stdout.emit('data', 'first result\n');
  await vi.advanceTimersByTimeAsync(90);
  script.child!.stdout.emit('data', 'second result\n');
  await vi.advanceTimersByTimeAsync(60);
  expect(script.child!.kill).not.toHaveBeenCalled();
  expect(script.child!.options['timeout']).toBeUndefined();
  script.child!.complete();
  expect((await result).outcome).toEqual({ kind: 'completed', exitCode: 0 });
  expect(progress).toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});

test('a quiet command is stopped as a stall observation without an exit verdict', async () => {
  vi.useFakeTimers();
  const result = runCommand({ argv: ['scripted'], cwd: '.', env: {}, timeoutMs: 100 });
  await vi.advanceTimersByTimeAsync(100);
  expect(script.child!.kill).toHaveBeenCalledOnce();
  expect((await result).outcome).toEqual({ kind: 'timed-out', timeoutMs: 100 });
});

test('explicit cancellation remains distinct from a quiet-progress deadline', async () => {
  vi.useFakeTimers();
  const controller = new AbortController();
  const result = runCommand({ argv: ['scripted'], cwd: '.', env: {}, timeoutMs: 100, signal: controller.signal });
  controller.abort();
  expect((await result).outcome).toEqual({ kind: 'cancelled' });
  expect(vi.getTimerCount()).toBe(0);
});
