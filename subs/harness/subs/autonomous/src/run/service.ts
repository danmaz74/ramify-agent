import { consultationOutcome, recordConsultationStart, recordConsultationOutcome, recordConsultationDelivery } from '../../subs/work-coordination/src/consultations/store.js';
import { taskKindFor } from '../../../task-workflow/src/prompts/tasks.js';
import { preparedGate } from '../../subs/acceptance/src/committing-gate.js';
import { Acceptance, type AcceptanceObservation } from '../../subs/acceptance/src/acceptance.js';
import type { AcceptanceJournal } from '../../subs/acceptance/src/acceptance-journal.js';



import { viewIdentityOf as projectViewIdentity } from '../../subs/work-coordination/src/project-facts.js';

import type { BriefAppend } from '../../subs/acceptance/src/completion.js';
import { writeOnce, readIfExists } from './artifacts.js';
import { rootModuleOf } from '../../subs/work-coordination/src/context.js';
import { WorkCoordination, type CoordinationObservation, type CoordinationEffect } from '../../subs/work-coordination/src/coordination.js';
import type { RunWrite } from './log.js';
import { coordinationHistory } from './coordination-history.js';
import { contractPublicationRefusal } from '../../subs/work-coordination/src/contracts/accept.js';
import { performInitialAnalysis } from '../../subs/planning/src/planning.js';
import { planPointer, capturedPlanBlock } from '../../subs/planning/src/messages.js';
import { verifiedCandidateSource } from '../../../evidence/src/git-text.js';

import { observeExternalCandidate } from '../../subs/acceptance/src/candidate-attribution.js';
import { recordedExternalChanges } from '../../subs/acceptance/src/recovery-gate.js';
import { decideTaskReentry, mayRetryTask, taskInterruption, taskRetryDelay } from '../../../recovery/src/reentry.js';

import { repairPreparationSchema } from '../../subs/work-coordination/src/repair/repair-preparation.js';



import { type RepairExportConfiguration } from './repair-export.js';




import { ownershipAuthorityFor } from '../../../../src/work/ownership-authority.js';




import type { ProvisionalSourceGit } from '../../../evidence/src/provisional-git.js';
import { type CommandRunner } from '../../../evidence/src/run-command.js';



import { mkdir, readFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import type { AgentPort, AgentSession, SessionSpec } from '../../../agent/src/interfaces/port.js';
import { gitCandidateSource, gitChangeHistory, gitService, type CandidateSource, type ChangeHistory, type GitService } from '../../../evidence/src/git.js';
import type { RamifyCli } from '../../../evidence/src/ramify-cli.js';

import { type ArchitectIndex } from '../../../evidence/src/views.js';


import type { ConfiguredAuditPort } from '../../../audit/src/check-execution.js';




import { selectCheckFindings } from '../../../check-findings/src/queries.js';

import type { CheckFindingCommand, CheckFindingQueryInput, CheckFindingSelection } from '../../../check-findings/src/interfaces/check-findings.js';
import type { CheckFindingCause } from '../../../../src/check-findings/records.js';
import { checkFindingStateOf } from '../../../../src/check-findings/state.js';
import { commitCheckFindingChange, decideCheckFindingTransaction, type CheckFindingBuild, type CheckFindingCommit } from '../../../../src/check-findings/transition.js';
import { reportCommand } from '../../../../src/check-findings/report.js';
import { configuredAuditInstabilityObservations } from '../../../audit/src/check-execution.js';
import { reconciliationAssessmentSchema, reconciliationLayout } from '../../subs/acceptance/src/reviews/reconciliation.js';



import { outsideScope } from '../../../../src/run/mutations.js';

import { capabilityRecordSection, capabilitySourceSection, capabilityViewInputs } from '../../subs/work-coordination/src/capability/delivery.js';
import { capabilityLayout } from '../../subs/work-coordination/src/capability/records.js';
import { capabilityRunPolicyVersion, supportedCapabilityPolicy } from '../../subs/work-coordination/src/capability/policy.js';
import { createCapabilityWorkflow } from '../../subs/work-coordination/src/capability/workflow.js';
import { commitCapabilityTransition } from './capability-transition.js';


import type { CapabilityWorkflow } from '../../subs/work-coordination/src/capability/workflow.js';
import { userCheckFindingChange, userRejectionCode } from '../../../../src/check-findings/user-commands.js';
import type { CheckFindingUserCommand } from '../../../../src/interfaces/protocol/check-findings.js';
import { canonicalJson } from '../../../../src/jobs/commands.js';
import { reviewRequestSchema, type NotVerifiedReason } from '../../subs/acceptance/src/reviews/records.js';





import { reviewCoverage, reviewStateOf, unsettledRequests, type ReviewCoverage } from '../../subs/acceptance/src/reviews/state.js';

import type { AcceptedCommand, Receipt } from '../../../../src/interfaces/protocol/jobs.js';
import type { ViewIdentity } from '../../../../src/interfaces/protocol/evidence.js';
import { roleDisplayName, breakpointSelectorSchema, type BreakpointState, type DebugExchange, type DebugInspection, type Role, type RunCommand, type RunFailureReason } from '../../../../src/interfaces/protocol/runs.js';
import { CommandLedger, CommandRejection } from '../../../../src/jobs/commands.js';
import { commitRecord, readCommitted, recoverCommits, type RecordRef as CommitRecord } from '../../../../src/jobs/commit.js';
import { Mutex, PriorityMutex } from '../../../../src/jobs/mutex.js';
import { declaredSchemaOf, jobSchemaVersion, listJobDirectories, newJobId, planStateDirectory } from '../../../../src/jobs/records.js';
import { ensureStateDirectory } from '../../../../src/store/state-directory.js';
import { readPlan } from '../../../../src/plans/discover.js';
import { discoverDocuments } from '../../../plan-evidence/src/discovery.js';
import { verifyDocumentBytes } from '../../../plan-evidence/src/interfaces/contracts.js';



import { readAcceptedEvidence, acceptedAnalysisReferences } from '../../subs/planning/src/evidence.js';
import { assessmentSchema, type Assessment } from '../../../nonfunctional/src/interfaces/contracts.js';
import { preparedCandidateSchema } from '../../subs/acceptance/src/nonfunctional-records.js';







import { documentChanges, readCapturedDocuments } from '../../subs/planning/src/documents.js';
import { type RecoveryRuntime } from './recovery-admission.js';
import { compatibleAuditRepair } from '../../subs/acceptance/src/audit-configuration.js';
import { commitReadinessRepair, readinessRepairOperationPath, readinessRepairOperationSchema } from '../../subs/acceptance/src/readiness-commit.js';
import { operationRecoverySchema, type OperationRecovery, type RecoveryBoundary } from './records.js';
import { recoveryInspectionSchema, restartInspectionSchema, type RestartInspection, type RecoveryInspection } from '../../../../src/interfaces/protocol/runs.js';
import type { InterruptionEvidence } from '../../../agent/src/interfaces/port.js';
import { composeTaskBrief } from '../../../task-workflow/src/task-brief.js';

import { committedBody, invocationRecord, InvocationRunner, type InvocationRequest, type LiveInvocation, type RunnerHost, type RunnerContext } from '../../../task-workflow/src/steps/runner.js';
import { finished, kept, type InvocationResult, type SessionKeeping } from '../../../task-execution/src/results.js';





import { loadPromptPackages, sha256, type LoadedPackage } from '../../../../src/prompts/packages.js';

import { captureSnapshot, revisionMismatch, rootModuleOfSnapshot } from '../../../kpi/src/capture.js';
import { supportDocument } from '../../../kpi/src/measurement/inputs.js';
import { cachedChangeHistory } from '../../../kpi/src/delivered.js';



import { globalContext } from '../../subs/work-coordination/src/architecture/context.js';

import { isPlanDeviation } from '../../subs/acceptance/src/deviations/finding.js';

















import { type IterationAssignment, type IterationResult } from '../../subs/work-coordination/src/work/iterations.js';
import { type WriteScope } from '../../../../src/work/scope.js';
import { renderTranscript } from '../../subs/work-coordination/src/work/failure.js';

import { deniedFiles, protectedScopeOf } from '../../../../src/work/scope.js';
import { committedRecords } from './committed-records.js';


import { iterationApiViews } from '../../subs/work-coordination/src/work/session.js';





import { AfterHandling, type HandlingHost } from '../../subs/acceptance/src/after-handling.js';

import { obligationProjection, pendingCorrection, verifiedRequirements } from '../../subs/work-coordination/src/work/history.js';
import { CommittingGates, type GateHost } from '../../subs/acceptance/src/committing-gate.js';
import { capturePlan, EvidenceUnavailableError, type RunInputs } from './inputs.js';
import { extractPlanScenarios } from '../../../scenarios/src/extraction.js';

import { CorruptRunLogError, RunLog, type RunEvent, type RunEventInput } from './log.js';
import { ObservationLog } from '../../../task-execution/src/observations.js';

import { defaultRunPolicy, withProjectTimeouts } from '../../../../src/run/policy.js';
import { captureProjectConfig, resolveBeadsProjectConfig } from '../../../../src/run/project-config.js';
import { BeadsSessions } from '../../../../src/run/beads-sessions.js';


import { briefed } from '../../subs/work-coordination/src/work/scenario-briefing.js';

import { declaredModuleDirectories } from '../../../../src/run/project-config.js';

import { assertScratchSafe } from '../../subs/work-coordination/src/work/scratch.js';
import { gateAttemptSchema, type GateOperation } from '../../subs/acceptance/src/gate-records.js';
import type { GateAttempt } from '../../subs/acceptance/src/checks/records.js';
import { runDirectory } from './records.js';
import { measurementSnapshotSchema, snapshotId, type MeasurementSnapshot } from '../../../kpi/src/run-records.js';
import { runLayout, runRecordSchema, runSchemas, type RunPolicy, type RunRecord } from './records.js';
import { invocationOutcomeSchema, type InvocationOutcome, type DurableRecordRef as RecordRef, type ContinueReason, type ContinueRelation, type DegradeRelation, type SessionFinishReason, type SessionId } from '../../../task-execution/src/records.js';
import { type RunSessions } from './sessions.js';
import { runSnapshot, type RunSnapshot } from './snapshot.js';
import { InvocationTranscript, recordAppend } from '../../../task-execution/src/transcripts/recorder.js';
import { ContentStore } from '../../../task-execution/src/transcripts/store.js';
import { readBody, readTranscript, TranscriptWriter } from '../../../task-execution/src/transcripts/writer.js';

import { nodeProcessGroups, WriterBlockedError, WriterOwnership, type ProcessGroups, type TreeObserver } from '../../../task-execution/src/writer.js';
import { HarnessSessionOperations } from '../../../../src/prompts/session-adapter.js';
import { readSessionPointReference, type HarnessTaskBrief } from '../../../task-execution/src/session-operations.js';
import { deliveredSupportPaths } from '../../../task-workflow/src/prompts/tasks.js';
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


/**
 * What one iteration ended with: the result that closed it, and the need it
 * reported where the behavior it required is owned outside its scope.
 */
/** What one contract iteration ended with: its result, and what its registration found. */


class Run {
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
  /** Patch preparation belongs to its review request and stops with its readers. */
  /** Why the run stopped its readers, which a reader stopped for it records as its attempt's reason. */
  readerStop: NotVerifiedReason | undefined;
  /** The design orientations being made, by key, so that two attempts of one key make it once. */
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
  get policy(): RunRecord['policy'] { return this.record.policy; }
  get baselineMeasurement(): RecordRef | null { return 'measurement' in this.record.baseline ? this.record.baseline.measurement : null; }

  /** The sessions of every open invocation, the writer's and the readers'. */
  sessions(filter: (live: LiveInvocation) => boolean = () => true): AgentSession[] {
    return [...this.live.values()].filter(filter).flatMap(live => (live.session === undefined ? [] : [live.session]));
  }

  /** Settles once the driver, every open invocation and every review attempt have finished. */
  reviewSettlement: () => Promise<void> = async () => undefined;
  async idle(): Promise<void> {
    await this.done;
    await this.reviewSettlement();
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
  private readonly restartUnavailable = new Map<string, { message: string; record: 'record' | 'events' }>();
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
    this.runner = new InvocationRunner(this.runnerHost());

  }

  /** The handling after an accepted submission, which a manual run's `after` shares. */
  private readonly handlings = new WeakMap<Run, AfterHandling>();
  private handling(run: Run): AfterHandling {
    let value = this.handlings.get(run);
    if (value === undefined) { value = new AfterHandling(this.handlingHost(run)); this.handlings.set(run, value); }
    return value;
  }

  /** What the after-handling asks of an implementation run. */

  private readonly acceptances = new WeakMap<Run, Acceptance>();
  private acceptance(run: Run): Acceptance {
    let value = this.acceptances.get(run);
    if (value !== undefined) return value;
    const coordinator = this.coordination(run);
    const journal = this.acceptanceJournal(run);
    let acceptedReading: ReturnType<AcceptanceJournal['observe']> | undefined;
    let observation: AcceptanceObservation | undefined;
    const observe = (): AcceptanceObservation => {
      const reading = journal.observe();
      if (observation !== undefined && reading === acceptedReading && observation.restoring === run.restoring && observation.readerStop === run.readerStop) return observation;
      acceptedReading = reading;
      observation = { ...reading, findings: structuredClone(checkFindingStateOf(run.log.ledger)), restoring: run.restoring, readerStop: run.readerStop };
      return observation;
    };
    value = new Acceptance({ projectRoot: this.projectRoot, directory: run.directory, record: structuredClone({ jobId: run.record.jobId, planId: run.record.planId, manifest: run.record.manifest, projectConfig: run.record.projectConfig, auditConfiguration: run.record.auditConfiguration }), workflow: this.workflow?.version ?? null,
      options: { ramify: this.options.ramify, commandExecution: this.options.commandExecution, configuredAudit: this.options.configuredAudit }, git: this.git, candidates: this.candidates,
      gates: this.gates(run), handling: this.handling(run),
    }, {
      ...journal,
      observe,
      closed: () => this.closed, notify: () => run.notify(), changed: () => run.changed(),
      requireSettled: reason => run.writer.requireSettled(reason), registerWriter: (invocation, pid) => run.writer.register(invocation, pid),
      operations: agent => this.operations(agent), session: session => structuredClone(this.sessionsOf(run)?.get(session)), sessionState: session => this.sessionsOf(run)?.get(session)?.state,
      recordAppend: (session, note, sequence) => recordAppend(this.transcriptOf(run, session), note, sequence),
      readRecord: async (path, schema) => structuredClone(await readCommitted(run.log.ledger, path, schema)),
      commitFinding: (build, at) => commitCheckFindingChange(run, ({ state }) => build({ state: structuredClone(state) }), at),
      gateHost: this.gateHost(run),
      coordination: {
        accepted: (...args) => coordinator.accepted(...args),
        architectViewInputs: (...args) => coordinator.architectViewInputs(...args),
        assignmentStartingPoints: (...args) => coordinator.assignmentStartingPoints(...args),
        auditPreparationPaths: (...args) => coordinator.auditPreparationPaths(...args),
        baselineReference: (...args) => coordinator.baselineReference(...args),
        baselineSnapshot: (...args) => coordinator.baselineSnapshot(...args),
        checkInputSection: (...args) => coordinator.checkInputSection(...args),
        currentSelection: (...args) => coordinator.currentSelection(...args),
        deniedFiles: (...args) => coordinator.deniedFiles(...args),
        engineerStartingPoints: (...args) => coordinator.engineerStartingPoints(...args),
        fakeNamingRule: (...args) => coordinator.fakeNamingRule(...args),
        finishCapabilityHandback: (...args) => coordinator.finishCapabilityHandback(...args),
        frozenCatalog: (...args) => coordinator.frozenCatalog(...args),
        guardedScenarioFiles: (...args) => coordinator.guardedScenarioFiles(...args),
        implementationTools: (...args) => coordinator.implementationTools(...args),
        packageText: (...args) => coordinator.packageText(...args),
        planPackage: (...args) => coordinator.planPackage(...args),
        recordLineEvents: (...args) => coordinator.recordLineEvents(...args),
        stepFallback: (...args) => coordinator.stepFallback(...args),
        takeWorkItems: (...args) => coordinator.takeWorkItems(...args),
        verifiedRequirements: (...args) => coordinator.verifiedRequirements(...args),
      },
      afterWrite: (...args) => this.afterWrite(...args),
      committedBody: (...args) => structuredClone(this.committedBody(run, ...args)),
      effectiveInvocationOutcome: (...args) => structuredClone(this.effectiveInvocationOutcome(run, ...args)),
      endRun: (...args) => this.endRun(run, ...args),
      fail: (...args) => this.fail(run, ...args),
      finishSession: (...args) => this.finishSession(run, ...args),
      ignoring: (...args) => this.ignoring(run, ...args),
      invocationRecord: (...args) => structuredClone(this.invocationRecord(run, ...args)),
      now: (...args) => this.now(...args),
      ownershipAuthority: (...args) => this.ownershipAuthority(run, ...args),
      previewCandidateTree: (...args) => this.previewCandidateTree(...args),
      recordedRunBase: () => this.recordedRunBase(run.record, run.log),
      refreshIndex: async (...args) => structuredClone(await this.refreshIndex(run, ...args)),
      waitOperationRecovery: (...args) => this.waitOperationRecovery(run, ...args),
      runInvocation: <T>(agent: AgentPort, request: InvocationRequest<T>) => this.runInvocation(run, agent, request),
      warn: (...args) => this.warn(...args),
      write: (...args) => this.write(run, ...args),
    });
    const acceptance = value;
    run.reviewSettlement = () => acceptance.reviewsSettled();
    this.acceptances.set(run, value);
    return value;
  }

  private coordination(run: Run): WorkCoordination {
    const present = this.coordinators.get(run);
    if (present !== undefined) return present;
    let cached: CoordinationObservation | undefined;
    let index: ArchitectIndex | null | undefined;
    let policy: RunPolicy | undefined;
    const observe = (): CoordinationObservation => {
      const version = run.log.version;
      if (cached !== undefined && cached.version === version && index === run.index && policy === run.policy && cached.restoring === run.restoring) return cached;
      index = run.index; policy = run.policy;
      const history = coordinationHistory(run.log);
      const lines = history.lines;
      cached = Object.freeze({ version, history, records: committedRecords(lines), index: structuredClone(run.index), policy: structuredClone(run.policy),
        restoring: run.restoring, findings: structuredClone(checkFindingStateOf(run.log.ledger)),
        pendingEffects: run.log.ledger.pendingEffects().map(effect => effect.key) });
      return cached;
    };
    const coordinator = new WorkCoordination({ projectRoot: this.projectRoot, directory: run.directory, base: run.base,
      record: structuredClone({ jobId: run.record.jobId, planId: run.record.planId, baseline: run.record.baseline, manifest: run.record.manifest, auditConfiguration: run.record.auditConfiguration, projectConfig: run.record.projectConfig }),
      workflow: this.workflow?.version ?? null, options: { ramify: this.options.ramify, rootModule: this.options.rootModule, commandExecution: this.options.commandExecution, provisionalSourceGit: this.options.provisionalSourceGit, skillDirectory: this.options.skillDirectory },
      git: this.git, candidates: this.candidates, repairIncidentExport: this.repairIncidentExport,
    }, {
      commitFinding: (build, at) => commitCheckFindingChange(run, ({ log, state }) => build({ history: coordinationHistory(log), state: structuredClone(state) }), at),
      acceptance: { dischargeEvidence: (...args) => this.acceptance(run).dischargeEvidence(...args), diagnosticsOf: (...args) => this.acceptance(run).diagnosticsOf(...args), readGate: (...args) => this.acceptance(run).readGate(...args) },
      restoreInvocation: id => { run.restoredInvocations.add(id); },
      runParallelReview: <T>(agent: AgentPort, request: InvocationRequest<T>) => this.runner.runInvocation(this.runnerContext(run), agent, request),
      invocationRefusal: () => this.invocationRefusal(run), latestOperationRecovery: () => this.latestOperationRecovery(run),
      renderInvocationTranscript: async (session, invocation) => { await this.transcriptOf(run, session).drain(); const read = await readTranscript(run.path(runLayout.transcript(session))); return renderTranscript(read.entries, invocation, body => readBody(run.directory, run.store, body)); },
      operations: agent => this.operations(agent),
      observe, notify: () => run.notify(), changed: () => run.changed(), wakeReviews: () => this.acceptance(run).wakeReviews(),
      settleIterationReviews: (iteration, candidate) => this.acceptance(run).settleIterationReviews(iteration, candidate),
      reportGateInstability: gate => this.reportGateInstability(run, gate),
      sessionState: session => this.sessionsOf(run)?.get(session)?.state,
      hasSessionPoint: async (agent, runId, point) => (await this.operations(agent)).hasPoint(runId, point),
      appendSession: async (agent, ...args) => (await this.operations(agent)).append(...args),
      recordAppend: (session, note, sequence) => recordAppend(this.transcriptOf(run, session), note, sequence),
      commitCapability: (input, records, qualification) => run.mutex.run(async () => {
        if (input.type === 'capability-handed-back' && qualification === undefined) throw new Error('Capability handback requires its exact accepted completion basis');
        if (qualification !== undefined) await this.acceptance(run).validateHandbackBasis( input, qualification);
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
      writer: { requireSettled: reason => run.writer.requireSettled(reason), register: (invocation, pid) => run.writer.register(invocation, pid), blocked: () => run.writer.blocked ?? null, unsettled: () => run.writer.isUnsettled },
      afterWrite: (...args) => this.afterWrite(...args),
      committedBody: (...args) => structuredClone(this.committedBody(run, ...args)),
      completeWorkItem: (...args) => this.acceptance(run).completeWorkItem(...args),
      contractGate: (...args) => this.acceptance(run).contractGate(...args),
      diagnosticsOf: (...args) => this.acceptance(run).diagnosticsOf(...args),
      effectiveInvocationOutcome: (...args) => structuredClone(this.effectiveInvocationOutcome(run, ...args)),
      engineerGuard: (...args) => this.engineerGuard(run, ...args),
      fail: (...args) => this.fail(run, ...args),
      finishSession: (...args) => this.finishSession(run, ...args),
      ignoring: (...args) => this.ignoring(run, ...args),
      invocationRecord: (...args) => structuredClone(this.invocationRecord(run, ...args)),
      latestBasis: (...args) => this.acceptance(run).latestBasis(...args),
      now: (...args) => this.now(...args),
      ownershipAuthority: (...args) => this.ownershipAuthority(run, ...args),
      pendingCorrection: (...args) => this.acceptance(run).pendingCorrection(...args),
      previewCandidateTree: (...args) => this.previewCandidateTree(...args),
      reconcileWorkItem: (...args) => this.acceptance(run).reconcileWorkItem(...args),
      reconciliationBriefing: (...args) => this.acceptance(run).reconciliationBriefing(...args),
      refreshIndex: async (...args) => structuredClone(await this.refreshIndex(run, ...args)),
      renderProducerFeatures: (...args) => this.acceptance(run).renderProducerFeatures(...args),
      runInvocation: <T>(agent: AgentPort, request: InvocationRequest<T>) => this.runInvocation(run, agent, request),
      unresolvedOf: (...args) => this.acceptance(run).unresolvedOf(...args),
      verifyCapabilityHandback: (...args) => this.acceptance(run).verifyCapabilityHandback(...args),
      verifyProducerCommit: (...args) => this.acceptance(run).verifyProducerCommit(...args),
      waitOperationRecovery: (...args) => this.waitOperationRecovery(run, ...args),
      warn: (...args) => this.warn(...args),
      write: (...args) => this.write(run, ...args),
      handling: {
        recordBindings: (...args) => this.handling(run).recordBindings(...args),
        requestReviews: (...args) => this.handling(run).requestReviews(...args),
        closeIteration: (...args) => this.handling(run).closeIteration(...args),
        recordAssignment: (...args) => this.handling(run).recordAssignment(...args),
        reviseOutline: (...args) => this.handling(run).reviseOutline(...args),
        recordObligations: (...args) => this.handling(run).recordObligations(...args),
        cleanupClosedScratch: (...args) => this.handling(run).cleanupClosedScratch(...args),
      },
      gates: {
        iterationGate: (...args) => this.gates(run).iterationGate(...args),
        workItemGate: (...args) => this.gates(run).workItemGate(...args),
        validateFeatureTargets: (...args) => this.gates(run).validateFeatureTargets(...args),
        expectedFeatures: (...args) => this.gates(run).expectedFeatures(...args),
        writtenFeatures: (...args) => this.gates(run).writtenFeatures(...args),
      },
    });
    this.coordinators.set(run, coordinator);
    return coordinator;
  }

  /** Recheck the exact acceptance basis under the same serialization as the domain handback. */


  private handlingHost(run: Run): HandlingHost {
    const service = this;
    return {
      ...this.acceptanceJournal(run),
      get projectRoot() { return service.projectRoot; },
      get git() { return service.git; },
      get candidates() { return service.candidates; },
      get gates() { return service.gates(run); },
      write: (input, records) => service.write(run, input, records),
      afterWrite: (write, runId) => service.afterWrite(write, runId),
      warn: text => service.warn(text),
      ignoring: () => service.ignoring(run),
      fail: (reason, detail, records) => service.fail(run, reason, detail, records),
      closeCorrection: (workItem, closing) => service.acceptance(run).closeCorrection( workItem, closing),
      citeCurrentDeviations: (elements) => service.coordination(run).citeCurrentDeviations(elements),
      orientationIdentity: () => ({ packageHash: run.record.prompts.reviewer?.hash ?? null, agent: run.record.agent, model: service.options.model ?? null }),
      wakeReviews: () => this.acceptance(run).wakeReviews(),
    };
  }

  /** The committing gates of every run, which a manual run's gate shares. */
  private readonly gateInstances = new WeakMap<Run, CommittingGates>();
  private gates(run: Run): CommittingGates {
    let value = this.gateInstances.get(run);
    if (value === undefined) { value = new CommittingGates(this.gateHost(run)); this.gateInstances.set(run, value); }
    return value;
  }
  private acceptanceJournal(run: Run): AcceptanceJournal {
    const prepared = new WeakMap<object, import('../../../ledger/src/ledger.js').Transaction<RunEvent>>();
    let reading: ReturnType<AcceptanceJournal['observe']> | undefined;
    let index: ArchitectIndex | null | undefined;
    let policy: RunPolicy | undefined;
    const observe = (): ReturnType<AcceptanceJournal['observe']> => {
      if (reading !== undefined && reading.version === run.log.version && index === run.index && policy === run.policy) return reading;
      index = run.index; policy = run.policy;
      reading = { history: coordinationHistory(run.log), version: run.log.version, terminal: run.log.terminal, policy: structuredClone(run.policy), pendingEffects: run.log.ledger.pendingEffects().map(effect => effect.key), index: structuredClone(run.index) };
      return reading;
    };
    return {
      identity: { jobId: run.jobId, planId: run.planId, directory: run.directory, base: run.base },
      observe,
      publish: decide => run.mutex.run(async () => {
        const proposal = await decide();
        if (proposal.transaction !== undefined) {
          const { event, records, at } = proposal.transaction;
          await run.log.ledger.append({ event: run.log.next(event, at), records });
        }
        return proposal.value;
      }),
      decideFinding: (build, at) => {
    const decided = decideCheckFindingTransaction(run.log, ({ state }) => build({ state: structuredClone(state) }), at);
    if (decided.kind !== 'transaction') return decided;
    const publication = Object.freeze({ kind: 'prepared-finding-publication' as const });
    prepared.set(publication, decided.transaction);
    return { kind: 'transaction', transaction: publication };
   },
      effect: spec => {
        const transaction = (value: import('../../subs/acceptance/src/acceptance-journal.js').AcceptanceTransaction) => { if ('kind' in value) { const held = prepared.get(value); if (held === undefined) throw new Error('Unrecognized finding publication'); return held; } return { event: run.log.next(value.event), records: value.records }; };
        const intent = spec.intent;
        const apply = () => run.log.ledger.effect({ ...spec, ...(spec.serialization === 'whole' ? {} : { serialize: <T>(work: () => Promise<T>) => run.mutex.run(work) }),
          intent: typeof intent === 'function' ? () => transaction(intent()) : transaction(intent),
          complete: result => transaction(spec.complete(result)),
        });
        const effect = spec.serialization === 'whole' ? run.mutex.run(apply) : apply();
        if (spec.trackGate) run.gating = effect;
        void effect.finally(() => { if (run.gating === effect) run.gating = undefined; }).catch(() => undefined);
        return effect;
      },
      write: (input, records) => this.write(run, input, records),
      afterWrite: (write, runId) => this.afterWrite(write, runId),
    };
  }

  /** What a committing gate asks of an implementation run. */
  private gateHost(run: Run): GateHost {
    const service = this;
    return {
      ...this.acceptanceJournal(run),
      requireSettled: reason => run.writer.requireSettled(reason),
      get projectRoot() { return service.projectRoot; },
      get git() { return service.git; },
      get ramify() { return service.options.ramify; },
      get configuredAudit() { return service.options.configuredAudit; },
      write: (input, records) => service.write(run, input, records),
      afterWrite: (write, runId) => service.afterWrite(write, runId),
      warn: text => service.warn(text),
      iterationCandidatePrepared: async candidate => {
        const assignment = committedRecords(coordinationHistory(run.log).lines).assignments.get(candidate.iteration);
        const reviewOwner = assignment?.coordination?.kind === 'capability-task'
          ? assignment.coordination.id : candidate.workItem;
        const retained = run.log.all('iteration-candidate-prepared').find(event => event.data.gate === candidate.gate);
        if (retained !== undefined && (retained.data.candidate !== candidate.commit || retained.data.tree !== candidate.tree
          || retained.data.base !== candidate.base || retained.data.workItem !== reviewOwner))
          throw new Error(`Gate ${candidate.gate} candidate changed after preparation`);
        if (retained === undefined) {
          const written = await service.write(run, { type: 'iteration-candidate-prepared', data: {
            gate: candidate.gate, workItem: reviewOwner, iteration: candidate.iteration,
            candidate: candidate.commit, tree: candidate.tree, base: candidate.base,
          } });
          if (written === 'ended') return;
        }
      },
      scheduleIterationReviews: async candidate => {
        const retained = run.log.all('iteration-candidate-prepared').find(event => event.data.gate === candidate.gate);
        if (retained === undefined || retained.data.candidate !== candidate.commit || retained.data.base !== candidate.base)
          throw new Error(`Gate ${candidate.gate} has no retained candidate for review scheduling`);
        await service.handling(run).requestReviews({ workItem: retained.data.workItem, iteration: candidate.iteration,
          gate: candidate.gate, commit: candidate.commit, base: candidate.base });
      },
      reportInstability: attempt => service.reportGateInstability(run, attempt),
      harnessFiles: () => service.coordination(run).harnessFiles(),
      auditDefinition: async (sourceCommit) => {
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
      refreshIndex: async () => structuredClone(await service.refreshIndex(run)),
      ignoring: () => service.ignoring(run),
      recoverGate: (attempt, diagnostic, group, attempts) => service.waitOperationRecovery(run,
        { kind: 'gate', checkpoint: attempt.checkpoint, work: { ...attempt.subject }, candidate: attempt.audited ?? attempt.head },
        { classification: 'check-execution', diagnostic }, attempts, attempt.infrastructureAttempt, group),
      awaitGateAdmission: () => service.awaitGateAdmission(run),
      retryGateDelay: async (milliseconds) => {
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
  private readonly runner: InvocationRunner;

  /** What only an implementation run knows, which the invocation runner asks of it. */
  private runnerHost(): RunnerHost {
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
      previewCandidateTree: () => service.previewCandidateTree(),
    };
  }

  private readonly runnerContexts = new WeakMap<Run, RunnerContext>();

  /** Bound workflow operations; lifecycle authority never leaves this owner. */
  private runnerContext(run: Run): RunnerContext {
    const previous = this.runnerContexts.get(run);
    if (previous) return previous;
    const service = this;
    const consultationJournal = () => ({
      events: structuredClone(run.log.events), records: structuredClone(run.log.ledger.replay().flatMap(line => line.transaction.records)),
      append: (input: RunEventInput, records: readonly CommitRecord[]) => run.log.ledger.append({ event: run.log.next(input), records: [...records] }),
    });
    const context: RunnerContext = {
      jobId: run.jobId, planId: run.planId, directory: run.directory,
      get policy() { return structuredClone(run.policy); },
      get baselineMeasurement() { return structuredClone(run.baselineMeasurement); },
      get index() { return structuredClone(run.index); }, store: run.store,
      path: relative => run.path(relative), events: () => structuredClone(run.log.events), record: (path, selection) => {
        const records = run.log.ledger.replay().flatMap(line => line.transaction.records).filter(record => record.path === path);
        return structuredClone(selection === 'first' ? records[0] : records.at(-1));
      },
      write: (input, records, at) => service.write(run, input, records, at),
      admit: (prepare, priority) => run.starting.run(prepare, priority),
      register: (id, role, reader) => {
        let closed!: () => void;
        const live: LiveInvocation = { role, reader, session: undefined, done: new Promise<void>(resolve => { closed = resolve; }) };
        run.live.set(id, live);
        return { publish: session => { if (run.live.get(id) === live) live.session = session; }, close: () => { if (run.live.get(id) === live) run.live.delete(id); closed(); } };
      },
      writerUnsettled: () => run.writer.isUnsettled, writerBlocked: () => run.writer.blocked !== undefined,
      ownsWriter: id => run.writer.held === id, acquireWriter: id => run.writer.acquire(id),
      releaseWriter: (id, session) => run.writer.release(id, session), unsettledWriter: (id, reason, session) => run.writer.markUnsettled(id, reason, session),
      consultation: id => structuredClone(consultationOutcome(consultationJournal(), id)),
      startConsultation: value => run.mutex.run(async () => structuredClone(await recordConsultationStart(consultationJournal(), value))),
      finishConsultation: value => run.mutex.run(async () => structuredClone(await recordConsultationOutcome(consultationJournal(), value))),
      deliverConsultation: (id, result) => run.mutex.run(async () => structuredClone(await recordConsultationDelivery(consultationJournal(), id, result))),
      ignoring: () => service.ignoring(run), base: () => service.coordination(run).accepted(),
      resourceInvocation: (agent, request) => service.recoverableInvocation(run, agent, request),
      refusal: () => service.invocationRefusal(run), refused: async (reason, reader) => { if (!reader) await service.fail(run, 'limit-exceeded', reason); },
      taskBrief: (request, spec, limits) => service.taskBrief(run, request, spec, limits),
      restore: (agent, request) => run.restoring && request.restore !== false ? service.restoreInvocation(run, agent, request) : Promise.resolve(null),
    };
    this.runnerContexts.set(run, context);
    return context;
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
    return run.mutex.run(async () => {
      if (run.log.terminal || !await this.options.lock.held()) return 'ended';
      const refusal = contractPublicationRefusal(run.log.ledger.replay(), input, records);
      if (refusal !== null) throw refusal;
      if (records.length === 0) { await run.log.append(input, at); return 'committed'; }
      return commitRecord(run.log.ledger, { event: run.log.next(input), records: [...records] });
    });
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
    if (session === undefined) return;
    const written = await run.mutex.run(async () => {
      if (run.log.terminal || this.sessionsOf(run)?.get(session)?.state !== 'suspended') return false;
      await run.log.append({ type: 'session-finished', data: { session, reason } });
      return true;
    });
    if (written) await this.afterWrite('session-finished', run.record.jobId);
  }

  private continuationOf(run: Run, session: SessionId, reason: ContinueReason): ContinueRelation {
    return this.runner.continuationOf(this.runnerContext(run), session, reason);
  }

  private transcriptOf(run: Run, session: SessionId): TranscriptWriter {
    return this.runner.transcriptOf(this.runnerContext(run), session);
  }

  private invocationTranscript(run: Run, session: SessionId, invocation: string, observations?: ObservationLog): InvocationTranscript {
    return this.runner.invocationTranscript(this.runnerContext(run), session, invocation, observations);
  }

  private sessionsOf(run: Run): RunSessions | undefined {
    return this.runner.sessionsOf(this.runnerContext(run));
  }

  // Reviews

  /**
   * The run's review readers, created when its driver starts for a run whose
   * policy requests reviews. Each wake starts what the policy has room for.
   */


  /**
   * Starts a waiting design request's orientation before the request has a
   * slot: the orientation reads only the captured guidance, so it need not
   * wait for the readers ahead of it. The attempt that later forks it finds
   * it recorded or still being made. Nothing here settles the request; a
   * failure is met again, and recorded, by that attempt.
   */


  /**
   * The iterations that closed accepted after a module engineer's passing gate,
   * which are the ones a review request is owed for: their audited commit,
   * gate and assignment. Contract iterations establish agreements and are
   * not reviewed in this version.
   */


  /** A record body as the log committed it, never the materialized file. */
  private committedBody(run: Run, path: string): unknown {
    return committedBody(this.runnerContext(run), path);
  }

  /**
   * One attempt of one request, from its snapshot to its terminal record.
   * Answers whether a terminal record was committed: an attempt fenced by a
   * settled request, a run that ended or a service that is closing commits
   * nothing, and its reader's session was stopped and closed like any other.
   */


  /** A temporarily unavailable prerequisite leaves its ordinary review question pending. */




  /** Finish an accepted reader turn whose terminal review record was interrupted.
   * Its submitted bytes and settled outcome are durable; the candidate is
   * immutable, so concern grounds are recovered from that same audited tree. */


  /**
   * The ground, credibility and modules of each concern of a valid
   * submission, in concern order. The ground is the file the reviewer named,
   * with the hash of what `snapshot_read` answered; its credibility is the
   * provenance class of that file; the modules own the concern's locations
   * on the candidate's own module tree, else the work item's module. A
   * candidate whose module declarations cannot be read leaves only that
   * fallback, with a warning.
   */


  /**
   * Where one attempt's reviewer starts. Code review starts fresh. Scope
   * review forks the module architect at the point that produced its
   * assignment, and design review forks the orientation of its guidance,
   * made first where none exists yet. Only the existing scope recovery may
   * use the complete recorded assignment packet. Unavailable orientation
   * or session history uses the ordinary fresh review task.
   */


  /**
   * The design orientation of a request's guidance selection: the one the
   * log records for its key, or one made now, once, by a reviewer session
   * that reads the guidance and is kept. A failed orientation is recorded
   * too, so the run does not pay for it twice; its dependent design reviews
   * use their ordinary fresh task inputs.
   */






  /**
   * Commits one terminal attempt: its record, its valid submission and one
   * report per concern, as one line through the CheckFinding transition. A
   * request already settled or an attempt already finished is fenced, and a
   * terminal run refuses it; neither appends anything. A concern set the
   * transition refuses leaves the attempt not verified, never clean.
   */


  /** Finishes unsettled requests. A durable accepted reader submission is
   * completed first; only a turn with no accepted result becomes not verified. */


  /** Waits for every admitted review; only explicit stop or shutdown cancels readers. */


  /** Keeps a work item's requests pending until their actual outcomes or an explicit stop. */


  /** The run's review requests and coverage, from its log; undefined for an unknown run. */
  reviews(planId: string, runId: string, workItem?: string): { readonly coverage: ReviewCoverage; readonly requests: ReturnType<typeof unsettledRequests> } | undefined {
    this.refuseUnavailableRun(planId, runId);
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


  /** Every CheckFinding of one work item the query selects, all pages, in attention order. */


  /** The `outline-revised` that commits the work item's latest completion request. */


  /** The reconciliation of the work item's latest round, whose basis a completion's unresolved reasons are read against. */


  /**
   * The reconciliation whose repair intent the work item's next assignment
   * resolves: its latest assessment, where that chose a correction and no
   * assignment has resolved it yet.
   */


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


  /**
   * Commits one round's `reconciliation-started` with its basis, after
   * checking under the mutex that what was captured still holds. Stale when
   * it does not, and nothing is appended.
   */


  /**
   * Waits while a CheckFinding of the work item awaits a user's answer: the
   * answer is what the next round assesses. A stop or the service closing
   * ends the wait. Answers false once the run has ended.
   */


  /**
   * Where a reconciliation's fork starts: the module architect's point after
   * its completion request, or fresh with the complete packet and the reason
   * where that point is missing or unusable.
   */


  /** The one bounded packet of a round, from the log and the CheckFinding state. */


  /**
   * One round's fork: the packet, a submission validated against the basis
   * and the CheckFinding rules, and its commit. Refused when the fork ends
   * without an assessment or its basis no longer holds when it commits; null
   * once the run has ended.
   */


  /**
   * Commits one assessment and appends its brief to the module architect's
   * session, as the ledger's external effect keyed `brief:<reconciliation>`:
   * the intent is `reconciliation-assessed` with its record and every
   * CheckFinding event, decided under the mutex against the basis as it
   * stands; the effect is the append; the completion says what the append
   * did. The decisions are durable before any append, and a repeat after a
   * crash appends the same key once.
   */


  /**
   * The brief's append to the module architect's session. A lost session, a
   * failure and no session are outcomes, never thrown. A conflict, such as an
   * append while the session's turn is active, is a failure of this append
   * alone: the session is intact and the brief reaches its next input.
   */


  /**
   * What the architect's own session holds after the append: the point its
   * next turn continues from, the note in its transcript, or, where the
   * append did not land, the brief its next input carries from the log. Only
   * a session that can no longer be read is finished as lost; a conflict
   * leaves it in place.
   */


  /**
   * What the module architect's next turn is told of a reconciliation: the
   * correction it chose with the CheckFindings planned for repair, and the
   * brief of every round whose append did not land, read from the log.
   */


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


  /** Shared completion check for a work item or bounded capability task. */




  /**
   * Each open CheckFinding of a completing work item, and why it is left
   * open: left open by the architect or opened after the latest basis.
   * Read under the mutex.
   */


  /**
   * Why the gate's audited commit is not the reconciled source, or null when
   * it is, or when it differs from it only by the expected rendering of the
   * tracked feature files, byte for byte.
   */


  // Loading and recovery

  private readonly refusedPolicies = new Map<string, string>();
  private readonly refusedRecordFormats = new Map<string, string>();

  private refuseUnavailableRun(planId: string, runId: string): void {
    const format = this.refusedRecordFormats.get(key(planId, runId));
    if (format !== undefined) throw new CommandRejection('unsupported-version', `Run record format ${format} is not supported; the retained run cannot continue`, undefined, [`plans/${planId}/.harness/jobs/${runId}/${runLayout.record}`]);
    const recorded = this.refusedPolicies.get(key(planId, runId));
    if (recorded !== undefined) throw new CommandRejection('unsupported-version', `Run policy ${recorded} is refused by ${capabilityRunPolicyVersion}; a fresh run is required`, undefined, [`plans/${planId}/.harness/jobs/${runId}/${runLayout.record}`]);
    const unreadable = this.restartUnavailable.get(key(planId, runId));
    if (unreadable !== undefined) throw new CommandRejection('unreadable', unreadable.message, undefined,
      [`plans/${planId}/.harness/jobs/${runId}/${runLayout[unreadable.record]}`]);
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
          this.restartUnavailable.set(key(planId, jobId), { message: `Unsupported retained run policy ${recorded}`, record: 'record' });
          report.skipped.push(key(planId, jobId));
          this.warn(`Run policy ${recorded} is refused by ${capabilityRunPolicyVersion}; a fresh run is required`);
          continue;
        }
        const obsoleteFormat = (parsed as { identityContract?: unknown }).identityContract;
        if (obsoleteFormat !== undefined) {
          const recorded = typeof obsoleteFormat === 'string' ? obsoleteFormat : JSON.stringify(obsoleteFormat) ?? String(obsoleteFormat);
          this.refusedRecordFormats.set(key(planId, jobId), recorded);
          this.restartUnavailable.set(key(planId, jobId), { message: `Unsupported retained run record format ${recorded}`, record: 'record' });
          report.skipped.push(key(planId, jobId));
          this.warn(`Run record format ${recorded} is not supported; the retained run cannot continue`);
          continue;
        }
        const record = runRecordSchema.parse(parsed);
        if (record.jobId !== jobId || record.planId !== planId) throw new Error('job.json names another run');
        const log = await RunLog.open(join(directory, runLayout.events), jobId);
        const captured = await readCapturedDocuments(directory, record.manifest);
        if (!log.find('job-started')) throw new Error('Document capture stopped before the run was published');
        if (!log.find('document-manifest-committed')) await log.append({ type: 'document-manifest-committed', data: {
          manifest: record.manifest.documentManifest.path, hash: record.manifest.documentManifest.hash,
          documents: captured.manifest.documents.length,
        } });
        const base = await this.runBase(record, log);
        let loaded!: Run;
        loaded = new Run(record, directory, log, base, this.newWriter(record.policy, () => this.coordination(loaded).accepted()));
        run = loaded;
      } catch (error) {
        this.restartUnavailable.set(key(planId, jobId), error instanceof CorruptRunLogError
          ? { message: `Run ${jobId} requires a log of its current single-run events: ${message(error)}`, record: 'events' }
          : { message: `Run ${jobId} ${runLayout.record} cannot be loaded: ${message(error)}`, record: 'record' });
        report.skipped.push(key(planId, jobId));
        this.warn(`Skipping ${directory}: ${message(error)}. It declares ${declaredSchemaOf(await readJson(recordPath))}.`);
        continue;
      }
      this.runs.set(run.key, run);

      for (const event of run.log.ownEvents) if (event.type === 'operation-recovery-resumed' || event.type === 'stop-requested') this.commands.remember(event.data.command);
      const rewritten = await recoverCommits(run.log.ledger);
      if (rewritten.rewritten.length > 0) report.rematerialized.push(`${run.key}: ${rewritten.rewritten.length} record file(s)`);
      // A crash can land after the durable close event and before its
      // filesystem cleanup. Repeat the idempotent cleanup on every load.
      try {
        await this.handling(run).cleanupClosedScratch();
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
        await commitReadinessRepair(this.gateHost(run), this.gates(run), operation);
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
          perform: key => this.acceptance(run).appendReconciliationBrief(agent, key, record.data.parent, record.data.brief),
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
        await this.acceptance(run).performMaterialization(true);
        performed.push('the materialization of the feature files');
        continue;
      }
      if (event.type === 'scratch-setting-up') {
        await this.acceptance(run).performScratchSetup(true);
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
      let binding: { candidateId: string; tree: string; assessment?: Assessment } | undefined;
      if (operation.finalAssessment !== undefined) {
        const assessment = assessmentSchema.parse(this.committedBody(run, runLayout.assessment(operation.finalAssessment.assessment)));
        if (assessment.id !== operation.finalAssessment.assessment || assessment.candidate.tree !== operation.finalAssessment.tree || operation.checkpoint !== 'final') throw new Error('The pending final effect has an incompatible captured assessment prerequisite');
        if ((await this.previewCandidateTree()).tree !== operation.finalAssessment.tree) throw new Error('The pending final effect candidate changed after its retained assessment; responsible reassessment is required before any commit or audit replay');
        binding = { candidateId: operation.finalAssessment.candidate, tree: assessment.candidate.tree, assessment };
      }
      if (operation.finalCandidate !== undefined) {
        if (operation.checkpoint !== 'final' || operation.finalAssessment !== undefined) throw new Error('The pending final effect has incompatible candidate prerequisites');
        const candidate = preparedCandidateSchema.parse(this.committedBody(run, runLayout.candidate(operation.finalCandidate.candidate)));
        if (candidate.candidate.tree !== operation.finalCandidate.tree || (await this.previewCandidateTree()).tree !== operation.finalCandidate.tree) throw new Error('The pending final effect candidate changed after preparation');
        binding = { candidateId: operation.finalCandidate.candidate, tree: operation.finalCandidate.tree };
      }
      const recovered = await this.gates(run).commitGate(preparedGate(operation), undefined, undefined, undefined, operation.message, binding);
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
    return this.runsOf(planId).map(run => structuredClone(runSnapshot(run.record, run.log.events)));
  }

  getRun(planId: string, runId: string): RunSnapshot | undefined {
    this.refuseUnavailableRun(planId, runId);
    const run = this.runs.get(key(planId, runId));
    return run && structuredClone(runSnapshot(run.record, run.log.events));
  }

  /** Current debugger state, independent of the ordinary run snapshot. Inspection invokes no model. */
  debugState(planId: string, runId: string): BreakpointState | null {
    this.refuseUnavailableRun(planId, runId);
    const run = this.runs.get(key(planId, runId));
    if (!run || run.log.terminal || run.stopRequested || !run.debugPause) return null;
    return structuredClone({ ...run.debugPause, cursor: run.log.version });
  }

  /** The run's events, exactly as its log holds them. */
  events(planId: string, runId: string) {
    this.refuseUnavailableRun(planId, runId);
    return structuredClone(this.runs.get(key(planId, runId))?.log.events);
  }

  /** The record of one run, for a caller that reads what it was started with. */
  recordOf(planId: string, runId: string): RunRecord | undefined {
    this.refuseUnavailableRun(planId, runId);
    return structuredClone(this.runs.get(key(planId, runId))?.record);
  }

  /**
   * What a projection reads of one run: its record, its directory and every
   * complete line of its log, record bodies included. It is a read: the
   * caller receives the replay, and nothing it does with it reaches the log.
   */
  committed(planId: string, runId: string) {
    this.refuseUnavailableRun(planId, runId);
    const run = this.runs.get(key(planId, runId));
    return run && structuredClone({ record: run.record, directory: run.directory, entries: run.log.ledger.replay() });
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
    this.refuseUnavailableRun(planId, runId);
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
    this.refuseUnavailableRun(planId, runId);
    const run = this.runs.get(key(planId, runId));
    return run && structuredClone(selectCheckFindings(checkFindingStateOf(run.log.ledger), query));
  }

  /**
   * The one CheckFinding transition of a run, for every producer and
   * decision path: see `check-findings/transition.ts`. Slow work is done
   * before it; `build` validates what that work captured under the mutex.
   */
  private async commitCheckFindings(run: Run, build: CheckFindingBuild): Promise<CheckFindingCommit> {
    return await commitCheckFindingChange(run, build, this.now());
  }

  /** Preserve one assessment question per unstable test, keyed across reused audit receipts. */
  private async reportGateInstability(run: Run, gate: GateAttempt): Promise<void> {
    if (gate.checkpoint !== 'iteration' && gate.checkpoint !== 'breaking-iteration' && gate.checkpoint !== 'final') return;
    const prepared = run.log.all('iteration-candidate-prepared').find(event => event.data.gate === gate.id);
    const observations = configuredAuditInstabilityObservations(gate.provider?.result);
    if (observations.length === 0) return;
    const assignment = gate.subject.iteration === undefined ? undefined
      : committedRecords(coordinationHistory(run.log).lines).assignments.get(gate.subject.iteration);
    const owner = prepared?.data.workItem ?? (assignment?.coordination?.kind === 'capability-task'
      ? assignment.coordination.id : gate.subject.workItem);
    if (gate.checkpoint !== 'final' && owner === undefined) return;
    const tree = prepared?.data.tree ?? (gate.audited === null ? null
      : await this.candidates.commitTree(this.projectRoot, gate.audited));
    if (tree === null) return;
    const findings = checkFindingStateOf(run.log.ledger);
    for (const observation of observations) {
      const identity = observation.identity;
      const summary = `Audit established instability in test ${JSON.stringify(identity.testId ?? 'unidentified test')} at ${observation.path ?? 'an unidentified path'} (project ${identity.projectRoot}, check ${identity.checkId ?? 'unidentified'}${identity.project === null ? '' : `, runner project ${identity.project}`}); determine this test's origin against the original execution baseline`;
      const issueKey = `test-instability:${observation.key}`;
      const priorOwner = [...findings.findings.values()].find(entry => entry.reports.some(report =>
        report.producer === 'check:audit-instability' && report.issueKey === issueKey))?.owner;
      const report = reportCommand({
        producer: 'check:audit-instability', attempt: gate.id, reportKey: observation.key,
        findingKey: `draft:finding:audit-instability-${sha256(observation.key).slice(0, 16)}`,
        owner: priorOwner ?? (gate.checkpoint === 'final' ? { kind: 'run' } : { kind: 'work-item', workItem: owner! }),
        source: { kind: 'tree', id: tree }, issueKey,
        verification: { kind: 'assessment' },
        observation: { kind: 'audit-instability', summary,
          evidence: [{ kind: 'gate-audit', ref: runLayout.gate(gate.id), hash: null },
            ...(gate.evidence === null ? [] : [{ kind: 'audit-report', ref: gate.evidence.reportCommit, hash: null }])],
          locations: observation.path === null ? [] : [{ path: observation.path, startLine: null, endLine: null }] },
        judgment: null, suggests: null, credibility: 'objective', modules: [],
      });
      const committed = await this.commitCheckFindings(run, () => ({ commands: [report],
        compose: decided => ({ event: { type: 'check-findings-recorded', data: {
          cause: { kind: 'producer', producer: 'check:audit-instability', attempt: gate.id }, checkFindings: [...decided.events],
        } } }),
      }));
      if (committed.kind === 'refused') throw new Error(`Audit instability of gate ${gate.id} could not be recorded: ${committed.refusal.message}`);
      if (committed.kind === 'committed') run.notify();
    }
  }

  /** The runs of one plan, newest first, as `committed` answers each. */
  committedRuns(planId: string) {
    return this.runsOf(planId).map(run => structuredClone({ record: run.record, directory: run.directory, entries: run.log.ledger.replay() }));
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
    this.refuseUnavailableRun(planId, runId);
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
    this.refuseUnavailableRun(planId, sourceRunId);
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
    this.refuseUnavailableRun(command.payload.planId, command.payload.jobId);
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
      planScenarios: extractPlanScenarios(new TextDecoder().decode(captured), capturedDocuments.manifest.root),
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
    this.refuseUnavailableRun(planId, jobId);
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
    this.refuseUnavailableRun(planId, jobId);
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
    this.refuseUnavailableRun(planId, jobId);
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
    const repair = this.coordination(run).latestRepairIncident();
    if (repair !== undefined && ['admitted', 'running'].includes(repair.stage)) {
      await this.coordination(run).persistRepairIncident({ ...repair.incident, revision: repair.incident.revision + 1, endedAt: this.now().toISOString(),
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
    this.acceptance(run).closeReviews();
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
      Promise.all([...open, this.acceptance(run).reviewsSettled()]),
      new Promise<void>(resolve => { timer = setTimeout(resolve, grace); }),
    ]);
    clearTimeout(timer);
    if (!this.closed && run.policy.reviews !== undefined) {
      await this.acceptance(run).finishUnsettledReviews((_request, running) => ({
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
    this.refuseUnavailableRun(planId, jobId);
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
    this.refuseUnavailableRun(planId, jobId);
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
    if (recovering) await this.handling(run).cleanupClosedScratch();
    this.acceptance(run).startReviews(agent, packages);
    const accepted = await this.analyse(run, agent, packages, baseline);
    if (!accepted || this.ignoring(run)) return;

    const approved = await this.awaitReview(run);
    if (!approved || this.ignoring(run)) return;

    const ready = await this.reachReadiness(run);
    if (!ready || this.ignoring(run)) return;

    // Queue only after the accepted analysis is approved and implementation can begin.
    // This awaits persistence, never the administration model or tracker command.
    await this.scheduleBeads(run, 'start');
    await this.acceptance(run).setupScratch();
    if (this.ignoring(run)) return;

    await this.acceptance(run).materializeScenarios();
    if (this.ignoring(run)) return;

    const worked = await this.coordination(run).takeWorkItems(agent, packages, baseline);
    if (!worked || this.ignoring(run)) return;

    // Every review settles, or is finished at its bound, before the final
    // gate: the run completes with no reader left and no request pending.
    await this.acceptance(run).settleReviews();
    if (this.ignoring(run)) return;

    await this.acceptance(run).qualifyFinal(agent, packages);
  }

  /** A repaired candidate receives new semantic evidence in the same run. */


  /** Retain the failed attempt and let the plan architect choose ordinary correction work. */


  /** Prepare the actual eventual commit tree after all source-mutating rendering. */


  /** Re-read the ledger after each step: a committed prefix is never repeated. */


  /** Record each exhausted source obligation with its user request in one durable line. */




  /** Current immutable source selection; an empty list requires an actual successful diff. */












  /** Check the exact captured repair boundary after shell writes and again on restart. */


  /** A durable assignment may precede the child; a settled submitted child may precede its repair event. */




  /** One complete fixed-catalog assessment of an already prepared candidate. */


  // Invocations

  /** Recovery records are read from committed revisions, independently of the live driver. */
  private latestOperationRecovery(run: Run): OperationRecovery | undefined {
    const continued = run.log.ownEvents.map(event => event.type).lastIndexOf('job-continued');
    const event = run.log.ownEvents.slice(continued + 1).filter(event => ['operation-recovery-pausing', 'operation-recovery-paused', 'operation-recovery-resumed'].includes(event.type)).at(-1);
    if (!event || !('occurrenceId' in event.data)) return undefined;
    return operationRecoverySchema.parse(this.committedBody(run, runLayout.operationRecovery(event.data.occurrenceId as string, (event.data as { revision: number }).revision)));
  }

  /** A later authenticated settlement is new evidence; the original outcome remains immutable. */
  private effectiveInvocationOutcome(run: Run, id: string): InvocationOutcome | undefined {
    const outcome = committedRecords(run.log.ledger.replay()).outcomes.get(id);
    if (!outcome || outcome.settled.confirmed) return outcome;
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
    return recoveryInspectionSchema.parse({ planId, runId, cursor: run.log.version, occurrenceId: recovery.id, revision: recovery.revision,
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
    run.recoveryReviewRelease = this.acceptance(run).suspendReviews(false);
    await this.write(run, { type: 'operation-recovery-pausing', data: { occurrenceId: id, revision: 1 } },
      [{ path: runLayout.operationRecovery(id), id, revision: 1, body: recovery }]);
    if (boundary.kind !== 'gate') await run.gating;
    if (boundary.kind !== 'readiness') await run.readiness?.settled;
    while (run.live.size > 0) await Promise.all([...run.live.values()].map(live => live.done));
    await this.acceptance(run).reviewsSettledExcept(id => run.recoveryReviewPipelines.has(id), () => run.changed());
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

  private async resumeRecovery(command: Extract<RunCommand, { type: 'resume-recovery' }>, contentHash: string): Promise<Receipt> {
    const { planId, jobId } = command.payload;
    this.refuseUnavailableRun(planId, jobId);
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
          run.log = await RunLog.open(run.log.path, run.jobId);
          run.stopRequested = run.log.find('stop-requested') !== undefined;
          if (run.stopRequested) blockers.push('The explicit stop remains effective');
          else await this.closeInterruptedInvocations(run);
        }
      }
      if (run.writer.isUnsettled) blockers.push('The former writer has not settled');
      if (blockers.length) throw new CommandRejection('conflict', blockers.join('; '));
      const at = this.now();
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
    const { packages } = await loadPromptPackages({ ...(this.options.skillDirectory === undefined ? {} : { skillDirectory: this.options.skillDirectory }),
      capabilityWorkflow: this.workflow !== null });
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
      const pending = this.coordination(run).latestRepairIncident();
      if (pending && ['admitted', 'running', 'interrupted'].includes(pending.stage) && pending.incident.verification?.verified !== true) {
        const preparation = repairPreparationSchema.parse(this.committedBody(run, pending.incident.preparation.path));
        const restored = await this.coordination(run).automaticProjectRepair(agent, packages, baseline, preparation,
          new Error(pending.incident.harnessError.message), null);
        if (restored === null || 'refusal' in restored || this.ignoring(run)) return;
        await this.coordination(run).persistRepairIncident({ ...restored.incident,
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
      const result = await this.runner.runInvocation(this.runnerContext(run), agent, current);
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
        if (delay > 0 && !await this.gateHost(run).retryGateDelay!(delay)) return { ...result, ended: 'stopped', value: undefined, outcomeKind: 'stopped' };
      }
      current = this.runner.restartTaskRequest(request, result.id, result.resourceReason ?? result.error ?? `Attempt ended ${result.ended}`);
    }
  }

  /** One invocation, through the invocation runner every role shares. */
  private async runInvocation<T>(run: Run, agent: AgentPort, request: InvocationRequest<T>): Promise<InvocationResult<T>> {
    if (['engineer', 'contract-engineer', 'nonfunctional-repair-engineer'].includes(request.role) && request.onCompactionStarted === undefined) {
      const task = request;
      request = { ...request, onCompactionStarted: (checkpoint, signal) => this.coordination(run).reviewCompaction( agent, task, checkpoint, signal) };
    }
    if (run.record.breakpoint !== undefined && ['engineer', 'contract-engineer', 'nonfunctional-repair-engineer'].includes(request.role)) {
      let current = request.stepInputs && request.fallback === undefined
        ? { ...request, fallback: this.coordination(run).stepFallback(request.stepInputs, request.consultationPackages ?? new Map([[request.role, request.loaded]])) }
        : request;
      let held: InvocationResult<T> | undefined;
      run.debugPrepared = {
        inspect: () => this.runner.preview(this.runnerContext(run), agent, current),
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
    const releaseReviews = this.acceptance(run).suspendReviews();
    try {
      if (!existing && await this.write(run, { type: 'debug-pausing', data: { pauseId, revision, role: request.role,
        work: request.work, goal, nextAction } }) === 'ended') return false;
      await this.acceptance(run).reviewsSettled();
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
      if (this.ignoring(run)) this.acceptance(run).closeReviews();
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
      // The ordinary engineer closes a passed gate directly and must repair a
      // failed one with a new submission. Contract sessions still replay a
      // passed submission to finish registration against that retained gate.
      && !(request.role === 'engineer' && run.log.all('gate-attempted').some(attempt => {
        const gate = gateAttemptSchema.safeParse(this.committedBody(run, runLayout.gate(attempt.data.gate)));
        return gate.success && gate.data.proposedBy === event.data.invocation;
      }))
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
    return invocationRecord(this.runnerContext(run), id);
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
        if (body.schema === 'ramify-agent.iteration-assignment/2' && iterations.has(body.id ?? '')) return true;
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
      captureRepairAssignment: (invocation, assignment) => this.coordination(run).captureAutomaticRepairAssignment(invocation, assignment),
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




  /**
   * The contract gate: the project's committed audit of the candidate,
   * whose configured checks run the consumer's tests and the agreement's
   * conformance suite among the project's own, and the fake-naming rule the
   * harness verifies itself over the files this iteration wrote.
   */


  /**
   * What one accepted iteration discharges. A provider that ran the agreed
   * conformance suite against the real implementation has conformed; a
   * verification that replaced every fake injection closes its requirement.
   * Neither is the gate's verdict alone: `requirement-verified` also requires
   * that no named location still reaches the fake.
   */


  /**
   * Closes an accepted correction iteration with the repair claim of each
   * CheckFinding still planned under the reconciliation intent it resolves,
   * on the same line: the claim names the audited tree and the iteration,
   * and each CheckFinding stays open until its verification rule is met.
   * A claim the transition refuses leaves the iteration closed without it.
   */


  /**
   * The inputs of one engineer invocation, collected from the run's records
   * and the project as they stand: everything the module engineer step is built
   * from, with every path project-relative.
   */


  /**
   * What a module engineer that ended without a result leaves its module architect,
   * ready before the architect is briefed: the harness's digest, then the
   * failure analysis. Neither ends the run: what cannot be read is a gap in
   * the digest, and an analysis that fails is unavailable. Null only for a
   * run that is ending.
   */


  /** The digest of one failed invocation, from what the harness already holds. */


  /**
   * The failure analysis: a model's account of one failed invocation, in a
   * reader session of its own, before the module architect is briefed. It
   * reads the evidence the harness writes into its working directory and
   * submits once. Whatever happens to it, it never fails the run: a missing
   * package, a refused start, a failed or invalid session and any error of
   * its own are an unavailable analysis with the reason.
   */


  /**
   * The analyst's working directory: the digest, the failed invocation's
   * transcript as text, the complete outputs of its shell calls and the
   * patch of the uncommitted work. What cannot be written is named instead.
   */


  /** The API views of the modules one iteration writes, for the module engineer's briefing. */


  /**
   * How many times this iteration has returned at its context budget,
   * counted over committed history: the counter is keyed by the work, so a
   * fresh session does not reset it and neither does a repair round.
   */


  private endInvocation(
    run: Run,
    id: string,
    session: SessionId,
    keeping: SessionKeeping,
    body: Omit<InvocationOutcome, 'schema' | 'invocation'>,
    degraded?: DegradeRelation,
    transcript?: InvocationTranscript,
  ): Promise<void> {
    return this.runner.endInvocation(this.runnerContext(run), id, session, keeping, body, degraded, transcript);
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
      return await this.acceptance(run).reachReadinessOwned(controller.signal);
    } finally {
      markSettled();
      if (run.readiness?.controller === controller) run.readiness = undefined;
    }
  }



  /**
   * The final gate: all project tests, the type check and a complete Ramify
   * check, on the current tree. `job-completed` requires a passing attempt;
   * an empty work queue alone never satisfies it.
   */


  /** A recoverable setup on the run branch, before feature or iteration files are written. */




  /**
   * Writes the tracked feature files onto the run branch and commits them as
   * "Scenarios of <planId>", once readiness has passed and the branch
   * exists, before the first module architect starts. The commit is an
   * external effect of the ledger: `scenarios-materializing` is its intent
   * and `scenarios-materialized` its completion, and a crash between them
   * is recovered by re-rendering and by the commit's trailers. A run without
   * scenarios has no file to write and records nothing.
   */


  /** The materialization effect, from its intent or, on recovery, from the intent the log holds. */


  /** Recovery proves producer content from Git objects, not merely matching trailers. */


  /** Materialization refuses unrelated dirt; isolated revisions preserve settled candidate edits. */


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






  /** Incident and portable export bytes precede any best-effort external tracker call. */


  /** One bounded writer, admitted only for a matching pure preparation after an accepted partial. */


  // Scenario states, architecture §7 to §9

  /** The work item's entry or integration scenario and the run's tracked scenarios, which a declaration is judged against. */

  /**
   * The last refusal of a completion request the bound allows: the run fails
   * with the requirements as evidence where one is open or owed, and with
   * the unresolved capability work otherwise. A missing done report is no
   * refusal here: validation rejects that request in its own turn.
   */


  /**
   * What a failing gate tells its reader: every command that did not pass
   * with what it reported, raw. No cause is inferred and no repair owner is
   * named: what a failure means is the reader's to judge.
   */


  /**
   * The tracked scenarios an accepted iteration's gate audit passed, read
   * from its raw runner output, each with the step definitions that bound
   * it, for the module architect: binding is recorded, not policed, and this
   * is where the architect sees it. Display only.
   */




  private async fail(run: Run, reason: RunFailureReason, text: string, evidence: readonly string[] = []): Promise<void> {
    // A failure is the run's final decision; its readers are stopped and
    // their requests finished first, so no review is left running past it.
    if (this.acceptance(run).hasReviews() && !run.log.terminal) await this.stopReaders(run, 'stopped', run.policy.limits.stopSettleMs);
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
        this.acceptance(run).closeReviews();
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


/**
 * The module architect's pinned point after one invocation, where the harness
 * kept its session: the session and the executor's ref at the invocation's
 * end. Null where the session was not kept or no ref was reported.
 */

/** How long a failure analysis may run: it reads a bounded set of files and submits once. */


/** How much of one command output the analyst is given, from its end. */


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


/** Mechanical section identities only; goal/requirements are supplied by their owning records. */

/** Known project facts as step inputs: captured JSON, with every path a project-relative field. */


export type { RunServiceOptions as AutonomousRunOptions };
