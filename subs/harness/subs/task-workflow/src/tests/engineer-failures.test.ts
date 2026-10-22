import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { AgentSession, SessionOutcome } from '../../../agent/src/interfaces/port.js';
import type { CommandRunner } from '../../../evidence/src/run-command.js';
import { commandResult } from '../../../../src/tests/helpers/command-result.js';
import { expectNoProcesses, forgetExternalTools } from '../../../../src/tests/helpers/external-tools.js';
import { temporaryDirectory } from '../../../../src/tests/helpers/fixture.js';
import { assign, outline } from '../../../../src/tests/helpers/iterations.js';
import { testPolicy } from '../../../../src/tests/helpers/runs.js';
import { assertUnchangedGit } from '../../../../src/tests/helpers/unchanged-run.js';
import { engineerBoundsOf } from '../../../../src/run/policy.js';
import { InvocationBounds } from '../../../task-execution/src/port-events.js';
import { validateLocalArchitect, type LocalArchitectSubmission } from '../../../autonomous/subs/work-coordination/src/work/submission.js';
import { createShellTool } from '../../../../src/tools/shell.js';

/*
 * Where a bound ended a module engineer, its architect may raise that bound
 * for the next iteration, up to the policy's ceiling. The runs that drive a
 * failed engineer through analysis to its architect are in
 * work-coordination's engineer-runs.test.ts.
 */

vi.mock('node:child_process', async original =>
  (await import('../../../../src/tests/helpers/process-guard.js')).guardedChildProcess(await original<typeof import('node:child_process')>()));

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
  try { assertUnchangedGit(); expectNoProcesses(); } finally { forgetExternalTools(); }
});

const reviews = 'collection-review/workspace/reviews';

/** What each shell command asked for, as the scripted runner received it. */
interface AskedCommand {
  readonly command: string;
  readonly timeoutMs: number;
}

/** Answers every shell command in this process at once, recording what it asked for. */
function scriptedShell(asked: AskedCommand[]): CommandRunner {
  return async request => {
    if (request.argv[0] !== 'bash') throw new Error(`No process is started here: ${request.argv.join(' ')}`);
    asked.push({ command: request.argv[2] ?? '', timeoutMs: request.timeoutMs });
    return commandResult(request, { stdout: 'all suites passed\n' });
  };
}

describe('the bounds an assignment raises', () => {
  const policy = engineerBoundsOf(testPolicy('/project').limits);

  /** An `assign` submission with `bounds`, judged as the architect's turn judges it. */
  function judged(bounds: unknown) {
    const submission = assign(reviews, { bounds: bounds as never }, outline()) as LocalArchitectSubmission;
    return validateLocalArchitect(submission, { index: null, registry: new Map(), bounds: policy });
  }

  function errors(bounds: unknown) {
    const verdict = judged(bounds);
    return verdict.ok ? [] : verdict.errors;
  }

  test('the policy\'s defaults and ceilings are the ones the plan fixed', () => {
    expect(policy.ceilings).toEqual({ commandTimeoutMs: 1_800_000, idleMs: 1_800_000, absoluteMs: 10_800_000 });
    expect(policy.defaults.commandTimeoutMs).toBe(600_000);
  });

  test('raised within the ceilings, with their reasons, they are accepted', () => {
    expect(judged({
      commandTimeoutMs: { ms: 1_800_000, reason: 'The suite runs for twenty minutes.' },
      idleMs: { ms: 1_800_000, reason: 'The build prints nothing for long stretches.' },
      absoluteMs: { ms: 10_800_000, reason: 'The migration and its suite run for two hours.' },
    }).ok).toBe(true);
  });

  test('a command timeout above its ceiling is refused, naming the ceiling', () => {
    expect(errors({ commandTimeoutMs: { ms: 1_800_001, reason: 'r' }, absoluteMs: { ms: 3_600_000, reason: 'r' } })).toEqual([{
      path: 'assignment.bounds.commandTimeoutMs.ms',
      message: '1800001 ms is above the policy\'s ceiling for a shell command\'s timeout, which is 1800000 ms',
      expected: 'at most 1800000',
    }]);
  });

  test('an idle bound above its ceiling is refused, naming the ceiling', () => {
    expect(errors({ idleMs: { ms: 1_800_001, reason: 'r' } })).toEqual([{
      path: 'assignment.bounds.idleMs.ms',
      message: '1800001 ms is above the policy\'s ceiling for the idle bound, which is 1800000 ms',
      expected: 'at most 1800000',
    }]);
  });

  test('an absolute bound above its ceiling is refused, naming the ceiling', () => {
    expect(errors({ absoluteMs: { ms: 10_800_001, reason: 'r' } })).toEqual([{
      path: 'assignment.bounds.absoluteMs.ms',
      message: '10800001 ms is above the policy\'s ceiling for the absolute bound of an invocation, which is 10800000 ms',
      expected: 'at most 10800000',
    }]);
  });

  test('a command timeout longer than the invocation that runs it is refused', () => {
    // A policy whose invocations are shorter than the command ceiling.
    const tight = engineerBoundsOf({ ...testPolicy('/project').limits, invocationAbsoluteMs: 900_000 });
    const messages = (bounds: unknown) => {
      const verdict = validateLocalArchitect(assign(reviews, { bounds: bounds as never }, outline()) as LocalArchitectSubmission,
        { index: null, registry: new Map(), bounds: tight });
      return verdict.ok ? [] : verdict.errors;
    };
    // Against the absolute bound the assignment raised.
    expect(messages({ commandTimeoutMs: { ms: 1_500_000, reason: 'r' }, absoluteMs: { ms: 1_200_000, reason: 'r' } })).toEqual([{
      path: 'assignment.bounds.commandTimeoutMs.ms',
      message: 'A command\'s timeout of 1500000 ms is longer than the 1200000 ms its invocation may run; raise `absoluteMs` with it, up to 10800000 ms',
      expected: 'at most 1200000',
    }]);
    // Against the policy's own, where the assignment raised none.
    expect(messages({ commandTimeoutMs: { ms: 1_000_000, reason: 'r' } }).map(error => error.message)).toEqual([
      'A command\'s timeout of 1000000 ms is longer than the 900000 ms its invocation may run, the policy\'s absolute bound; raise `absoluteMs` with it, up to 10800000 ms',
    ]);
  });

  test('a bound below the policy\'s is refused: a bound is raised, never lowered', () => {
    expect(errors({ idleMs: { ms: 1_000, reason: 'r' } }).map(error => error.path)).toEqual(['assignment.bounds.idleMs.ms']);
    expect(errors({ idleMs: { ms: 1_000, reason: 'r' } })[0]!.message).toContain('a bound is raised here, never lowered');
  });

  test('a bound without its reason, or not a positive integer, is refused by the schema', () => {
    expect(errors({ idleMs: { ms: 1_000_000 } }).map(error => error.path)).toEqual(['assignment.bounds.idleMs.reason']);
    expect(errors({ idleMs: { ms: 0, reason: 'r' } }).map(error => error.path)).toEqual(['assignment.bounds.idleMs.ms']);
    expect(errors({ idleMs: { ms: 1.5, reason: 'r' } }).map(error => error.path)).toEqual(['assignment.bounds.idleMs.ms']);
    expect(errors({ wallMs: { ms: 1_000_000, reason: 'r' } }).map(error => error.path)).toEqual(['assignment.bounds']);
  });
});

describe('every command stays bounded under raised bounds', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  /** A session that ends only when it is stopped, and says when that was. */
  function silentSession() {
    let end: (outcome: SessionOutcome) => void = () => undefined;
    const outcome = new Promise<SessionOutcome>(resolve => { end = resolve; });
    const stops: number[] = [];
    const session: AgentSession = {
      outcome, start: { mode: 'fresh' }, ref: 'silent', settled: async () => 'settled',
      stop: async () => { stops.push(Date.now()); end({ kind: 'stopped' }); },
    };
    return { session, stops };
  }

  test('a hold lasts the command\'s raised timeout and the margin, and no longer', async () => {
    vi.useFakeTimers();
    const started = Date.now();
    const bounds = new InvocationBounds({ invocationIdleMs: 1_800_000, invocationAbsoluteMs: 10_800_000, writerSettleMs: 1_000 }, 60_000);
    const { session, stops } = silentSession();
    const ended = bounds.outcome(session);
    bounds.hold(1_800_000);
    await vi.advanceTimersByTimeAsync(1_859_000);
    expect(stops).toEqual([]);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(stops.map(at => at - started)).toEqual([1_860_000]);
    expect(bounds.interruption).toBe('idle-timeout');
    await vi.advanceTimersByTimeAsync(1_000);
    await ended;
  });

  test('invocation age cannot interrupt a command within its held timeout', async () => {
    vi.useFakeTimers();
    const started = Date.now();
    const bounds = new InvocationBounds({ invocationIdleMs: 1_800_000, invocationAbsoluteMs: 1_000_000, writerSettleMs: 1_000 }, 60_000);
    const { session, stops } = silentSession();
    const ended = bounds.outcome(session);
    bounds.hold(1_800_000);
    await vi.advanceTimersByTimeAsync(1_000_000);
    expect(stops).toEqual([]);
    expect(bounds.interruption).toBeUndefined();
    await vi.advanceTimersByTimeAsync(860_000);
    expect(stops.map(at => at - started)).toEqual([1_860_000]);
    expect(bounds.interruption).toBe('idle-timeout');
    await vi.advanceTimersByTimeAsync(1_000);
    await ended;
  });
});

describe('the shell of an engineer whose assignment raised its command maximum', () => {
  test('accepts a timeout up to it and refuses one above it, and runs the command with the timeout asked for', async () => {
    const asked: AskedCommand[] = [];
    const judgedInputs: unknown[] = [];
    const outputs = await temporaryDirectory();
    cleanups.push(outputs.remove);
    const tool = createShellTool({
      commandExecution: scriptedShell(asked),
      workingDirectory: '/project',
      maxTimeoutMs: 1_200_000,
      judge: async input => {
        judgedInputs.push(input);
        const timeout = (input as { timeoutMs?: number }).timeoutMs ?? 0;
        return timeout > 1_200_000 ? { ok: false, text: 'too long' } : { ok: true };
      },
      outputFile: call => join(outputs.path, `${call}.log`),
      starting: async () => undefined,
      ended: async () => undefined,
    });
    const schema = tool.definition.inputSchema as { properties: { timeoutMs: { maximum: number } } };
    expect(schema.properties.timeoutMs.maximum).toBe(1_200_000);
    expect(tool.definition.description).toContain('up to 1200000 ms');
    const ran = await tool.definition.execute({ command: 'npm run build', timeoutMs: 1_100_000 }, new AbortController().signal);
    expect(ran.isError).toBe(false);
    expect(asked).toEqual([{ command: 'npm run build', timeoutMs: 1_100_000 }]);
    const refused = await tool.definition.execute({ command: 'npm run build', timeoutMs: 1_300_000 }, new AbortController().signal);
    expect(refused).toEqual({ isError: true, text: 'too long' });
    expect(asked).toHaveLength(1);
  });
});
