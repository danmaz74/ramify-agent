import type { CoordinationHistory } from '../work/history.js';
import type { z } from 'zod';
import { type RunEvent, type RunEventInput } from '../../../../src/run/log.js';
import { committedRecords } from '../../../../src/run/committed-records.js';
import { recordHash } from '../../../../../../src/jobs/committed-reader.js';
import type { RecordBody } from '../../../../../ledger/src/ledger.js';
import { capabilityExchangeSchema, capabilityHandbackSchema, capabilityLayout, capabilityPlanSchema, capabilityRequestSchema, capabilityTaskSchema } from './records.js';
import { executionRetirementPath, executionRetirementSchema } from '../contracts/records.js';
import { capabilityCompletionBlockers, capabilityDependencyCycle, capabilityHandbackReadiness, isCapabilityEvent, replayCapabilityState, transitionCapabilityState } from './state.js';

export type CapabilityInput = Extract<RunEventInput, { type: `capability-${string}` }>;
type RecordSpecification = { readonly path: string; readonly schema: z.ZodType; readonly id: string; readonly revision: number };

/** A name lost at serialized publication; its author may correct the draft field in the same task. */
export class CapabilityNameConflictError extends Error {
  constructor(readonly family: 'request' | 'example' | 'task', readonly id: string, message: string) {
    super(message);
    this.name = 'CapabilityNameConflictError';
  }
}

/** The one real-ledger write path for capability records. Validate the event
 * against replayed authority and the exact bodies it promises before append.
 * The ledger then commits event and immutable bodies in one transaction. */
export function validateCapabilityTransition(
  history: CoordinationHistory, event: RunEvent, records: readonly RecordBody[],
): void {
  if (!isCapabilityEvent(event)) throw new Error(`${event.type} is not a capability event`);
  const committed = committedRecords(history.lines);
  if (event.type === 'capability-requested' && committed.capabilityRequests.has(event.data.request))
    throw new CapabilityNameConflictError('request', event.data.request,
      `Capability request ID ${event.data.request} collides with an accepted identity`);
  if (event.type === 'capability-delegated' && committed.capabilityTasks.has(event.data.task))
    throw new CapabilityNameConflictError('task', event.data.task,
      `Capability task ID ${event.data.task} collides with an accepted identity`);
  const prior = replayCapabilityState(history.events);
  transitionCapabilityState(prior, event);
  const expected = specifications(event);
  if (records.length !== expected.length) throw new Error(`${event.type} requires ${expected.length} record bodies`);
  for (let index = 0; index < expected.length; index += 1) {
    const spec = expected[index]!;
    const actual = records[index]!;
    if (actual.path !== spec.path || actual.id !== spec.id || actual.revision !== spec.revision) {
      throw new Error(`${event.type} record ${index + 1} must be ${spec.path} at revision ${spec.revision}`);
    }
    const parsed = spec.schema.safeParse(actual.body);
    if (!parsed.success) throw new Error(`${actual.path}: ${parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ')}`);
  }
  if (event.type === 'capability-requested') {
    const request = capabilityRequestSchema.parse(records[0]!.body);
    if (request.id !== event.data.request || request.parent.id !== event.data.parent ||
      request.assignment !== event.data.assignment || request.invocation !== event.data.invocation) {
      throw new Error('Request must retain its harness IDs, parent and stable example order');
    }
    {
      const ids = request.original.examples.map(example => example.id);
      if ((request.original.revises === undefined) !== (event.data.retiredRequest === undefined))
        throw new Error('Request correction must retire its accepted prior request');
      if (new Set(ids).size !== ids.length) throw new Error('Capability example IDs repeat within one request');
      if (committed.capabilityRequests.has(request.id)) throw new CapabilityNameConflictError('request', request.id,
        `Capability request ID ${request.id} collides with an accepted identity`);
      const occupiedExample = [...committed.capabilityRequests.values()].flatMap(existing => existing.original.examples)
        .find(example => ids.includes(example.id));
      if (occupiedExample !== undefined) throw new CapabilityNameConflictError('example', occupiedExample.id,
        `Capability request or example ID collides with an accepted identity: ${occupiedExample.id}`);
      if (event.data.retiredRequest !== undefined) {
        const retirement = executionRetirementSchema.parse(records[1]!.body);
        const old = committed.capabilityRequests.get(event.data.retiredRequest);
        const oldTask = request.original.revises === undefined ? undefined : committed.capabilityTasks.get(request.original.revises.task);
        if (!old || !oldTask || !committed.capabilityHandbacks.has(oldTask.id) || oldTask.request !== old.id || oldTask.parent.kind !== request.parent.kind
          || oldTask.parent.id !== request.parent.id || committed.retirements.has(old.id)
          || retirement.id !== old.id || retirement.kind !== 'capability-request' || retirement.replacements.length !== 1
          || retirement.replacements[0] !== request.id || retirement.authority.iteration !== request.assignment)
          throw new Error('Request correction must retire its own accepted prior request for this new request');
      }
    }
    if (request.parent.kind === 'capability-task' && request.original.revises !== undefined) {
      const cycle = capabilityDependencyCycle(prior, request.parent.id, request.original.revises.task);
      if (cycle !== null) throw new Error(`Exact capability dependency cycle: ${cycle.join(' -> ')}`);
    }
  }
  if (event.type === 'capability-delegated') {
    const task = capabilityTaskSchema.parse(records[0]!.body);
    const plan = capabilityPlanSchema.parse(records[1]!.body);
    const request = committed.capabilityRequests.get(event.data.request);
    if (!request || task.id !== event.data.task || task.request !== request.id || plan.task !== task.id ||
      task.parent.id !== request.parent.id || task.parent.kind !== request.parent.kind || task.originatingAssignment !== request.assignment ||
      task.source.tree !== request.source.tree || plan.originalExamples.join('\0') !== request.original.examples.map(example => example.id).join('\0')) {
      throw new Error('Delegation must retain its original request, parent, source and examples');
    }
    const revises = request.original.revises;
    if ((revises === undefined) !== (event.data.retiredTask === undefined))
      throw new Error('Task correction must retire its accepted prior task');
    const earlier = revises === undefined ? undefined : committed.capabilityHandbacks.get(revises.task);
    if ((revises === undefined) !== (task.revises === undefined) ||
      (revises !== undefined && (earlier === undefined || task.revises?.handback.id !== revises.task ||
        task.revises.handback.hash !== recordHash(earlier) || task.revises.sourceRevision !== earlier.sourceRevision ||
        task.revises.reason !== revises.reason))) {
      throw new Error('Revision task must link its immutable accepted handback and source');
    }
    if (event.data.retiredTask !== undefined) {
      const retirement = executionRetirementSchema.parse(records[2]!.body);
      const oldTask = committed.capabilityTasks.get(event.data.retiredTask);
      if (revises?.task !== event.data.retiredTask || !oldTask || oldTask.parent.kind !== task.parent.kind
        || oldTask.parent.id !== task.parent.id || committed.retirements.has(retirement.id)
        || retirement.id !== revises.task || retirement.kind !== 'capability-task'
        || retirement.replacements.length !== 1 || retirement.replacements[0] !== task.id
        || retirement.authority.iteration !== task.originatingAssignment)
        throw new Error('Task correction must retire its accepted prior task for this new task');
    }
  }
  if (event.type === 'capability-plan-revised') {
    const plan = capabilityPlanSchema.parse(records[0]!.body);
    const previous = committed.capabilityPlans.get(plan.task)?.at(-1);
    if (!previous || plan.revision !== event.data.revision || plan.basedOn !== previous.revision ||
      plan.originalExamples.join('\0') !== previous.originalExamples.join('\0') ||
      previous.useCases.some(old => !plan.useCases.some(next => next.id === old.id))) {
      throw new Error('Plan revision is stale or drops an original example or existing case');
    }
  }
  if (event.type === 'capability-exchange-opened' || event.type === 'capability-exchange-answered') {
    const exchange = capabilityExchangeSchema.parse(records[0]!.body);
    const priorExchange = committed.capabilityExchanges.get(exchange.id)?.at(-1);
    if (exchange.id !== event.data.exchange || exchange.task !== event.data.task ||
      (event.type === 'capability-exchange-opened' && (exchange.answer !== null || priorExchange !== undefined)) ||
      (event.type === 'capability-exchange-answered' && (!priorExchange || exchange.answer === null ||
        exchange.question !== priorExchange.question || exchange.request !== priorExchange.request))) {
      throw new Error('Exchange answer must preserve its recorded question and task');
    }
  }
  if (event.type === 'capability-handed-back') {
    const handback = capabilityHandbackSchema.parse(records[0]!.body);
    const task = committed.capabilityTasks.get(handback.task);
    const request = committed.capabilityRequests.get(handback.request);
    const plan = committed.capabilityPlans.get(handback.task)?.at(-1);
    const state = prior.tasks.get(handback.task);
    const completedAssignments = new Set([...state?.assignments ?? []].filter(([, outcome]) => outcome === 'accepted').map(([id]) => id));
    if (!task || !request || !plan || !state || capabilityCompletionBlockers(prior, handback.task, completedAssignments).length > 0 ||
      handback.plan.revision !== plan.revision || handback.plan.hash !== recordHash(plan) ||
      handback.task !== event.data.task || handback.sourceRevision === '' ||
      capabilityHandbackReadiness(task, request, plan, state).length > 0) {
      throw new Error('Handback lacks current resolved structural evidence');
    }
  }

}

function specifications(event: Extract<RunEvent, { type: `capability-${string}` }>): readonly RecordSpecification[] {
  switch (event.type) {
    case 'capability-requested': return [
      { path: capabilityLayout.request(event.data.request), schema: capabilityRequestSchema, id: event.data.request, revision: 1 },
      ...(event.data.retiredRequest === undefined ? [] : [{ path: executionRetirementPath(event.data.retiredRequest),
        schema: executionRetirementSchema, id: event.data.retiredRequest, revision: 1 }]),
    ];
    case 'capability-delegated': return [
      { path: capabilityLayout.task(event.data.task), schema: capabilityTaskSchema, id: event.data.task, revision: 1 },
      { path: capabilityLayout.plan(event.data.task, 1), schema: capabilityPlanSchema, id: event.data.task, revision: 1 },
      ...(event.data.retiredTask === undefined ? [] : [{ path: executionRetirementPath(event.data.retiredTask),
        schema: executionRetirementSchema, id: event.data.retiredTask, revision: 1 }]),
    ];
    case 'capability-plan-revised': return [{ path: capabilityLayout.plan(event.data.task, event.data.revision), schema: capabilityPlanSchema, id: event.data.task, revision: event.data.revision }];
    case 'capability-exchange-opened': return [{ path: capabilityLayout.exchange(event.data.task, event.data.exchange, 1), schema: capabilityExchangeSchema, id: event.data.exchange, revision: 1 }];
    case 'capability-exchange-answered': return [{ path: capabilityLayout.exchange(event.data.task, event.data.exchange, 2), schema: capabilityExchangeSchema, id: event.data.exchange, revision: 2 }];
    case 'capability-handed-back': return [{ path: capabilityLayout.handback(event.data.task), schema: capabilityHandbackSchema, id: event.data.task, revision: 1 }];
    default: return [];
  }
}
