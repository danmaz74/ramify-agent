import { sourceTestQualityGuidance } from './test-reliability.js';
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

const iterationRequirementAnswerSchema = z.object({
  ref: z.string().min(1),
  outcome: z.enum(['met', 'unmet', 'uncertain']),
  explanation: z.string().min(1).max(4000),
  evidencePaths: z.array(z.string().min(1)).max(50),
  /** All other obligations are met; only these factual protection choices remain. */
  pendingProtection: z.array(z.string().min(1)).min(1).max(50).optional(),
}).strict();

/** Final review may cite actual accepted iteration reports; explanation states why they apply. */
const finalRequirementAnswerSchema = iterationRequirementAnswerSchema.extend({
  evidenceRefs: z.array(z.string().min(1)).max(50).optional()
    .describe('Accepted iteration review references listed in the task, for example assessments/as-0001/stages/review.json. The explanation states why each applies to this candidate. Other record or diff references are for inspection, not evidence.'),
}).strict();

function assistedReviewSchema<T extends z.ZodRawShape>(answer: z.ZodObject<T>) {
  return reviewSubmissionSchema.extend({
    codeAssessment: z.string().min(1).max(4000),
    scopeAssessment: z.string().min(1).max(4000),
    design: z.object({ needed: z.boolean(), reason: z.string().min(1).max(4000), assessment: z.string().min(1).max(4000) }).strict(),
    requirements: z.array(answer).max(500),
    /** Legacy limitation prose; retained without imposing an automatic coverage gate. */
    coverageGap: z.string().min(1).max(4000).nullable().optional(),
  }).strict();
}

/** A combined code/scope report with optional legacy inspection records; accepts both iteration and final submissions. */
export const assistedReviewSubmissionSchema = assistedReviewSchema(finalRequirementAnswerSchema);
export type AssistedReviewSubmission = z.infer<typeof assistedReviewSubmissionSchema>;

/**
 * The submission shape declared to the reviewer. Only the final review offers evidenceRefs: an
 * iteration review has no accepted iteration evidence to cite, so offering the field there only
 * invites rejected submissions.
 */
export function assistedReviewDeclarationSchema(kind: 'iteration' | 'final' | undefined) {
  return kind === 'final' ? assistedReviewSubmissionSchema : assistedReviewSchema(iterationRequirementAnswerSchema);
}

export interface AssistedReviewBriefing {
  readonly id: string;
  readonly kind?: 'iteration' | 'final';
  readonly finalContext?: {
    readonly total: number;
    readonly iterations: readonly { readonly id: string; readonly iteration: string; readonly goal: string; readonly base: string; readonly candidate: string; readonly status: string;
      readonly gate: string; readonly conclusion: string; readonly remaining: readonly string[]; readonly evidenceRefs: readonly string[] }[];
    readonly acceptedReviewRefs: readonly string[];
    readonly protection: string;
  };
  readonly iteration: string;
  readonly snapshot: CandidateSnapshot;
  readonly outcome: string;
  readonly requirements: readonly AssistedRequirement[];
  readonly principles: readonly { readonly path: string; readonly note: string }[];
  readonly protectionPaths?: readonly string[];
  readonly previousFindings?: readonly { readonly id: string; readonly title: string; readonly standing: string; readonly decision?: string; readonly rationale?: string }[];
}

/** The assisted caller supplies facts; preparation never fabricates a work item or passing gate. */
export function assistedReviewMessage(input: AssistedReviewBriefing, diffPayload: string): string {
  if (input.kind === 'final') return assistedFinalReviewMessage(input, diffPayload);
  const { snapshot } = input;
  const lines = [
    `Combined code and scope review ${input.id} for iteration ${input.iteration}.`, '',
    `Candidate commit: ${snapshot.commit}; tree: ${snapshot.tree}; base commit: ${snapshot.base}.`,
    sourceTestQualityGuidance, '',
    '## Intended outcome', '', input.outcome, '',
    '## Acceptance references', '',
    ...input.requirements.map(item => `- ${item.ref}: ${item.text}`), '',
    'Answer every acceptance reference, including requirements with no implementation. Mark missing behavior unmet and uncertain evidence uncertain. Support conclusions with relevant candidate evidence selected through ordinary inspection.', '',
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
export function validateAssistedReview(value: unknown, evidence: ReviewEvidence, requirements: readonly AssistedRequirement[], protectionPaths: readonly string[] = [], acceptedReviewRefs?: readonly string[]): SubmissionValidation<AssistedReviewSubmission> {
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
    if (answer.evidenceRefs !== undefined && acceptedReviewRefs === undefined)
      errors.push({ path: `${where}.evidenceRefs`, message: 'evidenceRefs applies only to a final assessment; omit it and cite candidate evidencePaths' });
    else for (const [at, ref] of (answer.evidenceRefs ?? []).entries()) {
      if (!acceptedReviewRefs?.includes(ref)) errors.push({ path: `${where}.evidenceRefs.${at}`, message: 'Reference must identify an available, completed, accepted iteration review supplied for this final assessment' });
    }
    if ((answer.outcome === 'met' || answer.pendingProtection) && answer.evidencePaths.length === 0
      && !(answer.evidenceRefs?.length && answer.evidenceRefs.every(ref => acceptedReviewRefs?.includes(ref))))
      errors.push({ path: `${where}.evidencePaths`, message: `Met acceptance reference ${answer.ref} needs candidate source evidence or applicable accepted iteration evidence` });
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
    maxConcerns: input.maxConcerns, signal: input.signal, includeDiff: input.briefing.kind !== 'final',
    message: diff => assistedReviewMessage(input.briefing, diff),
    validate: (value, evidence) => validateAssistedReview(value, evidence, input.briefing.requirements, input.briefing.protectionPaths, input.briefing.kind === 'final' ? input.briefing.finalContext?.acceptedReviewRefs : undefined),
  });
}


/** Plan-level review consumes earlier conclusions without repeating the iteration code/scope pass. */
function assistedFinalReviewMessage(input: AssistedReviewBriefing, diffPayload: string): string {
  const { snapshot, finalContext } = input;
  const declarations = [...snapshot.entries.keys()].filter(path => path === 'module.ramify' || path.endsWith('/module.ramify'))
    .map(path => path.slice(0, -'module.ramify'.length)).sort((a, b) => b.length - a.length);
  const owners = [...new Set(snapshot.changes.flatMap(change => {
    const directory = declarations.find(path => change.path.startsWith(path));
    return directory === undefined ? [] : [directory || '.'];
  }))].sort();
  return [
    `Final plan review ${input.id}.`, '',
    `Candidate commit: ${snapshot.commit}; tree: ${snapshot.tree}; base commit: ${snapshot.base}.`,
    sourceTestQualityGuidance, '',
    `Final protection: ${finalContext?.protection ?? 'See retained protection evidence.'}`, '',
    'Assess whole-plan completeness, cross-iteration integration, remaining fixed and nonfunctional obligations, unresolved findings and meaningful limitations. Assess architectural quality: avoid unnecessary complexity and preserve clean modularity. This is a final plan assessment, not another broad iteration code/scope pass.',
    'Reuse accepted iteration assessments as evidence. Revisit previously reviewed behavior when later changes, conflicting evidence, unresolved limitations or a concrete integration concern warrant it. Explain why earlier evidence applies to this candidate. An accepted report is evidence, not proof that all requirements were met; preserve unmet and uncertain answers unless you explain their resolution.',
    'Use codeAssessment for cross-iteration integration, scopeAssessment for whole-plan completeness, and design.assessment for architectural quality. Architectural concerns need a concrete practical consequence and the smallest useful correction. Avoid speculative redesign, style preferences and reopening settled decisions without new evidence.', '',
    '## Final goal', '', input.outcome, '',
    '## Complete plan and acceptance', '', ...input.requirements.map(item => `- ${item.ref}: ${item.text}`), '',
    'Answer every acceptance reference. Missing behavior is unmet; unresolved uncertainty remains uncertain. For met answers, cite relevant candidate evidencePaths or supplied accepted iteration evidenceRefs, and explain applicability in explanation. Do not invent references to missing, unavailable, interrupted or unsubmitted reviews. No fresh source inspection is required merely to repeat an accepted earlier conclusion. Inspect source and relevant surrounding behavior when the final integration judgment needs it.',
    `Unauthorized protected differences: ${JSON.stringify(input.protectionPaths ?? [])}. pendingProtection may name only these exact paths when their authorization is the sole remaining condition and all other obligations are met. Keep uncertainty visible.`, '',
    '## Iteration evidence and boundaries', '',
    `Showing ${finalContext?.iterations.length ?? 0} compact outcomes of ${finalContext?.total ?? 0} prior iteration assessments. Full records and older outcomes are available through assessment_evidence.`,
    ...(finalContext?.iterations.map(item => JSON.stringify(item)) ?? []),
    `Accepted iteration review references usable in requirement evidenceRefs: ${JSON.stringify(finalContext?.acceptedReviewRefs ?? [])}. Other record/diff references are for inspection.`, '',
    '## Known findings and dispositions', '',
    ...(input.previousFindings?.map(item => `- ${item.id} (${item.standing}): ${item.title}; ${item.decision ?? 'undecided'}; rationale: ${item.rationale ?? 'none'}`) ?? []),
    'Avoid repeating unchanged issues; explain meaningful changed circumstances before reopening an earlier judgment.', '',
    '## Selected guidance', '', ...input.principles.map(item => `- ${item.path}: ${item.note}`), '',
    `Changed module directories from candidate declarations: ${owners.length ? JSON.stringify(owners) : 'not identified; inspect declarations when relevant'}.`,
    `Changed files: ${snapshot.changes.length}; first ${Math.min(snapshot.changes.length, 100)} listed below. Full paths and patches remain available on demand.`,
    ...snapshot.changes.slice(0, 100).map(change => `- ${change.status} ${change.path}`), '', diffPayload, '',
    'Use assessment_evidence for full earlier reports, individual iteration diffs and the cumulative diff; use snapshot tools or shell to inspect the pinned candidate. No exhaustive inventory is required. Do not edit source. Report meaningful limitations and keep final follow-ups focused on the selected repair and relevant surrounding behavior.',
  ].join('\n');
}
