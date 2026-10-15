import type { InvocationOutcome, LineEventSummary } from '../../../src/run/records.js';

/** One session, as the run's records describe it. Every session counts, whatever ended it. */
export interface SessionEntry {
  readonly invocation: string;
  readonly role: string;
  readonly ended: InvocationOutcome['ended'];
  readonly usage: InvocationOutcome['usage'];
  readonly lines?: LineEventSummary | undefined;
}

export interface SessionMetrics {
  readonly sessions: number;
  readonly withChange: number;
  readonly withoutChange: number;
  readonly added: number;
  readonly deleted: number;
  readonly tokens: number | null;
  readonly usageUnavailable: number;
  readonly byEnd: Record<string, number>;
}

/** Descriptive summary only; failed, stopped, repaired and unchanged sessions remain included. */
export function sessionMetrics(entries: readonly SessionEntry[]): SessionMetrics {
  const byEnd: Record<string, number> = {};
  let withChange = 0;
  let added = 0;
  let deleted = 0;
  let tokens: number | null = 0;
  let usageUnavailable = 0;
  for (const entry of entries) {
    byEnd[entry.ended] = (byEnd[entry.ended] ?? 0) + 1;
    const paths = entry.lines?.paths ?? [];
    if (paths.length > 0) withChange += 1;
    for (const path of paths) {
      added += path.added;
      deleted += path.deleted;
    }
    if ('unavailable' in entry.usage) {
      usageUnavailable += 1;
      tokens = null;
    } else if (tokens !== null) {
      tokens += entry.usage.total;
    }
  }
  return {
    sessions: entries.length,
    withChange,
    withoutChange: entries.length - withChange,
    added,
    deleted,
    tokens,
    usageUnavailable,
    byEnd,
  };
}
