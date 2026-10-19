import { z } from 'zod';

const text = z.string().min(1);
export const checkCommandSchema = z.object({
  argv: z.array(z.string()),
  cwd: text,
  env: z.array(z.string()),
  envAdditions: z.record(z.string(), z.string()),
  timeoutMs: z.int().positive(),
}).strict();

/** The context and compaction policy of one role. */

export type CheckCommandRecord = z.infer<typeof checkCommandSchema>;
