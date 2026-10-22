import { afterEach, expect, test } from 'vitest';
import { readFile } from 'node:fs/promises';
import { createScriptedAgent } from '../../subs/agent/src/scripted.js';
import type { ConfiguredAuditPort } from '../../subs/audit/src/check-execution.js';
import { compositionCandidates, plan, scenarios, statedCommands } from './helpers/composition.js';
import { declaringScenarios } from './helpers/declarations.js';
import { announcingAudit } from './helpers/direct-check-execution.js';
import { scenarioGit } from './helpers/recovery-git.js';
import { openRuns, runPath, startRun, testPolicy, until } from './helpers/runs.js';
import { operationRecoverySchema, runLayout } from '../../subs/autonomous/src/run/records.js';

const cleanup: Array<() => Promise<void>> = [];
afterEach(async () => { for (const close of cleanup.splice(0).reverse()) await close(); });

test.each(['iteration', 'work-item'] as const)('%s check recovery preserves its accepted producer and resumes the pending gate', async checkpoint => {
  const scenario = scenarios.iteration;
  const target = await scenario.target(); cleanup.push(target.remove);
  const final = scenario.finalCandidate!;
  const groups = checkpoint === 'work-item' ? 2 : 1;
  const scriptedGit = scenarioGit(target.root, { ...scenario.git, commits: [...scenario.git.commits,
    ...Array.from({ length: groups }, () => ({ commit: null, against: final.head }))] });
  // All extra recovery observations inspect the same already committed source.
  const git = { ...scriptedGit,
    changedPaths: async (root: string, base?: string) => scriptedGit.head() === final.head && base === 'scenarios-00'
      ? scenario.git.commits[1]!.changes!.map(change => change.path) : scriptedGit.changedPaths(root, base),
    changedEntries: async (root: string, base?: string) => scriptedGit.head() === final.head && base === 'scenarios-00'
      ? [...scenario.git.commits[1]!.changes!] : scriptedGit.changedEntries(root, base),
    recoveryStatus: async () => ({ index: 'retained-index', staged: [], unstaged: [], untracked: [] }),
    isAncestor: async (_root: string, ancestor: string, descendant: string) => {
      expect(ancestor).toBe('scenarios-00'); expect(descendant).toBe(final.head); return true;
    },
    previewCandidateTree: async () => ({ repositoryRoot: target.root, head: scriptedGit.head(), tree: final.tree }),
  };
  const candidates = compositionCandidates(target.root, scenario, { [final.tree]: { tree: final.tree, files: {}, base: scenario.git.head, changes: [] } });
  const agent = createScriptedAgent(declaringScenarios(scenario.script(target.root)));
  const commands = statedCommands(target.root, scenario.commands ?? []);
  const audit = announcingAudit(); let obstructions = 0;
  const targetGate = checkpoint === 'iteration' ? 'ga-0002' : 'ga-0003';
  const configuredAudit: ConfiguredAuditPort = { read: (...args) => audit.read(...args), run: async input => {
    if (obstructions < groups && (input.attemptId === targetGate || obstructions > 0)) {
      obstructions += 1;
      return { status: 'failed', requestId: `${input.runId}:${input.attemptId}`, mode: input.mode, nested: input.nested ?? false,
        projects: null, discovery: null, requestedSourceCommit: input.sourceCommit, auditedSourceCommit: null, reused: false, reuse: null,
        requestedMode: null, executedMode: null, fallbackReason: null, verdict: null, reportCommit: null, runRef: null, treeRef: null,
        definition: { path: input.configuration.path, blob: input.configuration.blob }, detail: 'Required executable unavailable',
        provider: { status: 'failed', error: { code: 'ENOENT', message: 'Required executable unavailable', retryable: false } }, checks: {} };
    }
    return audit.run(input);
  } };
  const { service } = await openRuns(target.root, { git, candidates, agent, inputs: scenario.inputs(), configuredAudit,
    commandExecution: commands, policy: root => testPolicy(root, { recovery: true }), recoveryRuntime: async () => ({
      harness: 'scripted-installed-harness', provider: 'scripted-installed-provider', contracts: { policy: 'unchanged', records: 'unchanged', submissions: 'unchanged', equipment: 'unchanged', authority: 'unchanged' },
    }) });
  cleanup.push(() => service.close());
  const receipt = await service.execute(startRun(plan));
  await until(() => service.events(plan, receipt.jobId)!.some(event => event.type === 'operation-recovery-paused') || service.getRun(plan, receipt.jobId)?.state === 'failed');
  const inspection = (await service.recoveryInspection(plan, receipt.jobId))!;
  expect(inspection, JSON.stringify(service.getRun(plan, receipt.jobId)?.failure)).not.toBeNull();
  expect(inspection.boundary).toMatchObject({ kind: 'gate', checkpoint });
  const retained = operationRecoverySchema.parse(JSON.parse(await readFile(runPath(target.root, plan, receipt.jobId,
    runLayout.operationRecovery(inspection.occurrenceId, inspection.revision)), 'utf8')));
  expect(retained.boundary).toMatchObject({ kind: 'gate', checkpoint });
  const accepted = service.events(plan, receipt.jobId)!.filter(event => event.type === 'invocation-ended').filter(event => event.data.ended === 'submitted');
  expect(accepted.length).toBeGreaterThan(0);
  const resume = (current: typeof inspection, group: number) => service.execute({ commandId: `restore-${checkpoint}-${group}`, expectedVersion: 0, type: 'resume-recovery', payload: {
    planId: plan, jobId: receipt.jobId,
  } });
  await resume(inspection, 1);
  if (groups === 2) {
    await until(() => service.events(plan, receipt.jobId)!.filter(event => event.type === 'operation-recovery-paused').length === 2);
    const again = (await service.recoveryInspection(plan, receipt.jobId))!;
    expect(again.attempts).toHaveLength(2);
    expect(service.events(plan, receipt.jobId)!.filter(event => event.type === 'invocation-ended')).toEqual(accepted);
    await resume(again, 2);
  }
  await service.settled(plan, receipt.jobId);
  const events = service.events(plan, receipt.jobId)!;
  expect(events.at(-1)?.type, JSON.stringify(events.at(-1))).toBe('job-completed');
  for (const producer of accepted) expect(events.filter(event => event.type === 'invocation-ended' && event.data.invocation === producer.data.invocation)).toEqual([producer]);
  const attempts = events.filter(event => event.type === 'gate-attempted').filter(event => event.data.checkpoint === checkpoint);
  expect(attempts.map(event => event.data.verdict)).toEqual([...Array.from({ length: groups }, () => 'not-verified'), 'passed']);
  expect(new Set(attempts.map(event => event.data.gate)).size).toBe(groups + 1);
  expect(events.filter(event => event.type === 'operation-recovery-resumed')).toHaveLength(groups);
  commands.assertComplete(); scriptedGit.assertComplete();
}, 60_000);
