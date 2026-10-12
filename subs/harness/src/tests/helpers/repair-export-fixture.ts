import { repairIncidentRecordSchema, type RepairIncidentRecord } from '../../run/repair-records.js';
import { createRepairExportPayload, repairExternalRef, repairProjectKey, type RepairExportPayload } from '../../run/repair-export.js';

export function repairExportFixture(projectRoot: string, runId = 'run-1', extra: Partial<RepairIncidentRecord> = {}): RepairExportPayload {
  const incidentId = 'apr-0001';
  const incident = repairIncidentRecordSchema.parse({
    schema: 'ramify-agent.repair-incident/1', incidentId, revision: 1, createdAt: '2026-10-12T00:00:00.000Z',
    preparation: { id: 'prep-1', path: 'repairs/preparations/prep-1.json' }, operation: 'local-architect-preparation', workItem: 'work-1',
    originalInvocation: 'inv-0001', originalAssignment: null, originalResult: 'outcomes/inv-0001.json',
    harnessError: { name: 'Error', message: 'source is absent; $(touch /tmp/no) `shell`', stack: 'retained stack', evidence: [] },
    admission: { admitted: false, reason: 'No assignment' }, authority: { assignment: null, scopeEvidence: [] },
    candidateBefore: { head: 'a'.repeat(40), tree: null, staged: [], unstaged: [], untracked: [], evidence: [] },
    candidateAfter: null, invocation: null, session: null, result: null, verification: null, continuation: null,
    startedAt: null, endedAt: null, elapsedMs: null, usage: null, versions: { harness: 'fixture' },
    export: { externalRef: repairExternalRef(repairProjectKey(projectRoot), runId, incidentId), state: 'pending',
      issueId: null, reason: null, attemptedAt: null }, ...extra,
  });
  return createRepairExportPayload(projectRoot, runId, incident);
}
