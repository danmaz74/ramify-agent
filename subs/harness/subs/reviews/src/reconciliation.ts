import { z } from 'zod';
import type { JsonSchema } from '../../agent/src/interfaces/port.js';
import {
  checkFindingCommunicationSchema,
  checkFindingIdSchema,
  checkFindingOptionSchema,
  checkFindingRelationKindSchema,
  checkFindingReportIdSchema,
  checkFindingRiskSchema,
  type CheckFindingAuthority,
  type CheckFindingOwner,
  type CheckFindingActor,
  type CheckFindingReason,
  type CheckFindingRisk,
  type CheckFindingAwaiting,
  type CheckFindingCommand,
  type CheckFindingConflict,
  type CheckFindingDecisionInput,
  type CheckFindingEvidence,
  type CheckFindingId,
  type CheckFindingRejection,
  type CheckFindingSource,
} from '../../check-findings/src/interfaces/check-findings.js';
import { schemaErrors, type SubmissionError, type SubmissionValidation } from '../../task-execution/src/submissions.js';

const prose = z.string().min(1).max(4000);
const reference = z.string().min(1).max(500);

// The fork's submission.

/** A document a user decision cites, and its exact conflicting text. The harness binds its revision. */
const citedConflictSchema = z.object({
  /** An element ID of the run's catalog, such as `fr-002`, or a path of a file in the basis source. */
  document: reference,
  text: prose,
}).strict();

/** What becomes of one CheckFinding, as the fork chooses it. */
export const reconciliationActionSchema = z.discriminatedUnion('action', [
  /** A correction iteration is needed; the CheckFinding stays open with this reconciliation's repair intent. */
  z.object({ action: z.literal('repair') }).strict(),
  /** The concern no longer applies to the changed code: a fresh assessment of the named reports on the current source. */
  z.object({ action: z.literal('fixed'), reassessed: z.array(checkFindingReportIdSchema).min(1).max(100) }).strict(),
  /** The judgment does not hold: a replacing judgment, with no code change claimed. */
  z.object({ action: z.literal('supersede'), reassessed: z.array(checkFindingReportIdSchema).min(1).max(100), replacement: prose }).strict(),
  /** Understood, and the code stays as it is: the risk accepted and the uncertainty. It claims no repair and passes no gate. */
  z.object({ action: z.literal('waive'), acceptedRisk: checkFindingRiskSchema.optional(), uncertainty: prose }).strict(),
  /** Not now: the work item stays responsible, and the condition says when to look again. */
  z.object({ action: z.literal('defer'), revisit: prose }).strict(),
  /** A strong conflict with explicit text only a person can resolve: its exact text and the options. */
  z.object({
    action: z.literal('request-user-decision'),
    conflicts: z.array(citedConflictSchema).min(1).max(20),
    options: z.array(checkFindingOptionSchema).min(2).max(10),
  }).strict(),
  /** Left open by the architect's judgment. It records no decision. */
  z.object({ action: z.literal('leave') }).strict(),
]);
export type ReconciliationAction = z.infer<typeof reconciliationActionSchema>;

export const reconciliationSubmissionSchema = z.object({
  /** How CheckFindings relate. Only `same-issue` groups them; a pair with no plausible match needs no entry. */
  relations: z.array(z.object({
    from: checkFindingIdSchema,
    to: checkFindingIdSchema,
    relation: checkFindingRelationKindSchema,
    /** The shared behavior or violated obligation, and its expected outcome. */
    shared: prose,
    /** What supports it: paths with lines, report IDs, record paths. */
    evidence: z.array(reference).min(1).max(20),
    rationale: prose,
  }).strict()).max(50),
  /** One entry per CheckFinding of the attention set, except those that wait for a user or a check. */
  dispositions: z.array(z.object({
    checkFinding: checkFindingIdSchema,
    rationale: prose,
    /** Quiet by default; `report` makes it a material choice the user sees, with its fix and uncertainty. */
    communication: checkFindingCommunicationSchema,
    /** A correction of the signal's risk level, recorded with the decision; none with `leave`. */
    risk: checkFindingRiskSchema.optional(),
    action: reconciliationActionSchema,
  }).strict()).max(100),
  /** Origin judgments for provider-established unstable tests in the attention set. */
  testOrigins: z.array(z.object({
    checkFinding: checkFindingIdSchema,
    origin: z.enum(['existing', 'added', 'unknown']),
    basis: prose,
    /** Source and intended coverage inspected before closing an added-test repair. */
    coverageEvidence: prose.optional(),
  }).strict()).max(100).optional(),
  /** What the work item does next. */
  next: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('complete') }).strict(),
    z.object({ kind: z.literal('correct'), goal: prose }).strict(),
    z.object({ kind: z.literal('await-user') }).strict(),
    z.object({ kind: z.literal('unresolved') }).strict(),
  ]),
  /** The concise brief the harness appends to the module architect's own session. */
  brief: prose,
}).strict();
export type ReconciliationSubmission = z.infer<typeof reconciliationSubmissionSchema>;
export type ReconciliationNext = ReconciliationSubmission['next']['kind'];

export const reconciliationToolName = 'submit_reconciliation';
export const reconciliationJsonSchema = z.toJSONSchema(reconciliationSubmissionSchema) as JsonSchema;
export const reconciliationSubmissionDescription = 'End this reconciliation with one assessment: the relations you found, one disposition per CheckFinding that needs one, the next action of the work item and a concise brief. The harness validates it; an invalid submission is returned with every error, and a valid one ends this invocation.';

export const boundReconciliationConflictsSchema = z.array(z.object({
    checkFinding: checkFindingIdSchema,
    conflicts: z.array(z.object({ text: prose, document: reference, revision: reference }).strict()),
  }).strict());

/** One CheckFinding of the attention set, as the fork's assessment is judged against it. */
export interface AttentionEntry {
  readonly revision: number;
  readonly reason: CheckFindingReason;
  readonly awaiting: CheckFindingAwaiting | null;
  readonly risk: CheckFindingRisk;
  readonly modules: readonly string[];
}

/** Execution-specific authority around shared judgment validation. */
export interface ExecutionReconciliationContext  {
  readonly id: string;
  /** Actual unavailable advisory review results permit an explicit verification assignment without a finding. */
  readonly unavailableReviews?: boolean;
  readonly attention: ReadonlyMap<CheckFindingId, AttentionEntry>;
  readonly unstableTests?: ReadonlyMap<CheckFindingId, { readonly observedTree: string; readonly observedTrees?: readonly string[] }>;
  readonly held: ReadonlyMap<CheckFindingId, number>;
  readonly actor: CheckFindingActor;
  readonly source: CheckFindingSource;
  readonly evidence: (submission: ReconciliationSubmission) => readonly CheckFindingEvidence[];
  readonly document: (path: string) => Promise<{ readonly text: string; readonly revision: string } | null>;
  readonly decide: (command: CheckFindingCommand) => CheckFindingRejection | null;
  readonly owner: string;
  readonly authority: CheckFindingAuthority;
  readonly responsible: CheckFindingOwner;
  /** A refusal explains this execution's actual authority; null permits the proposed waiver. */
  readonly waiverRefusal: (entry: AttentionEntry) => string | null;
}

/** An accepted submission and what the harness bound for it. */
export interface BoundReconciliation {
  readonly submission: ReconciliationSubmission;
  /** The commands of the assessment, relations first, in submission order. */
  readonly commands: readonly Extract<CheckFindingCommand, { type: 'dispose' | 'relate' }>[];
  readonly conflicts: z.infer<typeof boundReconciliationConflictsSchema>;
}

/** Whether an attention entry needs a disposition: one waiting for a user or a check is not the fork's to decide. */
export const needsDisposition = (entry: Pick<AttentionEntry, 'awaiting'>): boolean => entry.awaiting !== 'user-decision' && entry.awaiting !== 'witness';

/** The next action a set of dispositions leads to. */
export function nextOf(actions: readonly ReconciliationAction['action'][]): ReconciliationNext {
  if (actions.includes('request-user-decision')) return 'await-user';
  if (actions.includes('repair')) return 'correct';
  return actions.includes('leave') ? 'unresolved' : 'complete';
}

/** Shared validation and binding; execution adapters supply factual ownership and authority. */
export async function validateReconciliationForExecution(input: unknown, context: ExecutionReconciliationContext): Promise<SubmissionValidation<BoundReconciliation>> {
  const parsed = reconciliationSubmissionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: schemaErrors(parsed.error) };
  const submission = parsed.data;
  const errors: SubmissionError[] = [];

  submission.relations.forEach((relation, index) => {
    for (const side of ['from', 'to'] as const) {
      if (!context.held.has(relation[side])) {
        errors.push({ path: `relations.${index}.${side}`, message: `${relation[side]} is not a CheckFinding of ${context.owner}`, expected: `one of ${[...context.held.keys()].join(', ') || 'none'}` });
      }
    }
  });

  const disposed = new Map<CheckFindingId, number>();
  const origins = new Map((submission.testOrigins ?? []).map(entry => [entry.checkFinding, entry]));
  for (const [id, unstable] of context.unstableTests ?? []) {
    const origin = origins.get(id);
    const disposition = submission.dispositions.find(entry => entry.checkFinding === id);
    if (origin === undefined) {
      errors.push({ path: 'testOrigins', message: `${id} needs an origin judgment against the original execution baseline`, expected: 'existing, added or unknown with evidence' });
      continue;
    }
    if (disposition === undefined) continue;
    const action = disposition.action.action;
    if (origin.origin === 'existing' && action === 'repair')
      errors.push({ path: 'dispositions', message: `${id} is an existing unstable test and creates no repair assignment`, expected: 'a non-repair disposition preserving the audit verdict' });
    if (origin.origin === 'unknown' && action !== 'leave')
      errors.push({ path: 'dispositions', message: `${id} has unknown origin and must remain qualified uncertainty`, expected: 'leave' });
    if (origin.origin === 'added' && action !== 'repair' && action !== 'fixed')
      errors.push({ path: 'dispositions', message: `${id} is an added unstable test whose reliable coverage is required`, expected: 'repair or verified fixed' });
    if (origin.origin === 'added' && action === 'fixed' &&
      (origin.coverageEvidence === undefined || context.source.kind !== 'tree' ||
        (unstable.observedTrees ?? [unstable.observedTree]).includes(context.source.id)))
      errors.push({ path: 'testOrigins', message: `${id} requires a later candidate without this test's provider-established instability and semantic evidence that reliable coverage was preserved`, expected: 'coverageEvidence on a later source tree without matching instability' });
  }
  for (const origin of submission.testOrigins ?? []) if (!context.unstableTests?.has(origin.checkFinding))
    errors.push({ path: 'testOrigins', message: `${origin.checkFinding} is not a provider-established unstable test in this attention set`, expected: 'an unstable-test finding' });
  submission.dispositions.forEach((disposition, index) => {
    const where = `dispositions.${index}`;
    const entry = context.attention.get(disposition.checkFinding);
    if (entry === undefined) {
      errors.push({ path: `${where}.checkFinding`, message: `${disposition.checkFinding} is not in this reconciliation's attention set`, expected: `one of ${[...context.attention.keys()].join(', ')}` });
    } else if (!needsDisposition(entry)) {
      errors.push({ path: `${where}.checkFinding`, message: `${disposition.checkFinding} waits for ${entry.awaiting === 'user-decision' ? 'a user\'s answer' : 'a check to run again'}; it is not this assessment's to decide`, expected: 'no disposition for it' });
    } else {
      if (disposition.action.action === 'waive') {
        const refusal = context.waiverRefusal(entry);
        if (refusal !== null) errors.push({ path: `${where}.action`, message: `insufficient-authority: ${disposition.checkFinding} ${refusal}`, expected: 'a disposition within the declared authority' });
      }
    }
    if (disposition.action.action === 'leave' && disposition.risk !== undefined) {
      errors.push({ path: `${where}.risk`, message: 'A risk correction is recorded with a decision, and leaving a signal open records none', expected: 'no risk with leave' });
    }
    const earlier = disposed.get(disposition.checkFinding);
    if (earlier !== undefined) errors.push({ path: `${where}.checkFinding`, message: `${disposition.checkFinding} already has the disposition at dispositions.${earlier}`, expected: 'one disposition per CheckFinding' });
    else disposed.set(disposition.checkFinding, index);
  });
  for (const [id, entry] of context.attention) {
    if (needsDisposition(entry) && !disposed.has(id)) {
      errors.push({ path: 'dispositions', message: `${id} is in the attention set and has no disposition`, expected: `a disposition for ${id}` });
    }
  }

  const expected = nextOf(submission.dispositions.map(disposition => disposition.action.action));
  const seeksVerification = context.unavailableReviews === true && expected === 'complete' && submission.next.kind === 'correct';
  if (submission.next.kind !== expected && !seeksVerification) {
    errors.push({
      path: 'next.kind',
      message: expected === 'await-user'
        ? 'A disposition requests a user decision, so the work item waits for the answer'
        : expected === 'correct'
          ? 'A disposition plans a repair, so the work item needs a correction iteration'
          : expected === 'unresolved'
            ? 'A signal is left open, so the work item goes to its gate with it unresolved'
            : 'Every signal is settled or waits for someone else, so the work item goes to its gate',
      expected: `"${expected}"`,
    });
  }

  const conflicts: BoundReconciliation['conflicts'] = [];
  for (const [index, disposition] of submission.dispositions.entries()) {
    if (disposition.action.action !== 'request-user-decision') continue;
    const bound: CheckFindingConflict[] = [];
    for (const [position, conflict] of disposition.action.conflicts.entries()) {
      const document = await context.document(conflict.document);
      const where = `dispositions.${index}.action.conflicts.${position}`;
      if (document === null) {
        errors.push({ path: `${where}.document`, message: `"${conflict.document}" is neither an element of the run's catalog nor a file of the source this reconciliation assesses`, expected: 'an element ID or a path of the source' });
      } else if (!document.text.includes(conflict.text)) {
        errors.push({ path: `${where}.text`, message: `The text is not in "${conflict.document}" as it stands at ${document.revision}; cite the conflicting text exactly`, expected: 'text copied verbatim from the document' });
      } else {
        bound.push({ text: conflict.text, document: conflict.document, revision: document.revision });
      }
    }
    conflicts.push({ checkFinding: disposition.checkFinding, conflicts: bound });
  }
  if (errors.length > 0) return { ok: false, errors };

  const commands = bindCommands(submission, context, conflicts);
  if (commands.length > 0) {
    const rejection = context.decide({ type: 'assess', commands });
    if (rejection !== null) {
      const index = rejection.index ?? 0;
      const relations = submission.relations.length;
      const command = commands[index];
      const disposition = command?.type === 'dispose' ? submission.dispositions.findIndex(entry => entry.checkFinding === command.checkFinding) : -1;
      errors.push({
        path: index < relations ? `relations.${index}` : `dispositions.${disposition}`,
        message: `The CheckFinding rules refuse it (${rejection.code}): ${rejection.message}`,
      });
      return { ok: false, errors };
    }
  }
  return { ok: true, value: { submission, commands, conflicts } };
}

/** The child's commands for one submission, with every trusted field bound by the harness. A signal left open has none. */
function bindCommands(
  submission: ReconciliationSubmission,
  context: ExecutionReconciliationContext,
  conflicts: BoundReconciliation['conflicts'],
): Extract<CheckFindingCommand, { type: 'dispose' | 'relate' }>[] {
  const authority = context.authority;
  const evidence = context.evidence(submission);
  const common = { actor: context.actor, source: context.source, evidence: [...evidence] };
  const relations = submission.relations.map(relation => ({
    type: 'relate' as const,
    relation: {
      ...common,
      from: { checkFinding: relation.from, revision: context.held.get(relation.from) ?? 1 },
      to: { checkFinding: relation.to, revision: context.held.get(relation.to) ?? 1 },
      relation: relation.relation,
      shared: relation.shared,
      evidence: [...evidence, ...relation.evidence.map(ref => ({ kind: 'citation', ref, hash: null }))],
      rationale: relation.rationale,
    },
  }));
  const dispositions = submission.dispositions.flatMap(disposition => {
    const action = disposition.action;
    const entry = context.attention.get(disposition.checkFinding);
    let decision: CheckFindingDecisionInput['decision'];
    switch (action.action) {
      case 'leave': return [];
      case 'repair': decision = { action: 'plan-repair', repair: { kind: 'intent', ref: context.id } }; break;
      case 'fixed': decision = { action: 'fix-by-assessment', reassessed: [...action.reassessed] }; break;
      case 'supersede': decision = { action: 'supersede', reassessed: [...action.reassessed], replacement: action.replacement }; break;
      case 'waive':
        decision = { action: 'waive', authority, acceptedRisk: action.acceptedRisk ?? disposition.risk ?? entry?.risk ?? 'medium', uncertainty: action.uncertainty };
        break;
      case 'defer':
        decision = { action: 'defer', authority, responsible: context.responsible, revisit: { kind: 'condition', condition: action.revisit } };
        break;
      case 'request-user-decision':
        decision = {
          action: 'request-user-decision',
          authority,
          conflicts: [...(conflicts.find(bound => bound.checkFinding === disposition.checkFinding)?.conflicts ?? [])],
          options: action.options.map(option => ({ ...option })),
        };
        break;
    }
    return [{
      type: 'dispose' as const,
      checkFinding: disposition.checkFinding,
      expectedRevision: entry?.revision ?? 1,
      decision: {
        ...common,
        rationale: disposition.rationale,
        communication: disposition.communication,
        ...(disposition.risk === undefined ? {} : { risk: disposition.risk }),
        decision,
      },
    }];
  });
  return [...relations, ...dispositions];
}
