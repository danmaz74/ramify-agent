import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

import { runGate } from '../../subs/autonomous/subs/acceptance/src/checks/gate.js';
import { checkCommand } from '../../subs/autonomous/subs/acceptance/src/checks/records.js';
import type { PlannedCheck } from '../../subs/autonomous/subs/acceptance/src/checks/verify.js';
import { createMappedCheckExecution } from './helpers/direct-check-execution.js';

const cleanups: string[] = [];

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map(path => rm(path, { recursive: true, force: true })));
});

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'ramify-agent-direct-check-'));
  cleanups.push(root);
  const directory = join(root, 'gate');
  const command = checkCommand({ argv: [process.execPath, '-e', 'process.exit(99)'], cwd: root, timeoutMs: 1_000 });
  // An in-place diagnosis runs type-check and ramify-check; a third command
  // makes the sequence long enough to show interruption.
  const checks: PlannedCheck[] = [
    { kind: 'type-check', command },
    { kind: 'ramify-check', command },
    { kind: 'type-check', name: 'second-type-check', command },
  ];
  return { root, directory, checks };
}

describe('direct test check execution', () => {
  test('classifies cancellation and runner errors and does not select later scripted results after interruption', async () => {
    let selected = 0;
    const f = await fixture();
    const attempt = await runGate(createMappedCheckExecution({
      script(invocation) {
        selected += 1;
        if (invocation.invocationIndex === 0) return { outcome: { kind: 'cancelled' }, stderr: 'cancelled\n' };
        return { outcome: { kind: 'runner-error', error: { kind: 'EFAKE', message: 'must not run' } } };
      },
    }), 'iteration', {
      id: 'ga-interrupted',
      projectRoot: f.root,
      directory: f.directory,
      head: 'source-commit',
      checks: f.checks,
    });

    expect(selected).toBe(1);
    expect(attempt.audited).toBeNull();
    expect(attempt.evidence).toBeNull();
    expect(attempt.commands.map(command => [command.outcome, command.notVerified])).toEqual([
      ['not-verified', 'interrupted'],
      ['not-verified', 'interrupted'],
      ['not-verified', 'interrupted'],
    ]);
    expect(attempt.commands[0]!.output.tail).toBe('cancelled\n');
    expect(attempt.commands[1]!.output.bytes).toBe(0);
  });

  test('honors an already-aborted request before selecting any scripted result', async () => {
    const controller = new AbortController();
    controller.abort();
    let selected = 0;
    const f = await fixture();
    const attempt = await runGate(createMappedCheckExecution({ script: () => {
      selected += 1;
      return { stdout: 'must not be selected' };
    } }), 'iteration', {
      id: 'ga-aborted',
      runId: 'run-aborted',
      projectRoot: f.root,
      directory: f.directory,
      head: 'source-commit',
      checks: f.checks,
      signal: controller.signal,
    });

    expect(selected).toBe(0);
    expect(attempt.audited).toBeNull();
    expect(attempt.evidence).toBeNull();
    expect(attempt.commands.every(command => command.notVerified === 'interrupted')).toBe(true);
    expect(attempt.commands.every(command => command.output.bytes === 0)).toBe(true);
  });

  test('turns an abort during an async scripted step into cancellation and selects nothing later', async () => {
    const f = await fixture();
    const controller = new AbortController();
    let selected = 0;
    const attempt = await runGate(createMappedCheckExecution({
      async script() {
        selected += 1;
        controller.abort();
        await Promise.resolve();
        return { stdout: 'late success must be discarded\n' };
      },
    }), 'iteration', {
      id: 'ga-abort-pending',
      projectRoot: f.root,
      directory: f.directory,
      head: 'source-commit',
      checks: f.checks,
      signal: controller.signal,
    });

    expect(selected).toBe(1);
    expect(attempt.audited).toBeNull();
    expect(attempt.evidence).toBeNull();
    expect(attempt.commands.every(command => command.notVerified === 'interrupted')).toBe(true);
    expect(attempt.commands.every(command => command.output.bytes === 0)).toBe(true);
  });
});
