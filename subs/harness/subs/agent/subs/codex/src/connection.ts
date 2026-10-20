import { spawn, type ChildProcess } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { Readable, Writable } from 'node:stream';
import { StringDecoder } from 'node:string_decoder';
import { z } from 'zod';
import { ownedTreeKernelPath } from '../../../../../src/owned-tree-kernel.js';
import type { CodexProcessIdentity, CodexProviderOptions, CodexSettlement } from './interfaces/provider.js';

/** Private seam for deterministic protocol scripts; no wire objects cross the module. */
export interface CodexConnection {
  start(handlers: { line(line: string): void; error(message: string): void; exit(code: number | null, signal: string | null): void }): Promise<CodexProcessIdentity>;
  write(line: string): Promise<void>;
  stop(): Promise<CodexSettlement>;
}

/** Bound individual protocol frames while continuously draining both provider streams. */
function lines(stream: Readable, onLine: (line: string) => void, onError: (message: string) => void): void {
  const decoder = new StringDecoder('utf8');
  let buffer = '';
  let invalid = false;
  stream.on('data', (chunk: Buffer) => {
    if (invalid) return;
    buffer += decoder.write(chunk);
    let end: number;
    while ((end = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, end);
      buffer = buffer.slice(end + 1);
      if (Buffer.byteLength(line) > 16 * 1024 * 1024) { invalid = true; onError('Codex protocol frame exceeds 16 MiB'); return; }
      if (line.trim()) onLine(line);
    }
    if (Buffer.byteLength(buffer) > 16 * 1024 * 1024) { invalid = true; buffer = ''; onError('Codex protocol frame exceeds 16 MiB'); }
  });
  stream.on('end', () => { if (!invalid && (buffer + decoder.end()).trim()) onError('Codex stream ended with a partial protocol frame'); });
  stream.on('error', error => onError(error.message));
}

export function nativeCodexConnection(options: CodexProviderOptions): CodexConnection {
  let child: ChildProcess | undefined;
  let control: Writable | undefined;
  let confirmed = false;
  let exited = false;
  let stopping: Promise<CodexSettlement> | undefined;
  let error: string | null = null;
  const waiters = new Set<() => void>();
  const notify = () => { for (const waiter of waiters) waiter(); };
  const timeoutMs = options.settlementTimeoutMs ?? 5_000;
  return {
    async start(handlers) {
      if (process.platform !== 'linux') throw new Error('Dedicated Codex supervision requires Linux /proc and Python 3');
      return await new Promise<CodexProcessIdentity>((resolve, reject) => {
        let ready = false;
        const timer = setTimeout(() => reject(new Error('Codex supervisor readiness timed out')), options.requestTimeoutMs ?? 30_000);
        child = spawn('python3', [fileURLToPath(new URL('./supervisor.py', import.meta.url)), ownedTreeKernelPath(), options.executable ?? 'codex',
          'app-server', '--listen', 'stdio://', ...(options.configOverrides ?? []).flatMap(value => ['-c', value])], {
          cwd: options.cwd, env: { ...(options.env ?? process.env), RAMIFY_CODEX_SETTLE_SECONDS: String(timeoutMs / 1000) },
          detached: true, stdio: ['pipe', 'pipe', 'pipe', 'pipe', 'pipe'],
        });
        control = child.stdio[3] as Writable;
        let stderr = '';
        child.stderr!.on('data', (chunk: Buffer) => { stderr = (stderr + chunk.toString('utf8')).slice(-8192); });
        child.stderr!.on('error', failure => handlers.error(failure.message));
        child.stdin!.on('error', failure => handlers.error(`Codex input failed: ${failure.message}`));
        control.on('error', failure => { error = `Codex supervisor control failed: ${failure.message}`; handlers.error(error); notify(); });
        const failed = (message: string) => {
          error = message;
          clearTimeout(timer);
          if (!ready) reject(new Error(message));
          handlers.error(message);
          notify();
        };
        lines(child.stdout!, handlers.line, failed);
        lines(child.stdio[4] as Readable, line => {
          try {
            const status = JSON.parse(line) as { kind: string; confirmed?: boolean; reason?: string; message?: string; code?: number | null; signal?: string | null };
            if (status.kind === 'ready') {
              const owned = z.object({ pid: z.number().int().positive(), identity: z.string().min(1), supervisorPid: z.number().int().positive(), supervisorIdentity: z.string().min(1) }).parse(status);
              ready = true; clearTimeout(timer); resolve({ providerPid: owned.pid, providerIdentity: owned.identity, supervisorPid: owned.supervisorPid, supervisorIdentity: owned.supervisorIdentity });
            }
            else if (status.kind === 'provider-exit') handlers.exit(status.code ?? null, status.signal ?? null);
            else if (status.kind === 'error') failed(status.message ?? 'Codex supervisor failed');
            else if (status.kind === 'settled') { confirmed = status.confirmed === true; error = status.reason ?? null; notify(); }
            else failed('Invalid Codex supervisor status');
          } catch (failure) { failed(`Invalid Codex supervisor frame: ${String(failure)}`); }
        }, failed);
        child.on('error', failure => failed(`Cannot launch Codex supervisor: ${failure.message}`));
        child.on('close', (code, signal) => {
          exited = true;
          clearTimeout(timer);
          if (!ready) reject(new Error(`Codex supervisor exited before readiness (${code ?? signal}): ${stderr}`));
          if (!confirmed) handlers.error(`Codex supervisor exited without descendant settlement (${code ?? signal}): ${stderr}`);
          notify();
        });
      });
    },
    async write(line) {
      if (child?.stdin === null || child?.stdin === undefined || exited) throw new Error('Codex input is unavailable');
      await new Promise<void>((resolve, reject) => child!.stdin!.write(line + '\n', error => error ? reject(error) : resolve()));
    },
    stop() {
      if (stopping !== undefined) return stopping;
      if (child === undefined || child.pid === undefined) return Promise.resolve({ confirmed: true, descendants: 'settled', supervisorExited: true, reason: null });
      stopping = new Promise<CodexSettlement>(resolve => {
        let timer: NodeJS.Timeout;
        const finish = () => {
          clearTimeout(timer);
          waiters.delete(observe);
          resolve({ confirmed: confirmed && exited, descendants: confirmed ? 'settled' : 'unknown', supervisorExited: exited,
            reason: confirmed && exited ? null : error ?? 'Owned process settlement observation timed out' });
        };
        const observe = () => { if (exited || error !== null) finish(); };
        timer = setTimeout(finish, timeoutMs + 250);
        waiters.add(observe);
        if (exited) finish();
        else control?.write('{"kind":"stop"}\n', failure => { if (failure) { error = failure.message; observe(); } });
      }).finally(() => { stopping = undefined; });
      return stopping;
    },
  };
}
