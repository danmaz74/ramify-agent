import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

/** Check declarations, not just bundle success: root descendant APIs remain protocol-owned. */
export async function assertRootBrowserSurface() {
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
