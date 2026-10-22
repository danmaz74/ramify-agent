import { openUnchangedRuns as openRuns, assertUnchangedGit } from '../../../../../../src/tests/helpers/unchanged-run.js';
import { scenariosCommit } from '../../../../../../src/tests/helpers/scripted-git.js';
import { expectNoProcesses, forgetExternalTools } from '../../../../../../src/tests/helpers/external-tools.js';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { SessionSpec } from '../../../../../agent/src/interfaces/port.js';
import type { ArchitectIndex } from '../../../../../evidence/src/views.js';
import { extractPlanScenarios } from '../../../../../scenarios/src/extraction.js';
import { scenarioSourceHash, type ScenarioRecord } from '../../../../../scenarios/src/records.js';
import { acceptAnalysis } from '../accept.js';
import { acceptArchitectElements, type AnalysisRecordInputs } from '../submission.js';
import { validateDescriptiveInitialAnalysis } from '../descriptive.js';
import { documentManifestSchema } from '../../../../../plan-evidence/src/interfaces/contracts.js';
import { openElementCatalog } from '../../../../../plan-evidence/src/interfaces/catalog.js';
import { runLayout, runRecordSchema } from '../../../../src/run/records.js';
import { type InvocationOutcome } from '../../../../../task-execution/src/records.js';
import { runSnapshot } from '../../../../src/run/snapshot.js';
import { constructedRecord } from '../../../../../../src/tests/helpers/constructed.js';
import { copyFixture } from '../../../../../../src/tests/helpers/fixture.js';
import { analysis, architectScenario, currentAnalysis, entry, requestCompletion } from '../../../../../../src/tests/helpers/analysis.js';
import { installTestRunner, onlyRun, runEventsOnDisk, runPath, shapeOnlyInputs, startRun } from '../../../../../../src/tests/helpers/runs.js';
import { architectIndex, moduleEntry } from '../../../../../../src/tests/helpers/views.js';
const extractScenarioFixture = (text: string) => extractPlanScenarios(text, 'document:fixture-plan');


/*
 * The acceptance scenarios of the initial analysis, `initial-architect/2`:
 * the plan's own scenarios captured with the plan and shown to the plan
 * architect, the form rules applied after every other rule under the same
 * repeated correction, and one frozen `ScenarioRecord` per scenario committed by
 * `analysis-accepted` beside the entries, every one `pending`.
 */

vi.mock('node:child_process', async original =>
  (await import('../../../../../../src/tests/helpers/process-guard.js')).guardedChildProcess(await original<typeof import('node:child_process')>()));

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) await cleanup();
  try { assertUnchangedGit(); expectNoProcesses(); } finally { forgetExternalTools(); }
});

/** The catalog before the architect's elements, over one captured plan. */
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const catalog = openElementCatalog(hash('manifest'), documentManifestSchema.parse({
  schema: 'ramify-agent.document-manifest/2', root: 'document:fixture-plan',
  documents: [{ id: 'document:fixture-plan', path: 'plans/p/plan.md', kind: 'plan', sha256: hash('plan'), bytes: 4, storedAt: 'input/plan.md', revision: { commit: null, dirty: null } }],
  missing: [], principlesScan: { status: 'empty', unreadable: [] },
}));

const reviews = 'collection-review/workspace/reviews';
const sharedUi = 'collection-review/workspace/shared-ui';

/** The fixture's `review-notes` plan with a section of scenarios: a background, two scenarios, and a block that does not parse. */
async function planWithScenarios(root: string): Promise<string> {
  const path = join(root, 'plans', 'review-notes', 'plan.md');
  const plan = [
    (await readFile(path, 'utf8')).trimEnd(),
    '',
    '## Scenarios',
    '',
    '```gherkin',
    'Feature: Reviewer notes',
    '',
    '  Background:',
    '    Given a completed review run of the record "rec-1"',
    '',
    '  Scenario: A reviewer attaches a note',
    '    When the reviewer attaches the note "Looks right"',
    '    Then the review run shows the note "Looks right"',
    '',
    '  Scenario: The panel shows an attached note',
    '    When the reviewer attaches the note "Checked"',
    '    And the reviewer opens the review panel',
    '    Then the panel shows the note "Checked" under the findings',
    '```',
    '',
    '```gherkin',
    'Scenario: A note is too long',
    '  Given a note of 501 characters',
    '  this line is not a step',
    '```',
    '',
  ].join('\n');
  await writeFile(path, plan);
  return plan;
}

/**
 * The analysis of that plan: plan-scenario:a-reviewer-attaches-a-note is the note entry's own plan scenario,
 * and plan-scenario:the-panel-shows-an-attached-note an integration scenario decomposed into one sub-scenario per
 * entry, the panel's bridged with a Given.
 */
function scenarioAnalysis(plan: string): AnalysisRecordInputs {
  const [attach, panel] = extractScenarioFixture(plan).scenarios;
  const note = entry('reviewer-note', reviews, 'A reviewer can attach one note to a completed review run.');
  const inPanel = entry('note-in-panel', sharedUi, 'The review panel shows the note under the findings.');
  return analysis([note, inPanel], [], [], [
    { key: 'attach-note', entry: 'reviewer-note', origin: { kind: 'plan', planScenario: attach!.id }, refs: [...note.acceptanceRefs], gherkin: attach!.source.join('\n') },
    {
      key: 'attach-for-panel', entry: 'reviewer-note', origin: { kind: 'architect' }, partOf: panel!.id,
      gherkin: [
        'Scenario: A note is attached for the panel',
        '  Given a completed review run of the record "rec-1"',
        '  When the reviewer attaches the note "Checked"',
        '  Then the review run shows the note "Checked"',
      ].join('\n'),
    },
    {
      key: 'panel-shows-note', entry: 'note-in-panel', origin: { kind: 'architect' }, partOf: panel!.id, refs: [...inPanel.acceptanceRefs],
      gherkin: [
        'Scenario: The panel shows the attached note',
        '  Given the note "Checked" was attached to the review run',
        '  When the reviewer opens the review panel',
        '  Then the panel shows the note "Checked" under the findings',
      ].join('\n'),
    },
  ], [{ planScenario: panel!.id, subScenarios: ['attach-for-panel', 'panel-shows-note'] }]);
}

/** The scripted fake: the default catalog extraction, the analysis, then a module architect that asks for completion. */
function script(initial: unknown) {
  return (spec: SessionSpec) => spec.role === 'catalog-extractor' ? []
    : [{ kind: 'submit' as const, input: spec.role === 'initial-architect'
      ? currentAnalysis(initial as AnalysisRecordInputs, 'document:review-notes-plan') : requestCompletion() }];
}

async function target(): Promise<string> {
  const fixture = await copyFixture();
  cleanups.push(fixture.remove);
  await installTestRunner(fixture.root);
  return fixture.root;
}

describe('plan capture', () => {
  test('a plan with gherkin blocks: its scenarios and the unparsable block are in job.json and in the initial architect\'s briefing', async () => {
    const project = await target();
    const plan = await planWithScenarios(project);
    const { service, agent } = await openRuns(project, {
      script: script(scenarioAnalysis(plan)),
      unchangedCheckpoints: [scenariosCommit('review-notes'), 'work-item:reviewer-note', 'work-item:note-in-panel', 'work-item:bind-the-panel-shows-an-attached-note', 'final verification of plan "review-notes"'],
    });
    cleanups.push(() => service.close());
    const receipt = await service.execute(startRun('review-notes'));
    await service.settled('review-notes', receipt.jobId);
    expect(onlyRun(service, 'review-notes').state, JSON.stringify(onlyRun(service, 'review-notes'))).toBe('completed');

    const record = runRecordSchema.parse(JSON.parse(await readFile(runPath(project, 'review-notes', receipt.jobId, runLayout.record), 'utf8')));
    expect(record.planScenarios).toEqual(extractPlanScenarios(plan, 'document:review-notes-plan'));
    expect(record.planScenarios.scenarios.map(scenario => [scenario.id, scenario.name])).toEqual([
      ['plan-scenario:a-reviewer-attaches-a-note', 'A reviewer attaches a note'],
      ['plan-scenario:the-panel-shows-an-attached-note', 'The panel shows an attached note'],
    ]);
    expect(record.planScenarios.limitations).toHaveLength(1);
    const [limitation] = record.planScenarios.limitations;

    // The briefing lists each by ID, with its text and plan lines, and the limitation.
    const prompt = agent!.sessions.find(session => session.spec.role === 'initial-architect')!.spec.prompt;
    const [attach, panel] = record.planScenarios.scenarios;
    // The intake incorporated the root plan's scenarios, so they are the plan's, not candidates.
    expect(prompt).toContain('# The plan\'s scenarios');
    expect(prompt).toContain(`## plan-scenario:a-reviewer-attaches-a-note: A reviewer attaches a note\n\nLines ${attach!.lines[0]}–${attach!.lines[1]} of document:review-notes-plan.`);
    expect(prompt).toContain(`## plan-scenario:the-panel-shows-an-attached-note: The panel shows an attached note\n\nLines ${panel!.lines[0]}–${panel!.lines[1]} of document:review-notes-plan.`);
    expect(prompt).toContain('Complete scenario body, including examples, is in the captured plan block above');
    expect(prompt).toContain('include every applicable Feature/Rule Background condition');
    expect(prompt.split('When the reviewer attaches the note \"Looks right\"')).toHaveLength(2);
    expect(prompt).toContain('  Given a completed review run of the record "rec-1"');
    expect(prompt).toContain(`- Plan lines ${limitation!.lines[0]}–${limitation!.lines[1]}: `);
    expect(prompt).toContain('this line is not a step');
  }, 180_000);

  test('a plan without gherkin blocks says so in one line, and records no scenario and no limitation', async () => {
    const project = await target();
    const { service, agent } = await openRuns(project, {
      script: script(analysis([entry('reviewer-note', reviews)])),
      unchangedCheckpoints: [scenariosCommit('review-notes'), 'work-item:reviewer-note', 'final verification of plan "review-notes"'],
    });
    cleanups.push(() => service.close());
    const receipt = await service.execute(startRun('review-notes'));
    await service.settled('review-notes', receipt.jobId);

    const record = runRecordSchema.parse(JSON.parse(await readFile(runPath(project, 'review-notes', receipt.jobId, runLayout.record), 'utf8')));
    expect(record.planScenarios).toEqual({ schema: 'ramify-agent.plan-scenario-extraction/2', scenarios: [], limitations: [] });
    const prompt = agent!.sessions.find(session => session.spec.role === 'initial-architect')!.spec.prompt;
    expect(prompt).toContain('The plan has no `gherkin` block, so it states no scenario: write every entry\'s scenarios yourself.');
    expect(prompt).not.toContain('## plan-scenario:a-reviewer-attaches-a-note');
  }, 180_000);
});

describe('acceptance', () => {
  test('analysis-accepted commits one pending scenario record per scenario, with IDs, owners, hashes and the integration owner', async () => {
    const project = await target();
    const plan = await planWithScenarios(project);
    const { service } = await openRuns(project, {
      script: script(scenarioAnalysis(plan)),
      unchangedCheckpoints: [scenariosCommit('review-notes'), 'work-item:reviewer-note', 'work-item:note-in-panel', 'work-item:bind-the-panel-shows-an-attached-note', 'final verification of plan "review-notes"'],
    });
    cleanups.push(() => service.close());
    const receipt = await service.execute(startRun('review-notes'));
    await service.settled('review-notes', receipt.jobId);
    const runId = receipt.jobId;

    const [attach, panel] = extractScenarioFixture(plan).scenarios;
    const read = async (id: string) => JSON.parse(await readFile(runPath(project, 'review-notes', runId, runLayout.scenario(id)), 'utf8')) as ScenarioRecord;
    const records = await Promise.all(['scenario:attach-note', 'scenario:attach-for-panel', 'scenario:panel-shows-note', 'scenario:the-panel-shows-an-attached-note'].map(read));
    const features = 'src/tests/features/review-notes';

    // Entry scenarios in submission order, then the integration scenario.
    expect(records.map(record => [record.id, record.kind, record.entry, record.owner, record.partOf, record.subScenarios, record.file])).toEqual([
      ['scenario:attach-note', 'entry', 'capability:reviewer-note', reviews, null, [], `subs/workspace/subs/reviews/${features}/capability%3Areviewer-note.feature`],
      ['scenario:attach-for-panel', 'entry', 'capability:reviewer-note', reviews, 'scenario:the-panel-shows-an-attached-note', [], `subs/workspace/subs/reviews/${features}/capability%3Areviewer-note.feature`],
      ['scenario:panel-shows-note', 'entry', 'capability:note-in-panel', sharedUi, 'scenario:the-panel-shows-an-attached-note', [], `subs/workspace/subs/shared-ui/${features}/capability%3Anote-in-panel.feature`],
      // The lowest common ancestor of the sub-scenarios' owners.
      ['scenario:the-panel-shows-an-attached-note', 'integration', null, 'collection-review/workspace', null, ['scenario:attach-for-panel', 'scenario:panel-shows-note'], `subs/workspace/${features}/integration.feature`],
    ]);
    // A plan scenario keeps the plan's lines and text, background folded in.
    expect(records[0]!.origin).toEqual({ kind: 'plan', planScenario: 'plan-scenario:a-reviewer-attaches-a-note', ref: { document: 'document:review-notes-plan', lines: attach!.lines } });
    expect(records[0]!.source).toEqual(attach!.source);
    expect(records[3]!.origin).toEqual({ kind: 'plan', planScenario: 'plan-scenario:the-panel-shows-an-attached-note', ref: { document: 'document:review-notes-plan', lines: panel!.lines } });
    expect(records[3]!.source).toEqual(panel!.source);
    // The architect's keys became element IDs: the second entry's acceptance element is functional-requirement:note-in-panel-acceptance.
    expect(records[2]!.origin).toEqual({ kind: 'architect', refs: ['functional-requirement:note-in-panel-acceptance'] });
    expect(records[2]!.name).toBe('The panel shows the attached note');
    for (const record of records) expect(record.hash).toBe(scenarioSourceHash(record.source));

    // One transaction: the event carries every scenario beside the entries, and its data counts them.
    const lines = (await readFile(runPath(project, 'review-notes', runId, runLayout.events), 'utf8')).split('\n').filter(Boolean)
      .map(line => JSON.parse(line) as { event: { type: string; data: Record<string, unknown> }; records: Array<{ path: string; id: string }> });
    const accepted = lines.find(line => line.event.type === 'analysis-accepted')!;
    expect(accepted.event.data).toMatchObject({ entries: 2, workItems: 2, scenarios: 4, warnings: [] });
    expect(accepted.records.filter(entry => entry.path.startsWith('scenarios/')).map(entry => entry.id)).toEqual(['scenario:attach-note', 'scenario:attach-for-panel', 'scenario:panel-shows-note', 'scenario:the-panel-shows-an-attached-note']);
    expect(accepted.records.map(entry => entry.path)).toEqual(expect.arrayContaining([runLayout.entries, 'work-items/work-item%3Areviewer-note/item.json']));

    // Every record was committed pending. Each work item's completion request
    // then reported its entry's scenarios done; the done report of the last
    // sub-scenario created the integration work item at the common ancestor,
    // whose request reported the integration scenario done.
    expect(onlyRun(service, 'review-notes').counts.scenarios).toEqual({ pending: 0, bound: 0, done: 4 });
    const events = await runEventsOnDisk(project, 'review-notes', runId);
    const global = events.find(event => event.type === 'invocation-started' && event.data.role === 'initial-architect')!;
    if (global.type !== 'invocation-started') throw new Error('plan architect expected');
    const outcome = JSON.parse(await readFile(runPath(project, 'review-notes', runId, runLayout.outcome(global.data.invocation)), 'utf8')) as InvocationOutcome;
    expect(outcome.session?.ref).toEqual(expect.any(String));
    const globalTarget = { role: 'global-fork', run: { planId: 'review-notes', runId }, session: global.data.session,
      point: { session: global.data.session, invocation: global.data.invocation }, ref: outcome.session!.ref };
    const started = events.filter(event => event.type === 'work-item-started').map(event => event.data);
    expect(started).toEqual([
      { workItem: 'work-item:reviewer-note', module: reviews, origin: 'entry', globalTarget },
      { workItem: 'work-item:note-in-panel', module: sharedUi, origin: 'entry', globalTarget },
      { workItem: 'work-item:bind-the-panel-shows-an-attached-note', module: 'collection-review/workspace', origin: 'integration', scenario: 'scenario:the-panel-shows-an-attached-note', globalTarget },
    ]);
    // The submission is recorded under the analysis's version.
    // inv-0001 is the intake; the architect's is the second invocation.
    expect(outcome.ended).toBe('submitted');
    const submission = JSON.parse(await readFile(runPath(project, 'review-notes', runId, runLayout.submission('inv-0002')), 'utf8')) as { schema: string };
    expect(submission.schema).toBe('ramify-agent.initial-analysis/4');
  }, 180_000);

  test('with an architect view: a module\'s own directory and testing area, and every warning, by scenario ID', async () => {
    const project = await target();
    const index: ArchitectIndex = architectIndex([
      moduleEntry('collection-review', '', null),
      moduleEntry('collection-review/workspace', 'subs/workspace', 'collection-review'),
      moduleEntry(reviews, 'subs/workspace/subs/reviews', 'collection-review/workspace'),
      moduleEntry(`${reviews}/checks`, 'subs/workspace/subs/reviews/subs/checks', reviews, { tags: ['testing'] }),
      // Readiness judges the fixture's scenario support code against the view.
      moduleEntry('collection-review/integration-tests', 'subs/integration-tests', 'collection-review', { tags: ['testing', 'dispatch'] }),
    ], new Map([[reviews, [{ module: reviews, name: 'attachReviewNote', file: 'subs/workspace/subs/reviews/src/notes.ts' }]]]));
    const plan = await planWithScenarios(project);
    const [, panel] = extractScenarioFixture(plan).scenarios;
    const note = entry('reviewer-note', reviews);
    const checks = entry('note-checks', `${reviews}/checks`);
    const step = (text: string) => `Scenario: ${text}\n  When the reviewer attaches the note "Checked"\n  Then the review run shows the note "Checked"`;
    const submitted = analysis([note, checks], [], [], [
      {
        key: 'attach-note', entry: 'reviewer-note', origin: { kind: 'architect' }, refs: [...note.acceptanceRefs],
        gherkin: 'Scenario: The note is stored\n  When the reviewer calls attachReviewNote with "Checked"\n  Then notes.ts holds the note "Checked"',
      },
      { key: 'attach-again', entry: 'reviewer-note', origin: { kind: 'architect' }, gherkin: step('The note is attached once') },
      { key: 'attach-twice', entry: 'reviewer-note', origin: { kind: 'architect' }, gherkin: step('The note is attached twice') },
      {
        key: 'panel-all', entry: 'note-checks', origin: { kind: 'architect' }, partOf: panel!.id, refs: [...checks.acceptanceRefs],
        gherkin: ['Scenario: The whole panel', ...panel!.source.slice(1)].join('\n'),
      },
      {
        key: 'panel-unrelated', entry: 'note-checks', origin: { kind: 'architect' }, partOf: panel!.id,
        gherkin: 'Scenario: Nothing of the panel\n  Given a reviewer\n  Then nothing happens',
      },
    ], [{ planScenario: panel!.id, subScenarios: ['panel-all', 'panel-unrelated'] }]);
    // The attached scenario also comes from the plan and appears as an origin once.
    const [attach] = extractScenarioFixture(plan).scenarios;
    submitted.scenarios.push({ key: 'plan-attach', entry: 'reviewer-note', origin: { kind: 'plan', planScenario: attach!.id }, gherkin: attach!.source.join('\n') });

    const { service } = await openRuns(project, {
      inputs: { ...shapeOnlyInputs, index: async () => index },
      script: script(submitted),
      unchangedCheckpoints: [scenariosCommit('review-notes'), 'work-item:reviewer-note', 'work-item:note-checks', 'work-item:bind-the-panel-shows-an-attached-note', 'final verification of plan "review-notes"'],
    });
    cleanups.push(() => service.close());
    const receipt = await service.execute(startRun('review-notes'));
    await service.settled('review-notes', receipt.jobId);

    const events = await runEventsOnDisk(project, 'review-notes', receipt.jobId);
    const accepted = events.find(event => event.type === 'analysis-accepted')!;
    if (accepted.type !== 'analysis-accepted') throw new Error('unreachable');
    expect(accepted.data.scenarios).toBe(7);
    expect(accepted.data.warnings.map(warning => [warning.kind, warning.scenarios])).toEqual([
      ['names-view-symbol', ['scenario:attach-note']],
      ['names-view-file', ['scenario:attach-note']],
      ['sub-scenario-shares-no-step', ['scenario:panel-unrelated']],
      ['duplicate-architect-steps', ['scenario:attach-again', 'scenario:attach-twice']],
    ]);

    // A testing module's features sit in its own src/, and the integration
    // scenario of two sub-scenarios of one owner is that owner's.
    const read = async (id: string) => JSON.parse(await readFile(runPath(project, 'review-notes', receipt.jobId, runLayout.scenario(id)), 'utf8')) as ScenarioRecord;
    expect((await read('scenario:panel-all')).file).toBe('subs/workspace/subs/reviews/subs/checks/src/features/review-notes/capability%3Anote-checks.feature');
    const integration = await read('scenario:the-panel-shows-an-attached-note');
    expect([integration.kind, integration.owner, integration.file]).toEqual(['integration', `${reviews}/checks`, 'subs/workspace/subs/reviews/subs/checks/src/features/review-notes/integration.feature']);
    expect(onlyRun(service, 'review-notes').state).toBe('completed');
  }, 180_000);

  test('without a view, a proposed owner is placed where its proposal puts it', () => {
    const proposed = entry('note-archive', 'collection-review/archive', 'Keeps notes.', { parent: 'collection-review', directory: 'subs/archive/', purpose: 'Keeps notes.', tags: ['testing'] });
    const submitted = analysis([proposed, entry('reviewer-note', reviews)]);
    expect(validateDescriptiveInitialAnalysis(currentAnalysis(submitted, 'document:fixture-plan'), { index: null, catalog, planScenarios: [] }).ok).toBe(true);
    const resolved = acceptArchitectElements(catalog, submitted);
    const accepted = acceptAnalysis(resolved.analysis, { invocation: 'inv-0002', view: { status: 'placeholder' }, planId: 'p', planScenarios: [], index: null, catalog: resolved.catalog });
    expect(accepted.scenarios.map(record => [record.id, record.owner, record.file])).toEqual([
      ['scenario:a-person-uses-note-archive', 'collection-review/archive', 'subs/archive/src/features/p/capability%3Anote-archive.feature'],
      ['scenario:a-person-uses-reviewer-note', reviews, 'subs/workspace/subs/reviews/src/tests/features/p/capability%3Areviewer-note.feature'],
    ]);
    expect(accepted.warnings).toEqual([]);
  });
});

describe('the form rules, through the real validation path', () => {
  const planScenarios = extractScenarioFixture(['# A plan', '', '## Request', '', 'Do the thing.', '', '## Acceptance', '', 'It is done.', '', '## Scenarios', '', '```gherkin', 'Scenario: It works', '  When it is used', '  Then it works', '```'].join('\n')).scenarios;
  const one = entry('reviewer-note', reviews);
  const own = { key: 'plan-one', entry: 'reviewer-note', origin: { kind: 'plan' as const, planScenario: 'plan-scenario:it-works' }, gherkin: 'Scenario: It works\n  When it is used\n  Then it works' };
  const valid = analysis([one], [], [], [own, architectScenario(one)]);
  const rejected = (submission: AnalysisRecordInputs) => {
    const result = validateDescriptiveInitialAnalysis(currentAnalysis(submission, 'document:fixture-plan'), { index: null, catalog, planScenarios });
    if (result.ok) throw new Error('the submission was accepted');
    return result.errors;
  };

  test('the valid analysis is accepted', () => {
    expect(validateDescriptiveInitialAnalysis(currentAnalysis(valid, 'document:fixture-plan'), { index: null, catalog, planScenarios }).ok).toBe(true);
  });

  test('rule 1: a gherkin value that is not one untagged scenario with a step', () => {
    const errors = rejected({ ...valid, scenarios: [own, { ...architectScenario(one), gherkin: '@tagged\nScenario: Tagged\n  Given a' }] });
    expect(errors).toHaveLength(1);
    expect(errors[0]!.path).toBe('scenarios.1.gherkin');
    expect(errors[0]!.message).toMatch(/^Scenario form rule 1 \(one scenario per gherkin value\)/);
    expect(errors[0]!.expected).toBe('a submission that keeps scenario form rule 1');
  });

  test('rule 2: a scenario naming no entry of the submission', () => {
    const errors = rejected({ ...valid, scenarios: [own, { ...architectScenario(one), entry: 'elsewhere' }] });
    expect([errors[0]!.path, errors[0]!.message]).toEqual(['scenarios.1.entryCapabilityKey', expect.stringMatching(/^Scenario form rule 2 /)]);
  });

  test('rule 3: a plan scenario that is missing, or restated otherwise', () => {
    expect(rejected({ ...valid, scenarios: [architectScenario(one)] })[0]!.message).toMatch(/^Scenario form rule 3 .*plan-scenario:it-works/);
    const paraphrased = rejected({ ...valid, scenarios: [{ ...own, gherkin: 'Scenario: It works\n  When it is used\n  Then it works well' }, architectScenario(one)] });
    expect([paraphrased[0]!.path, paraphrased[0]!.message]).toEqual(['scenarios.0.gherkin', expect.stringMatching(/^Scenario form rule 3 .*as the plan states it/)]);
  });

  test('rule 4: an entry without a scenario', () => {
    const two = entry('note-in-panel', sharedUi);
    const errors = rejected(analysis([one, two], [], [], [own, architectScenario(one)]));
    expect([errors[0]!.path, errors[0]!.message]).toEqual(['entries.1', expect.stringMatching(/^Scenario form rule 4 .*"note-in-panel" has no scenario/)]);
  });

  test('rule 5: an integration step no sub-scenario picks', () => {
    const two = entry('note-in-panel', sharedUi);
    const sub = { key: 'use-it', entry: 'note-in-panel', origin: { kind: 'architect' as const }, partOf: 'plan-scenario:it-works', refs: [...two.acceptanceRefs], gherkin: 'Scenario: Used\n  When it is used\n  Then it is used' };
    const errors = rejected(analysis([one, two], [], [], [architectScenario(one), sub], [{ planScenario: 'plan-scenario:it-works', subScenarios: ['use-it'] }]));
    expect([errors[0]!.path, errors[0]!.message]).toEqual(['integrationScenarios.0.subScenarioKeys', expect.stringMatching(/^Scenario form rule 5 .*"Then it works"/)]);
  });

  test('rule 6: an acceptance element no scenario cites', () => {
    const errors = rejected({ ...valid, scenarios: [own, { ...architectScenario(one), refs: [] }] });
    expect([errors[0]!.path, errors[0]!.message]).toEqual(['entries.0.functionalAcceptanceKeys.0', expect.stringMatching(/^Scenario form rule 6 /)]);
  });

  test('the form rules follow every other rule: an analysis with other errors answers those alone', () => {
    const errors = rejected({ ...valid, entries: [{ ...one, requirementRefs: ['nowhere'] }], scenarios: [] });
    expect(errors.map(error => error.path)).toEqual(['entries.0.functionalRequirementKeys.0']);
  });

  test('an architect scenario\'s refs name functional elements of the submission', () => {
    const errors = rejected({ ...valid, scenarios: [own, { ...architectScenario(one), refs: [...one.acceptanceRefs, 'nowhere'] }] });
    expect(errors.map(error => error.path)).toEqual(['scenarios.1.functionalAcceptanceKeys.1']);
  });

  test('the capability slug "integration" is reserved for the integration scenarios\' file', () => {
    const reserved = entry('integration', reviews);
    const errors = rejected(analysis([reserved]));
    expect(errors.map(error => error.path)).toEqual(['entries.0.capabilityKey']);
    expect(errors[0]!.message).toContain('integration.feature');
  });

});

describe('a form rule broken in a run', () => {
  test('a form-rule correction is accepted after four rejections in the same invocation', async () => {
    const project = await target();
    const noScenario = analysis([entry('reviewer-note', reviews)], [], [], []);
    const { service, agent } = await openRuns(project, {
      script: (spec: SessionSpec) => spec.role === 'catalog-extractor' ? [] : spec.role === 'initial-architect'
        ? [...Array.from({ length: 4 }, () => ({ kind: 'submit' as const, input: currentAnalysis(noScenario, 'document:review-notes-plan') })), { kind: 'submit' as const, input: currentAnalysis(analysis([entry('reviewer-note', reviews)]), 'document:review-notes-plan') }]
        : [{ kind: 'submit' as const, input: requestCompletion() }],
      unchangedCheckpoints: [scenariosCommit('review-notes'), 'work-item:reviewer-note', 'final verification of plan "review-notes"'],
    });
    cleanups.push(() => service.close());
    const receipt = await service.execute(startRun('review-notes'));
    await service.settled('review-notes', receipt.jobId);

    // The intake's session is the first; the architect's the second.
    const verdicts = agent!.sessions[1]!.verdicts;
    expect(verdicts).toHaveLength(5);
    const first = JSON.parse((verdicts[0] as { errors: string[] }).errors[0]!.split('\n\n')[0]!) as { errors: Array<{ path: string; message: string }> };
    expect(first.errors).toEqual([expect.objectContaining({ path: 'entries.0', message: expect.stringMatching(/^Scenario form rule 4 /) })]);
    expect(first).not.toHaveProperty('remainingAttempts');
    expect(verdicts.at(-1)).toEqual({ accepted: true });

    const snapshot = onlyRun(service, 'review-notes');
    expect(snapshot.state).toBe('completed');
    const outcome = JSON.parse(await readFile(runPath(project, 'review-notes', receipt.jobId, runLayout.outcome('inv-0002')), 'utf8')) as InvocationOutcome;
    expect(outcome).toMatchObject({ ended: 'submitted', rejectedSubmissions: 4 });
    const events = await runEventsOnDisk(project, 'review-notes', receipt.jobId);
    expect(events.some(event => event.type === 'analysis-accepted')).toBe(true);
  }, 180_000);
});

describe('the snapshot\'s scenario counts', () => {
  test('are zero before the analysis, all pending after it, and follow the scenario events', () => {
    const at = '2026-09-23T08:00:00.000Z';
    let sequence = 0;
    const line = (type: string, data: unknown) => ({ sequence: ++sequence, jobId: constructedRecord().jobId, at, type, data });
    const accepted = line('analysis-accepted', { invocation: 'inv-0001', entries: 1, hypotheses: 0, registry: 1, workItems: 1, scenarios: 3,
      scenarioIds: ['scenario:note-attached', 'scenario:note-shown', 'scenario:note-archived'], warnings: [] });
    const record = constructedRecord();
    type Events = Parameters<typeof runSnapshot>[1];
    expect(runSnapshot(record, [] as unknown as Events).counts.scenarios).toEqual({ pending: 0, bound: 0, done: 0 });
    expect(runSnapshot(record, [accepted] as unknown as Events).counts.scenarios).toEqual({ pending: 3, bound: 0, done: 0 });
    // A module engineer's binding and an architect's report move states; a gate result moves none.
    const moved = [
      accepted,
      line('obligation-bound', { id: 'scenario:note-attached', fakes: [], by: 'inv-0003', submission: 'a'.repeat(64) }),
      line('obligation-bound', { id: 'scenario:note-shown', fakes: ['createLimitFake'], by: 'inv-0003', submission: 'a'.repeat(64) }),
      line('obligation-reported', { id: 'scenario:note-attached', judgment: 'done', basedOnRevision: 0, revision: 1, by: 'inv-0004', submission: 'b'.repeat(64) }),
    ];
    expect(runSnapshot(record, moved as unknown as Events).counts.scenarios).toEqual({ pending: 1, bound: 1, done: 1 });
  });
});
