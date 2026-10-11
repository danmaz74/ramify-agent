import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import type { Script } from '../../subs/agent/src/scripted.js';
import { analysis, entry } from './helpers/analysis.js';
import { copyCapabilityFixture, openCapabilityRuns } from './helpers/capability.js';
import { capabilityFlowBoundaries } from './helpers/capability-flow-boundaries.js';
import { assign, edit, outline, submit, treeInputs, write } from './helpers/iterations.js';
import { forkDeviation, unresolved } from './helpers/placement.js';
import { runEventsOnDisk, runPath, startRun, stopRun, until } from './helpers/runs.js';

const a = 'capability-coordination/a', b = 'capability-coordination/b';
const conflict = 'sc-001 matches globally loaded review-passes support; its World state contract is unavailable to A.';
const progress = 'Retained selected stored-record review data in subs/a/src/caller.ts';
const retainedSource = "export const renderA = () => 'readable denial';\nexport const selectedRecord = { review: { findings: [] } };\n";
const assertionSource = "import { strict as assert } from 'node:assert';\nimport { Then } from '@cucumber/cucumber';\nimport { selectedRecord } from '../caller.js';\nThen('the selected stored record review passes without findings', () => assert.deepEqual(selectedRecord.review.findings, []));\n";
const remaining = 'Verify the stored-record review assertion against corrected scenario wording';
const points = [{ path: 'subs/a/src/caller.ts', note: 'Retained implementation; inspect before continuing.' },
  { path: 'subs/a/src/tests/caller.test.ts', note: 'Local assertion owned by the next assignment.' }];
const corrected = ['Scenario: A person reviews the stored record locally',
  '  Given the project as the plan finds it', '  When the person uses richer-a-fact',
  '  Then the selected stored record review passes without findings'];
const cleanups: Array<() => Promise<void>> = [];
const answers: ReturnType<typeof capabilityFlowBoundaries>[] = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
  for (const answer of answers.splice(0)) answer.assertComplete();
});

for (const coordinator of ['local', 'capability'] as const) test(`${coordinator} correction preserves partial work and assigns a fresh engineer under current acceptance`, async () => {
  const fixture = await copyCapabilityFixture(); cleanups.push(fixture.remove);
  await mkdir(join(fixture.root, 'src/tests'), { recursive: true });
  await writeFile(join(fixture.root, 'src/tests/stale.test.ts'), "expect('old');\n");
  const boundary = capabilityFlowBoundaries(fixture.root, coordinator === 'local' ? 'local-correction' : 'correction'); answers.push(boundary);
  let engineer = 0, architect = 0;
  let originalAssignment = '', originalResult = '', capturedPlan = '', frozenCatalog = '';
  let replacementReceived = false;
  // This verifies workflow and immutable evidence; audit/Cucumber answers are scripted, not native binding execution.
  const script: Script = spec => {
    if (spec.role === 'initial-architect') {
      const analysed = analysis([entry('richer-a-fact', a), entry('b-entry', b)]);
      analysed.scenarios[0]!.gherkin = ['Scenario: A person reviews the stored record', '  Given the project as the plan finds it', '  When the person uses richer-a-fact', '  Then the review passes with no findings'].join('\n');
      return submit(analysed);
    }
    if (spec.submission.name === 'submit_capability_qualification') {
      const ids = [...spec.prompt.matchAll(/Use request (need-\d+) and invocation (inv-\d+)/gu)].at(-1)!;
      return submit({ kind: 'delegate-capability', request: ids[1], invocation: ids[2], provider: b,
        placementReason: 'B owns the fact', constraints: [], requirementRefs: [] });
    }
    if (spec.role === 'global-fork') return submit(forkDeviation({
      amends: ['fr-002'], instead: 'Use a distinct local expression asserting the same stored-record review result.',
      why: conflict, rejected: [{ alternative: 'Commission a shared-state helper', reason: 'Equivalent local assertion needs no additional testing interface.' }],
      loss: 'None; the selected stored record still has no review findings.', scenarios: [{ scenario: 'sc-001', source: corrected }],
    }));
    if (spec.role === 'engineer') {
      engineer += 1;
      if (coordinator === 'capability' && engineer === 1) return submit({ kind: 'capability-needed', summary: 'A needs source metadata', request: {
        need: 'Read a B fact and source in A', usage: [{ path: 'subs/a/src/caller.ts', symbol: 'renderA', use: 'Show source', prospective: false }],
        constraints: ['Preserve stored-record behavior'], knownInterface: { kind: 'none-known' },
        examples: [{ title: 'source appears', code: 'expect(renderA()).toContain("B")', designation: 'pseudocode' }],
      } }, edit('caller.ts', 'Fact: ${value}', 'Fresh fact: ${value}'), write('extra.ts', "export const sourceHint = 'B';\n"),
      edit('tests/caller.test.ts', "toBe('Fact: old')", "toBe('this test still fails')"));
      if (engineer === (coordinator === 'local' ? 1 : 2)) return submit({ kind: 'partial', done: [progress], unfinished: [remaining], findings: [conflict], startingPoints: points },
        ...(coordinator === 'local' ? [write('extra.ts', "export const sourceHint = 'B';\n"), edit('tests/caller.test.ts', "toBe('Fact: old')", "toBe('this test still fails')")] : []),
        write('caller.ts', retainedSource));
      expect(spec.prompt).toContain(progress);
      expect(spec.prompt).toContain(remaining);
      expect(spec.prompt).toContain(conflict);
      expect(spec.prompt).toContain(points[0]!.path);
      expect(spec.prompt).toContain(corrected.at(-1)!);
      expect(spec.prompt).toContain('pd-001');
      replacementReceived = true;
      return submit({ kind: 'completion-proposed', summary: 'Continued the retained implementation and verified corrected stored-record assertion', findings: [] },
        { kind: 'await', until: async () => { expect(await readFile(join(fixture.root, 'subs/a/src/caller.ts'), 'utf8')).toBe(retainedSource); } },
        write('tests/caller.test.ts', assertionSource));
    }
    if (spec.submission.name === 'submit_work_item_result' && coordinator === 'capability') return submit(assign(a, {}, outline()));
    if (spec.role === (coordinator === 'local' ? 'local-architect' : 'capability-architect')) {
      architect += 1;
      const ids = [...spec.prompt.matchAll(/Use task (cap-\d+), planRevision (\d+) and invocation (inv-\d+)/gu)].at(-1);
      const basis = ids ? { task: ids[1], planRevision: Number(ids[2]), invocation: ids[3] } : {};
      if (architect === 1) { const choice = assign(a, { goal: 'Implement the existing stored-record review assertion' }, coordinator === 'local' ? outline() : undefined); return submit(coordinator === 'local' ? choice : { ...basis, kind: 'assign', assignment: choice.assignment }); }
      if (architect === 2) {
        expect(spec.prompt).toContain(conflict);
        return [{ kind: 'await', until: async () => {
          const run = opened.service.listRuns('need')[0]!;
          const work = coordinator === 'local' ? 'wi-001' : 'cap-001';
          originalAssignment = await readFile(runPath(fixture.root, 'need', run.jobId, `work-items/${work}/iterations/01/assignment.json`), 'utf8');
          originalResult = await readFile(runPath(fixture.root, 'need', run.jobId, `work-items/${work}/iterations/01/result.json`), 'utf8');
          capturedPlan = await readFile(runPath(fixture.root, 'need', run.jobId, 'input/plan.md'), 'utf8');
          const accepted = opened.service.events('need', run.jobId)!.find(event => event.type === 'analysis-accepted')!;
          if (accepted.type !== 'analysis-accepted') throw new Error('Catalog unavailable');
          frozenCatalog = await readFile(runPath(fixture.root, 'need', run.jobId, accepted.data.evidence.catalog.path), 'utf8');
        } }, ...submit(coordinator === 'local' ? unresolved(conflict, [points[0]!.path]) : { ...basis, kind: 'unresolved', problem: conflict, evidence: [points[0]!.path] })];
      }
      if (architect === 3) {
        expect(spec.prompt).toContain('pd-001');
        expect(spec.prompt).toContain(corrected.at(-1)!);
        const assignment = assign(a, { goal: 'Continue retained work and verify the corrected stored-record assertion',
          approach: 'Reuse retained implementation; assert the same behavior with the authorized local expression.', startingPoints: points });
        return submit(coordinator === 'local' ? assignment : { ...basis, kind: 'assign', assignment: assignment.assignment });
      }
      return [{ kind: 'wait', ms: 60_000 }];
    }
    return [];
  };
  const opened = await openCapabilityRuns(fixture.root, { ...boundary.options, inputs: treeInputs(), script: boundary.script(script) });
  cleanups.push(() => opened.service.close());
  const receipt = await opened.service.execute(startRun('need'));
  await until(() => {
    const events = opened.service.events('need', receipt.jobId) ?? [];
    return events.some(event => event.type === 'job-failed') || events.some(event => event.type === (coordinator === 'local' ? 'iteration-closed' : 'capability-assignment-settled') && event.data.outcome === 'accepted');
  }, 40_000);
  const events = await runEventsOnDisk(fixture.root, 'need', receipt.jobId);
  expect(events.filter(event => event.type === 'job-failed'), JSON.stringify(events.slice(-8))).toEqual([]);
  expect(replacementReceived).toBe(true);
  expect(events.filter(event => event.type === 'plan-deviation-recorded')).toHaveLength(1);
  const deviation = JSON.parse(await readFile(runPath(fixture.root, 'need', receipt.jobId, 'deviations/pd-001.json'), 'utf8'));
  expect(deviation).toMatchObject({ checkFinding: 'cf-0001', held: false, scenarios: [{ scenario: 'sc-001', after: corrected }] });
  expect(deviation.scenarios[0].before).toContain('  Then the review passes with no findings');
  expect(events.filter(event => event.type === 'capability-delegated')).toHaveLength(coordinator === 'capability' ? 1 : 0);
  const starts = events.filter(event => event.type === 'invocation-started' && event.data.role === 'engineer');
  const partialStart = starts[coordinator === 'local' ? 0 : 1]!;
  const freshStart = starts.at(-1)!;
  if (partialStart.type !== 'invocation-started' || freshStart.type !== 'invocation-started') throw new Error('Missing engineer starts');
  expect(freshStart.data.session).not.toBe(partialStart.data.session);
  expect(freshStart.data.start).toBe('opened');
  expect(events.find(event => event.type === 'invocation-ended' && event.data.invocation === partialStart.data.invocation)?.data).toMatchObject({ kept: false, finished: 'work-closed' });
  const work = coordinator === 'local' ? 'wi-001' : 'cap-001';
  expect(await readFile(runPath(fixture.root, 'need', receipt.jobId, `work-items/${work}/iterations/01/assignment.json`), 'utf8')).toBe(originalAssignment);
  expect(await readFile(runPath(fixture.root, 'need', receipt.jobId, `work-items/${work}/iterations/01/result.json`), 'utf8')).toBe(originalResult);
  expect(await readFile(runPath(fixture.root, 'need', receipt.jobId, 'input/plan.md'), 'utf8')).toBe(capturedPlan);
  const accepted = events.find(event => event.type === 'analysis-accepted')!;
  if (accepted.type !== 'analysis-accepted') throw new Error('Catalog unavailable');
  expect(await readFile(runPath(fixture.root, 'need', receipt.jobId, accepted.data.evidence.catalog.path), 'utf8')).toBe(frozenCatalog);
  expect(await readFile(join(fixture.root, 'subs/a/src/tests/caller.test.ts'), 'utf8')).toBe(assertionSource);
  const scenario = JSON.parse(await readFile(runPath(fixture.root, 'need', receipt.jobId, 'scenarios/sc-001.json'), 'utf8'));
  expect(scenario.source).toEqual(corrected);
  expect(await readFile(join(fixture.root, scenario.file), 'utf8')).toContain(corrected.at(-1)!);
  await until(() => (opened.service.events('need', receipt.jobId) ?? []).filter(event => event.type === 'invocation-started' && event.data.role === (coordinator === 'local' ? 'local-architect' : 'capability-architect')).length >= 4);
  const current = opened.service.getRun('need', receipt.jobId)!;
  await opened.service.execute(stopRun('need', receipt.jobId, current.version));
  await opened.service.settled('need', receipt.jobId);
}, 60_000);
