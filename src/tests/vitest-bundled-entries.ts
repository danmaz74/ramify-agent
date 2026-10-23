import { build, type Plugin } from 'esbuild';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { TestProject } from 'vitest/node';

/*
 * Global setup of the boundaries project. Boundary tests spawn `node <bundle>`
 * instead of `node --import tsx <entry>` for the CLI and for the native hosts
 * they launch several times: loading these module graphs through tsx costs
 * about a second per launch, and a coordinator witness runs the CLI dozens of
 * times. The bundles are built once per run; tests read their paths with
 * `inject('bundledEntries')`.
 *
 * A bundle behaves as its source entry does. Each bundled module keeps its
 * own `import.meta.url`, so files read relative to a module (prompts,
 * procedures, Python scripts, package assets) resolve where they do in the
 * source tree, and `process.argv[1]` names the source entry, as under tsx.
 * The bundles live in a per-run directory under node_modules/.cache, so the
 * packages they resolve at run time (`import.meta.resolve`, `require`) are
 * the installed ones.
 */

const entries = {
  cli: 'src/main.ts',
  breakpointHost: 'subs/harness/src/tests/helpers/breakpoint-host.ts',
  publicationHost: 'subs/harness/subs/assistance/src/tests/native-publication-host.ts',
};
type BundledEntries = { [name in keyof typeof entries]: string };
declare module 'vitest' {
  export interface ProvidedContext { bundledEntries: BundledEntries }
}

const root = fileURLToPath(new URL('../../', import.meta.url));
// photon-node reads its wasm through CommonJS `__dirname`, which a module in
// an ESM bundle does not have; it stays an import of the installed file.
const installed = /^@silvia-odwyer\/photon-node$/;
const loaders = { '.ts': 'ts', '.mts': 'ts', '.cts': 'ts', '.js': 'js', '.mjs': 'js', '.cjs': 'js' } as const;

const modulePaths: Plugin = {
  name: 'module-paths',
  setup(bundle) {
    bundle.onResolve({ filter: installed }, async ({ path, kind, resolveDir, pluginData }) => {
      if (pluginData === 'installed') return undefined;
      const resolved = await bundle.resolve(path, { kind, resolveDir, pluginData: 'installed' });
      return resolved.errors.length ? { errors: resolved.errors } : { path: pathToFileURL(resolved.path).href, external: true };
    });
    bundle.onLoad({ filter: /\.[cm]?[jt]s$/ }, async ({ path }) => {
      const text = await readFile(path, 'utf8');
      if (!text.includes('import.meta.url')) return undefined;
      return { contents: text.replaceAll('import.meta.url', JSON.stringify(pathToFileURL(path).href)), loader: loaders[extname(path) as keyof typeof loaders] };
    });
  },
};

export default async function setup(project: TestProject): Promise<() => Promise<void>> {
  await mkdir(join(root, 'node_modules/.cache'), { recursive: true });
  const directory = await mkdtemp(join(root, 'node_modules/.cache/ramify-agent-bundles-'));
  const names = Object.keys(entries) as Array<keyof typeof entries>;
  const bundled = Object.fromEntries(names.map(name => [name, join(directory, `${name}.mjs`)])) as BundledEntries;
  const sources = Object.fromEntries(names.map(name => [bundled[name], join(root, entries[name])]));
  try {
    await build({
      entryPoints: Object.fromEntries(names.map(name => [name, join(root, entries[name])])), outdir: directory, outExtension: { '.js': '.mjs' }, chunkNames: 'chunks/[name]-[hash]',
      bundle: true, splitting: true, format: 'esm', platform: 'node', target: `node${process.versions.node}`, logLevel: 'error',
      plugins: [modulePaths],
      banner: { js: `import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url); process.argv[1] = ${JSON.stringify(sources)}[process.argv[1]] ?? process.argv[1];` },
    });
  } catch (error) { await rm(directory, { recursive: true, force: true }); throw error; }
  project.provide('bundledEntries', bundled);
  return () => rm(directory, { recursive: true, force: true });
}
