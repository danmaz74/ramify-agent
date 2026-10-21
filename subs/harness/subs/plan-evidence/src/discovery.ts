import { createHash } from 'node:crypto';
import { lstat, readFile, readdir, realpath } from 'node:fs/promises';
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import type { Dirent } from 'node:fs';
import { documentManifestSchema, type DocumentManifest, type IdentityContract } from './interfaces/contracts.js';

/** Read-only filesystem boundary used by document discovery. */
export interface DocumentReader {
  read(path: string): Promise<Uint8Array>;
  list(path: string): Promise<Dirent[]>;
  real(path: string): Promise<string>;
  isFile(path: string): Promise<boolean>;
}

export const nodeDocumentReader: DocumentReader = {
  read: path => readFile(path),
  list: path => readdir(path, { withFileTypes: true }),
  real: path => realpath(path),
  isFile: async path => (await lstat(path)).isFile(),
};

export interface DiscoveredDocuments {
  readonly manifest: DocumentManifest;
  /** Indexed by document ID, retaining the exact captured bytes. */
  readonly bytes: ReadonlyMap<string, Uint8Array>;
}

/** An uncaptured lexical link, retained without inspecting its external target. */
export interface OutsideDocumentReference {
  readonly from: string;
  readonly target: string;
  readonly source: { readonly start: number; readonly end: number };
  readonly reason: string;
  readonly judgment: 'unjudged';
}

export interface DocumentDiscoveryOptions {
  /** Assisted assessment retains external links for semantic applicability review. Default discovery still rejects them. */
  readonly onOutsideReference?: (reference: OutsideDocumentReference) => void;
  /** Root-plan failure remains fatal. Unreadable companions retain qualifications when requested. */
  readonly onUnreadableDocument?: (reference: UnreadableDocumentReference) => void;
}

export interface UnreadableDocumentReference {
  readonly path: string;
  readonly reason: string;
  readonly judgment: 'unjudged';
}

const binaryExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.pdf', '.zip', '.gz', '.wasm', '.mp4', '.mp3', '.woff', '.woff2', '.ttf']);
const textCandidate = (path: string): boolean => !binaryExtensions.has(extname(path).toLowerCase());
const excluded = new Set(['.git', '.harness', '.ramify', '.ramify-architect', 'node_modules', 'dist', 'build', 'coverage', '.next']);
const decoder = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });
const hash = (bytes: Uint8Array): string => createHash('sha256').update(bytes).digest('hex');
const posixPath = (path: string): string => path.split(sep).join('/');

/** The link's byte span stays attached to its referring source, including duplicates. */
interface Link { readonly target: string; readonly start: number; readonly end: number }

function localLinks(text: string, includeNonText = false): Link[] {
  const links: Link[] = [];
  const definitions = new Map<string, string>();
  for (const match of text.matchAll(/^ {0,3}\[([^\]]+)\]:\s*(?:<([^>]+)>|(\S+))/gmu)) {
    definitions.set(match[1]!.trim().toLowerCase().replace(/\s+/gu, ' '), match[2] ?? match[3]!);
  }
  const add = (raw: string, startIndex: number, endIndex: number) => {
    raw = raw.replace(/\\([\\`*{}\[\]()#+.!_>~-])/gu, '$1');
    if (!raw || raw.startsWith('#') || /^[a-z][a-z0-9+.-]*:/iu.test(raw) || raw.startsWith('//')) return;
    let target: string;
    try { target = decodeURIComponent(raw.split(/[?#]/u, 1)[0]!); } catch { target = raw.split(/[?#]/u, 1)[0]!; }
    if (!target || !includeNonText && !textCandidate(target)) return;
    links.push({ target, start: Buffer.byteLength(text.slice(0, startIndex), 'utf8'), end: Buffer.byteLength(text.slice(0, endIndex), 'utf8') });
  };
  for (let at = 0; at < text.length; at += 1) {
    if (text[at] !== '[' || (at > 0 && text[at - 1] === '\\')) continue;
    const close = text.indexOf(']', at + 1);
    if (close < 0) continue;
    const label = text.slice(at + 1, close);
    if (text[close + 1] === '[') {
      const end = text.indexOf(']', close + 2);
      if (end < 0) continue;
      const id = (text.slice(close + 2, end) || label).trim().toLowerCase().replace(/\s+/gu, ' ');
      const target = definitions.get(id);
      if (target) add(target, at, end + 1);
      at = end;
      continue;
    }
    if (text[close + 1] !== '(') continue;
    let depth = 1;
    let end = close + 2;
    for (; end < text.length && depth > 0; end += 1) {
      if (text[end] === '\\') { end += 1; continue; }
      if (text[end] === '(') depth += 1;
      else if (text[end] === ')') depth -= 1;
    }
    if (depth !== 0) continue;
    const inside = text.slice(close + 2, end - 1).trim();
    const target = inside.startsWith('<') ? inside.slice(1, inside.indexOf('>')) : inside.split(/\s+["']/u, 1)[0]!;
    add(target, at, end);
    at = end - 1;
  }
  for (const match of text.matchAll(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>/giu)) add(match[1]!, match.index, match.index + match[0].length);
  return links;
}

function inProject(root: string, path: string): string {
  const rel = relative(root, path);
  if (rel === '' || rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) throw new Error(`Document path escapes the project: ${path}`);
  return posixPath(rel);
}

/** Discover local plan text, linked companions and project-owned principles once. */
export async function discoverDocuments(
  projectRoot: string,
  planId: string,
  revision: { readonly commit: string | null; readonly dirty: boolean },
  reader: DocumentReader = nodeDocumentReader,
  options: DocumentDiscoveryOptions = {},
  identityContract: IdentityContract = 'legacy',
): Promise<DiscoveredDocuments> {
  const root = await reader.real(projectRoot);
  const rootPlan = `plans/${planId}/plan.md`;
  const found = new Map<string, { bytes: Uint8Array; kind: 'plan' | 'principle' }>();
  const canonicalSeen = new Set<string>();
  const gaps: Array<{ from: string; target: string; source: { start: number; end: number }; reason: string; judgment: 'unjudged' }> = [];
  const queue: string[] = [rootPlan];
  const queued = new Set(queue);

  const enqueue = (path: string) => { if (!queued.has(path)) { queued.add(path); queue.push(path); } };
  const planDirectory = resolve(root, 'plans', planId);
  async function scanPlanDirectory(directory: string): Promise<void> {
    const entries = await reader.list(directory);
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (excluded.has(entry.name)) continue;
      const target = join(directory, entry.name);
      if (entry.isDirectory()) await scanPlanDirectory(target);
      else if (entry.isFile() && textCandidate(entry.name)) enqueue(inProject(root, target));
    }
  }
  await scanPlanDirectory(planDirectory);

  // A link may lead outside the plan directory, but never outside the project.
  for (let index = 0; index < queue.length; index += 1) {
    const requested = queue[index]!;
    let canonical: string;
    try {
      canonical = inProject(root, await reader.real(resolve(root, requested)));
    } catch (error) {
      if (index === 0) throw error;
      continue;
    }
    if (canonicalSeen.has(canonical)) continue;
    canonicalSeen.add(canonical);
    let bytes: Uint8Array;
    let text: string;
    try {
      bytes = await reader.read(resolve(root, canonical));
      try { text = decoder.decode(bytes); } catch { throw new Error(`Document ${canonical} is not valid UTF-8`); }
    } catch (error) {
      if (index === 0 || !options.onUnreadableDocument) throw error;
      options.onUnreadableDocument({ path: canonical, reason: error instanceof Error ? error.message : String(error), judgment: 'unjudged' });
      continue;
    }
    const storedPath = requested === rootPlan ? rootPlan : canonical;
    found.set(storedPath, { bytes, kind: 'plan' });
    for (const link of localLinks(text, options.onUnreadableDocument !== undefined)) {
      const candidate = resolve(root, dirname(canonical), link.target);
      let lexical: string;
      try { lexical = inProject(root, candidate); }
      catch (error) {
        if (!options.onOutsideReference) throw error;
        options.onOutsideReference({ from: storedPath, target: candidate, source: { start: link.start, end: link.end },
          reason: error instanceof Error ? error.message : String(error), judgment: 'unjudged' });
        continue;
      }
      if (!textCandidate(lexical)) {
        options.onUnreadableDocument?.({ path: lexical, reason: `Linked evidence ${lexical} is not captured as text`, judgment: 'unjudged' });
        continue;
      }
      try {
        const actual = inProject(root, await reader.real(candidate));
        if (!await reader.isFile(resolve(root, actual))) throw new Error('not a regular file');
        enqueue(actual);
      } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        if (code !== 'ENOENT' && code !== 'ENOTDIR') {
          if (error instanceof Error && error.message.includes('escapes the project')) throw error;
        }
        gaps.push({ from: storedPath, target: lexical, source: { start: link.start, end: link.end }, reason: error instanceof Error ? error.message : String(error), judgment: 'unjudged' });
      }
    }
  }

  const unreadable: Array<{ path: string; reason: string }> = [];
  const isDeclaredModulePath = (directory: string): boolean => {
    const parts = posixPath(relative(root, directory)).split('/');
    return parts.length > 0 && parts.length % 2 === 0 && parts.every((part, index) => index % 2 === 0 ? part === 'subs' : part !== '');
  };
  async function scanPrinciples(directory: string): Promise<void> {
    let entries: Dirent[];
    try { entries = await reader.list(directory); }
    catch (error) { unreadable.push({ path: directory === root ? '.' : inProject(root, directory), reason: `Principles scan could not read ${directory === root ? 'project root' : inProject(root, directory)}: ${String(error)}` }); return; }
    // A package rooted outside the module `subs/` tree is independent.
    if (directory !== root && !isDeclaredModulePath(directory) &&
      entries.some(entry => entry.name === 'module.ramify') && entries.some(entry => entry.name === 'package.json')) return;
    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (excluded.has(entry.name)) continue;
      const target = join(directory, entry.name);
      if (entry.isDirectory()) await scanPrinciples(target);
      else if (entry.isFile() && entry.name.endsWith('.principles.md')) {
        const path = inProject(root, target);
        if (found.has(path)) { found.get(path)!.kind = 'principle'; continue; }
        try {
          const bytes = await reader.read(target);
          decoder.decode(bytes);
          found.set(path, { bytes, kind: 'principle' });
        } catch (error) { unreadable.push({ path, reason: error instanceof Error ? error.message : String(error) }); }
      }
    }
  }
  await scanPrinciples(root);

  const paths = [rootPlan, ...[...found.keys()].filter(path => path !== rootPlan).sort()];
  const slug = (path: string): string => path.replace(/\.[^.\/]+$/, '').replace(/^plans\//, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'source';
  const names = paths.map(path => slug(path));
  const frequencies = new Map<string, number>();
  names.forEach(name => frequencies.set(name, (frequencies.get(name) ?? 0) + 1));
  const ids = new Map(paths.map((path, index) => [path, identityContract === 'legacy'
    ? `doc-${String(index + 1).padStart(3, '0')}`
    : `document:${names[index]}${frequencies.get(names[index]!)! > 1 ? `-${createHash('sha256').update(path).digest('hex').slice(0, 8)}` : ''}`]));
  const documents = paths.map(path => {
    const entry = found.get(path);
    if (!entry) throw new Error(`Root plan ${path} was not captured`);
    const id = ids.get(path)!;
    const capturedRevision = entry.kind === 'plan' ? { commit: null, dirty: null } : revision;
    return { id, path, kind: entry.kind, sha256: hash(entry.bytes), bytes: entry.bytes.length,
      storedAt: path === rootPlan ? 'input/plan.md' : `input/documents/${encodeURIComponent(id)}.bin`, revision: capturedRevision };
  });
  const missing = gaps.map(gap => ({ ...gap, from: ids.get(gap.from)! })).filter(gap => gap.from !== undefined);
  const principles = documents.filter(document => document.kind === 'principle').length;
  const status = unreadable.length > 0 ? 'partial' : principles > 0 ? 'complete' : 'empty';
  const manifest = documentManifestSchema.parse({ schema: identityContract === 'legacy' ? 'ramify-agent.document-manifest/1' : 'ramify-agent.document-manifest/2', root: ids.get(rootPlan), documents, missing,
    principlesScan: { status, unreadable } });
  return { manifest, bytes: new Map(documents.map(document => [document.id, found.get(document.path)!.bytes])) };
}
