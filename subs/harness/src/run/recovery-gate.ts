import { operationRecoverySchema, runLayout } from './records.js';
import { recoveryHash, validateExternalRepair, type ExternalRepairAdmission } from './recovery-admission.js';
import type { RunLog } from './log.js';
import { acceptedCommandSchema } from '../interfaces/protocol/jobs.js';

/** Only operator admissions co-committed with their exact resume command supplement a gate. */
export function authenticatedExternalRepairs(entries: ReturnType<RunLog['ledger']['replay']>): Array<{ sequence: number; admission: ExternalRepairAdmission }> {
  const result = [];
  for (const entry of entries) {
    const event = entry.transaction.event;
    if (event.type !== 'operation-recovery-resumed') continue;
    const command = acceptedCommandSchema.parse(event.data.command);
    if (command.receipt.sequence !== entry.sequence || command.receipt.jobId !== event.jobId || command.receipt.commandId !== command.commandId) throw new Error('External repair has no matching accepted operator command receipt');
    const records = entry.transaction.records.filter(record => record.path === runLayout.operationRecovery(event.data.occurrenceId, event.data.revision)
      && record.id === event.data.occurrenceId && record.revision === event.data.revision);
    if (records.length !== 1) throw new Error('External repair admission has no unique committed recovery body');
    const recovery = operationRecoverySchema.parse(records[0]!.body);
    if (recovery.id !== event.data.occurrenceId || recovery.revision !== event.data.revision || recovery.state !== 'resumed' || recovery.group !== event.data.group
      || !recovery.settled || !recovery.identity || !recovery.admission?.admitted) throw new Error('External repair admission lacks confirmed occurrence identity and settlement');
    const admission = recovery.admission;
    if (recoveryHash(recovery.identity) !== recoveryHash(admission.before) || recoveryHash(validateExternalRepair(admission.before, admission.after, admission.declaration ?? undefined)) !== recoveryHash(admission)) throw new Error('External repair evidence differs from its committed admission');
    result.push({ sequence: entry.sequence, admission });
  }
  return result;
}
