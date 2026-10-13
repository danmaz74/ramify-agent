import { operationRecoverySchema, runLayout } from './records.js';
import { recoveryHash, validateExternalRepair, type ExternalRepairAdmission } from './recovery-admission.js';
import type { RunLog } from './log.js';
import { acceptedCommandSchema } from '../interfaces/protocol/jobs.js';
import { validateRecordedRestartRepair } from './restart-runtime.js';

/** Only operator admissions co-committed with their exact resume command supplement a gate. */
export function authenticatedExternalRepairs(entries: ReturnType<RunLog['ledger']['replay']>): Array<{ sequence: number; admission: ExternalRepairAdmission }> {
  const result = [];
  for (const entry of entries) {
    const event = entry.transaction.event;
    if (event.type !== 'operation-recovery-resumed') continue;
    const command = acceptedCommandSchema.parse(event.data.command);
    const source = (entry as typeof entry & { source?: { runId: string; sequence: number } }).source;
    if (command.receipt.sequence !== (source?.sequence ?? entry.sequence) || command.receipt.jobId !== (source?.runId ?? event.jobId)
      || command.receipt.jobId !== event.jobId || command.receipt.commandId !== command.commandId) throw new Error('External repair has no matching accepted operator command receipt');
    const records = entry.transaction.records.filter(record => record.path === runLayout.operationRecovery(event.data.occurrenceId, event.data.revision)
      && record.id === event.data.occurrenceId && record.revision === event.data.revision);
    if (records.length !== 1) throw new Error('External repair admission has no unique committed recovery body');
    const recovery = operationRecoverySchema.parse(records[0]!.body);
    if (recovery.id !== event.data.occurrenceId || recovery.revision !== event.data.revision || recovery.state !== 'resumed' || recovery.group !== event.data.group
      || !recovery.settled || !recovery.identity || !recovery.admission?.admitted) throw new Error('External repair admission lacks confirmed occurrence identity and settlement');
    const admission = recovery.admission;
    const comparison = admission.restartComparison;
    let recomputed: ExternalRepairAdmission;
    if (comparison) {
      const initialized = entries.find(prior => prior.sequence < entry.sequence && prior.transaction.event.type === 'restart-prepared'
        && prior.transaction.event.jobId === event.jobId);
      const provenance = initialized?.transaction.event;
      if (!provenance || provenance.type !== 'restart-prepared' || comparison.sourceRun !== provenance.data.sourceRun
        || comparison.sourceCursor !== provenance.data.sourceCursor || comparison.sourceDigest !== provenance.data.sourceDigest
        || comparison.importDigest !== provenance.data.importDigest) throw new Error('Restart repair comparison has no matching committed initialization');
      const initial = initialized!.transaction.records.map(record => operationRecoverySchema.safeParse(record.body)).find(record => record.success);
      if (!initial?.success || recoveryHash(initial.data.identity) !== recoveryHash(admission.before)) throw new Error('Restart repair comparison changed its imported source identity');
      recomputed = { ...validateRecordedRestartRepair(admission.before, admission.after, admission.declaration ?? undefined, comparison.normalizedBefore), restartComparison: comparison };
    } else recomputed = validateExternalRepair(admission.before, admission.after, admission.declaration ?? undefined);
    if (recoveryHash(recovery.identity) !== recoveryHash(admission.before) || recoveryHash(recomputed) !== recoveryHash(admission)) throw new Error('External repair evidence differs from its committed admission');
    result.push({ sequence: entry.sequence, admission });
  }
  return result;
}
