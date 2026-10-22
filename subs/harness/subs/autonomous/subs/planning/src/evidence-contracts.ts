import { z } from 'zod';

const text = z.string().min(1);
const documentId = z.string().regex(/^document:[a-z0-9]+(?:-[a-z0-9]+)*$/);

/**
 * The intake's accepted judgment of which captured plan documents supply
 * binding scenarios, and of every missing reference; capture alone never
 * incorporates text.
 */
const incorporationFields = {
  documents: z.array(z.object({
    document: documentId,
    scenarios: z.boolean(),
    uncertainty: z.string(),
  }).strict()),
  missing: z.array(z.object({
    from: documentId, target: text,
    source: z.object({ start: z.int().nonnegative(), end: z.int().positive() }).strict(),
    judgment: z.enum(['required', 'unclear', 'advisory']), reason: text,
  }).strict()),
} as const;
export const submittedIncorporationSchema = z.object(incorporationFields).strict();
export const incorporationSchema = z.object({
  schema: z.literal('ramify-agent.document-incorporation/3'),
  ...incorporationFields,
}).strict().superRefine((record, ctx) => {
  record.documents.forEach((choice, index) => {
    if (!choice.document.startsWith('document:'))
      ctx.addIssue({ code: 'custom', path: ['documents', index, 'document'], message: 'document ID disagrees with incorporation contract' });
  });
});
export type Incorporation = z.infer<typeof incorporationSchema>;
export type SubmittedIncorporation = Omit<Incorporation, 'schema'>;
