import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { childEnvironment, runCommand, type CommandRunner, type CommandRun } from './run-command.js';

/** Run ordinary inspection in a disposable detached checkout of the intended commit.
 * This is instruction-based review access, not a shell sandbox. Each call starts
 * from the candidate again; writes must not be used to implement repairs.
 */
export async function inspectCandidate(input: {
  readonly projectRoot: string; readonly candidate: string; readonly command: string;
  readonly timeoutMs?: number; readonly signal?: AbortSignal; readonly runner?: CommandRunner;
}): Promise<CommandRun> {
  const runner = input.runner ?? runCommand;
  const env = childEnvironment();
  const parent = await mkdtemp(join(tmpdir(), 'ramify-review-'));
  const checkout = join(parent, 'candidate');
  const git = async (args: string[], signal?: AbortSignal) => {
    const result = await runner({ argv: ['git', '-c', 'core.hooksPath=/dev/null', ...args], cwd: input.projectRoot, env,
      timeoutMs: 120_000, ...(signal ? { signal } : {}) });
    if (result.outcome.kind !== 'completed' || result.outcome.exitCode !== 0) throw new Error(`Candidate checkout failed: ${result.stderr || result.output.tail || JSON.stringify(result.outcome)}`);
    return result;
  };
  let acquired = false;
  try {
    const prefix = (await git(['rev-parse', '--show-prefix'], input.signal)).stdout.trim();
    await git(['worktree', 'add', '--detach', checkout, input.candidate], input.signal);
    acquired = true;
    return await runner({ argv: ['bash', '-lc', input.command], cwd: join(checkout, prefix), env,
      timeoutMs: input.timeoutMs ?? 120_000, maxBytes: 128 * 1024, ...(input.signal ? { signal: input.signal } : {}) });
  } finally {
    // Cancellation never withholds cleanup from a checkout this operation owns.
    try { if (acquired) await git(['worktree', 'remove', '--force', checkout]); }
    finally { await rm(parent, { recursive: true, force: true }); }
  }
}
