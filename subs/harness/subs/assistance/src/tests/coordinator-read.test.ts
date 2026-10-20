import { readFile } from 'node:fs/promises';
import { beforeEach, expect, test, vi } from 'vitest';
import { readCoordinator } from '../coordinator-store.js';

vi.mock('node:fs/promises', async original => ({ ...await original<typeof import('node:fs/promises')>(), readFile: vi.fn() }));
const id = 'coord-11111111-1111-1111-1111-111111111111';
const starting = { schema: 'ramify-agent.coordinator/1', id, generation: 'generation', projectRoot: '/target', phase: 'starting', endpoint: null };
const runtime = { id, generation: starting.generation, endpoint: 'http://127.0.0.1:12345', token: 'private-runtime-token' };
const ready = { ...starting, endpoint: runtime.endpoint, phase: 'ready' };
const reads = (...values: readonly unknown[]) => { for (const value of values) vi.mocked(readFile).mockResolvedValueOnce(JSON.stringify(value)); };
beforeEach(() => vi.resetAllMocks());

test('a reader spanning startup publication rereads the observation and adopts only the matching runtime', async () => {
  reads(starting, runtime, ready);
  expect(await readCoordinator('/target', id)).toEqual({ record: ready, runtime });
  expect(readFile).toHaveBeenCalledTimes(3);
});

test('an incomplete same-generation startup remains unavailable without using its unpublished runtime', async () => {
  reads(starting, runtime, starting);
  expect(await readCoordinator('/target', id)).toEqual({ record: starting, runtime: null });
});

test.each([
  { record: starting, live: { ...runtime, generation: 'other-generation' }, reread: ready },
  { record: starting, live: runtime, reread: { ...ready, generation: 'other-generation' } },
  { record: starting, live: runtime, reread: { ...ready, id: 'coord-22222222-2222-2222-2222-222222222222' } },
  { record: ready, live: { ...runtime, endpoint: 'http://127.0.0.1:54321' }, reread: ready },
  { record: { ...ready, endpoint: null }, live: runtime, reread: { ...ready, endpoint: null } },
])('startup tolerance never masks identity or established endpoint conflicts: %j', async ({ record, live, reread }) => {
  reads(record, live, reread);
  await expect(readCoordinator('/target', id)).rejects.toThrow(/identity differs/);
});

test('absence of the runtime is an unavailable observation rather than a fabricated listener', async () => {
  reads(starting); vi.mocked(readFile).mockRejectedValueOnce(Object.assign(new Error('missing runtime'), { code: 'ENOENT' }));
  expect(await readCoordinator('/target', id)).toEqual({ record: starting, runtime: null });
});
