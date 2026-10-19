import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { expect, test, vi } from 'vitest';
import { startCoordinatorHost, type CoordinatorHost } from '../coordinator-host.js';
import { coordinatorStartSchema } from '../coordinator-contracts.js';
import { readCoordinator } from '../coordinator-store.js';
import { AssistanceService } from '../service.js';
import { ScriptedCodex, testSession, testThread, testTurn } from '../../../agent/subs/codex/src/tests/scripted.js';
import type { CodexProviderOptions } from '../../../agent/subs/codex/src/interfaces/provider.js';

const baseline = 'a'.repeat(40), candidate = 'b'.repeat(40);
const assistance = { registrationProtection: async () => ({ baselineCommit: baseline, rules: { explicitPaths: [], excludedPaths: [], guardedPaths: [], additions: 'protect' as const }, gaps: [], unavailable: null }), resolveCommit: async (_root: string, revision: string) => revision === 'HEAD' ? baseline : revision, currentHead: async () => baseline, isCleanRepository: async () => true };
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'coordinator-host-'));
  await mkdir(join(root, 'plans', 'sample'), { recursive: true }); await writeFile(join(root, 'plans', 'sample', 'plan.md'), '# Captured plan\n');
  const skill = join(root, 'skill.md'); await writeFile(skill, 'Supplied registration is reused.');
  return { root, options: coordinatorStartSchema.parse({ projectRoot: root, planId: 'sample', commandId: 'launch-once', skill, replaceMcp: ['old-stdio'] }) };
}
function providerScript(launch: CodexProviderOptions, onTurn?: (script: ScriptedCodex, frame: Parameters<ScriptedCodex['onWrite']>[0], count: number) => boolean) {
  const setting = launch.configOverrides!.find(value => value.includes('bearer_token_env_var'))!;
  const name = /^mcp_servers\.([^=]+)=/.exec(setting)![1]!;
  let turns = 0;
  const script = new ScriptedCodex(frame => {
    if (frame.id === undefined || frame.method === undefined) return;
    const values: Record<string, unknown> = {
      initialize: { userAgent: 'scripted-host/1', codexHome: '/persistent', platformOs: 'linux' },
      'model/list': { data: [{ model: 'gpt-6-astra', multiAgentVersion: 'v2' }, { model: 'gpt-6-sol', multiAgentVersion: 'v2' }], nextCursor: null },
      'experimentalFeature/list': { data: [{ name: 'multi_agent', enabled: true }], nextCursor: null },
      'mcpServerStatus/list': { data: [{ name, tools: Object.fromEntries(['plan_executions', 'job_detail', 'iteration', 'iteration_assess', 'assessment_wait', 'assessment_result'].map(tool => [tool, {}])), toolsError: null }], nextCursor: null },
      'config/read': { config: { model: 'user-configured-model', approval_policy: 'on-request', sandbox_mode: 'workspace-write', mcp_servers: { [name]: { url: 'http://127.0.0.1/mcp', required: true, tool_timeout_sec: 960, bearer_token_env_var: 'RAMIFY_COORDINATOR_MCP_TOKEN' }, 'old-stdio': { enabled: false, command: 'old-command' }, unrelated: { command: 'preserved' } } } },
      'thread/start': testSession({ cwd: launch.cwd }), 'thread/read': { thread: frame.params?.threadId === 'worker-1' ? testThread({ id: 'worker-1', parentThreadId: 'thread-1', model: 'gpt-6-sol', cwd: launch.cwd, status: { type: 'active' }, turns: [testTurn('inProgress', 'worker-turn')] }) : testThread({ cwd: launch.cwd }) }, 'turn/interrupt': {},
    };
    if (frame.method === 'turn/start') { turns++; if (onTurn?.(script, frame, turns)) return; script.receive({ id: frame.id, result: { turn: testTurn('inProgress', `turn-${turns}`) } }); return; }
    if (!Object.hasOwn(values, frame.method!)) throw new Error(`Unscripted ${frame.method}`);
    script.receive({ id: frame.id, result: values[frame.method!] });
  });
  return script;
}
async function stop(host: CoordinatorHost) { await host.control({ action: 'stop', commandId: 'cleanup' }); await host.closed; }
async function client(endpoint: string, token: string) { const connection = new Client({ name: 'host-witness', version: '1' }); await connection.connect(new StreamableHTTPClientTransport(new URL(`${endpoint}/mcp`), { requestInit: { headers: { authorization: `Bearer ${token}` } } })); return connection; }

test('host verifies listener before provider input, keeps shared assessment alive across HTTP session cancellation and retains private generation-bound controls', async () => {
  const { root, options } = await fixture(); let host: CoordinatorHost | undefined; const clients: Client[] = [];
  let release!: () => void; const held = new Promise<void>(resolve => { release = resolve; }); let assessmentSignal: AbortSignal | undefined;
  let script!: ScriptedCodex; let launch!: CodexProviderOptions;
  try {
    host = await startCoordinatorHost(options, { assistance: { ...assistance, assessor: async context => { assessmentSignal = context.signal; await held; return { gate: 'clear', summary: 'Scripted external assessor complete', repairs: [], decisions: [], gaps: [], evidence: [] }; } }, runtime: { close: async () => undefined }, provider: configuration => { launch = configuration; script = providerScript(configuration); return script.provider; } });
    await host.ready; expect(host.store.record.phase).toBe('ready');
    const { record, runtime } = await readCoordinator(root);
    expect(record.threadId).toBe('thread-1'); expect(runtime).not.toBeNull();
    expect((await stat(host.store.directory)).mode & 0o777).toBe(0o700); expect((await stat(join(host.store.directory, 'runtime.json'))).mode & 0o777).toBe(0o600);
    expect(launch.configOverrides).toContain('mcp_servers.old-stdio.enabled=false'); expect(launch.configOverrides!.join(' ')).not.toMatch(/approval_policy|sandbox_mode|instructions/);
    const prompt = script.written.find(frame => frame.method === 'turn/start')!.params!;
    expect(JSON.stringify(prompt)).toContain(record.jobId); expect(JSON.stringify(prompt)).toContain(baseline); expect(JSON.stringify(prompt)).not.toContain(runtime!.token);
    expect((await fetch(`${record.endpoint}/status`)).status).toBe(401);
    expect((await fetch(`${record.endpoint}/status`, { headers: { authorization: `Bearer ${runtime!.token}`, origin: 'https://foreign.invalid' } })).status).toBe(403);
    expect((await fetch(`${record.endpoint}/control`, { method: 'POST', headers: { authorization: `Bearer ${runtime!.token}`, 'x-coordinator-generation': 'old' }, body: '{}' })).status).toBe(409);
    script.receive({ id: 700, method: 'mcpServer/elicitation/request', params: { threadId: 'thread-1', turnId: 'turn-1', serverName: 'fixture', mode: 'form', message: 'Enter a secret value', requestedSchema: { type: 'object', properties: { private_token: { type: 'string', default: 'sensitive-provider-default' } }, required: ['private_token'] } } });
    const pending = host.store.record.pending[0]!;
    expect(pending).toMatchObject({ kind: 'mcp-elicitation', schema: { properties: { private_token: { type: 'string' } } } });
    expect(JSON.stringify(host.store.record)).not.toContain('sensitive-provider-default');
    expect(await host.control({ action: 'respond', commandId: 'secret-response', requestId: pending.id, response: { kind: 'mcp-elicitation', action: 'accept', content: { private_token: 'sensitive-operator-answer' } } })).toMatchObject({ state: 'completed' });
    await host.store.settled();
    expect(await readFile(join(host.store.directory, 'commands.jsonl'), 'utf8')).not.toContain('sensitive-operator-answer');
    expect(JSON.stringify(host.store.record)).not.toContain('sensitive-operator-answer');
    const one = await client(record.endpoint!, runtime!.token), two = await client(record.endpoint!, runtime!.token); clients.push(one, two);
    const detail = await two.callTool({ name: 'job_detail', arguments: { plan_id: 'sample', job_id: record.jobId } }); expect(JSON.stringify(detail)).toContain(baseline);
    const submitted = await one.callTool({ name: 'iteration_assess', arguments: { plan_id: 'sample', job_id: record.jobId, base: baseline, candidate, kind: 'iteration', brief: 'Native shared host witness', acceptance: ['host-observation'], command_id: 'assess-once' } });
    expect(submitted.isError).not.toBe(true); await vi.waitFor(() => expect(assessmentSignal).toBeDefined());
    await one.close(); expect(assessmentSignal!.aborted).toBe(false);
    const status = await host.snapshot(); expect(status.assessments).toMatchObject([{ status: 'running' }]);
    expect(Object.keys(status.assessments[0]!).sort()).toEqual(['error', 'id', 'revision', 'status']);
    const assessmentId = status.assessments[0]!.id;
    const waiting = two.callTool({ name: 'assessment_wait', arguments: { plan_id: 'sample', job_id: record.jobId, assessment_id: assessmentId, timeout_ms: 900000 } }).catch(error => error);
    await two.close(); await waiting; expect(assessmentSignal!.aborted).toBe(false);
    const three = await client(record.endpoint!, runtime!.token); clients.push(three);
    expect((await three.callTool({ name: 'job_detail', arguments: { plan_id: 'sample', job_id: record.jobId } })).isError).not.toBe(true);
    const busy = await host.control({ action: 'send', commandId: 'busy', message: 'Do not queue' }); expect(busy).toMatchObject({ state: 'failed', error: { kind: 'busy' } });
    script.receive({ method: 'turn/completed', params: { threadId: 'thread-1', turn: { ...testTurn('completed', 'turn-1'), items: [{ id: 'echo', type: 'agentMessage', text: 'Secret echoed: sensitive-operator-answer' }] } } });
    expect(JSON.stringify(host.store.record)).not.toContain('sensitive-operator-answer');
    const command = { action: 'send' as const, commandId: 'send-once', message: 'Follow up' };
    expect(await Promise.all([host.control(command), host.control(command)])).toMatchObject([{ state: 'completed' }, { state: 'completed' }]);
    expect(script.written.filter(frame => frame.method === 'turn/start')).toHaveLength(2);
    await expect(host.control({ ...command, message: 'Changed' })).rejects.toThrow(/conflicts/);
    expect(await readFile(join(host.store.directory, 'record.json'), 'utf8')).not.toContain(runtime!.token);
    release(); await vi.waitFor(async () => expect((await host!.snapshot()).assessments[0]!.status).toBe('completed'));
  } finally { release(); await Promise.allSettled(clients.map(connection => connection.close())); if (host !== undefined) await stop(host); await rm(root, { recursive: true, force: true }); }
}, 15000);

test('a live project owner and concurrent host start are refused before provider construction or duplicate registration', async () => {
  const { root, options } = await fixture(); let host: CoordinatorHost | undefined; let created = 0;
  const dependencies = { assistance, runtime: { close: async () => undefined }, provider: (launch: CodexProviderOptions) => { created++; return providerScript(launch).provider; } };
  const owner = await AssistanceService.open({ projectRoot: root, ...assistance });
  try {
    await expect(startCoordinatorHost(options, dependencies)).rejects.toThrow(/lock|held|owner/i); expect(created).toBe(0); expect(await owner.listExecutions('sample')).toEqual([]);
    await owner.close();
    const attempts = await Promise.allSettled([startCoordinatorHost(options, dependencies), startCoordinatorHost(options, dependencies)]);
    expect(attempts.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    host = (attempts.find(result => result.status === 'fulfilled') as PromiseFulfilledResult<CoordinatorHost>).value; await host.ready;
    expect(created).toBe(1); expect(host.store.record.jobId).not.toBeNull();
  } finally { await owner.close(); if (host !== undefined) await stop(host); await rm(root, { recursive: true, force: true }); }
}, 10000);

test('stop during registration prevents later provider construction and retains settled ownership', async () => {
  const { root, options } = await fixture(); let release!: () => void; const held = new Promise<void>(resolve => { release = resolve; }); let host: CoordinatorHost | undefined; let created = 0;
  try {
    host = await startCoordinatorHost(options, { assistance: { ...assistance, registrationProtection: async () => { await held; return assistance.registrationProtection(); } }, runtime: { close: async () => undefined }, provider: launch => { created++; return providerScript(launch).provider; } });
    const stopping = host.control({ action: 'stop', commandId: 'stop-during-startup' }); release();
    expect(await stopping).toMatchObject({ state: 'completed', result: { confirmed: true } }); await host.closed;
    expect(created).toBe(0); expect((await readCoordinator(root)).record).toMatchObject({ phase: 'stopped', ownershipReleased: true });
  } finally { release(); if (host !== undefined && !host.store.record.ownershipReleased) await stop(host); await rm(root, { recursive: true, force: true }); }
}, 10000);

test('lost HTTP control reply retains one effect while activity-only worker discovery and bounded watch gaps remain observable', async () => {
  const { root, options } = await fixture(); let host: CoordinatorHost | undefined; let script!: ScriptedCodex; let held: Parameters<ScriptedCodex['onWrite']>[0] | undefined;
  try {
    host = await startCoordinatorHost(options, { assistance, runtime: { close: async () => undefined }, provider: launch => { script = providerScript(launch, (_script, frame, count) => { if (count !== 2) return false; held = frame; return true; }); return script.provider; } });
    await host.ready;
    script.receive({ method: 'turn/completed', params: { threadId: 'thread-1', turn: testTurn('completed', 'turn-1') } });
    const { runtime } = await readCoordinator(root); const headers = { authorization: `Bearer ${runtime!.token}`, 'x-coordinator-generation': runtime!.generation, 'content-type': 'application/json' };
    const command = { action: 'send', commandId: 'lost-reply', message: 'Deliver exactly once in this live generation' }; const abort = new AbortController();
    const lost = fetch(`${runtime!.endpoint}/control`, { method: 'POST', headers, body: JSON.stringify(command), signal: abort.signal }).catch(error => error);
    await vi.waitFor(() => expect(held).toBeDefined()); abort.abort(); await lost;
    const retry = fetch(`${runtime!.endpoint}/control`, { method: 'POST', headers, body: JSON.stringify(command) });
    script.receive({ id: held!.id, result: { turn: testTurn('inProgress', 'turn-2') } });
    expect(await (await retry).json()).toMatchObject({ commandId: 'lost-reply', state: 'completed', result: { turnId: 'turn-2' } });
    expect(script.written.filter(frame => frame.method === 'turn/start')).toHaveLength(2);
    script.receive({ method: 'item/started', params: { threadId: 'thread-1', turnId: 'turn-2', item: { id: 'native-spawn', type: 'subAgentActivity', kind: 'started', agentThreadId: 'worker-1' } } });
    script.receive({ method: 'turn/started', params: { threadId: 'worker-1', turn: testTurn('inProgress', 'worker-turn') } });
    await vi.waitFor(() => expect(host!.store.record.workers).toMatchObject([{ id: 'worker-1', parentThreadId: 'thread-1', model: 'gpt-6-sol', ephemeral: false, equipment: 'verified', turnStatus: 'inProgress' }]));
    expect(script.written.filter(frame => frame.method === 'thread/read' && frame.params?.threadId === 'worker-1')).toHaveLength(1);
    // Minimum input crossing the configured 256-entry progress boundary.
    for (let count = 0; count < 257; count++) script.receive({ method: 'thread/status/changed', params: { threadId: 'thread-1', status: { type: 'active' } } });
    const update = await (await fetch(`${runtime!.endpoint}/watch?after=0&wait=0`, { headers })).json() as { gap: boolean; events: unknown[]; snapshot: { record: { id: string } } };
    expect(update.gap).toBe(true); expect(update.events.length).toBeLessThanOrEqual(256); expect(update.snapshot.record.id).toBe(host.store.record.id);
  } finally { if (host !== undefined) await stop(host); await rm(root, { recursive: true, force: true }); }
}, 10000);
