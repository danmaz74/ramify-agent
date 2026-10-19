import { expect, test } from 'vitest';
import { guidancePaths } from '../inputs.js';
import type { CandidateSnapshot } from '../snapshot.js';
import { validateOrientation } from '../submission.js';

test('design guidance uses selected document starting points and affected-owner context without global principles inclusion', () => {
  const paths = ['global.principles.md', 'docs/selected.spec.md', 'README.md', 'subs/owner/README.md', 'subs/other/README.md', 'subs/owner/src/change.ts'];
  const snapshot: CandidateSnapshot = { base: 'base', commit: 'candidate', tree: 'tree', directories: new Set(),
    changes: [{ status: 'M', path: 'subs/owner/src/change.ts' }],
    entries: new Map(paths.map(path => [path, { path, kind: 'file', bytes: 20 }])) };
  expect(guidancePaths(snapshot, ['docs/selected.spec.md'])).toEqual(['docs/selected.spec.md', 'README.md', 'subs/owner/README.md']);
  expect(guidancePaths(snapshot)).not.toContain('global.principles.md');
  expect(validateOrientation({ summary: 'The selected contract preserves ownership.' }, ['docs/selected.spec.md'])).toMatchObject({ ok: true });
});
