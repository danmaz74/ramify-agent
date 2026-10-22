import { readFileSync, realpathSync, statSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { createVitest } from 'vitest/node';

/** The include and exclude globs of one configured Vitest project. */
export interface Discovery { environment: 'node' | 'jsdom'; include: string[]; exclude: string[] }

/**
 * Reads and validates src/tests/test-boundaries.json under `root`, and returns
 * the registered boundary files. Every file must be an exact, regular,
 * registered-once path inside the root that the Node project's own discovery
 * would otherwise select. Any defect throws, which fails configuration.
 */
export async function boundaryPaths(root: string, nodeDiscovery: Discovery, webDiscovery: Discovery): Promise<string[]> {
  const manifest = JSON.parse(readFileSync(resolve(root, 'src/tests/test-boundaries.json'), 'utf8'));
  if (manifest.schema !== 'ramify-agent.test-boundaries/1' || !Array.isArray(manifest.boundaries)) throw new Error('Invalid test boundary registry schema');
  const paths: string[] = [];
  for (const entry of manifest.boundaries) {
    if (typeof entry.file !== 'string' || /[\\*?{}[\]]/.test(entry.file) || entry.file !== relative(root, resolve(root, entry.file)).split('\\').join('/') ||
        !entry.boundary?.trim() || !entry.whyFakeCannotProve?.trim() || !Array.isArray(entry.owningCases) || !entry.owningCases.length || entry.owningCases.some((value: unknown) => typeof value !== 'string' || !value.trim())) throw new Error('Invalid exact test boundary registration');
    if (paths.includes(entry.file)) throw new Error(`Duplicate test boundary registration: ${entry.file}`);
    const absolute = resolve(root, entry.file);
    if (!statSync(absolute).isFile() || realpathSync(absolute) !== absolute) throw new Error(`Missing or non-regular test boundary: ${entry.file}`);
    paths.push(entry.file);
  }
  // Ask the installed runner for its authoritative original discovery. This does
  // not collect/execute tests and does not launch a worker or a test subprocess.
  const discovery = await createVitest('test', { config: false, watch: false }, { root, test: { projects: [
    { test: { ...nodeDiscovery, name: 'inventory-node' } },
    { test: { ...webDiscovery, name: 'inventory-web' } },
  ] } });
  try {
    const discovered = new Map((await discovery.globTestSpecifications()).map(spec => [relative(root, spec.moduleId).split('\\').join('/'), spec.project.name]));
    for (const path of paths) if (discovered.get(path) !== 'inventory-node') throw new Error(`Test boundary is outside configured Node discovery: ${path}`);
  } finally { await discovery.close(); }
  return paths;
}
