import { createHash } from 'node:crypto';
import { basename } from 'node:path';
import { z } from 'zod';
import type { CommittedAuditConfiguration } from '../../../audit/src/check-execution.js';
import { externalRepairDeclarationSchema } from '../../../../src/interfaces/protocol/runs.js';
export { externalRepairDeclarationSchema, type ExternalRepairDeclaration } from '../../../../src/interfaces/protocol/runs.js';

const text = z.string().min(1);
const file = z.object({ path: text, hash: text.nullable(), mode: text.nullable() }).strict();
const identity = z.object({ head: text, tree: text, index: text, staged: z.array(text), unstaged: z.array(text), untracked: z.array(text), files: z.array(file) }).strict();
export const recoveryRuntimeSchema = z.object({ harness: text, provider: text, contracts: z.object({
  policy: text, records: text, submissions: text, equipment: text, authority: text,
}).strict() }).strict();
export type RecoveryRuntime = z.infer<typeof recoveryRuntimeSchema>;
export const recoveryIdentitySchema = z.object({ candidate: identity, runtime: recoveryRuntimeSchema,
  configuration: z.object({ identity: text, policy: z.unknown() }).strict(),
  capturedInputs: z.array(z.object({ path: text, hash: text }).strict()), durableIdentity: text, acceptedHead: text,
}).strict();
export type RecoveryIdentity = z.infer<typeof recoveryIdentitySchema>;
export const externalRepairAdmissionSchema = z.object({ schema: z.literal('ramify-agent.external-repair-admission/1'),
  before: recoveryIdentitySchema, after: recoveryIdentitySchema, declaration: externalRepairDeclarationSchema.nullable(),
  admitted: z.boolean(), blockers: z.array(text), changes: z.array(z.object({ path: text, before: file, after: file }).strict()),
  invalidatesQualification: z.boolean(), requiresReassessment: z.boolean(), outstandingVerification: z.array(text),
  restartComparison: z.object({ sourceRun: text, sourceCursor: z.int().positive(), sourceDigest: text, importDigest: text,
    normalizedBefore: recoveryIdentitySchema }).strict().optional(),
}).strict();
export type ExternalRepairAdmission = z.infer<typeof externalRepairAdmissionSchema>;

/** Stable identity for durable observations and historical records. */
export function recoveryHash(value: unknown): string {
  return createHash('sha256').update(canonical(value)).digest('hex');
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (typeof value === 'object' && value !== null) return `{${Object.keys(value).sort().filter(key => (value as Record<string, unknown>)[key] !== undefined)
    .map(key => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}

/** Operational correction may change executable lookup, never required check semantics. */
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
