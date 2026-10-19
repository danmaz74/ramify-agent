import { renderPackagePrompt as render, type LoadedPackage, type ExtractionTurn } from '../../../../../src/prompts/packages.js';
import { initialAnalysisToolName } from './submission.js';
import { intakeToolName, principleToolName, checkToolName } from './extraction.js';

/** The rendered system prompt of the plan architect. It is never stored: it holds file contents. */
export function renderInitialArchitectPrompt(loaded: LoadedPackage, projectRoot: string): string {
  return render(loaded, projectRoot, initialAnalysisToolName);
}

/** The rendered system prompt of one catalog extractor turn. It is never stored either. */
export function renderExtractionPrompt(loaded: LoadedPackage, projectRoot: string, turn: ExtractionTurn): string {
  const extraction = loaded.extraction?.[turn];
  if (extraction === undefined) throw new Error(`The ${loaded.package} package has no ${turn} procedure`);
  const tool = { intake: intakeToolName, principles: principleToolName, check: checkToolName }[turn];
  return render({ ...loaded, procedure: extraction.procedure, submissionSchema: extraction.submissionSchema }, projectRoot, tool);
}
