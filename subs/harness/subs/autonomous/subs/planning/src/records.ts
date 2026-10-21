import { nonBehavioralAcceptanceSchema } from '../../../../scenarios/src/form.js';
import { join } from 'node:path';
import { z } from 'zod';
import { citationSchema, modulePathSchema, viewIdentitySchema } from '../../../../../src/interfaces/protocol/evidence.js';


import { scenarioIdSchema } from '../../../../scenarios/src/records.js';
import type { ScenarioFormWarningKind as ScenarioWarningKind } from '../../../../scenarios/src/form.js';
import { elementIdSchema } from '../../../../plan-evidence/src/interfaces/catalog.js';

/*
 * The records the initial analysis commits beside its entry assignments: one
 * `Hypothesis` per forecast, at revision 1, and one `RegistryEntry` per entry
 * capability.
 *
 * A hypothesis is a forecast and nothing more. It has no reference to a work
 * item, and nothing references it but a decision and a module architect's
 * input; no harness code reads one to create work, an obligation or a
 * completion requirement. Revision 1 is never rewritten, so the forecast and
 * what happened stay comparable.
 */

const text = z.string().min(1);

/** A heading anchor or line range of the captured plan. */
export const planRefSchema = z.object({
  /** Absent on old runs: resolve against the captured root plan. */
  document: z.string().regex(/^doc-\d{3,}$/).optional(),
  anchor: text.optional(),
  lines: z.tuple([z.int().nonnegative(), z.int().nonnegative()]).optional(),
}).strict();

export const moduleProposalSchema = z.object({
  parent: modulePathSchema,
  directory: text,
  purpose: text,
  tags: z.array(z.string()),
}).strict();
export type ModuleProposal = z.infer<typeof moduleProposalSchema>;

export const entryAssignmentsSchema = z.object({
  schema: z.enum(['ramify-agent.entry-assignments/1', 'ramify-agent.entry-assignments/2']),
  view: viewIdentitySchema,
  entries: z.array(z.object({
    capability: text,
    description: text,
    owner: modulePathSchema,
    proposed: moduleProposalSchema.optional(),
    requirementRefs: z.array(elementIdSchema),
    acceptanceRefs: z.array(elementIdSchema),
    contextRefs: z.array(elementIdSchema),
    capabilityId: z.string().regex(/^capability:[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    functionalRequirementIds: z.array(elementIdSchema).optional(),
    functionalAcceptanceIds: z.array(elementIdSchema).optional(),
    contextIds: z.array(elementIdSchema).optional(),
    citations: z.array(citationSchema),
    nonBehavioralAcceptance: z.array(nonBehavioralAcceptanceSchema).optional(),
  }).strict()),
}).strict().superRefine((record, ctx) => {
  if (record.schema !== 'ramify-agent.entry-assignments/2') return;
  record.entries.forEach((entry, index) => {
    for (const field of ['capabilityId', 'functionalRequirementIds', 'functionalAcceptanceIds', 'contextIds'] as const) {
      if (entry[field] === undefined) ctx.addIssue({ code: 'custom', path: ['entries', index, field], message: 'descriptive records require explicit accepted references' });
    }
  });
});
export type EntryAssignments = z.infer<typeof entryAssignmentsSchema>;


/** A capability or hypothesis slug: an architect proposes it, and it is unique in the run. */
export const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'A kebab-case slug, such as "send-email"');

/** What the retired `extend` value is answered with, in the terms the role submits. */
export const extensionIsANewForecast = 'An existing capability is never revised to cover more. Forecast the extended behavior as a new capability named for itself, with change "create" and the existing module as its suggested owner, and set "changesExistingSymbols" to true where implementing it changes symbols that already have consumers';

/**
 * What a hypothesis forecasts. Each value has a decision outcome that can
 * confirm it, and `create-by-extraction` pairs with the outcome `extract`.
 * `refactor` is not here: no decision outcome could confirm it.
 *
 * There is no value for extending a capability. An extension is a new
 * capability named for itself, so it is forecast as `create`, and
 * `changesExistingSymbols` says whether implementing it changes symbols
 * that already have consumers.
 */
export const hypothesisChangeSchema = z.enum(['reuse', 'create', 'create-by-extraction'], {
  error: issue => (issue.input === 'extend' ? extensionIsANewForecast : undefined),
});
export type HypothesisChange = z.infer<typeof hypothesisChangeSchema>;

export const hypothesisSchema = z.object({
  schema: z.enum(['ramify-agent.hypothesis/1', 'ramify-agent.hypothesis/2']),
  id: z.union([slugSchema, z.string().regex(/^hypothesis:[a-z0-9]+(?:-[a-z0-9]+)*$/)]),
  revision: z.int().positive(),
  standing: z.enum(['tentative', 'confirmed', 'superseded']),
  /** The forecast capability. It is not a registry entry. */
  capability: z.union([slugSchema, z.string().regex(/^capability:[a-z0-9]+(?:-[a-z0-9]+)*$/)]),
  change: hypothesisChangeSchema,
  /**
   * Whether implementing the forecast capability is expected to change
   * symbols that already have consumers, which a later decision confirms or
   * revises.
   */
  changesExistingSymbols: z.boolean(),
  suggestedOwner: modulePathSchema,
  anticipatedConsumers: z.array(text),
  /** Which module architects receive it, beside the anticipated consumers. */
  involvedModules: z.array(modulePathSchema),
  /** Forecast dependency links, all tentative. */
  dependsOn: z.array(z.union([slugSchema, z.string().regex(/^hypothesis:[a-z0-9]+(?:-[a-z0-9]+)*$/)])),
  confidence: z.enum(['low', 'medium', 'high']),
  rationale: text,
  assumptions: z.array(z.string()),
  uncertainties: z.array(z.string()),
  citations: z.array(citationSchema),
  /** Revision 1 comes from the initial analysis; a later one from one global decision. */
  cause: z.union([
    z.object({ initial: text }).strict(),
    z.object({ decision: text, reason: text }).strict(),
  ]),
  supersededBy: z.union([slugSchema, z.string().regex(/^hypothesis:[a-z0-9]+(?:-[a-z0-9]+)*$/)]).optional(),
  confirmedBy: text.optional(),
}).strict();
export type Hypothesis = z.infer<typeof hypothesisSchema>;

export const registryEntrySchema = z.object({
  schema: z.enum(['ramify-agent.capability/1', 'ramify-agent.capability/2']),
  capability: z.union([slugSchema, z.string().regex(/^capability:[a-z0-9]+(?:-[a-z0-9]+)*$/)]),
  revision: z.int().positive(),
  behavior: text,
  owner: modulePathSchema,
  proposed: moduleProposalSchema.optional(),
  origin: z.enum(['entry', 'global-decision', 'local-decision']),
  /** Null for an entry assignment; a decision's ID otherwise. */
  decision: z.string().nullable(),
  /** Confirmed consumer-to-dependency links this revision adds. */
  consumers: z.array(z.object({ capability: z.union([slugSchema, z.string().regex(/^capability:[a-z0-9]+(?:-[a-z0-9]+)*$/)]), workItem: text }).strict()),
  previousOwner: modulePathSchema.optional(),
}).strict();
export type RegistryEntry = z.infer<typeof registryEntrySchema>;

/** The kinds of warning the scenarios' form rules give, as the accepted analysis records them. */
const scenarioWarningKinds = ['names-view-symbol', 'names-view-file', 'sub-scenario-shares-no-step', 'duplicate-architect-steps'] as const satisfies readonly ScenarioWarningKind[];
const _everyWarningKind: (typeof scenarioWarningKinds)[number] = undefined as unknown as ScenarioWarningKind;
void _everyWarningKind;

/**
 * A warning on the accepted analysis's scenarios, never a rejection: it is
 * recorded with the scenarios it concerns, by their IDs, and shown in the
 * review.
 */
export const scenarioWarningSchema = z.object({
  kind: z.enum(scenarioWarningKinds),
  scenarios: z.array(scenarioIdSchema),
  message: text,
}).strict();
export type RecordedScenarioWarning = z.infer<typeof scenarioWarningSchema>;

/**
 * One correction a checker made to the catalog before it was frozen, with
 * its reason: shown at the review stop beside the corrected catalog, and
 * never a rejection.
 */
export const catalogFindingSchema = z.object({
  /** The captured document whose reading was checked. */
  document: z.string().regex(/^doc-\d{3,}$/),
  invocation: text,
  action: z.enum(['add', 'rewrite', 'replace']),
  reason: text,
  /** The elements the correction added, rewrote or put in place of the retired ones. */
  elements: z.array(elementIdSchema),
  retired: z.array(elementIdSchema),
}).strict();
export type CatalogFinding = z.infer<typeof catalogFindingSchema>;

/** Where the analysis's records are materialized, relative to the run's directory. */
export const analysisLayout = {
  hypothesis: (id: string, revision: number): string => join('hypotheses', encodeURIComponent(id).replace(/:/g, '%3A'), `${revision}.json`),
  registry: (capability: string, revision: number): string => join('registry', encodeURIComponent(capability).replace(/:/g, '%3A'), `${revision}.json`),
} as const;

/** The schema literal of each kind, for a reader that answers unsupported version. */
export const analysisSchemas = {
  hypothesis: { schema: 'ramify-agent.hypothesis/1', body: hypothesisSchema },
  registry: { schema: 'ramify-agent.capability/1', body: registryEntrySchema },
} as const;
