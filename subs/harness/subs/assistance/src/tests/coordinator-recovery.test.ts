import { readFile } from 'node:fs/promises';
import { beforeEach, expect, test, vi } from 'vitest';
import { coordinatorOwnerAlive, requireCoordinatorSettlement } from '../coordinator-recovery.js';
import type { CoordinatorRecord } from '../coordinator-contracts.js';
vi.mock('node:fs/promises', async original => ({ ...await original<typeof import('node:fs/promises')>(), readFile: vi.fn() }));
const record = { owner: { pid: 100, processStart: '123' }, guardian: { path: '/private/receipt', generation: 'generation' } } as CoordinatorRecord;
const receipt = { schema: 'ramify-agent.coordinator-guardian/1', generation: 'generation', pid: 99, identity: 'boot:456', hostPid: 100, hostIdentity: 'boot:123', state: 'settled', reason: null };
const stat = (ticks: string, state = 'S') => `99 (guardian) ${[state, ...Array<string>(18).fill('0'), ticks].join(' ')}`;
beforeEach(() => vi.resetAllMocks());
function scripted(value: unknown, guardianStat: string | null) {
  vi.mocked(readFile).mockImplementation(async path => {
    if (path === record.guardian!.path) return JSON.stringify(value);
    if (String(path).endsWith('/stat')) { if (guardianStat !== null) return guardianStat; throw Object.assign(new Error('gone'), { code: 'ENOENT' }); }
    if (String(path).endsWith('boot_id')) return 'boot\n';
    throw new Error(`Unexpected read ${String(path)}`);
  });
}
test('a confirmed identity-bound receipt and exited guardian establish settlement', async () => { scripted(receipt, null); await expect(requireCoordinatorSettlement(record)).resolves.toBeUndefined(); });
test('an unrelated process reusing the guardian PID is neither signalled nor treated as the old writer', async () => { scripted(receipt, stat('999')); await expect(requireCoordinatorSettlement(record)).resolves.toBeUndefined(); });
test('a dead guardian without acknowledgement never establishes orphan settlement', async () => { scripted({ ...receipt, state: 'running' }, null); await expect(requireCoordinatorSettlement(record)).rejects.toThrow(/without settlement acknowledgement/); });
test('even a settled receipt waits until its actual guardian stops executing', async () => { scripted(receipt, stat('456')); await expect(requireCoordinatorSettlement(record, 0)).rejects.toThrow(/not confirmed settled/); });
test.each([{ generation: 'other' }, { hostPid: 101 }, { hostIdentity: 'boot:999' }])('receipt binding rejects %j', async different => { scripted({ ...receipt, ...different }, null); await expect(requireCoordinatorSettlement(record)).rejects.toThrow(/identity differs/); });
test('an unverifiable legacy owner refuses crash replacement while a confirmed coordinated stop remains usable', async () => {
  await expect(requireCoordinatorSettlement({ ...record, guardian: undefined })).rejects.toThrow(/no host-tree settlement receipt/);
  await expect(requireCoordinatorSettlement({ ...record, guardian: undefined, ownershipReleased: true, settlement: { confirmed: true, descendants: 'settled', supervisorExited: true, reason: null } })).resolves.toBeUndefined();
});
test('owner identity requires its actual retained start ticks and treats zombies as exited', async () => {
  scripted(receipt, stat('123')); expect(await coordinatorOwnerAlive(record)).toBe(true);
  scripted(receipt, stat('124')); expect(await coordinatorOwnerAlive(record)).toBe(false);
  scripted(receipt, stat('123', 'Z')); expect(await coordinatorOwnerAlive(record)).toBe(false);
});
