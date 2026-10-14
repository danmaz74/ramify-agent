import { expect, test } from 'vitest';
import { transcriptWorkSchema } from '../../../../src/interfaces/protocol/transcripts.js';
import { repairIncidentRecordSchema, runSnapshotSchema, type RepairIncidentRecord, type RepairIncidentStage } from '../../../../src/interfaces/protocol/runs.js';
import { eventPage } from '../events.js';
import { ProjectionError, runView, type CommittedLine } from '../inputs.js';
import { snapshotOf } from '../snapshot.js';
import { runLayout } from '../../../../src/run/records.js';
import { constructedRun } from '../../../../src/tests/helpers/constructed.js';

const createdAt = '2026-09-21T08:00:00.000Z';

function incident(extra: Partial<RepairIncidentRecord> = {}): RepairIncidentRecord {
  return repairIncidentRecordSchema.parse({
    schema: 'ramify-agent.repair-incident/1', incidentId: 'apr-0001', revision: 1, createdAt,
    preparation: { id: 'prep-0001', path: 'repairs/preparations/prep-0001.json' }, operation: 'local-architect-work-turn', workItem: 'wi-001',
    originalInvocation: 'inv-0003', originalAssignment: 'wi-001.i01', originalResult: 'work/wi-001/i01/result.json',
    harnessError: { name: 'Error', message: 'ENOENT reading retained source', stack: 'Error\n at preparation', evidence: ['input/source.txt'] },
    admission: { admitted: true, reason: 'Recorded preparation cannot reach architect' },
    authority: { assignment: 'repair-assignment-1', scopeEvidence: ['repairs/assignment.json'] },
    candidateBefore: { head: 'abc', tree: 'def', staged: ['partial.ts'], unstaged: [], untracked: [], evidence: ['candidate-before.json'] }, candidateAfter: null,
    invocation: null, session: null, result: null, verification: null, continuation: null,
    startedAt: null, endedAt: null, elapsedMs: null, usage: null, versions: { harness: '1' },
    export: { externalRef: 'ramify-agent:repair:project:run:apr-0001', state: 'pending', issueId: null, reason: 'No configured tracker', attemptedAt: null },
    ...extra,
  });
}

function line(body: RepairIncidentRecord, stage: RepairIncidentStage, sequence: number, exporting = false): CommittedLine {
  return {
    sequence, at: createdAt,
    transaction: {
      event: exporting
        ? { sequence, jobId: '20260921T080000Z-c0ffee', at: createdAt, type: 'repair-export-recorded', data: { incidentId: body.incidentId, revision: body.revision, state: body.export.state } }
        : { sequence, jobId: '20260921T080000Z-c0ffee', at: createdAt, type: 'repair-incident-recorded', data: { incidentId: body.incidentId, revision: body.revision, stage } },
      records: [{ id: body.incidentId, revision: body.revision, path: runLayout.repairIncident(body.incidentId, body.revision), body }],
    },
  };
}
function view(entries: readonly CommittedLine[]) { return runView({ ...constructedRun([]), entries }); }

function history() {
  const admitted = incident();
  const running = incident({ revision: 2, invocation: 'inv-0004', session: 'ses-0002', startedAt: createdAt });
  const continued = incident({
    ...running, revision: 3, endedAt: createdAt, elapsedMs: 400,
    candidateAfter: { ...admitted.candidateBefore, tree: 'fed', unstaged: ['restored.ts'] },
    result: { outcome: 'ready', summary: 'Restored retained path', checks: ['Preparation succeeds'], remainingWork: ['Finish module behavior'], suspectedCause: 'Stale retained path', evidence: ['repair-delta.json'] },
    verification: { verified: true, reason: 'Protected structure and inputs preserved', evidence: ['verification.json'] },
    continuation: { delivered: true, reason: 'Architect inputs prepared', evidence: ['work-turn-inputs.json'] },
  });
  return { admitted, running, continued, entries: [line(admitted, 'admitted', 1), line(running, 'running', 2), line(continued, 'continued', 3)] };
}

test('legacy run snapshots default to no automatic incidents', () => {
  const snapshot = snapshotOf(view([]));
  const { automaticRepairs: omitted, ...old } = snapshot;
  expect(omitted).toEqual({ attempted: 0, refused: 0, incidents: [] });
  expect(runSnapshotSchema.parse(old).automaticRepairs).toEqual(omitted);
});

test('retains original obstruction and partial-result reference after verified handback and terminal completion', () => {
  const { entries } = history();
  const run = view([...entries, ...constructedRun([{ type: 'job-stopped', data: { settled: true } }]).entries.map(entry => ({ ...entry, sequence: 4, transaction: { ...entry.transaction, event: { ...entry.transaction.event, sequence: 4 } } }))]);
  const snapshot = runSnapshotSchema.parse(snapshotOf(run));
  expect(snapshot.state).toBe('stopped');
  expect(snapshot.automaticRepairs).toMatchObject({ attempted: 1, refused: 0, incidents: [{ stage: 'continued', originalResult: 'work/wi-001/i01/result.json', harnessError: { message: 'ENOENT reading retained source' }, result: { remainingWork: ['Finish module behavior'] } }] });
  expect(eventPage(run, 0).events[2]).toMatchObject({ summary: 'Automatic repair apr-0001: continued', refs: [{ kind: 'repair-incident', id: 'apr-0001' }] });
});

test('admission refusals are retained without counting an attempted session', () => {
  const refused = incident({ admission: { admitted: false, reason: 'No recorded authority' }, authority: { assignment: null, scopeEvidence: [] } });
  expect(snapshotOf(view([line(refused, 'refused', 1)])).automaticRepairs).toMatchObject({ attempted: 0, refused: 1, incidents: [{ stage: 'refused' }] });
});

test('live running intent gains transcript identity from the committed repair invocation', () => {
  const admitted = incident();
  const running = incident({ revision: 2, startedAt: createdAt });
  const start: CommittedLine = { sequence: 3, at: createdAt, transaction: { records: [], event: {
    type: 'invocation-started', sequence: 3, jobId: '20260921T080000Z-c0ffee', at: createdAt,
    data: { invocation: 'inv-0004', session: 'ses-0002', role: 'engineer', work: { workItem: 'wi-001', automaticRepair: admitted.incidentId }, start: 'opened' },
  } } };
  expect(snapshotOf(view([line(admitted, 'admitted', 1), line(running, 'running', 2), start])).automaticRepairs).toMatchObject({
    attempted: 1, incidents: [{ stage: 'running', invocation: 'inv-0004', session: 'ses-0002' }],
  });
});

test('terminal stop interrupts an open repair display while verification and settlement remain unknown', () => {
  const admitted = incident();
  const running = incident({ revision: 2, startedAt: createdAt });
  const start: CommittedLine = { sequence: 3, at: createdAt, transaction: { records: [], event: {
    type: 'invocation-started', sequence: 3, jobId: '20260921T080000Z-c0ffee', at: createdAt,
    data: { invocation: 'inv-0004', session: 'ses-0002', role: 'engineer', work: { workItem: 'wi-001', automaticRepair: admitted.incidentId }, start: 'opened' },
  } } };
  const stop: CommittedLine = { sequence: 4, at: createdAt, transaction: { records: [], event: {
    type: 'job-stopped', sequence: 4, jobId: '20260921T080000Z-c0ffee', at: createdAt, data: { settled: false },
  } } };
  const release: CommittedLine = { sequence: 4, at: createdAt, transaction: { records: [], event: {
    type: 'writer-released', sequence: 4, jobId: '20260921T080000Z-c0ffee', at: createdAt, data: { invocation: 'inv-0004', confirmed: false, groupsKilled: 0 },
  } } };
  const snapshot = snapshotOf(view([line(admitted, 'admitted', 1), line(running, 'running', 2), start, release,
    { ...stop, sequence: 5, transaction: { ...stop.transaction, event: { ...stop.transaction.event, sequence: 5 } } }]));
  expect(snapshot.automaticRepairs).toMatchObject({ attempted: 1, incidents: [{ stage: 'interrupted', invocation: 'inv-0004', session: 'ses-0002', verification: null, continuation: null, result: null, export: { state: 'pending' } }] });
  expect(snapshot.state).toBe('stopped');
  expect(snapshot.writer.unsettled).toBe('inv-0004');
  // Projecting the terminal evidence does not revise the retained incident/export bytes.
  expect(running.verification).toBeNull();
  expect(running.continuation).toBeNull();
});

test('export revisions retain the verified stage and evidence', () => {
  const { continued, entries } = history();
  const exported = incident({ ...continued, revision: 4, export: { ...continued.export, state: 'exported', issueId: 'ramify-agent-abc', reason: null, attemptedAt: createdAt } });
  expect(snapshotOf(view([...entries, line(exported, 'continued', 4, true)])).automaticRepairs.incidents[0]).toMatchObject({ stage: 'continued', export: { issueId: 'ramify-agent-abc' } });
  const forged = incident({ ...exported, verification: { verified: false, reason: 'changed by export', evidence: [] } });
  expect(() => snapshotOf(view([...entries, line(forged, 'continued', 4, true)]))).toThrow(/changes incident evidence/);
});

test('rejects revisions that change the original obstruction or claim an unverified handback', () => {
  const { admitted, running, entries } = history();
  const changed = incident({ ...running, harnessError: { ...admitted.harnessError, message: 'rewritten' } });
  expect(() => snapshotOf(view([entries[0]!, line(changed, 'running', 2)]))).toThrow(/changes original harnessError/);
  expect(() => snapshotOf(view([entries[0]!, line(running, 'continued', 2)]))).toThrow(/Invalid automatic repair transition/);
  expect(() => snapshotOf(view([entries[0]!, entries[1]!, line(incident({ ...running, revision: 3 }), 'continued', 3)]))).toThrow(/no verified continuation/);
});

test('rejects event/body identity, path and revision mismatches', () => {
  const body = incident();
  const good = line(body, 'admitted', 1);
  for (const altered of [
    { ...good.transaction.records[0]!, path: 'other.json' },
    { ...good.transaction.records[0]!, id: 'apr-0002' },
    { ...good.transaction.records[0]!, revision: 2 },
  ]) expect(() => snapshotOf(view([{ ...good, transaction: { ...good.transaction, records: [altered] } }]))).toThrow(ProjectionError);
  expect(() => snapshotOf(view([line(incident({ revision: 2 }), 'admitted', 1)]))).toThrow(/consecutive/);
});


test('repair session work retains its distinct incident identity and confirmed exports require a task', () => {
  expect(transcriptWorkSchema.parse({ workItem: 'wi-001', automaticRepair: 'apr-0001' })).toEqual({ workItem: 'wi-001', automaticRepair: 'apr-0001' });
  expect(() => incident({ export: { ...incident().export, state: 'exported', issueId: null } })).toThrow(/must name its Beads task/);
});

