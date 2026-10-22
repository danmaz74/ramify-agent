import {
  type CapabilityPlan, type CapabilityRequest, type CapabilityTask,
} from '../../capability/records.js';
import { capabilityPolicyFrom } from '../../capability/policy.js';
import { createCapabilityWorkflow } from '../../capability/workflow.js';
import { openRuns, testPolicy, type OpenRunsOptions } from '../../../../../../../src/tests/helpers/runs.js';
import { cp, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { temporaryDirectory } from '../../../../../../../src/tests/helpers/fixture.js';

/** A private Git target, separate from the old collection-review fixture. */
export async function copyCapabilityFixture(nested = false): Promise<{ root: string; remove: () => Promise<void> }> {
  const directory = await temporaryDirectory();
  const name = nested ? 'capability-coordination-nested' : 'capability-coordination';
  const source = fileURLToPath(new URL(`../../../../../../../fixtures/${name}/`, import.meta.url));
  const root = join(directory.path, name);
  await cp(source, root, { recursive: true });
  const ignore = join(root, '.gitignore');
  const content = await readFile(ignore, 'utf8');
  await writeFile(ignore, `${content}${content.endsWith('\n') ? '' : '\n'}**/src/tmp/\n`);
  return { root, remove: directory.remove };
}

/** Drives the capability factory through the real service and ledger while
 * capturing the current shared-lifecycle policy. This seam lives only in the harness test tree. */
export function openCapabilityRuns(root: string, options: OpenRunsOptions) {
  return openRuns(root, { ...options, capabilityWorkflowFactory: createCapabilityWorkflow,
    policy: (projectRoot: string) => capabilityPolicyFrom(options.policy?.(projectRoot) ?? testPolicy(projectRoot)) });
}

/** Small record builders for scripted Plan 16 transitions. Later fixtures
 * can vary the need, provider and source without copying a whole run. */
export const capabilityFixtureIds = {
  request: 'capability-request:format-fact',
  task: 'capability-task:provide-fact',
  example: 'capability-example:format-result',
} as const;

const hash = 'a'.repeat(64);

export function fixtureRequest(): CapabilityRequest {
  return {
    schema: 'ramify-agent.capability-request/2', id: capabilityFixtureIds.request,
    parent: { kind: 'work-item', id: 'work-item:format-fact' }, assignment: 'work-item:format-fact.i01', invocation: 'inv-0001', consumer: 'a',
    requirementPackage: { id: 'pkg-001', revision: 1, hash }, continuation: { session: 'ses-0001', point: 'turn-1' },
    source: { acceptedBase: 'base', tree: hash, snapshotHash: hash, snapshot: 'snapshots/need-001', delta: [
      { path: 'subs/a/src/caller.ts', before: null, after: hash, staged: false },
    ], writerSettledBy: 'inv-0001' },
    summary: 'Caller is partially implemented', original: {
      need: 'Format the new B fact in A', usage: [{ path: 'subs/a/src/caller.ts', symbol: 'formatFact', use: 'Render the result', prospective: false }],
      constraints: ['Preserve the existing D consumer'], knownInterface: { kind: 'none-known' },
      examples: [{ id: capabilityFixtureIds.example, title: 'formats a result', code: 'expect(formatFact(result)).toBe("ok")', designation: 'pseudocode' }],
      suggestedProvider: { module: 'b', reason: 'B owns the fact' },
    },
  };
}

export function fixtureTask(request: CapabilityRequest = fixtureRequest()): CapabilityTask {
  return {
    schema: 'ramify-agent.capability-task/2', id: capabilityFixtureIds.task, request: request.id,
    parent: request.parent, originatingAssignment: request.assignment, consumer: request.consumer, provider: 'b',
    placementReason: 'B owns the fact', authority: [{ owner: 'b', reason: 'Provider implementation' }, { owner: 'a', reason: 'Consumer integration' }],
    relatedEntries: [], deferredWorkItems: ['work-item:provide-fact'], source: request.source,
    limits: { maxAssignments: 12, maxWorkUnits: 64, maxInvocations: 400 },
  };
}

export function fixturePlan(request: CapabilityRequest = fixtureRequest(), task: CapabilityTask = fixtureTask(request)): CapabilityPlan {
  const example = request.original.examples[0]!;
  return {
    schema: 'ramify-agent.capability-plan/2', task: task.id, revision: 1, basedOn: 0, updatedBy: 'inv-0002',
    revisionReason: 'Initial qualified plan', need: request.original.need, proposedInterface: 'B exports a result reader',
    useCases: [{ id: example.id, expectedBehavior: 'A formats the fact', derivedFrom: [example.id] }],
    compatibility: ['D uses the old result shape'], outline: ['Implement B', 'Migrate D', 'Integrate A'],
    decisions: [{ decision: 'Place in B', reason: 'B owns fact source', evidence: ['architect-view'] }],
    openQuestions: [], requirementRefs: [], originalExamples: [example.id],
  };
}
