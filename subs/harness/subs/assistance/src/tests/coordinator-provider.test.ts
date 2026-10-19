import { expect, test } from 'vitest';
import { prepareCoordinatorProvider } from '../coordinator-provider.js';
import { ScriptedCodex, testSession, testTurn } from '../../../agent/subs/codex/src/tests/scripted.js';

function scriptForPreparation(options: { ephemeral?: boolean; missingTools?: boolean; nativeWorkers?: string } = {}) {
  const script = new ScriptedCodex(frame => {
    if (frame.method === 'initialized') return;
    const answers: Record<string, unknown> = {
      initialize: { userAgent: 'codex/0.161.0', codexHome: '/persistent', platformOs: 'linux' },
      'model/list': { data: [{ model: 'gpt-6-astra', multiAgentVersion: options.nativeWorkers ?? 'v2' }, { model: 'gpt-6-sol', multiAgentVersion: 'v2' }], nextCursor: null },
      'experimentalFeature/list': { data: [{ name: 'multi_agent', enabled: true }], nextCursor: null },
      'mcpServerStatus/list': { data: [{ name: 'assessment', tools: options.missingTools ? {} : { job_detail: {}, iteration_assess: {} }, toolsError: null }], nextCursor: null },
      'config/read': { config: { model: 'gpt-6-astra', approval_policy: 'on-request', sandbox_mode: 'workspace-write' } },
      'thread/start': testSession({ ephemeral: options.ephemeral ?? false }),
      'thread/resume': testSession(),
      'turn/start': { turn: testTurn() },
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
