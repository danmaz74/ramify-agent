import { createHash } from 'node:crypto';
import { lstat, realpath, readFile } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { z } from 'zod';
import type { ToolDefinition, ToolResult } from '../../subs/agent/src/interfaces/port.js';
import type { SessionEffectRecord } from '../../subs/agent/src/interfaces/session-operations.js';
import { childEnvironment, runCommand, type CommandRunner } from '../../subs/evidence/src/run-command.js';
import type { BeadsStageInput, BeadsStateStore } from './beads-storage.js';

const identifier = z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/u);
const readInput = z.object({ id: identifier }).strict();
const bindInput = z.object({ id: identifier, mention: z.string().trim().min(1), relevance: z.string().trim().min(1) }).strict();
const updateInput = z.object({ id: identifier, reason: z.string().trim().min(1) }).strict();
const searchInput = z.object({ query: z.string().trim().min(1).max(1000) }).strict();
const reportInput = z.object({ path: z.string().min(1), checkId: z.string().min(1).optional(), offset: z.int().nonnegative().default(0) }).strict();
const success = (text: string): ToolResult => ({ text });

export interface BeadsTools {
  readonly tools: readonly ToolDefinition[];
  recoverEffect(effect: SessionEffectRecord): Promise<ToolResult | null>;
}
/** Only fixed local tracker operations reach the command runner. No agent shell exists. */
export async function createBeadsTools(input: {
  readonly stage: 'start' | 'finish'; readonly request: BeadsStageInput; readonly store: BeadsStateStore;
  readonly runner?: CommandRunner; readonly timeoutMs: number;
}): Promise<BeadsTools> {
  const { stage, request, store } = input;
  if (!isAbsolute(request.workspace)) throw new Error('Beads tracker workspace must be absolute');
  const workspace = await realpath(request.workspace);
  if (workspace !== resolve(request.workspace)) throw new Error('Beads tracker workspace must be a canonical absolute path without symlink redirection');
  const beadsDirectory = join(workspace, '.beads');
  const directory = await lstat(beadsDirectory);
  if (!directory.isDirectory() || directory.isSymbolicLink() || await realpath(beadsDirectory) !== resolve(beadsDirectory)) throw new Error('An existing local .beads directory is required in the captured tracker workspace');
  try { await lstat(join(beadsDirectory, 'redirect')); throw new Error('Beads tracker redirect is not permitted in the captured workspace'); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  const metadata = JSON.parse(await readFile(join(beadsDirectory, 'metadata.json'), 'utf8')) as { backend?: unknown; database?: unknown };
  if (metadata.backend !== 'dolt' && typeof metadata.database !== 'string') throw new Error('An initialized existing Beads tracker is required');
  const inspected = new Map<string, Record<string, unknown>>();
  const env = childEnvironment({ BEADS_DIR: beadsDirectory, BEADS_NO_DAEMON: '1', BEADS_NO_AUTO_FLUSH: '1', BEADS_NO_AUTO_IMPORT: '1' });
  async function command(args: readonly string[], signal?: AbortSignal): Promise<unknown> {
    const result = await (input.runner ?? runCommand)({ argv: [request.executable ?? 'bd', '--sandbox', ...args, '--json'], cwd: workspace,
      env, timeoutMs: input.timeoutMs, maxBytes: 1024 * 1024, ...(signal ? { signal } : {}) });
    if (result.outcome.kind !== 'completed' || result.outcome.exitCode !== 0 || result.output.truncated) throw new Error(`Beads delivery unavailable: ${JSON.stringify(result.outcome)} ${result.stderr}`);
    return JSON.parse(result.stdout) as unknown;
  }
  async function show(id: string, signal?: AbortSignal): Promise<Record<string, unknown>> {
    const raw = await command(['show', id], signal);
    const issue = Array.isArray(raw) ? raw[0] : raw;
    if (!issue || typeof issue !== 'object' || (issue as Record<string, unknown>)['id'] !== id || typeof (issue as Record<string, unknown>)['status'] !== 'string') throw new Error('Beads show did not identify the requested existing issue');
    inspected.set(id, issue as Record<string, unknown>);
    return issue as Record<string, unknown>;
  }
  async function bind(raw: unknown): Promise<ToolResult> {
    if (stage !== 'start') throw new Error('Issue bindings are fixed at implementation start');
    const value = bindInput.parse(raw);
    const issue = inspected.get(value.id);
    if (!issue) throw new Error('Inspect this existing issue with beads_show before binding it');
    await store.update(request.runId, state => {
      const existing = state.bindings.find(binding => binding.id === value.id);
      return existing ? state : { ...state, bindings: [...state.bindings, { ...value, issue }] };
    });
    return success(`Bound existing issue ${value.id} to this run`);
  }
  const desiredStatus = stage === 'start' ? 'in_progress' : 'closed';
  const issueQueues = new Map<string, Promise<unknown>>();
  const marker = (id: string) => `[ramify-agent:${request.runId}:${stage}:${id}]`;
  const containsMarker = (issue: Record<string, unknown>, id: string) =>
    (stage === 'start' ? issue['notes'] : issue['close_reason'])?.toString().includes(marker(id)) === true;
  function update(raw: unknown, signal?: AbortSignal): Promise<ToolResult> {
    const value = updateInput.parse(raw);
    const pending = (issueQueues.get(value.id) ?? Promise.resolve()).then(() => updateOwned(value, signal));
    const tail = pending.catch(() => undefined); issueQueues.set(value.id, tail);
    void tail.then(() => { if (issueQueues.get(value.id) === tail) issueQueues.delete(value.id); });
    return pending;
  }
  async function updateOwned(raw: unknown, signal?: AbortSignal): Promise<ToolResult> {
    const value = updateInput.parse(raw);
    const state = (await store.read(request.runId))!;
    if (!state.bindings.some(binding => binding.id === value.id)) throw new Error('Only issues bound at implementation start may be updated');
    const retained = state.mutations.find(mutation => mutation.id === value.id && mutation.status === desiredStatus);
    if (retained?.phase === 'confirmed') return success(`Already confirmed ${value.id}: ${retained.observedStatus ?? desiredStatus}`);
    const issue = await show(value.id, signal);
    const observed = issue['status'] as string;
    if (observed === desiredStatus || (stage === 'start' && observed === 'closed')) {
      if (retained?.phase === 'intent' && !containsMarker(issue, value.id)) throw new Error(`Status satisfied for ${value.id}, but prior delivery evidence is uncertain; retained pending for review`);
      await confirm(value.id, retained?.reason ?? value.reason, observed, retained ? 'verified' : 'observed');
      return success(`Observed ${value.id}: ${observed}; no mutation required`);
    }
    if (retained?.phase === 'intent') throw new Error(`Uncertain prior Beads update for ${value.id}; current status ${observed} does not confirm delivery. Retained pending for review`);
    await store.update(request.runId, current => ({ ...current, mutations: [...current.mutations, { id: value.id, status: desiredStatus, reason: value.reason, phase: 'intent' }] }));
    const evidence = `${marker(value.id)} ${value.reason.slice(0, 6000)}`;
    await command(stage === 'start' ? ['update', value.id, '--status', 'in_progress', '--if-status', observed, '--append-notes', evidence] : ['close', value.id, '--reason', evidence], signal);
    const after = await show(value.id, signal);
    if (after['status'] !== desiredStatus) throw new Error(`Beads readback did not confirm ${value.id}: ${desiredStatus}`);
    if (!containsMarker(after, value.id)) throw new Error(`Beads readback did not confirm delivery evidence for ${value.id}`);
    await confirm(value.id, value.reason, desiredStatus, 'verified');
    return success(`Confirmed ${value.id}: ${desiredStatus}`);
  }
  async function confirm(id: string, reason: string, observedStatus: string, delivery: 'observed' | 'verified'): Promise<void> {
    await store.update(request.runId, state => ({ ...state, mutations: [...state.mutations.filter(mutation => !(mutation.id === id && mutation.status === desiredStatus)), { id, status: desiredStatus, reason, phase: 'confirmed', observedStatus, delivery }] }));
  }
  async function readCheck(raw: unknown): Promise<ToolResult> {
    const value = reportInput.parse(raw);
    const report = request.reports?.find(report => report.path === value.path);
    if (stage !== 'finish' || !report) throw new Error('Only captured audit report paths may be read');
    const bytes = await readFile(report.path);
    if (createHash('sha256').update(bytes).digest('hex') !== report.hash) throw new Error('Captured audit report differs from its retained hash');
    const gate = JSON.parse(bytes.toString('utf8')) as { provider?: { checks?: unknown } };
    const rawChecks = gate.provider?.checks;
    const checks = rawChecks !== null && typeof rawChecks === 'object' ? rawChecks as Record<string, unknown> : {};
    if (value.checkId !== undefined && !Object.hasOwn(checks, value.checkId)) throw new Error('Requested check is not present in this captured report');
    const content = value.checkId === undefined ? Object.entries(checks).map(([id, check]) => ({ id,
      status: check !== null && typeof check === 'object' ? (check as { status?: unknown }).status ?? null : null })) : checks[value.checkId];
    const text = JSON.stringify(content, null, 2);
    const end = Math.min(text.length, value.offset + 4000);
    return success(JSON.stringify({ path: report.path, checkId: value.checkId ?? null, offset: value.offset,
      excerpt: text.slice(value.offset, end), nextOffset: end < text.length ? end : null }));
  }
  const tool = (name: string, description: string, schema: z.ZodType, execute: ToolDefinition['execute'], mutating = false): ToolDefinition => ({
    name, description, inputSchema: z.toJSONSchema(schema) as Record<string, unknown>, mutating, action: () => ({ kind: 'harness' }), execute,
  });
  const tools = [
    ...(stage === 'finish' && request.reports?.length ? [tool('beads_read_check',
      'Read captured audit evidence only when useful for an issue judgment. Supply a report path from the task. Omit checkId to list check IDs and statuses; select one checkId for a diagnostic excerpt of at most 4000 characters. Use nextOffset for further excerpts. Full reports are never returned.',
      reportInput, readCheck)] : []),
    tool('beads_show', 'Inspect one existing issue in the captured tracker workspace. Only mentioned relevant issues may be bound.', readInput, async (raw, signal) => success(JSON.stringify(await show(readInput.parse(raw).id, signal)))),
    tool('beads_search', 'Search existing issues by text mentioned in the plan or inherited context; this does not bind or update issues.', searchInput, async (raw, signal) => success(JSON.stringify(await command(['search', searchInput.parse(raw).query, '--limit', '20'], signal)))),
    ...(stage === 'start' ? [tool('beads_bind', 'Bind an inspected existing issue semantically relevant to this implementation, with its concrete mention and relevance rationale.', bindInput, bind)] : []),
    tool('beads_update', stage === 'start' ? 'Mark a bound existing issue in_progress; already closed issues remain closed.' : 'Close one bound issue only after judging its own requirements resolved using concrete implementation and validation evidence. reason must contain that evidence.', updateInput, update, true),
  ];
  return { tools, async recoverEffect(effect) {
    if (effect.tool === 'beads_read_check') return readCheck(effect.input);
    if (effect.tool === 'beads_update') {
      const value = updateInput.parse(effect.input);
      const state = await store.read(request.runId);
      if (!state?.bindings.some(binding => binding.id === value.id)) return null;
      const retained = state.mutations.find(mutation => mutation.id === value.id && mutation.status === desiredStatus);
      if (retained?.phase === 'confirmed') return success(`Recovered confirmed ${value.id}: ${retained.observedStatus ?? desiredStatus}`);
      const issue = await show(value.id);
      if (issue['status'] !== desiredStatus && !(stage === 'start' && issue['status'] === 'closed')) return null;
      if (retained?.phase === 'intent' && !containsMarker(issue, value.id)) return null;
      await confirm(value.id, retained?.reason ?? value.reason, issue['status'] as string, retained ? 'verified' : 'observed');
      return success(`Recovered readback ${value.id}: ${String(issue['status'])}`);
    }
    if (effect.tool === 'beads_show') return success(JSON.stringify(await show(readInput.parse(effect.input).id)));
    if (effect.tool === 'beads_search') return success(JSON.stringify(await command(['search', searchInput.parse(effect.input).query, '--limit', '20'])));
    if (effect.tool === 'beads_bind') {
      const value = bindInput.parse(effect.input);
      if ((await store.read(request.runId))?.bindings.some(binding => binding.id === value.id)) return success(`Recovered binding ${value.id}`);
      await show(value.id); return bind(value);
    }
    return null;
  } };
}
