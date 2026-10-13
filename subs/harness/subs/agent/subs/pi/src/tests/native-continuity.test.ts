import { afterEach, beforeAll, expect, test } from 'vitest';
import { nativeCall, nativeText, preservingPi, until } from './helpers/session.js';
import { decodePreservedTranscript } from '../preservation.js';
const cleanups: Array<() => Promise<void>> = [];
beforeAll(() => { process.env.PI_OFFLINE = '1'; });
afterEach(async () => { for (const cleanup of cleanups.splice(0).reverse()) await cleanup(); });
const largeTool = { name: 'evidence', description: 'Read evidence.', inputSchema: { type: 'object' }, async execute() { return { text: 'Retained evidence. '.repeat(600) }; } };
const nativeOptions = { contextWindow: 2048 };
const nativeCompaction = { reserveTokens: 128, keepRecentTokens: 64 };
test('installed native compaction persists its request and boundary and continues the same task', async () => {
  const f = await preservingPi(cleanups, [[nativeCall('evidence', {}, 'evidence')], [nativeText('Original need and retained evidence, with submission still pending.')], [nativeText('Earlier turn context retained, current evidence remains available.')], [nativeCall('submit_map', { summary: 'Completed after compaction' })]], { tools: [largeTool], nativeOptions, nativeCompaction });
  const result = await (await f.operations.continue(f.input())).settled();
  expect(result.reason).toBeNull();
  expect(result.outcome).toEqual({ kind: 'submitted', input: { summary: 'Completed after compaction' } });
  expect(f.events.filter(event => event.type === 'compaction')).toMatchObject([{ phase: 'started', reason: 'threshold' }, { phase: 'ended', reason: 'threshold', aborted: false, errorText: null }]);
  const snapshot = await f.operations.inspect('pi-test', result.sessionId);
  const states = snapshot!.transcript.filter(item => item.kind === 'provider' && item.key.includes(':pi-state:')).map(item => decodePreservedTranscript(f.payloads.get(item.payloadId)!));
  expect(states.some(state => state.nativeEntries?.some(entry => entry.type === 'compaction'))).toBe(true);
  const requests = snapshot!.transcript.filter(item => item.kind === 'provider' && item.key.includes(':pi-request:')).map(item => JSON.parse(new TextDecoder().decode(f.payloads.get(item.payloadId)!)));
  expect(requests.map(item => item.purpose)).toEqual(['task', 'compaction', 'compaction', 'task']);
  expect(requests[1].instructions).not.toBe('Exact role instructions.');
  expect(requests[3].instructions).toBe('Exact role instructions.');
  expect(f.judged).toEqual([{ summary: 'Completed after compaction' }]); f.native.verify();
});
test('failed native compaction leaves durable pending work and original request evidence', async () => {
  const f = await preservingPi(cleanups, [[nativeCall('evidence', {}, 'evidence')], { error: 'Context length exceeded' }], { tools: [largeTool], nativeOptions, nativeCompaction });
  const result = await (await f.operations.continue(f.input())).settled();
  expect(result.outcome).toMatchObject({ kind: 'resource-pending', resource: 'context' });
  expect(f.events.filter(event => event.type === 'compaction' && event.phase === 'ended')).toMatchObject([{ errorText: expect.stringContaining('Auto-compaction failed') }]);
  expect(f.judged).toEqual([]); f.native.verify();
});
test('stop fences a native compaction request and drains its abort', async () => {
  const f = await preservingPi(cleanups, [[nativeCall('evidence', {}, 'evidence')], null], { tools: [largeTool], nativeOptions, nativeCompaction });
  const handle = await f.operations.continue(f.input());
  await until(() => f.native.dispatches() === 2);
  await handle.stop();
  expect((await handle.settled()).outcome).toMatchObject({ kind: 'stopped' });
  expect(f.judged).toEqual([]); f.native.verify();
});
test('Pi native overflow recovery continues after the rejected request', async () => {
  const f = await preservingPi(cleanups, [[nativeCall('evidence', {}, 'evidence')], { error: 'exceeds the context window' }, [nativeText('Original task, pending submission.')], [nativeText('Retained earlier turn.')], [nativeCall('submit_map', { summary: 'Recovered overflow' })]], { tools: [largeTool], nativeOptions: { contextWindow: 8192 }, nativeCompaction });
  const result = await (await f.operations.continue(f.input())).settled();
  expect(result.outcome).toEqual({ kind: 'submitted', input: { summary: 'Recovered overflow' } });
  expect(f.events.filter(event => event.type === 'compaction')).toMatchObject([{ phase: 'started', reason: 'overflow' }, { phase: 'ended', reason: 'overflow', aborted: false, errorText: null }]);
  expect(f.judged).toHaveLength(1); f.native.verify();
});
test('the former 188000 harness trigger leaves native model capacity usable', async () => {
  const f = await preservingPi(cleanups, [[nativeCall('submit_map', { summary: 'Pending correction handled' })]], { nativeOptions: { contextWindow: 272000, usage: { input_tokens: 205728, output_tokens: 1 } }, policy: { context: { compaction: 'forbidden', budgetTokens: 150000, budgetFraction: 0.75, reportReserveTokens: 16000 }, authority: {}, validator: {}, destination: {} } });
  const result = await (await f.operations.continue(f.input())).settled();
  expect(result.outcome?.kind).toBe('submitted');
  expect(f.events.filter(event => event.type === 'compaction')).toEqual([]);
  expect(f.events.find(event => event.type === 'context-observed')).toMatchObject({ tokens: expect.any(Number), window: 272000, native: { compaction: { enabled: true, reserveTokens: 16384 } } }); f.native.verify();
});
test('compaction leaves old payload bytes intact and an older fork uses its retained source', async () => {
  const f = await preservingPi(cleanups, [[nativeText('Before compaction')], [nativeCall('evidence', {}, 'evidence')], [nativeText('Later compacted summary.')], [nativeText('Later turn checkpoint.')], [nativeCall('submit_map', { summary: 'Parent finished' })], [nativeCall('submit_map', { summary: 'Older fork finished' })]], { tools: [largeTool], nativeOptions, nativeCompaction });
  const earlier = await (await f.operations.continue(f.input())).settled();
  const before = new Map([...f.payloads].map(([id, bytes]) => [id, new Uint8Array(bytes)]));
  const parent = await (await f.operations.continue(f.input(earlier.point!, 'later'))).settled();
  expect(parent.outcome?.kind).toBe('submitted');
  for (const [id, bytes] of before) expect(f.payloads.get(id)).toEqual(bytes);
  const child = await f.operations.fork({ runId: 'pi-test', operationId: 'older-fork', sourcePoint: earlier.point! });
  expect((await (await f.operations.continue(f.input(child.point!, 'child'))).settled()).outcome?.kind).toBe('submitted');
  const inherited = JSON.stringify(f.native.requests.at(-1)!['input']);
  expect(inherited).toContain('Before compaction');
  expect(inherited).not.toContain('Later compacted summary');
  expect(inherited).not.toContain('Retained evidence');
  f.native.verify();
});
test('compaction model requests cannot cross revoked dispatch authority', async () => {
  const f = await preservingPi(cleanups, [[nativeCall('evidence', {}, 'evidence')]], { tools: [largeTool], nativeOptions, nativeCompaction });
  const bindings = { ...f.bindings, currentAuthority: async () => !f.events.some(event => event.type === 'compaction' && event.phase === 'started') };
  const result = await (await f.operations.continue(f.input(f.initial.point!, 'task', bindings))).settled();
  expect(result.outcome?.kind).toBe('failed');
  expect(f.native.dispatches()).toBe(1); expect(f.judged).toEqual([]); f.native.verify();
});
test('overflow rejection and failed native summary remain causal pending evidence', async () => {
  const f = await preservingPi(cleanups, [[nativeCall('evidence', {}, 'evidence')], { error: 'exceeds the context window' }, { error: 'Summary provider unavailable' }], { tools: [largeTool], nativeOptions: { contextWindow: 8192 }, nativeCompaction });
  const result = await (await f.operations.continue(f.input())).settled();
  expect(result.outcome).toMatchObject({ kind: 'resource-pending', resource: 'context', reason: expect.stringContaining('Context overflow recovery failed') });
  expect(f.events.some(event => event.type === 'message' && event.role === 'assistant' && event.detail.error?.includes('exceeds the context window'))).toBe(true);
  expect(f.events.some(event => event.type === 'compaction' && event.phase === 'ended' && event.errorText?.includes('Summary provider unavailable'))).toBe(true);
  expect(f.judged).toEqual([]); f.native.verify();
});
test('native overflow without a usable compaction preparation remains pending', async () => {
  const f = await preservingPi(cleanups, [{ error: 'exceeds the context window' }]);
  const result = await (await f.operations.continue(f.input())).settled();
  expect(result.outcome).toMatchObject({ kind: 'resource-pending', resource: 'context', reason: expect.stringContaining('exceeds the context window') });
  expect(f.native.dispatches()).toBe(1); expect(f.judged).toEqual([]); f.native.verify();
});
