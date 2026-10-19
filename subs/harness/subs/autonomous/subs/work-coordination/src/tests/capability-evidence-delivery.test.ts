import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';
import { capabilityRecordSection, capabilitySourceSection, capabilityViewInputs } from '../capability/delivery.js';
import { fixtureRequest } from './helpers/capability.js';
import { temporaryDirectory } from '../../../../../../src/tests/helpers/fixture.js';
import { runAcceptedHandback } from '../../../../../../src/tests/helpers/acceptance-flow.js';
import { runEventsOnDisk } from '../../../../../../src/tests/helpers/runs.js';
import type { TaskPacket } from '../../../../../task-execution/src/delivery/packet.js';
import { FakeRamifyCli } from '../../../../../../src/tests/helpers/fake-ramify.js';

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  vi.restoreAllMocks();
  const errors: unknown[] = [];
  for (const cleanup of cleanups.splice(0).reverse()) try { await cleanup(); } catch (error) { errors.push(error); }
  if (errors.length > 0) throw new AggregateError(errors, 'Evidence delivery cleanup failed');
});

test('qualified architect navigation is preserved alongside newer consumer API evidence', () => {
  const existing = [{ path: '.ramify-architect', revision: 'architect-before', modules: ['app', 'app/consumer'], coverage: ['earlier dependency analysis has one limit'] }];
  const original = structuredClone(existing);
  const views = capabilityViewInputs(existing, [{ module: 'app/consumer', unavailable: null, views: [
    { area: 'src', path: 'subs/consumer/src/.ramify', revision: 'api-after', coverage: 1 },
    { area: 'src/tests', path: 'subs/consumer/src/tests/.ramify', revision: 'api-after', coverage: null },
  ] }]);
  expect(views[0]).toEqual(original[0]);
  expect(views.slice(1)).toMatchObject([{ path: 'subs/consumer/src/.ramify', revision: 'api-after', coverage: [expect.stringContaining('one source-analysis limit')] },
    { path: 'subs/consumer/src/tests/.ramify', revision: 'api-after', coverage: [] }]);
  expect(existing).toEqual(original);
  expect(capabilityViewInputs([], [{ module: 'app/consumer', views: [], unavailable: 'materialization unavailable' }])).toEqual([]);
});

test('prospective navigation supplies existing parents and preserves the request status after file creation', async () => {
  const root = await temporaryDirectory(); cleanups.push(root.remove);
  await mkdir(join(root.path, 'subs/a/src/tests'), { recursive: true });
  await writeFile(join(root.path, 'subs/a/src/caller.ts'), 'export const caller = true;');
  const request = fixtureRequest();
  request.original.usage.push({ path: 'subs/a/src/tests/preview.test.ts', module: 'a', use: 'Future integration test', prospective: true });
  let text = await capabilitySourceSection(root.path, request);
  expect(text).toContain(`read current source at ${root.path}/subs/a/src/caller.ts`);
  expect(text).toContain('Prospective usage subs/a/src/tests/preview.test.ts');
  expect(text).toContain(`List ${root.path}/subs/a/src/tests`);
  expect(text).toContain('do not open the prospective file as existing live source');
  expect(text).toContain('adds no write authority');
  await writeFile(join(root.path, 'subs/a/src/tests/preview.test.ts'), 'test source');
  text = await capabilitySourceSection(root.path, request);
  expect(text).toContain('its request status remains prospective');
  expect(request.original.usage[1]!.prospective).toBe(true);
});

test('absolute delivered record pointers resolve from both source and project cwd without altering durable paths', async () => {
  const root = await temporaryDirectory(); cleanups.push(root.remove);
  const job = join(root.path, 'plans/preview/.harness/jobs/run');
  const paths = ['capabilities/snapshots/need-001.json', 'capabilities/cap-001/plan/2.json', 'work-items/cap-001/iterations/01/result.json', 'gates/ga-0002/report.json', 'reviews/rq-0001/attempts/01/attempt.json'];
  for (const path of paths) { await mkdir(join(job, path, '..'), { recursive: true }); await writeFile(join(job, path), path); }
  const section = capabilityRecordSection(job, paths.map(path => ({ path, label: path })));
  expect(section).toContain(`Run-record root: ${job}`);
  for (const pointer of section.split('\n').filter(line => line.startsWith('- ')).map(line => line.slice(line.indexOf(': ') + 2))) {
    for (const cwd of [root.path, join(root.path, 'subs/a/src')]) expect(await readFile(resolve(cwd, pointer), 'utf8')).toBe(pointer.slice(job.length + 1));
  }
  expect(section).toContain('immutable suspension tree'); expect(section).toContain('live candidate');
  expect(paths[0]).toBe('capabilities/snapshots/need-001.json');
});

test('recorded fresh and continued task packets supply snapshot, accepted revisions, result, gate and review pointers and qualify consumer evidence', async () => {
  // Deterministic provider answers, explicitly carrying partial coverage. The
  // test establishes delivery, not real importability through the installed CLI.
  const original = FakeRamifyCli.prototype.materialize;
  vi.spyOn(FakeRamifyCli.prototype, 'materialize').mockImplementation(async function (this: FakeRamifyCli, root, from, signal) {
    if (from === undefined) return original.call(this, root, from, signal);
    const revision = `rev/3:scripted-delivery:${createHash('sha256').update(await readFile(join(root, 'module.ramify'))).update(await readFile(join(root, 'subs/b/src/fact.ts'))).digest('hex')}`;
    await mkdir(join(root, '.ramify-architect'), { recursive: true });
    await writeFile(join(root, '.ramify-architect/_meta.json'), JSON.stringify({ schema: 'ramify.architect-view/3', revision, input: 'input/3:scripted', modules: 4, dependencies: 'measured', dependencyScope: 'production' }));
    const module = from === '.' || from === '' ? 'capability-coordination' : `capability-coordination/${from.split('/').at(-1)}`;
    for (const [area, kind] of [['src', 'ordinary'], ['src/tests', 'tests']]) {
      const path = join(root, from, area!, '.ramify');
      await mkdir(path, { recursive: true });
      await writeFile(join(path, '_meta.json'), JSON.stringify({ schema: 'ramify.api-view/1', module, area: kind, revision, coverage: 1 }));
    }
    return { ok: true, output: 'Scripted API evidence with source-analysis limits' };
  });
  await runAcceptedHandback('revision', cleanups, false, async ({ root, planId, runId }) => {
    const events = await runEventsOnDisk(root, planId, runId);
    const starts = events.filter(event => event.type === 'invocation-started').filter(event => ['capability-architect', 'local-architect'].includes(event.data.role) && event.data.work.request !== undefined);
    const job = join(root, `plans/${planId}/.harness/jobs/${runId}`);
    const packets: TaskPacket[] = [];
    for (const start of starts) {
      const hash = createHash('sha256').update(JSON.stringify([runId, start.data.invocation])).digest('hex');
      const operation = JSON.parse(await readFile(join(root, `plans/.harness/session-operations/correlations/operations/${hash}.json`), 'utf8')) as { packet: TaskPacket };
      packets.push(operation.packet);
    }
    const fresh = packets.find(packet => packet.manifest.inheritedPoint === null && packet.submissionTool === 'submit_capability_action')!;
    expect(fresh).toBeDefined();
    expect(fresh.message).toContain(`${job}/capabilities/snapshots/need-001.json`);
    expect(fresh.message).toContain(`${job}/capabilities/cap-001/plan/1.json`);
    const freshViews = fresh.additions.find(input => input.key === 'environment:views')!.text;
    expect(freshViews).toContain('subs/a/src/.ramify');
    const returned = packets.find(packet => packet.message.includes(`${job}/work-items/cap-001/iterations/04/result.json`))!;
    expect(returned.manifest.inheritedPoint).not.toBeNull();
    const records = returned.additions.find(input => input.key === 'brief:support:run-records')!.text;
    expect(records).toContain(`${job}/gates/`); expect(records).toContain(`${job}/reviews/rq-`);
    for (const line of records.split('\n').filter(line => line.startsWith('- ') && line.endsWith('.json'))) {
      const pointer = line.slice(line.indexOf(': ') + 2);
      expect(JSON.parse(await readFile(pointer, 'utf8'))).toBeTruthy();
    }
    for (const packet of packets.filter(packet => packet.submissionTool === 'submit_capability_qualification')) {
      const evidence = packet.additions.find(input => input.key === 'brief:support:consumer-api');
      // An unchanged continuation may inherit the exact effective block.
      if (evidence !== undefined) {
        expect(evidence.text).toContain('capability-coordination/a');
        expect(evidence.text).toContain('"path":"subs/a/src/.ramify"');
        expect(evidence.text).toContain('"path":"subs/a/src/tests/.ramify"');
        expect(evidence.text).toContain('"coverage":1');
        expect(evidence.text).toContain('"revision":"rev/3:scripted-delivery:');
        expect(evidence.text).toContain('Earlier delivered views describe their earlier revision');
      }
    }
    const initialApi = packets.find(packet => packet.submissionTool === 'submit_capability_qualification')!.additions.find(input => input.key === 'brief:support:consumer-api')!.text;
    const laterApi = packets.filter(packet => packet.submissionTool === 'submit_capability_action').flatMap(packet => packet.additions.filter(input => input.key === 'brief:support:consumer-api')).at(-1)!.text;
    expect(laterApi.match(/"revision":"([^"]+)"/u)![1]).not.toBe(initialApi.match(/"revision":"([^"]+)"/u)![1]);
    expect(packets.some(packet => packet.additions.some(input => input.key === 'brief:support:consumer-api'))).toBe(true);
  });
}, 150_000);
