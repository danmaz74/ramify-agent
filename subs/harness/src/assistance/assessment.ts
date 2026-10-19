import { verifiedCandidateSource } from '../../subs/evidence/src/git-text.js';
import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { JsonSchema } from '../../subs/agent/src/interfaces/port.js';
import type { SessionOperations } from '../../subs/agent/src/interfaces/session-operations.js';
import { decideCheckFindingChange } from '../../subs/check-findings/src/decide.js';
import { gitCandidateSource, type CandidateSource } from '../../subs/evidence/src/git.js';
import { openCandidateSnapshot, snapshotTools, verifySnapshotEvidence, resolveSnapshotPath, type CandidateSnapshot } from '../../subs/reviews/src/snapshot.js';
import { prepareAssistedReview, type AssistedReviewSubmission } from '../../subs/reviews/src/assisted.js';
import { bindCandidateConcerns, type ConcernBinding } from '../run/review-finish.js';
import { ReviewQueue } from '../reviews/scheduler.js';
import { reconciliationFactsMessage } from '../reviews/reconciliation-message.js';
import { reconciliationSubmissionSchema, validateReconciliationForExecution, type AttentionEntry, type BoundReconciliation } from '../reviews/reconciliation.js';
import type { Assessor, AssistedEvidenceReference, AssistedOutcome, AssistedAssessment, AssistedJob } from './contracts.js';
import { auditAssistedCandidate, type AssistedAuditOutcome } from './audit.js';
import { approvalReadiness } from './approval.js';
import { compareProtection, type ProtectionComparison } from './protection.js';
import { captureAssistanceDocuments, qualifyLegacyDocuments, readAssistanceDocument, readCandidateDocument, type AssistanceDocuments } from './documents.js';
import { createAssessmentEvidenceTool } from './pi-evidence.js';
import { runAssistedPiReview, runPiAssessment, type AssistedPiReviewInput, type PiAssessmentInput, type PiAssessmentResult } from './pi.js';
import { acceptedProtectionExceptions, authorizedProtectionFinding, factualFindingCommands, findingDetails, remainingBriefs, reportReviewConcerns, summaries, unverifiedSemanticClosures } from './findings.js';

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
  readonly sourceVerification?: 'git-exact-text/1';
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
    const auditPrevious = stages<AssistedAuditOutcome>('audit');
    const audit = auditPrevious?.state === 'passed' || auditPrevious?.state === 'failed' ? auditPrevious
      : await (dependencies.audit ?? auditAssistedCandidate)({ projectRoot, baselineCommit: baseline, candidateCommit: snapshot.commit,
        jobId: job.jobId, attemptId: `${assessment.id}-audit`, signal });
    if (audit !== auditPrevious) await record('audit', audit);
    if (audit.state === 'unavailable') gaps.push(`Audit evidence unavailable: ${audit.detail}`);

    const protection = stages<ProtectionComparison>('protection') ?? await (dependencies.protection ?? compareProtection)({
      projectRoot, baselineCommit: baseline, candidateCommit: snapshot.commit, rules: job.protection!.rules, candidates: source, signal,
      exceptions: acceptedProtectionExceptions(context.findingState(), context.assessments()),
    });
    if (!stages('protection')) await record('protection', protection);
    const factualEvidence = { kind: 'assisted-checks', ref: `assessments/${assessment.id}/stages/audit.json`, hash: digest(audit) };
    // Pure domain ingestion is already idempotent; keying the transaction also covers decisions after a restart.
    const factual = factualFindingCommands({ state: context.findingState(), assessment: assessment.id, tree: snapshot.tree, audit, protection,
      protectionSelection: digest({ baseline, rules: job.protection!.rules }), evidence: factualEvidence,
      protectionEvidence: { kind: 'protection-comparison', ref: `assessments/${assessment.id}/stages/protection.json`, hash: digest(protection) } });
    if (factual.length) await context.recordFindings(factual);

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

    const captureDocuments = () => captureAssistanceDocuments({ projectRoot, planId: job.planId,
      planMarkdown: context.planMarkdown, baselineCommit: baseline, candidates: source });
    const savedDocuments = stages<AssistanceDocuments | DocumentsReference>('documents');
    let documents: AssistanceDocuments;
    if (isDocumentsReference(savedDocuments)) {
      if (savedDocuments.baselineCommit !== baseline) throw new Error('Retained documents name another baseline');
      try { documents = await context.readEvidence(savedDocuments.artifact) as AssistanceDocuments; }
      catch {
        // Recovery uses the same immutable source and must reproduce the exact committed artifact.
        documents = await captureDocuments();
        const regenerated = await context.retainEvidence(documents);
        if (regenerated.sha256 !== savedDocuments.artifact.sha256 || regenerated.path !== savedDocuments.artifact.path) throw new Error('Retained document evidence is unavailable and could not be reproduced exactly');
      }
    } else if (savedDocuments) documents = savedDocuments;
    else {
      documents = await captureDocuments();
      await record('documents', { schema: 'ramify-agent.assisted-document-reference/1', baselineCommit: baseline,
        artifact: await context.retainEvidence(documents) } satisfies DocumentsReference);
    }
    if (documents.baselineCommit !== baseline) throw new Error('Retained documents name another baseline');
    const previousPrincipleGaps = documents.gaps.unreadablePrinciples.length;
    const previousDocumentGaps = documents.gaps.unreadableDocuments?.length ?? 0;
    documents = await qualifyLegacyDocuments({ projectRoot, planMarkdown: context.planMarkdown, documents, candidates: source });
    const legacyEvidenceChanged = documents.gaps.unreadablePrinciples.length !== previousPrincipleGaps
      || (documents.gaps.unreadableDocuments?.length ?? 0) !== previousDocumentGaps;
    // Existing finding operation identities cannot be repurposed for another review.
    const cachedReview = stages<ReviewEvidence>('review-accepted') ?? stages<ReviewEvidence>('review');
    if (legacyEvidenceChanged && cachedReview?.result.status === 'submitted') {
      return retainedSourceGap('Retained review predates verification of unavailable historical document evidence; a fresh assessment must determine its applicability.');
    }
    gaps.push(...documents.gaps.unreadablePrinciples.map(gap => `Principle evidence ${gap.path} is unavailable: ${gap.reason}`));
    const referenceQualifications = [
      ...documents.gaps.missing.map(gap => ({ ...gap, from: documents.manifest.documents.find(document => document.id === gap.from)?.path ?? gap.from })),
      ...(documents.gaps.outsideProject ?? []),
      ...(documents.gaps.unreadableDocuments ?? []).map(gap => ({ ...gap, target: gap.path })),
    ];
    const discoveryContext = referenceQualifications.length === 0 ? '' : `\nUncaptured document references (retained qualifications, not automatically additional obligations):\n${JSON.stringify(referenceQualifications)}\nA link alone does not establish applicability or binding force. Assess whether these references are required for this outcome, using the captured plan and ordinary candidate and retained-evidence tools. Explain unrelated historical references in scopeAssessment. If applicable required evidence remains unavailable, mark the affected requirement uncertain or report a coverageGap; do not claim clear coverage. Outside-project targets were not read and must not be accessed.`;
    const requirements = [
      { ref: 'captured-plan', text: `${request.kind === 'final' ? 'Assess every outcome of the complete captured plan against the cumulative candidate.' : 'Assess this iteration against the applicable constraints and outcomes of this captured plan; future iterations are not required to be implemented yet.'}\n${context.planMarkdown}${discoveryContext}` },
      ...request.acceptance.map((text, index) => ({ ref: `acceptance-${index + 1}`, text })),
    ];
    for (const [index, document] of request.requirementDocuments.entries()) {
      try {
        const entry = (await source.treeEntries(projectRoot, document.revision)).find(entry => entry.path === document.path);
        if (!entry) throw new Error('No committed document at this revision');
        const text = new TextDecoder('utf-8', { fatal: true }).decode(await readCandidateDocument(projectRoot, document.revision, entry, source));
        requirements.push({ ref: `requirement-document-${index + 1}`, text: `${document.path} at ${document.revision}:\n${text}` });
      } catch (error) { gaps.push(`Required document ${document.path} at ${document.revision} is unavailable: ${errorText(error)}`); }
    }
    const previous = request.previousAssessment === undefined ? undefined : context.assessments().find(item => item.id === request.previousAssessment);
    const intendedOutcome = request.brief
      + (request.focusModule === undefined ? '' : `\nDeclared module focus: ${request.focusModule ?? 'broader assignment'}. Focus is advisory; cross-module changes are allowed.`)
      + (request.additionalContext === undefined ? '' : `\nAdditional context:\n${request.additionalContext}`);
    const followUp = previous === undefined ? '' : `\nThis follows assessment ${previous.id} of candidate ${previous.request.candidate}. Prior outcome: ${previous.outcome?.gate ?? previous.status}.\n${previous.outcome?.repairs.join('\n') ?? ''}\nInspect repaired behavior and dependencies again, including unchanged consumers whose reasoning the new changes invalidate. Previous inspection is not evidence for this candidate.`;
    // The immutable candidate makes both unchanged dependencies and changed files inspectable.
    const principles = documents.documents.filter(document => document.kind === 'principle')
      .map(document => ({ path: document.path, note: `Baseline ${baseline}; adoption undetermined. Assess applicability and status. Read exact text with assessment_evidence ref baseline:${document.path}, continuing chunks through nextOffset. If applicable required text is unavailable or uninspected, report uncertain evidence or a coverageGap.` }));
    const retainedEvidence = createAssessmentEvidenceTool({
      list: () => [
        ...context.assessments().flatMap(item => item.stages.map(stage => ({ ref: `assessments/${item.id}/stages/${stage.name}.json`, description: `${stage.name} evidence for candidate ${item.request.candidate}` }))),
        ...documents.documents.map(document => ({ ref: `baseline:${document.path}`, description: `${document.kind} at ${baseline}; adoption ${document.adoption}` })),
      ],
      read: async ref => {
        const document = documents.documents.find(item => `baseline:${item.path}` === ref);
        if (document) return { ...document, text: await readAssistanceDocument({ projectRoot, planMarkdown: context.planMarkdown,
          documents, id: document.id, candidates: source }) };
        for (const item of context.assessments()) for (const stage of item.stages)
          if (`assessments/${item.id}/stages/${stage.name}.json` === ref) {
            if (stage.name !== 'documents') return stage.evidence;
            if (item.id === assessment.id) return documents;
            const historical = isDocumentsReference(stage.evidence) ? await context.readEvidence(stage.evidence.artifact) as AssistanceDocuments : stage.evidence as AssistanceDocuments;
            return qualifyLegacyDocuments({ projectRoot, planMarkdown: context.planMarkdown, documents: historical, candidates: source });
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
        briefing: { id: assessment.id, iteration: assessment.id, snapshot, outcome: intendedOutcome + followUp, audit: { status: audit.state, detail: audit.detail },
          requirements, principles, protectionPaths: protection.violations.map(change => change.path), previousFindings: summaries(context.findingState()).map(item => ({ id: item.id, title: item.title, standing: item.standing })) } });
      const withEvidence = { ...prepared, tools: { ...prepared.tools, definitions: [...prepared.tools.definitions, retainedEvidence] } };
      const operations = await dependencies.operations();
      const result = await scheduledReview(async () => (dependencies.review ?? runAssistedPiReview)({
        operations, runId: job.jobId, operationId: `${assessment.id}-review-${assessment.revision}`, projectRoot,
        candidate: snapshot.commit, tree: snapshot.tree, prepared: withEvidence, signal,
        onSubmitted: async (value, evidence) => {
          const bindings = await bindCandidateConcerns({ projectRoot, planId: job.planId, candidates: source, warn: message => gaps.push(message) },
            snapshot, prepared.tools, value, null, path => path === null ? 'ungrounded' : 'agent-generated');
          await record('review-accepted', { result: { status: 'submitted', value, ...evidence }, bindings, read: [...prepared.tools.read().keys()], inspected: [...prepared.tools.inspected()], sourceVerification: 'git-exact-text/1' });
        },
      }));
      const bindings = result.status === 'submitted' ? await bindCandidateConcerns({ projectRoot, planId: job.planId, candidates: source,
        warn: message => gaps.push(message) }, snapshot, prepared.tools, result.value, null,
        path => path === null ? 'ungrounded' : 'agent-generated') : [];
      reviewed = stages<ReviewEvidence>('review-accepted') ?? { result, bindings, read: [...prepared.tools.read().keys()], inspected: [...prepared.tools.inspected()], sourceVerification: 'git-exact-text/1' };
      await record('review', reviewed);
    }
    if (!stages('review') && reviewed.result.status === 'submitted') await record('review', reviewed);
    if (reviewed.result.status !== 'submitted') gaps.push(`Required review unavailable: ${reviewed.result.reason}`);
    else {
      const report = reviewed.result.value;
      if (report.coverageGap) gaps.push(`Review coverage incomplete: ${report.coverageGap}`);
      for (const missing of report.missing) gaps.push(`Review did not inspect ${missing.path}: ${missing.reason}`);
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
        context: `Audit: ${audit.state}. Protection conflicts: ${protection.violations.length}.\nCaptured plan:\n${context.planMarkdown}\nIteration: ${intendedOutcome}`,
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
    if (reviewed.result.status === 'submitted') for (const answer of reviewed.result.value.requirements) {
      if (answer.outcome === 'unmet' && !(answer.pendingProtection?.length && answer.pendingProtection.every(path => protection.changes.some(change => change.path === path && change.authorizedBy !== null)))) remaining.repairs.push(`${answer.ref}: ${answer.explanation}`);
    }
    if (audit.state === 'failed' && !remaining.repairs.length) remaining.repairs.push(`Required audit failed: ${audit.detail}`);
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
