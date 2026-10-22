import { execFile, spawn } from 'node:child_process';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { expect, test, vi } from 'vitest';
import { ownedTreeKernelPath } from '../../../../src/owned-tree-kernel.js';
import { coordinatorStartSchema } from '../coordinator-contracts.js';
import { coordinatorDirectory, readCoordinator, readCoordinatorHistory } from '../coordinator-store.js';

const execute = promisify(execFile);
const main = fileURLToPath(new URL('../../../../../../src/main.ts', import.meta.url));
const executable = fileURLToPath(new URL('./native-provider.py', import.meta.url));
async function cli(root: string, action: string, flags: readonly string[] = [], retained = false) {
  try { return JSON.parse((await execute(process.execPath, ['--import', import.meta.resolve('tsx'), main, 'coordinate', action, '--project', root, ...flags, '--json'], { cwd: root, timeout: 20000, maxBuffer: 2_000_000 })).stdout); }
  catch (error) { const outcome = error as { code?: number; stdout?: string }; if (retained && outcome.code === 2 && outcome.stdout) return JSON.parse(outcome.stdout); throw error; }
}

test('startup crashes before and after successor admission plus listener failure recover the original job and complete lineage without replay or index edits', async () => {
  // One project and one stopped predecessor serve all three stages: each stage
  // continues from the generation the previous stage left stopped. Replay of
  // retained receipts and identity conflicts are owned by coordinator-launch
  // and coordinator-control.
  const root = await mkdtemp(join(tmpdir(), 'coordinator-publication-'));
  let guardian: ReturnType<typeof spawn> | undefined; let guardianClosed: Promise<unknown[]> | undefined; let hostPid: number | undefined;
  try {
    await mkdir(join(root, 'plans', 'sample'), { recursive: true }); await writeFile(join(root, 'plans', 'sample', 'plan.md'), '# Early continuation failure witness\n');
    await writeFile(join(root, '.gitignore'), 'history.json\nwriter.pid\nheartbeat\n');
    const originalDirections = join(root, 'original.md'), extraDirections = join(root, 'extra.md');
    await writeFile(originalDirections, 'Original retained task directions'); await writeFile(extraDirections, 'Additional successor directions');
    await execute('git', ['init', '-q'], { cwd: root }); await execute('git', ['add', '.'], { cwd: root });
    await execute('git', ['-c', 'user.name=Native witness', '-c', 'user.email=native@example.invalid', 'commit', '-qm', 'Native publication fixture'], { cwd: root });
    const baseline = (await execute('git', ['rev-parse', 'HEAD'], { cwd: root })).stdout.trim();
    const initial = await cli(root, 'start', ['--plan', 'sample', '--replace-mcp', 'old-stdio', '--command-id', 'start-once', '--message-file', originalDirections, '--codex-executable', executable]);
    await cli(root, 'interrupt', ['--id', initial.record.id, '--command-id', 'before-uncertain']);
    const uncertainFile = join(root, 'uncertain.txt'); await writeFile(uncertainFile, 'hold-ack');
    await expect(cli(root, 'send', ['--id', initial.record.id, '--command-id', 'uncertain-once', '--message-file', uncertainFile, '--timeout-ms', '1000'])).rejects.toThrow(/delivery may be uncertain/);
    await cli(root, 'stop', ['--id', initial.record.id, '--command-id', 'settle-before-publication']);
    const firstThread = (await readCoordinator(root, initial.record.id)).record.threadId;
    for (const stage of ['before-admission', 'after-admission', 'listener-failure'] as const) {
      const launchDirectory = await mkdtemp(join(tmpdir(), 'coordinator-publication-launch-'));
      try {
        const previous = (await readCoordinatorHistory(root)).latest.record;
        expect(previous.phase).toBe('stopped');
        const unchangedHistory = await readFile(join(root, 'history.json'), 'utf8');
        const retained = JSON.parse(await readFile(join(coordinatorDirectory(root), previous.id, 'task.json'), 'utf8')).message as string;
        const previousHost = `ramify_host_${previous.generation.replaceAll('-', '')}`;
        const id = `coord-${randomUUID()}`; const descriptor = { path: join(coordinatorDirectory(root), id, 'guardian.json'), generation: randomUUID() };
        const options = coordinatorStartSchema.parse({ projectRoot: root, planId: previous.planId, jobId: previous.jobId, commandId: `admit-${stage}`, resumeFrom: previous.id, model: 'gpt-6-sol', workerModel: previous.workerModel, assessmentModel: 'retained-assessor', freshThread: true, skill: previous.skill, codexExecutable: previous.codexExecutable, replaceMcp: [...new Set([...previous.replaceMcp, previousHost, 'added-stdio'])], message: `${retained}\nAdditional successor directions` });
        const request = join(launchDirectory, 'launch.json'), marker = join(launchDirectory, 'marker.json'), receipt = join(launchDirectory, 'guardian.json');
        await writeFile(request, JSON.stringify({ options, id, guardian: descriptor, marker, stage }), { mode: 0o600 });
        guardian = spawn('python3', [fileURLToPath(new URL('../coordinator-guardian.py', import.meta.url)), ownedTreeKernelPath(), receipt, descriptor.generation, process.execPath, '--import', import.meta.resolve('tsx'), fileURLToPath(new URL('./native-publication-host.ts', import.meta.url)), request], { cwd: root, env: { ...process.env, RAMIFY_COORDINATOR_GUARDIAN_RECORD: descriptor.path }, stdio: 'ignore' });
        guardianClosed = once(guardian, 'close'); hostPid = undefined;
        await vi.waitFor(async () => { hostPid = (JSON.parse(await readFile(marker, 'utf8')) as { pid: number }).pid; expect(hostPid).toBeGreaterThan(0); }, { timeout: 10000 });
        if (stage !== 'listener-failure') process.kill(hostPid!, 'SIGKILL');
        await guardianClosed;
        expect(JSON.parse(await readFile(descriptor.path, 'utf8'))).toMatchObject({ state: 'settled', hostPid });
        expect(await readFile(join(root, 'history.json'), 'utf8')).toBe(unchangedHistory);
        const retryFlags = ['--id', previous.id, '--command-id', `admit-${stage}`, '--fresh-thread', '--model', 'gpt-6-sol', '--assessment-model', 'retained-assessor', '--replace-mcp', 'added-stdio', '--message-file', extraDirections];
        let continued;
        if (stage === 'before-admission') {
          await expect(readCoordinator(root, id)).rejects.toMatchObject({ code: 'ENOENT' });
          expect((await readCoordinatorHistory(root)).latest.record.id).toBe(previous.id);
          const retry = await Promise.all([cli(root, 'resume', retryFlags), cli(root, 'resume', retryFlags)]);
          expect(retry[0].record.id).toBe(retry[1].record.id); expect(retry[0].record.id).not.toBe(id);
          continued = retry[0];
        } else {
          const admitted = (await readCoordinator(root, id)).record;
          expect(admitted).toMatchObject({ jobId: previous.jobId, resumeFrom: previous.id, freshThread: true, model: 'gpt-6-sol', assessmentModel: 'retained-assessor' });
          expect(JSON.parse(await readFile(join(coordinatorDirectory(root), id, 'task.json'), 'utf8')).message).toBe(options.message);
          const index = JSON.parse(await readFile(join(coordinatorDirectory(root), 'active.json'), 'utf8'));
          expect(index.id).toBe(stage === 'after-admission' ? previous.id : id);
          expect((await readCoordinatorHistory(root)).latest.record.id).toBe(id);
          if (stage === 'listener-failure') expect((await cli(root, 'resume', retryFlags, true)).record).toMatchObject({ id, phase: 'error', jobId: previous.jobId });
          else await expect(cli(root, 'resume', [...retryFlags, '--timeout-ms', '250'])).rejects.toThrow(new RegExp(`Launch outcome uncertain for ${id}`));
          // The index may still name the predecessor; the lineage refuses a branch from it.
          await expect(cli(root, 'resume', ['--id', previous.id, '--command-id', `branch-refused-${stage}`])).rejects.toThrow(/Stale coordinator predecessor/);
          expect(await readFile(join(root, 'history.json'), 'utf8')).toBe(unchangedHistory);
          // The ordinary next generation advances the index; no repair protocol.
          continued = await cli(root, 'resume', ['--id', id, '--command-id', `continue-failed-admission-${stage}`]);
          expect(continued.record.resumeFrom).toBe(id);
          expect(continued.record.replaceMcp).not.toContain(`ramify_host_${admitted.generation.replaceAll('-', '')}`);
        }
        expect(continued.record).toMatchObject({ phase: 'ready', jobId: previous.jobId, model: 'gpt-6-sol', assessmentModel: 'retained-assessor', recovery: { thread: 'fresh', uncertainCommands: [{ commandId: 'uncertain-once', action: 'send' }] } });
        expect(continued.record.threadId).not.toBe(previous.threadId); expect(continued.record.threadId).not.toBe(firstThread);
        expect(continued.record.replaceMcp).toEqual(expect.arrayContaining(['old-stdio', 'added-stdio', previousHost]));
        expect(JSON.parse(await readFile(join(coordinatorDirectory(root), 'active.json'), 'utf8')).id).toBe(continued.record.id);
        expect(JSON.parse(await readFile(join(coordinatorDirectory(root), continued.record.id, 'task.json'), 'utf8')).message).toBe(options.message);
        expect((await execute('git', ['rev-parse', 'HEAD'], { cwd: root })).stdout.trim()).toBe(baseline);
        const detail = JSON.parse(await readFile(join(root, 'plans', 'sample', '.harness', 'jobs', previous.jobId!, 'job.json'), 'utf8'));
        expect(detail.protection.baselineCommit).toBe(baseline);
        expect(await readdir(join(root, 'plans', 'sample', '.harness', 'jobs'))).toEqual([initial.record.jobId]);
        await cli(root, 'stop', ['--id', continued.record.id, '--command-id', `stop-${stage}`]);
      } finally {
        if (guardian !== undefined && guardian.exitCode === null && guardian.signalCode === null) { if (hostPid !== undefined) { try { process.kill(hostPid, 'SIGKILL'); } catch { /* already gone */ } } guardian.kill('SIGTERM'); await guardianClosed; }
        await rm(launchDirectory, { recursive: true, force: true });
      }
    }
  } finally {
    const current = await readCoordinatorHistory(root).then(history => history.latest).catch(() => undefined);
    if (current !== undefined) await cli(root, 'stop', ['--id', current.record.id, '--command-id', 'cleanup']).catch(() => undefined);
    await rm(root, { recursive: true, force: true });
  }
}, 120000);

test('exact resume intent stays stable when predecessor thread adoption finishes during stop and changed explicit intent still conflicts', async () => {
  const root = await mkdtemp(join(tmpdir(), 'coordinator-adoption-race-'));
  let starting: ReturnType<typeof cli> | undefined; let continuing: ReturnType<typeof cli> | undefined;
  try {
    await mkdir(join(root, 'plans', 'sample'), { recursive: true }); await writeFile(join(root, 'plans', 'sample', 'plan.md'), '# Thread adoption during stop\n');
    await writeFile(join(root, '.gitignore'), 'history.json\nwriter.pid\nheartbeat\nhold-thread-start\nthread-start-held.json\n');
    await execute('git', ['init', '-q'], { cwd: root }); await execute('git', ['add', '.'], { cwd: root });
    await execute('git', ['-c', 'user.name=Native witness', '-c', 'user.email=native@example.invalid', 'commit', '-qm', 'Native adoption fixture'], { cwd: root });
    const initial = await cli(root, 'start', ['--plan', 'sample', '--replace-mcp', 'old-stdio', '--command-id', 'start-once', '--codex-executable', executable]);
    await cli(root, 'stop', ['--id', initial.record.id, '--command-id', 'stop-initial']);
    await writeFile(join(root, 'hold-thread-start'), 'Hold only this fixture thread/start response');
    starting = cli(root, 'resume', ['--id', initial.record.id, '--command-id', 'pending-fresh-context', '--fresh-thread'], true).catch(error => error);
    await vi.waitFor(async () => expect(JSON.parse(await readFile(join(root, 'thread-start-held.json'), 'utf8')).threadId).toBeTruthy(), { timeout: 10000 });
    const predecessor = (await readCoordinatorHistory(root)).latest.record;
    expect(predecessor).toMatchObject({ phase: 'preparing', threadId: null, freshThread: true });
    const flags = ['--id', predecessor.id, '--command-id', 'resume-during-adoption'];
    continuing = cli(root, 'resume', flags); void continuing.catch(() => undefined);
    await vi.waitFor(async () => expect((await readCoordinator(root, predecessor.id)).record.phase).toBe('stopping'), { timeout: 10000 });
    await rm(join(root, 'hold-thread-start'));
    const successor = await continuing;
    const stopped = (await readCoordinator(root, predecessor.id)).record;
    expect(stopped).toMatchObject({ phase: 'stopped', freshThread: true, ownershipReleased: true }); expect(stopped.threadId).not.toBeNull();
    expect(successor.record).toMatchObject({ phase: 'ready', threadId: stopped.threadId, freshThread: false, jobId: initial.record.jobId, recovery: { thread: 'resumed' } });
    expect((await starting).record.id).toBe(predecessor.id);
    const beforeRetry = await readFile(join(root, 'history.json'), 'utf8');
    const retried = await cli(root, 'resume', flags);
    expect(retried.record.id).toBe(successor.record.id);
    expect(await readFile(join(root, 'history.json'), 'utf8')).toBe(beforeRetry);
    await expect(cli(root, 'resume', [...flags, '--fresh-thread'])).rejects.toThrow(/identity conflicts/);
    expect((await readCoordinatorHistory(root)).latest.record.id).toBe(successor.record.id);
    await cli(root, 'stop', ['--id', successor.record.id, '--command-id', 'stop-successor']);
  } finally {
    await rm(join(root, 'hold-thread-start'), { force: true }); await starting; await continuing?.catch(() => undefined);
    const current = await readCoordinatorHistory(root).then(history => history.latest).catch(() => undefined);
    if (current !== undefined) await cli(root, 'stop', ['--id', current.record.id, '--command-id', 'cleanup']).catch(() => undefined);
    await rm(root, { recursive: true, force: true });
  }
}, 45000);
