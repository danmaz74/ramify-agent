import { readFile } from 'node:fs/promises';
import { afterEach, beforeEach, expect, test } from 'vitest';
import type { Script } from '../../../../../agent/src/scripted.js';
import { readAcceptedEvidence, acceptedAnalysisReferences } from '../../../planning/src/evidence.js';
import type { CapabilityRequest } from '../capability/records.js';
import { readRecordedContextSelection } from '../context-selection/recorded.js';
import { runLayout, runRecordSchema } from '../../../../src/run/records.js';
import { type InvocationOutcome } from '../../../../../task-execution/src/records.js';
import { analysis, currentAnalysis, entry } from '../../../../../../src/tests/helpers/analysis.js';
import { copyCapabilityFixture, openCapabilityRuns } from './helpers/capability.js';
import { capabilityFlowBoundaries } from './helpers/capability-flow-boundaries.js';
import { assign, edit, outline, submit, treeInputs, write } from '../../../../../../src/tests/helpers/iterations.js';
import { resetSpawnAttempts, spawnAttempts } from '../../../../../../src/tests/helpers/process-guard.js';
import { runEventsOnDisk, runPath, startRun, stopRun, until } from '../../../../../../src/tests/helpers/runs.js';

const consumer = 'capability-coordination/a';
const provider = 'capability-coordination/b';
const exampleIds = ['capability-example:source-appears', 'capability-example:value-remains'];
const cleanups: Array<() => Promise<void>> = [];
const boundaries: ReturnType<typeof capabilityFlowBoundaries>[] = [];

beforeEach(() => resetSpawnAttempts());
afterEach(async () => {
  const errors: unknown[] = [];
  for (const cleanup of cleanups.splice(0).reverse()) {
    try { await cleanup(); } catch (error) { errors.push(error); }
  }
  for (const answers of boundaries.splice(0)) {
    try { answers.assertComplete(); } catch (error) { errors.push(error); }
  }
  try { expect(spawnAttempts()).toEqual([]); } catch (error) { errors.push(error); }
  if (errors.length > 0) throw new AggregateError(errors, 'Citation reproduction cleanup failed');
});

/** Reproduces ramify-agent-bfn.1 through public tools and the real service.
 * The minimal first delegation uses the same coordinator/package path as the
 * original nested cap-002 failure. Git, provider and audit answers are scripted. */
test.each([
  { name: 'catalog citations beyond the parent package reach the provider', examplesAsCitations: false },
  { name: 'real example citations are rejected and corrected in the same session', examplesAsCitations: true },
])('ramify-agent-bfn.1: $name', async ({ examplesAsCitations }) => {
  const fixture = await copyCapabilityFixture();
  cleanups.push(fixture.remove);
  const answers = capabilityFlowBoundaries(fixture.root, 'delegation', 'a+b');
  boundaries.push(answers);
  let engineerStarts = 0;
  const script: Script = spec => {
    if (spec.role === 'initial-architect') {
      return submit(currentAnalysis(analysis([entry('richer-a-fact', consumer), entry('b-entry', provider)]), 'document:need-plan'));
    }
    if (spec.submission.name === 'submit_work_item_result') return submit(assign(consumer, {}, outline()));
    if (spec.submission.name === 'submit_capability_qualification') {
      const ids = [...spec.prompt.matchAll(/Use request (capability-request:[a-z0-9-]+) and invocation (inv-\d+)/gu)].at(-1);
      if (ids === undefined) throw new Error('Qualification has no request basis');
      return submit({ kind: 'delegate-capability', request: ids[1], invocation: ids[2], taskKey: 'draft:capability-task:richer-fact', provider,
        placementReason: 'B owns the fact', constraints: [], requirementRefs: [] });
    }
    if (spec.role === 'engineer') {
      engineerStarts += 1;
      // Stop as soon as the provider starts; this does not test implementation.
      if (engineerStarts > 1) return [{ kind: 'wait', ms: 60_000 }];
      return submit({ kind: 'capability-needed', summary: 'A needs the richer B fact', request: { requestKey: 'draft:capability-request:richer-fact',
        need: 'Read the fact with its source',
        usage: [{ path: 'subs/a/src/caller.ts', symbol: 'renderA', use: 'Render source', prospective: false }],
        constraints: [], knownInterface: { kind: 'none-known' },
        examples: [
          { key: 'draft:capability-example:source-appears', title: 'Source appears', code: 'expect(renderA()).toContain("B")', designation: 'pseudocode' },
          { key: 'draft:capability-example:value-remains', title: 'Value remains', code: 'expect(renderA()).toContain("old")', designation: 'pseudocode' },
        ],
      } },
      edit('caller.ts', 'Fact: ${value}', 'Fresh fact: ${value}'),
      write('extra.ts', "export const sourceHint = 'B';\n"),
      edit('tests/caller.test.ts', "toBe('Fact: old')", "toBe('this test still fails')"));
    }
    if (spec.role === 'capability-architect') {
      const ids = [...spec.prompt.matchAll(/Use task (capability-task:[a-z0-9-]+), planRevision (\d+) and invocation (inv-\d+)/gu)].at(-1);
      if (ids === undefined) throw new Error('Coordinator has no task basis');
      const action = { task: ids[1], planRevision: Number(ids[2]), invocation: ids[3], kind: 'assign',
        assignment: assign(provider, {
          citedElements: ['functional-requirement:richer-a-fact-request', 'functional-requirement:b-entry-request'],
        }).assignment };
      const invalid = { ...action, assignment: { ...action.assignment,
        citedElements: [...action.assignment.citedElements, ...exampleIds] } };
      return [
        ...(examplesAsCitations ? [
          { kind: 'tool' as const, tool: 'validate_capability_action', input: invalid }, ...submit(invalid),
        ] : []),
        { kind: 'tool', tool: 'validate_capability_action', input: action }, ...submit(action),
      ];
    }
    return [];
  };
  const opened = await openCapabilityRuns(fixture.root, {
    ...answers.options, script: answers.script(script), inputs: treeInputs(),
  });
  cleanups.push(() => opened.service.close());
  const receipt = await opened.service.execute(startRun('need'));
  await until(() => engineerStarts > 1 || (opened.service.events('need', receipt.jobId) ?? [])
    .some(event => event.type === 'job-failed'));

  if (engineerStarts > 1) {
    // Match the version atomically even if the writer-start event advances it.
    let stopped = false;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      try {
        await opened.service.execute(stopRun('need', receipt.jobId, opened.service.getRun('need', receipt.jobId)!.version));
        stopped = true;
        break;
      } catch (error) { if (!String(error).includes('at version')) throw error; }
    }
    expect(stopped).toBe(true);
  }
  await opened.service.settled('need', receipt.jobId);
  const events = await runEventsOnDisk(fixture.root, 'need', receipt.jobId);
  const start = events.find(event => event.type === 'invocation-started' && event.data.role === 'capability-architect');
  if (start?.type !== 'invocation-started') throw new Error('Coordinator did not start');
  const architect = opened.agent!.sessions.find(session => session.spec.role === 'capability-architect')!;
  const preview = architect.results.filter(result => result.tool === 'validate_capability_action');
  expect(preview).toHaveLength(examplesAsCitations ? 2 : 1);
  expect(preview.at(-1)!.isError).toBe(false);
  expect(JSON.parse(preview.at(-1)!.text)).toMatchObject({ valid: true });
  if (examplesAsCitations) {
    expect(preview[0]!.isError).toBe(true);
    expect(JSON.parse(preview[0]!.text)).toMatchObject({ valid: false, issues: exampleIds.map((id, index) => ({
      path: ['assignment', 'citedElements', String(index + 2)], message: expect.stringContaining(id),
    })) });
    expect(architect.verdicts).toMatchObject([{ accepted: false }, { accepted: true }]);
    const rejection = architect.results.find(result => result.tool === 'submit_capability_action' && result.isError);
    for (const id of exampleIds) expect(rejection?.text).toContain(id);
  } else expect(architect.verdicts).toMatchObject([{ accepted: true }]);
  const outcome = JSON.parse(await readFile(runPath(fixture.root, 'need', receipt.jobId,
    runLayout.outcome(start.data.invocation)), 'utf8')) as InvocationOutcome;
  expect(outcome).toMatchObject({ ended: 'submitted', disposition: 'applied', rejectedSubmissions: examplesAsCitations ? 1 : 0 });
  const request = JSON.parse(await readFile(runPath(fixture.root, 'need', receipt.jobId,
    'capabilities/requests/capability-request%3Aricher-fact.json'), 'utf8')) as CapabilityRequest;
  expect(request.original.examples.map(example => example.id)).toEqual(exampleIds);

  const directory = runPath(fixture.root, 'need', receipt.jobId, '');
  const run = runRecordSchema.parse(JSON.parse(await readFile(runPath(fixture.root, 'need', receipt.jobId, runLayout.record), 'utf8')));
  const evidence = await readAcceptedEvidence(directory, run.manifest, acceptedAnalysisReferences(events));
  if (evidence.status !== 'available') throw new Error(evidence.reason);
  const selection = events.find(event => event.type === 'context-selection-recorded');
  if (selection?.type !== 'context-selection-recorded') throw new Error('Parent package was not selected');
  const recorded = await readRecordedContextSelection(directory, selection, evidence.catalog, []);
  if (recorded.status !== 'available') throw new Error(recorded.reason);
  expect(recorded.selection.package.elements).toEqual(['functional-requirement:richer-a-fact-request', 'functional-requirement:richer-a-fact-acceptance']);

  const failure = events.find(event => event.type === 'job-failed');
  const providers = events.filter(event => event.type === 'invocation-started' &&
    event.data.role === 'engineer' && event.data.work.iteration === 'capability-task:richer-fact.i01');
  expect(failure, JSON.stringify(events.slice(-8))).toBeUndefined();
  expect(providers).toHaveLength(1);
  expect(engineerStarts).toBe(2);
  expect(events.filter(event => event.type === 'capability-assigned')).toHaveLength(1);
  expect(opened.agent!.sessions.filter(session => session.spec.role === 'capability-architect')).toHaveLength(1);
}, 30_000);
