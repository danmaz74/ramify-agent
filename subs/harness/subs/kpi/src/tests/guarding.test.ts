import { expect, test } from 'vitest';
import { guardingReport } from '../guarding.js';
import { observationSchema, type Observation } from '../../../../src/run/observations.js';
const at = '2026-01-01T00:00:00.000Z';
const guard = (tool: string, verdict: 'allowed' | 'blocked-scope' | 'blocked-unresolved'): Observation => ({ n: 1, at, type: 'guard',
  data: { callId: tool, tool, requested: 'a', resolved: 'a', owner: null, scopeRevision: 1, verdict, reason: 'recorded' } });
const activity = (callId: string, tool: string): Observation => ({ n: 1, at, type: 'activity', data: { activity: { kind: 'tool', callId, tool } } });
const mutation = (callId: string | null, attributable: boolean): Observation => ({ n: 1, at, type: 'mutation',
  data: { callId, paths: ['a'], added: 1, deleted: 0, observedBy: attributable ? 'tool' : 'snapshot', toolFailed: false, attributable } });

test('unguarded shell coverage retains the integration report, without an execution service', () => {
  const observations: Observation[] = [guard('edit', 'allowed'), activity('shell-call', 'shell'), mutation('shell-call', false),
    { n: 1, at, type: 'excursion', data: { callId: 'r1', module: 'reviews', firstEntry: true } },
    { n: 1, at, type: 'excursion', data: { callId: 'r2', module: 'reviews', firstEntry: false } },
    { n: 1, at, type: 'coverage-gap', data: { kind: 'unguarded-shell', detail: 'recorded' } }];
  observations.forEach(value => observationSchema.parse(value));
  const report = guardingReport(observations);
  expect(report.guarded).toEqual(['edit']);
  expect(report.unguarded).toEqual(['shell']);
  expect(report.verdicts).toEqual({ allowed: 1, 'blocked-scope': 0, 'blocked-unresolved': 0 });
  expect(report.complete).toBe(false);
  expect(report.excursions).toEqual(['reviews']);
  expect(report.gaps).toEqual([{ kind: 'unguarded-shell', count: 1 }]);
  expect(report.mutations).toEqual({ observed: 1, attributable: 0 });
  expect(report.statement).toBe('Guarded: edit. Not guarded: shell. A count of blocked calls is not evidence that every write respected its scope; what an unguarded tool wrote is seen only in the tree afterwards.');
});
test('verdicts, tool attribution, sorted unique names and repeated gap counts remain descriptive', () => {
  const report = guardingReport([guard('write', 'blocked-scope'), guard('edit', 'allowed'), guard('write', 'blocked-unresolved'),
    activity('c1', 'edit'), mutation('c1', true), mutation(null, false),
    { n: 1, at, type: 'coverage-gap', data: { kind: 'usage-unavailable', detail: 'first' } },
    { n: 1, at, type: 'coverage-gap', data: { kind: 'usage-unavailable', detail: 'second' } }]);
  expect(report).toEqual({ guarded: ['edit', 'write'], unguarded: [], verdicts: { allowed: 1, 'blocked-scope': 1, 'blocked-unresolved': 1 },
    mutations: { observed: 2, attributable: 1 }, excursions: [], gaps: [{ kind: 'usage-unavailable', count: 2 }], complete: true,
    statement: 'Every observed mutation passed the guard (edit, write).' });
});
test('an unattributed snapshot with the shell gap stays incomplete even without a named shell call', () => {
  expect(guardingReport([mutation(null, false), { n: 1, at, type: 'coverage-gap', data: { kind: 'unguarded-shell', detail: 'snapshot only' } }]))
    .toMatchObject({ guarded: [], unguarded: [], complete: false, statement: expect.stringContaining('Not guarded: the shell.') });
  expect(guardingReport([])).toMatchObject({ complete: true, statement: 'Every observed mutation passed the guard (no tool).' });
});
