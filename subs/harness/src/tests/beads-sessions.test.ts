import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, it } from 'vitest';
import { createSessionOperations } from '../../subs/agent/src/session-operations.js';
import type { SessionOperationDriver } from '../../subs/agent/src/interfaces/session-operations.js';
import type { CommandRunner, CommandRequest } from '../../subs/evidence/src/run-command.js';
import { noMessageDetail } from '../../subs/agent/src/interfaces/port.js';
import { openSessionStore } from '../run/session-store.js';
import { BeadsSessions, type BeadsStageInput } from '../run/beads-sessions.js';
import { BeadsStateStore } from '../run/beads-storage.js';
import { createBeadsTools } from '../run/beads-tools.js';
import { sessionPointReference } from '../run/session-operations.js';

const cleanup: (() => Promise<void>)[] = [];
afterEach(async () => { for (const dispose of cleanup.splice(0).reverse()) await dispose(); });
function deferred() { let release!: () => void; const promise = new Promise<void>(resolve => { release = resolve; }); return { promise, release }; }
function scripted(steps: readonly { args: readonly string[]; result: unknown; failure?: boolean }[]) {
  const calls: CommandRequest[] = []; let index = 0;
  const runner: CommandRunner = async request => {
    calls.push(request);
    const answer = steps[index++];
    expect(answer, 'unexpected tracker command').toBeDefined();
    expect(request.argv).toEqual(['bd', '--sandbox', ...answer!.args, '--json']);
    return { outcome: { kind: 'completed', exitCode: answer!.failure ? 1 : 0 }, startedAt: '2026-10-13T00:00:00Z', elapsedMs: 0,
      stdout: JSON.stringify(answer!.result), stderr: answer!.failure ? 'scripted delivery failure' : '',
      output: { path: null, bytes: 0, truncated: false, tail: '' } };
  };
  return { runner, calls, done() { expect(index).toBe(steps.length); } };
}
async function fixture(driver: SessionOperationDriver, runner?: CommandRunner) {
  const root = await mkdtemp(join(tmpdir(), 'beads-admin-')); cleanup.push(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, '.beads'));
  await writeFile(join(root, '.beads', 'metadata.json'), JSON.stringify({ backend: 'dolt', database: 'dolt' }));
  const store = await openSessionStore({ directory: join(root, 'session-store') }); cleanup.push(() => store.close());
  const operations = createSessionOperations({ sessionStore: store, driver });
  const policy = { context: { compaction: 'forbidden' as const, budgetTokens: null, budgetFraction: null, reportReserveTokens: 1000 }, authority: {}, validator: {}, destination: {} };
  const source = await operations.create({ runId: 'run-1', operationId: 'main-create', initialInstructions: 'Engineer instructions: implement using shell and write.',
    declarations: ['shell', 'write', 'submit_engineer'].map(name => ({ name, description: name, inputSchema: {}, mutating: true })), activate: ['shell', 'write', 'submit_engineer'], policy });
  const options = { projectRoot: root, operations: async () => operations, commandExecution: runner };
  const manager = await BeadsSessions.open(options); cleanup.push(async () => { expect(await manager.close()).toBe(true); });
  const input: BeadsStageInput = { runId: 'run-1', sourceRef: sessionPointReference('run-1', source.point!), context: 'Mentioned issue proj-1 resolved parser acceptance. Mentioned proj-2 still lacks timeout evidence. Mentioned proj-other is unrelated.', workspace: root };
  return { root, manager, input, options, operations };
}
async function retained(f: Awaited<ReturnType<typeof fixture>>) {
  expect(await f.manager.close()).toBe(true);
  const reader = await BeadsSessions.open(f.options); cleanup.push(async () => { expect(await reader.close()).toBe(true); });
  return (await reader.inspect('run-1'))!;
}

it('durably queues without waiting, disables inherited tools, and closes only the issue actually resolved', async () => {
  const entered = deferred(); const release = deferred(); const dispatched: string[] = [];
  const markerStart = '[ramify-agent:run-1:start:proj-1] parser implementation entered';
  const markerFinish = '[ramify-agent:run-1:finish:proj-1] parser fixed at candidate abc; targeted validation passed';
  const commands = scripted([
    { args: ['show', 'proj-1'], result: [{ id: 'proj-1', status: 'open', title: 'Parser bug' }] },
    { args: ['show', 'proj-1'], result: [{ id: 'proj-1', status: 'open', title: 'Parser bug' }] },
    { args: ['update', 'proj-1', '--status', 'in_progress', '--if-status', 'open', '--append-notes', markerStart], result: {} },
    { args: ['show', 'proj-1'], result: [{ id: 'proj-1', status: 'in_progress', notes: markerStart }] },
    { args: ['show', 'proj-2'], result: [{ id: 'proj-2', status: 'in_progress', title: 'Timeout evidence' }] },
    { args: ['show', 'proj-2'], result: [{ id: 'proj-2', status: 'in_progress', title: 'Timeout evidence' }] },
    { args: ['show', 'proj-1'], result: [{ id: 'proj-1', status: 'in_progress', notes: markerStart }] },
    { args: ['close', 'proj-1', '--reason', markerFinish], result: {} },
    { args: ['show', 'proj-1'], result: [{ id: 'proj-1', status: 'closed', close_reason: markerFinish }] },
  ]);
  const f = await fixture({ async dispatch(invocation, runtime) {
    dispatched.push(invocation.key.operationId);
    expect(invocation.session.activeTools).not.toContain('shell'); expect(invocation.session.activeTools).not.toContain('write');
    expect(invocation.session.activeTools).not.toContain('submit_engineer');
    expect((await runtime.callTool('inactive-shell', 'shell', {})).isError).toBe(true);
    expect(invocation.session.additions.at(-1)?.text).toContain('green checks or issue mention alone does not prove an issue resolved');
    runtime.onEvent({ type: 'message', role: 'assistant', blocks: [{ type: 'text', text: 'issue judgment' }], text: 'issue judgment',
      usage: { input: 10, output: 5, cacheRead: 2, cacheWrite: 0, total: 15 }, detail: noMessageDetail });
    let input: unknown;
    if (invocation.key.operationId === 'beads:start:turn') {
      entered.release(); await release.promise;
      for (const id of ['proj-1', 'proj-2']) {
        expect((await runtime.callTool(`show-${id}`, 'beads_show', { id })).isError).not.toBe(true);
        expect((await runtime.callTool(`bind-${id}`, 'beads_bind', { id, mention: `Plan mentions ${id}`, relevance: 'Its acceptance criterion is part of the captured implementation' })).isError).not.toBe(true);
        expect((await runtime.callTool(`start-${id}`, 'beads_update', { id, reason: id === 'proj-1' ? 'parser implementation entered' : 'timeout implementation entered' })).isError).not.toBe(true);
      }
      input = { summary: 'Bound only relevant existing mentioned issues', decisions: ['proj-1', 'proj-2'].map(id => ({ id, action: 'in_progress', evidence: 'implementation entered' })) };
    } else {
      expect(invocation.task.message).toContain('proj-2');
      expect(invocation.session.activeTools).not.toContain('beads_bind');
      expect((await runtime.callTool('close-parser', 'beads_update', { id: 'proj-1', reason: 'parser fixed at candidate abc; targeted validation passed' })).isError).not.toBe(true);
      input = { summary: 'Parser resolved; timeout evidence remains missing despite plan success', decisions: [
        { id: 'proj-1', action: 'closed', evidence: 'Parser acceptance verified at abc' }, { id: 'proj-2', action: 'unchanged', evidence: 'No timeout validation evidence exists' },
      ] };
    }
    expect((await runtime.submit(`submit-${invocation.key.operationId}`, input)).accepted).toBe(true);
    return { kind: 'submitted', input };
  } }, commands.runner);
  await f.manager.scheduleStart(f.input); await entered.promise;
  await f.manager.scheduleFinish({ ...f.input, outcome: 'job-completed' });
  expect((await f.manager.inspect('run-1'))?.finish?.status).toBe('pending');
  release.release(); const state = await retained(f);
  expect(dispatched).toEqual(['beads:start:turn', 'beads:finish:turn']);
  expect(state.start?.status).toBe('completed'); expect(state.finish?.status).toBe('completed');
  expect(state.bindings.map(binding => binding.id)).toEqual(['proj-1', 'proj-2']);
  expect(state.mutations.filter(mutation => mutation.status === 'closed').map(mutation => mutation.id)).toEqual(['proj-1']);
  expect(state.finish?.observations).toContainEqual(expect.objectContaining({ type: 'message', usage: expect.objectContaining({ total: 15 }) }));
  for (const call of commands.calls) { expect(call.cwd).toBe(f.root); expect(call.env['BEADS_DIR']).toBe(join(f.root, '.beads')); expect(call.timeoutMs).toBe(15_000); }
  commands.done();
});

it('retains missing inherited context as pending and orders finish behind start without fresh fallback', async () => {
  let dispatches = 0;
  const f = await fixture({ async dispatch() { dispatches++; throw new Error('must not dispatch'); } }, async () => { throw new Error('must not run tracker'); });
  await f.manager.scheduleStart({ ...f.input, sourceRef: null });
  await f.manager.scheduleFinish({ ...f.input, outcome: 'job-failed' });
  const state = await retained(f);
  expect(dispatches).toBe(0); expect(state.start).toMatchObject({ status: 'pending', reason: expect.stringContaining('Inherited source context') });
  expect(state.finish).toMatchObject({ status: 'pending', reason: expect.stringContaining('Awaiting confirmed start') });
});

it('keeps tracker command failure pending and never redelivers a failed terminal model operation on recovery', async () => {
  const commands = scripted([{ args: ['show', 'proj-1'], result: {}, failure: true }]); let dispatches = 0;
  const f = await fixture({ async dispatch(_invocation, runtime) {
    dispatches++; const result = await runtime.callTool('failed-show', 'beads_show', { id: 'proj-1' });
    expect(result.isError).toBe(true); return { kind: 'failed', error: 'Tracker unavailable' };
  } }, commands.runner);
  await f.manager.scheduleStart(f.input); await f.manager.scheduleFinish({ ...f.input, outcome: 'job-completed' });
  const state = await retained(f); expect(state.start?.status).toBe('pending'); expect(state.finish?.status).toBe('pending');
  const manager = await BeadsSessions.open(f.options); cleanup.push(async () => { expect(await manager.close()).toBe(true); });
  await manager.recover('run-1'); expect(await manager.close()).toBe(true);
  expect(dispatches).toBe(1); commands.done();
});

it('reconciles uncertain updates from stable evidence readback without resending the mutation', async () => {
  const f = await fixture({ async dispatch() { throw new Error('unused'); } });
  const store = await BeadsStateStore.open(join(f.root, 'admin-tools')); cleanup.push(() => store.close());
  await store.update('run-1', state => ({ ...state, bindings: [{ id: 'proj-1', mention: 'Plan names proj-1', relevance: 'Parser requirement', issue: { id: 'proj-1', status: 'open' } }],
    mutations: [{ id: 'proj-1', status: 'in_progress', reason: 'parser implementation entered', phase: 'intent' }] }));
  const commands = scripted([
    { args: ['show', 'proj-1'], result: [{ id: 'proj-1', status: 'in_progress', notes: 'Changed independently' }] },
    { args: ['show', 'proj-1'], result: [{ id: 'proj-1', status: 'in_progress', notes: '[ramify-agent:run-1:start:proj-1] parser implementation entered' }] },
  ]);
  const tools = await createBeadsTools({ stage: 'start', request: f.input, store, runner: commands.runner, timeoutMs: 1000 });
  const effect = { callId: 'uncertain-update', tool: 'beads_update', input: { id: 'proj-1', reason: 'parser implementation entered' }, phase: 'intent' as const, result: null, verdict: null };
  expect(await tools.recoverEffect(effect)).toBeNull(); expect((await store.read('run-1'))?.mutations[0]?.phase).toBe('intent');
  expect(await tools.recoverEffect(effect)).toMatchObject({ text: expect.stringContaining('Recovered readback') });
  expect((await store.read('run-1'))?.mutations[0]).toMatchObject({ phase: 'confirmed', delivery: 'verified' }); commands.done();
});

it('refuses redirected trackers before issuing any command', async () => {
  const f = await fixture({ async dispatch() { throw new Error('unused'); } });
  await writeFile(join(f.root, '.beads', 'redirect'), '/different/tracker/.beads');
  await f.manager.scheduleStart(f.input);
  const state = await retained(f); expect(state.start).toMatchObject({ status: 'pending', reason: expect.stringContaining('redirect') });
});

it('records interrupted administration pending and drains its operation before releasing stores', async () => {
  const entered = deferred(); let stopped = false;
  const f = await fixture({ async dispatch(_invocation, runtime) {
    entered.release(); await new Promise<void>(resolve => runtime.signal.addEventListener('abort', () => { stopped = true; resolve(); }, { once: true }));
    return { kind: 'failed', error: 'interrupted' };
  } });
  await f.manager.scheduleStart(f.input); await entered.promise;
  expect(f.manager.settlementConfirmed('run-1')).toBe(false);
  expect(await f.manager.close({ timeoutMs: 0, settleMs: 2000 })).toBe(true); expect(stopped).toBe(true);
  expect(f.manager.settlementConfirmed('run-1')).toBe(true);
  const reader = await BeadsSessions.open(f.options); cleanup.push(async () => { expect(await reader.close()).toBe(true); });
  expect((await reader.inspect('run-1'))?.start?.status).toBe('pending');
});

it('pins the tracker destination across start and finish', async () => {
  const f = await fixture({ async dispatch() { throw new Error('unused'); } });
  await f.manager.scheduleStart({ ...f.input, sourceRef: null });
  await expect(f.manager.scheduleFinish({ ...f.input, workspace: join(f.root, 'different-tracker') })).rejects.toThrow('destination conflicts');
  const state = await retained(f); expect(state.finish).toBeNull();
});

it('reconciles a durable terminal administrative receipt even when inherited source context is subsequently lost', async () => {
  let dispatches = 0;
  const f = await fixture({ async dispatch(_invocation, runtime) {
    dispatches++; const input = { summary: 'No relevant existing mentioned issues', decisions: [] };
    expect((await runtime.submit('empty-binding-submission', input)).accepted).toBe(true);
    return { kind: 'submitted', input };
  } });
  await f.manager.scheduleStart(f.input); expect(await f.manager.close()).toBe(true);
  const admin = await BeadsStateStore.open(join(f.root, 'plans', '.harness', 'beads-administration'));
  // Crash window: session receipt is durable but the stage completion publication was lost.
  await admin.update('run-1', state => ({ ...state, start: { ...state.start!, status: 'pending', receipt: null, reason: 'Interrupted publication' } }));
  await admin.close();
  let sourceInspections = 0;
  const recovered = await BeadsSessions.open({ ...f.options, operations: async () => ({ ...f.operations, async inspect() {
    sourceInspections++; throw new Error('Original source is unavailable');
  } }) });
  cleanup.push(async () => { expect(await recovered.close()).toBe(true); });
  await recovered.recover('run-1'); expect(await recovered.close()).toBe(true);
  const reader = await BeadsSessions.open(f.options); cleanup.push(async () => { expect(await reader.close()).toBe(true); });
  expect((await reader.inspect('run-1'))?.start?.status).toBe('completed'); expect(sourceInspections).toBe(0); expect(dispatches).toBe(1);
});

it('does not report closed while an interrupted provider still owns its settlement barrier', async () => {
  const entered = deferred(); const release = deferred();
  const f = await fixture({ async dispatch() {
    entered.release(); await release.promise; return { kind: 'failed', error: 'Provider drained after stop' };
  } });
  await f.manager.scheduleStart(f.input); await entered.promise;
  expect(await f.manager.close({ timeoutMs: 0, settleMs: 0 })).toBe(false);
  expect(f.manager.settlementConfirmed('run-1')).toBe(false);
  expect(await f.manager.close({ timeoutMs: 0, settleMs: 0 })).toBe(false);
  release.release(); expect(await f.manager.close({ timeoutMs: 2000, settleMs: 2000 })).toBe(true);
});
