import { gitCandidateSource, recoveryStatus, type CandidateSource, type TreeEntry } from '../../subs/evidence/src/git.js';
import type { RecordReference } from '../checks/records.js';
import { guardedConfigurationFiles } from '../work/scope.js';

/** Frozen at registration. Entries name exact files or directory prefixes ending in `/`. */
export interface ProtectionRules {
  readonly explicitPaths: readonly string[];
  readonly excludedPaths: readonly string[];
  /** Project commitments that exclusions cannot remove. */
  readonly guardedPaths: readonly string[];
  /** Whether a newly selected path is itself protected. */
  readonly additions: 'protect' | 'allow';
}

/** The harness's guarded project inputs supplement the document suffix defaults. */
export function defaultProtectionRules(input: Partial<ProtectionRules> = {}): ProtectionRules {
  const rules = {
    explicitPaths: input.explicitPaths ?? [],
    excludedPaths: input.excludedPaths ?? [],
    guardedPaths: [...guardedConfigurationFiles, ...(input.guardedPaths ?? [])],
    additions: input.additions ?? 'protect',
  } as const;
  validateRules(rules);
  return rules;
}

function validateRules(rules: ProtectionRules): void {
  for (const path of [...rules.explicitPaths, ...rules.excludedPaths, ...rules.guardedPaths]) {
    const parts = path.split('/');
    if (path === '' || path.startsWith('/') || path.includes('\\') || path.includes('\0')
      || parts.some((part, index) => part === '.' || part === '..' || (part === '' && index !== parts.length - 1))) {
      throw new Error(`Protected path must be project-relative: ${path}`);
    }
  }
}

function matches(path: string, pattern: string): boolean {
  return pattern.endsWith('/') ? path.startsWith(pattern) : path === pattern;
}

/** Selection is evaluated from the retained rules, not from candidate contents. */
export function isProtectedPath(path: string, rules: ProtectionRules): boolean {
  validateRules(rules);
  if (rules.guardedPaths.some(pattern => matches(path, pattern))) return true;
  const selected = path.endsWith('.principles.md') || path.endsWith('.spec.md')
    || rules.explicitPaths.some(pattern => matches(path, pattern));
  return selected && !rules.excludedPaths.some(pattern => matches(path, pattern));
}

export interface ProtectedInputGap {
  readonly path: string;
  readonly state: 'staged' | 'unstaged' | 'untracked';
}

export interface ProtectedInputStatus {
  readonly staged: readonly string[];
  readonly unstaged: readonly string[];
  readonly untracked: readonly string[];
}

/** Detect source absent from the fixed Git baseline before accepting a registration. */
export async function inspectProtectedInputs(input: {
  readonly projectRoot: string;
  readonly rules: ProtectionRules;
  readonly status?: (root: string) => Promise<ProtectedInputStatus>;
}): Promise<{ readonly gaps: readonly ProtectedInputGap[] }> {
  const status = await (input.status ?? recoveryStatus)(input.projectRoot);
  const gaps: ProtectedInputGap[] = [];
  for (const state of ['staged', 'unstaged', 'untracked'] as const) {
    for (const path of status[state]) {
      if (state === 'untracked' && input.rules.additions === 'allow'
        && !input.rules.guardedPaths.some(pattern => matches(path, pattern))) continue;
      if (isProtectedPath(path, input.rules)) gaps.push({ path, state });
    }
  }
  return { gaps };
}

/** Git's immutable entry identity, including type and executable mode. */
export interface ProtectedIdentity {
  readonly kind: TreeEntry['kind'];
  /** Null means Git entry metadata was insufficient for exact authorization. */
  readonly objectId: string | null;
}

/** An accepted decision with exact before/after Git evidence. Reasons alone never authorize edits. */
export interface ProtectedException {
  readonly path: string;
  readonly before: ProtectedIdentity | null;
  readonly after: ProtectedIdentity | null;
  /** Reference to the committed acceptance decision, resolved by the caller. */
  readonly authority: RecordReference;
}

export interface ProtectedChange {
  readonly path: string;
  readonly status: string;
  readonly before: ProtectedIdentity | null;
  readonly after: ProtectedIdentity | null;
  readonly authorizedBy: ProtectedException['authority'] | null;
}

export interface ProtectionComparison {
  readonly baselineCommit: string;
  readonly candidateCommit: string;
  readonly changes: readonly ProtectedChange[];
  readonly violations: readonly ProtectedChange[];
}

function identity(entry: TreeEntry | undefined): ProtectedIdentity | null {
  if (entry === undefined) return null;
  return { kind: entry.kind, objectId: entry.objectId ?? null };
}

function sameIdentity(a: ProtectedIdentity | null, b: ProtectedIdentity | null): boolean {
  return a === null ? b === null : b !== null && a.kind === b.kind && a.objectId === b.objectId;
}

/** Compare the candidate with the original baseline on every assessment. */
export async function compareProtection(input: {
  readonly projectRoot: string;
  readonly baselineCommit: string;
  readonly candidateCommit: string;
  readonly rules: ProtectionRules;
  readonly exceptions?: readonly ProtectedException[];
  readonly candidates?: CandidateSource;
  readonly signal?: AbortSignal;
}): Promise<ProtectionComparison> {
  validateRules(input.rules);
  const source = input.candidates ?? gitCandidateSource;
  const [diff, baselineEntries, candidateEntries] = await Promise.all([
    source.diffNameStatus(input.projectRoot, input.baselineCommit, input.candidateCommit, input.signal),
    source.treeEntries(input.projectRoot, input.baselineCommit, input.signal),
    source.treeEntries(input.projectRoot, input.candidateCommit, input.signal),
  ]);
  const beforeByPath = new Map(baselineEntries.map(entry => [entry.path, entry]));
  const afterByPath = new Map(candidateEntries.map(entry => [entry.path, entry]));
  const changes: ProtectedChange[] = [];
  for (const { path, status } of diff) {
    if (!isProtectedPath(path, input.rules)) continue;
    const beforeEntry = beforeByPath.get(path), afterEntry = afterByPath.get(path);
    if (beforeEntry === undefined && afterEntry === undefined) throw new Error(`Git diff named ${path} absent from both trees`);
    if (beforeEntry === undefined && input.rules.additions === 'allow'
      && !input.rules.guardedPaths.some(pattern => matches(path, pattern))) continue;
    const before = identity(beforeEntry), after = identity(afterEntry);
    changes.push({ path, status, before, after, authorizedBy: null });
  }
  return authorizeProtection({ baselineCommit: input.baselineCommit, candidateCommit: input.candidateCommit,
    changes, violations: changes }, input.exceptions ?? []);
}

/** Apply recorded authority to immutable comparison identities without repeating Git inspection. */
export function authorizeProtection(comparison: ProtectionComparison, exceptions: readonly ProtectedException[]): ProtectionComparison {
  const changes = comparison.changes.map(change => {
    const exception = exceptions.find(item => item.path === change.path && item.authority.id !== ''
      && Number.isInteger(item.authority.revision) && item.authority.revision >= 0
      && /^[0-9a-f]{64}$/u.test(item.authority.hash)
      && (change.before === null || change.before.objectId !== null) && (change.after === null || change.after.objectId !== null)
      && sameIdentity(item.before, change.before) && sameIdentity(item.after, change.after));
    return { ...change, authorizedBy: exception?.authority ?? null };
  });
  return { ...comparison, changes, violations: changes.filter(change => change.authorizedBy === null) };
}
