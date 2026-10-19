import { checkCommandSchema } from './checks/command-records.js';

import { recordRefSchema } from '../../../../task-execution/src/records.js';
import { z } from 'zod';

import { ownershipPreflightSchema } from '../../../../../src/interfaces/protocol/runs.js';

import type { GateAttempt } from './checks/records.js';

const text = z.string().min(1);
const checkKindSchema = z.enum(['setup', 'ramify-check', 'type-check', 'configured']);

/** A rule the harness verified itself over the tree, beside the commands it ran. */
export const gateRuleSchema = z.object({
  rule: z.enum(['fake-naming', 'fake-exposure-parity', 'scratch-safety', 'write-scope']),
  outcome: z.enum(['passed', 'failed']),
  violations: z.array(z.object({ rule: text, path: text, detail: text }).strict()),
  /** What the rule could not establish, or found and did not attribute to this attempt; absent when nothing. */
  limits: z.array(text).optional(),
}).strict();

const gateAuditCountSchema = z.object({ total: z.int().nonnegative(), passed: z.int().nonnegative(), failed: z.int().nonnegative(), skipped: z.int().nonnegative() }).strict();
const gateAuditReuseSchema = z.object({
  auditedCommit: text,
  ignoredChangedPaths: z.array(z.string()),
  requestedMode: z.enum(['full', 'ramify-partial']),
  resolution: z.enum(['requested', 'defaulted']),
}).strict();

/** One project of a nested audit: its verdict, execution, failures, counts and record identities. */
const gateAuditProjectRecordSchema = z.object({
  projectRoot: text,
  verdict: z.enum(['pass', 'fail', 'indeterminate']),
  execution: z.enum(['ran', 'reused', 'not-run']),
  status: z.enum(['completed', 'failed', 'cancelled', 'refused']),
  failures: z.array(z.string()),
  requestId: text,
  auditedSourceCommit: text.nullable(),
  requestedMode: z.enum(['full', 'ramify-partial']).nullable(),
  executedMode: z.enum(['full', 'ramify-partial']).nullable(),
  fallbackReason: z.string().nullable(),
  reuse: gateAuditReuseSchema.nullable(),
  evidence: z.object({ runRef: text, reportCommit: text, treeRef: text }).strict().nullable(),
  retrievalCommands: z.array(z.string()),
  durationSeconds: z.number().nonnegative().nullable(),
  counts: z.object({ checks: gateAuditCountSchema, tests: gateAuditCountSchema.nullable(), scenarios: gateAuditCountSchema.nullable() }).strict().nullable(),
  detail: z.string(),
}).strict();

/** What nested discovery skipped, with reasons, and what it could not decide. */
const gateAuditDiscoverySchema = z.object({
  status: z.enum(['complete', 'indeterminate']),
  skipped: z.array(z.object({
    projectRoot: text, enclosingProject: text,
    reason: z.enum(['external', 'output', 'repository', 'packages', 'generated']), directory: text,
  }).strict()),
  unavailable: z.array(z.object({ enclosingProject: text, reason: z.string(), definitions: z.array(z.string()) }).strict()),
}).strict();

/** What a committing gate asked of the committed audit and what the provider answered. */
const gateAuditRecordSchema = z.object({
  requestId: text,
  mode: z.enum(['project-default', 'full']),
  status: z.enum(['completed', 'failed', 'cancelled', 'refused']),
  definition: z.object({ path: z.string(), blob: z.string() }).strict(),
  requestedSourceCommit: text,
  auditedSourceCommit: text.nullable(),
  requestedMode: z.enum(['full', 'ramify-partial']).nullable(),
  executedMode: z.enum(['full', 'ramify-partial']).nullable(),
  fallbackReason: z.string().nullable(),
  reuse: z.object({
    auditedCommit: text,
    ignoredChangedPaths: z.array(z.string()),
    requestedMode: z.enum(['full', 'ramify-partial']),
    resolution: z.enum(['requested', 'defaulted']),
  }).strict().nullable(),
  verdict: z.enum(['pass', 'fail', 'indeterminate']).nullable(),
  detail: z.string(),
  nested: z.boolean(),
  projects: z.array(gateAuditProjectRecordSchema).nullable(),
  discovery: gateAuditDiscoverySchema.nullable(),
}).strict();

export const gateAttemptSchema = z.object({
  schema: z.literal('ramify-agent.gate-attempt/3'),
  id: text,
  checkpoint: z.enum(['readiness', 'iteration', 'contract', 'breaking-iteration', 'work-item', 'final']),
  subject: z.object({ workItem: text.optional(), iteration: text.optional() }).strict(),
  proposedBy: z.string().nullable(),
  repairRound: z.int().nonnegative(),
  infrastructureAttempt: z.int().nonnegative(),
  head: z.string(),
  commit: z.string().nullable(),
  audited: z.string().nullable(),
  evidence: z.object({ runRef: text, reportCommit: text, treeRef: text }).strict().nullable(),
  /** Exact producer result and published check payload. */
  provider: z.object({ result: z.unknown(), checks: z.unknown() }).strict().optional(),
  /** A committing gate's configured audit request and the provider's answer. */
  audit: gateAuditRecordSchema.optional(),
  guardedChanges: z.array(z.object({
    path: text,
    before: z.string().nullable(),
    after: z.string().nullable(),
    authorizedBy: recordRefSchema.nullable(),
  }).strict()),
  /** Rules the harness verified itself; absent for a checkpoint that has none. */
  ownershipPreflight: ownershipPreflightSchema.optional(),
  rules: z.array(gateRuleSchema).optional(),
  commands: z.array(z.object({
    kind: checkKindSchema,
    providerCheckId: text.optional(),
    /** A setup command's declared name. */
    name: text.optional(),
    command: checkCommandSchema,
    startedAt: z.string(),
    elapsedMs: z.int().nonnegative(),
    lockWaitMs: z.int().nonnegative().optional(),
    exitCode: z.int().nullable(),
    outcome: z.enum(['passed', 'failed', 'not-verified']),
    notVerified: z.enum(['timeout', 'runner-error', 'command-missing', 'interrupted', 'setup-failed', 'local-rule-failed']).optional(),
    runnerError: z.object({ kind: z.string(), message: z.string() }).strict().nullable(),
    output: z.object({ path: z.string(), bytes: z.int().nonnegative(), truncated: z.boolean(), tail: z.string() }).strict(),
    /** How ramify-audit stopped the command's process tree, in words; absent where it did not stop it. */
    stopped: text.optional(),
    /** The command's output streams stayed open after it ended, so what it printed may be incomplete. */
    outputIncomplete: z.literal(true).optional(),
  }).strict()),
  verdict: z.enum(['passed', 'failed', 'not-verified']),
  cause: z.enum(['check-failed', 'infrastructure', 'timeout', 'guarded-change', 'unknown']).nullable(),
  next: z.enum(['accept', 'repair', 'retry-infrastructure', 'return-to-local-architect', 'exhausted']),
}).strict();

/** Exact overall result supplied by the external auditor, independent of the gate verdict. */
export const gateAuditOutcomeSchema = z.object({
  schema: z.literal('ramify-agent.gate-audit-outcome/1'),
  gate: text,
  overall: z.enum(['pass', 'fail', 'indeterminate']),
  audited: text,
}).strict();

/** The reader and the engine's own type describe one record; this keeps them so. */
const _gateAttemptsAgree: GateAttempt = undefined as unknown as z.infer<typeof gateAttemptSchema>;
void _gateAttemptsAgree;

/** Durable input for a committing gate, written before its commit and audit effect. */
export const gateOperationSchema = z.object({
  schema: z.literal('ramify-agent.gate-operation/2'),
  /** A new-policy final effect cannot outlive its exact assessed candidate. */
  finalAssessment: z.object({ assessment: text, candidate: text, tree: z.string().regex(/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/u) }).strict().optional(),
  checkpoint: z.enum(['iteration', 'contract', 'breaking-iteration', 'work-item', 'final']),
  request: z.object({
    id: text,
    runId: text,
    projectRoot: text,
    directory: text,
    head: z.string(),
    /** The mode the gate requests of the committed audit, and the bound of the request. */
    audit: z.object({ mode: z.enum(['project-default', 'full']), nested: z.boolean().optional(), timeoutMs: z.int().positive().optional() }).strict(),
    subject: z.object({ workItem: text.optional(), iteration: text.optional() }).strict(),
    proposedBy: z.string().nullable(),
    repairRound: z.int().nonnegative(),
    infrastructureAttempt: z.int().nonnegative(),
    limits: z.object({ repairRounds: z.int().positive(), infrastructureRetries: z.int().positive() }).strict(),
  }).strict(),
  guardedChanges: z.array(z.object({
    path: text, before: z.string().nullable(), after: z.string().nullable(), authorizedBy: recordRefSchema.nullable(),
  }).strict()),
  rules: z.array(gateRuleSchema),
  unauthorized: z.boolean(),
  ruleFailed: z.boolean(),
  timeoutMs: z.int().positive(),
  message: z.string(),
}).strict();
export type GateOperation = z.infer<typeof gateOperationSchema>;

// Where each record lives beneath the run's directory.

/** The absolute directory of one run, `plans/<plan-id>/.harness/jobs/<run-id>/`. */

/**
 * Every path of the run layout. The record paths are relative to the run's
 * directory, which is the ledger's records root, so a path that would leave
 * it is refused before anything is written.
 */

export const gateAttemptId = (count: number): string => `ga-${String(count).padStart(4, '0')}`;
