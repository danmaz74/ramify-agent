import { sep } from 'node:path';
import type { ArchitectIndex, ModuleEntry } from '../../subs/evidence/src/views.js';

/**
 * The module that owns this path: the one whose own contents contain it.
 * An owner's own contents are its source areas and its two declaration
 * files, which is what an assignment's write scope reaches. A path no
 * module's contents hold — the project's manifest, a document beside a
 * module, the run's own state — has no owner, and the root is never made to
 * stand in for one because its directory is the whole project.
 */
export function ownerOf(index: ArchitectIndex | null, path: string): string | null {
  if (index === null) return null;
  const target = path.split(sep).join('/');
  let best: { module: string; length: number } | null = null;
  for (const entry of index.modules.values()) {
    if (!owns(entry, target)) continue;
    const length = entry.dir.split(sep).join('/').length;
    if (best === null || length > best.length) best = { module: entry.module, length };
  }
  return best?.module ?? null;
}

/** Whether this module's own contents hold the path. */
function owns(entry: ModuleEntry, target: string): boolean {
  const dir = entry.dir.split(sep).join('/').replace(/\/+$/, '');
  const within = (suffix: string) => {
    const location = dir === '' ? suffix : `${dir}/${suffix}`;
    return target === location || target.startsWith(`${location}/`);
  };
  if (entry.areas.some(area => within(area))) return true;
  return ['module.ramify', 'README.md'].some(file => target === (dir === '' ? file : `${dir}/${file}`));
}
