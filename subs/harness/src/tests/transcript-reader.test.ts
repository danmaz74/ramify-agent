import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { ContentStore, openContentReader } from '../transcripts/store.js';
import { readBody, readTranscript } from '../transcripts/writer.js';
import { temporaryDirectory } from './helpers/fixture.js';

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0)) await cleanup(); });
async function directory() {
  const made = await temporaryDirectory();
  cleanups.push(made.remove);
  return made.path;
}
async function snapshot(path: string) {
  return { bytes: await readFile(path), mtime: (await stat(path)).mtimeMs };
}

test('the real content facade is frozen and has only read, without writable or path properties', async () => {
  const root = await directory();
  const blobs = join(root, 'blobs');
  const reader = openContentReader(blobs);
  expect(Object.isFrozen(reader)).toBe(true);
  expect(Reflect.ownKeys(reader)).toEqual(['read']);
  expect(Object.getPrototypeOf(reader)).toBe(Object.prototype);
  for (const property of ['put', 'path', 'directory', 'known']) expect(property in reader).toBe(false);
  const read = reader.read;
  expect(await read('a'.repeat(64))).toBeNull();
  expect(await readdir(root)).toEqual([]);
  await expect(read('../escape')).rejects.toThrow('is not a content hash');
  const store = new ContentStore(blobs);
  const stored = await store.put('retained π\n');
  const path = store.path(stored.hash);
  const before = await snapshot(path);
  for (let n = 0; n < 3; n++) expect(await read(stored.hash)).toBe('retained π\n');
  expect(await snapshot(path)).toEqual(before);
  // ContentStore supplies raw retained bytes; digest authentication belongs to authority readers.
  const rawHash = 'd'.repeat(64);
  const rawPath = join(blobs, rawHash);
  await writeFile(rawPath, 'raw retained bytes, not a matching digest');
  const rawBefore = await snapshot(rawPath);
  expect(await read(rawHash)).toBe('raw retained bytes, not a matching digest');
  expect(await snapshot(rawPath)).toEqual(rawBefore);
  // The facade preserves ContentStore errors rather than turning every failure into absence.
  const errorHash = 'b'.repeat(64);
  await mkdir(join(blobs, errorHash));
  await expect(read(errorHash)).rejects.toMatchObject({ code: 'EISDIR' });
});

test('readBody accepts the real reading facade and keeps inline/blob/file and traversal policies unchanged', async () => {
  const root = await directory();
  const store = new ContentStore(join(root, 'blobs'));
  const reader = openContentReader(store.directory);
  const stored = await store.put('blob body');
  const file = join(root, 'body.txt');
  await writeFile(file, 'file body');
  const paths = [file, store.path(stored.hash)];
  const before = await Promise.all(paths.map(snapshot));
  for (let n = 0; n < 3; n++) {
    expect(await readBody(root, reader, { stored: 'inline', text: 'inline', bytes: 6 })).toBe('inline');
    expect(await readBody(root, reader, { stored: 'blob', ...stored, preview: 'blob body' })).toBe('blob body');
    expect(await readBody(root, reader, { stored: 'blob', hash: 'a'.repeat(64), bytes: 1, preview: '' })).toBeNull();
    expect(await readBody(root, reader, { stored: 'file', path: 'body.txt', bytes: 9 })).toBe('file body');
    expect(await readBody(root, reader, { stored: 'file', path: 'missing.txt', bytes: null })).toBeNull();
    expect(await readBody(root, reader, { stored: 'file', path: '../body.txt', bytes: null })).toBeNull();
  }
  await expect(readBody(root, reader, { stored: 'blob', hash: '../escape', bytes: 1, preview: '' })).rejects.toThrow('is not a content hash');
  const errorHash = 'c'.repeat(64);
  await mkdir(join(store.directory, errorHash));
  await expect(readBody(root, reader, { stored: 'blob', hash: errorHash, bytes: 1, preview: '' })).rejects.toMatchObject({ code: 'EISDIR' });
  expect(await readBody(root, reader, { stored: 'file', path: 'blobs', bytes: null })).toBeNull();
  expect(await Promise.all(paths.map(snapshot))).toEqual(before);
  // Existing writers still supply their full store structurally, without widening the reader.
  expect(await readBody(root, store, { stored: 'blob', ...stored, preview: '' })).toBe('blob body');
});

test('transcript missing, malformed and torn-line reads leave original bytes and mtime unchanged', async () => {
  const root = await directory();
  const path = join(root, 'transcript.jsonl');
  expect(await readTranscript(path)).toEqual({ missing: true, entries: [], discardedPartial: false, unreadable: [] });
  expect(await readdir(root)).toEqual([]);
  await writeFile(path, 'not-json\n{}\n{"torn":');
  const before = await snapshot(path);
  for (let n = 0; n < 3; n++) expect(await readTranscript(path)).toEqual({ missing: false, entries: [], discardedPartial: true, unreadable: [1, 2] });
  expect(await snapshot(path)).toEqual(before);
  await expect(readTranscript(root)).rejects.toMatchObject({ code: 'EISDIR' });
});
