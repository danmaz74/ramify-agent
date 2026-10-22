import { describe, expect, test } from 'vitest';
import { acceptElements, openElementCatalog, reviseCatalog, serializeElementCatalog, validateElementReferences, type ElementReferenceList, type SubmittedElement } from '../interfaces/catalog.js';
import { documentManifestSchema } from '../interfaces/contracts.js';

const hash = 'a'.repeat(64);
const manifest = documentManifestSchema.parse({ schema: 'ramify-agent.document-manifest/2', root: 'document:example-plan', documents: [
  { id: 'document:example-plan', path: 'plans/example/plan.md', kind: 'plan', sha256: hash, bytes: 1, storedAt: 'input/documents/document:example-plan.bin', revision: { commit: null, dirty: null } },
], missing: [], principlesScan: { status: 'empty', unreadable: [] } });
const element = (key: string, kind: SubmittedElement['kind'] = 'functional'): SubmittedElement => ({ key, kind, document: 'document:example-plan', text: `Requirement ${key}`, conditions: [], uncertainty: '' });
const field = (citations: readonly string[], allowedKinds: ElementReferenceList['allowedKinds'] = ['functional']): ElementReferenceList => ({ path: 'entries.cap-a.requirementRefs', citations, allowedKinds });

describe('Plan 23 C01/C02 catalog local-key validation', () => {
  test('missing and wrong-kind references name submitted keys before IDs are allocated; retry keeps the same next ID', () => {
    const catalog = openElementCatalog(hash, manifest); const before = serializeElementCatalog(catalog);
    const rejected = acceptElements(catalog, [element('draft:functional-requirement:req-a'), element('draft:context:hyp-a', 'context')], [field(['draft:functional-requirement:req-a', 'draft:functional-requirement:missing-key', 'draft:context:hyp-a'])]);
    expect(rejected).toEqual({ ok: false, errors: [
      'entries.cap-a.requirementRefs.1: "draft:functional-requirement:missing-key" is unknown or foreign to this run; this field requires an active reference from this run catalog in functional-requirement',
      'entries.cap-a.requirementRefs.2: "draft:context:hyp-a" is context; this field requires functional-requirement from this submission',
    ] });
    expect(serializeElementCatalog(catalog)).toBe(before);
    const retry = acceptElements(catalog, [element('draft:functional-requirement:req-a'), element('draft:context:hyp-a', 'context')], [field(['draft:functional-requirement:req-a']), field(['draft:context:hyp-a'], ['context'])]);
    expect(retry.ok && [...retry.ids]).toEqual([['draft:functional-requirement:req-a', 'functional-requirement:req-a'], ['draft:context:hyp-a', 'context:hyp-a']]);
    expect(retry).toEqual(acceptElements(catalog, [element('draft:functional-requirement:req-a'), element('draft:context:hyp-a', 'context')], [field(['draft:functional-requirement:req-a']), field(['draft:context:hyp-a'], ['context'])]));
  });
  test('duplicate and malformed submitted elements identify their original keys and leave issued IDs untouched', () => {
    const catalog = openElementCatalog(hash, manifest);
    const duplicate = acceptElements(catalog, [element('draft:functional-requirement:cap-a'), element('draft:functional-requirement:cap-a')]);
    expect(duplicate).toEqual({ ok: false, errors: ['1.key: duplicate submission-local key draft:functional-requirement:cap-a', '1.key: "draft:functional-requirement:cap-a" duplicates another proposal in this submission'] });
    const invalid = acceptElements(catalog, [{ ...element('draft:functional-requirement:req-a'), text: '' }]);
    expect(invalid.ok ? [] : invalid.errors).toEqual(['0.text: Too small: expected string to have >=1 characters (submitted key "draft:functional-requirement:req-a")']);
    expect(acceptElements(catalog, [element('draft:functional-requirement:cap-a')])).toMatchObject({ ok: true, ids: new Map([['draft:functional-requirement:cap-a', 'functional-requirement:cap-a']]) });
    expect(catalog.elements).toEqual([]);
  });
  test('revision references reject retired IDs/new wrong-kind keys atomically and retry does not advance IDs', () => {
    const initial = acceptElements(openElementCatalog(hash, manifest), [element('draft:functional-requirement:req-a')]); if (!initial.ok) throw new Error('fixture');
    const before = serializeElementCatalog(initial.catalog);
    expect(reviseCatalog(initial.catalog, { rewrite: [], retire: ['functional-requirement:req-a'], add: [element('draft:functional-requirement:replacement')], references: [field(['functional-requirement:req-a'])] }))
      .toEqual({ ok: false, errors: ['entries.cap-a.requirementRefs.0: "functional-requirement:req-a" is retired; this field requires an active reference from this run catalog in functional-requirement'] });
    expect(serializeElementCatalog(initial.catalog)).toBe(before);
    expect(reviseCatalog(initial.catalog, { rewrite: [], retire: ['functional-requirement:req-a'], add: [element('draft:functional-requirement:replacement')],
      replacements: [{ retired: 'functional-requirement:req-a', with: ['draft:functional-requirement:replacement'] }], references: [field(['draft:functional-requirement:replacement'])] }))
      .toMatchObject({ ok: true, ids: new Map([['draft:functional-requirement:replacement', 'functional-requirement:replacement']]), catalog: { retired: ['functional-requirement:req-a'] } });
  });
  test('each list enforces its supplied kind set, including multiple legal kinds and no permitted kind', () => {
    const catalog = openElementCatalog(hash, manifest); const submitted = [element('draft:functional-requirement:req-a'), element('draft:context:context-a', 'context'), element('draft:recommendation:recommend-a', 'recommendation')];
    expect(validateElementReferences([field(['draft:functional-requirement:req-a', 'draft:recommendation:recommend-a'], ['functional', 'recommendation']), field(['draft:context:context-a'], ['context'])], catalog, submitted)).toEqual([]);
    expect(validateElementReferences([field(['draft:context:context-a']), field(['draft:functional-requirement:req-a'], [])], catalog, submitted)).toEqual([
      'entries.cap-a.requirementRefs.0: "draft:context:context-a" is context; this field requires functional-requirement from this submission',
      'entries.cap-a.requirementRefs.0: "draft:functional-requirement:req-a" is functional-requirement; this field requires no permitted element kinds from this submission',
    ]);
  });
  test('a draft-stage field refuses accepted IDs and an accepted-stage field refuses draft keys, at the field path', () => {
    const accepted = acceptElements(openElementCatalog(hash, manifest), [element('draft:functional-requirement:req-a')]); if (!accepted.ok) throw new Error('fixture');
    expect(validateElementReferences([{ ...field(['functional-requirement:req-a']), stage: 'draft' }, { ...field(['draft:functional-requirement:req-a']), stage: 'accepted' }], accepted.catalog, [])).toEqual([
      expect.stringMatching(/^entries\.cap-a\.requirementRefs\.0: .* accepted ID or wrong-stage reference/), expect.stringMatching(/^entries\.cap-a\.requirementRefs\.0: .* is a draft key/)]);
  });
});
