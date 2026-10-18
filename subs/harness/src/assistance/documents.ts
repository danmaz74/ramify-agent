import { resolve, relative, isAbsolute, sep } from 'node:path';
import type { Dirent } from 'node:fs';
import { discoverDocuments, type DocumentReader, type OutsideDocumentReference } from '../../subs/plan-evidence/src/discovery.js';
import type { DocumentManifest } from '../../subs/plan-evidence/src/interfaces/contracts.js';
import { gitCandidateSource, type CandidateSource, type TreeEntry } from '../../subs/evidence/src/git.js';
import { planIdSchema } from '../interfaces/protocol/ids.js';

export interface AssistanceDocument {
  readonly id: string;
  readonly path: string;
  readonly kind: 'plan' | 'principle';
  readonly sha256: string;
  readonly text: string;
  /** Filename and location alone do not establish adoption. */
  readonly adoption: 'undetermined';
}

export interface AssistanceDocuments {
  readonly baselineCommit: string;
  readonly manifest: DocumentManifest;
  readonly documents: readonly AssistanceDocument[];
  readonly gaps: {
    readonly missing: DocumentManifest['missing'];
    readonly unreadablePrinciples: DocumentManifest['principlesScan']['unreadable'];
    /** Absent in older retained document stages. Targets were never read. */
    readonly outsideProject?: readonly OutsideDocumentReference[];
  };
}

/** Capture the existing discovery result from immutable Git objects and the job's plan input. */
export async function captureAssistanceDocuments(input: {
  readonly projectRoot: string;
  readonly planId: string;
  readonly planMarkdown: string;
  readonly baselineCommit: string;
  readonly candidates?: CandidateSource;
}): Promise<AssistanceDocuments> {
  planIdSchema.parse(input.planId);
  const source = input.candidates ?? gitCandidateSource;
  const entries = await source.treeEntries(input.projectRoot, input.baselineCommit);
  const reader = candidateDocumentReader(input.projectRoot, input.planId, input.planMarkdown, input.baselineCommit, entries, source);
  const outsideProject: OutsideDocumentReference[] = [];
  const captured = await discoverDocuments(input.projectRoot, input.planId, { commit: input.baselineCommit, dirty: false }, reader,
    { onOutsideReference: reference => outsideProject.push(reference) });
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const documents = captured.manifest.documents.map(document => {
    const bytes = captured.bytes.get(document.id);
    if (bytes === undefined) throw new Error(`Missing captured document bytes for ${document.path}`);
    return { id: document.id, path: document.path, kind: document.kind, sha256: document.sha256,
      text: decoder.decode(bytes), adoption: 'undetermined' as const };
  });
  return { baselineCommit: input.baselineCommit, manifest: captured.manifest, documents,
    gaps: { missing: captured.manifest.missing, unreadablePrinciples: captured.manifest.principlesScan.unreadable, outsideProject } };
}

/** Present a candidate tree to existing document discovery without reading the worktree. */
export function candidateDocumentReader(rootPath: string, planId: string, planMarkdown: string,
  baselineCommit: string, entries: readonly TreeEntry[], source: CandidateSource): DocumentReader {
  const root = resolve(rootPath);
  const planPath = `plans/${planId}/plan.md`;
  const files = new Map(entries.filter(entry => entry.kind === 'file' || entry.kind === 'executable')
    .map(entry => [entry.path, entry]));
  const links = new Set(entries.filter(entry => entry.kind === 'symlink').map(entry => entry.path));
  files.set(planPath, { path: planPath, kind: 'file', bytes: Buffer.byteLength(planMarkdown) });
  const directories = new Set<string>(['']);
  for (const path of [...files.keys(), ...links]) {
    const parts = path.split('/');
    for (let i = 1; i < parts.length; i += 1) directories.add(parts.slice(0, i).join('/'));
  }
  const pathOf = (absolute: string): string => {
    const path = relative(root, resolve(absolute)).split(sep).join('/');
    if (path === '..' || path.startsWith('../') || isAbsolute(path)) throw new Error(`Document path escapes the project: ${absolute}`);
    if (path === 'docs/.superseded' || path.startsWith('docs/.superseded/')) throw new Error('Superseded design documents are excluded');
    return path;
  };
  const exists = (path: string): boolean => files.has(path) || directories.has(path);
  const missing = (path: string): Error => Object.assign(new Error(`No committed document at ${path}`), { code: 'ENOENT' });
  return {
    async real(path) {
      const relativePath = pathOf(path);
      if (!exists(relativePath)) throw missing(relativePath);
      return resolve(root, relativePath);
    },
    async isFile(path) { return files.has(pathOf(path)); },
    async list(path) {
      const directory = pathOf(path);
      if (!directories.has(directory)) throw missing(directory);
      const prefix = directory === '' ? '' : `${directory}/`;
      const names = new Set<string>();
      for (const candidate of [...directories, ...files.keys(), ...links]) {
        if (!candidate.startsWith(prefix) || candidate === directory) continue;
        const tail = candidate.slice(prefix.length);
        if (tail !== '' && !tail.includes('/')) names.add(tail);
      }
      if (directory === 'docs') names.delete('.superseded');
      return [...names].map(name => {
        const child = `${prefix}${name}`;
        return { name, isFile: () => files.has(child), isDirectory: () => directories.has(child),
          isSymbolicLink: () => links.has(child) } as Dirent;
      });
    },
    async read(path) {
      const relativePath = pathOf(path);
      if (relativePath === planPath) return new TextEncoder().encode(planMarkdown);
      const entry = files.get(relativePath);
      if (entry === undefined) throw missing(relativePath);
      const text = await source.readBlob(rootPath, baselineCommit, relativePath);
      const bytes = new TextEncoder().encode(text);
      if (entry.bytes !== null && bytes.length !== entry.bytes) {
        throw new Error(`Document ${relativePath} could not be decoded exactly from Git`);
      }
      return bytes;
    },
  };
}
