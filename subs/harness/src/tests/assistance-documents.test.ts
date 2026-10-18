import { describe, expect, it } from 'vitest';
import type { CandidateSource, TreeEntry } from '../../subs/evidence/src/git.js';
import { captureAssistanceDocuments } from '../assistance/documents.js';

function source(contents: Record<string, string>, read: string[]): CandidateSource {
  const entries: TreeEntry[] = Object.entries(contents).map(([path, text]) => ({
    path, kind: 'file', bytes: Buffer.byteLength(text), objectId: 'a'.repeat(40),
  }));
  return {
    async treeEntries(_root, commit) { expect(commit).toBe('baseline'); return entries; },
    async readBlob(_root, commit, path) {
      expect(commit).toBe('baseline');
      read.push(path);
      const text = contents[path];
      if (text === undefined) throw new Error(`Missing ${path}`);
      return text;
    },
  } as CandidateSource;
}

describe('assisted document capture', () => {
  it('uses pinned Git documents with the captured plan text and excludes superseded designs', async () => {
    const read: string[] = [];
    const documents = await captureAssistanceDocuments({
      projectRoot: '/project', planId: 'p47', baselineCommit: 'baseline',
      planMarkdown: '# Current plan\n[design](../../docs/current.md)\n[old](../../docs/.superseded/old.md)',
      candidates: source({
        'plans/p47/plan.md': '# Old committed plan',
        'docs/current.md': '# Current design',
        'docs/.superseded/old.md': '# Secret old design',
        'src/quality.principles.md': '# Quality',
      }, read),
    });
    expect(documents.documents.map(document => [document.path, document.kind])).toEqual([
      ['plans/p47/plan.md', 'plan'], ['docs/current.md', 'plan'], ['src/quality.principles.md', 'principle'],
    ]);
    expect(documents.documents[0]!.text).toContain('Current plan');
    expect(read).not.toContain('plans/p47/plan.md');
    expect(read).not.toContain('docs/.superseded/old.md');
    expect(documents.gaps.missing.map(gap => gap.target)).toContain('docs/.superseded/old.md');
  });

  it('retains missing companion references as explicit gaps', async () => {
    const documents = await captureAssistanceDocuments({ projectRoot: '/project', planId: 'p47',
      baselineCommit: 'baseline', planMarkdown: '[requirement](missing.spec.md)',
      candidates: source({}, []),
    });
    expect(documents.gaps.missing).toMatchObject([{ target: 'plans/p47/missing.spec.md', judgment: 'unjudged' }]);
    expect(documents.manifest.documents[0]!.revision).toEqual({ commit: null, dirty: null });
  });
});
