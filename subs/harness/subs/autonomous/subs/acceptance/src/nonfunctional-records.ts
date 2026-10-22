import { z } from 'zod';
import { writeScopeSchema } from '../../../../../src/work/scope.js';
import { elementIdSchema } from '../../../../plan-evidence/src/interfaces/catalog.js';
import { candidateSchema } from '../../../../nonfunctional/src/interfaces/contracts.js';

const text = z.string().min(1);

export const deviationOriginSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('work-item-conflict'), request: text, workItem: text, architectInvocation: text }).strict(),
  z.object({ kind: z.literal('nonfunctional-assessment'), nfr: z.string().regex(/^(?:non-functional-requirement|fixed-requirement):[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/), assessment: text, candidate: candidateSchema, coordinatorInvocation: text }).strict(),
]);

export const preparedCandidateSchema = z.object({
  schema: z.literal('ramify-agent.prepared-candidate/1'),
  candidate: candidateSchema,
  scenarioRenderingHash: z.string().regex(/^[0-9a-f]{64}$/),
  writerSettled: z.literal(true),
}).strict();

/** Authority for exactly one project-wide repair batch in a numbered round. */
export const nonfunctionalRepairAssignmentSchema = z.object({
  schema: z.literal('ramify-agent.nonfunctional-repair-assignment/1'),
  id: text, round: z.int().positive().max(3), assessment: text, candidate: text,
  nfrs: z.array(z.string().regex(/^(?:non-functional-requirement|fixed-requirement):[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/)).min(1),
  startingModule: text, task: text, evidence: z.array(text), uncertainty: z.string(),
  scope: writeScopeSchema, guarded: z.array(z.object({ path: text, hash: text.nullable() }).strict()),
}).strict();
export type NonfunctionalRepairAssignment = z.infer<typeof nonfunctionalRepairAssignmentSchema>;

/** A read-only projection; absent Plan 13 evidence is unavailable. */
export const mergeReadinessSchema = z.object({
  status: z.enum(['ready', 'pending-review', 'rejected', 'gate-failed', 'unavailable']),
  candidate: candidateSchema.nullable(),
  finalGate: text.nullable(),
  checkFindings: z.array(text),
  reason: text,
}).strict();
export type MergeReadiness = z.infer<typeof mergeReadinessSchema>;

/** A deviation retains exactly the source obligation it changes. */
const nonfunctionalDeviationFields = {
  id: text,
  origin: z.object({ kind: z.literal('nonfunctional-assessment'), nfr: text, assessment: text, candidate: candidateSchema, coordinatorInvocation: text }).strict(),
  /** The requirement as the frozen catalog holds it. */
  element: z.object({ id: elementIdSchema, document: text, text }).strict(),
  evidence: z.array(text),
  uncertainty: z.string(),
  proposedAlternative: z.string(),
  checkFinding: text,
};
export const nonfunctionalDeviationSchema = z.object({ schema: z.literal('ramify-agent.nonfunctional-deviation/2'), ...nonfunctionalDeviationFields,
  id: z.string().regex(/^plan-deviation:[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/),
  checkFinding: z.string().regex(/^finding:[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/),
}).strict();
