import type { ConsultationJournal } from '../../../subs/autonomous/subs/work-coordination/src/consultations/store.js';
import type { RunLog } from '../../../subs/autonomous/src/run/log.js';

/** Scripted journal composition; the real owner retains sequencing and ledger writes. */
export function consultationJournal(log: RunLog): ConsultationJournal {
  return {
    events: structuredClone(log.events), records: structuredClone(log.ledger.replay().flatMap(line => line.transaction.records)),
    append: (input, records) => log.ledger.append({ event: log.next(input), records: [...records] }),
  };
}
