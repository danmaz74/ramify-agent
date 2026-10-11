import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile, appendFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { ModelRuntime, getAgentDir } from '@earendil-works/pi-coding-agent';

// Standalone, explicitly invoked live spike in the project's owned-unwired docs.
// No harness state, repository tools, SDK agent loop or background cache warmer.
const clone = value => JSON.parse(JSON.stringify(value));
const hash = value => createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
const native = body => ({ model: body.model, instructions: body.instructions, tools: body.tools ?? [], input: body.input, reasoning: body.reasoning, text: body.text, tool_choice: body.tool_choice, parallel_tool_calls: body.parallel_tool_calls });
const textOf = message => message.content.filter(block => block.type === 'text').map(block => block.text).join('');
const safeError = error => String(error).replace(/Bearer\s+\S+/gi, 'Bearer [redacted]').replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[redacted JWT]');
const args = process.argv.slice(2);
const option = (name, fallback) => { const i = args.indexOf(name); return i < 0 ? fallback : args[i + 1]; };

function fixture(namespace, records) {
  return `Cache experiment ${namespace}. This is synthetic reference data. Preserve it as context; no tools are needed.\n` +
    Array.from({ length: records }, (_, i) => {
      const id = String(i).padStart(4, '0');
      return `Record ${id}: component comp_${id}; owner group_${i % 17}; revision ${hash(`${namespace}:${i}`).slice(0, 16)}; timeout ${100 + i} ms; dependency comp_${String((i + 7) % records).padStart(4, '0')}; invariant explicit owner, immutable contract, deterministic recovery.`;
    }).join('\n') + '\nAcknowledge this reference with exactly READY.';
}

function makeFork(parent, name) {
  return { name, sessionId: randomUUID(), messages: clone(parent.messages), inheritedItems: parent.request.input.length, inherited: clone(native(parent.request)) };
}

function assertPrefix(body, inherited) {
  for (const field of ['model', 'instructions', 'tools', 'reasoning', 'text', 'tool_choice', 'parallel_tool_calls']) assert.deepEqual(native(body)[field], inherited[field], `Inherited ${field} changed`);
  assert.deepEqual(body.input.slice(0, inherited.input.length), inherited.input, 'Inherited ordered native input changed');
}

function pairGate() {
  let arrivals = 0; let release;
  const ready = new Promise(resolveReady => { release = resolveReady; });
  return async signal => {
    if (++arrivals === 2) release();
    assert.ok(arrivals <= 2, 'Unexpected extra HTTP dispatch in concurrent pair');
    if (signal.aborted) throw signal.reason;
    await new Promise((resolveWait, rejectWait) => {
      const aborted = () => { signal.removeEventListener('abort', aborted); rejectWait(signal.reason); };
      signal.addEventListener('abort', aborted, { once: true });
      ready.then(() => { signal.removeEventListener('abort', aborted); resolveWait(); });
    });
  };
}

async function verify(directory) {
  const summary = JSON.parse(await readFile(join(directory, 'summary.json'), 'utf8'));
  const rows = (await readFile(join(directory, 'calls.jsonl'), 'utf8')).trim().split('\n').filter(Boolean).map(line => JSON.parse(line));
  assert.equal(rows.length, summary.calls.length);
  assert.equal(rows.length, summary.repeats * summary.modes.length * (4 + 2 * summary.rounds));
  assert.deepEqual([...rows].sort((a, b) => a.id.localeCompare(b.id)), [...summary.calls].sort((a, b) => a.id.localeCompare(b.id)));
  const byId = new Map(rows.map(row => [row.id, row]));
  for (const row of rows) {
    assert.equal(row.status, 'completed', `${row.id} failed`);
    const body = JSON.parse(await readFile(join(directory, row.requestFile), 'utf8'));
    const response = JSON.parse(await readFile(join(directory, row.responseFile), 'utf8'));
    assert.equal(hash(body), row.requestHash);
    assert.equal(body.prompt_cache_key, row.cacheKey);
    assert.equal(response.usage.input + response.usage.cacheRead + response.usage.cacheWrite, row.inputTokens);
    assert.equal(row.rawUsage.input_tokens, row.inputTokens);
    assert.equal(row.rawUsage.input_tokens_details?.cached_tokens ?? 0, row.cacheRead);
    assert.equal(row.rawUsage.input_tokens_details?.cache_write_tokens ?? 0, row.cacheWrite);
    assert.ok(row.inputTokens >= 1024, 'Fixture below documented caching minimum');
    const original = JSON.parse(await readFile(join(directory, row.originalResponseFile), 'utf8'));
    assert.deepEqual(original.usage, row.rawUsage);
    if (row.expectedReply) assert.equal(textOf(response).trim(), row.expectedReply, 'Branch response control not satisfied');
    else assert.ok(textOf(response).trim().startsWith('READY'), 'Response control not satisfied');
    if (row.identicalTo) {
      const other = JSON.parse(await readFile(join(directory, byId.get(row.identicalTo).requestFile), 'utf8'));
      assert.deepEqual(native(body), native(other), 'Replay changed rendered request fields');
      const { prompt_cache_key: keyA, ...withoutKeyA } = body;
      const { prompt_cache_key: keyB, ...withoutKeyB } = other;
      assert.deepEqual(withoutKeyA, withoutKeyB, 'Key-only replay changed another body field');
      assert.equal(row.kind === 'same-key-replay', keyA === keyB);
    }
    if (row.forkOf) {
      const parent = JSON.parse(await readFile(join(directory, byId.get(row.forkOf).requestFile), 'utf8'));
      assertPrefix(body, native(parent));
      assert.equal(row.mode !== 'session-key', row.cacheKey === parent.prompt_cache_key);
      assert.notEqual(row.sessionId, byId.get(row.forkOf).sessionId);
      assert.equal(row.headers.sessionId, row.providerSessionId);
      assert.equal(row.headers.clientRequestId, row.providerSessionId);
      assert.equal(row.mode === 'shared-routing', row.providerSessionId === byId.get(row.forkOf).providerSessionId);
      const serialized = JSON.stringify(body.input);
      const otherBranch = row.branch === 'A' ? 'B' : 'A';
      assert.ok(!serialized.includes(`BRANCH_${otherBranch}_`), 'Sibling history leaked');
      for (let round = 1; round <= row.round; round++) assert.ok(serialized.includes(`BRANCH_${row.branch}_TURN_${round}`), 'Own branch history lost');
      if (row.round === 1 && row.branch === 'B') {
        const sibling = rows.find(other => other.repeat === row.repeat && other.mode === row.mode && other.branch === 'A' && other.round === 1);
        const siblingRequest = JSON.parse(await readFile(join(directory, sibling.requestFile), 'utf8'));
        assert.deepEqual(body.input.slice(0, -1), siblingRequest.input.slice(0, -1), 'Forks differ before their first task, including parent final output');
      }
      if (row.round > 1) {
        const previous = rows.find(other => other.repeat === row.repeat && other.mode === row.mode && other.branch === row.branch && other.round === row.round - 1);
        assertPrefix(body, native(JSON.parse(await readFile(join(directory, previous.requestFile), 'utf8'))));
      }
    }
    assert.equal(body.store, false);
    assert.equal(body.stream, true);
    assert.equal(body.prompt_cache_options, undefined, 'Unexpected cache policy override');
  }
  const overlapPairs = [];
  if (summary.dispatch === 'concurrent') {
    const groups = new Set(rows.filter(row => row.dispatchGroup).map(row => row.dispatchGroup));
    assert.equal(groups.size, summary.repeats * summary.modes.length * summary.rounds);
    for (const group of groups) {
      const pair = rows.filter(row => row.dispatchGroup === group);
      assert.equal(pair.length, 2); assert.deepEqual(pair.map(row => row.branch).sort(), ['A', 'B']);
      const overlapMs = Math.min(...pair.map(row => row.streamCompletedAtMs)) - Math.max(...pair.map(row => row.fetchStartedAtMs));
      assert.ok(overlapMs > 0, `${group}: HTTP requests did not overlap`);
      overlapPairs.push({ group, overlapMs, dispatchGapMs: Math.abs(pair[0].fetchStartedAtMs - pair[1].fetchStartedAtMs) });
    }
  }
  const report = { status: 'passed', calls: rows.length, liveCacheHits: rows.filter(row => row.cacheRead > 0).length, requestHashesAndRawUsage: 'verified', replayBodies: 'verified', forkPrefixesAndIsolation: 'verified', ...(summary.dispatch === 'concurrent' ? { branchSpecificReplies: 'verified', concurrentPairs: overlapPairs } : {}) };
  await writeFile(join(directory, 'verification.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
  return report;
}

async function main() {
  if (args.includes('--verify')) { await verify(resolve(option('--verify'))); return; }
  if (!args.includes('--output')) throw new Error('Use --output <new evidence directory> [--repeats 2] [--rounds 3] [--records 256] [--modes session-key,shared-key,shared-routing], or --verify <evidence directory>');
  const output = resolve(option('--output'));
  const repeats = Number(option('--repeats', '2'));
  const rounds = Number(option('--rounds', '3'));
  const records = Number(option('--records', '256'));
  const modes = option('--modes', 'session-key,shared-key,shared-routing').split(',');
  const dispatch = option('--dispatch', 'serial');
  assert.ok(['serial', 'concurrent'].includes(dispatch), 'Invalid dispatch mode');
  assert.ok(modes.length > 0 && new Set(modes).size === modes.length && modes.every(mode => ['session-key', 'shared-key', 'shared-routing'].includes(mode)), 'Invalid strategies');
  for (const n of [repeats, rounds, records]) assert.ok(Number.isSafeInteger(n) && n > 0);
  assert.ok(repeats <= 4 && rounds <= 5 && records <= 1024, 'Bounded experiment limits exceeded');
  await mkdir(output, { recursive: true });
  assert.equal((await readdir(output)).length, 0, 'Evidence directory must be empty');
  await mkdir(join(output, 'requests')); await mkdir(join(output, 'responses'));
  const source = await readFile(new URL(import.meta.url), 'utf8');
  await writeFile(join(output, 'runner.mjs'), source);
  const packageUrl = import.meta.resolve('@earendil-works/pi-coding-agent');
  const packageVersion = JSON.parse(await readFile(new URL('../package.json', packageUrl), 'utf8')).version;
  assert.equal(packageVersion, '0.87.1', 'This spike qualifies only pinned pi 0.87.1');
  const agentDir = getAgentDir();
  const runtime = await ModelRuntime.create({ authPath: join(agentDir, 'auth.json'), modelsPath: join(agentDir, 'models.json') });
  const model = runtime.getModel('openai-codex', 'gpt-5.6-sol');
  assert.ok(model && (await runtime.getAvailable('openai-codex')).some(item => item.id === model.id), 'Pinned model unavailable');
  assert.ok(runtime.isUsingOAuth('openai-codex') || runtime.isUsingSubscription('openai-codex'), 'Subscription/OAuth authentication required');
  const runId = randomUUID();
  const summary = { schema: 'ramify-agent.pi-cache-spike/1', runId, startedAt: new Date().toISOString(), runnerSha256: hash(source), packageVersion, model: `${model.provider}/${model.id}`, authentication: 'pi-owned subscription/OAuth', transport: 'sse', providerRetries: 0, reasoning: 'medium', repeats, rounds, records, modes, dispatch, calls: [] };
  await writeFile(join(output, 'manifest.json'), JSON.stringify({ ...summary, calls: undefined }, null, 2) + '\n');
  const nativeFetch = globalThis.fetch;

  async function call(session, { id, mode, kind, repeat, branch = null, round = null, cacheKey = session.sessionId, providerSessionId = session.sessionId, identicalTo = null, forkOf = null, expectedReply = 'READY', dispatchGroup = null, gate = null }) {
    const startedAt = new Date().toISOString(); const started = performance.now();
    let request; let original; let rawRead = Promise.resolve(); let statusCode; let headers;
    const requestFile = `requests/${id}.json`; const responseFile = `responses/${id}.json`; const originalResponseFile = `responses/${id}.original.json`;
    let fetchStartedAtMs; let responseStartedAtMs; let streamCompletedAtMs;
    const signal = AbortSignal.timeout(120_000);
    const base = { id, mode, kind, repeat, branch, round, sessionId: session.sessionId, providerSessionId, cacheKey, startedAt, requestFile, responseFile, originalResponseFile, identicalTo, forkOf, expectedReply, dispatchGroup };
    console.log(`START ${id}`);
    try {
      const response = await runtime.streamSimple(model, { messages: clone(session.messages) }, {
        sessionId: providerSessionId, transport: 'sse', reasoning: 'medium', maxRetries: 0, maxTokens: 64,
        signal, timeoutMs: 120_000,
        onPayload: async payload => {
          // Change the cache key only; session headers stay unique in shared-key forks.
          request = clone(payload); request.prompt_cache_key = cacheKey;
          if (session.inherited) assertPrefix(request, session.inherited);
          await writeFile(join(output, requestFile), JSON.stringify(request, null, 2) + '\n');
          return request;
        },
        fetch: async (url, init) => {
          const sent = new Headers(init.headers);
          headers = { sessionId: sent.get('session-id'), clientRequestId: sent.get('x-client-request-id') };
          if (gate) await gate(signal);
          fetchStartedAtMs = Date.now();
          const result = await nativeFetch(url, init); statusCode = result.status; responseStartedAtMs = Date.now();
          if (result.ok) rawRead = (async () => {
            const reader = result.clone().body.getReader(); const decoder = new TextDecoder(); let sse = '';
            try { while (true) { const part = await reader.read(); if (part.done) break; sse += decoder.decode(part.value, { stream: true }); } sse += decoder.decode(); }
            finally { await writeFile(join(output, `responses/${id}.sse`), sse); reader.releaseLock(); }
            for (const line of sse.split('\n')) {
              if (!line.startsWith('data:')) continue;
              const value = line.slice(5).trim(); if (value === '[DONE]') continue;
              const event = JSON.parse(value);
              if (['response.completed', 'response.done'].includes(event.type) && event.response?.usage) original = event.response;
            }
            if (original) await writeFile(join(output, originalResponseFile), JSON.stringify(original, null, 2) + '\n');
          })();
          // Attach immediately so an early transport failure cannot create an unhandled rejection.
          void rawRead.catch(() => {});
          return result;
        },
      }).result();
      streamCompletedAtMs = Date.now();
      await writeFile(join(output, responseFile), JSON.stringify(response, null, 2) + '\n');
      await rawRead;
      assert.ok(!['error', 'aborted'].includes(response.stopReason), safeError(response.errorMessage ?? response.stopReason));
      assert.ok(original?.usage, 'Original provider usage missing');
      const inputTokens = response.usage.input + response.usage.cacheRead + response.usage.cacheWrite;
      const row = { ...base, status: 'completed', elapsedMs: Math.round(performance.now() - started), statusCode, headers, fetchStartedAtMs, responseStartedAtMs, streamCompletedAtMs, requestHash: hash(request), inputTokens, uncachedInput: response.usage.input, cacheRead: response.usage.cacheRead, cacheWrite: response.usage.cacheWrite, outputTokens: response.usage.output, cacheReadFraction: response.usage.cacheRead / inputTokens, rawUsage: original.usage, reply: textOf(response), inputItems: request.input.length };
      summary.calls.push(row); await appendFile(join(output, 'calls.jsonl'), JSON.stringify(row) + '\n');
      console.log(`DONE ${id} input=${inputTokens} cacheRead=${row.cacheRead} cacheWrite=${row.cacheWrite} hit=${(row.cacheReadFraction * 100).toFixed(1)}% elapsed=${row.elapsedMs}ms`);
      assert.ok(inputTokens >= 1024, 'Input below documented caching minimum');
      assert.equal(row.reply.trim(), expectedReply, 'Branch response control failed');
      return { response, request, id };
    } catch (error) {
      const failure = { ...base, status: 'failed', statusCode, elapsedMs: Math.round(performance.now() - started), error: safeError(error) };
      await appendFile(join(output, 'failures.jsonl'), JSON.stringify(failure) + '\n');
      throw error;
    }
  }

  try {
    for (let repeat = 1; repeat <= repeats; repeat++) {
      // Counterbalance ordering; each cohort gets a unique early namespace and keys.
      for (const mode of repeat % 2 ? modes : [...modes].reverse()) {
        const cohort = `${repeat}-${mode}`; const rootKey = randomUUID();
        const namespace = `${runId}:${cohort}`;
        const instructions = dispatch === 'concurrent' ? 'You are taking part in a synthetic cache experiment. Do not use tools. Follow the latest user output format exactly, with no explanation or extra punctuation. For readiness requests reply exactly READY. For branch requests retrieve the requested record revision and your own first-turn private marker from the transcript. Keep all earlier reference facts available.' : 'You are taking part in a synthetic cache experiment. Do not use tools. Each reply must be exactly READY. Keep all earlier reference facts available.';
        const parent = { sessionId: rootKey, messages: [{ role: 'system', content: instructions, timestamp: Date.now() }, { role: 'user', content: fixture(namespace, records), timestamp: Date.now() }] };
        await writeFile(join(output, `${cohort}-fixture.json`), JSON.stringify(parent.messages, null, 2) + '\n');
        const seed = await call(parent, { id: `${cohort}-seed`, mode, kind: 'seed', repeat });
        await call(parent, { id: `${cohort}-same-key-replay`, mode, kind: 'same-key-replay', repeat, identicalTo: seed.id });
        // Same request and same session headers; change only prompt_cache_key.
        await call(parent, { id: `${cohort}-different-key-replay`, mode, kind: 'different-key-replay', repeat, cacheKey: randomUUID(), identicalTo: seed.id });
        parent.messages.push(clone(seed.response), { role: 'user', content: 'Parent checkpoint: acknowledge the preserved reference with exactly READY.', timestamp: Date.now() });
        const checkpoint = await call(parent, { id: `${cohort}-parent-continue`, mode, kind: 'parent-continue', repeat });
        parent.messages.push(clone(checkpoint.response)); parent.request = checkpoint.request;
        const frozenParent = hash(parent.messages);
        const forks = [makeFork(parent, 'A'), makeFork(parent, 'B')];
        for (const fork of forks) fork.privateMarker = randomUUID().replaceAll('-', '');
        assert.notEqual(forks[0].sessionId, forks[1].sessionId);
        for (let round = 1; round <= rounds; round++) {
          const dispatchGroup = dispatch === 'concurrent' ? `${cohort}-pair-${round}` : null;
          const gate = dispatch === 'concurrent' ? pairGate() : null;
          const execute = async fork => {
            const label = `ACK_${fork.name}_${round}_${randomUUID().replaceAll('-', '').slice(0, 12)}`;
            const recordId = Math.min(7, records - 1); const revision = hash(`${namespace}:${recordId}`).slice(0, 16);
            const expectedReply = dispatch === 'concurrent' ? `${label} ${fork.privateMarker} ${revision}` : 'READY';
            const task = dispatch === 'concurrent' ? `BRANCH_${fork.name}_TURN_${round}: ${round === 1 ? `Your private first-turn marker is ${fork.privateMarker}. ` : ''}Return exactly three space-separated fields: the literal ${label}, then the private marker given in BRANCH_${fork.name}_TURN_1, then the revision of Record ${String(recordId).padStart(4, '0')} from the original reference. Use only your own branch history. No other text.` : `BRANCH_${fork.name}_TURN_${round}: use the inherited reference and your own branch history. Reply exactly READY.`;
            fork.messages.push({ role: 'user', content: task, timestamp: Date.now() });
            const result = await call(fork, { id: `${cohort}-${fork.name}${round}`, mode, kind: 'fork-turn', repeat, branch: fork.name, round, cacheKey: mode !== 'session-key' ? rootKey : fork.sessionId, providerSessionId: mode === 'shared-routing' ? rootKey : fork.sessionId, forkOf: checkpoint.id, expectedReply, dispatchGroup, gate });
            fork.messages.push(clone(result.response));
            assert.equal(hash(parent.messages), frozenParent, 'Fork mutated parent');
          };
          if (dispatch === 'concurrent') {
            const outcomes = await Promise.allSettled(forks.map(execute));
            const failures = outcomes.filter(outcome => outcome.status === 'rejected');
            if (failures.length) throw new AggregateError(failures.map(outcome => outcome.reason), `Concurrent pair ${dispatchGroup} failed; originals retained`);
          } else for (const fork of forks) await execute(fork);
        }
      }
    }
    summary.status = 'completed';
  } catch (error) { summary.status = 'failed'; summary.error = safeError(error); throw error; }
  finally { summary.endedAt = new Date().toISOString(); await writeFile(join(output, 'summary.json'), JSON.stringify(summary, null, 2) + '\n'); }
  await verify(output);
  const lines = ['# Pi subscription cache experiment', '', `Run: ${runId}. Model: ${summary.model}. Pi: ${packageVersion}. SSE; zero provider retries; reasoning medium; ${dispatch} fork dispatch.`, '', '| Repeat | Key strategy | Request | Total input | Cache read | Cache write | Read share |', '| --- | --- | --- | ---: | ---: | ---: | ---: |'];
  for (const row of summary.calls) lines.push(`| ${row.repeat} | ${row.mode} | ${row.id.split('-').slice(3).join('-')} | ${row.inputTokens} | ${row.cacheRead} | ${row.cacheWrite} | ${(100 * row.cacheReadFraction).toFixed(1)}% |`);
  await writeFile(join(output, 'results.md'), lines.join('\n') + '\n');
}

await main().catch(error => { console.error(safeError(error)); process.exitCode = 1; });
