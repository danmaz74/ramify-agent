import { Acceptance } from '../../acceptance/src/acceptance.js';


import { CapabilityNameConflictError, type CapabilityInput } from './capability/ledger.js';

import { viewIdentityOf as projectViewIdentity } from './project-facts.js';
import type { BriefAppend } from '../../acceptance/src/completion.js';
import { writeOnce, readIfExists } from '../../../src/run/artifacts.js';
import { rootModuleOf } from './context.js';

import type { RunWrite } from '../../../src/run/log.js';







import { repairPreparationSchema } from './repair/repair-preparation.js';
import { type RepairExportConfiguration } from '../../../src/run/repair-export.js';
import { ownershipAuthorityFor } from '../../../../../src/work/ownership-authority.js';
import type { ProvisionalSourceGit } from '../../../../evidence/src/provisional-git.js';

import { type CommandRunner } from '../../../../evidence/src/run-command.js';
import { z } from 'zod';
import { compactionReviewSchema } from './compaction-review.js';
import { mkdir, readFile, unlink } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import type { AgentPort, JsonSchema } from '../../../../agent/src/interfaces/port.js';
import { type CandidateSource, type GitService } from '../../../../evidence/src/git.js';
import type { RamifyCli } from '../../../../evidence/src/ramify-cli.js';
import { type ArchitectIndex } from '../../../../evidence/src/views.js';






import { type CheckFindingCommit } from '../../../../../src/check-findings/transition.js';


import { outsideScope } from '../../../../../src/run/mutations.js';

import { capabilityLayout } from './capability/records.js';
import { supportedCapabilityPolicy } from './capability/policy.js';





import { canonicalJson } from '../../../../../src/jobs/commands.js';

import { snapshotTools } from '../../../../reviews/src/snapshot.js';
import { reviewStateOf } from '../../acceptance/src/reviews/state.js';


import type { ViewIdentity } from '../../../../../src/interfaces/protocol/evidence.js';
import { roleDisplayName, type Role, type RunFailureReason } from '../../../../../src/interfaces/protocol/runs.js';

import { type RecordRef as CommitRecord } from '../../../../../src/jobs/commit.js';







import { readAcceptedEvidence, acceptedAnalysisReferences } from '../../planning/src/evidence.js';


import { workOrientationToolName } from './context-selection/submissions.js';
import { documentChanges, readCapturedDocuments } from '../../planning/src/documents.js';


import { type OperationRecovery, type RecoveryBoundary } from '../../../src/run/records.js';

import type { InterruptionEvidence } from '../../../../agent/src/interfaces/port.js';

import { committedBody, invocationRecord, type InvocationRequest } from '../../../../task-workflow/src/steps/runner.js';
import { finished, kept, type InvocationResult } from '../../../../task-execution/src/results.js';
import { loadPromptPackages, sha256, type LoadedPackage } from '../../../../../src/prompts/packages.js';
import { rootModuleOfSnapshot } from '../../../../kpi/src/capture.js';


import { globalContext } from './architecture/context.js';

import { nonfunctionalEquipment } from '../../acceptance/src/nonfunctional/equipment.js';
import { type IterationAssignment, type IterationResult } from './work/iterations.js';
import { type WriteScope } from '../../../../../src/work/scope.js';

import { deniedFiles, protectedScopeOf } from '../../../../../src/work/scope.js';
import { committedRecords } from '../../../src/run/committed-records.js';
import { iterationApiViews } from './work/session.js';
import { AfterHandling } from '../../acceptance/src/after-handling.js';
import { obligationProjection, pendingCorrection, verifiedRequirements } from './work/history.js';
import { CandidateDriftError, CommittingGates } from '../../acceptance/src/committing-gate.js';
import { EvidenceUnavailableError } from '../../../src/run/inputs.js';

import { type RunEvent, type RunEventInput } from '../../../src/run/log.js';
import { ObservationLog } from '../../../../task-execution/src/observations.js';




import { declaredModuleDirectories } from '../../../../../src/run/project-config.js';
import { assertScratchSafe } from './work/scratch.js';
import { gateAttemptSchema } from '../../acceptance/src/gate-records.js';
import { runDirectory } from '../../../src/run/records.js';
import { measurementSnapshotSchema, snapshotId, type MeasurementSnapshot } from '../../../../kpi/src/run-records.js';
import { runLayout, type RunPolicy, type RunRecord } from '../../../src/run/records.js';
import { invocationOutcomeSchema, type Invocation, type InvocationOutcome, type DurableRecordRef as RecordRef, type ContinueReason, type SessionFinishReason, type SessionId } from '../../../../task-execution/src/records.js';


import { recordAppend } from '../../../../task-execution/src/transcripts/recorder.js';


import { validateAgainst } from '../../../../task-execution/src/submissions.js';

import { HarnessSessionOperations } from '../../../../../src/prompts/session-adapter.js';
import { readSessionPointReference } from '../../../../task-execution/src/session-operations.js';


import type { ScenarioResult } from '../../acceptance/src/checks/scenario-results.js';


import { refOf } from '../../../../../src/jobs/committed-reader.js';


import type { ParentSession, CompletionBasis, Reconciled, ReconciliationOwner } from '../../acceptance/src/completion.js';

import { failedWithoutResult } from './context.js';









import { automaticRepairAssignmentSchema, repairDeltaSchema, repairAttemptSchema, captureRepairFiles, captureRepairSource, repairChanges, declarationPaths, unchangedRepairPaths, type AutomaticRepairAssignment, type RepairPreparation, type RepairDelta } from './repair/repair-preparation.js';
import { repairIncidentRecordSchema, repairResultSchema, type RepairIncidentRecord } from '../../../../../src/interfaces/protocol/repairs.js';
import { repairIncidentId } from './repair/repair-records.js';
import { type RepairResult, type RepairIncidentStage } from '../../../../../src/interfaces/protocol/repairs.js';
import { createRepairExportPayload, exportRepairIncident, repairExportPayloadPath, repairExternalRef, repairProjectKey } from '../../../src/run/repair-export.js';
import { verifiedRepairDeltas } from '../../acceptance/src/repair-gate.js';
import { checkpointPolicies } from '../../acceptance/src/checks/checkpoint.js';
import { OwnershipUnavailableError } from '../../../../evidence/src/ownership-evidence.js';
import { OwnershipAuthorityError } from '../../../../../src/work/ownership-authority.js';
import { engineerConsultationInputs } from './consultations/targets.js';

import { type StartingPointGroup } from './work/starting-inputs.js';


import { runCommand } from '../../../../evidence/src/run-command.js';




import { posix } from 'node:path';
import type { SessionStart, ToolDefinition } from '../../../../agent/src/interfaces/port.js';



import type { GateAttempt } from '../../acceptance/src/checks/records.js';
import { acceptedCommit } from '../../acceptance/src/checks/accepted.js';


import { decideWrite } from '../../../../../src/guard/write-guard.js';


import type { CheckFindingId, CheckFindingState } from '../../../../check-findings/src/interfaces/check-findings.js';



import { type ReconciliationBasis, type UnresolvedReason } from '../../acceptance/src/reviews/reconciliation.js';




import { capabilityHandbackGuidance } from './capability/delivery.js';
import { type CapabilityRequest, type CapabilityTask, type CapabilityPlan } from './capability/records.js';



import { type CapabilityAction } from './capability/submission.js';
import { replayCapabilityState } from './capability/state.js';




import { reviewLayout } from '../../acceptance/src/reviews/records.js';




import { type CandidateSnapshot } from '../../../../reviews/src/snapshot.js';




import { type FailureAnalysis } from '../../../../../src/interfaces/protocol/runs.js';





import { planPath } from '../../../../../src/plans/discover.js';


import { type ElementCatalog } from '../../../../plan-evidence/src/interfaces/catalog.js';


import { type Candidate } from '../../../../nonfunctional/src/interfaces/contracts.js';



import { assessedElements } from '../../acceptance/src/nonfunctional/submissions.js';









import { constructEngineerStep, engineerStepInputsOf, type ConstructedEngineerStep } from '../../../../task-workflow/src/steps/engineer.js';


import { stepInputsSchemaId, type EngineerStepInputs } from '../../../../task-workflow/src/steps/inputs.js';
import { type ConstructedWorkTurnStep } from '../../../../task-workflow/src/steps/local-architect.js';

import { renderFailureAnalystPrompt, renderGlobalForkPrompt } from '../../../../../src/prompts/packages.js';

import { readScopeMeasurement, writeScopeMeasurement } from '../../../../kpi/src/measurement/inputs.js';

import { lineEvents, takeLineSnapshot, type LineSnapshot } from '../../../../kpi/src/lines.js';
import { writeFileAtomic } from '../../../../ledger/src/atomic.js';

import { nextCheckFinding } from '../../acceptance/src/deviations/finding.js';


import { contractsLayout, obligationId, type ConsumerRequirement } from './contracts/records.js';
import { conformanceKey } from './contracts/schedule.js';
import { type EstablishedContract } from './contracts/submission.js';

import { assignedFeaturePaths } from './work/feature-selection.js';
import { type ShellCallRecord } from './work/engineer-equipment.js';


import { engineerWorkingDirectory } from './work/engineer-directory.js';
import { descriptiveCapabilityNameErrors, iterationAcceptance, parseRecordedEngineerSubmission, type AssignedObligation, validateEngineerWithOwnership, type EngineerSubmission, type IterationApiViews } from './work/engineer.js';
import { iterationAssignmentSchema, iterationLayout, type FailureDigest } from './work/iterations.js';

import { digestLines, failureAnalysisJsonSchema, failureAnalysisMessage, failureAnalysisSubmissionDescription, failureAnalysisToolName, failureDigest, validateFailureAnalysis, type AnalysisEvidence as FailureEvidence, type DigestShellCall, type FailureAnalysisSubmission } from './work/failure.js';

import { scopeConfigurationPaths, captureGuardedFiles, guardedScopeOf, resolveWriteScope } from '../../../../../src/work/scope.js';

import { workLayout, workItemId, type WorkItem } from './work/records.js';
import { prepareAssignedCucumber, type ReconciliationBriefing } from './work/session.js';
import { type GateAudience } from '../../acceptance/src/checks/diagnostics.js';
import { scenarioResultsOf } from '../../acceptance/src/checks/scenario-results.js';



import { requiredArtifacts } from './work/publication.js';




import type { RenderedFeatureFile } from '../../../../scenarios/src/rendering.js';
import { type RunEventOf } from '../../../src/run/log.js';

import { contextPolicyOf, engineerBoundsOf, type EngineerBounds } from '../../../../../src/run/policy.js';


import { expectedFeatureFiles, expectedFeatureHashes, trackedScenarios } from '../../acceptance/src/feature-files.js';
import { type EngineerScenarios } from './work/scenario-briefing.js';


import { scratchSafetyRule } from './work/scratch.js';


import { lineEventSummarySchema, type LineEventSummary } from '../../../../kpi/src/run-records.js';

import { type ArchitectRef } from '../../../../task-execution/src/records.js';











import type { OutlinePublicationInput, AssignmentPublicationInput } from './work/publication.js';
import type { WorkItemOutline } from './work/records.js';
import type { ObligationRegistration, ObligationReport } from './work/obligations.js';
import type { ReviewRequestState } from '../../acceptance/src/reviews/state.js';
import type { CheckFindingPlan } from '../../../../../src/check-findings/transition.js';

import { localViewInputsOf } from './work/view-inputs.js';




import { checkContinuationScope } from './work/inherited-scope.js';


import { captureGlobalTarget, localConsultationInputs } from './consultations/targets.js';

import { capabilityGuardedPolicy, capabilityAuthorizationErrors } from './capability/authorization.js';

import { declaredCheckInputs } from './work/starting-inputs.js';





import { stat } from 'node:fs/promises';
import { sep } from 'node:path';



import { projectConfigurationFile } from '../../../../evidence/src/project-configuration.js';
import { findModule } from '../../../../evidence/src/views.js';
import type { GateRuleRecord, TestSelectionPolicy } from '../../acceptance/src/checks/records.js';


import type { GuardedScope } from '../../../../../src/guard/write-guard.js';






import { captureProvisionalSource } from './capability/source.js';

import { capabilityRequestId, capabilityTaskId, capabilityAssignmentId, identifyCapabilityNeed, type CapabilityNeedInput, type DescriptiveCapabilityNeedInput, type CapabilityExchange, type CapabilityHandback } from './capability/records.js';
import { captureCapabilityLimits } from './capability/policy.js';

import { qualificationActionSchema, descriptiveQualificationActionSchema, capabilityActionSchema, capabilityPlanUpdateSchema, buildCapabilityPlanRevision, unreportedByHandback, validateCapabilityAction, validateCapabilityPlanUpdate, type QualificationAction } from './capability/submission.js';
import { capabilityHandbackReadiness } from './capability/state.js';














import { type PackageCitation, type PackageDeviation } from '../../../../plan-evidence/src/interfaces/catalog.js';





import { readRecordedContextSelection, type RecordedContextSelection } from './context-selection/recorded.js';
import { citePackage, deliverPackage } from './context-selection/delivery.js';
import { orientationPacket, prepareContextSelection, workOrientationSubmissionSchema, type ContextSelectorSubmission, type SelectionSource, type WorkOrientationSubmission } from './context-selection/submissions.js';





import { type KnownProjectFacts } from '../../../../task-workflow/src/task-brief.js';



import { knownFactsInputs } from '../../../../task-workflow/src/steps/constructed.js';
import { projectPath, validateSelectorInputs, validateWorkTurnInputs, type KnownFactsInputs, type OrientationStepInputs, type ProjectPath, type StepInputs } from '../../../../task-workflow/src/steps/inputs.js';
import { constructStep, freshFallback } from '../../../../task-workflow/src/steps/construct.js';
import { assignmentBootstrap, constructOrientationStep, constructSelectorStep, constructWorkTurnStep, judgeWorkTurn, workBriefingInputs } from '../../../../task-workflow/src/steps/local-architect.js';

import { renderContractPrompt, renderEngineerPrompt, renderLocalArchitectPrompt, renderCapabilityArchitectPrompt } from '../../../../../src/prompts/packages.js';
import { baselineScope } from '../../../../kpi/src/capture.js';




import { acceptDecision } from './architecture/accept.js';
import { briefText, type GlobalContext } from './architecture/context.js';
import { architectureLayout, architectureSchemas, globalDecisionId, localDecisionId, descriptiveLocalDecisionId, descriptivePlacementRequestId, placementRequestSchema, requestId, type PlacementDecision, type PlacementRequest } from './architecture/records.js';
import { forkMessage, unresolvedForkMessage } from './architecture/session.js';
import { defaultMaxPlanDeviations, deviationLayout, environmentProblemId, environmentProblemSchema, packageDeviation, planDeviationId, planDeviationSchema, unresolvedRequestId, descriptiveUnresolvedRequestId, unresolvedRequestSchema, type DeviationBody, type EnvironmentBody, type EnvironmentProblem, type PlanDeviation, type UnresolvedRequest } from '../../acceptance/src/deviations/records.js';
import { deviationCommands } from '../../acceptance/src/deviations/finding.js';

import { environmentCommands, environmentOptions } from '../../acceptance/src/deviations/environment.js';
import { forkJsonSchema, descriptiveForkJsonSchema, forkSubmissionSchema, descriptiveForkSubmissionSchema, forkToolName, validateFork, type ForkSubmission, type PlacementRequestBody } from './architecture/submission.js';
import { ContractPublicationError, registerContract, registrationNeeded, executionRetirements, type AttachedConsumer } from './contracts/accept.js';
import { cycleClosedBy, cycleIdentity, type DependencyCycle, type DependencyEdge } from './contracts/graph.js';
import { fakeNamingViolations, type NamedFile } from './contracts/naming.js';

import { contractId, requirementId, executionRetirementPath, executionRetirementSchema, type ContractRecord, type ProviderObligation } from './contracts/records.js';
import { bindingKey, nextWorkItem, openRequirements, providerItemOf, type ScheduleState } from './contracts/schedule.js';
import { reopenEvidence } from './contracts/revision.js';
import { contractMessage, type RevisionBriefing } from './contracts/session.js';
import { contractAuthorJsonSchema, descriptiveContractIdentityErrors, contractToolName, validateContract, type ContractIdentityContext, type ContractSubmission, type NeedAsBehavior } from './contracts/submission.js';

import type { Hypothesis, RegistryEntry } from '../../planning/src/records.js';

import { assignmentBodySchema, assignmentErrors, type AssignmentBody } from './work/assignment.js';
import { engineerEquipment, type EngineerEquipment } from './work/engineer-equipment.js';

import { createGitInspectionTool } from './work/git-inspection.js';

import { iterationId } from './work/iterations.js';


import { resolveRealTarget } from '../../../../../src/guard/resolve-contained-path.js';
import { missingHistoricalAuthority, injectionSiteRule, moduleOwning, testPolicyOf, type DefaultWriteScope, type GuardedScenarioFiles } from '../../../../../src/work/scope.js';


import { obligationBriefingLines, obligationsOwnedBy, reportSourceLines, type ObligationActor, type ObligationProjection } from './work/obligations.js';
import { hypothesesFor } from './work/frontier.js';
import { integrationScenarioOf, originKindOf } from './work/records.js';
import { apiViewsOf, defaultWriteScopeSection, onboardingOf, type DelegationBriefing, type WorkItemBriefing } from './work/session.js';
import { localArchitectToolName, type LocalArchitectSubmission } from './work/submission.js';


import { authorizedScope } from './work/publication.js';
import { assignedCount, completionBlockers, evidenceFor, bindingsOf, integrationItemsDue, obligationOwedBy, openRequirementsOf } from './work/history.js';







import { moduleTestAreas, type TestArea } from '../../../../../src/run/project-config.js';

import { commitForScenarios, rewordedTrailerValue, rewordingMessage, scenarioNameOf } from '../../acceptance/src/feature-files.js';
import type { ScenarioState } from '../../../../scenarios/src/states.js';
import { scenarioRecordSchema, scenarioSourceHash, type ScenarioRecord } from '../../../../scenarios/src/records.js';
import { integrationBriefing, type IntegrationBriefing } from './work/integration.js';
import { entryScenariosOf } from './work/scenario-briefing.js';


import { assignmentStartingPointsOf, auditPreparationPathsOf, declaredCheckFacts, defaultWriteScopesOf, engineerBoundsFor, iterationAssignmentOf, knownProjectFactsOf, obligationBriefingOf, ownedTestAreasOf, unauthorizedGuardedOf } from './project-facts.js';


import { globalForkSourceSchema, invocationSchema, type RequestRelation } from '../../../../task-execution/src/records.js';










import { declarationsBetween, placementEvidenceOf, sameView, identityOf, directoryOf, architectRefOf } from './context.js';
import { eventsOf, eventOf, type CoordinationHistory } from './work/history.js';

import type { EffectSpec } from '../../../../ledger/src/effects.js';

import type { SessionState } from '../../../src/run/sessions.js';


import { withSelectionReasons } from './selection-reasons.js';
export interface ContractOutcome {
  readonly findings: string[];
  /** The iteration result, where this outcome closed one. */
  readonly result?: IterationResult | undefined;
  /** A cycle this registration closed, delivered once to the module architect. */
  readonly cycle?: DependencyCycle | undefined;
}

export interface ClosedIterationOutcome {
  readonly kind: 'closed';
  /** Set where the iteration reported that the provider cannot conform. */
  readonly reportedRevision?: boolean | undefined;
  readonly result: IterationResult;
  /**
   * The gate that returned this iteration to the module architect, with what
   * each failing command reported. It is not in the result record: the
   * record holds the findings, and this is the diagnosis the next architect
   * briefing carries.
   */
  readonly returnedGate?: { readonly id: string; readonly cause: string | null; readonly summary: readonly string[] } | undefined;
  readonly need?: {
    readonly need: NeedAsBehavior;
    readonly suggestedProvider?: string | undefined;
    /** The files the fake must be injected in, as the module engineer named them. */
    readonly injectionSites?: readonly string[] | undefined;
    readonly invocation: string;
  } | undefined;
}

export interface SuspendedCapabilityOutcome {
  readonly kind: 'capability-needed';
  readonly summary: string;
  readonly need: CapabilityNeedInput | DescriptiveCapabilityNeedInput;
  readonly invocation: string;
  readonly session: SessionId;
  readonly point: string;
}

export type IterationOutcome = ClosedIterationOutcome | SuspendedCapabilityOutcome;

export type UnresolvedResolution =
  | { readonly kind: 'decided'; readonly decision: PlacementDecision }
  | { readonly kind: 'deviation'; readonly deviation: PlanDeviation }
  | { readonly kind: 'environment'; readonly problem: EnvironmentProblem; readonly note: string };

/** What one placement request resolved to, for the module architect that made it. */
/** A work item's package as its module architect holds it: the selection that cites it, the citation and its text. */
export interface WorkPackage {
  readonly selection: string;
  readonly citation: PackageCitation;
  readonly text: string;
}

export type PlacementResolution =
  | { readonly kind: 'decided'; readonly decision: PlacementDecision }
  | { readonly kind: 'unresolved'; readonly request: string; readonly findings: readonly string[]; readonly gaps: readonly string[] };

/** What the parent append did, as the effect's completion records it, with the session that holds the context. */
export type AppendResult =
  | { readonly outcome: 'appended' | 'already-present'; readonly generation: number; readonly session: SessionId; readonly ref: string }
  | { readonly outcome: 'session-lost'; readonly generation: number; readonly session: SessionId | null; readonly reason: string };

/** Candidate-bound acceptance evidence carried across the coordination boundary. */
export interface CapabilityHandbackBasis {
 readonly gate: GateAttempt;
 readonly gateRecord: RecordRef;
 readonly candidateTree: string;
 readonly reviews: readonly ReviewRequestState[];
 readonly acceptedBasis: CompletionBasis | null;
 readonly reconciliation: ReconciliationBasis | null;
 readonly recovered: boolean;
}
export type CapabilityVerification =
 | { readonly kind: 'accepted'; readonly handback: CapabilityHandback; readonly qualification: CapabilityHandbackBasis; readonly guidance: string }
 | { readonly kind: 'refused'; readonly guidance: string; readonly coordinator?: { readonly point: string | undefined; readonly session: SessionId | undefined; readonly invocation: string } };

export interface CoordinationObservation {
 readonly version: number;
 readonly history: CoordinationHistory;
 readonly records: ReturnType<typeof committedRecords>;
 readonly index: ArchitectIndex | null;
 readonly policy: RunPolicy;
 readonly restoring: boolean;
 readonly restarted: boolean;
 readonly findings: CheckFindingState;
 readonly pendingEffects: readonly string[];
}
export interface CoordinationInputs {
 readonly projectRoot: string; readonly directory: string; readonly base: string;
 readonly record: Pick<RunRecord, 'jobId' | 'planId' | 'baseline' | 'manifest' | 'auditConfiguration' | 'projectConfig' | 'identityContract'>;
 readonly workflow: 'capability-coordination/1' | null;
 readonly options: { readonly ramify: RamifyCli; readonly rootModule?: string | undefined; readonly commandExecution?: CommandRunner | undefined; readonly provisionalSourceGit?: ProvisionalSourceGit | undefined; readonly skillDirectory?: string | undefined };
 readonly git: GitService;
 readonly candidates: CandidateSource;
 readonly repairIncidentExport?: RepairExportConfiguration | undefined;
}
export type CoordinationEffect<T> = Omit<EffectSpec<RunEventInput, T>, 'serialize'> & { readonly serialization: 'whole' | 'records' };
export interface CoordinationPorts {
 runParallelReview<T>(agent: AgentPort, request: InvocationRequest<T>): Promise<InvocationResult<T>>;
 readonly acceptance: Pick<import('../../acceptance/src/acceptance.js').Acceptance, 'dischargeEvidence' | 'diagnosticsOf' | 'readGate'>;
 restoreInvocation(id: string): void;
 renderInvocationTranscript(session: SessionId, invocation: string): Promise<string>;
 operations(agent: AgentPort): Promise<HarnessSessionOperations>;
 invocationRefusal(): string | null;
 latestOperationRecovery(): OperationRecovery | undefined;

 readonly commitFinding: (build: (current: { readonly history: CoordinationHistory; readonly state: CheckFindingState }) => CheckFindingPlan | { readonly stale: string }, at?: Date) => Promise<CheckFindingCommit>;
 readonly gates: {
  iterationGate: CommittingGates['iterationGate'];
  workItemGate(item: WorkItem, invocation: string, repairRound: number, summary: string, taskOwner?: string, replayed?: boolean): Promise<GateAttempt | null>;
  validateFeatureTargets(expected: readonly RenderedFeatureFile[], ownership?: Awaited<ReturnType<RamifyCli['queryOwnershipAnswer']>>): Promise<Awaited<ReturnType<RamifyCli['queryOwnershipAnswer']>> | undefined>;
  expectedFeatures(): RenderedFeatureFile[];
  writtenFeatures(): RenderedFeatureFile[];
 };
 readonly handling: {
  recordBindings: AfterHandling['recordBindings'];
  requestReviews: AfterHandling['requestReviews'];
  closeIteration(item: WorkItem, number: number, assignment: IterationAssignment, body: { readonly outcome: IterationResult['outcome']; readonly invocations: readonly string[]; readonly findings: readonly string[]; readonly gate: string | null; readonly commit: string | null; readonly recommendation?: string | undefined; readonly failure?: IterationResult['failure'] | undefined }): Promise<IterationResult>;
  recordAssignment(input: AssignmentPublicationInput): Promise<IterationAssignment | null>;
  reviseOutline(input: OutlinePublicationInput): Promise<{ readonly outline: WorkItemOutline; readonly written: boolean; readonly unchanged: boolean } | null>;
  recordObligations(actor: ObligationActor, invocation: string, submission: { readonly registrations: readonly ObligationRegistration[]; readonly reports: readonly ObligationReport[] }): Promise<boolean>;
  cleanupClosedScratch(): Promise<void>;
 };
 readonly observe: () => CoordinationObservation;
 readonly notify: () => void;
 readonly changed: () => Promise<void>;
 readonly wakeReviews: () => void;
 readonly sessionState: (session: SessionId) => SessionState | undefined;
 readonly hasSessionPoint: (agent: AgentPort, runId: string, point: string) => Promise<boolean>;
 readonly appendSession: (agent: AgentPort, ...args: Parameters<HarnessSessionOperations['append']>) => ReturnType<HarnessSessionOperations['append']>;
 readonly recordAppend: (session: SessionId, note: Parameters<typeof recordAppend>[1], sequence: number | null) => Promise<void>;
 readonly commitCapability: (input: CapabilityInput, records: readonly import('../../../../ledger/src/ledger.js').RecordBody[], qualification?: CapabilityHandbackBasis) => Promise<RunEvent>;
 readonly effect: <T>(spec: CoordinationEffect<T>) => Promise<T>;
 readonly writer: { readonly requireSettled: (reason: string) => void; readonly register: (invocation: string, pid: number) => void; readonly blocked: () => string | null; readonly unsettled: () => boolean };
  afterWrite(write: RunWrite, runId: string): Promise<void>;
  committedBody(path: string): unknown;
  completeWorkItem(item: WorkItem, gate: GateAttempt, basis: CompletionBasis): Promise<'completed' | 'ended' | { readonly refused: string }>;
  contractGate(
    item: WorkItem,
    assignment: IterationAssignment,
    invocation: string,
    submission: EstablishedContract,
    repairRound: number,
  ): Promise<GateAttempt | null>;
  diagnosticsOf(gate: GateAttempt, audience?: GateAudience): Promise<{ id: string; cause: string | null; summary: string[] }>;
  effectiveInvocationOutcome(id: string): InvocationOutcome | undefined;
  engineerGuard(assignment: IterationAssignment): Promise<GuardedScope>;
  fail(reason: RunFailureReason, text: string, evidence?: readonly string[]): Promise<void>;
  finishSession(session: SessionId | undefined, reason: SessionFinishReason): Promise<void>;
  ignoring(): boolean;
  invocationRecord(id: string): { readonly revision: number; readonly body: Invocation };
  latestBasis(workItem: string): ReconciliationBasis | undefined;
  now(): Date;
  ownershipAuthority(assignment: { readonly scope: WriteScope }): ReturnType<typeof ownershipAuthorityFor>;
  pendingCorrection(workItem: string): string | undefined;
  previewCandidateTree(): ReturnType<GitService['previewCandidateTree']>;
  reconcileWorkItem(agent: AgentPort, loaded: LoadedPackage, item: WorkItem, parent: ParentSession,
    owner?: ReconciliationOwner): Promise<Reconciled | null>;
  reconciliationBriefing(reconciliation: string, undelivered: readonly string[]): ReconciliationBriefing | undefined;
  refreshIndex(): Promise<ArchitectIndex | null>;
  renderProducerFeatures(expected: readonly RenderedFeatureFile[], isolated?: boolean): Promise<void>;
  runInvocation<T>(agent: AgentPort, request: InvocationRequest<T>): Promise<InvocationResult<T>>;
  unresolvedOf(workItem: string, state: CheckFindingState): Array<{ readonly checkFinding: CheckFindingId; readonly reason: UnresolvedReason }>;
  verifyCapabilityHandback(
    agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>, item: WorkItem, task: CapabilityTask,
    request: CapabilityRequest, plan: CapabilityPlan,
    action: Extract<CapabilityAction, { kind: 'request-handback' }>,
    completion: InvocationResult<CapabilityAction>,
    replayed: boolean,
  ): Promise<CapabilityVerification | null>;
  verifyProducerCommit(files: readonly RenderedFeatureFile[], commit: string): Promise<void>;
  waitOperationRecovery(boundary: RecoveryBoundary, evidence: InterruptionEvidence,
    attempts: readonly string[], automaticAttempts: number, group?: number, wait?: boolean): Promise<boolean>;
  warn(message: string): void;
  write(input: RunEventInput, records?: readonly CommitRecord[], at?: Date): Promise<'committed' | 'already-committed' | 'ended'>;
}

function capabilityRequirementErrors(references: readonly string[], catalog: ElementCatalog): Array<{ path: string; message: string; expected: string }> {
  const active = new Map(catalog.elements.map(element => [element.id, element]));
  return references.flatMap((id, index) => {
    const element = active.get(id);
    const source = `the accepted functional-requirement IDs in this run's work-item package (catalog ${catalog.manifestHash})`;
    if (element?.kind === 'functional') return [];
    const reason = catalog.retired.includes(id) ? 'retired' : element === undefined ? 'unknown or foreign to this run' : `a ${element.kind} element`;
    return [{ path: `requirementRefs.${index}`, message: `${id} is ${reason}; a provider plan requires an active functional requirement of this run`, expected: source }];
  });
}

function capabilityRetirement(id: string, kind: 'capability-request' | 'capability-task', replacement: string,
  iteration: string, reason: string): CommitRecord {
  const body = executionRetirementSchema.parse({ schema: 'ramify-agent.execution-retirement/1', id, kind,
    replacements: [replacement], authority: { iteration, reason } });
  return { path: executionRetirementPath(id), id, revision: 1, body };
}

export class WorkCoordination {
  private readonly preparedScopes = new WeakMap<AssignmentBody, WriteScope>();
  constructor(private readonly input: CoordinationInputs, private readonly ports: CoordinationPorts) {}
  private get projectRoot() { return this.input.projectRoot; }
  private get options() { return this.input.options; }
  private get workflow() { return this.input.workflow; }
  private get git() { return this.input.git; }
  private get candidates() { return this.input.candidates; }
  private observe(): CoordinationObservation { return this.ports.observe(); }
  private events<K extends RunEvent['type']>(type: K): RunEventOf<K>[] { return eventsOf(this.observe().history.events, type); }
  private event<K extends RunEvent['type']>(type: K): RunEventOf<K> | undefined { return eventOf(this.observe().history.events, type); }
  private path(relative: string): string { return join(this.input.directory, relative); }
  /**
   * Every work item of the frontier, in the order the analysis committed
   * them. A work item that is already closed is passed over, which is how a
   * run that is started again after a crash does no work twice.
   */
  async takeWorkItems(agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>, baseline: MeasurementSnapshot): Promise<boolean> {
    if (packages.get('local-architect') === undefined) {
      await this.ports.fail('internal', 'No prompt package is loaded for the module architect');
      return false;
    }
    // Registration can publish a provider before its consumer has received
    // the original contract handback. Finish that captured active turn first;
    // only then may the new frontier's provider priority take effect.
    let restoredActiveItem = this.observe().restoring && (this.workflow === null || this.observe().restarted)
      ? [...this.observe().history.events].reverse().find(event =>
        (event.type === 'work-item-started' || event.type === 'work-item-resumed') &&
        !this.observe().history.events.some(later => later.sequence > event.sequence &&
          (later.type === 'work-item-yielded' || later.type === 'work-item-completed') &&
          later.data.workItem === event.data.workItem))
      : undefined;
    // The frontier is read again on every round, because a delegation
    // creates work items while the run is running: a provider work item of a
    // requirement just registered is taken before the next independent entry
    // work item, and that is what makes the scheduling depth-first.
    for (;;) {
      if (this.ports.ignoring()) return false;
      const records = this.observe().records;
      if (this.workflow !== null && replayCapabilityState(this.observe().history.events).stack.length > 1) {
        // Only the active depth-first frame may be reconstructed here. A
        // waiting frame cannot release unrelated ordinary frontier work.
        if (!await this.resumeCapabilityTask(agent, packages, baseline)) return false;
        continue;
      }
      if (records.workItems.length === 0) return true;
      const state = this.scheduleStateOf(records);
      const activeId = restoredActiveItem?.type === 'work-item-started' || restoredActiveItem?.type === 'work-item-resumed' ? restoredActiveItem.data.workItem : undefined;
      restoredActiveItem = undefined;
      const active = records.workItems.find(item => item.id === activeId && !state.completed.has(item.id));
      const next = active === undefined ? nextWorkItem(state) : { item: active, resumes: null };
      if (next === null) {
        const open = records.workItems.filter(item => !state.completed.has(item.id));
        if (open.length === 0) return true;
        // Every remaining item is yielded and no provider it waits for has
        // conformed. Nothing further can run, and the requirements say why.
        const waiting = open.flatMap(item => (state.yielded.get(item.id) ?? []).map(requirement => `${item.id} waits for ${requirement}`));
        await this.ports.fail('unresolvable-requirement',
          `No work item can run: ${waiting.join('; ') || open.map(item => item.id).join(', ')}`,
          open.map(item => workLayout.item(item.id)));
        return false;
      }
      if (await this.takeWorkItem(agent, packages, baseline, next.item, next.resumes) === null) return false;
    }
  }

  /** Rebuild the active capability frame from committed records. An unknown
   * intermediate state remains incomplete; it never releases the frontier. */
  async resumeCapabilityTask(agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>,
    baseline: MeasurementSnapshot): Promise<boolean> {
    const state = replayCapabilityState(this.observe().history.events);
    const activeId = state.stack.at(-1);
    if (activeId === undefined || !(activeId.startsWith('cap-') || activeId.startsWith('capability-task:'))) return true;
    const active = state.tasks.get(activeId);
    if (active === undefined) throw new Error(`Active capability frame ${activeId} has no task`);
    if (active.status !== 'coordinating' && active.status !== 'implementing' && active.status !== 'awaiting-consumer' && active.status !== 'verifying') {
      await this.ports.fail('recovery-exhausted', `Capability ${activeId} remains ${active.status}; its pending effect requires recovery before another invocation`);
      return false;
    }
    const records = this.observe().records;
    const task = records.capabilityTasks.get(activeId);
    const request = task === undefined ? undefined : records.capabilityRequests.get(task.request);
    const plan = records.capabilityPlans.get(activeId)?.at(-1);
    const item = records.workItems.find(entry => entry.id === state.stack[0]);
    if (task === undefined || request === undefined || plan === undefined || item === undefined) {
      await this.ports.fail('recovery-exhausted', `Capability ${activeId} lacks its committed task, request, plan or parent work item`);
      return false;
    }
    if (active.status === 'verifying') return this.recoverVerifyingHandback(task, request, plan);
    if (active.status === 'awaiting-consumer') {
      const entries = active.pendingExchange === null ? undefined : records.capabilityExchanges.get(active.pendingExchange);
      const exchange = entries?.[0];
      const opened = this.events('capability-exchange-opened').find(event => event.data.exchange === active.pendingExchange);
      if (exchange === undefined || opened === undefined) {
        await this.ports.fail('recovery-exhausted', `Capability ${activeId} has no committed pending consumer question`);
        return false;
      }
      const action: Extract<CapabilityAction, { kind: 'consult-consumer' }> = {
        kind: 'consult-consumer', task: task.id, planRevision: exchange.planRevision, invocation: opened.data.invocation,
        question: exchange.question, references: [...exchange.references], sections: ['Recovered pending consultation'],
        registrations: [], reports: [],
      };
      return await this.consultCapabilityConsumer(agent, packages, task, request, plan, action,
        opened.data.invocation, { point: request.continuation.point, session: request.continuation.session }, exchange) !== null;
    }
    if (active.status === 'implementing') {
      const assignment = active.activeAssignment === null ? undefined : records.assignments.get(active.activeAssignment);
      const assigned = this.events('capability-assigned').find(event => event.data.assignment === active.activeAssignment);
      if (assignment === undefined || assigned === undefined) {
        await this.ports.fail('recovery-exhausted', `Capability ${activeId} has no committed active assignment`);
        return false;
      }
      const action: Extract<CapabilityAction, { kind: 'assign' }> = {
        kind: 'assign', task: task.id, planRevision: plan.revision, invocation: assigned.data.invocation,
        registrations: [], reports: [],
        assignment: assignmentBodySchema.parse({ stage: assignment.stage, kind: assignment.kind,
          goal: assignment.goal, approach: assignment.approach,
          scope: { base: assignment.scope.base, extra: assignment.scope.extra,
            read: assignment.scope.read, rationale: assignment.scope.rationale },
          citedElements: assignment.source?.elements ?? [],
          externalCapabilities: assignment.externalCapabilities.map(({ capability, owner, role }) => ({ capability, owner, role })),
          completionEvidence: assignment.completionEvidence,
          authorizations: assignment.authorizations.map(({ path, rationale }) => ({ path, rationale })),
          ...(assignment.obligations === undefined ? {} : { obligations: assignment.obligations }),
          ...(assignment.featureSelection === undefined ? {} : { featureSelection: assignment.featureSelection }),
          ...(assignment.bounds === undefined ? {} : { bounds: assignment.bounds }),
        }),
      };
      const result = await this.assignCapabilityWork(agent, packages, baseline, item, task, plan, action,
        assigned.data.invocation, { point: request.continuation.point, session: request.continuation.session },
        { point: undefined, session: undefined }, assignment);
      return result !== null;
    }
    const delegated = this.events('capability-delegated').find(event => event.data.task === activeId);
    if (delegated === undefined || active.coordinatorInvocation === null) {
      await this.ports.fail('recovery-exhausted', `Capability ${activeId} lacks a delegation or coordinator basis`);
      return false;
    }
    const reconciliationSessions = new Set(this.events('session-opened')
      .filter(event => event.data.fork?.reason === 'reconciliation').map(event => event.data.session));
    const latest = [...this.events('invocation-started')].reverse().find(event => event.data.role === 'capability-architect' &&
      event.data.work.capabilityTask === activeId && event.data.work.request === request.id &&
      !reconciliationSessions.has(event.data.session));
    let point: string | undefined;
    let session: SessionId | undefined;
    let reconstructedFrom: SessionId | undefined;
    let replay: InvocationResult<CapabilityAction> | undefined;
    if (latest !== undefined) {
      const ended = this.events('invocation-ended').find(event => event.data.invocation === latest.data.invocation);
      const outcome = this.ports.committedBody(runLayout.outcome(latest.data.invocation)) as InvocationOutcome | null;
      if (ended?.data.ended === 'submitted') {
        const bytes = await readIfExists(this.path(runLayout.submission(latest.data.invocation)));
        const checkedOutcome = invocationOutcomeSchema.safeParse(outcome);
        const endings = this.events('invocation-ended').filter(event => event.data.invocation === latest.data.invocation);
        const starts = this.events('invocation-started').filter(event => event.data.invocation === latest.data.invocation);
        if (ended.data.submission === null || bytes === undefined || sha256(bytes) !== ended.data.submission || !checkedOutcome.success ||
          checkedOutcome.data.invocation !== latest.data.invocation || checkedOutcome.data.ended !== 'submitted' ||
          checkedOutcome.data.submission?.hash !== ended.data.submission || !checkedOutcome.data.settled.confirmed ||
          endings.length !== 1 || starts.length !== 1 || ended.data.session !== latest.data.session ||
          ended.sequence <= latest.sequence) {
          await this.ports.fail('recovery-exhausted', `Capability ${activeId} has an unauthenticated accepted coordinator action`);
          return false;
        }
        const authenticated = checkedOutcome.data;
        let raw: Record<string, unknown>;
        try { raw = JSON.parse(bytes.toString('utf8')) as Record<string, unknown>; }
        catch {
          await this.ports.fail('recovery-exhausted', `Capability ${activeId} has an invalid accepted coordinator action`);
          return false;
        }
        if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
          await this.ports.fail('recovery-exhausted', `Capability ${activeId} has an invalid accepted coordinator action`);
          return false;
        }
        const { schema: _schema, ...body } = raw;
        const parsed = capabilityActionSchema.safeParse(body);
        if (raw.schema !== 'ramify-agent.capability-action/1' || !parsed.success || parsed.data.task !== task.id) {
          await this.ports.fail('recovery-exhausted', `Capability ${activeId} has an invalid accepted coordinator action`);
          return false;
        }
        if (authenticated.disposition === 'applied') {
          const chosen = parsed.data;
          const effectExists = chosen.kind === 'assign'
            ? this.events('capability-assigned').some(event => event.data.invocation === latest.data.invocation)
            : chosen.kind === 'consult-consumer'
              ? this.events('capability-exchange-opened').some(event => event.data.invocation === latest.data.invocation)
              : chosen.kind === 'request-handback'
                ? this.events('capability-verification-started').some(event => event.data.invocation === latest.data.invocation)
                : true;
          if (!effectExists && chosen.planRevision !== plan.revision) {
            await this.ports.fail('recovery-exhausted', `Capability ${activeId} accepted action names stale plan revision ${chosen.planRevision}`);
            return false;
          }
          if (!effectExists) replay = { id: latest.data.invocation, ended: 'submitted', value: chosen,
            ref: authenticated.session?.ref ?? '', session: latest.data.session, kept: ended.data.kept, outcomeKind: 'submitted' };
        }
      }
      if (ended?.data.kept && outcome?.session?.ref) {
        const continued = await this.ports.appendSession(agent, outcome.session.ref, `recover:${activeId}:${latest.data.invocation}`,
          `Recover capability ${activeId} from the committed plan and task state`);
        if (continued.outcome === 'appended' || continued.outcome === 'already-present') { point = continued.ref; session = latest.data.session; }
      }
      if (session === undefined) reconstructedFrom = latest.data.session;
    }

    if (reconstructedFrom !== undefined) {
      await this.ports.finishSession(reconstructedFrom, 'lost');
    }
    const providerItems = records.workItems.filter(entry => entry.module === task.provider);
    const providerDecisions = [...records.decisions.values()].filter(entry => entry.owner === task.provider);
    const selected = new TextDecoder().decode(await readFile(this.path(runLayout.capturedPlan)));
    const attempt = this.events('invocation-started').filter(event => event.data.role === 'capability-architect' &&
      event.data.work.capabilityTask === activeId && event.data.work.request === request.id).length + (replay === undefined ? 1 : 0);
    const progress = JSON.stringify({ status: active.status, planRevision: active.planRevision,
      assignments: [...active.assignments], exchanges: [...records.capabilityExchanges.values()].filter(entries => entries[0]?.task === activeId) });
    const result = await this.runCapabilityCoordinator(agent, packages, baseline, item, task, request, plan,
      delegated.data.invocation, selected, providerItems, providerDecisions,
      { basis: active.coordinatorInvocation, point, session, progress, attempt,
        ...(reconstructedFrom === undefined ? {} : { reconstructedFrom }),
        ...(replay === undefined ? {} : { replay }) });
    return result !== null && result.kind === 'satisfied';
  }

  /**
   * The committed state the scheduler reads. Every part of it is a
   * projection over the log: a run just recovered and one that never crashed
   * answer the same thing.
   */
  private scheduleStateOf(records: ReturnType<typeof committedRecords>): ScheduleState {
    const yielded = new Map<string, readonly string[]>();
    for (const event of this.observe().history.events) {
      if (event.type === 'work-item-yielded') yielded.set(event.data.workItem, event.data.requirements);
      if (event.type === 'work-item-resumed') yielded.delete(event.data.workItem);
    }
    const completed = new Set(this.events('work-item-completed').map(event => event.data.workItem));
    return {
      items: records.workItems,
      completed,
      yielded,
      requirements: records.requirements,
      conformed: new Set(this.events('provider-conformed').map(event => conformanceKey(event.data.obligation, event.data.revision))),
      bindings: this.bindingsOf(),
      reopened: new Set(records.workItems
        .filter(item => !completed.has(item.id) && this.pendingRevisionReports(records, item.id).length > 0)
        .map(item => item.id)),
    };
  }

  /** One work item's accepted source package, selected before its first assignment. */
  private async orientAndSelectWorkContext(
    agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>,
    item: WorkItem, briefing: WorkItemBriefing, workingDirectory: string,
  ): Promise<{ readonly kind: 'failed' } | { readonly kind: 'ready'; readonly package: WorkPackage; readonly session: SessionId | undefined; readonly ref: string | undefined }> {
    const sourceChanges = await documentChanges(this.projectRoot, this.input.record.planId, this.input.directory, this.input.record.manifest);
    if (sourceChanges.length > 0) {
      await this.ports.fail('inputs-changed', `The captured plan evidence changed before context selection: ${sourceChanges.join('; ')}`, [runLayout.documentManifest]);
      return { kind: 'failed' };
    }
    const evidence = await readAcceptedEvidence(this.input.directory, this.input.record.manifest, acceptedAnalysisReferences(this.observe().history.events));
    if (evidence.status === 'unavailable') {
      await this.ports.fail('inputs-changed', `The accepted context evidence is unavailable: ${evidence.reason}`);
      return { kind: 'failed' };
    }
    const selector = packages.get('context-selector');
    if (selector === undefined || this.observe().policy.context['context-selector'] === undefined) {
      await this.ports.fail('internal', 'The run has no context selector package or captured context policy');
      return { kind: 'failed' };
    }
    const orientationRequirements = [this.planPackage(evidence.catalog,
      [...item.requirementRefs, ...item.acceptanceRefs, ...item.contextRefs])];
    const orientationViews = await this.localViewInputs(item.module);
    // The orientation is built from its inputs by the module architect's own
    // constructor, which `step render` uses too.
    const orientationInputs = (attempt: number, known: KnownFactsInputs): OrientationStepInputs => ({
      schema: stepInputsSchemaId, role: 'local-architect', phase: 'orientation', consultation: localConsultationInputs(this.observe().history.events, item.id), run: { planId: this.input.record.planId, runId: this.input.record.jobId },
      work: { workItem: item.id }, attempt, capabilityWorkflow: this.workflow !== null, limits: this.observe().policy.limits,
      context: contextPolicyOf(this.observe().policy, 'local-architect'), workingDirectory: this.projectRelative(workingDirectory),
      briefing: workBriefingInputs(briefing), requirements: orientationRequirements, known, architectView: orientationViews,
      start: { kind: 'fresh' },
    });
    const orientationStep = async (attempt: number) => constructOrientationStep(
      orientationInputs(attempt, knownFactsInputs(await this.knownProjectFacts([item.module]))), { projectRoot: this.projectRoot, packages });
    const first = await orientationStep(1);
    const orientationBriefing = first.briefingText;
    let orientation = this.events('work-orientation-recorded').find(event => event.data.workItem === item.id);
    const attempts: string[] = [];
    for (const started of this.events('invocation-started')) {
      if (started.data.role !== 'local-architect' || started.data.work.workItem !== item.id) continue;
      const record = this.ports.invocationRecord(started.data.invocation).body;
      if ((record.prompt.manifest?.entries as Array<{ key?: string }> | undefined)?.some(entry => entry.key === `tool:${workOrientationToolName}`)) attempts.push(started.data.invocation);
    }
    if (orientation === undefined) {
      // A completed dedicated orientation may precede its own event if the
      // harness stopped at that boundary. Its accepted submission is enough
      // to publish the same packet without another model call.
      let prior: { id: string; session: SessionId; ref: string | null; value: WorkOrientationSubmission } | undefined;
      for (const ended of [...this.events('invocation-ended')].reverse()) {
        if (ended.data.submission === null) continue;
        const started = this.events('invocation-started').find(event => event.data.invocation === ended.data.invocation);
        if (started?.data.role !== 'local-architect' || started.data.work.workItem !== item.id) continue;
        const outcome = this.ports.effectiveInvocationOutcome(ended.data.invocation);
        if (outcome?.disposition !== 'applied' || !outcome.settled.confirmed || outcome.submission?.hash !== ended.data.submission) continue;
        const raw = await readIfExists(this.path(runLayout.submission(ended.data.invocation)));
        if (raw === undefined || sha256(raw) !== ended.data.submission) continue;
        try {
          const submitted = JSON.parse(raw.toString('utf8')) as { schema?: string };
          if (submitted.schema !== 'ramify-agent.work-orientation/1') continue;
          const { schema: _schema, ...body } = submitted;
          void _schema;
          const value = workOrientationSubmissionSchema.parse(body);
          prior = { id: ended.data.invocation, session: started.data.session, ref: outcome.session?.ref || null, value };
          break;
        } catch { /* Another local submission is not an orientation. */ }
      }
      if (prior === undefined) {
        const count = this.observe().policy.limits.forkRetriesPerRequest + 1;
        for (let attempt = attempts.length + 1; attempt <= count && !this.ports.ignoring(); attempt++) {
          const step = attempt === 1 ? first : await orientationStep(attempt);
          const result = await this.ports.runInvocation<WorkOrientationSubmission>(agent, {
            role: step.role, brief: step.brief, context: step.context, stepInputs: step.before.inputs, consultationPackages: packages, work: step.work, attempt: step.attempt, loaded: step.loaded,
            systemPrompt: step.systemPrompt, prompt: step.prompt, workingDirectory: step.equipment.workingDirectory, start: { mode: 'fresh' },
            toolName: step.submission.toolName, description: step.submission.description,
            inputSchema: step.submission.inputSchema, submissionSchema: step.submission.submissionSchema,
            validate: step.validate, equip: () => ({ builtinTools: [...step.equipment.builtinTools] }),
            scope: { write: null, measurement: null, size: null },
            keep: (ended, value) => ended === 'submitted' && value !== undefined ? kept : finished('not-kept'),
          });
          if (result.id !== '') attempts.push(result.id);
          if (result.ended === 'submitted' && result.value !== undefined) {
            prior = { id: result.id, session: result.session, ref: result.kept && result.ref !== '' ? result.ref : null, value: result.value };
            break;
          }
        }
      }
      if (prior !== undefined) {
        const packet = orientationPacket({ workItem: item.id, briefing: orientationBriefing, submission: prior.value });
        const path = runLayout.orientationPacket(item.id, packet.hash);
        await writeOnce(this.path(path), packet.text);
        await this.ports.write({ type: 'work-orientation-recorded', data: { workItem: item.id, invocation: prior.id, packetHash: packet.hash, packet: path, point: prior.ref } });
        await this.ports.afterWrite('work-orientation-recorded', this.input.record.jobId);
        orientation = this.events('work-orientation-recorded').find(event => event.data.workItem === item.id);
      }
    }
    if (this.ports.ignoring()) return { kind: 'failed' };
    // Missing reusable bytes never weaken authoritative work-item input checks.
    const path = orientation?.data.packet;
    const packetBytes = path && path === runLayout.orientationPacket(item.id, orientation!.data.packetHash)
      ? await readIfExists(this.path(path)).catch(() => undefined) : undefined;
    const usable = packetBytes !== undefined && sha256(packetBytes) === orientation?.data.packetHash;
    const oriented = await this.orientationStartingPoints(item.id);
    // Render explicit discovery pairs once in the shared named section on fresh
    // consumers. Retained packet bytes and their recorded hashes stay immutable.
    const packet = usable && oriented !== undefined
      ? orientationPacket({ workItem: item.id, briefing: orientationBriefing, submission: {
        focus: oriented.submission.focus, currentUnderstanding: oriented.submission.currentUnderstanding, questions: oriented.submission.questions,
      } }).text : usable ? packetBytes.toString('utf8') : orientationBriefing;
    const orientationInvocation = orientation?.data.invocation ?? attempts.at(-1);
    if (orientationInvocation === undefined) throw new Error('Work orientation has no recorded attempt');
    const orientationPoint = usable ? orientation!.data.point : null;
    const source: SelectionSource = { catalog: evidence.catalog, planDeviations: this.planDeviationsOf(),
      workItemElements: [...item.requirementRefs, ...item.acceptanceRefs, ...item.contextRefs] };
    const parentStarted = this.events('invocation-started').find(event => event.data.invocation === orientationInvocation);
    const parentSession = orientationPoint === null ? undefined : parentStarted?.data.session;
    let selectionEvent = this.events('context-selection-recorded').find(event => event.data.workItem === item.id);
    if (selectionEvent === undefined) {
      const selected = await this.selectElements(agent, selector, item, source, {
        packet, orientationInvocation, point: orientationPoint, session: parentSession,
      });
      if (selected === 'failed') return { kind: 'failed' };
      selectionEvent = selected;
    }
    if (selectionEvent === undefined) {
      await this.ports.fail('invalid-submission', `No valid context selection was obtained for ${item.id} within the captured retry bound`);
      return { kind: 'failed' };
    }
    const recorded = await this.recordedSelection(selectionEvent, evidence.catalog);
    if (recorded.status === 'unavailable') {
      await this.ports.fail('inputs-changed', `The recorded context selection of ${item.id} is unavailable: ${recorded.reason}`, [selectionEvent.data.selection]);
      return { kind: 'failed' };
    }
    const changedBeforeDelivery = await documentChanges(this.projectRoot, this.input.record.planId, this.input.directory, this.input.record.manifest);
    if (changedBeforeDelivery.length > 0) {
      await this.ports.fail('inputs-changed', `The captured plan evidence changed before context delivery: ${changedBeforeDelivery.join('; ')}`, [runLayout.documentManifest]);
      return { kind: 'failed' };
    }
    // The package is also carried by the next prompt. That is the exact
    // reconstruction input if the executor lost the parent's session.
    let session = parentSession;
    let ref = orientationPoint ?? undefined;
    const appendKey = sha256(`${this.input.record.jobId}\n${item.id}\n${selectionEvent.data.selection}\n${session ?? 'no-session'}`);
    const appended = this.events('context-package-appended').find(event => event.data.appendKey === appendKey);
    if (appended === undefined) {
      const outcome = await this.ports.effect<BriefAppend>({
        key: `context:${appendKey}`, serialization: 'records',
        intent: () => ({ event: { type: 'context-package-append-requested', data: {
          workItem: item.id, selection: selectionEvent!.data.selection, session: session ?? null, appendKey,
        } }, records: [] }),
        perform: async key => {
          await this.ports.afterWrite('context-package-append-requested', this.input.record.jobId);
          if (session === undefined || ref === undefined) return { session: null, ref: null, outcome: 'no-session', reason: 'No retained parent point' };
          try {
            const answer = await this.ports.appendSession(agent, ref, key, recorded.packageText, 'support:work-item-package');
            if (answer.outcome === 'session-lost') return { session, ref: null, outcome: 'session-lost', reason: 'The parent session was lost' };
            if (answer.outcome === 'conflict') return { session, ref: null, outcome: 'failed', reason: `The parent session did not take the package: ${answer.reason}` };
            return { session, ref: answer.ref, outcome: answer.outcome, reason: null };
          } catch (error) { return { session, ref: null, outcome: 'failed', reason: message(error) }; }
        },
        complete: result => ({ event: { type: 'context-package-appended', data: {
          workItem: item.id, selection: selectionEvent!.data.selection, appendKey, ...result,
        } }, records: [] }),
      });
      await this.ports.afterWrite('context-package-appended', this.input.record.jobId);
      if (outcome.outcome === 'appended' || outcome.outcome === 'already-present') ref = outcome.ref ?? undefined;
      else if (outcome.outcome === 'failed') throw new Error(outcome.reason ?? 'The parent session did not take the context package');
      else { session = undefined; ref = undefined; }
    } else if (appended.data.outcome === 'appended' || appended.data.outcome === 'already-present') {
      ref = appended.data.ref ?? undefined;
    } else if (appended.data.outcome === 'failed') throw new Error(appended.data.reason ?? 'The parent session did not take the context package');
    else { session = undefined; ref = undefined; }
    // A yielded work item may revisit its recorded selection after its
    // original architect session finished. Keep the package, not that session.
    if (session !== undefined && this.ports.sessionState(session) !== 'suspended') {
      session = undefined;
      ref = undefined;
    }
    return { kind: 'ready', package: { text: recorded.packageText, selection: selectionEvent.data.selection, citation: recorded.selection.package }, session, ref };
  }

  /** Whether a placement decision made for this work item names an owner none of its earlier decisions or its own module did. */
  private addsOwner(item: WorkItem, decision: PlacementDecision): boolean {
    if (decision.owner === null || decision.owner === item.module) return false;
    const earlier = [...this.observe().records.decisions.values()]
      .filter(entry => entry.workItem === item.id && entry.id !== decision.id);
    return !earlier.some(entry => entry.owner === decision.owner);
  }

  /** Select a work item's elements again after a decision added an owner, forking its architect's current session point. */
  private async reselectWorkContext(
    agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>, item: WorkItem, current: WorkPackage,
    from: { readonly invocation: string; readonly point: string | null; readonly session: SessionId | undefined }, decision: PlacementDecision,
  ): Promise<WorkPackage | null> {
    const selector = packages.get('context-selector');
    if (selector === undefined) {
      await this.ports.fail('internal', 'The run has no context selector package');
      return null;
    }
    try {
      const catalog = await this.frozenCatalog();
      const packet = [
        `# Selection again for ${item.id}`, '',
        `Placement decision \`${decision.id}\` placed \`${decision.capability}\` in \`${decision.owner}\`, an owner this work item did not have. Select the elements for the work as it now stands; the package it replaces held ${current.citation.elements.join(', ') || 'no element'}.`,
      ].join('\n');
      const selected = await this.selectElements(agent, selector, item,
        { catalog, planDeviations: this.planDeviationsOf(), workItemElements: [...item.requirementRefs, ...item.acceptanceRefs, ...item.contextRefs] },
        { packet, update: packet, orientationInvocation: from.invocation, point: from.point, session: from.session });
      if (selected === 'failed') return null;
      if (selected === undefined) {
        await this.ports.fail('invalid-submission', `No valid context selection was obtained for ${item.id} within the captured retry bound`);
        return null;
      }
      const recorded = await this.recordedSelection(selected, catalog);
      if (recorded.status === 'unavailable') throw new EvidenceUnavailableError(recorded.reason);
      return { selection: selected.data.selection, citation: recorded.selection.package, text: recorded.packageText };
    } catch (error) {
      await this.ports.fail('inputs-changed', `The work-item package of ${item.id} cannot be selected again: ${message(error)}`);
      return null;
    }
  }

  /**
   * One selection of a work item's elements by a read-only fork of its module
   * architect at `from.point`, or a fresh selector from the recorded
   * orientation where no point is retained, which marks it degraded. It
   * records the selection and the package it cites, superseding the work
   * item's earlier selection where there is one.
   */
  private async selectElements(
    agent: AgentPort, selector: LoadedPackage, item: WorkItem, source: SelectionSource,
    from: { readonly packet: string; readonly update?: string; readonly orientationInvocation: string; readonly point: string | null; readonly session: SessionId | undefined },
  ): Promise<RunEventOf<'context-selection-recorded'> | undefined | 'failed'> {
    const supersedes = this.events('context-selection-recorded').filter(event => event.data.workItem === item.id).at(-1)?.data.selection;
    let selectionEvent: RunEventOf<'context-selection-recorded'> | undefined;
    const count = this.observe().policy.limits.forkRetriesPerRequest + 1;
    const workspace = join('work', item.id, 'selector-workspace');
    for (let attempt = 1; attempt <= count && !this.ports.ignoring(); attempt++) {
      const forked = from.point !== null && from.session !== undefined;
      await mkdir(this.path(workspace), { recursive: true });
      // The selection is built from its inputs by its own constructor, which
      // `step render` uses too. A fork inherits the known facts and starting
      // points the inputs record for the fresh start it may fall back to.
      const oriented = await this.orientationStartingPoints(item.id);
      const inputs = validateSelectorInputs({
        schema: stepInputsSchemaId, role: 'context-selector', run: { planId: this.input.record.planId, runId: this.input.record.jobId }, work: { workItem: item.id },
        attempt, capabilityWorkflow: this.workflow !== null, limits: this.observe().policy.limits, context: contextPolicyOf(this.observe().policy, 'context-selector'),
        kind: supersedes === undefined ? 'selection' : 'reselection', goal: item.goal,
        requirements: [this.planPackage(source.catalog, source.workItemElements)],
        packet: from.packet, ...(from.update === undefined ? {} : { update: from.update }),
        catalog: source.catalog, planDeviations: [...source.planDeviations], workItemElements: [...source.workItemElements],
        orientation: { invocation: from.orientationInvocation, point: from.point }, workspace: { run: workspace },
        known: knownFactsInputs(await this.knownProjectFacts([item.module])),
        startingPoints: oriented === undefined ? [] : [JSON.parse(JSON.stringify(oriented.group)) as unknown],
        architectView: await this.localViewInputs(item.module),
        start: forked ? { kind: 'fork', session: from.session!, invocation: from.orientationInvocation, point: from.point! }
          : { kind: 'fresh', degraded: { requested: 'fork', reason: 'the recorded orientation has no retained session point' } },
      });
      const step = constructSelectorStep(inputs, { projectRoot: this.projectRoot, packages: new Map([['context-selector', selector]]) });
      const result = await this.ports.runInvocation<ContextSelectorSubmission>(agent, {
        role: step.role, brief: step.brief, context: step.context, stepInputs: step.before.inputs,
        fallback: this.stepFallback(step.inputs, new Map([['context-selector', selector]])),
        work: step.work, attempt: step.attempt, loaded: step.loaded,
        systemPrompt: step.systemPrompt, prompt: step.prompt, freshPrompt: step.freshPrompt,
        start: step.start.mode === 'fork' ? { mode: 'fork', from: step.start.ref } : { mode: 'fresh' },
        ...(step.fork === undefined ? {} : { fork: step.fork }),
        ...(step.start.mode === 'fresh' && step.start.degraded !== undefined ? { degraded: step.start.degraded } : {}),
        toolName: step.submission.toolName, description: step.submission.description,
        inputSchema: step.submission.inputSchema, submissionSchema: step.submission.submissionSchema,
        validate: step.validate,
        scope: { write: null, measurement: null, size: null }, workingDirectory: step.equipment.workingDirectory,
        equip: () => ({ builtinTools: [...step.equipment.builtinTools] }), keep: () => finished('not-kept'),
      });
      if (result.ended !== 'submitted' || result.value === undefined) continue;
      const prepared = prepareContextSelection(result.value, {
        workItem: item.id, orientationInvocation: from.orientationInvocation,
        orientationPoint: result.actual === 'fork' ? from.point : null, selectorInvocation: result.id,
        degraded: !forked || result.actual !== 'fork',
      }, source);
      if (prepared.status === 'unavailable') continue;
      const changed = await documentChanges(this.projectRoot, this.input.record.planId, this.input.directory, this.input.record.manifest);
      if (changed.length > 0) {
        await this.ports.fail('inputs-changed', `The captured plan evidence changed during context selection: ${changed.join('; ')}`, [runLayout.documentManifest]);
        return 'failed';
      }
      const selectionText = `${JSON.stringify(prepared.selection)}\n`;
      const selectionHash = sha256(selectionText);
      const selectionPath = runLayout.selectionVersion(item.id, selectionHash);
      await writeOnce(this.path(selectionPath), selectionText);
      await this.ports.write({ type: 'context-selection-recorded', data: {
        workItem: item.id, selection: selectionPath, selectionHash, packageHash: prepared.selection.package.hash,
        ...(supersedes === undefined ? {} : { supersedes }),
      } });
      await this.ports.afterWrite('context-selection-recorded', this.input.record.jobId);
      selectionEvent = this.events('context-selection-recorded').filter(event => event.data.workItem === item.id).at(-1);
      break;
    }
    return selectionEvent;
  }

  /**
   * The work item responsible for each subject revision. A registration
   * binds its obligation to the provider work item it started and each of
   * its requirements to the consumer work item whose iteration established
   * the agreement; a revision records its bindings itself, because it may
   * bind a subject to a work item that already exists.
   */
  private bindingsOf(): Map<string, string> {
    return bindingsOf(this.observe().history);
  }

  /** The work item bound to one subject's current revision, or null where nothing binds it. */
  private boundItem(subject: string, revision: number): string | null {
    return this.bindingsOf().get(bindingKey(subject, revision)) ?? null;
  }

  /**
   * The `revision-needed` reports this work item has not answered. A report
   * is delivered once: the architect's next turn has it in its own history,
   * and repeating it would read as a second report.
   */
  private pendingRevisionReports(
    records: ReturnType<typeof committedRecords>,
    workItem: string,
  ): Array<RunEventOf<'revision-needed'>> {
    const lastTurn = this.events('invocation-started')
      .filter(event => event.data.role === 'local-architect'
        && records.invocations.get(event.data.invocation)?.work.workItem === workItem)
      .at(-1)?.sequence ?? 0;
    return this.events('revision-needed')
      .filter(event => event.data.consumerWorkItem === workItem && event.sequence > lastTurn);
  }

  /** The requirement revisions a `requirement-verified` has closed. */
  verifiedRequirements(): Set<string> {
    return verifiedRequirements(this.observe().history);
  }

  /**
   * The requirements one work item owes that no `requirement-verified` has
   * closed. The scheduling binding decides whose they are, not the
   * requirement's own `workItem`: a revision may bind a requirement to a
   * follow-up while its record keeps naming the item it followed.
   */
  private openRequirementsOf(records: ReturnType<typeof committedRecords>, workItem: string): ConsumerRequirement[] {
    return openRequirementsOf(this.observe().history, records, workItem);
  }

  /**
   * The obligation one provider work item currently owes: the latest
   * revision of its own obligation that is bound to it. A completed item
   * that a revision rebound elsewhere owes nothing more.
   */
  private obligationOwedBy(item: WorkItem, records: ReturnType<typeof committedRecords>): ProviderObligation | null {
    return obligationOwedBy(this.observe().history, item, records);
  }

  /** The agreements one work item consumes, which are the ones its architect may revise. */
  private contractsConsumedBy(records: ReturnType<typeof committedRecords>, workItem: string): Set<string> {
    const bindings = this.bindingsOf();
    const contracts = new Set<string>();
    for (const requirement of records.requirements.values()) {
      const bound = bindings.get(bindingKey(requirement.id, requirement.revision)) ?? requirement.workItem;
      if (bound !== workItem) continue;
      const contract = this.observe().records.obligations.get(requirement.obligation)?.contract.id;
      if (contract !== undefined) contracts.add(contract);
    }
    return contracts;
  }

  /** The count of iterations this work item has been assigned, contract sub-sessions included. */
  private assignedCount(workItem: string): number {
    return assignedCount(this.observe().history, workItem);
  }

  /** The capability one work item is implementing, whatever its origin. */
  private capabilityOfItem(item: WorkItem, records: ReturnType<typeof committedRecords>): string | null {
    if ('entry' in item.origin) return item.origin.entry;
    if ('obligation' in item.origin) return records.obligations.get(item.origin.obligation.id)?.capability ?? null;
    if ('integration' in item.origin || 'finalVerification' in item.origin) return null;
    const requirement = records.requirements.get(item.origin.verification.id);
    return requirement?.forCapability ?? null;
  }

  /**
   * One work item: its start, the hypothesis revisions it receives, the
   * continuing session of its module architect, the iterations that architect
   * assigns, and the `work-item` gate that is the only thing that closes it.
   *
   * A failing gate returns to the same architect, which may revise its
   * outline or assign a repair; exhaustion of the policy's repair rounds
   * fails the run with the original cause preserved.
   */
  private async takeWorkItem(
    agent: AgentPort,
    packages: ReadonlyMap<string, LoadedPackage>,
    baseline: MeasurementSnapshot,
    item: WorkItem,
    resumes: readonly string[] | null,
  ): Promise<'completed' | 'yielded' | 'reported' | null> {
    const loaded = packages.get('local-architect')!;
    if (!this.events('work-item-started').some(event => event.data.workItem === item.id)) {
      const integration = integrationScenarioOf(item);
      await this.ports.write({
        type: 'work-item-started',
        data: { globalTarget: captureGlobalTarget({ planId: this.input.record.planId, runId: this.input.record.jobId }, this.globalContextOf()), workItem: item.id, module: item.module, origin: originKindOf(item), ...(integration === null ? {} : { scenario: integration }) },
      });
      await this.ports.afterWrite('work-item-started', this.input.record.jobId);
      if (this.ports.ignoring()) return null;
    }
    // The providers this item waited for have conformed. Resumption licenses
    // the architect to assign verification; the requirements stay open until
    // that verification replaces the fake and passes, and waiting for them
    // here would wait for this item itself.
    const previousResume = this.events('work-item-resumed').filter(event => event.data.workItem === item.id).at(-1);
    if (resumes !== null && !(this.observe().restoring && previousResume !== undefined && canonicalJson(previousResume.data.requirements) === canonicalJson(resumes)
      && !this.events('work-item-yielded').some(event => event.data.workItem === item.id && event.sequence > previousResume.sequence))) {
      await this.ports.write({ type: 'work-item-resumed', data: { workItem: item.id, requirements: [...resumes], globalTarget: captureGlobalTarget({ planId: this.input.record.planId, runId: this.input.record.jobId }, this.globalContextOf()) } });
      await this.ports.afterWrite('work-item-resumed', this.input.record.jobId);
      if (this.ports.ignoring()) return null;
    }

    const initialRecords = this.observe().records;
    const currentIndex = this.observe().index;
    const moduleEntry = currentIndex === null ? undefined : findModule(currentIndex, item.module);
    const proposal = initialRecords.registry.find(entry => entry.owner === item.module)?.proposed;
    const onboarding = moduleEntry !== undefined || proposal !== undefined
      ? await onboardingOf(this.projectRoot, moduleEntry?.dir ?? proposal!.directory)
      : { path: '(module directory unavailable)', purpose: null, missing: 'the assigned module is absent from the architect view and no proposal gives its directory' };
    let views = await apiViewsOf(this.options.ramify, this.projectRoot, this.observe().index, item.module);
    const moduleDirectory = moduleEntry?.dir;
    const moduleSource = moduleDirectory === undefined ? null : join(this.projectRoot, moduleDirectory, 'src');
    // A continued session keeps the same cwd even if a module engineer creates the module later.
    const workingDirectory = moduleSource !== null && (await stat(moduleSource).catch(() => null))?.isDirectory()
      ? moduleSource
      : this.projectRoot;
    const scope = baselineScope(item.module, []);
    const integration = await this.integrationOfItem(item);

    let sessionRef: string | undefined;
    /** The session this architect's turns share, while the harness keeps it; `sessionRef` is its executor's point. */
    let session: SessionId | undefined;
    /** The work item's current package: the selection that cites it and its text. */
    let contextPackage: WorkPackage | undefined;
    /** A re-selection's package, which the next prompt carries once. */
    let packageUndelivered = false;
    /** Why its next turn continues that session: what happened since its last turn. */
    let continuing: ContinueReason | undefined;
    let attempt = 0;
    let originalLocalInvocation: string | undefined;
    let gateRound = 0;
    let failedGate: { id: string; cause: string | null; summary: string[] } | undefined;
    /** The cause of the first gate that failed; exhaustion preserves it. */
    /** The last assignment of this work item, whose own tests probe a failing project gate. */
    let lastAssignment: IterationAssignment | undefined;
    /** What the last iteration of this work item ended with, for the architect that receives it. */
    let lastResult: IterationResult | undefined;
    /** The gate that returned that iteration, where one did, with what it found. */
    let lastIterationGate: { id: string; cause: string | null; summary: readonly string[] } | undefined;
    /** A placement request of this work item that came back without a decision. */
    let unresolvedRequest: { id: string; findings: readonly string[]; gaps: readonly string[] } | undefined;
    /** The plan deviation the plan architect recorded for this work item's last unresolved request, delivered once. */
    let deviationRecorded: PlanDeviation | undefined;
    /** The environment problem the plan architect reported for that request, after which the operator resumed the run, delivered once. */
    let environmentResumed: { problem: EnvironmentProblem; note: string } | undefined;
    /** A cycle one of this item's registrations closed, delivered once as a finding. */
    let cycleFinding: DependencyCycle | undefined;
    /** Providers of this item's requirements that reported they cannot conform. */
    let revisionReports: DelegationBriefing['revisionsNeeded'];
    /** Why completion was refused, where it was. */
    let blocked: string[] | undefined;
    let released = resumes;
    /** The reconciliation that returns this work item to its architect: a correction, or a brief that did not land. */
    let returned: string | undefined;
    /** The rounds whose brief the architect's own session lacks, which its next input carries from the log. */
    const undelivered: string[] = [];

    // A recovered handback still owes the original A engineer its suspended
    // iteration. Its assignment remains open; no new module architect turn
    // may assign over it or treat the handback as completion of A's goal.
    if (this.workflow !== null && supportedCapabilityPolicy(this.observe().policy.version)) {
      const saved = this.observe().records;
      const capabilityState = replayCapabilityState(this.observe().history.events);
      const unqualified = [...saved.capabilityRequests.values()].find(request =>
        request.parent.kind === 'work-item' && request.parent.id === item.id &&
        capabilityState.requests.get(request.id)?.task === null &&
        capabilityState.requests.get(request.id)?.qualification === undefined &&
        !saved.results.has(request.assignment));
      if (unqualified !== undefined) {
        const assignment = saved.assignments.get(unqualified.assignment);
        const raw = await readIfExists(this.path(runLayout.submission(unqualified.invocation)));
        const submitted = raw === undefined ? null : JSON.parse(raw.toString('utf8')) as Record<string, unknown>;
        let parsed: EngineerSubmission | undefined;
        try { if (submitted !== null) parsed = parseRecordedEngineerSubmission(submitted, this.input.record.identityContract ?? 'legacy'); }
        catch (error) {
          await this.ports.fail('recovery-exhausted', `Pending request ${unqualified.id} has an invalid recorded engineer submission: ${message(error)}`);
          return null;
        }
        if (assignment === undefined || parsed?.kind !== 'capability-needed') {
          await this.ports.fail('recovery-exhausted', `Pending request ${unqualified.id} cannot recover its original module engineer submission`);
          return null;
        }
        const suspended: SuspendedCapabilityOutcome = { kind: 'capability-needed', summary: parsed.summary,
          need: parsed.request, invocation: unqualified.invocation,
          session: unqualified.continuation.session, point: unqualified.continuation.point ?? '' };
        const answer = await this.coordinateCapabilityNeed(agent, packages, baseline, item, assignment, suspended,
          undefined, { session: undefined, point: undefined, workingDirectory }, unqualified);
        if (answer === null || answer.kind === 'delegated') return null;
        if (answer.kind === 'satisfied') { session = answer.parent.session; sessionRef = answer.parent.point || undefined; }
        lastAssignment = assignment;
        let resumed = await this.takeIteration(agent, packages, baseline, item, assignment, await this.ports.refreshIndex(), {
          session: suspended.session, point: suspended.point, priorInvocation: suspended.invocation, guidance: answer.guidance,
        });
        if (resumed === null) return null;
        while (resumed.kind === 'capability-needed') {
          const next = await this.coordinateCapabilityNeed(agent, packages, baseline, item, assignment, resumed, undefined,
            { session, point: sessionRef, workingDirectory });
          if (next === null || next.kind === 'delegated') return null;
          if (next.kind === 'satisfied') { session = next.parent.session; sessionRef = next.parent.point || undefined; }
          resumed = await this.takeIteration(agent, packages, baseline, item, assignment, await this.ports.refreshIndex(), {
            session: resumed.session, point: resumed.point, priorInvocation: resumed.invocation, guidance: next.guidance,
          });
          if (resumed === null) return null;
        }
        lastResult = resumed.result;
        lastIterationGate = resumed.returnedGate;
        continuing = 'capability-returned';
      }
      const pending = [...saved.capabilityRequests.values()].find(request =>
        request.parent.kind === 'work-item' && request.parent.id === item.id &&
        saved.capabilityHandbacks.has(capabilityState.requests.get(request.id)?.task ?? '') &&
        saved.assignments.has(request.assignment) && !saved.results.has(request.assignment));
      if (pending !== undefined) {
        const handback = saved.capabilityHandbacks.get(capabilityState.requests.get(pending.id)!.task!)!;
        const assignment = saved.assignments.get(pending.assignment)!;
        const qualified = await this.replayAcceptedCapabilityQualification(pending, 'local-architect');
        if (qualified === null) return null;
        if (qualified === undefined) {
          await this.ports.fail('recovery-exhausted', `Handback ${handback.task} has no accepted original local qualification result`);
          return null;
        }
        session = qualified.session; sessionRef = qualified.ref || undefined;
        lastAssignment = assignment;
        const guidance = [
          `Capability ${handback.task} handed back at ${handback.returnedTree}.`,
          capabilityHandbackGuidance(this.path('.'), handback),
          `Continue ${assignment.id} from its current candidate. Its original goal remains unfinished.`,
        ].join('\n');
        let resumed = await this.takeIteration(agent, packages, baseline, item, assignment, await this.ports.refreshIndex(), {
          session: pending.continuation.session, point: pending.continuation.point ?? '',
          priorInvocation: pending.invocation, guidance,
        });
        if (resumed === null) return null;
        while (resumed.kind === 'capability-needed') {
          const answer = await this.coordinateCapabilityNeed(agent, packages, baseline, item, assignment, resumed, undefined,
            { session, point: sessionRef, workingDirectory });
          if (answer === null || answer.kind === 'delegated') return null;
          if (answer.kind === 'satisfied') { session = answer.parent.session; sessionRef = answer.parent.point || undefined; }
          resumed = await this.takeIteration(agent, packages, baseline, item, assignment, await this.ports.refreshIndex(), {
            session: resumed.session, point: resumed.point, priorInvocation: resumed.invocation, guidance: answer.guidance,
          });
          if (resumed === null) return null;
        }
        lastResult = resumed.result;
        lastIterationGate = resumed.returnedGate;
        continuing = 'capability-returned';
      }
    }

    if (this.observe().restoring && continuing !== 'capability-returned') {
      const main: RunEvent[] = [];
      for (const event of this.events('invocation-started').filter(event => event.data.role === 'local-architect' && event.data.work.workItem === item.id && event.data.work.request === undefined)) {
        const record = this.ports.invocationRecord(event.data.invocation).body;
        const declarations = record.prompt.manifest?.entries as Array<{ key?: string }> | undefined;
        if (!declarations || declarations.some(entry => entry.key === `tool:${localArchitectToolName}`)) main.push(event);
      }
      const latest = main.at(-1);
      if (latest?.type === 'invocation-started' && !this.events('work-item-yielded').some(event => event.data.invocation === latest.data.invocation)) {
        originalLocalInvocation = latest.data.invocation;
        const original = invocationSchema.parse(this.ports.committedBody(runLayout.invocation(originalLocalInvocation)));
        const previous = this.ports.effectiveInvocationOutcome(originalLocalInvocation);
        attempt = original.attempt - 1; session = latest.data.session;
        sessionRef = previous?.session?.ref || original.session.from || undefined;
        continuing = lastResult === undefined ? latest.data.continues?.reason ?? 'context-selected' : 'iteration-closed';
        const selection = await this.currentSelection(item.id);
        if (selection) contextPackage = { text: selection.packageText, selection: selection.event.data.selection, citation: selection.selection.package };
      }
    }

    turns: for (;;) {
      if (this.ports.ignoring()) return null;
      attempt += 1;
      const current = this.observe().records;
      // The view is refreshed before the architect's turn, so the rules its
      // submission is judged by are applied against the project as it stands.
      let index = await this.ports.refreshIndex();
      // A view that could not be materialized is materialized again for each
      // later turn, rather than repeating a failure the project may have outgrown.
      if (attempt > 1 && views.unavailable !== null) views = await apiViewsOf(this.options.ramify, this.projectRoot, this.observe().index, item.module);
      // This turn is a coordination point: the hypothesis revisions this
      // work item holds reach it here, before it assigns anything.
      const hypotheses = await this.deliverHypotheses(item, current.hypotheses);
      if (hypotheses === null) return null;
      const registry = new Map(current.registry.map(entry => [entry.capability, entry]));
      const outlines = current.outlines.get(item.id) ?? [];
      const open = this.openRequirementsOf(current, item.id);
      // The guarded paths as they stand: an authorization may name one of
      // these and nothing else, because a gate compares nothing else. The
      // configuration and the feature files are the harness's alone, so no
      // authorization names them.
      const scenarioFiles = await this.guardedScenarioFiles();
      const harnessOnly = new Set([projectConfigurationFile, ...(scenarioFiles.expected ?? []).map(file => file.path)]);
      const guardedFiles = (await captureGuardedFiles(
        this.projectRoot,
        this.requiredArtifacts(current).map(artifact => artifact.path),
        scenarioFiles,
        await this.auditPreparationPaths(),
      )).filter(file => !harnessOnly.has(file.path));
      const guarded = new Set(guardedFiles.map(file => file.path));
      const conformed = new Set(this.events('provider-conformed').map(event => conformanceKey(event.data.obligation, event.data.revision)));
      // A provider's report reaches this architect once, here, even while
      // this work item is yielded: what blocks it is the agreement.
      revisionReports ??= this.pendingRevisionReports(current, item.id).map(event => ({
        obligation: event.data.obligation.id,
        revision: event.data.obligation.revision,
        contract: this.observe().records.obligations.get(event.data.obligation.id)?.contract.id
          ?? (() => { throw new Error(`Provider obligation ${event.data.obligation.id} has no accepted contract relationship`); })(),
        iteration: event.data.iteration,
        detail: (current.results.get(event.data.iteration)?.findings ?? []).join('; '),
      }));
      // The scenarios of this work item's entry, in the states this turn
      // finds them, and what the last accepted iteration's gate bound.
      const scenarioLedger = trackedScenarios(this.observe().history.lines);
      const scenarios = entryScenariosOf(scenarioLedger.records, scenarioLedger.states, 'entry' in item.origin ? item.origin.entry : null);
      const lastScenarios = lastResult === undefined ? [] : await this.passedScenarioLines(lastResult);
      let briefing: WorkItemBriefing = {
        item,
        setup: await this.checkInputSection(),
        testAreas: (await moduleTestAreas(this.projectRoot, this.observe().index)).filter(area => area.module === item.module),
        onboarding,
        views,
        defaultWriteScope: await this.defaultWriteScopes(index, [item.module], guardedFiles.filter(file => file.hash !== null).map(file => file.path)),
        hypotheses,
        registry: current.registry,
        // The decisions this work item is party to: the ones made for it,
        // and the ones whose consequences name it.
        decisions: [...current.decisions.values()].filter(decision =>
          decision.workItem === item.id
          || decision.revises?.affected.some(affected => affected.workItem === item.id) === true),
        outlines,
        delegation: {
          open: open.map(requirement => ({
            requirement: requirement.id,
            capability: current.obligations.get(requirement.obligation)?.capability ?? requirement.forCapability,
            provider: current.obligations.get(requirement.obligation)?.provider ?? 'unknown',
            conformed: conformed.has(conformanceKey(requirement.obligation, requirement.contractRevision)),
            fakeInjections: requirement.evidence.fakeInjections,
            suite: current.obligations.get(requirement.obligation)?.evidence.conformance ?? [],
          })),
          released: released ?? [],
          obligation: obligationBriefingOf(item, current),
          ...(cycleFinding === undefined ? {} : { cycle: cycleFinding }),
          ...(blocked === undefined ? {} : { blocked }),
          ...(revisionReports === undefined || revisionReports.length === 0 ? {} : { revisionsNeeded: revisionReports }),
        },
        ...(unresolvedRequest === undefined ? {} : { unresolvedRequest }),
        // The deviation that just answered this architect's unresolved
        // request; every deviation after its package is rendered below.
        ...(deviationRecorded === undefined ? {} : { deviationRecorded: deviationRecorded.id }),
        ...(environmentResumed === undefined ? {} : { environmentResumed }),
        ...(returned === undefined ? {} : { reconciliation: this.ports.reconciliationBriefing(returned, undelivered) }),
        ...(integration === undefined ? {} : { integration }),
        ...(scenarios.length === 0 ? {} : { scenarios }),
        ...(failedGate === undefined ? {} : { failedGate }),
        ...(lastResult === undefined ? {} : {
          lastIteration: {
            id: lastResult.iteration,
            outcome: lastResult.outcome,
            findings: lastResult.findings,
            ...(lastResult.recommendation === undefined ? {} : { recommendation: lastResult.recommendation }),
            commit: lastResult.commit,
            ...(lastIterationGate === undefined ? {} : { gate: lastIterationGate }),
            ...(lastScenarios.length === 0 ? {} : { scenarios: lastScenarios }),
            ...(lastResult.failure !== undefined
              ? { bounds: lastResult.failure.digest.bounds, failure: lastResult.failure }
              : lastAssignment === undefined ? {} : { bounds: this.engineerBounds(lastAssignment) }),
          },
        }),
        bounds: engineerBoundsOf(this.observe().policy.limits),
        runDirectory: this.input.directory,
        projectRoot: this.projectRoot,
        workingDirectory,
        ...(moduleEntry !== undefined || proposal !== undefined ? { moduleDirectory: moduleEntry?.dir ?? proposal!.directory } : {}),
      };
      if (attempt === 1) {
        const context = await this.orientAndSelectWorkContext(agent, packages, item, briefing, workingDirectory);
        if (context.kind === 'failed') return null;
        if (context.kind === 'ready') {
          contextPackage = context.package;
          // A recovered handback already authenticated its accepted qualification
          // point. The context selection still supplies the package and the
          // immutable review fork source; it cannot rewind this action session.
          if (continuing !== 'capability-returned' || sessionRef === undefined) {
            session = resumes === null ? context.session : undefined;
            sessionRef = resumes === null ? context.ref : undefined;
            continuing = sessionRef === undefined ? undefined : 'context-selected';
          }
        }
      }
      // The package is in the session once: appended after the orientation,
      // or carried by the first prompt of a session that lacks it, such as a
      // reconstruction. Every other turn names it by its hash.
      let packageInPrompt = contextPackage !== undefined && (sessionRef === undefined || packageUndelivered);
      const owned = this.obligationBriefing({ kind: 'work-item', id: item.id });
      let intervening: string | undefined;
      if (attempt === 1 && this.workflow !== null) {
        const tasks = [...current.capabilityHandbacks.values()].flatMap(handback => {
          const task = current.capabilityTasks.get(handback.task);
          return task?.deferredWorkItems.includes(item.id) ? [{ task, handback }] : [];
        });
        if (tasks.length > 0) intervening = tasks.map(({ task, handback }) =>
          `Task ${task.id} returned tree ${handback.returnedTree} at ${handback.sourceRevision}. ` +
          `${capabilityHandbackGuidance(this.path('.'), handback)}\n` +
          `This task did not complete ${item.id}. Reassess its prior outline, decisions and any unexecuted assignment against the current source before assigning it.`
        ).join('\n\n');
      }
      const recovery = await this.continuationEvidence({ workItem: item.id }, index);
      if (recovery !== undefined) intervening = [intervening, recovery].filter(value => value !== undefined).join('\n\n');
      const assignmentCount = this.assignedCount(item.id);
      if (assignmentCount >= 3) {
        intervening = [intervening,
          `# Progress reconsideration\n${item.id} has had ${assignmentCount} assignments. Review the retained results and unmet requirements before the next action. Decide whether another attempt is likely to resolve a requirement, whether the approach or a prerequisite must change, or whether satisfied requirements need no further refinement. If you repeat an unsuccessful approach, explain the new evidence or reason to expect progress. The count is a prompt for your judgment, not a verdict.`]
          .filter(value => value !== undefined).join('\n\n');
      }
      // The turn is built from its inputs by the module architect's own
      // constructor, which `step render` uses too.
      const requirements = contextPackage === undefined
        ? [this.planPackage(await this.frozenCatalog(), [...item.requirementRefs, ...item.acceptanceRefs, ...item.contextRefs])] : [];
      const oriented = await this.orientationStartingPoints(item.id);
      const orientedEvent = this.events('work-orientation-recorded').find(event => event.data.workItem === item.id);
      const projection = this.obligationProjection();
      const plain = <V>(value: V): V => JSON.parse(JSON.stringify(value)) as V;
      let step: ConstructedWorkTurnStep;
      const retainedRepair = this.latestRepairIncident();
      const pendingRepair = retainedRepair?.incident.workItem === item.id && retainedRepair.incident.verification?.verified === true
        && retainedRepair.incident.continuation?.delivered !== true ? retainedRepair.incident : undefined;
      const preparation = pendingRepair ? repairPreparationSchema.parse(this.ports.committedBody(pendingRepair.preparation.path))
        : lastResult?.outcome !== 'partial' ? undefined : await this.recordRepairPreparation(item, attempt, lastAssignment, lastResult);
      let repaired: { incident: RepairIncidentRecord; delta: RepairDelta } | undefined;
      if (pendingRepair) {
        repaired = { incident: { ...pendingRepair, revision: pendingRepair.revision + 1 },
          delta: repairDeltaSchema.parse(this.ports.committedBody(runLayout.repairDelta(pendingRepair.incidentId))) };
        sessionRef = undefined; session = undefined; originalLocalInvocation = undefined; packageUndelivered = true;
        intervening = [intervening, `Automatic repair restored preparation. Original iteration ${lastResult?.iteration} remains partial. Repair report: ${JSON.stringify(pendingRepair.result)}. Reassess the current candidate and assign remaining work through ordinary authority.`].filter(value => value !== undefined).join('\n\n');
      }
      let refreshPreparation = false;
      const prepareTurn = async (): Promise<ConstructedWorkTurnStep> => {
        if (refreshPreparation) {
          index = await this.ports.refreshIndex();
          views = await apiViewsOf(this.options.ramify, this.projectRoot, this.observe().index, item.module);
          briefing = { ...briefing, views, defaultWriteScope: await this.defaultWriteScopes(index, [item.module], guardedFiles.filter(file => file.hash !== null).map(file => file.path)) };
          refreshPreparation = false;
        }
        const turn = validateWorkTurnInputs({
          schema: stepInputsSchemaId, role: 'local-architect', phase: 'work-turn', consultation: localConsultationInputs(this.observe().history.events, item.id), run: { planId: this.input.record.planId, runId: this.input.record.jobId },
          work: { workItem: item.id }, attempt, capabilityWorkflow: this.workflow !== null, limits: this.observe().policy.limits,
          context: contextPolicyOf(this.observe().policy, 'local-architect'), workingDirectory: this.projectRelative(workingDirectory),
          briefing: workBriefingInputs(briefing),
          ...(contextPackage === undefined ? {} : {
            package: { hash: contextPackage.citation.hash, elements: [...contextPackage.citation.elements], deviations: [...contextPackage.citation.deviations], text: contextPackage.text },
            ...this.laterDeviations(await this.frozenCatalog(), contextPackage.citation.deviations),
          }),
          packageInPrompt, obligationLines: owned, ...(intervening === undefined ? {} : { intervening }),
          requirements, known: knownFactsInputs(await this.knownProjectFacts([item.module])),
          architectView: await this.localViewInputs(item.module),
          startingPoints: lastResult === undefined || lastAssignment === undefined ? [] : [plain(await this.engineerStartingPoints(lastAssignment, lastResult))],
          ...(oriented === undefined ? {} : { orientation: { group: plain(oriented.group),
            session: (orientedEvent === undefined ? undefined : this.events('invocation-started').find(event => event.data.invocation === orientedEvent.data.invocation)?.data.session) ?? null } }),
          validation: {
            hypotheses: plain(current.hypotheses), decisions: plain([...current.decisions.values()]), workItems: current.workItems.map(entry => entry.id),
            openRequirements: open.map(requirement => requirement.id), contracts: [...this.contractsConsumedBy(current, item.id)],
            guardedPaths: [...guarded], harnessOnly: [...harnessOnly],
            obligations: { entries: plain([...projection.obligations.entries()]), tests: projection.tests },
            scope: { view: this.input.record.manifest.architectView, revision: this.assignedCount(item.id) + 1 },
          },
          start: sessionRef === undefined
            ? { kind: 'fresh', ...(continuing === undefined ? {} : { continuing }) }
            : { kind: 'continued', point: sessionRef, ...(session === undefined ? {} : { session }), ...(continuing === undefined ? {} : { continuing }) },
        });
        return constructWorkTurnStep(turn, { projectRoot: this.projectRoot, packages });
      };
      let externallyRetried = false;
      const finishPreparation = async (): Promise<boolean> => {
        if (preparation !== undefined && !this.events('repair-preparation-consumed').some(event => event.data.preparation === preparation.id)) {
          await this.ports.write({ type: 'repair-preparation-consumed', data: { preparation: preparation.id, workItem: item.id } });
          await this.ports.afterWrite('repair-preparation-consumed', this.input.record.jobId);
        }
        return true;
      };
      while (true) {
        if (this.ports.ignoring()) return null;
        try {
          step = await prepareTurn();
          if (!await finishPreparation()) continue;
          break;
        } catch (error) {
          const semantic = error instanceof OwnershipUnavailableError || error instanceof OwnershipAuthorityError || error instanceof z.ZodError;
          if ((this.observe().policy.recovery && semantic) || (!this.observe().policy.recovery && preparation === undefined)) {
            await this.ports.fail('inputs-changed', `The work-item package of ${item.id} cannot be rendered: ${message(error)}`);
            return null;
          }
          let answer: Awaited<ReturnType<WorkCoordination['automaticProjectRepair']>> | undefined;
          if (preparation !== undefined && !externallyRetried) {
            try {
              answer = await this.automaticProjectRepair(agent, packages, baseline, preparation, error, async report => {
                // Prepared assignments and old action sessions are not reused after repair.
                sessionRef = undefined; session = undefined; originalLocalInvocation = undefined;
                packageUndelivered = true;
                intervening = [intervening, `Automatic repair restored preparation. Original iteration ${lastResult!.iteration} remains partial. Repair report: ${JSON.stringify(report)}. Reassess the current candidate and assign remaining work through ordinary authority.`].filter(value => value !== undefined).join('\n\n');
                index = await this.ports.refreshIndex();
                packageInPrompt = contextPackage !== undefined;
                views = await apiViewsOf(this.options.ramify, this.projectRoot, this.observe().index, item.module);
                briefing = { ...briefing, views };
                return await prepareTurn();
              });
            } catch (repairError) {
              if (!this.ports.ignoring()) {
                const active = this.latestRepairIncident();
                if (active !== undefined && ['admitted', 'running'].includes(active.stage)) {
                  const started = this.events('invocation-started').find(event => event.data.work.automaticRepair === active.incident.incidentId);
                  await this.persistRepairIncident({ ...active.incident, revision: active.incident.revision + 1,
                    invocation: started?.data.invocation ?? null, session: started?.data.session ?? null, endedAt: this.ports.now().toISOString(),
                    verification: { verified: false, reason: `Repair workflow could not settle: ${message(repairError)}`, evidence: [] },
                    continuation: { delivered: false, reason: 'Repair workflow failed before verified handback; manual attention required', evidence: [] } }, 'unverified');
                }
                await this.ports.fail(this.ports.writer.blocked() === null ? 'inputs-changed' : 'writer-unsettled',
                  `Original architect obstruction: ${message(error)}. Automatic repair workflow failed: ${message(repairError)}`);
              }
              return null;
            }
          }
          if (answer === null) return null;
          if (answer !== undefined && !('refusal' in answer)) {
            if (answer.step === null) throw new Error('Ordinary architect preparation requires its constructed task');
            step = answer.step; repaired = answer;
            if (!await finishPreparation()) continue;
            break;
          }
          const diagnostic = `The work-item package of ${item.id} cannot be rendered: ${message(error)}` +
            (answer !== undefined && 'refusal' in answer ? `. Automatic repair refused: ${answer.refusal}` : '');
          if (!await this.ports.waitOperationRecovery({ kind: 'preparation', role: 'local-architect', work: { workItem: item.id },
            source: sessionRef ?? null, ...(session === undefined ? {} : { session }),
            },
            { classification: 'preparation', diagnostic }, [], 0)) return null;
          externallyRetried = true;
          refreshPreparation = true;
          // Admission retries this pure preparation, preserving the partial result
          // and the recorded refusal. It creates no new root-repair authority.
          intervening = [intervening, await this.continuationEvidence({ workItem: item.id }, this.observe().index)]
            .filter(value => value !== undefined).join('\n\n');
        }
      }
      packageUndelivered = false;
      // A finding is delivered once: the next turn of this same architect
      // has it in its own history, and repeating it would read as a second
      // detection.
      cycleFinding = undefined;
      blocked = undefined;
      deviationRecorded = undefined;
      environmentResumed = undefined;
      released = null;
      revisionReports = [];
      returned = undefined;
      undelivered.length = 0;

      // A completion request that leaves an obligation of this architect
      // without a done report is rejected in this same turn, under the
      // submission validator, before any outline, commit or gate.
      let unreported: string[] = [];
      const result = await this.ports.runInvocation<LocalArchitectSubmission>(agent, {
        role: step.role,
        originalInvocation: originalLocalInvocation,
        brief: step.brief,
        context: step.context,
        stepInputs: step.before.inputs, consultationPackages: packages,
        fallback: this.stepFallback(step.inputs, packages),
        work: step.work,
        attempt: step.attempt,
        loaded: step.loaded,
        systemPrompt: step.systemPrompt,
        prompt: step.prompt,
        workingDirectory: step.equipment.workingDirectory,
        start: step.start.mode === 'continue' ? { mode: 'continue', ref: step.start.ref } : { mode: 'fresh' },
        session,
        continuing: step.continuing,
        // The architect is continued after a placement request, an
        // unresolved request the plan architect answered, an iteration and
        // a refused or failed completion. A yield ends its use: a resumed
        // work item starts afresh.
        keep: (ended, value) => (ended === 'submitted' && value !== undefined && value.kind !== 'yield-for-providers'
          ? kept
          : finished('not-kept')),
        toolName: step.submission.toolName,
        description: step.submission.description,
        inputSchema: step.submission.inputSchema,
        submissionSchema: step.submission.submissionSchema,
        equip: () => ({ builtinTools: [...step.equipment.builtinTools], tools: [createGitInspectionTool(this.projectRoot)] }),
        ...(!packageInPrompt ? {} : { singleAdmission: true, onStarted: async (invocation: string, destination: SessionId) => {
          await this.ports.write({ type: 'context-package-prompt-bound', data: {
            workItem: item.id, selection: contextPackage!.selection, packageHash: contextPackage!.citation.hash,
            invocation, session: destination,
          } });
        } }),
        // The submission is judged against the step's evidence and the view
        // as it stands. The scope is captured before the submission is
        // accepted, so a scope the provider refuses is answered here with its
        // path and the turn's remaining attempts, and nothing of it is committed.
        validate: async input => {
          const previousAssignment = await this.continuationAssignment({ workItem: item.id });
          const judged = await judgeWorkTurn(step, input, { index, ramify: this.options.ramify, projectRoot: this.projectRoot, previousAssignment, validatePrevious: async () => { if (previousAssignment !== undefined) await this.ports.ownershipAuthority(previousAssignment).read(); } });
          // What the last rejected request left unreported, which an
          // exhausted turn's failure names.
          if (judged.unreported !== undefined) unreported = [...judged.unreported];
          if (judged.prepared !== undefined) this.preparedScopes.set(judged.prepared.body, judged.prepared.scope);
          return judged.verdict;
        },
        scope: {
          write: null,
          measurement: this.input.record.baseline && 'measurement' in this.input.record.baseline ? this.input.record.baseline.measurement : null,
          size: null,
        },
        measured: { snapshot: baseline, scope: scope },
      });
      originalLocalInvocation = undefined;
      sessionRef = result.kept && result.ref !== '' ? result.ref : undefined;
      session = sessionRef === undefined ? undefined : result.session;

      if (repaired !== undefined && result.id !== '') {
        await this.persistRepairIncident({ ...repaired.incident,
          continuation: { delivered: true, reason: 'Fresh responsible architect received the original partial result and current candidate', evidence: [runLayout.invocation(result.id)] } }, 'continued',
          [{ path: runLayout.repairDelta(repaired.incident.incidentId), id: repaired.incident.incidentId, revision: 1, body: repaired.delta }]);
      }

      if (this.ports.ignoring()) return null;
      if (result.ended !== 'submitted' || result.value === undefined) {
        // An exhausted rejection bound is a rejected-submissions result: it
        // names what the last rejected completion request left unreported,
        // and says nothing about the code.
        const owed = result.ended === 'invalid-submission' && unreported.length > 0
          ? `; its last rejected completion request left ${unreported.join(', ')} without a done report` : '';
        await this.ports.fail(
          result.ended === 'invalid-submission' ? 'invalid-submission' : result.ended === 'failed' ? 'agent-failed' : 'internal',
          `The module architect of ${item.id} ended without a result (${result.ended})${owed}`,
          [runLayout.outcome(result.id)],
        );
        return null;
      }

      // The architect's registrations and reports apply on acceptance, before
      // its action and whatever the action leads to: reporting continues
      // alongside coordination, and no gate or audit outcome edits them.
      if (result.value.kind !== 'yield-for-providers'
        && !await this.ports.handling.recordObligations({ kind: 'work-item', id: item.id }, result.id, result.value)) return null;

      if (result.value.kind === 'unresolved') {
        // The request cannot be met as stated. The plan architect answers
        // it: a placement fix, a plan deviation this work item goes on
        // under, an environment problem the run holds for until the
        // operator resumes it, or nothing possible, which ends the run.
        const resolution = await this.resolveUnresolved(agent, packages, baseline, item, {
          invocation: result.id, conflict: result.value.conflict, evidence: result.value.evidence,
        });
        if (resolution === null) return null;
        unresolvedRequest = undefined;
        if (resolution.kind === 'deviation') {
          deviationRecorded = resolution.deviation;
          continuing = 'deviation-recorded';
        } else if (resolution.kind === 'environment') {
          environmentResumed = { problem: resolution.problem, note: resolution.note };
          continuing = 'environment-resumed';
        } else {
          continuing = 'placement-answered';
        }
        continue;
      }

      if (result.value.kind === 'request-placement') {
        // The work item leaves its repair path for a placement question;
        // what it bound or reported stays as it is.
        const resolution = await this.requestPlacement(agent, packages, baseline, item, result.value.request);
        if (resolution === null) return null;
        unresolvedRequest = resolution.kind === 'unresolved'
          ? { id: resolution.request, findings: resolution.findings, gaps: resolution.gaps }
          : undefined;
        // A decision that adds an owner to the work item may bring other
        // fixed requirements into play, so the work item selects again from
        // its architect's current point; later assignments cite the new
        // package, which the next prompt carries once.
        if (resolution.kind === 'decided' && contextPackage !== undefined && this.addsOwner(item, resolution.decision)) {
          const reselected = await this.reselectWorkContext(agent, packages, item, contextPackage,
            { invocation: result.id, point: result.ref ?? null, session: result.session }, resolution.decision);
          if (reselected === null) return null;
          contextPackage = reselected;
          packageUndelivered = true;
        }
        continuing = 'placement-answered';
        continue;
      }

      if (result.value.kind === 'yield-for-providers') {
        // A yield moves no obligation: what was bound stays bound.
        await this.ports.write({
          type: 'work-item-yielded',
          data: { workItem: item.id, requirements: [...result.value.requirements], invocation: result.id },
        });
        await this.ports.afterWrite('work-item-yielded', this.input.record.jobId);
        return this.ports.ignoring() ? null : 'yielded';
      }

      if (result.value.kind === 'assign') {
        const assigned = await this.assignIteration(item, result.id, result.value, index, registry, architectRefOf(result));
        if (assigned === null) return null;
        lastAssignment = assigned;
        // A direct revision is a contract iteration of this work item: the
        // contract engineer establishes it, and the agreement in force stays
        // in force until that iteration's gate passes.
        if (assigned.revisesContract !== undefined) {
          const revised = await this.reviseContract(agent, packages, baseline, item, assigned);
          if (revised === null) return null;
          if (revised.result !== undefined) lastResult = revised.result;
          lastIterationGate = undefined;
          failedGate = undefined;
          if (revised.cycle !== undefined) cycleFinding = revised.cycle;
          continuing = 'iteration-closed';
          continue;
        }
        let outcome = await this.takeIteration(agent, packages, baseline, item, assigned, index);
        if (outcome === null) return null;
        while (outcome.kind === 'capability-needed') {
          const answer = await this.coordinateCapabilityNeed(agent, packages, baseline, item, assigned, outcome, contextPackage,
            { session, point: sessionRef, workingDirectory });
          if (answer === null) return null;
          if (answer.kind === 'delegated') return 'reported';
          if (answer.kind === 'satisfied') { session = answer.parent.session; sessionRef = answer.parent.point || undefined; }
          outcome = await this.takeIteration(agent, packages, baseline, item, assigned, index, {
            session: outcome.session, point: outcome.point, priorInvocation: outcome.invocation, guidance: answer.guidance,
          });
          if (outcome === null) return null;
        }
        lastResult = outcome.result;
        // An iteration that spent its repair rounds moves no obligation:
        // a binding or a done report stays until a submission changes it.
        lastIterationGate = outcome.returnedGate;
        failedGate = undefined;
        // The provider reported that the agreement cannot be met. This work
        // item's turn ends here: what blocks it is the consumer architect's
        // to answer, and the report is already in the log. Its next turn
        // starts a session of its own.
        if (outcome.reportedRevision === true) {
          await this.ports.finishSession(session, 'not-kept');
          return 'reported';
        }
        if (outcome.need !== undefined) {
          const contract = await this.takeContract(agent, packages, baseline, item, {
            ...outcome.need,
            requestedBy: assigned.id,
          });
          if (contract === null) return null;
          const reported = outcome.result;
          // A contract engineer that ended without a result is reported
          // with its digest and analysis, in place of the need's.
          lastResult = {
            ...reported,
            findings: [...reported.findings, ...contract.findings],
            ...(contract.result?.failure === undefined ? {} : { failure: contract.result.failure }),
          };
          if (contract.cycle !== undefined) cycleFinding = contract.cycle;
        }
        continuing = 'iteration-closed';
        continue;
      }

      // Completion is refused while a requirement of this work item is open,
      // and while the obligation it exists for is not conformed: a
      // fake-backed pass never completes a capability, and the gate's verdict
      // on the tests says nothing about which provider ran. Missing done
      // reports never reach here: validation rejected such a request.
      const blockers = completionBlockers(this.observe().history, item, this.workflow !== null);
      if (blockers.blocked.length > 0) {
        blocked = blockers.blocked;
        continuing = 'completion-refused';
        continue;
      }

      if (await this.ports.handling.reviseOutline({
        item, invocation: result.id, outline: result.value.outline,
        identityContract: this.input.record.identityContract ?? 'legacy',
        hypothesesSeen: hypotheses.map(hypothesis => refOf(hypothesis.id, hypothesis.revision, hypothesis)),
        architectRef: architectRefOf(result),
      }) === null) return null;
      this.ports.wakeReviews();
      if (this.ports.ignoring()) return null;

      // Before the gate, the work item's reviews settle and what they
      // raised, or newly unavailable advisory results, receive the architect
      // decision; a completion whose basis no longer holds is
      // reconciled again when its current evidence calls for it.
      const parent: ParentSession = { session, ref: sessionRef, undelivered, workingDirectory };
      let gate: GateAttempt | null = null;
      for (;;) {
        const reconciled = await this.ports.reconcileWorkItem(agent, loaded, item, parent);
        session = parent.session;
        sessionRef = parent.ref;
        if (reconciled === null) return null;
        if (reconciled.kind === 'correct') {
          // The architect's own session assigns the correction, through the
          // configured gate and relevant verification.
          returned = reconciled.reconciliation;
          continuing = 'reconciliation';
          continue turns;
        }
        if (undelivered.length > 0) returned = this.ports.latestBasis(item.id)?.id;
        gate = await this.ports.gates.workItemGate(item, result.id, gateRound, result.value.summary, undefined, this.observe().restoring);
        gateRound += 1;
        if (gate === null) return null;
        if (gate.verdict !== 'passed') break;
        const completed = await this.ports.completeWorkItem(item, gate, reconciled.basis);
        if (completed === 'ended' || this.ports.ignoring()) return null;
        if (completed === 'completed') {
          await this.ports.afterWrite('work-item-completed', this.input.record.jobId);
          await this.ports.finishSession(session, 'work-closed');
          return 'completed';
        }
        blocked = [completed.refused];
        continuing = 'completion-refused';
        continue turns;
      }
      if (gate === null) return null;

      failedGate = await this.ports.diagnosticsOf(gate, 'local-architect');
      continuing = 'repair';
    }
  }

  /** The run's architect context, as its log and its committed outcomes hold it. */
  private globalContextOf(): GlobalContext {
    const records = this.observe().records;
    const context = globalContext({
      events: this.observe().history.events,
      sessionRef: invocation => records.outcomes.get(invocation)?.session?.ref,
    });
    return context.session !== null && this.ports.sessionState(context.session) === 'finished' ? { ...context, ref: null, point: null } : context;
  }

  /**
   * The identity of the view a decision is recorded against. The revision
   * and the input identity come from the view that was read; the coverage
   * limits come from its own metadata, and where those cannot be read the
   * limit says so rather than reporting none.
   */
  async viewIdentityOf(index: ArchitectIndex | null): Promise<ViewIdentity> {
    return projectViewIdentity(this.projectRoot, index);
  }

  async readDecision(id: string): Promise<PlacementDecision | null> {
    const read = architectureSchemas.decision.body.safeParse(this.ports.committedBody(architectureLayout.decision(id)));
    return read.success ? read.data as PlacementDecision : null;
  }

  /**
   * The hypothesis revisions this work item holds at its coordination point.
   * A revision a decision made reaches the work items it involves before
   * their next assignment, and delivery rewrites nothing: the architect
   * assesses what it means for the work that remains.
   */
  private async deliverHypotheses(item: WorkItem, hypotheses: readonly Hypothesis[]): Promise<Hypothesis[] | null> {
    const deliveries = this.events('hypotheses-delivered').filter(event => event.data.workItem === item.id);
    const relevant = hypothesesFor(item, hypotheses);
    const refs = relevant.map(hypothesis => refOf(hypothesis.id, hypothesis.revision, hypothesis));
    const last = deliveries.at(-1);
    const delivered = last !== undefined
      && last.data.refs.length === refs.length
      && refs.every((ref, index) => {
        const before = last.data.refs[index];
        return before !== undefined && before.id === ref.id && before.revision === ref.revision && before.hash === ref.hash;
      });
    if (!delivered) {
      await this.ports.write({ type: 'hypotheses-delivered', data: { workItem: item.id, refs } });
      await this.ports.afterWrite('hypotheses-delivered', this.input.record.jobId);
      if (this.ports.ignoring()) return null;
    }
    return relevant;
  }

  /**
   * One global placement request, from the module architect that made it to
   * the decision returned to it. Requests run one at a time: the harness
   * pauses implementation writes, refreshes the architect view and records
   * its identity with the request, then forks the architect context's latest
   * point. The fork investigates and decides; the parent neither reassesses
   * nor approves, and is never invoked for the choice.
   */
  private async replayAcceptedBoundaryFork(request: string, view: ViewIdentity):
    Promise<InvocationResult<ForkSubmission> | null | undefined> {
    const started = [...this.events('invocation-started')].reverse().find(event =>
      event.data.role === 'global-fork' && event.data.work.request === request);
    if (started === undefined || this.events('fork-returned-partial').some(event =>
      event.data.request === request && event.data.invocation === started.data.invocation)
      || this.events('fork-name-rejected').some(event =>
        event.data.request === request && event.data.invocation === started.data.invocation)) return undefined;
    const ended = this.events('invocation-ended').find(event => event.data.invocation === started.data.invocation);
    if (ended?.data.ended !== 'submitted' || ended.data.submission === null) return undefined;
    const priorView = [...this.events('view-refreshed')].reverse().find(event =>
      event.sequence < started.sequence && event.data.request === request);
    if (priorView === undefined || !sameView(priorView.data.view, view)) {
      await this.ports.fail('inputs-changed', `Accepted fork of ${request} has a changed architect view`);
      return null;
    }
    const outcome = this.ports.committedBody(runLayout.outcome(started.data.invocation)) as InvocationOutcome | null;
    const bytes = await readIfExists(this.path(runLayout.submission(started.data.invocation)));
    if (bytes === undefined || sha256(bytes) !== ended.data.submission ||
      outcome?.submission?.hash !== ended.data.submission || outcome.disposition !== 'applied' ||
      !outcome.settled.confirmed) {
      await this.ports.fail('recovery-exhausted', `Fork of ${request} has an unauthenticated accepted result`);
      return null;
    }
    const raw = JSON.parse(bytes.toString('utf8')) as Record<string, unknown>;
    const { schema: _schema, ...body } = raw;
    const descriptive = this.input.record.identityContract === 'descriptive' && raw.schema === 'ramify-agent.fork-submission/2';
    const parsed = (descriptive ? descriptiveForkSubmissionSchema : forkSubmissionSchema).safeParse(body);
    if (raw.schema !== (descriptive ? 'ramify-agent.fork-submission/2' : 'ramify-agent.fork-submission/1') || !parsed.success) {
      await this.ports.fail('recovery-exhausted', `Fork of ${request} has an invalid accepted result`);
      return null;
    }
    return { id: started.data.invocation, ended: 'submitted', value: parsed.data,
      ref: outcome.session?.ref ?? '', session: started.data.session,
      kept: ended.data.kept, outcomeKind: 'submitted' };
  }

  private async recoveredBoundaryPartial(request: string): Promise<{
    attempt: number; findings: string[]; gaps: string[] } | undefined> {
    const partial = this.events('fork-returned-partial').filter(event => event.data.request === request).at(-1);
    if (partial === undefined) return undefined;
    const ended = this.events('invocation-ended').find(event => event.data.invocation === partial.data.invocation);
    const bytes = await readIfExists(this.path(runLayout.submission(partial.data.invocation)));
    if (ended?.data.submission === null || bytes === undefined || sha256(bytes) !== ended?.data.submission) {
      throw new Error(`The partial fork of ${request} lost its accepted evidence`);
    }
    const raw = JSON.parse(bytes.toString('utf8')) as Record<string, unknown>;
    const { schema: _schema, ...body } = raw;
    const descriptive = this.input.record.identityContract === 'descriptive' && raw.schema === 'ramify-agent.fork-submission/2';
    const parsed = (descriptive ? descriptiveForkSubmissionSchema : forkSubmissionSchema).safeParse(body);
    if (raw.schema !== (descriptive ? 'ramify-agent.fork-submission/2' : 'ramify-agent.fork-submission/1') || !parsed.success || parsed.data.kind !== 'partial') {
      throw new Error(`The partial fork of ${request} has invalid accepted evidence`);
    }
    return { attempt: partial.data.retry, findings: [...parsed.data.findings], gaps: [...parsed.data.gaps] };
  }

  private async requestPlacement(
    agent: AgentPort,
    packages: ReadonlyMap<string, LoadedPackage>,
    baseline: MeasurementSnapshot,
    item: WorkItem,
    body: PlacementRequestBody,
    existingId?: string,
  ): Promise<PlacementResolution | null> {
    const loaded = packages.get('global-fork');
    if (loaded === undefined) {
      await this.ports.fail('internal', 'No prompt package is loaded for the plan architect');
      return null;
    }

    const count = this.events('placement-requested').length + 1;

    const id = existingId ?? (this.input.record.identityContract === 'descriptive'
      ? descriptivePlacementRequestId(item.id, body.forCapability, count) : requestId(count));
    const committed = this.observe().records;
    if (this.input.record.identityContract === 'descriptive') {
      const subject = body.forCapability;
      const accepted = committed.retirements.has(subject) ? false : subject.startsWith('capability-task:')
        ? committed.capabilityTasks.get(subject)?.parent.id === item.id
        : subject.startsWith('capability-request:')
          ? committed.capabilityRequests.get(subject)?.parent.id === item.id
          : subject.startsWith('capability:')
            ? committed.registry.some(entry => entry.capability === subject)
            : false;
      if (!accepted) {
        await this.ports.fail('inputs-changed', `Placement subject ${subject} is not an accepted capability, request or task of ${item.id}`);
        return null;
      }
    }
    const request = existingId === undefined ? placementRequestSchema.parse({
      schema: this.input.record.identityContract === 'descriptive' ? 'ramify-agent.placement-request/2' : 'ramify-agent.placement-request/1',
      id,
      workItem: item.id,
      requester: item.module,
      forCapability: body.forCapability,
      question: body.question,
      requiredBehavior: body.requiredBehavior,
      findings: body.findings.map(finding => ({ text: finding.text, citations: finding.citations.map(citation => ({ ...citation })) })),
      candidates: body.candidates.map(candidate => ({ ...candidate })),
      unresolved: [...body.unresolved],
      // The revision and the hash are the harness's: the request names a
      // hypothesis, and the record says which revision of it was tested.
      hypotheses: body.hypotheses.flatMap(tested => {
        const hypothesis = committed.hypotheses.find(candidate => candidate.id === tested.hypothesis);
        if (hypothesis === undefined) return [];
        return [{ ref: refOf(hypothesis.id, hypothesis.revision, hypothesis), stance: tested.stance, evidence: tested.evidence }];
      }),
      localDecisions: [...body.localDecisions],
      globalSource: globalForkSourceSchema.parse(this.globalContextOf()),
    } satisfies PlacementRequest) : placementRequestSchema.parse(this.ports.committedBody(architectureLayout.request(id)));

    if (existingId !== undefined) {
      const accepted = this.events('decision-accepted').find(event => event.data.request === id);
      if (accepted !== undefined) {
        const decision = committed.decisions.get(accepted.data.decision);
        if (decision === undefined || !await this.deliverDecision(decision)) {
          await this.ports.fail('recovery-exhausted', `Placement ${id} has no recoverable accepted decision`);
          return null;
        }
        return { kind: 'decided', decision };
      }
    }
    if (existingId === undefined) await this.ports.write({
      type: 'placement-requested',
      data: { request: id, workItem: item.id, requester: item.module, capability: body.forCapability },
    }, [{ path: architectureLayout.request(id), id, revision: 1, body: request }]);
    if (existingId === undefined) await this.ports.afterWrite('placement-requested', this.input.record.jobId);
    if (this.ports.ignoring()) return null;

    const systemPrompt = renderGlobalForkPrompt(loaded, this.projectRoot);
    const bound = this.observe().policy.limits.forkRetriesPerRequest;
    const measured = baselineScope(
      this.options.rootModule ?? rootModuleOf(this.observe().index) ?? rootModuleOfSnapshot(baseline) ?? 'root',
      // Each invocation's own package and the plan are its support documents.
      [],
    );
    let partial: { attempt: number; findings: string[]; gaps: string[] } | undefined = existingId === undefined
      ? undefined : await this.recoveredBoundaryPartial(id);
    let revalidate: { was: string; now: string } | undefined;

    for (;;) {
      if (this.ports.ignoring()) return null;
      // Implementation writes are paused and the tools of the last
      // invocation have settled before the evidence is taken.
      this.ports.writer.requireSettled(`The architect view for ${id} cannot be refreshed`);

      const attempt = this.events('view-refreshed').filter(event => event.data.request === id).length + 1;
      const index = await this.ports.refreshIndex();

      const view = await this.viewIdentityOf(index);
      // A failed refresh does not make an older view current; what it could
      // not establish stays explicit in the decision's own gaps.
      const unavailable = index === null
        ? 'the architect view could not be refreshed for this request, so what it does not show is not established'
        : null;
      await this.ports.write({ type: 'view-refreshed', data: { request: id, attempt, view, unavailable } });
      await this.ports.afterWrite('view-refreshed', this.input.record.jobId);
      if (this.ports.ignoring()) return null;

      const current = this.observe().records;
      const context = request.globalSource;
      if (context === undefined) {
        await this.ports.fail('recovery-exhausted', `Placement ${id} has no recorded oriented request-time parent or named rebuild`);
        return null;
      }
      const decisions = [...current.decisions.values()];
      const replay = existingId === undefined ? undefined : await this.replayAcceptedBoundaryFork(id, view);
      if (replay === null) return null;
      const result = replay ?? await this.ports.runInvocation<ForkSubmission>(agent, {
        role: 'global-fork',
        work: { workItem: item.id, request: id },
        attempt,
        loaded,
        systemPrompt,
        prompt: forkMessage({
          request,
          view,
          ...(unavailable === null ? {} : { viewUnavailable: unavailable }),
          registry: current.registry,
          hypotheses: current.hypotheses,
          decisions,
          // A parent that was rebuilt has no session to fork: the next fork
          // is oriented from the records, and becomes the context itself.
          ...(partial === undefined ? {} : { partial }),
          ...(revalidate === undefined ? {} : { revalidate }),
        }),
        start: context.ref === null ? { mode: 'fresh' } : { mode: 'fork', from: context.ref },
        ...(context.ref === null ? { degraded: { requested: 'fork' as const, reason: 'The plan architect context is unavailable; using the ordinary request records' } } : {}),
        ...(context.point === null ? {} : {
          fork: { from: context.point, reason: 'placement-request', generation: context.generation, briefs: [...context.appended] },
        }),
        keep: () => finished('not-kept'),
        toolName: forkToolName,
        description: 'End this fork with its decision, or with the findings and gaps of a fork that could not decide. The harness validates it; an invalid submission is returned with every error and its path.',
        inputSchema: forkJsonSchema,
        submissionSchema: 'ramify-agent.fork-submission/1',
        validate: input => validateFork(input, placementEvidenceOf(current, index)),
        scope: {
          write: null,
          measurement: this.input.record.baseline && 'measurement' in this.input.record.baseline ? this.input.record.baseline.measurement : null,
          size: null,
        },
        measured: { snapshot: baseline, scope: measured },
      });

      if (this.ports.ignoring()) return null;
      if (result.ended !== 'submitted' || result.value === undefined) {
        await this.ports.fail(
          result.ended === 'invalid-submission' ? 'invalid-submission' : result.ended === 'failed' ? 'agent-failed' : 'internal',
          `The placement fork of ${id} ended without a result (${result.ended})`,
          [runLayout.outcome(result.id)],
        );
        return null;
      }

      if (result.value.kind === 'partial') {
        const retry = this.events('fork-returned-partial').filter(event => event.data.request === id).length + 1;
        await this.ports.write({ type: 'fork-returned-partial', data: { request: id, invocation: result.id, retry } });
        await this.ports.afterWrite('fork-returned-partial', this.input.record.jobId);
        if (this.ports.ignoring()) return null;
        partial = { attempt, findings: [...result.value.findings], gaps: [...result.value.gaps] };
        revalidate = undefined;
        // Exhaustion returns an unresolved outcome to the module architect.
        // The parent is never invoked to supply the choice the fork could
        // not make.
        if (retry > bound) return { kind: 'unresolved', request: id, findings: partial.findings, gaps: partial.gaps };
        continue;
      }

      // The evidence must still be the evidence the fork decided on. Two
      // revisions are never combined: the affected investigation repeats.
      const now = await this.viewIdentityOf(await this.ports.refreshIndex());
      if (!sameView(view, now)) {
        const partials = this.events('fork-returned-partial').filter(event => event.data.request === id).length;
        const revalidations = attempt - partials;
        revalidate = { was: identityOf(view), now: identityOf(now) };
        partial = undefined;
        if (revalidations > bound) {
          return {
            kind: 'unresolved',
            request: id,
            findings: [],
            gaps: [`the architect view changed under every investigation of ${id}; it was ${revalidate.was} and is ${revalidate.now}`],
          };
        }
        continue;
      }

      if (result.value.kind !== 'decision') {
        await this.ports.fail('internal', `The placement fork of ${id} answered ${result.value.kind}, which only an unresolved request accepts`, [runLayout.submission(result.id)]);
        return null;
      }
      const decision = await this.acceptForkDecision(agent, item, id, result.id, result.value, view, current);
      return decision === null ? null : { kind: 'decided', decision };
    }
  }

  /**
   * Accepts one fork's decision for a request: commits it with its registry
   * and hypothesis revisions, appends its brief to the architect context
   * and delivers it to the work item. Null once the run has ended.
   */
  private async acceptForkDecision(
    agent: AgentPort,
    item: WorkItem,
    id: string,
    invocation: string,
    value: Extract<ForkSubmission, { kind: 'decision' }>,
    view: ViewIdentity,
    current: ReturnType<typeof committedRecords>,
  ): Promise<PlacementDecision | null> {
    const decisionId = globalDecisionId(id);
    const accepted = acceptDecision({
      id: decisionId,
      authority: 'global',
      request: id,
      workItem: item.id,
      invocation,
      body: value.decision,
      registry: value.registry,
      hypothesisRevisions: value.hypothesisRevisions,
      brief: value.brief,
      view,
      committed: {
        registry: new Map(current.registry.map(entry => [entry.capability, entry])),
        hypotheses: new Map(current.hypotheses.map(hypothesis => [hypothesis.id, hypothesis])),
      },
    });

    await this.appendBrief(agent, accepted.decision, {
      input: {
        type: 'decision-accepted',
        data: {
          request: id,
          decision: decisionId,
          workItem: item.id,
          invocation,
          registry: accepted.registry.length,
          hypotheses: accepted.hypotheses.length,
        },
      },
      records: accepted.records,
    });
    if (this.ports.ignoring()) return null;
    if (!await this.deliverDecision(accepted.decision)) return null;
    return accepted.decision;
  }

  /**
   * A module architect's `unresolved` answer: its request cannot be met as
   * stated. The harness records it as an unresolved request and forks the
   * architect context with it, as for a placement request. The fork answers
   * with a placement decision, delivered as a placement answer is; with a
   * plan deviation, recorded with the CheckFinding that asks the person to
   * accept or reject it, under which the work item goes on; with an
   * environment problem, which holds the work item until the operator
   * resumes the run; or with nothing possible, which ends the run, as does a
   * fork that cannot decide within its retries. Null once the run has ended.
   */
  private async resolveUnresolved(
    agent: AgentPort,
    packages: ReadonlyMap<string, LoadedPackage>,
    baseline: MeasurementSnapshot,
    item: WorkItem,
    answer: { readonly invocation: string; readonly conflict: string; readonly evidence: readonly string[] },
    existingId?: string,
  ): Promise<UnresolvedResolution | null> {
    const loaded = packages.get('global-fork');
    if (loaded === undefined) {
      await this.ports.fail('internal', 'No prompt package is loaded for the plan architect');
      return null;
    }
    // Unresolved requests retain their own stable identities across recovery.

    const count = this.events('unresolved-requested').filter(event => event.data.workItem === item.id).length + 1;
    const id = existingId ?? (this.input.record.identityContract === 'descriptive'
      ? descriptiveUnresolvedRequestId(item.id, count) : unresolvedRequestId(this.events('unresolved-requested').length + 1));
    const request = existingId === undefined ? unresolvedRequestSchema.parse({
      schema: this.input.record.identityContract === 'descriptive' ? 'ramify-agent.unresolved-request/2' : 'ramify-agent.unresolved-request/1',
      id,
      workItem: item.id,
      requester: item.module,
      invocation: answer.invocation,
      conflict: answer.conflict,
      evidence: [...answer.evidence],
      globalSource: globalForkSourceSchema.parse(this.globalContextOf()),
    } satisfies UnresolvedRequest) : unresolvedRequestSchema.parse(this.ports.committedBody(deviationLayout.request(id)));
    if (existingId !== undefined) {
      const accepted = this.events('decision-accepted').find(event => event.data.request === id);
      if (accepted !== undefined) {
        const decision = this.observe().records.decisions.get(accepted.data.decision);
        if (decision === undefined || !await this.deliverDecision(decision)) {
          await this.ports.fail('recovery-exhausted', `Unresolved request ${id} has no recoverable accepted decision`);
          return null;
        }
        return { kind: 'decided', decision };
      }
      const deviationEvent = this.events('plan-deviation-recorded').find(event => event.data.request === id);
      if (deviationEvent !== undefined) {
        const deviation = planDeviationSchema.parse(this.ports.committedBody(deviationLayout.deviation(deviationEvent.data.deviation)));
        if (deviation.scenarios.length > 0 && !await this.rewordScenarios(deviation)) return null;
        if (deviation.held && !await this.awaitDeviationDecision(deviation)) return null;
        return { kind: 'deviation', deviation };
      }
      const environmentEvent = this.events('environment-reported').find(event => event.data.request === id);
      if (environmentEvent !== undefined) {
        const problem = environmentProblemSchema.parse(this.ports.committedBody(deviationLayout.environment(environmentEvent.data.problem)));
        const note = await this.awaitEnvironmentAnswer(problem);
        return note === null ? null : { kind: 'environment', problem, note };
      }
    }
    if (existingId === undefined) await this.ports.write({
      type: 'unresolved-requested',
      data: { request: id, workItem: item.id, requester: item.module, invocation: answer.invocation },
    }, [{ path: deviationLayout.request(id), id, revision: 1, body: request }]);
    if (this.ports.ignoring()) return null;

    const plan = new TextDecoder().decode(await readFile(this.path(runLayout.capturedPlan)));
    const planFile = planPath(this.input.record.planId);
    // The fork reads the work item's package, with every deviation recorded
    // so far, and a deviation amends its elements by ID.
    let catalog: ElementCatalog;
    let workElements: readonly string[];
    try {
      catalog = await this.frozenCatalog();
      workElements = (await this.currentSelection(item.id))?.selection.package.elements
        ?? [...item.requirementRefs, ...item.acceptanceRefs, ...item.contextRefs];
    } catch (error) {
      await this.ports.fail('inputs-changed', `The package of ${item.id} cannot be read for its unresolved request: ${message(error)}`);
      return null;
    }
    const unresolvable = (detail: string, evidence: readonly string[]) => this.ports.fail('unresolvable-requirement',
      `The module architect of ${item.id} reports the request cannot be met as stated (${answer.conflict}), and ${detail}`,
      [deviationLayout.request(id), runLayout.submission(answer.invocation), ...answer.evidence, ...evidence]);
    const systemPrompt = renderGlobalForkPrompt(loaded, this.projectRoot);
    const bound = this.observe().policy.limits.forkRetriesPerRequest;
    const measured = baselineScope(
      this.options.rootModule ?? rootModuleOf(this.observe().index) ?? rootModuleOfSnapshot(baseline) ?? 'root',
      // Each invocation's own package and the plan are its support documents.
      [],
    );
    let partial: { attempt: number; findings: string[]; gaps: string[] } | undefined = existingId === undefined
      ? undefined : await this.recoveredBoundaryPartial(id);
    let revalidate: { was: string; now: string } | undefined;

    for (;;) {
      if (this.ports.ignoring()) return null;
      this.ports.writer.requireSettled(`The architect view for ${id} cannot be refreshed`);

      const attempt = this.events('view-refreshed').filter(event => event.data.request === id).length + 1;
      const index = await this.ports.refreshIndex();
      const view = await this.viewIdentityOf(index);
      const unavailable = index === null
        ? 'the architect view could not be refreshed for this request, so what it does not show is not established'
        : null;
      await this.ports.write({ type: 'view-refreshed', data: { request: id, attempt, view, unavailable } });
      if (this.ports.ignoring()) return null;

      const current = this.observe().records;
      const context = request.globalSource;
      if (context === undefined) {
        await this.ports.fail('recovery-exhausted', `Unresolved request ${id} has no recorded oriented request-time parent or named rebuild`);
        return null;
      }
      const decisions = [...current.decisions.values()];
      const tracked = trackedScenarios(this.observe().history.lines);
      const replay = existingId === undefined ? undefined : await this.replayAcceptedBoundaryFork(id, view);
      if (replay === null) return null;
      const result = replay ?? await this.ports.runInvocation<ForkSubmission>(agent, {
        role: 'global-fork',
        work: { workItem: item.id, request: id },
        attempt,
        loaded,
        systemPrompt,
        prompt: unresolvedForkMessage({
          request,
          workItem: { goal: item.goal },
          package: this.planPackage(catalog, workElements),
          deviations: this.deviationsOf().length,
          deviationLimit: this.deviationLimit(),
          environmentProblems: this.environmentProblemsOf(),
          nameRejection: this.events('fork-name-rejected').filter(event => event.data.request === id).at(-1)?.data,
          view,
          ...(unavailable === null ? {} : { viewUnavailable: unavailable }),
          registry: current.registry,
          hypotheses: current.hypotheses,
          decisions,
          ...(partial === undefined ? {} : { partial }),
          ...(revalidate === undefined ? {} : { revalidate }),
        }),
        start: context.ref === null ? { mode: 'fresh' } : { mode: 'fork', from: context.ref },
        ...(context.ref === null ? { degraded: { requested: 'fork' as const, reason: 'The plan architect context is unavailable; using the ordinary request records' } } : {}),
        ...(context.point === null ? {} : {
          fork: { from: context.point, reason: 'unresolved-request', generation: context.generation, briefs: [...context.appended] },
        }),
        keep: () => finished('not-kept'),
        toolName: forkToolName,
        description: 'End this fork with its answer to the unresolved request: a placement decision, a plan deviation, an environment problem, nothing possible, or the findings and gaps of a fork that could not decide. The harness validates it; an invalid submission is returned with every error and its path.',
        inputSchema: this.input.record.identityContract === 'descriptive' ? descriptiveForkJsonSchema : forkJsonSchema,
        submissionSchema: this.input.record.identityContract === 'descriptive' ? 'ramify-agent.fork-submission/2' : 'ramify-agent.fork-submission/1',
        validate: async input => {
          const checked = validateFork(input, placementEvidenceOf(current, index), {
          kind: 'unresolved',
          elements: new Set(workElements.filter(element => !element.startsWith('ctx-'))),
          workItems: new Set(current.workItems.map(entry => entry.id)),
          scenarios: new Map(tracked.records.map(record => [record.id, tracked.states.get(record.id) ?? 'pending'])),
          }, this.input.record.identityContract ?? 'legacy');
          if (checked.ok && checked.value.kind === 'deviation' && this.input.record.identityContract === 'descriptive'
            && 'deviationKey' in checked.value.deviation) {
            const proposed = checked.value.deviation.deviationKey.slice('draft:'.length);
            const prior = this.events('plan-deviation-recorded').find(event => event.data.deviation === proposed);
            const nonfunctional = this.events('nonfunctional-deviation-recorded').find(event => event.data.deviation === proposed);
            if (prior !== undefined || nonfunctional !== undefined) return { ok: false, errors: [{ path: 'deviation.deviationKey',
              message: `"${proposed}" is already an accepted plan deviation; propose a distinct name for this request`,
              expected: 'an unused draft:plan-deviation:<subject-name> in this run' }] };
            const finding = checked.value.deviation.findingKey.slice('draft:'.length);
            if (this.observe().findings.findings.has(finding)) return { ok: false, errors: [{ path: 'deviation.findingKey',
              message: `"${finding}" is already an accepted finding; propose a distinct name for this deviation`,
              expected: 'an unused draft:finding:<subject-name> in this run' }] };
          }
          if (checked.ok && checked.value.kind === 'environment' && this.input.record.identityContract === 'descriptive' && 'problemKey' in checked.value) {
            const proposed = checked.value.problemKey.slice('draft:'.length);
            const prior = this.events('environment-reported').find(event => event.data.problem === proposed);
            if (prior !== undefined) return { ok: false, errors: [{ path: 'problemKey', message: `"${proposed}" is already the environment problem of ${prior.data.request}; propose a distinct name for this request`, expected: 'an unused draft:environment-problem:<subject-name> in this run' }] };
          }
          if (!checked.ok || checked.value.kind !== 'deviation' || checked.value.deviation.scenarios.length === 0) return checked;
          try { await this.ports.gates.validateFeatureTargets(this.ports.gates.expectedFeatures()); }
          catch (error) {
            if (!(error instanceof OwnershipUnavailableError)) throw error;
            return { ok: false, errors: [{ path: 'deviation.scenarios', message: `Current ownership unavailable: ${error.message}. Generated-feature targets require fresh evidence before any deviation or producer effect; repair the recorded boundary first or report the missing authority through environment handling.` }] };
          }
          return checked;
        },
        scope: {
          write: null,
          measurement: this.input.record.baseline && 'measurement' in this.input.record.baseline ? this.input.record.baseline.measurement : null,
          size: null,
        },
        measured: { snapshot: baseline, scope: measured },
      });

      if (this.ports.ignoring()) return null;
      if (result.ended !== 'submitted' || result.value === undefined) {
        await this.ports.fail(
          result.ended === 'invalid-submission' ? 'invalid-submission' : result.ended === 'failed' ? 'agent-failed' : 'internal',
          `The fork of unresolved request ${id} ended without a result (${result.ended})`,
          [runLayout.outcome(result.id)],
        );
        return null;
      }

      const value = result.value;
      if (value.kind === 'partial') {
        const retry = this.events('fork-returned-partial').filter(event => event.data.request === id).length + 1;
        await this.ports.write({ type: 'fork-returned-partial', data: { request: id, invocation: result.id, retry } });
        if (this.ports.ignoring()) return null;
        partial = { attempt, findings: [...value.findings], gaps: [...value.gaps] };
        revalidate = undefined;
        if (retry > bound) {
          await unresolvable(`the plan architect could not answer ${id} within ${bound} retr${bound === 1 ? 'y' : 'ies'}: ${[...value.findings, ...value.gaps].join('; ') || 'it named nothing'}`, [runLayout.submission(result.id)]);
          return null;
        }
        continue;
      }
      if (value.kind === 'nothing-possible') {
        await unresolvable(`the plan architect found that no deviation leaves anything of the plan worth doing: ${value.reason}`, [runLayout.submission(result.id)]);
        return null;
      }
      if (value.kind === 'deviation') {
        const accepted = await this.recordDeviation(item, id, result.id, value.deviation, { path: planFile, text: plan }, catalog);
        if (accepted?.kind === 'retry') {
          await this.ports.write({ type: 'fork-name-rejected', data: { request: id, invocation: result.id,
            field: accepted.field, message: accepted.reason } });
          continue;
        }
        return accepted;
      }
      if (value.kind === 'environment') {
        const reported = await this.reportEnvironment(item, request, result.id, value);
        if (reported === 'retry-name') continue;
        return reported;
      }

      // A placement fix: the evidence must still be what the fork decided on.
      const now = await this.viewIdentityOf(await this.ports.refreshIndex());
      if (!sameView(view, now)) {
        const partials = this.events('fork-returned-partial').filter(event => event.data.request === id).length;
        revalidate = { was: identityOf(view), now: identityOf(now) };
        partial = undefined;
        if (attempt - partials > bound) {
          await unresolvable(`the architect view changed under every investigation of ${id}; it was ${revalidate.was} and is ${revalidate.now}`, []);
          return null;
        }
        continue;
      }
      const decision = await this.acceptForkDecision(agent, item, id, result.id, value, view, current);
      return decision === null ? null : { kind: 'decided', decision };
    }
  }

  /**
   * Records the plan deviation a fork decided, with its CheckFinding, as one
   * line: the requirements it departs from are quoted from the captured
   * plan, which stays as written. The pending scenarios it rewords are
   * rendered and committed. Past the run's limit, the run waits for the
   * person to accept or reject it; a rejection there ends the run.
   */
  private async recordDeviation(
    item: WorkItem,
    request: string,
    invocation: string,
    body: DeviationBody,
    plan: { readonly path: string; readonly text: string },
    catalog: ElementCatalog,
  ): Promise<UnresolvedResolution | { readonly kind: 'retry'; readonly field: string; readonly reason: string } | null> {
    const recorded = this.events('plan-deviation-recorded').length;
    let held = recorded >= this.deviationLimit();
    const descriptive = this.input.record.identityContract === 'descriptive';
    const id = descriptive && 'deviationKey' in body ? body.deviationKey.slice('draft:'.length) : planDeviationId(recorded + 1);
    const current = this.observe().records;
    const workItems = [...new Set([item.id, ...body.workItems])];
    const modules = [...new Set(workItems.flatMap(workItem => {
      const module = current.workItems.find(entry => entry.id === workItem)?.module;
      return module === undefined ? [] : [module];
    }))];
    const tracked = trackedScenarios(this.observe().history.lines);
    const scenarios = body.scenarios.map(entry => {
      const record = tracked.records.find(candidate => candidate.id === entry.scenario);
      if (record === undefined) throw new Error(`${entry.scenario} is no tracked scenario`);
      return { scenario: entry.scenario, file: record.file, before: [...record.source], after: [...entry.source] };
    });
    let deviation: PlanDeviation | undefined;
    const committed = await this.ports.commitFinding(({ history, state }) => {
      if (eventsOf(history.events, 'plan-deviation-recorded').some(event => event.data.request === request)) return { stale: `${request} is already answered with a deviation` };
      held = eventsOf(history.events, 'plan-deviation-recorded').length >= this.deviationLimit();
      if (descriptive && (eventsOf(history.events, 'plan-deviation-recorded').some(event => event.data.deviation === id)
        || eventsOf(history.events, 'nonfunctional-deviation-recorded').some(event => event.data.deviation === id)))
        return { stale: `deviation.deviationKey ${id} conflicts with an accepted plan deviation; propose another descriptive name` };
      const record = planDeviationSchema.parse({
        schema: descriptive ? 'ramify-agent.plan-deviation/2' : 'ramify-agent.plan-deviation/1',
        id,
        request,
        workItem: item.id,
        invocation,
        plan: { path: plan.path, revision: `sha256:${sha256(plan.text)}` },
        amends: body.amends.map(element => {
          const found = catalog.elements.find(candidate => candidate.id === element)!;
          return { id: element, path: catalog.documents.find(document => document.id === found.document)!.path, text: found.text };
        }),
        instead: body.instead,
        why: body.why,
        rejected: body.rejected.map(entry => ({ ...entry })),
        loss: body.loss,
        workItems,
        modules,
        scenarios,
        checkFinding: descriptive && 'findingKey' in body ? body.findingKey.slice('draft:'.length) : nextCheckFinding(state),
        held,
      } satisfies PlanDeviation);
      deviation = record;
      return {
        commands: deviationCommands(state, record),
        compose: decided => ({
          event: {
            type: 'plan-deviation-recorded',
            data: { request, deviation: id, workItem: item.id, invocation, checkFinding: record.checkFinding, held, checkFindings: [...decided.events] },
          },
          records: [{ path: deviationLayout.deviation(id), id, revision: 1, body: record }],
        }),
      };
    }, this.ports.now());
    if (committed.kind === 'refused' && committed.refusal.reason === 'run-ended') return null;
    if (descriptive && committed.kind === 'refused' && (committed.refusal.reason === 'stale-basis'
      || (committed.refusal.reason === 'check-finding' && committed.refusal.rejection.code === 'finding-name-conflict'))) {
      return { kind: 'retry', field: committed.refusal.reason === 'check-finding' ? 'deviation.findingKey' : 'deviation.deviationKey', reason: committed.refusal.message };
    }
    if (committed.kind !== 'committed' || deviation === undefined) {
      await this.ports.fail('internal', `Plan deviation ${id} of ${request} could not be recorded: ${committed.kind === 'refused' ? committed.refusal.message : 'it was already recorded'}`);
      return null;
    }
    this.ports.notify();
    if (scenarios.length > 0 && !await this.rewordScenarios(deviation)) return null;
    if (held && !await this.awaitDeviationDecision(deviation)) return null;
    return { kind: 'deviation', deviation };
  }

  /**
   * Records the environment problem a fork reported, with its CheckFinding,
   * as one line, and holds the work item until the operator answers it:
   * nothing is placed, no deviation is recorded and the plan file is
   * untouched. Their resumption returns the work item to its module
   * architect with the diagnosis; their answer `end` ends the run.
   */
  private async reportEnvironment(
    item: WorkItem,
    request: UnresolvedRequest,
    invocation: string,
    body: EnvironmentBody,
  ): Promise<UnresolvedResolution | 'retry-name' | null> {
    const id = this.input.record.identityContract === 'descriptive' && 'problemKey' in body
      ? body.problemKey.slice('draft:'.length)
      : environmentProblemId(this.events('environment-reported').length + 1);
    let problem: EnvironmentProblem | undefined;
    const committed = await this.ports.commitFinding(({ history, state }) => {
      if (eventsOf(history.events, 'environment-reported').some(event => event.data.request === request.id)) return { stale: `${request.id} is already answered with an environment problem` };
      if (eventsOf(history.events, 'environment-reported').some(event => event.data.problem === id)) return { stale: `${id} is already an accepted environment problem in this run` };
      const record = environmentProblemSchema.parse({
        schema: this.input.record.identityContract === 'descriptive' ? 'ramify-agent.environment-problem/2' : 'ramify-agent.environment-problem/1',
        id,
        request: request.id,
        workItem: item.id,
        invocation,
        diagnosis: body.diagnosis,
        suggestion: body.suggestion,
        ...(this.input.record.identityContract === 'descriptive' && 'findingKey' in body ? { findingKey: body.findingKey } : {}),
        checkFinding: this.input.record.identityContract === 'descriptive' && 'findingKey' in body
          ? body.findingKey.slice('draft:'.length) : nextCheckFinding(state),
      });
      problem = record;
      return {
        commands: environmentCommands(state, record, request, item.module),
        compose: decided => ({
          event: {
            type: 'environment-reported',
            data: { request: request.id, problem: id, workItem: item.id, invocation, checkFinding: record.checkFinding, checkFindings: [...decided.events] },
          },
          records: [{ path: deviationLayout.environment(id), id, revision: 1, body: record }],
        }),
      };
    }, this.ports.now());
    if (committed.kind === 'refused' && committed.refusal.reason === 'run-ended') return null;
    if (this.input.record.identityContract === 'descriptive' && committed.kind === 'refused') {
      const refusal = committed.refusal;
      const field = refusal.reason === 'stale-basis' && refusal.message.includes(id)
        ? 'problemKey'
        : refusal.reason === 'check-finding' && refusal.rejection.code === 'finding-name-conflict'
          ? 'findingKey' : null;
      if (field !== null) {
        await this.ports.write({ type: 'fork-name-rejected', data: {
          request: request.id, invocation, field, message: refusal.message,
        } });
        return 'retry-name';
      }
    }
    if (committed.kind !== 'committed' || problem === undefined) {
      await this.ports.fail('internal', `Environment problem ${id} of ${request.id} could not be recorded: ${committed.kind === 'refused' ? committed.refusal.message : 'it was already recorded'}`);
      return null;
    }
    this.ports.notify();
    const note = await this.awaitEnvironmentAnswer(problem);
    return note === null ? null : { kind: 'environment', problem, note };
  }

  /**
   * Waits for the operator's answer to an environment problem: the run goes
   * no further meanwhile, with no time limit, and the run's decision
   * requests say it waits. Their resumption answers with their note, or the
   * empty string for none; their answer `end` ends the run with the
   * diagnosis and their note. A stop or the service closing ends the wait.
   */
  private async awaitEnvironmentAnswer(problem: EnvironmentProblem): Promise<string | null> {
    for (;;) {
      if (this.ports.ignoring()) return null;
      // Registered before the state is read, so an answer in between still wakes it.
      const changed = this.ports.changed();
      const entry = this.observe().findings.findings.get(problem.checkFinding);
      if (entry === undefined) {
        await this.ports.fail('internal', `Environment problem ${problem.id} names ${problem.checkFinding}, which is no CheckFinding`);
        return null;
      }
      if (entry.pendingUserDecision === null) {
        const settled = entry.decisions.find(decision => decision.id === entry.settledBy);
        if (entry.reason === 'waived') return settled === undefined || settled.actor.kind !== 'user' ? '' : settled.rationale;
        const answer = [...entry.decisions].reverse().find(decision => decision.decision.action === 'answer-user-decision');
        const option = answer?.decision.action === 'answer-user-decision' ? answer.decision.option : null;
        await this.ports.fail('unresolvable-requirement',
          `The operator ended the run on environment problem ${problem.id} of ${problem.workItem}${option === environmentOptions.end ? '' : ` (answer ${option ?? 'none'})`}: ${answer?.rationale ?? 'no answer was recorded'}. The plan architect's diagnosis: ${problem.diagnosis}`,
          [deviationLayout.environment(problem.id), deviationLayout.request(problem.request)]);
        return null;
      }
      await changed;
    }
  }

  /**
   * Waits for the person's decision on a deviation the run recorded past its
   * limit: the run goes no further meanwhile, with no time limit, and the
   * run's decision requests say it waits. Their acceptance lets the work item
   * go on; their rejection ends the run with their answer. A stop or the
   * service closing ends the wait.
   */
  private async awaitDeviationDecision(deviation: PlanDeviation): Promise<boolean> {
    for (;;) {
      if (this.ports.ignoring()) return false;
      // Registered before the state is read, so an answer in between still wakes it.
      const changed = this.ports.changed();
      const entry = this.observe().findings.findings.get(deviation.checkFinding);
      if (entry === undefined) {
        await this.ports.fail('internal', `Plan deviation ${deviation.id} names ${deviation.checkFinding}, which is no CheckFinding`);
        return false;
      }
      if (entry.pendingUserDecision === null) {
        if (entry.reason === 'waived') return true;
        const answer = [...entry.decisions].reverse().find(decision => decision.decision.action === 'answer-user-decision');
        await this.ports.fail('unresolvable-requirement',
          `The person rejected plan deviation ${deviation.id}, recorded past the run's limit of ${this.deviationLimit()}: ${answer?.rationale ?? 'no answer was recorded'}`,
          [deviationLayout.deviation(deviation.id)]);
        return false;
      }
      await changed;
    }
  }

  /** Every plan deviation the run recorded, in order. */
  private deviationsOf(): PlanDeviation[] {
    return this.events('plan-deviation-recorded').flatMap(event => {
      const parsed = planDeviationSchema.safeParse(this.ports.committedBody(deviationLayout.deviation(event.data.deviation)));
      return parsed.success ? [parsed.data] : [];
    });
  }

  /**
   * Every environment problem the run recorded, in order, with the
   * operator's note where they resumed the run for it, else null.
   */
  private environmentProblemsOf(): Array<{ problem: EnvironmentProblem; resumed: string | null }> {
    const findings = this.observe().findings.findings;
    return this.events('environment-reported').flatMap(event => {
      const parsed = environmentProblemSchema.safeParse(this.ports.committedBody(deviationLayout.environment(event.data.problem)));
      if (!parsed.success) return [];
      const entry = findings.get(parsed.data.checkFinding);
      const settled = entry?.reason === 'waived' ? entry.decisions.find(decision => decision.id === entry.settledBy) : undefined;
      return [{ problem: parsed.data, resumed: settled === undefined ? null : settled.rationale }];
    });
  }

  /** How many deviations the run records before the next one waits for the person. */
  private deviationLimit(): number {
    return this.observe().policy.limits.maxPlanDeviations ?? defaultMaxPlanDeviations;
  }

  /**
   * Renders the pending scenarios a deviation rewords into their feature
   * files and commits them, as the ledger's external effect: the intent
   * `scenarios-rewording` commits each revised scenario record, the effect
   * renders the tracked files from the ledger and commits them, and
   * `scenarios-reworded` is its completion. A recovery renders the same and
   * finds the commit by its trailers.
   */
  private async rewordScenarios(deviation: PlanDeviation): Promise<boolean> {
    this.ports.writer.requireSettled('The feature files cannot be written');
    const tracked = trackedScenarios(this.observe().history.lines);
    const records = deviation.scenarios.map(entry => {
      const record = tracked.records.find(candidate => candidate.id === entry.scenario)!;
      return scenarioRecordSchema.parse({
        ...record,
        name: scenarioNameOf(entry.after) ?? record.name,
        source: [...entry.after],
        hash: scenarioSourceHash(entry.after),
      } satisfies ScenarioRecord);
    });
    await this.performRewording({
      deviation: deviation.id,
      rewording: this.events('scenarios-rewording').length + 1,
      scenarios: records.map(record => record.id),
      files: [...new Set(records.map(record => record.file))].sort(),
    }, records.map(record => ({ path: runLayout.scenario(record.id), id: record.id, revision: 2, body: record })), false);
    return !this.ports.ignoring();
  }

  async performRewording(
    data: RunEventOf<'scenarios-rewording'>['data'],
    records: readonly CommitRecord[],
    recovering: boolean,
  ): Promise<{ commit: string }> {
    return this.ports.effect<{ commit: string }>({ serialization: 'whole',
      key: `scenarios-reword:${data.rewording}`,
      intent: { event: { type: 'scenarios-rewording', data }, records: [...records] },
      perform: async () => {
        const tracked = trackedScenarios(this.observe().history.lines);
        const expected = expectedFeatureFiles(tracked, { planId: this.input.record.planId, runId: this.input.record.jobId });
        const message = rewordingMessage({ runId: this.input.record.jobId, rewording: data.rewording, deviation: data.deviation, scenarios: data.scenarios, files: data.files });
        await assertScratchSafe(this.projectRoot, await declaredModuleDirectories(this.projectRoot), this.git);
        const commit = await commitForScenarios(this.projectRoot, this.input.record.jobId, rewordedTrailerValue(data.rewording), message, recovering, this.git, commit => this.ports.verifyProducerCommit(expected, commit), () => this.ports.renderProducerFeatures(expected, true), expected.map(file => file.path));
        return { commit: commit ?? await this.git.currentHead(this.projectRoot) };
      },
      complete: result => ({ event: { type: 'scenarios-reworded', data: { deviation: data.deviation, commit: result.commit } }, records: [] }),
    });
  }

  /**
   * The brief of one accepted decision, appended to the parent context as
   * the ledger's external effect: the intent is `decision-accepted` with
   * every record it commits, the effect is the append under the decision's
   * own identifier, and the completion says what the append did. A repeat
   * after a crash appends the same key, which the port answers
   * `already-present`, so one brief reaches the parent exactly once.
   *
   * Appending is storage. No model request, acknowledgement or parent review
   * happens here; the brief reaches a model only when the next fork inherits
   * it.
   */
  async appendBrief(
    agent: AgentPort,
    decision: PlacementDecision,
    intent: { readonly input: RunEventInput; readonly records: readonly CommitRecord[] } | null,
  ): Promise<void> {
    const fallback: RunEventInput = {
      type: 'decision-accepted',
      data: {
        request: decision.request ?? decision.id,
        decision: decision.id,
        workItem: decision.workItem,
        invocation: decision.invocation,
        registry: decision.registry.length,
        hypotheses: decision.hypothesisRevisions.length,
      },
    };
    const result = await this.ports.effect<AppendResult>({ serialization: 'whole',
      key: `brief:${decision.id}`,
      intent: {
        event: intent?.input ?? fallback,
        records: [...(intent?.records ?? [])],
      },
      perform: async () => {
        // The decision is committed and the brief is not appended yet: a run
        // frozen here is one that crashed between them.
        await this.ports.afterWrite('decision-accepted', this.input.record.jobId);
        const context = this.globalContextOf();
        if (context.session === null || context.ref === null) {
          return { outcome: 'session-lost', generation: context.generation, session: context.session, reason: 'the run has no architect context to append to' };
        }
        const answer = await this.ports.appendSession(agent, context.ref, decision.id, briefText(decision));
        // The append reached the parent and its completion is not in the log.
        await this.ports.afterWrite('brief-appending', this.input.record.jobId);
        if (answer.outcome === 'conflict') throw new Error(`The architect context did not take the brief: ${answer.reason}`);
        if (answer.outcome === 'session-lost') {
          return {
            outcome: 'session-lost',
            generation: context.generation,
            session: context.session,
            reason: `the architect context of generation ${context.generation} can no longer be read`,
          };
        }
        return { outcome: answer.outcome, generation: context.generation, session: context.session, ref: answer.ref };
      },
      complete: result => ({
        event: result.outcome === 'session-lost'
          ? { type: 'brief-not-appended', data: { decision: decision.id, generation: result.generation, reason: result.reason } }
          : {
              type: 'brief-appended',
              data: { decision: decision.id, generation: result.generation, session: result.session, ref: result.ref, outcome: result.outcome },
            },
        records: [],
      }),
    });
    // The brief and the point it makes, in the transcript of the session
    // appended to. A failed write loses the entries and never the append.
    const appended = this.events('brief-appended').find(event => event.data.decision === decision.id);
    if (appended !== undefined) {
      await this.ports.recordAppend(appended.data.session, {
        kind: 'brief-appended', decision: decision.id, generation: appended.data.generation,
        outcome: appended.data.outcome, text: briefText(decision),
      }, appended.sequence).catch(error => this.ports.warn(`Run ${this.input.record.jobId}: the brief of ${decision.id} is missing from ${appended.data.session}'s transcript: ${message(error)}`));
    }
    await this.ports.afterWrite('brief-appended', this.input.record.jobId);
    // The session that held a context the agent can no longer read is not
    // used again: the next fork is oriented from the records instead.
    if (result.outcome === 'session-lost') await this.ports.finishSession(result.session ?? undefined, 'lost');
  }

  /** The accepted decision returns to the requesting module architect, before any contract work. */
  private async deliverDecision(decision: PlacementDecision): Promise<boolean> {
    if (this.events('decision-delivered').some(event => event.data.decision === decision.id)) return true;
    await this.ports.write({ type: 'decision-delivered', data: { decision: decision.id, workItem: decision.workItem } });
    await this.ports.afterWrite('decision-delivered', this.input.record.jobId);
    return !this.ports.ignoring();
  }

  /**
   * A decision whose brief is in the parent context but whose delivery is
   * not in the log: the harness was interrupted between them. Delivering it
   * calls no agent and makes no duplicate.
   */
  async completeDeliveries(): Promise<string[]> {
    const delivered = new Set(this.events('decision-delivered').map(event => event.data.decision));
    const unanswered = new Set(this.observe().pendingEffects);
    const completed: string[] = [];
    for (const event of this.events('decision-accepted')) {
      if (delivered.has(event.data.decision) || unanswered.has(`brief:${event.data.decision}`)) continue;
      const decision = await this.readDecision(event.data.decision);
      if (decision === null) continue;
      await this.deliverDecision(decision);
      completed.push(event.data.decision);
    }
    return completed;
  }

  /**
   * Every contract artifact this run has registered, with the agreement that
   * established it: the interface, the conformance suite, the fake and the
   * exposure declarations of each contract at its current revision.
   *
   * They are guarded on every ordinary assignment, so deleting a conformance
   * suite is a change the gate names rather than an absent file it passes
   * over. The contract iteration that writes the agreement carries the
   * authorization for them, because rewriting them is what it is for.
   */
  requiredArtifacts(committed: ReturnType<typeof committedRecords>): Array<{ path: string; contract: ContractRecord }> {
    return requiredArtifacts(committed);
  }

  /** Captures the immutable implementation contract for either coordinator.
   * Only its design basis, sequence owner and selected requirements differ. */
  private async buildIterationAssignment(input: {
    readonly id: string;
    readonly item: WorkItem;
    readonly basis: RecordRef;
    readonly coordination: NonNullable<IterationAssignment['coordination']>;
    readonly body: AssignmentBody;
    readonly scope: WriteScope;
    readonly source?: PackageCitation | undefined;
    readonly evidenceObligations: IterationAssignment['evidenceObligations'];
    readonly authorizations: IterationAssignment['authorizations'];
    readonly guardedPaths: readonly string[];
    readonly externalCapabilities?: IterationAssignment['externalCapabilities'] | undefined;
    readonly revisesContract?: RecordRef | undefined;
  }): Promise<IterationAssignment> {
    return iterationAssignmentOf(this.projectRoot, { ...input, identityContract: this.input.record.identityContract ?? 'legacy' },
      { scenarioFiles: await this.guardedScenarioFiles(), preparationPaths: await this.auditPreparationPaths() });
  }

  /** The guarded paths that exist now and that an authorization can open, for an architect's briefing. */
  private async presentGuardedPaths(records: ReturnType<typeof committedRecords>): Promise<string[]> {
    const scenarioFiles = await this.guardedScenarioFiles();
    const harnessOnly = new Set([projectConfigurationFile, ...(scenarioFiles.expected ?? []).map(file => file.path)]);
    return (await captureGuardedFiles(this.projectRoot, this.requiredArtifacts(records).map(artifact => artifact.path),
      scenarioFiles, await this.auditPreparationPaths()))
      .filter(file => file.hash !== null && !harnessOnly.has(file.path)).map(file => file.path);
  }

  /**
   * What an assignment based on each owner gives its engineer, for an
   * architect's briefing, from the provider's topology. Where the provider
   * gives no answer the architect view names the owner and its children, and
   * the briefing says the nested-project roots are unavailable.
   */
  private async defaultWriteScopes(index: ArchitectIndex | null, modules: readonly string[], guarded: readonly string[]): Promise<DefaultWriteScope[]> {
    return defaultWriteScopesOf(this.options.ramify, this.projectRoot, index, modules, guarded);
  }

  /**
   * The creation authority an ordinary base is captured with: the accepted
   * registry entry that proposes an owner the view does not have yet. A
   * broad base names existing modules only: nothing is bootstrapped into
   * being by the exception that isolates a break.
   */
  private bootstrapOf(index: ArchitectIndex | null, registry: ReadonlyMap<string, RegistryEntry>, body: AssignmentBody): WriteScope['bootstrap'] {
    return assignmentBootstrap(index, registry, body);
  }

  /**
   * The scope an accepted assignment applies: the one captured while its
   * submission was judged, where the revision and creation authority are the
   * same, or a fresh capture. A fresh capture the provider refuses is an
   * invalid submission that leaves nothing committed, never an internal
   * failure.
   */
  private async preparedScope(
    body: AssignmentBody, revision: number, bootstrap: WriteScope['bootstrap'],
    capture: () => Promise<WriteScope>, subject: string,
  ): Promise<WriteScope | null> {
    const prepared = this.preparedScopes.get(body);
    this.preparedScopes.delete(body);
    if (prepared !== undefined && prepared.revision === revision && JSON.stringify(prepared.bootstrap) === JSON.stringify(bootstrap)) return prepared;
    try {
      return await capture();
    } catch (error) {
      await this.ports.fail('invalid-submission', `${subject} names a write scope that cannot be captured: ${message(error)}`);
      return null;
    }
  }

  private async assignIteration(
    item: WorkItem,
    invocation: string,
    submission: Extract<LocalArchitectSubmission, { kind: 'assign' }>,
    index: ArchitectIndex | null,
    registry: ReadonlyMap<string, RegistryEntry>,
    architectRef: ArchitectRef | null,
  ): Promise<IterationAssignment | null> {
    if (this.observe().restoring) {
      const original = [...this.events('iteration-assigned'), ...this.events('contract-requested')].find(event => event.data.workItem === item.id && event.data.invocation === invocation);
      if (original) {
        const assignment = this.observe().records.assignments.get(original.data.iteration);
        if (!assignment) throw new Error('Original licensed assignment is unavailable');
        return assignment;
      }
    }
    const committed = this.observe().records;
    let outlines = committed.outlines.get(item.id) ?? [];
    const delivery = this.events('hypotheses-delivered').filter(event => event.data.workItem === item.id).at(-1);

    // Contract sub-sessions are iterations of this work item too, so they
    // count: two assignments must never derive the same identifier.
    const number = this.assignedCount(item.id) + 1;

    // The placement this architect decided within its own authority, committed
    // with the assignment: `authority: 'local'`, no request and no brief
    // appended to the parent. It is discoverable from the registry, which is
    // how a later fork finds a capability nobody was asked about.
    const localView = await this.viewIdentityOf(index);
    const localRegistry = new Map(registry);
    const localHypotheses = new Map(committed.hypotheses.map(hypothesis => [hypothesis.id, hypothesis]));
    const localRecords: CommitRecord[] = [];
    const localDecisions: string[] = [];
    let decided = [...committed.decisions.values()].filter(decision => decision.authority === 'local' && decision.workItem === item.id).length;
    for (const local of submission.localDecisions) {
      decided += 1;
      const accepted = acceptDecision({
        id: this.input.record.identityContract === 'descriptive' ? descriptiveLocalDecisionId(item.id, local.decision.capability, decided) : localDecisionId(item.id, decided),
        authority: 'local',
        request: null,
        workItem: item.id,
        invocation,
        body: local.decision,
        registry: local.registry,
        view: localView,
        committed: { registry: localRegistry, hypotheses: localHypotheses },
      });
      for (const entry of accepted.registry) localRegistry.set(entry.capability, entry);
      localRecords.push(...accepted.records);
      localDecisions.push(accepted.decision.id);
    }

    const body = submission.assignment;
    const bootstrap = this.bootstrapOf(index, localRegistry, body);

    // A direct revision is a contract iteration, and its scope, gate and
    // revision number are the harness's, not the architect's: the agreement
    // it revises names the provider, and the contract, the conformance suite
    // and the fake are rewritten where they already are.
    const revised = body.revisesContract === undefined ? undefined : committed.contracts.get(body.revisesContract);
    if (body.revisesContract !== undefined && revised === undefined) {
      await this.ports.fail('internal', `The assignment of ${item.id} revises "${body.revisesContract}", which this run has not registered`);
      return null;
    }
    const providerDirectory = revised === undefined ? null : directoryOf(index, revised.provider);
    if (revised !== undefined && providerDirectory === null) {
      await this.ports.fail('internal',
        `The refreshed architect view has no directory for "${revised.provider}", so no contract scope could be captured for ${item.id}`);
      return null;
    }

    const scope = revised !== undefined && providerDirectory !== null
      ? await this.contractScope(index, {
        revision: number,
        consumer: item.module,
        provider: revised.provider,
        providerDirectory,
        // The agreement in force names where its fake is held; the revision
        // rewrites the fake where it is.
        injectionSites: [...committed.requirements.values()]
          .filter(requirement => committed.obligations.get(requirement.obligation)?.contract.id === revised.id)
          .flatMap(requirement => requirement.evidence.fakeInjections),
        rationale: `The revision of ${revised.id}: the contract, its conformance suite, its fake, the files that hold it and this consumer's integration. ${body.scope.rationale}`,
      })
      : await this.preparedScope(body, number, bootstrap, () => resolveWriteScope({ ramify: this.options.ramify,
        projectRoot: this.projectRoot,
        index,
        view: this.input.record.manifest.architectView,
        revision: number,
        base: body.scope.base,
        extra: body.scope.extra,
        read: body.scope.read,
        bootstrap,
        rationale: body.scope.rationale,
      }), `The assignment of ${item.id}`);
    if (scope === null) return null;

    // The outline revision is committed only once the scope it plans is
    // captured, so a scope the provider refuses leaves no revision behind.
    if (submission.outline !== undefined) {
      const revised = await this.ports.handling.reviseOutline({
        item, invocation, outline: submission.outline, hypothesesSeen: delivery?.data.refs ?? [],
        identityContract: this.input.record.identityContract ?? 'legacy',
      });
      if (revised === null) return null;
      if (revised.written) outlines = [...outlines, revised.outline];
    }

    const outline = outlines.at(-1);
    if (outline === undefined) {
      await this.ports.fail('internal', `The assignment of ${item.id} has no outline to work from`);
      return null;
    }

    // A guarded path this architect authorized is one the module engineer may write
    // through the guarded tools: the authorization is the permission, and
    // the assignment records it beside the scope it widens by that one file.
    await authorizedScope(this.projectRoot, scope, revised === undefined ? submission.assignment.authorizations ?? [] : []);

    // Registered evidence this iteration must satisfy. It is derived, never
    // submitted: a provider item runs the agreed suite against the real
    // implementation, and a verification runs its consumer's tests with the
    // fake replaced. A module engineer cannot remove one or weaken it.
    const evidenceObligations = revised === undefined ? this.evidenceFor(item, body.kind, committed) : [];

    // The guarded set is the project's configuration and manifests together
    // with the contract artifacts in force. A contract iteration carries the
    // authorization for those artifacts, because rewriting the agreement is
    // what it is assigned to do; every other kind carries only what this
    // architect recorded with an outline revision.
    const artifacts = this.requiredArtifacts(committed);
    const outlineRef = refOf(item.id, outline.revision, outline);
    const authorizations = revised === undefined
      ? (body.authorizations ?? []).map(entry => ({
        path: entry.path,
        rationale: entry.rationale,
        by: outlineRef,
      }))
      : artifacts.map(artifact => ({
        path: artifact.path,
        rationale: `The revision of ${revised.id} rewrites the agreement's own artifacts.`,
        by: refOf(artifact.contract.id, artifact.contract.revision, artifact.contract),
      }));

    const id = iterationId(item.id, number);
    // The assignment package is cited before `iteration-assigned`: the
    // elements the architect names, with every plan deviation recorded
    // now, so no later reader can fail to render it.
    let source: PackageCitation | undefined;
    try {
      const selected = await this.currentSelection(item.id);
      if (selected !== null) {
        const outside = body.citedElements.filter(element => !selected.selection.package.elements.includes(element));
        if (outside.length > 0) throw new EvidenceUnavailableError(`It cites ${outside.join(', ')}, which the work-item package does not hold`);
        source = await this.citeCurrentDeviations(body.citedElements);
      }
    } catch (error) {
      await this.ports.fail('inputs-changed', `The assignment package of ${id} cannot be cited: ${message(error)}`);
      return null;
    }
    const assignment = await this.buildIterationAssignment({
      id, item, basis: outlineRef, coordination: { kind: 'work-item', id: item.id },
      body: revised === undefined ? body : { ...body, obligations: [] }, scope, source,
      evidenceObligations, authorizations, guardedPaths: artifacts.map(artifact => artifact.path),
      ...(revised === undefined ? {} : {
        externalCapabilities: [{ capability: revised.capability.id, owner: revised.provider, role: 'request' }],
        revisesContract: refOf(revised.id, revised.revision, revised),
      }),
    });

    if (revised === undefined) {
      return this.ports.handling.recordAssignment({ item, number, invocation, assignment, decisions: localDecisions, localRecords, architectRef });
    }
    await this.ports.write({
      type: 'contract-requested',
      data: {
        workItem: item.id,
        iteration: id,
        scopeRevision: scope.revision,
        invocation,
        capability: revised.capability.id,
        consumer: item.module,
        provider: revised.provider,
        // A direct revision is the architect's own; no engineer asked for it.
        requestedBy: null,
        revises: revised.id,
      },
    }, [
      { path: iterationLayout.assignment(item.id, number), id, revision: 1, body: assignment },
      ...localRecords,
    ]);
    await this.ports.afterWrite('contract-requested', this.input.record.jobId);
    return this.ports.ignoring() ? null : assignment;
  }

  /**
   * The test areas of the modules whose tests an assignment owns, for its
   * briefing: each exact owner's, and every module's beneath a subtree. It
   * selects nothing for a gate, whose audit selects its own checks.
   */
  async ownedTestAreas(tests: TestSelectionPolicy): Promise<TestArea[]> {
    return ownedTestAreasOf(this.projectRoot, this.observe().index, tests);
  }

  /**
   * The equipment of one implementation session, over this run: its paths
   * hold the shell output and the hook logs, and its policy supplies the
   * commands and the bounds.
   */
  implementationTools(options: {
    readonly workingDirectory?: string;
    readonly scopeRevision: number;
    readonly guarded: GuardedScope;
    readonly commandTimeoutMs: number;
    readonly submissions?: { readonly legalOutcomes: readonly string[]; readonly completionOutcome: string | null };
    readonly focusedCommands?: Parameters<typeof engineerEquipment>[0]['focusedCommands'];
  }): EngineerEquipment {
    return engineerEquipment({
      commandExecution: this.options.commandExecution,
      registerProcessGroup: async (invocation, pid, identity) => {
        const committed = await this.ports.write({ type: 'writer-process-registered', data: { invocation, pid, identity } });
        if (committed === 'ended') throw new Error(`Run ${this.input.record.jobId} ended before process group ${pid} was registered`);
        this.ports.writer.register(invocation, pid);
        await this.ports.afterWrite('writer-process-registered', this.input.record.jobId);
      },
      projectRoot: this.projectRoot,
      ramify: this.options.ramify,
      commands: this.observe().policy.commands,
      bounds: this.observe().policy.limits,
      refresh: () => this.ports.refreshIndex(),
      index: () => this.observe().index,
      submissions: { legalOutcomes: this.workflow === null ? ['completion-proposed', 'partial', 'unsuitable', 'contract-needed']
        : this.input.record.identityContract === 'descriptive' ? ['completion-proposed', 'partial', 'unsuitable', 'capability-needed', 'contract-needed']
          : ['completion-proposed', 'partial', 'unsuitable', 'capability-needed'], completionOutcome: 'completion-proposed' },
      ...options,
      outputPath: (kind, invocation, number) => this.path(kind === 'shell'
        ? runLayout.shellOutput(invocation, number)
        : runLayout.hookOutput(invocation, number)),
    });
  }

  /**
   * The registered evidence one assignment must satisfy, derived from the
   * work item's origin and its open requirements. A provider work item owes
   * its obligation's conformance suite against the real implementation; a
   * verification owes its consumer's tests with every fake replaced.
   */
  private evidenceFor(
    item: WorkItem,
    kind: IterationAssignment['kind'],
    records: ReturnType<typeof committedRecords>,
  ): IterationAssignment['evidenceObligations'] {
    return evidenceFor(this.observe().history, item, kind, records);
  }

  /** The first capability transaction uses the same run invocation, session
   * and ledger paths as ordinary work. The parent architect and requesting
   * engineer are both kept at their exact points until a later handback. */
  private async replayAcceptedCapabilityQualification(request: CapabilityRequest,
    role: 'local-architect' | 'capability-architect'): Promise<InvocationResult<QualificationAction> | null | undefined> {
    const started = [...this.events('invocation-started')].reverse().find(event =>
      event.data.role === role && event.data.work.request === request.id);
    if (started === undefined) return undefined;
    const ended = this.events('invocation-ended').find(event => event.data.invocation === started.data.invocation);
    if (ended?.data.ended !== 'submitted' || ended.data.submission === null) return undefined;
    const outcome = this.ports.committedBody(runLayout.outcome(started.data.invocation)) as InvocationOutcome | null;
    const bytes = await readIfExists(this.path(runLayout.submission(started.data.invocation)));
    if (bytes === undefined || sha256(bytes) !== ended.data.submission ||
      outcome?.submission?.hash !== ended.data.submission || outcome.disposition !== 'applied' ||
      !outcome.settled.confirmed) {
      await this.ports.fail('recovery-exhausted', `Qualification of ${request.id} has an unauthenticated accepted action`);
      return null;
    }
    const raw = JSON.parse(bytes.toString('utf8')) as Record<string, unknown>;
    const { schema: _schema, ...body } = raw;
    const parsed = qualificationActionSchema.safeParse(body);
    if (raw.schema !== (request.schema.endsWith('/2') ? 'ramify-agent.capability-qualification/2' : 'ramify-agent.capability-qualification/1') || !parsed.success ||
      parsed.data.request !== request.id || parsed.data.invocation !== request.invocation) {
      await this.ports.fail('recovery-exhausted', `Qualification of ${request.id} has an invalid accepted action`);
      return null;
    }
    return { id: started.data.invocation, ended: 'submitted', value: parsed.data,
      ref: outcome.session?.ref ?? '', outcomeKind: 'submitted', session: started.data.session, kept: true };
  }

  private async coordinateCapabilityNeed(
    agent: AgentPort,
    packages: ReadonlyMap<string, LoadedPackage>,
    baseline: MeasurementSnapshot,
    item: WorkItem,
    assignment: IterationAssignment,
    suspended: SuspendedCapabilityOutcome,
    contextPackage: WorkPackage | undefined,
    parent: { readonly session: SessionId | undefined; readonly point: string | undefined; readonly workingDirectory: string },
    existingRequest?: CapabilityRequest,
  ): Promise<{ readonly kind: 'satisfied'; readonly guidance: string; readonly parent: { readonly session: SessionId; readonly point: string } }
    | { readonly kind: 'retry-name'; readonly guidance: string } | { readonly kind: 'delegated' } | null> {
    if (this.workflow === null || !supportedCapabilityPolicy(this.observe().policy.version)) {
      await this.ports.fail('internal', 'A capability request reached a run without its captured workflow');
      return null;
    }
    this.ports.writer.requireSettled('A capability request cannot suspend an unsettled writer');
    const correctionTask = suspended.need.revises === undefined ? undefined
      : this.observe().records.capabilityTasks.get(suspended.need.revises.task);
    if (existingRequest === undefined && this.input.record.identityContract === 'descriptive' && suspended.need.revises !== undefined &&
      (correctionTask?.parent.id !== item.id || !this.observe().records.capabilityHandbacks.has(correctionTask.id)
        || this.observe().records.retirements.has(correctionTask.request) || this.observe().records.retirements.has(correctionTask.id))) {
      await this.ports.fail('inputs-changed', `The correction task ${suspended.need.revises.task} is not an active accepted handback of ${item.id}`);
      return null;
    }
    const requestId = existingRequest?.id ?? ('requestKey' in suspended.need ? suspended.need.requestKey.slice('draft:'.length) : capabilityRequestId(this.observe().records.capabilityRequests.size + 1));
    const source = existingRequest?.source ?? await captureProvisionalSource({ git: this.git, sourceGit: this.options.provisionalSourceGit,
      projectRoot: this.projectRoot, runDirectory: this.input.directory, request: requestId,
      acceptedBase: this.accepted(), writerSettledBy: suspended.invocation,
      invocationScoped: this.input.record.identityContract === 'descriptive',
      changedPaths: await this.git.changedPaths(this.projectRoot, this.accepted()),
    });
    if (existingRequest === undefined) {
      await this.ports.afterWrite('capability-source-captured', this.input.record.jobId);
      if (this.ports.ignoring()) return null;
    }
    const packageRef = contextPackage === undefined
      ? { id: runLayout.capturedPlan, revision: 1, hash: sha256(await readFile(this.path(runLayout.capturedPlan))) }
      : { id: contextPackage.selection, revision: 1, hash: contextPackage.citation.hash };
    const request: CapabilityRequest = existingRequest ?? {
      schema: this.input.record.identityContract === 'descriptive' ? 'ramify-agent.capability-request/2' : 'ramify-agent.capability-request/1', id: requestId,
      parent: { kind: 'work-item', id: item.id }, assignment: assignment.id,
      invocation: suspended.invocation, consumer: item.module,
      requirementPackage: packageRef, continuation: { session: suspended.session, point: suspended.point || null },
      source, summary: suspended.summary, original: identifyCapabilityNeed(requestId, suspended.need),
    };
    const retiredRequest = this.input.record.identityContract === 'descriptive' ? correctionTask?.request : undefined;
    if (existingRequest === undefined) try { await this.ports.commitCapability({
      type: 'capability-requested', data: { request: request.id, parent: item.id,
        assignment: assignment.id, invocation: suspended.invocation,
        ...(retiredRequest === undefined ? {} : { retiredRequest }) },
    }, [{ path: capabilityLayout.request(request.id), id: request.id, revision: 1, body: request },
      ...(retiredRequest === undefined ? [] : [capabilityRetirement(retiredRequest, 'capability-request', request.id,
        assignment.id, request.original.revises!.reason)])]); } catch (error) {
      if (error instanceof CapabilityNameConflictError && this.input.record.identityContract === 'descriptive'
        && 'requestKey' in suspended.need) {
        const current = this.observe().records;
        const errors = descriptiveCapabilityNameErrors(suspended.need, {
          requests: new Set(current.capabilityRequests.keys()),
          examples: new Set([...current.capabilityRequests.values()].flatMap(entry => entry.original.examples.map(example => example.id))),
        });
        if (errors.length > 0) {
          if (![...current.capabilityRequests.values()].some(accepted => accepted.source.snapshot === source.snapshot))
            await unlink(this.path(source.snapshot)).catch(() => {});
          return { kind: 'retry-name', guidance: `The serialized request acceptance refused this proposal. Correct the same task with a meaningful qualifier: ${errors.map(entry => `${entry.path}: ${entry.message}; expected ${entry.expected}`).join(' | ')}` };
        }
      }
      if (error instanceof CapabilityNameConflictError && existingRequest === undefined
        && ![...this.observe().records.capabilityRequests.values()].some(accepted => accepted.source.snapshot === source.snapshot))
        await unlink(this.path(source.snapshot)).catch(() => {});
      await this.ports.fail('invalid-submission', `Capability request ${request.id} was refused: ${message(error)}`);
      return null;
    }

    const local = packages.get('local-architect');
    if (local === undefined) {
      await this.ports.fail('internal', 'The module architect package is absent during qualification');
      return null;
    }
    const registry = this.observe().records.registry;
    let point = parent.point;
    let parentSession = parent.session;
    let returned = '';
    const recovered = existingRequest === undefined ? undefined : await this.replayAcceptedCapabilityQualification(request, 'local-architect');
    if (recovered === null) return null;
    let qualification: InvocationResult<QualificationAction> | undefined = recovered;
    while (true) {
      qualification ??= await this.ports.runInvocation<QualificationAction>(agent, {
      role: 'local-architect', task: { kind: 'capability-qualification', goal: request.original.need,
        requirements: [`Qualify capability request ${request.id} under its complete original constraints, usage and example identities and the current work-item package.`], modules: [item.module],
        literalSections: [
          { key: 'support:capability-request', text: `Original request: ${JSON.stringify(request, null, 2)}` },
          { key: 'support:work-item-package', text: contextPackage?.text ?? (await this.currentSelection(item.id))?.packageText
            ?? this.planPackage(await this.frozenCatalog(), [...item.requirementRefs, ...item.acceptanceRefs, ...item.contextRefs]) },
        ] }, work: { workItem: item.id, request: request.id },
      attempt: this.events('invocation-started').filter(event => event.data.work.workItem === item.id && event.data.work.request === request.id).length + 1,
      loaded: local, systemPrompt: renderLocalArchitectPrompt(local, this.projectRoot, parent.workingDirectory),
      prompt: [
        `# Qualify capability request ${request.id}`,
        `The module engineer of ${assignment.id} retained its source and session. Its invocation is ${request.invocation}.`,
        `Complete request ${request.id}, including provisional source and original examples, is in support:capability-request.`,
        ...(point === undefined ? [`Current assignment: ${JSON.stringify(assignment)}`] : []),
        `Registry clues: ${JSON.stringify(registry.map(entry => ({ capability: entry.capability, owner: entry.owner })))}`,
        'Read the actual exposed API and use sites. A matching name is not proof of sufficient behavior, and a missing name is not proof of absence.',
        'Submit satisfy-with-existing with concrete API evidence, delegate-capability with placement reasoning, request-placement, or unresolved.',
        ...(request.schema.endsWith('/2') ? ['For delegate-capability, propose taskKey draft:capability-task:<provider-behavior-name>. It resolves to an accepted task ID during ordinary delegation.'] : []),
        `Use request ${request.id} and invocation ${request.invocation} in the action.`,
        ...(returned === '' ? [] : [`# Boundary decision\n\n${returned}`]),
        ...(this.events('invocation-started').filter(event => event.data.work.request === request.id && event.data.role === 'local-architect').length >= 3
          ? ['# Progress reconsideration\nThe qualification has returned to you repeatedly. Assess the decisions and current evidence, explain what another exchange would add, and change approach or seek a concrete missing prerequisite if needed. Repetition alone establishes no outcome.'] : []),
      ].join('\n\n'),
      workingDirectory: parent.workingDirectory,
      start: point === undefined ? { mode: 'fresh' } : { mode: 'continue', ref: point },
      // Qualification continues the module architect's latest settled point.
      // Without one, the fresh start is a degradation the record states.
      ...(point === undefined
        ? { ...(parentSession === undefined ? {} : { replaces: { session: parentSession, reason: 'reconstructed' as const } }),
          degraded: { requested: 'continued' as const, reason: 'The module architect session point is unavailable; the request, its provisional source and the current work-item package were supplied to a fresh session.' } }
        : parentSession === undefined ? {} : { session: parentSession, continuing: 'capability-qualification' as const }),
      toolName: 'submit_capability_qualification',
      description: 'Qualify this exact request using current behavior and placement evidence.',
      inputSchema: z.toJSONSchema(request.schema.endsWith('/2') ? descriptiveQualificationActionSchema : qualificationActionSchema) as JsonSchema,
      submissionSchema: request.schema.endsWith('/2') ? 'ramify-agent.capability-qualification/2' : 'ramify-agent.capability-qualification/1',
      validate: async input => {
        const parsed = validateAgainst(request.schema.endsWith('/2') ? descriptiveQualificationActionSchema : qualificationActionSchema, input);
        if (!parsed.ok) return parsed;
        if (parsed.value.request !== request.id || parsed.value.invocation !== request.invocation) {
          return { ok: false, errors: [{ path: 'request', message: 'The request or originating invocation is stale', expected: `${request.id} and ${request.invocation}` }] };
        }
        if (parsed.value.kind === 'delegate-capability' && request.schema.endsWith('/2')) {
          const errors = capabilityRequirementErrors(parsed.value.requirementRefs, await this.frozenCatalog());
          const taskId = parsed.value.taskKey?.slice('draft:'.length);
          if (taskId !== undefined && this.observe().records.capabilityTasks.has(taskId)) errors.push({
            path: 'taskKey', message: `"${taskId}" is already accepted or retired`, expected: 'an unused draft:capability-task:<name>',
          });
          if (errors.length > 0) return { ok: false, errors };
        }
        return parsed;
      },
      scope: { write: null, measurement: null, size: null },
      keep: (ended, value) => ended === 'submitted' && value !== undefined ? kept : finished('not-kept'),
      });
      if (qualification.ended !== 'submitted' || qualification.value === undefined) {
        await this.ports.fail('invalid-submission', `The module architect could not qualify ${request.id}`);
        return null;
      }
      const pending = qualification.value;
      if (pending.kind === 'request-placement') {
        const resolution = await this.requestPlacement(agent, packages, baseline, item, {
          forCapability: request.id, question: pending.problem, requiredBehavior: request.original.need,
          findings: pending.evidence.map(text => ({ text, citations: [] })),
          candidates: request.original.suggestedProvider === undefined ? [] : [{ owner: request.original.suggestedProvider.module,
            note: request.original.suggestedProvider.reason }],
          unresolved: [pending.problem], hypotheses: [], localDecisions: [],
        }, this.events('placement-requested').find(event => event.data.capability === request.id)?.data.request);
        if (resolution === null) return null;
        returned = resolution.kind === 'decided'
          ? `Placement decision ${resolution.decision.id}: ${JSON.stringify(resolution.decision)}`
          : `The plan architect could not settle placement ${resolution.request}: ${[...resolution.findings, ...resolution.gaps].join('; ')}`;
        point = qualification.ref || undefined;
        parentSession = qualification.kept ? qualification.session : undefined;
        qualification = undefined;
        continue;
      }
      if (pending.kind === 'unresolved') {
        const resolution = await this.resolveUnresolved(agent, packages, baseline, item, {
          invocation: qualification.id, conflict: pending.problem, evidence: pending.evidence,
        }, this.events('unresolved-requested').find(event => event.data.invocation === qualification!.id)?.data.request);
        if (resolution === null) return null;
        returned = `The responsible plan architect answered the unresolved request: ${JSON.stringify(resolution)}`;
        point = qualification.ref || undefined;
        parentSession = qualification.kept ? qualification.session : undefined;
        qualification = undefined;
        continue;
      }
    if (qualification?.value === undefined ||
      (qualification.value.kind !== 'satisfy-with-existing' && qualification.value.kind !== 'delegate-capability')) {
      await this.ports.fail('internal', `Qualification of ${request.id} produced no final decision`);
      return null;
    }
    const decision = qualification.value;
    if (decision.kind === 'satisfy-with-existing') {
      await this.ports.write({ type: 'capability-qualified', data: {
        request: request.id, invocation: qualification.id, outcome: 'satisfied', evidence: decision.evidence,
      } });
      return { kind: 'satisfied', parent: { session: qualification.session, point: qualification.ref }, guidance: [
        `Request ${request.id} was satisfied by existing behavior. Verify it from your original calling code and examples.`,
        `API: ${decision.api.owner}, ${decision.api.path}, ${decision.api.symbol}`,
        `Guidance: ${decision.guidance}`, `Evidence: ${decision.evidence.join('; ')}`,
      ].join('\n') };
    }
    const records = this.observe().records;
    const prior = request.original.revises === undefined ? undefined : records.capabilityHandbacks.get(request.original.revises.task);
    if (request.original.revises !== undefined && (prior === undefined ||
      records.capabilityTasks.get(request.original.revises.task)?.parent.id !== item.id)) {
      await this.ports.fail('inputs-changed', `Revision request ${request.id} names no accepted handback of ${item.id}: ${request.original.revises.task}`);
      return null;
    }
    const taskId = decision.taskKey?.slice('draft:'.length) ?? capabilityTaskId(records.capabilityTasks.size + 1);
    const providerItems = records.workItems.filter(entry => entry.module === decision.provider);
    const task: CapabilityTask = {
      schema: request.schema.endsWith('/2') ? 'ramify-agent.capability-task/2' : 'ramify-agent.capability-task/1', id: taskId, request: request.id,
      parent: request.parent, originatingAssignment: assignment.id, consumer: item.module,
      provider: decision.provider, placementReason: decision.placementReason,
      authority: [
        { owner: item.module, reason: 'Requesting consumer integration and task-local architecture' },
        ...(decision.provider === item.module ? [] : [{ owner: decision.provider, reason: decision.placementReason }]),
      ],
      relatedEntries: providerItems.map(entry => ({ entry: entry.id, reason: 'Provider entry remains separate from this task' })),
      deferredWorkItems: providerItems.map(entry => entry.id), source,
      ...(prior === undefined || request.original.revises === undefined ? {} : { revises: {
        handback: refOf(prior.task, 1, prior), sourceRevision: prior.sourceRevision, reason: request.original.revises.reason,
      } }),
      limits: captureCapabilityLimits(this.observe().policy),
    };
    let plan: CapabilityPlan = {
      schema: task.schema.endsWith('/2') ? 'ramify-agent.capability-plan/2' : 'ramify-agent.capability-plan/1', task: task.id, revision: 1, basedOn: 0,
      updatedBy: qualification.id, revisionReason: 'Initial qualified request',
      need: request.original.need, proposedInterface: 'Undecided; the capability architect examines actual source and use',
      useCases: request.original.examples.map(example => ({ id: example.id, expectedBehavior: example.title, derivedFrom: [example.id] })),
      compatibility: [...request.original.constraints],
      outline: ['Review existing behavior and affected owners', 'Coordinate provider and consumer work', 'Verify real use and hand back'],
      decisions: [{ decision: `Coordinate in ${decision.provider}`, reason: decision.placementReason, evidence: [...decision.requirementRefs] }],
      openQuestions: [], requirementRefs: [...decision.requirementRefs],
      originalExamples: request.original.examples.map(example => example.id),
    };
    try { await this.ports.commitCapability({
      type: 'capability-delegated', data: { task: task.id, request: request.id, parent: item.id,
        invocation: qualification.id, planRevision: 1,
        ...(request.schema.endsWith('/2') && request.original.revises !== undefined ? { retiredTask: request.original.revises.task } : {}) },
    }, [
      { path: capabilityLayout.task(task.id), id: task.id, revision: 1, body: task },
      { path: capabilityLayout.plan(task.id, 1), id: task.id, revision: 1, body: plan },
      ...(request.schema.endsWith('/2') && request.original.revises !== undefined
        ? [capabilityRetirement(request.original.revises.task, 'capability-task', task.id, assignment.id, request.original.revises.reason)] : []),
    ]); } catch (error) {
      const current = this.observe().records;
      if (error instanceof CapabilityNameConflictError && request.schema.endsWith('/2') && decision.taskKey !== undefined
        && (current.capabilityTasks.has(taskId) || current.retirements.has(taskId))) {
        returned = `The serialized delegation refused taskKey: "${decision.taskKey}" resolves to ${taskId}, already accepted or retired. Propose an unused draft:capability-task:<name> with a meaningful qualifier in this same qualification task.`;
        point = qualification.ref || undefined;
        parentSession = qualification.kept ? qualification.session : undefined;
        qualification = undefined;
        continue;
      }
      throw error;
    }

    // The provider entry's recorded decisions belong in the fresh briefing.
    // It receives the selected source package whole, while its own transcript
    // has none of either module architect's history.
    const providerDecisions = [...records.decisions.values()].filter(entry =>
      entry.owner === decision.provider || providerItems.some(item =>
        item.id === entry.workItem || entry.revises?.affected.some(affected => affected.workItem === item.id)));
    let selected = contextPackage?.text ?? new TextDecoder().decode(await readFile(this.path(runLayout.capturedPlan)));
    if (providerItems.length > 0 && contextPackage !== undefined) {
      const selector = packages.get('context-selector');
      if (selector === undefined) {
        await this.ports.fail('internal', 'No context selector is available for the expanded owner set');
        return null;
      }
      const catalog = await this.frozenCatalog();
      const expanded = await this.selectElements(agent, selector, item, {
        catalog, planDeviations: this.planDeviationsOf(),
        workItemElements: [...new Set([
          ...item.requirementRefs, ...item.acceptanceRefs, ...item.contextRefs,
          ...providerItems.flatMap(entry => [...entry.requirementRefs, ...entry.acceptanceRefs, ...entry.contextRefs]),
        ])],
      }, {
        packet: [
          `Capability task ${task.id} adds provider ${decision.provider} to the relevant owner set.`,
          `Original request: ${request.original.need}`,
          `Earlier package: ${contextPackage.citation.elements.join(', ') || '(no elements)'}`,
          `Provider decisions: ${JSON.stringify(providerDecisions)}`,
        ].join('\n'), orientationInvocation: qualification.id,
        point: qualification.ref || null, session: qualification.kept ? qualification.session : undefined,
      });
      if (expanded === 'failed' || expanded === undefined) {
        await this.ports.fail('inputs-changed', `The expanded owner context of ${task.id} could not be selected`);
        return null;
      }
      const delivered = await this.recordedSelection(expanded, catalog);
      if (delivered.status === 'unavailable') {
        await this.ports.fail('inputs-changed', `The expanded owner package of ${task.id} is unavailable: ${delivered.reason}`);
        return null;
      }
      selected = delivered.packageText;
    }
    const coordinated = await this.runCapabilityCoordinator(agent, packages, baseline, item, task, request, plan,
      qualification.id, selected, providerItems, providerDecisions);
    // Qualification advanced this exact local action session. Hand its accepted
    // point back explicitly; the earlier context checkpoint remains fork authority.
    return coordinated?.kind === 'satisfied' ? { ...coordinated, parent: { session: qualification.session, point: qualification.ref } } : coordinated;
    }
  }

  /** Drives one delegated task; the same path is used for a nested child. */
  private async runCapabilityCoordinator(
    agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>, baseline: MeasurementSnapshot,
    item: WorkItem, task: CapabilityTask, request: CapabilityRequest, plan: CapabilityPlan,
    originInvocation: string, selected: string, providerItems: readonly WorkItem[], providerDecisions: readonly PlacementDecision[],
    resume?: { readonly basis: string; readonly point: string | undefined; readonly session: SessionId | undefined;
      readonly progress: string; readonly attempt: number; readonly reconstructedFrom?: SessionId;
      readonly replay?: InvocationResult<CapabilityAction> },
  ): Promise<{ readonly kind: 'satisfied'; readonly guidance: string } | { readonly kind: 'delegated' } | null> {
    const records = this.observe().records;
    const loaded = packages.get('capability-architect');
    if (loaded === undefined) {
      await this.ports.fail('internal', 'No capability architect package was captured');
      return null;
    }
    // Capability work may involve owners beyond the parent's selected package.
    // Use the same active catalog membership as package construction, excluding
    // request examples and use cases even when their IDs occur in the task plan.
    let packageElements: ReadonlySet<string>;
    try {
      packageElements = new Set((await this.frozenCatalog()).elements.map(element => element.id));
    } catch (error) {
      await this.ports.fail('inputs-changed', `The plan catalog of capability task ${task.id} is unavailable: ${message(error)}`);
      return null;
    }
    const selectedHash = sha256(selected);
    let coordinatorPoint: string | undefined = resume?.point;
    let coordinatorSession: SessionId | undefined = resume?.session;
    let coordinatorBasis = resume?.basis ?? originInvocation;
    let progress = resume?.progress ?? '';
    let pendingAction = resume?.replay;
    let reconstructedFrom = resume?.reconstructedFrom;
    // Consultation children never replace the original suspended consumer source.
    let consumerPoint = request.continuation.point;
    let consumerSession: SessionId | undefined = request.continuation.session;
    for (let attempt = resume?.attempt ?? 1; !this.ports.ignoring(); attempt += 1) {
    const coordinatorIndex = await this.ports.refreshIndex();
    const recovery = await this.continuationEvidence({ task: task.id }, coordinatorIndex);
    // The task's architect may register a case of its current plan revision.
    const capabilityActor = (): ObligationActor => ({ kind: 'capability-task', id: task.id, useCases: new Set(plan.useCases.map(useCase => useCase.id)) });
    const currentBasis = () => {
      const state = replayCapabilityState(this.observe().history.events).tasks.get(task.id);
      return state === undefined ? null : { task: task.id, planRevision: state.planRevision,
        coordinatorInvocation: state.coordinatorInvocation, state: state.status,
        openAssignment: state.activeAssignment, openChild: state.activeChild,
        obligations: { actor: capabilityActor(), projection: this.obligationProjection() } };
    };
    const validateActionInput = async (input: unknown) => {
      const basis = currentBasis();
      if (basis === null) return { valid: false as const, issues: [{ path: ['task'], message: 'Task is absent', kind: 'state' as const }] };
      const checked = validateCapabilityAction(input, basis);
      if (!checked.valid || checked.value.kind !== 'assign') return checked;
      const body = checked.value.assignment;
      const problems = [...capabilityAuthorizationErrors(body.authorizations, capabilityGuardedPolicy(this.requiredArtifacts(records))), ...assignmentErrors(body, {
        index: this.observe().index, registry: new Map(records.registry.map(entry => [entry.capability, entry])),
        outline: null, capabilityCompatibility: plan.compatibility,
        registeredFeatureFiles: new Set(trackedScenarios(this.observe().history.lines).records.map(record => record.file)),
        package: packageElements,
        guardedPaths: capabilityGuardedPolicy(this.requiredArtifacts(records)),
        revising: true, bounds: engineerBoundsOf(this.observe().policy.limits),
        obligations: { actor: capabilityActor(), projection: this.obligationProjection(), registrations: checked.value.registrations },
      })];
      // The scope is captured before the action is accepted, so a scope the
      // provider refuses is answered here with its path, under the turn's bound.
      const scoped = problems.length > 0 ? null : await checkContinuationScope({ ramify: this.options.ramify, projectRoot: this.projectRoot,
        index: this.observe().index, view: this.input.record.manifest.architectView,
        revision: replayCapabilityState(this.observe().history.events).tasks.get(task.id)?.nextAssignmentSequence ?? 1,
        base: body.scope.base, extra: body.scope.extra, read: body.scope.read, bootstrap: [], rationale: body.scope.rationale }, body, await this.continuationAssignment({ task: task.id }), async () => { const previous = await this.continuationAssignment({ task: task.id }); if (previous !== undefined) await this.ports.ownershipAuthority(previous).read(); });
      if (scoped?.scope != null) this.preparedScopes.set(body, scoped.scope);
      const errors = [...problems, ...(scoped?.errors ?? [])];
      return errors.length === 0 ? checked : { valid: false as const, issues: errors.map(problem => ({
        path: problem.path.split('.'), message: problem.message, kind: 'state' as const,
      })) };
    };
    const tools: ToolDefinition[] = [
      // The complete action schema reaches the model once, in the submit_capability_action
      // declaration; this validator takes any object and the harness validates it exactly.
      { name: 'validate_capability_action', description: 'Check an action against the current task without submitting it. The input is a candidate submit_capability_action input, as that declaration\'s schema describes it.',
        inputSchema: { type: 'object', description: 'A candidate submit_capability_action input; that declaration carries the complete schema.', additionalProperties: true } as JsonSchema,
        execute: async input => {
          const checked = await validateActionInput(input);
          return { text: JSON.stringify(checked), isError: !checked.valid };
        } },
      { name: 'update_capability_plan', description: 'Commit a new plan revision from the current one.',
        inputSchema: z.toJSONSchema(capabilityPlanUpdateSchema) as JsonSchema,
        execute: async input => {
          const basis = currentBasis();
          if (basis === null) return { text: 'Task is absent', isError: true };
          const checked = validateCapabilityPlanUpdate(input, basis);
          if (!checked.valid) return { text: JSON.stringify(checked.issues), isError: true };
          try {
            const next = buildCapabilityPlanRevision(plan, checked.value);
            await this.ports.commitCapability({
              type: 'capability-plan-revised', data: { task: task.id, revision: next.revision,
                basedOn: plan.revision, invocation: checked.value.invocation },
            }, [{ path: capabilityLayout.plan(task.id, next.revision), id: task.id,
              revision: next.revision, body: next }]);
            plan = next;
            return { text: JSON.stringify({ task: task.id, revision: next.revision,
              runRecordRoot: this.input.directory, path: this.path(capabilityLayout.plan(task.id, next.revision)) }) };
          } catch (error) { return { text: message(error), isError: true }; }
        } },
      createGitInspectionTool(this.projectRoot),
    ];
    let unreported: string[] = [];
    const action = pendingAction ?? await this.ports.runInvocation<CapabilityAction>(agent, {
      role: 'capability-architect', task: { kind: 'capability', goal: request.original.need, requirements: [`Fulfil capability request ${request.id}, preserving its complete original usage, constraints and examples in support:capability-request.`], modules: [task.provider, task.consumer, ...task.authority.map(entry => entry.owner)],
        startingPointGroups: await Promise.all([...this.observe().records.results.values()]
          .filter(result => result.coordination?.kind === 'capability-task' && result.coordination.id === task.id)
          .flatMap(result => {
            const assignment = this.observe().records.assignments.get(result.iteration);
            return assignment === undefined ? [] : [this.engineerStartingPoints(assignment, result)];
          })),
        omit: [`# Selected plan package ${selectedHash}\n\n${selected}`], literalSections: [
          { key: 'support:work-item-package', text: selected },
          { key: 'support:capability-request', text: `Original request: ${JSON.stringify(request, null, 2)}` },
          { key: 'support:capability-plan', text: `Current plan: ${JSON.stringify(plan, null, 2)}` },
        ] }, work: { task: `capability-action:${coordinatorBasis}`, capabilityTask: task.id, request: request.id }, attempt,
      loaded, systemPrompt: renderCapabilityArchitectPrompt(loaded, this.projectRoot),
      prompt: [
        ...(recovery === undefined ? [] : [recovery]),
        `# Capability task ${task.id}`, `Use task ${task.id}, planRevision ${plan.revision} and invocation ${coordinatorBasis} as your action basis.`,
        ...[
          `Current plan ${plan.task} revision ${plan.revision} is in support:capability-plan.`,
          `Provider entry decisions: ${JSON.stringify(providerDecisions, null, 2)}`,
          `Provider entry outlines: ${JSON.stringify(providerItems.map(entry => ({ item: entry.id, outline: records.outlines.get(entry.id) ?? [] })), null, 2)}`,
          ...[defaultWriteScopeSection(await this.defaultWriteScopes(this.observe().index,
            [task.provider, task.consumer, ...task.authority.map(entry => entry.owner)], [...capabilityGuardedPolicy(this.requiredArtifacts(records))])).join('\n').trim()]
            .filter(section => section !== ''),
          `# Selected plan package ${selectedHash}\n\nComplete current body is in support:work-item-package.`,
          ...(progress === '' ? [] : [`Progress from the last turn: ${progress}`]),
        ],
        ...[this.obligationBriefing({ kind: 'capability-task', id: task.id }).join('\n')].filter(section => section !== ''),
        `Inspect current source and Git directly. The latest task assignment results are ${[...records.results.values()].filter(result => result.coordination?.kind === 'capability-task' && result.coordination.id === task.id).map(result => `${result.iteration}: ${result.outcome}, gate ${result.gate ?? '(none)'}, commit ${result.commit ?? '(none)'}, findings ${result.findings.join('; ')}`).join(' | ') || '(none)'}. Use the supplied absolute run-record pointers for named gate and review evidence. Request handback when, in your judgment, the real provider and requesting consumer meet the original need: report ${task.id} and every obligation you registered done in the same or an earlier action; a request that leaves one unreported is rejected naming it. The original examples are the request's context; say what you concluded about one in your summary.`,
        ...(this.events('capability-assigned').filter(event => event.data.task === task.id).length >= 3
          ? [`# Progress reconsideration\n${task.id} has had ${this.events('capability-assigned').filter(event => event.data.task === task.id).length} assignments. Assess the retained results and outstanding obligations. Continue useful work, change the approach, seek a prerequisite, or end refinement if requirements are satisfied and its additional value is too small for the cost. Explain why another attempt is worthwhile, especially if it repeats an unsuccessful approach. The count itself establishes no outcome.`] : []),
      ].join('\n\n'),
      start: coordinatorPoint === undefined ? { mode: 'fresh' } : { mode: 'continue', ref: coordinatorPoint },
      ...(coordinatorPoint === undefined || coordinatorSession === undefined
        ? reconstructedFrom === undefined
          ? { requestedBy: { invocation: originInvocation, reason: 'capability-needed' as const } }
          : { replaces: { session: reconstructedFrom, reason: 'reconstructed' as const },
            degraded: { requested: 'continued' as const, reason: 'The prior capability architect session ended; durable current request, plan and evidence were supplied to a fresh session.' } }
        : { session: coordinatorSession, continuing: 'capability-coordination' as const }),
      toolName: 'submit_capability_action', description: 'Record the next action for this capability task.',
      inputSchema: z.toJSONSchema(capabilityActionSchema) as JsonSchema,
      submissionSchema: 'ramify-agent.capability-action/1',
      validate: async input => {
        const checked = await validateActionInput(input);
        // What the last rejected handback request left unreported, which an
        // exhausted turn's failure names.
        if (!checked.valid) unreported = unreportedByHandback(input, currentBasis()?.obligations);
        return checked.valid ? { ok: true, value: checked.value }
          : { ok: false, errors: checked.issues.map(issue => ({ path: issue.path.join('.'), message: issue.message,
            expected: issue.kind === 'state' ? 'current task authority' : 'the action schema' })) };
      },
      scope: { write: null, measurement: null, size: null },
      keep: ended => ended === 'context-budget-reached' ? finished('not-kept') : kept,
      equip: () => ({ builtinTools: ['read', 'grep', 'ls'], tools }),
    });
    const replayed = pendingAction !== undefined;
    pendingAction = undefined;
    if (this.ports.ignoring()) return null;
    if (action.ended === 'context-budget-reached') {
      progress = `The prior architect turn reached its context boundary without an accepted action. The capability task remains unfinished. Reassess the current plan, retained evidence and obligations, then submit the next useful action.`;
      coordinatorPoint = undefined;
      coordinatorSession = undefined;
      reconstructedFrom = action.session;
      coordinatorBasis = action.id;
      continue;
    }
    if (action.ended !== 'submitted') {
      // An exhausted rejection bound names what the last rejected handback
      // request left unreported; it is no verdict on the code.
      const owed = action.ended === 'invalid-submission' && unreported.length > 0
        ? `; its last rejected handback request left ${unreported.join(', ')} without a done report` : '';
      await this.ports.fail('invalid-submission', `The capability architect of ${task.id} did not submit an action${owed}`);
      return null;
    }
    if (action.value === undefined) {
      await this.ports.fail('invalid-submission', `The capability architect of ${task.id} submitted no accepted action`);
      return null;
    }
    const chosen = action.value;
    // Registrations and reports apply on acceptance, before the action; a
    // replayed accepted action finds them recorded and applies nothing again.
    if (!await this.ports.handling.recordObligations(capabilityActor(), action.id, chosen)) return null;
    if (chosen.kind === 'partial') {
      progress = `${chosen.progress}; unfinished: ${chosen.unfinished.join('; ')}`;
      coordinatorPoint = action.ref || undefined;
      coordinatorSession = action.kept ? action.session : undefined;
      if (coordinatorPoint === undefined || coordinatorSession === undefined) {
        coordinatorPoint = undefined; coordinatorSession = undefined; reconstructedFrom = action.session;
      }
      coordinatorBasis = action.id;
      await this.ports.write({ type: 'capability-coordinator-resumed', data: {
        task: task.id, invocation: action.id, session: coordinatorSession ?? action.session,
      } });
      await this.ports.afterWrite('capability-coordinator-resumed', this.input.record.jobId);
      if (this.ports.ignoring()) return null;
      continue;
    }
    // Submission ends the turn; the committed invocation now owns the
    // transition it selected. The next turn will use this same basis.
    if (!this.events('capability-coordinator-resumed').some(event => event.data.task === task.id &&
      event.data.invocation === action.id)) {
      await this.ports.write({ type: 'capability-coordinator-resumed', data: {
        task: task.id, invocation: action.id, session: action.session,
      } });
      await this.ports.afterWrite('capability-coordinator-resumed', this.input.record.jobId);
      if (this.ports.ignoring()) return null;
    }
    // Recovery's model-free append advanced this same recorded coordinator.
    // Replay the effect from the original action point, then continue from the
    // explicitly retained appended recovery point rather than the stale action.
    let nextCoordinator = { point: replayed ? resume?.point : action.ref || undefined,
      session: replayed && resume?.session === undefined ? undefined : action.kept ? action.session : undefined,
      invocation: action.id };
    if (chosen.kind === 'consult-consumer') {
      const answer = await this.consultCapabilityConsumer(agent, packages, task, request, plan, chosen, action.id,
        { point: consumerPoint, session: consumerSession });
      if (answer === null) return null;
      consumerPoint = answer.point;
      consumerSession = answer.session;
      progress = `A-engineer answered exchange ${answer.exchange.id}: ${answer.exchange.answer?.text}; objections: ${answer.exchange.answer?.objections.join('; ')}`;
    } else if (chosen.kind === 'assign') {
      const result = await this.assignCapabilityWork(agent, packages, baseline, item, task, plan, chosen, action.id,
        { point: consumerPoint, session: consumerSession }, { point: action.ref, session: action.session });
      if (result === null) return null;
      consumerPoint = result.point;
      consumerSession = result.session;
      if (result.coordinator !== undefined) {
        nextCoordinator = result.coordinator;
      }
      progress = result.progress;
    } else if (chosen.kind === 'request-placement' || chosen.kind === 'unresolved') {
      const resolution = chosen.kind === 'request-placement'
        ? await this.requestPlacement(agent, packages, baseline, item, {
          forCapability: task.id, question: chosen.problem, requiredBehavior: plan.need,
          findings: chosen.evidence.map(text => ({ text, citations: [] })),
          candidates: [{ owner: task.provider, note: task.placementReason }], unresolved: [chosen.problem],
          hypotheses: [], localDecisions: [],
        })
        : await this.resolveUnresolved(agent, packages, baseline, item, {
          invocation: action.id, conflict: chosen.problem, evidence: chosen.evidence,
        });
      if (resolution === null) return null;
      progress = `Boundary decision returned to capability task ${task.id}: ${JSON.stringify(resolution)}`;
    } else if (chosen.kind === 'request-handback') {
      const result = await this.ports.verifyCapabilityHandback(agent, packages, item, task, request, plan, chosen, action, replayed);
      if (result === null) return null;
      if (result.kind === 'accepted') return { kind: 'satisfied', guidance: result.guidance };
      progress = `Handback refused for ${task.id}: ${result.guidance}`;
      if (result.coordinator !== undefined) nextCoordinator = result.coordinator;
    } else {
      // Nested delegation is installed with the depth-first recovery path.
      return { kind: 'delegated' };
    }
    coordinatorPoint = nextCoordinator.point;
    coordinatorSession = nextCoordinator.session;
    if (coordinatorPoint === undefined || coordinatorSession === undefined) {
      coordinatorPoint = undefined; coordinatorSession = undefined; reconstructedFrom = action.session;
    }
    coordinatorBasis = nextCoordinator.invocation;
    await this.ports.write({ type: 'capability-coordinator-resumed', data: {
      task: task.id, invocation: coordinatorBasis, session: coordinatorSession ?? action.session,
    } });
    }
    return null;
  }

  /** A question uses the requesting module engineer's saved point with read-only
   * equipment. The reply belongs to the task, never to a new A assignment. */
  private async consultCapabilityConsumer(
    agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>, task: CapabilityTask,
    request: CapabilityRequest, plan: CapabilityPlan,
    action: Extract<CapabilityAction, { kind: 'consult-consumer' }>, invocation: string,
    consumer: { readonly point: string | null; readonly session: SessionId | undefined },
    existingExchange?: CapabilityExchange,
  ): Promise<{ readonly exchange: CapabilityExchange; readonly point: string; readonly session: SessionId } | null> {
    this.ports.writer.requireSettled('Consumer consultation requires a settled writer');
    const existing = this.observe().records.capabilityExchanges.size;
    const id = existingExchange?.id ?? (task.schema.endsWith('/2') ? `cx-${String(existing + 1).padStart(3, '0')}` : `${task.id}-ex${String(existing + 1).padStart(2, '0')}`);
    const exchange: CapabilityExchange = existingExchange ?? { schema: task.schema.endsWith('/2') ? 'ramify-agent.capability-exchange/2' : 'ramify-agent.capability-exchange/1', id,
      task: task.id, request: request.id, planRevision: plan.revision, question: action.question,
      references: [...action.references], answer: null };
    if (existingExchange === undefined) await this.ports.commitCapability({
      type: 'capability-exchange-opened', data: { task: task.id, exchange: id, invocation },
    }, [{ path: capabilityLayout.exchange(task.id, id, 1), id, revision: 1, body: exchange }]);
    if (existingExchange === undefined) await this.ports.afterWrite('capability-exchange-opened', this.input.record.jobId);
    if (this.ports.ignoring()) return null;
    const loaded = packages.get('engineer');
    if (loaded === undefined) { await this.ports.fail('internal', 'Engineer package is absent for consultation'); return null; }
    const responseSchema = z.object({ answer: z.string().min(1), objections: z.array(z.string()) }).strict();
    if (existingExchange !== undefined) {
      const opened = this.events('capability-exchange-opened').find(event => event.data.exchange === id);
      const prior = [...this.events('invocation-started')].reverse().find(event =>
        opened !== undefined && event.sequence > opened.sequence && event.data.role === 'engineer' &&
        event.data.work.capabilityTask === task.id && event.data.work.request === request.id);
      const ended = prior === undefined ? undefined : this.events('invocation-ended').find(event => event.data.invocation === prior.data.invocation);
      if (prior !== undefined && ended?.data.ended === 'submitted' && ended.data.submission !== null) {
        const bytes = await readIfExists(this.path(runLayout.submission(prior.data.invocation)));
        const outcome = this.ports.committedBody(runLayout.outcome(prior.data.invocation)) as InvocationOutcome | null;
        if (bytes === undefined || sha256(bytes) !== ended.data.submission ||
          outcome?.submission?.hash !== ended.data.submission || outcome.disposition !== 'applied' || !outcome.settled.confirmed) {
          await this.ports.fail('recovery-exhausted', `Consultation ${id} has an unauthenticated submitted answer`);
          return null;
        }
        const raw = JSON.parse(bytes.toString('utf8')) as Record<string, unknown>;
        const { schema: _schema, ...body } = raw;
        const parsed = responseSchema.safeParse(body);
        if (raw.schema !== 'ramify-agent.capability-consultation/1' || !parsed.success) {
          await this.ports.fail('recovery-exhausted', `Consultation ${id} has an invalid submitted answer`);
          return null;
        }
        const answered: CapabilityExchange = { ...exchange, answer: { invocation: prior.data.invocation,
          text: parsed.data.answer, objections: parsed.data.objections } };
        await this.ports.commitCapability({
          type: 'capability-exchange-answered', data: { task: task.id, exchange: id, invocation: prior.data.invocation },
        }, [{ path: capabilityLayout.exchange(task.id, id, 2), id, revision: 2, body: answered }]);
        return { exchange: answered, point: consumer.point ?? '', session: consumer.session ?? request.continuation.session as SessionId };
      }
    }
    // Every consultation branches from the ORIGINAL accepted capability
    // request. Neither a prior answer nor the parent's later head is its
    // source; exploration and new role/tool input remain only in the child.
    const source = request.continuation;
    const reconstructed = source.point === null || readSessionPointReference(source.point)?.runId !== this.input.record.jobId
      || !await this.ports.hasSessionPoint(agent, this.input.record.jobId, source.point);
    const response = await this.ports.runInvocation(agent, {
      role: 'engineer', task: { kind: 'consultation', modules: [task.consumer], goal: action.question,
        requirements: [`Answer the exact question using complete request ${request.id} and current plan ${plan.task} revision ${plan.revision}; preserve the advisory boundary.`],
        literalSections: [
          { key: 'support:capability-request', text: `Original request: ${JSON.stringify(request, null, 2)}` },
          { key: 'support:capability-plan', text: `Current plan: ${JSON.stringify(plan, null, 2)}` },
        ], consultationSubmissionSchema: JSON.stringify(z.toJSONSchema(responseSchema)) }, work: { capabilityTask: task.id, request: request.id },
      attempt: this.events('invocation-started').filter(event => event.data.role === 'engineer' &&
        event.data.work.capabilityTask === task.id && event.data.work.request === request.id).length + 1,
      loaded, systemPrompt: renderEngineerPrompt(loaded, this.projectRoot, this.observe().policy.limits.commandTimeoutMs, this.projectRoot),
      prompt: [`# Read-only consumer consultation ${id}`, `Question: ${action.question}`,
        `Current plan revision ${plan.revision} is in support:capability-plan; original request and suspended source are in support:capability-request.`,
        `References: ${action.references.join(', ')}`, 'Answer directly; source edits require a separate A-scoped assignment.'].join('\n\n'),
      workingDirectory: this.projectRoot,
      start: reconstructed ? { mode: 'fresh' } : { mode: 'fork', from: source.point! },
      ...(reconstructed ? {
        ...(consumer.session === undefined ? {} : { replaces: { session: consumer.session, reason: 'reconstructed' as const } }),
        degraded: { requested: 'fork' as const, reason: 'The recorded original capability request point is unavailable; current request, suspended source and plan were supplied under the named consumer consultation recovery.' },
      } : { fork: { from: { session: source.session as SessionId, invocation: request.invocation }, reason: 'capability-consultation' as const, briefs: [] } }),
      previewEquipment: { builtinTools: ['read', 'grep', 'ls'], tools: [] },
      toolName: 'answer_capability_consultation', description: 'Answer the question from the preserved A-engineer session.',
      inputSchema: z.toJSONSchema(responseSchema) as JsonSchema,
      submissionSchema: 'ramify-agent.capability-consultation/1', validate: input => validateAgainst(responseSchema, input),
      scope: { write: null, measurement: null, size: null },
      equip: () => ({ builtinTools: ['read', 'grep', 'ls'], tools: [] }),
      keep: () => finished('not-kept'),
    });
    if (this.ports.ignoring()) return null;
    if (response.ended !== 'submitted' || response.value === undefined) {
      await this.ports.fail('invalid-submission', `Consultation ${id} did not fork the original capability request point and answer`);
      return null;
    }
    const answered: CapabilityExchange = { ...exchange, answer: { invocation: response.id,
      text: response.value.answer, objections: response.value.objections } };
    await this.ports.commitCapability({
      type: 'capability-exchange-answered', data: { task: task.id, exchange: id, invocation: response.id },
    }, [{ path: capabilityLayout.exchange(task.id, id, 2), id, revision: 2, body: answered }]);
    await this.ports.afterWrite('capability-exchange-answered', this.input.record.jobId);
    if (this.ports.ignoring()) return null;
    return { exchange: answered, point: consumer.point ?? '', session: consumer.session ?? source.session as SessionId };
  }

  async finishCapabilityHandback(task: CapabilityTask, request: CapabilityRequest,
    plan: CapabilityPlan, action: Extract<CapabilityAction, { kind: 'request-handback' }>, invocation: string,
    qualification: CapabilityHandbackBasis,
  ): Promise<CapabilityHandback> {
    const { gate, candidateTree: tree, reviews } = qualification;
    if (gate.audited === null) throw new Error(`Gate ${gate.id} has no audited commit`);
    const state = replayCapabilityState(this.observe().history.events).tasks.get(task.id);
    if (state === undefined || capabilityHandbackReadiness(task, request, plan, state).length > 0) {
      throw new Error(`Capability ${task.id} lost its completion basis`);
    }
    const delta = await this.candidates.diffNameStatus(this.projectRoot, request.source.tree, gate.audited);
    const reviewRefs = reviews.flatMap(entry => {
      const body = this.ports.committedBody(reviewLayout.request(entry.id));
      return body === undefined ? [] : [refOf(entry.id, 1, body)];
    });
    const handback = { schema: task.schema.endsWith('/2') ? 'ramify-agent.capability-handback/2' as const : 'ramify-agent.capability-handback/1' as const, task: task.id, request: request.id,
      plan: refOf(task.id, plan.revision, plan), sourceRevision: gate.audited, returnedTree: tree,
      deltaFromSuspension: delta.map(change => change.path), summary: action.summary,
      interfaces: action.interfaces, compatibility: [...plan.compatibility],
      checks: [refOf(gate.id, 1, this.ports.committedBody(runLayout.gate(gate.id)))],
      reviews: reviewRefs, limitations: [...action.limitations,
        ...this.ports.unresolvedOf(task.id, this.observe().findings)
          .map(entry => `Unresolved CheckFinding ${entry.checkFinding}: ${entry.reason}`)],
    };
    await this.ports.commitCapability({ type: 'capability-handed-back', data: {
      task: task.id, handback: task.id, invocation,
    } }, [{ path: capabilityLayout.handback(task.id), id: task.id, revision: 1, body: handback }], qualification);
    await this.ports.afterWrite('capability-handed-back', this.input.record.jobId);
    return handback;
  }

  /** A completed task gate is never rerun during recovery. The retained gate
   * and authenticated action produce the same handback once. */
  private async recoverVerifyingHandback(task: CapabilityTask, request: CapabilityRequest,
    plan: CapabilityPlan): Promise<boolean> {
    const started = [...this.events('capability-verification-started')].reverse().find(event => event.data.task === task.id);
    if (started?.data.gate === undefined) {
      await this.ports.fail('recovery-exhausted', `Capability ${task.id} has no retained shared completion gate`);
      return false;
    }
    const ended = this.events('invocation-ended').find(event => event.data.invocation === started.data.invocation);
    const bytes = await readIfExists(this.path(runLayout.submission(started.data.invocation)));
    const outcome = this.ports.committedBody(runLayout.outcome(started.data.invocation)) as InvocationOutcome | null;
    if (ended?.data.ended !== 'submitted' || ended.data.submission === null || bytes === undefined ||
      sha256(bytes) !== ended.data.submission || outcome?.submission?.hash !== ended.data.submission || outcome.disposition !== 'applied') {
      await this.ports.fail('recovery-exhausted', `Capability ${task.id} has no authenticated handback request`);
      return false;
    }
    const raw = JSON.parse(bytes.toString('utf8')) as Record<string, unknown>;
    const { schema: _schema, ...body } = raw;
    const parsed = capabilityActionSchema.safeParse(body);
    const gate = gateAttemptSchema.safeParse(this.ports.committedBody(runLayout.gate(started.data.gate)));
    const tree = (await this.ports.previewCandidateTree()).tree;
    if (raw.schema !== 'ramify-agent.capability-action/1' || !parsed.success || parsed.data.kind !== 'request-handback' ||
      parsed.data.task !== task.id || parsed.data.planRevision !== plan.revision || !gate.success ||
      gate.data.verdict !== 'passed' || gate.data.audited === null || await this.candidates.commitTree(this.projectRoot, gate.data.audited) !== tree) {
      await this.ports.fail('inputs-changed', `Capability ${task.id} completion evidence or candidate changed before handback`);
      return false;
    }
    const records = this.observe().records;
    const latest = [...records.assignments.values()].reverse().find(entry => entry.coordination?.kind === 'capability-task' &&
      entry.coordination.id === task.id && records.results.get(entry.id)?.outcome === 'accepted');
    const reviews = [...reviewStateOf(this.observe().history.events).values()].filter(entry => entry.iteration === latest?.id);
    if (latest === undefined || reviews.some(entry => entry.settledBy === null ||
      entry.attempts.find(attempt => attempt.id === entry.settledBy)?.finished?.result !== 'complete')) {
      await this.ports.fail('recovery-exhausted', `Capability ${task.id} lost its accepted iteration or review result`);
      return false;
    }
    await this.finishCapabilityHandback(task, request, plan, parsed.data, started.data.invocation, { gate: gate.data, gateRecord: refOf(gate.data.id, 1, this.ports.committedBody(runLayout.gate(gate.data.id))), candidateTree: tree, reviews, acceptedBasis: started.data.completion?.acceptedBasis ?? null, reconciliation: started.data.completion === undefined ? this.ports.latestBasis(task.id) ?? null : started.data.completion.reconciliation, recovered: true });
    return true;
  }

  /** One task-owned writer. Its scope is captured from the real module view;
   * the provisional candidate stays live for the next owner. */
  private async coordinateNestedCapability(
    agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>, baseline: MeasurementSnapshot,
    item: WorkItem, parentTask: CapabilityTask, parentPlan: CapabilityPlan, assignment: IterationAssignment,
    suspended: InvocationResult<EngineerSubmission>,
    coordinator: { readonly point: string | undefined; readonly session: SessionId | undefined },
    existingRequest?: CapabilityRequest,
  ): Promise<{ readonly guidance: string; readonly coordinatorPoint: string; readonly coordinatorSession: SessionId;
    readonly coordinatorInvocation: string } | { readonly kind: 'retry-name'; readonly guidance: string } | null> {
    if (suspended.ended !== 'submitted' || suspended.value?.kind !== 'capability-needed') {
      await this.ports.fail('invalid-submission', `Nested need from ${assignment.id} has no retained requesting module engineer`);
      return null;
    }
    const assignmentOwner = 'module' in assignment.scope.base ? assignment.scope.base.module : parentTask.consumer;
    this.ports.writer.requireSettled(`Nested request from ${assignment.id} cannot suspend an unsettled writer`);
    const correctionTask = suspended.value.request.revises === undefined ? undefined
      : this.observe().records.capabilityTasks.get(suspended.value.request.revises.task);
    if (existingRequest === undefined && this.input.record.identityContract === 'descriptive' && suspended.value.request.revises !== undefined &&
      (correctionTask?.parent.id !== parentTask.id || !this.observe().records.capabilityHandbacks.has(correctionTask.id)
        || this.observe().records.retirements.has(correctionTask.request) || this.observe().records.retirements.has(correctionTask.id))) {
      await this.ports.fail('inputs-changed', `The nested correction task ${suspended.value.request.revises.task} is not an active accepted handback of ${parentTask.id}`);
      return null;
    }
    const requestId = existingRequest?.id ?? ('requestKey' in suspended.value.request ? suspended.value.request.requestKey.slice('draft:'.length) : capabilityRequestId(this.observe().records.capabilityRequests.size + 1));
    const source = existingRequest?.source ?? await captureProvisionalSource({ git: this.git, sourceGit: this.options.provisionalSourceGit, projectRoot: this.projectRoot, runDirectory: this.input.directory,
      request: requestId, acceptedBase: this.accepted(), writerSettledBy: suspended.id,
      invocationScoped: this.input.record.identityContract === 'descriptive',
      changedPaths: await this.git.changedPaths(this.projectRoot, this.accepted()) });
    if (existingRequest === undefined) {
      await this.ports.afterWrite('capability-source-captured', this.input.record.jobId);
      if (this.ports.ignoring()) return null;
    }
    const request: CapabilityRequest = existingRequest ?? { schema: this.input.record.identityContract === 'descriptive' ? 'ramify-agent.capability-request/2' : 'ramify-agent.capability-request/1', id: requestId,
      parent: { kind: 'capability-task', id: parentTask.id }, assignment: assignment.id,
      invocation: suspended.id, consumer: assignmentOwner,
      requirementPackage: refOf(parentTask.id, parentPlan.revision, parentPlan),
      continuation: { session: suspended.session, point: suspended.ref || null }, source,
      summary: suspended.value.summary, original: identifyCapabilityNeed(requestId, suspended.value.request) };
    try {
      if (existingRequest === undefined) {
      const retiredRequest = this.input.record.identityContract === 'descriptive' ? correctionTask?.request : undefined;
      await this.ports.commitCapability({ type: 'capability-requested', data: {
        request: request.id, parent: parentTask.id, assignment: assignment.id, invocation: suspended.id,
        ...(retiredRequest === undefined ? {} : { retiredRequest }),
      } }, [{ path: capabilityLayout.request(request.id), id: request.id, revision: 1, body: request },
        ...(retiredRequest === undefined ? [] : [capabilityRetirement(retiredRequest, 'capability-request', request.id,
          assignment.id, request.original.revises!.reason)])]);
      }
    } catch (error) {
      if (error instanceof CapabilityNameConflictError && existingRequest === undefined
        && this.input.record.identityContract === 'descriptive' && 'requestKey' in suspended.value.request) {
        const current = this.observe().records;
        const errors = descriptiveCapabilityNameErrors(suspended.value.request, {
          requests: new Set(current.capabilityRequests.keys()),
          examples: new Set([...current.capabilityRequests.values()].flatMap(entry => entry.original.examples.map(example => example.id))),
        });
        if (errors.length > 0) {
          if (![...current.capabilityRequests.values()].some(accepted => accepted.source.snapshot === source.snapshot))
            await unlink(this.path(source.snapshot)).catch(() => {});
          return { kind: 'retry-name', guidance: `The serialized nested request acceptance refused this proposal. Correct the same task with a meaningful qualifier: ${errors.map(entry => `${entry.path}: ${entry.message}; expected ${entry.expected}`).join(' | ')}` };
        }
      }
      if (error instanceof CapabilityNameConflictError && existingRequest === undefined
        && ![...this.observe().records.capabilityRequests.values()].some(accepted => accepted.source.snapshot === source.snapshot))
        await unlink(this.path(source.snapshot)).catch(() => {});
      await this.ports.fail('unresolvable-requirement', `Nested need ${request.id} could not be recorded: ${message(error)}`);
      return null;
    }
    const loaded = packages.get('capability-architect');
    if (loaded === undefined) { await this.ports.fail('internal', 'No capability architect package was captured'); return null; }
    const recovered = existingRequest === undefined ? undefined : await this.replayAcceptedCapabilityQualification(request, 'capability-architect');
    if (recovered === null) return null;
    let qualification: InvocationResult<QualificationAction> | undefined = recovered;
    let point = coordinator.point;
    let session = coordinator.session;
    let returned = '';
    let qualificationTurn = this.events('invocation-started').filter(event => event.data.role === 'capability-architect' &&
      event.data.work.request === request.id).length;
    while (true) {
    const count = qualificationTurn++;
    const appended = qualification !== undefined || point === undefined ? { outcome: 'session-lost' as const }
      : await this.ports.appendSession(agent, point, `nested:${request.id}:${count}`, `Qualify nested request ${request.id} from ${assignment.id}`);
    if (appended.outcome === 'conflict') throw new Error(`The capability architect did not take its note: ${appended.reason}`);
    const lost = appended.outcome === 'session-lost' || session === undefined;
    qualification ??= await this.ports.runInvocation<QualificationAction>(agent, {
      role: 'capability-architect', task: { kind: 'capability-qualification', goal: request.original.need,
        requirements: [`Qualify nested request ${request.id} against its complete original constraints and examples and current parent plan ${parentPlan.task} revision ${parentPlan.revision}.`],
        modules: [parentTask.provider, parentTask.consumer], literalSections: [
          { key: 'support:capability-request', text: `Original request: ${JSON.stringify(request, null, 2)}` },
          { key: 'support:capability-plan', text: `Current plan: ${JSON.stringify(parentPlan, null, 2)}` },
        ] }, work: { capabilityTask: parentTask.id, request: request.id },
      attempt: this.events('invocation-started').filter(event => event.data.work.capabilityTask === parentTask.id &&
        event.data.work.request === request.id).length + 1,
      loaded, systemPrompt: renderCapabilityArchitectPrompt(loaded, this.projectRoot),
      prompt: [`# Qualify nested request ${request.id}`, `Parent task ${parentTask.id} waits with ${assignment.id} unfinished.`,
        `Complete request ${request.id} is in support:capability-request; current parent plan is in support:capability-plan.`,
        `Use request ${request.id} and invocation ${suspended.id} in the action.`,
        ...(request.schema.endsWith('/2') ? ['For delegation propose taskKey draft:capability-task:<provider-behavior-name>.'] : []),
        'Inspect the actual API and use. Satisfy with existing behavior or delegate a fresh child; matching module names do not establish reuse.',
        ...(returned === '' ? [] : [`# Boundary decision\n\n${returned}`]),
        ...(this.events('invocation-started').filter(event => event.data.work.request === request.id && event.data.role === 'capability-architect').length >= 3
          ? ['# Progress reconsideration\nThe nested qualification has returned repeatedly. Assess the decisions and current evidence, explain what another exchange would add, and change approach or seek a concrete missing prerequisite if needed. Repetition alone establishes no outcome.'] : [])].join('\n\n'),
      start: lost ? { mode: 'fresh' } : { mode: 'continue', ref: appended.ref },
      ...(lost ? { ...(session === undefined ? {} : { replaces: { session, reason: 'reconstructed' as const } }),
        degraded: { requested: 'continued' as const, reason: 'The parent capability architect session was lost; its request and current plan were reconstructed.' } }
        : { session: session!, continuing: 'capability-coordination' as const }),
      toolName: 'submit_capability_qualification', description: 'Qualify this nested need under the parent task.',
      inputSchema: z.toJSONSchema(request.schema.endsWith('/2') ? descriptiveQualificationActionSchema : qualificationActionSchema) as JsonSchema,
      submissionSchema: request.schema.endsWith('/2') ? 'ramify-agent.capability-qualification/2' : 'ramify-agent.capability-qualification/1',
      validate: async input => { const checked = validateAgainst(request.schema.endsWith('/2') ? descriptiveQualificationActionSchema : qualificationActionSchema, input);
        if (!checked.ok) return checked;
        if (checked.value.request !== request.id || checked.value.invocation !== suspended.id)
          return { ok: false, errors: [{ path: 'request', message: 'The nested request basis is stale', expected: `${request.id} and ${suspended.id}` }] };
        if (checked.value.kind === 'delegate-capability' && request.schema.endsWith('/2')) {
          const errors = capabilityRequirementErrors(checked.value.requirementRefs, await this.frozenCatalog());
          const taskId = checked.value.taskKey?.slice('draft:'.length);
          if (taskId !== undefined && this.observe().records.capabilityTasks.has(taskId)) errors.push({
            path: 'taskKey', message: `"${taskId}" is already accepted or retired`, expected: 'an unused draft:capability-task:<name>',
          });
          if (errors.length > 0) return { ok: false, errors };
        }
        return checked; },
      scope: { write: null, measurement: null, size: null }, keep: () => kept,
      equip: () => ({ builtinTools: ['read', 'grep', 'ls'], tools: [] }),
    });
    if (qualification.ended !== 'submitted' || qualification.value === undefined) {
      await this.ports.fail('invalid-submission', `The parent architect did not qualify nested request ${request.id}`);
      return null;
    }
    if (qualification.value.kind === 'request-placement' || qualification.value.kind === 'unresolved') {
      const pending = qualification.value;
      const resolution = pending.kind === 'request-placement'
        ? await this.requestPlacement(agent, packages, baseline, item, {
          forCapability: request.id, question: pending.problem, requiredBehavior: request.original.need,
          findings: pending.evidence.map(text => ({ text, citations: [] })),
          candidates: [{ owner: parentTask.provider, note: parentTask.placementReason }],
          unresolved: [pending.problem], hypotheses: [], localDecisions: [],
        }, this.events('placement-requested').find(event => event.data.capability === request.id)?.data.request)
        : await this.resolveUnresolved(agent, packages, baseline, item, {
          invocation: qualification.id, conflict: pending.problem, evidence: pending.evidence,
        }, this.events('unresolved-requested').find(event => event.data.invocation === qualification!.id)?.data.request);
      if (resolution === null) return null;
      returned = `The responsible plan architect answered the nested boundary request: ${JSON.stringify(resolution)}`;
      point = qualification.ref || undefined;
      session = qualification.kept ? qualification.session : undefined;
      qualification = undefined;
      continue;
    }
    if (qualification?.value === undefined ||
      (qualification.value.kind !== 'satisfy-with-existing' && qualification.value.kind !== 'delegate-capability')) {
      await this.ports.fail('internal', `Nested qualification of ${request.id} produced no final decision`);
      return null;
    }
    const decision = qualification.value;
    if (decision.kind === 'satisfy-with-existing') {
      await this.ports.write({ type: 'capability-qualified', data: {
        request: request.id, invocation: qualification.id, outcome: 'satisfied', evidence: decision.evidence,
      } });
      return { guidance: `Nested need ${request.id} uses existing ${decision.api.symbol} at ${decision.api.path}. ${decision.guidance}. Verify it in ${assignment.id}.`,
        coordinatorPoint: qualification.ref, coordinatorSession: qualification.session,
        coordinatorInvocation: qualification.id };
    }
    const records = this.observe().records;
    const taskId = decision.taskKey?.slice('draft:'.length) ?? capabilityTaskId(records.capabilityTasks.size + 1);
    const priorHandback = request.original.revises === undefined ? undefined : records.capabilityHandbacks.get(request.original.revises.task);
    const providerItems = records.workItems.filter(entry => entry.module === decision.provider);
    const child: CapabilityTask = { schema: request.schema.endsWith('/2') ? 'ramify-agent.capability-task/2' : 'ramify-agent.capability-task/1', id: taskId, request: request.id,
      parent: request.parent, originatingAssignment: assignment.id, consumer: assignmentOwner,
      provider: decision.provider, placementReason: decision.placementReason,
      authority: [{ owner: assignmentOwner, reason: 'Requesting consumer integration and task-local architecture' },
        ...(decision.provider === assignmentOwner ? [] : [{ owner: decision.provider, reason: decision.placementReason }])],
      relatedEntries: providerItems.map(entry => ({ entry: entry.id, reason: 'Provider entry remains separate from this task' })),
      deferredWorkItems: providerItems.map(entry => entry.id), source,
      ...(priorHandback === undefined || request.original.revises === undefined ? {} : { revises: {
        handback: refOf(priorHandback.task, 1, priorHandback), sourceRevision: priorHandback.sourceRevision,
        reason: request.original.revises.reason,
      } }),
      limits: captureCapabilityLimits(this.observe().policy) };
    const plan: CapabilityPlan = { schema: child.schema.endsWith('/2') ? 'ramify-agent.capability-plan/2' : 'ramify-agent.capability-plan/1', task: child.id, revision: 1, basedOn: 0,
      updatedBy: qualification.id, revisionReason: 'Initial nested request', need: request.original.need,
      proposedInterface: 'Undecided; inspect actual source and consumer use',
      useCases: request.original.examples.map(example => ({ id: example.id, expectedBehavior: example.title, derivedFrom: [example.id] })),
      compatibility: [...request.original.constraints],
      outline: ['Review existing behavior and affected owners', 'Coordinate provider and requesting module engineer', 'Verify use and hand back'],
      decisions: [{ decision: `Coordinate in ${decision.provider}`, reason: decision.placementReason,
        evidence: [...decision.requirementRefs] }], openQuestions: [], requirementRefs: [...decision.requirementRefs],
      originalExamples: request.original.examples.map(example => example.id) };
    try { await this.ports.commitCapability({ type: 'capability-delegated', data: {
      task: child.id, request: request.id, parent: parentTask.id, invocation: qualification.id, planRevision: 1,
      ...(request.schema.endsWith('/2') && request.original.revises !== undefined ? { retiredTask: request.original.revises.task } : {}),
    } }, [
      { path: capabilityLayout.task(child.id), id: child.id, revision: 1, body: child },
      { path: capabilityLayout.plan(child.id, 1), id: child.id, revision: 1, body: plan },
      ...(request.schema.endsWith('/2') && request.original.revises !== undefined
        ? [capabilityRetirement(request.original.revises.task, 'capability-task', child.id, assignment.id, request.original.revises.reason)] : []),
    ]); } catch (error) {
      const current = this.observe().records;
      if (error instanceof CapabilityNameConflictError && request.schema.endsWith('/2') && decision.taskKey !== undefined
        && (current.capabilityTasks.has(taskId) || current.retirements.has(taskId))) {
        returned = `The serialized nested delegation refused taskKey: "${decision.taskKey}" resolves to ${taskId}, already accepted or retired. Propose an unused draft:capability-task:<name> with a meaningful qualifier in this same qualification task.`;
        point = qualification.ref || undefined;
        session = qualification.kept ? qualification.session : undefined;
        qualification = undefined;
        continue;
      }
      throw error;
    }
    const providerDecisions = [...records.decisions.values()].filter(entry => entry.owner === decision.provider);
    const selected = new TextDecoder().decode(await readFile(this.path(runLayout.capturedPlan)));
    const childItem = records.workItems.find(entry => entry.module === assignmentOwner) ?? item;
    const result = await this.runCapabilityCoordinator(agent, packages, baseline, childItem, child, request, plan,
      qualification.id, selected, providerItems, providerDecisions);
    if (result === null || result.kind !== 'satisfied') return null;
    return { guidance: result.guidance, coordinatorPoint: qualification.ref, coordinatorSession: qualification.session,
      coordinatorInvocation: qualification.id };
    }
  }

  /** Capability tasks issue the same durable assignment and use the same
   * engineer executor as work items. The task supplies the design basis and
   * owns its sequence; the parent work item is only the continuation context. */
  private async assignCapabilityWork(
    agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>, baseline: MeasurementSnapshot,
    item: WorkItem, task: CapabilityTask, plan: CapabilityPlan,
    action: Extract<CapabilityAction, { kind: 'assign' }>, invocation: string,
    consumer: { readonly point: string | null; readonly session: SessionId | undefined },
    coordinator: { readonly point: string | undefined; readonly session: SessionId | undefined },
    existingAssignment?: IterationAssignment,
  ): Promise<{ readonly progress: string; readonly point: string | null; readonly session: SessionId | undefined;
    readonly coordinator?: { readonly point: string | undefined; readonly session: SessionId | undefined; readonly invocation: string } } | null> {
    this.ports.writer.requireSettled('Capability assignment requires a settled writer');
    const state = replayCapabilityState(this.observe().history.events).tasks.get(task.id);
    if (state === undefined) { await this.ports.fail('recovery-exhausted', `Capability task ${task.id} has no state`); return null; }
    const sequence = existingAssignment?.coordination?.kind === 'capability-task'
      ? existingAssignment.coordination.sequence : state.nextAssignmentSequence;
    const id = existingAssignment?.id ?? capabilityAssignmentId(task.id, sequence);
    const records = this.observe().records;
    let assignment = existingAssignment;
    if (assignment === undefined) {
      const index = await this.ports.refreshIndex();
      const body = action.assignment;
      let packageElements: ReadonlySet<string>;
      try {
        packageElements = new Set((await this.frozenCatalog()).elements.map(element => element.id));
      } catch (error) {
        await this.ports.fail('inputs-changed', `Capability assignment ${id} package is unavailable: ${message(error)}`);
        return null;
      }
      const problems = [...capabilityAuthorizationErrors(body.authorizations, capabilityGuardedPolicy(this.requiredArtifacts(records))), ...assignmentErrors(body, {
        index, registry: new Map(records.registry.map(entry => [entry.capability, entry])),
        outline: null, capabilityCompatibility: plan.compatibility,
        registeredFeatureFiles: new Set(trackedScenarios(this.observe().history.lines).records.map(record => record.file)),
        package: packageElements,
        guardedPaths: capabilityGuardedPolicy(this.requiredArtifacts(records)),
        revising: true, bounds: engineerBoundsOf(this.observe().policy.limits),
        // The action's registrations were recorded on acceptance, before it.
        obligations: {
          actor: { kind: 'capability-task', id: task.id, useCases: new Set(plan.useCases.map(useCase => useCase.id)) },
          projection: this.obligationProjection(),
        },
      })];
      if (problems.length > 0) {
        await this.ports.fail('invalid-submission', `Capability assignment ${id} is invalid: ${problems.map(entry => `${entry.path}: ${entry.message}`).join('; ')}`);
        return null;
      }
      const scope = await this.preparedScope(body, sequence, [], () => resolveWriteScope({ ramify: this.options.ramify, projectRoot: this.projectRoot, index,
        view: this.input.record.manifest.architectView, revision: sequence,
        base: body.scope.base, extra: body.scope.extra, read: body.scope.read, bootstrap: [],
        rationale: body.scope.rationale }), `Capability assignment ${id}`);
      if (scope === null) return null;
      const planRef = refOf(task.id, plan.revision, plan);
      for (const authorization of body.authorizations ?? []) {
        const target = await resolveRealTarget(this.projectRoot, authorization.path);
        if (target.ok && !scope.resolved.files.includes(target.resolved)) scope.resolved.files.push(target.resolved);
      }
      let source: PackageCitation | undefined;
      try {
        // A capability's selected package may cover newly added owners. The
        // parent work item's selection is narrower, so cite against the
        // frozen run catalog instead of treating the parent's IDs as its set.
        source = await this.citeCurrentDeviations(body.citedElements);
      } catch (error) {
        await this.ports.fail('inputs-changed', `Capability assignment ${id} package is unavailable: ${message(error)}`);
        return null;
      }
      const startingTree = (await this.ports.previewCandidateTree()).tree;
      const startingPaths = await Promise.all((await this.git.changedPaths(this.projectRoot, this.accepted()))
        .map(async path => ({ path, hash: await readFile(join(this.projectRoot, path)).then(bytes => sha256(bytes)).catch(error => {
          if (['ENOENT', 'ENOTDIR'].includes((error as NodeJS.ErrnoException).code ?? '')) return null;
          throw error;
        }) })));
      assignment = await this.buildIterationAssignment({
        id, item, basis: planRef,
        coordination: { kind: 'capability-task', id: task.id, sequence, plan: planRef, startingTree, startingPaths },
        body, scope, source, evidenceObligations: [],
        guardedPaths: this.requiredArtifacts(records).map(entry => entry.path),
        authorizations: (body.authorizations ?? []).map(entry => ({ ...entry, by: planRef })),
      });
      await this.ports.write({ type: 'capability-assigned', data: { task: task.id, assignment: id, sequence, invocation,
        architectRef: coordinator.point === undefined || coordinator.session === undefined ? null : { session: coordinator.session, ref: coordinator.point },
        ...(this.ports.pendingCorrection(task.id) === undefined ? {} : { corrects: this.ports.pendingCorrection(task.id)! }) } }, [
        { path: iterationLayout.assignment(task.id, sequence), id, revision: 1, body: assignment },
      ]);
      await this.ports.afterWrite('capability-assigned', this.input.record.jobId);
      if (this.ports.ignoring()) return null;
    }
    let coordinatorAfterNested: { point: string | undefined; session: SessionId | undefined; invocation: string } | undefined;
    const committed = this.observe().records;
    const already = committed.results.get(id);
    let recoveredReturn: { session: SessionId; point: string; priorInvocation: string; guidance: string } | undefined;
    if (already === undefined) {
      // A child can finish while its parent engineer remains suspended. The
      // request and submission are durable, so resume that same assignment
      // rather than opening a second engineer iteration after restart.
      const starts = this.events('invocation-started').filter(event => event.data.role === 'engineer' && event.data.work.iteration === id);
      const pending = [...committed.capabilityRequests.values()].reverse().find(request =>
        request.parent.kind === 'capability-task' && request.parent.id === task.id && request.assignment === id &&
        !starts.some(start => start.data.invocation !== request.invocation &&
          this.observe().history.events.findIndex(event => event.type === 'invocation-started' && event.data.invocation === start.data.invocation) >
          this.observe().history.events.findIndex(event => event.type === 'invocation-started' && event.data.invocation === request.invocation)));
      if (pending !== undefined) {
        const raw = await readIfExists(this.path(runLayout.submission(pending.invocation)));
        let parsed: EngineerSubmission | undefined;
        try { if (raw !== undefined) parsed = parseRecordedEngineerSubmission(JSON.parse(raw.toString('utf8')), this.input.record.identityContract ?? 'legacy'); }
        catch (error) {
          await this.ports.fail('recovery-exhausted', `Nested request ${pending.id} has an invalid recorded engineer submission: ${message(error)}`);
          return null;
        }
        if (parsed?.kind !== 'capability-needed') {
          await this.ports.fail('recovery-exhausted', `Nested request ${pending.id} cannot recover its engineer continuation`);
          return null;
        }
        const suspended: InvocationResult<EngineerSubmission> = {
          id: pending.invocation, ended: 'submitted', value: parsed,
          ref: pending.continuation.point ?? '', session: pending.continuation.session, kept: true, outcomeKind: 'submitted',
        };
        const childId = replayCapabilityState(this.observe().history.events).requests.get(pending.id)?.task;
        const handback = childId === null || childId === undefined ? undefined : committed.capabilityHandbacks.get(childId);
        let guidance: string;
        if (handback !== undefined) {
          guidance = `Nested capability ${childId} handed back at ${handback.returnedTree}.\n${capabilityHandbackGuidance(this.path('.'), handback)}\nContinue ${id} from its current candidate; its assigned goal remains unfinished.`;
        } else {
          const nested = await this.coordinateNestedCapability(agent, packages, baseline, item, task, plan,
            assignment, suspended, coordinator, pending);
          if (nested === null) return null;
          if (!('kind' in nested)) coordinatorAfterNested = { point: nested.coordinatorPoint, session: nested.coordinatorSession,
            invocation: nested.coordinatorInvocation };
          guidance = nested.guidance;
        }
        recoveredReturn = { session: suspended.session, point: suspended.ref, priorInvocation: suspended.id, guidance };
      }
    }
    let outcome: IterationOutcome | null = already === undefined
      ? await this.takeIteration(agent, packages, baseline, item, assignment, await this.ports.refreshIndex(), recoveredReturn)
      : { kind: 'closed', result: already };
    while (outcome?.kind === 'capability-needed') {
      const suspended: InvocationResult<EngineerSubmission> = {
        id: outcome.invocation, ended: 'submitted', value: { kind: 'capability-needed', summary: outcome.summary, request: outcome.need },
        ref: outcome.point, session: outcome.session, kept: true, outcomeKind: 'submitted',
      };
      const nested = await this.coordinateNestedCapability(agent, packages, baseline, item, task, plan,
        assignment, suspended, coordinatorAfterNested ?? coordinator);
      if (nested === null) return null;
      if (!('kind' in nested)) coordinatorAfterNested = { point: nested.coordinatorPoint, session: nested.coordinatorSession,
        invocation: nested.coordinatorInvocation };
      outcome = await this.takeIteration(agent, packages, baseline, item, assignment, await this.ports.refreshIndex(), {
        session: outcome.session, point: outcome.point, priorInvocation: outcome.invocation, guidance: nested.guidance,
      });
    }
    if (outcome === null) return null;
    if (outcome.kind !== 'closed') throw new Error(`Capability assignment ${id} did not close`);
    const settled = this.events('capability-assignment-settled').some(event => event.data.assignment === id);
    if (!settled) {
      const stateOutcome = outcome.result.outcome === 'accepted' ? 'accepted'
        : outcome.result.outcome === 'partial' ? 'partial' : 'failed';
      const completed = this.observe().records;
      const mutated = new Set<string>();
      const outside = new Set<string>();
      const unknown = new Set<string>();
      for (const engineer of this.events('invocation-started').filter(event => event.data.role === 'engineer' && event.data.work.iteration === id)) {
        const started = completed.invocations.get(engineer.data.invocation);
        const writer = completed.outcomes.get(engineer.data.invocation);
        if (started?.candidateBefore !== undefined && writer?.candidateAfter !== undefined) {
          for (const change of await this.git.diffNameStatus(this.projectRoot, started.candidateBefore, writer.candidateAfter)) mutated.add(change.path);
        }
        for (const path of writer?.outsideScope ?? []) if (mutated.has(path)) outside.add(path);
        for (const path of writer?.unknownPlacement ?? []) if (mutated.has(path)) unknown.add(path);
      }
      await this.ports.write({ type: 'capability-assignment-settled', data: {
        task: task.id, assignment: id, outcome: stateOutcome, mutated: [...mutated].sort(), outsideScope: [...outside].sort(), unknownPlacement: [...unknown].sort(),
        endingTree: (await this.ports.previewCandidateTree()).tree,
      } });
      await this.ports.afterWrite('capability-assignment-settled', this.input.record.jobId);
    }
    return { progress: `Assignment ${id}: ${outcome.result.outcome}; gate ${outcome.result.gate ?? '(none)'}; commit ${outcome.result.commit ?? '(none)'}; result ${this.path(iterationLayout.result(task.id, sequence))}. ${outcome.result.findings.join('; ')}`,
      point: consumer.point, session: consumer.session,
      ...(coordinatorAfterNested === undefined ? {} : { coordinator: coordinatorAfterNested }) };
  }

  /**
   * What a provider's report that it cannot conform records. The obligation
   * is derived from the assignment and not from what the module engineer said; the
   * report is deduplicated per obligation revision, and it returns to the
   * module architect of the consumer that asked for this provider work, even
   * while that consumer is yielded.
   *
   * A second report at the same obligation revision means the agreement was
   * not revised and this provider cannot proceed; the run fails with the
   * evidence rather than asking the same question again.
   */
  async reportRevisionNeeded(
    item: WorkItem,
    assignment: IterationAssignment,
    detail: string,
  ): Promise<'reported' | null> {
    const owed = assignment.evidenceObligations
      .find(evidence => evidence.obligation !== undefined && evidence.against === 'real')?.obligation;
    if (owed === undefined) {
      await this.ports.fail('internal',
        `${assignment.id} reported it cannot conform, and its assignment owes no real-provider obligation`);
      return null;
    }
    const already = this.events('revision-needed')
      .some(event => event.data.obligation.id === owed.id && event.data.obligation.revision === owed.revision);
    if (already) {
      await this.ports.fail('unresolvable-requirement',
        `${item.id} reports again that it cannot conform to ${owed.id} at revision ${owed.revision}, and the agreement was not revised: ${detail}`,
        [contractsLayout.obligation(owed.id, owed.revision), iterationLayout.result(item.id, this.assignedCount(item.id))]);
      return null;
    }

    const records = this.observe().records;
    const consumer = this.consumerOf(records, item, owed.id, owed.revision);
    if (consumer === null) {
      await this.ports.fail('internal',
        `${owed.id} has no consumer work item to return the report of ${assignment.id} to`);
      return null;
    }
    await this.ports.write({
      type: 'revision-needed',
      data: { obligation: owed, iteration: assignment.id, consumerWorkItem: consumer },
    });
    await this.ports.afterWrite('revision-needed', this.input.record.jobId);
    return this.ports.ignoring() ? null : 'reported';
  }

  /**
   * The consumer work item a provider's report returns to: the one whose
   * yield started this provider work, where that item is still open, and
   * otherwise the open item that holds a requirement of the obligation.
   */
  private consumerOf(
    records: ReturnType<typeof committedRecords>,
    item: WorkItem,
    obligation: string,
    revision: number,
  ): string | null {
    const completed = new Set(this.events('work-item-completed').map(event => event.data.workItem));
    const bindings = this.bindingsOf();
    const holders = [...records.requirements.values()]
      .filter(requirement => requirement.obligation === obligation && requirement.contractRevision === revision)
      .map(requirement => bindings.get(bindingKey(requirement.id, requirement.revision)) ?? requirement.workItem);
    if (item.startedFor !== null && holders.includes(item.startedFor) && !completed.has(item.startedFor)) return item.startedFor;
    return holders.find(holder => !completed.has(holder)) ?? holders[0] ?? null;
  }

  /**
   * One contract revision the consumer's architect assigned directly: the
   * contract engineer that establishes it, the gate that verifies it, and
   * the reopening a passing gate commits. The agreement in force stays in
   * force until then.
   */
  private async reviseContract(
    agent: AgentPort,
    packages: ReadonlyMap<string, LoadedPackage>,
    baseline: MeasurementSnapshot,
    item: WorkItem,
    assignment: IterationAssignment,
  ): Promise<ContractOutcome | null> {
    const loaded = packages.get('contract-engineer');
    if (loaded === undefined) {
      await this.ports.fail('internal', 'No prompt package is loaded for the contract engineer');
      return null;
    }
    const records = this.observe().records;
    const reference = assignment.revisesContract!;
    const contract = records.contracts.get(reference.id);
    if (contract === undefined) {
      await this.ports.fail('internal', `${assignment.id} revises "${reference.id}", which this run has not registered`);
      return null;
    }
    const reported = this.events('revision-needed')
      .filter(event => this.observe().records.obligations.get(event.data.obligation.id)?.contract.id === contract.id)
      .at(-1);
    const report = reported === undefined
      ? undefined
      : (records.results.get(reported.data.iteration)?.findings ?? []).join('; ');

    return this.runContractSession(agent, packages, baseline, item, assignment, loaded, {
      provider: contract.provider,
      capability: contract.capability.id,
      number: this.assignedCount(item.id),
      revision: {
        contract: contract.id,
        inForce: contract.revision,
        behavior: contract.behavior,
        artifacts: [
          ...contract.artifacts.interface.map(entry => entry.path),
          ...contract.artifacts.conformance.map(entry => entry.path),
          ...contract.artifacts.fake.map(entry => entry.path),
        ],
        rationale: assignment.approach,
        ...(report === undefined || report === '' ? {} : { report }),
      },
    });
  }

  /**
   * One contract sub-session: the assignment that licenses it, the module engineer
   * that establishes the agreement, the gate that verifies it, and the
   * registration a passing gate makes.
   *
   * It is an iteration of the requesting work item, with its own identifier,
   * scope, gate and result. A caller that dies discovers its outcome from
   * those records and needs no reply from it.
   */
  private async takeContract(
    agent: AgentPort,
    packages: ReadonlyMap<string, LoadedPackage>,
    baseline: MeasurementSnapshot,
    item: WorkItem,
    request: {
      readonly need: NeedAsBehavior;
      readonly suggestedProvider?: string | undefined;
      readonly injectionSites?: readonly string[] | undefined;
      readonly invocation: string;
      readonly requestedBy: string;
    },
  ): Promise<ContractOutcome | null> {
    const loaded = packages.get('contract-engineer');
    if (loaded === undefined) {
      await this.ports.fail('internal', 'No prompt package is loaded for the contract engineer');
      return null;
    }
    const records = this.observe().records;
    if (this.observe().restoring) {
      const original = this.events('contract-requested').find(event => event.data.workItem === item.id && event.data.requestedBy === request.requestedBy && event.data.invocation === request.invocation);
      if (original) {
        const assignment = records.assignments.get(original.data.iteration);
        if (!assignment) throw new Error('Original contract assignment is unavailable');
        const number = Number.parseInt(assignment.id.slice(assignment.id.lastIndexOf('.i') + 2), 10);
        return this.runContractSession(agent, packages, baseline, item, assignment, loaded, { need: request.need,
          provider: original.data.provider, capability: original.data.capability, number,
          requestedBy: { invocation: request.invocation, reason: 'contract-needed' } });
      }
    }
    const index = await this.ports.refreshIndex();

    // The owner comes from the registry, and from nothing a module engineer said.
    // A capability the registry does not place, or places with the consumer
    // itself, is a placement question: it goes back to this work item's own
    // architect, which is the role that may ask the plan architect.
    const entry = records.registry.find(candidate => candidate.capability === request.need.capability);
    if (entry === undefined || entry.owner === item.module) {
      return {
        findings: [entry === undefined
          ? `the capability "${request.need.capability}" is not in the registry, so no owner can be resolved for it; place it before it can be delegated`
          : `the registry places "${request.need.capability}" with "${entry.owner}", which is this work item's own module, so there is nothing to delegate`],
      };
    }
    const providerDirectory = directoryOf(index, entry.owner);
    if (providerDirectory === null) {
      return { findings: [`the refreshed architect view has no directory for "${entry.owner}", so no contract scope could be captured`] };
    }
    // The submission judged each site against the view it had; the owner
    // the registry resolves now is the one the scope opens.
    const misplaced = (request.injectionSites ?? []).filter(site => {
      const owner = index === null ? undefined : moduleOwning(index, site);
      return owner === undefined || (owner.module !== item.module && owner.module !== entry.owner);
    });
    if (misplaced.length > 0) {
      return { findings: [`the injection site${misplaced.length === 1 ? '' : 's'} ${misplaced.map(site => `"${site}"`).join(', ')} ${misplaced.length === 1 ? 'lies' : 'lie'} in neither ${item.module} nor ${entry.owner}, and ${injectionSiteRule}; no contract iteration was started`] };
    }

    const outline = (records.outlines.get(item.id) ?? []).at(-1);
    if (outline === undefined) {
      await this.ports.fail('internal', `The contract iteration of ${item.id} has no outline to work from`);
      return null;
    }
    const number = this.assignedCount(item.id) + 1;

    const base = { module: item.module, included: [] as { directory: string; reason: string; instructions: string }[] };
    const scope = await this.contractScope(index, {
      revision: number,
      consumer: item.module,
      provider: entry.owner,
      providerDirectory,
      injectionSites: request.injectionSites ?? [],
      rationale: `The agreement between ${item.module} and ${entry.owner}: the contract, its conformance suite, its fake, the consumer's integration, the files the fake is injected in and the exposure declarations on the path between them. The rest of the provider's implementation is not this iteration's.`,
    });

    const subArtifacts = this.requiredArtifacts(this.observe().records);
    const id = iterationId(item.id, number);
    const parentNumber = Number.parseInt(request.requestedBy.slice(request.requestedBy.lastIndexOf('.i') + 2), 10);
    const parentAssignment = iterationAssignmentSchema.safeParse(this.ports.committedBody(iterationLayout.assignment(item.id, parentNumber)));
    if (!parentAssignment.success || parentAssignment.data.id !== request.requestedBy) {
      await this.ports.fail('inputs-changed', `The requesting assignment ${request.requestedBy} cannot be read`);
      return null;
    }
    // A contract iteration inherits its requester's assignment package by
    // record: the same elements, deviations and hash.
    const assignment = iterationAssignmentSchema.parse({
      schema: this.input.record.identityContract === 'descriptive' ? 'ramify-agent.iteration-assignment/2' : 'ramify-agent.iteration-assignment/1',
      id,
      workItem: item.id,
      outline: refOf(item.id, outline.revision, outline),
      stage: 0,
      kind: 'contract',
      goal: `Establish the agreement that gives ${item.module} the behavior of "${entry.capability}", which ${entry.owner} owns, and integrate it in ${item.module} against a fake.`,
      approach: `${item.module} stated the need as behavior. Design the interface, write the conformance suite and the fake, integrate the fake at the seam where ${entry.owner}'s real export will act, exposed exactly as that export will be, and leave ${entry.owner} to implement the provider.`,
      scope,
      ...(parentAssignment.data.source === undefined ? {} : { source: parentAssignment.data.source }),
      externalCapabilities: [{ capability: entry.capability, owner: entry.owner, role: 'request' }],
      completionEvidence: `${item.module}'s own tests pass against the fake, and the fake passes the conformance suite.`,
      evidenceObligations: [],
      gate: { checkpoint: 'contract', tests: testPolicyOf('contract', base, []) },
      guarded: await captureGuardedFiles(this.projectRoot, subArtifacts.map(artifact => artifact.path), await this.guardedScenarioFiles(), [...await this.auditPreparationPaths(), ...scopeConfigurationPaths(scope)]),
      authorizations: subArtifacts.map(artifact => ({
        path: artifact.path,
        rationale: `The agreement ${artifact.contract.id} is this iteration's to write.`,
        by: refOf(artifact.contract.id, artifact.contract.revision, artifact.contract),
      })),
      requestedBy: request.requestedBy,
    } satisfies IterationAssignment);

    await this.ports.write({
      type: 'contract-requested',
      data: {
        workItem: item.id,
        iteration: id,
        scopeRevision: scope.revision,
        invocation: request.invocation,
        capability: entry.capability,
        consumer: item.module,
        provider: entry.owner,
        requestedBy: request.requestedBy,
        revises: null,
      },
    }, [
      { path: iterationLayout.assignment(item.id, number), id, revision: 1, body: assignment },
    ]);
    await this.ports.afterWrite('contract-requested', this.input.record.jobId);
    if (this.ports.ignoring()) return null;

    return this.runContractSession(agent, packages, baseline, item, assignment, loaded, {
      need: request.need,
      provider: entry.owner,
      capability: entry.capability,
      number,
      requestedBy: { invocation: request.invocation, reason: 'contract-needed' },
    });
  }

  /**
   * The write scope of one contract iteration: the requesting consumer, and
   * the directories of the contract, its conformance suite and its fake
   * under the provider, with the declarations on the path between the two.
   *
   * It is given directories because the files it will write may not exist
   * yet and their names are the agreement's to choose. A revision is scoped
   * the same way: it rewrites the same three places.
   */
  private async contractScope(
    index: ArchitectIndex | null,
    subject: {
      readonly revision: number;
      readonly consumer: string;
      readonly provider: string;
      readonly providerDirectory: string;
      /** The files the agreement names as holding the fake, on either side. */
      readonly injectionSites: readonly string[];
      readonly rationale: string;
    },
  ) {
    return resolveWriteScope({ ramify: this.options.ramify,
      projectRoot: this.projectRoot,
      index,
      view: this.input.record.manifest.architectView,
      revision: subject.revision,
      base: { module: subject.consumer, included: [] },
      extra: [
        { path: `${subject.providerDirectory}/src/interfaces`, purpose: 'contract', kind: 'directory' },
        { path: `${subject.providerDirectory}/src/tests`, purpose: 'conformance', kind: 'directory' },
        { path: `${subject.providerDirectory}/src/fakes`, purpose: 'fake', kind: 'directory' },
        ...[...new Set(subject.injectionSites)].map(path => ({ path, purpose: 'fake-injection' as const })),
        ...declarationsBetween(index, subject.consumer, subject.provider).map(path => ({ path, purpose: 'exposure-declaration' as const })),
      ],
      read: [subject.provider, subject.consumer],
      bootstrap: [],
      rationale: subject.rationale,
    });
  }

  /** The contract engineer's invocations, its gate, and what a passing gate registers. */
  private async runContractSession(
    agent: AgentPort,
    packages: ReadonlyMap<string, LoadedPackage>,
    baseline: MeasurementSnapshot,
    item: WorkItem,
    assignment: IterationAssignment,
    loaded: LoadedPackage,
    subject: {
      readonly need?: NeedAsBehavior | undefined;
      readonly revision?: RevisionBriefing | undefined;
      readonly provider: string;
      readonly capability: string;
      readonly number: number;
      /** The invocation whose need opened this sub-session; none for a revision its architect assigned. */
      readonly requestedBy?: RequestRelation | undefined;
    },
  ): Promise<ContractOutcome | null> {
    const savedResult = this.observe().records.results.get(assignment.id);
    if (this.observe().restoring && savedResult) return { findings: [...savedResult.findings], result: savedResult };
    // A revision its architect assigned may raise the bounds, as any
    // assignment may; a sub-session a module engineer's need opened runs under
    // the policy's.
    const bounds = this.engineerBounds(assignment);
    const systemPrompt = renderContractPrompt(loaded, this.projectRoot, bounds.commandTimeoutMs);
    // Its write scope, and the provider whole: the agreement is written on
    // the provider's side of the boundary.
    const measurementScope = writeScopeMeasurement(assignment.scope, [subject.provider]);
    const priorStarts = this.events('invocation-started').filter(event => event.data.role === 'contract-engineer' && event.data.work.iteration === assignment.id);
    const priorGates = this.events('gate-attempted').flatMap(event => { const parsed = gateAttemptSchema.safeParse(this.ports.committedBody(runLayout.gate(event.data.gate))); return parsed.success && parsed.data.subject.iteration === assignment.id ? [parsed.data] : []; });
    const latestStart = priorStarts.at(-1);
    let originalContractInvocation = this.observe().restoring && latestStart && !priorGates.some(gate => gate.proposedBy === latestStart.data.invocation && gate.verdict !== 'passed') ? latestStart.data.invocation : undefined;
    const invocations: string[] = priorStarts.map(event => event.data.invocation);
    const findings: string[] = [];
    let sessionRef: string | undefined;
    /** The contract engineer's session while the harness keeps it; `sessionRef` is its executor's point. */
    let session: SessionId | undefined;
    let failedGate: { id: string; cause: string | null; summary: string[] } | undefined;
    let repairRound = priorGates.filter(gate => gate.next === 'repair').length;
    let attempt = originalContractInvocation ? priorStarts.length - 1 : priorStarts.length;
    const priorRepair = [...priorGates].reverse().find(gate => gate.next === 'repair');
    if (priorRepair) failedGate = await this.ports.diagnosticsOf(priorRepair);
    if (latestStart) {
      const outcome = this.ports.effectiveInvocationOutcome(latestStart.data.invocation);
      const ended = this.events('invocation-ended').find(event => event.data.invocation === latestStart.data.invocation);
      if (ended?.data.kept && outcome?.settled.confirmed && outcome.session?.ref) { session = latestStart.data.session; sessionRef = outcome.session.ref; }
      if (ended && outcome?.settled.confirmed && outcome.ended === 'checkpoint-pending') {
        findings.push(`Architect handoff after compaction: ${outcome.checkpointReason ?? 'Reconsider the unfinished contract.'}`,
          `No agreement was registered. Retained context: ${this.path(runLayout.transcript(latestStart.data.session))}`);
        const closed = await this.ports.handling.closeIteration(item, subject.number, assignment, {
          outcome: 'partial', invocations, findings, gate: null, commit: null,
        });
        await this.ports.finishSession(session, 'work-closed');
        return this.ports.ignoring() ? null : { findings, result: closed };
      }
    }

    for (;;) {
      if (this.ports.ignoring()) return null;
      attempt += 1;
      const before = await takeLineSnapshot(this.projectRoot, this.accepted(), this.git);
      const guarded = await this.ports.engineerGuard(assignment);
      const tools = this.implementationTools({
        scopeRevision: assignment.scope.revision,
        guarded,
        commandTimeoutMs: bounds.commandTimeoutMs,
        submissions: { legalOutcomes: ['contract-proposed', 'partial', 'unsuitable'], completionOutcome: null },
      });
      const index = await this.ports.refreshIndex();

      const identityRecords = this.observe().records;
      const acceptedAgreement = assignment.revisesContract === undefined
        ? [...identityRecords.contracts.values()].find(record => record.capability.id === subject.capability && record.provider === subject.provider)
        : identityRecords.contracts.get(assignment.revisesContract.id);
      const acceptedObligation = acceptedAgreement === undefined ? undefined
        : [...identityRecords.obligations.values()].find(record => record.contract.id === acceptedAgreement.id);
      const agreementRequirements = acceptedObligation === undefined ? []
        : [...identityRecords.requirements.values()].filter(record => record.obligation === acceptedObligation.id);
      const currentBindings = this.bindingsOf();
      const ownAcceptedRequirement = acceptedAgreement === undefined || assignment.revisesContract === undefined ? undefined
        : agreementRequirements.find(record =>
          (currentBindings.get(bindingKey(record.id, record.revision)) ?? record.workItem) === item.id);
      const conversionBlockers: string[] = [];
      if (assignment.revisesContract !== undefined && acceptedAgreement?.mode === 'fake-backed') {
        if (acceptedObligation === undefined || !this.events('provider-conformed').some(event =>
          event.data.obligation === acceptedObligation.id && event.data.revision === acceptedObligation.revision))
          conversionBlockers.push(`provider obligation ${acceptedObligation?.id ?? '<missing>'} has not conformed at its current revision`);
        const providerWork = acceptedObligation === undefined ? undefined
          : providerItemOf(identityRecords.workItems, acceptedObligation.id, acceptedObligation.revision, currentBindings);
        if (providerWork === undefined) conversionBlockers.push('the current provider obligation has no bound provider work item');
        else if (!this.events('work-item-completed').some(event => event.data.workItem === providerWork.id))
          conversionBlockers.push(`provider work item ${providerWork.id} has not completed`);
        for (const requirement of agreementRequirements) {
          if (!this.events('requirement-verified').some(event =>
            event.data.requirement === requirement.id && event.data.revision === requirement.revision))
            conversionBlockers.push(`consumer requirement ${requirement.id} has not been verified at its current revision`);
        }
      }
      const identity: ContractIdentityContext = acceptedAgreement === undefined ? { kind: 'fresh' }
        : assignment.revisesContract === undefined
          ? { kind: 'attach', contractId: acceptedAgreement.id, providerObligationId: acceptedObligation?.id ?? null, provider: acceptedAgreement.provider }
          : { kind: 'revise', contractId: acceptedAgreement.id, providerObligationId: acceptedObligation?.id ?? null,
            consumerRequirementId: ownAcceptedRequirement?.id ?? null, provider: acceptedAgreement.provider,
            mode: acceptedAgreement.mode, consumerWorkItem: item.id,
            consumerRequirements: agreementRequirements.map(record => ({ id: record.id,
              workItem: currentBindings.get(bindingKey(record.id, record.revision)) ?? record.workItem })),
            conversionBlockers };
      // The requester's assignment package reaches the session once.
      let assignmentPackage: string | undefined;
      try {
        if (assignment.source !== undefined) assignmentPackage = await this.packageText(assignment.source, assignment.workItem);
      } catch (error) {
        await this.ports.fail('inputs-changed', `The assignment package of contract ${assignment.id} cannot be delivered: ${message(error)}`);
        return null;
      }

      const result = await this.ports.runInvocation<ContractSubmission>(agent, {
        role: 'contract-engineer',
        originalInvocation: originalContractInvocation,
        task: { kind: 'contract', modules: [item.module, subject.provider, ...this.consumersOf(subject.capability, item.module)], goal: assignment.goal, requirements: [assignment.completionEvidence], omit: assignmentPackage === undefined ? [] : [assignmentPackage],
          literalSections: assignmentPackage === undefined ? [] : [{ key: 'support:assignment-package', text: assignmentPackage }] },
        work: { workItem: item.id, iteration: assignment.id },
        attempt,
        loaded,
        systemPrompt,
        prompt: contractMessage({
          assignment,
          identityContract: this.input.record.identityContract ?? 'legacy',
          identity,
          projectRoot: this.projectRoot,
          base: this.accepted(),
          ...(subject.need === undefined ? {} : { need: subject.need }),
          ...(subject.revision === undefined ? {} : { revision: subject.revision }),
          consumer: { module: item.module, iteration: assignment.requestedBy ?? null },
          provider: subject.provider,
          existingConsumers: this.consumersOf(subject.capability, item.module),
          ...(failedGate === undefined ? {} : { failedGate }),
          ...(assignmentPackage === undefined ? {} : { package: assignmentPackage }),
        }),
        start: sessionRef === undefined ? { mode: 'fresh' } : { mode: 'continue', ref: sessionRef },
        session,
        continuing: 'repair',
        ...(subject.requestedBy === undefined ? {} : { requestedBy: subject.requestedBy }),
        // An established agreement is kept for the repair its gate may ask
        // for; a budget return or an incomplete one closes the iteration.
        keep: (ended, value) => {
          if (ended === 'submitted' && value !== undefined) return value.kind === 'established' ? kept : finished('work-closed');
          return finished(ended === 'context-budget-reached' ? 'work-closed' : 'not-kept');
        },
        toolName: contractToolName,
        description: 'End your turn with the result of this contract iteration. The harness validates it; an invalid submission is returned with every error and its path, and a valid one ends this invocation.',
        inputSchema: contractAuthorJsonSchema(this.input.record.identityContract ?? 'legacy', identity),
        submissionSchema: this.input.record.identityContract === 'descriptive' ? 'ramify-agent.contract-submission/3' : 'ramify-agent.contract-submission/2',
        validate: async input => {
          const checked = await validateContract(input, {
          index,
          consumer: item.module,
              exists: (path: string) => stat(join(this.projectRoot, path)).then(found => found.isFile(), () => false),
          }, this.input.record.identityContract ?? 'legacy', identity);
          if (!checked.ok || checked.value.kind !== 'established') return checked;
          const submission = checked.value;
          const current = this.observe().records;
          const occupied = new Map<string, string>([
            ...[...current.contracts.keys()].map(id => [id, 'has an accepted contract'] as const),
            ...[...current.obligations.keys()].map(id => [id, 'has an accepted provider obligation'] as const),
            ...[...current.requirements.keys()].map(id => [id, 'has an accepted consumer requirement'] as const),
            ...[...current.retirements.keys()].map(id => [id, 'has a retired execution identity'] as const),
          ]);
          const retainedContract = subject.revision === undefined
            ? [...current.contracts.values()].find(record => record.capability.id === subject.capability && record.provider === submission.provider)
            : current.contracts.get(subject.revision.contract);
          const retained = new Set<string>(retainedContract === undefined ? [] : [retainedContract.id,
            ...[...current.obligations.values()].filter(record => record.contract.id === retainedContract.id).map(record => record.id)]);
          const errors = descriptiveContractIdentityErrors(submission, occupied, retained);
          return errors.length === 0 ? checked : { ok: false, errors };
        },
        scope: {
          write: assignment.scope.revision,
          measurement: this.input.record.baseline && 'measurement' in this.input.record.baseline ? this.input.record.baseline.measurement : null,
          size: null,
        },
        measured: { snapshot: baseline, scope: measurementScope, readScope: readScopeMeasurement(assignment.scope) },
        writer: true,
        guarded,
        readModules: assignment.scope.read,
        equip: tools.equip, previewEquipment: tools.preview,
        bounds: { idleMs: bounds.idleMs, absoluteMs: bounds.absoluteMs, commandTimeoutMs: bounds.commandTimeoutMs },
      });
      if (!invocations.includes(result.id)) invocations.push(result.id);
      originalContractInvocation = undefined;
      sessionRef = result.kept && result.ref !== '' ? result.ref : undefined;
      session = sessionRef === undefined ? undefined : result.session;

      const after = await takeLineSnapshot(this.projectRoot, this.accepted(), this.git);
      const lines = await this.recordLineEvents(result.id, before, after);
      if (this.ports.ignoring()) return null;

      if (result.ended === 'checkpoint-pending' && !this.ports.writer.unsettled()) {
        findings.push(`Architect handoff after compaction: ${result.checkpointReason ?? 'Reconsider the unfinished contract.'}`,
          `No agreement was registered. Retained context: ${this.path(runLayout.transcript(result.session))}`);
        const closed = await this.ports.handling.closeIteration(item, subject.number, assignment, {
          outcome: 'partial', invocations, findings, gate: null, commit: null,
        });
        await this.ports.finishSession(session, 'work-closed');
        return this.ports.ignoring() ? null : { findings, result: closed };
      }

      // A contract session that ended without a result is closed as a
      // threshold return is: it established no agreement, and its local
      // architect decides what comes next, from the digest and the analysis
      // prepared first. An unsettled writer still ends the run, as for the
      // engineer.
      if (result.ended !== 'submitted' || result.value === undefined) {
        if (this.ports.writer.unsettled()) {
          await this.ports.fail(
            result.ended === 'invalid-submission' ? 'invalid-submission' : result.ended === 'failed' ? 'agent-failed' : 'internal',
            `The module engineer working on a contract of ${assignment.id} ended without a result (${result.ended})`,
            [runLayout.outcome(result.id)],
          );
          return null;
        }
        findings.push(`${failedWithoutResult('contract-engineer', assignment.id, result)}; nothing was registered`);
        const failure = await this.failureOf(agent, packages, {
          item, assignment, number: subject.number, role: 'contract-engineer', result, bounds, lines, after, shellLog: tools.shellLog(),
        });
        if (failure === null) return null;
        const closed = await this.ports.handling.closeIteration(item, subject.number, assignment, {
          outcome: 'partial', invocations, findings, gate: null, commit: null, failure,
        });
        await this.ports.finishSession(session, 'work-closed');
        return this.ports.ignoring() ? null : { findings, result: closed };
      }

      if (result.value.kind === 'incomplete') {
        findings.push(
          `the contract iteration ${assignment.id} did not establish the agreement, and registered nothing`,
          ...result.value.unfinished.map(entry => `unfinished: ${entry}`),
          ...result.value.findings,
        );
        const closed = await this.ports.handling.closeIteration(item, subject.number, assignment, {
          outcome: 'partial', invocations, findings, gate: null, commit: null,
        });
        return this.ports.ignoring() ? null : { findings, result: closed };
      }

      const established = result.value;
      const gate = await this.ports.contractGate(item, assignment, result.id, established, repairRound);
      if (gate === null) return null;

      if (gate.verdict === 'passed') {
        let registration: Awaited<ReturnType<typeof this.registerAgreement>>;
        try { registration = await this.registerAgreement(item, assignment, gate.id, established); }
        catch (error) {
          if (!(error instanceof ContractPublicationError)) throw error;
          findings.push(`the accepted agreement name collided with an intervening publication: ${error.message}`);
          const closed = await this.ports.handling.closeIteration(item, subject.number, assignment, {
            outcome: 'partial', invocations, findings, gate: gate.id, commit: gate.audited,
          });
          await this.ports.finishSession(session, 'work-closed');
          return this.ports.ignoring() ? null : { findings, result: closed };
        }
        if (registration === null) return null;
        findings.push(...registration.findings);
        const closed = await this.ports.handling.closeIteration(item, subject.number, assignment, {
          outcome: 'accepted', invocations, findings, gate: gate.id, commit: gate.audited,
        });
        await this.ports.finishSession(session, 'work-closed');
        if (this.ports.ignoring()) return null;
        return { findings, result: closed, ...(registration.cycle === undefined ? {} : { cycle: registration.cycle }) };
      }

      if (gate.next === 'repair') {
        repairRound += 1;
        failedGate = await this.ports.diagnosticsOf(gate);
        continue;
      }
      findings.push(`the contract gate did not pass: ${gate.cause ?? 'unknown'} at gate ${gate.id}; nothing was registered`);
      const closed = await this.ports.handling.closeIteration(item, subject.number, assignment, {
        outcome: gate.cause === 'check-failed' ? 'partial' : gate.next === 'return-to-local-architect' ? 'unsuitable' : 'exhausted',
        invocations, findings, gate: null, commit: null,
      });
      await this.ports.finishSession(session, 'work-closed');
      return this.ports.ignoring() ? null : { findings, result: closed };
    }
  }

  /** The consumers an agreement for one capability already has, this one excluded. */
  private consumersOf(capability: string, exclude: string): string[] {
    const records = this.observe().records;
    const obligations = new Set([...records.obligations.values()].filter(entry => entry.capability === capability).map(entry => entry.id));
    return [...new Set([...records.requirements.values()]
      .filter(requirement => obligations.has(requirement.obligation) && requirement.consumer !== exclude)
      .map(requirement => requirement.consumer))];
  }

  /**
   * The fake-naming rule, verified over the files the agreement names and the
   * consumer locations that hold the fake. It reads the source and not the
   * submission: what generated architectural evidence will show is the
   * source, so the source is what is checked.
   */
  async fakeNamingRule(submission: EstablishedContract): Promise<GateRuleRecord> {
    const paths = [...new Set([
      ...submission.artifacts.interface.map(entry => entry.path),
      ...submission.artifacts.fake.map(entry => entry.path),
      ...submission.fakeInjections,
    ])];
    const files: NamedFile[] = [];
    for (const path of paths) {
      const text = await readFile(join(this.projectRoot, path), 'utf8').catch(() => null);
      if (text !== null) files.push({ path, text });
    }
    const violations = fakeNamingViolations(files, submission.artifacts.fake.map(entry => entry.path));
    return { rule: 'fake-naming', outcome: violations.length === 0 ? 'passed' : 'failed', violations };
  }

  /**
   * What a passing contract gate registers: the contract, the one provider
   * obligation, one requirement per consumer and the provider work item.
   * Every identifier is derived from committed state, and a registration
   * already in the log is not appended again.
   */
  private async registerAgreement(
    item: WorkItem,
    assignment: IterationAssignment,
    gate: string,
    submission: EstablishedContract,
  ): Promise<{ readonly findings: string[]; readonly cycle?: DependencyCycle | undefined } | null> {
    const records = this.observe().records;
    if (this.observe().restoring) {
      const registered = this.events('contract-registered').find(event => event.data.iteration === assignment.id);
      const reopened = this.events('evidence-reopened').find(event => event.data.iteration === assignment.id);
      if (registered || reopened) {
        const phase = registered ?? reopened!;
        const nextRegistration = [...this.events('contract-registered'), ...this.events('evidence-reopened')].filter(event => event.sequence > phase.sequence).sort((left, right) => left.sequence - right.sequence)[0]?.sequence ?? Number.POSITIVE_INFINITY;
        const own = phase.data.requirements.map(id => records.requirements.get(id)).find(requirement => requirement?.consumer === item.module);
        const priorCycle = this.events('dependency-cycle-detected').find(event => event.sequence > phase.sequence && event.sequence < nextRegistration && event.data.closedBy === item.id && phase.data.requirements.some(id => event.data.requirements.includes(id)));
        const findings = registered ? [registered.data.mode === 'access-only'
          ? `the agreement ${registered.data.contract} establishes access to existing behavior: no obligation and no fake`
          : `the agreement ${registered.data.contract} is registered; ${own?.id ?? '(unavailable)'} is open and ${registered.data.obligation} is owed by ${submission.provider}`]
          : [`the agreement ${reopened!.data.contract} is reopened at revision ${reopened!.data.revision}; ${phase.data.requirements.join(', ')} verify again`,
            ...reopened!.data.bindings.map(binding => { const followUp = reopened!.data.followUps.find(entry => entry.workItem === binding.workItem); return followUp ? `${binding.subject.id} at revision ${binding.subject.revision} goes to ${followUp.workItem}, which follows ${followUp.follows}` : `${binding.subject.id} at revision ${binding.subject.revision} stays with ${binding.workItem}, which has not finished`; }),
            ...reopened!.data.superseded.map(id => `${id} closed as superseded: it was assigned under the previous revision`)];
        if (priorCycle) return { findings, cycle: { members: priorCycle.data.members, requirements: priorCycle.data.requirements, workItems: priorCycle.data.workItems } };
        if (phase.data.obligation === null) return { findings };
        if (!own || own.revision !== phase.data.revision) throw new Error('Original registered requirement identity is unavailable');
        const obligation = records.obligations.get(phase.data.obligation);
        if (!obligation || obligation.revision !== phase.data.revision) throw new Error('Original registered obligation identity is unavailable');
        const cycle = await this.checkDependencyGraph(item, { from: own.forCapability, to: obligation.capability, requirement: own.id, workItem: item.id });
        return cycle === undefined ? null : { findings, ...(cycle === null ? {} : { cycle }) };
      }
    }
    // The capability is the one the harness put on the assignment when it
    // resolved the owner from the registry. The agreement did not choose it.
    const capability = assignment.externalCapabilities[0]?.capability;
    const registryEntry = capability === undefined
      ? undefined
      : records.registry.find(candidate => candidate.capability === capability);
    if (registryEntry === undefined) {
      await this.ports.fail('internal', `The contract assignment ${assignment.id} names no registered capability, so no agreement can be registered`);
      return null;
    }
    const forCapability = this.capabilityOfItem(item, records);
    if (forCapability === null) {
      await this.ports.fail('internal', `The consumer ${item.id} implements no capability the registry names, so no dependency edge could be recorded`);
      return null;
    }

    const hashes = new Map<string, string>();
    for (const path of [
      ...submission.artifacts.interface.map(artifact => artifact.path),
      ...submission.artifacts.conformance.map(artifact => artifact.path),
      ...submission.artifacts.fake.map(artifact => artifact.path),
      ...submission.artifacts.exposure.map(artifact => artifact.path),
    ]) {
      hashes.set(path, sha256(await readFile(join(this.projectRoot, path))));
    }

    // A revision names the agreement it revises; the harness fills the next
    // revision number, and the agreement in force stays in force until this
    // transaction. Otherwise an agreement already registered for this
    // capability and this provider is the one in force, and a further
    // consumer attaches to it.
    const revises = assignment.revisesContract;
    const existing = revises === undefined
      ? [...records.contracts.values()].find(candidate =>
        candidate.capability.id === registryEntry.capability && candidate.provider === submission.provider)
      : records.contracts.get(revises.id);
    if (revises !== undefined && existing === undefined) {
      await this.ports.fail('internal', `${assignment.id} revises "${revises.id}", which this run has not registered`);
      return null;
    }
    const contract = revises !== undefined && 'contractKey' in submission ? submission.contractKey.slice('draft:'.length)
      : existing?.id ?? ('contractKey' in submission ? submission.contractKey.slice('draft:'.length)
      : 'contractId' in submission ? submission.contractId : contractId(records.contracts.size + 1));
    const revision = existing === undefined ? 1 : revises === undefined ? existing.revision : existing.revision + 1;

    const bindings = this.bindingsOf();
    const attached = [...records.requirements.values()]
      .filter(requirement => records.obligations.get(requirement.obligation)?.contract.id === (existing?.id ?? contract));
    // Only a revision carries a consumer's existing requirement forward. An
    // engineer that asks for the same agreement again is a further
    // attachment, with a requirement of its own.
    const mine = revises === undefined
      ? undefined
      : attached.find(requirement =>
        (bindings.get(bindingKey(requirement.id, requirement.revision)) ?? requirement.workItem) === item.id);

    const splitKeys = 'consumerRequirementKeys' in submission ? submission.consumerRequirementKeys : null;
    const mergeSubmission = 'scope' in submission && submission.mode === 'fake-backed'
      && 'consumerRequirementKey' in submission && 'retirements' in submission ? submission : null;
    const mergeIds = mergeSubmission === null ? null : new Set(mergeSubmission.retirements.map(entry => entry.id));
    const mergedKey = mergeSubmission?.consumerRequirementKey ?? null;
    const mergeSources = mergeIds === null ? [] : attached.filter(requirement => mergeIds.has(requirement.id));
    const mergeTests = mergeSources.length === 0 ? undefined : {
      policy: mergeSources.some(requirement => requirement.evidence.tests.policy === 'all-project')
        ? 'all-project' as const : 'owned-by-scope' as const,
      exactOwners: [...new Set(mergeSources.flatMap(requirement => requirement.evidence.tests.exactOwners))],
      subtrees: [...new Set(mergeSources.flatMap(requirement => requirement.evidence.tests.subtrees))],
      extraSuites: [...new Set(mergeSources.flatMap(requirement => requirement.evidence.tests.extraSuites))],
    };
    const consumer: AttachedConsumer = {
      requirement: splitKeys !== null ? splitKeys[0]!.slice('draft:'.length) : mergedKey !== null ? mergedKey.slice('draft:'.length)
        : mine?.id ?? ('consumerRequirementId' in submission ? submission.consumerRequirementId
        : 'consumerRequirementKey' in submission ? submission.consumerRequirementKey.slice('draft:'.length) : requirementId(records.requirements.size + 1)),
      workItem: mine?.workItem ?? item.id,
      module: item.module,
      forCapability,
      tests: mergeTests ?? mine?.evidence.tests ?? testPolicyOf('ordinary', { module: item.module, included: [] }, []),
      fakeInjections: mergeSources.length === 0 ? submission.fakeInjections
        : [...new Set([...submission.fakeInjections, ...mergeSources.flatMap(requirement => requirement.evidence.fakeInjections)])],
    };
    // Every consumer of the agreement is reopened at the new revision; each
    // keeps its own identity, its own tests and its own injection sites,
    // and the revising consumer takes the ones this session just wrote.
    const consumers: readonly AttachedConsumer[] = revises === undefined
      ? [consumer]
      : [
        ...attached.filter(requirement => (splitKeys === null || requirement.id !== mine?.id) && !mergeIds?.has(requirement.id))
          .map(requirement => (requirement.id === consumer.requirement ? consumer : {
          requirement: requirement.id,
          workItem: requirement.workItem,
          module: requirement.consumer,
          forCapability: requirement.forCapability,
          tests: requirement.evidence.tests,
          fakeInjections: requirement.evidence.fakeInjections,
        })),
        ...(splitKeys !== null ? splitKeys.map(key => ({ ...consumer, requirement: key.slice('draft:'.length) }))
          : mergedKey !== null ? [consumer]
          : mine === undefined ? [consumer] : []),
      ];

    const obligation = submission.mode === 'access-only' ? null : (existing === undefined || revises !== undefined) && 'providerObligationKey' in submission
      ? submission.providerObligationKey.slice('draft:'.length) : 'providerObligationId' in submission
        ? submission.providerObligationId : records.contracts.has(contract)
        ? [...records.obligations.values()].find(entry => entry.contract.id === contract)?.id ?? obligationId(contract) : obligationId(contract);
    const prior = [
      ...this.events('contract-registered').map(event => ({
        contract: event.data.contract,
        revision: event.data.revision,
        obligation: event.data.obligation,
        requirements: event.data.requirements,
      })),
      ...this.events('evidence-reopened').map(event => ({
        contract: event.data.contract,
        revision: event.data.revision,
        obligation: event.data.obligation,
        requirements: event.data.requirements,
      })),
    ];
    const requirements = submission.mode === 'access-only' ? [] : consumers.map(entry => entry.requirement);
    if (!registrationNeeded(prior, { contract, revision, obligation, requirements })) {
      return { findings: [`the agreement ${contract} at revision ${revision} is already registered; nothing was appended`] };
    }

    const existingProvider = obligation === null || revises !== undefined
      ? undefined
      : providerItemOf(records.workItems, obligation, revision, bindings);
    const registration = registerContract({
      contract,
      ...(obligation === null ? {} : { obligation }),
      revision,
      capability: { ref: refOf(registryEntry.capability, registryEntry.revision, registryEntry), slug: registryEntry.capability, decision: registryEntry.decision },
      submission,
      hashes,
      establishedBy: { iteration: assignment.id, gate },
      consumers: submission.mode === 'access-only' ? [] : consumers,
      // A revision schedules its own work: the reopening binds each new
      // subject to the item responsible for it, reusing the unfinished and
      // following the completed.
      provider: obligation === null || revises !== undefined
        ? { kind: 'none' }
        : existingProvider !== undefined
          ? { kind: 'existing', id: existingProvider.id }
          : { kind: 'create', id: 'contractKey' in submission ? `work-item:provide-${obligation!.slice('provider-obligation:'.length)}` : workItemId(records.workItems.length + 1), goal: `Implement ${registryEntry.capability} in ${submission.provider} so that the agreed conformance suite passes against the real provider.`, startedFor: item.id },
    });

    const kindChangeSubmission = submission.mode === 'access-only' && 'contractKey' in submission
      && 'retirements' in submission ? submission : null;
    const retirementEntries = mergeSubmission !== null
      ? mergeSubmission.retirements.map(entry => ({ id: entry.id, kind: 'consumer-requirement' as const,
        replacements: [mergedKey!.slice('draft:'.length)] }))
      : kindChangeSubmission !== null && revises !== undefined && existing !== undefined
        ? kindChangeSubmission.retirements.map(entry => ({ id: entry.id, kind: entry.kind,
          replacements: [contract] }))
      : 'consumerRequirementKeys' in submission
      ? [{ id: mine!.id, kind: 'consumer-requirement' as const,
        replacements: submission.consumerRequirementKeys.map(key => key.slice('draft:'.length)) }]
      : revises !== undefined && 'contractKey' in submission && existing !== undefined
        ? [{ id: existing.id, kind: 'contract' as const, replacements: [contract] },
          { id: [...records.obligations.values()].find(entry => entry.contract.id === existing.id)!.id,
            kind: 'provider-obligation' as const, replacements: [obligation!] }]
        : [];
    const retirementRecords = retirementEntries.length === 0 ? [] : executionRetirements({
      retirements: retirementEntries,
      authority: { iteration: assignment.id, reason: 'retirements' in submission
        ? submission.retirements.map(entry => entry.reason).join('; ') : 'Authorized agreement revision' },
      accepted: new Set([...records.contracts.keys(), ...records.obligations.keys(), ...records.requirements.keys(),
        ...records.capabilityRequests.keys(), ...records.capabilityTasks.keys()]),
      retired: new Set(records.retirements.keys()),
      published: registration.records,
    });

    if (revises !== undefined) {
      const reopened = await this.reopenAgreement(item, assignment, registration, {
        contract,
        revision,
        obligation,
        previousRevision: existing!.revision,
        records,
        bindings,
        cause: `${assignment.id} revised ${contract} from revision ${existing!.revision} to ${revision}`,
        retirementRecords,
        previousContract: existing!.id,
        previousObligation: [...records.obligations.values()].find(entry => entry.contract.id === existing!.id)?.id ?? null,
      });
      if (reopened === null) return null;
      const findings = [
        `the agreement ${contract} is reopened at revision ${revision}; ${registration.requirements.map(entry => entry.id).join(', ')} verify again`,
        ...reopened.findings,
      ];
      if (mine !== undefined) return { findings };
      const cycle = registration.obligation === null
        ? null
        : await this.checkDependencyGraph(item, {
          from: forCapability,
          to: registration.obligation.capability,
          requirement: consumer.requirement,
          workItem: item.id,
        });
      if (cycle === undefined) return null;
      return { findings, ...(cycle === null ? {} : { cycle }) };
    }

    // An attachment to an agreement already in force adds its requirement and
    // its binding, and nothing else: the contract and the obligation in the
    // log stay as they are.
    const committedBodies = existing === undefined
      ? registration.records
      : registration.records.filter(record => record.path.startsWith('requirements/') || record.path.startsWith('work-items/'));

    await this.ports.write({
      type: 'contract-registered',
      data: {
        contract,
        revision,
        mode: submission.mode,
        iteration: assignment.id,
        obligation,
        requirements: registration.requirements.map(requirement => requirement.id),
        providerWorkItem: registration.providerWorkItem?.id ?? existingProvider?.id ?? null,
      },
    }, committedBodies);
    await this.ports.afterWrite('contract-registered', this.input.record.jobId);
    if (this.ports.ignoring()) return null;

    const findings = [submission.mode === 'access-only'
      ? `the agreement ${contract} establishes access to existing behavior: no obligation and no fake`
      : `the agreement ${contract} is registered; ${consumer.requirement} is open and ${obligation} is owed by ${submission.provider}`];

    const cycle = registration.obligation === null
      ? null
      : await this.checkDependencyGraph(item, {
        from: forCapability,
        to: registration.obligation.capability,
        requirement: consumer.requirement,
        workItem: item.id,
      });
    if (cycle === undefined) return null;
    return { findings, ...(cycle === null ? {} : { cycle }) };
  }

  /**
   * One reopening: the contract, obligation and requirement revisions, the
   * binding from each to the work item responsible for it, the follow-up
   * work items of the ones that had completed, and the results that close
   * unfinished assignments of the previous revision, in one transaction.
   *
   * Prior records and prior gate results stay historical. An item that
   * completed stays completed; only the latest requirement revision can
   * satisfy completion.
   */
  private async reopenAgreement(
    item: WorkItem,
    assignment: IterationAssignment,
    registration: ReturnType<typeof registerContract>,
    subject: {
      readonly contract: string;
      readonly revision: number;
      readonly obligation: string | null;
      readonly previousRevision: number;
      readonly records: ReturnType<typeof committedRecords>;
      readonly bindings: ReadonlyMap<string, string>;
      readonly cause: string;
      readonly retirementRecords: readonly CommitRecord[];
      readonly previousContract: string;
      readonly previousObligation: string | null;
    },
  ): Promise<{ readonly findings: string[] } | null> {
    const { records, bindings } = subject;
    // The item responsible for each subject before this transaction. A
    // subject has one at a time, whatever revision it was bound at.
    const previous = new Map<string, string>();
    if (registration.obligation !== null) {
      const held = providerItemOf(records.workItems, subject.previousObligation ?? registration.obligation.id, subject.previousRevision, bindings);
      if (held !== undefined) previous.set(registration.obligation.id, held.id);
    }
    for (const requirement of records.requirements.values()) {
      if (records.obligations.get(requirement.obligation)?.contract.id !== subject.previousContract) continue;
      previous.set(requirement.id, bindings.get(bindingKey(requirement.id, requirement.revision)) ?? requirement.workItem);
    }
    for (const requirement of registration.requirements) {
      if (previous.has(requirement.id)) continue;
      // A consumer attaching at this revision brings its own work item.
      previous.set(requirement.id, item.id);
    }

    const reopening = reopenEvidence({
      obligation: registration.obligation,
      requirements: registration.requirements,
      requestedBy: item.id,
      previous,
      completed: new Set(this.events('work-item-completed').map(event => event.data.workItem)),
      items: new Map(records.workItems.map(entry => [entry.id, entry])),
      workItemCount: records.workItems.length,
      // The iteration that established this revision is not superseded by
      // it; every other assignment that never closed is.
      unfinishedAssignments: [...records.assignments.values()]
        .filter(candidate => candidate.id !== assignment.id && !records.results.has(candidate.id)),
    });

    await this.ports.write({
      type: 'evidence-reopened',
      data: {
        cause: subject.cause,
        contract: subject.contract,
        revision: subject.revision,
        iteration: assignment.id,
        obligation: subject.obligation,
        requirements: registration.requirements.map(requirement => requirement.id),
        bindings: reopening.bindings.map(binding => ({ subject: binding.subject, workItem: binding.workItem })),
        followUps: reopening.followUps.flatMap(followUp => (followUp.follows === undefined
          ? []
          : [{ workItem: followUp.id, follows: followUp.follows }])),
        superseded: reopening.superseded.map(result => result.iteration),
        ...(subject.retirementRecords.length === 0 ? {} : { retired: subject.retirementRecords.map(record => record.id) }),
      },
    }, [...registration.records, ...reopening.records, ...subject.retirementRecords]);
    await this.ports.afterWrite('evidence-reopened', this.input.record.jobId);
    await this.ports.handling.cleanupClosedScratch();
    if (this.ports.ignoring()) return null;

    const findings: string[] = [];
    for (const binding of reopening.bindings) {
      const followUp = reopening.followUps.find(entry => entry.id === binding.workItem);
      findings.push(followUp === undefined
        ? `${binding.subject.id} at revision ${binding.subject.revision} stays with ${binding.workItem}, which has not finished`
        : `${binding.subject.id} at revision ${binding.subject.revision} goes to ${followUp.id}, which follows ${followUp.follows ?? 'nothing'}`);
    }
    for (const result of reopening.superseded) findings.push(`${result.iteration} closed as superseded: it was assigned under the previous revision`);
    return { findings };
  }

  /**
   * The dependency graph, checked when a requirement is committed. Its nodes
   * are capabilities: a cycle of modules is not a cycle, and a cycle of
   * changes is not one either. `undefined` says the run has ended.
   */
  private async checkDependencyGraph(item: WorkItem, added: DependencyEdge): Promise<DependencyCycle | null | undefined> {
    const records = this.observe().records;
    const edges: DependencyEdge[] = [];
    for (const requirement of records.requirements.values()) {
      if (requirement.id === added.requirement) continue;
      const obligation = records.obligations.get(requirement.obligation);
      if (obligation === undefined) continue;
      edges.push({ from: requirement.forCapability, to: obligation.capability, requirement: requirement.id, workItem: requirement.workItem });
    }
    const cycle = cycleClosedBy(edges, added);
    if (cycle === null) return null;

    const identity = cycleIdentity(cycle);
    const detection = this.events('dependency-cycle-detected')
      .filter(event => event.data.members.join(' → ') === identity).length + 1;
    await this.ports.write({
      type: 'dependency-cycle-detected',
      data: {
        members: [...cycle.members],
        requirements: [...cycle.requirements],
        workItems: [...cycle.workItems],
        closedBy: item.id,
        detection,
      },
    });
    await this.ports.afterWrite('dependency-cycle-detected', this.input.record.jobId);
    if (this.ports.ignoring()) return undefined;

    return cycle;
  }

  /** The source boundary accepted by the latest passed committing gate. */
  accepted(): string {
    return acceptedCommit(this.observe().history.lines, this.input.base);
  }

  /** A work item's current selection: the latest one recorded, which supersedes any earlier. */
  async currentSelection(workItem: string) {
    const event = this.events('context-selection-recorded').filter(entry => entry.data.workItem === workItem).at(-1);
    if (event === undefined) return null;
    const recorded = await this.recordedSelection(event, await this.frozenCatalog());
    if (recorded.status === 'unavailable') throw new EvidenceUnavailableError(recorded.reason);
    return { event, ...recorded };
  }

  /**
   * A recorded selection whose package, verified against its citation, is
   * delivered with the selector's reason, conditions and uncertainty for
   * each element it selected.
   */
  async recordedSelection(event: RunEventOf<'context-selection-recorded'>, catalog: ElementCatalog): Promise<RecordedContextSelection> {
    const recorded = await readRecordedContextSelection(this.input.directory, event, catalog, this.planDeviationsOf());
    return recorded.status === 'unavailable' ? recorded : { ...recorded, packageText: withSelectionReasons(recorded.packageText, recorded.selection.selected) };
  }

  /** The frozen catalog of an accepted analysis; its absence is an input the caller lacks. */
  async frozenCatalog(): Promise<ElementCatalog> {
    const evidence = await readAcceptedEvidence(this.input.directory, this.input.record.manifest, acceptedAnalysisReferences(this.observe().history.events));
    if (evidence.status === 'unavailable') throw new EvidenceUnavailableError(evidence.reason);
    return evidence.catalog;
  }

  /**
   * A package with every plan deviation recorded so far: by default the
   * assessment package, every non-functional and fixed element; otherwise
   * the elements an investigation, a repair or an unresolved fork reads.
   */
  planPackage(catalog: ElementCatalog, elements: readonly string[] = assessedElements(catalog)): string {
    const planDeviations = this.planDeviationsOf();
    const cited = citePackage(catalog, planDeviations, elements, planDeviations.map(deviation => deviation.id));
    if ('missing' in cited) throw new EvidenceUnavailableError(`The non-functional package cites IDs the run does not hold: ${cited.missing.join(', ')}`);
    return cited.text;
  }

  /** The run's plan deviations as every package renders them, in recorded order. */
  private planDeviationsOf(): PackageDeviation[] {
    return this.deviationsOf().map(packageDeviation);
  }

  /** The plan deviations recorded after a package, rendered by the package creator for a module architect's brief. */
  private laterDeviations(catalog: ElementCatalog, pinned: readonly string[]): { readonly deviations?: string } {
    const planDeviations = this.planDeviationsOf();
    const later = planDeviations.filter(deviation => !pinned.includes(deviation.id)).map(deviation => deviation.id);
    if (later.length === 0) return {};
    const cited = citePackage(catalog, planDeviations, [], later);
    if ('missing' in cited) throw new EvidenceUnavailableError(`A plan deviation amends IDs the run does not hold: ${cited.missing.join(', ')}`);
    return { deviations: cited.text };
  }

  /** Cite elements with every plan deviation recorded so far. */
  async citeCurrentDeviations(elements: readonly string[]): Promise<PackageCitation> {
    const planDeviations = this.planDeviationsOf();
    const cited = citePackage(await this.frozenCatalog(), planDeviations, elements, planDeviations.map(deviation => deviation.id));
    if ('missing' in cited) throw new EvidenceUnavailableError(`The package cites IDs the run does not hold: ${cited.missing.join(', ')}`);
    return cited.citation;
  }

  /**
   * Render a cited package again from the frozen catalog and the record's
   * IDs alone. Given its work item, the package a module engineer receives also
   * carries why the work item's current selection put each element in view.
   */
  async packageText(cited: PackageCitation, workItem?: string): Promise<string> {
    const delivered = deliverPackage(await this.frozenCatalog(), this.planDeviationsOf(), cited);
    if (delivered.status === 'unavailable') throw new EvidenceUnavailableError(delivered.reason);
    if (workItem === undefined) return delivered.text;
    const selection = await this.currentSelection(workItem);
    return selection === null ? delivered.text : withSelectionReasons(delivered.text, selection.selection.selected);
  }

  /**
   * What a role that works in the source is told of the project: its declared
   * checks, the pointers of the named modules and the scenario files they own.
   * Every path is project-relative.
   */
  async knownProjectFacts(names: readonly string[]): Promise<KnownProjectFacts> {
    return knownProjectFactsOf(this.projectRoot, this.observe().index, names, trackedScenarios(this.observe().history.lines).records, await this.checkInputFacts());
  }

  /** Authored setup pointers only: no effective configuration evaluation or readiness acquisition. */
  async checkInputSection(snapshot?: CandidateSnapshot): Promise<string> {
    return declaredCheckInputs({ projectRoot: this.projectRoot, ...await this.checkInputFacts(snapshot), snapshot: snapshot !== undefined });
  }

  /** The configured checks and the configuration pointers that exist, in the tree or in the snapshot. */
  private async checkInputFacts(snapshot?: CandidateSnapshot): Promise<KnownProjectFacts['declaredChecks']> {
    return declaredCheckFacts(this.projectRoot, this.input.record.auditConfiguration, this.input.record.projectConfig.path, snapshot);
  }

  async orientationStartingPoints(workItem: string | undefined) {
    const event = this.events('work-orientation-recorded').find(event => event.data.workItem === workItem);
    if (event === undefined) return undefined;
    const records = this.observe().records;
    const outcome = records.outcomes.get(event.data.invocation);
    const bytes = await readIfExists(this.path(runLayout.submission(event.data.invocation))).catch(() => undefined);
    if (bytes === undefined || outcome?.submission?.hash !== sha256(bytes)) return undefined;
    let raw: Record<string, unknown>;
    try { raw = JSON.parse(bytes.toString('utf8')) as Record<string, unknown>; } catch { return undefined; }
    if (raw.schema !== 'ramify-agent.work-orientation/1') return undefined;
    const { schema: _schema, ...body } = raw;
    const parsed = workOrientationSubmissionSchema.safeParse(body);
    if (!parsed.success) return undefined;
    const record = records.invocations.get(event.data.invocation);
    const boundary = record?.candidateBefore ?? record?.base;
    const group: StartingPointGroup = { origin: { producer: 'module architect orientation', workItem: event.data.workItem,
      invocation: event.data.invocation, ...(boundary === undefined ? {} : { boundary }) }, points: parsed.data.startingPoints };
    return { group, submission: parsed.data };
  }

  /** A reviewer may precede result closure; its exact passing gate identifies the proposal. */
  async engineerStartingPoints(assignment: IterationAssignment, result?: IterationResult, gateId?: string, candidate?: string): Promise<StartingPointGroup> {
    const gate = gateAttemptSchema.safeParse(this.ports.committedBody(runLayout.gate(gateId ?? result?.gate ?? '')));
    const matches = gate.success && gate.data.subject.iteration === assignment.id
      && (candidate === undefined || (gate.data.verdict === 'passed' && gate.data.commit === candidate));
    const invocation = matches ? gate.data.proposedBy ?? undefined : result?.invocations.at(-1);
    const records = this.observe().records;
    const record = invocation === undefined ? undefined : records.invocations.get(invocation);
    const outcome = invocation === undefined ? undefined : records.outcomes.get(invocation);
    let points = result?.startingPoints;
    if (result === undefined && invocation !== undefined && record?.work.iteration === assignment.id) {
      const bytes = await readIfExists(this.path(runLayout.submission(invocation))).catch(() => undefined);
      if (bytes !== undefined && outcome?.submission?.hash === sha256(bytes)) {
        try {
          const proposal = parseRecordedEngineerSubmission(JSON.parse(bytes.toString('utf8')), this.input.record.identityContract ?? 'legacy');
          if (proposal.kind === 'completion-proposed') points = proposal.startingPoints;
        } catch { /* An unavailable optional hint leaves the ordinary review intact. */ }
      }
    }
    const boundary = result?.commit ?? (matches ? gate.data.commit : null) ?? outcome?.candidateAfter ?? record?.candidateBefore ?? record?.base;
    return { origin: { producer: result === undefined ? 'engineer completion proposal at passing gate' : `engineer ${result.outcome} result`,
      workItem: assignment.workItem, iteration: assignment.id, ...(invocation === undefined ? {} : { invocation }),
      ...(boundary === undefined ? {} : { boundary }),
      ...(assignment.coordination?.kind === 'capability-task' ? { capabilityTask: assignment.coordination.id } : {}) }, points };
  }

  assignmentStartingPoints(assignment: IterationAssignment): StartingPointGroup {
    const issued = assignment.coordination?.kind === 'capability-task'
      ? this.events('capability-assigned').find(event => event.data.assignment === assignment.id)
      : this.events('iteration-assigned').find(event => event.data.iteration === assignment.id);
    const invocation = issued?.data.invocation;
    const record = invocation === undefined ? undefined : this.observe().records.invocations.get(invocation);
    const boundary = assignment.coordination?.kind === 'capability-task' ? assignment.coordination.startingTree : record?.candidateBefore ?? record?.base;
    return assignmentStartingPointsOf(assignment, { invocation, boundary });
  }

  /** The fresh construction a step whose session is unavailable falls back to, where its role has one. */
  stepFallback(inputs: StepInputs, packages: ReadonlyMap<string, LoadedPackage>) {
    return (reason: string) => {
      const fresh = freshFallback(inputs, reason);
      if (fresh === null) return undefined;
      const step = constructStep(fresh, { projectRoot: this.projectRoot, packages });
      return { prompt: step.prompt, brief: step.brief, stepInputs: step.before.inputs };
    };
  }

  /** A location beneath the project root as a project-relative path field. */
  projectRelative(absolute: string): ProjectPath {
    const path = relative(this.projectRoot, absolute).split(sep).join('/');
    if (join(this.projectRoot, path) !== absolute) throw new Error(`${absolute} is not beneath the project root ${this.projectRoot}`);
    return projectPath(path);
  }

  /**
   * The views a module architect's orientation and its selector are told of:
   * the API view directories its module has, each project-relative, and
   * the architect view's coverage limits named, with whether any lies in the
   * module. A module with no readable API view is told of the architect view.
   */
  private async localViewInputs(module: string): Promise<OrientationStepInputs['architectView']> {
    return localViewInputsOf(this.projectRoot, module, this.observe().index, this.input.record.manifest.architectView);
  }

  /** The architect view a task names by default: the materialized view of the run, with the modules its index holds now. */
  architectViewInputs(): OrientationStepInputs['architectView'] {
    const view = this.input.record.manifest.architectView;
    return view.status === 'materialized'
      ? [{ path: projectPath('.ramify-architect'), revision: view.revision, modules: [...(this.observe().index?.modules.keys() ?? [])], coverage: [...view.coverageLimits] }]
      : [];
  }

  /** The frozen plan's project-relative path. */
  capturedPlanPath(): string {
    return relative(this.projectRoot, this.path(runLayout.capturedPlan)).split(sep).join('/');
  }

  /** The bounds one iteration's engineers run under: the policy's, and what its assignment raised. */
  engineerBounds(assignment: IterationAssignment): EngineerBounds {
    return engineerBoundsFor(this.observe().policy.limits, assignment);
  }

  /**
   * An integration work item's briefing: its scenario, the sub-scenarios,
   * their owners' step files as the tree holds them now, and the scope its
   * engineer must be given. Undefined for every other work item.
   */
  private async integrationOfItem(item: WorkItem): Promise<IntegrationBriefing | undefined> {
    const id = integrationScenarioOf(item);
    if (id === null) return undefined;
    const { records } = trackedScenarios(this.observe().history.lines);
    const record = records.find(candidate => candidate.id === id);
    if (record === undefined) return undefined;
    return integrationBriefing(this.projectRoot, record, records);
  }

  /** The one obligation projection: scenario records, delegated outcomes and the accepted registrations and reports. */
  obligationProjection(): ObligationProjection {
    return obligationProjection(this.observe().history);
  }

  /**
   * What an architect's briefing says about the obligations it reports on:
   * each with its status, binding and last report, and then, separately,
   * the accepted source each report was made against where that source has
   * moved on since. The second part is provenance the architect may inspect;
   * the harness revises, resets or questions no report because of it.
   */
  private obligationBriefing(actor: Pick<ObligationActor, 'kind' | 'id'>): string[] {
    const owned = obligationsOwnedBy(this.obligationProjection(), actor);
    const lines = obligationBriefingLines(owned);
    if (lines.length === 0) return lines;
    const entries = this.observe().history.lines;
    const source = reportSourceLines(owned, sequence => acceptedCommit(entries.slice(0, sequence), this.input.base), acceptedCommit(entries, this.input.base));
    return source.length === 0 ? lines : [...lines, '', ...source];
  }

  /**
   * What each obligation an assignment names is, for the module engineer's
   * briefing: a scenario's name, a delegated outcome, a registered case or a
   * registered test's description.
   */
  assignedObligations(ids: readonly string[]): AssignedObligation[] {
    const { obligations } = this.obligationProjection();
    const names = new Map(trackedScenarios(this.observe().history.lines).records.map(record => [record.id, record.name]));
    return ids.map(id => {
      const obligation = obligations.get(id);
      if (obligation === undefined) return { id, text: null };
      if (obligation.kind === 'scenario') {
        const name = names.get(id);
        return { id, text: name === undefined ? 'scenario' : `scenario "${name}"` };
      }
      if (obligation.kind === 'outcome') return { id, text: obligation.case === null ? 'delegated outcome' : `registered case ${obligation.case}` };
      return { id, text: obligation.description === null ? 'registered test' : `registered test: ${obligation.description}` };
    });
  }

  /**
   * The work item's scenarios not yet `done`: its entry's, or an integration
   * work item's one scenario. A provider or follow-up work item has none.
   */
  private unfinishedScenarios(item: WorkItem): Array<{ id: string; state: ScenarioState }> {
    const entry = 'entry' in item.origin ? item.origin.entry : null;
    const integration = integrationScenarioOf(item);
    if (entry === null && integration === null) return [];
    const tracked = trackedScenarios(this.observe().history.lines);
    return tracked.records
      .filter(record => (integration === null ? record.kind === 'entry' && record.entry === entry : record.id === integration))
      .map(record => ({ id: record.id, state: tracked.states.get(record.id) ?? 'pending' }))
      .filter(scenario => scenario.state !== 'done');
  }

  /**
   * What a module engineer is told of its work item's scenarios: its entry's, or
   * an integration work item's one scenario with its sub-scenarios' step
   * files. Undefined for a provider, follow-up or capability-task
   * iteration, whose briefing says nothing about scenarios beyond the
   * obligations its assignment names.
   */
  async engineerScenarios(item: WorkItem): Promise<EngineerScenarios | undefined> {
    const tracked = trackedScenarios(this.observe().history.lines);
    const integration = integrationScenarioOf(item);
    if (integration !== null) {
      const briefing = await this.integrationOfItem(item);
      return briefing === undefined ? undefined : { kind: 'integration', integration: briefing, state: tracked.states.get(integration) ?? 'pending' };
    }
    const scenarios = entryScenariosOf(tracked.records, tracked.states, 'entry' in item.origin ? item.origin.entry : null);
    return scenarios.length === 0 ? undefined : { kind: 'entry', scenarios };
  }

  /**
   * The integration work items a done report of one scenario makes due, as
   * the records its `obligation-reported` commits: one per integration
   * scenario whose last sub-scenario this is (architecture §10). Only done
   * reports schedule one; no gate or audit result does. Committed after
   * every earlier work item, it queues behind the current one, since work
   * items run one at a time.
   */
  private integrationItemsDue(scenario: string): CommitRecord[] {
    return integrationItemsDue(this.observe().history, scenario);
  }

  /** The frozen baseline's snapshot, or null where it cannot be read, which leaves a size unmeasured rather than zero. */
  async baselineSnapshot(): Promise<MeasurementSnapshot | null> {
    try {
      return measurementSnapshotSchema.parse(JSON.parse(await readFile(this.path(runLayout.measurement(snapshotId(1))), 'utf8')));
    } catch {
      return null;
    }
  }

  /** The reference to the frozen baseline an invocation records, or null where the run has none. */
  baselineReference(): Invocation['scope']['measurement'] {
    return this.input.record.baseline && 'measurement' in this.input.record.baseline ? this.input.record.baseline.measurement : null;
  }

  /** Captures one writer invocation's line events from the two snapshots around it. */
  async recordLineEvents(
    invocation: string,
    before: LineSnapshot,
    after: LineSnapshot,
  ): Promise<LineEventSummary | null> {
    // An invocation the run's bounds refused was never started, and has no line events.
    if (invocation === '') return null;
    const summary = lineEvents({ invocation, before, after, index: this.observe().index });
    await writeFileAtomic(this.path(runLayout.lineEvents(invocation)), `${JSON.stringify(summary, null, 2)}\n`);
    return summary;
  }

  /** Partial findings remain deliverable with historical views and explicit refresh limits. */
  private async continuationEvidence(coordinator: { workItem?: string; task?: string }, current: ArchitectIndex | null): Promise<string | undefined> {
    const previous = await this.continuationAssignment(coordinator);
    if (previous === undefined) return undefined;
    const records = this.observe().records;
    const result = records.results.get(previous.id);
    if (result?.outcome !== 'partial') return undefined;
    let authority = missingHistoricalAuthority(previous.scope).join(', ');
    try { await this.ports.ownershipAuthority(previous).read(); }
    catch (error) {
      if (!(error instanceof OwnershipAuthorityError) || error.kind !== 'missing') throw error;
      authority = [authority, error.message].filter(Boolean).join('; ');
    }
    let changed: string;
    try { changed = JSON.stringify(await this.git.changedPaths(this.projectRoot, this.accepted())); }
    catch (error) { changed = `unavailable: ${message(error)}`; }
    return [
      'Retained partial result',
      authority === '' ? 'Recorded boundary is available for bounded historical repair.' : `Historical repair authority unavailable: ${authority}.`,
      current === null ? `Current architect view refresh unavailable. Retained views are historical (${this.observe().index?.input ?? 'no retained view'}); absence does not establish current ownership.` : `Current architect view: ${current.input}.`,
      `Previous durable assignment ${previous.id}: ${JSON.stringify(previous)}`,
      `Partial findings: ${JSON.stringify(result.findings)}. Engineer reports: ${result.invocations.map(invocation => this.path(runLayout.submission(invocation))).join(', ')}.`,
      `Changed paths compared with accepted Git boundary ${this.accepted()}: ${changed}.`,
      'If ownership remains unavailable, assign the same or a narrower verified repair region. Expanded scope and new generated features require current ownership first. If recorded authority cannot repair the boundary, report the exact blocked targets and missing authority through unresolved/environment handling. Consultation remains advisory.',
    ].join('\n');
  }

  /** Only durable assignments of this responsible coordinator supply repair authority. */
  private async continuationAssignment(coordinator: { workItem?: string; task?: string }): Promise<IterationAssignment | undefined> {
    const assignments = [...this.observe().records.assignments.values()];
    const previous = assignments.filter(assignment => coordinator.task !== undefined
      ? assignment.coordination?.kind === 'capability-task' && assignment.coordination.id === coordinator.task
      : assignment.workItem === coordinator.workItem && assignment.coordination?.kind !== 'capability-task').at(-1);
    return previous;
  }

  /**
   * What an assignment guards of the scenarios: every tracked feature file
   * with the hash of the rendering the harness last wrote, once the files
   * are materialized.
   */
  async guardedScenarioFiles(): Promise<GuardedScenarioFiles> {
    const expected = this.event('scenarios-materialized') === undefined ? [] : expectedFeatureHashes(this.ports.gates.writtenFeatures());
    return { expected };
  }

  /** The project-relative files one assignment's engineer may never write: the run's own, and the guarded files no authorization opened. */
  async protectedFiles(assignment: IterationAssignment): Promise<{ harness: string[]; unauthorized: string[] }> {
    return { harness: await this.harnessFiles(),
      unauthorized: unauthorizedGuardedOf(assignment) };
  }

  /** The project-relative files only the harness writes: the tracked feature files and the captured documents. */
  async harnessFiles(): Promise<string[]> {
    const features = trackedScenarios(this.observe().history.lines).records.map(record => record.file);
    const documents = (await readCapturedDocuments(this.input.directory, this.input.record.manifest)).manifest.documents.map(document => document.path);
    return [...features, ...documents];
  }

  async deniedFiles(): Promise<string[]> {
    return deniedFiles(this.projectRoot, await this.harnessFiles());
  }

  async auditPreparationPaths(): Promise<string[]> {
    const captured = [...this.observe().records.assignments.values()].flatMap(assignment => scopeConfigurationPaths(assignment.scope));
    return auditPreparationPathsOf(this.options.ramify, this.projectRoot, this.input.record.auditConfiguration, captured, reason => this.ports.warn(reason));
  }
  async takeIteration(
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
    if (resume !== undefined) this.ports.restoreInvocation(resume.priorInvocation);
    const savedResult = this.observe().records.results.get(assignment.id);
    if (this.observe().restoring && savedResult) {
      for (const invocation of [...savedResult.invocations].reverse()) {
        const outcome = this.ports.effectiveInvocationOutcome(invocation);
        if (!outcome?.settled.confirmed) throw new Error('Original iteration outcome has no confirmed settlement');
        if (!outcome.submission) continue;
        const bytes = await readIfExists(this.path(runLayout.submission(invocation)));
        if (!bytes || sha256(bytes) !== outcome.submission.hash) throw new Error('Original iteration destination changed');
        const parsed = parseRecordedEngineerSubmission(JSON.parse(bytes.toString('utf8')), this.input.record.identityContract ?? 'legacy');
        if (parsed.kind === 'contract-needed') return { kind: 'closed', result: savedResult, need: { need: parsed.need, suggestedProvider: parsed.suggestedProvider, injectionSites: parsed.injectionSites, invocation } };
      }
      return { kind: 'closed', result: savedResult };
    }
    if (packages.get('engineer') === undefined) {
      await this.ports.fail('internal', 'No prompt package is loaded for the module engineer');
      return null;
    }
    const number = assignment.coordination?.kind === 'capability-task'
      ? assignment.coordination.sequence : Number.parseInt(assignment.id.slice(assignment.id.lastIndexOf('.i') + 2), 10);
    // Every module engineer invocation of the iteration, a budget return's too,
    // runs under the bounds its assignment raised, and its prompt states the
    // longest a command may run.
    const bounds = this.engineerBounds(assignment);
    const workingDirectory = await engineerWorkingDirectory(this.projectRoot, assignment.scope, this.observe().index, this.git);
    // What the assignment gave it to write: its base modules, included
    // subtrees, bootstrapped modules and extra locations.
    const measurementScope = writeScopeMeasurement(assignment.scope);

    const priorStarts = this.events('invocation-started').filter(event =>
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
    const priorGates = this.events('gate-attempted').flatMap(event => {
      const parsed = gateAttemptSchema.safeParse(this.ports.committedBody(runLayout.gate(event.data.gate)));
      return parsed.success && parsed.data.subject.iteration === assignment.id ? [parsed.data] : [];
    });
    let replay: InvocationResult<EngineerSubmission> | undefined;
    let resourceRestartPredecessor: string | undefined;
    const latestStart = priorStarts.at(-1);
    if (latestStart !== undefined && resume?.priorInvocation !== latestStart.data.invocation &&
      !priorGates.some(gate => gate.proposedBy === latestStart.data.invocation)) {
      const ended = this.events('invocation-ended').find(event => event.data.invocation === latestStart.data.invocation);
      const recorded = this.ports.effectiveInvocationOutcome(latestStart.data.invocation);
      if (ended !== undefined && recorded !== undefined && recorded.settled.confirmed) {
        const bytes = recorded.submission === null ? undefined : await readIfExists(this.path(runLayout.submission(latestStart.data.invocation)));
        if (bytes !== undefined && sha256(bytes) !== recorded.submission?.hash) {
          await this.ports.fail('recovery-exhausted', `Engineer ${latestStart.data.invocation} has changed submission bytes`);
          return null;
        }
        const raw = bytes === undefined ? null : JSON.parse(bytes.toString('utf8')) as Record<string, unknown>;
        let parsed: EngineerSubmission | undefined;
        try { if (raw !== null) parsed = parseRecordedEngineerSubmission(raw, this.input.record.identityContract ?? 'legacy'); }
        catch (error) {
          await this.ports.fail('recovery-exhausted', `Engineer ${latestStart.data.invocation} has an invalid committed submission: ${message(error)}`);
          return null;
        }
        if (recorded.ended === 'submitted' && parsed === undefined) {
          await this.ports.fail('recovery-exhausted', `Engineer ${latestStart.data.invocation} has no valid committed submission`);
          return null;
        }
        const resourceRestart = this.observe().restoring && !this.event('stop-requested')
          && (['stopped', 'resource-pending', 'context-budget-reached'].includes(recorded.ended) || recorded.ended === 'failed' && recorded.interruption !== undefined);
        if (resourceRestart) resourceRestartPredecessor = latestStart.data.invocation;
        else replay = { id: latestStart.data.invocation, ended: recorded.ended,
          value: parsed,
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
    if (priorRepair !== undefined) failedGate = await this.ports.acceptance.diagnosticsOf(priorRepair);
    if (priorGates.length > 0) firstCause = { gate: priorGates[0]!.id, cause: priorGates[0]!.cause };

    // Closing the iteration closes the work of a session still kept for it.
    const close = async (outcome: IterationResult['outcome'], extra: Partial<IterationResult> = {}): Promise<ClosedIterationOutcome> => {
      const result = await this.ports.handling.closeIteration(item, number, assignment, {
        outcome, invocations, findings, gate: null, commit: null, ...extra,
      });
      await this.ports.finishSession(session, 'work-closed');
      return { kind: 'closed', result };
    };

    // A crash after the gate's immutable success and before its iteration
    // result reuses that exact gate. No second engineer or audit runs.
    const passed = [...priorGates].reverse().find(gate => gate.verdict === 'passed' && gate.audited !== null);
    if (passed !== undefined) {
      if (await this.candidates.commitTree(this.projectRoot, passed.audited!) !== (await this.ports.previewCandidateTree()).tree) throw new CandidateDriftError('Original engineer gate candidate changed before handback');
      const closed = await this.ports.handling.closeIteration(item, number, assignment, {
        outcome: 'accepted', invocations, findings: [], gate: passed.id, commit: passed.audited,
      });
      if (closed.commit !== null) await this.ports.handling.requestReviews({ workItem: assignment.coordination?.kind === 'capability-task'
        ? assignment.coordination.id : item.id, iteration: assignment.id, gate: passed.id, commit: closed.commit });
      await this.ports.finishSession(session, 'work-closed');
      if (!await this.ports.acceptance.dischargeEvidence(item, assignment, passed.id, closed)) return null;
      return { kind: 'closed', result: closed };
    }

    for (;;) {
      if (this.ports.ignoring()) return null;

      // A session the implementation can no longer read is reconstructed from
      // records rather than continued, and the counters are kept.
      let start: SessionStart = { mode: 'fresh' };
      let degraded: InvocationRequest<EngineerSubmission>['degraded'];
      if (sessionRef !== undefined) {
        const note = `Continuing iteration ${assignment.id}.`;
        const appended = await (await this.ports.operations(agent)).append(sessionRef, `${assignment.id}:${attempt}`, note);
        if (appended.outcome !== 'appended' && appended.outcome !== 'already-present') {
          if (appended.outcome === 'conflict') throw new Error(`The module engineer session did not take its note: ${appended.reason}`);
          await this.ports.finishSession(session, 'lost');
          degraded = { requested: 'continued', reason: 'The retained engineer session is unavailable; using the ordinary task brief' };
          replacing = undefined;
          sessionRef = undefined;
          session = undefined;
        } else {
          start = { mode: 'continue', ref: appended.ref };
          if (appended.outcome === 'appended' && session !== undefined) {
            const kept = session;
            await this.ports.recordAppend(kept, { kind: 'note-appended', text: note }, null)
              .catch(error => this.ports.warn(`Run ${this.input.record.jobId}: the note continuing ${kept} is missing from its transcript: ${message(error)}`));
          }
        }
      }

      attempt += 1;
      const beforeTree = assignment.coordination?.kind === 'capability-task'
        ? (await this.ports.previewCandidateTree()).tree : undefined;
      const before = await takeLineSnapshot(this.projectRoot, this.accepted(), this.git);
      // A capability-task iteration is told only the obligations its
      // assignment names; a work item's iteration also sees its scenarios.
      const briefedScenarios = assignment.coordination?.kind === 'capability-task'
        ? undefined : await this.engineerScenarios(item);
      const assignedObligations = this.assignedObligations(assignment.obligations ?? []);
      // The assignment package reaches a session once: a continued session
      // holds it from its first prompt.
      let assignmentPackage: string | undefined;
      try {
        if (assignment.source !== undefined) assignmentPackage = await this.packageText(assignment.source, assignment.workItem);
      } catch (error) {
        await this.ports.fail('inputs-changed', `The assignment package of ${assignment.id} cannot be delivered: ${message(error)}`);
        return null;
      }
      const featurePaths = assignedFeaturePaths(assignment, trackedScenarios(this.observe().history.lines).records);
      const focused = await prepareAssignedCucumber({ projectRoot: this.projectRoot, scratchDirectory: join(workingDirectory, 'tmp', 'ramify-focused', assignment.id),
        featurePaths, checks: this.input.record.auditConfiguration && 'config' in this.input.record.auditConfiguration ? this.input.record.auditConfiguration.config.checks : [],
        runner: this.options.commandExecution ?? runCommand });
      const invocationViews = replay === undefined ? await this.iterationViews(assignment) : [];

      // The invocation is built from its inputs by the module engineer step's own
      // constructor, which `step render` uses too; the inputs are validated
      // here and written beside the invocation before it starts.
      let step: ConstructedEngineerStep;
      try {
        step = constructEngineerStep(await this.engineerStepInputs({
          item, assignment, attempt, workingDirectory, bounds, beforeTree, views: invocationViews, scenarios: briefedScenarios,
          obligations: assignedObligations, assignmentPackage, featurePaths, focused, failedGate,
          handoff: handoff === undefined ? undefined : { ...handoff, returns: this.budgetReturns(assignment.id) },
          guidance: guidancePending,
          start: start.mode === 'continue'
            ? { kind: resume === undefined ? 'repair-continuation' : 'resumed-after-handback', session: session ?? '', point: start.ref }
            : { kind: 'fresh', ...(degraded === undefined || degraded.requested !== 'continued' ? {} : { degraded: { requested: 'continued', reason: degraded.reason } }) },
        }), { projectRoot: this.projectRoot, packages });
      } catch (error) {
        await this.ports.fail('internal', `The module engineer of ${assignment.id} cannot be constructed from its inputs: ${message(error)}`);
        return null;
      }
      const guarded = await protectedScopeOf(this.projectRoot, assignment.scope, step.equipment.protectedFiles, this.options.ramify, this.ports.ownershipAuthority(assignment));
      const tools = this.implementationTools({
        workingDirectory: step.equipment.workingDirectory,
        scopeRevision: step.equipment.scopeRevision,
        guarded,
        commandTimeoutMs: step.equipment.commandTimeoutMs,
        submissions: step.equipment.submissions,
        focusedCommands: step.equipment.focusedCommands,
      });

      const result = replay ?? await this.ports.runInvocation<EngineerSubmission>(agent, {
        role: step.role,
        ...(resourceRestartPredecessor === undefined ? {} : { recoveryPredecessor: resourceRestartPredecessor }),
        originalInvocation: this.observe().restoring && latestStart && !this.events('invocation-ended').some(event => event.data.invocation === latestStart.data.invocation) ? latestStart.data.invocation : undefined,
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
            identityContract: this.input.record.identityContract ?? 'legacy',
            occupiedCapabilityNames: {
              requests: new Set(this.observe().records.capabilityRequests.keys()),
              examples: new Set([...this.observe().records.capabilityRequests.values()].flatMap(request => request.original.examples.map(example => example.id))),
            },
            capabilityWorkflow: step.validator.capabilityWorkflow,
            obligation: step.validator.obligation,
            kind: step.validator.kind,
            openFindings: tools.openFindings(),
            submissions: tools.submissions,
            assigned: step.validator.assigned,
            seams: {
              index: this.observe().index,
              consumer: step.validator.consumer,
              providerOf: capability => this.observe().records.registry.find(entry => entry.capability === capability)?.owner,
            },
          }, paths => this.options.ramify.queryOwnershipAnswer(this.projectRoot, paths),
          () => new Map(this.observe().records.registry.map(entry => [entry.capability, entry])));
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
          measurement: this.input.record.baseline && 'measurement' in this.input.record.baseline ? this.input.record.baseline.measurement : null,
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
      const after = await takeLineSnapshot(this.projectRoot, this.accepted(), this.git);
      const savedLines = replayed ? await readIfExists(this.path(runLayout.lineEvents(result.id))) : undefined;
      const parsedLines = savedLines === undefined ? null : lineEventSummarySchema.safeParse(JSON.parse(savedLines.toString('utf8')));
      const lines = parsedLines?.success ? parsedLines.data : replayed ? null
        : await this.recordLineEvents(result.id, before, after);
      if (this.ports.ignoring()) return null;

      if (result.ended === 'checkpoint-pending' && !this.ports.writer.unsettled()) {
        findings.push(`Architect handoff after compaction: ${result.checkpointReason ?? 'Reconsider the unfinished assignment.'}`,
          `No engineer submission was accepted. Retained context: ${this.path(runLayout.transcript(result.session))}`);
        return close('partial');
      }

      // An unfinished engineer returns its retained work to its architect.
      // Unknown writer settlement must still be resolved before another writer starts.
      if (result.ended !== 'submitted' || result.value === undefined) {
        if (this.ports.writer.unsettled()) {
          await this.ports.fail(result.ended === 'invalid-submission' ? 'invalid-submission' : result.ended === 'failed' ? 'agent-failed' : 'internal',
            `The module engineer of ${assignment.id} ended without a result (${result.ended})`,
            [runLayout.outcome(result.id)],
          );
          return null;
        }
        findings.push(`${failedWithoutResult('engineer', assignment.id, result)}; nothing of it was committed, and what it wrote stays uncommitted in the tree`);
        const failure = await this.failureOf(agent, packages, {
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
          const reported = await this.reportRevisionNeeded(item, assignment, result.value.detail);
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
        if (this.workflow === null || this.ports.writer.unsettled()) {
          await this.ports.fail('internal', 'The requesting module engineer could not be retained after its writer settled');
          return null;
        }
        return { kind: 'capability-needed', summary: result.value.summary, need: result.value.request,
          invocation: result.id, session: result.session, point: result.ref };
      }

      const proposal = result.value;
      // The proposal's bindings apply at its acceptance, before the gate:
      // that gate's commit drops a bound scenario's pending tag, and the gate
      // selects it by identity. No gate outcome undoes a binding.
      if (!await this.ports.handling.recordBindings(result.id, proposal.bindings)) return null;
      let infrastructureAttempt = 0;
      for (;;) {
        const gate = await this.ports.gates.iterationGate(item, assignment, result.id, repairRound, infrastructureAttempt, proposal.summary);
        if (gate === null) return null;
        firstCause ??= { gate: gate.id, cause: gate.cause };

        if (gate.verdict === 'passed') {
          findings.push(...proposal.findings);
          const closed = await this.ports.handling.closeIteration(item, number, assignment, {
            outcome: 'accepted',
            invocations,
            findings,
            gate: gate.id,
            commit: gate.audited,
            ...(proposal.recommendation === undefined ? {} : { recommendation: proposal.recommendation }),
          });
          // The candidate's reviews are requested before the driver passes
          // it; they run beside the next iteration's writer.
          if (closed.commit !== null) await this.ports.handling.requestReviews({ workItem: assignment.coordination?.kind === 'capability-task'
            ? assignment.coordination.id : item.id, iteration: assignment.id, gate: gate.id, commit: closed.commit });
          await this.ports.finishSession(session, 'work-closed');
          // The evidence this acceptance discharges: a provider that ran the
          // agreed suite against the real implementation has conformed, and a
          // verification that replaced every fake injection closes its
          // requirement.
          if (!await this.ports.acceptance.dischargeEvidence(item, assignment, gate.id, closed)) return null;
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
          const returnedGate = await this.ports.acceptance.diagnosticsOf(gate, 'local-architect');
          return { ...await close(gate.cause === 'check-failed' ? 'partial' : 'unsuitable'), returnedGate };
        }
        // One repair round: the rerun runs the gate's complete required set.
        repairRound += 1;
        failedGate = await this.ports.acceptance.diagnosticsOf(gate);
        break;
      }
    }
  }

  private async engineerStepInputs(collected: {
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
    const record = this.observe().records.assignments.get(assignment.id);
    const known = await this.knownProjectFacts('module' in assignment.scope.base ? [assignment.scope.base.module] : assignment.scope.base.modules);
    const records = this.observe().records;
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
          `- Durable assignment: ${this.path(iterationLayout.assignment(owner, sequence))}; result: ${this.path(iterationLayout.result(owner, sequence))}.`,
          ...result.invocations.filter(invocation => records.outcomes.get(invocation)?.submission != null)
            .map(invocation => `- Durable engineer report: ${this.path(runLayout.submission(invocation))}.`),
          ...result.findings.map(finding => `- ${finding}`),
          ...(result.startingPoints ?? []).map(point => `- Source/test pointer: ${JSON.stringify(point)}.`),
        ];
      }),
    ].join('\n');
    return engineerStepInputsOf({
      ...collected,
      guidance: [collected.guidance, retainedWork].filter(text => text !== undefined).join('\n\n') || undefined,
      consultation: engineerConsultationInputs(this.observe().history.events, { planId: this.input.record.planId, runId: this.input.record.jobId }, assignment.id),
      run: { planId: this.input.record.planId, runId: this.input.record.jobId },
      base: this.accepted(),
      capabilityWorkflow: this.workflow !== null,
      identityContract: this.input.record.identityContract ?? 'legacy',
      capabilityPolicy: supportedCapabilityPolicy(this.observe().policy.version),
      workingDirectory: this.projectRelative(collected.workingDirectory),
      testAreas: await this.ownedTestAreas(assignment.gate.tests),
      startingPoints: record === undefined ? null : this.assignmentStartingPoints(record),
      known,
      protectedFiles: await this.protectedFiles(assignment),
      limits: this.observe().policy.limits,
      context: contextPolicyOf(this.observe().policy, 'engineer'),
    });
  }

  async failureOf(
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
    const digest = await this.failureDigestOf(subject);
    const analysis = await this.analyzeFailure(agent, packages, subject, digest);
    if (this.ports.ignoring()) return null;
    return { digest, analysis };
  }

  private async failureDigestOf(
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
    const rejections = await ObservationLog.open(this.path(runLayout.observations(result.id)))
      .then(log => log.observations.flatMap(observation => (observation.type === 'rejection' ? [observation.data] : [])))
      .catch(() => []);
    const shellCalls: DigestShellCall[] = subject.shellLog.map(call => ({
      callId: call.callId,
      command: call.command,
      timeoutMs: call.timeoutMs,
      output: relative(this.input.directory, call.outputFile).split('\\').join('/'),
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

  private async analyzeFailure(
    agent: AgentPort,
    packages: ReadonlyMap<string, LoadedPackage>,
    subject: { readonly item: WorkItem; readonly assignment: IterationAssignment; readonly number: number; readonly result: InvocationResult<unknown> },
    digest: FailureDigest,
  ): Promise<FailureAnalysis> {
    const unavailable = (reason: string, invocation: string | null = null): FailureAnalysis => ({ outcome: 'unavailable', invocation, reason });
    const loaded = packages.get('failure-analyst');
    if (loaded === undefined) return unavailable('no prompt package is loaded for the failure analyst');
    if (this.observe().policy.context['failure-analyst'] === undefined) return unavailable(`the run's policy (${this.observe().policy.version}) has no context policy for the failure analyst`);
    if (this.ports.ignoring()) return unavailable('the run is ending');
    try {
      const recordOwner = subject.assignment.coordination?.kind === 'capability-task'
        ? subject.assignment.coordination.id : subject.item.id;
      const workspace = this.path(join(dirname(iterationLayout.result(recordOwner, subject.number)), 'failure-evidence'));
      const evidence = await this.failureEvidence(workspace, subject.result, digest);
      const attempt = this.events('invocation-started')
        .filter(event => event.data.role === 'failure-analyst' && event.data.work.iteration === subject.assignment.id).length + 1;
      const result = await this.ports.runInvocation<FailureAnalysisSubmission>(agent, {
        role: 'failure-analyst',
        work: { workItem: subject.item.id, iteration: subject.assignment.id },
        attempt,
        loaded,
        systemPrompt: renderFailureAnalystPrompt(loaded, workspace),
        prompt: failureAnalysisMessage({
          iteration: subject.assignment.id,
          goal: subject.assignment.goal,
          projectRoot: this.projectRoot,
          runDirectory: this.input.directory,
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
      this.ports.warn(`Run ${this.input.record.jobId}: the failure analysis of ${subject.assignment.id} could not be run: ${message(error)}`);
      return unavailable(`it could not be run: ${message(error)}`);
    }
  }

  private async failureEvidence(workspace: string, result: InvocationResult<unknown>, digest: FailureDigest): Promise<FailureEvidence> {
    const files: Array<{ path: string; holds: string }> = [];
    const missing: string[] = [];
    await mkdir(join(workspace, 'outputs'), { recursive: true });
    await writeFileAtomic(join(workspace, 'digest.md'), `${digestLines(digest, this.input.directory).join('\n')}\n`);
    files.push({ path: 'digest.md', holds: 'the digest above' });
    try {
      const text = await this.ports.renderInvocationTranscript(result.session, result.id);
      await writeFileAtomic(join(workspace, 'transcript.md'), text === '' ? '(the transcript holds no entry of this invocation)\n' : `${text}\n`);
      files.push({ path: 'transcript.md', holds: `the invocation's transcript, numbered as \`${digest.transcript}\` numbers it; a long one keeps its start and its end` });
    } catch (error) {
      missing.push(`the transcript, which could not be read: ${message(error)}`);
    }
    for (const output of digest.outputs) {
      const name = `outputs/${output.split('/').slice(-3).join('-')}`;
      try {
        const text = await readFile(this.path(output), 'utf8');
        await writeFileAtomic(join(workspace, name), text.length <= failureOutputCharacters ? text : `… ${text.length - failureOutputCharacters} characters of its start are left out …\n${text.slice(-failureOutputCharacters)}`);
        files.push({ path: name, holds: `the complete output of \`${output}\`` });
      } catch (error) {
        missing.push(`the output \`${output}\`, which could not be read: ${message(error)}`);
      }
    }
    try {
      const patch = await this.git.worktreePatch(this.projectRoot, this.accepted());
      await writeFileAtomic(join(workspace, 'diff.patch'), patch);
      files.push({ path: 'diff.patch', holds: `the patch of the tracked files against the last accepted commit \`${this.accepted()}\`${patch === '' ? '; it is empty' : ''}` });
    } catch (error) {
      missing.push(`the patch of the uncommitted work, which Git could not give: ${message(error)}`);
    }
    return { directory: workspace, files, missing };
  }

  private async iterationViews(assignment: IterationAssignment): Promise<IterationApiViews[]> {
    return iterationApiViews(this.options.ramify, this.projectRoot, this.observe().index, assignment.scope.base, assignment.scope.extra);
  }

  private budgetReturns(iteration: string): number {
    const records = this.observe().records;
    return this.events('invocation-ended')
      .filter(event => event.data.ended === 'context-budget-reached')
      .filter(event => records.invocations.get(event.data.invocation)?.work.iteration === iteration)
      .length;
  }

  async captureAutomaticRepairAssignment(invocation: string,
    delegation: AutomaticRepairAssignment['delegation']): Promise<boolean> {
    try {
      const captured = automaticRepairAssignmentSchema.safeParse(this.ports.committedBody(runLayout.contingentRepairAssignment));
      if (captured.success) {
        if (captured.data.invocation !== invocation || JSON.stringify(captured.data.delegation) !== JSON.stringify(delegation)) throw new Error('A different contingent assignment is already recorded');
        return true;
      }
      const current = await this.options.ramify.queryOwnershipAnswer(this.projectRoot, ['.']);
      const root = current.scope.ownership.modules.find(module => module.parent === null);
      if (root?.id !== delegation.root) throw new Error('Contingent repair must name the verified project root');
      const scope = await resolveWriteScope({ projectRoot: this.projectRoot, ramify: this.options.ramify,
        index: this.observe().index, view: this.input.record.manifest.architectView, revision: 1,
        base: { module: delegation.root, included: delegation.included }, extra: [], read: [], bootstrap: [], rationale: delegation.instructions });
      const declarations = scope.resolved.ownership.modules.map(module => posix.join(module.directory === '.' ? '' : module.directory, 'module.ramify'));
      const assignment = automaticRepairAssignmentSchema.parse({ schema: 'ramify-agent.automatic-repair-assignment/1',
        id: 'root-repair', invocation, delegation, scope,
        guarded: await captureGuardedFiles(this.projectRoot, [...this.requiredArtifacts(this.observe().records).map(artifact => artifact.path), ...declarations],
          await this.guardedScenarioFiles(), [...await this.auditPreparationPaths(), ...scopeConfigurationPaths(scope)]) });
      if (await this.ports.write({ type: 'repair-assignment-recorded', data: { assignment: assignment.id, invocation } },
        [{ path: runLayout.contingentRepairAssignment, id: assignment.id, revision: 1, body: assignment }]) === 'ended') return false;
      // Store a successful provider observation before any later preparation failure.
      await this.ports.ownershipAuthority(assignment).retain(current, current.paths.map(path => ({ path: path.path, allowed: path.status === 'owned' })));
      await this.ports.afterWrite('repair-assignment-recorded', this.input.record.jobId);
      return true;
    } catch (error) {
      await this.ports.fail('invalid-submission', `Contingent root repair assignment cannot be captured: ${message(error)}`);
      return false;
    }
  }

  async recordRepairPreparation(item: WorkItem, attempt: number,
    assignment: IterationAssignment | undefined, result: IterationResult): Promise<RepairPreparation> {
    const pending = [...this.events('repair-preparation-recorded')].reverse().find(event => event.data.workItem === item.id
      && !this.events('repair-preparation-consumed').some(consumed => consumed.data.preparation === event.data.preparation));
    if (pending) {
      const retained = repairPreparationSchema.parse(this.ports.committedBody(runLayout.repairPreparation(pending.data.preparation)));
      if (retained.originalAssignment === (assignment?.id ?? null) && retained.originalInvocation === (result.invocations.at(-1) ?? null)) return retained;
    }
    const id = `prep-${String(this.events('repair-preparation-recorded').length + 1).padStart(4, '0')}`;
    const number = assignment === undefined ? 0 : Number.parseInt(assignment.id.slice(assignment.id.lastIndexOf('.i') + 2), 10);
    let candidate: { head: string; tree: string } | null = null;
    let candidatePaths: string[] = [], candidateFailure: string | null = null;
    if (this.observe().policy.recovery || this.event('repair-assignment-recorded') !== undefined) {
      try {
        candidate = await this.ports.previewCandidateTree();
        candidatePaths = await this.git.changedPaths(this.projectRoot, this.accepted());
      } catch (error) { candidateFailure = message(error); }
    }
    const preparation = repairPreparationSchema.parse({ schema: 'ramify-agent.repair-preparation/1', id,
      operation: 'prepare-local-architect', workItem: item.id, attempt, recordedAt: this.ports.now().toISOString(),
      ledgerSequence: this.observe().history.events.at(-1)?.sequence ?? 0, acceptedCommit: this.accepted(),
      candidateBefore: candidate === null ? null : { head: candidate.head, tree: candidate.tree }, candidateFailure, candidatePaths,
      repairAssignment: this.event('repair-assignment-recorded')?.data.assignment ?? null,
      originalAssignment: assignment?.id ?? null, originalResult: assignment === undefined ? null : iterationLayout.result(item.id, number),
      originalInvocation: result.invocations.at(-1) ?? null,
      inputReferences: [runLayout.capturedPlan, runLayout.documentManifest,
        ...(assignment === undefined ? [] : [iterationLayout.assignment(item.id, number), iterationLayout.result(item.id, number)]),
        ...result.invocations.map(invocation => runLayout.submission(invocation))] });
    const written = await this.ports.write({ type: 'repair-preparation-recorded', data: { preparation: id, workItem: item.id, attempt } },
      [{ path: runLayout.repairPreparation(id), id, revision: 1, body: preparation }]);
    if (written === 'ended') throw new Error('The run ended before its preparation target was durable');
    await this.ports.afterWrite('repair-preparation-recorded', this.input.record.jobId);
    return preparation;
  }

  latestRepairIncident(): { incident: RepairIncidentRecord; stage: RepairIncidentStage } | undefined {
    const event = this.events('repair-incident-recorded').at(-1);
    if (event === undefined) return undefined;
    const latest = [...this.events('repair-incident-recorded'), ...this.events('repair-export-recorded')].filter(item => item.data.incidentId === event.data.incidentId).sort((left, right) => left.sequence - right.sequence).at(-1)!;
    const record = this.observe().history.lines.flatMap(line => line.transaction.records)
      .find(record => record.path === runLayout.repairIncident(latest.data.incidentId, latest.data.revision));
    return { incident: repairIncidentRecordSchema.parse(record?.body), stage: event.data.stage };
  }

  async persistRepairIncident(incident: RepairIncidentRecord, stage: RepairIncidentStage,
    additional: readonly CommitRecord[] = []): Promise<RepairIncidentRecord> {
    const payload = createRepairExportPayload(this.projectRoot, this.input.record.jobId, incident);
    const written = await this.ports.write({ type: 'repair-incident-recorded', data: { incidentId: incident.incidentId, revision: incident.revision, stage } },
      [{ path: runLayout.repairIncident(incident.incidentId, incident.revision), id: incident.incidentId, revision: incident.revision, body: incident },
        { path: repairExportPayloadPath(incident.incidentId, incident.revision), id: incident.incidentId, revision: incident.revision, body: payload }, ...additional]);
    if (written === 'ended') throw new Error('The run ended before the repair incident could be persisted');
    await this.ports.afterWrite('repair-incident-recorded', this.input.record.jobId);
    if (this.input.repairIncidentExport !== undefined && ['refused', 'blocked', 'unverified', 'continued', 'interrupted'].includes(stage)) {
      try {
        const exported = await exportRepairIncident(payload, this.input.repairIncidentExport, this.options.commandExecution, this.ports.now);
        const next = { ...incident, revision: incident.revision + 1, export: exported };
        const exportWritten = await this.ports.write({ type: 'repair-export-recorded', data: { incidentId: incident.incidentId, revision: next.revision, state: exported.state } },
          [{ path: runLayout.repairIncident(next.incidentId, next.revision), id: next.incidentId, revision: next.revision, body: next },
            { path: repairExportPayloadPath(next.incidentId, next.revision), id: next.incidentId, revision: next.revision, body: createRepairExportPayload(this.projectRoot, this.input.record.jobId, next) }]);
        if (exportWritten === 'ended') {
          this.ports.warn(`Automatic repair incident ${incident.incidentId} export completed after the run ended; its retained pending payload must be reconciled before reporting delivery`);
          return incident;
        }
        return next;
      } catch (error) { this.ports.warn(`Automatic repair incident ${incident.incidentId} export remains pending: ${message(error)}`); }
    }
    return incident;
  }

  async automaticProjectRepair(agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>, baseline: MeasurementSnapshot,
    preparation: RepairPreparation, obstruction: unknown, prepare: ((report: RepairResult) => Promise<ConstructedWorkTurnStep>) | null):
    Promise<{ step: ConstructedWorkTurnStep | null; incident: RepairIncidentRecord; delta: RepairDelta } | { refusal: string } | null> {
    const retainedIncident = this.latestRepairIncident();
    const resumedIncident = this.observe().restoring && retainedIncident?.incident.preparation.id === preparation.id && ['admitted', 'running', 'interrupted'].includes(retainedIncident.stage) ? retainedIncident : undefined;
    const id = resumedIncident?.incident.incidentId ?? repairIncidentId(new Set(this.events('repair-incident-recorded').map(event => event.data.incidentId)).size + 1);
    const sourcePath = posix.join('repairs', 'sources', `${id}.json`);
    const originalSource = resumedIncident === undefined ? undefined : this.ports.committedBody(sourcePath) as { before: Awaited<ReturnType<typeof captureRepairFiles>>; protectedBefore: Awaited<ReturnType<typeof captureRepairFiles>>; head: string; tree: string; dirty: string[] } | undefined;
    const assignment = automaticRepairAssignmentSchema.safeParse(this.ports.committedBody(runLayout.contingentRepairAssignment));
    const original = preparation.originalAssignment === null ? undefined : this.observe().records.assignments.get(preparation.originalAssignment);
    const originalOutcome = preparation.originalInvocation === null ? undefined : this.ports.effectiveInvocationOutcome(preparation.originalInvocation);
    let reason: string | null = resumedIncident && !originalSource ? 'The original automatic repair source evidence is unavailable; restore its retained before-state before continuation' : this.ports.ignoring() ? 'Stop or terminal run prevents automatic repair'
      : this.ports.writer.blocked() ?? this.ports.invocationRefusal();
    const durableTarget = repairPreparationSchema.safeParse(this.ports.committedBody(runLayout.repairPreparation(preparation.id)));
    if (reason === null && (!durableTarget.success || JSON.stringify(durableTarget.data) !== JSON.stringify(preparation)
      || this.events('repair-preparation-recorded').at(-1)?.data.preparation !== preparation.id
      || this.events('repair-preparation-consumed').some(event => event.data.preparation === preparation.id))) reason = 'Preparation target is missing, mismatched or already consumed';
    if (!this.observe().policy.recovery && !resumedIncident && reason === null && this.events('invocation-started').some(event => event.data.work.automaticRepair !== undefined)) reason = 'The run has spent its one automatic repair invocation';
    if (!this.observe().policy.recovery && reason === null && (!assignment.success || assignment.data.id !== preparation.repairAssignment)) reason = 'No matching architect-recorded contingent root assignment is available';
    if (reason === null && (original === undefined || originalOutcome === undefined || originalOutcome.ended !== 'submitted' ||
      (!this.observe().policy.recovery && originalOutcome.outsideScope.length > 0) || (originalOutcome.unknownPlacement?.length ?? 0) > 0 || !originalOutcome.settled.confirmed)) reason = 'Original partial candidate has unavailable or refused assignment provenance';
    const previousWriters = this.events('writer-acquired');
    if (reason === null && previousWriters.some(writer => {
      const release = this.events('writer-released').filter(event => event.data.invocation === writer.data.invocation);
      return !this.ports.latestOperationRecovery()?.reconciledInvocations?.includes(writer.data.invocation) && (release.length !== 1 || release[0]!.data.confirmed !== true);
    })) reason = 'A previous writer has no unique confirmed settlement';
    if (reason === null && (obstruction instanceof OwnershipUnavailableError || obstruction instanceof OwnershipAuthorityError || obstruction instanceof z.ZodError)) reason = 'Typed ownership or input validation outcomes continue through ordinary handling';
    let dirty: string[] = [], tree: string | null = null, head: string | null = null;
    let before: Awaited<ReturnType<typeof captureRepairFiles>> = [];
    let protectedBefore: Awaited<ReturnType<typeof captureRepairFiles>> = [];
    try {
      dirty = await this.git.changedPaths(this.projectRoot, this.accepted());
      head = await this.git.currentHead(this.projectRoot);
      tree = (await this.ports.previewCandidateTree()).tree;
      if (reason === null && !resumedIncident && (preparation.candidateBefore === null || tree !== preparation.candidateBefore.tree || head !== preparation.candidateBefore.head)) reason = 'Candidate changed after the recorded preparation target';
      if (reason === null && original !== undefined) {
        const guarded = resumedIncident && assignment.success
          ? guardedScopeOf(assignment.data.scope, await deniedFiles(this.projectRoot, await this.deniedFiles()), this.options.ramify, undefined, this.ports.ownershipAuthority(assignment.data))
          : await this.ports.engineerGuard(original);
        const retainedRepairPaths = new Set<string>();
        if (this.observe().policy.recovery) {
          const ledger = this.observe().history.lines;
          for (const repair of verifiedRepairDeltas(ledger).filter(repair => !ledger.some(entry => entry.sequence > repair.sequence
            && entry.transaction.event.type === 'gate-attempted' && entry.transaction.event.data.verdict === 'passed'
            && Object.entries(checkpointPolicies).some(([checkpoint, policy]) => entry.transaction.event.type === 'gate-attempted'
              && entry.transaction.event.data.checkpoint === checkpoint && policy.committing)))) {
            const repairGuard = guardedScopeOf(repair.assignment.scope, await deniedFiles(this.projectRoot,
              [...await this.deniedFiles(), ...repair.assignment.guarded.map(file => file.path)]), this.options.ramify, undefined, this.ports.ownershipAuthority(repair.assignment));
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
        const protecting = [...assignment.data.guarded.map(file => file.path), ...await this.harnessFiles(),
          ...this.requiredArtifacts(this.observe().records).map(artifact => artifact.path), ...declarationPaths(assignment.data),
          ...await this.auditPreparationPaths(), ...scopeConfigurationPaths(assignment.data.scope)];
        protectedBefore = await captureRepairFiles(this.projectRoot, protecting);
        before = [...new Map([...await captureRepairSource(this.projectRoot, assignment.data.scope), ...await captureRepairFiles(this.projectRoot, dirty)].map(file => [file.path, file])).values()].sort((a, b) => a.path.localeCompare(b.path));
      }
    } catch (error) { reason ??= `Candidate and repair authority cannot be established: ${message(error)}`; }
    // Replacement attribution starts from the settled current candidate.
    // Preserve the original protected-input witness independently of source edits.
    if (originalSource) protectedBefore = originalSource.protectedBefore;
    let eligibleRefusal = !!resumedIncident && !originalSource;
    if (reason === null && !resumedIncident && this.events('invocation-started').some(event => event.data.work.automaticRepair !== undefined)) {
      reason = 'The run has spent its one automatic repair invocation';
      const previous = this.latestRepairIncident();
      eligibleRefusal = previous?.stage === 'continued' && previous.incident.verification?.verified === true && previous.incident.continuation?.delivered === true;
    }
    if (reason === null && (!assignment.success || assignment.data.id !== preparation.repairAssignment)) {
      reason = 'No matching architect-recorded contingent root assignment is available';
      // A malformed committed assignment is corrupt state, not missing authority.
      eligibleRefusal = this.ports.committedBody(runLayout.contingentRepairAssignment) === undefined;
    }
    let incident = repairIncidentRecordSchema.parse({ schema: 'ramify-agent.repair-incident/1', incidentId: id, revision: 1,
      createdAt: this.ports.now().toISOString(), preparation: { id: preparation.id, path: runLayout.repairPreparation(preparation.id) },
      operation: preparation.operation, workItem: preparation.workItem, originalInvocation: preparation.originalInvocation,
      originalAssignment: preparation.originalAssignment, originalResult: preparation.originalResult,
      harnessError: { name: obstruction instanceof Error ? obstruction.name : 'Error', message: message(obstruction),
        stack: obstruction instanceof Error ? obstruction.stack ?? null : null, evidence: preparation.inputReferences },
      admission: { admitted: reason === null, reason: reason ?? 'Matching pure preparation, valid explicit root delegation, settled writer and remaining budget' },
      authority: { assignment: assignment.success ? assignment.data.id : null, scopeEvidence: assignment.success ? [runLayout.contingentRepairAssignment] : [] },
      candidateBefore: { head, tree, changedPaths: dirty, staged: [], unstaged: [], untracked: [], evidence: [`Aggregate candidate paths: ${JSON.stringify(dirty)}; index categories are not separately inferred`, runLayout.repairPreparation(preparation.id)] },
      candidateAfter: null, invocation: null, session: null, result: null, verification: null, continuation: null,
      startedAt: null, endedAt: null, elapsedMs: null, usage: null, versions: { ramify: assignment.success ? assignment.data.scope.resolved.ownership.ramifyVersion : 'unavailable' },
      export: { externalRef: repairExternalRef(repairProjectKey(this.projectRoot), this.input.record.jobId, id), state: 'pending', issueId: null, reason: 'Not exported', attemptedAt: null } });
    if (resumedIncident) incident = { ...resumedIncident.incident, revision: resumedIncident.incident.revision + 1, candidateBefore: incident.candidateBefore, continuation: null };
    incident = await this.persistRepairIncident(incident, reason === null ? 'admitted' : 'refused', reason !== null || originalSource ? [] : [{
      path: sourcePath, id, revision: 1, body: { schema: 'ramify-agent.automatic-repair-source/1', before, protectedBefore, head, tree, dirty } }]);
    if (reason !== null || !assignment.success || original === undefined) {
      if (this.observe().policy.recovery && eligibleRefusal && reason !== null) return { refusal: reason };
      await this.ports.fail('inputs-changed', `Architect preparation failed: ${message(obstruction)}. Automatic repair refused: ${reason}`);
      return null;
    }
    const assigned = assignment.data;
    const guarded = guardedScopeOf(assigned.scope, await deniedFiles(this.projectRoot,
      [...await this.deniedFiles(), ...protectedBefore.map(file => file.path)]), this.options.ramify, undefined, this.ports.ownershipAuthority(assigned));
    const bounds = engineerBoundsOf(this.observe().policy.limits).defaults;
    const absoluteMs = bounds.absoluteMs;
    if (this.ports.ignoring()) {
      await this.persistRepairIncident({ ...incident, revision: incident.revision + 1, endedAt: this.ports.now().toISOString() }, 'blocked');
      return null;
    }
    const toolName = 'submit_automatic_repair';
    const tools = this.implementationTools({ workingDirectory: this.projectRoot, scopeRevision: assigned.scope.revision,
      guarded, commandTimeoutMs: bounds.commandTimeoutMs, submissions: { legalOutcomes: ['ready', 'blocked'], completionOutcome: null } });
    const loaded = packages.get('engineer');
    if (loaded === undefined) throw new Error('Engineer prompt package is unavailable for automatic repair');
    const prompt = ['Restore only the named architect preparation operation so its responsible architect can continue.',
      'Preserve useful partial work, the plan, acceptance, accepted behavior and every module declaration. Do not create, remove or re-parent modules.',
      'Use the supplied root subtree assignment and normal guarded tools. A shell is no exception to denied edits. Do not edit harness code, progress records or Git history.',
      'If the repair requires unavailable authority or a change to the running harness, report blocked.',
      `Submit ready or blocked through ${toolName}; ready is a judgment pending harness verification, never plan completion.`,
      `Active work item: ${preparation.workItem}. Original partial assignment: ${this.path(iterationLayout.assignment(preparation.workItem, Number.parseInt(original.id.split('.i').at(-1)!, 10)))}.`,
      `Preparation and input references: ${this.path(runLayout.repairPreparation(preparation.id))}.`,
      `Full incident diagnostics: ${this.path(runLayout.repairIncident(id, incident.revision))}.`,
      `Root assignment: ${this.path(runLayout.contingentRepairAssignment)}. Instructions: ${assigned.delegation.instructions}.`,
      `Captured engineer bounds: ${JSON.stringify({ ...bounds, absoluteMs })}. Candidate ${tree}; accepted commit ${preparation.acceptedCommit}; dirty paths ${JSON.stringify(dirty)}.`,
      this.planPackage(await this.frozenCatalog()),
    ].join('\n\n');
    incident = await this.persistRepairIncident({ ...incident, revision: incident.revision + 1, startedAt: this.ports.now().toISOString() }, 'running');
    const linesBefore = await takeLineSnapshot(this.projectRoot, this.accepted(), this.git);
    const result = await this.ports.runInvocation<RepairResult>(agent, {
      role: 'engineer', work: { workItem: preparation.workItem, automaticRepair: id }, attempt: 1, loaded,
      task: { kind: 'automatic-repair', goal: 'Restore blocked architect preparation', modules: [assigned.delegation.root],
        requirements: [this.planPackage(await this.frozenCatalog())] },
      systemPrompt: `You are the bounded automatic project repair engineer. Work only under the captured root assignment. ${prompt}`,
      prompt, start: { mode: 'fresh' }, toolName, description: 'Report preparation repair readiness, evidence and remaining implementation work.',
      inputSchema: z.toJSONSchema(repairResultSchema) as JsonSchema, submissionSchema: 'ramify-agent.automatic-repair-result/1', validate: input => validateAgainst(repairResultSchema, input),
      bounds: { idleMs: Math.min(bounds.idleMs, absoluteMs), absoluteMs, commandTimeoutMs: bounds.commandTimeoutMs },
      context: contextPolicyOf(this.observe().policy, 'engineer'), keep: () => finished('work-closed'),
      scope: { write: assigned.scope.revision, measurement: this.baselineReference(), size: null },
      measured: { snapshot: baseline, scope: writeScopeMeasurement(assigned.scope), readScope: readScopeMeasurement(assigned.scope) },
      writer: true, guarded, readModules: [], workingDirectory: this.projectRoot, equip: tools.equip, previewEquipment: tools.preview,
    });
    await this.recordLineEvents(result.id, linesBefore, await takeLineSnapshot(this.projectRoot, this.accepted(), this.git));
    const outcome = result.id === '' ? undefined : this.ports.effectiveInvocationOutcome(result.id);
    const started = this.events('invocation-started').find(event => event.data.invocation === result.id);
    incident = { ...incident, revision: incident.revision + 1, invocation: result.id || null, session: started?.data.session ?? null,
      result: result.value ?? null, endedAt: this.ports.now().toISOString(), elapsedMs: outcome?.elapsedMs ?? null,
      usage: outcome?.usage !== undefined && 'total' in outcome.usage ? { inputTokens: outcome.usage.input, outputTokens: outcome.usage.output, totalTokens: outcome.usage.total, cost: null } : null };
    if (!this.ports.ignoring()) {
      const evidencePath = posix.join('repairs', 'attempts', `${id}.json`);
      let afterFiles: Awaited<ReturnType<typeof captureRepairFiles>> = [], afterPaths: string[] = [], diagnosticFailure: string | null = null;
      try {
        afterPaths = await this.git.changedPaths(this.projectRoot, this.accepted());
        const afterSource = await captureRepairSource(this.projectRoot, assigned.scope);
        afterFiles = await captureRepairFiles(this.projectRoot, [...before.map(file => file.path), ...afterSource.map(file => file.path), ...afterPaths]);
      } catch (error) { diagnosticFailure = message(error); }
      incident = { ...incident, candidateAfter: { head: await this.git.currentHead(this.projectRoot), tree: null, changedPaths: afterPaths,
        staged: [], unstaged: [], untracked: [], evidence: [evidencePath, ...(diagnosticFailure === null ? [] : [diagnosticFailure])] } };
      incident = await this.persistRepairIncident(incident, 'running', [{ path: evidencePath, id, revision: 1,
        body: repairAttemptSchema.parse({ schema: 'ramify-agent.automatic-repair-attempt/1', incidentId: id, invocation: result.id || 'not-started', before, after: afterFiles,
          changes: repairChanges(before, afterFiles), protectedBefore, failure: diagnosticFailure }) }]);
      incident = { ...incident, revision: incident.revision + 1 };
    }
    const blocked = async (why: string, stage: 'blocked' | 'unverified' = 'unverified'): Promise<null> => {
      await this.persistRepairIncident({ ...incident, verification: { verified: false, reason: why, evidence: [] }, continuation: { delivered: false, reason: why, evidence: [] } }, stage);
      if (!this.ports.ignoring()) await this.ports.fail('inputs-changed', `Original architect obstruction: ${message(obstruction)}. Automatic repair: ${why}`);
      return null;
    };
    if (result.ended !== 'submitted' || result.value === undefined || result.value.outcome === 'blocked') return blocked(`Repair ended ${result.ended}${result.value === undefined ? '' : `: ${result.value.summary}`}`, 'blocked');
    if (this.ports.ignoring() || this.ports.writer.blocked() !== null || outcome?.settled.confirmed !== true) return blocked('Repair writer settlement is unverified');
    if (outcome.outsideScope.length > 0 || (outcome.unknownPlacement?.length ?? 0) > 0) return blocked('Repair outcome records outside-scope writes or unknown placement');
    try {
      const documentFaults = await documentChanges(this.projectRoot, this.input.record.planId, this.input.directory, this.input.record.manifest);
      if (documentFaults.length > 0) return blocked(`Protected captured documents changed: ${documentFaults.join('; ')}`);
      const protectedNow = await captureRepairFiles(this.projectRoot, protectedBefore.map(file => file.path));
      if (protectedNow.some(file => { const original = protectedBefore.find(original => original.path === file.path); return file.hash !== original?.hash || file.mode !== original.mode; })) return blocked('Protected configuration, accepted artifacts or module declarations changed');
      const ownership = await this.options.ramify.queryOwnershipAnswer(this.projectRoot, ['.']);
      if (JSON.stringify(ownership.scope.ownership.modules) !== JSON.stringify(assigned.scope.resolved.ownership.modules)) return blocked('Repair changed the module structure');
      const afterDirty = await this.git.changedPaths(this.projectRoot, this.accepted());
      const afterSource = await captureRepairSource(this.projectRoot, assigned.scope);
      const after = await captureRepairFiles(this.projectRoot, [...before.map(file => file.path), ...afterSource.map(file => file.path), ...afterDirty]);
      const changes = repairChanges(before, after);
      if ((await outsideScope(this.projectRoot, guarded, changes.map(change => change.path))).length > 0) return blocked('Repair delta violates captured or current authority');
      const delta = repairDeltaSchema.parse({ schema: 'ramify-agent.automatic-repair-delta/1', incidentId: id,
        assignment: assigned.id, originalAssignment: original.id, acceptedCommit: preparation.acceptedCommit, invocation: result.id,
        beforeValidated: true, beforeDirtyPaths: dirty, before, after, changes,
        structure: protectedBefore.filter(file => declarationPaths(assigned).includes(file.path)).map(file => ({ path: file.path, hash: file.hash })) });
      const afterCandidate = await this.ports.previewCandidateTree();
      if (afterCandidate.head !== head) return blocked('Repair changed Git history or HEAD');
      incident = { ...incident, candidateAfter: { head: afterCandidate.head, tree: afterCandidate.tree, changedPaths: afterDirty, staged: [], unstaged: [], untracked: [], evidence: [`Aggregate candidate paths: ${JSON.stringify(afterDirty)}`, runLayout.repairDelta(id)] },
        verification: { verified: true, reason: prepare === null ? 'Settled guarded delta preserves protected inputs and declarations; ordinary parent preparation remains pending' : 'Settled guarded delta preserves protected inputs and declarations; pure preparation repeated successfully', evidence: [runLayout.repairDelta(id)] } };
      const step = prepare === null ? null : await prepare(result.value);
      return { step, incident, delta };
    } catch (error) { return blocked(`Preparation remains unavailable or repair cannot be verified: ${message(error)}`); }
  }

  async passedScenarioLines(result: IterationResult): Promise<string[]> {
    if (result.outcome !== 'accepted' || result.gate === null) return [];
    const gate = await this.ports.acceptance.readGate(result.gate);
    if (gate === null) return [];
    const { records } = trackedScenarios(this.observe().history.lines);
    return groupedPassedScenarioLines(scenarioResultsOf(gate), new Map(records.map(record => [record.id, record.name])));
  }
  async reviewCompaction<T>( agent: AgentPort, engineer: InvocationRequest<T>,
    checkpoint: { invocation: string; ordinal: number; reason: string }, signal: AbortSignal): Promise<z.infer<typeof compactionReviewSchema>> {
    const matches = (data: { invocation: string; ordinal: number }) => data.invocation === checkpoint.invocation && data.ordinal === checkpoint.ordinal;
    const recorded = this.events('compaction-reviewed').find(event => matches(event.data));
    if (recorded) return { action: recorded.data.action, reason: recorded.data.reason };
    const records = this.observe().records;
    const assignment = engineer.work.iteration === undefined ? undefined : records.assignments.get(engineer.work.iteration);
    const role = engineer.role === 'nonfunctional-repair-engineer' ? 'nonfunctional-coordinator'
      : assignment?.coordination?.kind === 'capability-task' || engineer.work.capabilityTask !== undefined ? 'capability-architect' : 'local-architect';
    if (!this.events('compaction-review-started').some(event => matches(event.data))) {
      await this.ports.write( { type: 'compaction-review-started', data: { invocation: checkpoint.invocation, ordinal: checkpoint.ordinal, role } });
    }
    if (signal.aborted || this.ports.ignoring()) throw new Error('Compaction review stopped');
    const packages = engineer.consultationPackages ?? (await loadPromptPackages({
      ...(this.options.skillDirectory === undefined ? {} : { skillDirectory: this.options.skillDirectory }), capabilityWorkflow: this.workflow !== null,
    })).packages;
    const loaded = packages.get(role);
    if (!loaded) throw new Error(`Compaction review requires ${role}`);
    const key = `compaction:${checkpoint.invocation}:${checkpoint.ordinal}`;
    const prior = this.events('invocation-started').filter(event => event.data.work.request === key);
    let accepted: { id: string; value: z.infer<typeof compactionReviewSchema> } | undefined;
    for (const start of prior) {
      const end = this.events('invocation-ended').find(event => event.data.invocation === start.data.invocation);
      if (end?.data.ended !== 'submitted' || end.data.submission === null) continue;
      const bytes = await readIfExists(this.path(runLayout.submission(start.data.invocation)));
      if (!bytes || sha256(bytes) !== end.data.submission) throw new Error('Compaction assessment submission is unavailable');
      const { schema: _schema, ...body } = JSON.parse(bytes.toString('utf8')) as Record<string, unknown>;
      accepted = { id: start.data.invocation, value: compactionReviewSchema.parse(body) };
    }
    if (!accepted) {
      const original = this.events('invocation-started').find(event => event.data.invocation === checkpoint.invocation);
      if (original === undefined) throw new Error('Compaction review has no originating invocation');
      const toolName = 'submit_compaction_review';
      // This review is already beside an active engineer. A failed review hands the
      // task back; it must not enter a recovery wait that waits on that engineer.
      const result = await this.ports.runParallelReview( agent, {
        role, work: { ...engineer.work, request: key }, task: { kind: 'compaction-review', goal: engineer.task?.goal ?? assignment?.goal ?? engineer.description,
          requirements: [`Review the engineer's assignment and recorded work at ${this.path(runLayout.invocation(checkpoint.invocation))}. Continue useful work; request handoff when the evidence calls for reconsideration or further refinement has diminishing returns. Compaction alone is not evidence of failure.`] },
        attempt: prior.length + 1, loaded,
        systemPrompt: `You are the responsible ${roleDisplayName(role)} reviewing an engineer during native compaction. Inspect evidence and decide whether the engineer should continue or hand the unfinished task back for reconsideration. Use ${toolName} with its supplied schema. This review assesses work; leave implementation changes to the engineer.`,
        prompt: [
          `Engineer ${checkpoint.invocation} is compacting (${checkpoint.reason}). Compaction alone establishes neither failure nor diminishing returns.`,
          'Continue when the approach is useful. Request handoff when the evidence calls for a different approach, a missing decision, or ending unnecessary refinement after requirements are satisfied.',
          'Consider unresolved correctness, expected benefit and cost of more refinement, and whether better context or guidance is needed. Explain the next useful contribution or the reason for reconsideration.',
          `Task: ${engineer.task?.goal ?? assignment?.goal ?? engineer.description}`,
          `Assignment: ${assignment === undefined ? 'See the invocation records.' : JSON.stringify(assignment)}`,
          `Invocation: ${this.path(runLayout.invocation(checkpoint.invocation))}`,
          `Transcript: ${this.path(runLayout.transcript(original.data.session))}`,
          `Tool and validation observations: ${this.path(runLayout.observations(checkpoint.invocation))}`,
        ].join('\n\n'),
        start: { mode: 'fresh' }, keep: () => finished('work-closed'), reader: true, signal,
        toolName, description: 'Decide whether useful work should continue after compaction or the unfinished task should return to its architect.',
        inputSchema: z.toJSONSchema(compactionReviewSchema) as JsonSchema, submissionSchema: 'ramify-agent.compaction-review/1',
        validate: input => validateAgainst(compactionReviewSchema, input), scope: { write: null, measurement: null, size: null },
        equip: session => ({ ...nonfunctionalEquipment({ projectRoot: this.projectRoot, snapshotTools: [],
          commandExecution: this.options.commandExecution, rejectedToolInputsPerTurn: this.observe().policy.limits.rejectedToolInputsPerTurn,
          outputFile: call => this.path(runLayout.shellOutput(session.invocation, call)) }, session),
          builtinTools: ['read', 'write', 'edit', 'grep', 'find', 'ls'] }),
      });
      if (signal.aborted || this.ports.ignoring()) throw new Error('Compaction review stopped');
      if (result.ended !== 'submitted' || result.value === undefined) {
        return { action: 'handoff', reason: `Architect review ended ${result.ended}; reconsider the unfinished task with retained work and context.` };
      }
      accepted = { id: result.id, value: result.value };
    }
    if (signal.aborted || this.ports.ignoring()) throw new Error('Compaction review stopped');
    await this.ports.write( { type: 'compaction-reviewed', data: { invocation: checkpoint.invocation,
      ordinal: checkpoint.ordinal, reviewer: accepted.id, ...accepted.value } });
    return accepted.value;
  }
}

const message = (error: unknown): string => error instanceof Error ? error.message : String(error);

const failureAnalysisMs = 600_000;

const failureOutputCharacters = 400_000;

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
