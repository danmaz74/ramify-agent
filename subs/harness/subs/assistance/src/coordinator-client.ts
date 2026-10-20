import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdtemp, open, readFile, realpath, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { ownedTreeKernelPath } from '../../../src/owned-tree-kernel.js';
import { requireCoordinatorSettlement, coordinatorOwnerAlive } from './coordinator-recovery.js';
import type { CoordinateOptions } from './coordinator-options.js';
import { coordinatorStartSchema, type CoordinatorStart, type CoordinatorRecord, type CoordinatorSnapshot, type CoordinatorRuntime, type CoordinatorControlResult, type CoordinatorWatch, type CoordinatorCommand } from './coordinator-contracts.js';
import { readCoordinator, readCoordinatorHistory, coordinatorHash, coordinatorDirectory } from './coordinator-store.js';

function runtimeUrl(runtime: CoordinatorRuntime, path: string): URL {
  const url = new URL(runtime.endpoint);
  if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1' || url.username !== '' || url.password !== '' || url.pathname !== '/' || url.search !== '' || url.hash !== '') throw new Error('Coordinator runtime is not a loopback endpoint');
  return new URL(path, url);
}
async function request<T>(runtime: CoordinatorRuntime, path: string, timeoutMs: number, body?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(runtimeUrl(runtime, path), { method: body === undefined ? 'GET' : 'POST', headers: { authorization: `Bearer ${runtime.token}`, 'x-coordinator-generation': runtime.generation, ...(body === undefined ? {} : { 'content-type': 'application/json' }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: signal === undefined ? AbortSignal.timeout(timeoutMs) : AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]) });
  const value: unknown = await response.json();
  if (!response.ok) throw new Error(`Coordinator HTTP ${response.status}: ${JSON.stringify(value)}`);
  return value as T;
}
export async function coordinatorStatus(root: string, id?: string, timeoutMs = 5000): Promise<CoordinatorSnapshot> {
  const { record, runtime } = id === undefined ? (await readCoordinatorHistory(root)).latest : await readCoordinator(root, id);
  try {
    if (runtime === null) throw new Error('Listener readiness has not been retained');
    const status = await request<CoordinatorSnapshot>(runtime, '/status', timeoutMs);
    if (status.record.id !== record.id || status.record.generation !== record.generation) throw new Error('Live coordinator identity differs from retained runtime');
    return status;
  } catch (error) { return { record, stale: true, assessments: [], observationError: error instanceof Error ? error.message : String(error) }; }
}

/** A race winner is subject to the same admission check as an existing owner. */
function verifyStart(record: CoordinatorRecord, options: CoordinatorStart, hash: string): void {
  if (record.planId !== options.planId || (options.jobId !== undefined && record.jobId !== null && record.jobId !== options.jobId)) throw new Error(`Another coordinator target is retained: ${record.id} ${record.planId}/${record.jobId}`);
  if (record.startCommandId === options.commandId && record.startHash !== hash) throw new Error('Start command identity conflicts with its admitted arguments');
  if (options.resumeFrom !== undefined && (record.resumeFrom !== options.resumeFrom || record.startCommandId !== options.commandId)) throw new Error(`Stale coordinator predecessor ${options.resumeFrom}; an existing continuation has different admitted arguments. Continue from latest coordinator`);
}

/** No stale record is permission to replace an unconfirmed owner. */
export async function launchCoordinator(input: CoordinatorStart, timeoutMs = 180_000): Promise<CoordinatorSnapshot> {
  const options = coordinatorStartSchema.parse({ ...input, projectRoot: await realpath(input.projectRoot) });
  const hash = coordinatorHash(options);
  const deadline = Date.now() + timeoutMs; let child: ReturnType<typeof spawn> | undefined; let diagnostics: string | undefined;
  let selected: string | undefined;
  let releasedPredecessor: string | undefined;
  try {
    const history = await readCoordinatorHistory(options.projectRoot);
    const admitted = options.resumeFrom === undefined ? undefined : history.successors.get(options.resumeFrom);
    if (admitted !== undefined) {
      verifyStart(admitted, options, hash);
      // A retry observes the immutable admission even after explicit stop or a
      // later generation. It never resurrects that host or starts another turn.
      if (admitted.ownershipReleased) return coordinatorStatus(options.projectRoot, admitted.id);
      selected = admitted.id;
    }
    const prior = history.latest;
    if (options.resumeFrom !== undefined && prior.record.id !== options.resumeFrom) {
      if (selected === undefined) {
        verifyStart(prior.record, options, hash);
        if (prior.record.ownershipReleased) return coordinatorStatus(options.projectRoot, prior.record.id);
        selected = prior.record.id;
      }
    } else {
      const continuing = options.resumeFrom === prior.record.id;
      if (continuing || prior.record.ownershipReleased) await requireCoordinatorSettlement(prior.record, timeoutMs);
      if (prior.record.ownershipReleased || continuing) releasedPredecessor = prior.record.id;
      if (!prior.record.ownershipReleased && !continuing) {
        verifyStart(prior.record, options, hash);
        selected = prior.record.id;
        const current = await coordinatorStatus(options.projectRoot, selected);
        if (current.stale && !['starting', 'listening'].includes(current.record.phase)) throw new Error(`Coordinator ${selected} is unreachable; retained ownership is unconfirmed. Inspect status before explicit recovery.`);
      }
    }
  } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'COORDINATOR_NOT_FOUND') throw error; }
  if (selected === undefined) {
    const directory = await mkdtemp(join(tmpdir(), 'ramify-coordinate-'));
    const launchPath = join(directory, 'launch.json'); diagnostics = join(directory, 'diagnostics.log');
    if (process.platform !== 'linux') throw new Error('Detached coordinator ownership requires Linux /proc and Python 3');
    const id = `coord-${randomUUID()}`;
    const guardian = { path: join(coordinatorDirectory(options.projectRoot), id, 'guardian.json'), generation: randomUUID() };
    const launchReceipt = join(directory, 'guardian.json');
    await writeFile(launchPath, JSON.stringify({ options, guardian, id }), { mode: 0o600 });
    const output = await open(diagnostics, 'a', 0o600);
    try {
      child = spawn('python3', [fileURLToPath(new URL('./coordinator-guardian.py', import.meta.url)), ownedTreeKernelPath(), launchReceipt, guardian.generation, process.execPath, '--import', import.meta.resolve('tsx'), fileURLToPath(new URL('./coordinator-entry.ts', import.meta.url)), launchPath], { cwd: options.projectRoot, env: { ...process.env, RAMIFY_COORDINATOR_GUARDIAN_RECORD: guardian.path }, detached: true, stdio: ['ignore', output.fd, output.fd] });
      let launchError: Error | undefined; child.once('error', error => { launchError = error; }); child.unref();
      await delay(0); if (launchError !== undefined) throw launchError;
    } finally { await output.close(); }
  }
  while (Date.now() < deadline) {
    try {
      const status = await coordinatorStatus(options.projectRoot, selected, Math.min(5000, deadline - Date.now()));
      if (status.record.id !== releasedPredecessor) {
        verifyStart(status.record, options, hash);
        selected = status.record.id;
        if (!status.stale && (status.record.phase === 'ready' && status.record.turn !== null && status.record.initialTurnAcknowledged !== false || ['error', 'provider-exited', 'unsettled'].includes(status.record.phase))) return status;
        if (status.record.ownershipReleased) {
          if (options.resumeFrom !== undefined) return status;
          throw new Error(`Coordinator ${selected} released ownership during startup: ${status.record.error}`);
        }
      }
    } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'COORDINATOR_NOT_FOUND') throw error; }
    // A losing child can exit after another compatible host wins ownership.
    // Once observed, that owner's readiness is independent of this child.
    if (child !== undefined && child.exitCode !== null && selected === undefined) {
      const detail = diagnostics === undefined ? '' : await readFile(diagnostics, 'utf8');
      throw new Error(`Detached host exited before readiness (${child.exitCode}). ${detail.slice(-8192)}`);
    }
    await delay(100);
  }
  throw new Error(`Launch outcome uncertain${selected === undefined ? '' : ` for ${selected}`}. Host was not stopped; inspect coordinate status --project ${options.projectRoot}. Diagnostics: ${diagnostics ?? '(existing host)'}`);
}

export async function coordinatorControl(root: string, id: string, command: CoordinatorCommand, timeoutMs: number): Promise<CoordinatorControlResult> {
  const { record, runtime } = await readCoordinator(root, id);
  if (runtime === null) throw new Error('Coordinator listener is unavailable; command was not delivered');
  let result: CoordinatorControlResult;
  try { result = await request(runtime, '/control', timeoutMs, command); }
  catch (error) { throw new Error(`Command ${command.commandId} delivery may be uncertain; retry only this same identity and arguments. ${error instanceof Error ? error.message : String(error)}`); }
  if (command.action === 'stop' && result.state === 'completed' && record.guardian !== undefined) {
    try { await requireCoordinatorSettlement(record, timeoutMs); }
    catch (error) { return { ...result, state: 'uncertain', error: { kind: 'uncertain', message: `Stop acknowledged, but host-tree settlement is unconfirmed: ${error instanceof Error ? error.message : String(error)}` } }; }
  }
  return result;
}
export async function runCoordinateCommand(options: CoordinateOptions, output: (text: string) => void = text => process.stdout.write(text)): Promise<number> {
  const root = await realpath(resolve(options.projectRoot));
  const print = (value: unknown) => output(`${JSON.stringify(value, null, options.json ? undefined : 2)}\n`);
  if (options.action === 'resume') {
    const previous = (await readCoordinator(root, options.id)).record;
    if (previous.jobId === null) throw new Error('No assisted registration was retained; inspect the failed startup before continuing');
    if (!previous.ownershipReleased && await coordinatorOwnerAlive(previous)) {
      const current = await coordinatorStatus(root, previous.id, options.timeoutMs);
      if (current.stale) throw new Error('Previous host is alive but unreachable; settlement is unconfirmed; replacement refused');
      const stopped = await coordinatorControl(root, previous.id, { action: 'stop', commandId: `resume-stop:${previous.generation}` }, options.timeoutMs);
      if (stopped.state !== 'completed') throw new Error(`Previous host stop is ${stopped.state}; replacement refused. ${stopped.error?.message ?? ''}`);
    }
    const settled = (await readCoordinator(root, previous.id)).record;
    await requireCoordinatorSettlement(settled, options.timeoutMs);
    const original = await readFile(join(coordinatorDirectory(root), previous.id, 'task.json'), 'utf8').then(value => (JSON.parse(value) as { message: string }).message).catch(error => { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return ''; throw error; });
    const input = coordinatorStartSchema.parse({ projectRoot: root, planId: previous.planId, jobId: previous.jobId, commandId: options.commandId ?? `resume:${randomUUID()}`, model: options.model ?? previous.model, workerModel: options.workerModel ?? previous.workerModel, assessmentModel: options.assessmentModel ?? previous.assessmentModel, replaceMcp: [...new Set([...previous.replaceMcp, ...(previous.endpoint === null ? [] : [`ramify_host_${previous.generation.replaceAll('-', '')}`]), ...options.replaceMcp])], skill: options.skill ?? previous.skill, message: `${original}${options.messageFile === undefined ? '' : `\n${await readFile(options.messageFile, 'utf8')}`}`, codexExecutable: options.codexExecutable ?? previous.codexExecutable, resumeFrom: previous.id, freshThread: options.freshThread || previous.freshThread === true && previous.threadId === null });
    const status = await launchCoordinator(input, options.timeoutMs); print(status); return status.record.phase === 'ready' ? 0 : 2;
  }
  if (options.action === 'start') {
    const input = coordinatorStartSchema.parse({ projectRoot: root, planId: options.planId, jobId: options.jobId, commandId: options.commandId ?? `coordinate:${randomUUID()}`, model: options.model, workerModel: options.workerModel, assessmentModel: options.assessmentModel, replaceMcp: options.replaceMcp, skill: options.skill ?? fileURLToPath(new URL('../../../../../.agents/skills/ramify-agent-coordinate/SKILL.md', import.meta.url)), message: options.messageFile === undefined ? '' : await readFile(options.messageFile, 'utf8'), codexExecutable: options.codexExecutable });
    const status = await launchCoordinator(input, options.timeoutMs); print(status); return status.record.phase === 'ready' ? 0 : 2;
  }
  if (options.action === 'status') { const status = await coordinatorStatus(root, options.id, options.timeoutMs); print(status); return status.stale ? 1 : 0; }
  if (options.action === 'watch') {
    const controller = new AbortController(); const interrupt = () => controller.abort(); process.once('SIGINT', interrupt);
    let cursor = options.after;
    try {
      const { runtime } = await readCoordinator(root, options.id);
      if (runtime === null) throw new Error('Coordinator listener is unavailable');
      while (!controller.signal.aborted) {
        const update = await request<CoordinatorWatch>(runtime, `/watch?after=${cursor}&wait=30000`, Math.max(35_000, options.timeoutMs), undefined, controller.signal);
        print(update); cursor = update.cursor;
        if (update.snapshot.record.phase === 'stopped') break;
      }
      return 0;
    } catch (error) { if (controller.signal.aborted) return 0; throw error; }
    finally { process.removeListener('SIGINT', interrupt); }
  }
  const commandId = options.commandId ?? `coordinate:${randomUUID()}`;
  let command: CoordinatorCommand;
  if (options.action === 'send') command = { action: 'send', commandId, message: await readFile(options.messageFile!, 'utf8') };
  else if (options.action === 'respond') command = { action: 'respond', commandId, requestId: options.requestId!, response: JSON.parse(await readFile(options.responseFile!, 'utf8')) as Extract<CoordinatorCommand, { action: 'respond' }>['response'] };
  else if (options.action === 'interrupt') {
    const status = await coordinatorStatus(root, options.id, options.timeoutMs);
    const turnId = options.turnId ?? status.record.turn?.id;
    if (status.stale || turnId === undefined) throw new Error('No live coordinator turn is known');
    command = { action: 'interrupt', commandId, turnId };
  } else command = { action: 'stop', commandId };
  const result = await coordinatorControl(root, options.id!, command, options.timeoutMs); print(result); return result.state === 'completed' ? 0 : 2;
}
