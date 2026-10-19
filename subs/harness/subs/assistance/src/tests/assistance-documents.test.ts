import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import type { CandidateSource, TreeEntry } from '../../../evidence/src/git.js';
import { captureAssistanceDocuments, readAssistanceDocument, readCandidateDocument } from '../documents.js';

function source(contents: Record<string, string>, read: string[], originals: Record<string, Uint8Array> = {}, algorithm: 'sha1' | 'sha256' = 'sha1'): CandidateSource {
  const entries: TreeEntry[] = Object.entries(contents).map(([path, text]) => {
    const bytes = originals[path] ?? new TextEncoder().encode(text);
    return { path, kind: 'file', bytes: bytes.length, objectId: createHash(algorithm).update(`blob ${bytes.length}\0`).update(bytes).digest('hex') };
  });
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
  it('retains the original plan without eagerly traversing references or scanning principles', async () => {
    const read: string[] = [];
    const planMarkdown = '# Plan\n[historical bundle](../../history.gz)';
    const documents = await captureAssistanceDocuments({ projectRoot: '/project', planId: 'p47', baselineCommit: 'baseline',
      planMarkdown, candidates: source({ 'global.principles.md': '# Not selected' }, read) });
    expect(read).toEqual([]);
    expect(documents.documents.map(document => document.path)).toEqual(['plans/p47/plan.md']);
    expect(documents.gaps).toEqual({ missing: [], unreadablePrinciples: [] });
    expect(await readAssistanceDocument({ projectRoot: '/project', planMarkdown, documents, id: documents.manifest.root })).toBe(planMarkdown);
  });
  it('uses pinned Git documents with the captured plan text and excludes superseded designs', async () => {
    const read: string[] = [];
    const planMarkdown = '# Current plan\n[design](../../docs/current.md)\n[old](../../docs/.superseded/old.md)';
    const documents = await captureAssistanceDocuments({ discoverReferences: true,
      projectRoot: '/project', planId: 'p47', baselineCommit: 'baseline', planMarkdown,
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
    expect(documents.documents[0]).not.toHaveProperty('text');
    expect(await readAssistanceDocument({ projectRoot: '/project', planMarkdown, documents, id: documents.manifest.root, candidates: source({}, []) })).toContain('Current plan');
    expect(read).not.toContain('plans/p47/plan.md');
    expect(read).not.toContain('docs/.superseded/old.md');
    expect(documents.gaps.missing.map(gap => gap.target)).toContain('docs/.superseded/old.md');
  });

  it('retains missing companion references as explicit gaps', async () => {
    const documents = await captureAssistanceDocuments({ discoverReferences: true, projectRoot: '/project', planId: 'p47',
      baselineCommit: 'baseline', planMarkdown: '[requirement](missing.spec.md)',
      candidates: source({}, []),
    });
    expect(documents.gaps.missing).toMatchObject([{ target: 'plans/p47/missing.spec.md', judgment: 'unjudged' }]);
    expect(documents.manifest.documents[0]!.revision).toEqual({ commit: null, dirty: null });
  });

  it('retains transitive historical absolute and relative escapes without acquiring their targets', async () => {
    const read: string[] = [];
    const context = '# Context\n[history](/archive/result.json) [elsewhere](../../outside.md) [local](missing.md)';
    const documents = await captureAssistanceDocuments({ discoverReferences: true, projectRoot: '/project', planId: 'p47', baselineCommit: 'baseline',
      planMarkdown: '[context](../../docs/context.md) [required](../../docs/current.md)',
      candidates: source({ 'docs/context.md': context, 'docs/current.md': '# Current requirements' }, read) });
    expect(read).toEqual(['docs/context.md', 'docs/current.md']);
    expect(documents.documents.map(document => document.path)).toEqual(['plans/p47/plan.md', 'docs/context.md', 'docs/current.md']);
    expect(documents.gaps.outsideProject).toMatchObject([
      { from: 'docs/context.md', target: '/archive/result.json', judgment: 'unjudged', reason: expect.stringContaining('escapes the project') },
      { from: 'docs/context.md', target: '/outside.md', judgment: 'unjudged' },
    ]);
    const span = documents.gaps.outsideProject![0]!.source;
    expect(Buffer.from(context).subarray(span.start, span.end).toString()).toBe('[history](/archive/result.json)');
    expect(documents.gaps.missing).toMatchObject([{ target: 'docs/missing.md', judgment: 'unjudged' }]);
  });
  it.each(['sha1', 'sha256'] as const)('qualifies non-text links while authenticating literal replacement text with %s blobs', async algorithm => {
    const read: string[] = [];
    const documents = await captureAssistanceDocuments({ discoverReferences: true, projectRoot: '/project', planId: 'p47', baselineCommit: 'baseline',
      planMarkdown: '[evidence](../../docs/payload.bundle) [binary](../../docs/data.dump) [text](../../docs/literal.md) [requirements](../../docs/current.md) [binary format](../../docs/report.pdf)',
      candidates: source({ 'docs/payload.bundle': '\uFFFD', 'docs/data.dump': 'header\0payload',
        'docs/literal.md': 'literal \uFFFD', 'docs/current.md': '# Current requirement', 'docs/report.pdf': '%PDF binary data' }, read,
      { 'docs/payload.bundle': Uint8Array.from([0xf0, 0x90, 0x80]) }, algorithm) });
    expect(documents.documents.map(document => document.path)).toEqual(['plans/p47/plan.md', 'docs/current.md', 'docs/literal.md']);
    expect(documents.gaps.unreadableDocuments).toHaveLength(3);
    expect(documents.gaps.unreadableDocuments).toEqual(expect.arrayContaining([
      { path: 'docs/payload.bundle', reason: 'Document docs/payload.bundle could not be decoded exactly from Git', judgment: 'unjudged' },
      { path: 'docs/data.dump', reason: 'Document docs/data.dump contains binary NUL bytes', judgment: 'unjudged' },
      { path: 'docs/report.pdf', reason: 'Linked evidence docs/report.pdf is not captured as text', judgment: 'unjudged' },
    ]));
    expect(read).toEqual(['docs/payload.bundle', 'docs/data.dump', 'docs/literal.md', 'docs/current.md']);
    expect(await readAssistanceDocument({ projectRoot: '/project', planMarkdown: '', documents,
      id: documents.documents.find(document => document.path === 'docs/literal.md')!.id,
      candidates: source({ 'docs/literal.md': 'literal \uFFFD' }, [], {}, algorithm) })).toBe('literal \uFFFD');
  });

  it('retains uncertainty when optional blob identity cannot disambiguate replacement characters', async () => {
    await expect(readCandidateDocument('/project', 'baseline', { path: 'docs/unknown.md', kind: 'file', bytes: 3 },
      source({ 'docs/unknown.md': '\uFFFD' }, []))).rejects.toThrow('ambiguous replacement characters without Git blob identity');
  });

  it('retains complete references without document bodies and verifies on-demand content against retained hashes', async () => {
    const planMarkdown = '[companion](../../docs/companion.md)';
    const companion = '# Complete companion narrative';
    const candidates = source({ 'docs/companion.md': companion }, []);
    const documents = await captureAssistanceDocuments({ discoverReferences: true, projectRoot: '/project', planId: 'p47', baselineCommit: 'baseline', planMarkdown, candidates });
    const retained = JSON.parse(JSON.stringify(documents)) as typeof documents;
    expect(retained.storage).toBe('git-references');
    expect(JSON.stringify(retained)).not.toContain(companion);
    expect(retained.documents.every(document => document.text === undefined)).toBe(true);
    const id = retained.documents.find(document => document.path === 'docs/companion.md')!.id;
    expect(await readAssistanceDocument({ projectRoot: '/project', planMarkdown, documents: retained, id, candidates })).toBe(companion);
    await expect(readAssistanceDocument({ projectRoot: '/project', planMarkdown, documents: retained, id,
      candidates: source({ 'docs/companion.md': '# Different narrative' }, []) })).rejects.toThrow('differs from its retained content identity');
    const legacy = { ...retained, documents: retained.documents.map(document => document.id === id ? { ...document, text: companion } : document) };
    expect(await readAssistanceDocument({ projectRoot: '/project', planMarkdown, documents: legacy, id, candidates })).toBe(companion);
    await expect(readAssistanceDocument({ projectRoot: '/project', planMarkdown, documents: legacy, id, candidates: source({}, []) })).rejects.toThrow('Committed document docs/companion.md is unavailable');
    await expect(readAssistanceDocument({ projectRoot: '/project', planMarkdown: 'Changed captured input', documents: retained,
      id: retained.manifest.root, candidates: source({}, []) })).rejects.toThrow('differs from its retained content identity');
  });

});
