import { z } from 'zod';
import type { CodexPendingRequest, CodexReadiness, CodexSettlement } from '../../agent/subs/codex/src/interfaces/provider.js';

export const coordinatorStartSchema = z.object({
  projectRoot: z.string().min(1), planId: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/), jobId: z.string().min(1).optional(),
  commandId: z.string().min(1), model: z.string().min(1).default('gpt-6-astra'), workerModel: z.string().min(1).default('gpt-6-sol'),
  assessmentModel: z.string().min(1).optional(), replaceMcp: z.array(z.string().regex(/^[A-Za-z0-9_-]+$/)).default([]),
  resumeFrom: z.string().regex(/^coord-[a-f0-9-]{36}$/).optional(), freshThread: z.boolean().optional(),
  skill: z.string().min(1), message: z.string().default(''), codexExecutable: z.string().min(1).optional(),
}).strict();
export type CoordinatorStart = z.infer<typeof coordinatorStartSchema>;
export const coordinatorCommandSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('send'), commandId: z.string().min(1), message: z.string().trim().min(1) }).strict(),
  z.object({ action: z.literal('respond'), commandId: z.string().min(1), requestId: z.string().min(1), response: z.union([
    z.object({ kind: z.literal('approval'), choiceId: z.string() }).strict(),
    z.object({ kind: z.literal('user-input'), answers: z.record(z.string(), z.array(z.string().min(1)).min(1)) }).strict(),
    z.object({ kind: z.literal('mcp-elicitation'), action: z.enum(['accept', 'decline', 'cancel']), content: z.record(z.string(), z.union([z.string(), z.number().finite(), z.boolean(), z.array(z.string())])).optional() }).strict(),
  ]) }).strict(),
  z.object({ action: z.literal('interrupt'), commandId: z.string().min(1), turnId: z.string().min(1) }).strict(),
  z.object({ action: z.literal('stop'), commandId: z.string().min(1) }).strict(),
]);
export type CoordinatorCommand = z.infer<typeof coordinatorCommandSchema>;
export interface CoordinatorProcess { readonly pid: number; readonly startedAt: string; readonly processStart: string | null }
export interface CoordinatorProgress { readonly cursor: number; readonly at: string; readonly event: unknown }
export interface CoordinatorWorker {
  readonly id: string; readonly parentThreadId: string; readonly model: string | null; readonly ephemeral: boolean;
  turnStatus?: string; equipment: 'unverified' | 'verified' | 'unavailable'; error?: string;
}
export interface CoordinatorRecord {
  readonly schema: 'ramify-agent.coordinator/1'; readonly id: string; readonly generation: string;
  readonly projectRoot: string; readonly planId: string; jobId: string | null; readonly launchedAt: string;
  readonly owner: CoordinatorProcess; readonly model: string; readonly workerModel: string;
  readonly guardian?: { readonly path: string; readonly generation: string };
  readonly assessmentModel?: string; readonly codexExecutable?: string;
  readonly resumeFrom?: string;
  /** Effective context decision frozen at admission; startHash retains caller input. */
  readonly freshThread?: boolean;
  recovery?: { thread: 'pending' | 'resumed' | 'fresh'; reason: string | null; uncertainCommands: readonly { commandId: string; action: string }[] };
  readonly startCommandId: string; readonly startHash: string; readonly skill: string; readonly replaceMcp: readonly string[];
  phase: 'starting' | 'listening' | 'preparing' | 'ready' | 'provider-exited' | 'error' | 'stopping' | 'unsettled' | 'stopped';
  initialTurnAcknowledged?: boolean;
  endpoint: string | null; threadId: string | null; readiness: CodexReadiness | null;
  turn: { id: string; status: string; error: string | null } | null;
  pending: readonly CodexPendingRequest[]; workers: CoordinatorWorker[];
  observedAt: string; error: string | null; settlement: CodexSettlement | null;
  cursor: number; progress: CoordinatorProgress[]; ownershipReleased: boolean;
}
export interface CoordinatorSnapshot {
  readonly record: CoordinatorRecord; readonly stale: boolean;
  readonly assessments: readonly { id: string; status: string; revision: number; error: string | null }[];
  readonly observationError?: string;
}
export interface CoordinatorRuntime { readonly id: string; readonly generation: string; readonly endpoint: string; readonly token: string }
export interface CoordinatorControlResult { readonly commandId: string; readonly state: 'completed' | 'failed' | 'uncertain'; readonly result?: unknown; readonly error?: { kind: string; message: string } }
export interface CoordinatorWatch { readonly snapshot: CoordinatorSnapshot; readonly events: readonly CoordinatorProgress[]; readonly gap: boolean; readonly cursor: number }
