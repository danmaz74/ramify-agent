import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { beforeAll, describe, expect, test } from 'vitest';
import { documentManifestSchema } from '../../subs/plan-evidence/src/interfaces/contracts.js';
import {
  acceptElements, createPackage, elementCatalogHash, elementCatalogSchema, openElementCatalog,
  serializeElementCatalog, type ElementCatalog,
} from '../../subs/plan-evidence/src/interfaces/catalog.js';
import { extractDocumentScenarios, type PlanScenario } from '../../subs/scenarios/src/extraction.js';
import { applyCheck, checkMessage, type CheckState, type CheckSubmission, type ExtractionInputs } from '../../subs/autonomous/subs/planning/src/extraction.js';
import { acceptArchitectElements, initialAnalysisSubmissionSchema, validateInitialAnalysis, type AnalysisEvidence } from '../../subs/autonomous/subs/planning/src/submission.js';
import { acceptAnalysis } from '../../subs/autonomous/subs/planning/src/accept.js';
import { briefed, engineerScenarioSection } from '../../subs/autonomous/src/work/scenario-briefing.js';
import { architectScenarioSections } from '../../subs/autonomous/src/work/session.js';
import { loadPromptPackages, type LoadedPackage } from '../prompts/packages.js';
import { stableRoleInstructions } from '../prompts/tasks.js';
import type { Role } from '../interfaces/protocol/runs.js';

// Exact offline evidence from run 20261011T143710Z-e572ca, harness 8d5e4684:
// analysis/catalog/b7d90bc4d658255a3e8b59f9ffabb143c39d7e9203c8a9f180cf85bf7c8610d1.json
// and invocations/inv-0002/submission.json. The fixture plan equals input/plan.md.
// The reader's judgments below are scripted; byte comparisons establish retained
// identities/delivery, never a production judgment of semantic faithfulness.
const fixture = new URL('./fixtures/revision-preview-catalog/', import.meta.url);
const hash = (text: string) => createHash('sha256').update(text).digest('hex');
const copiedIds = ['fr-006', 'fr-007', 'fr-008', 'fr-009', 'fr-010', 'fr-011'];
const keys = ['preview-intact', 'preview-empty', 'preview-missing-predecessor', 'preview-rule-order', 'preview-absent-input', 'stored-review-regression'];
let state: CheckState;
let inputs: ExtractionInputs;
let origins: readonly PlanScenario[];
let packages: ReadonlyMap<Role, LoadedPackage>;
const evidence = (catalog: ElementCatalog): AnalysisEvidence => ({ index: null, catalog, planScenarios: origins });
const unchanged: CheckSubmission = { corrections: [], entries: [], scenarios: [] };

beforeAll(async () => {
  const [plan, catalogText, submissionText, loaded] = await Promise.all([
    readFile('subs/harness/fixtures/collection-review/plans/revision-preview/plan.md', 'utf8'),
    readFile(new URL('catalog.json', fixture), 'utf8'), readFile(new URL('initial-submission.json', fixture), 'utf8'),
    loadPromptPackages(),
  ]);
  packages = loaded.packages;
  const retained = elementCatalogSchema.parse(JSON.parse(catalogText));
  expect(elementCatalogHash(retained)).toBe('b7d90bc4d658255a3e8b59f9ffabb143c39d7e9203c8a9f180cf85bf7c8610d1');
  const manifest = documentManifestSchema.parse({ schema: 'ramify-agent.document-manifest/1', root: 'doc-001',
    documents: [{ id: 'doc-001', path: 'plans/revision-preview/plan.md', kind: 'plan', sha256: hash(plan),
      bytes: Buffer.byteLength(plan), storedAt: 'input/plan.md', revision: { commit: null, dirty: null } }],
    missing: [], principlesScan: { status: 'empty', unreadable: [] } });
  inputs = { planId: 'revision-preview', manifest, runDirectory: '/project/plans/revision-preview/.harness/jobs/run',
    bytes: new Map([['doc-001', Buffer.from(plan)]]) };
  const extracted = extractDocumentScenarios([{ id: 'doc-001', text: plan }]);
  expect(extracted.limitations).toEqual([]);
  origins = extracted.scenarios;
  // Reaccept the actual extraction; retained intake elements keep their kinds.
  const intake = acceptElements(openElementCatalog(retained.manifestHash, manifest), retained.elements
    .filter(element => element.kind !== 'functional' && element.kind !== 'context')
    .map(({ id, ...body }) => ({ key: `retained-${id}`, ...body })));
  if (!intake.ok) throw new Error(JSON.stringify(intake.errors));
  const { schema: _schema, ...submitted } = JSON.parse(submissionText);
  const submission = initialAnalysisSubmissionSchema.parse(submitted);
  const validated = validateInitialAnalysis(submission, evidence(intake.catalog));
  if (!validated.ok) throw new Error(JSON.stringify(validated.errors));
  state = acceptArchitectElements(intake.catalog, validated.value);
  expect(serializeElementCatalog(state.catalog)).toBe(catalogText);
});

describe('Plan 38 faithful copied acceptance and real condition correction', () => {
  test('all six retained source-faithful Gherkin elements remain valid unchanged across extraction and review', () => {
    expect(origins.map(origin => origin.id)).toEqual(['ps-01', 'ps-02', 'ps-03', 'ps-04', 'ps-05', 'ps-06']);
    const before = JSON.stringify(state);
    // Script the agent's substantive reading: these six complete blocks retain
    // conditions, ordered findings, concrete messages and existing review scopes.
    const accepted = applyCheck(state, 'doc-001', 'inv-plan38-faithful', unchanged, evidence(state.catalog));
    if (!accepted.ok) throw new Error(JSON.stringify(accepted.errors));
    expect(accepted.findings).toEqual([]);
    expect(accepted.catalog).toEqual(state.catalog);
    expect(accepted.analysis).toEqual(state.analysis);
    expect(JSON.stringify(state)).toBe(before);
    const message = checkMessage(inputs, 'doc-001', state, origins);
    const delivered = createPackage({ catalog: accepted.catalog, elements: copiedIds, planDeviations: [], deviations: [] });
    if ('unavailable' in delivered) throw new Error(JSON.stringify(delivered.unavailable));
    for (const [index, id] of copiedIds.entries()) {
      const element = state.catalog.elements.find(element => element.id === id)!;
      const scenario = state.analysis.scenarios.find(scenario => scenario.key === keys[index])!;
      expect(element).toMatchObject({ kind: 'functional', document: 'doc-001', uncertainty: '',
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
    expect(message).toContain('Correction scenarios[].key names the architect scenario key.');
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
    const original = state.catalog.elements.find(element => element.id === 'fr-008')!;
    // Remove "only": rev-0 might now occur in the supplied chain, contradicting
    // the failed missing-predecessor outcome. Script the reviewer identifying
    // that omission; the harness validates identities and coverage, not meaning.
    const damaged: CheckState = { ...state, catalog: { ...state.catalog, elements: state.catalog.elements.map(element => element.id !== original.id
      ? element : { ...element, text: element.text.replace('containing only revision', 'containing revision'),
        conditions: [{ source: 'stated' as const, text: 'The supplied chain contains rev-2 following rev-0.' }] }) } };
    const entry = state.analysis.entries.find(entry => entry.capability === 'preview-proposed-revision-chain')!;
    const scenario = state.analysis.scenarios.find(scenario => scenario.key === 'preview-missing-predecessor')!;
    const remap = (ids: readonly string[]) => ids.map(id => id === original.id ? 'accept-restored-condition' : id);
    const { id: _id, ...restored } = original;
    const correction: CheckSubmission = {
      corrections: [{ action: 'replace', reason: 'Restore the condition that the supplied chain contains only rev-2: rev-0 is absent, so the failed missing-predecessor outcome applies.',
        retire: [original.id], elements: [{ ...restored, key: 'accept-restored-condition' }] }],
      entries: [{ capability: entry.capability, requirementRefs: [...entry.requirementRefs], acceptanceRefs: remap(entry.acceptanceRefs), contextRefs: [...entry.contextRefs] }],
      scenarios: [{ key: scenario.key, refs: remap(scenario.refs!) }],
    };
    const registered = JSON.stringify(state.analysis.scenarios.map(({ refs: _refs, ...scenario }) => scenario));
    const corrected = applyCheck(damaged, 'doc-001', 'inv-plan38-condition', correction, evidence(damaged.catalog));
    if (!corrected.ok) throw new Error(JSON.stringify(corrected.errors));
    expect(corrected.catalog.elements.find(element => element.id === 'fr-012')).toEqual({ ...original, id: 'fr-012' });
    expect(corrected.catalog.retired).toEqual(['fr-008']);
    expect(corrected.findings).toEqual([expect.objectContaining({ action: 'replace', elements: ['fr-012'], retired: ['fr-008'] })]);
    expect(corrected.analysis.entries[0]).toEqual({ ...entry, acceptanceRefs: entry.acceptanceRefs.map(id => id === 'fr-008' ? 'fr-012' : id) });
    expect(corrected.analysis.scenarios.find(item => item.key === scenario.key)?.refs).toEqual(['fr-012', 'fr-003', 'fr-002']);
    expect(JSON.stringify(corrected.analysis.scenarios.map(({ refs: _refs, ...scenario }) => scenario))).toBe(registered);
    const rendered = checkMessage(inputs, 'doc-001', corrected, origins);
    expect(rendered).toContain('### fr-012: functional requirement');
    expect(rendered).toContain(original.conditions[0]!.text);
    expect(rendered).toContain('preview-missing-predecessor (plan origin)');
    // A retained origin is not a correction key, and partial recitation leaves
    // a retired citation or uncovers acceptance. Both are actionable failures.
    expect(applyCheck(damaged, 'doc-001', 'inv-wrong-domain', { ...correction, scenarios: [{ key: 'ps-03', refs: correction.scenarios[0]!.refs }] }, evidence(damaged.catalog)))
      .toMatchObject({ ok: false, errors: [expect.objectContaining({ path: 'scenarios.0.key' })] });
    expect(applyCheck(damaged, 'doc-001', 'inv-missing-citation', { ...correction, scenarios: [] }, evidence(damaged.catalog))).toMatchObject({ ok: false });
    expect(applyCheck(damaged, 'doc-001', 'inv-uncovered', { ...correction, scenarios: [{ key: scenario.key, refs: scenario.refs!.filter(id => id !== original.id) }] }, evidence(damaged.catalog)))
      .toMatchObject({ ok: false, errors: [expect.objectContaining({ expected: 'citations that keep scenario form rule 6' })] });
    expect(state.catalog.elements.find(element => element.id === original.id)).toEqual(original);
  });
});
