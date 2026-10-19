import { compatibleAuditRepair } from './audit-configuration.js';
import type { CommittedAuditConfiguration } from '../../../../audit/src/check-execution.js';
import { externalCandidateSchema, externalCandidatePath, type ExternalCandidate } from './candidate-attribution.js';
import { operationRecoverySchema, runLayout } from '../../../src/run/records.js';
import type { RunLog } from '../../../src/run/log.js';

/** Read historical candidate attribution; gates verify the actual candidate themselves. */
export function recordedExternalChanges(entries: ReturnType<RunLog['ledger']['replay']>): Array<{ sequence: number; beforeDirtyPaths: string[]; changes: ExternalCandidate['changes']; configurationPath?: string }> {
  return entries.flatMap(entry => {
    const event = entry.transaction.event;
    if (event.type === 'external-candidate-observed') {
      const record = externalCandidateSchema.parse(entry.transaction.records.find(record => record.path === externalCandidatePath(event.data.id))?.body);
      if (record.id !== event.data.id || record.beforeTree !== event.data.beforeTree || record.afterTree !== event.data.afterTree) throw new Error('External candidate observation does not match its record');
      return [{ sequence: entry.sequence, beforeDirtyPaths: record.beforeDirtyPaths, changes: record.changes }];
    }
    if (event.type !== 'operation-recovery-resumed') return [];
    const body = entry.transaction.records.find(record => record.path === runLayout.operationRecovery(event.data.occurrenceId, event.data.revision));
    const recovery = operationRecoverySchema.parse(body?.body);
    if (recovery.id !== event.data.occurrenceId || recovery.revision !== event.data.revision || recovery.state !== 'resumed') {
      throw new Error('Recorded continuation does not match its durable task state');
    }
    const admission = recovery.admission;
    return admission?.admitted ? [{ sequence: entry.sequence,
      beforeDirtyPaths: [...new Set([...admission.before.candidate.staged, ...admission.before.candidate.unstaged, ...admission.before.candidate.untracked])],
      changes: admission.changes,
      ...(admission.before.configuration.identity !== admission.after.configuration.identity && compatibleAuditRepair(admission.before.configuration.policy as CommittedAuditConfiguration, admission.after.configuration.policy as CommittedAuditConfiguration) ? { configurationPath: (admission.after.configuration.policy as { path: string }).path } : {}),
    }] : [];
  });
}
