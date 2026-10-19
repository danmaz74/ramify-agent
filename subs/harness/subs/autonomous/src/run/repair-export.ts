import { createHash } from 'node:crypto';
import { realpathSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { z } from 'zod';
import { childEnvironment, runCommand, type CommandRun, type CommandRunner } from '../../../evidence/src/run-command.js';
import { repairIncidentRecordSchema, type RepairIncidentRecord } from '../../../../src/interfaces/protocol/repairs.js';

/** The service captures an explicit external tracker; the target cwd never chooses one. */
export interface RepairExportConfiguration { readonly executable: string; readonly workspace: string }

export const repairExportPayloadSchema = z.object({
  schema: z.literal('ramify-agent.repair-incident-export/1'),
  projectKey: z.string().regex(/^[a-f0-9]{64}$/u),
  runId: z.string().min(1),
  incident: repairIncidentRecordSchema,
}).strict();
export type RepairExportPayload = z.infer<typeof repairExportPayloadSchema>;
export type RepairExportState = RepairIncidentRecord['export'];

/** Immutable payload revision, committed with its incident. */
export function repairExportPayloadPath(incidentId: string, revision: number): string {
  return join('repairs', 'exports', incidentId, `${revision}.json`);
}

export function repairExternalRef(projectKey: string, runId: string, incidentId: string): string {
  return `ramify-agent:repair:${projectKey}:${runId}:${incidentId}`;
}

export function repairProjectKey(projectRoot: string): string {
  // Export identity follows the existing target, independently of the
  // logical path the service uses for source and ownership operations.
  return createHash('sha256').update(realpathSync(projectRoot)).digest('hex');
}

/** Retained alongside the incident before any external process is started. */
export function createRepairExportPayload(projectRoot: string, runId: string, incident: RepairIncidentRecord): RepairExportPayload {
  return repairExportPayloadSchema.parse({ schema: 'ramify-agent.repair-incident-export/1',
    projectKey: repairProjectKey(projectRoot), runId, incident });
}

const commandTimeoutMs = 15_000;
const commandMaxBytes = 1024 * 1024;
const exportsInFlight = new Map<string, Promise<RepairExportState>>();

/** In-process serialization supplements the project lock; Beads does not enforce ref uniqueness. */
export async function exportRepairIncident(payload: RepairExportPayload, configuration?: RepairExportConfiguration,
  runner: CommandRunner = runCommand, now: () => Date = () => new Date()): Promise<RepairExportState> {
  const key = `${configuration?.workspace ?? ''}\0${repairExternalRef(payload.projectKey, payload.runId, payload.incident.incidentId)}`;
  const previous = exportsInFlight.get(key);
  const current = (previous ?? Promise.resolve()).then(() => exportOne(payload, configuration, runner, now));
  exportsInFlight.set(key, current);
  try { return await current; }
  finally { if (exportsInFlight.get(key) === current) exportsInFlight.delete(key); }
}

async function exportOne(payload: RepairExportPayload, configuration: RepairExportConfiguration | undefined,
  runner: CommandRunner, now: () => Date): Promise<RepairExportState> {
  const externalRef = repairExternalRef(payload.projectKey, payload.runId, payload.incident.incidentId);
  const attemptedAt = now().toISOString();
  const state = (kind: RepairExportState['state'], reason: string | null, issueId: string | null = payload.incident.export.issueId): RepairExportState =>
    ({ externalRef, state: kind, issueId, reason, attemptedAt });
  if (configuration === undefined) return state('pending', 'Beads export is not configured');
  if (!isAbsolute(configuration.executable) || !isAbsolute(configuration.workspace)) {
    return state('pending', 'Beads executable and workspace must be absolute paths');
  }
  if (!await stat(configuration.workspace).then(entry => entry.isDirectory(), () => false)) {
    return state('pending', 'The configured Beads workspace is not an existing directory');
  }
  if (!await stat(join(configuration.workspace, '.beads')).then(entry => entry.isDirectory(), () => false)) {
    return state('pending', 'The configured workspace has no existing .beads directory; the harness does not initialize a tracker');
  }
  try {
    const checked = repairExportPayloadSchema.parse(payload);
    if (checked.incident.export.externalRef !== externalRef) return state('pending', 'Incident export identity does not match its payload');
    const stdin = `${JSON.stringify(checked, null, 2)}\n`;
    if (Buffer.byteLength(stdin) > commandMaxBytes) return state('pending', 'Incident export payload exceeds the 1 MiB bound');
    const command = (args: string[], body?: string): Promise<CommandRun> => runner({
      argv: [configuration.executable, '-C', configuration.workspace, '--sandbox', ...args, '--json'],
      cwd: configuration.workspace, env: childEnvironment(), timeoutMs: commandTimeoutMs, maxBytes: commandMaxBytes,
      ...(body === undefined ? {} : { stdin: body }),
    });
    const query = async (): Promise<{ ids: string[] } | { error: string }> => {
      try {
        const answer = await command(['list', '--all', '--external-ref', externalRef, '--limit', '0']);
        const failure = commandFailure(answer);
        if (failure !== null) return { error: `Beads identity query failed: ${failure}` };
        const values: unknown = JSON.parse(answer.stdout);
        if (!Array.isArray(values)) return { error: 'Beads identity query did not return a JSON array' };
        const ids: string[] = [];
        for (const value of values) {
          const parsed = issueSchema.safeParse(value);
          if (!parsed.success) return { error: 'Beads identity query returned an invalid issue' };
          if (parsed.data.external_ref === externalRef) ids.push(parsed.data.id);
        }
        return { ids: [...new Set(ids)] };
      } catch (error) { return { error: `Beads identity query failed: ${error instanceof Error ? error.message : String(error)}` }; }
    };
    const found = await query();
    if ('error' in found) return state('pending', found.error);
    if (found.ids.length > 1) return state('conflict', 'Multiple Beads issues have this exact external reference');
    if (found.ids.length === 1) {
      const issueId = found.ids[0]!;
      if (payload.incident.export.issueId !== null && payload.incident.export.issueId !== issueId) {
        return state('conflict', 'The Beads issue differs from the durably recorded issue ID');
      }
      if (payload.incident.export.issueId === issueId) {
        const updated = await command(['update', issueId, '--body-file', '-'], stdin);
        const failure = commandFailure(updated);
        if (failure !== null) return state('pending', `Beads incident update failed: ${failure}`, issueId);
      }
      return state('exported', null, issueId);
    }
    if (payload.incident.export.issueId !== null) return state('pending', 'The durably recorded Beads issue was not found; no replacement was created');
    let created: CommandRun | undefined;
    let failure: string | null;
    try {
      created = await command(['create', '--title', `Investigate automatic repair ${checked.runId}/${checked.incident.incidentId}`,
        '--type', 'task', '--labels', 'repair-incident', '--external-ref', externalRef, '--body-file', '-'], stdin);
      failure = commandFailure(created);
    } catch (error) { failure = error instanceof Error ? error.message : String(error); }
    if (created !== undefined && failure === null) {
      let value: unknown;
      try { value = JSON.parse(created.stdout); } catch { value = null; }
      const parsed = issueSchema.safeParse(value);
      if (parsed.success && parsed.data.external_ref === externalRef) return state('exported', null, parsed.data.id);
    }
    // A failed or malformed create can have committed its effect. Reconcile now;
    // a future attempt queries again before it is allowed to create anything.
    const reconciled = await query();
    if ('error' in reconciled) return state('pending', `Beads create outcome is uncertain; ${reconciled.error}`);
    if (reconciled.ids.length > 1) return state('conflict', 'Multiple Beads issues have this exact external reference after create');
    if (reconciled.ids.length === 1) return state('exported', null, reconciled.ids[0]!);
    return state('pending', `Beads create was not confirmed: ${failure ?? 'invalid create response'}`);
  } catch (error) {
    return state('pending', `Beads export failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const issueSchema = z.object({ id: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_.:-]*$/u), external_ref: z.string().nullable().optional() });

function commandFailure(result: CommandRun): string | null {
  if (result.output.truncated) return 'command output exceeded its bound';
  switch (result.outcome.kind) {
    case 'completed': return result.outcome.exitCode === 0 ? null : `exit ${result.outcome.exitCode}`;
    case 'runner-error': return `${result.outcome.error.kind}: ${result.outcome.error.message}`;
    case 'timed-out': return `timed out after ${result.outcome.timeoutMs} ms`;
    case 'cancelled': return 'cancelled';
  }
}
