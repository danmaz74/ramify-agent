import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';
import { RunQueries } from '../queries.js';
import { SessionQueries } from '../session-queries.js';
import { ProjectionError, runView } from '../inputs.js';
import { currentModuleTree } from '../tree.js';
import { authenticateRepairHistory } from '../../../autonomous/subs/work-coordination/src/repair/repair-history.js';
import { runEventSchema } from '../../../autonomous/src/run/log.js';
import { committedRun, FakeCommittedSource } from './helpers/committed.js';
import { temporaryDirectory } from './helpers/fixture.js';

async function bytes(directory: string): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const name of await readdir(directory, { withFileTypes: true })) {
    if (name.isDirectory()) for (const [path, value] of Object.entries(await bytes(join(directory, name.name)))) result[`${name.name}/${path}`] = value;
    else result[name.name] = (await readFile(join(directory, name.name))).toString('base64');
  }
  return result;
}

test('real query entry points repeatedly read scripted committed inputs without writes or effects', async () => {
  const made = await temporaryDirectory();
  try {
    await writeFile(join(made.path, 'witness'), 'unchanged');
    const source = new FakeCommittedSource(made.path, committedRun(made.path));
    const query = new RunQueries(source);
    const sessions = new SessionQueries(source);
    const { planId, jobId } = source.run.record;
    const before = await bytes(made.path);
    const history = JSON.stringify(source.run);
    for (let round = 0; round < 2; round++) {
      expect((await query.run(planId, jobId)).run.version).toBe(1);
      expect((await query.events(planId, jobId, 0)).events).toHaveLength(1);
      expect((await query.events(planId, jobId, 1)).events).toEqual([]);
      expect((await query.workItems(planId, jobId)).workItems).toEqual([]);
      expect((await query.capabilities(planId, jobId)).capabilities).toEqual([]);
      expect((await query.scenarios(planId, jobId)).scenarios).toEqual([]);
      expect((await query.capabilityTasks(planId, jobId, 1)).tasks).toEqual([]);
      await query.analysis(planId, jobId);
      await query.decisions(planId, jobId);
      await query.checkFindings(planId, jobId, { module: null, workItem: null, select: 'all', order: 'id', after: null, limit: 10 }, 1);
      await query.checkFindingModules(planId, jobId, 1);
      await query.reviews(planId, jobId, { workItem: null, after: null, limit: 10 }, 1);
      await query.metrics(planId, jobId);
      await query.moduleCapabilities(planId, jobId);
      const core = await query.executionCore(planId, jobId);
      expect(core.runVersion).toBe(1);
      await query.executionMapPage(planId, jobId, { version: 1, limit: 2 });
      expect((await sessions.runSessions(planId, jobId)).sessions).toEqual([]);
      expect((await sessions.updates(planId, jobId, 1, [])).version).toBe(1);
      await expect(sessions.updates(planId, jobId, 2, [])).rejects.toMatchObject({ code: 'invalid-request' });
      await expect(query.capabilityTasks(planId, jobId, 0)).rejects.toMatchObject({ code: 'stale-version', currentVersion: 1 });
      await expect(query.workItem(planId, jobId, 'work-item:missing')).rejects.toMatchObject({ code: 'not-found' });
      await expect(query.workItem(planId, jobId, 'missing')).rejects.toMatchObject({ code: 'invalid-request' });
      expect(await currentModuleTree(made.path)).toMatchObject({ status: 'unavailable' });
    }
    expect(await bytes(made.path)).toEqual(before);
    expect(JSON.stringify(source.run)).toBe(history);
    expect(authenticateRepairHistory(source.run.entries)).toEqual([]);
  } finally { await made.remove(); }
});

test('unsupported committed versions and malformed records preserve refusal evidence, not repaired records', async () => {
  const made = await temporaryDirectory();
  try {
    const run = committedRun(made.path);
    const event = runEventSchema.parse({ sequence: 2, jobId: run.record.jobId, at: run.record.createdAt,
      type: 'restart-branch-ready', data: { branch: 'candidate', head: 'head', tree: 'tree' } });
    for (const body of [{ schema: 'ramify-agent.hypothesis/999' }, { schema: 'ramify-agent.hypothesis/2' }]) {
      const retained = { ...run, entries: [...run.entries, { sequence: 2, at: event.at, transaction: { event,
        records: [{ path: 'hypotheses/hyp-001.json', id: 'hyp-001', revision: 1, body }] } }] };
      const before = JSON.stringify(retained);
      let error: unknown;
      try { runView(retained); } catch (caught) { error = caught; }
      expect(error).toBeInstanceOf(ProjectionError);
      expect(error).toMatchObject({ code: body.schema.endsWith('/999') ? 'unsupported-version' : 'unreadable', evidence: expect.arrayContaining([`plans/${run.record.planId}/.harness/jobs/${run.record.jobId}/hypotheses/hyp-001.json`]) });
      expect(JSON.stringify(retained)).toBe(before);
    }
  } finally { await made.remove(); }
});

test('the production source calls nothing that writes and receives no writable service or effect collaborator', async () => {
  const directory = fileURLToPath(new URL('../', import.meta.url));
  const files = (await readdir(directory)).filter(name => name.endsWith('.ts'));
  expect(files).toEqual(expect.arrayContaining(['module-capabilities.ts', 'tree.ts', 'repairs.ts', 'consultations.ts']));
  const writing = /\b(writeFile|appendFile|appendJsonLine|writeFileAtomic|writeFileExclusive|commitRecord|recoverCommits|mkdir|rm|unlink|truncate|rename)\s*\(|\.append\(|\.write\(|\.execute\(|(?<!\bz)\.record\(/;
  const collaborators = /\b(RunService|ContentStore|openLedger|CommandRunner|runCommand|openSessionStore)\b/;
  for (const file of files) {
    const source = await readFile(join(directory, file), 'utf8');
    const offending = source.split('\n').filter(line => !line.trim().startsWith('*') && !line.trim().startsWith('//') && (writing.test(line) || collaborators.test(line)));
    expect([file, offending]).toEqual([file, []]);
  }
  expect(await readFile(join(directory, 'repairs.ts'), 'utf8')).toContain("from '../../autonomous/subs/work-coordination/src/repair/repair-history.js'");
  expect(await readFile(join(directory, 'consultations.ts'), 'utf8')).toContain('openContentReader(join(directory, runLayout.blobs))');
});
