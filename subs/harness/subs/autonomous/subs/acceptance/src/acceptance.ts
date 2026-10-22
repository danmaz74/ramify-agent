import type { CapabilityInput } from '../../work-coordination/src/capability/ledger.js';
import { recordHash } from '../../../../../src/jobs/committed-reader.js';
import type { AcceptanceJournal } from './acceptance-journal.js';


import type { CapabilityHandbackBasis } from '../../work-coordination/src/coordination.js';

import type { BriefAppend } from './completion.js';
import { readIfExists } from '../../../src/run/artifacts.js';

import { WorkCoordination } from '../../work-coordination/src/coordination.js';
import type { RunWrite } from '../../../src/run/log.js';









import { ownershipAuthorityFor } from '../../../../../src/work/ownership-authority.js';


import { type CommandRunner } from '../../../../evidence/src/run-command.js';
import { z } from 'zod';

import { lstat, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import type { AgentPort, JsonSchema } from '../../../../agent/src/interfaces/port.js';
import { type CandidateSource, type GitService } from '../../../../evidence/src/git.js';
import type { RamifyCli } from '../../../../evidence/src/ramify-cli.js';
import { type ArchitectIndex } from '../../../../evidence/src/views.js';
import type { ConfiguredAuditPort } from '../../../../audit/src/check-execution.js';
import { configuredAuditInstabilityObservations } from '../../../../audit/src/check-execution.js';

import { knownFindingSummary, selectCheckFindings } from '../../../../check-findings/src/queries.js';



import { type CheckFindingCommit } from '../../../../../src/check-findings/transition.js';
import { reconciliationAssessmentSchema, reconciliationLayout } from './reviews/reconciliation.js';
import { reconciliationToolName } from '../../../../reviews/src/reconciliation.js';
import { outsideScope } from '../../../../../src/run/mutations.js';


import { supportedCapabilityPolicy } from '../../work-coordination/src/capability/policy.js';





import { canonicalJson } from '../../../../../src/jobs/commands.js';
import { reviewRequestSchema, type NotVerifiedReason } from './reviews/records.js';
import { snapshotTools } from '../../../../reviews/src/snapshot.js';
import { reviewStateOf, unsettledRequests } from './reviews/state.js';



import { type RunFailureReason } from '../../../../../src/interfaces/protocol/runs.js';

import { type RecordRef as CommitRecord } from '../../../../../src/jobs/commit.js';







import { readAcceptedEvidence, acceptedAnalysisReferences } from '../../planning/src/evidence.js';
import { assessmentSchema, type Assessment } from '../../../../nonfunctional/src/interfaces/contracts.js';
import { coordinatorAssessmentToolName, coordinatorActionToolName, coordinatorInvestigationToolName } from './nonfunctional/submissions.js';

import { documentChanges } from '../../planning/src/documents.js';

import { commitReadinessRepair } from './readiness-commit.js';
import { type RecoveryBoundary } from '../../../src/run/records.js';

import type { InterruptionEvidence } from '../../../../agent/src/interfaces/port.js';

import { committedBody, invocationRecord, type InvocationRequest } from '../../../../task-workflow/src/steps/runner.js';
import { finished, kept, type InvocationResult } from '../../../../task-execution/src/results.js';
import { sha256, type LoadedPackage } from '../../../../../src/prompts/packages.js';





import { nonfunctionalEquipment } from './nonfunctional/equipment.js';
import { type IterationAssignment, type IterationResult } from '../../work-coordination/src/work/iterations.js';
import { type WriteScope } from '../../../../../src/work/scope.js';

import { deniedFiles } from '../../../../../src/work/scope.js';
import { committedRecords } from '../../../src/run/committed-records.js';


import { AfterHandling } from './after-handling.js';
import { pendingCorrection, verifiedRequirements } from '../../work-coordination/src/work/history.js';
import { CandidateDriftError, CommittingGates, readinessAuditOutcome, type GateHost } from './committing-gate.js';
import { EvidenceUnavailableError } from '../../../src/run/inputs.js';

import type { RenderedFeatureFile } from '../../../../scenarios/src/rendering.js';
import { type RunEvent, type RunEventInput } from '../../../src/run/log.js';




import { commitForMaterialization, expectedFeatureHashes, materializationMessage, rerenderFeatureFiles, trackedScenarios } from './feature-files.js';

import { failingStep, performRecovery, readinessFailureReason, recoveryFor, runReadiness, withRecovery } from './readiness.js';
import { declaredModuleDirectories } from '../../../../../src/run/project-config.js';
import { assertScratchSafe, ensureScratchRule, ScratchIgnoreConflictError } from '../../work-coordination/src/work/scratch.js';
import { gateAttemptId, gateAttemptSchema } from './gate-records.js';
import { runDirectory } from '../../../src/run/records.js';
import { readinessAttemptSchema } from './readiness-records.js';
import { recoveryId, runLayout, runSchemas, type RunRecord } from '../../../src/run/records.js';
import { invocationOutcomeSchema, type Invocation, type InvocationOutcome, type SessionFinishReason, type SessionId } from '../../../../task-execution/src/records.js';


import { recordAppend } from '../../../../task-execution/src/transcripts/recorder.js';


import { validateAgainst } from '../../../../task-execution/src/submissions.js';

import { HarnessSessionOperations } from '../../../../../src/prompts/session-adapter.js';



import type { RecordRead } from '../../../../ledger/src/ledger.js';
import type { CheckFindingPlan } from '../../../../../src/check-findings/transition.js';
import type { RunSession } from '../../../src/run/sessions.js';
import { refOf } from '../../../../../src/jobs/committed-reader.js';

import type { CapabilityVerification } from '../../work-coordination/src/coordination.js';

import type { ParentSession, CompletionBasis, Reconciled, ReconciliationOwner } from './completion.js';







import { readVerifiedTextBlobBytes } from '../../../../evidence/src/git-text.js';
import { checkExecutionObstruction } from './check-execution-recovery.js';
import { mayRetryTask } from '../../../../recovery/src/reentry.js';













import { boundedNonfunctionalTools, nonfunctionalSourceAllows } from './nonfunctional/submissions.js';
import { startingPointsSection, type StartingPointGroup } from '../../work-coordination/src/work/starting-inputs.js';




import { finalCorrectionSchema, type FinalCorrection } from './final-correction.js';


import { posix } from 'node:path';
import type { SessionStart, ToolDefinition } from '../../../../agent/src/interfaces/port.js';



import type { GateAttempt } from './checks/records.js';





import { decideCheckFindingChange } from '../../../../check-findings/src/decide.js';
import type { CheckFindingId, CheckFindingState, CheckFindingSummary } from '../../../../check-findings/src/interfaces/check-findings.js';



import { attentionAt, basisChange, briefText as reconciliationBrief, needsLaterRound, reconciliationBasisSchema, reconciliationId, validateReconciliation, type BasisRequest, type ReconciliationAssessment, type ReconciliationBasis, type UnresolvedReason } from './reviews/reconciliation.js';
import { reconciliationJsonSchema, reconciliationSubmissionDescription, validateReconciliationForExecution, type AttentionEntry, type BoundReconciliation, type ReconciliationSubmission } from '../../../../reviews/src/reconciliation.js';
import { reconciliationMessage, type ReconciliationPacket } from './reviews/reconciliation-message.js';
import { reconciliationFactsMessage, type PacketRequest } from '../../../../reviews/src/reconciliation-message.js';

import { capabilityHandbackGuidance } from '../../work-coordination/src/capability/delivery.js';
import { type CapabilityRequest, type CapabilityTask, type CapabilityPlan } from '../../work-coordination/src/capability/records.js';



import { type CapabilityAction } from '../../work-coordination/src/capability/submission.js';
import { capabilityCompletionBlockers, replayCapabilityState } from '../../work-coordination/src/capability/state.js';




import { reviewAttemptId, reviewAttemptSchema, reviewLayout, reviewOrientationSchema, type ForkPoint, type ReviewAttempt, type ReviewOrientation, type ReviewRequest, type ReviewResult } from './reviews/records.js';
import { reviewSubmissionSchema, type OrientationSubmission, type ReviewSubmission } from '../../../../reviews/src/interfaces/submissions.js';
import type { CapturedInput } from '../../../../reviews/src/inputs.js';
import { prepareReview, type PreparedReview } from '../../../../reviews/src/preparation.js';
import { ReviewQueue } from '../../../../reviews/src/scheduler.js';
import { openCandidateSnapshot, resolveSnapshotPath, type CandidateSnapshot, type SnapshotComparison, type SnapshotTools } from '../../../../reviews/src/snapshot.js';










import { planPath } from '../../../../../src/plans/discover.js';


import { elementIdSchema, type ElementCatalog } from '../../../../plan-evidence/src/interfaces/catalog.js';


import { roundSchema, type Candidate } from '../../../../nonfunctional/src/interfaces/contracts.js';
import { decideNonfunctionalRound, type RoundDecision } from '../../../../nonfunctional/src/rounds.js';
import { replayNonfunctionalPhase } from './nonfunctional-phase.js';
import { preparedCandidateSchema, nonfunctionalDeviationSchema, nonfunctionalRepairAssignmentSchema } from './nonfunctional-records.js';
import { assessedElements, bindCoordinatorAssessment, coordinatorAssessmentJsonSchema, coordinatorActionJsonSchema, coordinatorInvestigationJsonSchema, coordinatorActionSchema, nonfunctionalRepairJsonSchema, nonfunctionalRepairToolName, validateCoordinatorAction, validateCoordinatorInvestigation, nonfunctionalRepairSubmissionSchema, type CoordinatorAssessmentSubmission, type CoordinatorAction, type CoordinatorInvestigation, type NonfunctionalRepairSubmission } from './nonfunctional/submissions.js';
import { coordinatorAssessmentPrompt, coordinatorActionPrompt, repairPrompt } from './nonfunctional/prompts.js';











import { stepInputsSchemaId, validateReviewInputs } from '../../../../task-workflow/src/steps/inputs.js';

import { constructDesignOrientationStep, constructReviewStep } from '../../../../task-workflow/src/steps/reviewer.js';
import { renderGlobalForkPrompt, renderReconciliationPrompt, renderNonfunctionalCoordinatorPrompt, renderNonfunctionalRepairPrompt } from '../../../../../src/prompts/packages.js';

import { readScopeMeasurement, writeScopeMeasurement } from '../../../../kpi/src/measurement/inputs.js';

import { takeLineSnapshot } from '../../../../kpi/src/lines.js';


import { nextCheckFinding } from './deviations/finding.js';
import { nonfunctionalDeviationCommands, nonfunctionalDeviationHash, prepareNonfunctionalDeviation } from './deviations/nonfunctional.js';
import type { StandIn } from '../../work-coordination/src/contracts/parity.js';
import { contractsLayout, obligationId, type ConsumerRequirement } from '../../work-coordination/src/contracts/records.js';
import { conformanceKey, verificationKey } from '../../work-coordination/src/contracts/schedule.js';
import { type EstablishedContract } from '../../work-coordination/src/contracts/submission.js';
import { remainingInjections } from '../../work-coordination/src/contracts/verification.js';


import { type EquipContext, type Equipment } from '../../../../task-execution/src/equipment.js';

import { repairWorkingDirectory } from '../../work-coordination/src/work/engineer-directory.js';

import { iterationAssignmentSchema, iterationLayout } from '../../work-coordination/src/work/iterations.js';


import { isContained } from '../../../../../src/guard/resolve-contained-path.js';
import { scopeConfigurationPaths, captureGuardedFiles, guardedScopeOf, resolveWriteScope } from '../../../../../src/work/scope.js';

import { workLayout, workItemId, workItemSchema, type WorkItem } from '../../work-coordination/src/work/records.js';
import { type ReconciliationBriefing } from '../../work-coordination/src/work/session.js';
import { gateDiagnostics, type GateAudience } from './checks/diagnostics.js';

import { completedReviewResult, concernBindings, finishReview, requestedStartOf, reviewOutcome, sameWorkItem } from './review-finish.js';
import { type ConcernBinding } from '../../../../reviews/src/concern-binding.js';


import { capabilityBlockersOf } from '../../work-coordination/src/work/history.js';
import { CandidateReassessmentRequired, writeScopePaths } from './committing-gate.js';



import { type RunEventOf } from '../../../src/run/log.js';

import { contextPolicyOf, engineerBoundsOf } from '../../../../../src/run/policy.js';


import { contentHash as featureContentHash, expectedFeatureFiles, incompleteScenarios } from './feature-files.js';





import { type ArchitectRef, type ForkRelation } from '../../../../task-execution/src/records.js';











import type { AcceptanceReading } from './acceptance-journal.js';
import { eventsOf, eventOf } from '../../work-coordination/src/work/history.js';
import type { SessionState } from '../../../src/run/sessions.js';

export interface AcceptanceObservation extends AcceptanceReading {
 readonly findings: CheckFindingState; readonly restoring: boolean; readonly readerStop: NotVerifiedReason | undefined;
}
export interface AcceptanceInput {
 readonly projectRoot: string; readonly directory: string; readonly record: Pick<RunRecord, 'jobId' | 'planId' | 'manifest' | 'projectConfig' | 'auditConfiguration'>;
 readonly workflow: 'capability-coordination/1' | null;
 readonly options: { readonly ramify: RamifyCli; readonly commandExecution?: CommandRunner | undefined; readonly configuredAudit: ConfiguredAuditPort };
 readonly git: GitService; readonly candidates: CandidateSource;
 readonly gates: CommittingGates; readonly handling: AfterHandling;
}
export interface AcceptancePorts extends Omit<AcceptanceJournal, 'observe'> {
 observe(): AcceptanceObservation;
 closed(): boolean;
 notify(): void; changed(): Promise<void>;
 requireSettled(reason: string): void; registerWriter(invocation: string, pid: number): void;
 operations(agent: AgentPort): Promise<HarnessSessionOperations>;
 sessionState(session: SessionId): SessionState | undefined;
 session(session: SessionId): Readonly<RunSession> | undefined;
 recordAppend(session: SessionId, note: Parameters<typeof recordAppend>[1], sequence: number | null): Promise<void>;
 readRecord<T>(path: string, schema: import('../../../../../src/jobs/commit.js').CommittedSchema<T>): Promise<RecordRead<T>>;
 commitFinding(build: (current: { readonly state: CheckFindingState }) => CheckFindingPlan | { readonly stale: string }, at?: Date): Promise<CheckFindingCommit>;
 readonly gateHost: GateHost;
 readonly coordination: Pick<WorkCoordination, 'accepted' | 'architectViewInputs' | 'assignmentStartingPoints' | 'auditPreparationPaths' | 'baselineReference' | 'baselineSnapshot' | 'checkInputSection' | 'currentSelection' | 'deniedFiles' | 'engineerStartingPoints' | 'fakeNamingRule' | 'finishCapabilityHandback' | 'frozenCatalog' | 'guardedScenarioFiles' | 'implementationTools' | 'packageText' | 'planPackage' | 'recordLineEvents' | 'stepFallback' | 'takeWorkItems' | 'verifiedRequirements'>;
 afterWrite(write: RunWrite, runId: string): Promise<void>;
 committedBody(path: string): unknown;
 effectiveInvocationOutcome(id: string): InvocationOutcome | undefined;
 endRun(terminal: RunEventInput, opening?: SessionFinishReason): Promise<'committed' | 'ended'>;
 fail(reason: RunFailureReason, text: string, evidence?: readonly string[]): Promise<void>;
 finishSession(session: SessionId | undefined, reason: SessionFinishReason): Promise<void>;
 ignoring(): boolean;
 invocationRecord(id: string): { readonly revision: number; readonly body: Invocation };
 now(): Date;
 ownershipAuthority(assignment: { readonly scope: WriteScope }): ReturnType<typeof ownershipAuthorityFor>;
 previewCandidateTree(): ReturnType<GitService['previewCandidateTree']>;
 recordedRunBase(): string | undefined;
 refreshIndex(): Promise<ArchitectIndex | null>;
 waitOperationRecovery(boundary: RecoveryBoundary, evidence: InterruptionEvidence,
    attempts: readonly string[], automaticAttempts: number, group?: number, wait?: boolean): Promise<boolean>;
 runInvocation<T>(agent: AgentPort, request: InvocationRequest<T>): Promise<InvocationResult<T>>;
 warn(message: string): void;
 write(input: RunEventInput, records?: readonly CommitRecord[], at?: Date): Promise<'committed' | 'already-committed' | 'ended'>;
}

export class Acceptance {
 private reviews: ReviewQueue | undefined;
 private readonly orienting = new Map<string, Promise<ReviewOrientation>>();
 private readonly reviewPreparations = new Map<string, AbortController>();
 constructor(private readonly input: AcceptanceInput, private readonly ports: AcceptancePorts) {}
 private get projectRoot() { return this.input.projectRoot; }
 private get git() { return this.input.git; }
 private get candidates() { return this.input.candidates; }
 private get workflow() { return this.input.workflow; }
 private get options() { return this.input.options; }
 private get gates() { return this.input.gates; }
 private get handling() { return this.input.handling; }
 private observe() { return this.ports.observe(); }
 private events<T extends RunEvent['type']>(type: T) { return eventsOf(this.observe().history.events, type); }
 private event<T extends RunEvent['type']>(type: T) { return eventOf(this.observe().history.events, type); }
 private path(relative: string) { return join(this.input.directory, relative); }
 wakeReviews(): void { this.reviews?.wake(); }
 suspendReviews(drain?: boolean): (() => void) | undefined { return this.reviews?.suspend(drain); }
 closeReviews(): void { this.reviews?.close(); for (const preparation of this.reviewPreparations.values()) preparation.abort(); }
 reviewsSettled(): Promise<void> { return this.reviews?.settled() ?? Promise.resolve(); }
 reviewsSettledExcept(predicate: (id: string) => boolean, changed: () => Promise<void>): Promise<void> { return this.reviews?.settledExcept(predicate, changed) ?? Promise.resolve(); }
 hasReviews(): boolean { return this.reviews !== undefined; }
  startReviews(agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>): void {
    const policy = this.observe().policy.reviews;
    if (policy === undefined || this.reviews !== undefined) return;
    this.reviews = new ReviewQueue({
      concurrency: policy.concurrency,
      queue: policy.queue,
      preserveCoverage: this.observe().policy.continuity !== undefined,
      unsettled: () => unsettledRequests(this.observe().history.events).map(request => request.id),
      attempt: request => this.recoverableReviewAttempt(agent, packages, request),
      prepare: request => this.prepareReview(agent, packages, request),
      overflow: async request => {
        await this.finishUnsettledReviews(() => ({ reason: 'queue-overflow', detail: `More than ${policy.queue} review requests were waiting; this one was not run` }), [request]);
      },
      now: () => this.ports.now().getTime(),
      warn: text => this.ports.warn(`Run ${this.input.record.jobId}: ${text}`),
    });
    this.reviews.wake();
  }

  private async prepareReview(agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>, id: string): Promise<void> {
    const state = reviewStateOf(this.observe().history.events).get(id);
    if (state === undefined || state.settledBy !== null) return;
    if (this.ports.closed() || this.ports.ignoring() || this.reviews?.accepting !== true) return;
    const loaded = packages.get('reviewer');
    if (loaded?.reviewer === undefined) return;
    const request = reviewRequestSchema.parse(this.ports.committedBody(reviewLayout.request(id)));
    const point = request.forkPoint;
    if (request.key.kind !== 'design' || point.kind !== 'orientation' || request.inputsUnavailable !== undefined) return;
    if (request.guidance.length === 0 || this.events('review-orientation-recorded').some(event => event.data.key === point.key)) return;
    const texts = await Promise.all(request.guidance.map(entry => this.candidates.readBlob(this.projectRoot, request.key.candidate, entry.ref)));
    const guidance = boundInputs(request.guidance.map((entry, index) => ({ ref: entry.ref, hash: sha256(texts[index]!), text: texts[index]! })), request.guidance);
    if (this.ports.closed() || this.ports.ignoring() || this.reviews?.accepting !== true) return;
    await this.orientation(agent, loaded, request, guidance);
  }

  private reviewableClosings(): Array<{ readonly workItem: string; readonly iteration: string; readonly gate: string; readonly commit: string }> {
    const assigned = new Set([...this.events('iteration-assigned').map(event => event.data.iteration),
      ...this.events('capability-assigned').map(event => event.data.assignment)]);
    return this.events('iteration-closed').flatMap(event => {
      if (event.data.outcome !== 'accepted' || event.data.gate === null || event.data.commit === null || !assigned.has(event.data.iteration)) return [];
      const assignment = committedRecords(this.observe().history.lines).assignments.get(event.data.iteration);
      return [{ workItem: assignment?.coordination?.kind === 'capability-task' ? assignment.coordination.id : event.data.workItem,
        iteration: event.data.iteration, gate: event.data.gate, commit: event.data.commit }];
    });
  }

  private async runReviewAttempt(agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>, id: string): Promise<boolean> {
    const policy = this.observe().policy.reviews;
    const state = reviewStateOf(this.observe().history.events).get(id);
    if (policy === undefined || state === undefined || state.settledBy !== null) return false;
    if (this.ports.ignoring() || this.reviews?.accepting !== true) return false;
    const request = reviewRequestSchema.parse(this.ports.committedBody(reviewLayout.request(id)));
    const recovered = await this.recoverAcceptedReview(request, state);
    if (recovered !== null) return recovered;
    const kind = request.key.kind;
    const attempt = reviewAttemptId(id, state.attempts.length + 1);
    const queuedAt = state.attempts.at(-1)?.finished?.at ?? state.recordedAt;
    const retryLeft = state.attempts.filter(entry => entry.finished !== null && !entry.finished.settles).length < policy.retries;
    const requestedStart = requestedStartOf(request);
    const base = { id: attempt, request: id, queuedAt, requestedStart };
    const unavailable = (detail: string) => this.finishReview(request, {
      ...base, startedAt: null, invocation: null, session: null, actualStart: null,
    }, { result: 'not-verified', reason: 'unavailable', detail }, true);

    const loaded = packages.get('reviewer');
    if (loaded?.reviewer === undefined) return await unavailable('No prompt package is loaded for the reviewer') === 'committed';
    if (request.inputsUnavailable !== undefined) return await unavailable(request.inputsUnavailable) === 'committed';
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
      if (request.source !== undefined) assignmentPackage = await this.ports.coordination.packageText(request.source);
      if (kind === 'design') {
        const texts = await Promise.all(request.guidance.map(entry => this.candidates.readBlob(this.projectRoot, request.key.candidate, entry.ref)));
        guidance = boundInputs(request.guidance.map((entry, index) => ({ ref: entry.ref, hash: sha256(texts[index]!), text: texts[index]! })), request.guidance);
      }
    } catch (error) {
      return await unavailable(`The ${kind} review's captured inputs could not be read as recorded: ${message(error)}`) === 'committed';
    }
    let start: Awaited<ReturnType<Acceptance['reviewStart']>>;
    try { start = await this.reviewStart(agent, loaded, request, guidance); }
    catch (error) { return await unavailable(`The recorded review source is unavailable: ${message(error)}`) === 'committed'; }
    // An orientation made first may have met an explicit stop; the request
    // can already be settled when its prepared orientation returns.
    if (this.ports.closed() || this.ports.ignoring() || this.reviews?.accepting !== true) return false;
    if (reviewStateOf(this.observe().history.events).get(id)?.settledBy !== null) return false;

    const pendingBindings = await this.handling.reviewPendingBindings(request, snapshot);
    const assignment = iterationAssignmentSchema.safeParse(this.ports.committedBody(request.assignment));
    const reviewedResult = committedRecords(this.observe().history.lines).results.get(request.key.iteration);
    const discovery = assignment.success ? startingPointsSection([
      this.ports.coordination.assignmentStartingPoints(assignment.data),
      await this.ports.coordination.engineerStartingPoints(assignment.data,
        reviewedResult?.gate === request.gate && reviewedResult.commit === request.key.candidate ? reviewedResult : undefined,
        request.gate, request.key.candidate),
    ], { projectRoot: this.projectRoot, snapshot, allows: path => nonfunctionalSourceAllows(path, ['.']) }) : undefined;

    // Binding reads may yield while this request is stopped or settled. Do
    // not register preparation after its cancellation sweep has already run.
    if (this.ports.ignoring() || this.reviews?.accepting !== true || reviewStateOf(this.observe().history.events).get(id)?.settledBy !== null) return false;
    // The question's message inputs, captured once: the review step is built from these.
    const intent = assignment.success ? {
      goal: assignment.data.goal, approach: assignment.data.approach, completionEvidence: assignment.data.completionEvidence,
      scopeRationale: assignment.data.scope.rationale,
      testAreas: assignment.data.scope.resolved.ownership.modules.filter(module => assignment.data.gate.tests.exactOwners.includes(module.id)
        || assignment.data.gate.tests.subtrees.some(owner => module.id === owner || module.id.startsWith(`${owner}/`)))
        .map(module => posix.join(module.directory, 'src/tests')),
    } : null;
    const checkFindings = knownFindingSummary({ ...this.observe().findings, findings: new Map([...this.observe().findings.findings].filter(([, entry]) =>
      sameWorkItem(entry.owner, request.workItem) && entry.verification.kind === 'assessment'
      && !entry.reports.some(report => report.observation.kind === 'audit-instability' || report.producer === 'review:test-reliability'))) });
    const setup = [kind === 'design' ? '' : await this.ports.coordination.checkInputSection(snapshot)].filter(Boolean).join('\n');
    const planDocument = snapshot.entries.get(planPath(this.input.record.planId))?.kind === 'file' ? planPath(this.input.record.planId) : null;
    let prepared: PreparedReview;
    const preparation = new AbortController();
    this.reviewPreparations.set(id, preparation);
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
      if (this.ports.ignoring() || this.reviews?.accepting !== true || reviewStateOf(this.observe().history.events).get(id)?.settledBy !== null) return false;
      if (this.observe().policy.continuity) {
        const resumed = await this.ports.waitOperationRecovery({ kind: 'preparation', role: 'reviewer', reviewRequest: id, candidate: request.key.candidate,
          work: { workItem: request.workItem, iteration: request.key.iteration, request: id } },
          { classification: 'preparation', diagnostic: `The frozen review candidate's patches are unavailable: ${message(error)}` }, [], 0);
        return resumed ? this.runReviewAttempt(agent, packages, id) : false;
      }
      return await unavailable(`The audited candidate's patches could not be collected: ${message(error)}`) === 'committed';
    } finally {
      this.reviewPreparations.delete(id);
    }
    if (this.ports.ignoring() || this.reviews?.accepting !== true || reviewStateOf(this.observe().history.events).get(id)?.settledBy !== null) return false;
    const workspace = join(dirname(reviewLayout.attempt(attempt)), 'workspace');
    await mkdir(this.path(workspace), { recursive: true });

    // The question is built from its inputs by the reviewer step's own
    // constructor, which `step render` uses too. The prepared patches, tools
    // and validator are the reviews child's, over the same candidate.
    let step: ReturnType<typeof constructReviewStep>;
    try {
      const reviewInputs = validateReviewInputs({
        schema: stepInputsSchemaId, role: 'reviewer', question: kind, run: { planId: this.input.record.planId, runId: this.input.record.jobId },
        work: { workItem: request.workItem, iteration: request.key.iteration }, attempt: state.attempts.length + 1,
        capabilityWorkflow: this.workflow !== null, limits: this.observe().policy.limits, context: contextPolicyOf(this.observe().policy, 'reviewer'),
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
    const result = await this.ports.runInvocation<ReviewSubmission>(agent, {
      recoveryReviewRequest: id,
      originalInvocation: state.attempts.at(-1)?.finished === null ? state.attempts.at(-1)?.started?.invocation : undefined,
      restore: state.attempts.at(-1)?.finished === null && state.attempts.at(-1)?.started !== null,
      singleAdmission: true,
      role: step.role,
      brief: step.brief,
      context: step.context,
      stepInputs: step.before.inputs, consultationPackages: packages,
      fallback: this.ports.coordination.stepFallback(step.inputs, packages),
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
        const at = this.ports.now();
        const recorded = await this.ports.publish(async () => {
          if (this.observe().terminal !== undefined || reviewStateOf(this.observe().history.events).get(id)?.settledBy !== null) return { value: false };
          return { value: true, transaction: { event: { type: 'review-attempt-started', data: { request: id, attempt, invocation, session, requestedStart } }, records: [], at } };
        });
        if (recorded) started = { invocation, session, at: at.toISOString() };
        else fenced = true;
      },
      fenced: () => fenced,
    });
    // A closing service records nothing more; recovery finishes the attempt.
    if (this.ports.closed() || fenced) return false;

    const outcome = reviewOutcome(result, this.observe().readerStop);
    const settles = !(outcome.retryable && retryLeft && !this.ports.ignoring() && this.reviews?.accepting === true);
    const attemptBody = {
      ...base,
      startedAt: started?.at ?? null,
      invocation: result.id || started?.invocation || null,
      session: result.session || started?.session || null,
      transportInvocations: this.events('operation-recovery-attempt').filter(event => event.data.invocation === result.id || started !== undefined && this.transportAncestor(event.data.invocation, started.invocation)).map(event => event.data.invocation),
      // What the executor answered, never what was asked: a fork it could
      // not take is a fresh start, and is never measured as a fork.
      actualStart: result.actual === undefined ? null : result.actual === 'fork' ? 'fork' as const : 'fresh' as const,
    };
    const submission = result.ended === 'submitted' ? result.value : undefined;
    // What the harness binds to each concern is read here, before the
    // transition takes the run mutex.
    const bindings = submission === undefined || submission.concerns.length === 0
      ? []
      : await this.concernBindings(request, snapshot, prepared.tools, submission);
    const committed = await this.finishReview(request, attemptBody, outcome.result, settles, submission, bindings);
    return committed === 'committed';
  }

  private async recoverableReviewAttempt(agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>, id: string): Promise<boolean> {
    for (;;) {
      try { return await this.runReviewAttempt(agent, packages, id); }
      catch (error) {
        if (!this.observe().policy.continuity || this.ports.ignoring()) throw error;
        const request = reviewRequestSchema.parse(this.ports.committedBody(reviewLayout.request(id)));
        const resumed = await this.ports.waitOperationRecovery({ kind: 'preparation', role: 'reviewer', reviewRequest: id,
          candidate: request.key.candidate, work: { workItem: request.workItem, iteration: request.key.iteration, request: id } },
          { classification: 'preparation', diagnostic: `Frozen review ${id} setup is unavailable: ${message(error)}` }, [], 0);
        if (!resumed) return false;
      }
    }
  }

  private transportAncestor(id: string, ancestor: string): boolean {
    const seen = new Set<string>(); let current: string | undefined = id;
    while (current && !seen.has(current)) { if (current === ancestor) return true; seen.add(current); current = this.ports.invocationRecord(current).body.recoveryPredecessor; }
    return false;
  }

  private async recoverAcceptedReview(
    request: ReviewRequest, state: ReturnType<typeof reviewStateOf> extends ReadonlyMap<string, infer R> ? R : never,
  ): Promise<boolean | null> {
    const pending = state.attempts.at(-1);
    if (pending?.started === null || pending?.started === undefined || pending.finished !== null) return null;
    const invocation = this.events('invocation-ended').filter(event => event.data.ended === 'submitted' && this.transportAncestor(event.data.invocation, pending.started!.invocation)).at(-1)?.data.invocation ?? pending.started.invocation;
    const ended = this.events('invocation-ended').find(event => event.data.invocation === invocation);
    if (ended?.data.ended !== 'submitted') return null;
    const outcome = invocationOutcomeSchema.safeParse(this.ports.committedBody(runLayout.outcome(invocation)));
    const bytes = await readIfExists(this.path(runLayout.submission(invocation)));
    if (ended.data.submission === null || bytes === undefined || sha256(bytes) !== ended.data.submission ||
      !outcome.success || outcome.data.submission?.hash !== ended.data.submission ||
      outcome.data.disposition !== 'applied' || !outcome.data.settled.confirmed || outcome.data.session === undefined) {
      await this.ports.fail('recovery-exhausted', `Reviewer ${invocation} has no authenticated accepted submission for ${pending.id}`);
      return false;
    }
    const raw = JSON.parse(bytes.toString('utf8')) as Record<string, unknown>;
    const { schema: _schema, ...body } = raw;
    const parsed = reviewSubmissionSchema.safeParse(body);
    if (raw.schema !== 'ramify-agent.review-submission/1' || !parsed.success) {
      await this.ports.fail('recovery-exhausted', `Reviewer ${invocation} has an invalid accepted submission for ${pending.id}`);
      return false;
    }
    const submission = parsed.data;
    const snapshot = await openCandidateSnapshot(this.candidates, this.projectRoot,
      { commit: request.key.candidate, base: request.base });
    // An authenticated accepted report belongs to the original immutable
    // candidate. Do not replay exhaustive text reads: ordinary shell evidence
    // can be binary, and optional legacy inventories are not completion gates.
    const read = new Map<string, string>();
    const bindings = submission.concerns.length === 0 ? []
      : await this.concernBindings(request, snapshot, { read: () => read }, submission);
    const result: ReviewResult = completedReviewResult(submission);
    const previous = state.attempts.at(-2);
    const attempt = {
      id: pending.id, request: request.id, queuedAt: previous?.finished?.at ?? state.recordedAt,
      requestedStart: requestedStartOf(request),
      startedAt: pending.started.at, invocation, session: ended.data.session,
      transportInvocations: this.events('operation-recovery-attempt').filter(event => this.transportAncestor(event.data.invocation, pending.started!.invocation)).map(event => event.data.invocation),
      actualStart: outcome.data.session.mode === 'fork' ? 'fork' as const : 'fresh' as const,
    };
    return await this.finishReview(request, attempt, result, true, submission, bindings) === 'committed';
  }

  private async concernBindings(request: ReviewRequest, snapshot: CandidateSnapshot, tools: Pick<SnapshotTools, 'read'>, submission: ReviewSubmission): Promise<ConcernBinding[]> {
    return concernBindings(this.observe().history, { projectRoot: this.projectRoot, planId: this.input.record.planId, candidates: this.candidates, warn: text => this.ports.warn(text) },
      request, snapshot, tools, submission);
  }

  private async reviewStart(agent: AgentPort, loaded: LoadedPackage, request: ReviewRequest, guidance: readonly CapturedInput[]): Promise<{
    readonly start: SessionStart;
    readonly fork?: ForkRelation | undefined;
    readonly degraded?: { readonly requested: 'fork'; readonly reason: string } | undefined;
  }> {
    const fresh = (reason: string) => ({ start: { mode: 'fresh' } as const, degraded: { requested: 'fork' as const, reason } });
    const point = request.forkPoint;
    if (point.kind === 'none') return { start: { mode: 'fresh' } };
    if (point.kind === 'unavailable') {
      return fresh(point.reason);
    }
    let from: { readonly session: SessionId; readonly invocation: string; readonly ref: string; readonly reason: 'scope-review' | 'design-orientation' };
    if (point.kind === 'session') {
      const assigned = this.events('iteration-assigned').find(event => event.data.iteration === request.key.iteration);
      const taskAssigned = this.events('capability-assigned').find(event => event.data.assignment === request.key.iteration);
      const invocation = assigned?.data.invocation ?? taskAssigned?.data.invocation;
      if (invocation === undefined) throw new EvidenceUnavailableError(`No assignment of ${request.key.iteration} is recorded`);
      from = { session: point.session as SessionId, invocation, ref: point.ref, reason: 'scope-review' };
    } else {
      const orientation = await this.orientation(agent, loaded, request, guidance);
      if (orientation.outcome !== 'oriented' || orientation.session === null || orientation.invocation === null || orientation.ref === null) {
        return fresh(`The design orientation is unavailable: ${orientation.reason ?? 'no retained point'}`);
      }
      from = { session: orientation.session as SessionId, invocation: orientation.invocation, ref: orientation.ref, reason: 'design-orientation' };
    }
    const source = this.ports.session(from.session);
    if (source === undefined) return fresh('The captured review session is unavailable');
    if (!source.invocations.includes(from.invocation) || source.awaiting === from.invocation) throw new EvidenceUnavailableError(`${from.session} has not reached the end of ${from.invocation}`);
    const outcome = this.ports.effectiveInvocationOutcome(from.invocation);
    if (outcome?.session?.ref !== from.ref) return fresh('The captured review point is unavailable; using the ordinary review question');
    if (!await (await this.ports.operations(agent)).hasPoint(this.input.record.jobId, from.ref)) {
      if (from.reason === 'scope-review') return fresh('The captured assignment point is unavailable; reconstructing the complete scope review packet');
      return fresh('The recorded design orientation is unavailable');
    }
    const ended = this.events('invocation-ended').find(event => event.data.invocation === from.invocation)?.sequence ?? 0;
    const briefs = this.events('brief-appended')
      .filter(event => event.data.session === from.session && event.sequence < ended)
      .map(event => event.data.decision);
    return {
      start: { mode: 'fork', from: from.ref },
      fork: { from: { session: from.session, invocation: from.invocation }, reason: from.reason, briefs },
    };
  }

  private async orientation(agent: AgentPort, loaded: LoadedPackage, request: ReviewRequest, guidance: readonly CapturedInput[]): Promise<ReviewOrientation> {
    const key = request.forkPoint.kind === 'orientation' ? request.forkPoint.key : '';
    const recorded = this.recordedOrientation(key);
    if (recorded !== undefined) return recorded;
    if (this.events('review-orientation-recorded').some(event => event.data.key === key)) return {
      schema: 'ramify-agent.review-orientation/1', key, guidance: request.guidance, request: request.id,
      outcome: 'failed', session: null, invocation: null, ref: null, summary: null, reason: 'The recorded design orientation is unreadable',
    };
    let making = this.orienting.get(key);
    if (making === undefined) {
      making = this.orient(agent, loaded, request, key, guidance);
      this.orienting.set(key, making);
    }
    return await making;
  }

  private recordedOrientation(key: string): ReviewOrientation | undefined {
    if (this.events('review-orientation-recorded').every(event => event.data.key !== key)) return undefined;
    try {
      const parsed = reviewOrientationSchema.safeParse(this.ports.committedBody(reviewLayout.orientation(key)));
      return parsed.success ? parsed.data : undefined;
    } catch { return undefined; }
  }

  private async orient(agent: AgentPort, loaded: LoadedPackage, request: ReviewRequest, key: string, guidance: readonly CapturedInput[]): Promise<ReviewOrientation> {
    const policy = this.observe().policy.reviews!;
    const workspace = join(dirname(reviewLayout.orientation(key)), key.slice(0, 16));
    await mkdir(this.path(workspace), { recursive: true });
    // The orientation is its own invocation, built from its inputs by its
    // own constructor, which `step render` uses too.
    const step = constructDesignOrientationStep({
      schema: stepInputsSchemaId, role: 'reviewer', question: 'design-orientation', run: { planId: this.input.record.planId, runId: this.input.record.jobId },
      work: { workItem: request.workItem, iteration: request.key.iteration }, attempt: 1, capabilityWorkflow: this.workflow !== null,
      limits: this.observe().policy.limits, context: contextPolicyOf(this.observe().policy, 'reviewer'), request: request.id, key,
      guidance: guidance.map(({ ref, hash, text }) => ({ ref, hash, text })), workspace: { run: workspace }, bounds: { absoluteMs: policy.attemptMs },
      architectView: this.ports.coordination.architectViewInputs(), start: { kind: 'fresh' },
    }, { projectRoot: this.projectRoot, packages: new Map([['reviewer', loaded]]) });
    const result = await this.ports.runInvocation<OrientationSubmission>(agent, {
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
    if (!this.ports.closed()) {
      await this.ports.write({
        type: 'review-orientation-recorded',
        data: { key, request: request.id, invocation: orientation.invocation, session: orientation.session, outcome: orientation.outcome },
      }, [{ path: reviewLayout.orientation(key), id: key, revision: 1, body: orientation }]);
    }
    return orientation;
  }

  private async finishReview(
    request: ReviewRequest,
    attempt: Omit<ReviewAttempt, 'schema' | 'result' | 'settles' | 'checkFindings' | 'finishedAt'>,
    result: ReviewResult,
    settles: boolean,
    submission?: ReviewSubmission,
    bindings: readonly ConcernBinding[] = [],
  ): Promise<'committed' | 'fenced'> {
    return finishReview({ events: () => this.observe().history.events, commit: this.ports.commitFinding }, () => this.ports.now(), request, attempt, result, settles, submission, bindings);
  }

  async finishUnsettledReviews(
    why: (request: ReturnType<typeof unsettledRequests>[number], running: boolean) => { readonly reason: NotVerifiedReason; readonly detail: string },
    only?: readonly string[],
  ): Promise<string[]> {
    const finishedIds: string[] = [];
    for (const state of unsettledRequests(this.observe().history.events)) {
      if (only !== undefined && !only.includes(state.id)) continue;
      const body = this.ports.committedBody(reviewLayout.request(state.id));
      const parsed = reviewRequestSchema.safeParse(body);
      if (!parsed.success) {
        this.ports.warn(`Run ${this.input.record.jobId}: review request ${state.id} cannot be read, so it was left unsettled`);
        continue;
      }
      const accepted = await this.recoverAcceptedReview(parsed.data, state);
      if (accepted !== null) {
        if (accepted) finishedIds.push(state.attempts.at(-1)!.id);
        continue;
      }
      const open = state.attempts.find(entry => entry.started !== null && entry.finished === null);
      const { reason, detail } = why(state, open !== undefined);
      const attempt = open?.id ?? reviewAttemptId(state.id, state.attempts.length + 1);
      const outcome = await this.finishReview(parsed.data, {
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

  async settleReviews(): Promise<void> {
    if (this.observe().policy.reviews === undefined || this.reviews === undefined) return;
    this.reviews.wake();
    await this.reviews.settled();
  }

  private async settleWorkItemReviews(workItem: string): Promise<boolean> {
    const queue = this.reviews;
    if (this.observe().policy.reviews === undefined || queue === undefined) return !this.ports.ignoring();
    for (;;) {
      if (this.ports.ignoring()) return false;
      const ended = queue.changed();
      const stopped = this.ports.changed();
      if (unsettledRequests(this.observe().history.events).every(request => request.workItem !== workItem)) return true;
      queue.wake();
      await Promise.race([ended, stopped]);
    }
  }

  /** A failed candidate keeps its own review result before the repair handback. */
  async settleIterationReviews(iteration: string, candidate: string): Promise<boolean> {
    const queue = this.reviews;
    if (this.observe().policy.reviews === undefined || queue === undefined) return !this.ports.ignoring();
    for (;;) {
      if (this.ports.ignoring()) return false;
      const ended = queue.changed();
      const stopped = this.ports.changed();
      if (unsettledRequests(this.observe().history.events).every(request =>
        request.iteration !== iteration || request.candidate !== candidate)) return true;
      queue.wake();
      await Promise.race([ended, stopped]);
    }
  }

  private basisState(workItem: string): {
    readonly requests: BasisRequest[];
    readonly unsettled: string[];
    readonly attention: Map<CheckFindingId, AttentionEntry>;
    readonly revisions: Map<CheckFindingId, number>;
    readonly due: CheckFindingId[];
    readonly state: CheckFindingState;
  } {
    const requests: BasisRequest[] = [];
    const unsettled: string[] = [];
    for (const request of reviewStateOf(this.observe().history.events).values()) {
      if (request.workItem !== workItem) continue;
      const settling = request.attempts.find(attempt => attempt.id === request.settledBy)?.finished;
      if (request.settledBy === null || settling == null) unsettled.push(request.id);
      else requests.push({ request: request.id, attempt: request.settledBy, result: settling.result });
    }
    const state = this.observe().findings;
    const due: CheckFindingId[] = [];
    const attention = new Map<CheckFindingId, AttentionEntry>();
    for (const summary of this.ownerCheckFindings(state, workItem, 'attention', due)) {
      attention.set(summary.id, { revision: summary.revision, reason: summary.reason, awaiting: summary.awaiting, risk: summary.risk, modules: summary.modules });
    }
    const revisions = new Map(this.ownerCheckFindings(state, workItem, 'all').map(summary => [summary.id, summary.revision]));
    return { requests, unsettled, attention, revisions, due, state };
  }

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

  private latestCompletion(workItem: string): RunEventOf<'outline-revised'> | undefined {
    return this.events('outline-revised').filter(event => event.data.workItem === workItem && event.data.architectRef !== undefined).at(-1);
  }

  latestBasis(workItem: string): ReconciliationBasis | undefined {
    const started = this.events('reconciliation-started').filter(event => event.data.workItem === workItem).at(-1);
    if (started === undefined) return undefined;
    const parsed = reconciliationBasisSchema.safeParse(this.ports.committedBody(reconciliationLayout.basis(started.data.reconciliation)));
    return parsed.success ? parsed.data : undefined;
  }

  pendingCorrection(workItem: string): string | undefined {
    return pendingCorrection(this.observe().history, workItem);
  }

  /** A recorded architect choice acknowledges only the exact terminal review result it received. */
  private awaitingReviewDecision(workItem: string, requests: readonly BasisRequest[]): boolean {
    const decided = this.events('reconciliation-assessed').filter(event => event.data.workItem === workItem).flatMap(event => {
      const assessment = reconciliationAssessmentSchema.safeParse(this.ports.committedBody(reconciliationLayout.assessment(event.data.reconciliation)));
      if (!assessment.success || !['complete', 'unresolved', 'correct'].includes(assessment.data.next)) return [];
      const basis = reconciliationBasisSchema.safeParse(this.ports.committedBody(reconciliationLayout.basis(event.data.reconciliation)));
      return basis.success ? basis.data.requests : [];
    });
    return requests.some(request => request.result === 'not-verified' && !decided.some(prior =>
      prior.request === request.request && prior.attempt === request.attempt && prior.result === request.result));
  }

  async reconcileWorkItem(agent: AgentPort, loaded: LoadedPackage, item: WorkItem, parent: ParentSession,
    owner: ReconciliationOwner = { id: item.id, role: 'local-architect' }): Promise<Reconciled | null> {
    for (;;) {
      if (!await this.settleWorkItemReviews(owner.id)) return null;
      if (!await this.awaitUserDecisions(owner.id)) return null;
      // A committed correction remains the next action across interruption.
      // Its repair intent can remove findings from the attention set, but that
      // does not make the original completion request ready for its gate.
      const correction = this.pendingCorrection(owner.id);
      if (correction !== undefined) return { kind: 'correct', reconciliation: correction };
      const commit = this.ports.coordination.accepted();
      const captured = this.basisState(owner.id);
      const rounds = this.events('reconciliation-started').filter(event => event.data.workItem === owner.id).length;
      const gate = (decided: boolean): Reconciled => ({
        kind: 'gate',
        basis: { commit, requests: captured.requests, checkFindings: attentionAt(captured.attention), decided },
      });
      const reviewDecision = this.awaitingReviewDecision(owner.id, captured.requests);
      // A late unavailable result still needs the architect's choice even if
      // no reviewer finding exists. Reuse that choice across continuation.
      if (captured.attention.size === 0 && !reviewDecision) return gate(captured.requests.some(request => request.result === 'not-verified'));
      if (!reviewDecision && rounds > 0 && !needsLaterRound(captured.attention.values())) return gate(true);

      let tree: string;
      try {
        tree = await this.candidates.commitTree(this.projectRoot, commit);
      } catch (error) {
        await this.ports.fail('internal', `The audited source ${commit} of ${owner.id}'s reconciliation could not be read: ${message(error)}`);
        return null;
      }
      const basis = await this.startReconciliation(owner.id, rounds + 1, { commit, tree }, captured, owner.completion);
      if (basis === 'ended') return null;
      if (basis === 'stale') continue;
      const assessed = await this.assessReconciliation(agent, loaded, item, owner, basis, captured.attention, parent);
      if (assessed === null) return null;
      if (assessed.kind === 'refused') {
        await this.ports.write({ type: 'reconciliation-refused', data: { workItem: owner.id, reconciliation: basis.id, stage: 'assessment', reason: assessed.reason } });
        if (this.ports.ignoring()) return null;
        continue;
      }
      if (assessed.next === 'correct') return { kind: 'correct', reconciliation: basis.id };
      if (assessed.next === 'await-user') continue;
      const after = this.basisState(owner.id);
      return { kind: 'gate', basis: { commit, requests: after.requests, checkFindings: attentionAt(after.attention), decided: true } };
    }
  }

  private async startReconciliation(
    workItem: string,
    round: number,
    source: { readonly commit: string; readonly tree: string },
    captured: ReturnType<Acceptance['basisState']>,
    completion?: ReconciliationOwner['completion'],
  ): Promise<ReconciliationBasis | 'stale' | 'ended'> {
    const id = reconciliationId(workItem, round);
    const pinned = completion === undefined ? this.latestCompletion(workItem)?.data.architectRef : completion;
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
    return await this.ports.publish<ReconciliationBasis | 'stale' | 'ended'>(async () => {
      if (this.observe().terminal !== undefined) return { value: 'ended' as const };
      const now = this.basisState(workItem);
      const changed = this.ports.coordination.accepted() !== source.commit
        || basisChange(basis, { source, requests: now.requests, unsettled: now.unsettled, revisions: now.revisions }) !== null
        || attentionAt(now.attention).some(entry => !basis.checkFindings.some(held => held.checkFinding === entry.checkFinding))
        || this.events('reconciliation-started').some(event => event.data.reconciliation === id);
      if (changed) return { value: 'stale' as const };
      return { value: basis, transaction: {
        event: { type: 'reconciliation-started', data: { workItem, reconciliation: id, round } },
        records: [{ path: reconciliationLayout.basis(id), id, revision: 1, body: basis }],
      } };
    });
  }

  private async awaitUserDecisions(workItem: string): Promise<boolean> {
    for (;;) {
      if (this.ports.ignoring()) return false;
      // Registered before the state is read, so an answer in between still wakes it.
      const changed = this.ports.changed();
      const pending = [...this.observe().findings.findings.values()]
        .some(entry => sameWorkItem(entry.owner, workItem) && entry.pendingUserDecision !== null);
      if (!pending) return true;
      await changed;
    }
  }

  private async reconciliationStart(agent: AgentPort, basis: ReconciliationBasis, completion: { readonly session: SessionId; readonly invocation: string } | undefined): Promise<{
    readonly start: SessionStart;
    readonly fork?: ForkRelation | undefined;
    readonly degraded?: { readonly requested: 'fork'; readonly reason: string } | undefined;
  }> {
    const fresh = (reason: string) => ({ start: { mode: 'fresh' } as const, degraded: { requested: 'fork' as const, reason } });
    const point = basis.forkPoint;
    if (point.kind !== 'session') return fresh(point.kind === 'unavailable' ? point.reason : 'No point of the module architect was captured');
    if (completion === undefined) return fresh('No completion request of this work item is recorded');
    const from = { session: point.session as SessionId, invocation: completion.invocation };
    const source = this.ports.session(from.session);
    if (source === undefined) return fresh('The captured review session is unavailable');
    if (!source.invocations.includes(from.invocation) || source.awaiting === from.invocation) throw new EvidenceUnavailableError(`${from.session} has not reached the end of ${from.invocation}`);
    const outcome = this.ports.effectiveInvocationOutcome(from.invocation);
    if (outcome?.session?.ref !== point.ref) return fresh('The captured completion point is unavailable; using the ordinary reconciliation task');
    if (!await (await this.ports.operations(agent)).hasPoint(this.input.record.jobId, point.ref)) return fresh('The recorded completion session point is unavailable; reconstructing the complete reconciliation packet');
    const ended = this.events('invocation-ended').find(event => event.data.invocation === from.invocation)?.sequence ?? 0;
    const briefs = this.events('brief-appended')
      .filter(event => event.data.session === from.session && event.sequence < ended)
      .map(event => event.data.decision);
    return { start: { mode: 'fork', from: point.ref }, fork: { from, reason: 'reconciliation', briefs } };
  }

  private reconciliationPacket(item: WorkItem, owner: ReconciliationOwner, basis: ReconciliationBasis, state: CheckFindingState): ReconciliationPacket {
    const reviews = reviewStateOf(this.observe().history.events);
    const requests: PacketRequest[] = basis.requests.map(entry => {
      const request = reviews.get(entry.request);
      const attempt = entry.attempt === null ? undefined : reviewAttemptSchema.safeParse(this.ports.committedBody(reviewLayout.attempt(entry.attempt)));
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
    const ordinaryIterations = this.events('iteration-assigned').filter(event => event.data.workItem === owner.id).map(event => {
      const number = Number.parseInt(event.data.iteration.slice(event.data.iteration.lastIndexOf('.i') + 2), 10);
      const assignment = iterationAssignmentSchema.safeParse(this.ports.committedBody(iterationLayout.assignment(item.id, number)));
      const closed = this.events('iteration-closed').find(entry => entry.data.iteration === event.data.iteration);
      return { id: event.data.iteration, goal: assignment.success ? assignment.data.goal : '(its assignment could not be read)', outcome: closed?.data.outcome ?? null };
    });
    const taskIterations = owner.role !== 'capability-architect' ? [] : [...committedRecords(this.observe().history.lines).assignments.values()]
      .filter(entry => entry.coordination?.kind === 'capability-task' && entry.coordination.id === owner.id)
      .sort((a, b) => (a.coordination?.kind === 'capability-task' ? a.coordination.sequence : 0) -
        (b.coordination?.kind === 'capability-task' ? b.coordination.sequence : 0))
      .map(entry => ({ id: entry.id, goal: entry.goal,
        outcome: committedRecords(this.observe().history.lines).results.get(entry.id)?.outcome ?? null }));
    const earlier = this.events('reconciliation-assessed').filter(event => event.data.workItem === owner.id).flatMap(event => {
      const record = reconciliationAssessmentSchema.safeParse(this.ports.committedBody(reconciliationLayout.assessment(event.data.reconciliation)));
      return record.success ? [{ id: record.data.id, next: record.data.next, brief: record.data.submission.brief }] : [];
    });
    return {
      basis,
      originalBaseline: this.input.record.auditConfiguration && 'config' in this.input.record.auditConfiguration
        ? this.input.record.auditConfiguration.config.sourceCommit : null,
      module: item.module,
      owner: owner.role === 'capability-architect' ? 'capability task' : 'work item',
      ...(owner.role === 'capability-architect' ? { capabilityContext: { consumer: item.module, provider: owner.provider ?? 'unknown' } } : {}),
      requests,
      attention,
      others: this.ownerCheckFindings(state, owner.id, 'all').filter(summary => !inBasis.has(summary.id)),
      iterations: owner.role === 'capability-architect' ? taskIterations : ordinaryIterations,
      earlier,
      refused: this.events('reconciliation-refused').filter(event => event.data.workItem === owner.id)
        .map(event => ({ reconciliation: event.data.reconciliation, reason: event.data.reason })),
    };
  }

  private async assessReconciliation(
    agent: AgentPort,
    loaded: LoadedPackage,
    item: WorkItem,
    owner: ReconciliationOwner,
    basis: ReconciliationBasis,
    attention: ReadonlyMap<CheckFindingId, AttentionEntry>,
    parent: ParentSession,
  ): Promise<{ readonly kind: 'refused'; readonly reason: string } | { readonly kind: 'assessed'; readonly next: ReconciliationAssessment['next'] } | null> {
    const ordinaryCompletion = owner.completion === undefined ? this.latestCompletion(owner.id) : undefined;
    const completion = owner.completion ?? (ordinaryCompletion?.data.architectRef == null ? undefined
      : { session: ordinaryCompletion.data.architectRef.session, invocation: ordinaryCompletion.data.invocation });
    const start = await this.reconciliationStart(agent, basis, completion);
    const state = this.observe().findings;
    const held = new Map(this.ownerCheckFindings(state, owner.id, 'all').map(summary => [summary.id, summary.revision]));
    const evidence = await readAcceptedEvidence(this.input.directory, this.input.record.manifest, acceptedAnalysisReferences(this.observe().history.events));
    let invocation: string | undefined;
    let bound: BoundReconciliation | undefined;
    const result = await this.ports.runInvocation<ReconciliationSubmission>(agent, {
      role: owner.role,
      task: { kind: 'reconciliation', goal: item.goal, requirements: [JSON.stringify(basis)], modules: [item.module],
        literalSections: [{ key: 'support:work-item-package', text: (await this.ports.coordination.currentSelection(item.id))?.packageText
          ?? this.ports.coordination.planPackage(await this.ports.coordination.frozenCatalog(), [...item.requirementRefs, ...item.acceptanceRefs, ...item.contextRefs]) }] },
      work: owner.role === 'capability-architect' ? { capabilityTask: owner.id, request: owner.request } : { workItem: owner.id },
      attempt: basis.round,
      loaded,
      systemPrompt: renderReconciliationPrompt(loaded, this.projectRoot, parent.workingDirectory),
      prompt: reconciliationMessage(this.reconciliationPacket(item, owner, basis, state)),
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
          unstableTests: new Map([...attention.keys()].flatMap(id => {
            const finding = state.findings.get(id);
            const trees = finding?.reports.filter(report => report.observation.kind === 'audit-instability' && report.source.kind === 'tree')
              .map(report => report.source.id) ?? [];
            return trees.length > 0 ? [[id, { observedTree: trees[0]!, observedTrees: trees }] as const] : [];
          })),
          unavailableReviews: basis.requests.some(request => request.result === 'not-verified'),
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
            const now = this.basisState(owner.id);
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
    if (this.ports.ignoring()) return null;
    if (result.ended !== 'submitted' || result.value === undefined || bound === undefined || invocation === undefined) {
      return { kind: 'refused', reason: `The reconciliation fork${result.id === '' ? '' : ` ${result.id}`} ended without an assessment (${result.ended})` };
    }
    return await this.commitAssessment(agent, basis, {
      invocation,
      session: result.session,
      requestedStart: start.start.mode === 'fork' || start.degraded !== undefined ? 'fork' : 'fresh',
      actualStart: result.actual === undefined ? null : result.actual === 'fork' ? 'fork' : 'fresh',
      bound,
    }, parent);
  }

  private async commitAssessment(
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
      appended = await this.ports.effect<BriefAppend>({
        key: `brief:${basis.id}`,

        intent: () => {
          const decided = this.ports.decideFinding( () => {
            if (this.events('reconciliation-assessed').some(event => event.data.reconciliation === basis.id)) return { stale: `${basis.id} is already assessed` };
            const latest = this.events('reconciliation-started').filter(event => event.data.workItem === basis.workItem).at(-1);
            if (latest?.data.reconciliation !== basis.id) return { stale: `${basis.id} is not the work item's latest round` };
            const now = this.basisState(basis.workItem);
            const stale = this.ports.coordination.accepted() !== basis.source.commit
              ? `the accepted source is ${this.ports.coordination.accepted()}, not ${basis.source.commit}`
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
          }, this.ports.now());
          if (decided.kind === 'transaction') return decided.transaction;
          throw new AssessmentRefusedError(decided.kind === 'refused' ? decided.refusal.message : `${basis.id} decided nothing new`);
        },
        perform: key => this.appendReconciliationBrief(agent, key, parentRef, record!.brief),
        complete: result => ({
          event: { type: 'reconciliation-brief-appended', data: { reconciliation: basis.id, ...result } },
          records: [],
        }),
      });
    } catch (error) {
      if (error instanceof AssessmentRefusedError) return { kind: 'refused', reason: error.message };
      // The ledger measures a line before writing any of it.
      if (error instanceof RangeError) return { kind: 'refused', reason: `The assessment does not fit one ledger line: ${error.message}` };
      throw error;
    }
    await this.afterBriefAppend(basis.id, appended, record!.brief, parent);
    return { kind: 'assessed', next: record!.next };
  }

  async appendReconciliationBrief(agent: AgentPort, key: string, parent: ArchitectRef | null, brief: string): Promise<BriefAppend> {
    if (parent === null) return { session: null, ref: null, outcome: 'no-session', reason: 'The module architect\'s session was not kept after its completion request' };
    try {
      const answer = await (await this.ports.operations(agent)).append(parent.ref, key, brief);
      if (answer.outcome === 'session-lost') return { session: parent.session, ref: null, outcome: 'session-lost', reason: 'The module architect\'s session can no longer be read' };
      if (answer.outcome === 'conflict') return { session: parent.session, ref: null, outcome: 'failed', reason: `The module architect's session did not take the brief: ${answer.reason}` };
      return { session: parent.session, ref: answer.ref, outcome: answer.outcome, reason: null };
    } catch (error) {
      return { session: parent.session, ref: null, outcome: 'failed', reason: message(error) };
    }
  }

  private async afterBriefAppend(reconciliation: string, appended: BriefAppend, brief: string, parent: ParentSession): Promise<void> {
    if (appended.outcome === 'appended' || appended.outcome === 'already-present') {
      parent.ref = appended.ref ?? parent.ref;
      const session = appended.session;
      if (appended.outcome === 'appended' && session !== null) {
        await this.ports.recordAppend(session, { kind: 'note-appended', text: brief }, null)
          .catch(error => this.ports.warn(`Run ${this.input.record.jobId}: the brief of ${reconciliation} is missing from ${session}'s transcript: ${message(error)}`));
      }
      return;
    }
    parent.undelivered.push(reconciliation);
    if (appended.outcome === 'session-lost') {
      await this.ports.finishSession(parent.session, 'lost');
      parent.session = undefined;
      parent.ref = undefined;
    }
  }

  reconciliationBriefing(reconciliation: string, undelivered: readonly string[]): ReconciliationBriefing | undefined {
    const read = (id: string) => {
      const parsed = reconciliationAssessmentSchema.safeParse(this.ports.committedBody(reconciliationLayout.assessment(id)));
      return parsed.success ? parsed.data : undefined;
    };
    const record = read(reconciliation);
    if (record === undefined) return undefined;
    const state = this.observe().findings;
    const repairs = [...state.findings.values()]
      .filter(entry => entry.standing === 'open' && entry.repair?.kind === 'intent' && entry.repair.ref === reconciliation)
      .map(entry => ({ checkFinding: entry.id, title: entry.reports[0]?.observation.summary ?? '' }));
    const briefs = undelivered.flatMap(id => {
      const undeliveredRecord = read(id);
      return undeliveredRecord === undefined ? [] : [undeliveredRecord.brief];
    });
    const failure = this.events('reconciliation-brief-appended').filter(event => undelivered.includes(event.data.reconciliation)).at(-1);
    return {
      id: reconciliation,
      next: record.next,
      ...(record.submission.next.kind === 'correct' ? { goal: record.submission.next.goal } : {}),
      repairs,
      ...(briefs.length === 0 ? {} : { brief: briefs.join('\n\n') }),
      ...(failure === undefined ? {} : { appendFailure: `${failure.data.outcome}${failure.data.reason === null ? '' : `: ${failure.data.reason}`}` }),
    };
  }

  private capabilityBlockers(workItem: string): string[] {
    return capabilityBlockersOf(this.observe().history, workItem);
  }

  async completionBasisRefusal(owner: string, gate: GateAttempt, basis: CompletionBasis): Promise<string | null> {
    const lineage = basis.decided ? await this.sourceLineage(basis.commit, gate.audited) : null;
    const now = this.basisState(owner);
    if (this.awaitingReviewDecision(owner, now.requests)) return 'An unavailable advisory review requires the architect to choose continuation or relevant verification';
    const rounds = this.events('reconciliation-started').filter(event => event.data.workItem === owner).length;
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

  async completeWorkItem(item: WorkItem, gate: GateAttempt, basis: CompletionBasis): Promise<'completed' | 'ended' | { readonly refused: string }> {
    const outcome = await this.ports.publish<'completed' | 'ended' | { readonly refused: string }>(async () => {
      if (this.observe().terminal !== undefined) return { value: 'ended' as const };
      if (this.workflow !== null) {
        const blockers = this.capabilityBlockers(item.id);
        if (blockers.length > 0) return { value: { refused: blockers.join('; ') } };
      }
      const refusal = await this.completionBasisRefusal(item.id, gate, basis);
      if (refusal !== null) return { value: { refused: refusal } };
      const now = this.basisState(item.id);
      const unresolved = this.unresolvedOf(item.id, now.state);
      return { value: 'completed' as const, transaction: { event: {
        type: 'work-item-completed',
        data: { workItem: item.id, gate: gate.id, ...(unresolved.length === 0 ? {} : { unresolved }) },
      }, records: [] } };
    });
    if (typeof outcome === 'object') {
      await this.ports.write({ type: 'reconciliation-refused', data: { workItem: item.id, reconciliation: this.latestBasis(item.id)?.id ?? null, stage: 'completion', reason: outcome.refused } });
    }
    return outcome;
  }

  unresolvedOf(workItem: string, state: CheckFindingState): Array<{ readonly checkFinding: CheckFindingId; readonly reason: UnresolvedReason }> {
    const last = this.latestBasis(workItem);
    const inLast = new Set(last?.checkFindings.map(entry => entry.checkFinding) ?? []);
    return this.ownerCheckFindings(state, workItem, 'all').filter(summary => summary.standing === 'open').map(summary => ({
      checkFinding: summary.id,
      reason: !inLast.has(summary.id) ? 'raised-after-last-round' as const : 'left-open' as const,
    }));
  }

  private async sourceLineage(from: string, to: string | null): Promise<string | null> {
    if (to === null) return `the gate audited no commit, and the reconciled source is ${from}`;
    if (to === from) return null;
    try {
      const changes = await this.candidates.diffNameStatus(this.projectRoot, from, to);
      const tracked = trackedScenarios(this.observe().history.lines);
      const expected = new Map(expectedFeatureHashes(expectedFeatureFiles(tracked, { planId: this.input.record.planId, runId: this.input.record.jobId }))
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

  async qualifyFinal(agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>): Promise<void> {
    while (!this.ports.ignoring()) {
      const binding = await this.assessNonfunctional(agent, packages);
      if (binding === null || this.ports.ignoring()) return;
      try {
        if (!await this.recordNonfunctionalDeviations(binding) || this.ports.ignoring()) return;
        const failed = await this.finalGate(agent, packages, binding);
        if (failed === undefined || this.ports.ignoring()) return;
        if (!await this.planFinalCorrection(agent, packages, binding, failed)) return;
        const baseline = await this.ports.coordination.baselineSnapshot();
        if (baseline === null) throw new Error('Final correction requires the retained run baseline');
        if (!await this.ports.coordination.takeWorkItems(agent, packages, baseline) || this.ports.ignoring()) return;
        await this.settleReviews();
      }
      catch (error) {
        if (!(error instanceof CandidateReassessmentRequired)) throw error;
        const replay = replayNonfunctionalPhase(this.observe().history.lines,
          assessedElements(await this.ports.coordination.frozenCatalog()), this.observe().policy.limits.nonfunctionalRoundsPerPlan ?? 3);
        const observed = await this.ports.previewCandidateTree();
        if (!replay.ok || !replay.value.final || replay.value.final.assessment.id !== binding.assessment.id
          || observed.tree === binding.assessment.candidate.tree) {
          await this.ports.fail('inputs-changed', 'Final reassessment requires the retained assessment and a changed candidate'); return;
        }
        const spent = replay.value.input.closedRounds.length;
        await this.ports.write({ type: 'nonfunctional-final-invalidated', data: {
          round: spent,
          candidate: binding.candidateId, assessment: binding.assessment.id, tree: observed.tree,
        } });
      }
    }
  }

  /** Judge retained final-audit reliability evidence on the exact joined candidate. */
  private async reconcileFinalInstability(agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>,
    gate: GateAttempt, binding: { candidateId: string; assessment: Assessment }): Promise<ReconciliationSubmission['next']['kind'] | null> {
    const prior = this.events('final-instability-reconciled').find(event => event.data.gate === gate.id);
    if (prior !== undefined) return prior.data.next;
    const state = this.observe().findings;
    const held = new Map([...state.findings.values()].filter(entry => entry.reports.some(report => report.observation.kind === 'audit-instability'))
      .map(entry => [entry.id, entry.revision] as const));
    const details = [...held.keys()].flatMap(id => {
      const selected = selectCheckFindings(state, { kind: 'detail', checkFinding: id });
      return selected.ok && selected.view.kind === 'detail' ? [selected.view] : [];
    });
    const attention = details.filter(detail => detail.summary.standing === 'open'
      && detail.summary.verification.kind === 'assessment' && state.findings.get(detail.summary.id)?.reports.some(report => report.observation.kind === 'audit-instability'));
    if (attention.length === 0) return 'complete';
    if (gate.audited === null) {
      await this.ports.fail('acceptance-incomplete', `Final audit ${gate.id} has instability without retained audited source`, [runLayout.gate(gate.id)]);
      return null;
    }
    const loaded = packages.get('local-architect');
    if (loaded === undefined) throw new Error('Final instability reconciliation requires the architect reconciliation package');
    const id = `final-instability-${gate.id}`;
    const source = { kind: 'tree' as const, id: binding.assessment.candidate.tree };
    const entries = new Map<CheckFindingId, AttentionEntry>(attention.map(detail => [detail.summary.id, {
      revision: detail.summary.revision, reason: detail.summary.reason, awaiting: detail.summary.awaiting,
      risk: detail.summary.risk, modules: detail.summary.modules,
    }]));
    const unstableTests = new Map(attention.map(detail => {
      const trees = state.findings.get(detail.summary.id)?.reports.filter(report => report.observation.kind === 'audit-instability' && report.source.kind === 'tree')
        .map(report => report.source.id) ?? [];
      return [detail.summary.id, { observedTree: trees[0] ?? source.id, observedTrees: trees }] as const;
    }));
    const listed = await this.candidates.treeEntries(this.projectRoot, gate.audited);
    const snapshotEntries = new Map(listed.map(entry => [entry.path, entry]));
    const snapshotDirectories = new Set(['']);
    for (const path of snapshotEntries.keys()) for (let directory = posix.dirname(path);
      directory !== '.' && !snapshotDirectories.has(directory); directory = posix.dirname(directory)) snapshotDirectories.add(directory);
    const snapshot: CandidateSnapshot = { commit: gate.audited, base: this.ports.recordedRunBase() ?? gate.audited,
      tree: source.id, entries: snapshotEntries, directories: snapshotDirectories, changes: [] };
    const baseline = this.input.record.auditConfiguration && 'config' in this.input.record.auditConfiguration
      ? this.input.record.auditConfiguration.config.sourceCommit : null;
    const prompt = reconciliationFactsMessage({ id, owner: 'final qualification', round: 1,
      source: { commit: gate.audited, tree: source.id }, originalBaseline: baseline,
      introduction: `# Reconciliation ${id} of final audit ${gate.id}\n\nThe configured audit verdict remains authoritative. Inspect individual test origin and coverage; do not edit source in this assessment.`,
      authority: 'You may judge origin and plan a required correction. An existing unstable test creates no repair assignment; a failed required audit still blocks completion. Do not waive an added-test reliability obligation or a strict audit failure.',
      context: `Final configured audit: ${gate.verdict}. Evidence: ${runLayout.gate(gate.id)}. The semantic assessment is ${runLayout.assessment(binding.assessment.id)} on this same candidate.`,
      requests: [], attention, others: details.filter(detail => !entries.has(detail.summary.id)).map(detail => detail.summary),
      iterations: [], earlier: [], refused: [],
    });
    let invocation = 'none';
    let bound: BoundReconciliation | undefined;
    const validate = async (input: unknown) => {
      const checked = await validateReconciliationForExecution(input, { id, owner: this.input.record.jobId,
        attention: entries, unstableTests, held, actor: { kind: 'agent', role: 'local-architect', invocation }, source,
        authority: { kind: 'governing-record', ref: runLayout.documentManifest }, responsible: { kind: 'run' },
        waiverRefusal: () => gate.verdict === 'passed' ? null : 'a failed final audit cannot be waived',
        evidence: submission => [{ kind: 'reconciliation-submission', ref: runLayout.submission(invocation),
          hash: `sha256:${sha256(canonicalJson(submission))}` }],
        document: async path => {
          try {
            const entry = (await this.candidates.treeEntries(this.projectRoot, gate.audited!)).find(item => item.path === path);
            if (!entry) return null;
            return { text: new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(
              await readVerifiedTextBlobBytes(this.projectRoot, gate.audited!, entry, this.candidates)), revision: gate.audited! };
          } catch { return null; }
        },
        decide: command => {
          const change = decideCheckFindingChange(this.observe().findings, command);
          return change.ok ? null : change.rejection;
        },
      });
      if (checked.ok) bound = checked.value;
      return checked.ok ? { ok: true as const, value: checked.value.submission } : checked;
    };
    let accepted: { id: string; value: ReconciliationSubmission } | undefined;
    for (const start of this.events('invocation-started').filter(event => event.data.work.request === id)) {
      const end = this.events('invocation-ended').find(event => event.data.invocation === start.data.invocation);
      if (end?.data.ended !== 'submitted' || end.data.submission === null) continue;
      const bytes = await readIfExists(this.path(runLayout.submission(start.data.invocation)));
      if (bytes === undefined || sha256(bytes) !== end.data.submission) throw new Error(`Retained final instability submission ${start.data.invocation} is unavailable`);
      const { schema: _schema, ...body } = JSON.parse(bytes.toString('utf8')) as Record<string, unknown>;
      invocation = start.data.invocation;
      const checked = await validate(body);
      if (!checked.ok) throw new Error(`Retained final instability judgment ${invocation} no longer validates: ${checked.errors.map(error => error.message).join('; ')}`);
      accepted = { id: invocation, value: checked.value };
    }
    if (accepted === undefined) {
      const result = await this.ports.runInvocation<ReconciliationSubmission>(agent, {
      role: 'local-architect', work: { request: id }, task: { kind: 'reconciliation', goal: `Judge final audit instability on ${source.id}`,
        requirements: [runLayout.gate(gate.id)], literalSections: [{ key: 'support:final-instability-source', text: JSON.stringify({
          commit: gate.audited, tree: source.id, originalBaseline: baseline, evidence: runLayout.gate(gate.id),
        }) }] },
      attempt: this.events('invocation-started').filter(event => event.data.work.request === id).length + 1,
      loaded, systemPrompt: renderReconciliationPrompt(loaded, this.projectRoot, this.projectRoot), prompt,
      start: { mode: 'fresh' }, keep: () => finished('not-kept'), scope: { write: null, measurement: null, size: null }, writer: true,
      toolName: reconciliationToolName, description: reconciliationSubmissionDescription, inputSchema: reconciliationJsonSchema,
      submissionSchema: 'ramify-agent.reconciliation-submission/1',
      validate,
      equip: session => this.nonfunctionalTools(session, boundedNonfunctionalTools({ source: this.candidates,
        projectRoot: this.projectRoot, candidate: gate.audited!, base: snapshot.base,
        snapshot, scope: undefined })),
      onStarted: async id => { invocation = id; },
      });
      if (result.ended !== 'submitted' || result.value === undefined || bound === undefined) {
        await this.ports.fail('agent-failed', `Final instability reconciliation ended ${result.ended} without an accepted judgment`, [runLayout.gate(gate.id)]);
        return null;
      }
      accepted = { id: result.id, value: result.value };
    }
    if (bound === undefined) throw new Error(`Final instability judgment ${accepted.id} has no bound decisions`);
    if ((await this.ports.previewCandidateTree()).tree !== source.id) {
      await this.ports.fail('inputs-changed', `Final instability judgment ${accepted.id} no longer describes the prepared candidate`, [runLayout.gate(gate.id)]);
      return null;
    }
    const commands = bound.commands;
    const committed = await this.ports.commitFinding(({ state: current }) => {
      if (this.events('final-instability-reconciled').some(event => event.data.gate === gate.id)) return { stale: `${id} already committed` };
      if (current.applied !== state.applied) return { stale: `${id} findings changed` };
      return { commands: commands.length ? [{ type: 'assess', commands: [...commands] }] : [], compose: decided => ({
        event: { type: 'final-instability-reconciled', data: { gate: gate.id, candidate: binding.candidateId,
          invocation: accepted.id, next: accepted.value.next.kind, checkFindings: [...decided.events] } },
      }) };
    }, this.ports.now());
    if (committed.kind !== 'committed') throw new Error(`Final instability reconciliation ${id} was not retained`);
    this.ports.notify();
    return accepted.value.next.kind;
  }

  private async planFinalCorrection(agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>,
    binding: { candidateId: string; assessment: Assessment }, gate: GateAttempt): Promise<boolean> {
    if (this.events('final-correction-planned').some(event => event.data.gate === gate.id)) return true;
    const loaded = packages.get('global-fork');
    if (loaded === undefined) throw new Error('Final correction requires the plan architect package');
    const request = `final-correction-${gate.id}`;
    const diagnostics = await this.diagnosticsOf(gate, 'local-architect');
    const earlier = this.events('invocation-started').filter(event => event.data.work.request === request);
    let accepted: { id: string; value: FinalCorrection } | undefined;
    // Accepted decisions survive an interruption before their work item is recorded.
    for (const start of earlier) {
      const end = this.events('invocation-ended').find(event => event.data.invocation === start.data.invocation);
      if (end?.data.ended !== 'submitted' || end.data.submission === null) continue;
      const bytes = await readIfExists(this.path(runLayout.submission(start.data.invocation)));
      if (bytes === undefined || sha256(bytes) !== end.data.submission) throw new Error('Final correction submission is unavailable');
      const { schema: _schema, ...body } = JSON.parse(bytes.toString('utf8')) as Record<string, unknown>;
      accepted = { id: start.data.invocation, value: finalCorrectionSchema.parse(body) };
    }
    let priorUnfinished: string | undefined;
    while (accepted === undefined) {
      if (this.ports.ignoring()) return false;
      const result = await this.ports.runInvocation<FinalCorrection>(agent, {
        role: 'global-fork', work: { request }, task: { kind: 'final-correction', goal: `Resolve final verification ${gate.id}`,
          requirements: [`Inspect the retained audit and instability evidence at ${this.path(runLayout.gate(gate.id))} and select the responsible module and next correction goal. Preserve accepted work and verify the corrected candidate.`] },
        attempt: this.events('invocation-started').filter(event => event.data.work.request === request).length + 1, loaded,
        systemPrompt: renderGlobalForkPrompt(loaded, this.projectRoot),
        prompt: [
          `Final verification ${gate.id} is ${gate.verdict}; a required reliability correction may remain even when the configured audit passed with warnings. The plan remains unfinished; accepted work is retained.`,
          `For this turn, use submit_final_correction to choose the module architect and goal for the next correction; its supplied schema defines this task's answer.`,
          'Investigate the actual diagnostics. Explain why the next approach should help; repeated failure requires reconsideration, not abandonment.',
          'An environment or verification issue may need investigation before source changes. Delegate that investigation as the goal where appropriate.',
          `Gate evidence: ${this.path(runLayout.gate(gate.id))}`,
          ...diagnostics.summary,
          ...(priorUnfinished === undefined ? [] : [priorUnfinished]),
          this.ports.coordination.planPackage(await this.ports.coordination.frozenCatalog()),
        ].join('\n\n'),
        start: { mode: 'fresh' }, keep: () => finished('work-closed'),
        toolName: 'submit_final_correction', description: 'Choose the responsible module architect and correction goal after failed final verification.',
        inputSchema: z.toJSONSchema(finalCorrectionSchema) as JsonSchema,
        submissionSchema: 'ramify-agent.final-correction/1', validate: input => validateAgainst(finalCorrectionSchema, input),
        scope: { write: null, measurement: null, size: null }, writer: true,
        equip: session => ({ ...this.nonfunctionalTools(session, []),
          builtinTools: ['read', 'write', 'edit', 'grep', 'find', 'ls'] }),
      });
      if (this.ports.ignoring()) return false;
      if (result.ended !== 'submitted' || result.value === undefined) {
        priorUnfinished = `The previous decision turn ended ${result.ended} without an accepted answer. Review ${this.path(runLayout.outcome(result.id))}, retain the existing work, and supply the next correction decision through submit_final_correction.`;
        continue;
      }
      accepted = { id: result.id, value: result.value };
    }
    if (this.ports.ignoring()) return false;
    const records = committedRecords(this.observe().history.lines);
    const item = workItemSchema.parse({ schema: 'ramify-agent.work-item/1', id: workItemId(records.workItems.length + 1),
      module: accepted.value.module, origin: { finalVerification: gate.id },
      goal: [accepted.value.goal, accepted.value.rationale, `Final verification: ${this.path(runLayout.gate(gate.id))}`, ...diagnostics.summary].join('\n\n'),
      requirementRefs: [], acceptanceRefs: [], contextRefs: [], startedFor: null,
    });
    await this.ports.write({ type: 'final-correction-planned', data: { gate: gate.id, invocation: accepted.id,
      workItem: item.id, candidate: binding.candidateId, assessment: binding.assessment.id, round: binding.assessment.round } },
    [{ path: workLayout.item(item.id), id: item.id, revision: 1, body: item }]);
    return !this.ports.ignoring();
  }

  private async prepareNonfunctionalCandidate(): Promise<{ id: string; candidate: Candidate } | null> {
    this.ports.requireSettled('A non-functional candidate cannot be prepared');
    const changed = await documentChanges(this.projectRoot, this.input.record.planId, this.input.directory, this.input.record.manifest);
    if (changed.length > 0) {
      await this.ports.fail('inputs-changed', `The captured plan evidence changed before assessment: ${changed.join('; ')}`, [runLayout.documentManifest]);
      return null;
    }
    await this.gates.rerenderScenarios();
    const preview = await this.ports.previewCandidateTree();
    const id = `cand-${String(this.events('candidate-prepared').length + 1).padStart(3, '0')}`;
    const candidate = { tree: preview.tree, head: preview.head, preparedAt: this.ports.now().toISOString() };
    const body = preparedCandidateSchema.parse({
      schema: 'ramify-agent.prepared-candidate/1', candidate,
      scenarioRenderingHash: sha256(canonicalJson(this.gates.expectedFeatures())), writerSettled: true,
    });
    await this.ports.write({ type: 'candidate-prepared', data: { candidate: id, tree: candidate.tree } }, [
      { path: runLayout.candidate(id), id, revision: 1, body },
    ]);
    await this.ports.afterWrite('candidate-prepared', this.input.record.jobId);
    return { id, candidate };
  }

  private async assessNonfunctional(
    agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>,
  ): Promise<{ candidateId: string; assessment: Assessment } | null> {
    const evidence = await readAcceptedEvidence(this.input.directory, this.input.record.manifest, acceptedAnalysisReferences(this.observe().history.events));
    if (evidence.status === 'unavailable') {
      await this.ports.fail('analysis-invalid', `The fixed non-functional catalog is unavailable: ${evidence.reason}`);
      return null;
    }
    const accepted = this.event('analysis-accepted');
    const catalogHash = accepted?.data.evidence.catalog.hash;
    if (catalogHash === undefined) {
      await this.ports.fail('analysis-invalid', 'The fixed non-functional catalog has no accepted hash');
      return null;
    }
    const marker = this.event('nonfunctional-phase-started');
    if (!marker) {
      await this.ports.write({ type: 'nonfunctional-phase-started', data: { catalogHash, maxRounds: 3 } });
      await this.ports.afterWrite('nonfunctional-phase-started', this.input.record.jobId);
    }
    const nfrIds = assessedElements(evidence.catalog);
    for (;;) {
      if (this.ports.ignoring()) return null;
      const replay = replayNonfunctionalPhase(this.observe().history.lines, nfrIds, marker?.data.maxRounds ?? 3);
      if (!replay.ok) {
        await this.ports.fail('recovery-exhausted', `Committed non-functional phase is unavailable: ${replay.reason}`);
        return null;
      }
      const state = replay.value;
      const decision = decideNonfunctionalRound(state.input);
      if (decision.action === 'stop') {
        if (state.final === null) {
          await this.ports.fail('recovery-exhausted', 'The closed non-functional phase has no final assessment');
          return null;
        }
        return { candidateId: state.final.candidateId, assessment: state.final.assessment };
      }
      if (decision.action === 'unavailable') {
        await this.ports.fail('recovery-exhausted', 'No matching non-functional evidence was obtained within the captured bound');
        return null;
      }
      if (decision.action === 'prepare-candidate') {
        if (await this.prepareNonfunctionalCandidate() === null) return null;
        continue;
      }
      if (decision.action === 'assess') {
        const candidate = state.input.candidate;
        if (candidate === null || state.candidateId === null) throw new Error('assessment lacks prepared candidate');
        const prepared = { id: state.candidateId, candidate };
        if (!await this.qualifyNonfunctionalCandidate(agent, packages, evidence, prepared, decision.round, decision.phase)) return null;
        continue;
      }
      if (decision.action === 'investigate' || decision.action === 'repair-or-close') {
        if (state.input.candidate === null || state.assessment === null) throw new Error('action lacks assessed candidate');
        if (state.assignment !== null) {
          if (!await this.resumeNonfunctionalRepair(agent, packages, evidence.catalog, state.assignment)) return null;
          continue;
        }
        const action = await this.nonfunctionalAction(agent, packages, evidence.catalog,
          state.input.candidate, state.assessment, decision, state.investigatedNfrs);
        if (action === null) return null;
        if (action.value.kind === 'investigate') {
          if (!await this.nonfunctionalInvestigation(agent, packages, state.assessment, action.value)) return null;
          continue;
        }
        if (action.value.kind === 'repair') {
          if (state.candidateId === null || !await this.nonfunctionalRepair(agent, packages, evidence.catalog,
            state.assessment, state.candidateId, action.value)) return null;
          continue;
        }
        await this.closeNonfunctionalRound(state, 'exhausted', action.invocation);
        continue;
      }
      if (decision.action === 'close') {
        if (decision.unresolved.length > 0) {
          if (state.input.candidate === null || state.assessment === null) throw new Error('closure lacks assessed candidate');
          const action = await this.nonfunctionalAction(agent, packages, evidence.catalog,
            state.input.candidate, state.assessment, decision, state.investigatedNfrs);
          if (action === null) return null;
          if (action.value.kind !== 'close') throw new Error('Closed repaired round received an action other than close');
          await this.closeNonfunctionalRound(state, decision.outcome, action.invocation);
        } else {
          await this.closeNonfunctionalRound(state, decision.outcome);
        }
        continue;
      }
    }
  }

  private async recordNonfunctionalDeviations(
    binding: { candidateId: string; assessment: Assessment },
  ): Promise<boolean> {
    const unavailable = async (reason: string, refs: string[] = []): Promise<false> => {
      await this.ports.fail('recovery-exhausted', `Non-functional deviation evidence is unavailable: ${reason}`, refs);
      return false;
    };
    const evidence = await readAcceptedEvidence(this.input.directory, this.input.record.manifest, acceptedAnalysisReferences(this.observe().history.events));
    if (evidence.status === 'unavailable') return unavailable(evidence.reason);
    const changed = await documentChanges(this.projectRoot, this.input.record.planId, this.input.directory, this.input.record.manifest);
    if (changed.length > 0) {
      await this.ports.fail('inputs-changed', `Captured plan evidence changed before non-functional deviation review: ${changed.join('; ')}`,
        [runLayout.documentManifest]);
      return false;
    }
    const nfrIds = assessedElements(evidence.catalog);
    const replay = replayNonfunctionalPhase(this.observe().history.lines, nfrIds, this.observe().policy.limits.nonfunctionalRoundsPerPlan ?? 3);
    if (!replay.ok) return unavailable(replay.reason);
    const decision = decideNonfunctionalRound(replay.value.input);
    if (decision.action !== 'stop' || replay.value.final?.candidateId !== binding.candidateId
      || replay.value.final.assessment.id !== binding.assessment.id
      || replay.value.final.candidate.tree !== binding.assessment.candidate.tree) {
      return unavailable('The final closed assessment does not match the candidate sent to the gate');
    }
    if (decision.outcome === 'satisfied') return true;
    if (decision.outcome !== 'exhausted') return unavailable(`The final round ended ${decision.outcome}`);
    const closed = this.events('nonfunctional-round-closed').at(-1);
    const actionId = closed?.data.actionInvocation;
    if (closed?.data.outcome !== 'exhausted' || !actionId) return unavailable('Exhaustion has no accepted coordinator close action');
    const start = this.events('invocation-started').filter(event => event.data.invocation === actionId
      && event.data.role === 'nonfunctional-coordinator');
    const ended = this.events('invocation-ended').filter(event => event.data.invocation === actionId);
    if (start.length !== 1 || ended.length !== 1 || start[0]!.sequence >= ended[0]!.sequence
      || start[0]!.data.session !== ended[0]!.data.session || ended[0]!.data.ended !== 'submitted') {
      return unavailable('The close action has no accepted coordinator invocation', [runLayout.submission(actionId)]);
    }
    const outcome = invocationOutcomeSchema.safeParse(this.ports.committedBody(runLayout.outcome(actionId)));
    const raw = await readIfExists(this.path(runLayout.submission(actionId)));
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
    const preview = await this.ports.previewCandidateTree();
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
        ...this.events('nonfunctional-final-invalidated').map(event => event.data.assessment),
        ...this.events('final-correction-planned').map(event => event.data.assessment),
      ]);
      const history = this.events('nonfunctional-deviation-recorded').filter(event => event.data.nfr === result.nfr);
      const previous = history.filter(event => event.data.assessment === binding.assessment.id);
      if (previous.length > 1 || history.some(event => event.data.assessment !== binding.assessment.id
        && !invalidated.has(event.data.assessment))) {
        return unavailable(`NFR ${result.nfr} has a conflicting recorded deviation`);
      }
      if (previous.length === 1) {
        const event = previous[0]!;
        const recorded = nonfunctionalDeviationSchema.safeParse(this.ports.committedBody(runLayout.nonfunctionalDeviation(event.data.deviation)));
        const expected = prepareNonfunctionalDeviation({ id: event.data.deviation, checkFinding: event.data.checkFinding,
          item, assessment: binding.assessment, result,
          candidate: binding.assessment.candidate, coordinatorInvocation: binding.assessment.coordinatorInvocation,
          proposedAlternative: choice.proposedAlternative ?? '', uncertainty: choice.uncertainty });
        const finding = this.observe().findings.findings.get(event.data.checkFinding);
        if (!recorded.success || !expected.ok || canonicalJson(recorded.data) !== canonicalJson(expected.record)
          || finding?.reports[0]?.judgment?.ground?.hash !== nonfunctionalDeviationHash(recorded.data)
          || finding.reports[0].observation.kind !== 'plan-deviation'
          || finding.decisions[0]?.decision.action !== 'request-user-decision') {
          return unavailable(`Previously recorded deviation for ${result.nfr} cannot be verified`);
        }
        continue;
      }
      const version = this.observe().version;
      const id = `nfd-${String(this.events('nonfunctional-deviation-recorded').length + 1).padStart(3, '0')}`;
      const committed = await this.ports.commitFinding( ({ state }) => {
        if (this.observe().version !== version || this.observe().terminal !== undefined) return { stale: 'The assessed candidate moved before deviation recording' };
        if (this.events('nonfunctional-deviation-recorded').some(event => event.data.nfr === result.nfr
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
      }, this.ports.now());
      if (committed.kind !== 'committed') return unavailable(`Could not record deviation ${id}: ${committed.kind === 'refused' ? committed.refusal.message : 'already replayed'}`);
      this.ports.notify();
    }
    return true;
  }

  private async closeNonfunctionalRound(
    state: import('./nonfunctional-phase.js').CommittedNonfunctionalPhase,
    outcome: 'satisfied' | 'continue' | 'exhausted', actionInvocation?: string,
  ): Promise<void> {
    const number = state.input.closedRounds.length + 1;
    const initial = state.input.initial;
    if (initial === null || state.candidateId === null) throw new Error('round closure lacks candidate-bound initial evidence');
    const id = `nfr-round-${String(number).padStart(3, '0')}`;
    const record = roundSchema.parse({ schema: 'ramify-agent.nonfunctional-round/1', number,
      initial: initial.id, investigation: state.investigationInvocations.at(-1) ?? null,
      repair: state.repair?.assignment ?? null, reassessment: state.input.reassessment?.id ?? null, outcome });
    await this.ports.write({ type: 'nonfunctional-round-closed', data: { round: number, record: id, outcome,
      ...(actionInvocation === undefined ? {} : { actionInvocation }),
    } }, [
      { path: runLayout.nonfunctionalRound(number), id, revision: 1, body: record },
    ]);
  }

  private async nonfunctionalSourceInputs(candidate: Candidate, scope: readonly string[] = ['.'], workspace = false, previous?: Assessment) {
    const base = this.ports.coordination.accepted();
    const runStart = this.ports.recordedRunBase();
    const comparisons: SnapshotComparison[] = [];
    for (const [name, boundary] of [['run-start', runStart], ['accepted-boundary', base], ['previous-assessment', previous?.candidate.tree]] as const) {
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
    const records = committedRecords(this.observe().history.lines);
    for (const result of records.results.values()) {
      if (result.outcome !== 'accepted') continue;
      const assignment = records.assignments.get(result.iteration);
      if (assignment === undefined) continue;
      const assigned = this.ports.coordination.assignmentStartingPoints(assignment);
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
      ]) }, assigned, await this.ports.coordination.engineerStartingPoints(assignment, result));
    }
    const discoveries = startingPointsSection(workspace ? groups.map(group => ({ ...group,
      points: group.points?.filter(point => resolveSnapshotPath(snapshot, point.path).ok) })) : groups,
      { projectRoot: this.projectRoot, ...(workspace ? {} : { snapshot }), allows: path => nonfunctionalSourceAllows(path, scope) });
    const sourceSection = { key: 'support:nonfunctional-source', text: JSON.stringify({ head: candidate.head, tree: candidate.tree,
      defaultComparison: comparisons[0]!.name,
      comparisons: comparisons.map(({ changes, ...comparison }) => ({ ...comparison, changedPaths: changes })),
      originalSource: this.input.record.manifest.source,
      comparisonLimit: 'Named comparisons cover net changes at their recorded Git boundaries, not every intermediate edit or affected caller. An empty diff establishes no historical preservation. Dirty original capture excludes uncommitted starting bytes from the starting commit comparison.',
      projectRoot: this.projectRoot, runDirectory: this.input.directory, snapshotScope: scope,
      evidenceAccess: 'Use ordinary read/search tools and shell for Git history, audit refs, generated views and run records. Scope identifies starting points, not an access restriction. Read referenced artifacts where they actually live.',
      authority: 'Prepared candidate source is authoritative. Starting points, prior completion claims and green audits do not establish satisfaction. Assess all supplied fixed/NFR obligations independently and inspect relevant source and execution evidence. Bind historical claims to their recorded revisions; live files or generated views may describe another revision.' }) };
    return { sections: [sourceSection, ...(discoveries === undefined ? [] : [discoveries])], snapshot, comparisons };
  }

  private nonfunctionalTools(session: EquipContext, tools: readonly ToolDefinition[]): Equipment {
    return nonfunctionalEquipment({ projectRoot: this.projectRoot, snapshotTools: tools,
      commandExecution: this.options.commandExecution,
      registerProcessGroup: async (pid, identity) => {
        const committed = await this.ports.write({ type: 'writer-process-registered', data: { invocation: session.invocation, pid, identity } });
        if (committed === 'ended') throw new Error(`Run ${this.input.record.jobId} ended before process group ${pid} was registered`);
        this.ports.registerWriter(session.invocation, pid);
        await this.ports.afterWrite('writer-process-registered', this.input.record.jobId);
      },
      commandTimeoutMs: this.observe().policy.limits.commandTimeoutMs,
      rejectedToolInputsPerTurn: this.observe().policy.limits.rejectedToolInputsPerTurn,
      outputFile: call => this.path(runLayout.shellOutput(session.invocation, call)),
    }, session);
  }

  private async nonfunctionalAction(
    agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>, catalog: ElementCatalog,
    candidate: Candidate, assessment: Assessment, decision: RoundDecision,
    investigatedNfrs: readonly string[],
  ): Promise<{ value: CoordinatorAction; invocation: string } | null> {
    if (decision.action !== 'investigate' && decision.action !== 'repair-or-close' && decision.action !== 'close') {
      throw new Error(`A coordinator action cannot answer ${decision.action}`);
    }
    const loaded = packages.get('nonfunctional-coordinator');
    if (loaded === undefined) throw new Error('Non-functional coordinator package is unavailable');
    const unresolved = assessment.results.filter(item => item.result !== 'satisfied').map(item => item.nfr);
    const index = await this.ports.refreshIndex();
    const context = { decision, results: assessment.results, investigatedNfrs,
      moduleNames: [...(index?.modules.keys() ?? [])] };
    const investigationPaths = this.events('nonfunctional-investigated')
      .filter(event => event.data.assessment === assessment.id && event.data.round === assessment.round)
      .map(event => this.path(runLayout.submission(event.data.invocation)));

    const sourceInputs = await this.nonfunctionalSourceInputs(candidate, ['.'], false);
    const result = await this.ports.runInvocation<CoordinatorAction>(agent, {
      role: 'nonfunctional-coordinator', task: { goal: `Assess the requirements of candidate ${candidate.tree}`, requirements: [this.ports.coordination.planPackage(catalog, unresolved)], candidate: candidate.tree, snapshot: candidate.tree, literalSections: sourceInputs.sections }, work: { task: `nfr-action:${assessment.id}:${decision.action}` },
      attempt: this.events('invocation-started').filter(event => event.data.role === 'nonfunctional-coordinator').length + 1,
      loaded, systemPrompt: renderNonfunctionalCoordinatorPrompt(loaded, this.projectRoot, coordinatorActionToolName),
      prompt: [coordinatorActionPrompt(candidate, unresolved, investigatedNfrs,
        { assessment, allowedAction: decision.action, investigationPaths }), this.ports.coordination.planPackage(catalog, unresolved)].join('\n\n'),
      start: { mode: 'fresh' }, toolName: coordinatorActionToolName,
      description: 'Choose a bounded non-functional investigation, repair, or closure.',
      inputSchema: coordinatorActionJsonSchema, submissionSchema: 'ramify-agent.nonfunctional-action/1',
      validate: input => validateCoordinatorAction(input, context),
      keep: () => finished('work-closed'), scope: { write: null, measurement: null, size: null },
      writer: true, equip: session => this.nonfunctionalTools(session, boundedNonfunctionalTools({ source: this.candidates, projectRoot: this.projectRoot, candidate: candidate.tree, base: sourceInputs.snapshot.base, snapshot: sourceInputs.snapshot, comparisons: sourceInputs.comparisons, scope: undefined })),
    });
    if (result.ended !== 'submitted' || result.value === undefined) {
      await this.ports.fail('agent-failed', `Non-functional coordinator action ended ${result.ended}`);
      return null;
    }
    const late = await this.ports.previewCandidateTree();
    if (late.tree !== candidate.tree) {
      await this.ports.fail('inputs-changed', 'The source tree changed during the non-functional coordinator action');
      return null;
    }
    return { value: result.value, invocation: result.id };
  }

  private async nonfunctionalInvestigation(
    agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>,
    assessment: Assessment, action: Extract<CoordinatorAction, { kind: 'investigate' }>,
  ): Promise<boolean> {
    const loaded = packages.get('nonfunctional-coordinator');
    if (loaded === undefined) throw new Error('Non-functional coordinator package is unavailable');

    const sourceInputs = await this.nonfunctionalSourceInputs(assessment.candidate, action.scope, false);
    const result = await this.ports.runInvocation<CoordinatorInvestigation>(agent, {
      role: 'nonfunctional-coordinator', task: { goal: action.question, requirements: [this.ports.coordination.planPackage(await this.ports.coordination.frozenCatalog(), action.nfrs)], candidate: assessment.candidate.tree, snapshot: assessment.candidate.tree, literalSections: sourceInputs.sections }, work: { task: `nfr-investigation:${assessment.id}:${action.nfrs.join(',')}` },
      attempt: this.events('invocation-started').filter(event => event.data.role === 'nonfunctional-coordinator').length + 1,
      loaded, systemPrompt: renderNonfunctionalCoordinatorPrompt(loaded, this.projectRoot, coordinatorInvestigationToolName),
      prompt: [`Investigate element IDs ${action.nfrs.join(', ')} for assessment ${assessment.id} of tree ${assessment.candidate.tree}.`,
        `Question: ${action.question}`, `Starting scope: ${action.scope.join(', ')}`,
        'Inspect the named starting scope and follow relevant evidence using ordinary read/search tools and shell, including Git history and run records. The snapshot tools inspect the pinned candidate. Report observed evidence, its revision and remaining uncertainty. Do not edit source or harness records.', '',
        this.ports.coordination.planPackage(await this.ports.coordination.frozenCatalog(), action.nfrs)].join('\n'),
      start: { mode: 'fresh' }, toolName: coordinatorInvestigationToolName,
      description: 'Report read-only investigation evidence for every named NFR.',
      inputSchema: coordinatorInvestigationJsonSchema, submissionSchema: 'ramify-agent.nonfunctional-investigation/1',
      validate: input => validateCoordinatorInvestigation(input, action.nfrs),
      keep: () => finished('work-closed'), scope: { write: null, measurement: null, size: null },
      writer: true, equip: session => this.nonfunctionalTools(session, boundedNonfunctionalTools({ source: this.candidates, projectRoot: this.projectRoot, candidate: assessment.candidate.tree, base: sourceInputs.snapshot.base, snapshot: sourceInputs.snapshot, comparisons: sourceInputs.comparisons, scope: action.scope })),
    });
    if (result.ended !== 'submitted' || result.value === undefined) {
      await this.ports.fail('agent-failed', `Non-functional investigation ended ${result.ended}`);
      return false;
    }
    const late = await this.ports.previewCandidateTree();
    if (late.tree !== assessment.candidate.tree) {
      await this.ports.fail('inputs-changed', 'The source tree changed during non-functional investigation');
      return false;
    }
    await this.ports.write({ type: 'nonfunctional-investigated', data: {
      round: assessment.round, invocation: result.id, assessment: assessment.id, nfrs: [...action.nfrs],
    } });
    return true;
  }

  private async nonfunctionalRepair(
    agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>, catalog: ElementCatalog,
    assessment: Assessment, candidateId: string, action: Extract<CoordinatorAction, { kind: 'repair' }>,
  ): Promise<boolean> {
    const id = `nfr-repair-${String(this.events('nonfunctional-repair-assigned').length + 1).padStart(3, '0')}`;
    const answer = await this.options.ramify.queryOwnershipAnswer(this.projectRoot, ['.']);
    const scope = await resolveWriteScope({ projectRoot: this.projectRoot, ramify: this.options.ramify, index: await this.ports.refreshIndex(),
      view: this.input.record.manifest.architectView, revision: assessment.round,
      base: { modules: answer.scope.ownership.modules.map(module => module.id), rationale: 'The recorded coordinator authorized one project-wide non-functional repair batch' },
      extra: [], read: [], bootstrap: [], rationale: action.task });
    const assignment = nonfunctionalRepairAssignmentSchema.parse({
      schema: 'ramify-agent.nonfunctional-repair-assignment/1', id, round: assessment.round,
      assessment: assessment.id, candidate: candidateId, nfrs: action.nfrs,
      startingModule: action.startingModule, task: action.task,
      evidence: action.evidence, uncertainty: action.uncertainty, scope,
      guarded: await captureGuardedFiles(this.projectRoot, [], await this.ports.coordination.guardedScenarioFiles(), [...await this.ports.coordination.auditPreparationPaths(), ...scopeConfigurationPaths(scope)]),
    });
    await this.ports.write({ type: 'nonfunctional-repair-assigned', data: {
      round: assignment.round, assignment: id, assessment: assessment.id, candidate: candidateId,
      nfrs: [...assignment.nfrs], startingModule: assignment.startingModule,
    } }, [{ path: runLayout.nonfunctionalRepairAssignment(id), id, revision: 1, body: assignment }]);
    await this.ports.afterWrite('nonfunctional-repair-assigned', this.input.record.jobId);
    return await this.resumeNonfunctionalRepair(agent, packages, catalog, assignment);
  }

  private async performNonfunctionalRepair(
    agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>, catalog: ElementCatalog,
    assignment: import('./nonfunctional-records.js').NonfunctionalRepairAssignment,
  ): Promise<boolean> {
    const loaded = packages.get('nonfunctional-repair-engineer');
    if (loaded === undefined) throw new Error('Non-functional repair package is unavailable');
    const index = await this.ports.refreshIndex();
    const workingDirectory = await repairWorkingDirectory(this.projectRoot, assignment.startingModule, index);
    const guarded = guardedScopeOf(assignment.scope, await deniedFiles(this.projectRoot,
      [...await this.ports.coordination.deniedFiles(), ...assignment.guarded.map(file => file.path)]), this.options.ramify, undefined, this.ports.ownershipAuthority(assignment));
    const commandTimeoutMs = engineerBoundsOf(this.observe().policy.limits).defaults.commandTimeoutMs;
    const tools = this.ports.coordination.implementationTools({ workingDirectory, scopeRevision: 1, guarded, commandTimeoutMs, submissions: { legalOutcomes: ['completed', 'partial'], completionOutcome: null } });
    // A writer like any other: its scope size from the frozen baseline, and
    // its line events from the snapshots around it.
    const baseline = await this.ports.coordination.baselineSnapshot();
    const before = await takeLineSnapshot(this.projectRoot, this.ports.coordination.accepted(), this.git);
    const { candidate } = await this.readPreparedCandidate(assignment.candidate);
    // Repair reads follow the existing project source authority; writes remain guarded by assignment.scope.
    const sourceInputs = await this.nonfunctionalSourceInputs(candidate, ['.'], true);
    const result = await this.ports.runInvocation<NonfunctionalRepairSubmission>(agent, {
      // The repair engineer receives the same changed-path section as the coordinator that assigned it.
      role: 'nonfunctional-repair-engineer', task: { candidate: candidate.tree, modules: 'module' in assignment.scope.base ? [assignment.scope.base.module] : assignment.scope.base.modules, goal: assignment.task, requirements: [this.ports.coordination.planPackage(catalog, assignment.nfrs)],
        literalSections: sourceInputs.sections }, work: { nonfunctionalRepair: assignment.id },
      attempt: this.events('invocation-started').filter(event => event.data.role === 'nonfunctional-repair-engineer').length + 1,
      loaded, systemPrompt: renderNonfunctionalRepairPrompt(loaded, this.projectRoot),
      prompt: repairPrompt(assignment.task, candidate,
        this.ports.coordination.planPackage(catalog, assignment.nfrs), assignment.startingModule,
        { evidence: assignment.evidence, uncertainty: assignment.uncertainty }),
      start: { mode: 'fresh' }, toolName: nonfunctionalRepairToolName,
      description: 'Report the authorized non-functional repair batch and remaining work.',
      inputSchema: nonfunctionalRepairJsonSchema, submissionSchema: 'ramify-agent.nonfunctional-repair/1',
      validate: input => validateAgainst(nonfunctionalRepairSubmissionSchema, input),
      keep: () => finished('work-closed'),
      scope: { write: 1, measurement: baseline === null ? null : this.ports.coordination.baselineReference(), size: null },
      ...(baseline === null ? {} : { measured: { snapshot: baseline, scope: writeScopeMeasurement(assignment.scope), readScope: readScopeMeasurement(assignment.scope) } }),
      writer: true, guarded, readModules: assignment.scope.read, workingDirectory, equip: tools.equip, previewEquipment: tools.preview,
    });
    await this.ports.coordination.recordLineEvents(result.id, before, await takeLineSnapshot(this.projectRoot, this.ports.coordination.accepted(), this.git));
    // A settled child can return without a result. Preserve its edits and
    // let the coordinator assess the candidate before choosing another step.
    if (this.ports.ignoring()) return false;
    this.ports.requireSettled('Non-functional repair cannot be committed');
    const changed = await documentChanges(this.projectRoot, this.input.record.planId, this.input.directory, this.input.record.manifest);
    if (changed.length > 0) {
      await this.ports.fail('inputs-changed', `Captured plan evidence changed during repair: ${changed.join('; ')}`);
      return false;
    }
    if (!await this.repairScopeAllowed(assignment)) return false;
    await this.ports.write({ type: 'nonfunctional-repair-committed', data: {
      round: assignment.round, invocation: result.id, assignment: assignment.id,
    } });
    await this.ports.afterWrite('nonfunctional-repair-committed', this.input.record.jobId);
    return true;
  }

  private async repairScopeAllowed(assignment: import('./nonfunctional-records.js').NonfunctionalRepairAssignment): Promise<boolean> {
    try {
      const guard = guardedScopeOf(assignment.scope, await deniedFiles(this.projectRoot,
        [...await this.ports.coordination.deniedFiles(), ...assignment.guarded.map(file => file.path)]), this.options.ramify);
      const changed = await this.git.changedPaths(this.projectRoot, this.ports.coordination.accepted());
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
      await this.ports.fail('inputs-changed', `Repair changed files outside captured and current authority: ${outside.join('; ')}`);
    } catch (error) { await this.ports.fail('inputs-changed', `Repair ownership cannot be verified: ${message(error)}`); }
    return false;
  }

  private async resumeNonfunctionalRepair(
    agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>, catalog: ElementCatalog,
    assignment: import('./nonfunctional-records.js').NonfunctionalRepairAssignment,
  ): Promise<boolean> {
    const started = this.events('invocation-started').filter(event =>
      event.data.role === 'nonfunctional-repair-engineer' && event.data.work.nonfunctionalRepair === assignment.id);
    if (started.length === 0) return await this.performNonfunctionalRepair(agent, packages, catalog, assignment);
    const invocation = started.at(-1)!.data.invocation;
    const ended = this.events('invocation-ended').find(event => event.data.invocation === invocation);
    const release = this.events('writer-released').find(event => event.data.invocation === invocation);
    if (ended === undefined || release?.data.confirmed !== true) {
      await this.ports.fail('recovery-exhausted', `Repair ${assignment.id} has no confirmed child outcome`);
      return false;
    }
    try {
      const outcome = invocationOutcomeSchema.safeParse(this.ports.committedBody(runLayout.outcome(invocation)));
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
        return await this.performNonfunctionalRepair(agent, packages, catalog, assignment);
      }
      if (ended.data.submission !== null) {
        const raw = await readFile(this.path(runLayout.submission(invocation)));
        if (sha256(raw) !== ended.data.submission) throw new Error('submission hash differs from committed invocation outcome');
        const value = JSON.parse(raw.toString('utf8')) as Record<string, unknown>;
        if (value.schema !== 'ramify-agent.nonfunctional-repair/1') throw new Error('repair submission schema differs');
        const { schema: _schema, ...submission } = value;
        nonfunctionalRepairSubmissionSchema.parse(submission);
      }
    } catch (error) {
      await this.ports.fail('recovery-exhausted', `Repair ${assignment.id} result cannot be authenticated: ${message(error)}`);
      return false;
    }
    const changed = await documentChanges(this.projectRoot, this.input.record.planId, this.input.directory, this.input.record.manifest);
    if (changed.length > 0) {
      await this.ports.fail('inputs-changed', `Captured plan evidence changed during repair recovery: ${changed.join('; ')}`);
      return false;
    }
    if (!await this.repairScopeAllowed(assignment)) return false;
    await this.ports.write({ type: 'nonfunctional-repair-committed', data: {
      round: assignment.round, invocation, assignment: assignment.id,
    } });
    await this.ports.afterWrite('nonfunctional-repair-committed', this.input.record.jobId);
    return true;
  }

  private async readPreparedCandidate(id: string): Promise<{ candidate: Candidate }> {
    const record = await this.ports.readRecord( runLayout.candidate(id), runSchemas.preparedCandidate);
    if (record.kind !== 'valid') throw new Error(`Prepared candidate ${id} is unavailable`);
    return record.value;
  }

  /** Commit one prepared source, then settle its independent read-only checks before repair decisions. */
  private async qualifyNonfunctionalCandidate(
    agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>,
    catalog: Awaited<ReturnType<typeof readAcceptedEvidence>> & { status: 'available' },
    prepared: { id: string; candidate: Candidate }, round: number, phase: Assessment['phase'],
  ): Promise<boolean> {
    const gateId = gateAttemptId(this.gates.gateCount() + 1);
    const previous = this.events('gate-attempted').filter(event => event.data.checkpoint === 'final').at(-1);
    const previousRecord = previous === undefined ? null : await this.ports.readRecord(runLayout.gate(previous.data.gate), runSchemas.gate);
    const previousOperation = previous === undefined ? null : await this.ports.readRecord(runLayout.gateOperation(previous.data.gate), runSchemas.gateOperation);
    const priorForCandidate = previousRecord?.kind === 'valid' && previousOperation?.kind === 'valid'
      && (previousOperation.value.finalCandidate?.candidate === prepared.id
        || previousOperation.value.finalAssessment?.candidate === prepared.id)
      ? previousRecord.value : null;
    const head = priorForCandidate === null ? await this.git.currentHead(this.projectRoot) : null;
    let committed!: (commit: string) => void;
    const ready = new Promise<string>(resolve => { committed = resolve; });
    const assessment = ready.then(async commit => {
      if ((await this.candidates.commitTree(this.projectRoot, commit)) !== prepared.candidate.tree) {
        await this.ports.fail('inputs-changed', `Final candidate ${prepared.id} is not the committed source ${commit}`,
          [runLayout.candidate(prepared.id)]);
        return null;
      }
      return this.assessNonfunctionalCandidate(agent, packages, catalog, prepared, round, phase);
    });
    const gate = priorForCandidate === null ? this.gates.committingCheckpoint({ id: gateId, runId: this.input.record.jobId,
      checkpoint: 'final', projectRoot: this.projectRoot, directory: this.path(runLayout.gateOutput(gateId)),
      head: head!, policy: this.observe().policy, proposedBy: null },
    undefined, undefined, undefined,
    { candidateId: prepared.id, tree: prepared.candidate.tree, onCommitted: committed }, true) : Promise.resolve(priorForCandidate);
    const settledGate = gate.then(value => { committed(value.audited ?? value.head); return value; }, error => { committed('unavailable'); throw error; });
    const [gateResult, assessmentResult] = await Promise.allSettled([settledGate, assessment]);
    if (gateResult.status === 'rejected') throw gateResult.reason;
    if (assessmentResult.status === 'rejected') throw assessmentResult.reason;
    // A gate receipt can survive a crash before its per-test reports do.
    // Replaying stable report keys also completes a partially ingested batch.
    if (priorForCandidate !== null) await this.ports.gateHost.reportInstability?.(gateResult.value);
    if (priorForCandidate === null) await this.ports.afterWrite('gate-committed', this.input.record.jobId);
    if (assessmentResult.value === null) return false;
    const attempt = gateResult.value;
    if (attempt.audited !== null && attempt.evidence !== null) {
      const tree = await this.candidates.commitTree(this.projectRoot, attempt.audited);
      if (tree !== prepared.candidate.tree) {
        await this.ports.fail('inputs-changed', `Final gate audited tree ${tree}, not prepared tree ${prepared.candidate.tree}`,
          [runLayout.candidate(prepared.id), runLayout.gate(attempt.id)]);
        return false;
      }
      if (!this.events('candidate-bound-to-gate').some(event => event.data.gate === attempt.id)) {
        await this.ports.write({ type: 'candidate-bound-to-gate', data: {
          candidate: prepared.id, assessment: assessmentResult.value.id, gate: attempt.id,
          commit: attempt.audited, tree,
        } });
      }
    }
    return !this.ports.ignoring();
  }

  private async assessNonfunctionalCandidate(
    agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>,
    catalog: Awaited<ReturnType<typeof readAcceptedEvidence>> & { status: 'available' },
    prepared: { id: string; candidate: Candidate }, round: number, phase: Assessment['phase'],
  ): Promise<Assessment | null> {
    const nfrIds = assessedElements(catalog.catalog);
    const last = this.events('nonfunctional-assessed').at(-1);
    const previous = last === undefined ? undefined : assessmentSchema.parse(this.ports.committedBody(runLayout.assessment(last.data.assessment)));
    const repairEvent = this.events('nonfunctional-repair-assigned').at(-1);
    const repair = repairEvent === undefined ? undefined
      : nonfunctionalRepairAssignmentSchema.parse(this.ports.committedBody(runLayout.nonfunctionalRepairAssignment(repairEvent.data.assignment)));
    const selected = previous === undefined ? nfrIds : [...new Set([
      ...previous.results.filter(result => result.result !== 'satisfied').map(result => result.nfr),
      ...(repair?.nfrs ?? []),
    ])];
    const correction = this.events('final-correction-planned').at(-1);
    const correctionTask = correction === undefined ? undefined
      : committedRecords(this.observe().history.lines).workItems.find(item => item.id === correction.data.workItem);
    const followUp = previous === undefined ? undefined : { previous, selected,
      repair: phase === 'after-repair' ? repair : { correction: correctionTask, comparison: 'previous-assessment', previousCandidate: previous.candidate } };
    const assessmentPackage = this.ports.coordination.planPackage(catalog.catalog, selected);
    const id = `nfa-${String(this.events('nonfunctional-assessed').length + 1).padStart(3, '0')}`;
    let assessment: Assessment;
    if (nfrIds.length === 0) {
      // An empty fixed catalog still needs explicit candidate-bound coverage.
      assessment = assessmentSchema.parse({ schema: 'ramify-agent.nonfunctional-assessment/1', id,
        candidate: prepared.candidate, round, phase, coordinatorInvocation: 'harness:empty-catalog', results: [] });
    } else {
      const loaded = packages.get('nonfunctional-coordinator');
      if (loaded === undefined) {
        await this.ports.fail('internal', 'No prompt package is loaded for the non-functional coordinator');
        return null;
      }

      const sourceInputs = await this.nonfunctionalSourceInputs(prepared.candidate, ['.'], false, previous);
      const result = await this.ports.runInvocation<CoordinatorAssessmentSubmission>(agent, {
        role: 'nonfunctional-coordinator', task: { goal: `${previous === undefined ? 'Assess the complete NFR catalog' : 'Verify selected final repairs and relevant surrounding behavior'} for ${prepared.candidate.tree}`, requirements: [assessmentPackage], candidate: prepared.candidate.tree, snapshot: prepared.candidate.tree, literalSections: sourceInputs.sections }, work: { task: `nfr-assessment:${prepared.id}:${round}:${phase}` },
        attempt: this.events('invocation-started').filter(event => event.data.role === 'nonfunctional-coordinator').length + 1,
        loaded, systemPrompt: renderNonfunctionalCoordinatorPrompt(loaded, this.projectRoot),
        prompt: coordinatorAssessmentPrompt(assessmentPackage, prepared.candidate, round, phase, followUp),
        start: { mode: 'fresh' }, toolName: coordinatorAssessmentToolName,
        description: previous === undefined ? 'Submit one evidence-grounded result for every non-functional and fixed requirement.' : 'Verify selected repairs and unresolved requirements; optionally broaden for concrete changed circumstances.',
        inputSchema: coordinatorAssessmentJsonSchema, submissionSchema: 'ramify-agent.nonfunctional-assessment-submission/1',
        validate: input => {
          const checked = bindCoordinatorAssessment(input, { catalog: catalog.catalog, candidate: prepared.candidate,
            observedTree: prepared.candidate.tree, id, round, phase, coordinatorInvocation: 'pending', previous, selected });
          return checked.ok
            ? { ok: true, value: { kind: 'assessment' as const, results: (input as CoordinatorAssessmentSubmission).results } }
            : checked;
        },
        keep: () => finished('work-closed'), scope: { write: null, measurement: null, size: null },
        writer: true, equip: session => this.nonfunctionalTools(session, boundedNonfunctionalTools({ source: this.candidates, projectRoot: this.projectRoot, candidate: prepared.candidate.tree, base: sourceInputs.snapshot.base, snapshot: sourceInputs.snapshot, comparisons: sourceInputs.comparisons, scope: undefined })),
      });
      if (result.ended !== 'submitted' || result.value === undefined) {
        await this.ports.fail('agent-failed', `The non-functional coordinator ended ${result.ended} without a complete assessment`);
        return null;
      }
      const late = await this.ports.previewCandidateTree();
      const bound = bindCoordinatorAssessment(result.value, { catalog: catalog.catalog, candidate: prepared.candidate,
        observedTree: late.tree, id, round, phase, coordinatorInvocation: result.id, previous, selected });
      if (!bound.ok) {
        await this.ports.fail('inputs-changed', `The non-functional assessment could not bind to the prepared tree: ${bound.errors.map(error => error.message).join('; ')}`);
        return null;
      }
      assessment = bound.value;
    }
    const changed = await documentChanges(this.projectRoot, this.input.record.planId, this.input.directory, this.input.record.manifest);
    if (changed.length > 0) {
      await this.ports.fail('inputs-changed', `The captured plan evidence changed during assessment: ${changed.join('; ')}`, [runLayout.documentManifest]);
      return null;
    }
    await this.ports.write({ type: 'nonfunctional-assessed', data: { assessment: id, candidate: prepared.id, round, phase } }, [
      { path: runLayout.assessment(id), id, revision: 1, body: assessment },
    ]);
    await this.ports.afterWrite('nonfunctional-assessed', this.input.record.jobId);
    return assessment;
  }

  async verifyCapabilityHandback(
    agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>, item: WorkItem, task: CapabilityTask,
    request: CapabilityRequest, plan: CapabilityPlan,
    action: Extract<CapabilityAction, { kind: 'request-handback' }>,
    completion: InvocationResult<CapabilityAction>,
    replayed: boolean,
  ): Promise<CapabilityVerification | null> {
    const invocation = completion.id;
    this.ports.requireSettled(`Capability ${task.id} cannot verify an unsettled writer`);
    const state = replayCapabilityState(this.observe().history.events).tasks.get(task.id);
    if (state === undefined || state.status !== 'coordinating' || state.planRevision !== plan.revision || state.activeChild !== null) {
      return { kind: 'refused', guidance: 'The task, plan or child dependency is not ready for completion' };
    }
    // Every obligation this architect is responsible for was reported done
    // by the time the request was accepted: validation rejects one that
    // leaves an ID unreported, in the same turn and before any gate.
    const records = committedRecords(this.observe().history.lines);
    const assignments = [...records.assignments.values()].filter(entry =>
      entry.coordination?.kind === 'capability-task' && entry.coordination.id === task.id)
      .sort((a, b) => (a.coordination?.kind === 'capability-task' ? a.coordination.sequence : 0) -
        (b.coordination?.kind === 'capability-task' ? b.coordination.sequence : 0));
    const results = assignments.map(entry => records.results.get(entry.id));
    const latestAccepted = [...assignments].reverse().find(entry => records.results.get(entry.id)?.outcome === 'accepted');
    const blockers = capabilityCompletionBlockers(replayCapabilityState(this.observe().history.events), task.id,
      new Set(results.filter(result => result?.outcome === 'accepted').map(result => result!.iteration)));
    if (blockers.length > 0 || latestAccepted === undefined || results.some(result => result === undefined) ||
      state.activeAssignment !== null || state.activeChild !== null) {
      return { kind: 'refused', guidance: [...blockers, latestAccepted === undefined ? 'No accepted task iteration' : '',
        results.some(result => result === undefined) ? 'An assignment has no ordinary result' : ''].filter(Boolean).join('; ') || 'An assignment is unfinished' };
    }
    const latestResult = records.results.get(latestAccepted.id)!;
    const candidate = (await this.ports.previewCandidateTree()).tree;
    const acceptedGate = latestResult.gate === null ? null
      : gateAttemptSchema.safeParse(this.ports.committedBody(runLayout.gate(latestResult.gate)));
    if (acceptedGate?.success !== true || acceptedGate.data.audited === null ||
      await this.candidates.commitTree(this.projectRoot, acceptedGate.data.audited) !== candidate) {
      return { kind: 'refused', guidance: `Current source differs from the latest accepted iteration ${latestAccepted.id}; assign a repair and gate it` };
    }
    const correction = this.pendingCorrection(task.id);
    if (correction !== undefined) return { kind: 'refused',
      guidance: `Reconciliation ${correction} requires an accepted correction assignment before another handback request` };
    const loaded = packages.get('capability-architect');
    if (loaded === undefined) { await this.ports.fail('internal', 'Capability architect package is absent for reconciliation'); return null; }
    // The capability architect's own session runs from the project root, so its reconciliation fork does too.
    const parent: ParentSession = { session: completion.kept ? completion.session : undefined,
      ref: completion.ref || undefined, undelivered: [], workingDirectory: this.projectRoot };
    const reconciled = await this.reconcileWorkItem(agent, loaded, item, parent, {
      id: task.id, role: 'capability-architect', request: request.id, provider: task.provider,
      ...(completion.ref ? { completion: { session: completion.session, ref: completion.ref, invocation } } : {}),
    });
    if (reconciled === null) return null;
    const coordinator = { point: parent.ref, session: parent.session, invocation };
    if (reconciled.kind === 'correct') return { kind: 'refused',
      guidance: `Reconciliation ${reconciled.reconciliation} requires a correction assignment. ${JSON.stringify(this.reconciliationBriefing(reconciled.reconciliation, parent.undelivered))}`,
      coordinator };
    const reviewStates = [...reviewStateOf(this.observe().history.events).values()].filter(entry => entry.workItem === task.id);
    const failedTaskGates = this.events('gate-attempted').flatMap(event => {
      const parsed = gateAttemptSchema.safeParse(this.ports.committedBody(runLayout.gate(event.data.gate)));
      return parsed.success && parsed.data.checkpoint === 'work-item' && parsed.data.verdict !== 'passed' &&
        parsed.data.proposedBy !== null && records.invocations.get(parsed.data.proposedBy)?.work.capabilityTask === task.id
        ? [parsed.data] : [];
    });
    const gate = await this.gates.workItemGate(item, invocation, failedTaskGates.length,
      `Capability ${task.id}: ${action.summary}`, task.id, replayed);
    if (gate === null) return null;
    if (gate.verdict !== 'passed' || gate.audited === null) {
      return { kind: 'refused', guidance: `Task completion gate ${gate.id} ${gate.verdict}: ${gate.cause ?? 'incomplete evidence'}; report ${runLayout.gate(gate.id)}`, coordinator };
    }
    const currentTree = (await this.ports.previewCandidateTree()).tree;
    const auditedTree = await this.candidates.commitTree(this.projectRoot, gate.audited);
    if (auditedTree !== currentTree) return { kind: 'refused', guidance: `Source changed after gate ${gate.id}; verify again`, coordinator };
    const basisRefusal = await this.completionBasisRefusal(task.id, gate, reconciled.basis);
    if (basisRefusal !== null) {
      await this.ports.write({ type: 'reconciliation-refused', data: { workItem: task.id,
        reconciliation: this.latestBasis(task.id)?.id ?? null, stage: 'completion', reason: basisRefusal } });
      return { kind: 'refused', guidance: `Completion basis changed: ${basisRefusal}`, coordinator };
    }
    await this.ports.write({ type: 'capability-verification-started', data: { task: task.id, invocation, gate: gate.id, completion: { acceptedBasis: { ...reconciled.basis, requests: [...reconciled.basis.requests], checkFindings: [...reconciled.basis.checkFindings] }, reconciliation: this.latestBasis(task.id) ?? null } } });
    await this.ports.afterWrite('capability-verification-started', this.input.record.jobId);
    if (this.ports.ignoring()) return null;
    const qualification: CapabilityHandbackBasis = { gate, gateRecord: refOf(gate.id, 1, this.ports.committedBody(runLayout.gate(gate.id))), candidateTree: currentTree, reviews: reviewStates, acceptedBasis: reconciled.basis, reconciliation: this.latestBasis(task.id) ?? null, recovered: false };
    const handback = await this.ports.coordination.finishCapabilityHandback(task, request, plan, action, invocation, qualification);
    return { kind: 'accepted', handback, qualification, guidance: `${capabilityHandbackGuidance(this.path('.'), handback)}\nContinue the original assignment from the current candidate; its remaining goal stays open.` };
  }

  async contractGate(
    item: WorkItem,
    assignment: IterationAssignment,
    invocation: string,
    submission: EstablishedContract,
    repairRound: number,
  ): Promise<GateAttempt | null> {
    this.ports.requireSettled(`The ${assignment.id} gate cannot run`);
    if (this.observe().restoring) {
      const original = this.events('gate-attempted').flatMap(event => { const parsed = gateAttemptSchema.safeParse(this.ports.committedBody(runLayout.gate(event.data.gate))); return parsed.success && parsed.data.subject.iteration === assignment.id && parsed.data.proposedBy === invocation && parsed.data.checkpoint === 'contract' ? [parsed.data] : []; });
      if (original.length > 1) throw new Error('Ambiguous original contract gate');
      if (original[0]) {
        if (original[0].verdict === 'passed' && (original[0].audited === null || await this.candidates.commitTree(this.projectRoot, original[0].audited) !== (await this.ports.previewCandidateTree()).tree)) throw new CandidateDriftError('Original contract gate candidate changed before registration');
        return original[0];
      }
    }
    const gateId = gateAttemptId(this.gates.gateCount() + 1);
    const index = await this.ports.refreshIndex();

    const writeScope = writeScopePaths(this.projectRoot, assignment);
    // The agreement's own fakes are this gate's to answer; another
    // agreement's fake is judged too, attributed by the write scope. A
    // revision replaces the fakes of the revision in force.
    const declared: StandIn[] = submission.artifacts.fake.flatMap(entry => entry.standsFor.map(standsFor => ({
      contract: 'the agreement under this gate', fakePath: entry.path, standsFor, declaredHere: true,
    })));
    const parity = await this.gates.fakeExposureParityRule(index, [
      ...declared,
      ...this.gates.registeredStandIns(assignment.revisesContract?.id)
        .filter(standIn => !declared.some(own => own.fakePath === standIn.fakePath && own.standsFor.fake === standIn.standsFor.fake)),
    ], writeScope);
    const rules = [await this.ports.coordination.fakeNamingRule(submission), ...(parity === null ? [] : [parity])];
    const modules = await this.gates.pendingModules(assignment.id);
    const attempt = await this.gates.committingCheckpoint({
      id: gateId,
      runId: this.input.record.jobId,
      checkpoint: 'contract',
      projectRoot: this.projectRoot,
      directory: this.path(runLayout.gateOutput(gateId)),
      head: await this.git.currentHead(this.projectRoot),
      policy: this.observe().policy,
      proposedBy: invocation,
      repairRound,
      infrastructureAttempt: 0,
      subject: { workItem: item.id, iteration: assignment.id },
      guarded: this.gates.guardedAtGate(assignment.guarded),
      authorizations: assignment.authorizations.map(entry => ({ path: entry.path, by: entry.by })),
      rules,
    }, submission.summary, modules, assignment.goal);

    if (attempt.verdict !== 'passed') {
      return this.ports.ignoring() ? null : attempt;
    }
    await this.ports.afterWrite('gate-committed', this.input.record.jobId);
    if (this.ports.ignoring()) return null;
    return attempt;
  }

  async dischargeEvidence(
    item: WorkItem,
    assignment: IterationAssignment,
    gate: string,
    result: IterationResult,
  ): Promise<boolean> {
    void result;
    const records = committedRecords(this.observe().history.lines);
    const conformed = new Set(this.events('provider-conformed').map(event => conformanceKey(event.data.obligation, event.data.revision)));

    for (const evidence of assignment.evidenceObligations) {
      if (evidence.obligation === undefined || evidence.against !== 'real') continue;
      if (conformed.has(conformanceKey(evidence.obligation.id, evidence.obligation.revision))) continue;
      await this.ports.write({
        type: 'provider-conformed',
        data: { obligation: evidence.obligation.id, revision: evidence.obligation.revision, workItem: item.id, iteration: assignment.id, gate },
      });
      await this.ports.afterWrite('provider-conformed', this.input.record.jobId);
      if (this.ports.ignoring()) return false;
    }

    const verified = this.ports.coordination.verifiedRequirements();
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
        this.ports.warn(`Run ${this.input.record.jobId}: ${requirement.id} is not verified; the fake is still reached at ${remaining.map(entry => `${entry.path} (${entry.reference})`).join(', ')}`);
        continue;
      }
      await this.ports.write({
        type: 'requirement-verified',
        data: { requirement: requirement.id, revision: requirement.revision, workItem: requirement.workItem, iteration: assignment.id, gate },
      });
      await this.ports.afterWrite('requirement-verified', this.input.record.jobId);
      if (this.ports.ignoring()) return false;
    }
    return true;
  }

  async closeCorrection(
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
      this.ports.warn(`Run ${this.input.record.jobId}: the tree of ${closing.commit} could not be read, so ${closing.data.iteration} claims no repair: ${message(error)}`);
    }
    if (tree !== undefined) {
      const candidate = { kind: 'tree' as const, id: tree };
      const committed = await this.ports.commitFinding(({ state }) => ({
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
      this.ports.warn(`Run ${this.input.record.jobId}: the repair claims of ${closing.data.iteration} were refused, so it closes without them: ${committed.refusal.message}`);
    }
    await this.ports.write({ type: 'iteration-closed', data: closing.data }, [closing.record]);
  }

  private async finalGate(agent: AgentPort, packages: ReadonlyMap<string, LoadedPackage>, binding: { candidateId: string; assessment: Assessment }): Promise<GateAttempt | undefined> {
    this.ports.requireSettled('The final gate cannot run');
    const sourceChanges = await documentChanges(this.projectRoot, this.input.record.planId, this.input.directory, this.input.record.manifest);
    if (sourceChanges.length > 0) {
      await this.ports.fail('inputs-changed', `The captured plan evidence changed before final publication: ${sourceChanges.join('; ')}`, [runLayout.documentManifest]);
      return;
    }
    // The final gate waits for every latest requirement revision. A
    // capability still held by a fake is not implemented, whatever the
    // project's tests say about it.
    const records = committedRecords(this.observe().history.lines);
    const verified = this.ports.coordination.verifiedRequirements();
    const open = [...records.requirements.values()]
      .filter(requirement => !verified.has(verificationKey(requirement.id, requirement.revision)));
    if (open.length > 0) {
      await this.ports.fail('unresolvable-requirement',
        `The run cannot complete: ${open.map(requirement => `${requirement.id} of ${requirement.consumer} is still held by its fake`).join('; ')}`,
        open.map(requirement => contractsLayout.requirement(requirement.id, requirement.revision)));
      return;
    }
    // The consistency rule acceptance-incomplete: every tracked scenario is
    // implemented before the final run. Once every work item has completed
    // it cannot fail; when it does, the run fails with the scenarios as
    // evidence rather than returning anywhere.
    const tracked = trackedScenarios(this.observe().history.lines);
    const incomplete = incompleteScenarios(tracked);
    if (incomplete.length > 0) {
      await this.ports.fail('acceptance-incomplete',
        `The final gate cannot run: ${incomplete.map(scenario => `${scenario.id} ${scenario.entry === null ? '(integration)' : `of ${scenario.entry}`} is ${scenario.state}`).join('; ')}`,
        incomplete.map(scenario => scenario.evidence));
      return;
    }
    const beforeGate = await this.ports.previewCandidateTree();
    if (beforeGate.tree !== binding.assessment.candidate.tree) {
      throw new CandidateReassessmentRequired('The current candidate needs fresh assessment');
    }
    const latestQualificationChange = Math.max(
      this.events('final-correction-planned').at(-1)?.sequence ?? Number.NEGATIVE_INFINITY,
      this.events('nonfunctional-final-invalidated').at(-1)?.sequence ?? Number.NEGATIVE_INFINITY,
    );
    const recentFinal = this.events('gate-attempted').filter(event => event.sequence > latestQualificationChange && event.data.checkpoint === 'final').at(-1);
    const recentRecord = recentFinal === undefined ? null : await this.ports.readRecord(runLayout.gate(recentFinal.data.gate), runSchemas.gate);
    const recentOperation = recentFinal === undefined ? null : await this.ports.readRecord(runLayout.gateOperation(recentFinal.data.gate), runSchemas.gateOperation);
    let previousFinal = recentRecord?.kind === 'valid' &&
      (recentOperation?.kind === 'valid' && recentOperation.value.finalCandidate?.candidate === binding.candidateId ||
        recentOperation?.kind === 'valid' && recentOperation.value.finalAssessment?.candidate === binding.candidateId
          && recentOperation.value.finalAssessment.assessment === binding.assessment.id ||
        this.events('candidate-bound-to-gate').some(event => event.data.gate === recentFinal?.data.gate && event.data.candidate === binding.candidateId))
      ? recentFinal : undefined;
    let infrastructureAttempt = 0;
    if (previousFinal !== undefined && recentRecord?.kind === 'valid' && this.observe().policy.recovery !== undefined) {
      const obstruction = checkExecutionObstruction(recentRecord.value);
      if (obstruction !== null && this.ports.gateHost.recoverGate !== undefined) {
        const priorAttempts = this.events('gate-attempted').filter(event => event.sequence > latestQualificationChange
          && event.data.checkpoint === 'final');
        const retries = Math.max(0, priorAttempts.length - 1);
        if (obstruction.automatic && mayRetryTask({ attempt: retries,
          limit: this.observe().policy.limits.infrastructureRetriesPerGate, classification: 'transport' })) {
          if (this.ports.gateHost.retryGateDelay !== undefined
            && !await this.ports.gateHost.retryGateDelay(Math.min(1000 * (retries + 1), 2000))) return;
          infrastructureAttempt = recentRecord.value.infrastructureAttempt + 1;
          previousFinal = undefined;
        }
        if (previousFinal !== undefined) {
          let alreadyResumed = false;
          for (const resumed of this.events('operation-recovery-resumed').filter(event => event.sequence > previousFinal!.sequence)) {
            const recovery = await this.ports.readRecord(runLayout.operationRecovery(resumed.data.occurrenceId), runSchemas.operationRecovery);
            if (recovery.kind === 'valid' && recovery.value.boundary.kind === 'gate'
              && recovery.value.boundary.checkpoint === 'final'
              && recovery.value.boundary.candidate === (recentRecord.value.audited ?? recentRecord.value.head)) {
              alreadyResumed = true;
              break;
            }
          }
          for (const paused of this.events('operation-recovery-paused').filter(event => event.sequence > previousFinal!.sequence)) {
            const recovery = await this.ports.readRecord(runLayout.operationRecovery(paused.data.occurrenceId), runSchemas.operationRecovery);
            if (recovery.kind === 'valid' && recovery.value.boundary.kind === 'gate'
              && recovery.value.boundary.checkpoint === 'final'
              && recovery.value.boundary.candidate === (recentRecord.value.audited ?? recentRecord.value.head)
              && this.events('job-continued').some(event => event.sequence > paused.sequence && event.data.command !== undefined)) {
              alreadyResumed = true;
              break;
            }
          }
          if (!alreadyResumed && !await this.ports.gateHost.recoverGate(recentRecord.value, obstruction.diagnostic, 0, [recentRecord.value.id])) return;
          if ((await this.ports.previewCandidateTree()).tree !== binding.assessment.candidate.tree) {
            throw new CandidateReassessmentRequired('The externally repaired final candidate needs fresh assessment');
          }
          previousFinal = undefined;
        }
      }
    }
    let gateId = previousFinal?.data.gate ?? gateAttemptId(this.gates.gateCount() + 1);
    let attempt!: GateAttempt;
    if (previousFinal !== undefined) {
      const recorded = await this.ports.readRecord( runLayout.gate(gateId), runSchemas.gate);
      if (recorded.kind !== 'valid') {
        await this.ports.fail('recovery-exhausted', `Final gate ${gateId} record is unavailable`);
        return;
      }
      attempt = recorded.value;
    }
    const pendingFinalGate = previousFinal !== undefined && checkExecutionObstruction(attempt!) !== null;
    if (previousFinal === undefined || pendingFinalGate) {
      if (previousFinal !== undefined) gateId = gateAttemptId(this.gates.gateCount() + 1);
      const head = await this.git.currentHead(this.projectRoot);
      try {
        attempt = await this.gates.committingCheckpoint({
          id: gateId,
          runId: this.input.record.jobId,
          checkpoint: 'final',
          projectRoot: this.projectRoot,
          directory: this.path(runLayout.gateOutput(gateId)),
          head,
          policy: this.observe().policy,
          proposedBy: null,
          infrastructureAttempt,
        }, undefined, undefined, undefined, { ...binding, tree: binding.assessment.candidate.tree });
      } catch (error) {
        if (!(error instanceof CandidateDriftError)) throw error;
        await this.ports.fail('inputs-changed', error.message, [runLayout.assessment(binding.assessment.id)]);
        return;
      }
    }
    gateId = attempt!.id;
    // Retained final attempts can bypass committingCheckpoint after a crash.
    // The ingestion is idempotent and must precede reconciliation/publication.
    await this.ports.gateHost.reportInstability?.(attempt);

    if (attempt.audited !== null && attempt.evidence !== null) {
      const auditedTree = await this.candidates.commitTree(this.projectRoot, attempt.audited);
      if (auditedTree !== binding.assessment.candidate.tree) {
        await this.ports.fail('inputs-changed', `Final gate audited tree ${auditedTree}, not assessed tree ${binding.assessment.candidate.tree}`,
          [runLayout.assessment(binding.assessment.id), runLayout.gate(gateId)]);
        return;
      }
      const existingBinding = this.events('candidate-bound-to-gate').find(event => event.data.gate === gateId);
      if (existingBinding !== undefined && (existingBinding.data.assessment !== binding.assessment.id
        || existingBinding.data.candidate !== binding.candidateId || existingBinding.data.tree !== auditedTree
        || existingBinding.data.commit !== attempt.audited)) {
        await this.ports.fail('recovery-exhausted', `Final gate ${gateId} has a conflicting candidate binding`);
        return;
      }
      if (existingBinding === undefined) await this.ports.write({ type: 'candidate-bound-to-gate', data: {
        candidate: binding.candidateId, assessment: binding.assessment.id, gate: gateId,
        commit: attempt.audited, tree: auditedTree,
      } });
    }
    if (attempt.verdict === 'passed' && (attempt.audited === null || attempt.evidence === null
      || this.events('candidate-bound-to-gate').at(-1)?.data.gate !== gateId)) {
      await this.ports.fail('recovery-exhausted', 'The final gate passed without durable candidate-bound audit evidence', [runLayout.gate(gateId)]);
      return;
    }

    const instability = await this.reconcileFinalInstability(agent, packages, attempt, binding);
    if (instability === 'correct') return attempt;
    if (instability === 'unresolved' || instability === 'await-user') {
      await this.ports.fail('acceptance-incomplete', `Final audit instability remains unresolved on ${gateId}`, [runLayout.gate(gateId)]);
      return;
    }
    if (instability === null) return;
    if (attempt.verdict !== 'passed' && instability === 'complete' && configuredAuditInstabilityObservations(attempt.provider?.result)
      .some(observation => { try { return (JSON.parse(observation.detail) as { policy?: { onFailure?: string } }).policy?.onFailure === 'failure'; }
        catch { return false; } })) {
      await this.ports.fail('acceptance-incomplete', `Final audit ${gateId} failed under strict instability policy; its verdict remains blocking`, [runLayout.gate(gateId)]);
      return;
    }

    if (attempt.verdict !== 'passed') {
      return attempt;
    }

    if (previousFinal === undefined) await this.ports.afterWrite('gate-committed', this.input.record.jobId);
    if (this.ports.ignoring()) return;
    const lateSourceChanges = await documentChanges(this.projectRoot, this.input.record.planId, this.input.directory, this.input.record.manifest);
    if (lateSourceChanges.length > 0) {
      await this.ports.fail('inputs-changed', `The captured plan evidence changed during final verification: ${lateSourceChanges.join('; ')}`, [runLayout.documentManifest, runLayout.gate(gateId)]);
      return;
    }
    const afterGate = await this.ports.previewCandidateTree();
    if (afterGate.tree !== binding.assessment.candidate.tree) {
      await this.ports.fail('inputs-changed', 'The source tree changed during final verification', [runLayout.assessment(binding.assessment.id), runLayout.gate(gateId)]);
      return;
    }
    if (supportedCapabilityPolicy(this.observe().policy.version)) {
      const blockers = committedRecords(this.observe().history.lines).workItems.flatMap(item =>
        this.capabilityBlockers(item.id));
      if (blockers.length > 0) {
        await this.ports.fail('acceptance-incomplete', `Final completion has unresolved capability work: ${blockers.join('; ')}`);
        return;
      }
    }
    const workItems = this.events('work-item-completed').length;
    // A run that recorded plan deviations completes with them to review,
    // never plainly: the count is of those still awaiting the person.
    const deviations = [
      ...this.events('plan-deviation-recorded').map(event => event.data.checkFinding),
      ...this.events('nonfunctional-deviation-recorded').filter(event => event.data.assessment === binding.assessment.id).map(event => event.data.checkFinding),
    ];
    const findings = this.observe().findings.findings;
    const toReview = deviations.filter(id => findings.get(id)?.pendingUserDecision != null).length;
    await this.ports.endRun({
      type: 'job-completed',
      data: { gate: gateId, commit: attempt.audited, workItems, ...(deviations.length === 0 ? {} : { planDeviations: toReview }) },
    });
    await this.ports.afterWrite('job-completed', this.input.record.jobId);
  }

  private async refuseCompletion(
    item: WorkItem,
    refusals: number,
    blocked: readonly string[],
    owing: { readonly open: readonly ConsumerRequirement[]; readonly owed: boolean },
  ): Promise<void> {
    if (owing.open.length > 0 || owing.owed) {
      await this.ports.fail('unresolvable-requirement',
        `${item.id} asked for completion ${refusals} times with evidence still owed: ${blocked.join('; ')}`,
        owing.open.map(requirement => contractsLayout.requirement(requirement.id, requirement.revision)));
      return;
    }
    await this.ports.fail('acceptance-incomplete', `${item.id} asked for completion ${refusals} times with capability work unresolved: ${blocked.join('; ')}`);
  }

  async diagnosticsOf(gate: GateAttempt, audience: GateAudience = 'engineer'): Promise<{ id: string; cause: string | null; summary: string[] }> {
    const { records } = trackedScenarios(this.observe().history.lines);
    const waiting = new Map(this.events('gate-command-waiting')
      .filter(event => event.data.gate === gate.id)
      .map(event => [event.data.position, event.data.line] as const));
    return gateDiagnostics(gate, audience, new Map(records.map(record => [record.id, record.name])), waiting);
  }

  async readGate(id: string): Promise<GateAttempt | null> {
    const read = await this.ports.readRecord( runLayout.gate(id), runSchemas.gate);
    return read.kind === 'valid' ? (read.value as GateAttempt) : null;
  }  async reachReadinessOwned(signal: AbortSignal): Promise<boolean> {
    if (this.event('readiness-passed')) return true;
    const bound = this.observe().policy.limits.readinessRecoveries;
    let spent = 0;

    for (;;) {
      if (this.ports.ignoring()) return false;
      this.ports.requireSettled('Readiness cannot run');

      const attemptNumber = this.events('readiness-passed').length + this.events('readiness-failed').length + 1;
      const gateId = gateAttemptId(this.gates.gateCount() + 1);
      // Readiness runs on the branch the project is on. Its last step
      // creates the run branch, once the repository is clean and the
      // baseline passed; a branch git refuses fails readiness there.
      let head = await this.git.currentHead(this.projectRoot);
      const auditConfiguration = this.input.record.auditConfiguration;
      if (this.events('external-candidate-observed').length > 0 && !await this.git.isCleanRepository(this.projectRoot)) {
        const current = await this.ports.previewCandidateTree();
        if (this.events('external-candidate-observed').some(event => event.data.afterTree === current.tree)) {
          const id = `readiness-${current.tree}`;
          head = await commitReadinessRepair(this.ports.gateHost, this.gates, {
            schema: 'ramify-agent.readiness-repair-operation/1', id, head, tree: current.tree,
            message: `Retain observed readiness correction\n\nRamify-Run: ${this.input.record.jobId}\nRamify-Gate: ${id}\n`,
          });
        }
      }

      // A setup command without a receipt is rerun after its owner has settled.
      // The owner defines repeatability; an unfinished intent is no approval gate.
      await this.ports.write({ type: 'gate-started', data: { gate: gateId, checkpoint: 'readiness' } });
      let result = await runReadiness(this.options.configuredAudit, {
        runId: this.input.record.jobId,
        attempt: attemptNumber,
        projectRoot: this.projectRoot,
        gateDirectory: this.path(runLayout.gateOutput(gateId)),
        gateId,
        policy: this.observe().policy,
        projectConfig: this.input.record.projectConfig,
        auditConfiguration,
        index: this.observe().index,
        ramify: this.options.ramify,
        git: this.git,
        head,
        signal,
        commandExecution: this.options.commandExecution,
        started: this.gates.commandStarted(gateId, 'readiness'),
        waiting: this.gates.commandWaiting(gateId, 'readiness'),
      });

      // A stop can be accepted between the last readiness step and this
      // record. Keep the attempt, but never publish a readiness pass then.
      if ((signal.aborted || this.ports.ignoring()) && result.attempt.verdict === 'passed') {
        result = { ...result, attempt: readinessAttemptSchema.parse({ ...result.attempt,
          steps: result.attempt.steps.map(step => step.step === 'run-branch'
            ? { ...step, outcome: 'not-verified', detail: 'readiness was cancelled before publication' } : step),
          verdict: 'failed',
        }) };
      }
      if (this.ports.closed()) return false;

      if (result.attempt.verdict === 'passed' && result.gate !== null && !signal.aborted && !this.ports.ignoring()) {
        await this.ports.write({ type: 'readiness-passed', data: { attempt: attemptNumber, gate: gateId } }, [
          { path: runLayout.gate(gateId), id: gateId, revision: 1, body: result.gate },
          ...readinessAuditOutcome(result.gate),
          { path: runLayout.readiness(attemptNumber), id: String(attemptNumber), revision: 1, body: result.attempt },
        ]);
        await this.ports.afterWrite('readiness-attempted', this.input.record.jobId);
        return true;
      }

      const step = failingStep(result.attempt);
      const plan = signal.aborted || this.ports.ignoring() ? null : recoveryFor(result.attempt, result.gate, this.observe().policy, result.obstruction);
      const recoverable = plan !== null && spent < bound && !signal.aborted && !this.ports.ignoring();

      let recovery = null;
      if (recoverable) {
        recovery = await performRecovery({
          id: recoveryId(spent + 1),
          attempt: attemptNumber,
          plan,
          projectRoot: this.projectRoot,
          policy: this.observe().policy,
          auditConfiguration,
          ramify: this.options.ramify,
          commandExecution: this.options.commandExecution,
          count: spent + 1,
          directory: this.path('recoveries'),
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
      await this.ports.write({
        type: 'readiness-failed',
        data: { attempt: attemptNumber, gate: gateId, step: step?.step ?? 'unknown', detail: step?.detail ?? '', recovery: recovery?.id ?? null, final },
      }, records);
      await this.ports.afterWrite('readiness-attempted', this.input.record.jobId);

      if (signal.aborted || this.ports.ignoring()) return false;

      if (final) {
        if (result.obstruction !== undefined && this.observe().policy.recovery) {
          const resumed = await this.ports.waitOperationRecovery({ kind: 'readiness', checkpoint: 'readiness', candidate: head },
            { classification: 'check-execution', diagnostic: result.obstruction.diagnostic },
            this.events('readiness-failed').map(event => String(event.data.attempt)), spent);
          if (!resumed) return false;
          spent = 0;
          continue;
        }
        await this.ports.fail(readinessFailureReason(step?.step), `Readiness failed at ${step?.step ?? 'an unknown step'} after ${attemptNumber} attempt${attemptNumber === 1 ? '' : 's'}: ${step?.detail ?? ''}`,
          [runLayout.readiness(attemptNumber), ...(result.gate === null ? [] : [runLayout.gate(gateId)])]);
        return false;
      }
    }
  }

  async setupScratch(): Promise<void> {
    if (this.event('scratch-setup-complete') !== undefined) return;
    this.ports.requireSettled('Scratch setup cannot run');
    try {
      await this.performScratchSetup(false);
      await this.ports.afterWrite('scratch-setup-complete', this.input.record.jobId);
    } catch (error) {
      if (!(error instanceof ScratchSetupRefusal)) throw error;
      await this.ports.fail('readiness-failed', `Scratch setup failed before work: ${message(error)}`);
    }
  }

  async performScratchSetup(recovering: boolean): Promise<{ commit: string | null; appended: boolean }> {
    const ignoreFile = join(this.projectRoot, '.gitignore');
    const ignoreInfo = await lstat(ignoreFile).catch((error: unknown) => {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    });
    if (ignoreInfo?.isSymbolicLink()) throw new ScratchSetupRefusal(`project .gitignore is a symlink: ${ignoreFile}`);
    if (ignoreInfo !== null && !ignoreInfo.isFile()) throw new ScratchSetupRefusal(`project .gitignore is not a file: ${ignoreFile}`);
    const original = recovering
      ? this.event('scratch-setting-up')?.data.originalIgnoreBase64
      : await readFile(ignoreFile).then(bytes => bytes.toString('base64'), (error: unknown) => {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
        throw error;
      });
    if (original === undefined) throw new Error('Scratch setup recovery has no original .gitignore');
    return this.ports.effect<{ commit: string | null; appended: boolean }>({ serialization: 'whole',
      key: 'scratch-setup',
      intent: { event: { type: 'scratch-setting-up', data: { originalIgnoreBase64: original } }, records: [] },
      perform: async () => {
        await this.ports.afterWrite('scratch-setting-up', this.input.record.jobId);
        if (recovering) {
          const committed = await this.git.findCommitByTrailers(this.projectRoot, [
            { key: 'Ramify-Run', value: this.input.record.jobId },
            { key: 'Ramify-Scratch', value: 'setup' },
          ]);
          if (committed !== null) return { commit: committed, appended: true };
        }
        let committed: string | null = null;
        let appended = false;
        try {
          const modules = await declaredModuleDirectories(this.projectRoot);
          const prepared = await ensureScratchRule(this.projectRoot, modules, this.git);
          if (prepared.appended) await this.ports.afterWrite('scratch-rule-appended', this.input.record.jobId);
          if (!prepared.appended && !recovering) return { commit: null, appended: false };
          const changed = await this.git.changedPaths(this.projectRoot, this.ports.coordination.accepted());
          if (changed.some(path => path !== '.gitignore')) {
            throw new ScratchSetupRefusal(`unexpected working-tree changes: ${changed.join(', ')}`);
          }
          appended = prepared.appended || changed.length > 0;
          if (changed.length > 0) {
            await assertScratchSafe(this.projectRoot, modules, this.git);
            committed = await this.git.commitAccepted(this.projectRoot, [
              'Prepare module scratch ignore rule', '',
              `Ramify-Run: ${this.input.record.jobId}`,
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
        if (committed !== null) await this.ports.afterWrite('scratch-committed', this.input.record.jobId);
        return { commit: committed, appended };
      },
      complete: result => ({ event: { type: 'scratch-setup-complete', data: result }, records: [] }),
    });
  }

  async materializeScenarios(): Promise<void> {
    if (this.event('scenarios-materialized') !== undefined) return;
    if (this.gates.expectedFeatures().length === 0) return;
    this.ports.requireSettled('The feature files cannot be written');
    await this.performMaterialization(false);
    await this.ports.afterWrite('scenarios-materialized', this.input.record.jobId);
  }

  async performMaterialization(recovering: boolean): Promise<{ commit: string | null; files: string[] }> {
    const expected = this.gates.expectedFeatures();
    const files = expected.map(file => file.path);
    return this.ports.effect<{ commit: string | null; files: string[] }>({ serialization: 'whole',
      key: 'scenarios-materialize',
      intent: { event: { type: 'scenarios-materializing', data: { files } }, records: [] },
      perform: async () => {
        await this.ports.afterWrite('scenarios-materializing', this.input.record.jobId);
        const message = materializationMessage({
          planId: this.input.record.planId, runId: this.input.record.jobId, files, scenarios: trackedScenarios(this.observe().history.lines).records.length,
        });
        await assertScratchSafe(this.projectRoot, await declaredModuleDirectories(this.projectRoot), this.git);
        const commit = await commitForMaterialization(this.projectRoot, this.input.record.jobId, message, recovering, this.git, commit => this.verifyProducerCommit(expected, commit), () => this.renderProducerFeatures(expected));
        await this.ports.afterWrite('scenarios-committed', this.input.record.jobId);
        return { commit, files };
      },
      complete: result => ({ event: { type: 'scenarios-materialized', data: result }, records: [] }),
    });
  }

  async verifyProducerCommit(files: readonly RenderedFeatureFile[], commit: string): Promise<void> {
    const expected = new Map(files.map(file => [file.path, file.content]));
    const changed = await this.git.commitNameStatus(this.projectRoot, commit, undefined, { requireSingleParent: true });
    if (changed.some(change => !expected.has(change.path) || change.status === 'D')) throw new Error(`Recovered scenario producer commit ${commit} includes unrelated paths`);
    const entries = await this.candidates.treeEntries(this.projectRoot, commit);
    for (const [path, content] of expected) {
      if (!entries.some(entry => entry.path === path && ['file', 'executable'].includes(entry.kind)) ||
          await this.candidates.readBlob(this.projectRoot, commit, path) !== content) throw new Error(`Recovered scenario producer commit ${commit} does not contain exact rendered bytes: ${path}`);
    }
  }

  async renderProducerFeatures(expected: readonly RenderedFeatureFile[], isolated = false): Promise<void> {
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

  async validateHandbackBasis( input: CapabilityInput, proof: CapabilityHandbackBasis): Promise<void> {
    if (input.type !== 'capability-handed-back') throw new Error('Completion evidence belongs only to a capability handback');
    this.ports.requireSettled(`Capability ${input.data.task} cannot hand back an unsettled writer`);
    const recorded = gateAttemptSchema.safeParse(this.ports.committedBody( runLayout.gate(proof.gate.id)));
    const started = this.events('capability-verification-started').filter(event => event.data.task === input.data.task).at(-1);
    if (!recorded.success || recordHash(this.ports.committedBody( runLayout.gate(proof.gate.id))) !== proof.gateRecord.hash || recorded.data.audited !== proof.gate.audited || recorded.data.verdict !== proof.gate.verdict || recorded.data.proposedBy !== proof.gate.proposedBy || proof.gate.verdict !== 'passed' || proof.gate.audited === null ||
      started?.data.gate !== proof.gate.id || started.data.invocation !== input.data.invocation) {
      throw new Error(`Capability ${input.data.task} lost its accepted completion gate`);
    }
    if (started.data.completion !== undefined &&
      (recordHash(proof.acceptedBasis) !== recordHash(started.data.completion.acceptedBasis) || recordHash(proof.reconciliation) !== recordHash(started.data.completion.reconciliation))) {
      throw new Error(`Capability ${input.data.task} lost its retained completion basis`);
    }
    const currentTree = (await this.ports.previewCandidateTree()).tree;
    if (currentTree !== proof.candidateTree || await this.candidates.commitTree(this.projectRoot, proof.gate.audited) !== currentTree) {
      throw new CandidateDriftError(`Capability ${input.data.task} candidate changed before its atomic handback`);
    }
    if (recordHash(this.latestBasis(input.data.task) ?? null) !== recordHash(proof.reconciliation)) {
      throw new Error(`Capability ${input.data.task} reconciliation changed before its atomic handback`);
    }
    if (proof.acceptedBasis !== null) {
      const refused = await this.completionBasisRefusal(input.data.task, proof.gate, proof.acceptedBasis);
      if (refused !== null) throw new Error(`Capability ${input.data.task} lost its completion basis: ${refused}`);
    }
  }
}

const message = (error: unknown): string => error instanceof Error ? error.message : String(error);
class AssessmentRefusedError extends Error {}
function boundInputs(read: readonly CapturedInput[], bound: ReadonlyArray<{ readonly ref: string; readonly hash: string }>): CapturedInput[] {
  return bound.map(entry => {
    const found = read.find(input => input.ref === entry.ref);
    if (found === undefined) throw new Error(`${entry.ref} is no longer there`);
    if (found.hash !== entry.hash) throw new Error(`${entry.ref} has hash ${found.hash}, and the request bound ${entry.hash}`);
    return found;
  });
}
function resultText(result: ReviewResult): string {
  const concerns = (count: number) => `${count} concern${count === 1 ? '' : 's'}`;
  if (result.result === 'complete') return `complete, ${concerns(result.concerns)}`;
  if (result.result === 'partial') return `partial, ${concerns(result.concerns)}; not inspected: ${result.missing.map(entry => `${entry.path} (${entry.reason})`).join(', ')}`;
  return `not verified (${result.reason}): ${result.detail}`;
}

class ScratchSetupRefusal extends Error {
  constructor(detail: string) {
    super(detail);
    this.name = 'ScratchSetupRefusal';
  }
}
