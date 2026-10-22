import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { createScriptedAgent } from '../../subs/agent/src/scripted.js';
import { commitRecord, recoverCommits } from '../jobs/commit.js';
import { commitEventSchema, logLines, openCommitLog, recordRef } from './helpers/commit.js';
import { temporaryDirectory } from './helpers/fixture.js';

/*
 * Rules 3 and 4 after a crash. The ledger's own tests own torn lines and
 * materialization; this file keeps what the commit wrapper adds: a repeated
 * transition after recovery is recognized as already committed. Recovery is
 * given no agent, and the scripted agent below is in scope only to assert
 * that none is started.
 */

let directory: { path: string; remove: () => Promise<void> };

beforeEach(async () => {
  directory = await temporaryDirectory();
});
afterEach(async () => {
  await directory.remove();
});

const started = (note = '') => commitEventSchema.parse({ type: 'run-started', note });
const planned = (note = '') => commitEventSchema.parse({ type: 'plan-accepted', note });
const accepted = (note = '') => commitEventSchema.parse({ type: 'iteration-accepted', note });

/** The three record kinds one transition each commits, as a run's layout holds them. */
const runRecord = recordRef('run/run.json', 'run-0001', 1, { policy: 'scope-size/2' });
const planRecord = recordRef('analysis/01/analysis.json', 'an-0001', 1, { entries: 2 });
const iterationRecord = recordRef('iterations/01/assignment.json', 'it-0001', 1, { scope: 'harness' });

/** Commits the three transitions and abandons the ledger, as a crash does. */
async function threeKinds(): Promise<void> {
  const log = await openCommitLog(directory.path);
  await commitRecord(log, { event: started(), records: [runRecord] });
  await commitRecord(log, { event: planned(), records: [planRecord] });
  await commitRecord(log, { event: accepted(), records: [iterationRecord] });
}

describe('a crash after the line', () => {
  test('every transition repeated after recovery is already committed, so recovery makes no duplicate', async () => {
    await threeKinds();
    await rm(join(directory.path, runRecord.path));

    const agent = createScriptedAgent([]);
    const log = await openCommitLog(directory.path);
    await recoverCommits(log);

    expect(await commitRecord(log, { event: started(), records: [runRecord] })).toBe('already-committed');
    expect(await commitRecord(log, { event: planned(), records: [planRecord] })).toBe('already-committed');
    expect(await commitRecord(log, { event: accepted(), records: [iterationRecord] })).toBe('already-committed');

    const lines = await logLines(directory.path);
    expect(lines.map(line => line.event.type)).toEqual(['run-started', 'plan-accepted', 'iteration-accepted']);
    expect(agent.sessions).toEqual([]);
  });
});
