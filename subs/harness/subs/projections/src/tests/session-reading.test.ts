import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { SessionQueries } from '../session-queries.js';
import { sessionsDirectory, sessionLayout } from '../standalone-records.js';
import { sessionQueryLimits } from '../../../../src/interfaces/protocol/sessions.js';
import { temporaryDirectory } from './helpers/fixture.js';
import { installLegacySessions } from './helpers/legacy-sessions.js';

async function retained(directory: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) for (const [name, value] of Object.entries(await retained(path))) result[`${entry.name}/${name}`] = value;
    else result[entry.name] = `${(await stat(path)).mtimeMs}:${(await readFile(path)).toString('base64')}`;
  }
  return result;
}

test('historical transcript paging, reopening and terminal caching retain ordering, bounds, bytes and refusals', async () => {
  const made = await temporaryDirectory();
  try {
    const ids = await installLegacySessions(made.path);
    const source = { projectRoot: made.path, agentName: undefined, committed: () => undefined, committedRuns: () => [], runVersions: () => [] };
    const queries = new SessionQueries(source);
    const before = await retained(made.path);
    const ref = { source: 'standalone' as const, session: ids.finished };
    const original = await queries.standaloneSession(ids.finished);
    const listing = await queries.list(0);
    expect(listing.total).toBe(2);
    expect((await queries.list(1)).sessions).toEqual(listing.sessions.slice(1));
    let after = 0;
    const seen: number[] = [];
    for (;;) {
      const answer = await queries.transcript(ref, after);
      expect(answer.page.entries.length).toBeLessThanOrEqual(sessionQueryLimits.entries);
      seen.push(...answer.page.entries.map(entry => entry.n));
      if (!answer.page.more) break;
      expect(answer.page.cursor).toBeGreaterThan(after);
      after = answer.page.cursor;
    }
    expect(seen.length).toBeGreaterThan(0);
    expect(seen).toEqual([...new Set(seen)].sort((a, b) => a - b));
    expect(await new SessionQueries(source).transcript(ref, 0)).toEqual(await queries.transcript(ref, 0));
    await expect(queries.standaloneFile(ids.finished, '../session.json')).rejects.toMatchObject({ code: 'not-found', message: 'The transcript names no file ../session.json' });
    await expect(queries.standaloneBody(ids.finished, 'not-a-hash')).rejects.toMatchObject({ code: 'invalid-request' });
    expect(await retained(made.path)).toEqual(before);
    // Owner changes after the read, not a query effect: terminal cache is preserved.
    const recordPath = join(made.path, sessionsDirectory, ids.finished, sessionLayout.session);
    const record = JSON.parse(await readFile(recordPath, 'utf8'));
    await writeFile(recordPath, JSON.stringify({ ...record, schema: 'ramify-agent.session/999' }));
    expect(await queries.standaloneSession(ids.finished)).toEqual(original);
    await expect(new SessionQueries(source).standaloneSession(ids.finished)).rejects.toMatchObject({ code: 'unsupported-version' });
  } finally { await made.remove(); }
});
