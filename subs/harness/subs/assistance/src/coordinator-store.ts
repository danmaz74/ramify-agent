import { createHash } from 'node:crypto';
import { chmod, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import { openLedger, type Ledger } from '../../ledger/src/ledger.js';
import { readJsonLines } from '../../ledger/src/jsonl.js';
import { writeFileAtomic } from '../../ledger/src/atomic.js';
import { ensureStateDirectory } from '../../../src/store/state-directory.js';
import { canonicalJson } from '../../../src/jobs/commands.js';
import type { CoordinatorControlResult, CoordinatorRecord, CoordinatorRuntime } from './coordinator-contracts.js';

export const coordinatorDirectory = (root: string) => join(root, 'plans', '.harness', 'coordinators');
export const coordinatorHash = (value: unknown) => createHash('sha256').update(canonicalJson(value)).digest('hex');

/** A published generation permanently admits its predecessor's one successor. */
export async function coordinatorSuccessor(root: string, predecessorId: string): Promise<CoordinatorRecord | undefined> {
  let successor: CoordinatorRecord | undefined;
  const entries = await readdir(coordinatorDirectory(root), { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory() || !/^coord-[a-f0-9-]{36}$/.test(entry.name)) continue;
    // A prospective host can have made its directory before publishing a record.
    // It has not admitted a continuation until that record exists.
    const retained = await readCoordinator(root, entry.name).catch(error => { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined; throw error; });
    if (retained?.record.resumeFrom !== predecessorId) continue;
    if (successor !== undefined) throw new Error(`Coordinator ${predecessorId} has conflicting retained successors; continuation refused`);
    successor = retained.record;
  }
  return successor;
}

/** Call while holding service ownership, immediately before publishing a host. */
export async function requireLatestCoordinator(root: string, predecessorId: string): Promise<void> {
  const successor = await coordinatorSuccessor(root, predecessorId);
  const latest = (await readCoordinator(root)).record;
  if (successor !== undefined || latest.id !== predecessorId) throw new Error(`Stale coordinator predecessor ${predecessorId}; continue from latest coordinator ${latest.id}. An admitted successor cannot be replaced through its ancestor`);
}
const commandEvent = z.object({ commandId: z.string(), hash: z.string(), action: z.string(), state: z.enum(['reserved', 'completed', 'failed', 'uncertain']), result: z.unknown().optional(), error: z.object({ kind: z.string(), message: z.string() }).optional() }).strict();
type CommandEvent = z.infer<typeof commandEvent>;

/** Durable command admission, small atomic observations; no conversation replay. */
export class CoordinatorStore {
  readonly directory: string;
  private queue: Promise<unknown> = Promise.resolve();
  private saving: Promise<void> = Promise.resolve();
  private timer: NodeJS.Timeout | undefined;
  persistenceError: Error | undefined;
  private readonly commands = new Map<string, CommandEvent & { pending?: Promise<CoordinatorControlResult> }>();
  private constructor(readonly record: CoordinatorRecord, private readonly ledger: Ledger<CommandEvent>) { this.directory = join(coordinatorDirectory(record.projectRoot), record.id); }
  static async create(record: CoordinatorRecord, taskDirections?: string): Promise<CoordinatorStore> {
    const root = coordinatorDirectory(record.projectRoot);
    await ensureStateDirectory(root, { gitignore: true });
    await chmod(root, 0o700);
    const directory = join(root, record.id);
    await ensureStateDirectory(directory, { gitignore: true });
    await chmod(directory, 0o700);
    const ledger = await openLedger({ logPath: join(directory, 'commands.jsonl'), recordsRoot: directory, eventSchema: commandEvent });
    const store = new CoordinatorStore(record, ledger);
    await store.flush();
    if (taskDirections !== undefined) { await writeFileAtomic(join(directory, 'task.json'), JSON.stringify({ message: taskDirections })); await chmod(join(directory, 'task.json'), 0o600); }
    await writeFileAtomic(join(root, 'active.json'), JSON.stringify({ id: record.id, generation: record.generation }));
    return store;
  }
  async retainRuntime(runtime: CoordinatorRuntime): Promise<void> {
    await writeFileAtomic(join(this.directory, 'runtime.json'), JSON.stringify(runtime));
    await chmod(join(this.directory, 'runtime.json'), 0o600);
  }
  /** Retain prior mutation receipts by reference; never replay accepted input. */
  async inherit(previousId: string): Promise<readonly { commandId: string; action: string }[]> {
    const chain: string[] = []; const visited = new Set<string>();
    let selected: string | undefined = previousId;
    while (selected !== undefined) {
      if (visited.has(selected)) throw new Error('Coordinator continuation history contains a cycle');
      visited.add(selected); chain.unshift(selected);
      const prior: CoordinatorRecord = (await readCoordinator(this.record.projectRoot, selected)).record;
      if (prior.planId !== this.record.planId || prior.jobId !== this.record.jobId) throw new Error('Prior coordinator execution identity differs');
      selected = prior.resumeFrom;
    }
    for (const id of chain) {
      const log = await readJsonLines(join(coordinatorDirectory(this.record.projectRoot), id, 'commands.jsonl'));
      for (const [index, raw] of log.records.entries()) {
        const line = z.object({ sequence: z.literal(index + 1), event: commandEvent }).passthrough().parse(raw);
        const event = line.event;
        if (event.action !== 'send' && event.action !== 'respond') continue;
        const old = this.commands.get(event.commandId);
        if (old !== undefined && old.hash !== event.hash) throw new Error('Conflicting inherited coordinator command receipts');
        this.commands.set(event.commandId, event.state === 'reserved' ? { ...event, state: 'uncertain', error: { kind: 'uncertain', message: 'Previous host stopped after admission without a retained outcome; inspect current state; do not redeliver' } } : event);
      }
    }
    return [...this.commands.values()].filter(event => event.state === 'uncertain').map(({ commandId, action }) => ({ commandId, action }));
  }
  changed(): void {
    this.timer ??= setTimeout(() => { this.timer = undefined; void this.flush().catch(error => { this.persistenceError = error instanceof Error ? error : new Error(String(error)); }); }, 50);
  }
  async flush(): Promise<void> {
    clearTimeout(this.timer); this.timer = undefined;
    const body = JSON.stringify(this.record);
    this.saving = this.saving.catch(() => undefined).then(() => writeFileAtomic(join(this.directory, 'record.json'), body));
    await this.saving;
  }
  private append(event: CommandEvent): Promise<unknown> {
    const writing = this.queue.then(() => this.ledger.append({ event, records: [] }));
    this.queue = writing.catch(() => undefined);
    return writing;
  }
  command(commandId: string, action: string, input: unknown, operation: () => Promise<unknown>, describe: (error: unknown) => { kind: string; message: string }): Promise<CoordinatorControlResult> {
    const hash = coordinatorHash(input);
    const old = this.commands.get(commandId);
    if (old !== undefined) {
      if (old.hash !== hash) return Promise.reject(new Error('Command identity conflicts with its admitted arguments'));
      if (old.pending !== undefined) return old.pending;
      return Promise.resolve({ commandId, state: old.state === 'reserved' ? 'uncertain' : old.state, ...(old.result === undefined ? {} : { result: old.result }), ...(old.error === undefined ? {} : { error: old.error }) });
    }
    const entry: CommandEvent & { pending?: Promise<CoordinatorControlResult> } = { commandId, action, hash, state: 'reserved' };
    this.commands.set(commandId, entry);
    entry.pending = (async () => {
      try { await this.append({ commandId, action, hash, state: 'reserved' }); }
      catch (error) { this.commands.delete(commandId); throw error; } // No effect was attempted.
      let result: CoordinatorControlResult;
      try { result = { commandId, state: 'completed', result: await operation() }; }
      catch (error) { const detail = describe(error); result = { commandId, state: detail.kind === 'uncertain' ? 'uncertain' : 'failed', error: detail }; }
      const event = { action, hash, ...result };
      try { await this.append(event); }
      catch (error) {
        // The provider may have accepted the effect. Retain uncertainty in memory
        // so another live request cannot blindly execute it again.
        const uncertain: CoordinatorControlResult = { commandId, state: 'uncertain', error: { kind: 'uncertain', message: 'Effect attempted but its receipt could not be retained; do not redeliver' } };
        Object.assign(entry, uncertain); entry.pending = undefined;
        this.persistenceError = error instanceof Error ? error : new Error(String(error));
        return uncertain;
      }
      Object.assign(entry, event); entry.pending = undefined;
      return result;
    })();
    return entry.pending;
  }
  async settled(): Promise<void> { await this.queue; await this.flush(); }
}

/** Read-only clients never acquire project ownership or alter stale state. */
export async function readCoordinator(root: string, id?: string): Promise<{ record: CoordinatorRecord; runtime: CoordinatorRuntime | null }> {
  const directory = coordinatorDirectory(root);
  const selected = id ?? await (async () => {
    try { return (JSON.parse(await readFile(join(directory, 'active.json'), 'utf8')) as { id: string }).id; }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') throw Object.assign(new Error('No coordinator has been retained for this checkout'), { code: 'COORDINATOR_NOT_FOUND' }); throw error; }
  })();
  if (!/^coord-[a-f0-9-]{36}$/.test(selected)) throw new Error('Invalid coordinator identity');
  const owned = join(directory, selected);
  const readRecord = async () => {
    const record = JSON.parse(await readFile(join(owned, 'record.json'), 'utf8')) as CoordinatorRecord;
    if (record.schema !== 'ramify-agent.coordinator/1' || record.id !== selected || record.projectRoot !== root) throw new Error('Coordinator record identity differs from its target');
    return record;
  };
  let record = await readRecord();
  let runtime: CoordinatorRuntime | null = null;
  try { runtime = JSON.parse(await readFile(join(owned, 'runtime.json'), 'utf8')) as CoordinatorRuntime; }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  if (runtime !== null) {
    const sameIdentity = () => runtime!.id === record.id && runtime!.generation === record.generation;
    if (!sameIdentity()) throw new Error('Runtime identity differs from coordinator record');
    if (runtime.endpoint !== record.endpoint) {
      // The runtime and observation are individually atomic. A reader can span
      // their startup publication; re-read before deciding the pair conflicts.
      record = await readRecord();
      if (!sameIdentity()) throw new Error('Runtime identity differs from coordinator record');
      if (runtime.endpoint !== record.endpoint) {
        if (record.endpoint === null && record.phase === 'starting') return { record, runtime: null };
        throw new Error('Runtime identity differs from coordinator record');
      }
    }
  }
  return { record, runtime };
}
