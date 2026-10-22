import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { Script } from '../../../../../agent/src/scripted.js';
import type { SessionSpec } from '../../../../../agent/src/interfaces/port.js';
import type { CommandRequest, CommandRunner } from '../../../../../evidence/src/run-command.js';
import { type InvocationOutcome } from '../../../../../task-execution/src/records.js';
import { finalCandidate } from '../../../acceptance/src/tests/helpers/final-candidate.js';
import { runLayout, type RunPolicy } from '../../../../src/run/records.js';
import { engineerToolName } from '../work/engineer.js';
import { iterationLayout, type IterationAssignment, type IterationResult } from '../work/iterations.js';
import { shellToolName } from '../../../../../../src/tools/shell.js';
import { analysis, currentAnalysis, entry, requestCompletion } from '../../../../../../src/tests/helpers/analysis.js';
import { changedResult } from '../../../../../../src/tests/helpers/check-payloads.js';
import { commandResult } from '../../../../../../src/tests/helpers/command-result.js';
import { expectNoProcesses, forgetExternalTools } from '../../../../../../src/tests/helpers/external-tools.js';
import { FakeRamifyCli } from '../../../../../../src/tests/helpers/fake-ramify.js';
import { copyFixture } from '../../../../../../src/tests/helpers/fixture.js';
import {
  addModule, assign, byRole, completionProposed, edit, failureAnalystFake, installMiniRunner, outline, partialReport, shell, submit, treeInputs, type Turn,
} from '../../../../../../src/tests/helpers/iterations.js';
import { installTestRunner, onlyRun, openRuns as openRunsWithGit, runEventsOnDisk, runPath, startRun, stopRun, testPolicy, until } from '../../../../../../src/tests/helpers/runs.js';
import { scenariosCommit, scriptedGit, type GitCheckpoint } from '../../../../../../src/tests/helpers/scripted-git.js';
import { assertUnchangedGit, openUnchangedRuns as openRuns } from '../../../../../../src/tests/helpers/unchanged-run.js';

/*
 * A module engineer's work driven through whole runs on the scripted fake:
 * agents are scripts, Git is scripted and every shell command is answered in
 * this process, so no run starts a process.
 *
 * A rejected submission or tool input is answered in the same session until
 * it is corrected; a Ramify module violation refuses completion while it
 * stands. A module engineer that ends without a result is its module
 * architect's decision, not the run's end, and the architect decides on the
 * harness's digest of what the module engineer left and a failure analysis a
 * model makes in a reader session of its own.
 */

vi.mock('node:child_process', async original =>
  (await import('../../../../../../src/tests/helpers/process-guard.js')).guardedChildProcess(await original<typeof import('node:child_process')>()));

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
  try { assertUnchangedGit(); expectNoProcesses(); } finally { forgetExternalTools(); }
});

const notes = 'collection-review/workspace/reviews/notes';
const notesDirectory = 'subs/workspace/subs/reviews/subs/notes';

describe('a rejected submission in a run', () => {
  const completedCheckpoints = [
    scenariosCommit('review-notes'),
    'work-item:review-note.i01: Carry out the work in collection-review/workspace/reviews/notes.',
    'work-item:review-note',
    'final verification of plan "review-notes"',
  ] as const;

  async function run(
    inputs: readonly unknown[],
    toolCalls: ReadonlyArray<ReturnType<typeof shell>> = [],
    unchangedCheckpoints: ReadonlyArray<string | GitCheckpoint> = [],
  ) {
    const fixture = await copyFixture();
    cleanups.push(fixture.remove);
    await addModule(fixture.root, notesDirectory, 'notes', {
      'src/notes.ts': 'export const noteLimit = 500;\n',
      'src/tests/notes.test.ts': [
        'import { test, expect } from \'vitest\';',
        'import { noteLimit } from \'../notes.ts\';',
        '',
        'test(\'the limit is the one the plan asks for\', () => { expect(noteLimit).toBe(500); });',
        '',
      ].join('\n'),
    });
    await installMiniRunner(fixture.root);
    // Every command the module engineer's shell runs is answered here, in this
    // process, and recorded.
    const commands: CommandRequest[] = [];
    const { service, agent } = await openRuns(fixture.root, {
      commandExecution: async request => {
        commands.push(request);
        return commandResult(request, { outcome: { kind: 'completed', exitCode: 0 }, stdout: 'ok 1 - the limit is the one the plan asks for\n' });
      },
      script: byRole({
        'initial-architect': [submit(currentAnalysis(analysis([entry('review-note', notes)]), 'document:review-notes-plan'))],
        'local-architect': [submit(assign(notes, {}, outline())), submit(requestCompletion())],
        engineer: [[
          ...toolCalls,
          ...inputs.map(input => ({ kind: 'submit' as const, input })),
        ]],
      }),
      inputs: treeInputs(),
      unchangedCheckpoints,
    });
    cleanups.push(() => service.close());
    const receipt = await service.execute(startRun('review-notes'));
    await service.settled('review-notes', receipt.jobId);
    return { root: fixture.root, runId: receipt.jobId, service, agent, commands };
  }

  test('a broken schema returns every error to the same session, and a corrected input is accepted', async () => {
    const { root, runId, service, agent } = await run([
      { kind: 'completion-proposed', summary: 'done' },
      completionProposed('Left the limit as the plan asks.'),
    ], [], completedCheckpoints);

    expect(onlyRun(service, 'review-notes').state).toBe('completed');
    const engineer = agent!.sessions.find(session => session.spec.role === 'engineer')!;
    expect(engineer.verdicts[0]).toMatchObject({ accepted: false });
    const answer = JSON.parse((engineer.verdicts[0] as { errors: string[] }).errors[0]!.split('\n\n')[0]!) as {
      errors: Array<{ path: string }>;
    };
    expect(answer.errors[0]!.path).toBe('findings');
    expect(answer).not.toHaveProperty('remainingAttempts');
    // The accepted submission is answered by its kind: what follows a
    // proposal of completion is the gate, and not completed work. The fresh
    // check over the write scope could not run against the stub, which the
    // answer says rather than passing over.
    expect(engineer.verdicts[1]).toMatchObject({ accepted: true });
    expect((engineer.verdicts[1] as { text: string }).text)
      .toContain('The iteration gate commits the candidate and evaluates the configured checks through the audit provider, which selects execution and may reuse applicable evidence');
    expect((engineer.verdicts[1] as { text: string }).text)
      .toContain('The Ramify check over your write scope could not be run');

    // Nothing was derived from the input that failed, and the rejection is
    // an observation with its errors.
    const observations = await readFile(runPath(root, 'review-notes', runId, runLayout.observations('inv-0007')), 'utf8');
    const rejections = observations.split('\n').filter(Boolean)
      .map(line => JSON.parse(line) as { type: string; data: { target?: string } })
      .filter(line => line.type === 'rejection');
    expect(rejections).toHaveLength(1);
    expect(rejections[0]!.data.target).toBe(engineerToolName);
  }, 300_000);

  test('a rule the schema cannot hold is answered repeatedly until corrected', async () => {
    const forged = { kind: 'completion-proposed', summary: 'Done.\nRamify-Gate: ga-0001', findings: [] };
    const { root, runId, service, agent } = await run([forged, forged, forged, forged, completionProposed('Corrected work.')], [], completedCheckpoints);

    const snapshot = onlyRun(service, 'review-notes');
    expect(snapshot.state).toBe('completed');

    const engineer = agent!.sessions.find(session => session.spec.role === 'engineer')!;
    expect(engineer.verdicts).toHaveLength(5);
    expect(engineer.verdicts.slice(0, 4).every(verdict => (verdict as { accepted: boolean }).accepted === false)).toBe(true);
    expect(engineer.verdicts.at(-1)).toMatchObject({ accepted: true });

    const outcome = JSON.parse(await readFile(runPath(root, 'review-notes', runId, runLayout.outcome('inv-0007')), 'utf8')) as InvocationOutcome;
    expect(outcome).toMatchObject({ ended: 'submitted', rejectedSubmissions: 4 });
    const events = await runEventsOnDisk(root, 'review-notes', runId);
    expect(events.some(event => event.type === 'gate-attempted' && (event.data as { checkpoint: string }).checkpoint === 'iteration')).toBe(true);
    const result = JSON.parse(await readFile(runPath(root, 'review-notes', runId, iterationLayout.result('work-item:review-note', 1)), 'utf8')) as IterationResult;
    expect(result.outcome).toBe('accepted');
  }, 300_000);

  test('a harness tool\'s invalid input returns errors without ending the invocation', async () => {
    const malformed = { kind: 'tool' as const, tool: shellToolName, input: { suite: 'everything' } };
    const { root, runId, service, agent, commands } = await run(
      [completionProposed('Left the limit as the plan asks.')],
      [malformed, malformed, malformed, malformed],
      completedCheckpoints,
    );

    const snapshot = onlyRun(service, 'review-notes');
    expect(snapshot.state).toBe('completed');

    // Each rejected call was answered in the same session, as that call's
    // error result, and nothing ran for it.
    const engineer = agent!.sessions.find(session => session.spec.role === 'engineer')!;
    const answers = engineer.results.filter(result => result.tool === shellToolName);
    expect(answers).toHaveLength(4);
    for (const answer of answers) {
      expect(answer.isError).toBe(true);
      const body = JSON.parse(answer.text.split('\n\n')[0]!) as { accepted: boolean; errors: Array<{ path: string; message: string }> };
      expect(body.accepted).toBe(false);
      // The shell takes a command and an optional timeout: the input names
      // neither, and the answer says what is wrong with it.
      expect(body.errors.length).toBeGreaterThan(0);
      expect(JSON.stringify(body.errors)).toMatch(/command|suite/);
    }
    expect(commands).toEqual([]);

    const observations = (await readFile(runPath(root, 'review-notes', runId, runLayout.observations('inv-0007')), 'utf8'))
      .split('\n').filter(Boolean).map(line => JSON.parse(line) as { type: string; data: { target?: string } });
    expect(observations.filter(line => line.type === 'rejection' && line.data.target === shellToolName)).toHaveLength(4);
    const outcome = JSON.parse(await readFile(runPath(root, 'review-notes', runId, runLayout.outcome('inv-0007')), 'utf8')) as InvocationOutcome;
    expect(outcome.ended).toBe('submitted');
    const result = JSON.parse(await readFile(runPath(root, 'review-notes', runId, iterationLayout.result('work-item:review-note', 1)), 'utf8')) as IterationResult;
    expect(result.outcome).toBe('accepted');
  }, 300_000);

  test('the engineer runs its named test through the shell and is answered with that command\'s result; a whole-suite run is refused and runs nothing', async () => {
    const named = `npx vitest run ${notesDirectory}/src/tests/notes.test.ts`;
    const { service, agent, commands } = await run(
      [completionProposed('Left the limit as the plan asks.')],
      [shell(named), shell('npx vitest run')],
      completedCheckpoints,
    );
    expect(onlyRun(service, 'review-notes').state).toBe('completed');

    const engineer = agent!.sessions.find(session => session.spec.role === 'engineer')!;
    const [ran, refused] = engineer.results.filter(result => result.tool === shellToolName);
    // The named run is the command the module engineer gave, and its answer is the
    // command's own exit code and output.
    expect(ran!.isError).toBe(false);
    expect(ran!.text).toContain('ok 1 - the limit is the one the plan asks for');
    // The whole suite is the gate's audit's to run: refused before anything spawned.
    expect(refused!.isError).toBe(true);
    expect(refused!.text).toContain('Refused, nothing ran: `npx vitest run`');
    expect(refused!.text).toContain("use the project's declared runner");
    const shellRuns = commands.filter(request => request.argv[0] === 'bash');
    expect(shellRuns.map(request => request.argv)).toEqual([['bash', '-c', named]]);
  }, 300_000);
});

describe('a Ramify module violation in a run', () => {
  test('the edit that introduces it is told, a completion is refused while it stands, and the fixed work completes', async () => {
    const fixture = await copyFixture();
    cleanups.push(fixture.remove);
    const root = fixture.root;
    await addModule(root, notesDirectory, 'notes', {
      'src/notes.ts': 'export const noteLimit = 400;\n',
      'src/tests/notes.test.ts': [
        'import { test, expect } from \'vitest\';',
        'import { noteLimit } from \'../notes.ts\';',
        '',
        'test(\'the limit is what the plan asks for\', () => { expect(noteLimit).toBe(500); });',
        '',
      ].join('\n'),
    });
    await installMiniRunner(root);

    const marker = '/* NOT-EXPOSED-IMPORT */';
    const file = `${notesDirectory}/src/notes.ts`;
    const git = scriptedGit(root, { previews: finalCandidate(root, 'fixed-source').previews, head: 'base', checkpoints: [
      scenariosCommit('review-notes'),
      { subject: 'work-item:review-note.i01', commit: 'fixed-source', changes: [{ status: 'M', path: file }] },
      { subject: 'work-item:review-note', commit: null, changes: [] },
      { subject: 'final verification of plan "review-notes"', commit: null, changes: [] },
    ] });
    const ramify = new FakeRamifyCli();
    const finding = {
      id: `source-diagnostic/1:${file}`, category: 'import', code: 'not-visible',
      message: 'collection-review:interfaces/protocol.ts#ToolResult: not-visible',
      location: { file, start: 0, end: 1, line: 1, column: 1 },
      importer: { owner: 'collection-review/workspace/reviews/notes', kind: 'ordinary' },
      original: { kind: 'code', owner: 'collection-review', file: 'interfaces/protocol.ts', binding: 'ToolResult' }, new: true,
    };
    // Each answer is a `ramify.check/3` result that checked every named path.
    const answer = (findings: Record<string, unknown>[]) => async (paths: readonly string[]) => changedResult(root, paths, findings);
    const checked = vi.spyOn(ramify, 'checkChanged')
      .mockImplementationOnce(answer([finding]))
      .mockImplementation(answer([]));
    const completed = vi.spyOn(ramify, 'checkComplete').mockImplementation(async () => {
      const findings = (await readFile(join(root, file), 'utf8')).includes(marker) ? [finding] : [];
      const report = { schemaVersion: 'ramify.analysis/3', request: { project: { root } }, inputId: 'scripted-completion',
        outcome: { execution: 'completed', check: findings.length === 0 ? 'passed' : 'failed', coverage: 'complete' },
        diagnostics: findings, warnings: [], coverage: [] };
      return { form: 'complete', exitCode: findings.length === 0 ? 0 : 1, outcome: findings.length === 0 ? 'checked' : 'findings', reason: null,
        report, stdout: JSON.stringify(report), stderr: '', provider: { schema: 'ramify.analysis/3', revision: 'scripted-completion' }, execution: 'completed', paths: [], removed: [], unsupported: null };
    });
    const { service, agent } = await openRunsWithGit(root, {
      inputs: treeInputs(), git, candidates: finalCandidate(root, 'fixed-source').candidates, ramify,
      // The module engineer's writes are what Git reports once the feature files are committed.
      afterWrite: async write => { if (write === 'scenarios-materialized') git.givenWrites(); },
      script: byRole({
        'initial-architect': [submit(currentAnalysis(analysis([entry('review-note', notes)]), 'document:review-notes-plan'))],
        'local-architect': [submit(assign(notes, {}, outline())), submit(requestCompletion())],
        engineer: [[
          edit(join(root, file), 'noteLimit = 400;', `noteLimit = 500; ${marker}`),
          { kind: 'submit', input: completionProposed() },
          edit(join(root, file), ` ${marker}`, ''),
          { kind: 'submit', input: completionProposed() },
        ]],
      }),
    });
    cleanups.push(() => service.close());
    const receipt = await service.execute(startRun('review-notes'));
    await service.settled('review-notes', receipt.jobId);
    expect(onlyRun(service, 'review-notes').state).toBe('completed');

    const engineer = agent!.sessions.find(session => session.spec.role === 'engineer')!;
    const [introduced, fixed] = engineer.results.filter(result => result.tool === 'edit');
    // The edit that introduced it carries the finding itself, in the tool result the model reads.
    expect(introduced!.text).toContain('RAMIFY MODULE VIOLATION. The iteration gate fails while it stands.');
    expect(introduced!.text).toContain(`${file}:1 imports \`ToolResult\` from src/interfaces/protocol.ts (module \`collection-review\`)`);
    // The completion proposed while it stood was refused with the same sentence; the fixed one was accepted.
    expect(engineer.verdicts).toHaveLength(2);
    const refusal = engineer.verdicts[0] as { accepted: false; errors: string[] };
    expect(refusal.accepted).toBe(false);
    expect(refusal.errors.join('\n')).toContain('RAMIFY MODULE VIOLATION still standing; the iteration gate fails on it.');
    expect(engineer.verdicts[1]).toMatchObject({ accepted: true });
    // The edit that fixed it checked clean, so it told the module engineer nothing about Ramify.
    expect(fixed!.text).not.toContain('RAMIFY');
    expect(checked).toHaveBeenCalledTimes(2);
    expect(completed).toHaveBeenCalledTimes(2);
    git.assertComplete();
  }, 300_000);
});

const plan = 'review-notes';
const reviews = 'collection-review/workspace/reviews';
const checkpoints = [scenariosCommit(plan), 'work-item:reviewer-note', `final verification of plan "${plan}"`];

/** What each shell command asked for, as the scripted runner received it. */
interface AskedCommand {
  readonly command: string;
  readonly timeoutMs: number;
}

/** Answers every shell command in this process at once, recording what it asked for. */
function scriptedShell(asked: AskedCommand[]): CommandRunner {
  return async request => {
    if (request.argv[0] !== 'bash') throw new Error(`No process is started here: ${request.argv.join(' ')}`);
    asked.push({ command: request.argv[2] ?? '', timeoutMs: request.timeoutMs });
    return commandResult(request, { stdout: 'all suites passed\n' });
  };
}

/** A run of the fixture's plan with one entry in `reviews`, driven by `turns`, whose sessions are kept. */
async function failureRun(turns: Readonly<Record<string, readonly Turn[]>>, limits: Partial<RunPolicy['limits']> = {}, asked: AskedCommand[] = [], previewCount = 5) {
  const fixture = await copyFixture();
  cleanups.push(fixture.remove);
  await installTestRunner(fixture.root);
  const specs: SessionSpec[] = [];
  const scripted = byRole(turns) as (spec: SessionSpec) => ReturnType<Extract<Script, (spec: SessionSpec) => unknown>>;
  const opened = await openRuns(fixture.root, {
    script: spec => {
      specs.push(spec);
      return scripted(spec);
    },
    unchangedCheckpoints: checkpoints,
    previewCount,
    inputs: treeInputs(),
    commandExecution: scriptedShell(asked),
    policy: projectRoot => {
      const policy = testPolicy(projectRoot);
      return { ...policy, limits: { ...policy.limits, ...limits } };
    },
  });
  cleanups.push(() => opened.service.close());
  const receipt = await opened.service.execute(startRun(plan));
  await opened.service.settled(plan, receipt.jobId);
  const role = (name: string) => specs.filter(spec => spec.role === name);
  return { root: fixture.root, runId: receipt.jobId, service: opened.service, specs, role };
}

async function iterationResult(root: string, runId: string, number: number): Promise<IterationResult> {
  return JSON.parse(await readFile(runPath(root, plan, runId, iterationLayout.result('work-item:reviewer-note', number)), 'utf8')) as IterationResult;
}

test('a genuine failure-analyst provider failure retains its diagnostic while current recovery pauses analysis', async () => {
  const fixture = await copyFixture();
  cleanups.push(fixture.remove);
  await installTestRunner(fixture.root);
  const opened = await openRuns(fixture.root, {
    script: byRole({
      'initial-architect': [submit(currentAnalysis(analysis([entry('reviewer-note', reviews)]), 'document:review-notes-plan'))],
      'local-architect': [submit(assign(reviews, {}, outline()))],
      engineer: [[{ kind: 'end', message: 'No submission.' }]],
      'failure-analyst': [[{ kind: 'fail', error: 'The analyst provider refused this request' }]],
    }),
    unchangedCheckpoints: [scenariosCommit(plan)],
    gitScript: { previews: [{ repositoryRoot: fixture.root, head: `scenarios-of-${plan}`, tree: 'a'.repeat(40) }] },
    inputs: treeInputs(),
  });
  cleanups.push(() => opened.service.close());
  const receipt = await opened.service.execute(startRun(plan));
  await until(() => opened.service.events(plan, receipt.jobId)!.some(event => event.type === 'operation-recovery-paused'));
  const inspection = await opened.service.recoveryInspection(plan, receipt.jobId);
  expect(inspection).toMatchObject({ state: 'paused', boundary: { role: 'failure-analyst' }, evidence: { diagnostic: expect.stringContaining('The analyst provider refused this request') } });
  const ended = opened.service.events(plan, receipt.jobId)!.find(event => event.type === 'invocation-ended' && event.data.ended === 'failed');
  expect(ended).toMatchObject({ data: { ended: 'failed' } });
  expect(onlyRun(opened.service, plan)).toMatchObject({ state: 'running', recovery: { state: 'paused' } });
  await opened.service.execute(stopRun(plan, receipt.jobId, opened.service.getRun(plan, receipt.jobId)!.version));
  await opened.service.settled(plan, receipt.jobId);
});

describe('an engineer failure with revised command settings', () => {
  test('analyzes semantic failure before its architect revises the command maximum', async () => {
    const asked: AskedCommand[] = [];
    const raised = { commandTimeoutMs: { ms: 1_200_000, reason: 'The whole suite runs for about fifteen minutes.' } };
    const { root, runId, service, role } = await failureRun({
      'initial-architect': [submit(currentAnalysis(analysis([entry('reviewer-note', reviews)]), 'document:review-notes-plan'))],
      'local-architect': [submit(assign(reviews, {}, outline())), submit(assign(reviews, { bounds: raised })), submit(requestCompletion())],
      engineer: [
        [{ kind: 'end', message: 'The provider refused this unsupported request' }],
        submit(partialReport(['the suite passed'], ['nothing']), shell('npm run test:slow:rerun', { timeoutMs: 1_000_000 })),
      ],
      'failure-analyst': [failureAnalystFake('bound-too-tight', { recommendation: 'Use the supported request and appropriate command maximum.' })],
    }, {}, asked, 6);
    const snapshot = onlyRun(service, plan);
    expect(snapshot.state, JSON.stringify(snapshot.failure)).toBe('completed');
    const result = await iterationResult(root, runId, 1);
    expect(result.failure!.digest).toMatchObject({ ended: 'ended', interruption: null,
      cause: 'The session stopped on its own without an accepted submission.', inFlight: [] });
    expect(result.failure!.analysis).toMatchObject({ outcome: 'analyzed', cause: 'bound-too-tight' });
    expect(role('local-architect')[1]!.prompt).toContain('Use the supported request and appropriate command maximum.');
    const assignment = JSON.parse(await readFile(runPath(root, plan, runId, iterationLayout.assignment('work-item:reviewer-note', 2)), 'utf8')) as IterationAssignment;
    expect(assignment.bounds).toEqual(raised);
    const next = role('engineer')[1]!;
    const tool = next.tools.find(candidate => candidate.name === shellToolName)!;
    expect((tool.inputSchema as { properties: { timeoutMs: { maximum: number } } }).properties.timeoutMs.maximum).toBe(1_200_000);
    expect(asked).toEqual([{ command: 'npm run test:slow:rerun', timeoutMs: 1_000_000 }]);
  }, 120_000);
});

describe('a failure analysis that fails', () => {
  test('leaves the digest alone, says the analysis was unavailable, and never fails the run', async () => {
    const { root, runId, service, role } = await failureRun({
      'initial-architect': [submit(currentAnalysis(analysis([entry('reviewer-note', reviews)]), 'document:review-notes-plan'))],
      'local-architect': [submit(assign(reviews, {}, outline())), submit(requestCompletion())],
      engineer: [[{ kind: 'end', message: 'the provider refused the request' }]],
      'failure-analyst': [[{ kind: 'end', message: 'the analyst\'s provider refused the request too' }]],
    });

    expect(onlyRun(service, plan).state).toBe('completed');
    const result = await iterationResult(root, runId, 1);
    expect(result.failure!.digest).toMatchObject({ ended: 'ended', interruption: null, cause: 'The session stopped on its own without an accepted submission.', inFlight: [] });
    expect(result.failure!.analysis).toMatchObject({ outcome: 'unavailable', reason: 'the analysis ended `ended`' });

    const briefing = role('local-architect')[1]!.prompt;
    expect(briefing).toContain('- Why it ended: The session stopped on its own without an accepted submission.');
    expect(briefing).toContain('The failure analysis is unavailable');
    expect(briefing).toContain('Decide on the digest above.');
    expect(briefing).not.toContain('If the work needs more, raise');
  }, 120_000);

  test('that ends without a submission is unavailable too', async () => {
    const { root, runId, service } = await failureRun({
      'initial-architect': [submit(currentAnalysis(analysis([entry('reviewer-note', reviews)]), 'document:review-notes-plan'))],
      'local-architect': [submit(assign(reviews, {}, outline())), submit(requestCompletion())],
      engineer: [[{ kind: 'end', message: 'I have nothing more to add.' }]],
      'failure-analyst': [[{ kind: 'end', message: 'No account.' }]],
    });
    expect(onlyRun(service, plan).state).toBe('completed');
    const result = await iterationResult(root, runId, 1);
    expect(result.failure!.digest).toMatchObject({ ended: 'ended', cause: 'The session stopped on its own without an accepted submission.' });
    expect(result.failure!.analysis).toMatchObject({ outcome: 'unavailable', reason: 'the analysis ended `ended`' });
  }, 120_000);
});

describe('every cause an analyst judges', () => {
  test('reaches the iteration\'s result and the next briefing', async () => {
    const { root, runId, service, role } = await failureRun({
      'initial-architect': [submit(currentAnalysis(analysis([entry('reviewer-note', reviews)]), 'document:review-notes-plan'))],
      'local-architect': [
        submit(assign(reviews, {}, outline())),
        submit(assign(reviews)),
        submit(assign(reviews)),
        submit(assign(reviews)),
        submit(requestCompletion()),
      ],
      engineer: [[{ kind: 'end', message: 'the provider refused the request' }]],
      'failure-analyst': [
        failureAnalystFake('environment-problem'),
        failureAnalystFake('work-problem'),
        failureAnalystFake('agent-behavior'),
        failureAnalystFake('unknown'),
      ],
    }, {}, [], 8);
    expect(onlyRun(service, plan).state).toBe('completed');
    const causes = [];
    for (const number of [1, 2, 3, 4]) {
      const analysisOf = (await iterationResult(root, runId, number)).failure!.analysis;
      causes.push(analysisOf.outcome === 'analyzed' ? analysisOf.cause : null);
    }
    expect(causes).toEqual(['environment-problem', 'work-problem', 'agent-behavior', 'unknown']);
    expect(role('local-architect')[4]!.prompt).toContain('(`unknown`)');
  }, 120_000);
});
