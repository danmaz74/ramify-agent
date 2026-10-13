import { afterEach, beforeAll, expect, test } from 'vitest';
import { nativeText, preservingPi } from './helpers/session.js';
const cleanups: Array<() => Promise<void>> = [];
beforeAll(() => { process.env.PI_OFFLINE = '1'; });
afterEach(async () => { for (const cleanup of cleanups.splice(0).reverse()) await cleanup(); });
test('legacy forbidden policy remains readable while native execution is enabled', async () => {
  const f = await preservingPi(cleanups, [[nativeText('Done')]]); await (await f.operations.continue(f.input())).settled();
  expect(f.events.filter(event => event.type === 'compaction')).toEqual([]); expect(f.native.requests[0]!['instructions']).toBe('Exact role instructions.'); f.native.verify();
});
test('native execution preserves history when compaction is unnecessary', async () => {
  const policy = { context: { compaction: 'allowed' as const, budgetTokens: null, budgetFraction: null, reportReserveTokens: 0 }, authority: {}, validator: {}, destination: {} };
  const f = await preservingPi(cleanups, [[nativeText('Done with preserved history')]], { policy }); const result = await (await f.operations.continue(f.input())).settled();
  expect(result.status).toBe('completed'); expect(f.events.filter(event => event.type === 'compaction')).toEqual([]); expect((await f.operations.inspect('pi-test', result.sessionId))!.policy.context.compaction).toBe('allowed'); f.native.verify();
});
