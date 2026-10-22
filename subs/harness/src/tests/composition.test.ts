import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, describe, expect, test, vi } from 'vitest';
import { CommittingGates } from '../../subs/autonomous/subs/acceptance/src/committing-gate.js';
import type { GateAttempt } from '../../subs/autonomous/subs/acceptance/src/checks/records.js';

import { reduceSessions } from '../../subs/autonomous/src/run/sessions.js';
import { iterationLayout } from '../../subs/autonomous/subs/work-coordination/src/work/iterations.js';
import type { IterationAssignment } from '../../subs/autonomous/subs/work-coordination/src/work/iterations.js';
import { resolveWriteScope } from '../work/scope.js';
import { committedRecords } from '../../subs/autonomous/src/run/committed-records.js';
import { fixtureTask } from '../../subs/autonomous/subs/work-coordination/src/tests/helpers/capability.js';
import { analysisResponseSchema } from '../interfaces/protocol/runs.js';
import { errorResponseSchema } from '../interfaces/protocol/errors.js';
import { checkFindingDetailSchema, checkFindingListResponseSchema, reviewListResponseSchema } from '../interfaces/protocol/check-findings.js';
import { protocolPaths } from '../interfaces/protocol/paths.js';
import { createApp } from '../http/app.js';
import { RunQueries } from '../../subs/projections/src/queries.js';
import { createQuerySource } from '../http/query-source.js';
import { ObservationLog } from '../../subs/task-execution/src/observations.js';
import { PortEventRecorder } from '../../subs/task-execution/src/port-events.js';
import { ExcursionWatcher } from '../../subs/task-execution/src/excursions.js';
import { fileHashes, logLines, plan, runDirectory, runToEnd, scenarios, type ScenarioName } from './helpers/composition.js';
import { openRuns } from './helpers/runs.js';
import { temporaryDirectory } from './helpers/fixture.js';

/*
 * The composition suite, T1: the whole loop on the scripted agent, with no
 * pi and no network. Git and the commands readiness would run are external
 * and are answered rather than run; every file the runs write, every record
 * they commit and every transition they make are their own.
 *
 * The composed runs are read back for their sessions, scope authority and
 * projections, and no query appends an event. The exhaustive query sweep
 * over every run and every cursor, with queries asked after every durable
 * write, is in `composition.stress.ts`.
 */

type Finished = Awaited<ReturnType<typeof runToEnd>>;
const finished = new Map<ScenarioName, Finished>();

beforeAll(async () => {
  // Every scenario, each to its end, side by side: each is its own copy of
  // the fixture, its own repository and its own run service.
  const names = Object.keys(scenarios) as ScenarioName[];
  const results = await Promise.allSettled(names.map(name => runToEnd(scenarios[name])));
  names.forEach((name, index) => { const result = results[index]!; if (result.status === 'fulfilled') finished.set(name, result.value); });
  const failed = results.flatMap((result, index) => result.status === 'rejected' ? [`${names[index]}: ${String(result.reason)}`] : []);
  expect(failed, 'composed scenario failures').toEqual([]);
}, 600_000);

afterAll(async () => {
  for (const run of finished.values()) await run.dispose();
});

describe('the composed runs', () => {
  test('failed reads, authority-refused reads and explicitly interrupted searches retain distinct recorded outcomes and unknown bytes', async () => {
    const directory = await temporaryDirectory();
    try {
      const observations = await ObservationLog.open(join(directory.path, 'observations.jsonl'));
      const recorder = new PortEventRecorder({ projectRoot: directory.path, observations,
        invocation: { id: 'original-op', role: 'engineer', startedAt: '2026-10-08T00:00:00.000Z', submissionTool: 'submit', declaredPaths: [directory.path] },
        context: { compaction: 'forbidden', budgetTokens: null, budgetFraction: null, reportReserveTokens: 0 },
        excursions: new ExcursionWatcher({ projectRoot: directory.path, index: null, scope: undefined }),
        judge: { countImplementationRejection: () => async () => {} } });
      recorder.identify({ runId: 'original-run', operationId: 'original-op', sessionId: 'original-session', turn: 3,
        sourcePoint: { sessionId: 'original-session', kind: 'checkpoint', turn: 2, checkpoint: 'original-brief' } });
      await recorder.record({ type: 'tool-started', tool: 'read', callId: 'read-failed', input: {}, action: { kind: 'read', path: 'missing.ts', range: null }, mutating: false });
      await recorder.record({ type: 'tool-finished', tool: 'read', callId: 'read-failed', isError: true, reachedTool: true, observation: { sourceId: 'read-failed:end', returnedBytes: null, elapsedMs: null } });
      await recorder.record({ type: 'tool-started', tool: 'read', callId: 'read-refused', input: {}, action: { kind: 'read', path: '../outside.ts', range: null }, mutating: false });
      await recorder.record({ type: 'tool-finished', tool: 'read', callId: 'read-refused', isError: true, reachedTool: false, observation: { sourceId: 'read-refused:end', returnedBytes: null, elapsedMs: null } });
      await recorder.record({ type: 'tool-started', tool: 'grep', callId: 'search-interrupted', input: {}, action: { kind: 'search', path: '.', pattern: 'unfinished', glob: null }, mutating: false });
      await recorder.record({ type: 'tool-finished', tool: 'grep', callId: 'search-interrupted', isError: true, reachedTool: true, observation: { sourceId: 'search-interrupted:end', returnedBytes: null, elapsedMs: null, outcome: 'interrupted' } });
      const calls = observations.observations.filter(row => row.type === 'exploration');
      expect(calls.map(row => [row.data.callId, row.data.outcome, row.data.returnedBytes, row.data.files])).toEqual([
        ['read-failed', 'failed', null, null], ['read-refused', 'refused', null, null], ['search-interrupted', 'interrupted', null, null],
      ]);
      expect(calls.every(row => row.data.operationId === 'original-op' && row.data.sessionId === 'original-session' && row.data.turn === 3)).toBe(true);
      expect(observations.observations.filter(row => row.type === 'usage')).toEqual([]);
    } finally { await directory.remove(); }
  });
  // The unique plain-efficiency witness is child-owned in efficiency-provenance.test.ts.
  test('an engineer resumes after a context return and explicitly reports partial work to its architect', async () => {
    const run = finished.get('engineer-budget')!;
    const events = run.service.events(plan, run.runId)!;
    const engineers = events.filter(event => event.type === 'invocation-started' && event.data.role === 'engineer');
    expect(engineers).toHaveLength(2);
    if (engineers[0]?.type !== 'invocation-started') throw new Error('Missing original module engineer');
    const engineer = engineers[0].data.invocation;
    const ended = events.find(event => event.type === 'invocation-ended' && event.data.invocation === engineer);
    expect(ended).toMatchObject({ data: { ended: 'context-budget-reached', submission: null } });
    const resumed = engineers[1];
    if (resumed?.type !== 'invocation-started') throw new Error('Missing resumed module engineer');
    expect(resumed.data.start).toBe('opened');
    expect(resumed.data.session).not.toBe(engineers[0].data.session);
    expect(events.find(event => event.type === 'invocation-ended' && event.data.invocation === resumed.data.invocation))
      .toMatchObject({ data: { ended: 'submitted', submission: expect.any(String) } });
    expect(events.filter(event => event.type === 'iteration-closed')).toHaveLength(1);
    expect(events.find(event => event.type === 'iteration-closed')).toMatchObject({ data: { outcome: 'partial' } });
    expect(run.service.getRun(plan, run.runId)).toMatchObject({ state: 'completed' });
    expect(run.git.commits()).toHaveLength(3);
  });
  test('removed included child keeps scope authority: the iteration gate audits and commits the removal, and the work-item gate finds it unchanged', async () => {
    const run = finished.get('iteration')!;
    const directory = runDirectory(run.root, run.runId);
    const scoped = JSON.parse(await readFile(join(directory, 'gates/ga-0002/attempt.json'), 'utf8')) as GateAttempt;
    expect(scoped.checkpoint).toBe('iteration');
    expect(scoped.rules?.find(rule => rule.rule === 'write-scope')?.outcome).toBe('passed');
    expect(scoped.verdict).toBe('passed');
    expect(scoped.commands).toEqual([]);
    expect(scoped.audit).toMatchObject({ requestedSourceCommit: 'source-01', auditedSourceCommit: 'source-01', verdict: 'pass' });
    expect(scoped.commit).toBe('source-01');
    const later = JSON.parse(await readFile(join(directory, 'gates/ga-0003/attempt.json'), 'utf8')) as GateAttempt;
    expect(later.checkpoint).toBe('work-item');
    expect(later.rules?.find(rule => rule.rule === 'write-scope')?.outcome).toBe('passed');
    expect(later.commit).toBeNull();
    expect(later.audit?.auditedSourceCommit).toBe('source-01');
    expect(existsSync(join(run.root, 'subs/workspace/subs/reviews/subs/notes/subs/drafts/module.ramify'))).toBe(false);
    expect(await readFile(join(run.root, 'subs/workspace/subs/reviews/subs/notes/shell-note.txt'), 'utf8')).toBe('left by the shell\n');
  });

  test('a rejected iteration cannot send its unauthorized dirty file through a later work-item or final committing checkpoint', async () => {
    // Scripted lifecycle control of the actual committing checkpoint over
    // assignments accepted by the real ledger. No Git or audit is executed.
    const run = await runToEnd(scenarios.iteration);
    try {
      const active = run.service['runs'].get(`${plan}/${run.runId}`)!;
      // Scheduling is already admitted in this candidate-authority witness.
      const admittedGates = new CommittingGates({ ...run.service['gateHost'](active), awaitGateAdmission: async () => true });
      const ramify = run.service['options'].ramify;
      const query = vi.spyOn(ramify, 'queryOwnership');
      const git = run.service['git'];
      const dirty = vi.spyOn(git, 'changedPaths').mockResolvedValue(['shell-note.txt']);
      const commit = vi.spyOn(git, 'commitAccepted');
      const before = commit.mock.calls.length;
      await writeFile(join(run.root, 'shell-note.txt'), 'outside the originating notes assignments\n');
      for (const checkpoint of ['iteration', 'work-item', 'final'] as const) {
        query.mockClear();
        const id = `ga-09${checkpoint === 'iteration' ? '00' : checkpoint === 'work-item' ? '01' : '02'}`;
        const attempt = await admittedGates.committingCheckpoint( {
          id, runId: run.runId, checkpoint, projectRoot: run.root,
          directory: active.path(`gates/${id}`), head: 'source-01', policy: active.record.policy,
          subject: checkpoint === 'iteration' ? { workItem: 'work-item:review-note', iteration: 'work-item:review-note.i01' }
            : checkpoint === 'work-item' ? { workItem: 'work-item:review-note' } : {},
        });
        expect(attempt.rules?.find(rule => rule.rule === 'write-scope')).toMatchObject({ outcome: 'failed', violations: [{ path: 'shell-note.txt' }] });
        expect(attempt.commit).toBeNull();
        expect(query).toHaveBeenCalledTimes(1);
        expect(commit.mock.calls).toHaveLength(before);
      }
      dirty.mockRestore(); query.mockRestore(); commit.mockRestore();
    } finally { await run.dispose(); }
  });

  test('PB3: equal captured bytes, feature tampering and later render aliases cannot bypass the actual committing gate', async () => {
    const capturedPackage = 'subs/workspace/subs/reviews/subs/notes/subs/drafts/package.json';
    // The shell removes the drafts child's declaration and README but leaves
    // its captured package: deleting that guarded file would be an
    // unauthorized guarded change, which fails the iteration gate.
    const shell = scenarios.iteration.commands![0]!;
    const run = await runToEnd({ ...scenarios.iteration, target: async () => {
      const fixture = await scenarios.iteration.target();
      await writeFile(join(fixture.root, capturedPackage), '{"private":true}\n');
      return fixture;
    }, commands: [{ ...shell, async leaves(root) {
      const drafts = 'subs/workspace/subs/reviews/subs/notes/subs/drafts';
      await rm(join(root, drafts, 'module.ramify')); await rm(join(root, drafts, 'README.md'));
      await writeFile(join(root, 'subs/workspace/subs/reviews/subs/notes/shell-note.txt'), 'left by the shell\n');
    } }] });
    const external = await mkdtemp(join(tmpdir(), 'pb3-captured-alias-'));
    try {
      const active = run.service['runs'].get(`${plan}/${run.runId}`)!;
      // Scheduling is already admitted in this candidate-authority witness.
      const admittedGates = new CommittingGates({ ...run.service['gateHost'](active), awaitGateAdmission: async () => true });
      const query = vi.spyOn(run.service['options'].ramify, 'queryOwnership');
      const git = run.service['git'];
      const dirty = vi.spyOn(git, 'changedPaths');
      const commit = vi.spyOn(git, 'commitAccepted');
      const before = commit.mock.calls.length;
      const config = 'ramify-agent.json';
      const bytes = await readFile(join(run.root, config));
      await writeFile(join(external, 'same-config.json'), bytes);
      await rm(join(run.root, config)); await symlink(join(external, 'same-config.json'), join(run.root, config));
      const feature = run.service['gates'](active).writtenFeatures()[0]!;
      const declaration = join(run.root, 'subs/workspace/subs/reviews/subs/notes/module.ramify');
      const originalDeclaration = await readFile(declaration, 'utf8');
      const variants = [config, feature.path, feature.path, feature.path, capturedPackage];
      for (const [index, path] of variants.entries()) {
        if (index === 1) {
          await rm(join(run.root, config)); await writeFile(join(run.root, config), bytes);
          await writeFile(join(run.root, feature.path), 'tampered ledger feature bytes\n');
        } else if (index === 2) {
          await writeFile(join(external, 'external.feature'), 'external bytes must survive\n');
          await rm(join(run.root, feature.path)); await symlink(join(external, 'external.feature'), join(run.root, feature.path));
        } else if (index === 3) {
          await rm(join(run.root, feature.path)); await writeFile(join(run.root, feature.path), feature.content);
          await writeFile(declaration, `${originalDeclaration}\nexternal "${feature.path.slice('subs/workspace/subs/reviews/subs/notes/'.length)}"\n`);
        } else if (index === 4) {
          // Exact captured package bytes remain regular and unchanged, but a
          // newly declared independent tree requires its own included entry.
          await writeFile(declaration, `${originalDeclaration}\nowned-nested-project "subs/drafts"\n`);
          const assignment = JSON.parse(await readFile(join(runDirectory(run.root, run.runId), iterationLayout.assignment('work-item:review-note', 1)), 'utf8'));
          expect(assignment.guarded).toContainEqual({ path: capturedPackage, hash: expect.any(String) });
        }
        dirty.mockResolvedValue([path]); query.mockClear();
        const id = `ga-091${index}`;
        const attempt = await admittedGates.committingCheckpoint( {
          id, runId: run.runId, checkpoint: 'work-item', projectRoot: run.root,
          directory: active.path(`gates/${id}`), head: 'source-01', policy: active.record.policy, subject: { workItem: 'work-item:review-note' },
        });
        expect(attempt.rules?.find(rule => rule.rule === 'write-scope')?.outcome).toBe('failed');
        expect(attempt.commit).toBeNull(); expect(query).toHaveBeenCalledTimes(1);
        expect(commit.mock.calls).toHaveLength(before);
      }
      expect(await readFile(join(external, 'external.feature'), 'utf8')).toBe('external bytes must survive\n');
      dirty.mockRestore(); query.mockRestore(); commit.mockRestore();
    } finally { await run.dispose(); await rm(external, { recursive: true, force: true }); }
  }, 30_000);

  test('PB3: scripted nested predecessors require every intermediate inherited hash to match', async () => {
    const run = await runToEnd(scenarios.iteration);
    try {
      const active = run.service['runs'].get(`${plan}/${run.runId}`)!;
      const ledger = active.log.ledger.replay();
      const grandparent = committedRecords(ledger).assignments.get('work-item:review-note.i01')!;
      const rootOwner = grandparent.scope.resolved.ownership.modules.find(module => module.parent === null)!.id;
      const scope = await resolveWriteScope({ projectRoot: run.root, ramify: run.service['options'].ramify, index: null,
        view: grandparent.scope.resolved.view, revision: 1, base: { module: rootOwner, included: [] },
        extra: [], read: [], bootstrap: [], rationale: 'Scripted unrelated owner for nested provenance control' });
      const path = 'subs/workspace/subs/reviews/subs/notes/docs/inherited.txt';
      await mkdir(join(run.root, 'subs/workspace/subs/reviews/subs/notes/docs'), { recursive: true });
      const hash = (bytes: string) => createHash('sha256').update(bytes).digest('hex');
      await writeFile(join(run.root, path), 'later bytes\n');
      const currentHash = hash('later bytes\n');
      const parentTask = { ...fixtureTask(), id: 'capability-task:scripted-parent', parent: { kind: 'work-item' as const, id: grandparent.workItem }, originatingAssignment: grandparent.id };
      const childTask = { ...fixtureTask(), id: 'capability-task:scripted-child', parent: { kind: 'capability-task' as const, id: parentTask.id }, originatingAssignment: 'capability-task:scripted-parent.i01' };
      const parent: IterationAssignment = { ...grandparent, id: 'capability-task:scripted-parent.i01', scope, guarded: [], authorizations: [],
        coordination: { kind: 'capability-task', id: parentTask.id, sequence: 1, plan: grandparent.outline,
          startingTree: 'a'.repeat(40), startingPaths: [{ path, hash: hash('earlier bytes\n') }] } };
      const child: IterationAssignment = { ...parent, id: 'capability-task:scripted-child.i01',
        coordination: { ...parent.coordination as Extract<NonNullable<IterationAssignment['coordination']>, { kind: 'capability-task' }>,
          id: childTask.id, startingPaths: [{ path, hash: currentHash }] } };
      // This is an explicit scripted ledger projection over a real finished
      // run. It exercises the existing evaluator, not a coordinator producer.
      const last = ledger.at(-1)!;
      const entries = [parentTask, parent, childTask, child].map((body, index) => {
        const sequence = last.sequence + index + 1;
        const isAssignment = body.schema === 'ramify-agent.iteration-assignment/2';
        return { sequence, at: last.at, transaction: {
          event: { sequence, at: last.at, jobId: run.runId,
            ...(isAssignment ? { type: 'capability-assigned' as const, data: { task: index === 1 ? parentTask.id : childTask.id,
              assignment: body.id, sequence: 1, invocation: 'scripted-provenance' } }
              : { type: 'capability-delegated' as const, data: { task: body.id, request: 'capability-request:scripted-need', parent: 'work-item:review-note', invocation: 'scripted-provenance', planRevision: 1 as const } }) },
          records: [{ path: `scripted/${body.id}.json`, id: body.id, revision: 1, body }],
        } };
      });
      const replay = vi.spyOn(active.log.ledger, 'replay').mockReturnValue([...ledger, ...entries]);
      const dirty = vi.spyOn(run.service['git'], 'changedPaths').mockResolvedValue([path]);
      const query = vi.spyOn(run.service['options'].ramify, 'queryOwnership');
      const request = { checkpoint: 'iteration' as const, subject: { workItem: grandparent.workItem, iteration: child.id } };
      query.mockClear();
      const denied = await new CommittingGates(run.service['gateHost'](active)).candidateAuthority(request);
      expect(denied.rules.find(rule => rule.rule === 'write-scope')?.violations).toContainEqual(expect.objectContaining({ path }));
      expect(query).toHaveBeenCalledTimes(1);
      if (parent.coordination?.kind !== 'capability-task') throw new Error('Missing scripted parent coordination');
      parent.coordination.startingPaths[0]!.hash = currentHash;
      query.mockClear();
      // Each explicitly scripted authority projection gets its own detached reader.
      // Mutating the fixture body cannot revise an already captured observation.
      const permitted = await new CommittingGates(run.service['gateHost'](active)).candidateAuthority(request);
      expect(permitted.rules.find(rule => rule.rule === 'write-scope')?.outcome).toBe('passed');
      expect(query).toHaveBeenCalledTimes(1);
      replay.mockRestore(); dirty.mockRestore(); query.mockRestore();
    } finally { await run.dispose(); }
  });

  test('each scenario runs to the end it is written for, and asks Git exactly what it states', () => {
    for (const [name, run] of finished) {
      const snapshot = run.service.getRun(plan, run.runId)!;
      expect([name, snapshot.state]).toEqual([name, scenarios[name].ends]);
      // Each scenario states what its commits answer. A run that made
      // another commit, or one fewer, is a scenario whose fixture data no
      // longer describes it.
      expect([name, run.git.commits().map(call => call.commit)])
        .toEqual([name, scenarios[name].git.commits.map(response => response.commit)]);
      run.git.assertAnswered();
    }
  });
});

describe('the sessions of the composed runs', () => {
  test('every invocation belongs to a session the log derives, and no final run holds a live or suspended session', () => {
    for (const [name, run] of finished) {
      const events = run.service.events(plan, run.runId)!;
      const sessions = [...reduceSessions(events).values()];
      const started = events.flatMap(event => (event.type === 'invocation-started' ? [event.data.invocation] : []));
      expect([name, sessions.flatMap(session => session.invocations).sort()]).toEqual([name, [...started].sort()]);
      expect([name, sessions.filter(session => session.state !== 'finished').map(session => `${session.id} ${session.state}`)]).toEqual([name, []]);
    }
  });

  test('a yielded revision resumes its architect fresh with one recorded orientation and selection', () => {
    const run = finished.get('revision')!;
    const events = run.service.events(plan, run.runId)!;
    const yielded = events.find(event => event.type === 'invocation-ended'
      && event.data.session !== undefined && !event.data.kept && event.data.finished === 'not-kept'
      && events.some(started => started.type === 'invocation-started' && started.data.invocation === event.data.invocation
        && started.data.role === 'local-architect' && started.data.work.workItem === 'work-item:review-notes'));
    expect(yielded?.type).toBe('invocation-ended');
    if (yielded?.type !== 'invocation-ended') return;
    const resumed = events.find(event => event.type === 'invocation-started' && event.sequence > yielded.sequence
      && event.data.role === 'local-architect' && event.data.work.workItem === 'work-item:review-notes');
    expect(resumed?.type).toBe('invocation-started');
    if (resumed?.type !== 'invocation-started') return;
    expect(resumed.data.start).toBe('opened');
    expect(resumed.data.session).not.toBe(yielded.data.session);
    expect(events.filter(event => event.type === 'work-orientation-recorded' && event.data.workItem === 'work-item:review-notes')).toHaveLength(1);
    expect(events.filter(event => event.type === 'context-selection-recorded' && event.data.workItem === 'work-item:review-notes')).toHaveLength(1);
  });
});

describe('no query appends an event', () => {
  test('every query, over the first, a middle, the last and a past-the-end cursor of one run, leaves its log, its files and its project as they were', async () => {
    const run = finished.get('name-rejection')!;
    const directory = runDirectory(run.root, run.runId);
    const before = await fileHashes(directory);
    const lines = (await logLines(run.root, run.runId)).length;
    // What the run had asked Git by the time it ended. A query that
    // observed the project at all would ask it something more.
    const asked = run.git.operations();
    const queries = new RunQueries(createQuerySource(run.service));
    for (let round = 0; round < 2; round += 1) {
      await queries.list(plan);
      await queries.run(plan, run.runId);
      for (const after of [0, Math.floor(lines / 2), lines, lines + 1]) await queries.events(plan, run.runId, after);
      await queries.analysis(plan, run.runId);
      await queries.decisions(plan, run.runId);
      const { workItems } = await queries.workItems(plan, run.runId);
      for (const item of workItems) await queries.workItem(plan, run.runId, item.id);
      await queries.capabilities(plan, run.runId);
      await queries.scenarios(plan, run.runId);
      await queries.metrics(plan, run.runId);
      const findings = await queries.checkFindings(plan, run.runId, { workItem: null, module: null, select: 'all', order: 'attention', after: null, limit: 100 });
      expect(findings.protocol).toBe('check-findings/2');
      expect(findings.items.map(item => item.id)).toEqual(expect.arrayContaining(['finding:reviewer-notes-1', 'finding:reviewer-notes-3']));
      expect((await queries.checkFinding(plan, run.runId, 'finding:reviewer-notes-1')).summary.id).toBe('finding:reviewer-notes-1');
      const readiness = await queries.mergeReadiness(plan, run.runId, lines);
      expect(readiness.readiness).toMatchObject({ status: 'pending-review',
        checkFindings: expect.arrayContaining(['finding:reviewer-notes-1', 'finding:reviewer-notes-3']) });
      await queries.checkFindingModules(plan, run.runId);
      await queries.reviews(plan, run.runId, { workItem: null, after: null, limit: 100 });
      const page = await queries.events(plan, run.runId, 0);
      for (const gate of new Set(page.events.flatMap(event => event.refs.filter(ref => ref.kind === 'gate').map(ref => ref.id)))) {
        await queries.gate(plan, run.runId, gate);
      }
    }
    expect((await logLines(run.root, run.runId)).length).toBe(lines);
    expect(await fileHashes(directory)).toEqual(before);
    expect(run.git.operations(), 'a query asked Git something').toEqual(asked);
  });
});

describe('the composed run surfaces', () => {
  test('the HTTP projections and merge readiness serve descriptive deviations through disposition and reload', async () => {
    const run = finished.get('name-rejection')!;
    const app = createApp({ projectRoot: run.root, runs: run.service });
    const server = await new Promise<ReturnType<typeof app.listen>>(resolve => {
      const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
    });
    const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const get = async (path: string) => {
      const response = await fetch(`${origin}${path}`);
      return { status: response.status, body: await response.json() as unknown };
    };
    try {
      const list = await get(protocolPaths.runCheckFindings(plan, run.runId, { select: 'all', limit: 1 }));
      expect(list.status).toBe(200);
      const parsed = checkFindingListResponseSchema.parse(list.body);
      expect(parsed.protocol).toBe('check-findings/2');
      expect(parsed.total).toBe(2);
      expect(parsed.items[0]?.id).toBe('finding:reviewer-notes-3');
      expect(parsed.next).toBe('finding:reviewer-notes-3');
      const cursor = await get(protocolPaths.runCheckFindings(plan, run.runId, { select: 'all', limit: 1, after: parsed.next! }));
      expect(cursor.status).toBe(200);
      expect(checkFindingListResponseSchema.parse(cursor.body).items.map(item => item.id)).toEqual(['finding:reviewer-notes-1']);
      const detail = await get(protocolPaths.runCheckFinding(plan, run.runId, 'finding:reviewer-notes-1'));
      expect(detail.status).toBe(200);
      expect(checkFindingDetailSchema.parse(detail.body)).toMatchObject({ protocol: 'check-findings/2', summary: { id: 'finding:reviewer-notes-1' } });
      // The CLI selects the same accepted committed records that this public
      // query source serves. No CLI response is substituted by a test payload.
      const { main } = await import('../../../../src/tests/helpers/inspect-cli.js');
      const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
      const stderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
      const inspect = async (kind: 'work-item' | 'finding' | 'deviation', id: string) => {
        stdout.mockClear();
        stderr.mockClear();
        const status = await main(['inspect', '--server', origin, '--plan', plan, '--run', run.runId, `--${kind}`, id, '--json']);
        return { status, body: status === 0 ? JSON.parse(stdout.mock.calls.map(call => call[0]).join('')) as unknown : undefined,
          error: stderr.mock.calls.map(call => call[0]).join('') };
      };
      try {
        const analysis = analysisResponseSchema.parse((await get(protocolPaths.runAnalysis(plan, run.runId))).body);
        expect(analysis.analysis.status).toBe('accepted');
        if (analysis.analysis.status !== 'accepted' || analysis.analysis.planEvidence?.status !== 'available') throw new Error('Accepted catalog unavailable');
        expect(analysis.analysis.entries[0]).toMatchObject({ capabilityId: 'capability:reviewer-notes',
          functionalRequirementIds: ['functional-requirement:retain-reviewer-notes'],
          functionalAcceptanceIds: ['functional-requirement:retain-reviewer-notes'], contextIds: [] });
        expect(analysis.analysis.entries[0]).not.toHaveProperty('requirementRefs');
        const catalogElement = analysis.analysis.planEvidence.elements.find(element => element.id === 'functional-requirement:retain-reviewer-notes');
        expect(catalogElement).toMatchObject({ text: 'Retain reviewer notes.', conditions: [], uncertainty: '',
          document: expect.stringMatching(/^document:/), path: expect.stringContaining('plans/review-notes/plan.md') });
        const work = await inspect('work-item', 'work-item:reviewer-notes');
        expect(work.status).toBe(0);
        expect(work.body).toMatchObject({ workItem: { id: 'work-item:reviewer-notes' }, acceptedReferences: {
          functionalRequirementIds: ['functional-requirement:retain-reviewer-notes'],
          elements: [{ id: 'functional-requirement:retain-reviewer-notes', text: 'Retain reviewer notes.' }],
        } });
        expect((work.body as { acceptedReferences: { elements: unknown[] } }).acceptedReferences.elements).toContainEqual(catalogElement);
        const obsoleteWork = await inspect('work-item', 'wi-001');
        expect(obsoleteWork.status).toBe(2);
        expect(obsoleteWork.error).toContain('invalid-request');
        expect(obsoleteWork.error).toContain('work-item:<name>');
        expect(obsoleteWork.error).toContain('work-items list');
        const unknownWork = await inspect('work-item', 'work-item:unknown');
        expect(unknownWork.status).toBe(2);
        expect(unknownWork.error).toContain('not-found');
        expect((await inspect('finding', 'finding:reviewer-notes-1')).body)
          .toMatchObject({ summary: { id: 'finding:reviewer-notes-1', planDeviation: { id: 'plan-deviation:move-reviewer-notes' } } });
        expect((await inspect('deviation', 'plan-deviation:move-reviewer-notes')).body)
          .toMatchObject({ deviation: { id: 'plan-deviation:move-reviewer-notes' }, finding: { summary: { id: 'finding:reviewer-notes-1' } } });
        const missing = await inspect('deviation', 'plan-deviation:unknown');
        expect(missing.status).toBe(2);
        expect(missing.error).toContain('No accepted plan deviation plan-deviation:unknown');
      } finally { stdout.mockRestore(); stderr.mockRestore(); }
      const version = run.service.getRun(plan, run.runId)!.version;
      const acceptedScenario = await get(protocolPaths.runExecutionScenario(plan, run.runId, 'scenario:reviewer-notes-retained', version));
      expect(acceptedScenario.status).toBe(200);
      const obsoleteScenario = await get(protocolPaths.runExecutionScenario(plan, run.runId, 'sc-001', version));
      expect(obsoleteScenario.status).toBe(400);
      expect(errorResponseSchema.parse(obsoleteScenario.body).error).toMatchObject({
        code: 'invalid-request', message: expect.stringContaining('scenario:<name>'),
      });
      expect(errorResponseSchema.parse(obsoleteScenario.body).error.message).toContain('scenarios list');
      const unknownScenario = await get(protocolPaths.runExecutionScenario(plan, run.runId, 'scenario:unknown', version));
      expect(unknownScenario.status).toBe(404);
      expect(errorResponseSchema.parse(unknownScenario.body).error.code).toBe('not-found');
      const reviews = await get(protocolPaths.runReviews(plan, run.runId));
      expect(reviews.status).toBe(200);
      expect(reviewListResponseSchema.parse(reviews.body).protocol).toBe('check-findings/2');
      const foreign = await get(protocolPaths.runCheckFinding(plan, run.runId, 'finding:foreign-review'));
      expect(foreign.status).toBe(404);
      const draft = await get(protocolPaths.runCheckFinding(plan, run.runId, 'draft:finding:reviewer-notes-1'));
      expect(draft.status).toBe(404);
      expect(errorResponseSchema.parse(draft.body).error.message).toContain('submission-local finding key');
      const wrongFamily = await get(protocolPaths.runCheckFinding(plan, run.runId, 'plan-deviation:move-reviewer-notes'));
      expect(wrongFamily.status).toBe(404);
      expect(errorResponseSchema.parse(wrongFamily.body).error.message).toContain('not an accepted CheckFinding ID');
      const unknownCursor = await get(protocolPaths.runCheckFindings(plan, run.runId, { after: 'finding:foreign-review' }));
      expect(unknownCursor.status).toBe(400);
      expect(errorResponseSchema.parse(unknownCursor.body).error.code).toBe('invalid-request');
    } finally {
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
    const queries = new RunQueries(createQuerySource(run.service));
    const version = () => run.service.getRun(plan, run.runId)!.version;
    expect((await queries.mergeReadiness(plan, run.runId, version())).readiness.status).toBe('pending-review');
    for (const id of ['finding:reviewer-notes-1', 'finding:reviewer-notes-3']) {
      const finding = (await queries.checkFinding(plan, run.runId, id)).summary;
      expect(finding.planDeviation?.id).toMatch(/^plan-deviation:/u);
      const decision = finding.pendingUserDecision!;
      expect(decision.options.map(option => option.id)).toContain('accept');
      await run.service.execute({ commandId: `accept-${id}`, expectedVersion: version(), type: 'respond-to-check-finding',
        payload: { planId: plan, jobId: run.runId, responder: 'reviewer', checkFinding: id,
          expectedRevision: finding.revision, request: decision.request, option: 'accept' } });
    }
    expect((await queries.mergeReadiness(plan, run.runId, version())).readiness.status).toBe('ready');
    await run.service.close();
    const reopened = await openRuns(run.root, { git: run.git, agent: run.agent });
    try {
      const loaded = new RunQueries(createQuerySource(reopened.service));
      expect((await loaded.mergeReadiness(plan, run.runId, reopened.service.getRun(plan, run.runId)!.version)).readiness.status).toBe('ready');
    } finally {
      await reopened.service.close();
    }
  });
  test('the CLI inspects the accepted work item without changing its committed records', async () => {
    const run = finished.get('iteration')!;
    const directory = runDirectory(run.root, run.runId);
    const before = await fileHashes(directory);
    const app = createApp({ projectRoot: run.root, runs: run.service });
    const server = await new Promise<ReturnType<typeof app.listen>>(resolve => {
      const listening = app.listen(0, '127.0.0.1', () => resolve(listening));
    });
    const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const stdout = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    try {
      const { main } = await import('../../../../src/tests/helpers/inspect-cli.js');
      for (let attempt = 0; attempt < 2; attempt += 1) {
        stdout.mockClear();
        expect(await main(['inspect', '--server', origin, '--plan', plan, '--run', run.runId, '--work-item', 'work-item:review-note', '--json'])).toBe(0);
        expect(JSON.parse(stdout.mock.calls.map(call => call[0]).join(''))).toMatchObject({ workItem: { id: 'work-item:review-note' } });
      }
      expect(await fileHashes(directory)).toEqual(before);
    } finally {
      stdout.mockRestore();
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });
});
