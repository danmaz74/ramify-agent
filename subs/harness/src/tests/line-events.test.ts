import { scenariosCommit, scriptedGit } from './helpers/scripted-git.js';
import { finalCandidate } from './helpers/final-candidate.js';
import { expectNoProcesses, forgetExternalTools } from './helpers/external-tools.js';
import type { LineChange } from '../../subs/kpi/src/lines.js';
import { readFile } from 'node:fs/promises';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { runLayout, type LineEventSummary } from '../../subs/autonomous/src/run/records.js';
import { copyFixture } from './helpers/fixture.js';
import { analysis, entry, requestCompletion } from './helpers/analysis.js';
import { addModule, assign, byRole, completionProposed, edit, installMiniRunner, outline, submit, treeInputs, write } from './helpers/iterations.js';
import { onlyRun, openRuns, runEventsOnDisk, runPath, startRun } from './helpers/runs.js';

vi.mock('node:child_process', async original =>
  (await import('./helpers/process-guard.js')).guardedChildProcess(await original<typeof import('node:child_process')>()));
const lines = (path: string, added: number, deleted = 0): LineChange => ({ path, added, deleted, binary: false, bytes: null });
const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
  try { expectNoProcesses(); } finally { forgetExternalTools(); }
});
const notes = 'collection-review/workspace/reviews/notes';
const notesDirectory = 'subs/workspace/subs/reviews/subs/notes';
const noteTest = [
  'import { test, expect } from \'vitest\';',
  'import { noteLimit } from \'../notes.ts\';',
  '',
  'test(\'the limit is the one the plan asks for\', () => { expect(noteLimit).toBe(500); });',
  '',
].join('\n');
async function target() {
  const fixture = await copyFixture();
  cleanups.push(fixture.remove);
  await addModule(fixture.root, notesDirectory, 'notes', {
    'src/notes.ts': 'export const noteLimit = 400;\n',
    'src/tests/notes.test.ts': noteTest,
  });
  await installMiniRunner(fixture.root);
  return fixture.root;
}

describe('a run captures each writer\'s line events when the observation happens', () => {
  test('the summary beside the invocation names what that invocation wrote', async () => {
    const root = await target();
    const final = finalCandidate(root, 'source-revision');
    const git = scriptedGit(root, { head: 'base', checkpoints: [
      scenariosCommit('review-notes'),
      { subject: 'wi-001.i01', commit: 'source-revision', changes: [
        { status: 'M', path: `${notesDirectory}/src/notes.ts` }, { status: 'A', path: `${notesDirectory}/src/store.ts` },
      ] },
      { subject: 'wi-001', commit: null, changes: [] },
      { subject: 'final verification of plan "review-notes"', commit: null, changes: [] },
    ], previews: final.previews });
    const counts = vi.spyOn(git, 'worktreeLineChanges')
      .mockResolvedValueOnce([]).mockResolvedValueOnce([
        lines(`${notesDirectory}/src/notes.ts`, 1, 1), lines(`${notesDirectory}/src/store.ts`, 1),
      ]);
    const { service } = await openRuns(root, {
      git, candidates: final.candidates,
      afterWrite: async write => { if (write === 'scenarios-materialized') git.givenWrites(); },
      script: byRole({
        'initial-architect': [submit(analysis([entry('review-note', notes)]))],
        'local-architect': [submit(assign(notes, {}, outline())), submit(requestCompletion())],
        engineer: [submit(
          completionProposed('Raised the limit and added the store.'),
          edit(`${notesDirectory}/src/notes.ts`, 'noteLimit = 400', 'noteLimit = 500'),
          write(`${notesDirectory}/src/store.ts`, 'export const store = new Map();\n'),
        )],
      }),
      inputs: treeInputs(),
    });
    cleanups.push(() => service.close());
    const receipt = await service.execute(startRun('review-notes'));
    await service.settled('review-notes', receipt.jobId);
    expect(onlyRun(service, 'review-notes').state).toBe('completed');
    const engineerStart = (await runEventsOnDisk(root, 'review-notes', receipt.jobId))
      .find(event => event.type === 'invocation-started' && event.data.role === 'engineer');
    if (engineerStart?.type !== 'invocation-started') throw new Error('Missing engineer invocation');
    const bytes = await readFile(runPath(root, 'review-notes', receipt.jobId,
      runLayout.lineEvents(engineerStart.data.invocation)), 'utf8');
    const summary = JSON.parse(bytes) as LineEventSummary;
    expect(bytes).toBe(`${JSON.stringify(summary, null, 2)}\n`);
    expect(summary.invocation).toBe(engineerStart.data.invocation);
    expect(summary.paths.map(path => path.path).sort()).toEqual([
      `${notesDirectory}/src/notes.ts`, `${notesDirectory}/src/store.ts`,
    ]);
    expect(summary.paths.every(path => path.owner === notes)).toBe(true);
    expect(counts.mock.calls).toEqual([[root, 'scenarios-of-review-notes'], [root, 'scenarios-of-review-notes']]);
    expect(summary.paths.map(path => [path.added, path.deleted])).toEqual([[1, 1], [1, 0]]);
    expect(summary).toEqual({
      schema: 'ramify-agent.line-events/1', invocation: engineerStart.data.invocation,
      paths: [
        { path: `${notesDirectory}/src/notes.ts`, owner: notes, added: 1, deleted: 1, binary: false, bytes: null },
        { path: `${notesDirectory}/src/store.ts`, owner: notes, added: 1, deleted: 0, binary: false, bytes: null },
      ], unmapped: { paths: 0, added: 0, deleted: 0 }, coverage: 'complete', gaps: [],
    });
    git.assertComplete();
  }, 300_000);
});
