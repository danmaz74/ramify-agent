import { createHash } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import { documentManifestSchema } from '../../subs/plan-evidence/src/interfaces/contracts.js';
import { openElementCatalog, type ElementCatalog, type SubmittedElement } from '../../subs/plan-evidence/src/interfaces/catalog.js';
import { acceptIntake, acceptPrinciples, applyCheck, correctionSchema, type CheckState, type CheckSubmission, type IntakeSubmission } from '../../subs/autonomous/subs/planning/src/extraction.js';
import { type AnalysisEvidence } from '../../subs/autonomous/subs/planning/src/submission.js';
import { acceptDescriptiveArchitectElements, validateDescriptiveInitialAnalysis } from '../../subs/autonomous/subs/planning/src/descriptive.js';
import { analysis, currentAnalysis, entry } from './helpers/analysis.js';
import { entryAssignmentsSchema } from '../../subs/autonomous/subs/planning/src/records.js';

/*
 * The catalog extractor's turns, as pure acceptances: the intake adds the
 * plan's non-functional requirements and recommendations, a principles
 * extraction its document's fixed requirements, and a checker corrects the
 * reading of one document and re-cites what the analysis cites of it.
 * Nothing compares element text with the captured bytes.
 */

const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const manifest = documentManifestSchema.parse({
  schema: 'ramify-agent.document-manifest/2', root: 'document:mail-plan',
  documents: [
    { id: 'document:mail-plan', path: 'plans/mail/plan.md', kind: 'plan', sha256: hash('plan'), bytes: 4, storedAt: 'input/plan.md', revision: { commit: null, dirty: null } },
    { id: 'document:mail-principles', path: 'docs/mail.principles.md', kind: 'principle', sha256: hash('principles'), bytes: 10, storedAt: 'input/documents/document%3Amail-principles.bin', revision: { commit: null, dirty: null } },
  ],
  missing: [], principlesScan: { status: 'complete', unreadable: [] },
});
const open = openElementCatalog(hash('manifest'), manifest);
const evidence = (catalog: ElementCatalog): AnalysisEvidence => ({ index: null, catalog, planScenarios: [] });

function element(key: string, kind: SubmittedElement['kind'], document: string, text = `The source states ${key}.`): SubmittedElement {
  return { key: `draft:${{ context: 'context', functional: 'functional-requirement', 'non-functional': 'non-functional-requirement', fixed: 'fixed-requirement', recommendation: 'recommendation' }[kind]}:${key}`, kind, document, text, conditions: [], uncertainty: '' };
}

function intake(elements: readonly SubmittedElement[]): IntakeSubmission {
  return { goal: 'Customers receive their email.', elements: [...elements],
    incorporation: { documents: [{ document: 'document:mail-plan', scenarios: true, uncertainty: '' }], missing: [] } };
}

/** The catalog after the intake, the principles extraction and the architect, and the analysis citing it. */
function extracted(): CheckState {
  const read = acceptIntake(open, manifest, intake([element('within-a-minute', 'non-functional', 'document:mail-plan'), element('prefer-a-queue', 'recommendation', 'document:mail-plan')]));
  if (!read.ok) throw new Error(JSON.stringify(read.errors));
  const fixed = acceptPrinciples(read.catalog, 'document:mail-principles', { elements: [element('audited', 'fixed', 'document:mail-principles')] });
  if (!fixed.ok) throw new Error(JSON.stringify(fixed.errors));
  return acceptDescriptiveArchitectElements(fixed.catalog, currentAnalysis(analysis([entry('send-email', 'mail')]), 'document:mail-plan'));
}

function check(extra: Partial<CheckSubmission> = {}): CheckSubmission {
  return { corrections: [], entries: [], scenarios: [], ...extra };
}
const functionalCitation = (id: string) => id.startsWith('draft:') ? { functionalRequirementKey: id } : { functionalRequirementId: id };
const contextCitation = (id: string) => id.startsWith('draft:') ? { contextKey: id } : { contextId: id };
function citedEntry(requirements: string[], acceptance: string[], context: string[] = []): CheckSubmission['entries'][number] {
  return { capabilityId: 'capability:send-email', functionalRequirementCitations: requirements.map(functionalCitation),
    functionalAcceptanceCitations: acceptance.map(functionalCitation), contextCitations: context.map(contextCitation), nonBehavioralAcceptance: [] };
}
function citedScenario(acceptance: string[]): CheckSubmission['scenarios'][number] {
  return { scenarioKey: 'draft:scenario:send-email-is-used', functionalAcceptanceCitations: acceptance.map(functionalCitation) };
}

const ids = (catalog: ElementCatalog) => catalog.elements.map(item => item.id);

describe('the intake', () => {
  test('names the plan\'s non-functional requirements and recommendations, and keeps the incorporation judgment', () => {
    const accepted = acceptIntake(open, manifest, intake([
      element('within-a-minute', 'non-functional', 'document:mail-plan'), element('prefer-a-queue', 'recommendation', 'document:mail-plan'), element('retries', 'non-functional', 'document:mail-plan'),
    ]));
    if (!accepted.ok) throw new Error(JSON.stringify(accepted.errors));
    expect(accepted.catalog.elements.map(item => [item.id, item.kind, item.document])).toEqual([
      ['non-functional-requirement:within-a-minute', 'non-functional', 'document:mail-plan'], ['recommendation:prefer-a-queue', 'recommendation', 'document:mail-plan'], ['non-functional-requirement:retries', 'non-functional', 'document:mail-plan'],
    ]);
    expect(accepted.incorporation).toEqual({ schema: 'ramify-agent.document-incorporation/3',
      documents: [{ document: 'document:mail-plan', scenarios: true, uncertainty: '' }], missing: [] });
  });

  test('reads neither functional elements nor the principles documents, and nothing is accepted on an error', () => {
    const rejected = acceptIntake(open, manifest, intake([
      element('delivers', 'functional', 'document:mail-plan'), element('audited', 'non-functional', 'document:mail-principles'), element('fixed', 'fixed', 'document:mail-plan'),
    ]));
    expect(rejected.ok).toBe(false);
    if (rejected.ok) return;
    expect(rejected.errors.map(error => error.path)).toEqual(['elements.0.kind', 'elements.1.document', 'elements.2.kind']);
    const twice = acceptIntake(open, manifest, intake([element('same', 'non-functional', 'document:mail-plan'), element('same', 'non-functional', 'document:mail-plan')]));
    expect(twice.ok).toBe(false);
    if (!twice.ok) expect(new Set(twice.errors.map(error => error.path))).toEqual(new Set(['elements.1.key']));
    expect(open.elements).toEqual([]);
  });
});

describe('a principles extraction', () => {
  test('adds fixed requirements and recommendations of its own document', () => {
    const read = acceptIntake(open, manifest, intake([element('prefer-a-queue', 'recommendation', 'document:mail-plan')]));
    if (!read.ok) throw new Error(JSON.stringify(read.errors));
    const accepted = acceptPrinciples(read.catalog, 'document:mail-principles', { elements: [element('audited', 'fixed', 'document:mail-principles'), element('small-modules', 'recommendation', 'document:mail-principles')] });
    if (!accepted.ok) throw new Error(JSON.stringify(accepted.errors));
    expect(accepted.catalog.elements.map(item => [item.id, item.document])).toEqual([['recommendation:prefer-a-queue', 'document:mail-plan'], ['fixed-requirement:audited', 'document:mail-principles'], ['recommendation:small-modules', 'document:mail-principles']]);
  });

  test('rejects an element of another document and a kind the principles do not supply', () => {
    const rejected = acceptPrinciples(open, 'document:mail-principles', { elements: [element('audited', 'fixed', 'document:mail-plan'), element('fast', 'non-functional', 'document:mail-principles')] });
    expect(rejected.ok).toBe(false);
    if (!rejected.ok) expect(rejected.errors.map(error => error.path)).toEqual(['elements.0.document', 'elements.1.kind']);
  });
});

describe('a checker', () => {
  test('the elements every reader works from before any check: the architect\'s beside the extractors\'', () => {
    const state = extracted();
    expect(ids(state.catalog)).toEqual(['non-functional-requirement:within-a-minute', 'recommendation:prefer-a-queue', 'fixed-requirement:audited', 'functional-requirement:send-email-request', 'functional-requirement:send-email-acceptance']);
    expect(state.analysis.entries[0]).toMatchObject({ requirementRefs: ['functional-requirement:send-email-request'], acceptanceRefs: ['functional-requirement:send-email-acceptance'], contextRefs: [] });
    expect(state.analysis.scenarios[0]!.refs).toEqual(['functional-requirement:send-email-acceptance']);
  });

  test('adds a constraint its document states and the reading omitted, with a finding naming the new ID', () => {
    const state = extracted();
    const applied = applyCheck(state, 'document:mail-principles', 'inv-0005', check({ corrections: [
      { action: 'add', reason: 'The principles also bound the retry count.', elements: [element('three-retries', 'fixed', 'document:mail-principles')] },
    ] }), evidence(state.catalog));
    if (!applied.ok) throw new Error(JSON.stringify(applied.errors));
    expect(ids(applied.catalog)).toEqual(['non-functional-requirement:within-a-minute', 'recommendation:prefer-a-queue', 'fixed-requirement:audited', 'functional-requirement:send-email-request', 'functional-requirement:send-email-acceptance', 'fixed-requirement:three-retries']);
    expect(applied.analysis).toEqual(state.analysis);
    expect(applied.findings).toEqual([{ document: 'document:mail-principles', invocation: 'inv-0005', action: 'add', reason: 'The principles also bound the retry count.',
      elements: ['fixed-requirement:three-retries'], retired: [] }]);

    const elsewhere = applyCheck(state, 'document:mail-principles', 'inv-0005', check({ corrections: [
      { action: 'add', reason: 'The plan says so.', elements: [element('from-the-plan', 'fixed', 'document:mail-plan')] },
    ] }), evidence(state.catalog));
    expect(elsewhere.ok).toBe(false);
    if (!elsewhere.ok) expect(elsewhere.errors.map(error => error.path)).toEqual(['corrections.0.elements.0.document']);
  });

  test('splits a cited functional element, and the entry and its scenario are re-cited to the new IDs', () => {
    const state = extracted();
    const split = check({
      corrections: [{ action: 'replace', reason: 'The acceptance states two outcomes.', retire: ['functional-requirement:send-email-acceptance'],
        elements: [element('sent', 'functional', 'document:mail-plan'), element('logged', 'functional', 'document:mail-plan')] }],
      entries: [citedEntry(['functional-requirement:send-email-request'], ['draft:functional-requirement:sent', 'draft:functional-requirement:logged'], [])],
      scenarios: [citedScenario(['draft:functional-requirement:sent', 'draft:functional-requirement:logged'])],
    });
    const applied = applyCheck(state, 'document:mail-plan', 'inv-0004', split, evidence(state.catalog));
    if (!applied.ok) throw new Error(JSON.stringify(applied.errors));
    // The retired name is never issued again; each new outcome keeps its proposed name.
    expect(ids(applied.catalog)).toEqual(['non-functional-requirement:within-a-minute', 'recommendation:prefer-a-queue', 'fixed-requirement:audited', 'functional-requirement:send-email-request', 'functional-requirement:sent', 'functional-requirement:logged']);
    expect(applied.catalog.retired).toEqual(['functional-requirement:send-email-acceptance']);
    expect(applied.analysis.entries[0]).toMatchObject({ requirementRefs: ['functional-requirement:send-email-request'], acceptanceRefs: ['functional-requirement:sent', 'functional-requirement:logged'] });
    expect(applied.analysis.scenarios[0]!.refs).toEqual(['functional-requirement:sent', 'functional-requirement:logged']);
    expect(applied.findings).toEqual([{ document: 'document:mail-plan', invocation: 'inv-0004', action: 'replace', reason: 'The acceptance states two outcomes.',
      elements: ['functional-requirement:sent', 'functional-requirement:logged'], retired: ['functional-requirement:send-email-acceptance'] }]);

    // Without the re-citation the entry and the scenario would cite a retired element.
    const unrecited = applyCheck(state, 'document:mail-plan', 'inv-0004', { ...split, entries: [], scenarios: [] }, evidence(state.catalog));
    expect(unrecited.ok).toBe(false);
    if (!unrecited.ok) expect(unrecited.errors.map(error => [error.path, error.message])).toEqual([
      ['entries.0.acceptanceRefs.0', 'Unknown element functional-requirement:send-email-acceptance'], ['scenarios.0.refs.0', 'Unknown element functional-requirement:send-email-acceptance'],
    ]);
    // Re-citing the entry alone leaves one new acceptance element no scenario cites.
    const partly = applyCheck(state, 'document:mail-plan', 'inv-0004', { ...split, scenarios: [citedScenario(['draft:functional-requirement:sent'])] }, evidence(state.catalog));
    expect(partly.ok).toBe(false);
    if (!partly.ok) expect(partly.errors).toEqual([expect.objectContaining({ path: 'entries.0.acceptanceRefs.1', expected: 'citations that keep scenario form rule 6' })]);
  });

  test('a re-citation to a retired ID is rejected with its path', () => {
    const state = extracted();
    const split = applyCheck(state, 'document:mail-plan', 'inv-0004', check({
      corrections: [{ action: 'replace', reason: 'Two outcomes.', retire: ['functional-requirement:send-email-acceptance'], elements: [element('sent', 'functional', 'document:mail-plan')] }],
      entries: [citedEntry(['functional-requirement:send-email-request'], ['draft:functional-requirement:sent'], [])],
      scenarios: [citedScenario(['draft:functional-requirement:sent'])],
    }), evidence(state.catalog));
    if (!split.ok) throw new Error(JSON.stringify(split.errors));
    const later = { catalog: split.catalog, analysis: split.analysis };
    const retired = applyCheck(later, 'document:mail-plan', 'inv-0006', check({
      entries: [citedEntry(['functional-requirement:send-email-request'], ['functional-requirement:sent', 'functional-requirement:send-email-acceptance'], [])],
    }), evidence(later.catalog));
    expect(retired.ok).toBe(false);
    if (!retired.ok) expect(retired.errors).toEqual([{ path: 'entries.0.acceptanceRefs.1', message: expect.stringContaining('"functional-requirement:send-email-acceptance" is retired') }]);
    // A retired ID cannot be retired or rewritten again either.
    const again = applyCheck(later, 'document:mail-plan', 'inv-0006', check({ corrections: [
      { action: 'rewrite', reason: 'Stronger than the plan.', element: { id: 'functional-requirement:send-email-acceptance', text: 'Weaker.', conditions: [], uncertainty: '' } },
    ] }), evidence(later.catalog));
    expect(again.ok).toBe(false);
    if (!again.ok) expect(again.errors.map(error => error.path)).toEqual(['corrections.0.element.id']);
  });

  test('rewrites a reading in place, and corrects only elements of its own document', () => {
    const state = extracted();
    const rewritten = applyCheck(state, 'document:mail-plan', 'inv-0004', check({ corrections: [
      { action: 'rewrite', reason: 'The reading made the requirement stronger than the plan.',
        element: { id: 'functional-requirement:send-email-request', text: 'The module sends one email when asked.', conditions: [{ text: 'when asked', source: 'stated' }], uncertainty: '' } },
    ] }), evidence(state.catalog));
    if (!rewritten.ok) throw new Error(JSON.stringify(rewritten.errors));
    expect(ids(rewritten.catalog)).toEqual(ids(state.catalog));
    expect(rewritten.catalog.elements.find(item => item.id === 'functional-requirement:send-email-request')).toMatchObject({ kind: 'functional', document: 'document:mail-plan', text: 'The module sends one email when asked.' });
    expect(rewritten.findings).toEqual([expect.objectContaining({ action: 'rewrite', elements: ['functional-requirement:send-email-request'], retired: [] })]);

    const foreign = applyCheck(state, 'document:mail-principles', 'inv-0005', check({ corrections: [
      { action: 'rewrite', reason: 'Not this document.', element: { id: 'functional-requirement:send-email-request', text: 'Other.', conditions: [], uncertainty: '' } },
      { action: 'replace', reason: 'Not this document either.', retire: ['non-functional-requirement:within-a-minute'], elements: [element('bounded', 'fixed', 'document:mail-principles')] },
    ] }), evidence(state.catalog));
    expect(foreign.ok).toBe(false);
    if (!foreign.ok) expect(foreign.errors.map(error => error.path)).toEqual(['corrections.0.element.id', 'corrections.1.retire.0']);
  });

  test('findings name the IDs each correction produced, in correction order', () => {
    const state = extracted();
    const applied = applyCheck(state, 'document:mail-plan', 'inv-0004', check({
      corrections: [
        { action: 'add', reason: 'An omitted limit.', elements: [element('per-hour', 'non-functional', 'document:mail-plan')] },
        { action: 'replace', reason: 'A reclassification: the request is context.', retire: ['functional-requirement:send-email-request'], elements: [element('why-mail', 'context', 'document:mail-plan')] },
        { action: 'add', reason: 'An omitted outcome.', elements: [element('bounced', 'functional', 'document:mail-plan'), element('prefer-templates', 'recommendation', 'document:mail-plan')] },
      ],
      entries: [citedEntry(['draft:functional-requirement:bounced'], ['functional-requirement:send-email-acceptance'], ['draft:context:why-mail'])],
    }), evidence(state.catalog));
    if (!applied.ok) throw new Error(JSON.stringify(applied.errors));
    expect(applied.findings.map(finding => [finding.action, finding.elements, finding.retired])).toEqual([
      ['add', ['non-functional-requirement:per-hour'], []], ['replace', ['context:why-mail'], ['functional-requirement:send-email-request']], ['add', ['functional-requirement:bounced', 'recommendation:prefer-templates'], []],
    ]);
    expect(applied.findings.every(finding => finding.document === 'document:mail-plan' && finding.invocation === 'inv-0004')).toBe(true);
    expect(applied.analysis.entries[0]).toMatchObject({ requirementRefs: ['functional-requirement:bounced'], acceptanceRefs: ['functional-requirement:send-email-acceptance'], contextRefs: ['context:why-mail'] });
  });
});


describe('Plan23 consumer catalog/form corrections', () => {
  test('retire-only correction is valid; add still requires an element and rejected local refs consume no IDs', () => {
    expect(correctionSchema.safeParse({ action: 'replace', reason: 'Duplicate recommendation.', retire: ['recommendation:prefer-a-queue'], elements: [] }).success).toBe(true);
    expect(correctionSchema.safeParse({ action: 'add', reason: 'Missing.', elements: [] }).success).toBe(false);
    const state = extracted();
    const retired = applyCheck(state, 'document:mail-plan', 'inv-retire', check({ corrections: [{ action: 'replace', reason: 'The recommendation duplicated another source.', retire: ['recommendation:prefer-a-queue'], elements: [] }] }), evidence(state.catalog));
    if (!retired.ok) throw new Error(JSON.stringify(retired.errors));
    expect(retired.catalog.retired).toEqual(['recommendation:prefer-a-queue']); expect(retired.findings[0]).toMatchObject({ elements: [], retired: ['recommendation:prefer-a-queue'] });
    const corrections = [{ action: 'add' as const, reason: 'Missing functional wording.', elements: [element('new-local', 'functional', 'document:mail-plan')] }];
    const invalid = applyCheck(state, 'document:mail-plan', 'inv-reject', check({ corrections, entries: [citedEntry(['draft:functional-requirement:new-local'], ['draft:functional-requirement:missing-local'], [])] }), evidence(state.catalog));
    expect(invalid.ok).toBe(false); if (!invalid.ok) expect(JSON.stringify(invalid.errors)).toContain('missing-local');
    expect(ids(state.catalog)).toEqual(['non-functional-requirement:within-a-minute', 'recommendation:prefer-a-queue', 'fixed-requirement:audited', 'functional-requirement:send-email-request', 'functional-requirement:send-email-acceptance']);
    const valid = applyCheck(state, 'document:mail-plan', 'inv-retry', check({ corrections, entries: [citedEntry(['draft:functional-requirement:new-local'], ['functional-requirement:send-email-acceptance'], [])] }), evidence(state.catalog));
    if (!valid.ok) throw new Error(JSON.stringify(valid.errors)); expect(valid.catalog.elements.at(-1)!.id).toBe('functional-requirement:new-local');
  });

  test('registered non-behavioral declaration validates and resolves its local ref; a path, scenario or unregistered test cannot substitute', () => {
    const scripted = analysis([entry('send-email', 'mail')]);
    scripted.scenarios[0]!.refs = [];
    scripted.entries[0]!.nonBehavioralAcceptance = [{ kind: 'non-behavioral', ref: 'draft:functional-requirement:send-email-acceptance', test: 'test:mail-send' }];
    const submitted = currentAnalysis(scripted, 'document:mail-plan');
    const available = { ...evidence(open), registeredTests: new Set(['test:mail-send']) };
    expect(validateDescriptiveInitialAnalysis(submitted, available).ok).toBe(true);
    const accepted = acceptDescriptiveArchitectElements(open, submitted);
    expect(accepted.analysis.entries[0]!.nonBehavioralAcceptance).toEqual([{ kind: 'non-behavioral', ref: 'functional-requirement:send-email-acceptance', test: 'test:mail-send' }]);
    const entryAssignment = accepted.analysis.entries[0]!;
    const durable = entryAssignmentsSchema.parse({ schema: 'ramify-agent.entry-assignments/2', view: { status: 'placeholder' }, entries: [{
      capability: entryAssignment.capability, capabilityId: 'capability:send-email', description: entryAssignment.description, owner: entryAssignment.owner,
      functionalRequirementIds: entryAssignment.requirementRefs, functionalAcceptanceIds: entryAssignment.acceptanceRefs, contextIds: entryAssignment.contextRefs,
      citations: entryAssignment.citations, nonBehavioralAcceptance: entryAssignment.nonBehavioralAcceptance,
    }] });
    expect(durable.entries[0]!.nonBehavioralAcceptance).toEqual(accepted.analysis.entries[0]!.nonBehavioralAcceptance);
    for (const testIdentity of ['src/test.ts', 'scenario:mail-is-used', 'test:unregistered']) {
      const rejected = validateDescriptiveInitialAnalysis({ ...submitted, entries: [{ ...submitted.entries[0], nonBehavioralAcceptance: [{ kind: 'non-behavioral', functionalAcceptanceKey: 'draft:functional-requirement:send-email-acceptance', test: testIdentity }] }] }, available);
      expect(rejected.ok).toBe(false); if (!rejected.ok) expect(rejected.errors[0]!.path).toBe('entries.0.nonBehavioralAcceptance.0.test');
    }
    const invalidKind = validateDescriptiveInitialAnalysis({ ...submitted, elements: submitted.elements.map(element => element.key === 'draft:functional-requirement:send-email-acceptance' ? { ...element, kind: 'context' as const } : element) }, available);
    expect(invalidKind.ok).toBe(false);
    expect(validateDescriptiveInitialAnalysis({ ...submitted, entries: [...submitted.entries, submitted.entries[0]!] }, available).ok).toBe(false);
  });
});
