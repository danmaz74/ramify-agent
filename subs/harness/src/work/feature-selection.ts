import { z } from 'zod';

/** Exact generated files selected for evidence, independently of completion obligations. */
export const featureSelectionSchema = z.object({
  files: z.array(z.string().min(1)).min(1),
  reason: z.string().trim().min(1),
}).strict().describe('Exact normalized project-relative generated feature paths registered in this run, with the reason for selecting evidence. May include consumer features outside source write scope. Does not delegate acceptance or change obligations, source write scope or generated files. Background pointers alone select nothing.');
export type FeatureSelection = z.infer<typeof featureSelectionSchema>;

/** Selection authority is the current project scenario registry, never source write scope. */
export function featureSelectionErrors(selection: FeatureSelection | undefined, registered: ReadonlySet<string> | undefined): Array<{ path: string; message: string }> {
  const seen = new Set<string>();
  return (selection?.files ?? []).flatMap((file, index) => {
    const path = `assignment.featureSelection.files.${index}`;
    const normalized = !file.startsWith('/') && !/[\\*?\[\]{}\n\r]/u.test(file) && file.split('/').every(part => part !== '' && part !== '.' && part !== '..') && file.endsWith('.feature');
    const message = !normalized ? 'Select an exact normalized project-relative generated .feature path; no globs, line suffixes or traversal'
      : seen.has(file) ? `Feature "${file}" is selected more than once`
      : registered === undefined ? 'Current generated-feature registry is unavailable; derive inputs from the run that registered the scenarios'
      : !registered.has(file) ? `Feature "${file}" is unknown or stale in the current project scenario registry; select a current registered generated file`
      : undefined;
    seen.add(file);
    return message === undefined ? [] : [{ path, message }];
  });
}

/** Explicit selection and scenario obligations select files; background scenarios do not. */
export function assignedFeaturePaths(assignment: { readonly featureSelection?: FeatureSelection; readonly obligations?: readonly string[] }, scenarios: readonly { readonly id: string; readonly file: string }[]): string[] {
  const errors = featureSelectionErrors(assignment.featureSelection, new Set(scenarios.map(scenario => scenario.file)));
  if (errors.length > 0) throw new Error(errors.map(error => `${error.path}: ${error.message}`).join('; '));
  return [...new Set([...(assignment.featureSelection?.files ?? []), ...scenarios.filter(scenario => assignment.obligations?.includes(scenario.id)).map(scenario => scenario.file)])];
}
