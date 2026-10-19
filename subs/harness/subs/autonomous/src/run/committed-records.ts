import { coordinationRecords } from '../../subs/work-coordination/src/work/committed.js';
import { invocationRecords } from '../../../task-execution/src/committed.js';
import { type ReplayedLine } from '../../../../src/jobs/committed-reader.js';
import { planningRecords } from '../../subs/planning/src/committed.js';

import { type Hypothesis, type RegistryEntry } from '../../subs/planning/src/records.js';
import { type WorkItem, type WorkItemOutline } from '../../subs/work-coordination/src/work/records.js';
import { type IterationAssignment, type IterationResult } from '../../subs/work-coordination/src/work/iterations.js';
import { type Invocation, type InvocationOutcome } from '../../../task-execution/src/records.js';
import { type PlacementDecision, type PlacementRequest } from '../../subs/work-coordination/src/architecture/records.js';
import { type ConsumerRequirement, type ContractRecord, type ProviderObligation } from '../../subs/work-coordination/src/contracts/records.js';
import { type CapabilityExchange, type CapabilityHandback, type CapabilityPlan, type CapabilityRequest, type CapabilityTask } from '../../subs/work-coordination/src/capability/records.js';

/*
 * The records a run has committed, read from the log rather than from the
 * files. The log is the authority and each file is a materialized copy of
 * it, so a run that has just been recovered and one that never crashed
 * answer the same thing here.
 *
 * Each record is validated again as it is read back: a body the log holds
 * that no longer satisfies its schema is a failure with evidence, never a
 * record that quietly changes shape.
 */

/** The bytes a record file holds, which the ledger writes pretty-printed with a trailing newline. */

export interface CommittedRecords {
  /** Every hypothesis at its highest committed revision. */
  readonly hypotheses: readonly Hypothesis[];
  /** Every registry entry at its highest committed revision, in committed order. */
  readonly registry: readonly RegistryEntry[];
  readonly workItems: readonly WorkItem[];
  /** Each work item's outline revisions, oldest first. */
  readonly outlines: ReadonlyMap<string, readonly WorkItemOutline[]>;
  /** Every iteration assignment, by its identifier, in committed order. */
  readonly assignments: ReadonlyMap<string, IterationAssignment>;
  /** Every iteration result, by the iteration it closed. */
  readonly results: ReadonlyMap<string, IterationResult>;
  /** Every invocation, by its identifier: the work each one belongs to. */
  readonly invocations: ReadonlyMap<string, Invocation>;
  /** Every invocation outcome, by the invocation it closed. */
  readonly outcomes: ReadonlyMap<string, InvocationOutcome>;
  /** Every placement request, by its identifier, in committed order. */
  readonly requests: ReadonlyMap<string, PlacementRequest>;
  /** Every placement decision, global and local, by its identifier, in committed order. */
  readonly decisions: ReadonlyMap<string, PlacementDecision>;
  /** Every contract at its highest committed revision. */
  readonly contracts: ReadonlyMap<string, ContractRecord>;
  /** Every provider obligation at its highest committed revision. */
  readonly obligations: ReadonlyMap<string, ProviderObligation>;
  /** Every consumer requirement at its highest committed revision. */
  readonly requirements: ReadonlyMap<string, ConsumerRequirement>;
  readonly capabilityRequests: ReadonlyMap<string, CapabilityRequest>;
  readonly capabilityTasks: ReadonlyMap<string, CapabilityTask>;
  readonly capabilityPlans: ReadonlyMap<string, readonly CapabilityPlan[]>;
  readonly capabilityExchanges: ReadonlyMap<string, readonly CapabilityExchange[]>;
  readonly capabilityHandbacks: ReadonlyMap<string, CapabilityHandback>;
}

/** Every record of the analysis and the work items, as the log committed them. */
export function committedRecords(entries: readonly ReplayedLine[]): CommittedRecords {
  const { hypotheses, registry } = planningRecords(entries);
  const { invocations, outcomes } = invocationRecords(entries);
  const { workItems, outlines, assignments, results, requests, decisions, contracts, obligations, requirements, capabilityRequests, capabilityTasks, capabilityPlans, capabilityExchanges, capabilityHandbacks } = coordinationRecords(entries);
  return {
    hypotheses,
    registry,
    workItems: [...workItems.values()],
    outlines,
    assignments,
    results,
    invocations,
    outcomes,
    requests,
    decisions,
    contracts,
    obligations,
    requirements,
    capabilityRequests,
    capabilityTasks,
    capabilityPlans,
    capabilityExchanges,
    capabilityHandbacks,
  };
}
