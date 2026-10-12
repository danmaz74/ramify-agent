import type { RepairIncidentView, RunSnapshot } from '../../harness/src/interfaces/protocol/runs.js';
import { chapterHref, sessionHref } from './routes.js';

const labels: Record<RepairIncidentView['stage'], string> = {
  refused: 'Admission refused', admitted: 'Repair admitted', running: 'Automatic repair in progress',
  blocked: 'Repair blocked', unverified: 'Repair not verified', continued: 'Architect continuation restored', interrupted: 'Repair interrupted',
};

/** Harness-owned obstruction and repair evidence stays visible after handback. */
export function RepairIncidents({ run }: { readonly run: RunSnapshot }) {
  if (run.automaticRepairs.incidents.length === 0) return null;
  return <section className="panel" aria-label="Automatic repair incidents">
    <h2>Automatic repairs</h2>
    {run.automaticRepairs.incidents.map(incident => <article key={incident.incidentId} aria-label={`Repair incident ${incident.incidentId}`}>
      <h3>{incident.incidentId}: {labels[incident.stage]}</h3>
      <p><strong>Harness obstruction:</strong> {incident.harnessError.name}: {incident.harnessError.message}</p>
      <p>Preparation <code>{incident.preparation.id}</code>: {incident.operation} for <code>{incident.workItem}</code>.</p>
      <p>{incident.admission.reason}</p>
      {incident.session !== null && <p><a href={incident.invocation === null
        ? sessionHref({ source: 'run', planId: run.planId, runId: run.jobId, session: incident.session })
        : chapterHref({ source: 'run', planId: run.planId, runId: run.jobId, session: incident.session }, incident.invocation)}>
        {incident.stage === 'running' ? 'Live repair transcript' : 'Repair transcript'} ({incident.session})</a></p>}
      {incident.result !== null && <>
        <p><strong>Agent result: {incident.result.outcome}.</strong> {incident.result.summary}</p>
        <EvidenceList label="Repair checks" values={incident.result.checks} />
        <EvidenceList label="Remaining work" values={incident.result.remainingWork} />
        {incident.result.suspectedCause !== null && <p>Suspected cause: {incident.result.suspectedCause}</p>}
      </>}
      {incident.verification !== null && <p><strong>{incident.verification.verified ? 'Preparation verified' : 'Preparation not verified'}:</strong> {incident.verification.reason}</p>}
      {incident.continuation !== null && <p>Architect continuation {incident.continuation.delivered ? 'delivered' : 'not delivered'}: {incident.continuation.reason}</p>}
      <p>Beads export: {incident.export.state}{incident.export.issueId === null ? '' : `; task ${incident.export.issueId}`}{incident.export.reason === null ? '' : ` (${incident.export.reason})`}.</p>
      {incident.elapsedMs !== null && <p>Repair time: {incident.elapsedMs} ms.</p>}
      {incident.usage !== null && <p>Repair usage: {incident.usage.inputTokens ?? 'unknown'} input tokens, {incident.usage.outputTokens ?? 'unknown'} output tokens, {incident.usage.totalTokens ?? 'unknown'} total tokens; cost {incident.usage.cost ?? 'unknown'}.</p>}
      <details><summary>Incident evidence</summary>
        <dl className="facts">
          <div><dt>Original engineer result</dt><dd>{incident.originalResult ?? 'none recorded'}</dd></div>
          <div><dt>Original invocation</dt><dd>{incident.originalInvocation ?? 'none recorded'}</dd></div>
          <div><dt>Original assignment</dt><dd>{incident.originalAssignment ?? 'none recorded'}</dd></div>
          <div><dt>Repair authority</dt><dd>{incident.authority.assignment ?? 'unavailable'}</dd></div>
          <div><dt>Before repair</dt><dd>HEAD {incident.candidateBefore.head ?? 'unknown'}, tree {incident.candidateBefore.tree ?? 'unknown'}</dd></div>
          <div><dt>After repair</dt><dd>{incident.candidateAfter === null ? 'not captured' : `HEAD ${incident.candidateAfter.head ?? 'unknown'}, tree ${incident.candidateAfter.tree ?? 'unknown'}`}</dd></div>
          <div><dt>Preparation record</dt><dd><code>{incident.preparation.path}</code></dd></div>
        </dl>
        <EvidenceList label="Candidate before repair" values={[...new Set([...incident.candidateBefore.changedPaths, ...incident.candidateBefore.staged, ...incident.candidateBefore.unstaged, ...incident.candidateBefore.untracked])]} />
        {incident.candidateAfter !== null && <EvidenceList label="Candidate after repair" values={[...new Set([...incident.candidateAfter.changedPaths, ...incident.candidateAfter.staged, ...incident.candidateAfter.unstaged, ...incident.candidateAfter.untracked])]} />}
        <EvidenceList label="Authority evidence" values={incident.authority.scopeEvidence} />
        <EvidenceList label="Harness diagnostics" values={incident.harnessError.evidence} />
        <EvidenceList label="Candidate evidence" values={[...incident.candidateBefore.evidence, ...(incident.candidateAfter?.evidence ?? [])]} />
        <EvidenceList label="Repair result evidence" values={incident.result?.evidence ?? []} />
        <EvidenceList label="Verification evidence" values={incident.verification?.evidence ?? []} />
        <EvidenceList label="Continuation evidence" values={incident.continuation?.evidence ?? []} />
        <EvidenceList label="Versions" values={Object.entries(incident.versions).map(([name, version]) => `${name}: ${version}`)} />
        {incident.harnessError.stack !== null && <pre>{incident.harnessError.stack}</pre>}
      </details>
    </article>)}
  </section>;
}

function EvidenceList({ label, values }: { readonly label: string; readonly values: readonly string[] }) {
  return values.length === 0 ? null : <div><h4>{label}</h4><ul aria-label={label}>{values.map((value, index) => <li key={index}>{value}</li>)}</ul></div>;
}
