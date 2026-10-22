import { OwnershipUnavailableError } from '../../subs/evidence/src/ownership-evidence.js';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import type { Script } from '../../subs/agent/src/scripted.js';
import { analysis, currentAnalysis, entry } from './helpers/analysis.js';
import { copyCapabilityFixture, openCapabilityRuns } from '../../subs/autonomous/subs/work-coordination/src/tests/helpers/capability.js';
import { capabilityFlowBoundaries } from '../../subs/autonomous/subs/work-coordination/src/tests/helpers/capability-flow-boundaries.js';
import { assign, edit, outline, submit, treeInputs, write } from './helpers/iterations.js';
import { forkDeviation, forkEnvironment, unresolved } from '../../subs/autonomous/subs/work-coordination/src/tests/helpers/placement.js';
import { runEventsOnDisk, runPath, startRun, stopRun, until } from './helpers/runs.js';
import { commandResult } from './helpers/command-result.js';

const a = 'capability-coordination/a', b = 'capability-coordination/b';
const scenarioId = 'scenario:richer-a-fact-is-used';
const deviationId = 'plan-deviation:local-review-assertion';
const findingId = 'finding:local-review-assertion';
const workItemId = 'work-item:richer-a-fact';
const capabilityTaskId = 'capability-task:read-b-fact';
const conflict = `${scenarioId} matches globally loaded review-passes support; its World state contract is unavailable to A.`;
const progress = 'Retained selected stored-record review data in subs/a/src/caller.ts';
const retainedSource = "export const renderA = () => 'readable denial';\nexport const selectedRecord = { review: { findings: [] } };\n";
const assertionSource = "import { strict as assert } from 'node:assert';\nimport { Then } from '@cucumber/cucumber';\nimport { selectedRecord } from '../caller.js';\nThen('the selected stored record review passes without findings', () => assert.deepEqual(selectedRecord.review.findings, []));\n";
const remaining = 'Verify the stored-record review assertion against corrected scenario wording';
const points = [{ path: 'subs/a/src/caller.ts', note: 'Retained implementation; inspect before continuing.' },
  { path: 'subs/a/src/tests/caller.test.ts', note: 'Local assertion owned by the next assignment.' }];
const corrected = ['Scenario: A person reviews the stored record locally',
  '  Given the project as the plan finds it', '  When the person uses richer-a-fact',
  '  Then the selected stored record review passes without findings'];
const feature = 'subs/a/src/tests/features/need/capability%3Aricher-a-fact.feature';
const featureSelection = { files: [feature], reason: 'Verify the corrected pending stored-record assertion without adding an obligation' };
const effectiveConfiguration = { paths: ['subs/**/src/tests/features/**/*.feature'], tags: 'not @ramify-pending', name: [], dryRun: false,
  import: ['support/world.mjs', 'support/global-review.steps.mjs'], require: [], requireModule: [], loader: [], worldParameters: { store: 'selected-record' } };
const cleanups: Array<() => Promise<void>> = [];
const answers: ReturnType<typeof capabilityFlowBoundaries>[] = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
  for (const answer of answers.splice(0)) answer.assertComplete();
});

for (const ownership of ['current', 'unavailable'] as const)
for (const coordinator of ['local', 'capability'] as const) test(`${coordinator} ${ownership} correction preserves partial work and assigns a fresh engineer under current acceptance`, async () => {
  const fixture = await copyCapabilityFixture(); cleanups.push(fixture.remove);
  await mkdir(join(fixture.root, 'src/tests'), { recursive: true });
  await writeFile(join(fixture.root, 'src/tests/stale.test.ts'), "expect('old');\n");
  await writeFile(join(fixture.root, 'cucumber.json'), JSON.stringify({ default: effectiveConfiguration }));
  await mkdir(join(fixture.root, 'support'), { recursive: true });
  await writeFile(join(fixture.root, 'support/world.mjs'), "import { setWorldConstructor } from '@cucumber/cucumber'; class ReviewWorld {} setWorldConstructor(ReviewWorld);\n");
  await writeFile(join(fixture.root, 'support/global-review.steps.mjs'), "Then('the review passes with no findings', function () { return this.review.findings.length === 0; });\n");
  const boundary = capabilityFlowBoundaries(fixture.root, coordinator === 'local' ? 'local-correction' : 'correction'); answers.push(boundary);
  let engineer = 0, architect = 0;
  let ownershipUnavailable = false;
  const declarationPath = join(fixture.root, 'subs/a/module.ramify');
  const originalDeclaration = await readFile(declarationPath, 'utf8');
  const missingExportDeclaration = originalDeclaration + '\nexpose-src MissingCompanion from "caller.ts" to parent\n';
  const missingExportDiagnostic = 'subs/a/module.ramify: MissingCompanion is not exported by src/caller.ts (missing-export)';
  const git = { ...boundary.options.git, changedPaths: async (root: string, base?: string) => {
    const paths = await boundary.options.git.changedPaths(root, base);
    return (await readFile(declarationPath, 'utf8')) === originalDeclaration ? paths : [...new Set([...paths, 'subs/a/module.ramify'])];
  } };
  const originalOwnership = boundary.options.ramify.queryOwnershipAnswer.bind(boundary.options.ramify);
  const queryOwnershipAnswer: typeof boundary.options.ramify.queryOwnershipAnswer = async (root, paths) => {
    if (ownershipUnavailable) throw new OwnershipUnavailableError({ status: 'unavailable', failureStatus: 'invalid', reason: missingExportDiagnostic, exitCode: 1,
      stdout: missingExportDiagnostic, stderr: '', report: null, decoded: { diagnostics: [{ id: 'scripted-missing-export', category: 'missing-export', code: 'missing-export', message: missingExportDiagnostic, location: null, related: [], importer: null, original: null, accessId: null }] } });
    return originalOwnership(root, paths);
  };
  const ramify = new Proxy(boundary.options.ramify, { get(target, key, receiver) { return key === 'queryOwnershipAnswer' ? queryOwnershipAnswer : Reflect.get(target, key, receiver); } });
  const inputs = treeInputs();
  const originalRefresh = inputs.refresh;
  inputs.refresh = async root => ownershipUnavailable ? null : originalRefresh(root);
  let originalAssignment = '', originalResult = '', capturedPlan = '', frozenCatalog = '';
  let replacementReceived = false;
  let prepared = 0;
  let coordinatorParked!: () => void;
  const parked = new Promise<void>(resolve => { coordinatorParked = resolve; });
  let releaseCoordinator!: () => void;
  const holdCoordinator = new Promise<void>(resolve => { releaseCoordinator = resolve; });
  // Symbolic reconstruction of the retained revision-preview missing-export failure:
  // source names differ, and external ownership/audit/Cucumber answers are scripted.
  // Original evidence: docs/analysis/2026-10-12-revision-preview-rerun.md, inv-0013.
  const script: Script = spec => {
    if (spec.role === 'initial-architect') {
      const analysed = analysis([entry('richer-a-fact', a), entry('b-entry', b)]);
      analysed.scenarios[0]!.gherkin = ['Scenario: A person reviews the stored record', '  Given the project as the plan finds it', '  When the person uses richer-a-fact', '  Then the review passes with no findings'].join('\n');
      return submit(currentAnalysis(analysed, 'document:need-plan'));
    }
    if (spec.submission.name === 'submit_capability_qualification') {
      const ids = [...spec.prompt.matchAll(/Use request (capability-request:[a-z0-9-]+) and invocation (inv-\d+)/gu)].at(-1)!;
      return submit({ kind: 'delegate-capability', request: ids[1], invocation: ids[2], taskKey: `draft:${capabilityTaskId}`, provider: b,
        placementReason: 'B owns the fact', constraints: [], requirementRefs: [] });
    }
    if (spec.role === 'global-fork') return submit(forkDeviation({
      deviationKey: `draft:${deviationId}`, findingKey: `draft:${findingId}`,
      amends: ['functional-requirement:richer-a-fact-acceptance'], instead: 'Use a distinct local expression asserting the same stored-record review result.',
      why: conflict, rejected: [{ alternative: 'Commission a shared-state helper', reason: 'Equivalent local assertion needs no additional testing interface.' }],
      loss: 'None; the selected stored record still has no review findings.', scenarios: [{ scenario: scenarioId, source: corrected }],
    }));
    if (spec.role === 'engineer') {
      engineer += 1;
      if (coordinator === 'capability' && engineer === 1) return submit({ kind: 'capability-needed', summary: 'A needs source metadata', request: {
        requestKey: 'draft:capability-request:read-b-fact', need: 'Read a B fact and source in A', usage: [{ path: 'subs/a/src/caller.ts', symbol: 'renderA', use: 'Show source', prospective: false }],
        constraints: ['Preserve stored-record behavior'], knownInterface: { kind: 'none-known' },
        examples: [{ key: 'draft:capability-example:b-source-appears', title: 'source appears', code: 'expect(renderA()).toContain("B")', designation: 'pseudocode' }],
      } }, edit('caller.ts', 'Fact: ${value}', 'Fresh fact: ${value}'), write('extra.ts', "export const sourceHint = 'B';\n"),
      edit('tests/caller.test.ts', "toBe('Fact: old')", "toBe('this test still fails')"));
      if (engineer === (coordinator === 'local' ? 1 : 2)) return submit({ kind: 'partial', done: [progress], unfinished: [remaining], findings: [conflict, ...(ownership === 'unavailable' ? [missingExportDiagnostic] : [])], startingPoints: points },
        { kind: 'tool', tool: 'read', input: { path: join(fixture.root, 'support/global-review.steps.mjs') } },
        ...(coordinator === 'local' ? [write('extra.ts', "export const sourceHint = 'B';\n"), edit('tests/caller.test.ts', "toBe('Fact: old')", "toBe('this test still fails')")] : []),
        ...(ownership === 'unavailable' ? [write('../module.ramify', missingExportDeclaration),
          { kind: 'await' as const, until: async () => { ownershipUnavailable = true; } },
          write('caller.ts', retainedSource.replace('readable denial', 'intermediate repair')),
          write('extra.ts', "export const sourceHint = 'B';\nexport const retainedUsefulCorrection = true;\n")] : []),
        write('caller.ts', retainedSource));
      expect(spec.prompt).toContain(progress);
      expect(spec.prompt).toContain(remaining);
      expect(spec.prompt).toContain(conflict);
      expect(spec.prompt).toContain(points[0]!.path);
      expect(spec.prompt).toContain(corrected.at(-1)!);
      expect(spec.prompt).toContain(deviationId);
      expect(spec.prompt).toContain(featureSelection.reason);
      expect(spec.prompt).toContain('support/global-review.steps.mjs');
      expect(spec.prompt).toContain('support/world.mjs');
      expect(spec.prompt).toContain('globally loaded support');
      expect(spec.prompt).toContain('ramify-focused');
      expect(spec.prompt).toContain('The prepared profile enables pending scenarios');
      expect(spec.prompt).toContain('It selects whole files');
      replacementReceived = true;
      return submit({ kind: 'completion-proposed', summary: 'Continued the retained implementation and verified corrected stored-record assertion', findings: [] },
        { kind: 'await', until: async () => { expect(await readFile(join(fixture.root, 'subs/a/src/caller.ts'), 'utf8')).toBe(retainedSource); } },
        write('tests/caller.test.ts', assertionSource),
        ...(ownership === 'unavailable' ? [write('../module.ramify', originalDeclaration)] : []),
        { kind: 'await', until: async () => { ownershipUnavailable = false; } });
    }
    if (spec.submission.name === 'submit_work_item_result' && coordinator === 'capability') return submit(assign(a, {}, outline()));
    if (spec.role === (coordinator === 'local' ? 'local-architect' : 'capability-architect')) {
      architect += 1;
      const ids = [...spec.prompt.matchAll(/Use task (capability-task:[a-z0-9-]+), planRevision (\d+) and invocation (inv-\d+)/gu)].at(-1);
      const basis = ids ? { task: ids[1], planRevision: Number(ids[2]), invocation: ids[3] } : {};
      if (architect === 1) { const choice = assign(a, { goal: 'Implement the existing stored-record review assertion', featureSelection }, coordinator === 'local' ? outline() : undefined); return submit(coordinator === 'local' ? choice : { ...basis, kind: 'assign', assignment: choice.assignment }); }
      if (architect === 2) {
        expect(spec.prompt).toContain(conflict);
        if (ownership === 'unavailable') {
          expect(spec.prompt).toContain('Current architect view refresh unavailable');
          expect(spec.prompt).toContain('Previous durable assignment');
          expect(spec.prompt).toContain('Changed paths compared with accepted Git boundary');
          expect(spec.prompt).toContain(missingExportDiagnostic);
        }
        ownershipUnavailable = false;
        return [{ kind: 'await', until: async () => {
          const run = opened.service.listRuns('need')[0]!;
          const work = coordinator === 'local' ? workItemId : capabilityTaskId;
          originalAssignment = await readFile(runPath(fixture.root, 'need', run.jobId, `work-items/${encodeURIComponent(work)}/iterations/01/assignment.json`), 'utf8');
          originalResult = await readFile(runPath(fixture.root, 'need', run.jobId, `work-items/${encodeURIComponent(work)}/iterations/01/result.json`), 'utf8');
          capturedPlan = await readFile(runPath(fixture.root, 'need', run.jobId, 'input/plan.md'), 'utf8');
          const accepted = opened.service.events('need', run.jobId)!.find(event => event.type === 'analysis-accepted')!;
          if (accepted.type !== 'analysis-accepted') throw new Error('Catalog unavailable');
          frozenCatalog = await readFile(runPath(fixture.root, 'need', run.jobId, accepted.data.evidence.catalog.path), 'utf8');
        } }, ...submit(coordinator === 'local' ? unresolved(conflict, [points[0]!.path]) : { ...basis, kind: 'unresolved', unresolvedRequestKey: 'draft:unresolved-request:review-support-conflict', problem: conflict, evidence: [points[0]!.path] })];
      }
      if (architect === 3) {
        ownershipUnavailable = ownership === 'unavailable';
        expect(spec.prompt).toContain(deviationId);
        expect(spec.prompt).toContain(corrected.at(-1)!);
        const assignment = assign(a, { goal: 'Continue retained work and verify the corrected stored-record assertion',
          approach: 'Reuse retained implementation; assert the same behavior with the authorized local expression.', startingPoints: points, featureSelection });
        return submit(coordinator === 'local' ? assignment : { ...basis, kind: 'assign', assignment: assignment.assignment });
      }
      return [{ kind: 'await', until: async () => {
        // Script execution begins after both invocation preparation records.
        // Hold the coordinator here while teardown samples and submits Stop.
        coordinatorParked();
        await holdCoordinator;
      } }];
    }
    return [];
  };
  const declaredCheck = { id: 'focused-scenarios', executor: { kind: 'command', commands: [{ cmd: 'cucumber-js', args: ['--config', 'cucumber.json'], parser: 'cucumber' }] } };
  const configuredAudit = { ...boundary.options.configuredAudit,
    async read(root: string, commit: string) { const captured = await boundary.options.configuredAudit.read(root, commit); return { ...captured, checks: [...captured.checks, declaredCheck] }; },
    async run(input: Parameters<typeof boundary.options.configuredAudit.run>[0]) {
      return boundary.options.configuredAudit.run({ ...input, configuration: { ...input.configuration,
        checks: input.configuration.checks.filter(check => (check as { id: string }).id !== declaredCheck.id) } });
    },
  };
  const opened = await openCapabilityRuns(fixture.root, { ...boundary.options, git, ramify, configuredAudit, inputs, script: boundary.script(script),
    commandExecution: async request => {
      prepared += 1;
      expect(request.stdin).toContain('cucumber.json');
      return commandResult(request, { stdout: `RAMIFY_CUCUMBER_CONFIGURATION=${JSON.stringify({ schema: 'ramify-agent.cucumber-configuration/1', apiPath: join(fixture.root, 'node_modules/@cucumber/cucumber/lib/api/index.js'), configuration: effectiveConfiguration })}` });
    } });
  cleanups.push(async () => { releaseCoordinator(); await opened.service.close(); });
  const receipt = await opened.service.execute(startRun('need'));
  await until(() => {
    const events = opened.service.events('need', receipt.jobId) ?? [];
    return events.some(event => event.type === 'job-failed') || events.some(event => event.type === (coordinator === 'local' ? 'iteration-closed' : 'capability-assignment-settled') && event.data.outcome === 'accepted');
  }, 40_000);
  const events = await runEventsOnDisk(fixture.root, 'need', receipt.jobId);
  expect(events.filter(event => event.type === 'job-failed'), JSON.stringify(events.slice(-8))).toEqual([]);
  expect(replacementReceived).toBe(true);
  expect(prepared).toBe(2);
  expect(events.filter(event => event.type === 'plan-deviation-recorded')).toHaveLength(1);
  const deviation = JSON.parse(await readFile(runPath(fixture.root, 'need', receipt.jobId, `deviations/${encodeURIComponent(deviationId)}.json`), 'utf8'));
  expect(deviation).toMatchObject({ checkFinding: findingId, held: false, scenarios: [{ scenario: scenarioId, after: corrected }] });
  expect(deviation.scenarios[0].before).toContain('  Then the review passes with no findings');
  expect(events.filter(event => event.type === 'capability-delegated')).toHaveLength(coordinator === 'capability' ? 1 : 0);
  const starts = events.filter(event => event.type === 'invocation-started' && event.data.role === 'engineer');
  const partialStart = starts[coordinator === 'local' ? 0 : 1]!;
  const freshStart = starts.at(-1)!;
  if (partialStart.type !== 'invocation-started' || freshStart.type !== 'invocation-started') throw new Error('Missing engineer starts');
  expect(freshStart.data.session).not.toBe(partialStart.data.session);
  expect(freshStart.data.start).toBe('opened');
  expect(events.find(event => event.type === 'invocation-ended' && event.data.invocation === partialStart.data.invocation)?.data).toMatchObject({ kept: false, finished: 'work-closed' });
  const work = coordinator === 'local' ? workItemId : capabilityTaskId;
  expect(await readFile(runPath(fixture.root, 'need', receipt.jobId, `work-items/${encodeURIComponent(work)}/iterations/01/assignment.json`), 'utf8')).toBe(originalAssignment);
  const assignment = JSON.parse(await readFile(runPath(fixture.root, 'need', receipt.jobId, `work-items/${encodeURIComponent(work)}/iterations/02/assignment.json`), 'utf8'));
  expect(assignment.featureSelection).toEqual(featureSelection);
  expect(assignment.scope.base.module).toBe(a);
  if (ownership === 'unavailable') expect(assignment.scope.resolved.sourceAuthority).toMatch(/^[a-f0-9]{64}$/u);
  if (ownership === 'unavailable') {
    expect(await readFile(declarationPath, 'utf8')).toBe(originalDeclaration);
    expect(await readFile(join(fixture.root, 'subs/a/src/extra.ts'), 'utf8')).toContain('retainedUsefulCorrection');
    const outcome = JSON.parse(await readFile(runPath(fixture.root, 'need', receipt.jobId, `invocations/${partialStart.data.invocation}/outcome.json`), 'utf8'));
    expect(outcome.outsideScope).toEqual([]);
    expect(outcome.unknownPlacement).toContain('subs/a/module.ramify');
  }
  expect(await readFile(runPath(fixture.root, 'need', receipt.jobId, `work-items/${encodeURIComponent(work)}/iterations/01/result.json`), 'utf8')).toBe(originalResult);
  expect(await readFile(runPath(fixture.root, 'need', receipt.jobId, 'input/plan.md'), 'utf8')).toBe(capturedPlan);
  const accepted = events.find(event => event.type === 'analysis-accepted')!;
  if (accepted.type !== 'analysis-accepted') throw new Error('Catalog unavailable');
  expect(await readFile(runPath(fixture.root, 'need', receipt.jobId, accepted.data.evidence.catalog.path), 'utf8')).toBe(frozenCatalog);
  expect(await readFile(join(fixture.root, 'subs/a/src/tests/caller.test.ts'), 'utf8')).toBe(assertionSource);
  const scenario = JSON.parse(await readFile(runPath(fixture.root, 'need', receipt.jobId, `scenarios/${encodeURIComponent(scenarioId)}.json`), 'utf8'));
  expect(scenario.source).toEqual(corrected);
  expect(await readFile(join(fixture.root, scenario.file), 'utf8')).toContain(corrected.at(-1)!);
  await parked;
  const stoppedAt = opened.service.events('need', receipt.jobId)!;
  const waiting = stoppedAt.filter(event => event.type === 'invocation-started' && event.data.role === (coordinator === 'local' ? 'local-architect' : 'capability-architect')).at(-1)!;
  if (waiting.type !== 'invocation-started') throw new Error('Missing parked coordinator invocation');
  const preparation = stoppedAt.filter(event => event.type === 'invocation-prepared' && event.data.invocation === waiting.data.invocation);
  expect(preparation.map(event => event.type === 'invocation-prepared' ? event.data.recorded : null)).toEqual(['delivered-inputs', 'operation-identity']);
  const current = opened.service.getRun('need', receipt.jobId)!;
  expect(current.version).toBe(preparation.at(-1)!.sequence);
  await opened.service.execute(stopRun('need', receipt.jobId, current.version));
  releaseCoordinator();
  await opened.service.settled('need', receipt.jobId);
}, 60_000);

for (const authority of ['absent', 'missing-blob'] as const)
for (const coordinator of ['local', 'capability'] as const) test(`${coordinator} ${authority} repair authority reaches the environment path without issuing an assignment`, async () => {
  const fixture = await copyCapabilityFixture(); cleanups.push(fixture.remove);
  const boundary = capabilityFlowBoundaries(fixture.root, coordinator === 'local' ? 'no-authority' : 'delegation'); answers.push(boundary);
  let unavailable = false;
  const original = boundary.options.ramify.queryOwnershipAnswer.bind(boundary.options.ramify);
  const query: typeof original = async (root, paths) => {
    if (unavailable) throw new OwnershipUnavailableError({ status: 'unavailable', failureStatus: 'invalid', reason: 'invalid boundary configuration', exitCode: 1,
      stdout: 'invalid boundary configuration', stderr: '', report: null, decoded: null });
    return original(root, paths);
  };
  const ramify = new Proxy(boundary.options.ramify, { get(target, key, receiver) { return key === 'queryOwnershipAnswer' ? query : Reflect.get(target, key, receiver); } });
  const blocked = 'subs/a/src/caller.ts has no recorded assignment boundary; current ownership is unavailable';
  let assigningInvocation = '', engineers = 0, architects = 0;
  let removedBlob = false;
  const script: Script = spec => {
    if (spec.role === 'initial-architect') return submit(currentAnalysis(analysis([entry('richer-a-fact', a), entry('b-entry', b)]), 'document:need-plan'));
    if (spec.submission.name === 'submit_capability_qualification') {
      const ids = [...spec.prompt.matchAll(/Use request (capability-request:[a-z0-9-]+) and invocation (inv-\d+)/gu)].at(-1)!;
      return submit({ kind: 'delegate-capability', request: ids[1], invocation: ids[2], taskKey: `draft:${capabilityTaskId}`, provider: b, placementReason: 'B owns the fact', constraints: [], requirementRefs: [] });
    }
    if (spec.role === 'engineer') {
      engineers += 1;
      if (coordinator === 'local' || engineers > 1) return submit({ kind: 'partial', done: [progress], unfinished: [remaining], findings: [blocked], startingPoints: points }, write('caller.ts', retainedSource));
      return submit({ kind: 'capability-needed', summary: 'A needs the fact', request: {
      requestKey: 'draft:capability-request:read-b-fact', need: 'Read a B fact and source in A', usage: [{ path: 'subs/a/src/caller.ts', symbol: 'renderA', use: 'Show source', prospective: false }],
      constraints: [], knownInterface: { kind: 'none-known' }, examples: [{ key: 'draft:capability-example:b-fact-appears', title: 'fact', code: 'renderA()', designation: 'pseudocode' }],
    } }, edit('caller.ts', 'Fact: ${value}', 'Fresh fact: ${value}'), write('extra.ts', "export const sourceHint = 'B';\n"),
    edit('tests/caller.test.ts', "toBe('Fact: old')", "toBe('this test still fails')"));
    }
    if (spec.role === 'global-fork') return [
      ...submit(forkDeviation({ deviationKey: `draft:${deviationId}`, findingKey: `draft:${findingId}`, amends: ['functional-requirement:richer-a-fact-acceptance'], instead: 'Use a local expression after repairing the boundary.', why: blocked, rejected: [], loss: 'None', scenarios: [{ scenario: scenarioId, source: corrected }] })),
      ...submit(forkEnvironment(blocked, 'Restore boundary configuration or supply a verified assignment for the exact blocked target.')),
    ];
    if (spec.submission.name === 'submit_work_item_result' && coordinator === 'capability') return submit(assign(a, {}, outline()));
    if (spec.role === (coordinator === 'local' ? 'local-architect' : 'capability-architect')) {
      architects += 1;
      const ids = [...spec.prompt.matchAll(/Use task (capability-task:[a-z0-9-]+), planRevision (\d+) and invocation (inv-\d+)/gu)].at(-1);
      const basis = ids ? { task: ids[1], planRevision: Number(ids[2]), invocation: ids[3] } : {};
      assigningInvocation = ids?.[3] ?? '';
      const assignment = assign(a, {}, coordinator === 'local' ? outline() : undefined);
      if (authority === 'missing-blob' && architects === 1) return submit(coordinator === 'local' ? assignment : { ...basis, kind: 'assign', assignment: assignment.assignment });
      unavailable = true;
      if (authority === 'missing-blob') expect(spec.prompt).toContain('Historical repair authority unavailable');
      return [...submit(coordinator === 'local' ? assignment : { ...basis, kind: 'assign', assignment: assignment.assignment }),
        ...submit(coordinator === 'local' ? unresolved(blocked, ['subs/a/src/caller.ts']) : { ...basis, kind: 'unresolved', unresolvedRequestKey: 'draft:unresolved-request:ownership-unavailable', problem: blocked, evidence: ['subs/a/src/caller.ts'] })];
    }
    return [];
  };
  const opened = await openCapabilityRuns(fixture.root, { ...boundary.options, ramify, inputs: treeInputs(), script: boundary.script(script),
    afterWrite: async (write, runId) => {
      if (authority !== 'missing-blob' || removedBlob || write !== 'iteration-closed') return;
      const events = opened.service.events('need', runId) ?? [];
      const closed = events.filter(event => event.type === 'iteration-closed').at(-1);
      if (closed?.type !== 'iteration-closed' || closed.data.outcome !== 'partial') return;
      const reference = events.filter(event => event.type === 'ownership-evidence-retained').at(-1);
      if (reference?.type !== 'ownership-evidence-retained') throw new Error('Expected recorded ownership evidence');
      await rm(runPath(fixture.root, 'need', runId, `blobs/${reference.data.hash}`));
      removedBlob = true; unavailable = true;
    },
  });
  cleanups.push(() => opened.service.close());
  const receipt = await opened.service.execute(startRun('need'));
  await until(() => (opened.service.events('need', receipt.jobId) ?? []).some(event => ['environment-reported', 'job-failed'].includes(event.type)), 40_000);
  const events = opened.service.events('need', receipt.jobId)!;
  expect(events.filter(event => event.type === 'job-failed'), JSON.stringify(events.slice(-8))).toEqual([]);
  expect(events.some(event => event.type === 'environment-reported')).toBe(true);
  expect(events.filter(event => event.type === (coordinator === 'local' ? 'iteration-assigned' : 'capability-assigned'))).toHaveLength(authority === 'missing-blob' ? 1 : 0);
  expect(events.filter(event => event.type === 'plan-deviation-recorded')).toHaveLength(0);
  const reportPath = runPath(fixture.root, 'need', receipt.jobId, 'environment/environment-problem%3Amissing-build.json');
  await until(async () => readFile(reportPath).then(() => true, error => {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
    throw error;
  }));
  const report = JSON.parse(await readFile(reportPath, 'utf8'));
  expect(report.diagnosis).toBe(blocked);
  expect(coordinator === 'local' || assigningInvocation !== '').toBe(true);
  const current = opened.service.getRun('need', receipt.jobId)!;
  await opened.service.execute(stopRun('need', receipt.jobId, current.version));
  await opened.service.settled('need', receipt.jobId);
}, 60_000);
