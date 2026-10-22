import { describe, expect, test } from 'vitest';
import {
  acceptElements, createPackage, openElementCatalog, type SubmittedElement,
} from '../../../../../plan-evidence/src/interfaces/catalog.js';
import { documentManifestSchema } from '../../../../../plan-evidence/src/interfaces/contracts.js';
import { contextSelectorMessage, workOrientationMessage } from '../context-selection/prompts.js';
import {
  contextSelectorSubmissionSchema, orientationPacket, workOrientationSubmissionSchema,
} from '../context-selection/submissions.js';

const hash = 'a'.repeat(64);
const document = (id: string, path: string, kind: 'plan' | 'principle') => ({
  id, path, kind, sha256: hash, bytes: 1, storedAt: `input/documents/${id}.bin`, revision: { commit: null, dirty: null },
});
const manifest = documentManifestSchema.parse({
  schema: 'ramify-agent.document-manifest/2', root: 'document:sample-plan',
  documents: [document('document:sample-plan', 'plans/sample/plan.md', 'plan'), document('document:source-principles', 'docs/source.principles.md', 'principle')],
  missing: [], principlesScan: { status: 'complete', unreadable: [] },
});
const element = (key: string, kind: SubmittedElement['kind'], documentId: string, text: string): SubmittedElement =>
  ({ key: `draft:${{ functional: 'functional-requirement', 'non-functional': 'non-functional-requirement', fixed: 'fixed-requirement', recommendation: 'recommendation', context: 'context' }[kind]}:${key}`, kind, document: documentId, text, conditions: [], uncertainty: '' });
const accepted = acceptElements(openElementCatalog(hash, manifest), [
  element('timeout', 'non-functional', 'document:sample-plan', 'Keep the timeout.'),
  element('bounded', 'fixed', 'document:source-principles', 'Use bounded work.'),
  element('cache', 'recommendation', 'document:source-principles', 'A cache could help.'),
  element('today', 'context', 'document:sample-plan', 'Today the service has no timeout.'),
  element('request', 'functional', 'document:sample-plan', 'Serve with a timeout.'),
]);
if (!accepted.ok) throw new Error(accepted.errors.join('\n'));
const catalog = accepted.catalog;

describe('context selection submissions', () => {
  test('orientation is assignment-free and its packet preserves the full local briefing', () => {
    const submission = { focus: 'The service timeout', currentUnderstanding: 'The module has a warm path.', questions: ['Does the limit cover retries?'] };
    expect(workOrientationSubmissionSchema.safeParse(submission).success).toBe(true);
    expect(workOrientationSubmissionSchema.safeParse({ ...submission, assignment: { goal: 'skip selection' } }).success).toBe(false);
    const briefing = 'Work item work-item:sample-lookup\nGoal: preserve timeout\nPlan line: exact condition';
    const packet = orientationPacket({ workItem: 'work-item:sample-lookup', briefing, submission });
    expect(packet).toEqual(orientationPacket({ workItem: 'work-item:sample-lookup', briefing, submission }));
    expect(packet.text).toContain(briefing);
    expect(packet.text).toContain('Does the limit cover retries?');
    expect(workOrientationMessage(briefing)).toContain('Do not assign an iteration');
  });

  test('selector submits IDs and judgments only; identity and package belong to the harness', () => {
    const submitted = { selected: [{ id: 'non-functional-requirement:timeout', reason: 'The assigned service has a timeout', conditions: [], uncertainty: '' }] };
    expect(contextSelectorSubmissionSchema.safeParse(submitted).success).toBe(true);
    expect(contextSelectorSubmissionSchema.safeParse({ ...submitted, package: { hash: '0'.repeat(64) } }).success).toBe(false);
    for (const removed of ['examined', 'unavailable']) expect(contextSelectorSubmissionSchema.safeParse({ ...submitted, [removed]: [] }).success).toBe(false);
    expect(contextSelectorSubmissionSchema.safeParse({ selected: [{ ...submitted.selected[0]!, passage: { document: 'document:sample-plan', quote: 'Keep the timeout.' } }] }).success).toBe(false);
  });

  test('the selector message renders every non-functional, fixed and recommendation element through the package creator, and no functional or context element', () => {
    const message = contextSelectorMessage('The parent packet', catalog);
    expect(message.startsWith('The parent packet')).toBe(true);
    const rendered = createPackage({ catalog, planDeviations: [], elements: ['non-functional-requirement:timeout', 'fixed-requirement:bounded', 'recommendation:cache'], deviations: [] });
    if ('unavailable' in rendered) throw new Error('fixture did not render');
    expect(message).toContain(rendered.text.trimEnd());
    for (const text of ['Keep the timeout.', 'Use bounded work.', 'A cache could help.', '### non-functional-requirement:timeout', '### fixed-requirement:bounded', '### recommendation:cache']) expect(message).toContain(text);
    expect(message).not.toContain('### functional-requirement:request');
    expect(message).not.toContain('### context:today');
    for (const text of ['Serve with a timeout.', 'Today the service has no timeout.', '## Functional requirements', '## Context']) expect(message).not.toContain(text);
    expect(message).toContain('Identify each selected element by its stable catalog ID, never by a passage, heading or line range.');
    expect(message).toContain('Keep the required reason, conditions and uncertainty in the structured submission.');
    // Without the captured plan's path, the message names no file to read.
    expect(message).toContain('The elements above are quoted whole from the captured plan.');
    expect(message).not.toContain('Answer with IDs only');
    expect(message).not.toContain('captured document');
  });

  test('the selector message gives the captured plan by its absolute path when the caller supplies it', () => {
    const captured = '/p/plans/tone/.harness/jobs/20261011T104510Z-0e1b47/input/plan.md';
    expect(contextSelectorMessage('The parent packet', catalog, captured)).toContain(
      `The elements above are quoted whole from the captured plan; the captured file is \`${captured}\` if you need its surrounding text.`);
  });

  test('a catalog without selectable elements says so', () => {
    const only = acceptElements(openElementCatalog(hash, manifest), [element('request', 'functional', 'document:sample-plan', 'Serve with a timeout.')]);
    if (!only.ok) throw new Error(only.errors.join('\n'));
    const message = contextSelectorMessage('The parent packet', only.catalog);
    expect(message).toContain('The catalog holds no non-functional, fixed or recommendation element.');
    expect(message).not.toContain('Serve with a timeout.');
  });

  test('a selector fork carries selectable elements without an inherited packet; a new placement update is delivered', () => {
    const fork = contextSelectorMessage(undefined, catalog);
    expect(fork).toContain('Keep the timeout.');
    expect(fork).toContain('Select, by ID');
    expect(fork).not.toContain('The parent packet');
    const update = 'Placement decision `placement-decision:field-diff` placed `field-diff` in `core`.';
    expect(contextSelectorMessage(update, catalog)).toContain(update);
  });
});
