import { posix, sep } from 'node:path';
import { z } from 'zod';
import { findModule, type ArchitectIndex } from '../../../../../evidence/src/views.js';
import type { JsonSchema } from '../../../../../agent/src/interfaces/port.js';
import { modulePathSchema } from '../../../../../../src/interfaces/protocol/evidence.js';
import { validateAgainst, type SubmissionError, type SubmissionValidation } from '../../../../../task-execution/src/submissions.js';
import { injectionSiteRule, moduleOwning } from '../../../../../../src/work/scope.js';
import { isFakeFile } from './naming.js';
import { ancestorsOf, ownerOf } from './parity.js';
import { contractAuthoritySchema, contractModeSchema, standsForSchema } from './records.js';

/*
 * What a module engineer writes when the behavior it needs is outside its scope,
 * and what the contract sub-session submits when its work is done.
 *
 * The need is written as behavior and not as an interface: use cases,
 * inputs, outputs, side effects, constraints and the executable evidence
 * that already exists. Naming the design would decide for the other side,
 * which is what a contract iteration exists to prevent.
 *
 * `established` registers; `incomplete` registers nothing. Neither carries
 * an identifier the harness assigned, a gate, a test selection or a
 * revision number: the harness owns all of them, and a contract engineer
 * cannot choose the revision it establishes.
 */

const text = z.string().min(1);

/** A need stated as behavior, which the contract iteration designs an interface for. */
export const needAsBehaviorSchema = z.object({
  /** The capability the need is for, as the registry names it or would name it. */
  capability: z.string().regex(/^capability:[a-z0-9]+(?:-[a-z0-9]+)*$/),
  useCases: z.array(text).min(1),
  inputs: z.array(text),
  outputs: z.array(text),
  sideEffects: z.array(text),
  constraints: z.array(text),
  /** Executable evidence that already exists: the tests that state the need. */
  existingEvidence: z.array(text),
}).strict();
export type NeedAsBehavior = z.infer<typeof needAsBehaviorSchema>;

/** One artifact the session wrote, as it names it. The harness hashes it itself. */
const artifactBody = z.object({ path: text, exports: z.array(text) }).strict();

/** A fake file, and the real provider export each of its exported names stands for. */
const fakeBody = artifactBody.extend({ standsFor: z.array(standsForSchema) }).strict();

const contractSubmissionBaseSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('established'),
    mode: contractModeSchema,
    authority: contractAuthoritySchema,
    provider: modulePathSchema,
    behavior: text,
    artifacts: z.object({
      interface: z.array(artifactBody),
      conformance: z.array(z.object({ path: text }).strict()),
      fake: z.array(fakeBody),
      exposure: z.array(z.object({ path: text, declaration: text }).strict()),
    }).strict(),
    /** Where the consumer holds the fake, which verification replaces with the real provider. */
    fakeInjections: z.array(text),
    summary: text,
  }).strict(),
  z.object({
    kind: z.literal('incomplete'),
    done: z.array(text),
    unfinished: z.array(text).min(1),
    findings: z.array(text),
  }).strict(),
]);
const name = '[a-z0-9]+(?:-[a-z0-9]+)*';
const draftKey = (family: string) => z.string().regex(new RegExp(`^draft:${family}:${name}$`))
  .describe(`A proposed draft:${family}:<descriptive-name> key; an accepted ID or another namespace is invalid.`);

const acceptedId = (family: string) => z.string().regex(new RegExp(`^${family}:${name}$`))
  .describe(`An accepted ${family}:<descriptive-name> ID from this run; a draft key or another namespace is invalid.`);
const establishedBody = contractSubmissionBaseSchema.options[0];
const incompleteBody = contractSubmissionBaseSchema.options[1];
const fakeBacked = establishedBody.extend({ mode: z.literal('fake-backed') });
const accessOnly = establishedBody.extend({ mode: z.literal('access-only') });

/** Access-only agreements publish only the contract; fake-backed ones publish three identities. */
export const contractSubmissionSchema = z.union([
  fakeBacked.extend({ contractKey: draftKey('contract'), providerObligationKey: draftKey('provider-obligation'),
    consumerRequirementKey: draftKey('consumer-requirement') }).strict(),
  accessOnly.extend({ contractKey: draftKey('contract') }).strict(),
  incompleteBody,
]);

/** An agreement already in force is cited by accepted ID when another consumer attaches. */
export const attachedContractSubmissionSchema = z.union([
  fakeBacked.extend({ contractId: acceptedId('contract'), providerObligationId: acceptedId('provider-obligation'),
    consumerRequirementKey: draftKey('consumer-requirement') }).strict(),
  accessOnly.extend({ contractId: acceptedId('contract') }).strict(),
  incompleteBody,
]);

/** A revising consumer retains its accepted requirement; a new consumer proposes one. */
const revisedAgreement = fakeBacked.extend({ contractId: acceptedId('contract'),
  providerObligationId: acceptedId('provider-obligation') });
const revisedAccess = accessOnly.extend({ contractId: acceptedId('contract') }).strict();
const splitRequirement = revisedAgreement.extend({
  consumerRequirementKeys: z.array(draftKey('consumer-requirement')).min(2)
    .describe('New requirement keys replacing the accepted requirement in this authorized revision.'),
  retirements: z.array(z.object({ id: acceptedId('consumer-requirement'), kind: z.literal('consumer-requirement'),
    replacementKeys: z.array(draftKey('consumer-requirement')).min(2), reason: text }).strict()).length(1),
}).strict().superRefine((value, ctx) => {
  const keys = value.consumerRequirementKeys;
  if (new Set(keys).size !== keys.length) ctx.addIssue({ code: 'custom', path: ['consumerRequirementKeys'], message: 'each replacement key is unique' });
  const replacements = value.retirements[0]?.replacementKeys ?? [];
  if (keys.length !== replacements.length || !keys.every(key => replacements.includes(key)))
    ctx.addIssue({ code: 'custom', path: ['retirements', 0, 'replacementKeys'], message: 'replacement keys must match consumerRequirementKeys exactly' });
});
const mergeRequirements = revisedAgreement.extend({
  consumerRequirementKey: draftKey('consumer-requirement'),
  scope: z.object({ consumerWorkItem: text }).strict(),
  retirements: z.array(z.object({ id: acceptedId('consumer-requirement'), kind: z.literal('consumer-requirement'),
    replacementKeys: z.tuple([draftKey('consumer-requirement')]), reason: text }).strict()).min(2),
}).strict().superRefine((value, ctx) => {
  if (new Set(value.retirements.map(entry => entry.id)).size !== value.retirements.length)
    ctx.addIssue({ code: 'custom', path: ['retirements'], message: 'each accepted requirement is retired once' });
  value.retirements.forEach((entry, index) => {
    if (entry.replacementKeys[0] !== value.consumerRequirementKey)
      ctx.addIssue({ code: 'custom', path: ['retirements', index, 'replacementKeys'], message: 'each old requirement must name the merged replacement key' });
  });
});
const replaceAgreement = fakeBacked.extend({
  contractKey: draftKey('contract'),
  providerObligationKey: draftKey('provider-obligation'),
  consumerRequirementId: acceptedId('consumer-requirement'),
  retirements: z.tuple([
    z.object({ id: acceptedId('contract'), kind: z.literal('contract'),
      replacementKeys: z.tuple([draftKey('contract')]), reason: text }).strict(),
    z.object({ id: acceptedId('provider-obligation'), kind: z.literal('provider-obligation'),
      replacementKeys: z.tuple([draftKey('provider-obligation')]), reason: text }).strict(),
  ]),
}).strict().superRefine((value, ctx) => {
  if (value.retirements[0].replacementKeys[0] !== value.contractKey)
    ctx.addIssue({ code: 'custom', path: ['retirements', 0, 'replacementKeys'], message: 'the contract replacement key must match contractKey' });
  if (value.retirements[1].replacementKeys[0] !== value.providerObligationKey)
    ctx.addIssue({ code: 'custom', path: ['retirements', 1, 'replacementKeys'], message: 'the provider obligation replacement key must match providerObligationKey' });
});
const changeToAccess = accessOnly.extend({
  contractKey: draftKey('contract'),
  scope: z.object({ consumerWorkItems: z.array(text).min(1) }).strict(),
  retirements: z.array(z.object({
    id: z.union([acceptedId('contract'), acceptedId('provider-obligation'), acceptedId('consumer-requirement')]),
    kind: z.enum(['contract', 'provider-obligation', 'consumer-requirement']),
    replacementKeys: z.tuple([draftKey('contract')]), reason: text,
  }).strict()).min(3),
}).strict().superRefine((value, ctx) => {
  if (new Set(value.retirements.map(entry => entry.id)).size !== value.retirements.length)
    ctx.addIssue({ code: 'custom', path: ['retirements'], message: 'each accepted identity is retired once' });
  value.retirements.forEach((entry, index) => {
    if (!entry.id.startsWith(`${entry.kind}:`)) ctx.addIssue({ code: 'custom', path: ['retirements', index, 'kind'], message: 'kind must match the accepted ID' });
    if (entry.replacementKeys[0] !== value.contractKey)
      ctx.addIssue({ code: 'custom', path: ['retirements', index, 'replacementKeys'], message: 'each old identity must name the access-only contract replacement key' });
  });
});
export const revisedContractSubmissionSchema = (existingRequirement: boolean, mode: 'fake-backed' | 'access-only' = 'fake-backed') =>
  mode === 'access-only' ? z.union([revisedAccess, incompleteBody])
    : existingRequirement
      ? z.union([revisedAgreement.extend({ consumerRequirementId: acceptedId('consumer-requirement') }).strict(), splitRequirement,
        mergeRequirements, replaceAgreement, changeToAccess, incompleteBody])
      : z.union([revisedAgreement.extend({ consumerRequirementKey: draftKey('consumer-requirement') }).strict(), incompleteBody]);

export type ContractIdentityContext =
  | { readonly kind: 'fresh' }
  | { readonly kind: 'attach'; readonly contractId: string; readonly providerObligationId: string | null; readonly provider?: string }
  | { readonly kind: 'revise'; readonly contractId: string; readonly providerObligationId: string | null;
    readonly consumerRequirementId: string | null; readonly consumerRequirements?: readonly { readonly id: string; readonly workItem: string }[];
    readonly consumerWorkItem?: string; readonly mode?: 'fake-backed' | 'access-only'; readonly provider?: string;
    readonly conversionBlockers?: readonly string[] };

export type ContractSubmission = z.infer<typeof contractSubmissionSchema>
  | z.infer<typeof attachedContractSubmissionSchema>
  | z.infer<ReturnType<typeof revisedContractSubmissionSchema>>;
export type EstablishedContract = Extract<ContractSubmission, { kind: 'established' }>;

/** The members this iteration's package offers the role. */
export const contractSubmissionKinds = ['established', 'incomplete'] as const;

/** The schema the agent's tool is given, taken from the same definition that validates. */
export const contractJsonSchema = z.toJSONSchema(contractSubmissionSchema) as JsonSchema;
export function contractAuthorSchema(context: ContractIdentityContext = { kind: 'fresh' }) {
  if (context.kind === 'attach') return attachedContractSubmissionSchema;
  if (context.kind === 'revise') return revisedContractSubmissionSchema(context.consumerRequirementId !== null,
    context.mode ?? (context.providerObligationId === null ? 'access-only' : 'fake-backed'));
  return contractSubmissionSchema;
}
export const contractAuthorJsonSchema = (context: ContractIdentityContext = { kind: 'fresh' }): JsonSchema =>
  z.toJSONSchema(contractAuthorSchema(context)) as JsonSchema;

/** Resolve draft proposals against every accepted and retired name. Retained identities use accepted-ID fields. */
export function contractIdentityErrors(
  submission: EstablishedContract,
  occupied: ReadonlyMap<string, string>,
): SubmissionError[] {
  if (!('contractKey' in submission) && !('consumerRequirementKey' in submission) && !('consumerRequirementKeys' in submission)) return [];
  const proposals = 'contractKey' in submission ? [
    ['contractKey', submission.contractKey],
    ...('providerObligationKey' in submission
      ? [['providerObligationKey', submission.providerObligationKey]] as const : []),
    ...('consumerRequirementKey' in submission ? [['consumerRequirementKey', submission.consumerRequirementKey]] as const : []),
  ] as const : 'consumerRequirementKeys' in submission
      ? submission.consumerRequirementKeys.map((key, index) => [`consumerRequirementKeys.${index}`, key] as const)
      : [['consumerRequirementKey', submission.consumerRequirementKey]] as const;
  return proposals.flatMap(([path, key]) => {
    const id = key.slice('draft:'.length);
    const conflict = occupied.get(id);
    return conflict === undefined ? [] : [{
      path,
      message: `"${key}" resolves to ${id}, which this run already ${conflict}; propose a meaningful qualifier in this field`,
      expected: `an unused draft:${id.split(':', 1)[0]}:<descriptive-name> key; existing names are in accepted run records`,
    }];
  });
}

export const contractToolName = 'submit_contract_result';

/** What the rules beyond the schema are checked against. */
export interface ContractEvidence {
  /** The refreshed architect view, or null where the run has none. */
  readonly index: ArchitectIndex | null;
  /** The consumer this iteration integrates the fake in. */
  readonly consumer: string;
  /** Whether one project-relative path is a file of the tree as it stands. */
  readonly exists: (path: string) => Promise<boolean>;
}

/** A line that would be read as one of the trailers the harness writes itself. */
const trailerLine = /^\s*Ramify-[A-Za-z-]*\s*:/m;

/**
 * Validates one contract submission: the strict schema, then the rules the
 * schema cannot hold. Nothing changes on a failure and every error names its
 * path.
 */
export async function validateContract(input: unknown, evidence: ContractEvidence,
  identity: ContractIdentityContext = { kind: 'fresh' }): Promise<SubmissionValidation<ContractSubmission>> {
  if (typeof input === 'object' && input !== null && 'kind' in input
    && input.kind !== 'established' && input.kind !== 'incomplete') {
    return { ok: false, errors: [{ path: 'kind', message: 'Expected established or incomplete' }] };
  }
  const shape = validateAgainst<ContractSubmission>(contractAuthorSchema(identity) as unknown as z.ZodType<ContractSubmission>, input);
  if (!shape.ok) return shape;
  if (shape.value.kind === 'incomplete') return shape;
  const errors = [...identityErrors(shape.value, identity), ...await establishedErrors(shape.value, evidence)];
  return errors.length === 0 ? shape : { ok: false, errors };
}

function identityErrors(value: EstablishedContract, identity: ContractIdentityContext): SubmissionError[] {
  if (identity.kind === 'fresh' || !('contractId' in value) && !('contractKey' in value)) return [];
  const errors: SubmissionError[] = [];
  const replacement = 'contractKey' in value && 'retirements' in value && !('consumerRequirementKeys' in value);
  const merge = 'consumerRequirementKey' in value && 'retirements' in value && 'scope' in value;
  if (identity.provider !== undefined && value.provider !== identity.provider)
    errors.push({ path: 'provider', message: `${value.provider} differs from the provider of ${identity.contractId}`,
      expected: identity.provider });
  const expected = [
    ...(replacement ? [] : [
    ['contractId', identity.contractId],
    ...(value.mode === 'access-only' ? [] : [['providerObligationId', identity.providerObligationId]] as const),
    ] as const),
    ...(value.mode !== 'access-only' && identity.kind === 'revise' && identity.consumerRequirementId !== null
      && !('consumerRequirementKeys' in value) && !merge
      ? [['consumerRequirementId', identity.consumerRequirementId]] as const : []),
  ] as const;
  for (const [path, id] of expected) {
    if (value[path as keyof typeof value] === id) continue;
    errors.push({ path, message: `This agreement retains ${id ?? 'no provider obligation'}; ${String(value[path as keyof typeof value])} does not identify it`,
      expected: id === null ? 'null for this access-only agreement' : `the accepted ID ${id} from the agreement in force` });
  }
  if (replacement && identity.kind === 'revise') {
    const retirements = value.retirements as readonly { id: string }[];
    if (retirements[0]?.id !== identity.contractId)
      errors.push({ path: 'retirements.0.id', message: 'the replacement must retire the agreement being revised', expected: identity.contractId });
    if (retirements[1]?.id !== identity.providerObligationId)
      errors.push({ path: 'retirements.1.id', message: 'the replacement must retire the provider obligation being revised',
        expected: identity.providerObligationId ?? 'an existing provider obligation' });
  }
  if (identity.kind === 'revise' && 'scope' in value && 'consumerRequirementKey' in value && 'retirements' in value && value.mode === 'fake-backed') {
    if (value.scope.consumerWorkItem !== identity.consumerWorkItem)
      errors.push({ path: 'scope.consumerWorkItem', message: 'The merge must stay with the revising consumer work item',
        expected: identity.consumerWorkItem ?? 'the current consumer work item' });
    const owned = new Set((identity.consumerRequirements ?? []).filter(entry => entry.workItem === identity.consumerWorkItem).map(entry => entry.id));
    value.retirements.forEach((entry, index) => {
      if (!owned.has(entry.id)) errors.push({ path: `retirements.${index}.id`,
        message: `${entry.id} is not an active requirement of this revising consumer work item`,
        expected: `one of ${[...owned].join(', ')}` });
    });
  }
  if (identity.kind === 'revise' && 'scope' in value && 'contractKey' in value && 'retirements' in value && value.mode === 'access-only') {
    const expectedIds = [identity.contractId, identity.providerObligationId,
      ...(identity.consumerRequirements ?? []).map(entry => entry.id)].filter((id): id is string => id !== null);
    const expectedRequirements = new Set(expectedIds.slice(2));
    value.retirements.slice(2).forEach((entry, offset) => {
      if (!expectedRequirements.has(entry.id)) errors.push({ path: `retirements.${offset + 2}.id`,
        message: `${entry.id} is not a current consumer requirement of this agreement`,
        expected: [...expectedRequirements].join(', ') });
    });
    if (value.retirements.length !== expectedIds.length) errors.push({ path: 'retirements',
      message: 'The mode change must retire the contract, provider obligation and every current consumer requirement',
      expected: expectedIds.join(', ') });
    const expectedWorkItems = [...new Set((identity.consumerRequirements ?? []).map(entry => entry.workItem))].sort();
    const scopedWorkItems = [...new Set(value.scope.consumerWorkItems)].sort();
    if (value.scope.consumerWorkItems.length !== expectedWorkItems.length || scopedWorkItems.join('\0') !== expectedWorkItems.join('\0')) errors.push({ path: 'scope.consumerWorkItems',
      message: 'The mode change must name every affected consumer work item', expected: expectedWorkItems.join(', ') });
    if ((identity.conversionBlockers ?? []).length > 0) errors.push({ path: 'scope',
      message: `Access-only conversion cannot retire unfinished evidence: ${identity.conversionBlockers!.join('; ')}`,
      expected: 'real-provider conformance and every consumer requirement verified before conversion' });
  }
  if (identity.kind === 'revise' && 'consumerRequirementKeys' in value
    && value.retirements[0]?.id !== identity.consumerRequirementId)
    errors.push({ path: 'retirements.0.id',
      message: `${value.retirements[0]?.id ?? '<missing>'} is not the revising consumer's accepted requirement`,
      expected: identity.consumerRequirementId ?? 'an existing accepted consumer requirement' });
  return errors;
}

async function establishedErrors(value: EstablishedContract, evidence: ContractEvidence): Promise<SubmissionError[]> {
  const errors: SubmissionError[] = [];
  const index = evidence.index;

  const known = (module: string, path: string) => {
    if (index === null || findModule(index, module) !== undefined) return;
    errors.push({ path, message: `No module "${module}" is in the refreshed architect view`, expected: 'a module of the view' });
  };
  known(value.provider, 'provider');
  known(value.authority.owner, 'authority.owner');

  if (trailerLine.test(value.summary)) {
    errors.push({
      path: 'summary',
      message: 'The harness writes the commit\'s trailers; a submission may not contain a line that reads as one',
      expected: 'prose with no "Ramify-…:" line',
    });
  }

  const named: Array<{ path: string; value: string }> = [
    ...value.artifacts.interface.map((entry, position) => ({ path: `artifacts.interface.${position}.path`, value: entry.path })),
    ...value.artifacts.conformance.map((entry, position) => ({ path: `artifacts.conformance.${position}.path`, value: entry.path })),
    ...value.artifacts.fake.map((entry, position) => ({ path: `artifacts.fake.${position}.path`, value: entry.path })),
    ...value.artifacts.exposure.map((entry, position) => ({ path: `artifacts.exposure.${position}.path`, value: entry.path })),
    ...value.fakeInjections.map((entry, position) => ({ path: `fakeInjections.${position}`, value: entry })),
  ];
  for (const entry of named) {
    const target = toPosix(entry.value);
    if (target === '' || target.startsWith('/') || target.split('/').includes('..')) {
      errors.push({ path: entry.path, message: `"${entry.value}" is not a project-relative path`, expected: 'a path relative to the project root' });
      continue;
    }
    if (await evidence.exists(target)) continue;
    errors.push({
      path: entry.path,
      message: `"${entry.value}" is not a file of the tree; an agreement names the artifacts it wrote`,
      expected: 'a path the iteration wrote',
    });
  }

  // An injection site is in the consumer, or on the provider side where the
  // real behavior will act. Anywhere else is neither side of the seam.
  if (index !== null) {
    const consumer = findModule(index, evidence.consumer)?.module;
    const provider = findModule(index, value.provider)?.module;
    value.fakeInjections.forEach((site, position) => {
      const owner = moduleOwning(index, toPosix(site));
      if (owner !== undefined && (owner.module === consumer || owner.module === provider)) return;
      errors.push({
        path: `fakeInjections.${position}`,
        message: `"${site}" lies in ${owner === undefined ? 'no module\'s own contents' : `the own contents of "${owner.module}"`}, and ${injectionSiteRule}`,
        expected: `a file of ${evidence.consumer} or of ${value.provider}`,
      });
    });
  }

  if (value.mode === 'fake-backed') {
    const required: Array<readonly [readonly unknown[], string, string]> = [
      [value.artifacts.interface, 'artifacts.interface', 'the interface the two sides agree on'],
      [value.artifacts.conformance, 'artifacts.conformance', 'the conformance suite the provider must pass'],
      [value.artifacts.fake, 'artifacts.fake', 'the fake the consumer implements against'],
      [value.fakeInjections, 'fakeInjections', 'where the consumer holds the fake'],
    ];
    for (const [entries, path, what] of required) {
      if (entries.length > 0) continue;
      errors.push({
        path,
        message: `A fake-backed agreement names ${what}; without it the delegation has no executable evidence`,
        expected: 'at least one entry',
      });
    }
    for (const [position, entry] of value.artifacts.fake.entries()) {
      if (entry.exports.length > 0) continue;
      errors.push({
        path: `artifacts.fake.${position}.exports`,
        message: 'A fake file exports the implementation, factory or class the consumer uses',
        expected: 'at least one exported name',
      });
    }
    errors.push(...standsForErrors(value, index));
  } else {
    const forbidden: Array<readonly [readonly unknown[], string]> = [
      [value.artifacts.fake, 'artifacts.fake'],
      [value.fakeInjections, 'fakeInjections'],
      [value.artifacts.conformance, 'artifacts.conformance'],
    ];
    for (const [entries, path] of forbidden) {
      if (entries.length === 0) continue;
      errors.push({
        path,
        message: 'An access-only agreement integrates the real behavior: it has no fake, no conformance suite and no obligation',
        expected: 'no entry',
      });
    }
    if (value.artifacts.exposure.length === 0) {
      errors.push({
        path: 'artifacts.exposure',
        message: 'An access-only agreement is an exposure change, so it names the declarations it changed',
        expected: 'at least one entry',
      });
    }
  }

  return errors;
}

/**
 * Each fake export names the one real provider export it stands for: a file
 * of the provider module, which need not exist yet, and its export name, with
 * the exposure the agreement declares for it. The fake is compared with that
 * exposure at the gate, so every ancestor it names must be one that can
 * re-expose what the provider exposes.
 */
function standsForErrors(value: EstablishedContract, index: ArchitectIndex | null): SubmissionError[] {
  const errors: SubmissionError[] = [];
  const provider = index === null ? undefined : findModule(index, value.provider);
  for (const [position, entry] of value.artifacts.fake.entries()) {
    const named = new Map<string, number>();
    for (const [at, standsFor] of entry.standsFor.entries()) {
      const path = `artifacts.fake.${position}.standsFor.${at}`;
      named.set(standsFor.fake, (named.get(standsFor.fake) ?? 0) + 1);
      if (!entry.exports.includes(standsFor.fake)) {
        errors.push({ path: `${path}.fake`, message: `"${standsFor.fake}" is not one of this fake file's exports`, expected: `one of ${entry.exports.join(', ') || 'its exports'}` });
      }
      const target = toPosix(standsFor.path);
      if (target === '' || target.startsWith('/') || target.split('/').includes('..')) {
        errors.push({ path: `${path}.path`, message: `"${standsFor.path}" is not a project-relative path`, expected: 'a path relative to the project root' });
      } else if (isFakeFile(target)) {
        errors.push({ path: `${path}.path`, message: `"${standsFor.path}" is a fake; a fake stands for the real provider export`, expected: 'the provider file that holds, or will hold, the real export' });
      } else if (provider !== undefined && index !== null && ownerOf(index, target)?.module !== provider.module) {
        errors.push({
          path: `${path}.path`,
          message: `"${standsFor.path}" is not a file of the provider ${provider.module}; the real export a fake stands for is the provider's`,
          expected: `a path beneath ${provider.dir === '' ? 'the root module' : `${provider.dir}/`} and no child module`,
        });
      }
      const channels = new Set<string>();
      for (const channel of standsFor.exposure.to) {
        if (channels.has(channel)) errors.push({ path: `${path}.exposure.to`, message: `"${channel}" is named twice`, expected: 'each channel once' });
        channels.add(channel);
      }
      const ancestors = provider === undefined || index === null ? null : ancestorsOf(index, provider.module);
      const by = new Set<string>();
      for (const [step, reexposed] of standsFor.exposure.reexposed.entries()) {
        if (by.has(reexposed.by)) {
          errors.push({ path: `${path}.exposure.reexposed.${step}.by`, message: `"${reexposed.by}" re-exposes the real export once, with every channel in its "to"`, expected: 'each ancestor once' });
        }
        by.add(reexposed.by);
        if (ancestors !== null && !ancestors.includes(reexposed.by)) {
          errors.push({
            path: `${path}.exposure.reexposed.${step}.by`,
            message: `"${reexposed.by}" is not an ancestor of the provider ${value.provider}; only an ancestor re-exposes what it received`,
            expected: ancestors.length === 0 ? 'no re-exposure' : `one of ${ancestors.join(', ')}`,
          });
        }
      }
    }
    for (const name of entry.exports) {
      const count = named.get(name) ?? 0;
      if (count === 1) continue;
      errors.push({
        path: `artifacts.fake.${position}.standsFor`,
        message: count === 0
          ? `The fake export "${name}" names no real export it stands for; a fake is exactly as importable as what it stands for, so the agreement names it`
          : `The fake export "${name}" stands for ${count} real exports; name the one it stands for`,
        expected: `exactly one entry whose "fake" is "${name}"`,
      });
    }
  }
  return errors;
}

function toPosix(path: string): string {
  return posix.normalize(path.split(sep).join('/')).replace(/^\.\//, '').replace(/\/$/, '');
}
