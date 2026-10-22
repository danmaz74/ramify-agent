import { afterEach, describe, expect, test, vi } from 'vitest';
import { join } from 'node:path';
import { analysis, currentAnalysis, entry, requestCompletion } from '../../../../../../src/tests/helpers/analysis.js';
import { finalCandidate } from '../../../acceptance/src/tests/helpers/final-candidate.js';
import { copyFixture } from '../../../../../../src/tests/helpers/fixture.js';
import { localDecision, registryChange } from './helpers/placement.js';
import { addModule, assign, byRole, completionProposed, installMiniRunner, outline, submit, treeInputs, write } from '../../../../../../src/tests/helpers/iterations.js';
import { onlyRun, openRuns, runEventsOnDisk, startRun, stopRun, until } from '../../../../../../src/tests/helpers/runs.js';
import { accepted, added, answeredGit, modified, unchanged, type CommitResponse, scenariosCommitted } from './helpers/contracts-git.js';
import { expectNoProcesses, forgetExternalTools } from '../../../../../../src/tests/helpers/external-tools.js';

vi.mock('node:child_process', async original =>
  (await import('../../../../../../src/tests/helpers/process-guard.js')).guardedChildProcess(await original<typeof import('node:child_process')>()));
import {
  consumerAgainstReal, consumerStub, consumerTest, contractNeeded, contractWrites, established, paths, providerWrites,
  type Seam,
} from './helpers/contracts.js';
import type { RunEvent } from '../../../../src/run/log.js';

/*
 * P5: how the harness schedules a delegation when an obligation is shared,
 * when a chain of changes runs back through a module that has already
 * yielded, and when a capability comes to depend on itself.
 *
 * A cycle is a cycle of capabilities. A cycle of modules is not one, and a
 * cycle of changes is not one either, which is what the second test shows.
 *
 * Each scenario states what Git reports for every commit its run attempts,
 * and the scheduling is then read from the run's own ledger and records.
 */

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  try {
    for (const cleanup of cleanups.splice(0)) await cleanup();
    expectNoProcesses();
  } finally { forgetExternalTools(); }
});

const notes = 'collection-review/workspace/reviews/notes';
const notesDirectory = 'subs/workspace/subs/reviews/subs/notes';
const tags = 'collection-review/workspace/reviews/tags';
const tagsDirectory = 'subs/workspace/subs/reviews/subs/tags';
const limits = 'collection-review/workspace/reviews/limits';
const limitsDirectory = 'subs/workspace/subs/reviews/subs/limits';

const noteLimit: Seam = {
  capability: 'note-limit',
  name: 'NoteLimit',
  providerDirectory: limitsDirectory,
  provider: limits,
  consumerDirectory: notesDirectory,
  consumerFile: 'notes.ts',
  reach: '../../limits',
  behavior: 'A note of at most 500 characters is within the limit; a longer one is not.',
};

const tagLimit: Seam = { ...noteLimit, consumerDirectory: tagsDirectory, consumerFile: 'tags.ts' };

/**
 * A run whose Git answers are this scenario's own fixture data: the
 * revisions it reports for each commit the harness attempts, and the
 * attempts it reports as an unchanged tree.
 */
async function run(root: string, plan: Parameters<typeof byRole>[0], commits: readonly CommitResponse[], stopAtCycleCount?: number,
  previewHeads: readonly string[] = []) {
  const materialization = scenariosCommitted('review-notes');
  const final = commits.findIndex(commit => commit.subject.startsWith('final verification'));
  const before = commits.slice(0, final).flatMap(commit => commit.commit ?? []).at(-1) ?? materialization.commit!;
  const candidate = final < 0 ? null : finalCandidate(root, before, commits[final]!.commit ?? before);
  const git = answeredGit(root, { head: 'revision-00', commits: [materialization, ...commits],
    previews: [...previewHeads.map(head => ({ repositoryRoot: root, head, tree: 'a'.repeat(40) })), ...(candidate?.previews ?? [])] });
  const opened = await openRuns(root, {
    script: byRole({ 'nonfunctional-coordinator': [submit({ kind: 'assessment', results: [] })], ...plan }), inputs: treeInputs(), git, ...(candidate === null ? {} : { candidates: candidate.candidates }),
  });
  cleanups.push(() => opened.service.close());
  const receipt = await opened.service.execute(startRun('review-notes'));
  if (stopAtCycleCount !== undefined) {
    await until(() => (opened.service.events('review-notes', receipt.jobId) ?? [])
      .filter(event => event.type === 'dependency-cycle-detected').length >= stopAtCycleCount);
    for (let retry = 0; retry < 20; retry += 1) {
      try {
        await opened.service.execute(stopRun('review-notes', receipt.jobId, opened.service.getRun('review-notes', receipt.jobId)!.version));
        break;
      } catch (error) {
        if (!String(error).includes('at version') || retry === 19) throw error;
      }
    }
  }
  await opened.service.settled('review-notes', receipt.jobId);
  return { ...opened, git, runId: receipt.jobId };
}

async function fixtureWith(modules: ReadonlyArray<{ directory: string; name: string; files: Record<string, string> }>) {
  const fixture = await copyFixture();
  cleanups.push(fixture.remove);
  for (const module of modules) await addModule(fixture.root, module.directory, module.name, module.files);
  await installMiniRunner(fixture.root);
  return fixture.root;
}

function place(capability: string, owner: string) {
  const id = `capability:${capability}`;
  return { ...localDecision(
    {
      question: `Where does ${capability} belong?`,
      outcome: 'reuse',
      capability: id,
      owner,
      rationale: 'The rule is a capability of its own, in a subtree this architect may place work in.',
    },
    [registryChange({ capability: id, owner, behavior: `The module provides ${capability}.` })],
  ), decisionKey: `draft:placement-decision:${capability}` };
}

const yieldFor = (requirements: readonly string[]) => ({
  kind: 'yield-for-providers' as const,
  requirements: [...requirements],
  summary: 'This work item runs against its fakes and waits for the real providers.',
});

async function events(root: string, runId: string): Promise<RunEvent[]> {
  return runEventsOnDisk(root, 'review-notes', runId);
}

function attached(seam: Seam) {
  const { contractKey, providerObligationKey, ...proposal } = established(seam);
  void contractKey;
  void providerObligationKey;
  return { ...proposal, contractId: `contract:${seam.capability}`,
    providerObligationId: `provider-obligation:${seam.capability}` };
}

describe('P5: a shared obligation runs its provider once and each consumer verifies separately', () => {
  test('a second consumer attaches its own requirement and reuses the current provider work', async () => {
    const root = await fixtureWith([
      { directory: notesDirectory, name: 'notes', files: { 'src/notes.ts': consumerStub, 'src/tests/notes.test.ts': consumerTest('notes.ts') } },
      { directory: tagsDirectory, name: 'tags', files: { 'src/tags.ts': consumerStub, 'src/tests/tags.test.ts': consumerTest('tags.ts') } },
      { directory: limitsDirectory, name: 'limits', files: {} },
    ]);

    // What Git reports for this scenario: the agreement's own files when the
    // contract iteration establishes them, the provider's when it implements
    // them, each consumer's when it moves off the fake, and an unchanged tree
    // for every gate that follows a commit without a write of its own.
    const note = paths(noteLimit);
    const tag = paths(tagLimit);
    const { service, runId, git } = await run(root, {
      'initial-architect': [submit(currentAnalysis(analysis([entry('review-notes', notes), entry('review-tags', tags)]), 'document:review-notes-plan'))],
      'local-architect': [
        submit({ ...assign(notes, {}, outline()), localDecisions: [place('note-limit', limits)] }),
        submit(yieldFor(['consumer-requirement:notes-note-limit'])),
        submit(assign(limits, {}, outline({ changes: 'Implement the agreed limit.' }))),
        submit(requestCompletion()),
        submit(assign(notes, { kind: 'verification', goal: 'Replace the fake with the real limit.' })),
        submit(requestCompletion()),
        // The second consumer. Its provider has already conformed, so it
        // attaches and verifies without a provider execution of its own.
        submit(assign(tags, {}, outline())),
        submit(assign(tags, { kind: 'verification', goal: 'Replace the fake with the real limit.' })),
        submit(requestCompletion()),
      ],
      engineer: [
        submit(contractNeeded(noteLimit)),
        submit(completionProposed('The real limit is implemented and the agreed suite runs against it.'), ...providerWrites(noteLimit, root)),
        submit(completionProposed('The notes now use the real limit.'), write(join(root, paths(noteLimit).consumer), consumerAgainstReal(noteLimit))),
        submit(contractNeeded(tagLimit)),
        submit(completionProposed('The tags now use the real limit.'), write(join(root, paths(tagLimit).consumer), consumerAgainstReal(tagLimit))),
      ],
      'contract-engineer': [
        submit(established(noteLimit), ...contractWrites(noteLimit)),
        // The same agreement, a second consumer: only the integration differs.
        submit(attached(tagLimit), write(paths(tagLimit).consumer, consumerAgainstReal(tagLimit).replace('createNoteLimit(', 'createNoteLimitFake(').replace('/src/note-limit.ts', '/src/fakes/note-limit.fake.ts').replace('{ createNoteLimit }', '{ createNoteLimitFake }'))),
      ],
    }, [
      accepted('work-item:review-notes.i02', 'revision-01', [...added(note.contract, note.fake, note.subjects, note.conformance), ...modified(note.consumer)]),
      accepted('work-item:provide-note-limit.i01', 'revision-02', [...added(note.real), ...modified(note.subjects)]),
      unchanged('work-item:provide-note-limit'),
      accepted('work-item:review-notes.i03', 'revision-03', modified(note.consumer)),
      unchanged('work-item:review-notes'),
      accepted('work-item:review-tags.i02', 'revision-04', modified(tag.consumer)),
      accepted('work-item:review-tags.i03', 'revision-05', modified(tag.consumer)),
      unchanged('work-item:review-tags'),
      unchanged('final verification of plan "review-notes"'),
    ], undefined, ['revision-01', 'revision-04']);

    expect(onlyRun(service, 'review-notes').failure).toBeNull();
    expect(onlyRun(service, 'review-notes').state).toBe('completed');
    const log = await events(root, runId);

    // One contract, one obligation, one provider execution.
    const registrations = log.filter(event => event.type === 'contract-registered');
    expect(registrations).toHaveLength(2);
    expect(registrations[0]!.data).toMatchObject({ contract: 'contract:note-limit', revision: 1, obligation: 'provider-obligation:note-limit', requirements: ['consumer-requirement:notes-note-limit'], providerWorkItem: 'work-item:provide-note-limit' });
    // The second registration adds its requirement and its binding, and
    // nothing else: the same contract, the same obligation revision, and the
    // provider work item the first one started.
    expect(registrations[1]!.data).toMatchObject({ contract: 'contract:note-limit', revision: 1, obligation: 'provider-obligation:note-limit', requirements: ['consumer-requirement:tags-note-limit'], providerWorkItem: 'work-item:provide-note-limit' });

    expect(log.filter(event => event.type === 'provider-conformed')).toHaveLength(1);
    // Each consumer verifies separately, against the one provider.
    const verifications = log.filter(event => event.type === 'requirement-verified');
    expect(verifications.map(event => event.data.requirement)).toEqual(['consumer-requirement:notes-note-limit', 'consumer-requirement:tags-note-limit']);
    expect(verifications.map(event => event.data.workItem)).toEqual(['work-item:review-notes', 'work-item:review-tags']);

    // Three work items: two entry consumers and one provider.
    expect(log.filter(event => event.type === 'work-item-started')).toHaveLength(3);
    expect(log.filter(event => event.type === 'work-item-completed')).toHaveLength(3);
    expect(onlyRun(service, 'review-notes').counts.openRequirements).toBe(0);
    expect(onlyRun(service, 'review-notes').notices).toEqual([]);

    // The run committed on its own branch, once for each gate, and recorded
    // the revisions Git reported for the five that changed the tree.
    expect(git.branch()).toBe(`ramify-agent-run/${runId}`);
    expect(git.minted()).toEqual(['scenarios-of-review-notes', 'revision-01', 'revision-02', 'revision-03', 'revision-04', 'revision-05']);
    git.assertAnswered();
  }, 60_000);
});

describe('P5: a chain of changes back through a module that has yielded is not a cycle', () => {
  test('change 1 in A needing change 2 in B needing change 3 in A completes 3, 2, 1 with no notice', async () => {
    const noteFormat: Seam = {
      capability: 'note-format',
      name: 'NoteFormat',
      providerDirectory: notesDirectory,
      provider: notes,
      consumerDirectory: limitsDirectory,
      consumerFile: 'limit-work.ts',
      reach: '../../notes',
      behavior: 'A note is formatted before the limit is applied to it.',
    };

    const root = await fixtureWith([
      {
        directory: notesDirectory,
        name: 'notes',
        files: { 'src/notes.ts': consumerStub, 'src/tests/notes.test.ts': consumerTest('notes.ts') },
      },
      {
        directory: limitsDirectory,
        name: 'limits',
        files: { 'src/limit-work.ts': consumerStub, 'src/tests/limit-work.test.ts': consumerTest('limit-work.ts') },
      },
    ]);

    const limit = paths(noteLimit);
    const format = paths(noteFormat);
    const { service, runId, git } = await run(root, {
      'initial-architect': [submit(currentAnalysis(analysis([entry('review-notes', notes)]), 'document:review-notes-plan'))],
      'local-architect': [
        // work-item:review-notes in A: it needs the limit, which is B's.
        submit({ ...assign(notes, {}, outline()), localDecisions: [place('note-limit', limits)] }),
        submit(yieldFor(['consumer-requirement:notes-note-limit'])),
        // work-item:provide-note-limit in B, the provider of the limit: it needs the format, which
        // is A's. A has a work item yielded, and this need still starts a
        // work item of its own.
        submit({ ...assign(limits, {}, outline({ changes: 'Implement the agreed limit.' })), localDecisions: [place('note-format', notes)] }),
        submit(yieldFor(['consumer-requirement:limit-work-note-format'])),
        // work-item:provide-note-format in A, the provider of the format.
        submit(assign(notes, {}, outline({ changes: 'Implement the agreed format.' }))),
        submit(requestCompletion()),
        // work-item:provide-note-limit, resumed: replace the format fake with the real one and
        // implement the limit it owes, so the agreed suites pass against
        // both real providers.
        submit(assign(limits, { kind: 'verification', goal: 'Replace the format fake with the real one, and implement the limit this work item owes.' })),
        submit(requestCompletion()),
        // work-item:review-notes, resumed: verify the limit.
        submit(assign(notes, { kind: 'verification', goal: 'Replace the limit fake with the real one.' })),
        submit(requestCompletion()),
      ],
      engineer: [
        submit(contractNeeded(noteLimit)),
        submit(contractNeeded(noteFormat)),
        submit(completionProposed('The real format is implemented.'), ...providerWrites(noteFormat, root)),
        submit(completionProposed('The limit work uses the real format, and the real limit is implemented.'),
          write(join(root, paths(noteFormat).consumer), consumerAgainstReal(noteFormat)),
          ...providerWrites(noteLimit, root)),
        submit(completionProposed('The notes use the real limit.'), write(join(root, paths(noteLimit).consumer), consumerAgainstReal(noteLimit))),
      ],
      'contract-engineer': [
        submit(established(noteLimit), ...contractWrites(noteLimit)),
        submit(established(noteFormat), ...contractWrites(noteFormat)),
      ],
    }, [
      accepted('work-item:review-notes.i02', 'revision-01', [...added(limit.contract, limit.fake, limit.subjects, limit.conformance), ...modified(limit.consumer)]),
      accepted('work-item:provide-note-limit.i02', 'revision-02', [...added(format.contract, format.fake, format.subjects, format.conformance), ...modified(format.consumer)]),
      accepted('work-item:provide-note-format.i01', 'revision-03', [...added(format.real), ...modified(format.subjects)]),
      unchanged('work-item:provide-note-format'),
      accepted('work-item:provide-note-limit.i03', 'revision-04', [...added(limit.real), ...modified(format.consumer, limit.subjects)]),
      unchanged('work-item:provide-note-limit'),
      accepted('work-item:review-notes.i03', 'revision-05', modified(limit.consumer)),
      unchanged('work-item:review-notes'),
      unchanged('final verification of plan "review-notes"'),
    ], undefined, ['revision-01', 'revision-02']);

    expect(onlyRun(service, 'review-notes').failure).toBeNull();
    expect(onlyRun(service, 'review-notes').state).toBe('completed');
    const log = await events(root, runId);

    // Three capabilities, three work items, two of them in module A.
    expect(log.filter(event => event.type === 'work-item-started')).toHaveLength(3);
    const started = log.filter(event => event.type === 'work-item-started').map(event => event.data);
    expect(started.filter(data => data.module === notes).map(data => data.workItem)).toEqual(['work-item:review-notes', 'work-item:provide-note-format']);

    // They complete in the order 3, 2, 1.
    expect(log.filter(event => event.type === 'work-item-completed').map(event => event.data.workItem)).toEqual(['work-item:provide-note-format', 'work-item:provide-note-limit', 'work-item:review-notes']);

    // No cycle: the nodes of the graph are capabilities, so a chain that
    // runs back through a module is an ordinary chain.
    expect(log.map(event => event.type)).not.toContain('dependency-cycle-detected');
    expect(onlyRun(service, 'review-notes').notices).toEqual([]);

    // The second provider work item was started for the item that yielded,
    // which is what the depth-first stack records.
    const resumed = log.filter(event => event.type === 'work-item-resumed').map(event => event.data.workItem);
    expect(resumed).toEqual(['work-item:provide-note-limit', 'work-item:review-notes']);

    // Each provider and each consumer committed once, in the order the chain
    // completed, and the gates between them changed nothing.
    expect(git.minted()).toEqual(['scenarios-of-review-notes', 'revision-01', 'revision-02', 'revision-03', 'revision-04', 'revision-05']);
    git.assertAnswered();
  }, 60_000);
});

describe('P5: a capability that transitively depends on itself', () => {
  test('repeated dependency cycles remain visible for architect reconsideration', async () => {
    // The provider of the limit needs the very capability its consumer is
    // implementing. The graph closes on itself.
    const backToNotes: Seam = {
      capability: 'review-notes',
      name: 'ReviewNotes',
      providerDirectory: notesDirectory,
      provider: notes,
      consumerDirectory: limitsDirectory,
      consumerFile: 'limit-work.ts',
      reach: '../../notes',
      behavior: 'The limit reports what the review notes say about it.',
    };

    const root = await fixtureWith([
      { directory: notesDirectory, name: 'notes', files: { 'src/notes.ts': consumerStub, 'src/tests/notes.test.ts': consumerTest('notes.ts') } },
      { directory: limitsDirectory, name: 'limits', files: { 'src/limit-work.ts': consumerStub, 'src/tests/limit-work.test.ts': consumerTest('limit-work.ts') } },
    ]);

    const limit = paths(noteLimit);
    const back = paths(backToNotes);
    const { service, runId, git } = await run(root, {
      'initial-architect': [submit(currentAnalysis(analysis([entry('review-notes', notes)]), 'document:review-notes-plan'))],
      'local-architect': [
        submit({ ...assign(notes, {}, outline()), localDecisions: [place('note-limit', limits)] }),
        submit(yieldFor(['consumer-requirement:notes-note-limit'])),
        // work-item:provide-note-limit, the provider of the limit: its engineer asks for the
        // capability its own consumer is implementing.
        submit(assign(limits, {}, outline({ changes: 'Implement the agreed limit.' }))),
        // The cycle came back here. The re-plan asks for the same thing.
        submit(assign(limits, { goal: 'Try the same need again.' })),
      ],
      engineer: [
        submit(contractNeeded(noteLimit)),
        submit(contractNeeded(backToNotes)),
        submit(contractNeeded(backToNotes)),
      ],
      'contract-engineer': [
        submit(established(noteLimit), ...contractWrites(noteLimit)),
        submit(established(backToNotes), ...contractWrites(backToNotes)),
        submit({ ...attached(backToNotes), consumerRequirementKey: 'draft:consumer-requirement:limit-work-review-notes-retry' }),
      ],
    }, [
      accepted('work-item:review-notes.i02', 'revision-01', [...added(limit.contract, limit.fake, limit.subjects, limit.conformance), ...modified(limit.consumer)]),
      accepted('work-item:provide-note-limit.i02', 'revision-02', [...added(back.contract, back.fake, back.subjects, back.conformance), ...modified(back.consumer)]),
      // The second attempt at the same agreement writes the same files with
      // the same content, and Git reports an unchanged tree for it.
      unchanged('work-item:provide-note-limit.i04'),
    ], 2, ['revision-01', 'revision-02']);

    const snapshot = onlyRun(service, 'review-notes');
    expect(snapshot.state).toBe('stopped');
    expect(snapshot.failure).toBeNull();

    const log = await events(root, runId);
    const detections = log.filter(event => event.type === 'dependency-cycle-detected');
    expect(detections).toHaveLength(2);
    for (const detection of detections) {
      expect(detection.data.members).toEqual(['capability:note-limit', 'capability:review-notes']);
      expect(detection.data.closedBy).toBe('work-item:provide-note-limit');
    }
    expect(detections.map(event => event.data.detection)).toEqual([1, 2]);

    // The first detection returned to the module architect of the work item
    // whose registration closed it, before anything else was invoked.
    const first = log.indexOf(detections[0]!);
    const next = log.slice(first + 1).find(event => event.type === 'invocation-started');
    expect(next?.data.role).toBe('local-architect');

    // Every detected cycle is a notice the person sees, resolved or not.
    const notices = snapshot.notices.filter(notice => notice.kind === 'dependency-cycle');
    expect(notices).toHaveLength(2);
    expect(notices[0]).toMatchObject({ cycle: ['capability:note-limit', 'capability:review-notes'], closedBy: 'work-item:provide-note-limit', resolved: false });
    expect(notices[0]!.summary).toContain('capability:note-limit → capability:review-notes → capability:note-limit');

    // The run that failed on the cycle still committed what each agreement
    // established, and its repeat of the same agreement committed nothing.
    expect(git.minted()).toEqual(['scenarios-of-review-notes', 'revision-01', 'revision-02']);
    expect(git.subjects().at(-1)).toContain('work-item:provide-note-limit.i04');
    git.assertAnswered();
  }, 60_000);
});
