import { describe, expect, test } from 'vitest';
import { z } from 'zod';
import { capabilityNeedInputSchema } from '../../subs/autonomous/subs/work-coordination/src/capability/records.js';
import { capabilityActionSchema, validateCapabilityAction } from '../../subs/autonomous/subs/work-coordination/src/capability/submission.js';
import { assignmentBodySchema, assignmentErrors } from '../../subs/autonomous/subs/work-coordination/src/work/assignment.js';
import { validateEngineer } from '../../subs/autonomous/subs/work-coordination/src/work/engineer.js';
import { capabilityLocalArchitectJsonSchema } from '../../subs/autonomous/subs/work-coordination/src/work/submission.js';
import { architectIndex, moduleEntry } from './helpers/views.js';
import { assign, outline } from './helpers/iterations.js';
import type { RegistryEntry } from '../../subs/autonomous/subs/planning/src/records.js';
import type { OwnershipAnswer } from '../../subs/evidence/src/ownership-evidence.js';

const reviews = 'collection-review/workspace/reviews';
const provider = 'collection-review/integration-tests';
const callerPath = 'subs/workspace/subs/reviews/src/tests/steps/preview.steps.ts';
const index = architectIndex([
  moduleEntry('collection-review', '', null),
  moduleEntry('collection-review/workspace', 'subs/workspace', 'collection-review'),
  moduleEntry(reviews, 'subs/workspace/subs/reviews', 'collection-review/workspace'),
  moduleEntry(provider, 'integration-tests', 'collection-review'),
]);
const ownershipAnswer = (path: string, module: string | null, status = 'owned', exclusion: unknown = null) => ({
  paths: [{ path, module, status, exclusion }],
} as unknown as OwnershipAnswer);
const request = (usage: unknown[]) => ({ kind: 'capability-needed', summary: 'Preview needs a provider', request: {
  need: 'Verify the displayed preview', usage, constraints: [], knownInterface: { kind: 'none-known' },
  examples: [{ title: 'Preview displayed', code: 'expect(preview()).toBeVisible()', designation: 'pseudocode' }],
  suggestedProvider: { module: provider, reason: 'Owns integration checks' },
} });

describe('Plan 36 prospective caller ownership', () => {
  test('prospective caller module is required structurally; actual usage may omit it', () => {
    const usage = { path: callerPath, use: 'Observe preview', prospective: true };
    expect(validateEngineer(request([usage]), { capabilityWorkflow: true })).toMatchObject({ ok: false,
      errors: expect.arrayContaining([expect.objectContaining({ path: 'request.usage.0.module' })]) });
    expect(validateEngineer(request([{ ...usage, module: reviews }]), { capabilityWorkflow: true })).toMatchObject({
      ok: true, value: { kind: 'capability-needed', request: { usage: [{ ...usage, module: reviews }] } },
    });
    expect(validateEngineer(request([{ ...usage, prospective: false }]), { capabilityWorkflow: true })).toMatchObject({
      ok: true, value: { kind: 'capability-needed', request: { usage: [{ ...usage, prospective: false }] } },
    });
    const schema = z.toJSONSchema(capabilityNeedInputSchema) as any;
    expect(schema.properties.usage.items.oneOf[1].required).toContain('module');
    expect(schema.properties.usage.items.oneOf[0].required).not.toContain('module');
  });

  test.each([true, false])('contradictory caller module is rejected for prospective=%s before authority exists', prospective => {
    const evidence = { capabilityWorkflow: true, capabilityUsage: { ownership: ownershipAnswer(callerPath, reviews), registry: new Map<string, RegistryEntry>() } };
    const usage = { path: callerPath, use: 'Observe preview', prospective, module: provider };
    expect(validateEngineer(request([usage]), evidence)).toMatchObject({ ok: false, errors: [
      expect.objectContaining({ path: 'request.usage.0.module', expected: reviews }),
    ] });
    // No file is created: the prospective location's ownership suffices.
    expect(validateEngineer(request([{ ...usage, module: reviews }]), evidence).ok).toBe(true);
    const { module: _module, ...actual } = usage;
    expect(validateEngineer(request([{ ...actual, prospective: false }]), evidence).ok).toBe(true);
  });

  test('accepted creation authority gives a missing caller its intended new owner', () => {
    const newOwner = `${reviews}/preview-tests`;
    const registry = new Map<string, RegistryEntry>([['preview-checks', {
      schema: 'ramify-agent.capability/1', capability: 'preview-checks', owner: newOwner,
      revision: 1, behavior: 'Preview checks', origin: 'entry', decision: null, consumers: [],
      proposed: { parent: reviews, directory: 'subs/workspace/subs/reviews/subs/preview-tests', purpose: 'Preview checks', tags: [] },
    }]]);
    const usage = { path: 'subs/workspace/subs/reviews/subs/preview-tests/src/preview.test.ts', use: 'Observe preview', prospective: true, module: newOwner };
    const evidence = { capabilityWorkflow: true, capabilityUsage: { ownership: ownershipAnswer(usage.path, reviews), registry } };
    expect(validateEngineer(request([usage]), evidence).ok).toBe(true);
    expect(validateEngineer(request([{ ...usage, module: provider }]), evidence)).toMatchObject({ ok: false,
      errors: [expect.objectContaining({ expected: newOwner })] });
    expect(validateEngineer(request([usage]), { ...evidence, capabilityUsage: { ownership: null, registry } }).ok).toBe(true);
    expect(validateEngineer(request([usage]), { ...evidence, capabilityUsage: { registry,
      ownership: ownershipAnswer(usage.path, reviews, 'owned', { kind: 'owned-unwired', owner: reviews, directory: 'subs/workspace/subs/reviews/subs/preview-tests' }),
    } }).ok).toBe(true);
  });

  test('root ownership uses the provider answer and unavailable/excluded paths do not invent callers', () => {
    const usage = { path: 'src/new-root-caller.ts', use: 'Observe preview', prospective: true, module: 'collection-review' };
    const evidence = { capabilityWorkflow: true, capabilityUsage: { ownership: ownershipAnswer(usage.path, 'collection-review'), registry: new Map<string, RegistryEntry>() } };
    expect(validateEngineer(request([usage]), evidence).ok).toBe(true);
    for (const kind of ['owned-unwired', 'scratch']) {
      expect(validateEngineer(request([usage]), { ...evidence, capabilityUsage: { ...evidence.capabilityUsage,
        ownership: ownershipAnswer(usage.path, 'collection-review', 'owned', { kind, owner: 'collection-review', directory: 'src' }),
      } }).ok).toBe(true);
    }
    for (const ownership of [null, ownershipAnswer(usage.path, null, 'unowned'),
      ownershipAnswer(usage.path, 'collection-review', 'owned', { kind: 'owned-nested-project', owner: 'collection-review', directory: 'src' })]) {
      expect(validateEngineer(request([usage]), { ...evidence, capabilityUsage: { ...evidence.capabilityUsage, ownership } })).toMatchObject({ ok: false,
        errors: [expect.objectContaining({ path: 'request.usage.0.module', message: expect.stringContaining('Ownership evidence is unavailable') })] });
    }
  });
});

describe('Plan 36 assignment scope and stages', () => {
  test.each([{ modules: [reviews] }, { modules: [reviews, provider] }])('base.modules requires breaking by form for $modules', ({ modules }) => {
    const body = assignmentBodySchema.parse(assign(reviews, {
      scope: { base: { modules, rationale: 'One guarantee spans the named owners' }, extra: [], read: [], rationale: 'Narrow break' },
    }).assignment);
    const evidence = { index, registry: new Map(), outline: outline({ breakingChanges: [
      { guarantee: 'Preview result shape', reason: 'Necessary revision', affectedConsumers: [reviews], citations: [] },
    ] }) };
    expect(assignmentErrors(body, evidence)).toEqual([expect.objectContaining({ path: 'assignment.kind', expected: expect.stringContaining('breaking') })]);
    expect(assignmentErrors({ ...body, kind: 'breaking' }, evidence)).toEqual([]);
    expect(assignmentErrors({ ...body, kind: 'breaking' }, { ...evidence, outline: outline() })).toMatchObject([
      expect.objectContaining({ path: 'assignment.kind', message: expect.stringContaining('records none') }),
    ]);
    expect(assignmentErrors(assignmentBodySchema.parse(assign(reviews).assignment), evidence)).toEqual([]);
    const capabilitySchema = z.toJSONSchema(capabilityActionSchema) as any;
    const localSchema = capabilityLocalArchitectJsonSchema as any;
    expect(capabilitySchema.oneOf.find((option: any) => option.properties.kind.const === 'assign').properties.assignment.allOf).toHaveLength(1);
    expect(localSchema.oneOf.find((option: any) => option.properties.kind.const === 'assign').properties.assignment.allOf).toHaveLength(1);
  });

  test('flat capability basis uses zero while ordinary applicable outlines keep explicit zero-based indices', () => {
    const body = assignmentBodySchema.parse(assign(reviews).assignment);
    const evidence = { index, registry: new Map(), outline: null };
    expect(assignmentErrors(body, evidence)).toEqual([]);
    expect(assignmentErrors({ ...body, stage: 1 }, evidence)).toEqual([expect.objectContaining({ path: 'assignment.stage', expected: '0' })]);
    const staged = outline({ decomposition: { kind: 'staged', rationale: 'Two changes' }, stages: [
      { title: 'First', approach: 'non-breaking', dependsOn: [], note: '' },
      { title: 'Second', approach: 'non-breaking', dependsOn: [0], note: '' },
    ] });
    expect(assignmentErrors({ ...body, stage: 1 }, { ...evidence, outline: staged })).toEqual([]);
    expect(assignmentErrors({ ...body, stage: 2 }, { ...evidence, outline: staged })).toEqual([expect.objectContaining({ path: 'assignment.stage' })]);
  });

  test('valid preflight changes no basis and full final action must be resubmitted against current authority', () => {
    const basis = { task: 'cap-001', planRevision: 1, coordinatorInvocation: 'inv-0003', state: 'coordinating' as const, openAssignment: null, openChild: null };
    const before = structuredClone(basis);
    const action = { task: basis.task, planRevision: 1, invocation: basis.coordinatorInvocation, kind: 'partial', progress: 'Read provider', unfinished: ['Implement preview'] };
    expect(validateCapabilityAction(action, basis).valid).toBe(true);
    expect(basis).toEqual(before);
    expect(validateCapabilityAction({}, basis).valid).toBe(false);
    expect(validateCapabilityAction(action, basis).valid).toBe(true);
    expect(validateCapabilityAction(action, { ...basis, planRevision: 2 })).toMatchObject({ valid: false,
      issues: [expect.objectContaining({ path: ['planRevision'] })] });
  });
});
