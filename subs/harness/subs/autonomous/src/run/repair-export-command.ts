import { readFile, realpath } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { CommandRunner } from '../../../evidence/src/run-command.js';
import { commitRecord, recoverCommits } from '../../../../src/jobs/commit.js';
import { validateCommittedHistory } from './committed-history.js';
import { authenticateRepairHistory } from '../../subs/work-coordination/src/repair/repair-history.js';
import { manualRunLocationOf } from '../../../task-workflow/src/steps/manual.js';
import { acquireProjectLock } from '../../../../src/store/lock.js';
import { RunLog } from './log.js';
import { runLayout, runRecordSchema } from './records.js';
import { repairIncidentRecordSchema } from '../../../../src/interfaces/protocol/repairs.js';
import { createRepairExportPayload, exportRepairIncident, repairExportPayloadSchema, repairExportPayloadPath, repairProjectKey, type RepairExportConfiguration } from './repair-export.js';

export interface RepairExportCommandOptions {
  readonly run: string;
  readonly executable: string;
  readonly workspace: string;
  readonly incident?: string | undefined;
  readonly json?: boolean | undefined;
}
export interface RepairExportCommandResult { readonly stdout: string; readonly stderr: string; readonly exitStatus: number }

/** Reuses the service exporter under the original project's exclusive harness lock. */
export function runRepairExportCommand(options: RepairExportCommandOptions): Promise<RepairExportCommandResult> {
  return runRepairExportCommandWith(options);
}

/** Scripted command boundary for the harness owner's tests. */
export async function runRepairExportCommandWith(options: RepairExportCommandOptions,
  ports: { readonly commandExecution?: CommandRunner; readonly now?: () => Date } = {}): Promise<RepairExportCommandResult> {
  const refused = (reason: string): RepairExportCommandResult => ({ stdout: '', stderr: `Cannot export repair incidents: ${reason}\n`, exitStatus: 2 });
  try {
    const location = manualRunLocationOf(options.run);
    if (typeof location === 'string') return refused(location);
    const projectRoot = await realpath(location.projectRoot);
    const directory = await realpath(resolve(options.run));
    const record = runRecordSchema.parse(JSON.parse(await readFile(join(directory, runLayout.record), 'utf8')));
    if (record.jobId !== location.runId || record.planId !== location.planId) {
      return refused('The run record does not identify this original project, plan and run directory');
    }
    const lock = await acquireProjectLock(projectRoot);
    try {
      const log = await RunLog.open(join(directory, runLayout.events), record.jobId);
      // Authenticate revision order, lifecycle and immutable evidence before
      // materialization or external effects against a retained run.
      const entries = log.ledger.replay();
      validateCommittedHistory(record, entries);
      const latest = authenticateRepairHistory(entries);
      await recoverCommits(log.ledger);
      const incidents = latest.map(incident => incident.record).filter(incident => options.incident === undefined || incident.incidentId === options.incident);
      if (options.incident !== undefined && incidents.length === 0) return refused(`Incident ${options.incident} is not recorded in the run`);
      const configuration: RepairExportConfiguration = { executable: options.executable, workspace: options.workspace };
      const retained = incidents.map(incident => {
        // Recoverable materializations are rebuilt above; external effects use
        // the self-contained payload authenticated by the committed record body.
        const payloadPath = repairExportPayloadPath(incident.incidentId, incident.revision);
        const bodies = log.ledger.replay().flatMap(entry => entry.transaction.records).filter(body => body.path === payloadPath);
        const held = bodies[0];
        if (bodies.length !== 1 || held === undefined || held.id !== incident.incidentId || held.revision !== incident.revision) {
          throw new Error(`Incident ${incident.incidentId} has no uniquely identified retained export payload`);
        }
        const payload = repairExportPayloadSchema.parse(held.body);
        if (payload.projectKey !== repairProjectKey(projectRoot) || payload.runId !== record.jobId || JSON.stringify(payload.incident) !== JSON.stringify(incident)) throw new Error('Retained export payload differs from its original project, run or incident');
        return { incident, payload };
      });
      const results = [];
      for (const { incident, payload } of retained) {
        const result = await exportRepairIncident(payload, configuration, ports.commandExecution, ports.now);
        const revised = repairIncidentRecordSchema.parse({ ...incident, revision: incident.revision + 1, export: result });
        const revisedPayload = createRepairExportPayload(projectRoot, record.jobId, revised);
        await commitRecord(log.ledger, { event: log.next({ type: 'repair-export-recorded', data: {
          incidentId: revised.incidentId, revision: revised.revision, state: result.state,
        } }, ports.now?.() ?? new Date()), records: [
          { path: runLayout.repairIncident(revised.incidentId, revised.revision), id: revised.incidentId, revision: revised.revision, body: revised },
          { path: repairExportPayloadPath(revised.incidentId, revised.revision), id: revised.incidentId, revision: revised.revision, body: revisedPayload },
        ] });
        results.push({ incidentId: incident.incidentId, ...result });
      }
      return { stdout: options.json ? `${JSON.stringify({ runId: record.jobId, exports: results }, null, 2)}\n`
        : results.map(result => `${result.incidentId}: ${result.state}${result.issueId === null ? '' : ` (${result.issueId})`}${result.reason === null ? '' : `: ${result.reason}`}\n`).join(''),
      stderr: '', exitStatus: results.every(result => result.state === 'exported') ? 0 : 1 };
    } finally { await lock.release(); }
  } catch (error) { return refused(error instanceof Error ? error.message : String(error)); }
}
