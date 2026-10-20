import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { expect, test, vi } from 'vitest';
import { ownedTreeKernelPath } from '../../../../src/owned-tree-kernel.js';
import { coordinatorStartSchema } from '../coordinator-contracts.js';
import { readCoordinator } from '../coordinator-store.js';
import { coordinatorStatus } from '../coordinator-client.js';
import { requireCoordinatorSettlement } from '../coordinator-recovery.js';
import { startCoordinatorHost, type CoordinatorHost } from '../coordinator-host.js';

async function connect(endpoint: string, token: string) { const client = new Client({ name: 'recovery-witness', version: '1' }); await client.connect(new StreamableHTTPClientTransport(new URL(`${endpoint}/mcp`), { requestInit: { headers: { authorization: `Bearer ${token}` } } })); return client; }
const baseline = 'a'.repeat(40);
const assistance = { registrationProtection: async () => ({ baselineCommit: baseline, rules: { explicitPaths: [], excludedPaths: [], guardedPaths: [], additions: 'protect' as const }, gaps: [], unavailable: null }), resolveCommit: async (_root: string, revision: string) => revision === 'HEAD' ? baseline : revision, currentHead: async () => baseline, isCleanRepository: async () => true };

test('host guardian settles actual assessor and provider orphans after host death while retained assessment waits for explicit resume', async () => {
  const root = await mkdtemp(join(tmpdir(), 'coordinator-assessor-crash-')); let host: CoordinatorHost | undefined; let first: Client | undefined; let second: Client | undefined;
  const unrelated = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
  let guardian: ReturnType<typeof spawn> | undefined; let guardianClosed: Promise<unknown[]> | undefined; let ownerPid: number | undefined; let writer: number | undefined; let providerWriter: number | undefined;
  try {
    await mkdir(join(root, 'plans', 'sample'), { recursive: true }); await writeFile(join(root, 'plans', 'sample', 'plan.md'), '# Interrupted assessment\n');
    const skill = join(root, 'skill.md'); await writeFile(skill, 'Reuse supplied registration.');
    const options = coordinatorStartSchema.parse({ projectRoot: root, planId: 'sample', commandId: 'guardian-launch', skill, codexExecutable: fileURLToPath(new URL('./native-provider.py', import.meta.url)), replaceMcp: ['old-stdio'] });
    const descriptor = { path: join(root, 'guardian.json'), generation: randomUUID() }; const request = join(root, 'launch.json');
    await writeFile(request, JSON.stringify({ options, guardian: descriptor }), { mode: 0o600 });
    guardian = spawn('python3', [fileURLToPath(new URL('../coordinator-guardian.py', import.meta.url)), ownedTreeKernelPath(), descriptor.path, descriptor.generation, process.execPath, '--import', import.meta.resolve('tsx'), fileURLToPath(new URL('./native-recovery-host.ts', import.meta.url)), request], { cwd: root, stdio: 'ignore' });
    guardianClosed = once(guardian, 'close');
    await vi.waitFor(async () => expect((await coordinatorStatus(root)).record.phase).toBe('ready'), { timeout: 10000 });
    const previous = (await readCoordinator(root)).record; const runtime = (await readCoordinator(root)).runtime!; ownerPid = previous.owner.pid;
    first = await connect(runtime.endpoint, runtime.token);
    const admission = await first.callTool({ name: 'iteration_assess', arguments: { plan_id: 'sample', job_id: previous.jobId, base: baseline, candidate: 'b'.repeat(40), kind: 'iteration', brief: 'Native interrupted assessment', acceptance: [], command_id: 'assessment-once' } }); expect(admission.isError).not.toBe(true);
    await vi.waitFor(async () => { writer = Number(await readFile(join(root, 'assessment-writer.pid'), 'utf8')); expect(writer).toBeGreaterThan(0); });
    providerWriter = Number(await readFile(join(root, 'writer.pid'), 'utf8'));
    const assessment = (await coordinatorStatus(root)).assessments[0]!; expect(assessment.status).toBe('running');
    await first.close(); process.kill(ownerPid, 'SIGKILL');
    await requireCoordinatorSettlement(previous); await guardianClosed;
    expect(() => process.kill(writer!, 0)).toThrow(); expect(() => process.kill(providerWriter!, 0)).toThrow(); expect(() => process.kill(unrelated.pid!, 0)).not.toThrow();
    expect(JSON.parse(await readFile(descriptor.path, 'utf8'))).toMatchObject({ state: 'settled', hostPid: ownerPid });
    let resumedAssessments = 0;
    host = await startCoordinatorHost({ ...options, commandId: 'continue', jobId: previous.jobId!, resumeFrom: previous.id, replaceMcp: [...options.replaceMcp, `ramify_host_${previous.generation.replaceAll('-', '')}`] }, { assistance, runtime: { assessor: async () => { resumedAssessments++; return { gate: 'clear', summary: 'Scripted resumed assessor', repairs: [], decisions: [], gaps: [], evidence: [] }; }, close: async () => undefined } });
    await host.ready; expect(host.store.record.phase).toBe('ready');
    expect((await host.snapshot()).assessments).toMatchObject([{ id: assessment.id, status: 'interrupted' }]); expect(resumedAssessments).toBe(0);
    const current = (await readCoordinator(root)).runtime!; second = await connect(current.endpoint, current.token);
    expect((await second.callTool({ name: 'assessment_resume', arguments: { plan_id: 'sample', job_id: previous.jobId, assessment_id: assessment.id, command_id: 'explicit-assessment-resume' } })).isError).not.toBe(true);
    await vi.waitFor(async () => expect((await host!.snapshot()).assessments).toMatchObject([{ id: assessment.id, status: 'completed' }])); expect(resumedAssessments).toBe(1);
    expect((await second.callTool({ name: 'assessment_result', arguments: { plan_id: 'sample', job_id: previous.jobId, assessment_id: assessment.id } })).isError).not.toBe(true);
  } finally {
    await first?.close(); await second?.close();
    if (host !== undefined) { await host.control({ action: 'stop', commandId: 'cleanup' }); await host.closed; }
    if (guardian !== undefined && guardian.exitCode === null && guardian.signalCode === null) { if (ownerPid !== undefined) { try { process.kill(ownerPid, 'SIGKILL'); } catch { /* already gone */ } } guardian.kill('SIGTERM'); await guardianClosed; }
    for (const pid of [writer, providerWriter]) if (pid !== undefined) { try { process.kill(pid, 'SIGKILL'); } catch { /* already settled */ } }
    unrelated.kill('SIGKILL'); await once(unrelated, 'close'); await rm(root, { recursive: true, force: true });
  }
}, 20000);
