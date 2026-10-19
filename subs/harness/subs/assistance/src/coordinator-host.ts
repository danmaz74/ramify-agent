import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import { createCodexProvider } from '../../agent/subs/codex/src/provider.js';
import { CodexProviderError, type CodexEquipment, type CodexEvent, type CodexProvider, type CodexProviderOptions } from '../../agent/subs/codex/src/interfaces/provider.js';
import { AssistanceService } from './service.js';
import type { AssistanceOptions, Assessor } from './contracts.js';
import { createAssistanceRuntime } from './runtime.js';
import { prepareCoordinatorProvider } from './coordinator-provider.js';
import { nodeFetchHandler, configureLongWaitHttpServer } from './http-bridge.js';
import { assistanceHttpSessions } from './http-mcp.js';
import { coordinatorCommandSchema, coordinatorStartSchema, type CoordinatorStart, type CoordinatorRecord, type CoordinatorSnapshot, type CoordinatorControlResult, type CoordinatorCommand } from './coordinator-contracts.js';
import { CoordinatorStore, coordinatorHash } from './coordinator-store.js';

const tokenEnvironment = 'RAMIFY_COORDINATOR_MCP_TOKEN';
const requiredTools = ['plan_executions', 'job_detail', 'iteration', 'iteration_assess', 'assessment_wait', 'assessment_result'];
const json = (value: unknown, status = 200) => Response.json(value, { status, headers: { 'cache-control': 'no-store' } });
export interface CoordinatorHost {
  readonly store: CoordinatorStore;
  readonly ready: Promise<void>;
  snapshot(): Promise<CoordinatorSnapshot>;
  control(command: CoordinatorCommand): Promise<CoordinatorControlResult>;
  readonly closed: Promise<void>;
}
export interface CoordinatorHostDependencies {
  readonly assistance?: Omit<AssistanceOptions, 'projectRoot'>;
  readonly provider?: (options: CodexProviderOptions) => CodexProvider;
  readonly runtime?: { readonly assessor?: Assessor; close(): Promise<void> };
  readonly listen?: (server: Server) => Promise<void>;
}

/** Verify effective settings both before input and in each loaded conversation. */
export function verifyCoordinatorEquipment(equipment: CodexEquipment, name: string, replaced: readonly string[]): void {
  const entry = equipment.mcpConfiguration?.find(entry => entry.name === name);
  if (entry?.transport !== 'http' || !entry.enabled || !entry.required || entry.bearerTokenEnvVar !== tokenEnvironment || (entry.toolTimeoutSeconds ?? 0) <= 900) throw new CodexProviderError('unavailable', `HTTP MCP configuration ${name} is missing or incompatible (including an inherited command collision)`);
  for (const old of replaced) if (equipment.mcpConfiguration?.find(entry => entry.name === old)?.enabled !== false) throw new CodexProviderError('unavailable', `Replaced MCP entry ${old} is still enabled or was not observed`);
  const tools = equipment.mcp.find(entry => entry.name === name);
  if (tools === undefined || tools.error !== null || requiredTools.some(tool => !tools.tools.includes(tool))) throw new CodexProviderError('unavailable', `HTTP MCP tools ${name} are unavailable`);
}

/** The host is the sole project writer. Clients own only observations and requests. */
export async function startCoordinatorHost(raw: CoordinatorStart, dependencies: CoordinatorHostDependencies = {}): Promise<CoordinatorHost> {
  const options = coordinatorStartSchema.parse(raw);
  const projectRoot = await realpath(options.projectRoot);
  await readFile(options.skill, 'utf8');
  const runtime = dependencies.runtime ?? createAssistanceRuntime({ projectRoot, model: options.assessmentModel });
  let service: AssistanceService;
  try { service = await AssistanceService.open({ projectRoot, assessor: runtime.assessor, ...dependencies.assistance }); }
  catch (error) { await runtime.close(); throw error; }
  const now = () => new Date().toISOString();
  const id = `coord-${randomUUID()}`; const generation = randomUUID(); const token = randomBytes(32).toString('base64url');
  const privateValues = new Set([token]);
  const record: CoordinatorRecord = {
    schema: 'ramify-agent.coordinator/1', id, generation, projectRoot, planId: options.planId, jobId: null,
    launchedAt: now(), owner: service.ownerProcess(), model: options.model, workerModel: options.workerModel,
    startCommandId: options.commandId, startHash: coordinatorHash({ ...options, projectRoot }), skill: options.skill, replaceMcp: options.replaceMcp,
    phase: 'starting', endpoint: null, threadId: null, readiness: null, turn: null, pending: [], workers: [],
    observedAt: now(), error: null, settlement: null, cursor: 0, progress: [], ownershipReleased: false,
  };
  let store: CoordinatorStore;
  try { store = await CoordinatorStore.create(record); }
  catch (error) { await service.close(); await runtime.close(); throw error; }
  let provider: CodexProvider | undefined;
  let stopRequested = false;
  let startupSettled: Promise<void> | undefined;
  const terminalTurns = new Set<string>();
  const adoptTurn = (turn: { id: string; status: string; error: string | null }) => {
    const terminal = turn.status !== 'inProgress';
    if (terminal) terminalTurns.add(turn.id);
    if (!terminal && terminalTurns.has(turn.id)) return;
    if (record.turn?.status === 'inProgress' && record.turn.id !== turn.id && terminal) return;
    record.turn = { id: turn.id, status: turn.status, error: turn.error === null ? null : String(redact(turn.error)) };
  };
  let unsubscribe: (() => void) | undefined;
  let closeResolve!: () => void; const closed = new Promise<void>(resolve => { closeResolve = resolve; });
  const observers = new Set<() => void>();
  const sessions = assistanceHttpSessions(service);
  let server: Server;
  let closing: Promise<unknown> | undefined;
  const redact = (value: unknown): unknown => {
    if (typeof value === 'string') { let selected = value; for (const secret of privateValues) selected = selected.replaceAll(secret, '[credential removed]'); return selected.slice(0, 8192); }
    if (Array.isArray(value)) return value.slice(0, 100).map(redact);
    if (value !== null && typeof value === 'object') {
      let selected = value;
      if ('kind' in value && value.kind === 'mcp-elicitation' && 'schema' in value && value.schema !== null && typeof value.schema === 'object') {
        const schema = structuredClone(value.schema) as Record<string, unknown>;
        for (const field of Object.values((schema.properties ?? {}) as Record<string, Record<string, unknown>>)) { delete field.default; delete field.examples; }
        delete schema.default; delete schema.examples;
        selected = { ...value, schema };
      }
      return Object.fromEntries(Object.entries(selected).map(([key, entry]) => [key, redact(entry)]));
    }
    return value;
  };
  const describe = (error: unknown) => ({ kind: error instanceof CodexProviderError ? error.kind : 'host', message: String(redact(error instanceof Error ? error.message : String(error))) });
  const changed = (event: unknown) => {
    record.observedAt = now(); record.cursor++;
    record.progress.push({ cursor: record.cursor, at: record.observedAt, event: redact(event) });
    while (record.progress.length > 256 || Buffer.byteLength(JSON.stringify(record.progress)) > 262_144) record.progress.shift();
    store.changed(); for (const wake of observers) wake();
  };
  const snapshot = async (): Promise<CoordinatorSnapshot> => {
    if (store.persistenceError !== undefined && !stopRequested) { record.phase = 'error'; record.error = `Coordinator observation persistence failed: ${describe(store.persistenceError).message}`; }
    let assessments: CoordinatorSnapshot['assessments'] = []; let observationError: string | undefined;
    try { if (record.jobId !== null) assessments = await service.listAssessments(record.planId, record.jobId); }
    catch (error) { observationError = describe(error).message; }
    return { record: structuredClone(record), stale: false, assessments, ...(observationError === undefined ? {} : { observationError }) };
  };
  const finalize = async () => {
    unsubscribe?.(); await store.settled();
    await sessions.close(); server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); closeResolve();
  };
  const control = (command: CoordinatorCommand): Promise<CoordinatorControlResult> => store.command(command.commandId, command.action, command, async () => {
    if (command.action === 'stop') {
      stopRequested = true;
      closing ??= (async () => {
        record.phase = 'stopping'; changed({ kind: 'stopping' }); await store.flush();
        await startupSettled;
        record.settlement = provider === undefined ? { confirmed: true, descendants: 'settled', supervisorExited: true, reason: null } : redact(await provider.stop()) as NonNullable<CoordinatorRecord['settlement']>;
        if (!record.settlement.confirmed) { record.phase = 'unsettled'; changed({ kind: 'unsettled', settlement: record.settlement }); await store.flush(); throw new CodexProviderError('uncertain', `Owned execution is not confirmed settled: ${record.settlement.reason}`); }
        await service.close(); await runtime.close();
        record.ownershipReleased = true; record.phase = 'stopped'; record.pending = []; changed({ kind: 'stopped' }); await store.flush();
        const assessments = record.jobId === null ? [] : await service.listAssessments(record.planId, record.jobId);
        // Allow the durable receipt and HTTP response to leave before listener shutdown.
        setTimeout(() => { void finalize().catch(error => { record.phase = 'error'; record.error = describe(error).message; changed({ kind: 'shutdown-error', message: record.error }); }); }, 50);
        return { ...record.settlement, assessments };
      })();
      return closing;
    }
    if (record.phase !== 'ready' || provider === undefined || record.threadId === null || store.persistenceError !== undefined || stopRequested) throw new CodexProviderError('unavailable', `Coordinator input unavailable in ${record.phase}`);
    if (command.action === 'send') {
      const turn = await provider.send(record.threadId, command.message);
      // Provider events remain authoritative; never overwrite a completed event with an acknowledgement.
      adoptTurn(turn);
      changed({ kind: 'send-acknowledged', turnId: turn.id, status: turn.status });
      return { turnId: turn.id, status: turn.status, error: turn.error === null ? null : String(redact(turn.error)) };
    }
    if (command.action === 'respond') {
      const pending = provider.pendingRequests().find(request => request.id === command.requestId);
      const remember = (values: readonly unknown[]) => { for (const value of values) if ((typeof value === 'string' || typeof value === 'number') && String(value).length > 0) privateValues.add(String(value)); };
      if (pending?.kind === 'user-input' && command.response.kind === 'user-input') for (const question of pending.questions) if (question.secret) remember(command.response.answers[question.id] ?? []);
      if (pending?.kind === 'mcp-elicitation' && command.response.kind === 'mcp-elicitation') for (const [key, value] of Object.entries(command.response.content ?? {})) {
        const field = (pending.schema.properties as Record<string, Record<string, unknown>>)[key];
        if (/token|password|secret|credential|api.?key|authorization/i.test(key) || field?.writeOnly === true || field?.format === 'password') remember(Array.isArray(value) ? value : [value]);
      }
      await provider.respond(command.requestId, command.response); record.pending = redact(provider.pendingRequests()) as CoordinatorRecord['pending']; changed({ kind: 'response-delivered', requestId: command.requestId }); return { delivered: true, requestId: command.requestId };
    }
    return provider.interrupt(record.threadId, command.turnId);
  }, describe);

  const handler = async (request: Request): Promise<Response> => {
    const endpoint = record.endpoint;
    const url = new URL(request.url);
    if (endpoint === null || request.headers.get('host') !== new URL(endpoint).host || (request.headers.has('origin') && request.headers.get('origin') !== endpoint)) return json({ error: 'Invalid local host or origin' }, 403);
    const supplied = request.headers.get('authorization') ?? ''; const expected = `Bearer ${token}`;
    if (Buffer.byteLength(supplied) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return json({ error: 'Authentication required' }, 401);
    try {
      if (url.pathname === '/mcp') return sessions.handle(request);
      if (request.method === 'GET' && url.pathname === '/status') return json(await snapshot());
      if (request.method === 'GET' && url.pathname === '/watch') {
        const after = Number(url.searchParams.get('after') ?? '0'); const wait = Number(url.searchParams.get('wait') ?? '30000');
        if (!Number.isSafeInteger(after) || after < 0 || !Number.isSafeInteger(wait) || wait < 0 || wait > 30_000) return json({ error: 'Invalid watch cursor or wait' }, 400);
        if (after >= record.cursor && wait > 0 && !request.signal.aborted) await new Promise<void>(resolve => {
          const wake = () => { clearTimeout(timer); observers.delete(wake); request.signal.removeEventListener('abort', wake); resolve(); };
          const timer = setTimeout(wake, wait); observers.add(wake); request.signal.addEventListener('abort', wake, { once: true });
        });
        return json({ snapshot: await snapshot(), events: record.progress.filter(event => event.cursor > after), gap: after < (record.progress[0]?.cursor ?? record.cursor + 1) - 1, cursor: record.cursor });
      }
      if (request.method === 'POST' && url.pathname === '/control') {
        if (request.headers.get('x-coordinator-generation') !== generation) return json({ error: 'Stale host generation' }, 409);
        const reader = request.body?.getReader(); const chunks: Uint8Array[] = []; let size = 0;
        if (reader !== undefined) try { for (;;) { const next = await reader.read(); if (next.done) break; size += next.value.byteLength; if (size > 1_048_576) { await reader.cancel(); return json({ error: 'Control body exceeds limit' }, 413); } chunks.push(next.value); } } finally { reader.releaseLock(); }
        const command = coordinatorCommandSchema.parse(JSON.parse(Buffer.concat(chunks).toString('utf8')));
        return json(await control(command));
      }
      return json({ error: 'Unknown host operation' }, 404);
    } catch (error) { return json({ error: describe(error) }, 400); }
  };
  server = createServer(nodeFetchHandler(handler)); configureLongWaitHttpServer(server);
  try {
    await (dependencies.listen?.(server) ?? new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', () => { server.removeListener('error', reject); resolve(); }); }));
    const address = server.address(); if (address === null || typeof address === 'string') throw new Error('No loopback address');
    record.endpoint = `http://127.0.0.1:${address.port}`; record.phase = 'listening';
    await store.retainRuntime({ id, generation, endpoint: record.endpoint, token }); await store.flush();
    const check = await fetch(`${record.endpoint}/status`, { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(5000) });
    if (!check.ok || (await check.json() as CoordinatorSnapshot).record.generation !== generation) throw new Error('Listener readiness did not confirm host identity');
  } catch (error) { await sessions.close(); server.close(); await service.close(); await runtime.close(); record.phase = 'error'; record.error = describe(error).message; record.ownershipReleased = true; await store.flush(); closeResolve(); throw error; }

  const ready = (async () => {
    try {
      if (stopRequested) return;
      if (options.jobId !== undefined) {
        const detail = await service.jobDetail(options.planId, options.jobId);
        if (detail.job.projectRoot !== projectRoot || detail.job.planId !== options.planId || detail.job.jobId !== options.jobId) throw new Error('Supplied assisted registration identity differs');
        record.jobId = detail.job.jobId;
      } else {
        const executions = await service.listExecutions(options.planId);
        if (executions.length === 0) record.jobId = (await service.planStart({ planId: options.planId, commandId: options.commandId })).jobId;
        else if (executions.length === 1 && executions[0]!.kind === 'assisted') record.jobId = executions[0]!.jobId;
        else throw new Error(`Select an existing assisted job explicitly: ${executions.map(job => `${job.kind}:${job.jobId}`).join(', ')}`);
      }
      if (!stopRequested) record.phase = 'preparing'; changed({ kind: 'registered', jobId: record.jobId }); await store.flush();
      if (stopRequested) return;
      const name = `ramify_host_${generation.replaceAll('-', '')}`;
      const launch: CodexProviderOptions = { cwd: projectRoot, ...(options.codexExecutable === undefined ? {} : { executable: options.codexExecutable }), env: { ...process.env, [tokenEnvironment]: token }, configOverrides: [...options.replaceMcp.map(old => `mcp_servers.${old}.enabled=false`), `mcp_servers.${name}={url=${JSON.stringify(`${record.endpoint}/mcp`)},bearer_token_env_var=${JSON.stringify(tokenEnvironment)},required=true,tool_timeout_sec=960}`] };
      provider = (dependencies.provider ?? createCodexProvider)(launch);
      const discoveries = new Set<string>(); const qualifying = new Set<string>(); const workerTurns = new Map<string, string>();
      const qualifyWorker = (worker: CoordinatorRecord['workers'][number]) => {
        if (qualifying.has(worker.id) || worker.equipment !== 'unverified') return;
        qualifying.add(worker.id);
        void provider!.inspectEquipment(projectRoot, worker.id).then(equipment => {
          verifyCoordinatorEquipment(equipment, name, options.replaceMcp); worker.equipment = 'verified'; changed({ kind: 'worker-equipment', id: worker.id, state: 'verified' });
        }).catch(error => { worker.equipment = 'unavailable'; worker.error = describe(error).message; changed({ kind: 'worker-equipment', id: worker.id, state: 'unavailable', error: worker.error }); }).finally(() => { qualifying.delete(worker.id); });
      };
      const discoverWorker = (threadId: string) => {
        if (threadId === record.threadId || discoveries.has(threadId) || record.workers.some(worker => worker.id === threadId)) return;
        discoveries.add(threadId);
        void provider!.readThread(threadId).then(thread => {
          if (thread.parentThreadId === null) return; // A referenced peer is not proof of a descendant.
          const worker = { id: thread.id, parentThreadId: thread.parentThreadId, model: thread.model, ephemeral: thread.ephemeral, turnStatus: workerTurns.get(thread.id) ?? thread.turns.at(-1)?.status, equipment: 'unverified' as const };
          if (!record.workers.some(existing => existing.id === thread.id)) { record.workers.push(worker); qualifyWorker(worker); changed({ kind: 'worker-discovered', id: thread.id, parentThreadId: thread.parentThreadId, model: thread.model }); }
        }).catch(error => { changed({ kind: 'worker-discovery-error', id: threadId, error: describe(error).message }); }).finally(() => { discoveries.delete(threadId); });
      };
      const observed = (event: CodexEvent) => {
        if (event.kind === 'assistant-delta') return; // Never persist partial secrets or duplicate provider history.
        if (event.kind === 'turn' && event.threadId === record.threadId) adoptTurn(event.turn);
        if (event.kind === 'pending-request' || event.kind === 'request-resolved') record.pending = redact(provider!.pendingRequests()) as CoordinatorRecord['pending'];
        if (event.kind === 'provider-exit' && record.phase !== 'stopping') record.phase = 'provider-exited';
        if (event.kind === 'worker-thread' && !record.workers.some(worker => worker.id === event.threadId)) { const worker = { id: event.threadId, parentThreadId: event.parentThreadId, model: event.model, ephemeral: event.ephemeral, equipment: 'unverified' as const }; record.workers.push(worker); qualifyWorker(worker); }
        if (event.kind === 'work') for (const threadId of event.item.workerThreadIds ?? []) discoverWorker(threadId);
        if (event.kind === 'turn') {
          if (event.threadId !== record.threadId) { workerTurns.set(event.threadId, event.turn.status); discoverWorker(event.threadId); }
          const worker = record.workers.find(worker => worker.id === event.threadId);
          if (worker !== undefined) { worker.turnStatus = event.turn.status; qualifyWorker(worker); }
        }
        changed(event);
      };
      unsubscribe = provider.observe(observed);
      await prepareCoordinatorProvider({ launch, thread: { cwd: projectRoot, model: options.model }, workerModel: options.workerModel, requiredMcp: { server: name, tools: requiredTools }, verifyEquipment: equipment => verifyCoordinatorEquipment(equipment, name, options.replaceMcp), retain: async (session, readiness) => { record.threadId = session.thread.id; record.readiness = redact(readiness) as CoordinatorRecord['readiness']; changed({ kind: 'persistent-thread', id: session.thread.id, cliVersion: session.thread.cliVersion }); await store.flush(); } }, provider);
      if (stopRequested) return;
      const detail = await service.jobDetail(options.planId, record.jobId!);
      const prompt = `Use the coordinator skill at ${options.skill}. Target checkout: ${projectRoot}. Supplied assisted registration: plan ${record.planId}, job ${record.jobId}. Verify these identities and captured plan using job_detail; reuse this registration and its original baseline ${detail.job.protection.baselineCommit ?? '(unavailable; report gap)'}. Do not call plan_start or replace the baseline. Coordinate native ${options.workerModel} workers and submit committed iteration and final candidates through RA. Preserve all project instructions, protections, permissions and tools.\n${options.message}`;
      record.phase = 'ready'; changed({ kind: 'equipment-ready' }); await store.flush();
      const result = await control({ action: 'send', commandId: `${options.commandId}:initial`, message: prompt });
      if (result.state !== 'completed') throw new CodexProviderError(result.state === 'uncertain' ? 'uncertain' : 'unavailable', result.error?.message ?? 'Initial turn did not acknowledge');
      await store.flush();
    } catch (error) { if (!stopRequested && record.phase !== 'provider-exited') record.phase = 'error'; record.error = describe(error).message; changed({ kind: 'startup-error', error: record.error }); await store.flush(); }
  })();
  startupSettled = ready;
  return { store, ready, snapshot, control, closed };
}
