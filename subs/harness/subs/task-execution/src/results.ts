import type { InterruptionEvidence } from '../../agent/src/interfaces/port.js';
import type { InvocationOutcome, SessionFinishReason, SessionId } from './records.js';
import type { CallInFlight } from './port-events.js';

/** What one invocation ended with. `value` is present only for an accepted submission. */
export interface InvocationResult<T> {
  readonly interruptionEvidence?: InterruptionEvidence;
  readonly id: string;
  readonly ended: InvocationOutcome['ended'];
  readonly value: T | undefined;
  /** The point the session's history reached, for a turn that continues it. */
  readonly ref: string;
  readonly outcomeKind: string;
  /** The session the invocation belongs to; empty where no invocation started. */
  readonly session: SessionId;
  /** Whether the harness kept the session to use it again. */
  readonly kept: boolean;
  /** The bound or fault that interrupted it, where one did. */
  readonly interruption?: InvocationOutcome['interruption'];
  /** What ended a failed invocation, as its outcome records it. */
  readonly error?: string | undefined;
  /** The mode the executor actually started the session in; absent where none started. */
  readonly actual?: 'fresh' | 'continue' | 'fork' | undefined;
  /** How long the invocation ran, where its session started. */
  readonly elapsedMs?: number | undefined;
  /** The tool calls in flight when it ended: when a bound fired, or when its outcome arrived. */
  readonly inFlight?: readonly CallInFlight[] | undefined;
  /** The text of its last assistant message that had any. */
  readonly lastText?: string | null | undefined;
  /** A writer's: every path that differed from its base when its session settled. */
  readonly changed?: readonly string[] | undefined;
  /** Whether the agent session could not start, so the invocation ended before any model call. */
  readonly notStarted?: boolean | undefined;
  readonly pending?: boolean;
  readonly resource?: 'context' | 'stall';
  readonly resourceReason?: string;
  readonly checkpointReason?: string;
  readonly settlementConfirmed?: boolean;
  readonly verdicts?: readonly { readonly accepted: boolean; readonly answer: string }[];
}

/** What the harness does with a session when one of its invocations ends. */
export type SessionKeeping = { readonly kept: true } | { readonly kept: false; readonly finished: SessionFinishReason };

export const kept: SessionKeeping = { kept: true };
export const finished = (reason: SessionFinishReason): SessionKeeping => ({ kept: false, finished: reason });

/** What a step's live output shows as the invocation happens. */
export type InvocationProgress =
  | { readonly type: 'started'; readonly invocation: string; readonly session: SessionId; readonly message: string }
  | { readonly type: 'tool-call'; readonly callId: string; readonly tool: string; readonly input: unknown }
  | { readonly type: 'tool-error'; readonly callId: string; readonly tool: string; readonly text: string }
  | { readonly type: 'message'; readonly text: string }
  /** Text of the harness's own in a tool result: a refusal by the guard, or what is appended after a mutation. */
  | { readonly type: 'harness-text'; readonly callId: string; readonly tool: string; readonly kind: 'refusal' | 'appended'; readonly text: string }
  | { readonly type: 'submission'; readonly input: unknown; readonly accepted: boolean; readonly answer: string };

/** The outcome of an invocation whose session never ran: stopped, with nothing observed. */
export function stoppedOutcome(): Omit<InvocationOutcome, 'schema' | 'invocation'> {
  return {
    ended: 'stopped',
    rejectedSubmissions: 0,
    disposition: 'incomplete',
    submission: null,
    settled: { confirmed: true, at: new Date().toISOString(), groupsKilled: 0, lateWrites: [] },
    outsideScope: [],
    usage: { unavailable: 'the session never started' },
    elapsedMs: 0,
  };
}
