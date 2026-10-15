import assert from 'node:assert/strict';
import type { GitService } from '../../../subs/evidence/src/git.js';
import type { CandidateTreePreview } from '../../../subs/evidence/src/candidate-tree.js';
import { scriptedScratchGit, type ScratchGitScript } from './scratch-git.js';

export interface GitCheckpoint {
  readonly subject: string;
  /** Explicit gate identity when an earlier refused gate made no commit. */
  readonly gate?: string;
  readonly commit: string | null;
  readonly changes: ReadonlyArray<{ status: string; path: string }>;
}

/**
 * The commit that writes a run's feature files onto its branch, "Scenarios
 * of <planId>". Agents that change no source still leave the tree changed
 * by it, so it answers a revision: every file it adds is new.
 */
export function scenariosCommit(planId: string, commit = `scenarios-of-${planId}`, files: readonly string[] = []): GitCheckpoint {
  return { subject: `Scenarios of ${planId}`, commit, changes: files.map(path => ({ status: 'A', path })) };
}

/** Canned external responses for a scenario, including unchanged checkpoints. */
export interface GitScript {
  readonly commonDirectory?: string;
  readonly scratch?: ScratchGitScript | undefined;
  /** Explicit working-tree change the harness setup will commit after readiness. */
  readonly setupChanges?: GitCheckpoint['changes'] | undefined;
  /** Exact answers to interrupted scratch-setup commit lookups. */
  readonly recoveredScratch?: readonly (string | null)[] | undefined;
  readonly head: string;
  readonly checkpoints: readonly GitCheckpoint[];
  /** Exact ordered tree previews, never inferred from checkpoint commits. */
  readonly previews?: readonly CandidateTreePreview[] | undefined;
  /** The working tree's patch against the head, where the scenario states one; otherwise Git cannot say. */
  readonly patch?: string | undefined;
}

export interface ScriptedGit extends GitService {
  /** Select the next checkpoint's declared changes when its scripted writer runs. */
  givenWrites(): void;
  assertComplete(): void;
  head(): string;
  commits(): ReadonlyArray<{ readonly id: string; readonly message: string }>;
  branch(): string | null;
  operations(): Record<string, number>;
}

/**
 * A response script, not a repository. All changes and commit results come
 * from fixture data. No disk reads, diffing, hashing, history or Git rules.
 */
export function scriptedGit(root: string, script: GitScript): ScriptedGit {
  const scratch = scriptedScratchGit(root, script.scratch);
  let index = 0;
  let previewIndex = 0;
  // Gate attempts after readiness's `ga-0001`; the scenarios commit is no gate's.
  let gates = 0;
  let scratchLookups = 0;
  let head = script.head;
  let branch: string | null = null;
  let pending: GitCheckpoint['changes'] = script.setupChanges ?? [];
  let last = { from: head, to: head, changes: pending };
  const made: Array<{ id: string; message: string }> = [];
  const calls: Record<string, number> = {};
  const failures: string[] = [];
  function check(operation: string, project: string, assertion?: () => void): void {
    calls[operation] = (calls[operation] ?? 0) + 1;
    try { assert.equal(project, root); assertion?.(); }
    catch (error) { failures.push(String(error)); throw error; }
  }
  function unsupported(operation: string): never {
    failures.push(`Unscripted Git operation: ${operation}`);
    throw new Error(failures.at(-1));
  }
  return {
    async commonDirectory(project) {
      check('commonDirectory', project);
      return script.commonDirectory ?? unsupported('commonDirectory');
    },
    async trackedPaths(project, directories) {
      check('trackedPaths', project);
      const answer = scratch.answers.trackedPaths;
      if (answer === undefined) return unsupported('trackedPaths');
      return answer(project, directories);
    },
    async ignoreStatus(project, paths) {
      check('ignoreStatus', project);
      const answer = scratch.answers.ignoreStatus;
      if (answer === undefined) return unsupported('ignoreStatus');
      return answer(project, paths);
    },
    async previewCandidateTree(project) {
      const answer = script.previews?.[previewIndex];
      check('previewCandidateTree', project, () => {
        assert.notEqual(answer, undefined, 'no additional tree preview was scripted');
        assert.equal(answer!.repositoryRoot, root);
        assert.equal(answer!.head, head);
      });
      previewIndex += 1;
      return answer!;
    },
    async currentHead(project) { check('currentHead', project); return head; },
    async isCleanRepository(project) { check('isCleanRepository', project); return true; },
    async createRunBranch(project, runId) {
      check('createRunBranch', project);
      branch = `ramify-agent-run/${runId}`;
      return { branch, created: true };
    },
    async commitAccepted(project, message) {
      const step = script.checkpoints[index];
      check('commitAccepted', project, () => {
        assert.notEqual(step, undefined, 'no additional commit call was scripted');
        const title = message.split('\n')[0]!;
        assert.equal(title === step!.subject || title.startsWith(`${step!.subject}:`), true, `expected checkpoint ${step!.subject}, got ${title}`);
      });
      index += 1;
      if (!message.includes('\nRamify-Scenarios: ') && !message.includes('\nRamify-Scratch: ')) gates += 1;
      last = { from: head, to: step!.commit ?? head, changes: step!.changes };
      if (step!.commit !== null) { head = step!.commit; made.push({ id: head, message }); }
      pending = [];
      return step!.commit;
    },
    async findCommitByTrailers(project, trailers) {
      if (trailers[1]?.key === 'Ramify-Scratch') {
        check('findCommitByTrailers', project, () => {
          assert.deepEqual(trailers, [
            { key: 'Ramify-Run', value: branch?.slice('ramify-agent-run/'.length) },
            { key: 'Ramify-Scratch', value: 'setup' },
          ]);
        });
        const answer = script.recoveredScratch?.[scratchLookups++];
        if (answer === undefined) return unsupported('scratch setup lookup');
        return answer;
      }
      check('findCommitByTrailers', project, () => {
        assert.deepEqual(trailers.map(trailer => trailer.key), ['Ramify-Run', 'Ramify-Gate']);
        assert.equal(trailers[0]!.value, branch?.slice('ramify-agent-run/'.length));
        assert.equal(trailers[1]!.value, script.checkpoints[index]?.gate ?? `ga-${String(gates + 2).padStart(4, '0')}`);
      });
      return null; // This scenario has no recovered attempt.
    },
    async changedPaths(project, base = 'HEAD') {
      check('changedPaths', project, () => assert.equal(base, head));
      return pending.map(change => change.path);
    },
    async changedEntries(project, base = 'HEAD') {
      check('changedEntries', project, () => assert.equal(base, head));
      return [...pending];
    },
    async diffNameStatus(project, from, to) {
      check('diffNameStatus', project, () => assert.deepEqual([from, to], [last.from, last.to]));
      return [...last.changes];
    },
    async worktreeLineChanges(project, base = 'HEAD') {
      check('worktreeLineChanges', project, () => assert.equal(base, head));
      throw new Error('Line measurements are unavailable in this lifecycle scenario');
    },
    async worktreePatch(project, base = 'HEAD') {
      check('worktreePatch', project, () => assert.equal(base, head));
      if (script.patch === undefined) throw new Error('The working tree\'s patch is unavailable in this lifecycle scenario');
      return script.patch;
    },
    async findCommitByTrailer() { return unsupported('findCommitByTrailer'); },
    async diffNumstat() { return unsupported('diffNumstat'); },
    async commitNameStatus() { return unsupported('commitNameStatus'); },
    givenWrites() { pending = script.checkpoints[index]!.changes; },
    assertComplete() {
      scratch.assertComplete();
      assert.deepEqual(failures, []);
      assert.equal(index, script.checkpoints.length);
      assert.equal(previewIndex, script.previews?.length ?? 0);
      assert.equal(scratchLookups, script.recoveredScratch?.length ?? 0);
    },
    head: () => head,
    commits: () => made,
    branch: () => branch,
    operations: () => ({ ...calls }),
  };
}
