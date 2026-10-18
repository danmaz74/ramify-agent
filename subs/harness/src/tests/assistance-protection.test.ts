import { describe, expect, it } from 'vitest';
import type { CandidateSource, TreeEntry } from '../../subs/evidence/src/git.js';
import { compareProtection, defaultProtectionRules, inspectProtectedInputs, type ProtectedException } from '../assistance/protection.js';

const id = (digit: string) => digit.repeat(40);
const entry = (path: string, objectId: string, kind: TreeEntry['kind'] = 'file'): TreeEntry => ({ path, objectId, kind, bytes: 10 });

function candidates(before: TreeEntry[], after: TreeEntry[], changes: Array<{ status: string; path: string }>): CandidateSource {
  return {
    async diffNameStatus(_root, from, to) {
      expect([from, to]).toEqual(['original', 'candidate']);
      return changes;
    },
    async treeEntries(_root, commit) { return commit === 'original' ? before : after; },
  } as CandidateSource;
}

describe('assisted protection', () => {
  it('retains the original baseline across rename, mode, new path, and policy edits', async () => {
    const rules = defaultProtectionRules({ explicitPaths: ['contracts/'], excludedPaths: ['contracts/generated/'] });
    const before = [entry('docs/design.spec.md', id('a')), entry('contracts/api.ts', id('b')),
      entry('contracts/generated/output.ts', id('c')), entry('src/ordinary.ts', id('d'))];
    const after = [entry('docs/design.txt', id('a')), entry('contracts/api.ts', id('b'), 'executable'),
      entry('contracts/generated/output.ts', id('e')), entry('docs/new.principles.md', id('f')),
      entry('src/ordinary.ts', id('e')), entry('ramify-audit.json', id('f'))];
    const diff = [
      { status: 'D', path: 'docs/design.spec.md' }, { status: 'A', path: 'docs/design.txt' },
      { status: 'M', path: 'contracts/api.ts' }, { status: 'M', path: 'contracts/generated/output.ts' },
      { status: 'A', path: 'docs/new.principles.md' }, { status: 'M', path: 'src/ordinary.ts' },
      { status: 'A', path: 'ramify-audit.json' },
    ];
    const result = await compareProtection({ projectRoot: '/project', baselineCommit: 'original', candidateCommit: 'candidate',
      rules, candidates: candidates(before, after, diff) });
    expect(result.violations.map(change => [change.path, change.before?.kind ?? null, change.after?.kind ?? null])).toEqual([
      ['docs/design.spec.md', 'file', null], ['contracts/api.ts', 'file', 'executable'],
      ['docs/new.principles.md', null, 'file'], ['ramify-audit.json', null, 'file'],
    ]);
  });

  it('authorizes only an accepted exact identity pair, without resetting the baseline', async () => {
    const rules = defaultProtectionRules();
    const path = 'docs/rule.spec.md';
    const exception: ProtectedException = { path, before: { kind: 'file', objectId: id('a') },
      after: { kind: 'file', objectId: id('b') }, authority: { id: 'decision-1', revision: 1, hash: 'a'.repeat(64) } };
    const source = (afterId: string) => candidates([entry(path, id('a'))], [entry(path, afterId)], [{ status: 'M', path }]);
    const accepted = await compareProtection({ projectRoot: '/project', baselineCommit: 'original', candidateCommit: 'candidate',
      rules, candidates: source(id('b')), exceptions: [exception] });
    expect(accepted.violations).toEqual([]);
    const later = await compareProtection({ projectRoot: '/project', baselineCommit: 'original', candidateCommit: 'candidate',
      rules, candidates: source(id('c')), exceptions: [exception] });
    expect(later.violations).toHaveLength(1);
    const modeOnly = await compareProtection({ projectRoot: '/project', baselineCommit: 'original', candidateCommit: 'candidate',
      rules, candidates: candidates([entry(path, id('a'))], [entry(path, id('a'), 'executable')], [{ status: 'M', path }]),
      exceptions: [{ ...exception, after: { kind: 'file', objectId: id('a') } }] });
    expect(modeOnly.violations).toHaveLength(1);
  });

  it('reports dirty protected inputs by Git category but leaves unrelated dirt alone', async () => {
    const rules = defaultProtectionRules({ explicitPaths: ['docs/required.txt'], excludedPaths: ['docs/draft.spec.md'] });
    const result = await inspectProtectedInputs({ projectRoot: '/project', rules, status: async () => ({
      staged: ['docs/rule.spec.md', 'src/app.ts'], unstaged: ['ramify-audit.json', 'docs/draft.spec.md'],
      untracked: ['docs/required.txt', 'notes.txt'],
    }) });
    expect(result.gaps).toEqual([
      { path: 'docs/rule.spec.md', state: 'staged' }, { path: 'ramify-audit.json', state: 'unstaged' },
      { path: 'docs/required.txt', state: 'untracked' },
    ]);
  });

  it('does not report a net change that Git does not report', async () => {
    const result = await compareProtection({ projectRoot: '/project', baselineCommit: 'original', candidateCommit: 'candidate',
      rules: defaultProtectionRules(), candidates: candidates([entry('docs/rule.spec.md', id('a'))],
        [entry('docs/rule.spec.md', id('a'))], []) });
    expect(result.changes).toEqual([]);
  });

  it('keeps guarded project paths despite exclusions and applies the declared addition policy', async () => {
    const rules = defaultProtectionRules({ excludedPaths: ['ramify-audit.json'], additions: 'allow' });
    const source = candidates([], [entry('ramify-audit.json', id('a')), entry('docs/new.spec.md', id('b'))],
      [{ status: 'A', path: 'ramify-audit.json' }, { status: 'A', path: 'docs/new.spec.md' }]);
    const result = await compareProtection({ projectRoot: '/project', baselineCommit: 'original', candidateCommit: 'candidate',
      rules, candidates: source });
    expect(result.changes.map(change => change.path)).toEqual(['ramify-audit.json']);
    const guardedEdit = await compareProtection({ projectRoot: '/project', baselineCommit: 'original', candidateCommit: 'candidate',
      rules, candidates: candidates([entry('ramify-audit.json', id('a'))], [entry('ramify-audit.json', id('b'))],
        [{ status: 'M', path: 'ramify-audit.json' }]) });
    expect(guardedEdit.violations).toHaveLength(1);
  });
});
