import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { readFile, realpath } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
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
import { requireCoordinatorSettlement } from './coordinator-recovery.js';
import { CoordinatorStore, coordinatorHash, readCoordinator, readCoordinatorHistory } from './coordinator-store.js';
import { coordinatorProjection } from './coordinator-projection.js';

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
  readonly id?: string;
  readonly guardian?: { readonly path: string; readonly generation: string };
  readonly assistance?: Omit<AssistanceOptions, 'projectRoot'>;
  readonly provider?: (options: CodexProviderOptions) => CodexProvider;
  readonly runtime?: { readonly assessor?: Assessor; close(): Promise<void> };
  readonly listen?: (server: Server) => Promise<void>;
}

/** Verify effective settings both before input and in each loaded conversation. */
export function verifyCoordinatorEquipment(equipment: CodexEquipment, name: string, replaced: readonly string[]): void {
  if (equipment.approvalPolicy !== 'never' || equipment.sandbox !== 'danger-full-access') throw new CodexProviderError('unavailable', 'Codex coordinator and workers require full access with approval policy never');
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
  if (dependencies.id !== undefined && !/^coord-[a-f0-9-]{36}$/.test(dependencies.id)) throw new Error('Invalid coordinator launch identity');
  await readFile(options.skill, 'utf8');
  if (options.resumeFrom === undefined) {
    const prior = await readCoordinatorHistory(projectRoot).then(history => history.latest).catch(error => { if ((error as NodeJS.ErrnoException).code === 'COORDINATOR_NOT_FOUND') return undefined; throw error; });
    if (prior !== undefined) {
      if (!prior.record.ownershipReleased) throw new Error(`Coordinator ${prior.record.id} retains ownership; use explicit resume after settlement`);
      await requireCoordinatorSettlement(prior.record);
    }
  }
  let predecessor = options.resumeFrom === undefined ? undefined : (await readCoordinator(projectRoot, options.resumeFrom)).record;
  if (predecessor !== undefined) {
    await requireCoordinatorSettlement(predecessor);
    predecessor = (await readCoordinator(projectRoot, predecessor.id)).record;
    if (predecessor.planId !== options.planId || predecessor.jobId === null || predecessor.jobId !== options.jobId) throw new Error('Continuation must preserve the retained plan/job identity');
    const requiredDisabled = [...predecessor.replaceMcp, ...(predecessor.endpoint === null ? [] : [`ramify_host_${predecessor.generation.replaceAll('-', '')}`])];
    if (requiredDisabled.some(name => !options.replaceMcp.includes(name))) throw new Error('Continuation must retain previously disabled MCP entries and disable the preceding HTTP entry');
  }
  // Caller intent is hashed unchanged. Freeze its effective context choice once,
  // separately from that identity, using only the settled predecessor.
  const freshThread = options.freshThread === true || predecessor?.freshThread === true && predecessor.threadId === null;
  const lineage: CoordinatorRecord[] = [];
  const ancestors = new Set<string>();
  for (let prior = predecessor; prior !== undefined; prior = prior.resumeFrom === undefined ? undefined : (await readCoordinator(projectRoot, prior.resumeFrom)).record) {
    if (ancestors.has(prior.id) || prior.planId !== options.planId || prior.jobId !== options.jobId) throw new Error('Coordinator continuation lineage is invalid');
    ancestors.add(prior.id); lineage.push(prior);
  }
  const retainedThreadId = lineage.find(prior => prior.threadId !== null)?.threadId;
  const previousHttp = new Map(lineage.filter(prior => prior.endpoint !== null).map(prior => [`ramify_host_${prior.generation.replaceAll('-', '')}`, `${prior.endpoint}/mcp`]));
  const runtime = dependencies.runtime ?? createAssistanceRuntime({ projectRoot, model: options.assessmentModel });
  let service: AssistanceService;
  try { service = await AssistanceService.open({ projectRoot, assessor: runtime.assessor, ...dependencies.assistance }); }
  catch (error) { await runtime.close(); throw error; }
  let retainedJobId: string | null = null;
  try {
    if (options.resumeFrom !== undefined) {
      const latest = (await readCoordinatorHistory(projectRoot)).latest.record;
      if (latest.id !== options.resumeFrom) throw new Error(`Stale coordinator predecessor ${options.resumeFrom}; continue from latest coordinator ${latest.id}`);
    }
    if (options.jobId !== undefined) {
      const detail = await service.jobDetail(options.planId, options.jobId);
      if (detail.job.projectRoot !== projectRoot || detail.job.planId !== options.planId || detail.job.jobId !== options.jobId) throw new Error('Supplied assisted registration identity differs');
      retainedJobId = detail.job.jobId;
    }
  }
  catch (error) { await service.close(); await runtime.close(); throw error; }
  const now = () => new Date().toISOString();
  const id = dependencies.id ?? `coord-${randomUUID()}`; const generation = randomUUID(); const token = randomBytes(32).toString('base64url');
  const privateValues = new Set([token]);
  const projection = coordinatorProjection(privateValues);
  const record: CoordinatorRecord = {
    ...(dependencies.guardian === undefined ? {} : { guardian: dependencies.guardian }),
    ...(options.assessmentModel === undefined ? {} : { assessmentModel: options.assessmentModel }), ...(options.codexExecutable === undefined ? {} : { codexExecutable: options.codexExecutable }),
    ...(options.resumeFrom === undefined ? {} : { resumeFrom: options.resumeFrom, recovery: { thread: 'pending', reason: null, uncertainCommands: [] } }),
    schema: 'ramify-agent.coordinator/1', id, generation, projectRoot, planId: options.planId, jobId: retainedJobId, freshThread,
    launchedAt: now(), owner: service.ownerProcess(), model: options.model, workerModel: options.workerModel,
    startCommandId: options.commandId, startHash: coordinatorHash({ ...options, projectRoot }), skill: options.skill, replaceMcp: options.replaceMcp,
    phase: 'starting', initialTurnAcknowledged: false, endpoint: null, threadId: null, readiness: null, turn: null, pending: [], workers: [],
    observedAt: now(), error: null, settlement: null, cursor: 0, progress: [], ownershipReleased: false,
  };
  let store: CoordinatorStore;
  try { store = await CoordinatorStore.create(record, options.message); }
  catch (error) { await service.close(); await runtime.close(); throw error; }
  try {
    if (record.guardian !== undefined) {
      const deadline = Date.now() + 5000;
      for (;;) {
        const evidence = await readFile(record.guardian.path, 'utf8').then(body => JSON.parse(body) as { generation: string; hostPid?: number; hostIdentity?: string }).catch(error => { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined; throw error; });
        if (evidence !== undefined) {
          if (evidence.generation !== record.guardian.generation || evidence.hostPid !== record.owner.pid || evidence.hostIdentity?.split(':').at(-1) !== record.owner.processStart) throw new Error('Guardian readiness identity differs from coordinator');
          break;
        }
        if (Date.now() >= deadline) throw new Error('Guardian ownership evidence was not retained before provider launch');
        await delay(20);
      }
    }
  } catch (error) {
    await service.close(); await runtime.close(); record.phase = 'error'; record.error = error instanceof Error ? error.message : String(error); record.ownershipReleased = true; await store.flush(); throw error;
  }
  let provider: CodexProvider | undefined;
  let stopRequested = false;
  let startupSettled: Promise<void> | undefined;
  const terminalTurns = new Set<string>();
  const adoptTurn = (turn: { id: string; status: string; error: string | null }) => {
    const terminal = turn.status !== 'inProgress';
    if (terminal) terminalTurns.add(turn.id);
    if (!terminal && terminalTurns.has(turn.id)) return;
    if (record.turn?.status === 'inProgress' && record.turn.id !== turn.id && terminal) return;
    record.turn = { id: turn.id, status: turn.status, error: turn.error === null ? null : projection.text(turn.error) };
  };
  let unsubscribe: (() => void) | undefined;
  let closeResolve!: () => void; const closed = new Promise<void>(resolve => { closeResolve = resolve; });
  const observers = new Set<() => void>();
  const sessions = assistanceHttpSessions(service);
  let server: Server;
  let closing: Promise<unknown> | undefined;
  const describe = (error: unknown) => ({ kind: error instanceof CodexProviderError ? error.kind : 'host', message: projection.text(error instanceof Error ? error.message : String(error)) });
  const changed = (event: unknown) => {
    record.observedAt = now(); record.cursor++;
    record.progress.push({ cursor: record.cursor, at: record.observedAt, event });
    while (record.progress.length > 256 || Buffer.byteLength(JSON.stringify(record.progress)) > 262_144) record.progress.shift();
    store.changed(); for (const wake of observers) wake();
  };
  const snapshot = async (): Promise<CoordinatorSnapshot> => {
    if (store.persistenceError !== undefined && !stopRequested) { record.phase = 'error'; record.error = `Coordinator observation persistence failed: ${describe(store.persistenceError).message}`; }
    let assessments: CoordinatorSnapshot['assessments'] = []; let observationError: string | undefined;
    try { if (record.jobId !== null) assessments = (await service.listAssessments(record.planId, record.jobId)).map(({ id, status, revision, error }) => ({ id, status, revision, error: error === null ? null : projection.text(error) })); }
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
        record.settlement = provider === undefined ? { confirmed: true, descendants: 'settled', supervisorExited: true, reason: null } : await provider.stop();
        record.settlement = { ...record.settlement, reason: projection.nullable(record.settlement.reason) };
        if (!record.settlement.confirmed) { record.phase = 'unsettled'; changed({ kind: 'unsettled', settlement: record.settlement }); await store.flush(); throw new CodexProviderError('uncertain', `Owned execution is not confirmed settled: ${record.settlement.reason}`); }
        await service.close(); await runtime.close();
        record.ownershipReleased = true; record.phase = 'stopped'; record.pending = []; changed({ kind: 'stopped' }); await store.flush();
        const assessments = record.jobId === null ? [] : (await service.listAssessments(record.planId, record.jobId)).map(({ id, status, revision, error }) => ({ id, status, revision, error: error === null ? null : projection.text(error) }));
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
      return { turnId: turn.id, status: turn.status, error: turn.error === null ? null : projection.text(turn.error) };
    }
    if (command.action === 'respond') {
      const pending = provider.pendingRequests().find(request => request.id === command.requestId);
      const remember = (values: readonly unknown[]) => { for (const value of values) if ((typeof value === 'string' || typeof value === 'number') && String(value).length > 0) privateValues.add(String(value)); };
      if (pending?.kind === 'user-input' && command.response.kind === 'user-input') for (const question of pending.questions) if (question.secret) remember(command.response.answers[question.id] ?? []);
      if (pending?.kind === 'mcp-elicitation' && command.response.kind === 'mcp-elicitation') for (const [key, value] of Object.entries(command.response.content ?? {})) {
        const field = (pending.schema.properties as Record<string, Record<string, unknown>>)[key];
        if (/token|password|secret|credential|api.?key|authorization/i.test(key) || field?.writeOnly === true || field?.format === 'password') remember(Array.isArray(value) ? value : [value]);
      }
      await provider.respond(command.requestId, command.response); record.pending = provider.pendingRequests().map(projection.pending); changed({ kind: 'response-delivered', requestId: command.requestId }); return { delivered: true, requestId: command.requestId };
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
      if (record.jobId !== null) {
        if (predecessor !== undefined) record.recovery!.uncertainCommands = await store.inherit(predecessor.id);
      } else {
        const executions = await service.listExecutions(options.planId);
        if (executions.length === 0) record.jobId = (await service.planStart({ planId: options.planId, commandId: options.commandId })).jobId;
        else if (executions.length === 1 && executions[0]!.kind === 'assisted') record.jobId = executions[0]!.jobId;
        else throw new Error(`Select an existing assisted job explicitly: ${executions.map(job => `${job.kind}:${job.jobId}`).join(', ')}`);
      }
      if (!stopRequested) record.phase = 'preparing'; changed({ kind: 'registered', jobId: record.jobId }); await store.flush();
      if (stopRequested) return;
      const name = `ramify_host_${generation.replaceAll('-', '')}`;
      const launch: CodexProviderOptions = { cwd: projectRoot, ...(options.codexExecutable === undefined ? {} : { executable: options.codexExecutable }), env: { ...process.env, [tokenEnvironment]: token }, configOverrides: [...options.replaceMcp.map(old => previousHttp.has(old) ? `mcp_servers.${old}={url=${JSON.stringify(previousHttp.get(old))},enabled=false}` : `mcp_servers.${old}.enabled=false`), `mcp_servers.${name}={url=${JSON.stringify(`${record.endpoint}/mcp`)},bearer_token_env_var=${JSON.stringify(tokenEnvironment)},required=true,tool_timeout_sec=960}`] };
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
        if (event.kind === 'pending-request' || event.kind === 'request-resolved') record.pending = provider!.pendingRequests().map(projection.pending);
        if (event.kind === 'provider-exit' && record.phase !== 'stopping') record.phase = 'provider-exited';
        if (event.kind === 'worker-thread' && !record.workers.some(worker => worker.id === event.threadId)) { const worker = { id: event.threadId, parentThreadId: event.parentThreadId, model: event.model, ephemeral: event.ephemeral, equipment: 'unverified' as const }; record.workers.push(worker); qualifyWorker(worker); }
        if (event.kind === 'work') for (const threadId of event.item.workerThreadIds ?? []) discoverWorker(threadId);
        if (event.kind === 'turn') {
          if (event.threadId !== record.threadId) { workerTurns.set(event.threadId, event.turn.status); discoverWorker(event.threadId); }
          const worker = record.workers.find(worker => worker.id === event.threadId);
          if (worker !== undefined) { worker.turnStatus = event.turn.status; qualifyWorker(worker); }
        }
        changed(projection.event(event));
      };
      unsubscribe = provider.observe(observed);
      const mcp = [...options.replaceMcp.map(name => ({ name, enabled: false as const })), { name, url: `${record.endpoint}/mcp`, bearerTokenEnvVar: tokenEnvironment, required: true as const, toolTimeoutSeconds: 960 }];
      const prepared = await prepareCoordinatorProvider({ launch, thread: { cwd: projectRoot, model: options.model, mcp }, ...(retainedThreadId === null || retainedThreadId === undefined || freshThread ? {} : { resumeThreadId: retainedThreadId, allowMissingThreadFallback: true }), onThreadFallback: reason => { if (record.recovery !== undefined) { record.recovery.thread = 'fresh'; record.recovery.reason = projection.text(reason); } }, workerModel: options.workerModel, requiredMcp: { server: name, tools: requiredTools }, verifyEquipment: equipment => verifyCoordinatorEquipment(equipment, name, options.replaceMcp), retain: async (session, readiness) => { record.threadId = session.thread.id; record.readiness = structuredClone(readiness); if (record.recovery !== undefined && record.recovery.thread === 'pending') { record.recovery.thread = session.thread.id === retainedThreadId ? 'resumed' : 'fresh'; record.recovery.reason = options.freshThread ? 'Fresh persistent context explicitly requested' : freshThread ? 'Pending fresh context retained from previous host' : retainedThreadId === undefined ? 'Previous startup retained no thread' : null; } const last = session.thread.turns.at(-1); if (last !== undefined) adoptTurn(last); changed({ kind: 'persistent-thread', id: session.thread.id, cliVersion: session.thread.cliVersion }); await store.flush(); } }, provider);
      if (stopRequested) return;
      if (predecessor !== undefined && prepared.session.thread.status === 'active') {
        const active = prepared.session.thread.turns.filter(turn => turn.status === 'inProgress').at(-1);
        if (active === undefined) throw new CodexProviderError('unavailable', 'Resumed thread reports unidentified activity; explicit inspection is required');
        await provider.interrupt(prepared.session.thread.id, active.id);
        const thread = await provider.readThread(prepared.session.thread.id);
        if (thread.status !== 'idle') throw new CodexProviderError('unavailable', 'Resumed thread has not confirmed idle after interruption');
      }
      const detail = await service.jobDetail(options.planId, record.jobId!);
      const prompt = `Use the coordinator skill at ${options.skill}. Target checkout: ${projectRoot}. Supplied assisted registration: plan ${record.planId}, job ${record.jobId}. Verify these identities and captured plan using job_detail; reuse this registration and its original baseline ${detail.job.protection.baselineCommit ?? '(unavailable; report gap)'}. Do not call plan_start or replace the baseline. Coordinate native ${options.workerModel} workers and submit committed iteration and final candidates through RA. Preserve all project instructions, protections, permissions and tools.\n${predecessor === undefined ? '' : `Continue after interruption using current repository files and retained job state. Preserve partial, staged and untracked work. Do not replay previous messages, approvals or uncertain operations. Uncertain admitted commands: ${JSON.stringify(record.recovery!.uncertainCommands)}. Interrupted assessments remain pending: inspect and explicitly call assessment_resume for each interrupted assessment that still needs completion; do not submit a duplicate. Existing decisions and exact candidate-bound iteration/final assessment obligations remain effective. The previous owner and its descendants have settled.\n`}${options.message}`;
      record.phase = 'ready'; changed({ kind: 'equipment-ready' }); await store.flush();
      const result = await control({ action: 'send', commandId: predecessor === undefined ? `${options.commandId}:initial` : `${options.commandId}:continue:${predecessor.id}`, message: prompt });
      if (result.state !== 'completed') throw new CodexProviderError(result.state === 'uncertain' ? 'uncertain' : 'unavailable', result.error?.message ?? 'Initial turn did not acknowledge');
      record.initialTurnAcknowledged = true;
      await store.flush();
    } catch (error) { if (!stopRequested && record.phase !== 'provider-exited') record.phase = 'error'; record.error = describe(error).message; changed({ kind: 'startup-error', error: record.error }); await store.flush(); }
  })();
  startupSettled = ready;
  return { store, ready, snapshot, control, closed };
}
