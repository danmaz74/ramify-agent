import { useEffect, useState } from 'react';
import type { PrepareRestartCommand, RestartInspection, RunSnapshot } from '../../harness/src/interfaces/protocol/runs.js';
import { ClientError, newCommandId, type ProtocolClient } from './client.js';
import { routeHref } from './routes.js';

/** Continue unfinished work after a historical failure; the harness retains its history. */
export function RestartPanel({ client, run, onChanged }: {
  readonly client: ProtocolClient; readonly run: RunSnapshot; readonly onChanged: () => void;
}) {
  const [inspection, setInspection] = useState<RestartInspection | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [generation, setGeneration] = useState(0);
  const [pending, setPending] = useState<PrepareRestartCommand | null>(null);
  const [sending, setSending] = useState(false);
  const [successor, setSuccessor] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  useEffect(() => {
    if (run.state !== 'failed' && run.state !== 'interrupted') return;
    let current = true;
    client.getRestartInspection(run.planId, run.jobId).then(value => {
      if (current) { setInspection(value); setReadError(null); }
    }, (error: unknown) => { if (current) setReadError(error instanceof Error ? error.message : String(error)); });
    return () => { current = false; };
  }, [client, run.planId, run.jobId, run.version, run.state, generation]);
  const send = async (command: PrepareRestartCommand) => {
    setSending(true); setResult(null);
    try {
      const receipt = await client.sendCommand(command);
      setSuccessor(receipt.jobId); setPending(null);
      setResult('Task continuation requested. The run retains its original history.');
    } catch (error) {
      if (error instanceof ClientError && error.kind === 'connection') {
        setPending(command); setResult(`No reply arrived for command ${command.commandId}. Retry the identical command to recover its receipt.`);
      } else {
        setPending(null); setResult(`Task continuation refused: ${error instanceof Error ? error.message : String(error)}`);
      }
    } finally { setSending(false); setGeneration(value => value + 1); onChanged(); }
  };
  if (run.state !== 'failed' && run.state !== 'interrupted') return null;
  return <section className="panel" aria-labelledby="restart-heading">
    <h2 id="restart-heading">Continue unfinished plan</h2>
    <p>Continue the unfinished tasks using current files and accepted results.</p>
    {inspection && <>
      <p>Source <code>{inspection.runId}</code> at version {inspection.cursor}. {inspection.boundary ? `Pending ${inspection.boundary.role ?? inspection.boundary.kind}.` : 'The harness identifies the pending task when execution continues.'}</p>
      <dl>
        <div><dt>Settlement and effects</dt><dd>{inspection.settlement}; {inspection.effects}</dd></div>
        <div><dt>Retained candidate</dt><dd>{inspection.candidate.source?.tree ?? 'unavailable'}</dd></div>
        <div><dt>Current candidate</dt><dd>{inspection.candidate.current?.tree ?? 'unavailable'}</dd></div>
      </dl>
      {inspection.preserved.length > 0 && <ul aria-label="Preserved progress">{inspection.preserved.map((value, index) => <li key={index}>{value}</li>)}</ul>}
      {inspection.inapplicable.length > 0 && <ul aria-label="Evidence requiring reassessment">{inspection.inapplicable.map((value, index) => <li key={index}>{value}</li>)}</ul>}
      {inspection.changes.length > 0 && <ul aria-label="Restart external changes">{inspection.changes.map(change => <li key={change.path}><code>{change.path}</code>: {change.before ?? 'absent'} → {change.after ?? 'absent'}</li>)}</ul>}
      {inspection.limitations.length > 0 && <ul aria-label="Restart observation limitations">{inspection.limitations.map((value, index) => <li key={index}>{value}</li>)}</ul>}
      {inspection.blockers.length > 0 && <ul aria-label="Restart prerequisites">{inspection.blockers.map((value, index) => <li key={index}>{value}</li>)}</ul>}
      <button type="button" disabled={sending || pending !== null || readError !== null || !inspection.canPrepare} onClick={() => void send({
        commandId: newCommandId(), expectedVersion: inspection.cursor, type: 'prepare-restart', payload: { planId: run.planId, jobId: run.jobId },
      })}>Continue plan</button>
    </>}
    {readError && <p className="failure" role="alert">Could not inspect restart: {readError}</p>}
    <button type="button" disabled={sending} onClick={() => setGeneration(value => value + 1)}>Refresh restart inspection</button>
    {result && <p role="status">{result}</p>}
    {(successor ?? inspection?.successor) && <p><a href={routeHref({ page: 'run', planId: run.planId, runId: (successor ?? inspection?.successor)! })}>Open continued run <code>{successor ?? inspection?.successor}</code></a></p>}
    {pending && <button type="button" disabled={sending} onClick={() => void send(pending)}>Retry identical continuation command</button>}
  </section>;
}
