import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { trialAttributionExitCode, trialReportDestination } from '../../../scripts/trial-attribution.js';
import { B, S, F, agent, old, plan, row, run } from '../helpers/trial-qualification.js';
import { After, Given, Then, When } from '@cucumber/cucumber';

/** Check declarations, not just bundle success: root descendant APIs remain protocol-owned. */
async function assertRootBrowserSurface() {
  const declaration = await readFile(new URL('../../../module.ramify', import.meta.url), 'utf8');
  const protocol = new URL('../../../subs/harness/src/interfaces/protocol/', import.meta.url);
  const exports = new Set<string>();
  for (const file of await readdir(protocol)) {
    if (!file.endsWith('.ts')) continue;
    const source = await readFile(new URL(file, protocol), 'utf8');
    for (const match of source.matchAll(/^export\s+(?:declare\s+)?(?:async\s+)?(?:const|type|interface|function|class|enum)\s+(\w+)/gm)) exports.add(match[1]!);
  }
  const selected = new Set<string>();
  for (const line of declaration.split('\n').map(line => line.trim()).filter(line => /^expose(?:-sub)?\s/.test(line))) {
    const match = /^expose-sub (.+) from harness to descendants$/.exec(line);
    assert.ok(match, `Unexpected production exposure: ${line}`);
    for (const symbol of match[1]!.split(',').map(name => name.trim())) {
      assert.ok(exports.has(symbol), `${symbol} is not a declared harness protocol export`);
      selected.add(symbol);
    }
  }
  for (const symbol of ['metricsResponseSchema', 'MetricsResponse', 'measurementPolicySchema', 'kpiPolicySchema', 'lineagePolicySchema', 'runResponseSchema', 'RunResponse']) assert.ok(selected.has(symbol), `Lost protocol export ${symbol}`);
  for (const symbol of ['verifySetupLineIdentities', 'SetupLineIdentityInput', 'HarnessLineIdentities', 'trialReportDestination', 'calculateRunMetrics', 'collectMeasurements']) assert.ok(!selected.has(symbol), `Implementation exposed: ${symbol}`);
}

async function rootQualificationFixture() {
  const root = await mkdtemp(join(tmpdir(), 'root-kpi-qualification-'));
  const project = join(root, 'project');
  await mkdir(join(project, 'plans'), { recursive: true });
  let results: Awaited<ReturnType<typeof exercise>> | undefined;
  async function exercise() {
    // All answers are authenticated raw Git bytes via scriptedTrialGitFake, never KPI answers.
    const valid = await run();
    const mixed = await run(plan({ final: agent, patch: '@@ -1,0 +2,2 @@\n+**/src/tmp/\n+secret-source.ts\n', origins: row(S, 2, 2, '**/src/tmp/') + row(F, 3, 3, 'secret-source.ts') }));
    const invalid = await run(plan({ origins: row(S, 2, 2, '**/src/tmp/').replace('filename .gitignore', 'filename other/.gitignore') }));
    const zero = await run(plan({ final: old, patch: '' }));
    const destination = await trialReportDestination(project, join(root, 'report.json'));
    await symlink(join(project, 'plans'), join(root, 'alias'), 'dir');
    await writeFile(join(root, 'original.json'), 'unchanged');
    await symlink(join(root, 'original.json'), join(root, 'linked.json'));
    const errors: Error[] = [];
    for (const path of [join(project, 'plans/report.json'), join(root, 'alias/report.json'), join(root, 'linked.json')]) {
      try { await trialReportDestination(project, path); assert.fail(`Accepted forbidden destination ${path}`); }
      catch (error) { assert.ok(error instanceof Error); errors.push(error); }
    }
    return { valid, mixed, invalid, zero, destination, errors };
  }
  function current() { assert.ok(results, 'Run the real root consumers first'); return results; }
  return {
    async exercise() { results = await exercise(); },
    compatibility() {
      const { valid, mixed, invalid, zero, destination } = current();
      assert.deepEqual(valid, { state: 'verified', reason: null, identities: { base: B, final: F, entries: [{ commit: S, path: '.gitignore', added: [2], deleted: [] }] }, setupOnly: true, added: 1, deleted: 0, nonSetup: { added: 0, deleted: 0, bytesChanged: false, modeChanged: false } });
      assert.deepEqual(mixed.identities?.entries, [{ commit: S, path: '.gitignore', added: [2], deleted: [] }, { commit: F, path: '.gitignore', added: [], deleted: [] }]);
      assert.equal(mixed.setupOnly, false);
      assert.deepEqual(mixed.nonSetup, { added: 1, deleted: 0, bytesChanged: false, modeChanged: false });
      assert.deepEqual(invalid, { state: 'unavailable', reason: 'Exact surviving setup line mapping unavailable', identities: { base: B, final: F, entries: [{ commit: S, path: '.gitignore', added: null, deleted: [] }] }, setupOnly: false, added: null, deleted: null, nonSetup: null });
      assert.equal(zero.state, 'verified'); assert.equal(zero.added, 0); assert.equal(zero.deleted, 0); assert.equal(zero.setupOnly, false);
      assert.deepEqual(zero.identities, { base: B, final: F, entries: [] });
      assert.deepEqual([valid, mixed, invalid, zero].map(trialAttributionExitCode), [0, 1, 2, 0]);
      assert.equal(destination, join(root, 'report.json'));
    },
    async protection() {
      const { errors } = current();
      assert.equal(errors.length, 3);
      assert.match(errors[0]!.message, /outside/); assert.match(errors[1]!.message, /outside/); assert.match(errors[2]!.message, /symlink/);
      assert.equal(await readFile(join(root, 'original.json'), 'utf8'), 'unchanged');
    },
    browser: assertRootBrowserSurface,
    async close() { await rm(root, { recursive: true, force: true }); },
  };
}

let fixture: Awaited<ReturnType<typeof rootQualificationFixture>> | undefined;
function current() { assert.ok(fixture, 'Create root qualification consumers first'); return fixture; }
Given('existing root qualification consumers of setup attribution and trial reporting', async () => { fixture = await rootQualificationFixture(); });
When('they verify valid and invalid setup evidence and choose report destinations', async () => { await current().exercise(); });
Then('their results and errors match the baseline through selected contracts', () => { current().compatibility(); });
Then('in-project and symlink report destinations remain refused', async () => { await current().protection(); });
Then('no KPI implementation becomes a browser production API', async () => { await current().browser(); });
After(async () => { const closing = fixture; fixture = undefined; await closing?.close(); });
