import { z } from 'zod';
import type { CandidateSource } from '../../../../evidence/src/git.js';
import type { RecordRef } from '../../../../../src/jobs/commit.js';
import type { RunEventInput } from '../../../src/run/log.js';
import { recoveryHash } from '../../../src/run/recovery-admission.js';

const text = z.string().min(1);
const file = z.object({ path: text, hash: text.nullable(), mode: text.nullable() }).strict();
export const externalCandidateSchema = z.object({
  schema: z.literal('ramify-agent.external-candidate/1'), id: text,
  beforeTree: text, afterTree: text, beforeDirtyPaths: z.array(text),
  changes: z.array(z.object({ path: text, before: file, after: file }).strict()),
}).strict();
export type ExternalCandidate = z.infer<typeof externalCandidateSchema>;
export const externalCandidatePath = (id: string): string => `candidate-observations/${id}.json`;

/** Observe changes made while no task writer held the candidate. This supplies attribution, never authority. */
export async function observeExternalCandidate(input: {
  readonly projectRoot: string;
  readonly beforeTree: string;
  readonly afterTree: string;
  readonly acceptedHead: string;
  readonly candidates: Pick<CandidateSource, 'treeEntries' | 'diffNameStatus'>;
  readonly write: (event: RunEventInput, records: readonly RecordRef[]) => Promise<unknown>;
}): Promise<void> {
  if (input.beforeTree === input.afterTree) return;
  const [before, after, dirty] = await Promise.all([
    input.candidates.treeEntries(input.projectRoot, input.beforeTree),
    input.candidates.treeEntries(input.projectRoot, input.afterTree),
    input.candidates.diffNameStatus(input.projectRoot, input.acceptedHead, input.beforeTree),
  ]);
  const files = (entries: typeof before) => new Map(entries.map(entry => {
    if (entry.objectId === undefined) throw new Error(`Candidate object identity is unavailable for ${entry.path}`);
    return [entry.path, { path: entry.path, hash: entry.objectId, mode: ({ file: '100644', executable: '100755', symlink: '120000', submodule: '160000' } as const)[entry.kind] }];
  }));
  const original = files(before), current = files(after);
  const changes = [...new Set([...original.keys(), ...current.keys()])].sort().flatMap(path => {
    const prior = original.get(path) ?? { path, hash: null, mode: null };
    const next = current.get(path) ?? { path, hash: null, mode: null };
    return prior.hash === next.hash && prior.mode === next.mode ? [] : [{ path, before: prior, after: next }];
  });
  const id = recoveryHash({ before: input.beforeTree, after: input.afterTree, accepted: input.acceptedHead });
  const body = externalCandidateSchema.parse({ schema: 'ramify-agent.external-candidate/1', id,
    beforeTree: input.beforeTree, afterTree: input.afterTree, beforeDirtyPaths: dirty.map(change => change.path), changes });
  await input.write({ type: 'external-candidate-observed', data: { id, beforeTree: input.beforeTree, afterTree: input.afterTree } },
    [{ path: externalCandidatePath(id), id, revision: 1, body }]);
}
