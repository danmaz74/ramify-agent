import { useEffect, useState } from 'react';
import { type RecoveryInspection, type RecoveryResumeCommand, type RunSnapshot } from '../../harness/src/interfaces/protocol/runs.js';
import { routeHref } from './routes.js';
import { ClientError, newCommandId, type ProtocolClient } from './client.js';

/** Pending task inspection and continuation; deliberate holds retain their own controls. */
export function RecoveryPanel({ client, run, onChanged }: {
  readonly client: ProtocolClient; readonly run: RunSnapshot; readonly onChanged: () => void;
}) {
  const [inspection, setInspection] = useState<RecoveryInspection | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [generation, setGeneration] = useState(0);
  const [pending, setPending] = useState<RecoveryResumeCommand | null>(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  useEffect(() => {
    let current = true;
    client.getRecoveryInspection(run.planId, run.jobId).then(value => {
      if (!current) return;
      setInspection(value); setReadError(null);
    }, (error: unknown) => { if (current) setReadError(error instanceof Error ? error.message : String(error)); });
    return () => { current = false; };
  }, [client, run.planId, run.jobId, run.version, generation]);
  const canSubmit = !sending && readError === null && run.state === 'running' && !run.stopRequested
    && inspection?.state === 'paused' && inspection.canResume;
  const send = async (command: RecoveryResumeCommand) => {
    setSending(true); setResult(null);
    try {
      const receipt = await client.sendCommand(command);
      setResult(`Task continuation requested: command ${receipt.commandId}.`);
      setPending(null);
    } catch (error) {
      if (error instanceof ClientError && error.kind === 'connection') {
        setPending(command); setResult(`No reply arrived for command ${command.commandId}. Retry this same command to recover its receipt.`);
      } else {
        setPending(null); setResult(`Task continuation refused: ${error instanceof Error ? error.message : String(error)}`);
      }
    } finally { setSending(false); setGeneration(value => value + 1); onChanged(); }
  };
  if (inspection === null && result === null) return readError === null ? null : <p className="failure" role="alert">Could not inspect recovery: {readError}</p>;
  return <section className="panel" aria-labelledby="recovery-heading">
    <h2 id="recovery-heading">{inspection?.state === 'pausing' ? 'Waiting for execution to settle' : 'Unfinished task'}</h2>
    {inspection && <>
      <p>The retained {inspection.boundary.kind} operation{inspection.boundary.role ? ` (${inspection.boundary.role})` : ''} is unfinished. {inspection.evidence.diagnostic}</p>
      <dl>
        {inspection.boundary.checkpoint && <div><dt>Checkpoint</dt><dd>{inspection.boundary.checkpoint}</dd></div>}
        {inspection.continuity && <div><dt>Execution settlement</dt><dd>{inspection.continuity.settlement}</dd></div>}
        <div><dt>Retained candidate</dt><dd>Tree <code>{inspection.retained.candidate.tree}</code>; head <code>{inspection.retained.candidate.head}</code></dd></div>
        <div><dt>Partial paths</dt><dd>{inspection.retained.partialPaths.join(', ') || 'none observed'}</dd></div>
      </dl>
      {inspection.changes && inspection.changes.length > 0 && <ul aria-label="External changes">{inspection.changes.map(change => <li key={change.path}><code>{change.path}</code>: {change.before ?? 'absent'} → {change.after ?? 'absent'}</li>)}</ul>}
      {inspection.blockers.length > 0 && <ul aria-label="Recovery prerequisites">{inspection.blockers.map((blocker, index) => <li key={index}>{blocker}</li>)}</ul>}
      <button type="button" disabled={sending} onClick={() => setGeneration(value => value + 1)}>Refresh task inspection</button>
      <form aria-label="Continue task" onSubmit={event => {
        event.preventDefault();
        if (!canSubmit || pending !== null) return;
        void send({ commandId: newCommandId(), expectedVersion: 0, type: 'resume-recovery', payload: {
          planId: run.planId, jobId: run.jobId,
        } });
      }}>
        <button type="submit" disabled={!canSubmit || pending !== null}>Continue task</button>
      </form>
    </>}
    {readError && <p className="failure" role="alert">Inspection is stale: {readError}</p>}
    {result && <p role="status">{result}</p>}
    {pending && <button type="button" disabled={sending} onClick={() => void send(pending)}>Retry identical continuation command</button>}
  </section>;
}
