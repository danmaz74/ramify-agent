import { createHash } from 'node:crypto';
import { lstat, readFile, readlink, readdir } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve } from 'node:path';
import { z } from 'zod';
import { modulePathSchema, sha256Schema } from '../../../../../../src/interfaces/protocol/evidence.js';
import { writeScopeSchema, type WriteScope } from '../../../../../../src/work/scope.js';

const text = z.string().min(1);
/** Optional delegation issued by the plan architect while current ownership is valid. */
export const contingentRepairDelegationSchema = z.object({
  root: modulePathSchema,
  included: z.array(z.object({ directory: text, reason: text, instructions: text }).strict()),
  instructions: text,
}).strict();
export const automaticRepairAssignmentSchema = z.object({
  schema: z.literal('ramify-agent.automatic-repair-assignment/1'), id: text, invocation: text,
  delegation: contingentRepairDelegationSchema, scope: writeScopeSchema,
  guarded: z.array(z.object({ path: text, hash: sha256Schema.nullable() }).strict()),
}).strict();
export type AutomaticRepairAssignment = z.infer<typeof automaticRepairAssignmentSchema>;

export const repairPreparationSchema = z.object({
  schema: z.literal('ramify-agent.repair-preparation/1'), id: text, operation: z.literal('prepare-local-architect'),
  workItem: text, attempt: z.int().positive(), recordedAt: z.iso.datetime(), ledgerSequence: z.int().nonnegative(),
  acceptedCommit: text, candidateBefore: z.object({ head: text, tree: text }).strict().nullable(), candidateFailure: text.nullable(), candidatePaths: z.array(text), repairAssignment: text.nullable(), originalAssignment: text.nullable(), originalResult: text.nullable(),
  originalInvocation: text.nullable(), inputReferences: z.array(text),
}).strict();
export type RepairPreparation = z.infer<typeof repairPreparationSchema>;

/** Exact source identities; directories and symlinks are never mistaken for ordinary file bytes. */
export const repairFileIdentitySchema = z.object({ path: text, hash: text.nullable(), mode: z.int().nonnegative().nullable() }).strict();
export type RepairFileIdentity = z.infer<typeof repairFileIdentitySchema>;
export const repairDeltaSchema = z.object({
  schema: z.literal('ramify-agent.automatic-repair-delta/1'), incidentId: text, assignment: text,
  originalAssignment: text, acceptedCommit: text, invocation: text,
  beforeValidated: z.literal(true), beforeDirtyPaths: z.array(text), before: z.array(repairFileIdentitySchema), after: z.array(repairFileIdentitySchema),
  changes: z.array(z.object({ path: text, before: repairFileIdentitySchema, after: repairFileIdentitySchema }).strict()),
  structure: z.array(z.object({ path: text, hash: sha256Schema.nullable() }).strict()),
}).strict();
export type RepairDelta = z.infer<typeof repairDeltaSchema>;
export const repairAttemptSchema = z.object({
  schema: z.literal('ramify-agent.automatic-repair-attempt/1'), incidentId: text, invocation: text,
  before: z.array(repairFileIdentitySchema), after: z.array(repairFileIdentitySchema),
  changes: z.array(z.object({ path: text, before: repairFileIdentitySchema, after: repairFileIdentitySchema }).strict()),
  protectedBefore: z.array(repairFileIdentitySchema), failure: z.string().nullable(),
}).strict();

export async function repairFileIdentity(root: string, path: string): Promise<RepairFileIdentity> {
  const absolute = resolve(root, path), inside = relative(root, absolute);
  if (inside === '' || inside === '..' || inside.startsWith('../') || isAbsolute(inside)) throw new Error(`Repair evidence escapes the project: ${path}`);
  const info = await lstat(absolute).catch(error => {
    if (['ENOENT', 'ENOTDIR'].includes((error as NodeJS.ErrnoException).code ?? '')) return null;
    throw error;
  });
  if (info === null) return { path, hash: null, mode: null };
  const bytes = info.isSymbolicLink() ? `symlink:${await readlink(absolute)}` : info.isFile() ? await readFile(absolute) : 'directory';
  return { path, hash: createHash('sha256').update(bytes).digest('hex'), mode: info.mode & 0o177777 };
}
export async function captureRepairFiles(root: string, paths: readonly string[]): Promise<RepairFileIdentity[]> {
  return Promise.all([...new Set(paths)].sort().map(path => repairFileIdentity(root, path)));
}
export function repairChanges(before: readonly RepairFileIdentity[], after: readonly RepairFileIdentity[]): RepairDelta['changes'] {
  const prior = new Map(before.map(file => [file.path, file]));
  return after.flatMap(file => {
    const original = prior.get(file.path) ?? { path: file.path, hash: null, mode: null };
    return file.hash === original.hash && file.mode === original.mode ? [] : [{ path: file.path, before: original, after: file }];
  });
}
/** Gates admit only the verified final bytes, never a later edit to the same path. */
export async function unchangedRepairPaths(root: string, delta: RepairDelta): Promise<string[]> {
  const result: string[] = [];
  for (const change of delta.changes) {
    const current = await repairFileIdentity(root, change.path);
    if (current.hash === change.after.hash && current.mode === change.after.mode) result.push(change.path);
  }
  return result;
}
/** Every existing declaration is protected. This experiment permits no declaration redesign. */
export function declarationPaths(assignment: AutomaticRepairAssignment): string[] {
  return assignment.scope.resolved.ownership.modules.map(module => join(module.directory === '.' ? '' : module.directory, 'module.ramify').replaceAll('\\', '/'));
}

/** Snapshot source bytes before the writer; protected/generated trees are excluded from traversal. */
export async function captureRepairSource(root: string, scope: WriteScope): Promise<RepairFileIdentity[]> {
  const paths = new Set<string>();
  const excluded = scope.resolved.excluded.map(path => resolve(root, path));
  const blocked = (path: string) => excluded.some(base => path === base || path.startsWith(`${base}/`));
  const walk = async (absolute: string): Promise<void> => {
    if (blocked(absolute)) return;
    const info = await lstat(absolute).catch(error => {
      if (['ENOENT', 'ENOTDIR'].includes((error as NodeJS.ErrnoException).code ?? '')) return null;
      throw error;
    });
    if (info === null) return;
    if (!info.isDirectory() || info.isSymbolicLink()) { paths.add(relative(root, absolute).replaceAll('\\', '/')); return; }
    for (const entry of await readdir(absolute, { withFileTypes: true })) {
      if (['.git', 'node_modules', '.ramify', '.ramify-architect', '.harness'].includes(entry.name)) continue;
      await walk(join(absolute, entry.name));
    }
  };
  for (const path of [...scope.resolved.roots, ...scope.resolved.files]) await walk(resolve(root, path));
  return captureRepairFiles(root, [...paths]);
}
