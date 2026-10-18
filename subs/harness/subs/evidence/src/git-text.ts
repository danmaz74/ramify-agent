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

