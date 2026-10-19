import { expect, test, vi } from 'vitest';
import { observeExternalCandidate, externalCandidateSchema } from '../run/candidate-attribution.js';
import { recordedExternalChanges } from '../run/recovery-gate.js';
import type { RunLog } from '../run/log.js';
import type { CandidateSource } from '../../subs/evidence/src/git.js';

test('quiescent candidate observations preserve partial work separately from subsequent external edits', async () => {
  const write = vi.fn(async () => undefined);
  const treeEntries = vi.fn<CandidateSource['treeEntries']>().mockResolvedValueOnce([
    { path: 'partial.ts', kind: 'file', bytes: 1, objectId: 'partial' },
    { path: 'untouched.ts', kind: 'file', bytes: 1, objectId: 'same' },
  ]).mockResolvedValueOnce([
    { path: 'partial.ts', kind: 'file', bytes: 1, objectId: 'operator-fix' },
    { path: 'untouched.ts', kind: 'file', bytes: 1, objectId: 'same' },
    { path: 'new.ts', kind: 'executable', bytes: 1, objectId: 'new-source' },
  ]);
  const diffNameStatus = vi.fn<CandidateSource['diffNameStatus']>().mockResolvedValue([{ path: 'partial.ts', status: 'M' }]);
  await observeExternalCandidate({ projectRoot: '/scripted', beforeTree: 'settled', afterTree: 'current', acceptedHead: 'accepted', candidates: { treeEntries, diffNameStatus }, write });
  const [event, records] = write.mock.calls[0]! as unknown as [unknown, { body: unknown }[]];
  const body = externalCandidateSchema.parse(records[0]!.body);
  expect(body.beforeDirtyPaths).toEqual(['partial.ts']);
  expect(body.changes).toEqual([
    { path: 'new.ts', before: { path: 'new.ts', hash: null, mode: null }, after: { path: 'new.ts', hash: 'new-source', mode: '100755' } },
    { path: 'partial.ts', before: { path: 'partial.ts', hash: 'partial', mode: '100644' }, after: { path: 'partial.ts', hash: 'operator-fix', mode: '100644' } },
  ]);
  const entries = [{ sequence: 8, transaction: { event, records: [{ ...records[0], path: `candidate-observations/${body.id}.json` }] } }] as unknown as ReturnType<RunLog['ledger']['replay']>;
  expect(recordedExternalChanges(entries)).toEqual([{ sequence: 8, beforeDirtyPaths: ['partial.ts'], changes: body.changes }]);
  expect(diffNameStatus).toHaveBeenCalledWith('/scripted', 'accepted', 'settled');
});

test('unchanged candidates need no observation or source inspection', async () => {
  const treeEntries = vi.fn(), diffNameStatus = vi.fn(), write = vi.fn();
  await observeExternalCandidate({ projectRoot: '/scripted', beforeTree: 'same', afterTree: 'same', acceptedHead: 'accepted', candidates: { treeEntries, diffNameStatus }, write });
  expect(treeEntries).not.toHaveBeenCalled();
  expect(diffNameStatus).not.toHaveBeenCalled();
  expect(write).not.toHaveBeenCalled();
});
