import { useEffect, useState } from 'react';
import { externalRepairDeclarationSchema, type ExternalRepairDeclaration, type RecoveryInspection, type RecoveryResumeCommand, type RunSnapshot } from '../../harness/src/interfaces/protocol/runs.js';
import { ClientError, newCommandId, type ProtocolClient } from './client.js';

/** Recovery is a separate interaction from review stops and breakpoint exchanges. */
export function RecoveryPanel({ client, run, onChanged }: {
  readonly client: ProtocolClient; readonly run: RunSnapshot; readonly onChanged: () => void;
}) {
  const [inspection, setInspection] = useState<RecoveryInspection | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [generation, setGeneration] = useState(0);
  const [explanation, setExplanation] = useState('');
  const [areas, setAreas] = useState<ExternalRepairDeclaration['areas']>([]);
  const [evidence, setEvidence] = useState('');
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
  const declaration = areas.length === 0 && explanation.trim() === '' && evidence.trim() === '' ? null : externalRepairDeclarationSchema.safeParse({
    areas, explanation, ...(evidence.trim() === '' ? {} : { evidence: evidence.split('\n').map(line => line.trim()).filter(Boolean) }),
  });
  const repair = declaration?.success ? declaration.data : undefined;
  const canSubmit = !sending && readError === null && run.state === 'running' && !run.stopRequested && inspection?.state === 'paused'
    && (inspection.canResume || repair !== undefined) && (declaration === null || declaration.success);
  const send = async (command: RecoveryResumeCommand) => {
    setSending(true); setResult(null);
    try {
      const receipt = await client.sendCommand(command);
      setResult(`Recovery resume admitted: command ${receipt.commandId}. The next attempt will determine whether the obstruction is resolved.`);
      setPending(null); setExplanation(''); setAreas([]); setEvidence('');
    } catch (error) {
      if (error instanceof ClientError && error.kind === 'connection') {
        setPending(command); setResult(`No reply arrived for command ${command.commandId}. Retry this same command to recover its receipt.`);
      } else {
        setPending(null); setResult(`Recovery resume refused: ${error instanceof Error ? error.message : String(error)}`);
      }
    } finally { setSending(false); setGeneration(value => value + 1); onChanged(); }
  };
  if (inspection === null && result === null) return readError === null ? null : <p className="failure" role="alert">Could not inspect recovery: {readError}</p>;
  return <section className="panel" aria-labelledby="recovery-heading">
    <h2 id="recovery-heading">Recovery {inspection ? inspection.state === 'paused' ? 'paused' : 'settling' : ''}</h2>
    {inspection && <>
      <p>The retained {inspection.boundary.kind} operation{inspection.boundary.role ? ` (${inspection.boundary.role})` : ''} awaits recovery. {inspection.evidence.diagnostic}</p>
      <dl>
        <div><dt>Occurrence and revision</dt><dd><code>{inspection.occurrenceId}</code>, {inspection.revision}</dd></div>
        <div><dt>Classification</dt><dd>{inspection.evidence.classification}</dd></div>
        {inspection.boundary.checkpoint && <div><dt>Checkpoint</dt><dd>{inspection.boundary.checkpoint}</dd></div>}
        <div><dt>Attempts</dt><dd>Group {inspection.group}; {inspection.automaticAttempts} automatic attempts; retained: {inspection.attempts.join(', ') || 'none'}</dd></div>
        <div><dt>Remaining bounds</dt><dd>{inspection.remaining.invocations} invocations; {inspection.remaining.activeMs} ms active execution</dd></div>
        {inspection.totalInvocations !== undefined && <div><dt>Total invocations</dt><dd>{inspection.totalInvocations}</dd></div>}
        {inspection.timing && <div><dt>Elapsed time</dt><dd>{inspection.timing.activeMs} ms active; {inspection.timing.pausedMs} ms operator waiting; {inspection.timing.currentPauseMs} ms at this recovery</dd></div>}
        <div><dt>Retained candidate</dt><dd>Tree <code>{inspection.retained.candidate.tree}</code>; head <code>{inspection.retained.candidate.head}</code></dd></div>
        <div><dt>Partial paths</dt><dd>{inspection.retained.partialPaths.join(', ') || 'none observed'}</dd></div>
      </dl>
      {inspection.changes && inspection.changes.length > 0 && <ul aria-label="External changes">{inspection.changes.map(change => <li key={change.path}><code>{change.path}</code>: {change.before ?? 'absent'} → {change.after ?? 'absent'}</li>)}</ul>}
      {inspection.runtime && <p>Runtime: {inspection.runtime.before} → {inspection.runtime.current}; {inspection.runtime.compatible ? 'compatible' : 'incompatible'}.</p>}
      {inspection.configuration && <p>Configuration: {inspection.configuration.before} → {inspection.configuration.current}; {inspection.configuration.compatible ? 'compatible' : 'incompatible'}.</p>}
      {inspection.blockers.length > 0 && <ul aria-label="Recovery prerequisites">{inspection.blockers.map((blocker, index) => <li key={index}>{blocker}</li>)}</ul>}
      <button type="button" disabled={sending} onClick={() => setGeneration(value => value + 1)}>Refresh recovery inspection</button>
      <form aria-label="Resume recovery" onSubmit={event => {
        event.preventDefault();
        if (!canSubmit || pending !== null) return;
        void send({ commandId: newCommandId(), expectedVersion: 0, type: 'resume-recovery', payload: {
          planId: run.planId, jobId: run.jobId, occurrenceId: inspection.occurrenceId, expectedRevision: inspection.revision,
          ...(repair === undefined ? {} : { repair }),
        } });
      }}>
        <fieldset disabled={sending || pending !== null}>
          <legend>External repair declaration (when a repair was performed)</legend>
          {(['target', 'configuration', 'environment', 'runtime'] as const).map(area => <label key={area}>
            <input type="checkbox" checked={areas.includes(area)} onChange={event => setAreas(previous => event.target.checked ? [...previous, area] : previous.filter(value => value !== area))} />{area}
          </label>)}
          <label>Repair explanation<textarea aria-label="Repair explanation" maxLength={8192} value={explanation} onChange={event => setExplanation(event.target.value)} /></label>
          <label>Evidence references, one per line<textarea aria-label="Repair evidence" value={evidence} onChange={event => setEvidence(event.target.value)} /></label>
        </fieldset>
        <p className="muted">Declare changes made while execution was quiescent. Exclude credentials. The harness verifies admission prerequisites and preserves spent bounds.</p>
        <button type="submit" disabled={!canSubmit || pending !== null}>Resume recovery</button>
      </form>
    </>}
    {readError && <p className="failure" role="alert">Inspection is stale: {readError}</p>}
    {result && <p role="status">{result}</p>}
    {pending && <button type="button" disabled={sending} onClick={() => void send(pending)}>Retry identical recovery command</button>}
  </section>;
}
