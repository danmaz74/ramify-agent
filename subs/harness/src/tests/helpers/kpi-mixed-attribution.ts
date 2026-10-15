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
// A later accepted edit shifts its surviving additions to FINAL positions 5/6.
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
        ...(mode === 'reverted' ? [] : [{ line: 5, hash: hash('setup-new\n'), originCommit: mixed, originPath: path, originLine: 2, boundary: false }]),
        { line: 6, hash: hash('writer-new\n'), originCommit: mixed, originPath: path, originLine: 3, boundary: false },
      ],
      baseDeleted: [
        ...(mode === 'reverted' ? [] : [{ line: 2, hash: hash('setup-old\n'), lastSeenCommit: base, sourceBeforePath: path, sourceBeforeLine: 2, removingCommit: mixed }]),
        { line: 3, hash: hash('writer-old\n'), lastSeenCommit: base, sourceBeforePath: path, sourceBeforeLine: 3, removingCommit: mixed },
      ],
    }],
  };
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
    return [
      { before: path, after: path, binary: false, added: this.mode === 'reverted' ? [[6, 1]] : [[5, 2]], deleted: this.mode === 'reverted' ? [[3, 1]] : [[2, 2]] },
      { before: overlap, after: overlap, binary: false, added: [[1, 2]], deleted: [] },
    ]; // src/reverted.ts is absent from the direct BASE-to-accepted-FINAL diff.
  }
  async lineOrigins(root: string, from: string, to: string, name: string, ranges: readonly GitLineRange[]) {
    this.check(`origins ${name}`, root, from, to);
    assert.ok(name === path || name === overlap);
    assert.deepEqual(ranges, name === overlap ? [[1, 2]] : this.mode === 'reverted' ? [[6, 1]] : [[5, 2]]);
    return (name === overlap ? [1, 2] : this.mode === 'reverted' ? [6] : [5, 6]).map(line => ({ line, commit: mixed, boundary: false }));
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
      identities = verifySetupLineIdentities(mixedSetupInput());
      assert.deepEqual(identities, { base, final, entries: [{ commit: mixed, path, added: [5], deleted: [2] }] });
    },
    async exercise() { assert.ok(identities); result = await calculate('surviving', identities); },
    exact() {
      const answer = measured(result);
      assert.equal(answer.harness, 2);
      assert.deepEqual([...answer.weights], [['writer-mixed', 2]]);
    },
    async reverts() {
      assert.equal(measured(result).weights.has('writer-reverted'), false);
      const empty = verifySetupLineIdentities(mixedSetupInput('reverted'));
      assert.deepEqual(empty, { base, final, entries: [{ commit: mixed, path, added: [], deleted: [] }] });
      const answer = measured(await calculate('reverted', empty));
      assert.equal(answer.harness, 0); assert.deepEqual([...answer.weights], [['writer-mixed', 2]]);
      assert.deepEqual([...answer.unattributed], [[`commit 111111111111 has uncertain overlapping writer attribution in src/overlap.ts`, 2]]);
    },
    async uncertainty() {
      assert.deepEqual([...measured(result).unattributed], [[`commit 111111111111 has uncertain overlapping writer attribution in src/overlap.ts`, 2]]);
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
