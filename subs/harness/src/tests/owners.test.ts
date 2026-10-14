import { sep } from 'node:path';
import { describe, expect, test } from 'vitest';
import { ownerOf } from '../measurement/owners.js';
import { architectIndex, moduleEntry } from './helpers/views.js';

const notes = 'collection-review/workspace/reviews/notes';
const notesDirectory = 'subs/workspace/subs/reviews/subs/notes';
describe('general path ownership', () => {
  test('the owner of a path is the module whose own contents hold it', () => {
    const index = architectIndex([
      moduleEntry('collection-review', '', null),
      moduleEntry('collection-review/workspace', 'subs/workspace', 'collection-review'),
      moduleEntry(notes, notesDirectory, 'collection-review/workspace'),
    ]);
    expect(ownerOf(index, `${notesDirectory}/src/notes.ts`)).toBe(notes);
    expect(ownerOf(index, 'subs/workspace/src/app.tsx')).toBe('collection-review/workspace');
    expect(ownerOf(index, 'src/main.ts')).toBe('collection-review');
    expect(ownerOf(index, `${notesDirectory}/module.ramify`)).toBe(notes);
    expect(ownerOf(index, `${notesDirectory}/README.md`)).toBe(notes);
    expect(ownerOf(index, 'package.json')).toBeNull();
    expect(ownerOf(index, 'docs/decision.md')).toBeNull();
    expect(ownerOf(index, `${notesDirectory}/docs/note.md`)).toBeNull();
    expect(ownerOf(null, 'src/main.ts')).toBeNull();
  });
  test('deepest matching area wins independent of order and native separators', () => {
    const child = moduleEntry('root/deep', ['src', 'nested'].join(sep), 'root', { areas: ['lib'] });
    const root = moduleEntry('root', '', null);
    for (const entries of [[child, root], [root, child]]) {
      const index = architectIndex(entries);
      expect(ownerOf(index, ['src', 'nested', 'lib', 'code.ts'].join(sep))).toBe('root/deep');
      expect(ownerOf(index, 'src/nested/lib')).toBe('root/deep');
      expect(ownerOf(index, 'src/nested/library/code.ts')).toBe('root');
    }
    const index = architectIndex([moduleEntry('trailing', `subs${sep}trailing${sep}`, null, { areas: ['lib'] })]);
    expect(ownerOf(index, ['subs', 'trailing', 'lib', 'code.ts'].join(sep))).toBe('trailing');
    expect(ownerOf(index, 'subs/trailing/README.md/extra')).toBeNull();
  });
});
