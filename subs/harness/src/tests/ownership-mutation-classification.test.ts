import { mkdir, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { OwnershipCancelledError, OwnershipUnavailableError } from '../../subs/evidence/src/ownership-evidence.js';
import type { GuardedScope } from '../guard/write-guard.js';
import { classifyMutations, outsideScope, takeMutationSnapshot } from '../run/mutations.js';
import { prepareGate } from '../checks/gate.js';
import { temporaryDirectory } from './helpers/fixture.js';

const failure = { status: 'unavailable' as const, failureStatus: 'invalid' as const, reason: 'Invalid declaration', exitCode: 1, stdout: '{invalid}', stderr: '', report: null, decoded: null };
test('all candidate paths retain known prohibitions and unknown placement during invalid acquisition', async () => {
  const fixture = await temporaryDirectory();
  try {
    const root = fixture.path;
    await mkdir(join(root, 'owned')); await mkdir(join(root, 'foreign'));
    await symlink(join(root, 'foreign'), join(root, 'owned', 'redirect'));
    const scope: GuardedScope = { revision: 1, projectRoot: root, roots: [join(root, 'owned')], files: [], denied: [join(root, 'owned', 'protected')], excluded: [join(root, 'owned', 'child')], placement: async () => { throw new OwnershipUnavailableError(failure); } };
    const paths = ['owned/repair.ts', 'owned/protected', 'owned/child/file.ts', 'foreign/file.ts', 'owned/redirect/file.ts'];
    const result = await takeMutationSnapshot({ projectRoot: root, changed: async () => paths, scope });
    expect(result.unknownPlacement).toEqual(['owned/repair.ts']);
    expect(result.outsideScope).toEqual(['foreign/file.ts', 'owned/child/file.ts', 'owned/protected', 'owned/redirect/file.ts']);
    expect(result.placementFailure).toBe(failure.reason);
    await expect(outsideScope(root, scope, paths)).rejects.toThrow(failure.reason);
    const recovered = { ...scope, placement: async (paths: readonly string[]) => paths.map(path => ({ path, allowed: true })) };
    expect(await classifyMutations(root, recovered, ['owned/repair.ts'])).toEqual({ outsideScope: [], unknownPlacement: [] });
    await expect(classifyMutations(root, { ...scope, placement: async () => { throw new OwnershipCancelledError({ status: 'cancelled', exitCode: 130, stdout: '', stderr: '', report: null }); } }, ['owned/repair.ts'])).rejects.toBeInstanceOf(OwnershipCancelledError);
  } finally { await fixture.remove(); }
});
test('unavailable candidate authority prevents commit preparation and uses bounded infrastructure handling', async () => {
  const fixture = await temporaryDirectory();
  try {
    const request = { id: 'ga-0001', projectRoot: fixture.path, directory: join(fixture.path, 'gate'), head: 'a'.repeat(40), checks: [], authorityUnavailable: 'provider crashed', rules: [{ rule: 'write-scope' as const, outcome: 'failed' as const, violations: [] }], limits: { infrastructureRetries: 2 } };
    const first = await prepareGate('iteration', request);
    expect(first).toMatchObject({ verdict: 'not-verified', cause: 'infrastructure', next: 'retry-infrastructure', commit: null });
    expect(await prepareGate('iteration', { ...request, infrastructureAttempt: 1 })).toMatchObject({ cause: 'infrastructure', next: 'exhausted', commit: null });
    expect(await prepareGate('iteration', { ...request, authorityUnavailable: undefined })).toMatchObject({ verdict: 'failed', cause: 'check-failed', next: 'repair', commit: null });
  } finally { await fixture.remove(); }
});

const checkpointFailures = [{ changed: [] as string[], failureStatus: 'invalid' as const }, { changed: ['repair.ts'], failureStatus: 'invalid' as const },
  { changed: [] as string[], failureStatus: 'execution-failed' as const }, { changed: ['repair.ts'], failureStatus: 'execution-failed' as const },
  ...(['incomplete', 'unavailable', 'unsupported'] as const).map(failureStatus => ({ changed: ['repair.ts'], failureStatus }))];
test.each(checkpointFailures)('a committing checkpoint with unavailable current ownership never commits or audits (%j)', async ({ changed, failureStatus }) => {
  const fixture = await temporaryDirectory();
  const unavailable = failureStatus !== 'invalid';
  try {
    const { CommittingGates } = await import('../run/committing-gate.js');
    const { defaultRunPolicy } = await import('../run/policy.js');
    const { mockGit } = await import('./helpers/mock-git.js');
    const { vi } = await import('vitest');
    const query = vi.fn(async (_root: string, paths: readonly string[]) => {
      expect(paths).toEqual(changed.length === 0 ? ['.'] : changed);
      throw new OwnershipUnavailableError({ ...failure, failureStatus, exitCode: failureStatus === 'execution-failed' ? -1 : unavailable ? 2 : 1 });
    });
    const commit = vi.fn(() => { throw new Error('unverified commit'); });
    const audit = vi.fn(() => { throw new Error('unverified audit'); });
    const git = mockGit({ changedPaths: async () => changed, trackedPaths: async () => [], ignoreStatus: async () => [], commitAccepted: commit });
    const host = { projectRoot: fixture.path, git, ramify: { queryOwnershipAnswer: query }, configuredAudit: { run: audit }, write: async () => 'committed', afterWrite: async () => {} } as unknown as import('../run/committing-gate.js').GateHost<import('../run/committing-gate.js').GateRun>;
    const run = { base: 'a'.repeat(40), jobId: 'run-test', planId: 'plan-test', log: { ledger: { replay: () => [] }, all: () => [] } } as unknown as import('../run/committing-gate.js').GateRun;
    const result = await new CommittingGates(host).committingCheckpoint(run, { id: 'ga-0001', checkpoint: 'iteration', projectRoot: fixture.path, directory: join(fixture.path, 'gate'), head: run.base, policy: defaultRunPolicy({ projectRoot: fixture.path }) });
    expect(result).toMatchObject({ verdict: unavailable ? 'not-verified' : 'failed', cause: unavailable ? 'infrastructure' : 'check-failed', next: unavailable ? 'retry-infrastructure' : 'repair', commit: null, ownershipPreflight: { root: fixture.path, paths: changed.length === 0 ? ['.'] : changed, stdout: failure.stdout, failureStatus } });
    expect(result.rules?.filter(rule => rule.rule === 'write-scope')).toEqual([]);
    expect(query).toHaveBeenCalledTimes(1);
    expect(commit).not.toHaveBeenCalled(); expect(audit).not.toHaveBeenCalled();
  } finally { await fixture.remove(); }
});

test('invalid acquisition skips valid standalone checks with a repairable outcome', async () => {
  const fixture = await temporaryDirectory();
  try {
    const { status: _status, ...raw } = failure;
    const attempt = await prepareGate('iteration', { id: 'ga-0001', projectRoot: fixture.path, directory: join(fixture.path, 'gate'), head: 'a'.repeat(40), ownershipPreflight: { ...raw, root: fixture.path, paths: ['repair.ts'] }, checks: [{ kind: 'ramify-check', command: { argv: [process.execPath, '--version'], cwd: fixture.path, env: [], envAdditions: {}, timeoutMs: 1000 } }] });
    expect(attempt).toMatchObject({ verdict: 'failed', cause: 'check-failed', next: 'repair', commit: null, commands: [{ outcome: 'not-verified', notVerified: 'local-rule-failed' }] });
  } finally { await fixture.remove(); }
});

test.each([false, true])('restart before candidate commit completes the existing effect with typed failure (runtime=%j)', async unavailable => {
  const fixture = await temporaryDirectory();
  try {
    const { CommittingGates } = await import('../run/committing-gate.js');
    const { mockGit } = await import('./helpers/mock-git.js');
    const { vi } = await import('vitest');
    const completed = vi.fn();
    const commit = vi.fn(() => { throw new Error('unverified commit'); });
    const audit = vi.fn(() => { throw new Error('unverified audit'); });
    const git = mockGit({ findCommitByTrailers: async () => null, changedPaths: async () => ['repair.ts'], commitAccepted: commit });
    const host = { projectRoot: fixture.path, git, ramify: { queryOwnershipAnswer: async () => { throw new OwnershipUnavailableError(unavailable ? { ...failure, failureStatus: 'execution-failed', exitCode: -1 } : failure); } }, configuredAudit: { run: audit }, afterWrite: async () => {} } as unknown as import('../run/committing-gate.js').GateHost<import('../run/committing-gate.js').GateRun>;
    const run = { base: 'a'.repeat(40), jobId: 'run-test', planId: 'plan-test', log: { all: () => [], next: (event: unknown) => event, ledger: { replay: () => [], effect: async (request: { perform: () => Promise<{ attempt: import('../checks/records.js').GateAttempt }>; complete: (result: { attempt: import('../checks/records.js').GateAttempt }) => unknown }) => { const result = await request.perform(); completed(request.complete(result)); return result; } } } } as unknown as import('../run/committing-gate.js').GateRun;
    const prepared = await prepareGate('iteration', { id: 'ga-0001', runId: run.jobId, projectRoot: fixture.path, directory: join(fixture.path, 'gate'), head: run.base, checks: [], audit: { mode: 'full', timeoutMs: 1000 }, limits: { infrastructureRetries: 2 } });
    if ('schema' in prepared) throw new Error('expected prepared original gate');
    const result = await new CommittingGates(host).commitGate(run, prepared, undefined, undefined, undefined, 'recorded original message');
    expect(result).toMatchObject({ verdict: unavailable ? 'not-verified' : 'failed', cause: unavailable ? 'infrastructure' : 'check-failed', next: unavailable ? 'retry-infrastructure' : 'repair', commit: null, ownershipPreflight: { paths: ['repair.ts'], stdout: failure.stdout } });
    expect(completed).toHaveBeenCalledTimes(1);
    expect(completed.mock.calls[0]![0]).toMatchObject({ event: { type: 'gate-attempted', data: { gate: 'ga-0001' } }, records: [{ body: { commit: null } }] });
    expect(commit).not.toHaveBeenCalled(); expect(audit).not.toHaveBeenCalled();
  } finally { await fixture.remove(); }
});
