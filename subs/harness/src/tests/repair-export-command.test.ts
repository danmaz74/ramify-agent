import { mkdir, mkdtemp, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { commitRecord } from '../jobs/commit.js';
import { RunQueries, type RunSource } from '../../subs/projections/src/queries.js';
import { ProjectionError, type CommittedRun } from '../../subs/projections/src/inputs.js';
import { RunLog } from '../run/log.js';
import { runLayout } from '../run/records.js';
import { repairIncidentRecordSchema } from '../run/repair-records.js';
import { runRepairExportCommandWith as runRepairExportCommand } from '../run/repair-export-command.js';
import { repairExportPayloadPath, repairProjectKey } from '../run/repair-export.js';
import { acquireProjectLock } from '../store/lock.js';
import { commandResult } from './helpers/command-result.js';
import { constructedRecord, runId } from './helpers/constructed.js';
import { repairExportFixture } from './helpers/repair-export-fixture.js';

const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true }))); });
async function retainedRun(viaSymlink = false, terminal = true, admitted = false) {
  const root = await mkdtemp(join(tmpdir(), 'repair-export-command-'));
  directories.push(root);
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
  return { root, directory, record, payload, log, options: { run: directory, executable: '/tools/bd', workspace: root, json: true } };
}

// The public child consumes only committed reading facts, not the log writer.
async function childRepairs(projectRoot: string, run: CommittedRun) {
  const source: RunSource = {
    projectRoot, agentName: undefined,
    committed: () => run, committedRuns: () => [run],
    runVersions: () => [{ planId: 'review-notes', runId, version: run.entries.at(-1)?.sequence ?? 0 }],
  };
  return (await new RunQueries(source).run('review-notes', runId)).run.automaticRepairs;
}

async function childRefusal(fixture: Awaited<ReturnType<typeof retainedRun>>, diagnostic: string,
  code = 'unreadable', evidence?: unknown) {
  const read = () => childRepairs(fixture.root, { record: fixture.record,
    directory: fixture.directory, entries: fixture.log.ledger.replay() });
  await expect(read()).rejects.toBeInstanceOf(ProjectionError);
  await expect(read()).rejects.toThrow(diagnostic);
  await expect(read()).rejects.toMatchObject({ code, ...(evidence === undefined ? {} : { evidence }) });
}

test.each([
  ['record identity mismatch', 'repair-incident-recorded', 2, false, 'does not identify'],
  ['revision gap', 'repair-export-recorded', 3, false, 'consecutive'],
  ['invalid lifecycle transition', 'repair-incident-recorded', 2, false, 'Invalid automatic repair transition'],
  ['changed original evidence', 'repair-incident-recorded', 2, true, 'changes original'],
  ['export changes non-export evidence', 'repair-export-recorded', 2, true, 'changes incident evidence'],
] as const)('retained %s refuses reading and export before copy recovery or external effects', async (_name, type, revision, changedEvidence, diagnostic) => {
  const fixture = await retainedRun(false, type === 'repair-export-recorded');
  const incident = { ...fixture.payload.incident, revision,
    harnessError: changedEvidence ? { ...fixture.payload.incident.harnessError, message: 'Changed original failure' } : fixture.payload.incident.harnessError };
  const path = runLayout.repairIncident(incident.incidentId, revision);
  const event = type === 'repair-export-recorded'
    ? fixture.log.next({ type, data: { incidentId: incident.incidentId, revision, state: incident.export.state } })
    : fixture.log.next({ type, data: { incidentId: incident.incidentId, revision, stage: 'refused' } });
  await commitRecord(fixture.log.ledger, { event, records: [{ path,
    id: _name === 'record identity mismatch' ? 'apr-9999' : incident.incidentId, revision, body: incident }] });
  await childRefusal(fixture, diagnostic);
  await expect(childRepairs(fixture.root, { record: fixture.record, directory: fixture.directory,
    entries: fixture.log.ledger.replay() })).rejects.toThrow(diagnostic);
  await expect(childRepairs(fixture.root, { record: fixture.record, directory: fixture.directory,
    entries: fixture.log.ledger.replay() })).rejects.toMatchObject({ code: 'unreadable' });
  // A deliberately damaged recoverable copy makes ordering observable. A
  // command that recovered before authenticating would overwrite this marker.
  const copy = join(fixture.directory, repairExportPayloadPath('apr-0001', 1));
  await writeFile(copy, 'not recovered');
  const events = await readFile(join(fixture.directory, runLayout.events), 'utf8');
  let calls = 0;
  const result = await runRepairExportCommand(fixture.options, { commandExecution: async () => {
    calls++; throw new Error('External exporter must not run');
  } });
  expect(result).toEqual({ stdout: '', stderr: expect.stringContaining(diagnostic), exitStatus: 2 });
  expect(calls).toBe(0);
  expect(await readFile(copy, 'utf8')).toBe('not recovered');
  expect(await readFile(join(fixture.directory, runLayout.events), 'utf8')).toBe(events);
});

test.each([
  ['unsupported version', { schema: 'ramify-agent.contract/1' }, 'unsupported-version', 'this harness reads ramify-agent.contract/2'],
  ['malformed durable body', { schema: 'ramify-agent.contract/2' }, 'unreadable', 'no longer satisfies its schema'],
] as const)('general %s admission remains before copy recovery', async (_name, body, code, diagnostic) => {
  const fixture = await retainedRun(false, false);
  await commitRecord(fixture.log.ledger, { event: fixture.log.next({ type: 'repair-export-recorded', data: {
    incidentId: 'apr-0001', revision: 2, state: 'pending',
  } }), records: [{ path: 'contracts/damaged.json', id: 'damaged', revision: 1, body }] });
  await childRefusal(fixture, diagnostic, code, expect.arrayContaining([expect.stringContaining('contracts/damaged.json')]));
  await expect(childRepairs(fixture.root, { record: fixture.record, directory: fixture.directory,
    entries: fixture.log.ledger.replay() })).rejects.toThrow(diagnostic);
  await expect(childRepairs(fixture.root, { record: fixture.record, directory: fixture.directory,
    entries: fixture.log.ledger.replay() })).rejects.toMatchObject({ code, evidence: expect.arrayContaining([expect.stringContaining('contracts/damaged.json')]) });
  const copy = join(fixture.directory, repairExportPayloadPath('apr-0001', 1));
  await writeFile(copy, 'not recovered');
  const events = await readFile(join(fixture.directory, runLayout.events), 'utf8');
  let calls = 0;
  const result = await runRepairExportCommand(fixture.options, { commandExecution: async () => { calls++; throw new Error('No export'); } });
  expect(result).toEqual({ stdout: '', stderr: expect.stringContaining(diagnostic), exitStatus: 2 });
  expect(calls).toBe(0);
  expect(await readFile(copy, 'utf8')).toBe('not recovered');
  expect(await readFile(join(fixture.directory, runLayout.events), 'utf8')).toBe(events);
});

test.each(['invocation conflict', 'session conflict', 'unverified continuation'] as const)('%s refuses query and export before effects', async kind => {
  const fixture = await retainedRun(false, false, true);
  await fixture.log.append({ type: 'invocation-started', data: {
    invocation: 'inv-repair', session: 'ses-0001', role: 'engineer', start: 'opened', work: { automaticRepair: 'apr-0001' },
  } });
  const running = repairIncidentRecordSchema.parse({ ...fixture.payload.incident, revision: 2,
    invocation: kind === 'invocation conflict' ? 'inv-other' : 'inv-repair',
    session: kind === 'session conflict' ? 'ses-0002' : 'ses-0001' });
  await commitRecord(fixture.log.ledger, { event: fixture.log.next({ type: 'repair-incident-recorded', data: {
    incidentId: running.incidentId, revision: 2, stage: 'running',
  } }), records: [{ path: runLayout.repairIncident(running.incidentId, 2), id: running.incidentId, revision: 2, body: running }] });
  if (kind === 'unverified continuation') {
    const continued = repairIncidentRecordSchema.parse({ ...running, revision: 3,
      result: { outcome: 'ready', summary: 'Ready judgment', checks: [], remainingWork: [], suspectedCause: null, evidence: [] },
      verification: { verified: false, reason: 'Handback not verified', evidence: [] },
      continuation: { delivered: true, reason: 'Delivered', evidence: [] } });
    await commitRecord(fixture.log.ledger, { event: fixture.log.next({ type: 'repair-incident-recorded', data: {
      incidentId: continued.incidentId, revision: 3, stage: 'continued',
    } }), records: [{ path: runLayout.repairIncident(continued.incidentId, 3), id: continued.incidentId, revision: 3, body: continued }] });
  }
  const diagnostic = kind === 'unverified continuation' ? 'has no verified continuation' : 'names a different invocation or session';
  await childRefusal(fixture, diagnostic, 'unreadable', []);
  await expect(childRepairs(fixture.root, { record: fixture.record, directory: fixture.directory,
    entries: fixture.log.ledger.replay() })).rejects.toThrow(diagnostic);
  await expect(childRepairs(fixture.root, { record: fixture.record, directory: fixture.directory,
    entries: fixture.log.ledger.replay() })).rejects.toMatchObject({ code: 'unreadable', evidence: [] });
  const copies = [runLayout.repairIncident('apr-0001', 1), repairExportPayloadPath('apr-0001', 1)].map(path => join(fixture.directory, path));
  for (const copy of copies) await writeFile(copy, 'not recovered');
  const events = await readFile(join(fixture.directory, runLayout.events), 'utf8');
  let calls = 0;
  const result = await runRepairExportCommand(fixture.options, { commandExecution: async () => {
    calls++; throw new Error('External exporter must not run');
  } });
  expect(result).toEqual({ stdout: '', stderr: expect.stringContaining(diagnostic), exitStatus: 2 });
  expect(calls).toBe(0);
  for (const copy of copies) expect(await readFile(copy, 'utf8')).toBe('not recovered');
  expect(await readFile(join(fixture.directory, runLayout.events), 'utf8')).toBe(events);
});

test('manual export preserves identity captured through a symlink target path', async () => {
  const fixture = await retainedRun(true);
  expect(fixture.payload.projectKey).toBe(repairProjectKey(fixture.root));
  let calls = 0;
  const result = await runRepairExportCommand(fixture.options, { commandExecution: async request => {
    calls++;
    expect(request.argv).toContain(fixture.payload.incident.export.externalRef);
    return commandResult(request, { stdout: JSON.stringify([{ id: 'tracker-symlink', external_ref: fixture.payload.incident.export.externalRef }]) });
  } });
  expect(result.exitStatus).toBe(0);
  expect(calls).toBe(1);
  const revised = JSON.parse(await readFile(join(fixture.directory, repairExportPayloadPath('apr-0001', 2)), 'utf8'));
  expect(revised.projectKey).toBe(fixture.payload.projectKey);
  expect(revised.incident.export).toMatchObject({ externalRef: fixture.payload.incident.export.externalRef, issueId: 'tracker-symlink' });
});

test('manual export updates a retained terminal run through ledger without changing terminal or incident lifecycle', async () => {
  const fixture = await retainedRun();
  let calls = 0;
  const result = await runRepairExportCommand(fixture.options, { commandExecution: async request => {
    calls++;
    expect(request.argv).toContain('list');
    return commandResult(request, { stdout: JSON.stringify([{ id: 'tracker-1', external_ref: fixture.payload.incident.export.externalRef, status: 'closed' }]) });
  } });
  expect(result.exitStatus).toBe(0);
  expect(JSON.parse(result.stdout).exports[0]).toMatchObject({ state: 'exported', issueId: 'tracker-1' });
  expect(calls).toBe(1);
  const reopened = await RunLog.open(join(fixture.directory, runLayout.events), runId);
  expect(reopened.terminal).toEqual(fixture.log.terminal);
  expect(reopened.events.at(-1)?.type).toBe('repair-export-recorded');
  const projected = await childRepairs(fixture.root, { record: fixture.record, directory: fixture.directory, entries: reopened.ledger.replay() });
  expect(projected).toMatchObject({ attempted: 0, refused: 1, incidents: [{ stage: 'refused', revision: 2, export: { issueId: 'tracker-1', state: 'exported' } }] });
  const payload = JSON.parse(await readFile(join(fixture.directory, repairExportPayloadPath('apr-0001', 2)), 'utf8'));
  expect(payload.incident.export.issueId).toBe('tracker-1');
  const before = await readFile(join(fixture.directory, runLayout.events), 'utf8');
  const payloadBefore = await readFile(join(fixture.directory, repairExportPayloadPath('apr-0001', 2)), 'utf8');
  const paths = [runLayout.record, runLayout.events, runLayout.repairIncident('apr-0001', 2), repairExportPayloadPath('apr-0001', 2)]
    .map(path => join(fixture.directory, path));
  const capture = () => Promise.all(paths.map(async path => ({ bytes: await readFile(path), mtime: (await stat(path)).mtimeMs })));
  const captured = await capture();
  for (let read = 0; read < 3; read++) expect(await childRepairs(fixture.root, { record: fixture.record,
    directory: fixture.directory, entries: reopened.ledger.replay() })).toEqual(projected);
  expect(await capture()).toEqual(captured);
  for (let read = 0; read < 3; read++) expect(await childRepairs(fixture.root, { record: fixture.record,
    directory: fixture.directory, entries: reopened.ledger.replay() })).toEqual(projected);
  expect(calls).toBe(1);
  expect(await readFile(join(fixture.directory, runLayout.events), 'utf8')).toBe(before);
  expect(await readFile(join(fixture.directory, repairExportPayloadPath('apr-0001', 2)), 'utf8')).toBe(payloadBefore);
});

test('manual export preserves pending state and payload when the CLI is unavailable', async () => {
  const fixture = await retainedRun();
  let calls = 0;
  const result = await runRepairExportCommand(fixture.options, { commandExecution: async request => {
    calls++;
    return commandResult(request, { outcome: { kind: 'runner-error', error: { kind: 'ENOENT', message: 'bd missing' } } });
  } });
  expect(result.exitStatus).toBe(1);
  expect(JSON.parse(result.stdout).exports[0]).toMatchObject({ state: 'pending', reason: expect.stringContaining('ENOENT') });
  expect(calls).toBe(1);
  const revised = JSON.parse(await readFile(join(fixture.directory, repairExportPayloadPath('apr-0001', 2)), 'utf8'));
  expect(revised.incident.harnessError).toEqual(fixture.payload.incident.harnessError);
  expect(revised.incident.export.state).toBe('pending');
});

test('manual export retains conflicting tracker identities without changing incident lifecycle', async () => {
  const fixture = await retainedRun();
  let calls = 0;
  const external_ref = fixture.payload.incident.export.externalRef;
  const result = await runRepairExportCommand(fixture.options, { commandExecution: async request => {
    calls++;
    expect(request.argv).toContain('list');
    return commandResult(request, { stdout: JSON.stringify([{ id: 'tracker-1', external_ref }, { id: 'tracker-2', external_ref }]) });
  } });
  expect(result.exitStatus).toBe(1);
  expect(calls).toBe(1);
  const reopened = await RunLog.open(join(fixture.directory, runLayout.events), runId);
  expect(reopened.events.at(-1)).toMatchObject({ type: 'repair-export-recorded', data: { state: 'conflict' } });
  expect(reopened.terminal).toEqual(fixture.log.terminal);
  const projected = await childRepairs(fixture.root, { record: fixture.record, directory: fixture.directory, entries: reopened.ledger.replay() });
  expect(projected).toMatchObject({ attempted: 0, refused: 1, incidents: [{ stage: 'refused', export: { state: 'conflict', issueId: null } }] });
  expect(await childRepairs(fixture.root, { record: fixture.record, directory: fixture.directory,
    entries: reopened.ledger.replay() })).toEqual(projected);
});

test('a live service project lock prevents manual effects and ledger writes', async () => {
  const fixture = await retainedRun();
  const lock = await acquireProjectLock(fixture.root);
  try {
    const result = await runRepairExportCommand(fixture.options, { commandExecution: async () => { throw new Error('No command may launch'); } });
    expect(result).toMatchObject({ exitStatus: 2, stderr: expect.stringContaining('Another harness') });
    const reopened = await RunLog.open(join(fixture.directory, runLayout.events), runId);
    expect(reopened.version).toBe(fixture.log.version);
    expect(await lock.held()).toBe(true);
  } finally { await lock.release(); }
});

test('manual export restores ledger payload materialization before refusing an absent incident', async () => {
  const fixture = await retainedRun();
  // Materialized copies are not authority; editing one cannot redirect export.
  await writeFile(join(fixture.directory, repairExportPayloadPath('apr-0001', 1)), '{}');
  const result = await runRepairExportCommand({ ...fixture.options, incident: 'apr-9999' }, { commandExecution: async () => { throw new Error('No command may launch'); } });
  expect(result).toMatchObject({ exitStatus: 2, stderr: expect.stringContaining('not recorded') });
  expect(JSON.parse(await readFile(join(fixture.directory, repairExportPayloadPath('apr-0001', 1)), 'utf8')).schema).toBe('ramify-agent.repair-incident-export/1');
});
