import { parseCommittedRecord, type ReplayedLine } from '../../../src/jobs/committed-reader.js';
import { invocationSchema, invocationOutcomeSchema, type Invocation, type InvocationOutcome } from './records.js';

export interface InvocationRecords {
 readonly invocations: ReadonlyMap<string, Invocation>;
 readonly outcomes: ReadonlyMap<string, InvocationOutcome>;
}
/** Validate immutable invocation/outcome bodies from the authoritative replay. */
export function invocationRecords(entries: readonly ReplayedLine[]): InvocationRecords {
 const invocations = new Map<string, Invocation>();
 const outcomes = new Map<string, InvocationOutcome>();
 for (const line of entries) for (const record of line.transaction.records) {
  const declared = typeof record.body === 'object' && record.body !== null ? (record.body as { schema?: unknown }).schema : undefined;
  if (declared === 'ramify-agent.invocation/1') { const value = parseCommittedRecord(invocationSchema, record.body, record.path); invocations.set(value.id, value); }
  else if (declared === 'ramify-agent.invocation-outcome/1') { const value = parseCommittedRecord(invocationOutcomeSchema, record.body, record.path); outcomes.set(value.invocation, value); }
 }
 return { invocations, outcomes };
}
