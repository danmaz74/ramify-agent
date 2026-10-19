import { execFile, spawn } from 'node:child_process';
import { once } from 'node:events';
import { promisify } from 'node:util';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, vi } from 'vitest';

const execute = promisify(execFile);
const main = fileURLToPath(new URL('../main.ts', import.meta.url));
const executable = fileURLToPath(new URL('../../subs/harness/subs/assistance/src/tests/native-provider.py', import.meta.url));
interface Snapshot { record: { id: string; generation: string; jobId: string; threadId: string; phase: string; owner: { pid: number }; readiness: { process: { providerPid: number; supervisorPid: number } }; ownershipReleased: boolean }; stale: boolean }
async function cli(root: string, action: string, flags: readonly string[] = []): Promise<unknown> {
  const answer = await execute(process.execPath, ['--import', import.meta.resolve('tsx'), main, 'coordinate', action, '--project', root, ...flags, '--json'], { cwd: root, timeout: 20000, maxBuffer: 2_000_000 });
  return JSON.parse(answer.stdout);
}

test('detached CLI host survives its launching command, reconnects without another registration and settles actual provider orphan descendants on stop', async () => {
  const root = await mkdtemp(join(tmpdir(), 'coordinator-detach-')); let started: Snapshot | undefined; let restarted: Snapshot | undefined; let writer: number | undefined;
  try {
    await mkdir(join(root, 'plans', 'sample'), { recursive: true });
    await writeFile(join(root, 'plans', 'sample', 'plan.md'), '# Detached host native witness\n');
    await writeFile(join(root, '.gitignore'), 'history.json\nwriter.pid\nheartbeat\n');
    await execute('git', ['init', '-q'], { cwd: root }); await execute('git', ['add', '.'], { cwd: root });
    await execute('git', ['-c', 'user.name=Native witness', '-c', 'user.email=native@example.invalid', 'commit', '-qm', 'Native launch fixture'], { cwd: root });
    started = await cli(root, 'start', ['--plan', 'sample', '--replace-mcp', 'old-stdio', '--command-id', 'native-launch-once', '--codex-executable', executable]) as Snapshot;
    expect(started).toMatchObject({ stale: false, record: { phase: 'ready', threadId: 'persistent-native-thread' } });
    // execFile's launching CLI has exited. Its stdio pipes have closed.
    expect(() => process.kill(started!.record.owner.pid, 0)).not.toThrow();
    writer = Number(await readFile(join(root, 'writer.pid'), 'utf8')); expect(() => process.kill(writer!, 0)).not.toThrow();
    const before = await readFile(join(root, 'heartbeat'), 'utf8');
    await vi.waitFor(async () => expect(await readFile(join(root, 'heartbeat'), 'utf8')).not.toBe(before));
    const again = await cli(root, 'start', ['--plan', 'sample', '--job', started.record.jobId]) as Snapshot;
    expect(again.record).toMatchObject({ id: started.record.id, generation: started.record.generation, jobId: started.record.jobId, threadId: started.record.threadId });
    const status = await cli(root, 'status', ['--id', started.record.id]) as Snapshot; expect(status.stale).toBe(false);
    const watch = spawn(process.execPath, ['--import', import.meta.resolve('tsx'), main, 'coordinate', 'watch', '--project', root, '--id', started.record.id, '--json'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
    watch.stderr!.resume();
    try {
      await once(watch.stdout!, 'data'); watch.stdout!.resume();
      watch.kill('SIGINT'); expect((await once(watch, 'close'))[0]).toBe(0);
      expect(() => process.kill(started!.record.owner.pid, 0)).not.toThrow(); expect(() => process.kill(writer!, 0)).not.toThrow();
    } finally { if (watch.exitCode === null && watch.signalCode === null) { watch.kill('SIGKILL'); await once(watch, 'close'); } }
    const pending = await cli(root, 'interrupt', ['--id', started.record.id, '--command-id', 'interrupt-once']);
    expect(pending).toMatchObject({ state: 'completed', result: { descendants: 'not-established', assessments: 'not-controlled' } });
    expect(() => process.kill(writer!, 0)).not.toThrow();
    const stopped = await cli(root, 'stop', ['--id', started.record.id, '--command-id', 'stop-once']);
    expect(stopped).toMatchObject({ state: 'completed', result: { confirmed: true, descendants: 'settled', supervisorExited: true } });
    await vi.waitFor(() => expect(() => process.kill(started!.record.owner.pid, 0)).toThrow(), { timeout: 5000 });
    expect(() => process.kill(writer!, 0)).toThrow(); expect(() => process.kill(started!.record.readiness.process.providerPid, 0)).toThrow();
    const record = JSON.parse(await readFile(join(root, 'plans', '.harness', 'coordinators', started.record.id, 'record.json'), 'utf8'));
    expect(record).toMatchObject({ phase: 'stopped', ownershipReleased: true });
    expect(record.progress.some((event: { event: { kind: string } }) => event.event.kind === 'stopped')).toBe(true);
    const history = JSON.parse(await readFile(join(root, 'history.json'), 'utf8')); expect(history.ephemeral).toBe(false);
    restarted = await cli(root, 'start', ['--plan', 'sample', '--job', started.record.jobId, '--replace-mcp', 'old-stdio', '--codex-executable', executable]) as Snapshot;
    expect(restarted.record.id).not.toBe(started.record.id); expect(restarted.record.jobId).toBe(started.record.jobId); expect(restarted.stale).toBe(false);
  } finally {
    if (restarted !== undefined) { try { await cli(root, 'stop', ['--id', restarted.record.id, '--command-id', 'cleanup-restarted']); } catch { /* retain original assertion */ } }
    if (started !== undefined) {
      try { await cli(root, 'stop', ['--id', started.record.id, '--command-id', 'cleanup-stop']); } catch { /* already settled */ }
      // Only exact fixture-owned identities, retained above, may need fallback cleanup.
      for (const pid of [writer, started.record.owner.pid]) if (pid !== undefined) { try { process.kill(pid, 'SIGKILL'); } catch { /* settled */ } }
    }
    await rm(root, { recursive: true, force: true });
  }
}, 45000);
