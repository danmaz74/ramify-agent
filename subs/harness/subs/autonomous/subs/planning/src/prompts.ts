import { renderPackagePrompt as render, type LoadedPackage, type ExtractionTurn } from '../../../../../src/prompts/packages.js';
import { initialAnalysisToolName } from './submission.js';
import { intakeToolName, principleToolName, checkToolName } from './extraction.js';

/** The rendered system prompt of the plan architect. It is never stored: it holds file contents. */
export function renderInitialArchitectPrompt(loaded: LoadedPackage, projectRoot: string): string {
  const base = render({ ...loaded, submissionSchema: 'ramify-agent.initial-analysis/4' }, projectRoot, initialAnalysisToolName);
  return `${base}\n\n# Submission identities\nThe submitted tool schema is initial-analysis/4. Propose draft:<namespace>:<descriptive-name> keys for elements, capabilities, hypotheses and scenarios. Use functionalRequirementKeys, functionalAcceptanceKeys and contextKeys for same-submission entry citations; use functionalAcceptanceKeys on scenarios. Use planScenarioId for a captured origin. Accepted catalog IDs, including non-functional-requirement IDs, cannot satisfy local key fields. The harness allocates accepted IDs during ordinary acceptance and returns field-specific errors for correction in this task.\n`;
}

/** The rendered system prompt of one catalog extractor turn. It is never stored either. */
export function renderExtractionPrompt(loaded: LoadedPackage, projectRoot: string, turn: ExtractionTurn): string {
  const extraction = loaded.extraction?.[turn];
  if (extraction === undefined) throw new Error(`The ${loaded.package} package has no ${turn} procedure`);
  const tool = { intake: intakeToolName, principles: principleToolName, check: checkToolName }[turn];
  const base = render({ ...loaded, procedure: extraction.procedure,
    submissionSchema: { intake: 'ramify-agent.intake/2', principles: 'ramify-agent.principle-extraction/2', check: 'ramify-agent.catalog-check/2' }[turn] }, projectRoot, tool);
  return `${base}\n\n# Submission identities\nNew elements use draft:<namespace>:<descriptive-name> keys. The namespaces are context, functional-requirement, non-functional-requirement, fixed-requirement and recommendation. Accepted IDs are allocated when the submission is accepted. In a catalog check, use functionalRequirementCitations, functionalAcceptanceCitations and contextCitations. Each citation names exactly one accepted ID (functionalRequirementId or contextId) or one newly added local key (functionalRequirementKey or contextKey); preserve their order. A scenario correction uses scenarioKey and functionalAcceptanceCitations. Correct validation errors through this same task.\n`;
}
