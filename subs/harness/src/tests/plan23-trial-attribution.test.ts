import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { engineerWorkingDirectory } from '../../subs/autonomous/src/work/engineer-directory.js';
import type { WriteScope } from '../work/scope.js';
import { fixtureScratchGit, mockGit } from './helpers/mock-git.js';
import { expect, it } from 'vitest';

// Pure setup identity assertions live with the KPI child; execution cwd stays here.

it('trial writes resolve against actual assigned module src cwd while scope stays project-relative', async () => {
  const root = await mkdtemp(join(tmpdir(), 'ramify-plan23-trial-cwd-'));
  try {
    const directory = 'subs/workspace/subs/shared-ui'; const owner = 'collection-review/workspace/shared-ui';
    await mkdir(join(root, directory, 'src'), { recursive: true });
    const scope = { base: { module: owner, included: [] }, extra: [], read: [], bootstrap: [], rationale: 'independent fixed trial', revision: 1, resolved: { roots: [join(root, directory)], files: [], included: [], excluded: [], view: { status: 'placeholder' }, ownership: { provider: 'ramify.affected-cli/4', ramifyVersion: 'scripted', inputId: 'fixed', configuration: 'tsconfig.json', root, modules: [{ id: owner, parent: 'collection-review/workspace', directory }], exclusions: [] } } } as WriteScope;
    const index = { revision: 'fixed', input: 'fixed', symbols: new Map(), modules: new Map([[owner, { module: owner, dir: directory, parent: 'collection-review/workspace', children: [], tags: [], areas: ['src'] }]]) };
    const cwd = await engineerWorkingDirectory(root, scope, index, fixtureScratchGit(mockGit()));
    expect(cwd).toBe(join(root, directory, 'src'));
    await writeFile(join(cwd, 'status.ts'), 'export const status = "ready";\n');
    expect(await readFile(join(root, directory, 'src/status.ts'), 'utf8')).toBe('export const status = "ready";\n');
    await expect(stat(join(cwd, directory, 'src/status.ts'))).rejects.toMatchObject({ code: 'ENOENT' });
    expect(scope.base).toEqual({ module: 'collection-review/workspace/shared-ui', included: [] });
    expect(scope.resolved.ownership.modules[0]?.directory).toBe('subs/workspace/subs/shared-ui');
  } finally { await rm(root, { recursive: true, force: true }); }
});
