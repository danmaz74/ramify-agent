import { expect, test, vi } from 'vitest';
import { parseCommandLine, UsageError, type RecoveryOptions } from '../cli.js';
import { runRecoveryCommand } from '../recovery-client.js';
import { printControlResult } from '../debug-client.js';
import { recoveryInspectionSchema } from '../../subs/harness/src/interfaces/protocol/runs.js';

const base = ['--server=http://host:4180', '--plan=p', '--run=r1'];
function options(action: string, flags: string[] = []): RecoveryOptions {
  const command = parseCommandLine(['recovery', action, ...base, ...flags]);
  if (command.command !== 'recovery') throw new Error('Expected recovery');
  return command.recovery;
}
const resume = () => options('resume', ['--occurrence=rec-1', '--expected-revision=2', '--command-id=c1']);
const inspection = recoveryInspectionSchema.parse({ planId: 'p', runId: 'r1', cursor: 8, occurrenceId: 'rec-1', revision: 2,
  state: 'paused', boundary: { kind: 'invocation', role: 'global-fork', invocation: 'inv-3' },
  evidence: { classification: 'transport', diagnostic: 'Connection closed', retryAfterMs: 100 }, group: 1, automaticAttempts: 2,
  attempts: ['inv-1', 'inv-2', 'inv-3'], pausedAt: '2026-10-12T12:00:00Z', canResume: true, blockers: [], remaining: { invocations: 20, activeMs: 10000 },
  retained: { candidate: { head: 'head', tree: 'tree' }, partialPaths: ['src/partial.ts'] } });
const receipt = { commandId: 'c1', jobId: 'r1', sequence: 9, acceptedAt: '2026-10-12T12:00:00Z' };

function script(answers: Array<{ path: string; body?: unknown; status?: number; lost?: boolean }>) {
  const bodies: unknown[] = [];
  const fetcher: typeof fetch = async (input, init) => {
    const answer = answers.shift(); expect(answer).toBeDefined(); expect(new URL(String(input)).pathname).toBe(answer!.path);
    if (init?.body !== undefined) bodies.push(JSON.parse(String(init.body)));
    if (answer!.lost) throw new Error('Reply lost');
    return new Response(JSON.stringify(answer!.body), { status: answer!.status ?? 200 });
  };
  return { fetch: fetcher, bodies, done: () => expect(answers).toEqual([]) };
}

test('continuation requires command identity and accepts optional legacy fields', () => {
  expect(options('inspect')).toMatchObject({ action: 'inspect', timeoutMs: 10000 });
  expect(options('resume', ['--command-id=c1'])).toMatchObject({ commandId: 'c1' });
  expect(resume()).toMatchObject({ occurrenceId: 'rec-1', expectedRevision: 2, commandId: 'c1' });
  for (const args of [['recovery', 'other', ...base], ['recovery', 'resume', ...base], ['recovery', 'inspect', ...base, '--repair-file=x'],
    ['recovery', 'inspect', ...base, '--timeout-ms=0'], ['recovery', 'inspect', ...base, '--server=http://other'],
    ['recovery', 'inspect', ...base, '--timeout-ms=2147483648']]) expect(() => parseCommandLine(args)).toThrow(UsageError);
});

test('inspection exposes retained attempts, paths and bounds without sending a command', async () => {
  const s = script([{ path: '/api/v1/plans/p/runs/r1/recovery', body: inspection }, { path: '/api/v1/plans/p/runs/r1/recovery', body: null }]);
  expect(await runRecoveryCommand(options('inspect'), s)).toMatchObject({ exitStatus: 0, output: { inspection } });
  expect(await runRecoveryCommand(options('inspect'), s)).toMatchObject({ exitStatus: 0, output: { inspection: null } });
  expect(s.bodies).toEqual([]); s.done();
});

test('repair declaration crosses resume with stable command identity; uncertain retry sends identical payload', async () => {
  const s = script([{ path: '/api/v1/commands', lost: true }, { path: '/api/v1/commands', status: 202, body: { receipt } }]);
  const command = { ...resume(), repairFile: 'repair.json' };
  const repair = { areas: ['environment'], explanation: 'Credentials corrected outside the run', evidence: ['operator-repair'] };
  const ports = { ...s, readText: async () => JSON.stringify(repair) };
  expect(await runRecoveryCommand(command, ports)).toMatchObject({ exitStatus: 2, output: { commandId: 'c1', occurrenceId: 'rec-1', revision: 2, uncertain: true } });
  expect(await runRecoveryCommand(command, ports)).toMatchObject({ exitStatus: 0, output: { receipt } });
  expect(s.bodies[0]).toEqual(s.bodies[1]);
  expect(s.bodies[0]).toMatchObject({ type: 'resume-recovery', payload: { repair, expectedRevision: 2 } }); s.done();
});

test('malformed declarations never send a command and stale occurrence refusals are definite', async () => {
  const fetcher = vi.fn<typeof fetch>();
  expect(await runRecoveryCommand({ ...resume(), repairFile: 'repair.json' }, { fetch: fetcher, readText: async () => '{"areas":[],"explanation":""}' })).toMatchObject({ exitStatus: 2, output: { uncertain: false } });
  expect(fetcher).not.toHaveBeenCalled();
  const s = script([{ path: '/api/v1/commands', status: 409, body: { error: { code: 'stale-version', message: 'Recovery occurrence changed' } } }]);
  const result = await runRecoveryCommand(resume(), s);
  expect(result).toMatchObject({ exitStatus: 2, output: { uncertain: false, error: { code: 'stale-version' } } });
  const stdout: string[] = [], stderr: string[] = [];
  printControlResult(result, true, { stdout: value => stdout.push(value), stderr: value => stderr.push(value) });
  expect(stdout).toHaveLength(1); expect(JSON.parse(stdout[0]!)).toEqual(result.output); expect(stderr).toEqual(['Recovery occurrence changed\n']); s.done();
});

test('timeout never cancels execution and retains the submitted identity', async () => {
  vi.useFakeTimers();
  try {
    const fetcher: typeof fetch = (_input, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new Error('Request aborted')), { once: true });
    });
    const result = runRecoveryCommand({ ...resume(), timeoutMs: 10 }, { fetch: fetcher });
    await vi.advanceTimersByTimeAsync(10);
    expect(await result).toMatchObject({ exitStatus: 2, output: { commandId: 'c1', uncertain: true, error: { code: 'timeout' } } });
  } finally { vi.useRealTimers(); }
});

test('ordinary continuation sends only the task and stable command identity', async () => {
  const s = script([{ path: '/api/v1/commands', status: 202, body: { receipt } }]);
  expect(await runRecoveryCommand(options('resume', ['--command-id=c1']), s)).toMatchObject({ exitStatus: 0 });
  expect(s.bodies).toEqual([{ type: 'resume-recovery', commandId: 'c1', expectedVersion: 0, payload: { planId: 'p', jobId: 'r1' } }]);
  s.done();
});
