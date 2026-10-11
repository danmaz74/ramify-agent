import { stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { CapabilityRequest } from './records.js';
import type { TaskEnvironment } from '../prompts/tasks.js';
import type { IterationApiViews } from '../work/engineer.js';
import { apiCoverageStatement } from '../work/session.js';

/** Consumer evidence supplements existing qualified navigation with its own revision and coverage. */
export function capabilityViewInputs(existing: TaskEnvironment['views'], consumers: readonly IterationApiViews[]): TaskEnvironment['views'] {
  return [...existing, ...consumers.flatMap(entry => entry.views.map(view => ({
    path: view.path, revision: view.revision, modules: [entry.module],
    coverage: view.coverage === null ? [] : [apiCoverageStatement(view.coverage)],
  })))];
}

/** Resolve job-relative record paths only for delivery; durable records retain their convention. */
export function capabilityRecordSection(runDirectory: string, pointers: readonly { readonly path: string; readonly label: string }[]): string {
  return [
    '## Run records',
    `Run-record root: ${runDirectory}. Relative paths within durable records start at this root, not the source cwd. Use the absolute pointers below with read/ls.`,
    ...pointers.map(pointer => `- ${pointer.label}: ${resolve(runDirectory, pointer.path)}`),
    'Snapshot records preserve the immutable suspension tree and captured bytes. Source reads through the current project cwd inspect the live candidate, which may have changed.',
  ].join('\n');
}

/** Usage locations retain their submitted status even after later work creates the file. */
export async function capabilitySourceSection(projectRoot: string, request: CapabilityRequest): Promise<string> {
  const lines = ['## Caller source navigation', 'Usage paths are project-relative; absolute read pointers are supplied here. A location hint adds no write authority.'];
  for (const usage of request.original.usage) {
    const path = resolve(projectRoot, usage.path);
    const file = await stat(path).catch(() => null);
    if (!usage.prospective) {
      lines.push(`- Actual usage ${usage.path}: ${file?.isFile() ? `read current source at ${path}` : 'current caller source is unavailable; no existing file evidence was found'}.`);
      continue;
    }
    lines.push(`- Prospective usage ${usage.path}: intended caller location${usage.module === undefined ? '' : ` in ${usage.module}`}; it is not required to exist.`);
    if (file?.isFile()) {
      lines.push(`  Existing caller evidence is now available at ${path}; its request status remains prospective.`);
      continue;
    }
    let parent = dirname(path);
    while (parent !== projectRoot && parent.startsWith(`${projectRoot}/`) && !(await stat(parent).catch(() => null))?.isDirectory()) parent = dirname(parent);
    if ((parent === projectRoot || parent.startsWith(`${projectRoot}/`)) && (await stat(parent).catch(() => null))?.isDirectory()) {
      lines.push(`  No existing caller file evidence is available. List ${parent} and inspect relevant existing siblings or parent patterns; do not open the prospective file as existing live source.`);
    } else lines.push('  No existing caller or accessible parent-directory evidence is available.');
  }
  return lines.join('\n');
}
