import { afterEach, describe, expect, test, vi } from 'vitest';
import type { CodexEvent } from '../interfaces/provider.js';
import { ScriptedCodex, testSession, testThread, testTurn } from './scripted.js';
import { checkAdmissionOrdering } from './ordering.js';

afterEach(() => vi.useRealTimers());
const settings = { cwd: '/target', model: 'gpt-6-astra' };
async function prepared(script = new ScriptedCodex()) {
  await script.initialize();
  const start = script.provider.startThread(settings);
  script.replyLast(testSession());
  await start;
  return script;
}
const approval = (id: string | number = 7, params: Record<string, unknown> = {}) => ({ id, method: 'item/commandExecution/requestApproval', params: { threadId: 'thread-1', turnId: 'turn-1', itemId: 'item-1', command: 'ls', cwd: '/target', ...params } });

describe('dedicated Codex protocol', () => {
  test('initializes once and correlates simultaneous out-of-order observations', async () => {
    const script = await prepared();
    const a = script.provider.readThread('a');
    const b = script.provider.readThread('b');
    const [first, second] = script.written.slice(-2);
    script.receive({ id: second!.id!, result: { thread: testThread({ id: 'b' }) } });
    script.receive({ id: first!.id!, result: { thread: testThread({ id: 'a' }) } });
    await expect(a).resolves.toMatchObject({ id: 'a' });
    await expect(b).resolves.toMatchObject({ id: 'b' });
    await script.provider.initialize();
    expect(script.written.filter(frame => frame.method === 'initialize')).toHaveLength(1);
  });

  test('requires non-ephemeral thread creation and rejects unverified persistence', async () => {
    const script = new ScriptedCodex();
    await script.initialize();
    const start = script.provider.startThread(settings);
    expect(script.written.at(-1)!.params).toEqual({ ...settings, ephemeral: false });
    script.replyLast(testSession({ ephemeral: true }));
    await expect(start).rejects.toMatchObject({ kind: 'uncertain', method: 'thread/start' });
    expect(script.written.some(frame => frame.method === 'turn/start')).toBe(false);
  });

  test('preserves explicit RPC errors and their method and rejects malformed frames', async () => {
    const script = await prepared();
    const read = script.provider.readThread('thread-1');
    script.receive({ id: script.written.at(-1)!.id!, error: { code: -32601, message: 'unsupported read' } });
    await expect(read).rejects.toMatchObject({ kind: 'rpc', method: 'thread/read', rpcCode: -32601 });
    const another = script.provider.readThread('thread-1');
    script.raw('{not json');
    await expect(another).rejects.toMatchObject({ kind: 'unavailable' });
  });

  test('keeps mutation uncertainty busy and does not replay a lost submission', async () => {
    vi.useFakeTimers();
    const script = await prepared();
    const send = script.provider.send('thread-1', 'hello');
    const rejected = expect(send).rejects.toMatchObject({ kind: 'uncertain', method: 'turn/start' });
    await vi.advanceTimersByTimeAsync(1001);
    await rejected;
    await expect(script.provider.send('thread-1', 'hello')).rejects.toMatchObject({ kind: 'busy' });
    expect(script.written.filter(frame => frame.method === 'turn/start')).toHaveLength(1);
    const read = script.provider.readThread('thread-1');
    script.replyLast({ thread: testThread({ status: { type: 'active' }, turns: [testTurn()] }) });
    await read;
    await expect(script.provider.send('thread-1', 'hello')).rejects.toMatchObject({ kind: 'busy' });
  });

  test('handles completion arriving before the submission response and refuses concurrent input', async () => {
    const script = await prepared();
    const send = script.provider.send('thread-1', 'hello');
    await expect(script.provider.send('thread-1', 'concurrent')).rejects.toMatchObject({ kind: 'busy' });
    script.receive({ method: 'turn/completed', params: { threadId: 'thread-1', turn: testTurn('completed') } });
    script.replyLast({ turn: testTurn() });
    await expect(send).resolves.toMatchObject({ status: 'completed' });
    const next = script.provider.send('thread-1', 'next');
    script.replyLast({ turn: testTurn('inProgress', 'turn-2') });
    await expect(next).resolves.toMatchObject({ id: 'turn-2' });
  });

  test('decodes actual offered policy choices, reserves responses and rejects stale generations', async () => {
    const script = await prepared();
    script.receive(approval(7, { availableDecisions: ['decline', { acceptWithExecpolicyAmendment: { execpolicy_amendment: ['git', 'status'] } }] }));
    script.receive(approval('7'));
    const [request, other] = script.provider.pendingRequests();
    expect(request!.id).not.toBe(other!.id);
    expect(request).toMatchObject({ kind: 'command-approval', choices: [{ effect: 'deny' }, { effect: 'policy', commandPrefix: ['git', 'status'] }] });
    await expect(script.provider.respond('old-generation', { kind: 'approval', choiceId: '1' })).rejects.toMatchObject({ kind: 'stale-response' });
    await expect(script.provider.respond(request!.id, { kind: 'approval', choiceId: 'absent' })).rejects.toMatchObject({ kind: 'protocol' });
    const response = script.provider.respond(request!.id, { kind: 'approval', choiceId: '1' });
    await expect(script.provider.respond(request!.id, { kind: 'approval', choiceId: '1' })).rejects.toMatchObject({ kind: 'stale-response' });
    await response;
    expect(script.written.at(-1)).toEqual({ id: 7, result: { decision: { acceptWithExecpolicyAmendment: { execpolicy_amendment: ['git', 'status'] } } } });
  });

  test('keeps unsupported requests visible without approval and invalidates resolved requests', async () => {
    const script = await prepared();
    script.receive({ id: 9, method: 'item/permissions/requestApproval', params: { threadId: 'thread-1', turnId: 'turn-1', itemId: 'item-1', permissions: { network: true } } });
    const request = script.provider.pendingRequests()[0]!;
    expect(request.kind).toBe('unsupported');
    const count = script.written.length;
    await expect(script.provider.respond(request.id, { kind: 'approval', choiceId: '0' })).rejects.toMatchObject({ kind: 'protocol' });
    expect(script.written).toHaveLength(count);
    script.receive({ method: 'serverRequest/resolved', params: { threadId: 'another-thread', requestId: 9 } });
    expect(script.provider.pendingRequests()).toHaveLength(1);
    script.receive({ method: 'serverRequest/resolved', params: { threadId: 'thread-1', requestId: 9 } });
    expect(script.provider.pendingRequests()).toHaveLength(0);
  });

  test('validates user question identities and choices and sends only the exact answer', async () => {
    const script = await prepared();
    script.receive({ id: 10, method: 'item/tool/requestUserInput', params: { threadId: 'thread-1', turnId: 'turn-1', itemId: 'q', isBlocking: true,
      questions: [{ id: 'choice', header: 'Choice', question: 'Choose', isOther: false, isSecret: false, options: [{ label: 'Yes', description: 'Continue' }] }] } });
    const id = script.provider.pendingRequests()[0]!.id;
    await expect(script.provider.respond(id, { kind: 'user-input', answers: { unknown: ['Yes'] } })).rejects.toMatchObject({ kind: 'protocol' });
    await expect(script.provider.respond(id, { kind: 'user-input', answers: { choice: ['No'] } })).rejects.toMatchObject({ kind: 'protocol' });
    await script.provider.respond(id, { kind: 'user-input', answers: { choice: ['Yes'] } });
    expect(script.written.at(-1)).toEqual({ id: 10, result: { answers: { choice: { answers: ['Yes'] } } } });
  });

  test('projects file approvals and never mistakes interrupted parent for settled descendants', async () => {
    const script = await prepared();
    const send = script.provider.send('thread-1', 'begin');
    script.replyLast({ turn: testTurn() });
    await send;
    script.receive({ id: 11, method: 'item/fileChange/requestApproval', params: { threadId: 'thread-1', turnId: 'turn-1', itemId: 'file', grantRoot: '/target/new' } });
    const request = script.provider.pendingRequests()[0]!;
    expect(request).toMatchObject({ kind: 'file-approval', writeRoot: '/target/new' });
    const interrupt = script.provider.interrupt('thread-1', 'turn-1');
    script.replyLast({});
    await expect(interrupt).resolves.toMatchObject({ descendants: 'not-established', assessments: 'not-controlled' });
    script.receive({ method: 'turn/completed', params: { threadId: 'thread-1', turn: testTurn('interrupted') } });
    await expect(script.provider.respond(request.id, { kind: 'approval', choiceId: '0' })).rejects.toMatchObject({ kind: 'stale-response' });
  });

  test('observer removal and failed observers do not cancel, and hidden payloads are discarded', async () => {
    const script = await prepared();
    const events: CodexEvent[] = [];
    script.provider.observe(() => { throw new Error('observer closed'); });
    const close = script.provider.observe(event => events.push(event));
    script.receive({ method: 'item/started', params: { threadId: 'thread-1', turnId: 'turn-1', item: { id: 'reason', type: 'reasoning', content: ['hidden'] } } });
    script.receive({ method: 'item/completed', params: { threadId: 'thread-1', turnId: 'turn-1', item: { id: 'tool', type: 'commandExecution', status: 'completed', aggregatedOutput: 'secret tool body' } } });
    expect(JSON.stringify(events)).not.toMatch(/hidden|secret tool body/);
    expect(events).toHaveLength(1);
    close();
    script.receive({ method: 'item/agentMessage/delta', params: { threadId: 'thread-1', turnId: 'turn-1', delta: 'visible' } });
    expect(events).toHaveLength(1);
    const read = script.provider.readThread('thread-1');
    script.replyLast({ thread: testThread() });
    await expect(read).resolves.toHaveProperty('id', 'thread-1');
  });

  test('provider exit rejects pending mutations explicitly and stop retains unknown settlement', async () => {
    const script = await prepared();
    const send = script.provider.send('thread-1', 'hello');
    script.exit(2);
    await expect(send).rejects.toMatchObject({ kind: 'uncertain' });
    Object.assign(script.settlement, { confirmed: false, descendants: 'unknown', supervisorExited: false, reason: 'still running' });
    await expect(script.provider.stop()).resolves.toMatchObject({ confirmed: false, reason: 'still running' });
  });
});

test('a repeated server request ID receives a new response identity after prior settlement', async () => {
  const script = await prepared();
  script.receive(approval());
  const first = script.provider.pendingRequests()[0]!;
  await script.provider.respond(first.id, { kind: 'approval', choiceId: '2' });
  script.receive(approval());
  const second = script.provider.pendingRequests()[0]!;
  expect(second.id).not.toBe(first.id);
  await expect(script.provider.respond(first.id, { kind: 'approval', choiceId: '0' })).rejects.toMatchObject({ kind: 'stale-response' });
  expect(script.provider.pendingRequests()[0]!.id).toBe(second.id);
});

test('a malformed RPC error settles the waiting request as unavailable', async () => {
  const script = await prepared();
  const read = script.provider.readThread('thread-1');
  script.receive({ id: script.written.at(-1)!.id!, error: { message: 'missing numeric code' } });
  await expect(read).rejects.toMatchObject({ kind: 'unavailable' });
});

test('an idle history read cannot erase a lost mutation or let another input race it', async () => {
  vi.useFakeTimers();
  const script = await prepared();
  const send = script.provider.send('thread-1', 'hello');
  const rejected = expect(send).rejects.toMatchObject({ kind: 'uncertain' });
  const read = script.provider.readThread('thread-1');
  script.replyLast({ thread: testThread() });
  await read;
  await expect(script.provider.send('thread-1', 'second')).rejects.toMatchObject({ kind: 'busy' });
  await vi.advanceTimersByTimeAsync(1001);
  await rejected;
  const afterTimeout = script.provider.readThread('thread-1');
  script.replyLast({ thread: testThread() });
  await afterTimeout;
  await expect(script.provider.send('thread-1', 'replayed')).rejects.toMatchObject({ kind: 'busy' });
});

test('worker observations preserve thread identity and never finish the parent turn', async () => {
  const script = await prepared();
  const observed: CodexEvent[] = [];
  script.provider.observe(event => observed.push(event));
  const parent = script.provider.send('thread-1', 'coordinate');
  script.replyLast({ turn: testTurn() });
  await parent;
  script.receive({ method: 'thread/started', params: { thread: testThread({ id: 'worker', parentThreadId: 'thread-1', model: 'gpt-6-sol' }) } });
  script.receive({ method: 'item/completed', params: { threadId: 'thread-1', turnId: 'turn-1', item: { id: 'activity', type: 'subAgentActivity', kind: 'completed', agentThreadId: 'worker', agentPath: '/root/worker' } } });
  script.receive({ method: 'turn/completed', params: { threadId: 'worker', turn: testTurn('completed', 'worker-turn') } });
  expect(observed).toContainEqual({ kind: 'worker-thread', threadId: 'worker', parentThreadId: 'thread-1', model: 'gpt-6-sol', ephemeral: false });
  expect(observed).toContainEqual({ kind: 'work', threadId: 'thread-1', turnId: 'turn-1', item: { id: 'activity', kind: 'subAgentActivity', activity: 'completed', workerThreadIds: ['worker'] } });
  await expect(script.provider.send('thread-1', 'premature')).rejects.toMatchObject({ kind: 'busy' });
});

test('a concurrent history read preserves the same submission reservation through acknowledgement', async () => {
  const script = await prepared();
  const send = script.provider.send('thread-1', 'first');
  const submission = script.written.at(-1)!.id!;
  const read = script.provider.readThread('thread-1');
  script.replyLast({ thread: testThread() });
  await read;
  script.receive({ method: 'turn/completed', params: { threadId: 'thread-1', turn: testTurn('completed') } });
  script.receive({ id: submission, result: { turn: testTurn() } });
  await send;
  const next = script.provider.send('thread-1', 'next');
  script.replyLast({ turn: testTurn('inProgress', 'turn-2') });
  await expect(next).resolves.toMatchObject({ id: 'turn-2' });
});

test('a mismatched resume never adopts the returned thread for implementation input', async () => {
  const script = new ScriptedCodex();
  await script.initialize();
  const resumed = script.provider.resumeThread('intended', settings);
  script.replyLast(testSession({ id: 'wrong-thread' }));
  await expect(resumed).rejects.toMatchObject({ kind: 'uncertain', method: 'thread/resume' });
  await expect(script.provider.send('wrong-thread', 'must not execute')).rejects.toMatchObject({ kind: 'unavailable' });
});

test('a stopped provider cannot initialize or launch a replacement transport', async () => {
  const { createCodexProviderOn } = await import('../provider.js');
  const start = vi.fn(async () => ({ providerPid: 100, providerIdentity: 'boot:1', supervisorPid: 99, supervisorIdentity: 'boot:0' }));
  const provider = createCodexProviderOn({ start, write: async () => undefined, stop: async () => ({ confirmed: true, descendants: 'settled', supervisorExited: true, reason: null }) });
  await provider.stop();
  await expect(provider.initialize()).rejects.toMatchObject({ kind: 'unavailable' });
  expect(start).not.toHaveBeenCalled();
});

test.each(['before-admission', 'after-acknowledgement'])('a delayed idle history snapshot cannot erase a live turn: read %s', async timing => {
  const script = await prepared();
  let history: Promise<unknown> | undefined;
  let historyId: string | number | undefined;
  const read = () => { history = script.provider.readThread('thread-1'); historyId = script.written.at(-1)!.id!; };
  if (timing === 'before-admission') read();
  const send = script.provider.send('thread-1', 'first');
  script.replyLast({ turn: testTurn() });
  await send;
  if (timing === 'after-acknowledgement') read();
  script.receive({ id: historyId!, result: { thread: testThread() } });
  await history;
  await expect(script.provider.send('thread-1', 'must stay busy')).rejects.toMatchObject({ kind: 'busy' });
  const interrupt = script.provider.interrupt('thread-1', 'turn-1');
  script.replyLast({});
  await expect(interrupt).resolves.toMatchObject({ turnId: 'turn-1' });
  expect(script.written.filter(frame => frame.method === 'turn/start')).toHaveLength(1);
});

test.each(['before-completion', 'after-completion'])('a delayed active history snapshot cannot resurrect a completed turn: read %s', async timing => {
  const script = await prepared();
  const send = script.provider.send('thread-1', 'first');
  script.replyLast({ turn: testTurn() });
  await send;
  let history: Promise<unknown> | undefined;
  let historyId: string | number | undefined;
  const read = () => { history = script.provider.readThread('thread-1'); historyId = script.written.at(-1)!.id!; };
  if (timing === 'before-completion') read();
  script.receive({ method: 'turn/completed', params: { threadId: 'thread-1', turn: testTurn('completed') } });
  if (timing === 'after-completion') read();
  script.receive({ id: historyId!, result: { thread: testThread({ status: { type: 'active' }, turns: [testTurn()] }) } });
  await history;
  await expect(script.provider.interrupt('thread-1', 'turn-1')).rejects.toMatchObject({ kind: 'stale-response' });
  const next = script.provider.send('thread-1', 'next');
  script.replyLast({ turn: testTurn('inProgress', 'turn-2') });
  await expect(next).resolves.toMatchObject({ id: 'turn-2' });
});

test('late history from an old turn cannot replace the current interruption identity', async () => {
  const script = await prepared();
  const first = script.provider.send('thread-1', 'first');
  script.replyLast({ turn: testTurn() });
  await first;
  const history = script.provider.readThread('thread-1');
  const historyId = script.written.at(-1)!.id!;
  script.receive({ method: 'turn/completed', params: { threadId: 'thread-1', turn: testTurn('completed') } });
  const next = script.provider.send('thread-1', 'next');
  script.replyLast({ turn: testTurn('inProgress', 'turn-2') });
  await next;
  script.receive({ id: historyId, result: { thread: testThread({ status: { type: 'active' }, turns: [testTurn()] }) } });
  await history;
  await expect(script.provider.interrupt('thread-1', 'turn-1')).rejects.toMatchObject({ kind: 'stale-response' });
  const interrupt = script.provider.interrupt('thread-1', 'turn-2');
  script.replyLast({});
  await expect(interrupt).resolves.toMatchObject({ turnId: 'turn-2' });
});

test('out-of-order history snapshots cannot overwrite the newer adopted observation', async () => {
  const script = await prepared();
  const old = script.provider.readThread('thread-1');
  const oldId = script.written.at(-1)!.id!;
  const current = script.provider.readThread('thread-1');
  script.replyLast({ thread: testThread() });
  await current;
  script.receive({ id: oldId, result: { thread: testThread({ status: { type: 'active' }, turns: [testTurn()] }) } });
  await old;
  const send = script.provider.send('thread-1', 'current input');
  script.replyLast({ turn: testTurn('inProgress', 'current-turn') });
  await expect(send).resolves.toMatchObject({ id: 'current-turn' });
});

test.each(['exit', 'stop', 'timeout', 'write-error'])('response delivery settles as uncertain after %s and a late callback cannot reopen it', async failure => {
  vi.useFakeTimers();
  let finishWrite!: () => void;
  let rejectWrite!: (error: Error) => void;
  const write = new Promise<void>((resolve, reject) => { finishWrite = resolve; rejectWrite = reject; });
  const script = await prepared(new ScriptedCodex(frame => frame.result === undefined ? undefined : write));
  const events: CodexEvent[] = [];
  script.provider.observe(event => events.push(event));
  script.receive(approval());
  const id = script.provider.pendingRequests()[0]!.id;
  const response = script.provider.respond(id, { kind: 'approval', choiceId: '0' });
  const rejected = expect(response).rejects.toMatchObject({ kind: 'uncertain', method: 'respond' });
  await expect(script.provider.respond(id, { kind: 'approval', choiceId: '0' })).rejects.toMatchObject({ kind: 'stale-response' });
  if (failure === 'exit') script.exit(7);
  if (failure === 'stop') await script.provider.stop();
  if (failure === 'timeout') await vi.advanceTimersByTimeAsync(1001);
  if (failure === 'write-error') rejectWrite(new Error('write failed'));
  await rejected;
  finishWrite();
  await Promise.resolve();
  await Promise.resolve();
  await expect(script.provider.respond(id, { kind: 'approval', choiceId: '0' })).rejects.toBeDefined();
  expect(script.written.filter(frame => frame.id === 7 && frame.result !== undefined)).toHaveLength(1);
  expect(script.provider.pendingRequests().map(request => request.id)).toContain(id);
  expect(events.filter(event => event.kind === 'request-resolved')).toHaveLength(0);
});

// All snapshot entry points share ordering and terminal identity rules.
test.each(['start', 'resume'])('early completion before the initial %s response survives adoption and later stale history', async method => {
  const script = new ScriptedCodex();
  await script.initialize();
  const session = method === 'start' ? script.provider.startThread(settings) : script.provider.resumeThread('thread-1', settings);
  script.receive({ method: 'turn/completed', params: { threadId: 'thread-1', turn: testTurn('completed') } });
  script.replyLast(testSession({ status: { type: 'active' }, turns: [testTurn()] }));
  await expect(session).resolves.toMatchObject({ thread: { status: 'idle', turns: [{ status: 'completed' }] } });
  const read = script.provider.readThread('thread-1');
  script.replyLast({ thread: testThread({ status: { type: 'active' }, turns: [testTurn()] }) });
  await expect(read).resolves.toMatchObject({ status: 'idle', turns: [{ status: 'completed' }] });
  await expect(script.provider.interrupt('thread-1', 'turn-1')).rejects.toMatchObject({ kind: 'stale-response' });
  const send = script.provider.send('thread-1', 'next');
  script.replyLast({ turn: testTurn('inProgress', 'turn-2') });
  await expect(send).resolves.toMatchObject({ id: 'turn-2' });
});

test('fresh idle history can correct snapshot-derived active resume state', async () => {
  const script = new ScriptedCodex();
  await script.initialize();
  const resumed = script.provider.resumeThread('thread-1', settings);
  script.replyLast(testSession({ status: { type: 'active' }, turns: [testTurn()] }));
  await resumed;
  await expect(script.provider.send('thread-1', 'busy')).rejects.toMatchObject({ kind: 'busy' });
  const read = script.provider.readThread('thread-1');
  script.replyLast({ thread: testThread() });
  await read;
  await expect(script.provider.interrupt('thread-1', 'turn-1')).rejects.toMatchObject({ kind: 'stale-response' });
  const next = script.provider.send('thread-1', 'corrected');
  script.replyLast({ turn: testTurn('inProgress', 'turn-2') });
  await expect(next).resolves.toMatchObject({ id: 'turn-2' });
});

test.each(['read', 'resume'])('fresh %s terminal proof can finish the same live turn, without accepting empty idle history', async method => {
  const script = await prepared();
  const send = script.provider.send('thread-1', 'first');
  script.replyLast({ turn: testTurn() });
  await send;
  const snapshot = (turns: ReturnType<typeof testTurn>[]) => {
    const observation = method === 'read' ? script.provider.readThread('thread-1') : script.provider.resumeThread('thread-1', settings);
    script.replyLast(method === 'read' ? { thread: testThread({ turns }) } : testSession({ turns }));
    return observation;
  };
  await snapshot([]);
  await expect(script.provider.send('thread-1', 'empty snapshot')).rejects.toMatchObject({ kind: 'busy' });
  await snapshot([testTurn('completed')]);
  await expect(script.provider.interrupt('thread-1', 'turn-1')).rejects.toMatchObject({ kind: 'stale-response' });
  const next = script.provider.send('thread-1', 'confirmed complete');
  script.replyLast({ turn: testTurn('inProgress', 'turn-2') });
  await expect(next).resolves.toMatchObject({ id: 'turn-2' });
});

test('status-only active notification retains the snapshot turn identity before adoption', async () => {
  const script = new ScriptedCodex();
  await script.initialize();
  const resumed = script.provider.resumeThread('thread-1', settings);
  script.replyLast(testSession({ status: { type: 'active' }, turns: [testTurn()] }));
  script.receive({ method: 'thread/status/changed', params: { threadId: 'thread-1', status: { type: 'active' } } });
  await resumed;
  const read = script.provider.readThread('thread-1');
  script.replyLast({ thread: testThread() });
  await read;
  const interrupt = script.provider.interrupt('thread-1', 'turn-1');
  script.replyLast({});
  await expect(interrupt).resolves.toMatchObject({ turnId: 'turn-1' });
});

test('an authoritative idle status before adoption clears a stale active identity without inventing a terminal outcome', async () => {
  const script = new ScriptedCodex();
  await script.initialize();
  const resumed = script.provider.resumeThread('thread-1', settings);
  script.replyLast(testSession({ status: { type: 'active' }, turns: [testTurn()] }));
  script.receive({ method: 'thread/status/changed', params: { threadId: 'thread-1', status: { type: 'idle' } } });
  await expect(resumed).resolves.toMatchObject({ thread: { status: 'idle', turns: [{ status: 'inProgress' }] } });
  const read = script.provider.readThread('thread-1');
  script.replyLast({ thread: testThread({ status: { type: 'active' }, turns: [testTurn()] }) });
  await expect(read).resolves.toMatchObject({ status: 'idle', turns: [{ status: 'inProgress' }] });
  await expect(script.provider.interrupt('thread-1', 'turn-1')).rejects.toMatchObject({ kind: 'stale-response' });
  const next = script.provider.send('thread-1', 'idle');
  script.replyLast({ turn: testTurn('inProgress', 'turn-2') });
  await next;
});

test('notifications alone cannot adopt an unverified thread or enable interruption', async () => {
  const script = new ScriptedCodex();
  await script.initialize();
  script.receive({ method: 'turn/started', params: { threadId: 'unknown', turn: testTurn() } });
  await expect(script.provider.send('unknown', 'input')).rejects.toMatchObject({ kind: 'unavailable' });
  await expect(script.provider.interrupt('unknown', 'turn-1')).rejects.toMatchObject({ kind: 'stale-response' });
});

test('a resume reply cannot replace the newer running identity or an uncertain submission', async () => {
  vi.useFakeTimers();
  const script = await prepared();
  const resumed = script.provider.resumeThread('thread-1', settings);
  const resumeId = script.written.at(-1)!.id!;
  const send = script.provider.send('thread-1', 'first');
  const rejected = expect(send).rejects.toMatchObject({ kind: 'uncertain' });
  script.receive({ method: 'turn/started', params: { threadId: 'thread-1', turn: testTurn('inProgress', 'actual-turn') } });
  script.receive({ id: resumeId, result: testSession({ status: { type: 'active' }, turns: [testTurn()] }) });
  await expect(resumed).resolves.toMatchObject({ thread: { status: 'active' } });
  await vi.advanceTimersByTimeAsync(1001);
  await rejected;
  await expect(script.provider.send('thread-1', 'uncertain')).rejects.toMatchObject({ kind: 'busy' });
  await expect(script.provider.interrupt('thread-1', 'turn-1')).rejects.toMatchObject({ kind: 'stale-response' });
  const interrupt = script.provider.interrupt('thread-1', 'actual-turn');
  script.replyLast({});
  await expect(interrupt).resolves.toMatchObject({ turnId: 'actual-turn' });
});

test.each(['read', 'resume'])('a %s reply dispatched before newer notifications cannot replace the current turn', async method => {
  const script = await prepared();
  const observation = method === 'read' ? script.provider.readThread('thread-1') : script.provider.resumeThread('thread-1', settings);
  script.replyLast(method === 'read' ? { thread: testThread() } : testSession());
  script.receive({ method: 'turn/started', params: { threadId: 'thread-1', turn: testTurn('inProgress', 'new-turn') } });
  await observation;
  await expect(script.provider.send('thread-1', 'busy')).rejects.toMatchObject({ kind: 'busy' });
  const interrupt = script.provider.interrupt('thread-1', 'new-turn');
  script.replyLast({});
  await expect(interrupt).resolves.toMatchObject({ turnId: 'new-turn' });
});

test('a send acknowledgement followed by batched completion remains idle, and a repeated start cannot resurrect it', async () => {
  const script = await prepared();
  const send = script.provider.send('thread-1', 'first');
  script.replyLast({ turn: testTurn() });
  script.receive({ method: 'turn/completed', params: { threadId: 'thread-1', turn: testTurn('completed') } });
  script.receive({ method: 'thread/status/changed', params: { threadId: 'thread-1', status: { type: 'idle' } } });
  await expect(send).resolves.toMatchObject({ status: 'completed' });
  script.receive({ method: 'turn/started', params: { threadId: 'thread-1', turn: testTurn() } });
  await expect(script.provider.interrupt('thread-1', 'turn-1')).rejects.toMatchObject({ kind: 'stale-response' });
  const next = script.provider.send('thread-1', 'next');
  script.replyLast({ turn: testTurn('inProgress', 'turn-2') });
  await next;
});

test('an explicit submission rejection cannot roll back a newer turn notification', async () => {
  const script = await prepared();
  const send = script.provider.send('thread-1', 'first');
  const submission = script.written.at(-1)!.id!;
  script.receive({ method: 'turn/started', params: { threadId: 'thread-1', turn: testTurn('inProgress', 'actual-turn') } });
  script.receive({ id: submission, error: { code: -32000, message: 'conflicting turn' } });
  await expect(send).rejects.toMatchObject({ kind: 'rpc' });
  await expect(script.provider.send('thread-1', 'second')).rejects.toMatchObject({ kind: 'busy' });
  const interrupt = script.provider.interrupt('thread-1', 'actual-turn');
  script.replyLast({});
  await expect(interrupt).resolves.toMatchObject({ turnId: 'actual-turn' });
});


test('a batched idle status cannot retire a newly acknowledged live identity', async () => {
  const script = await prepared();
  const send = script.provider.send('thread-1', 'first');
  script.replyLast({ turn: testTurn() });
  script.receive({ method: 'thread/status/changed', params: { threadId: 'thread-1', status: { type: 'idle' } } });
  await expect(send).resolves.toMatchObject({ id: 'turn-1', status: 'inProgress' });
  const read = script.provider.readThread('thread-1');
  script.replyLast({ thread: testThread({ status: { type: 'active' }, turns: [testTurn()] }) });
  await expect(read).resolves.toMatchObject({ status: 'active' });
  await expect(script.provider.send('thread-1', 'ambiguous idle')).rejects.toMatchObject({ kind: 'busy' });
  const interrupt = script.provider.interrupt('thread-1', 'turn-1');
  script.replyLast({});
  await expect(interrupt).resolves.toMatchObject({ turnId: 'turn-1' });
  script.receive({ method: 'turn/completed', params: { threadId: 'thread-1', turn: testTurn('completed') } });
  const next = script.provider.send('thread-1', 'next');
  script.replyLast({ turn: testTurn('inProgress', 'turn-2') });
  await next;
});

test('an older completion cannot clear a different current turn', async () => {
  const script = await prepared();
  const send = script.provider.send('thread-1', 'current');
  script.replyLast({ turn: testTurn('inProgress', 'current-turn') });
  await send;
  script.receive({ method: 'turn/completed', params: { threadId: 'thread-1', turn: testTurn('completed', 'old-turn') } });
  await expect(script.provider.send('thread-1', 'busy')).rejects.toMatchObject({ kind: 'busy' });
  const interrupt = script.provider.interrupt('thread-1', 'current-turn');
  script.replyLast({});
  await expect(interrupt).resolves.toMatchObject({ turnId: 'current-turn' });
});


test('a history read started during a rejected submission cannot restore its stale active identity', async () => {
  const script = await prepared();
  const send = script.provider.send('thread-1', 'rejected');
  const submission = script.written.at(-1)!.id!;
  const read = script.provider.readThread('thread-1');
  const history = script.written.at(-1)!.id!;
  script.receive({ id: submission, error: { code: -32000, message: 'rejected' } });
  await expect(send).rejects.toMatchObject({ kind: 'rpc' });
  script.receive({ id: history, result: { thread: testThread({ status: { type: 'active' }, turns: [testTurn()] }) } });
  await read;
  const next = script.provider.send('thread-1', 'retry after explicit rejection');
  script.replyLast({ turn: testTurn('inProgress', 'next-turn') });
  await expect(next).resolves.toMatchObject({ id: 'next-turn' });
});


test('an idle notification remains authoritative after corroborating history without a known turn identity', async () => {
  const script = await prepared();
  script.receive({ method: 'thread/status/changed', params: { threadId: 'thread-1', status: { type: 'idle' } } });
  const corroboration = script.provider.readThread('thread-1');
  script.replyLast({ thread: testThread() });
  await corroboration;
  const stale = script.provider.readThread('thread-1');
  script.replyLast({ thread: testThread({ status: { type: 'active' }, turns: [testTurn()] }) });
  await expect(stale).resolves.toMatchObject({ status: 'idle' });
  await expect(script.provider.interrupt('thread-1', 'turn-1')).rejects.toMatchObject({ kind: 'stale-response' });
  const next = script.provider.send('thread-1', 'next');
  script.replyLast({ turn: testTurn('inProgress', 'next-turn') });
  await next;
});


test.each([
  ['old-complete', 'ack', 'new-start'],
  ['new-start', 'old-complete', 'ack'],
  ['ack', 'old-complete', 'new-start'],
  ['old-complete', 'idle', 'new-start', 'ack'],
  ['ack', 'idle', 'old-start', 'old-complete', 'new-start'],
  ['new-complete', 'old-complete', 'ack', 'new-start'],
  ['new-start', 'new-complete', 'idle', 'old-complete', 'ack'],
  ['ack', 'old-complete', 'idle', 'new-start', 'new-complete'],
])('admission retains exact identity through ordering %j', async (...order) => {
  await checkAdmissionOrdering(order);
});

test.each(['notification', 'history'])('conflicting running identities retain uncertainty until exact terminal proof from %s', async proof => {
  const script = await prepared();
  const send = script.provider.send('thread-1', 'new');
  const submission = script.written.at(-1)!.id!;
  script.receive({ method: 'turn/started', params: { threadId: 'thread-1', turn: testTurn('inProgress', 'unrelated') } });
  script.receive({ id: submission, result: { turn: testTurn('inProgress', 'new') } });
  await expect(send).rejects.toMatchObject({ kind: 'uncertain' });
  script.receive({ method: 'turn/started', params: { threadId: 'thread-1', turn: testTurn('inProgress', 'new') } });
  script.receive({ method: 'turn/completed', params: { threadId: 'thread-1', turn: testTurn('completed', 'new') } });
  await expect(script.provider.send('thread-1', 'unresolved other identity')).rejects.toMatchObject({ kind: 'busy' });
  if (proof === 'notification') script.receive({ method: 'turn/completed', params: { threadId: 'thread-1', turn: testTurn('completed', 'unrelated') } });
  else {
    const read = script.provider.readThread('thread-1');
    script.replyLast({ thread: testThread({ turns: [testTurn('completed', 'new'), testTurn('completed', 'unrelated')] }) });
    await read;
  }
  const next = script.provider.send('thread-1', 'exactly settled');
  script.replyLast({ turn: testTurn('inProgress', 'next') });
  await next;
});


test.each([
  ['ack', 'old-complete', 'idle', 'new-start'],
  ['ack', 'new-complete', 'old-complete', 'idle', 'new-start'],
])('one dispatch batch preserves exact admission through %j', async (...order) => {
  await checkAdmissionOrdering(order, true);
});

test('an unrecognized old completion and idle during admission cannot finish its newly acknowledged identity', async () => {
  const script = await prepared();
  const send = script.provider.send('thread-1', 'new');
  const submission = script.written.at(-1)!.id!;
  script.receive({ method: 'turn/completed', params: { threadId: 'thread-1', turn: testTurn('completed', 'unknown-old') } });
  script.receive({ method: 'thread/status/changed', params: { threadId: 'thread-1', status: { type: 'idle' } } });
  script.receive({ id: submission, result: { turn: testTurn('inProgress', 'new') } });
  await expect(send).resolves.toMatchObject({ id: 'new', status: 'inProgress' });
  await expect(script.provider.send('thread-1', 'busy')).rejects.toMatchObject({ kind: 'busy' });
  const interrupt = script.provider.interrupt('thread-1', 'new');
  script.replyLast({});
  await expect(interrupt).resolves.toMatchObject({ turnId: 'new' });
});

test('idle before adoption cannot retire an identity it did not observe', async () => {
  const script = new ScriptedCodex();
  await script.initialize();
  const resumed = script.provider.resumeThread('thread-1', settings);
  script.replyLast(testSession({ status: { type: 'active' }, turns: [testTurn()] }));
  script.receive({ method: 'thread/status/changed', params: { threadId: 'thread-1', status: { type: 'idle' } } });
  await resumed;
  script.receive({ method: 'turn/started', params: { threadId: 'thread-1', turn: testTurn() } });
  await expect(script.provider.send('thread-1', 'busy')).rejects.toMatchObject({ kind: 'busy' });
  const interrupt = script.provider.interrupt('thread-1', 'turn-1');
  script.replyLast({});
  await expect(interrupt).resolves.toMatchObject({ turnId: 'turn-1' });
});
