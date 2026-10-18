import {
  createConfiguredAudit,
  type AuditWorkspaceOwnershipRecorder,
  type ConfiguredAuditPort,
  type ConfiguredAuditResult,
  type CommittedAuditConfiguration,
} from '../../subs/audit/src/check-execution.js';
import { createAuditWorkspaceOwnership } from '../run/audit-workspaces.js';

/** The assisted assessment keeps the provider result intact for provenance and retrieval. */
export interface AssistedAuditOutcome {
  readonly state: 'passed' | 'failed' | 'unavailable';
  readonly requestedSourceCommit: string;
  readonly auditedSourceCommit: string | null;
  readonly result: ConfiguredAuditResult | null;
  readonly detail: string;
}

/** An assisted job's audit uses the same committed provider and workspace owner as a harness gate. */
export async function auditAssistedCandidate(input: {
  readonly projectRoot: string;
  readonly baselineCommit: string;
  readonly candidateCommit: string;
  readonly jobId: string;
  readonly attemptId: string;
  /** A captured baseline policy may be passed from the job record. */
  readonly configuration?: CommittedAuditConfiguration;
  readonly configuredAudit?: ConfiguredAuditPort;
  readonly workspaceOwnership?: AuditWorkspaceOwnershipRecorder;
  readonly signal?: AbortSignal;
}): Promise<AssistedAuditOutcome> {
  const audit = input.configuredAudit ?? createConfiguredAudit({
    workspaceOwnership: input.workspaceOwnership ?? createAuditWorkspaceOwnership(input.projectRoot),
  });
  try {
    const configuration = input.configuration ?? await audit.read(input.projectRoot, input.baselineCommit, input.signal);
    if (configuration.sourceCommit !== input.baselineCommit) {
      throw new Error(`Captured audit configuration belongs to ${configuration.sourceCommit}, not baseline ${input.baselineCommit}`);
    }
    const result = await audit.run({
      projectRoot: input.projectRoot,
      sourceCommit: input.candidateCommit,
      configuration,
      mode: 'project-default',
      nested: false,
      runId: input.jobId,
      attemptId: input.attemptId,
      ...(input.signal === undefined ? {} : { signal: input.signal }),
    });
    if (result.requestedSourceCommit !== input.candidateCommit) {
      throw new Error(`Audit returned requested source ${result.requestedSourceCommit} for candidate ${input.candidateCommit}`);
    }
    const state = result.status !== 'completed' || result.verdict === null || result.verdict === 'indeterminate'
      ? 'unavailable' : result.verdict === 'pass' ? 'passed' : 'failed';
    return { state, requestedSourceCommit: result.requestedSourceCommit,
      auditedSourceCommit: result.auditedSourceCommit, result, detail: result.detail };
  } catch (error) {
    return { state: 'unavailable', requestedSourceCommit: input.candidateCommit, auditedSourceCommit: null,
      result: null, detail: error instanceof Error ? error.message : String(error) };
  }
}
