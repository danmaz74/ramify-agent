import { describe, expect, test } from 'vitest';
import { compatibleAuditRepair, recoveryHash, repairDispatchBlockers, validateExternalRepair, type RecoveryIdentity } from '../run/recovery-admission.js';
import type { CommittedAuditConfiguration } from '../../subs/audit/src/check-execution.js';

function configuration(): CommittedAuditConfiguration {
  return { path: 'ramify-audit.json', sourceCommit: 'base', blob: 'config-1', projectRoot: '.', ignorePaths: [], undetectedConfigFilesForcingFullAudit: [],
    checks: [{ id: 'required', executor: { kind: 'command', commands: [{ cmd: '/missing/bin/npm', args: ['run', 'type-check'], cwd: '.' }] } }],
    workspace: { preparationId: 'nodejs', packageDirectoriesDeclared: true, linkNodeModules: true, packageDirectories: ['.'], setupCommands: [] } };
}
function identity(): RecoveryIdentity {
  const policy = configuration();
  return { candidate: { head: 'base', tree: 'partial-tree', index: 'partial-index', staged: ['partial.ts'], unstaged: ['partial.ts'], untracked: ['new.ts'],
    files: [{ path: 'partial.ts', hash: 'partial-bytes', mode: '100644' }, { path: 'new.ts', hash: 'new-bytes', mode: '100644' }] },
    runtime: { harness: 'runtime-1', provider: 'provider-1', contracts: { policy: 'recovery/1', records: 'records/1', submissions: 'submissions/1', equipment: 'equipment/1', authority: 'authority/1' } },
    configuration: { identity: recoveryHash(policy), policy }, capturedInputs: [{ path: 'frozen-plan', hash: 'plan-bytes' }], durableIdentity: 'ledger-and-records', acceptedHead: 'accepted' };
}
const repair = { areas: ['target'] as const, explanation: 'Correct the obstruction; keep partial work' };
describe('external repair admission', () => {
  test('retained partial source, index and untracked work is not an external delta', () => {
    const before = identity(), after = structuredClone(before);
    expect(validateExternalRepair(before, after)).toMatchObject({ admitted: true, changes: [], invalidatesQualification: false });
  });
  test('unexplained source and staged-only drift are refused without losing the originals', () => {
    const before = identity(), after = structuredClone(before);
    after.candidate.index = 'edited-index'; after.candidate.staged = [];
    expect(validateExternalRepair(before, after)).toMatchObject({ admitted: false, blockers: [expect.stringContaining('declaration')] });
    expect(before.candidate.staged).toEqual(['partial.ts']);
  });
  test('an observed external delta requires fresh qualification and responsible reassessment', () => {
    const before = identity(), after = structuredClone(before);
    after.candidate.tree = 'repaired-tree'; after.candidate.files[0]!.hash = 'repaired-bytes';
    const admitted = validateExternalRepair(before, after, { ...repair, areas: [...repair.areas] });
    expect(admitted).toMatchObject({ admitted: true, invalidatesQualification: true, requiresReassessment: true,
      changes: [{ path: 'partial.ts', before: { hash: 'partial-bytes' }, after: { hash: 'repaired-bytes' } }] });
    expect(repairDispatchBlockers(admitted, after)).toEqual([]);
    after.candidate.files[1]!.mode = '100755';
    expect(repairDispatchBlockers(admitted, after)).toEqual([expect.stringContaining('after repair admission')]);
  });
  test.each(['capturedInputs', 'durableIdentity', 'acceptedHead'] as const)('a declaration cannot replace %s', field => {
    const before = identity(), after = structuredClone(before);
    if (field === 'capturedInputs') after.capturedInputs[0]!.hash = 'edited'; else after[field] = 'edited';
    expect(validateExternalRepair(before, after, { ...repair, areas: [...repair.areas] }).admitted).toBe(false);
  });
  test('compatible runtime repairs retain contract identity and reject changed authority', () => {
    const before = identity(), after = structuredClone(before);
    after.runtime.harness = 'fixed-runtime';
    expect(validateExternalRepair(before, after, { areas: ['runtime'], explanation: 'Fix adapter defect' }).admitted).toBe(true);
    after.runtime.contracts.authority = 'broader-authority';
    expect(validateExternalRepair(before, after, { areas: ['runtime'], explanation: 'Fix adapter defect' }).blockers).toContain('Runtime recovery contracts are incompatible');
  });
  test('environment-only repair invents neither a source delta nor environment values', () => {
    const before = identity();
    const admission = validateExternalRepair(before, structuredClone(before), { areas: ['environment'], explanation: 'Corrected access' });
    expect(admission).toMatchObject({ admitted: true, changes: [], invalidatesQualification: false });
    expect(JSON.stringify(admission)).not.toContain('credentials');
  });
});
describe('supported audit operational correction', () => {
  test('corrects lookup of the same executable while preserving checks and arguments', () => {
    const before = configuration(), after = structuredClone(before);
    (after.checks[0] as { executor: { commands: { cmd: string }[] } }).executor.commands[0]!.cmd = '/installed/bin/npm';
    Object.assign(after, { blob: 'config-2', sourceCommit: 'repair' });
    expect(compatibleAuditRepair(before, after)).toBe(true);
  });
  test.each(['remove-check', 'weaken-arguments', 'replace-executable', 'foreign-cwd', 'ignore-source'] as const)('refuses %s', change => {
    const before = configuration(), after = structuredClone(before);
    const command = (after.checks[0] as { executor: { commands: { cmd: string; args: string[]; cwd: string }[] } }).executor.commands[0]!;
    if (change === 'remove-check') Object.assign(after, { checks: [] });
    if (change === 'weaken-arguments') command.args = ['--version'];
    if (change === 'replace-executable') command.cmd = 'true';
    if (change === 'foreign-cwd') command.cwd = '../unrelated';
    if (change === 'ignore-source') Object.assign(after, { ignorePaths: ['src/**'] });
    expect(compatibleAuditRepair(before, after)).toBe(false);
  });
  test('configuration declaration cannot adopt unrelated staged-only changes', () => {
    const before = identity(), after = structuredClone(before);
    after.candidate.staged = []; after.candidate.index = 'other-index';
    expect(validateExternalRepair(before, after, { areas: ['configuration'], explanation: 'Fix executable lookup' }).admitted).toBe(false);
  });
  test('a configuration-only candidate tree correction requires exact final assessment renewal', () => {
    const before = identity(), after = structuredClone(before);
    before.candidate.files.push({ path: 'ramify-audit.json', hash: 'original-config', mode: '100644' });
    after.candidate.files.push({ path: 'ramify-audit.json', hash: 'corrected-config', mode: '100644' });
    after.candidate.tree = 'changed-configuration-tree';
    after.configuration.identity = 'changed-configuration';
    expect(validateExternalRepair(before, after, { areas: ['configuration'], explanation: 'Correct required executable lookup' })).toMatchObject({
      admitted: true, invalidatesQualification: true, requiresReassessment: true,
    });
  });
});
