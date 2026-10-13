import { afterEach, beforeAll, expect, test } from 'vitest';
import { roleSchema } from '../../../../../../src/interfaces/protocol/runs.js';
import { nativeCall, nativeText, preservingPi } from './helpers/session.js';

const cleanups: Array<() => Promise<void>> = [];
beforeAll(() => { process.env.PI_OFFLINE = '1'; });
afterEach(async () => { for (const cleanup of cleanups.splice(0).reverse()) await cleanup(); });
const paths = ['fresh', 'continue', 'fork', 'reconstruction'] as const;
const cases = roleSchema.options.flatMap(role => paths.map(path => ({ role, path })));

// Each path crosses one native threshold and completes one current submission.
// Provider responses are scripted; this establishes installed Pi behavior, not
// real provider acceptance, cache benefit or consumer-specific reconciliation.
test.each(cases)('$role $path keeps the current task through native compaction', async ({ role, path }) => {
  const history = path === 'continue' || path === 'fork';
  const evidence = { name: 'evidence', description: 'Read current task evidence.', inputSchema: { type: 'object' },
    async execute() { return { text: 'Frozen candidate, original need and pending findings. '.repeat(220) }; } };
  const outputs = [...history ? [[nativeText('Earlier orientation')]] : [],
    [nativeCall('evidence', {}, 'evidence')], [nativeText('Original need; current authority; pending finding cf-0003.')],
    [nativeText('Candidate and qualification obligation remain pending.')], [nativeCall('submit_map', { summary: `${role} completed ${path}` })]];
  const f = await preservingPi(cleanups, outputs, { tools: [evidence], nativeOptions: { contextWindow: 2048 },
    nativeCompaction: { reserveTokens: 128, keepRecentTokens: 64 },
    policy: { context: { compaction: 'allowed', budgetTokens: null, budgetFraction: null, reportReserveTokens: 0 },
      authority: { role, write: role.includes('engineer') }, validator: { candidate: 'frozen-candidate' }, destination: { task: 'pending-finding' } } });
  const task = { ...f.task, role, message: 'Original need; pending finding cf-0003; qualify frozen-candidate; current authority only.' };
  const bindings = { ...f.bindings, task };
  let point = f.initial.point!;
  if (history) point = (await (await f.operations.continue(f.input(point, 'orientation', bindings))).settled()).point!;
  if (path === 'fork') point = (await f.operations.fork({ runId: 'pi-test', operationId: 'fork', sourcePoint: point })).point!;
  if (path === 'reconstruction') {
    // The caller names fresh reconstruction from original instructions/task.
    // This is the adapter entrypoint; service-level reconstruction is witnessed
    // separately because it must reconcile effects and authenticate the source.
    point = (await f.operations.create({ runId: 'pi-test', operationId: 'reconstruct', initialInstructions: 'Exact role instructions.',
      declarations: f.declarations, activate: f.declarations.map(item => item.name), policy: f.policy })).point!;
  }
  const result = await (await f.operations.continue(f.input(point, 'current-task', bindings))).settled();
  expect(result.outcome).toEqual({ kind: 'submitted', input: { summary: `${role} completed ${path}` } });
  expect(result.sessionId).toBe(point.sessionId);
  expect(f.events.filter(event => event.type === 'compaction')).toMatchObject([
    { phase: 'started', reason: 'threshold' }, { phase: 'ended', reason: 'threshold', aborted: false, errorText: null }]);
  expect(f.judged).toEqual([{ summary: `${role} completed ${path}` }]);
  expect(f.native.requests.at(-1)!['instructions']).toBe('Exact role instructions.');
  f.native.verify();
});

test('failed installed compaction admits caller reconstruction from durable original task and preserves old request evidence', async () => {
  const evidence = { name: 'evidence', description: 'Read retained candidate.', inputSchema: { type: 'object' },
    async execute() { return { text: 'Retained candidate and pending finding cf-0003. '.repeat(260) }; } };
  const f = await preservingPi(cleanups, [[nativeCall('evidence', {}, 'evidence')], { error: 'Summary provider unavailable' },
    [nativeCall('submit_map', { summary: 'Original task completed from durable source' })]], {
    tools: [evidence], nativeOptions: { contextWindow: 2048 }, nativeCompaction: { reserveTokens: 128, keepRecentTokens: 64 } });
  const task = { ...f.task, message: 'Original need: correct cf-0003 then qualify the current candidate.' };
  const bindings = { ...f.bindings, task };
  const failed = await (await f.operations.continue(f.input(f.initial.point!, 'original-task', bindings))).settled();
  expect(failed.outcome).toMatchObject({ kind: 'resource-pending', resource: 'context' });
  const original = await f.store.read('pi-test', 'operation:original-task');
  expect(original?.schema).toBe('ramify-agent.session-operation/1');
  const originalTask = structuredClone((original!.body['input'] as { task: typeof task }).task);
  expect(originalTask.message).toBe(task.message);
  const before = new Map([...f.payloads].map(([id, bytes]) => [id, new Uint8Array(bytes)]));
  const successor = await f.operations.create({ runId: 'pi-test', operationId: 'source-backed-successor',
    initialInstructions: 'Exact role instructions.', declarations: f.declarations, activate: f.declarations.map(item => item.name), policy: f.policy });
  const reconstructed = { ...bindings, task: originalTask };
  const result = await (await f.operations.continue(f.input(successor.point!, 'recovered-task', reconstructed))).settled();
  expect(result.outcome).toMatchObject({ kind: 'submitted' });
  expect(result.sessionId).not.toBe(failed.sessionId);
  expect(f.judged).toHaveLength(1);
  for (const [id, bytes] of before) expect(f.payloads.get(id)).toEqual(bytes);
  expect(JSON.stringify(f.native.requests.at(-1)!['input'])).toContain('correct cf-0003');
  f.native.verify();
});
