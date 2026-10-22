import { renderInitialArchitectPrompt, renderExtractionPrompt } from './prompts.js';
import type { DurableRecordRef as RecordRef } from '../../../../task-execution/src/records.js';
import { coverageRecordsOf, describeCoverageLimits, type ArchitectIndex } from '../../../../evidence/src/views.js';
import { openElementCatalog, serializeElementCatalog, type ElementKind } from '../../../../plan-evidence/src/interfaces/catalog.js';
import { acceptIntake, acceptPrinciples, applyCheck, asValidation, checkJsonSchema, checkMessage, checkSubmissionSchema, checkToolName, intakeJsonSchema, intakeMessage, intakeSubmissionSchema, intakeToolName, principleJsonSchema, principleMessage, principleSubmissionSchema, principleToolName, type CheckState, type CheckSubmission, type ExtractionInputs, type IntakeSubmission, type PrincipleSubmission } from './extraction.js';
import type { CatalogFinding } from './records.js';
import { finished, kept, type SessionKeeping } from '../../../../task-execution/src/results.js';
import { baselineScope } from '../../../../kpi/src/capture.js';
import { acceptAnalysis } from './accept.js';
import { acceptArchitectElements, incorporatedExtraction, incorporatedScenarios, initialAnalysisJsonSchema, initialAnalysisToolName, validateInitialAnalysis, type AnalysisEvidence, type InitialAnalysisSubmission } from './submission.js';

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { InputManifest } from '../../../../../src/interfaces/protocol/evidence.js';
import type { RunFailureReason } from '../../../../../src/interfaces/protocol/runs.js';
import type { PlanScenario } from '../../../../scenarios/src/extraction.js';
import type { MeasurementSnapshot } from '../../../../kpi/src/run-records.js';
import { runLayout } from '../../../src/run/records.js';
import type { InvocationOutcome } from '../../../../task-execution/src/records.js';
import type { DeclaredScope } from '../../../../kpi/src/capture.js';
import type { Equipment } from '../../../../task-execution/src/equipment.js';
import type { Invocation } from '../../../../task-execution/src/records.js';
import type { LoadedPackage, ExtractionTurn } from '../../../../../src/prompts/packages.js';
import { sha256 } from '../../../../../src/prompts/packages.js';
import { readCapturedDocuments, documentChanges } from './documents.js';
import { analysisMessage, planPointer } from './messages.js';
import type { RunEvent } from '../../../src/run/log.js';
import type { RecordRef as CommitRecord } from '../../../../../src/jobs/commit.js';
import type { InvocationResult } from '../../../../task-execution/src/results.js';
import { validateAgainst, type SubmissionValidation } from '../../../../task-execution/src/submissions.js';
import type { JsonSchema } from '../../../../agent/src/interfaces/port.js';
import type { IdentityContract } from '../../../../plan-evidence/src/interfaces/contracts.js';
import { descriptiveInitialAnalysisJsonSchema, descriptiveInitialAnalysisSchemaId, normalizeDescriptiveAnalysis,
  validateDescriptiveInitialAnalysis, type DescriptiveInitialAnalysisSubmission } from './descriptive.js';
import { descriptiveIntakeJsonSchema, descriptiveIntakeSubmissionSchema, descriptivePrincipleJsonSchema,
  descriptivePrincipleSubmissionSchema, descriptiveCheckJsonSchema, descriptiveCheckSubmissionSchema,
  normalizeDescriptiveCheck, type DescriptiveCheckSubmission } from './extraction.js';

/** The read-only task that planning prepares, with no scheduler or run authority. */
export interface PlanningInvocation<T> {
  readonly role: 'initial-architect' | 'catalog-extractor';
  readonly task?: { readonly kind: 'initial-analysis'; readonly goal: string; readonly requirements: readonly string[]; readonly literalSections: readonly { readonly key: string; readonly text: string }[] };
  readonly work: Invocation['work'];
  readonly attempt: number;
  readonly loaded: LoadedPackage;
  readonly systemPrompt: string;
  readonly prompt: string;
  readonly start: { readonly mode: 'fresh' };
  readonly toolName: string;
  readonly description: string;
  readonly inputSchema: JsonSchema;
  readonly submissionSchema: string;
  readonly validate: (input: unknown) => SubmissionValidation<T>;
  readonly keep: (ended: InvocationOutcome['ended']) => SessionKeeping;
  readonly scope: Invocation['scope'];
  readonly measured?: { readonly snapshot: MeasurementSnapshot; readonly scope: DeclaredScope };
  readonly equip?: () => Equipment;
}
export type AnalysisAcceptedTransition = Pick<Extract<RunEvent, { type: 'analysis-accepted' }>, 'type' | 'data'>;
export interface PlanningInputs {
  readonly identityContract?: IdentityContract;
  readonly projectRoot: string;
  readonly directory: string;
  readonly planId: string;
  readonly manifest: InputManifest;
  readonly planScenarios: readonly PlanScenario[];
  readonly index: ArchitectIndex | null;
  readonly baseline: MeasurementSnapshot;
  readonly baselineMeasurement: RecordRef | null;
  readonly capturedPlanPath: string;
  readonly rootModule: string;
  readonly registeredTests: ReadonlySet<string>;
  readonly architectPackage: LoadedPackage;
  readonly extractorPackage: LoadedPackage;
}
export interface PlanningPorts {
  readonly execute: <T>(request: PlanningInvocation<T>) => Promise<InvocationResult<T>>;
  readonly nextExtractionAttempt: () => number;
  readonly ignoring: () => boolean;
  readonly fail: (reason: RunFailureReason, text: string, evidence?: readonly string[]) => Promise<void>;
  readonly stage: (path: string, text: string) => Promise<void>;
  readonly afterWrite: (write: 'analysis-evidence-staged' | 'analysis-accepted') => Promise<void>;
  readonly captureRepairAssignment: (invocation: string, assignment: NonNullable<InitialAnalysisSubmission['contingentRepairAssignment']>) => Promise<boolean>;
  readonly commit: (event: AnalysisAcceptedTransition, records: readonly CommitRecord[]) => Promise<unknown>;
}
/** Plans from captured inputs; only the lifecycle commit makes its staged bundle authoritative. */
export async function performInitialAnalysis(input: PlanningInputs, ports: PlanningPorts): Promise<boolean> {
  const identityContract = input.identityContract ?? 'legacy';
  const descriptive = identityContract === 'descriptive';
  const manifestRef = input.manifest.documentManifest;
  const documents = await readCapturedDocuments(input.directory, input.manifest);
  const inputs: ExtractionInputs = { planId: input.planId, manifest: documents.manifest, bytes: documents.bytes, runDirectory: input.directory };
  let catalog = openElementCatalog(manifestRef.hash, documents.manifest, identityContract);

  const intake = await extract<IntakeSubmission>('intake', {
    prompt: intakeMessage(inputs), toolName: intakeToolName, inputSchema: descriptive ? descriptiveIntakeJsonSchema : intakeJsonSchema,
    submissionSchema: descriptive ? 'ramify-agent.intake/2' : 'ramify-agent.intake/1',
    validate: input => {
      const shape = validateAgainst(descriptive ? descriptiveIntakeSubmissionSchema : intakeSubmissionSchema, input);
      return shape.ok ? asValidation(shape.value, acceptIntake(catalog, documents.manifest, shape.value)) : shape;
    },
  });
  if (intake === undefined) return false;
  const intakeAccepted = acceptIntake(catalog, documents.manifest, intake.value);
  if (!intakeAccepted.ok) throw new Error('An accepted intake no longer validates');
  catalog = intakeAccepted.catalog;
  const { incorporation } = intakeAccepted;

  for (const document of documents.manifest.documents.filter(item => item.kind === 'principle')) {
    const extracted = await extract<PrincipleSubmission>('principles', {
      prompt: principleMessage(inputs, document.id, intake.value.goal), toolName: principleToolName,
      inputSchema: descriptive ? descriptivePrincipleJsonSchema : principleJsonSchema,
      submissionSchema: descriptive ? 'ramify-agent.principle-extraction/2' : 'ramify-agent.principle-extraction/1',
      validate: input => {
        const shape = validateAgainst(descriptive ? descriptivePrincipleSubmissionSchema : principleSubmissionSchema, input);
        return shape.ok ? asValidation(shape.value, acceptPrinciples(catalog, document.id, shape.value)) : shape;
      },
    });
    if (extracted === undefined) return false;
    const accepted = acceptPrinciples(catalog, document.id, extracted.value);
    if (!accepted.ok) throw new Error('An accepted principles extraction no longer validates');
    catalog = accepted.catalog;
  }

  const plan = new TextDecoder().decode(await readFile(join(input.directory, runLayout.capturedPlan)));
  const evidence: AnalysisEvidence = { index: input.index, catalog, incorporation, documents, registeredTests: input.registeredTests, planScenarios: input.planScenarios };
  const systemPrompt = renderInitialArchitectPrompt(input.architectPackage, input.projectRoot, descriptive);
  const view = input.manifest.architectView;
  // Only correlate captured counts with records from the same view identity.
  const coverage = view.status !== 'materialized' ? [] : input.index === null ? view.coverageLimits
    : input.index.revision !== view.revision || input.index.input !== view.input
      ? [...view.coverageLimits, 'Captured architect aggregate limits and the current index have different identities; these counts have not been correlated with current symbol records.']
      : describeCoverageLimits(view.coverageLimits, coverageRecordsOf(input.index), [], input.index);
  const prompt = analysisMessage(input, plan, input.capturedPlanPath, inputs, incorporatedExtraction(evidence), coverage);
  const scope = baselineScope(
    input.rootModule,
    // Each invocation's own package and the plan are its support documents.
    [],
  );

  const result = await ports.execute<InitialAnalysisSubmission | DescriptiveInitialAnalysisSubmission>({
    role: 'initial-architect',
    task: { kind: 'initial-analysis', goal: intake.value.goal, requirements: [planPointer(input.planId, 'Implement')], literalSections: [{ key: 'support:accepted-intake', text: `Accepted intake classifications and incorporation: ${JSON.stringify({ catalog, incorporation })}` }] },
    work: {},
    attempt: 1,
    loaded: input.architectPackage,
    systemPrompt,
    prompt,
    start: { mode: 'fresh' },
    toolName: initialAnalysisToolName,
    description: 'Submit the run\'s initial analysis. The harness validates it; an invalid submission is returned with every error and its path, and a valid one ends this invocation.',
    inputSchema: descriptive ? descriptiveInitialAnalysisJsonSchema : initialAnalysisJsonSchema,
    submissionSchema: descriptive ? descriptiveInitialAnalysisSchemaId : 'ramify-agent.initial-analysis/3',
    validate: input => descriptive ? validateDescriptiveInitialAnalysis(input, evidence) : validateInitialAnalysis(input, evidence),
    // An accepted analysis session becomes the run's architect context:
    // briefs are appended to it and every placement request forks it.
    keep: ended => (ended === 'submitted' ? kept : finished('not-kept')),
    scope: {
      write: null,
      measurement: input.baselineMeasurement,
      size: null,
    },
    measured: { snapshot: input.baseline, scope: scope },
  });

  if (ports.ignoring()) return false;
  if (result.ended !== 'submitted' || result.value === undefined) {
    if (result.outcomeKind === 'failed' && result.ended === 'failed') {
      await ports.fail('agent-failed', analysisFailure(result.ended, result.outcomeKind), []);
      return false;
    }
    await ports.fail(result.ended === 'invalid-submission' ? 'invalid-submission' : 'analysis-invalid',
      analysisFailure(result.ended, result.outcomeKind), []);
    return false;
  }

  // Each checker reads one document once every element of it exists, and
  // corrects the catalog and the citations before any ID is final.
  let state: CheckState = acceptArchitectElements(catalog, descriptive
    ? normalizeDescriptiveAnalysis(result.value as DescriptiveInitialAnalysisSubmission)
    : result.value as InitialAnalysisSubmission);
  const findings: CatalogFinding[] = [];
  for (const document of documents.manifest.documents) {
    const checked = await extract<CheckSubmission | DescriptiveCheckSubmission>('check', {
      prompt: checkMessage(inputs, document.id, state, incorporatedScenarios(evidence)), toolName: checkToolName,
      inputSchema: descriptive ? descriptiveCheckJsonSchema : checkJsonSchema,
      submissionSchema: descriptive ? 'ramify-agent.catalog-check/2' : 'ramify-agent.catalog-check/1',
      validate: input => {
        if (descriptive) {
          const shape = validateAgainst(descriptiveCheckSubmissionSchema, input);
          return shape.ok ? asValidation(shape.value, applyCheck(state, document.id, 'candidate', normalizeDescriptiveCheck(shape.value), evidence)) : shape;
        }
        const shape = validateAgainst(checkSubmissionSchema, input);
        return shape.ok ? asValidation(shape.value, applyCheck(state, document.id, 'candidate', shape.value, evidence)) : shape;
      },
    });
    if (checked === undefined) return false;
    const applied = applyCheck(state, document.id, checked.id, descriptive
      ? normalizeDescriptiveCheck(checked.value as DescriptiveCheckSubmission) : checked.value as CheckSubmission, evidence);
    if (!applied.ok) throw new Error('An accepted catalog check no longer validates');
    state = { catalog: applied.catalog, analysis: applied.analysis };
    findings.push(...applied.findings);
  }

  const sourceChanges = await documentChanges(input.projectRoot, input.planId, input.directory, input.manifest);
  if (sourceChanges.length > 0) {
    await ports.fail('inputs-changed', `The captured plan evidence changed before analysis acceptance: ${sourceChanges.join('; ')}`, [runLayout.documentManifest]);
    return false;
  }
  const accepted = acceptAnalysis(state.analysis, {
    identityContract,
    invocation: result.id,
    view: input.manifest.architectView,
    planId: input.planId,
    planScenarios: input.planScenarios,
    index: input.index,
    catalog: state.catalog,
    incorporation,
    documents,
  });
  const catalogText = serializeElementCatalog(state.catalog);
  const incorporationText = `${JSON.stringify(incorporation)}\n`;
  const catalogHash = sha256(catalogText);
  const incorporationHash = sha256(incorporationText);
  const catalogPath = runLayout.catalogVersion(catalogHash);
  const incorporationPath = runLayout.incorporationVersion(incorporationHash);
  await ports.stage(catalogPath, catalogText);
  await ports.stage(incorporationPath, incorporationText);
  await ports.afterWrite('analysis-evidence-staged');
  const count = (kind: ElementKind) => state.catalog.elements.filter(element => element.kind === kind).length;
  if (result.value.contingentRepairAssignment !== undefined &&
    !await ports.captureRepairAssignment(result.id, result.value.contingentRepairAssignment)) return false;
  await ports.commit({
    type: 'analysis-accepted',
    data: {
      invocation: result.id,
      entries: accepted.entries.entries.length,
      hypotheses: accepted.hypotheses.length,
      registry: accepted.registry.length,
      workItems: accepted.workItems.length,
      scenarios: accepted.scenarios.length,
      ...(descriptive ? { scenarioIds: accepted.scenarios.map(scenario => scenario.id) } : {}),
      warnings: [...accepted.warnings],
      catalog: { context: count('context'), functional: count('functional'), nonFunctional: count('non-functional'),
        fixed: count('fixed'), recommendation: count('recommendation') },
      findings,
      evidence: { catalog: { path: catalogPath, hash: catalogHash },
        incorporation: { path: incorporationPath, hash: incorporationHash } },
    },
  }, accepted.records);
  await ports.afterWrite('analysis-accepted');
  return true;

  async function extract<T>(turn: ExtractionTurn, request: { readonly prompt: string; readonly toolName: string; readonly inputSchema: JsonSchema; readonly submissionSchema: string; readonly validate: (input: unknown) => SubmissionValidation<T> }): Promise<{ readonly id: string; readonly value: T } | undefined> {
    const attempt = ports.nextExtractionAttempt();
    const result = await ports.execute<T>({
      role: 'catalog-extractor', work: {}, attempt, loaded: input.extractorPackage,
      systemPrompt: renderExtractionPrompt(input.extractorPackage, input.projectRoot, turn, descriptive),
      prompt: request.prompt, start: { mode: 'fresh' },
      toolName: request.toolName, description: `Submit this ${turn} turn's reading of the captured documents. The harness checks its shape, documents and citations and answers every error with its path.`,
      inputSchema: request.inputSchema, submissionSchema: request.submissionSchema, validate: request.validate,
      keep: () => finished('not-kept'),
      scope: { write: null, measurement: null, size: null },
      equip: () => ({ builtinTools: ['read', 'grep', 'ls'], tools: [] }),
    });
    if (ports.ignoring()) return undefined;
    if (result.ended !== 'submitted' || result.value === undefined) {
      await ports.fail(result.ended === 'invalid-submission' ? 'invalid-submission' : result.outcomeKind === 'failed' ? 'agent-failed' : 'analysis-invalid',
        `The catalog extractor's ${turn} turn ended without an accepted submission (${result.ended}, ${result.outcomeKind})`, []);
      return undefined;
    }
    return { id: result.id, value: result.value };
  }
}

function analysisFailure(ended: InvocationOutcome['ended'], kind: string): string {
  switch (ended) {
    case 'invalid-submission': return 'Every allowed submission of the initial analysis was invalid';
    case 'failed': return 'The plan architect\'s session failed';
    case 'context-budget-reached': return 'The plan architect reached its context budget without submitting an analysis; a budget return is never a completion';
    case 'stopped': return 'The plan architect\'s session stopped without a stop request';
    default: return `The plan architect ended without an accepted analysis (${kind})`;
  }
}
