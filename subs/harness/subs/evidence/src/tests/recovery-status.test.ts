import { expect, test } from 'vitest';
import { parseRecoveryStatus } from '../git.js';

test('staged, unstaged and untracked categories retain exact paths, spaces, newlines and nested-project coordinates', () => {
  expect(parseRecoveryStatus('M  nested/source.ts\0 M nested/with space.ts\0?? nested/new\nfile.ts\0 M sibling/foreign.ts\0', 'nested/')).toEqual({
    staged: ['source.ts'], unstaged: ['with space.ts'], untracked: ['new\nfile.ts'],
  });
});
test('a staged rename retains both former and new identities without taking a sibling path', () => {
  expect(parseRecoveryStatus('R  nested/new.ts\0nested/old.ts\0R  nested/moved.ts\0outside/prior.ts\0', 'nested/')).toEqual({
    staged: ['moved.ts', 'new.ts', 'old.ts'], unstaged: [], untracked: [],
  });
});
test('unmerged or combined index/working changes remain visible in both categories', () => {
  expect(parseRecoveryStatus('MM source.ts\0UU conflicted.ts\0')).toEqual({ staged: ['conflicted.ts', 'source.ts'], unstaged: ['conflicted.ts', 'source.ts'], untracked: [] });
});
test('an incomplete rename or malformed entry is unavailable evidence', () => {
  expect(() => parseRecoveryStatus('R  changed.ts\0')).toThrow('original path');
  expect(() => parseRecoveryStatus('broken\0')).toThrow('malformed');
  expect(() => parseRecoveryStatus(' M source.ts')).toThrow('incomplete');
});
