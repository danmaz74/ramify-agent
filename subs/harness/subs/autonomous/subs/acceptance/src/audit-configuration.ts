import { basename } from 'node:path';
import { recoveryHash } from '../../../src/run/recovery-admission.js';
import type { CommittedAuditConfiguration } from '../../../../audit/src/check-execution.js';
export function compatibleAuditRepair(before: CommittedAuditConfiguration, after: CommittedAuditConfiguration): boolean {
  if (!before || !after || !Array.isArray(before.checks) || !Array.isArray(after.checks) || !before.workspace || !after.workspace) return false;
  const protectedPolicy = (config: CommittedAuditConfiguration) => ({ path: config.path, projectRoot: config.projectRoot,
    checks: config.checks.map(check => stripOperational(check)), ignorePaths: config.ignorePaths,
    undetectedConfigFilesForcingFullAudit: config.undetectedConfigFilesForcingFullAudit,
    workspace: { ...config.workspace, setupCommands: config.workspace.setupCommands.map(command => stripOperational(command)) },
  });
  return recoveryHash(protectedPolicy(before)) === recoveryHash(protectedPolicy(after));
}

function stripOperational(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripOperational);
  if (typeof value !== 'object' || value === null) return value;
  const record = value as Record<string, unknown>;
  return Object.fromEntries(Object.entries(record).map(([key, content]) => {
    // An absolute lookup of the same named executable may be corrected. Its
    // arguments and cwd still bind the check to its original assertion and project.
    if ((key === 'argv' || key === 'command') && Array.isArray(content) && typeof content[0] === 'string') return [key, [basename(content[0]), ...content.slice(1)]];
    if (key === 'cmd' && typeof content === 'string') return [key, basename(content)];
    return [key, stripOperational(content)];
  }));
}
