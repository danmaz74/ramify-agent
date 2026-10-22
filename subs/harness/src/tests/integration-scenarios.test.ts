import { readdirSync, readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { workItemListResponseSchema } from '../interfaces/protocol/runs.js';
import { RunQueries } from '../../subs/projections/src/queries.js';
import { createQuerySource } from '../http/query-source.js';
import { runLayout } from '../../subs/autonomous/src/run/records.js';
import { type InvocationOutcome } from '../../subs/task-execution/src/records.js';
import { assignmentErrors } from '../../subs/autonomous/subs/work-coordination/src/work/assignment.js';
import { assignedObligationErrors, obligationsOf } from '../../subs/autonomous/subs/work-coordination/src/work/obligations.js';
import { childrenOnPaths, dueIntegrations, integrationScopeOf, integrationWorkItem, stepDirectoryOf } from '../../subs/autonomous/subs/work-coordination/src/work/integration.js';
import { iterationLayout } from '../../subs/autonomous/subs/work-coordination/src/work/iterations.js';
import { workLayout, type WorkItem } from '../../subs/autonomous/subs/work-coordination/src/work/records.js';
import { scenarioSourceHash, type ScenarioRecord } from '../../subs/scenarios/src/records.js';
import type { RunEvent } from '../../subs/autonomous/src/run/log.js';
import { requestCompletion } from './helpers/analysis.js';
import { accepted, modified, unchanged } from '../../subs/autonomous/subs/work-coordination/src/tests/helpers/contracts-git.js';
import type { DirectCheckScript, DirectCheckStep, ScriptedScenario } from './helpers/direct-check-execution.js';
import { expectNoProcesses, forgetExternalTools } from './helpers/external-tools.js';
import {
  at, bindAtAncestor, bindCommit, bindTurn, entryCommits, entryTurns, featureOf, finalSubject, gates, integrationFeature,
  integrationProject, noteFeature, notes, noteSteps, notesDirectory, plan, planScenario, reviews, reviewsDirectory, runIntegration,
  scenarioResults, tagFeature, tags, tagsDirectory, tagSteps, tagStepFile, type Cleanups,
} from './helpers/integration-scenario.js';
import { assign, completionProposed, submit, write } from './helpers/iterations.js';
import { onlyRun, runEventsOnDisk, runPath } from './helpers/runs.js';
import { architectIndex, moduleEntry } from './helpers/views.js';

/*
 * Integration scenarios, architecture §10, on the scenario of
 * `helpers/integration-scenario.ts`: a note is written in one module and
 * tagged in its sibling, and the plan's scenario combines the two.
 *
 * The done report of the last sub-scenario creates the integration work
 * item at their common ancestor, queued behind the item whose architect
 * reported it; no gate or audit result does. Its module architect is briefed
 * with the scenario, the sub-scenarios, their owners and those owners' step
 * files, and its engineer works at the ancestor with the children on both
 * paths in scope. A failure of the integration scenario reaches its engineer
 * raw, with every result, and with no diagnosis of its cause.
 * No process starts here; the installed checker's verdict on the ancestor's
 * test import is `installed-ramify.boundary.test.ts`'s.
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

const project = () => integrationProject(cleanups);
const run = (root: string, ...rest: Parameters<typeof runIntegration> extends [Cleanups, string, ...infer R] ? R : never) => runIntegration(cleanups, root, ...rest);

/** The obligation events of the log that name a scenario, as `bound sc` and `reported sc judgment` lines. */
function obligationLines(log: readonly RunEvent[]): string[] {
  return log.flatMap(event => (event.type === 'obligation-bound' ? [`bound ${event.data.id}`]
    : event.type === 'obligation-reported' ? [`reported ${event.data.id} ${event.data.judgment}`] : []));
}

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

/** The project's configured scenario check over the tree as each gate's commit leaves it. */
function configuredScenarioCheck(root: string): DirectCheckScript {
  return ({ check }) => (check.kind === 'scenarios' ? { scenarios: runnableScenarios(root) } : {});
}

/** A configured scenario check whose run reached the integration scenario and failed it, while everything else passed. */
function failingIntegration(root: string): DirectCheckStep {
  return {
    outcome: { kind: 'completed', exitCode: 1 },
    scenarios: runnableScenarios(root).map(result => (result.id !== 'scenario:a-written-note-is-shown-with-its-tag' ? result : {
      ...result, status: 'failed' as const, failure: { step: 'Then the outcome review-tags promises is shown', message: 'expected the tag on the note, got no note' },
    })),
  };
}

describe('the integration work item', () => {
  test('PB3-D07 created by the last sub-scenario\'s done report and not before, at the common ancestor, queued, briefed, bound at the ancestor, reported done by its architect, and completed', async () => {
    const root = await project();
    const { service, runId, git, agent } = await run(root, {
      ...entryTurns,
      // The first assignment leaves out the path to the tags' owner and is
      // refused with the scope the harness expects; the second is accepted.
      'local-architect:work-item:bind-a-written-note-is-shown-with-its-tag': [
        submit(bindAtAncestor, { kind: 'submit', input: { ...bindAtAncestor, assignment: { ...bindAtAncestor.assignment, scope: { ...bindAtAncestor.assignment.scope, base: { module: reviews, included: [notes].map(module => ({ directory: module.split('/').slice(1).map(part => `subs/${part}`).join('/'), reason: 'Fixture whole child tree', instructions: 'Implement the assigned fixture behavior' })) } } } } }),
        submit(requestCompletion()),
      ],
      'engineer:work-item:bind-a-written-note-is-shown-with-its-tag': [bindTurn],
    }, [...entryCommits, bindCommit, unchanged('work-item:bind-a-written-note-is-shown-with-its-tag'), unchanged(finalSubject)], configuredScenarioCheck(root));

    const snapshot = onlyRun(service, plan);
    expect(snapshot.failure).toBeNull();
    expect(snapshot.state).toBe('completed');
    const log = await runEventsOnDisk(root, plan, runId);
    const attempts = await gates(root, runId, log);

    // Creation: the done report of scenario:tags-on-note, the last sub-scenario, committed
    // the work item beside it; scenario:note-for-tags's done report and every gate pass
    // before it committed none.
    const lines = (await readFile(runPath(root, plan, runId, runLayout.events), 'utf8')).split('\n').filter(Boolean)
      .map(line => JSON.parse(line) as { event: RunEvent; records: Array<{ path: string; body: unknown }> });
    const creating = lines.filter(line => line.records.some(record => record.path === workLayout.item('work-item:bind-a-written-note-is-shown-with-its-tag')));
    expect(creating.map(line => [line.event.type, (line.event.data as { id?: string; judgment?: string }).id, (line.event.data as { judgment?: string }).judgment]))
      .toEqual([['obligation-reported', 'scenario:tags-on-note', 'done']]);
    const tagArchitects = log.flatMap(event => (event.type === 'invocation-started' && event.data.role === 'local-architect'
      && event.data.work.workItem === 'work-item:review-tags' ? [event.data.invocation] : []));
    expect(tagArchitects).toContain((creating[0]!.event.data as { by: string }).by);
    expect(at(log, 'obligation-reported', data => data.id === 'scenario:note-for-tags')).toBeLessThan(at(log, 'obligation-reported', data => data.id === 'scenario:tags-on-note'));
    // At the ancestor, with the scenario's ID in place of an entry; its scenario is its acceptance, and it cites no element.
    const item = creating[0]!.records.find(record => record.path === workLayout.item('work-item:bind-a-written-note-is-shown-with-its-tag'))!.body as WorkItem;
    expect(item).toMatchObject({ id: 'work-item:bind-a-written-note-is-shown-with-its-tag', module: reviews, origin: { integration: 'scenario:a-written-note-is-shown-with-its-tag' }, functionalRequirementIds: [], functionalAcceptanceIds: [], contextIds: [], startedFor: null });

    // Queueing: the item that implemented the last sub-scenario completed
    // first; the integration work item started after it, with its origin.
    expect(at(log, 'obligation-reported', data => data.id === 'scenario:tags-on-note')).toBeLessThan(at(log, 'work-item-completed', data => data.workItem === 'work-item:review-tags'));
    expect(at(log, 'work-item-completed', data => data.workItem === 'work-item:review-tags')).toBeLessThan(at(log, 'work-item-started', data => data.workItem === 'work-item:bind-a-written-note-is-shown-with-its-tag'));
    const global = log.find(event => event.type === 'invocation-started' && event.data.role === 'initial-architect')!;
    if (global.type !== 'invocation-started') throw new Error('plan architect expected');
    const globalOutcome = JSON.parse(await readFile(runPath(root, plan, runId, runLayout.outcome(global.data.invocation)), 'utf8')) as InvocationOutcome;
    expect(globalOutcome.session?.ref).toEqual(expect.any(String));
    const globalTarget = { role: 'global-fork', run: { planId: plan, runId }, session: global.data.session,
      point: { session: global.data.session, invocation: global.data.invocation }, ref: globalOutcome.session!.ref };
    expect(log.filter(event => event.type === 'work-item-started').map(event => event.data)).toEqual([
      { workItem: 'work-item:review-note', module: notes, origin: 'entry', globalTarget },
      { workItem: 'work-item:review-tags', module: tags, origin: 'entry', globalTarget },
      { workItem: 'work-item:bind-a-written-note-is-shown-with-its-tag', module: reviews, origin: 'integration', scenario: 'scenario:a-written-note-is-shown-with-its-tag', globalTarget },
    ]);

    // The briefing: the scenario, its sub-scenarios and their owners, the
    // owners' step files as the tree held them, and the scope the module engineer
    // must be given; no bridging Given is singled out.
    const sessions = agent!.sessions;
    const briefing = sessions.find(session => session.spec.role === 'local-architect' && session.spec.submission.name === 'submit_work_orientation' && session.spec.scope.workingDirectory === join(root, reviewsDirectory, 'src'))!.spec.prompt;
    expect(briefing).toContain(`## The integration scenario scenario:a-written-note-is-shown-with-its-tag: A written note is shown with its tag`);
    expect(briefing).toContain(['```gherkin', ...planScenario, '```'].join('\n'));
    expect(briefing).toContain(`The harness wrote it into \`${integrationFeature}\``);
    expect(briefing).toContain(`- \`scenario:note-for-tags\` (A note is written for tagging), owned by \`${notes}\`, in \`${noteFeature}\`.\n`);
    expect(briefing).toContain(`- \`scenario:tags-on-note\` (A written note is tagged), owned by \`${tags}\`, in \`${tagFeature}\`.\n`);
    expect(briefing).not.toContain('bridging Given');
    expect(briefing).toContain(`- \`${notes}\`, in \`${notesDirectory}/src/tests/steps/\`: \`${noteSteps}\`.`);
    expect(briefing).toContain(`- \`${tags}\`, in \`${tagsDirectory}/src/tests/steps/\`: \`${tagSteps}\`.`);
    expect(briefing).toContain(`Assign an iteration whose scope base is \`${reviews}\` with the children \`${notes}\`, \`${tags}\` included`);
    expect(briefing).toContain(`writes a step file in \`${reviewsDirectory}/src/tests/steps/\``);
    // Its origin is the integration scenario, so it has no entry scenarios of its own.
    expect(briefing).not.toContain('## The scenarios of this work item');
    // An entry's module architect is given its entry's scenario, and the integration scenario it came from.
    const entryBriefing = sessions.find(session => session.spec.role === 'local-architect' && session.spec.submission.name === 'submit_work_orientation' && session.spec.scope.workingDirectory === join(root, notesDirectory, 'src'))!.spec.prompt;
    expect(entryBriefing).toContain('## The scenarios of this work item');
    expect(entryBriefing).toContain(`### scenario:note-for-tags: A note is written for tagging\n\n- Feature file: \`${noteFeature}\`.\n- A sub-scenario of the integration scenario \`scenario:a-written-note-is-shown-with-its-tag\``);
    expect(entryBriefing).toContain('## The states of these scenarios\n\n- `scenario:note-for-tags`: pending.');
    // Its engineer, each scenario not done and the rules; the
    // integration item's engineer, the scenario and the step files it imports.
    const engineerInvocations = log.filter(event => event.type === 'invocation-started' && event.data.role === 'engineer');
    const engineers = sessions.filter(session => session.spec.role === 'engineer');
    expect(engineers).toHaveLength(engineerInvocations.length);
    const engineerOf = (iteration: string) => {
      const position = engineerInvocations.findIndex(event => event.type === 'invocation-started' && event.data.work.iteration === iteration);
      expect(position, iteration).toBeGreaterThanOrEqual(0);
      return engineers[position]!.spec.prompt;
    };
    expect(engineerOf('work-item:review-note.i01')).toContain('### scenario:note-for-tags (pending): A note is written for tagging');
    expect(engineerOf('work-item:review-note.i01')).toContain('## Binding a scenario');
    const binder = engineerOf('work-item:bind-a-written-note-is-shown-with-its-tag.i01');
    expect(binder).toContain('## The integration scenario to bind: scenario:a-written-note-is-shown-with-its-tag (pending): A written note is shown with its tag');
    expect(binder).toContain(`- \`${notes}\`, in \`${notesDirectory}/src/tests/steps/\`: \`${noteSteps}\`.`);
    expect(binder).toContain(`- Write one step file in \`${reviewsDirectory}/src/tests/steps/\``);
    expect(binder).not.toContain('## Binding a scenario');
    // The narrower scope was refused through the judge, with the one expected.
    const architect = sessions.find(session => session.spec.role === 'local-architect' && session.spec.scope.workingDirectory === join(root, reviewsDirectory, 'src')
      && session.spec.submission.name === 'submit_work_item_result')!;
    const refused = JSON.parse((architect.verdicts[0] as { errors: string[] }).errors[0]!.split('\n\n')[0]!) as { errors: Array<{ path: string; message: string; expected: string }> };
    expect(refused.errors).toEqual([{
      path: 'assignment.scope.base.included',
      message: `The scope leaves out "${tags}", on the path to a sub-scenario's owner whose step files the scenario imports`,
      expected: `the base { module: "${reviews}", included: [{ directory: "subs/workspace/subs/reviews/subs/notes", reason, instructions }, { directory: "subs/workspace/subs/reviews/subs/tags", reason, instructions }] }`,
    }]);

    // The module engineer's scope, the binding, and the iteration gate whose
    // committed audit's scenario check ran the ancestor's feature file, its
    // pending tag removed by the gate's commit, beside the done
    // sub-scenarios of its children. The harness selected none of them.
    const assignment = JSON.parse(await readFile(runPath(root, plan, runId, iterationLayout.assignment('work-item:bind-a-written-note-is-shown-with-its-tag', 1)), 'utf8')) as { scope: { base: unknown } };
    expect(assignment.scope.base).toEqual({ module: reviews, included: [notes, tags].map(module => ({ directory: module.split('/').slice(1).map(part => `subs/${part}`).join('/'), reason: 'Fixture whole child tree', instructions: 'Implement the assigned fixture behavior' })) });
    const bindGate = attempts.find(attempt => attempt.subject.iteration === 'work-item:bind-a-written-note-is-shown-with-its-tag.i01')!;
    expect(bindGate.commands).toEqual([]);
    expect(bindGate.audit).toMatchObject({ mode: 'project-default', verdict: 'pass' });
    expect(scenarioResults(bindGate).map(result => `${result.id} ${result.status}`).sort()).toEqual(['scenario:a-written-note-is-shown-with-its-tag passed', 'scenario:note-for-tags passed', 'scenario:tags-on-note passed']);
    expect(scenarioResults(bindGate).find(result => result.id === 'scenario:a-written-note-is-shown-with-its-tag')).toMatchObject({ check: 'scenarios', file: integrationFeature, status: 'passed' });
    const engineer = log.filter(event => event.type === 'invocation-started' && (event.data as { role: string }).role === 'engineer').at(-1)!.data as { invocation: string };
    expect(obligationLines(log)).toEqual([
      'bound scenario:note-for-tags', 'reported scenario:note-for-tags done',
      'bound scenario:tags-on-note', 'reported scenario:tags-on-note done',
      'bound scenario:a-written-note-is-shown-with-its-tag', 'reported scenario:a-written-note-is-shown-with-its-tag done',
    ]);
    expect(log.find(event => event.type === 'obligation-bound' && event.data.id === 'scenario:a-written-note-is-shown-with-its-tag')!.data)
      .toMatchObject({ id: 'scenario:a-written-note-is-shown-with-its-tag', fakes: [], by: engineer.invocation });
    expect(at(log, 'obligation-reported', data => data.id === 'scenario:a-written-note-is-shown-with-its-tag')).toBeGreaterThan(at(log, 'gate-passed', data => data.gate === bindGate.id));

    // The work item completed at its own work-item gate, and the final
    // gate's full audit ran every scenario.
    expect(at(log, 'work-item-completed', data => data.workItem === 'work-item:bind-a-written-note-is-shown-with-its-tag')).toBeGreaterThan(at(log, 'obligation-reported', data => data.id === 'scenario:a-written-note-is-shown-with-its-tag'));
    const finalGate = attempts.find(attempt => attempt.checkpoint === 'final')!;
    expect(finalGate.audit).toMatchObject({ mode: 'full', verdict: 'pass' });
    expect(scenarioResults(finalGate).map(result => `${result.id} ${result.status}`).sort()).toEqual(['scenario:a-written-note-is-shown-with-its-tag passed', 'scenario:note-for-tags passed', 'scenario:tags-on-note passed']);
    expect(log.at(-1)!.type).toBe('job-completed');
    expect(snapshot.counts.scenarios).toEqual({ pending: 0, bound: 0, done: 3 });
    // The work items a client reads: the integration one by its origin, with no capability of its own.
    const listed = workItemListResponseSchema.parse(await new RunQueries(createQuerySource(service)).workItems(plan, runId));
    expect(listed.workItems.map(one => [one.id, one.module, one.origin, one.capability, one.state])).toEqual([
      ['work-item:review-note', notes, 'entry', 'capability:review-note', 'completed'],
      ['work-item:review-tags', tags, 'entry', 'capability:review-tags', 'completed'],
      ['work-item:bind-a-written-note-is-shown-with-its-tag', reviews, 'integration', null, 'completed'],
    ]);
    expect(readFileSync(join(root, integrationFeature), 'utf8')).toContain('  @ramify-scenario-a-written-note-is-shown-with-its-tag\n');
    git.assertAnswered();
  }, 120_000);

  test('PB3-D07 the integration scenario fails while its sub-scenarios pass: the repair round is given the raw failure and every result, with no composition diagnosis, and resolves it', async () => {
    const root = await project();
    let failed = false;
    const { service, runId, git, agent } = await run(root, {
      ...entryTurns,
      'local-architect:work-item:bind-a-written-note-is-shown-with-its-tag': [submit(bindAtAncestor), submit(requestCompletion())],
      'engineer:work-item:bind-a-written-note-is-shown-with-its-tag': [
        bindTurn,
        submit(completionProposed('The tags\' Given now writes the note the way review-note does.', { bindings: [{ id: 'scenario:a-written-note-is-shown-with-its-tag' }] }),
          write(tagSteps, tagStepFile.replace("Given('a note was written with review-note', () => {});", "Given('a note was written with review-note', () => { /* write it as review-note does */ });"))),
      ],
    }, [...entryCommits, bindCommit, accepted('work-item:bind-a-written-note-is-shown-with-its-tag.i01', 'revision-04', modified(tagSteps)), unchanged('work-item:bind-a-written-note-is-shown-with-its-tag'), unchanged(finalSubject)],
    ({ check, context }) => {
      if (check.kind !== 'scenarios') return {};
      const runnable = runnableScenarios(root);
      if (context.checkpoint !== 'iteration' || failed || !runnable.some(result => result.id === 'scenario:a-written-note-is-shown-with-its-tag')) return { scenarios: runnable };
      failed = true;
      return failingIntegration(root);
    });

    expect(onlyRun(service, plan).failure).toBeNull();
    expect(onlyRun(service, plan).state).toBe('completed');
    const log = await runEventsOnDisk(root, plan, runId);
    const attempts = (await gates(root, runId, log)).filter(attempt => attempt.subject.iteration === 'work-item:bind-a-written-note-is-shown-with-its-tag.i01');
    expect(attempts.map(attempt => attempt.verdict)).toEqual(['failed', 'passed']);
    expect(scenarioResults(attempts[0]!).map(result => `${result.id} ${result.status}`).sort()).toEqual(['scenario:a-written-note-is-shown-with-its-tag failed', 'scenario:note-for-tags passed', 'scenario:tags-on-note passed']);

    // The repair round's briefing carries the failure as the runner reported
    // it, and no generated diagnosis of its cause or of who repairs it.
    const repair = agent!.sessions.filter(session => session.spec.role === 'engineer' && session.spec.prompt.includes('work-item:bind-a-written-note-is-shown-with-its-tag')).at(-1)!.spec.prompt;
    expect(repair).not.toContain('composition failure');
    expect(repair).not.toContain('bridging Given');
    expect(repair).not.toContain('suspect');
    // And the failing scenario itself, with its name, file, line, step and
    // message; each passing one with its binding.
    expect(repair).toMatch(/- scenario `scenario:a-written-note-is-shown-with-its-tag` "A written note is shown with its tag" failed in `scenarios`, at `[^`]+\.feature:\d+`:\n {2}- The failing step: `Then the outcome review-tags promises is shown`\.\n {2}- Its message: expected the tag on the note, got no note/);
    expect(repair).toMatch(/`scenario:note-for-tags` "A note is written for tagging" passed/);
    // The failure moved nothing: the scenario stayed bound through the
    // repair, and only its architect's report made it done.
    expect(obligationLines(log).filter(entry => entry.includes('scenario:a-written-note-is-shown-with-its-tag'))).toEqual(['bound scenario:a-written-note-is-shown-with-its-tag', 'bound scenario:a-written-note-is-shown-with-its-tag', 'reported scenario:a-written-note-is-shown-with-its-tag done']);
    expect(at(log, 'obligation-reported', data => data.id === 'scenario:a-written-note-is-shown-with-its-tag')).toBeGreaterThan(at(log, 'gate-passed', data => data.gate === attempts[1]!.id));
    expect(at(log, 'work-item-completed', data => data.workItem === 'work-item:bind-a-written-note-is-shown-with-its-tag')).toBeGreaterThan(0);
    git.assertAnswered();
  }, 120_000);
});

describe('the rules, over literal records', () => {
  const source = (name: string) => [`Scenario: ${name}`, '  Given a note', '  When it is tagged', '  Then the tag is shown'];
  const scenario = (id: string, kind: ScenarioRecord['kind'], owner: string, extra: Partial<ScenarioRecord> = {}): ScenarioRecord => ({
    schema: 'ramify-agent.scenario/2',
    id,
    kind,
    entry: kind === 'entry' ? `entry-${id}` : null,
    owner,
    origin: kind === 'entry' ? { kind: 'architect', refs: [] } : { kind: 'plan', planScenario: 'plan-scenario:written-note-shown-with-tag', ref: { document: 'document:review-notes-plan', lines: [12, 17] } },
    citedElements: [],
    partOf: null,
    subScenarios: [],
    name: id,
    source: source(id),
    hash: scenarioSourceHash(source(id)),
    file: kind === 'entry' ? featureOf(`${reviewsDirectory}/subs/${owner.split('/').at(-1)!}`, `entry-${id}`) : integrationFeature,
    ...extra,
  });
  const deep = `${reviews}/core/tasks`;
  const records = [
    scenario('scenario:note-created', 'entry', notes, { partOf: 'scenario:note-shown' }),
    scenario('scenario:note-validated', 'entry', deep, { partOf: 'scenario:note-shown' }),
    scenario('scenario:note-tagged', 'entry', tags),
    scenario('scenario:note-shown', 'integration', reviews, { subScenarios: ['scenario:note-created', 'scenario:note-validated'] }),
  ];

  test('PB3-D07 an integration scenario is due once every sub-scenario is done and it has no work item yet; bound is not enough; its item is at its owner', () => {
    const states = (second: 'pending' | 'bound' | 'done') => new Map([['scenario:note-created', 'done'], ['scenario:note-validated', second], ['scenario:note-tagged', 'pending'], ['scenario:note-shown', 'pending']] as const);
    expect(dueIntegrations(records, states('pending'), [])).toEqual([]);
    expect(dueIntegrations(records, states('bound'), [])).toEqual([]);
    expect(dueIntegrations(records, states('done'), []).map(record => record.id)).toEqual(['scenario:note-shown']);
    const item = integrationWorkItem(records[3]!);
    expect(item).toMatchObject({ id: 'work-item:bind-note-shown', module: reviews, origin: { integration: 'scenario:note-shown' }, functionalRequirementIds: [], functionalAcceptanceIds: [], contextIds: [], startedFor: null });
    expect(dueIntegrations(records, states('done'), [item])).toEqual([]);
  });

  test('the engineer\'s scope is the ancestor with the direct child on each path, and a step directory sits beside its features', () => {
    expect(childrenOnPaths(reviews, [notes, deep, `${reviews}/core/controller`, reviews])).toEqual([notes, `${reviews}/core`]);
    expect(integrationScopeOf(records[3]!, records)).toEqual({ module: reviews, includedChildren: [notes, `${reviews}/core`] });
    expect(stepDirectoryOf(integrationFeature)).toBe(`${reviewsDirectory}/src/tests/steps`);
    expect(stepDirectoryOf('subs/integration-tests/src/features/review-notes/integration.feature')).toBe('subs/integration-tests/src/steps');

    const index = architectIndex([
      moduleEntry(reviews, reviewsDirectory, null),
      moduleEntry(notes, notesDirectory, reviews),
      moduleEntry(`${reviews}/core`, `${reviewsDirectory}/subs/core`, reviews),
    ]);
    const body = (base: { module: string; included: { directory: string; reason: string; instructions: string }[] }) => ({
      ...assign(base.module).assignment,
      scope: { base, extra: [], read: [], rationale: 'r' },
    });
    const evidence = { index, registry: new Map(), outline: null, integration: integrationScopeOf(records[3]!, records) };
    expect(assignmentErrors(body({ module: reviews, included: [notes, `${reviews}/core`].map(module => ({ directory: module.split('/').slice(1).map(part => `subs/${part}`).join('/'), reason: 'Fixture child', instructions: 'Implement fixture' })) }), evidence)).toEqual([]);
    expect(assignmentErrors(body({ module: notes, included: [] }), evidence).map(error => error.path)).toEqual(['assignment.scope.base']);
  });

  test('an integration work item assigns its own scenario, which no entry\'s work item may assign', () => {
    const item = (id: string, origin: WorkItem['origin']): WorkItem => ({
      schema: 'ramify-agent.work-item/2', id, module: reviews, origin, goal: `Carry out ${id}.`,
      functionalRequirementIds: [], functionalAcceptanceIds: [], contextIds: [], startedFor: null,
    });
    const projection = obligationsOf({ scenarios: records, workItems: [item('work-item:note-created', { entry: 'entry-scenario:note-created' }), item('work-item:bind-note-shown', { integration: 'scenario:note-shown' })], events: [] });
    const integrationArchitect = { actor: { kind: 'work-item' as const, id: 'work-item:bind-note-shown' }, projection };
    expect(assignedObligationErrors(['scenario:note-shown'], integrationArchitect)).toEqual([]);
    expect(assignedObligationErrors(['scenario:note-created', 'scenario:unknown'], integrationArchitect)).toEqual([
      { path: 'assignment.obligations.0', message: 'scenario:note-created is reported by the module architect of work-item:note-created, so the module architect of work-item:bind-note-shown cannot assign its binding', expected: 'IDs among scenario:note-shown' },
      { path: 'assignment.obligations.1', message: '"scenario:unknown" is no registered obligation of this run', expected: 'IDs among scenario:note-shown' },
    ]);
    expect(assignedObligationErrors(['scenario:note-shown'], { actor: { kind: 'work-item', id: 'work-item:note-created' }, projection }).map(error => error.message))
      .toEqual(['scenario:note-shown is reported by the module architect of work-item:bind-note-shown, so the module architect of work-item:note-created cannot assign its binding']);
  });
});
