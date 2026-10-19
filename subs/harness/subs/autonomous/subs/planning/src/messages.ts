import { join } from 'node:path';
import type { InputManifest } from '../../../../../src/interfaces/protocol/evidence.js';
import type { PlanScenarioExtraction } from '../../../../scenarios/src/extraction.js';
import type { ExtractionInputs } from './extraction.js';
import { initialAnalysisToolName } from './submission.js';
export interface PlanningMessageInput { readonly planId: string; readonly manifest: InputManifest }
/** The one requirement of a task the plan block carries whole. */
export function planPointer(planId: string, verb?: string): string {
  return verb === undefined ? `The plan "${planId}", delivered whole in the plan block below.` : `${verb} the plan "${planId}", delivered whole in the plan block below.`;
}

/**
 * The plan block: the captured plan verbatim, delivered once, with where the
 * frozen file is. The live plan file is not the run's input.
 */
export function capturedPlanBlock(planId: string, capturedPath: string, plan: string, document?: string): string[] {
  return [
    `# Plan "${planId}"`,
    '',
    `The plan${document === undefined ? '' : ` (${document})`}, frozen when this run started. The live file \`plans/${planId}/plan.md\` may have changed since and is not this run's input; if you need the frozen file itself, it is at \`${capturedPath}\`.`,
    '',
    '<plan>',
    plan.trim(),
    '</plan>',
    '',
  ];
}

export function analysisMessage(record: PlanningMessageInput, plan: string, capturedPath: string, inputs: ExtractionInputs, planScenarios: PlanScenarioExtraction, coverage: readonly string[]): string {
  const view = record.manifest.architectView;
  const source = record.manifest.source;
  const accompanying = inputs.manifest.documents.filter(document => document.kind === 'plan' && document.id !== inputs.manifest.root);
  return [
    ...capturedPlanBlock(record.planId, capturedPath, plan, inputs.manifest.root),
    ...(accompanying.length === 0 ? [] : [
      '# Accompanying plan documents', '',
      'Read each in full at its captured file; its functional and context elements are yours to submit as well:', '',
      ...accompanying.map(document => `- ${document.id}: ${document.path}; captured file ${join(inputs.runDirectory, document.storedAt)}`), '',
    ]),
    ...planScenariosSection(planScenarios, new Set([inputs.manifest.root])),
    '# This run\'s evidence',
    '',
    view.status === 'materialized'
      ? `- Architect view: \`.ramify-architect/\`, revision \`${view.revision}\`, input \`${view.input}\`.`
      : '- Architect view: none was materialized for this run, so every claim about the module tree is yours to establish from the source.',
    view.status === 'materialized'
      ? `- Coverage limits the view reports: ${coverage.length ? coverage.join('; ') : 'none'}.`
      : '- Coverage limits: unknown.',
    `- Source: ${source === null ? 'not a git checkout' : `commit ${source.commit}${source.dirty ? ', with uncommitted changes, which the views include' : ''}`}.`,
    '',
    `Analyse the plan with the procedure above and submit with \`${initialAnalysisToolName}\`.`,
  ].join('\n');
}

/**
 * The plan scenarios the harness extracted, by ID with their text and plan
 * lines, and every `gherkin` block that did not parse. A plan without
 * blocks is said to have none in one line.
 */
export function planScenariosSection(extraction: PlanScenarioExtraction, suppliedDocuments: ReadonlySet<string> = new Set()): string[] {
  const lines = ['# The plan\'s scenarios', ''];
  if (extraction.scenarios.length === 0 && extraction.limitations.length === 0) {
    return [...lines, 'The plan has no `gherkin` block, so it states no scenario: write every entry\'s scenarios yourself.', ''];
  }
  if (extraction.scenarios.length === 0) {
    lines.push('The plan states no scenario that could be extracted: write every entry\'s scenarios yourself.', '');
  } else {
    lines.push(
      `The harness extracted ${extraction.scenarios.length === 1 ? 'one scenario' : `${extraction.scenarios.length} scenarios`} from the \`gherkin\` blocks of the plan documents the intake incorporated. Each appears exactly once in your submission. Use one as the origin of an entry scenario, restating its exact captured source text, or as an integration scenario with its sub-scenarios.`,
      '',
    );
    for (const scenario of extraction.scenarios) {
      lines.push(
        `## ${scenario.id}: ${scenario.name}`,
        '',
        `Lines ${scenario.lines[0]}–${scenario.lines[1]} of ${scenario.document ?? "the plan"}${scenario.outline ? ', a Scenario Outline with its examples' : ''}.`,
        '',
        ...(scenario.document !== undefined && suppliedDocuments.has(scenario.document)
          ? ['Complete scenario body, including examples, is in the captured plan block above. The scenario lines are identified here; include every applicable Feature/Rule Background condition when restating this origin.']
          : ['```gherkin', ...scenario.source, '```']),
        '',
      );
    }
  }
  if (extraction.limitations.length > 0) {
    lines.push('Blocks the harness could not parse. They are not plan scenarios; the plan is the person\'s and the harness never edits it, so state what they meant in your own scenarios where an entry needs it:', '');
    for (const limitation of extraction.limitations) {
      lines.push(`- Plan lines ${limitation.lines[0]}–${limitation.lines[1]}: ${limitation.message.replace(/\n/g, '; ')}`);
    }
    lines.push('');
  }
  return lines;
}
