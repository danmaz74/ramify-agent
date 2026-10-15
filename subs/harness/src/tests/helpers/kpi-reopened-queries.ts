import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { recordedProjectionConsumers, captureProjectionFiles } from './projection-consumers.js';
import { runId } from './constructed.js';
import { runLayout } from '../../run/records.js';
import { protocolPaths } from '../../interfaces/protocol/paths.js';

export async function reopenedKpiFixture() {
  const fixture = await recordedProjectionConsumers();
  const plan = 'review-notes';
  let baseline: Awaited<ReturnType<typeof answers>> | undefined;
  let bytes: Awaited<ReturnType<typeof captureProjectionFiles>> | undefined;
  let events: string | undefined;
  let repeated = false;
  async function answers() {
    const metrics = await fixture.queries.metrics(plan, runId);
    const sessions = await fixture.sessions.runSessions(plan, runId);
    assert.equal(sessions.total, 1); assert.equal(sessions.version, 11);
    assert.equal(sessions.sessions[0]!.session, 'ses-0001');
    assert.equal(metrics.policyVersion, 'kpi/1'); assert.equal(metrics.lineage.policyVersion, 'lineage/2');
    assert.deepEqual(await fixture.get(protocolPaths.runMetrics(plan, runId)), metrics);
    assert.deepEqual(await fixture.get(protocolPaths.runSessions(plan, runId)), sessions);
    const detail = await fixture.sessions.runSession(plan, runId, 'ses-0001');
    assert.deepEqual(detail.session, sessions.sessions[0]);
    assert.deepEqual(await fixture.get(protocolPaths.runSession(plan, runId, 'ses-0001')), detail);
    return { metrics, sessions, detail };
  }
  function zeroAcquisition() {
    assert.deepEqual(fixture.effects.acquisition, { measurement: 0, inputs: 0, command: 0 });
    fixture.noEffects();
  }
  async function interval() {
    zeroAcquisition();
    const files = await captureProjectionFiles(fixture.root);
    const sequence = (await fixture.queries.events(plan, runId, 0)).events.at(-1)!.sequence;
    for (let n = 0; n < 2; n++) {
      const response = await answers();
      if (baseline) assert.deepEqual(response, baseline); else baseline = response;
    }
    zeroAcquisition();
    assert.equal((await fixture.queries.events(plan, runId, 0)).events.at(-1)!.sequence, sequence);
    assert.deepEqual(await captureProjectionFiles(fixture.root), files);
  }
  return {
    async capture() {
      bytes = await captureProjectionFiles(fixture.directory);
      events = await readFile(join(fixture.directory, runLayout.events), 'utf8');
      await interval();
    },
    async reopen() { assert.ok(baseline); await fixture.reopen(true); await interval(); repeated = true; },
    compatible() { assert.ok(baseline); assert.ok(repeated); },
    async unchanged() {
      assert.deepEqual(await captureProjectionFiles(fixture.directory), bytes);
      assert.equal(await readFile(join(fixture.directory, runLayout.events), 'utf8'), events);
      assert.equal((await fixture.queries.events(plan, runId, 0)).events.at(-1)!.sequence, 11);
    },
    noAcquisition: zeroAcquisition,
    close: fixture.close,
  };
}
