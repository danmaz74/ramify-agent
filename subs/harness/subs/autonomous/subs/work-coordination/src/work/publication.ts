import { resolveRealTarget } from '../../../../../../src/guard/resolve-contained-path.js';
import type { WriteScope } from '../../../../../../src/work/scope.js';
import type { ContractRecord } from '../contracts/records.js';
import type { RecordRef as CommitRecord } from '../../../../../../src/jobs/commit.js';
import { canonicalJson } from '../../../../../../src/jobs/commands.js';
import type { ArchitectRef, DurableRecordRef as RecordRef } from '../../../../../task-execution/src/records.js';
import type { RunEventInput } from '../../../../src/run/log.js';
import { workItemOutlineSchema, workLayout, type WorkItem, type WorkItemOutline } from './records.js';
import { iterationLayout, type IterationAssignment } from './iterations.js';
import { unchangedOutlineReason, type OutlineBody } from './submission.js';
import { committedRecords } from '../../../../src/run/committed-records.js';
import { eventsOf, pendingCorrection, type CoordinationHistory } from './history.js';

export interface OutlinePublicationInput {
  readonly item: WorkItem;
  readonly invocation: string;
  readonly outline: OutlineBody;
  readonly hypothesesSeen: readonly RecordRef[];
  readonly architectRef?: ArchitectRef | null | undefined;
}
export interface AssignmentPublicationInput {
  readonly item: WorkItem;
  readonly number: number;
  readonly invocation: string;
  readonly assignment: IterationAssignment;
  readonly decisions: readonly string[];
  readonly localRecords: readonly CommitRecord[];
  readonly architectRef: ArchitectRef | null;
}
export interface CoordinationPublication {
  readonly event: RunEventInput;
  readonly records: readonly CommitRecord[];
}
export interface OutlinePublication {
  readonly outline: WorkItemOutline;
  readonly written: boolean;
  readonly unchanged: boolean;
  readonly transition?: CoordinationPublication;
}

/** Derive the exact accepted outline revision from the same committed history as its assignment. */
export function prepareOutlinePublication(history: CoordinationHistory, input: OutlinePublicationInput): OutlinePublication {
  const { item, invocation } = input;
  const prior = eventsOf(history.events, 'outline-revised').find(event => event.data.workItem === item.id && event.data.invocation === invocation);
  if (prior !== undefined) {
    const path = workLayout.outline(item.id, prior.data.revision);
    const body = history.lines.flatMap(line => line.transaction.records).find(record => record.path === path)?.body;
    const outline = workItemOutlineSchema.parse(body);
    const unchanged = prior.data.unchanged === true;
    if (!unchanged && outline.invocation !== invocation) throw new Error(`The outline revision ${prior.data.revision} of ${item.id} no longer names ${invocation}`);
    return { outline, written: false, unchanged };
  }
  const committed = committedRecords(history.lines).outlines.get(item.id) ?? [];
  const standing = committed.at(-1);
  if (input.architectRef !== undefined && standing !== undefined && standsOn(input.outline, standing)) {
    return { outline: standing, written: true, unchanged: true, transition: {
      event: { type: 'outline-revised', data: { workItem: item.id, revision: standing.revision, invocation, architectRef: input.architectRef, unchanged: true } }, records: [],
    } };
  }
  const revision = committed.length + 1;
  const outline = workItemOutlineSchema.parse({ schema: 'ramify-agent.work-item-outline/2', workItem: item.id, revision, invocation, ...input.outline,
    hypothesesSeen: input.hypothesesSeen.map(ref => ({ ...ref })),
  } satisfies WorkItemOutline);
  return { outline, written: true, unchanged: false, transition: {
    event: { type: 'outline-revised', data: { workItem: item.id, revision, invocation, ...(input.architectRef === undefined ? {} : { architectRef: input.architectRef }) } },
    records: [{ path: workLayout.outline(item.id, revision), id: item.id, revision, body: outline }],
  } };
}

/** Assignment, local decisions and correction reference are one proposed lifecycle transition. */
export function prepareAssignmentPublication(history: CoordinationHistory, input: AssignmentPublicationInput): CoordinationPublication {
  const { item, assignment } = input;
  const corrects = pendingCorrection(history, item.id);
  return { event: { type: 'iteration-assigned', data: {
    workItem: item.id, iteration: assignment.id, kind: assignment.kind, scopeRevision: assignment.scope.revision, invocation: input.invocation,
    decisions: [...input.decisions], architectRef: input.architectRef, ...(corrects === undefined ? {} : { corrects }),
  } }, records: [{ path: iterationLayout.assignment(item.id, input.number), id: assignment.id, revision: 1, body: assignment }, ...input.localRecords] };
}

function standsOn(outline: OutlineBody, committed: WorkItemOutline): boolean {
  const plan = (body: OutlineBody | WorkItemOutline) => canonicalJson({ changes: body.changes, decomposition: body.decomposition, reuse: body.reuse,
    breakingChanges: body.breakingChanges, stages: body.stages });
  return plan(outline) === plan(committed)
    && (outline.revisionReason === committed.revisionReason || outline.revisionReason === unchangedOutlineReason(committed.revision));
}

export async function authorizedScope(projectRoot: string, scope: WriteScope, authorizations: readonly { readonly path: string }[]): Promise<WriteScope> {
  for (const authorization of authorizations) {
    const target = await resolveRealTarget(projectRoot, authorization.path);
    if (target.ok && !scope.resolved.files.includes(target.resolved)) scope.resolved.files.push(target.resolved);
  }
  return scope;
}
export function requiredArtifacts(committed: ReturnType<typeof committedRecords>): Array<{ path: string; contract: ContractRecord }> {
  const artifacts: Array<{ path: string; contract: ContractRecord }> = [];
  for (const contract of committed.contracts.values()) {
    const paths = [
      ...contract.artifacts.interface.map(entry => entry.path),
      ...contract.artifacts.conformance.map(entry => entry.path),
      ...contract.artifacts.fake.map(entry => entry.path),
    ];
    for (const path of paths) artifacts.push({ path, contract });
  }
  return artifacts;
}
