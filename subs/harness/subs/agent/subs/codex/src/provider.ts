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
  const requests = new Map<string | number, { method: string; mutation: boolean; resolve(value: unknown): void; reject(error: Error): void; timer: NodeJS.Timeout }>();
  const pending = new Map<string, { rpcId: string | number; request: CodexPendingRequest; decisions: readonly WireDecision[]; state: 'pending' | 'responding' | 'uncertain' }>();
  const threads = new Map<string, { status: CodexThread['status']; activeTurn: string | null; uncertain: boolean }>();
  // Retain early turn outcomes only while an input acknowledgement is pending.
  const earlyTurns = new Map<string, ReturnType<typeof projectTurn>>();
  const submissions = new Set<string>();
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
    if (publish) emit({ kind: 'provider-error', message });
  };
  const call = async (method: string, params: unknown, mutation = false): Promise<unknown> => {
    if (unavailable !== undefined) throw unavailable;
    if (stopped) throw new CodexProviderError('unavailable', 'Codex provider has been stopped', method);
    const id = ++nextId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        requests.delete(id);
        reject(new CodexProviderError(mutation ? 'uncertain' : 'unavailable', `${method} reply timed out; ${mutation ? 'provider acceptance is uncertain; do not replay blindly' : 'observation is unavailable'}`, method));
      }, timeoutMs);
      requests.set(id, { method, mutation, resolve, reject, timer });
      void connection.write(JSON.stringify({ id, method, params })).catch(error => fail(`Codex write failed: ${String(error)}`));
    });
  };
  const requireReady = () => {
    if (!initialized) throw new CodexProviderError('unavailable', 'Initialize Codex before using conversation operations');
    if (unavailable !== undefined) throw unavailable;
    if (stopped) throw new CodexProviderError('unavailable', 'Codex provider has been stopped');
  };
  const remember = (thread: CodexThread) => {
    // An observation cannot prove an in-flight/lost mutation was never accepted.
    const old = threads.get(thread.id);
    const observed = { status: thread.status, activeTurn: thread.turns.find(t => t.status === 'inProgress')?.id ?? null };
    if (old === undefined) threads.set(thread.id, { ...observed, uncertain: false });
    else Object.assign(old, observed);
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
          if (submissions.has(threadId)) earlyTurns.set(`${threadId}:${turn.id}`, turn);
          const old = threads.get(threadId);
          if (old !== undefined) {
            old.activeTurn = turn.status === 'inProgress' ? turn.id : old.activeTurn === turn.id ? null : old.activeTurn;
            old.status = old.activeTurn === null ? 'idle' : 'active';
          }
          if (turn.status !== 'inProgress') for (const [id, request] of pending) if (request.request.threadId === threadId && request.request.turnId === turn.id) resolvePending(id);
          emit({ kind: 'turn', threadId, turn });
        } else if (frame.method === 'thread/status/changed') {
          const threadId = text.parse(p.threadId);
          const status = z.object({ type: z.enum(['idle', 'active', 'notLoaded', 'systemError']) }).parse(p.status).type;
          const old = threads.get(threadId);
          if (old !== undefined) old.status = status;
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
      if (decodedError !== null) {
        const error = decodedError;
        request.reject(new CodexProviderError('rpc', error.message, request.method, error.code));
      } else if ('result' in frame) request.resolve(frame.result);
      else request.reject(new CodexProviderError(request.mutation ? 'uncertain' : 'protocol', 'Codex response has neither result nor error', request.method));
    } catch (error) { fail(`Invalid Codex protocol: ${String(error)}`); }
  };
  const session = (value: unknown, settings: CodexThreadSettings, expectedThreadId?: string): CodexThreadSession => {
    const response = z.object({ thread: z.unknown(), model: text, instructionSources: z.array(z.string()), approvalPolicy: z.union([z.string(), object]), sandbox: z.object({ type: text }).passthrough() }).parse(value);
    const thread = projectThread(response.thread);
    if (response.model !== settings.model || thread.model !== settings.model || thread.cwd !== settings.cwd) throw new Error('Codex returned a different model or working directory');
    if (expectedThreadId !== undefined && thread.id !== expectedThreadId) throw new Error('Codex resumed another thread');
    remember(thread);
    return { thread, model: response.model, instructionSources: response.instructionSources,
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
      try {
        return session(await call('thread/start', { model: settings.model, cwd: settings.cwd, ephemeral: false }, true), settings);
      } catch (error) {
        if (error instanceof CodexProviderError) throw error;
        throw new CodexProviderError('uncertain', `Persistent Codex thread start was not verified: ${String(error)}`, 'thread/start');
      }
    },
    async readThread(threadId) {
      requireReady();
      const response = z.object({ thread: z.unknown() }).parse(await call('thread/read', { threadId, includeTurns: true }));
      const thread = projectThread(response.thread);
      if (thread.id !== threadId) throw new CodexProviderError('protocol', 'Codex read returned another thread', 'thread/read');
      remember(thread);
      return thread;
    },
    async resumeThread(threadId, settings) {
      requireReady();
      try {
        const result = session(await call('thread/resume', { threadId, model: settings.model, cwd: settings.cwd }, true), settings, threadId);
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
      if (thread === undefined || thread.status === 'notLoaded') throw new CodexProviderError('unavailable', 'Resume or start this thread before input');
      if (thread.status !== 'idle' || thread.activeTurn !== null || thread.uncertain) throw new CodexProviderError('busy', `Thread ${threadId} is busy or its previous submission is uncertain`);
      thread.status = 'active';
      thread.uncertain = true;
      submissions.add(threadId);
      try {
        const result = z.object({ turn: z.unknown() }).parse(await call('turn/start', { threadId, input: [{ type: 'text', text: message, text_elements: [] }] }, true));
        const submitted = projectTurn(result.turn);
        const observed = earlyTurns.get(`${threadId}:${submitted.id}`) ?? submitted;
        thread.activeTurn = observed.status === 'inProgress' ? observed.id : null;
        thread.status = thread.activeTurn === null ? 'idle' : 'active';
        thread.uncertain = false;
        return observed;
      } catch (error) {
        if (error instanceof CodexProviderError && error.kind === 'rpc') { thread.status = 'idle'; thread.uncertain = false; }
        if (error instanceof CodexProviderError) throw error;
        throw new CodexProviderError('uncertain', `Turn submission was not verified: ${String(error)}`, 'turn/start');
      } finally {
        submissions.delete(threadId);
        for (const key of earlyTurns.keys()) if (key.startsWith(`${threadId}:`)) earlyTurns.delete(key);
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
      try { await connection.write(JSON.stringify({ id: entry.rpcId, result })); resolvePending(requestId); }
      catch (error) { entry.state = 'uncertain'; throw new CodexProviderError('uncertain', `Response delivery is uncertain: ${String(error)}`); }
    },
    async interrupt(threadId, turnId) {
      requireReady();
      const thread = threads.get(threadId);
      if (thread === undefined || thread.activeTurn !== turnId) throw new CodexProviderError('stale-response', 'Interrupt does not identify the observed active turn');
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
