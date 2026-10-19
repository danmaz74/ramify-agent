import { repairIncidentRecordSchema, type RepairIncidentRecord } from '../../../../src/interfaces/protocol/repairs.js';
import { type RepairIncidentStage } from './repair-records.js';
import type { RunEvent } from './log.js';
import { runLayout } from './records.js';

/** Committed authority only: no materialized files or response reading port. */
export interface RepairHistoryEntry {
  readonly transaction: {
    readonly event: RunEvent;
    readonly records: readonly { readonly path: string; readonly id: string; readonly revision: number; readonly body: unknown }[];
  };
}

/** Latest durable evidence, with its committed lifecycle (never display interruption). */
export interface ValidatedRepairIncident {
  readonly record: RepairIncidentRecord;
  readonly stage: RepairIncidentStage;
  readonly updatedAt: string;
}

export class RepairHistoryError extends Error {
  readonly code: 'unreadable' = 'unreadable';
  constructor(message: string, readonly evidence: readonly string[] = []) {
    super(message);
    this.name = 'RepairHistoryError';
  }
}

/** Authenticate history once, before query presentation or command effects. */
export function authenticateRepairHistory(entries: readonly RepairHistoryEntry[]): readonly ValidatedRepairIncident[] {
  const incidents = new Map<string, ValidatedRepairIncident>();
  // RunLog owns event decoding; this input intentionally exposes no writable log.
  const events = entries.map(entry => entry.transaction.event);
  for (const entry of entries) {
    const event = entry.transaction.event;
    if (event.type !== 'repair-incident-recorded' && event.type !== 'repair-export-recorded') continue;
    const matching = entry.transaction.records.filter(record => {
      const body = record.body as { schema?: unknown; incidentId?: unknown; revision?: unknown } | null;
      return body?.schema === 'ramify-agent.repair-incident/1' && body.incidentId === event.data.incidentId && body.revision === event.data.revision;
    });
    if (matching.length !== 1) throw new RepairHistoryError(`Repair event ${event.sequence} must commit exactly one matching incident revision`);
    const committed = matching[0]!;
    if (committed.path !== runLayout.repairIncident(event.data.incidentId, event.data.revision)
      || committed.id !== event.data.incidentId || committed.revision !== event.data.revision) {
      throw new RepairHistoryError(`Repair event ${event.sequence} does not identify its committed record`);
    }
    const parsed = repairIncidentRecordSchema.safeParse(committed.body);
    if (!parsed.success) throw new RepairHistoryError(`Repair incident ${event.data.incidentId} does not satisfy its schema`, parsed.error.issues.map(issue => issue.message));
    const previous = incidents.get(event.data.incidentId);
    if (parsed.data.revision !== (previous?.record.revision ?? 0) + 1) throw new RepairHistoryError(`Repair incident ${event.data.incidentId} revisions must be consecutive`);
    if (event.type === 'repair-export-recorded' && (previous === undefined || parsed.data.export.state !== event.data.state)) {
      throw new RepairHistoryError(`Repair export ${event.sequence} has no matching incident or delivery state`);
    }
    if (previous !== undefined) {
      const { revision: _revision, export: _export, ...previousEvidence } = previous.record;
      const { revision: _nextRevision, export: _nextExport, ...nextEvidence } = parsed.data;
      if (event.type === 'repair-export-recorded' && JSON.stringify(previousEvidence) !== JSON.stringify(nextEvidence)) {
        throw new RepairHistoryError(`Repair export ${event.sequence} changes incident evidence`);
      }
      for (const key of ['createdAt', 'preparation', 'operation', 'workItem', 'originalInvocation', 'originalAssignment', 'originalResult', 'harnessError', 'admission', 'authority', 'candidateBefore', 'versions'] as const) {
        if (JSON.stringify(previous.record[key]) !== JSON.stringify(parsed.data[key])) throw new RepairHistoryError(`Repair incident ${event.data.incidentId} changes original ${key}`);
      }
    }
    const stage = event.type === 'repair-incident-recorded' ? event.data.stage : previous!.stage;
    if (event.type === 'repair-incident-recorded') validateStage(previous, parsed.data, stage);
    incidents.set(parsed.data.incidentId, { record: parsed.data, stage, updatedAt: event.at });
  }
  for (const { record: incident } of incidents.values()) {
    const starts = events.filter(event => event.type === 'invocation-started' && event.data.work.automaticRepair === incident.incidentId);
    if (starts.length > 1) throw new RepairHistoryError(`Repair incident ${incident.incidentId} has more than one invocation`);
    const start = starts[0];
    if (start?.type === 'invocation-started' && ((incident.invocation !== null && incident.invocation !== start.data.invocation) || (incident.session !== null && incident.session !== start.data.session))) {
      throw new RepairHistoryError(`Repair incident ${incident.incidentId} names a different invocation or session`);
    }
  }
  return [...incidents.values()];
}

function validateStage(previous: ValidatedRepairIncident | undefined, incident: RepairIncidentRecord, stage: RepairIncidentStage): void {
  const permitted = previous === undefined ? ['admitted', 'refused']
    : previous.stage === 'admitted' ? ['running', 'blocked', 'unverified', 'interrupted']
      : previous.stage === 'running' ? ['running', 'blocked', 'unverified', 'continued', 'interrupted'] : [];
  if (!permitted.includes(stage)) throw new RepairHistoryError(`Invalid automatic repair transition ${previous?.stage ?? 'new'} to ${stage}`);
  if ((stage === 'refused') !== !incident.admission.admitted || (stage === 'refused' && incident.invocation !== null)) {
    throw new RepairHistoryError(`Repair incident ${incident.incidentId} conflicts with its admission`);
  }
  if (stage === 'continued' && (incident.invocation === null || incident.result?.outcome !== 'ready' || incident.verification?.verified !== true || incident.continuation?.delivered !== true)) {
    throw new RepairHistoryError(`Repair incident ${incident.incidentId} has no verified continuation`);
  }
}
