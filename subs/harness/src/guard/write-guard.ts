import { relative, resolve } from 'node:path';
import type { ToolAction } from '../../subs/agent/src/interfaces/port.js';
import { isContained, resolveRealTarget } from './resolve-contained-path.js';
import { OwnershipUnavailableError, OwnershipCancelledError, type OwnershipQueryResult } from '../../subs/evidence/src/ownership-evidence.js';
import { OwnershipAuthorityError } from '../work/ownership-authority.js';
import type { OwnershipEvidenceReference } from '../work/ownership-authority.js';

/*
 * The write guard. A write is intercepted before it executes: the target its
 * action names is resolved against the invocation's working directory, then
 * against the real filesystem, and only then checked against the write scope
 * the assignment recorded.
 *
 * A few files are refused outright, whatever the scope contains: the tracked
 * feature files and the project's configuration for the harness. Only the
 * harness writes them, so no scope and no authorization reaches them. A
 * guarded file no authorization names is refused outright too, but its
 * explanation says that an architect's authorization would open it.
 *
 * A block makes no mutation, does not end the session, does not request
 * approval and does not widen the scope. Only a recorded assignment changes
 * write authority: a retry or a successful read does not.
 *
 * Nothing here stores what the call proposed to write.
 */

/** The write scope as the guard uses it: canonical paths, and the revision that recorded them. */
export interface GuardedScope {
  /** The revision of the `WriteScope` these paths were captured at. */
  readonly revision: number;
  readonly excluded?: readonly string[];
  readonly projectRoot: string;
  readonly placement: (paths: readonly string[]) => Promise<ReadonlyArray<{ path: string; allowed: boolean }>>;
  readonly capturedPlacement?: (paths: readonly string[]) => ReadonlyArray<{ path: string; allowed: boolean }>;
  readonly currentEvidence?: () => { assignment: string; reference: OwnershipEvidenceReference | null };
  readonly retainUnavailable?: (failure: unknown) => Promise<{ hash: string; bytes: number }>;
  /** Historical permission is queried only by explicitly typed recovery handling. */
  readonly historicalPlacement?: (paths: readonly string[]) => Promise<{
    readonly assignment: string;
    readonly decisions: ReadonlyArray<{ readonly path: string; readonly allowed: boolean }>;
    readonly reference: OwnershipEvidenceReference | null;
  }>;
  /** Canonical directories whose whole contents the assignment may write. */
  readonly roots: readonly string[];
  /** Canonical single files the assignment may write, such as a declaration or a contract. */
  readonly files: readonly string[];
  /** Canonical files refused outright, whatever the roots and files contain. */
  readonly denied?: readonly string[] | undefined;
  /**
   * The canonical guarded files among `denied`: an architect's authorization
   * would make them writable, unlike the files only the harness writes.
   */
  readonly guarded?: readonly string[] | undefined;
}

/** What the guard decided about one call. */
export type GuardVerdict = 'allowed' | 'blocked-scope' | 'blocked-unresolved';

/** One guarded call, as the observation records it. Never the proposed contents. */
export interface GuardDecisionRecord {
  readonly verdict: GuardVerdict;
  /** The target exactly as the agent wrote it. */
  readonly requested: string;
  /** What it resolved to, or null when it could not be resolved. */
  readonly resolved: string | null;
  readonly reason: string;
  /** Set when the target is refused outright: a file only the harness writes, or a guarded file no authorization opened. */
  readonly denied?: true | undefined;
  /** Set when the refused target is a guarded file an authorization would make writable. */
  readonly guarded?: true | undefined;
  /** Set when the ownership query threw, so no placement is known; the reason names the error. */
  readonly placementFailed?: true | undefined;
  readonly basis?: 'current' | 'historical';
  readonly assignment?: string;
  readonly ownershipEvidence?: OwnershipEvidenceReference | null;
  readonly ownershipFailure?: Extract<OwnershipQueryResult, { status: 'unavailable' }>;
  readonly cancelled?: true;
  readonly failureEvidence?: { hash: string; bytes: number };
}

/**
 * The one target a write names, or why there is none. The guard judges one
 * target per call, so a write that names several cannot be judged and is
 * blocked as unresolved; no executor's write names several today.
 */
function targetOf(action: ToolAction): { readonly target: string } | { readonly reason: string } {
  if (action.kind !== 'write') return { reason: 'the call is not a write, so it names no path to write' };
  const paths = action.paths.filter(path => path.trim() !== '');
  if (paths.length === 0) return { reason: 'the call names no path to write' };
  if (paths.length > 1) return { reason: `the call names ${paths.length} paths to write, and the guard judges one target per call` };
  return { target: paths[0]! };
}

/**
 * Decides one guarded call. It resolves the target first and judges the
 * scope second, so a path that cannot be resolved is never reported as a
 * scope violation and a scope violation is never reported as a resolution
 * failure.
 */
export async function decideWrite(
  scope: GuardedScope,
  workingDirectory: string,
  action: ToolAction,
): Promise<GuardDecisionRecord> {
  const named = targetOf(action);
  if (!('target' in named)) {
    return { verdict: 'blocked-unresolved', requested: '', resolved: null, reason: named.reason };
  }
  const requested = named.target;
  const target = await resolveRealTarget(workingDirectory, requested);
  if (!target.ok) {
    return { verdict: 'blocked-unresolved', requested, resolved: null, reason: target.reason };
  }
  const candidates = [...new Set([resolve(workingDirectory, requested), target.resolved])];
  const denied = candidates.find(path => scope.denied?.includes(path));
  if (denied !== undefined) return { verdict: 'blocked-scope', requested, resolved: target.resolved,
    reason: scope.guarded?.includes(denied) ? `${denied} is a guarded file, and no authorization of this assignment names it` : `${denied} is written by the harness alone; no agent edits it`, denied: true,
    ...(scope.guarded?.includes(denied) ? { guarded: true as const } : {}) };
  const relativePaths = candidates.map(path => relative(scope.projectRoot, path).split('\\').join('/') || '.');
  if (!candidates.every(path => capturedLocation(scope, path)) ||
      scope.capturedPlacement?.(relativePaths).some(answer => !answer.allowed)) {
    return { verdict: 'blocked-scope', requested, resolved: target.resolved,
      reason: 'The logical and physical targets must both satisfy the recorded boundary and its protections' };
  }
  try {
    const boundary = await placementOutcome(scope, workingDirectory, [requested], true);
    if (boundary.error !== undefined) return { verdict: 'blocked-unresolved', requested, resolved: target.resolved,
      reason: boundary.error, placementFailed: true };
    if (boundary.allowed[0] && !(await sameTarget(workingDirectory, requested, target.resolved))) return { verdict: 'blocked-unresolved', requested, resolved: target.resolved, reason: 'The target changed while ownership was being acquired; no write was admitted' };
    return { verdict: boundary.allowed[0] ? 'allowed' : 'blocked-scope', requested, resolved: target.resolved,
      reason: boundary.allowed[0] ? 'Current ownership and the recorded boundary permit this target' : 'Current ownership refuses this target', basis: 'current', ...(scope.currentEvidence === undefined ? {} : { assignment: scope.currentEvidence().assignment, ownershipEvidence: scope.currentEvidence().reference }) };
  } catch (error) {
    if (error instanceof OwnershipCancelledError) return { verdict: 'blocked-unresolved', requested, resolved: target.resolved,
      reason: 'The ownership query was cancelled before execution', cancelled: true };
    if (!(error instanceof OwnershipUnavailableError)) throw error;
    if (scope.historicalPlacement === undefined) return { verdict: 'blocked-unresolved', requested, resolved: target.resolved,
      reason: `the ownership query failed: ${error.message}; no recorded repair authority is available`, placementFailed: true, ownershipFailure: error.result };
    const failureEvidence = await scope.retainUnavailable?.(error.result);
    let historical;
    try { historical = await scope.historicalPlacement(relativePaths); }
    catch (authorityError) {
      if (!(authorityError instanceof OwnershipAuthorityError) || authorityError.kind !== 'missing') throw authorityError;
      return { verdict: 'blocked-unresolved', requested, resolved: target.resolved, reason: authorityError.message,
        placementFailed: true, ownershipFailure: error.result, ...(failureEvidence === undefined ? {} : { failureEvidence }) };
    }
    const allowed = relativePaths.every(path => historical.decisions.find(answer => answer.path === path)?.allowed === true);
    if (allowed && !(await sameTarget(workingDirectory, requested, target.resolved))) return { verdict: 'blocked-unresolved', requested, resolved: target.resolved, reason: 'The target changed while recorded authority was being read; no write was admitted' };
    return { verdict: allowed ? 'allowed' : 'blocked-scope', requested, resolved: target.resolved,
      reason: allowed ? 'Recorded authority permits temporary repair while current ownership is unavailable' : 'Recorded authority refuses this target',
      basis: 'historical', assignment: historical.assignment, ownershipEvidence: historical.reference, ownershipFailure: error.result, ...(failureEvidence === undefined ? {} : { failureEvidence }) };
  }
}

/** All logical and physical candidates for a coherent provider query shared by a gate's originating scopes. */
export async function placementPaths(projectRoot: string, paths: readonly string[]): Promise<string[]> {
  const targets = await Promise.all(paths.map(async path => ({ logical: resolve(projectRoot, path), target: await resolveRealTarget(projectRoot, path) })));
  return [...new Set(targets.flatMap(({ logical, target }) => target.ok ? [logical, target.resolved] : [])
    .map(path => relative(projectRoot, path).split('\\').join('/') || '.'))];
}

/** Batch both logical and real targets, including deletions and absent targets, through one provider identity. */
export async function placementDecisions(scope: GuardedScope, cwd: string, paths: readonly string[]): Promise<boolean[]> {
  return (await placementOutcome(scope, cwd, paths)).allowed;
}

/**
 * The placement of each path, or the error the ownership query threw. A
 * thrown query permits nothing, and its error is kept so a refusal can name
 * it rather than report a scope violation.
 */
export async function placementOutcome(
  scope: GuardedScope, cwd: string, paths: readonly string[], recovery = false,
): Promise<{ readonly allowed: boolean[]; readonly unknown?: boolean[]; readonly failureStatus?: string; readonly ownershipFailure?: Extract<OwnershipQueryResult, { status: 'unavailable' }>; readonly error?: string }> {
  const targets = await Promise.all(paths.map(async path => ({ logical: resolve(cwd, path), target: await resolveRealTarget(cwd, path) })));
  const requested = targets.flatMap(({ logical, target }) => target.ok ? [logical, target.resolved] : []);
  if (scope.placement === undefined || scope.projectRoot === undefined) return { allowed: paths.map(() => false) };
  let answers = new Map<string, boolean>();
  {
    const relativePaths = [...new Set(requested.map(path => relative(scope.projectRoot, path).split('\\').join('/') || '.'))];
    try { answers = new Map((await scope.placement(relativePaths)).map(answer => [resolve(scope.projectRoot, answer.path), answer.allowed])); }
    catch (error) {
      if (error instanceof OwnershipUnavailableError && !recovery) {
        const unknown = targets.map(({ logical, target }) => {
          const candidates = target.ok ? [logical, target.resolved] : [logical];
          return candidates.every(path => capturedLocation(scope, path)) &&
            scope.capturedPlacement?.(candidates.map(path => relative(scope.projectRoot, path).split('\\').join('/') || '.'))
              .every(answer => answer.allowed) !== false;
        });
        return { allowed: paths.map(() => false), unknown, ownershipFailure: error.result,
          failureStatus: error.result.failureStatus, error: error.message };
      }
      throw error;
    }
  }
  return { unknown: targets.map(({ logical, target }) => !target.ok && capturedLocation(scope, logical)), allowed: targets.map(({ logical, target }) => target.ok && [logical, target.resolved].every(path =>
    capturedLocation(scope, path) &&
    answers.get(path) === true)) };
}

/**
 * What a blocked call tells the agent: the target, the scope, and what to do
 * instead. It never offers to widen the scope and never asks for approval.
 */
export function blockExplanation(decision: GuardDecisionRecord, scope: GuardedScope): string {
  const locations = [
    ...scope.roots.map(root => `${root}/ (and everything beneath it)`),
    ...scope.files.map(file => file),
  ];
  const where = locations.length === 0 ? '  (this assignment may write nothing)' : locations.map(line => `  ${line}`).join('\n');
  if (decision.guarded === true) {
    return [
      `The target "${decision.requested}" resolves to ${decision.resolved ?? 'nothing'}, a guarded file this assignment does not authorize. Nothing was written.`,
      '',
      'Guarded files decide what the checks discover and run: package manifests and lockfiles, compiler, test-runner and audit configuration, and contract artifacts.',
      'One becomes writable only when the architect names it in an authorization of an assignment. If the work needs the change, report it in your submission, naming the file and why, so the architect can authorize it.',
      'Do not retry the same target, and do not write it another way: an unauthorized change to it fails the gate as a guarded change.',
    ].join('\n');
  }
  if (decision.denied === true) {
    return [
      `The target "${decision.requested}" resolves to ${decision.resolved ?? 'nothing'}, which only the harness writes. Nothing was written.`,
      '',
      'A feature file is rendered by the harness from the plan\'s scenarios: bind its steps with step definitions in a module\'s steps directory instead.',
      'The project\'s configuration for the harness, ramify-agent.json, is captured when the run starts and no agent changes it.',
      'Captured plan and principles documents are also run inputs; edit source files within the authorized implementation scope instead.',
      'Do not retry the same target, and do not write it another way: a change to it fails the gate as a guarded change.',
    ].join('\n');
  }
  if (decision.placementFailed === true) {
    return [
      `The target "${decision.requested}" was refused because ${decision.reason}. Nothing was written.`,
      '',
      'This is not a write-scope decision: the project\'s ownership could not be read, so no target can be placed until it is repaired.',
      'Report the error in your submission, naming the failing module description if the error names one.',
      'Do not retry the same target: a retry meets the same failure.',
    ].join('\n');
  }
  const head = decision.verdict === 'blocked-unresolved'
    ? `The target "${decision.requested}" could not be resolved: ${decision.reason}. Nothing was written.`
    : `The target "${decision.requested}" resolves to ${decision.resolved ?? 'nothing'}, which is outside this iteration's write scope. Nothing was written.`;
  return [
    head,
    '',
    `Write scope (revision ${scope.revision}):`,
    where,
    '',
    'Report the need in your submission, or ask for it through the delegation mechanism.',
    'Do not retry the same target: a retry does not widen the scope, and only a recorded assignment changes what you may write.',
  ].join('\n');
}

/** Local protections apply before any acquisition, including during repair. */
function capturedLocation(scope: GuardedScope, path: string): boolean {
  if (!isContained(scope.projectRoot, path)) return false;
  const name = relative(scope.projectRoot, path).split('\\').join('/');
  const parts = name.split('/');
  if (parts.some(part => ['.git', 'node_modules', '.ramify', '.ramify-architect'].includes(part)) ||
      /^plans\/(?:[^/]+\/)?\.harness(?:\/|$)/u.test(name)) return false;
  if (scope.denied?.includes(path) || scope.excluded?.some(excluded => isContained(excluded, path))) return false;
  return scope.files.includes(path) || scope.roots.some(root => isContained(root, path));
}

async function sameTarget(cwd: string, requested: string, expected: string): Promise<boolean> {
  const current = await resolveRealTarget(cwd, requested);
  return current.ok && current.resolved === expected;
}
