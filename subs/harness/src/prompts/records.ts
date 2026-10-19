import { z } from 'zod';

import { sha256Schema } from '../interfaces/protocol/evidence.js';

import { roleSchema } from '../interfaces/protocol/runs.js';

const text = z.string().min(1);
export const promptPackageManifestSchema = z.object({
  schema: z.literal('ramify-agent.prompt-manifest/1'),
  packages: z.partialRecord(roleSchema, z.object({
    package: text,
    hash: sha256Schema,
    files: z.array(z.object({
      path: text,
      hash: sha256Schema,
      kind: z.enum(['system', 'procedure', 'skill', 'submission-schema']),
    }).strict()),
    /** The submission union members this package offers the role. */
    submissionKinds: z.array(text),
  }).strict()),
}).strict();
export type PromptPackageManifest = z.infer<typeof promptPackageManifestSchema>;
