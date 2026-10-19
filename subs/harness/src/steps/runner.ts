import { executePreparedTask, executeWithContextFallback } from '../../subs/task-execution/src/execution.js';
import { stoppedOutcome, kept, finished, type InvocationResult, type SessionKeeping, type InvocationProgress } from '../../subs/task-execution/src/results.js';
import { taskBriefingRevision } from '../../subs/task-execution/src/delivery/briefings.js';
import { consultationAvailability } from '../consultations/targets.js';
import { consultationTool, consultArchitectDeclaration } from '../consultations/tools.js';
import { consultationId } from '../consultations/records.js';
import { consultationOutcome, recordConsultationDelivery } from '../consultations/store.js';
import { piBuiltinDeclarations } from '../../subs/agent/subs/pi/src/session-operations.js';
import { effectiveBlocks } from '../../subs/task-execution/src/delivery/blocks.js';
import type { DebugInspection } from '../interfaces/protocol/runs.js';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve as resolvePath } from 'node:path';
import { interruptionEvidence, type AgentPort, type AgentSession, type JsonSchema, type SessionSpec, type SessionStart } from '../../subs/agent/src/interfaces/port.js';
import type { GitService } from '../../subs/evidence/src/git.js';
import type { ArchitectIndex } from '../../subs/evidence/src/views.js';
import { writeFileAtomic } from '../../subs/ledger/src/atomic.js';
import type { GuardedScope } from '../guard/write-guard.js';
import type { Role } from '../interfaces/protocol/runs.js';
import { canonicalJson } from '../jobs/commands.js';
import { commitRecord, type RecordRef as CommitRecord } from '../jobs/commit.js';
import type { Mutex, PriorityMutex } from '../jobs/mutex.js';
import { invocationReadSize, invocationScopeSize, invocationScopeFailure, type DeclaredScope } from '../../subs/kpi/src/capture.js';
import { deliveredScopeInputs, invocationScope, declaredRoots } from '../measurement/inputs.js';
import { inputsHash, type LoadedPackage } from '../prompts/packages.js';
import type { TaskEnvironment, TaskPacket } from '../../subs/task-execution/src/delivery/packet.js';
import type { TaskKind } from '../prompts/tasks.js';

import type { RunEventInput, RunLog } from '../../subs/autonomous/src/run/log.js';
import { recordSettledSnapshot } from '../run/mutations.js';
import { ObservationLog } from '../../subs/task-execution/src/observations.js';
import { contextPolicyOf, invocationLimits } from '../run/policy.js';
import { decideTaskReentry, mayRetryTask, taskInterruption, taskRetryDelay, waitForTaskRetry } from '../../subs/recovery/src/reentry.js';

import { declaredModuleDirectories } from '../run/project-config.js';
import { invocationId, measurementSnapshotSchema, runLayout, sessionId, type MeasurementSnapshot, type RunPolicy } from '../../subs/autonomous/src/run/records.js';
import { invocationOutcomeSchema, invocationSchema, type ContinueReason, type ContinueRelation, type DegradeRelation, type ForkRelation, type Invocation, type InvocationOutcome, type DurableRecordRef as RecordRef, type ReplaceRelation, type RequestRelation, type SessionId } from '../../subs/task-execution/src/records.js';
import { HarnessSessionOperations, composeWorkflowOperationPacket as composeOperationPacket } from '../prompts/session-adapter.js';
import { ReusableSessionUnavailableError, operationDeclarations, settleSessionEquipment, type HarnessTaskBrief, type PointContext } from '../../subs/task-execution/src/session-operations.js';
import { reduceSessions, type RunSessions } from '../../subs/autonomous/src/run/sessions.js';
import { type SubmissionValidation } from '../../subs/task-execution/src/submissions.js';
import type { CompactionReason } from '../../subs/agent/src/interfaces/port.js';
import type { WriterOwnership } from '../../subs/task-execution/src/writer.js';
import { InvocationTranscript } from '../../subs/task-execution/src/transcripts/recorder.js';
import type { ContentStore } from '../../subs/task-execution/src/transcripts/store.js';
import { readTranscript, TranscriptWriter, TranscriptWriters } from '../../subs/task-execution/src/transcripts/writer.js';
import type { EquipContext, Equipment } from '../../subs/task-execution/src/equipment.js';
import type { StartingPointGroup } from '../../subs/autonomous/src/work/starting-inputs.js';
import { scratchSafetyRule } from '../../subs/autonomous/src/work/scratch.js';
import { serializeStepInputs, type StepInputs } from './inputs.js';

/*
 * The invocation runner: one invocation, from the event that licenses it to
 * the outcome that closes it, for every role. A run calls it for each of its
 * invocations, and `step run` and `session` call it for the one invocation
 * they make in a manual run. It writes the run's records: the invocation and
 * its outcome in the run log, the step inputs, the submission, the
 * observations and the transcript. It binds the equipment, judges the
 * submissions, holds the bounds and records the usage.
 *
 * What only an implementation run knows is its host's: when the run accepts
 * nothing more, the source boundary an invocation starts from, the run-wide
 * bounds, a task brief composed from its records and the restoration of an
 * invocation after a restart. A manual run answers each of them itself.
 */

const message = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/** One invocation the run has open: the writer or a reader, and its session once it started. */
export interface LiveInvocation {
  readonly role: Role;
  readonly reader: boolean;
  session: AgentSession | undefined;
  readonly done: Promise<void>;
}

/** The run state an invocation is started in and recorded into. */
export interface RunnerRun {
  readonly jobId: string;
  readonly planId: string;
  /** The run's directory, which its log's records are relative to. */
  readonly directory: string;
  readonly createdAt: string;
  readonly policy: RunPolicy;
  readonly originalPolicy?: RunPolicy;
  /** The frozen measurement baseline an invocation's scope is measured against; null where the run has none. */
  readonly baselineMeasurement: RecordRef | null;
  readonly log: RunLog;
  readonly mutex: Mutex;
  readonly starting: PriorityMutex;
  readonly live: Map<string, LiveInvocation>;
  readonly writer: WriterOwnership;
  readonly store: ContentStore;
  readonly index: ArchitectIndex | null;
  path(relative: string): string;
}

/** The writes the runner reports to its host after each one is durable. */
export type RunnerWrite = 'session-opened' | 'invocation-started' | 'writer-acquired' | 'writer-released' | 'invocation-ended';

/** What one invocation is: its role, its work, its prompt and the one submission it may make. */
export interface InvocationRequest<T> {
  readonly recoveryResume?: { readonly occurrenceId?: string; readonly expectedRevision?: number; readonly commandId: string };
  /** Scheduler request that owns this reviewer or design-orientation pipeline. */
  readonly recoveryReviewRequest?: string;
  /** A semantic admission callback is called only once across transport successors. */
  readonly singleAdmission?: boolean;
  readonly recoveryPredecessor?: string;
  /** Consultation forks must never silently lose their pinned source. */
  readonly allowFreshFallback?: boolean;
  readonly consultationPackages?: ReadonlyMap<string, LoadedPackage>;
  /** Only debugger exchanges permit a settled plain return to retain the pending task. */
  readonly pendingPlainReturn?: boolean;
  readonly callerText?: string;
  readonly previewEquipment?: { readonly builtinTools: SessionSpec['builtinTools']; readonly tools: readonly import('../../subs/agent/src/interfaces/session-operations.js').SessionToolDeclaration[] };
  readonly restore?: boolean;
  readonly originalInvocation?: string | undefined;
  readonly role: Role;
  readonly work: Invocation['work'];
  /** The count of this role's invocations for this work, this one included. */
  readonly attempt: number;
  readonly loaded: LoadedPackage;
  readonly systemPrompt: string;
  readonly prompt: string;
  /** Full ordinary task message where the reused start deliberately sends a thin delta. */
  readonly freshPrompt?: string | undefined;
  /** Exact owning task inputs; headings in the old display brief carry no ancestry authority. */
  readonly task?: { readonly kind?: TaskKind; readonly goal: string; readonly requirements: readonly string[]; readonly omit?: readonly string[]; readonly literalSections?: HarnessTaskBrief['sections']; readonly startingPointGroups?: readonly StartingPointGroup[]; readonly candidate?: string; readonly snapshot?: string; readonly consultationSubmissionSchema?: string; readonly views?: TaskEnvironment['views']; readonly cucumberConfiguration?: string | null; readonly modules?: readonly string[] } | undefined;
  readonly start: SessionStart;
  /** The task brief a step constructor composed; the run composes one from its records where absent. */
  readonly brief?: HarnessTaskBrief | undefined;
  /** The context policy a step constructor took from its inputs; the run policy's for the role where absent. */
  readonly context?: RunPolicy['context']['engineer'] | undefined;
  /** The step inputs this invocation was constructed from, written to its directory before its session starts. */
  readonly stepInputs?: StepInputs | undefined;
  /**
   * What a fresh start that replaces an unavailable continued or forked
   * session is given: the step's fresh construction. Without it the fresh
   * prompt, or the prompt, is sent with the same brief.
   */
  readonly fallback?: ((reason: string) => { readonly prompt: string; readonly brief: HarnessTaskBrief; readonly stepInputs: StepInputs } | undefined) | undefined;
  readonly toolName: string;
  readonly description: string;
  readonly inputSchema: JsonSchema;
  /** The schema literal the stored submission declares; the agent never supplies it. */
  readonly submissionSchema: string;
  readonly validate: (input: unknown) => SubmissionValidation<T> | Promise<SubmissionValidation<T>>;
  readonly beforeSubmission?: ((input: unknown, signal: AbortSignal) => Promise<void>) | undefined;
  /**
   * What an accepted submission is answered with. Without it the agent
   * implementation's own acknowledgement is used, which knows nothing of the
   * kind that was submitted.
   */
  readonly acceptedText?: ((value: T) => string) | undefined;
  readonly scope: Invocation['scope'];
  /**
   * The snapshot and the declared scope `S_s` is measured from when the
   * invocation starts, with its own prompt package, the plan and the brief
   * it is delivered as its support documents. Without it `scope.size` stands.
   */
  readonly measured?: { readonly snapshot: MeasurementSnapshot; readonly scope: DeclaredScope; readonly readScope?: DeclaredScope } | undefined;
  /** Whether this invocation holds the run's one writer. */
  readonly writer?: boolean | undefined;
  /** Exact tree at writer start when task-local mutation attribution is required. */
  readonly candidateBefore?: string | undefined;
  /**
   * The scope this invocation may write, where it has one. The guard needs
   * it, and so do the two observations that read the tree afterwards: the
   * snapshot of what changed while the writer held it, and the reads that
   * left the scope.
   */
  readonly guarded?: GuardedScope | undefined;
  /** The modules the assignment declares for reading, which a read enters without an excursion. */
  readonly readModules?: readonly string[] | undefined;
  /**
   * What this role is given beyond reading and its submission tool: the
   * implementation's own mutating built-ins, the harness's own tools, and
   * the guard each mutating call passes. It is built once, with the
   * invocation's own observation log, so that everything the session does is
   * recorded against the invocation that did it.
   */
  readonly equip?: ((session: EquipContext) => Equipment) | undefined;
  /** Architect review started by native compaction in an engineer invocation. */
  readonly onCompactionStarted?: ((checkpoint: { readonly invocation: string; readonly ordinal: number; readonly reason: CompactionReason }, signal: AbortSignal) => Promise<{ readonly action: 'continue' | 'handoff'; readonly reason: string }>) | undefined;
  /** A session that ended for a reason only the caller can name, such as a tool's exhausted bound. */
  readonly endedAs?: (() => InvocationOutcome['ended'] | undefined) | undefined;
  /**
   * Whether this invocation is a reader beside the writer: it holds no
   * writer, a run-wide bound it meets refuses it without failing the run,
   * and a session of it that does not become idle blocks no writer, since it
   * was given nothing that writes or starts a process.
   */
  readonly reader?: boolean | undefined;
  /** The session's working directory; the project root when absent. A reader's is an empty directory of its own. */
  readonly workingDirectory?: string | undefined;
  /** A tighter absolute bound than the run policy's, such as a review attempt's. */
  readonly absoluteMs?: number | undefined;
  /**
   * A module engineer's effective command, idle and absolute bounds, which replace the policy's:
   * the policy's defaults, or what its assignment raised them to.
   */
  readonly bounds?: { readonly idleMs: number; readonly absoluteMs: number; readonly commandTimeoutMs?: number } | undefined;
  /** Called once `invocation-started` is committed and before the session starts, such as to commit what the invocation is for. */
  readonly onStarted?: ((invocation: string, session: SessionId) => Promise<void>) | undefined;
  /**
   * Whether the invocation, once started, ends at once as stopped with no
   * session: a reader whose request its work item's deadline settled while
   * it was being started. Asked after `onStarted`.
   */
  readonly fenced?: (() => boolean) | undefined;
  /** A session mode the caller could not honor, recorded on the invocation. */
  readonly degraded?: { readonly requested: 'fresh' | 'continued' | 'fork'; readonly reason: string } | undefined;
  /** The session a continued start joins; a fresh or forked start opens a new one. */
  readonly session?: SessionId | undefined;
  /**
   * Why a continued start continues its session; required with one. The
   * point it continues from is the session's latest, which the log holds.
   */
  readonly continuing?: ContinueReason | undefined;
  /** The harness point a forked start forks, and why; required with one. */
  readonly fork?: ForkRelation | undefined;
  /** The session a session this invocation opens takes the place of. */
  readonly replaces?: ReplaceRelation | undefined;
  /** The invocation whose result asked for the session this invocation opens. */
  readonly requestedBy?: RequestRelation | undefined;
  /**
   * Whether the harness keeps the session once this invocation ends: kept,
   * to continue it or append to it, or finished with the reason. It is
   * answered from how the invocation ended and what it submitted, before the
   * end is recorded. A run that is ending finishes it as `run-ended`,
   * whatever this answers.
   */
  readonly keep: (ended: InvocationOutcome['ended'], value: T | undefined) => SessionKeeping;
  /** The tree when the invocation started: whether it was dirty, recorded on the invocation. A manual run records it; a run does not. */
  readonly startingTree?: Invocation['startingTree'] | undefined;
  /** Told what the session does as it happens; a live output reads it. A reader that throws changes nothing. */
  readonly progress?: ((event: InvocationProgress) => void) | undefined;
  /** Stops the session, as a person interrupting it does; its outcome records the stop as the caller's. */
  readonly signal?: AbortSignal | undefined;
}

/** An invocation started and not yet run: its identifiers, its observations and its transcript. */
export interface StartedInvocation {
  readonly id: string;
  readonly session: SessionId;
  readonly observations: ObservationLog;
  readonly transcript: InvocationTranscript;
  readonly closed: () => void;
}

/** An invocation a restarted run restores from its original records: its result, or its start to run again. */
export interface RestoredInvocation<T> {
  readonly hasIntent: boolean;
  readonly result?: InvocationResult<T> | undefined;
  readonly started?: StartedInvocation | undefined;
}

/** What the runner asks of the run that hosts it. */
export interface RunnerHost<R extends RunnerRun> {
  readonly adoptContinuity?: (run: R, occurrenceId: string) => Promise<void>;
  /** A scheduler owns its recovery hold and successor admission. */
  readonly resourceInvocation?: <T>(run: R, agent: AgentPort, request: InvocationRequest<T>) => Promise<InvocationResult<T>>;
  readonly authorityCurrent?: () => Promise<boolean>;
  readonly projectRoot: string;
  readonly git: GitService;
  /** The model the agent was asked to run, recorded with each session; null where it chose its own. */
  readonly model: string | null;
  now(): Date;
  warn(text: string): void;
  afterWrite(write: RunnerWrite, runId: string): Promise<void>;
  operations(agent: AgentPort): Promise<HarnessSessionOperations>;
  /** The session operations once opened, which an invocation's end reads its delivered packet from; undefined before. */
  openedOperations(): Promise<HarnessSessionOperations> | undefined;
  /** Whether the run accepts nothing more: it is stopping, closing or has ended. */
  ignoring(run: R): boolean;
  /** The source boundary an invocation starts from. */
  base(run: R): string;
  /** Why the run starts no further invocation, or null where it may. */
  refusal(run: R): string | null;
  /** What the run does when its bounds refused an invocation: the writer's refusal fails a run, a reader's does not. */
  refused(run: R, reason: string, reader: boolean): Promise<void>;
  /** The task brief of a request that brings none, composed from the run's records. */
  taskBrief<T>(run: R, request: InvocationRequest<T>, spec: SessionSpec, limits: RunPolicy['limits']): Promise<HarnessTaskBrief>;
  /** An invocation a restarted run restores instead of starting a new one; null where there is none. */
  restore?<T>(run: R, agent: AgentPort, request: InvocationRequest<T>): Promise<RestoredInvocation<T> | null>;
  previewCandidateTree(): Promise<{ readonly tree: string }>;
}

/** A record body as the log committed it, never the materialized file. */
export function committedBody(run: Pick<RunnerRun, 'log'>, path: string): unknown {
  for (const entry of run.log.ledger.replay()) {
    for (const record of entry.transaction.records) if (record.path === path) return record.body;
  }
  return undefined;
}

/** Latest immutable invocation revision, unlike owning assignment/license lookups. */
export function invocationRecord(run: Pick<RunnerRun, 'log'>, id: string): { readonly revision: number; readonly body: Invocation } {
  const record = run.log.ledger.replay().flatMap(entry => entry.transaction.records).filter(record => record.path === runLayout.invocation(id)).at(-1);
  if (!record) throw new Error('Invocation record missing');
  return { revision: record.revision, body: invocationSchema.parse(record.body) };
}

function requestedSession<T>(request: InvocationRequest<T>): Invocation['session'] {
  if (request.degraded !== undefined) {
    return {
      requested: request.degraded.requested,
      actual: request.start.mode === 'continue' ? 'continued' : request.start.mode === 'fork' ? 'fork' : 'fresh',
      ref: '',
      degradedReason: request.degraded.reason,
      ...(request.start.mode === 'fresh' ? {} : { from: request.start.mode === 'continue' ? request.start.ref : request.start.from }),
    };
  }
  if (request.start.mode === 'continue') {
    return { requested: 'continued', actual: 'continued', ref: request.start.ref, from: request.start.ref };
  }
  if (request.start.mode === 'fork') {
    return { requested: 'fork', actual: 'fork', ref: request.start.from, from: request.start.from };
  }
  return { requested: 'fresh', actual: 'fresh', ref: '' };
}

/** The shared invocation runner over one host's runs. */
export class InvocationRunner<R extends RunnerRun> {
  private readonly transcripts = new TranscriptWriters();
  constructor(private readonly host: RunnerHost<R>) {}

  private get projectRoot(): string {
    return this.host.projectRoot;
  }

  /**
   * One run-log write, serialized with every other. The event is built
   * inside the lock, so its sequence is the one the ledger gives its line
   * and two writes can never disagree about it. A terminal log accepts
   * nothing more: the event that ends a run is its last write.
   */
  write(run: R, input: RunEventInput, records: readonly CommitRecord[] = [], at?: Date): Promise<'committed' | 'already-committed' | 'ended'> {
    return run.mutex.run(async () => {
      if (run.log.terminal || this.host.authorityCurrent && !await this.host.authorityCurrent()) return 'ended';
      if (records.length === 0) {
        await run.log.append(input, at);
        return 'committed';
      }
      return commitRecord(run.log.ledger, { event: run.log.next(input), records: [...records] });
    });
  }

  /** The run's sessions as its log derives them, or undefined, with a warning, where the log breaks the lifecycle. */
  sessionsOf(run: R): RunSessions | undefined {
    try {
      return reduceSessions(run.log.events);
    } catch (error) {
      this.host.warn(`Run ${run.jobId}: its sessions cannot be derived: ${message(error)}`);
      return undefined;
    }
  }

  /**
   * What a continued invocation continues from: its session's latest point,
   * the end of its previous invocation or an append since, and the briefs
   * appended since that invocation ended. An executor's ref is never read
   * for it.
   */
  continuationOf(run: R, session: SessionId, reason: ContinueReason): ContinueRelation {
    const point = this.sessionsOf(run)?.get(session)?.point ?? null;
    if (point === null) throw new Error(`Run ${run.jobId}: ${session} has no point to continue from`);
    const ended = run.log.all('invocation-ended').filter(event => event.data.session === session).at(-1)?.sequence ?? 0;
    const briefs = run.log.all('brief-appended')
      .filter(event => event.data.session === session && event.sequence > ended)
      .map(event => event.data.decision);
    // A reconciliation's brief is appended to the module architect's own
    // session; the append is the executor's and names no harness point.
    const reconciled = run.log.all('reconciliation-brief-appended')
      .filter(event => event.data.session === session && event.sequence > ended && (event.data.outcome === 'appended' || event.data.outcome === 'already-present'))
      .map(event => event.data.reconciliation);
    return { from: point, reason, briefs: [...briefs, ...reconciled] };
  }

  /** Drain execution-owned writers without exposing their mutable registry. */
  drainTranscripts(run: Pick<RunnerRun, 'directory'>): Promise<void> { return this.transcripts.drain(run.directory); }

  /** The transcript of one of the run's sessions. */
  transcriptOf(run: R, session: SessionId): TranscriptWriter {
    return this.transcripts.of({ session, path: run.path(runLayout.transcript(session)), root: run.directory,
      store: run.store, inlineBytes: run.policy.transcript.inlineBodyBytes, now: () => this.host.now() });
  }

  /**
   * What one invocation writes to its session's transcript. An entry that
   * could not be written is a coverage gap in the invocation's own
   * observations, and never fails the invocation.
   */
  invocationTranscript(run: R, session: SessionId, invocation: string, observations?: ObservationLog): InvocationTranscript {
    return new InvocationTranscript(this.transcriptOf(run, session), invocation, async detail => {
      const log = observations ?? await ObservationLog.open(run.path(runLayout.observations(invocation)));
      await log.record({ type: 'coverage-gap', data: { kind: 'transcript-incomplete', detail } });
    });
  }

  /**
   * One invocation, from the event that licenses it to the outcome that
   * closes it. Every role goes through here: the record is committed before
   * the preserving operation, the judge is the one answer to an invalid submission,
   * the session's settlement is the harness's own observation, and the
   * closing event is the last write of the invocation.
   */
  async runInvocation<T>(run: R, agent: AgentPort, request: InvocationRequest<T>): Promise<InvocationResult<T>> {
    if (request.signal?.aborted === true) return { id: '', ended: 'stopped', value: undefined, ref: '', outcomeKind: 'stopped', session: '' as SessionId, kept: false, notStarted: true, error: 'Stopped by the caller before dispatch' };
    return executeWithContextFallback({ mode: request.start.mode, allowFreshFallback: request.allowFreshFallback !== false, signal: request.signal,
      blocked: () => run.writer.isUnsettled || this.host.ignoring(run) || request.fenced?.() === true,
      attempt: () => this.invokeOnce(run, agent, request), fresh: (result, reason) => {
        const fresh = request.fallback?.(reason);
        return this.invokeOnce(run, agent, {
          ...request, originalInvocation: undefined, restore: false, start: { mode: 'fresh' }, session: undefined,
          recoveryPredecessor: result.id,
          continuing: undefined, fork: undefined, replaces: undefined,
          prompt: fresh?.prompt ?? request.freshPrompt ?? request.prompt,
          ...(fresh === undefined ? {} : { brief: fresh.brief, stepInputs: fresh.stepInputs }),
          degraded: { requested: request.start.mode === 'continue' ? 'continued' : 'fork', reason },
        });
      } });
  }

  /** Re-enter the same ordinary task after lifecycle and effect owners settle it. */
  async runResourceInvocation<T>(run: R, agent: AgentPort, request: InvocationRequest<T>): Promise<InvocationResult<T>> {
    if (this.host.resourceInvocation) return this.host.resourceInvocation(run, agent, request);
    const previous = run.log.all('invocation-started').filter(event => event.data.role === request.role && canonicalJson(event.data.work) === canonicalJson(request.work)).at(-1);
    if (previous) {
      if (request.recoveryResume) {
        const original = await (await this.host.operations(agent)).originalOperation(run.jobId, previous.data.invocation);
        if (!original || !request.brief) throw new Error('The original ordinary task record is unavailable; continuation cannot infer its goal or scope');
        const required = taskBriefingRevision({ revision: 'task-comparison', goal: request.brief.goal, requirements: request.brief.requirements, sections: [] }).sections;
        const originalInputs = original.briefing.filter(section => section.key === 'goal' || section.key === 'requirements').map(({ key, text }) => ({ key, text }));
        if (canonicalJson(originalInputs) !== canonicalJson(required)) throw new Error('This continuation names a different task goal or requirements; start a new standalone task');
        const scope = original.authority['scope'] as { projectRoot?: string; roots?: string[]; files?: string[]; excluded?: string[]; denied?: string[]; guarded?: string[] } | null;
        if (scope === undefined) throw new Error('The original ordinary task scope record is unavailable');
        const sorted = (paths: readonly string[] | undefined) => [...new Set(paths ?? [])].sort();
        if (original.authority['writer'] !== (request.writer === true)
          || original.task.environment.workingDirectory !== (request.workingDirectory ?? this.projectRoot)
          || (scope === null) !== (request.guarded === undefined)
          || scope && (scope.projectRoot !== request.guarded?.projectRoot
            || canonicalJson(sorted(scope.roots)) !== canonicalJson(sorted(request.guarded?.roots))
            || canonicalJson(sorted(scope.files)) !== canonicalJson(sorted(request.guarded?.files))
            || (['excluded', 'denied', 'guarded'] as const).some(key => (scope[key] ?? []).some(path => !request.guarded?.[key]?.includes(path))))) {
          throw new Error('This continuation names a different task scope; start a new standalone task');
        }
      }
      const outcome = invocationOutcomeSchema.safeParse(committedBody(run, runLayout.outcome(previous.data.invocation)));
      if (request.recoveryResume && outcome.success && outcome.data.ended === 'submitted') {
        const operations = await this.host.operations(agent);
        await operations.reconcileOwnedEffects(run.jobId, previous.data.invocation);
        const accepted = await operations.acceptance(run.jobId, previous.data.invocation);
        if (!accepted || accepted.schema !== request.submissionSchema || accepted.submissionHash !== outcome.data.submission?.hash) throw new Error(`Accepted result for ${previous.data.invocation} is unavailable`);
        const decision = decideTaskReentry({ authorized: !this.host.ignoring(run) && request.fenced?.() !== true,
          stopped: request.signal?.aborted === true, settled: (run.log.all('writer-released').filter(event => event.data.invocation === previous.data.invocation).at(-1)?.data.confirmed ?? outcome.data.settled.confirmed) && run.writer.blocked === undefined,
          unresolved: await operations.unresolvedEffects(run.jobId, previous.data.invocation),
          accepted: { value: accepted.value as T } });
        if (decision.action === 'wait') throw new Error(decision.reason);
        if (decision.action === 'deliver') return { id: previous.data.invocation, session: previous.data.session,
          ended: 'submitted', outcomeKind: 'submitted', value: decision.value, ref: outcome.data.session?.ref ?? '',
          kept: previous.data.session !== undefined && run.log.all('invocation-ended').find(event => event.data.invocation === previous.data.invocation)?.data.kept === true,
          settlementConfirmed: true };
      }
    }
    await this.host.adoptContinuity?.(run, `manual-invocation-${run.log.count('invocation-started') + 1}`);
    let current = previous && request.recoveryResume
      ? this.restartTaskRequest(request, previous.data.invocation, 'Continuing the pending standalone task') : request;
    let retries = 0;
    for (;;) {
      const result = await this.runInvocation(run, agent, current);
      const classification = taskInterruption({ ended: result.ended, interruption: result.interruption, classification: result.interruptionEvidence?.classification });
      if (result.id === '' || classification === null) return result;
      const operations = await this.host.operations(agent);
      await operations.reconcileOwnedEffects(run.jobId, result.id);
      const decision = decideTaskReentry({
        authorized: !this.host.ignoring(run) && request.fenced?.() !== true,
        stopped: request.signal?.aborted === true,
        settled: result.settlementConfirmed === true && run.writer.blocked === undefined,
        unresolved: await operations.unresolvedEffects(run.jobId, result.id),
      });
      if (decision.action === 'wait') return { ...result, pending: true, resourceReason: decision.reason };
      if (!mayRetryTask({ attempt: retries++, limit: run.policy.recovery?.automaticRetries ?? 2, classification })) return { ...result, pending: true, resourceReason: `Repeated interruption: ${result.resourceReason ?? result.error ?? classification}. The task remains pending; execute it again when the interruption is resolved.` };
      const delay = taskRetryDelay({ attempt: retries - 1, classification, retryAfterMs: result.interruptionEvidence?.retryAfterMs });
      if (!await waitForTaskRetry(delay, request.signal)) return { ...result, pending: true, resourceReason: 'Execution was cancelled during transport backoff' };
      current = this.restartTaskRequest(request, result.id, result.resourceReason ?? result.error ?? classification);
    }
  }

  /** Construct the same pending task fresh; hosted and standalone owners share this construction. */
  restartTaskRequest<T>(request: InvocationRequest<T>, predecessor: string, interruption: string): InvocationRequest<T> {
    const reason = `The previous attempt was interrupted: ${interruption}. Inspect current files and finish the pending assignment; preserve partial work and accepted results.`;
    const fresh = request.fallback?.(reason);
    const brief = fresh?.brief ?? request.brief;
    return { ...request, originalInvocation: undefined, restore: false,
      start: { mode: 'fresh' }, session: undefined, continuing: undefined,
      fork: undefined, replaces: undefined,
      ...(request.singleAdmission ? { onStarted: undefined } : {}),
      recoveryPredecessor: predecessor,
      prompt: fresh?.prompt ?? request.freshPrompt ?? request.prompt,
      ...(fresh ? { stepInputs: fresh.stepInputs } : {}),
      brief: brief ? { ...brief, sections: [...brief.sections, { key: 'support:interruption', text: reason }] } : undefined,
      task: request.task ? { ...request.task, literalSections: [...request.task.literalSections ?? [], { key: 'support:interruption', text: reason }] } : undefined,
    };
  }

  /** Present the effective ordinary input; preview owns no operation, tool or writer. */
  async preview<T>(run: R, agent: AgentPort, request: InvocationRequest<T>): Promise<DebugInspection['input']> {
    const source = request.start.mode === 'fresh' ? null : request.start.mode === 'continue' ? request.start.ref : request.start.from;
    let prior: PointContext | null = null;
    let continuityReason: string | null = null;
    if (source !== null) {
      try { prior = await (await this.host.operations(agent)).previewContext(run.jobId, source); }
      catch (error) { if (!(error instanceof ReusableSessionUnavailableError)) throw error; continuityReason = message(error); }
    }
    const fresh = continuityReason === null ? undefined : request.fallback?.(continuityReason);
    const current = fresh === undefined ? request : { ...request, prompt: fresh.prompt, brief: fresh.brief, stepInputs: fresh.stepInputs };
    // Writer constructors expose declarations separately; inspect never calls equip.
    if (current.writer && !current.previewEquipment) throw new Error('Prepared writer has no read-only tool declarations');
    const equipment = current.previewEquipment ?? { builtinTools: ['read', 'grep', 'ls'] as const, tools: [] };
    const consultation = consultationAvailability(current.stepInputs !== undefined && 'consultation' in current.stepInputs ? current.stepInputs.consultation ?? undefined : undefined, current.role);
    const tools = consultation.target === null ? equipment.tools : [...equipment.tools, consultArchitectDeclaration];
    const workingDirectory = current.workingDirectory ?? this.projectRoot;
    const builtinDeclarations = agent.builtinDeclarations?.(equipment.builtinTools, workingDirectory, current.role) ?? piBuiltinDeclarations(equipment.builtinTools, workingDirectory, current.role);
    const limits = invocationLimits(run.policy.limits, current);
    const spec: SessionSpec = { role: current.role, scope: { workingDirectory }, systemPrompt: current.systemPrompt,
      prompt: current.prompt, session: current.start, context: current.context ?? contextPolicyOf(run.policy, current.role),
      builtinTools: equipment.builtinTools, tools: [], onEvent: () => undefined, submission: { name: current.toolName, description: current.description,
        inputSchema: current.inputSchema, accept: async () => { throw new Error('Inspection cannot submit'); } } };
    const brief = current.brief ?? await this.host.taskBrief(run, current, spec, limits);
    const { packet } = composeOperationPacket({ runId: run.jobId, operationId: invocationId(run.log.count('invocation-started') + 1), loaded: current.loaded, brief,
      role: current.role, mode: prior === null ? 'fresh' : current.start.mode, workingDirectory, builtinDeclarations,
      tools, submissionName: current.toolName, source: prior?.point ?? null, prior,
      ...(current.callerText === undefined ? {} : { callerText: current.callerText }) });
    const inherited = [...prior?.inherited ?? []];
    const history = [...inherited, ...packet.additions];
    return { roleInstructions: packet.roleInstructions, message: packet.message, inherited, additions: [...packet.additions],
      effective: [...history.filter(item => !item.block && !['task', 'briefing-state'].includes(item.key)), ...effectiveBlocks(history).values(),
        ...packet.additions.filter(item => ['task', 'briefing-state'].includes(item.key))],
      tools: operationDeclarations(builtinDeclarations, tools, packet), source,
      continuity: source === null ? 'fresh' : continuityReason === null ? 'retained' : 'unavailable', continuityReason,
      scope: { ...current.scope, guarded: current.guarded === undefined ? null : { revision: current.guarded.revision, projectRoot: current.guarded.projectRoot, roots: current.guarded.roots, files: current.guarded.files, excluded: current.guarded.excluded ?? [], denied: current.guarded.denied ?? [], guarded: current.guarded.guarded ?? [] }, workingDirectory }, bounds: { ...limits, context: spec.context } };
  }

  private async invokeOnce<T>(run: R, agent: AgentPort, request: InvocationRequest<T>): Promise<InvocationResult<T>> {
    // The start is serialized with every other start, since the identifiers
    // are counted from the log; the session itself runs outside it, so a
    // reader and the writer run at once.
    const restored = (await this.host.restore?.(run, agent, request)) ?? null;
    if (restored?.result) return restored.result;
    const started = restored?.started ?? await run.starting.run(() => this.startInvocation(run, agent, request), request.reader === true ? 'after' : 'first');
    if ('refused' in started) {
      // A run that has spent its bounds starts nothing more. The writer's
      // path fails the run with the counter as evidence; a reader is only
      // refused, and the next writer invocation meets the same bound.
      await this.host.refused(run, started.refused, request.reader === true);
      return { id: '', ended: 'stopped', value: undefined, ref: '', outcomeKind: 'stopped', session: '', kept: false };
    }
    try {
      return await this.runSession(run, agent, started, restored ? { ...request, restore: restored.hasIntent } : request);
    } catch (error) {
      // A preparation obstruction with no dispatched operation has no model or
      // uncertain tool to replay. Retain its exception and prove settlement.
      const operation = await (await this.host.operations(agent)).originalOperation(run.jobId, started.id);
      if (operation !== null) throw error;
      const settled = await this.settleSession(run, started.id, { settled: async () => 'settled' }, request.reader === true);
      const evidence = interruptionEvidence(error, 'preparation');
      await this.endInvocation(run, started.id, started.session, finished('not-kept'), { ...stoppedOutcome(), ended: 'failed',
        interruption: 'adapter-fault', interruptionEvidence: evidence, error: message(error), settled }, undefined, started.transcript);
      return { id: started.id, ended: 'failed', value: undefined, ref: '', outcomeKind: 'failed', session: started.session, kept: false,
        interruption: 'adapter-fault', interruptionEvidence: evidence, error: message(error), settlementConfirmed: settled.confirmed, notStarted: true, elapsedMs: 0 };
    } finally {
      started.closed();
    }
  }

  /** The actual delivered packet and execution identity, committed as the invocation's next revision before its events. */
  private async prepareInvocation<T>(run: R, id: string,
    supplied?: { packet: TaskPacket; request: InvocationRequest<T> },
    identity?: import('../../subs/agent/src/interfaces/session-operations.js').SessionExecutionIdentity): Promise<void> {
    const prior = invocationRecord(run, id);
    let body = prior.body;
    if (supplied) {
      const { packet, request } = supplied;
      const hash = inputsHash([packet.roleInstructions, packet.message]);
      if (body.prompt.inputsHash !== undefined) {
        if (body.prompt.inputsHash !== hash || canonicalJson(body.prompt.manifest) !== canonicalJson(packet.manifest)) throw new Error('Original delivered invocation inputs changed');
      } else {
        let size: Invocation['scope']['size'];
        let readSize: Invocation['scope']['size'] = null;
        try {
          const baseline = run.baselineMeasurement;
          const snapshot = request.measured?.snapshot ?? (baseline === null ? null : measurementSnapshotSchema.parse(JSON.parse(await readFile(run.path(runLayout.measurement(baseline.id)), 'utf8'))));
          const declared: DeclaredScope = request.measured?.scope ?? { exactOwners: [], subtrees: [], apiViews: false, architectView: false, supportDocuments: [] };
          const actual = deliveredScopeInputs(declared, packet.manifest);
          readSize = invocationReadSize(snapshot, request.measured, request.writer === true);
          // Acquisition stays here and follows read-size calculation. No location
          // acquisition was performed by the baseline without a frozen snapshot.
          const acquired = snapshot === null ? actual.scope : await invocationScope(this.projectRoot, run.planId, declared, request.loaded, packet.message, packet.manifest);
          size = invocationScopeSize(snapshot, actual, acquired, request.role, request.measured !== undefined);
        } catch (error) {
          size = invocationScopeFailure(request.measured, request.role, message(error));
        }
        body = { ...body, prompt: { ...body.prompt, inputsHash: hash, manifest: { ...packet.manifest } }, scope: { ...body.scope, size, readSize } };
      }
    }
    if (identity) {
      if (body.sessionOperation?.sourcePoint && canonicalJson(body.sessionOperation.sourcePoint) !== canonicalJson(identity.sourcePoint)) throw new Error('Original invocation operation point changed');
      body = { ...body, sessionOperation: { ...identity, point: body.sessionOperation?.point } };
    }
    if (canonicalJson(body) === canonicalJson(prior.body)) return;
    await this.write(run, { type: 'invocation-prepared', data: { invocation: id, recorded: supplied ? 'delivered-inputs' : 'operation-identity' } },
      [{ path: runLayout.invocation(id), id, revision: prior.revision + 1, body }]);
  }

  /**
   * Everything before an invocation's session starts, under `run.starting`:
   * the run-wide bounds, the identifiers, the events that license it, its
   * transcript's start and, for the writer, the writer's acquisition.
   */
  private async startInvocation<T>(run: R, agent: AgentPort, request: InvocationRequest<T>): Promise<{ readonly refused: string } | StartedInvocation> {
    // The run-wide bounds are read before an invocation is started, so a run
    // that has spent them starts nothing more.
    const refusal = this.host.refusal(run);
    if (refusal !== null) return { refused: refusal };
    const id = invocationId(run.log.count('invocation-started') + 1);
    // A fresh or forked start opens a session; a continued one joins the
    // session the caller kept. The executor's ref stays the caller's.
    const opens = request.start.mode !== 'continue';
    if (!opens && request.session === undefined) throw new Error(`The ${request.role} invocation ${id} continues a session it does not name`);
    // Every start that is not fresh names its harness point and its reason.
    if (!opens && request.continuing === undefined) throw new Error(`The ${request.role} invocation ${id} continues a session without a reason`);
    if (request.start.mode === 'fork' && request.fork === undefined) throw new Error(`The ${request.role} invocation ${id} forks without naming its point`);
    const session = opens ? sessionId(run.log.count('session-opened') + 1) : request.session!;
    const continues = opens ? undefined : this.continuationOf(run, session, request.continuing!);
    const invocation = invocationSchema.parse({
      schema: 'ramify-agent.invocation/1',
      sessionOperation: { runId: run.jobId, operationId: id },
      id,
      role: request.role,
      work: request.work,
      attempt: request.attempt,
      session: requestedSession(request),
      prompt: { package: request.loaded.package, hash: request.loaded.hash, requestedInputsHash: inputsHash([request.systemPrompt, request.prompt, ...(request.callerText === undefined ? [] : [request.callerText])]) },
      // Actual delivered size is committed by invocation-prepared, before events.
      scope: { ...request.scope, size: null },
      writer: request.writer === true,
      ...(request.recoveryPredecessor === undefined ? {} : { recoveryPredecessor: request.recoveryPredecessor }),
      ...(request.candidateBefore === undefined ? {} : { candidateBefore: request.candidateBefore }),
      base: this.host.base(run),
      ...(request.startingTree === undefined ? {} : { startingTree: request.startingTree }),
      startedAt: this.host.now().toISOString(),
    } satisfies Invocation);

    const observations = await ObservationLog.open(run.path(runLayout.observations(id)));

    // Registered before any event, so a stop that arrives between the
    // invocation's start and its session's applies to a known invocation.
    let closed = () => undefined as void;
    run.live.set(id, { role: request.role, reader: request.reader === true, session: undefined, done: new Promise<void>(resolve => { closed = () => resolve(); }) });
    const release = () => {
      run.live.delete(id);
      closed();
    };
    try {
      if (opens) {
        await this.write(run, {
          type: 'session-opened',
          data: {
            session, role: request.role, work: request.work, executor: agent.name, model: this.host.model,
            ...(request.start.mode === 'fork' ? { fork: request.fork! } : {}),
            ...(request.replaces === undefined ? {} : { replaces: request.replaces }),
            ...(request.requestedBy === undefined ? {} : { requestedBy: request.requestedBy }),
          },
        });
        await this.host.afterWrite('session-opened', run.jobId);
      }
      await this.write(run, {
        type: 'invocation-started',
        data: {
          invocation: id, role: request.role, session, work: request.work, start: opens ? 'opened' : 'continued',
          ...(continues === undefined ? {} : { continues }),
        },
      }, [
        { path: runLayout.invocation(id), id, revision: 1, body: invocation },
      ]);
      // The inputs the invocation was constructed from, before its session
      // starts: a step run later builds the same invocation from them.
      if (request.stepInputs !== undefined) {
        const target = run.path(runLayout.stepInputs(id));
        await mkdir(dirname(target), { recursive: true });
        await writeFileAtomic(target, serializeStepInputs(request.stepInputs));
      }
      // The transcript's start holds the prompts, and is written before the
      // session starts, so a crash before the first reply still leaves them.
      const transcript = this.invocationTranscript(run, session, id, observations);
      if (request.writer === true) {
        // The writer is acquired before the session starts, so a stop that
        // arrives between them applies to a writer the log already names.
        run.writer.acquire(id);
        await this.write(run, { type: 'writer-acquired', data: { invocation: id, scopeRevision: request.scope.write } });
        await this.host.afterWrite('writer-acquired', run.jobId);
      }
      await request.onStarted?.(id, session);
      return { id, session, observations, transcript, closed: release };
    } catch (error) {
      release();
      throw error;
    }
  }

  private async runSession<T>(run: R, agent: AgentPort, started: StartedInvocation, request: InvocationRequest<T>): Promise<InvocationResult<T>> {
    const { id, session } = started;
    const limits = invocationLimits(run.policy.limits, request);
    return executePreparedTask({ ...started, agent, runId: run.jobId, projectRoot: this.projectRoot,
      request: { role: request.role, work: request.work, toolName: request.toolName, description: request.description, inputSchema: request.inputSchema,
        submissionSchema: request.submissionSchema, validate: request.validate, acceptedText: request.acceptedText, beforeSubmission: request.beforeSubmission,
        systemPrompt: request.systemPrompt, prompt: request.prompt, start: request.start, restore: request.restore,
        guarded: request.guarded, readModules: request.readModules, equip: request.equip, keep: request.keep, fenced: request.fenced,
        endedAs: request.endedAs, onCompactionStarted: request.onCompactionStarted, progress: request.progress, signal: request.signal,
        writer: request.writer, reader: request.reader, workingDirectory: request.workingDirectory, pendingPlainReturn: request.pendingPlainReturn,
        fork: request.fork, replaces: request.replaces, requestedBy: request.requestedBy, degraded: request.degraded },
      context: request.context ?? contextPolicyOf(run.policy, request.role), limits,
      watchdog: !(request.role === 'reviewer' || ['ramify-agent.reconciliation-submission/1', 'ramify-agent.nonfunctional-assessment-submission/1', 'ramify-agent.nonfunctional-investigation/1'].includes(request.submissionSchema)),
      index: run.index, declaredPaths: request.guarded?.roots ?? declaredRoots(run.index, request.measured?.readScope ?? request.measured?.scope).map(path => resolvePath(this.projectRoot, path)),
      startedAt: invocationSchema.parse(committedBody(run, runLayout.invocation(id))).startedAt, model: this.host.model,
      continues: request.start.mode === 'continue' ? this.continuationOf(run, session, request.continuing!) : undefined,
      destination: { run: run.jobId, invocation: id, submission: runLayout.submission(id) },
      directory: run.directory, transcriptPath: run.path(runLayout.transcript(session)), content: run.store,
    }, {
      now: () => this.host.now(), warn: text => this.host.warn(text), closed: () => this.host.ignoring(run),
      authorityCurrent: async () => !this.host.authorityCurrent || await this.host.authorityCurrent(),
      afterStarted: () => this.host.afterWrite('invocation-started', run.jobId),
      writeSubmission: content => writeFileAtomic(run.path(runLayout.submission(id)), content), readSubmission: () => readIfExists(run.path(runLayout.submission(id))),
      start: async (spec, hooks) => (await this.host.operations(agent)).start({ runId: run.jobId, operationId: id, session, loaded: request.loaded,
        brief: request.brief ?? await this.host.taskBrief(run, request, spec, limits), spec, restore: request.restore,
        ...(request.callerText === undefined ? {} : { callerText: request.callerText }),
        authority: { scope: request.guarded === undefined ? null : { revision: request.guarded.revision, projectRoot: request.guarded.projectRoot, roots: request.guarded.roots, files: request.guarded.files, excluded: request.guarded.excluded ?? [], denied: request.guarded.denied ?? [], guarded: request.guarded.guarded ?? [] }, writer: request.writer === true, work: request.work },
        validator: { name: request.toolName, schema: request.inputSchema, submissionSchema: request.submissionSchema, bound: limits.rejectedSubmissionsPerTurn },
        destination: { run: run.jobId, invocation: id, submission: runLayout.submission(id) }, ...hooks }),
      acceptance: async () => (await this.host.operations(agent)).acceptance(run.jobId, id),
      prepared: (packet, identity) => this.prepareInvocation(run, id, packet ? { packet, request } : undefined, identity),
      publish: agentSession => { const live = run.live.get(id); if (live) live.session = agentSession; },
      equipment: (context, base) => {
        const consultation = consultationAvailability(request.stepInputs !== undefined && 'consultation' in request.stepInputs ? request.stepInputs.consultation ?? undefined : undefined, request.role);
        const tool = consultation.target === null ? null : consultationTool({ run, runner: this, agent, packages: request.consultationPackages ?? new Map(),
          target: consultation.target, global: consultation.global, caller: { session, role: request.role, work: request.work }, views: request.brief?.environment.views ?? [],
          projectRoot: this.projectRoot, now: () => this.host.now(), holdMs: limits.invocationAbsoluteMs }, context);
        return tool === null ? base : { ...base, tools: [...base.tools ?? [], tool] };
      },
      preflightSettlement: async (settle, boundMs) => {
        if (run.writer.held !== id) return stoppedOutcome().settled;
        const toolsSettled = await settleSessionEquipment(settle, boundMs).catch(() => false);
        const released = await run.writer.release(id, toolsSettled ? undefined : { settled: async () => 'timed-out' });
        await this.write(run, { type: 'writer-released', data: { invocation: id, confirmed: released.confirmed, groupsKilled: released.groupsKilled } });
        await this.host.afterWrite('writer-released', run.jobId); return released;
      },
      settle: (agentSession, reader) => this.settleSession(run, id, agentSession, reader),
      afterTools: async transcript => {
        if (!run.log.all('consultation-started').some(event => event.data.caller === id)) return;
        await transcript.drain();
        const results = await readTranscript(run.path(runLayout.transcript(session))).catch(error => { this.host.warn(`Run ${run.jobId}: consultation caller transcript unavailable: ${message(error)}`); return { entries: [] }; });
        for (const entry of results.entries) {
          if (entry.invocation !== id || entry.type !== 'message' || entry.role !== 'tool-result' || entry.tool !== 'consult_architect') continue;
          const consultation = consultationId(id, entry.callId);
          if (consultationOutcome(run.log, consultation)?.delivery !== 'recorded' && consultationOutcome(run.log, consultation) !== null) await run.mutex.run(() => recordConsultationDelivery(run.log, consultation, { session, entry: entry.n }));
        }
      },
      snapshot: observations => recordSettledSnapshot({ projectRoot: this.projectRoot, changed: () => this.host.git.changedPaths(this.projectRoot, this.host.base(run)), scope: request.guarded }, observations),
      candidateAfter: async () => {
        if (request.candidateBefore === undefined) return undefined;
        const safety = await scratchSafetyRule(this.projectRoot, await declaredModuleDirectories(this.projectRoot), this.host.git);
        return safety.outcome === 'passed' ? (await this.host.previewCandidateTree()).tree : undefined;
      },
      end: (keeping, body, degraded, transcript) => this.endInvocation(run, id, session, keeping, body, degraded, transcript),
    });
  }

  /**
   * What the harness observed when one invocation's session ended: the
   * session idle, and every process group it registered killed and gone.
   * Neither `stop()` resolving nor the agent's word is evidence.
   */
  async settleSession(run: R, id: string, session: Pick<AgentSession, 'settled'>, reader = false) {
    if (run.writer.held === id) {
      const released = await run.writer.release(id, session);
      // The release is in the log before anything else may write or check:
      // an unconfirmed one blocks every writer and every gate that follows.
      await this.write(run, {
        type: 'writer-released',
        data: { invocation: id, confirmed: released.confirmed, groupsKilled: released.groupsKilled },
      });
      await this.host.afterWrite('writer-released', run.jobId);
      return released;
    }
    const idle = await session.settled().catch(() => 'timed-out' as const);
    const settled = { confirmed: idle === 'settled', at: this.host.now().toISOString(), groupsKilled: 0, lateWrites: [] as string[] };
    // A reader was given no tool that writes or starts a process, so its
    // session not becoming idle leaves the tree as the writer's settlement
    // found it; it is recorded on its outcome and blocks no writer. Its
    // session stays the run's to stop at a stop or a shutdown.
    if (!settled.confirmed && !reader) {
      run.writer.markUnsettled(id, 'its session did not become idle within the implementation\'s bound', session);
    }
    return settled;
  }

  /**
   * Closes one invocation: the outcome record and the event, in one
   * transition, with whether the harness keeps its session.
   */
  async endInvocation(
    run: R,
    id: string,
    session: SessionId,
    keeping: SessionKeeping,
    body: Omit<InvocationOutcome, 'schema' | 'invocation'>,
    degraded?: DegradeRelation,
    transcript?: InvocationTranscript,
  ): Promise<void> {
    if (run.log.all('invocation-ended').some(event => event.data.invocation === id)) return;
    const outcome = invocationOutcomeSchema.parse({ schema: 'ramify-agent.invocation-outcome/1', invocation: id, ...body });
    const ended = {
      invocation: id, ended: outcome.ended, submission: outcome.submission?.hash ?? null, session,
      ...(outcome.unknownPlacement === undefined ? {} : { unknownPlacement: outcome.unknownPlacement }),
      ...(outcome.placementFailure === undefined ? {} : { placementFailure: outcome.placementFailure }),
      ...(degraded === undefined ? {} : { degraded }),
    };
    // A session operation that settled without a point leaves nothing to
    // continue; the kept session says so rather than implying it can resume.
    const pointRetained = outcome.sessionOperation?.point === null && outcome.session?.ref === '' ? { pointRetained: false as const } : {};
    const opened = this.host.openedOperations();
    const packet = opened === undefined ? null : await opened.then(operations => operations.packet(run.jobId, id), () => null);
    const latest = packet === null ? null : invocationRecord(run, id);
    const invocation = latest?.body ?? null;
    const written = await this.write(run, {
      type: 'invocation-ended',
      data: keeping.kept ? { ...ended, kept: true, ...pointRetained } : { ...ended, kept: false, finished: keeping.finished },
    }, [
      { path: runLayout.outcome(id), id, revision: 1, body: outcome },
      ...(invocation === null || packet === null ? [] : [{ path: runLayout.invocation(id), id, revision: latest!.revision + 1, body: { ...invocation, prompt: { ...invocation.prompt, inputsHash: inputsHash([packet.roleInstructions, packet.message]), manifest: packet.manifest } } }]),
    ]);
    // The transcript's end follows the log's, so the point it names is one
    // the log has; recovery ends an interrupted invocation's transcript too.
    if (written !== 'ended') {
      await (transcript ?? this.invocationTranscript(run, session, id)).end({
        ended: outcome.ended,
        interruption: outcome.interruption ?? null,
        error: outcome.error ?? null,
        actual: outcome.session === undefined ? null : {
          mode: outcome.session.mode === 'continued' ? 'continue' : outcome.session.mode,
          degradedReason: outcome.session.degradedReason ?? null,
        },
      });
    }
    await this.host.afterWrite('invocation-ended', run.jobId);
  }
}

async function readIfExists(path: string): Promise<Buffer | undefined> {
  try {
    return await readFile(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
}
