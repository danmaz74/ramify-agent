import { readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';
import * as projectFacts from '../run/project-facts.js';
import { RunLog } from '../run/log.js';
import { verifiedRepairDeltas } from '../run/repair-gate.js';
import { runLayout } from '../run/records.js';
import { localArchitectToolName } from '../work/submission.js';
import { iterationLayout } from '../work/iterations.js';
import { repairIncidentRecordSchema } from '../run/repair-records.js';
import { repairDeltaSchema } from '../run/repair-preparation.js';
import type { SessionSpec } from '../../subs/agent/src/interfaces/port.js';
import { analysis, entry, requestCompletion } from './helpers/analysis.js';
import { assign, outline, partialReport, submit, treeInputs, write } from './helpers/iterations.js';
import { copyFixture } from './helpers/fixture.js';
import { gateGit, scenariosCommit } from './helpers/gate-git.js';
import { scriptedCandidates } from './helpers/candidates.js';
import { freeze, installTestRunner, onlyRun, openRuns, runEventsOnDisk, runPath, staleCrashLock, startRun, stopRun, testPolicy, until } from './helpers/runs.js';
import { expectNoProcesses, forgetExternalTools } from './helpers/external-tools.js';

vi.unmock('../../subs/session-store/src/session-store.js');

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  vi.restoreAllMocks();
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
  try { expectNoProcesses(); } finally { forgetExternalTools(); }
});
const owner = 'collection-review/workspace/reviews';
const area = 'subs/workspace/subs/reviews/src';
const legacy = `${area}/compatibility.ts`, renamed = `${area}/implementation.ts`;
const content = 'export const usefulPartial = true;\n';
const tree = 'a'.repeat(40);

/** Scripted preparation dependency witness, not an observed provider/harness regression.
 * A retained source-pointer assembler reads the old entry after an allowed rename.
 * Real readFile throws ENOENT; the repaired target restores a compatible source entry.
 */
async function scenario(options: { delegated?: boolean; blocked?: boolean; mutateDeclaration?: boolean; freezeStage?: 'admitted' | 'running'; noFault?: boolean; skipRestore?: boolean; secondFault?: boolean; stopDuringRepair?: boolean; rootSibling?: boolean; freezeAssignment?: boolean; resourceRepair?: boolean; downtimeEdit?: boolean } = {}) {
  const fixture = await copyFixture(); cleanups.push(fixture.remove);
  await installTestRunner(fixture.root);
  await writeFile(join(fixture.root, legacy), content);
  const rootPointer = 'src/repair-pointer.txt';
  if (options.rootSibling) await writeFile(join(fixture.root, rootPointer), legacy);
  const afterDowntimeTree = options.downtimeEdit ? 'b'.repeat(40) : tree;
  const externalPath = `${area}/external-note.ts`;
  let downtimeChanged = false;
  let repairedRoot = false;
  let fault = false;
  const facts = projectFacts.knownProjectFactsOf;
  vi.spyOn(projectFacts, 'knownProjectFactsOf').mockImplementation(async (...args) => {
    if (fault && args[2].includes(owner)) {
      const pointer = options.rootSibling ? await readFile(join(fixture.root, rootPointer), 'utf8') : legacy;
      await readFile(join(fixture.root, pointer));
    }
    return facts(...args);
  });
  const final = !options.secondFault && !options.stopDuringRepair && !options.freezeAssignment && !options.blocked && !options.skipRestore && !options.mutateDeclaration && options.delegated !== false;
  const commits = [...(options.freezeAssignment ? [] : [scenariosCommit('review-notes', 'scenarios', 'base')]),
    ...(final ? [{ commit: 'accepted', changes: [{ status: 'A', path: renamed }, ...(options.rootSibling ? [{ status: 'D', path: legacy }, { status: 'M', path: rootPointer }] : []), ...(options.downtimeEdit ? [{ status: 'A', path: externalPath }] : [])], subject: 'wi-001' }, { commit: null, changes: [], subject: 'final verification' }] : [])];
  const previews = [
    ...(options.freezeAssignment || options.delegated === false ? [] : [{ repositoryRoot: fixture.root, head: 'scenarios', tree }]),
    ...(options.freezeAssignment || options.noFault ? [] : [{ repositoryRoot: fixture.root, head: 'scenarios', tree }]),
    ...((final && !options.noFault) || options.skipRestore || options.secondFault ? [{ repositoryRoot: fixture.root, head: 'scenarios', tree }] : []),
    ...(options.freezeStage ? Array.from({ length: 1 }, () => ({ repositoryRoot: fixture.root, head: 'scenarios', tree })) : []),
    ...(options.secondFault ? Array.from({ length: 2 }, () => ({ repositoryRoot: fixture.root, head: 'scenarios', tree })) : []),
    ...(final ? Array.from({ length: 4 }, () => ({ repositoryRoot: fixture.root, head: 'accepted', tree })) : []),
  ];
  const statedPreviews = options.downtimeEdit ? previews.map((answer, index) => index >= 2 ? { ...answer, tree: afterDowntimeTree } : answer) : previews;
  const boundary = gateGit(fixture.root, { head: 'base', commits, previews: statedPreviews,
    uncommitted: [{ status: 'D', path: legacy }, { status: 'A', path: renamed }] });
  let renamedByEngineer = false;
  const dirty = () => renamedByEngineer ? [{ status: 'D', path: legacy }, { status: 'A', path: renamed }, ...(repairedRoot ? [{ status: 'M', path: rootPointer }] : []), ...(downtimeChanged ? [{ status: 'A', path: externalPath }] : [])] : [];
  const git = { ...boundary.git,
    changedPaths: async (root: string, base?: string) => {
      if (boundary.head() === 'scenarios' && !final) return dirty().map(change => change.path);
      if (boundary.head() === 'scenarios' && final) return dirty().map(change => change.path);
      return boundary.git.changedPaths(root, base);
    },
  };
  const initial = { ...analysis([entry('review-note', owner)]), ...(options.delegated === false ? {} : {
    contingentRepairAssignment: { root: 'collection-review', included: [{ directory: 'subs/workspace', reason: 'Repair source-pointer compatibility after a preparation obstruction', instructions: 'Preserve interfaces and the existing topology.' }], instructions: 'Restore only preparation compatibility; unfinished work returns to the architect.' },
  }) };
  const specs: SessionSpec[] = [];
  let localTurns = 0;
  let returnedResource = false;
  let frozen = false;
  let activeService: Awaited<ReturnType<typeof openRuns>>['service'];
  let activeRunId = '';
  const script = (spec: SessionSpec) => {
    specs.push(spec);
    if (spec.role === 'initial-architect') return submit(initial);
    if (spec.submission.name === 'submit_automatic_repair' && options.resourceRepair && !returnedResource) {
      returnedResource = true;
      return [{ kind: 'resource' as const, resource: 'context' as const, reason: 'Native compaction unavailable before preparation repair can report' }];
    }
    if (spec.submission.name === 'submit_automatic_repair' && options.stopDuringRepair) return [{ kind: 'await' as const, until: async () => {
      void activeService.execute(stopRun('review-notes', activeRunId, onlyRun(activeService, 'review-notes').version));
    } }, { kind: 'wait' as const, ms: 1_000 }];
    if (spec.submission.name === 'submit_automatic_repair') return submit({ outcome: options.blocked ? 'blocked' : 'ready',
      summary: options.blocked ? 'Repair needs unavailable harness authority' : 'Restored compatible source entry', checks: [],
      remainingWork: ['The architect must assess unfinished implementation'], suspectedCause: 'Retained pointer was not refreshed after rename', evidence: [legacy, renamed] },
      ...(options.blocked || options.skipRestore ? [] : [write(options.rootSibling ? rootPointer : legacy, options.rootSibling ? renamed : content), ...(options.rootSibling ? [{ kind: 'await' as const, until: async () => { repairedRoot = true; } }] : [])]),
      ...(options.mutateDeclaration ? [{ kind: 'await' as const, until: async () => writeFile(join(fixture.root, 'module.ramify'), 'ramify 1\nroot module changed\n') }] : []));
    if (spec.role === 'engineer') return submit(partialReport(['Renamed implementation source'], ['Architect must decide remaining work']),
      { kind: 'await', until: async () => { await rename(join(fixture.root, legacy), join(fixture.root, renamed)); renamedByEngineer = true; } });
    if (spec.role === 'local-architect') {
      localTurns += 1;
      return submit(localTurns === 1 ? assign(owner, {}, outline()) : options.secondFault && localTurns === 2 ? assign(owner) : requestCompletion());
    }
    return [];
  };
  const candidateAnswers = () => scriptedCandidates(fixture.root, {
    accepted: { tree: afterDowntimeTree, base: 'accepted', files: {}, changes: [] },
    [tree]: { tree, base: 'accepted', files: {}, changes: [], comparisons: { scenarios: { changes: [{ status: 'D', path: legacy }, { status: 'A', path: renamed }] } } },
    ...(options.downtimeEdit ? { [afterDowntimeTree]: { tree: afterDowntimeTree, base: 'accepted',
      files: { [externalPath]: 'export const externalNote = true;\n' }, changes: [], comparisons: {
        scenarios: { changes: [{ status: 'D', path: legacy }, { status: 'A', path: renamed }, { status: 'A', path: externalPath }] },
        [tree]: { changes: [{ status: 'A', path: externalPath }] },
      } } } : {}),
  });
  const reopen = () => openRuns(fixture.root, { git, inputs: treeInputs(), script,
    candidates: final ? candidateAnswers() : undefined });
  const opened = await openRuns(fixture.root, { git, inputs: treeInputs(), script,
    ...(options.resourceRepair ? { policy: (root: string) => { const policy = testPolicy(root, { recovery: true, continuity: true }); return { ...policy,
      recovery: { ...policy.recovery!, baseDelayMs: 0 }, limits: { ...policy.limits, runAbsoluteMs: 1, maxInvocationsPerRun: 1 } }; } } : {}),
    candidates: final ? candidateAnswers() : undefined,
    afterWrite: async (write, runId) => {
      if (write === 'repair-assignment-recorded' && options.freezeAssignment) { frozen = true; await freeze(); }
      if (write === 'repair-preparation-recorded' && !options.noFault) fault = true;
      if (write === 'repair-incident-recorded' && options.freezeStage !== undefined) {
        const events = await runEventsOnDisk(fixture.root, 'review-notes', runId);
        if (events.filter(event => event.type === 'repair-incident-recorded').at(-1)?.data.stage === options.freezeStage) { frozen = true; await freeze(); }
      }
    },
  });
  activeService = opened.service;
  if (!options.freezeStage && !options.freezeAssignment) cleanups.push(() => opened.service.close());
  const receipt = await opened.service.execute(startRun('review-notes'));
  activeRunId = receipt.jobId;
  if (options.freezeStage || options.freezeAssignment) await until(() => frozen); else await opened.service.settled('review-notes', receipt.jobId);
  return { root: fixture.root, ...opened, runId: receipt.jobId, specs, boundary, git, reopen, externalPath, async addDowntimeSource() {
    await writeFile(join(fixture.root, externalPath), 'export const externalNote = true;\n'); downtimeChanged = true;
  } };
}

async function incidents(subject: Awaited<ReturnType<typeof scenario>>) {
  const events = await runEventsOnDisk(subject.root, 'review-notes', subject.runId);
  const latest = events.filter(event => event.type === 'repair-incident-recorded').at(-1)!;
  const incident = repairIncidentRecordSchema.parse(JSON.parse(await readFile(runPath(subject.root, 'review-notes', subject.runId, runLayout.repairIncident(latest.data.incidentId, latest.data.revision)), 'utf8')));
  return { events, latest, incident };
}

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

test.each([
  ['admitted', 'missing', false], ['admitted', 'corrupt', false], ['running', 'missing', false], ['running', 'corrupt', false], ['running', 'missing', true],
] as const)('restart during %s repair uses the durable assignment with %s optional context (downtime source %s)', async (stage, contextLoss, downtimeEdit) => {
  const subject = await scenario({ freezeStage: stage, downtimeEdit });
  if (downtimeEdit) await subject.addDowntimeSource();
  const payloads = join(subject.root, 'plans', '.harness', 'session-operations', 'store', 'payloads');
  for (const id of await readdir(payloads)) {
    if (contextLoss === 'missing') await rm(join(payloads, id));
    else await writeFile(join(payloads, id), 'corrupt optional provider context');
  }
  await staleCrashLock(subject.root);
  const reopened = await subject.reopen();
  cleanups.push(() => reopened.service.close());
  await reopened.service.settled('review-notes', subject.runId);
  expect(onlyRun(reopened.service, 'review-notes').state, JSON.stringify(onlyRun(reopened.service, 'review-notes').failure)).toBe('completed');
  const events = await runEventsOnDisk(subject.root, 'review-notes', subject.runId);
  expect(events.filter(event => event.type === 'repair-assignment-recorded')).toHaveLength(1);
  const repairs = events.filter(event => event.type === 'invocation-started' && event.data.work.automaticRepair);
  expect(repairs).toHaveLength(1);
  expect(await readFile(join(subject.root, legacy), 'utf8')).toBe(content);
  expect(await readFile(join(subject.root, renamed), 'utf8')).toBe(content);
  expect(events.filter(event => event.type === 'repair-incident-recorded').at(-1)?.data.stage).toBe('continued');
  if (downtimeEdit) {
    const original = JSON.parse(await readFile(runPath(subject.root, 'review-notes', subject.runId, 'repairs/sources/apr-0001.json'), 'utf8')) as { before: { path: string }[] };
    expect(original.before.some(file => file.path === subject.externalPath)).toBe(false);
    const delta = repairDeltaSchema.parse(JSON.parse(await readFile(runPath(subject.root, 'review-notes', subject.runId, runLayout.repairDelta('apr-0001')), 'utf8')));
    expect(delta.before.some(file => file.path === subject.externalPath)).toBe(true);
    expect(delta.changes.some(change => change.path === subject.externalPath)).toBe(false);
    expect(await readFile(join(subject.root, subject.externalPath), 'utf8')).toBe('export const externalNote = true;\n');
  }
  subject.boundary.assertComplete();
}, 60_000);

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
