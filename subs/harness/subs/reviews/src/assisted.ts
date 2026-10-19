import { z } from 'zod';
import type { CandidateSource } from '../../evidence/src/git.js';
import { schemaErrors, type SubmissionError, type SubmissionValidation } from '../../task-execution/src/submissions.js';
import { prepareCandidateReview, type PreparedReview } from './preparation.js';
import { reviewSubmissionSchema } from './interfaces/submissions.js';
import { validateReview, type ReviewEvidence } from './submission.js';
import { resolveChangedPath, resolveSnapshotPath, type CandidateSnapshot } from './snapshot.js';

/** An explicit acceptance reference supplied by the coordinator or captured plan. */
export interface AssistedRequirement {
  readonly ref: string;
  readonly text: string;
}

const requirementAnswerSchema = z.object({
  ref: z.string().min(1),
  outcome: z.enum(['met', 'unmet', 'uncertain']),
  explanation: z.string().min(1).max(4000),
  evidencePaths: z.array(z.string().min(1)).max(50),
  /** All other obligations are met; only these factual protection choices remain. */
  pendingProtection: z.array(z.string().min(1)).min(1).max(50).optional(),
}).strict();

/** A combined code/scope report with optional legacy inspection records. */
export const assistedReviewSubmissionSchema = reviewSubmissionSchema.extend({
  codeAssessment: z.string().min(1).max(4000),
  scopeAssessment: z.string().min(1).max(4000),
  design: z.object({ needed: z.boolean(), reason: z.string().min(1).max(4000), assessment: z.string().min(1).max(4000) }).strict(),
  requirements: z.array(requirementAnswerSchema).max(500),
  /** Legacy limitation prose; retained without imposing an automatic coverage gate. */
  coverageGap: z.string().min(1).max(4000).nullable().optional(),
}).strict();
export type AssistedReviewSubmission = z.infer<typeof assistedReviewSubmissionSchema>;

export interface AssistedReviewBriefing {
  readonly id: string;
  readonly iteration: string;
  readonly snapshot: CandidateSnapshot;
  readonly outcome: string;
  readonly audit: { readonly status: 'passed' | 'failed' | 'pending' | 'unavailable'; readonly detail?: string };
  readonly requirements: readonly AssistedRequirement[];
  readonly principles: readonly { readonly path: string; readonly note: string }[];
  readonly protectionPaths?: readonly string[];
  readonly previousFindings?: readonly { readonly id: string; readonly title: string; readonly standing: string; readonly decision?: string; readonly rationale?: string }[];
}

/** The assisted caller supplies facts; preparation never fabricates a work item or passing gate. */
export function assistedReviewMessage(input: AssistedReviewBriefing, diffPayload: string): string {
  const { snapshot } = input;
  const lines = [
    `Combined code and scope review ${input.id} for iteration ${input.iteration}.`, '',
    `Candidate commit: ${snapshot.commit}; tree: ${snapshot.tree}; base commit: ${snapshot.base}.`,
    `Audit: ${input.audit.status}${input.audit.detail ? ` — ${input.audit.detail}` : ''}.`, '',
    '## Intended outcome', '', input.outcome, '',
    '## Acceptance references', '',
    ...input.requirements.map(item => `- ${item.ref}: ${item.text}`), '',
    'Answer every acceptance reference, including requirements with no implementation. Mark missing behavior unmet and uncertain evidence uncertain. Support conclusions with relevant candidate evidence selected through ordinary inspection. Do not infer an audit pass from pending, failed or unavailable audit evidence.', '',
    `Unauthorized protected differences: ${JSON.stringify(input.protectionPaths ?? [])}. For an unmet requirement whose implementation and all other obligations are satisfied, pendingProtection may name only these exact paths when their authorization is the sole remaining condition. Keep uncertain evidence uncertain. Do not create a semantic concern solely to duplicate a factual protection choice.`, '',
    '## Selected guidance', '',
    ...(input.principles.length ? input.principles.map(item => `- ${item.path}: ${item.note}`) : ['None supplied.']), '',
    '## Changed paths', '',
    ...(snapshot.changes.length ? snapshot.changes.map(change => `- ${change.status} ${change.path}`) : ['No paths changed.']), '',
    diffPayload, '',
    'Review code behavior, tests, consumers, intended scope and design together. Scope means intended outcomes, missing behavior and unjustified unrelated work; module boundaries do not restrict edits. Inspect relevant source with the supplied candidate tools, including shell. Do not edit source. Assess interface, ownership, dependency, protocol and principle-sensitive consequences in design.assessment. Set design.needed when these changes warrant deliberate design attention and explain why; the combined assessment still answers them. Put minor observations and nits in assessment prose, not actionable concerns. If more than 20 material concerns remain, submit the first 20 and state the unfinished coverage in coverageGap; never silently truncate. Answer the supplied acceptance references; choose inspection by relevance. Unread files are not automatically evidence gaps. Report meaningful limitations in assessment prose or limitations.',
  ];
  if (input.previousFindings?.length) lines.push('', '## Earlier findings', '', 'Avoid repeating unchanged issues. Explain meaningful changed circumstances when raising an existing issue again. At most 20 recent findings are summarized; retained records remain available on demand.', '', ...input.previousFindings.map(item => `- ${item.id} (${item.standing}): ${item.title}; decision: ${item.decision ?? 'undecided'}; rationale: ${item.rationale ?? 'none'}`));
  return lines.join('\n');
}

/** Validate supplied acceptance answers and their candidate references without a coverage inventory. */
export function validateAssistedReview(value: unknown, evidence: ReviewEvidence, requirements: readonly AssistedRequirement[], protectionPaths: readonly string[] = []): SubmissionValidation<AssistedReviewSubmission> {
  const parsed = assistedReviewSubmissionSchema.safeParse(value);
  if (!parsed.success) return { ok: false, errors: schemaErrors(parsed.error) };
  const report = parsed.data;
  const legacy = validateReview({ inspected: report.inspected, missing: report.missing, concerns: report.concerns }, evidence);
  const errors: SubmissionError[] = legacy.ok ? [] : [...legacy.errors];
  const expected = new Set(requirements.map(item => item.ref));
  if (expected.size !== requirements.length) errors.push({ path: 'requirements', message: 'Acceptance references must have distinct IDs' });
  const seen = new Set<string>();
  report.requirements.forEach((answer, index) => {
    const where = `requirements.${index}`;
    if (!expected.has(answer.ref)) errors.push({ path: `${where}.ref`, message: `Unknown acceptance reference ${answer.ref}` });
    if (seen.has(answer.ref)) errors.push({ path: `${where}.ref`, message: `Repeated acceptance reference ${answer.ref}` });
    seen.add(answer.ref);
    if (answer.pendingProtection && (answer.outcome !== 'unmet' || answer.pendingProtection.some(path => !protectionPaths.includes(path))))
      errors.push({ path: `${where}.pendingProtection`, message: 'Pending protection requires an unmet answer and exact factual unauthorized paths; all other obligations must be satisfied' });
    if ((answer.outcome === 'met' || answer.pendingProtection) && answer.evidencePaths.length === 0)
      errors.push({ path: `${where}.evidencePaths`, message: `Met acceptance reference ${answer.ref} needs inspected source evidence` });
    for (const [at, path] of answer.evidencePaths.entries()) {
      const resolved = resolveSnapshotPath(evidence.snapshot, path);
      const changed = resolveChangedPath(evidence.snapshot, path);
      if (!(resolved.ok && resolved.kind === 'file') && typeof changed !== 'string')
        errors.push({ path: `${where}.evidencePaths.${at}`, message: `The candidate does not contain or delete a file at ${path}` });

    }
  });
  for (const ref of expected) if (!seen.has(ref)) errors.push({ path: 'requirements', message: `No answer for acceptance reference ${ref}` });
  return errors.length ? { ok: false, errors } : { ok: true, value: report };
}

export interface AssistedReviewPreparation {
  readonly source: CandidateSource;
  readonly projectRoot: string;
  readonly briefing: AssistedReviewBriefing;
  readonly maxConcerns: number;
  readonly signal?: AbortSignal;
}

export async function prepareAssistedReview(input: AssistedReviewPreparation): Promise<Omit<PreparedReview, 'validate'> & {
  readonly validate: (value: unknown) => SubmissionValidation<AssistedReviewSubmission>;
}> {
  return prepareCandidateReview({
    source: input.source, projectRoot: input.projectRoot, snapshot: input.briefing.snapshot,
    maxConcerns: input.maxConcerns, signal: input.signal,
    message: diff => assistedReviewMessage(input.briefing, diff),
    validate: (value, evidence) => validateAssistedReview(value, evidence, input.briefing.requirements, input.briefing.protectionPaths),
  });
}
