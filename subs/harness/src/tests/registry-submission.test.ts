import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { describe, expect, test } from 'vitest';
import type { RegistryEntry } from '../../subs/autonomous/subs/planning/src/records.js';
import type { PlacementDecision } from '../../subs/autonomous/src/architecture/records.js';
import { validateFork } from '../../subs/autonomous/src/architecture/submission.js';
import { localArchitectInputSchema, validateLocalArchitect, type WorkEvidence } from '../../subs/autonomous/src/work/submission.js';
import type { Obligation } from '../../subs/autonomous/src/work/obligations.js';
import { assign, outline, treeInputs } from './helpers/iterations.js';
import { placementDecisionFixture as decision, forkDecision, localDecision, registryChange } from './helpers/placement.js';
import { architectIndex, moduleEntry } from './helpers/views.js';
import { fixtureRoot } from './helpers/fixture.js';

const owner = 'shop/orders';
const other = 'shop/billing';
const index = architectIndex([moduleEntry('shop', '', null), moduleEntry(owner, 'subs/orders', 'shop'), moduleEntry(other, 'subs/billing', 'shop')]);
const committed: RegistryEntry = { schema: 'ramify-agent.capability/1', capability: 'existing', revision: 1,
  behavior: 'Existing behavior', owner, origin: 'entry', decision: null, consumers: [] };
const evidence = { index, registry: new Map([['existing', committed]]), workItems: new Set(['wi-001']), hypotheses: new Map(), decisions: new Map() };
const place = (capability: string, consumers: string[] = [], module = owner) => localDecision(
  { capability, owner: module, outcome: 'create' },
  [registryChange({ capability, owner: module, consumers: consumers.map(capability => ({ capability, workItem: 'wi-001' })) })],
);
const submission = () => ({ ...assign(owner, { externalCapabilities: [{ capability: 'later', owner: other, role: 'use' }] },
  outline({ reuse: [{ capability: 'later', owner: other, role: 'provider' }] })),
  localDecisions: [place('first', ['later']), place('later', ['existing'], other)],
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
    const changes = [place('first', ['later']).registry[0]!, place('later').registry[0]!];
    const input = { ...assign(owner, {}, outline()), localDecisions: [localDecision({ capability: 'first', owner }, changes)] };
    expect(validateLocalArchitect(input, evidence).ok).toBe(true);
    expect(validateFork(forkDecision({ decision: decision({ capability: 'first', owner }), registry: changes }), evidence).ok).toBe(true);
  });

  test('unknown references, wrong resulting owners and unknown work items still fail at their own paths', () => {
    const input = submission();
    input.localDecisions[0]!.registry[0]!.consumers = [{ capability: 'absent', workItem: 'wi-404' }];
    input.assignment.externalCapabilities = [{ capability: 'absent', owner, role: 'use' }, { capability: 'later', owner, role: 'use' }];
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
    const input = { ...assign(owner, {}, outline()), localDecisions: [place('duplicate'), place('duplicate', [], duplicateOwner)] };
    expect(paths(validateLocalArchitect(input, evidence))).toEqual(['localDecisions.1.registry.0.capability']);
    input.localDecisions[0]!.registry.push(input.localDecisions.pop()!.registry[0]!);
    expect(paths(validateLocalArchitect(input, evidence))).toEqual(['localDecisions.0.registry.1.capability']);
  });

  test('a proposed move cannot hide committed ownership or supply its own revision authority', () => {
    const input = { ...assign(owner, { externalCapabilities: [{ capability: 'existing', owner: other, role: 'use' }] },
      outline({ reuse: [{ capability: 'existing', owner: other, role: 'provider' }] })), localDecisions: [place('existing', [], other)] };
    expect(paths(validateLocalArchitect(input, evidence))).toEqual(['localDecisions.0.decision.revises']);
    input.localDecisions[0]!.decision.revises = { decision: 'gd-001', affected: [] };
    expect(paths(validateLocalArchitect(input, evidence))).toEqual(['localDecisions.0.decision.revises.decision']);
    const prior: PlacementDecision = { ...decision({ capability: 'existing', owner }), schema: 'ramify-agent.placement-decision/1',
      id: 'gd-001', authority: 'global', request: 'pr-001', workItem: 'wi-001', invocation: 'inv-0001',
      evidence: { view: { status: 'placeholder' }, citations: [], gaps: [] }, registry: [], hypothesisRevisions: [] };
    expect(validateLocalArchitect(input, { ...evidence, decisions: new Map([[prior.id, prior]]) }).ok).toBe(true);
    input.assignment.externalCapabilities[0]!.owner = owner;
    expect(paths(validateLocalArchitect(input, { ...evidence, decisions: new Map([[prior.id, prior]]) }))).toContain('assignment.externalCapabilities.0.owner');
  });

  test('a same-submission proposal does not supply committed module creation authority', () => {
    const module = 'shop/new';
    const proposed = { parent: 'shop', directory: 'subs/new', purpose: 'New behavior', tags: [] };
    const placement = place('new', [], module);
    placement.decision.proposed = proposed;
    placement.registry[0]!.proposed = proposed;
    const input = { ...assign(module, {}, outline()), localDecisions: [placement] };
    expect(paths(validateLocalArchitect(input, evidence))).toEqual(['assignment.scope.base.module']);
    delete placement.decision.proposed;
    expect(paths(validateLocalArchitect(input, evidence))).toContain('localDecisions.0.decision.proposed');
  });

  test('consumer metadata retains existing self-reference and cycle behavior; requirement cycles are judged separately', () => {
    const input = { ...assign(owner, {}, outline()), localDecisions: [place('first', ['first', 'second']), place('second', ['first'])] };
    expect(validateLocalArchitect(input, evidence).ok).toBe(true);
  });
});

describe('retained inv-0006 rejection', () => {
  test('the exact rejected bytes preserve the provider consumer edge and both assignment references', async () => {
    // Run 20261011T143710Z-e572ca at 8d5e468; evidence.json extracts the
    // committed registry and relevant validation fields from inv-0006/inputs.json.
    // The declared fixture tree supplies modules; no provider process is run.
    const raw = await readFile(new URL('./helpers/registry-submission/inv-0006.json', import.meta.url));
    expect(raw.length).toBe(13376);
    expect(createHash('sha256').update(raw).digest('hex')).toBe('9cb1f64b65b9f144f5d10ac1cad12cb4ceceabbcccb95f064d0a3def74c93a80');
    const input = localArchitectInputSchema.parse(JSON.parse(raw.toString()));
    if (input.kind !== 'assign') throw new Error('Retained submission must assign');
    const original = JSON.parse(await readFile(new URL('./helpers/registry-submission/evidence.json', import.meta.url), 'utf8')) as {
      registry: RegistryEntry[]; bounds: WorkEvidence['bounds']; package: string[]; workItems: string[];
      guardedPaths: string[]; harnessOnly: string[]; obligations: { entries: [string, Obligation][]; tests: number };
    };
    const retained: WorkEvidence = {
      index: await treeInputs().refresh(fixtureRoot), registry: new Map(original.registry.map(entry => [entry.capability, entry])),
      workItems: new Set(original.workItems), bounds: original.bounds, package: new Set(original.package),
      guardedPaths: new Set(original.guardedPaths), harnessOnly: new Set(original.harnessOnly),
      obligations: { actor: { kind: 'work-item', id: 'wi-001' },
        projection: { obligations: new Map(original.obligations.entries), tests: original.obligations.tests } },
    };
    const before = structuredClone(retained);
    expect(validateLocalArchitect(input, retained)).toMatchObject({ ok: true });
    expect(validateLocalArchitect({ ...input, localDecisions: [...input.localDecisions].reverse() }, retained)).toMatchObject({ ok: true });
    expect(retained).toEqual(before);
    expect(input.localDecisions[2]!.registry[0]!.consumers).toEqual([{ capability: 'evaluate-proposed-revision-chain', workItem: 'wi-001' }]);
    expect(input.assignment.externalCapabilities.map(entry => entry.capability)).toEqual(['resolve-chain-predecessors', 'parse-revision-chain-arguments']);
  });
});
