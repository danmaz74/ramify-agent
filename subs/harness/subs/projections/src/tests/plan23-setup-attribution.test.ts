import { createHash } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import type { CandidateSource, ChangeHistory } from '../../../../subs/evidence/src/git.js';
import { setupLineIdentitiesOf } from '../metrics.js';
import type { RunView } from '../inputs.js';

function setupFixture(options: { oid?: boolean; original?: string; sourceLine?: number; prefix?: string; bytes?: Uint8Array; binary?: boolean } = {}) {
  const before = options.original ?? '# manual\n'; const setup = `${before}${before.endsWith('\n') ? '' : '\n'}**/src/tmp/\n`; const final = '**/src/tmp/\n# writer\n';
  const texts: Record<string, string> = { B: before, S: setup, F: final };
  const prefix = options.prefix ?? 'nested/';
  const changes: ChangeHistory = { async commitsBetween() { return ['S', 'F']; }, async changedFiles() { return [{ before: '.gitignore', after: '.gitignore', binary: false, added: [[1, 2]], deleted: [[1, 1]] },
      ...(options.binary ? [{ before: null, after: 'assets/logo.png', binary: true, added: [], deleted: [] }] : [])]; },
    async lineOrigins() { return [{ line: 1, commit: 'S', boundary: false, sourceLine: options.sourceLine ?? 2, sourcePath: `${prefix}.gitignore`, projectPrefix: prefix }, { line: 2, commit: 'F', boundary: false, sourceLine: 2, sourcePath: `${prefix}.gitignore`, projectPrefix: prefix }]; },
    async lineLastSeen(_root, _from, to) { return [{ line: 1, commit: to === 'F' ? 'S' : 'B', boundary: false, sourceLine: 1, sourcePath: `${prefix}.gitignore`, projectPrefix: prefix }]; } };
  const asked: string[] = [];
  const candidates: CandidateSource = { async treeEntries(_root, revision) { const bytes = revision === 'S' && options.bytes ? Buffer.from(options.bytes) : Buffer.from(texts[revision]!);
      return [{ path: '.gitignore', kind: 'file', bytes: bytes.length, ...(options.oid === false ? {} : { objectId: createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex') }) }]; },
    async readBlob(_root, revision, path) { asked.push(path); if (path !== '.gitignore') throw new Error('The candidate source names the project\'s files as the project does, not by repository path'); return revision === 'S' && options.bytes ? Buffer.from(options.bytes).toString('utf8') : texts[revision]!; },
    async commitTree() { throw new Error('No extra candidate exploration allowed'); }, async grepTree() { throw new Error('No grep allowed'); }, async diffNameStatus() { throw new Error('No name diff allowed'); }, async diffPatch() { throw new Error('No patch inference allowed'); } };
  const view = { record: { jobId: 'run' }, events: [{ sequence: 1, type: 'scratch-setting-up', data: { originalIgnoreBase64: Buffer.from(before).toString('base64') } }, { sequence: 2, type: 'scratch-setup-complete', data: { commit: 'S', appended: true } }] } as unknown as RunView;
  return { view, history: { projectRoot: '/scripted/nested', changes, candidates }, asked };
}
describe('Plan 23 exact setup attribution collection', () => {
  test('uses authenticated nested repository origins and keeps later same-file writer additions/deletions', async () => {
    const f = setupFixture(); const identities = await setupLineIdentitiesOf(f.view, f.history, 'B', 'F');
    expect(identities).toEqual({ base: 'B', final: 'F', entries: [{ commit: 'S', path: '.gitignore', added: [1], deleted: [] }, { commit: 'F', path: '.gitignore', added: [], deleted: [] }] });
    expect(f.asked.length).toBeGreaterThan(0); expect(new Set(f.asked)).toEqual(new Set(['.gitignore']));
  });
  test('a binary path in the direct diff has no line partitions and leaves the text identities verified', async () => {
    const f = setupFixture({ binary: true });
    expect(await setupLineIdentitiesOf(f.view, f.history, 'B', 'F')).toEqual({ base: 'B', final: 'F', entries: [{ commit: 'S', path: '.gitignore', added: [1], deleted: [] }, { commit: 'F', path: '.gitignore', added: [], deleted: [] }] });
  });
  test('missing OIDs and original invalid bytes never waive a commit or path', async () => {
    const old = setupFixture({ oid: false }); const invalid = setupFixture({ bytes: new Uint8Array([255, 10]) });
    for (const f of [old, invalid]) { const identities = await setupLineIdentitiesOf(f.view, f.history, 'B', 'F'); expect(identities.entries.find(entry => entry.commit === 'S')?.added).toBeNull(); expect(identities.entries.find(entry => entry.commit === 'F')).toMatchObject({ added: [], deleted: [] }); }
    const legitimate = setupFixture({ original: '�\n' }); expect((await setupLineIdentitiesOf(legitimate.view, legitimate.history, 'B', 'F')).entries.find(entry => entry.commit === 'S')?.added).toEqual([1]);
  });
  test('a source position mismatch or unrelated repeated setup intent retains unknown attribution', async () => {
    const wrong = setupFixture({ sourceLine: 1 }); expect((await setupLineIdentitiesOf(wrong.view, wrong.history, 'B', 'F')).entries.find(entry => entry.commit === 'S')?.added).toBeNull();
    const ambiguous = setupFixture(); (ambiguous.view.events as unknown as { sequence: number; type: string; data: unknown }[]).splice(1, 0, { sequence: 1.5, type: 'scratch-setting-up', data: { originalIgnoreBase64: '' } });
    expect((await setupLineIdentitiesOf(ambiguous.view, ambiguous.history, 'B', 'F')).entries.find(entry => entry.commit === 'S')?.added).toBeNull();
  });
});
