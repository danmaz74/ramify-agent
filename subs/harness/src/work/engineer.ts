import { z } from 'zod';
import type { JsonSchema } from '../../subs/agent/src/interfaces/port.js';
import type { ArchitectIndex } from '../../subs/evidence/src/views.js';
import { modulePathSchema } from '../interfaces/protocol/evidence.js';
import { validateAgainst, type SubmissionError, type SubmissionValidation } from '../run/submissions.js';
import { openFindingsMessage, type HookFinding, type HookSubmissionPolicy } from '../hooks/post-write.js';
import { needAsBehaviorSchema } from '../contracts/submission.js';
import { capabilityNeedInputSchema } from '../capability/records.js';
import { bindingErrors, obligationBindingSchema } from './obligations.js';
import type { IterationAssignment } from './iterations.js';
import { injectionSiteRule, moduleOwning } from './scope.js';
import { engineerScenarioSection, type EngineerScenarios } from './scenario-briefing.js';
import { scopePaths } from './scope.js';
import type { TestArea } from '../run/project-config.js';
import { startingPointsSchema } from './starting-points.js';
import { apiCoverageStatement } from './session.js';
import type { RegistryEntry } from '../analysis/records.js';
import type { OwnershipAnswer } from '../../subs/evidence/src/ownership-evidence.js';

/*
 * The module engineer: what it submits, the one harness tool it is given, and the
 * briefing it starts from.
 *
 * Its submission is provisional. A proposal of completion is a request for
 * the gate, never a verdict: the harness runs the checks and owns the
 * outcome. A recommendation is read by the module architect and never widens
 * a scope or discharges an obligation.
 *
 * `edit` and `write` are the implementation's own built-ins, behind the
 * write guard. The `shell` tool arrives in iteration 7.
 *
 * `contract-needed` is how a module engineer reports that the behavior it needs is
 * outside its scope. Its turn ends there: no nested live session is started,
 * and the harness answers with a contract iteration of its own. The need is
 * written as behavior, never as an interface, because naming the design
 * would decide for the other side.
 */

const text = z.string().min(1);

/**
 * Why a module engineer reports its assignment unsuitable. `obligation-change` and
 * `unplaced-need` arrive with the iterations that act on them: a reason no
 * iteration can act on is not offered.
 *
 * `break-discovered` is how a module engineer reports that the work it was given
 * cannot be done without breaking a guarantee somebody else relies on. Its
 * turn ends there: it does not switch approach, widen its writes or adapt
 * the consumers itself, and the work item's module architect revises the
 * remaining iterations. A module engineer already working a `breaking` iteration
 * has nothing to discover, so the reason is refused for one.
 *
 * `provider-cannot-conform` is offered only to a module engineer whose assignment
 * owes a real-provider obligation. It is the provider's report that the
 * agreement cannot be met as it stands, and it reaches the consumer's module
 * architect as `revision-needed`. Any other engineer using it is refused.
 */
export const unsuitableReasonSchema = z.enum(['scope', 'break-discovered', 'provider-cannot-conform']);

export const engineerSubmissionSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('completion-proposed'),
    /** The module engineer's own words. They enter the accepted commit's message and nothing else does. */
    summary: text,
    findings: z.array(text),
    startingPoints: startingPointsSchema,
    recommendation: text.optional(),
    /**
     * One binding for every obligation the assignment names, each once, with
     * the fake class or export names the binding relies on (none by
     * default). A binding is the module engineer's declaration that its step
     * definitions or test exist; whether they are right is the gate's audit
     * and the architect's to find. It is never the architect's report.
     */
    bindings: z.array(obligationBindingSchema).default([]),
  }).strict(),
  z.object({
    kind: z.literal('partial'),
    done: z.array(text),
    unfinished: z.array(text),
    findings: z.array(text),
    startingPoints: startingPointsSchema,
  }).strict(),
  z.object({
    kind: z.literal('unsuitable'),
    reason: unsuitableReasonSchema,
    detail: text,
  }).strict(),
  z.object({
    kind: z.literal('contract-needed'),
    /** The need, stated as behavior. The contract iteration designs the interface. */
    need: needAsBehaviorSchema,
    /** Where the module engineer believes the behavior belongs; the harness resolves the owner itself. */
    suggestedProvider: modulePathSchema.optional(),
    /**
     * The files where the fake must be injected, when they are known: in this
     * module, or on the provider side where the real behavior will act and
     * reach this module as data through a path that already exists. Each
     * lies in the consumer's or the provider's own contents, and the
     * contract iteration may write exactly those files beyond its scope.
     */
    injectionSites: z.array(text).optional(),
    /** What this iteration did before it stopped, in the module engineer's own words. */
    summary: text,
  }).strict(),
  z.object({
    kind: z.literal('capability-needed'),
    summary: text,
    request: capabilityNeedInputSchema,
  }).strict(),
]);
export type EngineerSubmission = z.infer<typeof engineerSubmissionSchema>;

/** The members this iteration's package offers the role. */
export const engineerSubmissionKinds = ['completion-proposed', 'partial', 'unsuitable', 'contract-needed'] as const;
export const capabilityEngineerSubmissionKinds = ['completion-proposed', 'partial', 'unsuitable', 'capability-needed'] as const;

/** The schema the agent's tool is given, taken from the same definition that validates. */
export const engineerJsonSchema = z.toJSONSchema(engineerSubmissionSchema) as JsonSchema;
/** New-run tool surface excludes the historical contract request. */
export const capabilityEngineerSubmissionSchema = z.discriminatedUnion('kind', [
  engineerSubmissionSchema.options[0]!, engineerSubmissionSchema.options[1]!,
  engineerSubmissionSchema.options[2]!, engineerSubmissionSchema.options[4]!,
]);
export const capabilityEngineerJsonSchema = z.toJSONSchema(capabilityEngineerSubmissionSchema) as JsonSchema;

export const engineerToolName = 'submit_iteration_result';

/**
 * What one accepted submission is answered with, by kind. Only a proposal of
 * completion asks for the gate; an accepted `partial`, `unsuitable` or
 * `contract-needed` report is a report, and answering it with completed work
 * tells the module engineer something that is not so.
 *
 * `checkNotRun` is the reason the fresh Ramify check over the write scope
 * could not run, where it could not. It is stated rather than passed over: a
 * check that did not run is never a pass, and the gate's complete check is
 * what answers instead.
 */
export function iterationAcceptance(kind: EngineerSubmission['kind'], checkNotRun: string | null = null): string {
  const note = checkNotRun === null
    ? ''
    : ` The Ramify check over your write scope could not be run (${checkNotRun}), so nothing here verified it.`;
  switch (kind) {
    case 'completion-proposed':
      return `The submission was accepted and recorded. The iteration gate commits the candidate and evaluates the configured checks through the audit provider, which selects execution and may reuse applicable evidence. Acceptance requires a qualifying verdict; a commit alone is not acceptance.${note} Nothing more is asked of you in this session.`;
    case 'partial':
      return 'The report was accepted and recorded. The work is not complete: the module architect reads what is unfinished and decides what follows. Nothing more is asked of you in this session.';
    case 'unsuitable':
      return 'The report was accepted and recorded. This iteration closes on it, unverified and uncommitted, and the module architect decides what follows. Nothing more is asked of you in this session.';
    case 'contract-needed':
      return 'The report was accepted and recorded. This iteration closes with what it did, and the harness answers the need you named with a contract iteration of its own. Nothing more is asked of you in this session.';
    case 'capability-needed':
      return 'The need was recorded with your provisional source. Your assignment and session remain suspended while its architect qualifies it.';
  }
}

/** What the submission tool tells the module engineer about itself. */
export const engineerSubmissionDescription = 'End your turn with the result of this iteration. The harness validates it; an invalid submission is returned with every error and its path, and a valid one ends this invocation.';

/**
 * Told beside the prepared Cucumber feature check: its file-level selection
 * includes pending scenarios and may include unassigned cases.
 */
export const focusedCommandPendingNote = 'The prepared profile enables pending scenarios in the selected feature files. It selects whole files, so it can also run cases outside your assignment.';

/** A line that would be read as one of the trailers the harness writes itself. */
const trailerLine = /^\s*Ramify-[A-Za-z-]*\s*:/m;

/** What the rules beyond the schema are checked against. */
export interface EngineerEvidence {
  /** Only the internal test workflow may offer the new submission before rollout. */
  readonly capabilityWorkflow?: boolean;
  /** Refreshed ownership and accepted creation authority for new usage declarations. Historical requests are never revalidated. */
  readonly capabilityUsage?: {
    readonly ownership: OwnershipAnswer | null;
    readonly registry: ReadonlyMap<string, RegistryEntry>;
    readonly unavailable?: string | undefined;
  } | undefined;
  /**
   * The real-provider obligation this assignment owes, where it owes one.
   * The harness derives it from the assignment; no submission carries it.
   */
  readonly obligation?: { readonly id: string; readonly revision: number } | null | undefined;
  /** The kind of iteration this engineer is working, as the assignment fixed it. */
  readonly kind?: string | undefined;
  /**
   * Ramify findings this session's own edits introduced that no later hook
   * check has cleared. The gate runs the same check, so a completion
   * proposed while one stands would fail there; it is refused here instead,
   * where the session can still act on it.
   */
  readonly openFindings?: readonly HookFinding[] | undefined;
  /**
   * The submissions legal for this engineer, which a refusal over open
   * findings names as its remedies; the hook checks name the same ones.
   */
  readonly submissions?: HookSubmissionPolicy | undefined;
  /** The obligations the captured assignment names, which `bindings` must bind exactly once each. */
  readonly assigned?: readonly string[] | undefined;
  /** What a `contract-needed` injection site is judged against: the view, this module, and the registry's owner of a capability. */
  readonly seams?: {
    readonly index: ArchitectIndex | null;
    readonly consumer: string;
    readonly providerOf: (capability: string) => string | undefined;
  } | undefined;
}

/**
 * Validates one engineer submission: the strict schema, then the rules the
 * schema cannot hold. Nothing changes on a failure and every error names its
 * path.
 */
export function validateEngineer(input: unknown, evidence: EngineerEvidence = {}): SubmissionValidation<EngineerSubmission> {
  const shape = validateAgainst(engineerSubmissionSchema, input);
  if (!shape.ok) return shape;
  const errors: SubmissionError[] = [];
  const value = shape.value;
  if (value.kind === 'capability-needed' && evidence.capabilityWorkflow !== true) {
    errors.push({ path: 'kind', message: 'Capability coordination is not enabled for this run', expected: 'an enabled capability workflow' });
  }
  if (value.kind === 'contract-needed' && evidence.capabilityWorkflow === true) {
    errors.push({ path: 'kind', message: 'The contract workflow is unavailable in capability coordination', expected: 'capability-needed' });
  }
  if (value.kind === 'capability-needed' && evidence.capabilityUsage !== undefined) {
    const { ownership, registry, unavailable } = evidence.capabilityUsage;
    value.request.usage.forEach((usage, position) => {
      if (usage.module === undefined) return; // Actual usage may omit its caller module.
      const at = `request.usage.${position}.module`;
      // Missing prospective files belong to their intended location. An
      // accepted module proposal can supersede its existing parent's owner.
      const proposal = [...registry.values()].filter(entry => entry.proposed !== undefined
        && (usage.path === entry.proposed.directory || usage.path.startsWith(`${entry.proposed.directory}/`)))
        .sort((left, right) => right.proposed!.directory.length - left.proposed!.directory.length)[0];
      const observed = ownership?.paths.find(path => path.path === usage.path);
      // Owned-unwired and scratch regions still have a known module. A
      // parent's ownership of an independent nested project does not name
      // that project's caller module. None of these facts authorizes writes.
      const observedOwner = observed?.status === 'owned' && observed.exclusion?.kind !== 'owned-nested-project' ? observed.module : undefined;
      const createdOwner = proposal !== undefined && (observed === undefined || observed.status === 'owned'
        && (observed.module === proposal.proposed!.parent || observed.module === proposal.owner)) ? proposal.owner : undefined;
      const owner = createdOwner ?? observedOwner;
      if (owner === usage.module) return;
      errors.push({ path: at, message: owner === undefined
        ? `Ownership evidence is unavailable for "${usage.path}"; its declared caller cannot be reconciled${unavailable === undefined ? '' : `: ${unavailable}`}${observed === undefined ? '' : ` (status ${observed.status}, exclusion ${observed.exclusion?.kind ?? 'none'})`}`
        : `"${usage.path}" belongs to caller module "${owner}", not "${usage.module}"; suggestedProvider identifies a separate provider`,
      expected: owner ?? 'a location with ownership evidence or accepted module-creation authority' });
    });
  }

  // The harness writes the accepted commit's trailers, and one of them is the
  // key a repeat after a crash finds the commit by. Text that would be read
  // as a trailer is refused rather than escaped.
  const prose: Array<{ path: string; value: string }> = value.kind === 'completion-proposed'
    ? [{ path: 'summary', value: value.summary }, ...(value.recommendation === undefined ? [] : [{ path: 'recommendation', value: value.recommendation }])]
    : value.kind === 'unsuitable'
      ? [{ path: 'detail', value: value.detail }]
      : value.kind === 'contract-needed'
        ? [{ path: 'summary', value: value.summary }]
        : value.kind === 'capability-needed'
          ? [{ path: 'summary', value: value.summary }]
        : [];
  for (const entry of prose) {
    if (trailerLine.test(entry.value)) {
      errors.push({
        path: entry.path,
        message: 'The harness writes the commit\'s trailers; a submission may not contain a line that reads as one',
        expected: 'prose with no "Ramify-…:" line',
      });
    }
  }

  // A need stated as an interface decides for the other side, which is what
  // a contract iteration exists to prevent. The rule the schema cannot hold
  // is that the need names behavior the consumer can observe, not a design.
  if (value.kind === 'contract-needed' && value.need.outputs.length === 0 && value.need.sideEffects.length === 0) {
    errors.push({
      path: 'need.outputs',
      message: 'A need names what the behavior answers or what it changes; with neither there is nothing to agree on',
      expected: 'at least one entry in "outputs" or in "sideEffects"',
    });
  }

  // An injection site opens one file of the provider to the contract
  // iteration, so it is judged here, where the module engineer can still correct it.
  if (value.kind === 'contract-needed') {
    const seams = evidence.seams;
    const provider = seams?.providerOf(value.need.capability);
    (value.injectionSites ?? []).forEach((site, position) => {
      const path = `injectionSites.${position}`;
      if (site.startsWith('/') || site.split('/').includes('..')) {
        errors.push({ path, message: `"${site}" is not a project-relative path; ${injectionSiteRule}`, expected: 'a path relative to the project root' });
        return;
      }
      if (seams === undefined || seams.index === null) return;
      const owner = moduleOwning(seams.index, site);
      if (owner !== undefined && (owner.module === seams.consumer || owner.module === provider)) return;
      errors.push({
        path,
        message: `"${site}" lies in ${owner === undefined ? 'no module\'s own contents' : `the own contents of "${owner.module}"`}, and ${injectionSiteRule}`,
        expected: `a file of ${seams.consumer}${provider === undefined ? '' : ` or of ${provider}`}`,
      });
    });
  }

  // The provider's report is offered only where there is an agreement to
  // report against. A module engineer that owes no real-provider obligation has
  // nothing it could fail to conform to, and the reason is not parsed from
  // free text: it is refused here.
  if (value.kind === 'unsuitable' && value.reason === 'provider-cannot-conform'
    && (evidence.obligation === undefined || evidence.obligation === null)) {
    errors.push({
      path: 'reason',
      message: 'This assignment owes no obligation to a real provider, so there is no agreement it could report itself unable to conform to',
      expected: '"scope", or an assignment that owes a real-provider obligation',
    });
  }

  // A break this iteration was assigned to make is not a discovery. The
  // architect already planned it, the scope already spans the consumers, and
  // reporting it again would ask for a plan that exists.
  if (value.kind === 'unsuitable' && value.reason === 'break-discovered' && evidence.kind === 'breaking') {
    errors.push({
      path: 'reason',
      message: 'This iteration is already the breaking one its outline planned, so there is no break to discover; report what is unfinished instead',
      expected: '"scope", or a "partial" report',
    });
  }

  if (value.kind === 'completion-proposed' && evidence.openFindings !== undefined && evidence.openFindings.length > 0) {
    errors.push({
      path: 'kind',
      message: openFindingsMessage(evidence.openFindings, evidence.submissions),
      expected: '"completion-proposed" only once no Ramify module violation stands',
    });
  }

  // A completion proposal is structurally complete only when it binds every
  // assigned obligation; a partial report is the honest exit otherwise.
  if (value.kind === 'completion-proposed') errors.push(...bindingErrors(value.bindings, evidence.assigned ?? []));

  if (value.kind === 'partial' && value.done.length === 0 && value.unfinished.length === 0) {
    errors.push({
      path: 'unfinished',
      message: 'A partial report names what was done or what is unfinished; naming neither reports nothing',
      expected: 'at least one entry in "done" or in "unfinished"',
    });
  }

  return errors.length === 0 ? shape : { ok: false, errors };
}

/** Reconcile only new submissions with current ownership before a runner admits them. */
export async function validateEngineerWithOwnership(input: unknown, evidence: EngineerEvidence,
  query: (paths: readonly string[]) => Promise<OwnershipAnswer>,
  registry: () => ReadonlyMap<string, RegistryEntry>,
): Promise<SubmissionValidation<EngineerSubmission>> {
  const validated = validateEngineer(input, evidence);
  if (!validated.ok || validated.value.kind !== 'capability-needed'
    || !validated.value.request.usage.some(usage => usage.module !== undefined)) return validated;
  let ownership: OwnershipAnswer | null = null;
  let unavailable: string | undefined;
  try { ownership = await query(validated.value.request.usage.map(usage => usage.path)); }
  catch (error) { unavailable = error instanceof Error ? error.message : String(error); }
  return validateEngineer(input, { ...evidence, capabilityUsage: { ownership, unavailable, registry: registry() } });
}

// The briefing.

/** What one written module may import: its API views, or why none was materialized. */
export interface IterationApiViews {
  readonly module: string;
  readonly views: readonly { readonly area: string; readonly path: string; readonly revision: string; readonly coverage: number | null }[];
  readonly unavailable: string | null;
}

export interface IterationBriefing {
  readonly assignment: IterationAssignment;
  readonly projectRoot: string;
  /** The executable cwd of this invocation, usually the first base module's src. */
  readonly workingDirectory?: string | undefined;
  /** The last accepted boundary, tracked by the harness. */
  readonly base: string;
  /** Selects the handback supported by this invocation's submission schema. */
  readonly capabilityWorkflow?: boolean | undefined;
  /** The API views of the modules this iteration writes, or why one has none. */
  readonly views?: readonly IterationApiViews[] | undefined;
  /**
   * Diagnostics of the attempt that did not pass, where this invocation is a
   * repair: its cause and the lines the harness prepared, one per failing
   * command with the findings or the output end of that command.
   */
  readonly failedGate?: { readonly id: string; readonly cause: string | null; readonly summary: readonly string[] } | undefined;
  /** What an earlier invocation of this iteration reported before it ran out of context. */
  readonly handoff?: { readonly done: readonly string[]; readonly unfinished: readonly string[]; readonly returns: number } | undefined;
  /** The work item's scenarios; absent for a provider or follow-up work item, whose briefing says nothing of them. */
  readonly scenarios?: EngineerScenarios | undefined;
  /** Every obligation the assignment names, with what the briefing says of it. */
  readonly obligations?: readonly AssignedObligation[] | undefined;
  /** The assignment package, rendered by the package creator; given to a session once. */
  readonly package?: string | undefined;
  /** The test areas of the modules whose tests the assignment owns; absent where the run could not read them. */
  readonly testAreas?: readonly TestArea[] | undefined;
  /** Authored check facts already known to this caller. */
  readonly setup?: string | undefined;
}

/** The first user message of one engineer invocation. */
export function iterationMessage(briefing: IterationBriefing): string {
  const { assignment } = briefing;
  const startingModule = 'module' in assignment.scope.base ? assignment.scope.base.module : assignment.scope.base.modules[0]!;
  const paths = scopePaths(briefing.projectRoot, assignment.scope);
  const includedInstructions = assignment.scope.resolved.included.flatMap(entry => [
    `Included whole tree ${entry.directory} (${entry.kind}, owner ${entry.owner}): ${entry.reason}`,
    entry.instructions,
    ...(entry.kind === 'owned-nested-project' ? ['Ramify does not analyze this tree through the enclosing project. Use its own root for verification commands; substantial independent work is a separate run.'] : []),
    ...entry.projectInstructions.map(document => `${document.path}:\n${document.text}`),
  ]);
  const lines: string[] = [
    `# Iteration ${assignment.id} — ${describeBase(assignment)}`,
    '',
    '## Goal',
    '',
    assignment.goal,
    '',
    '## Approach the architect asked for',
    '',
    assignment.approach,
    '',
    ...(briefing.package === undefined ? [] : ['## What the plan asks of this iteration', '',
      'The elements your assignment cites, whole, with the plan deviations in force when it was assigned. The captured documents are not yours to read: what these elements do not settle is a finding.', '',
      briefing.package.trimEnd(), '']),
    `Your starting module is \`${startingModule}\`. Your working directory is \`${briefing.workingDirectory ?? briefing.projectRoot}\`. Relative tool paths and shell commands start there.`,
    '',
    '## What you may write (project-relative paths)',
    '',
    ...paths.roots.map(root => `- \`${root}/\` and everything beneath it`),
    ...paths.files.map(file => `- \`${file}\``),
    '',
    'Nothing else. Beneath these roots, child modules, nested projects and guarded files stay excluded unless this list names them. A write outside this scope is refused before it happens; report the need instead of working around it.',
    '',
  ];

  if (briefing.views !== undefined && briefing.views.length > 0) {
    lines.push('## What you may import', '');
    lines.push('Imports from other modules are answered by the API view of the module that imports, not by other modules\' source:', '');
    for (const entry of briefing.views) {
      if (entry.views.length === 0) {
        lines.push(`- \`${entry.module}\`: no API view, because ${entry.unavailable ?? 'none was materialized'}. Absence of a view is not permission; the Ramify check after each change still answers.`);
        continue;
      }
      if (entry.unavailable !== null) lines.push(`- \`${entry.module}\` API view limitations: ${entry.unavailable}. Missing evidence is not proof of API absence.`);
      for (const view of entry.views) {
        lines.push(`- \`${entry.module}\` (${view.area}): \`${view.path}/\` (project-relative; open \`${briefing.projectRoot}/${view.path}/\` from this cwd); revision \`${view.revision}\`; ${view.coverage === null
          ? 'coverage complete, so a symbol it does not list is not importable'
          : `coverage limits: ${apiCoverageStatement(view.coverage)}`}.`);
      }
    }
    lines.push('', briefing.capabilityWorkflow === true
      ? 'A symbol you need that is not there is reported with `capability-needed`, with the actual calling code and missing behavior; it is never imported anyway.'
      : 'A symbol you need that is not there is reported with `unsuitable`, reason `scope`; it is never imported anyway.', '');
  }

  if (assignment.scope.bootstrap.length > 0) {
    lines.push('This iteration creates a module. The harness prepared its source directory for your session; write its');
    lines.push('declaration, its README and its own source. Creating any other module is not authorized.', '');
  }

  lines.push('## Completion evidence', '', assignment.completionEvidence, '');
  if (assignment.featureSelection !== undefined) lines.push(
    '## Explicit feature evidence', '',
    `Selected generated files: ${assignment.featureSelection.files.map(file => `\`${file}\``).join(', ')}.`,
    `Reason: ${assignment.featureSelection.reason}`,
    `Assignment authority: ${JSON.stringify(assignment.coordination ?? { kind: 'work-item', id: assignment.workItem })}; design record ${assignment.outline.id} revision ${assignment.outline.revision}.`,
    'This selection supplies evidence independently of completion obligations. It changes no write scope or acceptance authority; generated feature files remain protected.',
    'A successful exit with zero executed cases establishes no scenario acceptance. Preserve ambiguous, undefined, failed and unrun results and their limitations for the assigning architect.', '',
  );
  const owners = [...assignment.gate.tests.exactOwners, ...assignment.gate.tests.subtrees.map(subtree => `${subtree} (subtree)`)];
  lines.push(
    `The gate commits a candidate and asks for the project's committed audit of it at the \`${assignment.gate.checkpoint}\` checkpoint:`,
    `the project's own configured checks, its tests${engineerScenarioSection(briefing.scenarios, assignment.obligations ?? []).length > 0 ? ' and scenarios' : ''} among them, selected by the audit provider.`,
    'The harness runs no test selection of its own and names no test to run.',
    '',
    owners.length === 0
      ? 'This assignment owns no module\'s tests yet.'
      : `The tests this assignment owns are those of ${owners.join(', ')}${briefing.testAreas === undefined || briefing.testAreas.length === 0 ? '.' : ', in:'}`,
    ...(briefing.testAreas ?? []).map(area => `- \`${area.area}/\` (\`${area.module}\`)`),
    '',
    'To see how particular tests run before you propose completion, name their files to the project\'s runner from `shell`,',
    ...(briefing.setup ? [briefing.setup] : ['Inspect the project\'s declared audit and package scripts for its focused test command.']),
    'A whole-suite run is refused there: the gate\'s audit runs it.',
    '',
  );
  lines.push(...obligationsToBindSection(briefing.obligations ?? (assignment.obligations ?? []).map(id => ({ id, text: null }))));
  lines.push(...engineerScenarioSection(briefing.scenarios, assignment.obligations ?? [], briefing.package === undefined ? [] : [briefing.package]));

  if (assignment.externalCapabilities.length > 0) {
    lines.push('## Capabilities other modules own', '');
    for (const capability of assignment.externalCapabilities) {
      lines.push(`- \`${capability.capability}\` is owned by \`${capability.owner}\`; you may ${capability.role} it.`);
    }
    lines.push('');
  }

  lines.push(
    '## The tree you start from',
    '',
    `The last accepted boundary is commit \`${briefing.base}\`. The harness tracks work since that boundary, including this iteration. Inspect the current files; you never run Git.`,
    'Uncommitted changes are that work; the gate commits a candidate before checking it. A candidate commit is not acceptance.',
    '',
  );

  if (briefing.handoff !== undefined) {
    lines.push('## What the last session of this iteration reported', '');
    for (const done of briefing.handoff.done) lines.push(`- Done: ${done}`);
    for (const unfinished of briefing.handoff.unfinished) lines.push(`- Unfinished: ${unfinished}`);
    lines.push('', `This is return ${briefing.handoff.returns} of this iteration's context budget. Continue from the files, not from memory.`, '');
  }

  if (briefing.failedGate !== undefined) {
    lines.push('## The gate did not pass', '');
    lines.push(`Attempt \`${briefing.failedGate.id}\`${briefing.failedGate.cause === null ? '' : ` (${briefing.failedGate.cause})`}. What ran, and what it reported:`, '');
    lines.push(...briefing.failedGate.summary);
    lines.push('', 'These current repair instructions supersede any inherited promise of fresh execution. Inspect the failure against your assignment. Repair within your authorized scope and propose completion when supported. If correction requires another owner\'s work or a revised decision, preserve the candidate and return `partial` with the conflict and evidence. The next gate evaluates the configured checks through the audit provider, which selects execution and may reuse applicable evidence; unchanged source does not guarantee fresh execution. Acceptance requires a qualifying verdict. Preserve the failed candidate, original audit receipt, exact failed cases and evidence limitations. A focused passing run does not erase the failed audit result or prove a flake. Fresh verification belongs to the responsible workflow through its supported audit contract; do not run a complete audit yourself, bypass the gate, widen scope or make a cosmetic mutation to force execution.', '');
  }

  lines.push(`Work within the scope above and end your turn with \`${engineerToolName}\`.`);
  if (includedInstructions.length > 0) lines.push('', '## Included tree instructions', '', ...includedInstructions);
  return lines.join('\n');
}

/** One obligation an assignment names, as the module engineer is told of it. */
export interface AssignedObligation {
  readonly id: string;
  /** What it is: a scenario's name, a delegated outcome, a registered case or test; null where nothing more is known. */
  readonly text: string | null;
}

/**
 * The obligations to bind, and what a binding is. An assignment that names
 * none says so, since its completion proposal binds nothing and a binding of
 * anything else is refused.
 */
export function obligationsToBindSection(obligations: readonly AssignedObligation[]): string[] {
  if (obligations.length === 0) {
    return [
      '## Obligations to bind',
      '',
      'None: this assignment names no obligation, so your completion proposal\'s `bindings` is empty (`[]`). Anything',
      'else the text names, such as acceptance cases, is the architect\'s to report on, not yours to bind.',
      '',
    ];
  }
  return [
    '## Obligations to bind',
    '',
    'The architect assigned these to this iteration:',
    '',
    ...obligations.map(obligation => `- \`${obligation.id}\`${obligation.text === null ? '' : `: ${obligation.text}`}`),
    '',
    'Your completion proposal\'s `bindings` names each of them exactly once, as `{ id, fakes }`: a binding declares that',
    'the step definitions or test for it exist. `fakes` lists the fake class or export names the binding relies on,',
    'each carrying `Fake`; leave it empty where it runs against the real provider. A proposal that leaves one out is',
    'refused with the missing IDs; report `partial` with what is unfinished instead. A binding is your report of work,',
    'never the architect\'s judgment that the obligation is done.',
    '',
  ];
}

function describeBase(assignment: IterationAssignment): string {
  const base = assignment.scope.base;
  if ('module' in base) {
    return base.included.length === 0
      ? base.module
      : `${base.module}, with ${base.included.map(entry => `${entry.directory}: ${entry.reason}; ${entry.instructions}`).join(', ')}`;
  }
  return base.modules.join(', ');
}
