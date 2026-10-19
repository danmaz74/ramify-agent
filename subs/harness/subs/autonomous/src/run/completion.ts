

import type { CheckFindingAt } from '../../../check-findings/src/interfaces/check-findings.js';

import { type BasisRequest, type BriefAppendOutcome } from '../../../../src/reviews/reconciliation.js';

import { type SessionId } from '../../../task-execution/src/records.js';

export interface ParentSession {
  session: SessionId | undefined;
  ref: string | undefined;
  readonly undelivered: string[];
  /** The directory the architect's own session runs from, which a fork of it keeps. */
  readonly workingDirectory: string;
}

/**
 * What a work item's completion is validated against before
 * `work-item-completed`: the source, the settled requests and the attention
 * set its last reconciliation left, and whether decisions were made against
 * that source, which its scenario-rendering lineage must then preserve.
 */
export interface CompletionBasis {
  readonly commit: string;
  readonly requests: readonly BasisRequest[];
  readonly checkFindings: readonly CheckFindingAt[];
  readonly decided: boolean;
}

/** What a reconciliation leads to: the work item's gate, or a correction its architect assigns. */
export type Reconciled =
  | { readonly kind: 'gate'; readonly basis: CompletionBasis }
  | { readonly kind: 'correct'; readonly reconciliation: string };

/** The durable evidence owner and the architect whose completion is assessed. */
export interface ReconciliationOwner {
  readonly id: string;
  readonly role: 'local-architect' | 'capability-architect';
  readonly request?: string;
  readonly provider?: string;
  readonly completion?: { readonly session: SessionId; readonly ref: string; readonly invocation: string };
}

/** What a reconciliation brief's append did; the completion of its effect. */
export interface BriefAppend {
  readonly session: SessionId | null;
  readonly ref: string | null;
  readonly outcome: BriefAppendOutcome;
  readonly reason: string | null;
}
