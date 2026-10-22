import { afterEach, beforeAll, expect, test } from 'vitest';
import { nativeCall, preservingPi } from './helpers/session.js';
import { checkRoleContinuity, continuityPaths } from './helpers/role-continuity.js';

const cleanups: Array<() => Promise<void>> = [];
beforeAll(() => { process.env.PI_OFFLINE = '1'; });
afterEach(async () => { for (const cleanup of cleanups.splice(0).reverse()) await cleanup(); });
const cases = (['engineer', 'reviewer'] as const).flatMap(role => continuityPaths.map(path => ({ role, path })));

// Every role crosses the same paths in all-role-continuity.stress.ts.
test.each(cases)('$role $path keeps the current task through native compaction', async ({ role, path }) => checkRoleContinuity(cleanups, role, path));

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
