import { describe, expect, test } from 'vitest';
import { loadPromptPackages, renderEngineerPrompt } from '../prompts/packages.js';
import { iterationMessage } from '../work/engineer.js';
import { buildTaskPacket } from '../prompts/tasks.js';
import { type TaskEnvironment } from '../../subs/task-execution/src/delivery/packet.js';
import { buildBriefingDelivery, taskBriefingRevision } from '../../subs/task-execution/src/delivery/briefings.js';
import type { IterationAssignment } from '../work/iterations.js';
import { declaredCheckInputs, moduleInputPointers } from '../work/starting-inputs.js';

/** Only what the message reads of an assignment. */
function assignment(): IterationAssignment {
  return {
    id: 'wi-001.i01',
    goal: 'Add the count tool.',
    approach: 'Extend mcp.ts.',
    completionEvidence: 'A test calls the tool.',
    scope: {
      base: { module: 'app/reviews', included: [] },
      bootstrap: [],
      resolved: { excluded: [], included: [], ownership: { provider: 'ramify.affected-cli/4', ramifyVersion: 'scripted-lifecycle-only', inputId: 'scripted-scope', configuration: 'tsconfig.json', root: '/p', modules: [{ id: 'app', parent: null, directory: '.' }], exclusions: [] }, roots: ['/p/subs/reviews'], files: [] },
    },
    gate: { checkpoint: 'iteration', tests: { policy: 'owned-by-scope', exactOwners: ['app/reviews'], subtrees: [], extraSuites: [] } },
    externalCapabilities: [],
  } as unknown as IterationAssignment;
}

describe('what an engineer is told about the Ramify project it works in', () => {
  test('known setup renders the declared project runner and project-relative references as information, without an invented focused command', () => {
    const setup = declaredCheckInputs({ projectRoot: '/p', paths: ['ramify-audit.json', 'checks/cucumber.json'], checks: [
      { id: 'scenario-check', executor: { kind: 'command', commands: [{ cmd: 'npm', args: ['run', 'acceptance', '--', '--profile', 'integration'], cwd: 'checks', parser: 'cucumber', env: { WORLD: 'secret-value' } }] } },
    ] });
    const message = iterationMessage({ assignment: assignment(), projectRoot: '/p', workingDirectory: '/p/subs/reviews/src', base: 'abc', setup });
    expect(setup).toBe([
      '## Declared project checks', '',
      'The gate runs these; nothing here is a command for you to run.', '',
      '- scenario-check (cucumber): `npm run acceptance -- --profile integration` in `checks`; environment names: WORLD', '',
      'They are configured in `ramify-audit.json` and `checks/cucumber.json`. Open one only when a concern, or a focused command you need, depends on it.', '',
      'Paths are relative to the project root.', '',
    ].join('\n'));
    expect(message).toContain(setup.trimEnd());
    expect(message).not.toContain('secret-value'); expect(message).not.toContain('npx vitest');
    expect(message).not.toMatch(/Inspect their configuration|Read these/u);
    expect(declaredCheckInputs({ projectRoot: '/p', checks: [] })).toBe('');
    // The snapshot variant reads the same; a path outside the project stays absolute, and an argument with a space is quoted.
    expect(declaredCheckInputs({ projectRoot: '/p', snapshot: true, paths: ['package.json'], checks: [
      { id: 'structure', executor: { kind: 'command', commands: [{ cmd: '/tools/bin/ramify', args: ['check', '--name', 'a b'] }] } },
    ] })).toBe([
      '## Declared project checks', '',
      'The gate runs these; nothing here is a command for you to run.', '',
      '- structure: `/tools/bin/ramify check --name "a b"`', '',
      'They are configured in `package.json`. Open one only when a concern, or a focused command you need, depends on it.', '',
      'Paths are project-relative, in the audited candidate.', '',
    ].join('\n'));
    expect(declaredCheckInputs({ projectRoot: '/p', checks: [], paths: [] })).toBe('');
  });

  test('module pointers keep module-cwd and selector-workspace references rooted and testing modules use their known test area', () => {
    const pointers = moduleInputPointers({ projectRoot: '/p', modules: [{ module: 'app/checks', directory: 'subs/checks', apiPaths: ['subs/checks/src/.ramify'] }],
      testAreas: [{ module: 'app/checks', area: 'subs/checks/src' }] });
    expect(pointers).toContain('declaration `/p/subs/checks/module.ramify`');
    expect(pointers).toContain('Test area: `/p/subs/checks/src/`');
    expect(pointers).toContain('Observed API view: `/p/subs/checks/src/.ramify/`');
    expect(pointers).not.toContain('src/tests/');
  });
  test('the system prompt says what crosses a module boundary, where the answer is and how an unexposed symbol is reported', async () => {
    const { packages } = await loadPromptPackages();
    const prompt = renderEngineerPrompt(packages.get('engineer')!, '/p');
    expect(prompt).toContain('## This is a Ramify project');
    expect(prompt).toContain('only the symbols your module\n  *receives*');
    expect(prompt).toContain('`import type` is checked exactly as a value import is');
    // The views block lists the directories a module has; the role text names none as always present.
    expect(prompt).toContain('The task\'s views block lists the API views of\nthe modules you work in');
    expect(prompt).toContain('`.ramify` for ordinary source and `tests/.ramify` for code under `tests/`');
    expect(prompt).toContain('exists only where it receives something from them');
    expect(prompt).toContain('`external/<path>.ts.md` lists what your module receives from `<path>.ts`');
    expect(prompt).toContain('Reading a page answers more than grepping the view.');
    expect(prompt).not.toContain('.ramify/children');
    expect(prompt).not.toContain('{external,children}');
    const legacy = renderEngineerPrompt((await loadPromptPackages({ capabilityWorkflow: false })).packages.get('engineer')!, '/p');
    expect(legacy).toContain('Reading a page answers more than grepping the view.');
    expect(legacy).not.toContain('.ramify/children');
    expect(prompt).toContain('Foreign source never establishes importability');
    expect(prompt).toContain('`RAMIFY MODULE VIOLATION`');
    expect(prompt).toContain('the harness\nchecks your whole write scope once more before it accepts');
    expect(prompt).toContain('submit `capability-needed` with the actual usage');
    expect(prompt).toContain('do not copy its definition');
    expect(prompt).toContain('Expose a symbol together with every named type its signature mentions');
    expect(prompt).toContain('cannot use it cleanly');
    expect(prompt).not.toContain('Awaited<');
    expect(prompt).not.toMatch(/\{\{[a-zA-Z]+\}\}/);
  });

  test('the iteration message names the API view of each module it writes', () => {
    const text = iterationMessage({
      assignment: assignment(),
      projectRoot: '/p',
      base: 'abc',
      views: [{ module: 'app/reviews', views: [{ area: 'ordinary', path: 'subs/reviews/src/.ramify', revision: 'rev/1:current:2', coverage: null }], unavailable: null }],
    });
    expect(text).toContain('## What you may import');
    expect(text).toContain('- `app/reviews` (ordinary): `subs/reviews/src/.ramify/` (project-relative; open `/p/subs/reviews/src/.ramify/` from this cwd); revision `rev/1:current:2`; coverage complete, so a symbol it does not list is not importable.');
    expect(text).toContain('reported with `unsuitable`, reason `scope`');
  });

  test('a view with coverage limits says what its count means', () => {
    const text = iterationMessage({
      assignment: assignment(),
      projectRoot: '/p',
      base: 'abc',
      views: [{ module: 'app/reviews', views: [{ area: 'src', path: 'subs/reviews/src/.ramify', revision: 'rev/1:current:2', coverage: 2 }], unavailable: null }],
    });
    expect(text).toContain('revision `rev/1:current:2`; coverage limits: 2 source-analysis limits that may have left a received API out of this view, so absence is not proof of unavailability.');
  });

  test('a module without a view is told that absence is not permission', () => {
    const text = iterationMessage({
      assignment: assignment(),
      projectRoot: '/p',
      base: 'abc',
      views: [{ module: 'app/reviews', views: [], unavailable: 'the API view could not be materialized: daemon down' }],
    });
    expect(text).toContain('no API view, because the API view could not be materialized: daemon down. Absence of a view is not permission');
  });

  test('capability assignments and gate repairs retain the current handback and execution controls', async () => {
    const text = iterationMessage({ assignment: assignment(), projectRoot: '/p', base: 'abc', capabilityWorkflow: true,
      views: [{ module: 'app/reviews', views: [{ area: 'ordinary', path: 'subs/reviews/src/.ramify', revision: 'r1', coverage: null }], unavailable: null }],
      failedGate: { id: 'ga-1', cause: 'check', summary: ['A required check failed.'] } });
    expect(text).toContain('reported with `capability-needed`');
    expect(text).not.toContain('reported with `unsuitable`, reason `scope`');
    expect(text).not.toContain('`git diff');
    expect(text).toContain('A required check failed.');
    const { packages } = await loadPromptPackages();
    expect(renderEngineerPrompt(packages.get('engineer')!, '/p')).not.toContain('one\n  repair round');
  });

  test.each([false, true])('repair packet preserves failed evidence and corrects inherited execution promises (capability=%s)', async capabilityWorkflow => {
    const loaded = (await loadPromptPackages({ capabilityWorkflow })).packages.get('engineer')!;
    // Existing sessions retain their pinned role instructions; the current brief
    // must correct a legacy promise without changing that immutable prefix.
    const legacy = { ...loaded, system: loaded.system + '\nThe rerun runs the complete required set, not only what failed.' };
    const environment: TaskEnvironment = { projectRoot: '/p', workingDirectory: '/p/subs/reviews/src', candidate: 'failed-candidate', snapshot: null,
      limits: {}, availableTools: ['read', 'shell', 'submit_iteration_result'], views: [], supportPaths: [], cucumberConfiguration: null };
    const goal = 'Add the count tool.'; const requirements = ['A test calls the tool.'];
    const previous = taskBriefingRevision({ revision: 'repair-old', goal, requirements, sections: [{ key: 'iteration', text: 'The next attempt runs the complete required set, not only what failed.' }] });
    const first = buildTaskPacket({ loaded: legacy, kind: 'engineering', objective: goal, goal, requirements, environment,
      briefing: buildBriefingDelivery({ mode: 'fresh', current: previous, inheritedRevision: null, history: [] }),
      inheritedPoint: null, inherited: [], supplyRoleInstructions: true });
    const message = iterationMessage({ assignment: assignment(), projectRoot: '/p', base: 'accepted-base', capabilityWorkflow,
      failedGate: { id: 'ga-failed', cause: 'check', summary: ['Candidate failed-candidate; original receipt audit-7.', 'FAIL parent/harness: race test; unchanged audit evidence reused; focused passing run only.'] } });
    const current = taskBriefingRevision({ revision: 'repair-current', goal, requirements, sections: [{ key: 'iteration', text: message }] });
    const repair = buildTaskPacket({ loaded: legacy, kind: 'repair', objective: goal, goal, requirements, environment,
      briefing: buildBriefingDelivery({ mode: 'continue', current, inheritedRevision: previous.revision, history: [previous] }),
      inheritedPoint: 'old-repair-point', inherited: first.additions, supplyRoleInstructions: false });
    const additions = repair.additions.map(item => item.text).join('\n');
    expect(additions).toContain('These current repair instructions supersede any inherited promise of fresh execution');
    expect(additions).toContain('another owner\'s work or a revised decision, preserve the candidate and return `partial`');
    expect(additions).toContain('unchanged source does not guarantee fresh execution');
    expect(additions).toContain('Acceptance requires a qualifying verdict');
    expect(additions).toContain('original receipt audit-7');
    expect(additions).toContain('FAIL parent/harness: race test');
    expect(additions).toContain('A focused passing run does not erase the failed audit result or prove a flake');
    expect(additions).toContain('do not run a complete audit yourself, bypass the gate, widen scope or make a cosmetic mutation');
    expect(repair.additions.some(item => item.kind === 'role-instructions')).toBe(false);
    expect(first.additions.find(item => item.kind === 'role-instructions')?.text).toContain('The rerun runs the complete required set');
    const fresh = buildTaskPacket({ loaded, kind: 'repair', objective: goal, goal, requirements, environment,
      briefing: buildBriefingDelivery({ mode: 'fresh', current, inheritedRevision: null, history: [] }),
      inheritedPoint: null, inherited: [], supplyRoleInstructions: true });
    expect(fresh.additions.find(item => item.kind === 'role-instructions')?.text).toContain('may reuse');
    expect(fresh.additions.map(item => item.text).join('\n')).not.toContain('The rerun runs the complete required set');
  });

  test('the iteration message names the owners\' test areas as text and leaves every test run to the gate\'s audit', () => {
    const text = iterationMessage({
      assignment: assignment(), projectRoot: '/p', base: 'abc',
      testAreas: [{ module: 'app/reviews', area: 'subs/reviews/src/tests' }],
    });
    expect(text).toContain('The gate commits a candidate and asks for the project\'s committed audit of it at the `iteration` checkpoint:');
    expect(text).toContain('The tests this assignment owns are those of app/reviews, in:\n- `subs/reviews/src/tests/` (`app/reviews`)');
    expect(text).toContain('A whole-suite run is refused there: the gate\'s audit runs it.');
    expect(text).not.toContain('run_scope_tests');
    // Without assigned scenarios, the audit's description names none.
    expect(text).toContain('its tests among them');
    expect(text).not.toContain('tests and scenarios among them');
  });

  test('no role\'s prompt package offers a scoped test tool or a harness scenario run', async () => {
    for (const capabilityWorkflow of [true, false]) {
      const { packages } = await loadPromptPackages({ capabilityWorkflow });
      for (const [role, loaded] of packages) {
        const texts = [loaded.system, loaded.procedure, loaded.skill, loaded.extraSkill, loaded.submissionSchema,
          ...Object.values(loaded.reviewer?.procedures ?? {}), loaded.reconciliation?.procedure ?? '', loaded.workOrientation?.procedure ?? ''];
        for (const text of texts) {
          expect(text, role).not.toContain('run_scope_tests');
          expect(text, role).not.toMatch(/acceptance:quick|quick mode|scenario check mode/u);
        }
      }
    }
  });
});
