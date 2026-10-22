import { z } from 'zod';

import { modulePathSchema, sha256Schema, viewIdentitySchema } from '../../../src/interfaces/protocol/evidence.js';

const text = z.string().min(1);
export const measurementSnapshotSchema = z.object({
  schema: z.literal('ramify-agent.measurement-snapshot/1'),
  id: text,
  policy: z.literal('scope-size/2'),
  /** The run branch's head when it was taken. */
  head: z.string(),
  /** The captured `ramify.measure/2` document, verbatim, with its revision. */
  measure: z.union([
    z.object({ revision: z.string(), document: z.unknown(), hash: sha256Schema }).strict(),
    z.object({ unavailable: text }).strict(),
  ]),
  view: viewIdentitySchema.nullable(),
  /** Supplementary bytes outside Ramify's inventory: prompts, skills, the captured plan. */
  supplementary: z.array(z.object({ path: text, bytes: z.int().nonnegative() }).strict()),
}).strict();
export type MeasurementSnapshot = z.infer<typeof measurementSnapshotSchema>;

/**
 * One component of `S_s`, the scope size of one invocation. A component
 * whose source the snapshot does not hold is `unavailable` with its reason:
 * the total is then unavailable with its known subtotal beside it, never a
 * zero, and a proposed module's size is unknown.
 */
export const lineEventSummarySchema = z.object({
  schema: z.literal('ramify-agent.line-events/1'),
  invocation: text,
  paths: z.array(z.object({
    path: text,
    owner: modulePathSchema.nullable(),
    added: z.int().nonnegative(),
    deleted: z.int().nonnegative(),
    binary: z.boolean(),
    /** A binary file's size: git reports no lines for it and none is invented. Null for a text file. */
    bytes: z.int().nonnegative().nullable(),
  }).strict()),
  unmapped: z.object({ paths: z.int().nonnegative(), added: z.int().nonnegative(), deleted: z.int().nonnegative() }).strict(),
  coverage: z.enum(['complete', 'partial']),
  gaps: z.array(z.string()),
}).strict();
export type LineEventSummary = z.infer<typeof lineEventSummarySchema>;

export type SnapshotId = string;
export const snapshotId = (count: number): string => `ms-${String(count).padStart(4, '0')}`;
