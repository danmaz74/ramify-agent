import { featureSelectionErrors } from '../../../autonomous/subs/work-coordination/src/work/feature-selection.js';
import { consultArchitectDeclaration } from '../../../autonomous/subs/work-coordination/src/consultations/submissions.js';
import { consultationAvailability, consultationContext, type ConsultationInputs } from '../../../autonomous/subs/work-coordination/src/consultations/targets.js';
import { join } from 'node:path';
import type { JsonSchema } from '../../../agent/src/interfaces/port.js';
import type { HookSubmissionPolicy } from '../../../../src/hooks/post-write.js';
import { deliveredSupportPaths } from '../prompts/tasks.js';
import { renderEngineerPrompt, type LoadedPackage } from '../../../../src/prompts/packages.js';
import type { RunPolicy } from '../../../autonomous/src/run/records.js';
import { invocationLimits } from '../../../../src/run/policy.js';
import type { HarnessTaskBrief } from '../../../task-execution/src/session-operations.js';
import { composeTaskBrief, type KnownProjectFacts } from '../task-brief.js';
import { shellToolDeclaration } from '../../../../src/tools/shell.js';
import {
  engineerJsonSchema, engineerSubmissionDescription, engineerToolName, focusedCommandPendingNote, iterationMessage,
  type EngineerEvidence, type IterationApiViews,
} from '../../../autonomous/subs/work-coordination/src/work/engineer.js';
import { engineerBuiltinTools } from '../../../autonomous/subs/work-coordination/src/work/engineer-equipment.js';
import { focusedScenarioFacts } from '../../../autonomous/subs/work-coordination/src/work/session.js';
import type { StartingPointGroup } from '../../../autonomous/subs/work-coordination/src/work/starting-inputs.js';
import { knownFacts, knownFactsInputs } from './constructed.js';
import { projectPath, validateEngineerInputs, validateStepInputs, type EngineerStepInputs, type ProjectPath } from './inputs.js';
import type { EngineerBounds } from '../../../../src/run/policy.js';
import type { TestArea } from '../../../../src/run/project-config.js';
import type { AssignedObligation } from '../../../autonomous/subs/work-coordination/src/work/engineer.js';
import type { IterationAssignment } from '../../../autonomous/subs/work-coordination/src/work/iterations.js';
import type { WorkItem } from '../../../autonomous/subs/work-coordination/src/work/records.js';
import type { EngineerScenarios } from '../../../autonomous/subs/work-coordination/src/work/scenario-briefing.js';
import type { prepareAssignedCucumber } from '../../../autonomous/subs/work-coordination/src/work/session.js';

/*
 * The module engineer step: one engineer invocation of an iteration, built from its
 * inputs. The run builds every module engineer invocation through this constructor,
 * and `step render` renders the same construction, so both deliver the same
 * packet, tools, validator and bounds.
 */

/** What a step is built in: the resolved runtime locations, never a replacement for a recorded input. */
export interface StepEnvironment {
  /** The project root the step's project-relative paths resolve from. */
  readonly projectRoot: string;
  /** The loaded prompt packages, by role. */
  readonly packages: ReadonlyMap<string, LoadedPackage>;
}

/** The session start of a constructed engineer step. */
export type EngineerStepStart =
  | { readonly mode: 'fresh'; readonly degraded?: { readonly requested: 'continued'; readonly reason: string } | undefined }
  | { readonly mode: 'continue'; readonly ref: string; readonly session: string; readonly continuing: 'repair' | 'capability-returned' };

/** One engineer invocation as the inputs determine it; the run adds only what exists while it runs. */
export interface ConstructedEngineerStep {
  readonly role: 'engineer';
  readonly consultation: ReturnType<typeof consultationAvailability>;
  readonly inputs: EngineerStepInputs;
  readonly work: { readonly workItem: string; readonly iteration: string };
  readonly attempt: number;
  readonly loaded: LoadedPackage;
  readonly systemPrompt: string;
  /** The iteration message, which the task packet's support sections are taken from. */
  readonly prompt: string;
  /** The owning task inputs, which the run's invocation record keeps. */
  readonly task: {
    readonly kind: 'engineering' | 'repair';
    readonly modules: readonly string[];
    readonly goal: string;
    readonly requirements: readonly string[];
    readonly cucumberConfiguration: string | null;
    readonly omit: readonly string[];
    readonly literalSections: HarnessTaskBrief['sections'];
    readonly views: HarnessTaskBrief['environment']['views'];
  };
  /** The task brief the packet is delivered as. */
  readonly brief: HarnessTaskBrief;
  readonly submission: {
    readonly toolName: string;
    readonly description: string;
    readonly inputSchema: JsonSchema;
    readonly submissionSchema: 'ramify-agent.engineer-submission/2';
  };
  /** The evidence the validator judges against that the inputs determine; the session's own findings are added while it runs. */
  readonly validator: Required<Pick<EngineerEvidence, 'capabilityWorkflow' | 'obligation' | 'kind' | 'assigned'>> & { readonly consumer: string };
  readonly bounds: { readonly idleMs: number; readonly absoluteMs: number; readonly commandTimeoutMs: number };
  /** The limits the invocation runs under: the policy's, with these bounds. */
  readonly limits: RunPolicy['limits'];
  readonly context: RunPolicy['context']['engineer'];
  readonly start: EngineerStepStart;
  /** What the module engineer's equipment is built from. */
  readonly equipment: {
    readonly workingDirectory: string;
    readonly scopeRevision: number;
    readonly commandTimeoutMs: number;
    readonly submissions: HookSubmissionPolicy;
    readonly focusedCommands: readonly { readonly shellCommand: string; readonly selection: Extract<EngineerStepInputs['focused']['command'], { kind: 'available' }>['selection'];
      readonly environment: Readonly<Record<string, string>>; readonly sourceFiles: Readonly<Record<string, string>> }[];
    readonly builtinTools: readonly (typeof engineerBuiltinTools)[number][];
    /** The harness's own tools, as declared to the session. */
    readonly tools: readonly (ReturnType<typeof shellToolDeclaration> | typeof consultArchitectDeclaration)[];
    /** Project-relative files refused outright: the run's own, and the guarded files no authorization opened. */
    readonly protectedFiles: { readonly harness: readonly string[]; readonly unauthorized: readonly string[] };
  };
  /** The records the invocation writes before it starts, under its own directory. */
  readonly before: { readonly inputs: EngineerStepInputs };
}

const path = (projectRoot: string, field: ProjectPath): string => join(projectRoot, field.project);
const relative = (field: ProjectPath): string => field.project;

/** The project facts the module engineer's brief carries, as the brief composes them. */
export function engineerKnownFacts(inputs: EngineerStepInputs): KnownProjectFacts {
  return knownFacts(inputs.known);
}

/**
 * Builds one engineer invocation from its inputs. The inputs are validated
 * first; nothing is read or written.
 */
export function constructEngineerStep(value: unknown, environment: StepEnvironment): ConstructedEngineerStep {
  const validated = validateStepInputs(value);
  if (validated.role !== 'engineer') throw new Error(`These step inputs are ${validated.role} inputs, not engineer inputs`);
  const inputs: EngineerStepInputs = validated;
  const { projectRoot } = environment;
  const loaded = environment.packages.get('engineer');
  if (loaded === undefined) throw new Error('No prompt package is loaded for the module engineer');
  const { assignment } = inputs;
  const selectionErrors = featureSelectionErrors(assignment.featureSelection, new Set((inputs.known.projectFeatureRegistry ?? inputs.known.scenarioFeatures).map(path => path.project)));
  if (selectionErrors.length > 0) throw new Error(selectionErrors.map(error => `${error.path}: ${error.message}`).join('; '));
  if (assignment.featureSelection?.files.some(file => !inputs.focused.featurePaths.some(path => path.project === file))) {
    throw new Error('Captured focused paths omit an explicitly selected generated feature; import the assignment inputs again');
  }
  if (assignment.featureSelection !== undefined) {
    const obligated = inputs.scenarios?.kind === 'entry'
      ? inputs.scenarios.scenarios.filter(scenario => assignment.obligations?.includes(scenario.id)).map(scenario => scenario.file)
      : inputs.scenarios?.kind === 'integration' && assignment.obligations?.includes(inputs.scenarios.integration.scenario.id)
        ? [inputs.scenarios.integration.scenario.file] : [];
    const selected = new Set([...assignment.featureSelection.files, ...obligated]);
    if (inputs.focused.featurePaths.some(path => !selected.has(path.project))) {
      throw new Error('Captured focused paths include a feature not selected by the assignment; import the assignment inputs again');
    }
  }
  if (inputs.focused.command.kind === 'available') {
    const selected = inputs.focused.featurePaths.map(file => path(projectRoot, file)).sort();
    if (JSON.stringify([...inputs.focused.command.selection.paths].sort()) !== JSON.stringify(selected)) {
      throw new Error('Captured Cucumber command paths differ from the exact assigned feature paths; import the assignment inputs again');
    }
  }
  const workingDirectory = path(projectRoot, inputs.workingDirectory);
  const capability = inputs.capabilityWorkflow;
  const start: EngineerStepStart = inputs.start.kind === 'fresh'
    ? { mode: 'fresh', ...(inputs.start.degraded === undefined ? {} : { degraded: inputs.start.degraded }) }
    : { mode: 'continue', ref: inputs.start.point, session: inputs.start.session,
      continuing: inputs.start.kind === 'repair-continuation' ? 'repair' : 'capability-returned' };
  const kind = start.mode === 'continue' ? 'repair' as const : 'engineering' as const;
  const views: IterationApiViews[] = inputs.views.map(entry => ({ module: entry.module, unavailable: entry.unavailable,
    views: entry.views.map(view => ({ area: view.area, path: relative(view.path), revision: view.revision, coverage: view.coverage })) }));
  const focused = inputs.focused;
  const prepared = { command: focused.command, sourceFiles: focused.sourceFiles };
  const needsCucumberDiscovery = (inputs.scenarios?.kind === 'integration' || (inputs.scenarios?.kind === 'entry' && inputs.scenarios.scenarios.length > 0))
    || (assignment.obligations?.length ?? 0) > 0
    || focused.featurePaths.length > 0 || focused.command.kind === 'available';
  const prompt = `${iterationMessage({
    assignment,
    projectRoot,
    workingDirectory,
    capabilityWorkflow: capability,
    base: inputs.base,
    views,
    testAreas: inputs.testAreas.map(area => ({ module: area.module, area: relative(area.area) })),
    ...(inputs.failedGate === undefined ? {} : { failedGate: inputs.failedGate }),
    ...(inputs.handoff === undefined ? {} : { handoff: inputs.handoff }),
    ...(inputs.scenarios === undefined ? {} : { scenarios: inputs.scenarios }),
    ...(inputs.obligations.length === 0 ? {} : { obligations: inputs.obligations }),
    ...(inputs.assignmentPackage === undefined ? {} : { package: inputs.assignmentPackage }),
  })}${focused.command.kind === 'available' ? `\n\n# Prepared Cucumber feature check\n\n${focused.command.shellCommand}\nConfig SHA-256 ${focused.command.configurationIdentity}; current generated and source bytes are revalidated at dispatch.\n${focusedCommandPendingNote}` : needsCucumberDiscovery ? `\n\nCucumber feature check unavailable: ${focused.command.reason}. Do not combine CLI feature paths with the broad default profile.` : ''}${inputs.guidance === undefined ? '' : `\n\n# Qualified existing behavior\n\n${inputs.guidance}`}${consultationContext(inputs.consultation, inputs.role)}`;
  const bounds = { idleMs: inputs.bounds.idleMs, absoluteMs: inputs.bounds.absoluteMs, commandTimeoutMs: inputs.bounds.commandTimeoutMs };
  const limits = invocationLimits(inputs.limits, { bounds });
  const consultation = consultationAvailability(inputs.consultation ?? undefined, inputs.role);
  const tools = [shellToolDeclaration(bounds.commandTimeoutMs), ...(consultation.target === null ? [] : [consultArchitectDeclaration])];
  const submission = {
    toolName: engineerToolName,
    description: engineerSubmissionDescription,
    inputSchema: engineerJsonSchema,
    submissionSchema: 'ramify-agent.engineer-submission/2' as const,
  };
  const task = {
    kind,
    modules: 'module' in assignment.scope.base ? [assignment.scope.base.module] : [...assignment.scope.base.modules],
    goal: assignment.goal,
    requirements: [assignment.completionEvidence],
    cucumberConfiguration: needsCucumberDiscovery ? focusedScenarioFacts(prepared) : null,
    omit: inputs.assignmentPackage === undefined ? [] : [inputs.assignmentPackage],
    literalSections: [
      ...(inputs.assignmentPackage === undefined ? [] : [{ key: 'support:assignment-package', text: inputs.assignmentPackage }]),
      ...(needsCucumberDiscovery ? [{ key: 'support:cucumber-discovery', text: ['## Globally loaded Cucumber support', '',
        focused.command.kind === 'available'
          ? 'The task environment\'s cucumberConfiguration supplies the prepared configuration path and identity, authenticated source file paths and SHA-256 identities, exact selection, and globally loaded support/world/loader pointers for binding discovery. Read the named configuration files for their current bytes; sourceFiles contains hashes, not file contents.'
          : `Configuration/support discovery evidence unavailable: ${focused.command.reason}. Inspect the declared check/configuration pointers; observed step files alone do not establish what is loaded.`,
      ].join('\n') }] : []),
    ],
    views: views.flatMap(entry => entry.views.map(view => ({ path: view.path, revision: view.revision, modules: [entry.module],
      coverage: view.coverage === null ? [] : [`${view.coverage} coverage limits`] }))),
  };
  const groups: StartingPointGroup[] = inputs.startingPoints === null ? [] : [{ origin: inputs.startingPoints.origin, points: inputs.startingPoints.points }];
  const brief = composeTaskBrief(projectRoot, {
    kind, work: inputs.work, goal: task.goal, requirements: task.requirements, prompt, omit: task.omit, literalSections: task.literalSections,
    startingPointGroups: groups, known: engineerKnownFacts(inputs),
    environment: { projectRoot, workingDirectory, candidate: inputs.candidateBefore ?? null, snapshot: null, limits,
      availableTools: [...engineerBuiltinTools, ...tools.map(tool => tool.name), submission.toolName], views: task.views,
      supportPaths: deliveredSupportPaths(loaded, kind), cucumberConfiguration: task.cucumberConfiguration },
  });
  return {
    role: 'engineer',
    consultation: consultationAvailability(inputs.consultation ?? undefined, inputs.role),
    inputs,
    work: { workItem: inputs.work.workItem, iteration: inputs.work.iteration },
    attempt: inputs.attempt,
    loaded,
    systemPrompt: renderEngineerPrompt(loaded, projectRoot, bounds.commandTimeoutMs, workingDirectory),
    prompt,
    task,
    brief,
    submission,
    validator: {
      capabilityWorkflow: capability && inputs.capabilityPolicy,
      obligation: assignment.evidenceObligations.find(evidence => evidence.obligation !== undefined && evidence.against === 'real')?.obligation ?? null,
      kind: assignment.kind,
      assigned: assignment.obligations ?? [],
      consumer: inputs.consumer,
    },
    bounds,
    limits,
    context: inputs.context,
    start,
    equipment: {
      workingDirectory,
      scopeRevision: assignment.scope.revision,
      commandTimeoutMs: bounds.commandTimeoutMs,
      submissions: { legalOutcomes: capability ? ['completion-proposed', 'partial', 'unsuitable', 'capability-needed', 'contract-needed']
        : ['completion-proposed', 'partial', 'unsuitable', 'contract-needed'],
        completionOutcome: 'completion-proposed' },
      focusedCommands: focused.command.kind === 'available' ? [{ shellCommand: focused.command.shellCommand, selection: focused.command.selection,
        environment: focused.command.environment, sourceFiles: focused.sourceFiles }] : [],
      builtinTools: [...engineerBuiltinTools],
      tools,
      protectedFiles: { harness: inputs.protectedFiles.harness.map(relative), unauthorized: inputs.protectedFiles.unauthorized.map(relative) },
    },
    before: { inputs },
  };
}

/**
 * What one engineer invocation's inputs are collected from: the run's
 * records and the project as they stand, or, for inputs authored without a
 * run, the project and the authored records alone.
 */
export interface EngineerInputFacts {
  readonly consultation?: ConsultationInputs | undefined;
  readonly run: EngineerStepInputs['run'];
  readonly item: WorkItem;
  readonly assignment: IterationAssignment;
  readonly attempt: number;
  readonly base: string;
  readonly beforeTree: string | undefined;
  readonly capabilityWorkflow: boolean;
  readonly capabilityPolicy: boolean;
  readonly workingDirectory: ProjectPath;
  readonly views: readonly IterationApiViews[];
  readonly testAreas: readonly TestArea[];
  readonly scenarios: EngineerScenarios | undefined;
  readonly obligations: readonly AssignedObligation[];
  readonly assignmentPackage: string | undefined;
  readonly featurePaths: readonly string[];
  readonly focused: Awaited<ReturnType<typeof prepareAssignedCucumber>>;
  readonly failedGate: { readonly id: string; readonly cause: string | null; readonly summary: readonly string[] } | undefined;
  readonly handoff: { readonly done: readonly string[]; readonly unfinished: readonly string[]; readonly returns: number } | undefined;
  readonly guidance: string | undefined;
  readonly startingPoints: StartingPointGroup | null;
  readonly known: KnownProjectFacts;
  readonly protectedFiles: { readonly harness: readonly string[]; readonly unauthorized: readonly string[] };
  readonly bounds: EngineerBounds;
  readonly limits: RunPolicy['limits'];
  readonly context: RunPolicy['context']['engineer'];
  readonly start: EngineerStepInputs['start'];
  readonly provenance?: EngineerStepInputs['provenance'] | undefined;
}

/** One engineer invocation's inputs from its collected facts, every path project-relative, validated. */
export function engineerStepInputsOf(facts: EngineerInputFacts): EngineerStepInputs {
  // Captured JSON facts, without the undefined members JSON never carries.
  const plain = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
  return validateEngineerInputs({
    schema: 'ramify-agent.step-inputs/1',
    role: 'engineer',
    consultation: facts.consultation ?? { unavailable: facts.run === null ? 'Standalone inputs have no retained architect history.' : 'These facts recorded no assigning architect point.' },
    run: facts.run,
    work: { workItem: facts.item.id, iteration: facts.assignment.id },
    attempt: facts.attempt,
    consumer: facts.item.module,
    assignment: facts.assignment,
    base: facts.base,
    ...(facts.beforeTree === undefined ? {} : { candidateBefore: facts.beforeTree }),
    capabilityWorkflow: facts.capabilityWorkflow,
    capabilityPolicy: facts.capabilityPolicy,
    workingDirectory: facts.workingDirectory,
    views: facts.views.map(entry => ({ module: entry.module, unavailable: entry.unavailable,
      views: entry.views.map(view => ({ area: view.area, path: projectPath(view.path), revision: view.revision, coverage: view.coverage })) })),
    testAreas: facts.testAreas.map(area => ({ module: area.module, area: projectPath(area.area) })),
    ...(facts.scenarios === undefined ? {} : { scenarios: plain(facts.scenarios) }),
    obligations: facts.obligations.map(obligation => ({ id: obligation.id, text: obligation.text })),
    ...(facts.assignmentPackage === undefined ? {} : { assignmentPackage: facts.assignmentPackage }),
    focused: { featurePaths: facts.featurePaths.map(projectPath), command: plain(facts.focused.command), sourceFiles: { ...facts.focused.sourceFiles } },
    ...(facts.failedGate === undefined ? {} : { failedGate: { id: facts.failedGate.id, cause: facts.failedGate.cause, summary: [...facts.failedGate.summary] } }),
    ...(facts.handoff === undefined ? {} : { handoff: { done: [...facts.handoff.done], unfinished: [...facts.handoff.unfinished], returns: facts.handoff.returns } }),
    ...(facts.guidance === undefined ? {} : { guidance: facts.guidance }),
    startingPoints: facts.startingPoints === null ? null : plain(facts.startingPoints),
    known: knownFactsInputs(facts.known),
    protectedFiles: { harness: facts.protectedFiles.harness.map(projectPath), unauthorized: facts.protectedFiles.unauthorized.map(projectPath) },
    bounds: { idleMs: facts.bounds.idleMs, absoluteMs: facts.bounds.absoluteMs, commandTimeoutMs: facts.bounds.commandTimeoutMs },
    limits: facts.limits,
    context: facts.context,
    start: facts.start,
    ...(facts.provenance === undefined ? {} : { provenance: facts.provenance }),
  });
}
