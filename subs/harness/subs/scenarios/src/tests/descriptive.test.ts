import { describe, expect, it } from 'vitest';
import { extractDocumentScenarios, planScenarioExtractionSchema } from '../extraction.js';
import { descriptiveScenarioFormSubmissionSchema, normalizeDescriptiveScenarioForm, validateScenarioForm } from '../form.js';
import { assignScenarioIds, scenarioRecordSchema } from '../records.js';
import { identityTagOf, scenarioIdOfTag } from '../rendering.js';

const plan = ['# Acceptance', '```gherkin', 'Scenario: Reject a missing predecessor', '  Given the predecessor is missing', '  Then preview rejects the request', '```'].join('\n');

describe('descriptive scenario identities', () => {
  it('distinguishes identical captured names by stable source context', () => {
    const documents = [
      { id: 'document:plan', text: plan },
      { id: 'document:companion', text: plan },
    ];
    const first = extractDocumentScenarios(documents, 'descriptive');
    const retry = extractDocumentScenarios(documents, 'descriptive');
    expect(first.schema).toBe('ramify-agent.plan-scenario-extraction/2');
    expect(planScenarioExtractionSchema.parse(first)).toEqual(first);
    expect(first).toEqual(retry);
    expect(first.scenarios).toHaveLength(2);
    expect(new Set(first.scenarios.map(scenario => scenario.id)).size).toBe(2);
    expect(first.scenarios.every(scenario => scenario.id.startsWith('plan-scenario:reject-a-missing-predecessor-'))).toBe(true);
  });

  it('accepts explicit draft scenario and capability keys, then renders a reversible identity tag', () => {
    const captured = extractDocumentScenarios([{ id: 'document:plan', text: plan }], 'descriptive').scenarios[0]!;
    const submission = descriptiveScenarioFormSubmissionSchema.parse({
      scenarios: [{ scenarioKey: 'draft:scenario:reject-missing-predecessor', entryCapabilityKey: 'draft:capability:add-preview',
        origin: { kind: 'plan', planScenarioId: captured.id }, functionalAcceptanceKeys: ['draft:functional-requirement:reject-missing-predecessor'] }],
      integrationScenarios: [],
    });
    const normalized = normalizeDescriptiveScenarioForm(submission);
    const form = validateScenarioForm(normalized, [captured], [{ capability: 'draft:capability:add-preview', acceptanceRefs: ['draft:functional-requirement:reject-missing-predecessor'] }]);
    expect(form.ok).toBe(true);
    if (!form.ok) return;
    const assigned = assignScenarioIds(form.form, { identityContract: 'descriptive', planId: 'preview',
      entries: [{ capability: 'draft:capability:add-preview', owner: 'app' }],
      modules: [{ module: 'app', dir: '', testing: false }],
    });
    expect(assigned.records[0]).toMatchObject({ schema: 'ramify-agent.scenario/2', id: 'scenario:reject-missing-predecessor',
      origin: { kind: 'plan', planScenario: captured.id } });
    expect(assigned.records[0]!.file).toBe('src/tests/features/preview/draft%3Acapability%3Aadd-preview.feature');
    expect(scenarioRecordSchema.parse(assigned.records[0])).toEqual(assigned.records[0]);
    expect(scenarioIdOfTag(identityTagOf(assigned.records[0]!.id))).toBe(assigned.records[0]!.id);
  });
});
