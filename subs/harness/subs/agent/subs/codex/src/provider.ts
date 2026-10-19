import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { CodexProviderError, type CodexEquipment, type CodexEvent, type CodexPendingRequest, type CodexProvider, type CodexProviderOptions, type CodexReadiness, type CodexResponse, type CodexThread, type CodexThreadSession, type CodexThreadSettings } from './interfaces/provider.js';
import { nativeCodexConnection, type CodexConnection } from './connection.js';
import { object, pendingRequest, projectThread, projectTurn, rpcId, text, workItem, type WireDecision } from './projection.js';

export function createCodexProvider(options: CodexProviderOptions): CodexProvider {
  for (const bound of [options.requestTimeoutMs, options.settlementTimeoutMs]) {
    if (bound !== undefined && (!Number.isFinite(bound) || bound <= 0 || bound > 2_147_483_647)) throw new Error('Codex timeouts must be positive and within the Node timer range');
  }
  return createCodexProviderOn(nativeCodexConnection(options), options.requestTimeoutMs);
}

/** Internal protocol driver, also used by strict same-owner protocol scripts. */
export function createCodexProviderOn(connection: CodexConnection, timeoutMs = 30_000): CodexProvider {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new Error('Codex request timeout must be positive');
  const generation = randomUUID();
  let nextId = 0;
  let nextServerRequest = 0;
  let initialized = false;
  let initializing: Promise<CodexReadiness> | undefined;
  let unavailable: CodexProviderError | undefined;
  let stopped = false;
  const requests = new Map<string | number, { method: string; mutation: boolean; resolve(value: unknown): void; reject(error: Error): void; timer: NodeJS.Timeout; received?(revision: number, result: unknown): void }>();
  const responseDeliveries = new Map<string, { reject(error: Error): void; timer: NodeJS.Timeout }>();
  const pending = new Map<string, { rpcId: string | number; request: CodexPendingRequest; decisions: readonly WireDecision[]; state: 'pending' | 'responding' | 'uncertain' }>();
  type Turn = ReturnType<typeof projectTurn>;
  type Observation<T> = { value: T; revision: number; live: boolean };
  type Admission = { generation: number; phase: 'pending' | 'uncertain'; turnId?: string; conflicts: Set<string> };
  type ThreadControl = {
    status: Observation<CodexThread['status']>; activeTurn: Observation<string | null>;
    adopted: boolean; latestTurn?: Turn;
    // A status-only active observation has not yet identified its running turn.
    unidentifiedActivity: boolean;
    // An admitted request has no turn identity until its correlated reply.
    admission?: Admission;
    // Terminal identities cannot become running again, even in a fresh stale snapshot.
    finished: Map<string, Pick<Turn, 'status' | 'error'>>;
    // Idle retires a known identity without inventing a terminal turn outcome.
    retired: Set<string>;
  };
  let revision = 0;
  const threads = new Map<string, ThreadControl>();
  const control = (threadId: string): ThreadControl => {
    let thread = threads.get(threadId);
    if (thread === undefined) {
      thread = { status: { value: 'notLoaded', revision: 0, live: false }, activeTurn: { value: null, revision: 0, live: false }, adopted: false, unidentifiedActivity: false, finished: new Map(), retired: new Set() };
      threads.set(threadId, thread);
    }
    return thread;
  };
  const observedTurn = (thread: ThreadControl, turn: Turn): Turn => {
    const finished = thread.finished.get(turn.id);
    return finished === undefined ? turn : { ...turn, ...finished };
  };
  const unavailableStatus = (status: CodexThread['status']) => status === 'notLoaded' || status === 'systemError';
  const currentStatus = (thread: ThreadControl): CodexThread['status'] => {
    if (unavailableStatus(thread.status.value)) return thread.status.value;
    return thread.admission !== undefined || thread.activeTurn.value !== null || thread.unidentifiedActivity ? 'active' : thread.status.value;
  };
  const applyTurn = (thread: ThreadControl, turn: Turn, basis = Infinity) => {
    const at = ++revision;
    // A start identifies current activity. A reply can bind only observations
    // preceding its frame; a terminal event for an older ID cannot do so.
    if (basis === Infinity ? turn.status === 'inProgress' : thread.status.revision <= basis) thread.unidentifiedActivity = false;
    if (thread.activeTurn.revision <= basis) thread.activeTurn = { value: turn.status === 'inProgress' ? turn.id : null, revision: at, live: true };
    // A completed turn proves its outcome, not recovery from a provider error.
    if (thread.status.revision <= basis && !(turn.status !== 'inProgress' && (thread.unidentifiedActivity || thread.status.live && unavailableStatus(thread.status.value)))) {
      thread.status = { value: turn.status === 'inProgress' ? 'active' : 'idle', revision: at, live: true };
    }
    thread.latestTurn = structuredClone(turn);
  };
  const observeTurn = (thread: ThreadControl, value: Turn) => {
    const turn = observedTurn(thread, value);
    if (turn.status !== 'inProgress') {
      thread.finished.set(turn.id, { status: turn.status, error: turn.error });
      // A correlated, uncertain acknowledgement can settle by exact identity.
      const admission = thread.admission;
      if (admission?.phase === 'uncertain' && admission.turnId !== undefined && thread.finished.has(admission.turnId) && [...admission.conflicts].every(id => thread.finished.has(id))) thread.admission = undefined;
    }
    if (turn.status === 'inProgress') {
      if (!thread.retired.has(turn.id)) {
        if (thread.admission?.phase === 'uncertain' && thread.admission.turnId !== undefined && thread.admission.turnId !== turn.id) thread.admission.conflicts.add(turn.id);
        applyTurn(thread, turn);
      }
    } else if (thread.activeTurn.value === turn.id ||
      thread.activeTurn.value === null && thread.admission === undefined && thread.status.value !== 'active') {
      // In particular, an unknown admission is not ordinary idle. An old
      // completion records its own outcome without touching the reservation.
      applyTurn(thread, turn);
    } else if (thread.latestTurn?.id === turn.id) thread.latestTurn = structuredClone(turn);
  };
  const listeners = new Set<(event: CodexEvent) => void>();
  const emit = (event: CodexEvent) => {
    for (const listener of listeners) {
      // Neither a broken observer nor its asynchronous completion owns execution.
      try { void Promise.resolve(listener(structuredClone(event))).catch(() => undefined); } catch { /* observation only */ }
    }
  };
  const fail = (message: string, publish = true) => {
    unavailable ??= new CodexProviderError('unavailable', message);
    for (const [id, request] of requests) {
      clearTimeout(request.timer);
      request.reject(new CodexProviderError(request.mutation ? 'uncertain' : 'unavailable', message, request.method));
      requests.delete(id);
    }
    for (const [id, delivery] of responseDeliveries) {
      clearTimeout(delivery.timer);
      responseDeliveries.delete(id);
      const entry = pending.get(id);
      if (entry !== undefined) entry.state = 'uncertain';
      delivery.reject(new CodexProviderError('uncertain', `Response delivery is uncertain: ${message}`, 'respond'));
    }
    if (publish) emit({ kind: 'provider-error', message });
  };
  const call = async (method: string, params: unknown, mutation = false, received?: (revision: number, result: unknown) => void): Promise<unknown> => {
    if (unavailable !== undefined) throw unavailable;
    if (stopped) throw new CodexProviderError('unavailable', 'Codex provider has been stopped', method);
    const id = ++nextId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        requests.delete(id);
        reject(new CodexProviderError(mutation ? 'uncertain' : 'unavailable', `${method} reply timed out; ${mutation ? 'provider acceptance is uncertain; do not replay blindly' : 'observation is unavailable'}`, method));
      }, timeoutMs);
      requests.set(id, { method, mutation, resolve, reject, timer, ...(received === undefined ? {} : { received }) });
      void connection.write(JSON.stringify({ id, method, params })).catch(error => fail(`Codex write failed: ${String(error)}`));
    });
  };
  const requireReady = () => {
    if (!initialized) throw new CodexProviderError('unavailable', 'Initialize Codex before using conversation operations');
    if (unavailable !== undefined) throw unavailable;
    if (stopped) throw new CodexProviderError('unavailable', 'Codex provider has been stopped');
  };
  const remember = (thread: CodexThread, basis: number): CodexThread => {
    const old = control(thread.id);
    old.adopted = true;
    if (old.admission?.phase === 'uncertain' && old.admission.turnId !== undefined) {
      for (const turn of thread.turns) if (turn.status !== 'inProgress') observeTurn(old, turn);
    }
    const at = ++revision;
    // Inspection never proves acceptance or rejection of an unacknowledged input.
    if (old.admission === undefined) {
      const turns = thread.turns.map(turn => observedTurn(old, turn));
      const running = turns.find(turn => turn.status === 'inProgress' && !old.retired.has(turn.id))?.id ?? null;
      if (thread.status === 'active' && running !== null && old.activeTurn.revision <= basis && old.status.revision <= basis) old.unidentifiedActivity = false;
      const current = old.activeTurn.value;
      const finishedCurrent = current !== null && turns.some(turn => turn.id === current && turn.status !== 'inProgress');
      // A live running identity needs its own terminal proof. An empty history
      // cannot revoke it; snapshot-derived control remains refreshable by history.
      const liveActive = old.activeTurn.live || old.status.live && old.status.value === 'active';
      const preserveLive = current !== null && liveActive && !finishedCurrent;
      const preserveIdle = old.status.live && old.status.value === 'idle' && current === null;
      if (!preserveLive && !preserveIdle) {
        if (old.activeTurn.revision <= basis) old.activeTurn = { value: running, revision: at, live: false };
        const preserveStatus = old.status.live && (
          old.unidentifiedActivity || unavailableStatus(old.status.value) ||
          old.status.value === 'active' && !finishedCurrent && running === null ||
          old.status.value === 'idle' && thread.status === 'active' && running === null
        );
        if (old.status.revision <= basis && !preserveStatus) {
          const staleRunning = thread.turns.some(turn => turn.status === 'inProgress') && running === null;
          const status = thread.status === 'active' && staleRunning ? 'idle' : thread.status;
          old.status = { value: status, revision: at, live: old.status.live && old.status.value === status };
        }
      }
      // Keep only terminal identity/outcome facts, not another history copy.
      for (const turn of turns) if (turn.status !== 'inProgress') old.finished.set(turn.id, { status: turn.status, error: turn.error });
    }
    if (old.latestTurn !== undefined) old.latestTurn = observedTurn(old, old.latestTurn);
    const turns = thread.turns.map(turn => observedTurn(old, turn));
    if (old.latestTurn !== undefined && !turns.some(turn => turn.id === old.latestTurn!.id)) turns.push(structuredClone(old.latestTurn));
    return { ...thread, status: currentStatus(old), turns };
  };
  const resolvePending = (id: string) => { if (pending.delete(id)) emit({ kind: 'request-resolved', id }); };
  const onLine = (line: string) => {
    try {
      const frame = object.parse(JSON.parse(line));
      if (typeof frame.method === 'string') {
        if ('id' in frame) {
          const id = rpcId.parse(frame.id);
          const decoded = pendingRequest(generation, frame.method, id, frame.params, ++nextServerRequest);
          if ([...pending.values()].some(p => p.rpcId === id)) throw new Error('Provider reused a pending request ID');
          pending.set(decoded.request.id, { rpcId: id, ...decoded, state: 'pending' });
          emit({ kind: 'pending-request', request: decoded.request });
          return;
        }
        const p = object.parse(frame.params ?? {});
        if (frame.method === 'thread/started') {
          const worker = z.object({ id: text, parentThreadId: z.string().nullable(), model: z.string().nullable(), ephemeral: z.boolean() }).parse(p.thread);
          if (worker.parentThreadId !== null) emit({ kind: 'worker-thread', threadId: worker.id, parentThreadId: worker.parentThreadId, model: worker.model, ephemeral: worker.ephemeral });
        } else if (frame.method === 'turn/started' || frame.method === 'turn/completed') {
          const threadId = text.parse(p.threadId);
          const turn = projectTurn(p.turn);
          observeTurn(control(threadId), turn);
          if (turn.status !== 'inProgress') for (const [id, request] of pending) if (request.request.threadId === threadId && request.request.turnId === turn.id) resolvePending(id);
          emit({ kind: 'turn', threadId, turn });
        } else if (frame.method === 'thread/status/changed') {
          const threadId = text.parse(p.threadId);
          const status = z.object({ type: z.enum(['idle', 'active', 'notLoaded', 'systemError']) }).parse(p.status).type;
          const old = control(threadId);
          // Always retain provider status independently of admission. Idle
          // cannot identify or settle an admitted/known live turn; its exact
          // identity continues to make effective control busy until terminal.
          const at = ++revision;
          old.status = { value: status, revision: at, live: true };
          if (status === 'active') old.unidentifiedActivity = true;
          else if (status === 'idle') old.unidentifiedActivity = false;
          if (status === 'idle' && old.admission === undefined && !old.activeTurn.live) {
            if (old.activeTurn.value !== null) old.retired.add(old.activeTurn.value);
            old.activeTurn = { value: null, revision: at, live: true };
          }
          emit({ kind: 'thread-status', threadId, status });
        } else if (frame.method === 'item/agentMessage/delta') {
          emit({ kind: 'assistant-delta', threadId: text.parse(p.threadId), turnId: text.parse(p.turnId), text: z.string().parse(p.delta) });
        } else if (frame.method === 'item/started' || frame.method === 'item/completed') {
          const item = object.parse(p.item);
          // Hidden reasoning and full tool payloads never enter the progress projection.
          if (item.type !== 'reasoning') emit({ kind: 'work', threadId: text.parse(p.threadId), turnId: text.parse(p.turnId), item: workItem(item) });
        } else if (frame.method === 'serverRequest/resolved') {
          const id = rpcId.parse(p.requestId);
          const threadId = text.parse(p.threadId);
          for (const [key, request] of pending) if (request.rpcId === id && request.request.threadId === threadId) resolvePending(key);
        } else if (frame.method === 'error') {
          emit({ kind: 'provider-error', message: z.object({ message: z.string() }).parse(p.error).message,
            threadId: text.parse(p.threadId), turnId: text.parse(p.turnId), willRetry: z.boolean().parse(p.willRetry) });
        }
        // Unneeded notifications, including raw responses, are drained and discarded.
        return;
      }
      const id = rpcId.parse(frame.id);
      const request = requests.get(id);
      if (request === undefined) {
        emit({ kind: 'provider-error', message: `Uncorrelated Codex response ${String(id)}; it may follow a timed-out call` });
        return;
      }
      if (('error' in frame) === ('result' in frame)) throw new Error('Codex response must contain exactly one result or error');
      const decodedError = 'error' in frame ? z.object({ code: z.number().int(), message: z.string() }).parse(frame.error) : null;
      requests.delete(id);
      clearTimeout(request.timer);
      const receivedAt = ++revision;
      if (decodedError !== null) {
        const error = decodedError;
        request.reject(new CodexProviderError('rpc', error.message, request.method, error.code));
      } else if ('result' in frame) {
        try {
          // Correlated identity facts must precede the next frame, just like
          // notification facts. Decode failures still reject this operation.
          request.received?.(receivedAt, frame.result);
          request.resolve(frame.result);
        } catch (error) { request.reject(error instanceof Error ? error : new Error(String(error))); }
      } else request.reject(new CodexProviderError(request.mutation ? 'uncertain' : 'protocol', 'Codex response has neither result nor error', request.method));
    } catch (error) { fail(`Invalid Codex protocol: ${String(error)}`); }
  };
  const session = (value: unknown, settings: CodexThreadSettings, basis: number, expectedThreadId?: string): CodexThreadSession => {
    const response = z.object({ thread: z.unknown(), model: text, instructionSources: z.array(z.string()), approvalPolicy: z.union([z.string(), object]), sandbox: z.object({ type: text }).passthrough() }).parse(value);
    const thread = projectThread(response.thread);
    if (response.model !== settings.model || thread.model !== settings.model || thread.cwd !== settings.cwd) throw new Error('Codex returned a different model or working directory');
    if (expectedThreadId !== undefined && thread.id !== expectedThreadId) throw new Error('Codex resumed another thread');
    const current = remember(thread, basis);
    return { thread: current, model: response.model, instructionSources: response.instructionSources,
      approvalPolicy: typeof response.approvalPolicy === 'string' ? response.approvalPolicy : JSON.stringify(response.approvalPolicy), sandbox: response.sandbox.type };
  };
  const pageAll = async (method: string, params: Record<string, unknown>): Promise<unknown[]> => {
    let cursor: string | null = null;
    const seen = new Set<string>();
    const data: unknown[] = [];
    do {
      const page = z.object({ data: z.array(z.unknown()), nextCursor: z.string().nullable() }).parse(await call(method, { ...params, cursor }));
      data.push(...page.data);
      cursor = page.nextCursor;
      if (cursor !== null && seen.has(cursor)) throw new CodexProviderError('protocol', `Repeated ${method} pagination cursor`, method);
      if (cursor !== null) seen.add(cursor);
    } while (cursor !== null);
    return data;
  };
  return {
    generation,
    initialize() {
      if (stopped) return Promise.reject(new CodexProviderError('unavailable', 'Codex provider has been stopped'));
      initializing ??= (async () => {
        const process = await connection.start({ line: onLine, error: fail, exit: (code, signal) => {
          fail(`Codex app-server exited (${code ?? signal ?? 'unknown'})`);
          emit({ kind: 'provider-exit', code, signal });
        } });
        const response = z.object({ userAgent: text, codexHome: text, platformOs: text }).parse(await call('initialize', {
          clientInfo: { name: 'ramify_agent_coordinator', title: 'Ramify Agent Coordinator', version: '0.0.0' },
          capabilities: { experimentalApi: true, requestAttestation: false },
        }));
        await connection.write(JSON.stringify({ method: 'initialized' }));
        initialized = true;
        return { userAgent: response.userAgent, codexHome: response.codexHome, platform: response.platformOs, process };
      })().catch(error => { fail(`Codex initialization failed: ${String(error)}`); throw error; });
      return initializing;
    },
    async inspectEquipment(cwd, threadId) {
      requireReady();
      const [models, features, mcp, configValue] = await Promise.all([
        pageAll('model/list', { includeHidden: true }), pageAll('experimentalFeature/list', { ...(threadId === undefined ? {} : { threadId }) }),
        pageAll('mcpServerStatus/list', { ...(threadId === undefined ? {} : { threadId }) }), call('config/read', { cwd, includeLayers: false }),
      ]);
      const config = object.parse(z.object({ config: z.unknown() }).parse(configValue).config);
      return {
        models: models.map(value => { const m = z.object({ model: text, multiAgentVersion: z.enum(['disabled', 'v1', 'v2']).nullish() }).parse(value); return { id: m.model, nativeWorkers: m.multiAgentVersion ?? null }; }),
        features: features.map(value => z.object({ name: text, enabled: z.boolean() }).parse(value)),
        mcp: mcp.map(value => { const m = z.object({ name: text, tools: object, toolsError: z.string().nullable() }).parse(value); return { name: m.name, tools: Object.keys(m.tools), error: m.toolsError }; }),
        configuredModel: typeof config.model === 'string' ? config.model : null,
        approvalPolicy: typeof config.approval_policy === 'string' ? config.approval_policy : config.approval_policy == null ? null : JSON.stringify(config.approval_policy),
        sandbox: typeof config.sandbox_mode === 'string' ? config.sandbox_mode : null,
      } satisfies CodexEquipment;
    },
    async startThread(settings) {
      requireReady();
      const basis = revision;
      try {
        return session(await call('thread/start', { model: settings.model, cwd: settings.cwd, ephemeral: false }, true), settings, basis);
      } catch (error) {
        if (error instanceof CodexProviderError) throw error;
        throw new CodexProviderError('uncertain', `Persistent Codex thread start was not verified: ${String(error)}`, 'thread/start');
      }
    },
    async readThread(threadId) {
      requireReady();
      const basis = revision;
      const response = z.object({ thread: z.unknown() }).parse(await call('thread/read', { threadId, includeTurns: true }));
      const thread = projectThread(response.thread);
      if (thread.id !== threadId) throw new CodexProviderError('protocol', 'Codex read returned another thread', 'thread/read');
      return remember(thread, basis);
    },
    async resumeThread(threadId, settings) {
      requireReady();
      const basis = revision;
      try {
        const result = session(await call('thread/resume', { threadId, model: settings.model, cwd: settings.cwd }, true), settings, basis, threadId);
        return result;
      } catch (error) {
        if (error instanceof CodexProviderError) throw error;
        throw new CodexProviderError('uncertain', `Persistent Codex resume was not verified: ${String(error)}`, 'thread/resume');
      }
    },
    async send(threadId, message) {
      requireReady();
      if (!message.trim()) throw new CodexProviderError('protocol', 'Codex input must contain text');
      const thread = threads.get(threadId);
      if (thread === undefined || !thread.adopted || currentStatus(thread) === 'notLoaded') throw new CodexProviderError('unavailable', 'Resume or start this thread before input');
      if (currentStatus(thread) !== 'idle') throw new CodexProviderError('busy', `Thread ${threadId} is busy or its previous submission is uncertain`);
      const generation = ++revision;
      const admission: Admission = { generation, phase: 'pending', conflicts: new Set() };
      thread.admission = admission;
      // Invalidate older snapshots without pretending the unknown turn is idle
      // or assigning the preceding turn's observations to this generation.
      thread.status = { ...thread.status, revision: generation };
      thread.activeTurn = { ...thread.activeTurn, revision: generation };
      let receivedAt = generation;
      let acknowledged: Turn | undefined;
      try {
        await call('turn/start', { threadId, input: [{ type: 'text', text: message, text_elements: [] }] }, true, (at, result) => {
          receivedAt = at;
          acknowledged = projectTurn(z.object({ turn: z.unknown() }).parse(result).turn);
          // Terminal identity is monotonic. Publish it before a later stale
          // start can replace another live identity in the same dispatch batch.
          if (acknowledged.status !== 'inProgress') observeTurn(thread, acknowledged);
        });
        if (thread.admission?.generation !== admission.generation) throw new CodexProviderError('uncertain', 'Turn reply does not identify the current admission generation', 'turn/start');
        const observed = observedTurn(thread, acknowledged!);
        admission.turnId = observed.id;
        if (observed.status === 'inProgress' && thread.activeTurn.value !== observed.id &&
          (thread.activeTurn.value !== null || thread.activeTurn.revision > receivedAt)) {
          // The reply proves this request's identity. A different later turn
          // observation cannot prove its terminal outcome. Keep uncertainty.
          if (thread.activeTurn.value !== null) admission.conflicts.add(thread.activeTurn.value);
          throw new CodexProviderError('uncertain', 'Running acknowledgement lacks matching terminal proof after another turn observation', 'turn/start');
        }
        thread.admission = undefined;
        if (observed.status !== 'inProgress') thread.finished.set(observed.id, { status: observed.status, error: observed.error });
        if (thread.activeTurn.value === null || thread.activeTurn.value === observed.id) applyTurn(thread, observed, receivedAt);
        return structuredClone(observed);
      } catch (error) {
        if (error instanceof CodexProviderError && error.kind === 'rpc') {
          thread.admission = undefined;
          const at = ++revision;
          thread.status = { ...thread.status, revision: at };
          thread.activeTurn = { ...thread.activeTurn, revision: at };
        } else admission.phase = 'uncertain';
        if (error instanceof CodexProviderError) throw error;
        throw new CodexProviderError('uncertain', `Turn submission was not verified: ${String(error)}`, 'turn/start');
      }
    },
    pendingRequests: () => [...pending.values()].map(value => structuredClone(value.request)),
    async respond(requestId, response: CodexResponse) {
      requireReady();
      const entry = pending.get(requestId);
      if (entry === undefined || entry.state !== 'pending') throw new CodexProviderError('stale-response', 'Request is absent, already answered or its response is uncertain');
      const request = entry.request;
      let result: unknown;
      if (request.kind === 'command-approval' || request.kind === 'file-approval') {
        const parsed = z.object({ kind: z.literal('approval'), choiceId: z.string() }).strict().parse(response);
        const selected = request.choices.findIndex(choice => choice.id === parsed.choiceId);
        if (selected < 0) throw new CodexProviderError('protocol', 'Approval choice was not offered by the provider');
        result = { decision: entry.decisions[selected] };
      } else if (request.kind === 'user-input') {
        const parsed = z.object({ kind: z.literal('user-input'), answers: z.record(z.string(), z.array(z.string().min(1)).min(1)) }).strict().parse(response);
        if (Object.keys(parsed.answers).length !== request.questions.length || request.questions.some(q => !Object.hasOwn(parsed.answers, q.id))) throw new CodexProviderError('protocol', 'Answer every provider question exactly once');
        for (const question of request.questions) if (question.options !== null && !question.allowOther && parsed.answers[question.id]!.some(answer => !question.options!.some(option => option.label === answer))) throw new CodexProviderError('protocol', 'Answer is not one of the offered choices');
        result = { answers: Object.fromEntries(Object.entries(parsed.answers).map(([id, answers]) => [id, { answers }])) };
      } else throw new CodexProviderError('protocol', request.reason);
      // Reserve synchronously before awaiting transport: two responders cannot settle it.
      entry.state = 'responding';
      await new Promise<void>((resolve, reject) => {
        const finish = (error?: { reason: unknown }) => {
          const delivery = responseDeliveries.get(requestId);
          // Failure/timeout owns settlement even when a write callback arrives later.
          if (delivery === undefined) return;
          responseDeliveries.delete(requestId);
          clearTimeout(delivery.timer);
          if (error !== undefined) {
            entry.state = 'uncertain';
            reject(new CodexProviderError('uncertain', `Response delivery is uncertain: ${String(error.reason)}`, 'respond'));
          } else { resolvePending(requestId); resolve(); }
        };
        const timer = setTimeout(() => finish({ reason: 'delivery timed out; do not replay blindly' }), timeoutMs);
        responseDeliveries.set(requestId, { reject, timer });
        try { void connection.write(JSON.stringify({ id: entry.rpcId, result })).then(() => finish(), reason => finish({ reason })); }
        catch (reason) { finish({ reason }); }
      });
    },
    async interrupt(threadId, turnId) {
      requireReady();
      const thread = threads.get(threadId);
      if (thread === undefined || !thread.adopted || currentStatus(thread) !== 'active' || thread.activeTurn.value !== turnId) throw new CodexProviderError('stale-response', 'Interrupt does not identify the observed active turn');
      await call('turn/interrupt', { threadId, turnId }, true);
      return { acknowledged: true, threadId, turnId, descendants: 'not-established', assessments: 'not-controlled' };
    },
    observe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    async stop() {
      stopped = true;
      fail('Codex provider stop requested', false);
      return connection.stop();
    },
  };
}
