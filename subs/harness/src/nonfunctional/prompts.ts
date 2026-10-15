import type { Assessment, Candidate } from '../../subs/nonfunctional/src/interfaces/contracts.js';

/** The assessment package: every non-functional and fixed element, whole, rendered by the package creator. */
export function coordinatorAssessmentPrompt(assessmentPackage: string, candidate: Candidate, round: number, phase: 'initial' | 'after-repair'): string {
  return [
    `Assess the prepared source tree ${candidate.tree} in round ${round} (${phase}).`,
    'The package below holds every non-functional requirement of the plan and every fixed requirement, with the plan deviations recorded in this run. Judge each as worded, under its stated or inferred conditions.',
    'Submit exactly one result for every element ID of the package.',
    'For each result, name inspected scope, evidence, and uncertainty. Source analysis can establish implementation properties; inspect Git history, run records and command or audit evidence for historical and execution claims. Follow available evidence before choosing undetermined.',
    'Start from supplied implementation and evidence locations. Use ordinary read/search tools and shell to follow relevant references, including Git history, generated views and run records. The snapshot_list/read/search/diff tools are optional conveniences for the pinned candidate. Use a relevant named comparison when needed; no pathless diff is required before inspection. Explore beyond stale or unhelpful hints.',
    'Prepared candidate source is authoritative. Pointer notes, earlier completion claims and green audits do not establish fixed/NFR satisfaction. Make your own semantic judgment for every element, including unchanged callers. Bind evidence to the candidate or historical revision it describes; live files and generated views may describe another revision.',
    'Do not use capability progress or scenario coverage as a substitute for this assessment. Do not edit source or harness records.',
    'Submit your assessment using `submit_nonfunctional_assessment`.',
    '',
    assessmentPackage.trimEnd(),
  ].join('\n');
}

export function coordinatorActionPrompt(candidate: Candidate, unresolved: readonly string[], investigated: readonly string[],
  context?: { assessment: Assessment; allowedAction: 'investigate' | 'repair-or-close' | 'close'; investigationPaths: readonly string[] }): string {
  return [
    `Choose the next action for prepared source tree ${candidate.tree}.`,
    `Unresolved NFR IDs: ${JSON.stringify(unresolved)}`,
    `NFR IDs with committed investigation evidence this round: ${JSON.stringify(investigated)}`,
    ...(context === undefined ? [] : [
      `The current harness decision is ${context.allowedAction}. Choose only an action permitted by that step.`,
      `Current assessment results and evidence: ${JSON.stringify(context.assessment, null, 2)}`,
      `Accepted investigation submissions for this exact assessment: ${JSON.stringify(context.investigationPaths)}`,
      'Read those investigation submissions before deciding when their evidence matters; do not infer an investigation result from its event alone.',
    ]),
    context === undefined
      ? 'You may request another sequential read-only investigation, propose one repair batch with a starting module, or close this round.'
      : context.allowedAction === 'close'
      ? 'The only permitted action at this step is to close the round.'
      : context.allowedAction === 'repair-or-close'
        ? 'At this step, propose one repair batch with a starting module or close this round.'
        : 'At this step, request a sequential read-only investigation.',
    'An investigation reports evidence only for the NFR IDs you name, and receives those elements whole. The harness assigns every identity.',
    'A repair of an undetermined NFR requires investigation evidence for that same NFR. One repair batch is allowed per round.',
    'Earlier rounds are evidence for reconsideration, not a limit. If a requirement remains unmet, assess whether another correction is likely to help, change an ineffective approach or identify a missing prerequisite. Continue useful work. When requirements are satisfied, end refinements whose added benefit no longer justifies their cost.',
    'If closing with unresolved NFRs, state an alternative or explicit uncertainty for each one. Describe recorded gate results for their named candidates and distinguish pending checks.',
    'Submit the permitted action using `submit_nonfunctional_action`.',
  ].join('\n');
}

/** A repair engineer's task with the package of the requirements the coordinator cites. */
export function repairPrompt(task: string, candidate: Candidate, repairPackage: string, startingModule: string,
  context?: { evidence: readonly string[]; uncertainty: string }): string {
  return [
    `Start in module ${startingModule} and carry out this authorized repair task against tree ${candidate.tree}:`,
    task,
    'The requirements this repair concerns are below, whole. Carry their wording and stated/inferred distinction forward unchanged.',
    repairPackage.trimEnd(),
    ...(context === undefined ? [] : [
      ...(context.evidence.length ? [`Coordinator evidence for this repair: ${JSON.stringify(context.evidence)}`] : []),
      ...(context.uncertainty.trim() ? [`Coordinator uncertainty: ${context.uncertainty}`] : []),
    ]),
    'Report completed or partial work with evidence and any remaining work. This submission does not decide NFR satisfaction.',
    'Submit the repair result using `submit_nonfunctional_repair`.',
  ].join('\n');
}
