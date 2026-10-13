import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { gitService, gitCandidateSource } from '../../subs/evidence/src/git.js';
import { copyFixture } from './helpers/fixture.js';
import { analysis, entry } from './helpers/analysis.js';
import { byRole, submit, treeInputs } from './helpers/iterations.js';
import { openRuns, startRun, stopRun, until } from './helpers/runs.js';

const execute = promisify(execFile);

test('restart preparation and resumed branch setup preserve native source refs index and dirty files', async () => {
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
    const opened = await openRuns(fixture.root, { git: gitService, candidates: gitCandidateSource,
      inputs: { ...inputs, capture: async (...args: Parameters<typeof inputs.capture>) => {
        const captured = await inputs.capture(...args); return { ...captured, versions: { ...captured.versions, ramify: '0.5.0' } };
      } }, script: byRole({ 'initial-architect': [submit(analysis([entry('review-notes', 'collection-review/workspace/reviews')]))],
        'local-architect': [[{ kind: 'legacy-context-return', tokens: 150_000 }], [{ kind: 'await', until: () => new Promise(() => undefined) }]] }) });
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
    expect(await readFile(sourcePath)).toEqual(originalLog);
    expect(opened.agent!.sessions).toHaveLength(before.sessions);
    const recovery = (await service.recoveryInspection('review-notes', prepared.jobId))!;
    expect(recovery).toMatchObject({ state: 'paused' });
    await service.execute({ type: 'resume-recovery', commandId: 'native-resume', expectedVersion: 0, payload: { planId: 'review-notes', jobId: prepared.jobId,
      occurrenceId: recovery.occurrenceId, expectedRevision: recovery.revision,
      repair: { areas: ['runtime', 'target'], explanation: 'Adopt continuity while preserving the staged, unstaged and untracked operator corrections' } } });
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
    expect(await readFile(sourcePath)).toEqual(originalLog);
    await service.execute(stopRun('review-notes', prepared.jobId, service.getRun('review-notes', prepared.jobId)!.version));
  } finally { await service?.close(); await fixture.remove(); }
}, 30_000);
