import { buildPreparedTaskPacket, type PreparedTaskPackage, type TaskEnvironment, type TaskPacket, type EnvironmentField } from '../../subs/task-execution/src/delivery/packet.js';
import { architectAnswerName, architectAnswerJsonSchema } from '../consultations/submissions.js';
import type { LoadedPackage, ExtractionTurn, PackageFile } from './packages.js';
import type { ReviewKind } from '../../subs/autonomous/src/run/records.js';
import { z } from 'zod';
import { repairResultSchema } from '../interfaces/protocol/repairs.js';
import { compactionReviewSchema } from '../../subs/autonomous/src/run/compaction-review.js';
import { finalCorrectionSchema } from '../../subs/autonomous/src/run/final-correction.js';
import { qualificationActionSchema } from '../../subs/autonomous/subs/work-coordination/src/capability/submission.js';
import { initialAnalysisToolName } from '../../subs/autonomous/subs/planning/src/submission.js';
import { intakeToolName, principleToolName, checkToolName } from '../../subs/autonomous/subs/planning/src/extraction.js';
import { localArchitectToolName } from '../../subs/autonomous/subs/work-coordination/src/work/submission.js';
import { engineerToolName } from '../../subs/autonomous/subs/work-coordination/src/work/engineer.js';
import { forkToolName } from '../../subs/autonomous/subs/work-coordination/src/architecture/submission.js';
import { contractToolName } from '../../subs/autonomous/subs/work-coordination/src/contracts/submission.js';
import { reviewToolName, orientationToolName } from '../../subs/reviews/src/submission.js';
import { reconciliationToolName } from '../../subs/reviews/src/reconciliation.js';
import { failureAnalysisToolName } from '../../subs/autonomous/subs/work-coordination/src/work/failure.js';
import { workOrientationToolName, contextSelectorToolName } from '../../subs/autonomous/subs/work-coordination/src/context-selection/submissions.js';
import { coordinatorActionJsonSchema, coordinatorActionToolName, coordinatorAssessmentToolName,
  coordinatorInvestigationJsonSchema, coordinatorInvestigationToolName, nonfunctionalRepairToolName } from '../../subs/autonomous/src/nonfunctional/submissions.js';
import { type DeliveredInput } from '../../subs/task-execution/src/delivery/delivered-manifest.js';

import { type BriefingDelivery } from '../../subs/task-execution/src/delivery/briefings.js';

export type TaskKind = 'initial-analysis' | ExtractionTurn | 'placement' | 'orientation' | 'assignment' | 'completion' | 'repair' | 'automatic-repair'
  | 'selection' | 'reselection' | 'capability' | 'engineering' | 'contract' | 'reconciliation' | ReviewKind | 'design-orientation'
  | 'failure-analysis' | 'assessment' | 'action' | 'investigation' | 'standalone-command' | 'capability-qualification' | 'consultation' | 'architect-consultation'
  | 'compaction-review' | 'final-correction';

/** Intentional families for every supported pair, independent of source paths or equal prose. */
const procedureFamilies: Readonly<Partial<Record<LoadedPackage['role'], Partial<Record<TaskKind, string>>>>> = {
  'initial-architect': { 'initial-analysis': 'main' },
  'catalog-extractor': { intake: 'intake', principles: 'principles', check: 'check' },
  'global-fork': { placement: 'main', 'architect-consultation': 'architect-consultation', 'final-correction': 'final-correction' },
  'local-architect': { 'architect-consultation': 'architect-consultation', orientation: 'orientation', assignment: 'main', completion: 'main', repair: 'main', reconciliation: 'reconciliation', 'capability-qualification': 'qualification' },
  'context-selector': { selection: 'main', reselection: 'main' },
  engineer: { engineering: 'main', repair: 'main', 'automatic-repair': 'automatic-repair', 'standalone-command': 'main', consultation: 'consultation' },
  'capability-architect': { 'architect-consultation': 'architect-consultation', capability: 'main', reconciliation: 'reconciliation', 'capability-qualification': 'qualification' },
  'contract-engineer': { contract: 'main' },
  reviewer: { code: 'code', scope: 'scope', design: 'design', 'design-orientation': 'orientation' },
  'failure-analyst': { 'failure-analysis': 'main' },
  'nonfunctional-coordinator': { assessment: 'assessment', action: 'action', investigation: 'investigation' },
  'nonfunctional-repair-engineer': { repair: 'main' },
};

/** The tools that read the project's files, and so its generated views. */
const fileReaders = ['read', 'grep', 'ls', 'find', 'shell'];

/** A path inside the project, relative to its root; any other path as given. */
function projectRelative(projectRoot: string, path: string): string {
  const root = projectRoot.replace(/\/+$/u, '');
  if (path === root) return '.';
  return path.startsWith(`${root}/`) ? path.slice(root.length + 1) : path;
}

/**
 * The environment blocks one invocation is told of, selected by the tools
 * it holds and the current task: catalog-only prose tasks need no generated
 * view inventory. What its tools cannot use is not sent. A field absent here is
 * delivered only to correct an earlier value the session already holds.
 *
 * - The project root and working directory reach only a role that reads the
 *   project's files; tasks that use views receive them project-relative.
 * - The limits describe quiet intervals and submission judgments; the command
 *   quiet interval reaches a role with a shell. Assignment authors also receive
 *   the command baseline and ceiling used by their assignment contract.
 * - A null candidate, snapshot or Cucumber configuration says nothing, nor
 *   does a snapshot equal to the candidate. Engineers receive current Cucumber
 *   discovery facts separately from the authoritative focused command.
 * - Support paths name the harness's own prompt files, which no project
 *   agent can open; the manifest keeps them as provenance.
 */
export function selectedEnvironment(environment: TaskEnvironment, task?: { readonly role: LoadedPackage['role']; readonly kind: TaskKind }): Partial<Record<EnvironmentField, unknown>> {
  const tools = environment.availableTools;
  const readsFiles = tools.some(tool => fileReaders.includes(tool));
  const shell = tools.includes('shell');
  const selected: Partial<Record<EnvironmentField, unknown>> = {};
  if (readsFiles) {
    selected.projectRoot = environment.projectRoot;
    selected.workingDirectory = environment.workingDirectory;
  }
  if (environment.candidate !== null) {
    selected.candidate = tools.includes('snapshot_read') ? { candidate: environment.candidate, paths: 'project-relative; the snapshot tools read this candidate' } : environment.candidate;
  }
  if (environment.snapshot !== null && environment.snapshot !== environment.candidate) selected.snapshot = environment.snapshot;
  const limits = environment.limits;
  const own = ['invocationIdleMs', ...(shell ? ['commandTimeoutMs'] : [])];
  const assignmentAuthor = task !== undefined && (
    task.role === 'local-architect' && ['assignment', 'completion', 'repair'].includes(task.kind)
    || task.role === 'capability-architect' && task.kind === 'capability');
  selected.limits = {
    ...Object.fromEntries(own.filter(key => limits[key] !== undefined).map(key => [key, limits[key]])),
    ...(assignmentAuthor ? { commandPolicy: {
      defaultMs: limits.commandTimeoutMs ?? null,
      ceilingMs: limits.maxCommandTimeoutMs ?? null,
      rule: 'Omit assignment.bounds.commandTimeoutMs unless the work needs a permitted increase. An override uses { ms, reason }, cannot lower the default or exceed the ceiling, and must satisfy the captured assignment bounds. Null means policy evidence is unavailable; request it before choosing an override.',
    } } : {}),
  };
  selected.availableTools = environment.availableTools;
  const usesViews = task === undefined || !(task.role === 'catalog-extractor' && ['intake', 'principles', 'check'].includes(task.kind));
  if (readsFiles && usesViews && environment.views.length > 0) {
    const views = environment.views.map(view => ({ ...view, path: projectRelative(environment.projectRoot, view.path) }));
    const apiDirectories = views.filter(view => /\/\.ramify\/(external|children)$/u.test(view.path));
    const note = apiDirectories.length > 0 && apiDirectories.every(view => view.path.endsWith('/external'))
      ? { note: 'This module has no children view, so no `children` directory exists.' } : {};
    selected.views = { views, ...note };
  }
  if (environment.cucumberConfiguration !== null && (task?.role === 'engineer' || task === undefined)) selected.cucumberConfiguration = environment.cucumberConfiguration;
  return selected;
}

/**
 * A single-brace misspelling of a declared placeholder name would render
 * literally, so every declared name is refused in that form. Only declared
 * names are checked: literal JSON or code braces are not placeholders.
 */
export function rejectSingleBracePlaceholders(template: string, names: Iterable<string>): void {
  for (const name of new Set(names)) {
    if (new RegExp(`(?<!\\{)\\{${name}\\}(?!\\})`).test(template)) throw new Error(`Malformed required placeholder {${name}}`);
  }
}

/** Required slots are declared, not inferred from arbitrary JSON/code braces. */
export function renderRequiredSlots(template: string, values: Readonly<Record<string, string>>, required: readonly string[]): string {
  rejectSingleBracePlaceholders(template, ['procedure', 'submissionTool', ...Object.keys(values), ...required]);
  for (const name of required) {
    if (!(name in values) || !values[name]?.trim()) throw new Error(`Missing required prompt input ${name}`);
  }
  for (const match of template.matchAll(/\{\{(\w+)\}\}/g)) if (!(match[1]! in values)) throw new Error(`Unresolved required placeholder {{${match[1]}}}`);
  return template.replace(/\{\{(\w+)\}\}/g, (_, name: string) => values[name]!);
}

export function stableRoleInstructions(loaded: LoadedPackage): string {
  return renderRequiredSlots(loaded.system, { skill: loaded.skill, skillDirectory: loaded.skillDirectory, contractSkill: loaded.extraSkill }, []);
}

/** The role's delivered sources: its system file and the skills its slots embed. Other package files are not delivered. */
function roleSources(loaded: LoadedPackage): PackageFile[] {
  const system = loaded.files.find(file => file.kind === 'system');
  return loaded.files.filter(file =>
    file.kind === 'system' && file.path === system?.path ||
    file.kind === 'skill' && (loaded.embeddedSkillPaths ?? []).includes(file.path));
}

/** The current procedure's delivered sources: its own file and the section files it embeds. */
function procedureSources(loaded: LoadedPackage, task: { readonly source: string | null; readonly embedded: readonly string[] }): PackageFile[] {
  return loaded.files.filter(file => file.path === task.source || task.embedded.includes(file.path));
}

/**
 * The package paths a task actually delivers to the model: the role's
 * sources and the current procedure's, including embedded sections. The
 * package's synthetic schema files and the procedures other tasks use are
 * not delivered and are not named.
 */
export function deliveredSupportPaths(loaded: LoadedPackage, kind: TaskKind, consultationSubmissionSchema?: string): string[] {
  const task = taskDefinition(loaded, kind, consultationSubmissionSchema);
  return [...new Set([...roleSources(loaded), ...procedureSources(loaded, task)].map(file => file.path))];
}

function taskDefinition(loaded: LoadedPackage, kind: TaskKind, consultationSubmissionSchema?: string): { tool: string; schema: string; procedure: string; source: string | null; embedded: readonly string[]; family: string } {
  let tool: string | undefined;
  let schema = loaded.submissionSchema;
  let procedure = loaded.procedure;
  let source = loaded.files.find(file => file.kind === 'procedure')?.path ?? null;
  const role = loaded.role;
  if (kind === 'compaction-review' && ['local-architect', 'capability-architect', 'nonfunctional-coordinator'].includes(role)) {
    return { tool: 'submit_compaction_review', schema: JSON.stringify(z.toJSONSchema(compactionReviewSchema)),
      procedure: 'Review the unfinished engineer task and current evidence while native compaction runs. Compaction alone establishes neither failure nor diminishing returns. Decide continue when the next work is useful, or handoff when the approach needs reconsideration, a prerequisite is missing, or further refinement is not worth its cost. Explain why. Improve context and guidance rather than removing tools. Leave implementation to the engineer. Submit the decision through {{submissionTool}}.',
      source: null, embedded: [], family: 'compaction-review' };
  }
  if (kind === 'final-correction' && role === 'global-fork') {
    return { tool: 'submit_final_correction', schema: JSON.stringify(z.toJSONSchema(finalCorrectionSchema)),
      procedure: 'Read the failed final-verification diagnostics and relevant source and evidence. Choose the responsible module architect and next correction goal, explaining why that approach should help. Retain accepted work and unmet requirements. An execution problem may need investigation before source edits. Submit the module, goal and rationale through {{submissionTool}}.',
      source: null, embedded: [], family: 'final-correction' };
  }
  if (role === 'initial-architect' && kind === 'initial-analysis') tool = initialAnalysisToolName;
  if (role === 'catalog-extractor' && ['intake', 'principles', 'check'].includes(kind)) {
    const turn = kind as ExtractionTurn;
    const extraction = loaded.extraction?.[turn];
    if (!extraction) throw new Error(`Missing ${turn} procedure`);
    tool = { intake: intakeToolName, principles: principleToolName, check: checkToolName }[turn];
    schema = extraction.submissionSchema; procedure = extraction.procedure;
    source = `subs/harness/src/analysis/${turn}.procedure.md`;
  }
  if (['local-architect', 'capability-architect', 'global-fork'].includes(role) && kind === 'architect-consultation') {
    tool = architectAnswerName;
    schema = JSON.stringify(architectAnswerJsonSchema);
    procedure = 'This is advisory only. Explain, research and advise using inherited context and current source/views, whose revisions and limits may differ from inherited observations. Use read-only tools. Do not change source, assignments, scope, permissions or architectural decisions. The original architect conversation is untouched. A local fork may optionally consult its recorded plan architect, carrying relevant new facts in its question. Answer through {{submissionTool}} with a nonblank answer; state uncertainty where evidence is missing.';
    source = null;
  }
  if (role === 'global-fork' && kind === 'placement') tool = forkToolName;
  if (role === 'local-architect' && ['assignment', 'completion', 'repair'].includes(kind)) tool = localArchitectToolName;
  if (role === 'local-architect' && kind === 'orientation') {
    if (!loaded.workOrientation) throw new Error('Missing work orientation procedure');
    tool = workOrientationToolName; schema = loaded.workOrientation.submissionSchema; procedure = loaded.workOrientation.procedure;
    source = 'subs/harness/src/context-selection/orientation.procedure.md';
  }
  if (role === 'context-selector' && ['selection', 'reselection'].includes(kind)) tool = contextSelectorToolName;
  if (role === 'engineer' && ['engineering', 'repair', 'standalone-command'].includes(kind)) tool = engineerToolName;
  if (role === 'engineer' && kind === 'automatic-repair') {
    tool = 'submit_automatic_repair'; schema = JSON.stringify(z.toJSONSchema(repairResultSchema));
    procedure = 'Restore only the named pure architect preparation operation under the recorded contingent root assignment. Preserve useful partial work, captured plan and acceptance inputs, interfaces and every module declaration. Do not change topology, harness code, progress records or Git history. Use ordinary guarded equipment; shell execution does not override refused edits. If the target cannot be repaired within this authority, report blocked. Submit ready or blocked with a summary of changes, checks, remaining work, suspected cause and evidence through {{submissionTool}}. Ready is an agent judgment pending harness verification and architect handback; it never completes implementation obligations.';
    source = null;
  }
  if (role === 'engineer' && kind === 'consultation') {
    if (!consultationSubmissionSchema?.trim()) throw new Error('Consultation requires the actual caller-owned submission schema');
    const supplied: unknown = JSON.parse(consultationSubmissionSchema);
    if (supplied === null || typeof supplied !== 'object' || Array.isArray(supplied) || (supplied as { type?: unknown }).type !== 'object') throw new Error('Consultation requires the actual object submission schema');
    tool = 'answer_capability_consultation'; schema = consultationSubmissionSchema;
    procedure = 'Answer only the named read-only consumer consultation using the supplied question, current plan, source and references. Use the supplied views and available read-only tools to state evidence, objections and uncertainty. Submit the answer through {{submissionTool}}; an answer authorizes no source changes.';
    source = null;
  }
  if (['local-architect', 'capability-architect'].includes(role) && kind === 'capability-qualification') {
    tool = 'submit_capability_qualification'; schema = JSON.stringify(z.toJSONSchema(qualificationActionSchema));
    procedure = 'Qualify only the named capability request using its current request and invocation identities, captured source, current plan and supplied API views. Inspect the actual exposed API and use sites; a matching name does not establish sufficient behavior and a missing name does not establish absence. Use available read-only tools. Name actual consumer and provider locations; resolve any proposed import from the consumer file and assess importability separately with current API evidence. Return design contradictions to the responsible architect for explicit revision before handback; advice does not revise an assignment. Submit satisfy-with-existing with concrete API evidence, delegate-capability with placement reasoning, request-placement, or unresolved through {{submissionTool}}.';
    source = null;
  }
  if (role === 'capability-architect' && kind === 'capability') tool = 'submit_capability_action';
  if (role === 'contract-engineer' && kind === 'contract') tool = contractToolName;
  if (['local-architect', 'capability-architect'].includes(role) && kind === 'reconciliation') {
    if (!loaded.reconciliation) throw new Error('Missing reconciliation procedure');
    tool = reconciliationToolName; schema = loaded.reconciliation.submissionSchema; procedure = loaded.reconciliation.procedure;
    source = 'subs/harness/src/prompts/reconciliation.procedure.md';
  }
  if (role === 'reviewer' && ['code', 'scope', 'design'].includes(kind)) {
    tool = reviewToolName; procedure = loaded.reviewer!.procedures[kind as ReviewKind];
    source = `subs/harness/src/prompts/${kind}-review.procedure.md`;
  }
  if (role === 'reviewer' && kind === 'design-orientation') {
    tool = orientationToolName; schema = loaded.reviewer!.orientation.submissionSchema;
    procedure = loaded.reviewer!.orientation.system;
    source = 'subs/harness/src/prompts/reviewer-orientation.system.md';
  }
  if (role === 'failure-analyst' && kind === 'failure-analysis') tool = failureAnalysisToolName;
  if (role === 'nonfunctional-coordinator' && kind === 'assessment') tool = coordinatorAssessmentToolName;
  if (role === 'nonfunctional-coordinator' && kind === 'action') {
    tool = coordinatorActionToolName; schema = JSON.stringify(coordinatorActionJsonSchema);
    procedure = 'Choose only the next action the current harness decision permits. Submit the action with {{submissionTool}}; do not edit source.';
    source = null;
  }
  if (role === 'nonfunctional-coordinator' && kind === 'investigation') {
    tool = coordinatorInvestigationToolName; schema = JSON.stringify(coordinatorInvestigationJsonSchema);
    procedure = 'Investigate only the named requirements against the supplied candidate. Report scope, evidence and uncertainty through {{submissionTool}}. Use read-only tools; make no repair or final satisfaction judgment.';
    source = null;
  }
  if (role === 'nonfunctional-repair-engineer' && kind === 'repair') tool = nonfunctionalRepairToolName;
  if (!tool) throw new Error(`Unsupported role/task pair ${role}/${kind}`);
  // Only the package's main procedure has its section files filled in; a replaced procedure embeds none.
  const embedded = procedure === loaded.procedure ? loaded.embeddedProcedurePaths ?? [] : [];
  const family = procedureFamilies[role]?.[kind];
  if (!family) throw new Error(`Missing explicit procedure family ${role}/${kind}`);
  return { tool, schema, procedure, source, embedded, family };
}

/** Resolve workflow procedure, source and environment policy before generic delivery. */
export function prepareTaskPackage(loaded: LoadedPackage, kind: string, consultationSubmissionSchema?: string): PreparedTaskPackage {
  const task = taskDefinition(loaded, kind as TaskKind, consultationSubmissionSchema);
  const role = loaded.role;
  return { role, package: loaded.package, roleInstructions: stableRoleInstructions(loaded),
    roleSource: loaded.files.find(file => file.kind === 'system')?.path ?? null, roleSources: roleSources(loaded),
    task: { ...task, procedure: renderRequiredSlots(task.procedure, { submissionTool: task.tool }, ['submissionTool']), sources: procedureSources(loaded, task) },
    selectEnvironment: environment => selectedEnvironment(environment, { role, kind: kind as TaskKind }) };
}

export function buildTaskPacket(input: {
  readonly loaded: LoadedPackage;
  readonly kind: TaskKind;
  readonly objective: string;
  readonly goal: string;
  readonly requirements: readonly string[];
  readonly environment: TaskEnvironment;
  readonly briefing: BriefingDelivery;
  readonly inheritedPoint: string | null;
  readonly inherited: readonly DeliveredInput[];
  /** Supplied once for a fresh session or a role change, false for ordinary continuation. */
  readonly supplyRoleInstructions: boolean;
  readonly changedPaths?: readonly { readonly path: string; readonly annotation?: string }[];
  /** Consultation's actual caller-owned schema, serialized from its runtime validator. */
  readonly consultationSubmissionSchema?: string;
  /** A fork that keeps its source's sections: none of them is withdrawn. */
  readonly retainInheritedSections?: boolean;
}): TaskPacket {
  if (['code', 'scope', 'design'].includes(input.kind) && (!input.environment.candidate || !input.environment.snapshot)) throw new Error('Review requires current candidate and snapshot identities');
  return buildPreparedTaskPacket({ ...input, loaded: prepareTaskPackage(input.loaded, input.kind, input.consultationSubmissionSchema) });
}
