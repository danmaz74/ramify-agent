import { z } from 'zod';
import { sha256Schema } from '../../../src/interfaces/protocol/evidence.js';
import { roleSchema } from '../../../src/interfaces/protocol/runs.js';
const text = z.string().min(1);
const timestamp = z.iso.datetime();

export type InvocationId = string;

export type SessionId = string;

/** A run's session identifier, as its log records it. */
export const sessionIdSchema = z.string().regex(/^ses-\d{4,}$/);

/**
 * Why the harness finished a session: its iteration or work item closed, its
 * run ended, the agent can no longer read it, a session reconstructed from
 * records took its place, recovery closed its interrupted invocation, or the
 * harness has no further use for it.
 */
export { sessionFinishReasonSchema as runSessionFinishReasonSchema };

export const sessionFinishReasonSchema = z.enum(['work-closed', 'run-ended', 'lost', 'replaced', 'interrupted', 'not-kept']);
export type SessionFinishReason = z.infer<typeof sessionFinishReasonSchema>;


/** How a session of one invocation started, as the port names it. */
export const sessionModeSchema = z.enum(['fresh', 'continued', 'fork']);
export type SessionMode = z.infer<typeof sessionModeSchema>;


export const recordRefSchema = z.object({ id: z.string(), revision: z.int().nonnegative(), hash: sha256Schema }).strict();
export type RecordRef = z.infer<typeof recordRefSchema>;

export const scopeComponentSchema = z.object({
  component: z.enum(['owned-source', 'api-views', 'architect-view', 'support-documents']),
  detail: z.string(),
  bytes: z.int().nonnegative().nullable(),
  state: z.enum(['measured', 'unavailable', 'unknown']),
  reason: z.string().optional(),
  /** Production, testing, documentation and API buckets, preserved beside the aggregate. */
  buckets: z.record(z.string(), z.int().nonnegative()).optional(),
}).strict();
export type ScopeComponent = z.infer<typeof scopeComponentSchema>;

export const scopeSizeSchema = z.object({
  policy: z.literal('scope-size/2'),
  snapshot: text,
  components: z.array(scopeComponentSchema),
  /** The deduplicated union in bytes, or null when a component is unavailable. */
  bytes: z.int().nonnegative().nullable(),
  /** What was measured where the total is unavailable. */
  subtotal: z.int().nonnegative(),
  coverage: z.enum(['complete', 'partial']),
}).strict();
export type ScopeSize = z.infer<typeof scopeSizeSchema>;


export const usageSchema = z.object({
  input: z.int().nonnegative(),
  output: z.int().nonnegative(),
  cacheRead: z.int().nonnegative(),
  cacheWrite: z.int().nonnegative(),
  total: z.int().nonnegative(),
}).strict();

/** The work one invocation, and the session it belongs to, is for: none for the plan architect. */
export const invocationWorkSchema = z.object({ task: text.optional(), workItem: text.optional(), iteration: text.optional(), request: text.optional(),
  capabilityTask: text.optional(),
  nonfunctionalRepair: text.optional(),
  automaticRepair: text.optional(),
}).strict();
export type InvocationWork = z.infer<typeof invocationWorkSchema>;

export const interruptionEvidenceSchema = z.object({ classification: z.enum(['transport', 'permanent', 'unknown', 'adapter-fault', 'preparation', 'check-execution']),
  diagnostic: z.string(), code: z.string().optional(), status: z.number().optional(), retryAfterMs: z.number().nonnegative().optional() }).strict();

export const sessionPointSchema = z.union([
  z.object({ session: sessionIdSchema, invocation: text }).strict(),
  z.object({ session: sessionIdSchema, append: z.int().positive() }).strict(),
]);
export type SessionPoint = z.infer<typeof sessionPointSchema>;

/** Captured when a global question is accepted, never recomputed on retry. */
export const globalForkSourceSchema = z.object({
  generation: z.int().positive(), session: sessionIdSchema.nullable(), ref: text.nullable(),
  point: sessionPointSchema.nullable(), previous: sessionIdSchema.nullable(),
  appended: z.array(text), pending: z.array(text),
}).strict();

/**
 * Why a suspended session is continued: its placement request was answered,
 * the iteration it assigned closed, its completion was refused while
 * evidence was owed, a gate failed after its result and it repairs, the
 * reconciliation of its completion request chose a correction, its
 * unresolved request was answered with a plan deviation, or the operator
 * resumed the run after its unresolved request was answered with an
 * environment problem.
 */
export const continueReasonSchema = z.enum(['placement-answered', 'iteration-closed', 'completion-refused', 'repair', 'reconciliation', 'deviation-recorded', 'environment-resumed', 'context-selected', 'capability-qualification', 'capability-returned', 'capability-coordination', 'debugger']);
export type ContinueReason = z.infer<typeof continueReasonSchema>;

/**
 * Why a session is forked from another: a placement request forks the
 * architect context; a scope review forks the module architect at the point
 * that produced the assignment; a design review forks the orientation that
 * read its guidance; a reconciliation forks the module architect at the
 * point after its completion request; an unresolved request forks the
 * architect context, as a placement request does.
 */
export const forkReasonSchema = z.enum(['interruption-recovery', 'placement-request', 'scope-review', 'design-orientation', 'reconciliation', 'unresolved-request', 'context-selection', 'capability-consultation', 'architect-consultation']);

/** Why a session takes another's place: a lost engineer is reconstructed from records, or the architect context is rebuilt. */
export const replaceReasonSchema = z.enum(['reconstructed', 'context-rebuilt']);

/** Why an invocation's result opened a session: a module engineer's need opens a contract sub-session. */
export const requestReasonSchema = z.enum(['contract-needed', 'capability-needed']);

/** A continued invocation: the point it continues from, why, and the briefs appended since its session's previous invocation. */
export const continueRelationSchema = z.object({
  from: sessionPointSchema,
  reason: continueReasonSchema,
  briefs: z.array(text),
}).strict();
export type ContinueRelation = z.infer<typeof continueRelationSchema>;

/**
 * A forked session: its source point, why, and the briefs the source held
 * at the point. The architect context's generation is named by a fork of
 * that context, a placement request's; a review's fork is of another
 * session and names none.
 */
export const forkRelationSchema = z.object({
  from: sessionPointSchema,
  reason: forkReasonSchema,
  generation: z.int().positive().optional(),
  briefs: z.array(text),
}).strict();
export type ForkRelation = z.infer<typeof forkRelationSchema>;

/**
 * The module architect's session and the executor's pinned ref at one point
 * of it, captured with the event that commits what that point produced. A
 * fork from the ref starts at that point whatever the session did later.
 */
export const architectRefSchema = z.object({ session: sessionIdSchema, ref: text }).strict();
export type ArchitectRef = z.infer<typeof architectRefSchema>;

/** A session that takes another's place, which is finished before it opens. */
export const replaceRelationSchema = z.object({ session: sessionIdSchema, reason: replaceReasonSchema }).strict();
export type ReplaceRelation = z.infer<typeof replaceRelationSchema>;

/** A session opened because an invocation's result asked for it; it shares no history with it. */
export const requestRelationSchema = z.object({ invocation: text, reason: requestReasonSchema }).strict();
export type RequestRelation = z.infer<typeof requestRelationSchema>;

/**
 * A start the executor could not honor: the relation requested, the start
 * that was actual, and the executor's reason, null where it gave none.
 */
export const degradeRelationSchema = z.object({
  requested: z.enum(['continue', 'fork']),
  actual: z.enum(['fresh', 'continue', 'fork']),
  reason: z.string().nullable(),
}).strict();
export type DegradeRelation = z.infer<typeof degradeRelationSchema>;

/** Provider-neutral operation linkage. No executor file names or provider entry IDs. */
export const sessionOperationLinkSchema = z.object({ runId: text, operationId: text,
  sessionId: text.optional(), turn: z.int().nonnegative().optional(), sourcePoint: z.object({ sessionId: text, kind: z.enum(['turn', 'checkpoint']), turn: z.int().nonnegative(), checkpoint: text }).strict().optional(), point: z.object({ sessionId: text, kind: z.enum(['turn', 'checkpoint']), turn: z.int().nonnegative(), checkpoint: text }).strict().nullable().optional(),
}).strict();

export const invocationSchema = z.object({
  schema: z.literal('ramify-agent.invocation/1'),
  sessionOperation: sessionOperationLinkSchema.optional(),
  id: text,
  role: roleSchema,
  work: invocationWorkSchema,
  /** The count of this role's invocations for this work, this one included. */
  attempt: z.int().positive(),
  /** `actual` differs from `requested` when the implementation could not continue or fork. */
  session: z.object({
    requested: sessionModeSchema,
    actual: sessionModeSchema,
    ref: z.string(),
    from: z.string().optional(),
    degradedReason: z.string().optional(),
  }).strict(),
  prompt: z.object({ package: text, hash: sha256Schema, inputsHash: sha256Schema.optional(), requestedInputsHash: sha256Schema.optional(), manifest: z.record(z.string(), z.unknown()).optional() }).strict(),
  /** The write scope's revision, and the scope size this invocation was measured at. */
  scope: z.object({
    write: z.int().nonnegative().nullable(),
    measurement: recordRefSchema.nullable(),
    size: scopeSizeSchema.nullable(),
    readSize: scopeSizeSchema.nullable().optional(),
  }).strict(),
  writer: z.boolean(),
  /** Exact candidate tree before a writer started; absent where the writer was started without one. */
  candidateBefore: z.string().regex(/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/u).optional(),
  supersedes: text.optional(),
  recoveryPredecessor: text.optional(),
  recoveryGroup: z.int().nonnegative().optional(),
  /** The latest passed committing checkpoint's audited hash when it started, or the run base before one exists. A manual run's is the commit HEAD named when it started. */
  base: z.string(),
  /**
   * The tree a manual run's invocation started on: whether it differed from
   * its base, and the changed paths. A step run uses the tree as it stands
   * and restores nothing, so this is what tells two runs of the same inputs
   * apart. Absent from a run's invocations.
   */
  startingTree: z.object({ dirty: z.boolean(), changed: z.array(z.string()) }).strict().optional(),
  startedAt: timestamp,
}).strict();
export type Invocation = z.infer<typeof invocationSchema>;

export const invocationOutcomeSchema = z.object({
  schema: z.literal('ramify-agent.invocation-outcome/1'),
  sessionOperation: sessionOperationLinkSchema.optional(),
  invocation: text,
  ended: z.enum(['submitted', 'ended', 'failed', 'stopped', 'context-budget-reached', 'resource-pending', 'checkpoint-pending', 'invalid-submission']),
  /** Each one is a `rejection` observation with its errors. */
  rejectedSubmissions: z.int().nonnegative(),
  interruption: z.enum(['idle-timeout', 'absolute-timeout', 'provider-error', 'session-lost', 'adapter-fault']).optional(),
  interruptionEvidence: interruptionEvidenceSchema.optional(),
  resource: z.enum(['context', 'stall']).optional(),
  resourceReason: z.string().optional(),
  /** Architect requested handoff after Pi retained a native compaction summary. */
  checkpointReason: z.string().optional(),
  /** A superseded invocation's result is kept and never applied. */
  disposition: z.enum(['applied', 'superseded', 'incomplete']),
  /**
   * Where the session's history ended, and the mode that was actual. The
   * `Invocation` records what was requested, before the session started;
   * this records what the implementation answered and the point a later
   * fork or append names. Absent for an invocation whose session never ran.
   */
  session: z.object({
    ref: z.string(),
    mode: sessionModeSchema,
    /** Why the requested mode was not honored, as the implementation said. */
    degradedReason: z.string().optional(),
  }).strict().optional(),
  submission: z.object({ hash: sha256Schema }).strict().nullable(),
  /** Always an estimate; `observed: null` is unknown, never room. */
  budget: z.object({ threshold: z.number(), observed: z.number().nullable(), reportDelivered: z.boolean() }).strict().optional(),
  /**
   * The harness's own observation, never `stop()` resolving or the agent's
   * word: the session idle and its registered process groups killed and gone.
   */
  settled: z.object({
    confirmed: z.boolean(),
    at: timestamp,
    groupsKilled: z.int().nonnegative(),
    lateWrites: z.array(z.string()),
  }).strict(),
  /** Writers only: uncommitted changed paths outside the write scope when it settled. */
  outsideScope: z.array(z.string()),
  unknownPlacement: z.array(z.string()).optional(),
  placementFailure: z.string().optional(),
  /** Exact candidate tree after this writer settled; absent without a starting tree or when the scratch rule failed at settlement. */
  candidateAfter: z.string().regex(/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/u).optional(),
  usage: z.union([usageSchema, z.object({ unavailable: text }).strict()]),
  elapsedMs: z.int().nonnegative(),
  error: z.string().optional(),
}).strict();
export type InvocationOutcome = z.infer<typeof invocationOutcomeSchema>;


export { usageSchema as invocationUsageSchema };

export type { SessionMode as TaskSessionMode };

export type { RecordRef as DurableRecordRef };
