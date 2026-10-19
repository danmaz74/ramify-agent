import { readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { vi } from 'vitest';
import * as projectFacts from '../../project-facts.js';
import { runLayout } from '../../../../../src/run/records.js';
import { repairIncidentRecordSchema } from '../../../../../../../src/interfaces/protocol/repairs.js';
import type { SessionSpec } from '../../../../../../agent/src/interfaces/port.js';
import { analysis, entry, requestCompletion } from '../../../../../../../src/tests/helpers/analysis.js';
import { assign, outline, partialReport, submit, treeInputs, write } from '../../../../../../../src/tests/helpers/iterations.js';
import { copyFixture } from '../../../../../../../src/tests/helpers/fixture.js';
import { gateGit, gateScenariosCommitFixture as scenariosCommit } from '../../../../acceptance/src/tests/helpers/gate-git.js';
import { scriptedCandidates } from '../../../../acceptance/src/tests/helpers/candidates.js';
import { freeze, installTestRunner, onlyRun, openRuns, runEventsOnDisk, runPath, startRun, stopRun, testPolicy, until } from '../../../../../../../src/tests/helpers/runs.js';

export const cleanups: Array<() => Promise<void>> = [];
export const owner = 'collection-review/workspace/reviews';
const area = 'subs/workspace/subs/reviews/src';
export const legacy = `${area}/compatibility.ts`, renamed = `${area}/implementation.ts`;
export const content = 'export const usefulPartial = true;\n';
const tree = 'a'.repeat(40);

/** Scripted preparation dependency witness, not an observed provider/harness regression.
 * A retained source-pointer assembler reads the old entry after an allowed rename.
 * Real readFile throws ENOENT; the repaired target restores a compatible source entry.
 */
export async function scenario(options: { delegated?: boolean; blocked?: boolean; mutateDeclaration?: boolean; freezeStage?: 'admitted' | 'running'; noFault?: boolean; skipRestore?: boolean; secondFault?: boolean; stopDuringRepair?: boolean; rootSibling?: boolean; freezeAssignment?: boolean; resourceRepair?: boolean; downtimeEdit?: boolean } = {}) {
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

export async function incidents(subject: Awaited<ReturnType<typeof scenario>>) {
  const events = await runEventsOnDisk(subject.root, 'review-notes', subject.runId);
  const latest = events.filter(event => event.type === 'repair-incident-recorded').at(-1)!;
  const incident = repairIncidentRecordSchema.parse(JSON.parse(await readFile(runPath(subject.root, 'review-notes', subject.runId, runLayout.repairIncident(latest.data.incidentId, latest.data.revision)), 'utf8')));
  return { events, latest, incident };
}
