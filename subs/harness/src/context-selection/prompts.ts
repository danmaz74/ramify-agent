import { createPackage, type ElementCatalog } from '../../subs/plan-evidence/src/interfaces/catalog.js';

/** The first local turn precedes every assignment and yields a session point. */
export function workOrientationMessage(localBriefing: string, context?: { readonly goal: string; readonly requirements: readonly string[] }): string {
  if (context && (!context.goal.trim() || context.requirements.length === 0)) throw new Error('Orientation requires goal and requirement text');
  return [localBriefing, ...(context ? ['# Goal', context.goal, '# Requirements', ...context.requirements] : []),
    '# Orientation task',
    'Read the supplied elements and explore your module before organizing this work item. Submit only your orientation: your focus, current understanding and open questions. Do not assign an iteration or decide that a source suggestion is binding. Submit your orientation using `submit_work_orientation`.'].join('\n\n');
}

/** The kinds a selector chooses among; functional and context elements come with the entry. */
export const selectableKinds = ['non-functional', 'fixed', 'recommendation'] as const;

/**
 * A fork inherits its briefing; a fresh selector receives it here. New
 * reselection updates also belong here. `capturedPlan` is the absolute path
 * of the run's captured plan, `<project>/plans/<plan>/.harness/jobs/<run>/input/plan.md`;
 * without it the message names no file to read.
 */
export function contextSelectorMessage(packet: string | undefined, catalog: ElementCatalog, capturedPlan?: string): string {
  const ids = catalog.elements.filter(element => (selectableKinds as readonly string[]).includes(element.kind)).map(element => element.id);
  const rendered = createPackage({ catalog, planDeviations: [], elements: ids, deviations: [] });
  if ('unavailable' in rendered) throw new Error(`The catalog cannot render its own elements: ${rendered.unavailable.missing.join(', ')}`);
  return [
    ...(packet === undefined ? [] : [packet]),
    '', '# The selectable elements', '',
    ids.length === 0 ? 'The catalog holds no non-functional, fixed or recommendation element.' : rendered.text.trimEnd(),
    '', 'Select, by ID, the elements an engineer working this work item must keep in view, each with your reason, conditions and uncertainty. Omitting an element never waives it: every non-functional and fixed element is assessed against the final candidate. '
      + (capturedPlan === undefined ? 'The elements above are quoted whole from the captured plan.'
        : `The elements above are quoted whole from the captured plan; the captured file is \`${capturedPlan}\` if you need its surrounding text.`)
      + ' Identify each selected element by its stable catalog ID, never by a passage, heading or line range. Keep the required reason, conditions and uncertainty in the structured submission.',
  ].join('\n');
}
