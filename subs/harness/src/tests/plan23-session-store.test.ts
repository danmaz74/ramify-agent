import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.unmock('../../subs/session-store/src/session-store.js');
import { openSessionStore, type LedgerSessionStore } from '../../subs/session-store/src/session-store.js';
import { HarnessSessionOperations, type HarnessOperationInput } from '../prompts/session-adapter.js';
import { readSessionPointReference } from '../../subs/task-execution/src/session-operations.js';
import { createSessionOperations } from '../../subs/agent/src/session-operations.js';
import { createScriptedAgent, createScriptedSessionDriver } from '../../subs/agent/src/scripted.js';
import type { ContinueSessionInput, SessionDriverInvocation, SessionExecutionBindings, SessionExecutionPolicy, SessionOperationDriver, SessionStore, SessionStoreCommit, SessionStoreRecord, SessionTaskInput } from '../../subs/agent/src/interfaces/session-operations.js';
import type { LoadedPackage } from '../prompts/packages.js';

const stores: LedgerSessionStore[] = []; const directories: string[] = [];
afterEach(async () => { for (const store of stores.splice(0)) await store.close(); for (const directory of directories.splice(0)) await rm(directory, { recursive: true, force: true }); });
async function setup(directory?: string) {
  const path = directory ?? await mkdtemp(join(tmpdir(), 'plan23-store-')); if (!directory) directories.push(path);
  const store = await openSessionStore({ directory: path }); stores.push(store); return { path, store };
}
const policy: SessionExecutionPolicy = { context: { compaction: 'forbidden', budgetTokens: null, budgetFraction: null, reportReserveTokens: 0 }, authority: { write: true }, validator: { schema: 'v1' }, destination: { record: 'd1' } };
const declaration = { name: 'submit_orientation', description: 'Orientation', inputSchema: { type: 'object' }, mutating: false } as const;
const read = { name: 'read', description: 'Read', inputSchema: { type: 'object' }, mutating: false } as const;
const task: SessionTaskInput = { role: 'architect', message: 'Orient A', submissionTool: 'submit_orientation', environment: { workingDirectory: '/A', candidate: 'C0', snapshot: 'S0', limits: { max: 10 } }, policyIdentity: 'policy-1', validatorIdentity: 'validator-1', destinationIdentity: 'destination-1' };
const create = { runId: 'A', operationId: 'create', initialInstructions: 'Role A\nGeneral task protocol.', declarations: [declaration, read], activate: ['submit_orientation', 'read'], policy };
function bound(overrides: Partial<SessionExecutionBindings> = {}): SessionExecutionBindings {
  return { task, policy, tools: [{ ...read, execute: async () => ({ text: 'read A' }) }], submission: { name: 'submit_orientation', accept: async () => ({ accepted: true }) }, currentAuthority: async () => true, onEvent: () => {}, publish: async () => {}, ...overrides };
}
function input(sessionId: string, expectedPoint: ContinueSessionInput['expectedPoint'], bindings = bound()): ContinueSessionInput { return { runId: 'A', operationId: 'orient', sessionId, expectedPoint, task, policy, additions: [], toolChange: { add: [], activate: [], inactivate: [] }, bindings }; }
function deferred() { let resolve!: () => void; const promise = new Promise<void>(done => { resolve = done; }); return { promise, resolve }; }
function interrupted(store: SessionStore, predicate: (commit: SessionStoreCommit) => boolean, when: 'before' | 'after'): SessionStore {
  let failed = false;
  return { read: (runId, id) => store.read(runId, id), putPayload: bytes => store.putPayload(bytes), getPayload: id => store.getPayload(id), async commit(commit) {
    if (failed) throw new Error('simulated process lost');
    if (!predicate(commit)) return store.commit(commit);
    failed = true;
    if (when === 'after') await store.commit(commit);
    throw new Error('simulated process lost');
  } };
}
const opBody = (commit: SessionStoreCommit) => commit.records.find(item => item.schema === 'ramify-agent.session-operation/1')?.body;
/** One harness operation of the module engineer role, fresh or continuing the session holding `ref`. */
function harnessInput(operationId: string, ref?: string): HarnessOperationInput {
  const name = 'submit_iteration_result';
  const loaded: LoadedPackage = { role: 'engineer', package: 'engineer/fixture', hash: '1'.repeat(64), files: [], submissionKinds: [], system: 'Stable engineer role.', procedure: 'Perform the current task with {{submissionTool}}.', skill: '', extraSkill: '', skillDirectory: '/skills', submissionSchema: '{}' };
  return { runId: 'A', operationId, session: `harness-${operationId}`, loaded,
    spec: { role: 'engineer', scope: { workingDirectory: '/project/module' }, systemPrompt: 'unused', prompt: 'unused', session: ref ? { mode: 'continue', ref } : { mode: 'fresh' }, context: policy.context, builtinTools: [], tools: [],
      submission: { name, description: 'Owner submission', inputSchema: {}, accept: async () => ({ accepted: true }) }, onEvent: () => {} },
    brief: { kind: 'engineering', objective: 'Implement A', goal: 'Preserve A', requirements: ['R1: preserve the result'], sections: [],
      environment: { projectRoot: '/project', workingDirectory: '/project/module', candidate: null, snapshot: null, limits: { stopSettleMs: 1000 }, availableTools: [name], views: [], supportPaths: [], cucumberConfiguration: null } },
    authority: { write: true }, validator: { revision: 1 }, destination: { record: operationId }, currentAuthority: async () => true };
}

describe('Plan 23 ledger session store', () => {
  it('waits only for consequential pending effects including unresolved submissions', async () => {
    const { path } = await setup();
    const adapter = await HarnessSessionOperations.open(path, createScriptedAgent([]));
    const store = (await setup(join(path, 'store'))).store;
    const pending = (callId: string, tool: string, consequential?: boolean) => ({ callId, tool, input: {}, phase: 'intent', result: null, verdict: null, ...(consequential === undefined ? {} : { consequential }) });
    await store.commit({ runId: 'A', expected: [{ id: 'operation:pending', revision: null }], payloads: [], records: [{
      runId: 'A', id: 'operation:pending', revision: 1, schema: 'ramify-agent.session-operation/1', body: { effects: [
        pending('old-read', 'read'), pending('old-edit', 'edit'), pending('check', 'afterMutation:write'),
        pending('inspectable', 'custom-source-write', false), pending('command', 'run-command', true),
        pending('submit', 'submit_iteration_result', true),
        { ...pending('old-focused-check', 'shell'), input: { command: 'node_modules/.bin/vitest run a.test.ts' } },
        { ...pending('old-external-command', 'shell'), input: { command: 'npm publish' } },
      ] },
    }] });
    expect(await adapter.unresolvedEffects('A', 'pending')).toEqual(['command', 'submit', 'old-external-command']);
    await adapter.close();
  });

  it('treats a corrupt optional session snapshot as unavailable while fresh tasks remain executable', async () => {
    const { path, store } = await setup();
    const operations = createSessionOperations({ sessionStore: store, driver: createScriptedSessionDriver([]) });
    const prior = await operations.create(create);
    const entries = (await readFile(join(path, 'session-ledger.jsonl'), 'utf8')).trim().split('\n').map(line => JSON.parse(line) as { event: { records: { id: string; bodyId: string }[] } });
    const header = entries.flatMap(entry => entry.event.records).find(record => record.id === `session:${prior.sessionId}`)!;
    await writeFile(join(path, 'record-bodies', `${header.bodyId}.json`), 'corrupt optional session snapshot');
    expect(await operations.inspect('A', prior.sessionId, prior.point!)).toBeNull();
    expect(await operations.fork({ runId: 'A', operationId: 'exact-unavailable', sourcePoint: prior.point! })).toMatchObject({ status: 'unavailable', contextUnavailable: true });
    expect(await operations.create({ ...create, operationId: 'new-readable-task' })).toMatchObject({ status: 'completed' });
    expect(await store.read('A', 'operation:create')).not.toBeNull();
  });

  it('S01/S02 reopens actual session transcript with fresh store/agent and preserves exact forks', async () => {
    const { path, store } = await setup();
    let dispatches = 0;
    const driver: SessionOperationDriver = { async dispatch(input, runtime) { dispatches++; return createScriptedSessionDriver([{ kind: 'message', payload: { reasoning: { opaque: 'keep exact bytes' } } }, { kind: 'submit', input: { orientation: 'A' } }]).dispatch(input, runtime); } };
    let operations = createSessionOperations({ sessionStore: store, driver }); const P = await operations.create(create);
    const T1 = await (await operations.continue(input(P.sessionId, P.point!))).receipt;
    const C1 = await operations.appendContext({ runId: 'A', operationId: 'brief-b', sessionId: P.sessionId, expectedPoint: T1.point!, additions: [{ key: 'brief-b', kind: 'brief', text: 'B', revision: 'r1' }] });
    const originalTranscript = (await operations.inspect('A', P.sessionId))!.transcript;
    const bytes = await Promise.all(originalTranscript.map(item => store.getPayload(item.payloadId)));
    await store.close(); const reopened = (await setup(path)).store;
    operations = createSessionOperations({ sessionStore: reopened, driver });
    expect(await operations.create(create)).toEqual(P);
    expect(await (await operations.continue(input(P.sessionId, P.point!))).receipt).toEqual(T1); expect(dispatches).toBe(1);
    expect((await operations.inspect('A', P.sessionId))!.transcript).toEqual(originalTranscript);
    expect(await Promise.all(originalTranscript.map(item => reopened.getPayload(item.payloadId)))).toEqual(bytes);
    const L = await operations.fork({ runId: 'A', operationId: 'fork-L', sourcePoint: T1.point! });
    const R = await operations.fork({ runId: 'A', operationId: 'fork-R', sourcePoint: C1.point! });
    expect((await operations.inspect('A', L.sessionId))?.additions).toEqual([]); expect((await operations.inspect('A', R.sessionId))?.additions.map(item => item.text)).toEqual(['B']);
    expect((await (await operations.continue({ ...input(L.sessionId, L.point!), operationId: 'L2' })).receipt).turn).toBe(2);
    expect((await (await operations.continue({ ...input(R.sessionId, R.point!), operationId: 'R2' })).receipt).turn).toBe(2);
  });
  it.each(['before-intent', 'after-intent', 'after-dispatch', 'after-result', 'after-acceptance', 'after-outcome'] as const)('S03 restores original inputs at %s with fresh handlers and no duplicate accepted result', async boundary => {
    const { path, store } = await setup(); let effects = 0; let accepts = 0; let publishes = 0; let dispatches = 0;
    const recordedTasks: SessionTaskInput[] = [];
    const script = createScriptedSessionDriver([{ kind: 'tool', tool: 'read', input: { path: 'a.ts' }, callId: 'read-a' }, { kind: 'submit', input: { orientation: 'A' }, callId: 'submit-a' }]);
    const driver: SessionOperationDriver = { async dispatch(input, runtime) { dispatches++; recordedTasks.push(input.task); return script.dispatch(input, runtime); } };
    const originalBindings = bound({ tools: [{ ...read, execute: async () => { effects++; return { text: 'read A' }; } }], submission: { name: 'submit_orientation', accept: async () => { accepts++; return { accepted: true }; } }, publish: async () => { publishes++; } });
    const P = await createSessionOperations({ sessionStore: store, driver }).create(create);
    const predicate = (commit: SessionStoreCommit) => {
      const body = opBody(commit); if (!body) return false;
      if (boundary === 'before-intent' || boundary === 'after-intent') return body['phase'] === 'intent' && body['owner'] === null;
      if (boundary === 'after-dispatch') return body['phase'] === 'dispatched' && Array.isArray(body['provider']) && body['provider'].length === 0;
      if (boundary === 'after-result') return Array.isArray(body['effects']) && body['effects'].some((item: { phase: string; tool: string }) => item.phase === 'completed' && item.tool === 'read');
      if (boundary === 'after-acceptance') return Array.isArray(body['effects']) && body['effects'].some((item: { phase: string; tool: string }) => item.phase === 'completed' && item.tool === 'submit_orientation');
      return body['phase'] === 'terminal';
    };
    const crashStore = interrupted(store, predicate, boundary === 'before-intent' ? 'before' : 'after');
    const broken = createSessionOperations({ sessionStore: crashStore, driver });
    let handle;
    try { handle = await broken.continue(input(P.sessionId, P.point!, originalBindings)); } catch (error) { expect(String(error)).toMatch(/process lost/); }
    if (handle) {
      if (boundary === 'after-outcome') expect((await handle.receipt).status).toBe('completed');
      else await expect(handle.receipt).rejects.toThrow(/process lost/);
    }
    const reopened = (await setup(path)).store;
    const recovered = createSessionOperations({ sessionStore: reopened, driver });
    const freshBindings = bound({ tools: [{ ...read, execute: async () => { effects++; return { text: 'read A' }; } }], submission: { name: 'submit_orientation', accept: async () => { accepts++; return { accepted: true }; } }, publish: async () => { publishes++; } });
    if (boundary === 'before-intent') {
      expect((await (await recovered.retry({ runId: 'A', operationId: 'orient', bindings: freshBindings })).receipt).status).toBe('unavailable');
      expect((await (await recovered.continue(input(P.sessionId, P.point!, freshBindings))).receipt).turn).toBe(1);
    } else {
      if (boundary !== 'after-outcome') {
        const changed = bound({ task: { ...task, environment: { ...task.environment, workingDirectory: '/changed' } } });
        expect((await (await recovered.retry({ runId: 'A', operationId: 'orient', bindings: changed })).receipt).status).toBe('conflict');
        const widened = bound({ policy: { ...policy, authority: { write: 'wider' } } });
        expect((await (await recovered.retry({ runId: 'A', operationId: 'orient', bindings: widened })).receipt).status).toBe('conflict');
      }
      const result = await (await recovered.retry({ runId: 'A', operationId: 'orient', bindings: freshBindings })).receipt;
      expect(result.status).toBe('completed'); expect(result.turn).toBe(1); expect(result.outcome).toEqual({ kind: 'submitted', input: { orientation: 'A' } });
      expect(await (await recovered.continue(input(P.sessionId, P.point!, freshBindings))).receipt).toEqual(result);
    }
    expect(effects).toBe(1); expect(accepts).toBe(1); expect(recordedTasks.every(recorded => JSON.stringify(recorded) === JSON.stringify(task))).toBe(true);
    expect(publishes).toBe(boundary === 'after-outcome' ? 0 : 1);
    expect(dispatches).toBeLessThanOrEqual(2);
  });
  it('S06 leaves an unknown effect unavailable and never blindly replays it after actual-file restart', async () => {
    const { path, store } = await setup(); let effects = 0;
    const driver = createScriptedSessionDriver([{ kind: 'tool', tool: 'read', input: {}, callId: 'external' }, { kind: 'submit', input: { orientation: 'A' } }]);
    const P = await createSessionOperations({ sessionStore: store, driver }).create(create);
    const crashStore = interrupted(store, commit => { const body = opBody(commit); return Array.isArray(body?.['effects']) && body['effects'].some((item: { phase: string }) => item.phase === 'completed'); }, 'before');
    const failed = createSessionOperations({ sessionStore: crashStore, driver });
    const bindings = bound({ tools: [{ ...read, execute: async () => { effects++; return { text: 'external completion not recorded' }; } }] });
    await expect((await failed.continue(input(P.sessionId, P.point!, bindings))).receipt).rejects.toThrow(/process lost/);
    const reopened = (await setup(path)).store;
    const recovered = createSessionOperations({ sessionStore: reopened, driver });
    const result = await (await recovered.retry({ runId: 'A', operationId: 'orient', bindings })).receipt;
    expect(result.status).toBe('unavailable'); expect(result.point).toBeNull(); expect(effects).toBe(1); expect(await recovered.inspect('A', P.sessionId)).toBeNull();
    expect(await (await recovered.retry({ runId: 'A', operationId: 'orient', bindings })).receipt).toEqual(result);
  });
  it('retains a known mutation and reruns ordinary diagnostics without a separate check journal', async () => {
    const { path, store } = await setup(); let mutations = 0; let hooks = 0;
    const write = { name: 'write', description: 'Write', inputSchema: { type: 'object' }, mutating: true } as const;
    const driver = createScriptedSessionDriver([{ kind: 'tool', tool: 'write', input: {}, callId: 'write-a' }, { kind: 'submit', input: { orientation: 'A' } }]);
    const P = await createSessionOperations({ sessionStore: store, driver }).create({ ...create, declarations: [...create.declarations, write], activate: [...create.activate, 'write'] });
    const bindings = bound({ tools: [{ ...write, execute: async () => { mutations++; return { text: 'written' }; } }], afterMutation: async () => { hooks++; return { text: 'checked' }; } });
    const crashStore = interrupted(store, commit => {
      const body = opBody(commit);
      return Array.isArray(body?.['effects']) && body['effects'].some((item: { phase: string; tool: string }) => item.phase === 'completed' && item.tool === 'write');
    }, 'after');
    await expect((await createSessionOperations({ sessionStore: crashStore, driver }).continue(input(P.sessionId, P.point!, bindings))).receipt).rejects.toThrow(/process lost/);
    const reopened = (await setup(path)).store;
    const result = await (await createSessionOperations({ sessionStore: reopened, driver }).retry({ runId: 'A', operationId: 'orient', bindings })).receipt;
    expect(result.status).toBe('completed'); expect(mutations).toBe(1); expect(hooks).toBe(1);
    const operation = await reopened.read('A', 'operation:orient');
    expect((operation?.body['effects'] as { tool: string }[]).some(effect => effect.tool.startsWith('afterMutation:'))).toBe(false);
  });
  it('S06 current authority denial during recovery prevents every dispatch and effect', async () => {
    const { path, store } = await setup(); let dispatches = 0;
    const driver: SessionOperationDriver = { async dispatch() { dispatches++; return { kind: 'ended' }; } };
    const P = await createSessionOperations({ sessionStore: store, driver }).create(create);
    const crashStore = interrupted(store, commit => opBody(commit)?.['phase'] === 'intent', 'after');
    await expect(createSessionOperations({ sessionStore: crashStore, driver }).continue(input(P.sessionId, P.point!))).rejects.toThrow(/process lost/);
    const reopened = (await setup(path)).store;
    const recovered = createSessionOperations({ sessionStore: reopened, driver });
    const result = await (await recovered.retry({ runId: 'A', operationId: 'orient', bindings: bound({ currentAuthority: async () => false }) })).receipt;
    expect(result.status).toBe('failed'); expect(result.reason).toMatch(/authority denied/); expect(dispatches).toBe(0);
  });
  it('S06 independently resolved effect recovery does not replay a handler', async () => {
    const { path, store } = await setup(); let effects = 0; let recoveries = 0;
    const driver = createScriptedSessionDriver([{ kind: 'tool', tool: 'read', input: {}, callId: 'recoverable' }, { kind: 'submit', input: { orientation: 'A' } }]);
    const P = await createSessionOperations({ sessionStore: store, driver }).create(create);
    const crashStore = interrupted(store, commit => { const body = opBody(commit); return Array.isArray(body?.['effects']) && body['effects'].some((item: { phase: string }) => item.phase === 'completed'); }, 'before');
    const bindings = bound({ tools: [{ ...read, execute: async () => { effects++; return { text: 'independently recoverable result' }; } }] });
    await expect((await createSessionOperations({ sessionStore: crashStore, driver }).continue(input(P.sessionId, P.point!, bindings))).receipt).rejects.toThrow(/process lost/);
    const reopened = (await setup(path)).store;
    const recovered = createSessionOperations({ sessionStore: reopened, driver });
    const result = await (await recovered.retry({ runId: 'A', operationId: 'orient', bindings: { ...bindings, recoverEffect: async effect => { expect(effect.callId).toBe('recoverable'); recoveries++; return { text: 'independently recoverable result' }; } } })).receipt;
    expect(result.status).toBe('completed'); expect(result.turn).toBe(1); expect(effects).toBe(1); expect(recoveries).toBe(1);
  });
  it('S05 final provider liveness check rejects dispatch after a reconstructed agent Stops', async () => {
    const { path, store } = await setup(); const entered = deferred(); const transformed = deferred(); let actualDispatches = 0; let lateEvents = 0;
    const driver: SessionOperationDriver = { async dispatch(_, runtime) {
      entered.resolve(); await transformed.promise;
      await runtime.assertLive(); actualDispatches++;
      runtime.onEvent({ type: 'tool-started', callId: 'late', tool: 'read', input: {}, action: { kind: 'harness' }, mutating: false });
      return { kind: 'ended' };
    } };
    const first = createSessionOperations({ sessionStore: store, driver }); const P = await first.create(create);
    const handle = await first.continue(input(P.sessionId, P.point!, bound({ onEvent: () => { lateEvents++; } }))); await entered.promise;
    const second = createSessionOperations({ sessionStore: (await setup(path)).store, driver });
    const stopping = second.stop({ runId: 'A', operationId: 'orient', sessionId: P.sessionId });
    const idle = handle.settled(); let stopEnded = false; let idleEnded = false;
    void stopping.then(() => { stopEnded = true; }); void idle.then(() => { idleEnded = true; });
    const stopped = await handle.receipt;
    expect(stopped.point).toBeNull(); expect(stopEnded).toBe(false); expect(idleEnded).toBe(false);
    transformed.resolve();
    expect(await stopping).toEqual(stopped); expect(await idle).toEqual(stopped);
    expect(stopped.status).toBe('stopped'); expect(await handle.receipt).toEqual(stopped); expect(actualDispatches).toBe(0); expect(lateEvents).toBe(0);
  });
  it('two appends against one recorded point both commit, the session is never lost, and the second checkpoint follows the first', async () => {
    const root = await mkdtemp(join(tmpdir(), 'plan23-append-')); directories.push(root);
    const seen: SessionDriverInvocation[] = []; const entered = deferred(); const gate = deferred();
    const agent = createScriptedAgent([], { operationScript: invocation => {
      seen.push(invocation);
      return invocation.key.operationId === 'active' ? [{ kind: 'await', until: () => { entered.resolve(); return gate.promise; } }, { kind: 'submit', input: {} }] : [{ kind: 'submit', input: {} }];
    } });
    const adapter = await HarnessSessionOperations.open(root, agent);
    try {
      const first = await adapter.start(harnessInput('orient')); expect((await first.outcome).kind).toBe('submitted'); expect(await first.settled()).toBe('settled');
      const T1 = readSessionPointReference(first.ref)!.point;
      // Both packages name the orientation point the run recorded once; the second finds it stale.
      const one = await adapter.append(first.ref, 'package:1', 'PACKAGE ONE');
      const two = await adapter.append(first.ref, 'package:2', 'PACKAGE TWO');
      expect(one.outcome).toBe('appended'); expect(two.outcome).toBe('appended');
      if (one.outcome !== 'appended' || two.outcome !== 'appended') throw new Error('Expected both appends to land');
      const C1 = readSessionPointReference(one.ref)!.point; const C2 = readSessionPointReference(two.ref)!.point;
      expect(C1).toMatchObject({ sessionId: T1.sessionId, turn: T1.turn, kind: 'checkpoint' }); expect(C2).toMatchObject({ sessionId: T1.sessionId, turn: T1.turn, kind: 'checkpoint' });
      expect(C2.checkpoint).not.toBe(C1.checkpoint);
      const session = await adapter.operations.inspect('A', T1.sessionId);
      expect(session).toMatchObject({ available: true, activeOperation: null, currentPoint: C2 });
      expect(session!.additions.map(item => item.text)).toEqual(['PACKAGE ONE', 'PACKAGE TWO']);
      expect((await adapter.operations.inspect('A', T1.sessionId, C1))!.additions.map(item => item.text)).toEqual(['PACKAGE ONE']);
      expect((await adapter.operations.inspect('A', T1.sessionId, C2))!.additions.map(item => item.text)).toEqual(['PACKAGE ONE', 'PACKAGE TWO']);
      // The next turn continues the same session from the second checkpoint and sees both packages.
      const second = await adapter.start(harnessInput('assign', two.ref)); expect((await second.outcome).kind).toBe('submitted'); expect(await second.settled()).toBe('settled');
      expect(seen[1]!.session.sessionId).toBe(T1.sessionId); expect(seen[1]!.session.currentPoint).toEqual(C2);
      expect(seen[1]!.session.additions.map(item => item.text)).toEqual(expect.arrayContaining(['PACKAGE ONE', 'PACKAGE TWO']));
      // While a turn is active, an append is a conflict the caller carries; the session stays intact and takes the package once the turn settles.
      const third = await adapter.start(harnessInput('active', second.ref)); await entered.promise;
      expect(await adapter.append(second.ref, 'package:3', 'PACKAGE THREE')).toEqual({ outcome: 'conflict', reason: 'Expected point is stale or session active' });
      expect((await adapter.operations.inspect('A', T1.sessionId))?.available).toBe(true);
      gate.resolve(); expect((await third.outcome).kind).toBe('submitted'); expect(await third.settled()).toBe('settled');
      const three = await adapter.append(second.ref, 'package:3', 'PACKAGE THREE'); expect(three.outcome).toBe('appended');
      if (three.outcome !== 'appended') throw new Error('Expected the third append to land');
      expect(readSessionPointReference(three.ref)!.point).toMatchObject({ sessionId: T1.sessionId, turn: readSessionPointReference(third.ref)!.point.turn, kind: 'checkpoint' });
      // Only a session that can no longer be read is lost.
      expect(agent.loseSession(T1)).toBe(true);
      expect(await adapter.append(three.ref, 'package:4', 'PACKAGE FOUR')).toEqual({ outcome: 'session-lost' });
    } finally { expect(await adapter.close()).toBe(true); }
  });
  it('two reconstructed stores/agents cannot Retry the same live intent twice', async () => {
    const { path, store } = await setup(); const gate = deferred(); const entered = deferred(); let dispatches = 0;
    const driver: SessionOperationDriver = { async dispatch() { dispatches++; entered.resolve(); await gate.promise; return { kind: 'ended' }; } };
    const first = createSessionOperations({ sessionStore: store, driver }); const P = await first.create(create);
    const handle = await first.continue(input(P.sessionId, P.point!)); await entered.promise;
    const secondStore = (await setup(path)).store;
    const second = createSessionOperations({ sessionStore: secondStore, driver });
    const refusal = await (await second.retry({ runId: 'A', operationId: 'orient', bindings: bound() })).receipt;
    expect(refusal.status).toBe('conflict'); expect(refusal.reason).toMatch(/live execution owner/); expect(dispatches).toBe(1);
    gate.resolve(); expect((await handle.receipt).status).toBe('completed');
  });
});
