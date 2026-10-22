import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { analysisResponseSchema, runResponseSchema, scenarioListResponseSchema } from '../interfaces/protocol/runs.js';
import { RunQueries } from '../../subs/projections/src/queries.js';
import { createQuerySource } from '../http/query-source.js';
import { fileHashes, logLines, plan, runDirectory, runToEnd, scenarios, type ScenarioName } from './helpers/composition.js';

vi.mock('node:child_process', async original =>
  (await import('./helpers/process-guard.js')).guardedChildProcess(await original<typeof import('node:child_process')>()));

/*
 * The exhaustive form of composition.test.ts's query purity check: every
 * query over every composed run and every event cursor, twice, and the run,
 * analysis and scenario queries asked after every durable write while each
 * run runs. The ordinary suite keeps four cursors on one run.
 */

type Finished = Awaited<ReturnType<typeof runToEnd>>;
const finished = new Map<ScenarioName, Finished>();

beforeAll(async () => {
  const names = Object.keys(scenarios) as ScenarioName[];
  const results = await Promise.allSettled(names.map(name => runToEnd(scenarios[name], async (service, runId) => {
    const queries = new RunQueries(createQuerySource(service));
    runResponseSchema.parse(await queries.run(plan, runId));
    analysisResponseSchema.parse(await queries.analysis(plan, runId));
    scenarioListResponseSchema.parse(await queries.scenarios(plan, runId));
  })));
  names.forEach((name, index) => { const result = results[index]!; if (result.status === 'fulfilled') finished.set(name, result.value); });
  const failed = results.flatMap((result, index) => result.status === 'rejected' ? [`${names[index]}: ${String(result.reason)}`] : []);
  expect(failed, 'composed scenario failures').toEqual([]);
}, 600_000);

afterAll(async () => {
  for (const run of finished.values()) await run.dispose();
});

describe('no query appends an event', () => {
  test('every query, over every completed and failed composed run, leaves its log, its files and its project as they were', async () => {
    for (const [name, run] of finished) {
      const directory = runDirectory(run.root, run.runId);
      const before = await fileHashes(directory);
      const lines = (await logLines(run.root, run.runId)).length;
      const asked = run.git.operations();
      const queries = new RunQueries(createQuerySource(run.service));
      for (let round = 0; round < 2; round += 1) {
        await queries.list(plan);
        await queries.run(plan, run.runId);
        for (let after = 0; after <= lines + 1; after += 1) await queries.events(plan, run.runId, after);
        await queries.analysis(plan, run.runId);
        await queries.decisions(plan, run.runId);
        const { workItems } = await queries.workItems(plan, run.runId);
        for (const item of workItems) await queries.workItem(plan, run.runId, item.id);
        await queries.capabilities(plan, run.runId);
        await queries.scenarios(plan, run.runId);
        await queries.metrics(plan, run.runId);
        await queries.checkFindings(plan, run.runId, { workItem: null, module: null, select: 'all', order: 'attention', after: null, limit: 100 });
        await queries.checkFindingModules(plan, run.runId);
        await queries.reviews(plan, run.runId, { workItem: null, after: null, limit: 100 });
        const page = await queries.events(plan, run.runId, 0);
        for (const gate of new Set(page.events.flatMap(event => event.refs.filter(ref => ref.kind === 'gate').map(ref => ref.id)))) {
          await queries.gate(plan, run.runId, gate);
        }
      }
      expect([name, (await logLines(run.root, run.runId)).length]).toEqual([name, lines]);
      expect(await fileHashes(directory)).toEqual(before);
      expect([name, run.git.operations()], 'a query asked Git something').toEqual([name, asked]);
    }
  }, 300_000);
});
