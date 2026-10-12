import { readdir, readFile } from 'node:fs/promises';
import { statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { recoveryHash, type RecoveryRuntime } from './recovery-admission.js';

const retained = new Map<string, { fingerprint: string; hash: string }>();
async function sourceHash(url: URL): Promise<string> {
  const info = statSync(url, { bigint: true });
  const fingerprint = `${info.dev}:${info.ino}:${info.size}:${info.mtimeNs}:${info.ctimeNs}`;
  const previous = retained.get(url.href);
  if (previous?.fingerprint === fingerprint) return previous.hash;
  const hash = createHash('sha256').update(await readFile(url)).digest('hex');
  retained.set(url.href, { fingerprint, hash }); return hash;
}
async function sources(directory: URL): Promise<URL[]> {
  const files: URL[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!['tests', 'tmp', 'node_modules', '.ramify', '.ramify-architect', 'fixtures'].includes(entry.name)) files.push(...await sources(new URL(`${entry.name}/`, directory)));
    } else if (/\.(?:ts|js|json)$/u.test(entry.name) && !entry.name.endsWith('.d.ts')) files.push(new URL(entry.name, directory));
  }
  return files;
}

/** Source-backed compatibility is conservative: protected contract bytes must remain exact. */
export async function captureInstalledRecoveryRuntime(executor: string): Promise<RecoveryRuntime> {
  const files = await sources(new URL('../../', import.meta.url));
  const entries = await Promise.all(files.sort((a, b) => a.href.localeCompare(b.href)).map(async url => ({ path: url.pathname, hash: await sourceHash(url) })));
  return recoveryRuntimeFromSources(executor, entries, await sourceHash(new URL('../../../../package-lock.json', import.meta.url)));
}

/** Source identity determines compatibility independently of version labels. */
export function recoveryRuntimeFromSources(executor: string, entries: readonly { path: string; hash: string }[], dependencies: string): RecoveryRuntime {
  const group = (accept: (path: string) => boolean) => recoveryHash(entries.filter(entry => accept(entry.path)));
  const contract = (accept: (path: string) => boolean) => recoveryHash({ sources: group(accept), dependencies });
  return { harness: group(path => !path.includes('/agent/')),
    provider: `${executor}:${recoveryHash({ code: group(path => path.includes('/agent/')), dependencies })}`,
    contracts: {
      policy: contract(path => /\/(?:run|capability)\/policy\./u.test(path)),
      records: contract(path => /\/records\.|\/repair-records\.|\/nonfunctional-records\.|\/interfaces\/|\/ledger\/src\//u.test(path)),
      submissions: contract(path => /\/submissions\.|\/engineer\.|\/analysis\/|\/nonfunctional\/submissions\.|\/capability\/(?:actions|authorization)\./u.test(path)),
      equipment: contract(path => /\/engineer-equipment\.|\/consultations\/tools\.|\/interfaces\/(?:port|session-operations)\.|\/agent\/src\/session-operations\.|\/run\/(?:session-store|session-operations)\.|\/steps\/runner\./u.test(path)),
      authority: contract(path => /\/guard\/|\/ownership-authority\.|\/checks\/|\/capability\/authorization\.|\/audit\/src\/|\/evidence\/src\/|\/run\/|\/steps\//u.test(path)),
    } };
}
