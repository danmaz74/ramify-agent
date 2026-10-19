import type { BuiltinTool, WriteTool, ToolDefinition, GuardedCall, GuardDecision, SettledMutation } from '../../agent/src/interfaces/port.js';
import type { ObservationLog } from './observations.js';
import type { TranscriptNotes } from './transcripts/recorder.js';

export interface EquipContext {
  readonly invocation: string;
  readonly observations: ObservationLog;
  /** The identifier of the call in flight for one tool, as the port reported it. */
  readonly callId: (tool: string) => string;
  /**
   * Text the harness owes the running session, emptied by whoever can carry
   * it. The port reaches a running session with text through the result of a
   * mutating call and through nothing else, so a reminder waits for one.
   */
  readonly reminders: () => string[];
  /** The invocation's transcript, told what the harness decides and where a call's complete output is. */
  readonly transcript?: TranscriptNotes | undefined;
  /**
   * Holds the invocation's idle bound while one command the equipment runs
   * for it is in flight, for that command's own timeout; the returned
   * release is called when the command ends. Absent, nothing is held.
   */
  readonly hold?: ((timeoutMs: number) => () => void) | undefined;
  /** Wait for an owned producer whose own watchdog observes progress and settlement. */
  readonly waitForProducer?: (() => () => void) | undefined;
}

/** The tools and the guard of one invocation. */
export interface Equipment {
  readonly builtinTools?: readonly (BuiltinTool | WriteTool)[] | undefined;
  readonly tools?: readonly ToolDefinition[] | undefined;
  readonly guard?: ((call: GuardedCall) => Promise<GuardDecision>) | undefined;
  /**
   * What runs after each mutating call that executed, whether it succeeded
   * or not: the mutation is observed and the hook check runs, and what the
   * engineer must know before its next step is appended to that call's
   * result.
   */
  readonly afterMutation?: ((call: SettledMutation) => Promise<{ readonly text: string } | null>) | undefined;
  /** Ends what the equipment itself started, before the writer is released. */
  readonly settle?: (() => Promise<void>) | undefined;
  /** Release orphaned guard leases only after the actual operation has drained. */
  readonly drained?: (() => Promise<void>) | undefined;
}
