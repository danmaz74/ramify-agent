import { mkdir, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { commitRecord } from '../../jobs/commit.js';
import { RunLog } from '../../../subs/autonomous/src/run/log.js';
import { runLayout } from '../../../subs/autonomous/src/run/records.js';
import { repairExportPayloadPath } from '../../../subs/autonomous/src/run/repair-export.js';
import { constructedRecord, runId } from './constructed.js';
import { repairIncidentRecordSchema, type RepairIncidentRecord } from '../../interfaces/protocol/repairs.js';
import { createRepairExportPayload, repairExternalRef, repairProjectKey, type RepairExportPayload } from '../../../subs/autonomous/src/run/repair-export.js';

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

export async function retainedRepairRun(viaSymlink = false, terminal = true, admitted = false) {
  const root = await mkdtemp(join(tmpdir(), 'repair-export-command-'));
  const directories = [root];
  await mkdir(join(root, '.beads'));
  let serviceRoot = root;
  if (viaSymlink) {
    const aliasDirectory = await mkdtemp(join(tmpdir(), 'repair-export-alias-'));
    directories.push(aliasDirectory);
    serviceRoot = join(aliasDirectory, 'target');
    await symlink(root, serviceRoot, 'dir');
  }
  const directory = join(serviceRoot, 'plans', 'review-notes', '.harness', 'jobs', runId);
  await mkdir(directory, { recursive: true });
  const record = constructedRecord();
  await writeFile(join(directory, runLayout.record), JSON.stringify(record));
  const original = repairExportFixture(serviceRoot, runId);
  const incident = admitted ? repairIncidentRecordSchema.parse({ ...original.incident,
    admission: { admitted: true, reason: 'Bounded repair admitted' } }) : original.incident;
  const payload = { ...original, incident };
  const log = await RunLog.open(join(directory, runLayout.events), runId);
  await commitRecord(log.ledger, { event: log.next({ type: 'repair-incident-recorded', data: { incidentId: incident.incidentId, revision: 1, stage: admitted ? 'admitted' : 'refused' } }),
    records: [{ path: runLayout.repairIncident(incident.incidentId, 1), id: incident.incidentId, revision: 1, body: incident },
      { path: repairExportPayloadPath(incident.incidentId, 1), id: incident.incidentId, revision: 1, body: payload }] });
  if (terminal) await log.append({ type: 'job-failed', data: { reason: 'internal', message: 'Original preparation failure', evidence: [] } });
  return { root, directory, record, payload, log,
    close: async () => { await Promise.all(directories.map(path => rm(path, { recursive: true, force: true }))); },
    options: { run: directory, executable: '/tools/bd', workspace: root, json: true } };
}
