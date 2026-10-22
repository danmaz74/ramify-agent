import { reconciliationSubmissionSchema, ReconciliationSubmission, boundReconciliationConflictsSchema, AttentionEntry, BoundReconciliation, needsDisposition, validateReconciliationForExecution } from '../../../../../reviews/src/reconciliation.js';
import { join } from 'node:path';
import { z } from 'zod';

import { checkFindingAtSchema, checkFindingIdSchema, type CheckFindingActor, type CheckFindingAt, type CheckFindingCommand, type CheckFindingEvent, type CheckFindingEvidence, type CheckFindingId, type CheckFindingRejection, type CheckFindingSource } from '../../../../../check-findings/src/interfaces/check-findings.js';
import { architectRefSchema, sessionIdSchema } from '../../../../../task-execution/src/records.js';
import { type SubmissionValidation } from '../../../../../task-execution/src/submissions.js';
import { forkPointSchema, reviewAttemptIdSchema, reviewRequestIdSchema } from './records.js';

/*
 * Work-item reconciliation (Plan 12 appendix §6). When a module work item
 * requests completion, its review requests are settled, and the open and
 * due CheckFindings of the work item are its attention set. An empty set
 * goes to the work item's gate unless an unavailable review result still
 * needs the architect's continuation or verification decision. One fork of the
 * module architect, at the point after its completion request, assesses
 * them together in one submission: how they relate, what becomes of each,
 * how each decision is communicated, and what the work item does next.
 *
 * The fork supplies judgments only. The harness binds the actor, the
 * source, the authority, the expected revisions, the repair intent and the
 * revision of every document a user decision cites, and the CheckFinding
 * child decides whether each transition is valid. Everything here is pure:
 * the run service reads the log, the documents and the state, and commits.
 */

const text = z.string().min(1);
const prose = z.string().min(1).max(4000);
const reference = z.string().min(1).max(500);

/** `work-item:preview-resolver.rc01`: the work item's reconciliation round. */
export const reconciliationId = (workItem: string, round: number): string => `${workItem}.rc${String(round).padStart(2, '0')}`;
export const reconciliationIdSchema = z.string().regex(/^.+\.rc\d{2,}$/);
/** The work item a reconciliation belongs to, from its ID. */
export const workItemOfReconciliation = (id: string): string => id.slice(0, id.lastIndexOf('.rc'));
/** A reconciliation's directory, `01`, from its ID. */
const roundDirectory = (id: string): string => id.slice(id.lastIndexOf('.rc') + 3);

/** Where each reconciliation record is materialized, under the run directory. */
export const reconciliationLayout = {
  basis: (id: string): string => join('work-items', workItemOfReconciliation(id), 'reconciliations', roundDirectory(id), 'basis.json'),
  assessment: (id: string): string => join('work-items', workItemOfReconciliation(id), 'reconciliations', roundDirectory(id), 'assessment.json'),
} as const;

/** The audited source a basis is captured on: the accepted commit and its tree. */
export const reconciliationSourceSchema = z.object({ commit: text, tree: text }).strict();
export type ReconciliationSource = z.infer<typeof reconciliationSourceSchema>;

/** One settled review request of the work item, with the attempt that settled it. */
export const basisRequestSchema = z.object({
  request: reviewRequestIdSchema,
  attempt: reviewAttemptIdSchema.nullable(),
  result: z.enum(['complete', 'partial', 'not-verified']),
}).strict();
export type BasisRequest = z.infer<typeof basisRequestSchema>;

/**
 * What one reconciliation round is captured on: the audited source, the
 * work item's settled requests with their terminal attempts, the complete
 * attention set at its revisions, the deferrals the harness found due, the
 * CheckFinding state version, and the point the assessment forks.
 */
export const reconciliationBasisSchema = z.object({
  schema: z.literal('ramify-agent.reconciliation-basis/1'),
  id: reconciliationIdSchema,
  workItem: text,
  round: z.int().positive(),
  source: reconciliationSourceSchema,
  requests: z.array(basisRequestSchema),
  checkFindings: z.array(checkFindingAtSchema),
  due: z.array(checkFindingIdSchema),
  applied: z.int().nonnegative(),
  forkPoint: forkPointSchema,
  /** Legacy field retained for old basis records; every round now permits correction. */
  floor: z.enum(['any', 'non-low', 'none']),
}).strict();
export type ReconciliationBasis = z.infer<typeof reconciliationBasisSchema>;

/**
 * The committed assessment: the fork's submission, what the harness bound
 * for it, the decisions it made, and the brief appended to the module
 * architect's session, which is `parent` where one was kept.
 */
export const reconciliationAssessmentSchema = z.object({
  schema: z.literal('ramify-agent.reconciliation-assessment/1'),
  id: reconciliationIdSchema,
  workItem: text,
  round: z.int().positive(),
  invocation: text,
  session: sessionIdSchema,
  requestedStart: z.enum(['fresh', 'fork']),
  actualStart: z.enum(['fresh', 'fork']).nullable(),
  submission: reconciliationSubmissionSchema,
  /** Each user decision's conflicts as the harness bound them: document, revision and verbatim text. */
  conflicts: boundReconciliationConflictsSchema,
  next: z.enum(['complete', 'correct', 'await-user', 'unresolved']),
  /** The CheckFindings its decisions changed, and the decisions and relations it made, by ID. */
  checkFindings: z.array(checkFindingIdSchema),
  decisions: z.array(z.string()),
  relations: z.array(z.string()),
  parent: architectRefSchema.nullable(),
  brief: z.string(),
}).strict();
export type ReconciliationAssessment = z.infer<typeof reconciliationAssessmentSchema>;

export const reconciliationSchemas = {
  reconciliationBasis: { schema: 'ramify-agent.reconciliation-basis/1', body: reconciliationBasisSchema },
  reconciliationAssessment: { schema: 'ramify-agent.reconciliation-assessment/1', body: reconciliationAssessmentSchema },
} as const;

// The events' data. The run log imports these.

export const reconciliationStartedDataSchema = z.object({
  workItem: text,
  reconciliation: reconciliationIdSchema,
  round: z.int().positive(),
}).strict();

export const reconciliationAssessedFields = {
  workItem: text,
  reconciliation: reconciliationIdSchema,
  invocation: text,
  next: z.enum(['complete', 'correct', 'await-user', 'unresolved']),
} as const;

/** How the brief append to the module architect's session ended. */
export const briefAppendOutcomeSchema = z.enum(['appended', 'already-present', 'session-lost', 'failed', 'no-session']);
export type BriefAppendOutcome = z.infer<typeof briefAppendOutcomeSchema>;

export const reconciliationBriefAppendedDataSchema = z.object({
  reconciliation: reconciliationIdSchema,
  session: sessionIdSchema.nullable(),
  ref: text.nullable(),
  outcome: briefAppendOutcomeSchema,
  reason: z.string().nullable(),
}).strict();

/** A basis that no longer held: at the assessment's commit, at the work item's completion, or a fork that returned none. */
export const reconciliationRefusedDataSchema = z.object({
  workItem: text,
  reconciliation: reconciliationIdSchema.nullable(),
  stage: z.enum(['assessment', 'completion']),
  reason: text,
}).strict();

/** Why a CheckFinding of a completed work item was left open (appendix §6). */
export const unresolvedReasonSchema = z.enum(['rounds-exhausted', 'below-floor', 'raised-after-last-round', 'left-open']);
export type UnresolvedReason = z.infer<typeof unresolvedReasonSchema>;

/** Each CheckFinding a work item completed with open, and why; `work-item-completed` carries them. */
export const unresolvedField = z.array(z.object({ checkFinding: checkFindingIdSchema, reason: unresolvedReasonSchema }).strict()).max(500);

// Authority.

/**
 * Whether a module architect has waive authority over these modules: each is
 * its work item's module or a module beneath it (appendix §10).
 */
export function withinModule(module: string, modules: readonly string[]): boolean {
  return modules.every(entry => entry === module || entry.startsWith(`${module}/`));
}

// Validation and binding.

/** What a submission is judged against, all bound by the harness. */
export interface ReconciliationContext {
  readonly id: string;
  readonly workItem: string;
  /** The work item's module, the bound of the module architect's waive authority. */
  readonly module: string;
  /** The attention set of the basis. */
  /** Actual unavailable advisory review results permit an explicit verification assignment without a finding. */
  readonly unavailableReviews?: boolean;
  readonly attention: ReadonlyMap<CheckFindingId, AttentionEntry>;
  /** Every CheckFinding of the work item at its current revision, which a relation may name. */
  readonly held: ReadonlyMap<CheckFindingId, number>;
  readonly actor: CheckFindingActor;
  readonly source: CheckFindingSource;
  /** The evidence every decision and relation cites: the assessment's submission. */
  readonly evidence: (submission: ReconciliationSubmission) => readonly CheckFindingEvidence[];
  /** A cited document's text and the revision the harness names it by; null for one it cannot read. */
  readonly document: (path: string) => Promise<{ readonly text: string; readonly revision: string } | null>;
  /**
   * The child's decision of the bound command against the state as it
   * stands, or null where the basis no longer holds: the commit then
   * refuses it as stale and starts a new round.
   */
  readonly decide: (command: CheckFindingCommand) => CheckFindingRejection | null;
}

/**
 * Whether a round after the first is warranted: any signal needing a
 * disposition receives the architect's assessment, regardless of risk.
 */
export function needsLaterRound(attention: Iterable<AttentionEntry>): boolean {
  return [...attention].some(entry => needsDisposition(entry));
}

/**
 * Validates one reconciliation submission: the strict schema, then every
 * rule the schema cannot hold. Each named CheckFinding belongs to the work
 * item; every one of the attention set that needs a disposition has
 * exactly one; a waiver only over the work item's
 * own module; the next action agrees with the dispositions; each cited
 * conflict's text is in the document it names; and the child accepts the
 * whole assessment against the state as it stands.
 */
export async function validateReconciliation(input: unknown, context: ReconciliationContext): Promise<SubmissionValidation<BoundReconciliation>> {
  return validateReconciliationForExecution(input, {
    ...context,
    owner: context.workItem,
    authority: { kind: 'work-item-assessment', ref: context.id },
    responsible: { kind: 'work-item', workItem: context.workItem },
    waiverRefusal: entry => withinModule(context.module, entry.modules) ? null
      : `concerns ${entry.modules.join(', ')}, and this architect may waive only within ${context.module}`,
  });
}

/**
 * The brief appended to the module architect's session: what was decided,
 * by the durable IDs of the decisions and relations, what was left open,
 * the next action and the fork's own account. It is appended without a
 * model call.
 */
export function briefText(parts: {
  readonly id: string;
  readonly round: number;
  readonly source: ReconciliationSource;
  readonly submission: ReconciliationSubmission;
  readonly events: readonly CheckFindingEvent[];
}): string {
  const lines = [`Reconciliation ${parts.id} (round ${parts.round}) of the work item at ${parts.source.commit} decided:`];
  for (const event of parts.events) {
    if (event.type === 'check-finding-decided') lines.push(`- ${event.data.checkFinding}: ${event.data.decision.decision.action} (${event.data.decision.id})`);
    if (event.type === 'check-finding-related') {
      const relation = event.data.relation;
      lines.push(`- ${relation.from.checkFinding} ${relation.relation} ${relation.to.checkFinding} (${relation.id})`);
    }
  }
  const left = parts.submission.dispositions.filter(disposition => disposition.action.action === 'leave').map(disposition => disposition.checkFinding);
  if (left.length > 0) lines.push(`- left open: ${left.join(', ')}`);
  const next = parts.submission.next;
  lines.push(next.kind === 'correct'
    ? `Next: a correction iteration. ${next.goal}`
    : next.kind === 'await-user' ? 'Next: the work item waits for a user decision.' : 'Next: the work item goes to its gate.');
  lines.push('', parts.submission.brief);
  return lines.join('\n');
}

/** The attention set as its `CheckFindingAt` list, in its attention order. */
export const attentionAt = (attention: ReadonlyMap<CheckFindingId, Pick<AttentionEntry, 'revision'>>): CheckFindingAt[] =>
  [...attention].map(([checkFinding, entry]) => ({ checkFinding, revision: entry.revision }));

/**
 * Why a captured basis no longer holds (appendix §6), or null when it
 * does: the audited source, every request settled by the attempt it names,
 * and every basis CheckFinding at its captured revision. A CheckFinding that
 * needs attention and is not in the basis is the caller's to weigh.
 */
export function basisChange(
  captured: { readonly source: ReconciliationSource; readonly requests: readonly BasisRequest[]; readonly checkFindings: readonly CheckFindingAt[] },
  current: {
    readonly source: ReconciliationSource;
    readonly requests: readonly BasisRequest[];
    readonly unsettled: readonly string[];
    readonly revisions: ReadonlyMap<CheckFindingId, number>;
  },
): string | null {
  if (captured.source.commit !== current.source.commit || captured.source.tree !== current.source.tree) {
    return `the audited source is ${current.source.commit}, not ${captured.source.commit}`;
  }
  if (current.unsettled.length > 0) return `${current.unsettled.join(', ')} ${current.unsettled.length === 1 ? 'is' : 'are'} not settled`;
  const requestKey = (request: BasisRequest) => `${request.request}:${request.attempt ?? '-'}:${request.result}`;
  const before = new Set(captured.requests.map(requestKey));
  const now = current.requests.map(requestKey);
  const changedRequests = now.filter(key => !before.has(key));
  if (changedRequests.length > 0 || now.length !== before.size) {
    return `the work item's settled review requests changed: ${changedRequests.join(', ') || `${before.size} captured, ${now.length} now`}`;
  }
  for (const entry of captured.checkFindings) {
    const revision = current.revisions.get(entry.checkFinding);
    if (revision !== entry.revision) return `${entry.checkFinding} is at revision ${revision ?? 'none'}, not ${entry.revision}`;
  }
  return null;
}
