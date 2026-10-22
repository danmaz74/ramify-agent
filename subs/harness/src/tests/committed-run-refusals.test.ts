import assert from 'node:assert/strict';
import { cp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'vitest';
import { RunLog } from '../../subs/autonomous/src/run/log.js';
import { runLayout } from '../../subs/autonomous/src/run/records.js';
import { commitRecord } from '../jobs/commit.js';
import { errorResponseSchema } from '../interfaces/protocol/errors.js';
import { protocolPaths } from '../interfaces/protocol/paths.js';
import { runId } from './helpers/constructed.js';
import { captureProjectionFiles, recordedProjectionConsumers } from './helpers/projection-consumers.js';

const failures = [
  { run: '20260921T080000Z-000001', code: 'unsupported-version', schema: '999' },
  { run: '20260921T080000Z-000002', code: 'unreadable', schema: '1' },
] as const;

test('committed malformed and unsupported current run records are refused after reopening without query writes', async () => {
  const warnings: string[] = [];
  const fixture = await recordedProjectionConsumers(false, async (_root, directory) => {
    for (const failure of failures) {
      const invalidRun = join(directory, '..', failure.run);
      await cp(directory, invalidRun, { recursive: true });
      const record = JSON.parse(await readFile(join(invalidRun, runLayout.record), 'utf8')) as { jobId: string };
      record.jobId = failure.run;
      await writeFile(join(invalidRun, runLayout.record), JSON.stringify(record));
      const lines = (await readFile(join(invalidRun, runLayout.events), 'utf8')).trim().split('\n');
      lines.pop();
      await writeFile(join(invalidRun, runLayout.events), lines.join('\n').replaceAll(runId, failure.run) + '\n');
      const log = await RunLog.open(join(invalidRun, runLayout.events), failure.run);
      await commitRecord(log.ledger, { event: log.next({ type: 'restart-branch-ready', data: { branch: 'candidate', head: 'head', tree: 'tree' } }), records: [
        { path: 'hypotheses/hyp-001.json', id: 'hyp-001', revision: 1, body: { schema: `ramify-agent.hypothesis/${failure.schema}` } },
      ] });
      await log.append({ type: 'job-completed', data: { gate: 'ga-recorded', commit: 'a'.repeat(40), workItems: 0 } });
    }
  }, message => {
    assert.match(message, /closed iteration scratch could not be cleaned: hypotheses\/hyp-001\.json/);
    warnings.push(message);
  });
  try {
    assert.equal(warnings.length, 1);
    await fixture.reopen();
    assert.equal(warnings.length, 2);
    const before = await captureProjectionFiles(fixture.root);
    for (const failure of failures) {
      let caught: unknown;
      try { await fixture.queries.run('review-notes', failure.run); } catch (error) { caught = error; }
      assert.ok(caught && typeof caught === 'object' && 'code' in caught && 'evidence' in caught && 'message' in caught);
      assert.equal(caught.code, failure.code);
      assert.ok(Array.isArray(caught.evidence) && caught.evidence.some(value => typeof value === 'string'
        && value.endsWith(`plans/review-notes/.harness/jobs/${failure.run}/hypotheses/hyp-001.json`)));
      const http = errorResponseSchema.parse(await fixture.get(protocolPaths.run('review-notes', failure.run), 422)).error;
      assert.deepEqual(http, { code: caught.code, message: caught.message, evidence: caught.evidence });
    }
    const list = await fixture.sessions.list(0);
    assert.equal(list.unserved.length, 2);
    assert.deepEqual(await fixture.get(protocolPaths.sessions(0)), list);
    assert.deepEqual(await captureProjectionFiles(fixture.root), before);
    fixture.noEffects();
  } finally { await fixture.close(); }
}, 60_000);
