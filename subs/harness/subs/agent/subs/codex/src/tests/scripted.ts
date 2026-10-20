import { expect } from 'vitest';
import { createCodexProviderOn } from '../provider.js';
import type { CodexConnection } from '../connection.js';
import type { CodexProvider, CodexSettlement } from '../interfaces/provider.js';

export type ScriptedCodexFrame = { id?: string | number; method?: string; params?: Record<string, unknown>; result?: unknown; error?: unknown };
export class ScriptedCodex {
  readonly written: ScriptedCodexFrame[] = [];
  private handlers: Parameters<CodexConnection['start']>[0] | undefined;
  readonly settlement: CodexSettlement = { confirmed: true, descendants: 'settled', supervisorExited: true, reason: null };
  private readonly connection: CodexConnection = {
    start: async handlers => { this.handlers = handlers; return { providerPid: 100, providerIdentity: 'boot:1', supervisorPid: 99, supervisorIdentity: 'boot:0' }; },
    write: async line => { const frame = JSON.parse(line) as ScriptedCodexFrame; this.written.push(frame); await this.onWrite(frame); },
    stop: async () => this.settlement,
  };
  readonly provider: CodexProvider;
  constructor(readonly onWrite: (frame: ScriptedCodexFrame) => void | Promise<void> = () => undefined, timeoutMs = 1000) {
    this.provider = createCodexProviderOn(this.connection, timeoutMs);
  }
  receive(frame: ScriptedCodexFrame): void { this.handlers!.line(JSON.stringify(frame)); }
  raw(line: string): void { this.handlers!.line(line); }
  exit(code: number): void { this.handlers!.exit(code, null); }
  async initialize(): Promise<void> {
    const ready = this.provider.initialize();
    await Promise.resolve();
    const frame = this.written[0]!;
    expect(frame.method).toBe('initialize');
    this.receive({ id: frame.id!, result: { userAgent: 'codex/0.161.0', codexHome: '/persistent/codex', platformOs: 'linux' } });
    await ready;
    expect(this.written[1]).toEqual({ method: 'initialized' });
  }
  replyLast(result: unknown): void { this.receive({ id: this.written.at(-1)!.id!, result }); }
}
export const testTurn = (status = 'inProgress', id = 'turn-1') => ({ id, status, error: null, items: [] });
export const testThread = (extra: Record<string, unknown> = {}) => ({ id: 'thread-1', parentThreadId: null, ephemeral: false, cwd: '/target', model: 'gpt-6-astra', cliVersion: '0.161.0', status: { type: 'idle' }, turns: [], ...extra });
export const testSession = (extra: Record<string, unknown> = {}) => ({ thread: testThread(extra), model: 'gpt-6-astra', instructionSources: ['/target/AGENTS.md'], approvalPolicy: 'never', sandbox: { type: 'dangerFullAccess' } });
