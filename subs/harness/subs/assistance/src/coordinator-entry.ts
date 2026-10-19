import { readFile, unlink } from 'node:fs/promises';
import { coordinatorStartSchema } from './coordinator-contracts.js';
import { startCoordinatorHost } from './coordinator-host.js';

/** Detached child entry. Neither inherited stdin nor the launching shell owns it. */
async function run(): Promise<void> {
  const path = process.argv[2]; if (path === undefined) throw new Error('Missing private launch request');
  const options = coordinatorStartSchema.parse(JSON.parse(await readFile(path, 'utf8'))); await unlink(path);
  const host = await startCoordinatorHost(options);
  const stop = () => { void host.control({ action: 'stop', commandId: `signal:${host.store.record.generation}` }).catch(error => { console.error(error instanceof Error ? error.message : String(error)); }); };
  process.once('SIGTERM', stop); process.once('SIGINT', stop);
  await host.ready; await host.closed;
}
void run().catch(error => { console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 2; });
