import { z } from 'zod';
import type { JsonSchema } from '../../agent/src/interfaces/port.js';
import { schemaErrors, type SubmissionError, type SubmissionValidation } from '../../task-execution/src/submissions.js';
import { orientationSubmissionSchema, reviewSubmissionSchema, type OrientationSubmission, type ReviewSubmission } from './interfaces/submissions.js';
import { resolveChangedPath, resolveSnapshotPath, type CandidateSnapshot } from './snapshot.js';

/** Submission validation checks report shape and candidate references, not inspection coverage. */

export const reviewToolName = 'submit_review';

export const reviewJsonSchema = z.toJSONSchema(reviewSubmissionSchema, { io: 'input' }) as JsonSchema;
export const reviewSubmissionDescription = 'End this review with your assessment, actionable concerns and meaningful limitations. Choose relevant inspection; no exhaustive file inventory is required. Give each concern a distinct findingKey such as draft:finding:missing-world-companion-exports. A collision returns a field error for correction in this review. An accepted submission ends this invocation.';

/** What the harness observed of this attempt, which the submission is judged against. */
export interface ReviewEvidence {
  readonly snapshot: CandidateSnapshot;
  /** The changed paths a snapshot tool answered the content or patch of during this attempt. */
  readonly inspected: ReadonlySet<string>;
  /** Canonical changed paths whose complete patches were delivered in this attempt's prompt. Summaries and omitted patches do not qualify. */
  readonly deliveredPatches?: ReadonlySet<string>;
  /** Every file `snapshot_read` answered during this attempt, with the hash of its content. */
  readonly read: ReadonlyMap<string, string>;
  readonly maxConcerns: number;
}

export function validateReview(input: unknown, evidence: ReviewEvidence): SubmissionValidation<ReviewSubmission> {
  const parsed = reviewSubmissionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: schemaErrors(parsed.error) };
  const submission = parsed.data;
  const errors: SubmissionError[] = [];

  if (submission.concerns.length > evidence.maxConcerns) {
    errors.push({ path: 'concerns', message: `The run's review policy accepts at most ${evidence.maxConcerns} concerns in one submission`, expected: `at most ${evidence.maxConcerns} items` });
  }

  const names = new Set<string>();
  submission.concerns.forEach((concern, index) => {
    if (names.has(concern.findingKey)) errors.push({ path: `concerns.${index}.findingKey`, message: `"${concern.findingKey}" is proposed twice in this review`, expected: 'a distinct draft:finding:<subject-name> for each concern' });
    names.add(concern.findingKey);
  });

  submission.concerns.forEach((concern, index) => {
    concern.locations.forEach((location, at) => {
      const where = `concerns.${index}.locations.${at}`;
      const resolved = resolveSnapshotPath(evidence.snapshot, location.path);
      const deleted = typeof resolveChangedPath(evidence.snapshot, location.path) === 'string';
      if (!(resolved.ok && resolved.kind === 'file') && !deleted) {
        errors.push({ path: `${where}.path`, message: resolved.ok ? `"${location.path}" is a directory` : resolved.text, expected: 'a file of the candidate, or a path it deleted' });
      }
      if (location.startLine !== null && location.endLine !== null && location.endLine < location.startLine) {
        errors.push({ path: `${where}.endLine`, message: 'The range ends before it starts', expected: `at least ${location.startLine}` });
      }
    });
    if (concern.ground !== null) {
      const resolved = resolveSnapshotPath(evidence.snapshot, concern.ground.path);
      if (!resolved.ok || resolved.kind !== 'file') {
        errors.push({
          path: `concerns.${index}.ground.path`,
          message: resolved.ok
            ? `"${resolved.path}" is a directory`
            : resolved.text,
          expected: 'a file of the candidate, or a null ground',
        });
      }
    }
  });

  return errors.length === 0 ? { ok: true, value: submission } : { ok: false, errors };
}

export const orientationToolName = 'submit_orientation';

export const orientationJsonSchema = z.toJSONSchema(orientationSubmissionSchema, { io: 'input' }) as JsonSchema;

export const orientationSubmissionDescription = 'End this orientation with a short account of relevant guidance; an exhaustive read inventory is optional. The harness validates it; an invalid submission is returned with every error.';

/** An orientation summarizes selected guidance; no exhaustive read inventory is required. */
export function validateOrientation(input: unknown, guidance: readonly string[]): SubmissionValidation<OrientationSubmission> {
  const parsed = orientationSubmissionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: schemaErrors(parsed.error) };
  const errors: SubmissionError[] = [];
  const given = new Set(guidance);
  const named = new Set<string>();
  parsed.data.read.forEach((path, index) => {
    if (!given.has(path)) errors.push({ path: `read.${index}`, message: `"${path}" is not guidance this orientation was given`, expected: `one of: ${guidance.join(', ')}` });
    else if (named.has(path)) errors.push({ path: `read.${index}`, message: `"${path}" is already named`, expected: 'each guidance path once' });
    named.add(path);
  });
  return errors.length === 0 ? { ok: true, value: parsed.data } : { ok: false, errors };
}
