import { afterEach, expect, test } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { runCommand, childEnvironment } from '../../../evidence/src/run-command.js';
import { candidateShell } from '../inspection.js';

const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });

test('shell inspects the pinned candidate and compressed evidence from a nested project while preserving the working checkout', async () => {
  const root = await mkdtemp(join(tmpdir(), 'candidate-inspection-test-')); roots.push(root);
  const project = join(root, 'project'); await mkdir(project);
  const git = async (...args: string[]) => {
    const result = await runCommand({ argv: ['git', ...args], cwd: root, env: childEnvironment(), timeoutMs: 120_000 });
    expect(result.outcome, result.stderr).toEqual({ kind: 'completed', exitCode: 0 }); return result.stdout.trim();
  };
  await git('init', '-q');
  await writeFile(join(project, 'feature.txt'), 'candidate source\n');
  await writeFile(join(project, 'evidence.gz'), gzipSync('compressed candidate evidence\n'));
  await git('add', '.');
  await git('-c', 'user.name=Candidate Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'candidate');
  const candidate = await git('rev-parse', 'HEAD');
  await writeFile(join(project, 'feature.txt'), 'later working source\n');
  const before = await git('status', '--porcelain=v1');
  const tool = candidateShell(project, candidate);
  const result = await tool.execute({ command: 'cat feature.txt; gzip -dc evidence.gz; git rev-parse HEAD' }, new AbortController().signal);
  expect(result.isError, result.text).toBe(false);
  expect(result.text).toContain(`candidate source\ncompressed candidate evidence\n${candidate}`);
  expect(result.text).not.toContain('later working source');
  expect(await readFile(join(project, 'feature.txt'), 'utf8')).toBe('later working source\n');
  expect(await git('status', '--porcelain=v1')).toBe(before);
  expect((await git('worktree', 'list', '--porcelain')).match(/^worktree /gmu)).toHaveLength(1);
  expect(await tool.execute({ command: 'exit 7' }, new AbortController().signal)).toMatchObject({ isError: true, text: expect.stringContaining('"exitCode":7') });
  expect((await git('worktree', 'list', '--porcelain')).match(/^worktree /gmu)).toHaveLength(1);
});
