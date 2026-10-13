import { expect, test } from 'vitest';
import { constructedRecord } from './helpers/constructed.js';
import type { LoadedPackage } from '../prompts/packages.js';
import type { RecoveryIdentity, RecoveryRuntime } from '../run/recovery-admission.js';
import { sourceRestartRuntime, restartRuntimeCompatibility, validateRestartRepair, normalizeRestartIdentityForComparison } from '../run/restart-runtime.js';
import { authenticatedExternalRepairs } from '../run/recovery-gate.js';
import { runLayout, operationRecoverySchema } from '../run/records.js';
import type { RunEvent } from '../run/log.js';

const current: RecoveryRuntime = { harness: 'installed-harness', provider: 'installed-provider',
  contracts: { policy: 'policy', records: 'records', submissions: 'submissions', equipment: 'equipment', authority: 'authority' } };
const oldPrompt = { package: 'engineer/15', hash: 'fcf66c651c57f74c60fd8b75e4277a9cb230bccd313648647d7d3d7fbc3650c5' };
const newHash = '9147c7a9c874834dc05ed582359ac9228a41eedab2ae44a524ba6ff6029a8a71';
function fixture() {
  const record = constructedRecord({ prompts: { engineer: oldPrompt } });
  record.policy.version = 'run-policy/7';
  record.manifest.versions.ramify = '0.5.0';
  const packages = new Map<string, LoadedPackage>([['engineer', { package: oldPrompt.package, hash: newHash } as LoadedPackage]]);
  const before: RecoveryIdentity = { candidate: { head: 'accepted', tree: 'candidate', index: 'index', staged: [], unstaged: [], untracked: [], files: [] },
    runtime: sourceRestartRuntime(record, []), capturedInputs: [{ path: 'plan', hash: 'frozen' }, { path: 'prompt:engineer', hash: oldPrompt.hash }],
    durableIdentity: 'verified-import', acceptedHead: 'accepted', configuration: { identity: 'audit', policy: {} } };
  const after = structuredClone(before);
  after.runtime = structuredClone(current);
  after.capturedInputs[1]!.hash = newHash;
  return { record, packages, before, after };
}

test('legacy migration records representation limits and actual provenance, requiring producer reassessment', () => {
  const { record, packages, before, after } = fixture();
  expect(restartRuntimeCompatibility(record, [], current, packages)).toMatchObject({ blockers: [], migration: 'captured-representation/1', limitations: [expect.any(String), expect.any(String)] });
  const admission = validateRestartRepair(before, after, { areas: ['runtime'], explanation: 'Adopt continuity and corrected audit guidance' }, record, [], packages);
  expect(admission).toMatchObject({ admitted: true, before, after, invalidatesQualification: true, requiresReassessment: true });
  expect(admission.before.runtime.harness).toMatch(/^captured-representation\/1:/u);
});

test('an unknown prompt change is refused even if its package label and policy are supported', () => {
  const { record, packages } = fixture();
  packages.set('engineer', { package: oldPrompt.package, hash: 'arbitrary-validator-change' } as LoadedPackage);
  expect(restartRuntimeCompatibility(record, [], current, packages).blockers).toContain('Unsupported captured prompt transition for engineer');
});

test('runtime declaration is required and cannot change frozen plan inputs or durable state', () => {
  const { record, packages, before, after } = fixture();
  expect(validateRestartRepair(before, after, undefined, record, [], packages).admitted).toBe(false);
  after.capturedInputs[0]!.hash = 'weakened-plan';
  after.durableIdentity = 'changed-records';
  expect(validateRestartRepair(before, after, { areas: ['runtime', 'target'], explanation: 'External correction' }, record, [], packages).blockers)
    .toEqual(expect.arrayContaining(['Captured instruction or plan package changed', 'Harness-owned durable records changed']));
});

test('a recorded exact runtime never receives the legacy representation bypass', () => {
  const { record, packages, before, after } = fixture();
  const exact = structuredClone(before); exact.runtime = { ...current, contracts: { ...current.contracts, authority: 'old-authority' } };
  const entries = [{ sequence: 1, at: '2026-10-13T00:00:00Z', transaction: { event: {} as never, records: [{ path: 'operation-recoveries/old.json', id: 'old', revision: 1,
    body: { schema: 'ramify-agent.operation-recovery/1', identity: exact } }] } }];
  expect(sourceRestartRuntime(record, entries)).toEqual(exact.runtime);
  expect(restartRuntimeCompatibility(record, entries, after.runtime, packages).blockers).toContain('Runtime recovery contracts are incompatible');
});

test('gate replay authenticates a migrated repair against its initialization and refuses broadened comparison', () => {
  const { record, packages, before, after } = fixture();
  const at = '2026-10-13T00:00:00.000Z', jobId = record.jobId;
  const lineage = { sourceRun: '20261012T214112Z-fe22d2', sourceCursor: 699, sourceDigest: 'a'.repeat(64), importDigest: 'b'.repeat(64) };
  const command = (sequence: number) => ({ commandId: `command-${sequence}`, contentHash: `hash-${sequence}`, receipt: { commandId: `command-${sequence}`, jobId, sequence, acceptedAt: at } });
  const initial = operationRecoverySchema.parse({ schema: 'ramify-agent.operation-recovery/1', id: 'restart-resume-1', revision: 1, state: 'paused',
    boundary: { kind: 'invocation' }, evidence: { classification: 'preparation', diagnostic: 'Prepared' }, group: 0, automaticAttempts: 0,
    attempts: [], pausedAt: at, settled: true, candidate: { head: after.candidate.head, tree: after.candidate.tree }, partialPaths: [], prerequisites: [], identity: before });
  after.durableIdentity = 'successor-records';
  const normalizedBefore = normalizeRestartIdentityForComparison({ ...before, durableIdentity: after.durableIdentity }, after, record, [], packages);
  const comparison = { ...lineage, normalizedBefore };
  const admission = { ...validateRestartRepair({ ...before, durableIdentity: after.durableIdentity }, after, { areas: ['runtime'], explanation: 'Adopt continuity' }, record, [], packages), before, restartComparison: comparison };
  const resumed = { ...initial, revision: 2, group: 1, state: 'resumed' as const, admission };
  const entries = [{ sequence: 1, at, transaction: { event: { sequence: 1, jobId, at, type: 'restart-prepared', data: { ...lineage, importPath: 'restart-import.json', generation: 1,
    occurrenceId: initial.id, revision: 1, command: command(1) } } as RunEvent,
    records: [{ path: runLayout.operationRecovery(initial.id, 1), id: initial.id, revision: 1, body: initial }] } },
  { sequence: 2, at, transaction: { event: { sequence: 2, jobId, at, type: 'operation-recovery-resumed', data: { occurrenceId: initial.id, revision: 2, group: 1, command: command(2) } } as RunEvent,
    records: [{ path: runLayout.operationRecovery(initial.id, 2), id: initial.id, revision: 2, body: resumed }] } }];
  expect(authenticatedExternalRepairs(entries)).toEqual([{ sequence: 2, admission }]);
  const inherited = entries.map((entry, index) => ({ ...entry, sequence: index - entries.length, source: { runId: jobId, sequence: entry.sequence },
    transaction: { ...entry.transaction, event: { ...entry.transaction.event, sequence: index - entries.length } as RunEvent } }));
  expect(authenticatedExternalRepairs(inherited)).toEqual([{ sequence: -1, admission }]);
  comparison.normalizedBefore.acceptedHead = 'discarded-history';
  expect(() => authenticatedExternalRepairs(entries)).toThrow('unsupported source identity');
  comparison.normalizedBefore.acceptedHead = before.acceptedHead;
  comparison.sourceDigest = 'changed-source';
  expect(() => authenticatedExternalRepairs(entries)).toThrow('matching committed initialization');
});
