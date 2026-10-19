import { describe, expect, test } from 'vitest';
import { compatibleAuditRepair } from '../../subs/autonomous/src/run/recovery-admission.js';
import type { CommittedAuditConfiguration } from '../../subs/audit/src/check-execution.js';

function configuration(): CommittedAuditConfiguration {
  return { path: 'ramify-audit.json', sourceCommit: 'base', blob: 'config-1', projectRoot: '.', ignorePaths: [], undetectedConfigFilesForcingFullAudit: [],
    checks: [{ id: 'required', executor: { kind: 'command', commands: [{ cmd: '/missing/bin/npm', args: ['run', 'type-check'], cwd: '.' }] } }],
    workspace: { preparationId: 'nodejs', packageDirectoriesDeclared: true, linkNodeModules: true, packageDirectories: ['.'], setupCommands: [] } };
}
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
});
