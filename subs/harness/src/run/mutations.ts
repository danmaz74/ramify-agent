import { OwnershipUnavailableError } from '../../subs/evidence/src/ownership-evidence.js';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { isContained } from '../guard/resolve-contained-path.js';
import { placementOutcome } from '../guard/write-guard.js';
import type { GuardedScope } from '../guard/write-guard.js';
import type { ObservationLog } from '../../subs/task-execution/src/observations.js';

/*
 * What a writer changed, as the tree reports it.
 *
 * Two observations describe it and they answer different questions. One is
 * made for each settled mutating call, whether the call succeeded or not,
 * and names the paths the harness knows that call asked for. The other is
 * made once, when the writer settles: `git status` gives every path changed
 * since the last accepted commit, which is the only way a write no guard saw
 * becomes visible. No new machinery is needed for it, and none is added.
 *
 * Comparing that snapshot with the write scope fills
 * `InvocationOutcome.outsideScope`. Shell changes are observed after execution;
 * the committing gate applies this same boundary before accepting a candidate.
 */

export class MutationPlacementUnavailableError extends Error {}

/** What the tree said when the writer settled. */
export interface MutationSnapshot {
  /** Every path changed since the last accepted commit, project-relative. */
  readonly paths: readonly string[];
  /** Those of them that lie outside the write scope this invocation held. */
  readonly outsideScope: readonly string[];
  readonly unknownPlacement: readonly string[];
  readonly placementFailure?: string;
  /** Why the snapshot could not be taken, where it could not. */
  readonly failure: string | null;
}

export interface MutationSnapshotRequest {
  readonly projectRoot: string;
  /** What `git status` reports; the caller supplies it so that the tree is read in one place. */
  readonly changed: () => Promise<readonly string[]>;
  /** The scope this writer held, or undefined for an invocation that held none. */
  readonly scope: GuardedScope | undefined;
}

/**
 * The snapshot one settled writer leaves. A repository that cannot answer
 * leaves its reason, and neither an empty list nor an empty `outsideScope`
 * is then reported as evidence.
 */
export async function takeMutationSnapshot(request: MutationSnapshotRequest): Promise<MutationSnapshot> {
  let paths: readonly string[];
  try {
    paths = await request.changed();
  } catch (error) {
    return { paths: [], outsideScope: [], unknownPlacement: [], failure: error instanceof Error ? error.message : String(error) };
  }
  const relatives = [...new Set(paths.map(path => toRelative(request.projectRoot, path)))].sort();
  return {
    paths: relatives,
    ...(request.scope === undefined ? { outsideScope: [...relatives], unknownPlacement: [] } : await classifyMutations(request.projectRoot, request.scope, relatives)),
    failure: null,
  };
}

/**
 * Check logical and resolved physical placement through the provider. A deleted
 * path resolves through its nearest existing ancestor; deleting outside the
 * scope is as much an outside change as writing there.
 */
export async function outsideScope(projectRoot: string, scope: GuardedScope, paths: readonly string[]): Promise<string[]> {
  const result = await classifyMutations(projectRoot, scope, paths);
  // Acceptance callers require current placement, even with no known violation.
  if (result.ownershipFailure !== undefined) throw new OwnershipUnavailableError(result.ownershipFailure);
  if (result.unknownPlacement.length > 0) throw new MutationPlacementUnavailableError(`Current physical placement unresolved: ${result.unknownPlacement.join(', ')}`);
  return result.outsideScope;
}

export async function classifyMutations(projectRoot: string, scope: GuardedScope, paths: readonly string[]): Promise<{ outsideScope: string[]; unknownPlacement: string[]; placementFailure?: string; placementFailureStatus?: string; ownershipFailure?: import('../../subs/evidence/src/ownership-evidence.js').OwnershipUnavailableError['result'] }> {
  const placements = await placementOutcome(scope, projectRoot, paths);
  const outsideScope: string[] = [], unknownPlacement: string[] = [];
  paths.forEach((path, position) => {
    const absolute = resolve(projectRoot, path);
    const captured = scope.files.includes(absolute) || scope.roots.some(root => isContained(root, absolute));
    if (!captured) outsideScope.push(path);
    else if (placements.unknown?.[position]) unknownPlacement.push(path);
    else if (!placements.allowed[position]) outsideScope.push(path);
  });
  return { outsideScope, unknownPlacement, ...(placements.ownershipFailure === undefined ? {} : { ownershipFailure: placements.ownershipFailure }), ...(placements.error === undefined ? {} : { placementFailure: placements.error, ...(placements.failureStatus === undefined ? {} : { placementFailureStatus: placements.failureStatus }) }) };
}

/** Project-relative and forward-slashed, which is how every record names a path. */
export function toRelative(projectRoot: string, path: string): string {
  const inside = relative(projectRoot, isAbsolute(path) ? path : resolve(projectRoot, path));
  return inside.split(sep).join('/');
}

/**
 * Takes the snapshot one settled writer leaves and records it: the changed
 * paths as a `mutation` observed by the snapshot, or the gap when the tree
 * could not be read. It is the only observation that sees a write no guard
 * saw, and nothing here blocks anything.
 */
export async function recordSettledSnapshot(request: MutationSnapshotRequest, observations: ObservationLog): Promise<MutationSnapshot> {
  const snapshot = await takeMutationSnapshot(request);
  if (snapshot.failure !== null) {
    await observations.record({
      type: 'coverage-gap',
      data: { kind: 'changed-paths-unknown', detail: `the tree could not be read when the writer settled (${snapshot.failure})` },
    });
    return snapshot;
  }
  await observations.record({
    type: 'mutation',
    data: {
      callId: null,
      paths: [...snapshot.paths],
      added: null,
      deleted: null,
      observedBy: 'snapshot',
      toolFailed: false,
      // The snapshot covers everything since the last accepted commit,
      // which may include an earlier session of the same work, so it is
      // not one call's doing.
      attributable: false,
    },
  });
  return snapshot;
}
