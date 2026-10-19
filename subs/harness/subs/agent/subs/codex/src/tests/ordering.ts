import { expect } from 'vitest';
import { ScriptedCodex, testSession, testThread, testTurn } from './scripted.js';

/** Black-box sequence shared by small regressions and the opt-in permutation probe. */
export async function checkAdmissionOrdering(order: readonly string[], batch = false): Promise<void> {
  const context = `${batch ? 'one dispatch batch: ' : 'interleaved: '}${order.join(' -> ')}`;
  const script = new ScriptedCodex();
  await script.initialize();
  const resumed = script.provider.resumeThread('thread-1', { cwd: '/target', model: 'gpt-6-astra' });
  script.replyLast(testSession({ status: { type: 'active' }, turns: [testTurn('inProgress', 'old')] }));
  await resumed;
  script.receive({ method: 'thread/status/changed', params: { threadId: 'thread-1', status: { type: 'idle' } } });
  const send = script.provider.send('thread-1', 'new input');
  const submission = script.written.at(-1)!.id!;
  let acknowledged = false;
  let completed = false;
  for (const operation of order) {
    if (operation === 'ack') {
      script.receive({ id: submission, result: { turn: testTurn('inProgress', 'new') } });
      if (!batch) await expect(send, context).resolves.toMatchObject({ id: 'new', status: completed ? 'completed' : 'inProgress' });
      acknowledged = true;
    } else if (operation === 'idle') {
      script.receive({ method: 'thread/status/changed', params: { threadId: 'thread-1', status: { type: 'idle' } } });
    } else {
      const [identity, event] = operation.split('-');
      if ((identity !== 'old' && identity !== 'new') || (event !== 'start' && event !== 'complete')) throw new Error(`Unknown operation ${operation}`);
      script.receive({ method: event === 'start' ? 'turn/started' : 'turn/completed', params: { threadId: 'thread-1', turn: testTurn(event === 'start' ? 'inProgress' : 'completed', identity) } });
      if (identity === 'new' && event === 'complete') completed = true;
    }
    // Admission stays reserved before its correlated acknowledgement. Afterwards
    // only the new identity's terminal evidence permits another input.
    if (!batch && (!acknowledged || !completed)) {
      await expect(script.provider.send('thread-1', 'must stay busy'), context).rejects.toMatchObject({ kind: 'busy' });
    }
    if (!batch && acknowledged && !completed) {
      const interrupt = script.provider.interrupt('thread-1', 'new');
      script.replyLast({});
      await expect(interrupt, context).resolves.toMatchObject({ turnId: 'new' });
    }
    expect(script.written.filter(frame => frame.method === 'turn/start'), context).toHaveLength(1);
  }
  expect(acknowledged, context).toBe(true);
  if (batch) await expect(send, context).resolves.toMatchObject({ id: 'new', status: completed ? 'completed' : 'inProgress' });
  const read = script.provider.readThread('thread-1');
  script.replyLast({ thread: testThread({ status: { type: 'active' }, turns: [testTurn('inProgress', 'new')] }) });
  await expect(read, context).resolves.toMatchObject({ status: completed ? 'idle' : 'active' });
  if (!completed) {
    await expect(script.provider.send('thread-1', 'active history'), context).rejects.toMatchObject({ kind: 'busy' });
    const interrupt = script.provider.interrupt('thread-1', 'new');
    script.replyLast({});
    await expect(interrupt, context).resolves.toMatchObject({ turnId: 'new' });
    script.receive({ method: 'turn/completed', params: { threadId: 'thread-1', turn: testTurn('completed', 'new') } });
  }
  await expect(script.provider.interrupt('thread-1', 'new'), context).rejects.toMatchObject({ kind: 'stale-response' });
  const next = script.provider.send('thread-1', 'matching terminal proof permits follow-up');
  script.replyLast({ turn: testTurn('inProgress', 'next') });
  await expect(next, context).resolves.toMatchObject({ id: 'next' });
  expect(script.written.filter(frame => frame.method === 'turn/start'), context).toHaveLength(2);
  await script.provider.stop();
}

/** Terminal replies and notifications share exact-identity precedence. */
export async function checkTerminalReplyOrdering(order: readonly string[], expected: 'idle' | 'active' | 'systemError' | 'notLoaded', activeTurn: string | null = null, batch = true, terminal: 'completed' | 'interrupted' | 'failed' = 'completed'): Promise<void> {
  const context = `${terminal}, ${batch ? 'one dispatch batch' : 'interleaved'}: ${order.join(' -> ')}`;
  const script = new ScriptedCodex();
  await script.initialize();
  const start = script.provider.startThread({ cwd: '/target', model: 'gpt-6-astra' });
  script.replyLast(testSession());
  await start;
  const send = script.provider.send('thread-1', 'submitted input');
  const submission = script.written.at(-1)!.id!;
  for (const operation of order) {
    if (operation === 'ack') {
      script.receive({ id: submission, result: { turn: testTurn(terminal, 'submitted') } });
      if (!batch) await expect(send, context).resolves.toMatchObject({ id: 'submitted', status: terminal });
    } else if (operation === 'same-start' || operation === 'other-start' || operation === 'other-complete') {
      const completed = operation === 'other-complete';
      script.receive({ method: completed ? 'turn/completed' : 'turn/started', params: { threadId: 'thread-1', turn: testTurn(completed ? 'completed' : 'inProgress', operation === 'same-start' ? 'submitted' : 'other') } });
    } else if (['idle', 'active', 'systemError', 'notLoaded'].includes(operation)) {
      script.receive({ method: 'thread/status/changed', params: { threadId: 'thread-1', status: { type: operation } } });
    } else throw new Error(`Unknown operation ${operation}`);
  }
  await expect(send, context).resolves.toMatchObject({ id: 'submitted', status: terminal });
  await expect(script.provider.interrupt('thread-1', 'submitted'), context).rejects.toMatchObject({ kind: 'stale-response' });
  // Neither empty idle history nor a stale running entry can revive the exact
  // terminal identity or erase independent newer activity/provider failure.
  for (const snapshot of [testThread(), testThread({ status: { type: 'active' }, turns: [testTurn('inProgress', 'submitted')] })]) {
    const read = script.provider.readThread('thread-1');
    script.replyLast({ thread: snapshot });
    await expect(read, context).resolves.toMatchObject({ status: expected });
  }
  if (activeTurn !== null) {
    const interrupt = script.provider.interrupt('thread-1', activeTurn);
    script.replyLast({});
    await expect(interrupt, context).resolves.toMatchObject({ turnId: activeTurn });
  }
  if (expected !== 'idle') {
    await expect(script.provider.send('thread-1', 'preserve newer activity'), context).rejects.toMatchObject({ kind: expected === 'notLoaded' ? 'unavailable' : 'busy' });
    expect(script.written.filter(frame => frame.method === 'turn/start'), context).toHaveLength(1);
    if (activeTurn !== null) script.receive({ method: 'turn/completed', params: { threadId: 'thread-1', turn: testTurn('completed', activeTurn) } });
    script.receive({ method: 'thread/status/changed', params: { threadId: 'thread-1', status: { type: 'idle' } } });
  }
  const next = script.provider.send('thread-1', 'settled follow-up');
  script.replyLast({ turn: testTurn('inProgress', 'next') });
  await expect(next, context).resolves.toMatchObject({ id: 'next', status: 'inProgress' });
  expect(script.written.filter(frame => frame.method === 'turn/start'), context).toHaveLength(2);
  await script.provider.stop();
}
