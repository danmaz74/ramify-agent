import { buildDeliveredManifest, exactInputHash, type DeliveredInput, type DeliveredManifest } from './delivered-manifest.js';
import { deliveredBefore, effectiveBlocks, renderBlockSet, renderBlockRemoval, resolveBlockAdditions, setsBody } from './blocks.js';
import { taskBriefingRevision, type BriefingDelivery } from './briefings.js';

export interface TaskEnvironment {
  readonly projectRoot: string;
  readonly workingDirectory: string;
  readonly candidate: string | null;
  readonly snapshot: string | null;
  readonly limits: Readonly<Record<string, unknown>>;
  readonly availableTools: readonly string[];
  readonly views: readonly { readonly path: string; readonly revision: string | null; readonly modules: readonly string[]; readonly coverage: readonly string[] }[];
  readonly supportPaths: readonly string[];
  readonly cucumberConfiguration: string | null;
}

export interface PreparedTaskPackage {
  readonly role: string;
  readonly package: string;
  readonly roleInstructions: string;
  readonly roleSource: string | null;
  readonly roleSources: readonly { readonly path: string; readonly hash: string; readonly bytes: number; readonly kind?: string }[];
  readonly task: { readonly tool: string; readonly schema: string; readonly procedure: string; readonly source: string | null; readonly family: string; readonly sources: PreparedTaskPackage['roleSources'] };
  readonly selectEnvironment: (environment: TaskEnvironment) => Partial<Record<EnvironmentField, unknown>>;
}
const environmentFields = ['projectRoot', 'workingDirectory', 'candidate', 'snapshot', 'limits', 'availableTools', 'views', 'supportPaths', 'cucumberConfiguration'] as const satisfies readonly (keyof TaskEnvironment)[];
export type EnvironmentField = keyof TaskEnvironment;

/** The body of one environment block: its field, or the selected value's own fields where it carries several. */
function environmentBody(key: EnvironmentField, value: unknown): string {
  const fields = value !== null && typeof value === 'object' && !Array.isArray(value) && (key === 'candidate' || key === 'views') ? value as Record<string, unknown> : { [key]: value };
  return JSON.stringify(canonicalJson(fields), null, 2);
}

/** Objects are canonical; arrays retain the caller's order and replace atomically. */
function canonicalJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (value !== null && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, child]) => [key, canonicalJson(child)]));
  return value;
}

export function assertTaskProcedureSelection(history: readonly DeliveredInput[], key: string, hash: string): void {
  const selected = effectiveBlocks(history).get(key);
  if (!selected || selected.kind !== 'procedure' || exactInputHash(selected.text) !== hash) throw new Error(`Selected procedure ${key}/${hash} is unavailable`);
}

export interface TaskPacket {
  readonly roleInstructions: string;
  readonly message: string;
  readonly submissionTool: string;
  /** Schema appears once, in this declaration's description, matching the compact tool mechanism. */
  readonly declaration: { readonly name: string; readonly description: string; readonly inputSchema: { readonly type: 'object' }; readonly mutating: false };
  /** Manifest components. Role/tool entries are separate provider inputs; remaining entries occur once within message. */
  readonly additions: readonly DeliveredInput[];
  readonly manifest: DeliveredManifest;
}

export function buildPreparedTaskPacket(input: {
  readonly loaded: PreparedTaskPackage;
  readonly kind: string;
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
  const { loaded, environment } = input;
  if (!input.objective.trim() || !input.goal.trim() || input.requirements.length === 0 || input.requirements.some(requirement => !requirement.trim())) throw new Error('Task requires objective, goal and complete requirement text');
  if (!environment.projectRoot.trim() || !environment.workingDirectory.trim()) throw new Error('Task environment requires project root and current working directory');
  for (const key of ['candidate', 'snapshot', 'limits', 'availableTools', 'views', 'supportPaths', 'cucumberConfiguration'] as const) {
    if (environment[key] === undefined) throw new Error(`Missing required environment input ${key}`);
  }
  if (!input.supplyRoleInstructions && !input.inherited.some(item => item.key === `role:${loaded.role}` && item.kind === 'role-instructions')) throw new Error(`Current role ${loaded.role} is not inherited; append its instructions explicitly`);
  if (input.changedPaths && new Set(input.changedPaths.map(item => item.path)).size !== input.changedPaths.length) throw new Error('Canonical changed paths must be unique');
  if (input.briefing.kind === 'unavailable') throw new Error(input.briefing.reason);
  if (input.briefing.mode === 'full' && input.inherited.length > 0) throw new Error('Full fresh briefing cannot be appended to an inherited session; use its named delta or post-fork updates');
  const canonical = taskBriefingRevision({ revision: input.briefing.revision, goal: input.goal, requirements: input.requirements, sections: [] });
  for (const section of canonical.sections) {
    if (!input.briefing.currentSections.some(current => current.key === section.key && current.text === section.text)) throw new Error(`Current task briefing requires canonical ${section.key} section matching its explicit inputs`);
  }
  const task = loaded.task;
  if (!environment.availableTools.includes(task.tool)) throw new Error(`Current submission tool ${task.tool} is unavailable`);
  const procedure = task.procedure;
  const roleInstructions = loaded.roleInstructions;
  const declaration = { name: task.tool, description: `Submit this task using exactly this JSON schema: ${JSON.stringify(JSON.parse(task.schema))}`,
    inputSchema: { type: 'object' as const }, mutating: false as const };
  const previousDeclaration = input.inherited.find(item => item.kind === 'tool-declaration' && item.key === `tool:${task.tool}`);
  if (previousDeclaration && previousDeclaration.text !== JSON.stringify(declaration)) throw new Error(`Immutable tool declaration changed for ${task.tool}; use a new tool name`);
  const previousRole = input.inherited.filter(item => item.key === `role:${loaded.role}` && item.kind === 'role-instructions');
  if (previousRole.some(item => item.text !== roleInstructions)) throw new Error(`Pinned role instructions changed for ${loaded.role}`);
  const procedureKey = `procedure:${loaded.role}:${task.family}`;
  const procedureBody = `# Current procedure\n${procedure}`;
  const inheritedBlocks = effectiveBlocks(input.inherited);
  const selected = loaded.selectEnvironment(environment);
  // A field this role is not told of stays unsent, unless the session holds
  // an earlier value of it: that value is corrected, or withdrawn where the
  // field reaches no role.
  const withdrawnEnvironment = ['supportPaths', ...('cucumberConfiguration' in selected ? [] : ['cucumberConfiguration']), ...('views' in selected ? [] : ['views'])] as readonly EnvironmentField[];
  const environmentKeys = environmentFields.filter(key => key in selected || (!withdrawnEnvironment.includes(key) && inheritedBlocks.has(`environment:${key}`)));
  const reusable = resolveBlockAdditions({ inherited: input.inherited, desired: [
    { key: procedureKey, kind: 'procedure', body: procedureBody, source: task.source, revision: loaded.package, sources: task.sources },
    ...environmentKeys.map(key => ({ key: `environment:${key}`, kind: 'environment' as const,
      body: key in selected ? environmentBody(key, selected[key]) : JSON.stringify({ [key]: canonicalJson(environment[key]) }, null, 2), source: null, revision: null })),
  ], withdraw: withdrawnEnvironment.filter(key => inheritedBlocks.has(`environment:${key}`)).map(key => `environment:${key}`) });
  const procedureHash = exactInputHash((reusable.find(item => item.key === procedureKey) ?? inheritedBlocks.get(procedureKey))!.text);
  const briefing = input.briefing;
  // A brief that retains its inherited sections withdraws none of them: a
  // fork keeps what its source read.
  const delivered: DeliveredInput[] = [...input.inherited];
  const briefingAdditions: DeliveredInput[] = [];
  const deliverBrief = (item: DeliveredInput): void => {
    if (input.retainInheritedSections === true && item.block?.effect === 'remove') return;
    const prior = effectiveBlocks(delivered).get(item.key);
    if (item.block?.effect === 'remove' ? prior === undefined
      : prior !== undefined && prior.source === item.source && setsBody(prior.text, item.key, item.text)) return;
    const addition = { ...item,
      text: item.block?.effect === 'remove' ? renderBlockRemoval(item.key) : renderBlockSet(item.key, item.text, deliveredBefore(delivered, item.key)),
      block: item.block ?? { key: item.key, effect: 'set' as const } };
    delivered.push(addition);
    briefingAdditions.push(addition);
  };
  for (const item of briefing.additions) deliverBrief(item);
  // Revision ancestry alone does not prove that a body survived replacement,
  // withdrawal or incomplete inheritance. Reconcile against the exact effective
  // deliveries, including legacy packets that lack block framing.
  for (const section of briefing.currentSections) deliverBrief({
    key: `brief:${section.key}`, kind: 'brief', text: section.text, source: section.source ?? null, revision: briefing.revision,
    block: { key: `brief:${section.key}`, effect: section.effect ?? 'set' },
  });
  const retained = briefing.currentSections.flatMap(section => {
    const key = `brief:${section.key}`;
    const prior = inheritedBlocks.get(key);
    return (section.effect ?? 'set') === 'set' && prior && prior.source === (section.source ?? null)
      && setsBody(prior.text, key, section.text) && !briefingAdditions.some(item => item.key === key)
      ? [`- ${key}: original delivery revision ${prior.revision ?? '(unrecorded)'}, source ${prior.source ?? '(task input)'}, SHA-256 ${exactInputHash(prior.text)}; original input ${prior.key}.`] : [];
  });
  const revisionText = `Briefing revision: ${input.briefing.revision}; based on: ${input.briefing.basedOnRevision ?? 'none'} (${input.briefing.mode})`;
  const taskText = [`# Current task: ${input.kind}`, 'This selection supersedes every prior task selection.', `Active role: ${loaded.role}`, `Selected procedure: ${procedureKey}; SHA-256: ${procedureHash}`, input.objective,
    ...(input.changedPaths === undefined ? [] : ['', '# Canonical changed paths', ...input.changedPaths.map(item => `- ${item.path}${item.annotation ? ` (${item.annotation})` : ''}`)]),
    ...(retained.length === 0 ? [] : ['', '# Retained task inputs', `Complete unchanged bodies remain effective in inherited point ${input.inheritedPoint}:`, ...retained]),
    '', `Submit only through \`${task.tool}\`. Only an accepted submission completes this task.`].join('\n');
  const additions: DeliveredInput[] = [
    ...(input.supplyRoleInstructions && previousRole.length === 0 ? [{ key: `role:${loaded.role}`, kind: 'role-instructions' as const, text: roleInstructions,
      source: loaded.roleSource, revision: loaded.package,
      sources: loaded.roleSources }] : []),
    ...(!input.inherited.some(item => item.kind === 'tool-declaration' && item.key === `tool:${task.tool}` && item.text === JSON.stringify(declaration)) ? [{ key: `tool:${task.tool}`, kind: 'tool-declaration' as const, text: JSON.stringify(declaration), source: null, revision: null }] : []),
    { key: 'briefing-state', kind: 'task', text: revisionText, source: null, revision: input.briefing.revision },
    ...briefingAdditions,
    ...reusable,
    { key: 'task', kind: 'task', text: taskText, source: null, revision: input.briefing.revision },
  ];
  assertTaskProcedureSelection([...input.inherited, ...additions], procedureKey, procedureHash);
  const message = additions.filter(item => item.kind !== 'role-instructions' && item.kind !== 'tool-declaration').map(item => item.text).join('\n\n');
  return { roleInstructions, message, submissionTool: task.tool, declaration, additions,
    manifest: buildDeliveredManifest({ inheritedPoint: input.inheritedPoint, inherited: input.inherited, appended: additions, currentMessage: message, schema: 'ramify-agent.delivered-inputs/2' }) };
}
