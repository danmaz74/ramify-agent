import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { commitRecord } from '../jobs/commit.js';
import { commitEventSchema, logLines, openCommitLog, recordBytes, recordRef, type CommitEvent } from './helpers/commit.js';
import { temporaryDirectory } from './helpers/fixture.js';

let directory: { path: string; remove: () => Promise<void> };

beforeEach(async () => {
  directory = await temporaryDirectory();
});
afterEach(async () => {
  await directory.remove();
});

const started = (note = ''): CommitEvent => commitEventSchema.parse({ type: 'run-started', note });
const accepted = (note = ''): CommitEvent => commitEventSchema.parse({ type: 'iteration-accepted', note });

describe('one transition is one appended line', () => {
  test('the line holds every record body, and each record file is a copy of it', async () => {
    const log = await openCommitLog(directory.path);
    const records = [recordRef('run/run.json', 'run-0001', 1), recordRef('iterations/01/assignment.json', 'it-0001', 1)];

    expect(await commitRecord(log, { event: started('the run begins'), records })).toBe('committed');

    const lines = await logLines(directory.path);
    expect(lines).toHaveLength(1);
    expect(lines[0]!.event).toEqual({ type: 'run-started', note: 'the run begins' });
    expect(lines[0]!.records.map(record => record.path)).toEqual(['run/run.json', 'iterations/01/assignment.json']);
    for (const record of records) {
      expect(await readFile(join(directory.path, record.path), 'utf8')).toBe(recordBytes(record.body));
    }
  });

  test('a transition that commits no record is refused, and nothing is written', async () => {
    const log = await openCommitLog(directory.path);
    await expect(commitRecord(log, { event: started(), records: [] })).rejects.toThrow(TypeError);
    expect(log.version).toBe(0);
  });
});

describe('a transition already in the log is not appended again', () => {
  test('a repeat in the same process appends nothing', async () => {
    const log = await openCommitLog(directory.path);
    const commit = { event: started(), records: [recordRef('run/run.json', 'run-0001', 1)] };

    expect(await commitRecord(log, commit)).toBe('committed');
    expect(await commitRecord(log, commit)).toBe('already-committed');
    expect(await commitRecord(log, commit)).toBe('already-committed');

    expect(await logLines(directory.path)).toHaveLength(1);
    expect(log.version).toBe(1);
  });

  test('a repeat after a restart appends nothing, whichever ledger makes it', async () => {
    const first = await openCommitLog(directory.path);
    const commit = { event: accepted(), records: [recordRef('iterations/01/result.json', 'it-0001', 1)] };
    await commitRecord(first, commit);

    const second = await openCommitLog(directory.path);
    expect(await commitRecord(second, commit)).toBe('already-committed');
    expect(await logLines(directory.path)).toHaveLength(1);
  });

  test('a repeat rewrites a record file that differs from its body in the log', async () => {
    const log = await openCommitLog(directory.path);
    const record = recordRef('run/run.json', 'run-0001', 1, { policy: 'scope-size/2' });
    await commitRecord(log, { event: started(), records: [record] });

    const { writeFile } = await import('node:fs/promises');
    await writeFile(join(directory.path, 'run/run.json'), '{"schema":"ramify-agent.test-record/1","id":"tampered"}\n');

    expect(await commitRecord(log, { event: started(), records: [record] })).toBe('already-committed');
    expect(await readFile(join(directory.path, 'run/run.json'), 'utf8')).toBe(recordBytes(record.body));
    expect(await logLines(directory.path)).toHaveLength(1);
  });

  test('a new revision of the same record is a different transition', async () => {
    const log = await openCommitLog(directory.path);
    await commitRecord(log, { event: accepted(), records: [recordRef('iterations/01/outline.json', 'it-0001', 1)] });
    expect(await commitRecord(log, { event: accepted(), records: [recordRef('iterations/01/outline.2.json', 'it-0001', 2)] })).toBe('committed');
    expect(await logLines(directory.path)).toHaveLength(2);
  });

  test('the same records under a different event type are a different transition', async () => {
    const log = await openCommitLog(directory.path);
    const records = [recordRef('run/run.json', 'run-0001', 1)];
    await commitRecord(log, { event: started(), records });
    expect(await commitRecord(log, { event: accepted(), records })).toBe('committed');
    expect(await logLines(directory.path)).toHaveLength(2);
  });
});
