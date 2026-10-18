/** Facts the task owner obtains from ordinary ownership and durable results. */
export interface TaskReentryFacts<T> {
  readonly authorized: boolean;
  readonly stopped?: boolean;
  readonly settled: boolean;
  readonly accepted?: { readonly value: T };
  /** Only consequential operations whose owners cannot establish their outcome. */
  readonly unresolved?: readonly string[];
}

export type TaskReentry<T> =
  | { readonly action: 'execute' }
  | { readonly action: 'deliver'; readonly value: T }
  | { readonly action: 'wait'; readonly reason: string };

/** Session history and runtime identities are optional context, never authority. */
export function decideTaskReentry<T>(facts: TaskReentryFacts<T>): TaskReentry<T> {
  if (facts.stopped) return { action: 'wait', reason: 'The task was explicitly stopped' };
  if (!facts.authorized) return { action: 'wait', reason: 'The task is not currently authorized' };
  if (!facts.settled) return { action: 'wait', reason: 'The former attempt or its child processes have not settled' };
  if (facts.unresolved?.length) return { action: 'wait', reason: `Consequential operation outcomes remain unresolved: ${facts.unresolved.join(', ')}` };
  if (facts.accepted) return { action: 'deliver', value: facts.accepted.value };
  return { action: 'execute' };
}

/** A single bounded allowance for replacement after transport/resource interruption. */
export function mayRetryTask(facts: { readonly attempt: number; readonly limit: number; readonly classification: string }): boolean {
  return (facts.classification === 'transport' || facts.classification === 'resource') && facts.attempt < facts.limit;
}

/** Failed attempts leave pending work; resource bounds share the transport allowance. */
export function taskInterruption(facts: { readonly ended: string; readonly interruption?: string; readonly classification?: string }): string | null {
  if (facts.ended === 'resource-pending' || facts.ended === 'context-budget-reached'
    || facts.interruption === 'idle-timeout' || facts.interruption === 'absolute-timeout') return 'resource';
  return facts.ended === 'failed' ? facts.classification ?? 'unknown' : null;
}

/** Provider delay is bounded; resource handoffs need no transport backoff. */
export function taskRetryDelay(facts: { readonly attempt: number; readonly classification: string; readonly retryAfterMs?: number }): number {
  if (facts.classification !== 'transport') return 0;
  return Math.min(30_000, Math.max(0, facts.retryAfterMs ?? 250 * 2 ** Math.min(facts.attempt, 6)));
}

/** The standalone adapter supplies its execution cancellation signal. */
export async function waitForTaskRetry(milliseconds: number, signal?: AbortSignal): Promise<boolean> {
  if (signal?.aborted) return false;
  if (milliseconds <= 0) return true;
  return new Promise(resolve => {
    const timer = setTimeout(() => finish(true), milliseconds);
    const cancelled = () => finish(false);
    function finish(proceed: boolean) { clearTimeout(timer); signal?.removeEventListener('abort', cancelled); resolve(proceed); }
    signal?.addEventListener('abort', cancelled, { once: true });
    if (signal?.aborted) finish(false);
  });
}
