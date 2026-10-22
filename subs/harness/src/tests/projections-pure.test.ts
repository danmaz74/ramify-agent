import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { RunQueries } from '../../subs/projections/src/queries.js';
import { SessionQueries } from '../../subs/projections/src/session-queries.js';
import { createQuerySource } from '../http/query-source.js';
import { runEventSchema, type RunEvent } from '../../subs/autonomous/src/run/log.js';
import { authenticateRepairHistory, type RepairHistoryEntry } from '../../subs/autonomous/subs/work-coordination/src/repair/repair-history.js';
import { expectNoProcesses, forgetExternalTools } from './helpers/external-tools.js';
import { treeInputs } from './helpers/iterations.js';
import { fileHashes, protocolPolicy, protocolScript, protocolTarget } from './helpers/protocol.js';
import { protocolPorts } from './helpers/protocol-ports.js';
import { openRuns, runEventsOnDisk, runPath, startRun } from './helpers/runs.js';

/*
 * A projection never writes, and no query appends an event.
 *
 * Every query of the protocol is run in-process against a completed run,
 * twice, with the first, a middle, the last and a past-the-end event cursor.
 * Afterwards the run log's last sequence is the same, every file beneath the
 * run is byte-identical, and the project's records and Git are untouched.
 * `projections-pure.stress.ts` runs every cursor, and again over HTTP.
 */

vi.mock('node:child_process', async original =>
  (await import('./helpers/process-guard.js')).guardedChildProcess(await original<typeof import('node:child_process')>()));

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
  try { expectNoProcesses(); } finally { forgetExternalTools(); }
});

const plan = 'review-notes';

test('repair authentication accepts decoded events, not unknown event data', () => {
  const event: RunEvent = runEventSchema.parse({
    sequence: 1, jobId: 'job-001', at: '2026-10-13T00:00:00.000Z',
    type: 'external-candidate-observed', data: { id: 'candidate', beforeTree: 'head', afterTree: 'tree' },
  });
  const entry: RepairHistoryEntry = { transaction: { event, records: [] } };
  expect(authenticateRepairHistory([entry])).toEqual([]);
  expect(runEventSchema.safeParse({ ...event, type: 'repair-incident-recorded', data: null }).success).toBe(false);
  const unknownEvent: { type: string; sequence: number; at: string; data: unknown } = event;
  // @ts-expect-error Unauthenticated unknown data is not a decoded RunEvent.
  const rejected: RepairHistoryEntry = { transaction: { event: unknownEvent, records: [] } };
  void rejected; // Compile-time counterexample only: never authenticate this input.
});

describe('a projection never writes, and no query appends an event', () => {
  test('every query of a completed run leaves its log, its files and the project unchanged', async () => {
    const target = await protocolTarget(false);
    cleanups.push(target.remove);
    const { root } = target;
    const ports = protocolPorts(root);
    const opened = await openRuns(root, { ...ports, script: protocolScript(root), inputs: treeInputs(), policy: projectRoot => protocolPolicy(projectRoot) });
    const receipt = await opened.service.execute(startRun(plan));
    const runId = receipt.jobId;
    await opened.service.settled(plan, runId);
    expect(opened.service.getRun(plan, runId)).toMatchObject({ state: 'completed', failure: null });

    // In-process first, against the service that ran it.
    const before = await fileHashes(runPath(root, plan, runId));
    const lastSequence = (await runEventsOnDisk(root, plan, runId)).at(-1)!.sequence;
    const projectRecords = await fileHashes(join(root, 'subs'));
    const gitOperations = ports.git.operations();
    const source = createQuerySource(opened.service);
    const queries = new RunQueries(source);
    const sessions = new SessionQueries(source);
    const originalMetrics = await queries.metrics(plan, runId);
    const originalSessions = await sessions.runSessions(plan, runId);
    expect(originalSessions.sessions.length).toBeGreaterThan(0);
    for (let round = 0; round < 2; round += 1) {
      await queries.list(plan);
      await queries.run(plan, runId);
      for (const after of [0, Math.floor(lastSequence / 2), lastSequence, lastSequence + 1]) await queries.events(plan, runId, after);
      await queries.analysis(plan, runId);
      await queries.decisions(plan, runId);
      const { workItems } = await queries.workItems(plan, runId);
      for (const item of workItems) await queries.workItem(plan, runId, item.id);
      await queries.capabilities(plan, runId);
      await queries.moduleCapabilities(plan, runId);
      await queries.scenarios(plan, runId);
      expect(await queries.metrics(plan, runId)).toEqual(originalMetrics);
      expect(await sessions.runSessions(plan, runId)).toEqual(originalSessions);
      for (const session of originalSessions.sessions) {
        expect((await sessions.runSession(plan, runId, session.session)).session).toEqual(session);
      }
      const events = await queries.events(plan, runId, 0);
      for (const gate of new Set(events.events.flatMap(event => event.refs.filter(ref => ref.kind === 'gate').map(ref => ref.id)))) {
        await queries.gate(plan, runId, gate);
      }
    }
    expect(opened.service.events(plan, runId)!.at(-1)!.sequence).toBe(lastSequence);
    expect(await fileHashes(join(root, 'subs'))).toEqual(projectRecords);
    await opened.service.close();
    expect((await runEventsOnDisk(root, plan, runId)).at(-1)!.sequence).toBe(lastSequence);
    expect(await fileHashes(runPath(root, plan, runId))).toEqual(before);
    expect(ports.git.operations()).toEqual(gitOperations);
    ports.git.assertComplete();
  }, 300_000);

  test('the projection source calls nothing that writes', async () => {
    await expect(readdir(new URL('../projections/', import.meta.url))).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(readFile(new URL('../kpi/lines.ts', import.meta.url))).rejects.toMatchObject({ code: 'ENOENT' });
    await expect(readdir(new URL('../kpi/', import.meta.url))).rejects.toMatchObject({ code: 'ENOENT' });
    // A tripwire beside the behavioral test above: the projections and the
    // KPI projection name no writing primitive of the file system, the
    // ledger or the run service. Zod's `z.record(` is a schema, not a write.
    const writing = /\b(writeFile|appendFile|appendJsonLine|writeFileAtomic|writeFileExclusive|commitRecord|recoverCommits|mkdir|rm|unlink|truncate|rename)\s*\(|\.append\(|\.write\(|\.execute\(|(?<!\bz)\.record\(/;
    const directory = fileURLToPath(new URL('../../subs/projections/src/', import.meta.url));
    const files = [
      ...(await readdir(directory)).filter(name => name.endsWith('.ts')).map(name => join(directory, name)),
      fileURLToPath(new URL('../../subs/kpi/src/metrics.ts', import.meta.url)),
      fileURLToPath(new URL('../../subs/kpi/src/guarding.ts', import.meta.url)),
      fileURLToPath(new URL('../../subs/kpi/src/lines.ts', import.meta.url)),
      fileURLToPath(new URL('../../subs/kpi/src/measurement/owners.ts', import.meta.url)),
    ];
    expect(files.length).toBeGreaterThan(5);
    // The comparison's projection and the tree load it shares with the module-tree query are among them.
    expect(files).toEqual(expect.arrayContaining([join(directory, 'module-capabilities.ts'), join(directory, 'tree.ts')]));
    for (const file of files) {
      const offending = (await readFile(file, 'utf8')).split('\n').filter(line => writing.test(line) && !line.trim().startsWith('*') && !line.trim().startsWith('//'));
      expect([file, offending]).toEqual([file, []]);
    }
  });
});
