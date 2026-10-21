import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { DocumentManifest, IdentityContract } from './contracts.js';
export type { IdentityContract } from './contracts.js';

/*
 * The element catalog of Plan 14 and its one package creator. An element is
 * one requirement, one recommendation or one passage of plan context, as the
 * extracting agent read it from a captured document. Nothing here compares element text with the
 * captured bytes: the reading is an agent's, and only IDs, the frozen
 * catalog and the rendering are exact.
 */

const text = z.string().min(1);
const sha256 = z.string().regex(/^[0-9a-f]{64}$/);
const documentId = z.string().regex(/^(?:doc-\d{3,}|document:[a-z0-9]+(?:-[a-z0-9]+)*)$/);

/** The five kinds, in the order a package renders them. */
export const elementKinds = ['context', 'functional', 'non-functional', 'fixed', 'recommendation'] as const;
export type ElementKind = typeof elementKinds[number];

/** The ID prefix of each kind. */
export const elementPrefixes = {
  context: 'ctx', functional: 'fr', 'non-functional': 'nfr', fixed: 'fix', recommendation: 'rec',
} as const satisfies Record<ElementKind, string>;
export const descriptiveElementNamespaces = {
  context: 'context', functional: 'functional-requirement', 'non-functional': 'non-functional-requirement',
  fixed: 'fixed-requirement', recommendation: 'recommendation',
} as const satisfies Record<ElementKind, string>;
const descriptiveElementId = /^(?:context|functional-requirement|non-functional-requirement|fixed-requirement|recommendation):[a-z0-9]+(?:-[a-z0-9]+)*$/;
const draftElementKey = /^draft:(?:context|functional-requirement|non-functional-requirement|fixed-requirement|recommendation):[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const descriptiveElementIdSchema = z.string().regex(descriptiveElementId);

/** The captured document kinds an element of each kind may be read from. */
const elementSources: Record<ElementKind, readonly ('plan' | 'principle')[]> = {
  context: ['plan'], functional: ['plan'], 'non-functional': ['plan'], fixed: ['principle'], recommendation: ['plan', 'principle'],
};

export const elementIdSchema = z.string().refine(id => /^(ctx|fr|nfr|fix|rec)-\d{3,}$/.test(id) || descriptiveElementId.test(id), 'an element ID is required');
export const planDeviationIdSchema = z.string().regex(/^(?:pd-\d{3,}|plan-deviation:[a-z0-9]+(?:-[a-z0-9]+)*)$/);

export const elementConditionSchema = z.object({ text, source: z.enum(['stated', 'inferred']) }).strict();

const elementBodySchema = z.object({
  kind: z.enum(elementKinds),
  /** The captured document the element was read from. */
  document: documentId,
  /** The requirement as its source states it, as closely as the agent found practical; no size bound. */
  text,
  conditions: z.array(elementConditionSchema),
  /** The extracting agent's uncertainty; may be empty. */
  uncertainty: z.string(),
  /** Written for a person; never resolved and never rendered into a package. */
  locator: text.optional(),
}).strict();

export const catalogElementSchema = elementBodySchema.extend({ id: elementIdSchema }).strict().superRefine((element, ctx) => {
  if (!element.id.startsWith(`${elementPrefixes[element.kind]}-`) && !element.id.startsWith(`${descriptiveElementNamespaces[element.kind]}:`)) {
    ctx.addIssue({ code: 'custom', path: ['id'], message: 'ID prefix disagrees with kind' });
  }
});
export type CatalogElement = z.infer<typeof catalogElementSchema>;

/**
 * What an extracting agent submits. The key names the element within its
 * own submission only; the harness assigns the ID on acceptance.
 */
export const submittedElementSchema = elementBodySchema.extend({
  key: text.refine(key => !elementIdSchema.safeParse(key).success, 'a submission-local key cannot take the form of an element ID'),
}).strict();
export type SubmittedElement = z.infer<typeof submittedElementSchema>;
export const descriptiveSubmittedElementSchema = elementBodySchema.extend({
  key: z.string().regex(draftElementKey, 'a draft:<kind namespace>:<name> key is required'),
}).strict().superRefine((element, ctx) => {
  if (!element.key.startsWith(`draft:${descriptiveElementNamespaces[element.kind]}:`))
    ctx.addIssue({ code: 'custom', path: ['key'], message: `a ${element.kind} element requires draft:${descriptiveElementNamespaces[element.kind]}:<name>` });
});

/** The captured documents elements may name, with the path a package renders. */
export const catalogDocumentSchema = z.object({ id: documentId, path: text, kind: z.enum(['plan', 'principle']) }).strict();

export const elementCatalogSchema = z.object({
  schema: z.enum(['ramify-agent.element-catalog/1', 'ramify-agent.element-catalog/2']),
  /** The SHA-256 of the captured document manifest the elements were read from. */
  manifestHash: sha256,
  documents: z.array(catalogDocumentSchema).min(1),
  elements: z.array(catalogElementSchema),
  /** IDs a correction retired; never issued again and never rendered. */
  retired: z.array(elementIdSchema),
  /** Descriptive correction lineage; omitted on historical catalogs. */
  replacements: z.array(z.object({ retired: elementIdSchema, with: z.array(elementIdSchema).min(1) }).strict()).optional(),
}).strict().superRefine((catalog, ctx) => {
  const descriptive = catalog.schema.endsWith('/2');
  const documents = new Map(catalog.documents.map(document => [document.id, document]));
  catalog.documents.forEach((document, index) => {
    if (descriptive !== document.id.startsWith('document:')) ctx.addIssue({ code: 'custom', path: ['documents', index, 'id'], message: 'document ID disagrees with catalog contract' });
  });
  const ids = new Set<string>();
  catalog.elements.forEach((element, index) => {
    if (descriptive !== descriptiveElementId.test(element.id)) ctx.addIssue({ code: 'custom', path: ['elements', index, 'id'], message: 'element ID disagrees with catalog contract' });
    if (ids.has(element.id)) ctx.addIssue({ code: 'custom', path: ['elements', index, 'id'], message: 'duplicate element ID' });
    ids.add(element.id);
    const problem = documentProblem(element, documents);
    if (problem) ctx.addIssue({ code: 'custom', path: ['elements', index, 'document'], message: problem });
  });
  catalog.retired.forEach((id, index) => {
    if (descriptive !== descriptiveElementId.test(id)) ctx.addIssue({ code: 'custom', path: ['retired', index], message: 'retired ID disagrees with catalog contract' });
    if (ids.has(id)) ctx.addIssue({ code: 'custom', path: ['retired', index], message: 'duplicate or active retired ID' });
    ids.add(id);
  });
  const retiredSet = new Set(catalog.retired);
  const lineage = new Set<string>();
  catalog.replacements?.forEach((relationship, index) => {
    if (lineage.has(relationship.retired)) ctx.addIssue({ code: 'custom', path: ['replacements', index, 'retired'], message: 'retired ID has multiple replacement relationships' });
    lineage.add(relationship.retired);
    if (!retiredSet.has(relationship.retired)) ctx.addIssue({ code: 'custom', path: ['replacements', index, 'retired'], message: 'replacement source is not retired' });
    relationship.with.forEach((id, replacementIndex) => {
      if (!ids.has(id) || id === relationship.retired) ctx.addIssue({ code: 'custom', path: ['replacements', index, 'with', replacementIndex], message: 'replacement must be a distinct issued element' });
    });
  });
});
export type ElementCatalog = z.infer<typeof elementCatalogSchema>;

function documentProblem(
  element: { readonly kind: ElementKind; readonly document: string },
  documents: ReadonlyMap<string, { readonly kind: 'plan' | 'principle' }>,
): string | undefined {
  const document = documents.get(element.document);
  if (document === undefined) return `${element.document} is not a captured document`;
  if (!elementSources[element.kind].includes(document.kind)) {
    return `a ${element.kind} element cannot be read from a ${document.kind} document`;
  }
  return undefined;
}

/** An empty catalog over a run's captured documents, before the first extraction is accepted. */
export function openElementCatalog(manifestHash: string, manifest: DocumentManifest, identityContract: IdentityContract = 'legacy'): ElementCatalog {
  if (identityContract === 'descriptive' !== manifest.schema.endsWith('/2')) throw new Error('Document manifest and catalog identity contracts disagree');
  return elementCatalogSchema.parse({
    schema: identityContract === 'legacy' ? 'ramify-agent.element-catalog/1' : 'ramify-agent.element-catalog/2', manifestHash,
    documents: manifest.documents.map(({ id, path, kind }) => ({ id, path, kind })),
    elements: [], retired: [],
  });
}

export type ElementAcceptance =
  | { readonly ok: true; readonly catalog: ElementCatalog; readonly ids: ReadonlyMap<string, string> }
  | { readonly ok: false; readonly errors: readonly string[] };

/**
 * Accept one submission's elements: IDs continue each kind's numbering past
 * every issued or retired ID, in submission order, and the returned map
 * rewrites the submission's local keys to them. Each element is parsed
 * here, and errors name the submitted element's key. Optional reference lists
 * are checked against submitted keys/active IDs before assigning any ID.
 */
export function acceptElements(catalog: ElementCatalog, submission: readonly unknown[], references: readonly ElementReferenceList[] = []): ElementAcceptance {
  const descriptive = catalog.schema.endsWith('/2');
  const errors: string[] = [];
  const documents = new Map(catalog.documents.map(document => [document.id, document]));
  const keys = new Set<string>();
  const submitted: SubmittedElement[] = [];
  submission.forEach((candidate, index) => {
    const parsed = submittedElementSchema.safeParse(candidate);
    const key = typeof candidate === 'object' && candidate !== null && 'key' in candidate && typeof candidate.key === 'string' ? candidate.key : null;
    const named = key === null ? '' : ` (submitted key ${JSON.stringify(key)})`;
    if (!parsed.success) {
      errors.push(...parsed.error.issues.map(issue => `${[index, ...issue.path].join('.')}: ${issue.message}${named}`));
      return;
    }
    const element = parsed.data;
    submitted.push(element);
    if (descriptive && (!draftElementKey.test(element.key) || !element.key.startsWith(`draft:${descriptiveElementNamespaces[element.kind]}:`))) {
      errors.push(`${index}.key: ${JSON.stringify(element.key)} must be a draft:${descriptiveElementNamespaces[element.kind]}:<name> key`);
    }
    if (keys.has(element.key)) errors.push(`${index}.key: duplicate submission-local key ${element.key}`);
    keys.add(element.key);
    const problem = documentProblem(element, documents);
    if (problem) errors.push(`${index}.document: ${problem}${named}`);
  });
  errors.push(...validateElementReferences(references, catalog, submitted));
  if (descriptive) {
    const existing = new Set([...catalog.elements.map(element => element.id), ...catalog.retired]);
    const proposed = new Set<string>();
    submitted.forEach((element, index) => {
      const id = element.key.slice('draft:'.length);
      if (existing.has(id)) errors.push(`${index}.key: ${JSON.stringify(element.key)} collides with accepted or retired ${id}; choose a meaningful qualifier`);
      if (proposed.has(id)) errors.push(`${index}.key: ${JSON.stringify(element.key)} duplicates another proposal in this submission`);
      proposed.add(id);
    });
  }
  if (errors.length > 0) return { ok: false, errors };
  const next = new Map(elementKinds.map(kind => [kind, highestNumber(catalog, kind) + 1]));
  const ids = new Map<string, string>();
  const accepted = submitted.map(({ key, ...body }) => {
    const number = next.get(body.kind)!;
    next.set(body.kind, number + 1);
    const id = descriptive ? key.slice('draft:'.length) : `${elementPrefixes[body.kind]}-${String(number).padStart(3, '0')}`;
    ids.set(key, id);
    return { id, ...body };
  });
  return { ok: true, catalog: elementCatalogSchema.parse({ ...catalog, elements: [...catalog.elements, ...accepted] }), ids };
}

/** A corrected reading of one element: its ID, kind and document stay. */
export const elementRewriteSchema = elementBodySchema.omit({ kind: true, document: true }).extend({ id: elementIdSchema }).strict();
export type ElementRewrite = z.infer<typeof elementRewriteSchema>;

export interface CatalogRevision {
  readonly rewrite: readonly ElementRewrite[];
  /** Elements a split or merge replaces: removed, retired and never issued again. */
  readonly retire: readonly string[];
  /** For descriptive catalogs, one relationship per retired ID; values are new local keys or retained IDs. */
  readonly replacements?: readonly { readonly retired: string; readonly with: readonly string[] }[];
  /** New elements, keyed like any submission, numbered past the retired IDs. */
  readonly add: readonly unknown[];
  /** Re-citations checked against retained elements and new local keys before any new IDs. */
  readonly references?: readonly ElementReferenceList[];
}

/**
 * Correct a catalog before it is frozen: rewrite readings in place, retire
 * the elements a split or merge replaces, and add elements. Errors carry the
 * revision's paths (`rewrite.<i>`, `retire.<i>`, `add.<i>`), and nothing
 * changes on an error. Reference errors retain their caller-supplied path.
 */
export function reviseCatalog(catalog: ElementCatalog, revision: CatalogRevision): ElementAcceptance {
  const errors: string[] = [];
  const active = new Map(catalog.elements.map(element => [element.id, element]));
  const touched = new Set<string>();
  const rewritten = new Map<string, CatalogElement>();
  revision.rewrite.forEach((candidate, index) => {
    const parsed = elementRewriteSchema.safeParse(candidate);
    if (!parsed.success) {
      errors.push(...parsed.error.issues.map(issue => `${['rewrite', index, ...issue.path].join('.')}: ${issue.message}`));
      return;
    }
    const element = active.get(parsed.data.id);
    if (element === undefined) errors.push(`rewrite.${index}.id: unknown element ${parsed.data.id}`);
    else if (touched.has(element.id)) errors.push(`rewrite.${index}.id: ${element.id} is corrected twice`);
    else rewritten.set(element.id, { ...parsed.data, kind: element.kind, document: element.document });
    touched.add(parsed.data.id);
  });
  revision.retire.forEach((id, index) => {
    if (!active.has(id)) errors.push(`retire.${index}: unknown element ${id}`);
    else if (touched.has(id)) errors.push(`retire.${index}: ${id} is corrected twice`);
    touched.add(id);
  });
  if (errors.length > 0) return { ok: false, errors };
  const retired = new Set(revision.retire);
  const corrected = elementCatalogSchema.safeParse({
    ...catalog,
    elements: catalog.elements.filter(element => !retired.has(element.id)).map(element => rewritten.get(element.id) ?? element),
    retired: [...catalog.retired, ...revision.retire],
  });
  // The new relationships are checked only after their new elements have names.
  const interim = catalog.schema.endsWith('/2') && revision.retire.length > 0
    ? { ...catalog, elements: catalog.elements.filter(element => !retired.has(element.id)).map(element => rewritten.get(element.id) ?? element), retired: [...catalog.retired, ...revision.retire] }
    : corrected.success ? corrected.data : undefined;
  if (!interim) return { ok: false, errors: corrected.success ? ['catalog correction is invalid'] : corrected.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`) };
  const added = acceptElements(interim, revision.add, revision.references);
  if (!added.ok) return { ok: false, errors: added.errors.map(error => /^\d+(?:\.|:)/.test(error) ? `add.${error}` : error) };
  if (!catalog.schema.endsWith('/2')) return added;
  const relationships = revision.replacements ?? [];
  const relationshipErrors: string[] = [];
  for (const [index, id] of revision.retire.entries()) {
    if (relationships.filter(item => item.retired === id).length !== 1) relationshipErrors.push(`replacements.${index}: retired ${id} requires exactly one replacement relationship`);
  }
  for (const [index, relationship] of relationships.entries()) {
    if (!retired.has(relationship.retired)) relationshipErrors.push(`replacements.${index}.retired: ${relationship.retired} is not retired by this correction`);
  }
  const resolved = relationships.map(relationship => ({ retired: relationship.retired,
    with: relationship.with.map(id => added.ids.get(id) ?? id) }));
  const completed = elementCatalogSchema.safeParse({ ...added.catalog, replacements: [...(catalog.replacements ?? []), ...resolved] });
  if (!completed.success) relationshipErrors.push(...completed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`));
  if (relationshipErrors.length > 0 || !completed.success) return { ok: false, errors: relationshipErrors };
  return { ...added, catalog: completed.data };
}

function highestNumber(catalog: ElementCatalog, kind: ElementKind): number {
  const prefix = `${elementPrefixes[kind]}-`;
  return [...catalog.elements.map(element => element.id), ...catalog.retired]
    .filter(id => id.startsWith(prefix))
    .reduce((highest, id) => Math.max(highest, Number(id.slice(prefix.length))), 0);
}

/** A caller's citation field and its mechanically permitted element kinds. */
export interface ElementReferenceList {
  readonly path: string;
  readonly citations: readonly string[];
  readonly allowedKinds: readonly ElementKind[];
  /** Descriptive contracts distinguish same-submission keys from accepted IDs. */
  readonly stage?: 'draft' | 'accepted' | 'mixed';
}

/** Validate local keys/active IDs in their submitted terms, before assigning any IDs. */
export function validateElementReferences(
  references: readonly ElementReferenceList[],
  catalog: ElementCatalog,
  submitted: readonly Pick<SubmittedElement, 'key' | 'kind'>[] = [],
): string[] {
  const kinds = new Map<string, ElementKind>(catalog.elements.map(element => [element.id, element.kind]));
  for (const element of submitted) kinds.set(element.key, element.kind);
  return references.flatMap(field => field.citations.flatMap((citation, index) => {
    const kind = kinds.get(citation);
    const at = `${field.path}.${index}`;
    if (catalog.schema.endsWith('/2')) {
      const expected = field.allowedKinds.map(item => descriptiveElementNamespaces[item]).join(' or ');
      const stage = field.stage ?? 'mixed';
      const isDraft = citation.startsWith('draft:');
      if (stage === 'draft' && !isDraft) return [`${at}: ${JSON.stringify(citation)} is an accepted ID or wrong-stage reference; this field requires a local draft:${expected}:<name> key from this submission`];
      if (stage === 'accepted' && isDraft) return [`${at}: ${JSON.stringify(citation)} is a draft key; this field requires an accepted ${expected}:<name> ID from this run's catalog`];
      if (kind === undefined) {
        const retired = catalog.retired.includes(citation);
        return [`${at}: ${JSON.stringify(citation)} is ${retired ? 'retired' : 'unknown or foreign to this run'}; this field requires ${stage === 'draft' ? 'a key from this submission' : 'an active reference from this run catalog'} in ${expected}`];
      }
      if (!field.allowedKinds.includes(kind)) return [`${at}: ${JSON.stringify(citation)} is ${descriptiveElementNamespaces[kind]}; this field requires ${expected} from ${isDraft ? 'this submission' : 'this run catalog'}`];
      return [];
    }
    if (kind === undefined) return [`${at}: unknown element reference ${JSON.stringify(citation)}`];
    if (!field.allowedKinds.includes(kind)) return [`${at}: reference ${JSON.stringify(citation)} is ${kind}; expected ${field.allowedKinds.join(' or ') || 'no element kinds'}`];
    return [];
  }));
}

/**
 * Resolve citations to element IDs. A citation is a key of the citing
 * submission, rewritten through `keys`, or an ID among `elements`; anything
 * else, including a retired ID, is rejected with its path.
 */
export function resolveCitations(
  citations: readonly string[],
  scope: { readonly keys?: ReadonlyMap<string, string>; readonly elements: ReadonlySet<string> },
  path: string,
): { readonly ok: true; readonly ids: readonly string[] } | { readonly ok: false; readonly errors: readonly string[] } {
  const errors: string[] = [];
  const ids = citations.map((citation, index) => {
    const id = scope.keys?.get(citation) ?? (scope.elements.has(citation) ? citation : undefined);
    if (id === undefined || !scope.elements.has(id)) errors.push(`${path}.${index}: unknown element ${citation}`);
    return id ?? citation;
  });
  return errors.length > 0 ? { ok: false, errors } : { ok: true, ids };
}

/** The bytes the harness writes as `analysis/catalog.json`: sorted keys, one trailing newline. */
export function serializeElementCatalog(catalog: ElementCatalog): string {
  return `${canonical(catalog)}\n`;
}

/** The catalog's identity for the run: the SHA-256 of its serialized bytes. */
export function elementCatalogHash(catalog: ElementCatalog): string {
  return createHash('sha256').update(serializeElementCatalog(catalog)).digest('hex');
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, item]) => item !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

/**
 * A plan deviation as a package renders it. The harness owns deviation
 * records and supplies this view of them; the text is the amended
 * requirement, read under the deviation's own authority.
 */
export const packageDeviationSchema = z.object({
  id: planDeviationIdSchema,
  /** Requirements and recommendations only; context states no requirement to amend. */
  amends: z.array(elementIdSchema.refine(id => !id.startsWith('ctx-'), 'a deviation cannot amend context')).min(1),
  /** Who recorded the deviation and for what, for example the plan architect for a work item. */
  authority: text,
  text,
}).strict();
export type PackageDeviation = z.infer<typeof packageDeviationSchema>;

/**
 * What a record that cites a package holds: the element and deviation IDs it
 * renders from and the hash of the text they rendered to when it was
 * written. There is no package store; every delivery renders again.
 */
export const packageCitationSchema = z.object({
  elements: z.array(elementIdSchema),
  deviations: z.array(planDeviationIdSchema),
  hash: sha256,
}).strict();
export type PackageCitation = z.infer<typeof packageCitationSchema>;

export interface PackageRequest {
  readonly catalog: ElementCatalog;
  /** Every plan deviation of the run, in recorded order; only the named ones are rendered. */
  readonly planDeviations: readonly PackageDeviation[];
  readonly elements: readonly string[];
  readonly deviations: readonly string[];
}

export type Package =
  | { readonly text: string; readonly hash: string; readonly bytes: number }
  | { readonly unavailable: { readonly missing: readonly string[] } };

const kindHeadings: Record<ElementKind, string> = {
  context: 'Context',
  functional: 'Functional requirements',
  'non-functional': 'Non-functional requirements of the plan',
  fixed: 'Fixed requirements',
  recommendation: 'Recommendations',
};

const kindLabels: Record<ElementKind, string> = {
  context: 'context',
  functional: 'functional requirement',
  'non-functional': 'non-functional requirement of the plan',
  fixed: 'fixed requirement',
  recommendation: 'recommendation',
};

/** The fixed sentence under the context heading. */
export const contextNotice = 'Context describes the situation the plan starts from and why the plan exists. It is not a requirement, and nothing assesses it.';

/** The fixed sentence under the recommendations heading. */
export const recommendationNotice = 'Recommendations are not requirements: nothing assesses them, and a departure from one is reported in your result, not justified.';

/** The fixed sentence under the plan deviations heading. */
export const deviationNotice = 'Each plan deviation amends the elements it names for the rest of this run, under its own authority; the elements above are unchanged.';

/**
 * Render elements and plan deviations into one package. Elements appear by
 * kind, context first and recommendations last, in catalog order within a
 * kind, whole; the named deviations follow
 * in recorded order. The request's order and repetitions do not change the
 * bytes. A missing ID, including an amended element the catalog does not
 * hold, makes the whole package unavailable; an amended element may lie
 * outside the package. Malformed or duplicate deviations are a
 * caller defect and throw.
 */
export function createPackage(request: PackageRequest): Package {
  const { catalog } = request;
  const recorded = z.array(packageDeviationSchema).parse(request.planDeviations);
  if (new Set(recorded.map(deviation => deviation.id)).size !== recorded.length) throw new Error('Duplicate plan deviation ID');
  const requested = new Set(request.elements);
  const named = new Set(request.deviations);
  const elements = catalog.elements.filter(element => requested.has(element.id));
  const deviations = recorded.filter(deviation => named.has(deviation.id));
  const active = new Set(catalog.elements.map(element => element.id));
  const missing = [
    ...[...requested].filter(id => !elements.some(element => element.id === id)),
    ...[...named].filter(id => !deviations.some(deviation => deviation.id === id)),
    ...new Set(deviations.flatMap(deviation => deviation.amends).filter(id => !active.has(id) && !requested.has(id))),
  ];
  if (missing.length > 0) return { unavailable: { missing } };

  const paths = new Map(catalog.documents.map(document => [document.id, document.path]));
  const ordered = elementKinds.flatMap(kind => elements.filter(element => element.kind === kind));
  const lines = [
    '# Plan context package',
    '',
    `Catalog: ${elementCatalogHash(catalog)}`,
    `Elements: ${list(ordered.map(element => element.id))}`,
    `Deviations: ${list(deviations.map(deviation => deviation.id))}`,
  ];
  for (const kind of elementKinds) {
    const ofKind = ordered.filter(element => element.kind === kind);
    if (ofKind.length === 0) continue;
    lines.push('', `## ${kindHeadings[kind]}`);
    if (kind === 'context') lines.push('', contextNotice);
    if (kind === 'recommendation') lines.push('', recommendationNotice);
    for (const element of ofKind) {
      lines.push('', `### ${element.id}: ${kindLabels[kind]} from ${paths.get(element.document)!}`, '', quote(element.text), '');
      if (element.conditions.length === 0) lines.push('Conditions: none recorded.');
      else lines.push('Conditions:', ...element.conditions.map(condition => `- ${condition.source}: ${indent(condition.text)}`));
      lines.push('', `Uncertainty: ${element.uncertainty.trim() === '' ? 'none recorded.' : indent(element.uncertainty)}`);
    }
  }
  if (deviations.length > 0) {
    lines.push('', '## Plan deviations', '', deviationNotice);
    for (const deviation of deviations) {
      lines.push('', `### ${deviation.id} amends ${deviation.amends.join(', ')}`, '', `Authority: ${indent(deviation.authority)}`, '', quote(deviation.text));
    }
  }
  const body = `${lines.join('\n')}\n`;
  return { text: body, hash: createHash('sha256').update(body).digest('hex'), bytes: new TextEncoder().encode(body).length };
}

function list(ids: readonly string[]): string {
  return ids.length === 0 ? 'none' : ids.join(', ');
}

/** Quote source text line by line so its own headings cannot read as package structure. */
function quote(value: string): string {
  return value.split('\n').map(line => (line === '' ? '>' : `> ${line}`)).join('\n');
}

function indent(value: string): string {
  return value.split('\n').join('\n  ');
}
