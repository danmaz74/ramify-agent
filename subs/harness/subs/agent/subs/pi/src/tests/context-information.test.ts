import { afterEach, beforeAll, expect, test } from 'vitest';
import { contextInformation } from '../context-information.js';
import { decodePreservedTranscript } from '../preservation.js';
import { nativeCall, preservingPi } from './helpers/session.js';

const cleanups: Array<() => Promise<void>> = [];
beforeAll(() => { process.env.PI_OFFLINE = '1'; });
afterEach(async () => { for (const cleanup of cleanups.splice(0).reverse()) await cleanup(); });

test('headroom excludes the compaction reserve and cannot become a negative allowance', () => {
  expect(contextInformation({ contextWindow: 100000, tokens: 70000, percent: 70 }, 16000))
    .toBe('You have 14000 tokens left in this context window.');
  expect(contextInformation({ contextWindow: 100000, tokens: 99000, percent: 99 }, 16000))
    .toBe('You have 0 tokens left in this context window.');
});

test('missing occupancy is unknown rather than a fresh full context window', () => {
  const afterCompaction = contextInformation({ contextWindow: 100000, tokens: null, percent: null }, 16000);
  expect(afterCompaction).toBe('You have unknown tokens left in this context window.');
  expect(contextInformation(undefined, 16000)).toBe('You have unknown tokens left in this context window.');
});

test('Codex requests receive durable developer context estimates refreshed from provider usage, without a task cap', async () => {
  const policy = { context: { compaction: 'forbidden' as const, budgetTokens: 27000, budgetFraction: null, reportReserveTokens: 1000 }, authority: {}, validator: {}, destination: {} };
  const tool = { name: 'evidence', description: 'Read evidence.', inputSchema: { type: 'object' }, async execute() { return { text: 'Evidence.' }; } };
  const f = await preservingPi(cleanups, [[nativeCall('evidence', {})], [nativeCall('submit_map', { summary: 'Done' })]], {
    tools: [tool], policy, model: 'openai-codex/gpt-5.6-sol:medium',
    nativeOptions: { contextWindow: 100000, usage: { input_tokens: 30000, output_tokens: 100 } },
    nativeCompaction: { reserveTokens: 4096 },
  });
  const result = await (await f.operations.continue(f.input())).settled();
  expect(result.outcome?.kind).toBe('submitted');
  const notices = f.native.wireRequests.map(request => {
    expect(request['instructions']).toBe('Exact role instructions.');
    expect(request).not.toHaveProperty('max_output_tokens');
    expect(request['reasoning']).toMatchObject({ effort: 'medium' });
    const last = (request['input'] as Array<{ role: string; content: string }>).at(-1)!;
    expect(last.role).toBe('developer');
    expect(last.content).toMatch(/^You have \d+ tokens left in this context window\.$/);
    const remaining = Number(/^You have (\d+) tokens/.exec(last.content)![1]);
    const used = 100000 - 4096 - remaining;
    return { content: last.content, used };
  });
  expect(notices[0]!.used).toBeLessThan(1000);
  expect(notices[1]!.used).toBeGreaterThanOrEqual(30100);
  expect(notices[1]!.used).toBeLessThan(31000);
  const firstInput = f.native.wireRequests[0]!['input'] as unknown[];
  expect((f.native.wireRequests[1]!['input'] as unknown[]).slice(0, firstInput.length)).toEqual(firstInput);
  const snapshot = (await f.operations.inspect('pi-test', result.sessionId))!;
  const entry = snapshot.transcript.filter(item => item.key.includes(':pi-state:')).at(-1)!;
  const state = decodePreservedTranscript(f.payloads.get(entry.payloadId)!);
  for (const notice of notices) {
    expect(state.messages).toContainEqual(expect.objectContaining({ role: 'system', content: notice.content }));
    expect(state.nativeEntries).toContainEqual(expect.objectContaining({ type: 'message', message: expect.objectContaining({ role: 'system', content: notice.content }) }));
  }
  f.native.verify();
});
