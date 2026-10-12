import { ownershipDocumentSchema, type AffectedDocument, type OwnershipDocument } from 'ramify.ts/cli';
import type { ProjectOwnership } from 'ramify.ts/analysis';
import type { RamifyRun } from './ramify-cli.js';
import { decodeOwnershipAnswer, validateOwnershipTableAndPaths } from './ownership.js';
import { decodeProviderFailureEvidence, type ProviderFailureEvidence } from './provider-evidence.js';

export type OwnershipPath = { readonly path: string } & (
  | { readonly status: 'owned'; readonly module: string; readonly exclusion: ProjectOwnership['exclusions'][number] | null }
  | { readonly status: 'excluded'; readonly module: null; readonly exclusion: ProjectOwnership['exclusions'][number] }
  | { readonly status: 'outside-project'; readonly module: null; readonly exclusion: null });
/** Facts actually answered by either supported ownership carrier. */
export interface OwnershipAnswer {
  readonly schemaVersion: 'ramify.ownership/1' | 'ramify.affected-cli/4';
  readonly ramifyVersion: string;
  readonly root: string;
  readonly inputId: string;
  readonly scope: { readonly configuration: string; readonly ownership: ProjectOwnership };
  readonly paths: readonly OwnershipPath[];
}
export interface RawOwnershipEvidence { readonly exitCode: number; readonly stdout: string; readonly stderr: string; readonly report: unknown }
export type OwnershipQueryResult =
  | (RawOwnershipEvidence & { readonly status: 'answered'; readonly answer: OwnershipAnswer })
  | (RawOwnershipEvidence & { readonly status: 'unavailable'; readonly failureStatus: 'invalid' | 'incomplete' | 'unavailable' | 'unsupported' | 'execution-failed'; readonly reason: string; readonly decoded: ProviderFailureEvidence | null })
  | (RawOwnershipEvidence & { readonly status: 'cancelled' });
export class OwnershipUnavailableError extends Error {
  constructor(readonly result: Extract<OwnershipQueryResult, { status: 'unavailable' }>) { super(result.reason); }
}
export class OwnershipCancelledError extends Error {
  constructor(readonly result: Extract<OwnershipQueryResult, { status: 'cancelled' }>) { super('Ramify ownership query cancelled'); }
}
/** Compatibility callers still refuse absent current evidence; failure bytes remain attached. */
export function requireOwnershipAnswer(result: OwnershipQueryResult): OwnershipAnswer {
  if (result.status === 'answered') return result.answer;
  if (result.status === 'cancelled') throw new OwnershipCancelledError(result);
  throw new OwnershipUnavailableError(result);
}
export function ownershipAnswerOfAffected(answer: AffectedDocument): OwnershipAnswer {
  return { schemaVersion: answer.schemaVersion, ramifyVersion: answer.ramifyVersion, root: answer.root, inputId: answer.revision.inputId,
    scope: { configuration: answer.selection.scope.configuration, ownership: answer.selection.scope.ownership },
    paths: answer.selection.paths.map(path => ({ path: path.path, status: path.status, module: path.module, exclusion: path.exclusion })) as OwnershipPath[] };
}
const object = (value: unknown): Record<string, unknown> => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error('document is not an object');
  return value as Record<string, unknown>;
};
const text = (value: unknown): string => { if (typeof value !== 'string' || value.length === 0) throw new Error('missing identity'); return value; };
const exact = (value: Record<string, unknown>, keys: readonly string[]): void => { if (Object.keys(value).some(key => !keys.includes(key))) throw new Error('unsupported field'); };
/** Revalidate normalized successful evidence when loading durable provider evidence. */
export function decodeOwnershipEvidenceAnswer(value: unknown, expectedRoot: string): OwnershipAnswer {
  const answer = object(value); exact(answer, ['schemaVersion', 'ramifyVersion', 'root', 'inputId', 'scope', 'paths']);
  if (!['ramify.ownership/1', 'ramify.affected-cli/4'].includes(String(answer.schemaVersion)) || answer.root !== expectedRoot) throw new Error('schema or root');
  text(answer.ramifyVersion); text(answer.inputId);
  const scope = object(answer.scope); exact(scope, ['configuration', 'ownership']); text(scope.configuration);
  if (!Array.isArray(answer.paths)) throw new Error('paths');
  for (const path of answer.paths) exact(object(path), ['path', 'status', 'module', 'exclusion']);
  validateOwnershipTableAndPaths(scope.ownership, answer.paths, false);
  return value as OwnershipAnswer;
}
/** Decode acquisition separately from per-path refusal and preserve every received byte. */
export function decodeOwnershipQueryResult(run: RamifyRun, root: string, requested: readonly string[]): OwnershipQueryResult {
  let report: unknown = null; try { report = JSON.parse(run.stdout); } catch { /* Preserve undecodable bytes. */ }
  const raw = { exitCode: run.code, stdout: run.stdout, stderr: run.stderr, report };
  if (run.code === 130) return { ...raw, status: 'cancelled' };
  try {
    const value = object(report);
    if (value.schemaVersion === 'ramify.affected-cli/4' && run.code === 0) {
      const answer = ownershipAnswerOfAffected(decodeOwnershipAnswer(value, root));
      checkRequested(answer, requested); return { ...raw, status: 'answered', answer };
    }
    if (value.schemaVersion === 'ramify.ownership/1') {
      const document: OwnershipDocument = ownershipDocumentSchema.parse(value);
      if (document.exitCode !== run.code) throw new Error('exit/schema disagreement');
      if (document.status === 'answered') {
        const paths = document.paths.map(({ path, ownership }) => {
          if (ownership.status === 'invalid-path') throw new Error('successful ownership cannot carry an invalid path');
          if (ownership.status === 'owned' && !document.scope.ownership.modules.some(module => module.id === ownership.module && module.directory === ownership.directory)) throw new Error('path owner directory disagreement');
          return { path, status: ownership.status, module: ownership.module, exclusion: ownership.status === 'outside-project' ? null : ownership.exclusion };
        });
        const answer = decodeOwnershipEvidenceAnswer({ schemaVersion: document.schemaVersion, ramifyVersion: document.ramifyVersion, root: document.root, inputId: document.inputId, scope: document.scope, paths }, root);
        checkRequested(answer, requested); return { ...raw, status: 'answered', answer };
      }
      if (document.root !== null && document.root !== root) throw new Error('root');
      const decoded: ProviderFailureEvidence = { diagnostics: document.diagnostics, ...(document.stages === undefined ? {} : { stages: document.stages }) };
      return { ...raw, status: 'unavailable', failureStatus: document.status, reason: `Ramify ownership acquisition ${document.status}`, decoded };
    }
    if (value.schemaVersion === 'ramify.cli/1' || value.schemaVersion === 'ramify.cli/2') {
      exact(value, value.schemaVersion === 'ramify.cli/2' ? ['schemaVersion', 'status', 'diagnostics', 'exitCode', 'stages', 'recovery'] : ['schemaVersion', 'status', 'diagnostics', 'exitCode', 'reason']);
      if (value.schemaVersion === 'ramify.cli/2' && !Array.isArray(value.diagnostics)) throw new Error('diagnostics');
      if (![1, 2].includes(run.code) || value.exitCode !== run.code || value.status !== 'unavailable') throw new Error('exit/schema disagreement');
      const decoded = decodeProviderFailureEvidence(value, value.schemaVersion === 'ramify.cli/2', true);
      return { ...raw, status: 'unavailable', failureStatus: run.code === 1 ? 'invalid' : 'unavailable', reason: typeof value.reason === 'string' ? value.reason : 'Ramify invocation unavailable', decoded };
    }
    throw new Error('unsupported schema');
  } catch (error) {
    return { ...raw, status: 'unavailable', failureStatus: report === null && run.code === -1 ? 'execution-failed' : 'unsupported', reason: `Ramify ownership unavailable: ${(error as Error).message}`, decoded: null };
  }
}
function checkRequested(answer: OwnershipAnswer, paths: readonly string[]): void {
  if (new Set(answer.paths.map(path => path.path)).size !== new Set(paths).size || paths.some(path => !answer.paths.some(item => item.path === path))) throw new Error('query did not answer exactly the requested paths');
}
