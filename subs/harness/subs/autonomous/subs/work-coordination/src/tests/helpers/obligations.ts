import { scenarioSourceHash, type ScenarioRecord } from '../../../../../../scenarios/src/records.js';
import type { WorkItem } from '../../work/records.js';
import {
  obligationsOf, type ObligationContext, type ObligationEventLine, type ObligationRegisteredData, type ObligationReportedData,
} from '../../work/obligations.js';

/*
 * The smallest run an obligation projection is judged against: two entry
 * work items with a scenario each, an integration scenario combining them
 * whose work item does not exist yet, and one delegated capability task.
 */

export const submissionHash = (letter: string): string => letter.repeat(64);

export function scenarioRecord(id: string, entry: string | null, extra: Partial<ScenarioRecord> = {}): ScenarioRecord {
  const source = [`Scenario: ${id}`, '  Then it holds'];
  return {
    schema: 'ramify-agent.scenario/2', id, kind: entry === null ? 'integration' : 'entry',
    entry: entry === null ? null : `capability:${entry}`, owner: 'shop',
    origin: { kind: 'architect', refs: [] }, citedElements: [], partOf: null, subScenarios: [], name: id, source,
    hash: scenarioSourceHash(source), file: 'src/tests/features/p/shop.feature', ...extra,
  };
}

export function workItem(id: string, origin: WorkItem['origin']): WorkItem {
  return {
    schema: 'ramify-agent.work-item/2', id, module: 'shop', origin, goal: `Carry out ${id}.`,
    functionalRequirementIds: [], functionalAcceptanceIds: [], contextIds: [], startedFor: null,
  };
}

let sequence = 100;
export function line(type: string, data: unknown): ObligationEventLine {
  sequence += 1;
  return { type, sequence, at: '2026-10-07T12:00:00.000Z', data };
}
export const registered = (data: ObligationRegisteredData): ObligationEventLine => line('obligation-registered', data);
export const reported = (data: ObligationReportedData): ObligationEventLine => line('obligation-reported', data);

export const fixtureScenarios = [
  scenarioRecord('scenario:send-email-is-used', 'send-email', { partOf: 'scenario:combined-history' }),
  scenarioRecord('scenario:keep-history-is-used', 'keep-history', { partOf: 'scenario:combined-history' }),
  scenarioRecord('scenario:combined-history', null, { subScenarios: ['scenario:send-email-is-used', 'scenario:keep-history-is-used'] }),
];
export const fixtureWorkItems = [workItem('work-item:send-email', { entry: 'capability:send-email' }), workItem('work-item:keep-history', { entry: 'capability:keep-history' })];
export const delegated = line('capability-delegated', { task: 'capability-task:mail-delivery', request: 'capability-request:mail-delivery', parent: 'work-item:send-email', invocation: 'inv-0004', planRevision: 1 });

/** The fixture projection with these further events. */
export function fixtureProjection(events: readonly ObligationEventLine[] = []) {
  return obligationsOf({ scenarios: fixtureScenarios, workItems: fixtureWorkItems, events: [delegated, ...events] });
}

/** The send-email work item's architect, judging against the fixture projection. */
export function localContext(events: readonly ObligationEventLine[] = [], id = 'work-item:send-email'): ObligationContext {
  return { actor: { kind: 'work-item', id }, projection: fixtureProjection(events) };
}

/** The mail-delivery capability architect, whose current plan has these use cases. */
export function capabilityContext(events: readonly ObligationEventLine[] = [], useCases: readonly string[] = ['capability-example:mail-delivery', 'capability-case:derived-retry']): ObligationContext {
  return { actor: { kind: 'capability-task', id: 'capability-task:mail-delivery', useCases: new Set(useCases) }, projection: fixtureProjection(events) };
}
