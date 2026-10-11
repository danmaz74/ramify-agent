import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { beforeAll, describe, expect, test } from 'vitest';
import { documentManifestSchema } from '../../subs/plan-evidence/src/interfaces/contracts.js';
import { acceptElements, openElementCatalog } from '../../subs/plan-evidence/src/interfaces/catalog.js';
import { extractDocumentScenarios } from '../../subs/scenarios/src/extraction.js';
import { incorporatedScenarios, type AnalysisEvidence, type ResolvedAnalysis } from '../analysis/submission.js';
import { applyCheck, checkMessage, intakeMessage, principleMessage, type CheckState, type ExtractionInputs } from '../analysis/extraction.js';
import { loadPromptPackages, type LoadedPackage } from '../prompts/packages.js';
import { buildTaskPacket, type TaskEnvironment, type TaskKind } from '../prompts/tasks.js';
import { buildBriefingDelivery, taskBriefingRevision } from '../prompts/briefings.js';
import { effectiveBlocks } from '../prompts/blocks.js';
import { exactInputHash, type DeliveredInput } from '../prompts/delivered-manifest.js';
import { contextSelectorMessage } from '../context-selection/prompts.js';
import { contextSelectorSubmissionSchema, prepareContextSelection } from '../context-selection/submissions.js';
import type { Role } from '../interfaces/protocol/runs.js';

const hash = (text: string) => createHash('sha256').update(text).digest('hex');
const rootText = '# Root plan\nThe service preserves its timeout.\n';
const companionText = '# Companion plan\nFunctional acceptance remains qualified.\n';
const principlesText = '# Principles\nPreserve bounded work.\n';
const manifest = documentManifestSchema.parse({
  schema: 'ramify-agent.document-manifest/1', root: 'doc-001',
  documents: [rootText, companionText, principlesText].map((text, index) => ({
    id: `doc-00${index + 1}`, path: ['plans/example/plan.md', 'plans/example/companion.md', 'docs/project.principles.md'][index],
    kind: index === 2 ? 'principle' : 'plan', sha256: hash(text), bytes: Buffer.byteLength(text),
    storedAt: index === 0 ? 'input/plan.md' : `input/documents/doc-00${index + 1}.bin`, revision: { commit: null, dirty: null },
  })), missing: [{ from: 'doc-001', target: 'plans/example/optional.md', source: { start: 0, end: 11 }, reason: 'missing', judgment: 'unjudged' }],
  principlesScan: { status: 'complete', unreadable: [] },
});
const inputs: ExtractionInputs = { planId: 'example', manifest, runDirectory: '/project/plans/example/.harness/jobs/run-1',
  bytes: new Map([['doc-001', Buffer.from(rootText)], ['doc-002', Buffer.from(companionText)], ['doc-003', Buffer.from(principlesText)]]) };
const accepted = acceptElements(openElementCatalog(hash('manifest'), manifest), [
  { key: 'timeout', kind: 'non-functional', document: 'doc-001', text: 'Preserve a 30 second timeout.', conditions: [{ text: 'for each request', source: 'stated' }], uncertainty: 'Retry applicability unclear.' },
  { key: 'bounded', kind: 'fixed', document: 'doc-003', text: 'Preserve bounded work.', conditions: [], uncertainty: '' },
  { key: 'cache', kind: 'recommendation', document: 'doc-002', text: 'Consider a cache.', conditions: [], uncertainty: 'Optional.' },
  { key: 'acceptance', kind: 'functional', document: 'doc-001', text: 'Return the qualified result.', conditions: [], uncertainty: '' },
]);
if (!accepted.ok) throw new Error(JSON.stringify(accepted.errors));
const catalog = accepted.catalog;
const empty: ResolvedAnalysis = { entries: [], scenarios: [], integrationScenarios: [], hypotheses: [], coverageLimits: [] };
let packages: ReadonlyMap<Role, LoadedPackage>;
beforeAll(async () => { packages = (await loadPromptPackages()).packages; });
const goal = 'Read the captured documents faithfully.';
const requirements = ['Retain source identity, conditions and uncertainty.'];
function packet(role: Role, kind: TaskKind, objective: string, inherited: readonly DeliveredInput[] = [], planText = rootText) {
  const brief = taskBriefingRevision({ revision: 'r1', goal, requirements, sections: [
    { key: 'captured-plan', text: `<plan>\n${planText}</plan>`, source: 'input/plan.md' },
  ] });
  const tools: Partial<Record<TaskKind, string>> = { intake: 'submit_intake', principles: 'submit_principle_elements', check: 'submit_catalog_check',
    'initial-analysis': 'submit_initial_analysis', orientation: 'submit_work_orientation', selection: 'submit_context_selection',
    reselection: 'submit_context_selection', engineering: 'submit_iteration_result' };
  const environment: TaskEnvironment = { projectRoot: '/project', workingDirectory: '/project', candidate: null, snapshot: null,
    limits: { rejectedSubmissionsPerTurn: 3 }, availableTools: ['read', 'grep', 'ls', tools[kind]!],
    views: [{ path: '/project/.ramify-architect', revision: 'candidate-view-1', modules: ['project'], coverage: ['Fixture coverage only; external declarations unmeasured.'] }],
    supportPaths: [], cucumberConfiguration: null };
  return buildTaskPacket({ loaded: packages.get(role)!, kind, objective, goal, requirements, environment,
    inherited, inheritedPoint: inherited.length ? 'orientation:point-1' : null,
    supplyRoleInstructions: !inherited.some(item => item.key === `role:${role}`),
    briefing: buildBriefingDelivery({ mode: inherited.length ? 'continue' : 'fresh', current: brief,
      inheritedRevision: inherited.length ? 'r1' : null, history: inherited.length ? [brief] : [] }), retainInheritedSections: true });
}

describe('Plan 36 catalog-only delivery and stable selection contracts', () => {
  test('fresh intake, principle and check packets retain captured inputs and complete tool contracts without irrelevant views', () => {
    const cases = [
      ['intake', intakeMessage(inputs), ['goal', 'elements', 'incorporation']],
      ['principles', principleMessage(inputs, 'doc-003', goal), ['elements']],
      ['check', checkMessage(inputs, 'doc-001', { catalog, analysis: empty }), ['corrections', 'entries', 'scenarios']],
    ] as const;
    for (const [kind, objective, required] of cases) {
      const delivered = packet('catalog-extractor', kind, objective);
      expect(delivered.message).not.toContain('# Block environment:views');
      expect(delivered.manifest.entries.some(entry => entry.key === 'environment:views')).toBe(false);
      expect(delivered.message).toContain(rootText);
      expect(delivered.message).toContain(objective);
      expect(JSON.parse(delivered.declaration.description.slice(delivered.declaration.description.indexOf('{')))).toMatchObject({ required });
      expect(delivered.roleInstructions).toContain('Intake extracts the plan\'s non-functional requirements');
      expect(delivered.roleInstructions).toContain('initial analysis reads the captured plan documents');
      expect(delivered.roleInstructions).toContain('Catalog checking compares each captured');
      expect(delivered.roleInstructions).toContain('Later implementation engineers, reviewers and assessors');
      expect(delivered.message).toContain('"workingDirectory": "/project"');
    }
    expect(cases[0][1]).toContain('doc-002 (plan): plans/example/companion.md; captured file /project/plans/example/.harness/jobs/run-1/input/documents/doc-002.bin');
    expect(cases[0][1]).toContain('From doc-001, bytes 0–11: plans/example/optional.md');
    expect(cases[1][1]).toContain('doc-003 (principle): docs/project.principles.md; captured file /project/plans/example/.harness/jobs/run-1/input/documents/doc-003.bin');
  });

  test('tasks needing views retain revision and coverage; a catalog role change withdraws its inherited inventory once', () => {
    const initial = packet('initial-architect', 'initial-analysis', 'Read captured plans and orient on the architect view.');
    const inventory = initial.additions.find(item => item.key === 'environment:views')!;
    expect(inventory.text).toContain('candidate-view-1');
    expect(inventory.text).toContain('external declarations unmeasured');
    const originalHistory = JSON.stringify(initial.additions);
    const check = packet('catalog-extractor', 'check', checkMessage(inputs, 'doc-001', { catalog, analysis: empty }), initial.additions);
    const removals = check.additions.filter(item => item.block?.key === 'environment:views');
    expect(removals).toEqual([expect.objectContaining({ block: { key: 'environment:views', effect: 'remove' }, text: '# Block environment:views\nWithdrawn; this block no longer applies.\n' })]);
    const history = [...initial.additions, ...check.additions];
    expect(effectiveBlocks(history).has('environment:views')).toBe(false);
    expect(check.manifest.entries).toContainEqual(expect.objectContaining({ key: 'environment:views', hash: exactInputHash(inventory.text), delivery: 'inherited' }));
    expect(JSON.stringify(initial.additions)).toBe(originalHistory);
    const repeated = packet('catalog-extractor', 'check', 'Check the same captured document.', history);
    expect(repeated.additions.some(item => item.block?.key === 'environment:views')).toBe(false);
    const engineer = packet('engineer', 'engineering', 'Implement using the supplied API view.', history);
    expect(effectiveBlocks([...history, ...engineer.additions]).get('environment:views')?.text).toContain('candidate-view-1');
  });

  test('selector fork preserves the inherited prefix and facts while submitting stable IDs and complete explanations', () => {
    const orientation = packet('local-architect', 'orientation', 'Ownership: project/service. Provider: project/core. Completion workflow: report scenario judgments.');
    const prefix = JSON.stringify(orientation.additions);
    const selection = packet('context-selector', 'selection', contextSelectorMessage(undefined, catalog), orientation.additions);
    const history = [...orientation.additions, ...selection.additions];
    expect(JSON.stringify(orientation.additions)).toBe(prefix);
    expect(history.map(item => item.text).join('\n')).toContain('Ownership: project/service. Provider: project/core.');
    expect(selection.message).toContain('historical context');
    expect(selection.message).toContain('no source-write or parent-completion authority');
    expect(selection.message).not.toContain('Answer with IDs only');
    expect(selection.message).toContain('stable catalog ID, never by a passage, heading or line range');
    expect(effectiveBlocks(history).get('environment:views')?.text).toContain('candidate-view-1');
    expect(selection.manifest.inheritedPoint).toBe('orientation:point-1');
    const submitted = contextSelectorSubmissionSchema.parse({ selected: [{ id: 'nfr-001', reason: 'The service handles timed requests.',
      conditions: ['for each request'], uncertainty: 'Retry applicability unclear.' }] });
    const prepared = prepareContextSelection(submitted, { workItem: 'wi-001', orientationInvocation: 'inv-001', orientationPoint: 'orientation:point-1',
      selectorInvocation: 'inv-002', degraded: false }, { catalog, workItemElements: ['fr-001'], planDeviations: [] });
    expect(prepared.status).toBe('available');
    if (prepared.status !== 'available') throw new Error(JSON.stringify(prepared.errors));
    expect(prepared.selection.selected).toEqual(submitted.selected);
    expect(prepared.text).toContain('Preserve a 30 second timeout.');
    expect(prepared.text).toContain('Retry applicability unclear.');
    const passage = { selected: [{ ...submitted.selected[0]!, id: 'Preserve a 30 second timeout.' }] };
    expect(prepareContextSelection(passage, prepared.selection, { catalog, workItemElements: [], planDeviations: [] })).toMatchObject({ status: 'unavailable', errors: [{ path: 'selected.0.id' }] });
    expect(contextSelectorSubmissionSchema.safeParse({ selected: [{ id: 'nfr-001' }] }).success).toBe(false);
  });
});

test('fresh catalog checker recovers all six retained plan origins and captured intervals, including partOf, without parent history', async () => {
  const text = await readFile('subs/harness/fixtures/collection-review/plans/revision-preview/plan.md', 'utf8');
  const advisory = '```gherkin\nScenario: Advisory example\n When an example runs\n Then it illustrates a suggestion\n```';
  const captured = { ...inputs, planId: 'revision-preview', runDirectory: '/project/plans/revision-preview/.harness/jobs/run-1',
    bytes: new Map([['doc-001', Buffer.from(text)], ['doc-002', Buffer.from(advisory)], ['doc-003', Buffer.from(principlesText)]]),
    manifest: documentManifestSchema.parse({ ...manifest, documents: manifest.documents.map(document => document.id === 'doc-001'
      ? { ...document, path: 'plans/revision-preview/plan.md', sha256: hash(text), bytes: Buffer.byteLength(text) }
      : document.id === 'doc-002' ? { ...document, sha256: hash(advisory), bytes: Buffer.byteLength(advisory) } : document) }) };
  // An unincorporated companion scenario must not renumber registered origins.
  const evidence: AnalysisEvidence = { index: null, catalog, documents: { manifest: captured.manifest, bytes: captured.bytes },
    incorporation: { schema: 'ramify-agent.document-incorporation/2', documents: [{ document: 'doc-001', scenarios: true, uncertainty: '' },
      { document: 'doc-002', scenarios: false, uncertainty: 'Advisory only.' }], missing: [] } };
  const origins = incorporatedScenarios(evidence);
  expect(origins.map(origin => [origin.id, origin.lines])).toEqual([
    ['ps-01', [71, 76]], ['ps-02', [78, 82]], ['ps-03', [84, 89]], ['ps-04', [91, 97]], ['ps-05', [99, 102]], ['ps-06', [104, 111]],
  ]);
  const analysis: ResolvedAnalysis = { ...empty, entries: [{ capability: 'preview', description: 'Preview proposed history.', owner: 'collection-review',
    requirementRefs: ['fr-001'], acceptanceRefs: ['fr-001'], contextRefs: [], citations: [] }],
    scenarios: origins.map((origin, index) => ({ key: `preview-case-${index + 1}`, entry: 'preview', refs: ['fr-001'],
      gherkin: origin.source.join('\n'), ...(index === 2 ? { origin: { kind: 'architect' as const }, partOf: origin.id }
        : { origin: { kind: 'plan' as const, planScenario: origin.id } }) })),
    integrationScenarios: [{ planScenario: 'ps-03', subScenarios: ['preview-case-3'] }] };
  const state: CheckState = { catalog, analysis };
  const frozen = JSON.stringify(state.analysis.scenarios);
  const delivered = packet('catalog-extractor', 'check', checkMessage(captured, 'doc-001', state, origins), [], text);
  expect(delivered.manifest.inheritedPoint).toBeNull();
  for (const [index, origin] of origins.entries()) {
    expect(delivered.message).toContain(`Registered plan origin ${origin.id}: ${origin.name}`);
    expect(delivered.message).toContain(`lines ${origin.lines[0]}–${origin.lines[1]}; architect scenario keys: preview-case-${index + 1}`);
  }
  expect(delivered.message).toContain('preview-case-3 (architect sub-scenario; partOf ps-03)');
  expect(delivered.message).toContain('Correction scenarios[].key names the architect scenario key.');
  expect(delivered.message).toContain('doc-001 (plan): plans/revision-preview/plan.md; in the plan block of this message');
  expect(delivered.message).toContain(`<plan>\n${text}</plan>`);
  expect(delivered.message).not.toContain('Advisory example');
  expect(checkMessage(captured, 'doc-001', state)).toContain('No registered plan-origin mapping is available');
  const applied = applyCheck(state, 'doc-001', 'inv-check', { corrections: [], entries: [], scenarios: [] }, evidence);
  expect(applied.ok).toBe(true);
  expect(JSON.stringify(state.analysis.scenarios)).toBe(frozen);
  if (applied.ok) expect(JSON.stringify(applied.analysis.scenarios)).toBe(frozen);
  expect(extractDocumentScenarios([{ id: 'doc-001', text }]).scenarios).toEqual(origins);
});
