import { EntryAssignments, ModuleProposal, entryAssignmentsSchema, moduleProposalSchema, planRefSchema } from '../../subs/planning/src/records.js';
import { InvocationId, SessionId, interruptionEvidenceSchema, invocationOutcomeSchema, invocationSchema, invocationWorkSchema, recordRefSchema } from '../../../task-execution/src/records.js';
import { z } from 'zod';
import { join } from 'node:path';
import { citationSchema, inputManifestSchema, modulePathSchema, sha256Schema, viewIdentitySchema } from '../../../../src/interfaces/protocol/evidence.js';
import { jobIdSchema, planIdSchema } from '../../../../src/interfaces/protocol/ids.js';
import { breakpointSelectorSchema, ownershipPreflightSchema, roleSchema, runAgentSchema, type Role } from '../../../../src/interfaces/protocol/runs.js';
import { jobSchemaVersion, jobsDirectory } from '../../../../src/jobs/records.js';
import type { GateAttempt } from '../../../../src/checks/records.js';
import { planScenarioExtractionSchema } from '../../../scenarios/src/extraction.js';
import { scenarioRecordSchema } from '../../../scenarios/src/records.js';
import { nonBehavioralAcceptanceSchema } from '../../../scenarios/src/form.js';
import { documentManifestSchema } from '../../../plan-evidence/src/interfaces/contracts.js';
import { elementCatalogSchema, elementIdSchema } from '../../../plan-evidence/src/interfaces/catalog.js';
import { assessmentSchema, roundSchema } from '../../../nonfunctional/src/interfaces/contracts.js';
import { incorporationSchema } from '../../subs/planning/src/evidence-contracts.js';
import { contextSelectionSchema } from '../context-selection/contracts.js';
import { preparedCandidateSchema, nonfunctionalDeviationSchema, nonfunctionalRepairAssignmentSchema } from './nonfunctional-records.js';
import { repairIncidentRecordSchema } from '../../../../src/interfaces/protocol/repairs.js';
import { automaticRepairAssignmentSchema, repairPreparationSchema, repairDeltaSchema, repairAttemptSchema } from './repair-preparation.js';
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
export type SnapshotId = string;
/** `ses-0003`, the count of committed `session-opened` events of the run. */

const counted = (prefix: string, width: number) => (count: number): string => `${prefix}-${String(count).padStart(width, '0')}`;

export const invocationId = counted('inv', 4);
export const gateAttemptId = counted('ga', 4);
export const recoveryId = counted('rec', 4);
export const snapshotId = counted('ms', 4);
export const sessionId = counted('ses', 4);

/** A readiness attempt's directory name, `01`. */
export const readinessDirectory = (attempt: number): string => String(attempt).padStart(2, '0');

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
export const checkCommandSchema = z.object({
  argv: z.array(z.string()),
  cwd: text,
  env: z.array(z.string()),
  envAdditions: z.record(z.string(), z.string()),
  timeoutMs: z.int().positive(),
}).strict();

/** The context and compaction policy of one role. */
export const contextPolicySchema = z.object({
  compaction: z.enum(['forbidden', 'allowed']),
  budgetTokens: z.int().positive().nullable(),
  budgetFraction: z.number().positive().max(1).nullable(),
  reportReserveTokens: z.int().nonnegative(),
}).strict();

/** The review questions a run can ask of one audited iteration candidate. */
export const reviewKindSchema = z.enum(['code', 'scope', 'design']);
export type ReviewKind = z.infer<typeof reviewKindSchema>;

/** The version of the review policy and prompt contract a request is keyed by. */
export const reviewPolicyVersion = 'review-policy/1';

/**
 * How a run reviews its passing iterations: which questions, how many
 * readers beside the one writer, how many requests may wait, how many
 * retries follow an execution or validation failure, how long one attempt
 * may run, how long a work item waits for its reviews from its completion
 * request, and how many concerns one submission may carry.
 */
export const reviewPolicySchema = z.object({
  version: z.literal(reviewPolicyVersion),
  kinds: z.array(reviewKindSchema).min(1),
  concurrency: z.int().positive(),
  queue: z.int().positive(),
  retries: z.int().nonnegative(),
  attemptMs: z.int().positive(),
  settleMs: z.int().positive(),
  maxConcerns: z.int().positive(),
}).strict();
export type ReviewPolicy = z.infer<typeof reviewPolicySchema>;

/**
 * The bounds and commands a run ran under, captured in `job.json` and not
 * configurable while it runs, so that an exhaustion is reproducible.
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

export type CheckCommandRecord = z.infer<typeof checkCommandSchema>;

// The project's configuration.

/** The version a project's `ramify-agent.json` declares. */
export const projectConfigVersion = 'ramify-agent.project/1';

/** An argv the harness runs as it stands, with its first element the executable or `npm`. */
const argvSchema = z.array(text).min(1);

/** The longest a project may give one gate command: two hours. */
export const projectCommandTimeoutCeilingMs = 7_200_000;

const projectTimeout = z.int().positive().max(projectCommandTimeoutCeilingMs, {
  error: `A command timeout is at most ${projectCommandTimeoutCeilingMs} ms (two hours)`,
});

/** The formats of a type checker's output the gate reads error locations from. */
export const typeCheckOutputSchema = z.enum(['tsc']);

/** A project-relative directory inside the project: no absolute path, no drive and no `..` segment. */
const projectDirectorySchema = z.string().refine(value => {
  const normalized = value.replaceAll('\\', '/');
  return !normalized.startsWith('/') && !/^[A-Za-z]:/u.test(normalized) && !normalized.split('/').includes('..');
}, 'must be a relative directory inside the project');

/**
 * One command that prepares the project before a gate's checks run, such as
 * its build. `command` is the argv as it stands; `cwd` is relative to the
 * project root, which it defaults to; `env` is added to the environment the
 * harness builds for every command.
 */
export const setupCommandSchema = z.object({
  /** Labels the command in records and pages; `build` is shown as the build. */
  name: text.optional(),
  command: argvSchema,
  cwd: projectDirectorySchema.optional(),
  /** Positive milliseconds; ten minutes where it is not declared. */
  timeoutMs: z.int().positive().optional(),
  env: z.record(text, z.string()).optional(),
}).strict();
export type SetupCommandConfig = z.infer<typeof setupCommandSchema>;

/** An explicitly enabled existing target-project tracker, independent of the implementation worktree. */
export const beadsProjectConfigSchema = z.object({
  /** The main Git working tree, or an explicit absolute/project-relative tracker workspace. */
  workspace: z.union([
    z.literal('git-common-root'),
    z.object({ path: text }).strict(),
  ]),
  /** A command name on PATH or an absolute/project-relative executable path; `bd` when omitted. */
  executable: text.optional(),
}).strict();
export type BeadsProjectConfig = z.infer<typeof beadsProjectConfigSchema>;

/**
 * `ramify-agent.json`, the target project's configuration for the harness:
 * only what the harness cannot derive, all of it optional: the format of what
 * the type check prints, the timeouts of a standalone diagnosis's commands
 * and the setup commands it runs first, plus optional existing-issue
 * administration. The project's tests and scenarios are checks of its
 * committed audit definition, `ramify-audit.json`, and nothing here names them.
 */
export const projectConfigSchema = z.object({
  schema: z.literal(projectConfigVersion),
  /**
   * The project's type check. `output` declares the format it prints, from
   * which a failed type check is attributed by the locations of its errors;
   * without it, by which commands failed.
   */
  typeCheck: z.object({ output: typeCheckOutputSchema.optional() }).strict().optional(),
  /**
   * The timeouts of a standalone diagnosis's commands for this project, in
   * milliseconds, each replacing the harness's own: the type check and the
   * complete Ramify check. Each is bounded by `projectCommandTimeoutCeilingMs`.
   */
  timeouts: z.object({
    typeCheck: projectTimeout.optional(),
    ramifyCheck: projectTimeout.optional(),
  }).strict().optional(),
  /**
   * The project's setup commands, run in order before a standalone
   * diagnosis's checks at the project root. Readiness requires them to equal
   * the committed audit definition's workspace setup, which ramify-audit
   * runs in the worktree of every audited commit. Each carries its own
   * bound, which `timeouts` does not replace.
   */
  setup: z.array(setupCommandSchema).optional(),
  /** Isolated administrative fork sessions; omission or false disables them. */
  beads: z.union([z.literal(false), beadsProjectConfigSchema]).optional(),
}).strict();
export type ProjectConfig = z.infer<typeof projectConfigSchema>;

/**
 * The configuration as `start-run` found it, captured in `job.json`: the
 * validated file with its hash, or why there is none. An invalid or missing
 * file is not a refusal to start; readiness reports it.
 */
export const capturedProjectConfigSchema = z.union([
  z.object({ path: text, hash: sha256Schema, config: projectConfigSchema }).strict(),
  z.object({ path: text, hash: sha256Schema.nullable(), invalid: text }).strict(),
]);
export type CapturedProjectConfig = z.infer<typeof capturedProjectConfigSchema>;

/** Provider-validated committed policy, retained in the harness's own durable vocabulary. */
export const committedAuditConfigurationSchema = z.object({
  sourceCommit: text,
  path: text,
  blob: text,
  projectRoot: text,
  checks: z.array(z.unknown()),
  ignorePaths: z.array(z.string()),
  undetectedConfigFilesForcingFullAudit: z.array(z.string()),
  workspace: z.object({
    preparationId: z.literal('nodejs'),
    packageDirectoriesDeclared: z.boolean(),
    linkNodeModules: z.boolean(),
    packageDirectories: z.array(z.string()),
    setupCommands: z.array(z.object({
      name: z.string().optional(), argv: z.array(z.string()).min(1), cwd: z.string(),
      env: z.record(z.string(), z.string()), timeoutMs: z.int().positive(),
    }).strict()),
  }).strict(),
}).strict();
export type CommittedAuditConfigurationRecord = z.infer<typeof committedAuditConfigurationSchema>;

/** A committed record at one revision; `hash` is the SHA-256 of the file's bytes. */

/** `job.json` of a run. Written once, before the first event. */
export const runRecordSchema = z.object({
  schema: z.literal(jobSchemaVersion),
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
export const manualRunRecordSchema = z.object({
  schema: z.literal(jobSchemaVersion),
  jobId: jobIdSchema,
  planId: planIdSchema,
  kind: z.literal('manual'),
  createdAt: timestamp,
  /** The project's real path when the run was created. */
  projectRoot: text,
  /** The commit HEAD named when the run was created; `''` outside Git. */
  base: z.string(),
  /** The candidate branch the run's invocations work on, or null where it made none, as a session's does not. */
  branch: text.nullable(),
  /** What started it: `step run` or the `session` command. */
  origin: z.enum(['step-run', 'session']),
  policy: runPolicySchema,
}).strict();
export type ManualRunRecord = z.infer<typeof manualRunRecordSchema>;

// The prompt packages.

export const promptPackageManifestSchema = z.object({
  schema: z.literal('ramify-agent.prompt-manifest/1'),
  packages: z.partialRecord(roleSchema, z.object({
    package: text,
    hash: sha256Schema,
    files: z.array(z.object({
      path: text,
      hash: sha256Schema,
      kind: z.enum(['system', 'procedure', 'skill', 'submission-schema']),
    }).strict()),
    /** The submission union members this package offers the role. */
    submissionKinds: z.array(text),
  }).strict()),
}).strict();
export type PromptPackageManifest = z.infer<typeof promptPackageManifestSchema>;

// The initial analysis.

// Readiness and its recoveries.

/**
 * The steps readiness verifies, ending with the default configured audit
 * and `run-branch`. The historical `configured-full-audit` step identifier
 * remains readable in durable records; it does not override audit mode.
 */
export const readinessSteps = [
  'project-root', 'scratch-cleanup', 'git-clean', 'compiler-config', 'project-config', 'ramify-daemon',
  'audit-config', 'declared-packages', 'declared-preparation', 'configured-full-audit',
  'run-branch',
] as const;
export const readinessStepSchema = z.enum(readinessSteps);
export type ReadinessStep = z.infer<typeof readinessStepSchema>;

export const readinessAttemptSchema = z.object({
  schema: z.literal('ramify-agent.readiness-attempt/1'),
  /** The count of committed readiness attempts, this one included. */
  attempt: z.int().positive(),
  /** The commit readiness ran on. */
  head: z.string(),
  steps: z.array(z.object({
    step: readinessStepSchema,
    outcome: z.enum(['passed', 'failed', 'not-verified']),
    detail: z.string(),
    command: checkCommandSchema.optional(),
    gate: text.optional(),
  }).strict()),
  /** Independent nested packages found, and what each one answered. */
  nested: z.array(z.object({
    directory: z.string(),
    manifest: text,
    installed: z.boolean(),
    testScript: z.string().nullable(),
  }).strict()),
  /** Present on a configured audit request; the requested and audited sources may differ on reuse. */
  audit: z.object({
    requestedSourceCommit: text, auditedSourceCommit: text.nullable(), reused: z.boolean(),
    reportCommit: text.nullable(), runRef: text.nullable(),
  }).strict().optional(),
  verdict: z.enum(['passed', 'failed']),
  /** The recovery attempted after a failure; null when the failure was not recoverable. */
  recovery: z.string().nullable(),
}).strict();
export type ReadinessAttempt = z.infer<typeof readinessAttemptSchema>;

export const infrastructureRecoverySchema = z.object({
  schema: z.literal('ramify-agent.infrastructure-recovery/1'),
  id: text,
  subject: z.object({
    gate: text.optional(),
    readiness: z.int().positive().optional(),
    invocation: text.optional(),
  }).strict(),
  cause: z.enum(['infrastructure', 'timeout', 'daemon-unavailable']),
  action: z.enum(['restart-daemon', 'reinstall-nested', 'rerun-command', 'reconstruct-session', 'none']),
  /** Counted over committed history for this subject. */
  attempt: z.int().positive(),
  outcome: z.enum(['recovered', 'failed']),
  /** Command output file references. */
  evidence: z.array(z.string()),
}).strict();
export type InfrastructureRecovery = z.infer<typeof infrastructureRecoverySchema>;

// Measurements.

export const measurementSnapshotSchema = z.object({
  schema: z.literal('ramify-agent.measurement-snapshot/1'),
  id: text,
  /** `scope-size/1` snapshots of earlier runs stay readable; their sizes are not comparable with `scope-size/2`. */
  policy: z.enum(['scope-size/1', 'scope-size/2']),
  /** The run branch's head when it was taken. */
  head: z.string(),
  /** The captured `ramify.measure/2` document, verbatim, with its revision. */
  measure: z.union([
    z.object({ revision: z.string(), document: z.unknown(), hash: sha256Schema }).strict(),
    z.object({ unavailable: text }).strict(),
  ]),
  view: viewIdentitySchema.nullable(),
  /** Supplementary bytes outside Ramify's inventory: prompts, skills, the captured plan. */
  supplementary: z.array(z.object({ path: text, bytes: z.int().nonnegative() }).strict()),
}).strict();
export type MeasurementSnapshot = z.infer<typeof measurementSnapshotSchema>;

/**
 * One component of `S_s`, the scope size of one invocation. A component
 * whose source the snapshot does not hold is `unavailable` with its reason:
 * the total is then unavailable with its known subtotal beside it, never a
 * zero, and a proposed module's size is unknown.
 */
export const lineEventSummarySchema = z.object({
  schema: z.literal('ramify-agent.line-events/1'),
  invocation: text,
  paths: z.array(z.object({
    path: text,
    owner: modulePathSchema.nullable(),
    added: z.int().nonnegative(),
    deleted: z.int().nonnegative(),
    binary: z.boolean(),
    /** A binary file's size: git reports no lines for it and none is invented. Null for a text file. */
    bytes: z.int().nonnegative().nullable(),
  }).strict()),
  unmapped: z.object({ paths: z.int().nonnegative(), added: z.int().nonnegative(), deleted: z.int().nonnegative() }).strict(),
  coverage: z.enum(['complete', 'partial']),
  gaps: z.array(z.string()),
}).strict();
export type LineEventSummary = z.infer<typeof lineEventSummarySchema>;

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
const checkKindSchema = z.enum(['setup', 'ramify-check', 'type-check', 'configured']);

/** A rule the harness verified itself over the tree, beside the commands it ran. */
export const gateRuleSchema = z.object({
  rule: z.enum(['fake-naming', 'fake-exposure-parity', 'scratch-safety', 'write-scope']),
  outcome: z.enum(['passed', 'failed']),
  violations: z.array(z.object({ rule: text, path: text, detail: text }).strict()),
  /** What the rule could not establish, or found and did not attribute to this attempt; absent when nothing. */
  limits: z.array(text).optional(),
}).strict();

const gateAuditCountSchema = z.object({ total: z.int().nonnegative(), passed: z.int().nonnegative(), failed: z.int().nonnegative(), skipped: z.int().nonnegative() }).strict();
const gateAuditReuseSchema = z.object({
  auditedCommit: text,
  ignoredChangedPaths: z.array(z.string()),
  requestedMode: z.enum(['full', 'ramify-partial']),
  resolution: z.enum(['requested', 'defaulted']),
}).strict();

/** One project of a nested audit: its verdict, execution, failures, counts and record identities. */
const gateAuditProjectRecordSchema = z.object({
  projectRoot: text,
  verdict: z.enum(['pass', 'fail', 'indeterminate']),
  execution: z.enum(['ran', 'reused', 'not-run']),
  status: z.enum(['completed', 'failed', 'cancelled', 'refused']),
  failures: z.array(z.string()),
  requestId: text,
  auditedSourceCommit: text.nullable(),
  requestedMode: z.enum(['full', 'ramify-partial']).nullable(),
  executedMode: z.enum(['full', 'ramify-partial']).nullable(),
  fallbackReason: z.string().nullable(),
  reuse: gateAuditReuseSchema.nullable(),
  evidence: z.object({ runRef: text, reportCommit: text, treeRef: text }).strict().nullable(),
  retrievalCommands: z.array(z.string()),
  durationSeconds: z.number().nonnegative().nullable(),
  counts: z.object({ checks: gateAuditCountSchema, tests: gateAuditCountSchema.nullable(), scenarios: gateAuditCountSchema.nullable() }).strict().nullable(),
  detail: z.string(),
}).strict();

/** What nested discovery skipped, with reasons, and what it could not decide. */
const gateAuditDiscoverySchema = z.object({
  status: z.enum(['complete', 'indeterminate']),
  skipped: z.array(z.object({
    projectRoot: text, enclosingProject: text,
    reason: z.enum(['external', 'output', 'repository', 'packages', 'generated']), directory: text,
  }).strict()),
  unavailable: z.array(z.object({ enclosingProject: text, reason: z.string(), definitions: z.array(z.string()) }).strict()),
}).strict();

/** What a committing gate asked of the committed audit and what the provider answered. */
const gateAuditRecordSchema = z.object({
  requestId: text,
  mode: z.enum(['project-default', 'full']),
  status: z.enum(['completed', 'failed', 'cancelled', 'refused']),
  definition: z.object({ path: z.string(), blob: z.string() }).strict(),
  requestedSourceCommit: text,
  auditedSourceCommit: text.nullable(),
  requestedMode: z.enum(['full', 'ramify-partial']).nullable(),
  executedMode: z.enum(['full', 'ramify-partial']).nullable(),
  fallbackReason: z.string().nullable(),
  reuse: z.object({
    auditedCommit: text,
    ignoredChangedPaths: z.array(z.string()),
    requestedMode: z.enum(['full', 'ramify-partial']),
    resolution: z.enum(['requested', 'defaulted']),
  }).strict().nullable(),
  verdict: z.enum(['pass', 'fail', 'indeterminate']).nullable(),
  detail: z.string(),
  nested: z.boolean(),
  projects: z.array(gateAuditProjectRecordSchema).nullable(),
  discovery: gateAuditDiscoverySchema.nullable(),
}).strict();

export const gateAttemptSchema = z.object({
  schema: z.literal('ramify-agent.gate-attempt/3'),
  id: text,
  checkpoint: z.enum(['readiness', 'iteration', 'contract', 'breaking-iteration', 'work-item', 'final']),
  subject: z.object({ workItem: text.optional(), iteration: text.optional() }).strict(),
  proposedBy: z.string().nullable(),
  repairRound: z.int().nonnegative(),
  infrastructureAttempt: z.int().nonnegative(),
  head: z.string(),
  commit: z.string().nullable(),
  audited: z.string().nullable(),
  evidence: z.object({ runRef: text, reportCommit: text, treeRef: text }).strict().nullable(),
  /** Exact producer result and published check payload. */
  provider: z.object({ result: z.unknown(), checks: z.unknown() }).strict().optional(),
  /** A committing gate's configured audit request and the provider's answer. */
  audit: gateAuditRecordSchema.optional(),
  guardedChanges: z.array(z.object({
    path: text,
    before: z.string().nullable(),
    after: z.string().nullable(),
    authorizedBy: recordRefSchema.nullable(),
  }).strict()),
  /** Rules the harness verified itself; absent for a checkpoint that has none. */
  ownershipPreflight: ownershipPreflightSchema.optional(),
  rules: z.array(gateRuleSchema).optional(),
  commands: z.array(z.object({
    kind: checkKindSchema,
    providerCheckId: text.optional(),
    /** A setup command's declared name. */
    name: text.optional(),
    command: checkCommandSchema,
    startedAt: z.string(),
    elapsedMs: z.int().nonnegative(),
    lockWaitMs: z.int().nonnegative().optional(),
    exitCode: z.int().nullable(),
    outcome: z.enum(['passed', 'failed', 'not-verified']),
    notVerified: z.enum(['timeout', 'runner-error', 'command-missing', 'interrupted', 'setup-failed', 'local-rule-failed']).optional(),
    runnerError: z.object({ kind: z.string(), message: z.string() }).strict().nullable(),
    output: z.object({ path: z.string(), bytes: z.int().nonnegative(), truncated: z.boolean(), tail: z.string() }).strict(),
    /** How ramify-audit stopped the command's process tree, in words; absent where it did not stop it. */
    stopped: text.optional(),
    /** The command's output streams stayed open after it ended, so what it printed may be incomplete. */
    outputIncomplete: z.literal(true).optional(),
  }).strict()),
  verdict: z.enum(['passed', 'failed', 'not-verified']),
  cause: z.enum(['check-failed', 'infrastructure', 'timeout', 'guarded-change', 'unknown']).nullable(),
  next: z.enum(['accept', 'repair', 'retry-infrastructure', 'return-to-local-architect', 'exhausted']),
}).strict();

/** Exact overall result supplied by the external auditor, independent of the gate verdict. */
export const gateAuditOutcomeSchema = z.object({
  schema: z.literal('ramify-agent.gate-audit-outcome/1'),
  gate: text,
  overall: z.enum(['pass', 'fail', 'indeterminate']),
  audited: text,
}).strict();

/** The reader and the engine's own type describe one record; this keeps them so. */
const _gateAttemptsAgree: GateAttempt = undefined as unknown as z.infer<typeof gateAttemptSchema>;
void _gateAttemptsAgree;

/** Durable input for a committing gate, written before its commit and audit effect. */
export const gateOperationSchema = z.object({
  schema: z.literal('ramify-agent.gate-operation/2'),
  /** A new-policy final effect cannot outlive its exact assessed candidate. */
  finalAssessment: z.object({ assessment: text, candidate: text, tree: z.string().regex(/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/u) }).strict().optional(),
  checkpoint: z.enum(['iteration', 'contract', 'breaking-iteration', 'work-item', 'final']),
  request: z.object({
    id: text,
    runId: text,
    projectRoot: text,
    directory: text,
    head: z.string(),
    /** The mode the gate requests of the committed audit, and the bound of the request. */
    audit: z.object({ mode: z.enum(['project-default', 'full']), nested: z.boolean().optional(), timeoutMs: z.int().positive().optional() }).strict(),
    subject: z.object({ workItem: text.optional(), iteration: text.optional() }).strict(),
    proposedBy: z.string().nullable(),
    repairRound: z.int().nonnegative(),
    infrastructureAttempt: z.int().nonnegative(),
    limits: z.object({ repairRounds: z.int().positive(), infrastructureRetries: z.int().positive() }).strict(),
  }).strict(),
  guardedChanges: z.array(z.object({
    path: text, before: z.string().nullable(), after: z.string().nullable(), authorizedBy: recordRefSchema.nullable(),
  }).strict()),
  rules: z.array(gateRuleSchema),
  unauthorized: z.boolean(),
  ruleFailed: z.boolean(),
  timeoutMs: z.int().positive(),
  message: z.string(),
}).strict();
export type GateOperation = z.infer<typeof gateOperationSchema>;



// Where each record lives beneath the run's directory.

/** The absolute directory of one run, `plans/<plan-id>/.harness/jobs/<run-id>/`. */
export function runDirectory(projectRoot: string, planId: string, runId: string): string {
  return join(jobsDirectory(projectRoot, planId), runId);
}

/**
 * Every path of the run layout. The record paths are relative to the run's
 * directory, which is the ledger's records root, so a path that would leave
 * it is refused before anything is written.
 */
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
  scenario: (id: string): string => join('scenarios', `${id}.json`),
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
  catalog: { schema: 'ramify-agent.element-catalog/1', body: elementCatalogSchema },
  incorporation: { schema: 'ramify-agent.document-incorporation/2', body: incorporationSchema },
  selection: { schema: 'ramify-agent.context-selection/2', body: contextSelectionSchema },
  preparedCandidate: { schema: 'ramify-agent.prepared-candidate/1', body: preparedCandidateSchema },
  assessment: { schema: 'ramify-agent.nonfunctional-assessment/1', body: assessmentSchema },
  nonfunctionalRound: { schema: 'ramify-agent.nonfunctional-round/1', body: roundSchema },
  nonfunctionalRepairAssignment: { schema: 'ramify-agent.nonfunctional-repair-assignment/1', body: nonfunctionalRepairAssignmentSchema },
  nonfunctionalDeviation: { schema: 'ramify-agent.nonfunctional-deviation/1', body: nonfunctionalDeviationSchema },
  promptManifest: { schema: 'ramify-agent.prompt-manifest/1', body: promptPackageManifestSchema },
  entries: { schema: 'ramify-agent.entry-assignments/1', body: entryAssignmentsSchema },
  scenario: { schema: 'ramify-agent.scenario/1', body: scenarioRecordSchema },
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
