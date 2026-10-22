import { describe, expect, test } from 'vitest';
import { outline, readDeclaredTree } from '../../../../../../src/tests/helpers/iterations.js';
import { copyFixture } from '../../../../../../src/tests/helpers/fixture.js';
import { contractAuthorJsonSchema, contractJsonSchema, contractSubmissionKinds, contractSubmissionSchema, contractIdentityErrors, validateContract } from '../contracts/submission.js';
import { fakeNamingViolations, isFakeFile } from '../contracts/naming.js';
import { contractPublicationRefusal, executionRetirements, registerContract, registrationNeeded } from '../contracts/accept.js';
import { consumerRequirementSchema, contractRecordSchema, executionRetirementSchema, providerObligationSchema } from '../contracts/records.js';
import { cycleClosedBy, cycleIdentity } from '../contracts/graph.js';
import { depthOf, nextWorkItem } from '../contracts/schedule.js';
import { integrationWorkItem } from '../work/integration.js';
import { validateEngineer } from '../work/engineer.js';
import { validateLocalArchitect } from '../work/submission.js';
import type { WorkItem } from '../work/records.js';

/*
 * The contract submission, the need that asks for one, the yield that waits
 * for a provider, and the three rules the harness applies over them: the
 * fake-naming rule the contract gate verifies, the registration key that
 * makes a repeat harmless, and the capability graph that decides what a
 * cycle is.
 *
 * Every submission here goes through the same judge, the same schema and the
 * same rules an agent's would.
 */

const reviews = 'collection-review/workspace/reviews';
const validation = 'collection-review/workspace/reviews/validation';
const validationDirectory = 'subs/workspace/subs/reviews/subs/validation';

/** The declared module tree of the fixture, which the rules are judged against. */
async function evidence(exists: (path: string) => Promise<boolean> = async () => true) {
  const fixture = await copyFixture();
  try {
    return { index: await readDeclaredTree(fixture.root), consumer: reviews, exists };
  } finally {
    await fixture.remove();
  }
}

function established(extra: Record<string, unknown> = {}) {
  return {
    kind: 'established',
    mode: 'fake-backed',
    authority: { kind: 'provider', owner: validation, rationale: 'The capability\'s public contract belongs with its implementation.' },
    provider: validation,
    behavior: 'A note of at most 500 characters is within the limit; a longer one is not.',
    artifacts: {
      interface: [{ path: 'subs/a/src/interfaces/note-limit.ts', exports: ['NoteLimit'] }],
      conformance: [{ path: 'subs/a/src/tests/note-limit.conformance.test.ts' }],
      fake: [{
        path: 'subs/a/src/fakes/note-limit.fake.ts',
        exports: ['createNoteLimitFake'],
        standsFor: [{ fake: 'createNoteLimitFake', path: `${validationDirectory}/src/note-limit.ts`, export: 'createNoteLimit', exposure: { to: ['parent'], reexposed: [] } }],
      }],
      exposure: [{ path: 'subs/a/module.ramify', declaration: 'expose-src NoteLimit from "interfaces/note-limit.ts" to parent' }],
    },
    fakeInjections: ['subs/workspace/subs/reviews/src/notes.ts'],
    summary: 'The agreement is established and the consumer runs against the fake.',
    ...extra,
  };
}

function fresh(extra: Record<string, unknown> = {}) {
  const base = established(extra);
  return base.mode === 'access-only'
    ? { ...base, contractKey: 'draft:contract:note-limit' }
    : { ...base, contractKey: 'draft:contract:note-limit',
      providerObligationKey: 'draft:provider-obligation:note-limit',
      consumerRequirementKey: 'draft:consumer-requirement:review-notes-note-limit' };
}

describe('the contract submission', () => {
  test('descriptive proposals are delivered in the tool schema and reject wrong namespaces at their fields', async () => {
    const proposal = { ...established(), contractKey: 'draft:contract:review-predecessor-resolution',
      providerObligationKey: 'draft:provider-obligation:provide-review-predecessor-resolution',
      consumerRequirementKey: 'draft:consumer-requirement:preview-resolves-review-predecessors' };
    const delivered = JSON.stringify(contractJsonSchema);
    expect(delivered).toContain('draft:contract:<descriptive-name>');
    expect(delivered).toContain('draft:provider-obligation:<descriptive-name>');
    expect(delivered).toContain('draft:consumer-requirement:<descriptive-name>');
    expect(contractSubmissionSchema.safeParse({ kind: 'incomplete', done: [],
      unfinished: ['The provider conformance suite remains unfinished.'], findings: [] }).success).toBe(true);
    expect((await validateContract(proposal, await evidence())).ok).toBe(true);
    const wrong = await validateContract({ ...proposal, consumerRequirementKey: 'provider-obligation:provide-review-predecessor-resolution' }, await evidence());
    expect(wrong.ok).toBe(false);
    if (!wrong.ok) expect(wrong.errors.map(error => error.path)).toContain('consumerRequirementKey');
    const accepted = await validateContract(proposal, await evidence());
    if (!accepted.ok || accepted.value.kind !== 'established') throw new Error('the descriptive agreement was rejected');
    const occupied = new Map([
      ['contract:review-predecessor-resolution', 'has an accepted agreement'],
      ['consumer-requirement:preview-resolves-review-predecessors', 'has a retired requirement'],
    ]);
    expect(contractIdentityErrors(accepted.value, occupied).map(error => error.path))
      .toEqual(['contractKey', 'consumerRequirementKey']);
    expect(contractIdentityErrors(accepted.value, occupied)
      .map(error => error.path)).toEqual(['contractKey', 'consumerRequirementKey']);
  });
  test('attachment and revision cite the accepted agreement before the gate', async () => {
    const current = { contractId: 'contract:review-predecessor-resolution',
      providerObligationId: 'provider-obligation:provide-review-predecessor-resolution' };
    const attached = { ...established(), ...current,
      consumerRequirementKey: 'draft:consumer-requirement:preview-resolves-review-predecessors' };
    const attachment = { kind: 'attach' as const, ...current };
    const delivered = JSON.stringify(contractAuthorJsonSchema(attachment));
    expect(delivered).toContain('contractId');
    expect(delivered).not.toContain('contractKey');
    expect((await validateContract(attached, await evidence(), attachment)).ok).toBe(true);
    const wrong = await validateContract({ ...attached, contractId: 'contract:another-agreement' }, await evidence(), attachment);
    expect(wrong.ok).toBe(false);
    if (!wrong.ok) expect(wrong.errors.map(error => error.path)).toContain('contractId');
    const revision = { kind: 'revise' as const, ...current,
      consumerRequirementId: 'consumer-requirement:preview-resolves-review-predecessors' };
    const revised = { ...established(), ...current, consumerRequirementId: revision.consumerRequirementId };
    expect((await validateContract(revised, await evidence(), revision)).ok).toBe(true);
    const redirected = await validateContract({ ...revised, consumerRequirementId: 'consumer-requirement:other' },
      await evidence(), revision);
    expect(redirected.ok).toBe(false);
    if (!redirected.ok) expect(redirected.errors.map(error => error.path)).toContain('consumerRequirementId');
    const keys = ['draft:consumer-requirement:preview-reads-parent', 'draft:consumer-requirement:preview-reads-sibling'];
    const split = { ...established(), ...current, consumerRequirementKeys: keys,
      retirements: [{ id: revision.consumerRequirementId, kind: 'consumer-requirement', replacementKeys: keys,
        reason: 'The two predecessor behaviors need separate verification.' }] };
    expect((await validateContract(split, await evidence(), revision)).ok).toBe(true);
    const wrongSource = await validateContract({ ...split, retirements: [{ ...split.retirements[0],
      id: 'consumer-requirement:foreign' }] }, await evidence(), revision);
    expect(wrongSource.ok).toBe(false);
    if (!wrongSource.ok) expect(wrongSource.errors.map(error => error.path)).toContain('retirements.0.id');
    const missing = await validateContract({ ...split, retirements: [{ ...split.retirements[0],
      replacementKeys: keys.slice(0, 1) }] }, await evidence(), revision);
    expect(missing.ok).toBe(false);
    const replacement = { ...established(), contractKey: 'draft:contract:review-predecessor-routing',
      providerObligationKey: 'draft:provider-obligation:provide-review-predecessor-routing',
      consumerRequirementId: revision.consumerRequirementId,
      retirements: [
        { id: current.contractId, kind: 'contract', replacementKeys: ['draft:contract:review-predecessor-routing'],
          reason: 'The agreement changes kind under this revision.' },
        { id: current.providerObligationId, kind: 'provider-obligation',
          replacementKeys: ['draft:provider-obligation:provide-review-predecessor-routing'],
          reason: 'The provider obligation follows the replacement agreement.' },
      ] };
    expect((await validateContract(replacement, await evidence(), revision)).ok).toBe(true);
    const replacementAccepted = await validateContract(replacement, await evidence(), revision);
    if (!replacementAccepted.ok || replacementAccepted.value.kind !== 'established') throw new Error('replacement was rejected');
    const occupied = new Map([
      ['contract:review-predecessor-routing', 'has an accepted agreement'],
      ['provider-obligation:provide-review-predecessor-routing', 'has a retired obligation'],
    ]);
    expect(contractIdentityErrors(replacementAccepted.value, occupied).map(error => error.path))
      .toEqual(['contractKey', 'providerObligationKey']);
    const corrected = { ...replacementAccepted.value,
      contractKey: 'draft:contract:review-predecessor-routing-v2',
      providerObligationKey: 'draft:provider-obligation:provide-review-predecessor-routing-v2',
      retirements: [
        { ...replacement.retirements[0], replacementKeys: ['draft:contract:review-predecessor-routing-v2'] },
        { ...replacement.retirements[1], replacementKeys: ['draft:provider-obligation:provide-review-predecessor-routing-v2'] },
      ] };
    expect(contractIdentityErrors(corrected as typeof replacementAccepted.value, occupied).map(error => error.path)).toEqual([]);
    expect((await validateContract(corrected, await evidence(), revision)).ok).toBe(true);
    const foreignAgreement = await validateContract({ ...replacement, retirements: [
      { ...replacement.retirements[0], id: 'contract:foreign' }, replacement.retirements[1],
    ] }, await evidence(), revision);
    expect(foreignAgreement.ok).toBe(false);
    if (!foreignAgreement.ok) expect(foreignAgreement.errors.map(error => error.path)).toContain('retirements.0.id');
  });
  test('access-only descriptive agreements ask for only the contract identity', async () => {
    const access = established({ mode: 'access-only',
      artifacts: { ...established().artifacts as object, fake: [], conformance: [] }, fakeInjections: [] });
    const fresh = { ...access, contractKey: 'draft:contract:expose-review-predecessors' };
    expect((await validateContract(fresh, await evidence())).ok).toBe(true);
    expect((await validateContract({ ...fresh, providerObligationKey: 'draft:provider-obligation:unused' },
      await evidence())).ok).toBe(false);
    const current = { contractId: 'contract:expose-review-predecessors', providerObligationId: null };
    const attached = { ...access, contractId: current.contractId };
    expect((await validateContract(attached, await evidence(), { kind: 'attach', ...current })).ok).toBe(true);
    expect((await validateContract(attached, await evidence(),
      { kind: 'revise', ...current, consumerRequirementId: null })).ok).toBe(true);
    expect((await validateContract({ ...attached, consumerRequirementKey: 'draft:consumer-requirement:unused' },
      await evidence(), { kind: 'attach', ...current })).ok).toBe(false);
    expect(JSON.stringify(contractAuthorJsonSchema({ kind: 'attach', ...current })))
      .toContain('contractId');
  });
  test('a requirement merge stays with one consumer and preserves every named source', async () => {
    const current = { contractId: 'contract:review-predecessor-resolution',
      providerObligationId: 'provider-obligation:provide-review-predecessor-resolution' };
    const first = 'consumer-requirement:preview-reads-parent';
    const second = 'consumer-requirement:preview-reads-sibling';
    const revision = { kind: 'revise' as const, ...current, consumerRequirementId: first,
      consumerWorkItem: 'work-item:review-preview',
      consumerRequirements: [{ id: first, workItem: 'work-item:review-preview' },
        { id: second, workItem: 'work-item:review-preview' }] };
    const key = 'draft:consumer-requirement:preview-resolves-predecessors';
    const merged = { ...established(), ...current, consumerRequirementKey: key,
      scope: { consumerWorkItem: 'work-item:review-preview' },
      retirements: [first, second].map(id => ({ id, kind: 'consumer-requirement', replacementKeys: [key],
        reason: 'The same preview verification now covers both predecessor paths.' })) };
    expect((await validateContract(merged, await evidence(), revision)).ok).toBe(true);
    const foreign = await validateContract({ ...merged, retirements: [merged.retirements[0],
      { ...merged.retirements[1], id: 'consumer-requirement:foreign' }] }, await evidence(), revision);
    expect(foreign.ok).toBe(false);
    if (!foreign.ok) expect(foreign.errors.map(error => error.path)).toContain('retirements.1.id');
    const wrongScope = await validateContract({ ...merged, scope: { consumerWorkItem: 'work-item:another' } },
      await evidence(), revision);
    expect(wrongScope.ok).toBe(false);
    if (!wrongScope.ok) expect(wrongScope.errors.map(error => error.path)).toContain('scope.consumerWorkItem');
  });
  test('a kind change must retire all current identities after provider and consumers settle', async () => {
    const contractId = 'contract:review-predecessor-resolution';
    const providerObligationId = 'provider-obligation:provide-review-predecessor-resolution';
    const requirementId = 'consumer-requirement:preview-resolves-review-predecessors';
    const key = 'draft:contract:expose-review-predecessors';
    const revision = { kind: 'revise' as const, contractId, providerObligationId, consumerRequirementId: requirementId,
      consumerWorkItem: 'work-item:review-preview', mode: 'fake-backed' as const,
      consumerRequirements: [{ id: requirementId, workItem: 'work-item:review-preview' }],
      conversionBlockers: [] };
    const changed = { ...established({ mode: 'access-only',
      artifacts: { ...established().artifacts, fake: [], conformance: [] }, fakeInjections: [] }),
      contractKey: key, scope: { consumerWorkItems: ['work-item:review-preview'] },
      retirements: [
        { id: contractId, kind: 'contract', replacementKeys: [key], reason: 'Existing behavior is exposed directly.' },
        { id: providerObligationId, kind: 'provider-obligation', replacementKeys: [key], reason: 'The real provider conformed.' },
        { id: requirementId, kind: 'consumer-requirement', replacementKeys: [key], reason: 'The consumer verified the existing behavior.' },
      ] };
    expect((await validateContract(changed, await evidence(), revision)).ok).toBe(true);
    const blocked = await validateContract(changed, await evidence(), { ...revision,
      conversionBlockers: [`consumer requirement ${requirementId} has not been verified at its current revision`] });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.errors.map(error => error.path)).toContain('scope');
    const omitted = await validateContract({ ...changed, retirements: changed.retirements.slice(0, 2) },
      await evidence(), revision);
    expect(omitted.ok).toBe(false);
    const bypass = await validateContract({ ...changed, providerObligationKey: 'draft:provider-obligation:unexpected',
      consumerRequirementId: requirementId }, await evidence(), revision);
    expect(bypass.ok).toBe(false);
  });
  test('it is a union discriminated on kind, and has no field for an ID the harness knows', () => {
    const union = (contractJsonSchema as { anyOf?: unknown[]; oneOf?: unknown[] });
    expect(union.anyOf ?? union.oneOf).toHaveLength(3);
    const kinds = [...new Set(contractSubmissionSchema.options.map(option => option.shape.kind.value))];
    expect(kinds).toEqual(['established', 'incomplete']);
    expect([...contractSubmissionKinds]).toEqual(kinds);
    // The contract, its revision, the obligation, the requirement, the
    // iteration and the work item are all the harness's.
    const text = JSON.stringify(contractJsonSchema);
    for (const assigned of ['contract', 'revision', 'obligation', 'requirement', 'iteration', 'workItem', 'gate', 'hash']) {
      expect(text).not.toContain(`"${assigned}"`);
    }
  });

  test('a schema violation returns every error with its path, and a corrected submission is accepted', async () => {
    const judged = await validateContract({
      kind: 'agreed',
      mode: 'fake-backed',
      provider: validation,
    }, await evidence());
    expect(judged.ok).toBe(false);
    if (judged.ok) return;
    expect(judged.errors.some(error => error.path === 'kind')).toBe(true);

    const unknownKey = await validateContract({ ...fresh(), extra: 1 }, await evidence());
    expect(unknownKey.ok).toBe(false);
    if (!unknownKey.ok) expect(unknownKey.errors.map(error => error.message).join(' ')).toContain('extra');

    const corrected = await validateContract(fresh(), await evidence());
    expect(corrected.ok).toBe(true);

    const incomplete = await validateContract({
      kind: 'incomplete',
      done: ['read both sides'],
      unfinished: ['the fake does not pass the conformance suite yet'],
      findings: [],
    }, await evidence());
    expect(incomplete.ok).toBe(true);
  });

  test('the rules the schema cannot hold', async () => {
    const known = await evidence();

    const unplaced = await validateContract(fresh({ provider: 'collection-review/nowhere' }), known);
    expect(unplaced.ok).toBe(false);
    if (!unplaced.ok) expect(unplaced.errors.map(error => error.path)).toContain('provider');

    const absent = await validateContract(fresh(), { index: known.index, consumer: reviews, exists: async path => !path.endsWith('.fake.ts') });
    expect(absent.ok).toBe(false);
    if (!absent.ok) expect(absent.errors[0]!.path).toBe('artifacts.fake.0.path');

    // A fake-backed agreement has executable evidence, or it delegates nothing.
    const noFake = await validateContract(fresh({
      artifacts: { ...established().artifacts as object, fake: [] },
      fakeInjections: [],
    }), known);
    expect(noFake.ok).toBe(false);
    if (!noFake.ok) expect(noFake.errors.map(error => error.path)).toEqual(expect.arrayContaining(['artifacts.fake', 'fakeInjections']));

    // Access-only establishes access to behavior that already exists.
    const accessWithFake = await validateContract(fresh({ mode: 'access-only' }), known);
    expect(accessWithFake.ok).toBe(false);
    if (!accessWithFake.ok) {
      expect(accessWithFake.errors.map(error => error.path)).toEqual(expect.arrayContaining(['artifacts.fake', 'fakeInjections', 'artifacts.conformance']));
    }

    const accessOnly = await validateContract(fresh({
      mode: 'access-only',
      artifacts: { ...established().artifacts as object, fake: [], conformance: [] },
      fakeInjections: [],
    }), known);
    expect(accessOnly.ok).toBe(true);

    // The harness writes the commit's trailers.
    const trailer = await validateContract(fresh({ summary: 'Done.\nRamify-Gate: ga-0001' }), known);
    expect(trailer.ok).toBe(false);
    if (!trailer.ok) expect(trailer.errors.map(error => error.path)).toContain('summary');
  });
});

describe('the need an engineer reports', () => {
  const need = {
    capability: 'capability:note-limit',
    useCases: ['a reviewer attaches a note to a completed review run'],
    inputs: ['the note text'],
    outputs: ['whether the note is within the limit'],
    sideEffects: [],
    constraints: ['at most 500 characters'],
    existingEvidence: ['subs/b/src/tests/notes.test.ts'],
  };

  test('a schema violation returns every error with its path, and a corrected need is accepted', () => {
    const judged = validateEngineer({ kind: 'contract-needed', need: { capability: 'Note Limit' }, summary: 'x' });
    expect(judged.ok).toBe(false);
    if (!judged.ok) {
      expect(judged.errors.map(error => error.path)).toEqual(expect.arrayContaining([
        'need.capability', 'need.useCases', 'need.inputs', 'need.outputs', 'need.sideEffects', 'need.constraints', 'need.existingEvidence',
      ]));
    }
    expect(validateEngineer({ kind: 'contract-needed', need, summary: 'The limit is owned elsewhere.' }).ok).toBe(true);
  });

  test('a need names what the behavior answers or what it changes', () => {
    const judged = validateEngineer({
      kind: 'contract-needed',
      need: { ...need, outputs: [], sideEffects: [] },
      summary: 'The limit is owned elsewhere.',
    });
    expect(judged.ok).toBe(false);
    if (!judged.ok) expect(judged.errors[0]!.path).toBe('need.outputs');
  });
});

describe('the yield that waits for a provider', () => {
  const base = { index: null, registry: new Map() };

  test('a schema violation returns every error with its path', () => {
    const judged = validateLocalArchitect({ kind: 'yield-for-providers', requirements: [], summary: '' }, base);
    expect(judged.ok).toBe(false);
    if (!judged.ok) expect(judged.errors.map(error => error.path)).toEqual(expect.arrayContaining(['requirements', 'summary']));
  });

  test('it waits only for an open requirement of this work item', () => {
    const none = validateLocalArchitect({ kind: 'yield-for-providers', requirements: ['consumer-requirement:review-notes'], summary: 'Waiting.' }, base);
    expect(none.ok).toBe(false);
    if (!none.ok) expect(none.errors[0]!.message).toContain('no open requirement');

    const open = validateLocalArchitect(
      { kind: 'yield-for-providers', requirements: ['consumer-requirement:publish-notes'], summary: 'Waiting.' },
      { ...base, openRequirements: new Set(['consumer-requirement:review-notes']) },
    );
    expect(open.ok).toBe(false);
    if (!open.ok) expect(open.errors[0]!.expected).toBe('one of consumer-requirement:review-notes');

    expect(validateLocalArchitect(
      { kind: 'yield-for-providers', requirements: ['consumer-requirement:review-notes'], summary: 'Waiting.' },
      { ...base, openRequirements: new Set(['consumer-requirement:review-notes']) },
    ).ok).toBe(true);
  });
});

describe('the revision a consumer architect assigns directly', () => {
  const assignment = (extra: Record<string, unknown> = {}) => ({
    kind: 'assign' as const,
    outline: outline(),
    localDecisions: [],
    assignment: {
      stage: 0,
      kind: 'contract',
      goal: 'Revise the agreement so that it states the behavior this module needs.',
      approach: 'The agreed suite fixes an ordering the provider cannot give; state the set instead.',
      scope: { base: { module: reviews, included: [] }, extra: [], read: [], rationale: 'The consumer side of the agreement.' },
      citedElements: [],
      externalCapabilities: [],
      completionEvidence: 'The revised suite passes against the fake.',
      revisesContract: 'contract:review-notes',
      ...extra,
    },
  });

  test('it names an agreement this work item consumes, and only a contract iteration carries one', () => {
    const consuming = { index: null, registry: new Map(), contracts: new Set(['contract:review-notes']) };

    expect(validateLocalArchitect(assignment(), consuming).ok).toBe(true);

    // An architect that consumes no agreement has nothing to revise.
    const none = validateLocalArchitect(assignment(), { index: null, registry: new Map() });
    expect(none.ok).toBe(false);
    if (!none.ok) {
      expect(none.errors.map(error => error.path)).toContain('assignment.revisesContract');
      expect(none.errors[0]!.message).toContain('consumes no agreement');
    }

    // An agreement it does not consume is not its to revise.
    const other = validateLocalArchitect(assignment({ revisesContract: 'contract:other-notes' }), consuming);
    expect(other.ok).toBe(false);
    if (!other.ok) expect(other.errors[0]!.expected).toBe('one of contract:review-notes');

    // A contract iteration without an agreement revises nothing.
    const unnamed = validateLocalArchitect(assignment({ revisesContract: undefined }), consuming);
    expect(unnamed.ok).toBe(false);
    if (!unnamed.ok) expect(unnamed.errors[0]!.path).toBe('assignment.revisesContract');

    // And no other kind revises one.
    const ordinary = validateLocalArchitect(assignment({ kind: 'ordinary' }), consuming);
    expect(ordinary.ok).toBe(false);
    if (!ordinary.ok) expect(ordinary.errors.map(error => error.path)).toContain('assignment.kind');
  });

  test('a contract engineer has no unsuitable member at all, so it cannot report a provider\'s inability', () => {
    const kinds = contractSubmissionSchema.options.map(option => option.shape.kind.value);
    expect(kinds).not.toContain('unsuitable');
    expect(contractSubmissionSchema.safeParse({
      kind: 'unsuitable', reason: 'provider-cannot-conform', detail: 'the agreement cannot be met',
    }).success).toBe(false);
  });
});

describe('P2: the fake-naming rule', () => {
  const fake = [
    'export function createNoteLimitFake() {',
    '  return { withinLimit: (note) => note.length <= 500 };',
    '}',
  ].join('\n');

  test('a designated file whose exports carry Fake passes', () => {
    expect(isFakeFile('a/note-limit.fake.ts')).toBe(true);
    expect(isFakeFile('a/note-limit.ts')).toBe(false);
    expect(fakeNamingViolations([{ path: 'a/note-limit.fake.ts', text: fake }], ['a/note-limit.fake.ts'])).toEqual([]);
  });

  test('it rejects a file without .fake, an export without Fake, and a re-export that drops the designation', () => {
    const suffix = fakeNamingViolations([{ path: 'a/note-limit.ts', text: fake }], ['a/note-limit.ts']);
    expect(suffix.map(violation => violation.rule)).toEqual(['file-suffix']);

    const named = fakeNamingViolations(
      [{ path: 'a/note-limit.fake.ts', text: 'export function createNoteLimit() {\n  return {};\n}\n' }],
      ['a/note-limit.fake.ts'],
    );
    expect(named.map(violation => violation.rule)).toEqual(['export-name']);
    expect(named[0]!.detail).toContain('createNoteLimit');

    const anonymous = fakeNamingViolations(
      [{ path: 'a/note-limit.fake.ts', text: 'export default { withinLimit: () => true };\n' }],
      ['a/note-limit.fake.ts'],
    );
    expect(anonymous.map(violation => violation.rule)).toEqual(['export-name']);

    const reExport = fakeNamingViolations([
      { path: 'a/note-limit.fake.ts', text: fake },
      { path: 'b/notes.ts', text: "export { createNoteLimitFake as createNoteLimit } from '../a/note-limit.fake.js';\n" },
    ], ['a/note-limit.fake.ts']);
    expect(reExport.map(violation => violation.rule)).toEqual(['re-export']);
    expect(reExport[0]!.path).toBe('b/notes.ts');

    // A re-export that keeps the designation is not a violation, and neither
    // is a contract file whose behavior-oriented name carries no Fake.
    expect(fakeNamingViolations([
      { path: 'a/note-limit.fake.ts', text: fake },
      { path: 'b/notes.ts', text: "export { createNoteLimitFake } from '../a/note-limit.fake.js';\n" },
      { path: 'a/interfaces/note-limit.ts', text: 'export interface NoteLimit { withinLimit(note: string): boolean }\n' },
    ], ['a/note-limit.fake.ts'])).toEqual([]);
  });
});

describe('registration is keyed by the obligation and the requirement revision', () => {
  const key = { contract: 'contract:review-notes', revision: 1, obligation: 'provider-obligation:review-notes', requirements: ['consumer-requirement:review-notes'] };

  test('a registration already in the log is not appended again', () => {
    expect(registrationNeeded([], key)).toBe(true);
    expect(registrationNeeded([key], key)).toBe(false);
    // Another consumer of the same obligation revision still registers: it
    // adds its own requirement and reuses the provider work.
    expect(registrationNeeded([key], { ...key, requirements: ['consumer-requirement:publish-notes'] })).toBe(true);
    // A later revision of the same obligation is its own registration.
    expect(registrationNeeded([key], { ...key, revision: 2, requirements: ['consumer-requirement:render-notes'] })).toBe(true);
    // An access-only agreement has no obligation; the contract revision is its key.
    const access = { contract: 'contract:publish-notes', revision: 1, obligation: null, requirements: [] };
    expect(registrationNeeded([key], access)).toBe(true);
    expect(registrationNeeded([key, access], access)).toBe(false);
  });

  test('a reopening carries the same key, so a repeat of it appends nothing', () => {
    const attached = { ...key, requirements: ['consumer-requirement:review-notes', 'consumer-requirement:publish-notes'] };
    // A revision reopens every attached requirement at the new revision.
    const reopened = { contract: 'contract:review-notes', revision: 2, obligation: 'provider-obligation:review-notes', requirements: ['consumer-requirement:review-notes', 'consumer-requirement:publish-notes'] };
    expect(registrationNeeded([attached], reopened)).toBe(true);
    // The same transaction derived again, as a repeat after a crash derives
    // it, is already in the log.
    expect(registrationNeeded([attached, reopened], reopened)).toBe(false);
    // A consumer attaching at the revision it was registered under is a
    // registration of its own.
    expect(registrationNeeded([attached, reopened], { ...reopened, requirements: ['consumer-requirement:review-notes', 'consumer-requirement:publish-notes', 'consumer-requirement:render-notes'] })).toBe(true);
  });
});

test('an integration work item derives a stable descriptive ID from its accepted scenario', () => {
  const scenario = { id: 'scenario:preview-binds-review-predecessors', name: 'Preview binds review predecessors', owner: reviews } as Parameters<typeof integrationWorkItem>[0];
  const first = integrationWorkItem(scenario);
  expect(first).toMatchObject({ schema: 'ramify-agent.work-item/2', id: 'work-item:bind-preview-binds-review-predecessors',
    functionalRequirementIds: [], functionalAcceptanceIds: [], contextIds: [] });
  expect(integrationWorkItem(scenario).id).toBe(first.id);
});

test('descriptive agreement and obligation survive record serialization with their relationship', async () => {
  const proposal = { ...established(), contractKey: 'draft:contract:review-predecessor-resolution',
    providerObligationKey: 'draft:provider-obligation:provide-review-predecessor-resolution',
    consumerRequirementKey: 'draft:consumer-requirement:preview-resolves-review-predecessors' };
  const accepted = await validateContract(proposal, await evidence());
  if (!accepted.ok || accepted.value.kind !== 'established') throw new Error('the agreement was rejected');
  const hashes = new Map<string, string>();
  for (const entry of [...proposal.artifacts.interface, ...proposal.artifacts.conformance,
    ...proposal.artifacts.fake, ...proposal.artifacts.exposure]) hashes.set(entry.path, 'a'.repeat(64));
  const registration = registerContract({
    contract: 'contract:review-predecessor-resolution',
    obligation: 'provider-obligation:provide-review-predecessor-resolution', revision: 1,
    capability: { ref: { id: 'capability:add-revision-preview', revision: 1, hash: 'b'.repeat(64) },
      slug: 'capability:add-revision-preview', decision: null },
    submission: accepted.value, hashes, establishedBy: { iteration: 'it-001', gate: 'ga-001' },
    consumers: [{ requirement: 'consumer-requirement:preview-resolves-review-predecessors',
      workItem: 'work-item:add-revision-preview', module: reviews,
      forCapability: 'capability:add-revision-preview',
      tests: { policy: 'owned-by-scope', exactOwners: [reviews], subtrees: [], extraSuites: [] },
      fakeInjections: proposal.fakeInjections }],
    provider: { kind: 'create', id: 'work-item:provide-review-predecessor-resolution',
      goal: 'Provide review predecessor resolution.', startedFor: 'work-item:add-revision-preview' },
  });
  expect(registration.records.map(record => record.path)).toEqual([
    'contracts/contract%3Areview-predecessor-resolution/1.json',
    'obligations/provider-obligation%3Aprovide-review-predecessor-resolution/1.json',
    'requirements/consumer-requirement%3Apreview-resolves-review-predecessors/1.json',
    'work-items/work-item%3Aprovide-review-predecessor-resolution/item.json',
  ]);
  expect(contractRecordSchema.parse(JSON.parse(JSON.stringify(registration.contract))).schema).toBe('ramify-agent.contract/3');
  expect(providerObligationSchema.parse(JSON.parse(JSON.stringify(registration.obligation))).contract.id)
    .toBe('contract:review-predecessor-resolution');
  expect(consumerRequirementSchema.parse(JSON.parse(JSON.stringify(registration.requirements[0]))).obligation)
    .toBe('provider-obligation:provide-review-predecessor-resolution');
  expect(registration.providerWorkItem).toMatchObject({ schema: 'ramify-agent.work-item/2',
    id: 'work-item:provide-review-predecessor-resolution', startedFor: 'work-item:add-revision-preview' });
});

test('serialized contract publication rejects collisions and changed retries without a partial batch', () => {
  const contract = { path: 'contracts/contract%3Areview-predecessors/1.json', id: 'contract:review-predecessors', revision: 1,
    body: { schema: 'ramify-agent.contract/3', id: 'contract:review-predecessors' } };
  const obligation = { path: 'obligations/provider-obligation%3Aprovide-review-predecessors/1.json',
    id: 'provider-obligation:provide-review-predecessors', revision: 1,
    body: { schema: 'ramify-agent.provider-obligation/2', id: 'provider-obligation:provide-review-predecessors',
      contract: { id: contract.id } } };
  const requirement = { path: 'requirements/consumer-requirement%3Apreview-resolves-predecessors/1.json',
    id: 'consumer-requirement:preview-resolves-predecessors', revision: 1,
    body: { schema: 'ramify-agent.consumer-requirement/2', id: 'consumer-requirement:preview-resolves-predecessors',
      workItem: 'work-item:preview', obligation: obligation.id } };
  const first = { type: 'contract-registered', data: { iteration: 'it-001', contract: contract.id } };
  const records = [contract, obligation, requirement];
  const accepted = [{ transaction: { event: first, records } }];
  expect(contractPublicationRefusal([], first, records)).toBeNull();
  expect(contractPublicationRefusal(accepted, first, records)).toBeNull();
  const changed = contractPublicationRefusal(accepted, first,
    [{ ...contract, body: { ...contract.body, behavior: 'A changed answer' } }, obligation, requirement]);
  expect(changed?.path).toBe('iteration');
  const colliding = contractPublicationRefusal(accepted,
    { type: 'contract-registered', data: { iteration: 'it-002', contract: contract.id } }, records);
  expect(colliding?.path).toBe('contractKey');
  expect(colliding?.message).toContain('contract:review-predecessors');
  expect(contractPublicationRefusal([], { type: 'contract-registered', data: { iteration: 'it-002' } }, records)).toBeNull();

  const revised = { type: 'evidence-reopened', data: { iteration: 'it-003', contract: contract.id, revision: 2 } };
  const next = records.map(record => ({ ...record, path: record.path.replace('/1.json', '/2.json'), revision: 2 }));
  expect(contractPublicationRefusal(accepted, revised, next)).toBeNull();
  const redirected = next.map(record => record.id === requirement.id
    ? { ...record, body: { ...record.body, workItem: 'work-item:other' } } : record);
  expect(contractPublicationRefusal(accepted, revised, redirected)?.path).toBe('consumerRequirementKey');
});

test('authorized execution retirement publishes replacements atomically and never reuses the old name', () => {
  const old = 'consumer-requirement:preview-resolves-predecessors';
  const replacements = ['consumer-requirement:preview-resolves-review-parent', 'consumer-requirement:preview-resolves-review-sibling'];
  const published = replacements.map(id => ({ path: `requirements/${encodeURIComponent(id)}/2.json`, id, revision: 2,
    body: { schema: 'ramify-agent.consumer-requirement/2', id } }));
  const request = { retirements: [{ id: old, kind: 'consumer-requirement' as const, replacements }],
    authority: { iteration: 'it-009', reason: 'The review predecessor behavior split into two separately verified obligations.' },
    accepted: new Set([old]), retired: new Set<string>(), published };
  const retirement = executionRetirements(request);
  expect(retirement).toHaveLength(1);
  expect(executionRetirementSchema.parse(JSON.parse(JSON.stringify(retirement[0]!.body)))).toMatchObject({
    id: old, replacements, authority: request.authority,
  });
  expect(() => executionRetirements({ ...request, published: published.slice(0, 1) })).toThrow('must be published');
  const lines = [{ transaction: { event: { type: 'execution-identities-retired', data: { iteration: 'it-009' } },
    records: [...published, ...retirement] } }];
  const prior = [{ transaction: { event: { type: 'contract-registered', data: { iteration: 'it-001' } },
    records: [{ path: `requirements/${encodeURIComponent(old)}/1.json`, id: old, revision: 1,
      body: { schema: 'ramify-agent.consumer-requirement/2', id: old } }] } }];
  expect(contractPublicationRefusal(prior, lines[0]!.transaction.event, lines[0]!.transaction.records)).toBeNull();
  expect(contractPublicationRefusal(prior, lines[0]!.transaction.event, retirement)?.path)
    .toBe('retirements.0.replacements');
  expect(contractPublicationRefusal(lines, { type: 'contract-registered', data: { iteration: 'it-010' } },
    [{ path: `requirements/${encodeURIComponent(old)}/2.json`, id: old, revision: 2,
      body: { schema: 'ramify-agent.consumer-requirement/2', id: old } }])?.message).toContain('retired');
  expect(contractPublicationRefusal(JSON.parse(JSON.stringify(lines)), lines[0]!.transaction.event,
    JSON.parse(JSON.stringify(lines[0]!.transaction.records)))).toBeNull();
  expect(() => executionRetirements({ ...request, retired: new Set([old]) })).toThrow('not an active accepted identity');
});

test('a merge or change of kind records every retired source against one published replacement', () => {
  const old = ['consumer-requirement:preview-reads-parent', 'consumer-requirement:preview-reads-sibling'];
  const replacement = 'provider-obligation:provide-review-predecessors';
  const published = [{ path: `obligations/${encodeURIComponent(replacement)}/1.json`, id: replacement, revision: 1,
    body: { schema: 'ramify-agent.provider-obligation/2', id: replacement } }];
  const result = executionRetirements({
    retirements: old.map(id => ({ id, kind: 'consumer-requirement' as const, replacements: [replacement] })),
    authority: { iteration: 'it-010', reason: 'The authorized correction consolidates the obligation.' },
    accepted: new Set(old), retired: new Set(), published,
  });
  expect(result.map(record => record.path)).toEqual(old.map(id => `retirements/${encodeURIComponent(id)}.json`));
  expect(result.map(record => (record.body as { replacements: string[] }).replacements)).toEqual([[replacement], [replacement]]);
  expect(() => executionRetirements({ retirements: [{ id: old[0]!, kind: 'consumer-requirement', replacements: [replacement] },
    { id: old[0]!, kind: 'consumer-requirement', replacements: [replacement] }],
    authority: { iteration: 'it-010', reason: 'Duplicate' }, accepted: new Set(old), retired: new Set(), published }))
    .toThrow('retired twice');
});

test('a replacement agreement rebinds a stable consumer requirement in one revision transaction', () => {
  const oldContract = 'contract:review-predecessor-resolution';
  const oldObligation = 'provider-obligation:provide-review-predecessor-resolution';
  const requirement = 'consumer-requirement:preview-resolves-review-predecessors';
  const newContract = 'contract:review-predecessor-routing';
  const newObligation = 'provider-obligation:provide-review-predecessor-routing';
  const priorRecords = [
    { path: 'old-contract', id: oldContract, revision: 1, body: { schema: 'ramify-agent.contract/3', id: oldContract } },
    { path: 'old-obligation', id: oldObligation, revision: 1,
      body: { schema: 'ramify-agent.provider-obligation/2', id: oldObligation, contract: { id: oldContract } } },
    { path: 'old-requirement', id: requirement, revision: 1,
      body: { schema: 'ramify-agent.consumer-requirement/2', id: requirement,
        workItem: 'work-item:preview', obligation: oldObligation } },
  ];
  const published = [
    { path: 'new-contract', id: newContract, revision: 2, body: { schema: 'ramify-agent.contract/3', id: newContract } },
    { path: 'new-obligation', id: newObligation, revision: 2,
      body: { schema: 'ramify-agent.provider-obligation/2', id: newObligation, contract: { id: newContract } } },
    { path: 'new-requirement', id: requirement, revision: 2,
      body: { schema: 'ramify-agent.consumer-requirement/2', id: requirement,
        workItem: 'work-item:preview', obligation: newObligation } },
  ];
  const retirement = executionRetirements({
    retirements: [
      { id: oldContract, kind: 'contract', replacements: [newContract] },
      { id: oldObligation, kind: 'provider-obligation', replacements: [newObligation] },
    ],
    authority: { iteration: 'it-002', reason: 'The revision replaces the agreement and provider obligation.' },
    accepted: new Set([oldContract, oldObligation, requirement]), retired: new Set(), published,
  });
  const prior = [{ transaction: { event: { type: 'contract-registered', data: { iteration: 'it-001' } }, records: priorRecords } }];
  const event = { type: 'evidence-reopened', data: { iteration: 'it-002', contract: newContract } };
  expect(contractPublicationRefusal(prior, event, [...published, ...retirement])).toBeNull();
  expect(contractPublicationRefusal(prior, event, published)?.path).toBe('consumerRequirementKey');
});

describe('the dependency graph has capabilities for nodes', () => {
  const edge = (from: string, to: string, requirement: string, workItem: string) => ({ from, to, requirement, workItem });

  test('a capability that transitively depends on itself is a cycle, and a chain through one module is not', () => {
    // Change 1 in module A needs change 2 in module B, which needs change 3
    // in module A: three capabilities, no cycle.
    const chain = [edge('one', 'two', 'consumer-requirement:review-notes', 'work-item:review-notes')];
    expect(cycleClosedBy(chain, edge('two', 'three', 'consumer-requirement:publish-notes', 'work-item:publish-notes'))).toBeNull();

    const closed = cycleClosedBy(
      [edge('one', 'two', 'consumer-requirement:review-notes', 'work-item:review-notes'), edge('two', 'three', 'consumer-requirement:publish-notes', 'work-item:publish-notes')],
      edge('three', 'one', 'consumer-requirement:render-notes', 'work-item:render-notes'),
    );
    expect(closed).not.toBeNull();
    expect(closed!.members).toEqual(['one', 'two', 'three']);
    expect(closed!.requirements).toEqual(['consumer-requirement:review-notes', 'consumer-requirement:publish-notes', 'consumer-requirement:render-notes']);

    // The same cycle written from another edge reads the same way, which is
    // what makes "the same cycle again" a comparison and not a guess.
    const other = cycleClosedBy(
      [edge('two', 'three', 'consumer-requirement:publish-notes', 'work-item:publish-notes'), edge('three', 'one', 'consumer-requirement:render-notes', 'work-item:render-notes')],
      edge('one', 'two', 'consumer-requirement:review-notes', 'work-item:review-notes'),
    );
    expect(cycleIdentity(other!)).toBe(cycleIdentity(closed!));

    // A capability that depends on itself is the shortest cycle there is.
    expect(cycleClosedBy([], edge('one', 'one', 'consumer-requirement:self-notes', 'work-item:verify-notes'))!.members).toEqual(['one']);
  });
});

describe('scheduling is depth-first', () => {
  const item = (id: string, startedFor: string | null): WorkItem => ({
    schema: 'ramify-agent.work-item/2',
    id,
    module: `m/${id}`,
    origin: { entry: 'capability:review-notes' },
    goal: 'do the work',
    functionalRequirementIds: [], functionalAcceptanceIds: [], contextIds: [],
    startedFor,
  });

  test('the deepest open item runs first, and a resumable consumer comes before an independent entry item', () => {
    const items = [item('work-item:review-notes', null), item('work-item:publish-notes', null), item('work-item:render-notes', 'work-item:review-notes'), item('work-item:verify-notes', 'work-item:render-notes')];
    expect([...depthOf(items).values()]).toEqual([0, 0, 1, 2]);

    const requirement = {
      schema: 'ramify-agent.consumer-requirement/2' as const,
      id: 'consumer-requirement:review-notes', revision: 1, workItem: 'work-item:review-notes', consumer: 'm/work-item:review-notes',
      forCapability: 'capability:review-notes', obligation: 'provider-obligation:review-notes', contractRevision: 1,
      behavior: 'the agreed behavior',
      evidence: { tests: { policy: 'owned-by-scope' as const, exactOwners: [], subtrees: [], extraSuites: [] }, fakeInjections: [] },
    };
    const base = {
      items,
      completed: new Set<string>(),
      requirements: new Map([['consumer-requirement:review-notes', requirement]]),
      bindings: new Map<string, string>(),
      reopened: new Set<string>(),
    };

    // work-item:review-notes has yielded; the deepest provider runs, not the next entry item.
    const waiting = { ...base, yielded: new Map([['work-item:review-notes', ['consumer-requirement:review-notes']]]), conformed: new Set<string>() };
    expect(nextWorkItem(waiting)!.item.id).toBe('work-item:verify-notes');

    // Once the provider has conformed, the consumer comes back before work-item:publish-notes.
    const released = { ...base, yielded: new Map([['work-item:review-notes', ['consumer-requirement:review-notes']]]), conformed: new Set(['provider-obligation:review-notes@1']) };
    const next = nextWorkItem(released)!;
    expect(next.item.id).toBe('work-item:review-notes');
    expect(next.resumes).toEqual(['consumer-requirement:review-notes']);

    // With nothing yielded, the committed order is the order.
    expect(nextWorkItem({ ...base, yielded: new Map(), conformed: new Set<string>() })!.item.id).toBe('work-item:verify-notes');
    expect(nextWorkItem({
      ...base,
      items: [item('work-item:review-notes', null), item('work-item:publish-notes', null)],
      yielded: new Map(),
      conformed: new Set<string>(),
    })!.item.id).toBe('work-item:review-notes');
  });
});
