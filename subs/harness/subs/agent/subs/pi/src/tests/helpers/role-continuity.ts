import { expect } from 'vitest';
import type { roleSchema } from '../../../../../../../src/interfaces/protocol/runs.js';
import { nativeCall, nativeText, preservingPi } from './session.js';

export const continuityPaths = ['fresh', 'continue', 'fork', 'reconstruction'] as const;

// Each path crosses one native threshold and completes one current submission.
// Provider responses are scripted; this establishes installed Pi behavior, not
// real provider acceptance, cache benefit or consumer-specific reconciliation.
export async function checkRoleContinuity(cleanups: Array<() => Promise<void>>, role: (typeof roleSchema.options)[number], path: (typeof continuityPaths)[number]): Promise<void> {
  const history = path === 'continue' || path === 'fork';
  const evidence = { name: 'evidence', description: 'Read current task evidence.', inputSchema: { type: 'object' },
    async execute() { return { text: 'Frozen candidate, original need and pending findings. '.repeat(220) }; } };
  const outputs = [...history ? [[nativeText('Earlier orientation')]] : [],
    [nativeCall('evidence', {}, 'evidence')], [nativeText('Original need; current authority; pending finding cf-0003.')],
    [nativeText('Candidate and qualification obligation remain pending.')], [nativeCall('submit_map', { summary: `${role} completed ${path}` })]];
  const f = await preservingPi(cleanups, outputs, { tools: [evidence], nativeOptions: { contextWindow: 2048 },
    nativeCompaction: { reserveTokens: 128, keepRecentTokens: 64 },
    policy: { context: { compaction: 'allowed', budgetTokens: null, budgetFraction: null, reportReserveTokens: 0 },
      authority: { role, write: role.includes('engineer') }, validator: { candidate: 'frozen-candidate' }, destination: { task: 'pending-finding' } } });
  const task = { ...f.task, role, message: 'Original need; pending finding cf-0003; qualify frozen-candidate; current authority only.' };
  const bindings = { ...f.bindings, task };
  let point = f.initial.point!;
  if (history) point = (await (await f.operations.continue(f.input(point, 'orientation', bindings))).settled()).point!;
  if (path === 'fork') point = (await f.operations.fork({ runId: 'pi-test', operationId: 'fork', sourcePoint: point })).point!;
  if (path === 'reconstruction') {
    // The caller names fresh reconstruction from original instructions/task.
    // This is the adapter entrypoint; service-level reconstruction is witnessed
    // separately because it must reconcile effects and authenticate the source.
    point = (await f.operations.create({ runId: 'pi-test', operationId: 'reconstruct', initialInstructions: 'Exact role instructions.',
      declarations: f.declarations, activate: f.declarations.map(item => item.name), policy: f.policy })).point!;
  }
  const result = await (await f.operations.continue(f.input(point, 'current-task', bindings))).settled();
  expect(result.outcome).toEqual({ kind: 'submitted', input: { summary: `${role} completed ${path}` } });
  expect(result.sessionId).toBe(point.sessionId);
  expect(f.events.some(event => event.type === 'compaction')).toBe(true);
  expect(f.judged).toEqual([{ summary: `${role} completed ${path}` }]);
  const beforeCompaction = f.native.requests[history ? 1 : 0]!['input'] as Array<{ role?: string; content?: unknown }>;
  const notices = beforeCompaction.filter(item => item.role === 'developer' && typeof item.content === 'string' && item.content.startsWith('You have '));
  expect(notices).toHaveLength(history ? 2 : 1);
  expect(f.native.requests.at(-1)!['instructions']).toBe(['Exact role instructions.', ...notices.map(item => item.content)].join('\n\n'));
  f.native.verify();
}
