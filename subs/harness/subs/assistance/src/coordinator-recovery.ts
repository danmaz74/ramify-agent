import { readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { z } from 'zod';
import type { CoordinatorRecord } from './coordinator-contracts.js';

const guardianSchema = z.object({ schema: z.literal('ramify-agent.coordinator-guardian/1'), generation: z.string(), pid: z.number().int().positive(), identity: z.string(), hostPid: z.number().int().positive().optional(), hostIdentity: z.string().optional(), state: z.enum(['starting', 'running', 'unsettled', 'settled']), reason: z.string().nullable() });
/** Identity, not a timestamp or an HTTP failure, distinguishes a surviving owner. */
export async function processIdentity(pid: number): Promise<{ identity: string; state: string } | null> {
  if (process.platform !== 'linux') throw new Error('Coordinator recovery requires qualified Linux /proc identities');
  try {
    const [stat, boot] = await Promise.all([readFile(`/proc/${pid}/stat`, 'utf8'), readFile('/proc/sys/kernel/random/boot_id', 'utf8')]);
    const fields = stat.slice(stat.lastIndexOf(')') + 2).trim().split(/\s+/);
    return { identity: `${boot.trim()}:${fields[19]}`, state: fields[0]! };
  } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT' || (error as NodeJS.ErrnoException).code === 'ESRCH') return null; throw error; }
}
export async function coordinatorOwnerAlive(record: CoordinatorRecord): Promise<boolean> {
  const current = await processIdentity(record.owner.pid);
  if (current === null || current.state === 'Z') return false;
  if (record.owner.processStart === null) throw new Error('Previous owner has no verifiable process start identity');
  return current.identity.split(':').at(-1) === record.owner.processStart;
}
/** A dead guardian without its acknowledgement leaves unknown orphan writers. */
export async function requireCoordinatorSettlement(record: CoordinatorRecord, timeoutMs = 10000): Promise<void> {
  if (record.guardian === undefined) {
    if (record.ownershipReleased && record.settlement?.confirmed) return;
    throw new Error('Previous coordinator has no host-tree settlement receipt; replacement safety is uncertain');
  }
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const receipt = guardianSchema.parse(JSON.parse(await readFile(record.guardian.path, 'utf8')));
    if (receipt.generation !== record.guardian.generation || receipt.hostPid !== record.owner.pid || receipt.hostIdentity?.split(':').at(-1) !== record.owner.processStart) throw new Error('Guardian receipt identity differs from retained coordinator');
    const current = await processIdentity(receipt.pid);
    const running = current !== null && current.identity === receipt.identity && current.state !== 'Z';
    if (receipt.state === 'settled' && !running) return;
    if (!running && receipt.state !== 'settled') throw new Error('Host guardian exited without settlement acknowledgement; surviving writers are uncertain; replacement refused');
    if (Date.now() >= deadline) throw new Error('Previous host tree is not confirmed settled; replacement refused');
    await delay(50);
  }
}
