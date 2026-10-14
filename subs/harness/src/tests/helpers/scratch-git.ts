import assert from 'node:assert/strict';
import type { GitService, IgnoreStatus } from '../../../subs/evidence/src/git.js';

/** Successive answers for scratch Git operations; no answer is inferred from disk. */
export interface ScratchGitScript {
  readonly trackedPaths?: readonly (readonly string[])[] | undefined;
  readonly ignoreStatus?: readonly (readonly IgnoreStatus[])[] | undefined;
}

export function fixtureScratchGit<T extends GitService>(git: T): T {
  return new Proxy(git, {
    get(target, property, receiver) {
      if (property === 'trackedPaths') return async (_project: string, _directories: readonly string[]) => [];
      if (property === 'ignoreStatus') return async (_project: string, paths: readonly string[]): Promise<IgnoreStatus[]> =>
        paths.map(path => ({ path, ignored: true, rule: { source: '.gitignore', line: 1, pattern: '**/src/tmp/' } }));
      return Reflect.get(target, property, receiver);
    },
  });
}

export function scriptedScratchGit(root: string, script: ScratchGitScript | undefined): {
  readonly answers: Partial<GitService>;
  assertComplete(): void;
} {
  let tracked = 0, ignored = 0;
  const answers: Partial<GitService> = {
    ...(script?.trackedPaths === undefined ? {} : { async trackedPaths(project: string, _directories: readonly string[]) {
      assert.equal(project, root);
      const answer = script.trackedPaths?.[tracked++];
      assert.notEqual(answer, undefined, 'no additional tracked-path answer was scripted');
      return [...answer!];
    } }),
    ...(script?.ignoreStatus === undefined ? {} : { async ignoreStatus(project: string, paths: readonly string[]) {
      assert.equal(project, root);
      const answer = script.ignoreStatus?.[ignored++];
      assert.notEqual(answer, undefined, 'no additional ignore-status answer was scripted');
      assert.deepEqual(answer!.map(status => status.path), paths);
      return [...answer!];
    } }),
  };
  return { answers, assertComplete() {
    assert.equal(tracked, script?.trackedPaths?.length ?? 0, 'tracked-path answers consumed');
    assert.equal(ignored, script?.ignoreStatus?.length ?? 0, 'ignore-status answers consumed');
  } };
}
