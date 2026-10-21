import { SnapshotId } from '../../../kpi/src/run-records.js';
import { readinessDirectory } from '../../subs/acceptance/src/readiness-records.js';
import { gateOperationSchema } from '../../subs/acceptance/src/gate-records.js';
import { gateAuditOutcomeSchema } from '../../subs/acceptance/src/gate-records.js';
import { gateAttemptSchema } from '../../subs/acceptance/src/gate-records.js';
import { lineEventSummarySchema } from '../../../kpi/src/run-records.js';
import { measurementSnapshotSchema } from '../../../kpi/src/run-records.js';
import { infrastructureRecoverySchema } from '../../subs/acceptance/src/readiness-records.js';
import { readinessAttemptSchema } from '../../subs/acceptance/src/readiness-records.js';
import { promptPackageManifestSchema } from '../../../../src/prompts/records.js';
import { committedAuditConfigurationSchema } from '../../../../src/run/project-records.js';
import { capturedProjectConfigSchema } from '../../../../src/run/project-records.js';
import { reviewPolicySchema } from '../../subs/acceptance/src/review-policy.js';
import { contextPolicySchema } from '../../../task-execution/src/context-records.js';
import { checkCommandSchema } from '../../subs/acceptance/src/checks/command-records.js';
import { EntryAssignments, ModuleProposal, entryAssignmentsSchema, moduleProposalSchema, planRefSchema } from '../../subs/planning/src/records.js';
import { InvocationId, SessionId, interruptionEvidenceSchema, invocationOutcomeSchema, invocationSchema, invocationWorkSchema, recordRefSchema } from '../../../task-execution/src/records.js';
import { z } from 'zod';
import { join } from 'node:path';
import { citationSchema, inputManifestSchema, modulePathSchema, sha256Schema, viewIdentitySchema } from '../../../../src/interfaces/protocol/evidence.js';
import { jobIdSchema, planIdSchema } from '../../../../src/interfaces/protocol/ids.js';
import { breakpointSelectorSchema, ownershipPreflightSchema, roleSchema, runAgentSchema, type Role } from '../../../../src/interfaces/protocol/runs.js';
import { jobSchemaVersion, jobsDirectory } from '../../../../src/jobs/records.js';
import type { GateAttempt } from '../../subs/acceptance/src/checks/records.js';
import { planScenarioExtractionSchema } from '../../../scenarios/src/extraction.js';
import { scenarioRecordSchema } from '../../../scenarios/src/records.js';
import { nonBehavioralAcceptanceSchema } from '../../../scenarios/src/form.js';
import { documentManifestSchema } from '../../../plan-evidence/src/interfaces/contracts.js';
import { elementCatalogSchema, elementIdSchema } from '../../../plan-evidence/src/interfaces/catalog.js';
import { assessmentSchema, roundSchema } from '../../../nonfunctional/src/interfaces/contracts.js';
import { incorporationSchema } from '../../subs/planning/src/evidence-contracts.js';
import { contextSelectionSchema } from '../../subs/work-coordination/src/context-selection/contracts.js';
import { preparedCandidateSchema, nonfunctionalDeviationSchema, nonfunctionalRepairAssignmentSchema } from '../../subs/acceptance/src/nonfunctional-records.js';
import { repairIncidentRecordSchema } from '../../../../src/interfaces/protocol/repairs.js';
import { automaticRepairAssignmentSchema, repairPreparationSchema, repairDeltaSchema, repairAttemptSchema } from '../../subs/work-coordination/src/repair/repair-preparation.js';
import { repairExportPayloadSchema } from './repair-export.js';
import { externalRepairAdmissionSchema, recoveryIdentitySchema } from './recovery-admission.js';

/*
 * The durable records of one implementation run, and where each of them is
 * materialized beneath the run's directory. Every one of them is an
 * immutable file committed by one run-log event; a change is a new revision
 * in a new file, and no record carries a status field.
 *
 * The record types are the core records proposal's. The schemas are here and
 * not beside the types they mirror, because persisting a record is the run's
 * concern: `checks/records.ts` describes a gate attempt and returns it, and
 * it is this file that reads one back.
 */

// Identifiers. Each is derived by the harness from committed state, so a step
// repeated after a crash derives the same one.

/** `inv-0007`, the count of committed invocations of the run. */
/** `rec-0004`, the count of committed infrastructure recoveries. */
export type RecoveryId = string;
/** `ms-0007`, the count of committed measurement snapshots. */

/** `ses-0003`, the count of committed `session-opened` events of the run. */

const counted = (prefix: string, width: number) => (count: number): string => `${prefix}-${String(count).padStart(width, '0')}`;

export const invocationId = counted('inv', 4);

export const recoveryId = counted('rec', 4);

export const sessionId = counted('ses', 4);

/** A readiness attempt's directory name, `01`. */


// The run's own record.

const timestamp = z.iso.datetime();
const text = z.string().min(1);

/**
 * One external command, with the environment the harness built for it named
 * and not quoted. `env` is the sorted names of the variables its child
 * receives and `envAdditions` the harness's own settings; `checks/records.ts`
 * says why.
 *
 */
export const runPolicySchema = z.object({
  version: z.enum(['run-policy/7', 'run-policy/8']),
  continuity: z.object({ version: z.literal('resource-continuity/1') }).strict().optional(),
  contract: z.literal('plan21-whole-owner-and-architect-reporting/1'),
  /** Absent in historical runs; only newly captured policies authorize recovery. */
  recovery: z.object({ version: z.literal('operation-recovery/1'), automaticRetries: z.int().nonnegative(),
    baseDelayMs: z.int().nonnegative(), maxDelayMs: z.int().positive() }).strict().optional(),
  limits: z.object({
    repairRoundsPerIteration: z.int().positive(),
    repairRoundsPerWorkItemGate: z.int().positive(),
    infrastructureRetriesPerGate: z.int().positive(),
    forkRetriesPerRequest: z.int().positive(),
    budgetReturnsPerIteration: z.int().positive(),
    sessionReconstructionsPerWork: z.int().positive(),
    cycleReplansPerWorkItem: z.int().positive(),
    rejectedSubmissionsPerTurn: z.int().positive(),
    rejectedToolInputsPerTurn: z.int().positive(),
    readinessRecoveries: z.int().positive(),
    stopSettleMs: z.int().positive(),
    writerSettleMs: z.int().positive(),
    invocationIdleMs: z.int().positive(),
    invocationAbsoluteMs: z.int().positive(),
    maxIterationsPerWorkItem: z.int().positive(),
    /** The bound used for capability tasks. */
    maxIterationsPerCapabilityTask: z.int().positive().optional(),
    maxWorkItems: z.int().positive(),
    maxPlacementRequests: z.int().positive(),
    maxInvocationsPerRun: z.int().positive(),
    unlimitedRunDuration: z.boolean().optional(),
    runAbsoluteMs: z.int().positive(),
    /** Legacy reconciliation count, retained to read captured run policy. */
    reconciliationRoundsPerWorkItem: z.int().positive().optional(),
    /** Legacy later-round risk floor, retained to read captured run policy. */
    laterRoundMinimumRisk: z.enum(['medium', 'high']).optional(),
    /** The plan deviations recorded before the next one waits for the person. */
    maxPlanDeviations: z.int().nonnegative().optional(),
    /**
     * The longest one shell command of a module engineer may run unless its
     * assignment raises it; the current policy builder supplies the default.
     */
    commandTimeoutMs: z.int().positive().optional(),
    /**
     * The ceilings an assignment may raise a module engineer's bounds to: one
     * shell command, the idle bound and the absolute bound of each of its
     * invocations. The current policy builder supplies their defaults.
     */
    maxCommandTimeoutMs: z.int().positive().optional(),
    maxInvocationIdleMs: z.int().positive().optional(),
    maxInvocationAbsoluteMs: z.int().positive().optional(),
    /** Legacy non-functional round count, retained to read captured run policy. */
    nonfunctionalRoundsPerPlan: z.int().positive().max(3).optional(),
  }).strict(),
  /**
   * The context policy of each role used by this current engine configuration.
   */
  context: z.object({
    'initial-architect': contextPolicySchema,
    'global-fork': contextPolicySchema,
    'local-architect': contextPolicySchema,
    engineer: contextPolicySchema,
    /** The current scripted lifecycle seam exercises this role; production uses capability assignments. */
    'contract-engineer': contextPolicySchema.optional(),
    'capability-architect': contextPolicySchema.optional(),
    reviewer: contextPolicySchema.optional(),
    /** Context for failure analysis when that role is configured. */
    'failure-analyst': contextPolicySchema.optional(),
    /** Context for evidence selection when that role is configured. */
    'context-selector': contextPolicySchema.optional(),
    /** Context for catalog extraction when that role is configured. */
    'catalog-extractor': contextPolicySchema.optional(),
    'nonfunctional-coordinator': contextPolicySchema.optional(),
    'nonfunctional-repair-engineer': contextPolicySchema.optional(),
  }).strict() satisfies z.ZodType<Partial<Record<Role, z.infer<typeof contextPolicySchema>>>>,
  /** A transcript body larger than `inlineBodyBytes` is stored in the content store, not in its entry. */
  transcript: z.object({ inlineBodyBytes: z.int().positive() }).strict(),
  /**
   * The iteration reviews a run requests and how it runs them. A policy
   * without it records no review request, and every review coverage view of
   * the run answers unavailable, never clean.
   */
  reviews: reviewPolicySchema.optional(),
  /**
   * The harness's own commands: a standalone session's in-place diagnosis
   * and the post-write hook. A run's gates run the project's committed audit
   * definition instead, so no test command is captured here.
   */
  commands: z.object({
    typeCheck: checkCommandSchema,
    ramifyCheck: checkCommandSchema,
    ramifyChanged: checkCommandSchema,
    hookTimeoutMs: z.int().positive(),
  }).strict(),
}).strict();
export type RunPolicy = z.infer<typeof runPolicySchema>;



// The project's configuration.

/** The version a project's `ramify-agent.json` declares. */
export const runRecordSchema = z.object({
  schema: z.literal(jobSchemaVersion),
  /** Absent in historical runs. New runs record the identity contract at capture. */
  identityContract: z.enum(['legacy', 'descriptive']).optional(),
  jobId: jobIdSchema,
  planId: planIdSchema,
  kind: z.literal('implementation'),
  restart: z.object({ sourceRun: jobIdSchema, sourceCursor: z.int().nonnegative(), sourceDigest: sha256Schema, importDigest: sha256Schema, importPath: text, generation: z.int().positive() }).strict().optional(),
  agent: runAgentSchema,
  createdAt: timestamp,
  manifest: inputManifestSchema,
  /** Prompt and skill packages by role, each a content hash. A role without a package has none yet. */
  prompts: z.partialRecord(roleSchema, z.object({ package: text, hash: sha256Schema }).strict()),
  policy: runPolicySchema,
  /** The project's `ramify-agent.json`, validated or with the reason it is not. */
  projectConfig: capturedProjectConfigSchema,
  /** Optional administration destination captured once; its failure never refuses implementation. */
  beadsAdministration: z.union([
    z.object({ trackerWorkspace: text, executable: text }).strict(),
    z.object({ error: text }).strict(),
  ]).optional(),
  /**
   * Absent only in records made before configured readiness. `invalid` only
   * in records made before `start-run` refused a missing or invalid
   * committed audit configuration.
   */
  auditConfiguration: z.union([
    z.object({ config: committedAuditConfigurationSchema }).strict(),
    z.object({ invalid: z.string() }).strict(),
  ]).optional(),
  /** The frozen measurement baseline B, or the reason the producer gave none. */
  baseline: z.union([
    z.object({ measurement: recordRefSchema }).strict(),
    z.object({ unavailable: text }).strict(),
  ]),
  /**
   * The plan scenarios extracted from the captured plan's `gherkin` blocks,
   * `ps-01`, … in document order, and every block that did not parse as a
   * limitation. Captured with the plan and never revised.
   */
  planScenarios: planScenarioExtractionSchema,
  /**
   * Whether the run waits at its review stop after the analysis is accepted,
   * as `start-run` asked. The review itself is a transition of the log,
   * `analysis-approved`, never a field here: this record is written once.
   */
  reviewStop: z.boolean(),
  /** Absent for ordinary and legacy runs. Debug-enabled runs require the same live host. */
  breakpoint: breakpointSelectorSchema.optional(),
}).strict();
export type RunRecord = z.infer<typeof runRecordSchema>;

/**
 * A manual run: the records of invocations a person starts one at a time,
 * with `step run` or `session`, in a run's own layout. It has no drive and
 * no phase progression, and recovery never resumes it. Its identity is
 * recorded when it is created and checked each time it is used again.
 */
// The prompt packages.

// The initial analysis.

// Readiness and its recoveries.

/**
 * The steps readiness verifies, ending with the default configured audit
 * and `run-branch`. The historical `configured-full-audit` step identifier
 * remains readable in durable records; it does not override audit mode.
 */
// Measurements.

// Invocations.

export const recoveryBoundarySchema = z.object({ kind: z.enum(['invocation', 'preparation', 'readiness', 'gate']),
  role: roleSchema.optional(), work: invocationWorkSchema.optional(), invocation: z.string().optional(), source: z.string().nullable().optional(),
  candidate: z.string().optional(), checkpoint: z.string().optional(), requestHash: z.string().optional(),
  start: z.object({ mode: z.enum(['fresh', 'continue', 'fork']), ref: z.string().optional(), from: z.string().optional() }).strict().optional(),
  session: z.string().optional(), tool: z.string().optional(), reviewRequest: z.string().optional(),
  retainedTask: z.object({ candidate: z.object({ head: z.string(), tree: z.string() }).strict(), acceptedHead: z.string(),
    work: invocationWorkSchema, configuration: z.string(), progressIdentity: z.string().optional(), obligations: z.array(z.object({ kind: z.string(), id: z.string(), revision: z.number().optional() }).strict()),
    sourceRecords: z.array(z.string()), authority: z.record(z.string(), z.unknown()) }).strict().optional(),
  reconstruction: z.discriminatedUnion('name', [
    z.object({ name: z.literal('fresh-step-construction'), inputsHash: z.string(), mode: z.literal('fresh'), inputs: z.unknown().optional() }).strict(),
    z.object({ name: z.literal('retained-task-request'), inputsHash: z.string(), mode: z.literal('fresh'), invocation: z.string() }).strict(),
  ]).optional() }).strict();
export type RecoveryBoundary = z.infer<typeof recoveryBoundarySchema>;
export const operationRecoverySchema = z.object({ schema: z.literal('ramify-agent.operation-recovery/1'), id: z.string(), revision: z.int().positive(),
  state: z.enum(['pausing', 'paused', 'resumed']), boundary: recoveryBoundarySchema, evidence: interruptionEvidenceSchema,
  group: z.int().nonnegative(), automaticAttempts: z.int().nonnegative(), attempts: z.array(z.string()), pausedAt: z.iso.datetime().nullable(),
  settled: z.boolean(), candidate: z.object({ head: z.string(), tree: z.string() }).strict(), partialPaths: z.array(z.string()),
  prerequisites: z.array(z.string()), reconciledInvocations: z.array(z.string()).optional(), settlementObservations: z.array(z.object({ invocation: z.string(), at: z.iso.datetime(), groupsKilled: z.int().nonnegative(), lateWrites: z.array(z.string()), ref: z.string().nullable() }).strict()).optional(), waitingReviews: z.array(z.object({ request: z.string(), remainingMs: z.number().nonnegative() }).strict()).optional(), identity: recoveryIdentitySchema.optional(), admission: externalRepairAdmissionSchema.optional() }).strict();
export type OperationRecovery = z.infer<typeof operationRecoverySchema>;

// Lineage: how a session relates to others, by harness points and never by
// an executor's ref.

/**
 * A point a session can be continued or forked from: the end of one of its
 * invocations, or the result of one append to it, named by the sequence of
 * its `brief-appended` event.
 */
// Gate attempts. The type is `checks/records.ts`'s; this is the reader.

/** The kinds of command a gate announces. */
export const runLayout = {
  record: 'job.json',
  capturedPlan: join('input', 'plan.md'),
  documentManifest: join('input', 'documents.json'),
  documentBytes: (id: string): string => join('input', 'documents', `${id}.bin`),
  catalogVersion: (hash: string): string => join('analysis', 'catalog', `${hash}.json`),
  incorporationVersion: (hash: string): string => join('analysis', 'incorporation', `${hash}.json`),
  orientationPacket: (workItem: string, hash: string): string => join('work', workItem, 'orientation', `${hash}.txt`),
  selectionVersion: (workItem: string, hash: string): string => join('work', workItem, 'selection', `${hash}.json`),
  selection: (workItem: string): string => join('work', workItem, 'context-selection.json'),
  candidate: (id: string): string => join('nonfunctional', 'candidates', `${id}.json`),
  assessment: (id: string): string => join('nonfunctional', 'assessments', `${id}.json`),
  nonfunctionalRound: (number: number): string => join('nonfunctional', 'rounds', `${number}.json`),
  nonfunctionalRepairAssignment: (id: string): string => join('nonfunctional', 'repairs', `${id}.json`),
  nonfunctionalDeviation: (id: string): string => join('deviations', `${id}.json`),
  events: 'events.jsonl',
  restartImport: 'restart/import.json',
  promptManifest: join('prompts', 'manifest.json'),
  entries: join('analysis', 'entries.json'),
  /** One tracked scenario, `sc-001`, committed by `analysis-accepted` and immutable. */
  scenario: (id: string): string => join('scenarios', `${encodeURIComponent(id).replace(/:/g, '%3A')}.json`),
  readiness: (attempt: number): string => join('readiness', readinessDirectory(attempt), 'attempt.json'),
  readinessOutput: (attempt: number): string => join('readiness', readinessDirectory(attempt)),
  operationRecovery: (id: string, revision = 1): string => join('operation-recoveries', id, `${revision}.json`),
  recovery: (id: RecoveryId): string => join('recoveries', `${id}.json`),
  repairIncident: (id: string, revision: number): string => join('repairs', 'incidents', id, `${revision}.json`),
  contingentRepairAssignment: join('repairs', 'assignment.json'),
  repairPreparation: (id: string): string => join('repairs', 'preparations', `${id}.json`),
  repairDelta: (id: string): string => join('repairs', 'deltas', `${id}.json`),
  measurement: (id: SnapshotId): string => join('measurements', `${id}.json`),
  gate: (id: string): string => join('gates', id, 'attempt.json'),
  gateAuditOutcome: (id: string): string => join('gates', id, 'audit-outcome.json'),
  gateOperation: (id: string): string => join('gates', id, 'operation.json'),
  gateOutput: (id: string): string => join('gates', id),
  invocation: (id: InvocationId): string => join('invocations', id, 'invocation.json'),
  submission: (id: InvocationId): string => join('invocations', id, 'submission.json'),
  outcome: (id: InvocationId): string => join('invocations', id, 'outcome.json'),
  observations: (id: InvocationId): string => join('invocations', id, 'observations.jsonl'),
  lineEvents: (id: InvocationId): string => join('invocations', id, 'lines.json'),
  /** The step inputs the invocation was built from, written before its session starts. */
  stepInputs: (id: InvocationId): string => join('invocations', id, 'inputs.json'),
  /** What a manual run's invocation ended with, as its live output summarized it, written once it ended. */
  stepSummary: (id: InvocationId): string => join('invocations', id, 'step.json'),
  /** A manual run's in-place diagnosis after its invocation: the `session --gate` attempt. */
  diagnosis: (id: InvocationId): string => join('invocations', id, 'diagnosis', 'attempt.json'),
  diagnosisOutput: (id: InvocationId): string => join('invocations', id, 'diagnosis'),
  /** The executor's own session record, such as pi's, which only it reads. */
  /** The complete output of one `shell` call, which the tool answers only the tail of. */
  shellOutput: (id: InvocationId, call: number): string => join('invocations', id, 'shell', `${String(call).padStart(3, '0')}.log`),
  /** What one post-write hook check printed, which its observation names. */
  hookOutput: (id: InvocationId, check: number): string => join('invocations', id, 'hooks', `${String(check).padStart(3, '0')}.json`),
  /** The harness's transcript of one session: raw output, never a record. */
  transcript: (session: SessionId): string => join('transcripts', `${session}.jsonl`),
  /** The content store the run's transcripts name bodies in, `blobs/<sha256>`. */
  blobs: 'blobs',
} as const;

/** The schema literal of each record kind, for a reader that answers unsupported version. */
export const runSchemas = {
  run: { schema: jobSchemaVersion, body: runRecordSchema },
  documents: { schema: 'ramify-agent.document-manifest/1', body: documentManifestSchema },
  documentsDescriptive: { schema: 'ramify-agent.document-manifest/2', body: documentManifestSchema },
  catalog: { schema: 'ramify-agent.element-catalog/1', body: elementCatalogSchema },
  catalogDescriptive: { schema: 'ramify-agent.element-catalog/2', body: elementCatalogSchema },
  incorporation: { schema: 'ramify-agent.document-incorporation/2', body: incorporationSchema },
  incorporationDescriptive: { schema: 'ramify-agent.document-incorporation/3', body: incorporationSchema },
  selection: { schema: 'ramify-agent.context-selection/2', body: contextSelectionSchema },
  preparedCandidate: { schema: 'ramify-agent.prepared-candidate/1', body: preparedCandidateSchema },
  assessment: { schema: 'ramify-agent.nonfunctional-assessment/1', body: assessmentSchema },
  nonfunctionalRound: { schema: 'ramify-agent.nonfunctional-round/1', body: roundSchema },
  nonfunctionalRepairAssignment: { schema: 'ramify-agent.nonfunctional-repair-assignment/1', body: nonfunctionalRepairAssignmentSchema },
  nonfunctionalDeviation: { schema: 'ramify-agent.nonfunctional-deviation/1', body: nonfunctionalDeviationSchema },
  promptManifest: { schema: 'ramify-agent.prompt-manifest/1', body: promptPackageManifestSchema },
  entries: { schema: 'ramify-agent.entry-assignments/1', body: entryAssignmentsSchema },
  entriesDescriptive: { schema: 'ramify-agent.entry-assignments/2', body: entryAssignmentsSchema },
  scenario: { schema: 'ramify-agent.scenario/1', body: scenarioRecordSchema },
  scenarioDescriptive: { schema: 'ramify-agent.scenario/2', body: scenarioRecordSchema },
  readiness: { schema: 'ramify-agent.readiness-attempt/1', body: readinessAttemptSchema },
  operationRecovery: { schema: 'ramify-agent.operation-recovery/1', body: operationRecoverySchema },
  recovery: { schema: 'ramify-agent.infrastructure-recovery/1', body: infrastructureRecoverySchema },
  repairIncident: { schema: 'ramify-agent.repair-incident/1', body: repairIncidentRecordSchema },
  automaticRepairAssignment: { schema: 'ramify-agent.automatic-repair-assignment/1', body: automaticRepairAssignmentSchema },
  repairPreparation: { schema: 'ramify-agent.repair-preparation/1', body: repairPreparationSchema },
  repairDelta: { schema: 'ramify-agent.automatic-repair-delta/1', body: repairDeltaSchema },
  repairAttempt: { schema: 'ramify-agent.automatic-repair-attempt/1', body: repairAttemptSchema },
  repairExport: { schema: 'ramify-agent.repair-incident-export/1', body: repairExportPayloadSchema },
  measurement: { schema: 'ramify-agent.measurement-snapshot/1', body: measurementSnapshotSchema },
  lineEvents: { schema: 'ramify-agent.line-events/1', body: lineEventSummarySchema },
  invocation: { schema: 'ramify-agent.invocation/1', body: invocationSchema },
  outcome: { schema: 'ramify-agent.invocation-outcome/1', body: invocationOutcomeSchema },
  gate: { schema: 'ramify-agent.gate-attempt/3', body: gateAttemptSchema },
  gateAuditOutcome: { schema: 'ramify-agent.gate-audit-outcome/1', body: gateAuditOutcomeSchema },
  gateOperation: { schema: 'ramify-agent.gate-operation/2', body: gateOperationSchema },
} as const;

/** Every role a run's policy and prompt manifest must carry an entry for. */
export const roles: readonly Role[] = roleSchema.options;

// Distinct binding beside the public transcript/query usage schema.

export function runDirectory(projectRoot: string, planId: string, runId: string): string {
  return join(jobsDirectory(projectRoot, planId), runId);
}
