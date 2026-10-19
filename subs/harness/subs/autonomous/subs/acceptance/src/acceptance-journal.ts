import type { CheckFindingPlan } from '../../../../../src/check-findings/transition.js';
import type { CheckFindingRefusal } from '../../../../../src/check-findings/transaction.js';
import type { CheckFindingState } from '../../../../check-findings/src/interfaces/check-findings.js';
import type { RunEvent, RunEventInput, RunWrite } from '../../../src/run/log.js';
import type { RunPolicy } from '../../../src/run/records.js';
import type { CoordinationHistory } from '../../work-coordination/src/work/history.js';
import type { ArchitectIndex } from '../../../../evidence/src/views.js';
import type { RecordRef as CommitRecord } from '../../../../../src/jobs/commit.js';
import type { EffectSpec } from '../../../../ledger/src/effects.js';
export interface AcceptanceReading {
 readonly history: CoordinationHistory;
 readonly version: number;
 readonly terminal: RunEvent | undefined;
 readonly policy: RunPolicy;
 readonly pendingEffects: readonly string[];
 readonly index: ArchitectIndex | null;
}
export interface AcceptanceIdentity { readonly jobId: string; readonly planId: string; readonly directory: string; readonly base: string; }
export interface AcceptedProposal<T> { readonly value: T; readonly transaction?: { readonly event: RunEventInput; readonly records: readonly CommitRecord[]; readonly at?: Date }; }
/** Lifecycle re-observes and publishes this decision under its accepted-transition serialization. */
/** Opaque lifecycle-owned result of deciding one finding carrier under current authority. */
export interface PreparedFindingPublication { readonly kind: 'prepared-finding-publication'; }
export type AcceptanceTransaction = { readonly event: RunEventInput; readonly records: readonly CommitRecord[] } | PreparedFindingPublication;
export interface AcceptanceEffect<T> extends Omit<EffectSpec<RunEventInput, T>, 'serialize' | 'intent' | 'complete'> {
 readonly intent: AcceptanceTransaction | (() => AcceptanceTransaction);
 readonly complete: (result: T) => AcceptanceTransaction;
 readonly serialization?: 'whole' | 'records'; readonly trackGate?: boolean;
}
export interface AcceptanceJournal {
 readonly identity: AcceptanceIdentity;
 observe(): AcceptanceReading;
 decideFinding(build: (current: { readonly state: CheckFindingState }) => CheckFindingPlan | { readonly stale: string }, at?: Date):
  { readonly kind: 'transaction'; readonly transaction: PreparedFindingPublication } | { readonly kind: 'replayed' } | { readonly kind: 'refused'; readonly refusal: CheckFindingRefusal };
 publish<T>(decide: () => Promise<AcceptedProposal<T>>): Promise<T>;
 effect<T>(spec: AcceptanceEffect<T>): Promise<T>;
 write(input: RunEventInput, records?: readonly CommitRecord[]): Promise<'committed' | 'already-committed' | 'ended'>;
 afterWrite(write: RunWrite, runId: string): Promise<void>;
}
