import { z } from 'zod';
import type { JsonSchema } from '../../../../agent/src/interfaces/port.js';
import { descriptiveSubmittedElementSchema } from '../../../../plan-evidence/src/interfaces/catalog.js';
import { descriptiveScenarioSubmissionSchema, descriptiveIntegrationScenarioSubmissionSchema, normalizeDescriptiveScenarioForm } from '../../../../scenarios/src/form.js';
import { citationSchema, modulePathSchema } from '../../../../../src/interfaces/protocol/evidence.js';
import { contingentRepairDelegationSchema } from '../../work-coordination/src/repair/repair-preparation.js';
import { moduleProposalSchema, hypothesisChangeSchema } from './records.js';
import { validateAgainst, type SubmissionError, type SubmissionValidation } from '../../../../task-execution/src/submissions.js';
import { validateInitialAnalysis, type AnalysisEvidence, type InitialAnalysisSubmission } from './submission.js';

const key = (namespace: string) => z.string().regex(new RegExp(`^draft:${namespace}:[a-z0-9]+(?:-[a-z0-9]+)*$`),
  `a submission-local ${namespace} key, such as draft:${namespace}:preview-missing-predecessor`);
const functionalKey = z.string().min(1).describe('A draft:functional-requirement:<name> key from elements of this submission; accepted IDs are invalid.');
const capabilityKey = key('capability');
const hypothesisKey = key('hypothesis');
const contextKey = z.string().min(1).describe('A draft:context:<name> key from elements of this submission; accepted IDs are invalid.');
const nonBehavioral = z.object({
  functionalAcceptanceKey: functionalKey.describe('A draft:functional-requirement:<name> key in this submission; an accepted non-functional-requirement ID is invalid.'),
  kind: z.literal('non-behavioral'), test: z.string().min(1),
}).strict();

/** The delivered, author-facing descriptive analysis contract. Every local reference names its family. */
export const descriptiveInitialAnalysisSubmissionSchema = z.object({
  elements: z.array(descriptiveSubmittedElementSchema),
  contingentRepairAssignment: contingentRepairDelegationSchema.optional(),
  entries: z.array(z.object({
    capabilityKey: capabilityKey.describe('A new draft:capability:<name> key in this submission; an accepted capability ID is invalid.'),
    description: z.string().min(1), owner: modulePathSchema, proposed: moduleProposalSchema.optional(),
    functionalRequirementKeys: z.array(functionalKey).describe('Keys of functional elements in this submission, such as draft:functional-requirement:preview-missing-predecessor; accepted IDs are invalid.'),
    functionalAcceptanceKeys: z.array(functionalKey), contextKeys: z.array(contextKey),
    citations: z.array(citationSchema), nonBehavioralAcceptance: z.array(nonBehavioral).optional(),
  }).strict()),
  hypotheses: z.array(z.object({
    hypothesisKey: hypothesisKey.describe('A new draft:hypothesis:<name> key, such as draft:hypothesis:reuse-predecessor-resolver; an accepted hypothesis ID is invalid.'),
    capabilityKey: capabilityKey.describe('The forecast capability name as draft:capability:<name>; it need not be an entry of this submission, and an accepted capability ID is invalid.'),
    change: hypothesisChangeSchema, changesExistingSymbols: z.boolean(),
    suggestedOwner: modulePathSchema, anticipatedConsumers: z.array(z.string().min(1)),
    involvedModules: z.array(modulePathSchema), dependsOnHypothesisKeys: z.array(hypothesisKey)
      .describe('Local keys from hypotheses[].hypothesisKey in this submission, such as draft:hypothesis:reuse-predecessor-resolver; accepted IDs are invalid.'),
    confidence: z.enum(['low', 'medium', 'high']), rationale: z.string().min(1),
    assumptions: z.array(z.string()), uncertainties: z.array(z.string()), citations: z.array(citationSchema),
  }).strict()),
  coverageLimits: z.array(z.string()), scenarios: z.array(descriptiveScenarioSubmissionSchema),
  integrationScenarios: z.array(descriptiveIntegrationScenarioSubmissionSchema),
}).strict();
export type DescriptiveInitialAnalysisSubmission = z.infer<typeof descriptiveInitialAnalysisSubmissionSchema>;
export const descriptiveInitialAnalysisJsonSchema = z.toJSONSchema(descriptiveInitialAnalysisSubmissionSchema) as JsonSchema;
export const descriptiveInitialAnalysisSchemaId = 'ramify-agent.initial-analysis/4';

/** Shape, family/stage and existing behavioral validation all run before any catalog allocation. */
export function validateDescriptiveInitialAnalysis(input: unknown, evidence: AnalysisEvidence): SubmissionValidation<DescriptiveInitialAnalysisSubmission> {
  const shape = validateAgainst(descriptiveInitialAnalysisSubmissionSchema, input);
  if (!shape.ok) return shape;
  const value = shape.value;
  const errors: SubmissionError[] = [];
  const elementKeys = new Set(value.elements.map(element => element.key));
  const requireLocal = (refs: readonly string[], path: string, family: string) => refs.forEach((ref, index) => {
    if (elementKeys.has(ref)) return;
    const retired = evidence.catalog.retired.includes(ref);
    const accepted = evidence.catalog.elements.find(element => element.id === ref);
    errors.push({ path: `${path}.${index}`,
      message: `"${ref}" is ${retired ? 'retired' : accepted ? `an accepted ${accepted.kind} requirement` : ref.startsWith('draft:') ? 'not defined in this submission' : 'an accepted or foreign reference'}; this field requires a local ${family} key from elements in this submission`,
      expected: `a draft:${family}:<name> key defined in this submission; accepted IDs are found in the catalog and cannot cite a new local element`,
    });
  });
  value.entries.forEach((entry, index) => {
    requireLocal(entry.functionalRequirementKeys, `entries.${index}.functionalRequirementKeys`, 'functional-requirement');
    requireLocal(entry.functionalAcceptanceKeys, `entries.${index}.functionalAcceptanceKeys`, 'functional-requirement');
    requireLocal(entry.contextKeys, `entries.${index}.contextKeys`, 'context');
    entry.nonBehavioralAcceptance?.forEach((item, offset) => requireLocal([item.functionalAcceptanceKey],
      `entries.${index}.nonBehavioralAcceptance.${offset}.functionalAcceptanceKey`, 'functional-requirement'));
  });
  value.scenarios.forEach((scenario, index) => requireLocal(scenario.functionalAcceptanceKeys ?? [],
    `scenarios.${index}.functionalAcceptanceKeys`, 'functional-requirement'));
  value.hypotheses.forEach((hypothesis, index) => {
    hypothesis.dependsOnHypothesisKeys.forEach((ref, offset) => {
      if (!value.hypotheses.some(item => item.hypothesisKey === ref)) errors.push({ path: `hypotheses.${index}.dependsOnHypothesisKeys.${offset}`,
        message: `"${ref}" is not a hypothesis key of this submission`, expected: 'a key from hypotheses[].hypothesisKey' });
    });
  });
  if (errors.length > 0) return { ok: false, errors };
  const legacy = validateInitialAnalysis(normalizeDescriptiveAnalysis(value), evidence);
  if (legacy.ok) return shape;
  return { ok: false, errors: legacy.errors.map(error => ({ ...error, path: descriptivePath(error.path) })) };
}

function descriptivePath(path: string): string {
  return path.replace(/^(hypotheses\.\d+)\.id(?=\.|$)/, '$1.hypothesisKey')
    .replace(/^(scenarios\.\d+)\.key(?=\.|$)/, '$1.scenarioKey')
    .replace(/^(scenarios\.\d+)\.entry(?=\.|$)/, '$1.entryCapabilityKey')
    .replace(/^(scenarios\.\d+\.origin)\.planScenario(?=\.|$)/, '$1.planScenarioId')
    .replace(/^(scenarios\.\d+)\.partOf(?=\.|$)/, '$1.partOfPlanScenarioId')
    .replace(/^(integrationScenarios\.\d+)\.planScenario(?=\.|$)/, '$1.planScenarioId')
    .replace(/^(integrationScenarios\.\d+)\.subScenarios(?=\.|$)/, '$1.subScenarioKeys')
    .replace(/\.nonBehavioralAcceptance\.(\d+)\.ref(?=\.|$)/, '.nonBehavioralAcceptance.$1.functionalAcceptanceKey')
    .replace(/\.requirementRefs(?=\.|$)/g, '.functionalRequirementKeys')
    .replace(/\.acceptanceRefs(?=\.|$)/g, '.functionalAcceptanceKeys')
    .replace(/\.contextRefs(?=\.|$)/g, '.contextKeys')
    .replace(/^(hypotheses\.\d+)\.dependsOn(?=\.|$)/, '$1.dependsOnHypothesisKeys')
    .replace(/\.refs(?=\.|$)/g, '.functionalAcceptanceKeys')
    .replace(/\.capability(?=\.|$)/g, '.capabilityKey');
}

/** Existing form/owner rules receive the same values, with local names normalized to slugs. */
export function normalizeDescriptiveAnalysis(input: DescriptiveInitialAnalysisSubmission): InitialAnalysisSubmission {
  const name = (value: string) => value.slice(value.lastIndexOf(':') + 1);
  const form = normalizeDescriptiveScenarioForm(input);
  return {
    elements: input.elements,
    ...(input.contingentRepairAssignment === undefined ? {} : { contingentRepairAssignment: input.contingentRepairAssignment }),
    entries: input.entries.map(entry => ({
      capability: name(entry.capabilityKey), description: entry.description, owner: entry.owner,
      ...(entry.proposed === undefined ? {} : { proposed: entry.proposed }),
      requirementRefs: entry.functionalRequirementKeys, acceptanceRefs: entry.functionalAcceptanceKeys,
      contextRefs: entry.contextKeys, citations: entry.citations,
      ...(entry.nonBehavioralAcceptance === undefined ? {} : { nonBehavioralAcceptance: entry.nonBehavioralAcceptance.map(item => ({
        ref: item.functionalAcceptanceKey, kind: item.kind, test: item.test,
      })) }),
    })),
    hypotheses: input.hypotheses.map(hypothesis => ({
      id: name(hypothesis.hypothesisKey), capability: name(hypothesis.capabilityKey),
      change: hypothesis.change, changesExistingSymbols: hypothesis.changesExistingSymbols,
      suggestedOwner: hypothesis.suggestedOwner, anticipatedConsumers: hypothesis.anticipatedConsumers,
      involvedModules: hypothesis.involvedModules, dependsOn: hypothesis.dependsOnHypothesisKeys.map(name),
      confidence: hypothesis.confidence, rationale: hypothesis.rationale, assumptions: hypothesis.assumptions,
      uncertainties: hypothesis.uncertainties, citations: hypothesis.citations,
    })),
    coverageLimits: input.coverageLimits,
    scenarios: form.scenarios.map(scenario => ({ ...scenario, entry: name(scenario.entry) })),
    integrationScenarios: form.integrationScenarios,
  };
}
