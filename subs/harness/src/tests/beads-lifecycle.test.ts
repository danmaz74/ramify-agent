import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { readSessionPointReference } from '../../subs/task-execution/src/session-operations.js';
import { sha256 } from '../prompts/packages.js';
import { copyFixture } from './helpers/fixture.js';
import { writeProjectConfig } from './helpers/project-config.js';
import { emptyAnalysis, installTestRunner, onlyRun, startRun, stopRun, until } from './helpers/runs.js';
import { openUnchangedRuns, assertUnchangedGit } from './helpers/unchanged-run.js';
import { expectNoProcesses, forgetExternalTools } from './helpers/external-tools.js';

const administration = vi.hoisted(() => ({
  open: vi.fn(), scheduleStart: vi.fn(), scheduleFinish: vi.fn(), recover: vi.fn(), close: vi.fn(),
}));
vi.mock('../run/beads-sessions.js', () => ({ BeadsSessions: { open: administration.open } }));

const cleanups: Array<() => Promise<void>> = [];
beforeEach(() => {
  for (const mock of Object.values(administration)) mock.mockReset();
  administration.open.mockResolvedValue(administration);
  administration.scheduleStart.mockResolvedValue(undefined);
  administration.scheduleFinish.mockResolvedValue(undefined);
  administration.recover.mockResolvedValue(undefined);
  administration.close.mockResolvedValue(true);
});
afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
  try { assertUnchangedGit(); expectNoProcesses(); } finally { forgetExternalTools(); }
});
async function target(beads?: unknown) {
  const fixture = await copyFixture();
  cleanups.push(fixture.remove);
  await installTestRunner(fixture.root);
  await writeProjectConfig(fixture.root, { schema: 'ramify-agent.project/1', ...(beads === undefined ? {} : { beads }) });
  return fixture.root;
}
async function completed(root: string, options: Parameters<typeof openUnchangedRuns>[1] = {}) {
  const opened = await openUnchangedRuns(root, { script: [{ kind: 'submit', input: emptyAnalysis() }],
    unchangedCheckpoints: ['final verification of plan "review-notes"'], ...options });
  cleanups.push(() => opened.service.close());
  const receipt = await opened.service.execute(startRun('review-notes'));
  await opened.service.settled('review-notes', receipt.jobId);
  return { ...opened, receipt };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

describe('optional run issue administration lifecycle', () => {
  test.each([undefined, false])('does no administrative work when configured as %s', async beads => {
    const { service } = await completed(await target(beads));
    expect(onlyRun(service, 'review-notes').state).toBe('completed');
    expect(administration.open).not.toHaveBeenCalled();
    expect(administration.scheduleStart).not.toHaveBeenCalled();
    expect(administration.scheduleFinish).not.toHaveBeenCalled();
  });

  test('queues implementation start after accepted analysis and readiness, then supplies terminal acceptance evidence', async () => {
    const root = await target({ workspace: { path: '../tracker' }, executable: 'my-bd' });
    const phases: string[] = [];
    const auditDetails = 'AUDIT_PROVIDER_DETAILS_REMAIN_IN_THE_REPORT';
    const { service, receipt } = await completed(root, { afterWrite: async write => { phases.push(write); },
      checkScript: () => ({ stdout: auditDetails }) });
    const start = administration.scheduleStart.mock.calls[0]![0] as { runId: string; sourceRef: string; context: string; workspace: string; executable: string };
    const finish = administration.scheduleFinish.mock.calls[0]![0] as typeof start & { outcome: string };
    expect(service.recordOf('review-notes', receipt.jobId)?.beadsAdministration).toEqual({ trackerWorkspace: join(root, '..', 'tracker'), executable: 'my-bd' });
    expect(start.runId).toBe(receipt.jobId);
    expect(start.workspace).toBe(join(root, '..', 'tracker'));
    expect(readSessionPointReference(start.sourceRef)?.runId).toBe(receipt.jobId);
    expect(start.context).toContain('"type":"analysis-accepted"');
    expect(start.context).toContain('"readinessAttempts":1');
    expect(start.context).toContain('implementation beginning');
    expect(start.context).not.toContain('ramify-agent.prepared-candidate/1');
    expect(phases).toContain('analysis-accepted');
    expect(finish.outcome).toBe('job-completed');
    expect(finish.context).toContain('ramify-agent.prepared-candidate/1');
    expect(finish.context).toContain('ramify-agent.nonfunctional-assessment/2');
    expect(finish.context).toContain('ramify-agent.gate-attempt/');
    expect(finish.context).not.toContain(auditDetails);
    expect(finish.context).not.toContain('"provider":');
    const evidence = JSON.parse(finish.context.split('Retained evidence: ')[1]!);
    const gate = evidence.find((entry: { path: string }) => entry.path.startsWith('gates/')).body;
    expect(gate).toMatchObject({ verdict: 'passed', audit: { status: 'completed', verdict: 'pass' },
      reportPath: expect.stringContaining('/gates/') });
    const retainedReport = await readFile(gate.reportPath, 'utf8');
    expect(retainedReport).toContain(auditDetails);
    expect((finish as typeof finish & { reports: Array<{ path: string; hash: string }> }).reports)
      .toEqual([{ path: gate.reportPath, hash: sha256(retainedReport) }]);
    expect(finish.context).toContain('"type":"job-completed"');
    expect(finish.context).toContain('unresolved deviations');
    expect(finish.sourceRef).toBe(start.sourceRef);
    const events = service.events('review-notes', receipt.jobId)!;
    const architect = events.find(event => event.type === 'invocation-started' && event.data.role === 'initial-architect');
    expect(architect?.type).toBe('invocation-started');
    if (architect?.type === 'invocation-started') {
      expect(events.some(event => event.type === 'session-finished' && event.data.session === architect.data.session)).toBe(true);
    }
  });

  test('administrative enqueue failures preserve ordinary completion', async () => {
    administration.scheduleStart.mockRejectedValue(new Error('tracker unavailable'));
    administration.scheduleFinish.mockRejectedValue(new Error('queue unavailable'));
    const { service, warnings } = await completed(await target({ workspace: { path: '/configured-tracker' } }));
    expect(onlyRun(service, 'review-notes').state).toBe('completed');
    expect(warnings.join('\n')).toContain('Beads start administration unavailable: tracker unavailable');
    expect(warnings.join('\n')).toContain('Beads finish administration unavailable: queue unavailable');
    administration.open.mock.calls[0]![0].onPending('retained-run', 'late delivery unavailable');
    expect(warnings.join('\n')).toContain('Run retained-run: Beads administration pending: late delivery unavailable');
  });

  test('captures an unavailable shared workspace without refusing implementation', async () => {
    const { service, receipt, warnings } = await completed(await target({ workspace: 'git-common-root' }),
      { gitScript: { commonDirectory: '/a-bare-repository' } });
    expect(onlyRun(service, 'review-notes').state).toBe('completed');
    expect(service.recordOf('review-notes', receipt.jobId)?.beadsAdministration).toMatchObject({ error: expect.any(String) });
    expect(warnings.join('\n')).toContain('Beads administration destination unavailable');
    expect(administration.open).not.toHaveBeenCalled();
  });

  test('a stop awaiting analysis approval retains its unresolved outcome and never marks implementation started', async () => {
    const root = await target({ workspace: { path: '/configured-tracker' } });
    const { service } = await openUnchangedRuns(root, { script: [{ kind: 'submit', input: emptyAnalysis() }] });
    cleanups.push(() => service.close());
    const receipt = await service.execute(startRun('review-notes', 'scripted', undefined, true));
    await until(() => service.events('review-notes', receipt.jobId)?.some(event => event.type === 'review-requested') === true);
    expect(administration.scheduleStart).not.toHaveBeenCalled();
    await service.execute(stopRun('review-notes', receipt.jobId, onlyRun(service, 'review-notes').version));
    await service.settled('review-notes', receipt.jobId);
    expect(administration.scheduleFinish).toHaveBeenCalledWith(expect.objectContaining({ outcome: 'job-stopped' }));
    const context = administration.scheduleFinish.mock.calls[0]![0].context as string;
    expect(context).toContain('"state":"stopped"');
    expect(context).toContain('preserve unresolved, failed, interrupted and stopped work truthfully');
  });

  test('pins destination across restart and drains administration before releasing the project lock', async () => {
    const root = await target({ workspace: { path: '/original-tracker' } });
    const first = await completed(root);
    const draining = deferred<boolean>();
    administration.close.mockReturnValueOnce(draining.promise);
    const closing = first.service.close();
    await until(() => administration.close.mock.calls.length === 1);
    expect(await first.lock.held()).toBe(true);
    draining.resolve(true);
    await closing;
    expect(await first.lock.held()).toBe(false);

    await writeProjectConfig(root, { schema: 'ramify-agent.project/1', beads: false });
    const reopened = await openUnchangedRuns(root, { script: [] });
    cleanups.push(() => reopened.service.close());
    expect(administration.recover).toHaveBeenCalledWith(first.receipt.jobId);
    expect(administration.scheduleFinish.mock.calls.at(-1)![0]).toMatchObject({ workspace: '/original-tracker', outcome: 'job-completed' });
    expect(onlyRun(reopened.service, 'review-notes').state).toBe('completed');
  });
});
