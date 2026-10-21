import { z } from 'zod';
import { jobIdSchema, planIdSchema } from '../../../src/interfaces/protocol/ids.js';
import { commandIdSchema } from '../../../src/interfaces/protocol/jobs.js';
import { jobSchemaVersion } from '../../../src/jobs/records.js';
import type { CheckFindingCommand, CheckFindingState } from '../../check-findings/src/interfaces/check-findings.js';

export const assistedProtectionSchema = z.object({
  baselineCommit: z.string().regex(/^[a-f0-9]{40}$|^[a-f0-9]{64}$/).nullable(),
  rules: z.object({ explicitPaths: z.array(z.string()), excludedPaths: z.array(z.string()), guardedPaths: z.array(z.string()), additions: z.enum(['protect', 'allow']) }).strict(),
  gaps: z.array(z.object({ path: z.string(), state: z.enum(['staged', 'unstaged', 'untracked']) }).strict()),
  unavailable: z.string().nullable(),
}).strict();
export type AssistedProtection = z.infer<typeof assistedProtectionSchema>;

/** The assisted execution and assessment contracts are owned by the harness. */
export const assistedJobSchema = z.object({
  schema: z.literal(jobSchemaVersion),
  kind: z.literal('assisted'),
  planId: planIdSchema,
  jobId: jobIdSchema,
  createdAt: z.iso.datetime(),
  projectRoot: z.string().min(1),
  plan: z.object({ path: z.string(), storedAt: z.literal('input/plan.md'), sha256: z.string().regex(/^[a-f0-9]{64}$/) }).strict(),
  /** Absent in retained jobs and fresh default registrations: counted findings. */
  identityContract: z.enum(['legacy', 'descriptive']).optional(),
  /** Registered Git baseline and protected-source declaration, when available. */
  protection: assistedProtectionSchema,
}).strict();
export type AssistedJob = z.infer<typeof assistedJobSchema>;

export const assessmentIdSchema = z.string().regex(/^as-\d{4,}$/);
const commitSchema = z.string().regex(/^[a-f0-9]{40}$|^[a-f0-9]{64}$/);
export const iterationIdSchema = z.string().regex(/^it-[a-f0-9-]{36}$/);
const modulePathSchema = z.string().min(1).refine(path => path === '.' || !path.startsWith('/') && !path.includes('\\')
  && !path.includes('\0') && path.split('/').every(part => part !== '' && part !== '.' && part !== '..'), 'Module path must be project-relative');
export const assistedIterationSchema = z.object({
  schema: z.literal('ramify-agent.iteration/1'), id: iterationIdSchema, planId: planIdSchema, jobId: jobIdSchema,
  startedAt: z.iso.datetime(), base: commitSchema, brief: z.string().min(1), focusModule: modulePathSchema.nullable(),
  provenance: z.object({
    baseSource: z.enum(['head', 'explicit']), requestedBase: z.string().min(1).nullable(),
    checkoutHead: commitSchema.nullable(), checkoutHeadAfter: commitSchema.nullable(),
    cleanliness: z.enum(['clean', 'dirty', 'unknown']), cleanlinessError: z.string().nullable(),
  }).strict(),
}).strict();
export type AssistedIteration = z.infer<typeof assistedIterationSchema>;
const iterationIds = { planId: planIdSchema, jobId: jobIdSchema, commandId: commandIdSchema };
export const iterationRequestSchema = z.discriminatedUnion('action', [
  z.object({ ...iterationIds, action: z.literal('start'), brief: z.string().min(1), focusModule: modulePathSchema.nullable(), base: z.string().min(1).optional() }).strict(),
  z.object({ ...iterationIds, action: z.literal('end'), iterationId: iterationIdSchema, candidate: commitSchema,
    acceptance: z.array(z.string().min(1)).default([]),
    requirementDocuments: z.array(z.object({ path: z.string().min(1), revision: z.string().min(1) }).strict()).default([]),
    previousAssessment: assessmentIdSchema.optional(),
  reviewReason: z.string().trim().min(1).optional(), additionalContext: z.string().min(1).optional(),
  }).strict(),
]);
export type IterationRequest = z.infer<typeof iterationRequestSchema>;
const assessmentRequestBaseSchema = z.object({
  planId: planIdSchema,
  jobId: jobIdSchema,
  base: z.string().regex(/^[a-f0-9]{40}$|^[a-f0-9]{64}$/),
  candidate: z.string().regex(/^[a-f0-9]{40}$|^[a-f0-9]{64}$/),
  kind: z.enum(['iteration', 'final']),
  brief: z.string().min(1),
  acceptance: z.array(z.string().min(1)),
  planBaseline: z.string().regex(/^[a-f0-9]{40}$|^[a-f0-9]{64}$/).optional(),
  requirementDocuments: z.array(z.object({ path: z.string().min(1), revision: z.string().min(1) }).strict()).default([]),
  previousAssessment: assessmentIdSchema.optional(),
  reviewReason: z.string().trim().min(1).optional(),
  commandId: commandIdSchema,
}).strict();
export const assessmentRequestSchema = assessmentRequestBaseSchema.superRefine((value, context) => {
  if (value.kind === 'final' && value.planBaseline === undefined) context.addIssue({ code: 'custom', path: ['planBaseline'], message: 'Final assessment requires the original plan baseline' });
});
export type AssessmentRequest = z.infer<typeof assessmentRequestSchema>;

export const assessmentStageSchema = z.object({
  name: z.string().regex(/^[a-z][a-z0-9-]*$/),
  completedAt: z.iso.datetime(),
  evidence: z.unknown(),
}).strict();
export type AssessmentStage = z.infer<typeof assessmentStageSchema>;

export const assistedOutcomeSchema = z.object({
  gate: z.enum(['clear', 'action-required', 'incomplete']),
  summary: z.string().min(1),
  repairs: z.array(z.string()),
  decisions: z.array(z.string()),
  gaps: z.array(z.string()),
  evidence: z.array(z.string()),
}).strict();
export type AssistedOutcome = z.infer<typeof assistedOutcomeSchema>;

export const assistedAssessmentSchema = z.object({
  schema: z.literal('ramify-agent.assessment/1'),
  id: assessmentIdSchema,
  planId: planIdSchema,
  jobId: jobIdSchema,
  requestedAt: z.iso.datetime(),
  request: assessmentRequestBaseSchema.omit({ commandId: true }).extend({
    iterationId: iterationIdSchema.optional(), focusModule: modulePathSchema.nullable().optional(), additionalContext: z.string().min(1).optional(),
  }),
  status: z.enum(['queued', 'running', 'interrupted', 'cancelled', 'completed']),
  revision: z.int().positive(),
  stages: z.array(assessmentStageSchema),
  outcome: assistedOutcomeSchema.nullable(),
  error: z.string().nullable(),
  /** Absent in historical records and unfinished assessments. */
  completedAt: z.iso.datetime().optional(),
}).strict();
export type AssistedAssessment = z.infer<typeof assistedAssessmentSchema>;

export interface AssistedEvidenceReference { readonly path: string; readonly sha256: string }

export interface AssessorContext {
  readonly projectRoot: string;
  readonly job: AssistedJob;
  readonly assessment: AssistedAssessment;
  readonly planMarkdown: string;
  readonly signal: AbortSignal;
  /** Durable stage checkpoint; a repeated stage name updates its latest evidence. */
  checkpoint(name: string, evidence: unknown): Promise<void>;
  /** Immutable evidence beside the ledger; checkpoints retain its verified reference. */
  retainEvidence(evidence: unknown): Promise<AssistedEvidenceReference>;
  readEvidence(reference: AssistedEvidenceReference): Promise<unknown>;
  /** Existing stages allow an interrupted assessment to skip settled work. */
  stages(): readonly AssessmentStage[];
  assessments(): readonly AssistedAssessment[];
  findingState(): CheckFindingState;
  recordFindings(commands: readonly CheckFindingCommand[], key?: string): Promise<void>;
}
export type Assessor = (context: AssessorContext) => Promise<AssistedOutcome>;

export interface AssistanceOptions {
  readonly projectRoot: string;
  readonly assessor?: Assessor;
  readonly registrationProtection?: (projectRoot: string, planId: string, policy?: {
    readonly explicitPaths?: readonly string[]; readonly excludedPaths?: readonly string[];
    readonly guardedPaths?: readonly string[]; readonly additions?: 'protect' | 'allow';
  }) => Promise<AssistedProtection>;
  readonly resolveCommit?: (projectRoot: string, revision: string) => Promise<string>;
  readonly currentHead?: (projectRoot: string) => Promise<string>;
  readonly isCleanRepository?: (projectRoot: string) => Promise<boolean>;
  readonly now?: () => Date;
}
