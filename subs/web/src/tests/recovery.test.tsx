import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { recoveryInspectionSchema } from '../../../harness/src/interfaces/protocol/runs.js';
import { ClientError } from '../client.js';
import { RecoveryPanel } from '../recovery.js';
import { RunPage } from '../run-page.js';
import { debugSnapshot } from './helpers/debugger.js';
import { StubClient } from './helpers/stub-client.js';

afterEach(cleanup);
const run = debugSnapshot({ breakpoint: null, recovery: { occurrenceId: 'rec-0001', revision: 2, state: 'paused' } });
const inspection = recoveryInspectionSchema.parse({ planId: run.planId, runId: run.jobId, cursor: run.version,
  occurrenceId: 'rec-0001', revision: 2, state: 'paused', boundary: { kind: 'preparation', role: 'local-architect' },
  evidence: { classification: 'preparation', diagnostic: 'Retained input unavailable' }, group: 1, automaticAttempts: 0,
  attempts: ['inv-0002'], pausedAt: '2026-10-12T12:00:00Z', canResume: false, blockers: ['Unexplained target changes require a declaration'],
  remaining: { invocations: 50, activeMs: 120000 }, retained: { candidate: { head: 'retained-head', tree: 'retained-tree' }, partialPaths: ['src/partial.ts'] },
  totalInvocations: 4, timing: { activeMs: 35000, pausedMs: 45000, currentPauseMs: 45000 },
  repairRequired: true, changes: [{ path: 'src/input.ts', before: 'old', after: 'new' }], runtime: { before: 'runtime-old', current: 'runtime-new', compatible: true } });
function fixture() {
  const client = new StubClient();
  client.runs.set(run.jobId, { snapshot: run, events: [], recovery: inspection });
  return client;
}
const declare = () => {
  fireEvent.click(screen.getByRole('checkbox', { name: 'target' }));
  fireEvent.change(screen.getByLabelText('Repair explanation'), { target: { value: 'Restored the retained source input' } });
  fireEvent.change(screen.getByLabelText('Repair evidence'), { target: { value: 'repair-inspection\nverified-source' } });
};

test('Run page exposes recovery pause without a breakpoint and retains attempts and candidate bounds', async () => {
  const client = fixture();
  render(<RunPage client={client} planId={run.planId} runId={run.jobId} interval={100000} />);
  await screen.findByRole('heading', { name: 'Recovery paused' });
  expect(screen.getByText('Retained input unavailable', { exact: false })).toBeTruthy();
  expect(screen.getByText('50 invocations; 120000 ms active execution')).toBeTruthy();
  expect(screen.getByText('35000 ms active; 45000 ms operator waiting; 45000 ms at this recovery')).toBeTruthy();
  expect(screen.getByText('src/partial.ts')).toBeTruthy();
  expect(screen.getByText('src/input.ts')).toBeTruthy();
  expect(screen.queryByRole('tab', { name: 'Debugger' })).toBeNull();
  expect(screen.getAllByText('paused for recovery').length).toBeGreaterThan(0);
  expect((screen.getByRole('button', { name: 'Resume recovery' }) as HTMLButtonElement).disabled).toBe(true);
});

test('repair declaration permits admission despite unexplained drift and supplies occurrence revision', async () => {
  const client = fixture();
  render(<RecoveryPanel client={client} run={run} onChanged={() => {}} />);
  await screen.findByRole('heading', { name: 'Recovery paused' });
  declare();
  fireEvent.click(screen.getByRole('button', { name: 'Resume recovery' }));
  await screen.findByText(/Recovery resume admitted/);
  expect(client.commands).toEqual([expect.objectContaining({ type: 'resume-recovery', expectedVersion: 0, payload: {
    planId: run.planId, jobId: run.jobId, occurrenceId: 'rec-0001', expectedRevision: 2,
    repair: { areas: ['target'], explanation: 'Restored the retained source input', evidence: ['repair-inspection', 'verified-source'] },
  } })]);
});

test('lost reply freezes command and declaration for identical retry after a later inspection', async () => {
  const client = fixture();
  client.commandRefusals.push(new ClientError('connection', 'Reply lost'));
  render(<RecoveryPanel client={client} run={run} onChanged={() => {}} />);
  await screen.findByRole('heading', { name: 'Recovery paused' });
  declare();
  fireEvent.click(screen.getByRole('button', { name: 'Resume recovery' }));
  await screen.findByRole('button', { name: 'Retry identical recovery command' });
  const first = structuredClone(client.commands[0]);
  client.runs.get(run.jobId)!.recovery = { ...inspection, occurrenceId: 'rec-0002', revision: 4 };
  fireEvent.click(screen.getByRole('button', { name: 'Refresh recovery inspection' }));
  await screen.findByText('rec-0002');
  fireEvent.click(screen.getByRole('button', { name: 'Retry identical recovery command' }));
  await screen.findByText(/Recovery resume admitted/);
  expect(client.commands).toEqual([first, first]);
});

test('hard admission refusal is visible and stale inspection disables fresh commands', async () => {
  const client = fixture();
  client.commandRefusals.push(new ClientError('protocol', 'Writer settlement unconfirmed', 'conflict'));
  render(<RecoveryPanel client={client} run={run} onChanged={() => {}} />);
  await screen.findByRole('heading', { name: 'Recovery paused' });
  declare();
  fireEvent.click(screen.getByRole('button', { name: 'Resume recovery' }));
  await screen.findByText(/Recovery resume refused: Writer settlement unconfirmed/);
  client.failure = new ClientError('connection', 'Service unavailable');
  fireEvent.click(screen.getByRole('button', { name: 'Refresh recovery inspection' }));
  await screen.findByRole('alert');
  expect(screen.getByText('retained-tree')).toBeTruthy();
  await waitFor(() => expect((screen.getByRole('button', { name: 'Resume recovery' }) as HTMLButtonElement).disabled).toBe(true));
  expect(client.commands).toHaveLength(1);
});

test('resource recovery exposes pending obligations, unknown effects and lineage without a terminal replacement allowance', async () => {
  const client = fixture();
  client.runs.get(run.jobId)!.recovery = recoveryInspectionSchema.parse({ ...inspection, remaining: { invocations: null, activeMs: null },
    continuity: { policy: 'run-policy/8', resource: 'context', predecessor: 'inv-original', successor: null, settlement: 'unknown', effects: 'unknown' },
    blockers: ['Settlement: original command effects are unknown'], retained: { ...inspection.retained, task: {
      candidate: inspection.retained.candidate, acceptedHead: 'accepted-head', configuration: 'configuration-id', work: { iteration: 'iteration-original' },
      obligations: [{ kind: 'finding', id: 'cf-0003', revision: 2 }, { kind: 'gate', id: 'final' }],
      sourceRecords: ['invocations/inv-original/invocation.json'], authority: { assignment: 'original' }, progressIdentity: 'retained-progress' } } });
  render(<RecoveryPanel client={client} run={run} onChanged={() => {}} />);
  await screen.findByRole('heading', { name: 'Recovery paused' });
  expect(screen.getByText(/resource recovery has no terminal invocation or elapsed allowance/)).toBeTruthy();
  expect(screen.getByText('Settlement unknown; effects unknown')).toBeTruthy();
  expect(screen.getByText('Predecessor inv-original; successor awaiting admission')).toBeTruthy();
  expect(screen.getByRole('list', { name: 'Pending obligations' }).textContent).toContain('cf-0003, revision 2');
  expect(screen.getByRole('list', { name: 'Retained task evidence' }).textContent).toContain('inv-original/invocation.json');
  expect(screen.queryByText('Historical remaining bounds')).toBeNull();
  expect((screen.getByRole('button', { name: 'Resume recovery' }) as HTMLButtonElement).disabled).toBe(true);
});
