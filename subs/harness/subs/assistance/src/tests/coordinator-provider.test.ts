import { expect, test } from 'vitest';
import { prepareCoordinatorProvider } from '../coordinator-provider.js';
import { ScriptedCodex, testSession, testThread, testTurn } from '../../../agent/subs/codex/src/tests/scripted.js';

function scriptForPreparation(options: { ephemeral?: boolean; missingTools?: boolean; nativeWorkers?: string; history?: Record<string, unknown>; turn?: (script: ScriptedCodex, frame: Parameters<ScriptedCodex['onWrite']>[0]) => void; session?: (script: ScriptedCodex, frame: Parameters<ScriptedCodex['onWrite']>[0]) => void } = {}) {
  const script = new ScriptedCodex(frame => {
    if (frame.method === 'initialized') return;
    if ((frame.method === 'thread/start' || frame.method === 'thread/resume') && options.session !== undefined) { options.session(script, frame); return; }
    if (frame.method === 'turn/start' && options.turn !== undefined) { options.turn(script, frame); return; }
    const answers: Record<string, unknown> = {
      initialize: { userAgent: 'codex/0.161.0', codexHome: '/persistent', platformOs: 'linux' },
      'model/list': { data: [{ model: 'gpt-6-astra', multiAgentVersion: options.nativeWorkers ?? 'v2' }, { model: 'gpt-6-sol', multiAgentVersion: 'v2' }], nextCursor: null },
      'experimentalFeature/list': { data: [{ name: 'multi_agent', enabled: true }], nextCursor: null },
      'mcpServerStatus/list': { data: [{ name: 'assessment', tools: options.missingTools ? {} : { job_detail: {}, iteration_assess: {} }, toolsError: null }], nextCursor: null },
      'config/read': { config: { model: 'gpt-6-astra', approval_policy: 'on-request', sandbox_mode: 'workspace-write' } },
      'thread/start': testSession({ ephemeral: options.ephemeral ?? false }),
      'thread/resume': testSession(),
      'turn/start': { turn: testTurn('inProgress', 'next-turn') },
      'thread/read': { thread: options.history ?? testThread() },
      'turn/interrupt': {},
    };
    if (!Object.hasOwn(answers, frame.method!)) throw new Error(`Unscripted provider call ${frame.method}`);
    script.receive({ id: frame.id!, result: answers[frame.method!] });
  });
  return script;
}
const inputs = () => ({ launch: { cwd: '/target' }, thread: { cwd: '/target', model: 'gpt-6-astra' }, workerModel: 'gpt-6-sol',
  requiredMcp: { server: 'assessment', tools: ['job_detail', 'iteration_assess'] }, retain: async () => undefined });

test('assistance consumes actual provider operations and retains verified identity before implementation input', async () => {
  const script = scriptForPreparation();
  const order: string[] = [];
  const prepared = await prepareCoordinatorProvider({ ...inputs(), retain: async (session, readiness) => {
    expect(session.thread).toMatchObject({ id: 'thread-1', ephemeral: false });
    expect(readiness.codexHome).toBe('/persistent');
    expect(script.written.some(frame => frame.method === 'turn/start')).toBe(false);
    order.push('retained');
  } }, script.provider);
  order.push('prepared');
  await prepared.provider.send(prepared.session.thread.id, 'Continue captured job');
  expect(order).toEqual(['retained', 'prepared']);
  expect(script.written.filter(frame => frame.method === 'mcpServerStatus/list').map(frame => frame.params)).toEqual([{ cursor: null }, { cursor: null, threadId: 'thread-1' }]);
});

test('assistance resumes the supplied persistent thread without creating another conversation', async () => {
  const script = scriptForPreparation();
  const prepared = await prepareCoordinatorProvider({ ...inputs(), resumeThreadId: 'thread-1' }, script.provider);
  expect(prepared.session.thread.id).toBe('thread-1');
  expect(script.written.filter(frame => frame.method === 'thread/start')).toHaveLength(0);
  expect(script.written.find(frame => frame.method === 'thread/resume')!.params).toMatchObject({ threadId: 'thread-1', cwd: '/target', model: 'gpt-6-astra' });
});

test.each([{ missingTools: true }, { nativeWorkers: 'disabled' }, { ephemeral: true }])('assistance fails closed before input on missing equipment or persistence: %j', async options => {
  const script = scriptForPreparation(options);
  let retained = false;
  await expect(prepareCoordinatorProvider({ ...inputs(), retain: async () => { retained = true; } }, script.provider)).rejects.toBeDefined();
  expect(retained).toBe(false);
  expect(script.written.some(frame => frame.method === 'turn/start')).toBe(false);
  await expect(script.provider.readThread('thread-1')).rejects.toMatchObject({ kind: 'unavailable' });
});

test('retention failure preserves its error and includes unsettled execution instead of declaring safe replacement', async () => {
  const script = scriptForPreparation();
  Object.assign(script.settlement, { confirmed: false, descendants: 'unknown', reason: 'kernel observation unavailable' });
  await expect(prepareCoordinatorProvider({ ...inputs(), retain: async () => { throw new Error('disk unavailable'); } }, script.provider)).rejects.toThrow('owned execution is not confirmed settled');
});


test.each(['start', 'resume'])('preparation reconciles a %s reply and completion/idle frames dispatched in one batch', async method => {
  const script = scriptForPreparation({ session: (transport, frame) => {
    transport.receive({ id: frame.id!, result: testSession({ status: { type: 'active' }, turns: [testTurn()] }) });
    // Native framing can dispatch all three lines before the promise continuation.
    transport.receive({ method: 'turn/completed', params: { threadId: 'thread-1', turn: testTurn('completed') } });
    transport.receive({ method: 'thread/status/changed', params: { threadId: 'thread-1', status: { type: 'idle' } } });
  } });
  const prepared = await prepareCoordinatorProvider({ ...inputs(), ...(method === 'resume' ? { resumeThreadId: 'thread-1' } : {}), retain: async session => {
    expect(session.thread).toMatchObject({ status: 'idle', turns: [{ id: 'turn-1', status: 'completed' }] });
  } }, script.provider);
  expect(prepared.session.thread.status).toBe('idle');
  await expect(prepared.provider.readThread('thread-1')).resolves.toMatchObject({ status: 'idle' });
  await expect(prepared.provider.interrupt('thread-1', 'turn-1')).rejects.toMatchObject({ kind: 'stale-response' });
  expect(script.written.some(frame => frame.method === 'turn/interrupt')).toBe(false);
  await expect(prepared.provider.send('thread-1', 'follow up')).resolves.toMatchObject({ id: 'next-turn' });
});

test.each(['start', 'resume'])('preparation retains a newer running turn following an idle %s reply', async method => {
  const script = scriptForPreparation({ session: (transport, frame) => {
    transport.receive({ id: frame.id!, result: testSession() });
    transport.receive({ method: 'turn/started', params: { threadId: 'thread-1', turn: testTurn('inProgress', 'new-turn') } });
  } });
  const prepared = await prepareCoordinatorProvider({ ...inputs(), ...(method === 'resume' ? { resumeThreadId: 'thread-1' } : {}), retain: async session => {
    expect(session.thread).toMatchObject({ status: 'active', turns: [{ id: 'new-turn', status: 'inProgress' }] });
  } }, script.provider);
  await expect(prepared.provider.send('thread-1', 'premature')).rejects.toMatchObject({ kind: 'busy' });
  await expect(prepared.provider.interrupt('thread-1', 'turn-1')).rejects.toMatchObject({ kind: 'stale-response' });
  await expect(prepared.provider.interrupt('thread-1', 'new-turn')).resolves.toMatchObject({ turnId: 'new-turn' });
  expect(script.written.filter(frame => frame.method === 'turn/interrupt').map(frame => frame.params)).toEqual([{ threadId: 'thread-1', turnId: 'new-turn' }]);
});


test('prepared resumed coordinator keeps new admission busy and interruptible when old completion follows idle', async () => {
  const script = scriptForPreparation({
    session: (transport, frame) => transport.receive({ id: frame.id!, result: testSession({ status: { type: 'active' }, turns: [testTurn('inProgress', 'old-turn')] }) }),
    turn: () => undefined,
    history: testThread({ status: { type: 'active' }, turns: [testTurn('inProgress', 'new-turn')] }),
  });
  const prepared = await prepareCoordinatorProvider({ ...inputs(), resumeThreadId: 'thread-1' }, script.provider);
  script.receive({ method: 'thread/status/changed', params: { threadId: 'thread-1', status: { type: 'idle' } } });
  const send = prepared.provider.send('thread-1', 'follow-up');
  const submission = script.written.at(-1)!.id!;
  script.receive({ method: 'turn/completed', params: { threadId: 'thread-1', turn: testTurn('completed', 'old-turn') } });
  script.receive({ id: submission, result: { turn: testTurn('inProgress', 'new-turn') } });
  await expect(send).resolves.toMatchObject({ id: 'new-turn', status: 'inProgress' });
  await expect(prepared.provider.send('thread-1', 'must stay busy')).rejects.toMatchObject({ kind: 'busy' });
  script.receive({ method: 'turn/started', params: { threadId: 'thread-1', turn: testTurn('inProgress', 'new-turn') } });
  await expect(prepared.provider.readThread('thread-1')).resolves.toMatchObject({ status: 'active' });
  await expect(prepared.provider.interrupt('thread-1', 'new-turn')).resolves.toMatchObject({ turnId: 'new-turn' });
  await expect(prepared.provider.interrupt('thread-1', 'old-turn')).rejects.toMatchObject({ kind: 'stale-response' });
  await expect(prepared.provider.send('thread-1', 'still busy')).rejects.toMatchObject({ kind: 'busy' });
  expect(script.written.filter(frame => frame.method === 'turn/start')).toHaveLength(1);
  script.receive({ method: 'turn/completed', params: { threadId: 'thread-1', turn: testTurn('completed', 'new-turn') } });
  const followup = prepared.provider.send('thread-1', 'matching completion permits input');
  script.replyLast({ turn: testTurn('inProgress', 'next-turn') });
  await expect(followup).resolves.toMatchObject({ id: 'next-turn' });
});

test.each(['idle', 'active'])('prepared consumer preserves status-only activity after rejected input despite fresh %s history', async history => {
  const script = scriptForPreparation({
    turn: () => undefined,
    history: testThread({ status: { type: history }, turns: history === 'active' ? [testTurn('inProgress', 'other-turn')] : [] }),
  });
  const prepared = await prepareCoordinatorProvider(inputs(), script.provider);
  script.receive({ method: 'thread/status/changed', params: { threadId: 'thread-1', status: { type: 'idle' } } });
  const send = prepared.provider.send('thread-1', 'input');
  const submission = script.written.at(-1)!.id!;
  script.receive({ method: 'thread/status/changed', params: { threadId: 'thread-1', status: { type: 'active' } } });
  script.receive({ id: submission, error: { code: -32000, message: 'thread already active' } });
  await expect(send).rejects.toMatchObject({ kind: 'rpc' });
  await expect(prepared.provider.readThread('thread-1')).resolves.toMatchObject({ status: 'active' });
  await expect(prepared.provider.send('thread-1', 'must refuse busy')).rejects.toMatchObject({ kind: 'busy' });
  expect(script.written.filter(frame => frame.method === 'turn/start')).toHaveLength(1);
  if (history === 'active') await expect(prepared.provider.interrupt('thread-1', 'other-turn')).resolves.toMatchObject({ turnId: 'other-turn' });
  else await expect(prepared.provider.interrupt('thread-1', 'other-turn')).rejects.toMatchObject({ kind: 'stale-response' });
  script.receive({ method: 'thread/status/changed', params: { threadId: 'thread-1', status: { type: 'idle' } } });
  const next = prepared.provider.send('thread-1', 'authoritative idle permits input');
  script.replyLast({ turn: testTurn('inProgress', 'next-turn') });
  await expect(next).resolves.toMatchObject({ id: 'next-turn' });
});

test.each([false, true])('prepared consumer admits follow-up after terminal reply and same-ID start in one batch (following idle: %s)', async idle => {
  const script = scriptForPreparation({ turn: (transport, frame) => {
    if (script.written.filter(entry => entry.method === 'turn/start').length > 1) {
      transport.receive({ id: frame.id!, result: { turn: testTurn('inProgress', 'next-turn') } });
      return;
    }
    transport.receive({ id: frame.id!, result: { turn: testTurn('completed', 'finished-turn') } });
    transport.receive({ method: 'turn/started', params: { threadId: 'thread-1', turn: testTurn('inProgress', 'finished-turn') } });
    if (idle) transport.receive({ method: 'thread/status/changed', params: { threadId: 'thread-1', status: { type: 'idle' } } });
  } });
  const prepared = await prepareCoordinatorProvider(inputs(), script.provider);
  await expect(prepared.provider.send('thread-1', 'first')).resolves.toMatchObject({ id: 'finished-turn', status: 'completed' });
  await expect(prepared.provider.interrupt('thread-1', 'finished-turn')).rejects.toMatchObject({ kind: 'stale-response' });
  await expect(prepared.provider.readThread('thread-1')).resolves.toMatchObject({ status: 'idle', turns: [{ id: 'finished-turn', status: 'completed' }] });
  expect(script.written.some(frame => frame.method === 'turn/interrupt')).toBe(false);
  await expect(prepared.provider.send('thread-1', 'follow-up')).resolves.toMatchObject({ id: 'next-turn', status: 'inProgress' });
  expect(script.written.filter(frame => frame.method === 'turn/start')).toHaveLength(2);
  await prepared.provider.stop();
});
