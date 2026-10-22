import { join } from 'node:path';
import { z } from 'zod';
import { citationSchema, modulePathSchema, viewIdentitySchema } from '../../../../../../src/interfaces/protocol/evidence.js';
import { moduleProposalSchema } from '../../../planning/src/records.js';
import { globalForkSourceSchema, recordRefSchema } from '../../../../../task-execution/src/records.js';

/*
 * The records of capability identity and placement: the request a module
 * architect makes of the plan architect, and the decision one fork of the
 * long-lived architect context commits.
 *
 * Only placement has its own decision record. The other significant choices
 * are fields of the records where they are made, and the decision list a
 * person reads is a projection over all of them.
 *
 * A decision is immutable, as every record is. A decision that replaces an
 * earlier one says so in `revises`, with what it affects: a silent
 * contradiction is impossible because the field is required wherever the
 * owner conflicts with one already decided.
 */

const text = z.string().min(1);
const capabilityName = z.union([z.string().regex(/^capability:[a-z0-9]+(?:-[a-z0-9]+)*$/), z.string().regex(/^capability-request:[a-z0-9]+(?:-[a-z0-9]+)*$/)]);
const placementSubject = z.union([capabilityName, z.string().regex(/^capability-task:[a-z0-9]+(?:-[a-z0-9]+)*$/)]);
const requestIdSchema = z.string().regex(/^placement-request:[a-z0-9]+(?:-[a-z0-9]+)*$/);
const decisionIdSchema = z.string().regex(/^placement-decision:[a-z0-9]+(?:-[a-z0-9]+)*$/);

/** A global decision derives a family-distinct name from its accepted request. */
export const globalDecisionId = (request: string): string => {
  const placement = requestIdSchema.safeParse(request);
  if (placement.success) return `placement-decision:placement-${placement.data.slice('placement-request:'.length)}`;
  const unresolved = z.string().regex(/^unresolved-request:[a-z0-9]+(?:-[a-z0-9]+)*$/).parse(request);
  return `placement-decision:unresolved-${unresolved.slice('unresolved-request:'.length)}`;
};

/** What the retired `extend` value is answered with, in the terms the role submits. */
export const extensionIsANewCapability = 'An existing capability is never revised to cover more. Register the extended behavior as a new capability named for itself, with outcome "create" and the existing module as its owner, and set "changesExistingSymbols" to true where implementing it changes symbols that already have consumers';

/**
 * What a decision resolved. `extract` moves existing behavior to a new
 * owner; `external` is satisfied by a package or another system, so it has
 * no owner module and creates no provider obligation.
 *
 * There is no outcome for extending a capability. An extension is a new
 * capability named for itself, so it is `create` with an existing module as
 * its owner, and `changesExistingSymbols` says whether implementing it
 * changes symbols that already have consumers.
 */
export const placementOutcomeSchema = z.enum(['reuse', 'create', 'extract', 'external'], {
  error: issue => (issue.input === 'extend' ? extensionIsANewCapability : undefined),
});
export type PlacementOutcome = z.infer<typeof placementOutcomeSchema>;

/** Who decided: one fork of the plan architect, or the work item's own module architect. */
export const decisionAuthoritySchema = z.enum(['global', 'local']);
export type DecisionAuthority = z.infer<typeof decisionAuthoritySchema>;

/** What a request's evidence says about a hypothesis it tests. */
export const hypothesisStanceSchema = z.enum(['supports', 'contradicts', 'departs']);
export type HypothesisStance = z.infer<typeof hypothesisStanceSchema>;

export const placementRequestSchema = z.object({
  schema: z.literal('ramify-agent.placement-request/2'),
  id: requestIdSchema,
  workItem: text,
  requester: modulePathSchema,
  /** The consumer capability being implemented, which this request is made for. */
  forCapability: placementSubject,
  question: text,
  requiredBehavior: text,
  findings: z.array(z.object({ text, citations: z.array(citationSchema) }).strict()),
  candidates: z.array(z.object({
    capability: capabilityName.optional(),
    owner: modulePathSchema.optional(),
    note: text,
  }).strict()),
  unresolved: z.array(text),
  /** The hypotheses being tested, at the revisions the harness delivered. */
  hypotheses: z.array(z.object({ ref: recordRefSchema, stance: hypothesisStanceSchema, evidence: text }).strict()),
  /** The requester's own local decisions this request rests on. */
  localDecisions: z.array(text),
  /** Required by current producers; absent input cannot select a moving parent. */
  globalSource: globalForkSourceSchema.optional(),
}).strict();
export type PlacementRequest = z.infer<typeof placementRequestSchema>;

export const placementDecisionSchema = z.object({
  schema: z.literal('ramify-agent.placement-decision/2'),
  id: decisionIdSchema,
  authority: decisionAuthoritySchema,
  /** Null for a local decision: no request was made of the plan architect. */
  request: z.string().nullable(),
  workItem: text,
  invocation: text,
  question: text,
  outcome: placementOutcomeSchema,
  capability: capabilityName,
  /**
   * Whether implementing this capability changes symbols that already have
   * consumers. It is what break analysis reads, and what gives a contract
   * engineer reason to read the existing consumers.
   */
  changesExistingSymbols: z.boolean(),
  /** Null only for `external`. */
  owner: modulePathSchema.nullable(),
  /** Required for an owner the refreshed view does not have yet. */
  proposed: moduleProposalSchema.optional(),
  rationale: text,
  constraints: z.array(text),
  uncertainties: z.array(text),
  evidence: z.object({
    /** The view the decision was made against, as the refresh recorded it. */
    view: viewIdentitySchema,
    citations: z.array(citationSchema),
    /** Coverage the decision could not establish; a failed refresh stays explicit here. */
    gaps: z.array(text),
  }).strict(),
  /** An earlier decision this one replaces, with what it affects. Never silent. */
  revises: z.object({
    decision: text,
    affected: z.array(z.object({
      workItem: text.optional(),
      contract: text.optional(),
      consequence: text,
    }).strict()),
  }).strict().optional(),
  /** The registry entries this decision committed. */
  registry: z.array(recordRefSchema),
  hypothesisRevisions: z.array(recordRefSchema),
  /** Global decisions only: the text appended to the parent context. */
  brief: text.optional(),
}).strict();
export type PlacementDecision = z.infer<typeof placementDecisionSchema>;

/** Where the architecture's records are materialized, relative to the run's directory. */
export const architectureLayout = {
  request: (id: string): string => join('requests', `${encodeURIComponent(id)}.json`),
  decision: (id: string): string => join('decisions', `${encodeURIComponent(id)}.json`),
} as const;

/** The schema literal of each kind, for a reader that answers unsupported version. */
export const architectureSchemas = {
  request: { schema: 'ramify-agent.placement-request/2', body: placementRequestSchema },
  decision: { schema: 'ramify-agent.placement-decision/2', body: placementDecisionSchema },
} as const;
