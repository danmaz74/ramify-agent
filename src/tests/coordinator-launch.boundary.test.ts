import { execFile, spawn } from 'node:child_process';
import { once } from 'node:events';
import { promisify } from 'node:util';
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
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
    expect(record.guardian.path).toBe(join(root, 'plans', '.harness', 'coordinators', record.id, 'guardian.json'));
    expect((await stat(record.guardian.path)).mode & 0o777).toBe(0o600);
    expect(JSON.parse(await readFile(record.guardian.path, 'utf8')).state).toBe('settled');
    expect(record.progress.some((event: { event: { kind: string } }) => event.event.kind === 'stopped')).toBe(true);
    const history = JSON.parse(await readFile(join(root, 'history.json'), 'utf8')); expect(history.ephemeral).toBe(false);
    await expect(cli(root, 'start', ['--plan', 'sample', '--job', started.record.jobId, '--skill', join(root, 'missing-skill.md')])).rejects.toThrow(/Detached host exited before readiness.*ENOENT/s);
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

test('concurrent detached starts with conflicting arguments admit one host and refuse the other, while a distinct observation shares the host', async () => {
  const root = await mkdtemp(join(tmpdir(), 'coordinator-start-race-')); let started: Snapshot | undefined;
  try {
    await mkdir(join(root, 'plans', 'sample'), { recursive: true });
    await writeFile(join(root, 'plans', 'sample', 'plan.md'), '# Concurrent host native witness\n');
    await writeFile(join(root, '.gitignore'), 'history.json\nwriter.pid\nheartbeat\n');
    const firstMessage = join(root, 'first.md'), secondMessage = join(root, 'second.md');
    await writeFile(firstMessage, 'First initial instructions'); await writeFile(secondMessage, 'Conflicting initial instructions');
    await execute('git', ['init', '-q'], { cwd: root }); await execute('git', ['add', '.'], { cwd: root });
    await execute('git', ['-c', 'user.name=Native witness', '-c', 'user.email=native@example.invalid', 'commit', '-qm', 'Native launch race fixture'], { cwd: root });
    const common = ['--plan', 'sample', '--replace-mcp', 'old-stdio', '--codex-executable', executable];
    const flags = [...common, '--command-id', 'race-once'];
    // Two independent CLI processes race for ownership; identical retries are
    // coalesced in coordinator-control.test.ts.
    const attempts = await Promise.allSettled([cli(root, 'start', [...flags, '--message-file', firstMessage]), cli(root, 'start', [...flags, '--message-file', secondMessage])]);
    const successes = attempts.filter((value): value is PromiseFulfilledResult<unknown> => value.status === 'fulfilled');
    started = successes[0]?.value as Snapshot | undefined;
    expect(successes).toHaveLength(1);
    expect(started).toMatchObject({ stale: false, record: { phase: 'ready' } });
    const rejected = attempts.find(value => value.status === 'rejected') as PromiseRejectedResult;
    expect(String(rejected.reason)).toContain('Start command identity conflicts with its admitted arguments');
    const observing = await cli(root, 'start', [...common, '--command-id', 'different-observation', '--message-file', secondMessage]) as Snapshot;
    expect(observing.record.id).toBe(started!.record.id);
    const admitted = JSON.parse(await readFile(join(root, 'plans', '.harness', 'coordinators', started!.record.id, 'record.json'), 'utf8'));
    const history = JSON.parse(await readFile(join(root, 'history.json'), 'utf8'));
    const admittedMessage = attempts[0]!.status === 'fulfilled' ? 'First initial instructions' : 'Conflicting initial instructions';
    expect(history.turns[0].items[0].content[0].text).toMatch(new RegExp(`${admittedMessage}$`));
    // Host/job identity is retained across every successful observation.
    expect(observing.record.jobId).toBe(started!.record.jobId); expect(admitted.startCommandId).toBe('race-once');
  } finally {
    started ??= await cli(root, 'status').catch(() => undefined) as Snapshot | undefined;
    if (started !== undefined) {
      try { await cli(root, 'stop', ['--id', started.record.id, '--command-id', 'cleanup-race']); } finally {
        await vi.waitFor(() => expect(() => process.kill(started!.record.owner.pid, 0)).toThrow(), { timeout: 5000 });
      }
    }
    await rm(root, { recursive: true, force: true });
  }
}, 45000);

async function recoveryFixture() {
  const root = await mkdtemp(join(tmpdir(), 'coordinator-recovery-'));
  await mkdir(join(root, 'plans', 'sample'), { recursive: true });
  await writeFile(join(root, 'plans', 'sample', 'plan.md'), '# Interrupted source recovery native witness\n');
  await writeFile(join(root, '.gitignore'), 'history.json\nwriter.pid\nheartbeat\n');
  await execute('git', ['init', '-q'], { cwd: root }); await execute('git', ['add', '.'], { cwd: root });
  await execute('git', ['-c', 'user.name=Native witness', '-c', 'user.email=native@example.invalid', 'commit', '-qm', 'Native recovery fixture'], { cwd: root });
  const baseline = (await execute('git', ['rev-parse', 'HEAD'], { cwd: root })).stdout.trim();
  return { root, baseline };
}
const initialFlags = ['--plan', 'sample', '--replace-mcp', 'old-stdio', '--command-id', 'recover-start', '--codex-executable', executable];
async function retained(root: string, id: string) { return JSON.parse(await readFile(join(root, 'plans', '.harness', 'coordinators', id, 'record.json'), 'utf8')); }
async function cleanupRecovery(root: string, started?: Snapshot) {
  const current = await cli(root, 'status').catch(() => undefined) as Snapshot | undefined;
  for (const host of [current, started]) if (host !== undefined) { try { await cli(root, 'stop', ['--id', host.record.id, '--command-id', `cleanup:${host.record.id}`]); } catch { /* already exited fixture */ } }
  await rm(root, { recursive: true, force: true });
}

test('resume after host crash requires guardian settlement and preserves job, partial files, persistent history and uncertain mutations', async () => {
  const { root, baseline } = await recoveryFixture(); let started: Snapshot | undefined;
  const unrelated = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { cwd: root, stdio: 'ignore' });
  try {
    started = await cli(root, 'start', initialFlags) as Snapshot;
    await writeFile(join(root, 'partial.txt'), 'staged partial work\n'); await execute('git', ['add', 'partial.txt'], { cwd: root });
    await writeFile(join(root, 'untracked.txt'), 'unfinished source\n');
    await cli(root, 'interrupt', ['--id', started.record.id, '--command-id', 'before-uncertain']);
    const message = join(root, 'message.txt'); await writeFile(message, 'hold-ack');
    const sending = cli(root, 'send', ['--id', started.record.id, '--command-id', 'uncertain-before-crash', '--message-file', message, '--timeout-ms', '1000']).catch(error => error);
    await vi.waitFor(async () => expect(await readFile(join(root, 'history.json'), 'utf8')).toContain('hold-ack'), { timeout: 10000 });
    const writer = Number(await readFile(join(root, 'writer.pid'), 'utf8'));
    const ownership = await retained(root, started.record.id); const guardianReceipt = JSON.parse(await readFile(ownership.guardian.path, 'utf8'));
    const guardianCommand = (await readFile(`/proc/${guardianReceipt.pid}/cmdline`, 'utf8')).split('\0');
    const launchReceipt = guardianCommand[3]!; expect(launchReceipt.startsWith(join(tmpdir(), 'ramify-coordinate-'))).toBe(true);
    // Durable ownership evidence must survive removal of ephemeral launch files.
    await rm(dirname(launchReceipt), { recursive: true, force: true });
    process.kill(started.record.owner.pid, 'SIGKILL'); await sending;
    const resumed = await cli(root, 'resume', ['--id', started.record.id, '--command-id', 'resume-once']) as Snapshot;
    expect(resumed).toMatchObject({ stale: false, record: { phase: 'ready', jobId: started.record.jobId, threadId: started.record.threadId, recovery: { thread: 'resumed', uncertainCommands: [{ commandId: 'uncertain-before-crash', action: 'send' }] } } });
    expect(resumed.record.id).not.toBe(started.record.id);
    expect(() => process.kill(writer, 0)).toThrow(); expect(() => process.kill(started!.record.readiness.process.providerPid, 0)).toThrow();
    expect(() => process.kill(unrelated.pid!, 0)).not.toThrow();
    expect(await readFile(join(root, 'partial.txt'), 'utf8')).toBe('staged partial work\n'); expect(await readFile(join(root, 'untracked.txt'), 'utf8')).toBe('unfinished source\n');
    expect((await execute('git', ['diff', '--cached', '--name-only'], { cwd: root })).stdout.trim()).toBe('partial.txt');
    const job = JSON.parse(await readFile(join(root, 'plans', 'sample', '.harness', 'jobs', started.record.jobId, 'job.json'), 'utf8')); expect(job.protection.baselineCommit).toBe(baseline);
    const history = JSON.parse(await readFile(join(root, 'history.json'), 'utf8')); expect(history.turns.filter((turn: { items: { content: { text: string }[] }[] }) => turn.items[0]?.content[0]?.text === 'hold-ack')).toHaveLength(1);
    const retry = await cli(root, 'send', ['--id', resumed.record.id, '--command-id', 'uncertain-before-crash', '--message-file', message]).catch(error => JSON.parse(error.stdout));
    expect(retry).toMatchObject({ state: 'uncertain', error: { kind: 'uncertain' } });
    const again = await cli(root, 'resume', ['--id', started.record.id, '--command-id', 'resume-once']) as Snapshot; expect(again.record.id).toBe(resumed.record.id);
    const previous = await retained(root, started.record.id), current = await retained(root, resumed.record.id);
    expect(JSON.parse(await readFile(previous.guardian.path, 'utf8'))).toMatchObject({ state: 'settled' });
    expect(current.replaceMcp).toContain(`ramify_host_${previous.generation.replaceAll('-', '')}`);
    const oldRuntime = JSON.parse(await readFile(join(root, 'plans', '.harness', 'coordinators', previous.id, 'runtime.json'), 'utf8'));
    const newRuntime = JSON.parse(await readFile(join(root, 'plans', '.harness', 'coordinators', current.id, 'runtime.json'), 'utf8'));
    expect(newRuntime.token).not.toBe(oldRuntime.token); expect(newRuntime.endpoint).not.toBe(oldRuntime.endpoint);
  } finally { unrelated.kill('SIGKILL'); await once(unrelated, 'close'); await cleanupRecovery(root, started); }
}, 45000);

test('explicit resume after provider exit settles descendants and supports missing history plus fresh persistent contexts', async () => {
  const { root, baseline } = await recoveryFixture(); let started: Snapshot | undefined;
  try {
    started = await cli(root, 'start', initialFlags) as Snapshot;
    const writer = Number(await readFile(join(root, 'writer.pid'), 'utf8')); process.kill(started.record.readiness.process.providerPid, 'SIGKILL');
    await vi.waitFor(async () => expect((await cli(root, 'status') as Snapshot).record.phase).toBe('provider-exited'), { timeout: 10000 });
    expect(() => process.kill(started!.record.owner.pid, 0)).not.toThrow(); expect(() => process.kill(writer, 0)).not.toThrow();
    await rm(join(root, 'history.json'));
    const resumed = await cli(root, 'resume', ['--id', started.record.id, '--command-id', 'missing-history']) as Snapshot;
    expect(resumed).toMatchObject({ stale: false, record: { phase: 'ready', jobId: started.record.jobId, recovery: { thread: 'fresh', reason: expect.stringContaining('no rollout found') } } });
    expect(resumed.record.threadId).not.toBe(started.record.threadId); expect(() => process.kill(writer, 0)).toThrow();
    const fresh = await cli(root, 'resume', ['--id', resumed.record.id, '--command-id', 'explicit-fresh', '--fresh-thread']) as Snapshot;
    expect(fresh).toMatchObject({ record: { phase: 'ready', jobId: started.record.jobId, recovery: { thread: 'fresh', reason: 'Fresh persistent context explicitly requested' } } });
    expect(fresh.record.threadId).not.toBe(resumed.record.threadId);
    const history = JSON.parse(await readFile(join(root, 'history.json'), 'utf8')); expect(history.ephemeral).toBe(false);
    const job = JSON.parse(await readFile(join(root, 'plans', 'sample', '.harness', 'jobs', started.record.jobId, 'job.json'), 'utf8')); expect(job.protection.baselineCommit).toBe(baseline);
  } finally { await cleanupRecovery(root, started); }
}, 45000);
