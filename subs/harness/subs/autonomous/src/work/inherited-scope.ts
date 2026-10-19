import { OwnershipUnavailableError } from '../../../evidence/src/ownership-evidence.js';
import type { AssignmentBody } from './assignment.js';
import type { IterationAssignment } from './iterations.js';
import { assignmentAuthorityIdentity, OwnershipAuthorityError } from '../../../../src/work/ownership-authority.js';
import { checkWriteScope, missingHistoricalAuthority, resolveWriteScope, within, type ScopeCapture, type WriteScope, type WriteScopeCheckResult } from '../../../../src/work/scope.js';

/** Current evidence is preferred; an unavailable query can reuse only a recorded assignment's region. */
export async function checkContinuationScope(capture: ScopeCapture, body: AssignmentBody,
  previous: IterationAssignment | undefined, validatePrevious?: () => Promise<void>): Promise<WriteScopeCheckResult> {
  try { return await checkWriteScope(capture); }
  catch (error) {
    if (!(error instanceof OwnershipUnavailableError)) throw error;
    const unavailable = (missing: string): WriteScopeCheckResult => ({ scope: null, errors: [{ path: 'assignment.scope',
      message: `Current ownership unavailable: ${error.message}. Historical repair lacks ${missing}; repair the recorded boundary first or report the missing authority through unresolved/environment handling.` }] });
    if (previous === undefined) return unavailable('a verified previous assignment');
    try { await validatePrevious?.(); }
    catch (authorityError) {
      if (authorityError instanceof OwnershipAuthorityError && authorityError.kind === 'missing') return unavailable(authorityError.message);
      throw authorityError;
    }
    const missing = missingHistoricalAuthority(previous.scope);
    if (missing.length > 0) return unavailable(missing.join(', '));
    const original = previous.scope;
    if (original.resolved.ownership.root !== capture.projectRoot) return unavailable('the same recorded project identity');
    const owners = (base: ScopeCapture['base']) => 'module' in base ? [base.module] : base.modules;
    if (owners(capture.base).some(owner => !owners(original.base).includes(owner))) return unavailable('recorded authority for the requested owner');
    if ('module' in capture.base && ('module' in original.base ? capture.base.module !== original.base.module : !original.base.modules.includes(capture.base.module))) return unavailable('a recorded owner');
    if ('module' in capture.base && capture.base.included.some(entry => !original.resolved.included.some(old => old.directory === entry.directory && old.instructions === entry.instructions))) return unavailable('recorded included-tree authority and instructions');
    if (capture.extra.some(entry => !original.extra.some(old => old.path === entry.path && old.kind === entry.kind && old.purpose === entry.purpose))) return unavailable('recorded authority for the requested extra targets');
    if (capture.bootstrap.some(entry => !original.bootstrap.some(old => JSON.stringify(old) === JSON.stringify(entry)))) return unavailable('recorded bootstrap authority');
    if ((body.authorizations ?? []).some(entry => !previous.authorizations.some(old => old.path === entry.path))) return unavailable('recorded guarded-file authorization');
    const evidence = original.resolved.ownership;
    let scope: WriteScope;
    try { scope = await resolveWriteScope(capture, { schemaVersion: evidence.provider, ramifyVersion: evidence.ramifyVersion,
      root: evidence.root, inputId: evidence.inputId, scope: { configuration: evidence.configuration,
        ownership: { modules: evidence.modules, exclusions: evidence.exclusions } }, paths: [] }); }
    catch (reconstructionError) { return unavailable(`a reconstructable canonical boundary (${String(reconstructionError)})`); }
    if (scope.resolved.roots.some(root => !original.resolved.roots.some(old => within(root, old)))
      || scope.resolved.files.some(file => !original.resolved.files.includes(file) && !original.resolved.roots.some(root => within(file, root)))) return unavailable('the original canonical write region');
    scope.resolved.excluded = [...new Set([...original.resolved.excluded, ...scope.resolved.excluded])];
    scope.resolved.included = original.resolved.included.filter(entry => scope.resolved.included.some(current => current.directory === entry.directory));
    scope.resolved.nestedDeclarations = original.resolved.nestedDeclarations;
    scope.resolved.view = original.resolved.view;
    scope.resolved.sourceAuthority = original.resolved.sourceAuthority ?? assignmentAuthorityIdentity(previous);
    return { scope, errors: [] };
  }
}
