import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { deliveredScopeInputs as collectDelivered, type DeclaredScope, type DeliveredScopeInputs, type DeliveredSupportEntry } from '../capture.js';
import type { ArchitectIndex } from '../../../evidence/src/views.js';
import type { DeliveredManifest } from '../../../task-execution/src/delivery/delivered-manifest.js';
import type { WriteScope } from '../../../../src/work/scope.js';

/** Execution selection translation; accounting and overlap policy belong to KPI. */
export function writeScopeMeasurement(scope: WriteScope, providers: readonly string[] = []): DeclaredScope {
  const base = 'module' in scope.base ? [scope.base.module] : scope.base.modules;
  return {
    exactOwners: [...new Set([...base, ...scope.bootstrap.map(entry => entry.owner), ...providers])],
    subtrees: scope.resolved.included.filter(entry => entry.kind === 'child-subtree').map(entry => entry.owner),
    nestedProjects: scope.resolved.included.filter(entry => entry.kind === 'owned-nested-project').map(entry => entry.directory),
    locations: scope.extra.map(entry => ({ path: entry.path, bytes: null })),
    apiViews: true, architectView: false, supportDocuments: [],
  };
}

/** A separate read proxy, never merged into the writer selection. */
export function readScopeMeasurement(scope: WriteScope): DeclaredScope {
  return { exactOwners: [...new Set(scope.read)], subtrees: [], apiViews: true, architectView: false, supportDocuments: [] };
}

/** Preserve delivered ordering and identities, not prompt-construction implementation. */
export function deliveredSupportEntries(manifest: DeliveredManifest): readonly DeliveredSupportEntry[] {
  return manifest.entries.map(({ kind, source, hash, bytes, sources }) => ({
    kind, source, hash, bytes,
    sources: sources.map(({ path, hash, bytes }) => ({ path, hash, bytes })),
  }));
}

export function deliveredManifestScopeInputs(declared: DeclaredScope, manifest: DeliveredManifest): DeliveredScopeInputs {
  return collectDelivered(declared, deliveredSupportEntries(manifest));
}

export function planSupportPath(planId: string): string {
  return `plans/${planId}/plan.md`;
}

/** Acquire extra-location facts when execution starts. */
export async function invocationScope(
  projectRoot: string, declared: DeclaredScope, delivered: DeliveredManifest,
): Promise<DeclaredScope> {
  const locations: NonNullable<DeclaredScope['locations']>[number][] = [];
  for (const location of declared.locations ?? []) {
    const path = join(projectRoot, location.path);
    try {
      const found = await stat(path).catch((error: NodeJS.ErrnoException) => { if (error.code === 'ENOENT') return null; throw error; });
      if (found === null) { locations.push({ path: location.path, bytes: null, files: [] }); continue; }
      const measured = found.isDirectory() ? await measuredDirectory(path) : { bytes: found.size };
      if ('unreadable' in measured) { locations.push({ path: location.path, bytes: null, files: [], unreadable: measured.unreadable }); continue; }
      locations.push({ path: location.path, bytes: 'bytes' in measured ? measured.bytes : null, files: await locationFiles(projectRoot, path) });
    } catch (error) {
      locations.push({ path: location.path, bytes: null, files: [], unreadable: error instanceof Error ? error.message : String(error) });
    }
  }
  return deliveredManifestScopeInputs({ ...declared, locations }, delivered).scope;
}

async function locationFiles(root: string, path: string): Promise<readonly { path: string; bytes: number }[]> {
  const found = await stat(path);
  if (found.isFile()) return [{ path: inventoryPath(root, path), bytes: found.size }];
  if (!found.isDirectory()) return [];
  const files: { path: string; bytes: number }[] = [];
  for (const entry of await readdir(path, { withFileTypes: true })) {
    if (entry.isDirectory() || entry.isFile()) files.push(...await locationFiles(root, join(path, entry.name)));
  }
  return files;
}

async function measuredDirectory(directory: string): Promise<{ bytes: number } | { absent: true } | { unreadable: string }> {
  let entries;
  try { entries = await readdir(directory, { withFileTypes: true }); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { absent: true };
    return { unreadable: error instanceof Error ? error.message : String(error) };
  }
  let total = 0;
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      const nested = await measuredDirectory(path);
      if ('unreadable' in nested) return nested;
      if ('bytes' in nested) total += nested.bytes;
    } else if (entry.isFile()) total += (await stat(path)).size;
  }
  return { bytes: total };
}

export function inventoryPath(projectRoot: string, path: string): string {
  return relative(projectRoot, path).split(sep).join('/');
}

/** Reads support bytes, without deduplication or domain accounting. */
export async function supportDocument(projectRoot: string, path: string): Promise<{ path: string; bytes: number } | null> {
  try { const content = await readFile(path); return { path: inventoryPath(projectRoot, path), bytes: content.byteLength }; }
  catch { return null; }
}

/** Observation scope roots; an unresolved owner keeps status unknown. */
export function declaredRoots(index: ArchitectIndex | null, scope: DeclaredScope | undefined): string[] {
  if (scope === undefined) return [];
  const modules = [...scope.exactOwners, ...scope.subtrees];
  const entries = modules.map(module => index?.modules.get(module));
  if (entries.some(entry => entry === undefined)) return [];
  const directories = entries.map(entry => entry!.dir.replace(/\/+$/, '') || '.');
  return [...new Set([...directories, ...(scope.architectView ? ['.ramify-architect'] : []), ...(scope.locations ?? []).map(location => location.path)])];
}
