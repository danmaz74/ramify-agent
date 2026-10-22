import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import { boundaryPaths, nodeDiscovery, webDiscovery } from '../../vitest.config.js';

const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });

async function project(files: string[], boundaries?: unknown[]): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'ramify-boundary-manifest-'));
  roots.push(root);
  for (const file of files) { await mkdir(dirname(join(root, file)), { recursive: true }); await writeFile(join(root, file), "import { test } from 'vitest'; test('case',()=>{});\n"); }
  await mkdir(join(root, 'src/tests'), { recursive: true });
  if (boundaries !== undefined) await writeFile(join(root, 'src/tests/test-boundaries.json'), JSON.stringify({ schema: 'ramify-agent.test-boundaries/1', boundaries }));
  return root;
}
const entry = (file: string) => ({ file, boundary: 'Native worker', whyFakeCannotProve: 'Actual worker', owningCases: ['case'] });

describe('boundary manifest validation', () => {
  test('a registered Node test is returned as a boundary path', async () => {
    const root = await project(['src/tests/native.test.ts', 'src/tests/ordinary.test.ts'], [entry('src/tests/native.test.ts')]);
    expect(await boundaryPaths(root, nodeDiscovery, webDiscovery)).toEqual(['src/tests/native.test.ts']);
  });
  test('fails configuration for a missing manifest', async () => {
    const root = await project(['src/tests/native.test.ts']);
    await expect(boundaryPaths(root, nodeDiscovery, webDiscovery)).rejects.toMatchObject({ code: 'ENOENT' });
  });
  test.each([
    ['a missing file', ['src/tests/native.test.ts'], [entry('src/tests/absent.test.ts')], /ENOENT/],
    ['a duplicate path', ['src/tests/native.test.ts'], [entry('src/tests/native.test.ts'), entry('src/tests/native.test.ts')], /Duplicate test boundary registration/],
    ['a path that is not in normal form', ['src/tests/native.test.ts'], [entry('src/tests/./native.test.ts')], /Invalid exact test boundary registration/],
    // An escaping path is in normal form; it fails only because no such file exists.
    ['a path outside the root', ['src/tests/native.test.ts'], [entry('../escape.test.ts')], /ENOENT/],
    ['an entry with no owning case', ['src/tests/native.test.ts'], [{ ...entry('src/tests/native.test.ts'), owningCases: [] }], /Invalid exact test boundary registration/],
    ['an excluded fixture', ['subs/harness/fixtures/example/src/tests/excluded.test.ts'], [entry('subs/harness/fixtures/example/src/tests/excluded.test.ts')], /outside configured Node discovery/],
    ['an excluded scratch file', ['src/tmp/excluded.test.ts'], [entry('src/tmp/excluded.test.ts')], /outside configured Node discovery/],
    ['a web boundary', ['subs/web/src/native.test.ts'], [entry('subs/web/src/native.test.ts')], /outside configured Node discovery/],
  ])('fails configuration for %s', async (_defect, files, boundaries, message) => {
    const root = await project(files, boundaries);
    await expect(boundaryPaths(root, nodeDiscovery, webDiscovery)).rejects.toThrow(message);
  });
});
