import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { commitRecord } from '../jobs/commit.js';
import { runView } from '../projections/inputs.js';
import { automaticRepairsOf } from '../projections/repairs.js';
import { RunLog } from '../run/log.js';
import { runLayout } from '../run/records.js';
import { runRepairExportCommandWith as runRepairExportCommand } from '../run/repair-export-command.js';
import { repairExportPayloadPath, repairProjectKey } from '../run/repair-export.js';
import { acquireProjectLock } from '../store/lock.js';
import { commandResult } from './helpers/command-result.js';
import { constructedRecord, runId } from './helpers/constructed.js';
import { repairExportFixture } from './helpers/repair-export-fixture.js';

const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true }))); });
async function retainedRun(viaSymlink = false) {
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
  const payload = repairExportFixture(serviceRoot, runId);
  const incident = payload.incident;
  const log = await RunLog.open(join(directory, runLayout.events), runId);
  await commitRecord(log.ledger, { event: log.next({ type: 'repair-incident-recorded', data: { incidentId: incident.incidentId, revision: 1, stage: 'refused' } }),
    records: [{ path: runLayout.repairIncident(incident.incidentId, 1), id: incident.incidentId, revision: 1, body: incident },
      { path: repairExportPayloadPath(incident.incidentId, 1), id: incident.incidentId, revision: 1, body: payload }] });
  await log.append({ type: 'job-failed', data: { reason: 'internal', message: 'Original preparation failure', evidence: [] } });
  return { root, directory, record, payload, log, options: { run: directory, executable: '/tools/bd', workspace: root, json: true } };
}

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
  const projected = automaticRepairsOf(runView({ record: fixture.record, directory: fixture.directory, entries: reopened.ledger.replay() }));
  expect(projected).toMatchObject({ attempted: 0, refused: 1, incidents: [{ stage: 'refused', revision: 2, export: { issueId: 'tracker-1', state: 'exported' } }] });
  const payload = JSON.parse(await readFile(join(fixture.directory, repairExportPayloadPath('apr-0001', 2)), 'utf8'));
  expect(payload.incident.export.issueId).toBe('tracker-1');
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
  const projected = automaticRepairsOf(runView({ record: fixture.record, directory: fixture.directory, entries: reopened.ledger.replay() }));
  expect(projected).toMatchObject({ attempted: 0, refused: 1, incidents: [{ stage: 'refused', export: { state: 'conflict', issueId: null } }] });
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
