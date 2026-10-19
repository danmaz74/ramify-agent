import { createHash } from 'node:crypto';
import type { DurableRecordRef as RecordRef } from '../../subs/task-execution/src/records.js';
import { z } from 'zod';
/** A record the log holds whose body no longer satisfies its schema. */
export class CommittedRecordError extends Error {
  constructor(readonly path: string, readonly errors: readonly string[]) {
    super(`${path}: ${errors.join('; ')}`);
    this.name = 'CommittedRecordError';
  }
}

/**
 * One replayed line, as far as this reader is concerned: the record bodies
 * it carries. It is stated structurally so that the reader is a projection
 * over what the log holds and nothing more.
 */
export interface ReplayedLine {
  readonly transaction: { readonly records: ReadonlyArray<{ readonly path: string; readonly body: unknown }> };
}

export function parseCommittedRecord<T>(schema: z.ZodType<T>, body: unknown, path: string): T {
  const result = schema.safeParse(body);
  if (result.success) return result.data;
  throw new CommittedRecordError(path, result.error.issues.map(issue => `${issue.path.map(String).join('.') || '<root>'}: ${issue.message}`));
}

export function recordHash(body: unknown): string {
  return createHash('sha256').update(`${JSON.stringify(body, null, 2)}\n`).digest('hex');
}
export function refOf(id: string, revision: number, body: unknown): RecordRef {
  return { id, revision, hash: recordHash(body) };
}

/** Exact retained body, newest accepted record first; no mutable journal is needed. */
export function committedBodyOf(lines: readonly ReplayedLine[], path: string): unknown {
 for (let index = lines.length - 1; index >= 0; index--) {
  const record = lines[index]!.transaction.records.find(record => record.path === path);
  if (record !== undefined) return record.body;
 }
 return undefined;
}
