import { mkdtemp, rm, readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { verifyCoordinatorEquipment, startCoordinatorHost } from '../coordinator-host.js';
import { CoordinatorStore, readCoordinator } from '../coordinator-store.js';
import { parseCoordinateOptions } from '../coordinator-options.js';
import { coordinatorStartSchema, type CoordinatorRecord } from '../coordinator-contracts.js';
import type { CodexEquipment } from '../../../agent/subs/codex/src/interfaces/provider.js';

test('effective MCP verification rejects inherited commands, missing required settings and revived stdio entries without credential projection', () => {
  const equipment: CodexEquipment = { models: [], features: [], mcp: [{ name: 'new', error: null, tools: ['plan_executions', 'job_detail', 'iteration', 'iteration_assess', 'assessment_wait', 'assessment_result'] }], configuredModel: 'user-model', approvalPolicy: 'on-request', sandbox: 'workspace-write', mcpConfiguration: [
    { name: 'new', enabled: true, transport: 'http', required: true, toolTimeoutSeconds: 960, bearerTokenEnvVar: 'RAMIFY_COORDINATOR_MCP_TOKEN' },
    { name: 'old', enabled: false, transport: 'stdio', required: false, toolTimeoutSeconds: null, bearerTokenEnvVar: null },
  ] };
  expect(() => verifyCoordinatorEquipment(equipment, 'new', ['old'])).not.toThrow();
  for (const bad of [{ transport: 'ambiguous' as const }, { required: false }, { toolTimeoutSeconds: 900 }, { bearerTokenEnvVar: 'different' }]) {
    expect(() => verifyCoordinatorEquipment({ ...equipment, mcpConfiguration: [{ ...equipment.mcpConfiguration![0]!, ...bad }, equipment.mcpConfiguration![1]!] }, 'new', ['old'])).toThrow(/incompatible/);
  }
  expect(() => verifyCoordinatorEquipment({ ...equipment, mcpConfiguration: [equipment.mcpConfiguration![0]!, { ...equipment.mcpConfiguration![1]!, enabled: true }] }, 'new', ['old'])).toThrow(/still enabled/);
});

test('durable controls coalesce concurrent retry, reject identity conflicts and retain uncertain delivery without replaying input', async () => {
  const root = await mkdtemp(join(tmpdir(), 'coordinator-control-'));
  const record = { projectRoot: root, id: 'coord-11111111-1111-1111-1111-111111111111', generation: 'generation' } as CoordinatorRecord;
  try {
    const store = await CoordinatorStore.create(record);
    let release!: () => void; const held = new Promise<void>(resolve => { release = resolve; }); let calls = 0;
    const operation = async () => { calls++; await held; throw new Error('delivery uncertain'); };
    const describe = (error: unknown) => ({ kind: 'uncertain', message: String(error) });
    const first = store.command('once', 'respond', { response: 'secret answer' }, operation, describe);
    const retry = store.command('once', 'respond', { response: 'secret answer' }, operation, describe);
    await expect(store.command('once', 'respond', { response: 'changed' }, operation, describe)).rejects.toThrow(/conflicts/);
    release(); const result = await first;
    expect(await retry).toEqual(result); expect(result.state).toBe('uncertain'); expect(calls).toBe(1);
    expect(await store.command('once', 'respond', { response: 'secret answer' }, operation, describe)).toEqual(result); expect(calls).toBe(1);
    await store.settled(); expect(await readFile(join(store.directory, 'commands.jsonl'), 'utf8')).not.toContain('secret answer');
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('coordinate parsing retains exact replacement names and stable control identity while rejecting inapplicable flags', () => {
  expect(parseCoordinateOptions(['start', '--project', '/target', '--plan', 'p', '--replace-mcp', 'ramify-agent', '--replace-mcp=another', '--model', 'chosen', '--json'])).toMatchObject({ action: 'start', model: 'chosen', replaceMcp: ['ramify-agent', 'another'], json: true });
  expect(parseCoordinateOptions(['respond', '--project', '/target', '--id', 'c', '--command-id', 'once', '--request', 'native:generation:request', '--response-file', '/answer'])).toMatchObject({ requestId: 'native:generation:request', commandId: 'once' });
  for (const args of [['send', '--project', '/p'], ['status', '--project', '/p', '--model', 'x'], ['stop', '--project', '/p', '--id', 'c', '--replace-mcp', 'old'], ['watch', '--project', '/p', '--id', 'c', '--after=-1']]) expect(() => parseCoordinateOptions(args)).toThrow();
});

test('scripted listener failure retains an honest failed phase and releases ownership before any registration or provider construction', async () => {
  const root = await mkdtemp(join(tmpdir(), 'coordinator-readiness-')); const skill = join(root, 'skill.md'); await writeFile(skill, 'Guidance');
  let providerCalls = 0, registrationCalls = 0, runtimeClosed = false;
  try {
    await expect(startCoordinatorHost(coordinatorStartSchema.parse({ projectRoot: root, planId: 'missing-plan', commandId: 'once', skill }), {
      runtime: { close: async () => { runtimeClosed = true; } },
      assistance: { registrationProtection: async () => { registrationCalls++; throw new Error('Unexpected registration'); } },
      listen: async () => { throw new Error('scripted EADDRINUSE'); },
      provider: () => { providerCalls++; throw new Error('Unexpected provider'); },
    })).rejects.toThrow('scripted EADDRINUSE');
    expect(providerCalls).toBe(0); expect(registrationCalls).toBe(0); expect(runtimeClosed).toBe(true);
    expect((await readCoordinator(root)).record).toMatchObject({ phase: 'error', error: 'scripted EADDRINUSE', ownershipReleased: true, jobId: null, threadId: null });
    await expect(readFile(join(root, 'plans', '.harness', 'lock'))).rejects.toMatchObject({ code: 'ENOENT' });
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('failed receipt persistence after provider acceptance preserves uncertainty and refuses duplicate delivery even after disk repair', async () => {
  const root = await mkdtemp(join(tmpdir(), 'coordinator-receipt-'));
  try {
    const store = await CoordinatorStore.create({ projectRoot: root, id: 'coord-11111111-1111-1111-1111-111111111111', generation: 'generation' } as CoordinatorRecord);
    const log = join(store.directory, 'commands.jsonl'), saved = join(store.directory, 'saved.jsonl'); let calls = 0;
    const operation = async () => { calls++; await rename(log, saved); await mkdir(log); return { acknowledged: true }; };
    const describe = (error: unknown) => ({ kind: 'host', message: String(error) });
    const first = await store.command('accepted-once', 'send', { message: 'Input' }, operation, describe);
    expect(first).toMatchObject({ state: 'uncertain', error: { kind: 'uncertain' } }); expect(store.persistenceError).toBeDefined();
    await rm(log, { recursive: true }); await rename(saved, log);
    expect(await store.command('accepted-once', 'send', { message: 'Input' }, operation, describe)).toEqual(first); expect(calls).toBe(1);
    await store.settled();
  } finally { await rm(root, { recursive: true, force: true }); }
});
