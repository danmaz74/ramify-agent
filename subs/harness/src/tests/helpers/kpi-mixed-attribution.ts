import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { verifySetupLineIdentities, type SetupLineIdentityInput } from '../../../subs/kpi/src/setup-attribution.js';
import { deliveredChange, type DeliveredChange, type HarnessLineIdentities } from '../../../subs/kpi/src/delivered.js';
import type { ChangeHistory, ChangedFile, GitLineRange } from '../../../subs/evidence/src/git.js';

const base = 'b'.repeat(40), mixed = '1'.repeat(40), reverted = '2'.repeat(40), final = '3'.repeat(40);
const path = 'src/mixed.ts', overlap = 'src/overlap.ts';
const hash = (text: string) => createHash('sha256').update(text).digest('hex');
type Mode = 'surviving' | 'reverted' | 'unknown';

// Factual evidence: the mixed commit replaces setup line 2 and writer line 3.
// No prefix is inserted: accepted surviving additions remain at positions 2/3.
// Another writer's intermediate edit on src/reverted.ts is fully undone.
export function mixedSetupInput(mode: Mode = 'surviving'): SetupLineIdentityInput {
  const added = [{ line: 2, hash: hash('setup-new\n') }];
  const deleted = [{ line: 2, hash: hash('setup-old\n') }];
  const beforeBlobHash = hash('keep\nsetup-old\nwriter-old\n');
  const afterBlobHash = hash('keep\nsetup-new\nwriter-new\n');
  return {
    runId: 'run-mixed', base, final, firstParentCommits: [base, mixed, reverted, final],
    records: [{ id: 'setup-source', runId: 'run-mixed', path, beforeRevision: base, commit: mixed,
      beforeBlobHash, afterBlobHash, added, deleted }],
    candidates: [{ commit: mixed, path, kind: 'added' }, { commit: mixed, path, kind: 'deleted' }],
    facts: [{ recordId: 'setup-source', base, final, beforeRevision: base, commit: mixed,
      beforeBlobHash, afterBlobHash, sourceAdded: mode === 'unknown' ? null : added, sourceDeleted: deleted,
      beforePath: path, afterPath: path,
      finalAdded: [
        ...(mode === 'reverted' ? [] : [{ line: 2, hash: hash('setup-new\n'), originCommit: mixed, originPath: path, originLine: 2, boundary: false }]),
        { line: 3, hash: hash('writer-new\n'), originCommit: mixed, originPath: path, originLine: 3, boundary: false },
      ],
      baseDeleted: [
        ...(mode === 'reverted' ? [] : [{ line: 2, hash: hash('setup-old\n'), lastSeenCommit: base, sourceBeforePath: path, sourceBeforeLine: 2, removingCommit: mixed }]),
        { line: 3, hash: hash('writer-old\n'), lastSeenCommit: base, sourceBeforePath: path, sourceBeforeLine: 3, removingCommit: mixed },
      ],
    }],
  };
}

// These are whole trees, not excerpts. Empty overlap exists in BASE; all paths
// have LF-terminated lines. The alternate FINAL restores only the setup edit.
function literalTrees(mode: Mode): Record<string, Record<string, string>> {
  const original = { [path]: 'keep\nsetup-old\nwriter-old\n', [overlap]: '', 'src/reverted.ts': 'original\n' };
  const changed = { ...original, [path]: 'keep\nsetup-new\nwriter-new\n', [overlap]: 'overlap-one\noverlap-two\n' };
  return {
    [base]: original,
    [mixed]: changed,
    [reverted]: { ...changed, 'src/reverted.ts': 'temporary-writer-edit\n' },
    [final]: { ...changed, [path]: mode === 'reverted' ? 'keep\nsetup-old\nwriter-new\n' : changed[path]! },
  };
}
const lines = (blob: string) => blob.match(/[^\n]*\n/g) ?? [];
function scriptedFiles(mode: Mode): ChangedFile[] {
  return [
    { before: path, after: path, binary: false, added: mode === 'reverted' ? [[3, 1]] : [[2, 2]], deleted: mode === 'reverted' ? [[3, 1]] : [[2, 2]] },
    { before: overlap, after: overlap, binary: false, added: [[1, 2]], deleted: [] },
  ];
}

/** Independent small-fixture oracle: positional replacements only, no diff engine.
 * Scan EVERY literal line on BOTH sides, including unchanged/reverted paths.
 * This is deliberately not derived from either KPI provider's output.
 */
export function assertMixedEvidence(mode: Mode, input = mixedSetupInput(mode), files = scriptedFiles(mode)) {
  const trees = literalTrees(mode);
  const blob = (revision: string, name: string) => { const value = trees[revision]?.[name]; assert.notEqual(value, undefined); return value!; };
  const at = (revision: string, name: string, line: number) => {
    const value = lines(blob(revision, name))[line - 1]; assert.notEqual(value, undefined); return value!;
  };
  const expand = (ranges: readonly GitLineRange[]) => ranges.flatMap(([start, count]) => Array.from({ length: count }, (_, i) => start + i));
  assert.deepEqual(input.firstParentCommits, [base, mixed, reverted, final]);
  assert.deepEqual([input.base, input.final], [base, final]);
  for (const tree of Object.values(trees)) for (const text of Object.values(tree)) assert.equal(lines(text).join(''), text);
  assert.deepEqual(Object.keys(trees[base]!).sort(), Object.keys(trees[final]!).sort());
  const changedPaths: string[] = [];
  for (const name of Object.keys(trees[base]!)) {
    const before = lines(blob(base, name)), after = lines(blob(final, name));
    const additions = after.flatMap((text, i) => text === before[i] ? [] : [i + 1]);
    const deletions = before.flatMap((text, i) => text === after[i] ? [] : [i + 1]);
    if (!additions.length && !deletions.length) continue;
    changedPaths.push(name);
    const file = files.find(file => file.before === name && file.after === name);
    assert.ok(file); assert.equal(file.binary, false);
    assert.deepEqual(expand(file.added), additions);
    assert.deepEqual(expand(file.deleted), deletions);
  }
  assert.deepEqual(files.map(file => file.after), changedPaths); // no omissions or extra paths
  assert.equal(blob(base, 'src/reverted.ts'), blob(final, 'src/reverted.ts'));
  assert.notEqual(blob(reverted, 'src/reverted.ts'), blob(final, 'src/reverted.ts'));
  assert.equal(blob(mixed, path), blob(reverted, path));
  assert.equal(input.records.length, 1); assert.equal(input.facts.length, 1);
  const record = input.records[0]!, fact = input.facts[0]!;
  const added = [{ line: 2, hash: hash(at(mixed, path, 2)) }];
  const deleted = [{ line: 2, hash: hash(at(base, path, 2)) }];
  assert.equal(at(base, path, 2), 'setup-old\n'); assert.equal(at(mixed, path, 2), 'setup-new\n');
  assert.equal(at(base, path, 3), 'writer-old\n'); assert.equal(at(final, path, 3), 'writer-new\n');
  assert.deepEqual(record, { id: 'setup-source', runId: 'run-mixed', path, beforeRevision: base, commit: mixed,
    beforeBlobHash: hash(blob(base, path)), afterBlobHash: hash(blob(mixed, path)), added, deleted });
  assert.deepEqual(input.candidates, [{ commit: mixed, path, kind: 'added' }, { commit: mixed, path, kind: 'deleted' }]);
  assert.deepEqual(fact, {
    recordId: record.id, base, final, beforeRevision: base, commit: mixed,
    beforeBlobHash: hash(blob(base, path)), afterBlobHash: hash(blob(mixed, path)),
    sourceAdded: mode === 'unknown' ? null : added, sourceDeleted: deleted, beforePath: path, afterPath: path,
    finalAdded: expand(files[0]!.added).map(line => {
      // Every surviving addition is introduced by mixed and unchanged thereafter.
      assert.equal(at(final, path, line), at(mixed, path, line));
      assert.equal(at(reverted, path, line), at(mixed, path, line));
      assert.notEqual(at(base, path, line), at(mixed, path, line));
      return { line, hash: hash(at(final, path, line)), originCommit: mixed, originPath: path, originLine: line, boundary: false };
    }),
    baseDeleted: expand(files[0]!.deleted).map(line => {
      // BASE is the last revision containing each deleted line; mixed removes it.
      assert.notEqual(at(base, path, line), at(mixed, path, line));
      return { line, hash: hash(at(base, path, line)), lastSeenCommit: base, sourceBeforePath: path, sourceBeforeLine: line, removingCommit: mixed };
    }),
  });
  for (const line of [1, 2]) {
    assert.equal(at(final, overlap, line), at(mixed, overlap, line));
    assert.equal(at(reverted, overlap, line), at(mixed, overlap, line));
    assert.equal(blob(base, overlap), '');
  }
  if (mode === 'reverted') assert.equal(at(final, path, 2), at(base, path, 2));
}

/** External Git evidence only. Every answer is required once, with exact range/cwd. */
export class FakeMixedChangeHistory implements ChangeHistory {
  private readonly calls: string[] = [];
  constructor(private readonly mode: Mode) {}
  private check(name: string, root: string, from: string, to: string) {
    this.calls.push(name);
    assert.deepEqual([root, from, to], ['/controlled-project', base, final]);
  }
  async commitsBetween(root: string, from: string, to: string) {
    this.check('commits', root, from, to); return [mixed, reverted, final];
  }
  async changedFiles(root: string, from: string, to: string): Promise<ChangedFile[]> {
    this.check('files', root, from, to);
    const files = scriptedFiles(this.mode);
    assertMixedEvidence(this.mode, mixedSetupInput(this.mode), files);
    return files; // src/reverted.ts is absent from the complete direct diff.
  }
  async lineOrigins(root: string, from: string, to: string, name: string, ranges: readonly GitLineRange[]) {
    this.check(`origins ${name}`, root, from, to);
    assert.ok(name === path || name === overlap);
    assert.deepEqual(ranges, name === overlap ? [[1, 2]] : this.mode === 'reverted' ? [[3, 1]] : [[2, 2]]);
    return (name === overlap ? [1, 2] : this.mode === 'reverted' ? [3] : [2, 3]).map(line => ({ line, commit: mixed, boundary: false }));
  }
  async lineLastSeen(root: string, from: string, to: string, name: string, ranges: readonly GitLineRange[]) {
    this.check(`seen ${name}`, root, from, to);
    assert.equal(name, path); assert.deepEqual(ranges, this.mode === 'reverted' ? [[3, 1]] : [[2, 2]]);
    return (this.mode === 'reverted' ? [3] : [2, 3]).map(line => ({ line, commit: base, boundary: false }));
  }
  exhausted() { assert.deepEqual(this.calls, ['commits', 'files', `origins ${path}`, `seen ${path}`, `origins ${overlap}`]); }
}

export function mixedAttributionFixture() {
  let identities: HarnessLineIdentities | undefined;
  let result: DeliveredChange | undefined;
  async function calculate(mode: Mode, verified: HarnessLineIdentities) {
    assertMixedEvidence(mode);
    const history = new FakeMixedChangeHistory(mode);
    const answer = await deliveredChange(history, {
      projectRoot: '/controlled-project', base, final,
      writers: new Map([[mixed, ['writer-mixed']], [reverted, ['writer-reverted']]]),
      harness: new Set(), harnessPaths: new Set(), recorded: new Map(),
      harnessDeltas: verified, overlappingPaths: new Set([overlap]),
    });
    history.exhausted(); return answer;
  }
  function measured(answer: DeliveredChange | undefined) {
    assert.ok(answer);
    if (answer.state !== 'measured') throw new Error(answer.reason);
    assert.equal(answer.base, base); assert.equal(answer.final, final);
    assert.deepEqual(answer.binaryPaths, []); return answer;
  }
  return {
    authenticate() {
      assertMixedEvidence('surviving');
      identities = verifySetupLineIdentities(mixedSetupInput());
      assert.deepEqual(identities, { base, final, entries: [{ commit: mixed, path, added: [2], deleted: [2] }] });
    },
    async exercise() { assert.ok(identities); result = await calculate('surviving', identities); },
    exact() {
      const answer = measured(result);
      assert.equal(answer.harness, 2);
      assert.deepEqual([...answer.weights], [['writer-mixed', 2]]);
    },
    async reverts() {
      assert.equal(measured(result).weights.has('writer-reverted'), false);
      assertMixedEvidence('reverted');
      const empty = verifySetupLineIdentities(mixedSetupInput('reverted'));
      assert.deepEqual(empty, { base, final, entries: [{ commit: mixed, path, added: [], deleted: [] }] });
      const answer = measured(await calculate('reverted', empty));
      assert.equal(answer.harness, 0); assert.deepEqual([...answer.weights], [['writer-mixed', 2]]);
      assert.deepEqual([...answer.unattributed], [[`commit 111111111111 has uncertain overlapping writer attribution in src/overlap.ts`, 2]]);
    },
    async uncertainty() {
      assert.deepEqual([...measured(result).unattributed], [[`commit 111111111111 has uncertain overlapping writer attribution in src/overlap.ts`, 2]]);
      assertMixedEvidence('unknown');
      const unknown = verifySetupLineIdentities(mixedSetupInput('unknown'));
      assert.deepEqual(unknown, { base, final, entries: [{ commit: mixed, path, added: null, deleted: [2] }] });
      const answer = measured(await calculate('unknown', unknown));
      assert.equal(answer.harness, 1); assert.deepEqual([...answer.weights], [['writer-mixed', 1]]);
      assert.deepEqual([...answer.unattributed], [
        ['setup line mapping unavailable for 111111111111 src/mixed.ts added: exact final/base revision-bound identities required', 2],
        ['commit 111111111111 has uncertain overlapping writer attribution in src/overlap.ts', 2],
      ]);
      const input = mixedSetupInput();
      assert.throws(() => verifySetupLineIdentities({ ...input, candidates: [] }), /partition missing/);
      assert.throws(() => verifySetupLineIdentities({ ...input, candidates: [{ commit: '', path, kind: 'added' }] }), /candidate identity unavailable/);
    },
  };
}
