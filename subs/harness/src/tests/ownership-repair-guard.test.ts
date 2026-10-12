import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { decideWrite, type GuardedScope } from '../guard/write-guard.js';
import { OwnershipCancelledError, OwnershipUnavailableError } from '../../subs/evidence/src/ownership-evidence.js';
import { OwnershipAuthorityError } from '../work/ownership-authority.js';
const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });
async function setup() {
  const root = await mkdtemp(join(tmpdir(), 'repair-guard-')); roots.push(root);
  await mkdir(join(root, 'Reviews'), { recursive: true });
  const failure = { status: 'unavailable' as const, failureStatus: 'invalid' as const, reason: 'invalid declaration', decoded: null, exitCode: 1, stdout: '{bad}', stderr: '', report: null };
  let queries = 0;
  const scope: GuardedScope = { revision: 1, projectRoot: root, roots: [join(root, 'Reviews')], files: [], excluded: [join(root, 'Reviews', 'Validation')],
    denied: [join(root, 'Reviews', 'protected')], placement: async () => { queries++; throw new OwnershipUnavailableError(failure); },
    historicalPlacement: async paths => ({ assignment: 'a'.repeat(64), reference: null, decisions: paths.map(path => ({ path, allowed: true })) }) };
  return { root, scope, queries: () => queries };
}
const writing = (path: string) => ({ kind: 'write' as const, paths: [path] });
test('captured exclusions, reserved trees, foreign targets and alias redirects refuse before acquisition', async () => {
  const fixture = await setup();
  await writeFile(join(fixture.root, 'Reviews', 'protected'), 'protected');
  await symlink(join(fixture.root, 'Reviews', 'protected'), join(fixture.root, 'Reviews', 'alias'));
  await mkdir(join(fixture.root, 'Foreign'));
  await symlink(join(fixture.root, 'Foreign'), join(fixture.root, 'Reviews', 'redirect'));
  for (const path of ['Reviews/Validation/file.ts', 'Reviews/node_modules/file.ts', 'Foreign/file.ts', 'Reviews/alias', 'Reviews/redirect/new.ts']) {
    expect((await decideWrite(fixture.scope, fixture.root, writing(path))).verdict, path).toBe('blocked-scope');
  }
  expect(fixture.queries()).toBe(0);
});
test('typed unavailability admits existing and new files under recorded authority with historical provenance', async () => {
  const { root, scope } = await setup();
  await writeFile(join(root, 'Reviews', 'existing.ts'), 'invalid intermediate');
  for (const path of ['Reviews/existing.ts', 'Reviews/new.ts']) {
    expect(await decideWrite(scope, root, writing(path))).toMatchObject({ verdict: 'allowed', basis: 'historical', assignment: 'a'.repeat(64), ownershipFailure: { failureStatus: 'invalid', stdout: '{bad}' } });
  }
});
test('answered refusal and recorded narrowing never select broader historical permission', async () => {
  const { root, scope } = await setup();
  const current: GuardedScope = { ...scope, placement: async paths => paths.map(path => ({ path, allowed: false })), historicalPlacement: async () => { throw new Error('historical fallback must not run'); } };
  expect((await decideWrite(current, root, writing('Reviews/file.ts'))).verdict).toBe('blocked-scope');
  const narrowed: GuardedScope = { ...scope, historicalPlacement: async paths => ({ assignment: 'a'.repeat(64), reference: null, decisions: paths.map(path => ({ path, allowed: false })) }) };
  expect((await decideWrite(narrowed, root, writing('Reviews/file.ts'))).verdict).toBe('blocked-scope');
});
test('cancellation and missing authority block; corruption and failed settlement remain fatal', async () => {
  const { root, scope } = await setup();
  const cancelled: GuardedScope = { ...scope, placement: async () => { throw new OwnershipCancelledError({ status: 'cancelled', exitCode: 130, stdout: '', stderr: '', report: null }); } };
  expect(await decideWrite(cancelled, root, writing('Reviews/file.ts'))).toMatchObject({ verdict: 'blocked-unresolved', cancelled: true });
  const missing: GuardedScope = { ...scope, historicalPlacement: async () => { throw new OwnershipAuthorityError('missing authority', 'missing'); } };
  expect((await decideWrite(missing, root, writing('Reviews/file.ts'))).verdict).toBe('blocked-unresolved');
  for (const error of [new OwnershipAuthorityError('corrupt authority'), new Error('writer settlement failed')]) {
    await expect(decideWrite({ ...scope, historicalPlacement: async () => { throw error; } }, root, writing('Reviews/file.ts'))).rejects.toBe(error);
  }
});
test('a directory redirect introduced during acquisition cannot use the earlier physical resolution', async () => {
  const { root, scope } = await setup();
  await mkdir(join(root, 'Reviews', 'original')); await mkdir(join(root, 'Foreign'));
  await symlink(join(root, 'Reviews', 'original'), join(root, 'Reviews', 'link'));
  const redirected: GuardedScope = { ...scope, placement: async paths => {
    await rm(join(root, 'Reviews', 'link')); await symlink(join(root, 'Foreign'), join(root, 'Reviews', 'link'));
    return paths.map(path => ({ path, allowed: true }));
  } };
  expect(await decideWrite(redirected, root, writing('Reviews/link/new.ts'))).toMatchObject({ verdict: 'blocked-unresolved', reason: expect.stringContaining('target changed') });
});
