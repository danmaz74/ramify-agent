import { createHash } from 'node:crypto';
import { basename } from 'node:path';
import { z } from 'zod';
import type { CommittedAuditConfiguration } from '../../subs/audit/src/check-execution.js';
import type { CandidateSource, GitService } from '../../subs/evidence/src/git.js';
import { externalRepairDeclarationSchema, type ExternalRepairDeclaration } from '../interfaces/protocol/runs.js';
export { externalRepairDeclarationSchema, type ExternalRepairDeclaration } from '../interfaces/protocol/runs.js';

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
}).strict();
export type ExternalRepairAdmission = z.infer<typeof externalRepairAdmissionSchema>;

/** Stable hashes bind observations, never environment values, to durable admission. */
export function recoveryHash(value: unknown): string {
  return createHash('sha256').update(canonical(value)).digest('hex');
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (typeof value === 'object' && value !== null) return `{${Object.keys(value).sort().filter(key => (value as Record<string, unknown>)[key] !== undefined)
    .map(key => `${JSON.stringify(key)}:${canonical((value as Record<string, unknown>)[key])}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}

/** Capture index categories and every candidate source identity without altering the index. */
export async function captureRecoveryCandidate(root: string, git: GitService, candidates: CandidateSource): Promise<RecoveryIdentity['candidate']> {
  if (git.recoveryStatus === undefined) throw new Error('Exact staged, unstaged and untracked recovery evidence is unavailable');
  const preview = await git.previewCandidateTree(root);
  const status = await git.recoveryStatus(root);
  const entries = await candidates.treeEntries(root, preview.tree);
  if (entries.some(entry => entry.objectId === undefined)) throw new Error('Candidate tree has an entry without exact object identity');
  const again = await git.previewCandidateTree(root);
  const checked = await git.recoveryStatus(root);
  if (preview.head !== again.head || preview.tree !== again.tree || recoveryHash(status) !== recoveryHash(checked)) throw new Error('Candidate changed during recovery inspection');
  return identity.parse({ head: preview.head, tree: preview.tree, ...status,
    files: entries.map(entry => ({ path: entry.path, hash: entry.objectId!, mode: ({ file: '100644', executable: '100755', symlink: '120000', submodule: '160000' } as const)[entry.kind] })).sort((a, b) => a.path.localeCompare(b.path)) });
}

/** Operational correction may change executable lookup and cwd, never required check semantics. */
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

/** An operator declaration explains changes; observed identities decide applicability. */
export function validateExternalRepair(before: RecoveryIdentity, after: RecoveryIdentity, declaration?: ExternalRepairDeclaration): ExternalRepairAdmission {
  before = recoveryIdentitySchema.parse(before); after = recoveryIdentitySchema.parse(after);
  if (declaration !== undefined) declaration = externalRepairDeclarationSchema.parse(declaration);
  const blockers: string[] = [];
  const areas = new Set(declaration?.areas ?? []);
  if (recoveryHash(before.capturedInputs) !== recoveryHash(after.capturedInputs)) blockers.push('Captured instruction or plan package changed');
  if (before.durableIdentity !== after.durableIdentity) blockers.push('Harness-owned durable records changed');
  if (before.acceptedHead !== after.acceptedHead) blockers.push('Accepted Git history changed');
  if (recoveryHash(before.runtime.contracts) !== recoveryHash(after.runtime.contracts)) blockers.push('Runtime recovery contracts are incompatible');
  const sourceChanged = recoveryHash(before.candidate) !== recoveryHash(after.candidate);
  const runtimeChanged = recoveryHash(before.runtime) !== recoveryHash(after.runtime);
  const configChanged = before.configuration.identity !== after.configuration.identity;
  if (sourceChanged && !areas.has('target') && !(configChanged && areas.has('configuration'))) blockers.push('Target candidate or index changed without a target repair declaration');
  if (runtimeChanged && !areas.has('runtime')) blockers.push('Harness or provider changed without a runtime repair declaration');
  if (configChanged && !areas.has('configuration')) blockers.push('Operational configuration changed without a configuration repair declaration');
  if (configChanged && !compatibleAuditRepair(before.configuration.policy as CommittedAuditConfiguration, after.configuration.policy as CommittedAuditConfiguration)) blockers.push('Operational configuration removes or changes required checks or acceptance policy');
  const prior = new Map(before.candidate.files.map(entry => [entry.path, entry]));
  const current = new Map(after.candidate.files.map(entry => [entry.path, entry]));
  const changes = [...new Set([...prior.keys(), ...current.keys()])].sort().flatMap(path => {
    const original = prior.get(path) ?? { path, hash: null, mode: null }, next = current.get(path) ?? { path, hash: null, mode: null };
    return original.hash === next.hash && original.mode === next.mode ? [] : [{ path, before: original, after: next }];
  });
  if (areas.has('configuration') && !areas.has('target')) {
    const configPath = (after.configuration.policy as CommittedAuditConfiguration).path;
    if (changes.some(change => change.path !== configPath)) blockers.push('Configuration declaration does not cover additional target source changes');
    const categories = ['staged', 'unstaged', 'untracked'] as const;
    if (categories.some(category => {
      const priorPaths = before.candidate[category].filter(path => path !== configPath), nextPaths = after.candidate[category].filter(path => path !== configPath);
      return recoveryHash(priorPaths) !== recoveryHash(nextPaths);
    }) || (before.candidate.index !== after.candidate.index && !changes.some(change => change.path === configPath))) blockers.push('Configuration declaration does not cover unrelated index changes');
  }
  return externalRepairAdmissionSchema.parse({ schema: 'ramify-agent.external-repair-admission/1', before, after,
    declaration: declaration ?? null, admitted: blockers.length === 0, blockers, changes,
    invalidatesQualification: sourceChanged || configChanged || runtimeChanged,
    requiresReassessment: before.candidate.tree !== after.candidate.tree,
    outstandingVerification: declaration === undefined ? [] : ['The declared repair must be verified by the pending operation and required qualification'],
  });
}

/** Admission never silently incorporates a later candidate, index or runtime change. */
export function repairDispatchBlockers(admission: ExternalRepairAdmission, current: RecoveryIdentity): string[] {
  if (!admission.admitted) return [...admission.blockers];
  return recoveryHash(admission.after) === recoveryHash(current) ? [] : ['Candidate, captured inputs, durable records, configuration or runtime changed after repair admission; inspect and admit the current identities'];
}
