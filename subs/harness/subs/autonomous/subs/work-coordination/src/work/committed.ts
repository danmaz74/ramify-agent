import { CommittedRecordError, parseCommittedRecord, type ReplayedLine } from '../../../../../../src/jobs/committed-reader.js';

import { workItemOutlineSchema, workItemSchema, type WorkItem, type WorkItemOutline } from './records.js';
import { iterationAssignmentSchema, iterationResultSchema, type IterationAssignment, type IterationResult } from './iterations.js';

import { placementDecisionSchema, placementRequestSchema, type PlacementDecision, type PlacementRequest } from '../architecture/records.js';
import { consumerRequirementSchema, contractRecordSchema, providerObligationSchema, type ConsumerRequirement, type ContractRecord, type ProviderObligation } from '../contracts/records.js';
import { capabilityExchangeSchema, capabilityHandbackSchema, capabilityPlanSchema, capabilityRequestSchema, capabilityTaskSchema, type CapabilityExchange, type CapabilityHandback, type CapabilityPlan, type CapabilityRequest, type CapabilityTask } from '../capability/records.js';

export interface CoordinationRecords {
  readonly workItems: readonly WorkItem[];
  /** Each work item's outline revisions, oldest first. */
  readonly outlines: ReadonlyMap<string, readonly WorkItemOutline[]>;
  /** Every iteration assignment, by its identifier, in committed order. */
  readonly assignments: ReadonlyMap<string, IterationAssignment>;
  /** Every iteration result, by the iteration it closed. */
  readonly results: ReadonlyMap<string, IterationResult>;
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

export function coordinationRecords(entries: readonly ReplayedLine[]): CoordinationRecords {
  const workItems = new Map<string, WorkItem>();
  const outlines = new Map<string, WorkItemOutline[]>();
  const assignments = new Map<string, IterationAssignment>();
  const results = new Map<string, IterationResult>();
  const requests = new Map<string, PlacementRequest>();
  const decisions = new Map<string, PlacementDecision>();
  const contracts = new Map<string, ContractRecord>();
  const obligations = new Map<string, ProviderObligation>();
  const requirements = new Map<string, ConsumerRequirement>();
  const capabilityRequests = new Map<string, CapabilityRequest>();
  const capabilityTasks = new Map<string, CapabilityTask>();
  const capabilityPlans = new Map<string, CapabilityPlan[]>();
  const capabilityExchanges = new Map<string, CapabilityExchange[]>();
  const capabilityHandbacks = new Map<string, CapabilityHandback>();

  for (const entry of entries) {
    for (const record of entry.transaction.records) {
      const declared = typeof record.body === 'object' && record.body !== null
        ? (record.body as { schema?: unknown }).schema
        : undefined;
      switch (declared) {
        case 'ramify-agent.work-item/1':
        case 'ramify-agent.work-item/2': {
          const value = parseCommittedRecord(workItemSchema, record.body, record.path);
          workItems.set(value.id, value);
          break;
        }
        case 'ramify-agent.work-item-outline/1': {
          const value = parseCommittedRecord(workItemOutlineSchema, record.body, record.path);
          const list = outlines.get(value.workItem) ?? [];
          list.push(value);
          outlines.set(value.workItem, list);
          break;
        }
        case 'ramify-agent.iteration-assignment/1': {
          const value = parseCommittedRecord(iterationAssignmentSchema, record.body, record.path);
          assignments.set(value.id, value);
          break;
        }
        case 'ramify-agent.iteration-result/1': {
          const value = parseCommittedRecord(iterationResultSchema, record.body, record.path);
          results.set(value.iteration, value);
          break;
        }
        case 'ramify-agent.placement-request/1':
        case 'ramify-agent.placement-request/2': {
          const value = parseCommittedRecord(placementRequestSchema, record.body, record.path);
          requests.set(value.id, value);
          break;
        }
        case 'ramify-agent.placement-decision/1':
        case 'ramify-agent.placement-decision/2': {
          const value = parseCommittedRecord(placementDecisionSchema, record.body, record.path);
          decisions.set(value.id, value);
          break;
        }
        case 'ramify-agent.contract/2':
        case 'ramify-agent.contract/3': {
          const value = parseCommittedRecord(contractRecordSchema, record.body, record.path);
          const current = contracts.get(value.id);
          if (current === undefined || value.revision >= current.revision) contracts.set(value.id, value);
          break;
        }
        case 'ramify-agent.provider-obligation/1':
        case 'ramify-agent.provider-obligation/2': {
          const value = parseCommittedRecord(providerObligationSchema, record.body, record.path);
          const current = obligations.get(value.id);
          if (current === undefined || value.revision >= current.revision) obligations.set(value.id, value);
          break;
        }
        case 'ramify-agent.consumer-requirement/1':
        case 'ramify-agent.consumer-requirement/2': {
          const value = parseCommittedRecord(consumerRequirementSchema, record.body, record.path);
          const current = requirements.get(value.id);
          if (current === undefined || value.revision >= current.revision) requirements.set(value.id, value);
          break;
        }
        case 'ramify-agent.capability-request/1':
        case 'ramify-agent.capability-request/2': {
          const value = parseCommittedRecord(capabilityRequestSchema, record.body, record.path);
          if (capabilityRequests.has(value.id)) throw new CommittedRecordError(record.path, ['An original request is immutable']);
          capabilityRequests.set(value.id, value);
          break;
        }
        case 'ramify-agent.capability-task/1':
        case 'ramify-agent.capability-task/2': {
          const value = parseCommittedRecord(capabilityTaskSchema, record.body, record.path);
          if (capabilityTasks.has(value.id)) throw new CommittedRecordError(record.path, ['A task identity is immutable']);
          capabilityTasks.set(value.id, value);
          break;
        }
        case 'ramify-agent.capability-plan/1':
        case 'ramify-agent.capability-plan/2': {
          const value = parseCommittedRecord(capabilityPlanSchema, record.body, record.path);
          const list = capabilityPlans.get(value.task) ?? [];
          if (value.revision !== list.length + 1) throw new CommittedRecordError(record.path, ['Plan revisions are consecutive and immutable']);
          list.push(value);
          capabilityPlans.set(value.task, list);
          break;
        }
        case 'ramify-agent.capability-exchange/1':
        case 'ramify-agent.capability-exchange/2': {
          const value = parseCommittedRecord(capabilityExchangeSchema, record.body, record.path);
          const list = capabilityExchanges.get(value.id) ?? [];
          if (list.length > 0 && (list.length !== 1 || list[0]?.answer !== null || value.answer === null)) {
            throw new CommittedRecordError(record.path, ['An exchange has one question and at most one answer']);
          }
          list.push(value);
          capabilityExchanges.set(value.id, list);
          break;
        }
        case 'ramify-agent.capability-handback/1':
        case 'ramify-agent.capability-handback/2': {
          const value = parseCommittedRecord(capabilityHandbackSchema, record.body, record.path);
          if (capabilityHandbacks.has(value.task)) throw new CommittedRecordError(record.path, ['A handback is immutable']);
          capabilityHandbacks.set(value.task, value);
          break;
        }
        default:
          break;
      }
    }
  }

  return {
    workItems: [...workItems.values()],
    outlines,
    assignments,
    results,
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

/** The reference of one record at the revision the log committed. */
