import { beforeAll, expect, test } from 'vitest';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { Role } from '../interfaces/protocol/runs.js';
import { loadPromptPackages, type LoadedPackage } from '../prompts/packages.js';
import { buildTaskPacket, type TaskKind } from '../prompts/tasks.js';
import { type TaskEnvironment } from '../../subs/task-execution/src/delivery/packet.js';
import { buildBriefingDelivery, taskBriefingRevision } from '../../subs/task-execution/src/delivery/briefings.js';
import { effectiveBlocks } from '../../subs/task-execution/src/delivery/blocks.js';
import { exactInputHash } from '../../subs/task-execution/src/delivery/delivered-manifest.js';
import { classifyShellTestRun } from '../tools/shell-tests.js';
import { moduleInputPointers } from '../../subs/autonomous/src/work/starting-inputs.js';
import { validateEngineer } from '../../subs/autonomous/src/work/engineer.js';

let packages: ReadonlyMap<Role, LoadedPackage>;
let discovery: string;
let engineering: string;
let planning: string;
beforeAll(async () => {
  packages = (await loadPromptPackages()).packages;
  discovery = await readFile(resolve('subs/harness/src/prompts/discovery-read-only.procedure.md'), 'utf8');
  planning = await readFile(resolve('subs/harness/src/prompts/architect-planning.procedure.md'), 'utf8');
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
  expect(packet.roleInstructions).toContain('prepared Cucumber feature check');
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
  const text = procedure.replace(/\s+/g, ' ');
  expect(text).toContain("Resolve its relative path from the consumer file's directory");
  expect(text).toContain('Path resolution alone does not prove importability');
  expect(text).toContain('not at each intermediate descendant');
  expect(procedure).toContain('explicitly\nrevise the authoritative design');
});

test('module navigation treats supplied identity and coverage as authority without a metadata rediscovery instruction', () => {
  const pointers = moduleInputPointers({ projectRoot: '/project', modules: [{ module: 'project/validation', directory: 'subs/validation', apiPaths: ['subs/validation/src/.ramify'] }], testAreas: [] });
  expect(pointers).toContain('/project/subs/validation/src/.ramify/');
  expect(pointers).not.toContain('Read its metadata for revision');
  expect(pointers).toContain('supplied revision and coverage as authoritative delivery evidence');
  expect(pointers).toContain('Absence under coverage limits is not proof');
});

test.each([false, true])('assignment-based completion survives mixed feature results (capability workflow %s)', async capabilityWorkflow => {
  const loaded = (await loadPromptPackages({ capabilityWorkflow })).packages.get('engineer')!;
  const base = { ...input('engineer', 'engineering', 'submit_iteration_result'), loaded };
  const assignment = 'Bind sc-001 and sc-002. The prepared feature command must pass.';
  const result = 'Feature check exit 1: sc-001 passed; sc-002 passed; sc-003 undefined (unassigned).';
  const current = taskBriefingRevision({ revision: 'assigned-feature', goal: base.goal, requirements: base.requirements,
    sections: [{ key: 'assignment', text: assignment }, { key: 'check-results', text: result }] });
  const first = buildTaskPacket({ ...base, briefing: buildBriefingDelivery({ mode: 'fresh', current, inheritedRevision: null, history: [] }) });
  const continued = buildTaskPacket({ ...base, inheritedPoint: 'engineer:1', inherited: first.additions, supplyRoleInstructions: false,
    briefing: buildBriefingDelivery({ mode: 'continue', current, inheritedRevision: current.revision, history: [current] }) });
  for (const blocks of [effectiveBlocks(first.additions), effectiveBlocks([...first.additions, ...continued.additions])]) {
    // Retain the authored request and failed receipt; the role procedure explains how to assess their scope.
    expect(blocks.get('brief:assignment')!.text).toContain(assignment);
    expect(blocks.get('brief:check-results')!.text).toContain(result);
    const procedure = [...blocks.values()].find(block => block.kind === 'procedure')!.text.replace(/\s+/g, ' ');
    expect(procedure).toContain('Propose completion when the assigned work is complete and supported by evidence.');
    expect(procedure).toContain('Report actual case results and the command exit status in `findings`.');
    expect(procedure).toContain('a request for a passing feature command adds no unassigned obligations');
    expect(procedure).toContain('Pending or undefined unassigned cases alone do not require `partial`');
    expect(procedure).toContain('assigned work remains unfinished');
    expect(procedure).toContain('Investigate unexpected failures');
    expect(procedure).toContain('all required gates still apply');
  }
  expect(continued.additions.some(block => block.kind === 'role-instructions')).toBe(false);
  const evidence = { assigned: ['sc-001', 'sc-002'], capabilityWorkflow };
  const proposal = { kind: 'completion-proposed', summary: 'Implemented the two assigned scenarios.', findings: [result],
    bindings: evidence.assigned.map(id => ({ id, fakes: [] })) };
  expect(validateEngineer(proposal, evidence)).toMatchObject({ ok: true, value: proposal });
  expect(validateEngineer({ ...proposal, bindings: proposal.bindings.slice(0, 1) }, evidence).ok).toBe(false);
  expect(validateEngineer({ kind: 'partial', done: ['sc-001'], unfinished: ['sc-002 still fails'], findings: [result] }, evidence).ok).toBe(true);
  const regression = 'Feature check exit 1: sc-001 failed with a changed result; sc-003 undefined (unassigned).';
  expect(validateEngineer({ kind: 'partial', done: [], unfinished: ['Assigned scenario sc-001 regressed'], findings: [regression] }, evidence))
    .toMatchObject({ ok: true, value: { findings: [regression] } });
});

test.each([
  [false, 'local-architect', 'assignment', 'submit_work_item_result'],
  [true, 'local-architect', 'assignment', 'submit_work_item_result'],
  [true, 'capability-architect', 'capability', 'submit_capability_action'],
] as const)('assigning architect receives planning once, retains it on continuation and preserves feature-check rules (%s/%s)', async (capabilityWorkflow, role, kind, tool) => {
  const loaded = (await loadPromptPackages({ capabilityWorkflow })).packages.get(role)!;
  const base = { ...input(role, kind, tool), loaded };
  const packet = buildTaskPacket(base);
  const rawProcedure = [...effectiveBlocks(packet.additions).values()].find(block => block.kind === 'procedure')!.text;
  expect(rawProcedure.split(body(planning))).toHaveLength(2);
  expect(rawProcedure.indexOf(body(planning))).toBeLessThan(rawProcedure.indexOf('`assignment.scope` decides'));
  expect(rawProcedure.split('`assignment.startingPoints`')).toHaveLength(2);
  const planningSource = packet.manifest.entries.find(entry => entry.kind === 'procedure')!.sources.find(source => source.path.endsWith('architect-planning.procedure.md'));
  expect(planningSource).toMatchObject({ hash: exactInputHash(planning), bytes: Buffer.byteLength(planning) });
  const current = revision('before');
  const continued = buildTaskPacket({ ...base, inheritedPoint: 'architect:1', inherited: packet.additions, supplyRoleInstructions: false,
    briefing: buildBriefingDelivery({ mode: 'continue', current, inheritedRevision: current.revision, history: [current] }) });
  expect(continued.additions.some(block => block.kind === 'procedure')).toBe(false);
  const effective = [...effectiveBlocks([...packet.additions, ...continued.additions]).values()].find(block => block.kind === 'procedure')!.text;
  expect(effective).toBe(rawProcedure);
  const procedure = rawProcedure.replace(/\s+/g, ' ');
  expect(procedure).toContain('Do not require an intermediate contribution to make the entire selected feature pass');
  expect(procedure).toContain('including unexpected failures and regressions');
  expect(procedure).toContain('unfinished assigned work requires `partial`');
  expect(procedure).toContain('all applicable gates before acceptance');
  expect(procedure).toContain('feature selection adds no completion obligations');
});
