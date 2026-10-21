import { join } from 'node:path';
import { z } from 'zod';
import { hypothesisSchema } from '../../subs/planning/src/records.js';
import { contractRecordSchema } from '../../subs/work-coordination/src/contracts/records.js';
import { workItemOutlineSchema } from '../../subs/work-coordination/src/work/records.js';
import { iterationAssignmentSchema } from '../../subs/work-coordination/src/work/iterations.js';
import { committedRecords } from './committed-records.js';
import { CommittedRecordError } from '../../../../src/jobs/committed-reader.js';
import { gateAttemptSchema, gateAuditOutcomeSchema } from '../../subs/acceptance/src/gate-records.js';
import { entryAssignmentsSchema } from '../../subs/planning/src/records.js';

// Durable families admitted by the harness. This was formerly held by the
// response reader; commands must enforce it without constructing a response.
const supported: Readonly<Record<string, string>> = Object.fromEntries([
  'ramify-agent.hypothesis/1', 'ramify-agent.capability/1', 'ramify-agent.work-item/1',
  'ramify-agent.work-item-outline/1', 'ramify-agent.iteration-assignment/1', 'ramify-agent.iteration-result/1',
  'ramify-agent.invocation/1', 'ramify-agent.invocation-outcome/1', 'ramify-agent.placement-request/1',
  'ramify-agent.placement-decision/1', 'ramify-agent.contract/2', 'ramify-agent.provider-obligation/1',
  'ramify-agent.consumer-requirement/1', 'ramify-agent.gate-attempt/3', 'ramify-agent.gate-audit-outcome/1', 'ramify-agent.entry-assignments/1',
  'ramify-agent.readiness-attempt/1', 'ramify-agent.infrastructure-recovery/1', 'ramify-agent.measurement-snapshot/1',
  'ramify-agent.line-events/1', 'ramify-agent.scenario/1', 'ramify-agent.unresolved-request/1', 'ramify-agent.plan-deviation/1',
  'ramify-agent.environment-problem/1', 'ramify-agent.prepared-candidate/1',
  'ramify-agent.repair-incident/1',
  'ramify-agent.automatic-repair-assignment/1', 'ramify-agent.repair-preparation/1',
  'ramify-agent.automatic-repair-delta/1', 'ramify-agent.repair-incident-export/1',
  'ramify-agent.automatic-repair-attempt/1',
  'ramify-agent.nonfunctional-assessment/1', 'ramify-agent.nonfunctional-round/1',
  'ramify-agent.nonfunctional-deviation/1',
  'ramify-agent.capability-request/1', 'ramify-agent.capability-task/1', 'ramify-agent.capability-plan/1',
  'ramify-agent.capability-exchange/1', 'ramify-agent.capability-handback/1',
].map(schema => [schema.replace(/\/\d+$/, ''), schema]));
const alsoSupported = new Set([
  'ramify-agent.hypothesis/2', 'ramify-agent.capability/2', 'ramify-agent.work-item/2',
  'ramify-agent.entry-assignments/2', 'ramify-agent.scenario/2',
  'ramify-agent.capability-request/2', 'ramify-agent.capability-task/2',
  'ramify-agent.capability-plan/2', 'ramify-agent.capability-exchange/2', 'ramify-agent.capability-handback/2',
  'ramify-agent.contract/3', 'ramify-agent.provider-obligation/2', 'ramify-agent.consumer-requirement/2',
  'ramify-agent.placement-request/2', 'ramify-agent.placement-decision/2',
]);

export function unsupportedCommittedVersion(declared: unknown): string | null {
  if (typeof declared !== 'string') return null;
  if (alsoSupported.has(declared)) return null;
  const expected = supported[declared.replace(/\/\d+$/, '')];
  return expected === undefined || expected === declared ? null : expected;
}

export class CommittedHistoryError extends Error {
  constructor(readonly code: 'unreadable' | 'unsupported-version', message: string, readonly evidence: readonly string[] = []) {
    super(message);
    this.name = 'CommittedHistoryError';
  }
}

export interface HistoryEntry {
  readonly sequence: number;
  readonly transaction: {
    readonly event: { readonly type: string };
    readonly records: readonly { readonly path: string; readonly body: unknown }[];
  };
}

const schemas: Readonly<Record<string, z.ZodType>> = {
  'ramify-agent.gate-attempt/3': gateAttemptSchema,
  'ramify-agent.gate-audit-outcome/1': gateAuditOutcomeSchema,
  'ramify-agent.hypothesis/1': hypothesisSchema,
  'ramify-agent.hypothesis/2': hypothesisSchema,
  'ramify-agent.work-item-outline/1': workItemOutlineSchema,
  'ramify-agent.iteration-assignment/1': iterationAssignmentSchema,
  'ramify-agent.contract/2': contractRecordSchema,
  'ramify-agent.entry-assignments/1': entryAssignmentsSchema,
  'ramify-agent.entry-assignments/2': entryAssignmentsSchema,
};

/** Preserve general committed-record admission before repair command effects. */
export function validateCommittedHistory(record: { readonly jobId: string; readonly planId: string }, entries: readonly HistoryEntry[]): void {
  const directory = join('plans', record.planId, '.harness', 'jobs', record.jobId);
  for (const line of entries) {
    for (const committed of line.transaction.records) {
      const declared = (committed.body as { schema?: unknown } | null)?.schema;
      const expected = unsupportedCommittedVersion(declared);
      if (expected !== null) throw new CommittedHistoryError('unsupported-version',
        `The record ${committed.path} of run ${record.jobId} declares ${String(declared)}; this harness reads ${expected}`,
        [join(directory, committed.path), `declares ${String(declared)}`, `committed by event ${line.sequence} (${line.transaction.event.type})`]);
      const schema = typeof declared === 'string' ? schemas[declared] : undefined;
      if (schema === undefined) continue;
      const parsed = schema.safeParse(committed.body);
      if (!parsed.success) throw new CommittedHistoryError('unreadable',
        `The record ${committed.path} of run ${record.jobId} no longer satisfies its schema`,
        [join(directory, committed.path), ...parsed.error.issues.map(issue => `${issue.path.map(String).join('.') || '<root>'}: ${issue.message}`)]);
    }
  }
  try { committedRecords(entries); }
  catch (error) {
    if (error instanceof CommittedRecordError) throw new CommittedHistoryError('unreadable',
      `A record of run ${record.jobId} no longer satisfies its schema: ${error.message}`, [join(directory, error.path), ...error.errors]);
    throw error;
  }
}
