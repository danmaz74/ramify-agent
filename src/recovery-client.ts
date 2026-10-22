import type { z } from 'zod';
import { commandResponseSchema } from '../subs/harness/src/interfaces/protocol/jobs.js';
import { errorResponseSchema } from '../subs/harness/src/interfaces/protocol/errors.js';
import { protocolPaths } from '../subs/harness/src/interfaces/protocol/paths.js';
import { recoveryInspectionSchema, recoveryResumeCommandSchema } from '../subs/harness/src/interfaces/protocol/runs.js';
import { UsageError, type RecoveryOptions } from './cli.js';
import type { ControlResult } from './debug-client.js';

export interface RecoveryClientPorts {
  readonly fetch?: typeof fetch;
}
class RecoveryFailure extends Error {
  constructor(readonly code: string, message: string, readonly uncertain = false) { super(message); }
}

/** A recovery control client owns no execution or cancellation; command identity survives lost replies. */
export async function runRecoveryCommand(options: RecoveryOptions, ports: RecoveryClientPorts = {}): Promise<ControlResult> {
  const identity = { planId: options.planId, runId: options.runId,
    ...(options.commandId ? { commandId: options.commandId } : {}) };
  try {
    const url = new URL(options.server);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new UsageError('--server must be an HTTP(S) origin');
    const request = async <T>(path: string, schema: z.ZodType<T>, body?: unknown): Promise<T> => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), options.timeoutMs);
      try {
        const response = await (ports.fetch ?? fetch)(`${url.origin}${path}`, { signal: controller.signal,
          ...(body === undefined ? {} : { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }) });
        const data: unknown = await response.json();
        if (!response.ok) {
          const parsed = errorResponseSchema.safeParse(data);
          throw new RecoveryFailure(parsed.success ? parsed.data.error.code : 'protocol', parsed.success ? parsed.data.error.message : `HTTP ${response.status}`);
        }
        const parsed = schema.safeParse(data);
        if (!parsed.success) throw new RecoveryFailure('invalid-response', 'The harness response did not match the recovery protocol.', body !== undefined);
        return parsed.data;
      } catch (error) {
        if (error instanceof RecoveryFailure) throw error;
        throw new RecoveryFailure(controller.signal.aborted ? 'timeout' : 'transport', error instanceof Error ? error.message : String(error), body !== undefined);
      } finally { clearTimeout(timer); }
    };
    if (options.action === 'inspect') {
      const inspection = await request(protocolPaths.runRecovery(options.planId, options.runId), recoveryInspectionSchema.nullable());
      return { exitStatus: 0, output: { kind: 'recovery-inspection', ...identity, inspection,
        summary: inspection === null ? 'No interrupted task is waiting.' : inspection.canResume ? 'The unfinished task can continue.' : 'Continuation needs the reported prerequisites.' } };
    }
    const command = recoveryResumeCommandSchema.parse({ commandId: options.commandId, expectedVersion: 0, type: 'resume-recovery',
      payload: { planId: options.planId, jobId: options.runId } });
    const { receipt } = await request(protocolPaths.commands, commandResponseSchema, command);
    return { exitStatus: 0, output: { kind: 'recovery-resumed', ...identity, receipt,
      summary: 'Task continuation requested. An identical command returns this receipt; inspection reports any remaining prerequisite.' } };
  } catch (error) {
    return { exitStatus: 2, output: { kind: 'error', ...identity, uncertain: error instanceof RecoveryFailure && error.uncertain,
      error: { code: error instanceof RecoveryFailure ? error.code : 'invalid-request', message: error instanceof Error ? error.message : String(error) },
      summary: 'No cancellation was requested. If the reply was lost, retry the identical command ID and payload.' } };
  }
}
