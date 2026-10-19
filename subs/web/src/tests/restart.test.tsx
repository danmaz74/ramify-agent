import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';
import { restartInspectionSchema } from '../../../harness/src/interfaces/protocol/runs.js';
import { ClientError } from '../client.js';
import { RestartPanel } from '../restart.js';
import { debugSnapshot } from './helpers/debugger.js';
import { StubClient } from './helpers/stub-client.js';

afterEach(cleanup);
const run = debugSnapshot({ state: 'failed', breakpoint: null });
const inspection = restartInspectionSchema.parse({ planId: run.planId, runId: run.jobId, cursor: run.version, sourceDigest: 'digest', generation: 0,
  canPrepare: true, blockers: [], limitations: [], successor: null, boundary: { kind: 'invocation', role: 'local-architect', invocation: 'inv-3' },
  preserved: ['accepted analysis', 'wi-1'], inapplicable: ['candidate audit'], candidate: { source: { head: 'head', tree: 'tree' }, current: { head: 'fixed-head', tree: 'fixed-tree' } },
  policy: { before: 'run-policy/8', current: 'run-policy/8' }, settlement: 'confirmed', effects: 'reconciled', changes: [] });
function fixture() {
  const client = new StubClient();
  client.runs.set(run.jobId, { snapshot: run, events: [], restart: inspection });
  return client;
}

test('continuation retains evidence and sends one command for the unfinished run', async () => {
  const client = fixture();
  render(<RestartPanel client={client} run={run} onChanged={() => {}} />);
  await screen.findByText('accepted analysis');
  expect(screen.getByText('candidate audit')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Continue plan' }));
  await screen.findByText(/Task continuation requested/);
  expect(client.commands).toEqual([expect.objectContaining({ type: 'prepare-restart', expectedVersion: run.version, payload: { planId: run.planId, jobId: run.jobId } })]);
  expect(screen.getByRole('link', { name: /Open continued run/ }).getAttribute('href')).toContain('/runs/');
});

test('lost preparation reply retains identical identity despite a later inspection', async () => {
  const client = fixture();
  client.commandRefusals.push(new ClientError('connection', 'Reply lost'));
  render(<RestartPanel client={client} run={run} onChanged={() => {}} />);
  await screen.findByText('accepted analysis');
  fireEvent.click(screen.getByRole('button', { name: 'Continue plan' }));
  await screen.findByRole('button', { name: 'Retry identical continuation command' });
  const first = structuredClone(client.commands[0]);
  client.runs.get(run.jobId)!.restart = { ...inspection, cursor: run.version + 1, canPrepare: false };
  fireEvent.click(screen.getByRole('button', { name: 'Refresh restart inspection' }));
  await waitFor(() => expect((screen.getByRole('button', { name: 'Continue plan' }) as HTMLButtonElement).disabled).toBe(true));
  fireEvent.click(screen.getByRole('button', { name: 'Retry identical continuation command' }));
  await screen.findByText(/Task continuation requested/);
  expect(client.commands).toEqual([first, first]);
});

test('eligibility blockers disable preparation and running runs use ordinary recovery', async () => {
  const client = fixture();
  client.runs.get(run.jobId)!.restart = { ...inspection, canPrepare: false, blockers: ['Unknown external effect'] };
  const { rerender } = render(<RestartPanel client={client} run={run} onChanged={() => {}} />);
  await screen.findByText('Unknown external effect');
  expect((screen.getByRole('button', { name: 'Continue plan' }) as HTMLButtonElement).disabled).toBe(true);
  expect(client.commands).toEqual([]);
  rerender(<RestartPanel client={client} run={{ ...run, state: 'running' }} onChanged={() => {}} />);
  expect(screen.queryByRole('heading', { name: 'Continue unfinished plan' })).toBeNull();
});
