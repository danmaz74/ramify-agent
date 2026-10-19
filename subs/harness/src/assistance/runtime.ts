import { join } from 'node:path';
import { createPiAgent } from '../../subs/agent/subs/pi/src/pi-agent.js';
import type { SessionOperations } from '../../subs/agent/src/interfaces/session-operations.js';
import { openSessionStore, type LedgerSessionStore } from '../../subs/session-store/src/session-store.js';
import { createAssessor } from './assessment.js';
import type { Assessor } from './contracts.js';
import { AssistanceService } from './service.js';
import { serveAssistanceStdio } from './mcp.js';

/** The executable composes the existing Pi store lazily, after obtaining project ownership. */
export function createAssistanceRuntime(options: { projectRoot: string; model?: string }): {
  readonly assessor: Assessor;
  close(): Promise<void>;
} {
  let store: LedgerSessionStore | undefined;
  let operations: Promise<SessionOperations> | undefined;
  return {
    assessor: createAssessor({ operations: () => operations ??= (async () => {
      store = await openSessionStore({ directory: join(options.projectRoot, 'plans', '.harness', 'session-operations', 'store') });
      return createPiAgent({ model: options.model }).bindSessionStore!(store);
    })() }),
    async close() { await operations?.catch(() => undefined); await store?.close(); },
  };
}

export interface AssistanceServerOptions {
  readonly projectRoot: string;
  readonly model?: string;
}
export interface AssistanceServer { close(): Promise<void> }

/** The root owns only process lifetime; execution and transport composition stay with the harness. */
export async function startAssistanceServer(options: AssistanceServerOptions): Promise<AssistanceServer> {
  const runtime = createAssistanceRuntime(options);
  const service = await AssistanceService.open({ projectRoot: options.projectRoot, assessor: runtime.assessor });
  const transport = serveAssistanceStdio(service);
  let closing: Promise<void> | undefined;
  return { close: () => closing ??= (async () => { await service.close(); await runtime.close(); await transport.close(); })() };
}
