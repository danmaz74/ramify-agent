import { z } from 'zod';
import { modulePathSchema } from '../../../../../src/interfaces/protocol/evidence.js';

/** The plan architect selects the owner and next correction after final verification. */
export const finalCorrectionSchema = z.object({
  module: modulePathSchema,
  goal: z.string().min(1),
  rationale: z.string().min(1),
  workItemKey: z.string().regex(/^draft:work-item:[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .describe('Propose draft:work-item:<correction-goal-name>; an accepted ID is invalid here.'),
}).strict();
export type FinalCorrection = z.infer<typeof finalCorrectionSchema>;
