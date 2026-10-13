import { afterEach, expect, test, vi } from 'vitest';
import { commonDirectory } from '../git.js';
import { runCommand, type CommandRun } from '../run-command.js';

vi.mock('../run-command.js', async importOriginal => ({
  ...await importOriginal<typeof import('../run-command.js')>(),
  runCommand: vi.fn(),
}));
afterEach(() => vi.clearAllMocks());
function reply(stdout: string, exitCode = 0): CommandRun {
  return { outcome: { kind: 'completed', exitCode }, startedAt: '2026-10-13T00:00:00.000Z', elapsedMs: 1,
    stdout, stderr: exitCode === 0 ? '' : 'not a repository',
    output: { path: null, tail: stdout, bytes: Buffer.byteLength(stdout), truncated: false } };
}

test('uses the shared Git directory supplied for a linked worktree', async () => {
  vi.mocked(runCommand).mockResolvedValueOnce(reply('/projects/main/.git\n'));
  expect(await commonDirectory('/projects/worktrees/feature')).toBe('/projects/main/.git');
  expect(runCommand).toHaveBeenCalledWith(expect.objectContaining({
    argv: ['git', 'rev-parse', '--path-format=absolute', '--git-common-dir'], cwd: '/projects/worktrees/feature',
  }));
});

test('does not guess a tracker root when Git fails or returns an ambiguous location', async () => {
  vi.mocked(runCommand).mockResolvedValueOnce(reply('', 128));
  await expect(commonDirectory('/not-a-repository')).rejects.toThrow();
  vi.mocked(runCommand).mockResolvedValueOnce(reply('.git\n'));
  await expect(commonDirectory('/project')).rejects.toThrow('one absolute common directory');
  vi.mocked(runCommand).mockResolvedValueOnce(reply('/one/.git\n/two/.git\n'));
  await expect(commonDirectory('/project')).rejects.toThrow('one absolute common directory');
});
