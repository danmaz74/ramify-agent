import { verifiedCandidateSource } from '../../evidence/src/git-text.js';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { JsonSchema } from '../../agent/src/interfaces/port.js';
import type { SessionOperations } from '../../agent/src/interfaces/session-operations.js';
import { decideCheckFindingChange } from '../../check-findings/src/decide.js';
import { gitCandidateSource, type CandidateSource } from '../../evidence/src/git.js';
import { openCandidateSnapshot, snapshotTools, verifySnapshotEvidence, resolveSnapshotPath, type CandidateSnapshot } from '../../reviews/src/snapshot.js';
import { prepareAssistedReview, type AssistedReviewSubmission } from '../../reviews/src/assisted.js';
import { bindCandidateConcerns, type ConcernBinding } from '../../reviews/src/concern-binding.js';
import { ReviewQueue } from '../../reviews/src/scheduler.js';
import { reconciliationFactsMessage } from '../../reviews/src/reconciliation-message.js';
import { reconciliationSubmissionSchema, validateReconciliationForExecution, type AttentionEntry, type BoundReconciliation } from '../../reviews/src/reconciliation.js';
import type { Assessor, AssistedEvidenceReference, AssistedOutcome, AssistedAssessment, AssistedJob } from './contracts.js';
import { auditAssistedCandidate, isAuditEvidenceReference, readAuditEvidence, type AuditEvidenceReference } from './audit.js';
import { approvalReadiness } from './approval.js';
import { compareProtection, type ProtectionComparison } from './protection.js';
import { captureAssistanceDocuments, readCandidateDocument, type AssistanceDocuments } from './documents.js';
import { createAssessmentEvidenceTool } from './pi-evidence.js';
import { runAssistedPiReview, runPiAssessment, type AssistedPiReviewInput, type PiAssessmentInput, type PiAssessmentResult } from './pi.js';
import { acceptedProtectionExceptions, authorizedProtectionFinding, factualFindingCommands, findingDetails, remainingBriefs, predecessorAssessment, retainedRequirementAnswers, substantiveGaps, reportReviewConcerns, knownFindingSummary, unverifiedSemanticClosures } from './findings.js';

const digest = (value: unknown): string => `sha256:${createHash('sha256').update(`${JSON.stringify(value, null, 2)}\n`).digest('hex')}`;
const errorText = (error: unknown): string => error instanceof Error ? error.message : String(error);

export interface AssessmentDependencies {
  readonly operations: () => Promise<SessionOperations>;
  readonly candidates?: CandidateSource;
  readonly audit?: typeof auditAssistedCandidate;
  readonly protection?: typeof compareProtection;
  readonly review?: (input: AssistedPiReviewInput) => Promise<PiAssessmentResult<AssistedReviewSubmission>>;
  readonly reconcile?: (input: PiAssessmentInput<BoundReconciliation>) => Promise<PiAssessmentResult<BoundReconciliation>>;
}
interface ReviewEvidence {
  readonly result: PiAssessmentResult<AssistedReviewSubmission>;
  readonly bindings: readonly ConcernBinding[];
  readonly read: readonly string[];
  readonly inspected: readonly string[];
  readonly sourceVerification?: 'git-exact-text/1' | 'candidate-inspection/1';
  readonly limitations?: readonly string[];
}
type ReconciliationEvidence = PiAssessmentResult<BoundReconciliation> & { readonly exactSourceReads?: readonly string[] };
interface DocumentsReference {
  readonly schema: 'ramify-agent.assisted-document-reference/1';
  readonly baselineCommit: string;
  readonly artifact: AssistedEvidenceReference;
}
const isDocumentsReference = (value: unknown): value is DocumentsReference => typeof value === 'object' && value !== null
  && 'schema' in value && value.schema === 'ramify-agent.assisted-document-reference/1';

/** Compose existing facilities around assisted inputs; this never drives implementation work. */
export function createAssessor(dependencies: AssessmentDependencies): Assessor {
  const source = verifiedCandidateSource(dependencies.candidates ?? gitCandidateSource);
  return async context => {
    const { assessment, job, projectRoot, signal } = context;
    const request = assessment.request;
    const gaps: string[] = [];
    const limitations: string[] = [];
    const evidence: string[] = [];
    const stages = <T>(name: string): T | undefined => context.stages().find(stage => stage.name === name)?.evidence as T | undefined;
    const record = async (name: string, value: unknown) => {
      signal.throwIfAborted();
      await context.checkpoint(name, value);
      evidence.push(`assessments/${assessment.id}/stages/${name}.json`);
    };
    const invalidateClosures = async (retained: AssistedAssessment, reason: string) => {
      const stage = retained.stages.find(stage => stage.name === 'reconciliation-accepted') ?? retained.stages.find(stage => stage.name === 'reconciliation');
      const reconciliation = stage?.evidence as ReconciliationEvidence | undefined;
      if (reconciliation?.status !== 'submitted') return;
      const reference = { kind: 'assisted-source-invalidation', ref: `assessments/${retained.id}/stages/${stage!.name}.json`, hash: digest(reconciliation) };
      for (const invalidated of unverifiedSemanticClosures({ state: context.findingState(), commands: reconciliation.value.commands, evidence: reference })) {
        // The checkpoint precedes the domain transition, so restart can repeat
        // verification without losing why an already-applied closure reopened.
        await record(`source-invalidation-${retained.id}-${invalidated.settlement}`, { reason, source: reference, settlement: invalidated.settlement });
        await context.recordFindings([invalidated.command], `source-invalidation-${invalidated.settlement}`);
      }
    };
    const retainedSourceGap = async (detail: string): Promise<AssistedOutcome> => {
      await invalidateClosures(context.assessments().find(item => item.id === assessment.id)!, detail);
      return compactOutcome({ gate: 'incomplete', summary: 'Retained judgments require a fresh assessment with verifiable source evidence.',
        ...remainingBriefs(findingDetails(context.findingState())), gaps: [...gaps, detail],
        evidence: context.stages().map(stage => `assessments/${assessment.id}/stages/${stage.name}.json`),
      });
    };
    const baseline = job.protection?.baselineCommit;
    if (!baseline) return incomplete('The execution has no usable protection baseline.', [job.protection?.unavailable ?? 'Start an execution with an available Git baseline.']);
    if (job.protection!.unavailable) gaps.push(`Protection baseline inspection unavailable: ${job.protection!.unavailable}`);
    if (job.protection!.gaps.length) gaps.push(...job.protection!.gaps.map(gap => `Protected input ${gap.path} was ${gap.state} at registration and is not represented by the baseline.`));
    if (request.kind === 'final' && request.planBaseline !== baseline) return incomplete('Final assessment baseline differs from the captured execution baseline.', ['Submit the original plan baseline.']);
    const base = request.kind === 'final' ? baseline : request.base;
    const snapshot = await openCandidateSnapshot(source, projectRoot, { commit: request.candidate, base });
    signal.throwIfAborted();
    const auditPrevious = await readAuditEvidence(stages('audit'), context.readEvidence);
    const audit = auditPrevious?.state === 'passed' || auditPrevious?.state === 'failed' ? auditPrevious
      : await (dependencies.audit ?? auditAssistedCandidate)({ projectRoot, baselineCommit: baseline, candidateCommit: snapshot.commit,
        jobId: job.jobId, attemptId: `${assessment.id}-audit`, signal });
    if (audit !== auditPrevious) {
      // A stage is copied into its transition, revision record and stage record.
      // Keep a large provider result once, rather than multiplying it in each line.
      const retained = Buffer.byteLength(JSON.stringify(audit)) > 128 * 1024
        ? { schema: 'ramify-agent.assisted-audit-reference/1', state: audit.state,
          requestedSourceCommit: audit.requestedSourceCommit, auditedSourceCommit: audit.auditedSourceCommit,
          artifact: await context.retainEvidence(audit) } satisfies AuditEvidenceReference : audit;
      await record('audit', retained);
    }
    if (audit.state === 'unavailable') gaps.push(`Audit evidence unavailable: ${audit.detail}`);

    const protection = stages<ProtectionComparison>('protection') ?? await (dependencies.protection ?? compareProtection)({
      projectRoot, baselineCommit: baseline, candidateCommit: snapshot.commit, rules: job.protection!.rules, candidates: source, signal,
      exceptions: acceptedProtectionExceptions(context.findingState(), context.assessments()),
    });
    if (!stages('protection')) await record('protection', protection);
    const auditStage = stages('audit');
    const factualEvidence = { kind: 'assisted-checks',
      ref: isAuditEvidenceReference(auditStage) ? auditStage.artifact.path : `assessments/${assessment.id}/stages/audit.json`,
      hash: isAuditEvidenceReference(auditStage) ? `sha256:${auditStage.artifact.sha256}` : digest(audit) };
    // Pure domain ingestion is already idempotent; keying the transaction also covers decisions after a restart.
    const factual = factualFindingCommands({ state: context.findingState(), assessment: assessment.id, tree: snapshot.tree, audit, protection,
      protectionSelection: digest({ baseline, rules: job.protection!.rules }), evidence: factualEvidence,
      protectionEvidence: { kind: 'protection-comparison', ref: `assessments/${assessment.id}/stages/protection.json`, hash: digest(protection) } });
    if (factual.length) await context.recordFindings(factual);

    if (audit.state === 'failed') {
      await record('review-policy', { mode: 'not-run', reason: 'Configured check failed; return diagnostics directly for repair.' });
      const remaining = remainingBriefs(findingDetails(context.findingState()));
      gaps.push(...substantiveGaps(predecessorAssessment(assessment, context.assessments())));
      for (const answer of retainedRequirementAnswers({ ...assessment, stages: [...context.stages()] }, context.assessments())) {
        if (answer.outcome === 'unmet') remaining.repairs.push(`${answer.ref}: ${answer.explanation}`);
        if (answer.outcome === 'uncertain') gaps.push(`${answer.ref}: ${answer.explanation}`);
      }
      return compactOutcome({ gate: 'action-required', summary: audit.detail, ...remaining, gaps,
        evidence: context.stages().map(stage => `assessments/${assessment.id}/stages/${stage.name}.json`) });
    }

    for (const retained of context.assessments()) {
      if (retained.id === assessment.id) continue;
      const cached = (retained.stages.find(stage => stage.name === 'reconciliation-accepted') ?? retained.stages.find(stage => stage.name === 'reconciliation'))?.evidence as ReconciliationEvidence | undefined;
      if (cached?.status !== 'submitted' || !unverifiedSemanticClosures({ state: context.findingState(), commands: cached.value.commands,
        evidence: { kind: 'assisted-source-verification', ref: retained.id, hash: null } }).length) continue;
      try {
        const historical = await openCandidateSnapshot(source, projectRoot, { commit: retained.request.candidate,
          base: retained.request.kind === 'final' ? baseline : retained.request.base });
        const review = (retained.stages.find(stage => stage.name === 'review-accepted') ?? retained.stages.find(stage => stage.name === 'review'))?.evidence as ReviewEvidence | undefined;
        if (review?.result.status !== 'submitted') throw new Error('Historical settlement has no retained accepted review');
        await verifyRetainedReview(review, { snapshot: historical, source, projectRoot, signal });
        await verifyReconciliationSource(cached, { snapshot: historical, source, projectRoot, job, planMarkdown: context.planMarkdown, signal });
      } catch (error) {
        signal.throwIfAborted();
        await invalidateClosures(retained, `Historical semantic settlement source proof is unavailable: ${errorText(error)}`);
      }
    }

    const captureDocuments = (discoverReferences = false) => captureAssistanceDocuments({ projectRoot, planId: job.planId,
      planMarkdown: context.planMarkdown, baselineCommit: baseline, candidates: source, discoverReferences });
    const savedDocuments = stages<AssistanceDocuments | DocumentsReference>('documents');
    let documents: AssistanceDocuments;
    if (isDocumentsReference(savedDocuments)) {
      if (savedDocuments.baselineCommit !== baseline) throw new Error('Retained documents name another baseline');
      try { documents = await context.readEvidence(savedDocuments.artifact) as AssistanceDocuments; }
      catch {
        // Recovery uses the same immutable source and must reproduce the exact committed artifact.
        documents = await captureDocuments();
        const regenerated = await context.retainEvidence(documents);
        if (regenerated.sha256 !== savedDocuments.artifact.sha256 || regenerated.path !== savedDocuments.artifact.path) {
          // Older compact references captured discovered companions. Only a
          // missing historical artifact needs their original capture policy.
          const historical = await captureDocuments(true);
          const restored = await context.retainEvidence(historical);
          if (restored.sha256 !== savedDocuments.artifact.sha256 || restored.path !== savedDocuments.artifact.path)
            throw new Error('Retained document evidence is unavailable and could not be reproduced exactly');
          documents = historical;
        }
      }
    } else if (savedDocuments) documents = savedDocuments;
    else {
      documents = await captureDocuments();
      await record('documents', { schema: 'ramify-agent.assisted-document-reference/1', baselineCommit: baseline,
        artifact: await context.retainEvidence(documents) } satisfies DocumentsReference);
    }
    if (documents.baselineCommit !== baseline) throw new Error('Retained documents name another baseline');
    const previous = predecessorAssessment(assessment, context.assessments());
    let reviewBasis = previous;
    const seen = new Set<string>();
    while (reviewBasis && reviewBasis.request.kind === request.kind && !seen.has(reviewBasis.id)) {
      seen.add(reviewBasis.id);
      const retained = (reviewBasis.stages.find(stage => stage.name === 'review-accepted') ?? reviewBasis.stages.find(stage => stage.name === 'review'))?.evidence as ReviewEvidence | undefined;
      if (retained?.result.status === 'submitted') break;
      reviewBasis = predecessorAssessment(reviewBasis, context.assessments());
    }
    const focused = previous !== undefined && reviewBasis?.request.kind === request.kind
      && request.reviewReason === undefined && Boolean(reviewBasis?.stages.some(stage =>
        (stage.name === 'review-accepted' || stage.name === 'review') && (stage.evidence as ReviewEvidence).result?.status === 'submitted'));
    const requirements = [
      ...(request.kind === 'final' ? [{ ref: 'captured-plan', text: focused
        ? 'Follow up on the selected repairs and relevant surrounding behavior using the retained complete-plan assessment. Verify previously unmet requirements; broaden inspection when the repair or new evidence warrants it. Do not restart the whole catalog by default. The complete original plan remains available with assessment_evidence ref captured-plan.'
        : `Assess every outcome of the complete captured plan against the cumulative candidate.\n${context.planMarkdown}` }]
        : [{ ref: 'captured-plan', text: 'Assess the current iteration goal and supplied acceptance against applicable plan constraints; future iterations are not due. The complete original plan is available on demand with assessment_evidence ref captured-plan.' }]),
      ...request.acceptance.map((text, index) => ({ ref: `acceptance-${index + 1}`, text })),
      ...request.requirementDocuments.map((document, index) => ({ ref: `requirement-document-${index + 1}`,
        text: `Selected guidance: ${document.path} at ${document.revision}. Read exact original on demand with assessment_evidence ref requirement-document-${index + 1}; determine its applicability and adoption status.` })),
    ];
    const priorReview = previous?.stages.find(stage => stage.name === 'review-accepted') ?? previous?.stages.find(stage => stage.name === 'review');
    const prior = priorReview?.evidence as ReviewEvidence | undefined;
    if (request.kind === 'iteration' && previous && !request.reviewReason && prior?.result.status === 'submitted'
      && prior.result.value.requirements.every(answer => answer.outcome === 'met') && !substantiveGaps(previous).length
      && !findingDetails(context.findingState()).some(detail => detail.summary.standing === 'open') && !protection.violations.length && !gaps.length && audit.state === 'passed') {
      await record('review-policy', { mode: 'not-run', reason: 'Selected correction verified by configured checks; no remaining semantic repair selected.', previousAssessment: previous.id });
      return compactOutcome({ gate: 'clear', summary: 'Repair candidate verified; broad review deliberately not repeated.',
        repairs: [], decisions: [], gaps: [], evidence: context.stages().map(stage => `assessments/${assessment.id}/stages/${stage.name}.json`) });
    }
    if (!stages('review-policy')) await record('review-policy', { mode: focused ? 'focused-follow-up' : 'broad',
      reason: request.reviewReason ?? (focused ? 'Verify selected repairs and relevant surrounding behavior.' : 'Initial assessment.'), previousAssessment: previous?.id ?? null });
    const intendedOutcome = request.brief
      + (request.focusModule === undefined ? '' : `\nDeclared module focus: ${request.focusModule ?? 'broader assignment'}. Focus is advisory; cross-module changes are allowed.`)
      + (request.additionalContext === undefined ? '' : `\nAdditional context:\n${request.additionalContext}`);
    const followUp = previous === undefined ? '' : `\nThis follows assessment ${previous.id} of candidate ${previous.request.candidate}. Prior outcome: ${previous.outcome?.gate ?? previous.status}.\n${previous.outcome?.repairs.join('\n') ?? ''}\nRetained requirement judgments: ${JSON.stringify(retainedRequirementAnswers(previous, context.assessments()))}\nInspect repaired behavior and dependencies again, including unchanged consumers whose reasoning the new changes invalidate. Previous inspection is not evidence for this candidate.`;
    // The immutable candidate makes both unchanged dependencies and changed files inspectable.
    const principles = request.requirementDocuments.map(document => ({ path: document.path, note: `Selected by the coordinator at ${document.revision}; filename alone does not establish adoption.` }));
    const baselineEntries = await source.treeEntries(projectRoot, baseline);
    const retainedEvidence = createAssessmentEvidenceTool({
      list: () => [
        { ref: 'captured-plan', description: 'Complete original captured plan' },
        { ref: `baseline:${job.plan.path}`, description: 'Original captured plan' },
        ...request.requirementDocuments.map((document, index) => ({ ref: `requirement-document-${index + 1}`, description: `${document.path} at ${document.revision}` })),
        ...context.assessments().flatMap(item => item.stages.map(stage => ({ ref: `assessments/${item.id}/stages/${stage.name}.json`, description: `${stage.name} evidence for candidate ${item.request.candidate}` }))),
        ...baselineEntries.filter(entry => entry.path !== job.plan.path && `baseline:${entry.path}`.length <= 500 && (entry.kind === 'file' || entry.kind === 'executable')).map(entry => ({ ref: `baseline:${entry.path}`, description: `Original at ${baseline}; inspect when relevant` })),
      ],
      read: async ref => {
        if (ref === 'captured-plan' || ref === `baseline:${job.plan.path}`) return context.planMarkdown;
        const required = /^requirement-document-(\d+)$/u.exec(ref);
        if (required) {
          const document = request.requirementDocuments[Number(required[1]) - 1]!;
          return source.readBlob(projectRoot, document.revision, document.path, signal);
        }
        if (ref.startsWith('baseline:')) return source.readBlob(projectRoot, baseline, ref.slice('baseline:'.length), signal);
        for (const item of context.assessments()) for (const stage of item.stages)
          if (`assessments/${item.id}/stages/${stage.name}.json` === ref) {
            if (stage.name === 'audit') return readAuditEvidence(stage.evidence, context.readEvidence);
            if (stage.name !== 'documents') return stage.evidence;
            return isDocumentsReference(stage.evidence) ? context.readEvidence(stage.evidence.artifact) : stage.evidence;
          }
        throw new Error('No retained evidence at that reference');
      },
    });
    let reviewed = stages<ReviewEvidence>('review-accepted') ?? stages<ReviewEvidence>('review');
    if (reviewed?.result.status === 'submitted') {
      try {
        await verifyRetainedReview(reviewed, { snapshot, source, projectRoot, signal });
      } catch (error) {
        signal.throwIfAborted();
        return retainedSourceGap(`Retained review source evidence is unavailable: ${errorText(error)}`);
      }
    }
    if (reviewed?.result.status !== 'submitted') {
      const prepared = await prepareAssistedReview({ source, projectRoot, signal, maxConcerns: 20,
        briefing: { id: assessment.id, iteration: assessment.id, snapshot, outcome: (focused ? 'Focused repair follow-up: inspect the selected repairs and relevant surrounding behavior. Do not repeat the broad iteration review or unchanged discretionary issues. Verify previously unmet requirements affected by the repair.\n' : '') + intendedOutcome + followUp, audit: { status: audit.state, detail: audit.detail },
          requirements, principles, protectionPaths: protection.violations.map(change => change.path), previousFindings: knownFindingSummary(context.findingState()) } });
      const withEvidence = { ...prepared, tools: { ...prepared.tools, definitions: [...prepared.tools.definitions, retainedEvidence] } };
      const operations = await dependencies.operations();
      const result = await scheduledReview(async () => (dependencies.review ?? runAssistedPiReview)({
        operations, runId: job.jobId, operationId: `${assessment.id}-review-${assessment.revision}`, projectRoot,
        candidate: snapshot.commit, tree: snapshot.tree, prepared: withEvidence, signal,
        onSubmitted: async (value, evidence) => {
          const bindings = await bindCandidateConcerns({ projectRoot, planId: job.planId, candidates: source, warn: message => limitations.push(message) },
            snapshot, prepared.tools, value, null, path => path === null ? 'ungrounded' : 'agent-generated');
          await record('review-accepted', { result: { status: 'submitted', value, ...evidence }, bindings, read: [...prepared.tools.read().keys()], inspected: [...prepared.tools.inspected()], sourceVerification: 'candidate-inspection/1', limitations });
        },
      }));
      const bindings = result.status === 'submitted' ? await bindCandidateConcerns({ projectRoot, planId: job.planId, candidates: source,
        warn: message => limitations.push(message) }, snapshot, prepared.tools, result.value, null,
        path => path === null ? 'ungrounded' : 'agent-generated') : [];
      reviewed = stages<ReviewEvidence>('review-accepted') ?? { result, bindings, read: [...prepared.tools.read().keys()], inspected: [...prepared.tools.inspected()], sourceVerification: 'candidate-inspection/1', limitations };
      await record('review', reviewed);
    }
    if (!stages('review') && reviewed.result.status === 'submitted') await record('review', reviewed);
    if (reviewed.result.status !== 'submitted') gaps.push(`Required review unavailable: ${reviewed.result.reason}`);
    else {
      const report = reviewed.result.value;
      for (const answer of report.requirements) if (answer.outcome === 'uncertain') gaps.push(`${answer.ref}: ${answer.explanation}`);
      const reports = reportReviewConcerns({ assessment: assessment.id, tree: snapshot.tree, report, bindings: reviewed.bindings,
        evidence: { kind: 'assisted-review', ref: `assessments/${assessment.id}/stages/review.json`, hash: digest(reviewed) } });
      if (reports.length) await context.recordFindings(reports, 'review-reports');
    }

    let reconciliation = stages<ReconciliationEvidence>('reconciliation-accepted') ?? stages<ReconciliationEvidence>('reconciliation');
    if (reconciliation?.status === 'submitted') {
      try {
        await verifyReconciliationSource(reconciliation, { snapshot, source, projectRoot, job, planMarkdown: context.planMarkdown, signal });
      } catch (error) {
        signal.throwIfAborted();
        return retainedSourceGap(`Retained reconciliation source evidence is unavailable: ${errorText(error)}`);
      }
    }
    const details = findingDetails(context.findingState());
    const attention = details.filter(detail => detail.summary.standing === 'open' && detail.summary.verification.kind === 'assessment' && detail.summary.pendingUserDecision === null);
    if (attention.length && reconciliation?.status !== 'submitted') {
      const state = context.findingState();
      const tools = snapshotTools(snapshot, source, projectRoot);
      const id = `${assessment.id}-reconciliation`;
      const entries = new Map<string, AttentionEntry>(attention.map(detail => [detail.summary.id, {
        revision: detail.summary.revision, reason: detail.summary.reason, awaiting: detail.summary.awaiting,
        risk: detail.summary.risk, modules: detail.summary.modules,
      }]));
      const message = reconciliationFactsMessage({ id, owner: 'assisted execution', round: 1, source: { commit: snapshot.commit, tree: snapshot.tree },
        introduction: `Reconcile concerns for assisted job ${job.jobId}, assessment ${assessment.id}. Investigate uncertain claims using the candidate tools. Deduplicate by the same behavior or obligation, never just location. Do not edit source.`,
        authority: 'You may plan repairs, replace disproved judgments, or verify semantic fixes after inspection. You cannot waive or defer obligations, change protected commitments, or dismiss factual required failures. Leave unresolved material decisions for the coordinator. Do not promote stylistic nits or speculative optional work.',
        context: `Audit: ${audit.state}. Protection conflicts: ${protection.violations.length}.\n${request.kind === 'final' && !focused ? `Captured plan:\n${context.planMarkdown}\n` : 'Original plan available with assessment_evidence ref captured-plan.\n'}Iteration: ${intendedOutcome}`,
        requests: [{ request: assessment.id, kind: 'code/scope/design', iteration: assessment.id, candidate: snapshot.commit,
          attempt: reviewed.result.operationId, result: reviewed.result.status === 'submitted' ? (gaps.length ? 'partial; see assessment gaps' : 'complete') : `not verified: ${reviewed.result.reason}` }],
        attention, others: details.filter(detail => !entries.has(detail.summary.id)).map(detail => detail.summary),
        iterations: [{ id: assessment.id, goal: intendedOutcome + followUp, outcome: null }],
        earlier: context.assessments().filter(item => item.id !== assessment.id && item.outcome !== null).map(item => ({ id: item.id, next: item.outcome!.gate, brief: item.outcome!.summary })), refused: [],
      });
      const operations = await dependencies.operations();
      reconciliation = await (dependencies.reconcile ?? runPiAssessment)({ operations, runId: job.jobId,
        operationId: `${assessment.id}-reconciliation-${assessment.revision}`, projectRoot, candidate: snapshot.commit, tree: snapshot.tree,
        message, systemPrompt: 'Investigate and reconcile the supplied findings using the pinned candidate evidence. Submit one disposition for each requested finding and evidence-backed relations. Inspect relevant code, tests and consumers before fixing or superseding a concern. Required checks and protection conflicts remain factual obligations. Use submit_reconciliation.',
        tools: [...tools.definitions, retainedEvidence], signal,
        onSubmitted: async (value, evidence) => record('reconciliation-accepted', { status: 'submitted', value, ...evidence, exactSourceReads: [...tools.read().keys()] }),
        submission: { name: 'submit_reconciliation', description: 'Submit the reconciled judgments and remaining action brief.',
          inputSchema: z.toJSONSchema(reconciliationSubmissionSchema) as JsonSchema,
          validate: async value => {
            const validated = await validateReconciliationForExecution(value, { id, owner: job.jobId, attention: entries,
              held: new Map(details.map(detail => [detail.summary.id, detail.summary.revision])),
              actor: { kind: 'agent', role: 'assisted-reconciler', invocation: id }, source: { kind: 'tree', id: snapshot.tree },
              authority: { kind: 'governing-record', ref: job.plan.storedAt }, responsible: { kind: 'run' },
              waiverRefusal: () => 'requires coordinator authority for a waiver',
              evidence: () => [{ kind: 'assisted-reconciliation', ref: `assessments/${assessment.id}/stages/reconciliation.json`, hash: null }],
              document: async path => {
                if (path === job.plan.path || path === 'captured-plan') return { text: context.planMarkdown, revision: `sha256:${job.plan.sha256}` };
                const entry = snapshot.entries.get(path);
                if (!entry) return null;
                try { return { text: new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(
                  await readCandidateDocument(projectRoot, snapshot.commit, entry, source)), revision: snapshot.tree }; }
                catch { return null; }
              },
              decide: command => { const result = decideCheckFindingChange(state, command); return result.ok ? null : result.rejection; },
            });
            if (!validated.ok) return validated;
            const errors = validated.value.submission.dispositions.flatMap((item, index) => {
              if (item.action.action === 'defer') return [{ path: `dispositions.${index}.action`, message: 'Deferral requires coordinator authority; leave the concern open or propose a repair.' }];
              if ((item.action.action === 'fixed' || item.action.action === 'supersede') && tools.read().size === 0)
                return [{ path: `dispositions.${index}.action`, message: 'Inspect candidate source before closing a semantic concern.' }];
              return [];
            });
            return errors.length ? { ok: false as const, errors } : validated;
          } },
      });
      reconciliation = { ...reconciliation, exactSourceReads: [...tools.read().keys()] };
      await record('reconciliation', reconciliation);
    }
    if (reconciliation?.status === 'submitted') await context.recordFindings(reconciliation.value.commands, 'reconciliation-decisions');
    else if (attention.length) gaps.push(`Reconciliation unavailable: ${reconciliation?.reason ?? 'no valid assessment'}`);

    const remaining = remainingBriefs(findingDetails(context.findingState()).filter(detail => !authorizedProtectionFinding(detail.summary, protection)));
    if (reviewed.result.status !== 'submitted') gaps.push(...substantiveGaps(previous));
    const answers = retainedRequirementAnswers({ ...assessment, stages: [...context.stages()] }, context.assessments());
    for (const answer of answers) {
      if (answer.outcome === 'uncertain') gaps.push(`${answer.ref}: ${answer.explanation}`);
      if (answer.outcome === 'unmet' && !(answer.pendingProtection?.length && answer.pendingProtection.every(path => protection.changes.some(change => change.path === path && change.authorizedBy !== null)))) remaining.repairs.push(`${answer.ref}: ${answer.explanation}`);
    }
    for (const change of protection.violations) if (!remaining.repairs.some(text => text.includes(change.path))) remaining.decisions.push(`Protected change ${change.path} requires an exact authorized exception or restoration.`);
    await record('approval-readiness', approvalReadiness({ assessment, job, stages: context.stages(), tree: snapshot.tree, gaps, state: context.findingState() }));
    return compactOutcome({ gate: gaps.length ? 'incomplete' : remaining.repairs.length || remaining.decisions.length ? 'action-required' : 'clear',
      summary: gaps.length ? 'Assessment has required evidence gaps; established issues are retained.'
        : remaining.repairs.length || remaining.decisions.length ? 'Assessment completed with remaining actions.' : 'Required assessment completed with no remaining material issue.',
      ...remaining, gaps, evidence: [...new Set([...evidence, ...context.stages().map(stage => `assessments/${assessment.id}/stages/${stage.name}.json`)])] });
  };
}

async function verifyCandidateReads(paths: readonly string[], input: {
  snapshot: CandidateSnapshot; source: CandidateSource; projectRoot: string; signal: AbortSignal;
}): Promise<void> {
  for (const path of new Set(paths)) {
    const held = resolveSnapshotPath(input.snapshot, path);
    if (!held.ok || held.kind !== 'file') throw new Error(`Historical read evidence ${path} is unavailable`);
    await input.source.readBlob(input.projectRoot, input.snapshot.commit, held.path, input.signal);
  }
}

async function verifyRetainedReview(review: ReviewEvidence, input: {
  snapshot: CandidateSnapshot; source: CandidateSource; projectRoot: string; signal: AbortSignal;
}): Promise<void> {
  if (review.result.status !== 'submitted') throw new Error('Historical settlement has no accepted review');
  const report = review.result.value;
  if (review.sourceVerification === 'candidate-inspection/1') {
    // The accepted report belongs to this immutable candidate. Ordinary shell
    // evidence may be binary and has no snapshot_read receipt to reproduce.
    // Retained limitations and optional historical inventories impose no reads.
    for (const path of report.requirements.flatMap(answer => answer.evidencePaths)) {
      const held = resolveSnapshotPath(input.snapshot, path);
      if ((!held.ok || held.kind !== 'file') && !input.snapshot.changes.some(change => change.path === path && change.status === 'D'))
        throw new Error(`Retained candidate evidence ${path} is unavailable`);
    }
    return;
  }
  const paths = [...review.read, ...review.inspected, ...report.inspected, ...report.requirements.flatMap(answer => answer.evidencePaths),
    ...report.concerns.flatMap(concern => concern.ground === null ? [] : [concern.ground.path])];
  if (review.sourceVerification === 'git-exact-text/1') {
    // This producer verified every delivered channel. An exact read of a
    // repaired file need not rely on the old malformed base's patch text.
    await verifyCandidateReads(review.read, input);
    await verifySnapshotEvidence(input.snapshot, input.source, input.projectRoot, paths.filter(path => !review.read.includes(path)), input.signal);
  } else await verifySnapshotEvidence(input.snapshot, input.source, input.projectRoot, paths, input.signal);
}

async function verifyReconciliationSource(reconciliation: ReconciliationEvidence & { status: 'submitted' }, input: {
  snapshot: CandidateSnapshot; source: CandidateSource; projectRoot: string; job: AssistedJob; planMarkdown: string; signal: AbortSignal;
}): Promise<void> {
  const { snapshot, source, projectRoot, job, planMarkdown, signal } = input;
  const closing = reconciliation.value.submission.dispositions.some(item => item.action.action === 'fixed' || item.action.action === 'supersede');
  if (closing && !reconciliation.exactSourceReads?.length) throw new Error('Historical semantic closure has no retained exact source-read provenance');
  await verifyCandidateReads(reconciliation.exactSourceReads ?? [], input);
  for (const bound of reconciliation.value.conflicts) for (const conflict of bound.conflicts) {
    const captured = conflict.document === job.plan.path || conflict.document === 'captured-plan';
    const text = captured ? planMarkdown : await source.readBlob(projectRoot, snapshot.commit, conflict.document, signal);
    const revision = captured ? `sha256:${job.plan.sha256}` : snapshot.tree;
    if (conflict.revision !== revision || !text.includes(conflict.text)) throw new Error(`Historical conflicting text in ${conflict.document} is not exact source evidence`);
  }
}

function incomplete(summary: string, gaps: string[]): AssistedOutcome {
  return { gate: 'incomplete', summary, gaps, repairs: [], decisions: [], evidence: [] };
}

/** One combined question uses the existing review queue; Astra never schedules reviewers. */
async function scheduledReview<T>(run: () => Promise<T>): Promise<T> {
  let pending = true;
  let result: T | undefined;
  let failure: unknown;
  const queue = new ReviewQueue({ concurrency: 1, queue: 1, preserveCoverage: true,
    unsettled: () => pending ? ['combined'] : [], attempt: async () => {
      try { result = await run(); } catch (error) { failure = error; } finally { pending = false; }
      return true;
    }, overflow: async () => { pending = false; failure = new Error('Required review could not be scheduled'); }, warn: message => { failure = new Error(message); } });
  queue.wake();
  try { await queue.settled(); } finally { queue.close(); }
  if (failure !== undefined) throw new Error(`Review failed: ${errorText(failure)}`);
  if (result === undefined) throw new Error('Required review produced no result');
  return result;
}

/** Keep routine coordinator output small; full reports and findings remain available on demand. */
export function compactOutcome(outcome: AssistedOutcome): AssistedOutcome {
  const summarize = (items: readonly string[], label: string): string[] => {
    const shown: string[] = [];
    let budget = 4000;
    for (const item of items) {
      if (budget < 300) break;
      const limit = Math.min(900, budget);
      const text = item.length <= limit ? item : `${item.slice(0, limit - 48)}… [details retained in assessment evidence]`;
      shown.push(text); budget -= text.length;
    }
    if (shown.length < items.length) shown.push(`${items.length - shown.length} additional ${label}; retrieve assessment_detail and finding_list. All remain part of this gate result.`);
    return shown;
  };
  return { ...outcome, repairs: summarize(outcome.repairs, 'repairs'), decisions: summarize(outcome.decisions, 'decisions'), gaps: summarize(outcome.gaps, 'coverage gaps') };
}
