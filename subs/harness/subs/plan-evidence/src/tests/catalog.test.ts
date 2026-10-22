import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  acceptElements, contextNotice, createPackage, deviationNotice, elementCatalogHash, elementCatalogSchema, openElementCatalog,
  recommendationNotice, resolveCitations, reviseCatalog, serializeElementCatalog, submittedElementSchema,
  type ElementCatalog, type PackageDeviation, type SubmittedElement,
} from '../interfaces/catalog.js';
import { documentManifestSchema } from '../interfaces/contracts.js';

const hash = 'a'.repeat(64);
const document = (id: string, path: string, kind: 'plan' | 'principle') => ({
  id, path, kind, sha256: hash, bytes: 1, storedAt: `input/documents/${id}.bin`, revision: { commit: null, dirty: null },
});
const manifest = documentManifestSchema.parse({
  schema: 'ramify-agent.document-manifest/2', root: 'document:example-plan',
  documents: [document('document:example-plan', 'plans/example/plan.md', 'plan'), document('document:rules-principles', 'docs/model/rules.principles.md', 'principle')],
  missing: [], principlesScan: { status: 'complete', unreadable: [] },
});

const element = (key: string, kind: SubmittedElement['kind'], documentId: string, text: string): SubmittedElement =>
  ({ key, kind, document: documentId, text, conditions: [], uncertainty: '' });

/** A whole-section element: an example, its qualifications and a heading of its own, some 1,400 characters. */
const section = [
  'An exposure statement has this interpretation:',
  '',
  '```ramify',
  'expose-src placeOrder from "place-order.ts" to parent',
  'expose-sub * from pricing to descendants',
  '```',
  '',
  '## Qualifications',
  '',
  ...Array.from({ length: 12 }, (_, index) => `Qualification ${index + 1}: each selection keeps its original ownership and tags, and no destination is implied.`),
].join('\n');

function sampleCatalog(): ElementCatalog {
  const intake = acceptElements(openElementCatalog(hash, manifest), [
    element('draft:non-functional-requirement:keep-packages-bounded', 'non-functional', 'document:example-plan', 'Keep every package under the ledger line bound.'),
    element('draft:recommendation:prefer-pure-rendering', 'recommendation', 'document:example-plan', 'Prefer pure functions for rendering.'),
    element('draft:context:existing-prompt-quoting', 'context', 'document:example-plan', 'Today every prompt quotes the plan its own way.'),
  ]);
  if (!intake.ok) throw new Error(intake.errors.join('\n'));
  const principles = acceptElements(intake.catalog, [
    { ...element('draft:fixed-requirement:preserve-exposure', 'fixed', 'document:rules-principles', section), conditions: [
      { text: 'Only parent and descendants are destinations.', source: 'stated' },
      { text: 'Order has no effect.', source: 'inferred' },
    ], uncertainty: 'Whether wildcard rules belong here.' },
    element('draft:recommendation:watch-reexposure', 'recommendation', 'document:rules-principles', 'Beware of re-exposing a symbol without its companions.'),
  ]);
  if (!principles.ok) throw new Error(principles.errors.join('\n'));
  const architect = acceptElements(principles.catalog, [
    element('draft:functional-requirement:render-packages', 'functional', 'document:example-plan', 'Render packages from IDs.'),
    element('draft:functional-requirement:refuse-partial-package', 'functional', 'document:example-plan', 'Refuse a partial package.'),
  ]);
  if (!architect.ok) throw new Error(architect.errors.join('\n'));
  return architect.catalog;
}

const planDeviations: PackageDeviation[] = [
  { id: 'plan-deviation:render-with-deviations', amends: ['functional-requirement:render-packages'], authority: 'Recorded by the plan architect for work-item:render-packages.', text: 'Render packages from IDs and a deviation list.' },
  { id: 'plan-deviation:allow-large-package', amends: ['non-functional-requirement:keep-packages-bounded', 'functional-requirement:refuse-partial-package'], authority: 'Recorded by the plan architect for work-item:allow-large-package.', text: 'Allow up to 8 MiB.' },
];

describe('element catalog', () => {
  it('assigns IDs per kind in acceptance order and maps submission-local keys to them', () => {
    const catalog = sampleCatalog();
    expect(catalog.elements.map(item => item.id)).toEqual(['non-functional-requirement:keep-packages-bounded', 'recommendation:prefer-pure-rendering', 'context:existing-prompt-quoting', 'fixed-requirement:preserve-exposure', 'recommendation:watch-reexposure', 'functional-requirement:render-packages', 'functional-requirement:refuse-partial-package']);
    const more = acceptElements(catalog, [element('draft:functional-requirement:another-requirement', 'functional', 'document:example-plan', 'Another requirement.')]);
    expect(more.ok && [...more.ids]).toEqual([['draft:functional-requirement:another-requirement', 'functional-requirement:another-requirement']]);
    expect(elementCatalogSchema.safeParse(catalog).success).toBe(true);
  });

  it('never issues a retired ID again', () => {
    const catalog = sampleCatalog();
    const corrected = { ...catalog, elements: catalog.elements.filter(item => item.id !== 'functional-requirement:refuse-partial-package'), retired: ['functional-requirement:refuse-partial-package'] };
    const accepted = acceptElements(corrected, [element('draft:functional-requirement:split', 'functional', 'document:example-plan', 'Refuse a partial package.')]);
    expect(accepted.ok && accepted.ids.get('draft:functional-requirement:split')).toBe('functional-requirement:split');
    expect(acceptElements(corrected, [element('draft:functional-requirement:refuse-partial-package', 'functional', 'document:example-plan', 'Reused.')]).ok).toBe(false);
    expect(elementCatalogSchema.safeParse({ ...catalog, retired: ['functional-requirement:refuse-partial-package'] }).success).toBe(false);
  });

  it('revises a catalog: a rewrite keeps its ID, kind and document, a split retires the old ID and numbers past it', () => {
    const catalog = sampleCatalog();
    const revised = reviseCatalog(catalog, {
      rewrite: [{ id: 'non-functional-requirement:keep-packages-bounded', text: 'Keep every package under 1 MiB.', conditions: [], uncertainty: '' }],
      retire: ['functional-requirement:refuse-partial-package'],
      add: [element('draft:functional-requirement:refuse-partial-package-missing', 'functional', 'document:example-plan', 'Refuse a package with a missing ID.'),
        element('draft:functional-requirement:refuse-partial-package-partial', 'functional', 'document:example-plan', 'Never deliver a partial package.')],
      replacements: [{ retired: 'functional-requirement:refuse-partial-package', with: ['draft:functional-requirement:refuse-partial-package-missing', 'draft:functional-requirement:refuse-partial-package-partial'] }],
    });
    if (!revised.ok) throw new Error(revised.errors.join('\n'));
    expect(revised.catalog.elements.find(item => item.id === 'non-functional-requirement:keep-packages-bounded')).toMatchObject({ kind: 'non-functional', document: 'document:example-plan', text: 'Keep every package under 1 MiB.' });
    expect(revised.catalog.retired).toEqual(['functional-requirement:refuse-partial-package']);
    expect([...revised.ids]).toEqual([['draft:functional-requirement:refuse-partial-package-missing', 'functional-requirement:refuse-partial-package-missing'], ['draft:functional-requirement:refuse-partial-package-partial', 'functional-requirement:refuse-partial-package-partial']]);
    const refused = reviseCatalog(catalog, {
      rewrite: [{ id: 'functional-requirement:missing', text: 'x', conditions: [], uncertainty: '' }], retire: ['non-functional-requirement:keep-packages-bounded', 'non-functional-requirement:keep-packages-bounded'],
      add: [element('draft:fixed-requirement:bad', 'fixed', 'document:example-plan', 'A fixed requirement from a plan.')],
    });
    expect(refused.ok ? [] : refused.errors).toEqual(['rewrite.0.id: unknown element functional-requirement:missing', 'retire.1: non-functional-requirement:keep-packages-bounded is corrected twice']);
    const badAdd = reviseCatalog(catalog, { rewrite: [], retire: [], add: [element('draft:fixed-requirement:bad', 'fixed', 'document:example-plan', 'A fixed requirement from a plan.')] });
    expect(badAdd.ok ? [] : badAdd.errors).toEqual(['add.0.document: a fixed element cannot be read from a plan document (submitted key "draft:fixed-requirement:bad")']);
  });

  it('rejects an element whose document is not captured or cannot supply its kind, with its path', () => {
    const catalog = openElementCatalog(hash, manifest);
    const result = acceptElements(catalog, [
      element('draft:functional-requirement:a', 'functional', 'document:rules-principles', 'From a principle.'),
      element('draft:fixed-requirement:b', 'fixed', 'document:example-plan', 'From the plan.'),
      element('draft:non-functional-requirement:c', 'non-functional', 'document:rules-principles', 'From a principle.'),
      element('draft:recommendation:d', 'recommendation', 'document:unknown-source', 'Unknown document.'),
      element('draft:functional-requirement:a', 'recommendation', 'document:rules-principles', 'Duplicate key.'),
      element('draft:context:e', 'context', 'document:rules-principles', 'Rationale of a principle.'),
    ]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors).toEqual([
      '0.document: a functional element cannot be read from a principle document (submitted key "draft:functional-requirement:a")',
      '1.document: a fixed element cannot be read from a plan document (submitted key "draft:fixed-requirement:b")',
      '2.document: a non-functional element cannot be read from a principle document (submitted key "draft:non-functional-requirement:c")',
      '3.document: document:unknown-source is not a captured document (submitted key "draft:recommendation:d")',
      '4.key: a recommendation element requires draft:recommendation:<name> (submitted key "draft:functional-requirement:a")',
      '5.document: a context element cannot be read from a principle document (submitted key "draft:context:e")',
    ]);
  });

  it('parses each submitted element itself, so an ID-shaped key or empty text is an error with its path', () => {
    const result = acceptElements(sampleCatalog(), [
      element('functional-requirement:refuse-partial-package', 'functional', 'document:example-plan', 'Shadows an issued ID.'),
      element('draft:functional-requirement:empty', 'functional', 'document:example-plan', ''),
    ]);
    expect(result).toEqual({ ok: false, errors: [
      '0.key: a draft:<kind namespace>:<name> key is required (submitted key "functional-requirement:refuse-partial-package")',
      '0.key: a functional element requires draft:functional-requirement:<name> (submitted key "functional-requirement:refuse-partial-package")',
      '1.text: Too small: expected string to have >=1 characters (submitted key "draft:functional-requirement:empty")',
    ] });
  });

  it('keeps element text unbounded and free of byte facts, and refuses keys shaped like IDs', () => {
    expect(submittedElementSchema.safeParse({ ...element('draft:fixed-requirement:k', 'fixed', 'document:rules-principles', 'x'.repeat(20_000)) }).success).toBe(true);
    expect(submittedElementSchema.safeParse({ ...element('draft:fixed-requirement:k', 'fixed', 'document:rules-principles', 'x'), start: 0, end: 1 }).success).toBe(false);
    expect(submittedElementSchema.safeParse(element('functional-requirement:render-packages', 'functional', 'document:example-plan', 'x')).success).toBe(false);
  });

  it('resolves citations through submission keys and active IDs, rejecting unknown and retired ones with their paths', () => {
    const catalog = sampleCatalog();
    const elements = new Set(catalog.elements.map(item => item.id));
    expect(resolveCitations(['draft:functional-requirement:render-packages', 'fixed-requirement:preserve-exposure'], { keys: new Map([['draft:functional-requirement:render-packages', 'functional-requirement:render-packages']]), elements }, 'entries.0.requirementRefs'))
      .toEqual({ ok: true, ids: ['functional-requirement:render-packages', 'fixed-requirement:preserve-exposure'] });
    expect(resolveCitations(['functional-requirement:render-packages', 'functional-requirement:missing', 'draft:functional-requirement:render-packages'], { elements }, 'citedElements'))
      .toEqual({ ok: false, errors: ['citedElements.1: unknown element functional-requirement:missing', 'citedElements.2: unknown element draft:functional-requirement:render-packages'] });
    expect(resolveCitations(['draft:functional-requirement:stale-key'], { keys: new Map([['draft:functional-requirement:stale-key', 'functional-requirement:missing']]), elements }, 'citedElements'))
      .toEqual({ ok: false, errors: ['citedElements.0: unknown element draft:functional-requirement:stale-key'] });
  });

  it('serializes deterministically and hashes the serialized bytes', () => {
    const catalog = sampleCatalog();
    const reordered = elementCatalogSchema.parse(Object.fromEntries(Object.entries(catalog).reverse()));
    expect(serializeElementCatalog(reordered)).toBe(serializeElementCatalog(catalog));
    expect(elementCatalogHash(catalog)).toBe(createHash('sha256').update(serializeElementCatalog(catalog)).digest('hex'));
    expect(serializeElementCatalog(catalog).endsWith('}\n')).toBe(true);
  });
});

describe('createPackage', () => {
  it('renders the five kinds in order, context first and recommendations last with their fixed sentences, and each element whole', () => {
    const catalog = sampleCatalog();
    const result = createPackage({ catalog, planDeviations, elements: ['recommendation:watch-reexposure', 'functional-requirement:refuse-partial-package', 'fixed-requirement:preserve-exposure', 'non-functional-requirement:keep-packages-bounded', 'context:existing-prompt-quoting', 'recommendation:prefer-pure-rendering', 'functional-requirement:render-packages'], deviations: [] });
    if (!('text' in result)) throw new Error('unavailable');
    const { text } = result;
    const headings = text.split('\n').filter(line => line.startsWith('## '));
    expect(headings).toEqual(['## Context', '## Functional requirements', '## Non-functional requirements of the plan', '## Fixed requirements', '## Recommendations']);
    expect(text).toContain(`## Recommendations\n\n${recommendationNotice}\n\n### recommendation:prefer-pure-rendering: recommendation from plans/example/plan.md`);
    expect(text).toContain(`## Context\n\n${contextNotice}\n\n### context:existing-prompt-quoting: context from plans/example/plan.md`);
    expect(text.indexOf('### recommendation:prefer-pure-rendering')).toBeLessThan(text.indexOf('### recommendation:watch-reexposure'));
    expect(text).toContain(`Elements: context:existing-prompt-quoting, functional-requirement:render-packages, functional-requirement:refuse-partial-package, non-functional-requirement:keep-packages-bounded, fixed-requirement:preserve-exposure, recommendation:prefer-pure-rendering, recommendation:watch-reexposure\nDeviations: none\n`);
    expect(text).toContain(`Catalog: ${elementCatalogHash(catalog)}\n`);
    expect(text).toContain('### fixed-requirement:preserve-exposure: fixed requirement from docs/model/rules.principles.md');
    expect(text).toContain('Conditions:\n- stated: Only parent and descendants are destinations.\n- inferred: Order has no effect.');
    expect(text).toContain('Uncertainty: Whether wildcard rules belong here.');
    expect(text).toContain('Conditions: none recorded.\n\nUncertainty: none recorded.');
  });

  it('renders a 1,400-character element whole, with its own headings quoted', () => {
    expect(section.length).toBeGreaterThan(1_400);
    const result = createPackage({ catalog: sampleCatalog(), planDeviations, elements: ['fixed-requirement:preserve-exposure'], deviations: [] });
    if (!('text' in result)) throw new Error('unavailable');
    const quoted = result.text.split('\n').filter(line => line.startsWith('>')).map(line => line.replace(/^> ?/, '')).join('\n');
    expect(quoted).toBe(section);
    expect(result.text).toContain('> ## Qualifications');
  });

  it('gives the same bytes and hash for the same IDs, whatever their order or repetition', () => {
    const catalog = sampleCatalog();
    const first = createPackage({ catalog, planDeviations, elements: ['functional-requirement:render-packages', 'non-functional-requirement:keep-packages-bounded'], deviations: ['plan-deviation:allow-large-package', 'plan-deviation:render-with-deviations'] });
    const second = createPackage({ catalog, planDeviations, elements: ['non-functional-requirement:keep-packages-bounded', 'functional-requirement:render-packages', 'non-functional-requirement:keep-packages-bounded'], deviations: ['plan-deviation:render-with-deviations', 'plan-deviation:allow-large-package'] });
    expect(second).toEqual(first);
    if (!('text' in first)) throw new Error('unavailable');
    expect(first.hash).toBe(createHash('sha256').update(first.text).digest('hex'));
    expect(first.bytes).toBe(Buffer.byteLength(first.text));
  });

  it('is unavailable, never partial, when an element or deviation is missing, and names every missing ID', () => {
    const catalog = { ...sampleCatalog(), retired: ['functional-requirement:missing'] };
    expect(createPackage({ catalog, planDeviations, elements: ['functional-requirement:render-packages', 'functional-requirement:missing', 'non-functional-requirement:missing'], deviations: ['plan-deviation:render-with-deviations', 'plan-deviation:missing'] }))
      .toEqual({ unavailable: { missing: ['functional-requirement:missing', 'non-functional-requirement:missing', 'plan-deviation:missing'] } });
  });

  it('is unavailable when a named deviation amends an unknown element, and refuses malformed or duplicate deviations', () => {
    const amendsUnknown = [...planDeviations, { ...planDeviations[0]!, id: 'plan-deviation:unknown-amendment', amends: ['non-functional-requirement:unknown'] }];
    expect(createPackage({ catalog: sampleCatalog(), planDeviations: amendsUnknown, elements: ['functional-requirement:render-packages'], deviations: ['plan-deviation:unknown-amendment'] }))
      .toEqual({ unavailable: { missing: ['non-functional-requirement:unknown'] } });
    expect(() => createPackage({ catalog: sampleCatalog(), planDeviations: [...planDeviations, planDeviations[0]!], elements: [], deviations: [] }))
      .toThrow('Duplicate plan deviation ID');
    expect(() => createPackage({ catalog: sampleCatalog(), planDeviations: [{ ...planDeviations[0]!, authority: '' }], elements: [], deviations: [] }))
      .toThrow();
    expect(() => createPackage({ catalog: sampleCatalog(), planDeviations: [{ ...planDeviations[0]!, amends: ['context:existing-prompt-quoting'] }], elements: [], deviations: [] }))
      .toThrow('a deviation cannot amend context');
  });

  it('renders only the named deviations, after the elements, in recorded order', () => {
    const result = createPackage({ catalog: sampleCatalog(), planDeviations, elements: ['functional-requirement:render-packages', 'recommendation:prefer-pure-rendering'], deviations: ['plan-deviation:allow-large-package'] });
    if (!('text' in result)) throw new Error('unavailable');
    expect(result.text).not.toContain('plan-deviation:render-with-deviations');
    expect(result.text.indexOf('## Plan deviations')).toBeGreaterThan(result.text.indexOf('### recommendation:prefer-pure-rendering'));
    expect(result.text.endsWith([
      '## Plan deviations', '', deviationNotice, '',
      '### plan-deviation:allow-large-package amends non-functional-requirement:keep-packages-bounded, functional-requirement:refuse-partial-package', '', 'Authority: Recorded by the plan architect for work-item:allow-large-package.', '', '> Allow up to 8 MiB.', '',
    ].join('\n'))).toBe(true);
  });

  it('never renders a locator', () => {
    const catalog = sampleCatalog();
    const located = { ...catalog, elements: catalog.elements.map(item => ({ ...item, locator: 'Section: Constraints' })) };
    const result = createPackage({ catalog: located, planDeviations: [], elements: ['non-functional-requirement:keep-packages-bounded'], deviations: [] });
    expect('text' in result && result.text.includes('Constraints')).toBe(false);
  });
});
