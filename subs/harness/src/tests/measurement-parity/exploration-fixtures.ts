import type { ExplorationObservation } from '../../../subs/kpi/src/exploration.js';
export const observation = (id: string, extra: Partial<ExplorationObservation> = {}): ExplorationObservation => ({
  id, invocationId: 'inv1', operationId: 'op1', role: 'engineer', sessionId: 'session1', turn: 1, callId: id,
  kind: 'read', requestedScope: ['a.ts'], resolvedScope: ['a.ts'], files: ['a.ts'], returnedBytes: 10,
  startedAt: null, endedAt: null, elapsedMs: 5, outcome: 'completed', broad: false, outsideScope: false, coverage: [], ...extra,
});
export const fixture = [observation('r1'), observation('r2', { returnedBytes: 6, elapsedMs: 3 }),
  observation('r3', { requestedScope: ['b.ts'], resolvedScope: ['b.ts'], files: ['b.ts'], returnedBytes: 4, elapsedMs: null }),
  observation('s1', { kind: 'search', requestedScope: ['**'], resolvedScope: ['.'], files: [], returnedBytes: 0, broad: true, elapsedMs: 7 }),
  observation('s2', { kind: 'search', requestedScope: ['outside'], resolvedScope: ['outside'], files: ['outside/c.ts'], returnedBytes: 2, outsideScope: true, elapsedMs: 2 })];
