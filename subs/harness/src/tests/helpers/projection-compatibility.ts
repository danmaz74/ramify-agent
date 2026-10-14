import assert from 'node:assert/strict';
import { cp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { historicalSessionLayout as layout } from '../../../subs/projections/src/tests/helpers/historical-session-layout.js';
import { installLegacySessions, legacySessions } from './legacy-sessions.js';
import { recordedProjectionConsumers, captureProjectionFiles } from './projection-consumers.js';
import { runLayout } from '../../run/records.js';
import { RunLog } from '../../run/log.js';
import { commitRecord } from '../../jobs/commit.js';
import { runId } from './constructed.js';
import { protocolPaths as paths } from '../../interfaces/protocol/paths.js';
import { errorResponseSchema } from '../../interfaces/protocol/errors.js';

const failures = [
  { id: '20261010T090000Z-000001', run: '20260921T080000Z-000001', code: 'unsupported-version', schema: '999' },
  { id: '20261010T090000Z-000002', run: '20260921T080000Z-000002', code: 'unreadable', schema: '1' },
] as const;

export async function recordedCompatibility() {
  const warnings: string[] = [];
  const fixture = await recordedProjectionConsumers(false, async (root, directory) => {
    await installLegacySessions(root);
    await rm(join(root, layout.directory, legacySessions.crashed, layout.outcome));
    for (const failure of failures) {
      const sessionDirectory = join(root, layout.directory, failure.id);
      await cp(join(root, layout.directory, legacySessions.finished), sessionDirectory, { recursive: true });
      await writeFile(join(sessionDirectory, layout.session), JSON.stringify({ schema: `ramify-agent.session/${failure.schema === '999' ? '999' : '2'}`, policy: { version: 'run-policy/7' } }));
      const invalidRun = join(directory, '..', failure.run);
      await cp(directory, invalidRun, { recursive: true });
      const record = JSON.parse(await readFile(join(invalidRun, runLayout.record), 'utf8'));
      record.jobId = failure.run;
      await writeFile(join(invalidRun, runLayout.record), JSON.stringify(record));
      const lines = (await readFile(join(invalidRun, runLayout.events), 'utf8')).trim().split('\n');
      lines.pop(); // Setup replaces the terminal event before committing a counterexample.
      await writeFile(join(invalidRun, runLayout.events), lines.join('\n').replaceAll(runId, failure.run) + '\n');
      const log = await RunLog.open(join(invalidRun, runLayout.events), failure.run);
      await commitRecord(log.ledger, { event: log.next({ type: 'restart-branch-ready', data: { branch: 'candidate', head: 'head', tree: 'tree' } }), records: [
        { path: 'hypotheses/hyp-001.json', id: 'hyp-001', revision: 1, body: { schema: `ramify-agent.hypothesis/${failure.schema}` } },
      ] });
      await log.append({ type: 'job-completed', data: { gate: 'ga-recorded', commit: 'a'.repeat(40), workItems: 0 } });
    }
  }, message => {
    assert.ok(message.includes('closed iteration scratch could not be cleaned: hypotheses/hyp-001.json'), message);
    warnings.push(message);
  });
  assert.equal(warnings.length, 1);
  let boundary = await captureProjectionFiles(fixture.root);
  async function supported() {
    const run = await fixture.queries.run('review-notes', runId);
    assert.equal(run.run.state, 'completed'); assert.equal(run.run.version, 11);
    assert.deepEqual(await fixture.get(paths.run('review-notes', runId)), run);
    const events = await fixture.queries.events('review-notes', runId, 0);
    assert.deepEqual(events.events.map(row => row.transition), ['document-manifest-committed', 'job-started', 'session-opened', 'invocation-started', 'invocation-ended', 'consultation-started', 'consultation-finished', 'consultation-started', 'consultation-finished', 'repair-incident-recorded', 'job-completed']);
    assert.deepEqual(await fixture.get(paths.runEvents('review-notes', runId, 0)), events);
    const transcript = await fixture.sessions.transcript({ source: 'run', planId: 'review-notes', runId, session: 'ses-0001' }, 0);
    assert.equal(transcript.page.entries.length, 1);
    assert.deepEqual(transcript.page.entries, (await readFile(join(fixture.directory, runLayout.transcript('ses-0001')), 'utf8')).trim().split('\n').map(line => JSON.parse(line)));
    assert.deepEqual(await fixture.get(paths.runSessionTranscript('review-notes', runId, 'ses-0001', 0)), transcript);
    const sessions = await fixture.sessions.runSessions('review-notes', runId);
    assert.deepEqual(sessions.sessions.map(row => [row.session, row.state, row.finished, row.model]), [['ses-0001', 'finished', 'work-closed', 'recorded-model']]);
    assert.deepEqual(await fixture.get(paths.runSessions('review-notes', runId)), sessions);
    for (const [id, state] of [[legacySessions.finished, 'finished'], [legacySessions.crashed, 'interrupted']] as const) {
      const answer = await fixture.sessions.standaloneSession(id);
      assert.equal(answer.session.state, state);
      assert.equal(answer.session.executor, 'scripted');
      if (state === 'finished') { assert.equal(answer.prompt, 'Raise the note limit to 500.'); assert.equal(answer.outcome?.ended, 'submitted'); }
      else { assert.equal(answer.outcome, null); assert.equal(answer.evaluation.ended, null); }
      assert.deepEqual(await fixture.get(paths.standaloneSession(id)), answer);
      const ref = { source: 'standalone' as const, session: id };
      const transcript = await fixture.sessions.transcript(ref, 0);
      const recorded = (await readFile(join(fixture.root, layout.directory, id, layout.transcript), 'utf8')).trim().split('\n').map(line => JSON.parse(line));
      assert.deepEqual(transcript.page.entries, recorded.slice(0, transcript.page.entries.length));
      assert.ok(transcript.page.entries.length > 0);
      assert.deepEqual(await fixture.get(paths.standaloneTranscript(id, 0)), transcript);
    }
  }
  async function refused() {
    for (const failure of failures) {
      for (const [read, path, evidence] of [
        [() => fixture.queries.run('review-notes', failure.run), paths.run('review-notes', failure.run), `plans/review-notes/.harness/jobs/${failure.run}/hypotheses/hyp-001.json`],
        [() => fixture.sessions.standaloneSession(failure.id), paths.standaloneSession(failure.id), `${layout.directory}/${failure.id}/${layout.session}`],
      ] as const) {
        let caught: unknown;
        try { await read(); } catch (error) { caught = error; }
        assert.ok(caught && typeof caught === 'object' && 'code' in caught && 'evidence' in caught && 'message' in caught);
        assert.equal(caught.code, failure.code);
        assert.ok(Array.isArray(caught.evidence) && caught.evidence.some(value => typeof value === 'string' && value.endsWith(evidence)), JSON.stringify(caught));
        const http = errorResponseSchema.parse(await fixture.get(path, 422)).error;
        assert.deepEqual(http, { code: caught.code, message: caught.message, evidence: caught.evidence });
      }
    }
    const list = await fixture.sessions.list(0);
    assert.equal(list.unserved.length, 4); // Both invalid runs and sessions remain explicit, not silently absent.
    assert.deepEqual(await fixture.get(paths.sessions(0)), list);
  }
  return {
    close: fixture.close,
    reopen: async () => {
      const before = await captureProjectionFiles(fixture.root);
      assert.deepEqual(before, boundary); // Includes any queries performed before reopening.
      fixture.noEffects();
      const recovery = await fixture.reopen();
      assert.equal(warnings.length, 2);
      assert.deepEqual(recovery.interrupted, []);
      assert.deepEqual(recovery.rematerialized, []);
      const after = await captureProjectionFiles(fixture.root);
      // Lock ownership is service setup, never a query effect.
      for (const path of new Set([...Object.keys(before), ...Object.keys(after)])) {
        if (path.endsWith('/plans/.harness/lock')) continue;
        assert.deepEqual(after[path], before[path], path);
      }
      boundary = after;
      for (let round = 0; round < 3; round++) { await supported(); await refused(); }
    },
    supported, refused,
    unchanged: async () => { assert.deepEqual(await captureProjectionFiles(fixture.root), boundary); fixture.noEffects(); },
  };
}
