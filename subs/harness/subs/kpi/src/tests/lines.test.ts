import { describe, expect, test } from 'vitest';
import { lineEvents, takeLineSnapshot, type LineChange } from '../lines.js';
import { mockGit } from '../../../../src/tests/helpers/mock-git.js';
import { architectIndex, moduleEntry } from '../../../../src/tests/helpers/views.js';

const notes = 'collection-review/workspace/reviews/notes';
const notesDirectory = 'subs/workspace/subs/reviews/subs/notes';
async function snapshot(changes: LineChange[] = []) {
  const git = mockGit({ worktreeLineChanges: async () => changes });
  const result = await takeLineSnapshot('/scenario', 'accepted', git);
  expect(git.worktreeLineChanges).toHaveBeenCalledWith('/scenario', 'accepted');
  expect(git.unexpected).toEqual([]);
  return result;
}
const lines = (path: string, added: number, deleted = 0): LineChange => ({ path, added, deleted, binary: false, bytes: null });

describe('what one writer invocation changed', () => {
  test('the two snapshots around a session give its own lines, and the view gives each path its owner', async () => {
    const index = architectIndex([
      moduleEntry('collection-review', '', null),
      moduleEntry(notes, notesDirectory, 'collection-review'),
    ]);
    const before = await snapshot();
    const after = await snapshot([lines(`${notesDirectory}/src/notes.ts`, 1, 1), lines(`${notesDirectory}/src/store.ts`, 2)]);
    const summary = lineEvents({ invocation: 'inv-0003', before, after, index });
    expect(summary.coverage).toBe('complete');
    expect(summary.gaps).toEqual([]);
    expect(summary.paths).toEqual([
      { path: `${notesDirectory}/src/notes.ts`, owner: notes, added: 1, deleted: 1, binary: false, bytes: null },
      { path: `${notesDirectory}/src/store.ts`, owner: notes, added: 2, deleted: 0, binary: false, bytes: null },
    ]);
    expect(summary.unmapped).toEqual({ paths: 0, added: 0, deleted: 0 });
    const third = await snapshot([lines(`${notesDirectory}/src/notes.ts`, 1, 1), lines(`${notesDirectory}/src/store.ts`, 2)]);
    const fourth = await snapshot([lines(`${notesDirectory}/src/notes.ts`, 1, 1), lines(`${notesDirectory}/src/store.ts`, 3)]);
    const second = lineEvents({ invocation: 'inv-0004', before: third, after: fourth, index });
    expect(second.paths).toEqual([{ path: `${notesDirectory}/src/store.ts`, owner: notes, added: 1, deleted: 0, binary: false, bytes: null }]);
  });
  test('a session that changed nothing has an empty summary; a path with no owner is counted as unmapped', async () => {
    const index = architectIndex([moduleEntry(notes, notesDirectory, null)]);
    const before = await snapshot();
    const unchanged = lineEvents({ invocation: 'inv-0005', before, after: await snapshot(), index });
    expect(unchanged.paths).toEqual([]);
    expect(unchanged.coverage).toBe('complete');
    const summary = lineEvents({ invocation: 'inv-0006', before, after: await snapshot([lines('src/loose.ts', 1)]), index });
    expect(summary.paths).toEqual([{ path: 'src/loose.ts', owner: null, added: 1, deleted: 0, binary: false, bytes: null }]);
    expect(summary.unmapped).toEqual({ paths: 1, added: 1, deleted: 0 });
  });
  test('a snapshot that could not be taken is a coverage gap, never a zero', async () => {
    const git = mockGit({ worktreeLineChanges: async () => { throw new Error('the directory is no repository'); } });
    const unavailable = await takeLineSnapshot('/scenario', 'accepted', git);
    expect(unavailable).toEqual({ available: false, reason: 'the directory is no repository' });
    const summary = lineEvents({ invocation: 'inv-0007', before: unavailable, after: unavailable, index: null });
    expect(summary.coverage).toBe('partial');
    expect(summary.gaps).toHaveLength(3);
    expect(summary.paths).toEqual([]);
  });
  test('a path no module\'s contents hold is unmapped, and is never attributed to the root', async () => {
    const index = architectIndex([moduleEntry('collection-review', '', null), moduleEntry(notes, notesDirectory, 'collection-review')]);
    const summary = lineEvents({ invocation: 'inv-0008', before: await snapshot(), after: await snapshot([
      lines('docs/decision.md', 3), lines('notes.txt', 2), lines('src/added.ts', 1),
    ]), index });
    expect(summary.paths.map(path => [path.path, path.owner])).toEqual([
      ['docs/decision.md', null], ['notes.txt', null], ['src/added.ts', 'collection-review'],
    ]);
    expect(summary.unmapped).toEqual({ paths: 2, added: 5, deleted: 0 });
  });
  test('a binary file carries its byte count and no invented line count', async () => {
    const index = architectIndex([moduleEntry(notes, notesDirectory, null)]);
    const summary = lineEvents({ invocation: 'inv-0009', before: await snapshot(), after: await snapshot([
      { path: `${notesDirectory}/src/logo.bin`, added: 0, deleted: 0, binary: true, bytes: 6 },
    ]), index });
    expect(summary.paths).toEqual([
      { path: `${notesDirectory}/src/logo.bin`, owner: notes, added: 0, deleted: 0, binary: true, bytes: 6 },
    ]);
    expect(summary.coverage).toBe('complete');
  });
  test('a change made and put back between the snapshots delivered nothing, and the count stays complete', async () => {
    const index = architectIndex([moduleEntry(notes, notesDirectory, null)]);
    const summary = lineEvents({ invocation: 'inv-0010', before: await snapshot(), after: await snapshot(), index });
    expect(summary.paths).toEqual([]);
    expect(summary.coverage).toBe('complete');
    expect(summary.gaps).toEqual([]);
  });
  test('binary byte changes and overlapping writers retain sorted partial contributions', async () => {
    const binary = (bytes: number): LineChange => ({ path: 'src/z.bin', binary: true, bytes, added: 0, deleted: 0 });
    const index = architectIndex([moduleEntry('root', '', null)]);
    const before = await snapshot([binary(4), lines('src/a.ts', 5, 3)]);
    const after = await snapshot([binary(6), lines('src/a.ts', 4, 5)]);
    const summary = lineEvents({ invocation: 'one', before, after, index, overlappingWriters: ['one', 'two'] });
    expect(summary.paths).toEqual([
      { path: 'src/a.ts', owner: 'root', added: 0, deleted: 2, binary: false, bytes: null },
      { path: 'src/z.bin', owner: 'root', added: 0, deleted: 0, binary: true, bytes: 6 },
    ]);
    expect(summary.coverage).toBe('partial');
    expect(summary.gaps).toEqual(['overlapping-writers: one, two; per-invocation contributions cannot be separated']);
    expect(lineEvents({ invocation: 'one', before: after, after, index }).paths).toEqual([]);
  });
});
