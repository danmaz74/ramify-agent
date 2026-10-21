import { testReliabilityGuidance } from './test-reliability.js';
import type { CheckFindingDetailView, CheckFindingSummary } from '../../check-findings/src/interfaces/check-findings.js';

/** How many reports and decisions of one CheckFinding the packet shows, newest last. */
export const packetHistory = 20;

/** One settled review request of the work item, as the packet describes it. */
export interface PacketRequest {
  readonly request: string;
  readonly kind: string;
  readonly iteration: string;
  readonly candidate: string;
  readonly attempt: string | null;
  /** `complete`, `partial, missing …` or `not verified (reason): detail`. */
  readonly result: string;
}

export interface ReconciliationFactsContent {
  readonly requests: readonly PacketRequest[];
  readonly attention: readonly CheckFindingDetailView[];
  readonly others: readonly CheckFindingSummary[];
  /** Each iteration of the work item and its goal, in order. */
  readonly iterations: ReadonlyArray<{ readonly id: string; readonly goal: string; readonly outcome: string | null }>;
  /** The work item's earlier rounds: what each chose, and its brief. */
  readonly earlier: ReadonlyArray<{ readonly id: string; readonly next: string; readonly brief: string }>;
  /** Why this round runs, where a basis was refused or a fork returned nothing before it. */
  readonly refused: ReadonlyArray<{ readonly reconciliation: string | null; readonly reason: string }>;
}

/** Factual packet shared by execution adapters; authority is supplied explicitly. */
export interface ReconciliationFacts extends ReconciliationFactsContent {
  readonly id: string;
  readonly owner: string;
  readonly round: number;
  readonly source: { readonly commit: string; readonly tree: string };
  readonly originalBaseline?: string | null;
  readonly introduction: string;
  readonly authority: string;
  readonly context?: string;
}

/** Both wrappers retain the same finding histories, coverage gaps and earlier decisions. */
export function reconciliationFactsMessage(packet: ReconciliationFacts): string {
  const lines: string[] = [
    packet.introduction,
    ...(packet.context === undefined ? [] : ['', packet.context]),
    '',
    '## Source',
    '',
    `The candidate source is \`${packet.source.commit}\` (tree \`${packet.source.tree}\`). Start with the reviewed patch and its canonical changed-path list, then read the source each concern requires. Retain harness-produced changes in the audited diff; producer attribution never hides a patch.`,
    ...(packet.originalBaseline === undefined ? [] : [`Original execution baseline for test origin: ${packet.originalBaseline === null ? 'unavailable; preserve uncertainty' : `\`${packet.originalBaseline}\``}. Compare individual tests against it, including additions within existing files and earlier iterations.`]),
    '',
    '## This round',
    '',
    'Discretionary suggestions may be waived or deferred with a short rationale; no user approval is needed for ordinary architect decisions. Actual unmet requirements and failed required checks retain their meaning. A correction may be planned for any signal. Reconsider repeated attempts against the latest evidence: change an ineffective approach, continue useful work, or end refinement when the requirements are satisfied and further benefit is too small.',
    testReliabilityGuidance,
    'For each provider-established audit-instability finding in the attention set, submit testOrigins with an individual existing, added or unknown judgment and its source evidence. An existing test needs no repair assignment. Unknown origin stays open. An added test requires repair; close it only on a later candidate after inspecting reliable coverage, and name that coverage in coverageEvidence. The audit verdict remains authoritative.',
    packet.authority,
    '',
    '## Review coverage',
    '',
  ];
  if (packet.requests.length === 0) lines.push(`No review was requested of this ${packet.owner ?? 'work item'}'s iterations.`);
  for (const request of packet.requests) {
    lines.push(`- \`${request.request}\`: ${request.kind} review of \`${request.iteration}\` (candidate \`${request.candidate}\`), attempt ${request.attempt === null ? 'none' : `\`${request.attempt}\``}: ${request.result}`);
  }
  lines.push('', 'A review that was not verified, or covered only part of its scope, is a gap in coverage, not a clean review.', '');

  lines.push(`## CheckFindings needing attention (${packet.attention.length}), by risk and then credibility`, '');
  for (const detail of packet.attention) lines.push(...checkFindingSection(detail));

  if (packet.others.length > 0) {
    lines.push(`## Other CheckFindings of this ${packet.owner ?? 'work item'}`, '');
    lines.push('A relation may name them. They need no disposition here.', '');
    for (const summary of packet.others) {
      lines.push(`- \`${summary.id}\` revision ${summary.revision}, ${summary.standing} (${summary.reason}): ${summary.title}`);
    }
    lines.push('');
  }

  if (packet.iterations.length > 0) {
    lines.push(`## Iterations of this ${packet.owner ?? 'work item'}`, '');
    for (const iteration of packet.iterations) lines.push(`- \`${iteration.id}\`${iteration.outcome === null ? '' : ` (${iteration.outcome})`}: ${iteration.goal}`);
    lines.push('');
  }

  if (packet.earlier.length > 0 || packet.refused.length > 0) {
    lines.push('## Earlier rounds', '');
    for (const round of packet.earlier) lines.push(`- \`${round.id}\` chose \`${round.next}\`. Its brief: ${round.brief}`);
    for (const refusal of packet.refused) lines.push(`- ${refusal.reconciliation === null ? 'A completion' : `\`${refusal.reconciliation}\``} was refused: ${refusal.reason}`);
    lines.push('', 'Decisions already recorded stand unless the evidence changed; repeat none of them.', '');
  }

  lines.push('Assess, and submit.');
  return lines.join('\n');
}

function checkFindingSection(detail: CheckFindingDetailView): string[] {
  const summary = detail.summary;
  const verification = summary.verification.kind === 'assessment'
    ? 'a fresh assessment'
    : `a passing rerun of ${summary.verification.obligation.subject} revision ${summary.verification.obligation.revision}${summary.verification.required ? ', a required check' : ''}`;
  const lines: string[] = [
    `### \`${summary.id}\` — ${summary.standing} (${summary.reason}), revision ${summary.revision}`,
    '',
    `${summary.title}`,
    '',
    `- Risk: ${summary.risk}; credibility: ${summary.credibility}; modules: ${summary.modules.join(', ') || 'none'}`,
    `- Waiting for: ${summary.awaiting ?? 'nothing'}${summary.attention === 'due' ? '; a deferral whose revisit is due' : ''}`,
    `- Verified by: ${verification}`,
    ...(summary.group === null ? [] : [`- Same-issue group of \`${summary.group.canonical}\`: ${summary.group.members.join(', ')}`]),
    ...(summary.pendingUserDecision === null ? [] : [`- A user decision is pending: \`${summary.pendingUserDecision}\``]),
    ...(summary.repair === null ? [] : [`- Repair: ${summary.repair.kind} \`${summary.repair.ref}\``]),
    '',
    `Reports (${detail.reports.total}${detail.reports.total > packetHistory ? `, the latest ${packetHistory}` : ''}):`,
  ];
  for (const report of detail.reports.items.slice(-packetHistory)) {
    lines.push(`- \`${report.id}\` by ${report.producer}, attempt \`${report.attempt}\`, on ${report.source.kind} \`${report.source.id}\`: ${report.observation.summary}`);
    if (report.judgment !== null) {
      lines.push(`  - Proposed risk: ${report.judgment.risk}; grounded in ${report.judgment.ground === null ? 'nothing' : `\`${report.judgment.ground.ref}\``} (${report.credibility})`);
      lines.push(`  - Consequence: ${report.judgment.consequence}`);
      lines.push(`  - Rationale: ${report.judgment.rationale}`);
      lines.push(`  - Uncertainty: ${report.judgment.uncertainty}`);
      if (report.judgment.remedy !== null) lines.push(`  - Remedy: ${report.judgment.remedy}`);
    }
    const locations = report.observation.locations.map(location => `${location.path}${location.startLine === null ? '' : `:${location.startLine}${location.endLine === null || location.endLine === location.startLine ? '' : `-${location.endLine}`}`}`);
    if (locations.length > 0) lines.push(`  - Locations: ${locations.join(', ')}`);
    if (report.observation.evidence.length > 0) lines.push(`  - Evidence: ${report.observation.evidence.map(evidence => evidence.ref).join(', ')}`);
  }
  if (detail.decisions.total > 0) {
    lines.push('', `Decisions (${detail.decisions.total}${detail.decisions.total > packetHistory ? `, the latest ${packetHistory}` : ''}):`);
    for (const decision of detail.decisions.items.slice(-packetHistory)) {
      const actor = decision.actor.kind === 'agent' ? `${decision.actor.role} ${decision.actor.invocation}` : decision.actor.kind === 'user' ? `user ${decision.actor.name}` : 'the harness';
      lines.push(`- \`${decision.id}\` ${decision.decision.action} by ${actor}, at revision ${decision.considered}: ${decision.rationale}`);
    }
  }
  if (detail.relations.length > 0) {
    lines.push('', 'Relations:');
    for (const relation of detail.relations) lines.push(`- \`${relation.from.checkFinding}\` ${relation.relation} \`${relation.to.checkFinding}\` (${relation.id}): ${relation.rationale}`);
  }
  lines.push('');
  return lines;
}
