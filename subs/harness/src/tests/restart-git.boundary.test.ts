import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { gitService, gitCandidateSource } from '../../subs/evidence/src/git.js';
import { CommandRejection } from '../jobs/commands.js';
import { copyFixture } from './helpers/fixture.js';
import { analysis, currentAnalysis, entry } from './helpers/analysis.js';
import { byRole, submit, treeInputs } from './helpers/iterations.js';
import { openRuns, startRun, stopRun, until } from './helpers/runs.js';

const execute = promisify(execFile);

test('same-run continuation preserves native source refs index and dirty files', async () => {
  const fixture = await copyFixture();
  let service: Awaited<ReturnType<typeof openRuns>>['service'] | undefined;
  const git = async (...args: string[]) => (await execute('git', args, { cwd: fixture.root })).stdout;
  try {
    await git('init', '--initial-branch=main');
    await git('config', 'user.name', 'Restart witness');
    await git('config', 'user.email', 'restart@example.invalid');
    // Durable harness state is excluded before the run captures its source.
    await writeFile(join(fixture.root, '.gitignore'), `${await readFile(join(fixture.root, '.gitignore'), 'utf8')}\n.harness/\n`);
    await git('add', '.'); await git('commit', '-m', 'Native restart baseline');
    const inputs = treeInputs();
    let failedOnce = false;
    const opened = await openRuns(fixture.root, { git: gitService, candidates: gitCandidateSource,
      inputs, script: byRole({ 'initial-architect': [submit(currentAnalysis(analysis([entry('review-notes', 'collection-review/workspace/reviews')]), 'document:review-notes-plan'))],
        'local-architect': [[{ kind: 'await', until: () => new Promise(() => undefined) }]] }),
      afterWrite: async write => { if (write === 'work-item-started' && !failedOnce) { failedOnce = true; throw new Error('Interrupted workflow after durable work assignment'); } },
    });
    service = opened.service;
    const source = await service.execute(startRun('review-notes'));
    await service.settled('review-notes', source.jobId);
    expect(service.getRun('review-notes', source.jobId)?.state, opened.warnings.join('\n')).toBe('failed');
    const sourcePath = join(fixture.root, 'plans/review-notes/.harness/jobs', source.jobId, 'events.jsonl');
    const originalLog = await readFile(sourcePath);
    const directory = 'subs/workspace/subs/reviews/src';
    await mkdir(join(fixture.root, directory), { recursive: true });
    const staged = `${directory}/retained.ts`, untracked = `${directory}/operator-fix.ts`;
    await writeFile(join(fixture.root, staged), 'export const retained = "staged";\n');
    await git('add', staged);
    await writeFile(join(fixture.root, staged), 'export const retained = "unstaged";\n');
    await writeFile(join(fixture.root, untracked), 'export const correction = true;\n');
    const before = { head: await git('rev-parse', 'HEAD'), refs: await git('show-ref'), index: await readFile(join(fixture.root, '.git/index')),
      staged: await readFile(join(fixture.root, staged)), untracked: await readFile(join(fixture.root, untracked)), sessions: opened.agent!.sessions.length };
    const inspection = (await service.restartInspection('review-notes', source.jobId))!;
    expect(inspection, JSON.stringify(inspection)).toMatchObject({ canPrepare: true, settlement: 'confirmed' });
    const prepared = await service.execute({ type: 'prepare-restart', commandId: 'native-prepare', expectedVersion: inspection.cursor,
      payload: { planId: 'review-notes', jobId: source.jobId } });
    expect(await git('rev-parse', 'HEAD')).toBe(before.head);
    expect(await git('show-ref')).toBe(before.refs);
    expect(await readFile(join(fixture.root, '.git/index'))).toEqual(before.index);
    expect(await readFile(join(fixture.root, staged))).toEqual(before.staged);
    expect(await readFile(join(fixture.root, untracked))).toEqual(before.untracked);
    expect((await readFile(sourcePath)).subarray(0, originalLog.length)).toEqual(originalLog);
    expect(prepared.jobId).toBe(source.jobId);
    await until(() => service!.events('review-notes', prepared.jobId)!.some(event => event.sequence > 0 && event.type === 'invocation-started' && event.data.role === 'local-architect'));
    expect(await git('symbolic-ref', '--short', 'HEAD')).toBe(`ramify-agent-run/${prepared.jobId}\n`);
    expect(await git('rev-parse', 'HEAD')).toBe(before.head);
    for (const line of before.refs.trim().split('\n')) {
      const [revision, ref] = line.split(' ');
      expect((await git('rev-parse', ref!)).trim()).toBe(revision);
    }
    expect(await readFile(join(fixture.root, '.git/index'))).toEqual(before.index);
    expect(await readFile(join(fixture.root, staged))).toEqual(before.staged);
    expect(await readFile(join(fixture.root, untracked))).toEqual(before.untracked);
    expect((await readFile(sourcePath)).subarray(0, originalLog.length)).toEqual(originalLog);
    // Reading a snapshot does not reserve its version: startup can still
    // append before stop's mutex-protected admission. Retry only that explicit
    // refusal, with a newly sampled version and a fresh command identity.
    const observed: { sampled: number; refusedAt?: number }[] = [];
    const deadline = Date.now() + 20_000; // the existing until bound
    let admittedCommandId: string | undefined;
    for (let attempt = 0; attempt < 20 && Date.now() < deadline; attempt++) {
      const observation = { sampled: service.getRun('review-notes', prepared.jobId)!.version, refusedAt: undefined as number | undefined };
      observed.push(observation);
      const command = stopRun('review-notes', prepared.jobId, observation.sampled);
      try {
        const receipt = await service.execute(command);
        expect(receipt.commandId).toBe(command.commandId);
        admittedCommandId = receipt.commandId;
        break;
      } catch (error) {
        if (!(error instanceof CommandRejection) || error.code !== 'stale-version') throw error;
        observation.refusedAt = error.currentVersion;
      }
    }
    const diagnostic = () => JSON.stringify({ observed, events: service!.events('review-notes', prepared.jobId)!.map(event => ({ sequence: event.sequence, type: event.type })) });
    expect(admittedCommandId, `No stop admitted within 20 attempts / 20s: ${diagnostic()}`).toBeDefined();
    await until(() => service!.getRun('review-notes', prepared.jobId)!.state === 'stopped');
    await service.settled('review-notes', prepared.jobId);
    expect(service.getRun('review-notes', prepared.jobId)!.state, diagnostic()).toBe('stopped');
    const stops = service.events('review-notes', prepared.jobId)!.filter(event => event.type === 'stop-requested');
    expect(stops, diagnostic()).toHaveLength(1);
    expect(stops[0]!.data.command.commandId).toBe(admittedCommandId);
    expect(service.events('review-notes', prepared.jobId)!.find(event => event.type === 'job-stopped')?.data, diagnostic()).toEqual({ settled: true });
  } finally { await service?.close(); await fixture.remove(); }
}, 30_000);
