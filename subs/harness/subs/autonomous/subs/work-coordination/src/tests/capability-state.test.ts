import { defaultRunPolicy } from '../../../../../../src/run/policy.js';
import { describe, expect, it } from 'vitest';
import { runEvent, type RunEventInput } from '../../../../src/run/log.js';
import {
  canAssignCapabilityTask, capabilityHandbackReadiness, isCapabilityEvent, replayCapabilityState,
  transitionCapabilityState, type CapabilityEvent,
} from '../capability/state.js';
import { fixturePlan, fixtureRequest, fixtureTask } from './helpers/capability.js';
import { canStartInvocation, capabilityPolicyFrom, captureCapabilityLimits } from '../capability/policy.js';
import type { RunPolicy } from '../../../../src/run/records.js';

const event = (sequence: number, input: RunEventInput): CapabilityEvent => {
  const built = runEvent('job-001', sequence, input, new Date('2026-09-28T00:00:00.000Z'));
  if (!isCapabilityEvent(built)) throw new Error('Expected capability event');
  return built;
};

const begin = (): CapabilityEvent[] => [
  event(1, { type: 'capability-requested', data: { request: 'capability-request:format-fact', parent: 'work-item:format-fact', assignment: 'work-item:format-fact.i01', invocation: 'inv-0001' } }),
  event(2, { type: 'capability-delegated', data: { task: 'capability-task:provide-fact', request: 'capability-request:format-fact', parent: 'work-item:format-fact', invocation: 'inv-0002', planRevision: 1 } }),
];

describe('capability state and authority', () => {
  it('CA29 numbers assignments across B, D and A without consuming entry numbering', () => {
    const events = begin();
    for (const [index, assignment] of ['capability-task:provide-fact.i01', 'capability-task:provide-fact.i02', 'capability-task:provide-fact.i03'].entries()) {
      events.push(event(events.length + 1, { type: 'capability-assigned', data: {
        task: 'capability-task:provide-fact', assignment, sequence: index + 1, invocation: 'inv-0002',
      } }));
      events.push(event(events.length + 1, { type: 'capability-assignment-settled', data: { task: 'capability-task:provide-fact', assignment, outcome: 'accepted' } }));
    }
    const state = replayCapabilityState(events);
    const task = state.tasks.get('capability-task:provide-fact')!;
    expect([...task.assignments.keys()]).toEqual(['capability-task:provide-fact.i01', 'capability-task:provide-fact.i02', 'capability-task:provide-fact.i03']);
    expect(task.nextAssignmentSequence).toBe(4);
    expect(canAssignCapabilityTask(task)).toBe(true);
    expect(() => transitionCapabilityState(state, event(9, { type: 'capability-assigned', data: {
      task: 'capability-task:provide-fact', assignment: 'capability-task:provide-fact.i01', sequence: 1, invocation: 'inv-0002',
    } }))).toThrow('assignment sequence');
  });

  it('CA29 captures distinct task and global limits under the new policy version', () => {
    const previous = { version: 'run-policy/4', limits: {
      maxIterationsPerWorkItem: 12, maxWorkItems: 64, maxInvocationsPerRun: 400,
    } } as unknown as RunPolicy;
    expect(() => captureCapabilityLimits(previous)).toThrow('Capability coordination requires a captured task limit');
    expect(() => capabilityPolicyFrom(previous)).toThrow('fresh run');
    const policy = capabilityPolicyFrom(defaultRunPolicy({ projectRoot: '/fixture' }));
    const limits = captureCapabilityLimits(policy);
    expect(limits).toEqual({ maxAssignments: 12, maxWorkUnits: 64, maxInvocations: 400 });
    expect(canStartInvocation(399, limits)).toBe(true);
    expect(canStartInvocation(400, limits)).toBe(false);
  });

  it('holds the depth-first stack while a child answers a need from an unfinished parent assignment', () => {
    const events = begin();
    events.push(event(3, { type: 'capability-assigned', data: { task: 'capability-task:provide-fact', assignment: 'capability-task:provide-fact.i01', sequence: 1, invocation: 'inv-0002' } }));
    events.push(event(4, { type: 'capability-requested', data: { request: 'capability-request:normalize-source', parent: 'capability-task:provide-fact', assignment: 'capability-task:provide-fact.i01', invocation: 'inv-0003' } }));
    events.push(event(5, { type: 'capability-delegated', data: { task: 'capability-task:normalize-source', request: 'capability-request:normalize-source', parent: 'capability-task:provide-fact', invocation: 'inv-0004', planRevision: 1 } }));
    const nested = replayCapabilityState(events);
    expect(nested.stack).toEqual(['work-item:format-fact', 'capability-task:provide-fact', 'capability-task:normalize-source']);
    expect(nested.tasks.get('capability-task:provide-fact')?.status).toBe('awaiting-dependency');
    expect(() => transitionCapabilityState(nested, event(6, { type: 'capability-verification-started', data: {
      task: 'capability-task:provide-fact', invocation: 'inv-0002',
    } }))).toThrow('not the active stack frame');
    events.push(event(6, { type: 'capability-verification-started', data: { task: 'capability-task:normalize-source', invocation: 'inv-0004' } }));
    events.push(event(7, { type: 'capability-handed-back', data: { task: 'capability-task:normalize-source', handback: 'capability-task:normalize-source', invocation: 'inv-0004' } }));
    const returned = replayCapabilityState(events);
    expect(returned.stack).toEqual(['work-item:format-fact', 'capability-task:provide-fact']);
    expect(returned.tasks.get('capability-task:provide-fact')?.status).toBe('implementing');
    expect(returned.tasks.get('capability-task:provide-fact')?.activeAssignment).toBe('capability-task:provide-fact.i01');
  });

  it('refuses an active assignment but preserves partial history for the verifier', () => {
    const assigned = [...begin(), event(3, { type: 'capability-assigned', data: {
      task: 'capability-task:provide-fact', assignment: 'capability-task:provide-fact.i01', sequence: 1, invocation: 'inv-0002',
    } })];
    const running = replayCapabilityState(assigned);
    expect(() => transitionCapabilityState(running, event(4, { type: 'capability-verification-started', data: {
      task: 'capability-task:provide-fact', invocation: 'inv-0002',
    } }))).toThrow('implementing');
    assigned.push(event(4, { type: 'capability-assignment-settled', data: {
      task: 'capability-task:provide-fact', assignment: 'capability-task:provide-fact.i01', outcome: 'partial',
    } }));
    const partial = replayCapabilityState(assigned);
    const verifying = transitionCapabilityState(partial, event(5, { type: 'capability-verification-started', data: {
      task: 'capability-task:provide-fact', invocation: 'inv-0002',
    } }));
    expect(verifying.tasks.get('capability-task:provide-fact')?.status).toBe('verifying');
  });

  it('rejects stale plan revisions and inactive coordinator invocations', () => {
    const state = replayCapabilityState(begin());
    expect(() => transitionCapabilityState(state, event(3, { type: 'capability-plan-revised', data: {
      task: 'capability-task:provide-fact', revision: 2, basedOn: 1, invocation: 'inv-0099',
    } }))).toThrow('no coordination authority');
    const revised = transitionCapabilityState(state, event(3, { type: 'capability-plan-revised', data: {
      task: 'capability-task:provide-fact', revision: 2, basedOn: 1, invocation: 'inv-0002',
    } }));
    expect(() => transitionCapabilityState(revised, event(4, { type: 'capability-plan-revised', data: {
      task: 'capability-task:provide-fact', revision: 2, basedOn: 1, invocation: 'inv-0002',
    } }))).toThrow('stale plan revision');
  });

  it('CA34 PB3-D08 handback readiness is structural: no per-example coverage, and no entry association inferred from a similar name', () => {
    const request = fixtureRequest();
    const task = fixtureTask(request);
    const plan = fixturePlan(request, task);
    const coordinating = replayCapabilityState(begin()).tasks.get(task.id)!;
    expect(capabilityHandbackReadiness(task, request, plan, coordinating)).toEqual(['Task is not verifying']);
    const state = replayCapabilityState([...begin(), event(3, { type: 'capability-verification-started', data: {
      task: task.id, invocation: 'inv-0002',
    } })]).tasks.get(task.id)!;
    // The original example's case carries no coverage state, and none is asked for.
    expect(capabilityHandbackReadiness(task, request, plan, state)).toEqual([]);
    expect(capabilityHandbackReadiness(task, request, { ...plan, revision: 2, basedOn: 1 }, state)).toEqual(['Plan revision is stale']);
    expect(task.relatedEntries).toEqual([]);
    expect({ ...task, relatedEntries: [{ entry: task.id, reason: 'Architect explicitly related an entry' }] }.relatedEntries).toHaveLength(1);
  });
});
