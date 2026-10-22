import { z } from 'zod';

const text = z.string().min(1);
const gitTree = z.string().regex(/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/);
/** A non-functional requirement of the plan or a fixed requirement: both are assessed. */
const nfrId = z.string().regex(/^(?:non-functional-requirement|fixed-requirement):[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/);

/** A Git tree OID identifies all source bytes, including dirty changes; HEAD is context only. */
export const candidateSchema = z.object({
  tree: gitTree,
  head: text.nullable(),
  preparedAt: z.iso.datetime(),
}).strict();
export type Candidate = z.infer<typeof candidateSchema>;

export const assessmentResultSchema = z.object({
  nfr: nfrId,
  result: z.enum(['satisfied', 'not-satisfied', 'undetermined']),
  inspectedScope: z.array(text).min(1),
  evidence: z.array(text),
  uncertainty: z.string(),
}).strict();

const assessmentFields = {
  id: z.string().regex(/^nfa-\d{3,}$/),
  candidate: candidateSchema,
  round: z.int().positive(),
  phase: z.enum(['initial', 'after-repair']),
  coordinatorInvocation: text,
  results: z.array(assessmentResultSchema),
  /** Results omitted from reviewed retain the named assessment's judgment and evidence. */
  followUp: z.object({ assessment: text, reviewed: z.array(nfrId) }).strict().optional(),
};
export const assessmentSchema = z.object({ schema: z.literal('ramify-agent.nonfunctional-assessment/2'), ...assessmentFields }).strict();
export type Assessment = z.infer<typeof assessmentSchema>;

/** Every accepted assessment covers the complete fixed NFR set exactly once. */
export function assessmentCoverage(assessment: Assessment, nfrIds: readonly string[]): string[] {
  const expected = new Set(nfrIds);
  const seen = new Set<string>();
  const errors: string[] = [];
  for (const result of assessment.results) {
    if (!expected.has(result.nfr)) errors.push(`unknown ${result.nfr}`);
    if (seen.has(result.nfr)) errors.push(`duplicate ${result.nfr}`);
    seen.add(result.nfr);
  }
  for (const id of expected) if (!seen.has(id)) errors.push(`missing ${id}`);
  return errors;
}

export const roundSchema = z.object({
  schema: z.literal('ramify-agent.nonfunctional-round/1'),
  number: z.int().positive(),
  initial: text,
  investigation: text.nullable(),
  repair: text.nullable(),
  reassessment: text.nullable(),
  outcome: z.enum(['satisfied', 'continue', 'exhausted', 'unavailable']),
}).strict();

export function assessedCandidateMatches(assessment: Assessment, auditedTree: string): boolean {
  return assessment.candidate.tree === auditedTree;
}
