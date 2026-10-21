import { join } from 'node:path';
import { z } from 'zod';
import { modulePathSchema, sha256Schema } from '../../../../../../src/interfaces/protocol/evidence.js';
import { recordRefSchema } from '../../../../../task-execution/src/records.js';
import { elementIdSchema } from '../../../../../plan-evidence/src/interfaces/catalog.js';

/* Durable capability coordination records. The original request and every
 * plan revision are immutable; the event log, rather than a mutable status
 * field, determines the task's current state and authority. */

const text = z.string().min(1).refine(value => value.trim().length > 0, 'Must contain non-whitespace text');
const id = z.string().regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/);
const exampleId = z.string().regex(/^(?:need-\d+\.ex\d+|capability-example:[a-z0-9]+(?:-[a-z0-9]+)*)$/);
const requestId = z.string().regex(/^(?:need-\d+|capability-request:[a-z0-9]+(?:-[a-z0-9]+)*)$/);
const taskId = z.string().regex(/^(?:cap-\d+|capability-task:[a-z0-9]+(?:-[a-z0-9]+)*)$/);
const draftRequest = z.string().regex(/^draft:capability-request:[a-z0-9]+(?:-[a-z0-9]+)*$/);
const draftExample = z.string().regex(/^draft:capability-example:[a-z0-9]+(?:-[a-z0-9]+)*$/);
export const draftCapabilityTaskSchema = z.string().regex(/^draft:capability-task:[a-z0-9]+(?:-[a-z0-9]+)*$/);
const positive = z.int().positive();
const treeIdentity = z.string().regex(/^(?:[0-9a-f]{40}|[0-9a-f]{64})$/);
const location = z.string().regex(/^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[^\\\s]+$/);

export const capabilityTaskId = (count: number): string => `cap-${String(count).padStart(3, '0')}`;
export const capabilityRequestId = (count: number): string => `need-${String(count).padStart(3, '0')}`;
export const capabilityExampleId = (request: string, count: number): string => `${request}.ex${String(count).padStart(2, '0')}`;
export const capabilityAssignmentId = (task: string, count: number): string => `${task}.i${String(count).padStart(2, '0')}`;

export const capabilityNeedSchema = z.object({
  need: text,
  usage: z.array(z.discriminatedUnion('prospective', [
    z.object({ path: location, symbol: text.optional(), use: text, prospective: z.literal(false),
      module: modulePathSchema.optional().describe('The caller module, when specified; separate from the suggested provider'),
    }).strict(),
    z.object({ path: location, symbol: text.optional(), use: text, prospective: z.literal(true),
      module: modulePathSchema.describe('Required intended caller module for this prospective project-relative location; not the suggested provider'),
    }).strict(),
  ])).min(1),
  constraints: z.array(text),
  knownInterface: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('none-known') }).strict(),
    z.object({ kind: z.literal('insufficient'), path: location, symbol: text, missing: text }).strict(),
  ]),
  examples: z.array(z.object({ id: exampleId, title: text, code: text, designation: z.enum(['executable', 'pseudocode']) }).strict()).min(1),
  suggestedProvider: z.object({ module: modulePathSchema.describe('The proposed provider, separately from each usage caller module'), reason: text }).strict().optional(),
  revises: z.object({ task: taskId, reason: text }).strict().optional(),
}).strict().superRefine((value, context) => {
  const seen = new Set<string>();
  value.examples.forEach((example, index) => {
    if (seen.has(example.id)) context.addIssue({ code: 'custom', path: ['examples', index, 'id'], message: 'Example IDs are unique' });
    seen.add(example.id);
  });
});
export type CapabilityNeed = z.infer<typeof capabilityNeedSchema>;

/** The module engineer does not choose durable example IDs. The harness assigns
 * them after the request ID is reserved. */
const { examples: _identifiedExamples, ...needInputShape } = capabilityNeedSchema.shape;
export const capabilityNeedInputSchema = z.object({ ...needInputShape,
  examples: z.array(z.object({ title: text, code: text, designation: z.enum(['executable', 'pseudocode']) }).strict()).min(1),
}).strict();
export type CapabilityNeedInput = z.infer<typeof capabilityNeedInputSchema>;
export const descriptiveCapabilityNeedInputSchema = capabilityNeedInputSchema.extend({
  requestKey: draftRequest.describe('Propose draft:capability-request:<behavior-name>; the accepted ID is allocated on acceptance.'),
  examples: z.array(z.object({ key: draftExample.describe('Propose draft:capability-example:<behavior-name> for this example.'),
    title: text, code: text, designation: z.enum(['executable', 'pseudocode']) }).strict()).min(1),
}).strict();
export type DescriptiveCapabilityNeedInput = z.infer<typeof descriptiveCapabilityNeedInputSchema>;
export function identifyCapabilityNeed(request: string, input: CapabilityNeedInput | DescriptiveCapabilityNeedInput): CapabilityNeed {
  return capabilityNeedSchema.parse({
    need: input.need, usage: input.usage, constraints: input.constraints, knownInterface: input.knownInterface,
    ...(input.suggestedProvider === undefined ? {} : { suggestedProvider: input.suggestedProvider }),
    ...(input.revises === undefined ? {} : { revises: input.revises }),
    examples: input.examples.map((example, index) => ({ title: example.title, code: example.code, designation: example.designation,
      id: 'key' in example ? example.key.slice('draft:'.length) : capabilityExampleId(request, index + 1) })),
  });
}

export const provisionalSourceSchema = z.object({
  acceptedBase: text,
  /** Git tree object for the live candidate at suspension. */
  tree: treeIdentity,
  /** Hash of the worktree/index byte manifest, which preserves staging. */
  snapshotHash: sha256Schema,
  snapshot: location,
  delta: z.array(z.object({ path: location, before: sha256Schema.nullable(), after: sha256Schema.nullable(), staged: z.boolean() }).strict()),
  writerSettledBy: text,
}).strict();
export type ProvisionalSource = z.infer<typeof provisionalSourceSchema>;

export const capabilityRequestSchema = z.object({
  schema: z.enum(['ramify-agent.capability-request/1', 'ramify-agent.capability-request/2']),
  id: requestId,
  parent: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('work-item'), id: text }).strict(),
    z.object({ kind: z.literal('capability-task'), id: taskId }).strict(),
  ]),
  assignment: text,
  invocation: text,
  consumer: modulePathSchema,
  requirementPackage: recordRefSchema,
  continuation: z.object({ session: text, point: text.nullable() }).strict(),
  source: provisionalSourceSchema,
  summary: text,
  original: capabilityNeedSchema,
}).strict().superRefine((request, context) => {
  const descriptive = request.schema.endsWith('/2');
  if (descriptive !== request.id.startsWith('capability-request:')) context.addIssue({ code: 'custom', path: ['id'], message: 'request ID disagrees with its contract version' });
  request.original.examples.forEach((example, index) => {
    if (descriptive !== example.id.startsWith('capability-example:')) context.addIssue({ code: 'custom', path: ['original', 'examples', index, 'id'], message: 'example ID disagrees with its contract version' });
  });
});
export type CapabilityRequest = z.infer<typeof capabilityRequestSchema>;

export const capabilityTaskSchema = z.object({
  schema: z.enum(['ramify-agent.capability-task/1', 'ramify-agent.capability-task/2']),
  id: taskId,
  request: requestId,
  parent: capabilityRequestSchema.shape.parent,
  originatingAssignment: text,
  consumer: modulePathSchema,
  provider: modulePathSchema,
  placementReason: text,
  authority: z.array(z.object({ owner: modulePathSchema, reason: text }).strict()).min(1),
  relatedEntries: z.array(z.object({ entry: text, reason: text }).strict()),
  deferredWorkItems: z.array(text),
  source: provisionalSourceSchema,
  /** A later task links an accepted handback without changing its verdict. */
  revises: z.object({ handback: recordRefSchema, sourceRevision: text, reason: text }).strict().optional(),
  limits: z.object({ maxAssignments: positive, maxWorkUnits: positive, maxInvocations: positive }).strict(),
}).strict().superRefine((task, context) => {
  const descriptive = task.schema.endsWith('/2');
  if (descriptive !== task.id.startsWith('capability-task:')) context.addIssue({ code: 'custom', path: ['id'], message: 'task ID disagrees with its contract version' });
  if (descriptive !== task.request.startsWith('capability-request:')) context.addIssue({ code: 'custom', path: ['request'], message: 'request ID disagrees with task contract version' });
});
export type CapabilityTask = z.infer<typeof capabilityTaskSchema>;

/** The editable plan content is shared with the plan-update tool schema. */
export const capabilityPlanContentSchema = z.object({
  need: text,
  proposedInterface: text,
  /** The plan's behavioral cases. An original example keeps its case
   * through every revision as immutable request context; a case carries no
   * coverage state, cited evidence or test list. A case is tracked on its own
   * only when the task's architect registers it as an obligation. */
  useCases: z.array(z.object({ id: z.union([exampleId, id]), expectedBehavior: text, derivedFrom: z.array(exampleId).min(1) }).strict()),
  compatibility: z.array(text),
  outline: z.array(text),
  decisions: z.array(z.object({ decision: text, reason: text, evidence: z.array(text) }).strict()),
  openQuestions: z.array(text),
  requirementRefs: z.array(elementIdSchema),
}).strict();

export const capabilityPlanSchema = z.object({
  schema: z.enum(['ramify-agent.capability-plan/1', 'ramify-agent.capability-plan/2']),
  task: taskId,
  revision: positive,
  basedOn: z.int().nonnegative(),
  updatedBy: text,
  revisionReason: text,
  ...capabilityPlanContentSchema.shape,
  /** Original example IDs cannot disappear. Additional cases may be derived. */
  originalExamples: z.array(exampleId).min(1),
}).strict().superRefine((plan, context) => {
  if (plan.schema.endsWith('/2') !== plan.task.startsWith('capability-task:')) context.addIssue({ code: 'custom', path: ['task'], message: 'task ID disagrees with plan contract version' });
  plan.originalExamples.forEach((example, index) => {
    if (plan.schema.endsWith('/2') !== example.startsWith('capability-example:')) context.addIssue({ code: 'custom', path: ['originalExamples', index], message: 'example ID disagrees with plan contract version' });
  });
  if (plan.basedOn !== plan.revision - 1) context.addIssue({ code: 'custom', path: ['basedOn'], message: 'A revision follows its immediate predecessor' });
  const cases = new Set(plan.useCases.map(item => item.id));
  for (const example of plan.originalExamples) {
    if (!cases.has(example)) context.addIssue({ code: 'custom', path: ['useCases'], message: `Original example ${example} requires a case` });
  }
  for (const [index, item] of plan.useCases.entries()) {
    if (!item.derivedFrom.every(example => plan.originalExamples.includes(example))) {
      context.addIssue({ code: 'custom', path: ['useCases', index, 'derivedFrom'], message: 'A case derives from original examples' });
    }
  }
});
export type CapabilityPlan = z.infer<typeof capabilityPlanSchema>;

export const capabilityExchangeSchema = z.object({
  schema: z.enum(['ramify-agent.capability-exchange/1', 'ramify-agent.capability-exchange/2']),
  id,
  task: taskId,
  request: text,
  planRevision: positive,
  question: text,
  references: z.array(text),
  answer: z.object({ invocation: text, text, objections: z.array(text) }).strict().nullable(),
}).strict();
export type CapabilityExchange = z.infer<typeof capabilityExchangeSchema>;

export const capabilityHandbackSchema = z.object({
  schema: z.enum(['ramify-agent.capability-handback/1', 'ramify-agent.capability-handback/2']),
  task: taskId,
  request: requestId,
  plan: recordRefSchema,
  sourceRevision: text,
  returnedTree: treeIdentity,
  deltaFromSuspension: z.array(location),
  summary: text,
  interfaces: z.array(z.object({ path: location, symbols: z.array(text).min(1), use: text }).strict()).min(1),
  compatibility: z.array(text),
  checks: z.array(recordRefSchema).min(1),
  reviews: z.array(recordRefSchema),
  limitations: z.array(text),
}).strict().superRefine((handback, context) => {
  const descriptive = handback.schema.endsWith('/2');
  if (descriptive !== handback.task.startsWith('capability-task:')) context.addIssue({ code: 'custom', path: ['task'], message: 'task ID disagrees with handback contract version' });
  if (descriptive !== handback.request.startsWith('capability-request:')) context.addIssue({ code: 'custom', path: ['request'], message: 'request ID disagrees with handback contract version' });
});
export type CapabilityHandback = z.infer<typeof capabilityHandbackSchema>;

export const capabilityLayout = {
  /** A request may be satisfied by existing behavior before a task exists. */
  request: (request: string): string => join('capabilities', 'requests', `${encodeURIComponent(request)}.json`),
  task: (task: string): string => join('capabilities', encodeURIComponent(task), 'task.json'),
  plan: (task: string, revision: number): string => join('capabilities', encodeURIComponent(task), 'plan', `${revision}.json`),
  exchange: (task: string, exchange: string, revision: number): string => join('capabilities', encodeURIComponent(task), 'exchanges', `${encodeURIComponent(exchange)}.${revision}.json`),
  handback: (task: string): string => join('capabilities', encodeURIComponent(task), 'handback.json'),
} as const;

export const capabilitySchemas = {
  request: { schema: 'ramify-agent.capability-request/1', body: capabilityRequestSchema },
  task: { schema: 'ramify-agent.capability-task/1', body: capabilityTaskSchema },
  plan: { schema: 'ramify-agent.capability-plan/1', body: capabilityPlanSchema },
  exchange: { schema: 'ramify-agent.capability-exchange/1', body: capabilityExchangeSchema },
  handback: { schema: 'ramify-agent.capability-handback/1', body: capabilityHandbackSchema },
} as const;
