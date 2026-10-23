import type { RunLog } from './log.js';
import type { CoordinationHistory } from '../../subs/work-coordination/src/work/history.js';
import type { LedgerEntry } from '../../../ledger/src/ledger.js';
import type { RunEvent } from './log.js';

const histories = new WeakMap<ReadonlyArray<LedgerEntry<RunEvent>>, CoordinationHistory>();

/** The authoritative journal as frozen reading data, the same object until the next append. */
export function coordinationHistory(log: RunLog): CoordinationHistory {
 const lines = log.ledger.replay();
 let history = histories.get(lines);
 if (history === undefined) {
  history = Object.freeze({ events: log.events, lines });
  histories.set(lines, history);
 }
 return history;
}
