import { automaticRepairAssignmentSchema, repairChanges, repairDeltaSchema, type AutomaticRepairAssignment, type RepairDelta } from '../../work-coordination/src/repair/repair-preparation.js';
import { repairIncidentRecordSchema, type RepairIncidentRecord } from '../../../../../src/interfaces/protocol/repairs.js';
import { runLayout } from '../../../src/run/records.js';
import type { RunLog } from '../../../src/run/log.js';

export type Entries = ReturnType<RunLog['ledger']['replay']>;
export interface VerifiedRepairDelta {
  readonly sequence: number;
  readonly incident: RepairIncidentRecord;
  readonly assignment: AutomaticRepairAssignment;
  readonly delta: RepairDelta;
}

/** Only a verified handback's co-committed delta can supplement ordinary gate authority. */
export function verifiedRepairDeltas(entries: Entries): VerifiedRepairDelta[] {
  const assignments = new Map<string, AutomaticRepairAssignment>();
  const result: VerifiedRepairDelta[] = [];
  const seen = new Set<string>();
  for (const entry of entries) {
    const event = entry.transaction.event;
    if (event.type === 'repair-assignment-recorded') {
      const matches = entry.transaction.records.filter(record => record.path === runLayout.contingentRepairAssignment
        && record.id === event.data.assignment && record.revision === 1);
      if (matches.length !== 1) throw new Error('Automatic repair assignment has no unique committed authority');
      const assignment = automaticRepairAssignmentSchema.parse(matches[0]!.body);
      if (assignment.id !== event.data.assignment || assignment.invocation !== event.data.invocation || assignments.has(assignment.id)) {
        throw new Error('Automatic repair assignment identity is inconsistent');
      }
      assignments.set(assignment.id, assignment);
    }
    if (event.type !== 'repair-incident-recorded' || event.data.stage !== 'continued') continue;
    const incidentRecords = entry.transaction.records.filter(record => record.path === runLayout.repairIncident(event.data.incidentId, event.data.revision)
      && record.id === event.data.incidentId && record.revision === event.data.revision);
    const deltaRecords = entry.transaction.records.filter(record => record.path === runLayout.repairDelta(event.data.incidentId)
      && record.id === event.data.incidentId && record.revision === 1);
    if (incidentRecords.length !== 1 || deltaRecords.length !== 1 || seen.has(event.data.incidentId)) {
      throw new Error('Automatic repair handback has no unique committed incident and delta');
    }
    const incident = repairIncidentRecordSchema.parse(incidentRecords[0]!.body);
    const delta = repairDeltaSchema.parse(deltaRecords[0]!.body);
    const assignment = assignments.get(delta.assignment);
    const releases = entries.filter(line => line.sequence < entry.sequence && line.transaction.event.type === 'writer-released'
      && line.transaction.event.data.invocation === delta.invocation);
    if (incident.incidentId !== event.data.incidentId || incident.revision !== event.data.revision || delta.incidentId !== incident.incidentId
      || assignment === undefined || incident.authority.assignment !== assignment.id || delta.originalAssignment !== incident.originalAssignment
      || incident.invocation !== delta.invocation || !incident.admission.admitted || incident.result?.outcome !== 'ready'
      || incident.verification?.verified !== true || incident.continuation?.delivered !== true
      || !incident.verification.evidence.includes(runLayout.repairDelta(incident.incidentId))
      || releases.length !== 1 || releases[0]!.transaction.event.type !== 'writer-released' || !releases[0]!.transaction.event.data.confirmed) {
      throw new Error('Automatic repair handback lacks verified identity, authority or writer settlement');
    }
    const before = new Map(delta.before.map(file => [file.path, file]));
    const after = new Map(delta.after.map(file => [file.path, file]));
    if (before.size !== delta.before.length || after.size !== delta.after.length || new Set(delta.changes.map(change => change.path)).size !== delta.changes.length) {
      throw new Error('Automatic repair delta repeats a source identity');
    }
    for (const change of delta.changes) {
      const prior = before.get(change.path);
      const next = after.get(change.path);
      if (change.before.path !== change.path || change.after.path !== change.path || next === undefined
        || next.hash !== change.after.hash || next.mode !== change.after.mode
        || (prior === undefined ? change.before.hash !== null || change.before.mode !== null : prior.hash !== change.before.hash || prior.mode !== change.before.mode)
        || (change.before.hash === change.after.hash && change.before.mode === change.after.mode)) {
        throw new Error('Automatic repair delta differs from its source snapshots');
      }
    }
    if (JSON.stringify(repairChanges(delta.before, delta.after)) !== JSON.stringify(delta.changes)
      || delta.before.some(file => !after.has(file.path))) throw new Error('Automatic repair delta omits a source change');
    const dirty = [...new Set([...incident.candidateBefore.changedPaths, ...incident.candidateBefore.staged, ...incident.candidateBefore.unstaged, ...incident.candidateBefore.untracked])].sort();
    if (JSON.stringify(dirty) !== JSON.stringify([...new Set(delta.beforeDirtyPaths)].sort())) throw new Error('Automatic repair delta lost its original candidate identity');
    if (dirty.some(path => !before.has(path))) throw new Error('Automatic repair delta lost a pre-existing candidate path');
    seen.add(incident.incidentId);
    result.push({ sequence: entry.sequence, incident, assignment, delta });
  }
  return result;
}
