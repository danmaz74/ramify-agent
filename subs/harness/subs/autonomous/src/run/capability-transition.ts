import type { RecordBody } from '../../../ledger/src/ledger.js';
import type { RunEvent, RunLog } from './log.js';
import { validateCapabilityTransition, type CapabilityInput } from '../../subs/work-coordination/src/capability/ledger.js';
import { coordinationHistory } from './coordination-history.js';
/** Called only under lifecycle serialization: validate current domain authority, then append atomically. */
export async function commitCapabilityTransition(log: RunLog, input: CapabilityInput, records: readonly RecordBody[], at: Date = new Date()): Promise<RunEvent> {
 const event = log.next(input, at);
 validateCapabilityTransition(coordinationHistory(log), event, records);
 await log.ledger.append({ event, records });
 return event;
}
