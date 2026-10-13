import { beforeAll, describe, expect, test } from 'vitest';
import { loadPromptPackages, type LoadedPackage } from '../prompts/packages.js';
import { buildTaskPacket, selectedEnvironment, type TaskEnvironment } from '../prompts/tasks.js';
import { buildBriefingDelivery, taskBriefingRevision } from '../prompts/briefings.js';
import { scenarioFilePointers, taskObjective } from '../run/task-brief.js';
import { capturedPlanBlock, groupedPassedScenarioLines, planPointer, withSelectionReasons } from '../run/service.js';
import { taskSupportSections } from '../work/task-support.js';
import { composeOperationPacket } from '../run/session-operations.js';
import type { ScenarioResult } from '../checks/scenario-results.js';
import type { Role } from '../interfaces/protocol/runs.js';

/*
 * What one invocation's brief carries, and once: the plan in its block, the
 * environment its tools can use, the selector's reasons beside the package,
 * and continuation deltas.
 */

let packages: ReadonlyMap<Role, LoadedPackage>;
beforeAll(async () => { packages = (await loadPromptPackages()).packages; });

const environment = (extra: Partial<TaskEnvironment> = {}): TaskEnvironment => ({
  projectRoot: '/project', workingDirectory: '/project/ui/src', candidate: 'C1', snapshot: 'C1',
  limits: { invocationAbsoluteMs: 1, invocationIdleMs: 2, rejectedSubmissionsPerTurn: 3, commandTimeoutMs: 4, budgetReturnsPerIteration: 5, stopSettleMs: 6 },
  availableTools: ['read', 'grep'], views: [], supportPaths: ['subs/harness/src/prompts/x.md'], cucumberConfiguration: null, ...extra,
});

describe('the environment an invocation is told of', () => {
  test('a reader without a shell receives its own bounds, project paths and no support paths', () => {
    const selected = selectedEnvironment(environment());
    expect(Object.keys(selected)).toEqual(['projectRoot', 'workingDirectory', 'candidate', 'limits', 'availableTools']);
    expect(selected.limits).toEqual({ invocationIdleMs: 2, rejectedSubmissionsPerTurn: 3 });
  });

  test('a shell adds its quiet-output interval without lifetime or context-return ceilings', () => {
    expect(selectedEnvironment(environment({ availableTools: ['shell'] })).limits)
      .toEqual({ invocationIdleMs: 2, rejectedSubmissionsPerTurn: 3, commandTimeoutMs: 4 });
  });

  test('a role that reads no file receives no paths or views, and null fields say nothing', () => {
    const selected = selectedEnvironment(environment({ availableTools: ['submit_x'], candidate: null, snapshot: null,
      views: [{ path: '/project/ui/src/.ramify/external', revision: 'r', modules: ['ui'], coverage: [] }] }));
    expect(Object.keys(selected)).toEqual(['limits', 'availableTools']);
  });

  test('snapshot tools are told the candidate they read; a distinct snapshot is named', () => {
    expect(selectedEnvironment(environment({ availableTools: ['snapshot_read'], snapshot: 'S1' }))).toMatchObject({
      candidate: { candidate: 'C1', paths: 'project-relative; the snapshot tools read this candidate' }, snapshot: 'S1' });
  });

  test('views are project-relative, and a module with no children view is told so', () => {
    const selected = selectedEnvironment(environment({ views: [{ path: '/project/ui/src/.ramify/external', revision: 'r', modules: ['ui'], coverage: [] }, { path: '.ramify-architect', revision: 'a', modules: [], coverage: [] }] }));
    expect(selected.views).toEqual({
      views: [{ path: 'ui/src/.ramify/external', revision: 'r', modules: ['ui'], coverage: [] }, { path: '.ramify-architect', revision: 'a', modules: [], coverage: [] }],
      note: 'This module has no children view, so no `children` directory exists.',
    });
  });

  test('engineers receive current Cucumber discovery facts while unrelated and inapplicable tasks omit them', () => {
    const engineer = { role: 'engineer', kind: 'engineering' } as const;
    const available = JSON.stringify({ kind: 'available', configPath: '/project/focused.json', sourceFiles: { '/project/cucumber.json': 'a'.repeat(64) }, support: { import: ['support/steps.mjs'] } });
    const unavailable = JSON.stringify({ kind: 'unavailable', reason: 'Current configuration cannot be read' });
    expect(selectedEnvironment(environment({ cucumberConfiguration: available }), engineer).cucumberConfiguration).toBe(available);
    expect(selectedEnvironment(environment({ cucumberConfiguration: unavailable }), engineer).cucumberConfiguration).toBe(unavailable);
    expect(selectedEnvironment(environment({ cucumberConfiguration: null }), engineer)).not.toHaveProperty('cucumberConfiguration');
    expect(selectedEnvironment(environment({ cucumberConfiguration: available }), { role: 'local-architect', kind: 'orientation' })).not.toHaveProperty('cucumberConfiguration');
  });});

describe('the task line and pointers', () => {
  test('the objective names the work only where there is some', () => {
    expect(taskObjective('intake', {})).toBe('Perform intake; use the current evidence and designated submission.');
    expect(taskObjective('assignment', { workItem: 'wi-001' })).toBe('Perform assignment for {"workItem":"wi-001"}; use the current evidence and designated submission.');
  });

  test('scenario file pointers are project-relative', () => {
    const section = scenarioFilePointers({ scenarioFeatures: ['ui/src/tests/features/a.feature'], stepDirectories: [{ directory: 'ui/src/tests/steps', files: [] }] })!;
    expect(section.text).toContain('Paths are relative to the project root.');
    expect(section.text).toContain('- Feature: `ui/src/tests/features/a.feature`.');
  });
});

describe('the plan, delivered once', () => {
  test('its block holds the frozen plan verbatim and where the frozen file is; the requirement points to it', () => {
    const block = capturedPlanBlock('badge', 'plans/badge/.harness/jobs/run-1/input/plan.md', '# Badge\n\nGive it a tone.\n', 'doc-001').join('\n');
    expect(block).toBe([
      '# Plan "badge"', '',
      'The plan (doc-001), frozen when this run started. The live file `plans/badge/plan.md` may have changed since and is not this run\'s input; if you need the frozen file itself, it is at `plans/badge/.harness/jobs/run-1/input/plan.md`.', '',
      '<plan>', '# Badge\n\nGive it a tone.', '</plan>', '',
    ].join('\n'));
    expect(planPointer('badge')).toBe('The plan "badge", delivered whole in the plan block below.');
    expect(planPointer('badge', 'Implement')).toBe('Implement the plan "badge", delivered whole in the plan block below.');
  });
});

describe('the package with the selector\'s reasons', () => {
  const pkg = [
    '# Plan context package', '', 'Catalog: x', 'Elements: fr-001, fr-002, nfr-001', 'Deviations: pd-001', '',
    '## Functional requirements', '',
    '### fr-001: functional requirement from plans/p/plan.md', '', '> Take a tone.', '', 'Conditions: none recorded.', '', 'Uncertainty: none recorded.', '',
    '### fr-002: functional requirement from plans/p/plan.md', '', '> Default to neutral.', '', 'Conditions:', '- stated: The badge is given no tone.', '', 'Uncertainty: none recorded.', '',
    '### nfr-001: non-functional requirement of the plan from plans/p/plan.md', '', '> Stay presentational.', '', 'Conditions: none recorded.', '', 'Uncertainty: Unclear scope.', '',
    '## Plan deviations', '', '### pd-001 amends fr-001', '', 'Authority: user', '', '> Changed.', '',
  ].join('\n');

  test('each selected element says why it is in view; condition and uncertainty lines appear only where recorded', () => {
    const delivered = withSelectionReasons(pkg, [
      { id: 'fr-001', reason: 'The work item adds the tone.', conditions: [], uncertainty: '' },
      { id: 'fr-002', reason: 'The default is part of it.', conditions: ['Only for new badges.'], uncertainty: '' },
      { id: 'nfr-001', reason: 'Ownership must hold.', conditions: [], uncertainty: 'Whether styles count.' },
    ]);
    expect(delivered).toContain('### fr-001: functional requirement from plans/p/plan.md\n\n> Take a tone.\n\nWhy it is in view: The work item adds the tone.\n\n### fr-002');
    expect(delivered).toContain('> Default to neutral.\n\nWhy it is in view: The default is part of it.\n\nConditions:\n- stated: The badge is given no tone.\n- selection: Only for new badges.\n\n### nfr-001');
    expect(delivered).toContain("Why it is in view: Ownership must hold.\n\nUncertainty: Unclear scope.\nWhether styles count. (the selection's reading)\n\n## Plan deviations");
    expect(delivered).not.toContain('none recorded');
    // Deviations, and elements the selection does not name, are unchanged.
    expect(delivered.endsWith('### pd-001 amends fr-001\n\nAuthority: user\n\n> Changed.\n')).toBe(true);
    expect(withSelectionReasons(pkg, [])).toBe(pkg);
  });
});

describe('what a passed gate bound', () => {
  const binding = (tone: string) => [
    { step: `a badge with tone "${tone}"`, definition: 'ui/src/tests/steps/badge.steps.ts:46' },
    { step: 'the badge is rendered', definition: 'ui/src/tests/steps/badge.steps.ts:53' },
  ];
  const result = (id: string, line: number, tone: string): ScenarioResult => ({ id, check: 'scenarios', command: null, status: 'passed',
    file: 'ui/src/tests/features/badge.feature', line, failure: null, undefined: [], binding: binding(tone) });

  test('an outline\'s examples bound by the same definitions are listed once', () => {
    const lines = groupedPassedScenarioLines([result('sc-001', 12, 'warning'), ...['neutral', 'positive', 'warning'].map((tone, index) => result('sc-003', 33 + index, tone))],
      new Map([['sc-003', 'Every tone is readable']]));
    expect(lines).toEqual([
      '- `sc-001` passed in `scenarios`, at `ui/src/tests/features/badge.feature:12`, bound by:',
      '  - `a badge with tone "warning"` → `ui/src/tests/steps/badge.steps.ts:46`',
      '  - `the badge is rendered` → `ui/src/tests/steps/badge.steps.ts:53`',
      '- `sc-003` "Every tone is readable" passed in `scenarios`, 3 examples, at `ui/src/tests/features/badge.feature` lines 33, 34, 35, bound by:',
      '  - `a badge with tone "neutral"` → `ui/src/tests/steps/badge.steps.ts:46`',
      '  - `the badge is rendered` → `ui/src/tests/steps/badge.steps.ts:53`',
      "  The step texts are line 33's; the other examples differ only in their example values.",
    ]);
  });
});

describe('continuation deltas', () => {
  test('a section is the same value whatever blank lines end it, so it is not sent again', () => {
    const sections = taskSupportSections('# Goal\nG\n\n## The bounds of a module engineer\n\nB\n\n\n', ['G']);
    expect(sections.at(-1)).toEqual({ key: 'support:## The bounds of a module engineer:0', text: '## The bounds of a module engineer\n\nB' });
    expect(taskSupportSections('# Goal\nG\n\n## The bounds of a module engineer\n\nB\n', ['G'])).toEqual(sections);
  });

  test('a fork that retains its source\'s sections withdraws none of them', () => {
    const loaded = packages.get('reviewer')!;
    const r1 = taskBriefingRevision({ revision: 'r1', goal: 'G', requirements: ['R'], sections: [{ key: 'support:design-guidance', text: 'Guidance' }] });
    const r2 = taskBriefingRevision({ revision: 'r2', goal: 'G', requirements: ['R'], sections: [{ key: 'support:design-guidance', text: '', effect: 'remove' }] });
    const env = environment({ availableTools: ['snapshot_read', 'submit_orientation', 'submit_review'] });
    const first = buildTaskPacket({ loaded, kind: 'design-orientation', objective: 'Orient', goal: 'G', requirements: ['R'], environment: env, inherited: [], inheritedPoint: null,
      supplyRoleInstructions: true, briefing: buildBriefingDelivery({ mode: 'fresh', current: r1, inheritedRevision: null, history: [] }) });
    const fork = (retainInheritedSections: boolean) => buildTaskPacket({ loaded, kind: 'design', objective: 'Review', goal: 'G', requirements: ['R'], environment: env,
      inherited: first.additions, inheritedPoint: 'point', supplyRoleInstructions: false, retainInheritedSections,
      briefing: buildBriefingDelivery({ mode: 'fork', current: r2, inheritedRevision: 'r1', history: [r1] }) });
    expect(fork(false).message).toContain('# Block brief:support:design-guidance\nWithdrawn');
    expect(fork(true).message).not.toContain('Withdrawn');
  });

  test('a reviewer fork that retains its source\'s sections records no withdrawal of them; a fork that does not withdraws them', () => {
    const loaded = packages.get('reviewer')!;
    const r1 = taskBriefingRevision({ revision: 'r1', goal: 'G', requirements: ['R'], sections: [{ key: 'support:design-guidance', text: 'Guidance' }] });
    const env = environment({ availableTools: ['snapshot_read', 'submit_orientation', 'submit_review'] });
    const first = buildTaskPacket({ loaded, kind: 'design-orientation', objective: 'Orient', goal: 'G', requirements: ['R'], environment: env, inherited: [], inheritedPoint: null,
      supplyRoleInstructions: true, briefing: buildBriefingDelivery({ mode: 'fresh', current: r1, inheritedRevision: null, history: [] }) });
    const point = { sessionId: 'orientation', kind: 'turn' as const, turn: 1, checkpoint: 'c1' };
    const fork = (retainInheritedSections: boolean) => composeOperationPacket({ runId: 'run', operationId: 'design-review', loaded, role: 'reviewer', mode: 'fork',
      brief: { kind: 'design', objective: 'Review', goal: 'G', requirements: ['R'], sections: [], environment: env, ...(retainInheritedSections ? { retainInheritedSections } : {}) },
      workingDirectory: env.workingDirectory, builtinDeclarations: [], tools: [{ name: 'snapshot_read' }, { name: 'submit_orientation' }], submissionName: 'submit_review',
      source: point, prior: { point, inherited: first.additions, history: [r1], revision: 'r1' } });
    const guidance = (retain: boolean) => fork(retain).current.sections.find(section => section.key === 'support:design-guidance');
    expect(guidance(true)).toEqual({ key: 'support:design-guidance', text: 'Guidance' });
    expect(fork(true).packet.message).not.toContain('Withdrawn');
    expect(guidance(false)).toMatchObject({ text: '', effect: 'remove' });
    expect(fork(false).packet.message).toContain('# Block brief:support:design-guidance\nWithdrawn');
  });
});
