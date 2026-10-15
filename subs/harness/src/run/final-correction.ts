import { z } from 'zod';
import { modulePathSchema } from '../interfaces/protocol/evidence.js';

/** The plan architect selects the owner and next correction after final verification. */
export const finalCorrectionSchema = z.object({
  module: modulePathSchema,
  goal: z.string().min(1),
  rationale: z.string().min(1),
}).strict();
export type FinalCorrection = z.infer<typeof finalCorrectionSchema>;
