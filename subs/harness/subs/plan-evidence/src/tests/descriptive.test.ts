import { describe, expect, it } from 'vitest';
import { acceptElements, createPackage, openElementCatalog, reviseCatalog, validateElementReferences } from '../interfaces/catalog.js';
import { documentManifestSchema } from '../interfaces/contracts.js';

const sha256 = 'a'.repeat(64);
const manifest = documentManifestSchema.parse({
  schema: 'ramify-agent.document-manifest/2', root: 'document:preview-plan',
  documents: [{ id: 'document:preview-plan', path: 'plans/preview/plan.md', kind: 'plan', sha256, bytes: 1,
    storedAt: 'input/plan.md', revision: { commit: null, dirty: null } }],
  missing: [], principlesScan: { status: 'empty', unreadable: [] },
});
const requirement = (key: string) => ({ key, kind: 'functional' as const, document: manifest.root,
  text: 'Reject a missing predecessor and preserve the complete source.', conditions: [{ source: 'stated' as const, text: 'When a predecessor is missing' }], uncertainty: 'None.' });

describe('descriptive element catalog', () => {
  it('accepts the proposed name as the actual ID and preserves its complete package content', () => {
    const open = openElementCatalog(sha256, manifest, 'descriptive');
    const accepted = acceptElements(open, [requirement('draft:functional-requirement:reject-missing-predecessor')]);
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) return;
    const id = 'functional-requirement:reject-missing-predecessor';
    expect(accepted.ids.get(`draft:${id}`)).toBe(id);
    expect(accepted.catalog.schema).toBe('ramify-agent.element-catalog/2');
    expect(createPackage({ catalog: accepted.catalog, elements: [id], deviations: [], planDeviations: [] })).toMatchObject({ text: expect.stringContaining('When a predecessor is missing') });
  });

  it('rejects an entire batch for active or retired collisions, and permits a meaningful qualifier', () => {
    const open = openElementCatalog(sha256, manifest, 'descriptive');
    const first = acceptElements(open, [requirement('draft:functional-requirement:preview-input')]);
    if (!first.ok) throw new Error(first.errors.join('\n'));
    const collision = acceptElements(first.catalog, [requirement('draft:functional-requirement:another'), requirement('draft:functional-requirement:preview-input')]);
    expect(collision.ok).toBe(false);
    if (!collision.ok) expect(collision.errors.join('\n')).toContain('1.key:');
    expect(first.catalog.elements).toHaveLength(1);
    expect(reviseCatalog(first.catalog, { rewrite: [], retire: ['functional-requirement:preview-input'], add: [] })).toMatchObject({ ok: false });
    const retired = reviseCatalog(first.catalog, { rewrite: [], retire: ['functional-requirement:preview-input'],
      add: [requirement('draft:functional-requirement:preview-input-validation')],
      replacements: [{ retired: 'functional-requirement:preview-input', with: ['draft:functional-requirement:preview-input-validation'] }] });
    if (!retired.ok) throw new Error(retired.errors.join('\n'));
    expect(retired.catalog.replacements).toEqual([{ retired: 'functional-requirement:preview-input', with: ['functional-requirement:preview-input-validation'] }]);
    expect(acceptElements(retired.catalog, [requirement('draft:functional-requirement:preview-input')]).ok).toBe(false);
    const qualified = acceptElements(retired.catalog, [requirement('draft:functional-requirement:preview-input-value')]);
    expect(qualified.ok && qualified.ids.get('draft:functional-requirement:preview-input-value')).toBe('functional-requirement:preview-input-value');
  });

  it('distinguishes draft, accepted, wrong kind, unknown, and retired citations at the field path', () => {
    const open = openElementCatalog(sha256, manifest, 'descriptive');
    const first = acceptElements(open, [requirement('draft:functional-requirement:preview-input')]);
    if (!first.ok) throw new Error(first.errors.join('\n'));
    const errors = validateElementReferences([
      { path: 'entries.0.functionalRequirementKeys', citations: ['functional-requirement:preview-input'], allowedKinds: ['functional'], stage: 'draft' },
      { path: 'entries.0.functionalRequirementIds', citations: ['draft:functional-requirement:preview-input'], allowedKinds: ['functional'], stage: 'accepted' },
      { path: 'entries.0.functionalRequirementKeys', citations: ['draft:non-functional-requirement:limit-time'], allowedKinds: ['functional'], stage: 'draft' },
      { path: 'entries.0.functionalRequirementIds', citations: ['functional-requirement:unknown'], allowedKinds: ['functional'], stage: 'accepted' },
    ], first.catalog, [{ key: 'draft:non-functional-requirement:limit-time', kind: 'non-functional' }]);
    expect(errors).toHaveLength(4);
    expect(errors.every(error => error.startsWith('entries.0.'))).toBe(true);
    expect(errors.join('\n')).toContain('non-functional-requirement');
  });
});
