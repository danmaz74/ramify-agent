import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';
import { expect, test } from 'vitest';
import { prepareCoordinatorProvider } from '../coordinator-provider.js';
import type { CodexProvider } from '../../../agent/subs/codex/src/interfaces/provider.js';

const executable = fileURLToPath(new URL('./native-provider.py', import.meta.url));

test.each(['active', 'provider-exit'])('assistance settles a setsid orphan after %s while preserving unrelated execution and persistent history', async mode => {
  const cwd = await mkdtemp(join(tmpdir(), 'ramify-codex-native-'));
  const unrelated = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
  await once(unrelated, 'spawn');
  let provider: CodexProvider | undefined;
  let writerPid: number | undefined;
  try {
    let retained = false;
    const prepared = await prepareCoordinatorProvider({ launch: { cwd, executable, configOverrides: ['approval_policy="on-request"', 'sandbox_mode="workspace-write"'] }, thread: { cwd, model: 'gpt-6-astra' }, workerModel: 'gpt-6-sol',
      retain: async (session, readiness) => {
        expect(session.thread.ephemeral).toBe(false);
        expect(readiness.process.providerPid).toBeGreaterThan(0);
        expect(readiness.process.supervisorIdentity).toMatch(/.+:\d+$/);
        retained = true;
      } });
    provider = prepared.provider;
    expect(prepared.equipment).toMatchObject({ approvalPolicy: 'never', sandbox: 'danger-full-access' });
    expect(prepared.session).toMatchObject({ approvalPolicy: 'never', sandbox: 'dangerFullAccess' });
    expect(retained).toBe(true);
    const exited = new Promise<void>(resolve => provider!.observe(event => { if (event.kind === 'provider-exit') resolve(); }));
    const turn = await provider.send(prepared.session.thread.id, mode === 'active' ? 'orphan' : 'exit-with-child');
    writerPid = Number(await readFile(join(cwd, 'writer.pid'), 'utf8'));
    expect(() => process.kill(writerPid!, 0)).not.toThrow();
    if (mode === 'active') {
      expect((await provider.interrupt(prepared.session.thread.id, turn.id)).descendants).toBe('not-established');
      expect(() => process.kill(writerPid!, 0)).not.toThrow();
      expect((await provider.readThread(prepared.session.thread.id)).turns[0]!.status).toBe('interrupted');
    } else {
      await exited;
      expect(() => process.kill(writerPid!, 0)).not.toThrow();
      await expect(provider.readThread(prepared.session.thread.id)).rejects.toMatchObject({ kind: 'unavailable' });
    }
    const settlement = await provider.stop();
    expect(settlement).toEqual({ confirmed: true, descendants: 'settled', supervisorExited: true, reason: null });
    expect(() => process.kill(writerPid!, 0)).toThrow();
    expect(() => process.kill(prepared.readiness.process.supervisorPid, 0)).toThrow();
    expect(() => process.kill(unrelated.pid!, 0)).not.toThrow();
    const resumed = await prepareCoordinatorProvider({ launch: { cwd, executable }, thread: { cwd, model: 'gpt-6-astra' }, workerModel: 'gpt-6-sol',
      resumeThreadId: prepared.session.thread.id, retain: async () => undefined });
    provider = resumed.provider;
    const history = await provider.readThread(prepared.session.thread.id);
    expect(history.turns[0]!.messages[0]!.text).toBe(mode === 'active' ? 'orphan' : 'exit-with-child');
    expect(history.ephemeral).toBe(false);
    expect((await provider.stop()).confirmed).toBe(true);
  } finally {
    await provider?.stop();
    unrelated.kill('SIGKILL');
    await once(unrelated, 'close');
    // This is cleanup of the exact fixture-owned PID, never another session.
    if (writerPid !== undefined) { try { process.kill(writerPid, 'SIGKILL'); } catch { /* reaped */ } }
    await rm(cwd, { recursive: true, force: true });
  }
}, 15_000);
