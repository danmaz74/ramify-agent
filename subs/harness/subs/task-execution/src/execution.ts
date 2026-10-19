import type { AgentPort, AgentSession, ContextPolicy, SessionSpec, SessionStart, JsonSchema, CompactionReason } from '../../agent/src/interfaces/port.js';
import { interruptionEvidence } from '../../agent/src/interfaces/port.js';
import type { SessionExecutionIdentity } from '../../agent/src/interfaces/session-operations.js';
import type { ArchitectIndex } from '../../evidence/src/views.js';
import type { Invocation, InvocationOutcome, DegradeRelation, ContinueRelation, ForkRelation, ReplaceRelation, RequestRelation } from './records.js';
import type { GuardedScope } from '../../../src/guard/write-guard.js';
import { canonicalJson } from '../../../src/jobs/commands.js';
import { createHash } from 'node:crypto';
import type { Role } from '../../../src/interfaces/protocol/runs.js';
import type { MutationSnapshot } from '../../../src/run/mutations.js';
import { ExcursionWatcher } from './excursions.js';
import type { ObservationLog } from './observations.js';
import { SubmissionJudge, type SubmissionValidation } from './submissions.js';
import { InvocationBounds, PortEventRecorder, endedOf, type CallInFlight, type InvocationLimits } from './port-events.js';
import { ReusableSessionUnavailableError, settleSessionEquipment, readSessionPointReference, type PreparedOperationInput, type TaskSessionOperations } from './session-operations.js';
import type { TaskPacket } from './delivery/packet.js';
import type { EquipContext, Equipment } from './equipment.js';
import type { ContentReader } from './transcripts/store.js';
import { readTranscript, readBody } from './transcripts/writer.js';
import { verdictNote, type InvocationTranscript } from './transcripts/recorder.js';
import { kept, finished, stoppedOutcome, type SessionKeeping, type InvocationProgress, type InvocationResult } from './results.js';
const sha256 = (value: string | Uint8Array): string => createHash('sha256').update(value).digest('hex');
const message = (error: unknown): string => error instanceof Error ? error.message : String(error);

/** Prepared execution data only; no task construction, scheduler, mutable run or log. */
export interface PreparedTaskRequest<T> {
  readonly role: Role;
  readonly work: Invocation['work'];
  readonly toolName: string;
  readonly description: string;
  readonly inputSchema: JsonSchema;
  readonly submissionSchema: string;
  readonly validate: (value: unknown) => SubmissionValidation<T> | Promise<SubmissionValidation<T>>;
  readonly acceptedText?: ((value: T) => string) | undefined;
  readonly beforeSubmission?: ((value: unknown, signal: AbortSignal) => Promise<void>) | undefined;
  readonly systemPrompt: string;
  readonly prompt: string;
  readonly start: SessionStart;
  readonly restore?: boolean | undefined;
  readonly guarded?: GuardedScope | undefined;
  readonly readModules?: readonly string[] | undefined;
  readonly equip?: ((context: EquipContext) => Equipment) | undefined;
  readonly keep: (ended: InvocationOutcome['ended'], value: T | undefined) => SessionKeeping;
  readonly fenced?: (() => boolean) | undefined;
  readonly endedAs?: (() => InvocationOutcome['ended'] | undefined) | undefined;
  readonly onCompactionStarted?: ((checkpoint: { readonly invocation: string; readonly ordinal: number; readonly reason: CompactionReason }, signal: AbortSignal) => Promise<{ readonly action: 'continue' | 'handoff'; readonly reason: string }>) | undefined;
  readonly progress?: ((event: InvocationProgress) => void) | undefined;
  readonly signal?: AbortSignal | undefined;
  readonly writer?: boolean | undefined;
  readonly reader?: boolean | undefined;
  readonly workingDirectory?: string | undefined;
  readonly pendingPlainReturn?: boolean | undefined;
  readonly fork?: ForkRelation | undefined;
  readonly replaces?: ReplaceRelation | undefined;
  readonly requestedBy?: RequestRelation | undefined;
  readonly degraded?: { readonly requested: 'fresh' | 'continued' | 'fork'; readonly reason: string } | undefined;
}
export interface PreparedTask<T> {
  readonly id: string; readonly session: string; readonly runId: string; readonly projectRoot: string;
  readonly request: PreparedTaskRequest<T>; readonly agent: AgentPort;
  readonly observations: ObservationLog; readonly transcript: InvocationTranscript;
  readonly startedAt: string; readonly model: string | null;
  readonly context: ContextPolicy;
  readonly limits: InvocationLimits & { readonly rejectedSubmissionsPerTurn: number; readonly stopSettleMs: number };
  readonly watchdog: boolean;
  readonly index: ArchitectIndex | null; readonly declaredPaths: readonly string[];
  readonly continues: ContinueRelation | undefined;
  readonly destination: Readonly<Record<string, unknown>>;
  readonly directory: string; readonly transcriptPath: string; readonly content: ContentReader;
}
/** Workflow commits stay atomic behind these per-invocation callbacks. */
export interface TaskExecutionPorts<T> {
  now(): Date; warn(text: string): void;
  closed(): boolean; authorityCurrent(): Promise<boolean>;
  afterStarted(): Promise<void>;
  writeSubmission(content: string): Promise<void>; readSubmission(): Promise<Buffer | undefined>;
  start(spec: SessionSpec, hooks: Pick<PreparedOperationInput, 'accepted' | 'currentAuthority' | 'identified' | 'prepared'>): Promise<AgentSession>;
  acceptance(): ReturnType<TaskSessionOperations['acceptance']>;
  prepared(packet?: TaskPacket, identity?: SessionExecutionIdentity): Promise<void>;
  publish(session: AgentSession): void;
  equipment(context: EquipContext, base: Equipment): Equipment;
  preflightSettlement(settle: Equipment['settle'], boundMs: number): Promise<InvocationOutcome['settled']>;
  settle(session: Pick<AgentSession, 'settled'>, reader?: boolean): Promise<InvocationOutcome['settled']>;
  afterTools(transcript: InvocationTranscript): Promise<void>;
  snapshot(observations: ObservationLog): Promise<MutationSnapshot>;
  candidateAfter(): Promise<string | undefined>;
  end(keeping: SessionKeeping, body: Omit<InvocationOutcome, 'schema' | 'invocation'>, degraded?: DegradeRelation, transcript?: InvocationTranscript): Promise<void>;
}
/** Runs one authorized prepared attempt; callers own admission, retries and completion. */
export async function executePreparedTask<T>(input: PreparedTask<T>, ports: TaskExecutionPorts<T>): Promise<InvocationResult<T>> {
  const { id, session, observations, transcript, request, agent } = input;
  const verdicts: Array<{ accepted: boolean; answer: string }> = [];
  const progress = (event: InvocationProgress): void => {
    if (event.type === 'submission') verdicts.push({ accepted: event.accepted, answer: event.answer });
    try { request.progress?.(event); } catch { /* A reader that fails does not end the invocation. */ }
  };
  // What the harness does with the session once this invocation ends. A
  // run that is ending uses none again.
  const keeping = (ended: InvocationOutcome['ended'], value: T | undefined): SessionKeeping =>
    (ports.closed() ? finished('run-ended') : request.keep(ended, value));
  await ports.afterStarted();
  if (ports.closed() || request.fenced?.() === true) {
    await ports.end(keeping('stopped', undefined), stoppedOutcome(), undefined, transcript);
    return { id, ended: 'stopped', value: undefined, ref: '', outcomeKind: 'stopped', session, kept: false };
  }

  const startedAt = ports.now().getTime();
  let value: T | undefined;
  let submissionHash: string | null = null;
  let recoveryRequested = false;
  const judge = new SubmissionJudge<T>({
    target: request.toolName,
    validate: input => request.validate(input),
    accept: async accepted => {
      const content = `${JSON.stringify({ schema: request.submissionSchema, ...(accepted as object) }, null, 2)}\n`;
      await ports.writeSubmission(content);
      value = accepted;
      submissionHash = sha256(content);
    },
    observations,
    ...(request.acceptedText === undefined ? {} : { acceptedText: request.acceptedText }),
    closed: () => (ports.closed() || recoveryRequested || request.fenced?.() === true || request.signal?.aborted === true
      || request.endedAs?.() === 'invalid-submission' ? 'This invocation accepts no further submissions.' : undefined),
  });

  // Read boundaries are soft: an excursion into another module is
  // permitted, recorded once, and reminded of once.
  const excursions = new ExcursionWatcher({
    projectRoot: input.projectRoot,
    index: input.index,
    scope: request.guarded,
    readModules: request.readModules,
  });
  const context = input.context;
  const recorder = new PortEventRecorder({
    projectRoot: input.projectRoot, workingDirectory: request.workingDirectory ?? input.projectRoot, observations, judge, excursions, context, transcript,
    invocation: { id, role: request.role, startedAt: input.startedAt, submissionTool: request.toolName,
      // A writer's searches are judged against its guarded roots, a
      // reader's against the modules its declared scope selects.
      declaredPaths: input.declaredPaths },
  });
  // Actual producer progress resets idle detection; passive observations do not.
  // A command the equipment runs for the session holds it instead. An
  // engineer's own bounds replace the policy's; a reader's may only be
  // tighter.
  const limits = input.limits;
  const bounds = new InvocationBounds(limits);
  // What was in flight at the moment a bound fired, before the stop it
  // asks for ends those calls.
  let inFlightAtBound: CallInFlight[] | undefined;
  bounds.onReached(() => { recoveryRequested = true; inFlightAtBound = recorder.inFlight(); });
  const equipContext: EquipContext = {
    invocation: id,
    observations,
    callId: tool => recorder.callId(tool),
    reminders: () => excursions.takeReminders(),
    transcript,
    hold: timeoutMs => bounds.hold(timeoutMs),
    waitForProducer: () => bounds.pauseForWait(),
  };
  const baseEquipment = request.equip?.(equipContext) ?? {};
  const equipment = ports.equipment(equipContext, baseEquipment);
  let budget: InvocationOutcome['budget'] | undefined;
  const { guard, afterMutation } = equipment;

  const spec: SessionSpec = {
    role: request.role,
    scope: { workingDirectory: request.workingDirectory ?? input.projectRoot },
    systemPrompt: request.systemPrompt,
    prompt: request.prompt,
    session: request.start,
    context,
    builtinTools: equipment.builtinTools ?? ['read', 'grep', 'ls'],
    tools: [...(equipment.tools ?? [])],
    ...(guard === undefined ? {} : {
      guard: request.progress === undefined ? guard : async call => {
        const decision = await guard(call);
        if (!decision.allow) progress({ type: 'harness-text', callId: call.callId, tool: call.tool, kind: 'refusal', text: decision.text });
        return decision;
      },
    }),
    ...(afterMutation === undefined ? {} : {
      afterMutation: request.progress === undefined ? afterMutation : async call => {
        const appended = await afterMutation(call);
        if (appended !== null) progress({ type: 'harness-text', callId: call.callId, tool: call.tool, kind: 'appended', text: appended.text });
        return appended;
      },
    }),
    submission: {
      name: request.toolName,
      description: request.description,
      inputSchema: request.inputSchema,
      accept: async (input, signal) => {
        await request.beforeSubmission?.(input, signal);
        signal.throwIfAborted();
        // The call's ID keys its rejection observation to the call the
        // transcript and the tool-start observation name.
        const callId = recorder.callId(request.toolName);
        const verdict = await judge.judge(input, callId);
        transcript.note(verdictNote(callId, request.toolName, verdict));
        progress({ type: 'submission', input, accepted: verdict.accepted, answer: verdict.accepted ? verdict.text ?? '' : verdict.errors.join('\n') });
        return verdict;
      },
    },
    ...(request.onCompactionStarted === undefined ? {} : { onCompactionStarted: (checkpoint, signal) => request.onCompactionStarted!({ invocation: id, ...checkpoint }, signal) }),

    onEvent: event => {
      bounds.observe(event);
      if (request.progress !== undefined) {
        if (event.type === 'tool-started' && event.tool !== request.toolName) {
          progress({ type: 'tool-call', callId: event.callId, tool: event.tool, input: event.input });
        } else if (event.type === 'tool-finished' && event.isError && event.tool !== request.toolName) {
          progress({ type: 'tool-error', callId: event.callId, tool: event.tool, text: event.errorText ?? '' });
        } else if (event.type === 'message' && event.role === 'assistant' && event.blocks.some(block => block.type === 'text' && block.text.trim() !== '')) {
          // The assistant's own text; its tool calls are shown as calls.
          progress({ type: 'message', text: event.text });
        }
      }
      void recorder.record(event)
        .catch(error => ports.warn(`Run ${input.runId}: observation not recorded: ${message(error)}`));
    },
  };

  let agentSession: AgentSession & { readonly unavailableReason?: string | undefined };
  try {
    agentSession = await ports.start(spec, {
      accepted: () => { if (value === undefined || submissionHash === null) throw new Error('Accepted destination was not retained'); return { value, schema: request.submissionSchema, submissionHash }; }, currentAuthority: async () => await ports.authorityCurrent() && !ports.closed() && !recoveryRequested && request.fenced?.() !== true && request.signal?.aborted !== true,
      identified: async identity => {
        recorder.identify(identity);
        await ports.prepared(undefined, identity);
      },
      prepared: async (packet, declarations) => {
        await ports.prepared(packet);
        const recorded = await readTranscript(input.transcriptPath).catch(error => {
          if (request.restore === true) throw error;
          // A new invocation keeps display transcript failures as coverage gaps.
          // Its operation/store input remains authoritative.
          return { entries: [], unreadable: [] };
        });
        const starts = recorded.entries.filter(entry => entry.type === 'started' && entry.invocation === id);
        if ((request.restore === true && recorded.unreadable.length > 0) || starts.length > 1) throw new Error('Original invocation transcript start is unavailable or ambiguous');
        const prior = starts[0];
        if (prior?.type === 'started') {
          if (prior.role !== request.role || JSON.stringify(prior.work) !== JSON.stringify(request.work) ||
            await readBody(input.directory, input.content, prior.systemPrompt) !== packet.roleInstructions ||
            await readBody(input.directory, input.content, prior.prompt) !== packet.message) throw new Error('Original invocation transcript input identity changed');
          return;
        }
        progress({ type: 'started', invocation: id, session, message: packet.message });
        await transcript.started({ role: request.role, work: request.work, start: request.start.mode === 'continue' ? 'continued' : 'opened', requested: request.start.mode,
          continues: input.continues, fork: request.fork, replaces: request.replaces, requestedBy: request.requestedBy,
          executor: agent.name, model: input.model, systemPrompt: packet.roleInstructions, prompt: packet.message,
          declarations, additions: packet.additions });
      } });
  } catch (error) {
    const keptAs = keeping('failed', undefined);
    const failure = `The agent session could not start: ${message(error)}`;
    const interruption = error instanceof ReusableSessionUnavailableError && request.start.mode !== 'fresh' ? 'session-lost' as const : 'adapter-fault' as const;
    // Known reusable-context refusal occurs before dispatch. The ordinary
    // fresh fallback must first release the writer acquired for that attempt.
    let preflightSettlement = stoppedOutcome().settled;
    preflightSettlement = await ports.preflightSettlement(equipment.settle, limits.stopSettleMs);

    await ports.end(keptAs, {
      ...stoppedOutcome(),
      ended: 'failed',
      interruption,
      interruptionEvidence: interruptionEvidence(error, interruption === 'session-lost' ? 'unknown' : 'adapter-fault'),
      error: failure,
      settled: preflightSettlement,
    }, undefined, transcript);
    return {
      id, ended: 'failed', value: undefined, ref: '', outcomeKind: 'failed', session, kept: keptAs.kept,
      interruption, error: failure, elapsedMs: 0, inFlight: [], lastText: null, notStarted: true,
      interruptionEvidence: interruptionEvidence(error, interruption === 'session-lost' ? 'unknown' : 'adapter-fault'), settlementConfirmed: preflightSettlement.confirmed,
    };
  }
  ports.publish(agentSession);
  // A start the executor could not honor is known only now, after the
  // invocation's start is committed; its end records it.
  const degraded: DegradeRelation | undefined = request.degraded !== undefined && request.degraded.requested !== 'fresh'
    ? { requested: request.degraded.requested === 'continued' ? 'continue' : request.degraded.requested, actual: agentSession.start.mode, reason: request.degraded.reason }
    : request.start.mode !== 'fresh' && agentSession.start.mode !== request.start.mode
    ? { requested: request.start.mode, actual: agentSession.start.mode, reason: agentSession.start.degradedReason ?? null }
    : undefined;

  // A caller's stop asks the session to stop, as a bound does.
  let stoppedByCaller = false;
  const stop = () => {
    stoppedByCaller = true;
    void agentSession.stop().catch(() => undefined);
  };
  if (request.signal?.aborted === true) stop();
  else request.signal?.addEventListener('abort', stop, { once: true });
  // A stalled invocation requests recovery. Settlement below establishes
  // whether another owner may safely continue its pending task.
  let outcome: Awaited<AgentSession['outcome']>;
  try {
    // A quiet reviewer or reconciliation is still authorized review work.
    // Other roles retain the progress watchdog; explicit caller cancellation
    // above and actual provider failures remain effective for every role.
    outcome = await (input.watchdog ? bounds.outcome(agentSession) : agentSession.outcome);
  } finally {
    request.signal?.removeEventListener('abort', stop);
  }
  // Acceptance is durable before the acknowledgement. A failed stream after
  // that acceptance completes this transition without asking for another submission.
  if (value !== undefined && submissionHash !== null && (outcome.kind === 'failed' || outcome.kind === 'resource-pending' || outcome.kind === 'checkpoint-pending')) outcome = { kind: 'submitted', input: value };
  if (outcome.kind === 'resource-pending' || outcome.kind === 'context-budget-reached' || outcome.kind === 'checkpoint-pending') recoveryRequested = true;
  if (outcome.kind === 'submitted' && value === undefined) {
    const accepted = await ports.acceptance();
    const bytes = await ports.readSubmission();
    if (!accepted || !bytes || accepted.schema !== request.submissionSchema || canonicalJson(accepted.destination) !== canonicalJson(input.destination) || canonicalJson(accepted.validator) !== canonicalJson({ name: request.toolName, schema: request.inputSchema, submissionSchema: request.submissionSchema, bound: limits.rejectedSubmissionsPerTurn }) || sha256(bytes) !== accepted.submissionHash || canonicalJson(accepted.input) !== canonicalJson(outcome.input)) throw new Error('Original accepted destination is unavailable or changed');
    const { schema, ...body } = JSON.parse(bytes.toString('utf8')) as Record<string, unknown>;
    if (schema !== accepted.schema || canonicalJson(body) !== canonicalJson(accepted.value)) throw new Error('Original accepted destination value changed');
    value = accepted.value as T; submissionHash = accepted.submissionHash;
  }
  const interruption = bounds.interruption ?? (agentSession.unavailableReason === undefined ? undefined : 'session-lost');
  const structured = outcome.kind === 'failed' ? outcome.evidence ?? { classification: 'unknown' as const, diagnostic: outcome.error }
    : outcome.kind === 'resource-pending' ? outcome.evidence : undefined;
  const resource = outcome.kind === 'resource-pending' ? outcome.resource : outcome.kind === 'context-budget-reached' ? 'context' as const : undefined;
  const resourceReason = outcome.kind === 'resource-pending' ? outcome.reason
    : outcome.kind === 'context-budget-reached' ? 'Legacy context return requires source-backed continuation' : undefined;
  const inFlight = inFlightAtBound ?? recorder.inFlight();
  const elapsedMs = ports.now().getTime() - startedAt;
  if (outcome.kind === 'context-budget-reached') {
    budget = { threshold: context.budgetTokens ?? 0, observed: outcome.tokens, reportDelivered: outcome.report !== undefined };
    transcript.note({ kind: 'budget-reached', tokens: outcome.tokens, threshold: context.budgetTokens, reportDelivered: outcome.report !== undefined });
  }

  // Whatever the equipment started ends before the writer is released:
  // discarding a reply is not shutdown, and a command still running is a
  // command that can still write.
  const equipmentSettled = await settleSessionEquipment(equipment.settle, limits.stopSettleMs).catch(error => { ports.warn(`Run ${input.runId}: ${id} did not settle its own tools: ${message(error)}`); return false; });

  // An architect writes nothing, so it holds no writer; its settlement is
  // still the harness's own observation of the session.
  const settled = await ports.settle(equipmentSettled ? agentSession : { settled: async () => 'timed-out' as const }, request.reader === true);
  if (settled.confirmed) await equipment.drained?.();
  // `onEvent` cannot be async at the port boundary. Its ordered writes must
  // still finish before gaps are derived and before this driver can settle.
  await recorder.drain();
  await ports.afterTools(transcript);
  await recorder.recordGaps(agent);
  const ref = agentSession.ref;

  // What the tree says changed since the invocation's base. It is the
  // only observation that sees a write no guard saw, and comparing it with
  // the scope is what fills `outsideScope`. Nothing here blocks anything.
  let outsideScope: string[] = [];
  let unknownPlacement: string[] = [];
  let placementFailure: string | undefined;
  let changed: string[] | undefined;
  if (request.writer === true) {
    const snapshot = await ports.snapshot(observations);
    outsideScope = [...snapshot.outsideScope];
    unknownPlacement = [...snapshot.unknownPlacement];
    placementFailure = snapshot.placementFailure;
    changed = [...snapshot.paths];
  }

  const ended = outcome.kind === 'submitted' ? 'submitted' : stoppedByCaller ? 'stopped' : resource !== undefined ? endedOf(outcome.kind, false)
    : interruption !== undefined ? 'failed' : request.endedAs?.() ?? endedOf(outcome.kind, false);
  const pending = !stoppedByCaller && request.fenced?.() !== true && !ports.closed() && (resource !== undefined || outcome.kind === 'checkpoint-pending' || request.pendingPlainReturn === true && outcome.kind === 'ended' && ended === 'ended' && settled.confirmed && ref !== '');
  const keptAs = pending ? kept : keeping(ended, ended === 'submitted' ? value : undefined);
  const candidateAfter = await ports.candidateAfter();
  const error = interruption === 'idle-timeout'
    ? `No execution progress for ${limits.invocationIdleMs} ms`
    : outcome.kind === 'failed' ? outcome.error : undefined;
  const callerStop = stoppedByCaller && interruption === undefined && outcome.kind !== 'failed' ? { error: 'Stopped by the caller' } : {};
  await ports.end(keptAs, {
    ended,
    ...(interruption === undefined ? {} : { interruption, error }),
    ...(structured === undefined ? {} : { interruptionEvidence: structured }),
    ...(resource === undefined ? {} : { resource, resourceReason }),
    ...(outcome.kind === 'checkpoint-pending' ? { checkpointReason: outcome.reason } : {}),
    // What the implementation answered, not what was asked for: a fork it
    // could not take is a fresh session, and the comparison of fork cost
    // must not be corrupted by one that silently became fresh.
    sessionOperation: { runId: input.runId, operationId: id, ...(readSessionPointReference(ref) === null ? { point: null } : { sessionId: readSessionPointReference(ref)!.point.sessionId, point: readSessionPointReference(ref)!.point }) },
    session: {
      ref,
      mode: agentSession.start.mode === 'continue' ? 'continued' : agentSession.start.mode,
      ...(agentSession.start.degradedReason === undefined ? {} : { degradedReason: agentSession.start.degradedReason }),
    },
    disposition: ports.closed() ? 'superseded' : ended === 'submitted' ? 'applied' : 'incomplete',
    submission: submissionHash === null ? null : { hash: submissionHash },
    rejectedSubmissions: judge.rejections,
    ...(budget === undefined ? {} : { budget }),
    settled,
    outsideScope,
    unknownPlacement,
    ...(placementFailure === undefined ? {} : { placementFailure }),
    ...(candidateAfter === undefined ? {} : { candidateAfter }),
    usage: recorder.outcomeUsage(agent),
    elapsedMs,
    ...(outcome.kind === 'failed' && interruption === undefined ? { error: outcome.error } : {}),
    ...callerStop,
  }, degraded, transcript);

  return {
    id,
    ended,
    value: ended === 'submitted' ? value : undefined,
    ref,
    outcomeKind: resource !== undefined || ended === 'submitted' ? outcome.kind : interruption === undefined ? outcome.kind : 'failed',
    ...(outcome.kind === 'checkpoint-pending' ? { checkpointReason: outcome.reason } : {}),
    session,
    kept: keptAs.kept,
    ...(interruption === undefined ? {} : { interruption }),
    ...(structured === undefined ? {} : { interruptionEvidence: structured }),
    ...(ended === 'failed' && error !== undefined ? { error } : {}),
    ...callerStop,
    actual: agentSession.start.mode,
    elapsedMs,
    inFlight,
    lastText: recorder.lastText ?? (outcome.kind === 'ended' ? outcome.message ?? null : null),
    pending, settlementConfirmed: settled.confirmed, verdicts,
    ...(resource === undefined ? {} : { resource, resourceReason }),
    ...(changed === undefined ? {} : { changed }),
  };
}

/** Optional reusable history is an optimization; the workflow admits the prepared fresh successor. */
export async function executeWithContextFallback<T>(input: {
  readonly mode: SessionStart['mode']; readonly allowFreshFallback: boolean; readonly signal?: AbortSignal | undefined;
  readonly blocked: () => boolean; readonly attempt: () => Promise<InvocationResult<T>>;
  readonly fresh: (result: InvocationResult<T>, reason: string) => Promise<InvocationResult<T>>;
}): Promise<InvocationResult<T>> {
  const result = await input.attempt();
  if (!input.allowFreshFallback || result.settlementConfirmed === false || input.blocked() || Boolean(input.signal?.aborted)
    || input.mode === 'fresh' || result.interruption !== 'session-lost') return result;
  return input.fresh(result, result.error ?? 'The retained session is unavailable');
}
