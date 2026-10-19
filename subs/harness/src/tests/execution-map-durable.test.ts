import { afterEach, describe, expect, it, vi } from 'vitest';
import { RunQueries } from '../../subs/projections/src/queries.js';
import { createQuerySource } from '../http/query-source.js';
import { gateAuditOutcomeSchema } from '../../subs/autonomous/subs/acceptance/src/gate-records.js';
import { runLayout } from '../../subs/autonomous/src/run/records.js';
import type { RunService } from '../run/lifecycle.js';
import { analysis, entry } from './helpers/analysis.js';
import { passingAudit } from './helpers/direct-check-execution.js';
import { emptyAnalysis } from './helpers/runs.js';
import { copyFixture } from './helpers/fixture.js';
import { expectNoProcesses, forgetExternalTools } from './helpers/external-tools.js';
import { installTestRunner, startRun, stopRun, until } from './helpers/runs.js';
import { assertUnchangedGit, openUnchangedRuns } from './helpers/unchanged-run.js';

vi.mock('node:child_process', async original =>
  (await import('./helpers/process-guard.js')).guardedChildProcess(await original<typeof import('node:child_process')>()));

const cleanup: Array<() => Promise<void>> = [];
afterEach(async () => {
  try {
    for (const release of cleanup.splice(0).reverse()) await release();
    assertUnchangedGit();
    expectNoProcesses();
  } finally { forgetExternalTools(); }
});

async function indexOf(service: RunService, runId: string) {
  const committed = service.committed('review-notes', runId);
  if (committed === undefined) throw new Error(`Missing committed run ${runId}`);
  const queries = new RunQueries(createQuerySource(service));
  return { index: await queries.executionCore('review-notes', runId), queries, committed };
}

describe('execution projection over a persisted run', () => {
  it('replays the independent published audit result after restart', async () => {
    const fixture = await copyFixture();
    cleanup.push(fixture.remove);
    await installTestRunner(fixture.root);
    // The final gate's configured audit composes `pass`, which the run
    // publishes as the gate's independent audit outcome.
    const first = await openUnchangedRuns(fixture.root, {
      script: [{ kind: 'submit', input: emptyAnalysis() }],
      unchangedCheckpoints: ['final verification of plan "review-notes"'],
      configuredAudit: passingAudit(),
    });
    cleanup.push(() => first.service.close());
    const receipt = await first.service.execute(startRun('review-notes'));
    await first.service.settled('review-notes', receipt.jobId);
    const before = await indexOf(first.service, receipt.jobId);
    const final = before.index.nodes.find(node => node.kind === 'gate' && node.checkpoint === 'final');
    expect(final).toMatchObject({ verdict: 'passed', audit: 'passed', evidencePresent: true });
    const auditBody = before.committed.entries.flatMap(line => line.transaction.records)
      .find(record => record.path === runLayout.gateAuditOutcome(final!.key.slice('gate:'.length)))?.body;
    expect(gateAuditOutcomeSchema.parse(auditBody).overall).toBe('pass');
    await first.service.close();
    const reopened = await openUnchangedRuns(fixture.root, { script: [] });
    cleanup.push(() => reopened.service.close());
    expect((await indexOf(reopened.service, receipt.jobId)).index).toEqual(before.index);
  }, 120_000);

  it('replays the same complete roots, scenario blocks and sessions after service restart', async () => {
    const fixture = await copyFixture();
    cleanup.push(fixture.remove);
    await installTestRunner(fixture.root);
    const accepted = analysis([
      entry('first-root', 'collection-review/workspace/reviews', 'The first complete capability description.'),
      entry('second-root', 'collection-review', 'The second complete capability description.'),
    ]);
    const first = await openUnchangedRuns(fixture.root, { script: [{ kind: 'submit', input: accepted }] });
    cleanup.push(() => first.service.close());
    const receipt = await first.service.execute(startRun('review-notes', 'scripted', 'start-map', true));
    await until(() => first.service.getRun('review-notes', receipt.jobId)?.phase === 'awaiting-review');
    const beforeStop = await indexOf(first.service, receipt.jobId);
    const queries = new RunQueries(createQuerySource(first.service));
    expect(await queries.executionCore('review-notes', receipt.jobId)).toEqual(beforeStop.index);
    expect(beforeStop.index.nodes.filter(node => node.kind === 'capability').map(node => node.key))
      .toEqual(['capability:first-root', 'capability:second-root']);
    expect(beforeStop.index.nodes.filter(node => node.kind === 'scenario')).toHaveLength(2);
    expect(beforeStop.index.nodes.filter(node => node.kind === 'work-item')).toHaveLength(2);
    // The catalog intake's, the plan architect's and the plan checker's.
    expect(beforeStop.index.nodes.filter(node => node.kind === 'session')).toHaveLength(3);
    expect((await beforeStop.queries.executionCapabilityDetail('review-notes', receipt.jobId, 'first-root')).detail).toMatchObject({
      state: 'available', description: 'The first complete capability description.',
    });
    expect((await queries.executionCapabilityDetail('review-notes', receipt.jobId, 'first-root')).detail).toMatchObject({
      state: 'available', description: 'The first complete capability description.',
    });
    const scenarioId = beforeStop.index.nodes.find(node => node.kind === 'scenario')?.key.slice('scenario:'.length);
    if (scenarioId === undefined) throw new Error('Missing tracked scenario');
    expect((await beforeStop.queries.executionScenarioDetail('review-notes', receipt.jobId, scenarioId)).detail).toMatchObject({ state: 'available', source: expect.arrayContaining([expect.stringMatching(/^Scenario:/)]) });
    expect((await queries.executionScenarioDetail('review-notes', receipt.jobId, scenarioId)).detail.state).toBe('available');

    const version = first.service.getRun('review-notes', receipt.jobId)!.version;
    await first.service.execute(stopRun('review-notes', receipt.jobId, version));
    await first.service.settled('review-notes', receipt.jobId);
    const settled = await indexOf(first.service, receipt.jobId);
    const settledVersion = settled.index.runVersion;
    const firstPage = await new RunQueries(createQuerySource(first.service)).executionMapPage('review-notes', receipt.jobId,
      { version: settledVersion, limit: 1 });
    expect(firstPage.nextCursor).not.toBeNull();
    const followingPage = await new RunQueries(createQuerySource(first.service)).executionMapPage('review-notes', receipt.jobId,
      { version: settledVersion, cursor: firstPage.nextCursor!, limit: 1 });
    await first.service.close();

    const reopened = await openUnchangedRuns(fixture.root, { script: [] });
    cleanup.push(() => reopened.service.close());
    const replayed = await indexOf(reopened.service, receipt.jobId);
    expect(replayed.index).toEqual(settled.index);
    expect(await new RunQueries(createQuerySource(reopened.service)).executionMapPage('review-notes', receipt.jobId,
      { version: settledVersion, limit: 1 })).toEqual(firstPage);
    expect(await new RunQueries(createQuerySource(reopened.service)).executionMapPage('review-notes', receipt.jobId,
      { version: settledVersion, cursor: firstPage.nextCursor!, limit: 1 })).toEqual(followingPage);
    expect(await replayed.queries.executionCapabilityDetail('review-notes', receipt.jobId, 'first-root'))
      .toEqual(await settled.queries.executionCapabilityDetail('review-notes', receipt.jobId, 'first-root'));
    expect(await replayed.queries.executionScenarioDetail('review-notes', receipt.jobId, scenarioId))
      .toEqual(await settled.queries.executionScenarioDetail('review-notes', receipt.jobId, scenarioId));
  }, 120_000);
});
