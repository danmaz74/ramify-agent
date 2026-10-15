import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';
import { RamifyCli, type RamifyRun } from '../../../evidence/src/ramify-cli.js';
import { baselineScope, captureSnapshot, rootModuleOfSnapshot, scopeSize } from '../capture.js';
const cleanups: string[] = [];
afterEach(async () => { vi.restoreAllMocks(); for (const root of cleanups.splice(0)) await rm(root, { recursive: true, force: true }); });
const bucket = (bytes: number) => ({ production: { sourceFiles: 1, sourceBytes: bytes, resourceFiles: 0, resourceBytes: 0 }, tests: { sourceFiles: 0, sourceBytes: 0, resourceFiles: 0, resourceBytes: 0 }, documentation: { files: 0, bytes: 0 }, views: { ordinaryBytes: 0, testsBytes: 0 } });
function raw(root: string): string {
  return JSON.stringify({ schema: 'ramify.measure/2', revision: 'rev/1:g:1', root, ownershipRule: 'nearest', views: 'measured', modules: [
    { id: 'p', dir: '', parent: null, exact: bucket(10), subtree: bucket(30) },
    { id: 'p/a', dir: 'subs/a', parent: 'p', exact: bucket(20), subtree: bucket(20) },
  ], files: [], producerExtra: 'retained' }, null, 2) + '\n';
}
async function fixture(answers?: RamifyRun[]) {
  const root = await mkdtemp(join(tmpdir(), 'kpi-measure-')); cleanups.push(root);
  const cli = new RamifyCli();
  const pending = answers ?? [{ code: 0, stdout: raw(root), stderr: '' }];
  const failures: string[] = [];
  vi.spyOn(cli, 'run').mockImplementation(async (args, cwd) => {
    if (cwd !== root || JSON.stringify(args) !== JSON.stringify(['measure', '--root', root, '--format', 'json'])) { failures.push('arguments'); throw new Error('unexpected measurement arguments'); }
    const answer = pending.shift();
    if (!answer) { failures.push('exhausted'); throw new Error('exhausted measurement answers'); }
    return answer;
  });
  const capture = (id = 'ms-0001') => captureSnapshot({ id, ramify: cli, projectRoot: root, head: 'head', view: null, supplementary: [{ path: 'plans/p/plan.md', bytes: 120 }] });
  const complete = () => { expect(failures).toEqual([]); expect(pending).toEqual([]); };
  return { root, capture, complete };
}
test('capture retains exact producer byte hash, document, revision and supplied support', async () => {
  const f = await fixture(); const taken = await f.capture(); f.complete();
  expect(taken).toMatchObject({ id: 'ms-0001', head: 'head', policy: 'scope-size/2', view: null, measure: { revision: 'rev/1:g:1', hash: createHash('sha256').update(raw(f.root)).digest('hex'), document: { producerExtra: 'retained' } }, supplementary: [{ path: 'plans/p/plan.md', bytes: 120 }] });
  expect(rootModuleOfSnapshot(taken)).toBe('p');
});
test('a project the measurement producer cannot measure leaves the baseline unavailable, never a zero', async () => {
  const f = await fixture([{ code: 127, stdout: '', stderr: 'ramify measure unavailable' }]);
  const taken = await f.capture(); f.complete();
  expect(taken.measure).toEqual({ unavailable: '`ramify measure` exited with 127: ramify measure unavailable' });
  const size = scopeSize(taken, baselineScope('p', ['plans/p/plan.md']));
  expect(size.components[0]).toMatchObject({ state: 'unavailable', bytes: null, reason: expect.stringContaining('ramify measure') });
  expect(size).toMatchObject({ bytes: null, coverage: 'partial', subtotal: 120 });
  expect(rootModuleOfSnapshot(taken)).toBeNull();
});
test('a subtree root covers the owners beneath it, and each is counted once', async () => {
  const f = await fixture(); const taken = await f.capture(); f.complete();
  const declared = { exactOwners: [], subtrees: ['p'], apiViews: true, architectView: false, supportDocuments: [] };
  const whole = scopeSize(taken, declared);
  expect(scopeSize(taken, { ...declared, exactOwners: ['p/a'] }).bytes).toBe(whole.bytes);
  expect(scopeSize(taken, { ...declared, subtrees: [], exactOwners: ['p/a'] }).bytes!).toBeLessThan(whole.bytes!);
});
test('a module that does not exist yet has an unknown size, not a zero one', async () => {
  const f = await fixture(); const taken = await f.capture(); f.complete();
  const size = scopeSize(taken, { exactOwners: ['p/nothing-yet'], subtrees: [], apiViews: false, architectView: false, supportDocuments: [] });
  expect(size.components[0]).toMatchObject({ state: 'unknown', bytes: null, reason: expect.stringContaining('unknown size, not a zero one') });
});
test('the architect view is measured at its publication size when one is published', async () => {
  const f = await fixture([]);
  // Script a second read, not a KPI calculator or a materialization implementation.
  const cli = new RamifyCli(); let remaining = 2;
  vi.spyOn(cli, 'run').mockImplementation(async (args, cwd) => {
    expect(args).toEqual(['measure', '--root', f.root, '--format', 'json']); expect(cwd).toBe(f.root);
    expect(remaining--).toBeGreaterThan(0); return { code: 0, stdout: raw(f.root), stderr: '' };
  });
  const capture = () => captureSnapshot({ id: 'ms-0001', ramify: cli, projectRoot: f.root, head: '', view: null, supplementary: [] });
  const declared = { exactOwners: [], subtrees: [], apiViews: false, architectView: true, supportDocuments: [] };
  const without = await capture();
  expect(without.supplementary).toEqual([]);
  expect(scopeSize(without, declared).components[2]).toMatchObject({ state: 'unavailable', bytes: null });
  await mkdir(join(f.root, '.ramify-architect', 'nested'), { recursive: true });
  await writeFile(join(f.root, '.ramify-architect', 'README.md'), 'é');
  await writeFile(join(f.root, '.ramify-architect', 'nested', 'module.json'), '123');
  const withView = await capture();
  expect(withView.supplementary).toEqual([{ path: '.ramify-architect', bytes: 5 }]);
  expect(scopeSize(withView, declared)).toMatchObject({ bytes: 5, coverage: 'complete' });
  expect(remaining).toBe(0); f.complete();
});
test.each([
  { stdout: 'not JSON', reason: 'did not print a JSON document' },
  { stdout: '{"schema":"ramify.measure/1"}', reason: 'declares ramify.measure/1' },
  { stdout: '{"schema":"ramify.measure/2"}', reason: 'not valid' },
])('invalid producer document remains unavailable: $reason', async ({ stdout, reason }) => {
  const f = await fixture([{ code: 0, stdout, stderr: '' }]); const taken = await f.capture(); f.complete();
  expect(taken.measure).toEqual({ unavailable: expect.stringContaining(reason) });
});
