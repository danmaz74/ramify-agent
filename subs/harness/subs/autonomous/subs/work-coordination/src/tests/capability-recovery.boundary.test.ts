import { afterEach, expect, test } from 'vitest';
import { gitService } from '../../../../../evidence/src/git.js';
import { runCommand } from '../../../../../evidence/src/run-command.js';
import type { Script } from '../../../../../agent/src/scripted.js';
import { analysis, currentAnalysis, entry } from '../../../../../../src/tests/helpers/analysis.js';
import { copyCapabilityFixture, openCapabilityRuns } from './helpers/capability.js';
import { assign, installMiniRunner, outline, shell, submit, treeInputs } from '../../../../../../src/tests/helpers/iterations.js';
import { freeze, initRepository, runEventsOnDisk, staleCrashLock, startRun, testPolicy, until } from '../../../../../../src/tests/helpers/runs.js';
import { nodeProcessGroups } from '../../../../../task-execution/src/writer.js';

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0).reverse()) await cleanup(); });

test('CA20: a registered real process group survives a service crash and is settled before any successor work', async () => {
  const fixture = await copyCapabilityFixture();
  cleanups.push(fixture.remove);
  await initRepository(fixture.root);
  await installMiniRunner(fixture.root);
  const a = 'capability-coordination/a';
  const b = 'capability-coordination/b';
  let engineerTurns = 0;
  let frozen = false;
  const script: Script = spec => {
    if (spec.role === 'initial-architect') return submit(currentAnalysis(analysis([entry('a-reads-b', a), entry('b-entry', b)]), 'document:need-plan'));
    if (spec.submission.name === 'submit_work_item_result') return submit(assign(a, {}, outline()));
    if (spec.submission.name === 'submit_capability_qualification') {
      const ids = /Use request (capability-request:[a-z0-9-]+) and invocation (inv-\d+)/u.exec(spec.prompt)!;
      return submit({ kind: 'delegate-capability', request: ids[1], invocation: ids[2], taskKey: 'draft:capability-task:source-fact', provider: b,
        placementReason: 'B owns the source fact', constraints: [], requirementRefs: [] });
    }
    if (spec.role === 'engineer') {
      engineerTurns += 1;
      if (engineerTurns === 1) return submit({ kind: 'capability-needed', summary: 'A needs source', request: {
        requestKey: 'draft:capability-request:source-fact', need: 'B source for A', usage: [{ path: 'subs/a/src/caller.ts', use: 'Display B source', prospective: false }],
        constraints: [], knownInterface: { kind: 'none-known' },
        examples: [{ key: 'draft:capability-example:source-shown', title: 'source shown', code: 'expect(renderA()).toContain("B")', designation: 'pseudocode' }],
      } });
      return [shell('node -e "setTimeout(() => {}, 60000)"', { timeoutMs: 60000 })];
    }
    if (spec.role === 'capability-architect') {
      const ids = /Use task (capability-task:[a-z0-9-]+), planRevision (\d+) and invocation (inv-\d+)/u.exec(spec.prompt)!;
      return submit({ task: ids[1], planRevision: Number(ids[2]), invocation: ids[3], kind: 'assign', assignment: assign(b, { goal: 'Provide B source', approach: 'Implement B source', completionEvidence: 'A consumes B source' }).assignment });
    }
    return [];
  };
  // The case waits out the settle bounds; short ones replace the production
  // 30 s bounds without changing what it asserts.
  const policy = (projectRoot: string) => {
    const base = testPolicy(projectRoot);
    return { ...base, limits: { ...base.limits, stopSettleMs: 500, writerSettleMs: 500 } };
  };
  const first = await openCapabilityRuns(fixture.root, {
    git: gitService, script, inputs: treeInputs(), policy,
    commandExecution: async request => {
      const result = await runCommand({ ...request, registerProcessGroup: async (pid, identity) => {
        cleanups.push(async () => nodeProcessGroups.kill(pid));
        await request.registerProcessGroup?.(pid, identity);
      } });
      // A crashed service cannot receive the executor's completion callback
      // when recovery kills its real group. Freezing registration alone leaves
      // this independent callback alive in the in-process crash fixture.
      if (frozen) await freeze();
      return result;
    },
    afterWrite: async write => { if (write === 'writer-process-registered' && !frozen) { frozen = true; await freeze(); } },
  });
  const receipt = await first.service.execute(startRun('need'));
  await until(() => frozen, 30_000);
  const before = await runEventsOnDisk(fixture.root, 'need', receipt.jobId);
  const registered = before.find(event => event.type === 'writer-process-registered');
  if (registered?.type !== 'writer-process-registered') throw new Error('Missing durable process registration');
  const pid = registered.data.pid;
  expect(nodeProcessGroups.alive(pid)).toBe(true);
  expect(before.some(event => event.type === 'writer-released' && event.data.invocation === registered.data.invocation)).toBe(false);

  await staleCrashLock(fixture.root);
  const second = await openCapabilityRuns(fixture.root, {
    git: gitService, script, inputs: treeInputs(), policy,
  });
  cleanups.push(async () => { await expect(second.service.close()).rejects.toThrow(/settlement.*(?:unavailable|not confirmed)/u); });
  await until(() => !nodeProcessGroups.alive(pid));
  const events = await runEventsOnDisk(fixture.root, 'need', receipt.jobId);
  expect(nodeProcessGroups.alive(pid)).toBe(false);
  expect(events.filter(event => event.type === 'job-failed')).toHaveLength(0);
  expect(second.service.getRun('need', receipt.jobId)?.state).toBe('running');
  expect(second.agent!.sessions).toHaveLength(0);
  expect(events).toEqual(before);
  expect(events.filter(event => event.type === 'capability-handed-back' || event.type === 'gate-attempted')).toHaveLength(0);
  expect(events.filter(event => event.type === 'work-item-started' && event.data.workItem === 'work-item:b-entry')).toHaveLength(0);
  expect(first.service.events('need', receipt.jobId)).toEqual(before);
}, 45_000);
