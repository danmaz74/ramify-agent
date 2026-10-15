import { z } from 'zod';

/** Compaction is an opportunity to reconsider, never evidence of failed progress. */
export const compactionReviewSchema = z.object({
  action: z.enum(['continue', 'handoff']),
  reason: z.string().min(1),
}).strict();
