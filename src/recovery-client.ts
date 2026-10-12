import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { z } from 'zod';
import { commandResponseSchema } from '../subs/harness/src/interfaces/protocol/jobs.js';
import { errorResponseSchema } from '../subs/harness/src/interfaces/protocol/errors.js';
import { protocolPaths } from '../subs/harness/src/interfaces/protocol/paths.js';
import { externalRepairDeclarationSchema, recoveryInspectionSchema, recoveryResumeCommandSchema } from '../subs/harness/src/interfaces/protocol/runs.js';
import { UsageError, type RecoveryOptions } from './cli.js';
import type { ControlResult } from './debug-client.js';

export interface RecoveryClientPorts {
  readonly fetch?: typeof fetch;
  readonly readText?: (path: string) => Promise<string>;
}
class RecoveryFailure extends Error {
  constructor(readonly code: string, message: string, readonly uncertain = false) { super(message); }
}

/** A recovery control client owns no execution or cancellation; command identity survives lost replies. */
export async function runRecoveryCommand(options: RecoveryOptions, ports: RecoveryClientPorts = {}): Promise<ControlResult> {
  const identity = { planId: options.planId, runId: options.runId,
    ...(options.occurrenceId ? { occurrenceId: options.occurrenceId } : {}),
    ...(options.expectedRevision ? { revision: options.expectedRevision } : {}),
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
        summary: inspection === null ? 'No recovery occurrence is waiting.' : inspection.canResume ? 'The retained operation can receive another bounded attempt group.' : 'Resume requires the reported prerequisites.' } };
    }
    let repair: unknown;
    if (options.repairFile !== undefined) {
      const text = await (ports.readText ?? (path => readFile(resolve(path), 'utf8')))(options.repairFile);
      let value: unknown;
      try { value = JSON.parse(text); } catch { throw new UsageError('--repair-file must contain a JSON repair declaration'); }
      const parsed = externalRepairDeclarationSchema.safeParse(value);
      if (!parsed.success) throw new UsageError('--repair-file needs valid areas, explanation and optional evidence');
      repair = parsed.data;
    }
    const command = recoveryResumeCommandSchema.parse({ commandId: options.commandId, expectedVersion: 0, type: 'resume-recovery',
      payload: { planId: options.planId, jobId: options.runId, occurrenceId: options.occurrenceId, expectedRevision: options.expectedRevision,
        ...(repair === undefined ? {} : { repair }) } });
    const { receipt } = await request(protocolPaths.commands, commandResponseSchema, command);
    return { exitStatus: 0, output: { kind: 'recovery-resumed', ...identity, receipt,
      summary: 'One bounded attempt group was admitted. An identical command returns this receipt; inspection reports the current occurrence.' } };
  } catch (error) {
    return { exitStatus: 2, output: { kind: 'error', ...identity, uncertain: error instanceof RecoveryFailure && error.uncertain,
      error: { code: error instanceof RecoveryFailure ? error.code : 'invalid-request', message: error instanceof Error ? error.message : String(error) },
      summary: 'No cancellation was requested. If the reply was lost, retry the identical command ID and payload.' } };
  }
}
