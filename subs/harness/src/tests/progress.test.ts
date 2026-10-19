import { finalCandidate } from '../../subs/autonomous/subs/acceptance/src/tests/helpers/final-candidate.js';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { SessionSpec } from '../../subs/agent/src/interfaces/port.js';
import { analysisLayout, hypothesisSchema } from '../../subs/autonomous/subs/planning/src/records.js';
import { RunQueries } from '../../subs/projections/src/queries.js';
import { createQuerySource } from '../http/query-source.js';
import { workLayout } from '../../subs/autonomous/subs/work-coordination/src/work/records.js';
import { copyFixture } from './helpers/fixture.js';
import { expectNoProcesses, forgetExternalTools, openRunsWithoutProcesses } from './helpers/external-tools.js';
import { analysis, entry, hypothesis, requestCompletion } from './helpers/analysis.js';
import { reviews } from './helpers/constructed.js';
import { installTestRunner, runPath, startRun } from './helpers/runs.js';
import { scenariosCommit, scriptedGit } from './helpers/scripted-git.js';
/*
 * Hypothesis, decision, work and progress records stay visibly distinct: each
 * kind has its own directory, a hypothesis has no reference to a work item,
 * and progress is a projection that appends nothing.
 *
 * M2: todo, working on and completed handle provider waits, verified reuse,
 * reopened evidence and superseded hypotheses correctly.
 */

vi.mock('node:child_process', async original =>
  (await import('./helpers/process-guard.js')).guardedChildProcess(await original<typeof import('node:child_process')>()));

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) await cleanup();
  try { expectNoProcesses(); } finally { forgetExternalTools(); }
});

const root = 'collection-review';

describe('over a real run', () => {
  test('the record kinds are distinct directories, and the projection appends nothing', async () => {
    const fixture = await copyFixture();
    cleanups.push(fixture.remove);
    await installTestRunner(fixture.root);
    const submitted = analysis(
      [entry('reviewer-note', reviews), entry('note-in-panel', root)],
      [hypothesis('note-storage', { involvedModules: [reviews] })],
    );
    const git = scriptedGit(fixture.root, { previews: finalCandidate(fixture.root, 'scenarios-of-review-notes').previews, head: 'progress-base', checkpoints: [
      scenariosCommit('review-notes'),
      { subject: 'wi-001', commit: null, changes: [] },
      { subject: 'wi-002', commit: null, changes: [] },
      { subject: 'final verification of plan "review-notes"', commit: null, changes: [] },
    ] });
    const { service } = await openRunsWithoutProcesses(fixture.root, git, {
      candidates: finalCandidate(fixture.root, 'scenarios-of-review-notes').candidates,
      script: (spec: SessionSpec) => spec.role === 'catalog-extractor' ? []
        : [{ kind: 'submit' as const, input: spec.role === 'initial-architect' ? submitted : requestCompletion() }],
    });
    cleanups.push(() => service.close());
    const receipt = await service.execute(startRun('review-notes'));
    await service.settled('review-notes', receipt.jobId);
    git.assertComplete();

    const directory = runPath(fixture.root, 'review-notes', receipt.jobId);
    // Each kind of record is in its own directory, with no other kind in it.
    expect((await readdir(directory)).sort()).toEqual(expect.arrayContaining(['analysis', 'gates', 'hypotheses', 'invocations', 'registry', 'work-items']));
    expect(await readdir(join(directory, 'hypotheses'))).toEqual(['note-storage']);
    expect((await readdir(join(directory, 'registry'))).sort()).toEqual(['note-in-panel', 'reviewer-note']);
    expect((await readdir(join(directory, 'work-items'))).sort()).toEqual(['wi-001', 'wi-002']);
    expect((await readdir(join(directory, 'work-items', 'wi-001'))).sort()).toEqual(['item.json', 'outline']);

    // The `Hypothesis` type has no reference to a work item: no committed
    // hypothesis carries one, and the schema refuses one.
    const body = JSON.parse(await readFile(join(directory, analysisLayout.hypothesis('note-storage', 1)), 'utf8')) as Record<string, unknown>;
    expect(Object.keys(body)).not.toContain('workItem');
    expect(hypothesisSchema.safeParse({ ...body, workItem: 'wi-001' }).success).toBe(false);
    expect(JSON.stringify(body)).not.toContain('wi-00');

    // The projection is a pure function of the log and its records: asked
    // twice it answers the same thing, and the run's files are what they
    // were before it was asked.
    const before = await inventory(directory);
    const gitOperations = git.operations();
    const queries = new RunQueries(createQuerySource(service));
    const first = (await queries.capabilities('review-notes', receipt.jobId)).capabilities;
    const second = (await queries.capabilities('review-notes', receipt.jobId)).capabilities;
    expect(second).toEqual(first);
    expect(await inventory(directory)).toEqual(before);
    expect(git.operations()).toEqual(gitOperations);

    expect(first.map(row => [row.capability, row.owner, row.state, row.tentative, row.workItems])).toEqual([
      ['reviewer-note', reviews, 'completed', false, ['wi-001']],
      ['note-in-panel', root, 'completed', false, ['wi-002']],
      ['note-storage', root, 'todo', true, []],
    ]);
    for (const row of first.slice(0, 2)) expect(row.evidence).toEqual([expect.stringMatching(/^ga-\d{4}$/)]);
    // The outline records the delivery; nothing derives work from it.
    expect((await readdir(join(directory, workLayout.directory('wi-001'), 'outline'))).sort()).toEqual(['1.json']);
  }, 300_000);
});

/** Every file beneath the run, with its size and modification time. */
async function inventory(directory: string): Promise<Array<[string, number, number]>> {
  const found: Array<[string, number, number]> = [];
  const walk = async (current: string): Promise<void> => {
    for (const child of await readdir(current, { withFileTypes: true })) {
      const path = join(current, child.name);
      if (child.isDirectory()) await walk(path);
      else {
        const info = await stat(path);
        found.push([path.slice(directory.length), info.size, info.mtimeMs]);
      }
    }
  };
  await walk(directory);
  return found.sort();
}
