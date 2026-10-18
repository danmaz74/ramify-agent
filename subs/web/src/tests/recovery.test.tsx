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
  evidence: { classification: 'preparation', diagnostic: 'Required executable unavailable' }, group: 1, automaticAttempts: 0,
  attempts: ['inv-0002'], pausedAt: '2026-10-12T12:00:00Z', canResume: true, blockers: [],
  remaining: { invocations: null, activeMs: null }, retained: { candidate: { head: 'retained-head', tree: 'retained-tree' }, partialPaths: ['src/partial.ts'] },
  changes: [{ path: 'src/input.ts', before: 'old', after: 'new' }] });
function fixture() {
  const client = new StubClient();
  client.runs.set(run.jobId, { snapshot: run, events: [], recovery: inspection });
  return client;
}

test('Run page shows the pending task and retained work without a repair form', async () => {
  render(<RunPage client={fixture()} planId={run.planId} runId={run.jobId} interval={100000} />);
  await screen.findByRole('heading', { name: 'Unfinished task' });
  expect(screen.getByText('Required executable unavailable', { exact: false })).toBeTruthy();
  expect(screen.getByText('src/partial.ts')).toBeTruthy();
  expect(screen.getByText('src/input.ts')).toBeTruthy();
  expect(screen.queryByRole('tab', { name: 'Debugger' })).toBeNull();
  expect(screen.queryByLabelText('Repair explanation')).toBeNull();
  expect(screen.queryByText('Occurrence and revision')).toBeNull();
});

test('continuation uses task and command identity without a recovery declaration', async () => {
  const client = fixture();
  render(<RecoveryPanel client={client} run={run} onChanged={() => {}} />);
  await screen.findByRole('heading', { name: 'Unfinished task' });
  fireEvent.click(screen.getByRole('button', { name: 'Continue task' }));
  await screen.findByText(/Task continuation requested/);
  expect(client.commands).toEqual([expect.objectContaining({ type: 'resume-recovery', expectedVersion: 0,
    payload: { planId: run.planId, jobId: run.jobId } })]);
});

test('lost replies retain the identical command even when inspection changes', async () => {
  const client = fixture();
  client.commandRefusals.push(new ClientError('connection', 'Reply lost'));
  render(<RecoveryPanel client={client} run={run} onChanged={() => {}} />);
  await screen.findByRole('heading', { name: 'Unfinished task' });
  fireEvent.click(screen.getByRole('button', { name: 'Continue task' }));
  await screen.findByRole('button', { name: 'Retry identical continuation command' });
  const first = structuredClone(client.commands[0]);
  client.runs.get(run.jobId)!.recovery = { ...inspection, occurrenceId: 'rec-0002', revision: 4,
    evidence: { ...inspection.evidence, diagnostic: 'Current prerequisite' } };
  fireEvent.click(screen.getByRole('button', { name: 'Refresh task inspection' }));
  await screen.findByText(/Current prerequisite/);
  fireEvent.click(screen.getByRole('button', { name: 'Retry identical continuation command' }));
  await screen.findByText(/Task continuation requested/);
  expect(client.commands).toEqual([first, first]);
});

test('a concrete refusal stays visible and unavailable inspection prevents a fresh command', async () => {
  const client = fixture();
  client.commandRefusals.push(new ClientError('protocol', 'Writer settlement unconfirmed', 'conflict'));
  render(<RecoveryPanel client={client} run={run} onChanged={() => {}} />);
  await screen.findByRole('heading', { name: 'Unfinished task' });
  fireEvent.click(screen.getByRole('button', { name: 'Continue task' }));
  await screen.findByText(/Task continuation refused: Writer settlement unconfirmed/);
  client.failure = new ClientError('connection', 'Service unavailable');
  fireEvent.click(screen.getByRole('button', { name: 'Refresh task inspection' }));
  await screen.findByRole('alert');
  expect(screen.getByText('retained-tree')).toBeTruthy();
  await waitFor(() => expect((screen.getByRole('button', { name: 'Continue task' }) as HTMLButtonElement).disabled).toBe(true));
  expect(client.commands).toHaveLength(1);
});

test.each(['settlement', 'stop'] as const)('a real %s hold prevents continuation', async hold => {
  const client = fixture();
  client.runs.get(run.jobId)!.recovery = { ...inspection, canResume: false, blockers: ['Previous writer is not settled'] };
  render(<RecoveryPanel client={client} run={{ ...run, stopRequested: hold === 'stop' }} onChanged={() => {}} />);
  await screen.findByRole('heading', { name: 'Unfinished task' });
  expect((screen.getByRole('button', { name: 'Continue task' }) as HTMLButtonElement).disabled).toBe(true);
  expect(client.commands).toEqual([]);
});
