import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { engineerEquipment } from '../../subs/autonomous/src/work/engineer-equipment.js';
import { ObservationLog } from '../../subs/task-execution/src/observations.js';
import type { GuardedScope } from '../guard/write-guard.js';
import { OwnershipUnavailableError } from '../../subs/evidence/src/ownership-evidence.js';
import { FakeRamifyCli } from './helpers/fake-ramify.js';
const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });
async function setup(placement?: GuardedScope['placement']) {
  const root = await mkdtemp(join(tmpdir(), 'repair-equipment-')); roots.push(root);
  await mkdir(join(root, 'Reviews')); await mkdir(join(root, 'integration-tests')); await mkdir(join(root, 'plans/.harness'), { recursive: true });
  const failure = { status: 'unavailable' as const, failureStatus: 'invalid' as const, reason: 'acquisition invalid', decoded: { diagnostics: [{ id: 'scripted-missing-export', category: 'missing-export' as const, code: 'missing-export' as const, message: 'Reviews export missing', location: null, related: [], importer: null, original: null, accessId: null }] }, exitCode: 1, stdout: 'complete failure bytes', stderr: '', report: null };
  const guarded: GuardedScope = { revision: 1, projectRoot: root, roots: [join(root, 'Reviews')], excluded: [join(root, 'Reviews/Validation')], files: [join(root, 'integration-tests/module.ramify'), join(root, 'integration-tests/README.md'), join(root, 'module.ramify'), join(root, 'tsconfig.json')],
    placement: placement ?? (async () => { throw new OwnershipUnavailableError(failure); }), historicalPlacement: async paths => ({ assignment: 'a'.repeat(64), reference: null, decisions: paths.map(path => ({ path, allowed: true })) }),
    retainUnavailable: async () => ({ hash: 'f'.repeat(64), bytes: 22 }) };
  const observations = await ObservationLog.open(join(root, 'plans/.harness/observations.jsonl'));
  const inputs = { projectRoot: root, ramify: new FakeRamifyCli(), guarded, commands: { hookTimeoutMs: 1000 } as never, bounds: { rejectedToolInputsPerTurn: 3 }, refresh: async () => null, index: () => null, scopeRevision: 1,
    outputPath: (kind: string, invocation: string, number: number) => join(root, 'plans/.harness', `${kind}-${invocation}-${number}.json`) };
  const equip = () => engineerEquipment(inputs).equip({ invocation: 'engineer', observations, callId: () => 'call', reminders: () => [] });
  return { root, observations, equip };
}
async function edit(equipment: ReturnType<ReturnType<typeof engineerEquipment>['equip']>, root: string, callId: string, path: string, content: string) {
  const call = { callId, tool: 'write', input: { path }, action: { kind: 'write' as const, paths: [path] } };
  expect(await equipment.guard!(call)).toEqual({ allow: true });
  await writeFile(join(root, path), content);
  return equipment.afterMutation!({ ...call, failed: false });
}
test('several invalid edits, unrelated correction, new source and configuration persist across equipment restart and exact restoration', async () => {
  const { root, observations, equip } = await setup();
  const original = 'export const existing = true;\n'; await writeFile(join(root, 'Reviews/existing.ts'), original);
  let equipment = equip();
  const first = await edit(equipment, root, 'one', 'Reviews/existing.ts', 'invalid first');
  expect(first?.text).toContain('Write basis: historical'); expect(first?.text).toContain('missing-export: Reviews export missing');
  expect(first?.text).toContain(`Complete failure evidence: blobs/${'f'.repeat(64)}, relative to the run or session record directory.`);
  expect(first?.text).toContain('immediately preceding project mutation inventory'); expect(first?.text).toContain('not-checked');
  const second = await edit(equipment, root, 'two', 'Reviews/existing.ts', 'invalid second');
  expect(second?.text).not.toContain('missing-export: Reviews export missing');
  await edit(equipment, root, 'three', 'integration-tests/README.md', 'authorized unrelated correction');
  await equipment.settle!(); await equipment.drained!(); equipment = equip();
  await edit(equipment, root, 'four', 'Reviews/new.ts', 'export const added = true;');
  await edit(equipment, root, 'five', 'tsconfig.json', '{"authorized":true}');
  await edit(equipment, root, 'six', 'Reviews/existing.ts', original);
  await edit(equipment, root, 'seven', 'integration-tests/module.ramify', 'authorized test declaration');
  await edit(equipment, root, 'eight', 'module.ramify', 'authorized root declaration');
  expect(await readFile(join(root, 'Reviews/existing.ts'), 'utf8')).toBe(original);
  expect(await readFile(join(root, 'integration-tests/README.md'), 'utf8')).toBe('authorized unrelated correction');
  expect(observations.observations.filter(item => item.type === 'guard').map(item => item.data.basis)).toEqual(Array(8).fill('historical'));
  expect(observations.observations.filter(item => item.type === 'mutation')).toHaveLength(8);
  await equipment.settle!(); await equipment.drained!();
});
test('stop while the ownership query awaits prevents admission and releases the lease', async () => {
  let answer!: () => void; let entered!: () => void;
  const waiting = new Promise<void>(resolve => { answer = resolve; }); const started = new Promise<void>(resolve => { entered = resolve; });
  const { root, equip } = await setup(async paths => { entered(); await waiting; return paths.map(path => ({ path, allowed: true })); });
  const equipment = equip(); const call = { callId: 'pending', tool: 'write', input: {}, action: { kind: 'write' as const, paths: ['Reviews/new.ts'] } };
  const pending = equipment.guard!(call); await started; await equipment.settle!(); answer();
  expect(await pending).toMatchObject({ allow: false, text: expect.stringContaining('cancelled') });
  await expect(readFile(join(root, 'Reviews/new.ts'))).rejects.toMatchObject({ code: 'ENOENT' });
  await equipment.drained!();
});
