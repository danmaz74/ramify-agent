import type { CandidateSource } from '../../evidence/src/git.js';
import type { CheckFindingGround, CheckFindingReportCredibility } from '../../check-findings/src/interfaces/check-findings.js';
import { resolveSnapshotPath, type CandidateSnapshot, type SnapshotTools } from './snapshot.js';
import type { ReviewSubmission } from './interfaces/submissions.js';
import { candidateModuleIndex, concernModules } from './signals.js';
const message = (error: unknown): string => error instanceof Error ? error.message : String(error);

/** What the harness binds to one concern of a valid submission. */
export interface ConcernBinding {
  readonly ground: CheckFindingGround | null;
  readonly credibility: CheckFindingReportCredibility;
  readonly modules: readonly string[];
}

/** Where a review's concerns are bound: the project, its candidates and the plan the run belongs to. */
export interface ConcernContext {
  readonly projectRoot: string;
  readonly planId: string;
  readonly candidates: CandidateSource;
  warn(text: string): void;
}

/** Shared source binding; wrappers supply ownership fallback and actual document provenance. */
export async function bindCandidateConcerns(
  context: ConcernContext,
  snapshot: CandidateSnapshot,
  tools: Pick<SnapshotTools, 'read'>,
  submission: ReviewSubmission,
  workItemModule: string | null,
  credibility: (path: string | null) => CheckFindingReportCredibility,
): Promise<ConcernBinding[]> {
  const index = await candidateModuleIndex(context.candidates, context.projectRoot, snapshot).catch(error => {
    context.warn(`Module declarations at ${snapshot.commit} could not be read: ${message(error)}`);
    return null;
  });
  const read = tools.read();
  return submission.concerns.map(concern => {
    const resolved = concern.ground === null ? null : resolveSnapshotPath(snapshot, concern.ground.path);
    const path = resolved?.ok === true ? resolved.path : null;
    const hash = path === null ? undefined : read.get(path);
    const ground = path === null || hash === undefined ? null : { ref: path, hash };
    return {
      ground,
      credibility: credibility(ground?.ref ?? null),
      modules: concernModules(index, concern.locations, workItemModule),
    };
  });
}
