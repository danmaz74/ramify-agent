/** Opt-in native performance probe; absent from ordinary and audit test discovery. */
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { arch, cpus, platform, release, totalmem } from 'node:os';
import { performance } from 'node:perf_hooks';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const digest = (bytes: Uint8Array | string): string => createHash('sha256').update(bytes).digest('hex');
const args = process.argv.slice(2);
let output: string | undefined;
let samples = 5, warmups = 1;
const projects: Array<{ root: string; paths: string[] }> = [];
for (let i = 0; i < args.length; i += 1) {
  const flag = args[i], value = args[++i];
  if (!value) throw new Error(`Missing value for ${flag}`);
  if (flag === '--output') output = resolve(value);
  else if (flag === '--samples' || flag === '--warmups') {
    const count = Number(value);
    if (!Number.isSafeInteger(count) || count < (flag === '--samples' ? 1 : 0)) throw new Error(`Invalid ${flag}`);
    if (flag === '--samples') samples = count; else warmups = count;
  } else if (flag === '--project') projects.push({ root: resolve(value), paths: [] });
  else if (flag === '--path' && projects.length) projects.at(-1)!.paths.push(value);
  else throw new Error(`Unknown or misplaced argument ${flag}`);
}
if (!output) throw new Error('Required: --output <new receipt path>; existing files are never overwritten');
if (!projects.length) projects.push(
  { root: resolve('subs/harness/fixtures/collection-review'), paths: ['src/main.ts'] },
  { root: resolve('.'), paths: ['subs/harness/src/guard/write-guard.ts'] },
);
const executable = resolve('node_modules/.bin/ramify');
const manifest = JSON.parse(await readFile('package.json', 'utf8')) as { dependencies: Record<string, string> };
const providerManifestBytes = await readFile('node_modules/ramify.ts/package.json');
const providerManifest = JSON.parse(providerManifestBytes.toString()) as { version: string };
const runtimeIdentity = await readFile('node_modules/ramify.ts/dist/runtime-identity.json')
  .then(bytes => ({ sha256: digest(bytes), document: JSON.parse(bytes.toString()) as unknown }))
  .catch(error => ({ unavailable: String(error) }));
const receipt: Record<string, unknown> = {
  schema: 'ramify-agent.ownership-query-cost/1', startedAt: new Date().toISOString(), cwd: process.cwd(),
  provider: { pin: manifest.dependencies['ramify.ts'], installedVersion: providerManifest.version,
    packageManifestSha256: digest(providerManifestBytes), lockfileSha256: digest(await readFile('package-lock.json')),
    executable, executableSha256: digest(await readFile(executable)) },
  runtimeIdentity,
  host: { node: process.version, platform: platform(), arch: arch(), release: release(),
    cpu: cpus()[0]?.model ?? null, logicalCpus: cpus().length, totalMemoryBytes: totalmem() },
  conditions: { samples, warmups, order: 'alternating ownership/affected by pair', daemon: false,
    cache: 'no probe or harness cache; no OS cache flush or cold guarantee; filesystem/OS warmth uncontrolled',
    domain: 'fresh native process wall time including startup and JSON output; repeated per-write query model on unchanged candidate, not write latency',
    identity: 'provider input identities identify their own operation domains; equality is not assumed',
    stageTwo: 'No checkpoint capture, storage or write-cost measurement' }, projects: [],
};
// Reserve the exact requested destination before any native invocation.
await writeFile(output, JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
const save = async (): Promise<void> => { await writeFile(output!, JSON.stringify(receipt, null, 2) + '\n'); };
try {
  const head = await execute('git', ['rev-parse', 'HEAD'], { timeout: 30_000 });
  const dirty = await execute('git', ['status', '--porcelain=v1'], { timeout: 30_000 });
  receipt.consumer = { head: head.stdout.trim(), dirty: dirty.stdout };
  const version = await execute(executable, ['--version'], { timeout: 30_000, maxBuffer: 1024 * 1024 });
  Object.assign(receipt.provider as object, { version: version.stdout.trim(), versionStderr: version.stderr });
  for (const project of projects) {
    if (!project.paths.length) project.paths.push('.');
    const identities = await Promise.all([...new Set(['module.ramify', 'tsconfig.json', 'package.json', ...project.paths.filter(path => path !== '.')])].map(async path => {
      try { return { path, sha256: digest(await readFile(resolve(project.root, path))) }; }
      catch (error) { return { path, unavailable: String(error) }; }
    }));
    const result = { ...project, identities, observations: [] as Array<Record<string, unknown>> };
    (receipt.projects as unknown[]).push(result);
    for (let pair = 0; pair < warmups + samples; pair += 1) {
      const order = pair % 2 === 0 ? ['ownership', 'affected'] : ['affected', 'ownership'];
      for (const operation of order) {
        const command = [operation, ...(operation === 'affected' ? ['--batch'] : []), '--root', project.root,
          '--format', 'json', ...project.paths.flatMap(path => ['--path', path])];
        const startedAt = new Date().toISOString(), start = performance.now();
        let stdout = '', stderr = '', exitCode: number | string = 0, executionFailure: string | null = null;
        try { ({ stdout, stderr } = await execute(executable, command, { cwd: project.root, timeout: 180_000, maxBuffer: 32 * 1024 * 1024 })); }
        catch (error) {
          const failure = error as Error & { stdout?: string; stderr?: string; code?: number | string };
          stdout = failure.stdout ?? ''; stderr = failure.stderr ?? ''; exitCode = failure.code ?? 'unknown';
          executionFailure = failure.message;
        }
        const elapsedMs = performance.now() - start;
        let document: unknown = null;
        try { document = JSON.parse(stdout); } catch { /* Raw unsupported output is retained. */ }
        const payload = document !== null && typeof document === 'object' ? document as Record<string, unknown> : null;
        const selection = payload?.selection as Record<string, unknown> | undefined;
        const coverage = selection?.coverage as Record<string, unknown> | undefined;
        const eligibleForLatencyComparison = exitCode === 0 && executionFailure === null &&
          (operation === 'ownership' ? payload?.schemaVersion === 'ramify.ownership/1' && payload.status === 'answered'
            : payload?.schemaVersion === 'ramify.affected-cli/4' && payload.mode === 'batch' &&
              selection?.analysisCheck === 'passed' && coverage?.status === 'complete');
        result.observations.push({ operation, phase: pair < warmups ? 'warmup' : 'sample', pair, startedAt,
          firstInvocationForOperation: pair === 0, eligibleForLatencyComparison,
          comparisonReason: eligibleForLatencyComparison ? 'answered acquisition with expected successful coverage'
            : 'failure, unsupported output, failed analysis or incomplete coverage; retain timing without equivalent-success comparison',
          command: [executable, ...command], elapsedMs, exitCode, executionFailure, stdout, stderr, document });
        await save();
        if (operation === 'ownership' && !(typeof document === 'object' && document !== null &&
          (document as Record<string, unknown>).schemaVersion === 'ramify.ownership/1')) {
          throw new Error('Installed ownership command returned unsupported output; no affected fallback or ownership latency claim');
        }
      }
    }
  }
  receipt.completedAt = new Date().toISOString();
} catch (error) {
  receipt.failure = String(error); process.exitCode = 1;
} finally { await save(); }
