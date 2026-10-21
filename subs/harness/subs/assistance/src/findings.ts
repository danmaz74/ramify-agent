import type { CheckFindingCommand, CheckFindingDetailView, CheckFindingEvidence, CheckFindingState, CheckFindingSummary, CheckFindingVerification } from '../../check-findings/src/interfaces/check-findings.js';
import { selectCheckFindings } from '../../check-findings/src/queries.js';
import { reportCommand } from '../../../src/check-findings/report.js';
import type { ConcernBinding } from '../../reviews/src/concern-binding.js';
import type { AssistedReviewSubmission } from '../../reviews/src/assisted.js';
import type { AssistedAuditOutcome } from './audit.js';
import type { ProtectionComparison, ProtectedException } from './protection.js';
import type { AssistedAssessment } from './contracts.js';
import { createHash } from 'node:crypto';
import { canonicalJson } from '../../../src/jobs/commands.js';

/** Reopen only the agent settlement whose retained proof was rejected.
 * A later settlement or an actual user decision keeps its own authority.
 */
export function unverifiedSemanticClosures(input: {
  state: CheckFindingState; commands: readonly CheckFindingCommand[]; evidence: CheckFindingEvidence;
}): Array<{ settlement: string; command: CheckFindingCommand }> {
  return input.commands.flatMap(command => {
    if (command.type !== 'dispose' || command.decision.actor.kind !== 'agent'
      || !['fix-by-assessment', 'supersede'].includes(command.decision.decision.action)) return [];
    const entry = input.state.findings.get(command.checkFinding);
    if (!entry || entry.verification.kind !== 'assessment' || entry.standing !== 'closed') return [];
    const closing = entry.decisions.find(decision => decision.id === entry.settledBy);
    if (!closing) return [];
    const { id, considered, ...held } = closing;
    if (considered !== command.expectedRevision || canonicalJson(held) !== canonicalJson(command.decision)) return [];
    return [{ settlement: id, command: { type: 'dispose' as const, checkFinding: entry.id, expectedRevision: entry.revision,
      decision: { actor: { kind: 'harness' as const, reason: `Exact source proof for agent settlement ${id} was rejected` }, source: closing.source,
        rationale: 'The original settlement is retained, but its candidate evidence cannot be verified. A fresh semantic assessment is required.',
        evidence: [input.evidence], communication: { mode: 'quiet' as const }, decision: { action: 'reopen' as const, cause: { kind: 'decision' as const } } } } }];
  });
}

/** All current findings come from the existing domain projection, never another issue store. */
export function findingDetails(state: CheckFindingState): CheckFindingDetailView[] {
  return [...state.findings.keys()].map(checkFinding => {
    const selected = selectCheckFindings(state, { kind: 'detail', checkFinding });
    if (!selected.ok || selected.view.kind !== 'detail') throw new Error(`Cannot project finding ${checkFinding}`);
    return selected.view;
  });
}

export function reportReviewConcerns(input: {
  assessment: string; tree: string; report: AssistedReviewSubmission; bindings: readonly ConcernBinding[]; evidence: CheckFindingEvidence;
}): CheckFindingCommand[] {
  if (input.report.concerns.length !== input.bindings.length) throw new Error('Every review concern requires its candidate evidence binding');
  return input.report.concerns.map((concern, index) => {
    const bound = input.bindings[index]!;
    return reportCommand({ producer: 'review:code', attempt: input.assessment, reportKey: `concern-${index + 1}`,
      owner: { kind: 'run' }, source: { kind: 'tree', id: input.tree }, issueKey: null,
      verification: { kind: 'assessment' },
      observation: { kind: 'review-concern', summary: concern.summary, evidence: [input.evidence], locations: concern.locations },
      judgment: { actor: { kind: 'agent', role: 'assisted-reviewer', invocation: input.assessment },
        consequence: concern.consequence, rationale: concern.rationale, uncertainty: concern.uncertainty,
        remedy: concern.remedy, risk: concern.risk, ground: bound.ground },
      suggests: concern.suggests, credibility: bound.credibility, modules: [...bound.modules],
    });
  });
}

/** Provider instability is an observed reliability question, independent of review coverage. */
export function reportAuditInstability(input: {
  state: CheckFindingState; assessment: string; tree: string;
  observations: readonly { key: string; detail: string; path?: string | null }[]; evidence: CheckFindingEvidence;
}): CheckFindingCommand[] {
  return input.observations.flatMap((observation, index) => {
    const issueKey = `audit-instability-${observation.key}`;
    const summary = `Provider-established test instability: ${observation.detail}`.slice(0, 4000);
    if ([...input.state.findings.values()].some(entry => entry.reports.some(report => report.producer === 'review:test-reliability'
      && report.issueKey === issueKey) && (entry.standing === 'open'
        || entry.decisions.find(decision => decision.id === entry.settledBy)?.decision.action === 'supersede'))) return [];
    return [reportCommand({
      producer: 'review:test-reliability', attempt: input.assessment, reportKey: `instability-${index + 1}`,
      owner: { kind: 'run' }, source: { kind: 'tree', id: input.tree }, issueKey,
      verification: { kind: 'assessment' },
      observation: { kind: 'review-concern', summary,
        evidence: [input.evidence], locations: observation.path ? [{ path: observation.path, startLine: null, endLine: null }] : [] },
      judgment: { actor: { kind: 'harness', reason: 'Provider evidence requires plan-origin judgment' },
        consequence: 'Determine whether this unstable test was added by the plan; added tests require reliable verification.',
        rationale: 'The audit provider established instability, but it did not determine test origin.',
        uncertainty: 'Compare the individual test with the original execution baseline, including additions to existing files.',
        remedy: 'If added by this plan, repair or replace the test while preserving coverage; if existing, retain the provider verdict without assigning repair.',
        risk: 'medium', ground: null }, suggests: null, credibility: 'ungrounded', modules: [],
    })];
  });
}

/** Factual findings can close only with a matching, complete check witness on this candidate. */
export function factualFindingCommands(input: {
  state: CheckFindingState; assessment: string; tree: string; audit: AssistedAuditOutcome;
  protection: ProtectionComparison; protectionSelection: string; evidence: CheckFindingEvidence; protectionEvidence?: CheckFindingEvidence;
}): CheckFindingCommand[] {
  const commands: CheckFindingCommand[] = [];
  const auditSelection = input.audit.result?.definition.blob;
  const checks: Array<{ subject: string; producer: `check:${string}`; selection: string; failed: boolean; passed: boolean; summary: string; path?: string }> = [];
  if (auditSelection !== undefined) checks.push({ subject: 'configured-audit', producer: 'check:audit', selection: auditSelection,
    failed: input.audit.state === 'failed', passed: input.audit.state === 'passed', summary: input.audit.detail });
  const currentPaths = new Set(input.protection.violations.map(change => change.path));
  const protectedPaths = new Set([...currentPaths, ...[...input.state.findings.values()].flatMap(entry =>
    entry.verification.kind === 'check' && entry.verification.producer === 'check:protection'
      ? [entry.verification.obligation.subject.slice('protected:'.length)] : [])]);
  for (const path of protectedPaths) checks.push({ subject: `protected:${path}`, producer: 'check:protection', selection: input.protectionSelection,
    failed: currentPaths.has(path), passed: !currentPaths.has(path) && !input.protection.changes.some(change => change.path === path && change.authorizedBy !== null), summary: `Protected file ${path} differs from the execution baseline without an exact authorized exception.`, path });
  for (const check of checks) {
    const evidence = check.producer === 'check:protection' ? input.protectionEvidence ?? input.evidence : input.evidence;
    const verification: CheckFindingVerification = { kind: 'check', producer: check.producer,
      obligation: { subject: check.subject, revision: 1 }, selection: check.selection, required: true };
    if (check.failed) commands.push(reportCommand({ producer: check.producer, attempt: input.assessment, reportKey: check.subject,
      owner: { kind: 'run' }, source: { kind: 'tree', id: input.tree }, issueKey: check.subject, verification,
      observation: { kind: 'check-failed', summary: check.summary.slice(0, 4000) || `${check.subject} failed`, evidence: [evidence],
        locations: check.path ? [{ path: check.path, startLine: null, endLine: null }] : [] },
      judgment: null, suggests: null, credibility: 'objective', modules: [],
    }));
    if (check.passed) {
      for (const entry of input.state.findings.values()) {
        const v = entry.verification;
        if (entry.standing !== 'open' || v.kind !== 'check' || v.producer !== check.producer
          || v.obligation.subject !== check.subject || v.obligation.revision !== 1 || v.selection !== check.selection) continue;
        commands.push({ type: 'dispose', checkFinding: entry.id, expectedRevision: entry.revision,
          decision: { actor: { kind: 'harness', reason: 'Fresh complete check evidence for the submitted candidate' }, source: { kind: 'tree', id: input.tree },
            rationale: `The required ${check.subject} check passed on this candidate.`, evidence: [evidence], communication: { mode: 'quiet' },
            decision: { action: 'fix-by-check', candidate: { kind: 'tree', id: input.tree }, witness: { producer: check.producer, attempt: input.assessment,
              obligation: v.obligation, selection: v.selection, source: { kind: 'tree', id: input.tree }, coverage: 'complete', outcome: 'passed', evidence: [evidence] } } } });
      }
    }
  }
  return commands;
}

/** One brief for a validated same-issue group; distinct concerns are never merged by filename. */
export function remainingBriefs(details: readonly CheckFindingDetailView[]): { repairs: string[]; decisions: string[] } {
  const repairs: string[] = [], decisions: string[] = [];
  const grouped = new Set<string>();
  for (const detail of details) {
    const summary = detail.summary;
    if (summary.standing !== 'open') continue;
    const key = summary.group?.canonical ?? summary.id;
    if (grouped.has(key)) continue;
    grouped.add(key);
    const members = details.filter(other => other.summary.standing === 'open' && (other.summary.group?.canonical ?? other.summary.id) === key);
    const latest = detail.reports.items.at(-1);
    const verification = summary.verification.kind === 'assessment' ? 'fresh semantic assessment' : `passing ${summary.verification.obligation.subject}`;
    const brief = `${members.map(item => item.summary.id).join(', ')}: ${summary.title}. ${latest?.judgment?.consequence ?? ''} Verify with ${verification}.`;
    (members.some(item => item.summary.pendingUserDecision !== null) ? decisions : repairs).push(brief);
  }
  return { repairs, decisions };
}

export function summaries(state: CheckFindingState): CheckFindingSummary[] {
  return findingDetails(state).map(detail => detail.summary);
}

/** Only an explicit recorded answer authorizes the exact protection comparison it named. */
export function acceptedProtectionExceptions(state: CheckFindingState, assessments: readonly AssistedAssessment[]): ProtectedException[] {
  const exceptions: ProtectedException[] = [];
  for (const entry of state.findings.values()) {
    if (entry.verification.kind !== 'check' || entry.verification.producer !== 'check:protection') continue;
    const path = entry.verification.obligation.subject.slice('protected:'.length);
    for (const answer of entry.decisions) {
      if (answer.actor.kind !== 'user' || answer.decision.action !== 'answer-user-decision' || answer.decision.option !== 'accept-exact-change') continue;
      const requestId = answer.decision.request;
      const request = entry.decisions.find(item => item.id === requestId);
      if (request?.decision.action !== 'request-user-decision') continue;
      const assessment = assessments.find(item => request.evidence.some(evidence => evidence.ref === `assessments/${item.id}/stages/protection.json`));
      const comparison = assessment?.stages.find(stage => stage.name === 'protection')?.evidence as ProtectionComparison | undefined;
      const change = comparison?.changes.find(item => item.path === path);
      if (!comparison || !assessment || comparison.candidateCommit !== assessment.request.candidate || !change) continue;
      exceptions.push({ path, before: change.before, after: change.after,
        authority: { id: answer.id, revision: 1,
          hash: createHash('sha256').update(`${JSON.stringify({ schema: 'ramify-agent.check-finding-decision/1', ...answer,
            checkFinding: entry.id, revision: answer.considered + 1 }, null, 2)}\n`).digest('hex') } });
    }
  }
  return exceptions;
}

/** Authorization changes the governing condition, not the historical failure on this tree. */
export function authorizedProtectionFinding(entry: Pick<import('../../check-findings/src/interfaces/check-findings.js').CheckFindingEntry, 'verification'>, protection: ProtectionComparison): boolean {
  const verification = entry.verification;
  return verification.kind === 'check' && verification.producer === 'check:protection'
    && protection.changes.some(change => change.authorizedBy !== null && verification.obligation.subject === `protected:${change.path}`);
}

export { knownFindingSummary } from '../../check-findings/src/queries.js';

/** Read the existing predecessor chain; unavailable invocations cannot replace an acceptance judgment. */
export function predecessorAssessment(assessment: AssistedAssessment, assessments: readonly AssistedAssessment[]): AssistedAssessment | undefined {
  if (assessment.request.previousAssessment !== undefined) return assessments.find(item => item.id === assessment.request.previousAssessment);
  const index = assessments.findIndex(item => item.id === assessment.id);
  return assessment.request.iterationId === undefined ? undefined : assessments.slice(0, index < 0 ? assessments.length : index)
    .filter(item => item.request.iterationId === assessment.request.iterationId && item.status === 'completed').at(-1);
}

/** The most recent usable answers remain substantive until a relevant submitted follow-up replaces them. */
export function retainedRequirementAnswers(assessment: AssistedAssessment, assessments: readonly AssistedAssessment[]): AssistedReviewSubmission['requirements'] {
  const seen = new Set<string>();
  let current: AssistedAssessment | undefined = assessment;
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    const review = (current.stages.find(stage => stage.name === 'review-accepted') ?? current.stages.find(stage => stage.name === 'review'))?.evidence as {
      result?: { status: string; value?: AssistedReviewSubmission };
    } | undefined;
    if (review?.result?.status === 'submitted' && review.result.value) return review.result.value.requirements;
    current = predecessorAssessment(current, assessments);
  }
  return [];
}

export function substantiveGaps(assessment: AssistedAssessment | undefined): string[] {
  return assessment?.outcome?.gaps.filter(gap => !/^(Required review|Reconciliation|Audit evidence) unavailable:/u.test(gap)) ?? [];
}
