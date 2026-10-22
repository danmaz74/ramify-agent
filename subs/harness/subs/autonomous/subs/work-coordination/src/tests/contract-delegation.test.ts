import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { analysis, currentAnalysis, entry, requestCompletion } from '../../../../../../src/tests/helpers/analysis.js';
import { scriptedCandidates } from '../../../acceptance/src/tests/helpers/candidates.js';
import { copyFixture } from '../../../../../../src/tests/helpers/fixture.js';
import { defaultTurn } from '../../../../../../src/tests/helpers/declarations.js';
import { localDecision, registryChange } from './helpers/placement.js';
import { addModule, assign, byRole, completionProposed, installMiniRunner, outline, submit, treeInputs, write } from '../../../../../../src/tests/helpers/iterations.js';
import { freeze, onlyRun, openRuns, runEventsOnDisk, runPath, staleCrashLock, startRun, stopRun, until } from '../../../../../../src/tests/helpers/runs.js';
import { accepted, added, answeredGit, modified, unchanged, type CommitResponse, scenariosCommitted } from './helpers/contracts-git.js';
import { consumerAgainstFake, consumerAgainstReal, consumerStub, consumerTest as seamConsumerTest,
  contractNeeded as seamContractNeeded, contractWrites as seamContractWrites, established as seamEstablished,
  paths as seamPaths, providerWrites, type Seam } from './helpers/contracts.js';
import { expectNoProcesses, forgetExternalTools } from '../../../../../../src/tests/helpers/external-tools.js';
import type { RunEvent } from '../../../../src/run/log.js';
import { contractsLayout, executionRetirementPath, type ConsumerRequirement, type ContractRecord,
  type ExecutionRetirement, type ProviderObligation } from '../contracts/records.js';
import { workLayout, type WorkItem } from '../work/records.js';
import { localArchitectJsonSchema } from '../work/submission.js';
import { iterationLayout, type IterationResult } from '../work/iterations.js';
import { runLayout } from '../../../../src/run/records.js';
import type { GateAttempt } from '../../../acceptance/src/checks/records.js';
import { passingAudit } from '../../../../../../src/tests/helpers/direct-check-execution.js';

vi.mock('node:child_process', async original =>
  (await import('../../../../../../src/tests/helpers/process-guard.js')).guardedChildProcess(await original<typeof import('node:child_process')>()));

/*
 * One delegation, end to end on the review-notes fixture: a consumer that
 * needs behavior outside its scope, a contract sub-session that establishes
 * the agreement, one provider obligation, one provider work item, and a
 * verification that closes the requirement against the real provider.
 *
 * Nothing here simulates a transition. Every submission goes through the
 * same judge an agent's would, and every file is written through the port's
 * own built-ins behind the write guard. Git is external and answered from
 * this file's own data, as are the gate's commands. The real selected-command
 * witness lives in `contract-delegation-integration.test.ts`.
 */

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  try {
    for (const cleanup of cleanups.splice(0)) await cleanup();
    expectNoProcesses();
  } finally { forgetExternalTools(); }
});

const consumer = 'collection-review/workspace/reviews/notes';
const consumerDirectory = 'subs/workspace/subs/reviews/subs/notes';
const provider = 'collection-review/workspace/reviews/limits';
const providerDirectory = 'subs/workspace/subs/reviews/subs/limits';

const stub = [
  'export function addNote(note) {',
  '  throw new Error(\'the note limit is not available here yet\');',
  '}',
  '',
].join('\n');

const consumerTest = [
  "import { test, expect } from 'vitest';",
  "import { addNote } from '../notes.ts';",
  '',
  "test('a note within the limit is kept', () => {",
  "  expect(addNote('a short note')).toBe('a short note');",
  '});',
  '',
  "test('a note over the limit is refused', () => {",
  "  expect(addNote('x'.repeat(501))).toBe('');",
  '});',
  '',
].join('\n');

const contractFile = [
  '/** A note of at most 500 characters is within the limit. */',
  'export const noteLimitCases = [',
  "  { note: 'a short note', within: true },",
  "  { note: 'x'.repeat(500), within: true },",
  "  { note: 'x'.repeat(501), within: false },",
  '];',
  '',
].join('\n');

const fakeFile = [
  "import { noteLimitCases } from '../interfaces/note-limit.ts';",
  '',
  '/** The fake the consumer implements against until the real provider exists. */',
  'export function createNoteLimitFake() {',
  '  void noteLimitCases;',
  '  return { withinLimit: (note) => note.length <= 500 };',
  '}',
  '',
].join('\n');

const subjectsFile = [
  "import { createNoteLimitFake } from '../fakes/note-limit.fake.ts';",
  '',
  "export const subjects = [{ name: 'the fake', create: createNoteLimitFake }];",
  '',
].join('\n');

const conformanceFile = [
  "import { test, expect } from 'vitest';",
  "import { noteLimitCases } from '../interfaces/note-limit.ts';",
  "import { subjects } from './note-limit.subjects.ts';",
  '',
  'for (const subject of subjects) {',
  '  for (const agreed of noteLimitCases) {',
  '    test(subject.name + \' answers \' + agreed.within + \' for \' + agreed.note.length, () => {',
  '      expect(subject.create().withinLimit(agreed.note)).toBe(agreed.within);',
  '    });',
  '  }',
  '}',
  '',
].join('\n');

const integrated = [
  "import { createNoteLimitFake } from '../../limits/src/fakes/note-limit.fake.ts';",
  '',
  'const limit = createNoteLimitFake();',
  '',
  'export function addNote(note) {',
  "  return limit.withinLimit(note) ? note : '';",
  '}',
  '',
].join('\n');

const realProvider = [
  '/** The real note limit. */',
  'export function createNoteLimit() {',
  '  return { withinLimit: (note) => note.length <= 500 };',
  '}',
  '',
].join('\n');

const bothSubjects = [
  "import { createNoteLimitFake } from '../fakes/note-limit.fake.ts';",
  "import { createNoteLimit } from '../note-limit.ts';",
  '',
  'export const subjects = [',
  "  { name: 'the fake', create: createNoteLimitFake },",
  "  { name: 'the real provider', create: createNoteLimit },",
  '];',
  '',
].join('\n');

const verified = [
  "import { createNoteLimit } from '../../limits/src/note-limit.ts';",
  '',
  'const limit = createNoteLimit();',
  '',
  'export function addNote(note) {',
  "  return limit.withinLimit(note) ? note : '';",
  '}',
  '',
].join('\n');

/** A project with the consumer that needs the behavior and the owner that will provide it. */
async function target() {
  const fixture = await copyFixture();
  cleanups.push(fixture.remove);
  await addModule(fixture.root, consumerDirectory, 'notes', {
    'src/notes.ts': stub,
    'src/tests/notes.test.ts': consumerTest,
  });
  await addModule(fixture.root, providerDirectory, 'limits', {});
  await installMiniRunner(fixture.root);
  return fixture.root;
}

/**
 * A run over this fixture whose Git answers are the scenario's own data:
 * the revision Git reports for each commit the harness attempts, or that
 * the tree was unchanged.
 */
async function run(
  root: string,
  plan: Parameters<typeof byRole>[0],
  commits: readonly CommitResponse[],
  options: Omit<Parameters<typeof openRuns>[1], 'git'> & { previewHeads?: readonly string[] } = {},
) {
  const { previewHeads = [], ...runOptions } = options;
  const materialization = scenariosCommitted('review-notes');
  const before = commits.slice(0, -1).flatMap(commit => commit.commit ?? []).at(-1) ?? materialization.commit!;
  const after = commits.at(-1)?.commit ?? before;
  const tree = 'a'.repeat(40);
  const git = answeredGit(root, { head: 'revision-00', commits: [materialization, ...commits],
    ...(options.production === true ? { currentTree: tree }
      : { previews: [...previewHeads, before, before, before, after].map(head => ({ repositoryRoot: root, head, tree })) }) });
  const revisions = commits.flatMap(commit => commit.commit === null ? [] : [commit.commit]);
  const candidateRecords = Object.fromEntries(revisions.map((revision, index) => [revision, {
    tree, base: revisions[index - 1] ?? materialization.commit!, files: {}, changes: [],
  }]));
  const opened = await openRuns(root, {
    script: byRole(plan), inputs: treeInputs(), git,
    candidates: scriptedCandidates(root, candidateRecords),  ...runOptions,
  });
  cleanups.push(() => opened.service.close());
  const receipt = await opened.service.execute(startRun('review-notes'));
  if (options.production === true) {
    await until(() => {
      const run = opened.service.getRun('review-notes', receipt.jobId)!;
      const reconciliations = opened.service.events('review-notes', receipt.jobId)?.filter(event => event.type === 'reconciliation-started').length ?? 0;
      return run.state === 'completed' || run.state === 'failed' || reconciliations > 2;
    }, 45_000);
    const run = opened.service.getRun('review-notes', receipt.jobId)!;
    if (run.state !== 'completed' && run.state !== 'failed') {
      const last = (opened.service.events('review-notes', receipt.jobId) ?? []).filter(event =>
        ['gate-attempted', 'work-item-completed', 'work-item-blocked', 'reconciliation-started', 'reconciliation-refused',
          'obligation-bound', 'obligation-reported'].includes(event.type)).slice(-20);
      await opened.service.execute(stopRun('review-notes', receipt.jobId, run.version));
      await opened.service.settled('review-notes', receipt.jobId);
      throw new Error(`Production run did not complete: ${JSON.stringify(last)}`);
    }
  }
  await opened.service.settled('review-notes', receipt.jobId);
  return { ...opened, git, runId: receipt.jobId };
}

const need = {
  capability: 'capability:note-limit',
  useCases: ['a reviewer attaches a note to a review run, and a note over the limit is refused'],
  inputs: ['the note text'],
  outputs: ['whether the note is within the limit'],
  sideEffects: [],
  constraints: ['at most 500 characters'],
  existingEvidence: [`${consumerDirectory}/src/tests/notes.test.ts`],
};

/** The `contract-needed` submission, as the module engineer writes it. */
const contractNeeded = {
  kind: 'contract-needed' as const,
  need,
  suggestedProvider: provider,
  summary: 'The note limit is not behavior this module owns, so nothing here was changed.',
};

/** The `established` submission, as the contract sub-session writes it. */
const establishedContract = {
  kind: 'established' as const,
  contractKey: 'draft:contract:note-limit',
  providerObligationKey: 'draft:provider-obligation:note-limit',
  consumerRequirementKey: 'draft:consumer-requirement:notes-note-limit',
  mode: 'fake-backed' as const,
  authority: {
    kind: 'provider' as const,
    owner: provider,
    rationale: 'The note limit is a capability of its own, so its public contract belongs with the module that implements it.',
  },
  provider,
  behavior: 'A note of at most 500 characters is within the limit; a longer one is not.',
  artifacts: {
    interface: [{ path: `${providerDirectory}/src/interfaces/note-limit.ts`, exports: ['noteLimitCases'] }],
    conformance: [{ path: `${providerDirectory}/src/tests/note-limit.conformance.test.ts` }],
    fake: [{
      path: `${providerDirectory}/src/fakes/note-limit.fake.ts`,
      exports: ['createNoteLimitFake'],
      standsFor: [{ fake: 'createNoteLimitFake', path: `${providerDirectory}/src/note-limit.ts`, export: 'createNoteLimit', exposure: { to: [], reexposed: [] } }],
    }],
    exposure: [{ path: `${providerDirectory}/module.ramify`, declaration: 'expose-src noteLimitCases from "interfaces/note-limit.ts" to parent' }],
  },
  fakeInjections: [`${consumerDirectory}/src/notes.ts`],
  summary: 'The note limit is agreed, the consumer runs against its fake, and the conformance suite states what the provider owes.',
};

/** The writes of the contract sub-session, in the order it makes them. */
const contractWrites = [
  write(`${providerDirectory}/src/interfaces/note-limit.ts`, contractFile),
  write(`${providerDirectory}/src/fakes/note-limit.fake.ts`, fakeFile),
  write(`${providerDirectory}/src/tests/note-limit.subjects.ts`, subjectsFile),
  write(`${providerDirectory}/src/tests/note-limit.conformance.test.ts`, conformanceFile),
  write(`${consumerDirectory}/src/notes.ts`, integrated),
];

/** The local decision that places the capability the consumer needs. */
const placeTheLimit = localDecision(
  {
    question: 'Where does the note limit belong?',
    outcome: 'reuse',
    capability: 'capability:note-limit',
    owner: provider,
    rationale: 'The limit is a rule of its own, and this subtree is mine to place work in.',
  },
  [registryChange({ capability: 'capability:note-limit', owner: provider, behavior: 'A note of at most 500 characters is within the limit.' })],
);
placeTheLimit.decisionKey = 'draft:placement-decision:note-limit';

/** The files each side of the seam owns, as the scenario's Git answers name them. */
const seam = {
  interface: `${providerDirectory}/src/interfaces/note-limit.ts`,
  fake: `${providerDirectory}/src/fakes/note-limit.fake.ts`,
  subjects: `${providerDirectory}/src/tests/note-limit.subjects.ts`,
  conformance: `${providerDirectory}/src/tests/note-limit.conformance.test.ts`,
  real: `${providerDirectory}/src/note-limit.ts`,
  consumer: `${consumerDirectory}/src/notes.ts`,
};

/**
 * What Git reports through one delegation: the agreement's files, the real
 * provider beside them, the consumer's move off the fake, and an unchanged
 * tree for the gates that follow a commit without a write of their own.
 */
const delegationCommits = (verification: string): CommitResponse[] => [
  accepted('work-item:review-notes.i02', 'revision-01', [...added(seam.interface, seam.fake, seam.subjects, seam.conformance), ...modified(seam.consumer)]),
  accepted('work-item:provide-note-limit.i01', 'revision-02', [...added(seam.real), ...modified(seam.subjects)]),
  unchanged('work-item:provide-note-limit'),
  accepted(verification, 'revision-03', modified(seam.consumer)),
  unchanged('work-item:review-notes'),
  unchanged('final verification of plan "review-notes"'),
];

async function events(root: string, runId: string): Promise<RunEvent[]> {
  return runEventsOnDisk(root, 'review-notes', runId);
}

function withoutLegacyFakeKeys(seam: typeof establishedContract) {
  const { providerObligationKey: _providerObligationKey, consumerRequirementKey: _consumerRequirementKey, ...access } = seam;
  return access;
}

function withoutRequirementProposal<T extends { consumerRequirementKey: string }>(seam: T) {
  const { consumerRequirementKey: _consumerRequirementKey, ...revision } = seam;
  return revision;
}

function withoutContractProposal(seam: ReturnType<typeof seamEstablished>) {
  const { contractKey: _contractKey, providerObligationKey: _providerObligationKey, ...attached } = seam;
  return attached;
}

function typesOf(log: readonly RunEvent[]): string[] {
  return log.map(event => event.type);
}

async function readJson<T>(root: string, runId: string, path: string): Promise<T> {
  return JSON.parse(await readFile(runPath(root, 'review-notes', runId, path), 'utf8')) as T;
}

describe('P1: one consumer delegates, resumes after provider conformance and verifies against the real provider', () => {
  test('restart after a passed contract gate reuses its writer and registers the agreement once', async () => {
    const root = await target();
    const tree = 'a'.repeat(40);
    const commits = delegationCommits('work-item:review-notes.i03');
    const git = answeredGit(root, { head: 'revision-00', commits: [scenariosCommitted('review-notes'), ...commits],
      previews: ['revision-01', 'revision-01', 'revision-03', 'revision-03', 'revision-03', 'revision-03']
        .map(head => ({ repositoryRoot: root, head, tree })) });
    const candidates = scriptedCandidates(root, {
      'revision-01': { tree, base: 'scenarios-of-review-notes', files: {}, changes: [] },
      'revision-03': { tree, base: 'revision-02', files: {}, changes: [] },
    });
    const passing = passingAudit();
    const audited: string[] = [];
    const configuredAudit = { read: passing.read, async run(input: Parameters<typeof passing.run>[0]) {
      audited.push(input.attemptId);
      return passing.run(input);
    } };
    let crashed!: () => void;
    const atCut = new Promise<void>(resolve => { crashed = resolve; });
    let frozen = false;
    const first = await openRuns(root, {
      script: byRole({
        'initial-architect': [submit(currentAnalysis(analysis([entry('review-notes', consumer)]), 'document:review-notes-plan'))],
        'local-architect': [submit({ ...assign(consumer, {}, outline()), localDecisions: [placeTheLimit] })],
        engineer: [submit(contractNeeded)],
        'contract-engineer': [submit(establishedContract, ...contractWrites)],
      }), inputs: treeInputs(), git, candidates, configuredAudit,
      afterWrite: async (write, runId) => {
        if (frozen) return freeze();
        if (write !== 'gate-committed') return;
        const log = await events(root, runId);
        if (!log.some(event => event.type === 'gate-attempted' && event.data.checkpoint === 'contract' && event.data.verdict === 'passed')) return;
        frozen = true;
        crashed();
        return freeze();
      },
    });
    const receipt = await first.service.execute(startRun('review-notes'));
    await atCut;
    const before = await events(root, receipt.jobId);
    const contractGate = before.find((event): event is Extract<RunEvent, { type: 'gate-attempted' }> =>
      event.type === 'gate-attempted' && event.data.checkpoint === 'contract')!;
    expect(before.some(event => event.type === 'contract-registered')).toBe(false);
    expect(audited.filter(id => id === contractGate.data.gate)).toHaveLength(1);
    await staleCrashLock(root);
    const restarted = await openRuns(root, {
      script: byRole({
        'local-architect': [
          submit({ kind: 'yield-for-providers', requirements: ['consumer-requirement:notes-note-limit'], summary: 'The consumer waits for the real limit.' }),
          submit(assign(provider, {}, outline({ changes: 'Implement the agreed limit.' }))),
          submit(requestCompletion()),
          submit(assign(consumer, { kind: 'verification', goal: 'Replace the fake with the real note limit.' })),
          submit(requestCompletion()),
        ],
        engineer: [
          submit(completionProposed('The real note limit is implemented.'),
            write(join(root, providerDirectory, 'src/note-limit.ts'), realProvider),
            write(join(root, providerDirectory, 'src/tests/note-limit.subjects.ts'), bothSubjects)),
          submit(completionProposed('The consumer uses the real note limit.'),
            write(join(root, consumerDirectory, 'src/notes.ts'), verified)),
        ],
        'contract-engineer': [[{ kind: 'end', message: 'A second contract writer must not start.' }]],
      }), inputs: treeInputs(), git, candidates, configuredAudit,
    });
    cleanups.push(() => restarted.service.close());
    await restarted.service.settled('review-notes', receipt.jobId);
    const after = await events(root, receipt.jobId);
    expect(onlyRun(restarted.service, 'review-notes').state, JSON.stringify(onlyRun(restarted.service, 'review-notes').failure)).toBe('completed');
    expect(after.filter(event => event.type === 'invocation-started' && event.data.role === 'contract-engineer')).toHaveLength(1);
    expect(after.filter(event => event.type === 'gate-attempted' && event.data.checkpoint === 'contract')).toEqual([contractGate]);
    expect(audited.filter(id => id === contractGate.data.gate)).toHaveLength(1);
    expect(after.filter(event => event.type === 'contract-registered')).toHaveLength(1);
    expect(after.filter(event => event.type === 'iteration-closed' && event.data.iteration === 'work-item:review-notes.i02')).toHaveLength(1);
    expect(after.filter(event => event.type === 'provider-conformed')).toHaveLength(1);
    expect(after.filter(event => event.type === 'requirement-verified')).toHaveLength(1);
    expect(git.minted()).toEqual(['scenarios-of-review-notes', 'revision-01', 'revision-02', 'revision-03']);
    git.assertAnswered();
    await restarted.service.close(); cleanups.pop();
    const again = await openRuns(root, { git, candidates, configuredAudit });
    cleanups.push(() => again.service.close());
    expect(await events(root, receipt.jobId)).toEqual(after);
    expect(audited.filter(id => id === contractGate.data.gate)).toHaveLength(1);
  }, 60_000);
  test('the delegation runs end to end and only the real provider closes it', async () => {
    const root = await target();
    const { service, runId, git, agent } = await run(root, {
      'initial-architect': [submit(currentAnalysis(analysis([entry('review-notes', consumer)]), 'document:review-notes-plan'))],
      'local-architect': [
        // The consumer's own turn: it places the capability within its own
        // authority and assigns the work that discovers the need.
        submit({ ...assign(consumer, {}, outline()), localDecisions: [placeTheLimit] }),
        // The agreement is registered; the consumer has done what it can
        // against the fake and waits for the provider.
        submit({ kind: 'yield-for-providers', requirements: ['consumer-requirement:notes-note-limit'], summary: 'The consumer runs against the fake and waits for the real limit.' }),
        // The provider work item the registration started.
        submit(assign(provider, {}, outline({ changes: 'Implement the agreed limit and run the conformance suite against it.' }))),
        submit(requestCompletion()),
        // The consumer, resumed: verification replaces the fake.
        submit(assign(consumer, { kind: 'verification', goal: 'Replace the fake with the real note limit and rerun the behavior.' })),
        submit(requestCompletion()),
      ],
      engineer: [
        submit(contractNeeded),
        submit(completionProposed('The real note limit is implemented and the conformance suite runs against it.'),
          write(join(root, providerDirectory, 'src/note-limit.ts'), realProvider),
          write(join(root, providerDirectory, 'src/tests/note-limit.subjects.ts'), bothSubjects)),
        submit(completionProposed('The consumer now uses the real note limit.'),
          write(join(root, consumerDirectory, 'src/notes.ts'), verified)),
      ],
      'contract-engineer': [submit(establishedContract, ...contractWrites)],
    }, delegationCommits('work-item:review-notes.i03'), { previewHeads: ['revision-01'] });

    expect(onlyRun(service, 'review-notes').state, JSON.stringify({ failure: onlyRun(service, 'review-notes').failure, sessions: agent?.sessions.map(session => ({ role: session.spec.role, verdicts: session.verdicts })) })).toBe('completed');
    const log = await events(root, runId);
    const types = typesOf(log);

    // One contract iteration, one registration, one obligation, one
    // requirement and one provider work item.
    expect(types.filter(type => type === 'contract-requested')).toHaveLength(1);
    expect(types.filter(type => type === 'contract-registered')).toHaveLength(1);
    const registered = log.find(event => event.type === 'contract-registered')!;
    expect(registered.data).toMatchObject({
      contract: 'contract:note-limit',
      revision: 1,
      mode: 'fake-backed',
      obligation: 'provider-obligation:note-limit',
      requirements: ['consumer-requirement:notes-note-limit'],
      providerWorkItem: 'work-item:provide-note-limit',
    });

    const contract = await readJson<ContractRecord>(root, runId, contractsLayout.contract('contract:note-limit', 1));
    expect(contract.provider).toBe(provider);
    expect(contract.authority.kind).toBe('provider');
    expect(contract.mode).toBe('fake-backed');
    // The hashes are the harness's, taken from the files the gate passed over.
    expect(contract.artifacts.fake[0]!.hash).toMatch(/^[0-9a-f]{64}$/);

    const obligation = await readJson<ProviderObligation>(root, runId, contractsLayout.obligation('provider-obligation:note-limit', 1));
    expect(obligation.evidence.against).toBe('real');
    expect(obligation.evidence.conformance).toEqual([`${providerDirectory}/src/tests/note-limit.conformance.test.ts`]);

    const requirement = await readJson<ConsumerRequirement>(root, runId, contractsLayout.requirement('consumer-requirement:notes-note-limit', 1));
    expect(requirement.consumer).toBe(consumer);
    expect(requirement.forCapability).toBe('capability:review-notes');
    expect(requirement.evidence.fakeInjections).toEqual([`${consumerDirectory}/src/notes.ts`]);

    const providerItem = await readJson<WorkItem>(root, runId, workLayout.item('work-item:provide-note-limit'));
    expect(providerItem.module).toBe(provider);
    expect(providerItem.startedFor).toBe('work-item:review-notes');
    expect(providerItem.origin).toEqual({ obligation: { id: 'provider-obligation:note-limit', revision: 1, hash: expect.any(String) } });

    // The consumer yields, the provider runs, and the consumer comes back
    // only once the provider has conformed. The requirement is still open
    // when it resumes: waiting for its own verification would deadlock.
    const order = types.filter(type => ['work-item-yielded', 'provider-conformed', 'work-item-resumed', 'requirement-verified'].includes(type));
    expect(order).toEqual(['work-item-yielded', 'provider-conformed', 'work-item-resumed', 'requirement-verified']);

    // The provider work item ran between the yield and the resumption.
    const yielded = types.indexOf('work-item-yielded');
    const resumed = types.indexOf('work-item-resumed');
    const started = log.findIndex(event => event.type === 'work-item-started' && event.data.workItem === 'work-item:provide-note-limit');
    expect(started).toBeGreaterThan(yielded);
    expect(started).toBeLessThan(resumed);

    const conformed = log.find(event => event.type === 'provider-conformed')!;
    expect(conformed.data).toMatchObject({ obligation: 'provider-obligation:note-limit', revision: 1, workItem: 'work-item:provide-note-limit' });
    const closed = log.find(event => event.type === 'requirement-verified')!;
    expect(closed.data).toMatchObject({ requirement: 'consumer-requirement:notes-note-limit', revision: 1, workItem: 'work-item:review-notes' });

    // The consumer's source no longer reaches the fake, which is what
    // `requirement-verified` required.
    const source = await readFile(`${root}/${consumerDirectory}/src/notes.ts`, 'utf8');
    expect(source).not.toContain('Fake');
    expect(source).toContain('createNoteLimit');

    // Both work items completed, and the run's final gate followed them.
    expect(types.filter(type => type === 'work-item-completed')).toHaveLength(2);
    expect(types.at(-1)).toBe('job-completed');
    const snapshot = onlyRun(service, 'review-notes');
    expect(snapshot.counts.openRequirements).toBe(0);
    expect(snapshot.counts.completedWorkItems).toBe(2);

    // The run committed on its own branch: the agreement, the real provider
    // and the verification, in that order, each over the one before it.
    expect(git.branch()).toBe(`ramify-agent-run/${runId}`);
    expect(git.minted()).toEqual(['scenarios-of-review-notes', 'revision-01', 'revision-02', 'revision-03']);
    git.assertAnswered();
  }, 60_000);


});

test.each(['fake-backed', 'access-only'] as const)(
  'descriptive registry delegation preserves agreement, obligation and requirement through %s handback and reload', async mode => {
  const access = mode === 'access-only';
  const root = await target();
  const names = {
    work: 'work-item:review-notes', providerWork: 'work-item:provide-provide-note-limit',
    capability: 'capability:note-limit', contract: 'contract:review-note-limit',
    obligation: 'provider-obligation:provide-note-limit', requirement: 'consumer-requirement:review-notes-use-limit',
    accessContract: 'contract:review-note-limit-access',
  };
  const placement = { ...localDecision({
    question: 'Where does the note limit belong?', outcome: 'reuse', capability: names.capability,
    owner: provider, rationale: 'The limit belongs to the existing limits module.',
  }, [registryChange({ capability: names.capability, owner: provider,
    behavior: 'A note of at most 500 characters is within the limit.' })]),
    decisionKey: 'draft:placement-decision:note-limit' };
  const dependency = { capability: names.capability, owner: provider, role: 'request' as const };
  const { outline: _unchangedOutline, ...unchangedCompletion } = requestCompletion();
  const plan = byRole({
    'initial-architect': [submit({ elements: [], entries: [{
      capabilityKey: 'draft:capability:review-notes', description: 'A review keeps notes within the limit.',
      owner: consumer, functionalRequirementKeys: [], functionalAcceptanceKeys: [], contextKeys: [], citations: [],
    }], hypotheses: [], coverageLimits: [], scenarios: [{
      scenarioKey: 'draft:scenario:review-note-limit', entryCapabilityKey: 'draft:capability:review-notes',
      origin: { kind: 'architect' }, functionalAcceptanceKeys: [],
      gherkin: 'Scenario: Review note limit\n  When a reviewer adds a note\n  Then an overlong note is refused',
    }], integrationScenarios: [] })],
    'local-architect': [
      submit({ ...assign(consumer, { externalCapabilities: [dependency] }, outline({ reuse: [dependency] })),
        localDecisions: [placement] }),
      submit({ kind: 'yield-for-providers', requirements: [names.requirement], summary: 'Waiting for the real limit.' }),
      submit(assign(provider, {}, outline({ changes: 'Implement the agreed note limit.' }))),
      submit(unchangedCompletion),
      submit(assign(consumer, { kind: 'verification', goal: 'Use and verify the real note limit.',
        obligations: ['scenario:review-note-limit'] })),
      ...(access ? [submit(assign(consumer, { kind: 'contract', revisesContract: names.contract,
        goal: 'Replace the fulfilled fake-backed agreement with real-provider access.',
        approach: 'The provider conformed and the consumer verified the real implementation.',
        completionEvidence: 'The access-only agreement names the real provider exposure.' }))] : []),
      submit({ ...unchangedCompletion, reports: [{ id: 'scenario:review-note-limit',
        judgment: 'done', basedOnRevision: 0 }] }),
    ],
    engineer: [
      submit({ ...contractNeeded, need: { ...need, capability: names.capability } }),
      submit(completionProposed('The real note limit conforms.'),
        write(join(root, providerDirectory, 'src/note-limit.ts'), realProvider),
        write(join(root, providerDirectory, 'src/tests/note-limit.subjects.ts'), bothSubjects)),
      submit(completionProposed('The consumer uses the real note limit.', { bindings: [{ id: 'scenario:review-note-limit', fakes: [] }] }),
        write(join(root, consumerDirectory, 'src/notes.ts'), verified),
        write(join(root, consumerDirectory, 'src/tests/steps/review-note-limit.ts'), [
          "import { When, Then } from '@cucumber/cucumber';",
          "import { addNote } from '../../notes.ts';",
          "let note = '';",
          "When('a reviewer adds a note', () => { note = addNote('x'.repeat(501)); });",
          "Then('an overlong note is refused', () => { if (note !== '') throw new Error('overlong note was kept'); });",
          '',
        ].join('\n'))),
    ],
    'contract-engineer': [submit({ ...establishedContract,
      contractKey: `draft:${names.contract}`, providerObligationKey: `draft:${names.obligation}`,
      consumerRequirementKey: `draft:${names.requirement}`,
    }, ...contractWrites), ...(access ? [submit({ ...withoutLegacyFakeKeys(establishedContract), mode: 'access-only',
      contractKey: `draft:${names.accessContract}`,
      artifacts: { ...establishedContract.artifacts, conformance: [], fake: [] }, fakeInjections: [],
      scope: { consumerWorkItems: [names.work] },
      retirements: [
        { id: names.contract, kind: 'contract', replacementKeys: [`draft:${names.accessContract}`], reason: 'Use the real provider.' },
        { id: names.obligation, kind: 'provider-obligation', replacementKeys: [`draft:${names.accessContract}`], reason: 'Real provider conformed.' },
        { id: names.requirement, kind: 'consumer-requirement', replacementKeys: [`draft:${names.accessContract}`], reason: 'Consumer verified the real provider.' },
      ],
    }, write(`${providerDirectory}/src/interfaces/note-limit.ts`, `// Access-only real-provider contract.\n${contractFile}`))] : [])],
  });
  const commits: CommitResponse[] = [
    accepted(`${names.work}.i02`, 'revision-01', [...added(seam.interface, seam.fake, seam.subjects, seam.conformance), ...modified(seam.consumer)]),
    accepted(`${names.providerWork}.i01`, 'revision-02', [...added(seam.real), ...modified(seam.subjects)]),
    unchanged(names.providerWork),
    accepted(`${names.work}.i03`, 'revision-03', [...modified(seam.consumer), ...added(`${consumerDirectory}/src/tests/steps/review-note-limit.ts`)]),
    ...(access ? [accepted(`${names.work}.i04`, 'revision-04', modified(seam.interface))] : []),
    unchanged(names.work),
    unchanged('final verification of plan "review-notes"'),
  ];
  const omittedCompletionDeclarations: string[] = [];
  const script: Parameters<typeof openRuns>[1]['script'] = spec => {
    if (spec.submission.name === 'submit_work_orientation') return defaultTurn(spec) ?? [];
    if (spec.submission.name === 'submit_reconciliation') {
      return submit({ relations: [], dispositions: [], next: { kind: 'complete' },
        brief: 'The provider and consumer evidence resolves the completed work.' });
    }
    if (spec.submission.name === 'submit_intake') {
      const documents = [...spec.prompt.matchAll(/^- (document:[a-z0-9-]+) \(plan\):/gmu)].map(match => match[1]!);
      return submit({ goal: 'Keep review notes within the agreed limit.', elements: [], incorporation: {
        documents: documents.map(document => ({ document, scenarios: true, uncertainty: '' })), missing: [],
      } });
    }
    if (spec.submission.name === 'submit_principle_elements') return submit({ elements: [] });
    if (spec.submission.name === 'submit_catalog_check') return submit({ corrections: [], entries: [], scenarios: [] });
    const steps = typeof plan === 'function' ? plan(spec) : plan;
    if (spec.role === 'local-architect' && spec.submission.name === 'submit_work_item_result'
      && steps.some(step => step.kind === 'submit' && typeof step.input === 'object' && step.input !== null
        && (step.input as { kind?: string }).kind === 'request-completion' && !Object.hasOwn(step.input, 'outline'))) {
      omittedCompletionDeclarations.push(spec.submission.description);
    }
    return steps;
  };
  const { service, runId, git, agent } = await run(root, {}, commits, { production: !access, script,
    previewHeads: access ? ['revision-01'] : [] });
  if (!access) {
    const captured = await readJson<{ prompts: Record<string, unknown>; policy: { context: Record<string, unknown> } }>(root, runId, runLayout.record);
    expect(captured.prompts['contract-engineer']).toBeDefined();
    expect(captured.policy.context['contract-engineer']).toBeDefined();
  }
  expect(onlyRun(service, 'review-notes').state, JSON.stringify({ failure: onlyRun(service, 'review-notes').failure,
    sessions: agent?.sessions.map(session => ({ role: session.spec.role, submission: session.spec.submission.name,
      verdicts: session.verdicts })) })).toBe('completed');
  if (!access) {
    expect(omittedCompletionDeclarations.length).toBeGreaterThanOrEqual(1);
    for (const declaration of omittedCompletionDeclarations) expect(declaration).toContain(JSON.stringify(localArchitectJsonSchema));
  }
  const log = await events(root, runId);
  if (!access) {
    expect(log.at(-1)?.type).toBe('job-completed');
    expect(onlyRun(service, 'review-notes').counts.scenarios).toEqual({ pending: 0, bound: 0, done: 1 });
    expect(log.some(event => event.type === 'gate-attempted' && event.data.checkpoint === 'final'
      && event.data.verdict === 'passed')).toBe(true);
  }
  expect(log.find(event => event.type === 'contract-registered')?.data).toMatchObject({
    contract: names.contract, obligation: names.obligation, requirements: [names.requirement],
    providerWorkItem: names.providerWork,
  });
  const contract = await readJson<ContractRecord>(root, runId, contractsLayout.contract(names.contract, 1));
  const obligation = await readJson<ProviderObligation>(root, runId, contractsLayout.obligation(names.obligation, 1));
  const requirement = await readJson<ConsumerRequirement>(root, runId, contractsLayout.requirement(names.requirement, 1));
  expect(contract).toMatchObject({ schema: 'ramify-agent.contract/3', id: names.contract });
  expect(obligation).toMatchObject({ schema: 'ramify-agent.provider-obligation/2', id: names.obligation,
    contract: { id: names.contract } });
  expect(requirement).toMatchObject({ schema: 'ramify-agent.consumer-requirement/2', id: names.requirement,
    obligation: names.obligation, workItem: names.work, forCapability: 'capability:review-notes' });
  expect((await readJson<WorkItem>(root, runId, workLayout.item(names.providerWork))).origin)
    .toEqual({ obligation: { id: names.obligation, revision: 1, hash: expect.any(String) } });
  expect((await readJson<{ schema: string }>(root, runId, workLayout.outline(names.work, 1))).schema)
    .toBe('ramify-agent.work-item-outline/2');
  if (!access) expect(existsSync(runPath(root, 'review-notes', runId, workLayout.outline(names.work, 2)))).toBe(false);
  const providerAssignment = await readJson<{ schema: string; evidenceObligations: unknown[] }>(root, runId,
    iterationLayout.assignment(names.providerWork, 1));
  expect(providerAssignment.schema).toBe('ramify-agent.iteration-assignment/2');
  expect(providerAssignment.evidenceObligations).toEqual([{ obligation: {
    id: names.obligation, revision: 1, hash: expect.any(String),
  }, suite: [seam.conformance], against: 'real' }]);
  const verification = await readJson<{ evidenceObligations: unknown[] }>(root, runId,
    iterationLayout.assignment(names.work, 3));
  expect(verification.evidenceObligations).toEqual([{ requirement: {
    id: names.requirement, revision: 1, hash: expect.any(String),
  }, suite: [seam.conformance], against: 'real' }]);
  expect(log.filter(event => ['work-item-yielded', 'provider-conformed', 'work-item-resumed', 'requirement-verified'].includes(event.type))
    .map(event => event.type)).toEqual(['work-item-yielded', 'provider-conformed', 'work-item-resumed', 'requirement-verified']);
  await service.close();
  const reopened = await openRuns(root, { production: !access,
    script, inputs: treeInputs(), git });
  cleanups.push(() => reopened.service.close());
  expect(reopened.service.events('review-notes', runId)?.filter(event => event.type === 'contract-registered')).toHaveLength(1);
  expect(reopened.service.committed('review-notes', runId)?.entries.flatMap(line => line.transaction.records)
    .some(record => record.path === contractsLayout.requirement(names.requirement, 1))).toBe(true);
  if (access) {
    expect(await readJson<ContractRecord>(root, runId, contractsLayout.contract(names.accessContract, 2)))
      .toMatchObject({ id: names.accessContract, mode: 'access-only', revision: 2 });
    const retired = [names.contract, names.obligation, names.requirement];
    for (const id of retired) {
      expect(await readJson<ExecutionRetirement>(root, runId, executionRetirementPath(id)))
        .toMatchObject({ id, replacements: [names.accessContract] });
      expect(reopened.service.committed('review-notes', runId)?.entries.flatMap(line => line.transaction.records)
        .some(record => record.path === executionRetirementPath(id))).toBe(true);
    }
    expect(reopened.service.events('review-notes', runId)?.filter(event => event.type === 'evidence-reopened'))
      .toMatchObject([{ data: { contract: names.accessContract, obligation: null, requirements: [] } }]);
  }
  if (access) git.assertAnswered();
  else expect(git.minted()).toEqual(['scenarios-of-review-notes', 'revision-01', 'revision-02', 'revision-03']);
}, 90_000);

test.each(['split', 'replacement', 'merge'] as const)(
  'descriptive second consumer attaches and %s revision reopens both consumers with accepted IDs', async mode => {
  const replacement = mode === 'replacement';
  const merging = mode === 'merge';
  const root = await target();
  const tags = 'collection-review/workspace/reviews/tags';
  const tagsDirectory = 'subs/workspace/subs/reviews/subs/tags';
  await addModule(root, tagsDirectory, 'tags', {
    'src/tags.ts': consumerStub, 'src/tests/tags.test.ts': seamConsumerTest('tags.ts'),
  });
  const base: Seam = {
    capability: 'note-limit', name: 'NoteLimit', providerDirectory, provider,
    consumerDirectory, consumerFile: 'notes.ts', reach: '../../limits',
    behavior: 'A note of at most 500 characters is within the limit; a longer one is not.',
  };
  const second: Seam = { ...base, consumerDirectory: tagsDirectory, consumerFile: 'tags.ts' };
  const revised: Seam = { ...second, trims: true,
    behavior: 'A note is trimmed, and the trimmed note of at most 500 characters is within the limit.' };
  const paths = seamPaths(base);
  const tagPaths = seamPaths(second);
  const names = {
    notes: 'work-item:review-notes', tags: 'work-item:review-tags',
    provider: 'work-item:provide-provide-note-limit',
    supersededProvider: 'work-item:reconcile-provider-obligation-provide-note-limit-revision-2',
    providerFollowUp: replacement
      ? 'work-item:reconcile-provider-obligation-trimmed-note-limit-revision-2'
      : 'work-item:reconcile-provider-obligation-provide-note-limit-revision-2',
    notesFollowUp: 'work-item:reconcile-consumer-requirement-review-notes-use-limit-revision-2',
    contract: 'contract:review-note-limit', obligation: 'provider-obligation:provide-note-limit',
    replacementContract: 'contract:trimmed-review-note-limit',
    replacementObligation: 'provider-obligation:trimmed-note-limit',
    notesRequirement: 'consumer-requirement:review-notes-use-limit',
    tagsRequirement: 'consumer-requirement:review-tags-use-limit',
    tagsTrimRequirement: 'consumer-requirement:review-tags-trim-before-limit',
    tagsLimitRequirement: 'consumer-requirement:review-tags-enforce-trimmed-limit',
    tagsMergedRequirement: 'consumer-requirement:review-tags-trimmed-limit',
  };
  const placement = { ...localDecision({
    question: 'Where does the note limit belong?', outcome: 'reuse', capability: 'capability:note-limit',
    owner: provider, rationale: 'The limit belongs to the existing limits module.',
  }, [registryChange({ capability: 'capability:note-limit', owner: provider,
    behavior: 'A note of at most 500 characters is within the limit.' })]),
    decisionKey: 'draft:placement-decision:note-limit' };
  const dependency = { capability: 'capability:note-limit', owner: provider, role: 'request' as const };
  const reports = (scenario: string, basedOnRevision = 0) => ({ ...requestCompletion(),
    reports: [{ id: scenario, judgment: 'done', basedOnRevision }] });
  const request = (seam: Seam) => ({ ...seamContractNeeded(seam),
    need: { ...seamContractNeeded(seam).need, capability: 'capability:note-limit' } });
  const fresh = { ...seamEstablished(base), contractKey: `draft:${names.contract}`,
    providerObligationKey: `draft:${names.obligation}`, consumerRequirementKey: `draft:${names.notesRequirement}` };
  const attached = { ...withoutContractProposal(seamEstablished(second)), contractId: names.contract,
    providerObligationId: names.obligation, consumerRequirementKey: `draft:${names.tagsRequirement}` };
  const revision = replacement
    ? { ...withoutRequirementProposal(seamEstablished(revised)), contractKey: `draft:${names.replacementContract}`,
      providerObligationKey: `draft:${names.replacementObligation}`, consumerRequirementId: names.tagsRequirement,
      retirements: [
        { id: names.contract, kind: 'contract', replacementKeys: [`draft:${names.replacementContract}`],
          reason: 'The revised behavior changes the agreement kind.' },
        { id: names.obligation, kind: 'provider-obligation', replacementKeys: [`draft:${names.replacementObligation}`],
          reason: 'The new agreement needs its own provider obligation.' },
      ] }
    : { ...withoutRequirementProposal(withoutContractProposal(seamEstablished(revised))), contractId: names.contract,
      providerObligationId: names.obligation,
      consumerRequirementKeys: [`draft:${names.tagsTrimRequirement}`, `draft:${names.tagsLimitRequirement}`],
      retirements: [{ id: names.tagsRequirement, kind: 'consumer-requirement',
        replacementKeys: [`draft:${names.tagsTrimRequirement}`, `draft:${names.tagsLimitRequirement}`],
        reason: 'Trimming and enforcing the limit are distinct requirements in the revised agreement.' }] };
  const collidingReplacement = replacement ? {
    ...revision, contractKey: `draft:${names.contract}`, providerObligationKey: `draft:${names.obligation}`,
    retirements: [
      { id: names.contract, kind: 'contract', replacementKeys: [`draft:${names.contract}`],
        reason: 'The revised behavior changes the agreement kind.' },
      { id: names.obligation, kind: 'provider-obligation', replacementKeys: [`draft:${names.obligation}`],
        reason: 'The new agreement needs its own provider obligation.' },
    ],
  } : null;
  const merged = { ...withoutContractProposal(seamEstablished({ ...revised,
    behavior: 'One requirement covers trimming a tag before applying the 500 character limit.' })),
    contractId: names.contract, providerObligationId: names.obligation,
    consumerRequirementKey: `draft:${names.tagsMergedRequirement}`,
    scope: { consumerWorkItem: names.tags },
    retirements: [names.tagsTrimRequirement, names.tagsLimitRequirement].map(id => ({
      id, kind: 'consumer-requirement', replacementKeys: [`draft:${names.tagsMergedRequirement}`],
      reason: 'One requirement now states the combined behavior.',
    })) };
  const retiredNameMerge = { ...merged, consumerRequirementKey: `draft:${names.tagsRequirement}`,
    retirements: [names.tagsTrimRequirement, names.tagsLimitRequirement].map(id => ({
      id, kind: 'consumer-requirement', replacementKeys: [`draft:${names.tagsRequirement}`],
      reason: 'One requirement now states the combined behavior.',
    })) };
  const scriptByWork: Record<string, readonly ReturnType<typeof submit>[]> = {
    [`local-architect:${names.notes}`]: [
      submit({ ...assign(consumer, { externalCapabilities: [dependency] }, outline({ reuse: [dependency] })),
        localDecisions: [placement] }),
      submit({ kind: 'yield-for-providers', requirements: [names.notesRequirement], summary: 'Waiting for the real limit.' }),
      submit(assign(consumer, { kind: 'verification', goal: 'Use the real limit.' })),
      submit(reports('scenario:review-notes')),
    ],
    [`engineer:${names.notes}`]: [
      submit(request(base)),
      submit(completionProposed('Notes use the real limit.'), write(join(root, paths.consumer), consumerAgainstReal(base))),
    ],
    [`contract-engineer:${names.notes}`]: [submit(fresh, ...seamContractWrites(base))],
    [`local-architect:${names.provider}`]: [
      submit(assign(provider, {}, outline({ changes: 'Implement the agreed limit.' }))),
      submit(requestCompletion()),
    ],
    [`engineer:${names.provider}`]: [submit(completionProposed('The real limit conforms.'), ...providerWrites(base, root))],
    [`local-architect:${names.tags}`]: [
      submit(assign(tags, { externalCapabilities: [dependency] }, outline({ reuse: [dependency] }))),
      submit(assign(tags, { kind: 'contract', revisesContract: names.contract,
        goal: 'Revise the agreement to trim before measuring.',
        approach: 'The attached agreement lacks trimming that tags needs.',
        completionEvidence: 'The revised fake passes the conformance suite.' })),
      ...(merging ? [submit(assign(tags, { kind: 'contract', revisesContract: names.contract,
        goal: 'Merge the two tag requirements under one accepted identity.',
        approach: 'Trimming and applying the limit form one consumer requirement.',
        completionEvidence: 'The merged requirement is backed by the conformance suite.' }))] : []),
      submit({ kind: 'yield-for-providers', requirements: replacement
        ? [names.tagsRequirement] : merging ? [names.tagsMergedRequirement]
          : [names.tagsTrimRequirement, names.tagsLimitRequirement],
        summary: 'Waiting for the revised provider.' }),
      submit(assign(tags, { kind: 'verification', goal: 'Use the revised real limit.' })),
      submit(reports('scenario:review-tags')),
    ],
    [`engineer:${names.tags}`]: [
      submit(request(second)),
      submit(completionProposed('Tags use the revised real limit.'),
        write(join(root, tagPaths.consumer), consumerAgainstReal(revised))),
    ],
    [`contract-engineer:${names.tags}`]: [
      submit(attached, write(tagPaths.consumer, consumerAgainstFake(second))),
      submit(revision, ...seamContractWrites(revised),
        ...(collidingReplacement === null ? [] : [{ kind: 'submit' as const, input: collidingReplacement }])),
      ...(merging ? [submit(merged, ...seamContractWrites({ ...revised,
        behavior: 'One requirement covers trimming a tag before applying the 500 character limit.' }),
        { kind: 'submit', input: retiredNameMerge })] : []),
    ],
    [`local-architect:${names.providerFollowUp}`]: [
      submit(assign(provider, {}, outline({ changes: 'Add trimming to the real limit.' }))),
      submit(requestCompletion()),
    ],
    [`engineer:${names.providerFollowUp}`]: [submit(completionProposed('The real limit trims.'), ...providerWrites(revised, root))],
    [`local-architect:${names.notesFollowUp}`]: [
      submit(assign(consumer, { kind: 'verification', goal: 'Verify notes against the revised limit.' },
        outline({ changes: 'The revised limit trims before measuring.' }))),
      submit(requestCompletion()),
    ],
    [`engineer:${names.notesFollowUp}`]: [submit(completionProposed('Notes use the revised limit.'),
      write(join(root, paths.consumer), consumerAgainstReal({ ...base, trims: true })))],
  };
  const counts = new Map<string, number>();
  const tagsTurns: Array<{ seen: number; reportLines: string[] }> = [];
  const fallback = byRole({});
  const script: Parameters<typeof openRuns>[1]['script'] = spec => {
    if (spec.submission.name === 'submit_intake') {
      const documents = [...spec.prompt.matchAll(/^- (document:[a-z0-9-]+) \(plan\):/gmu)].map(match => match[1]!);
      return submit({ goal: 'Keep review notes and tags within the agreed limit.', elements: [], incorporation: {
        documents: documents.map(document => ({ document, scenarios: true, uncertainty: '' })), missing: [],
      } });
    }
    if (spec.submission.name === 'submit_principle_elements') return submit({ elements: [] });
    if (spec.submission.name === 'submit_catalog_check') return submit({ corrections: [], entries: [], scenarios: [] });
    if (spec.role === 'initial-architect') return submit({ elements: [], entries: [
      { capabilityKey: 'draft:capability:review-notes', description: 'A review keeps notes within the limit.', owner: consumer,
        functionalRequirementKeys: [], functionalAcceptanceKeys: [], contextKeys: [], citations: [] },
      { capabilityKey: 'draft:capability:review-tags', description: 'A review keeps tags within the limit.', owner: tags,
        functionalRequirementKeys: [], functionalAcceptanceKeys: [], contextKeys: [], citations: [] },
    ], hypotheses: [], coverageLimits: [], scenarios: [
      { scenarioKey: 'draft:scenario:review-notes', entryCapabilityKey: 'draft:capability:review-notes',
        origin: { kind: 'architect' }, functionalAcceptanceKeys: [],
        gherkin: 'Scenario: Review notes\n  When a reviewer adds a note\n  Then an overlong note is refused' },
      { scenarioKey: 'draft:scenario:review-tags', entryCapabilityKey: 'draft:capability:review-tags',
        origin: { kind: 'architect' }, functionalAcceptanceKeys: [],
        gherkin: 'Scenario: Review tags\n  When a reviewer adds a tag\n  Then an overlong tag is refused' },
    ], integrationScenarios: [] });
    if (spec.role === 'local-architect' && spec.submission.name !== 'submit_work_item_result')
      return typeof fallback === 'function' ? fallback(spec) : fallback;
    const objective = [...spec.prompt.matchAll(/^Perform [^\n]+ for (\{[^\n]*\}); use the current evidence and designated submission\.$/gmu)].at(-1);
    const work = objective === undefined ? null : (JSON.parse(objective[1]!) as { workItem?: string }).workItem;
    const key = `${spec.role}:${work ?? ''}`;
    const turns = scriptByWork[key];
    if (turns === undefined) return typeof fallback === 'function' ? fallback(spec) : fallback;
    const seen = counts.get(key) ?? 0;
    counts.set(key, seen + 1);
    if (merging && key === `local-architect:${names.tags}`) tagsTurns.push({ seen,
      reportLines: spec.prompt.split('\n').filter(line => line.includes('scenario:review-tags') && line.includes('revision')) });
    return turns[Math.min(seen, turns.length - 1)]!;
  };
  const commits: CommitResponse[] = [
    accepted(`${names.notes}.i02`, 'revision-01', [...added(paths.contract, paths.fake, paths.subjects, paths.conformance), ...modified(paths.consumer)]),
    accepted(`${names.provider}.i01`, 'revision-02', [...added(paths.real), ...modified(paths.subjects)]),
    unchanged(names.provider),
    accepted(`${names.notes}.i03`, 'revision-03', modified(paths.consumer)), unchanged(names.notes),
    accepted(`${names.tags}.i02`, 'revision-04', modified(tagPaths.consumer)),
    accepted(`${names.tags}.i03`, 'revision-05', modified(paths.contract, paths.fake, paths.subjects, paths.conformance, tagPaths.consumer)),
    ...(merging ? [accepted(`${names.tags}.i04`, 'revision-06', modified(paths.contract))] : []),
    accepted(`${names.providerFollowUp}.i01`, merging ? 'revision-07' : 'revision-06', modified(paths.real, paths.subjects)),
    unchanged(names.providerFollowUp),
    accepted(`${names.tags}.i0${merging ? '5' : '4'}`, merging ? 'revision-08' : 'revision-07', modified(tagPaths.consumer)), unchanged(names.tags),
    accepted(`${names.notesFollowUp}.i01`, merging ? 'revision-09' : 'revision-08', modified(paths.consumer)), unchanged(names.notesFollowUp),
    unchanged('final verification of plan "review-notes"'),
  ];
  const { service, runId, git, agent } = await run(root, {}, commits, { script, previewHeads: ['revision-01', 'revision-04'] });
  const log = await events(root, runId);
  expect(onlyRun(service, 'review-notes').state, JSON.stringify({ failure: onlyRun(service, 'review-notes').failure,
    tagsTurns, progress: log.filter(event => ['evidence-reopened', 'work-item-yielded', 'work-item-resumed',
      'provider-conformed', 'requirement-verified', 'iteration-assigned', 'iteration-closed', 'gate-attempted'].includes(event.type))
      .slice(-18).map(event => [event.type, event.data]),
    sessions: agent?.sessions.map(session => ({ role: session.spec.role, verdicts: session.verdicts })) })).toBe('completed');
  expect(log.filter(event => event.type === 'contract-registered').map(event => event.data.requirements))
    .toEqual([[names.notesRequirement], [names.tagsRequirement]]);
  if (replacement) {
    const correction = agent?.sessions.filter(session => session.spec.role === 'contract-engineer')[2];
    const verdicts = correction?.verdicts as Array<{ accepted: boolean; errors?: unknown[] }> | undefined;
    expect(verdicts?.map(verdict => verdict.accepted)).toEqual([false, true]);
    expect(JSON.stringify(verdicts?.[0]?.errors)).toContain('contractKey');
    expect(JSON.stringify(verdicts?.[0]?.errors)).toContain('providerObligationKey');
    expect(log.filter(event => event.type === 'evidence-reopened')).toHaveLength(1);
  }
  if (merging) {
    const correction = agent?.sessions.filter(session => session.spec.role === 'contract-engineer')[3];
    const verdicts = correction?.verdicts as Array<{ accepted: boolean; errors?: unknown[] }> | undefined;
    expect(verdicts?.map(verdict => verdict.accepted)).toEqual([false, true]);
    expect(JSON.stringify(verdicts?.[0]?.errors)).toContain('consumerRequirementKey');
    expect(JSON.stringify(verdicts?.[0]?.errors)).toContain('retired');
  }
  const reopened = log.find(event => event.type === 'evidence-reopened')!;
  const revisedContract = replacement ? names.replacementContract : names.contract;
  const revisedObligation = replacement ? names.replacementObligation : names.obligation;
  const revisedRequirements = replacement ? [names.notesRequirement, names.tagsRequirement]
    : [names.notesRequirement, names.tagsTrimRequirement, names.tagsLimitRequirement];
  expect(reopened.data).toMatchObject({ contract: revisedContract, revision: 2,
    obligation: revisedObligation, requirements: revisedRequirements });
  const contract = await readJson<ContractRecord>(root, runId, contractsLayout.contract(revisedContract, 2));
  const obligation = await readJson<ProviderObligation>(root, runId, contractsLayout.obligation(revisedObligation, 2));
  const notesRequirement = await readJson<ConsumerRequirement>(root, runId, contractsLayout.requirement(names.notesRequirement, 2));
  expect(contract).toMatchObject({ schema: 'ramify-agent.contract/3', id: revisedContract, revision: 2 });
  expect(obligation).toMatchObject({ schema: 'ramify-agent.provider-obligation/2', id: revisedObligation,
    contract: { id: revisedContract, revision: 2 } });
  expect(notesRequirement).toMatchObject({ schema: 'ramify-agent.consumer-requirement/2', id: names.notesRequirement,
    workItem: names.notes, contractRevision: 2 });
  const retiredId = replacement ? names.contract : names.tagsRequirement;
  const retirement = await readJson<ExecutionRetirement>(root, runId, executionRetirementPath(retiredId));
  expect(retirement).toMatchObject({ schema: 'ramify-agent.execution-retirement/1', id: retiredId,
    kind: replacement ? 'contract' : 'consumer-requirement',
    replacements: replacement ? [names.replacementContract] : [names.tagsTrimRequirement, names.tagsLimitRequirement],
    authority: { iteration: `${names.tags}.i03` } });
  if (replacement) {
    expect(await readJson<ExecutionRetirement>(root, runId, executionRetirementPath(names.obligation)))
      .toMatchObject({ id: names.obligation, kind: 'provider-obligation', replacements: [names.replacementObligation] });
    expect(await readJson<ConsumerRequirement>(root, runId, contractsLayout.requirement(names.tagsRequirement, 2)))
      .toMatchObject({ id: names.tagsRequirement, obligation: names.replacementObligation,
        workItem: names.tags, contractRevision: 2 });
  } else {
    expect(await readJson<ConsumerRequirement>(root, runId, contractsLayout.requirement(names.tagsTrimRequirement, 2)))
      .toMatchObject({ id: names.tagsTrimRequirement, workItem: names.tags, contractRevision: 2 });
    expect(await readJson<ConsumerRequirement>(root, runId, contractsLayout.requirement(names.tagsLimitRequirement, 2)))
      .toMatchObject({ id: names.tagsLimitRequirement, workItem: names.tags, contractRevision: 2 });
  }
  if (merging) {
    expect(log.filter(event => event.type === 'evidence-reopened')[1]?.data).toMatchObject({
      contract: names.contract, revision: 3, obligation: names.obligation,
      requirements: [names.notesRequirement, names.tagsMergedRequirement],
      retired: [names.tagsTrimRequirement, names.tagsLimitRequirement],
    });
    expect(await readJson<ConsumerRequirement>(root, runId,
      contractsLayout.requirement(names.tagsMergedRequirement, 3))).toMatchObject({
      id: names.tagsMergedRequirement, workItem: names.tags, contractRevision: 3,
    });
    for (const id of [names.tagsTrimRequirement, names.tagsLimitRequirement]) {
      expect(await readJson<ExecutionRetirement>(root, runId, executionRetirementPath(id)))
        .toMatchObject({ id, kind: 'consumer-requirement', replacements: [names.tagsMergedRequirement],
          authority: { iteration: `${names.tags}.i04` } });
    }
  }
  expect(log.filter(event => event.type === 'provider-conformed').map(event => event.data.revision))
    .toEqual(merging ? [1, 3] : [1, 2]);
  expect(log.filter(event => event.type === 'requirement-verified').map(event => `${event.data.requirement}@${event.data.revision}`))
    .toEqual([`${names.notesRequirement}@1`, ...(replacement ? [`${names.tagsRequirement}@2`]
      : merging ? [`${names.tagsMergedRequirement}@3`] : [`${names.tagsTrimRequirement}@2`, `${names.tagsLimitRequirement}@2`]),
      `${names.notesRequirement}@${merging ? 3 : 2}`]);
  await service.close();
  const loaded = await openRuns(root, { script, inputs: treeInputs(), git });
  cleanups.push(() => loaded.service.close());
  expect(loaded.service.events('review-notes', runId)?.filter(event => event.type === 'evidence-reopened'))
    .toHaveLength(merging ? 2 : 1);
  expect(loaded.service.committed('review-notes', runId)?.entries.flatMap(line => line.transaction.records)
    .some(record => record.path === contractsLayout.requirement(names.notesRequirement, 2))).toBe(true);
  expect(loaded.service.committed('review-notes', runId)?.entries.flatMap(line => line.transaction.records)
    .some(record => record.path === executionRetirementPath(retiredId))).toBe(true);
  if (merging) {
    expect(loaded.service.committed('review-notes', runId)?.entries.flatMap(line => line.transaction.records)
      .some(record => record.path === contractsLayout.requirement(names.tagsMergedRequirement, 3))).toBe(true);
    expect(loaded.service.events('review-notes', runId)?.filter(event => event.type === 'requirement-verified')
      .some(event => event.data.requirement === names.tagsMergedRequirement && event.data.revision === 3)).toBe(true);
  }
  git.assertAnswered();
}, 120_000);

describe('a contract sub-session that ends without an agreement registers nothing', () => {
  test('a compaction handoff returns the unfinished contract once without another engineer tool', async () => {
    const root = await target();
    const plan = {
      'initial-architect': [submit(currentAnalysis(analysis([entry('review-notes', consumer)]), 'document:review-notes-plan'))],
      'local-architect': [
        submit({ ...assign(consumer, {}, outline()), localDecisions: [placeTheLimit] }),
        submit(assign(consumer, { goal: 'Carry the limit in this module after the unfinished agreement.' })),
        submit(requestCompletion()),
      ],
      engineer: [
        submit(contractNeeded),
        submit(completionProposed('The limit is carried here after the unfinished agreement.'),
          write(join(root, consumerDirectory, 'src/notes.ts'), [
            'export function addNote(note) {',
            "  return note.length <= 500 ? note : '';",
            '}',
            '',
          ].join('\n'))),
      ],
      'contract-engineer': [[
        write(`${providerDirectory}/src/interfaces/note-limit.ts`, contractFile),
        { kind: 'compaction-checkpoint' as const, reason: 'threshold' as const },
        write(`${providerDirectory}/src/after-handoff.ts`, 'Must not run.\n'),
        { kind: 'submit' as const, input: establishedContract },
      ]],
    };
    const ordinary = byRole(plan);
    const { service, agent, runId, git } = await run(root, plan, [
      accepted('work-item:review-notes', 'revision-01', [...added(seam.interface), ...modified(seam.consumer)]),
      unchanged('final verification of plan "review-notes"'),
    ], { previewHeads: ['scenarios-of-review-notes', 'scenarios-of-review-notes'],
      script: spec => spec.submission.name === 'submit_compaction_review'
      ? submit({ action: 'handoff', reason: 'The agreement needs a new approach.' })
      : typeof ordinary === 'function' ? ordinary(spec) : ordinary });

    expect(onlyRun(service, 'review-notes').state).toBe('completed');
    const log = await events(root, runId);
    expect(log.filter(event => event.type === 'compaction-reviewed').map(event => event.data.action)).toEqual(['handoff']);
    expect(log.filter(event => event.type === 'contract-registered')).toHaveLength(0);
    expect(agent!.sessions.filter(session => session.spec.role === 'contract-engineer')).toHaveLength(1);
    expect(existsSync(join(root, providerDirectory, 'src/after-handoff.ts'))).toBe(false);
    expect(log.filter(event => event.type === 'invocation-ended' && event.data.ended === 'checkpoint-pending')).toHaveLength(1);
    const result = await readJson<IterationResult>(root, runId, iterationLayout.result('work-item:review-notes', 2));
    expect(result.outcome).toBe('partial');
    expect(result.findings.some(finding => finding.includes('The agreement needs a new approach.'))).toBe(true);
    expect(typesOf(log)).not.toContain('contract-registered');
    expect(git.minted()).toEqual(['scenarios-of-review-notes', 'revision-01']);
    git.assertAnswered();
  }, 60_000);

  test('a contract session ending without submission closes partial, and the run continues', async () => {
    const root = await target();
    const { service, runId, git } = await run(root, {
      'initial-architect': [submit(currentAnalysis(analysis([entry('review-notes', consumer)]), 'document:review-notes-plan'))],
      'local-architect': [
        submit({ ...assign(consumer, {}, outline()), localDecisions: [placeTheLimit] }),
        submit(assign(consumer, { goal: 'Carry the limit in this module, since the agreement was not established.' })),
        submit(requestCompletion()),
      ],
      engineer: [
        submit(contractNeeded),
        submit(completionProposed('The limit is carried here, because the agreement was not established.'),
          write(join(root, consumerDirectory, 'src/notes.ts'), [
            'export function addNote(note) {',
            "  return note.length <= 500 ? note : '';",
            '}',
            '',
          ].join('\n'))),
      ],
      // The session writes the interface, then ends without a submission.
      'contract-engineer': [[
        write(`${providerDirectory}/src/interfaces/note-limit.ts`, contractFile),
        { kind: 'end', message: 'The provider refused the request.' },
      ]],
    }, [
      accepted('work-item:review-notes', 'revision-01', [...added(seam.interface), ...modified(seam.consumer)]),
      unchanged('final verification of plan "review-notes"'),
    ], { previewHeads: ['scenarios-of-review-notes', 'scenarios-of-review-notes'] });

    expect(onlyRun(service, 'review-notes').state, JSON.stringify(onlyRun(service, 'review-notes').failure)).toBe('completed');
    const types = typesOf(await events(root, runId));
    expect(types).toContain('contract-requested');
    expect(types).not.toContain('contract-registered');

    const result = await readJson<IterationResult>(root, runId, iterationLayout.result('work-item:review-notes', 2));
    expect(result.outcome).toBe('partial');
    expect(result.findings).toContain(
      `the module engineer (contract) of work-item:review-notes.i02 ended without a result (ended; invocation ${result.invocations[0]}); nothing was registered`,
    );
    // Its module architect is briefed with the digest and the analysis, as for a module engineer.
    expect(result.failure?.digest).toMatchObject({ invocation: result.invocations[0], role: 'contract-engineer', ended: 'ended' });
    expect(result.failure?.analysis.outcome).toBe('analyzed');
    // Successor9 still discovers this ordinary iteration separately: it
    // cannot commit the failed contract session's foreign dirty bytes. The
    // later work-item gate uses both actual recorded assignment authorities.
    const attempted = (await events(root, runId)).filter((event): event is Extract<RunEvent, { type: 'gate-attempted' }> => event.type === 'gate-attempted');
    const attempts = await Promise.all(attempted.map(event => readJson<GateAttempt>(root, runId, runLayout.gate(event.data.gate))));
    expect(attempts.find(gate => gate.subject.iteration === 'work-item:review-notes.i03')).toMatchObject({ commit: null, rules: expect.arrayContaining([expect.objectContaining({ rule: 'write-scope', outcome: 'failed' })]) });
    expect(attempts.find(gate => gate.checkpoint === 'work-item')).toMatchObject({ commit: 'revision-01', rules: expect.arrayContaining([expect.objectContaining({ rule: 'write-scope', outcome: 'passed' })]) });
    expect(git.minted()).toEqual(['scenarios-of-review-notes', 'revision-01']);
    git.assertAnswered();
  }, 60_000);
});

describe('X1b: a contract sub-session that returns incomplete registers nothing', () => {
  test('no contract and no obligation are committed, and its caller accounts for the partial work', async () => {
    const root = await target();
    const { service, runId, git } = await run(root, {
      'initial-architect': [submit(currentAnalysis(analysis([entry('review-notes', consumer)]), 'document:review-notes-plan'))],
      'local-architect': [
        submit({ ...assign(consumer, {}, outline()), localDecisions: [placeTheLimit] }),
        // Nothing was registered, so there is no requirement to wait for.
        // The caller accounts for the partial work itself.
        submit(assign(consumer, { goal: 'Carry the limit in this module, since the agreement was not established.' })),
        submit(requestCompletion()),
      ],
      engineer: [
        submit(contractNeeded),
        submit(completionProposed('The limit is carried here, because the agreement was not established.'),
          write(join(root, consumerDirectory, 'src/notes.ts'), [
            'export function addNote(note) {',
            "  return note.length <= 500 ? note : '';",
            '}',
            '',
          ].join('\n'))),
      ],
      'contract-engineer': [submit({
        kind: 'incomplete',
        done: ['read both sides of the seam'],
        unfinished: ['the fake does not pass the conformance suite yet'],
        findings: ['the limit is stated in two places that disagree'],
      }, write(`${providerDirectory}/src/interfaces/note-limit.ts`, contractFile))],
    }, [
      // Nothing was committed while the agreement was open, so the first
      // commit of the run carries the interface the unfinished session left
      // beside the work its caller carried itself.
      accepted('work-item:review-notes', 'revision-01', [...added(seam.interface), ...modified(seam.consumer)]),
      unchanged('final verification of plan "review-notes"'),
    ], { previewHeads: ['scenarios-of-review-notes', 'scenarios-of-review-notes'] });

    expect(onlyRun(service, 'review-notes').state, JSON.stringify(onlyRun(service, 'review-notes').failure)).toBe('completed');
    const log = await events(root, runId);
    const types = typesOf(log);
    expect(types).toContain('contract-requested');
    expect(types).not.toContain('contract-registered');
    expect(types).not.toContain('work-item-yielded');

    // One work item, and no provider item: registration is what starts one.
    expect(types.filter(type => type === 'work-item-started')).toHaveLength(1);
    expect(onlyRun(service, 'review-notes').counts.openRequirements).toBe(0);

    // The caller accounts for the partial work: the contract iteration's own
    // result is `partial` and says what is unfinished, and the requesting
    // work item's architect was told.
    const result = await readJson<{ outcome: string; findings: string[] }>(root, runId, iterationLayout.result('work-item:review-notes', 2));
    expect(result.outcome).toBe('partial');
    expect(result.findings.join(' ')).toContain('registered nothing');
    expect(result.findings.join(' ')).toContain('the fake does not pass the conformance suite yet');

    // One commit, for the work its caller carried: a session that registered
    // nothing has no gate and no commit of its own.
    // Successor9 still discovers this ordinary iteration separately: it
    // cannot commit the failed contract session's foreign dirty bytes. The
    // later work-item gate uses both actual recorded assignment authorities.
    const attempted = (await events(root, runId)).filter((event): event is Extract<RunEvent, { type: 'gate-attempted' }> => event.type === 'gate-attempted');
    const attempts = await Promise.all(attempted.map(event => readJson<GateAttempt>(root, runId, runLayout.gate(event.data.gate))));
    expect(attempts.find(gate => gate.subject.iteration === 'work-item:review-notes.i03')).toMatchObject({ commit: null, rules: expect.arrayContaining([expect.objectContaining({ rule: 'write-scope', outcome: 'failed' })]) });
    expect(attempts.find(gate => gate.checkpoint === 'work-item')).toMatchObject({ commit: 'revision-01', rules: expect.arrayContaining([expect.objectContaining({ rule: 'write-scope', outcome: 'passed' })]) });
    expect(git.minted()).toEqual(['scenarios-of-review-notes', 'revision-01']);
    expect(git.subjects()).toEqual(['Scenarios of review-notes', 'work-item:review-notes', 'final verification of plan \"review-notes\"']);
    git.assertAnswered();
  }, 60_000);
});
