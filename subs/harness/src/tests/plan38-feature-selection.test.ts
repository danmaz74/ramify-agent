import { describe, expect, test } from 'vitest';
import { assignmentBodySchema, assignmentErrors } from '../work/assignment.js';
import { assignedFeaturePaths, featureSelectionErrors } from '../work/feature-selection.js';
import { assign, outline } from './helpers/iterations.js';
import { capabilityActionSchema } from '../capability/submission.js';

const files = ['subs/consumer/src/tests/features/entry-preview.feature', 'subs/provider/src/tests/features/entry-value.feature'];
const records = files.map((file, index) => ({ id: `sc-00${index + 1}`, file }));
const featureSelection = { files: [files[0]!], reason: 'Verify preview composition against the real provider' };

describe('explicit generated-feature evidence independently of completion obligations', () => {
  test('a capability-only assignment selects the consumer file without changing its provider scope or obligation', () => {
    const body = assignmentBodySchema.parse(assign('project/provider', { obligations: ['cap-001'], featureSelection }).assignment);
    expect(assignedFeaturePaths(body, records)).toEqual([files[0]]);
    expect(body.scope.base).toEqual({ module: 'project/provider', included: [] });
    expect(body.obligations).toEqual(['cap-001']);
    const parsed = capabilityActionSchema.parse({ kind: 'assign', task: 'cap-001', planRevision: 1, invocation: 'inv-001', assignment: body });
    expect(parsed.kind === 'assign' && parsed.assignment.featureSelection).toEqual(featureSelection);
  });
  test('ordinary scenario obligations retain their exact feature selection and background pointers select nothing', () => {
    expect(assignedFeaturePaths({ obligations: ['sc-002'] }, records)).toEqual([files[1]]);
    expect(assignedFeaturePaths({ obligations: ['cap-001'] }, records)).toEqual([]);
    expect(assignedFeaturePaths({}, records)).toEqual([]);
    expect(assignedFeaturePaths({ featureSelection, obligations: ['sc-001', 'sc-002'] }, records)).toEqual(files);
  });
  test('unknown stale and outside-project identities are actionable rejections; a source pointer cannot act as a selection', () => {
    for (const file of ['../escape.feature', '/other/entry.feature', 'features/*.feature', `${files[0]}:7`, './feature.feature', 'obsolete.feature']) {
      expect(() => assignedFeaturePaths({ featureSelection: { ...featureSelection, files: [file] } }, records)).toThrow('assignment.featureSelection.files.0');
    }
    expect(featureSelectionErrors(featureSelection, undefined)[0]?.message).toContain('registry is unavailable');
    expect(featureSelectionErrors({ ...featureSelection, files: [files[0]!, files[0]!] }, new Set(files))[0]?.path).toBe('assignment.featureSelection.files.1');
    expect(assignmentBodySchema.safeParse(assign('project/provider', { featureSelection: { ...featureSelection, files: [], reason: ' ' } }).assignment).success).toBe(false);
  });
  test('architect assignment rules use project registry authority and explicitly refuse standalone inputs with no registry', () => {
    const body = assignmentBodySchema.parse(assign('project/provider', { featureSelection }).assignment);
    const evidence = { index: null, registry: new Map(), outline: outline() };
    expect(assignmentErrors(body, { ...evidence, registeredFeatureFiles: new Set(files) })).toEqual([]);
    expect(assignmentErrors(body, evidence)).toContainEqual(expect.objectContaining({ path: 'assignment.featureSelection.files.0', message: expect.stringContaining('registry is unavailable') }));
    expect(assignmentErrors(body, { ...evidence, registeredFeatureFiles: new Set() })).toContainEqual(expect.objectContaining({ path: 'assignment.featureSelection.files.0', message: expect.stringContaining('unknown or stale') }));
  });
});
