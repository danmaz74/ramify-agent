import { describe, expect, test } from 'vitest';
import { parseProjectConfig, resolveBeadsProjectConfig } from '../run/project-config.js';

function configuration(beads?: unknown): string {
  return JSON.stringify({ schema: 'ramify-agent.project/1', ...(beads === undefined ? {} : { beads }) });
}

describe('optional target-project Beads configuration', () => {
  test('enables Beads administration only with an explicit tracker workspace, preserving absent and disabled configurations', () => {
    for (const beads of [false, { workspace: 'git-common-root' }, { workspace: { path: '/trackers/project' }, executable: '/tools/bd' }]) {
      const parsed = parseProjectConfig(configuration(beads));
      expect('config' in parsed && parsed.config.beads).toEqual(beads);
    }
    const historical = parseProjectConfig(configuration());
    expect('config' in historical && Object.hasOwn(historical.config, 'beads')).toBe(false);
  });

  test.each([
    [true, /beads: /],
    [{}, /beads/],
    [{ workspace: '.' }, /beads/],
    [{ workspace: { path: '' } }, /beads/],
    [{ workspace: 'git-common-root', enabled: true }, /beads/],
    [{ workspace: 'git-common-root', executable: '' }, /beads/],
  ])('rejects incomplete or unknown Beads configuration %j', (beads, message) => {
    const parsed = parseProjectConfig(configuration(beads));
    expect('invalid' in parsed ? parsed.invalid : '').toMatch(message);
  });
});

describe('the explicit Beads tracker destination', () => {
  test('resolves the common Git working tree consistently from distinct implementation worktrees', async () => {
    const roots = ['/project', '/worktrees/implementation'];
    const calls: string[] = [];
    const commonDirectory = async (root: string) => {
      calls.push(root);
      return '/project/.git';
    };
    for (const root of roots) {
      expect(await resolveBeadsProjectConfig(root, { workspace: 'git-common-root' }, commonDirectory))
        .toEqual({ trackerWorkspace: '/project', executable: 'bd' });
    }
    expect(calls).toEqual(roots);
  });

  test('resolves an explicit path and relative executable against the target root without consulting Git', async () => {
    const unusedGit = async () => { throw new Error('an explicit workspace never queries Git'); };
    expect(await resolveBeadsProjectConfig('/worktrees/implementation', {
      workspace: { path: '../../trackers/project' }, executable: './tools/bd',
    }, unusedGit)).toEqual({ trackerWorkspace: '/trackers/project', executable: '/worktrees/implementation/tools/bd' });
    expect(await resolveBeadsProjectConfig('/worktrees/implementation', {
      workspace: { path: '/trackers/project' }, executable: '/tools/bd',
    }, unusedGit)).toEqual({ trackerWorkspace: '/trackers/project', executable: '/tools/bd' });
  });

  test('refuses to guess a working tree for a bare or separately stored common Git directory', async () => {
    await expect(resolveBeadsProjectConfig('/worktrees/implementation', {
      workspace: 'git-common-root',
    }, async () => '/git/project.git')).rejects.toThrow(/configure beads\.workspace\.path explicitly/);
  });
});
