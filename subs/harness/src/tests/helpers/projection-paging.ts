import assert from 'node:assert/strict';
import { recordedProjectionConsumers } from './projection-consumers.js';
import { runId } from './constructed.js';
import { protocolPaths as paths } from '../../interfaces/protocol/paths.js';
import { executionMapPageSchema } from '../../interfaces/protocol/execution-map.js';
import { sessionQueryLimits } from '../../interfaces/protocol/sessions.js';
import { errorResponseSchema } from '../../interfaces/protocol/errors.js';

const plan = 'review-notes';
const ref = { source: 'run' as const, planId: plan, runId, session: 'ses-0001' };

export async function recordedProjectionPaging() {
  const fixture = await recordedProjectionConsumers(true);
  const { queries, sessions, get, version, priorVersion, pagingEntries } = fixture;
  async function boundaries() {
    // Oracle: one registry, 105 work items, two sessions, in recorded source order.
    const expectedKeys = ['session:ses-0001', 'capability:paging',
      ...Array.from({ length: 105 }, (_, n) => `work-item:wi-${String(n).padStart(3, '0')}`), 'session:ses-0002'];
    const keys: string[] = [];
    let cursor: string | undefined;
    do {
      const direct = executionMapPageSchema.parse(await queries.executionMapPage(plan, runId, { version, limit: 17, ...(cursor ? { cursor } : {}) }));
      assert.deepEqual(await get(paths.runExecutionMap(plan, runId, version, cursor, 17)), direct);
      assert.equal(direct.nodes.length, Math.min(17, expectedKeys.length - keys.length));
      keys.push(...direct.nodes.map(node => node.key));
      assert.equal(direct.runVersion, version);
      if (direct.nextCursor !== null) assert.notEqual(direct.nextCursor, cursor);
      cursor = direct.nextCursor ?? undefined;
    } while (cursor !== undefined);
    assert.deepEqual(keys, expectedKeys);
    assert.equal(new Set(keys).size, expectedKeys.length);

    // Independent boundary identities: 200 small entries, then two small + two
    // 240KB UTF-8 entries, then two 240KB entries, then one oversized 600KB
    // entry (the baseline guarantees at least one). Byte accounting includes LF.
    const expectedSizes = [200, 4, 2, 1];
    const seen: number[] = [];
    let after = 0;
    for (const size of expectedSizes) {
      const direct = await sessions.transcript(ref, after);
      assert.deepEqual(await get(paths.runSessionTranscript(plan, runId, ref.session, after)), direct);
      assert.deepEqual(direct.page.entries, pagingEntries.slice(seen.length, seen.length + size));
      assert.equal(direct.page.entries.length, size);
      const bytes = direct.page.entries.reduce((total, entry) => total + Buffer.byteLength(JSON.stringify(entry) + '\n'), 0);
      if (seen.length === 206) { assert.ok(bytes > sessionQueryLimits.pageBytes); assert.equal(size, 1); }
      else assert.ok(bytes <= sessionQueryLimits.pageBytes);
      assert.ok(direct.page.entries.length <= sessionQueryLimits.entries);
      seen.push(...direct.page.entries.map(entry => entry.n));
      assert.equal(direct.page.cursor, seen.length);
      assert.equal(direct.page.more, seen.length < pagingEntries.length);
      after = direct.page.cursor;
    }
    assert.deepEqual(seen, Array.from({ length: 207 }, (_, n) => n + 1));
    const empty = await sessions.transcript(ref, after);
    assert.deepEqual(empty.page.entries, []); assert.equal(empty.page.cursor, 207); assert.equal(empty.page.more, false);
    assert.deepEqual(await get(paths.runSessionTranscript(plan, runId, ref.session, after)), empty);

    const cursors = [{ session: 'ses-0001', after: 200 }, { session: 'ses-0002', after: 0 }];
    const poll = await sessions.updates(plan, runId, priorVersion, cursors);
    assert.equal(priorVersion, 10); assert.equal(poll.version, 14);
    assert.deepEqual(poll.sessions.map(row => [row.session, row.state, row.finished]), [['ses-0002', 'finished', 'work-closed']]);
    assert.deepEqual(poll.transcripts.map(row => row.session), ['ses-0001', 'ses-0002']);
    assert.deepEqual(poll.transcripts[0]!.page.entries, pagingEntries.slice(200, 204));
    assert.equal(poll.transcripts[0]!.page.cursor, 204); assert.equal(poll.transcripts[0]!.page.more, true);
    assert.deepEqual(poll.transcripts[1]!.page.entries.map(entry => entry.n), [1]);
    const pollBytes = poll.transcripts.flatMap(row => row.page.entries).reduce((total, entry) => total + Buffer.byteLength(JSON.stringify(entry) + '\n'), 0);
    assert.ok(pollBytes <= sessionQueryLimits.pageBytes);
    assert.deepEqual(await get(paths.runSessionUpdates(plan, runId, priorVersion, cursors)), poll);
    const next = await sessions.updates(plan, runId, version, [{ session: 'ses-0001', after: 204 }, { session: 'ses-0002', after: 1 }]);
    assert.deepEqual(next.sessions, []);
    assert.deepEqual(next.transcripts[0]!.page.entries, pagingEntries.slice(204, 206));
    assert.deepEqual(next.transcripts[1]!.page.entries, []);
    assert.deepEqual(await get(paths.runSessionUpdates(plan, runId, version, [{ session: 'ses-0001', after: 204 }, { session: 'ses-0002', after: 1 }])), next);
    const exhaustedCursors = [{ session: 'ses-0001', after: 206 }, { session: 'ses-0002', after: 0 }];
    const exhausted = await sessions.updates(plan, runId, version, exhaustedCursors);
    assert.deepEqual(exhausted.transcripts[0]!.page.entries, pagingEntries.slice(206));
    assert.deepEqual(exhausted.transcripts[1]!.page.entries, []);
    assert.equal(exhausted.transcripts[1]!.page.cursor, 0); assert.equal(exhausted.transcripts[1]!.page.more, true);
    assert.deepEqual(await get(paths.runSessionUpdates(plan, runId, version, exhaustedCursors)), exhausted);
    const reversedCursors = [...exhaustedCursors].reverse();
    const reversed = await sessions.updates(plan, runId, version, reversedCursors);
    assert.deepEqual(reversed.transcripts.map(row => row.session), ['ses-0002', 'ses-0001']);
    assert.deepEqual(reversed.transcripts[0]!.page.entries.map(entry => entry.n), [1]);
    assert.deepEqual(reversed.transcripts[1]!.page.entries, pagingEntries.slice(206));
    assert.deepEqual(await get(paths.runSessionUpdates(plan, runId, version, reversedCursors)), reversed);
  }
  async function refusals() {
    await assert.rejects(queries.executionMapPage(plan, runId, { version: version - 1, limit: 17 }), { code: 'stale-version', currentVersion: version });
    const stale = errorResponseSchema.parse(await get(paths.runExecutionMap(plan, runId, version - 1, undefined, 17), 409));
    assert.equal(stale.error.code, 'stale-version'); assert.equal(stale.error.currentVersion, version);
    // Cursor syntax admission belongs to HTTP; negative values are not a
    // supported public-child input contract and are not passed to it.
    for (const [path, message] of [
      [paths.runSessionTranscript(plan, runId, ref.session, -1), '"after" must be a count'],
      [paths.runSessionUpdates(plan, runId, version, [{ session: ref.session, after: -1 }]), '"ses-0001:-1" is not a cursor: <session>:<after>'],
      [paths.runSessionUpdates(plan, runId, version, [{ session: ref.session, after: 0 }, { session: ref.session, after: 1 }]), 'Session ses-0001 is followed twice'],
    ]) {
      const error = errorResponseSchema.parse(await get(path!, 400)).error;
      assert.equal(error.code, 'invalid-request'); assert.equal(error.message, message);
    }
    const future = version + 1;
    const message = `Version ${future} is after run ${runId}'s last event, ${version}`;
    await assert.rejects(sessions.updates(plan, runId, future, []), { code: 'invalid-request', message });
    const error = errorResponseSchema.parse(await get(paths.runSessionUpdates(plan, runId, future, []), 400)).error;
    assert.equal(error.code, 'invalid-request'); assert.equal(error.message, message);
  }
  async function cache() {
    const original = await sessions.runSession(plan, runId, ref.session);
    assert.equal(original.session.state, 'finished'); assert.equal(original.session.finished, 'work-closed');
    const originalTranscript = await sessions.transcript(ref, 200);
    for (let round = 0; round < 3; round++) {
      assert.deepEqual(await sessions.runSession(plan, runId, ref.session), original);
      assert.deepEqual(await get(paths.runSession(plan, runId, ref.session)), original);
      assert.deepEqual(await sessions.transcript(ref, 200), originalTranscript);
      assert.deepEqual(await get(paths.runSessionTranscript(plan, runId, ref.session, 200)), originalTranscript);
    }
    await fixture.unchanged(); fixture.noEffects();
  }
  return { boundaries, refusals, cache, close: fixture.close };
}
