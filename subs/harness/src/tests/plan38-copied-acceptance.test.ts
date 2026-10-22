import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { beforeAll, describe, expect, test } from 'vitest';
import { documentManifestSchema } from '../../subs/plan-evidence/src/interfaces/contracts.js';
import {
  acceptElements, createPackage, elementCatalogHash, elementCatalogSchema, openElementCatalog,
  type ElementCatalog,
} from '../../subs/plan-evidence/src/interfaces/catalog.js';
import { extractDocumentScenarios, type PlanScenario } from '../../subs/scenarios/src/extraction.js';
import { applyCheck, checkMessage, type CheckState, type CheckSubmission, type ExtractionInputs } from '../../subs/autonomous/subs/planning/src/extraction.js';
import { type AnalysisEvidence } from '../../subs/autonomous/subs/planning/src/submission.js';
import { descriptiveInitialAnalysisSubmissionSchema, acceptDescriptiveArchitectElements, validateDescriptiveInitialAnalysis } from '../../subs/autonomous/subs/planning/src/descriptive.js';
import { acceptAnalysis } from '../../subs/autonomous/subs/planning/src/accept.js';
import { briefed, engineerScenarioSection } from '../../subs/autonomous/subs/work-coordination/src/work/scenario-briefing.js';
import { architectScenarioSections } from '../../subs/autonomous/subs/work-coordination/src/work/session.js';
import { loadPromptPackages, type LoadedPackage } from '../prompts/packages.js';
import { stableRoleInstructions } from '../../subs/task-workflow/src/prompts/tasks.js';
import type { Role } from '../interfaces/protocol/runs.js';

// Source content was captured from run 20261011T143710Z-e572ca, harness 8d5e4684,
// then assigned current descriptive identities. The fixture plan equals input/plan.md.
// The reader's judgments below are scripted; byte comparisons establish retained
// identities/delivery, never a production judgment of semantic faithfulness.
const fixture = new URL('./fixtures/revision-preview-catalog/', import.meta.url);
const hash = (text: string) => createHash('sha256').update(text).digest('hex');
const copiedIds = ['functional-requirement:accept-intact', 'functional-requirement:accept-empty', 'functional-requirement:accept-missing-predecessor', 'functional-requirement:accept-rule-order', 'functional-requirement:accept-absent-input', 'functional-requirement:accept-stored-reviews'];
const keys = ['draft:scenario:preview-intact', 'draft:scenario:preview-empty', 'draft:scenario:preview-missing-predecessor', 'draft:scenario:preview-rule-order', 'draft:scenario:preview-absent-input', 'draft:scenario:stored-review-regression'];
let state: CheckState;
let inputs: ExtractionInputs;
let origins: readonly PlanScenario[];
let packages: ReadonlyMap<Role, LoadedPackage>;
const evidence = (catalog: ElementCatalog): AnalysisEvidence => ({ index: null, catalog, planScenarios: origins });
const unchanged: CheckSubmission = { corrections: [], entries: [], scenarios: [] };
const functionalCitation = (id: string) => id.startsWith('draft:')
  ? { functionalRequirementKey: id } : { functionalRequirementId: id };
const contextCitation = (id: string) => id.startsWith('draft:')
  ? { contextKey: id } : { contextId: id };

beforeAll(async () => {
  const [plan, catalogText, submissionText, loaded] = await Promise.all([
    readFile('subs/harness/fixtures/collection-review/plans/revision-preview/plan.md', 'utf8'),
    readFile(new URL('catalog.json', fixture), 'utf8'), readFile(new URL('initial-submission.json', fixture), 'utf8'),
    loadPromptPackages(),
  ]);
  packages = loaded.packages;
  const retained = elementCatalogSchema.parse(JSON.parse(catalogText));
  expect(elementCatalogHash(retained)).toBe('851a8754a90234c02e06a67887f7e86d7533aa63cc3a9819c633e830fa56f6eb');
  const manifest = documentManifestSchema.parse({ schema: 'ramify-agent.document-manifest/2', root: 'document:revision-preview-plan',
    documents: [{ id: 'document:revision-preview-plan', path: 'plans/revision-preview/plan.md', kind: 'plan', sha256: hash(plan),
      bytes: Buffer.byteLength(plan), storedAt: 'input/plan.md', revision: { commit: null, dirty: null } }],
    missing: [], principlesScan: { status: 'empty', unreadable: [] } });
  inputs = { planId: 'revision-preview', manifest, runDirectory: '/project/plans/revision-preview/.harness/jobs/run',
    bytes: new Map([['document:revision-preview-plan', Buffer.from(plan)]]) };
  const extracted = extractDocumentScenarios([{ id: 'document:revision-preview-plan', text: plan }]);
  expect(extracted.limitations).toEqual([]);
  origins = extracted.scenarios;
  // Reaccept the actual extraction; retained intake elements keep their kinds.
  const intake = acceptElements(openElementCatalog(retained.manifestHash, manifest), retained.elements
    .filter(element => element.kind !== 'functional' && element.kind !== 'context')
    .map(({ id, ...body }) => ({ key: `draft:${id}`, ...body })));
  if (!intake.ok) throw new Error(JSON.stringify(intake.errors));
  const { schema: _schema, ...submitted } = JSON.parse(submissionText);
  const submission = descriptiveInitialAnalysisSubmissionSchema.parse(submitted);
  const validated = validateDescriptiveInitialAnalysis(submission, evidence(intake.catalog));
  if (!validated.ok) throw new Error(JSON.stringify(validated.errors));
  state = acceptDescriptiveArchitectElements(intake.catalog, validated.value);
  expect(state.catalog).toEqual(retained);
});

describe('Plan 38 faithful copied acceptance and real condition correction', () => {
  test('all six retained source-faithful Gherkin elements remain valid unchanged across extraction and review', () => {
    expect(origins.map(origin => origin.id)).toEqual(['plan-scenario:preview-an-intact-proposed-chain', 'plan-scenario:preview-an-explicitly-empty-chain', 'plan-scenario:a-missing-predecessor-survives-the-provider-boundary', 'plan-scenario:preview-retains-the-existing-rules-and-their-ordering', 'plan-scenario:missing-input-is-not-an-empty-chain', 'plan-scenario:existing-stored-record-reviews-keep-their-behavior']);
    const before = JSON.stringify(state);
    // Script the agent's substantive reading: these six complete blocks retain
    // conditions, ordered findings, concrete messages and existing review scopes.
    const accepted = applyCheck(state, 'document:revision-preview-plan', 'inv-plan38-faithful', unchanged, evidence(state.catalog));
    if (!accepted.ok) throw new Error(JSON.stringify(accepted.errors));
    expect(accepted.findings).toEqual([]);
    expect(accepted.catalog).toEqual(state.catalog);
    expect(accepted.analysis).toEqual(state.analysis);
    expect(JSON.stringify(state)).toBe(before);
    const message = checkMessage(inputs, 'document:revision-preview-plan', state, origins);
    const delivered = createPackage({ catalog: accepted.catalog, elements: copiedIds, planDeviations: [], deviations: [] });
    if ('unavailable' in delivered) throw new Error(JSON.stringify(delivered.unavailable));
    for (const [index, id] of copiedIds.entries()) {
      const element = state.catalog.elements.find(element => element.id === id)!;
      const scenario = state.analysis.scenarios.find(scenario => scenario.key === keys[index])!;
      expect(element).toMatchObject({ kind: 'functional', document: 'document:revision-preview-plan', uncertainty: '',
        conditions: [{ source: 'stated', text: expect.any(String) }] });
      expect(scenario).toMatchObject({ origin: { kind: 'plan', planScenario: origins[index]!.id }, refs: expect.arrayContaining([id]) });
      expect(scenario.gherkin).toBe(origins[index]!.source.join('\n'));
      expect(element.text).toBe(scenario.gherkin);
      expect(message).toContain(`Registered plan origin ${origins[index]!.id}: ${origins[index]!.name}`);
      expect(message).toContain(`architect scenario keys: ${keys[index]} (plan origin)`);
      expect(message).toContain(`Scenario ${keys[index]} of ${scenario.entry}: cites ${scenario.refs!.join(', ')}`);
      const quoted = element.text.split('\n').map(line => `> ${line}`).join('\n');
      expect(message).toContain(quoted);
      expect(delivered.text).toContain(quoted);
      expect(delivered.text).toContain(element.conditions[0]!.text);
    }
    expect(message).toContain('Correction scenarios[].scenarioKey names the architect scenario key.');
  });

  test('retained six copied scenarios share their complete cited bodies with architect and engineer uses through accepted mappings', () => {
    const accepted = acceptAnalysis(state.analysis, { invocation: 'inv-plan38', view: { status: 'placeholder' }, planId: 'revision-preview',
      planScenarios: origins, index: null, catalog: state.catalog });
    const delivered = createPackage({ catalog: state.catalog, elements: copiedIds, planDeviations: [], deviations: [] });
    if ('unavailable' in delivered) throw new Error(JSON.stringify(delivered.unavailable));
    const scenarios = accepted.scenarios.map(record => briefed(record, 'pending'));
    const architect = [...architectScenarioSections(scenarios, [delivered.text]), delivered.text].join('\n');
    const engineer = [...engineerScenarioSection({ kind: 'entry', scenarios }, scenarios.map(scenario => scenario.id), [delivered.text]), delivered.text].join('\n');
    for (const [index, id] of copiedIds.entries()) {
      const scenario = scenarios[index]!;
      expect(scenario.citedElements).toContain(id);
      expect(scenario.origin).toMatchObject({ kind: 'plan', planScenario: origins[index]!.id });
      const marker = scenario.source.join('\n');
      for (const prompt of [architect, engineer]) {
        expect(prompt.replace(/^>(?: )?/gm, '').split(marker), `${id}: ${scenario.id}`).toHaveLength(2);
        expect(prompt).toContain(`cited element ${id}`);
        expect(prompt).toContain(scenario.id);
        expect(prompt).toContain(state.catalog.elements.find(element => element.id === id)!.conditions[0]!.text);
      }
    }
    // A changed current scenario, uncited equal wording, absent package or an
    // incomplete quoted block cannot substitute for its complete current body.
    const scenario = scenarios[0]!;
    for (const candidate of [{ ...scenario, citedElements: [] }, { ...scenario, source: [...scenario.source, '  And a current accepted correction applies'] }]) {
      expect(architectScenarioSections([candidate], [delivered.text]).join('\n')).toContain('```gherkin');
    }
    expect(architectScenarioSections([scenario], []).join('\n')).toContain('```gherkin');
    expect(engineerScenarioSection({ kind: 'entry', scenarios: [scenario] }, [scenario.id], [delivered.text.replace(scenario.source[1]!, 'omitted')]).join('\n')).toContain('```gherkin');
  });

  test('extraction and reviewer guidance agree, retaining semantic judgment and correction boundaries', () => {
    const initial = packages.get('initial-architect')!;
    const checker = packages.get('catalog-extractor')!;
    for (const text of [initial.procedure, stableRoleInstructions(checker), checker.extraction!.check.procedure]) {
      expect(text.replace(/\s+/g, ' ')).toContain('complete source-faithful Gherkin');
      expect(text.replace(/\s+/g, ' ')).toContain('classification and requirement');
      expect(text).not.toContain('Never copy Gherkin');
    }
    expect(checker.extraction!.check.procedure).toContain('Copying Gherkin alone warrants no correction');
    expect(checker.extraction!.check.procedure).toContain('Correct omitted');
    expect(checker.extraction!.check.procedure).toContain('Preserve stated and inferred conditions and record uncertainty');
    expect(checker.extraction!.check.procedure).toContain('never registered scenario wording or origins');
    expect(stableRoleInstructions(checker)).toContain('It never compares your text with the');
  });

  test('a substantive omitted supplied-chain condition is repaired with complete citations and unchanged registered wording', () => {
    const original = state.catalog.elements.find(element => element.id === 'functional-requirement:accept-missing-predecessor')!;
    // Remove "only": rev-0 might now occur in the supplied chain, contradicting
    // the failed missing-predecessor outcome. Script the reviewer identifying
    // that omission; the harness validates identities and coverage, not meaning.
    const damaged: CheckState = { ...state, catalog: { ...state.catalog, elements: state.catalog.elements.map(element => element.id !== original.id
      ? element : { ...element, text: element.text.replace('containing only revision', 'containing revision'),
        conditions: [{ source: 'stated' as const, text: 'The supplied chain contains rev-2 following rev-0.' }] }) } };
    const entry = state.analysis.entries.find(entry => entry.capability === 'preview-proposed-revision-chain')!;
    const scenario = state.analysis.scenarios.find(scenario => scenario.key === 'draft:scenario:preview-missing-predecessor')!;
    const remap = (ids: readonly string[]) => ids.map(id => id === original.id ? 'draft:functional-requirement:accept-restored-condition' : id);
    const { id: _id, ...restored } = original;
    const correction: CheckSubmission = {
      corrections: [{ action: 'replace', reason: 'Restore the condition that the supplied chain contains only rev-2: rev-0 is absent, so the failed missing-predecessor outcome applies.',
        retire: [original.id], elements: [{ ...restored, key: 'draft:functional-requirement:accept-restored-condition' }] }],
      entries: [{ capabilityId: `capability:${entry.capability}`,
        functionalRequirementCitations: entry.requirementRefs.map(functionalCitation),
        functionalAcceptanceCitations: remap(entry.acceptanceRefs).map(functionalCitation),
        contextCitations: entry.contextRefs.map(contextCitation),
        nonBehavioralAcceptance: (entry.nonBehavioralAcceptance ?? []).map(item => ({
          functionalAcceptanceCitation: functionalCitation(item.ref), kind: item.kind, test: item.test,
        })) }],
      scenarios: [{ scenarioKey: scenario.key, functionalAcceptanceCitations: remap(scenario.refs!).map(functionalCitation) }],
    };
    const registered = JSON.stringify(state.analysis.scenarios.map(({ refs: _refs, ...scenario }) => scenario));
    const corrected = applyCheck(damaged, 'document:revision-preview-plan', 'inv-plan38-condition', correction, evidence(damaged.catalog));
    if (!corrected.ok) throw new Error(JSON.stringify(corrected.errors));
    expect(corrected.catalog.elements.find(element => element.id === 'functional-requirement:accept-restored-condition')).toEqual({ ...original, id: 'functional-requirement:accept-restored-condition' });
    expect(corrected.catalog.retired).toEqual(['functional-requirement:accept-missing-predecessor']);
    expect(corrected.findings).toEqual([expect.objectContaining({ action: 'replace', elements: ['functional-requirement:accept-restored-condition'], retired: ['functional-requirement:accept-missing-predecessor'] })]);
    expect(corrected.analysis.entries[0]).toEqual({ ...entry, acceptanceRefs: entry.acceptanceRefs.map(id => id === 'functional-requirement:accept-missing-predecessor' ? 'functional-requirement:accept-restored-condition' : id), nonBehavioralAcceptance: [] });
    expect(corrected.analysis.scenarios.find(item => item.key === scenario.key)?.refs).toEqual(['functional-requirement:accept-restored-condition', 'functional-requirement:preview-local-resolution', 'functional-requirement:preview-rules']);
    expect(JSON.stringify(corrected.analysis.scenarios.map(({ refs: _refs, ...scenario }) => scenario))).toBe(registered);
    const rendered = checkMessage(inputs, 'document:revision-preview-plan', corrected, origins);
    expect(rendered).toContain('### functional-requirement:accept-restored-condition: functional requirement');
    expect(rendered).toContain(original.conditions[0]!.text);
    expect(rendered).toContain('preview-missing-predecessor (plan origin)');
    // A retained origin is not a correction key, and partial recitation leaves
    // a retired citation or uncovers acceptance. Both are actionable failures.
    expect(applyCheck(damaged, 'document:revision-preview-plan', 'inv-wrong-domain', { ...correction, scenarios: [{ scenarioKey: 'plan-scenario:a-missing-predecessor-survives-the-provider-boundary', functionalAcceptanceCitations: correction.scenarios[0]!.functionalAcceptanceCitations }] }, evidence(damaged.catalog)))
      .toMatchObject({ ok: false, errors: [expect.objectContaining({ path: 'scenarios.0.scenarioKey' })] });
    expect(applyCheck(damaged, 'document:revision-preview-plan', 'inv-missing-citation', { ...correction, scenarios: [] }, evidence(damaged.catalog))).toMatchObject({ ok: false });
    expect(applyCheck(damaged, 'document:revision-preview-plan', 'inv-uncovered', { ...correction, scenarios: [{ scenarioKey: scenario.key, functionalAcceptanceCitations: scenario.refs!.filter(id => id !== original.id).map(functionalCitation) }] }, evidence(damaged.catalog)))
      .toMatchObject({ ok: false, errors: [expect.objectContaining({ expected: 'citations that keep scenario form rule 6' })] });
    expect(state.catalog.elements.find(element => element.id === original.id)).toEqual(original);
  });
});
