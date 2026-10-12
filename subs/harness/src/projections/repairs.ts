import { repairIncidentRecordSchema, type AutomaticRepairs, type RepairIncidentView } from '../interfaces/protocol/repairs.js';
import { ProjectionError, type RunView } from './inputs.js';
import { runLayout } from '../run/records.js';

/** Every incident at its latest committed revision, preserving its obstruction. */
export function automaticRepairsOf(view: RunView): AutomaticRepairs {
  const incidents = new Map<string, RepairIncidentView>();
  for (const entry of view.entries) {
    const event = entry.transaction.event;
    if (event.type !== 'repair-incident-recorded' && event.type !== 'repair-export-recorded') continue;
    const matching = entry.transaction.records.filter(record => {
      const body = record.body as { schema?: unknown; incidentId?: unknown; revision?: unknown } | null;
      return body?.schema === 'ramify-agent.repair-incident/1' && body.incidentId === event.data.incidentId && body.revision === event.data.revision;
    });
    if (matching.length !== 1) throw new ProjectionError('unreadable', `Repair event ${event.sequence} must commit exactly one matching incident revision`);
    const committed = matching[0]!;
    if (committed.path !== runLayout.repairIncident(event.data.incidentId, event.data.revision)
      || committed.id !== event.data.incidentId || committed.revision !== event.data.revision) {
      throw new ProjectionError('unreadable', `Repair event ${event.sequence} does not identify its committed record`);
    }
    const parsed = repairIncidentRecordSchema.safeParse(matching[0]!.body);
    if (!parsed.success) throw new ProjectionError('unreadable', `Repair incident ${event.data.incidentId} does not satisfy its schema`, parsed.error.issues.map(issue => issue.message));
    const previous = incidents.get(event.data.incidentId);
    if (parsed.data.revision !== (previous?.revision ?? 0) + 1) throw new ProjectionError('unreadable', `Repair incident ${event.data.incidentId} revisions must be consecutive`);
    if (event.type === 'repair-export-recorded' && (previous === undefined || parsed.data.export.state !== event.data.state)) {
      throw new ProjectionError('unreadable', `Repair export ${event.sequence} has no matching incident or delivery state`);
    }
    if (previous !== undefined) {
      const { stage: _stage, updatedAt: _updatedAt, revision: _revision, export: _export, ...previousEvidence } = previous;
      const { revision: _nextRevision, export: _nextExport, ...nextEvidence } = parsed.data;
      if (event.type === 'repair-export-recorded' && JSON.stringify(previousEvidence) !== JSON.stringify(nextEvidence)) {
        throw new ProjectionError('unreadable', `Repair export ${event.sequence} changes incident evidence`);
      }
      for (const key of ['createdAt', 'preparation', 'operation', 'workItem', 'originalInvocation', 'originalAssignment', 'originalResult', 'harnessError', 'admission', 'authority', 'candidateBefore', 'versions'] as const) {
        if (JSON.stringify(previous[key]) !== JSON.stringify(parsed.data[key])) throw new ProjectionError('unreadable', `Repair incident ${event.data.incidentId} changes original ${key}`);
      }
    }
    const stage = event.type === 'repair-incident-recorded' ? event.data.stage : previous!.stage;
    if (event.type === 'repair-incident-recorded') validateStage(previous, parsed.data, stage);
    incidents.set(parsed.data.incidentId, { ...parsed.data, stage, updatedAt: event.at });
  }
  // Invocation identity is committed after the running intent. Its live
  // transcript is available before a later incident revision records the result.
  const interruption = view.events.find(event => event.type === 'job-stopped' || event.type === 'job-interrupted' || event.type === 'job-failed');
  const values = [...incidents.values()].map(incident => {
    const starts = view.events.filter(event => event.type === 'invocation-started' && event.data.work.automaticRepair === incident.incidentId);
    if (starts.length > 1) throw new ProjectionError('unreadable', `Repair incident ${incident.incidentId} has more than one invocation`);
    const start = starts[0];
    const shown = interruption !== undefined && (incident.stage === 'admitted' || incident.stage === 'running')
      ? { ...incident, stage: 'interrupted' as const, updatedAt: Date.parse(incident.updatedAt) > Date.parse(interruption.at) ? incident.updatedAt : interruption.at }
      : incident;
    if (start?.type !== 'invocation-started') return shown;
    if ((incident.invocation !== null && incident.invocation !== start.data.invocation) || (incident.session !== null && incident.session !== start.data.session)) {
      throw new ProjectionError('unreadable', `Repair incident ${incident.incidentId} names a different invocation or session`);
    }
    return { ...shown, invocation: start.data.invocation, session: start.data.session };
  });
  return {
    attempted: values.filter(incident => incident.invocation !== null).length,
    refused: values.filter(incident => !incident.admission.admitted).length,
    incidents: values,
  };
}

function validateStage(previous: RepairIncidentView | undefined, incident: Omit<RepairIncidentView, 'stage' | 'updatedAt'>, stage: RepairIncidentView['stage']): void {
  const permitted = previous === undefined ? ['admitted', 'refused']
    : previous.stage === 'admitted' ? ['running', 'blocked', 'unverified', 'interrupted']
      : previous.stage === 'running' ? ['running', 'blocked', 'unverified', 'continued', 'interrupted'] : [];
  if (!permitted.includes(stage)) throw new ProjectionError('unreadable', `Invalid automatic repair transition ${previous?.stage ?? 'new'} to ${stage}`);
  if ((stage === 'refused') !== !incident.admission.admitted || (stage === 'refused' && incident.invocation !== null)) {
    throw new ProjectionError('unreadable', `Repair incident ${incident.incidentId} conflicts with its admission`);
  }
  if (stage === 'continued' && (incident.invocation === null || incident.result?.outcome !== 'ready' || incident.verification?.verified !== true || incident.continuation?.delivered !== true)) {
    throw new ProjectionError('unreadable', `Repair incident ${incident.incidentId} has no verified continuation`);
  }
}
