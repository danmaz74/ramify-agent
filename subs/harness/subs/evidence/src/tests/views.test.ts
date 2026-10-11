import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import { apiViewDirectoriesOf, coverageRecordsOf, describeCoverageLimits, loadArchitectIndex, readApiView, readArchitectMeta, type ArchitectIndex, type ModuleEntry } from '../views.js';
import { temporaryDirectory } from './helpers/temporary.js';

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0)) await cleanup(); });

async function fixture() {
  const temp = await temporaryDirectory();
  cleanups.push(temp.remove);
  const write = async (path: string, value: unknown) => {
    const target = resolve(temp.path, path);
    await mkdir(resolve(target, '..'), { recursive: true });
    await writeFile(target, JSON.stringify(value));
  };
  return { root: temp.path, write };
}

const architect = { schema: 'ramify.architect-view/3', revision: 'rev/1:test', input: 'input/1:test', modules: 1,
  dependencies: 'measured', dependencyScope: 'production', testReferences: 'measured', metrics: 'measured' };
const entry: ModuleEntry = { module: 'app', dir: '', parent: null, children: [], tags: [], areas: ['src', 'src/tests'] };

describe('current generated view readers', () => {
  test('architect metadata and module documents refuse stale schemas', async () => {
    const f = await fixture();
    await f.write('.ramify-architect/_meta.json', architect);
    expect((await readArchitectMeta(f.root)).input).toBe('input/1:test');
    await f.write('.ramify-architect/module.json', { schema: 'ramify.architect-module/2', ...entry });
    await expect(loadArchitectIndex(f.root)).rejects.toThrow('ramify.architect-module/3');
    await f.write('.ramify-architect/module.json', { schema: 'ramify.architect-module/3', ...entry, areas: ['src', 'unknown'] });
    await expect(loadArchitectIndex(f.root)).rejects.toThrow('ramify.architect-module/3');
    await f.write('.ramify-architect/_meta.json', { ...architect, schema: 'ramify.architect-view/2' });
    await expect(readArchitectMeta(f.root)).rejects.toThrow('ramify.architect-view/3');
    const missingSchema: Record<string, unknown> = { ...architect };
    delete missingSchema.schema;
    await f.write('.ramify-architect/_meta.json', missingSchema);
    await expect(readArchitectMeta(f.root)).rejects.toThrow('ramify.architect-view/3');
  });

  test('ordinary and testing API areas have separate exact metadata and reject mismatches', async () => {
    const f = await fixture();
    expect(await readApiView(f.root, entry, 'src')).toBeUndefined();
    await f.write('src/.ramify/_meta.json', { schema: 'ramify.api-view/1', module: 'app', area: 'ordinary', revision: 'rev/1:test' });
    await f.write('src/tests/.ramify/_meta.json', { schema: 'ramify.api-view/1', module: 'app', area: 'tests', revision: 'rev/1:test', coverage: 2 });
    expect((await readApiView(f.root, entry, 'src'))?.coverage).toBeNull();
    expect((await readApiView(f.root, entry, 'src/tests'))?.coverage).toBe(2);
    await f.write('src/tests/.ramify/_meta.json', { schema: 'ramify.api-view/1', module: 'app', area: 'ordinary', revision: 'rev/1:test' });
    await expect(readApiView(f.root, entry, 'src/tests')).rejects.toThrow('app src/tests');
    await f.write('src/tests/.ramify/_meta.json', { schema: 'ramify.api-view/2', module: 'app', area: 'tests', revision: 'rev/1:test' });
    await expect(readApiView(f.root, entry, 'src/tests')).rejects.toThrow('ramify.api-view/1');
    await f.write('src/tests/.ramify/_meta.json', { schema: 'ramify.api-view/1', module: 'other', area: 'tests', revision: 'rev/1:test' });
    await expect(readApiView(f.root, entry, 'src/tests')).rejects.toThrow('app src/tests');
    await f.write('src/tests/.ramify/_meta.json', { schema: 'ramify.api-view/1', area: 'tests', revision: 'rev/1:test' });
    await expect(readApiView(f.root, entry, 'src/tests')).rejects.toThrow('app src/tests');
    await f.write('src/tests/.ramify/_meta.json', { schema: 'ramify.api-view/1', module: 'app', area: 'tests', revision: '' });
    await expect(readApiView(f.root, entry, 'src/tests')).rejects.toThrow('app src/tests');
    await f.write('src/tests/.ramify/_meta.json', { schema: 'ramify.api-view/1', module: 'app', area: 'tests' });
    await expect(readApiView(f.root, entry, 'src/tests')).rejects.toThrow('app src/tests');
  });
});

describe('what a view\'s coverage limits mark', () => {
  const index: ArchitectIndex = { revision: 'rev/1:test', input: 'input/1:test', modules: new Map(), symbols: new Map([
    ['app/ui', [
      { module: 'app/ui', name: 'Badge', binding: 'value', file: 'ui/src/badge.tsx', role: 'behavior', to: [], cut: ['sig'] },
      { module: 'app/ui', name: 'Plain', binding: 'value', file: 'ui/src/plain.ts', role: 'behavior', to: [] },
    ]],
    ['app', [{ module: 'app', name: 'default', binding: 'value', file: 'vite.config.ts', role: 'supporting', to: [], detail: 'unsupported-declaration' }]],
  ]) } as unknown as ArchitectIndex;

  test('names the records the cut and details-unavailable counts mark, counting titles no record names', () => {
    const records = coverageRecordsOf(index);
    expect(records).toEqual([
      { module: 'app', name: 'default', file: 'vite.config.ts', limit: 'details-unavailable', what: 'unsupported-declaration' },
      { module: 'app/ui', name: 'Badge', file: 'ui/src/badge.tsx', limit: 'cut', what: 'signature' },
    ]);
    expect(describeCoverageLimits(['cut: 3', 'detailsUnavailable: 1', 'unknown shapes: 2'], records)).toEqual([
      'cut: 3, one record with truncated detail: `ui/src/badge.tsx#Badge` (signature); 2 cut test, feature or module-purpose titles',
      'detailsUnavailable: 1, one record with no details: `vite.config.ts#default` (unsupported-declaration)',
      'unknown shapes: 2',
    ]);
  });

  test('says whether any marked record is in the work item\'s module', () => {
    const records = coverageRecordsOf(index);
    expect(describeCoverageLimits(['cut: 1'], records, ['app/ui']).at(-1)).toBe('In `app/ui`: `ui/src/badge.tsx#Badge` (signature).');
    expect(describeCoverageLimits(['cut: 1'], records, ['app/other']).at(-1)).toBe('None of these records is in `app/other`.');
    expect(describeCoverageLimits([], records, ['app/ui'])).toEqual([]);
  });

  test('lists the API view directories that exist, with their area\'s revision and coverage', async () => {
    const f = await fixture();
    const module: ModuleEntry = { ...entry, dir: 'ui' };
    expect(await apiViewDirectoriesOf(f.root, module)).toEqual([]);
    await f.write('ui/src/.ramify/_meta.json', { revision: 'api/1', coverage: 2 });
    await f.write('ui/src/.ramify/external/react.json', {});
    await f.write('ui/src/tests/.ramify/_meta.json', { revision: 'api/2', coverage: 0 });
    await f.write('ui/src/tests/.ramify/children/x.json', {});
    expect(await apiViewDirectoriesOf(f.root, module)).toEqual([
      { area: 'src', path: 'ui/src/.ramify/external', revision: 'api/1', coverage: 2 },
      { area: 'src/tests', path: 'ui/src/tests/.ramify/children', revision: 'api/2', coverage: null },
    ]);
  });
});
