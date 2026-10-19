import { assistedReviewSubmissionSchema } from '../../reviews/src/assisted.js';
import type { AssistedAssessment } from './contracts.js';

/** A compact projection of existing records, never an evidence cache or a new acceptance decision. */
export function finalIterationContext(current: AssistedAssessment, assessments: readonly AssistedAssessment[], protection: string) {
  const at = assessments.findIndex(item => item.id === current.id);
  const previous = at < 0 ? [] : assessments.slice(0, at);
  const acceptedReviewRefs: string[] = [];
  const iterations = previous.filter(item => item.request.kind === 'iteration').map(item => {
    const stage = item.stages.find(stage => stage.name === 'review-accepted') ?? item.stages.find(stage => stage.name === 'review');
    const result = stage?.evidence as { result?: { status?: string; value?: unknown } } | undefined;
    const parsed = result?.result?.status === 'submitted' ? assistedReviewSubmissionSchema.safeParse(result.result.value) : undefined;
    const report = item.status === 'completed' && parsed?.success ? parsed.data : undefined;
    const reviewRef = report === undefined ? undefined : `assessments/${item.id}/stages/${stage!.name}.json`;
    if (reviewRef !== undefined) acceptedReviewRefs.push(reviewRef);
    return { id: item.id, iteration: item.request.iterationId ?? item.id, goal: item.request.brief.slice(0, 700), base: item.request.base, candidate: item.request.candidate, status: item.status,
      gate: item.outcome?.gate ?? 'unassessed',
      conclusion: report === undefined ? (item.outcome?.summary ?? 'No completed accepted review is available.').slice(0, 700)
        : [report.codeAssessment, report.scopeAssessment, report.design.assessment].map(text => text.slice(0, 250)).join(' | '),
      remaining: [
        ...(report?.requirements.filter(answer => answer.outcome !== 'met').map(answer => `${answer.ref} ${answer.outcome}: ${answer.explanation}`) ?? []),
        ...(report?.limitations ?? []), ...(report?.coverageGap ? [report.coverageGap] : []),
        ...(item.outcome?.repairs ?? []), ...(item.outcome?.decisions ?? []), ...(item.outcome?.gaps ?? []),
      ].slice(0, 12).map(text => text.slice(0, 500)),
      evidenceRefs: [`assessments/${item.id}`, `assessments/${item.id}/diff`, ...(reviewRef === undefined ? [] : [reviewRef])],
    };
  });
  return { total: iterations.length, iterations: iterations.slice(-30), acceptedReviewRefs, protection };
}
