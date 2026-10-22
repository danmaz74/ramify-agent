import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import type { CandidateSource, TreeEntry } from '../../../evidence/src/git.js';
import { captureAssistanceDocuments, readAssistanceDocument, requireCurrentAssistanceDocuments } from '../documents.js';

function source(contents: Record<string, string>): CandidateSource {
  const entries: TreeEntry[] = Object.entries(contents).map(([path, value]) => {
    const bytes = new TextEncoder().encode(value);
    return { path, kind: 'file', bytes: bytes.length, objectId: createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex') };
  });
  return {
    async treeEntries(_root, commit) { expect(commit).toBe('baseline'); return entries; },
    async readBlob(_root, commit, path) {
      expect(commit).toBe('baseline');
      const value = contents[path];
      if (value === undefined) throw new Error(`Missing ${path}`);
      return value;
    },
  } as CandidateSource;
}

describe('assisted document capture', () => {
  it('retains the captured plan as a Git reference without traversing linked documents', async () => {
    const planMarkdown = '# Plan\n[companion](../../docs/companion.md)';
    const documents = await captureAssistanceDocuments({ projectRoot: '/project', planId: 'p47', baselineCommit: 'baseline', planMarkdown });
    expect(documents).toMatchObject({ storage: 'git-references', baselineCommit: 'baseline',
      documents: [{ path: 'plans/p47/plan.md', adoption: 'undetermined' }], gaps: { missing: [], unreadablePrinciples: [] } });
    expect(await readAssistanceDocument({ projectRoot: '/project', planMarkdown, documents, id: documents.manifest.root })).toBe(planMarkdown);
    await expect(readAssistanceDocument({ projectRoot: '/project', planMarkdown: '# Changed', documents,
      id: documents.manifest.root })).rejects.toThrow('differs from its retained content identity');
  });

  it('verifies referenced Git bytes against their captured identity', async () => {
    const planMarkdown = '# Plan';
    const current = await captureAssistanceDocuments({ projectRoot: '/project', planId: 'p47', baselineCommit: 'baseline', planMarkdown });
    const companion = '# Companion narrative';
    const bytes = new TextEncoder().encode(companion);
    const captured = { id: 'document:companion', path: 'docs/companion.md', kind: 'principle' as const,
      sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length, storedAt: 'input/documents/companion.bin',
      revision: { commit: 'baseline', dirty: false } };
    const documents = { ...current, manifest: { ...current.manifest, documents: [...current.manifest.documents, captured] },
      documents: [...current.documents, { id: captured.id, path: captured.path, kind: captured.kind, sha256: captured.sha256,
        adoption: 'undetermined' as const }] };
    expect(await readAssistanceDocument({ projectRoot: '/project', planMarkdown, documents, id: captured.id,
      candidates: source({ [captured.path]: companion }) })).toBe(companion);
    await expect(readAssistanceDocument({ projectRoot: '/project', planMarkdown, documents, id: captured.id,
      candidates: source({ [captured.path]: '# Changed' }) })).rejects.toThrow('differs from its retained content identity');
  });

  it('refuses a document capture outside the current git-references form', () => {
    expect(() => requireCurrentAssistanceDocuments({ storage: 'inline', documents: [] })).toThrow('storage git-references');
    expect(() => requireCurrentAssistanceDocuments({ storage: 'git-references', documents: [{ text: '# old' }] })).toThrow('without inline document text');
  });
});
