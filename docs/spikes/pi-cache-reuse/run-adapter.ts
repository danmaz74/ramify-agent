import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zstdDecompressSync } from 'node:zlib';
import { getAgentDir, ModelRuntime } from '@earendil-works/pi-coding-agent';
import { createPiAgentOn } from '../../../subs/harness/subs/agent/subs/pi/src/pi-agent.js';
import { decodePreservedTranscript } from '../../../subs/harness/subs/agent/subs/pi/src/preservation.js';
import { openSessionStore } from '../../../subs/harness/subs/session-store/src/session-store.js';
import type { SessionExecutionBindings, SessionExecutionPolicy, SessionOperationReceipt } from '../../../subs/harness/subs/agent/src/interfaces/session-operations.js';

// Explicit live witness outside automatic discovery: real production adapter,
// durable store, installed provider, subscription authentication and HTTP SSE.
const hash = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex');
const output = resolve(process.argv[3] ?? '');
const save = (name: string, value: unknown) => writeFile(join(output, name), JSON.stringify(value, null, 2) + '\n');
async function verify() {
  const summary = JSON.parse(await readFile(join(output, 'summary.json'), 'utf8'));
  assert.equal(summary.calls.length, 6);
  const ids = new Set();
  for (const row of summary.calls) {
    const request = JSON.parse(await readFile(join(output, `${row.label}.request.json`), 'utf8'));
    const normalized = JSON.parse(await readFile(join(output, `${row.label}.response.json`), 'utf8'));
    const original = JSON.parse(await readFile(join(output, `${row.label}.original.json`), 'utf8'));
    const events = (await readFile(join(output, `${row.label}.sse`), 'utf8')).split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trim()).filter(value => value !== '[DONE]').map(value => JSON.parse(value));
    assert.deepEqual(events.find(event => event.type === 'response.completed' || event.type === 'response.done').response, original);
    assert.equal(request.prompt_cache_key, row.providerSessionId);
    assert.deepEqual(row.headers, { sessionId: row.providerSessionId, clientRequestId: row.providerSessionId });
    assert.equal(original.usage.input_tokens_details.cached_tokens, normalized.usage.cacheRead);
    assert.equal(original.usage.input_tokens, normalized.usage.input + normalized.usage.cacheRead + normalized.usage.cacheWrite);
    assert.deepEqual(normalized.content.find(block => block.type === 'toolCall').arguments, row.expected);
    assert.ok(!ids.has(original.id)); ids.add(original.id);
    assert.equal(row.statusCode, 200);
    if (row.parentLabel) {
      assert.notEqual(row.logicalSessionId, row.providerSessionId);
      const parent = JSON.parse(await readFile(join(output, `${row.parentLabel}.state.json`), 'utf8'));
      assert.equal(request.instructions, parent.native.instructions);
      assert.deepEqual(request.tools, parent.native.tools);
      assert.deepEqual(request.input.slice(0, parent.native.input.length), parent.native.input);
    }
  }
  for (const repeat of [1, 2]) {
    const pair = summary.calls.filter(row => row.label === `r${repeat}.A` || row.label === `r${repeat}.B`);
    assert.equal(pair.length, 2);
    assert.ok(Math.min(...pair.map(row => row.completedAt)) > Math.max(...pair.map(row => row.startedAt)), 'Sibling dispatches did not overlap');
  }
  for (const [file, expected] of Object.entries(summary.sourceHashes)) assert.equal(hash(await readFile(join(output, 'source', file))), expected);
  await save('verification.json', { status: 'passed', calls: summary.calls.length, distinctResponseIds: ids.size, forkFirstTurnHits: summary.calls.filter(row => row.parentLabel && row.cacheRead > 0).length });
}

async function run() {
  assert.equal(process.argv[2], '--output', 'Use --output NEW-DIRECTORY or --verify DIRECTORY');
  await mkdir(output, { recursive: true }); assert.equal((await readdir(output)).length, 0);
  await mkdir(join(output, 'source'));
  const sourceHashes: Record<string, string> = {};
  for (const file of ['preservation.ts', 'session-operations.ts']) {
    const bytes = await readFile(new URL(`../../../subs/harness/subs/agent/subs/pi/src/${file}`, import.meta.url));
    sourceHashes[file] = hash(bytes); await writeFile(join(output, 'source', file), bytes);
  }
  const runner = await readFile(fileURLToPath(import.meta.url)); sourceHashes['run-adapter.ts'] = hash(runner); await writeFile(join(output, 'source', 'run-adapter.ts'), runner);
  const agentDirectory = getAgentDir();
  const runtime = await ModelRuntime.create({ authPath: join(agentDirectory, 'auth.json'), modelsPath: join(agentDirectory, 'models.json') });
  assert.ok(runtime.isUsingOAuth('openai-codex') || runtime.isUsingSubscription('openai-codex'));
  const store = await openSessionStore({ directory: join(output, 'store') });
  const operations = () => createPiAgentOn({ runtime: async () => runtime, agentDirectory, model: 'openai-codex/gpt-5.6-sol:medium', sessionStore: store }).sessionOperations!;
  const summary = { schema: 'ramify-agent.pi-adapter-cache-witness/1', sourceHashes, calls: [] as any[] };
  const expected = new Map<string, any>(); const finishes: Promise<void>[] = []; const gates = new Map<string, { arrivals: number; wait: Promise<void>; release: () => void }>();
  const nativeFetch = globalThis.fetch; const nativeStream = runtime.streamSimple.bind(runtime);
  runtime.streamSimple = (model, context, options) => {
    const current = context.messages.filter(message => message.role === 'user').at(-1)!;
    const label = /\[LABEL ([^\]]+)\]/.exec(JSON.stringify(current.content))![1]!;
    const row: any = { label, ...expected.get(label) }; summary.calls.push(row);
    const events = nativeStream(model, context, { ...options, fetch: async (url, init) => {
      const headers = new Headers(init?.headers); row.headers = { sessionId: headers.get('session-id'), clientRequestId: headers.get('x-client-request-id') };
      const body = typeof init?.body === 'string' ? init.body : zstdDecompressSync(init?.body as Uint8Array).toString('utf8'); await writeFile(join(output, `${label}.request.json`), body);
      if (row.parentLabel) { const gate = gates.get(row.parentLabel)!; assert.ok(++gate.arrivals <= 2); if (gate.arrivals === 2) gate.release(); await gate.wait; }
      row.startedAt = Date.now(); const response = await nativeFetch(url, init); row.statusCode = response.status;
      const captured = response.clone().text().then(async sse => {
        await writeFile(join(output, `${label}.sse`), sse);
        for (const line of sse.split('\n')) if (line.startsWith('data:')) {
          const value = line.slice(5).trim(); if (value === '[DONE]') continue;
          const event = JSON.parse(value); if (['response.completed', 'response.done'].includes(event.type) && event.response?.usage) await save(`${label}.original.json`, event.response);
        }
      }); finishes.push(captured); void captured.catch(() => {}); return response;
    } });
    const finished = events.result().then(async response => { row.completedAt = Date.now(); row.cacheRead = response.usage.cacheRead; row.inputTokens = response.usage.input + response.usage.cacheRead + response.usage.cacheWrite; await save(`${label}.response.json`, response); }); finishes.push(finished); void finished.catch(() => {}); return events;
  };
  const policy: SessionExecutionPolicy = { context: { compaction: 'forbidden', budgetTokens: null, budgetFraction: null, reportReserveTokens: 0 }, authority: {}, validator: {}, destination: {} };
  const declaration = { name: 'submit_cache', description: 'Submit the requested label, private marker and Record 0007 revision.', inputSchema: { type: 'object', properties: { label: { type: 'string' }, marker: { type: 'string' }, revision: { type: 'string' } }, required: ['label', 'marker', 'revision'], additionalProperties: false }, mutating: false };
  try {
    for (const repeat of [1, 2]) {
      const runId = randomUUID(); const namespace = randomUUID(); const revision = hash(`${namespace}:7`).slice(0, 16);
      const initialInstructions = `Cache witness ${namespace}. Each new user task is independent. Call submit_cache exactly once FOR EACH CURRENT TASK, even when inherited history contains previous accepted submissions. Look up the revision in these immutable records.\n` + Array.from({ length: 256 }, (_, i) => `Record ${String(i).padStart(4, '0')}: component comp_${i}; revision ${hash(`${namespace}:${i}`).slice(0, 16)}; timeout ${100 + i} ms; dependency comp_${(i + 7) % 256}; invariant explicit owner, immutable contract, deterministic recovery.`).join('\n');
      const op = operations(); const parent = await op.create({ runId, operationId: 'create', initialInstructions, declarations: [declaration], activate: [declaration.name], policy }); assert.equal(parent.status, 'completed');
      async function execute(session: SessionOperationReceipt, label: string, parentLabel: string | null) {
        const marker = randomUUID(); const wanted = { label, marker, revision }; expected.set(label, { logicalSessionId: session.sessionId, providerSessionId: parent.sessionId, parentLabel, expected: wanted });
        const task = { role: 'cache-witness', message: `[LABEL ${label}] Submit label ${label}, private marker ${marker}, and the revision for Record 0007 from the inherited reference.`, submissionTool: declaration.name, environment: { workingDirectory: output, candidate: null, snapshot: null, limits: {} }, policyIdentity: 'witness/1', validatorIdentity: label, destinationIdentity: label };
        const bindings: SessionExecutionBindings = { task, policy, tools: [], currentAuthority: async () => true, onEvent: () => {}, publish: async () => {}, submission: { name: declaration.name, accept: async input => { assert.deepEqual(input, wanted); return { accepted: true }; } } };
        const handle = await operations().continue({ runId, operationId: label, sessionId: session.sessionId, expectedPoint: session.point!, task, policy, additions: [], toolChange: { add: [], activate: [], inactivate: [] }, bindings });
        const timer = setTimeout(() => { void handle.stop(); }, 120_000);
        try { const receipt = await handle.receipt; assert.equal(receipt.status, 'completed', receipt.reason ?? 'Incomplete operation'); assert.deepEqual(receipt.outcome, { kind: 'submitted', input: wanted }); await handle.settled(); return receipt; } finally { clearTimeout(timer); }
      }
      const parentLabel = `r${repeat}.P`; const settled = await execute(parent, parentLabel, null);
      const snapshot = (await op.inspect(runId, parent.sessionId))!;
      const entry = snapshot.transcript.filter(item => item.key.includes(':pi-state:')).at(-1)!; await save(`${parentLabel}.state.json`, decodePreservedTranscript((await store.getPayload(entry.payloadId))!));
      const A = await op.fork({ runId, operationId: 'fork-A', sourcePoint: settled.point! }); const B = await op.fork({ runId, operationId: 'fork-B', sourcePoint: settled.point! }); assert.equal(new Set([parent.sessionId, A.sessionId, B.sessionId]).size, 3);
      let release!: () => void; const wait = new Promise<void>(resolve => { release = resolve; }); gates.set(parentLabel, { arrivals: 0, wait, release });
      const children = await Promise.allSettled([execute(A, `r${repeat}.A`, parentLabel), execute(B, `r${repeat}.B`, parentLabel)]);
      for (const child of children) if (child.status === 'rejected') throw child.reason;
      assert.deepEqual(await op.inspect(runId, parent.sessionId), snapshot);
    }
    await Promise.all(finishes); await save('summary.json', summary); await verify();
    console.log(JSON.stringify({ status: 'passed', calls: summary.calls.length, forkFirstTurnHits: summary.calls.filter(row => row.parentLabel && row.cacheRead > 0).length, callsUsage: summary.calls.map(({ label, cacheRead, inputTokens }) => ({ label, cacheRead, inputTokens })) }, null, 2));
  } finally { await Promise.allSettled(finishes); await save('summary.json', summary); await store.close(); }
}
if (process.argv[2] === '--verify') { await verify(); console.log('Offline wire verification passed'); }
else await run().catch(error => { console.error(String(error).replace(/Bearer\s+\S+/gi, 'Bearer [redacted]').replace(/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, '[redacted JWT]')); process.exitCode = 1; });
