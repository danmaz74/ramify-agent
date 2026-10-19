import { z } from 'zod';

export const contextPolicySchema = z.object({
  compaction: z.enum(['forbidden', 'allowed']),
  budgetTokens: z.int().positive().nullable(),
  budgetFraction: z.number().positive().max(1).nullable(),
  reportReserveTokens: z.int().nonnegative(),
}).strict();

/** The review questions a run can ask of one audited iteration candidate. */
