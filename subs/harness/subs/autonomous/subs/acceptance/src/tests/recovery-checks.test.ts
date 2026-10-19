import { gateFixturePorts, type GateFixture, type FixtureGateHost } from './helpers/gate-ports.js';
import { describe, expect, test, vi } from 'vitest';
import { join } from 'node:path';
import { CommittingGates } from '../committing-gate.js';
import { checkExecutionObstruction } from '../check-execution-recovery.js';
import type { GateAttempt } from '../checks/records.js';
import type { RunLog } from '../../../../src/run/log.js';
import { defaultRunPolicy } from '../../../../../../src/run/policy.js';
import { gateAttemptSchema } from '../gate-records.js';
import { runLayout } from '../../../../src/run/records.js';

function attempt(checkpoint: GateAttempt['checkpoint'], id: string, infrastructureAttempt = 0, verdict: GateAttempt['verdict'] = 'not-verified'): GateAttempt {
  return { schema: 'ramify-agent.gate-attempt/3', id, checkpoint, subject: {}, proposedBy: 'accepted-producer', repairRound: 0, infrastructureAttempt,
    head: 'retained-head', commit: null, audited: null, evidence: null, guardedChanges: [], commands: [], verdict,
    cause: verdict === 'passed' ? null : 'infrastructure', next: verdict === 'passed' ? 'accept' : 'exhausted',
    provider: { result: { status: 'failed', error: { code: 'timeout', message: 'Service unavailable', retryable: true } }, checks: {} } };
}
describe('structured check execution obstructions', () => {
  test('generic not-verified and actual setup assertions do not authorize infrastructure pause', () => {
    const gate = attempt('iteration', 'ga-0001');
    expect(checkExecutionObstruction({ ...gate, provider: { result: {}, checks: {} } })).toBeNull();
    expect(checkExecutionObstruction({ ...gate, provider: { result: { status: 'failed', error: { code: 'setup-command-failed', retryable: true } }, checks: {} } })).toBeNull();
    expect(checkExecutionObstruction({ ...gate, verdict: 'failed' })).toBeNull();
  });
  test('permanent missing command waits for explicit correction without automatic retry', () => {
    const gate = attempt('final', 'ga-0001');
    Object.assign(gate, { provider: { result: { status: 'failed', error: { code: 'ENOENT', message: 'Executable missing', retryable: false } }, checks: {} } });
    expect(checkExecutionObstruction(gate)).toEqual({ diagnostic: 'Audit ENOENT: Executable missing', automatic: false });
  });
  test('an unrun trailing command cannot turn a prior failing assertion into recovery', () => {
    const gate = attempt('iteration', 'ga-0001');
    Object.assign(gate, { provider: { result: { status: 'completed', summary: { checks: { assertion: { exitCode: 1 }, later: { runnerError: { kind: 'timeout' } } } } }, checks: {} } });
    expect(checkExecutionObstruction(gate)).toBeNull();
    Object.assign(gate, { provider: { result: { status: 'completed', summary: { checks: { assertion: { passed: false, counts: { tests: { failed: 1 } } }, later: { runnerError: { kind: 'timeout' } } } } }, checks: {} } });
    expect(checkExecutionObstruction(gate)).toBeNull();
  });
  test('a nested producer timeout remains recoverable until qualifying evidence, while nested assertions retain their verdict', () => {
    const gate = attempt('final', 'ga-0001');
    const checks = { waiting: { status: 'fail', commands: { wait: { runnerError: { kind: 'timeout', message: 'Producer stopped the quiet command' } } } } };
    const result = { status: 'completed', summary: { checks: {} }, projects: [{ result: { status: 'completed', summary: { checks } } }] };
    Object.assign(gate, { provider: { result, checks: {} } });
    expect(checkExecutionObstruction(gate)).toEqual({ diagnostic: 'Audit runner timeout: Producer stopped the quiet command', automatic: true });
    Object.assign(checks, { assertion: { commands: { test: { exitCode: 1 } } } });
    expect(checkExecutionObstruction(gate)).toBeNull();
  });
});

describe('pending gate continuation', () => {
  test.each(['iteration', 'contract', 'breaking-iteration', 'work-item', 'final'] as const)('%s retains its accepted producer across a bounded group and explicit retry', async checkpoint => {
    type Entry = ReturnType<RunLog['ledger']['replay']>[number];
    const entries: Entry[] = [], requested: Array<{ id: string; infrastructureAttempt: number; proposedBy: string | null }> = [];
    const log = { ledger: { replay: () => entries }, all: (type: string) => entries.map(entry => entry.transaction.event).filter(event => event.type === type),
      count: (type: string) => entries.filter(entry => entry.transaction.event.type === type).length } as unknown as RunLog;
    const policy = defaultRunPolicy({ projectRoot: '/scripted-project' });
    const run = { jobId: 'run', planId: 'plan', base: 'base', policy, log, path: (path: string) => join('/run', path) } as unknown as GateFixture;
    const resumes: number[] = [], delays: number[] = [];
    const host = { git: { currentHead: async () => 'retained-head' }, projectRoot: '/scripted-project', ignoring: () => false,
      retryGateDelay: async (_run: GateFixture, delay: number) => { delays.push(delay); return true; },
      recoverGate: async (_run: GateFixture, gate: GateAttempt, _diagnostic: string, group: number, attempts: readonly string[]) => {
        expect(gate.infrastructureAttempt).toBe(2); expect(attempts).toEqual(['ga-0001', 'ga-0002', 'ga-0003']); resumes.push(group); return true;
      } } as unknown as FixtureGateHost;
    const gates = new CommittingGates(gateFixturePorts(run, host));
    const seam = gates as unknown as { committingCheckpointAttempt: (request: { id: string; infrastructureAttempt?: number; proposedBy?: string | null }) => Promise<GateAttempt> };
    vi.spyOn(seam, 'committingCheckpointAttempt').mockImplementation(async (request) => {
      requested.push({ id: request.id, infrastructureAttempt: request.infrastructureAttempt ?? 0, proposedBy: request.proposedBy ?? null });
      const gate = attempt(checkpoint, request.id, request.infrastructureAttempt ?? 0, requested.length === 4 ? 'passed' : 'not-verified');
      const sequence = entries.length + 1;
      entries.push({ sequence, at: '2026-10-12T00:00:00.000Z', transaction: { event: { sequence, jobId: 'run', at: '2026-10-12T00:00:00.000Z', type: 'gate-attempted', data: { gate: gate.id, checkpoint, verdict: gate.verdict, next: gate.next } },
        records: [{ path: runLayout.gate(gate.id), id: gate.id, revision: 1, body: gateAttemptSchema.parse(gate) }] } } as Entry);
      return gate;
    });
    const result = await gates.committingCheckpoint({ id: 'ga-0001', runId: 'run', checkpoint, projectRoot: '/scripted-project', directory: '/run/gates/ga-0001',
      head: 'retained-head', policy, proposedBy: 'accepted-producer' });
    expect(result.verdict).toBe('passed'); expect(resumes).toEqual([0]); expect(delays).toEqual([1000, 2000]);
    expect(requested.map(request => request.infrastructureAttempt)).toEqual([0, 1, 2, 3]);
    expect(requested.every(request => request.proposedBy === 'accepted-producer')).toBe(true);
    expect(entries).toHaveLength(4);
  });
});
