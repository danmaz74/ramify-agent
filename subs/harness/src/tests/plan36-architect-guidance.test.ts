import { beforeAll, expect, test } from 'vitest';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { Role } from '../interfaces/protocol/runs.js';
import { loadPromptPackages, type LoadedPackage } from '../prompts/packages.js';
import { buildTaskPacket, type TaskKind, type TaskEnvironment } from '../prompts/tasks.js';
import { buildBriefingDelivery, taskBriefingRevision } from '../prompts/briefings.js';
import { effectiveBlocks } from '../prompts/blocks.js';
import { exactInputHash } from '../prompts/delivered-manifest.js';
import { classifyShellTestRun } from '../tools/shell-tests.js';
import { moduleInputPointers } from '../work/starting-inputs.js';

let packages: ReadonlyMap<Role, LoadedPackage>;
let discovery: string;
let engineering: string;
beforeAll(async () => {
  packages = (await loadPromptPackages()).packages;
  discovery = await readFile(resolve('subs/harness/src/prompts/discovery-read-only.procedure.md'), 'utf8');
  engineering = await readFile(resolve('subs/harness/src/prompts/architect-engineering.procedure.md'), 'utf8');
});
const body = (text: string) => text.slice(text.indexOf('\n') + 1).trim();
function revision(phase: 'before' | 'after') {
  return taskBriefingRevision({ revision: phase, goal: 'Integrate the actual provider', requirements: ['Preserve the original need'],
    sections: [{ key: 'constraints', text: phase === 'before' ? 'package hash A; original selected constraints' : 'package hash B; expanded owner constraints supplied whole' }] });
}
function input(role: Role, kind: TaskKind, tool: string, phase: 'before' | 'after' = 'before') {
  const current = revision(phase);
  const environment: TaskEnvironment = { projectRoot: '/project', workingDirectory: role === 'local-architect' || role === 'engineer' ? '/project/subs/validation/src' : '/project',
    candidate: phase, snapshot: null, limits: {}, availableTools: ['read', 'grep', 'ls', tool, ...(role === 'engineer' ? ['shell', 'edit', 'write'] : [])],
    views: [{ path: 'subs/validation/src/.ramify', revision: phase === 'before' ? 'api-A' : 'api-B', modules: ['project/validation'],
      coverage: phase === 'before' ? ['unknown signature: 1'] : ['complete ordinary area'] }], supportPaths: [], cucumberConfiguration: null };
  return { loaded: packages.get(role)!, kind, objective: 'Integrate the requested behavior', goal: 'Integrate the actual provider', requirements: ['Preserve the original need'],
    environment, briefing: buildBriefingDelivery({ mode: 'fresh', current, inheritedRevision: null, history: [] }), inheritedPoint: null, inherited: [], supplyRoleInstructions: true };
}

test.each([
  ['initial-architect', 'initial-analysis', 'submit_initial_analysis'],
  ['global-fork', 'placement', 'submit_placement_decision'],
  ['local-architect', 'orientation', 'submit_work_orientation'],
  ['local-architect', 'assignment', 'submit_work_item_result'],
  ['local-architect', 'capability-qualification', 'submit_capability_qualification'],
  ['capability-architect', 'capability', 'submit_capability_action'],
] as const)('%s/%s fresh and continued effective packets retain usable bounded guidance and current view evidence', (role, kind, tool) => {
  const firstInput = input(role, kind, tool);
  const first = buildTaskPacket(firstInput);
  const afterInput = input(role, kind, tool, 'after');
  const after = buildTaskPacket({ ...afterInput, inheritedPoint: 'session:1/point:1', inherited: first.additions, supplyRoleInstructions: false,
    briefing: buildBriefingDelivery({ mode: 'continue', current: revision('after'), inheritedRevision: 'before', history: [revision('before')] }) });
  const effective = effectiveBlocks([...first.additions, ...after.additions]);
  expect(first.roleInstructions).toContain(body(discovery));
  expect(after.roleInstructions).toBe(first.roleInstructions);
  expect(after.additions.some(item => item.kind === 'role-instructions')).toBe(false);
  expect(after.additions.some(item => item.kind === 'tool-declaration')).toBe(false);
  expect(after.manifest.entries.filter(entry => entry.kind === 'role-instructions')).toHaveLength(1);
  expect(after.manifest.entries.find(entry => entry.kind === 'role-instructions')).toMatchObject({ delivery: 'inherited', hash: exactInputHash(first.roleInstructions) });
  const source = first.manifest.entries.find(entry => entry.kind === 'role-instructions')!.sources.find(source => source.path.endsWith('discovery-read-only.procedure.md'));
  expect(source).toMatchObject({ hash: exactInputHash(discovery), bytes: Buffer.byteLength(discovery) });
  expect(effective.get('environment:views')!.text).toContain('api-B');
  expect(effective.get('environment:views')!.text).not.toContain('api-A');
  expect(effective.get('environment:views')!.text).toContain('complete ordinary area');
  expect(effective.get('environment:availableTools')!.text).not.toContain('shell');
  expect(first.roleInstructions).not.toMatch(/\]\([^)]*references\/(?:discovery|access)\.md\)/);
  expect(first.roleInstructions).not.toContain('Run `ramify materialize');
});

test('expanded capability context changes the selected package while automatic reselection guidance matches current action declarations', () => {
  const base = input('capability-architect', 'capability', 'submit_capability_action');
  const first = buildTaskPacket(base);
  const nextInput = input('capability-architect', 'capability', 'submit_capability_action', 'after');
  const next = buildTaskPacket({ ...nextInput, inheritedPoint: 'P1', inherited: first.additions, supplyRoleInstructions: false,
    briefing: buildBriefingDelivery({ mode: 'continue', current: revision('after'), inheritedRevision: 'before', history: [revision('before')] }) });
  const blocks = effectiveBlocks([...first.additions, ...next.additions]);
  expect(blocks.get('brief:constraints')!.text).toContain('package hash B');
  expect(blocks.get('brief:constraints')!.text).not.toContain('package hash A');
  const procedure = blocks.get(first.additions.find(item => item.kind === 'procedure')!.key)!.text;
  expect(procedure).toContain(body(engineering));
  const schema = JSON.parse(first.declaration.description.slice(first.declaration.description.indexOf('{'))) as { oneOf: Array<{ properties: { kind: { const: string } } }> };
  const currentActions = schema.oneOf.map(action => action.properties.kind.const);
  expect(currentActions).toEqual(['consult-consumer', 'assign', 'delegate-capability', 'request-placement', 'unresolved', 'request-handback', 'partial']);
  for (const action of currentActions) expect(procedure).toContain(`\`${action}\``);
  expect(currentActions).not.toContain('select-context');
  expect(procedure).toContain('the harness automatically reselects');
  expect(procedure).toContain('stateless preflight');
  expect(procedure).toContain('Send the complete action again');
  expect(procedure).toContain('Final submission validates current authority');
});

test('engineer effective guidance resolves contradictory assignment instructions within actual command restrictions', () => {
  const base = input('engineer', 'engineering', 'submit_iteration_result');
  const instruction = 'Run full declared Vitest and Cucumber suites after implementing the provider.';
  const current = taskBriefingRevision({ revision: 'conflict', goal: base.goal, requirements: base.requirements, sections: [{ key: 'assignment', text: instruction }] });
  const packet = buildTaskPacket({ ...base, briefing: buildBriefingDelivery({ mode: 'fresh', current, inheritedRevision: null, history: [] }) });
  const blocks = effectiveBlocks(packet.additions);
  // Preserve the recorded architect prose; guidance resolves the conflict, without keyword classification or rewriting.
  expect(blocks.get('brief:assignment')!.text).toContain(instruction);
  expect(blocks.get(packet.additions.find(item => item.kind === 'procedure')!.key)!.text).toContain('responsible architect');
  expect(packet.roleInstructions).toContain('Whole-suite Vitest and Cucumber runs\n  are refused');
  expect(packet.roleInstructions).toContain('prepared focused Cucumber command');
  const facts = { workingDirectory: '/project', testScripts: {} };
  expect(classifyShellTestRun('vitest run', facts).kind).toBe('whole-suite');
  expect(classifyShellTestRun('cucumber-js', facts).kind).toBe('whole-suite');
  expect(classifyShellTestRun('vitest run subs/validation/src/tests/preview.test.ts', facts).kind).toBe('focused');
  expect(classifyShellTestRun('cucumber-js features/preview.feature', facts).kind).toBe('unverified');
  expect(packet.roleInstructions).toContain("rg -n -F -C 6 '<exact-symbol>' .ramify");
  expect(blocks.get(packet.additions.find(item => item.kind === 'procedure')!.key)!.text).toContain('every configured project and nested project');
});

test('fixture relative import resolves from the actual consumer while source and API evidence remain separate', () => {
  const consumer = '/project/subs/workspace/subs/reviews/subs/validation/src/preview.ts';
  const provider = '/project/subs/workspace/subs/catalog/subs/core/src/history.js';
  const correct = '../../../../catalog/subs/core/src/history.js';
  expect(resolve(dirname(consumer), correct)).toBe(provider);
  expect(resolve(dirname(consumer), '../../../catalog/subs/core/src/history.js')).not.toBe(provider);
  const packet = buildTaskPacket(input('capability-architect', 'capability', 'submit_capability_action'));
  const procedure = effectiveBlocks(packet.additions).get(packet.additions.find(item => item.kind === 'procedure')!.key)!.text;
  expect(procedure).toContain(correct);
  expect(procedure).toContain('Path resolution alone does not prove importability');
  expect(procedure).toContain('No additional Reviews declaration');
  expect(procedure).toContain('explicitly\nrevise the authoritative design');
});

test('module navigation treats supplied identity and coverage as authority without a metadata rediscovery instruction', () => {
  const pointers = moduleInputPointers({ projectRoot: '/project', modules: [{ module: 'project/validation', directory: 'subs/validation', apiPaths: ['subs/validation/src/.ramify'] }], testAreas: [] });
  expect(pointers).toContain('/project/subs/validation/src/.ramify/');
  expect(pointers).not.toContain('Read its metadata for revision');
  expect(pointers).toContain('supplied revision and coverage as authoritative delivery evidence');
  expect(pointers).toContain('Absence under coverage limits is not proof');
});
