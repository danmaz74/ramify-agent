import { afterEach, expect, test } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { discoverDocuments, nodeDocumentReader } from '../discovery.js';

const roots: string[] = [];
afterEach(async () => { for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true }); });
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'plan-evidence-'));
  roots.push(root);
  await mkdir(join(root, 'plans', 'p'), { recursive: true });
  return root;
}
const revision = { commit: null, dirty: false };
async function put(root: string, path: string, content: string | Uint8Array) {
  const target = join(root, path);
  await mkdir(join(target, '..'), { recursive: true });
  await writeFile(target, content);
}

test('captures nested, linked and extensionless text once with exact bytes and stable paths', async () => {
  const root = await fixture();
  await put(root, 'plans/p/plan.md', '# P\r\n[notes](docs/notes.yaml) [more](../shared/guide)\r\n');
  await put(root, 'plans/p/docs/notes.yaml', 'see [root](../plan.md) and [alias](../alias.yaml)\n');
  await put(root, 'plans/p/extra.json', '{"example":true}\n');
  await put(root, 'plans/shared/guide', 'guide\n');
  await symlink('docs/notes.yaml', join(root, 'plans/p/alias.yaml'));
  const found = await discoverDocuments(root, 'p', revision);
  expect(found.manifest.documents.map(document => document.path)).toEqual([
    'plans/p/plan.md', 'plans/p/docs/notes.yaml', 'plans/p/extra.json', 'plans/shared/guide',
  ]);
  expect(found.manifest.missing).toEqual([]);
  expect(found.bytes.get('doc-001')).toEqual(await readFile(join(root, 'plans/p/plan.md')));
  expect(found.manifest.documents[0]!.sha256).toMatch(/^[0-9a-f]{64}$/);
});

test('descriptive capture uses stable document IDs and encoded stored paths', async () => {
  const root = await fixture();
  await put(root, 'plans/p/plan.md', '# P\n');
  await put(root, 'plans/p/companion.md', '# Companion\n');
  const first = await discoverDocuments(root, 'p', revision, undefined, undefined, 'descriptive');
  const again = await discoverDocuments(root, 'p', revision, undefined, undefined, 'descriptive');
  expect(first.manifest).toEqual(again.manifest);
  expect(first.manifest).toMatchObject({ schema: 'ramify-agent.document-manifest/2', root: 'document:p-plan' });
  expect(first.manifest.documents.map(document => document.id)).toEqual(['document:p-plan', 'document:p-companion']);
  expect(first.manifest.documents[1]!.storedAt).toBe('input/documents/document%3Ap-companion.bin');
  expect(first.bytes.get('document:p-plan')).toEqual(await readFile(join(root, 'plans/p/plan.md')));
});

test('follows reference-style links and balanced or escaped parentheses', async () => {
  const root = await fixture();
  await put(root, 'plans/p/plan.md', '# P\n[rules][r] [one](a(b).md) [two](c\\(d\\).md)\n\n[r]: ../shared/rules.yaml\n');
  await put(root, 'plans/shared/rules.yaml', 'a: b\n');
  await put(root, 'plans/p/a(b).md', '# A\n');
  await put(root, 'plans/p/c(d).md', '# C\n');
  const found = await discoverDocuments(root, 'p', revision);
  expect(found.manifest.documents.map(document => document.path)).toEqual([
    'plans/p/plan.md', 'plans/p/a(b).md', 'plans/p/c(d).md', 'plans/shared/rules.yaml',
  ]);
  expect(found.manifest.missing).toEqual([]);
});

test('keeps the root plan identity when its file is an internal symlink', async () => {
  const root = await fixture();
  await put(root, 'plans/p/actual.md', '# Actual\n');
  await symlink('actual.md', join(root, 'plans/p/plan.md'));
  const found = await discoverDocuments(root, 'p', revision);
  expect(found.manifest.documents.map(document => document.path)).toEqual(['plans/p/plan.md']);
  expect(found.bytes.get('doc-001')).toEqual(await readFile(join(root, 'plans/p/actual.md')));
});

test('plan bytes report unknown Git status when a companion may be edited', async () => {
  const root = await fixture();
  await put(root, 'plans/p/plan.md', '# P\n');
  await put(root, 'plans/p/companion.md', 'uncommitted text\n');
  const found = await discoverDocuments(root, 'p', { commit: 'a'.repeat(40), dirty: false });
  expect(found.manifest.documents.filter(document => document.kind === 'plan').map(document => document.revision)).toEqual([
    { commit: null, dirty: null }, { commit: null, dirty: null },
  ]);
  expect(found.manifest.documents[1]!.sha256).toMatch(/^[0-9a-f]{64}$/);
});

test('reports missing local links with source offsets and refuses symlink escape', async () => {
  const root = await fixture();
  await put(root, 'plans/p/plan.md', '# P\n[need](missing.md)\n');
  const found = await discoverDocuments(root, 'p', revision);
  expect(found.manifest.missing).toMatchObject([{ from: 'doc-001', target: 'plans/p/missing.md', judgment: 'unjudged' }]);
  expect(found.manifest.missing[0]!.source.start).toBe(Buffer.byteLength('# P\n'));
  const outside = await mkdtemp(join(tmpdir(), 'outside-'));
  roots.push(outside);
  await writeFile(join(outside, 'escape.md'), 'secret');
  await symlink(join(outside, 'escape.md'), join(root, 'plans/p/escape.md'));
  await put(root, 'plans/p/plan.md', '# P\n[escape](escape.md)\n');
  await expect(discoverDocuments(root, 'p', revision)).rejects.toThrow(/escapes the project/);
});

test('default discovery rejects lexical escape before accessing an external target', async () => {
  const root = await fixture();
  await put(root, 'plans/p/plan.md', '# P\n[external](/archive/evidence.json)\n');
  const observed: string[] = [];
  await expect(discoverDocuments(root, 'p', revision, {
    ...nodeDocumentReader,
    real: path => { observed.push(path); return nodeDocumentReader.real(path); },
    read: path => { observed.push(path); return nodeDocumentReader.read(path); },
  })).rejects.toThrow('escapes the project');
  expect(observed).not.toContain('/archive/evidence.json');
});

test('records invalid text and excludes nested independent principles even under a foreign subs directory', async () => {
  const root = await fixture();
  await put(root, 'plans/p/plan.md', '# P\n');
  await put(root, 'model.principles.md', '# Model\n');
  await put(root, 'foreign/x/subs/project/module.ramify', 'ramify 1\n');
  await put(root, 'foreign/x/subs/project/package.json', '{}\n');
  await put(root, 'foreign/x/subs/project/foreign.principles.md', '# Foreign\n');
  await put(root, 'subs/owner/owner.principles.md', '# Owner\n');
  const found = await discoverDocuments(root, 'p', revision);
  expect(found.manifest.documents.filter(document => document.kind === 'principle').map(document => document.path)).toEqual([
    'model.principles.md', 'subs/owner/owner.principles.md',
  ]);
  await put(root, 'plans/p/invalid.md', Uint8Array.of(0xff));
  await expect(discoverDocuments(root, 'p', revision)).rejects.toThrow(/not valid UTF-8/);
});

test('a root principles listing failure is partial coverage with an explicit root gap', async () => {
  const root = await fixture();
  await put(root, 'plans/p/plan.md', '# P\n');
  const found = await discoverDocuments(root, 'p', revision, {
    ...nodeDocumentReader,
    list: path => path === root ? Promise.reject(new Error('listing denied')) : nodeDocumentReader.list(path),
  });
  expect(found.manifest.principlesScan).toMatchObject({ status: 'partial', unreadable: [{ path: '.', reason: expect.stringContaining('listing denied') }] });
});


test('opt-in unreadable companions retain qualifications while root-plan failures remain fatal', async () => {
  const root = await fixture();
  await put(root, 'plans/p/plan.md', '[linked](../../evidence.bundle) [current](../../current.md)');
  await put(root, 'evidence.bundle', Uint8Array.of(0xff));
  await put(root, 'current.md', '# Current requirements');
  const unreadable: Array<{ path: string; reason: string; judgment: string }> = [];
  const options = { onUnreadableDocument: (reference: typeof unreadable[number]) => unreadable.push(reference) };
  const captured = await discoverDocuments(root, 'p', revision, nodeDocumentReader, options);
  expect(captured.manifest.documents.map(document => document.path)).toEqual(['plans/p/plan.md', 'current.md']);
  expect(unreadable).toEqual([{ path: 'evidence.bundle', reason: 'Document evidence.bundle is not valid UTF-8', judgment: 'unjudged' }]);
  await expect(discoverDocuments(root, 'p', revision)).rejects.toThrow('not valid UTF-8');
  await put(root, 'plans/p/plan.md', Uint8Array.of(0xff));
  await expect(discoverDocuments(root, 'p', revision, nodeDocumentReader, options)).rejects.toThrow('not valid UTF-8');
});
