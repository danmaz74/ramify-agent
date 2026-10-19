import { checkCommandSchema } from './checks/command-records.js';

import { z } from 'zod';

const text = z.string().min(1);
export const readinessSteps = [
  'project-root', 'scratch-cleanup', 'git-clean', 'compiler-config', 'project-config', 'ramify-daemon',
  'audit-config', 'declared-packages', 'declared-preparation', 'configured-full-audit',
  'run-branch',
] as const;
export const readinessStepSchema = z.enum(readinessSteps);
export type ReadinessStep = z.infer<typeof readinessStepSchema>;

export const readinessAttemptSchema = z.object({
  schema: z.literal('ramify-agent.readiness-attempt/1'),
  /** The count of committed readiness attempts, this one included. */
  attempt: z.int().positive(),
  /** The commit readiness ran on. */
  head: z.string(),
  steps: z.array(z.object({
    step: readinessStepSchema,
    outcome: z.enum(['passed', 'failed', 'not-verified']),
    detail: z.string(),
    command: checkCommandSchema.optional(),
    gate: text.optional(),
  }).strict()),
  /** Independent nested packages found, and what each one answered. */
  nested: z.array(z.object({
    directory: z.string(),
    manifest: text,
    installed: z.boolean(),
    testScript: z.string().nullable(),
  }).strict()),
  /** Present on a configured audit request; the requested and audited sources may differ on reuse. */
  audit: z.object({
    requestedSourceCommit: text, auditedSourceCommit: text.nullable(), reused: z.boolean(),
    reportCommit: text.nullable(), runRef: text.nullable(),
  }).strict().optional(),
  verdict: z.enum(['passed', 'failed']),
  /** The recovery attempted after a failure; null when the failure was not recoverable. */
  recovery: z.string().nullable(),
}).strict();
export type ReadinessAttempt = z.infer<typeof readinessAttemptSchema>;

export const infrastructureRecoverySchema = z.object({
  schema: z.literal('ramify-agent.infrastructure-recovery/1'),
  id: text,
  subject: z.object({
    gate: text.optional(),
    readiness: z.int().positive().optional(),
    invocation: text.optional(),
  }).strict(),
  cause: z.enum(['infrastructure', 'timeout', 'daemon-unavailable']),
  action: z.enum(['restart-daemon', 'reinstall-nested', 'rerun-command', 'reconstruct-session', 'none']),
  /** Counted over committed history for this subject. */
  attempt: z.int().positive(),
  outcome: z.enum(['recovered', 'failed']),
  /** Command output file references. */
  evidence: z.array(z.string()),
}).strict();
export type InfrastructureRecovery = z.infer<typeof infrastructureRecoverySchema>;

export const readinessDirectory = (attempt: number): string => String(attempt).padStart(2, '0');
