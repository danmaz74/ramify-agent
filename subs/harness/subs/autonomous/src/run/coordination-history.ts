import type { RunLog } from './log.js';
import type { CoordinationHistory } from '../../subs/work-coordination/src/work/history.js';
/** Snapshot the authoritative journal as detached reading data. */
export function coordinationHistory(log: RunLog): CoordinationHistory {
 const lines = log.ledger.replay();
 return { events: lines.map(line => line.transaction.event), lines };
}
