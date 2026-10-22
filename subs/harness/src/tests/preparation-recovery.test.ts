import { afterEach, expect, test, vi } from 'vitest';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createScriptedAgent, type Script } from '../../subs/agent/src/scripted.js';
import type { SessionSpec } from '../../subs/agent/src/interfaces/port.js';
import * as workSteps from '../../subs/task-workflow/src/steps/local-architect.js';
import * as projectFacts from '../../subs/autonomous/subs/work-coordination/src/project-facts.js';
import { OwnershipAuthorityError } from '../work/ownership-authority.js';
import { runLayout } from '../../subs/autonomous/src/run/records.js';
import { repairIncidentRecordSchema } from '../interfaces/protocol/repairs.js';
import { analysis, currentAnalysis, entry, requestCompletion } from './helpers/analysis.js';
import { assign, outline, partialReport, submit, treeInputs, write } from './helpers/iterations.js';
import { copyFixture } from './helpers/fixture.js';
import { gateGit, gateScenariosCommitFixture as scenariosCommit } from '../../subs/autonomous/subs/acceptance/src/tests/helpers/gate-git.js';
import { scriptedCandidates } from '../../subs/autonomous/subs/acceptance/src/tests/helpers/candidates.js';
import { declaringScenarios } from './helpers/declarations.js';
import { installTestRunner, openRuns, runPath, startRun, stopRun, testPolicy, until } from './helpers/runs.js';
import { expectNoProcesses, forgetExternalTools } from './helpers/external-tools.js';

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  vi.restoreAllMocks();
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
  try { expectNoProcesses(); } finally { forgetExternalTools(); }
});
const owner = 'collection-review/workspace/reviews';
const plan = 'review-notes';
const tree = 'a'.repeat(40);

/** The source assembler cannot read a required external service; all Git answers
 * and candidate identities are stated independently, with no native commands. */
async function scenario(boundary: 'ordinary' | 'missing' | 'spent' | 'blocked' | 'unverified' | 'unsafe' | 'semantic', driftAtDispatch = false, rootRepairDelta = false, mutateRetainedRepair = false) {
  const copy = await copyFixture(); cleanups.push(copy.remove);
  await installTestRunner(copy.root);
  let unavailable = boundary === 'ordinary' || boundary === 'semantic', localTurns = 0, preparationCalls = 0;
  const construct = workSteps.constructWorkTurnStep;
  if (boundary === 'ordinary' || boundary === 'semantic') vi.spyOn(workSteps, 'constructWorkTurnStep').mockImplementation((...args) => {
    if (unavailable) { preparationCalls++; if (boundary === 'semantic') throw new OwnershipAuthorityError('Original ownership authority is corrupt'); throw new Error('Source assembler cannot read the required service'); }
    return construct(...args);
  });
  const actualFacts = projectFacts.knownProjectFactsOf;
  vi.spyOn(projectFacts, 'knownProjectFactsOf').mockImplementation(async (...args) => {
    if (boundary !== 'ordinary' && boundary !== 'semantic' && unavailable && args[2].includes(owner)) { preparationCalls++; throw new Error('Source assembler cannot read the required service'); }
    return actualFacts(...args);
  });
  const excluded = boundary === 'blocked' || boundary === 'unverified' || boundary === 'unsafe' || boundary === 'semantic' || mutateRetainedRepair;
  let engineerTurns = 0;
  let unsafeCandidate = false, dispatchDrift = false, rootRepairWritten = false, rootRepairModified = false;
  const rootPath = 'src/repair-pointer.txt', rootContent = 'Restored preparation service lookup\n';
  const rootChanged = () => rootRepairWritten && gitBoundary.head() === 'scenarios';
  const gitBoundary = gateGit(copy.root, { head: 'base', commits: [scenariosCommit(plan, 'scenarios', 'base'),
    ...excluded ? [] : [{ commit: rootRepairDelta ? 'accepted-root' : null, changes: rootRepairDelta ? [{ status: 'A', path: rootPath }] : [], subject: 'work-item:review-note' }, { commit: null, changes: [], subject: 'final verification' }]],
  });
  // Exact identity reads are explicitly repeatable while the run is quiescent.
  const git = { ...gitBoundary.git, changedEntries: async (root: string, base?: string) => rootRepairDelta ? rootChanged() ? [{ status: 'A', path: rootPath }] : [] : gitBoundary.git.changedEntries(root, base), changedPaths: async (root: string, base?: string) => unsafeCandidate ? ['src/assembly.ts'] : rootRepairDelta ? rootChanged() ? [rootPath] : [] : gitBoundary.git.changedPaths(root, base), previewCandidateTree: async () => ({ repositoryRoot: copy.root, head: gitBoundary.head(), tree: rootRepairModified ? 'd'.repeat(40) : dispatchDrift || rootRepairWritten ? 'b'.repeat(40) : tree }),
    recoveryStatus: async () => ({ index: 'original-index', staged: [], unstaged: [], untracked: rootChanged() ? [rootPath] : [] }) };
  const statedCandidates = scriptedCandidates(copy.root, { base: { tree, base: 'base', files: {}, changes: [] },
    scenarios: { tree, base: 'scenarios', files: {}, changes: [] }, ['b'.repeat(40)]: { tree: 'b'.repeat(40), base: rootRepairDelta ? 'accepted-root' : 'scenarios', files: rootRepairDelta ? { [rootPath]: rootContent } : {}, changes: [], comparisons: { base: { changes: rootRepairDelta ? [{ status: 'A', path: rootPath }] : [] } } },
    ['d'.repeat(40)]: { tree: 'd'.repeat(40), base: 'scenarios', files: { [rootPath]: 'Unauthorized later repair edit\n' }, changes: [{ status: 'A', path: rootPath }] },
    'accepted-root': { tree: 'b'.repeat(40), base: 'accepted-root', files: { [rootPath]: rootContent }, changes: [] }, [tree]: { tree, base: 'scenarios', files: {}, changes: [], comparisons: { base: { changes: [] } } } });
  const candidates = { ...statedCandidates, treeEntries: async (root: string, commit: string) => (await statedCandidates.treeEntries(root, commit)).map(entry => ({ ...entry, objectId: 'c'.repeat(40) })) };
  const delegated = boundary !== 'ordinary' && boundary !== 'missing' && boundary !== 'unsafe' && boundary !== 'semantic';
  const initial = { ...analysis([entry('review-note', owner)]), ...delegated ? {
    contingentRepairAssignment: { root: 'collection-review', included: [{ directory: 'subs/workspace', reason: 'Restore pure preparation service access', instructions: 'Preserve interfaces and topology' }], instructions: 'Restore preparation only; the responsible architect assesses unfinished work' },
  } : {} };
  const specs: SessionSpec[] = [];
  const script: Script = spec => {
    specs.push(spec);
    if (spec.role === 'initial-architect') return submit(currentAnalysis(initial, 'document:review-notes-plan'));
    if (spec.submission.name === 'submit_automatic_repair') {
      if (boundary !== 'blocked' && boundary !== 'unverified') unavailable = false;
      return submit({ outcome: boundary === 'blocked' ? 'blocked' : 'ready', summary: 'Preparation service repair report', checks: [],
        remainingWork: ['Original implementation remains partial'], suspectedCause: 'Preparation service unavailable', evidence: [] }, ...(rootRepairDelta ? [{ kind: 'await' as const, until: async () => { rootRepairWritten = true; } }, write(rootPath, rootContent)] : []));
    }
    if (spec.role === 'engineer') {
      engineerTurns++;
      return submit(partialReport(['Inspected the implementation'], ['Architect must assess remaining work']),
        ...(mutateRetainedRepair && engineerTurns === 2 ? [{ kind: 'await' as const, until: async () => { await writeFile(join(copy.root, rootPath), 'Unauthorized later repair edit\n'); rootRepairModified = true; } }] : []));
    }
    if (spec.role === 'local-architect') {
      localTurns++;
      return submit(localTurns === 1 || boundary === 'spent' && localTurns === 2 ? assign(owner, {}, outline()) : requestCompletion());
    }
    return [];
  };
  const agent = createScriptedAgent(declaringScenarios(script));
  const options = { git, candidates, agent, inputs: treeInputs(), policy: (root: string) => testPolicy(root, { recovery: true }),
    // Runtime identity is a stated external observation in these preparation cases.
    recoveryRuntime: async () => ({ harness: 'scripted-harness/1', provider: 'scripted-provider/1', contracts: {
      policy: 'operation-recovery/1', records: 'records/1', submissions: 'submissions/1', equipment: 'equipment/1', authority: 'authority/1' } }),
    afterWrite: async (event: string) => {
      if (event === 'repair-preparation-consumed' && driftAtDispatch) dispatchDrift = true;
      if (event === 'iteration-closed' && boundary === 'unsafe') unsafeCandidate = true;
      if (event === 'repair-preparation-recorded' && boundary !== 'ordinary') unavailable = true;
    } };
  const opened = await openRuns(copy.root, options); cleanups.push(() => opened.service.close());
  const receipt = await opened.service.execute(startRun(plan));
  await until(() => opened.service.events(plan, receipt.jobId)!.some(event => event.type === 'job-failed' || event.type === (excluded ? 'job-failed' : 'operation-recovery-paused')));
  if (!excluded) {
    expect(opened.service.getRun(plan, receipt.jobId)?.state, JSON.stringify(opened.service.getRun(plan, receipt.jobId)?.failure)).not.toBe('failed');
  }
  return { ...opened, root: copy.root, runId: receipt.jobId, gitBoundary, options, specs, agent,
    restore: () => { unavailable = false; }, preparationCalls: () => preparationCalls };
}

async function resume(subject: Awaited<ReturnType<typeof scenario>>, declared = true) {
  const inspection = (await subject.service.recoveryInspection(plan, subject.runId))!;
  return subject.service.execute({ commandId: declared ? `restore-${inspection.occurrenceId}` : 'undeclared', expectedVersion: 0, type: 'resume-recovery', payload: {
    planId: plan, jobId: subject.runId,
  } });
}

async function incidents(subject: Awaited<ReturnType<typeof scenario>>) {
  const events = subject.service.events(plan, subject.runId)!;
  const latest = events.filter(event => event.type === 'repair-incident-recorded').at(-1)!;
  const incident = repairIncidentRecordSchema.parse(JSON.parse(await readFile(runPath(subject.root, plan, subject.runId,
    runLayout.repairIncident(latest.data.incidentId, latest.data.revision)), 'utf8')));
  return { latest, incident };
}

test('ordinary local architect preparation remains pending and continues after its prerequisite is restored', async () => {
  const subject = await scenario('ordinary');
  const inspection = (await subject.service.recoveryInspection(plan, subject.runId))!;
  expect(inspection).toMatchObject({ boundary: { kind: 'preparation', role: 'local-architect', work: { workItem: 'work-item:review-note' } }, evidence: { classification: 'preparation' }, automaticAttempts: 0, attempts: [], canResume: true });
  expect(subject.preparationCalls()).toBe(1);
  expect(subject.service.events(plan, subject.runId)!.some(event => event.type === 'repair-incident-recorded')).toBe(false);
  expect(subject.specs.filter(spec => spec.role === 'engineer')).toHaveLength(0);
  subject.restore(); await resume(subject, false);
  await subject.service.settled(plan, subject.runId);
  expect(subject.service.getRun(plan, subject.runId)?.state).toBe('completed');
  expect(subject.specs.filter(spec => spec.role === 'engineer')).toHaveLength(1);
  expect(subject.specs.filter(spec => spec.submission.name === 'submit_automatic_repair')).toHaveLength(0);
  subject.gitBoundary.assertComplete();
});

test.each(['missing', 'spent'] as const)('eligible %s root repair refusal pauses the original preparation and preserves refusal after external correction', async boundary => {
  const subject = await scenario(boundary);
  const before = await incidents(subject);
  expect(before.latest.data.stage).toBe('refused');
  expect(before.incident.admission.reason).toContain(boundary === 'missing' ? 'No matching architect-recorded' : 'one automatic repair invocation');
  expect(before.incident.invocation).toBeNull();
  const engineerCount = subject.specs.filter(spec => spec.role === 'engineer').length;
  expect(subject.specs.filter(spec => spec.submission.name === 'submit_automatic_repair')).toHaveLength(boundary === 'missing' ? 0 : 1);
  expect((await subject.service.recoveryInspection(plan, subject.runId))!.evidence.classification).toBe('preparation');
  subject.restore(); await resume(subject);
  await subject.service.settled(plan, subject.runId);
  expect(subject.service.getRun(plan, subject.runId)?.state, JSON.stringify(subject.service.getRun(plan, subject.runId)?.failure)).toBe('completed');
  expect(subject.specs.filter(spec => spec.role === 'engineer')).toHaveLength(engineerCount);
  expect(await incidents(subject)).toEqual(before);
  const events = subject.service.events(plan, subject.runId)!;
  expect(events.filter(event => event.type === 'iteration-closed').map(event => event.data.outcome)).toEqual(boundary === 'missing' ? ['partial'] : ['partial', 'partial']);
  expect(events.filter(event => event.type === 'repair-assignment-recorded')).toHaveLength(boundary === 'missing' ? 0 : 1);
  subject.gitBoundary.assertComplete();
}, 20_000);

test.each(['blocked', 'unverified'] as const)('%s root repair remains terminal even under ordinary preparation recovery policy', async boundary => {
  const subject = await scenario(boundary);
  const { latest } = await incidents(subject);
  expect(latest.data.stage).toBe(boundary);
  expect(subject.service.getRun(plan, subject.runId)?.state).toBe('failed');
  expect(await subject.service.recoveryInspection(plan, subject.runId)).toBeNull();
  expect(subject.service.events(plan, subject.runId)!.some(event => event.type === 'operation-recovery-paused')).toBe(false);
  subject.gitBoundary.assertComplete();
});

test('a repeated ordinary preparation failure waits again without transport retries or a new engineer', async () => {
  const subject = await scenario('missing');
  const first = (await subject.service.recoveryInspection(plan, subject.runId))!;
  await resume(subject);
  await until(() => subject.service.events(plan, subject.runId)!.filter(event => event.type === 'operation-recovery-paused').length === 2);
  const second = (await subject.service.recoveryInspection(plan, subject.runId))!;
  expect(second.occurrenceId).not.toBe(first.occurrenceId); expect(second.automaticAttempts).toBe(0);
  expect(subject.specs.filter(spec => spec.role === 'engineer')).toHaveLength(1);
  expect(subject.service.events(plan, subject.runId)!.filter(event => event.type === 'repair-incident-recorded')).toHaveLength(1);
  await subject.service.execute(stopRun(plan, subject.runId, subject.service.getRun(plan, subject.runId)!.version));
  await subject.service.settled(plan, subject.runId);
  expect(subject.gitBoundary.git.unexpected).toEqual([]);
});

test.each(['ordinary', 'missing', 'spent'] as const)('restart at %s preparation preserves the paused boundary and retries preparation without replaying accepted work', async boundary => {
  const subject = await scenario(boundary);
  const originalEngineers = subject.specs.filter(spec => spec.role === 'engineer').length;
  await subject.service.close();
  subject.restore();
  const reopened = await openRuns(subject.root, subject.options);
  cleanups.push(() => reopened.service.close());
  await reopened.service.settled(plan, subject.runId);
  const run = reopened.service.getRun(plan, subject.runId)!;
  expect(run.state, JSON.stringify(run.failure)).toBe('completed');
  expect(subject.specs.filter(spec => spec.role === 'engineer')).toHaveLength(originalEngineers + (boundary === 'ordinary' ? 1 : 0));
  expect(subject.specs.filter(spec => spec.submission.name === 'submit_automatic_repair')).toHaveLength(boundary === 'spent' ? 1 : 0);
  const events = reopened.service.events(plan, subject.runId)!;
  expect(events.filter(event => event.type === 'repair-incident-recorded' && event.data.stage === 'refused')).toHaveLength(boundary === 'ordinary' ? 0 : 1);
  subject.gitBoundary.assertComplete();
}, 20_000);


test.each(['unsafe', 'semantic'] as const)('%s original authority remains terminal and cannot use missing root assignment recovery', async boundary => {
  const subject = await scenario(boundary);
  expect(subject.service.getRun(plan, subject.runId)?.state).toBe('failed');
  expect(await subject.service.recoveryInspection(plan, subject.runId)).toBeNull();
  expect(subject.specs.filter(spec => spec.submission.name === 'submit_automatic_repair')).toHaveLength(0);
  const events = subject.service.events(plan, subject.runId)!;
  expect(events.some(event => event.type === 'operation-recovery-paused')).toBe(false);
  if (boundary === 'unsafe') {
    const { incident, latest } = await incidents(subject);
    expect(latest.data.stage).toBe('refused');
    expect(incident.admission.reason).toContain('outside its original assignment');
  } else expect(events.some(event => event.type === 'repair-incident-recorded')).toBe(false);
  subject.gitBoundary.assertComplete();
});


test('current candidate changes reach ordinary verification without another declaration and stale audit evidence cannot pass', async () => {
  const subject = await scenario('missing', true);
  subject.restore();
  await resume(subject, false);
  await subject.service.settled(plan, subject.runId);
  expect(subject.service.events(plan, subject.runId)!.filter(event => event.type === 'operation-recovery-paused')).toHaveLength(1);
  expect(subject.service.getRun(plan, subject.runId)?.failure?.message).toContain('not assessed tree');
  expect(subject.specs.filter(spec => spec.role === 'engineer')).toHaveLength(1);
  subject.gitBoundary.assertComplete();
});

test('a successful unconsumed root repair delta remains retained authority at spent preparation refusal', async () => {
  const subject = await scenario('spent', false, true);
  const before = await incidents(subject);
  expect(before.latest.data.stage).toBe('refused');
  expect(before.incident.admission.reason).toContain('one automatic repair invocation');
  expect((await subject.service.recoveryInspection(plan, subject.runId))!.retained.partialPaths).toEqual(['src/repair-pointer.txt']);
  expect(subject.service.events(plan, subject.runId)!.some(event => event.type === 'gate-attempted' && event.data.verdict === 'passed' && event.data.checkpoint !== 'readiness')).toBe(false);
  subject.restore(); await resume(subject);
  await subject.service.settled(plan, subject.runId);
  expect(subject.service.getRun(plan, subject.runId)?.state, JSON.stringify(subject.service.getRun(plan, subject.runId)?.failure)).toBe('completed');
  expect(subject.specs.filter(spec => spec.submission.name === 'submit_automatic_repair')).toHaveLength(1);
  expect(await incidents(subject)).toEqual(before);
  subject.gitBoundary.assertComplete();
}, 20_000);


test('a later edit to an unconsumed root repair delta cannot use spent repair refusal recovery', async () => {
  const subject = await scenario('spent', false, true, true);
  const { latest, incident } = await incidents(subject);
  expect(latest.data.stage).toBe('refused');
  expect(incident.admission.reason).toContain('unavailable or refused assignment provenance');
  expect(subject.service.getRun(plan, subject.runId)?.state).toBe('failed');
  expect(await subject.service.recoveryInspection(plan, subject.runId)).toBeNull();
  expect(subject.specs.filter(spec => spec.submission.name === 'submit_automatic_repair')).toHaveLength(1);
  expect(await readFile(join(subject.root, 'src/repair-pointer.txt'), 'utf8')).toBe('Unauthorized later repair edit\n');
  subject.gitBoundary.assertComplete();
});
