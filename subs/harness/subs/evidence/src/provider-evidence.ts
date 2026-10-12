import { z } from 'zod';
import type { AnalysisCode, StageExecution } from 'ramify.ts/analysis';
import type { CheckDocument, CliFailureDocument } from 'ramify.ts/cli';

/** Serialized resident evidence; it is not a filesystem checkpoint. */
export type RecoveryEvidence = NonNullable<CheckDocument['recovery']>;
const diagnosticCodes = ['invalid-registry', 'unknown-tag', 'invalid-module-id', 'duplicate-module', 'invalid-tree', 'invalid-original', 'missing-required-tag', 'conflicting-tags', 'ungrounded-exposure', 'same-owner', 'exposed', 'symbol-free', 'testing-origin', 'not-visible', 'required-importer-tag', 'required-symbol-tag', 'invalid-encoding', 'bare-cr', 'invalid-whitespace', 'unterminated-string', 'invalid-escape', 'invalid-scalar', 'invalid-name', 'empty-name', 'reserved-name', 'missing-version', 'unsupported-version', 'missing-header', 'duplicate-header', 'invalid-order', 'unknown-clause', 'invalid-selection', 'invalid-list', 'invalid-destination', 'duplicate-tag', 'duplicate-destination', 'invalid-tag-syntax', 'unknown-statement', 'test-profile-declaration', 'missing-from', 'missing-to', 'trailing-token', 'missing-file', 'missing-export', 'foreign-original', 'incomplete-expansion', 'ambiguous-expansion', 'invalid-wildcard-target', 'unknown-child', 'name-collision', 'auxiliary-original-exposure', 'invalid-prerequisite', 'root-not-found', 'missing-root-description', 'unmarked-root-description', 'configuration-not-found', 'references-only-configuration', 'invalid-layout', 'invalid-description', 'duplicate-name', 'description-in-src', 'stray-description', 'reserved-container', 'undeclared-project-boundary', 'invalid-nested-tree', 'missing-owned-unwired', 'missing-owned-nested-project', 'overlapping-nested-tree', 'symlink-root', 'symlink-description', 'symlink-reference', 'case-mismatch', 'invalid-path', 'resource-limit', 'read-failure', 'changed-input', 'invalid-invocation', 'unavailable-capability', 'missing-stage', 'session-used', 'session-disposed', 'output-failure', 'internal-error', 'exposed-without-companion', 'project-boundary-import'] as const satisfies readonly AnalysisCode[];
const _allCodesKnown: Exclude<AnalysisCode, typeof diagnosticCodes[number]> extends never ? true : never = true;
void _allCodesKnown;
const location = z.strictObject({ file: z.string(), start: z.int().nonnegative(), end: z.int().nonnegative(), line: z.int().positive(), column: z.int().positive() });
/** Decode the public serialized vocabulary without importing provider execution. */
export const diagnosticEvidenceSchema = z.strictObject({
  id: z.string(), category: z.enum(['invocation', 'registry', 'layout', 'description', 'missing-export', 'import', 'exposure', 'acquisition', 'unavailable', 'execution', 'limit']), code: z.enum(diagnosticCodes), message: z.string(), location: location.nullable(), related: z.array(location),
  importer: z.strictObject({ owner: z.string(), kind: z.enum(['ordinary', 'tests']), root: z.string(), profile: z.array(z.string()) }).nullable(),
  original: z.strictObject({ kind: z.enum(['code', 'resource']), owner: z.string(), file: z.string(), binding: z.string() }).nullable(), accessId: z.string().nullable(),
  limit: z.strictObject({ name: z.string(), maximum: z.int().nonnegative(), observed: z.int().nonnegative(), collectedPrefix: z.literal(true) }).optional(),
});
const stageId = z.enum(['registry', 'acquisition', 'parse', 'catalog', 'link', 'access', 'decide', 'report']);
const stageSchema = z.strictObject({ stage: stageId, status: z.enum(['completed', 'invalid', 'blocked', 'unavailable', 'failed', 'not-requested']), blockedBy: z.array(stageId), diagnosticIds: z.array(z.string()) });
const recoverySchema = z.strictObject({ schemaVersion: z.literal('ramify.recovery/1'),
  lastCompleted: z.strictObject({ context: z.string(), generation: z.string(), revision: z.string(), inputId: z.string() }).nullable(),
  changes: z.strictObject({ paths: z.array(z.string()), coverage: z.enum(['observed', 'unavailable']), reason: z.string().nullable() }) });
export interface ProviderFailureEvidence {
  readonly diagnostics?: CliFailureDocument['diagnostics'];
  readonly stages?: readonly StageExecution[];
  readonly recovery?: RecoveryEvidence;
}
/** Only new carriers can supply stages or recovery. Absent evidence stays absent. */
export function decodeProviderFailureEvidence(value: Record<string, unknown>, newCarrier: boolean, operationDiagnostics = false): ProviderFailureEvidence {
  if (!newCarrier && ('stages' in value || 'recovery' in value)) throw new Error('old schema carries new failure evidence');
  const evidence: { diagnostics?: ProviderFailureEvidence['diagnostics']; stages?: readonly StageExecution[]; recovery?: RecoveryEvidence } = {};
  if ('diagnostics' in value) {
    const schema = operationDiagnostics ? z.union([diagnosticEvidenceSchema, z.strictObject({ category: z.enum(['invocation', 'execution']), code: z.string(), message: z.string() })]) : diagnosticEvidenceSchema;
    evidence.diagnostics = z.array(schema).parse(value.diagnostics) as ProviderFailureEvidence['diagnostics'];
  }
  if ('stages' in value) evidence.stages = z.array(stageSchema).parse(value.stages) as readonly StageExecution[];
  if ('recovery' in value) {
    const recovery = recoverySchema.parse(value.recovery);
    const paths = recovery.changes.paths;
    if (paths.length > 10_000) throw new Error('recovery path limit');
    if (new Set(paths).size !== paths.length || paths.some(path => path === '' || path.startsWith('/') || path.includes('\\') || path.includes('\0') || /^[A-Za-z]:/u.test(path) || path.split('/').some(part => part === '' || part === '.' || part === '..'))) throw new Error('invalid recovery paths');
    if (paths.some((path, index) => index > 0 && Buffer.compare(Buffer.from(paths[index - 1]!), Buffer.from(path)) >= 0)) throw new Error('recovery paths are not byte ordered');
    if (recovery.changes.reason === '') throw new Error('empty recovery gap reason');
    if (recovery.lastCompleted !== null) {
      const identity = recovery.lastCompleted;
      const generation = /^gen\/1:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/u.exec(identity.generation);
      if (!/^ctx\/1:[0-9a-f]{64}$/u.test(identity.context) || !generation || !/^input\/1:[0-9a-f]{64}$/u.test(identity.inputId) || !/^rev\/1:[0-9a-f-]{36}:[1-9][0-9]*$/u.test(identity.revision) || !identity.revision.startsWith(`rev/1:${generation[1]}:`)) throw new Error('invalid recovery identity');
      const coverage = paths.length > 0 || recovery.changes.reason === null ? 'observed' : 'unavailable';
      if (recovery.changes.coverage !== coverage) throw new Error('recovery observation/coverage disagreement');
    }
    if (recovery.lastCompleted === null && (recovery.changes.coverage !== 'unavailable' || recovery.changes.reason === null)) throw new Error('recovery baseline/coverage disagreement');
    evidence.recovery = recovery;
  }
  return evidence;
}
