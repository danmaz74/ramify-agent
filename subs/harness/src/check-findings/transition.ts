import { decideFindingTransaction, type CheckFindingDecided, type CheckFindingRefusal } from './transaction.js';

import type { CheckFindingCommand, CheckFindingState } from '../../subs/check-findings/src/interfaces/check-findings.js';
import type { Transaction } from '../../subs/ledger/src/ledger.js';
import type { RecordRef as CommitRecord } from '../jobs/commit.js';
import type { Mutex } from '../jobs/mutex.js';
import type { CheckFindingCarrierType, RunEvent, RunEventInput, RunLog } from '../run/log.js';

import { checkFindingStateOf } from './state.js';

/*
 * The one way a CheckFinding change reaches the run log (appendix §2.3).
 * Under the run mutex it refuses a terminal log, replays the current
 * CheckFinding state, lets the caller validate the basis its slow work
 * captured against the log as it now stands, asks the child to decide every
 * command in order, and appends the carrier event, its other records and
 * the CheckFinding record copies as one ledger line. An exact redelivery
 * appends nothing.
 *
 * Slow work (an agent's review, a check run, reading sources) happens before
 * this is called and never inside the mutex; what it captured is checked in
 * `build`, which must not wait on anything but the log.
 */

/** What the transition serializes on: a run's mutex and its log. The run service's `Run` is one. */
export interface CheckFindingTarget {
  readonly mutex: Mutex;
  readonly log: RunLog;
}

/** What `build` sees under the mutex: the log as it stands and the CheckFinding state replayed from it. */
export interface CheckFindingBasis {
  readonly log: RunLog;
  readonly state: CheckFindingState;
}

/** The input of a run event that carries CheckFinding events. */
export type CheckFindingCarrierInput = Extract<RunEventInput, { readonly type: CheckFindingCarrierType }>;

/** The carrier run event and every other record it commits, composed from what was decided. */
export interface CheckFindingComposition {
  readonly event: CheckFindingCarrierInput;
  readonly records?: readonly CommitRecord[] | undefined;
}

/** A transition to decide: its commands, and how the carrier is composed once they are decided. */
export interface CheckFindingPlan {
  readonly commands: readonly CheckFindingCommand[];
  /** Pure: it receives the decided events and outcomes and returns the carrier with its own records. */
  readonly compose: (decided: CheckFindingDecided) => CheckFindingComposition;
}

/**
 * Validates the captured basis against the log as it stands and returns the
 * plan, or why the basis no longer holds. Called under the mutex; it reads
 * and decides, and never performs slow work. A build that throws appends
 * nothing, and its error reaches the caller, as a refused command's does.
 */
export type CheckFindingBuild = (basis: CheckFindingBasis) => CheckFindingPlan | { readonly stale: string };

/**
 * `afterEnd` lets a transition follow the run's terminal event: a person's
 * decision about a plan deviation, which outlasts the run. The log accepts
 * only a person's command there.
 */
export interface CheckFindingTransitionOptions {
  readonly afterEnd?: boolean | undefined;
}

/** What deciding a transition under a held mutex returned. */
export type CheckFindingTransaction =
  | { readonly kind: 'transaction'; readonly transaction: Transaction<RunEvent>; readonly decided: CheckFindingDecided }
  | { readonly kind: 'replayed'; readonly decided: CheckFindingDecided }
  | { readonly kind: 'refused'; readonly refusal: CheckFindingRefusal };

/** What committing a transition did. */
export type CheckFindingCommit =
  | { readonly kind: 'committed'; readonly event: RunEvent; readonly decided: CheckFindingDecided }
  | { readonly kind: 'replayed'; readonly decided: CheckFindingDecided }
  | { readonly kind: 'refused'; readonly refusal: CheckFindingRefusal };

/**
 * Decides one transition against the log as it stands, without appending.
 * The caller holds the run mutex and appends the returned transaction in
 * that same hold, as `commitCheckFindingChange` does; a ledger effect whose
 * completion carries CheckFinding events calls this from its `complete`.
 */
export function decideCheckFindingTransaction(log: RunLog, build: CheckFindingBuild, at?: Date, options: CheckFindingTransitionOptions = {}): CheckFindingTransaction {
  const ended = log.terminal;
  if (ended !== undefined && options.afterEnd !== true) return refused({ reason: 'run-ended', message: `Run ${log.runId} has ended with ${ended.type}; it accepts no CheckFinding change` });

  return decideFindingTransaction(checkFindingStateOf(log.ledger), state => build({ log, state }),
    (input, date) => log.carrier(input, date), at);
}

/**
 * Decides and commits one CheckFinding transition under the run mutex, as
 * one ledger line: the carrier event, its records and the CheckFinding
 * record copies, or nothing.
 */
export function commitCheckFindingChange(target: CheckFindingTarget, build: CheckFindingBuild, at?: Date, options: CheckFindingTransitionOptions = {}): Promise<CheckFindingCommit> {
  return target.mutex.run(async () => {
    const decided = decideCheckFindingTransaction(target.log, build, at, options);
    if (decided.kind !== 'transaction') return decided;
    try {
      await target.log.ledger.append(decided.transaction);
    } catch (error) {
      // The ledger measures the line before writing any of it, so nothing was appended.
      if (error instanceof RangeError) return refused({ reason: 'too-large', message: error.message });
      throw error;
    }
    return { kind: 'committed', event: decided.transaction.event, decided: decided.decided };
  });
}

function refused(refusal: CheckFindingRefusal): { readonly kind: 'refused'; readonly refusal: CheckFindingRefusal } {
  return { kind: 'refused', refusal };
}
