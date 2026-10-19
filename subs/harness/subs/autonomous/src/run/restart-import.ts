
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import type { LedgerEntry } from '../../../ledger/src/ledger.js';

import { committedRecords } from './committed-records.js';
import { recordHash } from '../../../../src/jobs/committed-reader.js';
import { localArchitectToolName } from '../../subs/work-coordination/src/work/submission.js';

import { reconciliationToolName } from '../../../reviews/src/reconciliation.js';
import { carriedCheckFindings, runEventSchema, type RunEvent } from './log.js';
import { gateOperationSchema } from '../../subs/acceptance/src/gate-records.js';
import { runRecordSchema, runLayout } from './records.js';
import { invocationWorkSchema } from '../../../task-execution/src/records.js';

import { recoveryHash, recoveryIdentitySchema } from './recovery-admission.js';

const text = z.string().min(1);
const hash = z.string().regex(/^[0-9a-f]{64}$/u);
const relative = text.refine(path => !path.startsWith('/') && !path.includes('\\') && !path.split('/').includes('..'), 'must remain within the retained run');
const recordSchema = z.object({ sourceRun: text, sequence: z.int().positive(), path: relative, id: text,
  revision: z.int().nonnegative(), hash, body: z.unknown() }).strict();
// The event validator runs after parsing, avoiding a dependency from the log's
// event declaration to its own import format at module initialization.
const entrySchema = z.object({ sequence: z.int().positive(), at: z.string(), transaction: z.object({
  event: z.unknown(), records: z.array(z.object({ path: relative, id: text, revision: z.int().nonnegative(), body: z.unknown() }).strict()),
}).strict() }).strict();
export const restartRecognizedEffectSchema = z.object({ sourceRun: text, gate: text, commit: text, tree: text, recordHash: hash,
  proposedBy: text.nullable(), checkpoint: z.literal('work-item'), subjectWorkItem: text, producerSettlement: z.array(text).min(1).optional() }).strict();
export type RestartRecognizedEffect = z.infer<typeof restartRecognizedEffectSchema>;

export const restartImportSchema = z.object({
  schema: z.literal('ramify-agent.restart-import/1'), sourceRun: text, sourceVersion: z.int().positive(), sourceDigest: hash,
  sourceRecord: runRecordSchema, ancestors: z.array(z.object({ sourceRun: text, sourceVersion: z.int().positive(), sourceDigest: hash, importDigest: hash }).strict()).default([]), inventory: z.array(entrySchema), records: z.array(recordSchema),
  pending: z.object({ kind: z.enum(['invocation', 'final-gate']), sourceRun: text,
    role: text.optional(), work: invocationWorkSchema.optional(), originalInvocation: text.optional(), submission: text.optional(),
  }).strict(),
  preserved: z.array(text), inapplicable: z.array(text), outstanding: z.array(text),
  sourceIdentity: recoveryIdentitySchema.optional(), recognizedEffects: z.array(restartRecognizedEffectSchema),
  policyTransition: z.object({ from: z.enum(['run-policy/7', 'run-policy/8']), to: z.literal('run-policy/8') }).strict(),
  digest: hash,
}).strict();
export interface RestartImport extends Omit<z.infer<typeof restartImportSchema>, 'inventory'> {
  readonly inventory: readonly LedgerEntry<RunEvent>[];
}
/** Lifecycle evidence remains source history; it never licenses successor execution. */
const lifecycle = new Set(['job-started', 'job-continued', 'job-completed', 'job-failed', 'job-stopped', 'job-interrupted', 'stop-requested',
  'session-finished', 'continuity-policy-adopted', 'operation-recovery-attempt', 'operation-recovery-pausing',
  'operation-recovery-paused', 'operation-recovery-replied',
  'debug-pausing', 'debug-paused', 'debug-exchange-admitted', 'debug-exchange-settled', 'debug-resumed']);

/** Hash-valid bytes also need internally consistent source/task correlations. */
export function validateRestartImport(value: unknown): RestartImport {
  const parsed = restartImportSchema.parse(value);
  const { digest, ...body } = parsed;
  if (recoveryHash(body) !== digest) throw new Error('Restart import digest does not authenticate its body');
  const allowed = new Map([[parsed.sourceRun, parsed.sourceVersion], ...parsed.ancestors.map(ancestor => [ancestor.sourceRun, ancestor.sourceVersion] as [string, number])]);
  if (parsed.sourceRecord.jobId !== parsed.sourceRun || !allowed.has(parsed.pending.sourceRun)) throw new Error('Restart import source run identities differ');
  const inventory = parsed.inventory as LedgerEntry<RunEvent>[];
  const seen = new Set<string>();
  for (const entry of inventory) {
    const event = runEventSchema.parse(entry.transaction.event);
    if (!allowed.has(event.jobId) || entry.sequence > allowed.get(event.jobId)! || event.sequence !== entry.sequence || seen.has(`${event.jobId}:${event.sequence}`) || lifecycle.has(event.type)) throw new Error('Restart inventory contains an invalid historical authority or ordering');
    seen.add(`${event.jobId}:${event.sequence}`);
    for (const record of entry.transaction.records) {
      if (!parsed.records.some(reference => reference.sourceRun === event.jobId && reference.sequence === entry.sequence && reference.path === record.path
        && reference.id === record.id && reference.revision === record.revision && reference.hash === recordHash(record.body))) throw new Error(`Restart record ${record.path} has no authenticated source reference`);
    }
  }
  for (const record of parsed.records) if (!allowed.has(record.sourceRun) || record.sequence > allowed.get(record.sourceRun)! || recordHash(record.body) !== record.hash) throw new Error(`Restart source record ${record.path} changed`);
  const records = committedRecords(inventory);
  const effects = new Set<string>();
  for (const effect of parsed.recognizedEffects) {
    const qualified = `${effect.sourceRun}:${effect.gate}`;
    if (effects.has(qualified) || !allowed.has(effect.sourceRun)) throw new Error('Restart recognized effect identity is duplicated or names another source');
    effects.add(qualified);
    const reference = parsed.records.find(record => record.sourceRun === effect.sourceRun && record.path === runLayout.gateOperation(effect.gate) && record.hash === effect.recordHash);
    if (!reference) throw new Error(`Recognized gate effect ${qualified} has no authenticated operation record`);
    const operation = gateOperationSchema.parse(reference.body);
    if (operation.checkpoint !== effect.checkpoint || operation.request.id !== effect.gate || operation.request.runId !== effect.sourceRun
      || operation.request.proposedBy !== effect.proposedBy || operation.request.subject.workItem !== effect.subjectWorkItem
      || !records.workItems.some(item => item.id === effect.subjectWorkItem)
      || !inventory.some(entry => entry.transaction.event.jobId === effect.sourceRun && entry.transaction.event.type === 'gate-committing' && entry.transaction.event.data.gate === effect.gate)) {
      throw new Error(`Recognized gate effect ${qualified} differs from its original operation authority`);
    }
  }
  const workIds = new Set(records.workItems.map(item => item.id));
  for (const item of records.workItems) {
    if (item.startedFor !== null && !workIds.has(item.startedFor) || item.follows !== undefined && !workIds.has(item.follows)) throw new Error(`Restart work item ${item.id} has a missing dependency`);
  }
  for (const assignment of records.assignments.values()) if (!workIds.has(assignment.workItem)) throw new Error(`Restart assignment ${assignment.id} has no owning work item`);
  for (const result of records.results.values()) {
    if (!records.assignments.has(result.iteration) || result.invocations.some(id => !records.invocations.has(id))) throw new Error(`Restart iteration ${result.iteration} has a missing assignment or invocation`);
  }
  for (const requirement of records.requirements.values()) if (!workIds.has(requirement.workItem) || !records.obligations.has(requirement.obligation)) throw new Error(`Restart requirement ${requirement.id} has a missing owner or obligation`);
  for (const handback of records.capabilityHandbacks.values()) {
    if (!records.capabilityTasks.has(handback.task) || !records.capabilityRequests.has(handback.request)) throw new Error(`Restart handback ${handback.task} has a missing task or request`);
  }
  if (!inventory.some(entry => entry.transaction.event.type === 'analysis-accepted')) throw new Error('Restart import has no accepted analysis');
  if (parsed.pending.kind === 'invocation') {
    const invocation = records.invocations.get(parsed.pending.originalInvocation ?? '');
    if (!invocation || invocation.role !== parsed.pending.role || recoveryHash(invocation.work) !== recoveryHash(parsed.pending.work)
      || !records.workItems.some(item => item.id === parsed.pending.work?.workItem)
      || !inventory.some(entry => entry.transaction.event.type === 'invocation-started' && entry.transaction.event.jobId === parsed.pending.sourceRun && entry.transaction.event.data.invocation === invocation.id)) throw new Error('Restart pending task does not match its exact source invocation');
    const declarations = invocation.prompt.manifest?.entries as Array<{ key?: string }> | undefined;
    const designated = [...declarations ?? []].reverse().find(entry => [localArchitectToolName, reconciliationToolName, 'submit_work_orientation'].includes(entry.key?.slice(5) ?? '') && entry.key?.startsWith('tool:'))?.key?.slice(5);
    if (!designated || designated !== parsed.pending.submission) throw new Error('Restart pending task has a different designated submission');
  }
  return { ...parsed, inventory };
}

/** Read initialization only: no intent from this inventory is an executable effect. */
export function restartWorkflowEntries(seed: RestartImport): readonly (LedgerEntry<RunEvent> & { readonly source: { readonly runId: string; readonly sequence: number } })[] {
  validateRestartImport(seed);
  const inapplicable = new Set(seed.inapplicable);
  const retained = seed.inventory.filter(entry => {
    const event = entry.transaction.event;
    if (inapplicable.has(`event:${event.jobId}:${event.sequence}`) && !carriedCheckFindings(event).length && !['gate-attempted', 'review-attempt-finished', 'nonfunctional-assessed', 'candidate-bound-to-gate'].includes(event.type)) return false;
    // Terminal cleanup cannot settle a missing review obligation.
    return true;
  });
  return retained.map((entry, index) => {
    const event = entry.transaction.event;
    const data = event.type === 'review-attempt-finished' && (event.data.reason === 'stopped' || inapplicable.has(`event:${event.jobId}:${event.sequence}`)) ? { ...event.data, settles: false } : event.data;
    return { ...entry, source: { runId: event.jobId, sequence: event.sequence }, sequence: index - retained.length,
      transaction: { ...entry.transaction, event: { ...event, data, sequence: index - retained.length } as RunEvent } };
  });
}

export async function readRestartImport(directory: string, expectedDigest: string): Promise<RestartImport> {
  const seed = validateRestartImport(JSON.parse(await readFile(join(directory, runLayout.restartImport), 'utf8')));
  if (seed.digest !== expectedDigest) throw new Error('Restart initialization names a different import digest');
  return seed;
}
