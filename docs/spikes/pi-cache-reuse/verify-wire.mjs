import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';

// Offline verification independent of Pi's parser and normalized usage.
const directory = resolve(process.argv[2] ?? '');
assert.ok(process.argv[2], 'Usage: node verify-wire.mjs <completed evidence directory>');
const summary = JSON.parse(await readFile(join(directory, 'summary.json'), 'utf8'));
assert.equal(summary.status, 'completed');
const sourceHash = createHash('sha256').update(await readFile(join(directory, 'runner.mjs'))).digest('hex');
assert.equal(sourceHash, summary.runnerSha256);
const responseIds = new Set();
for (const row of summary.calls) {
  assert.equal(row.statusCode, 200);
  const original = JSON.parse(await readFile(join(directory, row.originalResponseFile), 'utf8'));
  const sse = await readFile(join(directory, `responses/${row.id}.sse`), 'utf8');
  const events = sse.split('\n').filter(line => line.startsWith('data:') && line.slice(5).trim() !== '[DONE]').map(line => JSON.parse(line.slice(5).trim()));
  const completed = events.filter(event => ['response.completed', 'response.done'].includes(event.type) && event.response?.usage);
  assert.equal(completed.length, 1, `${row.id}: expected one original completion`);
  assert.deepEqual(completed[0].response, original, `${row.id}: original response differs from wire`);
  assert.equal(typeof original.id, 'string'); assert.ok(!responseIds.has(original.id), `${row.id}: duplicate provider response identity`); responseIds.add(original.id);
  assert.equal(original.usage.input_tokens, row.inputTokens);
  assert.equal(original.usage.input_tokens_details?.cached_tokens ?? 0, row.cacheRead);
  assert.equal(original.usage.input_tokens_details?.cache_write_tokens ?? 0, row.cacheWrite);
  if (summary.dispatch === 'concurrent') {
    const actualText = original.output.filter(item => item.type === 'message').flatMap(item => item.content).filter(block => block.type === 'output_text').map(block => block.text).join('').trim();
    assert.equal(actualText, row.reply.trim(), `${row.id}: normalized reply differs from original response`);
    if (row.kind === 'fork-turn') {
      const body = JSON.parse(await readFile(join(directory, row.requestFile), 'utf8'));
      const userTexts = body.input.filter(item => item.role === 'user').map(item => item.content.filter(block => block.type === 'input_text').map(block => block.text).join(''));
      const task = userTexts.at(-1);
      const label = task.match(/the literal (ACK_[A-Za-z0-9_]+)/)?.[1];
      const marker = userTexts.find(text => text.includes(`BRANCH_${row.branch}_TURN_1:`))?.match(/private first-turn marker is ([a-f0-9]+)\./)?.[1];
      const record = task.match(/revision of Record (\d+)/)?.[1];
      const revision = userTexts[0].match(new RegExp(`Record ${record}: [^\\n]*?revision ([a-f0-9]+);`))?.[1];
      assert.ok(label && marker && revision, `${row.id}: branch output contract missing from native input`);
      assert.equal(actualText, `${label} ${marker} ${revision}`, `${row.id}: branch response used the wrong private or inherited state`);
    } else assert.equal(actualText, 'READY');
  }
}
const strategies = summary.modes.map(mode => {
  const rows = summary.calls.filter(row => row.mode === mode && row.kind === 'fork-turn');
  const first = rows.filter(row => row.round === 1); const later = rows.filter(row => row.round > 1);
  return { mode, firstTurnHits: first.filter(row => row.cacheRead > 0).length, firstTurns: first.length,
    laterHits: later.filter(row => row.cacheRead > 0).length, laterTurns: later.length,
    weightedReadPercent: 100 * rows.reduce((sum, row) => sum + row.cacheRead, 0) / rows.reduce((sum, row) => sum + row.inputTokens, 0),
    coldForkCalls: rows.filter(row => row.cacheRead === 0).map(row => row.id) };
});
const concurrentPairs = [];
if (summary.dispatch === 'concurrent') {
  const groups = new Set(summary.calls.filter(row => row.dispatchGroup).map(row => row.dispatchGroup));
  assert.equal(groups.size, summary.repeats * summary.modes.length * summary.rounds);
  for (const group of groups) {
    const pair = summary.calls.filter(row => row.dispatchGroup === group);
    assert.equal(pair.length, 2);
    const overlapMs = Math.min(...pair.map(row => row.streamCompletedAtMs)) - Math.max(...pair.map(row => row.fetchStartedAtMs));
    assert.ok(overlapMs > 0, `${group}: no recorded HTTP overlap`);
    concurrentPairs.push({ group, overlapMs, dispatchGapMs: Math.abs(pair[0].fetchStartedAtMs - pair[1].fetchStartedAtMs) });
  }
}
const report = { status: 'passed', originalSseCompletions: summary.calls.length, distinctProviderResponses: responseIds.size, allHttp200: true,
  archivedRunnerHash: sourceHash, startedAt: summary.startedAt, endedAt: summary.endedAt,
  inputMin: Math.min(...summary.calls.map(row => row.inputTokens)), inputMax: Math.max(...summary.calls.map(row => row.inputTokens)),
  cacheWriteTotal: summary.calls.reduce((sum, row) => sum + row.cacheWrite, 0), strategies,
  ...(summary.dispatch === 'concurrent' ? { branchContractsFromNativeInputs: 'verified', concurrentPairs } : {}) };
await writeFile(join(directory, 'wire-verification.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report));
