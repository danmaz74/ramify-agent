import { createHash } from 'node:crypto';
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { architectViewDirectory } from '../../evidence/src/views.js';
import { readMeasurement, type MeasurementDocument, type ModuleMeasurement } from '../../evidence/src/measure.js';
import type { RamifyCli } from '../../evidence/src/ramify-cli.js';
import type { ViewIdentity } from '../../../src/interfaces/protocol/evidence.js';
import { measurementSnapshotSchema, type MeasurementSnapshot, type SnapshotId } from './run-records.js';
import { scopeSizeSchema, type ScopeComponent, type ScopeSize } from '../../task-execution/src/records.js';

export const scopeSizePolicy = 'scope-size/2' as const;

/** Measurement facts, not an assignment or prompt package. Locations describe acquisition at invocation start. */
export interface DeclaredScope {
  readonly exactOwners: readonly string[];
  readonly subtrees: readonly string[];
  readonly apiViews: boolean;
  readonly architectView: boolean;
  readonly supportDocuments: readonly string[];
  readonly locations?: ReadonlyArray<{ readonly path: string; readonly bytes: number | null; readonly files?: readonly { readonly path: string; readonly bytes: number }[]; readonly unreadable?: string }> | undefined;
  readonly nestedProjects?: readonly string[] | undefined;
  readonly brief?: number | undefined;
}

/** Ordered delivered facts. Hashes and bytes are those delivered, never re-read from current disk. */
export interface DeliveredSupportEntry {
  readonly kind: string;
  readonly source: string | null;
  readonly hash: string;
  readonly bytes: number;
  readonly sources: readonly DeliveredSupportSource[];
}
export interface DeliveredSupportSource {
  readonly path: string;
  readonly hash: string;
  readonly bytes: number;
}
export interface DeliveredScopeInputs {
  readonly scope: DeclaredScope;
  readonly supplementary: readonly { readonly path: string; readonly bytes: number }[];
}

export function baselineScope(rootModule: string, supportDocuments: readonly string[]): DeclaredScope {
  return { exactOwners: [], subtrees: [rootModule], apiViews: true, architectView: true, supportDocuments };
}

/** Count each delivered source identity once, preserving first-seen order. */
export function deliveredScopeInputs(declared: DeclaredScope, entries: readonly DeliveredSupportEntry[]): DeliveredScopeInputs {
  const files = new Map<string, number>();
  const identities = new Map<string, string>();
  const addFile = (path: string, bytes: number, hash: string) => {
    if (identities.has(path) && (identities.get(path) !== hash || files.get(path) !== bytes)) throw new Error(`Conflicting delivered support revisions for ${path}`);
    identities.set(path, hash); files.set(path, bytes);
  };
  const briefs = new Map<string, number>();
  for (const entry of entries) {
    if (entry.kind === 'brief') continue;
    for (const source of entry.sources) addFile(source.path, source.bytes, source.hash);
    if (entry.sources.length === 0 && entry.source !== null) addFile(entry.source, entry.bytes, entry.hash);
    if (entry.sources.length === 0 && entry.source === null && ['role-instructions', 'procedure', 'skill', 'tool-declaration'].includes(entry.kind)) addFile(`delivered-inputs/${entry.kind}/${entry.hash}`, entry.bytes, entry.hash);
  }
  for (const entry of entries) if (entry.kind === 'brief' &&
    !(entry.source !== null && identities.get(entry.source) === entry.hash && files.get(entry.source) === entry.bytes)) {
    briefs.set(entry.hash, entry.bytes);
  }
  return {
    scope: { ...declared, supportDocuments: [...files.keys()], brief: [...briefs.values()].reduce((sum, bytes) => sum + bytes, 0) },
    supplementary: [...files].map(([path, bytes]) => ({ path, bytes })),
  };
}

/** Recorded declaration facts; no acquisition or execution callback enters the provider. */
export interface InvocationScopeDeclaration {
  readonly snapshot: MeasurementSnapshot;
  readonly scope: DeclaredScope;
  readonly readScope?: DeclaredScope | undefined;
}

/** Calculate before location acquisition so a later acquisition failure retains this answer. */
export function invocationReadSize(snapshot: MeasurementSnapshot | null, declaration: InvocationScopeDeclaration | undefined, writer: boolean): ScopeSize | null {
  if (snapshot === null || declaration === undefined) return null;
  if (declaration.readScope) return scopeSize(snapshot, declaration.readScope);
  return writer ? null : scopeSize(snapshot, { ...declaration.scope, supportDocuments: [], brief: 0 });
}

/** Qualify the captured invocation facts without inventing an unavailable snapshot. */
export function invocationScopeSize(snapshot: MeasurementSnapshot | null, actual: DeliveredScopeInputs, acquired: DeclaredScope, role: string, hasDeclaration: boolean): ScopeSize {
  if (snapshot === null) {
    const known = actual.supplementary.reduce((sum, entry) => sum + entry.bytes, 0) + (actual.scope.brief ?? 0);
    return { policy: scopeSizePolicy, snapshot: 'unavailable', bytes: null, subtotal: known, coverage: 'partial', components: [
      { component: 'owned-source', detail: role, state: 'unavailable', bytes: null, reason: 'No frozen measurement snapshot is available' },
      { component: 'support-documents', detail: 'Actual delivered/inherited inputs', state: 'measured', bytes: known },
    ] };
  }
  const paths = new Set(actual.supplementary.map(entry => entry.path));
  const frozen = { ...snapshot, supplementary: [...snapshot.supplementary.filter(entry => !paths.has(entry.path)), ...actual.supplementary] };
  const size = scopeSize(frozen, acquired);
  // The unknown component replaces (rather than duplicates) the empty selection.
  return hasDeclaration ? size : { ...size, bytes: null, coverage: 'partial', components: size.components.map(component => component.component === 'owned-source'
    ? { component: 'owned-source', detail: role, state: 'unknown', bytes: null, reason: 'This role has no recorded owned-source size declaration; delivered support subtotal retained' } : component) };
}

/** Acquisition failed: retain the declared snapshot and disjoint non-support subtotal. */
export function invocationScopeFailure(declaration: InvocationScopeDeclaration | undefined, role: string, reason: string): ScopeSize {
  const known = declaration ? scopeSize(declaration.snapshot, { ...declaration.scope, supportDocuments: [], brief: 0 }) : null;
  return { policy: scopeSizePolicy, snapshot: declaration?.snapshot.id ?? 'unavailable', bytes: null, subtotal: known?.subtotal ?? 0, coverage: 'partial', components: [
    ...(known?.components.filter(component => component.component !== 'support-documents') ?? []),
    { component: 'support-documents', detail: role, bytes: null, state: 'unavailable', reason },
  ] };
}

export interface SnapshotRequest {
  readonly id: SnapshotId;
  readonly ramify: RamifyCli;
  readonly projectRoot: string;
  readonly head: string;
  readonly view: ViewIdentity | null;
  readonly supplementary: ReadonlyArray<{ readonly path: string; readonly bytes: number }>;
  readonly signal?: AbortSignal | undefined;
}

/** Preserve producer bytes, document, revision and failure reason; measure published architect bytes separately. */
export async function captureSnapshot(request: SnapshotRequest): Promise<MeasurementSnapshot> {
  const measurement = await readMeasurement(request.ramify, request.projectRoot, request.signal);
  const architect = await directoryBytes(join(request.projectRoot, architectViewDirectory));
  const supplementary = [...request.supplementary];
  if (architect !== null) supplementary.push({ path: architectViewDirectory, bytes: architect });
  return measurementSnapshotSchema.parse({
    schema: 'ramify-agent.measurement-snapshot/1', id: request.id, policy: scopeSizePolicy, head: request.head,
    measure: measurement.available
      ? { revision: measurement.document.revision, document: measurement.document, hash: createHash('sha256').update(measurement.raw).digest('hex') }
      : { unavailable: measurement.unavailable },
    view: request.view, supplementary,
  });
}

export function scopeSize(snapshot: MeasurementSnapshot, scope: DeclaredScope): ScopeSize {
  const components: ScopeComponent[] = [];
  const document = 'unavailable' in snapshot.measure ? null : (snapshot.measure.document as MeasurementDocument | null);
  const unavailable = 'unavailable' in snapshot.measure ? snapshot.measure.unavailable : null;
  if (document === null || !Array.isArray(document.modules)) {
    const reason = unavailable ?? 'the snapshot holds no measurement document';
    components.push({ component: 'owned-source', detail: 'selected exact owners and subtrees', bytes: null, state: 'unavailable', reason });
    components.push({ component: 'api-views', detail: 'declared ordinary and testing API-view areas', bytes: null, state: 'unavailable', reason });
  } else {
    const { selected, unresolved } = selectModules(document.modules, scope);
    components.push(ownedSource(selected, unresolved, document, scope));
    components.push(apiViews(selected, scope, document.views));
  }
  components.push(architectView(snapshot, scope));
  components.push(supportDocuments(snapshot, document, scope));
  const mismatch = snapshot.policy !== scopeSizePolicy ? `snapshot policy ${snapshot.policy} is not comparable with ${scopeSizePolicy}` : revisionMismatch(snapshot);
  if (mismatch !== null) {
    const selectsNothing = scope.exactOwners.length === 0 && scope.subtrees.length === 0 && (scope.locations ?? []).length === 0 && (scope.nestedProjects ?? []).length === 0;
    for (const [index, component] of components.entries()) {
      if (snapshot.policy === scopeSizePolicy && component.component === 'support-documents') continue;
      if (snapshot.policy === scopeSizePolicy && component.component === 'architect-view' && !scope.architectView) continue;
      if (snapshot.policy === scopeSizePolicy && component.component === 'api-views' && !scope.apiViews) continue;
      if (snapshot.policy === scopeSizePolicy && component.component === 'owned-source' && selectsNothing && component.state === 'measured') continue;
      components[index] = { ...component, bytes: null, buckets: {}, state: 'unavailable', reason: mismatch };
    }
  }
  const subtotal = components.reduce((total, component) => total + componentSubtotal(component), 0);
  const complete = components.every(component => component.state === 'measured');
  return scopeSizeSchema.parse({ policy: scopeSizePolicy, snapshot: snapshot.id, components, bytes: complete ? subtotal : null, subtotal, coverage: complete ? 'complete' : 'partial' });
}

export function componentSubtotal(component: ScopeComponent): number {
  return component.bytes ?? Object.values(component.buckets ?? {}).reduce((sum, bytes) => sum + bytes, 0);
}
export function projectOnlySize(size: ScopeSize): ScopeSize {
  const components = size.components.filter(component => component.component === 'owned-source' || component.component === 'api-views');
  const subtotal = components.reduce((sum, component) => sum + componentSubtotal(component), 0);
  const complete = components.every(component => component.state === 'measured');
  return { ...size, components, subtotal, bytes: complete ? subtotal : null, coverage: complete ? 'complete' : 'partial' };
}
export function revisionMismatch(snapshot: MeasurementSnapshot): string | null {
  if ('unavailable' in snapshot.measure || snapshot.view === null || snapshot.view.status !== 'materialized') return null;
  if (snapshot.measure.revision === snapshot.view.revision) return null;
  return `the measurement document is of revision ${snapshot.measure.revision} and the architect view of revision ${snapshot.view.revision}, so they describe two states whose numbers are not merged`;
}

type Selection = Array<{ module: ModuleMeasurement; bucket: 'exact' | 'subtree' }>;
function selectModules(modules: readonly ModuleMeasurement[], scope: DeclaredScope): { selected: Selection; unresolved: string[] } {
  const byId = new Map(modules.map(module => [module.id, module]));
  const roots = [...new Set(scope.subtrees)];
  const known = roots.filter(id => byId.has(id));
  const covering = known.filter(id => !known.some(other => other !== id && isDescendant(byId, id, other)));
  const covered = (id: string): boolean => covering.some(root => root === id || isDescendant(byId, id, root));
  const selected: Selection = [];
  for (const root of covering) selected.push({ module: byId.get(root)!, bucket: 'subtree' });
  for (const id of [...new Set(scope.exactOwners)]) {
    const module = byId.get(id);
    if (module !== undefined && !covered(id)) selected.push({ module, bucket: 'exact' });
  }
  const unresolved = [...new Set([...scope.subtrees, ...scope.exactOwners])].filter(id => !byId.has(id));
  return { selected, unresolved };
}
function isDescendant(byId: ReadonlyMap<string, ModuleMeasurement>, id: string, ancestor: string): boolean {
  let current = byId.get(id)?.parent ?? null;
  while (current !== null) {
    if (current === ancestor) return true;
    current = byId.get(current)?.parent ?? null;
  }
  return false;
}
function ownedSource(selected: Selection, unresolved: readonly string[], document: MeasurementDocument, scope: DeclaredScope): ScopeComponent {
  const buckets: Record<string, number> = { production: 0, tests: 0, documentation: 0 };
  for (const { module, bucket } of selected) {
    const measured = module[bucket];
    buckets.production! += measured.production.sourceBytes + measured.production.resourceBytes;
    buckets.tests! += measured.tests.sourceBytes + measured.tests.resourceBytes;
    buckets.documentation! += measured.documentation.bytes;
  }
  const notes = selected.map(entry => `${entry.module.id} (${entry.bucket})`);
  const byId = new Map(document.modules.map(entry => [entry.id, entry]));
  const held = (owner: string): boolean => selected.some(({ module, bucket }) => module.id === owner || (bucket === 'subtree' && isDescendant(byId, owner, module.id)));
  const counted = new Set<string>();
  const outside = new Set<string>();
  const unreadable: string[] = [];
  const outsideAggregateCovered = (path: string): boolean => (scope.locations ?? []).some(other =>
    other.path !== path && other.files === undefined && other.bytes !== null && path.startsWith(`${other.path.replace(/\/+$/, '')}/`) &&
    !document.files.some(file => file.path === other.path || file.path.startsWith(`${other.path.replace(/\/+$/, '')}/`)));
  for (const location of scope.locations ?? []) {
    const beneath = document.files.filter(file => file.path === location.path || file.path.startsWith(`${location.path.replace(/\/+$/, '')}/`));
    if (beneath.length > 0) {
      for (const file of beneath) {
        if (held(file.owner) || counted.has(file.path)) continue;
        counted.add(file.path);
        const bucket = file.area === 'ordinary' ? 'production' : file.area;
        buckets[bucket] = (buckets[bucket] ?? 0) + file.bytes;
      }
      notes.push(`${location.path} (extra)`);
    } else if (location.unreadable !== undefined) {
      unreadable.push(`${location.path}: ${location.unreadable}`);
      notes.push(`${location.path} (extra, unreadable when the invocation started)`);
    } else if (location.files === undefined && !outside.has(location.path) && !outsideAggregateCovered(location.path)) {
      outside.add(location.path);
      buckets['outside-inventory'] = (buckets['outside-inventory'] ?? 0) + (location.bytes ?? 0);
      notes.push(location.bytes === null ? `${location.path} (extra, absent when the invocation started)` : `${location.path} (extra, outside Ramify's inventory, bytes on disk)`);
    }
    for (const file of location.files ?? []) {
      if (counted.has(file.path) || document.files.some(entry => entry.path === file.path)) continue;
      counted.add(file.path);
      buckets['outside-inventory'] = (buckets['outside-inventory'] ?? 0) + file.bytes;
    }
  }
  for (const directory of scope.nestedProjects ?? []) notes.push(`${directory} (owned nested project, not inventoried by Ramify and outside the proxy, as in B)`);
  const bytes = Object.values(buckets).reduce((total, value) => total + value, 0);
  const detail = notes.length === 0 ? 'nothing selected' : notes.join(', ');
  if (unresolved.length > 0) return { component: 'owned-source', detail, bytes: null, state: 'unknown', reason: `no measured module for ${unresolved.join(', ')}; a module that does not exist yet has an unknown size, not a zero one`, buckets };
  if (unreadable.length > 0) return { component: 'owned-source', detail, bytes: null, state: 'unavailable', reason: `the bytes on disk of an extra location could not be read when the invocation started: ${unreadable.join('; ')}`, buckets };
  return { component: 'owned-source', detail, bytes, state: 'measured', buckets };
}
function apiViews(selected: Selection, scope: DeclaredScope, views: MeasurementDocument['views']): ScopeComponent {
  if (!scope.apiViews) return { component: 'api-views', detail: 'no API-view area is declared', bytes: 0, state: 'measured', buckets: { ordinary: 0, tests: 0 } };
  if (views !== 'measured') return { component: 'api-views', detail: 'declared ordinary and testing API-view areas', bytes: null, state: 'unavailable', reason: `ramify measure reported API views unavailable: ${views.reason}` };
  const buckets = { ordinary: 0, tests: 0 };
  const missing: string[] = [];
  for (const { module, bucket } of selected) {
    const measured = module[bucket];
    if (measured.views === undefined) { missing.push(module.id); continue; }
    buckets.ordinary += measured.views.ordinaryBytes;
    buckets.tests += measured.views.testsBytes;
  }
  if (missing.length > 0) return { component: 'api-views', detail: 'declared ordinary and testing API-view areas', bytes: null, state: 'unavailable', reason: `ramify measure omitted API-view bytes for ${missing.join(', ')}`, buckets };
  return { component: 'api-views', detail: 'each declared ordinary and testing area once, by owner and physical source area', bytes: buckets.ordinary + buckets.tests, state: 'measured', buckets };
}
function architectView(snapshot: MeasurementSnapshot, scope: DeclaredScope): ScopeComponent {
  if (!scope.architectView) return { component: 'architect-view', detail: 'the role\'s profile does not include the global view', bytes: 0, state: 'measured' };
  const published = snapshot.supplementary.find(entry => entry.path === architectViewDirectory);
  if (published === undefined) return { component: 'architect-view', detail: `${architectViewDirectory}/`, bytes: null, state: 'unavailable', reason: `${architectViewDirectory}/ was not published when the snapshot was taken, so its size is not known` };
  return { component: 'architect-view', detail: `${architectViewDirectory}/, at its publication size`, bytes: published.bytes, state: 'measured' };
}
function supportDocuments(snapshot: MeasurementSnapshot, document: MeasurementDocument | null, scope: DeclaredScope): ScopeComponent {
  const inventoried = new Set<string>();
  if (document !== null) {
    const { selected } = selectModules(document.modules, scope);
    const byId = new Map(document.modules.map(module => [module.id, module]));
    for (const file of document.files) {
      if (selected.some(({ module, bucket }) => module.id === file.owner || (bucket === 'subtree' && isDescendant(byId, file.owner, module.id))) ||
          (scope.locations ?? []).some(location => file.path === location.path || file.path.startsWith(`${location.path.replace(/\/+$/, '')}/`))) inventoried.add(file.path);
    }
    for (const location of scope.locations ?? []) for (const file of location.files ?? []) inventoried.add(file.path);
  }
  const named = [...new Set(scope.supportDocuments)].filter(path => path !== architectViewDirectory && !path.startsWith(`${architectViewDirectory}/`) && !inventoried.has(path));
  const captured = new Map<string, number>();
  for (const entry of snapshot.supplementary) if (!captured.has(entry.path)) captured.set(entry.path, entry.bytes);
  for (const file of document?.files ?? []) if (!captured.has(file.path)) captured.set(file.path, file.bytes);
  const missing = named.filter(path => !captured.has(path));
  const documents = named.filter(path => captured.has(path)).reduce((total, path) => total + captured.get(path)!, 0);
  const buckets = { documents, ...(scope.brief === undefined ? {} : { brief: scope.brief }) };
  const detail = [named.length === 0 ? 'none outside Ramify\'s inventory' : `${named.length} distinct documents: ${named.join(', ')}`, ...(scope.brief === undefined ? [] : ['the delivered brief'])].join('; ');
  if (missing.length > 0) return { component: 'support-documents', detail, bytes: null, state: 'unavailable', reason: `the snapshot captured no bytes for ${missing.join(', ')}`, buckets };
  return { component: 'support-documents', detail, bytes: documents + (scope.brief ?? 0), state: 'measured', buckets };
}
async function directoryBytes(directory: string): Promise<number | null> {
  const measured = await measuredDirectory(directory);
  return 'bytes' in measured ? measured.bytes : null;
}
async function measuredDirectory(directory: string): Promise<{ bytes: number } | { absent: true } | { unreadable: string }> {
  let entries;
  try { entries = await readdir(directory, { withFileTypes: true }); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { absent: true };
    return { unreadable: error instanceof Error ? error.message : String(error) };
  }
  let total = 0;
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      const nested = await measuredDirectory(path);
      if ('unreadable' in nested) return nested;
      if ('bytes' in nested) total += nested.bytes;
    } else if (entry.isFile()) total += (await stat(path)).size;
  }
  return { bytes: total };
}
export function rootModuleOfSnapshot(snapshot: MeasurementSnapshot): string | null {
  if ('unavailable' in snapshot.measure) return null;
  const modules = (snapshot.measure.document as { modules?: unknown } | null)?.modules;
  if (!Array.isArray(modules)) return null;
  for (const module of modules) {
    const entry = module as { id?: unknown; parent?: unknown };
    if (entry.parent === null && typeof entry.id === 'string') return entry.id;
  }
  return null;
}
