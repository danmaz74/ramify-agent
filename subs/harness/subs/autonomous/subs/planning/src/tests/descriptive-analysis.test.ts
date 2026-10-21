import { createHash } from 'node:crypto';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { openUnchangedRuns, assertUnchangedGit } from '../../../../../../src/tests/helpers/unchanged-run.js';
import { expectNoProcesses, forgetExternalTools } from '../../../../../../src/tests/helpers/external-tools.js';
import { copyFixture } from '../../../../../../src/tests/helpers/fixture.js';
import { installTestRunner, onlyRun, runPath, startRun } from '../../../../../../src/tests/helpers/runs.js';
import { intakeToolName, checkToolName, principleToolName } from '../extraction.js';
import { initialAnalysisToolName } from '../submission.js';
import { runLayout } from '../../../../src/run/records.js';
import { documentManifestSchema } from '../../../../../plan-evidence/src/interfaces/contracts.js';
import { acceptElements, createPackage, openElementCatalog } from '../../../../../plan-evidence/src/interfaces/catalog.js';
import { descriptiveInitialAnalysisSubmissionSchema, normalizeDescriptiveAnalysis, validateDescriptiveInitialAnalysis } from '../descriptive.js';
import { acceptArchitectElements } from '../submission.js';
import { acceptAnalysis } from '../accept.js';
import { applyCheck, descriptiveCheckSubmissionSchema, normalizeDescriptiveCheck } from '../extraction.js';
import { renderFeatureFiles } from '../../../../../scenarios/src/rendering.js';
import { extractPlanScenarios } from '../../../../../scenarios/src/extraction.js';
import { scenariosCommit } from '../../../../../../src/tests/helpers/scripted-git.js';
import { requestCompletion } from '../../../../../../src/tests/helpers/analysis.js';

const hash = (text: string) => createHash('sha256').update(text).digest('hex');
vi.mock('node:child_process', async original =>
  (await import('../../../../../../src/tests/helpers/process-guard.js')).guardedChildProcess(await original<typeof import('node:child_process')>()));
const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) await cleanup();
  try { assertUnchangedGit(); expectNoProcesses(); } finally { forgetExternalTools(); }
});
const manifest = documentManifestSchema.parse({
  schema: 'ramify-agent.document-manifest/2', root: 'document:preview-plan',
  documents: [{ id: 'document:preview-plan', path: 'plans/preview/plan.md', kind: 'plan', sha256: hash('plan'), bytes: 4,
    storedAt: 'input/plan.md', revision: { commit: null, dirty: null } }],
  missing: [], principlesScan: { status: 'empty', unreadable: [] },
});
const empty = openElementCatalog(hash('manifest'), manifest, 'descriptive');
const intake = acceptElements(empty, [{ key: 'draft:non-functional-requirement:keep-snapshot-isolated', kind: 'non-functional',
  document: manifest.root, text: 'Inspection snapshots remain isolated.', conditions: [], uncertainty: '' }]);
if (!intake.ok) throw new Error(intake.errors.join('; '));
const catalog = intake.catalog;
const submission = {
  elements: [
    { key: 'draft:functional-requirement:preview-missing-predecessor', kind: 'functional', document: manifest.root,
      text: 'A preview rejects a missing predecessor.', conditions: [{ text: 'The predecessor is unknown.', source: 'stated' }], uncertainty: '' },
    { key: 'draft:functional-requirement:reject-unknown-predecessor', kind: 'functional', document: manifest.root,
      text: 'An unknown predecessor is rejected.', conditions: [], uncertainty: '' },
  ],
  entries: [{ capabilityKey: 'draft:capability:add-revision-preview', description: 'Add revision preview.', owner: 'app',
    functionalRequirementKeys: ['draft:functional-requirement:preview-missing-predecessor'],
    functionalAcceptanceKeys: ['draft:functional-requirement:reject-unknown-predecessor'], contextKeys: [], citations: [] }],
  hypotheses: [{ hypothesisKey: 'draft:hypothesis:reuse-predecessor-resolver', capabilityKey: 'draft:capability:resolve-predecessors',
    change: 'reuse', changesExistingSymbols: false, suggestedOwner: 'app', anticipatedConsumers: [], involvedModules: [],
    dependsOnHypothesisKeys: [], confidence: 'medium', rationale: 'The resolver exists.', assumptions: [], uncertainties: [], citations: [] }],
  coverageLimits: [], scenarios: [{ scenarioKey: 'draft:scenario:reject-missing-predecessor',
    entryCapabilityKey: 'draft:capability:add-revision-preview', origin: { kind: 'architect' },
    functionalAcceptanceKeys: ['draft:functional-requirement:reject-unknown-predecessor'],
    gherkin: 'Scenario: Reject missing predecessor\n  When a preview names an unknown predecessor\n  Then it is rejected' }],
  integrationScenarios: [],
};
const evidence = { index: null, catalog, planScenarios: [] };

describe('descriptive initial analysis', () => {
  test('ordinary acceptance resolves local references into one committed bundle', () => {
    const validated = validateDescriptiveInitialAnalysis(submission, evidence);
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;
    const acceptedElements = acceptArchitectElements(catalog, normalizeDescriptiveAnalysis(validated.value));
    const accepted = acceptAnalysis(acceptedElements.analysis, { identityContract: 'descriptive', invocation: 'inv-0001',
      view: { status: 'placeholder' }, planId: 'preview', planScenarios: [], index: null, catalog: acceptedElements.catalog });
    expect(acceptedElements.catalog.elements.find(item => item.id === 'functional-requirement:preview-missing-predecessor')).toMatchObject({
      text: 'A preview rejects a missing predecessor.', conditions: [{ text: 'The predecessor is unknown.', source: 'stated' }],
      document: 'document:preview-plan',
    });
    expect(accepted.entries.entries[0]).toMatchObject({ capabilityId: 'capability:add-revision-preview',
      functionalRequirementIds: ['functional-requirement:preview-missing-predecessor'] });
    expect(accepted.workItems[0]).toMatchObject({ id: 'work-item:add-revision-preview',
      functionalRequirementIds: ['functional-requirement:preview-missing-predecessor'] });
    expect(accepted.hypotheses[0]).toMatchObject({ id: 'hypothesis:reuse-predecessor-resolver',
      capability: 'capability:resolve-predecessors' });
    expect(accepted.scenarios[0]).toMatchObject({ id: 'scenario:reject-missing-predecessor',
      entry: 'capability:add-revision-preview', citedElements: ['functional-requirement:reject-unknown-predecessor'] });
    const features = renderFeatureFiles(accepted.scenarios, new Map([['scenario:reject-missing-predecessor', 'pending']]),
      { planId: 'preview', runId: 'run-1', entries: accepted.entries.entries.map(entry => ({
        capability: entry.capabilityId ?? entry.capability, description: entry.description,
      })) });
    expect(features[0]).toMatchObject({ path: expect.stringContaining('capability%3Aadd-revision-preview.feature'),
      content: expect.stringContaining('@ramify-scenario-reject-missing-predecessor') });
    const briefing = createPackage({ catalog: acceptedElements.catalog, planDeviations: [],
      elements: [...accepted.workItems[0]!.requirementRefs, ...accepted.workItems[0]!.acceptanceRefs], deviations: [] });
    expect(briefing).toHaveProperty('text');
    if ('text' in briefing) {
      expect(briefing.text).toContain('A preview rejects a missing predecessor.');
      expect(briefing.text).toContain('The predecessor is unknown.');
      expect(briefing.text).toContain('plans/preview/plan.md');
    }
    expect(accepted.records.map(record => record.body)).toEqual(expect.arrayContaining([
      expect.objectContaining({ schema: 'ramify-agent.entry-assignments/2' }),
      expect.objectContaining({ schema: 'ramify-agent.hypothesis/2' }),
      expect.objectContaining({ schema: 'ramify-agent.capability/2' }),
      expect.objectContaining({ schema: 'ramify-agent.work-item/2' }),
      expect.objectContaining({ schema: 'ramify-agent.scenario/2' }),
    ]));
    expect(acceptAnalysis(acceptedElements.analysis, { identityContract: 'descriptive', invocation: 'inv-0001',
      view: { status: 'placeholder' }, planId: 'preview', planScenarios: [], index: null, catalog: acceptedElements.catalog })).toEqual(accepted);
  });

  test('wrong stage and kind reject the whole submission with a precise field path', () => {
    const bad = structuredClone(submission);
    bad.entries[0]!.functionalRequirementKeys = ['non-functional-requirement:keep-snapshot-isolated'];
    expect(validateDescriptiveInitialAnalysis(bad, evidence)).toMatchObject({ ok: false, errors: [expect.objectContaining({
      path: 'entries.0.functionalRequirementKeys.0', message: expect.stringContaining('accepted non-functional'),
      expected: expect.stringContaining('draft:functional-requirement'),
    })] });
    expect(catalog).toEqual(intake.catalog);
  });

  test('tool schema names the draft fields rather than legacy ambiguous fields', () => {
    const shape = descriptiveInitialAnalysisSubmissionSchema.safeParse(submission);
    expect(shape.success).toBe(true);
    expect(descriptiveInitialAnalysisSubmissionSchema.safeParse({ ...submission, entries: [{
      ...submission.entries[0], requirementRefs: submission.entries[0]!.functionalRequirementKeys,
    }] }).success).toBe(false);
  });

  test('authorized catalog replacement retires its name and rewrites affected citations together', () => {
    const acceptedElements = acceptArchitectElements(catalog, normalizeDescriptiveAnalysis(descriptiveInitialAnalysisSubmissionSchema.parse(submission)));
    const check = normalizeDescriptiveCheck({
      corrections: [{ action: 'replace', reason: 'The acceptance is two distinct obligations.',
        retire: ['functional-requirement:reject-unknown-predecessor'], elements: [
          { key: 'draft:functional-requirement:reject-unknown-review-predecessor', kind: 'functional', document: manifest.root,
            text: 'An unknown review predecessor is rejected.', conditions: [], uncertainty: '' },
          { key: 'draft:functional-requirement:reject-unknown-branch-predecessor', kind: 'functional', document: manifest.root,
            text: 'An unknown branch predecessor is rejected.', conditions: [], uncertainty: '' },
        ] }],
      entries: [{ capabilityId: 'capability:add-revision-preview',
        functionalRequirementCitations: [{ functionalRequirementId: 'functional-requirement:preview-missing-predecessor' }],
        functionalAcceptanceCitations: [{ functionalRequirementKey: 'draft:functional-requirement:reject-unknown-review-predecessor' },
          { functionalRequirementKey: 'draft:functional-requirement:reject-unknown-branch-predecessor' }], contextCitations: [],
        nonBehavioralAcceptance: [] }],
      scenarios: [{ scenarioKey: 'draft:scenario:reject-missing-predecessor', functionalAcceptanceCitations: [
        { functionalRequirementKey: 'draft:functional-requirement:reject-unknown-review-predecessor' },
        { functionalRequirementKey: 'draft:functional-requirement:reject-unknown-branch-predecessor' }] }],
    });
    const result = applyCheck({ catalog: acceptedElements.catalog, analysis: acceptedElements.analysis }, manifest.root,
      'inv-0002', check, evidence);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.catalog.retired).toContain('functional-requirement:reject-unknown-predecessor');
    expect(result.catalog.replacements).toContainEqual({ retired: 'functional-requirement:reject-unknown-predecessor',
      with: ['functional-requirement:reject-unknown-review-predecessor', 'functional-requirement:reject-unknown-branch-predecessor'] });
    expect(result.analysis.entries[0]!.acceptanceRefs).toEqual([
      'functional-requirement:reject-unknown-review-predecessor', 'functional-requirement:reject-unknown-branch-predecessor',
    ]);
    expect(acceptElements(result.catalog, [{ key: 'draft:functional-requirement:reject-unknown-predecessor',
      kind: 'functional', document: manifest.root, text: 'Another obligation.', conditions: [], uncertainty: '' }])).toMatchObject({
      ok: false, errors: [expect.stringContaining('retired')],
    });
  });

  test('a split re-cites non-behavioral acceptance with its registered test and rejects retired citations', () => {
    const original = 'draft:functional-requirement:keep-snapshot-coverage';
    const review = 'draft:functional-requirement:keep-review-coverage';
    const branch = 'draft:functional-requirement:keep-branch-coverage';
    const registeredTests = new Set(['registered-coverage-test']);
    const initial = descriptiveInitialAnalysisSubmissionSchema.parse({
      ...submission,
      elements: [...submission.elements, { key: original, kind: 'functional', document: manifest.root,
        text: 'Keep snapshot coverage.', conditions: [], uncertainty: '' }],
      entries: [{ ...submission.entries[0],
        functionalAcceptanceKeys: [...submission.entries[0]!.functionalAcceptanceKeys, original],
        nonBehavioralAcceptance: [{ functionalAcceptanceKey: original, kind: 'non-behavioral', test: 'registered-coverage-test' }],
      }],
    });
    expect(validateDescriptiveInitialAnalysis(initial, { ...evidence, registeredTests }).ok).toBe(true);
    const accepted = acceptArchitectElements(catalog, normalizeDescriptiveAnalysis(initial));
    const correction = descriptiveCheckSubmissionSchema.parse({
      corrections: [{ action: 'replace', reason: 'The coverage has separate review and branch obligations.',
        retire: ['functional-requirement:keep-snapshot-coverage'], elements: [
          { key: review, kind: 'functional', document: manifest.root, text: 'Keep review coverage.', conditions: [], uncertainty: '' },
          { key: branch, kind: 'functional', document: manifest.root, text: 'Keep branch coverage.', conditions: [], uncertainty: '' },
        ] }],
      entries: [{ capabilityId: 'capability:add-revision-preview',
        functionalRequirementCitations: [{ functionalRequirementId: 'functional-requirement:preview-missing-predecessor' }],
        functionalAcceptanceCitations: [
          { functionalRequirementId: 'functional-requirement:reject-unknown-predecessor' },
          { functionalRequirementKey: review }, { functionalRequirementKey: branch },
        ], contextCitations: [],
        nonBehavioralAcceptance: [
          { functionalAcceptanceCitation: { functionalRequirementKey: review }, kind: 'non-behavioral', test: 'registered-coverage-test' },
          { functionalAcceptanceCitation: { functionalRequirementKey: branch }, kind: 'non-behavioral', test: 'registered-coverage-test' },
        ],
      }],
      scenarios: [],
    });
    const state = { catalog: accepted.catalog, analysis: accepted.analysis };
    const result = applyCheck(state, manifest.root, 'inv-0002', normalizeDescriptiveCheck(correction),
      { ...evidence, registeredTests });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.analysis.entries[0]!.nonBehavioralAcceptance).toEqual([
      { ref: 'functional-requirement:keep-review-coverage', kind: 'non-behavioral', test: 'registered-coverage-test' },
      { ref: 'functional-requirement:keep-branch-coverage', kind: 'non-behavioral', test: 'registered-coverage-test' },
    ]);
    expect(result.catalog.retired).toContain('functional-requirement:keep-snapshot-coverage');
    const missing = applyCheck(state, manifest.root, 'inv-0002', normalizeDescriptiveCheck({ ...correction,
      entries: [{ ...correction.entries[0]!, nonBehavioralAcceptance: [] }],
    }), { ...evidence, registeredTests });
    expect(missing).toMatchObject({ ok: false, errors: [expect.objectContaining({
      path: 'entries.0.acceptanceRefs.1', message: expect.stringContaining('registered test'),
    })] });
    const unregistered = applyCheck(state, manifest.root, 'inv-0002', normalizeDescriptiveCheck({ ...correction,
      entries: [{ ...correction.entries[0]!, nonBehavioralAcceptance: [
        { ...correction.entries[0]!.nonBehavioralAcceptance[0]!, test: 'unregistered-test' },
        correction.entries[0]!.nonBehavioralAcceptance[1]!,
      ] }],
    }), { ...evidence, registeredTests });
    expect(unregistered).toMatchObject({ ok: false, errors: [expect.objectContaining({
      path: 'entries.0.nonBehavioralAcceptance.0.test', message: expect.stringContaining('not a registered test'),
    })] });
    const retired = applyCheck({ catalog: result.catalog, analysis: result.analysis }, manifest.root, 'inv-0003',
      normalizeDescriptiveCheck({ corrections: [], scenarios: [], entries: [{ ...correction.entries[0]!,
        functionalAcceptanceCitations: [{ functionalRequirementId: 'functional-requirement:keep-snapshot-coverage' }],
        nonBehavioralAcceptance: [{ functionalAcceptanceCitation: { functionalRequirementId: 'functional-requirement:keep-snapshot-coverage' },
          kind: 'non-behavioral', test: 'registered-coverage-test' }],
      }] }), { ...evidence, registeredTests });
    expect(retired).toMatchObject({ ok: false, errors: expect.arrayContaining([
      expect.objectContaining({ message: expect.stringContaining('retired') }),
    ]) });
  });

  test('a run captures its opt-in format and accepts the descriptive analysis through ordinary task tools', async () => {
    const fixture = await copyFixture();
    const seen: string[] = [];
    cleanups.push(fixture.remove);
    await installTestRunner(fixture.root);
    const { service, agent } = await openUnchangedRuns(fixture.root, { identityContract: 'descriptive',
      unchangedCheckpoints: ['final verification of plan "review-notes"'],
      script: spec => {
        seen.push(`${spec.role}:${spec.submission.name}`);
        if (spec.submission.name === intakeToolName) {
          const documents = [...spec.prompt.matchAll(/^- (document:[a-z0-9-]+) \(plan\):/gmu)].map(match => match[1]!);
          seen.push(`documents:${documents.join(',')};prompt:${spec.prompt.slice(0, 200)}`);
          return [{ kind: 'submit', input: { goal: 'Add reviewer notes.', elements: [],
            incorporation: { documents: documents.map(document => ({ document, scenarios: true, uncertainty: '' })), missing: [] } } }];
        }
        if (spec.submission.name === principleToolName) return [{ kind: 'submit', input: { elements: [] } }];
        if (spec.submission.name === checkToolName) return [{ kind: 'submit', input: { corrections: [], entries: [], scenarios: [] } }];
        if (spec.submission.name === initialAnalysisToolName) return [{ kind: 'submit', input: {
          elements: [], entries: [], hypotheses: [], coverageLimits: [], scenarios: [], integrationScenarios: [],
        } }];
        return [{ kind: 'end' }];
      },
    });
    cleanups.push(() => service.close());
    const receipt = await service.execute(startRun('review-notes'));
    await service.settled('review-notes', receipt.jobId);
    expect(onlyRun(service, 'review-notes').state, JSON.stringify({ snapshot: onlyRun(service, 'review-notes'), seen, verdicts: agent?.sessions.map(session => session.verdicts) })).toBe('completed');
    const run = JSON.parse(await readFile(runPath(fixture.root, 'review-notes', receipt.jobId, runLayout.record), 'utf8')) as Record<string, unknown>;
    expect(run.identityContract).toBe('descriptive');
    const captured = JSON.parse(await readFile(runPath(fixture.root, 'review-notes', receipt.jobId, runLayout.documentManifest), 'utf8')) as Record<string, unknown>;
    expect(captured.schema).toBe('ramify-agent.document-manifest/2');
    const entries = JSON.parse(await readFile(runPath(fixture.root, 'review-notes', receipt.jobId, runLayout.entries), 'utf8')) as Record<string, unknown>;
    expect(entries.schema).toBe('ramify-agent.entry-assignments/2');
    const directory = runPath(fixture.root, 'review-notes', receipt.jobId, '');
    const schemas: string[] = [];
    for (const path of (await readdir(directory, { recursive: true })).filter(path => path.endsWith('.json'))) {
      const body = JSON.parse(await readFile(`${directory}/${path}`, 'utf8')) as { schema?: string };
      if (body.schema !== undefined) schemas.push(body.schema);
    }
    expect(schemas).toEqual(expect.arrayContaining([
      'ramify-agent.document-manifest/2', 'ramify-agent.element-catalog/2', 'ramify-agent.document-incorporation/3',
      'ramify-agent.entry-assignments/2',
    ]));
  }, 180_000);

  test('root duplicate origins keep their captured IDs through incorporation and accepted features', async () => {
    const fixture = await copyFixture();
    cleanups.push(fixture.remove);
    await installTestRunner(fixture.root);
    const planPath = join(fixture.root, 'plans', 'review-notes', 'plan.md');
    const plan = [await readFile(planPath, 'utf8'), '', '## Scenarios', '', '```gherkin',
      'Scenario: A note is shown', '  When the reviewer opens the review', '  Then the note is shown', '```', '',
      '```gherkin', 'Scenario: A note is shown', '  When the reviewer opens the archive', '  Then the note is shown', '```', ''].join('\n');
    await writeFile(planPath, plan);
    let root = '';
    let origins: ReturnType<typeof extractPlanScenarios>['scenarios'] = [];
    const { service, agent } = await openUnchangedRuns(fixture.root, { identityContract: 'descriptive',
      unchangedCheckpoints: [scenariosCommit('review-notes'), 'work-item:add-revision-preview', 'final verification of plan "review-notes"'],
      script: spec => {
        if (spec.submission.name === intakeToolName) {
          const documents = [...spec.prompt.matchAll(/^- (document:[a-z0-9-]+) \(plan\):/gmu)].map(match => match[1]!);
          root = documents[0]!;
          origins = extractPlanScenarios(plan, root, 'descriptive').scenarios;
          return [{ kind: 'submit', input: { goal: 'Show notes.', elements: [], incorporation: {
            documents: documents.map(document => ({ document, scenarios: true, uncertainty: '' })), missing: [],
          } } }];
        }
        if (spec.submission.name === principleToolName) return [{ kind: 'submit', input: { elements: [] } }];
        if (spec.submission.name === checkToolName) return [{ kind: 'submit', input: { corrections: [], entries: [], scenarios: [] } }];
        if (spec.submission.name === initialAnalysisToolName) return [{ kind: 'submit', input: { ...submission,
          elements: submission.elements.map(element => ({ ...element, document: root })),
          entries: [{ ...submission.entries[0]!, owner: 'collection-review/workspace/reviews' }],
          scenarios: origins.map((origin, index) => ({ scenarioKey: `draft:scenario:note-shown-${index + 1}`,
            entryCapabilityKey: 'draft:capability:add-revision-preview', origin: { kind: 'plan' as const, planScenarioId: origin.id },
            functionalAcceptanceKeys: ['draft:functional-requirement:reject-unknown-predecessor'],
            gherkin: origin.source.join('\n') })),
        } }];
        return [{ kind: 'submit', input: { ...requestCompletion(), reports: origins.map((_, index) => ({
          id: `scenario:note-shown-${index + 1}`, judgment: 'done' as const, basedOnRevision: 0,
        })) } }];
      },
    });
    cleanups.push(() => service.close());
    const command = startRun('review-notes');
    const [receipt, duplicate] = await Promise.all([service.execute(command), service.execute(command)]);
    expect(duplicate).toEqual(receipt);
    await service.settled('review-notes', receipt.jobId);
    expect(onlyRun(service, 'review-notes').state,
      JSON.stringify(agent?.sessions.map(session => session.verdicts))).toBe('completed');
    expect(origins).toHaveLength(2);
    expect(origins[0]!.id).not.toBe(origins[1]!.id);
    const record = JSON.parse(await readFile(runPath(fixture.root, 'review-notes', receipt.jobId, runLayout.record), 'utf8')) as {
      planScenarios: { scenarios: typeof origins };
    };
    expect(record.planScenarios.scenarios.map(origin => [origin.id, origin.document, origin.source])).toEqual(
      origins.map(origin => [origin.id, origin.document, origin.source]));
    for (const [index, origin] of origins.entries()) {
      const accepted = JSON.parse(await readFile(runPath(fixture.root, 'review-notes', receipt.jobId,
        runLayout.scenario(`scenario:note-shown-${index + 1}`)), 'utf8')) as { origin: unknown; source: string[]; file: string };
      expect(accepted.origin).toMatchObject({ kind: 'plan', planScenario: origin.id,
        ref: { document: root, lines: origin.lines } });
      expect(accepted.source).toEqual(origin.source);
      const feature = await readFile(join(fixture.root, accepted.file), 'utf8');
      expect(feature).toContain(`@ramify-scenario-note-shown-${index + 1}`);
      expect(feature).toContain(origin.source.at(-1)!);
    }
    const directory = runPath(fixture.root, 'review-notes', receipt.jobId, '');
    const transactions = (await readFile(join(directory, runLayout.events), 'utf8')).trim().split('\n')
      .map(line => JSON.parse(line) as { event: { type: string }; records: Array<{ path: string; id: string }> });
    const accepted = transactions.filter(line => line.event.type === 'analysis-accepted');
    expect(accepted).toHaveLength(1);
    expect(accepted[0]!.records.map(record => record.path)).toEqual(expect.arrayContaining([
      runLayout.entries, runLayout.scenario('scenario:note-shown-1'), runLayout.scenario('scenario:note-shown-2'),
    ]));
    await service.close();
    await rm(join(directory, runLayout.scenario('scenario:note-shown-2')));
    const reopened = await openUnchangedRuns(fixture.root, { identityContract: 'descriptive' });
    cleanups.push(() => reopened.service.close());
    expect(reopened.recovery.rematerialized.some(entry => entry.startsWith(`review-notes/${receipt.jobId}`))).toBe(true);
    expect(await reopened.service.execute(command)).toEqual(receipt);
    expect(reopened.service.events('review-notes', receipt.jobId)?.filter(event => event.type === 'analysis-accepted')).toHaveLength(1);
    expect(JSON.parse(await readFile(join(directory, runLayout.scenario('scenario:note-shown-2')), 'utf8'))).toMatchObject({
      id: 'scenario:note-shown-2', origin: { planScenario: origins[1]!.id },
    });
  }, 180_000);

  test('an acceptance-boundary interruption replays one complete nonempty descriptive bundle and its lost command reply', async () => {
    const fixture = await copyFixture();
    cleanups.push(fixture.remove);
    await installTestRunner(fixture.root);
    let root = '';
    let interrupted = false;
    let enteredBoundary!: () => void;
    let leaveBoundary!: () => void;
    const atBoundary = new Promise<void>(resolve => { enteredBoundary = resolve; });
    const releaseBoundary = new Promise<void>(resolve => { leaveBoundary = resolve; });
    const { service, agent } = await openUnchangedRuns(fixture.root, { identityContract: 'descriptive',
      afterWrite: async write => {
        if (write === 'analysis-accepted' && !interrupted) {
          interrupted = true;
          enteredBoundary();
          await releaseBoundary;
          throw new Error('Injected interruption after durable acceptance');
        }
      },
      script: spec => {
        if (spec.submission.name === intakeToolName) {
          const documents = [...spec.prompt.matchAll(/^- (document:[a-z0-9-]+) \(plan\):/gmu)].map(match => match[1]!);
          root = documents[0]!;
          return [{ kind: 'submit', input: { goal: 'Add reviewer notes.', elements: [],
            incorporation: { documents: documents.map(document => ({ document, scenarios: true, uncertainty: '' })), missing: [] } } }];
        }
        if (spec.submission.name === principleToolName) return [{ kind: 'submit', input: { elements: [] } }];
        if (spec.submission.name === checkToolName) return [{ kind: 'submit', input: { corrections: [], entries: [], scenarios: [] } }];
        if (spec.submission.name === initialAnalysisToolName) return [{ kind: 'submit', input: {
          ...submission, elements: submission.elements.map(element => ({ ...element, document: root })),
          entries: [{ ...submission.entries[0]!, owner: 'collection-review/workspace/reviews' }],
        } }];
        return [{ kind: 'end' }];
      },
    });
    cleanups.push(() => service.close());
    const command = startRun('review-notes');
    const receipt = await service.execute(command);
    await atBoundary;
    const overlapped = await service.execute(command);
    expect(overlapped).toEqual(receipt);
    leaveBoundary();
    await service.settled('review-notes', receipt.jobId);
    expect(interrupted).toBe(true);
    expect(onlyRun(service, 'review-notes').state,
      JSON.stringify(agent?.sessions.map(session => session.verdicts))).toBe('failed');
    const directory = runPath(fixture.root, 'review-notes', receipt.jobId, '');
    const transactions = (await readFile(join(directory, runLayout.events), 'utf8')).trim().split('\n')
      .map(line => JSON.parse(line) as { event: { type: string; data?: { evidence?: { catalog?: { path: string } } } }; records: Array<{ path: string }> });
    const accepted = transactions.filter(line => line.event.type === 'analysis-accepted');
    expect(accepted).toHaveLength(1);
    expect(accepted[0]!.records.map(record => record.path)).toEqual(expect.arrayContaining([
      runLayout.entries, runLayout.scenario('scenario:reject-missing-predecessor'),
      'work-items/work-item%3Aadd-revision-preview/item.json',
    ]));
    expect(accepted[0]!.records.some(record => record.path.startsWith('analysis/catalog/'))).toBe(false);
    const catalogPath = accepted[0]!.event.data!.evidence!.catalog!.path;
    const catalog = JSON.parse(await readFile(join(directory, catalogPath), 'utf8')) as { elements: Array<{ id: string }> };
    expect(catalog.elements.map(element => element.id)).toEqual(expect.arrayContaining([
      'functional-requirement:preview-missing-predecessor', 'functional-requirement:reject-unknown-predecessor',
    ]));
    await service.close();
    await rm(join(directory, runLayout.entries));
    await rm(join(directory, runLayout.scenario('scenario:reject-missing-predecessor')));
    const reopened = await openUnchangedRuns(fixture.root, { identityContract: 'descriptive' });
    cleanups.push(() => reopened.service.close());
    expect(reopened.recovery.rematerialized.some(entry => entry.startsWith(`review-notes/${receipt.jobId}`))).toBe(true);
    expect(await reopened.service.execute(command)).toEqual(receipt);
    expect(reopened.service.events('review-notes', receipt.jobId)?.filter(event => event.type === 'analysis-accepted')).toHaveLength(1);
    const entries = JSON.parse(await readFile(join(directory, runLayout.entries), 'utf8')) as { entries: Array<{ capabilityId?: string; acceptanceRefs: string[] }> };
    expect(entries.entries).toMatchObject([{ capabilityId: 'capability:add-revision-preview',
      acceptanceRefs: ['functional-requirement:reject-unknown-predecessor'] }]);
    const scenario = JSON.parse(await readFile(join(directory, runLayout.scenario('scenario:reject-missing-predecessor')), 'utf8')) as {
      id: string; entry: string; citedElements: string[];
    };
    expect(scenario).toMatchObject({ id: 'scenario:reject-missing-predecessor', entry: 'capability:add-revision-preview',
      citedElements: ['functional-requirement:reject-unknown-predecessor'] });
  }, 180_000);
});
