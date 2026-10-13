import { z } from 'zod';
import type { SessionOperationReceipt } from '../../subs/agent/src/interfaces/session-operations.js';
import { openSessionStore, type LedgerSessionStore } from './session-store.js';

export const beadsStageInputSchema = z.object({
  runId: z.string().min(1), sourceRef: z.string().nullable(), context: z.string(), workspace: z.string().min(1),
  executable: z.string().min(1).optional(), outcome: z.string().optional(),
}).strict();
export type BeadsStageInput = z.infer<typeof beadsStageInputSchema>;
export interface BeadsBinding {
  readonly id: string; readonly mention: string; readonly relevance: string;
  readonly issue: Readonly<Record<string, unknown>>;
}
export interface BeadsMutation {
  readonly id: string; readonly status: 'in_progress' | 'closed'; readonly reason: string;
  readonly phase: 'intent' | 'confirmed'; readonly observedStatus?: string;
  readonly delivery?: 'observed' | 'verified';
}
export interface BeadsStage {
  readonly input: BeadsStageInput; readonly status: 'pending' | 'running' | 'completed';
  readonly reason: string | null; readonly receipt: SessionOperationReceipt | null;
  readonly observations: readonly unknown[];
  readonly submission: unknown | null;
}
export interface BeadsRunState {
  readonly schema: 'ramify-agent.beads/1'; readonly runId: string;
  readonly start: BeadsStage | null; readonly finish: BeadsStage | null;
  readonly bindings: readonly BeadsBinding[]; readonly mutations: readonly BeadsMutation[];
}
const bindingSchema = z.object({ id: z.string(), mention: z.string(), relevance: z.string(), issue: z.record(z.string(), z.unknown()) });
const stageSchema = z.object({ input: beadsStageInputSchema, status: z.enum(['pending', 'running', 'completed']), reason: z.string().nullable(), receipt: z.unknown().nullable(), observations: z.array(z.unknown()), submission: z.unknown().nullable() });
const stateSchema = z.object({ schema: z.literal('ramify-agent.beads/1'), runId: z.string(), start: stageSchema.nullable(), finish: stageSchema.nullable(),
  bindings: z.array(bindingSchema), mutations: z.array(z.object({ id: z.string(), status: z.enum(['in_progress', 'closed']), reason: z.string(), phase: z.enum(['intent', 'confirmed']), observedStatus: z.string().optional(), delivery: z.enum(['observed', 'verified']).optional() })) }).strict();

/** Administrative state uses the same CAS store, independently of main run publication. */
export class BeadsStateStore {
  private readonly queues = new Map<string, Promise<unknown>>();
  private constructor(private readonly store: LedgerSessionStore) {}
  static async open(directory: string): Promise<BeadsStateStore> { return new BeadsStateStore(await openSessionStore({ directory })); }
  async read(runId: string): Promise<BeadsRunState | null> {
    const record = await this.store.read(runId, 'beads-administration');
    if (!record) return null;
    const state = stateSchema.parse(record.body) as BeadsRunState;
    if (state.runId !== runId) throw new Error('Beads administration run identity mismatch');
    return state;
  }
  update(runId: string, transform: (state: BeadsRunState) => BeadsRunState): Promise<BeadsRunState> {
    const pending = (this.queues.get(runId) ?? Promise.resolve()).then(() => this.updateOwned(runId, transform));
    const tail = pending.catch(() => undefined);
    this.queues.set(runId, tail);
    void tail.then(() => { if (this.queues.get(runId) === tail) this.queues.delete(runId); });
    return pending;
  }
  private async updateOwned(runId: string, transform: (state: BeadsRunState) => BeadsRunState): Promise<BeadsRunState> {
    const record = await this.store.read(runId, 'beads-administration');
    const previous = record ? stateSchema.parse(record.body) as BeadsRunState : { schema: 'ramify-agent.beads/1' as const, runId, start: null, finish: null, bindings: [], mutations: [] };
    const next = transform(previous);
    stateSchema.parse(next);
    if (next.runId !== runId) throw new Error('Beads administration run identity mismatch');
    const committed = await this.store.commit({ runId, expected: [{ id: 'beads-administration', revision: record?.revision ?? null }],
      records: [{ runId, id: 'beads-administration', revision: (record?.revision ?? 0) + 1, schema: 'ramify-agent.session-operation/1', body: next as unknown as Record<string, unknown> }], payloads: [] });
    if (committed.kind !== 'committed') throw new Error(committed.reason);
    return next;
  }
  close(): Promise<void> { return this.store.close(); }
}
