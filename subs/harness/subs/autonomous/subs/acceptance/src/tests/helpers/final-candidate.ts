import { scriptedCandidates } from './candidates.js';

/** Finalization answers: preparation, commit, pre-publication, post-publication. */
export function finalCandidate(root: string, before: string, after = before) {
  const tree = 'a'.repeat(40);
  return {
    previews: [before, before, after, after].map(head => ({ repositoryRoot: root, head, tree })),
    candidates: scriptedCandidates(root, { [after]: { tree, base: before, files: {}, changes: [] } }),
  };
}
