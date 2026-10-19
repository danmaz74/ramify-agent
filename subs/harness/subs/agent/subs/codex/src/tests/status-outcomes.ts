import { expect, vi } from 'vitest';
import { ScriptedCodex, testSession, testThread, testTurn } from './scripted.js';

type Status = 'active' | 'idle' | 'systemError' | 'notLoaded';
type Outcome = 'rejected' | 'running' | 'completed' | 'uncertain';

// Expected public state by outcome and provider observation position. Keep this
// oracle declarative: the implementation's revisions/fields are not inspected.
const expected: Record<Outcome, Record<'before' | 'after', Record<Status, Status>>> = {
  rejected: { before: { active: 'active', idle: 'idle', systemError: 'systemError', notLoaded: 'notLoaded' }, after: { active: 'active', idle: 'idle', systemError: 'systemError', notLoaded: 'notLoaded' } },
  running: { before: { active: 'active', idle: 'active', systemError: 'active', notLoaded: 'active' }, after: { active: 'active', idle: 'active', systemError: 'systemError', notLoaded: 'notLoaded' } },
  completed: { before: { active: 'idle', idle: 'idle', systemError: 'systemError', notLoaded: 'notLoaded' }, after: { active: 'active', idle: 'idle', systemError: 'systemError', notLoaded: 'notLoaded' } },
  uncertain: { before: { active: 'active', idle: 'active', systemError: 'systemError', notLoaded: 'notLoaded' }, after: { active: 'active', idle: 'active', systemError: 'systemError', notLoaded: 'notLoaded' } },
};

/** Public-API status/outcome probe, also used by the separate exhaustive suite. */
export async function checkStatusOutcome(outcome: Outcome, status: Status, position: 'before' | 'after', history: 'idle' | 'active'): Promise<void> {
  const context = `${outcome}: status ${status} ${position} reply/timeout; fresh ${history} history`;
  vi.useFakeTimers();
  const script = new ScriptedCodex();
  try {
    await script.initialize();
    const start = script.provider.startThread({ cwd: '/target', model: 'gpt-6-astra' });
    script.replyLast(testSession());
    await start;
    const observe = (type: Status) => script.receive({ method: 'thread/status/changed', params: { threadId: 'thread-1', status: { type } } });
    observe('idle');
    const send = script.provider.send('thread-1', 'submitted input');
    const settled = send.then(value => ({ value }), error => ({ error }));
    const submission = script.written.at(-1)!.id!;
    if (position === 'before') observe(status);
    if (outcome === 'uncertain') await vi.advanceTimersByTimeAsync(1001);
    else if (outcome === 'rejected') script.receive({ id: submission, error: { code: -32000, message: 'submission rejected' } });
    else script.receive({ id: submission, result: { turn: testTurn(outcome === 'running' ? 'inProgress' : 'completed', 'submitted') } });
    // Dispatch without yielding: a notification after the reply frame can run
    // before the async send continuation, just as native line framing permits.
    if (position === 'after') observe(status);
    const result = await settled;
    if (outcome === 'rejected' || outcome === 'uncertain') expect(result, context).toMatchObject({ error: { kind: outcome === 'rejected' ? 'rpc' : 'uncertain' } });
    else expect(result, context).toMatchObject({ value: { id: 'submitted', status: outcome === 'running' ? 'inProgress' : 'completed' } });
    const read = script.provider.readThread('thread-1');
    script.replyLast({ thread: testThread({ status: { type: history }, turns: history === 'active' ? [testTurn('inProgress', 'submitted')] : [] }) });
    const current = expected[outcome][position][status];
    await expect(read, context).resolves.toMatchObject({ status: current });
    if (current === 'idle') {
      const next = script.provider.send('thread-1', 'follow-up after settled idle');
      script.replyLast({ turn: testTurn('inProgress', 'next') });
      await expect(next, context).resolves.toMatchObject({ id: 'next' });
      expect(script.written.filter(frame => frame.method === 'turn/start'), context).toHaveLength(2);
    } else {
      await expect(script.provider.send('thread-1', 'must not emit another input'), context).rejects.toMatchObject({ kind: current === 'notLoaded' ? 'unavailable' : 'busy' });
      expect(script.written.filter(frame => frame.method === 'turn/start'), context).toHaveLength(1);
    }
    if (outcome === 'uncertain') {
      // Identity-free idle cannot prove the lost submission was rejected.
      observe('idle');
      await expect(script.provider.send('thread-1', 'do not replay'), context).rejects.toMatchObject({ kind: 'busy' });
      expect(script.written.filter(frame => frame.method === 'turn/start'), context).toHaveLength(1);
    }
  } finally {
    await script.provider.stop();
    vi.useRealTimers();
  }
}
