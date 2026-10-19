import { runPolicySchema } from '../../../autonomous/src/run/records.js';

import { z } from 'zod';

import { jobIdSchema, planIdSchema } from '../../../../src/interfaces/protocol/ids.js';

import { jobSchemaVersion } from '../../../../src/jobs/records.js';

const text = z.string().min(1);
const timestamp = z.iso.datetime();
export const manualRunRecordSchema = z.object({
  schema: z.literal(jobSchemaVersion),
  jobId: jobIdSchema,
  planId: planIdSchema,
  kind: z.literal('manual'),
  createdAt: timestamp,
  /** The project's real path when the run was created. */
  projectRoot: text,
  /** The commit HEAD named when the run was created; `''` outside Git. */
  base: z.string(),
  /** The candidate branch the run's invocations work on, or null where it made none, as a session's does not. */
  branch: text.nullable(),
  /** What started it: `step run` or the `session` command. */
  origin: z.enum(['step-run', 'session']),
  policy: runPolicySchema,
}).strict();
export type ManualRunRecord = z.infer<typeof manualRunRecordSchema>;
