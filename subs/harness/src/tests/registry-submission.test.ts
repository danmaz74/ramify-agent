import { describe, expect, test } from 'vitest';
import type { RegistryEntry } from '../../subs/autonomous/subs/planning/src/records.js';
import type { PlacementDecision } from '../../subs/autonomous/subs/work-coordination/src/architecture/records.js';
import { validateFork } from '../../subs/autonomous/subs/work-coordination/src/architecture/submission.js';
import { validateLocalArchitect } from '../../subs/autonomous/subs/work-coordination/src/work/submission.js';
import { assign, outline } from './helpers/iterations.js';
import { placementDecisionFixture as decision, forkDecision, localDecision, registryChange } from '../../subs/autonomous/subs/work-coordination/src/tests/helpers/placement.js';
import { architectIndex, moduleEntry } from './helpers/views.js';

const owner = 'shop/orders';
const other = 'shop/billing';
const index = architectIndex([moduleEntry('shop', '', null), moduleEntry(owner, 'subs/orders', 'shop'), moduleEntry(other, 'subs/billing', 'shop')]);
const committed: RegistryEntry = { schema: 'ramify-agent.capability/2', capability: 'capability:existing', revision: 1,
  behavior: 'Existing behavior', owner, origin: 'entry', decision: null, consumers: [] };
const evidence = { index, registry: new Map([['capability:existing', committed]]), workItems: new Set(['work-item:orders']), hypotheses: new Map(), decisions: new Map() };
const place = (capability: string, consumers: string[] = [], module = owner) => ({ ...localDecision(
  { capability, owner: module, outcome: 'create' },
  [registryChange({ capability, owner: module, consumers: consumers.map(capability => ({ capability, workItem: 'work-item:orders' })) })],
), decisionKey: `draft:placement-decision:${capability.slice('capability:'.length)}` });
const submission = () => ({ ...assign(owner, { externalCapabilities: [{ capability: 'capability:later', owner: other, role: 'use' }] },
  outline({ reuse: [{ capability: 'capability:later', owner: other, role: 'provider' }] })),
  localDecisions: [place('capability:first', ['capability:later']), place('capability:later', ['capability:existing'], other)],
});
const paths = (result: ReturnType<typeof validateLocalArchitect>) => result.ok ? [] : result.errors.map(error => error.path);

describe('complete-submission registry references', () => {
  test.each([false, true])('sibling references resolve regardless of decision order (reversed=%s), without mutating evidence', reverse => {
    const input = submission();
    if (reverse) input.localDecisions.reverse();
    const before = structuredClone(evidence);
    expect(validateLocalArchitect(input, evidence)).toMatchObject({ ok: true });
    expect(evidence).toEqual(before);
  });

  test('forward references within one registry array work in both local and fork submissions', () => {
    const changes = [place('capability:first', ['capability:later']).registry[0]!, place('capability:later').registry[0]!];
    const input = { ...assign(owner, {}, outline()), localDecisions: [localDecision({ capability: 'capability:first', owner }, changes)] };
    expect(validateLocalArchitect(input, evidence).ok).toBe(true);
    expect(validateFork(forkDecision({ decision: decision({ capability: 'capability:first', owner }), registry: changes }), evidence).ok).toBe(true);
  });

  test('unknown references, wrong resulting owners and unknown work items still fail at their own paths', () => {
    const input = submission();
    input.localDecisions[0]!.registry[0]!.consumers = [{ capability: 'capability:absent', workItem: 'work-item:missing' }];
    input.assignment.externalCapabilities = [{ capability: 'capability:absent', owner, role: 'use' }, { capability: 'capability:later', owner, role: 'use' }];
    input.outline!.reuse[0]!.owner = owner;
    expect(paths(validateLocalArchitect(input, evidence))).toEqual([
      'outline.reuse.0.owner', 'localDecisions.0.registry.0.consumers.0.workItem',
      'localDecisions.0.registry.0.consumers.0.capability', 'assignment.externalCapabilities.0.capability',
      'assignment.externalCapabilities.1.owner',
    ]);
    // A decision without a registration does not make a capability available.
    const unregistered = submission();
    unregistered.localDecisions[1]!.registry = [];
    expect(paths(validateLocalArchitect(unregistered, evidence))).toContain('assignment.externalCapabilities.0.capability');
  });

  test.each([owner, other])('duplicate registrations across sibling decisions are refused, even with owner %s', duplicateOwner => {
    const input = { ...assign(owner, {}, outline()), localDecisions: [place('capability:duplicate'), place('capability:duplicate', [], duplicateOwner)] };
    expect(paths(validateLocalArchitect(input, evidence))).toEqual(['localDecisions.1.registry.0.capability']);
    input.localDecisions[0]!.registry.push(input.localDecisions.pop()!.registry[0]!);
    expect(paths(validateLocalArchitect(input, evidence))).toEqual(['localDecisions.0.registry.1.capability']);
  });

  test('a proposed move cannot hide committed ownership or supply its own revision authority', () => {
    const input = { ...assign(owner, { externalCapabilities: [{ capability: 'capability:existing', owner: other, role: 'use' }] },
      outline({ reuse: [{ capability: 'capability:existing', owner: other, role: 'provider' }] })), localDecisions: [place('capability:existing', [], other)] };
    expect(paths(validateLocalArchitect(input, evidence))).toEqual(['localDecisions.0.decision.revises']);
    input.localDecisions[0]!.decision.revises = { decision: 'placement-decision:existing', affected: [] };
    expect(paths(validateLocalArchitect(input, evidence))).toEqual(['localDecisions.0.decision.revises.decision']);
    const prior: PlacementDecision = { ...decision({ capability: 'capability:existing', owner }), schema: 'ramify-agent.placement-decision/2',
      id: 'placement-decision:existing', authority: 'global', request: 'placement-request:existing', workItem: 'work-item:orders', invocation: 'inv-0001',
      evidence: { view: { status: 'placeholder' }, citations: [], gaps: [] }, registry: [], hypothesisRevisions: [] };
    expect(validateLocalArchitect(input, { ...evidence, decisions: new Map([[prior.id, prior]]) }).ok).toBe(true);
    input.assignment.externalCapabilities[0]!.owner = owner;
    expect(paths(validateLocalArchitect(input, { ...evidence, decisions: new Map([[prior.id, prior]]) }))).toContain('assignment.externalCapabilities.0.owner');
  });

  test('a same-submission proposal does not supply committed module creation authority', () => {
    const module = 'shop/new';
    const proposed = { parent: 'shop', directory: 'subs/new', purpose: 'New behavior', tags: [] };
    const placement = place('capability:new', [], module);
    placement.decision.proposed = proposed;
    placement.registry[0]!.proposed = proposed;
    const input = { ...assign(module, {}, outline()), localDecisions: [placement] };
    expect(paths(validateLocalArchitect(input, evidence))).toEqual(['assignment.scope.base.module']);
    delete placement.decision.proposed;
    expect(paths(validateLocalArchitect(input, evidence))).toContain('localDecisions.0.decision.proposed');
  });

  test('consumer metadata retains existing self-reference and cycle behavior; requirement cycles are judged separately', () => {
    const input = { ...assign(owner, {}, outline()), localDecisions: [place('capability:first', ['capability:first', 'capability:second']), place('capability:second', ['capability:first'])] };
    expect(validateLocalArchitect(input, evidence).ok).toBe(true);
  });
});
