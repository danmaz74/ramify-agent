import { mkdtemp, rm, readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { verifyCoordinatorEquipment, startCoordinatorHost } from '../coordinator-host.js';
import { CoordinatorStore, readCoordinator, coordinatorHash } from '../coordinator-store.js';
import { launchCoordinator } from '../coordinator-client.js';
import { parseCoordinateOptions } from '../coordinator-options.js';
import { coordinatorStartSchema, type CoordinatorRecord } from '../coordinator-contracts.js';
import type { CodexEquipment } from '../../../agent/subs/codex/src/interfaces/provider.js';

test('effective MCP verification rejects inherited commands, missing required settings and revived stdio entries without credential projection', () => {
  const equipment: CodexEquipment = { models: [], features: [], mcp: [{ name: 'new', error: null, tools: ['plan_executions', 'job_detail', 'iteration', 'iteration_assess', 'assessment_wait', 'assessment_result'] }], configuredModel: 'user-model', approvalPolicy: 'never', sandbox: 'danger-full-access', mcpConfiguration: [
    { name: 'new', enabled: true, transport: 'http', required: true, toolTimeoutSeconds: 960, bearerTokenEnvVar: 'RAMIFY_COORDINATOR_MCP_TOKEN' },
    { name: 'old', enabled: false, transport: 'stdio', required: false, toolTimeoutSeconds: null, bearerTokenEnvVar: null },
  ] };
  expect(() => verifyCoordinatorEquipment(equipment, 'new', ['old'])).not.toThrow();
  for (const bad of [{ approvalPolicy: 'on-request' }, { sandbox: 'workspace-write' }, { sandbox: null }]) {
    expect(() => verifyCoordinatorEquipment({ ...equipment, ...bad }, 'new', ['old'])).toThrow(/full access/);
  }
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
  expect(parseCoordinateOptions(['resume', '--project', '/p', '--id', 'previous', '--command-id', 'resume-once', '--fresh-thread', '--replace-mcp', 'extra', '--model', 'retained-choice'])).toMatchObject({ action: 'resume', id: 'previous', commandId: 'resume-once', freshThread: true, replaceMcp: ['extra'], model: 'retained-choice' });
  for (const args of [['start', '--project', '/p', '--plan', 'p', '--fresh-thread'], ['send', '--project', '/p'], ['status', '--project', '/p', '--model', 'x'], ['stop', '--project', '/p', '--id', 'c', '--replace-mcp', 'old'], ['watch', '--project', '/p', '--id', 'c', '--after=-1']]) expect(() => parseCoordinateOptions(args)).toThrow();
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

test('continuation preserves completed and uncertain mutation admissions without replaying prior send or approval bodies', async () => {
  const root = await mkdtemp(join(tmpdir(), 'coordinator-inherit-'));
  const base = { schema: 'ramify-agent.coordinator/1', projectRoot: root, planId: 'plan', jobId: 'job', generation: 'generation', endpoint: null } as CoordinatorRecord;
  const previous = { ...base, id: 'coord-11111111-1111-1111-1111-111111111111' };
  const current = { ...base, id: 'coord-22222222-2222-2222-2222-222222222222', resumeFrom: previous.id };
  const send = { action: 'send', commandId: 'uncertain-input', message: 'Do not replay accepted input' };
  const response = { action: 'respond', commandId: 'completed-response', requestId: 'old-generation-request', response: { kind: 'approval', choiceId: '1' } };
  try {
    const old = await CoordinatorStore.create(previous);
    // Exact committed admission at a scripted crash window; no outcome exists.
    await writeFile(join(old.directory, 'commands.jsonl'), JSON.stringify({ sequence: 1, at: '2026-10-20T00:00:00Z', event: { commandId: send.commandId, action: send.action, hash: coordinatorHash(send), state: 'reserved' }, records: [] }) + '\n' + JSON.stringify({ sequence: 2, at: '2026-10-20T00:00:01Z', event: { commandId: response.commandId, action: response.action, hash: coordinatorHash(response), state: 'completed', result: { delivered: true, requestId: response.requestId } }, records: [] }) + '\n');
    const store = await CoordinatorStore.create(current);
    expect(await store.inherit(previous.id)).toEqual([{ commandId: send.commandId, action: 'send' }]);
    let calls = 0; const effect = async () => { calls++; return {}; }; const describe = () => ({ kind: 'host', message: 'unexpected' });
    expect(await store.command(send.commandId, send.action, send, effect, describe)).toMatchObject({ state: 'uncertain' });
    expect(await store.command(response.commandId, response.action, response, effect, describe)).toMatchObject({ state: 'completed', result: { delivered: true } });
    await expect(store.command(send.commandId, send.action, { ...send, message: 'changed' }, effect, describe)).rejects.toThrow(/conflicts/);
    expect(calls).toBe(0);
    const next = await CoordinatorStore.create({ ...current, id: 'coord-33333333-3333-3333-3333-333333333333', resumeFrom: current.id });
    expect(await next.inherit(current.id)).toEqual([{ commandId: send.commandId, action: 'send' }]);
    expect(await next.command(send.commandId, send.action, send, effect, describe)).toMatchObject({ state: 'uncertain' }); expect(calls).toBe(0);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('lost guardian evidence refuses launch before constructing any replacement process', async () => {
  const root = await mkdtemp(join(tmpdir(), 'coordinator-lost-proof-'));
  try {
    const options = coordinatorStartSchema.parse({ projectRoot: root, planId: 'plan', commandId: 'never-start', skill: '/not-used-before-settlement' });
    await CoordinatorStore.create({ schema: 'ramify-agent.coordinator/1', id: 'coord-11111111-1111-1111-1111-111111111111', generation: 'generation', projectRoot: root, planId: 'plan', endpoint: null, ownershipReleased: true, guardian: { path: join(root, 'missing-guardian.json'), generation: 'guardian' } } as CoordinatorRecord);
    await expect(launchCoordinator(options, 100)).rejects.toMatchObject({ code: 'ENOENT' });
    // Ordinary process guard verifies that missing evidence caused no launch.
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('an immutable stopped resume admission is observed even after an unrelated latest host, and changed arguments cannot launch', async () => {
  const root = await mkdtemp(join(tmpdir(), 'coordinator-retained-successor-'));
  try {
    const predecessor = 'coord-11111111-1111-1111-1111-111111111111';
    const successor = 'coord-22222222-2222-2222-2222-222222222222';
    const options = coordinatorStartSchema.parse({ projectRoot: root, planId: 'plan', jobId: 'job', commandId: 'resume-once', resumeFrom: predecessor, freshThread: true, skill: '/unused' });
    const record = { schema: 'ramify-agent.coordinator/1', projectRoot: root, planId: 'plan', jobId: 'job', endpoint: null, ownershipReleased: true, phase: 'stopped' } as CoordinatorRecord;
    await CoordinatorStore.create({ ...record, id: predecessor, generation: 'previous' });
    await CoordinatorStore.create({ ...record, id: successor, generation: 'successor', resumeFrom: predecessor, startCommandId: options.commandId, startHash: coordinatorHash(options) });
    const latest = { ...record, id: 'coord-33333333-3333-3333-3333-333333333333', generation: 'unrelated-latest' };
    await CoordinatorStore.create(latest);
    expect(await launchCoordinator(options, 100)).toMatchObject({ stale: true, record: { id: successor, phase: 'stopped' } });
    expect((await readCoordinator(root)).record.id).toBe(latest.id);
    await expect(launchCoordinator({ ...options, freshThread: false }, 100)).rejects.toThrow(/identity conflicts/);
    await expect(launchCoordinator({ ...options, commandId: 'different-resume' }, 100)).rejects.toThrow(/Stale coordinator predecessor/);
    // The ordinary process guard makes any attempted resurrection a failure.
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('a direct host continuation cannot publish a branch from a stale predecessor after acquiring service ownership', async () => {
  const root = await mkdtemp(join(tmpdir(), 'coordinator-stale-host-')); const skill = join(root, 'skill.md');
  let runtimeClosed = false, providerCalls = 0;
  try {
    await writeFile(skill, 'Guidance');
    const previous = { schema: 'ramify-agent.coordinator/1', projectRoot: root, id: 'coord-11111111-1111-1111-1111-111111111111', generation: 'previous', planId: 'plan', jobId: 'job', endpoint: null, ownershipReleased: true, settlement: { confirmed: true }, replaceMcp: [], threadId: null } as unknown as CoordinatorRecord;
    await CoordinatorStore.create(previous);
    const latest = { ...previous, id: 'coord-22222222-2222-2222-2222-222222222222', resumeFrom: previous.id };
    await CoordinatorStore.create(latest);
    await expect(startCoordinatorHost(coordinatorStartSchema.parse({ projectRoot: root, planId: 'plan', jobId: 'job', commandId: 'branch', resumeFrom: previous.id, replaceMcp: ['ramify_host_previous'], skill }), {
      runtime: { close: async () => { runtimeClosed = true; } }, provider: () => { providerCalls++; throw new Error('Unexpected provider'); },
    })).rejects.toThrow(/Stale coordinator predecessor/);
    expect(runtimeClosed).toBe(true); expect(providerCalls).toBe(0);
    expect((await readCoordinator(root)).record.id).toBe(latest.id);
    await expect(readFile(join(root, 'plans', '.harness', 'lock'))).rejects.toMatchObject({ code: 'ENOENT' });
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('a supplied job must be verified before permanent host admission, listener startup or provider construction', async () => {
  const root = await mkdtemp(join(tmpdir(), 'coordinator-unverified-job-')); const skill = join(root, 'skill.md');
  let runtimeClosed = false, listeners = 0, providers = 0;
  try {
    await writeFile(skill, 'Guidance');
    await expect(startCoordinatorHost(coordinatorStartSchema.parse({ projectRoot: root, planId: 'plan', jobId: 'missing-job', commandId: 'unverified', skill }), {
      runtime: { close: async () => { runtimeClosed = true; } },
      listen: async () => { listeners++; throw new Error('Unexpected listener'); },
      provider: () => { providers++; throw new Error('Unexpected provider'); },
    })).rejects.toThrow();
    expect(runtimeClosed).toBe(true); expect(listeners).toBe(0); expect(providers).toBe(0);
    await expect(readCoordinator(root)).rejects.toMatchObject({ code: 'COORDINATOR_NOT_FOUND' });
    await expect(readFile(join(root, 'plans', '.harness', 'lock'))).rejects.toMatchObject({ code: 'ENOENT' });
  } finally { await rm(root, { recursive: true, force: true }); }
});
