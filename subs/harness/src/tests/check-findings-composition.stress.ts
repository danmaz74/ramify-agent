import { afterAll, afterEach, describe, test, vi } from 'vitest';
import { forgetMemorySessionStores } from '../../subs/session-store/src/tests/helpers/memory-session-store.js';
import { recoverFromPrefixes } from './helpers/check-findings-recovery.js';
import { expectNoProcesses, forgetExternalTools } from './helpers/external-tools.js';

// The ordinary suite's memory session store, which this sweep was written against.
vi.mock('../../subs/session-store/src/session-store.js', async () => {
  const { openMemorySessionStore } = await import('../../subs/session-store/src/tests/helpers/memory-session-store.js');
  return { openSessionStore: openMemorySessionStore };
});
afterAll(forgetMemorySessionStores);
vi.mock('node:child_process', async original =>
  (await import('./helpers/process-guard.js')).guardedChildProcess(await original<typeof import('node:child_process')>()));

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  try {
    for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
    expectNoProcesses();
  } finally { forgetExternalTools(); }
});

describe('CF06 and CF07: a crash at every review, reconciliation and CheckFinding boundary of the composed run', () => {
  test('recovery without an execution agent from each prefix preserves pending work and identities, rebuilds records and projections, and a second restart changes nothing', async () => {
    await recoverFromPrefixes(cleanups, cuts => {
      if (cuts.length <= 40) throw new Error(`Only ${cuts.length} boundary cuts`);
      return [...cuts];
    });
  }, 600_000);
});
