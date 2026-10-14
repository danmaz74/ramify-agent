import { expect, test } from 'vitest';
import { repairIncidentRecordSchema } from '../../../../src/interfaces/protocol/repairs.js';
import { runEventSchema } from '../../../../src/run/log.js';
import { runLayout } from '../../../../src/run/records.js';
import { authenticateRepairHistory, RepairHistoryError } from '../../../../src/run/repair-history.js';
import { automaticRepairsOf } from '../repairs.js';
import { ProjectionError, runView, type CommittedLine } from '../inputs.js';
import { committedRun } from './helpers/committed.js';

const incident = repairIncidentRecordSchema.parse({
  schema: 'ramify-agent.repair-incident/1', incidentId: 'apr-0001', revision: 1, createdAt: '2026-10-12T00:00:00.000Z',
  preparation: { id: 'prep-1', path: 'repairs/preparations/prep-1.json' }, operation: 'local-architect-preparation', workItem: 'work-1',
  originalInvocation: 'inv-0001', originalAssignment: null, originalResult: 'outcomes/inv-0001.json',
  harnessError: { name: 'Error', message: 'Retained failure', stack: 'retained stack', evidence: ['original-evidence'] },
  admission: { admitted: false, reason: 'No assignment' }, authority: { assignment: null, scopeEvidence: [] },
  candidateBefore: { head: 'a'.repeat(40), tree: null, staged: [], unstaged: [], untracked: [], evidence: [] },
  candidateAfter: null, invocation: null, session: null, result: null, verification: null, continuation: null,
  startedAt: null, endedAt: null, elapsedMs: null, usage: null, versions: { harness: 'fixture' },
  export: { externalRef: 'retained-ref', state: 'pending', issueId: null, reason: null, attemptedAt: null },
});
function line(body: typeof incident, stage = 'refused', sequence = 1, exporting = false): CommittedLine {
  const event = runEventSchema.parse({ sequence, jobId: '20261013T000000Z-c0ffee', at: incident.createdAt,
    type: exporting ? 'repair-export-recorded' : 'repair-incident-recorded',
    data: exporting ? { incidentId: body.incidentId, revision: body.revision, state: body.export.state }
      : { incidentId: body.incidentId, revision: body.revision, stage } });
  return { sequence, at: event.at, transaction: { event, records: [{ path: runLayout.repairIncident(body.incidentId, body.revision),
    id: body.incidentId, revision: body.revision, body }] } };
}
const basis = () => runView(committedRun('/nonexistent/reading-only'));

test('repair presentation consumes shared authenticated facts and leaves original history intact', () => {
  const entries = [line(incident)];
  const before = JSON.stringify(entries);
  const facts = authenticateRepairHistory(entries);
  const view = { ...basis(), entries, events: entries.map(entry => entry.transaction.event) };
  for (let round = 0; round < 2; round++) {
    expect(automaticRepairsOf(view)).toEqual({ attempted: 0, refused: 1,
      incidents: [{ ...facts[0]!.record, stage: facts[0]!.stage, updatedAt: facts[0]!.updatedAt }] });
  }
  expect(JSON.stringify(entries)).toBe(before);
});

test('small inconsistent histories retain the shared validator refusal and evidence in query errors', () => {
  const first = line(incident);
  const badIdentity = { ...first, transaction: { ...first.transaction, records: [{ ...first.transaction.records[0]!, id: 'different' }] } };
  const histories = [
    [badIdentity],
    [line({ ...incident, revision: 2 })],
    [first, line({ ...incident, revision: 2 }, 'running', 2)],
    [first, line({ ...incident, revision: 2, harnessError: { ...incident.harnessError, message: 'changed original' } }, 'refused', 2)],
    [first, line({ ...incident, revision: 2, harnessError: { ...incident.harnessError, message: 'export changed evidence' } }, 'refused', 2, true)],
  ];
  for (const entries of histories) {
    const before = JSON.stringify(entries);
    let failure: unknown;
    try { authenticateRepairHistory(entries); } catch (error) { failure = error; }
    expect(failure).toBeInstanceOf(RepairHistoryError);
    if (!(failure instanceof RepairHistoryError)) throw new Error('Expected shared authentication refusal');
    let translated: unknown;
    try { automaticRepairsOf({ ...basis(), entries, events: entries.map(entry => entry.transaction.event) }); } catch (error) { translated = error; }
    expect(translated).toBeInstanceOf(ProjectionError);
    expect(translated).toMatchObject({ code: failure.code, message: failure.message, evidence: failure.evidence });
    expect(JSON.stringify(entries)).toBe(before);
  }
});
