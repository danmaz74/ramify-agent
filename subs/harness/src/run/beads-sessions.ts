import { join } from 'node:path';
import { z } from 'zod';
import type { AgentEvent } from '../../subs/agent/src/interfaces/port.js';
import type { SessionExecutionBindings, SessionExecutionPolicy, SessionOperationHandle, SessionOperationReceipt, SessionOperations, SessionTaskInput } from '../../subs/agent/src/interfaces/session-operations.js';
import type { CommandRunner } from '../../subs/evidence/src/run-command.js';
import { readSessionPointReference } from './session-operations.js';
import { BeadsStateStore, beadsStageInputSchema, type BeadsRunState, type BeadsStage, type BeadsStageInput } from './beads-storage.js';
import { createBeadsTools } from './beads-tools.js';

export type { BeadsStageInput, BeadsRunState } from './beads-storage.js';
type Stage = 'start' | 'finish';
export interface BeadsSessionsOptions {
  readonly projectRoot: string; readonly directory?: string;
  readonly operations: () => Promise<SessionOperations>;
  readonly commandExecution?: CommandRunner | undefined;
  readonly timeoutMs?: number;
  readonly commandTimeoutMs?: number;
  readonly onPending?: (runId: string, reason: string) => void;
}
const submissionSchema = z.object({ summary: z.string().trim().min(1), decisions: z.array(z.object({
  id: z.string().min(1), action: z.enum(['in_progress', 'closed', 'unchanged']), evidence: z.string().trim().min(1),
}).strict()) }).strict();
const instructions = `You are the administrative Beads session. The inherited conversation is evidence only. All previous implementation, architect, engineer and submission instructions are retired for this task. Use only the currently active Beads tools and submit_beads. Do not implement, edit source, run shell commands, create issues, override ownership, commit or synchronize trackers.
Only existing Beads issues concretely mentioned in the plan or inherited accepted context and semantically relevant to the actual implementation belong to this run. Inspect each issue, compare its meaning and acceptance criteria with the work, and bind only that relevant set at start. Identifier spelling alone does not establish relevance. Do not discover unrelated work or use all open issues.
At start mark relevant bound existing issues in_progress, preserving already closed issues and reporting them as unchanged. At finish the durable start bindings are the entire allowed issue set. Judge each issue independently using the implementation, validation, candidate and outstanding deviations in the supplied evidence. A successful plan, green checks or issue mention alone does not prove an issue resolved. Close only when its own requirements were actually resolved, with concrete resolution evidence; leave unresolved, uncertain, failed, blocked or interrupted work unchanged. A failed plan can still resolve an individual issue when concrete evidence proves it. Never close the whole bound set by default.
Tracker delivery is administrative and cannot alter plan acceptance or completion. Missing evidence and uncertain prior effects remain pending for review. Submit a decision for every bound issue, with its own evidence, and a summary explaining an empty relevant set when none exists.`;

/** A detached ordered administrative queue. Enqueue waits only for durable intent. */
export class BeadsSessions {
  private readonly queues = new Map<string, Promise<void>>();
  private readonly active = new Map<string, SessionOperationHandle>();
  private stopped = false;
  private closed = false;
  private constructor(private readonly options: BeadsSessionsOptions, private readonly store: BeadsStateStore) {}
  static async open(options: BeadsSessionsOptions): Promise<BeadsSessions> {
    return new BeadsSessions(options, await BeadsStateStore.open(options.directory ?? join(options.projectRoot, 'plans', '.harness', 'beads-administration')));
  }
  scheduleStart(input: BeadsStageInput): Promise<void> { return this.enqueue('start', input); }
  scheduleFinish(input: BeadsStageInput): Promise<void> { return this.enqueue('finish', input); }
  inspect(runId: string): Promise<BeadsRunState | null> { return this.store.read(runId); }
  private async enqueue(stage: Stage, value: BeadsStageInput): Promise<void> {
    if (this.stopped) throw new Error('Beads administrative queue is closed');
    const input = beadsStageInputSchema.parse(value);
    await this.store.update(input.runId, state => {
      const captured = state.start?.input ?? state.finish?.input;
      if (captured && (captured.workspace !== input.workspace || (captured.executable ?? 'bd') !== (input.executable ?? 'bd'))) throw new Error('Beads administrative destination conflicts with the captured run');
      const existing = state[stage];
      if (existing) {
        // The first request fixes the implementation context and tracker destination.
        if (existing.input.workspace !== input.workspace || existing.input.executable !== input.executable) throw new Error('Beads administrative destination conflicts with the captured run');
        return state;
      }
      return { ...state, [stage]: { input, status: 'pending', reason: 'Awaiting administrative delivery', receipt: null, observations: [], submission: null } satisfies BeadsStage };
    });
    this.queue(input.runId);
  }
  async recover(runId: string): Promise<void> {
    if (this.stopped) return;
    if (await this.store.read(runId)) this.queue(runId);
  }
  private queue(runId: string): void {
    const previous = this.queues.get(runId) ?? Promise.resolve();
    const pending = previous.then(async () => {
      if (this.stopped) return;
      await this.deliver(runId, 'start');
      if (!this.stopped) await this.deliver(runId, 'finish');
    }).catch(async error => {
      const reason = error instanceof Error ? error.message : String(error);
      try { this.options.onPending?.(runId, reason); } catch { /* Diagnostics never affect the plan. */ }
    });
    this.queues.set(runId, pending);
    void pending.then(() => { if (this.queues.get(runId) === pending) this.queues.delete(runId); });
  }
  private async patch(runId: string, stage: Stage, change: Partial<BeadsStage>): Promise<void> {
    await this.store.update(runId, state => ({ ...state, [stage]: { ...state[stage]!, ...change } }));
  }
  private async deliver(runId: string, stage: Stage): Promise<void> {
    const initial = await this.store.read(runId);
    const request = initial?.[stage];
    if (!initial || !request || request.status === 'completed') return;
    if (stage === 'finish' && initial.start?.status !== 'completed') {
      await this.patch(runId, stage, { status: 'pending', reason: 'Awaiting confirmed start administration and durable issue bindings' }); return;
    }
    let receipt: SessionOperationReceipt | null = request.receipt;
    try {
      if (this.active.has(runId)) throw new Error('A prior administrative session has unconfirmed settlement; retry remains pending');
      const operations = await this.options.operations();
      const operationId = `beads:${stage}:turn`;
      const identity = await operations.operationIdentity(runId, operationId);
      let fork: SessionOperationReceipt | null = null;
      let inheritedTools: readonly string[] = [];
      const forkId = `beads:${stage}:fork`;
      if (!identity) {
        const source = request.input.sourceRef === null ? null : readSessionPointReference(request.input.sourceRef);
        if (!source || source.runId !== runId) throw new Error('Inherited source context is unavailable; administrative delivery remains pending');
        const snapshot = await operations.inspect(runId, source.point.sessionId, source.point);
        if (!snapshot?.available) throw new Error('Inherited source session point is unavailable; administrative delivery remains pending');
        fork = await operations.fork({ runId, operationId: forkId, sourcePoint: source.point });
        if (fork.status !== 'completed' || !fork.point) throw new Error(fork.reason ?? 'Administrative source fork unavailable');
        const forkSnapshot = await operations.inspect(runId, fork.sessionId, fork.point);
        if (!forkSnapshot) throw new Error('Administrative fork snapshot unavailable');
        inheritedTools = forkSnapshot.activeTools;
      }
      const toolset = await createBeadsTools({ stage, request: request.input, store: this.store, runner: this.options.commandExecution, timeoutMs: this.options.commandTimeoutMs ?? 15_000 });
      const policy: SessionExecutionPolicy = {
        context: { compaction: 'forbidden', budgetTokens: null, budgetFraction: null, reportReserveTokens: 2000 },
        authority: { kind: 'beads-administration', workspace: request.input.workspace, executable: request.input.executable ?? 'bd' },
        validator: { kind: 'beads-administration', stage }, destination: { kind: 'beads-administration', runId, stage },
      };
      const task: SessionTaskInput = {
        role: 'beads-administrator', message: `Administrative stage: ${stage}\nRun: ${runId}\nTerminal outcome: ${request.input.outcome ?? 'implementation entered'}\n\nCaptured implementation evidence:\n${request.input.context}\n\nDurable relevant issue bindings:\n${JSON.stringify(stage === 'start' ? [] : initial.bindings)}`,
        submissionTool: 'submit_beads', environment: { workingDirectory: this.options.projectRoot, candidate: null, snapshot: null, limits: { stopSettleMs: 2000 } },
        policyIdentity: 'beads-administration/1', validatorIdentity: `beads-administration:${stage}/1`, destinationIdentity: `beads-administration:${runId}:${stage}/1`,
      };
      let eventWrites: Promise<void> = Promise.resolve();
      const onEvent = (event: AgentEvent) => {
        eventWrites = eventWrites.then(async () => {
          await this.store.update(runId, state => ({ ...state, [stage]: { ...state[stage]!, observations: [...state[stage]!.observations, event] } }));
        });
        void eventWrites.catch(() => undefined);
      };
      const bindings: SessionExecutionBindings = {
        task, policy, tools: toolset.tools,
        currentAuthority: async () => !this.stopped && (await this.store.read(runId))?.[stage]?.status === 'running',
        guard: async call => call.action.kind === 'harness' && toolset.tools.some(tool => tool.name === call.tool) ? { allow: true } : { allow: false, text: 'Only administrative Beads tools are permitted' },
        onEvent, recoverEffect: toolset.recoverEffect,
        submission: { name: 'submit_beads', accept: async raw => {
          const parsed = submissionSchema.safeParse(raw);
          if (!parsed.success) return { accepted: false, errors: [parsed.error.message] };
          const current = (await this.store.read(runId))!;
          const ids = parsed.data.decisions.map(decision => decision.id);
          if (new Set(ids).size !== ids.length || ids.length !== current.bindings.length || current.bindings.some(binding => !ids.includes(binding.id))) return { accepted: false, errors: ['Submit exactly one decision for each durable bound issue'] };
          for (const decision of parsed.data.decisions) {
            if ((stage === 'start' && decision.action === 'closed') || (stage === 'finish' && decision.action === 'in_progress')) return { accepted: false, errors: ['This disposition is outside the administrative stage'] };
            const status = stage === 'start' ? 'in_progress' : 'closed';
            const confirmed = current.mutations.find(mutation => mutation.id === decision.id && mutation.status === status && mutation.phase === 'confirmed');
            if ((stage === 'start' || decision.action === 'closed') && !confirmed) return { accepted: false, errors: [`Confirm ${decision.id} through beads_update before submitting this disposition`] };
            if (stage === 'start' && decision.action !== (confirmed?.observedStatus === 'closed' ? 'unchanged' : 'in_progress')) return { accepted: false, errors: [`Disposition for ${decision.id} must agree with confirmed issue state`] };
            if (stage === 'finish' && confirmed && decision.action !== 'closed') return { accepted: false, errors: [`A confirmed closure for ${decision.id} must be reported as closed`] };
          }
          if (current.mutations.some(mutation => mutation.phase === 'intent')) return { accepted: false, final: true, errors: ['An uncertain tracker effect remains pending for reconciliation'] };
          await this.patch(runId, stage, { submission: parsed.data });
          return { accepted: true };
        } },
        publish: async published => { await this.patch(runId, stage, { receipt: published }); },
      };
      await this.patch(runId, stage, { status: 'running', reason: null });
      const handle = identity ? await operations.retry({ runId, operationId, bindings }) : await operations.continue({
        runId, operationId, sessionId: fork!.sessionId, expectedPoint: fork!.point!, task, policy, bindings,
        additions: [{ key: `beads-administration:${stage}`, kind: 'activation-instructions', text: instructions, revision: 'beads-administration/1' }],
        toolChange: { add: [...toolset.tools.map(tool => ({ name: tool.name, description: tool.description, inputSchema: tool.inputSchema, mutating: tool.mutating ?? false })),
          { name: 'submit_beads', description: 'Submit independent per-issue administrative decisions', inputSchema: z.toJSONSchema(submissionSchema) as Record<string, unknown>, mutating: false }],
          activate: [...toolset.tools.map(tool => tool.name), 'submit_beads'], inactivate: inheritedTools },
      });
      this.active.set(runId, handle);
      receipt = await bounded(handle.receipt, this.options.timeoutMs ?? 120_000);
      if (!receipt) {
        void handle.stop().catch(() => undefined);
        throw new Error('Administrative model delivery timed out; retained pending');
      }
      const settled = await bounded(handle.settled(), 2000);
      if (!settled) throw new Error('Administrative session settlement is unconfirmed; retained pending');
      this.active.delete(runId);
      await eventWrites;
      if (receipt.status !== 'completed' || receipt.outcome?.kind !== 'submitted') throw new Error(receipt.reason ?? 'Administrative session did not accept per-issue decisions');
      await this.patch(runId, stage, { status: 'completed', reason: null, receipt });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      await this.patch(runId, stage, { status: 'pending', reason, receipt });
      try { this.options.onPending?.(runId, reason); } catch { /* No main-run failure. */ }
    }
  }
  /** Gracefully drain detached work, then stop within a separate settlement bound. */
  async close(options: { readonly timeoutMs?: number; readonly settleMs?: number } = {}): Promise<boolean> {
    if (this.closed) return true;
    await bounded(Promise.all([...this.queues.values()]), options.timeoutMs ?? 120_000);
    this.stopped = true;
    for (const [runId, handle] of this.active) {
      void handle.stop().catch(() => undefined);
      const state = await this.store.read(runId);
      for (const stage of ['start', 'finish'] as const) if (state?.[stage]?.status === 'running') await this.patch(runId, stage, { status: 'pending', reason: 'Administrative shutdown interrupted delivery; reconciliation required' });
    }
    for (const [runId, handle] of this.active) {
      try {
        if (await bounded(handle.settled(), options.settleMs ?? 2000) === null) return false;
        this.active.delete(runId);
      } catch { return false; }
    }
    if (await bounded(Promise.all([...this.queues.values()]), options.settleMs ?? 2000) === null) return false;
    await this.store.close();
    this.closed = true;
    return true;
  }
}
async function bounded<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try { return await Promise.race([promise, new Promise<null>(resolve => { timer = setTimeout(() => resolve(null), timeoutMs); })]); }
  finally { if (timer !== undefined) clearTimeout(timer); }
}
