import { z } from 'zod';

export const reviewKindSchema = z.enum(['code', 'scope', 'design']);
export type ReviewKind = z.infer<typeof reviewKindSchema>;

/** The version of the review policy and prompt contract a request is keyed by. */
export const reviewPolicyVersion = 'review-policy/1';

/**
 * How a run reviews its passing iterations: which questions, how many
 * readers beside the one writer, how many requests may wait, how many
 * retries follow an execution or validation failure, how long one attempt
 * may run, how long a work item waits for its reviews from its completion
 * request, and how many concerns one submission may carry.
 */
export const reviewPolicySchema = z.object({
  version: z.literal(reviewPolicyVersion),
  kinds: z.array(reviewKindSchema).min(1),
  concurrency: z.int().positive(),
  queue: z.int().positive(),
  retries: z.int().nonnegative(),
  attemptMs: z.int().positive(),
  settleMs: z.int().positive(),
  maxConcerns: z.int().positive(),
}).strict();
export type ReviewPolicy = z.infer<typeof reviewPolicySchema>;

/**
 * The bounds and commands a run ran under, captured in `job.json` and not
 * configurable while it runs, so that an exhaustion is reproducible.
 */
