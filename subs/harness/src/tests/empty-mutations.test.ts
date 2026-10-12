import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';
import { ScriptedCli } from '../../subs/evidence/src/tests/helpers/scripted-cli.js';
import { OwnershipUnavailableError } from '../../subs/evidence/src/ownership-evidence.js';
import { placementOutcome, type GuardedScope } from '../guard/write-guard.js';
import { classifyMutations, outsideScope, recordSettledSnapshot, takeMutationSnapshot } from '../run/mutations.js';
import { ObservationLog } from '../run/observations.js';
import { CommittingGates, type GateHost, type GateRun } from '../run/committing-gate.js';
import { defaultRunPolicy } from '../run/policy.js';
import { temporaryDirectory } from './helpers/fixture.js';
import { mockGit } from './helpers/mock-git.js';

const cleanups: Array<() => Promise<void>> = [];
const replies: ScriptedCli[] = [];
afterEach(async () => {
  try { for (const cli of replies.splice(0)) cli.assertComplete(); }
  finally { for (const cleanup of cleanups.splice(0).reverse()) await cleanup(); }
});

async function target() {
  const fixture = await temporaryDirectory();
  cleanups.push(fixture.remove);
  await mkdir(join(fixture.path, 'owned'));
  const cli = new ScriptedCli(true);
  replies.push(cli);
  const scope: GuardedScope = {
    revision: 1, projectRoot: fixture.path, roots: [join(fixture.path, 'owned')], files: [],
    placement: async paths => (await cli.queryOwnershipAnswer(fixture.path, paths)).paths.map(path => ({ path: path.path, allowed: path.status === 'owned' })),
  };
  return { root: fixture.path, cli, scope };
}

test('a settled read-only turn records an empty observation without acquiring ownership', async () => {
  const { root, cli, scope } = await target();
  const observations = await ObservationLog.open(join(root, 'observations.jsonl'));
  expect(await recordSettledSnapshot({ projectRoot: root, changed: async () => [], scope }, observations)).toEqual({
    paths: [], outsideScope: [], unknownPlacement: [], failure: null,
  });
  expect(observations.observations).toMatchObject([{
    type: 'mutation', data: { paths: [], observedBy: 'snapshot', attributable: false },
  }]);
  expect(await classifyMutations(root, scope, [])).toEqual({ outsideScope: [], unknownPlacement: [] });
  expect(await outsideScope(root, scope, [])).toEqual([]);
  expect(cli.calls).toEqual([]);
});

test('an unavailable observation records the gap without asserting that no paths changed', async () => {
  const { root, cli, scope } = await target();
  const observations = await ObservationLog.open(join(root, 'observations.jsonl'));
  const snapshot = await recordSettledSnapshot({
    projectRoot: root, scope, changed: async () => { throw new Error('Git observation unavailable'); },
  }, observations);
  expect(snapshot.failure).toBe('Git observation unavailable');
  expect(observations.observations).toMatchObject([{
    type: 'coverage-gap', data: { kind: 'changed-paths-unknown', detail: expect.stringContaining('Git observation unavailable') },
  }]);
  expect(observations.count('mutation')).toBe(0);
  expect(cli.calls).toEqual([]);
});

test('nonempty unresolved targets retain unknown placement when their effective query is empty', async () => {
  const { root, cli, scope } = await target();
  await writeFile(join(root, 'owned', 'file'), 'a regular file cannot contain a child');
  const paths = ['owned/file/child.ts'];
  expect(await placementOutcome(scope, root, paths)).toEqual({ allowed: [false], unknown: [true] });
  expect(await classifyMutations(root, scope, paths)).toEqual({ outsideScope: [], unknownPlacement: paths });
  await expect(outsideScope(root, scope, paths)).rejects.toThrow('Current physical placement unresolved');
  expect(cli.calls).toEqual([]);
});

test('a root-only provider answer cannot place a nonempty observed source mutation', async () => {
  const { root, cli, scope } = await target();
  const answer = {
    schemaVersion: 'ramify.ownership/1', ramifyVersion: 'released-test-identity', status: 'answered', exitCode: 0,
    root, inputId: 'input/1:current',
    scope: { configuration: join(root, 'tsconfig.json'), ownership: { modules: [{ id: 'app', directory: '.', parent: null }], exclusions: [] } },
    paths: [{ path: '.', ownership: { status: 'owned', module: 'app', directory: '.', exclusion: null } }], warnings: [],
  };
  cli.declare({ argv: ['ownership', '--root', root, '--format', 'json', '--path', 'owned/source.ts'], cwd: root,
    result: { code: 0, stdout: JSON.stringify(answer), stderr: 'original provider diagnostic' } });
  const result = await classifyMutations(root, scope, ['owned/source.ts']);
  expect(result).toMatchObject({ outsideScope: [], unknownPlacement: ['owned/source.ts'],
    placementFailure: expect.stringContaining('query did not answer exactly the requested paths'),
    ownershipFailure: { status: 'unavailable', failureStatus: 'unsupported', stdout: JSON.stringify(answer), stderr: 'original provider diagnostic' },
  });
  expect(cli.calls).toHaveLength(1);
});

test('an empty turn cannot qualify a candidate with an earlier retained mutation', async () => {
  const { root, scope } = await target();
  const placement = vi.fn(async () => { throw new Error('no acquisition for this empty turn'); });
  expect(await takeMutationSnapshot({ projectRoot: root, scope: { ...scope, placement }, changed: async () => [] })).toEqual({
    paths: [], outsideScope: [], unknownPlacement: [], failure: null,
  });
  expect(placement).not.toHaveBeenCalled();
  const failure = { status: 'unavailable' as const, failureStatus: 'execution-failed' as const, reason: 'retained candidate ownership unavailable',
    exitCode: -1, stdout: '', stderr: 'provider disconnected', report: null, decoded: null };
  const query = vi.fn(async (_projectRoot: string, paths: readonly string[]) => {
    expect(paths).toEqual(['owned/earlier.ts']);
    throw new OwnershipUnavailableError(failure);
  });
  const commit = vi.fn(() => { throw new Error('unverified commit'); });
  const audit = vi.fn(() => { throw new Error('unverified audit'); });
  const git = mockGit({ changedPaths: async () => ['owned/earlier.ts'], trackedPaths: async () => [], ignoreStatus: async () => [], commitAccepted: commit });
  const host = { projectRoot: root, git, ramify: { queryOwnershipAnswer: query }, configuredAudit: { run: audit },
    write: async () => 'committed', afterWrite: async () => {} } as unknown as GateHost<GateRun>;
  const policy = defaultRunPolicy({ projectRoot: root });
  const run = { base: 'a'.repeat(40), jobId: 'run-test', planId: 'plan-test', policy,
    log: { ledger: { replay: () => [] }, all: () => [] } } as unknown as GateRun;
  const result = await new CommittingGates(host).committingCheckpoint(run, {
    id: 'ga-0001', checkpoint: 'iteration', projectRoot: root, directory: join(root, 'gate'), head: run.base,
    policy,
  });
  expect(result).toMatchObject({ verdict: 'not-verified', cause: 'infrastructure', next: 'retry-infrastructure', commit: null,
    ownershipPreflight: { paths: ['owned/earlier.ts'], reason: failure.reason } });
  expect(query).toHaveBeenCalledTimes(1);
  expect(commit).not.toHaveBeenCalled();
  expect(audit).not.toHaveBeenCalled();
});
