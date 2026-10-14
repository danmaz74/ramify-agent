import { expect, test } from 'vitest';
import { createQuerySource } from '../http/query-source.js';
import { RunQueries, type RunSource } from '../../subs/projections/src/queries.js';
import { SessionQueries } from '../../subs/projections/src/session-queries.js';
import { ProjectionError } from '../../subs/projections/src/inputs.js';
import { constructedRun } from './helpers/constructed.js';
import { temporaryDirectory } from './helpers/fixture.js';
import { scriptedCandidates } from './helpers/candidates.js';
import { unscriptedChangeHistory } from './helpers/runs.js';

/** Scripted committed inputs; forbidden service collaborators must never escape. */
class FakeReadingService implements RunSource {
  agentName: string | undefined = 'scripted';
  readonly run = constructedRun([{ type: 'job-started', data: {} }]);
  readonly ledger = { append: () => { throw new Error('no ledger writes'); } };
  readonly writers = { write: () => { throw new Error('no record writes'); } };
  readonly commandExecutor = () => { throw new Error('no commands'); };
  command() { throw new Error('no service commands'); }
  readonly changeHistory = unscriptedChangeHistory;
  readonly candidateSource;
  constructor(readonly projectRoot: string) {
    this.candidateSource = scriptedCandidates(projectRoot, {});
  }
  committed(planId: string, runId: string) {
    expect(this).toBeInstanceOf(FakeReadingService);
    return planId === this.run.record.planId && runId === this.run.record.jobId ? this.run : undefined;
  }
  committedRuns(planId: string) {
    expect(this).toBeInstanceOf(FakeReadingService);
    return planId === this.run.record.planId ? [this.run] : [];
  }
  runVersions() {
    expect(this).toBeInstanceOf(FakeReadingService);
    return [{ planId: this.run.record.planId, runId: this.run.record.jobId, version: 1 }];
  }
}

test('HTTP composition supplies only frozen reading ports to the unchanged real query providers', async () => {
  const fixture = await temporaryDirectory();
  try {
    const service = new FakeReadingService(fixture.path);
    const source = createQuerySource(service);
    expect(Object.keys(source).sort()).toEqual([
      'agentName', 'candidateSource', 'changeHistory', 'committed', 'committedRuns', 'projectRoot', 'runVersions',
    ]);
    expect(Object.isFrozen(source)).toBe(true);
    for (const descriptor of Object.values(Object.getOwnPropertyDescriptors(source))) {
      expect(descriptor.set).toBeUndefined();
      expect(descriptor.writable).not.toBe(true);
    }
    for (const name of ['command', 'ledger', 'writers', 'commandExecutor', 'recordCheckFindings', 'close']) {
      expect(name in source).toBe(false);
    }
    service.agentName = undefined;
    expect(source.agentName).toBeUndefined();
    expect(source.projectRoot).toBe(fixture.path);
    expect(source.candidateSource).toBe(service.candidateSource);
    expect(source.changeHistory).toBe(service.changeHistory);
    expect(source.committedRuns(service.run.record.planId)).toEqual([service.run]);
    expect(source.runVersions()).toHaveLength(1);
    const queries = new RunQueries(source);
    const sessions = new SessionQueries(source);
    const { planId, jobId } = service.run.record;
    expect(await queries.run(planId, jobId)).toEqual(await new RunQueries(service).run(planId, jobId));
    expect(await queries.events(planId, jobId, 0)).toEqual(await new RunQueries(service).events(planId, jobId, 0));
    expect(await sessions.runSessions(planId, jobId)).toEqual({ version: 1, sessions: [], total: 0 });
    expect(await sessions.list(0)).toEqual({ sessions: [], total: 0, offset: 0, next: null, unserved: [] });
    await expect(queries.run('missing', 'missing')).rejects.toBeInstanceOf(ProjectionError);
    await expect(sessions.runSessions('missing', 'missing')).rejects.toBeInstanceOf(ProjectionError);
  } finally { await fixture.remove(); }
});
