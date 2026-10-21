import type { AcceptedEvidence } from '../../autonomous/subs/planning/src/evidence.js';
import { assessmentSchema } from '../../nonfunctional/src/interfaces/contracts.js';
import { currentDeviationDecision } from '../../autonomous/subs/acceptance/src/deviations/readiness-decision.js';
import { deviationHash } from '../../autonomous/subs/acceptance/src/deviations/finding.js';
import { deviationLayout, planDeviationSchema } from '../../autonomous/subs/acceptance/src/deviations/records.js';
import { nonfunctionalDeviationHash } from '../../autonomous/subs/acceptance/src/deviations/nonfunctional.js';
import { replayCheckFindingState } from '../../../src/check-findings/state.js';
import { replayNonfunctionalPhase } from '../../autonomous/subs/acceptance/src/nonfunctional-phase.js';
import { decideNonfunctionalRound } from '../../nonfunctional/src/rounds.js';
import { assessedElements } from '../../autonomous/subs/acceptance/src/nonfunctional/submissions.js';
import { projectMergeReadiness, type FinalAuditFacts, type ReadinessDeviation } from '../../autonomous/subs/acceptance/src/merge-readiness.js';
import {
  nonfunctionalDeviationSchema,
  type MergeReadiness,
} from '../../autonomous/subs/acceptance/src/nonfunctional-records.js';
import { runLayout } from '../../autonomous/src/run/records.js';
import { invocationOutcomeSchema } from '../../task-execution/src/records.js';
import type { GateAttempt } from '../../autonomous/subs/acceptance/src/checks/records.js';
import type { RunView, CommittedLine } from './inputs.js';

const unavailable = (reason: string): MergeReadiness => ({
  status: 'unavailable', candidate: null, finalGate: null, checkFindings: [], reason,
});

function recordOf<T>(line: CommittedLine | undefined, path: string, parse: (body: unknown) => T | null): T | null {
  const matching = line?.transaction.records.filter(record => record.path === path) ?? [];
  return matching.length === 1 ? parse(matching[0]!.body) : null;
}

function authenticUserCommand(view: RunView, finding: string, decision: { decisionId: string; revision: number; command: string }): boolean {
  return view.entries.some(line => {
    const event = line.transaction.event;
    return event.type === 'check-findings-recorded' && event.data.cause.kind === 'user-command'
      && event.data.cause.command.commandId === decision.command
      && event.data.cause.command.receipt.commandId === decision.command
      && event.data.checkFindings.some(child => child.type === 'check-finding-decided'
        && child.data.checkFinding === finding && child.data.decision.id === decision.decisionId
        && child.data.revision === decision.revision);
  });
}

function authenticCoordinator(view: RunView, invocation: string): boolean {
  const started = view.entries.filter(line => line.transaction.event.type === 'invocation-started'
    && line.transaction.event.data.invocation === invocation
    && line.transaction.event.data.role === 'nonfunctional-coordinator');
  const ended = view.entries.filter(line => line.transaction.event.type === 'invocation-ended'
    && line.transaction.event.data.invocation === invocation
    && line.transaction.event.data.ended === 'submitted');
  if (started.length !== 1 || ended.length !== 1) return false;
  const start = started[0]!;
  const end = ended[0]!;
  if (start.sequence >= end.sequence || start.transaction.event.type !== 'invocation-started'
    || end.transaction.event.type !== 'invocation-ended'
    || start.transaction.event.data.session !== end.transaction.event.data.session) return false;
  const outcome = recordOf(end, runLayout.outcome(invocation), body => invocationOutcomeSchema.safeParse(body).data ?? null);
  return outcome?.invocation === invocation && outcome.ended === 'submitted' && outcome.disposition === 'applied'
    && outcome.submission?.hash === end.transaction.event.data.submission;
}

/** The final gate's recorded audit request and answer, as merge readiness judges it. */
function finalAuditFacts(gate: GateAttempt): FinalAuditFacts | null {
  const audit = gate.audit;
  if (audit === undefined) return null;
  return {
    mode: audit.mode, nested: audit.nested, status: audit.status, executedMode: audit.executedMode, verdict: audit.verdict,
    discovery: audit.discovery?.status ?? null,
    projects: audit.projects?.map(project => ({ projectRoot: project.projectRoot, verdict: project.verdict, status: project.status,
      executedMode: project.executedMode })) ?? null,
  };
}

/** One immutable run view supplies every identity; disk reads happen before this pure composition. */
export function mergeReadinessOf(view: RunView, evidence: AcceptedEvidence): MergeReadiness {
  const final = [...view.gates.values()].filter(entry => entry.body.checkpoint === 'final').at(-1)?.body;
  if (final && final.verdict !== 'passed') return projectMergeReadiness({
    completed: false, candidate: null, finalGate: { id: final.id, tree: '', assessment: '', passed: false, audit: finalAuditFacts(final) },
    nfrIds: null, assessment: null, deviations: [],
  });
  if (evidence.status === 'unavailable') {
    return unavailable(evidence.reason);
  }
  const accepted = view.events.find(event => event.type === 'analysis-accepted');
  const marker = view.events.find(event => event.type === 'nonfunctional-phase-started');
  if (accepted?.type !== 'analysis-accepted' || marker?.type !== 'nonfunctional-phase-started'
    || accepted.data.evidence.catalog.hash !== marker.data.catalogHash) {
    return unavailable('The assessment phase is not bound to the accepted catalog');
  }
  const completed = view.events.find(event => event.type === 'job-completed');
  const bound = [...view.events].reverse().find(event => event.type === 'candidate-bound-to-gate'
    && event.data.gate === completed?.data.gate);
  if (!completed || !bound || bound.type !== 'candidate-bound-to-gate') return unavailable('No completed candidate is bound to the final gate');
  const gate = view.gates.get(bound.data.gate)?.body;
  const audit = view.gateAuditOutcomes.get(bound.data.gate)?.body;
  if (gate?.checkpoint !== 'final' || gate.verdict !== 'passed'
    || gate.audited !== bound.data.commit || completed.data.commit !== bound.data.commit
    || gate.evidence === null
    || (audit !== undefined && (audit.overall !== 'pass' || audit.audited !== bound.data.commit))) {
    return unavailable('The final gate, audit and candidate binding disagree');
  }
  const nfrIds = assessedElements(evidence.catalog);
  const phase = replayNonfunctionalPhase(view.entries, nfrIds, view.record.policy.limits.nonfunctionalRoundsPerPlan ?? 0);
  if (!phase.ok) return unavailable(`The committed assessment phase is inconsistent: ${phase.reason}`);
  const next = decideNonfunctionalRound(phase.value.input);
  if (next.action !== 'stop' || (next.outcome !== 'satisfied' && next.outcome !== 'exhausted')) {
    return unavailable('The final non-functional round has not closed with a usable outcome');
  }
  const settled = phase.value.final;
  if (!settled || settled.candidateId !== bound.data.candidate
    || settled.assessment.id !== bound.data.assessment
    || settled.candidate.tree !== bound.data.tree) {
    return unavailable('The completed candidate differs from the final closed assessment round');
  }
  const assessed = view.entries.filter(line => line.transaction.event.type === 'nonfunctional-assessed');
  for (const line of assessed) {
    if (line.transaction.event.type !== 'nonfunctional-assessed') continue;
    const recorded = recordOf(line, runLayout.assessment(line.transaction.event.data.assessment),
      body => assessmentSchema.safeParse(body).data ?? null);
    if (!recorded || (nfrIds.length === 0
      ? recorded.coordinatorInvocation !== 'harness:empty-catalog'
      : !authenticCoordinator(view, recorded.coordinatorInvocation))) {
      return unavailable('An assessment lacks truthful committed coordinator provenance');
    }
  }

  const findings = replayCheckFindingState(view.entries).findings;
  // Phase replay authenticates each external invalidation. Its earlier
  // deviations remain evidence, but do not describe the current candidate.
  const invalidated = new Set(view.events.filter(event => event.type === 'nonfunctional-final-invalidated').map(event => event.data.assessment));
  const deviations: ReadinessDeviation[] = [];
  const paths = new Map(evidence.manifest.documents.map(document => [document.id, document]));
  for (const line of view.entries) {
    const event = line.transaction.event;
    if (event.type !== 'plan-deviation-recorded' && event.type !== 'nonfunctional-deviation-recorded'
      && event.type !== 'nonfunctional-deviations-recorded') continue;
    const recorded = event.type === 'nonfunctional-deviations-recorded' ? event.data.deviations : [event.data];
    for (const occurrence of recorded) {
      const nfr = event.type !== 'plan-deviation-recorded';
      const path = nfr ? runLayout.nonfunctionalDeviation(occurrence.deviation) : deviationLayout.deviation(occurrence.deviation);
      const record = nfr
        ? recordOf(line, path, body => nonfunctionalDeviationSchema.safeParse(body).data ?? null)
        : recordOf(line, path, body => planDeviationSchema.safeParse(body).data ?? null);
      if (!record || record.id !== occurrence.deviation || record.checkFinding !== occurrence.checkFinding) {
        return unavailable(`Deviation ${occurrence.deviation} has no matching committed record`);
      }
      const entry = findings.get(record.checkFinding);
      const hash = nfr ? nonfunctionalDeviationHash(record as Extract<typeof record, { origin: unknown }>)
        : deviationHash(record as Exclude<typeof record, { origin: unknown }>);
      const first = entry?.reports[0];
      const last = entry?.reports.at(-1);
      if (!entry || entry.owner.kind !== 'run' || first?.observation.kind !== 'plan-deviation'
        || entry.reports[0].judgment?.ground?.ref !== path || entry.reports[0].judgment.ground.hash !== hash) {
        return unavailable(`Deviation ${record.id} has no source-bound CheckFinding`);
      }
      if (!last || last.source.kind !== first.source.kind || last.source.id !== first.source.id
        || last.judgment?.ground?.ref !== path || last.judgment.ground.hash !== hash) {
        return unavailable(`Deviation ${record.id} changed source after its first report`);
      }
      if (nfr) {
        const detail = record as Extract<typeof record, { origin: unknown }>;
        const document = paths.get(detail.element.document);
        const element = evidence.catalog.elements.find(item => item.id === detail.origin.nfr);
        if (!document || entry.reports[0].source.kind !== 'document'
          || entry.reports[0].source.id !== `${document.path}@sha256:${document.sha256}`
          || !('nfr' in occurrence) || detail.origin.nfr !== occurrence.nfr || detail.origin.assessment !== event.data.assessment
          || (element?.kind !== 'non-functional' && element?.kind !== 'fixed')
          || element.id !== detail.element.id || element.text !== detail.element.text || element.document !== detail.element.document) {
          return unavailable(`Deviation ${record.id} has mismatched NFR source or assessment`);
        }
      } else if (event.type === 'plan-deviation-recorded') {
        const detail = record as Exclude<typeof record, { origin: unknown }>;
        if (!('workItem' in occurrence) || detail.workItem !== occurrence.workItem || detail.request !== occurrence.request
          || detail.invocation !== occurrence.invocation) {
          return unavailable(`Deviation ${record.id} differs from its recorded work-item origin`);
        }
      }
      const current = currentDeviationDecision(entry);
      if (current && !authenticUserCommand(view, record.checkFinding, current)) {
        return unavailable(`Deviation ${record.id} has no accepted current user command`);
      }
      if (nfr && invalidated.has((record as Extract<typeof record, { origin: unknown }>).origin.assessment)) continue;
      deviations.push({ origin: nfr ? (record as Extract<typeof record, { origin: unknown }>).origin : {
        kind: 'work-item-conflict', request: (record as Exclude<typeof record, { origin: unknown }>).request,
        workItem: (record as Exclude<typeof record, { origin: unknown }>).workItem,
        architectInvocation: (record as Exclude<typeof record, { origin: unknown }>).invocation,
      }, checkFinding: record.checkFinding, findingRevision: entry.revision,
      decision: current ? { standing: current.standing, revision: current.revision } : null });
    }
  }
  return projectMergeReadiness({ completed: true, candidate: settled.candidate,
    finalGate: { id: gate.id, tree: bound.data.tree, assessment: settled.assessment.id, passed: true, audit: finalAuditFacts(gate) },
    nfrIds, assessment: settled.assessment, deviations });
}
