/** Native startup crash fixture. No production fault-injection option exists. */
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { startCoordinatorHost } from '../coordinator-host.js';
import { CoordinatorStore } from '../coordinator-store.js';
import { coordinatorStartSchema } from '../coordinator-contracts.js';

const envelope = JSON.parse(await readFile(process.argv[2]!, 'utf8')) as { options: unknown; id: string; guardian: { path: string; generation: string }; marker: string; stage: 'before-admission' | 'after-admission' | 'listener-failure' };
await unlink(process.argv[2]!);
const mark = () => writeFile(envelope.marker, JSON.stringify({ id: envelope.id, pid: process.pid, stage: envelope.stage }));
const hold = async () => { await mark(); await new Promise<void>(() => { setInterval(() => undefined, 1000); }); };
const flush = CoordinatorStore.prototype.flush;
let first = true;
CoordinatorStore.prototype.flush = async function () {
  if (!first) return flush.call(this);
  first = false;
  if (envelope.stage === 'before-admission') await hold();
  await flush.call(this);
  if (envelope.stage === 'after-admission') await hold();
};
try {
  const host = await startCoordinatorHost(coordinatorStartSchema.parse(envelope.options), {
    id: envelope.id, guardian: envelope.guardian, runtime: { close: async () => undefined },
    listen: async () => { await mark(); throw new Error('Scripted listener bind failure'); },
    provider: () => { throw new Error('Publication fixture must never construct a provider'); },
  });
  await host.ready; await host.closed;
} catch (error) { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 2; }
