import { readdirSync, readFileSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { createApp } from '../http/app.js';
import { protocolPaths } from '../interfaces/protocol/paths.js';
import {
  analysisResponseSchema, capabilityListResponseSchema, gateResponseSchema, runEventPageSchema, scenarioListResponseSchema,
  type ScenarioGateResult,
} from '../interfaces/protocol/runs.js';
import { RunQueries } from '../../subs/projections/src/queries.js';
import { createQuerySource } from '../http/query-source.js';
import { requestCompletion } from './helpers/analysis.js';
import { accepted, modified, unchanged } from '../../subs/autonomous/subs/work-coordination/src/tests/helpers/contracts-git.js';
import type { DirectCheckScript, ScriptedScenario } from './helpers/direct-check-execution.js';
import { expectNoProcesses, forgetExternalTools } from './helpers/external-tools.js';
import {
  bindAtAncestor, bindCommit, bindTurn, entryCommits, entryTurns, finalSubject, integrationFeature, integrationProject, noteFeature, notes, plan, planScenario,
  reviews, runIntegration, tagFeature, tags, tagStepFile, tagSteps, type Cleanups,
} from './helpers/integration-scenario.js';
import { completionProposed, submit, write } from './helpers/iterations.js';

/*
 * The scenarios a client reads, Plan 10 iteration 10: the scenario list with
 * each scenario's state and the gates that ran it, the review's frozen text
 * and warnings on the analysis, each entry's scenario count in the
 * capability progress, the per-scenario results on a gate attempt, read
 * for display from its configured scenario check's raw output, and the
 * scenario references of projected events.
 *
 * The scripted run is the composition failure of
 * `helpers/integration-scenario.ts`: two entry sub-scenarios bound in their
 * own modules, and the integration scenario bound at their ancestor, which
 * fails once while its sub-scenarios pass and passes at the repair round.
 */

vi.mock('node:child_process', async original =>
  (await import('./helpers/process-guard.js')).guardedChildProcess(await original<typeof import('node:child_process')>()));

const cleanups: Cleanups = [];
afterEach(async () => {
  try {
    for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
    expectNoProcesses();
  } finally { forgetExternalTools(); }
});

const failure = { step: 'Then the outcome review-tags promises is shown', message: 'expected the tag on the note, got no note' };

/**
 * What the project's configured scenario check reports over the tree a
 * gate's commit leaves: every tracked scenario without the pending tag, as
 * its `not @ramify-pending` profile selects them, passing.
 */
function runnableScenarios(root: string): ScriptedScenario[] {
  const files = (readdirSync(root, { recursive: true }) as string[])
    .filter(path => path.endsWith('.feature') && !path.split('/').includes('node_modules')).sort();
  return files.flatMap(file => readFileSync(join(root, file), 'utf8').split('\n').flatMap((text, index) => {
    const tags = text.trim().split(/\s+/);
    const identity = tags.find(tag => /^@ramify-scenario-[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tag));
    if (identity === undefined || tags.includes('@ramify-pending')) return [];
    return [{ id: `scenario:${identity.slice('@ramify-scenario-'.length)}`, status: 'passed' as const, file, line: index + 1 }];
  }));
}

/** The integration scenario's first iteration gate fails it while its sub-scenarios pass. */
function failingOnce(root: string): DirectCheckScript {
  let failed = false;
  return ({ check, context }) => {
    if (check.kind !== 'scenarios') return {};
    const runnable = runnableScenarios(root);
    if (context.checkpoint !== 'iteration' || failed || !runnable.some(result => result.id === 'scenario:a-written-note-is-shown-with-its-tag')) return { scenarios: runnable };
    failed = true;
    return {
      outcome: { kind: 'completed', exitCode: 1 },
      scenarios: runnable.map(result => (result.id !== 'scenario:a-written-note-is-shown-with-its-tag' ? result : { ...result, status: 'failed' as const, failure })),
    };
  };
}

async function composedRun() {
  const root = await integrationProject(cleanups);
  const opened = await runIntegration(cleanups, root, {
    ...entryTurns,
    'local-architect:work-item:bind-a-written-note-is-shown-with-its-tag': [submit(bindAtAncestor), submit(requestCompletion())],
    'engineer:work-item:bind-a-written-note-is-shown-with-its-tag': [
      bindTurn,
      submit(completionProposed('The tags\' Given now writes the note.', { bindings: [{ id: 'scenario:a-written-note-is-shown-with-its-tag' }] }),
        write('tests/steps/review-tags.steps.ts', tagStepFile.replace("Given('a note was written with review-note', () => {});", "Given('a note was written with review-note', () => { /* as review-note does */ });"))),
    ],
  }, [...entryCommits, bindCommit, accepted('work-item:bind-a-written-note-is-shown-with-its-tag.i01', 'revision-04', modified(tagSteps)), unchanged('work-item:bind-a-written-note-is-shown-with-its-tag'), unchanged(finalSubject)],
  failingOnce(root));
  return { root, ...opened };
}

const where = (gate: ScenarioGateResult) => [gate.checkpoint, gate.subject.iteration ?? gate.subject.workItem ?? null, gate.check, gate.status];

describe('over a scripted run with an integration scenario', () => {
  test('the scenario list, the review, the progress counts, the gate summary and the event references agree with the run', async () => {
    const { service, runId } = await composedRun();
    const queries = new RunQueries(createQuerySource(service));
    const snapshot = await queries.run(plan, runId);
    expect(snapshot.run.state).toBe('completed');

    // The scenario list: every tracked scenario with its state, origin, work item, owner and file.
    const list = scenarioListResponseSchema.parse(await queries.scenarios(plan, runId));
    expect(list.total).toBe(3);
    expect(list.scenarios.map(one => [one.id, one.kind, one.state, one.entry, one.partOf, one.subScenarios, one.workItem, one.owner, one.file])).toEqual([
      ['scenario:note-for-tags', 'entry', 'done', 'capability:review-note', 'scenario:a-written-note-is-shown-with-its-tag', [], 'work-item:review-note', notes, noteFeature],
      ['scenario:tags-on-note', 'entry', 'done', 'capability:review-tags', 'scenario:a-written-note-is-shown-with-its-tag', [], 'work-item:review-tags', tags, tagFeature],
      ['scenario:a-written-note-is-shown-with-its-tag', 'integration', 'done', null, null, ['scenario:note-for-tags', 'scenario:tags-on-note'], 'work-item:bind-a-written-note-is-shown-with-its-tag', reviews, integrationFeature],
    ]);
    expect(list.scenarios[0]!.origin).toEqual({ kind: 'architect', refs: ['functional-requirement:review-note-acceptance'] });
    const [first, , integration] = list.scenarios;
    expect(integration!.origin).toMatchObject({ kind: 'plan', planScenario: 'plan-scenario:a-written-note-is-shown-with-its-tag' });
    expect(integration!.name).toBe('A written note is shown with its tag');

    // The gates whose audit ran it, with the status its configured scenario
    // check gave the scenario there: the integration scenario failed at its
    // first iteration gate while its sub-scenarios passed, and passed at the repair.
    const bindGates = integration!.gates.filter(gate => gate.subject.iteration === 'work-item:bind-a-written-note-is-shown-with-its-tag.i01');
    expect(bindGates.map(gate => [gate.status, gate.verdict, gate.failure])).toEqual([['failed', 'failed', failure], ['passed', 'passed', null]]);
    expect(integration!.gates.map(where)).toEqual([
      ['iteration', 'work-item:bind-a-written-note-is-shown-with-its-tag.i01', 'scenarios', 'failed'],
      ['iteration', 'work-item:bind-a-written-note-is-shown-with-its-tag.i01', 'scenarios', 'passed'],
      ['work-item', 'work-item:bind-a-written-note-is-shown-with-its-tag', 'scenarios', 'passed'],
      ['final', null, 'scenarios', 'passed'],
    ]);
    const firstBind = bindGates[0]!.gate;
    expect(first!.gates.find(gate => gate.gate === firstBind)).toMatchObject({ status: 'passed', verdict: 'failed' });
    expect(first!.gates.map(where)[0]).toEqual(['iteration', 'work-item:review-note.i01', 'scenarios', 'passed']);
    expect(first!.gates.at(-1)).toMatchObject({ checkpoint: 'final', check: 'scenarios', command: null, status: 'passed' });

    // The review: the frozen text of each scenario, the integration
    // scenario's being the plan's, beside its sub-scenarios.
    const analysis = analysisResponseSchema.parse(await queries.analysis(plan, runId)).analysis;
    if (analysis.status !== 'accepted') throw new Error('The analysis is accepted');
    expect(analysis.total.scenarios).toBe(3);
    expect(analysis.warnings).toEqual([]);
    expect(analysis.scenarios.map(one => [one.id, one.kind, one.entry, one.partOf, one.subScenarios])).toEqual([
      ['scenario:note-for-tags', 'entry', 'capability:review-note', 'scenario:a-written-note-is-shown-with-its-tag', []],
      ['scenario:tags-on-note', 'entry', 'capability:review-tags', 'scenario:a-written-note-is-shown-with-its-tag', []],
      ['scenario:a-written-note-is-shown-with-its-tag', 'integration', null, null, ['scenario:note-for-tags', 'scenario:tags-on-note']],
    ]);
    expect(analysis.scenarios[2]!.source.map(line => line.trim())).toEqual(planScenario.map(line => line.trim()));
    expect(analysis.scenarios[1]!.source.map(line => line.trim())).toContain('Given a note was written with review-note');

    // Each entry's scenarios, done of all it has.
    const capabilities = capabilityListResponseSchema.parse(await queries.capabilities(plan, runId)).capabilities;
    expect(capabilities.filter(row => row.entry).map(row => [row.capability, row.scenarios])).toEqual([
      ['capability:review-note', { done: 1, total: 1 }],
      ['capability:review-tags', { done: 1, total: 1 }],
    ]);
    expect(capabilities.filter(row => !row.entry).every(row => row.scenarios === null)).toBe(true);

    // The failing attempt asked the committed audit and planned no command;
    // its view carries the per-scenario results of its configured scenario
    // check, read from the raw runner output, beside the audit's answer.
    const gate = gateResponseSchema.parse(await queries.gate(plan, runId, firstBind)).gate;
    expect(gate.commands).toEqual([]);
    expect(gate.audit).toMatchObject({ mode: 'project-default', status: 'completed', verdict: 'fail' });
    expect(gate.scenarios.map(result => [result.id, result.check, result.status, result.failure]).sort()).toEqual([
      ['scenario:a-written-note-is-shown-with-its-tag', 'scenarios', 'failed', failure], ['scenario:note-for-tags', 'scenarios', 'passed', null], ['scenario:tags-on-note', 'scenarios', 'passed', null],
    ]);
    expect(gate.scenarios.find(result => result.id === 'scenario:a-written-note-is-shown-with-its-tag')!.file).toBe(integrationFeature);

    // The projected events refer to the scenarios they move.
    const events = runEventPageSchema.parse(await queries.events(plan, runId, 0)).events;
    const refsOf = (transition: string) => events.filter(event => event.transition === transition).map(event => event.refs.filter(ref => ref.kind === 'scenario').map(ref => ref.id));
    // The repair's proposal binds the integration scenario again.
    expect(refsOf('obligation-bound')).toEqual([['scenario:note-for-tags'], ['scenario:tags-on-note'], ['scenario:a-written-note-is-shown-with-its-tag'], ['scenario:a-written-note-is-shown-with-its-tag']]);
    expect(refsOf('obligation-reported')).toEqual([['scenario:note-for-tags'], ['scenario:tags-on-note'], ['scenario:a-written-note-is-shown-with-its-tag']]);
    expect(refsOf('work-item-started')).toEqual([[], [], ['scenario:a-written-note-is-shown-with-its-tag']]);

    // Over HTTP, the same answer.
    const server = createApp({ projectRoot: service.projectRoot, runs: service }).listen(0);
    try {
      await new Promise(resolve => server.once('listening', resolve));
      const response = await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}${protocolPaths.runScenarios(plan, runId)}`);
      expect(response.status).toBe(200);
      expect(scenarioListResponseSchema.parse(await response.json())).toEqual(list);
      const missing = await fetch(`http://127.0.0.1:${(server.address() as AddressInfo).port}${protocolPaths.runScenarios(plan, '20990101T000000Z-000000')}`);
      expect(missing.status).toBe(404);
    } finally {
      await new Promise(resolve => server.close(resolve));
    }
  }, 120_000);
});
