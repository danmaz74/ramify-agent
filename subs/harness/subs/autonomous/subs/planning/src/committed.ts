import { entryAssignmentsSchema, type EntryAssignments, hypothesisSchema, registryEntrySchema, type Hypothesis, type RegistryEntry } from './records.js';
import { parseCommittedRecord, type ReplayedLine } from '../../../../../src/jobs/committed-reader.js';
export interface PlanningRecords { readonly entries: EntryAssignments | null; readonly hypotheses: readonly Hypothesis[]; readonly registry: readonly RegistryEntry[] }
/** Owner-specific projection over the same immutable ledger lines as lifecycle readers. */
export function planningRecords(entries: readonly ReplayedLine[]): PlanningRecords {
  let acceptedEntries: EntryAssignments | null = null;
  const hypotheses = new Map<string, Hypothesis>();
  const registry = new Map<string, RegistryEntry>();
  for (const line of entries) for (const record of line.transaction.records) {
    const declared = typeof record.body === 'object' && record.body !== null ? (record.body as { schema?: unknown }).schema : undefined;
    if (declared === 'ramify-agent.entry-assignments/1') acceptedEntries = parseCommittedRecord(entryAssignmentsSchema, record.body, record.path);
    else if (declared === 'ramify-agent.hypothesis/1') {
      const value = parseCommittedRecord(hypothesisSchema, record.body, record.path);
      const current = hypotheses.get(value.id);
      if (current === undefined || value.revision >= current.revision) hypotheses.set(value.id, value);
    } else if (declared === 'ramify-agent.capability/1') {
      const value = parseCommittedRecord(registryEntrySchema, record.body, record.path);
      const current = registry.get(value.capability);
      if (current === undefined || value.revision >= current.revision) registry.set(value.capability, value);
    }
  }
  return { entries: acceptedEntries, hypotheses: [...hypotheses.values()], registry: [...registry.values()] };
}
