import { createHash } from 'node:crypto';
import { describe, expect, test } from 'vitest';
import { openCandidateSnapshot, resolveSnapshotPath, snapshotToolNames, snapshotTools } from '../snapshot.js';
import { collectReviewDiffPayload } from '../diff-payload.js';
import { validateReview } from '../submission.js';
import { scriptedCandidates } from '../../../autonomous/subs/acceptance/src/tests/helpers/candidates.js';

/*
 * The parts of a review that need no run: path resolution in a candidate,
 * the tools over it, the submission's rules against what the tools
 * answered, and the bounded queue of readers.
 */

const root = '/project';
const source = () => scriptedCandidates(root, {
  c0: { tree: 't0', base: 'c0', changes: [], files: { 'src/a.ts': 'export const a = 0;\n', 'src/gone.ts': 'removed\n', 'README.md': '# project\n' } },
  c1: {
    tree: 't1',
    base: 'c0',
    changes: [{ status: 'M', path: 'src/a.ts' }, { status: 'D', path: 'src/gone.ts' }, { status: 'A', path: 'src/b.ts' }],
    files: {
      'README.md': '# project\n',
      'src/a.ts': 'export const a = 1;\nexport const twice = 2;\n',
      'src/b.ts': 'export const b = 2;\n',
      'src/link': { symlink: '/etc' },
      'vendor/module': { symlink: '../..' },
    },
  },
});

async function snapshot() {
  const scripted = source();
  return { scripted, snapshot: await openCandidateSnapshot(scripted, root, { commit: 'c1', base: 'c0' }) };
}

describe('resolving a path in the audited candidate', () => {
  test('relative files and directories resolve; every way out is refused with its reason', async () => {
    const { snapshot: candidate } = await snapshot();
    expect(candidate).toMatchObject({ commit: 'c1', base: 'c0', tree: 't1' });
    expect(resolveSnapshotPath(candidate, 'src/a.ts')).toMatchObject({ ok: true, kind: 'file', path: 'src/a.ts' });
    expect(resolveSnapshotPath(candidate, './src/../src/a.ts')).toMatchObject({ ok: true, kind: 'file', path: 'src/a.ts' });
    expect(resolveSnapshotPath(candidate, 'src/')).toMatchObject({ ok: true, kind: 'directory', path: 'src' });
    expect(resolveSnapshotPath(candidate, '')).toMatchObject({ ok: true, kind: 'directory', path: '' });
    const denial = (path: unknown) => { const resolved = resolveSnapshotPath(candidate, path); return resolved.ok ? 'ok' : resolved.denial; };
    expect(denial('/project/src/a.ts')).toBe('absolute');
    expect(denial('~/secrets')).toBe('absolute');
    expect(denial('C:\\project\\src\\a.ts')).toBe('absolute');
    expect(denial('../outside')).toBe('outside');
    expect(denial('src/../../outside')).toBe('outside');
    expect(denial('.git/config')).toBe('repository');
    expect(denial('.ramify-architect/README.md')).toBe('live-view');
    expect(denial('src/.ramify/api.json')).toBe('live-view');
    expect(denial('src/link')).toBe('symlink');
    expect(denial('src/link/passwd')).toBe('symlink');
    expect(denial('vendor/module/src/a.ts')).toBe('symlink');
    expect(denial('src/gone.ts')).toBe('missing');
    expect(denial(42)).toBe('invalid');
    expect(denial('a\0b')).toBe('invalid');
  });

  test('the tools answer the candidate, record what they read, and refuse and record every escape', async () => {
    const { scripted, snapshot: candidate } = await snapshot();
    const tools = snapshotTools(candidate, scripted, root);
    const call = async (name: string, input: unknown) => tools.definitions.find(definition => definition.name === name)!.execute(input, new AbortController().signal);
    const action = (name: string, input: unknown) => tools.definitions.find(definition => definition.name === name)!.action!(input);
    expect(action(snapshotToolNames.read, { path: './src/../src/a.ts', startLine: 2 })).toEqual({
      kind: 'read', path: '/project/src/a.ts', range: { start: 2, count: 2000 },
    });
    expect(action(snapshotToolNames.read, { path: 'src/a.ts', lineCount: 9999 })).toMatchObject({ range: { start: 1, count: 2000 } });
    expect(action(snapshotToolNames.search, { path: 'src', pattern: 'const (a|b)' })).toEqual({ kind: 'search', path: '/project/src', pattern: 'const (a|b)', glob: null });
    expect(action(snapshotToolNames.read, { path: 'src/a.ts', extra: true })).toEqual({ kind: 'other' });
    expect(tools.definitions.every(definition => definition.mutating === false)).toBe(true);
    expect(await call(snapshotToolNames.list, {})).toEqual({ text: 'README.md\nsrc/\nvendor/' });
    expect(await call(snapshotToolNames.list, { path: 'src' })).toEqual({ text: 'a.ts\nb.ts\nlink (symbolic link, not followed)' });
    expect(await call(snapshotToolNames.read, { path: 'src/a.ts', startLine: 2 })).toEqual({ text: '     2\texport const twice = 2;' });
    expect(await call(snapshotToolNames.read, { path: 'README.md' })).toEqual({ text: '     1\t# project' });
    expect(await call(snapshotToolNames.search, { pattern: 'const (a|b)' })).toEqual({ text: 'src/a.ts:1: export const a = 1;\nsrc/b.ts:1: export const b = 2;' });
    expect(await call(snapshotToolNames.diff, {})).toEqual({ text: 'M\tsrc/a.ts\nD\tsrc/gone.ts\nA\tsrc/b.ts' });
    expect((await call(snapshotToolNames.diff, { path: 'src/gone.ts' })).isError).toBeUndefined();
    // A path the candidate holds but did not change is answered, not refused.
    expect(await call(snapshotToolNames.diff, { path: 'README.md' })).toEqual({
      text: '"README.md" is unchanged in the candidate: it is the same at the base c0 and at c1, so it has no patch. Read it with snapshot_read; snapshot_diff without a path lists what changed',
    });
    expect(await call(snapshotToolNames.diff, { path: 'src' })).toEqual({
      text: '"src" is a directory; ask for one of the changed paths beneath it:\nM\tsrc/a.ts\nD\tsrc/gone.ts\nA\tsrc/b.ts',
    });
    expect(await call(snapshotToolNames.diff, { path: 'vendor' })).toEqual({ text: '"vendor" is a directory, and the candidate changed nothing beneath it' });
    // A path the candidate does not hold at all, and was not deleted, stays an error.
    expect(await call(snapshotToolNames.diff, { path: 'src/never.ts' })).toMatchObject({ isError: true, text: 'The audited candidate has no "src/never.ts", and it deleted no such path; snapshot_diff without a path lists what it changed' });
    expect(await call(snapshotToolNames.read, { path: '/etc/passwd' })).toMatchObject({ isError: true });
    expect(await call(snapshotToolNames.search, { pattern: 'x', path: 'src/link' })).toMatchObject({ isError: true });
    expect(await call(snapshotToolNames.read, { path: 'src/a.ts', extra: true })).toMatchObject({ isError: true, text: expect.stringContaining('Invalid input') });
    // Reading README.md, an unchanged file, inspects no changed path; it is
    // read, and a concern may name it as its ground. A patch is no read.
    expect([...tools.inspected()].sort()).toEqual(['src/a.ts', 'src/gone.ts']);
    const hashed = (text: string) => `sha256:${createHash('sha256').update(text).digest('hex')}`;
    expect([...tools.read()]).toEqual([['src/a.ts', hashed('export const a = 1;\nexport const twice = 2;\n')], ['README.md', hashed('# project\n')]]);
    expect(tools.denials()).toEqual([
      { tool: snapshotToolNames.diff, denial: 'missing', path: 'src/never.ts' },
      { tool: snapshotToolNames.read, denial: 'absolute', path: '/etc/passwd' },
      { tool: snapshotToolNames.search, denial: 'symlink', path: 'src/link' },
    ]);
    expect(scripted.calls.filter(entry => entry.startsWith('readBlob'))).toEqual(['readBlob c1 src/a.ts', 'readBlob c1 README.md', 'readBlob c1 src/a.ts', 'readBlob c1 src/b.ts', 'readBlob c0 src/gone.ts']);
  });
});

describe('exact candidate text evidence', () => {
  test.each(['sha1', 'sha256'] as const)('refuses equal-length lossy decoding without recording inspection while preserving literal replacement text (%s)', async algorithm => {
    const scripted = scriptedCandidates(root, { base: { tree: 'base-tree', base: 'base', changes: [], files: { 'src/removed.ts': '\uFFFD', 'src/invalid.ts': '0', 'src/binary.ts': '0' } }, candidate: { tree: 'tree', base: 'base',
      changes: [{ status: 'M', path: 'src/invalid.ts' }, { status: 'A', path: 'src/literal.ts' }, { status: 'M', path: 'src/binary.ts' }, { status: 'D', path: 'src/removed.ts' }],
      files: { 'src/invalid.ts': '\uFFFD', 'src/literal.ts': '\uFFFD', 'src/binary.ts': 'header\0payload' } } });
    const source = { ...scripted, treeEntries: async (project: string, commit: string) => (await scripted.treeEntries(project, commit)).map(entry => {
      const bytes = entry.path === 'src/invalid.ts' && commit === 'candidate' || entry.path === 'src/removed.ts' ? Buffer.from([0xf0, 0x90, 0x80]) : Buffer.from(commit === 'base' ? '0' : entry.path === 'src/literal.ts' ? '\uFFFD' : 'header\0payload');
      return { ...entry, bytes: bytes.length, objectId: createHash(algorithm).update(`blob ${bytes.length}\0`).update(bytes).digest('hex') };
    }) };
    const snapshot = await openCandidateSnapshot(source, root, { commit: 'candidate', base: 'base' });
    const tools = snapshotTools(snapshot, source, root);
    const read = (path: string) => tools.definitions.find(tool => tool.name === 'snapshot_read')!.execute({ path }, new AbortController().signal);
    expect(await read('src/invalid.ts')).toMatchObject({ isError: true, text: expect.stringContaining('could not be decoded exactly from Git') });
    expect(tools.read().has('src/invalid.ts')).toBe(false); expect(tools.inspected().has('src/invalid.ts')).toBe(false);
    expect(await read('src/literal.ts')).toEqual({ text: '     1\t\uFFFD' });
    expect(tools.read().has('src/literal.ts')).toBe(true);
    expect(await read('src/binary.ts')).toEqual({ text: 'src/binary.ts is a binary file of 14 bytes' });
    expect(tools.read().has('src/binary.ts')).toBe(false); expect(tools.inspected().has('src/binary.ts')).toBe(false);
    const call = (name: string, input: unknown) => tools.definitions.find(tool => tool.name === name)!.execute(input, new AbortController().signal);
    for (const path of ['src/invalid.ts', 'src/removed.ts', 'src/binary.ts']) {
      expect(await call('snapshot_diff', { path })).toMatchObject({ isError: true });
      expect(tools.inspected().has(path)).toBe(false);
    }
    expect(await call('snapshot_search', { pattern: '\uFFFD', path: 'src/invalid.ts' })).toMatchObject({ isError: true });
    expect(await call('snapshot_search', { pattern: '\uFFFD', path: 'src/literal.ts' })).toEqual({ text: 'src/literal.ts:1: \uFFFD' });
    expect(await call('snapshot_diff', { path: 'src/literal.ts' })).toMatchObject({ text: expect.stringContaining('+\uFFFD') });
    const delivered = await collectReviewDiffPayload(snapshot, source, root);
    expect(delivered.inlinePaths).toEqual(['src/literal.ts']);
    expect(delivered.text).toContain('could not be decoded exactly from Git');
    expect(scripted.calls.filter(call => call.startsWith('diffPatch'))).toEqual(['diffPatch candidate src/literal.ts', 'diffPatch candidate src/literal.ts']);
    const claimed = validateReview({ inspected: ['src/invalid.ts', 'src/literal.ts'], missing: [{ path: 'src/binary.ts', reason: 'binary' }], concerns: [] },
      { snapshot, inspected: tools.inspected(), read: tools.read(), maxConcerns: 2 });
    expect(claimed.ok).toBe(true);
  });
});

describe('a reviewer submission', () => {
  const concern = (path: string, ground: { path: string } | null = null) => ({
    summary: 'Behavior fails', consequence: 'A caller loses its result', rationale: 'The source returns too early',
    uncertainty: 'Observed from code', remedy: 'Complete the operation', locations: [{ path, startLine: 1, endLine: 2 }],
    suggests: null, risk: 'medium', ground,
  });

  test('accepts selected inspection and meaningful limitations without an exhaustive inventory', async () => {
    const { snapshot: candidate } = await snapshot();
    const evidence = { snapshot: candidate, inspected: new Set<string>(), read: new Map<string, string>(), maxConcerns: 2 };
    expect(validateReview({ assessment: 'Relevant behavior is sound.', limitations: ['Optional historical bundle was not read.'], concerns: [] }, evidence))
      .toMatchObject({ ok: true, value: { inspected: [], missing: [], concerns: [] } });
    // Legacy records remain valid without enforcing their old exhaustive inventory rule.
    expect(validateReview({ inspected: ['src/a.ts'], missing: [{ path: 'src/b.ts', reason: 'Unrelated' }], concerns: [] }, evidence).ok).toBe(true);
    expect(validateReview({ concerns: [concern('src/a.ts', { path: 'README.md' })] }, evidence).ok).toBe(true);
  });

  test('retains candidate reference, risk and bounded concern validation', async () => {
    const { snapshot: candidate } = await snapshot();
    const evidence = { snapshot: candidate, inspected: new Set<string>(), read: new Map<string, string>(), maxConcerns: 2 };
    for (const value of [
      { concerns: [concern('/etc/passwd')] }, { concerns: [concern('src')] },
      { concerns: [concern('src/a.ts', { path: 'absent.md' })] },
      { concerns: [{ ...concern('src/a.ts'), risk: 'critical' }] },
      { concerns: [concern('src/a.ts'), concern('src/a.ts'), concern('src/a.ts')] },
      { concerns: [{ ...concern('src/a.ts'), locations: [{ path: 'src/a.ts', startLine: 5, endLine: 2 }] }] },
    ]) expect(validateReview(value, evidence).ok).toBe(false);
    expect(validateReview({ concerns: [concern('src/gone.ts')] }, evidence).ok).toBe(true);
  });

  test('descriptive reviews require distinct local finding keys and keep legacy submissions readable', async () => {
    const { snapshot: candidate } = await snapshot();
    const evidence = { snapshot: candidate, inspected: new Set<string>(), read: new Map<string, string>(), maxConcerns: 2 };
    const named = { ...concern('src/a.ts'), findingKey: 'draft:finding:missing-companion-export' };
    expect(validateReview({ concerns: [named] }, evidence, 'descriptive').ok).toBe(true);
    expect(validateReview({ concerns: [concern('src/a.ts')] }, evidence, 'legacy').ok).toBe(true);
    expect(validateReview({ concerns: [concern('src/a.ts')] }, evidence, 'descriptive')).toMatchObject({ ok: false });
    expect(validateReview({ concerns: [{ ...named, findingKey: 'finding:missing-companion-export' }] }, evidence, 'descriptive')).toMatchObject({ ok: false });
    expect(validateReview({ concerns: [named, named] }, evidence, 'descriptive')).toMatchObject({
      ok: false, errors: [expect.objectContaining({ path: 'concerns.1.findingKey' })],
    });
  });
});
