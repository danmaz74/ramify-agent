import { mkdir, rm, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { RamifyCli } from '../../subs/evidence/src/ramify-cli.js';
import { OwnershipCancelledError, OwnershipUnavailableError, type OwnershipAnswer } from '../../subs/evidence/src/ownership-evidence.js';
import { checkContinuationScope } from '../../subs/autonomous/subs/work-coordination/src/work/inherited-scope.js';
import { iterationAssignmentSchema } from '../../subs/autonomous/subs/work-coordination/src/work/iterations.js';
import { assignmentAuthorityIdentity, OwnershipAuthorityError } from '../work/ownership-authority.js';
import { historicalScopeDecisions, resolveWriteScope, testPolicyOf, type ScopeCapture } from '../work/scope.js';
import { assign } from './helpers/iterations.js';
import { temporaryDirectory } from './helpers/fixture.js';

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0).reverse()) await cleanup(); });
const raw = { exitCode: 1, stdout: 'invalid declaration', stderr: '', report: null };
class Ownership extends RamifyCli {
  failure: Error | undefined;
  constructor() { super({ executable: '/nonexistent/no-provider' }); }
  override async queryOwnershipAnswer(root: string): Promise<OwnershipAnswer> {
    if (this.failure) throw this.failure;
    return { schemaVersion: 'ramify.ownership/1', ramifyVersion: 'scripted', root, inputId: 'verified-input',
      scope: { configuration: 'config.json', ownership: { modules: [{ id: 'app', parent: null, directory: '.' }, { id: 'app/child', parent: 'app', directory: 'subs/child' }], exclusions: [] } }, paths: [] };
  }
}
async function fixture() {
  const directory = await temporaryDirectory(); cleanups.push(directory.remove);
  await mkdir(join(directory.path, 'subs/child/src'), { recursive: true });
  const provider = new Ownership();
  const body = assign('app', { scope: { base: { module: 'app', included: [{ directory: 'subs/child', reason: 'repair', instructions: 'retain child contract' }] }, extra: [], read: [], rationale: 'repair root and child' } }).assignment;
  const capture: ScopeCapture = { projectRoot: directory.path, ramify: provider, index: null, revision: 1,
    view: { status: 'placeholder' }, ...body.scope, bootstrap: [] };
  const scope = await resolveWriteScope(capture);
  const previous = iterationAssignmentSchema.parse({ schema: 'ramify-agent.iteration-assignment/2', id: 'work-item:repair.i01', workItem: 'work-item:repair',
    outline: { id: 'work-item:repair', revision: 1, hash: 'a'.repeat(64) }, stage: 0, kind: 'ordinary', goal: 'repair', approach: 'repair',
    scope, startingPoints: [], externalCapabilities: [], completionEvidence: 'tests', evidenceObligations: [],
    gate: { checkpoint: 'iteration', tests: testPolicyOf('ordinary', scope.base, [], [], scope.resolved.included) }, guarded: [], authorizations: [] });
  provider.failure = new OwnershipUnavailableError({ ...raw, status: 'unavailable', failureStatus: 'invalid', reason: 'invalid configuration', decoded: null });
  return { directory, provider, body, capture: { ...capture, revision: 2 }, previous };
}

test('narrower continuation preserves original provenance and closes a removed child', async () => {
  const { body, capture, previous } = await fixture();
  const checked = await checkContinuationScope({ ...capture, base: { module: 'app', included: [] } }, body, previous);
  expect(checked.errors).toEqual([]);
  const scope = checked.scope!;
  expect(scope.resolved.sourceAuthority).toBe(assignmentAuthorityIdentity(previous));
  expect(scope.resolved.included).toEqual([]);
  expect(historicalScopeDecisions(scope, { latest: null, reference: null, paths: new Map() }, ['subs/child/src/new.ts', 'src/repair.ts']).map(result => result.allowed)).toEqual([false, true]);
});

test('unavailable ownership cannot add an owner, extra target, or guarded authorization', async () => {
  const { body, capture, previous } = await fixture();
  for (const request of [
    { ...capture, base: { module: 'foreign', included: [] } },
    { ...capture, extra: [{ path: 'sibling.ts', purpose: 'consumer' as const }] },
  ]) expect((await checkContinuationScope(request, body, previous)).scope).toBeNull();
  expect((await checkContinuationScope(capture, { ...body, authorizations: [{ path: 'config.json', rationale: 'repair' }] }, previous)).scope).toBeNull();
});

test('missing previous assignment and missing retained blob name the absent authority', async () => {
  const { body, capture, previous } = await fixture();
  expect((await checkContinuationScope(capture, body, undefined)).errors[0]?.message).toContain('verified previous assignment');
  const missing = await checkContinuationScope(capture, body, previous, async () => { throw new OwnershipAuthorityError('retained blob is missing', 'missing'); });
  expect(missing.scope).toBeNull(); expect(missing.errors[0]?.message).toContain('retained blob is missing');
});

test('cancellation and authority corruption do not activate historical reassignment', async () => {
  const { provider, body, capture, previous } = await fixture();
  await expect(checkContinuationScope(capture, body, previous, async () => { throw new OwnershipAuthorityError('corrupt blob'); })).rejects.toThrow('corrupt blob');
  provider.failure = new OwnershipCancelledError({ ...raw, exitCode: 130, status: 'cancelled' });
  await expect(checkContinuationScope(capture, body, previous)).rejects.toBe(provider.failure);
});

test('a redirected included root cannot capture a fresh canonical region during an outage', async () => {
  const { directory, body, capture, previous } = await fixture();
  const outside = await temporaryDirectory(); cleanups.push(outside.remove);
  await rm(join(directory.path, 'subs/child'), { recursive: true });
  await symlink(outside.path, join(directory.path, 'subs/child'));
  const checked = await checkContinuationScope(capture, body, previous);
  expect(checked.scope).toBeNull();
  expect(checked.errors[0]?.message).toMatch(/canonical|reconstructable/u);
});
