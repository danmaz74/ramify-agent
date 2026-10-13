import type { InvocationEvaluation } from '../../harness/src/interfaces/protocol/runs.js';

type ScopeEvidence = NonNullable<InvocationEvaluation['outsideScopeEvidence']>[number];

/** Render only the harness's attribution evidence; older responses leave attribution unknown. */
export function OutsideScopePath({ path, invocation, evidence }: { readonly path: string; readonly invocation: string; readonly evidence?: Omit<ScopeEvidence, 'path'> | undefined }) {
  const attribution = evidence?.attributable === true
    ? `recorded write attributable to ${invocation}`
    : evidence?.attributable === false
      ? `observed during ${invocation}; not attributable to this invocation`
      : `observed during ${invocation}; attribution unknown`;
  const origins = evidence?.observations.map(observation => `${observation.observedBy} observation ${observation.number}${observation.callId === null ? '' : `, call ${observation.callId}`}`).join('; ');
  return <><code>{path}</code>: {attribution}{origins ? ` (${origins})` : ''}{evidence?.uncertainty ? `. ${evidence.uncertainty}` : ''}</>;
}

/*
 * One invocation's evaluation, as its chapter of the transcript shows it:
 * guarding, hook checks, reads outside the scope, lines and tokens.
 * Unavailable is said, never shown as zero.
 */

function guardingText(evaluation: InvocationEvaluation): string {
  return evaluation.guarding.complete ? 'complete' : 'partial';
}

function hookChecksText(evaluation: InvocationEvaluation): string {
  const { passed, findings, notChecked } = evaluation.hookChecks;
  return `${passed} passed, ${findings} with findings, ${notChecked} not checked`;
}

function excursionsText(evaluation: InvocationEvaluation): string {
  return evaluation.excursions.join(', ') || '—';
}

function linesText(evaluation: InvocationEvaluation): string {
  return evaluation.lines === null ? '—' : `+${evaluation.lines.added} −${evaluation.lines.deleted} (${evaluation.lines.coverage})`;
}

function usageText(evaluation: InvocationEvaluation): string {
  const usage = evaluation.usage;
  return 'unavailable' in usage
    ? `unavailable: ${usage.unavailable}`
    : `in ${usage.input} · cache read ${usage.cacheRead} · cache write ${usage.cacheWrite} · out ${usage.output}`;
}

/** An invocation's evaluation as facts, for a chapter of its session's transcript. */
export function EvaluationFacts({ evaluation }: { readonly evaluation: InvocationEvaluation | null }) {
  if (evaluation === null) return <p className="muted">No evaluation: the invocation's record cannot be read.</p>;
  return (
    <dl className="facts evaluation" aria-label={`Evaluation of ${evaluation.invocation}`}>
      <div>
        <dt>Guarding</dt>
        <dd>
          {guardingText(evaluation)}
          {(evaluation.unknownPlacement?.length ?? 0) > 0 && <ul className="warn" aria-label="Candidate differences with unknown placement">{evaluation.unknownPlacement!.map(path => <li key={path}><OutsideScopePath path={path} invocation={evaluation.invocation} evidence={evaluation.unknownPlacementEvidence?.find(entry => entry.path === path)} />; current placement unknown</li>)}</ul>}
          {evaluation.placementFailure && <p>{evaluation.placementFailure}</p>}
          {evaluation.outsideScope.length > 0 && <ul className="warn" aria-label="Candidate differences outside the write scope">{evaluation.outsideScope.map(path => <li key={path}><OutsideScopePath path={path} invocation={evaluation.invocation} evidence={evaluation.outsideScopeEvidence?.find(entry => entry.path === path)} /></li>)}</ul>}
        </dd>
      </div>
      <div><dt>Hook checks</dt><dd>{hookChecksText(evaluation)}</dd></div>
      <div><dt>Reads outside the scope</dt><dd>{excursionsText(evaluation)}</dd></div>
      <div><dt>Lines</dt><dd>{linesText(evaluation)}</dd></div>
      <div><dt>Tokens</dt><dd>{usageText(evaluation)}</dd></div>
      {evaluation.context && <div><dt>Context continuity</dt><dd>
        {evaluation.context.observations.map((observation, index) => <p key={index}>Current occupancy {observation.tokens ?? 'unknown'} tokens; model window {observation.window ?? 'unknown'}.
          {observation.native && <> Projected request {observation.native.projectedTokens ?? 'unknown'} tokens. Native compaction {observation.native.compaction.enabled ? 'enabled' : 'disabled'}; reserve {observation.native.compaction.reserveTokens}; recent history {observation.native.compaction.keepRecentTokens}; source {observation.native.source}.
            {observation.native.coverage.length > 0 && <> {observation.native.coverage.join('; ')}</>}</>}
        </p>)}
        {evaluation.context.compactions.map((compaction, index) => <p key={index}>Compaction {compaction.trigger}: {compaction.succeeded ? 'continued the task' : 'recovery needed'}; {compaction.before ?? 'unknown'} → {compaction.after ?? 'unknown'} tokens.{compaction.error ? ` ${compaction.error}` : ''} Rewritten history does not establish native prefix reuse or cache savings.</p>)}
        {evaluation.context.coverage.map((reason, index) => <p key={index} className="muted">{reason}</p>)}
      </dd></div>}
      {evaluation.gaps.length > 0 && (
        <div><dt>Coverage gaps</dt><dd className="warn">{evaluation.gaps.map(gap => `${gap.kind} (${gap.count})`).join(', ')}</dd></div>
      )}
    </dl>
  );
}
