import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { protocolPaths } from '../interfaces/protocol/paths.js';
import { runEventPageSchema, runListResponseSchema, workItemListResponseSchema } from '../interfaces/protocol/runs.js';
import { startServerWith, type RunningServer } from '../http/server.js';
import { RunQueries } from '../../subs/projections/src/queries.js';
import { SessionQueries } from '../../subs/projections/src/session-queries.js';
import { createQuerySource } from '../http/query-source.js';
import { expectNoProcesses, forgetExternalTools } from './helpers/external-tools.js';
import { FakeRamifyCli } from './helpers/fake-ramify.js';
import { treeInputs } from './helpers/iterations.js';
import { fileHashes, protocolPolicy, protocolScript, protocolTarget } from './helpers/protocol.js';
import { protocolPorts } from './helpers/protocol-ports.js';
import { openRuns, runEventsOnDisk, runPath, startRun, unscriptedChangeHistory } from './helpers/runs.js';

/*
 * The exhaustive form of projections-pure.test.ts: every query of the
 * protocol against a completed run, in-process and again over HTTP against a
 * harness that loaded the run afresh, twice and with every event cursor.
 * Afterwards the run log's last sequence is the same, every file beneath the
 * run is byte-identical, no file was added, and the project's tree is as the
 * run left it.
 */

vi.mock('node:child_process', async original =>
  (await import('./helpers/process-guard.js')).guardedChildProcess(await original<typeof import('node:child_process')>()));

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
  try { expectNoProcesses(); } finally { forgetExternalTools(); }
});

const plan = 'review-notes';

async function status(server: RunningServer, path: string): Promise<{ status: number; body: unknown }> {
  const response = await fetch(`${server.url}${path}`);
  return { status: response.status, body: await response.json() };
}

describe('a projection never writes, and no query appends an event', () => {
  test('every query of a completed run, in-process and over HTTP with every cursor, leaves its log, its files and the project unchanged', async () => {
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
      for (let after = 0; after <= lastSequence + 1; after += 1) await queries.events(plan, runId, after);
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
    expect(ports.git.operations()).toEqual(gitOperations);
    await opened.service.close();

    // The second service may create and remove its lock, so compare the
    // complete project only while both services are at rest.
    const restingProject = await fileHashes(root);

    // Then over HTTP, against a harness that loaded the run afresh.
    const { script: _script, ...serverPorts } = ports;
    const server = await startServerWith({
      projectRoot: root, port: 0, ramify: new FakeRamifyCli(),
      runs: { ...serverPorts, inputs: treeInputs(), changeHistory: unscriptedChangeHistory, policy: projectRoot => protocolPolicy(projectRoot), stopGraceMs: 500, warn: () => undefined },
    });
    try {
      const paths: string[] = [
        protocolPaths.runs(plan),
        protocolPaths.run(plan, runId),
        protocolPaths.runAnalysis(plan, runId),
        protocolPaths.runDecisions(plan, runId),
        protocolPaths.runWorkItems(plan, runId),
        protocolPaths.runCapabilities(plan, runId),
        protocolPaths.runModuleCapabilities(plan, runId),
        protocolPaths.runModuleCapabilities(plan, '20990101T000000Z-000000'),
        protocolPaths.runMetrics(plan, runId),
        protocolPaths.runSessions(plan, runId),
        ...originalSessions.sessions.map(session => protocolPaths.runSession(plan, runId, session.session)),
        protocolPaths.runScenarios(plan, runId),
        protocolPaths.runWorkItem(plan, runId, 'wi-999'),
        protocolPaths.runGate(plan, runId, 'ga-9999'),
        `${protocolPaths.run(plan, runId)}/events?after=not-a-number`,
      ];
      for (let after = 0; after <= lastSequence + 1; after += 1) paths.push(protocolPaths.runEvents(plan, runId, after));
      const items = workItemListResponseSchema.parse((await status(server, protocolPaths.runWorkItems(plan, runId))).body);
      for (const item of items.workItems) paths.push(protocolPaths.runWorkItem(plan, runId, item.id));
      const page = runEventPageSchema.parse((await status(server, protocolPaths.runEvents(plan, runId, 0))).body);
      for (const gate of new Set(page.events.flatMap(event => event.refs.filter(ref => ref.kind === 'gate').map(ref => ref.id)))) {
        paths.push(protocolPaths.runGate(plan, runId, gate));
      }
      expect(paths.some(path => path.includes('/gates/ga-'))).toBe(true);
      const answered: number[] = [];
      for (let round = 0; round < 2; round += 1) {
        for (const path of paths) answered.push((await status(server, path)).status);
        expect(await status(server, protocolPaths.runMetrics(plan, runId))).toEqual({ status: 200, body: originalMetrics });
        expect(await status(server, protocolPaths.runSessions(plan, runId))).toEqual({ status: 200, body: originalSessions });
        for (const session of originalSessions.sessions) {
          expect(await status(server, protocolPaths.runSession(plan, runId, session.session))).toEqual({
            status: 200, body: { version: originalSessions.version, session },
          });
        }
      }
      expect(new Set(answered)).toEqual(new Set([200, 404, 400]));
      expect(runListResponseSchema.parse((await status(server, protocolPaths.runs(plan))).body).runs[0]!.version).toBe(lastSequence);
    } finally {
      await server.close();
    }

    // The run log's last sequence is unchanged, and so is every byte.
    expect((await runEventsOnDisk(root, plan, runId)).at(-1)!.sequence).toBe(lastSequence);
    expect(await fileHashes(runPath(root, plan, runId))).toEqual(before);
    expect(await fileHashes(root)).toEqual(restingProject);
    expect(ports.git.operations()).toEqual(gitOperations);
    ports.git.assertComplete();
  }, 300_000);
});
