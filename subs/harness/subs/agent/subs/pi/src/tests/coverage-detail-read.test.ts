import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createReadTool } from '@earendil-works/pi-coding-agent';
import { expect, test } from 'vitest';
import { piBuiltinDeclarations } from '../session-operations.js';

test('the installed read tool opens a project-relative coverage record pointer from a module working directory', async () => {
  const projectRoot = await mkdtemp(join(tmpdir(), 'ramify-coverage-read-'));
  try {
    const workingDirectory = join(projectRoot, 'pkg/src');
    const pointer = '.ramify-architect/unusual/behavior.jsonl';
    const record = { file: 'pkg/src/status.ts', name: 'status', cut: ['sig', 'doc'],
      signature: 'export function status(): string', documentation: 'Current status.' };
    await mkdir(workingDirectory, { recursive: true });
    await mkdir(join(projectRoot, '.ramify-architect/unusual'), { recursive: true });
    await writeFile(join(projectRoot, pointer), `${JSON.stringify(record)}\n`);
    const declarations = piBuiltinDeclarations(['read'], workingDirectory);
    const read = createReadTool(workingDirectory);
    expect(declarations[0]?.name).toBe(read.name);
    // Coverage pointers explicitly use the supplied project root, not the module cwd.
    const result = await read.execute('coverage-detail', { path: resolve(projectRoot, pointer) });
    const text = result.content.filter(block => block.type === 'text').map(block => block.text).join('\n');
    expect(JSON.parse(text)).toEqual(record);
    expect(text).toContain('"cut":["sig","doc"]');
  } finally {
    await rm(projectRoot, { recursive: true, force: true });
  }
});
