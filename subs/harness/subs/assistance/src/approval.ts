import { createHash } from 'node:crypto';
import { z } from 'zod';
import { canonicalJson } from '../../../src/jobs/commands.js';
import type { CheckFindingState } from '../../check-findings/src/interfaces/check-findings.js';
import { assistedOutcomeSchema, type AssistedAssessment, type AssistedJob, type AssistedOutcome, type AssessmentStage } from './contracts.js';
import { acceptedProtectionExceptions, authorizedProtectionFinding, findingDetails, remainingBriefs, retainedRequirementAnswers, requireCurrentReviewEvidence } from './findings.js';
import { authorizeProtection, type ProtectionComparison } from './protection.js';
import type { AssistedAuditOutcome } from './audit.js';
import type { AssistedReviewSubmission } from '../../reviews/src/assisted.js';

const hash = (value: unknown): string => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const readinessSchema = z.object({
  schema: z.literal('ramify-agent.approval-readiness/1'), assessmentId: z.string(), candidate: z.string(), tree: z.string(),
  baseline: z.string(), planHash: z.string(), requestHash: z.string(), stagesHash: z.string(),
  gaps: z.array(z.string()), blockers: z.array(z.string()),
}).strict();
export const approvalFinalizationSchema = z.object({
  schema: z.literal('ramify-agent.approval-finalization/1'), assessmentId: z.string(), candidate: z.string(),
  baseline: z.string(), tree: z.string(), planHash: z.string(), readinessHash: z.string(),
  commandId: z.string(), finalizedAt: z.iso.datetime(),
  authorities: z.array(z.object({ id: z.string(), revision: z.number(), hash: z.string() }).strict()),
  outcome: assistedOutcomeSchema,
}).strict();
export type ApprovalFinalization = z.infer<typeof approvalFinalizationSchema>;
const prerequisites = (stages: readonly AssessmentStage[]) => stages.filter(stage => stage.name !== 'approval-readiness');
const semanticHash = (value: unknown) => createHash('sha256').update(canonicalJson(value)).digest('hex');
const stagesHash = (stages: readonly AssessmentStage[]) => semanticHash(prerequisites(stages));
const matchesRequest = (request: AssistedAssessment['request'], expected: string) => {
  if (expected === semanticHash(request) || expected === hash(request)) return true;
  // Native iteration admission historically inserted kind before base/candidate;
  // schema reload preserves the values but reconstructs a different key order.
  const { planId, jobId, kind, base, candidate, brief, acceptance, requirementDocuments,
    previousAssessment, reviewReason, iterationId, focusModule, additionalContext, ...rest } = request;
  return expected === hash({ planId, jobId, kind, base, candidate, brief, acceptance, requirementDocuments,
    previousAssessment, reviewReason, iterationId, focusModule, additionalContext, ...rest });
};
const matchesStages = (stages: readonly AssessmentStage[], expected: string) => expected === stagesHash(stages)
  // Historical readiness hashed insertion order. Schema reload may reorder the
  // stage envelope, but neither its evidence nor its completion time changed.
  || expected === hash(prerequisites(stages))
  || expected === hash(prerequisites(stages).map(stage => ({ name: stage.name, evidence: stage.evidence, completedAt: stage.completedAt })));

/** Produced only after source verification, review and reconciliation have completed. */
export function approvalReadiness(input: { assessment: AssistedAssessment; job: AssistedJob; stages: readonly AssessmentStage[];
  tree: string; gaps: readonly string[]; state: CheckFindingState }): z.infer<typeof readinessSchema> {
  return { schema: 'ramify-agent.approval-readiness/1', assessmentId: input.assessment.id, candidate: input.assessment.request.candidate,
    tree: input.tree, baseline: input.job.protection.baselineCommit!, planHash: input.job.plan.sha256,
    requestHash: semanticHash(input.assessment.request), stagesHash: stagesHash(input.stages), gaps: [...input.gaps],
    blockers: [...input.state.findings.values()].filter(entry => entry.standing === 'open').map(entry => entry.id) };
}

/** A recorded choice resolves only typed authority dependencies of this exact reviewed candidate. */
export function finalizeApproval(input: { assessment: AssistedAssessment; job: AssistedJob; assessments: readonly AssistedAssessment[];
  state: CheckFindingState; commandId: string; finalizedAt: string; reviewContinued?: boolean }): ApprovalFinalization | null {
  const { assessment, job, state } = input;
  const parsed = readinessSchema.safeParse(assessment.stages.find(stage => stage.name === 'approval-readiness')?.evidence);
  if (assessment.status !== 'completed' || !assessment.outcome || !parsed.success) return null;
  const readiness = parsed.data;
  if (readiness.assessmentId !== assessment.id || readiness.candidate !== assessment.request.candidate
    || readiness.baseline !== job.protection.baselineCommit || readiness.planHash !== job.plan.sha256
    || !matchesRequest(assessment.request, readiness.requestHash) || !matchesStages(assessment.stages, readiness.stagesHash)) return null;
  const audit = assessment.stages.find(stage => stage.name === 'audit')?.evidence as AssistedAuditOutcome | undefined;
  const review = (assessment.stages.find(stage => stage.name === 'review-accepted') ?? assessment.stages.find(stage => stage.name === 'review'))?.evidence as {
    sourceVerification?: unknown;
    result?: { status: string; value?: AssistedReviewSubmission };
  } | undefined;
  if (review) requireCurrentReviewEvidence(review);
  const reviewPolicy = assessment.stages.find(stage => stage.name === 'review-policy')?.evidence as { mode?: string; previousAssessment?: string } | undefined;
  const deliberatelySkipped = reviewPolicy?.mode === 'not-run' && assessment.request.kind === 'iteration'
    && input.assessments.some(item => {
      if (item.id !== reviewPolicy.previousAssessment || item.status !== 'completed') return false;
      const retained = (item.stages.find(stage => stage.name === 'review-accepted') ?? item.stages.find(stage => stage.name === 'review'))?.evidence as {
        sourceVerification?: unknown; result?: { status: string };
      } | undefined;
      if (retained) requireCurrentReviewEvidence(retained);
      return retained?.result?.status === 'submitted';
    });
  const heldProtection = assessment.stages.find(stage => stage.name === 'protection')?.evidence as ProtectionComparison | undefined;
  if (audit?.state !== 'passed' || audit.requestedSourceCommit !== assessment.request.candidate
    || audit.auditedSourceCommit === null || (!input.reviewContinued && !deliberatelySkipped && (review?.result?.status !== 'submitted' || !review.result.value))
    || heldProtection?.baselineCommit !== readiness.baseline || heldProtection.candidateCommit !== readiness.candidate) return null;
  const protection = authorizeProtection(heldProtection, acceptedProtectionExceptions(state, input.assessments));
  const authorized = (path: string) => protection.changes.some(change => change.path === path && change.authorizedBy !== null);
  const answers = retainedRequirementAnswers(assessment, input.assessments);
  const gaps = [...new Set([...readiness.gaps, ...assessment.outcome.gaps])].filter(gap => !input.reviewContinued || !/^(Required review|Reconciliation) unavailable:/u.test(gap));
  const details = findingDetails(state).filter(detail => !authorizedProtectionFinding(detail.summary, protection));
  const remaining = remainingBriefs(details);
  // A later generic disposition cannot turn a non-protection blocker into approval-only completion.
  for (const id of readiness.blockers) {
    const entry = state.findings.get(id);
    const settlement = entry?.decisions.find(decision => decision.id === entry.settledBy);
    const coordinatorChoice = !entry?.reports.some(report => report.producer === 'review:test-reliability')
      && settlement?.actor.kind === 'agent' && settlement.actor.role === 'assisted-coordinator'
      && (settlement.decision.action === 'waive' || settlement.decision.action === 'defer') && entry?.verification.kind === 'assessment';
    const protectionSupersession = settlement?.actor.kind === 'harness' && settlement.decision.action === 'supersede-protection-request'
      && settlement.decision.assessment === assessment.id && entry?.standing === 'closed'
      && settlement.decision.paths.every(path => protection.changes.some(change => change.path === path && change.authorizedBy !== null));
    if (!coordinatorChoice && !protectionSupersession && (!entry || !authorizedProtectionFinding(entry, protection))) {
      if (!details.some(detail => detail.summary.id === id && detail.summary.standing === 'open'))
        remaining.repairs.push(`Original blocker ${id} requires a fresh assessment.`);
    }
  }
  for (const answer of answers) {
    if (answer.outcome === 'uncertain') gaps.push(`${answer.ref}: ${answer.explanation}`);
    if (answer.outcome === 'unmet' && !(answer.pendingProtection?.length && answer.pendingProtection.every(authorized)))
      remaining.repairs.push(`${answer.ref}: ${answer.explanation}`);
  }
  for (const change of protection.violations) remaining.decisions.push(`Protected change ${change.path} requires an exact authorized exception or restoration.`);
  const evidence = [...assessment.outcome.evidence, `assessments/${assessment.id}/stages/approval-readiness.json`];
  const outcome: AssistedOutcome = { gate: gaps.length ? 'incomplete' : remaining.repairs.length || remaining.decisions.length ? 'action-required' : 'clear',
    summary: gaps.length ? 'Retained assessment has required evidence gaps.' : remaining.repairs.length || remaining.decisions.length
      ? 'Recorded approval leaves other assessment conditions unresolved.' : 'Recorded approval completes the unchanged reviewed candidate.',
    ...remaining, gaps, evidence: [...new Set(evidence)] };
  return { schema: 'ramify-agent.approval-finalization/1', assessmentId: assessment.id, candidate: readiness.candidate,
    baseline: readiness.baseline, tree: readiness.tree, planHash: readiness.planHash, readinessHash: hash(readiness),
    commandId: input.commandId, finalizedAt: input.finalizedAt,
    authorities: protection.changes.flatMap(change => change.authorizedBy === null ? [] : [change.authorizedBy]), outcome };
}
