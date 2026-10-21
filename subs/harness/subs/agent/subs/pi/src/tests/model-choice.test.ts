import { afterEach, beforeAll, expect, test, vi } from 'vitest';
import { ModelRuntime } from '@earendil-works/pi-coding-agent';
import { nativeText, preservingPi } from './helpers/session.js';
import { chooseModel, piReadiness } from '../pi-agent.js';
const cleanups: Array<() => Promise<void>> = [];
beforeAll(() => { process.env.PI_OFFLINE = '1'; });
afterEach(async () => { vi.restoreAllMocks(); for (const cleanup of cleanups.splice(0).reverse()) await cleanup(); });
test('an explicitly requested thinking level reaches the native supported request', async () => {
  const f = await preservingPi(cleanups, [[nativeText('Done')]], { model: 'openai-codex/gpt-5.6-sol:high' });
  await (await f.operations.continue(f.input())).settled(); expect(f.native.requests[0]!['reasoning']).toMatchObject({ effort: 'high' }); f.native.verify();
});
test('an unknown model is unavailable before native request dispatch', async () => {
  const f = await preservingPi(cleanups, [], { model: 'unavailable/no-model' });
  const result = await (await f.operations.continue(f.input())).settled(); expect(result.status).toBe('unavailable'); expect(f.native.dispatches()).toBe(0); expect(result.point).toBeNull();
});
test('implicit selection skips credentialed models without native preservation and retains catalog order', async () => {
  type Model = NonNullable<ReturnType<ModelRuntime['getModel']>>;
  const model = (id: string, compatible: boolean): Model => ({
    provider: 'openai', id, api: 'openai-responses',
    compat: compatible ? { supportsAdditionalTools: true, supportsMidConvoSystemMessages: true } : { supportsStrictMode: true },
  }) as Model;
  const first = model('unsupported', false);
  const supported = model('supported', true);
  const later = model('later', true);
  const runtime = (available: Model[]) => ({
    getAvailable: async () => available,
    getModels: () => available,
    hasConfiguredAuth: () => true,
  }) as unknown as ModelRuntime;
  await expect(chooseModel(runtime([first, supported, later]), undefined)).resolves.toEqual({ model: supported, thinkingLevel: undefined });
  await expect(chooseModel(runtime([first, supported]), 'openai/unsupported')).resolves.toEqual({ model: first, thinkingLevel: undefined });
  await expect(chooseModel(runtime([first]), undefined)).rejects.toThrow(/no credentialed model supporting native appended tools/);
});

test('readiness rejects an explicitly selected incompatible model without substituting a compatible one', async () => {
  type Model = NonNullable<ReturnType<ModelRuntime['getModel']>>;
  const model = (id: string, compatible: boolean): Model => ({
    provider: 'openai', id, api: 'openai-responses',
    compat: compatible ? { supportsAdditionalTools: true, supportsMidConvoSystemMessages: true } : { supportsStrictMode: true },
  }) as Model;
  const incompatible = model('incompatible', false);
  const compatible = model('compatible', true);
  const runtime = {
    getAvailable: async () => [incompatible, compatible],
    getModels: () => [incompatible, compatible],
    hasConfiguredAuth: () => true,
  } as unknown as ModelRuntime;
  vi.spyOn(ModelRuntime, 'create').mockResolvedValue(runtime);

  await expect(piReadiness({ model: 'openai/incompatible' })).resolves.toEqual({
    ready: false,
    reason: 'openai/incompatible: Model does not declare native appended tools and later system messages',
  });
  await expect(piReadiness()).resolves.toEqual({ ready: true, model: 'openai/compatible' });
});
