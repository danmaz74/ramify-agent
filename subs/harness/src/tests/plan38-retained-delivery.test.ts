import { beforeAll, describe, expect, test } from 'vitest';
import { loadPromptPackages, type LoadedPackage } from '../prompts/packages.js';
import { buildTaskPacket } from '../prompts/tasks.js';
import { type TaskEnvironment } from '../../subs/task-execution/src/delivery/packet.js';
import { buildBriefingDelivery, taskBriefingRevision, type BriefingRevision } from '../../subs/task-execution/src/delivery/briefings.js';
import { effectiveBlocks, renderBlockRemoval, renderBlockSet } from '../../subs/task-execution/src/delivery/blocks.js';
import type { DeliveredInput } from '../../subs/task-execution/src/delivery/delivered-manifest.js';
import { composeTaskBrief } from '../run/task-brief.js';
import { capturedPlanBlock, planScenariosSection } from '../run/service.js';
import { extractDocumentScenarios } from '../../subs/scenarios/src/extraction.js';

let loaded: LoadedPackage;
let reviewer: LoadedPackage;
beforeAll(async () => {
  const packages = (await loadPromptPackages()).packages;
  loaded = packages.get('local-architect')!;
  reviewer = packages.get('catalog-extractor')!;
});
const environment: TaskEnvironment = { projectRoot: '/project', workingDirectory: '/project', candidate: null, snapshot: null,
  limits: {}, availableTools: ['read', 'submit_capability_qualification', 'submit_catalog_check'], views: [], supportPaths: [], cucumberConfiguration: null };
const request = { id: 'need-001', original: { need: 'Show stored preview', constraints: ['Do not mutate prior reports'],
  usage: [{ path: 'src/preview.ts', module: 'project/reviews', prospective: true, use: 'Render the preview' }],
  examples: [{ id: 'need-001.ex01', designation: 'pseudocode', title: 'Stored review', code: 'expect(preview(report)).toEqual(report)' }] },
  source: { tree: 'source-tree', retained: true } };
const pkg = '# Plan context package\nCatalog: frozen-catalog\nElements: fr-001, nfr-001\nDeviations: pd-001\n\n### fr-001\nAll preview conditions and examples.\n### nfr-001\nKeep report arrays independent; snapshot verification remains with the consumer.\n### pd-001\nCurrent accepted correction, pending scenarios only.';
const sections = [
  { key: 'support:work-item-package', text: pkg, source: 'selection.json' },
  { key: 'support:capability-request', text: `Original request: ${JSON.stringify(request, null, 2)}`, source: 'need-001.json' },
  { key: 'support:capability-plan', text: 'Plan cap-001 revision 1: preserve need-001.ex01; immediate provider conformance and remaining composed preview.', source: 'cap-001.1.json' },
  { key: 'support:discovery', text: 'Inspect effective globally loaded support before introducing competing bindings. Coverage: unknown shapes 1.' },
];
const goal = 'Qualify the preview request';
const requirements = ['Use complete request need-001 and current work-item package; source scope remains project/reviews.'];
function revision(id = 'r1', current: BriefingRevision['sections'] = sections): BriefingRevision { return taskBriefingRevision({ revision: id, goal, requirements, sections: current }); }
function packet(current = revision(), inherited: readonly DeliveredInput[] = [], history: readonly BriefingRevision[] = [], mode: 'fresh' | 'continue' | 'fork' = 'fresh') {
  return buildTaskPacket({ loaded, kind: 'capability-qualification', objective: 'Qualify need-001', goal, requirements, environment,
    briefing: buildBriefingDelivery({ mode, current, history, inheritedRevision: mode === 'fresh' ? null : 'r1' }),
    inherited, inheritedPoint: mode === 'fresh' ? null : 'session:turn-1', supplyRoleInstructions: mode === 'fresh' });
}

describe('Plan 38 complete immutable delivery and effective inherited context', () => {
  test('fresh task delivers complete request/package once and retains all mappings and separate equal requirements', () => {
    const brief = composeTaskBrief('/project', { kind: 'capability-qualification', work: { request: 'need-001' }, goal, requirements,
      prompt: `# Qualification\nUse need-001.\n\n${pkg}`, omit: [pkg], literalSections: sections, startingPointGroups: [], environment });
    const current = revision('r1', [...brief.sections]);
    const fresh = packet(current);
    expect(fresh.message.split(pkg)).toHaveLength(2);
    expect(fresh.message.match(/expect\(preview\(report\)\)\.toEqual\(report\)/g)).toHaveLength(1);
    for (const text of ['need-001.ex01', 'Do not mutate prior reports', 'src/preview.ts', 'source-tree', 'pd-001', 'unknown shapes 1', 'pending scenarios only']) expect(fresh.message).toContain(text);
    const equal = packet(revision('equal', [...sections, { key: 'fr-002', text: 'Same wording', source: 'doc-001' }, { key: 'fr-003', text: 'Same wording', source: 'doc-002' }]));
    expect(equal.message.match(/Same wording/g)).toHaveLength(2);
  });

  test.each(['continue', 'fork'] as const)('%s identifies exact original retained delivery while replacing current design', mode => {
    const first = packet();
    const oldBytes = JSON.stringify(first);
    const changed = revision('r2', sections.map(section => section.key === 'support:capability-plan'
      ? { ...section, text: 'Plan cap-001 revision 2: accepted correction; preserve need-001.ex01.', source: 'cap-001.2.json' } : section));
    const next = packet(changed, first.additions, [revision()], mode);
    expect(next.message).not.toContain(pkg);
    expect(next.message).not.toContain('expect(preview(report))');
    expect(next.message).toContain('brief:support:work-item-package: original delivery revision r1, source selection.json, SHA-256');
    expect(next.message).toContain('session:turn-1');
    expect(next.message).toContain('Plan cap-001 revision 2');
    expect(next.message).toContain('Current value; replaces any earlier value for this key.');
    expect(JSON.stringify(first)).toBe(oldBytes);
    const effective = effectiveBlocks([...first.additions, ...next.additions]);
    expect(effective.get('brief:support:capability-plan')?.text).not.toContain('revision 1');
    expect(effective.get('brief:support:discovery')?.text).toContain('globally loaded support');
  });

  test.each(['missing', 'replaced', 'withdrawn', 'wrong-source', 'legacy'] as const)('known revision with %s effective package receives the complete required package again', kind => {
    const first = packet();
    const key = 'brief:support:work-item-package';
    const prior = first.additions.find(item => item.key === key)!;
    const inherited = kind === 'missing' ? first.additions.filter(item => item.key !== key)
      : kind === 'legacy' ? first.additions.map(item => item.key === key ? { ...item, text: pkg, block: undefined } : item)
      : [...first.additions, { ...prior, source: kind === 'wrong-source' ? 'other-selection.json' : prior.source,
        text: kind === 'withdrawn' ? renderBlockRemoval(key) : renderBlockSet(key, kind === 'replaced' ? 'Obsolete narrow summary' : pkg),
        block: { key, effect: kind === 'withdrawn' ? 'remove' as const : 'set' as const } }];
    const next = packet(revision(), inherited, [revision()], 'continue');
    expect(next.message.split(pkg)).toHaveLength(2);
    expect(next.additions.find(item => item.key === key)?.source).toBe('selection.json');
    expect(next.message).not.toContain('brief:support:work-item-package: original delivery');
  });

  test('fresh recovery supplies complete current design and context; unknown ancestry is explicit unavailability', () => {
    const current = revision('r2', sections.map(section => section.key === 'support:capability-plan' ? { ...section, text: 'Current corrected design revision 2' } : section));
    const fresh = packet(current);
    expect(fresh.message).toContain(pkg);
    expect(fresh.message).toContain('Current corrected design revision 2');
    expect(fresh.message).toContain('need-001.ex01');
    expect(() => packet(current, packet().additions, [], 'continue')).toThrow('Unknown inherited briefing revision');
  });

  test('withdrawal stays explicit; reintroduction restores complete material without changing historical packets', () => {
    const first = packet();
    const current = revision('r2', sections.map(section => section.key === 'support:work-item-package' ? { ...section, text: '', effect: 'remove' as const } : section));
    const removed = packet(current, first.additions, [revision()], 'continue');
    expect(removed.message).toContain('# Block brief:support:work-item-package\nWithdrawn');
    expect(effectiveBlocks([...first.additions, ...removed.additions]).has('brief:support:work-item-package')).toBe(false);
    const restored = packet(revision(), [...first.additions, ...removed.additions], [revision()], 'continue');
    expect(restored.message).toContain(pkg);
    expect(first.message).toContain(pkg);
  });

  test('catalog comparison retains complete captured source and complete equal reading independently', () => {
    const text = 'Scenario: Stored preview\n  Given a retained immutable report\n  When it is previewed\n  Then its arrays remain unchanged';
    const current = taskBriefingRevision({ revision: 'catalog', goal: 'Review faithfulness', requirements: ['Compare source and complete reading'],
      sections: [{ key: 'captured-source', text, source: 'doc-001' }, { key: 'catalog-reading', text, source: 'catalog.json' }] });
    const checked = buildTaskPacket({ loaded: reviewer, kind: 'check', objective: 'Compare inputs', goal: 'Review faithfulness', requirements: ['Compare source and complete reading'],
      environment, briefing: buildBriefingDelivery({ mode: 'fresh', current, inheritedRevision: null, history: [] }), inherited: [], inheritedPoint: null, supplyRoleInstructions: true });
    expect(checked.message.split(text)).toHaveLength(3);
    expect(checked.additions.filter(item => item.kind === 'brief').map(item => item.source)).toEqual([null, null, 'doc-001', 'catalog.json']);
  });

  test('initial scenario index relates origins to the one complete captured body, including background and examples; unsupplied documents retain full bodies', () => {
    const text = '# Requirements\n```gherkin\nFeature: Review\n  Background:\n    Given the stored report is immutable\n  Scenario Outline: Preview identity\n    When preview <id> is rendered\n    Then <id> is retained\n    Examples:\n      | id |\n      | original |\n```';
    const extracted = extractDocumentScenarios([{ id: 'doc-001', text }, { id: 'doc-002', text }]);
    const message = [...capturedPlanBlock('preview', 'input/plan.md', text, 'doc-001'), ...planScenariosSection(extracted, new Set(['doc-001']))].join('\n');
    expect(message.match(/When preview <id> is rendered/g)).toHaveLength(2); // root capture, unsupplied companion scenario
    expect(message).toContain('ps-01: Preview identity');
    expect(message).toContain('ps-02: Preview identity');
    expect(message).toContain('Lines 6–11 of doc-001, a Scenario Outline with its examples');
    expect(message).toContain('Given the stored report is immutable');
    expect(message).toContain('| original |');
    expect(message).toContain('Complete scenario body, including examples, is in the captured plan block above');
  });
});
