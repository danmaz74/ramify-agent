import { createHash } from 'node:crypto';
import { z } from 'zod';
import { scenarioElementRefSchema, type AcceptedScenarioForm } from './form.js';
import { descriptiveSlug, type ScenarioIdentityContract } from './extraction.js';

/*
 * The scenario record, `ramify-agent.scenario/1`, and the numbering that
 * turns an accepted form into records: entry scenarios `sc-001`, … in
 * submission order, then the integration scenarios. An entry scenario's
 * owner is its entry's; an integration scenario's is the lowest common
 * ancestor of its sub-scenarios' owners. A record is immutable once written,
 * except that a placement revision revises its `file`.
 */

export const scenarioIdSchema = z.string().regex(/^(?:sc-\d{3,}|scenario:[a-z0-9]+(?:-[a-z0-9]+)*)$/, 'A scenario ID, such as "scenario:reject-missing-predecessor"');
export type ScenarioId = z.infer<typeof scenarioIdSchema>;

const lineRangeSchema = z.tuple([z.int().positive(), z.int().positive()]);

export const scenarioRecordSchema = z.object({
  schema: z.enum(['ramify-agent.scenario/1', 'ramify-agent.scenario/2']),
  id: scenarioIdSchema,
  kind: z.enum(['entry', 'integration']),
  /** The entry capability; `null` for an integration scenario. */
  entry: z.string().min(1).nullable(),
  /** A module's declared-name path. */
  owner: z.string().min(1),
  origin: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('plan'), planScenario: z.string().regex(/^(?:ps-\d{2,}|plan-scenario:[a-z0-9]+(?:-[a-z0-9]+)*)$/), ref: z.object({ document: z.string().regex(/^(?:doc-\d{3,}|document:[a-z0-9]+(?:-[a-z0-9]+)*)$/).optional(), lines: lineRangeSchema }).strict() }).strict(),
    z.object({ kind: z.literal('architect'), refs: z.array(scenarioElementRefSchema) }).strict(),
  ]),
  /** Accepted catalog citations; absent on historical records. */
  citedElements: z.array(scenarioElementRefSchema).optional(),
  /** The integration scenario this one is a sub-scenario of. */
  partOf: scenarioIdSchema.nullable(),
  /** An integration scenario's sub-scenarios; empty for an entry scenario. */
  subScenarios: z.array(scenarioIdSchema),
  name: z.string(),
  /** The `Scenario` block without tags, dedented, as the feature file carries it. */
  source: z.array(z.string()),
  /** `sha256:` and the digest of the source lines joined with newlines. */
  hash: z.string().regex(/^sha256:[0-9a-f]{64}$/),
  /** The project-relative path of the feature file that carries it. */
  file: z.string().min(1),
}).strict().superRefine((record, ctx) => {
  const descriptive = record.schema.endsWith('/2');
  if (descriptive !== record.id.startsWith('scenario:'))
    ctx.addIssue({ code: 'custom', path: ['id'], message: 'scenario ID disagrees with record contract' });
  if (record.origin.kind === 'plan' && descriptive !== record.origin.planScenario.startsWith('plan-scenario:'))
    ctx.addIssue({ code: 'custom', path: ['origin', 'planScenario'], message: 'plan origin disagrees with record contract' });
});
export type ScenarioRecord = z.infer<typeof scenarioRecordSchema>;

/** Where a module keeps its tests: its directory, and whether its header classifies it as testing. */
export interface ScenarioModule {
  /** The declared-name path, such as `app/orders`. */
  readonly module: string;
  /** The project-relative directory; `''` for the root module. */
  readonly dir: string;
  /** A testing module's test area is its `src/`, not its `src/tests/`. */
  readonly testing: boolean;
}

/** What numbering reads beyond the accepted form. */
export interface ScenarioIdContext {
  readonly planId: string;
  /** Each entry's capability and owner. */
  readonly entries: readonly { readonly capability: string; readonly owner: string }[];
  /** Every module an owner or a common ancestor can be, proposed ones included. */
  readonly modules: readonly ScenarioModule[];
  readonly identityContract?: ScenarioIdentityContract;
}

export interface AssignedScenarios {
  /** Entry scenarios, then integration scenarios. */
  readonly records: readonly ScenarioRecord[];
  /** The ID each submitted key received. */
  readonly idsByKey: ReadonlyMap<string, ScenarioId>;
  /** The ID each integration scenario received, by its plan scenario. */
  readonly idsByPlanScenario: ReadonlyMap<string, ScenarioId>;
}

/** The `sha256:` hash of source lines. */
export function scenarioSourceHash(source: readonly string[]): string {
  return `sha256:${createHash('sha256').update(source.join('\n')).digest('hex')}`;
}

/** `sc-001`, `sc-002`, … for the 1-based position. */
export function scenarioIdOf(position: number): ScenarioId {
  return `sc-${String(position).padStart(3, '0')}`;
}

/** The lowest common ancestor of modules named by their declared-name paths. */
export function lowestCommonAncestor(modules: readonly string[]): string {
  if (modules.length === 0) throw new Error('The lowest common ancestor of no module is undefined');
  const paths = modules.map((module) => module.split('/'));
  const common: string[] = [];
  for (let index = 0; paths.every((path) => index < path.length && path[index] === paths[0]![index]); index += 1) {
    common.push(paths[0]![index]!);
  }
  if (common.length === 0) throw new Error(`The modules ${modules.join(', ')} share no root`);
  return common.join('/');
}

/** The directory a module's plan feature files go in: `<dir>/src/tests/features/<planId>`, or `<dir>/src/features/<planId>` for a testing module. */
export function featureDirectoryOf(module: ScenarioModule, planId: string): string {
  const area = module.testing ? 'src/features' : 'src/tests/features';
  return `${module.dir === '' ? '' : `${module.dir}/`}${area}/${planId}`;
}

/**
 * Numbers the scenarios of an accepted form and builds their records. Every
 * owner and ancestor must be among `context.modules`; a missing one is a
 * caller's error and throws.
 */
export function assignScenarioIds(form: AcceptedScenarioForm, context: ScenarioIdContext): AssignedScenarios {
  const owners = new Map(context.entries.map((entry) => [entry.capability, entry.owner]));
  const modules = new Map(context.modules.map((module) => [module.module, module]));
  const moduleOf = (name: string): ScenarioModule => {
    const module = modules.get(name);
    if (!module) throw new Error(`No module "${name}" was given to place scenarios in`);
    return module;
  };
  const ownerOf = (entry: string): string => {
    const owner = owners.get(entry);
    if (owner === undefined) throw new Error(`No entry "${entry}" was given to own scenarios`);
    return owner;
  };

  const descriptive = context.identityContract === 'descriptive';
  const preferred = [
    ...form.scenarios.map(scenario => scenario.key.startsWith('draft:scenario:') ? scenario.key.slice('draft:scenario:'.length) : descriptiveSlug(scenario.name)),
    ...form.integrations.map(integration => descriptiveSlug(integration.name)),
  ];
  const counts = new Map<string, number>();
  preferred.forEach(name => counts.set(name, (counts.get(name) ?? 0) + 1));
  const descriptiveId = (name: string, source: string): ScenarioId => `scenario:${name}${counts.get(name)! > 1 ? `-${createHash('sha256').update(source).digest('hex').slice(0, 8)}` : ''}`;
  const idsByKey = new Map<string, ScenarioId>();
  form.scenarios.forEach((scenario, index) => idsByKey.set(scenario.key, descriptive ? descriptiveId(preferred[index]!, `${scenario.origin.kind}:${scenario.key}:${scenario.source.join('\n')}`) : scenarioIdOf(index + 1)));
  const idsByPlanScenario = new Map<string, ScenarioId>();
  form.integrations.forEach((integration, index) => idsByPlanScenario.set(integration.planScenario, descriptive ? descriptiveId(preferred[form.scenarios.length + index]!, `${integration.planScenario}:${integration.source.join('\n')}`) : scenarioIdOf(form.scenarios.length + index + 1)));

  const entryRecords = form.scenarios.map((scenario): ScenarioRecord => {
    const owner = ownerOf(scenario.entry);
    return {
      schema: descriptive ? 'ramify-agent.scenario/2' : 'ramify-agent.scenario/1',
      id: idsByKey.get(scenario.key)!,
      kind: 'entry',
      entry: scenario.entry,
      owner,
      origin: scenario.origin.kind === 'plan'
        ? { kind: 'plan', planScenario: scenario.origin.planScenario, ref: { ...(scenario.origin.document === undefined ? {} : { document: scenario.origin.document }), lines: [scenario.origin.lines[0], scenario.origin.lines[1]] } }
        : { kind: 'architect', refs: [...scenario.origin.refs] },
      partOf: scenario.partOf === null ? null : idsByPlanScenario.get(scenario.partOf)!,
      subScenarios: [],
      name: scenario.name,
      source: [...scenario.source],
      hash: scenarioSourceHash(scenario.source),
      file: `${featureDirectoryOf(moduleOf(owner), context.planId)}/${descriptive ? encodeURIComponent(scenario.entry) : scenario.entry}.feature`,
    };
  });

  const byKey = new Map(form.scenarios.map((scenario) => [scenario.key, scenario]));
  const integrationRecords = form.integrations.map((integration): ScenarioRecord => {
    const owner = lowestCommonAncestor(integration.subScenarios.map((key) => ownerOf(byKey.get(key)!.entry)));
    return {
      schema: descriptive ? 'ramify-agent.scenario/2' : 'ramify-agent.scenario/1',
      id: idsByPlanScenario.get(integration.planScenario)!,
      kind: 'integration',
      entry: null,
      owner,
      origin: { kind: 'plan', planScenario: integration.planScenario, ref: { ...(integration.document === undefined ? {} : { document: integration.document }), lines: [integration.lines[0], integration.lines[1]] } },
      partOf: null,
      subScenarios: integration.subScenarios.map((key) => idsByKey.get(key)!),
      name: integration.name,
      source: [...integration.source],
      hash: scenarioSourceHash(integration.source),
      file: `${featureDirectoryOf(moduleOf(owner), context.planId)}/integration.feature`,
    };
  });

  return { records: [...entryRecords, ...integrationRecords], idsByKey, idsByPlanScenario };
}
