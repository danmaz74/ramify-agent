import { afterEach, describe, expect, test, vi } from 'vitest';
import type { CodexEvent } from '../interfaces/provider.js';
import { ScriptedCodex, testSession, testThread, testTurn } from './scripted.js';

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
