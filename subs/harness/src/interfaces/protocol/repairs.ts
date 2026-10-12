import { z } from 'zod';

const text = z.string().min(1);
const timestamp = z.iso.datetime();

/** An automatic project repair identity, separate from infrastructure recovery. */
export const repairIncidentIdSchema = z.string().regex(/^apr-\d{4,}$/);
export type RepairIncidentId = z.infer<typeof repairIncidentIdSchema>;

/** The lifecycle transition the harness committed, independent of run completion. */
export const repairIncidentStageSchema = z.enum(['refused', 'admitted', 'running', 'blocked', 'unverified', 'continued', 'interrupted']);
export type RepairIncidentStage = z.infer<typeof repairIncidentStageSchema>;

/** A repair engineer's judgment; readiness still needs harness verification. */
export const repairResultSchema = z.object({
  outcome: z.enum(['ready', 'blocked']),
  summary: text,
  checks: z.array(text),
  remainingWork: z.array(text),
  suspectedCause: text.nullable(),
  evidence: z.array(text),
}).strict();
export type RepairResult = z.infer<typeof repairResultSchema>;

export const repairExportStateSchema = z.object({
  externalRef: text,
  state: z.enum(['pending', 'exported', 'conflict']),
  issueId: text.nullable(),
  reason: text.nullable(),
  attemptedAt: timestamp.nullable(),
}).strict().refine(value => value.state !== 'exported' || value.issueId !== null, 'An exported incident must name its Beads task');
export type RepairExportState = z.infer<typeof repairExportStateSchema>;

/** The exact candidate evidence captured around the repair writer. */
export const repairCandidateSchema = z.object({
  head: text.nullable(),
  tree: text.nullable(),
  staged: z.array(text),
  unstaged: z.array(text),
  untracked: z.array(text),
  /** Aggregate paths when the candidate provider does not separate index categories. */
  changedPaths: z.array(text).default([]),
  evidence: z.array(text),
}).strict();
export type RepairCandidate = z.infer<typeof repairCandidateSchema>;

/** Retained evidence of a harness obstruction and its bounded repair attempt. */
export const repairIncidentRecordSchema = z.object({
  schema: z.literal('ramify-agent.repair-incident/1'),
  incidentId: repairIncidentIdSchema,
  revision: z.int().positive(),
  createdAt: timestamp,
  preparation: z.object({ id: text, path: text }).strict(),
  operation: text,
  workItem: text,
  originalInvocation: text.nullable(),
  originalAssignment: text.nullable(),
  originalResult: text.nullable(),
  harnessError: z.object({ name: text, message: z.string(), stack: z.string().nullable(), evidence: z.array(text) }).strict(),
  admission: z.object({ admitted: z.boolean(), reason: text }).strict(),
  authority: z.object({ assignment: text.nullable(), scopeEvidence: z.array(text) }).strict(),
  candidateBefore: repairCandidateSchema,
  candidateAfter: repairCandidateSchema.nullable(),
  invocation: text.nullable(),
  session: text.nullable(),
  result: repairResultSchema.nullable(),
  verification: z.object({ verified: z.boolean(), reason: text, evidence: z.array(text) }).strict().nullable(),
  continuation: z.object({ delivered: z.boolean(), reason: text, evidence: z.array(text) }).strict().nullable(),
  startedAt: timestamp.nullable(),
  endedAt: timestamp.nullable(),
  elapsedMs: z.number().nonnegative().nullable(),
  usage: z.object({
    inputTokens: z.number().nonnegative().nullable(), outputTokens: z.number().nonnegative().nullable(),
    totalTokens: z.number().nonnegative().nullable(), cost: z.number().nonnegative().nullable(),
  }).strict().nullable(),
  versions: z.record(z.string(), z.string()),
  export: repairExportStateSchema,
}).strict();
export type RepairIncidentRecord = z.infer<typeof repairIncidentRecordSchema>;

/** A committed incident revision with the lifecycle transition that published it. */
export const repairIncidentViewSchema = repairIncidentRecordSchema.extend({
  stage: repairIncidentStageSchema,
  updatedAt: timestamp,
}).strict();
export type RepairIncidentView = z.infer<typeof repairIncidentViewSchema>;

export const automaticRepairsSchema = z.object({
  attempted: z.int().nonnegative(),
  refused: z.int().nonnegative(),
  incidents: z.array(repairIncidentViewSchema),
}).strict();
export type AutomaticRepairs = z.infer<typeof automaticRepairsSchema>;
