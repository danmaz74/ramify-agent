import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import type { CommandRequest, CommandRunner } from '../../subs/evidence/src/run-command.js';
import { exportRepairIncident, repairExportPayloadSchema } from '../../subs/autonomous/src/run/repair-export.js';
import { commandResult } from './helpers/command-result.js';
import type { DirectCheckStep } from './helpers/direct-check-execution.js';
import { repairExportFixture } from './helpers/repair-export-fixture.js';

const directories: string[] = [];
const scripts: Array<() => void> = [];
afterEach(async () => {
  for (const script of scripts.splice(0)) script();
  await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true })));
});
async function context() {
  const workspace = await mkdtemp(join(tmpdir(), 'repair-export-'));
  directories.push(workspace);
  await mkdir(join(workspace, '.beads'));
  const payload = repairExportFixture(workspace);
  return { configuration: { executable: '/tools/bd', workspace }, payload };
}
function commands(steps: Array<DirectCheckStep | Error>): { runner: CommandRunner; requests: CommandRequest[] } {
  const requests: CommandRequest[] = [];
  const supplied = [...steps];
  const runner: CommandRunner = async request => {
    requests.push(request);
    const next = supplied.shift();
    if (next === undefined) throw new Error('Unscripted command');
    if (next instanceof Error) throw next;
    return commandResult(request, next);
  };
  scripts.push(() => { expect(supplied, 'unused required command replies').toHaveLength(0); expect(requests).toHaveLength(steps.length); });
  return { runner, requests };
}

test('creates an investigation task from self-contained JSON via argv and stdin', async () => {
  const { configuration, payload } = await context();
  const external_ref = payload.incident.export.externalRef;
  const scripted = commands([{ stdout: '[]' }, { stdout: JSON.stringify({ id: 'tracker-1', external_ref }) }]);
  expect(await exportRepairIncident(payload, configuration, scripted.runner)).toMatchObject({ state: 'exported', issueId: 'tracker-1' });
  expect(scripted.requests[0]!.argv).toEqual(['/tools/bd', '-C', configuration.workspace, '--sandbox', 'list', '--all', '--external-ref', external_ref, '--limit', '0', '--json']);
  const create = scripted.requests[1]!;
  expect(create.argv).toContain('task');
  expect(create.argv).toContain('repair-incident');
  expect(create.argv).toContain('--body-file');
  expect(create.timeoutMs).toBe(15000);
  expect(create.maxBytes).toBe(1024 * 1024);
  expect(repairExportPayloadSchema.parse(JSON.parse(create.stdin!))).toEqual(payload);
  expect(create.argv.join(' ')).not.toContain('$(touch');
});

test('reuses a closed exact match without creating or reopening it', async () => {
  const { configuration, payload } = await context();
  const scripted = commands([{ stdout: JSON.stringify([{ id: 'tracker-closed', status: 'closed', external_ref: payload.incident.export.externalRef },
    { id: 'other', external_ref: `${payload.incident.export.externalRef}:other` }]) }]);
  expect(await exportRepairIncident(payload, configuration, scripted.runner)).toMatchObject({ state: 'exported', issueId: 'tracker-closed' });
});

test('updates evidence only after the issue identity was durably captured and preserves id on failure', async () => {
  const { configuration, payload } = await context();
  payload.incident.export.issueId = 'tracker-1';
  const scripted = commands([{ stdout: JSON.stringify([{ id: 'tracker-1', external_ref: payload.incident.export.externalRef }]) },
    { outcome: { kind: 'completed', exitCode: 1 } }]);
  expect(await exportRepairIncident(payload, configuration, scripted.runner)).toMatchObject({ state: 'pending', issueId: 'tracker-1', reason: expect.stringContaining('update failed') });
  expect(scripted.requests[1]!.argv).toContain('update');
  expect(scripted.requests[1]!.argv).not.toContain('--status');
});

test('reconciles timeout and thrown create responses instead of creating twice', async () => {
  const { configuration, payload } = await context();
  for (const failure of [{ outcome: { kind: 'timed-out' as const, timeoutMs: 15000 } }, new Error('lost process result')]) {
    const scripted = commands([{ stdout: '[]' }, failure,
      { stdout: JSON.stringify([{ id: 'tracker-created', external_ref: payload.incident.export.externalRef }]) }]);
    expect(await exportRepairIncident(payload, configuration, scripted.runner)).toMatchObject({ state: 'exported', issueId: 'tracker-created' });
    expect(scripted.requests.filter(request => request.argv.includes('create'))).toHaveLength(1);
  }
});

test('uncertain absent create remains pending and next attempt starts with an identity query', async () => {
  const { configuration, payload } = await context();
  const first = commands([{ stdout: '[]' }, { stdout: 'not JSON' }, { stdout: '[]' }]);
  payload.incident.export = await exportRepairIncident(payload, configuration, first.runner);
  expect(payload.incident.export.state).toBe('pending');
  const second = commands([{ stdout: JSON.stringify([{ id: 'late-result', external_ref: payload.incident.export.externalRef }]) }]);
  expect(await exportRepairIncident(payload, configuration, second.runner)).toMatchObject({ state: 'exported', issueId: 'late-result' });
});

test('conflicting identity and failed queries never create an issue', async () => {
  const { configuration, payload } = await context();
  const external_ref = payload.incident.export.externalRef;
  for (const answer of [{ stdout: JSON.stringify([{ id: 'a', external_ref }, { id: 'b', external_ref }]) },
    { outcome: { kind: 'runner-error' as const, error: { kind: 'ENOENT', message: 'bd absent' } } }, { stdout: 'malformed' }]) {
    const scripted = commands([answer]);
    const result = await exportRepairIncident(payload, configuration, scripted.runner);
    expect(result.state).toBe(answer.stdout?.startsWith('[') ? 'conflict' : 'pending');
    expect(scripted.requests[0]!.argv).not.toContain('create');
  }
});

test('multiple exact matches after uncertain create stay conflicted', async () => {
  const { configuration, payload } = await context();
  const external_ref = payload.incident.export.externalRef;
  const scripted = commands([{ stdout: '[]' }, { outcome: { kind: 'completed', exitCode: 1 } },
    { stdout: JSON.stringify([{ id: 'tracker-1', external_ref }, { id: 'tracker-2', external_ref }]) }]);
  expect(await exportRepairIncident(payload, configuration, scripted.runner)).toMatchObject({ state: 'conflict', issueId: null });
});

test('missing or conflicting durable issue identities never create replacements or update others', async () => {
  const { configuration, payload } = await context();
  payload.incident.export.issueId = 'tracker-original';
  const absent = commands([{ stdout: '[]' }]);
  expect(await exportRepairIncident(payload, configuration, absent.runner)).toMatchObject({ state: 'pending', issueId: 'tracker-original' });
  const other = commands([{ stdout: JSON.stringify([{ id: 'tracker-other', external_ref: payload.incident.export.externalRef }]) }]);
  expect(await exportRepairIncident(payload, configuration, other.runner)).toMatchObject({ state: 'conflict', issueId: 'tracker-original' });
});

test('truncated identity evidence cannot authorize issue creation', async () => {
  const { configuration, payload } = await context();
  const scripted = commands([{ stdout: '[]', truncated: true }]);
  expect(await exportRepairIncident(payload, configuration, scripted.runner)).toMatchObject({ state: 'pending', reason: expect.stringContaining('exceeded its bound') });
});

test('absent or invalid explicit configuration preserves pending export without launching commands', async () => {
  const { configuration, payload } = await context();
  const scripted = commands([]);
  for (const config of [undefined, { ...configuration, executable: 'bd' }, { ...configuration, workspace: '/absent/export/workspace' }]) {
    expect(await exportRepairIncident(payload, config, scripted.runner)).toMatchObject({ state: 'pending', issueId: null });
  }
  await rm(join(configuration.workspace, '.beads'), { recursive: true });
  expect(await exportRepairIncident(payload, configuration, scripted.runner)).toMatchObject({ state: 'pending', reason: expect.stringContaining('does not initialize') });
});

test('concurrent requests serialize queries and discover the first create', async () => {
  const { configuration, payload } = await context();
  const issue = { id: 'tracker-1', external_ref: payload.incident.export.externalRef };
  const scripted = commands([{ stdout: '[]' }, { stdout: JSON.stringify(issue) }, { stdout: JSON.stringify([issue]) }]);
  const results = await Promise.all([exportRepairIncident(payload, configuration, scripted.runner), exportRepairIncident(payload, configuration, scripted.runner)]);
  expect(results.map(result => result.issueId)).toEqual(['tracker-1', 'tracker-1']);
  expect(scripted.requests.map(request => request.argv[4])).toEqual(['list', 'create', 'list']);
});
