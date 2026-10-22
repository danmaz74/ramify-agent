import { scenariosCommit, type GitCheckpoint } from '../../../../src/tests/helpers/scripted-git.js';
import { openUnchangedRuns as openRuns, assertUnchangedGit } from '../../../../src/tests/helpers/unchanged-run.js';
import { expectNoProcesses, forgetExternalTools } from '../../../../src/tests/helpers/external-tools.js';
import { readFile } from 'node:fs/promises';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createScriptedAgent, type Script } from '../../../agent/src/scripted.js';
import type { AgentPort, AgentSession, SessionOutcome } from '../../../agent/src/interfaces/port.js';
import { type CommandRunner } from '../../../evidence/src/run-command.js';
import { analysis, currentAnalysis, entry, requestCompletion } from '../../../../src/tests/helpers/analysis.js';
import { copyFixture } from '../../../../src/tests/helpers/fixture.js';
import { assign, byRole, outline, submit, treeInputs } from '../../../../src/tests/helpers/iterations.js';
import { installTestRunner, onlyRun, runEventsOnDisk, runPath, startRun, stopRun, testPolicy } from '../../../../src/tests/helpers/runs.js';
import { InvocationBounds } from '../../../task-execution/src/port-events.js';
import { runLayout, type RunPolicy } from '../run/records.js';
import { type InvocationOutcome } from '../../../task-execution/src/records.js';

/* Historical resource limits are retained as observations; progress and pending work remain eligible. */

vi.mock('node:child_process', async original =>
  (await import('../../../../src/tests/helpers/process-guard.js')).guardedChildProcess(await original<typeof import('node:child_process')>()));

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
  try { assertUnchangedGit(); expectNoProcesses(); } finally { forgetExternalTools(); }
});

const plan = 'review-notes';
const reviews = 'collection-review/workspace/reviews';

async function run(
  script: Script,
  limits: Partial<RunPolicy['limits']>,
  unchangedCheckpoints: ReadonlyArray<string | GitCheckpoint> = [],
  commandExecution?: CommandRunner,
  previewCount?: number,
) {
  const fixture = await copyFixture();
  cleanups.push(fixture.remove);
  await installTestRunner(fixture.root);
  const opened = await openRuns(fixture.root, {
    script,
    unchangedCheckpoints,
    ...(previewCount === undefined ? {} : { previewCount }),
    inputs: treeInputs(),
    ...(commandExecution === undefined ? {} : { commandExecution }),
    policy: projectRoot => {
      const policy = testPolicy(projectRoot);
      return { ...policy, limits: { ...policy.limits, ...limits } };
    },
  });
  cleanups.push(() => opened.service.close());
  const receipt = await opened.service.execute(startRun(plan));
  await opened.service.settled(plan, receipt.jobId);
  return { root: fixture.root, runId: receipt.jobId, service: opened.service };
}

async function outcome(root: string, runId: string, invocation: string): Promise<InvocationOutcome> {
  return JSON.parse(await readFile(runPath(root, plan, runId, runLayout.outcome(invocation)), 'utf8')) as InvocationOutcome;
}

describe('the bounds on one invocation', () => {
  test('an invocation that ends within its bounds is not interrupted', async () => {
    const { root, runId, service } = await run(
      byRole({ 'initial-architect': [submit(currentAnalysis(analysis([]), 'document:review-notes-plan'))] }),
      { invocationIdleMs: 5_000, invocationAbsoluteMs: 10_000 },
      ['final verification of plan "review-notes"'],
    );
    expect(onlyRun(service, plan).state).toBe('completed');
    for (const invocation of ['inv-0001', 'inv-0002', 'inv-0003']) expect((await outcome(root, runId, invocation)).interruption).toBeUndefined();
  }, 120_000);
});

describe('an implementation that cannot start a session', () => {
  test('records the adapter fault and accepts an explicit stop while recovery retains the task', async () => {
    // Also found by the composition suite: the harness's defense against a
    // the preserving operation that throws, which the port's rules forbid, had no test.
    const scripted = createScriptedAgent([{ kind: 'submit', input: currentAnalysis(analysis([]), 'document:review-notes-plan') }]);
    const broken: AgentPort = {
      name: scripted.name,
      support: scripted.support,
      bindSessionStore(store) { const operations = scripted.bindSessionStore(store); return { ...operations, continue: async () => { throw new Error('the adapter could not build a session'); } }; },
    };
    const fixture = await copyFixture();
    cleanups.push(fixture.remove);
    await installTestRunner(fixture.root);
    const opened = await openRuns(fixture.root, { agent: broken, inputs: treeInputs(), gitScript: { previews: [
      { repositoryRoot: fixture.root, head: 'unchanged-fixture-revision', tree: 'a'.repeat(40) },
    ] } });
    cleanups.push(() => opened.service.close());
    const receipt = await opened.service.execute(startRun(plan));
    await vi.waitFor(async () => {
      expect(await outcome(fixture.root, receipt.jobId, 'inv-0001')).toMatchObject({ ended: 'failed', interruption: 'adapter-fault' });
    });
    const ended = await outcome(fixture.root, receipt.jobId, 'inv-0001');
    expect(ended).toMatchObject({ ended: 'failed', interruption: 'adapter-fault' });
    expect(ended.error).toContain('the adapter could not build a session');
    await opened.service.execute(stopRun(plan, receipt.jobId, onlyRun(opened.service, plan).version));
    await opened.service.settled(plan, receipt.jobId);
    expect(onlyRun(opened.service, plan).state).toBe('stopped');
  }, 120_000);
});

/*
 * A command the harness runs for a session is the harness's work, not the
 * session's silence. The first real toolkit run lost three hours when a
 * shell call given ten minutes was killed at the five-minute idle bound, and
 * the run failed with its engineer. The idle bound is now held for a
 * command's own timeout and a margin, and a module engineer that fails returns its
 * iteration to the module architect.
 */

/** A session that ends only when it is stopped, and says when that was. */
function silentSession() {
  let end: (outcome: SessionOutcome) => void = () => undefined;
  const outcome = new Promise<SessionOutcome>(resolve => { end = resolve; });
  const stops: number[] = [];
  const session: AgentSession = {
    outcome,
    start: { mode: 'fresh' },
    ref: 'silent',
    settled: async () => 'settled',
    stop: async () => {
      stops.push(Date.now());
      end({ kind: 'stopped' });
    },
  };
  return { session, stops };
}

describe('the idle bound while a command runs', () => {
  const limits = { invocationIdleMs: 300_000, invocationAbsoluteMs: 3_600_000, writerSettleMs: 1_000 };
  afterEach(() => {
    vi.useRealTimers();
  });

  test('a held command is not idleness until its own timeout and the margin have passed', async () => {
    vi.useFakeTimers();
    const started = Date.now();
    const bounds = new InvocationBounds(limits, 60_000);
    const { session, stops } = silentSession();
    const ended = bounds.outcome(session);
    // The shell call of the real run: ten minutes of its own, silent throughout.
    bounds.hold(600_000);
    await vi.advanceTimersByTimeAsync(659_000);
    expect(stops).toEqual([]);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(stops).toHaveLength(1);
    expect(stops[0]! - started).toBe(660_000);
    expect(bounds.interruption).toBe('idle-timeout');
    await vi.advanceTimersByTimeAsync(limits.writerSettleMs);
    expect(await ended).toMatchObject({ kind: 'resource-pending', resource: 'stall' });
  });

  test('its release starts the idle bound afresh, and silence without a command still ends the session', async () => {
    vi.useFakeTimers();
    const bounds = new InvocationBounds(limits, 60_000);
    const { session, stops } = silentSession();
    const ended = bounds.outcome(session);
    const release = bounds.hold(600_000);
    await vi.advanceTimersByTimeAsync(400_000);
    const released = Date.now();
    release();
    // A second release of the same hold changes nothing.
    await vi.advanceTimersByTimeAsync(100_000);
    release();
    await vi.advanceTimersByTimeAsync(199_000);
    expect(stops).toEqual([]);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(stops.map(at => at - released)).toEqual([limits.invocationIdleMs]);
    expect(bounds.interruption).toBe('idle-timeout');
    await vi.advanceTimersByTimeAsync(limits.writerSettleMs);
    await ended;
  });

  test('a healthy held command is not interrupted by the former absolute allowance', async () => {
    vi.useFakeTimers();
    const bounds = new InvocationBounds({ ...limits, invocationAbsoluteMs: 120_000 }, 60_000);
    const { session, stops } = silentSession();
    const ended = bounds.outcome(session);
    bounds.hold(600_000);
    await vi.advanceTimersByTimeAsync(120_000);
    expect(stops).toHaveLength(0);
    expect(bounds.interruption).toBeUndefined();
    await session.stop();
    await ended;
  });
});

describe('an engineer that ends without a result', () => {
  test('an ordinary no-result return closes its iteration partial and informs its local architect', async () => {
    const prompts: string[] = [];
    const script = byRole({
      'initial-architect': [submit(currentAnalysis(analysis([entry('reviewer-note', reviews)]), 'document:review-notes-plan'))],
      'local-architect': [submit(assign(reviews, {}, outline())), submit(requestCompletion())],
      // The session goes silent and the idle bound ends it.
      engineer: [[{ kind: 'end' }]],
    });
    const { root, runId, service } = await run(spec => {
      if (spec.role === 'local-architect') prompts.push(spec.prompt);
      return typeof script === 'function' ? script(spec) : script;
    }, { invocationIdleMs: 300 }, [scenariosCommit(plan), 'work-item:reviewer-note', `final verification of plan "${plan}"`], undefined, 5);

    expect(onlyRun(service, plan).state).toBe('completed');
    const events = await runEventsOnDisk(root, plan, runId);
    const engineer = events.filter(event => event.type === 'invocation-started')
      .map(event => event.data as { invocation: string; role: string })
      .find(data => data.role === 'engineer')!;
    expect(await outcome(root, runId, engineer.invocation)).toMatchObject({ ended: 'ended' });
    expect(events.filter(event => event.type === 'iteration-closed').map(event => event.data))
      .toEqual([expect.objectContaining({ iteration: 'work-item:reviewer-note.i01', outcome: 'partial', commit: null })]);

    // The architect's next turn names the failure, the bound and the invocation.
    expect(prompts).toHaveLength(2);
    expect(prompts[1]).toContain('`work-item:reviewer-note.i01` ended `partial`, with nothing committed.');
    expect(prompts[1]).toContain(
      `the module engineer of work-item:reviewer-note.i01 ended without a result (ended; invocation ${engineer.invocation})`,
    );
  }, 120_000);

  test('another assignment remains available after the captured iteration count', async () => {
    const architectPrompts: string[] = [];
    const scripted = byRole({
      'initial-architect': [submit(currentAnalysis(analysis([entry('reviewer-note', reviews)]), 'document:review-notes-plan'))],
      'local-architect': [submit(assign(reviews, {}, outline())), submit(assign(reviews)), submit(assign(reviews)), submit(requestCompletion())],
      engineer: [[{ kind: 'end' }], [{ kind: 'end' }], [{ kind: 'end' }]],
    });
    const { root, runId, service } = await run(spec => {
      if (spec.role === 'local-architect') architectPrompts.push(spec.prompt);
      return typeof scripted === 'function' ? scripted(spec) : scripted;
    }, { maxIterationsPerWorkItem: 2 }, [scenariosCommit(plan), 'work-item:reviewer-note', `final verification of plan "${plan}"`], undefined, 7);

    const snapshot = onlyRun(service, plan);
    expect(snapshot.state).toBe('completed');
    const events = await runEventsOnDisk(root, plan, runId);
    expect(events.filter(event => event.type === 'iteration-assigned')).toHaveLength(3);
    expect(architectPrompts[3]).toContain('Progress reconsideration');
    expect(events.filter(event => event.type === 'iteration-closed').map(event => (event.data as { outcome: string }).outcome))
      .toEqual(['partial', 'partial', 'partial']);
  }, 120_000);
});
