import { expect, test, vi } from 'vitest';
import { parseCommandLine, UsageError, type RestartOptions } from '../cli.js';
import { runRestartCommand } from '../restart-client.js';
import { restartInspectionSchema, recoveryInspectionSchema } from '../../subs/harness/src/interfaces/protocol/runs.js';

const base = ['--server=http://host:4180', '--plan=p', '--run=source'];
function options(action: string, flags: string[] = []): RestartOptions {
  const command = parseCommandLine(['restart', action, ...base, ...flags]);
  if (command.command !== 'restart') throw new Error('Expected restart');
  return command.restart;
}
const prepare = () => options('prepare', ['--expected-version=8', '--command-id=prepare-1']);
const inspection = restartInspectionSchema.parse({ planId: 'p', runId: 'source', cursor: 8, sourceDigest: 'digest', generation: 0,
  canPrepare: true, blockers: [], limitations: [], successor: null, boundary: { kind: 'invocation', role: 'local-architect', invocation: 'inv-3' },
  preserved: ['accepted analysis', 'wi-1'], inapplicable: ['audit-1'], candidate: { source: { head: 'head', tree: 'tree' }, current: { head: 'head', tree: 'tree' } },
  policy: { before: 'run-policy/8', current: 'run-policy/8' }, settlement: 'confirmed', effects: 'reconciled', changes: [] });
const recovery = recoveryInspectionSchema.parse({ planId: 'p', runId: 'successor', cursor: 1, occurrenceId: 'rec-1', revision: 1,
  state: 'paused', boundary: { kind: 'invocation', role: 'local-architect', invocation: 'inv-3' },
  evidence: { classification: 'preparation', diagnostic: 'Awaiting resume' }, group: 1, automaticAttempts: 0, attempts: [], pausedAt: '2026-10-13T12:00:00Z',
  canResume: true, blockers: [], remaining: { invocations: null, activeMs: null }, retained: { candidate: { head: 'head', tree: 'tree' }, partialPaths: [] },
  restart: { sourceRun: 'source', sourceCursor: 8, sourceDigest: 'digest', importDigest: 'import', generation: 1 } });
const receipt = { commandId: 'prepare-1', jobId: 'successor', sequence: 1, acceptedAt: '2026-10-13T12:00:00Z' };
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

test('restart parser separates read-only inspection from versioned preparation', () => {
  expect(options('inspect')).toMatchObject({ action: 'inspect', timeoutMs: 10000 });
  expect(prepare()).toMatchObject({ expectedVersion: 8, commandId: 'prepare-1' });
  for (const args of [['restart', 'resume', ...base], ['restart', 'prepare', ...base], ['restart', 'inspect', ...base, '--command-id=x'],
    ['restart', 'inspect', ...base, '--repair-file=x'], ['restart', 'prepare', ...base, '--expected-version=-1', '--command-id=x'],
    ['restart', 'inspect', ...base, '--timeout-ms=0'], ['restart', 'inspect', ...base, '--run=other']]) expect(() => parseCommandLine(args)).toThrow(UsageError);
});

test('inspection displays preserved progress and reassessment without sending a command', async () => {
  const s = script([{ path: '/api/v1/plans/p/runs/source/restart', body: inspection }]);
  expect(await runRestartCommand(options('inspect'), s)).toMatchObject({ exitStatus: 0, output: { inspection } });
  expect(s.bodies).toEqual([]); s.done();
});

test('preparation retry retains source version and obtains the waiting successor occurrence', async () => {
  const s = script([{ path: '/api/v1/commands', lost: true }, { path: '/api/v1/commands', status: 202, body: { receipt } },
    { path: '/api/v1/plans/p/runs/successor/recovery', body: recovery }]);
  expect(await runRestartCommand(prepare(), s)).toMatchObject({ exitStatus: 2, output: { uncertain: true, commandId: 'prepare-1' } });
  expect(await runRestartCommand(prepare(), s)).toMatchObject({ exitStatus: 0, output: { receipt, successorRunId: 'successor', recovery } });
  expect(s.bodies[0]).toEqual(s.bodies[1]);
  expect(s.bodies[0]).toEqual({ commandId: 'prepare-1', expectedVersion: 8, type: 'prepare-restart', payload: { planId: 'p', jobId: 'source' } }); s.done();
});

test('a lost follow-up inspection preserves the already admitted receipt', async () => {
  const s = script([{ path: '/api/v1/commands', body: { receipt } }, { path: '/api/v1/plans/p/runs/successor/recovery', lost: true }]);
  expect(await runRestartCommand(prepare(), s)).toMatchObject({ exitStatus: 2, output: { receipt, successorRunId: 'successor', uncertain: false } }); s.done();
});

test('stale preparation is a definite refusal and invalid origins send nothing', async () => {
  const s = script([{ path: '/api/v1/commands', status: 409, body: { error: { code: 'stale-version', message: 'Source cursor changed' } } }]);
  expect(await runRestartCommand(prepare(), s)).toMatchObject({ exitStatus: 2, output: { uncertain: false, error: { code: 'stale-version' } } }); s.done();
  const fetcher = vi.fn<typeof fetch>();
  expect(await runRestartCommand({ ...prepare(), server: 'http://user:secret@host' }, { fetch: fetcher })).toMatchObject({ exitStatus: 2 });
  expect(fetcher).not.toHaveBeenCalled();
});
