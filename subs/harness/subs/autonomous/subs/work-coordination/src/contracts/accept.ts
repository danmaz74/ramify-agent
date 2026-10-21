import type { DurableRecordRef as RecordRef } from '../../../../../task-execution/src/records.js';
import type { RecordRef as CommitRecord } from '../../../../../../src/jobs/commit.js';
import type { TestSelectionPolicy } from '../../../acceptance/src/checks/records.js';
import { refOf } from '../../../../../../src/jobs/committed-reader.js';
import { workLayout, workItemSchema, type WorkItem, type WorkItemId } from '../work/records.js';
import {
  consumerRequirementSchema, contractRecordSchema, contractsLayout, executionRetirementPath, executionRetirementSchema,
  obligationId, providerObligationSchema,
  type ConsumerRequirement, type ContractId, type ContractRecord, type ProviderObligation, type RequirementId,
} from './records.js';
import type { EstablishedContract } from './submission.js';

/*
 * What one accepted contract submission commits.
 *
 * Registration is derived: every identifier, hash and revision comes from
 * committed state and from the files the gate passed over, so a repeat after
 * a crash derives the same records with the same identifiers and the same
 * hashes. The agent chooses none of them.
 *
 * An initial agreement commits the contract, one provider obligation keyed
 * `ob-<contract-id>`, one requirement per consumer and the provider work
 * item. An access-only agreement establishes access to behavior that
 * already exists: it commits the contract alone.
 */

/** One consumer attaching to the agreement, as the harness resolved it. */
export interface AttachedConsumer {
  readonly requirement: RequirementId;
  readonly workItem: WorkItemId;
  readonly module: string;
  /** The capability the consumer is implementing: the tail of the dependency edge. */
  readonly forCapability: string;
  readonly tests: TestSelectionPolicy;
  readonly fakeInjections: readonly string[];
}

export interface RegistrationRequest {
  readonly contract: ContractId;
  /** Explicit identity for a descriptive obligation; legacy derives it from the contract. */
  readonly obligation?: string;
  readonly revision: number;
  /** The registry entry of the capability, and the decision that placed it. */
  readonly capability: { readonly ref: RecordRef; readonly slug: string; readonly decision: string | null };
  readonly submission: EstablishedContract;
  /** The SHA-256 of each named artifact as the gate found it. */
  readonly hashes: ReadonlyMap<string, string>;
  readonly establishedBy: { readonly iteration: string; readonly gate: string };
  readonly consumers: readonly AttachedConsumer[];
  /**
   * The provider work item this registration starts, or the one an earlier
   * consumer of the same obligation revision already started. A shared
   * obligation runs its provider once.
   */
  readonly provider:
    | { readonly kind: 'create'; readonly id: WorkItemId; readonly goal: string; readonly startedFor: WorkItemId }
    | { readonly kind: 'existing'; readonly id: WorkItemId }
    | { readonly kind: 'none' };
}

/** Everything one registration commits, and the references its event records. */
export interface Registration {
  readonly contract: ContractRecord;
  readonly obligation: ProviderObligation | null;
  readonly requirements: readonly ConsumerRequirement[];
  readonly providerWorkItem: WorkItem | null;
  readonly records: readonly CommitRecord[];
}

/** The records one accepted contract submission commits, derived from committed state. */
export function registerContract(request: RegistrationRequest): Registration {
  const { submission } = request;
  const descriptive = 'contractKey' in submission || 'contractId' in submission;
  const proposedContract = 'contractKey' in submission ? submission.contractKey.slice('draft:'.length)
    : 'contractId' in submission ? submission.contractId : request.contract;
  if (request.contract !== proposedContract)
    throw new ContractPublicationError('contractKey' in submission ? 'contractKey' : 'contractId',
      `the agreement in force is ${request.contract}; ${proposedContract} does not identify it`);
  const proposedObligation = 'providerObligationKey' in submission ? submission.providerObligationKey.slice('draft:'.length)
    : 'providerObligationId' in submission ? submission.providerObligationId : request.obligation;
  if (descriptive && submission.mode === 'fake-backed' && request.obligation !== proposedObligation)
    throw new ContractPublicationError('providerObligationKey' in submission ? 'providerObligationKey' : 'providerObligationId',
      `the provider obligation in force is ${request.obligation ?? '<missing>'}; ${proposedObligation ?? '<none>'} does not identify it`);
  if ('consumerRequirementId' in submission && !request.consumers.some(consumer => consumer.requirement === submission.consumerRequirementId))
    throw new ContractPublicationError('consumerRequirementId', `the revising consumer does not own ${submission.consumerRequirementId}`);
  if ('consumerRequirementKey' in submission && submission.mode === 'fake-backed'
    && !request.consumers.some(consumer => consumer.requirement === submission.consumerRequirementKey.slice('draft:'.length)))
    throw new ContractPublicationError('consumerRequirementKey', `the new consumer requirement does not resolve ${submission.consumerRequirementKey}`);
  if ('consumerRequirementKeys' in submission) {
    for (const [index, key] of submission.consumerRequirementKeys.entries()) {
      if (!request.consumers.some(consumer => consumer.requirement === key.slice('draft:'.length)))
        throw new ContractPublicationError(`consumerRequirementKeys.${index}`, `the replacement consumer requirement does not resolve ${key}`);
    }
    if (request.consumers.some(consumer => consumer.requirement === submission.retirements[0]?.id))
      throw new ContractPublicationError('retirements.0.id', `the retired requirement ${submission.retirements[0]?.id} cannot be carried to the new revision`);
  }
  const hash = (path: string): string => {
    const found = request.hashes.get(path);
    if (found === undefined) throw new Error(`The contract artifact ${path} was not hashed`);
    return found;
  };

  const contract = contractRecordSchema.parse({
    schema: descriptive ? 'ramify-agent.contract/3' : 'ramify-agent.contract/2',
    id: request.contract,
    revision: request.revision,
    capability: request.capability.ref,
    decision: request.capability.decision,
    authority: submission.authority,
    provider: submission.provider,
    behavior: submission.behavior,
    mode: submission.mode,
    artifacts: {
      interface: submission.artifacts.interface.map(entry => ({ path: entry.path, exports: [...entry.exports], hash: hash(entry.path) })),
      conformance: submission.artifacts.conformance.map(entry => ({ path: entry.path, hash: hash(entry.path) })),
      fake: submission.artifacts.fake.map(entry => ({
        path: entry.path,
        exports: [...entry.exports],
        hash: hash(entry.path),
        standsFor: entry.standsFor.map(standsFor => ({
          ...standsFor,
          exposure: {
            to: [...standsFor.exposure.to],
            reexposed: standsFor.exposure.reexposed.map(step => ({ by: step.by, to: [...step.to] })),
          },
        })),
      })),
      exposure: submission.artifacts.exposure.map(entry => ({ path: entry.path, declaration: entry.declaration })),
    },
    establishedBy: request.establishedBy,
  } satisfies ContractRecord);

  const records: CommitRecord[] = [
    { path: contractsLayout.contract(contract.id, contract.revision), id: contract.id, revision: contract.revision, body: contract },
  ];

  if (submission.mode === 'access-only') {
    return { contract, obligation: null, requirements: [], providerWorkItem: null, records };
  }

  const obligation = providerObligationSchema.parse({
    schema: descriptive ? 'ramify-agent.provider-obligation/2' : 'ramify-agent.provider-obligation/1',
    id: request.obligation ?? obligationId(contract.id),
    revision: request.revision,
    contract: refOf(contract.id, contract.revision, contract),
    capability: request.capability.slug,
    provider: submission.provider,
    behavior: submission.behavior,
    evidence: { conformance: submission.artifacts.conformance.map(entry => entry.path), against: 'real' },
  } satisfies ProviderObligation);
  records.push({ path: contractsLayout.obligation(obligation.id, obligation.revision), id: obligation.id, revision: obligation.revision, body: obligation });

  const requirements = request.consumers.map(consumer => consumerRequirementSchema.parse({
    schema: descriptive ? 'ramify-agent.consumer-requirement/2' : 'ramify-agent.consumer-requirement/1',
    id: consumer.requirement,
    revision: request.revision,
    workItem: consumer.workItem,
    consumer: consumer.module,
    forCapability: consumer.forCapability,
    obligation: obligation.id,
    contractRevision: request.revision,
    behavior: submission.behavior,
    evidence: {
      tests: {
        ...consumer.tests,
        exactOwners: [...consumer.tests.exactOwners],
        subtrees: [...consumer.tests.subtrees],
        extraSuites: [...consumer.tests.extraSuites],
      },
      fakeInjections: [...consumer.fakeInjections],
    },
  } satisfies ConsumerRequirement));
  for (const requirement of requirements) {
    records.push({
      path: contractsLayout.requirement(requirement.id, requirement.revision),
      id: requirement.id,
      revision: requirement.revision,
      body: requirement,
    });
  }

  let providerWorkItem: WorkItem | null = null;
  if (request.provider.kind === 'create') {
    providerWorkItem = workItemSchema.parse({
      schema: descriptive ? 'ramify-agent.work-item/2' : 'ramify-agent.work-item/1',
      id: request.provider.id,
      module: submission.provider,
      origin: { obligation: refOf(obligation.id, obligation.revision, obligation) },
      goal: request.provider.goal,
      requirementRefs: [],
      acceptanceRefs: [],
      contextRefs: [],
      ...(descriptive ? { functionalRequirementIds: [], functionalAcceptanceIds: [], contextIds: [] } : {}),
      startedFor: request.provider.startedFor,
    } satisfies WorkItem);
    records.push({ path: workLayout.item(providerWorkItem.id), id: providerWorkItem.id, revision: 1, body: providerWorkItem });
  }

  return { contract, obligation, requirements, providerWorkItem, records };
}

/** One registration already in the log, as its event records it. */
export interface RegisteredKey {
  readonly contract: ContractId;
  readonly revision: number;
  readonly obligation: string | null;
  readonly requirements: readonly RequirementId[];
}

/**
 * Whether a registration still has to be appended. Registration and
 * scheduling are keyed by `(obligation, revision)` and
 * `(requirement, revision)`, and every identifier is derived from committed
 * state, so a step repeated after a crash derives the same key and finds it
 * here. A registration already in the log is not appended again.
 */
export function registrationNeeded(prior: readonly RegisteredKey[], key: RegisteredKey): boolean {
  const obligations = new Set(prior.flatMap(entry => (entry.obligation === null ? [] : [`${entry.obligation}@${entry.revision}`])));
  if (key.obligation !== null && obligations.has(`${key.obligation}@${key.revision}`)) {
    // The obligation revision is registered. The registration is still
    // needed where it attaches a consumer nothing has registered yet.
    const requirements = new Set(prior.flatMap(entry => entry.requirements.map(id => `${id}@${entry.revision}`)));
    return key.requirements.some(id => !requirements.has(`${id}@${key.revision}`));
  }
  if (key.obligation === null) {
    return !prior.some(entry => entry.contract === key.contract && entry.revision === key.revision);
  }
  return true;
}

/** A serialized refusal that names the proposal field the author can correct. */
export class ContractPublicationError extends Error {
  constructor(readonly path: string, message: string) {
    super(`${path}: ${message}`);
    this.name = 'ContractPublicationError';
  }
}

export interface ExecutionRetirementRequest {
  readonly retirements: readonly { readonly id: string; readonly kind: 'contract' | 'provider-obligation' | 'consumer-requirement' | 'capability-request' | 'capability-task'; readonly replacements: readonly string[] }[];
  readonly authority: { readonly iteration: string; readonly reason: string };
  /** Accepted and retired IDs of this run, never another run's names. */
  readonly accepted: ReadonlySet<string>;
  readonly retired: ReadonlySet<string>;
  /** Replacement entities in the same atomic publication. */
  readonly published: readonly CommitRecord[];
}

/** Build retirement records only when the same transaction publishes every replacement. */
export function executionRetirements(request: ExecutionRetirementRequest): CommitRecord[] {
  const seen = new Set<string>();
  const fresh = new Set(request.published.filter(descriptiveRecord).map(record => record.id));
  return request.retirements.map((entry, index) => {
    const field = `retirements.${index}`;
    if (seen.has(entry.id)) throw new ContractPublicationError(`${field}.id`, `${entry.id} is retired twice`);
    seen.add(entry.id);
    if (!request.accepted.has(entry.id) || request.retired.has(entry.id))
      throw new ContractPublicationError(`${field}.id`, `${entry.id} is not an active accepted identity of this run`);
    for (const replacement of entry.replacements) {
      if (!fresh.has(replacement)) throw new ContractPublicationError(`${field}.replacements`,
        `${replacement} must be published as a new accepted entity in this transaction`);
      if (request.accepted.has(replacement) || request.retired.has(replacement))
        throw new ContractPublicationError(`${field}.replacements`, `${replacement} is already accepted or retired in this run`);
    }
    const body = executionRetirementSchema.parse({ ...entry, replacements: [...entry.replacements],
      authority: request.authority, schema: 'ramify-agent.execution-retirement/1' });
    return { path: executionRetirementPath(body.id), id: body.id, revision: 1, body };
  });
}

export type PublicationRecord = { readonly path: string; readonly id: string; readonly revision: number; readonly body: unknown };
export type PublicationEvent = { readonly type: string; readonly data: unknown };
export type PublicationLine = { readonly transaction: { readonly event: PublicationEvent; readonly records: readonly PublicationRecord[] } };

const descriptiveRecord = (record: PublicationRecord): boolean => {
  const schema = (record.body as { schema?: unknown } | null)?.schema;
  return schema === 'ramify-agent.contract/3' || schema === 'ramify-agent.provider-obligation/2'
    || schema === 'ramify-agent.consumer-requirement/2' || schema === 'ramify-agent.work-item/2';
};

const proposalField = (record: PublicationRecord): string => {
  if (record.id.startsWith('contract:')) return 'contractKey';
  if (record.id.startsWith('provider-obligation:')) return 'providerObligationKey';
  if (record.id.startsWith('consumer-requirement:')) return 'consumerRequirementKey';
  return 'providerWorkItem';
};

/**
 * Refuse a colliding descriptive name under the run's write mutex, using the
 * durable log as authority. An exact replay of the same iteration is harmless;
 * a changed answer under its retry identity is not an authorized correction.
 */
export function contractPublicationRefusal(
  lines: readonly PublicationLine[], event: PublicationEvent, records: readonly PublicationRecord[],
): ContractPublicationError | null {
  if (event.type !== 'contract-registered' && event.type !== 'evidence-reopened' && event.type !== 'execution-identities-retired') return null;
  if (!records.some(descriptiveRecord) && !records.some(record =>
    (record.body as { schema?: unknown } | null)?.schema === 'ramify-agent.execution-retirement/1')) return null;
  const iteration = (event.data as { iteration?: unknown } | null)?.iteration;
  const prior = lines.filter(line => line.transaction.event.type === 'contract-registered'
    || line.transaction.event.type === 'evidence-reopened'
    || line.transaction.event.type === 'execution-identities-retired');
  const sameIteration = prior.find(line => line.transaction.event.type === event.type
    && (line.transaction.event.data as { iteration?: unknown } | null)?.iteration === iteration);
  if (sameIteration !== undefined) {
    const previous = sameIteration.transaction;
    if (previous.event.type === event.type && JSON.stringify(previous.event.data) === JSON.stringify(event.data)
      && JSON.stringify(previous.records) === JSON.stringify(records)) return null;
    return new ContractPublicationError('iteration', `the accepted submission for ${String(iteration)} already has a different result; use ordinary correction authority`);
  }

  const accepted = lines.flatMap(line => line.transaction.records);
  const retired = new Set(accepted.filter(record => (record.body as { schema?: unknown } | null)?.schema === 'ramify-agent.execution-retirement/1')
    .map(record => record.id));
  const retirements = records.filter(record => (record.body as { schema?: unknown } | null)?.schema === 'ramify-agent.execution-retirement/1');
  for (const [index, record] of retirements.entries()) {
    const parsed = executionRetirementSchema.safeParse(record.body);
    if (!parsed.success) return new ContractPublicationError(`retirements.${index}`, 'the retirement record is invalid');
    const retirement = parsed.data;
    if (record.id !== retirement.id || record.path !== executionRetirementPath(retirement.id) || record.revision !== 1)
      return new ContractPublicationError(`retirements.${index}.id`, `the retirement record for ${retirement.id} has an inconsistent identity or path`);
    if (!accepted.some(candidate => candidate.id === retirement.id) || retired.has(retirement.id))
      return new ContractPublicationError(`retirements.${index}.id`, `${retirement.id} is not an active accepted identity of this run`);
    for (const replacement of retirement.replacements) {
      if (!records.some(candidate => candidate.id === replacement && descriptiveRecord(candidate))
        || accepted.some(candidate => candidate.id === replacement))
        return new ContractPublicationError(`retirements.${index}.replacements`,
          `${replacement} must be newly accepted in the same atomic transaction`);
    }
  }
  for (const record of records.filter(descriptiveRecord)) {
    if (retired.has(record.id)) return new ContractPublicationError(proposalField(record),
      `"${record.id}" is retired in this run and cannot be reused`);
    const earlier = accepted.filter(candidate => candidate.id === record.id);
    if (earlier.length === 0) continue;
    const priorRevision = earlier.reduce((latest, candidate) => candidate.revision > latest.revision ? candidate : latest);
    const revision = event.type === 'evidence-reopened' && record.revision === priorRevision.revision + 1;
    const body = record.body as { schema?: unknown; contract?: { id?: unknown }; workItem?: unknown; obligation?: unknown };
    const previous = priorRevision.body as typeof body;
    const replacedObligation = records.some(candidate => {
      const retirement = executionRetirementSchema.safeParse(candidate.body);
      return retirement.success && retirement.data.id === previous.obligation
        && retirement.data.replacements.includes(String(body.obligation));
    });
    const sameSubject = body.schema === previous.schema
      && (body.schema === 'ramify-agent.contract/3'
        || body.schema === 'ramify-agent.provider-obligation/2' && body.contract?.id === previous.contract?.id
        || body.schema === 'ramify-agent.consumer-requirement/2'
          && body.workItem === previous.workItem && (body.obligation === previous.obligation || replacedObligation));
    if (revision && sameSubject) continue;
    return new ContractPublicationError(proposalField(record),
      `"${record.id}" is already accepted at revision ${priorRevision.revision}; propose an unused descriptive name or cite the existing agreement through its revision authority`);
  }
  return null;
}
