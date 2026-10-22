import type { CandidateSource } from '../../evidence/src/git.js';
import type { SubmissionValidation } from '../../task-execution/src/submissions.js';
import type { ReviewSubmission } from './interfaces/submissions.js';
import { collectReviewDiffPayload } from './diff-payload.js';
import { reviewMessage, type ReviewBriefing } from './message.js';
import { snapshotTools, type SnapshotTools } from './snapshot.js';
import { candidateShell } from './inspection.js';
import { validateReview } from './submission.js';

export interface ReviewPreparation {
  readonly source: CandidateSource;
  readonly projectRoot: string;
  readonly briefing: Omit<ReviewBriefing, 'diffPayload'>;
  readonly maxConcerns: number;
  readonly signal?: AbortSignal;
}

/** One preparation binds its delivered patches and observed tool answers to its validator. */
export interface PreparedReview {
  readonly message: string;
  /** Literal support section for prompt delivery accounting. */
  readonly candidateDiff: string;
  readonly tools: SnapshotTools;
  readonly validate: (input: unknown) => SubmissionValidation<ReviewSubmission>;
}

/** Candidate evidence shared by review callers with different factual briefings. */
export interface CandidateReviewPreparation<T> {
  readonly source: CandidateSource;
  readonly projectRoot: string;
  readonly snapshot: ReviewBriefing['snapshot'];
  readonly maxConcerns: number;
  readonly signal?: AbortSignal;
  /** Final integration review retrieves patches only when useful. Ordinary iteration review still delivers them. */
  readonly includeDiff?: boolean;
  readonly message: (diffPayload: string) => string;
  readonly validate: (value: unknown, evidence: {
    readonly snapshot: ReviewBriefing['snapshot'];
    readonly inspected: ReadonlySet<string>;
    readonly read: ReadonlyMap<string, string>;
    readonly deliveredPatches: ReadonlySet<string>;
    readonly maxConcerns: number;
  }) => SubmissionValidation<T>;
}

/** Collect once, then bind the exact delivered patches and observed reads to validation. */
export async function prepareCandidateReview<T>(input: CandidateReviewPreparation<T>): Promise<Omit<PreparedReview, 'validate'> & {
  readonly validate: (value: unknown) => SubmissionValidation<T>;
}> {
  const tools = snapshotTools(input.snapshot, input.source, input.projectRoot);
  const diff = input.includeDiff === false
    ? { text: 'Cumulative and individual iteration diffs are available on demand through snapshot_diff, shell and assessment_evidence. No patch is embedded in this final review packet.', inlinePaths: [] }
    : await collectReviewDiffPayload(input.snapshot, input.source, input.projectRoot, input.signal);
  const deliveredPatches = new Set(diff.inlinePaths);
  return {
    message: input.message(diff.text),
    candidateDiff: diff.text,
    tools: { ...tools, definitions: [...tools.definitions, candidateShell(input.projectRoot, input.snapshot.commit)] },
    validate: value => input.validate(value, {
      snapshot: input.snapshot, inspected: tools.inspected(), read: tools.read(), deliveredPatches, maxConcerns: input.maxConcerns,
    }),
  };
}

/** The parent supplies the fixed question and owns cancellation; review evidence stays here. */
export async function prepareReview(input: ReviewPreparation): Promise<PreparedReview> {
  return prepareCandidateReview({
    source: input.source, projectRoot: input.projectRoot, snapshot: input.briefing.snapshot,
    maxConcerns: input.maxConcerns, signal: input.signal,
    message: diffPayload => reviewMessage({ ...input.briefing, diffPayload }),
    validate: (value, evidence) => validateReview(value, evidence),
  });
}
