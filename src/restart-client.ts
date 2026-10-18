import type { z } from 'zod';
import { commandResponseSchema } from '../subs/harness/src/interfaces/protocol/jobs.js';
import { errorResponseSchema } from '../subs/harness/src/interfaces/protocol/errors.js';
import { protocolPaths } from '../subs/harness/src/interfaces/protocol/paths.js';
import { restartInspectionSchema, prepareRestartCommandSchema } from '../subs/harness/src/interfaces/protocol/runs.js';
import { UsageError, type RestartOptions } from './cli.js';
import type { ControlResult } from './debug-client.js';

export interface RestartClientPorts { readonly fetch?: typeof fetch }
class RestartFailure extends Error {
  constructor(readonly code: string, message: string, readonly uncertain = false) { super(message); }
}

/** Legacy restart command adapts to ordinary continuation with stable command identity. */
export async function runRestartCommand(options: RestartOptions, ports: RestartClientPorts = {}): Promise<ControlResult> {
  const identity = { planId: options.planId, sourceRunId: options.runId,
    ...(options.expectedVersion === undefined ? {} : { expectedVersion: options.expectedVersion }),
    ...(options.commandId === undefined ? {} : { commandId: options.commandId }) };
  let receipt: import('../subs/harness/src/interfaces/protocol/jobs.js').Receipt | undefined;
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
          throw new RestartFailure(parsed.success ? parsed.data.error.code : 'protocol', parsed.success ? parsed.data.error.message : `HTTP ${response.status}`);
        }
        const parsed = schema.safeParse(data);
        if (!parsed.success) throw new RestartFailure('invalid-response', 'The harness response did not match the restart protocol.', body !== undefined);
        return parsed.data;
      } catch (error) {
        if (error instanceof RestartFailure) throw error;
        throw new RestartFailure(controller.signal.aborted ? 'timeout' : 'transport', error instanceof Error ? error.message : String(error), body !== undefined);
      } finally { clearTimeout(timer); }
    };
    if (options.action === 'inspect') {
      const inspection = await request(protocolPaths.runRestart(options.planId, options.runId), restartInspectionSchema.nullable());
      return { exitStatus: 0, output: { kind: 'restart-inspection', ...identity, inspection,
        summary: inspection === null ? 'No retained source is available.' : inspection.canPrepare ? 'The unfinished run can continue.' : 'Continuation needs the reported prerequisites.' } };
    }
    const command = prepareRestartCommandSchema.parse({ commandId: options.commandId, expectedVersion: options.expectedVersion, type: 'prepare-restart',
      payload: { planId: options.planId, jobId: options.runId } });
    ({ receipt } = await request(protocolPaths.commands, commandResponseSchema, command));
    return { exitStatus: 0, output: { kind: 'run-continued', ...identity, runId: receipt.jobId, receipt,
      summary: 'Unfinished work will continue in this run. Its original history remains available.' } };
  } catch (error) {
    return { exitStatus: 2, output: { kind: 'error', ...identity, ...(receipt === undefined ? {} : { receipt, runId: receipt.jobId }), uncertain: error instanceof RestartFailure && error.uncertain,
      error: { code: error instanceof RestartFailure ? error.code : 'invalid-request', message: error instanceof Error ? error.message : String(error) },
      summary: 'If the preparation reply was lost, retry the identical command ID and payload to recover its receipt.' } };
  }
}
