import { recordHash, refOf } from '../../../../src/jobs/committed-reader.js';
import type { CapabilityInput } from '../../subs/work-coordination/src/capability/ledger.js';
import type { CapabilityVerification, CapabilityHandbackBasis } from '../../subs/work-coordination/src/coordination.js';
import { viewIdentityOf as projectViewIdentity } from './project-facts.js';

import type { ParentSession, CompletionBasis, Reconciled, ReconciliationOwner, BriefAppend } from './completion.js';
import { writeOnce, readIfExists } from './artifacts.js';
import { rootModuleOf, failedWithoutResult } from '../../subs/work-coordination/src/context.js';
import { WorkCoordination, type CoordinationObservation, type CoordinationEffect, type ClosedIterationOutcome, type IterationOutcome } from '../../subs/work-coordination/src/coordination.js';
import type { RunWrite } from './log.js';
import { coordinationHistory } from './coordination-history.js';
import { performInitialAnalysis } from '../../subs/planning/src/planning.js';
import { planPointer, capturedPlanBlock } from '../../subs/planning/src/messages.js';
import { readVerifiedTextBlobBytes, verifiedCandidateSource } from '../../../evidence/src/git-text.js';
import { checkExecutionObstruction } from './recovery-checks.js';
import { observeExternalCandidate } from './candidate-attribution.js';
import { recordedExternalChanges } from './recovery-gate.js';
import { decideTaskReentry, mayRetryTask, taskInterruption, taskRetryDelay } from '../../../recovery/src/reentry.js';

import { automaticRepairAssignmentSchema, repairPreparationSchema, repairDeltaSchema, repairAttemptSchema, captureRepairFiles, captureRepairSource, repairChanges, declarationPaths, unchangedRepairPaths, type AutomaticRepairAssignment, type RepairPreparation, type RepairDelta } from './repair-preparation.js';
import { repairIncidentRecordSchema, repairResultSchema, type RepairIncidentRecord } from '../../../../src/interfaces/protocol/repairs.js';
import { repairIncidentId } from './repair-records.js';
import { type RepairResult, type RepairIncidentStage } from '../../../../src/interfaces/protocol/repairs.js';
import { createRepairExportPayload, exportRepairIncident, repairExportPayloadPath, repairExternalRef, repairProjectKey, type RepairExportConfiguration } from './repair-export.js';
import { verifiedRepairDeltas } from './repair-gate.js';
import { checkpointPolicies } from '../../../../src/checks/checkpoint.js';

import { OwnershipUnavailableError } from '../../../evidence/src/ownership-evidence.js';
import { OwnershipAuthorityError, ownershipAuthorityFor } from '../../../../src/work/ownership-authority.js';
import { engineerConsultationInputs } from '../../../../src/consultations/targets.js';
import { boundedNonfunctionalTools, nonfunctionalSourceAllows } from '../nonfunctional/submissions.js';

import { startingPointsSection, type StartingPointGroup } from '../../subs/work-coordination/src/work/starting-inputs.js';
import type { ProvisionalSourceGit } from '../../../evidence/src/provisional-git.js';
import { restartWorkflowEntries, readRestartImport, type RestartImport } from './restart-import.js';
import { runCommand, type CommandRunner } from '../../../evidence/src/run-command.js';
import { z } from 'zod';
import { finalCorrectionSchema, type FinalCorrection } from './final-correction.js';
import { compactionReviewSchema } from './compaction-review.js';
import { lstat, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, posix, relative, resolve } from 'node:path';
import type { AgentPort, AgentSession, JsonSchema, SessionSpec, SessionStart, ToolDefinition } from '../../../agent/src/interfaces/port.js';
import { gitCandidateSource, gitChangeHistory, gitService, type CandidateSource, type ChangeHistory, type GitService } from '../../../evidence/src/git.js';
import type { RamifyCli } from '../../../evidence/src/ramify-cli.js';

import { type ArchitectIndex } from '../../../evidence/src/views.js';
import type { GateAttempt } from '../../../../src/checks/records.js';
import { acceptedCommit } from '../../../../src/checks/accepted.js';
import type { ConfiguredAuditPort } from '../../../audit/src/check-execution.js';
import type { PreparedGate } from '../../../../src/checks/gate.js';

import { decideWrite } from '../../../../src/guard/write-guard.js';

import { selectCheckFindings } from '../../../check-findings/src/queries.js';
import { decideCheckFindingChange } from '../../../check-findings/src/decide.js';
import type { CheckFindingCommand, CheckFindingId, CheckFindingQueryInput, CheckFindingSelection, CheckFindingState, CheckFindingSummary } from '../../../check-findings/src/interfaces/check-findings.js';
import type { CheckFindingCause } from '../../../../src/check-findings/records.js';
import { checkFindingStateOf } from '../../../../src/check-findings/state.js';
import { commitCheckFindingChange, decideCheckFindingTransaction, type CheckFindingBuild, type CheckFindingCommit } from '../../../../src/check-findings/transition.js';
import { attentionAt, basisChange, briefText as reconciliationBrief, needsLaterRound, reconciliationAssessmentSchema, reconciliationBasisSchema, reconciliationId, reconciliationLayout, validateReconciliation, type BasisRequest, type ReconciliationAssessment, type ReconciliationBasis, type UnresolvedReason } from '../../../../src/reviews/reconciliation.js';
import { reconciliationJsonSchema, reconciliationSubmissionDescription, reconciliationToolName, type AttentionEntry, type BoundReconciliation, type ReconciliationSubmission } from '../../../reviews/src/reconciliation.js';
import { reconciliationMessage, type ReconciliationPacket } from '../../../../src/reviews/reconciliation-message.js';
import { type PacketRequest } from '../../../reviews/src/reconciliation-message.js';
import { outsideScope } from '../../../../src/run/mutations.js';

import { capabilityHandbackGuidance, capabilityRecordSection, capabilitySourceSection, capabilityViewInputs } from '../../subs/work-coordination/src/capability/delivery.js';
import { capabilityLayout, type CapabilityRequest, type CapabilityTask, type CapabilityPlan } from '../../subs/work-coordination/src/capability/records.js';
import { capabilityRunPolicyVersion, supportedCapabilityPolicy } from '../../subs/work-coordination/src/capability/policy.js';
import { createCapabilityWorkflow } from '../../subs/work-coordination/src/capability/workflow.js';
import { commitCapabilityTransition } from './capability-transition.js';
import { type CapabilityAction } from '../../subs/work-coordination/src/capability/submission.js';
import { capabilityCompletionBlockers, replayCapabilityState } from '../../subs/work-coordination/src/capability/state.js';
import type { CapabilityWorkflow } from '../../subs/work-coordination/src/capability/workflow.js';
import { userCheckFindingChange, userRejectionCode } from '../../../../src/check-findings/user-commands.js';
import type { CheckFindingUserCommand } from '../../../../src/interfaces/protocol/check-findings.js';
import { canonicalJson } from '../../../../src/jobs/commands.js';
import { reviewAttemptId, reviewAttemptSchema, reviewLayout, reviewOrientationSchema, reviewRequestSchema, type ForkPoint, type NotVerifiedReason, type ReviewAttempt, type ReviewOrientation, type ReviewRequest, type ReviewResult } from '../../../../src/reviews/records.js';
import { reviewSubmissionSchema, type OrientationSubmission, type ReviewSubmission } from '../../../reviews/src/interfaces/submissions.js';
import type { CapturedInput } from '../../../reviews/src/inputs.js';
import { prepareReview, type PreparedReview } from '../../../reviews/src/preparation.js';
import { ReviewQueue } from '../../../reviews/src/scheduler.js';
import { verifySnapshotEvidence, openCandidateSnapshot, resolveSnapshotPath, snapshotTools, type CandidateSnapshot, type SnapshotComparison, type SnapshotTools } from '../../../reviews/src/snapshot.js';
import { reviewCoverage, reviewStateOf, unsettledRequests, type ReviewCoverage } from '../../../../src/reviews/state.js';
import { orientationToolName } from '../../../reviews/src/submission.js';
import type { AcceptedCommand, Receipt } from '../../../../src/interfaces/protocol/jobs.js';
import type { ViewIdentity } from '../../../../src/interfaces/protocol/evidence.js';
import { roleDisplayName, breakpointSelectorSchema, type BreakpointState, type DebugExchange, type DebugInspection, type FailureAnalysis, type Role, type RunCommand, type RunFailureReason } from '../../../../src/interfaces/protocol/runs.js';
import { CommandLedger, CommandRejection } from '../../../../src/jobs/commands.js';
import { commitRecord, readCommitted, recoverCommits, type RecordRef as CommitRecord } from '../../../../src/jobs/commit.js';
import { Mutex, PriorityMutex } from '../../../../src/jobs/mutex.js';
import { declaredSchemaOf, jobSchemaVersion, listJobDirectories, newJobId, planStateDirectory } from '../../../../src/jobs/records.js';
import { ensureStateDirectory } from '../../../../src/store/state-directory.js';
import { planPath, readPlan } from '../../../../src/plans/discover.js';
import { discoverDocuments } from '../../../plan-evidence/src/discovery.js';
import { verifyDocumentBytes } from '../../../plan-evidence/src/interfaces/contracts.js';
import { elementIdSchema, type ElementCatalog } from '../../../plan-evidence/src/interfaces/catalog.js';
import { checkToolName, intakeToolName, principleToolName } from '../../subs/planning/src/extraction.js';

import { readAcceptedEvidence, acceptedAnalysisReferences } from '../../subs/planning/src/evidence.js';
import { assessmentSchema, roundSchema, type Assessment, type Candidate } from '../../../nonfunctional/src/interfaces/contracts.js';
import { decideNonfunctionalRound, type RoundDecision } from '../../../nonfunctional/src/rounds.js';
import { replayNonfunctionalPhase } from './nonfunctional-phase.js';
import { preparedCandidateSchema, nonfunctionalDeviationSchema, nonfunctionalRepairAssignmentSchema } from './nonfunctional-records.js';
import { assessedElements, bindCoordinatorAssessment, coordinatorAssessmentJsonSchema, coordinatorAssessmentToolName, coordinatorActionJsonSchema, coordinatorActionToolName, coordinatorInvestigationJsonSchema, coordinatorInvestigationToolName, coordinatorActionSchema, nonfunctionalRepairJsonSchema, nonfunctionalRepairToolName, validateCoordinatorAction, validateCoordinatorInvestigation, nonfunctionalRepairSubmissionSchema, type CoordinatorAssessmentSubmission, type CoordinatorAction, type CoordinatorInvestigation, type NonfunctionalRepairSubmission } from '../nonfunctional/submissions.js';
import { coordinatorAssessmentPrompt, coordinatorActionPrompt, repairPrompt } from '../nonfunctional/prompts.js';

import { workOrientationToolName } from '../../subs/work-coordination/src/context-selection/submissions.js';
import { documentChanges, readCapturedDocuments } from './document-inputs.js';
import { compatibleAuditRepair, type RecoveryRuntime } from './recovery-admission.js';
import { commitReadinessRepair, readinessRepairOperationPath, readinessRepairOperationSchema } from './readiness-commit.js';
import { operationRecoverySchema, type OperationRecovery, type RecoveryBoundary } from './records.js';
import { recoveryInspectionSchema, restartInspectionSchema, type RestartInspection, type RecoveryInspection } from '../../../../src/interfaces/protocol/runs.js';
import type { InterruptionEvidence } from '../../../agent/src/interfaces/port.js';
import { composeTaskBrief } from './task-brief.js';
import { constructEngineerStep, engineerStepInputsOf, type ConstructedEngineerStep } from '../../../../src/steps/engineer.js';
import { committedBody, invocationRecord, InvocationRunner, type InvocationRequest, type LiveInvocation, type RunnerHost, type RunnerRun } from '../../../../src/steps/runner.js';
import { finished, kept, type InvocationResult, type SessionKeeping } from '../../../task-execution/src/results.js';

import { stepInputsSchemaId, validateReviewInputs, type EngineerStepInputs } from '../../../../src/steps/inputs.js';

import { type ConstructedWorkTurnStep } from '../../../../src/steps/local-architect.js';
import { constructDesignOrientationStep, constructReviewStep } from '../../../../src/steps/reviewer.js';
import { loadPromptPackages, renderFailureAnalystPrompt, renderGlobalForkPrompt, renderReconciliationPrompt, sha256, renderNonfunctionalCoordinatorPrompt, renderNonfunctionalRepairPrompt, type LoadedPackage } from '../../../../src/prompts/packages.js';

import { captureSnapshot, revisionMismatch, rootModuleOfSnapshot } from '../../../kpi/src/capture.js';
import { supportDocument, readScopeMeasurement, writeScopeMeasurement } from '../../../../src/measurement/inputs.js';
import { cachedChangeHistory } from '../../../kpi/src/delivered.js';
import { lineEvents, takeLineSnapshot, type LineSnapshot } from '../../../kpi/src/lines.js';
import { writeFileAtomic } from '../../../ledger/src/atomic.js';

import { globalContext } from '../../subs/work-coordination/src/architecture/context.js';

import { isPlanDeviation, nextCheckFinding } from '../deviations/finding.js';
import { nonfunctionalDeviationCommands, nonfunctionalDeviationHash, prepareNonfunctionalDeviation } from '../deviations/nonfunctional.js';

import type { StandIn } from '../../subs/work-coordination/src/contracts/parity.js';
import { contractsLayout, obligationId, type ConsumerRequirement } from '../../subs/work-coordination/src/contracts/records.js';
import { conformanceKey, verificationKey } from '../../subs/work-coordination/src/contracts/schedule.js';

import { type EstablishedContract } from '../../subs/work-coordination/src/contracts/submission.js';
import { remainingInjections } from '../../subs/work-coordination/src/contracts/verification.js';

import { assignedFeaturePaths } from '../../subs/work-coordination/src/work/feature-selection.js';

import { type ShellCallRecord } from '../../subs/work-coordination/src/work/engineer-equipment.js';
import { type EquipContext, type Equipment } from '../../../task-execution/src/equipment.js';
import { nonfunctionalEquipment } from '../nonfunctional/equipment.js';
import { engineerWorkingDirectory, repairWorkingDirectory } from '../../subs/work-coordination/src/work/engineer-directory.js';

import { engineerSubmissionSchema, iterationAcceptance, type AssignedObligation, validateEngineerWithOwnership, type EngineerSubmission, type IterationApiViews } from '../../subs/work-coordination/src/work/engineer.js';
import { iterationAssignmentSchema, iterationLayout, type FailureDigest, type IterationAssignment, type IterationResult } from '../../subs/work-coordination/src/work/iterations.js';
import { type WriteScope } from '../../../../src/work/scope.js';
import { digestLines, failureAnalysisJsonSchema, failureAnalysisMessage, failureAnalysisSubmissionDescription, failureAnalysisToolName, failureDigest, renderTranscript, validateFailureAnalysis, type AnalysisEvidence as FailureEvidence, type DigestShellCall, type FailureAnalysisSubmission } from '../../subs/work-coordination/src/work/failure.js';
import { isContained } from '../../../../src/guard/resolve-contained-path.js';
import { scopeConfigurationPaths, captureGuardedFiles, deniedFiles, guardedScopeOf, protectedScopeOf, resolveWriteScope } from '../../../../src/work/scope.js';
import { committedRecords } from './committed-records.js';

import { workLayout, workItemId, workItemSchema, type WorkItem } from '../../subs/work-coordination/src/work/records.js';
import { prepareAssignedCucumber, iterationApiViews, type ReconciliationBriefing } from '../../subs/work-coordination/src/work/session.js';

import { gateDiagnostics, type GateAudience } from '../../../../src/checks/diagnostics.js';
import { scenarioResultsOf, type ScenarioResult } from '../../../../src/checks/scenario-results.js';
import { concernBindings, finishReview, requestedStartOf, reviewOutcome, sameWorkItem } from './review-finish.js';
import { type ConcernBinding } from '../../../reviews/src/concern-binding.js';
import { AfterHandling, type HandlingHost } from './after-handling.js';
import { requiredArtifacts } from '../../subs/work-coordination/src/work/publication.js';
import { capabilityBlockersOf, obligationProjection, pendingCorrection, verifiedRequirements } from '../../subs/work-coordination/src/work/history.js';
import { CandidateDriftError, CandidateReassessmentRequired, CommittingGates, readinessAuditOutcome, writeScopePaths, type GateHost } from './committing-gate.js';
import { capturePlan, EvidenceUnavailableError, type RunInputs } from './inputs.js';
import { extractPlanScenarios } from '../../../scenarios/src/extraction.js';
import type { RenderedFeatureFile } from '../../../scenarios/src/rendering.js';
import { RunLog, type RunEvent, type RunEventInput, type RunEventOf } from './log.js';
import { ObservationLog } from '../../../task-execution/src/observations.js';

import { contextPolicyOf, defaultContextPolicies, defaultRunPolicy, engineerBoundsOf, withProjectTimeouts, type EngineerBounds } from '../../../../src/run/policy.js';
import { captureProjectConfig, resolveBeadsProjectConfig } from '../../../../src/run/project-config.js';
import { BeadsSessions } from '../../../../src/run/beads-sessions.js';
import { commitForMaterialization, contentHash as featureContentHash, expectedFeatureFiles, expectedFeatureHashes, materializationMessage, rerenderFeatureFiles, incompleteScenarios, trackedScenarios } from './feature-files.js';

import { briefed, type EngineerScenarios } from '../../subs/work-coordination/src/work/scenario-briefing.js';
import { failingStep, performRecovery, readinessFailureReason, recoveryFor, runReadiness, withRecovery } from './readiness.js';
import { declaredModuleDirectories } from '../../../../src/run/project-config.js';

import { assertScratchSafe, ensureScratchRule, scratchSafetyRule, ScratchIgnoreConflictError } from '../../subs/work-coordination/src/work/scratch.js';
import { gateAttemptId, gateAttemptSchema, lineEventSummarySchema, measurementSnapshotSchema, readinessAttemptSchema, recoveryId, runDirectory, runLayout, runRecordSchema, runSchemas, snapshotId, type GateOperation, type LineEventSummary, type MeasurementSnapshot, type RunPolicy, type RunRecord } from './records.js';
import { invocationOutcomeSchema, type Invocation, type InvocationOutcome, type DurableRecordRef as RecordRef, type ArchitectRef, type ContinueReason, type ContinueRelation, type DegradeRelation, type ForkRelation, type SessionFinishReason, type SessionId } from '../../../task-execution/src/records.js';
import { type RunSessions } from './sessions.js';
import { runSnapshot, type RunSnapshot } from './snapshot.js';
import { InvocationTranscript, recordAppend } from '../../../task-execution/src/transcripts/recorder.js';
import { ContentStore } from '../../../task-execution/src/transcripts/store.js';
import { readBody, readTranscript, TranscriptWriter } from '../../../task-execution/src/transcripts/writer.js';
import { validateAgainst } from '../../../task-execution/src/submissions.js';
import { nodeProcessGroups, WriterBlockedError, WriterOwnership, type ProcessGroups, type TreeObserver } from '../../../task-execution/src/writer.js';
import { HarnessSessionOperations } from '../../../../src/prompts/session-adapter.js';
import { readSessionPointReference, type HarnessTaskBrief } from '../../../task-execution/src/session-operations.js';
import { deliveredSupportPaths, type TaskKind } from '../../../../src/prompts/tasks.js';
import { processGroupIdentity } from '../../../evidence/src/run-command.js';

/*
 * The implementation runs of one project: their commands, their lifecycle,
 * their recovery and the queries that read them.
 *
 * The run's `events.jsonl` is its only authority. Every transition is one
 * flushed append that carries the bodies of every record it commits, and the
 * record files beneath the run are materialized copies of it. An event that
 * licenses an agent is appended before the agent starts; the event that
 * closes work is the last write of that work.
 *
 * This iteration invokes exactly one role, the plan architect, then
 * verifies readiness and the final composition. Work items, iterations and
 * writers arrive with the iterations that build them; the writer's ownership
 * and settlement are here already, because no gate may run against a tree
 * something might still be writing.
 */

/** One durable boundary a test can freeze the run at, as a crash would. */
export interface RunServiceOptions {
  /** External command execution. Tests script outcomes; actual process tests use the default. */
  readonly commandExecution?: CommandRunner | undefined;
  readonly projectRoot: string;
  readonly repairIncidentExport?: RepairExportConfiguration | undefined;
  /** The project lock, held for as long as the service runs. */
  readonly lock: { readonly held: () => Promise<boolean> };
  /** Parent composition releases ownership only after every producer has settled. */
  readonly onQuiescentClose: () => Promise<void>;
  /** The agent that runs the run's sessions. Without one, a start is refused as unavailable. */
  readonly agent?: AgentPort | undefined;
  /** The model the agent was asked to run, recorded with each session; without one, the agent chose its own. */
  readonly model?: string | undefined;
  /** The evidence side of a run: its manifest, the view its analysis is checked against, and its inputs. */
  readonly inputs: RunInputs;
  /** The Ramify command line the run's readiness and measurements use. */
  readonly ramify: RamifyCli;
  /** External Git operations. Lifecycle tests supply scripted answers, like their agent port. */
  readonly git?: GitService | undefined;
  /** Where a review reads its frozen candidate from: Git's objects by default; tests script it like Git. */
  readonly candidates?: CandidateSource | undefined;
  /** The history a run's delivered change is read from: Git's objects by default, its answers kept; tests script it like Git. */
  readonly changeHistory?: ChangeHistory | undefined;
  /** External index/blob reads for provisional capability snapshots. */
  readonly provisionalSourceGit?: ProvisionalSourceGit | undefined;
  /**
   * The provider's committed audit: its configuration, read at a commit, and
   * the configured audit every committing gate and readiness request.
   */
  readonly configuredAudit: ConfiguredAuditPort;
  /** The policy the run captures. Without one it is the hardcoded default over this project. */
  readonly policy?: ((projectRoot: string) => RunPolicy) | undefined;
  /** The module the baseline is frozen over; the architect view's root by default. */
  readonly rootModule?: string | undefined;
  /** How long a stop waits for the session before the run is marked stopped anyway. */
  readonly stopGraceMs?: number | undefined;
  /** The skill directory of the prompt packages, for a test that supplies its own. */
  readonly skillDirectory?: string | undefined;
  /** The operating system, as writer settlement uses it. */
  readonly groups?: ProcessGroups | undefined;
  /** Called after each durable write; tests freeze a run there, as a crash would. */
  readonly afterWrite?: ((write: RunWrite, runId: string) => Promise<void>) | undefined;
  /** The wall clock. Tests control it at invocation boundaries. */
  readonly now?: (() => Date) | undefined;
  /** Legacy adapter option, ignored: task continuation does not authenticate runtime hashes. */
  readonly recoveryRuntime?: (() => Promise<RecoveryRuntime>) | undefined;
  /** Settled producer evidence independent of a source commit acknowledgement. */
  readonly auditSettlement?: ((sourceRun: string, gate: string, commit: string) => Promise<{ confirmed: boolean; evidence: string[] }>) | undefined;
  readonly warn?: ((message: string) => void) | undefined;
}

/** What a recovery did with each run it found without a terminal event. */
export interface RunRecoveryReport {
  readonly interrupted: string[];
  /** Runs whose record files were missing or differed from the log, and were rewritten. */
  readonly rematerialized: string[];
  /** External effects whose intent had no completion, performed again under their key. */
  readonly effects: string[];
  /** Invocations whose start had no end: closed as interrupted, with no agent call. */
  readonly invocations: string[];
  /** Run directories that could not be loaded and are not served. */
  readonly skipped: string[];
  /** Review requests an accepted iteration was owed and recovery recorded, and attempts it finished as not verified. */
  readonly reviews: string[];
  /** Manual runs, which `step run` and `session` write: neither executed nor recovered, and left exactly as they are. */
  readonly manual: string[];
}

const key = (planId: string, runId: string) => `${planId}/${runId}`;

/** The reconciliation rounds of a run whose policy predates them. */

/**
 * The module architect's own session while its work item reconciles: the
 * harness's session and the executor's latest point, which a brief append
 * moves, and the rounds whose brief did not land, which its next input carries.
 */
/** An assessment whose basis no longer held when it was to be committed; nothing was appended. */
class AssessmentRefusedError extends Error {}

/**
 * What one iteration ended with: the result that closed it, and the need it
 * reported where the behavior it required is owned outside its scope.
 */
/** What one contract iteration ended with: its result, and what its registration found. */
class ScratchSetupRefusal extends Error {
  constructor(detail: string) {
    super(detail);
    this.name = 'ScratchSetupRefusal';
  }
}

class Run implements RunnerRun {
  restartImport: RestartImport | undefined;
  recoveryPause: OperationRecovery | undefined;
  recoveryRestart = false;
  startupRecovery = false;
  recoveryReviewRelease: (() => void) | undefined;
  readonly recoveryReviewPipelines = new Set<string>();
  restoring = false;
  readonly restoredInvocations = new Set<string>();
  /** Only invocations preceding this driver admission belong to its restoration inventory. */
  restorationSequence: number | undefined;
  readonly mutex = new Mutex();
  /**
   * Serializes the start of invocations: each one's identifier and its
   * session's are counted from the log, so two starts must not count the
   * same prefix. Nothing slow runs under it. A writer's start waiting here
   * goes before every reader's: the writer has scheduling priority.
   */
  readonly starting = new PriorityMutex();
  /** Every invocation the run has open, by ID: at most one writer, and the readers beside it. */
  readonly live = new Map<string, LiveInvocation>();
  stopRequested: boolean;
  /** The prepared request remains on its driver stack; no invocation or writer exists yet. */
  debugPause: BreakpointState | undefined;
  debugPrepared: {
    inspect(): Promise<DebugInspection['input']>;
    exchange(text: string): Promise<InvocationResult<unknown>>;
    resume(text: string | undefined): void;
    held(): boolean;
  } | undefined;
  /** Settles when the run's driver has nothing left to do. */
  done: Promise<void> = Promise.resolve();
  /** The run's review readers, once it reviews; undefined for a run whose policy requests none. */
  reviews: ReviewQueue | undefined;
  /** Patch preparation belongs to its review request and stops with its readers. */
  readonly reviewPreparations = new Map<string, AbortController>();
  /** Why the run stopped its readers, which a reader stopped for it records as its attempt's reason. */
  readerStop: NotVerifiedReason | undefined;
  /** The design orientations being made, by key, so that two attempts of one key make it once. */
  readonly orienting = new Map<string, Promise<ReviewOrientation>>();
  /** The commit-and-audit effect in flight, which the run's terminal event waits for. */
  gating: Promise<unknown> | undefined;
  /** Owned readiness work: stopping aborts it and awaits process settlement before a terminal event. */
  readiness: { controller: AbortController; settled: Promise<void> } | undefined;
  /** The writer of the run; one at a time, and the log says which. */
  readonly writer: WriterOwnership;
  index: ArchitectIndex | null = null;
  /** Wakes a driver waiting at the review stop, to read the log again. */
  private readonly wake = new Set<() => void>();
  /** The content store the run's transcripts name their large bodies in. */
  readonly store: ContentStore;
  /** One transcript writer per session, so each session's entries keep one order. */

  constructor(
    readonly record: RunRecord,
    readonly directory: string,
    public log: RunLog,
    readonly base: string,
    writer: WriterOwnership,
  ) {
    this.writer = writer;
    this.stopRequested = log.find('stop-requested') !== undefined;
    this.store = new ContentStore(join(directory, runLayout.blobs));
  }

  get key(): string {
    return key(this.record.planId, this.record.jobId);
  }

  get jobId(): string { return this.record.jobId; }
  get planId(): string { return this.record.planId; }
  get createdAt(): string { return this.record.createdAt; }
  effectivePolicy?: RunPolicy;
  get policy(): RunRecord['policy'] { return this.effectivePolicy ?? this.record.policy; }
  get baselineMeasurement(): RecordRef | null { return 'measurement' in this.record.baseline ? this.record.baseline.measurement : null; }

  /** The sessions of every open invocation, the writer's and the readers'. */
  sessions(filter: (live: LiveInvocation) => boolean = () => true): AgentSession[] {
    return [...this.live.values()].filter(filter).flatMap(live => (live.session === undefined ? [] : [live.session]));
  }

  /** Settles once the driver, every open invocation and every review attempt have finished. */
  async idle(): Promise<void> {
    await this.done;
    await this.reviews?.settled();
    while (this.live.size > 0) await Promise.all([...this.live.values()].map(live => live.done));
  }

  /** Settles at the next `notify`: an approval, a stop or the service closing. */
  changed(signal?: AbortSignal): Promise<void> {
    return new Promise(resolve => {
      const done = () => { this.wake.delete(done); signal?.removeEventListener('abort', done); resolve(); };
      if (signal?.aborted) { resolve(); return; }
      this.wake.add(done); signal?.addEventListener('abort', done, { once: true });
    });
  }

  notify(): void {
    const wakes = [...this.wake];
    this.wake.clear();
    for (const wake of wakes) wake();
  }

  /** An absolute path beneath the run's directory, from a layout path. */
  path(relative: string): string {
    return join(this.directory, relative);
  }
}

export class AutonomousRunService {
  private readonly runs = new Map<string, Run>();
  /** Claims are rebuilt only from committed successor initialization events. */
  private readonly restartUnavailable = new Map<string, string>();
  private readonly restartClaims = new Map<string, { readonly jobId: string; readonly sourceDigest: string }>();
  /**
   * Write scopes captured while an assignment was judged, by the accepted
   * body they were captured for, so the assignment applies the scope its
   * submission was accepted with instead of capturing it a second time.
   */
  private readonly coordinators = new WeakMap<Run, WorkCoordination>();
  private readonly commands = new CommandLedger();
  private readonly commandMutex = new Mutex();
  private sessionOperations: Promise<HarnessSessionOperations> | undefined;
  /** Administration has its own durable queue and authority, independent of run termination. */
  private beadsSessions: Promise<BeadsSessions> | undefined;
  private closed = false;
  private closing: Promise<void> | undefined;

  private readonly repairIncidentExport: RepairExportConfiguration | undefined;
  private readonly git: GitService;
  private readonly candidates: CandidateSource;
  /** What the run queries read each run's delivered change from. */
  readonly changeHistory: ChangeHistory;
  get candidateSource(): CandidateSource { return this.candidates; }

  private constructor(private readonly options: RunServiceOptions, private readonly workflow: CapabilityWorkflow | null) {
    this.repairIncidentExport = options.repairIncidentExport === undefined ? undefined : { ...options.repairIncidentExport };
    this.git = options.git ?? gitService;
    this.candidates = verifiedCandidateSource(options.candidates ?? gitCandidateSource);
    this.changeHistory = options.changeHistory ?? cachedChangeHistory(gitChangeHistory);
    this.runner = new InvocationRunner<Run>(this.runnerHost());
    this.gates = new CommittingGates<Run>(this.gateHost());
    this.handling = new AfterHandling<Run>(this.handlingHost());
  }

  /** The handling after an accepted submission, which a manual run's `after` shares. */
  private readonly handling: AfterHandling<Run>;

  /** What the after-handling asks of an implementation run. */
  private coordination(run: Run): WorkCoordination {
    const present = this.coordinators.get(run);
    if (present !== undefined) return present;
    let cached: CoordinationObservation | undefined;
    let index: ArchitectIndex | null | undefined;
    let policy: RunPolicy | undefined;
    const observe = (): CoordinationObservation => {
      const version = run.log.version;
      if (cached !== undefined && cached.version === version && index === run.index && policy === run.policy && cached.restoring === run.restoring && cached.restarted === (run.restartImport !== undefined)) return cached;
      index = run.index; policy = run.policy;
      const lines = run.log.ledger.replay();
      const history = { lines, events: run.log.events };
      cached = Object.freeze({ version, history, records: committedRecords(lines), index: structuredClone(run.index), policy: structuredClone(run.policy),
        restoring: run.restoring, restarted: run.restartImport !== undefined, findings: checkFindingStateOf(run.log.ledger),
        pendingEffects: run.log.ledger.pendingEffects().map(effect => effect.key) });
      return cached;
    };
    const coordinator = new WorkCoordination({ projectRoot: this.projectRoot, directory: run.directory, base: run.base,
      record: structuredClone({ jobId: run.record.jobId, planId: run.record.planId, baseline: run.record.baseline, manifest: run.record.manifest, auditConfiguration: run.record.auditConfiguration, projectConfig: run.record.projectConfig }),
      workflow: this.workflow?.version ?? null, options: { ramify: this.options.ramify, rootModule: this.options.rootModule, commandExecution: this.options.commandExecution, provisionalSourceGit: this.options.provisionalSourceGit },
      git: this.git, candidates: this.candidates,
    }, {
      commitFinding: (build, at) => commitCheckFindingChange(run, ({ log, state }) => build({ history: coordinationHistory(log), state }), at),
      observe, notify: () => run.notify(), changed: () => run.changed(), wakeReviews: () => run.reviews?.wake(),
      sessionState: session => this.sessionsOf(run)?.get(session)?.state,
      hasSessionPoint: async (agent, runId, point) => (await this.operations(agent)).hasPoint(runId, point),
      appendSession: async (agent, ...args) => (await this.operations(agent)).append(...args),
      recordAppend: (session, note, sequence) => recordAppend(this.transcriptOf(run, session), note, sequence),
      commitCapability: (input, records, qualification) => run.mutex.run(async () => {
        if (input.type === 'capability-handed-back' && qualification === undefined) throw new Error('Capability handback requires its exact accepted completion basis');
        if (qualification !== undefined) await this.validateHandbackBasis(run, input, qualification);
        return commitCapabilityTransition(run.log, input, records);
      }),
      effect: <T>(spec: CoordinationEffect<T>) => {
        const transaction = (value: { readonly event: RunEventInput; readonly records: readonly import('../../../ledger/src/ledger.js').RecordBody[] }) => ({ event: run.log.next(value.event), records: value.records });
        const intent = spec.intent;
        const apply = () => run.log.ledger.effect<T>({ key: spec.key,
          intent: typeof intent === 'function' ? () => transaction(intent()) : transaction(intent),
          perform: spec.perform, complete: result => transaction(spec.complete(result)),
          ...(spec.serialization === 'records' ? { serialize: <R>(work: () => Promise<R>) => run.mutex.run(work) } : {}),
        });
        return spec.serialization === 'whole' ? run.mutex.run(apply) : apply();
      },
      writer: { requireSettled: reason => run.writer.requireSettled(reason), register: (invocation, pid) => run.writer.register(invocation, pid), blocked: () => run.writer.blocked, unsettled: () => run.writer.isUnsettled },
      afterWrite: (...args) => this.afterWrite(...args),
      automaticProjectRepair: (...args) => this.automaticProjectRepair(run, ...args),
      committedBody: (...args) => this.committedBody(run, ...args),
      completeWorkItem: (...args) => this.completeWorkItem(run, ...args),
      contractGate: (...args) => this.contractGate(run, ...args),
      diagnosticsOf: (...args) => this.diagnosticsOf(run, ...args),
      effectiveInvocationOutcome: (...args) => this.effectiveInvocationOutcome(run, ...args),
      engineerGuard: (...args) => this.engineerGuard(run, ...args),
      fail: (...args) => this.fail(run, ...args),
      failureOf: (...args) => this.failureOf(run, ...args),
      finishSession: (...args) => this.finishSession(run, ...args),
      ignoring: (...args) => this.ignoring(run, ...args),
      invocationRecord: (...args) => this.invocationRecord(run, ...args),
      latestBasis: (...args) => this.latestBasis(run, ...args),
      latestRepairIncident: (...args) => this.latestRepairIncident(run, ...args),
      now: (...args) => this.now(...args),
      ownershipAuthority: (...args) => this.ownershipAuthority(run, ...args),
      passedScenarioLines: (...args) => this.passedScenarioLines(run, ...args),
      pendingCorrection: (...args) => this.pendingCorrection(run, ...args),
      persistRepairIncident: (...args) => this.persistRepairIncident(run, ...args),
      previewCandidateTree: (...args) => this.previewCandidateTree(...args),
      reconcileWorkItem: (...args) => this.reconcileWorkItem(run, ...args),
      reconciliationBriefing: (...args) => this.reconciliationBriefing(run, ...args),
      recordRepairPreparation: (...args) => this.recordRepairPreparation(run, ...args),
      refreshIndex: (...args) => this.refreshIndex(run, ...args),
      renderProducerFeatures: (...args) => this.renderProducerFeatures(run, ...args),
      runInvocation: <T>(agent: AgentPort, request: InvocationRequest<T>) => this.runInvocation(run, agent, request),
      takeIteration: (...args) => this.takeIteration(run, ...args),
      unresolvedOf: (...args) => this.unresolvedOf(run, ...args),
      verifyCapabilityHandback: (...args) => this.verifyCapabilityHandback(run, ...args),
      verifyProducerCommit: (...args) => this.verifyProducerCommit(...args),
      waitOperationRecovery: (...args) => this.waitOperationRecovery(run, ...args),
      warn: (...args) => this.warn(...args),
      write: (...args) => this.write(run, ...args),
      handling: {
        closeIteration: (...args) => this.handling.closeIteration(run, ...args),
        recordAssignment: (...args) => this.handling.recordAssignment(run, ...args),
        reviseOutline: (...args) => this.handling.reviseOutline(run, ...args),
        recordObligations: (...args) => this.handling.recordObligations(run, ...args),
        cleanupClosedScratch: (...args) => this.handling.cleanupClosedScratch(run, ...args),
      },
      gates: {
        workItemGate: (...args) => this.gates.workItemGate(run, ...args),
        validateFeatureTargets: (...args) => this.gates.validateFeatureTargets(...args),
        expectedFeatures: (...args) => this.gates.expectedFeatures(run, ...args),
        writtenFeatures: (...args) => this.gates.writtenFeatures(run, ...args),
      },
    });
    this.coordinators.set(run, coordinator);
    return coordinator;
  }

  /** Recheck the exact acceptance basis under the same serialization as the domain handback. */
  private async validateHandbackBasis(run: Run, input: CapabilityInput, proof: CapabilityHandbackBasis): Promise<void> {
    if (input.type !== 'capability-handed-back') throw new Error('Completion evidence belongs only to a capability handback');
    run.writer.requireSettled(`Capability ${input.data.task} cannot hand back an unsettled writer`);
    const recorded = gateAttemptSchema.safeParse(this.committedBody(run, runLayout.gate(proof.gate.id)));
    const started = run.log.all('capability-verification-started').filter(event => event.data.task === input.data.task).at(-1);
    if (!recorded.success || recordHash(this.committedBody(run, runLayout.gate(proof.gate.id))) !== proof.gateRecord.hash || recorded.data.audited !== proof.gate.audited || recorded.data.verdict !== proof.gate.verdict || recorded.data.proposedBy !== proof.gate.proposedBy || proof.gate.verdict !== 'passed' || proof.gate.audited === null ||
      started?.data.gate !== proof.gate.id || started.data.invocation !== input.data.invocation) {
      throw new Error(`Capability ${input.data.task} lost its accepted completion gate`);
    }
    const currentTree = (await this.previewCandidateTree()).tree;
    if (currentTree !== proof.candidateTree || await this.candidates.commitTree(this.projectRoot, proof.gate.audited) !== currentTree) {
      throw new CandidateDriftError(`Capability ${input.data.task} candidate changed before its atomic handback`);
    }
    if (recordHash(this.latestBasis(run, input.data.task) ?? null) !== recordHash(proof.reconciliation)) {
      throw new Error(`Capability ${input.data.task} reconciliation changed before its atomic handback`);
    }
    if (proof.acceptedBasis !== null) {
      const refused = await this.completionBasisRefusal(run, input.data.task, proof.gate, proof.acceptedBasis);
      if (refused !== null) throw new Error(`Capability ${input.data.task} lost its completion basis: ${refused}`);
    }
  }

  private handlingHost(): HandlingHost<Run> {
    const service = this;
    return {
      get projectRoot() { return service.projectRoot; },
      get git() { return service.git; },
      get candidates() { return service.candidates; },
      get gates() { return service.gates; },
      write: (run, input, records) => service.write(run, input, records),
      afterWrite: (write, runId) => service.afterWrite(write, runId),
      warn: text => service.warn(text),
      ignoring: run => service.ignoring(run),
      fail: (run, reason, detail, records) => service.fail(run, reason, detail, records),
      closeCorrection: (run, workItem, closing) => service.closeCorrection(run, workItem, closing),
      citeCurrentDeviations: (run, elements) => service.coordination(run).citeCurrentDeviations(elements),
      orientationIdentity: run => ({ packageHash: run.record.prompts.reviewer?.hash ?? null, agent: run.record.agent, model: service.options.model ?? null }),
      wakeReviews: run => run.reviews?.wake(),
    };
  }

  /** The committing gates of every run, which a manual run's gate shares. */
  private readonly gates: CommittingGates<Run>;

  /** What a committing gate asks of an implementation run. */
  private gateHost(): GateHost<Run> {
    const service = this;
    return {
      get projectRoot() { return service.projectRoot; },
      get git() { return service.git; },
      get ramify() { return service.options.ramify; },
      get configuredAudit() { return service.options.configuredAudit; },
      write: (run, input, records) => service.write(run, input, records),
      afterWrite: (write, runId) => service.afterWrite(write, runId),
      warn: text => service.warn(text),
      harnessFiles: run => service.coordination(run).harnessFiles(),
      importedCommitReceipt: async (run, request) => {
        const effect = run.restartImport?.recognizedEffects.find(receipt => receipt.checkpoint === request.checkpoint && receipt.subjectWorkItem === request.subject?.workItem && receipt.commit === request.head);
        if (!effect || (await service.previewCandidateTree()).tree !== effect.tree) return undefined;
        return { commit: effect.commit, tree: effect.tree };
      },
      auditDefinition: async (run, sourceCommit) => {
        const captured = run.record.auditConfiguration;
        if (captured === undefined || 'invalid' in captured) {
          throw new Error(`The run carries no committed audit definition: ${captured === undefined ? 'none was captured' : captured.invalid}`);
        }
        const corrected = recordedExternalChanges(run.log.ledger.replay()).some(observation => observation.changes.some(change => change.path === captured.config.path));
        if (!corrected) return captured.config;
        const current = await service.options.configuredAudit.read(service.projectRoot, sourceCommit);
        if (!compatibleAuditRepair(captured.config, current)) throw new Error('Required audit checks or acceptance policy changed');
        return current;
      },
      previewCandidateTree: () => service.previewCandidateTree(),
      get candidates() { return service.candidates; },
      refreshIndex: run => service.refreshIndex(run),
      ignoring: run => service.ignoring(run),
      recoverGate: (run, attempt, diagnostic, group, attempts) => service.waitOperationRecovery(run,
        { kind: 'gate', checkpoint: attempt.checkpoint, work: { ...attempt.subject }, candidate: attempt.audited ?? attempt.head },
        { classification: 'check-execution', diagnostic }, attempts, attempt.infrastructureAttempt, group),
      awaitGateAdmission: run => service.awaitGateAdmission(run),
      retryGateDelay: async (run, milliseconds) => {
        const deadline = Date.now() + milliseconds;
        while (!service.ignoring(run) && Date.now() < deadline) {
          let timer: ReturnType<typeof setTimeout> | undefined;
          await Promise.race([run.changed(), new Promise<void>(resolve => { timer = setTimeout(resolve, Math.max(0, deadline - Date.now())); })]);
          if (timer !== undefined) clearTimeout(timer);
        }
        return !service.ignoring(run);
      },
    };
  }

  /** Peer work pauses dispatch until its lifecycle owner has settled. */
  private async awaitGateAdmission(run: Run): Promise<boolean> {
    while (run.recoveryPause && !this.ignoring(run)) { const changed = run.changed(); if (!run.recoveryPause) break; await changed; }
    return !this.ignoring(run);
  }

  /** The invocation runner every role's invocation of every run goes through. */
  private readonly runner: InvocationRunner<Run>;

  /** What only an implementation run knows, which the invocation runner asks of it. */
  private runnerHost(): RunnerHost<Run> {
    const service = this;
    return {
      authorityCurrent: () => service.options.lock.held(),
      get projectRoot() { return service.projectRoot; },
      get git() { return service.git; },
      get model() { return service.options.model ?? null; },
      now: () => service.now(),
      warn: text => service.warn(text),
      afterWrite: (write, runId) => service.afterWrite(write, runId),
      operations: agent => service.operations(agent),
      openedOperations: () => service.sessionOperations,
      ignoring: run => service.ignoring(run),
      base: run => service.coordination(run).accepted(),
      resourceInvocation: (run, agent, request) => service.recoverableInvocation(run, agent, request),
      refusal: run => service.invocationRefusal(run),
      refused: async (run, reason, reader) => {
        if (!reader) await service.fail(run, 'limit-exceeded', reason);
      },
      taskBrief<T>(run: Run, request: InvocationRequest<T>, spec: SessionSpec, limits: RunPolicy['limits']) {
        return service.taskBrief(run, request, spec, limits);
      },
      async restore<T>(run: Run, agent: AgentPort, request: InvocationRequest<T>) {
        return run.restoring && request.restore !== false ? service.restoreInvocation(run, agent, request) : null;
      },
      previewCandidateTree: () => service.previewCandidateTree(),
    };
  }

  /** Resource observations never refuse invocation admission. Authority and compatibility have their own barriers. */
  private invocationRefusal(run: Run): string | null {
    return null;
  }

  /** Elapsed execution is an observation, never a check admission allowance. */
  private executionTimeRefusal(run: Run): string | null {
    return null;
  }

  /**
   * Loads every run of the project and recovers those without a terminal
   * event, under the project lock the caller holds. Recovery replays each
   * log, rewrites every record file that is missing or differs, performs
   * again each external effect whose intent has no completion, closes an
   * invocation whose start has no end, and marks the run interrupted. It
   * calls no agent and makes no duplicate.
   */
  static async open(options: RunServiceOptions): Promise<{ service: AutonomousRunService; recovery: RunRecoveryReport }> {
    if (options.policy !== undefined) throw new Error('Production run policy is fixed; a caller cannot inject a policy');
    const service = new AutonomousRunService(options, createCapabilityWorkflow());
    const recovery = await service.load();
    return { service, recovery };
  }

  /** Current-policy scripted lifecycle controls exercise the ordinary and narrow contract paths without launching capability coordination. */
  static async openForScriptedLifecycleTests(options: RunServiceOptions): Promise<{ service: AutonomousRunService; recovery: RunRecoveryReport }> {
    const service = new AutonomousRunService(options, null);
    const recovery = await service.load();
    return { service, recovery };
  }

  /** Internal test composition for the same factory production now uses. */
  static async openForCapabilityTests(options: RunServiceOptions, factory: () => CapabilityWorkflow): Promise<{ service: AutonomousRunService; recovery: RunRecoveryReport }> {
    const workflow = factory();
    if (workflow.version !== 'capability-coordination/1') throw new Error('Unknown capability workflow factory');
    const service = new AutonomousRunService(options, workflow);
    const recovery = await service.load();
    return { service, recovery };
  }

  get projectRoot(): string {
    return this.options.projectRoot;
  }

  /** No candidate is read while Git could include scratch in its tree. */
  private async previewCandidateTree(): ReturnType<GitService['previewCandidateTree']> {
    await assertScratchSafe(this.projectRoot, await declaredModuleDirectories(this.projectRoot), this.git);
    return this.git.previewCandidateTree(this.projectRoot);
  }

  private warn(message: string): void {
    (this.options.warn ?? console.warn)(message);
  }

  private now(): Date {
    return this.options.now?.() ?? new Date();
  }

  private async afterWrite(write: RunWrite, runId: string): Promise<void> {
    await this.options.afterWrite?.(write, runId);
    if (!await this.options.lock.held()) throw new Error('Execution ownership was lost before the operation could continue');
  }

  /** One run-log write, serialized with every other, as the invocation runner makes it. */
  private write(run: Run, input: RunEventInput, records: readonly CommitRecord[] = [], at?: Date): Promise<'committed' | 'already-committed' | 'ended'> {
    return this.runner.write(run, input, records, at);
  }

  /**
   * The run's terminal event, with a `session-finished` before it for every
   * session the run still holds and awaits no invocation of: each one it
   * kept, as `run-ended`, and one opened whose first invocation never
   * started, for `opening`'s reason. They are one serialized write, so no
   * invocation can start between them, and a final run holds no suspended
   * session. A session whose invocation is still awaited is left live: its
   * end is that invocation's own.
   */
  private async endRun(run: Run, terminal: RunEventInput, opening: SessionFinishReason = 'run-ended'): Promise<'committed' | 'ended'> {
    // A gate's commit and audit run outside the mutex; its attempt is
    // committed before anything ends the run, as when the mutex held it.
    await run.gating?.catch(() => undefined);
    const written = await run.mutex.run<'committed' | 'ended'>(async () => {
      if (!await this.options.lock.held() || run.log.terminal || this.closed || (run.stopRequested && terminal.type !== 'job-stopped' && terminal.type !== 'job-interrupted')) return 'ended';
      const sessions = this.sessionsOf(run);
      for (const session of sessions?.values() ?? []) {
        if (run.restartImport && !run.log.ownEvents.some(event => event.type === 'session-opened' && event.data.session === session.id)) continue;
        const reason = session.state === 'suspended' ? 'run-ended' : session.state === 'live' && session.awaiting === null ? opening : null;
        if (reason !== null) await run.log.append({ type: 'session-finished', data: { session: session.id, reason } });
      }
      await run.log.append(terminal);
      run.notify();
      return 'committed';
    });
    if (written === 'committed') await this.scheduleBeads(run, 'finish');
    return written;
  }

  /**
   * Releases a session the harness kept and will not use again. A session
   * that is not suspended is left alone: it was finished when its last
   * invocation ended, or the run has ended.
   */
  private async finishSession(run: Run, session: SessionId | undefined, reason: SessionFinishReason): Promise<void> {
    if (session === undefined || run.restartImport && !run.log.ownEvents.some(event => event.type === 'session-opened' && event.data.session === session)) return;
    const written = await run.mutex.run(async () => {
      if (run.log.terminal || this.sessionsOf(run)?.get(session)?.state !== 'suspended') return false;
      await run.log.append({ type: 'session-finished', data: { session, reason } });
      return true;
    });
    if (written) await this.afterWrite('session-finished', run.record.jobId);
  }

  private continuationOf(run: Run, session: SessionId, reason: ContinueReason): ContinueRelation {
    return this.runner.continuationOf(run, session, reason);
  }

  private transcriptOf(run: Run, session: SessionId): TranscriptWriter {
    return this.runner.transcriptOf(run, session);
  }

  private invocationTranscript(run: Run, session: SessionId, invocation: string, observations?: ObservationLog): InvocationTranscript {
    return this.runner.invocationTranscript(run, session, invocation, observations);
  }

  private sessionsOf(run: Run): RunSessions | undefined {
    return this.runner.sessionsOf(run);
  }

  // Reviews

  /**
   * The run's review readers, created when its driver starts for a run whose
   * policy requests reviews. Each wake starts what the policy has room for.
   */
  private startReviews(run: Run, agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>): void {
    const policy = run.policy.reviews;
    if (policy === undefined || run.reviews !== undefined) return;
    run.reviews = new ReviewQueue({
      concurrency: policy.concurrency,
      queue: policy.queue,
      preserveCoverage: run.policy.continuity !== undefined,
      unsettled: () => unsettledRequests(run.log.events).map(request => request.id),
      attempt: request => this.recoverableReviewAttempt(run, agent, packages, request),
      prepare: request => this.prepareReview(run, agent, packages, request),
      overflow: async request => {
        await this.finishUnsettledReviews(run, () => ({ reason: 'queue-overflow', detail: `More than ${policy.queue} review requests were waiting; this one was not run` }), [request]);
      },
      now: () => this.now().getTime(),
      warn: text => this.warn(`Run ${run.record.jobId}: ${text}`),
    });
    run.reviews.wake();
  }

  /**
   * Starts a waiting design request's orientation before the request has a
   * slot: the orientation reads only the captured guidance, so it need not
   * wait for the readers ahead of it. The attempt that later forks it finds
   * it recorded or still being made. Nothing here settles the request; a
   * failure is met again, and recorded, by that attempt.
   */
  private async prepareReview(run: Run, agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>, id: string): Promise<void> {
    const state = reviewStateOf(run.log.events).get(id);
    if (state === undefined || state.settledBy !== null) return;
    if (this.closed || this.ignoring(run) || run.reviews?.accepting !== true) return;
    const loaded = packages.get('reviewer');
    if (loaded?.reviewer === undefined) return;
    const request = reviewRequestSchema.parse(this.committedBody(run, reviewLayout.request(id)));
    const point = request.forkPoint;
    if (request.key.kind !== 'design' || point.kind !== 'orientation' || request.inputsUnavailable !== undefined) return;
    if (request.guidance.length === 0 || run.log.all('review-orientation-recorded').some(event => event.data.key === point.key)) return;
    const texts = await Promise.all(request.guidance.map(entry => this.candidates.readBlob(this.projectRoot, request.key.candidate, entry.ref)));
    const guidance = boundInputs(request.guidance.map((entry, index) => ({ ref: entry.ref, hash: sha256(texts[index]!), text: texts[index]! })), request.guidance);
    if (this.closed || this.ignoring(run) || run.reviews?.accepting !== true) return;
    await this.orientation(run, agent, loaded, request, guidance);
  }

  /**
   * The iterations that closed accepted after a module engineer's passing gate,
   * which are the ones a review request is owed for: their audited commit,
   * gate and assignment. Contract iterations establish agreements and are
   * not reviewed in this version.
   */
  private reviewableClosings(run: Run): Array<{ readonly workItem: string; readonly iteration: string; readonly gate: string; readonly commit: string }> {
    const assigned = new Set([...run.log.all('iteration-assigned').map(event => event.data.iteration),
      ...run.log.all('capability-assigned').map(event => event.data.assignment)]);
    return run.log.all('iteration-closed').flatMap(event => {
      if (event.data.outcome !== 'accepted' || event.data.gate === null || event.data.commit === null || !assigned.has(event.data.iteration)) return [];
      const assignment = committedRecords(run.log.ledger.replay()).assignments.get(event.data.iteration);
      return [{ workItem: assignment?.coordination?.kind === 'capability-task' ? assignment.coordination.id : event.data.workItem,
        iteration: event.data.iteration, gate: event.data.gate, commit: event.data.commit }];
    });
  }

  /** A record body as the log committed it, never the materialized file. */
  private committedBody(run: Run, path: string): unknown {
    return committedBody(run, path);
  }

  /**
   * One attempt of one request, from its snapshot to its terminal record.
   * Answers whether a terminal record was committed: an attempt fenced by a
   * settled request, a run that ended or a service that is closing commits
   * nothing, and its reader's session was stopped and closed like any other.
   */
  private async runReviewAttempt(run: Run, agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>, id: string): Promise<boolean> {
    const policy = run.policy.reviews;
    const state = reviewStateOf(run.log.events).get(id);
    if (policy === undefined || state === undefined || state.settledBy !== null) return false;
    if (this.ignoring(run) || run.reviews?.accepting !== true) return false;
    const request = reviewRequestSchema.parse(this.committedBody(run, reviewLayout.request(id)));
    const recovered = await this.recoverAcceptedReview(run, request, state);
    if (recovered !== null) return recovered;
    const kind = request.key.kind;
    const attempt = reviewAttemptId(id, state.attempts.length + 1);
    const queuedAt = state.attempts.at(-1)?.finished?.at ?? state.recordedAt;
    const retryLeft = state.attempts.filter(entry => entry.finished !== null && !entry.finished.settles).length < policy.retries;
    const requestedStart = requestedStartOf(request);
    const base = { id: attempt, request: id, queuedAt, requestedStart };
    const unavailable = (detail: string) => this.finishReview(run, request, {
      ...base, startedAt: null, invocation: null, session: null, actualStart: null,
    }, { result: 'not-verified', reason: 'unavailable', detail }, true);

    const loaded = packages.get('reviewer');
    if (loaded?.reviewer === undefined) return await unavailable('No prompt package is loaded for the reviewer') === 'committed';
    if (request.inputsUnavailable !== undefined) return await unavailable(request.inputsUnavailable) === 'committed';
    if (kind === 'design' && request.guidance.length === 0) {
      return await unavailable(request.forkPoint.kind === 'unavailable' ? request.forkPoint.reason : 'No design guidance was selected') === 'committed';
    }
    let snapshot: CandidateSnapshot;
    let assignmentPackage: string | undefined;
    let guidance: CapturedInput[] = [];
    try {
      snapshot = await openCandidateSnapshot(this.candidates, this.projectRoot, { commit: request.key.candidate, base: request.base });
    } catch (error) {
      return await unavailable(`The audited candidate could not be read: ${message(error)}`) === 'committed';
    }
    try {
      // The question's inputs are read again and must be the bytes the
      // request bound; anything else is not the question it asked.
      if (request.source !== undefined) assignmentPackage = await this.coordination(run).packageText(request.source);
      if (kind === 'design') {
        const texts = await Promise.all(request.guidance.map(entry => this.candidates.readBlob(this.projectRoot, request.key.candidate, entry.ref)));
        guidance = boundInputs(request.guidance.map((entry, index) => ({ ref: entry.ref, hash: sha256(texts[index]!), text: texts[index]! })), request.guidance);
      }
    } catch (error) {
      return await unavailable(`The ${kind} review's captured inputs could not be read as recorded: ${message(error)}`) === 'committed';
    }
    let start: Awaited<ReturnType<AutonomousRunService['reviewStart']>>;
    try { start = await this.reviewStart(run, agent, loaded, request, guidance); }
    catch (error) { return await unavailable(`The recorded review source is unavailable: ${message(error)}`) === 'committed'; }
    // An orientation made first may have met an explicit stop; the request
    // can already be settled when its prepared orientation returns.
    if (this.closed || this.ignoring(run) || run.reviews?.accepting !== true) return false;
    if (reviewStateOf(run.log.events).get(id)?.settledBy !== null) return false;

    const pendingBindings = await this.handling.reviewPendingBindings(run, request, snapshot);
    const assignment = iterationAssignmentSchema.safeParse(this.committedBody(run, request.assignment));
    const reviewedResult = committedRecords(run.log.ledger.replay()).results.get(request.key.iteration);
    const discovery = assignment.success ? startingPointsSection([
      this.coordination(run).assignmentStartingPoints(assignment.data),
      await this.coordination(run).engineerStartingPoints(assignment.data,
        reviewedResult?.gate === request.gate && reviewedResult.commit === request.key.candidate ? reviewedResult : undefined,
        request.gate, request.key.candidate),
    ], { projectRoot: this.projectRoot, snapshot, allows: path => nonfunctionalSourceAllows(path, ['.']) }) : undefined;
    const held = selectCheckFindings(checkFindingStateOf(run.log.ledger), { kind: 'list', owner: { kind: 'work-item', workItem: request.workItem }, select: 'all', limit: 100 });
    // Binding reads may yield while this request is stopped or settled. Do
    // not register preparation after its cancellation sweep has already run.
    if (this.ignoring(run) || run.reviews?.accepting !== true || reviewStateOf(run.log.events).get(id)?.settledBy !== null) return false;
    // The question's message inputs, captured once: the review step is built from these.
    const intent = assignment.success ? {
      goal: assignment.data.goal, approach: assignment.data.approach, completionEvidence: assignment.data.completionEvidence,
      scopeRationale: assignment.data.scope.rationale,
      testAreas: assignment.data.scope.resolved.ownership.modules.filter(module => assignment.data.gate.tests.exactOwners.includes(module.id)
        || assignment.data.gate.tests.subtrees.some(owner => module.id === owner || module.id.startsWith(`${owner}/`)))
        .map(module => posix.join(module.directory, 'src/tests')),
    } : null;
    const checkFindings = held.ok && 'items' in held.view ? held.view.items.map(item => ({ id: item.id, standing: item.standing, title: item.title })) : [];
    const setup = kind === 'design' ? undefined : await this.coordination(run).checkInputSection(snapshot);
    const planDocument = snapshot.entries.get(planPath(run.record.planId))?.kind === 'file' ? planPath(run.record.planId) : null;
    let prepared: PreparedReview;
    const preparation = new AbortController();
    run.reviewPreparations.set(id, preparation);
    try {
      prepared = await prepareReview({
        source: this.candidates,
        projectRoot: this.projectRoot,
        signal: preparation.signal,
        maxConcerns: policy.maxConcerns,
        briefing: {
          request: {
            id: request.id, key: { kind, iteration: request.key.iteration, candidate: request.key.candidate },
            workItem: request.workItem, base: request.base, tree: request.tree, gate: request.gate, guidance: request.guidance,
          },
          snapshot,
          pendingBindings,
          assignment: intent,
          checkFindings,
          ...(assignmentPackage === undefined ? {} : { package: assignmentPackage }),
          ...(setup === undefined ? {} : { setup }),
          planDocument,
        },
      });
    }
    catch (error) {
      if (this.ignoring(run) || run.reviews?.accepting !== true || reviewStateOf(run.log.events).get(id)?.settledBy !== null) return false;
      if (run.policy.continuity) {
        const resumed = await this.waitOperationRecovery(run, { kind: 'preparation', role: 'reviewer', reviewRequest: id, candidate: request.key.candidate,
          work: { workItem: request.workItem, iteration: request.key.iteration, request: id } },
          { classification: 'preparation', diagnostic: `The frozen review candidate's patches are unavailable: ${message(error)}` }, [], 0);
        return resumed ? this.runReviewAttempt(run, agent, packages, id) : false;
      }
      return await unavailable(`The audited candidate's patches could not be collected: ${message(error)}`) === 'committed';
    } finally {
      run.reviewPreparations.delete(id);
    }
    if (this.ignoring(run) || run.reviews?.accepting !== true || reviewStateOf(run.log.events).get(id)?.settledBy !== null) return false;
    const workspace = join(dirname(reviewLayout.attempt(attempt)), 'workspace');
    await mkdir(run.path(workspace), { recursive: true });

    // The question is built from its inputs by the reviewer step's own
    // constructor, which `step render` uses too. The prepared patches, tools
    // and validator are the reviews child's, over the same candidate.
    let step: ReturnType<typeof constructReviewStep>;
    try {
      const reviewInputs = validateReviewInputs({
        schema: stepInputsSchemaId, role: 'reviewer', question: kind, run: { planId: run.record.planId, runId: run.record.jobId },
        work: { workItem: request.workItem, iteration: request.key.iteration }, attempt: state.attempts.length + 1,
        capabilityWorkflow: this.workflow !== null, limits: run.policy.limits, context: contextPolicyOf(run.policy, 'reviewer'),
        request, snapshotTree: snapshot.tree,
        briefing: {
          assignment: intent, checkFindings, ...(assignmentPackage === undefined ? {} : { package: assignmentPackage }), planDocument,
          pendingBindings: JSON.parse(JSON.stringify(pendingBindings)) as unknown[], ...(setup === undefined ? {} : { setup }),
          diffPayload: prepared.candidateDiff, changes: snapshot.changes.map(change => ({ status: change.status, path: change.path })),
          directories: (intent?.testAreas ?? []).filter(area => snapshot.directories.has(area)),
        },
        ...(discovery === undefined ? {} : { discovery }),
        workspace: { run: workspace },
        bounds: { absoluteMs: policy.attemptMs },
        start: start.start.mode === 'fork' && start.fork !== undefined && 'invocation' in start.fork.from
          ? { kind: 'fork', session: start.fork.from.session, invocation: start.fork.from.invocation, point: start.start.from, reason: start.fork.reason, briefs: [...start.fork.briefs] }
          : { kind: 'fresh', ...(start.degraded === undefined ? {} : { degraded: start.degraded }) },
      });
      step = constructReviewStep(reviewInputs, { projectRoot: this.projectRoot, packages });
    } catch (error) {
      return await unavailable(`The ${kind} review cannot be constructed from its inputs: ${message(error)}`) === 'committed';
    }

    let started: { invocation: string; session: SessionId; at: string } | undefined;
    /** Set when the request was settled before this attempt's start could be recorded. */
    let fenced = false;
    const result = await this.runInvocation<ReviewSubmission>(run, agent, {
      recoveryReviewRequest: id,
      originalInvocation: state.attempts.at(-1)?.finished === null ? state.attempts.at(-1)?.started?.invocation : undefined,
      restore: state.attempts.at(-1)?.finished === null && state.attempts.at(-1)?.started !== null,
      singleAdmission: true,
      role: step.role,
      brief: step.brief,
      context: step.context,
      stepInputs: step.before.inputs, consultationPackages: packages,
      fallback: this.coordination(run).stepFallback(step.inputs, packages),
      work: step.work,
      attempt: step.attempt,
      loaded: step.loaded,
      systemPrompt: step.systemPrompt,
      prompt: step.prompt,
      start: start.start,
      ...(step.fork === undefined ? {} : { fork: step.fork }),
      ...(start.degraded === undefined ? {} : { degraded: start.degraded }),
      toolName: step.submission.toolName,
      description: step.submission.description,
      inputSchema: step.submission.inputSchema,
      submissionSchema: step.submission.submissionSchema,
      validate: prepared.validate,
      keep: () => finished('work-closed'),
      scope: { write: null, measurement: null, size: null },
      reader: true,
      workingDirectory: step.equipment.workingDirectory,
      absoluteMs: step.bounds.absoluteMs,
      equip: () => ({ builtinTools: [...step.equipment.builtinTools], tools: [...prepared.tools.definitions] }),
      // The start is recorded only for a request still unsettled, under the
      // same mutex that settles it; a settled reader never starts.
      onStarted: async (invocation, session) => {
        const at = this.now();
        const recorded = await run.mutex.run(async () => {
          if (run.log.terminal !== undefined || reviewStateOf(run.log.events).get(id)?.settledBy !== null) return false;
          await run.log.append({ type: 'review-attempt-started', data: { request: id, attempt, invocation, session, requestedStart } }, at);
          return true;
        });
        if (recorded) started = { invocation, session, at: at.toISOString() };
        else fenced = true;
      },
      fenced: () => fenced,
    });
    // A closing service records nothing more; recovery finishes the attempt.
    if (this.closed || fenced) return false;

    const outcome = reviewOutcome(result, run.readerStop);
    const settles = !(outcome.retryable && retryLeft && !this.ignoring(run) && run.reviews?.accepting === true);
    const attemptBody = {
      ...base,
      startedAt: started?.at ?? null,
      invocation: result.id || started?.invocation || null,
      session: result.session || started?.session || null,
      transportInvocations: run.log.all('operation-recovery-attempt').filter(event => event.data.invocation === result.id || started !== undefined && this.transportAncestor(run, event.data.invocation, started.invocation)).map(event => event.data.invocation),
      // What the executor answered, never what was asked: a fork it could
      // not take is a fresh start, and is never measured as a fork.
      actualStart: result.actual === undefined ? null : result.actual === 'fork' ? 'fork' as const : 'fresh' as const,
    };
    const submission = result.ended === 'submitted' ? result.value : undefined;
    // What the harness binds to each concern is read here, before the
    // transition takes the run mutex.
    const bindings = submission === undefined || submission.concerns.length === 0
      ? []
      : await this.concernBindings(run, request, snapshot, prepared.tools, submission);
    const committed = await this.finishReview(run, request, attemptBody, outcome.result, settles, submission, bindings);
    return committed === 'committed';
  }

  /** A temporarily unavailable prerequisite leaves its ordinary review question pending. */
  private async recoverableReviewAttempt(run: Run, agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>, id: string): Promise<boolean> {
    for (;;) {
      try { return await this.runReviewAttempt(run, agent, packages, id); }
      catch (error) {
        if (!run.policy.continuity || this.ignoring(run)) throw error;
        const request = reviewRequestSchema.parse(this.committedBody(run, reviewLayout.request(id)));
        const resumed = await this.waitOperationRecovery(run, { kind: 'preparation', role: 'reviewer', reviewRequest: id,
          candidate: request.key.candidate, work: { workItem: request.workItem, iteration: request.key.iteration, request: id } },
          { classification: 'preparation', diagnostic: `Frozen review ${id} setup is unavailable: ${message(error)}` }, [], 0);
        if (!resumed) return false;
      }
    }
  }

  private transportAncestor(run: Run, id: string, ancestor: string): boolean {
    const seen = new Set<string>(); let current: string | undefined = id;
    while (current && !seen.has(current)) { if (current === ancestor) return true; seen.add(current); current = this.invocationRecord(run, current).body.recoveryPredecessor; }
    return false;
  }

  /** Finish an accepted reader turn whose terminal review record was interrupted.
   * Its submitted bytes and settled outcome are durable; the candidate is
   * immutable, so concern grounds are recovered from that same audited tree. */
  private async recoverAcceptedReview(
    run: Run, request: ReviewRequest, state: ReturnType<typeof reviewStateOf> extends ReadonlyMap<string, infer R> ? R : never,
  ): Promise<boolean | null> {
    const pending = state.attempts.at(-1);
    if (pending?.started === null || pending?.started === undefined || pending.finished !== null) return null;
    const invocation = run.log.all('invocation-ended').filter(event => event.data.ended === 'submitted' && this.transportAncestor(run, event.data.invocation, pending.started!.invocation)).at(-1)?.data.invocation ?? pending.started.invocation;
    const ended = run.log.all('invocation-ended').find(event => event.data.invocation === invocation);
    if (ended?.data.ended !== 'submitted') return null;
    const outcome = invocationOutcomeSchema.safeParse(this.committedBody(run, runLayout.outcome(invocation)));
    const bytes = await readIfExists(run.path(runLayout.submission(invocation)));
    if (ended.data.submission === null || bytes === undefined || sha256(bytes) !== ended.data.submission ||
      !outcome.success || outcome.data.submission?.hash !== ended.data.submission ||
      outcome.data.disposition !== 'applied' || !outcome.data.settled.confirmed || outcome.data.session === undefined) {
      await this.fail(run, 'recovery-exhausted', `Reviewer ${invocation} has no authenticated accepted submission for ${pending.id}`);
      return false;
    }
    const raw = JSON.parse(bytes.toString('utf8')) as Record<string, unknown>;
    const { schema: _schema, ...body } = raw;
    const parsed = reviewSubmissionSchema.safeParse(body);
    if (raw.schema !== 'ramify-agent.review-submission/1' || !parsed.success) {
      await this.fail(run, 'recovery-exhausted', `Reviewer ${invocation} has an invalid accepted submission for ${pending.id}`);
      return false;
    }
    const submission = parsed.data;
    const snapshot = await openCandidateSnapshot(this.candidates, this.projectRoot,
      { commit: request.key.candidate, base: request.base });
    try {
      await verifySnapshotEvidence(snapshot, this.candidates, this.projectRoot, [...submission.inspected,
        ...submission.concerns.flatMap(concern => concern.ground === null ? [] : [concern.ground.path])]);
    } catch (error) {
      await this.fail(run, 'recovery-exhausted', `Reviewer ${invocation}'s historical source evidence is unavailable: ${message(error)}`);
      return false;
    }
    const read = new Map<string, string>();
    for (const concern of submission.concerns) {
      if (concern.ground === null) continue;
      const resolved = resolveSnapshotPath(snapshot, concern.ground.path);
      if (!resolved.ok || resolved.kind !== 'file') {
        await this.fail(run, 'recovery-exhausted', `Reviewer ${invocation}'s accepted ground is unavailable in ${request.key.candidate}`);
        return false;
      }
      const text = await this.candidates.readBlob(this.projectRoot, request.key.candidate, resolved.path);
      read.set(resolved.path, `sha256:${sha256(text)}`);
    }
    const bindings = submission.concerns.length === 0 ? []
      : await this.concernBindings(run, request, snapshot, { read: () => read }, submission);
    const result: ReviewResult = submission.missing.length === 0
      ? { result: 'complete', inspected: submission.inspected.map(path => ({ path })), concerns: submission.concerns.length }
      : { result: 'partial', inspected: submission.inspected.map(path => ({ path })),
        missing: submission.missing.map(entry => ({ path: entry.path, reason: entry.reason })), concerns: submission.concerns.length };
    const previous = state.attempts.at(-2);
    const attempt = {
      id: pending.id, request: request.id, queuedAt: previous?.finished?.at ?? state.recordedAt,
      requestedStart: requestedStartOf(request),
      startedAt: pending.started.at, invocation, session: ended.data.session,
      transportInvocations: run.log.all('operation-recovery-attempt').filter(event => this.transportAncestor(run, event.data.invocation, pending.started!.invocation)).map(event => event.data.invocation),
      actualStart: outcome.data.session.mode === 'fork' ? 'fork' as const : 'fresh' as const,
    };
    return await this.finishReview(run, request, attempt, result, true, submission, bindings) === 'committed';
  }

  /**
   * The ground, credibility and modules of each concern of a valid
   * submission, in concern order. The ground is the file the reviewer named,
   * with the hash of what `snapshot_read` answered; its credibility is the
   * provenance class of that file; the modules own the concern's locations
   * on the candidate's own module tree, else the work item's module. A
   * candidate whose module declarations cannot be read leaves only that
   * fallback, with a warning.
   */
  private async concernBindings(run: Run, request: ReviewRequest, snapshot: CandidateSnapshot, tools: Pick<SnapshotTools, 'read'>, submission: ReviewSubmission): Promise<ConcernBinding[]> {
    return concernBindings(run, { projectRoot: this.projectRoot, planId: run.record.planId, candidates: this.candidates, warn: text => this.warn(text) },
      request, snapshot, tools, submission);
  }

  /**
   * Where one attempt's reviewer starts. Code review starts fresh. Scope
   * review forks the module architect at the point that produced its
   * assignment, and design review forks the orientation of its guidance,
   * made first where none exists yet. Only the existing scope recovery may
   * use the complete recorded assignment packet. Unavailable orientation
   * or session history uses the ordinary fresh review task.
   */
  private async reviewStart(run: Run, agent: AgentPort, loaded: LoadedPackage, request: ReviewRequest, guidance: readonly CapturedInput[]): Promise<{
    readonly start: SessionStart;
    readonly fork?: ForkRelation | undefined;
    readonly degraded?: { readonly requested: 'fork'; readonly reason: string } | undefined;
  }> {
    const fresh = (reason: string) => ({ start: { mode: 'fresh' } as const, degraded: { requested: 'fork' as const, reason } });
    const point = request.forkPoint;
    if (point.kind === 'none') return { start: { mode: 'fresh' } };
    if (point.kind === 'unavailable') {
      if (request.key.kind === 'scope') return fresh(point.reason);
      throw new EvidenceUnavailableError(point.reason);
    }
    let from: { readonly session: SessionId; readonly invocation: string; readonly ref: string; readonly reason: 'scope-review' | 'design-orientation' };
    if (point.kind === 'session') {
      const assigned = run.log.all('iteration-assigned').find(event => event.data.iteration === request.key.iteration);
      const taskAssigned = run.log.all('capability-assigned').find(event => event.data.assignment === request.key.iteration);
      const invocation = assigned?.data.invocation ?? taskAssigned?.data.invocation;
      if (invocation === undefined) throw new EvidenceUnavailableError(`No assignment of ${request.key.iteration} is recorded`);
      from = { session: point.session as SessionId, invocation, ref: point.ref, reason: 'scope-review' };
    } else {
      const orientation = await this.orientation(run, agent, loaded, request, guidance);
      if (orientation.outcome !== 'oriented' || orientation.session === null || orientation.invocation === null || orientation.ref === null) {
        return fresh(`The design orientation is unavailable: ${orientation.reason ?? 'no retained point'}`);
      }
      from = { session: orientation.session as SessionId, invocation: orientation.invocation, ref: orientation.ref, reason: 'design-orientation' };
    }
    const source = this.sessionsOf(run)?.get(from.session);
    if (source === undefined) return fresh('The captured review session is unavailable');
    if (!source.invocations.includes(from.invocation) || source.awaiting === from.invocation) throw new EvidenceUnavailableError(`${from.session} has not reached the end of ${from.invocation}`);
    const outcome = this.effectiveInvocationOutcome(run, from.invocation);
    if (outcome?.session?.ref !== from.ref) return fresh('The captured review point is unavailable; using the ordinary review question');
    if (!await (await this.operations(agent)).hasPoint(run.record.jobId, from.ref)) {
      if (from.reason === 'scope-review') return fresh('The captured assignment point is unavailable; reconstructing the complete scope review packet');
      return fresh('The recorded design orientation is unavailable');
    }
    const ended = run.log.all('invocation-ended').find(event => event.data.invocation === from.invocation)?.sequence ?? 0;
    const briefs = run.log.all('brief-appended')
      .filter(event => event.data.session === from.session && event.sequence < ended)
      .map(event => event.data.decision);
    return {
      start: { mode: 'fork', from: from.ref },
      fork: { from: { session: from.session, invocation: from.invocation }, reason: from.reason, briefs },
    };
  }

  /**
   * The design orientation of a request's guidance selection: the one the
   * log records for its key, or one made now, once, by a reviewer session
   * that reads the guidance and is kept. A failed orientation is recorded
   * too, so the run does not pay for it twice; its dependent design reviews
   * use their ordinary fresh task inputs.
   */
  private async orientation(run: Run, agent: AgentPort, loaded: LoadedPackage, request: ReviewRequest, guidance: readonly CapturedInput[]): Promise<ReviewOrientation> {
    const key = request.forkPoint.kind === 'orientation' ? request.forkPoint.key : '';
    const recorded = this.recordedOrientation(run, key);
    if (recorded !== undefined) return recorded;
    if (run.log.all('review-orientation-recorded').some(event => event.data.key === key)) return {
      schema: 'ramify-agent.review-orientation/1', key, guidance: request.guidance, request: request.id,
      outcome: 'failed', session: null, invocation: null, ref: null, summary: null, reason: 'The recorded design orientation is unreadable',
    };
    let making = run.orienting.get(key);
    if (making === undefined) {
      making = this.orient(run, agent, loaded, request, key, guidance);
      run.orienting.set(key, making);
    }
    return await making;
  }

  private recordedOrientation(run: Run, key: string): ReviewOrientation | undefined {
    if (run.log.all('review-orientation-recorded').every(event => event.data.key !== key)) return undefined;
    try {
      const parsed = reviewOrientationSchema.safeParse(this.committedBody(run, reviewLayout.orientation(key)));
      return parsed.success ? parsed.data : undefined;
    } catch { return undefined; }
  }

  private async orient(run: Run, agent: AgentPort, loaded: LoadedPackage, request: ReviewRequest, key: string, guidance: readonly CapturedInput[]): Promise<ReviewOrientation> {
    const policy = run.policy.reviews!;
    const workspace = join(dirname(reviewLayout.orientation(key)), key.slice(0, 16));
    await mkdir(run.path(workspace), { recursive: true });
    // The orientation is its own invocation, built from its inputs by its
    // own constructor, which `step render` uses too.
    const step = constructDesignOrientationStep({
      schema: stepInputsSchemaId, role: 'reviewer', question: 'design-orientation', run: { planId: run.record.planId, runId: run.record.jobId },
      work: { workItem: request.workItem, iteration: request.key.iteration }, attempt: 1, capabilityWorkflow: this.workflow !== null,
      limits: run.policy.limits, context: contextPolicyOf(run.policy, 'reviewer'), request: request.id, key,
      guidance: guidance.map(({ ref, hash, text }) => ({ ref, hash, text })), workspace: { run: workspace }, bounds: { absoluteMs: policy.attemptMs },
      architectView: this.coordination(run).architectViewInputs(), start: { kind: 'fresh' },
    }, { projectRoot: this.projectRoot, packages: new Map([['reviewer', loaded]]) });
    const result = await this.runInvocation<OrientationSubmission>(run, agent, {
      recoveryReviewRequest: request.id,
      role: step.role,
      brief: step.brief,
      context: step.context,
      stepInputs: step.before.inputs,
      work: step.work,
      attempt: step.attempt,
      loaded: step.loaded,
      systemPrompt: step.systemPrompt,
      prompt: step.prompt,
      start: { mode: 'fresh' },
      toolName: step.submission.toolName,
      description: step.submission.description,
      inputSchema: step.submission.inputSchema,
      submissionSchema: step.submission.submissionSchema,
      validate: step.validate,
      // The orientation is retained: every design review of its key forks it.
      keep: ended => (ended === 'submitted' ? kept : finished('not-kept')),
      scope: { write: null, measurement: null, size: null },
      reader: true,
      workingDirectory: step.equipment.workingDirectory,
      absoluteMs: step.bounds.absoluteMs,
      equip: () => ({ builtinTools: [...step.equipment.builtinTools], tools: [] }),
    });
    const oriented = result.ended === 'submitted' && result.value !== undefined && result.ref !== '';
    const orientation = reviewOrientationSchema.parse({
      schema: 'ramify-agent.review-orientation/1',
      key,
      guidance: guidance.map(({ ref, hash }) => ({ ref, hash })),
      request: request.id,
      invocation: result.id === '' ? null : result.id,
      session: result.session === '' ? null : result.session,
      ref: oriented ? result.ref : null,
      outcome: oriented ? 'oriented' : 'failed',
      summary: oriented ? result.value!.summary : null,
      reason: oriented ? null : `The orientation ended ${result.ended}${result.interruption === undefined ? '' : ` (${result.interruption})`}`,
    } satisfies ReviewOrientation);
    if (!this.closed) {
      await this.write(run, {
        type: 'review-orientation-recorded',
        data: { key, request: request.id, invocation: orientation.invocation, session: orientation.session, outcome: orientation.outcome },
      }, [{ path: reviewLayout.orientation(key), id: key, revision: 1, body: orientation }]);
    }
    return orientation;
  }

  /**
   * Commits one terminal attempt: its record, its valid submission and one
   * report per concern, as one line through the CheckFinding transition. A
   * request already settled or an attempt already finished is fenced, and a
   * terminal run refuses it; neither appends anything. A concern set the
   * transition refuses leaves the attempt not verified, never clean.
   */
  private async finishReview(
    run: Run,
    request: ReviewRequest,
    attempt: Omit<ReviewAttempt, 'schema' | 'result' | 'settles' | 'checkFindings' | 'finishedAt'>,
    result: ReviewResult,
    settles: boolean,
    submission?: ReviewSubmission,
    bindings: readonly ConcernBinding[] = [],
  ): Promise<'committed' | 'fenced'> {
    return finishReview(run, () => this.now(), request, attempt, result, settles, submission, bindings);
  }

  /** Finishes unsettled requests. A durable accepted reader submission is
   * completed first; only a turn with no accepted result becomes not verified. */
  private async finishUnsettledReviews(
    run: Run,
    why: (request: ReturnType<typeof unsettledRequests>[number], running: boolean) => { readonly reason: NotVerifiedReason; readonly detail: string },
    only?: readonly string[],
  ): Promise<string[]> {
    const finishedIds: string[] = [];
    for (const state of unsettledRequests(run.log.events)) {
      if (only !== undefined && !only.includes(state.id)) continue;
      const body = this.committedBody(run, reviewLayout.request(state.id));
      const parsed = reviewRequestSchema.safeParse(body);
      if (!parsed.success) {
        this.warn(`Run ${run.record.jobId}: review request ${state.id} cannot be read, so it was left unsettled`);
        continue;
      }
      const accepted = await this.recoverAcceptedReview(run, parsed.data, state);
      if (accepted !== null) {
        if (accepted) finishedIds.push(state.attempts.at(-1)!.id);
        continue;
      }
      const open = state.attempts.find(entry => entry.started !== null && entry.finished === null);
      const { reason, detail } = why(state, open !== undefined);
      const attempt = open?.id ?? reviewAttemptId(state.id, state.attempts.length + 1);
      const outcome = await this.finishReview(run, parsed.data, {
        id: attempt,
        request: state.id,
        queuedAt: state.attempts.filter(entry => entry.id !== attempt).at(-1)?.finished?.at ?? state.recordedAt,
        startedAt: open?.started?.at ?? null,
        invocation: open?.started?.invocation ?? null,
        session: (open?.started?.session ?? null) as SessionId | null,
        requestedStart: requestedStartOf(parsed.data),
        actualStart: null,
      }, { result: 'not-verified', reason, detail }, true);
      if (outcome === 'committed') finishedIds.push(attempt);
    }
    return finishedIds;
  }

  /** Waits for every admitted review; only explicit stop or shutdown cancels readers. */
  private async settleReviews(run: Run): Promise<void> {
    if (run.policy.reviews === undefined || run.reviews === undefined) return;
    run.reviews.wake();
    await run.reviews.settled();
  }

  /** Keeps a work item's requests pending until their actual outcomes or an explicit stop. */
  private async settleWorkItemReviews(run: Run, workItem: string): Promise<boolean> {
    const queue = run.reviews;
    if (run.policy.reviews === undefined || queue === undefined) return !this.ignoring(run);
    for (;;) {
      if (this.ignoring(run)) return false;
      const ended = queue.changed();
      const stopped = run.changed();
      if (unsettledRequests(run.log.events).every(request => request.workItem !== workItem)) return true;
      queue.wake();
      await Promise.race([ended, stopped]);
    }
  }

  /** The run's review requests and coverage, from its log; undefined for an unknown run. */
  reviews(planId: string, runId: string, workItem?: string): { readonly coverage: ReviewCoverage; readonly requests: ReturnType<typeof unsettledRequests> } | undefined {
    this.refuseEarlierPolicy(planId, runId);
    const run = this.runs.get(key(planId, runId));
    if (run === undefined) return undefined;
    const requests = [...reviewStateOf(run.log.events).values()].filter(request => workItem === undefined || request.workItem === workItem);
    return { coverage: reviewCoverage(run.policy, run.log.events, workItem), requests };
  }

  // Reconciliation

  /**
   * The work item's review requests and attention set as the log stands:
   * each settled request with the attempt that settled it, the requests
   * still unsettled, every open CheckFinding of the work item in attention
   * order, and the revision of every one of its CheckFindings. This version
   * evaluates no revisit condition, so no deferral is due.
   */
  private basisState(run: Run, workItem: string): {
    readonly requests: BasisRequest[];
    readonly unsettled: string[];
    readonly attention: Map<CheckFindingId, AttentionEntry>;
    readonly revisions: Map<CheckFindingId, number>;
    readonly due: CheckFindingId[];
    readonly state: CheckFindingState;
  } {
    const requests: BasisRequest[] = [];
    const unsettled: string[] = [];
    for (const request of reviewStateOf(run.log.events).values()) {
      if (request.workItem !== workItem) continue;
      const settling = request.attempts.find(attempt => attempt.id === request.settledBy)?.finished;
      if (request.settledBy === null || settling == null) unsettled.push(request.id);
      else requests.push({ request: request.id, attempt: request.settledBy, result: settling.result });
    }
    const state = checkFindingStateOf(run.log.ledger);
    const due: CheckFindingId[] = [];
    const attention = new Map<CheckFindingId, AttentionEntry>();
    for (const summary of this.ownerCheckFindings(state, workItem, 'attention', due)) {
      attention.set(summary.id, { revision: summary.revision, reason: summary.reason, awaiting: summary.awaiting, risk: summary.risk, modules: summary.modules });
    }
    const revisions = new Map(this.ownerCheckFindings(state, workItem, 'all').map(summary => [summary.id, summary.revision]));
    return { requests, unsettled, attention, revisions, due, state };
  }

  /** Every CheckFinding of one work item the query selects, all pages, in attention order. */
  private ownerCheckFindings(state: CheckFindingState, workItem: string, select: 'attention' | 'all', due: readonly CheckFindingId[] = []): CheckFindingSummary[] {
    const items: CheckFindingSummary[] = [];
    let after: CheckFindingId | null = null;
    for (;;) {
      const page = selectCheckFindings(state, {
        kind: 'list', owner: { kind: 'work-item', workItem }, select, due: [...due], after, limit: 100, order: 'attention',
      });
      if (!page.ok || page.view.kind !== 'list') return items;
      items.push(...page.view.items);
      if (page.view.next === null) return items;
      after = page.view.next;
    }
  }

  /** The `outline-revised` that commits the work item's latest completion request. */
  private latestCompletion(run: Run, workItem: string): RunEventOf<'outline-revised'> | undefined {
    return run.log.all('outline-revised').filter(event => event.data.workItem === workItem && event.data.architectRef !== undefined).at(-1);
  }

  /** The reconciliation of the work item's latest round, whose basis a completion's unresolved reasons are read against. */
  private latestBasis(run: Run, workItem: string): ReconciliationBasis | undefined {
    const started = run.log.all('reconciliation-started').filter(event => event.data.workItem === workItem).at(-1);
    if (started === undefined) return undefined;
    const parsed = reconciliationBasisSchema.safeParse(this.committedBody(run, reconciliationLayout.basis(started.data.reconciliation)));
    return parsed.success ? parsed.data : undefined;
  }

  /**
   * The reconciliation whose repair intent the work item's next assignment
   * resolves: its latest assessment, where that chose a correction and no
   * assignment has resolved it yet.
   */
  private pendingCorrection(run: Run, workItem: string): string | undefined {
    return pendingCorrection(coordinationHistory(run.log), workItem);
  }

  /**
   * Reconciles one work item that requested completion (appendix §6): its
   * reviews settle, any user decision it waits for is answered, and its
   * attention set is captured. An empty set goes to the work item's gate
   * with no agent call. Otherwise one round forks the module architect at
   * its completion request, and the assessment it
   * commits leads to the gate, to a correction, or to a user decision and
   * another round. A refused basis or a fork that returns nothing is another
   * round. Null once the run has ended.
   */
  private async reconcileWorkItem(run: Run, agent: AgentPort, loaded: LoadedPackage, item: WorkItem, parent: ParentSession,
    owner: ReconciliationOwner = { id: item.id, role: 'local-architect' }): Promise<Reconciled | null> {
    for (;;) {
      if (!await this.settleWorkItemReviews(run, owner.id)) return null;
      if (!await this.awaitUserDecisions(run, owner.id)) return null;
      // A committed correction remains the next action across interruption.
      // Its repair intent can remove findings from the attention set, but that
      // does not make the original completion request ready for its gate.
      const correction = this.pendingCorrection(run, owner.id);
      if (correction !== undefined) return { kind: 'correct', reconciliation: correction };
      const commit = this.coordination(run).accepted();
      const captured = this.basisState(run, owner.id);
      const rounds = run.log.all('reconciliation-started').filter(event => event.data.workItem === owner.id).length;
      const gate = (decided: boolean): Reconciled => ({
        kind: 'gate',
        basis: { commit, requests: captured.requests, checkFindings: attentionAt(captured.attention), decided },
      });
      // Nothing needs the architect's disposition; the gate follows.
      if (captured.attention.size === 0) return gate(false);
      if (rounds > 0 && !needsLaterRound(captured.attention.values())) return gate(true);

      let tree: string;
      try {
        tree = await this.candidates.commitTree(this.projectRoot, commit);
      } catch (error) {
        await this.fail(run, 'internal', `The audited source ${commit} of ${owner.id}'s reconciliation could not be read: ${message(error)}`);
        return null;
      }
      const basis = await this.startReconciliation(run, owner.id, rounds + 1, { commit, tree }, captured, owner.completion);
      if (basis === 'ended') return null;
      if (basis === 'stale') continue;
      const assessed = await this.assessReconciliation(run, agent, loaded, item, owner, basis, captured.attention, parent);
      if (assessed === null) return null;
      if (assessed.kind === 'refused') {
        await this.write(run, { type: 'reconciliation-refused', data: { workItem: owner.id, reconciliation: basis.id, stage: 'assessment', reason: assessed.reason } });
        if (this.ignoring(run)) return null;
        continue;
      }
      if (assessed.next === 'correct') return { kind: 'correct', reconciliation: basis.id };
      if (assessed.next === 'await-user') continue;
      const after = this.basisState(run, owner.id);
      return { kind: 'gate', basis: { commit, requests: after.requests, checkFindings: attentionAt(after.attention), decided: true } };
    }
  }

  /**
   * Commits one round's `reconciliation-started` with its basis, after
   * checking under the mutex that what was captured still holds. Stale when
   * it does not, and nothing is appended.
   */
  private async startReconciliation(
    run: Run,
    workItem: string,
    round: number,
    source: { readonly commit: string; readonly tree: string },
    captured: ReturnType<AutonomousRunService['basisState']>,
    completion?: ReconciliationOwner['completion'],
  ): Promise<ReconciliationBasis | 'stale' | 'ended'> {
    const id = reconciliationId(workItem, round);
    const pinned = completion === undefined ? this.latestCompletion(run, workItem)?.data.architectRef : completion;
    const forkPoint: ForkPoint = pinned === undefined || pinned === null
      ? { kind: 'unavailable', reason: pinned === null ? 'The module architect\'s session was not kept after its completion request' : 'No completion request of this work item recorded the module architect\'s point' }
      : { kind: 'session', session: pinned.session, ref: pinned.ref };
    const basis = reconciliationBasisSchema.parse({
      schema: 'ramify-agent.reconciliation-basis/1',
      id,
      workItem,
      round,
      source,
      requests: captured.requests,
      checkFindings: attentionAt(captured.attention),
      due: captured.due,
      applied: captured.state.applied,
      forkPoint,
      floor: 'any',
    } satisfies ReconciliationBasis);
    return await run.mutex.run(async () => {
      if (run.log.terminal !== undefined) return 'ended' as const;
      const now = this.basisState(run, workItem);
      const changed = this.coordination(run).accepted() !== source.commit
        || basisChange(basis, { source, requests: now.requests, unsettled: now.unsettled, revisions: now.revisions }) !== null
        || attentionAt(now.attention).some(entry => !basis.checkFindings.some(held => held.checkFinding === entry.checkFinding))
        || run.log.all('reconciliation-started').some(event => event.data.reconciliation === id);
      if (changed) return 'stale' as const;
      await commitRecord(run.log.ledger, {
        event: run.log.next({ type: 'reconciliation-started', data: { workItem, reconciliation: id, round } }),
        records: [{ path: reconciliationLayout.basis(id), id, revision: 1, body: basis }],
      });
      return basis;
    });
  }

  /**
   * Waits while a CheckFinding of the work item awaits a user's answer: the
   * answer is what the next round assesses. A stop or the service closing
   * ends the wait. Answers false once the run has ended.
   */
  private async awaitUserDecisions(run: Run, workItem: string): Promise<boolean> {
    for (;;) {
      if (this.ignoring(run)) return false;
      // Registered before the state is read, so an answer in between still wakes it.
      const changed = run.changed();
      const pending = [...checkFindingStateOf(run.log.ledger).findings.values()]
        .some(entry => sameWorkItem(entry.owner, workItem) && entry.pendingUserDecision !== null);
      if (!pending) return true;
      await changed;
    }
  }

  /**
   * Where a reconciliation's fork starts: the module architect's point after
   * its completion request, or fresh with the complete packet and the reason
   * where that point is missing or unusable.
   */
  private async reconciliationStart(run: Run, agent: AgentPort, basis: ReconciliationBasis, completion: { readonly session: SessionId; readonly invocation: string } | undefined): Promise<{
    readonly start: SessionStart;
    readonly fork?: ForkRelation | undefined;
    readonly degraded?: { readonly requested: 'fork'; readonly reason: string } | undefined;
  }> {
    const fresh = (reason: string) => ({ start: { mode: 'fresh' } as const, degraded: { requested: 'fork' as const, reason } });
    const point = basis.forkPoint;
    if (point.kind !== 'session') return fresh(point.kind === 'unavailable' ? point.reason : 'No point of the module architect was captured');
    if (completion === undefined) return fresh('No completion request of this work item is recorded');
    const from = { session: point.session as SessionId, invocation: completion.invocation };
    const source = this.sessionsOf(run)?.get(from.session);
    if (source === undefined) return fresh('The captured review session is unavailable');
    if (!source.invocations.includes(from.invocation) || source.awaiting === from.invocation) throw new EvidenceUnavailableError(`${from.session} has not reached the end of ${from.invocation}`);
    const outcome = this.effectiveInvocationOutcome(run, from.invocation);
    if (outcome?.session?.ref !== point.ref) return fresh('The captured completion point is unavailable; using the ordinary reconciliation task');
    if (!await (await this.operations(agent)).hasPoint(run.record.jobId, point.ref)) return fresh('The recorded completion session point is unavailable; reconstructing the complete reconciliation packet');
    const ended = run.log.all('invocation-ended').find(event => event.data.invocation === from.invocation)?.sequence ?? 0;
    const briefs = run.log.all('brief-appended')
      .filter(event => event.data.session === from.session && event.sequence < ended)
      .map(event => event.data.decision);
    return { start: { mode: 'fork', from: point.ref }, fork: { from, reason: 'reconciliation', briefs } };
  }

  /** The one bounded packet of a round, from the log and the CheckFinding state. */
  private reconciliationPacket(run: Run, item: WorkItem, owner: ReconciliationOwner, basis: ReconciliationBasis, state: CheckFindingState): ReconciliationPacket {
    const reviews = reviewStateOf(run.log.events);
    const requests: PacketRequest[] = basis.requests.map(entry => {
      const request = reviews.get(entry.request);
      const attempt = entry.attempt === null ? undefined : reviewAttemptSchema.safeParse(this.committedBody(run, reviewLayout.attempt(entry.attempt)));
      return {
        request: entry.request,
        kind: request?.kind ?? 'unknown',
        iteration: request?.iteration ?? 'unknown',
        candidate: request?.candidate ?? 'unknown',
        attempt: entry.attempt,
        result: attempt?.success === true ? resultText(attempt.data.result) : entry.result,
      };
    });
    const attention = basis.checkFindings.flatMap(entry => {
      const detail = selectCheckFindings(state, { kind: 'detail', checkFinding: entry.checkFinding });
      return detail.ok && detail.view.kind === 'detail' ? [detail.view] : [];
    });
    const inBasis = new Set(basis.checkFindings.map(entry => entry.checkFinding));
    const ordinaryIterations = run.log.all('iteration-assigned').filter(event => event.data.workItem === owner.id).map(event => {
      const number = Number.parseInt(event.data.iteration.slice(event.data.iteration.lastIndexOf('.i') + 2), 10);
      const assignment = iterationAssignmentSchema.safeParse(this.committedBody(run, iterationLayout.assignment(item.id, number)));
      const closed = run.log.all('iteration-closed').find(entry => entry.data.iteration === event.data.iteration);
      return { id: event.data.iteration, goal: assignment.success ? assignment.data.goal : '(its assignment could not be read)', outcome: closed?.data.outcome ?? null };
    });
    const taskIterations = owner.role !== 'capability-architect' ? [] : [...committedRecords(run.log.ledger.replay()).assignments.values()]
      .filter(entry => entry.coordination?.kind === 'capability-task' && entry.coordination.id === owner.id)
      .sort((a, b) => (a.coordination?.kind === 'capability-task' ? a.coordination.sequence : 0) -
        (b.coordination?.kind === 'capability-task' ? b.coordination.sequence : 0))
      .map(entry => ({ id: entry.id, goal: entry.goal,
        outcome: committedRecords(run.log.ledger.replay()).results.get(entry.id)?.outcome ?? null }));
    const earlier = run.log.all('reconciliation-assessed').filter(event => event.data.workItem === owner.id).flatMap(event => {
      const record = reconciliationAssessmentSchema.safeParse(this.committedBody(run, reconciliationLayout.assessment(event.data.reconciliation)));
      return record.success ? [{ id: record.data.id, next: record.data.next, brief: record.data.submission.brief }] : [];
    });
    return {
      basis,
      module: item.module,
      owner: owner.role === 'capability-architect' ? 'capability task' : 'work item',
      ...(owner.role === 'capability-architect' ? { capabilityContext: { consumer: item.module, provider: owner.provider ?? 'unknown' } } : {}),
      requests,
      attention,
      others: this.ownerCheckFindings(state, owner.id, 'all').filter(summary => !inBasis.has(summary.id)),
      iterations: owner.role === 'capability-architect' ? taskIterations : ordinaryIterations,
      earlier,
      refused: run.log.all('reconciliation-refused').filter(event => event.data.workItem === owner.id)
        .map(event => ({ reconciliation: event.data.reconciliation, reason: event.data.reason })),
    };
  }

  /**
   * One round's fork: the packet, a submission validated against the basis
   * and the CheckFinding rules, and its commit. Refused when the fork ends
   * without an assessment or its basis no longer holds when it commits; null
   * once the run has ended.
   */
  private async assessReconciliation(
    run: Run,
    agent: AgentPort,
    loaded: LoadedPackage,
    item: WorkItem,
    owner: ReconciliationOwner,
    basis: ReconciliationBasis,
    attention: ReadonlyMap<CheckFindingId, AttentionEntry>,
    parent: ParentSession,
  ): Promise<{ readonly kind: 'refused'; readonly reason: string } | { readonly kind: 'assessed'; readonly next: ReconciliationAssessment['next'] } | null> {
    const ordinaryCompletion = owner.completion === undefined ? this.latestCompletion(run, owner.id) : undefined;
    const completion = owner.completion ?? (ordinaryCompletion?.data.architectRef == null ? undefined
      : { session: ordinaryCompletion.data.architectRef.session, invocation: ordinaryCompletion.data.invocation });
    const start = await this.reconciliationStart(run, agent, basis, completion);
    const state = checkFindingStateOf(run.log.ledger);
    const held = new Map(this.ownerCheckFindings(state, owner.id, 'all').map(summary => [summary.id, summary.revision]));
    const evidence = await readAcceptedEvidence(run.directory, run.record.manifest, acceptedAnalysisReferences(run.log.events));
    let invocation: string | undefined;
    let bound: BoundReconciliation | undefined;
    const result = await this.runInvocation<ReconciliationSubmission>(run, agent, {
      role: owner.role,
      task: { kind: 'reconciliation', goal: item.goal, requirements: [JSON.stringify(basis)], modules: [item.module],
        literalSections: [{ key: 'support:work-item-package', text: (await this.coordination(run).currentSelection(item.id))?.packageText
          ?? this.coordination(run).planPackage(await this.coordination(run).frozenCatalog(), [...item.requirementRefs, ...item.acceptanceRefs, ...item.contextRefs]) }] },
      work: owner.role === 'capability-architect' ? { capabilityTask: owner.id, request: owner.request } : { workItem: owner.id },
      attempt: basis.round,
      loaded,
      systemPrompt: renderReconciliationPrompt(loaded, this.projectRoot, parent.workingDirectory),
      prompt: reconciliationMessage(this.reconciliationPacket(run, item, owner, basis, state)),
      // The fork keeps the parent's working directory: its tools read where the architect read.
      workingDirectory: parent.workingDirectory,
      start: start.start,
      ...(start.fork === undefined ? {} : { fork: start.fork }),
      ...(start.degraded === undefined ? {} : { degraded: start.degraded }),
      toolName: reconciliationToolName,
      description: reconciliationSubmissionDescription,
      inputSchema: reconciliationJsonSchema,
      submissionSchema: 'ramify-agent.reconciliation-submission/1',
      validate: async input => {
        const checked = await validateReconciliation(input, {
          id: basis.id,
          workItem: owner.id,
          module: item.module,
          attention,
          held,
          actor: { kind: 'agent', role: owner.role, invocation: invocation ?? 'none' },
          source: { kind: 'tree', id: basis.source.tree },
          evidence: submission => [{
            kind: 'reconciliation-submission',
            ref: runLayout.submission(invocation ?? 'none'),
            hash: `sha256:${sha256(canonicalJson(submission))}`,
          }],
          document: async path => {
            // An element of the frozen catalog is cited by its ID, at the catalog's hash.
            if (elementIdSchema.safeParse(path).success) {
              const element = evidence.status === 'available' ? evidence.catalog.elements.find(candidate => candidate.id === path) : undefined;
              return element === undefined || evidence.status !== 'available' ? null : { text: element.text, revision: `sha256:${evidence.catalogHash}` };
            }
            try {
              const entry = (await this.candidates.treeEntries(this.projectRoot, basis.source.commit)).find(entry => entry.path === path);
              if (!entry) return null;
              return { text: new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(
                await readVerifiedTextBlobBytes(this.projectRoot, basis.source.commit, entry, this.candidates)), revision: basis.source.commit };
            } catch {
              return null;
            }
          },
          decide: command => {
            const now = this.basisState(run, owner.id);
            if (basisChange(basis, { source: basis.source, requests: now.requests, unsettled: now.unsettled, revisions: now.revisions }) !== null) return null;
            const change = decideCheckFindingChange(now.state, command);
            return change.ok ? null : change.rejection;
          },
        });
        if (!checked.ok) return checked;
        bound = checked.value;
        return { ok: true, value: checked.value.submission };
      },
      // A fork is never continued: its brief is what reaches the architect's own session.
      keep: () => finished('not-kept'),
      scope: { write: null, measurement: null, size: null },
      onStarted: async id => { invocation = id; },
    });
    if (this.ignoring(run)) return null;
    if (result.ended !== 'submitted' || result.value === undefined || bound === undefined || invocation === undefined) {
      return { kind: 'refused', reason: `The reconciliation fork${result.id === '' ? '' : ` ${result.id}`} ended without an assessment (${result.ended})` };
    }
    return await this.commitAssessment(run, agent, basis, {
      invocation,
      session: result.session,
      requestedStart: start.start.mode === 'fork' || start.degraded !== undefined ? 'fork' : 'fresh',
      actualStart: result.actual === undefined ? null : result.actual === 'fork' ? 'fork' : 'fresh',
      bound,
    }, parent);
  }

  /**
   * Commits one assessment and appends its brief to the module architect's
   * session, as the ledger's external effect keyed `brief:<reconciliation>`:
   * the intent is `reconciliation-assessed` with its record and every
   * CheckFinding event, decided under the mutex against the basis as it
   * stands; the effect is the append; the completion says what the append
   * did. The decisions are durable before any append, and a repeat after a
   * crash appends the same key once.
   */
  private async commitAssessment(
    run: Run,
    agent: AgentPort,
    basis: ReconciliationBasis,
    fork: {
      readonly invocation: string;
      readonly session: SessionId;
      readonly requestedStart: 'fresh' | 'fork';
      readonly actualStart: 'fresh' | 'fork' | null;
      readonly bound: BoundReconciliation;
    },
    parent: ParentSession,
  ): Promise<{ readonly kind: 'refused'; readonly reason: string } | { readonly kind: 'assessed'; readonly next: ReconciliationAssessment['next'] }> {
    const { submission, commands, conflicts } = fork.bound;
    const parentRef = parent.session !== undefined && parent.ref !== undefined ? { session: parent.session, ref: parent.ref } : null;
    let record: ReconciliationAssessment | undefined;
    let appended: BriefAppend;
    try {
      appended = await run.log.ledger.effect<BriefAppend>({
        key: `brief:${basis.id}`,
        serialize: work => run.mutex.run(work),
        intent: () => {
          const decided = decideCheckFindingTransaction(run.log, ({ log }) => {
            if (log.all('reconciliation-assessed').some(event => event.data.reconciliation === basis.id)) return { stale: `${basis.id} is already assessed` };
            const latest = log.all('reconciliation-started').filter(event => event.data.workItem === basis.workItem).at(-1);
            if (latest?.data.reconciliation !== basis.id) return { stale: `${basis.id} is not the work item's latest round` };
            const now = this.basisState(run, basis.workItem);
            const stale = this.coordination(run).accepted() !== basis.source.commit
              ? `the accepted source is ${this.coordination(run).accepted()}, not ${basis.source.commit}`
              : basisChange(basis, { source: basis.source, requests: now.requests, unsettled: now.unsettled, revisions: now.revisions });
            if (stale !== null) return { stale };
            return {
              commands: commands.length === 0 ? [] : [{ type: 'assess', commands: [...commands] }],
              compose: decided => {
                const events = decided.events;
                record = reconciliationAssessmentSchema.parse({
                  schema: 'ramify-agent.reconciliation-assessment/1',
                  id: basis.id,
                  workItem: basis.workItem,
                  round: basis.round,
                  invocation: fork.invocation,
                  session: fork.session,
                  requestedStart: fork.requestedStart,
                  actualStart: fork.actualStart,
                  submission,
                  conflicts,
                  next: submission.next.kind,
                  checkFindings: [...new Set(decided.outcomes.flatMap(outcome => outcome.touched))],
                  decisions: events.flatMap(event => (event.type === 'check-finding-decided' ? [event.data.decision.id] : [])),
                  relations: events.flatMap(event => (event.type === 'check-finding-related' ? [event.data.relation.id] : [])),
                  parent: parentRef,
                  brief: reconciliationBrief({ id: basis.id, round: basis.round, source: basis.source, submission, events }),
                } satisfies ReconciliationAssessment);
                return {
                  event: {
                    type: 'reconciliation-assessed',
                    data: { workItem: basis.workItem, reconciliation: basis.id, invocation: fork.invocation, next: submission.next.kind, checkFindings: [...events] },
                  },
                  records: [{ path: reconciliationLayout.assessment(basis.id), id: basis.id, revision: 1, body: record }],
                };
              },
            };
          }, this.now());
          if (decided.kind === 'transaction') return decided.transaction;
          throw new AssessmentRefusedError(decided.kind === 'refused' ? decided.refusal.message : `${basis.id} decided nothing new`);
        },
        perform: key => this.appendReconciliationBrief(agent, key, parentRef, record!.brief),
        complete: result => ({
          event: run.log.next({ type: 'reconciliation-brief-appended', data: { reconciliation: basis.id, ...result } }),
          records: [],
        }),
      });
    } catch (error) {
      if (error instanceof AssessmentRefusedError) return { kind: 'refused', reason: error.message };
      // The ledger measures a line before writing any of it.
      if (error instanceof RangeError) return { kind: 'refused', reason: `The assessment does not fit one ledger line: ${error.message}` };
      throw error;
    }
    await this.afterBriefAppend(run, basis.id, appended, record!.brief, parent);
    return { kind: 'assessed', next: record!.next };
  }

  /**
   * The brief's append to the module architect's session. A lost session, a
   * failure and no session are outcomes, never thrown. A conflict, such as an
   * append while the session's turn is active, is a failure of this append
   * alone: the session is intact and the brief reaches its next input.
   */
  private async appendReconciliationBrief(agent: AgentPort, key: string, parent: ArchitectRef | null, brief: string): Promise<BriefAppend> {
    if (parent === null) return { session: null, ref: null, outcome: 'no-session', reason: 'The module architect\'s session was not kept after its completion request' };
    try {
      const answer = await (await this.operations(agent)).append(parent.ref, key, brief);
      if (answer.outcome === 'session-lost') return { session: parent.session, ref: null, outcome: 'session-lost', reason: 'The module architect\'s session can no longer be read' };
      if (answer.outcome === 'conflict') return { session: parent.session, ref: null, outcome: 'failed', reason: `The module architect's session did not take the brief: ${answer.reason}` };
      return { session: parent.session, ref: answer.ref, outcome: answer.outcome, reason: null };
    } catch (error) {
      return { session: parent.session, ref: null, outcome: 'failed', reason: message(error) };
    }
  }

  /**
   * What the architect's own session holds after the append: the point its
   * next turn continues from, the note in its transcript, or, where the
   * append did not land, the brief its next input carries from the log. Only
   * a session that can no longer be read is finished as lost; a conflict
   * leaves it in place.
   */
  private async afterBriefAppend(run: Run, reconciliation: string, appended: BriefAppend, brief: string, parent: ParentSession): Promise<void> {
    if (appended.outcome === 'appended' || appended.outcome === 'already-present') {
      parent.ref = appended.ref ?? parent.ref;
      const session = appended.session;
      if (appended.outcome === 'appended' && session !== null) {
        await recordAppend(this.transcriptOf(run, session), { kind: 'note-appended', text: brief }, null)
          .catch(error => this.warn(`Run ${run.record.jobId}: the brief of ${reconciliation} is missing from ${session}'s transcript: ${message(error)}`));
      }
      return;
    }
    parent.undelivered.push(reconciliation);
    if (appended.outcome === 'session-lost') {
      await this.finishSession(run, parent.session, 'lost');
      parent.session = undefined;
      parent.ref = undefined;
    }
  }

  /**
   * What the module architect's next turn is told of a reconciliation: the
   * correction it chose with the CheckFindings planned for repair, and the
   * brief of every round whose append did not land, read from the log.
   */
  private reconciliationBriefing(run: Run, reconciliation: string, undelivered: readonly string[]): ReconciliationBriefing | undefined {
    const read = (id: string) => {
      const parsed = reconciliationAssessmentSchema.safeParse(this.committedBody(run, reconciliationLayout.assessment(id)));
      return parsed.success ? parsed.data : undefined;
    };
    const record = read(reconciliation);
    if (record === undefined) return undefined;
    const state = checkFindingStateOf(run.log.ledger);
    const repairs = [...state.findings.values()]
      .filter(entry => entry.standing === 'open' && entry.repair?.kind === 'intent' && entry.repair.ref === reconciliation)
      .map(entry => ({ checkFinding: entry.id, title: entry.reports[0]?.observation.summary ?? '' }));
    const briefs = undelivered.flatMap(id => {
      const undeliveredRecord = read(id);
      return undeliveredRecord === undefined ? [] : [undeliveredRecord.brief];
    });
    const failure = run.log.all('reconciliation-brief-appended').filter(event => undelivered.includes(event.data.reconciliation)).at(-1);
    return {
      id: reconciliation,
      next: record.next,
      ...(record.submission.next.kind === 'correct' ? { goal: record.submission.next.goal } : {}),
      repairs,
      ...(briefs.length === 0 ? {} : { brief: briefs.join('\n\n') }),
      ...(failure === undefined ? {} : { appendFailure: `${failure.data.outcome}${failure.data.reason === null ? '' : `: ${failure.data.reason}`}` }),
    };
  }

  /**
   * Commits `work-item-completed` where the completion basis still holds
   * (appendix §6): the gate audited the reconciled source or its scenario
   * rendering, every request of the work item is settled as the basis names
   * it, every basis CheckFinding is at its captured revision, and nothing
   * needing a disposition has become open. Where one of those fails,
   * completion is refused and recorded, and the caller reconciles again;
   * otherwise the work item completes, naming each
   * CheckFinding left open and why.
   */
  private capabilityBlockers(run: Run, workItem: string): string[] {
    return capabilityBlockersOf(coordinationHistory(run.log), workItem);
  }

  /** Shared completion check for a work item or bounded capability task. */
  private async completionBasisRefusal(run: Run, owner: string, gate: GateAttempt, basis: CompletionBasis): Promise<string | null> {
    const lineage = basis.decided ? await this.sourceLineage(run, basis.commit, gate.audited) : null;
    const now = this.basisState(run, owner);
    const rounds = run.log.all('reconciliation-started').filter(event => event.data.workItem === owner).length;
    const inBasis = new Set(basis.checkFindings.map(entry => entry.checkFinding));
    const raised = [...now.attention].filter(([id]) => !inBasis.has(id)).map(([, entry]) => entry);
    const hard = lineage ?? basisChange({ source: { commit: basis.commit, tree: '' }, requests: basis.requests, checkFindings: [] },
      { source: { commit: basis.commit, tree: '' }, requests: now.requests, unsettled: now.unsettled, revisions: now.revisions });
    if (hard !== null) return hard;
    const moved = basis.checkFindings.find(entry => now.revisions.get(entry.checkFinding) !== entry.revision);
    const soft = moved !== undefined
      ? `${moved.checkFinding} is at revision ${now.revisions.get(moved.checkFinding) ?? 'none'}, not ${moved.revision}`
      : raised.length > 0 ? `${raised.length === 1 ? 'a CheckFinding' : `${raised.length} CheckFindings`} became open after the basis` : null;
    const warranted = (entries: readonly AttentionEntry[]) => (rounds === 0 ? entries.length > 0 : needsLaterRound(entries));
    return soft !== null && warranted([...now.attention.values()]) ? soft : null;
  }

  private async completeWorkItem(run: Run, item: WorkItem, gate: GateAttempt, basis: CompletionBasis): Promise<'completed' | 'ended' | { readonly refused: string }> {
    const outcome = await run.mutex.run(async () => {
      if (run.log.terminal !== undefined) return 'ended' as const;
      if (this.workflow !== null) {
        const blockers = this.capabilityBlockers(run, item.id);
        if (blockers.length > 0) return { refused: blockers.join('; ') };
      }
      const refusal = await this.completionBasisRefusal(run, item.id, gate, basis);
      if (refusal !== null) return { refused: refusal };
      const now = this.basisState(run, item.id);
      const unresolved = this.unresolvedOf(run, item.id, now.state);
      await run.log.append({
        type: 'work-item-completed',
        data: { workItem: item.id, gate: gate.id, ...(unresolved.length === 0 ? {} : { unresolved }) },
      });
      return 'completed' as const;
    });
    if (typeof outcome === 'object') {
      await this.write(run, { type: 'reconciliation-refused', data: { workItem: item.id, reconciliation: this.latestBasis(run, item.id)?.id ?? null, stage: 'completion', reason: outcome.refused } });
    }
    return outcome;
  }

  /**
   * Each open CheckFinding of a completing work item, and why it is left
   * open: left open by the architect or opened after the latest basis.
   * Read under the mutex.
   */
  private unresolvedOf(run: Run, workItem: string, state: CheckFindingState): Array<{ readonly checkFinding: CheckFindingId; readonly reason: UnresolvedReason }> {
    const last = this.latestBasis(run, workItem);
    const inLast = new Set(last?.checkFindings.map(entry => entry.checkFinding) ?? []);
    return this.ownerCheckFindings(state, workItem, 'all').filter(summary => summary.standing === 'open').map(summary => ({
      checkFinding: summary.id,
      reason: !inLast.has(summary.id) ? 'raised-after-last-round' as const : 'left-open' as const,
    }));
  }

  /**
   * Why the gate's audited commit is not the reconciled source, or null when
   * it is, or when it differs from it only by the expected rendering of the
   * tracked feature files, byte for byte.
   */
  private async sourceLineage(run: Run, from: string, to: string | null): Promise<string | null> {
    if (to === null) return `the gate audited no commit, and the reconciled source is ${from}`;
    if (to === from) return null;
    try {
      const changes = await this.candidates.diffNameStatus(this.projectRoot, from, to);
      const tracked = trackedScenarios(run.log.ledger.replay());
      const expected = new Map(expectedFeatureHashes(expectedFeatureFiles(tracked, { planId: run.record.planId, runId: run.record.jobId }))
        .map(file => [file.path, file.hash]));
      for (const change of changes) {
        const hash = expected.get(change.path);
        if (hash === undefined) return `${change.path} changed between the reconciled source ${from} and the gate's ${to}, and only a rendered feature file may`;
        if (change.status === 'D' || featureContentHash(await this.candidates.readBlob(this.projectRoot, to, change.path)) !== hash) {
          return `${change.path} at ${to} is not its expected rendering`;
        }
      }
      return null;
    } catch (error) {
      return `the lineage from ${from} to ${to} could not be read: ${message(error)}`;
    }
  }

  // Loading and recovery

  private readonly refusedPolicies = new Map<string, string>();

  private refuseEarlierPolicy(planId: string, runId: string): void {
    const recorded = this.refusedPolicies.get(key(planId, runId));
    if (recorded !== undefined) throw new CommandRejection('unsupported-version', `Run policy ${recorded} is refused by ${capabilityRunPolicyVersion}; a fresh run is required`, undefined, [`plans/${planId}/.harness/jobs/${runId}/${runLayout.record}`]);
  }

  private async load(): Promise<RunRecoveryReport> {
    const report: RunRecoveryReport = { interrupted: [], rematerialized: [], effects: [], invocations: [], skipped: [], reviews: [], manual: [] };
    for (const { planId, jobId } of await listJobDirectories(this.projectRoot)) {
      const directory = runDirectory(this.projectRoot, planId, jobId);
      const recordPath = join(directory, runLayout.record);
      let run: Run;
      try {
        const document = await readIfExists(recordPath);
        if (document === undefined) continue;
        const parsed: unknown = JSON.parse(document.toString('utf8'));
        const kind = (parsed as { kind?: unknown } | null)?.kind;
        // A manual run has no drive and no phase progression: nothing of it
        // is executed or recovered, and its records are not touched.
        if (kind === 'manual') {
          report.manual.push(key(planId, jobId));
          continue;
        }
        if (kind !== 'implementation') continue;
        const policy = (parsed as { policy?: { version?: unknown } }).policy?.version;
        if (typeof policy !== 'string' || !supportedCapabilityPolicy(policy)) {
          const recorded = typeof policy === 'string' ? policy : '(missing policy)';
          this.refusedPolicies.set(key(planId, jobId), recorded);
          this.restartUnavailable.set(key(planId, jobId), `Unsupported retained run policy ${recorded}`);
          report.skipped.push(key(planId, jobId));
          this.warn(`Run policy ${recorded} is refused by ${capabilityRunPolicyVersion}; a fresh run is required`);
          continue;
        }
        const record = runRecordSchema.parse(parsed);
        if (record.jobId !== jobId || record.planId !== planId) throw new Error('job.json names another run');
        const log = await RunLog.open(join(directory, runLayout.events), jobId, undefined, record.restart !== undefined);
        const preparation = log.find('restart-prepared');
        if (preparation) this.restartClaims.set(key(planId, preparation.data.sourceRun), { jobId, sourceDigest: preparation.data.sourceDigest });
        const captured = await readCapturedDocuments(directory, record.manifest);
        if (!log.find('job-started') && !preparation) {
          if (record.restart) continue;
          throw new Error('Document capture stopped before the run was published');
        }
        let imported: RestartImport | undefined;
        if (record.restart) {
          if (!preparation || Object.entries(record.restart).some(([field, value]) => value !== preparation.data[field as keyof typeof preparation.data])) throw new Error('Restart initialization provenance is unavailable or inconsistent');
          imported = await readRestartImport(directory, record.restart.importDigest);
          log.installWorkflowImport(restartWorkflowEntries(imported));
        }
        if (!log.find('document-manifest-committed')) await log.append({ type: 'document-manifest-committed', data: {
          manifest: record.manifest.documentManifest.path, hash: record.manifest.documentManifest.hash,
          documents: captured.manifest.documents.length,
        } });
        const base = await this.runBase(record, log);
        let loaded!: Run;
        loaded = new Run(record, directory, log, base, this.newWriter(record.policy, () => this.coordination(loaded).accepted()));
        const adopted = log.all('continuity-policy-adopted').at(-1);
        if (adopted) loaded.effectivePolicy = adopted.data.policy;
        loaded.restartImport = imported;
        run = loaded;
      } catch (error) {
        this.restartUnavailable.set(key(planId, jobId), `Retained source is unreadable or incompatible: ${message(error)}`);
        report.skipped.push(key(planId, jobId));
        this.warn(`Skipping ${directory}: ${message(error)}. It declares ${declaredSchemaOf(await readJson(recordPath))}.`);
        continue;
      }
      this.runs.set(run.key, run);

      for (const event of run.log.ownEvents) if (event.type === 'restart-prepared' || event.type === 'operation-recovery-resumed' || event.type === 'stop-requested') this.commands.remember(event.data.command);
      const rewritten = await recoverCommits(run.log.ledger);
      if (rewritten.rewritten.length > 0) report.rematerialized.push(`${run.key}: ${rewritten.rewritten.length} record file(s)`);
      // A crash can land after the durable close event and before its
      // filesystem cleanup. Repeat the idempotent cleanup on every load.
      try {
        await this.handling.cleanupClosedScratch(run);
      } catch (error) {
        if (!run.log.terminal) await this.fail(run, 'recovery-exhausted', `Closed iteration scratch could not be cleaned: ${message(error)}`);
        else this.warn(`Run ${run.record.jobId}: closed iteration scratch could not be cleaned: ${message(error)}`);
      }

      if (!run.log.terminal) {
        const unconfirmed = new Set<string>();
        const operations = this.options.agent ? await this.operations(this.options.agent) : undefined;
        const pending = run.log.all('invocation-started').filter(event => !run.log.all('invocation-ended').some(ended => ended.data.invocation === event.data.invocation));
        for (const event of pending) {
          // Revoke authenticated native children even when provider drainage
          // itself remains unavailable. Killing a child is not task settlement.
          for (const group of run.log.all('writer-process-registered').filter(group => group.data.invocation === event.data.invocation)) {
            if (await processGroupIdentity(group.data.pid) === group.data.identity) (this.options.groups ?? nodeProcessGroups).kill(group.data.pid);
          }
          try {
            if (operations && !await operations.stopOriginal(run.jobId, event.data.invocation, run.policy.limits.stopSettleMs)) unconfirmed.add(event.data.invocation);
          } catch (error) {
            unconfirmed.add(event.data.invocation);
            this.warn(`Original operation settlement failed: ${message(error)}`);
          }
        }
        for (const invocation of unconfirmed.size > 0 ? [] : await this.closeInterruptedInvocations(run)) report.invocations.push(`${run.key}: ${invocation}`);
        const unsettled = unconfirmed.size > 0 || run.writer.isUnsettled
          || run.log.all('writer-released').some(event => !event.data.confirmed);
        const reentry = decideTaskReentry({ authorized: true, stopped: run.stopRequested, settled: !unsettled });
        if (run.stopRequested) {
          await this.endRun(run, { type: 'job-stopped', data: { settled: !unsettled } }, 'run-ended');
        } else if (reentry.action === 'wait') {
          // A replacement must never overlap a surviving writer. Keep its task
          // pending and report the concrete owner that could not be settled.
          run.recoveryRestart = true;
          this.warn(`Run ${run.jobId}: former execution has not settled; unfinished work remains pending`);
          report.interrupted.push(run.key);
        } else {
          const prior = this.latestOperationRecovery(run);
          const hadWriter = pending.some(event => this.invocationRecord(run, event.data.invocation).body.writer);
          if (!hadWriter && prior?.settled) await this.observeQuiescentCandidate(run, prior.candidate.tree);
          for (const effect of await this.completeEffects(run)) report.effects.push(`${run.key}: ${effect}`);
          for (const delivery of await this.coordination(run).completeDeliveries()) report.effects.push(`${run.key}: delivery ${delivery}`);
          if (this.options.agent) {
          await run.log.append({ type: 'job-continued', data: { reason: 'service-startup' } }, this.now());
          run.recoveryPause = undefined;
          run.startupRecovery = false;
          await this.startRecoveredDriver(run);
          report.effects.push(`${run.key}: continued unfinished tasks through ordinary execution`);
          }
        }
      }

      for (const event of run.log.events) {
        if (event.type === 'job-continued' && event.data.command) this.commands.remember(event.data.command);
        if (event.type === 'job-started' || event.type === 'stop-requested' || event.type === 'analysis-approved' || event.type === 'debug-resumed' || event.type === 'debug-exchange-admitted') {
          this.commands.remember(event.data.command);
        }
        if (event.type === 'operation-recovery-resumed') this.commands.remember(event.data.command);
        if (event.type === 'check-findings-recorded' && event.data.cause.kind === 'user-command') this.commands.remember(event.data.cause.command);
      }
    }
    // Every early recovery branch still reaches administration recovery here.
    // Historical runs without a captured destination never opt in on restart.
    for (const run of this.runs.values()) {
      if (run.record.beadsAdministration === undefined || 'error' in run.record.beadsAdministration) continue;
      try {
        const administration = await this.administration();
        if (!administration) continue;
        await administration.recover(run.record.jobId);
        if (run.log.find('scratch-setting-up')) await this.scheduleBeads(run, 'start');
        if (run.log.terminal) await this.scheduleBeads(run, 'finish');
      } catch (error) { this.warn(`Run ${run.record.jobId}: Beads administration recovery unavailable: ${message(error)}`); }
    }
    return report;
  }

  /** No shell can execute before its process registration; coordinator builtins only inspect. */
  /**
   * Every external effect whose intent has no completion, performed again
   * under its key: the parent append of a decision, the commit a gate makes,
   * which a repeat finds by its `Ramify-Gate` trailer, and the commit that
   * materializes the feature files, which a repeat finds by its
   * `Ramify-Scenarios` trailer. None makes a second commit.
   */
  private async completeEffects(run: Run): Promise<string[]> {
    const performed: string[] = [];
    for (const pending of run.log.ledger.pendingEffects()) {
      const event = pending.event;
      if (event.type === 'readiness-repair-committing') {
        const entry = run.log.ledger.replay().find(entry => entry.transaction.event.sequence === pending.sequence);
        const records = entry?.transaction.records.filter(record => record.path === readinessRepairOperationPath(event.data.id)) ?? [];
        if (records.length !== 1) throw new Error('Readiness repair effect has no uniquely committed operation');
        const operation = readinessRepairOperationSchema.parse(records[0]!.body);
        await commitReadinessRepair(run, this.gateHost(), this.gates, operation);
        performed.push(`the authenticated readiness repair commit ${event.data.id}`);
        continue;
      }
      if (event.type === 'decision-accepted') {
        // The decision is committed and its brief is not in the parent
        // context yet. The append is keyed by the decision, so performing it
        // again appends it once: a repeat answers already-present.
        const decision = await this.coordination(run).readDecision(event.data.decision);
        if (decision === null) {
          this.warn(`Run ${run.record.jobId}: the decision of effect "${pending.key}" cannot be read; its brief was left unappended`);
          continue;
        }
        const agent = this.options.agent;
        if (agent === undefined) {
          this.warn(`Run ${run.record.jobId}: no agent is configured, so the brief of ${decision.id} was left unappended`);
          continue;
        }
        await this.coordination(run).appendBrief(agent, decision, null);
        performed.push(`the parent append of decision ${decision.id}`);
        continue;
      }
      if (event.type === 'context-package-append-requested') {
        const agent = this.options.agent;
        const selected = run.log.all('context-selection-recorded').find(candidate => candidate.data.workItem === event.data.workItem
          && candidate.data.selection === event.data.selection);
        const evidence = await readAcceptedEvidence(run.directory, run.record.manifest, acceptedAnalysisReferences(run.log.events));
        if (agent === undefined || selected === undefined || evidence.status === 'unavailable') {
          this.warn(`Run ${run.record.jobId}: context append ${pending.key} lacks its agent or verified selection`);
          continue;
        }
        const recorded = await this.coordination(run).recordedSelection(selected, evidence.catalog);
        if (recorded.status === 'unavailable') {
          this.warn(`Run ${run.record.jobId}: context append ${pending.key} is unavailable: ${recorded.reason}`);
          continue;
        }
        const orientation = run.log.all('work-orientation-recorded').find(candidate => candidate.data.workItem === event.data.workItem);
        await run.log.ledger.effect<BriefAppend>({
          key: pending.key, serialize: work => run.mutex.run(work),
          intent: () => { throw new Error(`The intent of ${pending.key} is already committed`); },
          perform: async key => {
            if (event.data.session === null || orientation?.data.point === null || orientation === undefined) {
              return { session: null, ref: null, outcome: 'no-session', reason: 'No retained parent point' };
            }
            try {
              const answer = await (await this.operations(agent)).append(orientation.data.point, key, recorded.packageText, 'support:work-item-package');
              if (answer.outcome === 'session-lost') return { session: event.data.session, ref: null, outcome: 'session-lost', reason: 'The parent session was lost' };
              if (answer.outcome === 'conflict') return { session: event.data.session, ref: null, outcome: 'failed', reason: `The parent session did not take the package: ${answer.reason}` };
              return { session: event.data.session, ref: answer.ref, outcome: answer.outcome, reason: null };
            } catch (error) { return { session: event.data.session, ref: null, outcome: 'failed', reason: message(error) }; }
          },
          complete: result => ({ event: run.log.next({ type: 'context-package-appended', data: {
            workItem: event.data.workItem, selection: event.data.selection, appendKey: event.data.appendKey, ...result,
          } }), records: [] }),
        });
        performed.push(`the context append of ${event.data.workItem}`);
        continue;
      }
      if (event.type === 'reconciliation-assessed') {
        // The assessment is committed and its brief is not in the local
        // architect's session yet. The append is keyed by the
        // reconciliation, so performing it again appends it once.
        const id = event.data.reconciliation;
        const record = reconciliationAssessmentSchema.safeParse(this.committedBody(run, reconciliationLayout.assessment(id)));
        const agent = this.options.agent;
        if (!record.success || agent === undefined) {
          this.warn(`Run ${run.record.jobId}: the brief of ${id} was left unappended: ${record.success ? 'no agent is configured' : 'its assessment cannot be read'}`);
          continue;
        }
        await run.log.ledger.effect<BriefAppend>({
          key: pending.key,
          serialize: work => run.mutex.run(work),
          // The intent is in the log already; the ledger never builds it again.
          intent: () => { throw new Error(`The intent of ${pending.key} is already committed`); },
          perform: key => this.appendReconciliationBrief(agent, key, record.data.parent, record.data.brief),
          complete: result => ({ event: run.log.next({ type: 'reconciliation-brief-appended', data: { reconciliation: id, ...result } }), records: [] }),
        });
        performed.push(`the parent append of reconciliation ${id}`);
        continue;
      }
      if (event.type === 'scenarios-rewording') {
        // The revised records are in the intent; the files are rendered from
        // the ledger again, and the commit is found by its trailers.
        await this.coordination(run).performRewording(event.data, [], true);
        performed.push(`the rewording commit of ${event.data.scenarios.join(', ')}`);
        continue;
      }
      if (event.type === 'scenarios-materializing') {
        // The files are re-rendered from the ledger, and the commit is found
        // by its trailers where the interrupted attempt made it.
        await this.performMaterialization(run, true);
        performed.push('the materialization of the feature files');
        continue;
      }
      if (event.type === 'scratch-setting-up') {
        await this.performScratchSetup(run, true);
        performed.push('the scratch ignore rule setup');
        continue;
      }
      if (event.type !== 'gate-committing') {
        this.warn(`Run ${run.record.jobId}: effect "${pending.key}" has no known completion and was left alone`);
        continue;
      }
      const read = await readCommitted(run.log.ledger, runLayout.gateOperation(event.data.gate), runSchemas.gateOperation);
      if (read.kind !== 'valid') {
        this.warn(`Run ${run.record.jobId}: the gate operation of effect "${pending.key}" cannot be read; its commit was left alone`);
        continue;
      }
      const operation = read.value as GateOperation;
      let binding: { candidateId: string; assessment: Assessment } | undefined;
      if (operation.finalAssessment !== undefined) {
        const assessment = assessmentSchema.parse(this.committedBody(run, runLayout.assessment(operation.finalAssessment.assessment)));
        if (assessment.id !== operation.finalAssessment.assessment || assessment.candidate.tree !== operation.finalAssessment.tree || operation.checkpoint !== 'final') throw new Error('The pending final effect has an incompatible captured assessment prerequisite');
        if ((await this.previewCandidateTree()).tree !== operation.finalAssessment.tree) throw new Error('The pending final effect candidate changed after its retained assessment; responsible reassessment is required before any commit or audit replay');
        binding = { candidateId: operation.finalAssessment.candidate, assessment };
      }
      const recovered = await this.gates.commitGate(run, preparedGate(operation), undefined, undefined, undefined, operation.message, binding);
      performed.push(recovered.commit === null && recovered.audited === null
        ? `the failed preflight of gate ${event.data.gate}` : `the commit and audit of gate ${event.data.gate}`);
    }
    return performed;
  }

  /**
   * An invocation whose start has no end was interrupted with the harness.
   * It is closed as `failed` with `session-lost`, which calls no agent: the
   * successor of an interrupted invocation belongs to a run that is started
   * again, and the tree it left is what that run's engineer reads. Its
   * session is finished with it, as `interrupted`.
   */
  private async closeInterruptedInvocations(run: Run, preserved: ReadonlySet<string> = new Set(), unconfirmed: ReadonlySet<string> = new Set()): Promise<string[]> {
    const closed: string[] = [];
    const unreconciled = new Set(unconfirmed);
    const ended = new Set(run.log.all('invocation-ended').map(event => event.data.invocation));
    for (const started of run.log.all('invocation-started')) {
      const id = started.data.invocation;
      if (ended.has(id) || preserved.has(id)) continue;
      const acquired = run.log.all('writer-acquired').some(event => event.data.invocation === id);
      const released = run.log.all('writer-released').some(event => event.data.invocation === id);
      if (acquired && !released) {
        // The new service has a new in-memory writer. Restore only the groups
        // durably registered before their commands were allowed to start.
        run.writer.acquire(id);
        for (const event of run.log.all('writer-process-registered')) {
          if (event.data.invocation !== id) continue;
          const current = await processGroupIdentity(event.data.pid);
          if (current !== null && current === event.data.identity) run.writer.register(id, event.data.pid);
          else {
            if (current === null && (this.options.groups ?? nodeProcessGroups).alive(event.data.pid)) unreconciled.add(id);
            this.warn(`Run ${run.record.jobId}: process group ${event.data.pid} cannot be authenticated after restart; it will not be signalled`);
          }
        }
      }
      const priorReleases = run.log.all('writer-released').filter(event => event.data.invocation === id);
      const settled = acquired && !released ? await run.writer.release(id, unreconciled.has(id) ? { settled: async () => 'timed-out' } : undefined).catch(() => ({ confirmed: false, at: this.now().toISOString(), groupsKilled: 0, lateWrites: [] }))
        : { confirmed: !unreconciled.has(id) && (!acquired || priorReleases.length === 1 && priorReleases[0]!.data.confirmed), at: this.now().toISOString(), groupsKilled: 0, lateWrites: [] };
      if (acquired && !released) await this.write(run, { type: 'writer-released', data: { invocation: id, confirmed: settled.confirmed, groupsKilled: settled.groupsKilled } });
      // Observations are appended without a transaction, by decision 2, so
      // the last of an invocation the harness was interrupted in may be
      // missing. The gap is recorded rather than left to be read as an
      // invocation that observed nothing more.
      await (await ObservationLog.open(run.path(runLayout.observations(id)))).record({
        type: 'coverage-gap',
        data: {
          kind: 'observation-truncated',
          detail: 'the harness stopped while this invocation was running, so its last observations may be missing',
        },
      }).catch(error => this.warn(`Run ${run.record.jobId}: ${id}'s truncation gap was not recorded: ${message(error)}`));
      if (this.options.agent) {
        const operations = await this.operations(this.options.agent);
        const accepted = await operations.acceptance(run.jobId, id);
        if (accepted) {
          const bytes = await readIfExists(run.path(runLayout.submission(id)));
          if (!bytes || sha256(bytes) !== accepted.submissionHash) throw new Error(`Accepted submission ${id} cannot be authenticated after interruption`);
          const { schema, ...value } = JSON.parse(bytes.toString('utf8')) as Record<string, unknown>;
          if (schema !== accepted.schema || canonicalJson(value) !== canonicalJson(accepted.value)) throw new Error(`Accepted destination ${id} changed`);
          const ref = await operations.completedPoint(run.jobId, id) ?? '';
          const mode = this.invocationRecord(run, id).body.session.actual;
          await this.endInvocation(run, id, started.data.session, kept, {
            ended: 'submitted', disposition: 'applied', submission: { hash: accepted.submissionHash }, rejectedSubmissions: 0,
            session: { ref, mode }, sessionOperation: { runId: run.jobId, operationId: id, point: readSessionPointReference(ref)?.point ?? null },
            settled, outsideScope: [], usage: { unavailable: 'The service stopped after acceptance; original provider usage is unavailable' }, elapsedMs: 0,
          });
          closed.push(id); continue;
        }
      }
      await this.endInvocation(run, id, started.data.session, finished('interrupted'), {
        ended: 'failed',
        interruption: 'session-lost',
        disposition: 'incomplete',
        submission: null,
        rejectedSubmissions: 0,
        settled,
        outsideScope: [],
        usage: { unavailable: 'the harness stopped while the session was running' },
        elapsedMs: 0,
        error: 'The harness stopped while this invocation was running.',
      });
      closed.push(id);
    }
    return closed;
  }

  private newWriter(policy: RunPolicy, boundary: () => string): WriterOwnership {
    const tree: TreeObserver = { changed: () => this.git.changedPaths(this.projectRoot, boundary()).catch(() => []) };
    return new WriterOwnership({
      settleMs: policy.limits.writerSettleMs,
      tree,
      groups: this.options.groups ?? nodeProcessGroups,
    });
  }

  /**
   * The run's original source boundary. Real inputs record it in the
   * manifest; older and test inputs can be recovered from the first durable
   * invocation or gate before consulting the current checkout.
   */
  /** Historical context may use recorded boundaries only, never today's checkout. */
  private recordedRunBase(record: RunRecord, log: RunLog): string | undefined {
    if (record.manifest.source !== null) return record.manifest.source.commit;
    for (const entry of log.ledger.replay()) {
      for (const stored of entry.transaction.records) {
        const body = stored.body as { readonly schema?: unknown; readonly base?: unknown; readonly head?: unknown } | null;
        if (body?.schema === 'ramify-agent.invocation/1' && typeof body.base === 'string') return body.base;
        if (body?.schema === 'ramify-agent.gate-attempt/3' && typeof body.head === 'string') return body.head;
      }
    }
    return undefined;
  }

  private async runBase(record: RunRecord, log: RunLog): Promise<string> {
    return this.recordedRunBase(record, log) ?? this.git.currentHead(this.projectRoot);
  }

  // Queries

  listRuns(planId: string): RunSnapshot[] {
    return this.runsOf(planId).map(run => runSnapshot(run.record, run.log.events));
  }

  getRun(planId: string, runId: string): RunSnapshot | undefined {
    this.refuseEarlierPolicy(planId, runId);
    const run = this.runs.get(key(planId, runId));
    return run && runSnapshot(run.record, run.log.events);
  }

  /** Current debugger state, independent of the ordinary run snapshot. Inspection invokes no model. */
  debugState(planId: string, runId: string): BreakpointState | null {
    this.refuseEarlierPolicy(planId, runId);
    const run = this.runs.get(key(planId, runId));
    if (!run || run.log.terminal || run.stopRequested || !run.debugPause) return null;
    return structuredClone({ ...run.debugPause, cursor: run.log.version });
  }

  /** The run's events, exactly as its log holds them. */
  events(planId: string, runId: string) {
    this.refuseEarlierPolicy(planId, runId);
    return this.runs.get(key(planId, runId))?.log.events;
  }

  /** The record of one run, for a caller that reads what it was started with. */
  recordOf(planId: string, runId: string): RunRecord | undefined {
    this.refuseEarlierPolicy(planId, runId);
    return this.runs.get(key(planId, runId))?.record;
  }

  /**
   * What a projection reads of one run: its record, its directory and every
   * complete line of its log, record bodies included. It is a read: the
   * caller receives the replay, and nothing it does with it reaches the log.
   */
  committed(planId: string, runId: string) {
    this.refuseEarlierPolicy(planId, runId);
    const run = this.runs.get(key(planId, runId));
    return run && { record: run.record, directory: run.directory, entries: run.log.ledger.replay() };
  }

  /**
   * Commits CheckFinding commands on a path with no run event of its own,
   * such as recovery or a user's answer, as one `check-findings-recorded`
   * line under the run mutex. An exact redelivery appends nothing; a
   * refusal appends nothing and says why. Undefined for an unknown run.
   */
  async recordCheckFindings(
    planId: string,
    runId: string,
    change: { readonly cause: CheckFindingCause; readonly commands: readonly CheckFindingCommand[] },
  ): Promise<CheckFindingCommit | undefined> {
    this.refuseEarlierPolicy(planId, runId);
    const run = this.runs.get(key(planId, runId));
    if (run === undefined) return undefined;
    const committed = await this.commitCheckFindings(run, () => ({
      commands: change.commands,
      compose: decided => ({ event: { type: 'check-findings-recorded', data: { cause: change.cause, checkFindings: [...decided.events] } } }),
    }));
    // A work item waiting for a user's answer reads the state again.
    if (committed.kind === 'committed') run.notify();
    return committed;
  }

  /**
   * The run's CheckFindings, as the child selects them from the state
   * replayed from its log: a bounded list or one detail. Undefined for an
   * unknown run.
   */
  checkFindings(planId: string, runId: string, query: CheckFindingQueryInput): CheckFindingSelection | undefined {
    this.refuseEarlierPolicy(planId, runId);
    const run = this.runs.get(key(planId, runId));
    return run && selectCheckFindings(checkFindingStateOf(run.log.ledger), query);
  }

  /**
   * The one CheckFinding transition of a run, for every producer and
   * decision path: see `check-findings/transition.ts`. Slow work is done
   * before it; `build` validates what that work captured under the mutex.
   */
  private async commitCheckFindings(run: Run, build: CheckFindingBuild): Promise<CheckFindingCommit> {
    return await commitCheckFindingChange(run, build, this.now());
  }

  /** The runs of one plan, newest first, as `committed` answers each. */
  committedRuns(planId: string) {
    return this.runsOf(planId).map(run => ({ record: run.record, directory: run.directory, entries: run.log.ledger.replay() }));
  }

  /**
   * Every run it serves, of every plan, with its version: the sequence of its
   * last event. A reader compares versions to know which runs changed,
   * without replaying any log.
   */
  runVersions(): Array<{ readonly planId: string; readonly runId: string; readonly version: number }> {
    return [...this.runs.values()].map(run => ({
      planId: run.record.planId,
      runId: run.record.jobId,
      version: run.log.events.at(-1)?.sequence ?? 0,
    }));
  }

  /** The name of the agent a run starts with, or undefined when none is configured and no run can start. */
  get agentName(): string | undefined {
    return this.options.agent?.name;
  }

  /** Settles when the run's driver has nothing left to do. For tests and shutdown. */
  async settled(planId: string, runId: string): Promise<void> {
    this.refuseEarlierPolicy(planId, runId);
    const run = this.runs.get(key(planId, runId));
    if (run) await run.idle();
  }

  private runsOf(planId: string): Run[] {
    return [...this.runs.values()]
      .filter(run => run.record.planId === planId)
      .sort((a, b) => (a.record.createdAt === b.record.createdAt
        ? (a.record.jobId < b.record.jobId ? 1 : -1)
        : (a.record.createdAt < b.record.createdAt ? 1 : -1)));
  }

  // Commands

  /**
   * Runs a command and returns its receipt. A command whose ID and content
   * match an accepted command returns that command's receipt and does nothing
   * more. A reused ID with other content is a conflict. A new command whose
   * expected version is not the run's is stale and carries the current
   * version. A second run while one is active is busy.
   */
  execute(command: RunCommand): Promise<Receipt> {
    return this.commandMutex.run(async () => {
      if (this.closed) throw new CommandRejection('unavailable', 'The harness is shutting down');
      const admitted = this.commands.admit(command);
      if (admitted.kind === 'repeat') return admitted.receipt;
      if (command.type !== 'start-run' && command.type !== 'stop-job' && command.type !== 'debug-resume' && command.type !== 'debug-message' && command.type !== 'resume-recovery') {
        const subject = this.runs.get(key(command.payload.planId, command.payload.jobId));
        if (subject?.debugPause !== undefined) throw new CommandRejection('busy', 'This run is suspended at an execution breakpoint');
      }
      switch (command.type) {
        case 'start-run': return this.start(command, admitted.contentHash);
        case 'prepare-restart': return this.prepareRestart(command, admitted.contentHash);
        case 'stop-job': return this.stop(command, admitted.contentHash);
        case 'approve-analysis': return this.approve(command, admitted.contentHash);
        case 'debug-message': return this.messageDebug(command, admitted.contentHash);
        case 'debug-resume': return this.resumeDebug(command, admitted.contentHash);
        case 'resume-recovery': return this.resumeRecovery(command, admitted.contentHash);
        case 'respond-to-check-finding':
        case 'waive-check-finding':
        case 'revoke-check-finding-waiver':
          return this.checkFindingCommand(command, admitted.contentHash);
      }
    });
  }

  /** Inspect retained authority and ownership; history and optional sessions stay in place. */
  private async continuationBlockers(run: Run, settle = false): Promise<string[]> {
    const blockers: string[] = [];
    if (!await this.options.lock.held()) blockers.push('The harness no longer holds the project execution lock');
    const other = [...this.runs.values()].find(candidate => candidate !== run && !candidate.log.terminal);
    if (other) blockers.push(`Run ${other.jobId} is still active in this project`);
    if (!run.log.terminal || !['job-failed', 'job-interrupted'].includes(run.log.terminal.type)) blockers.push('Only unfinished failed or interrupted work can continue');
    if (run.stopRequested || run.log.find('stop-requested')) blockers.push('The recorded operator stop stands');
    if (run.record.breakpoint) blockers.push('The debugger pause remains effective');
    if (!this.options.agent) blockers.push('No agent is configured');
    if (run.live.size || run.writer.isUnsettled) blockers.push('The former execution has not settled');
    const operations = this.options.agent ? await this.operations(this.options.agent) : undefined;
    for (const started of run.log.all('invocation-started')) {
      const outcome = this.effectiveInvocationOutcome(run, started.data.invocation);
      // Older terminal cleanup lacked reliable process evidence. Ask the
      // lifecycle owner, never infer settlement from a terminal event.
      if (!outcome?.settled.confirmed && (!settle || !operations || !await operations.stopOriginal(run.jobId, started.data.invocation, run.policy.limits.stopSettleMs))) blockers.push(`Former attempt ${started.data.invocation} has not settled`);
      for (const effect of await operations?.unresolvedEffects(run.jobId, started.data.invocation) ?? []) blockers.push(`Task ${started.data.invocation}: ${effect}`);
    }
    for (const group of run.log.all('writer-process-registered')) {
      const identity = await processGroupIdentity(group.data.pid);
      if (identity !== null && identity === group.data.identity && (this.options.groups ?? nodeProcessGroups).alive(group.data.pid)) blockers.push(`Former process group ${group.data.pid} still owns execution`);
    }
    return blockers;
  }

  async restartInspection(planId: string, sourceRunId: string): Promise<RestartInspection | null> {
    const run = this.runs.get(key(planId, sourceRunId));
    if (!run) return null;
    const blockers = await this.continuationBlockers(run);
    const candidate = await this.previewCandidateTree().catch(() => null);
    return restartInspectionSchema.parse({ planId, runId: sourceRunId, cursor: run.log.version,
      sourceDigest: run.log.ledger.committedContentHash, generation: 1, canPrepare: blockers.length === 0,
      blockers, successor: null, boundary: null, preserved: [], inapplicable: [],
      candidate: { source: null, current: candidate ? { head: candidate.head, tree: candidate.tree } : null },
      policy: { before: run.policy.version, current: 'run-policy/8' }, limitations: [],
      settlement: blockers.some(reason => /settled|process group/u.test(reason)) ? 'unknown' : 'confirmed',
      effects: blockers.some(reason => reason.startsWith('Task ')) ? 'unknown' : 'reconciled', changes: [] });
  }

  /** Legacy command name: continue the existing task without copying its history. */
  private async prepareRestart(command: Extract<RunCommand, { type: 'prepare-restart' }>, contentHash: string): Promise<Receipt> {
    const run = this.runs.get(key(command.payload.planId, command.payload.jobId));
    if (!run) throw new CommandRejection('not-found', 'The retained run is unavailable');
    this.commands.requireVersion(command, run.log.version);
    const blockers = await this.continuationBlockers(run, true);
    if (blockers.length) throw new CommandRejection('conflict', blockers.join('; '));
    const at = this.now();
    const accepted = this.commands.accept(command, contentHash, run.jobId, run.log.nextSequence, at);
    await run.log.append({ type: 'job-continued', data: { command: accepted } }, at);
    this.commands.remember(accepted);
    await this.completeEffects(run);
    await this.coordination(run).completeDeliveries();
    run.recoveryPause = undefined;
    run.startupRecovery = false;
    const latestWriter = [...run.log.all('invocation-started')].reverse().find(event => this.invocationRecord(run, event.data.invocation).body.writer);
    const prior = latestWriter ? this.effectiveInvocationOutcome(run, latestWriter.data.invocation) : undefined;
    await this.observeQuiescentCandidate(run, prior?.settled.confirmed ? prior.candidateAfter : undefined);
    await this.startRecoveredDriver(run);
    return accepted.receipt;
  }

  private async start(command: Extract<RunCommand, { type: 'start-run' }>, contentHash: string): Promise<Receipt> {
    const { planId, agent: requested, reviewStop, breakpoint } = command.payload;
    if (breakpoint !== undefined && !breakpointSelectorSchema.safeParse(breakpoint).success) {
      throw new CommandRejection('conflict', 'Supported breakpoint: before-agent:engineer');
    }
    if (this.options.policy !== undefined) {
      const policy = this.options.policy(this.projectRoot);
      if (!supportedCapabilityPolicy(policy.version)) throw new CommandRejection('conflict', `Run policy ${policy.version} is refused by ${capabilityRunPolicyVersion}; a fresh run is required`);
    }
    this.commands.requireVersion(command, 0, 'A start creates a run, whose version is 0');
    const agent = this.options.agent;
    if (!agent) throw new CommandRejection('unavailable', 'No agent is configured, so no run can start');
    if (agent.name !== requested) throw new CommandRejection('unavailable', `The configured agent is "${agent.name}", not "${requested}"`);
    const running = [...this.runs.values()].find(run => !run.log.terminal);
    if (running) {
      throw new CommandRejection('busy', `Run ${running.record.jobId} of plan "${running.record.planId}" is still running; one run runs at a time`);
    }
    const plan = await readPlan(this.projectRoot, planId);
    if (!plan) throw new CommandRejection('not-found', `No plan with ID "${planId}"`);
    if (plan.status === 'unreadable') throw new CommandRejection('unreadable', `${plan.path}: ${plan.message}`);
    if (!await this.options.lock.held()) throw new CommandRejection('internal', 'This harness no longer holds the project lock');
    // The committed audit definition is read before anything of the run is
    // written or any agent starts: readiness, every gate and the final gate
    // ask it, so a project without a valid one is refused here.
    const sourceCommit = await this.git.currentHead(this.projectRoot);
    if (sourceCommit === '') throw new CommandRejection('unreadable', 'No committed HEAD is available, so no committed audit configuration can be read and no run can start');
    const auditConfiguration = await this.options.configuredAudit.read(this.projectRoot, sourceCommit)
      .then(config => ({ config }), (error: unknown) => {
        throw new CommandRejection('unreadable', `The committed audit configuration at ${sourceCommit} cannot be read, so no run can start: ${message(error)}`);
      });

    // The plan's state directory exists, with its marker and its
    // `.gitignore`, before the evidence is captured: the run's own records
    // never change what the evidence describes, `git add -A` at a gate never
    // commits them, and readiness sees a clean tree. Nothing else of the plan
    // is created; a run saves no map.
    await ensureStateDirectory(planStateDirectory(this.projectRoot, planId), { gitignore: true });
    const captured = await capturePlan(this.projectRoot, planId);
    const inputs = await this.captureInputs(captured);
    const capturedDocuments = await discoverDocuments(this.projectRoot, planId, inputs.manifest.source ?? { commit: null, dirty: false })
      .catch((error: unknown) => { throw new CommandRejection('unreadable', `Plan evidence cannot be captured: ${message(error)}`); });
    if (!Buffer.from(capturedDocuments.bytes.get(capturedDocuments.manifest.root)!).equals(Buffer.from(captured))) {
      throw new CommandRejection('inputs-changed', 'The root plan changed during input capture');
    }
    const documentManifestText = `${JSON.stringify(capturedDocuments.manifest, null, 2)}\n`;
    const manifest = { ...inputs.manifest, documentManifest: { path: runLayout.documentManifest, hash: sha256(documentManifestText) } };
    const { packages, promptManifest, policy } = inputs;

    const now = this.now();
    const runId = newJobId(now);
    const directory = runDirectory(this.projectRoot, planId, runId);

    // Written once, before the first event: the captured plan, the prompt
    // manifest, the frozen baseline and then `job.json`, which names them.
    await mkdir(join(directory, 'input'), { recursive: true });
    await mkdir(join(directory, 'prompts'), { recursive: true });
    await mkdir(join(directory, 'measurements'), { recursive: true });
    if (!verifyDocumentBytes(capturedDocuments.manifest.documents[0]!, captured)) throw new Error('Root plan bytes changed before installation');
    await writeOnce(join(directory, runLayout.capturedPlan), captured);
    for (const document of capturedDocuments.manifest.documents) {
      if (document.id === capturedDocuments.manifest.root) continue;
      const bytes = capturedDocuments.bytes.get(document.id)!;
      if (!verifyDocumentBytes(document, bytes)) throw new Error(`Document ${document.path} bytes changed before installation`);
      await mkdir(dirname(join(directory, document.storedAt)), { recursive: true });
      await writeOnce(join(directory, document.storedAt), bytes);
    }
    await writeOnce(join(directory, runLayout.documentManifest), documentManifestText);
    await readCapturedDocuments(directory, manifest);
    await writeOnce(join(directory, runLayout.promptManifest), `${JSON.stringify(promptManifest, null, 2)}\n`);

    const baseline = await this.freezeBaseline(directory, planId, manifest, packages);
    // Read once, beside the policy. A missing or invalid file is captured
    // with its reason; readiness reports it, and the start is not refused.
    // The gate command timeouts it declares replace the policy's own.
    const projectConfig = await captureProjectConfig(this.projectRoot);
    const beadsAdministration = 'config' in projectConfig && projectConfig.config.beads
      ? await resolveBeadsProjectConfig(this.projectRoot, projectConfig.config.beads, async root => {
        if (!this.git.commonDirectory) throw new Error('Git common directory inspection is unavailable');
        return this.git.commonDirectory(root);
      }).catch((error: unknown) => {
        const detail = message(error);
        this.warn(`Beads administration destination unavailable: ${detail}`);
        return { error: detail };
      })
      : undefined;
    const record = runRecordSchema.parse({
      schema: jobSchemaVersion,
      jobId: runId,
      planId,
      kind: 'implementation',
      agent: requested,
      createdAt: now.toISOString(),
      manifest: baseline.manifest,
      prompts: Object.fromEntries([...packages].map(([role, loaded]) => [role, { package: loaded.package, hash: loaded.hash }])),
      policy: withProjectTimeouts(policy, projectConfig),
      projectConfig,
      ...(beadsAdministration === undefined ? {} : { beadsAdministration }),
      auditConfiguration,
      baseline: baseline.reference,
      // The plan's own scenarios, extracted once from the captured bytes. A
      // block that does not parse is a limitation, never a refusal.
      planScenarios: extractPlanScenarios(new TextDecoder().decode(captured)),
      reviewStop,
      ...(breakpoint === undefined ? {} : { breakpoint }),
    });
    await writeOnce(join(directory, runLayout.record), `${JSON.stringify(record, null, 2)}\n`);

    const log = await RunLog.open(join(directory, runLayout.events), runId);
    const base = manifest.source?.commit ?? await this.git.currentHead(this.projectRoot);
    let run!: Run;
    run = new Run(record, directory, log, base, this.newWriter(record.policy, () => this.coordination(run).accepted()));
    run.index = await this.options.inputs.index(this.projectRoot, record.manifest).catch(() => null);
    const accepted = this.commands.accept(command, contentHash, runId, run.log.nextSequence, now);
    this.runs.set(run.key, run);
    await run.log.append({ type: 'job-started', data: { command: accepted } }, now);
    await run.log.append({ type: 'document-manifest-committed', data: {
      manifest: runLayout.documentManifest, hash: manifest.documentManifest.hash, documents: capturedDocuments.manifest.documents.length,
    } }, now);
    this.commands.remember(accepted);

    run.done = this.drive(run, agent, packages, baseline.snapshot)
      .catch(error => this.fail(
        run,
        error instanceof WriterBlockedError && error.reason === 'unsettled' ? 'writer-unsettled' : 'internal',
        message(error),
      ))
      .catch(error => this.warn(`Run ${runId}: ${error instanceof Error ? error.stack : String(error)}`));
    return accepted.receipt;
  }

  private async captureInputs(captured: Uint8Array) {
    const { manifest: promptManifest, packages } = await loadPromptPackages({
      ...(this.options.skillDirectory === undefined ? {} : { skillDirectory: this.options.skillDirectory }),
      capabilityWorkflow: this.workflow !== null,
    });
    let manifest;
    try {
      manifest = await this.options.inputs.capture(this.projectRoot, captured, packages);
    } catch (error) {
      if (error instanceof EvidenceUnavailableError) throw new CommandRejection('unavailable', error.message);
      throw error;
    }
    const policy = (this.options.policy ?? ((root: string) => defaultRunPolicy({ projectRoot: root })))(this.projectRoot);
    if (!supportedCapabilityPolicy(policy.version)) {
      throw new CommandRejection('conflict', `Run policy ${policy.version} is refused by ${capabilityRunPolicyVersion}; a fresh run is required`);
    }
    return { manifest, packages, promptManifest, policy };
  }

  /**
   * Freezes `B` from the first snapshot of the run, over the root subtree,
   * all view areas, the architect view and the initial support set, each
   * once. The snapshot is written beside `job.json`, before it, because
   * `job.json` names it. A producer that cannot be run leaves the baseline
   * unavailable with that reason, never a zero.
   */
  private async freezeBaseline(
    directory: string,
    planId: string,
    manifest: RunRecord['manifest'],
    packages: ReadonlyMap<string, LoadedPackage>,
  ): Promise<{ reference: RunRecord['baseline']; snapshot: MeasurementSnapshot; manifest: RunRecord['manifest'] }> {
    const support: Array<{ path: string; bytes: number }> = [];
    const plan = await supportDocument(this.projectRoot, join(this.projectRoot, 'plans', planId, 'plan.md'));
    if (plan !== null) support.push(plan);
    // Each file once, though several roles' packages carry it.
    for (const loaded of packages.values()) {
      for (const file of loaded.files) if (!support.some(entry => entry.path === file.path)) support.push({ path: file.path, bytes: file.bytes });
    }
    const id = snapshotId(1);
    const capture = (view: ViewIdentity) => captureSnapshot({
      id,
      ramify: this.options.ramify,
      projectRoot: this.projectRoot,
      head: '',
      view,
      supplementary: support,
    });
    // The measurement and the view must describe one state. A revision that
    // moved between them is retried, a bounded number of times, against a
    // refreshed view; a mismatch that remains is recorded, and every size
    // taken from it is unavailable with the reason.
    let view = manifest.architectView;
    let snapshot = await capture(view);
    for (let retry = 0; retry < 2 && revisionMismatch(snapshot) !== null; retry += 1) {
      const index = await this.options.inputs.refresh(this.projectRoot);
      if (index === null) break;
      view = await projectViewIdentity(this.projectRoot, index);
      snapshot = await capture(view);
    }
    // The run record names the view the baseline was measured against, which
    // a successful retry refreshed.
    const frozen = { ...manifest, architectView: view };
    const path = join(directory, runLayout.measurement(id));
    const content = `${JSON.stringify(snapshot, null, 2)}\n`;
    await writeOnce(path, content);
    if ('unavailable' in snapshot.measure) {
      return { reference: { unavailable: snapshot.measure.unavailable }, snapshot, manifest: frozen };
    }
    return { reference: { measurement: { id, revision: 1, hash: sha256(content) } }, snapshot, manifest: frozen };
  }

  /** Effective input at a live occurrence; no packet is recorded as delivery. */
  async debugInspect(planId: string, runId: string, pauseId: string): Promise<DebugInspection> {
    const run = this.runs.get(key(planId, runId));
    const pause = run?.debugPause;
    if (!run || this.ignoring(run) || !pause || pause.pauseId !== pauseId || !run.debugPrepared) throw new CommandRejection('conflict', 'This is not a live breakpoint occurrence');
    const revision = pause.revision;
    const input = await run.debugPrepared.inspect();
    if (this.ignoring(run) || run.debugPause !== pause || pause.revision !== revision) throw new CommandRejection('conflict', 'The breakpoint progressed during inspection');
    return structuredClone({ ...pause, cursor: run.log.version, kind: 'inspection', preview: true, input });
  }

  /** Durable admitted or settled exchange, even after the occurrence was released. */
  debugResult(planId: string, runId: string, commandId: string): DebugExchange | null {
    const run = this.runs.get(key(planId, runId));
    if (!run) return null;
    const admission = run.log.all('debug-exchange-admitted').find(event => event.data.command.commandId === commandId);
    if (!admission) return null;
    const settled = run.log.all('debug-exchange-settled').find(event => event.data.commandId === commandId);
    if (settled) return structuredClone(settled.data.result);
    const boundary = run.log.all('debug-pausing').find(event => event.data.pauseId === admission.data.pauseId)!;
    const terminal = run.log.terminal;
    const invocation = terminal ? run.log.all('invocation-started').filter(event => event.sequence > admission.sequence &&
      event.data.role === boundary.data.role && canonicalJson(event.data.work) === canonicalJson(boundary.data.work)).at(-1) : undefined;
    const outcome = invocation === undefined ? undefined : invocationOutcomeSchema.safeParse(this.committedBody(run, runLayout.outcome(invocation.data.invocation)));
    const actual = outcome?.success ? outcome.data : undefined;
    const state = run.debugPause?.pauseId === admission.data.pauseId ? run.debugPause : {
      kind: 'breakpoint' as const, planId, runId, pauseId: admission.data.pauseId, revision: admission.data.revision,
      cursor: run.log.version, state: 'exchanging' as const, role: boundary.data.role, work: boundary.data.work,
      goal: boundary.data.goal, nextAction: boundary.data.nextAction, taskState: 'pending' as const, summary: 'Exchange admitted; awaiting settlement.',
    };
    return structuredClone({ ...state, kind: 'exchange', commandId, cursor: run.log.version,
      status: terminal ? terminal.type === 'job-stopped' ? 'stopped' : 'interrupted' : 'admitted',
      taskState: terminal ? 'terminal' : state.taskState,
      answer: null, invocation: invocation?.data.invocation ?? null, session: invocation?.data.session ?? null,
      point: actual?.session?.ref || null, outcome: actual?.ended ?? terminal?.type ?? null,
      ...(actual === undefined ? {} : { settlementConfirmed: actual.settled.confirmed }),
      error: actual?.error ?? (terminal ? 'message' in terminal.data ? String(terminal.data.message) : `Run ended: ${terminal.type}` : null),
      continuityLoss: null, verdicts: [], evidence: invocation === undefined ? [] : [runLayout.invocation(invocation.data.invocation),
        runLayout.outcome(invocation.data.invocation), runLayout.observations(invocation.data.invocation), runLayout.transcript(invocation.data.session)],
      summary: terminal ? `Exchange was not completed; run ended as ${terminal.type}.` : state.summary });
  }

  private async messageDebug(command: Extract<RunCommand, { type: 'debug-message' }>, contentHash: string): Promise<Receipt> {
    const { planId, jobId, pauseId, expectedRevision, message: text } = command.payload;
    this.refuseEarlierPolicy(planId, jobId);
    const run = this.runs.get(key(planId, jobId));
    if (!run) throw new CommandRejection('not-found', `No run ${jobId} for plan "${planId}"`);
    const receipt = await run.mutex.run(async () => {
      if (this.ignoring(run)) throw new CommandRejection('conflict', 'This run accepts no debugger commands');
      const pause = run.debugPause;
      if (!pause || pause.pauseId !== pauseId || !run.debugPrepared) throw new CommandRejection('conflict', 'This is not the current breakpoint occurrence');
      if (pause.revision !== expectedRevision) throw new CommandRejection('stale-version', `The pause is at revision ${pause.revision}`, pause.revision);
      if (pause.state !== 'paused') throw new CommandRejection('busy', `The run is ${pause.state}`);
      if (pause.taskState !== 'pending') throw new CommandRejection('conflict', 'An outcome is held; resume consumes it without another model call');
      run.writer.requireSettled('Debugger exchange requires settled tools');
      await this.adoptContinuityPolicy(run, pauseId);
      const at = this.now();
      const accepted = this.commands.accept(command, contentHash, jobId, run.log.nextSequence, at);
      await run.log.append({ type: 'debug-exchange-admitted', data: { pauseId, revision: pause.revision, message: text, command: accepted } }, at);
      this.commands.remember(accepted);
      pause.state = 'exchanging'; pause.cursor = run.log.version;
      pause.summary = `Engineer exchange ${command.commandId} admitted; ordinary workflow remains suspended.`;
      return accepted.receipt;
    });
    // The command mutex protects only admission. An independent client can stop
    // or retrieve this command while its ordinary tools and model are running.
    const exchange = this.exchangeDebug(run, command).catch(error => this.fail(run, 'internal', `Debugger exchange could not settle: ${message(error)}`));
    run.done = Promise.all([run.done, exchange]).then(() => undefined);
    return receipt;
  }

  private async exchangeDebug(run: Run, command: Extract<RunCommand, { type: 'debug-message' }>): Promise<void> {
    const pause = run.debugPause!;
    const prepared = run.debugPrepared!;
    await this.afterWrite('debug-exchange-admitted', run.jobId);
    if (this.ignoring(run)) return;
    const changes = await documentChanges(this.projectRoot, run.planId, run.directory, run.record.manifest);
    if (changes.length > 0) { await this.fail(run, 'inputs-changed', `Captured documents changed while paused: ${changes.join('; ')}`); return; }
    if (this.ignoring(run)) return;
    const result = await prepared.exchange(command.payload.message);
    if (this.ignoring(run) || run.debugPause !== pause) return;
    const taskState = result.settlementConfirmed === false ? 'terminal' : result.pending ? 'pending' : result.ended === 'submitted' && result.value !== undefined ? 'accepted' : 'terminal';
    await run.mutex.run(async () => {
      if (this.ignoring(run) || run.debugPause !== pause) return;
      pause.state = 'paused'; pause.revision += 1; pause.taskState = taskState;
      pause.nextAction = taskState === 'pending' ? 'Resume continues the latest settled engineer session with its ordinary task.' : 'Resume handles the held engineer outcome without another model call.';
      pause.summary = taskState === 'pending' ? 'Engineer conversation settled; assignment remains pending. Resume continues its ordinary task.'
        : taskState === 'accepted' ? 'Engineer submitted an accepted action; workflow handling is held until resume.'
        : result.settlementConfirmed === false ? 'Engineer outcome retained, but tool settlement was not confirmed; writer, exchanges and gates remain blocked.' : `Engineer ended ${result.ended}; its actual outcome is held until resume.`;
      const exchange: DebugExchange = { ...pause, kind: 'exchange', commandId: command.commandId, cursor: run.log.nextSequence,
        status: 'settled', answer: result.lastText ?? null, invocation: result.id || null, session: result.session || null,
        point: result.ref || null, outcome: result.ended, error: result.error ?? null,
        ...(result.settlementConfirmed === undefined ? {} : { settlementConfirmed: result.settlementConfirmed }),
        continuityLoss: result.actual === 'fresh' && run.log.all('invocation-ended').some(event => event.data.invocation === result.id && event.data.degraded) ? run.log.all('invocation-ended').find(event => event.data.invocation === result.id)?.data.degraded?.reason ?? null : null,
        verdicts: [...result.verdicts ?? []], evidence: result.id === '' ? [] : [runLayout.invocation(result.id), runLayout.outcome(result.id), runLayout.observations(result.id), runLayout.transcript(result.session),
          ...(result.ended === 'submitted' ? [runLayout.submission(result.id)] : [])] };
      await run.log.append({ type: 'debug-exchange-settled', data: { pauseId: pause.pauseId, revision: pause.revision, commandId: command.commandId, result: exchange } }, this.now());
      pause.cursor = run.log.version;
    });
    run.notify();
  }

  private async resumeDebug(command: Extract<RunCommand, { type: 'debug-resume' }>, contentHash: string): Promise<Receipt> {
    const { planId, jobId, pauseId, expectedRevision } = command.payload;
    this.refuseEarlierPolicy(planId, jobId);
    const run = this.runs.get(key(planId, jobId));
    if (!run) throw new CommandRejection('not-found', `No run ${jobId} for plan "${planId}"`);
    const receipt = await run.mutex.run(async () => {
      if (this.ignoring(run)) throw new CommandRejection('conflict', 'This run accepts no debugger commands');
      const pause = run.debugPause;
      if (!pause || pause.pauseId !== pauseId) throw new CommandRejection('conflict', 'This is not the current breakpoint occurrence');
      if (pause.revision !== expectedRevision) throw new CommandRejection('stale-version', `The pause is at revision ${pause.revision}`, pause.revision);
      if (pause.state !== 'paused') throw new CommandRejection('busy', `The run is ${pause.state}`);
      // A held terminal outcome can return to ordinary failure handling without
      // acquiring a writer or starting a model. The unsettled barrier stays set.
      if (run.writer.isUnsettled && (pause.taskState !== 'terminal' || !run.debugPrepared?.held())) throw new CommandRejection('busy', run.writer.blocked!);
      await this.adoptContinuityPolicy(run, pauseId);
      const at = this.now();
      const accepted = this.commands.accept(command, contentHash, jobId, run.log.nextSequence, at);
      await run.log.append({ type: 'debug-resumed', data: { pauseId, revision: pause.revision + 1, command: accepted, ...(command.payload.message === undefined ? {} : { message: command.payload.message }) } }, at);
      run.debugPrepared?.resume(command.payload.message);
      this.commands.remember(accepted);
      run.debugPause = undefined;
      return accepted.receipt;
    });
    run.notify();
    return receipt;
  }

  private async stop(command: Extract<RunCommand, { type: 'stop-job' }>, contentHash: string): Promise<Receipt> {
    const { planId, jobId } = command.payload;
    this.refuseEarlierPolicy(planId, jobId);
    const run = this.runs.get(key(planId, jobId));
    if (!run) throw new CommandRejection('not-found', `No run ${jobId} for plan "${planId}"`);
    const receipt = await run.mutex.run(async () => {
      this.commands.requireVersion(command, run.log.version);
      if (run.log.terminal) throw new CommandRejection('conflict', `The run has already ended (${run.log.terminal.type})`);
      if (run.stopRequested) throw new CommandRejection('conflict', 'A stop was already accepted for this run');
      const at = this.now();
      const accepted = this.commands.accept(command, contentHash, jobId, run.log.nextSequence, at);
      await run.log.append({ type: 'stop-requested', data: { command: accepted } }, at);
      run.stopRequested = true;
      this.commands.remember(accepted);
      return accepted.receipt;
    });
    // A driver waiting at the review stop has no session to stop; it reads
    // the stop and returns, and the run is stopped with nothing written.
    run.readiness?.controller.abort();
    run.notify();
    const driving = run.done;
    const stopping = this.endStopped(run).catch(error => this.warn(`Run ${jobId}: ${message(error)}`));
    run.done = Promise.all([driving, stopping]).then(() => undefined);
    return receipt;
  }

  /**
   * Ends a stopped run: asks every open session to stop, the writer's and
   * each reader's, waits for them at most the bound, finishes every review
   * request still unsettled as stopped, and marks the run stopped whether or
   * not they became idle. Whatever a session produces afterwards is rejected.
   */
  private async endStopped(run: Run): Promise<void> {
    const grace = this.options.stopGraceMs ?? run.policy.limits.stopSettleMs;
    const settled = await this.stopReaders(run, 'stopped', grace, true);
    const readiness = run.readiness;
    if (readiness !== undefined) {
      let timer: NodeJS.Timeout | undefined;
      const finished = await Promise.race([
        readiness.settled.then(() => true),
        new Promise<boolean>(resolve => { timer = setTimeout(() => resolve(false), grace); }),
      ]);
      clearTimeout(timer);
      if (!finished) throw new Error(`Readiness did not settle within ${grace} ms; refusing to publish job-stopped`);
    }
    if (this.closed) return;
    const repair = this.latestRepairIncident(run);
    if (repair !== undefined && ['admitted', 'running'].includes(repair.stage)) {
      await this.persistRepairIncident(run, { ...repair.incident, revision: repair.incident.revision + 1, endedAt: this.now().toISOString(),
        continuation: { delivered: false, reason: 'Stop interrupted automatic repair; no continuation or restart was authorized', evidence: [] } }, 'interrupted');
    }
    await this.endRun(run, { type: 'job-stopped', data: { settled } });
  }

  /**
   * Stops the run's readers, and with `writer` its writer too: no attempt
   * starts from here on, every open session is asked to stop, and each open
   * invocation and review attempt is awaited at most `grace`. A request still
   * unsettled then is finished as not verified with `reason`, so the run's
   * terminal event follows a complete review history. Answers whether every
   * session stopped within the bound.
   */
  private async stopReaders(run: Run, reason: NotVerifiedReason, grace: number, writer = false): Promise<boolean> {
    run.readerStop ??= reason;
    run.reviews?.close();
    for (const preparation of run.reviewPreparations.values()) preparation.abort();
    const sessions = run.sessions(live => writer || live.reader);
    let timer: NodeJS.Timeout | undefined;
    const settled = sessions.length === 0 || await Promise.race([
      Promise.all(sessions.map(session => session.stop().then(() => true, () => true))).then(() => true),
      new Promise<boolean>(resolve => { timer = setTimeout(() => resolve(false), grace); }),
    ]);
    clearTimeout(timer);
    // The run's terminal event is its last write, so the invocations it has
    // open, and the attempts that record their readers' results, close first.
    const open = [...run.live.values()].filter(live => writer || live.reader).map(live => live.done);
    await Promise.race([
      Promise.all([...open, run.reviews?.settled()]),
      new Promise<void>(resolve => { timer = setTimeout(resolve, grace); }),
    ]);
    clearTimeout(timer);
    if (!this.closed && run.policy.reviews !== undefined) {
      await this.finishUnsettledReviews(run, (_request, running) => ({
        reason,
        detail: reason === 'deadline'
          ? (running ? 'The reviews\' settlement bound passed while this attempt ran; its reader was stopped' : 'The reviews\' settlement bound passed before this review ran')
          : (running ? 'The run stopped while this attempt ran; its reader was stopped' : 'The run stopped before this review ran'),
      }));
    }
    return settled;
  }

  /**
   * A person's approval of the accepted analysis. At the review stop it
   * wakes the driver, which goes on to readiness; in any other run it is
   * recorded and changes nothing else. It is decided under the run's lock,
   * against the log as it stands, like a stop.
   */
  private async approve(command: Extract<RunCommand, { type: 'approve-analysis' }>, contentHash: string): Promise<Receipt> {
    const { planId, jobId, reviewer, note } = command.payload;
    this.refuseEarlierPolicy(planId, jobId);
    const run = this.runs.get(key(planId, jobId));
    if (!run) throw new CommandRejection('not-found', `No run ${jobId} for plan "${planId}"`);
    const receipt = await run.mutex.run(async () => {
      this.commands.requireVersion(command, run.log.version);
      const snapshot = runSnapshot(run.record, run.log.events);
      const refusal = approvalRefusal(run, snapshot);
      if (refusal !== null) throw new CommandRejection('conflict', refusal);
      const changes = await documentChanges(this.projectRoot, planId, run.directory, run.record.manifest);
      if (changes.length > 0) throw new CommandRejection('inputs-changed', changes.join('; '));
      if (snapshot.state === 'running' && snapshot.phase === 'awaiting-review') {
        await this.adoptContinuityPolicy(run, 'analysis-approval');
      }
      const at = this.now();
      const accepted = this.commands.accept(command, contentHash, jobId, run.log.nextSequence, at);
      await run.log.append({
        type: 'analysis-approved',
        data: {
          command: accepted,
          reviewer,
          note: note ?? null,
          duringRun: snapshot.state === 'running' && snapshot.phase !== 'awaiting-review',
        },
      }, at);
      this.commands.remember(accepted);
      return accepted.receipt;
    });
    run.notify();
    return receipt;
  }

  /**
   * A person's answer, waiver or revocation of one CheckFinding. Under the
   * run's lock it expects the run's version and the CheckFinding's revision
   * the person saw, validates the person's authority, and commits the one
   * decision the child accepts on a `check-findings-recorded` line that holds
   * the accepted command. A refusal appends nothing. A work item waiting for
   * the answer reads the state again. After the run has ended, only a plan
   * deviation accepts a command: the person reviews the run's deviations
   * once it is over.
   */
  private async checkFindingCommand(command: CheckFindingUserCommand, contentHash: string): Promise<Receipt> {
    const { planId, jobId } = command.payload;
    this.refuseEarlierPolicy(planId, jobId);
    const run = this.runs.get(key(planId, jobId));
    if (!run) throw new CommandRejection('not-found', `No run ${jobId} for plan "${planId}"`);
    const at = this.now();
    let accepted: AcceptedCommand | undefined;
    const committed = await commitCheckFindingChange(run, ({ log, state }) => {
      // A person's decision about a plan deviation outlasts the run; every
      // other CheckFinding of an ended run accepts no command.
      const entry = state.findings.get(command.payload.checkFinding);
      if (log.terminal !== undefined && (entry === undefined || !isPlanDeviation(entry))) {
        throw new CommandRejection('conflict', `The run has ended; its CheckFindings other than plan deviations accept no command. Run ${log.runId} has ended with ${log.terminal.type}`);
      }
      this.commands.requireVersion(command, log.version);
      const change = userCheckFindingChange(command, entry);
      if (!change.ok) throw new CommandRejection(change.code, change.message, undefined, change.evidence);
      const receipt = this.commands.accept(command, contentHash, jobId, log.nextSequence, at);
      accepted = receipt;
      return {
        commands: [change.command],
        compose: decided => ({ event: { type: 'check-findings-recorded', data: { cause: { kind: 'user-command', command: receipt }, checkFindings: [...decided.events] } } }),
      };
    }, at, { afterEnd: true });
    if (committed.kind === 'refused') {
      const { refusal } = committed;
      if (refusal.reason === 'run-ended') throw new CommandRejection('conflict', `The run has ended; its CheckFindings accept no command. ${refusal.message}`);
      if (refusal.reason === 'check-finding') {
        const entry = checkFindingStateOf(run.log.ledger).findings.get(command.payload.checkFinding);
        throw new CommandRejection(userRejectionCode(refusal.rejection), refusal.message, undefined,
          entry === undefined ? [] : [`${entry.id} is at revision ${entry.revision}`]);
      }
      throw new CommandRejection('conflict', refusal.message);
    }
    if (committed.kind !== 'committed' || accepted === undefined) throw new CommandRejection('internal', 'The CheckFinding command committed nothing');
    this.commands.remember(accepted);
    run.notify();
    return accepted.receipt;
  }

  // The run itself

  private ignoring(run: Run): boolean {
    return run.stopRequested || this.closed || run.log.terminal !== undefined;
  }

  private async drive(run: Run, agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>, baseline: MeasurementSnapshot,
    recovering = false): Promise<void> {
    // The run's files are written and its first event is in the log; nothing
    // of the run itself has happened yet.
    if (!recovering) await this.afterWrite('job-created', run.record.jobId);
    if (this.ignoring(run)) return;
    if (recovering) await this.handling.cleanupClosedScratch(run);
    this.startReviews(run, agent, packages);
    const accepted = await this.analyse(run, agent, packages, baseline);
    if (!accepted || this.ignoring(run)) return;

    const approved = await this.awaitReview(run);
    if (!approved || this.ignoring(run)) return;

    const ready = await this.reachReadiness(run);
    if (!ready || this.ignoring(run)) return;

    // Queue only after the accepted analysis is approved and implementation can begin.
    // This awaits persistence, never the administration model or tracker command.
    await this.scheduleBeads(run, 'start');
    await this.setupScratch(run);
    if (this.ignoring(run)) return;

    await this.materializeScenarios(run);
    if (this.ignoring(run)) return;

    const worked = await this.coordination(run).takeWorkItems(agent, packages, baseline);
    if (!worked || this.ignoring(run)) return;

    // Every review settles, or is finished at its bound, before the final
    // gate: the run completes with no reader left and no request pending.
    await this.settleReviews(run);
    if (this.ignoring(run)) return;

    await this.qualifyFinal(run, agent, packages);
  }

  /** A repaired candidate receives new semantic evidence in the same run. */
  private async qualifyFinal(run: Run, agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>): Promise<void> {
    while (!this.ignoring(run)) {
      const binding = await this.assessNonfunctional(run, agent, packages);
      if (binding === null || this.ignoring(run)) return;
      try {
        if (!await this.recordNonfunctionalDeviations(run, binding) || this.ignoring(run)) return;
        const failed = await this.finalGate(run, binding);
        if (failed === undefined || this.ignoring(run)) return;
        if (!await this.planFinalCorrection(run, agent, packages, binding, failed)) return;
        const baseline = await this.coordination(run).baselineSnapshot();
        if (baseline === null) throw new Error('Final correction requires the retained run baseline');
        if (!await this.coordination(run).takeWorkItems(agent, packages, baseline) || this.ignoring(run)) return;
        await this.settleReviews(run);
      }
      catch (error) {
        if (!(error instanceof CandidateReassessmentRequired)) throw error;
        const replay = replayNonfunctionalPhase(run.log.ledger.replay(),
          assessedElements(await this.coordination(run).frozenCatalog()), run.policy.limits.nonfunctionalRoundsPerPlan ?? 3);
        const observed = await this.previewCandidateTree();
        if (!replay.ok || !replay.value.final || replay.value.final.assessment.id !== binding.assessment.id
          || observed.tree === binding.assessment.candidate.tree) {
          await this.fail(run, 'inputs-changed', 'Final reassessment requires the retained assessment and a changed candidate'); return;
        }
        const spent = replay.value.input.closedRounds.length;
        await this.write(run, { type: 'nonfunctional-final-invalidated', data: {
          round: spent,
          candidate: binding.candidateId, assessment: binding.assessment.id, tree: observed.tree,
        } });
      }
    }
  }

  /** Retain the failed attempt and let the plan architect choose ordinary correction work. */
  private async planFinalCorrection(run: Run, agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>,
    binding: { candidateId: string; assessment: Assessment }, gate: GateAttempt): Promise<boolean> {
    if (run.log.all('final-correction-planned').some(event => event.data.gate === gate.id)) return true;
    const loaded = packages.get('global-fork');
    if (loaded === undefined) throw new Error('Final correction requires the plan architect package');
    const request = `final-correction-${gate.id}`;
    const diagnostics = await this.diagnosticsOf(run, gate, 'local-architect');
    const earlier = run.log.all('invocation-started').filter(event => event.data.work.request === request);
    let accepted: { id: string; value: FinalCorrection } | undefined;
    // Accepted decisions survive an interruption before their work item is recorded.
    for (const start of earlier) {
      const end = run.log.all('invocation-ended').find(event => event.data.invocation === start.data.invocation);
      if (end?.data.ended !== 'submitted' || end.data.submission === null) continue;
      const bytes = await readIfExists(run.path(runLayout.submission(start.data.invocation)));
      if (bytes === undefined || sha256(bytes) !== end.data.submission) throw new Error('Final correction submission is unavailable');
      const { schema: _schema, ...body } = JSON.parse(bytes.toString('utf8')) as Record<string, unknown>;
      accepted = { id: start.data.invocation, value: finalCorrectionSchema.parse(body) };
    }
    let priorUnfinished: string | undefined;
    while (accepted === undefined) {
      if (this.ignoring(run)) return false;
      const result = await this.runInvocation<FinalCorrection>(run, agent, {
        role: 'global-fork', work: { request }, task: { kind: 'final-correction', goal: `Resolve failed final verification ${gate.id}`,
          requirements: [`Inspect the retained failure evidence at ${run.path(runLayout.gate(gate.id))} and select the responsible module and next correction goal. Preserve accepted work and verify the corrected candidate.`] },
        attempt: run.log.all('invocation-started').filter(event => event.data.work.request === request).length + 1, loaded,
        systemPrompt: renderGlobalForkPrompt(loaded, this.projectRoot),
        prompt: [
          `Final verification ${gate.id} is ${gate.verdict}. The plan remains unfinished; accepted work is retained.`,
          `For this turn, use submit_final_correction to choose the module architect and goal for the next correction; its supplied schema defines this task's answer.`,
          'Investigate the actual diagnostics. Explain why the next approach should help; repeated failure requires reconsideration, not abandonment.',
          'An environment or verification issue may need investigation before source changes. Delegate that investigation as the goal where appropriate.',
          `Gate evidence: ${run.path(runLayout.gate(gate.id))}`,
          ...diagnostics.summary,
          ...(priorUnfinished === undefined ? [] : [priorUnfinished]),
          this.coordination(run).planPackage(await this.coordination(run).frozenCatalog()),
        ].join('\n\n'),
        start: { mode: 'fresh' }, keep: () => finished('work-closed'),
        toolName: 'submit_final_correction', description: 'Choose the responsible module architect and correction goal after failed final verification.',
        inputSchema: z.toJSONSchema(finalCorrectionSchema) as JsonSchema,
        submissionSchema: 'ramify-agent.final-correction/1', validate: input => validateAgainst(finalCorrectionSchema, input),
        scope: { write: null, measurement: null, size: null }, writer: true,
        equip: session => ({ ...this.nonfunctionalTools(run, session, []),
          builtinTools: ['read', 'write', 'edit', 'grep', 'find', 'ls'] }),
      });
      if (this.ignoring(run)) return false;
      if (result.ended !== 'submitted' || result.value === undefined) {
        priorUnfinished = `The previous decision turn ended ${result.ended} without an accepted answer. Review ${run.path(runLayout.outcome(result.id))}, retain the existing work, and supply the next correction decision through submit_final_correction.`;
        continue;
      }
      accepted = { id: result.id, value: result.value };
    }
    if (this.ignoring(run)) return false;
    const records = committedRecords(run.log.ledger.replay());
    const item = workItemSchema.parse({ schema: 'ramify-agent.work-item/1', id: workItemId(records.workItems.length + 1),
      module: accepted.value.module, origin: { finalVerification: gate.id },
      goal: [accepted.value.goal, accepted.value.rationale, `Failed verification: ${run.path(runLayout.gate(gate.id))}`, ...diagnostics.summary].join('\n\n'),
      requirementRefs: [], acceptanceRefs: [], contextRefs: [], startedFor: null,
    });
    await this.write(run, { type: 'final-correction-planned', data: { gate: gate.id, invocation: accepted.id,
      workItem: item.id, candidate: binding.candidateId, assessment: binding.assessment.id, round: binding.assessment.round } },
    [{ path: workLayout.item(item.id), id: item.id, revision: 1, body: item }]);
    return !this.ignoring(run);
  }

  /** Prepare the actual eventual commit tree after all source-mutating rendering. */
  private async prepareNonfunctionalCandidate(run: Run): Promise<{ id: string; candidate: Candidate } | null> {
    run.writer.requireSettled('A non-functional candidate cannot be prepared');
    const changed = await documentChanges(this.projectRoot, run.record.planId, run.directory, run.record.manifest);
    if (changed.length > 0) {
      await this.fail(run, 'inputs-changed', `The captured plan evidence changed before assessment: ${changed.join('; ')}`, [runLayout.documentManifest]);
      return null;
    }
    await this.gates.rerenderScenarios(run);
    const preview = await this.previewCandidateTree();
    const id = `cand-${String(run.log.count('candidate-prepared') + 1).padStart(3, '0')}`;
    const candidate = { tree: preview.tree, head: preview.head, preparedAt: this.now().toISOString() };
    const body = preparedCandidateSchema.parse({
      schema: 'ramify-agent.prepared-candidate/1', candidate,
      scenarioRenderingHash: sha256(canonicalJson(this.gates.expectedFeatures(run))), writerSettled: true,
    });
    await this.write(run, { type: 'candidate-prepared', data: { candidate: id, tree: candidate.tree } }, [
      { path: runLayout.candidate(id), id, revision: 1, body },
    ]);
    await this.afterWrite('candidate-prepared', run.record.jobId);
    return { id, candidate };
  }

  /** Re-read the ledger after each step: a committed prefix is never repeated. */
  private async assessNonfunctional(
    run: Run, agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>,
  ): Promise<{ candidateId: string; assessment: Assessment } | null> {
    const evidence = await readAcceptedEvidence(run.directory, run.record.manifest, acceptedAnalysisReferences(run.log.events));
    if (evidence.status === 'unavailable') {
      await this.fail(run, 'analysis-invalid', `The fixed non-functional catalog is unavailable: ${evidence.reason}`);
      return null;
    }
    const accepted = run.log.find('analysis-accepted');
    const catalogHash = accepted?.data.evidence.catalog.hash;
    if (catalogHash === undefined) {
      await this.fail(run, 'analysis-invalid', 'The fixed non-functional catalog has no accepted hash');
      return null;
    }
    const marker = run.log.find('nonfunctional-phase-started');
    if (!marker) {
      await this.write(run, { type: 'nonfunctional-phase-started', data: { catalogHash, maxRounds: 3 } });
      await this.afterWrite('nonfunctional-phase-started', run.record.jobId);
    }
    const nfrIds = assessedElements(evidence.catalog);
    for (;;) {
      if (this.ignoring(run)) return null;
      const replay = replayNonfunctionalPhase(run.log.ledger.replay(), nfrIds, marker?.data.maxRounds ?? 3);
      if (!replay.ok) {
        await this.fail(run, 'recovery-exhausted', `Committed non-functional phase is unavailable: ${replay.reason}`);
        return null;
      }
      const state = replay.value;
      const decision = decideNonfunctionalRound(state.input);
      if (decision.action === 'stop') {
        if (state.final === null) {
          await this.fail(run, 'recovery-exhausted', 'The closed non-functional phase has no final assessment');
          return null;
        }
        return { candidateId: state.final.candidateId, assessment: state.final.assessment };
      }
      if (decision.action === 'unavailable') {
        await this.fail(run, 'recovery-exhausted', 'No matching non-functional evidence was obtained within the captured bound');
        return null;
      }
      if (decision.action === 'prepare-candidate') {
        if (await this.prepareNonfunctionalCandidate(run) === null) return null;
        continue;
      }
      if (decision.action === 'assess') {
        const candidate = state.input.candidate;
        if (candidate === null || state.candidateId === null) throw new Error('assessment lacks prepared candidate');
        if (await this.assessNonfunctionalCandidate(run, agent, packages, evidence,
          { id: state.candidateId, candidate }, decision.round, decision.phase) === null) return null;
        continue;
      }
      if (decision.action === 'investigate' || decision.action === 'repair-or-close') {
        if (state.input.candidate === null || state.assessment === null) throw new Error('action lacks assessed candidate');
        if (state.assignment !== null) {
          if (!await this.resumeNonfunctionalRepair(run, agent, packages, evidence.catalog, state.assignment)) return null;
          continue;
        }
        const action = await this.nonfunctionalAction(run, agent, packages, evidence.catalog,
          state.input.candidate, state.assessment, decision, state.investigatedNfrs);
        if (action === null) return null;
        if (action.value.kind === 'investigate') {
          if (!await this.nonfunctionalInvestigation(run, agent, packages, state.assessment, action.value)) return null;
          continue;
        }
        if (action.value.kind === 'repair') {
          if (state.candidateId === null || !await this.nonfunctionalRepair(run, agent, packages, evidence.catalog,
            state.assessment, state.candidateId, action.value)) return null;
          continue;
        }
        await this.closeNonfunctionalRound(run, state, 'exhausted', action.invocation);
        continue;
      }
      if (decision.action === 'close') {
        if (decision.unresolved.length > 0) {
          if (state.input.candidate === null || state.assessment === null) throw new Error('closure lacks assessed candidate');
          const action = await this.nonfunctionalAction(run, agent, packages, evidence.catalog,
            state.input.candidate, state.assessment, decision, state.investigatedNfrs);
          if (action === null) return null;
          if (action.value.kind !== 'close') throw new Error('Closed repaired round received an action other than close');
          await this.closeNonfunctionalRound(run, state, decision.outcome, action.invocation);
        } else {
          await this.closeNonfunctionalRound(run, state, decision.outcome);
        }
        continue;
      }
    }
  }

  /** Record each exhausted source obligation with its user request in one durable line. */
  private async recordNonfunctionalDeviations(
    run: Run, binding: { candidateId: string; assessment: Assessment },
  ): Promise<boolean> {
    const unavailable = async (reason: string, refs: string[] = []): Promise<false> => {
      await this.fail(run, 'recovery-exhausted', `Non-functional deviation evidence is unavailable: ${reason}`, refs);
      return false;
    };
    const evidence = await readAcceptedEvidence(run.directory, run.record.manifest, acceptedAnalysisReferences(run.log.events));
    if (evidence.status === 'unavailable') return unavailable(evidence.reason);
    const changed = await documentChanges(this.projectRoot, run.record.planId, run.directory, run.record.manifest);
    if (changed.length > 0) {
      await this.fail(run, 'inputs-changed', `Captured plan evidence changed before non-functional deviation review: ${changed.join('; ')}`,
        [runLayout.documentManifest]);
      return false;
    }
    const nfrIds = assessedElements(evidence.catalog);
    const replay = replayNonfunctionalPhase(run.log.ledger.replay(), nfrIds, run.policy.limits.nonfunctionalRoundsPerPlan ?? 3);
    if (!replay.ok) return unavailable(replay.reason);
    const decision = decideNonfunctionalRound(replay.value.input);
    if (decision.action !== 'stop' || replay.value.final?.candidateId !== binding.candidateId
      || replay.value.final.assessment.id !== binding.assessment.id
      || replay.value.final.candidate.tree !== binding.assessment.candidate.tree) {
      return unavailable('The final closed assessment does not match the candidate sent to the gate');
    }
    if (decision.outcome === 'satisfied') return true;
    if (decision.outcome !== 'exhausted') return unavailable(`The final round ended ${decision.outcome}`);
    const closed = run.log.all('nonfunctional-round-closed').at(-1);
    const actionId = closed?.data.actionInvocation;
    if (closed?.data.outcome !== 'exhausted' || !actionId) return unavailable('Exhaustion has no accepted coordinator close action');
    const start = run.log.all('invocation-started').filter(event => event.data.invocation === actionId
      && event.data.role === 'nonfunctional-coordinator');
    const ended = run.log.all('invocation-ended').filter(event => event.data.invocation === actionId);
    if (start.length !== 1 || ended.length !== 1 || start[0]!.sequence >= ended[0]!.sequence
      || start[0]!.data.session !== ended[0]!.data.session || ended[0]!.data.ended !== 'submitted') {
      return unavailable('The close action has no accepted coordinator invocation', [runLayout.submission(actionId)]);
    }
    const outcome = invocationOutcomeSchema.safeParse(this.committedBody(run, runLayout.outcome(actionId)));
    const raw = await readIfExists(run.path(runLayout.submission(actionId)));
    if (!outcome.success || outcome.data.disposition !== 'applied' || outcome.data.ended !== 'submitted'
      || raw === undefined || sha256(raw) !== ended[0]!.data.submission
      || outcome.data.submission?.hash !== ended[0]!.data.submission) {
      return unavailable('The accepted close submission bytes or outcome cannot be verified', [runLayout.submission(actionId)]);
    }
    let action: CoordinatorAction;
    try {
      const envelope = JSON.parse(raw.toString('utf8')) as Record<string, unknown>;
      if (envelope.schema !== 'ramify-agent.nonfunctional-action/1') throw new Error('wrong close submission schema');
      const { schema: _schema, ...body } = envelope;
      action = coordinatorActionSchema.parse(body);
    } catch (error) {
      return unavailable(`The close submission cannot be parsed: ${message(error)}`, [runLayout.submission(actionId)]);
    }
    if (action.kind !== 'close') return unavailable('The exhausted action was not a close submission');
    const unresolved = binding.assessment.results.filter(item => item.result !== 'satisfied');
    const choices = new Map(action.deviations.map(choice => [choice.nfr, choice]));
    if (choices.size !== unresolved.length || action.deviations.length !== unresolved.length
      || unresolved.some(item => !choices.has(item.nfr))
      || action.deviations.some(choice => choice.proposedAlternative === null && choice.uncertainty.trim() === '')) {
      return unavailable('The accepted close action does not dispose each unresolved NFR exactly once');
    }
    const preview = await this.previewCandidateTree();
    if (preview.tree !== binding.assessment.candidate.tree) {
      throw new CandidateReassessmentRequired('The current candidate needs fresh assessment before recording deviations');
    }
    for (const result of unresolved) {
      const item = evidence.catalog.elements.find(candidate => candidate.id === result.nfr);
      const choice = choices.get(result.nfr);
      if (!item || !choice) return unavailable(`Fixed NFR ${result.nfr} has no accepted source or close choice`);
      // Continuations after external repairs or architect corrections keep
      // earlier decisions as history. A new candidate receives its own evidence.
      const invalidated = new Set([
        ...run.log.all('nonfunctional-final-invalidated').map(event => event.data.assessment),
        ...run.log.all('final-correction-planned').map(event => event.data.assessment),
      ]);
      const history = run.log.all('nonfunctional-deviation-recorded').filter(event => event.data.nfr === result.nfr);
      const previous = history.filter(event => event.data.assessment === binding.assessment.id);
      if (previous.length > 1 || history.some(event => event.data.assessment !== binding.assessment.id
        && !invalidated.has(event.data.assessment))) {
        return unavailable(`NFR ${result.nfr} has a conflicting recorded deviation`);
      }
      if (previous.length === 1) {
        const event = previous[0]!;
        const recorded = nonfunctionalDeviationSchema.safeParse(this.committedBody(run, runLayout.nonfunctionalDeviation(event.data.deviation)));
        const expected = prepareNonfunctionalDeviation({ id: event.data.deviation, checkFinding: event.data.checkFinding,
          item, assessment: binding.assessment, result,
          candidate: binding.assessment.candidate, coordinatorInvocation: binding.assessment.coordinatorInvocation,
          proposedAlternative: choice.proposedAlternative ?? '', uncertainty: choice.uncertainty });
        const finding = checkFindingStateOf(run.log.ledger).findings.get(event.data.checkFinding);
        if (!recorded.success || !expected.ok || canonicalJson(recorded.data) !== canonicalJson(expected.record)
          || finding?.reports[0]?.judgment?.ground?.hash !== nonfunctionalDeviationHash(recorded.data)
          || finding.reports[0].observation.kind !== 'plan-deviation'
          || finding.decisions[0]?.decision.action !== 'request-user-decision') {
          return unavailable(`Previously recorded deviation for ${result.nfr} cannot be verified`);
        }
        continue;
      }
      const version = run.log.version;
      const id = `nfd-${String(run.log.count('nonfunctional-deviation-recorded') + 1).padStart(3, '0')}`;
      const committed = await commitCheckFindingChange(run, ({ log, state }) => {
        if (log.version !== version || log.terminal !== undefined) return { stale: 'The assessed candidate moved before deviation recording' };
        if (log.all('nonfunctional-deviation-recorded').some(event => event.data.nfr === result.nfr
          && event.data.assessment === binding.assessment.id)) {
          return { stale: `NFR ${result.nfr} was already recorded` };
        }
        const prepared = prepareNonfunctionalDeviation({ id, checkFinding: nextCheckFinding(state), item,
          assessment: binding.assessment, result,
          candidate: binding.assessment.candidate, coordinatorInvocation: binding.assessment.coordinatorInvocation,
          proposedAlternative: choice.proposedAlternative ?? '', uncertainty: choice.uncertainty });
        if (!prepared.ok) throw new Error(prepared.errors.join('; '));
        const record = prepared.record;
        const path = runLayout.nonfunctionalDeviation(id);
        const commands = nonfunctionalDeviationCommands(state, record, evidence.manifest, path);
        if (!commands.ok) throw new Error(commands.errors.join('; '));
        return { commands: commands.commands, compose: decided => ({
          event: { type: 'nonfunctional-deviation-recorded', data: { deviation: id, nfr: result.nfr,
            assessment: binding.assessment.id, checkFinding: record.checkFinding, checkFindings: [...decided.events] } },
          records: [{ path, id, revision: 1, body: record }],
        }) };
      }, this.now());
      if (committed.kind !== 'committed') return unavailable(`Could not record deviation ${id}: ${committed.kind === 'refused' ? committed.refusal.message : 'already replayed'}`);
      run.notify();
    }
    return true;
  }

  private async closeNonfunctionalRound(
    run: Run, state: import('./nonfunctional-phase.js').CommittedNonfunctionalPhase,
    outcome: 'satisfied' | 'continue' | 'exhausted', actionInvocation?: string,
  ): Promise<void> {
    const number = state.input.closedRounds.length + 1;
    const initial = state.input.initial;
    if (initial === null || state.candidateId === null) throw new Error('round closure lacks candidate-bound initial evidence');
    const id = `nfr-round-${String(number).padStart(3, '0')}`;
    const record = roundSchema.parse({ schema: 'ramify-agent.nonfunctional-round/1', number,
      initial: initial.id, investigation: state.investigationInvocations.at(-1) ?? null,
      repair: state.repair?.assignment ?? null, reassessment: state.input.reassessment?.id ?? null, outcome });
    await this.write(run, { type: 'nonfunctional-round-closed', data: { round: number, record: id, outcome,
      ...(actionInvocation === undefined ? {} : { actionInvocation }),
    } }, [
      { path: runLayout.nonfunctionalRound(number), id, revision: 1, body: record },
    ]);
  }

  /** Current immutable source selection; an empty list requires an actual successful diff. */
  private async nonfunctionalSourceInputs(run: Run, candidate: Candidate, scope: readonly string[] = ['.'], workspace = false) {
    const base = this.coordination(run).accepted();
    const runStart = this.recordedRunBase(run.record, run.log);
    const comparisons: SnapshotComparison[] = [];
    for (const [name, boundary] of [['run-start', runStart], ['accepted-boundary', base]] as const) {
      if (boundary === undefined) continue;
      const diff = await this.candidates.diffNameStatus(this.projectRoot, boundary, candidate.tree);
      const changes = [...new Map(diff.filter(change => nonfunctionalSourceAllows(change.path, scope)).map(change => [`${change.status}\0${change.path}`, change])).values()]
        .sort((left, right) => left.path.localeCompare(right.path) || left.status.localeCompare(right.status));
      comparisons.push({ name, base: boundary, target: candidate.tree, changes });
    }
    // Reuse candidate entries for optional hint filtering and the source tools. No live probes.
    const entries = new Map((await this.candidates.treeEntries(this.projectRoot, candidate.tree))
      .filter(entry => nonfunctionalSourceAllows(entry.path, scope)).map(entry => [entry.path, entry]));
    const directories = new Set(['']);
    for (const path of entries.keys()) for (let directory = posix.dirname(path); directory !== '.' && !directories.has(directory); directory = posix.dirname(directory)) directories.add(directory);
    const snapshot: CandidateSnapshot = { commit: candidate.tree, base, tree: candidate.tree, entries, directories,
      changes: comparisons.find(comparison => comparison.name === 'accepted-boundary')!.changes };
    const groups: StartingPointGroup[] = [];
    const records = committedRecords(run.log.ledger.replay());
    for (const result of records.results.values()) {
      if (result.outcome !== 'accepted') continue;
      const assignment = records.assignments.get(result.iteration);
      if (assignment === undefined) continue;
      const assigned = this.coordination(run).assignmentStartingPoints(assignment);
      const modules = assignment.scope.resolved.ownership.modules.filter(module => {
        const source = resolve(this.projectRoot, module.directory, 'src');
        return assignment.scope.resolved.roots.some(root => root === source || isContained(root, source))
          || assignment.gate.tests.exactOwners.includes(module.id)
          || assignment.gate.tests.subtrees.some(owner => module.id === owner || module.id.startsWith(`${owner}/`));
      });
      groups.push({ origin: { ...assigned.origin, producer: 'assigned module/source/test locations' }, points: modules.flatMap(module => [
        { path: posix.join(module.directory, 'README.md'), note: `Assigned module ${module.id} purpose` },
        { path: posix.join(module.directory, 'module.ramify'), note: `Assigned module ${module.id} declaration` },
        { path: posix.join(module.directory, 'src'), note: `Assigned module ${module.id} source` },
        { path: posix.join(module.directory, 'src/tests'), note: `Assigned module ${module.id} owned tests` },
      ]) }, assigned, await this.coordination(run).engineerStartingPoints(assignment, result));
    }
    const discoveries = startingPointsSection(workspace ? groups.map(group => ({ ...group,
      points: group.points?.filter(point => resolveSnapshotPath(snapshot, point.path).ok) })) : groups,
      { projectRoot: this.projectRoot, ...(workspace ? {} : { snapshot }), allows: path => nonfunctionalSourceAllows(path, scope) });
    const sourceSection = { key: 'support:nonfunctional-source', text: JSON.stringify({ head: candidate.head, tree: candidate.tree,
      defaultComparison: comparisons[0]!.name,
      comparisons: comparisons.map(({ changes, ...comparison }) => ({ ...comparison, changedPaths: changes })),
      originalSource: run.record.manifest.source,
      comparisonLimit: 'Named comparisons cover net changes at their recorded Git boundaries, not every intermediate edit or affected caller. An empty diff establishes no historical preservation. Dirty original capture excludes uncommitted starting bytes from the starting commit comparison.',
      projectRoot: this.projectRoot, runDirectory: run.directory, snapshotScope: scope,
      evidenceAccess: 'Use ordinary read/search tools and shell for Git history, audit refs, generated views and run records. Scope identifies starting points, not an access restriction. Read referenced artifacts where they actually live.',
      authority: 'Prepared candidate source is authoritative. Starting points, prior completion claims and green audits do not establish satisfaction. Assess all supplied fixed/NFR obligations independently and inspect relevant source and execution evidence. Bind historical claims to their recorded revisions; live files or generated views may describe another revision.' }) };
    return { sections: [sourceSection, ...(discoveries === undefined ? [] : [discoveries])], snapshot, comparisons };
  }

  private nonfunctionalTools(run: Run, session: EquipContext, tools: readonly ToolDefinition[]): Equipment {
    return nonfunctionalEquipment({ projectRoot: this.projectRoot, snapshotTools: tools,
      commandExecution: this.options.commandExecution,
      registerProcessGroup: async (pid, identity) => {
        const committed = await this.write(run, { type: 'writer-process-registered', data: { invocation: session.invocation, pid, identity } });
        if (committed === 'ended') throw new Error(`Run ${run.record.jobId} ended before process group ${pid} was registered`);
        run.writer.register(session.invocation, pid);
        await this.afterWrite('writer-process-registered', run.record.jobId);
      },
      commandTimeoutMs: run.policy.limits.commandTimeoutMs,
      rejectedToolInputsPerTurn: run.policy.limits.rejectedToolInputsPerTurn,
      outputFile: call => run.path(runLayout.shellOutput(session.invocation, call)),
    }, session);
  }

  private async nonfunctionalAction(
    run: Run, agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>, catalog: ElementCatalog,
    candidate: Candidate, assessment: Assessment, decision: RoundDecision,
    investigatedNfrs: readonly string[],
  ): Promise<{ value: CoordinatorAction; invocation: string } | null> {
    if (decision.action !== 'investigate' && decision.action !== 'repair-or-close' && decision.action !== 'close') {
      throw new Error(`A coordinator action cannot answer ${decision.action}`);
    }
    const loaded = packages.get('nonfunctional-coordinator');
    if (loaded === undefined) throw new Error('Non-functional coordinator package is unavailable');
    const unresolved = assessment.results.filter(item => item.result !== 'satisfied').map(item => item.nfr);
    const index = await this.refreshIndex(run);
    const context = { decision, results: assessment.results, investigatedNfrs,
      moduleNames: [...(index?.modules.keys() ?? [])] };
    const investigationPaths = run.log.all('nonfunctional-investigated')
      .filter(event => event.data.assessment === assessment.id && event.data.round === assessment.round)
      .map(event => run.path(runLayout.submission(event.data.invocation)));

    const sourceInputs = await this.nonfunctionalSourceInputs(run, candidate, ['.'], false);
    const result = await this.runInvocation<CoordinatorAction>(run, agent, {
      role: 'nonfunctional-coordinator', task: { goal: `Assess the requirements of candidate ${candidate.tree}`, requirements: [this.coordination(run).planPackage(catalog)], candidate: candidate.tree, snapshot: candidate.tree, literalSections: sourceInputs.sections }, work: { task: `nfr-action:${assessment.id}:${decision.action}` },
      attempt: run.log.all('invocation-started').filter(event => event.data.role === 'nonfunctional-coordinator').length + 1,
      loaded, systemPrompt: renderNonfunctionalCoordinatorPrompt(loaded, this.projectRoot, coordinatorActionToolName),
      prompt: [coordinatorActionPrompt(candidate, unresolved, investigatedNfrs,
        { assessment, allowedAction: decision.action, investigationPaths }), this.coordination(run).planPackage(catalog)].join('\n\n'),
      start: { mode: 'fresh' }, toolName: coordinatorActionToolName,
      description: 'Choose a bounded non-functional investigation, repair, or closure.',
      inputSchema: coordinatorActionJsonSchema, submissionSchema: 'ramify-agent.nonfunctional-action/1',
      validate: input => validateCoordinatorAction(input, context),
      keep: () => finished('work-closed'), scope: { write: null, measurement: null, size: null },
      writer: true, equip: session => this.nonfunctionalTools(run, session, boundedNonfunctionalTools({ source: this.candidates, projectRoot: this.projectRoot, candidate: candidate.tree, base: sourceInputs.snapshot.base, snapshot: sourceInputs.snapshot, comparisons: sourceInputs.comparisons, scope: undefined })),
    });
    if (result.ended !== 'submitted' || result.value === undefined) {
      await this.fail(run, 'agent-failed', `Non-functional coordinator action ended ${result.ended}`);
      return null;
    }
    const late = await this.previewCandidateTree();
    if (late.tree !== candidate.tree) {
      await this.fail(run, 'inputs-changed', 'The source tree changed during the non-functional coordinator action');
      return null;
    }
    return { value: result.value, invocation: result.id };
  }

  private async nonfunctionalInvestigation(
    run: Run, agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>,
    assessment: Assessment, action: Extract<CoordinatorAction, { kind: 'investigate' }>,
  ): Promise<boolean> {
    const loaded = packages.get('nonfunctional-coordinator');
    if (loaded === undefined) throw new Error('Non-functional coordinator package is unavailable');

    const sourceInputs = await this.nonfunctionalSourceInputs(run, assessment.candidate, action.scope, false);
    const result = await this.runInvocation<CoordinatorInvestigation>(run, agent, {
      role: 'nonfunctional-coordinator', task: { goal: action.question, requirements: [this.coordination(run).planPackage(await this.coordination(run).frozenCatalog(), action.nfrs)], candidate: assessment.candidate.tree, snapshot: assessment.candidate.tree, literalSections: sourceInputs.sections }, work: { task: `nfr-investigation:${assessment.id}:${action.nfrs.join(',')}` },
      attempt: run.log.all('invocation-started').filter(event => event.data.role === 'nonfunctional-coordinator').length + 1,
      loaded, systemPrompt: renderNonfunctionalCoordinatorPrompt(loaded, this.projectRoot, coordinatorInvestigationToolName),
      prompt: [`Investigate element IDs ${action.nfrs.join(', ')} for assessment ${assessment.id} of tree ${assessment.candidate.tree}.`,
        `Question: ${action.question}`, `Starting scope: ${action.scope.join(', ')}`,
        'Inspect the named starting scope and follow relevant evidence using ordinary read/search tools and shell, including Git history and run records. The snapshot tools inspect the pinned candidate. Report observed evidence, its revision and remaining uncertainty. Do not edit source or harness records.', '',
        this.coordination(run).planPackage(await this.coordination(run).frozenCatalog(), action.nfrs)].join('\n'),
      start: { mode: 'fresh' }, toolName: coordinatorInvestigationToolName,
      description: 'Report read-only investigation evidence for every named NFR.',
      inputSchema: coordinatorInvestigationJsonSchema, submissionSchema: 'ramify-agent.nonfunctional-investigation/1',
      validate: input => validateCoordinatorInvestigation(input, action.nfrs),
      keep: () => finished('work-closed'), scope: { write: null, measurement: null, size: null },
      writer: true, equip: session => this.nonfunctionalTools(run, session, boundedNonfunctionalTools({ source: this.candidates, projectRoot: this.projectRoot, candidate: assessment.candidate.tree, base: sourceInputs.snapshot.base, snapshot: sourceInputs.snapshot, comparisons: sourceInputs.comparisons, scope: action.scope })),
    });
    if (result.ended !== 'submitted' || result.value === undefined) {
      await this.fail(run, 'agent-failed', `Non-functional investigation ended ${result.ended}`);
      return false;
    }
    const late = await this.previewCandidateTree();
    if (late.tree !== assessment.candidate.tree) {
      await this.fail(run, 'inputs-changed', 'The source tree changed during non-functional investigation');
      return false;
    }
    await this.write(run, { type: 'nonfunctional-investigated', data: {
      round: assessment.round, invocation: result.id, assessment: assessment.id, nfrs: [...action.nfrs],
    } });
    return true;
  }

  private async nonfunctionalRepair(
    run: Run, agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>, catalog: ElementCatalog,
    assessment: Assessment, candidateId: string, action: Extract<CoordinatorAction, { kind: 'repair' }>,
  ): Promise<boolean> {
    const id = `nfr-repair-${String(run.log.count('nonfunctional-repair-assigned') + 1).padStart(3, '0')}`;
    const answer = await this.options.ramify.queryOwnershipAnswer(this.projectRoot, ['.']);
    const scope = await resolveWriteScope({ projectRoot: this.projectRoot, ramify: this.options.ramify, index: await this.refreshIndex(run),
      view: run.record.manifest.architectView, revision: assessment.round,
      base: { modules: answer.scope.ownership.modules.map(module => module.id), rationale: 'The recorded coordinator authorized one project-wide non-functional repair batch' },
      extra: [], read: [], bootstrap: [], rationale: action.task });
    const assignment = nonfunctionalRepairAssignmentSchema.parse({
      schema: 'ramify-agent.nonfunctional-repair-assignment/1', id, round: assessment.round,
      assessment: assessment.id, candidate: candidateId, nfrs: action.nfrs,
      startingModule: action.startingModule, task: action.task,
      evidence: action.evidence, uncertainty: action.uncertainty, scope,
      guarded: await captureGuardedFiles(this.projectRoot, [], await this.coordination(run).guardedScenarioFiles(), [...await this.coordination(run).auditPreparationPaths(), ...scopeConfigurationPaths(scope)]),
    });
    await this.write(run, { type: 'nonfunctional-repair-assigned', data: {
      round: assignment.round, assignment: id, assessment: assessment.id, candidate: candidateId,
      nfrs: [...assignment.nfrs], startingModule: assignment.startingModule,
    } }, [{ path: runLayout.nonfunctionalRepairAssignment(id), id, revision: 1, body: assignment }]);
    await this.afterWrite('nonfunctional-repair-assigned', run.record.jobId);
    return await this.resumeNonfunctionalRepair(run, agent, packages, catalog, assignment);
  }

  private async performNonfunctionalRepair(
    run: Run, agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>, catalog: ElementCatalog,
    assignment: import('./nonfunctional-records.js').NonfunctionalRepairAssignment,
  ): Promise<boolean> {
    const loaded = packages.get('nonfunctional-repair-engineer');
    if (loaded === undefined) throw new Error('Non-functional repair package is unavailable');
    const index = await this.refreshIndex(run);
    const workingDirectory = await repairWorkingDirectory(this.projectRoot, assignment.startingModule, index);
    const guarded = guardedScopeOf(assignment.scope, await deniedFiles(this.projectRoot,
      [...await this.coordination(run).deniedFiles(), ...assignment.guarded.map(file => file.path)]), this.options.ramify, undefined, this.ownershipAuthority(run, assignment));
    const commandTimeoutMs = engineerBoundsOf(run.policy.limits).defaults.commandTimeoutMs;
    const tools = this.coordination(run).implementationTools({ workingDirectory, scopeRevision: 1, guarded, commandTimeoutMs, submissions: { legalOutcomes: ['completed', 'partial'], completionOutcome: null } });
    // A writer like any other: its scope size from the frozen baseline, and
    // its line events from the snapshots around it.
    const baseline = await this.coordination(run).baselineSnapshot();
    const before = await takeLineSnapshot(this.projectRoot, this.coordination(run).accepted(), this.git);
    const { candidate } = await this.readPreparedCandidate(run, assignment.candidate);
    // Repair reads follow the existing project source authority; writes remain guarded by assignment.scope.
    const sourceInputs = await this.nonfunctionalSourceInputs(run, candidate, ['.'], true);
    const result = await this.runInvocation<NonfunctionalRepairSubmission>(run, agent, {
      // The repair engineer receives the same changed-path section as the coordinator that assigned it.
      role: 'nonfunctional-repair-engineer', task: { candidate: candidate.tree, modules: 'module' in assignment.scope.base ? [assignment.scope.base.module] : assignment.scope.base.modules, goal: assignment.task, requirements: [this.coordination(run).planPackage(catalog, assignment.nfrs)],
        literalSections: sourceInputs.sections }, work: { nonfunctionalRepair: assignment.id },
      attempt: run.log.all('invocation-started').filter(event => event.data.role === 'nonfunctional-repair-engineer').length + 1,
      loaded, systemPrompt: renderNonfunctionalRepairPrompt(loaded, this.projectRoot),
      prompt: repairPrompt(assignment.task, candidate,
        this.coordination(run).planPackage(catalog, assignment.nfrs), assignment.startingModule,
        { evidence: assignment.evidence, uncertainty: assignment.uncertainty }),
      start: { mode: 'fresh' }, toolName: nonfunctionalRepairToolName,
      description: 'Report the authorized non-functional repair batch and remaining work.',
      inputSchema: nonfunctionalRepairJsonSchema, submissionSchema: 'ramify-agent.nonfunctional-repair/1',
      validate: input => validateAgainst(nonfunctionalRepairSubmissionSchema, input),
      keep: () => finished('work-closed'),
      scope: { write: 1, measurement: baseline === null ? null : this.coordination(run).baselineReference(), size: null },
      ...(baseline === null ? {} : { measured: { snapshot: baseline, scope: writeScopeMeasurement(assignment.scope), readScope: readScopeMeasurement(assignment.scope) } }),
      writer: true, guarded, readModules: assignment.scope.read, workingDirectory, equip: tools.equip, previewEquipment: tools.preview,
    });
    await this.coordination(run).recordLineEvents(result.id, before, await takeLineSnapshot(this.projectRoot, this.coordination(run).accepted(), this.git));
    // A settled child can return without a result. Preserve its edits and
    // let the coordinator assess the candidate before choosing another step.
    if (this.ignoring(run)) return false;
    run.writer.requireSettled('Non-functional repair cannot be committed');
    const changed = await documentChanges(this.projectRoot, run.record.planId, run.directory, run.record.manifest);
    if (changed.length > 0) {
      await this.fail(run, 'inputs-changed', `Captured plan evidence changed during repair: ${changed.join('; ')}`);
      return false;
    }
    if (!await this.repairScopeAllowed(run, assignment)) return false;
    await this.write(run, { type: 'nonfunctional-repair-committed', data: {
      round: assignment.round, invocation: result.id, assignment: assignment.id,
    } });
    await this.afterWrite('nonfunctional-repair-committed', run.record.jobId);
    return true;
  }

  /** Check the exact captured repair boundary after shell writes and again on restart. */
  private async repairScopeAllowed(run: Run, assignment: import('./nonfunctional-records.js').NonfunctionalRepairAssignment): Promise<boolean> {
    try {
      const guard = guardedScopeOf(assignment.scope, await deniedFiles(this.projectRoot,
        [...await this.coordination(run).deniedFiles(), ...assignment.guarded.map(file => file.path)]), this.options.ramify);
      const changed = await this.git.changedPaths(this.projectRoot, this.coordination(run).accepted());
      const candidate = [];
      for (const path of changed) {
        const captured = assignment.guarded.find(file => file.path === path);
        const hash = captured === undefined ? undefined : await readFile(join(this.projectRoot, path)).then(bytes => sha256(bytes)).catch(error => {
          if (['ENOENT', 'ENOTDIR'].includes((error as NodeJS.ErrnoException).code ?? '')) return null;
          throw error;
        });
        if (captured === undefined || hash !== captured.hash) candidate.push(path);
      }
      const outside = await outsideScope(this.projectRoot, guard, candidate);
      if (outside.length === 0) return true;
      await this.fail(run, 'inputs-changed', `Repair changed files outside captured and current authority: ${outside.join('; ')}`);
    } catch (error) { await this.fail(run, 'inputs-changed', `Repair ownership cannot be verified: ${message(error)}`); }
    return false;
  }

  /** A durable assignment may precede the child; a settled submitted child may precede its repair event. */
  private async resumeNonfunctionalRepair(
    run: Run, agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>, catalog: ElementCatalog,
    assignment: import('./nonfunctional-records.js').NonfunctionalRepairAssignment,
  ): Promise<boolean> {
    const started = run.log.all('invocation-started').filter(event =>
      event.data.role === 'nonfunctional-repair-engineer' && event.data.work.nonfunctionalRepair === assignment.id);
    if (started.length === 0) return await this.performNonfunctionalRepair(run, agent, packages, catalog, assignment);
    const invocation = started.at(-1)!.data.invocation;
    const ended = run.log.all('invocation-ended').find(event => event.data.invocation === invocation);
    const release = run.log.all('writer-released').find(event => event.data.invocation === invocation);
    if (ended === undefined || release?.data.confirmed !== true) {
      await this.fail(run, 'recovery-exhausted', `Repair ${assignment.id} has no confirmed child outcome`);
      return false;
    }
    try {
      const outcome = invocationOutcomeSchema.safeParse(this.committedBody(run, runLayout.outcome(invocation)));
      if (!outcome.success || outcome.data.invocation !== invocation
        || outcome.data.ended !== ended.data.ended
        || (ended.data.ended === 'submitted' ? outcome.data.disposition !== 'applied' : outcome.data.disposition !== 'incomplete')
        || (outcome.data.submission?.hash ?? null) !== ended.data.submission
        || outcome.data.settled.confirmed !== true) {
        throw new Error('committed child outcome does not match its settled invocation');
      }
      if (outcome.data.ended === 'failed' && outcome.data.interruption !== undefined
        || ['resource-pending', 'context-budget-reached'].includes(outcome.data.ended)) {
        // An interrupted attempt leaves this same ordinary repair assignment
        // pending. Its captured authority and retained edits remain effective.
        return await this.performNonfunctionalRepair(run, agent, packages, catalog, assignment);
      }
      if (ended.data.submission !== null) {
        const raw = await readFile(run.path(runLayout.submission(invocation)));
        if (sha256(raw) !== ended.data.submission) throw new Error('submission hash differs from committed invocation outcome');
        const value = JSON.parse(raw.toString('utf8')) as Record<string, unknown>;
        if (value.schema !== 'ramify-agent.nonfunctional-repair/1') throw new Error('repair submission schema differs');
        const { schema: _schema, ...submission } = value;
        nonfunctionalRepairSubmissionSchema.parse(submission);
      }
    } catch (error) {
      await this.fail(run, 'recovery-exhausted', `Repair ${assignment.id} result cannot be authenticated: ${message(error)}`);
      return false;
    }
    const changed = await documentChanges(this.projectRoot, run.record.planId, run.directory, run.record.manifest);
    if (changed.length > 0) {
      await this.fail(run, 'inputs-changed', `Captured plan evidence changed during repair recovery: ${changed.join('; ')}`);
      return false;
    }
    if (!await this.repairScopeAllowed(run, assignment)) return false;
    await this.write(run, { type: 'nonfunctional-repair-committed', data: {
      round: assignment.round, invocation, assignment: assignment.id,
    } });
    await this.afterWrite('nonfunctional-repair-committed', run.record.jobId);
    return true;
  }

  private async readPreparedCandidate(run: Run, id: string): Promise<{ candidate: Candidate }> {
    const record = await readCommitted(run.log.ledger, runLayout.candidate(id), runSchemas.preparedCandidate);
    if (record.kind !== 'valid') throw new Error(`Prepared candidate ${id} is unavailable`);
    return record.value;
  }

  /** One complete fixed-catalog assessment of an already prepared candidate. */
  private async assessNonfunctionalCandidate(
    run: Run, agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>,
    catalog: Awaited<ReturnType<typeof readAcceptedEvidence>> & { status: 'available' },
    prepared: { id: string; candidate: Candidate }, round: number, phase: Assessment['phase'],
  ): Promise<Assessment | null> {
    const nfrIds = assessedElements(catalog.catalog);
    const id = `nfa-${String(run.log.count('nonfunctional-assessed') + 1).padStart(3, '0')}`;
    let assessment: Assessment;
    if (nfrIds.length === 0) {
      // An empty fixed catalog still needs explicit candidate-bound coverage.
      assessment = assessmentSchema.parse({ schema: 'ramify-agent.nonfunctional-assessment/1', id,
        candidate: prepared.candidate, round, phase, coordinatorInvocation: 'harness:empty-catalog', results: [] });
    } else {
      const loaded = packages.get('nonfunctional-coordinator');
      if (loaded === undefined) {
        await this.fail(run, 'internal', 'No prompt package is loaded for the non-functional coordinator');
        return null;
      }

      const sourceInputs = await this.nonfunctionalSourceInputs(run, prepared.candidate, ['.'], false);
      const result = await this.runInvocation<CoordinatorAssessmentSubmission>(run, agent, {
        role: 'nonfunctional-coordinator', task: { goal: `Assess the complete NFR catalog for ${prepared.candidate.tree}`, requirements: [this.coordination(run).planPackage(catalog.catalog)], candidate: prepared.candidate.tree, snapshot: prepared.candidate.tree, literalSections: sourceInputs.sections }, work: { task: `nfr-assessment:${prepared.id}:${round}:${phase}` },
        attempt: run.log.all('invocation-started').filter(event => event.data.role === 'nonfunctional-coordinator').length + 1,
        loaded, systemPrompt: renderNonfunctionalCoordinatorPrompt(loaded, this.projectRoot),
        prompt: coordinatorAssessmentPrompt(this.coordination(run).planPackage(catalog.catalog), prepared.candidate, round, phase),
        start: { mode: 'fresh' }, toolName: coordinatorAssessmentToolName,
        description: 'Submit one evidence-grounded result for every non-functional and fixed requirement.',
        inputSchema: coordinatorAssessmentJsonSchema, submissionSchema: 'ramify-agent.nonfunctional-assessment-submission/1',
        validate: input => {
          const checked = bindCoordinatorAssessment(input, { catalog: catalog.catalog, candidate: prepared.candidate,
            observedTree: prepared.candidate.tree, id, round, phase, coordinatorInvocation: 'pending' });
          return checked.ok
            ? { ok: true, value: { kind: 'assessment' as const, results: checked.value.results } }
            : checked;
        },
        keep: () => finished('work-closed'), scope: { write: null, measurement: null, size: null },
        writer: true, equip: session => this.nonfunctionalTools(run, session, boundedNonfunctionalTools({ source: this.candidates, projectRoot: this.projectRoot, candidate: prepared.candidate.tree, base: sourceInputs.snapshot.base, snapshot: sourceInputs.snapshot, comparisons: sourceInputs.comparisons, scope: undefined })),
      });
      if (result.ended !== 'submitted' || result.value === undefined) {
        await this.fail(run, 'agent-failed', `The non-functional coordinator ended ${result.ended} without a complete assessment`);
        return null;
      }
      const late = await this.previewCandidateTree();
      const bound = bindCoordinatorAssessment(result.value, { catalog: catalog.catalog, candidate: prepared.candidate,
        observedTree: late.tree, id, round, phase, coordinatorInvocation: result.id });
      if (!bound.ok) {
        await this.fail(run, 'inputs-changed', `The non-functional assessment could not bind to the prepared tree: ${bound.errors.map(error => error.message).join('; ')}`);
        return null;
      }
      assessment = bound.value;
    }
    const changed = await documentChanges(this.projectRoot, run.record.planId, run.directory, run.record.manifest);
    if (changed.length > 0) {
      await this.fail(run, 'inputs-changed', `The captured plan evidence changed during assessment: ${changed.join('; ')}`, [runLayout.documentManifest]);
      return null;
    }
    await this.write(run, { type: 'nonfunctional-assessed', data: { assessment: id, candidate: prepared.id, round, phase } }, [
      { path: runLayout.assessment(id), id, revision: 1, body: assessment },
    ]);
    await this.afterWrite('nonfunctional-assessed', run.record.jobId);
    return assessment;
  }

  // Invocations

  /** Recovery records are read from committed revisions, independently of the live driver. */
  private latestOperationRecovery(run: Run): OperationRecovery | undefined {
    const continued = run.log.ownEvents.map(event => event.type).lastIndexOf('job-continued');
    const event = run.log.ownEvents.slice(continued + 1).filter(event => ['operation-recovery-pausing', 'operation-recovery-paused', 'operation-recovery-resumed', 'restart-prepared'].includes(event.type)).at(-1);
    if (!event || !('occurrenceId' in event.data)) return undefined;
    return operationRecoverySchema.parse(this.committedBody(run, runLayout.operationRecovery(event.data.occurrenceId as string, (event.data as { revision: number }).revision)));
  }

  /** A later authenticated settlement is new evidence; the original outcome remains immutable. */
  private effectiveInvocationOutcome(run: Run, id: string): InvocationOutcome | undefined {
    const outcome = committedRecords(run.log.ledger.replay()).outcomes.get(id);
    if (!outcome || outcome.settled.confirmed) return outcome;
    if (run.restartImport) for (const record of [...run.restartImport.records].reverse()) {
      const proof = operationRecoverySchema.safeParse(record.body);
      if (!proof.success || !proof.data.settled || !proof.data.reconciledInvocations?.includes(id)) continue;
      const observation = proof.data.settlementObservations?.find(entry => entry.invocation === id);
      if (observation) return { ...outcome, settled: { confirmed: true, at: observation.at, groupsKilled: observation.groupsKilled, lateWrites: observation.lateWrites },
        ...(observation.ref && outcome.session ? { session: { ...outcome.session, ref: observation.ref } } : {}) };
    }
    for (const event of [...run.log.all('operation-recovery-resumed')].reverse()) {
      const recovered = operationRecoverySchema.parse(this.committedBody(run, runLayout.operationRecovery(event.data.occurrenceId, event.data.revision)));
      const observation = recovered.settlementObservations?.find(item => item.invocation === id);
      if (observation && recovered.settled && recovered.reconciledInvocations?.includes(id)) return { ...outcome,
        settled: { confirmed: true, at: observation.at, groupsKilled: observation.groupsKilled, lateWrites: observation.lateWrites },
        ...(observation.ref && outcome.session ? { session: { ...outcome.session, ref: observation.ref } } : {}) };
    }
    return outcome;
  }

  private async settlementBlockers(run: Run, recovery: OperationRecovery): Promise<string[]> {
    const blockers: string[] = [];
    if (run.writer.blocked) blockers.push(`Settlement: ${run.writer.blocked}`);
    if (run.live.size > 0) blockers.push('Settlement: admitted operations are still live');
    const operations = this.sessionOperations === undefined ? undefined : await this.sessionOperations;
    for (const started of run.log.all('invocation-started')) {
      if (run.restartImport && started.sequence < 0) continue;
      const outcome = invocationOutcomeSchema.safeParse(this.effectiveInvocationOutcome(run, started.data.invocation) ?? this.committedBody(run, runLayout.outcome(started.data.invocation)));
      if ((!outcome.success || !outcome.data.settled.confirmed) && !recovery.reconciledInvocations?.includes(started.data.invocation)) blockers.push(`Settlement: invocation ${started.data.invocation} is unconfirmed`);
      for (const group of !outcome.success || !outcome.data.settled.confirmed && !recovery.reconciledInvocations?.includes(started.data.invocation)
        ? run.log.all('writer-process-registered').filter(event => event.data.invocation === started.data.invocation) : []) {
        if (await processGroupIdentity(group.data.pid) === group.data.identity && (this.options.groups ?? nodeProcessGroups).alive(group.data.pid)) blockers.push(`Settlement: invocation ${started.data.invocation} retains a registered process group ${group.data.pid}`);
      }
      try {
        if (operations && (await operations.unresolvedEffects(run.jobId, started.data.invocation)).length > 0) blockers.push(`Settlement: invocation ${started.data.invocation} retains an unknown external effect`);
      } catch (error) { blockers.push(`Settlement: invocation ${started.data.invocation} effect evidence is unavailable: ${message(error)}`); }
    }
    if (operations?.settlementConfirmed(run.jobId) === false) blockers.push('Settlement: session effects have not confirmed settlement');
    return blockers;
  }

  /** Lifecycle-owned settlement is independent of the optional session context. */
  private async reconcileRecoverySettlement(run: Run, recovery: OperationRecovery): Promise<void> {
    const operations = this.options.agent ? await this.operations(this.options.agent) : undefined;
    if (!operations) return;
    const reconciled = new Set(recovery.reconciledInvocations ?? []);
    const observations = [...recovery.settlementObservations ?? []];
    for (const started of run.log.all('invocation-started')) {
      if (run.restartImport && started.sequence < 0) continue;
      const outcome = invocationOutcomeSchema.safeParse(this.effectiveInvocationOutcome(run, started.data.invocation) ?? this.committedBody(run, runLayout.outcome(started.data.invocation)));
      const unknown = await operations.unresolvedEffects(run.jobId, started.data.invocation);
      if (unknown.length === 0 && (outcome.success && outcome.data.settled.confirmed || reconciled.has(started.data.invocation))) continue;
      if (!await operations.stopOriginal(run.jobId, started.data.invocation, run.policy.limits.stopSettleMs)) continue;
      if ((await operations.reconcileOwnedEffects(run.jobId, started.data.invocation)).length > 0) continue;
      const registrations = outcome.success && outcome.data.settled.confirmed ? [] : run.log.all('writer-process-registered').filter(event => event.data.invocation === started.data.invocation);
      const groups = this.options.groups ?? nodeProcessGroups;
      const alive = registrations.filter(event => groups.alive(event.data.pid));
      let authenticated = true;
      for (const group of alive) {
        const current = await processGroupIdentity(group.data.pid);
        if (group.data.identity === null || current === null || current !== group.data.identity) authenticated = false;
      }
      // A surviving group without its recorded identity is an obstruction, not permission to kill a reused PID.
      if (!authenticated) continue;
      let settlement = { confirmed: true, at: this.now().toISOString(), groupsKilled: 0, lateWrites: [] as string[] };
      if (run.writer.unsettledInvocation === undefined && alive.length > 0) {
        if (run.writer.held !== undefined) continue;
        run.writer.acquire(started.data.invocation);
        for (const group of alive) run.writer.register(started.data.invocation, group.data.pid);
        const observed = await run.writer.release(started.data.invocation, { settled: async () => 'settled' });
        if (!observed.confirmed) continue;
        settlement = observed;
      }
      if (run.writer.unsettledInvocation === started.data.invocation) {
        const observation = await run.writer.reinspect(started.data.invocation, { settled: async () => 'settled' });
        if (!observation?.confirmed) continue;
        settlement = observation;
      }
      observations.push({ invocation: started.data.invocation, at: settlement.at, groupsKilled: settlement.groupsKilled, lateWrites: settlement.lateWrites,
        ref: await operations.completedPoint(run.jobId, started.data.invocation) });
      reconciled.add(started.data.invocation);
    }
    recovery.reconciledInvocations = [...reconciled]; recovery.settlementObservations = observations;
    recovery.settled = (await this.settlementBlockers(run, recovery)).length === 0;
  }

  private async recoveryBlockers(run: Run, recovery: OperationRecovery): Promise<string[]> {
    const blockers = await this.settlementBlockers(run, recovery);
    if (run.log.terminal || run.stopRequested || this.closed) blockers.push('Stop or service shutdown takes precedence');
    if (run.writer.isUnsettled || run.live.size > 0) blockers.push('Writer or tool settlement is unavailable');
    return blockers;
  }

  /** Read-only inspection never launches or prepares an agent operation. */
  async recoveryInspection(planId: string, runId: string): Promise<RecoveryInspection | null> {
    const run = this.runs.get(key(planId, runId)); if (!run) return null;
    const recovery = run.recoveryPause ?? this.latestOperationRecovery(run);
    if (!recovery || recovery.state === 'resumed' || run.log.terminal) return null;
    const blockers = await this.recoveryBlockers(run, recovery);
    const observations: Partial<RecoveryInspection> = { repairRequired: false };
    const now = this.now().getTime();
    const { kind, role, work, invocation, source, candidate, checkpoint } = recovery.boundary;
    return recoveryInspectionSchema.parse({ planId, runId, cursor: run.log.version, ...(run.record.restart ? { restart: { sourceRun: run.record.restart.sourceRun, sourceCursor: run.record.restart.sourceCursor, sourceDigest: run.record.restart.sourceDigest, importDigest: run.record.restart.importDigest, generation: run.record.restart.generation } } : {}), occurrenceId: recovery.id, revision: recovery.revision,
      state: recovery.state, boundary: { kind, ...(role === undefined ? {} : { role }), ...(work === undefined ? {} : { work }),
        ...(invocation === undefined ? {} : { invocation }), ...(source ? { source } : {}), ...(candidate === undefined ? {} : { candidate }),
        ...(checkpoint === undefined ? {} : { checkpoint }) },
      evidence: { classification: recovery.evidence.classification, diagnostic: recovery.evidence.diagnostic,
        ...(recovery.evidence.code === undefined ? {} : { code: recovery.evidence.code }),
        ...(recovery.evidence.status === undefined ? {} : { status: recovery.evidence.status }),
        ...(recovery.evidence.retryAfterMs === undefined ? {} : { retryAfterMs: recovery.evidence.retryAfterMs }) },
      group: recovery.group, automaticAttempts: recovery.automaticAttempts, attempts: recovery.attempts, pausedAt: recovery.pausedAt,
      canResume: blockers.length === 0, blockers: [...new Set(blockers)], remaining: {
        invocations: run.policy.continuity ? null : Math.max(0, run.policy.limits.maxInvocationsPerRun - run.log.count('invocation-started')),
        activeMs: run.policy.continuity ? null : Math.max(0, run.policy.limits.runAbsoluteMs - (now - Date.parse(run.createdAt) - callerPauseMs(run.log.events, now))) },
      ...(run.policy.continuity ? { continuity: { policy: 'run-policy/8', resource: recovery.boundary.invocation ? this.effectiveInvocationOutcome(run, recovery.boundary.invocation)?.resource ?? (this.effectiveInvocationOutcome(run, recovery.boundary.invocation)?.settled.confirmed === false ? 'stall' : null) : null,
        predecessor: recovery.boundary.invocation ?? null, successor: null, settlement: recovery.settled && !blockers.some(value => value.startsWith('Settlement:')) ? 'confirmed' : 'unknown',
        effects: recovery.settled && !blockers.some(value => /[Ee]ffect|[Ss]ettlement/.test(value)) ? 'reconciled' : 'unknown',
        ...(recovery.settlementObservations ? { observations: recovery.settlementObservations } : {}) } } : {}),
      retained: { candidate: recovery.candidate, partialPaths: recovery.partialPaths, ...(recovery.boundary.retainedTask ? { task: recovery.boundary.retainedTask } : {}) },
      totalInvocations: run.log.count('invocation-started'),
      timing: { activeMs: Math.max(0, now - Date.parse(run.createdAt) - callerPauseMs(run.log.events, now)),
        pausedMs: callerPauseMs(run.log.events, now), currentPauseMs: recovery.pausedAt === null ? 0 : Math.max(0, now - Date.parse(recovery.pausedAt)) },
      ...observations });
  }

  /** Publish a usable pause only after admitted operations and their effects settle. */
  private async waitOperationRecovery(run: Run, boundary: RecoveryBoundary, evidence: InterruptionEvidence,
    attempts: readonly string[], automaticAttempts: number, group = 0, wait = true): Promise<boolean> {
    if (!run.policy.recovery || this.ignoring(run)) return false;
    // Another admitted reader may fail while the first operation is settling.
    // It retains its own outcome and waits for the current occurrence to finish.
    if (boundary.reviewRequest && !run.recoveryReviewPipelines.has(boundary.reviewRequest)) { run.recoveryReviewPipelines.add(boundary.reviewRequest); run.notify(); }
    while (run.recoveryPause) { const changed = run.changed(); if (this.ignoring(run)) return false; await changed; }
    const id = `opr-${String(run.log.count('operation-recovery-pausing') + 1).padStart(4, '0')}`;
    const recovery: OperationRecovery = { schema: 'ramify-agent.operation-recovery/1', id, revision: 1, state: 'pausing', boundary, evidence,
      group, automaticAttempts, attempts: [...attempts], pausedAt: null, settled: false, candidate: { head: '', tree: '' }, partialPaths: [], prerequisites: [],
      reconciledInvocations: [], settlementObservations: [] };
    run.recoveryPause = recovery;
    run.recoveryReviewRelease = run.reviews?.suspend(false);
    await this.write(run, { type: 'operation-recovery-pausing', data: { occurrenceId: id, revision: 1 } },
      [{ path: runLayout.operationRecovery(id), id, revision: 1, body: recovery }]);
    if (boundary.kind !== 'gate') await run.gating;
    if (boundary.kind !== 'readiness') await run.readiness?.settled;
    while (run.live.size > 0) await Promise.all([...run.live.values()].map(live => live.done));
    await run.reviews?.settledExcept(id => run.recoveryReviewPipelines.has(id), () => run.changed());
    if (this.ignoring(run)) return false;
    const operations = this.sessionOperations === undefined ? undefined : await this.sessionOperations;
    recovery.prerequisites = await this.settlementBlockers(run, recovery);
    recovery.settled = recovery.prerequisites.length === 0;
    try {
      const candidate = await this.previewCandidateTree();
      recovery.candidate = { head: candidate.head, tree: candidate.tree };
      recovery.partialPaths = await this.git.changedPaths(this.projectRoot, this.coordination(run).accepted());
    } catch (error) { recovery.prerequisites.push(`Current candidate is unavailable: ${message(error)}`); }
    await run.mutex.run(async () => {
      if (this.ignoring(run)) return;
      recovery.state = 'paused'; recovery.revision++; recovery.pausedAt = this.now().toISOString();
      // Historical waiting budgets remain readable, but review authority never expires.
      recovery.waitingReviews = [];
      await commitRecord(run.log.ledger, { event: run.log.next({ type: 'operation-recovery-paused', data: { occurrenceId: id, revision: recovery.revision } }, this.now()),
        records: [{ path: runLayout.operationRecovery(id, recovery.revision), id, revision: recovery.revision, body: recovery }] });
    });
    run.notify();
    if (!wait) { run.recoveryRestart = true; return false; }
    while (run.recoveryPause === recovery && !this.ignoring(run)) { const changed = run.changed(); if (run.recoveryPause !== recovery) break; await changed; }
    if (this.ignoring(run)) return false;
    if (boundary.reviewRequest) run.recoveryReviewPipelines.delete(boundary.reviewRequest);
    return true;
  }

  private async adoptContinuityPolicy(run: Run, occurrenceId: string): Promise<void> {
    if (run.policy.continuity) return;
    const original = run.policy;
    const defaults = defaultRunPolicy({ projectRoot: this.projectRoot });
    const effective: RunPolicy = { ...original, version: 'run-policy/8', continuity: defaults.continuity, context: { ...original.context, ...Object.fromEntries(Object.keys(original.context).map(role => [role, defaultContextPolicies[role as Role]])) }, recovery: defaults.recovery };
    await run.log.append({ type: 'continuity-policy-adopted', data: { from: original.version, to: 'run-policy/8', occurrenceId, policy: effective } }, this.now());
    run.effectivePolicy = effective;
  }

  private async resumeRecovery(command: Extract<RunCommand, { type: 'resume-recovery' }>, contentHash: string): Promise<Receipt> {
    const { planId, jobId } = command.payload;
    this.refuseEarlierPolicy(planId, jobId);
    const run = this.runs.get(key(planId, jobId));
    if (!run) throw new CommandRejection('not-found', `No run ${jobId} for plan ${planId}`);
    const receipt = await run.mutex.run(async () => {
      const recovery = run.recoveryPause;
      if (run.log.terminal) throw new CommandRejection('conflict', 'Use restart-run to continue a historical failed run');
      if (run.stopRequested || run.debugPause && !recovery) throw new CommandRejection('conflict', 'The explicit stop or debugger pause remains effective');
      if (recovery) await this.reconcileRecoverySettlement(run, recovery);
      const blockers = recovery ? await this.settlementBlockers(run, recovery) : [];
      if (!recovery && run.recoveryRestart) {
        const operations = this.options.agent ? await this.operations(this.options.agent) : undefined;
        const pending = run.log.all('invocation-started').filter(started => !run.log.all('invocation-ended').some(ended => ended.data.invocation === started.data.invocation));
        for (const started of pending) if (!operations || !await operations.stopOriginal(run.jobId, started.data.invocation, run.policy.limits.stopSettleMs)) blockers.push(`Former attempt ${started.data.invocation} has not settled`);
        if (!blockers.length) {
          // The old owner may have completed its last durable transition while
          // draining. Reopen only after it settled, before becoming the writer.
          run.log = await RunLog.open(run.log.path, run.jobId, undefined, run.record.restart !== undefined);
          if (run.restartImport) run.log.installWorkflowImport(restartWorkflowEntries(run.restartImport));
          run.stopRequested = run.log.find('stop-requested') !== undefined;
          if (run.stopRequested) blockers.push('The explicit stop remains effective');
          else await this.closeInterruptedInvocations(run);
        }
      }
      if (run.writer.isUnsettled) blockers.push('The former writer has not settled');
      if (blockers.length) throw new CommandRejection('conflict', blockers.join('; '));
      const at = this.now();
      await this.adoptContinuityPolicy(run, recovery?.id ?? 'continuation');
      const accepted = this.commands.accept(command, contentHash, jobId, run.log.nextSequence, at);
      if (recovery) {
        const resumed = operationRecoverySchema.parse({ ...recovery, state: 'resumed', revision: recovery.revision + 1, group: Math.max(1, recovery.group) });
        await commitRecord(run.log.ledger, { event: run.log.next({ type: 'operation-recovery-resumed', data: { occurrenceId: recovery.id, revision: resumed.revision, group: resumed.group, command: accepted } }, at),
          records: [{ path: runLayout.operationRecovery(recovery.id, resumed.revision), id: recovery.id, revision: resumed.revision, body: resumed }] });
      } else await run.log.append({ type: 'job-continued', data: { command: accepted } }, at);
      this.commands.remember(accepted); run.recoveryPause = undefined; run.startupRecovery = false;
      return accepted.receipt;
    });
    await this.observeQuiescentCandidate(run, this.latestOperationRecovery(run)?.candidate.tree);
    run.recoveryReviewRelease?.(); run.recoveryReviewRelease = undefined;
    run.notify();
    if (run.recoveryRestart) {
      run.recoveryRestart = false;
      await this.startRecoveredDriver(run);
    }
    return receipt;
  }

  private async observeQuiescentCandidate(run: Run, beforeTree: string | undefined): Promise<void> {
    if (!beforeTree) return;
    const after = await this.previewCandidateTree();
    await observeExternalCandidate({ projectRoot: this.projectRoot, beforeTree, afterTree: after.tree,
      acceptedHead: this.coordination(run).accepted(), candidates: this.candidates, write: (event, records) => this.write(run, event, records) });
  }

  private async startRecoveredDriver(run: Run): Promise<void> {
    if (this.ignoring(run) || !this.options.agent) return;
    const { packages } = await loadPromptPackages({ ...(this.options.skillDirectory === undefined ? {} : { skillDirectory: this.options.skillDirectory }), capabilityWorkflow: this.workflow !== null });
    run.index = await this.options.inputs.index(this.projectRoot, run.record.manifest).catch(() => null);
    let baseline: MeasurementSnapshot;
    const baselinePath = runLayout.measurement(snapshotId(1));
    try { baseline = measurementSnapshotSchema.parse(JSON.parse(await readFile(run.path(baselinePath), 'utf8'))); }
    catch (error) {
      const diagnostic = `Task ${run.jobId} requires readable baseline record ${baselinePath}: ${message(error)}`;
      this.warn(diagnostic);
      await this.waitOperationRecovery(run, { kind: 'preparation', checkpoint: 'baseline' }, { classification: 'preparation', diagnostic }, [], 0, 0, false);
      return;
    }
    run.restorationSequence = run.log.version;
    run.restoring = true;
    const agent = this.options.agent;
    run.done = (async () => {
      // A durable repair assignment is ordinary pending work. Execute it before
      // constructing the parent task whose preparation it was assigned to restore.
      const pending = this.latestRepairIncident(run);
      if (pending && ['admitted', 'running', 'interrupted'].includes(pending.stage) && pending.incident.verification?.verified !== true) {
        const preparation = repairPreparationSchema.parse(this.committedBody(run, pending.incident.preparation.path));
        const restored = await this.automaticProjectRepair(run, agent, packages, baseline, preparation,
          new Error(pending.incident.harnessError.message), null);
        if (restored === null || 'refusal' in restored || this.ignoring(run)) return;
        await this.persistRepairIncident(run, { ...restored.incident,
          continuation: { delivered: false, reason: 'Verified source repair awaits ordinary parent task delivery', evidence: [] } }, 'running',
          [{ path: runLayout.repairDelta(restored.incident.incidentId), id: restored.incident.incidentId, revision: 1, body: restored.delta }]);
      }
      if (!this.ignoring(run)) await this.drive(run, agent, packages, baseline, true);
    })()
      .catch(error => this.fail(run, error instanceof WriterBlockedError ? 'writer-unsettled' : 'recovery-exhausted', `Recovery continuation failed: ${message(error)}`))
      .catch(error => this.warn(`Run ${run.jobId}: ${message(error)}`));
  }

  /** Ordinary construction owns task context; recovery only replaces a settled attempt. */
  private async recoverableInvocation<T>(run: Run, agent: AgentPort, request: InvocationRequest<T>): Promise<InvocationResult<T>> {
    let current: InvocationRequest<T> = { ...request, allowFreshFallback: true };
    let replacements = 0;
    for (;;) {
      while (run.recoveryPause && !this.ignoring(run)) {
        if (request.recoveryReviewRequest) { run.recoveryReviewPipelines.add(request.recoveryReviewRequest); run.notify(); }
        const changed = run.changed();
        if (!run.recoveryPause) break;
        await changed;
      }
      if (request.recoveryReviewRequest) run.recoveryReviewPipelines.delete(request.recoveryReviewRequest);
      if (this.ignoring(run)) return { id: '', ended: 'stopped', value: undefined, ref: '', session: '', kept: false, outcomeKind: 'stopped' };
      const result = await this.runner.runInvocation(run, agent, current);
      const interruption = taskInterruption({ ended: result.ended, interruption: result.interruption, classification: result.interruptionEvidence?.classification });
      if (this.ignoring(run) || interruption === null) return result;
      const unresolved = await (await this.operations(agent)).unresolvedEffects(run.jobId, result.id);
      const reentry = decideTaskReentry({ authorized: !this.ignoring(run), settled: result.settlementConfirmed === true, unresolved });
      const retry = mayRetryTask({ attempt: replacements, limit: run.policy.recovery?.automaticRetries ?? 2,
        classification: interruption });
      if (reentry.action === 'wait' || !retry) {
        const ready = await this.waitOperationRecovery(run, { kind: 'invocation', role: request.role, work: request.work, invocation: result.id, start: { mode: 'fresh' }, source: null },
          result.interruptionEvidence ?? { classification: 'unknown', diagnostic: reentry.action === 'wait' ? reentry.reason : result.error ?? result.resourceReason ?? 'The provider is unavailable' }, [result.id], replacements);
        if (!ready) return result;
        replacements = 0;
      } else {
        const delay = taskRetryDelay({ attempt: replacements, classification: interruption, retryAfterMs: result.interruptionEvidence?.retryAfterMs });
        replacements++;
        if (delay > 0 && !await this.gateHost().retryGateDelay!(run, delay)) return { ...result, ended: 'stopped', value: undefined, outcomeKind: 'stopped' };
      }
      current = this.runner.restartTaskRequest(request, result.id, result.resourceReason ?? result.error ?? `Attempt ended ${result.ended}`);
    }
  }

  /** One invocation, through the invocation runner every role shares. */
  private async runInvocation<T>(run: Run, agent: AgentPort, request: InvocationRequest<T>): Promise<InvocationResult<T>> {
    if (['engineer', 'contract-engineer', 'nonfunctional-repair-engineer'].includes(request.role) && request.onCompactionStarted === undefined) {
      const task = request;
      request = { ...request, onCompactionStarted: (checkpoint, signal) => this.reviewCompaction(run, agent, task, checkpoint, signal) };
    }
    if (run.record.breakpoint !== undefined && ['engineer', 'contract-engineer', 'nonfunctional-repair-engineer'].includes(request.role)) {
      let current = request.stepInputs && request.fallback === undefined
        ? { ...request, fallback: this.coordination(run).stepFallback(request.stepInputs, request.consultationPackages ?? new Map([[request.role, request.loaded]])) }
        : request;
      let held: InvocationResult<T> | undefined;
      run.debugPrepared = {
        inspect: () => this.runner.preview(run, agent, current),
        exchange: async text => {
          const result = await this.recoverableInvocation(run, agent, { ...current, callerText: text, pendingPlainReturn: true });
          if (result.pending) {
            // Both the agent point and harness briefing ancestry were retained by
            // ordinary operations; continue that exact point with current bindings.
            current = { ...current, start: { mode: 'continue', ref: result.ref }, session: result.session,
              continuing: 'debugger', fork: undefined, replaces: undefined, degraded: undefined, originalInvocation: undefined, restore: false,
              callerText: undefined };
          } else held = result;
          return result;
        },
        held: () => held !== undefined,
        resume: text => { current = { ...current, callerText: text, pendingPlainReturn: false }; },
      };
      if (!await this.pauseEngineer(run, request)) return { id: '', ended: 'stopped', value: undefined, ref: '', outcomeKind: 'stopped', session: '', kept: false };
      if (held !== undefined) return held;
      return this.recoverableInvocation(run, agent, current);
    }
    return this.recoverableInvocation(run, agent, request);
  }

  /** Review while native compaction runs; its next-turn barrier awaits this durable decision. */
  private async reviewCompaction<T>(run: Run, agent: AgentPort, engineer: InvocationRequest<T>,
    checkpoint: { invocation: string; ordinal: number; reason: string }, signal: AbortSignal): Promise<z.infer<typeof compactionReviewSchema>> {
    const matches = (data: { invocation: string; ordinal: number }) => data.invocation === checkpoint.invocation && data.ordinal === checkpoint.ordinal;
    const recorded = run.log.all('compaction-reviewed').find(event => matches(event.data));
    if (recorded) return { action: recorded.data.action, reason: recorded.data.reason };
    const records = committedRecords(run.log.ledger.replay());
    const assignment = engineer.work.iteration === undefined ? undefined : records.assignments.get(engineer.work.iteration);
    const role = engineer.role === 'nonfunctional-repair-engineer' ? 'nonfunctional-coordinator'
      : assignment?.coordination?.kind === 'capability-task' || engineer.work.capabilityTask !== undefined ? 'capability-architect' : 'local-architect';
    if (!run.log.all('compaction-review-started').some(event => matches(event.data))) {
      await this.write(run, { type: 'compaction-review-started', data: { invocation: checkpoint.invocation, ordinal: checkpoint.ordinal, role } });
    }
    if (signal.aborted || this.ignoring(run)) throw new Error('Compaction review stopped');
    const packages = engineer.consultationPackages ?? (await loadPromptPackages({
      ...(this.options.skillDirectory === undefined ? {} : { skillDirectory: this.options.skillDirectory }), capabilityWorkflow: this.workflow !== null,
    })).packages;
    const loaded = packages.get(role);
    if (!loaded) throw new Error(`Compaction review requires ${role}`);
    const key = `compaction:${checkpoint.invocation}:${checkpoint.ordinal}`;
    const prior = run.log.all('invocation-started').filter(event => event.data.work.request === key);
    let accepted: { id: string; value: z.infer<typeof compactionReviewSchema> } | undefined;
    for (const start of prior) {
      const end = run.log.all('invocation-ended').find(event => event.data.invocation === start.data.invocation);
      if (end?.data.ended !== 'submitted' || end.data.submission === null) continue;
      const bytes = await readIfExists(run.path(runLayout.submission(start.data.invocation)));
      if (!bytes || sha256(bytes) !== end.data.submission) throw new Error('Compaction assessment submission is unavailable');
      const { schema: _schema, ...body } = JSON.parse(bytes.toString('utf8')) as Record<string, unknown>;
      accepted = { id: start.data.invocation, value: compactionReviewSchema.parse(body) };
    }
    if (!accepted) {
      const original = run.log.all('invocation-started').find(event => event.data.invocation === checkpoint.invocation);
      if (original === undefined) throw new Error('Compaction review has no originating invocation');
      const toolName = 'submit_compaction_review';
      // This review is already beside an active engineer. A failed review hands the
      // task back; it must not enter a recovery wait that waits on that engineer.
      const result = await this.runner.runInvocation(run, agent, {
        role, work: { ...engineer.work, request: key }, task: { kind: 'compaction-review', goal: engineer.task?.goal ?? assignment?.goal ?? engineer.description,
          requirements: [`Review the engineer's assignment and recorded work at ${run.path(runLayout.invocation(checkpoint.invocation))}. Continue useful work; request handoff when the evidence calls for reconsideration or further refinement has diminishing returns. Compaction alone is not evidence of failure.`] },
        attempt: prior.length + 1, loaded,
        systemPrompt: `You are the responsible ${roleDisplayName(role)} reviewing an engineer during native compaction. Inspect evidence and decide whether the engineer should continue or hand the unfinished task back for reconsideration. Use ${toolName} with its supplied schema. This review assesses work; leave implementation changes to the engineer.`,
        prompt: [
          `Engineer ${checkpoint.invocation} is compacting (${checkpoint.reason}). Compaction alone establishes neither failure nor diminishing returns.`,
          'Continue when the approach is useful. Request handoff when the evidence calls for a different approach, a missing decision, or ending unnecessary refinement after requirements are satisfied.',
          'Consider unresolved correctness, expected benefit and cost of more refinement, and whether better context or guidance is needed. Explain the next useful contribution or the reason for reconsideration.',
          `Task: ${engineer.task?.goal ?? assignment?.goal ?? engineer.description}`,
          `Assignment: ${assignment === undefined ? 'See the invocation records.' : JSON.stringify(assignment)}`,
          `Invocation: ${run.path(runLayout.invocation(checkpoint.invocation))}`,
          `Transcript: ${run.path(runLayout.transcript(original.data.session))}`,
          `Tool and validation observations: ${run.path(runLayout.observations(checkpoint.invocation))}`,
        ].join('\n\n'),
        start: { mode: 'fresh' }, keep: () => finished('work-closed'), reader: true, signal,
        toolName, description: 'Decide whether useful work should continue after compaction or the unfinished task should return to its architect.',
        inputSchema: z.toJSONSchema(compactionReviewSchema) as JsonSchema, submissionSchema: 'ramify-agent.compaction-review/1',
        validate: input => validateAgainst(compactionReviewSchema, input), scope: { write: null, measurement: null, size: null },
        equip: session => ({ ...nonfunctionalEquipment({ projectRoot: this.projectRoot, snapshotTools: [],
          commandExecution: this.options.commandExecution, rejectedToolInputsPerTurn: run.policy.limits.rejectedToolInputsPerTurn,
          outputFile: call => run.path(runLayout.shellOutput(session.invocation, call)) }, session),
          builtinTools: ['read', 'write', 'edit', 'grep', 'find', 'ls'] }),
      });
      if (signal.aborted || this.ignoring(run)) throw new Error('Compaction review stopped');
      if (result.ended !== 'submitted' || result.value === undefined) {
        return { action: 'handoff', reason: `Architect review ended ${result.ended}; reconsider the unfinished task with retained work and context.` };
      }
      accepted = { id: result.id, value: result.value };
    }
    if (signal.aborted || this.ignoring(run)) throw new Error('Compaction review stopped');
    await this.write(run, { type: 'compaction-reviewed', data: { invocation: checkpoint.invocation,
      ordinal: checkpoint.ordinal, reviewer: accepted.id, ...accepted.value } });
    return accepted.value;
  }

  /** Park before invocation admission, outside all mutexes and invocation cleanup. */
  private async pauseEngineer<T>(run: Run, request: InvocationRequest<T>): Promise<boolean> {
    if (this.ignoring(run)) return false;
    const refusal = this.invocationRefusal(run);
    if (refusal !== null) { await this.fail(run, 'limit-exceeded', refusal); return false; }
    const existing = [...run.log.all('debug-pausing')].reverse().find(event => !run.log.all('debug-resumed').some(resumed => resumed.data.pauseId === event.data.pauseId));
    const pauseId = existing?.data.pauseId ?? `pause-${String(run.log.count('debug-pausing') + 1).padStart(4, '0')}`;
    const revision = existing ? Math.max(existing.data.revision, ...run.log.events.filter(event => 'pauseId' in event.data && event.data.pauseId === pauseId && 'revision' in event.data).map(event => Number((event.data as { revision: number }).revision))) : 1;
    const goal = request.task?.goal ?? request.description;
    const nextAction = `Execute the prepared ${roleDisplayName(request.role).toLowerCase()} task with its ordinary tools and submission validator.`;
    const pause: BreakpointState = { kind: 'breakpoint', planId: run.planId, runId: run.jobId, pauseId, revision,
      cursor: run.log.version, state: 'pausing', role: request.role, work: { ...request.work }, goal, nextAction,
      taskState: 'pending', summary: `Settling admitted work before ${roleDisplayName(request.role).toLowerCase()}: ${goal}` };
    run.debugPause = pause;
    // Attempts already admitted may finish their orientation and review calls.
    // The barrier is for new attempts, not the calls within those pipelines.
    const releaseReviews = run.reviews?.suspend();
    try {
      if (!existing && await this.write(run, { type: 'debug-pausing', data: { pauseId, revision, role: request.role,
        work: request.work, goal, nextAction } }) === 'ended') return false;
      await run.reviews?.settled();
      await run.gating;
      await run.readiness?.settled;
      while (run.live.size > 0) await Promise.all([...run.live.values()].map(live => live.done));
      if (this.ignoring(run)) return false;
      const operations = this.sessionOperations === undefined ? undefined : await this.sessionOperations;
      for (;;) {
        const unsettledInvocation = run.log.ledger.replay().flatMap(entry => entry.transaction.records).find(record => {
          if (!record.path.startsWith('invocations/') || !record.path.endsWith('/outcome.json')) return false;
          const invocation = record.path.split('/')[1]!;
          const outcome = invocationOutcomeSchema.safeParse(this.effectiveInvocationOutcome(run, invocation) ?? record.body);
          return !outcome.success || !outcome.data.settled.confirmed;
        });
        if (!unsettledInvocation && !run.writer.isUnsettled && operations?.settlementConfirmed(run.jobId) !== false) break;
        if (!await this.waitOperationRecovery(run, { kind: 'preparation', role: request.role, work: request.work,
          ...(unsettledInvocation ? { invocation: unsettledInvocation.path.split('/')[1]! } : {}) },
          { classification: 'unknown', diagnostic: 'Breakpoint admission retains an unconfirmed predecessor. Restore its owned settlement and effects before explicitly resuming the prepared task.' }, [], 0, 0)) return false;
      }
      run.writer.requireSettled('A usable breakpoint requires a settled writer');
      // Settlement is execution time. Only the fully reached caller wait is excluded.
      const settledRefusal = this.invocationRefusal(run);
      if (settledRefusal !== null) { await this.fail(run, 'limit-exceeded', settledRefusal); return false; }
      const reached = await run.mutex.run(async () => {
        if (this.ignoring(run)) return false;
        if (!run.log.all('debug-paused').some(event => event.data.pauseId === pauseId && event.data.revision === revision)) await run.log.append({ type: 'debug-paused', data: { pauseId, revision } }, this.now());
        pause.state = 'paused';
        pause.cursor = run.log.version;
        pause.summary = `Paused before ${request.role}: ${goal} Assignment prepared; engineer not yet invoked. Resume executes its ordinary task.`;
        return true;
      });
      if (!reached) return false;
      for (;;) {
        const changed = run.changed();
        if (this.ignoring(run)) return false;
        if (run.debugPause !== pause) break;
        await changed;
      }
      if (!run.debugPrepared?.held()) run.writer.requireSettled('The resumed module engineer requires a settled writer');
      const changes = await documentChanges(this.projectRoot, run.planId, run.directory, run.record.manifest);
      if (changes.length > 0) { await this.fail(run, 'inputs-changed', `Captured documents changed while paused: ${changes.join('; ')}`); return false; }
      return !this.ignoring(run);
    } finally {
      run.debugPause = undefined;
      run.debugPrepared = undefined;
      // Stop/close takes precedence even if it raced with a durable resume.
      if (this.ignoring(run)) run.reviews?.close();
      releaseReviews?.();
    }
  }

  /** Deliver an accepted destination once when ordinary workflow construction reaches its task. */
  private async restoreInvocation<T>(run: Run, _agent: AgentPort, request: InvocationRequest<T>) {
    if (request.role === 'capability-architect') return null;
    const events = run.log.all('invocation-started').filter(event => event.sequence <= (run.restorationSequence ?? run.log.version)
      && !run.restoredInvocations.has(event.data.invocation) && event.data.role === request.role
      && !run.log.all('reconciliation-assessed').some(assessment => assessment.data.invocation === event.data.invocation)
      && !(request.role === 'global-fork' && run.log.all('fork-returned-partial').some(partial => partial.data.invocation === event.data.invocation))
      && !(request.role === 'local-architect' && (run.log.all('work-item-yielded').some(yielded => yielded.data.invocation === event.data.invocation)
        || run.log.all('iteration-assigned').some(assigned => assigned.data.invocation === event.data.invocation && committedRecords(run.log.ledger.replay()).results.has(assigned.data.iteration)
          && !run.log.all('contract-requested').some(contract => contract.data.requestedBy === assigned.data.iteration
            && !committedRecords(run.log.ledger.replay()).results.has(contract.data.iteration)))
        || run.log.all('gate-attempted').some(attempt => { const gate = gateAttemptSchema.safeParse(this.committedBody(run, runLayout.gate(attempt.data.gate))); return gate.success && gate.data.proposedBy === event.data.invocation && gate.data.verdict !== 'passed'; })))
      && (request.originalInvocation !== undefined || !run.log.all('invocation-started').some(later => later.sequence > event.sequence
        && later.sequence <= (run.restorationSequence ?? run.log.version) && later.data.role === event.data.role && canonicalJson(later.data.work) === canonicalJson(event.data.work)))
      && (request.originalInvocation === undefined || event.data.invocation === request.originalInvocation)
      && (canonicalJson(event.data.work) === canonicalJson(request.work) || request.role === 'nonfunctional-coordinator' && event.data.work.task === undefined)
      && run.log.all('invocation-ended').some(ended => ended.data.invocation === event.data.invocation && ended.data.ended === 'submitted'));
    for (const event of events) {
      const id = event.data.invocation;
      const outcome = invocationOutcomeSchema.parse(this.committedBody(run, runLayout.outcome(id)));
      if (!outcome.settled.confirmed || !outcome.submission) throw new Error(`Accepted task result ${id} has no confirmed settlement`);
      const bytes = await readIfExists(run.path(runLayout.submission(id)));
      if (!bytes || sha256(bytes) !== outcome.submission.hash) throw new Error(`Accepted task result ${id} is unavailable or changed`);
      const { schema, ...body } = JSON.parse(bytes.toString('utf8')) as Record<string, unknown>;
      if (schema !== request.submissionSchema) continue;
      if (request.role === 'nonfunctional-coordinator' && !(await request.validate(body)).ok) continue;
      run.restoredInvocations.add(id);
      const ended = run.log.all('invocation-ended').find(ended => ended.data.invocation === id)!;
      return { hasIntent: true, result: { id, ended: outcome.ended, value: body as T, ref: outcome.session?.ref ?? '', session: event.data.session,
        kept: ended.data.kept, outcomeKind: 'submitted' as const, elapsedMs: outcome.elapsedMs, inFlight: [], lastText: null } };
    }
    return null;
  }

  /** Latest immutable invocation revision, unlike owning assignment/license lookups. */
  private invocationRecord(run: Run, id: string) {
    return invocationRecord(run, id);
  }

  private operations(agent: AgentPort): Promise<HarnessSessionOperations> {
    return this.sessionOperations ??= HarnessSessionOperations.open(join(this.projectRoot, 'plans', '.harness', 'session-operations'), agent);
  }

  private administration(): Promise<BeadsSessions | undefined> {
    const agent = this.options.agent;
    if (!agent) return Promise.resolve(undefined);
    return this.beadsSessions ??= BeadsSessions.open({
      projectRoot: this.projectRoot,
      operations: async () => (await this.operations(agent)).operations,
      commandExecution: this.options.commandExecution,
      onPending: (runId, reason) => this.warn(`Run ${runId}: Beads administration pending: ${reason}`),
    });
  }

  /** The optional queue persists independently; an unavailable tracker never changes the run. */
  private async scheduleBeads(run: Run, phase: 'start' | 'finish'): Promise<void> {
    const destination = run.record.beadsAdministration;
    if (destination === undefined || 'error' in destination) return;
    try {
      const administration = await this.administration();
      if (!administration) return;
      // Finishing the ordinary session retires its run authority, not its
      // immutable provider point. Administrative forks retain that point.
      const records = committedRecords(run.log.ledger.replay());
      const sourceRef = globalContext({ events: run.log.events,
        sessionRef: invocation => records.outcomes.get(invocation)?.session?.ref }).ref;
      const evidence = await this.beadsContext(run, phase);
      const input = { runId: run.record.jobId, sourceRef, ...evidence,
        workspace: destination.trackerWorkspace, executable: destination.executable };
      if (phase === 'start') await administration.scheduleStart(input);
      else await administration.scheduleFinish({ ...input, outcome: run.log.terminal?.type ?? 'unknown' });
    } catch (error) { this.warn(`Run ${run.record.jobId}: Beads ${phase} administration unavailable: ${message(error)}`); }
  }

  /** Retained acceptance evidence is supplied directly; administration does not inspect mutable source. */
  private async beadsContext(run: Run, phase: 'start' | 'finish'): Promise<{ context: string; reports: Array<{ path: string; hash: string }> }> {
    const reports: Array<{ path: string; hash: string }> = [];
    const capturedText = async (path: string, hash: string): Promise<string> => {
      try {
        const bytes = await readFile(run.path(path));
        if (sha256(bytes) !== hash) return `Retained evidence unavailable: ${path} differs from its captured hash`;
        return bytes.toString('utf8');
      } catch (error) { return `Retained evidence unavailable: ${path}: ${message(error)}`; }
    };
    const plan = await capturedText(runLayout.capturedPlan, run.record.manifest.planHash);
    const analysis = run.log.find('analysis-accepted');
    const evidence: Array<{ path: string; body: unknown }> = [];
    if (analysis !== undefined) {
      for (const reference of [analysis.data.evidence.catalog, analysis.data.evidence.incorporation]) {
        const body = await capturedText(reference.path, reference.hash);
        evidence.push({ path: reference.path, body });
      }
    }
    if (phase === 'finish') {
      const entries = run.log.ledger.replay();
      const latest = new Map(entries.flatMap(line => line.transaction.records).map(record => [record.path, record]));
      const include = (path: string): void => {
        const record = latest.get(path);
        evidence.push(record === undefined ? { path, body: 'Retained record unavailable; this is an evidence limitation' }
          : { path, body: record.body });
      };
      const binding = run.log.all('candidate-bound-to-gate').at(-1);
      const candidate = run.log.all('candidate-prepared').at(-1)?.data.candidate ?? binding?.data.candidate;
      const assessment = run.log.all('nonfunctional-assessed').at(-1)?.data.assessment ?? binding?.data.assessment;
      const gate = run.log.all('gate-attempted').at(-1)?.data.gate ?? binding?.data.gate;
      if (candidate !== undefined) include(runLayout.candidate(candidate));
      if (assessment !== undefined) include(runLayout.assessment(assessment));
      if (gate !== undefined) {
        const path = runLayout.gate(gate);
        const body = latest.get(path)?.body;
        const parsed = gateAttemptSchema.safeParse(body);
        if (parsed.success) reports.push({ path: run.path(path), hash: sha256(`${JSON.stringify(body, null, 2)}\n`) });
        evidence.push({ path, body: parsed.success ? {
          schema: parsed.data.schema, id: parsed.data.id, checkpoint: parsed.data.checkpoint,
          subject: parsed.data.subject, audited: parsed.data.audited,
          verdict: parsed.data.verdict, cause: parsed.data.cause, next: parsed.data.next,
          audit: parsed.data.audit === undefined ? null : {
            status: parsed.data.audit.status, verdict: parsed.data.audit.verdict,
            requestedSourceCommit: parsed.data.audit.requestedSourceCommit,
            auditedSourceCommit: parsed.data.audit.auditedSourceCommit,
            requestedMode: parsed.data.audit.requestedMode, executedMode: parsed.data.audit.executedMode,
            fallbackReason: parsed.data.audit.fallbackReason, reuse: parsed.data.audit.reuse,
            nested: parsed.data.audit.nested,
          },
          evidence: parsed.data.evidence, reportPath: run.path(path),
          scope: 'Full audit evidence remains in the referenced report. Consult relevant details only when needed for an issue judgment.',
        } : 'Retained gate unavailable; this is an evidence limitation' });
      }
      evidence.push({ path: 'candidate-bound-to-gate', body: { latestBinding: binding ?? null,
        current: binding !== undefined && candidate === binding.data.candidate && assessment === binding.data.assessment && gate === binding.data.gate,
        scope: 'An earlier binding does not establish acceptance of a later candidate, assessment or gate.' } });
      const records = committedRecords(entries);
      const completed = new Map(run.log.all('work-item-completed').map(event => [event.data.workItem, event]));
      const currentResults = new Map<string, IterationResult>();
      for (const [iteration, result] of records.results) {
        const assignment = records.assignments.get(iteration);
        if (assignment !== undefined) currentResults.set(assignment.coordination?.kind === 'capability-task'
          ? assignment.coordination.id : assignment.workItem, result);
      }
      evidence.push({ path: 'current-work', body: { workItems: records.workItems,
        completed: [...completed.values()], latestResults: [...currentResults].map(([owner, result]) => ({ owner, result })),
        capabilityHandbacks: [...records.capabilityHandbacks.values()],
        scope: 'Latest result for each work owner and complete current work-item inventory; earlier iteration/gate history omitted.' } });
      evidence.push({ path: 'current-check-findings', body: [...checkFindingStateOf(run.log.ledger).findings.values()]
        .map(finding => ({ id: finding.id, owner: finding.owner, standing: finding.standing, reason: finding.reason,
          pendingUserDecision: finding.pendingUserDecision, settledBy: finding.settledBy,
          latestDecision: finding.decisions.at(-1) ?? null })) });
      for (const record of latest.values()) {
        const schema = (record.body as { schema?: unknown } | null)?.schema;
        if (typeof schema === 'string' && ['nonfunctional-deviation', 'plan-deviation']
          .some(name => schema.startsWith(`ramify-agent.${name}/`))) evidence.push({ path: record.path, body: record.body });
      }
    }
    const terminal = run.log.terminal;
    return { reports, context: [
      `Plan ${run.record.planId}; run ${run.record.jobId}; administrative phase ${phase}.`,
      `Implementation workspace: ${this.projectRoot}. Retained run evidence: ${run.directory}.`,
      `Accepted Git boundary: ${this.coordination(run).accepted()}.`,
      `Terminal outcome: ${terminal === undefined ? 'implementation beginning' : JSON.stringify(terminal)}.`,
      'Relate only existing issues explicitly mentioned by this plan or its captured evidence. The tracker never decides plan execution or acceptance.',
      'A completed run can retain unresolved deviations. Close an issue only when retained evidence establishes its particular requirements are satisfied; preserve unresolved, failed, interrupted and stopped work truthfully.',
      `<plan>\n${plan}\n</plan>`,
      `Accepted analysis: ${JSON.stringify(analysis ?? null)}`,
      `Run snapshot: ${JSON.stringify(runSnapshot(run.record, run.log.events))}`,
      `Retained evidence: ${JSON.stringify(evidence)}`,
    ].join('\n\n') };
  }

  private async taskBrief<T>(run: Run, request: InvocationRequest<T>, spec: SessionSpec, limits: RunPolicy['limits']): Promise<HarnessTaskBrief> {
    const kind = request.task?.kind ?? taskKindFor(request.role, request.toolName, request.continuing);
    const records = committedRecords(run.log.ledger.replay());
    const item = records.workItems.find(item => item.id === request.work.workItem);
    const goal = request.task?.goal ?? item?.goal ?? `Read the captured plan for ${run.record.planId} and perform the current ${kind} task.`;
    // The plan is delivered once, whole, in its plan block; the requirements
    // point to it. A continued or forked session already holds the block.
    const requirements = request.task?.requirements ?? [planPointer(run.record.planId)];
    const planSections = request.task?.requirements === undefined && request.start.mode === 'fresh' && !request.prompt.includes('\n<plan>\n')
      ? [{ key: 'support:plan', text: capturedPlanBlock(run.record.planId,
        this.coordination(run).capturedPlanPath(), new TextDecoder().decode(await readFile(run.path(runLayout.capturedPlan)))).join('\n') }]
      : [];
    const groups = [...request.task?.startingPointGroups ?? []];
    if (request.role === 'engineer' && request.work.iteration !== undefined) {
      const assignment = records.assignments.get(request.work.iteration);
      if (assignment !== undefined) groups.push(this.coordination(run).assignmentStartingPoints(assignment));
    }
    if ((request.role === 'context-selector' && request.start.mode === 'fresh') || (request.role === 'local-architect' && kind !== 'orientation')) {
      const orientation = run.log.all('work-orientation-recorded').find(event => event.data.workItem === request.work.workItem);
      const parent = orientation === undefined ? undefined : run.log.all('invocation-started').find(event => event.data.invocation === orientation.data.invocation);
      // Retained orientation sessions already contain the submission. A reconstructed
      // architect keeps its explicit fallback section on subsequent turns.
      if (request.start.mode === 'fresh' || request.session !== parent?.data.session) {
        const oriented = await this.coordination(run).orientationStartingPoints(request.work.workItem);
        if (oriented !== undefined) groups.unshift(oriented.group);
      }
    }
    // Role/task rules deliver known facts; the agent decides what to inspect.
    const known = request.work.automaticRepair === undefined && ['initial-architect', 'local-architect', 'capability-architect', 'engineer', 'contract-engineer', 'nonfunctional-repair-engineer'].includes(request.role)
      || (request.role === 'context-selector' && request.start.mode === 'fresh')
      ? await this.coordination(run).knownProjectFacts(request.task?.modules ?? (item === undefined ? [] : [item.module])) : undefined;
    const evidenceSections: Array<{ key: string; text: string }> = [];
    let deliveredViews = request.task?.views;
    if (kind === 'capability' || kind === 'capability-qualification') {
      const task = records.capabilityTasks.get(request.work.capabilityTask ?? '');
      const need = records.capabilityRequests.get(request.work.request ?? task?.request ?? '');
      const assignments = [...records.assignments.values()].filter(assignment =>
        assignment.coordination?.kind === 'capability-task' && assignment.coordination.id === task?.id);
      const iterations = new Set(assignments.map(assignment => assignment.id));
      if (need !== undefined) iterations.add(need.assignment);
      const gates = new Set([...records.results.values()].filter(result => iterations.has(result.iteration)).flatMap(result => result.gate === null ? [] : [result.gate]));
      for (const started of run.log.all('capability-verification-started')) if (started.data.task === task?.id && started.data.gate !== undefined) gates.add(started.data.gate);
      const committed = run.log.ledger.replay().flatMap(line => line.transaction.records);
      const reviews = new Set(committed.flatMap(record => {
        const parsed = reviewRequestSchema.safeParse(record.body);
        return parsed.success && iterations.has(parsed.data.key.iteration) ? [parsed.data.id] : [];
      }));
      const pointers = committed.filter(record => {
        if (record.path === capabilityLayout.request(need?.id ?? '')) return true;
        if (task !== undefined && record.path.startsWith(`capabilities/${task.id}/`)) return true;
        const body = record.body as { schema?: string; id?: string; iteration?: string };
        if (body.schema === 'ramify-agent.iteration-assignment/1' && iterations.has(body.id ?? '')) return true;
        if (body.schema === 'ramify-agent.iteration-result/1' && iterations.has(body.iteration ?? '')) return true;
        return [...gates].some(gate => record.path.startsWith(`gates/${gate}/`)) || [...reviews].some(review => record.path.startsWith(`reviews/${review}/`));
      }).map(record => ({ path: record.path, label: record.path }));
      if (need !== undefined) {
        pointers.unshift({ path: need.source.snapshot, label: `Immutable suspension snapshot (tree ${need.source.tree})` });
        evidenceSections.push({ key: 'support:caller-source', text: await capabilitySourceSection(this.projectRoot, need) });
      }
      if (task !== undefined) for (const plan of records.capabilityPlans.get(task.id) ?? []) pointers.push({ path: capabilityLayout.plan(task.id, plan.revision), label: `Accepted plan revision ${plan.revision}` });
      for (const gate of gates) pointers.push({ path: runLayout.gateOutput(gate), label: `${gate} named audit/report artifacts` });
      evidenceSections.push({ key: 'support:run-records', text: capabilityRecordSection(run.directory, [...new Map(pointers.map(pointer => [pointer.path, pointer])).values()]) });
      if (need !== undefined) {
        const consumers = [...new Set([need.consumer, ...need.original.usage.flatMap(usage => usage.module === undefined ? [] : [usage.module]), ...task?.authority.map(entry => entry.owner) ?? []])];
        const api = await iterationApiViews(this.options.ramify, this.projectRoot, run.index, { modules: consumers, rationale: 'Consumer API evidence for qualification and integration' });
        deliveredViews = [...capabilityViewInputs(deliveredViews ?? this.coordination(run).architectViewInputs().map(view => ({ ...view, path: view.path.project })), api)];
        evidenceSections.push({ key: 'support:consumer-api', text: [
          '## Consumer API evidence',
          'Refresh attempted at preparation of this task from the current candidate. Only successful refreshes supply current views; failures retain explicit unavailability. Earlier delivered views describe their earlier revision; unavailability in an earlier packet does not mean an API was already received. After exposure changes, assess integration using refreshed consumer evidence and the provider check.',
          'Only existing ordinary/testing source areas are materialized. Missing views for existing areas are reported as unavailable; areas without a source directory have no view. Coverage null means complete; a numeric coverage value counts source-analysis limits, so absence there does not prove API unavailability. A failed or missing view is an evidence limitation, not permission to import.',
          ...api.map(entry => JSON.stringify({ ...entry, views: entry.views.map(view => ({ ...view, open: resolve(this.projectRoot, view.path) })) })),
        ].join('\n') });
      }
    }
    return composeTaskBrief(this.projectRoot, { kind, work: request.work, goal, requirements, prompt: request.prompt,
      omit: request.task?.omit ?? [], literalSections: [...planSections, ...request.task?.literalSections ?? [], ...evidenceSections], startingPointGroups: groups, known,
      retainInheritedSections: request.role === 'context-selector' && request.start.mode === 'fork',
      consultationSubmissionSchema: request.task?.consultationSubmissionSchema,
      environment: { projectRoot: this.projectRoot, workingDirectory: spec.scope.workingDirectory,
        candidate: request.task?.candidate ?? request.candidateBefore ?? null, snapshot: request.task?.snapshot ?? null,
        limits, availableTools: [...spec.builtinTools, ...spec.tools.map(tool => tool.name), spec.submission.name],
        views: deliveredViews ?? this.coordination(run).architectViewInputs().map(view => ({ ...view, path: view.path.project })),
        // Only the sources this task delivers; the package's other files never reach the model.
        supportPaths: deliveredSupportPaths(request.loaded, kind, request.task?.consultationSubmissionSchema), cucumberConfiguration: request.task?.cucumberConfiguration ?? null } });
  }

  // The initial analysis

  /** Reopening after acceptance never repeats planning; staged files alone confer no authority. */
  private async analyse(run: Run, agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>, baseline: MeasurementSnapshot): Promise<boolean> {
    if (run.log.find('analysis-accepted')) return true;
    const architectPackage = packages.get('initial-architect');
    const extractorPackage = packages.get('catalog-extractor');
    if (architectPackage === undefined || extractorPackage === undefined) {
      await this.fail(run, 'internal', 'No prompt package is loaded for the plan architect or the catalog extractor');
      return false;
    }
    return performInitialAnalysis({
      projectRoot: this.projectRoot, directory: run.directory, planId: run.record.planId,
      manifest: run.record.manifest, planScenarios: run.record.planScenarios.scenarios, index: run.index, baseline,
      baselineMeasurement: run.record.baseline && 'measurement' in run.record.baseline ? run.record.baseline.measurement : null,
      capturedPlanPath: this.coordination(run).capturedPlanPath(), rootModule: this.options.rootModule ?? rootModuleOf(run.index) ?? rootModuleOfSnapshot(baseline) ?? 'root',
      registeredTests: new Set([...this.coordination(run).obligationProjection().obligations.values()].filter(item => item.kind === 'test').map(item => item.id)),
      architectPackage, extractorPackage,
    }, {
      execute: request => this.runInvocation(run, agent, request),
      nextExtractionAttempt: () => run.log.all('invocation-started').filter(event => event.data.role === 'catalog-extractor').length + 1,
      ignoring: () => this.ignoring(run), fail: (reason, text, evidence) => this.fail(run, reason, text, evidence),
      stage: (path, text) => writeOnce(run.path(path), text), afterWrite: write => this.afterWrite(write, run.record.jobId),
      captureRepairAssignment: (invocation, assignment) => this.captureAutomaticRepairAssignment(run, invocation, assignment),
      commit: (event, records) => this.write(run, event, records),
    });
  }

  /**
   * The review stop. A run started with it records `review-requested` once
   * the analysis is accepted and waits, holding the project and starting no
   * session, until the log holds `analysis-approved` or the run is stopped
   * or the service closes. Nothing is written to the tree before readiness,
   * so a stop here leaves the repository as the run found it.
   */
  private async awaitReview(run: Run): Promise<boolean> {
    if (!run.record.reviewStop) return true;
    if (run.log.find('review-requested') === undefined) {
      if (await this.write(run, { type: 'review-requested', data: {} }, [], this.now()) === 'ended') return false;
    }
    // The log is read and the wait registered in one turn, so an approval
    // or stop that lands between them still wakes it.
    while (run.log.find('analysis-approved') === undefined && !this.ignoring(run)) await run.changed();
    return !this.ignoring(run);
  }

  // Work items

  /** The module inventory as the project stands now, or null when it cannot be refreshed. */
  private async refreshIndex(run: Run): Promise<ArchitectIndex | null> {
    try {
      const index = await this.options.inputs.refresh(this.projectRoot);
      if (index !== null) run.index = index;
      return index;
    } catch (error) {
      this.warn(`Run ${run.record.jobId}: the architect view could not be refreshed: ${message(error)}`);
      return null;
    }
  }

  /**
   * Commits one `IterationAssignment`. The architect supplied the goal, the
   * approach and the scope's base; the harness captures the real paths, the
   * bootstrap authority the registry gives, the gate, its test-selection
   * policy and the guarded hashes, and none of those is in any submission.
   */

  /**
   * One iteration: the module engineer invocations that work it, the gate that owns
   * the verdict, the repair rounds the policy allows, and the result that
   * closes it. The counters are keyed by the iteration, not by the session,
   * so a fresh session after a context-budget return resets nothing.
   */

  /** A task completion request uses the ordinary project gate and the
   * reviews already requested for its accepted iterations. Its result returns
   * to this architect; failed iteration gates already returned to engineers.
   * The handback is the architect's done reports on the task's obligations,
   * which validation required of the accepted request; the harness checks
   * the non-test workflow boundaries, never a cited file, an executed test
   * or a per-example state. */
  private async verifyCapabilityHandback(
    run: Run, agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>, item: WorkItem, task: CapabilityTask,
    request: CapabilityRequest, plan: CapabilityPlan,
    action: Extract<CapabilityAction, { kind: 'request-handback' }>,
    completion: InvocationResult<CapabilityAction>,
    replayed: boolean,
  ): Promise<CapabilityVerification | null> {
    const invocation = completion.id;
    run.writer.requireSettled(`Capability ${task.id} cannot verify an unsettled writer`);
    const state = replayCapabilityState(run.log.events).tasks.get(task.id);
    if (state === undefined || state.status !== 'coordinating' || state.planRevision !== plan.revision || state.activeChild !== null) {
      return { kind: 'refused', guidance: 'The task, plan or child dependency is not ready for completion' };
    }
    // Every obligation this architect is responsible for was reported done
    // by the time the request was accepted: validation rejects one that
    // leaves an ID unreported, in the same turn and before any gate.
    const records = committedRecords(run.log.ledger.replay());
    const assignments = [...records.assignments.values()].filter(entry =>
      entry.coordination?.kind === 'capability-task' && entry.coordination.id === task.id)
      .sort((a, b) => (a.coordination?.kind === 'capability-task' ? a.coordination.sequence : 0) -
        (b.coordination?.kind === 'capability-task' ? b.coordination.sequence : 0));
    const results = assignments.map(entry => records.results.get(entry.id));
    const latestAccepted = [...assignments].reverse().find(entry => records.results.get(entry.id)?.outcome === 'accepted');
    const blockers = capabilityCompletionBlockers(replayCapabilityState(run.log.events), task.id,
      new Set(results.filter(result => result?.outcome === 'accepted').map(result => result!.iteration)));
    if (blockers.length > 0 || latestAccepted === undefined || results.some(result => result === undefined) ||
      state.activeAssignment !== null || state.activeChild !== null) {
      return { kind: 'refused', guidance: [...blockers, latestAccepted === undefined ? 'No accepted task iteration' : '',
        results.some(result => result === undefined) ? 'An assignment has no ordinary result' : ''].filter(Boolean).join('; ') || 'An assignment is unfinished' };
    }
    const latestResult = records.results.get(latestAccepted.id)!;
    const candidate = (await this.previewCandidateTree()).tree;
    const acceptedGate = latestResult.gate === null ? null
      : gateAttemptSchema.safeParse(this.committedBody(run, runLayout.gate(latestResult.gate)));
    if (acceptedGate?.success !== true || acceptedGate.data.audited === null ||
      await this.candidates.commitTree(this.projectRoot, acceptedGate.data.audited) !== candidate) {
      return { kind: 'refused', guidance: `Current source differs from the latest accepted iteration ${latestAccepted.id}; assign a repair and gate it` };
    }
    const correction = this.pendingCorrection(run, task.id);
    if (correction !== undefined) return { kind: 'refused',
      guidance: `Reconciliation ${correction} requires an accepted correction assignment before another handback request` };
    const loaded = packages.get('capability-architect');
    if (loaded === undefined) { await this.fail(run, 'internal', 'Capability architect package is absent for reconciliation'); return null; }
    // The capability architect's own session runs from the project root, so its reconciliation fork does too.
    const parent: ParentSession = { session: completion.kept ? completion.session : undefined,
      ref: completion.ref || undefined, undelivered: [], workingDirectory: this.projectRoot };
    const reconciled = await this.reconcileWorkItem(run, agent, loaded, item, parent, {
      id: task.id, role: 'capability-architect', request: request.id, provider: task.provider,
      ...(completion.ref ? { completion: { session: completion.session, ref: completion.ref, invocation } } : {}),
    });
    if (reconciled === null) return null;
    const coordinator = { point: parent.ref, session: parent.session, invocation };
    if (reconciled.kind === 'correct') return { kind: 'refused',
      guidance: `Reconciliation ${reconciled.reconciliation} requires a correction assignment. ${JSON.stringify(this.reconciliationBriefing(run, reconciled.reconciliation, parent.undelivered))}`,
      coordinator };
    const reviewStates = [...reviewStateOf(run.log.events).values()].filter(entry => entry.workItem === task.id);
    const failedTaskGates = run.log.all('gate-attempted').flatMap(event => {
      const parsed = gateAttemptSchema.safeParse(this.committedBody(run, runLayout.gate(event.data.gate)));
      return parsed.success && parsed.data.checkpoint === 'work-item' && parsed.data.verdict !== 'passed' &&
        parsed.data.proposedBy !== null && records.invocations.get(parsed.data.proposedBy)?.work.capabilityTask === task.id
        ? [parsed.data] : [];
    });
    const gate = await this.gates.workItemGate(run, item, invocation, failedTaskGates.length,
      `Capability ${task.id}: ${action.summary}`, task.id, replayed);
    if (gate === null) return null;
    if (gate.verdict !== 'passed' || gate.audited === null) {
      return { kind: 'refused', guidance: `Task completion gate ${gate.id} ${gate.verdict}: ${gate.cause ?? 'incomplete evidence'}; report ${runLayout.gate(gate.id)}`, coordinator };
    }
    const currentTree = (await this.previewCandidateTree()).tree;
    const auditedTree = await this.candidates.commitTree(this.projectRoot, gate.audited);
    if (auditedTree !== currentTree) return { kind: 'refused', guidance: `Source changed after gate ${gate.id}; verify again`, coordinator };
    const basisRefusal = await this.completionBasisRefusal(run, task.id, gate, reconciled.basis);
    if (basisRefusal !== null) {
      await this.write(run, { type: 'reconciliation-refused', data: { workItem: task.id,
        reconciliation: this.latestBasis(run, task.id)?.id ?? null, stage: 'completion', reason: basisRefusal } });
      return { kind: 'refused', guidance: `Completion basis changed: ${basisRefusal}`, coordinator };
    }
    await this.write(run, { type: 'capability-verification-started', data: { task: task.id, invocation, gate: gate.id } });
    await this.afterWrite('capability-verification-started', run.record.jobId);
    if (this.ignoring(run)) return null;
    const qualification: CapabilityHandbackBasis = { gate, gateRecord: refOf(gate.id, 1, this.committedBody(run, runLayout.gate(gate.id))), candidateTree: currentTree, reviews: reviewStates, acceptedBasis: reconciled.basis, reconciliation: this.latestBasis(run, task.id) ?? null, recovered: false };
    const handback = await this.coordination(run).finishCapabilityHandback(task, request, plan, action, invocation, qualification);
    return { kind: 'accepted', handback, qualification, guidance: `${capabilityHandbackGuidance(run.path('.'), handback)}\nContinue the original assignment from the current candidate; its remaining goal stays open.` };
  }

  private async takeIteration(
    run: Run,
    agent: AgentPort,
    packages: ReadonlyMap<string, LoadedPackage>,
    baseline: MeasurementSnapshot,
    item: WorkItem,
    assignment: IterationAssignment,
    assignedIndex: ArchitectIndex | null,
    resume?: { readonly session: SessionId; readonly point: string; readonly guidance: string; readonly priorInvocation: string },
  ): Promise<IterationOutcome | null> {
    // The capability owner already delivered this accepted request to its child.
    // Its handback continues the unfinished assignment with a new engineer turn.
    if (resume !== undefined) run.restoredInvocations.add(resume.priorInvocation);
    const savedResult = committedRecords(run.log.ledger.replay()).results.get(assignment.id);
    if (run.restoring && savedResult) {
      for (const invocation of [...savedResult.invocations].reverse()) {
        const outcome = this.effectiveInvocationOutcome(run, invocation);
        if (!outcome?.settled.confirmed) throw new Error('Original iteration outcome has no confirmed settlement');
        if (!outcome.submission) continue;
        const bytes = await readIfExists(run.path(runLayout.submission(invocation)));
        if (!bytes || sha256(bytes) !== outcome.submission.hash) throw new Error('Original iteration destination changed');
        const { schema, ...body } = JSON.parse(bytes.toString('utf8')) as Record<string, unknown>;
        if (schema !== 'ramify-agent.engineer-submission/1') throw new Error('Original iteration destination schema changed');
        const parsed = engineerSubmissionSchema.parse(body);
        if (parsed.kind === 'contract-needed') return { kind: 'closed', result: savedResult, need: { need: parsed.need, suggestedProvider: parsed.suggestedProvider, injectionSites: parsed.injectionSites, invocation } };
      }
      return { kind: 'closed', result: savedResult };
    }
    if (packages.get('engineer') === undefined) {
      await this.fail(run, 'internal', 'No prompt package is loaded for the module engineer');
      return null;
    }
    const number = assignment.coordination?.kind === 'capability-task'
      ? assignment.coordination.sequence : Number.parseInt(assignment.id.slice(assignment.id.lastIndexOf('.i') + 2), 10);
    // Every module engineer invocation of the iteration, a budget return's too,
    // runs under the bounds its assignment raised, and its prompt states the
    // longest a command may run.
    const bounds = this.coordination(run).engineerBounds(assignment);
    const workingDirectory = await engineerWorkingDirectory(this.projectRoot, assignment.scope, run.index, this.git);
    // What the assignment gave it to write: its base modules, included
    // subtrees, bootstrapped modules and extra locations.
    const measurementScope = writeScopeMeasurement(assignment.scope);

    const priorStarts = run.log.all('invocation-started').filter(event =>
      event.data.role === 'engineer' && event.data.work.iteration === assignment.id);
    const invocations: string[] = priorStarts.map(event => event.data.invocation);
    const findings: string[] = [];
    let sessionRef: string | undefined = resume?.point || undefined;
    /** The module engineer's session while the harness keeps it; `sessionRef` is its executor's point. */
    let session: SessionId | undefined = resume?.session;
    /** A lost session the next one is reconstructed in place of. */
    let replacing: SessionId | undefined;
    let handoff: { done: string[]; unfinished: string[] } | undefined;
    let failedGate: { id: string; cause: string | null; summary: string[] } | undefined;
    let firstCause: { gate: string; cause: string | null } | undefined;
    const priorGates = run.log.all('gate-attempted').flatMap(event => {
      const parsed = gateAttemptSchema.safeParse(this.committedBody(run, runLayout.gate(event.data.gate)));
      return parsed.success && parsed.data.subject.iteration === assignment.id ? [parsed.data] : [];
    });
    let replay: InvocationResult<EngineerSubmission> | undefined;
    let resourceRestartPredecessor: string | undefined;
    const latestStart = priorStarts.at(-1);
    if (latestStart !== undefined && resume?.priorInvocation !== latestStart.data.invocation &&
      !priorGates.some(gate => gate.proposedBy === latestStart.data.invocation)) {
      const ended = run.log.all('invocation-ended').find(event => event.data.invocation === latestStart.data.invocation);
      const recorded = this.effectiveInvocationOutcome(run, latestStart.data.invocation);
      if (ended !== undefined && recorded !== undefined && recorded.settled.confirmed) {
        const bytes = recorded.submission === null ? undefined : await readIfExists(run.path(runLayout.submission(latestStart.data.invocation)));
        if (bytes !== undefined && sha256(bytes) !== recorded.submission?.hash) {
          await this.fail(run, 'recovery-exhausted', `Engineer ${latestStart.data.invocation} has changed submission bytes`);
          return null;
        }
        const raw = bytes === undefined ? null : JSON.parse(bytes.toString('utf8')) as Record<string, unknown>;
        const parsed = raw === null ? null : engineerSubmissionSchema.safeParse((({ schema: _schema, ...body }) => body)(raw));
        if (recorded.ended === 'submitted' && (raw?.schema !== 'ramify-agent.engineer-submission/1' || !parsed?.success)) {
          await this.fail(run, 'recovery-exhausted', `Engineer ${latestStart.data.invocation} has no valid committed submission`);
          return null;
        }
        const resourceRestart = run.restoring && !run.log.find('stop-requested')
          && (['stopped', 'resource-pending', 'context-budget-reached'].includes(recorded.ended) || recorded.ended === 'failed' && recorded.interruption !== undefined);
        if (resourceRestart) resourceRestartPredecessor = latestStart.data.invocation;
        else replay = { id: latestStart.data.invocation, ended: recorded.ended,
          value: parsed?.success ? parsed.data : undefined,
          ref: recorded.session?.ref ?? '', session: latestStart.data.session, kept: ended.data.kept,
          outcomeKind: recorded.ended, ...(recorded.interruption === undefined ? {} : { interruption: recorded.interruption }),
          ...(recorded.error === undefined ? {} : { error: recorded.error }), elapsedMs: recorded.elapsedMs,
          ...(recorded.checkpointReason === undefined ? {} : { checkpointReason: recorded.checkpointReason }),
          actual: recorded.session?.mode === 'continued' ? 'continue' : recorded.session?.mode,
          inFlight: [], lastText: null };
      }
    }
    let repairRound = priorGates.filter(gate => gate.next === 'repair').length;
    let attempt = priorStarts.length;
    let guidancePending = resume?.guidance;
    const priorRepair = [...priorGates].reverse().find(gate => gate.next === 'repair');
    if (priorRepair !== undefined) failedGate = await this.diagnosticsOf(run, priorRepair);
    if (priorGates.length > 0) firstCause = { gate: priorGates[0]!.id, cause: priorGates[0]!.cause };

    // Closing the iteration closes the work of a session still kept for it.
    const close = async (outcome: IterationResult['outcome'], extra: Partial<IterationResult> = {}): Promise<ClosedIterationOutcome> => {
      const result = await this.handling.closeIteration(run, item, number, assignment, {
        outcome, invocations, findings, gate: null, commit: null, ...extra,
      });
      await this.finishSession(run, session, 'work-closed');
      return { kind: 'closed', result };
    };

    // A crash after the gate's immutable success and before its iteration
    // result reuses that exact gate. No second engineer or audit runs.
    const passed = [...priorGates].reverse().find(gate => gate.verdict === 'passed' && gate.audited !== null);
    if (passed !== undefined) {
      if (await this.candidates.commitTree(this.projectRoot, passed.audited!) !== (await this.previewCandidateTree()).tree) throw new CandidateDriftError('Original engineer gate candidate changed before handback');
      const closed = await this.handling.closeIteration(run, item, number, assignment, {
        outcome: 'accepted', invocations, findings: [], gate: passed.id, commit: passed.audited,
      });
      if (closed.commit !== null) await this.handling.requestReviews(run, { workItem: assignment.coordination?.kind === 'capability-task'
        ? assignment.coordination.id : item.id, iteration: assignment.id, gate: passed.id, commit: closed.commit });
      await this.finishSession(run, session, 'work-closed');
      if (!await this.dischargeEvidence(run, item, assignment, passed.id, closed)) return null;
      return { kind: 'closed', result: closed };
    }

    for (;;) {
      if (this.ignoring(run)) return null;

      // A session the implementation can no longer read is reconstructed from
      // records rather than continued, and the counters are kept.
      let start: SessionStart = { mode: 'fresh' };
      let degraded: InvocationRequest<EngineerSubmission>['degraded'];
      if (sessionRef !== undefined) {
        const note = `Continuing iteration ${assignment.id}.`;
        const appended = await (await this.operations(agent)).append(sessionRef, `${assignment.id}:${attempt}`, note);
        if (appended.outcome !== 'appended' && appended.outcome !== 'already-present') {
          if (appended.outcome === 'conflict') throw new Error(`The module engineer session did not take its note: ${appended.reason}`);
          await this.finishSession(run, session, 'lost');
          degraded = { requested: 'continued', reason: 'The retained engineer session is unavailable; using the ordinary task brief' };
          replacing = undefined;
          sessionRef = undefined;
          session = undefined;
        } else {
          start = { mode: 'continue', ref: appended.ref };
          if (appended.outcome === 'appended' && session !== undefined) {
            const kept = session;
            await recordAppend(this.transcriptOf(run, kept), { kind: 'note-appended', text: note }, null)
              .catch(error => this.warn(`Run ${run.record.jobId}: the note continuing ${kept} is missing from its transcript: ${message(error)}`));
          }
        }
      }

      attempt += 1;
      const beforeTree = assignment.coordination?.kind === 'capability-task'
        ? (await this.previewCandidateTree()).tree : undefined;
      const before = await takeLineSnapshot(this.projectRoot, this.coordination(run).accepted(), this.git);
      // A capability-task iteration is told only the obligations its
      // assignment names; a work item's iteration also sees its scenarios.
      const briefedScenarios = assignment.coordination?.kind === 'capability-task'
        ? undefined : await this.coordination(run).engineerScenarios(item);
      const assignedObligations = this.coordination(run).assignedObligations(assignment.obligations ?? []);
      // The assignment package reaches a session once: a continued session
      // holds it from its first prompt.
      let assignmentPackage: string | undefined;
      try {
        if (assignment.source !== undefined) assignmentPackage = await this.coordination(run).packageText(assignment.source, assignment.workItem);
      } catch (error) {
        await this.fail(run, 'inputs-changed', `The assignment package of ${assignment.id} cannot be delivered: ${message(error)}`);
        return null;
      }
      const featurePaths = assignedFeaturePaths(assignment, trackedScenarios(run.log.ledger.replay()).records);
      const focused = await prepareAssignedCucumber({ projectRoot: this.projectRoot, scratchDirectory: join(workingDirectory, 'tmp', 'ramify-focused', assignment.id),
        featurePaths, checks: run.record.auditConfiguration && 'config' in run.record.auditConfiguration ? run.record.auditConfiguration.config.checks : [],
        runner: this.options.commandExecution ?? runCommand });
      const invocationViews = replay === undefined ? await this.iterationViews(run, assignment) : [];

      // The invocation is built from its inputs by the module engineer step's own
      // constructor, which `step render` uses too; the inputs are validated
      // here and written beside the invocation before it starts.
      let step: ConstructedEngineerStep;
      try {
        step = constructEngineerStep(await this.engineerStepInputs(run, {
          item, assignment, attempt, workingDirectory, bounds, beforeTree, views: invocationViews, scenarios: briefedScenarios,
          obligations: assignedObligations, assignmentPackage, featurePaths, focused, failedGate,
          handoff: handoff === undefined ? undefined : { ...handoff, returns: this.budgetReturns(run, assignment.id) },
          guidance: guidancePending,
          start: start.mode === 'continue'
            ? { kind: resume === undefined ? 'repair-continuation' : 'resumed-after-handback', session: session ?? '', point: start.ref }
            : { kind: 'fresh', ...(degraded === undefined || degraded.requested !== 'continued' ? {} : { degraded: { requested: 'continued', reason: degraded.reason } }) },
        }), { projectRoot: this.projectRoot, packages });
      } catch (error) {
        await this.fail(run, 'internal', `The module engineer of ${assignment.id} cannot be constructed from its inputs: ${message(error)}`);
        return null;
      }
      const guarded = await protectedScopeOf(this.projectRoot, assignment.scope, step.equipment.protectedFiles, this.options.ramify, this.ownershipAuthority(run, assignment));
      const tools = this.coordination(run).implementationTools({
        workingDirectory: step.equipment.workingDirectory,
        scopeRevision: step.equipment.scopeRevision,
        guarded,
        commandTimeoutMs: step.equipment.commandTimeoutMs,
        submissions: step.equipment.submissions,
        focusedCommands: step.equipment.focusedCommands,
      });

      const result = replay ?? await this.runInvocation<EngineerSubmission>(run, agent, {
        role: step.role,
        ...(resourceRestartPredecessor === undefined ? {} : { recoveryPredecessor: resourceRestartPredecessor }),
        originalInvocation: run.restoring && latestStart && !run.log.all('invocation-ended').some(event => event.data.invocation === latestStart.data.invocation) ? latestStart.data.invocation : undefined,
        task: step.task,
        brief: step.brief,
        context: step.context,
        stepInputs: step.before.inputs, consultationPackages: packages,
        workingDirectory: step.equipment.workingDirectory,
        work: step.work,
        attempt: step.attempt,
        loaded: step.loaded,
        systemPrompt: step.systemPrompt,
        prompt: step.prompt,
        start: step.start.mode === 'continue' ? { mode: 'continue', ref: step.start.ref } : { mode: 'fresh' },
        session,
        // The module engineer is kept only after a proposed completion, and
        // continued only for the repair its failing gate asks for. The
        // harness point is its previous invocation's end: the note appended
        // before it is the executor's, and no other session starts from it.
        continuing: step.start.mode === 'continue' ? step.start.continuing : resume === undefined ? 'repair' : 'capability-returned',
        ...(replacing === undefined ? {} : { replaces: { session: replacing, reason: 'reconstructed' } }),
        ...(degraded === undefined ? {} : { degraded }),
        // A proposed completion is kept for the repair its gate may ask for.
        // Resource returns retain the assignment through recovery regardless of count.
        keep: (ended, value) => {
          if (ended === 'context-budget-reached') {
            return finished('not-kept');
          }
          if (ended !== 'submitted' || value === undefined) return finished('not-kept');
          return value.kind === 'completion-proposed' || (value.kind === 'capability-needed' && this.workflow !== null)
            ? kept : finished('work-closed');
        },
        toolName: step.submission.toolName,
        description: step.submission.description,
        inputSchema: step.submission.inputSchema,
        submissionSchema: step.submission.submissionSchema,
        // A claimed completion is checked afresh over the write scope
        // before it is judged, because the hook checks saw only the
        // mutations they covered.
        beforeSubmission: async (input, signal) => { await tools.findingsAtCompletion(input, signal); },
        validate: async input => {
          const validated = await validateEngineerWithOwnership(input, {
            capabilityWorkflow: step.validator.capabilityWorkflow,
            obligation: step.validator.obligation,
            kind: step.validator.kind,
            openFindings: tools.openFindings(),
            submissions: tools.submissions,
            assigned: step.validator.assigned,
            seams: {
              index: run.index,
              consumer: step.validator.consumer,
              providerOf: capability => committedRecords(run.log.ledger.replay()).registry.find(entry => entry.capability === capability)?.owner,
            },
          }, paths => this.options.ramify.queryOwnershipAnswer(this.projectRoot, paths),
          () => new Map(committedRecords(run.log.ledger.replay()).registry.map(entry => [entry.capability, entry])));
          // A capability-needed submission captures a provisional candidate
          // immediately after this invocation. Refuse unsafe scratch here so
          // the same engineer session can repair it before a tree is read.
          if (validated.ok && validated.value.kind === 'capability-needed') {
            const safety = await scratchSafetyRule(this.projectRoot, await declaredModuleDirectories(this.projectRoot), this.git);
            if (safety.outcome === 'failed') return { ok: false, errors: safety.violations.map(violation => ({
              path: 'scratch', message: `${violation.path}: ${violation.detail}`,
            })) };
          }
          return validated;
        },
        acceptedText: value => {
          const check = tools.completionCheck();
          return iterationAcceptance(value.kind, check?.kind === 'not-checked' ? check.reason : null);
        },
        scope: {
          write: assignment.scope.revision,
          measurement: run.record.baseline && 'measurement' in run.record.baseline ? run.record.baseline.measurement : null,
          size: null,
        },
        measured: { snapshot: baseline, scope: measurementScope, readScope: readScopeMeasurement(assignment.scope) },
        writer: true,
        ...(beforeTree === undefined ? {} : { candidateBefore: beforeTree }),
        guarded,
        readModules: assignment.scope.read,
        equip: tools.equip, previewEquipment: tools.preview,
        bounds: step.bounds,
      });
      const replayed = replay !== undefined;
      replay = undefined;
      resourceRestartPredecessor = undefined;
      if (!replayed && !invocations.includes(result.id)) invocations.push(result.id);
      guidancePending = undefined;
      sessionRef = result.kept && result.ref !== '' ? result.ref : undefined;
      session = sessionRef === undefined ? undefined : result.session;
      replacing = undefined;

      // The line events of this writer: its net change, from the two
      // snapshots around it. A change made and put back between them,
      // through any tool, delivered nothing and is rightly not counted.
      const after = await takeLineSnapshot(this.projectRoot, this.coordination(run).accepted(), this.git);
      const savedLines = replayed ? await readIfExists(run.path(runLayout.lineEvents(result.id))) : undefined;
      const parsedLines = savedLines === undefined ? null : lineEventSummarySchema.safeParse(JSON.parse(savedLines.toString('utf8')));
      const lines = parsedLines?.success ? parsedLines.data : replayed ? null
        : await this.coordination(run).recordLineEvents(result.id, before, after);
      if (this.ignoring(run)) return null;

      if (result.ended === 'checkpoint-pending' && !run.writer.isUnsettled) {
        findings.push(`Architect handoff after compaction: ${result.checkpointReason ?? 'Reconsider the unfinished assignment.'}`,
          `No engineer submission was accepted. Retained context: ${run.path(runLayout.transcript(result.session))}`);
        return close('partial');
      }

      // An unfinished engineer returns its retained work to its architect.
      // Unknown writer settlement must still be resolved before another writer starts.
      if (result.ended !== 'submitted' || result.value === undefined) {
        if (run.writer.isUnsettled) {
          await this.fail(
            run,
            result.ended === 'invalid-submission' ? 'invalid-submission' : result.ended === 'failed' ? 'agent-failed' : 'internal',
            `The module engineer of ${assignment.id} ended without a result (${result.ended})`,
            [runLayout.outcome(result.id)],
          );
          return null;
        }
        findings.push(`${failedWithoutResult('engineer', assignment.id, result)}; nothing of it was committed, and what it wrote stays uncommitted in the tree`);
        const failure = await this.failureOf(run, agent, packages, {
          item, assignment, number, role: 'engineer', result, bounds, lines, after, shellLog: tools.shellLog(),
        });
        if (failure === null) return null;
        return close('partial', { failure });
      }

      if (result.value.kind === 'partial') {
        findings.push(...result.value.done.map(entry => `done: ${entry}`), ...result.value.findings, ...result.value.unfinished.map(entry => `unfinished: ${entry}`));
        return close('partial');
      }
      if (result.value.kind === 'unsuitable') {
        findings.push(`unsuitable (${result.value.reason}): ${result.value.detail}`);
        // The provider cannot meet the agreement as it stands. The harness
        // derives the obligation from the assignment, the writer has settled
        // with the invocation, the iteration closes here, and the report
        // reaches the consumer's architect. Nothing of the agreement changes.
        if (result.value.reason === 'provider-cannot-conform') {
          const closed = await close('unsuitable');
          const reported = await this.coordination(run).reportRevisionNeeded(item, assignment, result.value.detail);
          return reported === null ? null : { ...closed, reportedRevision: true };
        }
        return close('unsuitable');
      }

      // The behavior this iteration needs is owned elsewhere. Its turn ends
      // here: no nested live session is started, the iteration closes with
      // what it did, and the harness answers with a contract iteration of
      // its own whose outcome is in the records.
      if (result.value.kind === 'contract-needed') {
        const need = result.value.need;
        findings.push(`the behavior needed for "${need.capability}" is owned outside this scope: ${result.value.summary}`);
        const closed = await close('partial');
        return {
          kind: 'closed',
          result: closed.result,
          need: {
            need,
            ...(result.value.suggestedProvider === undefined ? {} : { suggestedProvider: result.value.suggestedProvider }),
            ...(result.value.injectionSites === undefined ? {} : { injectionSites: result.value.injectionSites }),
            invocation: result.id,
          },
        };
      }

      if (result.value.kind === 'capability-needed') {
        if (this.workflow === null || run.writer.isUnsettled) {
          await this.fail(run, 'internal', 'The requesting module engineer could not be retained after its writer settled');
          return null;
        }
        return { kind: 'capability-needed', summary: result.value.summary, need: result.value.request,
          invocation: result.id, session: result.session, point: result.ref };
      }

      const proposal = result.value;
      // The proposal's bindings apply at its acceptance, before the gate:
      // that gate's commit drops a bound scenario's pending tag, and the gate
      // selects it by identity. No gate outcome undoes a binding.
      if (!await this.handling.recordBindings(run, result.id, proposal.bindings)) return null;
      let infrastructureAttempt = 0;
      for (;;) {
        const gate = await this.gates.iterationGate(run, item, assignment, result.id, repairRound, infrastructureAttempt, proposal.summary);
        if (gate === null) return null;
        firstCause ??= { gate: gate.id, cause: gate.cause };

        if (gate.verdict === 'passed') {
          findings.push(...proposal.findings);
          const closed = await this.handling.closeIteration(run, item, number, assignment, {
            outcome: 'accepted',
            invocations,
            findings,
            gate: gate.id,
            commit: gate.audited,
            ...(proposal.recommendation === undefined ? {} : { recommendation: proposal.recommendation }),
          });
          // The candidate's reviews are requested before the driver passes
          // it; they run beside the next iteration's writer.
          if (closed.commit !== null) await this.handling.requestReviews(run, { workItem: assignment.coordination?.kind === 'capability-task'
            ? assignment.coordination.id : item.id, iteration: assignment.id, gate: gate.id, commit: closed.commit });
          await this.finishSession(run, session, 'work-closed');
          // The evidence this acceptance discharges: a provider that ran the
          // agreed suite against the real implementation has conformed, and a
          // verification that replaced every fake injection closes its
          // requirement.
          if (!await this.dischargeEvidence(run, item, assignment, gate.id, closed)) return null;
          return { kind: 'closed', result: closed };
        }

        if (gate.next === 'retry-infrastructure') {
          infrastructureAttempt += 1;
          continue;
        }
        if (gate.next === 'exhausted') {
          findings.push(...proposal.findings);
          findings.push(`the gate did not pass; the first cause was ${firstCause.cause ?? 'unknown'} at gate ${firstCause.gate}`);
          return close('exhausted');
        }
        if (gate.next === 'return-to-local-architect') {
          findings.push(...proposal.findings);
          findings.push(`the gate returned to the module architect: ${gate.cause ?? 'unknown'} at gate ${gate.id}`);
          // The architect can only record a revision for a change it can
          // name, so the guarded paths the attempt found go with the cause.
          for (const change of gate.guardedChanges) {
            if (change.authorizedBy !== null) continue;
            findings.push(`no record authorizes the change to the guarded file "${change.path}"${change.after === null ? ', which this iteration deleted' : ''}`);
          }
          // What failed and what it reported travel with the outcome: a
          // cause alone was read as a write outside the assignment, the
          // architect narrowed the file list, and the same failure returned.
          const returnedGate = await this.diagnosticsOf(run, gate, 'local-architect');
          return { ...await close(gate.cause === 'check-failed' ? 'partial' : 'unsuitable'), returnedGate };
        }
        // One repair round: the rerun runs the gate's complete required set.
        repairRound += 1;
        failedGate = await this.diagnosticsOf(run, gate);
        break;
      }
    }
  }

  /**
   * The contract gate: the project's committed audit of the candidate,
   * whose configured checks run the consumer's tests and the agreement's
   * conformance suite among the project's own, and the fake-naming rule the
   * harness verifies itself over the files this iteration wrote.
   */
  private async contractGate(
    run: Run,
    item: WorkItem,
    assignment: IterationAssignment,
    invocation: string,
    submission: EstablishedContract,
    repairRound: number,
  ): Promise<GateAttempt | null> {
    run.writer.requireSettled(`The ${assignment.id} gate cannot run`);
    if (run.restoring) {
      const original = run.log.all('gate-attempted').flatMap(event => { const parsed = gateAttemptSchema.safeParse(this.committedBody(run, runLayout.gate(event.data.gate))); return parsed.success && parsed.data.subject.iteration === assignment.id && parsed.data.proposedBy === invocation && parsed.data.checkpoint === 'contract' ? [parsed.data] : []; });
      if (original.length > 1) throw new Error('Ambiguous original contract gate');
      if (original[0]) {
        if (original[0].verdict === 'passed' && (original[0].audited === null || await this.candidates.commitTree(this.projectRoot, original[0].audited) !== (await this.previewCandidateTree()).tree)) throw new CandidateDriftError('Original contract gate candidate changed before registration');
        return original[0];
      }
    }
    const gateId = gateAttemptId(this.gates.gateCount(run) + 1);
    const index = await this.refreshIndex(run);

    const writeScope = writeScopePaths(this.projectRoot, assignment);
    // The agreement's own fakes are this gate's to answer; another
    // agreement's fake is judged too, attributed by the write scope. A
    // revision replaces the fakes of the revision in force.
    const declared: StandIn[] = submission.artifacts.fake.flatMap(entry => entry.standsFor.map(standsFor => ({
      contract: 'the agreement under this gate', fakePath: entry.path, standsFor, declaredHere: true,
    })));
    const parity = await this.gates.fakeExposureParityRule(index, [
      ...declared,
      ...this.gates.registeredStandIns(run, assignment.revisesContract?.id)
        .filter(standIn => !declared.some(own => own.fakePath === standIn.fakePath && own.standsFor.fake === standIn.standsFor.fake)),
    ], writeScope);
    const rules = [await this.coordination(run).fakeNamingRule(submission), ...(parity === null ? [] : [parity])];
    const modules = await this.gates.pendingModules(run, assignment.id);
    const attempt = await this.gates.committingCheckpoint(run, {
      id: gateId,
      runId: run.record.jobId,
      checkpoint: 'contract',
      projectRoot: this.projectRoot,
      directory: run.path(runLayout.gateOutput(gateId)),
      head: await this.git.currentHead(this.projectRoot),
      policy: run.policy,
      proposedBy: invocation,
      repairRound,
      infrastructureAttempt: 0,
      subject: { workItem: item.id, iteration: assignment.id },
      guarded: this.gates.guardedAtGate(run, assignment.guarded),
      authorizations: assignment.authorizations.map(entry => ({ path: entry.path, by: entry.by })),
      rules,
    }, submission.summary, modules, assignment.goal);

    if (attempt.verdict !== 'passed') {
      return this.ignoring(run) ? null : attempt;
    }
    await this.afterWrite('gate-committed', run.record.jobId);
    if (this.ignoring(run)) return null;
    return attempt;
  }

  /**
   * What one accepted iteration discharges. A provider that ran the agreed
   * conformance suite against the real implementation has conformed; a
   * verification that replaced every fake injection closes its requirement.
   * Neither is the gate's verdict alone: `requirement-verified` also requires
   * that no named location still reaches the fake.
   */
  private async dischargeEvidence(
    run: Run,
    item: WorkItem,
    assignment: IterationAssignment,
    gate: string,
    result: IterationResult,
  ): Promise<boolean> {
    void result;
    const records = committedRecords(run.log.ledger.replay());
    const conformed = new Set(run.log.all('provider-conformed').map(event => conformanceKey(event.data.obligation, event.data.revision)));

    for (const evidence of assignment.evidenceObligations) {
      if (evidence.obligation === undefined || evidence.against !== 'real') continue;
      if (conformed.has(conformanceKey(evidence.obligation.id, evidence.obligation.revision))) continue;
      await this.write(run, {
        type: 'provider-conformed',
        data: { obligation: evidence.obligation.id, revision: evidence.obligation.revision, workItem: item.id, iteration: assignment.id, gate },
      });
      await this.afterWrite('provider-conformed', run.record.jobId);
      if (this.ignoring(run)) return false;
    }

    const verified = this.coordination(run).verifiedRequirements();
    for (const evidence of assignment.evidenceObligations) {
      if (evidence.requirement === undefined) continue;
      if (verified.has(verificationKey(evidence.requirement.id, evidence.requirement.revision))) continue;
      const requirement = records.requirements.get(evidence.requirement.id);
      if (requirement === undefined) continue;
      const contract = [...records.contracts.values()].find(candidate => obligationId(candidate.id) === requirement.obligation);
      if (contract === undefined) continue;
      const sites: Array<{ path: string; text: string }> = [];
      for (const path of requirement.evidence.fakeInjections) {
        const text = await readFile(join(this.projectRoot, path), 'utf8').catch(() => null);
        if (text !== null) sites.push({ path, text });
      }
      const remaining = remainingInjections(contract, sites);
      if (remaining.length > 0) {
        // The gate passed, and the delegation is not closed: passing against
        // a fake is never completion. The architect is told at its next turn.
        this.warn(`Run ${run.record.jobId}: ${requirement.id} is not verified; the fake is still reached at ${remaining.map(entry => `${entry.path} (${entry.reference})`).join(', ')}`);
        continue;
      }
      await this.write(run, {
        type: 'requirement-verified',
        data: { requirement: requirement.id, revision: requirement.revision, workItem: requirement.workItem, iteration: assignment.id, gate },
      });
      await this.afterWrite('requirement-verified', run.record.jobId);
      if (this.ignoring(run)) return false;
    }
    return true;
  }

  /**
   * Closes an accepted correction iteration with the repair claim of each
   * CheckFinding still planned under the reconciliation intent it resolves,
   * on the same line: the claim names the audited tree and the iteration,
   * and each CheckFinding stays open until its verification rule is met.
   * A claim the transition refuses leaves the iteration closed without it.
   */
  private async closeCorrection(
    run: Run,
    workItem: string,
    closing: {
      readonly data: Omit<RunEventOf<'iteration-closed'>['data'], 'checkFindings'>;
      readonly record: CommitRecord;
      readonly corrects: string;
      readonly gate: string;
      readonly commit: string;
      readonly invocation: string | null;
    },
  ): Promise<void> {
    let tree: string | undefined;
    try {
      tree = await this.candidates.commitTree(this.projectRoot, closing.commit);
    } catch (error) {
      this.warn(`Run ${run.record.jobId}: the tree of ${closing.commit} could not be read, so ${closing.data.iteration} claims no repair: ${message(error)}`);
    }
    if (tree !== undefined) {
      const candidate = { kind: 'tree' as const, id: tree };
      const committed = await this.commitCheckFindings(run, ({ state }) => ({
        commands: [...state.findings.values()]
          .filter(entry => entry.standing === 'open' && entry.reason === 'repair-planned' && entry.pendingUserDecision === null
            && entry.repair?.kind === 'intent' && entry.repair.ref === closing.corrects && sameWorkItem(entry.owner, workItem))
          .map(entry => ({
            type: 'dispose' as const,
            checkFinding: entry.id,
            expectedRevision: entry.revision,
            decision: {
              actor: { kind: 'agent' as const, role: 'engineer', invocation: closing.invocation ?? 'none' },
              source: candidate,
              rationale: `The correction ${closing.data.iteration} of ${closing.corrects} closed accepted at gate ${closing.gate}, on the audited commit ${closing.commit}`,
              evidence: [{ kind: 'gate-attempt', ref: runLayout.gate(closing.gate), hash: null }],
              communication: { mode: 'quiet' as const },
              decision: { action: 'claim-repair' as const, candidate, change: closing.data.iteration },
            },
          })),
        compose: decided => ({
          event: { type: 'iteration-closed', data: { ...closing.data, ...(decided.events.length === 0 ? {} : { checkFindings: [...decided.events] }) } },
          records: [closing.record],
        }),
      }));
      if (committed.kind !== 'refused' || committed.refusal.reason === 'run-ended') return;
      this.warn(`Run ${run.record.jobId}: the repair claims of ${closing.data.iteration} were refused, so it closes without them: ${committed.refusal.message}`);
    }
    await this.write(run, { type: 'iteration-closed', data: closing.data }, [closing.record]);
  }

  /**
   * The inputs of one engineer invocation, collected from the run's records
   * and the project as they stand: everything the module engineer step is built
   * from, with every path project-relative.
   */
  private async engineerStepInputs(run: Run, collected: {
    readonly item: WorkItem;
    readonly assignment: IterationAssignment;
    readonly attempt: number;
    readonly workingDirectory: string;
    readonly bounds: EngineerBounds;
    readonly beforeTree: string | undefined;
    readonly views: readonly IterationApiViews[];
    readonly scenarios: EngineerScenarios | undefined;
    readonly obligations: readonly AssignedObligation[];
    readonly assignmentPackage: string | undefined;
    readonly featurePaths: readonly string[];
    readonly focused: Awaited<ReturnType<typeof prepareAssignedCucumber>>;
    readonly failedGate: { readonly id: string; readonly cause: string | null; readonly summary: readonly string[] } | undefined;
    readonly handoff: { readonly done: readonly string[]; readonly unfinished: readonly string[]; readonly returns: number } | undefined;
    readonly guidance: string | undefined;
    readonly start: EngineerStepInputs['start'];
  }): Promise<EngineerStepInputs> {
    const { assignment } = collected;
    const record = committedRecords(run.log.ledger.replay()).assignments.get(assignment.id);
    const known = await this.coordination(run).knownProjectFacts('module' in assignment.scope.base ? [assignment.scope.base.module] : assignment.scope.base.modules);
    const records = committedRecords(run.log.ledger.replay());
    const priorResult = [...records.results.values()].filter(result => {
      if (result.iteration === assignment.id) return false;
      const prior = records.assignments.get(result.iteration);
      return prior !== undefined && (assignment.coordination?.kind === 'capability-task'
        ? prior.coordination?.kind === 'capability-task' && prior.coordination.id === assignment.coordination.id
        : prior.coordination?.kind !== 'capability-task' && prior.workItem === assignment.workItem);
    }).at(-1);
    const priorPartials = priorResult?.outcome === 'partial' ? [priorResult] : [];
    const retainedWork = priorPartials.length === 0 ? undefined : [
      '## Retained partial work', '',
      'Earlier reports retain their original assignment basis. Inspect the retained candidate edits and these source/test pointers; the current assignment and acceptance determine what remains authorized.',
      ...priorPartials.flatMap(result => {
        const prior = records.assignments.get(result.iteration)!;
        const owner = prior.coordination?.kind === 'capability-task' ? prior.coordination.id : prior.workItem;
        const sequence = prior.coordination?.kind === 'capability-task' ? prior.coordination.sequence
          : Number.parseInt(prior.id.slice(prior.id.lastIndexOf('.i') + 2), 10);
        return [
          `- Earlier assignment: ${result.iteration}; engineer invocations: ${result.invocations.join(', ')}.`,
          `- Durable assignment: ${run.path(iterationLayout.assignment(owner, sequence))}; result: ${run.path(iterationLayout.result(owner, sequence))}.`,
          ...result.invocations.filter(invocation => records.outcomes.get(invocation)?.submission != null)
            .map(invocation => `- Durable engineer report: ${run.path(runLayout.submission(invocation))}.`),
          ...result.findings.map(finding => `- ${finding}`),
          ...(result.startingPoints ?? []).map(point => `- Source/test pointer: ${JSON.stringify(point)}.`),
        ];
      }),
    ].join('\n');
    return engineerStepInputsOf({
      ...collected,
      guidance: [collected.guidance, retainedWork].filter(text => text !== undefined).join('\n\n') || undefined,
      consultation: engineerConsultationInputs(run.log.events, { planId: run.record.planId, runId: run.record.jobId }, assignment.id),
      run: { planId: run.record.planId, runId: run.record.jobId },
      base: this.coordination(run).accepted(),
      capabilityWorkflow: this.workflow !== null,
      capabilityPolicy: supportedCapabilityPolicy(run.policy.version),
      workingDirectory: this.coordination(run).projectRelative(collected.workingDirectory),
      testAreas: await this.coordination(run).ownedTestAreas(assignment.gate.tests),
      startingPoints: record === undefined ? null : this.coordination(run).assignmentStartingPoints(record),
      known,
      protectedFiles: await this.coordination(run).protectedFiles(assignment),
      limits: run.policy.limits,
      context: contextPolicyOf(run.policy, 'engineer'),
    });
  }

  /**
   * What a module engineer that ended without a result leaves its module architect,
   * ready before the architect is briefed: the harness's digest, then the
   * failure analysis. Neither ends the run: what cannot be read is a gap in
   * the digest, and an analysis that fails is unavailable. Null only for a
   * run that is ending.
   */
  private async failureOf(
    run: Run,
    agent: AgentPort,
    packages: ReadonlyMap<string, LoadedPackage>,
    subject: {
      readonly item: WorkItem;
      readonly assignment: IterationAssignment;
      readonly number: number;
      readonly role: Role;
      readonly result: InvocationResult<unknown>;
      readonly bounds: EngineerBounds;
      readonly lines: LineEventSummary | null;
      readonly after: LineSnapshot;
      readonly shellLog: readonly ShellCallRecord[];
    },
  ): Promise<NonNullable<IterationResult['failure']> | null> {
    const digest = await this.failureDigestOf(run, subject);
    const analysis = await this.analyzeFailure(run, agent, packages, subject, digest);
    if (this.ignoring(run)) return null;
    return { digest, analysis };
  }

  /** The digest of one failed invocation, from what the harness already holds. */
  private async failureDigestOf(
    run: Run,
    subject: {
      readonly role: Role;
      readonly result: InvocationResult<unknown>;
      readonly bounds: EngineerBounds;
      readonly lines: LineEventSummary | null;
      readonly after: LineSnapshot;
      readonly shellLog: readonly ShellCallRecord[];
    },
  ): Promise<FailureDigest> {
    const { result } = subject;
    const rejections = await ObservationLog.open(run.path(runLayout.observations(result.id)))
      .then(log => log.observations.flatMap(observation => (observation.type === 'rejection' ? [observation.data] : [])))
      .catch(() => []);
    const shellCalls: DigestShellCall[] = subject.shellLog.map(call => ({
      callId: call.callId,
      command: call.command,
      timeoutMs: call.timeoutMs,
      output: relative(run.directory, call.outputFile).split('\\').join('/'),
    }));
    // The complete output of each shell call in flight, which its tail is read from.
    const outputs = new Map<string, string>();
    for (const call of result.inFlight ?? []) {
      const shell = subject.shellLog.find(entry => entry.callId === call.callId);
      if (shell === undefined) continue;
      const text = await readFile(shell.outputFile, 'utf8').catch(() => undefined);
      if (text !== undefined) outputs.set(call.callId, text);
    }
    return failureDigest({
      invocation: result.id,
      role: subject.role,
      ended: result.ended,
      interruption: result.interruption,
      error: result.error,
      elapsedMs: result.elapsedMs ?? 0,
      bounds: subject.bounds,
      rejections,
      inFlight: result.inFlight ?? [],
      shellCalls,
      outputs,
      lines: subject.lines,
      uncommitted: subject.after.available ? subject.after.changes.length : null,
      lastMessage: result.lastText ?? null,
      transcript: runLayout.transcript(result.session),
    });
  }

  /**
   * The failure analysis: a model's account of one failed invocation, in a
   * reader session of its own, before the module architect is briefed. It
   * reads the evidence the harness writes into its working directory and
   * submits once. Whatever happens to it, it never fails the run: a missing
   * package, a refused start, a failed or invalid session and any error of
   * its own are an unavailable analysis with the reason.
   */
  private async analyzeFailure(
    run: Run,
    agent: AgentPort,
    packages: ReadonlyMap<string, LoadedPackage>,
    subject: { readonly item: WorkItem; readonly assignment: IterationAssignment; readonly number: number; readonly result: InvocationResult<unknown> },
    digest: FailureDigest,
  ): Promise<FailureAnalysis> {
    const unavailable = (reason: string, invocation: string | null = null): FailureAnalysis => ({ outcome: 'unavailable', invocation, reason });
    const loaded = packages.get('failure-analyst');
    if (loaded === undefined) return unavailable('no prompt package is loaded for the failure analyst');
    if (run.policy.context['failure-analyst'] === undefined) return unavailable(`the run's policy (${run.policy.version}) has no context policy for the failure analyst`);
    if (this.ignoring(run)) return unavailable('the run is ending');
    try {
      const recordOwner = subject.assignment.coordination?.kind === 'capability-task'
        ? subject.assignment.coordination.id : subject.item.id;
      const workspace = run.path(join(dirname(iterationLayout.result(recordOwner, subject.number)), 'failure-evidence'));
      const evidence = await this.failureEvidence(run, workspace, subject.result, digest);
      const attempt = run.log.all('invocation-started')
        .filter(event => event.data.role === 'failure-analyst' && event.data.work.iteration === subject.assignment.id).length + 1;
      const result = await this.runInvocation<FailureAnalysisSubmission>(run, agent, {
        role: 'failure-analyst',
        work: { workItem: subject.item.id, iteration: subject.assignment.id },
        attempt,
        loaded,
        systemPrompt: renderFailureAnalystPrompt(loaded, workspace),
        prompt: failureAnalysisMessage({
          iteration: subject.assignment.id,
          goal: subject.assignment.goal,
          projectRoot: this.projectRoot,
          runDirectory: run.directory,
          digest,
          evidence,
        }),
        start: { mode: 'fresh' },
        toolName: failureAnalysisToolName,
        description: failureAnalysisSubmissionDescription,
        inputSchema: failureAnalysisJsonSchema,
        submissionSchema: 'ramify-agent.failure-analysis-submission/1',
        validate: input => validateFailureAnalysis(input),
        keep: () => finished('work-closed'),
        scope: { write: null, measurement: null, size: null },
        reader: true,
        workingDirectory: workspace,
        absoluteMs: failureAnalysisMs,
        equip: () => ({ builtinTools: ['read', 'grep', 'ls'], tools: [] }),
      });
      if (result.id === '') return unavailable('the run\'s bounds refused its invocation');
      if (result.ended === 'submitted' && result.value !== undefined) {
        return { outcome: 'analyzed', invocation: result.id, ...result.value, evidence: [...result.value.evidence] };
      }
      const why = [result.interruption, result.error].filter(part => part !== undefined && part !== '').join(': ');
      return unavailable(`the analysis ended \`${result.ended}\`${why === '' ? '' : ` (${why})`}`, result.id);
    } catch (error) {
      this.warn(`Run ${run.record.jobId}: the failure analysis of ${subject.assignment.id} could not be run: ${message(error)}`);
      return unavailable(`it could not be run: ${message(error)}`);
    }
  }

  /**
   * The analyst's working directory: the digest, the failed invocation's
   * transcript as text, the complete outputs of its shell calls and the
   * patch of the uncommitted work. What cannot be written is named instead.
   */
  private async failureEvidence(run: Run, workspace: string, result: InvocationResult<unknown>, digest: FailureDigest): Promise<FailureEvidence> {
    const files: Array<{ path: string; holds: string }> = [];
    const missing: string[] = [];
    await mkdir(join(workspace, 'outputs'), { recursive: true });
    await writeFileAtomic(join(workspace, 'digest.md'), `${digestLines(digest, run.directory).join('\n')}\n`);
    files.push({ path: 'digest.md', holds: 'the digest above' });
    try {
      await this.transcriptOf(run, result.session).drain();
      const read = await readTranscript(run.path(runLayout.transcript(result.session)));
      const text = await renderTranscript(read.entries, result.id, body => readBody(run.directory, run.store, body));
      await writeFileAtomic(join(workspace, 'transcript.md'), text === '' ? '(the transcript holds no entry of this invocation)\n' : `${text}\n`);
      files.push({ path: 'transcript.md', holds: `the invocation's transcript, numbered as \`${digest.transcript}\` numbers it; a long one keeps its start and its end` });
    } catch (error) {
      missing.push(`the transcript, which could not be read: ${message(error)}`);
    }
    for (const output of digest.outputs) {
      const name = `outputs/${output.split('/').slice(-3).join('-')}`;
      try {
        const text = await readFile(run.path(output), 'utf8');
        await writeFileAtomic(join(workspace, name), text.length <= failureOutputCharacters ? text : `… ${text.length - failureOutputCharacters} characters of its start are left out …\n${text.slice(-failureOutputCharacters)}`);
        files.push({ path: name, holds: `the complete output of \`${output}\`` });
      } catch (error) {
        missing.push(`the output \`${output}\`, which could not be read: ${message(error)}`);
      }
    }
    try {
      const patch = await this.git.worktreePatch(this.projectRoot, this.coordination(run).accepted());
      await writeFileAtomic(join(workspace, 'diff.patch'), patch);
      files.push({ path: 'diff.patch', holds: `the patch of the tracked files against the last accepted commit \`${this.coordination(run).accepted()}\`${patch === '' ? '; it is empty' : ''}` });
    } catch (error) {
      missing.push(`the patch of the uncommitted work, which Git could not give: ${message(error)}`);
    }
    return { directory: workspace, files, missing };
  }

  /** The API views of the modules one iteration writes, for the module engineer's briefing. */
  private async iterationViews(run: Run, assignment: IterationAssignment): Promise<IterationApiViews[]> {
    return iterationApiViews(this.options.ramify, this.projectRoot, run.index, assignment.scope.base, assignment.scope.extra);
  }

  /**
   * How many times this iteration has returned at its context budget,
   * counted over committed history: the counter is keyed by the work, so a
   * fresh session does not reset it and neither does a repair round.
   */
  private budgetReturns(run: Run, iteration: string): number {
    const records = committedRecords(run.log.ledger.replay());
    return run.log.all('invocation-ended')
      .filter(event => event.data.ended === 'context-budget-reached')
      .filter(event => records.invocations.get(event.data.invocation)?.work.iteration === iteration)
      .length;
  }

  private endInvocation(
    run: Run,
    id: string,
    session: SessionId,
    keeping: SessionKeeping,
    body: Omit<InvocationOutcome, 'schema' | 'invocation'>,
    degraded?: DegradeRelation,
    transcript?: InvocationTranscript,
  ): Promise<void> {
    return this.runner.endInvocation(run, id, session, keeping, body, degraded, transcript);
  }

  /**
   * Readiness, with its bounded recovery. A failure a preparation can repair
   * consumes one recovery and the next attempt runs; one it cannot consumes
   * none and ends the run at once with the step that failed.
   */
  private async reachReadiness(run: Run): Promise<boolean> {
    const controller = new AbortController();
    let markSettled!: () => void;
    const settled = new Promise<void>(resolve => { markSettled = resolve; });
    run.readiness = { controller, settled };
    try {
      return await this.reachReadinessOwned(run, controller.signal);
    } finally {
      markSettled();
      if (run.readiness?.controller === controller) run.readiness = undefined;
    }
  }

  private async reachReadinessOwned(run: Run, signal: AbortSignal): Promise<boolean> {
    if (run.log.find('readiness-passed')) return true;
    const bound = run.policy.limits.readinessRecoveries;
    let spent = 0;

    for (;;) {
      if (this.ignoring(run)) return false;
      run.writer.requireSettled('Readiness cannot run');

      const attemptNumber = run.log.count('readiness-passed') + run.log.count('readiness-failed') + 1;
      const gateId = gateAttemptId(this.gates.gateCount(run) + 1);
      // Readiness runs on the branch the project is on. Its last step
      // creates the run branch, once the repository is clean and the
      // baseline passed; a branch git refuses fails readiness there.
      let head = await this.git.currentHead(this.projectRoot);
      const auditConfiguration = run.record.auditConfiguration;
      if (run.log.all('external-candidate-observed').length > 0 && !await this.git.isCleanRepository(this.projectRoot)) {
        const current = await this.previewCandidateTree();
        if (run.log.all('external-candidate-observed').some(event => event.data.afterTree === current.tree)) {
          const id = `readiness-${current.tree}`;
          head = await commitReadinessRepair(run, this.gateHost(), this.gates, {
            schema: 'ramify-agent.readiness-repair-operation/1', id, head, tree: current.tree,
            message: `Retain observed readiness correction\n\nRamify-Run: ${run.jobId}\nRamify-Gate: ${id}\n`,
          });
        }
      }

      // A setup command without a receipt is rerun after its owner has settled.
      // The owner defines repeatability; an unfinished intent is no approval gate.
      await this.write(run, { type: 'gate-started', data: { gate: gateId, checkpoint: 'readiness' } });
      let result = await runReadiness(this.options.configuredAudit, {
        runId: run.record.jobId,
        attempt: attemptNumber,
        projectRoot: this.projectRoot,
        gateDirectory: run.path(runLayout.gateOutput(gateId)),
        gateId,
        policy: run.policy,
        projectConfig: run.record.projectConfig,
        auditConfiguration,
        index: run.index,
        ramify: this.options.ramify,
        git: this.git,
        head,
        signal,
        commandExecution: this.options.commandExecution,
        started: this.gates.commandStarted(run, gateId, 'readiness'),
        waiting: this.gates.commandWaiting(run, gateId, 'readiness'),
      });

      // A stop can be accepted between the last readiness step and this
      // record. Keep the attempt, but never publish a readiness pass then.
      if ((signal.aborted || this.ignoring(run)) && result.attempt.verdict === 'passed') {
        result = { ...result, attempt: readinessAttemptSchema.parse({ ...result.attempt,
          steps: result.attempt.steps.map(step => step.step === 'run-branch'
            ? { ...step, outcome: 'not-verified', detail: 'readiness was cancelled before publication' } : step),
          verdict: 'failed',
        }) };
      }
      if (this.closed) return false;

      if (result.attempt.verdict === 'passed' && result.gate !== null && !signal.aborted && !this.ignoring(run)) {
        await this.write(run, { type: 'readiness-passed', data: { attempt: attemptNumber, gate: gateId } }, [
          { path: runLayout.gate(gateId), id: gateId, revision: 1, body: result.gate },
          ...readinessAuditOutcome(result.gate),
          { path: runLayout.readiness(attemptNumber), id: String(attemptNumber), revision: 1, body: result.attempt },
        ]);
        await this.afterWrite('readiness-attempted', run.record.jobId);
        return true;
      }

      const step = failingStep(result.attempt);
      const plan = signal.aborted || this.ignoring(run) ? null : recoveryFor(result.attempt, result.gate, run.policy, result.obstruction);
      const recoverable = plan !== null && spent < bound && !signal.aborted && !this.ignoring(run);

      let recovery = null;
      if (recoverable) {
        recovery = await performRecovery({
          id: recoveryId(spent + 1),
          attempt: attemptNumber,
          plan,
          projectRoot: this.projectRoot,
          policy: run.policy,
          auditConfiguration,
          ramify: this.options.ramify,
          commandExecution: this.options.commandExecution,
          count: spent + 1,
          directory: run.path('recoveries'),
          signal,
        });
        spent += 1;
      }

      const attempt = withRecovery(result.attempt, recovery?.id ?? null);
      const records = [
        ...(result.gate === null ? [] : [{ path: runLayout.gate(gateId), id: gateId, revision: 1, body: result.gate }, ...readinessAuditOutcome(result.gate)]),
        { path: runLayout.readiness(attemptNumber), id: String(attemptNumber), revision: 1, body: attempt },
        ...(recovery === null ? [] : [{ path: runLayout.recovery(recovery.id), id: recovery.id, revision: 1, body: recovery }]),
      ];
      const final = recovery === null || recovery.outcome === 'failed';
      await this.write(run, {
        type: 'readiness-failed',
        data: { attempt: attemptNumber, gate: gateId, step: step?.step ?? 'unknown', detail: step?.detail ?? '', recovery: recovery?.id ?? null, final },
      }, records);
      await this.afterWrite('readiness-attempted', run.record.jobId);

      if (signal.aborted || this.ignoring(run)) return false;

      if (final) {
        if (result.obstruction !== undefined && run.policy.recovery) {
          const resumed = await this.waitOperationRecovery(run, { kind: 'readiness', checkpoint: 'readiness', candidate: head },
            { classification: 'check-execution', diagnostic: result.obstruction.diagnostic },
            run.log.all('readiness-failed').map(event => String(event.data.attempt)), spent);
          if (!resumed) return false;
          spent = 0;
          continue;
        }
        await this.fail(run, readinessFailureReason(step?.step), `Readiness failed at ${step?.step ?? 'an unknown step'} after ${attemptNumber} attempt${attemptNumber === 1 ? '' : 's'}: ${step?.detail ?? ''}`,
          [runLayout.readiness(attemptNumber), ...(result.gate === null ? [] : [runLayout.gate(gateId)])]);
        return false;
      }
    }
  }

  /**
   * The final gate: all project tests, the type check and a complete Ramify
   * check, on the current tree. `job-completed` requires a passing attempt;
   * an empty work queue alone never satisfies it.
   */
  private async finalGate(run: Run, binding: { candidateId: string; assessment: Assessment }): Promise<GateAttempt | undefined> {
    run.writer.requireSettled('The final gate cannot run');
    const sourceChanges = await documentChanges(this.projectRoot, run.record.planId, run.directory, run.record.manifest);
    if (sourceChanges.length > 0) {
      await this.fail(run, 'inputs-changed', `The captured plan evidence changed before final publication: ${sourceChanges.join('; ')}`, [runLayout.documentManifest]);
      return;
    }
    // The final gate waits for every latest requirement revision. A
    // capability still held by a fake is not implemented, whatever the
    // project's tests say about it.
    const records = committedRecords(run.log.ledger.replay());
    const verified = this.coordination(run).verifiedRequirements();
    const open = [...records.requirements.values()]
      .filter(requirement => !verified.has(verificationKey(requirement.id, requirement.revision)));
    if (open.length > 0) {
      await this.fail(run, 'unresolvable-requirement',
        `The run cannot complete: ${open.map(requirement => `${requirement.id} of ${requirement.consumer} is still held by its fake`).join('; ')}`,
        open.map(requirement => contractsLayout.requirement(requirement.id, requirement.revision)));
      return;
    }
    // The consistency rule acceptance-incomplete: every tracked scenario is
    // implemented before the final run. Once every work item has completed
    // it cannot fail; when it does, the run fails with the scenarios as
    // evidence rather than returning anywhere.
    const tracked = trackedScenarios(run.log.ledger.replay());
    const incomplete = incompleteScenarios(tracked);
    if (incomplete.length > 0) {
      await this.fail(run, 'acceptance-incomplete',
        `The final gate cannot run: ${incomplete.map(scenario => `${scenario.id} ${scenario.entry === null ? '(integration)' : `of ${scenario.entry}`} is ${scenario.state}`).join('; ')}`,
        incomplete.map(scenario => scenario.evidence));
      return;
    }
    const beforeGate = await this.previewCandidateTree();
    if (beforeGate.tree !== binding.assessment.candidate.tree) {
      throw new CandidateReassessmentRequired('The current candidate needs fresh assessment');
    }
    const latestQualificationChange = Math.max(
      run.log.all('final-correction-planned').at(-1)?.sequence ?? Number.NEGATIVE_INFINITY,
      run.log.all('nonfunctional-final-invalidated').at(-1)?.sequence ?? Number.NEGATIVE_INFINITY,
    );
    const previousFinal = run.log.all('gate-attempted').filter(event => event.sequence > latestQualificationChange && event.data.checkpoint === 'final').at(-1);
    let gateId = previousFinal?.data.gate ?? gateAttemptId(this.gates.gateCount(run) + 1);
    let attempt!: GateAttempt;
    if (previousFinal !== undefined) {
      const recorded = await readCommitted(run.log.ledger, runLayout.gate(gateId), runSchemas.gate);
      if (recorded.kind !== 'valid') {
        await this.fail(run, 'recovery-exhausted', `Final gate ${gateId} record is unavailable`);
        return;
      }
      attempt = recorded.value;
    }
    const pendingFinalGate = previousFinal !== undefined && checkExecutionObstruction(attempt!) !== null;
    if (previousFinal === undefined || pendingFinalGate) {
      if (previousFinal !== undefined) gateId = gateAttemptId(this.gates.gateCount(run) + 1);
      const head = await this.git.currentHead(this.projectRoot);
      try {
        attempt = await this.gates.committingCheckpoint(run, {
          id: gateId,
          runId: run.record.jobId,
          checkpoint: 'final',
          projectRoot: this.projectRoot,
          directory: run.path(runLayout.gateOutput(gateId)),
          head,
          policy: run.policy,
          proposedBy: null,
        }, undefined, undefined, undefined, binding);
      } catch (error) {
        if (!(error instanceof CandidateDriftError)) throw error;
        await this.fail(run, 'inputs-changed', error.message, [runLayout.assessment(binding.assessment.id)]);
        return;
      }
    }
    gateId = attempt!.id;

    if (attempt.audited !== null && attempt.evidence !== null) {
      const auditedTree = await this.candidates.commitTree(this.projectRoot, attempt.audited);
      if (auditedTree !== binding.assessment.candidate.tree) {
        await this.fail(run, 'inputs-changed', `Final gate audited tree ${auditedTree}, not assessed tree ${binding.assessment.candidate.tree}`,
          [runLayout.assessment(binding.assessment.id), runLayout.gate(gateId)]);
        return;
      }
      const existingBinding = run.log.all('candidate-bound-to-gate').find(event => event.data.gate === gateId);
      if (existingBinding !== undefined && (existingBinding.data.assessment !== binding.assessment.id
        || existingBinding.data.candidate !== binding.candidateId || existingBinding.data.tree !== auditedTree
        || existingBinding.data.commit !== attempt.audited)) {
        await this.fail(run, 'recovery-exhausted', `Final gate ${gateId} has a conflicting candidate binding`);
        return;
      }
      if (existingBinding === undefined) await this.write(run, { type: 'candidate-bound-to-gate', data: {
        candidate: binding.candidateId, assessment: binding.assessment.id, gate: gateId,
        commit: attempt.audited, tree: auditedTree,
      } });
    }
    if (attempt.verdict === 'passed' && (attempt.audited === null || attempt.evidence === null
      || run.log.all('candidate-bound-to-gate').at(-1)?.data.gate !== gateId)) {
      await this.fail(run, 'recovery-exhausted', 'The final gate passed without durable candidate-bound audit evidence', [runLayout.gate(gateId)]);
      return;
    }

    if (attempt.verdict !== 'passed') {
      return attempt;
    }

    if (previousFinal === undefined) await this.afterWrite('gate-committed', run.record.jobId);
    if (this.ignoring(run)) return;
    const lateSourceChanges = await documentChanges(this.projectRoot, run.record.planId, run.directory, run.record.manifest);
    if (lateSourceChanges.length > 0) {
      await this.fail(run, 'inputs-changed', `The captured plan evidence changed during final verification: ${lateSourceChanges.join('; ')}`, [runLayout.documentManifest, runLayout.gate(gateId)]);
      return;
    }
    const afterGate = await this.previewCandidateTree();
    if (afterGate.tree !== binding.assessment.candidate.tree) {
      await this.fail(run, 'inputs-changed', 'The source tree changed during final verification', [runLayout.assessment(binding.assessment.id), runLayout.gate(gateId)]);
      return;
    }
    if (supportedCapabilityPolicy(run.policy.version)) {
      const blockers = committedRecords(run.log.ledger.replay()).workItems.flatMap(item =>
        this.capabilityBlockers(run, item.id));
      if (blockers.length > 0) {
        await this.fail(run, 'acceptance-incomplete', `Final completion has unresolved capability work: ${blockers.join('; ')}`);
        return;
      }
    }
    const workItems = run.log.count('work-item-completed');
    // A run that recorded plan deviations completes with them to review,
    // never plainly: the count is of those still awaiting the person.
    const deviations = [
      ...run.log.all('plan-deviation-recorded').map(event => event.data.checkFinding),
      ...run.log.all('nonfunctional-deviation-recorded').filter(event => event.data.assessment === binding.assessment.id).map(event => event.data.checkFinding),
    ];
    const findings = checkFindingStateOf(run.log.ledger).findings;
    const toReview = deviations.filter(id => findings.get(id)?.pendingUserDecision != null).length;
    await this.endRun(run, {
      type: 'job-completed',
      data: { gate: gateId, commit: attempt.audited, workItems, ...(deviations.length === 0 ? {} : { planDeviations: toReview }) },
    });
    await this.afterWrite('job-completed', run.record.jobId);
  }

  /** A recoverable setup on the run branch, before feature or iteration files are written. */
  private async setupScratch(run: Run): Promise<void> {
    if (run.log.find('scratch-setup-complete') !== undefined) return;
    run.writer.requireSettled('Scratch setup cannot run');
    try {
      await this.performScratchSetup(run, false);
      await this.afterWrite('scratch-setup-complete', run.record.jobId);
    } catch (error) {
      if (!(error instanceof ScratchSetupRefusal)) throw error;
      await this.fail(run, 'readiness-failed', `Scratch setup failed before work: ${message(error)}`);
    }
  }

  private async performScratchSetup(run: Run, recovering: boolean): Promise<{ commit: string | null; appended: boolean }> {
    const ignoreFile = join(this.projectRoot, '.gitignore');
    const ignoreInfo = await lstat(ignoreFile).catch((error: unknown) => {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    });
    if (ignoreInfo?.isSymbolicLink()) throw new ScratchSetupRefusal(`project .gitignore is a symlink: ${ignoreFile}`);
    if (ignoreInfo !== null && !ignoreInfo.isFile()) throw new ScratchSetupRefusal(`project .gitignore is not a file: ${ignoreFile}`);
    const original = recovering
      ? run.log.find('scratch-setting-up')?.data.originalIgnoreBase64
      : await readFile(ignoreFile).then(bytes => bytes.toString('base64'), (error: unknown) => {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
        throw error;
      });
    if (original === undefined) throw new Error('Scratch setup recovery has no original .gitignore');
    return run.mutex.run(() => run.log.ledger.effect<{ commit: string | null; appended: boolean }>({
      key: 'scratch-setup',
      intent: { event: run.log.next({ type: 'scratch-setting-up', data: { originalIgnoreBase64: original } }), records: [] },
      perform: async () => {
        await this.afterWrite('scratch-setting-up', run.record.jobId);
        if (recovering) {
          const committed = await this.git.findCommitByTrailers(this.projectRoot, [
            { key: 'Ramify-Run', value: run.record.jobId },
            { key: 'Ramify-Scratch', value: 'setup' },
          ]);
          if (committed !== null) return { commit: committed, appended: true };
        }
        let committed: string | null = null;
        let appended = false;
        try {
          const modules = await declaredModuleDirectories(this.projectRoot);
          const prepared = await ensureScratchRule(this.projectRoot, modules, this.git);
          if (prepared.appended) await this.afterWrite('scratch-rule-appended', run.record.jobId);
          if (!prepared.appended && !recovering) return { commit: null, appended: false };
          const changed = await this.git.changedPaths(this.projectRoot, this.coordination(run).accepted());
          if (changed.some(path => path !== '.gitignore')) {
            throw new ScratchSetupRefusal(`unexpected working-tree changes: ${changed.join(', ')}`);
          }
          appended = prepared.appended || changed.length > 0;
          if (changed.length > 0) {
            await assertScratchSafe(this.projectRoot, modules, this.git);
            committed = await this.git.commitAccepted(this.projectRoot, [
              'Prepare module scratch ignore rule', '',
              `Ramify-Run: ${run.record.jobId}`,
              'Ramify-Scratch: setup', '',
            ].join('\n'));
            if (committed === null) throw new ScratchSetupRefusal('the .gitignore change made no commit');
          }
        } catch (error) {
          if (committed !== null) throw error;
          const restoreInfo = await lstat(ignoreFile).catch((issue: unknown) => {
            if ((issue as NodeJS.ErrnoException).code === 'ENOENT') return null;
            throw issue;
          });
          if (restoreInfo?.isSymbolicLink()) throw new ScratchSetupRefusal(`project .gitignore became a symlink: ${ignoreFile}`);
          if (original === null) await rm(ignoreFile, { force: true });
          else await writeFile(ignoreFile, Buffer.from(original, 'base64'));
          throw error instanceof ScratchIgnoreConflictError
            ? new ScratchSetupRefusal(error.message)
            : error;
        }
        if (committed !== null) await this.afterWrite('scratch-committed', run.record.jobId);
        return { commit: committed, appended };
      },
      complete: result => ({ event: run.log.next({ type: 'scratch-setup-complete', data: result }), records: [] }),
    }));
  }

  /**
   * Writes the tracked feature files onto the run branch and commits them as
   * "Scenarios of <planId>", once readiness has passed and the branch
   * exists, before the first module architect starts. The commit is an
   * external effect of the ledger: `scenarios-materializing` is its intent
   * and `scenarios-materialized` its completion, and a crash between them
   * is recovered by re-rendering and by the commit's trailers. A run without
   * scenarios has no file to write and records nothing.
   */
  private async materializeScenarios(run: Run): Promise<void> {
    if (run.log.find('scenarios-materialized') !== undefined) return;
    if (this.gates.expectedFeatures(run).length === 0) return;
    run.writer.requireSettled('The feature files cannot be written');
    await this.performMaterialization(run, false);
    await this.afterWrite('scenarios-materialized', run.record.jobId);
  }

  /** The materialization effect, from its intent or, on recovery, from the intent the log holds. */
  private async performMaterialization(run: Run, recovering: boolean): Promise<{ commit: string | null; files: string[] }> {
    const expected = this.gates.expectedFeatures(run);
    const files = expected.map(file => file.path);
    return run.mutex.run(() => run.log.ledger.effect<{ commit: string | null; files: string[] }>({
      key: 'scenarios-materialize',
      intent: { event: run.log.next({ type: 'scenarios-materializing', data: { files } }), records: [] },
      perform: async () => {
        await this.afterWrite('scenarios-materializing', run.record.jobId);
        const message = materializationMessage({
          planId: run.record.planId, runId: run.record.jobId, files, scenarios: trackedScenarios(run.log.ledger.replay()).records.length,
        });
        await assertScratchSafe(this.projectRoot, await declaredModuleDirectories(this.projectRoot), this.git);
        const commit = await commitForMaterialization(this.projectRoot, run.record.jobId, message, recovering, this.git, commit => this.verifyProducerCommit(expected, commit), () => this.renderProducerFeatures(run, expected));
        await this.afterWrite('scenarios-committed', run.record.jobId);
        return { commit, files };
      },
      complete: result => ({ event: run.log.next({ type: 'scenarios-materialized', data: result }), records: [] }),
    }));
  }

  /** Recovery proves producer content from Git objects, not merely matching trailers. */
  private async verifyProducerCommit(files: readonly RenderedFeatureFile[], commit: string): Promise<void> {
    const expected = new Map(files.map(file => [file.path, file.content]));
    const changed = await this.git.commitNameStatus(this.projectRoot, commit, undefined, { requireSingleParent: true });
    if (changed.some(change => !expected.has(change.path) || change.status === 'D')) throw new Error(`Recovered scenario producer commit ${commit} includes unrelated paths`);
    const entries = await this.candidates.treeEntries(this.projectRoot, commit);
    for (const [path, content] of expected) {
      if (!entries.some(entry => entry.path === path && ['file', 'executable'].includes(entry.kind)) ||
          await this.candidates.readBlob(this.projectRoot, commit, path) !== content) throw new Error(`Recovered scenario producer commit ${commit} does not contain exact rendered bytes: ${path}`);
    }
  }

  /** Materialization refuses unrelated dirt; isolated revisions preserve settled candidate edits. */
  private async renderProducerFeatures(run: Run, expected: readonly RenderedFeatureFile[], isolated = false): Promise<void> {
    const answer = await this.gates.validateFeatureTargets(expected);
    await rerenderFeatureFiles(this.projectRoot, [...expected]);
    const changed = await this.git.changedPaths(this.projectRoot, await this.git.currentHead(this.projectRoot));
    const hashes = new Map(expectedFeatureHashes(expected).map(file => [file.path, file.hash]));
    const unrelated: string[] = [];
    for (const path of changed) {
      const hash = hashes.get(path);
      if (isolated && hash === undefined) continue;
      if (hash === undefined || !await this.gates.renderedFeatureAllowed(path, hash, answer)) unrelated.push(path);
    }
    if (unrelated.length > 0) throw new Error(`Scenario producer commit refuses unrelated candidate changes: ${unrelated.join('; ')}`);
  }

  /** Every captured source document remains immutable for every writer of the run. */
  /**
   * The guard of one engineer invocation over its assignment's scope. The
   * files only the harness writes and the guarded files no authorization
   * names are refused outright; the latter are marked, so the refusal says
   * that an architect's authorization would open them.
   */
  private ownershipAuthority(run: Run, assignment: { readonly scope: WriteScope }) {
    return ownershipAuthorityFor(assignment, run, async data => {
      const result = await this.write(run, { type: 'ownership-evidence-retained', data });
      if (result === 'ended') throw new Error('The run ended before ownership evidence settled');
    });
  }

  private async engineerGuard(run: Run, assignment: IterationAssignment) {
    return protectedScopeOf(this.projectRoot, assignment.scope, await this.coordination(run).protectedFiles(assignment), this.options.ramify, this.ownershipAuthority(run, assignment));
  }

  /** Committed audit preparation inputs, converted to paths in this project. */

  /** Only a plan architect's explicit current delegation can license this fallback. */
  private async captureAutomaticRepairAssignment(run: Run, invocation: string,
    delegation: AutomaticRepairAssignment['delegation']): Promise<boolean> {
    try {
      const captured = automaticRepairAssignmentSchema.safeParse(this.committedBody(run, runLayout.contingentRepairAssignment));
      if (captured.success) {
        if (captured.data.invocation !== invocation || JSON.stringify(captured.data.delegation) !== JSON.stringify(delegation)) throw new Error('A different contingent assignment is already recorded');
        return true;
      }
      const current = await this.options.ramify.queryOwnershipAnswer(this.projectRoot, ['.']);
      const root = current.scope.ownership.modules.find(module => module.parent === null);
      if (root?.id !== delegation.root) throw new Error('Contingent repair must name the verified project root');
      const scope = await resolveWriteScope({ projectRoot: this.projectRoot, ramify: this.options.ramify,
        index: run.index, view: run.record.manifest.architectView, revision: 1,
        base: { module: delegation.root, included: delegation.included }, extra: [], read: [], bootstrap: [], rationale: delegation.instructions });
      const declarations = scope.resolved.ownership.modules.map(module => posix.join(module.directory === '.' ? '' : module.directory, 'module.ramify'));
      const assignment = automaticRepairAssignmentSchema.parse({ schema: 'ramify-agent.automatic-repair-assignment/1',
        id: 'root-repair', invocation, delegation, scope,
        guarded: await captureGuardedFiles(this.projectRoot, [...this.coordination(run).requiredArtifacts(committedRecords(run.log.ledger.replay())).map(artifact => artifact.path), ...declarations],
          await this.coordination(run).guardedScenarioFiles(), [...await this.coordination(run).auditPreparationPaths(), ...scopeConfigurationPaths(scope)]) });
      if (await this.write(run, { type: 'repair-assignment-recorded', data: { assignment: assignment.id, invocation } },
        [{ path: runLayout.contingentRepairAssignment, id: assignment.id, revision: 1, body: assignment }]) === 'ended') return false;
      // Store a successful provider observation before any later preparation failure.
      await this.ownershipAuthority(run, assignment).retain(current, current.paths.map(path => ({ path: path.path, allowed: path.status === 'owned' })));
      await this.afterWrite('repair-assignment-recorded', run.record.jobId);
      return true;
    } catch (error) {
      await this.fail(run, 'invalid-submission', `Contingent root repair assignment cannot be captured: ${message(error)}`);
      return false;
    }
  }

  private async recordRepairPreparation(run: Run, item: WorkItem, attempt: number,
    assignment: IterationAssignment | undefined, result: IterationResult): Promise<RepairPreparation> {
    const pending = [...run.log.all('repair-preparation-recorded')].reverse().find(event => event.data.workItem === item.id
      && !run.log.all('repair-preparation-consumed').some(consumed => consumed.data.preparation === event.data.preparation));
    if (pending) {
      const retained = repairPreparationSchema.parse(this.committedBody(run, runLayout.repairPreparation(pending.data.preparation)));
      if (retained.originalAssignment === (assignment?.id ?? null) && retained.originalInvocation === (result.invocations.at(-1) ?? null)) return retained;
    }
    const id = `prep-${String(run.log.count('repair-preparation-recorded') + 1).padStart(4, '0')}`;
    const number = assignment === undefined ? 0 : Number.parseInt(assignment.id.slice(assignment.id.lastIndexOf('.i') + 2), 10);
    let candidate: { head: string; tree: string } | null = null;
    let candidatePaths: string[] = [], candidateFailure: string | null = null;
    if (run.policy.recovery || run.log.find('repair-assignment-recorded') !== undefined) {
      try {
        candidate = await this.previewCandidateTree();
        candidatePaths = await this.git.changedPaths(this.projectRoot, this.coordination(run).accepted());
      } catch (error) { candidateFailure = message(error); }
    }
    const preparation = repairPreparationSchema.parse({ schema: 'ramify-agent.repair-preparation/1', id,
      operation: 'prepare-local-architect', workItem: item.id, attempt, recordedAt: this.now().toISOString(),
      ledgerSequence: run.log.events.at(-1)?.sequence ?? 0, acceptedCommit: this.coordination(run).accepted(),
      candidateBefore: candidate === null ? null : { head: candidate.head, tree: candidate.tree }, candidateFailure, candidatePaths,
      repairAssignment: run.log.find('repair-assignment-recorded')?.data.assignment ?? null,
      originalAssignment: assignment?.id ?? null, originalResult: assignment === undefined ? null : iterationLayout.result(item.id, number),
      originalInvocation: result.invocations.at(-1) ?? null,
      inputReferences: [runLayout.capturedPlan, runLayout.documentManifest,
        ...(assignment === undefined ? [] : [iterationLayout.assignment(item.id, number), iterationLayout.result(item.id, number)]),
        ...result.invocations.map(invocation => runLayout.submission(invocation))] });
    const written = await this.write(run, { type: 'repair-preparation-recorded', data: { preparation: id, workItem: item.id, attempt } },
      [{ path: runLayout.repairPreparation(id), id, revision: 1, body: preparation }]);
    if (written === 'ended') throw new Error('The run ended before its preparation target was durable');
    await this.afterWrite('repair-preparation-recorded', run.record.jobId);
    return preparation;
  }

  private latestRepairIncident(run: Run): { incident: RepairIncidentRecord; stage: RepairIncidentStage } | undefined {
    const event = run.log.all('repair-incident-recorded').at(-1);
    if (event === undefined) return undefined;
    const latest = [...run.log.all('repair-incident-recorded'), ...run.log.all('repair-export-recorded')].filter(item => item.data.incidentId === event.data.incidentId).sort((left, right) => left.sequence - right.sequence).at(-1)!;
    const record = run.log.ledger.replay().flatMap(line => line.transaction.records)
      .find(record => record.path === runLayout.repairIncident(latest.data.incidentId, latest.data.revision));
    return { incident: repairIncidentRecordSchema.parse(record?.body), stage: event.data.stage };
  }

  /** Incident and portable export bytes precede any best-effort external tracker call. */
  private async persistRepairIncident(run: Run, incident: RepairIncidentRecord, stage: RepairIncidentStage,
    additional: readonly CommitRecord[] = []): Promise<RepairIncidentRecord> {
    const payload = createRepairExportPayload(this.projectRoot, run.record.jobId, incident);
    const written = await this.write(run, { type: 'repair-incident-recorded', data: { incidentId: incident.incidentId, revision: incident.revision, stage } },
      [{ path: runLayout.repairIncident(incident.incidentId, incident.revision), id: incident.incidentId, revision: incident.revision, body: incident },
        { path: repairExportPayloadPath(incident.incidentId, incident.revision), id: incident.incidentId, revision: incident.revision, body: payload }, ...additional]);
    if (written === 'ended') throw new Error('The run ended before the repair incident could be persisted');
    await this.afterWrite('repair-incident-recorded', run.record.jobId);
    if (this.repairIncidentExport !== undefined && ['refused', 'blocked', 'unverified', 'continued', 'interrupted'].includes(stage)) {
      try {
        const exported = await exportRepairIncident(payload, this.repairIncidentExport, this.options.commandExecution, this.now);
        const next = { ...incident, revision: incident.revision + 1, export: exported };
        const exportWritten = await this.write(run, { type: 'repair-export-recorded', data: { incidentId: incident.incidentId, revision: next.revision, state: exported.state } },
          [{ path: runLayout.repairIncident(next.incidentId, next.revision), id: next.incidentId, revision: next.revision, body: next },
            { path: repairExportPayloadPath(next.incidentId, next.revision), id: next.incidentId, revision: next.revision, body: createRepairExportPayload(this.projectRoot, run.record.jobId, next) }]);
        if (exportWritten === 'ended') {
          this.warn(`Automatic repair incident ${incident.incidentId} export completed after the run ended; its retained pending payload must be reconciled before reporting delivery`);
          return incident;
        }
        return next;
      } catch (error) { this.warn(`Automatic repair incident ${incident.incidentId} export remains pending: ${message(error)}`); }
    }
    return incident;
  }

  /** One bounded writer, admitted only for a matching pure preparation after an accepted partial. */
  private async automaticProjectRepair(run: Run, agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>, baseline: MeasurementSnapshot,
    preparation: RepairPreparation, obstruction: unknown, prepare: ((report: RepairResult) => Promise<ConstructedWorkTurnStep>) | null):
    Promise<{ step: ConstructedWorkTurnStep | null; incident: RepairIncidentRecord; delta: RepairDelta } | { refusal: string } | null> {
    const retainedIncident = this.latestRepairIncident(run);
    const resumedIncident = run.restoring && retainedIncident?.incident.preparation.id === preparation.id && ['admitted', 'running', 'interrupted'].includes(retainedIncident.stage) ? retainedIncident : undefined;
    const id = resumedIncident?.incident.incidentId ?? repairIncidentId(new Set(run.log.all('repair-incident-recorded').map(event => event.data.incidentId)).size + 1);
    const sourcePath = posix.join('repairs', 'sources', `${id}.json`);
    const originalSource = resumedIncident === undefined ? undefined : this.committedBody(run, sourcePath) as { before: Awaited<ReturnType<typeof captureRepairFiles>>; protectedBefore: Awaited<ReturnType<typeof captureRepairFiles>>; head: string; tree: string; dirty: string[] } | undefined;
    const assignment = automaticRepairAssignmentSchema.safeParse(this.committedBody(run, runLayout.contingentRepairAssignment));
    const original = preparation.originalAssignment === null ? undefined : committedRecords(run.log.ledger.replay()).assignments.get(preparation.originalAssignment);
    const originalOutcome = preparation.originalInvocation === null ? undefined : this.effectiveInvocationOutcome(run, preparation.originalInvocation);
    let reason: string | null = resumedIncident && !originalSource ? 'The original automatic repair source evidence is unavailable; restore its retained before-state before continuation' : this.ignoring(run) ? 'Stop or terminal run prevents automatic repair'
      : run.writer.blocked ?? this.invocationRefusal(run);
    const durableTarget = repairPreparationSchema.safeParse(this.committedBody(run, runLayout.repairPreparation(preparation.id)));
    if (reason === null && (!durableTarget.success || JSON.stringify(durableTarget.data) !== JSON.stringify(preparation)
      || run.log.all('repair-preparation-recorded').at(-1)?.data.preparation !== preparation.id
      || run.log.all('repair-preparation-consumed').some(event => event.data.preparation === preparation.id))) reason = 'Preparation target is missing, mismatched or already consumed';
    if (!run.policy.recovery && !resumedIncident && reason === null && run.log.all('invocation-started').some(event => event.data.work.automaticRepair !== undefined)) reason = 'The run has spent its one automatic repair invocation';
    if (!run.policy.recovery && reason === null && (!assignment.success || assignment.data.id !== preparation.repairAssignment)) reason = 'No matching architect-recorded contingent root assignment is available';
    if (reason === null && (original === undefined || originalOutcome === undefined || originalOutcome.ended !== 'submitted' ||
      (!run.policy.recovery && originalOutcome.outsideScope.length > 0) || (originalOutcome.unknownPlacement?.length ?? 0) > 0 || !originalOutcome.settled.confirmed)) reason = 'Original partial candidate has unavailable or refused assignment provenance';
    const previousWriters = run.log.all('writer-acquired');
    if (reason === null && previousWriters.some(writer => {
      const release = run.log.all('writer-released').filter(event => event.data.invocation === writer.data.invocation);
      return !this.latestOperationRecovery(run)?.reconciledInvocations?.includes(writer.data.invocation) && (release.length !== 1 || release[0]!.data.confirmed !== true);
    })) reason = 'A previous writer has no unique confirmed settlement';
    if (reason === null && (obstruction instanceof OwnershipUnavailableError || obstruction instanceof OwnershipAuthorityError || obstruction instanceof z.ZodError)) reason = 'Typed ownership or input validation outcomes continue through ordinary handling';
    let dirty: string[] = [], tree: string | null = null, head: string | null = null;
    let before: Awaited<ReturnType<typeof captureRepairFiles>> = [];
    let protectedBefore: Awaited<ReturnType<typeof captureRepairFiles>> = [];
    try {
      dirty = await this.git.changedPaths(this.projectRoot, this.coordination(run).accepted());
      head = await this.git.currentHead(this.projectRoot);
      tree = (await this.previewCandidateTree()).tree;
      if (reason === null && !resumedIncident && (preparation.candidateBefore === null || tree !== preparation.candidateBefore.tree || head !== preparation.candidateBefore.head)) reason = 'Candidate changed after the recorded preparation target';
      if (reason === null && original !== undefined) {
        const guarded = resumedIncident && assignment.success
          ? guardedScopeOf(assignment.data.scope, await deniedFiles(this.projectRoot, await this.coordination(run).deniedFiles()), this.options.ramify, undefined, this.ownershipAuthority(run, assignment.data))
          : await this.engineerGuard(run, original);
        const retainedRepairPaths = new Set<string>();
        if (run.policy.recovery) {
          const ledger = run.log.ledger.replay();
          for (const repair of verifiedRepairDeltas(ledger).filter(repair => !ledger.some(entry => entry.sequence > repair.sequence
            && entry.transaction.event.type === 'gate-attempted' && entry.transaction.event.data.verdict === 'passed'
            && Object.entries(checkpointPolicies).some(([checkpoint, policy]) => entry.transaction.event.type === 'gate-attempted'
              && entry.transaction.event.data.checkpoint === checkpoint && policy.committing)))) {
            const repairGuard = guardedScopeOf(repair.assignment.scope, await deniedFiles(this.projectRoot,
              [...await this.coordination(run).deniedFiles(), ...repair.assignment.guarded.map(file => file.path)]), this.options.ramify, undefined, this.ownershipAuthority(run, repair.assignment));
            for (const path of await unchangedRepairPaths(this.projectRoot, repair.delta)) {
              if ((await decideWrite(repairGuard, this.projectRoot, { kind: 'write', paths: [path] })).verdict === 'allowed') retainedRepairPaths.add(path);
            }
          }
        }
        if (originalOutcome?.outsideScope.some(path => !retainedRepairPaths.has(path))) reason = 'Original partial candidate has unavailable or refused assignment provenance';
        for (const path of dirty) {
          const decision = await decideWrite(guarded, this.projectRoot, { kind: 'write', paths: [path] });
          if (reason === null && decision.verdict !== 'allowed' && !retainedRepairPaths.has(path)) { reason = `Pre-repair candidate ${path} is outside its original assignment: ${decision.reason}`; break; }
        }
      }
      if (reason === null && assignment.success) {
        const current = await this.options.ramify.queryOwnershipAnswer(this.projectRoot, ['.']);
        if (JSON.stringify(current.scope.ownership.modules) !== JSON.stringify(assignment.data.scope.resolved.ownership.modules)) reason = 'Recorded repair topology differs from current ownership';
        const protecting = [...assignment.data.guarded.map(file => file.path), ...await this.coordination(run).harnessFiles(),
          ...this.coordination(run).requiredArtifacts(committedRecords(run.log.ledger.replay())).map(artifact => artifact.path), ...declarationPaths(assignment.data),
          ...await this.coordination(run).auditPreparationPaths(), ...scopeConfigurationPaths(assignment.data.scope)];
        protectedBefore = await captureRepairFiles(this.projectRoot, protecting);
        before = [...new Map([...await captureRepairSource(this.projectRoot, assignment.data.scope), ...await captureRepairFiles(this.projectRoot, dirty)].map(file => [file.path, file])).values()].sort((a, b) => a.path.localeCompare(b.path));
      }
    } catch (error) { reason ??= `Candidate and repair authority cannot be established: ${message(error)}`; }
    // Replacement attribution starts from the settled current candidate.
    // Preserve the original protected-input witness independently of source edits.
    if (originalSource) protectedBefore = originalSource.protectedBefore;
    let eligibleRefusal = !!resumedIncident && !originalSource;
    if (reason === null && !resumedIncident && run.log.all('invocation-started').some(event => event.data.work.automaticRepair !== undefined)) {
      reason = 'The run has spent its one automatic repair invocation';
      const previous = this.latestRepairIncident(run);
      eligibleRefusal = previous?.stage === 'continued' && previous.incident.verification?.verified === true && previous.incident.continuation?.delivered === true;
    }
    if (reason === null && (!assignment.success || assignment.data.id !== preparation.repairAssignment)) {
      reason = 'No matching architect-recorded contingent root assignment is available';
      // A malformed committed assignment is corrupt state, not missing authority.
      eligibleRefusal = this.committedBody(run, runLayout.contingentRepairAssignment) === undefined;
    }
    let incident = repairIncidentRecordSchema.parse({ schema: 'ramify-agent.repair-incident/1', incidentId: id, revision: 1,
      createdAt: this.now().toISOString(), preparation: { id: preparation.id, path: runLayout.repairPreparation(preparation.id) },
      operation: preparation.operation, workItem: preparation.workItem, originalInvocation: preparation.originalInvocation,
      originalAssignment: preparation.originalAssignment, originalResult: preparation.originalResult,
      harnessError: { name: obstruction instanceof Error ? obstruction.name : 'Error', message: message(obstruction),
        stack: obstruction instanceof Error ? obstruction.stack ?? null : null, evidence: preparation.inputReferences },
      admission: { admitted: reason === null, reason: reason ?? 'Matching pure preparation, valid explicit root delegation, settled writer and remaining budget' },
      authority: { assignment: assignment.success ? assignment.data.id : null, scopeEvidence: assignment.success ? [runLayout.contingentRepairAssignment] : [] },
      candidateBefore: { head, tree, changedPaths: dirty, staged: [], unstaged: [], untracked: [], evidence: [`Aggregate candidate paths: ${JSON.stringify(dirty)}; index categories are not separately inferred`, runLayout.repairPreparation(preparation.id)] },
      candidateAfter: null, invocation: null, session: null, result: null, verification: null, continuation: null,
      startedAt: null, endedAt: null, elapsedMs: null, usage: null, versions: { ramify: assignment.success ? assignment.data.scope.resolved.ownership.ramifyVersion : 'unavailable' },
      export: { externalRef: repairExternalRef(repairProjectKey(this.projectRoot), run.record.jobId, id), state: 'pending', issueId: null, reason: 'Not exported', attemptedAt: null } });
    if (resumedIncident) incident = { ...resumedIncident.incident, revision: resumedIncident.incident.revision + 1, candidateBefore: incident.candidateBefore, continuation: null };
    incident = await this.persistRepairIncident(run, incident, reason === null ? 'admitted' : 'refused', reason !== null || originalSource ? [] : [{
      path: sourcePath, id, revision: 1, body: { schema: 'ramify-agent.automatic-repair-source/1', before, protectedBefore, head, tree, dirty } }]);
    if (reason !== null || !assignment.success || original === undefined) {
      if (run.policy.recovery && eligibleRefusal && reason !== null) return { refusal: reason };
      await this.fail(run, 'inputs-changed', `Architect preparation failed: ${message(obstruction)}. Automatic repair refused: ${reason}`);
      return null;
    }
    const assigned = assignment.data;
    const guarded = guardedScopeOf(assigned.scope, await deniedFiles(this.projectRoot,
      [...await this.coordination(run).deniedFiles(), ...protectedBefore.map(file => file.path)]), this.options.ramify, undefined, this.ownershipAuthority(run, assigned));
    const bounds = engineerBoundsOf(run.policy.limits).defaults;
    const absoluteMs = bounds.absoluteMs;
    if (this.ignoring(run)) {
      await this.persistRepairIncident(run, { ...incident, revision: incident.revision + 1, endedAt: this.now().toISOString() }, 'blocked');
      return null;
    }
    const toolName = 'submit_automatic_repair';
    const tools = this.coordination(run).implementationTools({ workingDirectory: this.projectRoot, scopeRevision: assigned.scope.revision,
      guarded, commandTimeoutMs: bounds.commandTimeoutMs, submissions: { legalOutcomes: ['ready', 'blocked'], completionOutcome: null } });
    const loaded = packages.get('engineer');
    if (loaded === undefined) throw new Error('Engineer prompt package is unavailable for automatic repair');
    const prompt = ['Restore only the named architect preparation operation so its responsible architect can continue.',
      'Preserve useful partial work, the plan, acceptance, accepted behavior and every module declaration. Do not create, remove or re-parent modules.',
      'Use the supplied root subtree assignment and normal guarded tools. A shell is no exception to denied edits. Do not edit harness code, progress records or Git history.',
      'If the repair requires unavailable authority or a change to the running harness, report blocked.',
      `Submit ready or blocked through ${toolName}; ready is a judgment pending harness verification, never plan completion.`,
      `Active work item: ${preparation.workItem}. Original partial assignment: ${run.path(iterationLayout.assignment(preparation.workItem, Number.parseInt(original.id.split('.i').at(-1)!, 10)))}.`,
      `Preparation and input references: ${run.path(runLayout.repairPreparation(preparation.id))}.`,
      `Full incident diagnostics: ${run.path(runLayout.repairIncident(id, incident.revision))}.`,
      `Root assignment: ${run.path(runLayout.contingentRepairAssignment)}. Instructions: ${assigned.delegation.instructions}.`,
      `Captured engineer bounds: ${JSON.stringify({ ...bounds, absoluteMs })}. Candidate ${tree}; accepted commit ${preparation.acceptedCommit}; dirty paths ${JSON.stringify(dirty)}.`,
      this.coordination(run).planPackage(await this.coordination(run).frozenCatalog()),
    ].join('\n\n');
    incident = await this.persistRepairIncident(run, { ...incident, revision: incident.revision + 1, startedAt: this.now().toISOString() }, 'running');
    const linesBefore = await takeLineSnapshot(this.projectRoot, this.coordination(run).accepted(), this.git);
    const result = await this.runInvocation<RepairResult>(run, agent, {
      role: 'engineer', work: { workItem: preparation.workItem, automaticRepair: id }, attempt: 1, loaded,
      task: { kind: 'automatic-repair', goal: 'Restore blocked architect preparation', modules: [assigned.delegation.root],
        requirements: [this.coordination(run).planPackage(await this.coordination(run).frozenCatalog())] },
      systemPrompt: `You are the bounded automatic project repair engineer. Work only under the captured root assignment. ${prompt}`,
      prompt, start: { mode: 'fresh' }, toolName, description: 'Report preparation repair readiness, evidence and remaining implementation work.',
      inputSchema: z.toJSONSchema(repairResultSchema) as JsonSchema, submissionSchema: 'ramify-agent.automatic-repair-result/1', validate: input => validateAgainst(repairResultSchema, input),
      bounds: { idleMs: Math.min(bounds.idleMs, absoluteMs), absoluteMs, commandTimeoutMs: bounds.commandTimeoutMs },
      context: contextPolicyOf(run.policy, 'engineer'), keep: () => finished('work-closed'),
      scope: { write: assigned.scope.revision, measurement: this.coordination(run).baselineReference(), size: null },
      measured: { snapshot: baseline, scope: writeScopeMeasurement(assigned.scope), readScope: readScopeMeasurement(assigned.scope) },
      writer: true, guarded, readModules: [], workingDirectory: this.projectRoot, equip: tools.equip, previewEquipment: tools.preview,
    });
    await this.coordination(run).recordLineEvents(result.id, linesBefore, await takeLineSnapshot(this.projectRoot, this.coordination(run).accepted(), this.git));
    const outcome = result.id === '' ? undefined : this.effectiveInvocationOutcome(run, result.id);
    const started = run.log.all('invocation-started').find(event => event.data.invocation === result.id);
    incident = { ...incident, revision: incident.revision + 1, invocation: result.id || null, session: started?.data.session ?? null,
      result: result.value ?? null, endedAt: this.now().toISOString(), elapsedMs: outcome?.elapsedMs ?? null,
      usage: outcome?.usage !== undefined && 'total' in outcome.usage ? { inputTokens: outcome.usage.input, outputTokens: outcome.usage.output, totalTokens: outcome.usage.total, cost: null } : null };
    if (!this.ignoring(run)) {
      const evidencePath = posix.join('repairs', 'attempts', `${id}.json`);
      let afterFiles: Awaited<ReturnType<typeof captureRepairFiles>> = [], afterPaths: string[] = [], diagnosticFailure: string | null = null;
      try {
        afterPaths = await this.git.changedPaths(this.projectRoot, this.coordination(run).accepted());
        const afterSource = await captureRepairSource(this.projectRoot, assigned.scope);
        afterFiles = await captureRepairFiles(this.projectRoot, [...before.map(file => file.path), ...afterSource.map(file => file.path), ...afterPaths]);
      } catch (error) { diagnosticFailure = message(error); }
      incident = { ...incident, candidateAfter: { head: await this.git.currentHead(this.projectRoot), tree: null, changedPaths: afterPaths,
        staged: [], unstaged: [], untracked: [], evidence: [evidencePath, ...(diagnosticFailure === null ? [] : [diagnosticFailure])] } };
      incident = await this.persistRepairIncident(run, incident, 'running', [{ path: evidencePath, id, revision: 1,
        body: repairAttemptSchema.parse({ schema: 'ramify-agent.automatic-repair-attempt/1', incidentId: id, invocation: result.id || 'not-started', before, after: afterFiles,
          changes: repairChanges(before, afterFiles), protectedBefore, failure: diagnosticFailure }) }]);
      incident = { ...incident, revision: incident.revision + 1 };
    }
    const blocked = async (why: string, stage: 'blocked' | 'unverified' = 'unverified'): Promise<null> => {
      await this.persistRepairIncident(run, { ...incident, verification: { verified: false, reason: why, evidence: [] }, continuation: { delivered: false, reason: why, evidence: [] } }, stage);
      if (!this.ignoring(run)) await this.fail(run, 'inputs-changed', `Original architect obstruction: ${message(obstruction)}. Automatic repair: ${why}`);
      return null;
    };
    if (result.ended !== 'submitted' || result.value === undefined || result.value.outcome === 'blocked') return blocked(`Repair ended ${result.ended}${result.value === undefined ? '' : `: ${result.value.summary}`}`, 'blocked');
    if (this.ignoring(run) || run.writer.blocked !== undefined || outcome?.settled.confirmed !== true) return blocked('Repair writer settlement is unverified');
    if (outcome.outsideScope.length > 0 || (outcome.unknownPlacement?.length ?? 0) > 0) return blocked('Repair outcome records outside-scope writes or unknown placement');
    try {
      const documentFaults = await documentChanges(this.projectRoot, run.record.planId, run.directory, run.record.manifest);
      if (documentFaults.length > 0) return blocked(`Protected captured documents changed: ${documentFaults.join('; ')}`);
      const protectedNow = await captureRepairFiles(this.projectRoot, protectedBefore.map(file => file.path));
      if (protectedNow.some(file => { const original = protectedBefore.find(original => original.path === file.path); return file.hash !== original?.hash || file.mode !== original.mode; })) return blocked('Protected configuration, accepted artifacts or module declarations changed');
      const ownership = await this.options.ramify.queryOwnershipAnswer(this.projectRoot, ['.']);
      if (JSON.stringify(ownership.scope.ownership.modules) !== JSON.stringify(assigned.scope.resolved.ownership.modules)) return blocked('Repair changed the module structure');
      const afterDirty = await this.git.changedPaths(this.projectRoot, this.coordination(run).accepted());
      const afterSource = await captureRepairSource(this.projectRoot, assigned.scope);
      const after = await captureRepairFiles(this.projectRoot, [...before.map(file => file.path), ...afterSource.map(file => file.path), ...afterDirty]);
      const changes = repairChanges(before, after);
      if ((await outsideScope(this.projectRoot, guarded, changes.map(change => change.path))).length > 0) return blocked('Repair delta violates captured or current authority');
      const delta = repairDeltaSchema.parse({ schema: 'ramify-agent.automatic-repair-delta/1', incidentId: id,
        assignment: assigned.id, originalAssignment: original.id, acceptedCommit: preparation.acceptedCommit, invocation: result.id,
        beforeValidated: true, beforeDirtyPaths: dirty, before, after, changes,
        structure: protectedBefore.filter(file => declarationPaths(assigned).includes(file.path)).map(file => ({ path: file.path, hash: file.hash })) });
      const afterCandidate = await this.previewCandidateTree();
      if (afterCandidate.head !== head) return blocked('Repair changed Git history or HEAD');
      incident = { ...incident, candidateAfter: { head: afterCandidate.head, tree: afterCandidate.tree, changedPaths: afterDirty, staged: [], unstaged: [], untracked: [], evidence: [`Aggregate candidate paths: ${JSON.stringify(afterDirty)}`, runLayout.repairDelta(id)] },
        verification: { verified: true, reason: prepare === null ? 'Settled guarded delta preserves protected inputs and declarations; ordinary parent preparation remains pending' : 'Settled guarded delta preserves protected inputs and declarations; pure preparation repeated successfully', evidence: [runLayout.repairDelta(id)] } };
      const step = prepare === null ? null : await prepare(result.value);
      return { step, incident, delta };
    } catch (error) { return blocked(`Preparation remains unavailable or repair cannot be verified: ${message(error)}`); }
  }

  // Scenario states, architecture §7 to §9

  /** The work item's entry or integration scenario and the run's tracked scenarios, which a declaration is judged against. */

  /**
   * The last refusal of a completion request the bound allows: the run fails
   * with the requirements as evidence where one is open or owed, and with
   * the unresolved capability work otherwise. A missing done report is no
   * refusal here: validation rejects that request in its own turn.
   */
  private async refuseCompletion(
    run: Run,
    item: WorkItem,
    refusals: number,
    blocked: readonly string[],
    owing: { readonly open: readonly ConsumerRequirement[]; readonly owed: boolean },
  ): Promise<void> {
    if (owing.open.length > 0 || owing.owed) {
      await this.fail(run, 'unresolvable-requirement',
        `${item.id} asked for completion ${refusals} times with evidence still owed: ${blocked.join('; ')}`,
        owing.open.map(requirement => contractsLayout.requirement(requirement.id, requirement.revision)));
      return;
    }
    await this.fail(run, 'acceptance-incomplete', `${item.id} asked for completion ${refusals} times with capability work unresolved: ${blocked.join('; ')}`);
  }

  /**
   * What a failing gate tells its reader: every command that did not pass
   * with what it reported, raw. No cause is inferred and no repair owner is
   * named: what a failure means is the reader's to judge.
   */
  private async diagnosticsOf(run: Run, gate: GateAttempt, audience: GateAudience = 'engineer'): Promise<{ id: string; cause: string | null; summary: string[] }> {
    const { records } = trackedScenarios(run.log.ledger.replay());
    const waiting = new Map(run.log.all('gate-command-waiting')
      .filter(event => event.data.gate === gate.id)
      .map(event => [event.data.position, event.data.line] as const));
    return gateDiagnostics(gate, audience, new Map(records.map(record => [record.id, record.name])), waiting);
  }

  /**
   * The tracked scenarios an accepted iteration's gate audit passed, read
   * from its raw runner output, each with the step definitions that bound
   * it, for the module architect: binding is recorded, not policed, and this
   * is where the architect sees it. Display only.
   */
  private async passedScenarioLines(run: Run, result: IterationResult): Promise<string[]> {
    if (result.outcome !== 'accepted' || result.gate === null) return [];
    const gate = await this.readGate(run, result.gate);
    if (gate === null) return [];
    const { records } = trackedScenarios(run.log.ledger.replay());
    return groupedPassedScenarioLines(scenarioResultsOf(gate), new Map(records.map(record => [record.id, record.name])));
  }

  private async readGate(run: Run, id: string): Promise<GateAttempt | null> {
    const read = await readCommitted(run.log.ledger, runLayout.gate(id), runSchemas.gate);
    return read.kind === 'valid' ? (read.value as GateAttempt) : null;
  }

  private async fail(run: Run, reason: RunFailureReason, text: string, evidence: readonly string[] = []): Promise<void> {
    // A failure is the run's final decision; its readers are stopped and
    // their requests finished first, so no review is left running past it.
    if (run.reviews !== undefined && !run.log.terminal) await this.stopReaders(run, 'stopped', run.policy.limits.stopSettleMs);
    await this.endRun(run, { type: 'job-failed', data: { reason, message: text, evidence: [...evidence] } });
  }

  /**
   * Stops accepting commands and asks every running session to stop,
   * recording nothing: the next start of the harness marks an unfinished
   * run interrupted. The project lock remains held until every run driver
   * is quiescent, so no durable write can cross into a successor service's
   * ownership. A driver that does not quiesce within the captured settlement
   * bound makes close fail and leaves the lock held for a later retry. A
   * completed driver whose settlement was not confirmed also leaves it held;
   * the service has no recovery contract that can later declare it settled.
   */
  close(): Promise<void> {
    if (this.closing !== undefined) return this.closing;
    this.closed = true;
    const closing = this.closeQuiescent();
    this.closing = closing.catch(error => {
      this.closing = undefined;
      throw error;
    });
    return this.closing;
  }

  private async closeQuiescent(): Promise<void> {
    await this.commandMutex.run(async () => {
      const drivers = [...this.runs.values()];
      const active = drivers.filter(run => !run.log.terminal);
      for (const run of active) {
        run.readiness?.controller.abort();
        run.reviews?.close();
        for (const preparation of run.reviewPreparations.values()) preparation.abort();
        for (const session of run.sessions()) void session.stop().catch(() => undefined);
        run.notify();
      }

      if (drivers.length > 0) {
        const bound = Math.max(...drivers.map(run => run.policy.limits.stopSettleMs));
        let timer: NodeJS.Timeout | undefined;
        const quiescent = await Promise.race([
          Promise.all(drivers.map(run => run.idle())).then(() => true),
          new Promise<boolean>(resolve => { timer = setTimeout(() => resolve(false), bound); }),
        ]);
        clearTimeout(timer);
        if (!quiescent) {
          throw new Error(`The harness did not become quiescent within ${bound} ms; its project lock remains held`);
        }
      }
      const unsettled = drivers.filter(run => run.writer.isUnsettled);
      if (unsettled.length > 0) {
        throw new Error(`The harness has ${unsettled.length} run driver${unsettled.length === 1 ? '' : 's'} whose settlement was not confirmed; its project lock remains held`);
      }
      // Terminal administration drains under its own bound before the shared
      // provider store closes. Unconfirmed settlement keeps this ownership held.
      if (this.beadsSessions && await this.beadsSessions.then(administration => administration.close(), () => true) === false) {
        throw new Error('Beads administration settlement is unavailable; its pending record and project lock remain held');
      }
      if (this.sessionOperations && await this.sessionOperations.then(operations => operations.close(), () => true) === false) throw new Error('Session operation settlement is unavailable; its project lock remains held');
      await this.options.onQuiescentClose();
    });
  }
}

/**
 * What one unresolved request resolved to: a placement fix, a plan deviation
 * the work item goes on under, or an environment problem the operator
 * answered by resuming the run, with their note.
 */
/** The records the placement rules are checked against, as the log holds them. */

/**
 * The `module.ramify` declarations on the path between two modules: each
 * module at or below their lowest common ancestor that is one of them or an
 * ancestor of one of them. An agreement's exposure is declared along exactly
 * that path and nowhere else.
 */

/** Whether two view identities describe the same state of the source. */

/** The project-relative directory of one module, or the project root when the view has none. */

function preparedGate(operation: GateOperation): PreparedGate {
  return {
    checkpoint: operation.checkpoint,
    request: {
      ...operation.request,
      checks: [],
    },
    guardedChanges: [...operation.guardedChanges],
    rules: [...operation.rules],
    unauthorized: operation.unauthorized,
    ruleFailed: operation.ruleFailed,
    decisive: [],
    timeoutMs: operation.timeoutMs,
  };
}

/**
 * The session an invocation asks for, as its record states it. `actual` here
 * is what the caller already knew: a session it could not continue degrades
 * before the invocation starts. What the implementation answered is in the
 * outcome, which is written once the session has started.
 */
/** What a review request binds besides its candidate: its question's captured inputs and its fork point. */

/**
 * The inputs a request bound, as read again now: each must be there with
 * the hash the request recorded, or the question is not the one it asked.
 */
function boundInputs(read: readonly CapturedInput[], bound: ReadonlyArray<{ readonly ref: string; readonly hash: string }>): CapturedInput[] {
  return bound.map(entry => {
    const found = read.find(input => input.ref === entry.ref);
    if (found === undefined) throw new Error(`${entry.ref} is no longer there`);
    if (found.hash !== entry.hash) throw new Error(`${entry.ref} has hash ${found.hash}, and the request bound ${entry.hash}`);
    return found;
  });
}

/**
 * The module architect's pinned point after one invocation, where the harness
 * kept its session: the session and the executor's ref at the invocation's
 * end. Null where the session was not kept or no ref was reported.
 */

/** How long a failure analysis may run: it reads a bounded set of files and submits once. */
const failureAnalysisMs = 600_000;

/** How much of one command output the analyst is given, from its end. */
const failureOutputCharacters = 400_000;

/**
 * Why one implementation session ended without a result, as its module
 * architect reads it: the bound or fault that ended it, and what its outcome
 * records.
 */

/**
 * Why an approval of the run's analysis is refused, or null when it is
 * accepted: once only, never before the analysis is accepted or during the
 * final verification, and never for a run that did not complete.
 */
function approvalRefusal(run: Run, snapshot: RunSnapshot): string | null {
  const earlier = run.log.find('analysis-approved');
  if (earlier !== undefined) return `The analysis was already approved by ${earlier.data.reviewer} at ${earlier.at}`;
  switch (snapshot.state) {
    case 'failed': return 'The run failed; the analysis of a failed run is not approved';
    case 'stopped': return 'The run was stopped; the analysis of a stopped run is not approved';
    case 'interrupted': return 'The run was interrupted; the analysis of an interrupted run is not approved';
    case 'completed': return null;
    case 'running': break;
  }
  if (run.stopRequested) return 'A stop was accepted for this run; its analysis is not approved';
  if (run.log.find('analysis-accepted') === undefined) return 'The run has no accepted analysis yet';
  if (snapshot.phase === 'final-verification') return 'The run is in its final verification; approve its analysis once it has completed';
  return null;
}

/**
 * The union of caller waits at review stops and fully reached breakpoints.
 * Settlement and model execution are running time; overlapping waits count once.
 */
function callerPauseMs(events: readonly RunEvent[], now: number): number {
  const intervals: Array<[number, number]> = [];
  let review: number | undefined;
  let debug: number | undefined;
  let recovery: number | undefined;
  for (const event of events) {
    const at = Date.parse(event.at);
    if (event.type === 'review-requested') review = at;
    if (event.type === 'analysis-approved' && review !== undefined) { intervals.push([review, at]); review = undefined; }
    if (event.type === 'operation-recovery-paused') recovery ??= at;
    if (event.type === 'operation-recovery-resumed' && recovery !== undefined) { intervals.push([recovery, at]); recovery = undefined; }
    if (event.type === 'debug-paused' || event.type === 'debug-exchange-settled') debug ??= at;
    if ((event.type === 'debug-resumed' || event.type === 'debug-exchange-admitted') && debug !== undefined) { intervals.push([debug, at]); debug = undefined; }
    if (['job-stopped', 'job-failed', 'job-interrupted', 'job-completed'].includes(event.type)) {
      if (review !== undefined) intervals.push([review, at]);
      if (debug !== undefined) intervals.push([debug, at]);
      if (recovery !== undefined) intervals.push([recovery, at]);
      review = debug = recovery = undefined;
    }
  }
  if (review !== undefined) intervals.push([review, now]);
  if (debug !== undefined) intervals.push([debug, now]);
  if (recovery !== undefined) intervals.push([recovery, now]);
  intervals.sort(([a], [b]) => a - b);
  let total = 0;
  let end = Number.NEGATIVE_INFINITY;
  for (const [from, to] of intervals) { total += Math.max(0, to - Math.max(from, end)); end = Math.max(end, to); }
  return total;
}

/**
 * A verified package as its reader receives it: each element the selection
 * holds says why it is in view, and its `Conditions:` and `Uncertainty:`
 * lines appear only where the plan or the selector recorded some. The plan's
 * own conditions come first; the selector's follow, marked as its reading.
 * Elements the selection does not name, and plan deviations, are unchanged.
 */

/**
 * The tracked scenarios a passed gate ran, each with the step definitions
 * that bound it. A Scenario Outline's examples that one check ran in one
 * file and that the same definitions bound are listed once, with every
 * example's line: their bindings differ only in the example values.
 */
export function groupedPassedScenarioLines(results: readonly ScenarioResult[], names: ReadonlyMap<string, string> = new Map()): string[] {
  const title = (id: string) => (names.has(id) ? `\`${id}\` "${names.get(id)}"` : `\`${id}\``);
  const groups = new Map<string, ScenarioResult[]>();
  for (const result of results.filter(entry => entry.status === 'passed')) {
    const key = JSON.stringify([result.id, result.check, result.file, result.binding.map(binding => binding.definition)]);
    groups.set(key, [...groups.get(key) ?? [], result]);
  }
  return [...groups.values()].flatMap(group => {
    const [first] = group as [ScenarioResult, ...ScenarioResult[]];
    const bound = first.binding.length === 0 ? ', with no step bound.' : ', bound by:';
    const where = group.length === 1
      ? `at \`${first.file}:${first.line}\``
      : `${group.length} examples, at \`${first.file}\` lines ${group.map(entry => entry.line).join(', ')}`;
    return [
      `- ${title(first.id)} passed in \`${first.check}\`, ${where}${bound}`,
      ...first.binding.map(binding => `  - \`${binding.step}\` → \`${binding.definition}\``),
      ...(group.length > 1 && first.binding.length > 0 ? [`  The step texts are line ${first.line}'s; the other examples differ only in their example values.`] : []),
    ];
  });
}

/** The commit the working directory is on, or the empty string outside git. */

async function readJson(path: string): Promise<unknown> {
  const content = await readIfExists(path);
  if (content === undefined) return null;
  try {
    return JSON.parse(content.toString('utf8'));
  } catch {
    return null;
  }
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms).unref());
}

/** Whether a CheckFinding's owner is this work item. */
/** A terminal review result as a reconciliation packet states it: covered scope, gaps and concerns. */
function resultText(result: ReviewResult): string {
  const concerns = (count: number) => `${count} concern${count === 1 ? '' : 's'}`;
  if (result.result === 'complete') return `complete, ${concerns(result.concerns)}`;
  if (result.result === 'partial') return `partial, ${concerns(result.concerns)}; not inspected: ${result.missing.map(entry => `${entry.path} (${entry.reason})`).join(', ')}`;
  return `not verified (${result.reason}): ${result.detail}`;
}

/** Mechanical section identities only; goal/requirements are supplied by their owning records. */

/** Known project facts as step inputs: captured JSON, with every path a project-relative field. */
function taskKindFor(role: Role, tool: string, continuing?: ContinueReason): TaskKind {
  if (tool === 'submit_compaction_review') return 'compaction-review';
  if (tool === 'submit_final_correction') return 'final-correction';
  if (tool === 'submit_capability_qualification') return 'capability-qualification';
  if (tool === 'answer_capability_consultation') return 'consultation';
  if (tool === workOrientationToolName) return 'orientation';
  if (tool === orientationToolName) return 'design-orientation';
  if (tool === reconciliationToolName) return 'reconciliation';
  if (tool === intakeToolName) return 'intake';
  if (tool === principleToolName) return 'principles';
  if (tool === checkToolName) return 'check';
  if (role === 'initial-architect') return 'initial-analysis';
  if (role === 'local-architect') return continuing === 'completion-refused' ? 'completion' : continuing === 'repair' ? 'repair' : 'assignment';
  if (role === 'capability-architect') return 'capability';
  if (role === 'engineer') return continuing === 'repair' ? 'repair' : 'engineering';
  if (role === 'contract-engineer') return 'contract';
  if (role === 'context-selector') return 'selection';
  if (role === 'global-fork') return 'placement';
  if (role === 'failure-analyst') return 'failure-analysis';
  if (role === 'nonfunctional-repair-engineer') return 'repair';
  if (tool === coordinatorActionToolName) return 'action';
  if (tool === coordinatorInvestigationToolName) return 'investigation';
  if (tool === coordinatorAssessmentToolName) return 'assessment';
  throw new Error(`Current task kind unavailable for ${role}/${tool}`);
}

export type { RunServiceOptions as AutonomousRunOptions };
