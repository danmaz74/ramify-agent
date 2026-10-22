import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { runAcceptedHandback } from './helpers/acceptance-flow.js';
import { resetSpawnAttempts, spawnAttempts } from './helpers/process-guard.js';
vi.mock('node:child_process', async importOriginal => {
  const { guardedChildProcess } = await import('./helpers/process-guard.js');
  return guardedChildProcess(await importOriginal<typeof import('node:child_process')>());
});
const cleanups: Array<() => Promise<void>> = [];
beforeEach(resetSpawnAttempts);
afterEach(async () => {
  const failures: unknown[] = [];
  try {
    for (const cleanup of cleanups.splice(0).reverse()) {
      try { await cleanup(); } catch (error) { failures.push(error); }
    }
    if (failures.length > 0) throw new AggregateError(failures, 'Acceptance cleanup/response assertions failed');
  }
  finally { expect(spawnAttempts(), 'ordinary setup/flow/teardown attempted child processes').toEqual([]); }
});

test('CA08 CA11–CA15 CA17 CA25 CA30: scripted multi-owner migration, repair, handback and linked revision',
  () => runAcceptedHandback('revision', cleanups), 150_000);
test('CA28: deferred B entry receives accepted handback and replans from current source',
  () => runAcceptedHandback('deferred', cleanups), 150_000);
test('request, task and examples survive composed provider handback, consumer verification and reload',
  () => runAcceptedHandback('reload', cleanups), 150_000);
test('CA31: source drift after a passing combined gate cannot be handed back',
  () => runAcceptedHandback('drift', cleanups), 150_000);
test('CA17 CA19 CA28 CA30: restart after handback continues the original A assignment once',
  () => runAcceptedHandback('restart', cleanups), 180_000);
test('CA19: a submitted reviewer concern replays into one exact pending attempt and CheckFinding',
  () => runAcceptedHandback('concern-submission-restart', cleanups), 180_000);
test('CA26: failed combined gates retain their causes and permit correction past the captured repair count',
  () => runAcceptedHandback('repair-exhaustion', cleanups), 180_000);

test('candidate drift after verification starts is fenced by the atomic handback commit',
  () => runAcceptedHandback('drift', cleanups, undefined, false, true), 150_000);

// The gate and review restart cuts are the recovery table's SM7 rows and
// review-lifecycle's reviewed-candidate restart.
test('CA17 CA20 CA30: restart after verification reuses the accepted gate and review for one handback; detached coordination history and refreshed index cannot mutate lifecycle authority',
  () => runAcceptedHandback('verify-restart', cleanups, undefined, false, false, false, true), 180_000);
test('interrupted verification retains its accepted basis and refuses a newly pending review',
  () => runAcceptedHandback('verify-restart', cleanups, undefined, false, false, true), 180_000);
