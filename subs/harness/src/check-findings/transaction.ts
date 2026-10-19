import { decideCheckFindingChange } from '../../subs/check-findings/src/decide.js';
import { applyCheckFindingEvent } from '../../subs/check-findings/src/replay.js';
import type {
  CheckFindingCommand,
  CheckFindingEvent,
  CheckFindingId,
  CheckFindingRejection,
  CheckFindingState,
} from '../../subs/check-findings/src/interfaces/check-findings.js';
import type { Transaction } from '../../subs/ledger/src/ledger.js';
import type { RecordRef as CommitRecord } from '../jobs/commit.js';
import { checkFindingRecords, maximumCarriedEvents } from './records.js';

/** What one command of the transition led to. */
export interface CheckFindingOutcome {
  /** Every CheckFinding the command opened, attached a report to or changed; for a replay, the one it led to. */
  readonly touched: readonly CheckFindingId[];
  readonly replayed: boolean;
}

/** What the child decided for every command, in order. */
export interface CheckFindingDecided {
  readonly events: readonly CheckFindingEvent[];
  readonly outcomes: readonly CheckFindingOutcome[];
}

/** Why nothing was appended. */
export type CheckFindingRefusal =
  /** The log has its terminal event; nothing more is accepted. */
  | { readonly reason: 'run-ended'; readonly message: string }
  /** `build` found that its captured basis no longer holds. */
  | { readonly reason: 'stale-basis'; readonly message: string }
  /** The child refused command `command` (0-based). */
  | { readonly reason: 'check-finding'; readonly message: string; readonly command: number; readonly rejection: CheckFindingRejection }
  /** Some commands were exact replays and others new: one transition never commits half of an earlier one. */
  | { readonly reason: 'partial-replay'; readonly message: string }
  /** More events than one carrier holds. */
  | { readonly reason: 'too-many-events'; readonly message: string }
  /** The transaction would not fit one ledger line. */
  | { readonly reason: 'too-large'; readonly message: string };

/** The execution wrapper supplies its carrier; the finding rules and record transaction are shared. */
export interface FindingComposition<C> {
  readonly event: C;
  readonly records?: readonly CommitRecord[] | undefined;
}

export interface FindingPlan<C> {
  readonly commands: readonly CheckFindingCommand[];
  readonly compose: (decided: CheckFindingDecided) => FindingComposition<C>;
}

export type FindingTransaction<E> =
  | { readonly kind: 'transaction'; readonly transaction: Transaction<E>; readonly decided: CheckFindingDecided }
  | { readonly kind: 'replayed'; readonly decided: CheckFindingDecided }
  | { readonly kind: 'refused'; readonly refusal: CheckFindingRefusal };

/** Decide against the caller's current state while its writer mutex is held. */
export function decideFindingTransaction<E, C extends { readonly type: string; readonly data: unknown }>(
  initial: CheckFindingState,
  build: (state: CheckFindingState) => FindingPlan<C> | { readonly stale: string },
  carrier: (input: C, at?: Date) => E,
  at?: Date,
): FindingTransaction<E> {
  let state = initial;
  const plan = build(state);
  if ('stale' in plan) return refused({ reason: 'stale-basis', message: plan.stale });

  const events: CheckFindingEvent[] = [];
  const outcomes: CheckFindingOutcome[] = [];
  for (const [index, command] of plan.commands.entries()) {
    const change = decideCheckFindingChange(state, command);
    if (!change.ok) {
      return refused({ reason: 'check-finding', command: index, rejection: change.rejection, message: `Command ${index + 1} was refused (${change.rejection.code}): ${change.rejection.message}` });
    }
    for (const event of change.events) {
      const applied = applyCheckFindingEvent(state, event);
      // The child applies its own events while deciding; a refusal here is a defect, never a user error.
      if (!applied.ok) throw new Error(`The CheckFinding child returned an event it cannot apply: ${applied.rejection.message}`);
      state = applied.state;
    }
    events.push(...change.events);
    outcomes.push({ touched: change.touched, replayed: change.replayed });
  }
  const decided: CheckFindingDecided = { events, outcomes };

  const replays = outcomes.filter(outcome => outcome.replayed).length;
  if (replays > 0 && replays === outcomes.length) return { kind: 'replayed', decided };
  if (replays > 0) {
    return refused({ reason: 'partial-replay', message: `${replays} of ${outcomes.length} reports were already accepted; a transition commits all of its reports or none` });
  }
  if (events.length > maximumCarriedEvents) {
    return refused({ reason: 'too-many-events', message: `The transition decided ${events.length} CheckFinding events; one run event carries at most ${maximumCarriedEvents}` });
  }

  const composition = plan.compose(decided);
  const carried = (composition.event.data as { readonly checkFindings?: readonly CheckFindingEvent[] }).checkFindings ?? [];
  if (!sameEvents(carried, events)) throw new Error(`The ${composition.event.type} event does not carry exactly the decided CheckFinding events`);
  const event = carrier(composition.event, at);
  return {
    kind: 'transaction',
    transaction: { event, records: [...(composition.records ?? []), ...checkFindingRecords(events)] },
    decided,
  };
}

function refused(refusal: CheckFindingRefusal): { readonly kind: 'refused'; readonly refusal: CheckFindingRefusal } {
  return { kind: 'refused', refusal };
}

function sameEvents(a: readonly CheckFindingEvent[], b: readonly CheckFindingEvent[]): boolean {
  return a.length === b.length && a.every((event, index) => event === b[index] || JSON.stringify(event) === JSON.stringify(b[index]));
}
