import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';
import { RunLog } from '../../../../src/run/log.js';
import { verifiedRepairDeltas } from '../../../acceptance/src/repair-gate.js';
import { runLayout } from '../../../../src/run/records.js';
import { localArchitectToolName } from '../work/submission.js';
import { iterationLayout } from '../work/iterations.js';
import { repairDeltaSchema } from '../repair/repair-preparation.js';
import { cleanups, scenario, incidents, legacy, renamed, content } from './helpers/automatic-project-repair.js';
import { onlyRun, openRuns, runEventsOnDisk, runPath, staleCrashLock, until } from '../../../../../../src/tests/helpers/runs.js';
import { treeInputs } from '../../../../../../src/tests/helpers/iterations.js';
import { expectNoProcesses, forgetExternalTools } from '../../../../../../src/tests/helpers/external-tools.js';

afterEach(async () => {
  vi.restoreAllMocks();
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
  try { expectNoProcesses(); } finally { forgetExternalTools(); }
});
test('recorded source-pointer preparation fault repairs once and returns original partial to a fresh architect', async () => {
  const subject = await scenario();
  const diagnostic = await incidents(subject);
  const childOutcome = diagnostic.incident.invocation === null ? null : JSON.parse(await readFile(runPath(subject.root, 'review-notes', subject.runId, runLayout.outcome(diagnostic.incident.invocation)), 'utf8'));
  expect(onlyRun(subject.service, 'review-notes').state, JSON.stringify({ failure: onlyRun(subject.service, 'review-notes').failure, childOutcome, warnings: subject.warnings })).toBe('completed');
  const { events, incident, latest } = await incidents(subject);
  expect(latest.data.stage).toBe('continued');
  expect(incident.harnessError.message).toContain('ENOENT');
  expect(incident.verification?.verified).toBe(true);
  expect(incident.continuation?.delivered).toBe(true);
  expect(incident.export.state).toBe('pending');
  expect(events.filter(event => event.type === 'invocation-started' && event.data.work.automaticRepair)).toHaveLength(1);
  expect(events.find(event => event.type === 'repair-preparation-recorded')!.sequence).toBeLessThan(events.find(event => event.type === 'repair-incident-recorded')!.sequence);
  const partial = JSON.parse(await readFile(runPath(subject.root, 'review-notes', subject.runId, iterationLayout.result('wi-001', 1)), 'utf8'));
  expect(partial.outcome).toBe('partial');
  const architects = subject.specs.filter(spec => spec.role === 'local-architect');
  expect(architects.at(-1)!.session.mode).toBe('fresh');
  expect(architects.at(-1)!.prompt).toContain('remains partial');
  expect(await readFile(join(subject.root, legacy), 'utf8')).toBe(content);
  const delta = repairDeltaSchema.parse(JSON.parse(await readFile(runPath(subject.root, 'review-notes', subject.runId, runLayout.repairDelta(incident.incidentId)), 'utf8')));
  expect(delta.changes.map(change => change.path)).toEqual([legacy]);
  expect(delta.beforeDirtyPaths).toEqual([legacy, renamed]);
  subject.boundary.assertComplete();
});

test('no contingent assignment refuses', async () => {
  const subject = await scenario({ delegated: false });
  const { latest, incident } = await incidents(subject);
  expect(latest.data.stage).toBe('refused');
  expect(incident.admission.reason).toContain('No matching architect-recorded');
  expect(subject.specs.some(spec => spec.submission.name === 'submit_automatic_repair')).toBe(false);
  expect(await readFile(join(subject.root, renamed), 'utf8')).toBe(content);
  subject.boundary.assertComplete();
});

test('blocked repair preserves both failure accounts', async () => {
  const subject = await scenario({ blocked: true });
  const { latest, incident } = await incidents(subject);
  expect(latest.data.stage).toBe('blocked');
  expect(incident.harnessError.message).toContain('ENOENT');
  expect(incident.result?.outcome).toBe('blocked');
  expect(onlyRun(subject.service, 'review-notes').failure?.message).toContain('Original architect obstruction');
  subject.boundary.assertComplete();
});

test('repair topology mutation is unverified', async () => {
  const subject = await scenario({ mutateDeclaration: true });
  const { latest, incident } = await incidents(subject);
  expect(latest.data.stage).toBe('unverified');
  expect(incident.verification?.verified).toBe(false);
  expect(incident.verification?.reason).toMatch(/outside-scope|Protected configuration/u);
  subject.boundary.assertComplete();
});

test('ordinary partial correction does not invoke automatic repair', async () => {
  const subject = await scenario({ noFault: true });
  const events = await runEventsOnDisk(subject.root, 'review-notes', subject.runId);
  expect(onlyRun(subject.service, 'review-notes').state, JSON.stringify(onlyRun(subject.service, 'review-notes').failure)).toBe('completed');
  expect(events.filter(event => event.type === 'repair-incident-recorded')).toHaveLength(0);
  expect(subject.specs.some(spec => spec.submission.name === 'submit_automatic_repair')).toBe(false);
  subject.boundary.assertComplete();
});

test('ready judgment cannot hand back while the named preparation still throws', async () => {
  const subject = await scenario({ skipRestore: true });
  const { latest, incident } = await incidents(subject);
  expect(latest.data.stage).toBe('unverified');
  expect(incident.result?.outcome).toBe('ready');
  expect(incident.verification?.verified).toBe(false);
  expect(incident.verification?.reason).toContain('ENOENT');
  expect(incident.continuation?.delivered).toBe(false);
  subject.boundary.assertComplete();
});

test('root repair delta stays separately authorized at the subsequent ordinary gate', async () => {
  const subject = await scenario({ rootSibling: true });
  expect(onlyRun(subject.service, 'review-notes').state, JSON.stringify(onlyRun(subject.service, 'review-notes').failure)).toBe('completed');
  const log = await RunLog.open(runPath(subject.root, 'review-notes', subject.runId, runLayout.events), subject.runId);
  const verified = verifiedRepairDeltas(log.ledger.replay());
  expect(verified).toHaveLength(1);
  expect(verified[0]!.assignment.id).toBe('root-repair');
  expect(verified[0]!.delta.changes.map(change => change.path)).toEqual(['src/repair-pointer.txt']);
  expect(verified[0]!.delta.originalAssignment).toBe('wi-001.i01');
  expect(await readFile(join(subject.root, 'src/repair-pointer.txt'), 'utf8')).toBe(renamed);
  subject.boundary.assertComplete();
});

test('second supported preparation fault refuses after one repair invocation', async () => {
  const subject = await scenario({ secondFault: true });
  // The real workflow keeps durable run records; only session persistence is adapted.
  await expect(readdir(join(subject.root, 'plans', '.harness', 'session-operations', 'store'))).rejects.toMatchObject({ code: 'ENOENT' });
  const { events, latest, incident } = await incidents(subject);
  expect(latest.data.stage).toBe('refused');
  expect(incident.admission.reason).toContain('one automatic repair invocation');
  expect(events.filter(event => event.type === 'invocation-started' && event.data.work.automaticRepair)).toHaveLength(1);
  expect(events.filter(event => event.type === 'iteration-closed').map(event => event.data.outcome)).toEqual(['partial', 'partial']);
  subject.boundary.assertComplete();
});

test('stop during repair settles the incident and never resumes the architect', async () => {
  const subject = await scenario({ stopDuringRepair: true });
  await until(() => onlyRun(subject.service, 'review-notes').state === 'stopped');
  const { events, latest } = await incidents(subject);
  expect(onlyRun(subject.service, 'review-notes').state).toBe('stopped');
  expect(['blocked', 'interrupted']).toContain(latest.data.stage);
  expect(events.filter(event => event.type === 'repair-incident-recorded' && event.data.stage === 'continued')).toHaveLength(0);
  expect(subject.specs.filter(spec => spec.submission.name === localArchitectToolName)).toHaveLength(1);
  subject.boundary.assertComplete();
});

test('restart after contingent assignment capture retains one assignment and starts no writer', async () => {
  const subject = await scenario({ freezeAssignment: true });
  await staleCrashLock(subject.root);
  const reopened = await openRuns(subject.root, { git: subject.git, inputs: treeInputs(), script: [] });
  cleanups.push(() => reopened.service.close());
  const events = await runEventsOnDisk(subject.root, 'review-notes', subject.runId);
  expect(events.filter(event => event.type === 'repair-assignment-recorded')).toHaveLength(1);
  expect(events.filter(event => event.type === 'writer-acquired')).toHaveLength(0);
  expect(reopened.agent!.sessions).toHaveLength(0);
  subject.boundary.assertComplete();
});


test('resource fallback continues the same authorized automatic repair after historical run age and invocation bounds', async () => {
  const subject = await scenario({ resourceRepair: true });
  expect(onlyRun(subject.service, 'review-notes').state, JSON.stringify(onlyRun(subject.service, 'review-notes').failure)).toBe('completed');
  const events = await runEventsOnDisk(subject.root, 'review-notes', subject.runId);
  const repairInvocations = events.filter(event => event.type === 'invocation-started' && event.data.work.automaticRepair);
  expect(repairInvocations).toHaveLength(2);
  expect(new Set(repairInvocations.map(event => event.type === 'invocation-started' ? event.data.work.automaticRepair : null)).size).toBe(1);
  expect(events.filter(event => event.type === 'invocation-ended' && event.data.ended === 'resource-pending')).toHaveLength(1);
  expect(events.filter(event => event.type === 'repair-incident-recorded' && event.data.stage === 'continued')).toHaveLength(1);
  const { incident } = await incidents(subject);
  const source = JSON.parse(await readFile(runPath(subject.root, 'review-notes', subject.runId, `repairs/sources/${incident.incidentId}.json`), 'utf8'));
  expect(source.schema).toBe('ramify-agent.automatic-repair-source/1');
  expect(source.before.length).toBeGreaterThan(0);
  subject.boundary.assertComplete();
});
