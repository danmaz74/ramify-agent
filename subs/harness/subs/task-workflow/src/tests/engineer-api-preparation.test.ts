
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';
import { RamifyCli, type MaterializeResult } from '../../../evidence/src/ramify-cli.js';
import { loadArchitectIndex } from '../../../evidence/src/views.js';
import { apiViewsOf, iterationApiViews } from '../../../autonomous/subs/work-coordination/src/work/session.js';
import { temporaryDirectory } from '../../../../src/tests/helpers/fixture.js';

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  vi.restoreAllMocks();
  const errors: unknown[] = [];
  for (const cleanup of cleanups.splice(0).reverse()) { try { await cleanup(); } catch (error) { errors.push(error); } }
  if (errors.length > 0) throw new AggregateError(errors, 'API fixture cleanup or scripted boundary verification failed');
});

async function fixture() {
  const directory = await temporaryDirectory();
  cleanups.push(directory.remove);
  const root = directory.path;
  const revision = 'rev/3:scripted-api:1';
  const files: Record<string, unknown> = {
    '.ramify-architect/_meta.json': { schema: 'ramify.architect-view/3', revision, input: 'input/3:api', modules: 1, dependencies: 'measured', dependencyScope: 'production' },
    '.ramify-architect/analysis/module.json': { schema: 'ramify.architect-module/3', module: 'app/analysis', dir: 'subs/analysis', parent: 'app', children: [], tags: [], areas: ['src', 'src/tests'] },
    'subs/analysis/src/.ramify/_meta.json': { schema: 'ramify.api-view/1', module: 'app/analysis', area: 'ordinary', revision },
    'subs/analysis/src/tests/.ramify/_meta.json': { schema: 'ramify.api-view/1', module: 'app/analysis', area: 'tests', revision },
  };
  for (const [path, content] of Object.entries(files)) {
    await mkdir(join(root, path, '..'), { recursive: true });
    await writeFile(join(root, path), JSON.stringify(content));
  }
  const ramify = new RamifyCli();
  const replies: MaterializeResult[] = [
    { ok: true, output: '' }, { ok: false, message: 'partial: capture superseded' },
    ...Array.from({ length: 4 }, () => ({ ok: true as const, output: '' })),
  ];
  let used = 0;
  const errors: unknown[] = [];
  vi.spyOn(ramify, 'materialize').mockImplementation(async (project, module) => {
    try {
      expect(project).toBe(root); expect(module).toBe('subs/analysis');
      const reply = replies[used++]; expect(reply, 'undeclared API refresh').toBeDefined(); return reply!;
    } catch (error) { errors.push(error); throw error; }
  });
  cleanups.push(async () => { expect(errors).toEqual([]); expect(used).toBe(6); });
  return { root, ramify, index: await loadArchitectIndex(root) };
}

test('failed refresh never presents leftover views as current; a missing expected area remains explicit alongside available evidence', async () => {
  const { root, ramify, index } = await fixture();
  const initial = await apiViewsOf(ramify, root, index, 'app/analysis');
  expect(initial.evidence?.views).toHaveLength(2);
  expect(await apiViewsOf(ramify, root, index, 'app/analysis')).toEqual({
    evidence: null, unavailable: 'the API view could not be materialized: partial: capture superseded',
  });
  await rm(join(root, 'subs/analysis/src/tests/.ramify'), { recursive: true });
  const missing = await iterationApiViews(ramify, root, index, { module: 'app/analysis', included: [] });
  expect(missing[0]!.views.map(view => view.area)).toEqual(['src']);
  expect(missing[0]!.unavailable).toContain('src/tests/.ramify: materialization reported success');
  const ordinaryMetaPath = join(root, 'subs/analysis/src/.ramify/_meta.json');
  const ordinaryMeta = JSON.parse(await readFile(ordinaryMetaPath, 'utf8')) as Record<string, unknown>;
  await writeFile(ordinaryMetaPath, JSON.stringify({ ...ordinaryMeta, revision: 'rev/1:wrong' }));
  expect((await apiViewsOf(ramify, root, index, 'app/analysis')).unavailable)
    .toContain('differs from the architect revision');
  await writeFile(ordinaryMetaPath, JSON.stringify(ordinaryMeta));
  await rm(join(root, 'subs/analysis/src/tests'), { recursive: true });
  expect((await apiViewsOf(ramify, root, index, 'app/analysis')).unavailable).toBeNull();
  await rm(join(root, '.ramify-architect/_meta.json'));
  expect(await apiViewsOf(ramify, root, index, 'app/analysis')).toMatchObject({
    evidence: null, unavailable: expect.stringContaining('the materialized architect view could not be read'),
  });
}, 60_000);

test('an extra consumer caller receives its own ordinary/testing views with refresh revision and coverage', async () => {
  const directory = await temporaryDirectory(); cleanups.push(directory.remove);
  const root = directory.path;
  const revision = 'rev/3:scripted-consumer:2';
  const files: Record<string, unknown> = {
    '.ramify-architect/_meta.json': { schema: 'ramify.architect-view/3', revision, input: 'input/3:consumer', modules: 2, dependencies: 'measured', dependencyScope: 'production' },
  };
  for (const name of ['provider', 'consumer']) {
    files[`.ramify-architect/${name}/module.json`] = { schema: 'ramify.architect-module/3', module: `app/${name}`, dir: `subs/${name}`, parent: 'app', children: [], tags: [], areas: ['src', 'src/tests'] };
    for (const [area, kind] of [['src', 'ordinary'], ['src/tests', 'tests']]) files[`subs/${name}/${area}/.ramify/_meta.json`] = { schema: 'ramify.api-view/1', module: `app/${name}`, area: kind, revision, ...(name === 'consumer' ? { coverage: 1 } : {}) };
  }
  for (const [path, content] of Object.entries(files)) { await mkdir(join(root, path, '..'), { recursive: true }); await writeFile(join(root, path), JSON.stringify(content)); }
  const ramify = new RamifyCli(); const calls: string[] = [];
  vi.spyOn(ramify, 'materialize').mockImplementation(async (project, module) => {
    expect(project).toBe(root); expect(['subs/provider', 'subs/consumer']).toContain(module); calls.push(module!); return { ok: true, output: '' };
  });
  const index = await loadArchitectIndex(root);
  const extra = [{ path: 'subs/consumer/src/caller.ts', purpose: 'consumer' as const }];
  const views = await iterationApiViews(ramify, root, index, { module: 'app/provider', included: [] }, extra);
  expect(calls).toEqual(['subs/provider', 'subs/consumer']);
  const consumer = views.find(entry => entry.module === 'app/consumer')!;
  expect(consumer.unavailable).toBeNull();
  expect(consumer.views).toEqual([
    { area: 'src', path: 'subs/consumer/src/.ramify', revision, coverage: 1 },
    { area: 'src/tests', path: 'subs/consumer/src/tests/.ramify', revision, coverage: 1 },
  ]);
});

test('missing extra consumer ownership remains an explicit API evidence limitation', async () => {
  const ramify = new RamifyCli();
  const materialize = vi.spyOn(ramify, 'materialize');
  const views = await iterationApiViews(ramify, '/project', null, { module: 'app/provider', included: [] }, [
    { path: 'subs/consumer/src/caller.ts', purpose: 'consumer' },
  ]);
  expect(views).toMatchObject([{ module: 'app/provider', views: [], unavailable: expect.stringContaining('consumer ownership and API views are unavailable for extra file "subs/consumer/src/caller.ts": there is no architect index') }]);
  expect(materialize).not.toHaveBeenCalled();
});
