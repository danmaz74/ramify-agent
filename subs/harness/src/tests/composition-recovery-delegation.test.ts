import { afterEach, describe, test, vi } from 'vitest';
import { machineNames, rowsFor, verifyRow } from './helpers/recovery-table.js';
import { expectNoProcesses, forgetExternalTools } from './helpers/external-tools.js';

vi.mock('node:child_process', async original =>
  (await import('./helpers/process-guard.js')).guardedChildProcess(await original<typeof import('node:child_process')>()));

afterEach(() => {
  try { expectNoProcesses(); } finally { forgetExternalTools(); }
});

/*
 * The composed recovery table (T1), for the rows whose scenario is a
 * delegation. Each row crashes its scenario after one durable boundary, deletes every
 * record file the log commits, restarts twice without an execution port or
 * network, and holds the recovered state to the checks in
 * `helpers/recovery-table.ts`. Git and the commands readiness would spawn
 * are answered rather than run, by answers the scenario states and the crash
 * and both restarts share. The rows are split across three files only
 * so that they run in parallel; `rowsFor` in `helpers/recovery-table.ts`
 * splits the table so that together they run all of it.
 */


describe('the composed recovery table: a delegation', () => {
  for (const row of rowsFor('delegation')) {
    test(`${row.name} (${row.machines.map(machine => `${machine}, ${machineNames[machine]}`).join('; ')}): ${row.stated}`, async () => {
      await verifyRow(row);
    }, 300_000);
  }
});
