import type { RecordBody } from '../../../ledger/src/ledger.js';
import type { RunEvent, RunLog } from './log.js';
import { CapabilityNameConflictError, validateCapabilityTransition, type CapabilityInput } from '../../subs/work-coordination/src/capability/ledger.js';
import { coordinationHistory } from './coordination-history.js';
import { isDeepStrictEqual } from 'node:util';
/** Called only under lifecycle serialization: validate current domain authority, then append atomically. */
export async function commitCapabilityTransition(log: RunLog, input: CapabilityInput, records: readonly RecordBody[], at: Date = new Date()): Promise<RunEvent> {
 if (input.type === 'capability-requested' || input.type === 'capability-delegated') {
  const identity = input.type === 'capability-requested' ? input.data.request : input.data.task;
  const prior = log.ledger.replay().find(entry => {
   const event = entry.transaction.event;
   return event.type === input.type && (event.type === 'capability-requested'
    ? event.data.request === identity : event.type === 'capability-delegated' && event.data.task === identity);
  });
  if (prior !== undefined) {
   if (!isDeepStrictEqual(prior.transaction.event.data, input.data) || !isDeepStrictEqual(prior.transaction.records, records))
    throw new CapabilityNameConflictError(input.type === 'capability-requested' ? 'request' : 'task', identity,
      `${input.type} ${identity} is already accepted with a different submission`);
   await log.ledger.materialize();
   return prior.transaction.event;
  }
 }
 const event = log.next(input, at);
 validateCapabilityTransition(coordinationHistory(log), event, records);
 await log.ledger.append({ event, records });
 return event;
}
