import type { LedgerEntry } from '../../subs/ledger/src/ledger.js';
import type { RunEvent } from './log.js';
import type { RunRecord } from './records.js';
import type { LoadedPackage } from '../prompts/packages.js';
import type { ExternalRepairDeclaration, Role } from '../interfaces/protocol/runs.js';
import { recoveryHash, recoveryIdentitySchema, validateExternalRepair, type ExternalRepairAdmission, type RecoveryIdentity, type RecoveryRuntime } from './recovery-admission.js';

/** Exact reviewed prompt transitions accompanying continuity and audit guidance.
 * Package labels alone are insufficient: both byte identities must match. */
const promptTransitions = new Map<string, string>([
  ['initial-architect:72e75bae5b638281a4ac3cced1ec1d886ff96926b1aed0f062ad89e201cea3e8', '2a36cf8469261558fb9e9f990dc5a8b3faed0ad3037fe9c2ee7db8afbef90c18'],
  ['global-fork:b59b8c946d47e0fba32988e28e6249d9411860ee6da619c9117e8939e6fd54b6', 'a532b6d2813b4ec77717a2d331968c5ccdc68181c61ea79edc32d1cf885ffb27'],
  ['engineer:fcf66c651c57f74c60fd8b75e4277a9cb230bccd313648647d7d3d7fbc3650c5', '9147c7a9c874834dc05ed582359ac9228a41eedab2ae44a524ba6ff6029a8a71'],
]);

function capturedRuntime(record: RunRecord, entries: readonly LedgerEntry<RunEvent>[]): RecoveryRuntime {
  const invocationRepresentations = entries.flatMap(entry => entry.transaction.records)
    .filter(reference => typeof reference.body === 'object' && reference.body !== null
      && (reference.body as { schema?: unknown }).schema === 'ramify-agent.invocation/1')
    .map(reference => ({ path: reference.path, revision: reference.revision, body: reference.body }));
  // These are captured representation identities, explicitly not unrecorded
  // launcher source hashes. The target baseline never identifies its launcher.
  const harness = `captured-representation/1:${recoveryHash({ schema: record.schema, policy: record.policy, prompts: record.prompts, versions: record.manifest.versions })}`;
  const provider = `captured-provider/1:${recoveryHash({ agent: record.agent, invocations: invocationRepresentations })}`;
  const contract = recoveryHash({ harness, provider });
  return { harness, provider, contracts: { policy: contract, records: contract, submissions: contract, equipment: contract, authority: contract } };
}

/** Prefer an independently recorded recovery identity over legacy representations. */
export function sourceRestartRuntime(record: RunRecord, entries: readonly LedgerEntry<RunEvent>[]): RecoveryRuntime {
  for (const entry of [...entries].reverse()) for (const reference of [...entry.transaction.records].reverse()) {
    if (typeof reference.body !== 'object' || reference.body === null) continue;
    const body = reference.body as { schema?: unknown; identity?: unknown; admission?: { after?: unknown } };
    if (body.schema !== 'ramify-agent.operation-recovery/1') continue;
    const identity = recoveryIdentitySchema.safeParse(body.admission?.after ?? body.identity);
    if (identity.success) return identity.data.runtime;
  }
  return capturedRuntime(record, entries);
}

export interface RestartRuntimeCompatibility {
  readonly before: RecoveryRuntime;
  readonly blockers: readonly string[];
  readonly limitations: readonly string[];
  readonly migration: 'exact-runtime' | 'captured-representation/1';
}

/** The importer interprets supported captured contracts, without licensing
 * arbitrary changes to a runtime whose protected source identities were recorded. */
export function restartRuntimeCompatibility(record: RunRecord, entries: readonly LedgerEntry<RunEvent>[], current: RecoveryRuntime,
  packages: ReadonlyMap<string, LoadedPackage>): RestartRuntimeCompatibility {
  const before = sourceRestartRuntime(record, entries);
  const legacy = recoveryHash(before) === recoveryHash(capturedRuntime(record, entries));
  const blockers: string[] = [];
  for (const [role, old] of Object.entries(record.prompts)) {
    if (!old) continue;
    const next = packages.get(role);
    if (!next || old.package !== next.package || (old.hash !== next.hash &&
      (!legacy || record.policy.version !== 'run-policy/7' || promptTransitions.get(`${role}:${old.hash}`) !== next.hash))) {
      blockers.push(`Unsupported captured prompt transition for ${role}`);
    }
  }
  for (const role of packages.keys()) if (!record.prompts[role as Role]) blockers.push(`Captured prompt package is missing for ${role}`);
  if (legacy) {
    if (!['run-policy/7', 'run-policy/8'].includes(record.policy.version)
      || record.policy.contract !== 'plan21-whole-owner-and-architect-reporting/1') blockers.push('Unsupported captured runtime contract');
    if (record.manifest.versions.ramify !== '0.5.0') blockers.push('Unsupported captured Ramify provider representation');
    return { before, blockers, migration: 'captured-representation/1', limitations: [
      'The source did not record launcher implementation hashes; its runtime identity authenticates retained policy, prompts and invocation representations only.',
      'Imported producer conclusions require responsible reassessment and fresh qualification under the captured successor runtime.',
    ] };
  }
  if (recoveryHash(before.contracts) !== recoveryHash(current.contracts)) blockers.push('Runtime recovery contracts are incompatible');
  return { before, blockers, migration: 'exact-runtime', limitations: [] };
}

/** Normalize only the expressly supported representation migration for the
 * existing same-run comparison. Durable provenance retains the actual identities. */
export function normalizeRestartIdentityForComparison(before: RecoveryIdentity, current: RecoveryIdentity, record: RunRecord,
  entries: readonly LedgerEntry<RunEvent>[], packages: ReadonlyMap<string, LoadedPackage>): RecoveryIdentity {
  const migration = restartRuntimeCompatibility(record, entries, current.runtime, packages);
  if (migration.blockers.length) throw new Error(migration.blockers.join('; '));
  if (recoveryHash(before.runtime) !== recoveryHash(migration.before)) throw new Error('Restart source runtime does not match its authenticated captured representations');
  const normalized = structuredClone(before);
  if (migration.migration === 'captured-representation/1') normalized.runtime.contracts = structuredClone(current.runtime.contracts);
  // Only prompt identities explicitly admitted above can change. Frozen plan
  // documents and all other inputs retain their original comparisons.
  normalized.capturedInputs = normalized.capturedInputs.map(input => {
    if (!input.path.startsWith('prompt:')) return input;
    const role = input.path.slice('prompt:'.length);
    const next = packages.get(role), old = record.prompts[role as Role];
    return next && old && input.hash === old.hash ? { ...input, hash: next.hash } : input;
  });
  return normalized;
}

/** Reuse ordinary repair declarations; preserve actual before/after provenance. */
export function validateRestartRepair(before: RecoveryIdentity, current: RecoveryIdentity, declaration: ExternalRepairDeclaration | undefined,
  record: RunRecord, entries: readonly LedgerEntry<RunEvent>[], packages: ReadonlyMap<string, LoadedPackage>): ExternalRepairAdmission {
  const normalized = normalizeRestartIdentityForComparison(before, current, record, entries, packages);
  return validateRecordedRestartRepair(before, current, declaration, normalized);
}

/** Revalidate a comparison retained with authenticated successor initialization.
 * Only the explicitly supported cross-run representation differences are legal. */
export function validateRecordedRestartRepair(before: RecoveryIdentity, current: RecoveryIdentity, declaration: ExternalRepairDeclaration | undefined,
  normalized: RecoveryIdentity): ExternalRepairAdmission {
  const legacy = before.runtime.harness.startsWith('captured-representation/1:');
  const expected = structuredClone(before);
  if (normalized.durableIdentity !== before.durableIdentity) expected.durableIdentity = current.durableIdentity;
  if (legacy) expected.runtime.contracts = structuredClone(current.runtime.contracts);
  expected.capturedInputs = expected.capturedInputs.map(input => {
    if (!legacy || !input.path.startsWith('prompt:')) return input;
    const next = current.capturedInputs.find(other => other.path === input.path);
    const reviewed = promptTransitions.get(`${input.path.slice('prompt:'.length)}:${input.hash}`);
    return next && reviewed === next.hash ? { ...input, hash: next.hash } : input;
  });
  if (recoveryHash(expected) !== recoveryHash(normalized)) throw new Error('Restart comparison changes an unsupported source identity or authority');
  const admission = validateExternalRepair(normalized, current, declaration);
  return { ...admission, before: structuredClone(before), invalidatesQualification: admission.invalidatesQualification || legacy,
    requiresReassessment: admission.requiresReassessment || legacy,
    outstandingVerification: [...admission.outstandingVerification, ...(legacy ? ['Reassess imported completion and producer conclusions under the authenticated successor runtime'] : [])] };
}
