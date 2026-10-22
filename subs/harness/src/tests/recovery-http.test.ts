import type { Request, Response } from 'express';
import { expect, test, vi } from 'vitest';
import { createApp } from '../http/app.js';
import { protocolPaths } from '../interfaces/protocol/paths.js';
import { commandResponseSchema } from '../interfaces/protocol/jobs.js';
import { recoveryInspectionSchema, restartInspectionSchema } from '../interfaces/protocol/runs.js';
import type { RunService } from '../run/lifecycle.js';
import { CommandRejection } from '../jobs/commands.js';
import { constructedRecord, constructedRun, runId } from './helpers/constructed.js';

const planId = 'review-notes';
const inspection = recoveryInspectionSchema.parse({ planId, runId, cursor: 1, occurrenceId: 'rec-1', revision: 2, state: 'paused',
  boundary: { kind: 'gate', candidate: 'retained-tree' }, evidence: { classification: 'check-execution', diagnostic: 'Check executable missing' },
  group: 1, automaticAttempts: 0, attempts: ['gate-1'], pausedAt: '2026-10-12T12:00:00Z', canResume: false,
  blockers: ['Environment repair declaration required'], remaining: { invocations: 80, activeMs: 50000 },
  retained: { candidate: { tree: 'retained-tree', head: 'retained-head' }, partialPaths: ['src/partial.ts'] } });

/** Calls real adapter handlers; the service boundary is scripted without claiming native HTTP or recovery authority. */
function host() {
  const run = constructedRun([], constructedRecord(), '/scripted/project');
  const receipt = { commandId: 'resume-1', jobId: runId, sequence: 2, acceptedAt: '2026-10-12T12:00:00Z' };
  const recoveryInspection = vi.fn(async () => inspection);
  const restartInspection = vi.fn(async () => restartInspectionSchema.parse({ planId, runId, cursor: 1, sourceDigest: 'source-digest', generation: 0,
    canPrepare: true, blockers: [], limitations: [], successor: null, boundary: { kind: 'invocation', role: 'local-architect' },
    preserved: ['accepted analysis'], inapplicable: [], candidate: { source: { tree: 'retained-tree', head: 'retained-head' }, current: { tree: 'retained-tree', head: 'retained-head' } },
    policy: { before: 'run-policy/8', current: 'run-policy/8' }, settlement: 'confirmed', effects: 'reconciled', changes: [] }));
  const execute = vi.fn(async () => receipt);
  const runs = { projectRoot: '/scripted/project', committed: (plan: string, id: string) => plan === planId && id === runId ? run : undefined,
    recoveryInspection, restartInspection, execute } as unknown as RunService;
  const app = createApp({ projectRoot: '/scripted/project', runs });
  const handle = async (method: 'get' | 'post', path: string, body?: unknown) => {
    const url = new URL(path, 'http://test');
    const route = (app.router.stack as unknown as Array<{ route?: { path: string; methods: Record<string, boolean>; stack: Array<{ handle(request: Request, response: Response): Promise<void> }> } }>).find(layer => {
      return layer.route?.methods[method] && new RegExp(`^${layer.route.path.replace(/:[^/]+/g, '[^/]+')}$`).test(url.pathname);
    })!.route!;
    const names = [...route.path.matchAll(/:([^/]+)/g)].map(match => match[1]!);
    const matches = new RegExp(`^${route.path.replace(/:[^/]+/g, '([^/]+)')}$`).exec(url.pathname)!;
    const params = Object.fromEntries(names.map((name, index) => [name, decodeURIComponent(matches[index + 1]!)]));
    let status = 200, result: unknown;
    const response = { status(value: number) { status = value; return this; }, json(value: unknown) { result = value; return this; } } as Response;
    await route.stack.at(-1)!.handle({ params, query: {}, body } as Request, response);
    return { status, body: result };
  };
  return { handle, recoveryInspection, restartInspection, execute, receipt };
}

test('recovery inspection validates projection and only reads the current obstruction', async () => {
  const hosted = host();
  const answer = await hosted.handle('get', protocolPaths.runRecovery(planId, runId));
  expect(answer.status).toBe(200); expect(recoveryInspectionSchema.parse(answer.body)).toEqual(inspection);
  expect(hosted.recoveryInspection).toHaveBeenCalledExactlyOnceWith(planId, runId);
  expect(hosted.execute).not.toHaveBeenCalled();
});

test('HTTP recovery resume validates current payload before delegating durable admission and exposes refusal', async () => {
  const hosted = host();
  const command = { commandId: 'resume-1', type: 'resume-recovery', payload: { planId, jobId: runId } };
  const answer = await hosted.handle('post', protocolPaths.commands, command);
  expect(answer.status).toBe(202); expect(commandResponseSchema.parse(answer.body).receipt).toEqual(hosted.receipt);
  expect(hosted.execute).toHaveBeenCalledExactlyOnceWith({ ...command, expectedVersion: 0 });
  for (const field of [{ occurrenceId: 'rec-1' }, { expectedRevision: 2 }, { repair: { areas: ['environment'], explanation: 'repaired' } }])
    await expect(hosted.handle('post', protocolPaths.commands, { ...command, payload: { ...command.payload, ...field } })).rejects.toMatchObject({ code: 'invalid-request' });
  expect(hosted.execute).toHaveBeenCalledTimes(1);
  hosted.execute.mockRejectedValueOnce(new CommandRejection('stale-version', 'Recovery occurrence changed', 3));
  await expect(hosted.handle('post', protocolPaths.commands, command)).rejects.toMatchObject({ code: 'stale-version', currentVersion: 3 });
});


test('restart HTTP inspection reads eligibility and preparation forwards exact source version', async () => {
  const hosted = host();
  const answer = await hosted.handle('get', protocolPaths.runRestart(planId, runId));
  expect(restartInspectionSchema.parse(answer.body)).toMatchObject({ preserved: ['accepted analysis'], canPrepare: true });
  expect(hosted.restartInspection).toHaveBeenCalledExactlyOnceWith(planId, runId);
  expect(hosted.execute).not.toHaveBeenCalled();
  const command = { commandId: 'prepare-1', expectedVersion: 1, type: 'prepare-restart', payload: { planId, jobId: runId } };
  expect((await hosted.handle('post', protocolPaths.commands, command)).status).toBe(202);
  expect(hosted.execute).toHaveBeenCalledExactlyOnceWith(command);
  await expect(hosted.handle('post', protocolPaths.commands, { ...command, payload: { ...command.payload, repair: { areas: ['target'], explanation: 'fix' } } })).rejects.toMatchObject({ code: 'invalid-request' });
  expect(hosted.execute).toHaveBeenCalledTimes(1);
});
