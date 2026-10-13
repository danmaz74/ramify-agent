import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { z } from 'zod';
import type { LedgerEntry } from '../../subs/ledger/src/ledger.js';
import { replayCapabilityState } from '../capability/state.js';
import { replayCheckFindingEvents } from '../../subs/check-findings/src/replay.js';
import { committedRecords, recordHash } from '../work/committed.js';
import { localArchitectToolName } from '../work/submission.js';
import { unsettledRequests } from '../reviews/state.js';
import { reconciliationToolName } from '../reviews/reconciliation.js';
import { carriedCheckFindings, runEventSchema, type RunEvent } from './log.js';
import { gateOperationSchema, invocationWorkSchema, promptPackageManifestSchema, runRecordSchema, runLayout, type RunRecord } from './records.js';
import { readCapturedDocuments } from './document-inputs.js';
import { recoveryHash, recoveryIdentitySchema, type RecoveryIdentity } from './recovery-admission.js';

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
export interface RestartImportPlan {
  readonly seed: RestartImport | null;
  readonly blockers: readonly string[];
  readonly preserved: readonly string[];
  readonly inapplicable: readonly string[];
}

/** Lifecycle evidence remains source history; it never licenses successor execution. */
const lifecycle = new Set(['job-started', 'job-completed', 'job-failed', 'job-stopped', 'job-interrupted', 'stop-requested',
  'session-finished', 'continuity-policy-adopted', 'operation-recovery-attempt', 'operation-recovery-pausing',
  'operation-recovery-paused', 'operation-recovery-replied',
  'debug-pausing', 'debug-paused', 'debug-exchange-admitted', 'debug-exchange-settled', 'debug-resumed']);

/** Pure planning over authenticated owner observations; this function runs no effects. */
export function planRestartImport(input: { readonly record: RunRecord; readonly entries: readonly LedgerEntry<RunEvent>[];
  readonly sourceDigest: string; readonly sourceIdentity?: RecoveryIdentity; readonly currentIdentity?: RecoveryIdentity; readonly previousImport?: RestartImport; readonly recognizedEffects?: readonly RestartRecognizedEffect[] }): RestartImportPlan {
  const blockers: string[] = [];
  const { record } = input;
  const physical = input.entries.filter(entry => entry.sequence > 0);
  const entries = input.previousImport ? [...input.previousImport.inventory, ...physical] : physical;
  const ancestors = input.previousImport ? [...input.previousImport.ancestors, { sourceRun: input.previousImport.sourceRun, sourceVersion: input.previousImport.sourceVersion, sourceDigest: input.previousImport.sourceDigest, importDigest: input.previousImport.digest }] : [];
  const inheritedInapplicable = new Set(input.previousImport?.inapplicable ?? []);
  const events = entries.map(entry => entry.transaction.event).filter(event => !inheritedInapplicable.has(`event:${event.jobId}:${event.sequence}`) || ['gate-attempted', 'review-attempt-finished', 'nonfunctional-assessed', 'candidate-bound-to-gate'].includes(event.type));
  const ended = events.find(event => ['job-completed', 'job-failed', 'job-stopped', 'job-interrupted'].includes(event.type));
  if (!physical.some(entry => ['job-completed', 'job-failed', 'job-stopped', 'job-interrupted'].includes(entry.transaction.event.type))) blockers.push('Source run is nonterminal; use same-run recovery');
  else if (ended?.type === 'job-completed') blockers.push('Completed source has no unfinished execution');
  else if (ended?.type === 'job-stopped' || events.some(event => event.type === 'stop-requested')) blockers.push('The recorded operator stop stands');
  if (!events.some(event => event.type === 'analysis-accepted')) blockers.push('Unsupported boundary: accepted initial analysis is required');
  const preserved = entries.flatMap(entry => entry.transaction.records.map(body => `${entry.transaction.event.jobId}:${body.path}@${body.revision}`));
  const inapplicable: string[] = [...inheritedInapplicable];
  const outstanding: string[] = [];
  const recognizedEffects = [...input.previousImport?.recognizedEffects ?? [], ...input.recognizedEffects ?? []];
  for (const effect of recognizedEffects) {
    preserved.push(`${effect.sourceRun}:effect:${effect.gate}:${effect.commit}`);
    outstanding.push(`Fresh qualification for recognized effect ${effect.sourceRun}:${effect.gate}`);
  }
  let records: ReturnType<typeof committedRecords>;
  try {
    records = committedRecords(entries);
    const replayed = replayCheckFindingEvents(events.flatMap(carriedCheckFindings));
    if (!replayed.ok) throw new Error(replayed.rejection.message);
    for (const finding of replayed.state.findings.values()) if (finding.standing === 'open') outstanding.push(`check-finding:${finding.id}`);
    const capabilities = replayCapabilityState(events);
    if (capabilities.stack.length > 1 || [...capabilities.tasks.values()].some(task => task.status !== 'handed-back')) {
      blockers.push('Unsupported boundary: an unfinished nested capability task remains');
    }
    for (const request of records.capabilityRequests.values()) {
      if (!records.results.has(request.assignment) && capabilities.requests.get(request.id)?.task !== null) {
        blockers.push(`Unsupported boundary: suspended capability consumer ${request.id} remains`);
      }
    }
  } catch (error) {
    blockers.push(`Retained workflow records are inconsistent: ${error instanceof Error ? error.message : String(error)}`);
    return { seed: null, blockers, preserved, inapplicable };
  }
  const repairs = new Map<string, Extract<RunEvent, { type: 'repair-incident-recorded' }>>();
  for (const event of events) if (event.type === 'repair-incident-recorded') repairs.set(event.data.incidentId, event);
  for (const event of repairs.values()) if (['admitted', 'running', 'interrupted', 'blocked', 'unverified'].includes(event.data.stage)) {
    blockers.push(`Unsupported boundary: unfinished automatic root repair ${event.data.incidentId}`);
  }
  const nfrStart = [...events].reverse().find(event => event.type === 'nonfunctional-phase-started');
  const nfrAssessment = [...events].reverse().find(event => event.type === 'nonfunctional-assessed');
  const nfrClosed = [...events].reverse().find(event => event.type === 'nonfunctional-round-closed');
  if (nfrStart && (!nfrAssessment || !nfrClosed || events.indexOf(nfrClosed) < events.indexOf(nfrAssessment) || nfrClosed.type === 'nonfunctional-round-closed' && nfrClosed.data.outcome === 'continue' || events.some(event => events.indexOf(event) > events.indexOf(nfrAssessment) &&
    ['nonfunctional-investigated', 'nonfunctional-repair-assigned'].includes(event.type)))) blockers.push('Unsupported boundary: active NFR coordination');

  const completed = new Set(events.filter(event => event.type === 'work-item-completed').map(event => event.data.workItem));
  const active = [...events].reverse().find(event => (event.type === 'work-item-started' || event.type === 'work-item-resumed') && !completed.has(event.data.workItem));
  const unfinished = records.workItems.filter(item => !completed.has(item.id));
  const item = active && (active.type === 'work-item-started' || active.type === 'work-item-resumed')
    ? records.workItems.find(work => work.id === active.data.workItem) : unfinished[0];
  let pending: RestartImport['pending'];
  if (item) {
    const owning = [...records.invocations.values()].filter(invocation => invocation.role === 'local-architect' && invocation.work.workItem === item.id);
    const latest = owning.at(-1);
    if (!latest) blockers.push(`Unsupported boundary: no authenticated owning architect task for ${item.id}`);
    const tools = latest?.prompt.manifest?.entries as Array<{ key?: string }> | undefined;
    const declared = tools?.filter(entry => entry.key?.startsWith('tool:submit_')).map(entry => entry.key!.slice(5));
    const supported = [localArchitectToolName, reconciliationToolName, 'submit_work_orientation'];
    const submission = [...declared ?? []].reverse().find(tool => supported.includes(tool));
    if (!submission) blockers.push(`Unsupported boundary: exact designated architect submission for ${latest?.id ?? item.id} is unavailable`);
    pending = { kind: 'invocation', sourceRun: entries.find(entry => entry.transaction.event.type === 'invocation-started' && entry.transaction.event.data.invocation === latest?.id)?.transaction.event.jobId ?? record.jobId, role: 'local-architect', work: latest?.work ?? { workItem: item.id },
      ...(latest ? { originalInvocation: latest.id } : {}), ...(submission ? { submission } : {}) };
    outstanding.push(`work-item:${item.id}`);
    if (submission) outstanding.push(`submission:${submission}`);
    const openAssignments = [...records.assignments.values()].filter(assignment => assignment.workItem === item.id && !records.results.has(assignment.id));
    if (openAssignments.length > 0) blockers.push(`Unsupported boundary: unfinished engineer assignment ${openAssignments.map(assignment => assignment.id).join(', ')}`);
  } else {
    pending = { kind: 'final-gate', sourceRun: record.jobId };
    outstanding.push('final-qualification');
  }
  if (input.sourceIdentity && input.currentIdentity) {
    const frozen = (identity: RecoveryIdentity) => identity.capturedInputs.filter(input => !input.path.startsWith('prompt:'));
    if (recoveryHash(frozen(input.sourceIdentity)) !== recoveryHash(frozen(input.currentIdentity))) blockers.push('Frozen captured instruction or plan package changed');
    if (input.sourceIdentity.acceptedHead !== input.currentIdentity.acceptedHead) blockers.push('Accepted Git history changed');
    const candidateChanged = input.sourceIdentity.candidate.tree !== input.currentIdentity.candidate.tree;
    const producerChanged = recoveryHash(input.sourceIdentity.runtime) !== recoveryHash(input.currentIdentity.runtime)
      || input.sourceIdentity.configuration.identity !== input.currentIdentity.configuration.identity;
    for (const event of events) {
      if ((candidateChanged || producerChanged) && (event.type === 'work-item-completed' || event.type === 'obligation-reported' && event.data.judgment === 'done')) inapplicable.push(`event:${event.jobId}:${event.sequence}`);
      if ((candidateChanged || producerChanged) && ['gate-attempted', 'review-attempt-finished', 'nonfunctional-assessed', 'candidate-bound-to-gate'].includes(event.type)) inapplicable.push(`event:${event.jobId}:${event.sequence}`);
    }
    if (candidateChanged || producerChanged) outstanding.push('Responsible architect reassessment of imported completion reports');
    if (producerChanged) outstanding.push('Fresh qualification of imported producer evidence');
  }
  const reviewEvents = events.map(event => event.type === 'review-attempt-finished' && (event.data.reason === 'stopped' || inapplicable.includes(`event:${event.jobId}:${event.sequence}`))
    ? { ...event, data: { ...event.data, settles: false } } : event);
  for (const request of unsettledRequests(reviewEvents)) outstanding.push(`review:${request.id}:${request.kind}`);
  const inventory = entries.filter(entry => !lifecycle.has(entry.transaction.event.type)).map(entry => structuredClone(entry));
  const sourceRecords = entries.flatMap(entry => entry.transaction.records.map(body => ({ sourceRun: entry.transaction.event.jobId, sequence: entry.sequence,
    ...structuredClone(body), hash: recordHash(body.body) })));
  const body = { schema: 'ramify-agent.restart-import/1' as const, sourceRun: record.jobId,
    sourceVersion: physical.at(-1)?.sequence ?? 0, sourceDigest: input.sourceDigest, sourceRecord: record, ancestors, inventory,
    records: sourceRecords, recognizedEffects, pending, preserved, inapplicable, outstanding,
    ...(input.sourceIdentity ? { sourceIdentity: input.sourceIdentity } : {}), policyTransition: { from: record.policy.version, to: 'run-policy/8' as const } };
  if (blockers.length > 0) return { seed: null, blockers: [...new Set(blockers)], preserved, inapplicable };
  try {
    const seed = validateRestartImport({ ...body, digest: recoveryHash(body) });
    return { seed, blockers: [], preserved, inapplicable };
  } catch (error) {
    return { seed: null, blockers: [`Retained import is inconsistent: ${error instanceof Error ? error.message : String(error)}`], preserved, inapplicable };
  }
}

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

/** Materialize detached proof records; source files are always read without repair. */
export async function materializeRestartRecords(seed: RestartImport, directory: string): Promise<void> {
  validateRestartImport(seed);
  const latest = new Map(seed.records.map(record => [record.path, record]));
  for (const [path, record] of latest) {
    // The successor writes its own execution record and import checkpoint.
    if (path === 'job.json' || path.startsWith('operation-recoveries/')) continue;
    await mkdir(dirname(join(directory, path)), { recursive: true });
    await writeFile(join(directory, path), `${JSON.stringify(record.body, null, 2)}\n`, { flag: 'wx' });
  }
}

/** Copy only immutable files whose hash is already authenticated by retained records. */
export async function copyRestartArtifacts(seed: RestartImport, sourceDirectory: string, directory: string): Promise<void> {
  validateRestartImport(seed);
  const artifacts = new Map<string, string>();
  for (const entry of seed.inventory) {
    const event = entry.transaction.event;
    if (event.type === 'analysis-accepted') for (const proof of Object.values(event.data.evidence)) artifacts.set(proof.path, proof.hash);
    if (event.type === 'invocation-ended' && event.data.submission) artifacts.set(`invocations/${event.data.invocation}/submission.json`, event.data.submission);
    if (event.type === 'context-selection-recorded') artifacts.set(event.data.selection, event.data.selectionHash);
    if (event.type === 'work-orientation-recorded' && event.data.packet) artifacts.set(event.data.packet, event.data.packetHash);
  }
  for (const [path, expected] of artifacts) {
    relative.parse(path);
    const bytes = await readFile(join(sourceDirectory, path));
    if (createHash('sha256').update(bytes).digest('hex') !== expected) throw new Error(`Immutable restart artifact ${path} changed`);
    await mkdir(dirname(join(directory, path)), { recursive: true });
    try { await writeFile(join(directory, path), bytes, { flag: 'wx' }); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST' || createHash('sha256').update(await readFile(join(directory, path))).digest('hex') !== expected) throw error;
    }
  }
}

/** Stage immutable inputs and authenticated proof before initialization commits. */
export async function stageRestartImport(sourceDirectory: string, directory: string, seed: RestartImport): Promise<void> {
  await inspectRestartArtifacts(seed, sourceDirectory);
  const captured = await readCapturedDocuments(sourceDirectory, seed.sourceRecord.manifest);
  const copy = async (path: string, expected: string): Promise<void> => {
    relative.parse(path);
    const bytes = await readFile(join(sourceDirectory, path));
    if (createHash('sha256').update(bytes).digest('hex') !== expected) throw new Error(`Captured restart file ${path} changed`);
    await mkdir(dirname(join(directory, path)), { recursive: true });
    try { await writeFile(join(directory, path), bytes, { flag: 'wx' }); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST' || createHash('sha256').update(await readFile(join(directory, path))).digest('hex') !== expected) throw error;
    }
  };
  await materializeRestartRecords(seed, directory);
  await copy(runLayout.documentManifest, seed.sourceRecord.manifest.documentManifest.hash);
  await copy(runLayout.capturedPlan, seed.sourceRecord.manifest.planHash);
  for (const document of captured.manifest.documents) await copy(document.storedAt, document.sha256);
  if ('measurement' in seed.sourceRecord.baseline) {
    const baseline = seed.sourceRecord.baseline.measurement;
    await copy(runLayout.measurement(baseline.id), baseline.hash);
  } else if (!seed.records.some(reference => reference.path === runLayout.measurement('ms-0001'))) {
    // A captured unavailable baseline contains no producer bytes to import.
    // Materialize precisely that observation for the driver's ordinary reader.
    const baseline = { schema: 'ramify-agent.measurement-snapshot/1', id: 'ms-0001', policy: 'scope-size/2', head: '',
      measure: { unavailable: seed.sourceRecord.baseline.unavailable }, view: seed.sourceRecord.manifest.architectView, supplementary: [] };
    await mkdir(join(directory, 'measurements'), { recursive: true });
    await writeFile(join(directory, runLayout.measurement('ms-0001')), `${JSON.stringify(baseline, null, 2)}\n`, { flag: 'wx' });
  }
  const manifestBytes = await readFile(join(sourceDirectory, runLayout.promptManifest));
  const prompts = promptPackageManifestSchema.parse(JSON.parse(manifestBytes.toString('utf8')));
  for (const [role, prompt] of Object.entries(seed.sourceRecord.prompts)) {
    const retained = prompts.packages[role as keyof typeof prompts.packages];
    if (!retained || retained.package !== prompt.package || retained.hash !== prompt.hash) throw new Error(`Captured ${role} prompt package changed`);
  }
  await mkdir(join(directory, 'prompts'), { recursive: true });
  await writeFile(join(directory, runLayout.promptManifest), manifestBytes, { flag: 'wx' });
  await copyRestartArtifacts(seed, sourceDirectory, directory);
  await mkdir(dirname(join(directory, runLayout.restartImport)), { recursive: true });
  await writeFile(join(directory, runLayout.restartImport), `${JSON.stringify(seed, null, 2)}\n`, { flag: 'wx' });
}

export async function readRestartImport(directory: string, expectedDigest: string): Promise<RestartImport> {
  const seed = validateRestartImport(JSON.parse(await readFile(join(directory, runLayout.restartImport), 'utf8')));
  if (seed.digest !== expectedDigest) throw new Error('Restart initialization names a different import digest');
  return seed;
}

/** Authenticate immutable side evidence before reporting preparation eligibility. */
export async function inspectRestartArtifacts(seed: RestartImport, sourceDirectory: string): Promise<void> {
  validateRestartImport(seed);
  await readCapturedDocuments(sourceDirectory, seed.sourceRecord.manifest);
  const files = new Map<string, string>([[runLayout.capturedPlan, seed.sourceRecord.manifest.planHash]]);
  if ('measurement' in seed.sourceRecord.baseline) files.set(runLayout.measurement(seed.sourceRecord.baseline.measurement.id), seed.sourceRecord.baseline.measurement.hash);
  const manifestBytes = await readFile(join(sourceDirectory, runLayout.promptManifest));
  const prompts = promptPackageManifestSchema.parse(JSON.parse(manifestBytes.toString('utf8')));
  for (const [role, prompt] of Object.entries(seed.sourceRecord.prompts)) {
    const retained = prompts.packages[role as keyof typeof prompts.packages];
    if (!retained || retained.package !== prompt.package || retained.hash !== prompt.hash) throw new Error(`Captured ${role} prompt package changed`);
  }
  for (const entry of seed.inventory) {
    const event = entry.transaction.event;
    if (event.type === 'analysis-accepted') for (const proof of Object.values(event.data.evidence)) files.set(proof.path, proof.hash);
    if (event.type === 'invocation-ended' && event.data.submission) files.set(`invocations/${event.data.invocation}/submission.json`, event.data.submission);
    if (event.type === 'context-selection-recorded') files.set(event.data.selection, event.data.selectionHash);
    if (event.type === 'work-orientation-recorded' && event.data.packet) files.set(event.data.packet, event.data.packetHash);
  }
  for (const [path, expected] of files) {
    relative.parse(path);
    if (createHash('sha256').update(await readFile(join(sourceDirectory, path))).digest('hex') !== expected) throw new Error(`Immutable restart artifact ${path} changed`);
  }
}
