import { currentLifecycleEvents } from './inputs.js';
import type { AutomaticRepairs, RepairIncidentView } from '../../../src/interfaces/protocol/repairs.js';
import { authenticateRepairHistory, RepairHistoryError } from '../../autonomous/src/run/repair-history.js';
import { ProjectionError, type RunView } from './inputs.js';

/** Present authenticated latest revisions; reads never change durable lifecycle. */
export function automaticRepairsOf(view: RunView): AutomaticRepairs {
  let facts;
  try { facts = authenticateRepairHistory(view.entries); }
  catch (error) {
    if (error instanceof RepairHistoryError) throw new ProjectionError(error.code, error.message, error.evidence);
    throw error;
  }
  const interruption = currentLifecycleEvents(view).find(event => event.type === 'job-stopped' || event.type === 'job-interrupted' || event.type === 'job-failed');
  const values: RepairIncidentView[] = facts.map(({ record, stage, updatedAt }) => {
    const incident = { ...record, stage, updatedAt };
    const start = view.events.find(event => event.type === 'invocation-started' && event.data.work.automaticRepair === incident.incidentId);
    const shown = interruption !== undefined && (incident.stage === 'admitted' || incident.stage === 'running')
      ? { ...incident, stage: 'interrupted' as const, updatedAt: Date.parse(incident.updatedAt) > Date.parse(interruption.at) ? incident.updatedAt : interruption.at }
      : incident;
    return start?.type === 'invocation-started' ? { ...shown, invocation: start.data.invocation, session: start.data.session } : shown;
  });
  return {
    attempted: values.filter(incident => incident.invocation !== null).length,
    refused: values.filter(incident => !incident.admission.admitted).length,
    incidents: values,
  };
}
