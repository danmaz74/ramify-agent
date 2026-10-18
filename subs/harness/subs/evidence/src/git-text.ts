import { createHash } from 'node:crypto';
import type { CandidateSource, TreeEntry } from './git.js';

/** An unavailable exact-text response, distinguished from a known NUL binary. */
export class GitTextError extends Error {
  constructor(readonly reason: 'binary' | 'unavailable', message: string) { super(message); this.name = 'GitTextError'; }
}

/** Validate one immutable blob's exact UTF-8 response before accepting it as text evidence. */
export async function readVerifiedTextBlobBytes(root: string, commit: string, entry: TreeEntry, source: Pick<CandidateSource, 'readBlob'>, signal?: AbortSignal): Promise<Uint8Array> {
  if (entry.kind !== 'file' && entry.kind !== 'executable') throw new GitTextError('unavailable', `Document ${entry.path} is not a regular file`);
  const text = await source.readBlob(root, commit, entry.path, signal);
  const bytes = new TextEncoder().encode(text);
  if (text.includes('\0')) throw new GitTextError('binary', `Document ${entry.path} contains binary NUL bytes`);
  if (entry.bytes === null || bytes.length !== entry.bytes || new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes) !== text) {
    throw new GitTextError('unavailable', `Document ${entry.path} could not be decoded exactly from Git`);
  }
  if (entry.objectId !== undefined) {
    if (!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/u.test(entry.objectId)) throw new GitTextError('unavailable', `Document ${entry.path} has unavailable Git blob identity`);
    const identity = createHash(entry.objectId.length === 40 ? 'sha1' : 'sha256').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
    if (identity !== entry.objectId) throw new GitTextError('unavailable', `Document ${entry.path} could not be decoded exactly from Git`);
  } else if (text.includes('\uFFFD')) {
    throw new GitTextError('unavailable', `Document ${entry.path} has ambiguous replacement characters without Git blob identity`);
  }
  return bytes;
}

const verifiedSources = new WeakSet<CandidateSource>();

/** All textual Git projections must originate in blobs whose exact text is available.
 * The raw adapter remains usable for binary acquisition; assessment consumers use this boundary.
 */
export function verifiedCandidateSource(source: CandidateSource, seed?: { root: string; commit: string; entries: ReadonlyMap<string, TreeEntry> }): CandidateSource {
  if (verifiedSources.has(source)) return source;
  const manifests = new Map<string, ReadonlyMap<string, TreeEntry>>();
  const key = (root: string, commit: string) => JSON.stringify([root, commit]);
  if (seed) manifests.set(key(seed.root, seed.commit), seed.entries);
  const entries = async (root: string, commit: string, signal?: AbortSignal) => {
    signal?.throwIfAborted();
    const cached = manifests.get(key(root, commit));
    if (cached) return cached;
    let listed: ReadonlyMap<string, TreeEntry>;
    try { listed = new Map((await source.treeEntries(root, commit, signal)).map(entry => [entry.path, entry])); }
    catch (error) { signal?.throwIfAborted(); throw new GitTextError('unavailable', `Source manifest at ${commit} is unavailable: ${error instanceof Error ? error.message : String(error)}`); }
    manifests.set(key(root, commit), listed);
    return listed;
  };
  const read = async (root: string, commit: string, path: string, signal?: AbortSignal) => {
    signal?.throwIfAborted();
    const entry = (await entries(root, commit, signal)).get(path);
    if (!entry) throw new GitTextError('unavailable', `Document ${path} is unavailable at ${commit}`);
    try { return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(await readVerifiedTextBlobBytes(root, commit, entry, source, signal)); }
    catch (error) {
      signal?.throwIfAborted();
      if (error instanceof GitTextError) throw error;
      throw new GitTextError('unavailable', `Document ${path} is unavailable: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  const verified: CandidateSource = {
    commitTree: (...args) => source.commitTree(...args),
    treeEntries: (...args) => source.treeEntries(...args),
    diffNameStatus: (...args) => source.diffNameStatus(...args),
    readBlob: read,
    async diffPatch(root, from, to, path, signal) {
      // A deletion's text belongs to the base. Checking only the candidate
      // would leave removed and context lines exposed to lossy decoding.
      const changedPaths = path === undefined ? (await source.diffNameStatus(root, from, to, signal)).map(change => change.path) : [path];
      let found = false;
      for (const commit of [from, to]) {
        const held = await entries(root, commit, signal);
        const paths = changedPaths.filter(item => held.has(item));
        for (const item of paths) { found = true; await read(root, commit, item, signal); }
      }
      if (!found) throw new GitTextError('unavailable', `Patch ${path ?? '(all paths)'} has no verifiable source`);
      return source.diffPatch(root, from, to, path, signal);
    },
    async grepTree(root, commit, pattern, paths, signal) {
      const matches = await source.grepTree(root, commit, pattern, paths, signal);
      const texts = new Map<string, string[]>();
      for (const match of matches) {
        let lines = texts.get(match.path);
        if (!lines) { lines = (await read(root, commit, match.path, signal)).split('\n'); texts.set(match.path, lines); }
        if (!Number.isSafeInteger(match.line) || match.line < 1 || lines[match.line - 1] !== match.text)
          throw new GitTextError('unavailable', `Search match for ${match.path}:${match.line} does not match exact source text`);
      }
      return matches;
    },
  };
  verifiedSources.add(verified);
  return verified;
}

