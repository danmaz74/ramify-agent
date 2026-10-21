import { join } from 'node:path';
import { z } from 'zod';
import { scenarioIdSchema } from '../../../../../scenarios/src/records.js';
import { elementIdSchema, type PackageDeviation } from '../../../../../plan-evidence/src/interfaces/catalog.js';
import { globalForkSourceSchema } from '../../../../../task-execution/src/records.js';

/*
 * Plan deviations. A module architect that finds its request cannot be met
 * as stated answers `unresolved`; the harness records that as an unresolved
 * request and forks the plan architect with it. The fork fixes the
 * placement, records a plan deviation, or finds that nothing of the plan
 * remains worth doing.
 *
 * A plan deviation is the plan architect's decision that the run does
 * something other than an element of its catalog states: the elements it
 * amends, by ID, what is done instead, why, the alternatives it rejected and
 * what the person loses. The plan file and the catalog are never changed;
 * the deviation is a durable record beside them, which binds the rest of the
 * run and is rendered after the elements it amends.
 * Its CheckFinding asks the person to accept or reject it and holds nothing.
 *
 * An environment problem is the plan architect's answer that the conflict
 * lies in how the gate or the harness runs, not in the plan or the
 * architecture. Nothing is placed and nothing of the plan changes: the run
 * holds the work item for the operator, who resumes it or ends the run.
 */

const text = z.string().min(1);

/** `ur-003`, the count of committed unresolved requests. */
export const unresolvedRequestId = (count: number): string => `ur-${String(count).padStart(3, '0')}`;
/** A request derived from its accepted work item; repeated conflicts retain separate names. */
export const descriptiveUnresolvedRequestId = (workItem: string, count: number): string =>
  `unresolved-request:${workItem.replace(/^work-item:/, '')}-architect-conflict${count === 1 ? '' : `-${count}`}`;

/** `pd-003`, the count of committed plan deviations. */
export const planDeviationId = (count: number): string => `pd-${String(count).padStart(3, '0')}`;

/** `ep-003`, the count of committed environment problems. */
export const environmentProblemId = (count: number): string => `ep-${String(count).padStart(3, '0')}`;
/** The environment answer to one accepted unresolved request. */
export const descriptiveEnvironmentProblemId = (request: string): string =>
  `environment-problem:${request.replace(/^unresolved-request:/, '')}`;

/** The most characters of an environment problem's diagnosis and suggestion. */
export const environmentLimits = { diagnosis: 2000, suggestion: 1000 } as const;

/** The plan deviations a run records before the next one waits for the person, unless its policy says otherwise. */
export const defaultMaxPlanDeviations = 5;

/**
 * What the plan architect submits as a plan deviation. It names the
 * elements of the work item's package it amends; the harness records their
 * text. A deviation keeps as much of each element as the conflict allows.
 */
export const deviationBodySchema = z.object({
  /** The requirements and recommendations this deviation departs from, by element ID; never context. */
  amends: z.array(elementIdSchema).min(1).max(20),
  /** What the run does instead: the part of each requirement it keeps, and the replacement for the part it cannot. */
  instead: text,
  /** Why the requirement cannot be met as written. */
  why: text,
  /** Each alternative considered and why it was rejected. */
  rejected: z.array(z.object({ alternative: text, reason: text }).strict()).min(1),
  /** What the person loses, compared with the plan as written. */
  loss: text,
  /** The work items whose work the deviation changes, besides the one that asked. */
  workItems: z.array(text),
  /**
   * The pending scenarios this deviation rewords: each one's new `Scenario`
   * block, without tags, as the feature file will carry it. The harness
   * renders the tracked feature file from it.
   */
  scenarios: z.array(z.object({ scenario: scenarioIdSchema, source: z.array(z.string()).min(1) }).strict()).default([]),
}).strict();
export type DeviationBody = z.infer<typeof deviationBodySchema> | z.infer<typeof descriptiveDeviationBodySchema>;
export const descriptiveDeviationBodySchema = deviationBodySchema.extend({
  deviationKey: z.string().regex(/^draft:plan-deviation:[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/),
  findingKey: z.string().regex(/^draft:finding:[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/),
}).strict();

/** A module architect's `unresolved` answer, as the harness records it before forking the plan architect. */
const unresolvedRequestFields = {
  id: text,
  workItem: text,
  requester: text,
  /** The module architect's invocation that answered `unresolved`. */
  invocation: text,
  conflict: text,
  evidence: z.array(text),
  /** The oriented global point at request time, including accepted brief identities. */
  globalSource: globalForkSourceSchema.optional(),
};
export const unresolvedRequestSchema = z.discriminatedUnion('schema', [
  z.object({ schema: z.literal('ramify-agent.unresolved-request/1'), ...unresolvedRequestFields }).strict(),
  z.object({ schema: z.literal('ramify-agent.unresolved-request/2'), ...unresolvedRequestFields,
    id: z.string().regex(/^unresolved-request:[a-z0-9]+(?:-[a-z0-9]+)*$/),
  }).strict(),
]);
export type UnresolvedRequest = z.infer<typeof unresolvedRequestSchema>;

/** One element a deviation amends, with its source path and its text as the frozen catalog holds it. */
export const amendedElementSchema = z.object({ id: elementIdSchema, path: text, text }).strict();
export type AmendedElement = z.infer<typeof amendedElementSchema>;

/** A pending scenario a deviation rewords: its source before and after, and its feature file. */
export const rewordedScenarioSchema = z.object({
  scenario: scenarioIdSchema,
  file: text,
  before: z.array(z.string()),
  after: z.array(z.string()).min(1),
}).strict();
export type RewordedScenario = z.infer<typeof rewordedScenarioSchema>;

const planDeviationFields = {
  id: text,
  /** The unresolved request it answers. */
  request: text,
  /** The work item whose module architect answered `unresolved`. */
  workItem: text,
  /** The plan architect's fork that decided it. */
  invocation: text,
  /** The plan it departs from, which stays exactly as written. */
  plan: z.object({ path: text, revision: text }).strict(),
  amends: z.array(amendedElementSchema).min(1),
  instead: text,
  why: text,
  rejected: z.array(z.object({ alternative: text, reason: text }).strict()).min(1),
  loss: text,
  /** Every work item it changes, the asking one first. */
  workItems: z.array(text).min(1),
  /** Their modules, which the CheckFinding concerns. */
  modules: z.array(text),
  scenarios: z.array(rewordedScenarioSchema),
  /** The CheckFinding that asks the person to accept or reject it. */
  checkFinding: text,
  /**
   * Whether the run waits for the person's decision before going on: the
   * run recorded more deviations than its policy lets it continue past.
   */
  held: z.boolean(),
};
export const planDeviationSchema = z.discriminatedUnion('schema', [
  z.object({ schema: z.literal('ramify-agent.plan-deviation/1'), ...planDeviationFields }).strict(),
  z.object({ schema: z.literal('ramify-agent.plan-deviation/2'), ...planDeviationFields,
    id: z.string().regex(/^plan-deviation:[a-z0-9]+(?:-[a-z0-9]+)*$/),
  }).strict(),
]);
export type PlanDeviation = z.infer<typeof planDeviationSchema>;

/**
 * What the plan architect submits as an environment problem: what is
 * wrong with how the gate or the harness runs, with its evidence, and what
 * the operator could do about it. Both are bounded.
 */
export const environmentBodySchema = z.object({
  /** What is wrong, with evidence: the failing command and the missing prerequisite. */
  diagnosis: text.max(environmentLimits.diagnosis),
  /** What the operator could change, such as a build step declared in `ramify-agent.json`. */
  suggestion: text.max(environmentLimits.suggestion),
}).strict();
export const descriptiveEnvironmentBodySchema = environmentBodySchema.extend({
  problemKey: z.string().regex(/^draft:environment-problem:[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/).describe('A local key such as draft:environment-problem:missing-provider-tool; accepted environment-problem:missing-provider-tool is invalid here.'),
  findingKey: z.string().regex(/^draft:finding:[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/),
}).strict();
export type EnvironmentBody = z.infer<typeof environmentBodySchema> | z.infer<typeof descriptiveEnvironmentBodySchema>;

/**
 * An environment problem as the run records it. The run holds its work item
 * until the operator answers its CheckFinding: resuming returns the work
 * item to its module architect with the diagnosis; ending fails the run.
 */
const environmentProblemFields = {
  id: text,
  /** The unresolved request it answers. */
  request: text,
  /** The work item whose module architect answered `unresolved`, which the run holds. */
  workItem: text,
  /** The plan architect's fork that reported it. */
  invocation: text,
  diagnosis: text,
  suggestion: text,
  /** The CheckFinding that asks the operator to resume the run or end it. */
  checkFinding: text,
};
export const environmentProblemSchema = z.discriminatedUnion('schema', [
  z.object({ schema: z.literal('ramify-agent.environment-problem/1'), ...environmentProblemFields }).strict(),
  z.object({ schema: z.literal('ramify-agent.environment-problem/2'), ...environmentProblemFields,
    id: z.string().regex(/^environment-problem:[a-z0-9]+(?:-[a-z0-9]+)*$/),
    findingKey: z.string().regex(/^draft:finding:[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/),
  }).strict(),
]);
export type EnvironmentProblem = z.infer<typeof environmentProblemSchema>;

/** Where the records are materialized, relative to the run's directory. */
export const deviationLayout = {
  request: (id: string): string => join('requests', `${encodeURIComponent(id).replace(/:/g, '%3A')}.json`),
  deviation: (id: string): string => join('deviations', `${encodeURIComponent(id).replace(/:/g, '%3A')}.json`),
  environment: (id: string): string => join('environment', `${encodeURIComponent(id).replace(/:/g, '%3A')}.json`),
} as const;

export const deviationSchemas = {
  unresolvedRequest: { schema: 'ramify-agent.unresolved-request/1', body: unresolvedRequestSchema },
  planDeviation: { schema: 'ramify-agent.plan-deviation/1', body: planDeviationSchema },
  environmentProblem: { schema: 'ramify-agent.environment-problem/1', body: environmentProblemSchema },
} as const;

/**
 * A deviation as a package renders it, after the elements: the elements it
 * amends, the plan architect's authority, and what the run does instead,
 * why, what is lost and any reworded scenario. Its bytes depend on the
 * record alone.
 */
export function packageDeviation(deviation: PlanDeviation): PackageDeviation {
  const lines = [`What the run does instead: ${deviation.instead}`, '', `Why: ${deviation.why}`, '', `What is lost: ${deviation.loss}`];
  for (const scenario of deviation.scenarios) {
    lines.push('', `Scenario ${scenario.scenario} is reworded in \`${scenario.file}\`. It now reads:`, '', '```gherkin', ...scenario.after, '```');
  }
  return {
    id: deviation.id,
    amends: deviation.amends.map(element => element.id),
    authority: `Recorded by the plan architect for ${deviation.workItem}, answering ${deviation.request}. The plan file and the catalog are unchanged.`,
    text: lines.join('\n'),
  };
}
