
import { join } from 'node:path';

import { capabilityCompletionBlockers, replayCapabilityState } from '../capability/state.js';
import { type ConsumerRequirement, type ProviderObligation } from '../contracts/records.js';
import { bindingKey, conformanceKey, openRequirements, verificationKey } from '../contracts/schedule.js';

import { type RecordRef as CommitRecord } from '../../../../../../src/jobs/commit.js';

import { committedRecords } from '../../../../src/run/committed-records.js';
import { refOf } from '../../../../../../src/jobs/committed-reader.js';

import { dueIntegrations, integrationWorkItem } from './integration.js';
import { workItemOfIteration, type IterationAssignment } from './iterations.js';

import { obligationsOf, type ObligationProjection } from './obligations.js';
import { workLayout, type WorkItem } from './records.js';

import { trackedScenarios } from '../../../../src/run/feature-files.js';
import type { RunEventOf } from '../../../../src/run/log.js';

import type { LedgerEntry } from '../../../../../ledger/src/ledger.js';
import type { RunEvent } from '../../../../src/run/log.js';
/** Detached committed reading input, with no writer, ledger or mutex. */
export interface CoordinationHistory { readonly events: readonly RunEvent[]; readonly lines: readonly LedgerEntry<RunEvent>[] }
export function eventsOf<K extends RunEvent['type']>(events: readonly RunEvent[], type: K): RunEventOf<K>[] {
  return events.filter((event): event is RunEventOf<K> => event.type === type);
}
export function eventOf<K extends RunEvent['type']>(events: readonly RunEvent[], type: K): RunEventOf<K> | undefined { return eventsOf(events, type)[0]; }
export function evidenceFor(history: CoordinationHistory, item: WorkItem, kind: IterationAssignment['kind'], records: ReturnType<typeof committedRecords>): IterationAssignment['evidenceObligations'] {
  const evidence: IterationAssignment['evidenceObligations'] = [];
  const obligation = obligationOwedBy(history, item, records);
  if (obligation !== null) {
    evidence.push({ obligation: refOf(obligation.id, obligation.revision, obligation), suite: [...obligation.evidence.conformance], against: 'real' });
  }
  if (kind === 'verification') {
    for (const requirement of openRequirementsOf(history, records, item.id)) {
      const owed = records.obligations.get(requirement.obligation);
      evidence.push({ requirement: refOf(requirement.id, requirement.revision, requirement), suite: [...(owed?.evidence.conformance ?? [])], against: 'real' });
    }
  }
  return evidence;
}

/** The one obligation projection: scenario records, delegated outcomes and the accepted registrations and reports. */
export function obligationProjection(history: CoordinationHistory): ObligationProjection {
  const lines = history.lines;
  return obligationsOf({ scenarios: trackedScenarios(lines).records, workItems: committedRecords(lines).workItems, events: history.events });
}

/**
 * The integration work items a done report of one scenario makes due: each
 * integration whose every sub-scenario is then done.
 */
export function integrationItemsDue(history: CoordinationHistory, scenario: string): CommitRecord[] {
  const lines = history.lines;
  const tracked = trackedScenarios(lines);
  if (!tracked.states.has(scenario)) return [];
  const after = new Map(tracked.states);
  after.set(scenario, 'done');
  const items = [...committedRecords(lines).workItems];
  const records: CommitRecord[] = [];
  for (const integration of dueIntegrations(tracked.records, after, items)) {
    if (!integration.subScenarios.includes(scenario)) continue;
    const item = integrationWorkItem(integration, items.length);
    items.push(item);
    records.push({ path: workLayout.item(item.id), id: item.id, revision: 1, body: item });
  }
  return records;
}

/**
 * Which work item each obligation and requirement revision is bound to: a
 * registered agreement binds its own, and a revision records its bindings
 * itself.
 */
export function bindingsOf(history: CoordinationHistory): Map<string, string> {
  const bindings = new Map<string, string>();
  for (const event of history.events) {
    if (event.type === 'contract-registered') {
      if (event.data.obligation !== null && event.data.providerWorkItem !== null) {
        bindings.set(bindingKey(event.data.obligation, event.data.revision), event.data.providerWorkItem);
      }
      const consumer = workItemOfIteration(event.data.iteration);
      if (consumer !== null) {
        for (const requirement of event.data.requirements) bindings.set(bindingKey(requirement, event.data.revision), consumer);
      }
      continue;
    }
    if (event.type !== 'evidence-reopened') continue;
    for (const binding of event.data.bindings) bindings.set(bindingKey(binding.subject.id, binding.subject.revision), binding.workItem);
  }
  return bindings;
}

/** The requirement revisions a `requirement-verified` has closed. */
export function verifiedRequirements(history: CoordinationHistory): Set<string> {
  return new Set(eventsOf(history.events, 'requirement-verified').map(event => verificationKey(event.data.requirement, event.data.revision)));
}

/** The requirements one work item owes that no `requirement-verified` has closed, by the scheduling binding. */
export function openRequirementsOf(history: CoordinationHistory, records: ReturnType<typeof committedRecords>, workItem: string): ConsumerRequirement[] {
  return openRequirements(records.requirements, verifiedRequirements(history), workItem, bindingsOf(history));
}

/** The obligation one provider work item currently owes: the latest revision of its own obligation bound to it. */
export function obligationOwedBy(history: CoordinationHistory, item: WorkItem, records: ReturnType<typeof committedRecords>): ProviderObligation | null {
  if (!('obligation' in item.origin)) return null;
  const obligation = records.obligations.get(item.origin.obligation.id);
  if (obligation === undefined) return null;
  const bound = bindingsOf(history).get(bindingKey(obligation.id, obligation.revision)) ?? null;
  if (bound !== null) return bound === item.id ? obligation : null;
  return item.origin.obligation.revision === obligation.revision ? obligation : null;
}

/** The unresolved capability work that blocks a work item's completion in the capability workflow. */
export function capabilityBlockersOf(history: CoordinationHistory, workItem: string): string[] {
  const accepted = new Set(eventsOf(history.events, 'iteration-closed').filter(event => event.data.outcome === 'accepted').map(event => event.data.iteration));
  return capabilityCompletionBlockers(replayCapabilityState(history.events), workItem, accepted);
}

/**
 * Why a work item's completion request is refused now, or nothing: in the
 * contract workflow, an open requirement and an owed obligation not yet
 * conformed; in the capability workflow, its unresolved capability work.
 */
export function completionBlockers(history: CoordinationHistory, item: WorkItem, capabilityWorkflow: boolean): {
  readonly blocked: string[];
  readonly open: ConsumerRequirement[];
  readonly owed: ProviderObligation | null;
} {
  const records = committedRecords(history.lines);
  const open = openRequirementsOf(history, records, item.id);
  const conformed = new Set(eventsOf(history.events, 'provider-conformed').map(event => conformanceKey(event.data.obligation, event.data.revision)));
  const owing = obligationOwedBy(history, item, records);
  const owed = owing !== null && !conformed.has(conformanceKey(owing.id, owing.revision)) ? owing : null;
  const capability = capabilityWorkflow ? capabilityBlockersOf(history, item.id) : [];
  const blocked = [
    ...(capabilityWorkflow ? [] : open).map(requirement => {
      const obligation = records.obligations.get(requirement.obligation);
      return `${requirement.id} is open: ${obligation?.capability ?? requirement.forCapability} is still held by the fake at ${requirement.evidence.fakeInjections.join(', ')}`;
    }),
    ...(capabilityWorkflow || owed === null ? [] : [`${owed.id} is owed: the agreed conformance suite has not passed against the real provider yet`]),
    ...capability,
  ];
  return { blocked, open: capabilityWorkflow ? [] : open, owed: capabilityWorkflow ? null : owed };
}

/** The reconciliation an assignment of this work item corrects, while none has resolved it. */
export function pendingCorrection(history: CoordinationHistory, workItem: string): string | undefined {
  const assessed = eventsOf(history.events, 'reconciliation-assessed').filter(event => event.data.workItem === workItem).at(-1);
  if (assessed === undefined || assessed.data.next !== 'correct') return undefined;
  const resolved = eventsOf(history.events, 'iteration-assigned').some(event => event.data.corrects === assessed.data.reconciliation) ||
    eventsOf(history.events, 'capability-assigned').some(event => event.data.corrects === assessed.data.reconciliation);
  return resolved ? undefined : assessed.data.reconciliation;
}

/** The count of iterations this work item has been assigned, contract sub-sessions included. */
export function assignedCount(history: CoordinationHistory, workItem: string): number {
  return eventsOf(history.events, 'iteration-assigned').filter(event => event.data.workItem === workItem).length
    + eventsOf(history.events, 'contract-requested').filter(event => event.data.workItem === workItem).length;
}
