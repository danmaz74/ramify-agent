import { describe, expect, it } from 'vitest';
import type { CommittedAuditConfiguration, ConfiguredAuditPort, ConfiguredAuditResult } from '../../../audit/src/check-execution.js';
import { auditAssistedCandidate } from '../audit.js';

const configuration = { sourceCommit: 'original' } as CommittedAuditConfiguration;
function answer(overrides: Partial<ConfiguredAuditResult> = {}): ConfiguredAuditResult {
  return { status: 'completed', verdict: 'pass', requestedSourceCommit: 'candidate', auditedSourceCommit: 'earlier',
    reused: true, reuse: { sourceCommit: 'earlier' }, detail: 'reused provider evidence', ...overrides } as ConfiguredAuditResult;
}

describe('assisted configured audit', () => {
  it('asks the existing port for the exact candidate and keeps reused provenance', async () => {
    const seen: unknown[] = [];
    const port: ConfiguredAuditPort = {
      async read(_root, commit) { expect(commit).toBe('original'); return configuration; },
      async run(input) { seen.push(input); return answer(); },
    };
    const result = await auditAssistedCandidate({ projectRoot: '/project', baselineCommit: 'original',
      candidateCommit: 'candidate', jobId: 'job-1', attemptId: 'assessment-1', configuredAudit: port });
    expect(seen).toMatchObject([{ sourceCommit: 'candidate', mode: 'project-default', nested: false,
      runId: 'job-1', attemptId: 'assessment-1', configuration }]);
    expect(result).toMatchObject({ state: 'passed', requestedSourceCommit: 'candidate',
      auditedSourceCommit: 'earlier', result: { reused: true, auditedSourceCommit: 'earlier' } });
  });

  it('separates a completed failing check from unavailable evidence', async () => {
    const port = (result: ConfiguredAuditResult): ConfiguredAuditPort => ({
      async read() { return configuration; }, async run() { return result; },
    });
    const input = { projectRoot: '/project', baselineCommit: 'original', candidateCommit: 'candidate',
      jobId: 'job-1', attemptId: 'assessment-1' };
    expect((await auditAssistedCandidate({ ...input, configuredAudit: port(answer({ verdict: 'fail' })) })).state).toBe('failed');
    expect((await auditAssistedCandidate({ ...input, configuredAudit: port(answer({ verdict: 'indeterminate' })) })).state).toBe('unavailable');
    expect((await auditAssistedCandidate({ ...input, configuredAudit: port(answer({ status: 'refused', verdict: null })) })).state).toBe('unavailable');
  });

  it('uses the composed verdict and retains raw failures and flakiness warnings', async () => {
    const entry = { checkId: 'tests', command: 'vitest', runner: 'vitest', project: '',
      path: 'src/tests/existing.test.ts', kind: 'test', testId: 'existing intermittent test' };
    const provider = { status: 'completed', summary: { evidenceSchemaVersion: 6, overall: 'pass',
      flakinessPolicy: { onFailure: 'warning' },
      checks: { tests: { passed: false, status: 'fail' } },
      failureLedger: { entries: [entry] },
      warningDispositions: [{ entry, basis: 'retained-instability' }] },
      composition: { verdict: 'pass', outstandingFailures: 1, outstandingWarnings: 1 } };
    const audit = answer({ provider, checks: provider.summary.checks });
    const port: ConfiguredAuditPort = { async read() { return configuration; }, async run() { return audit; } };
    const result = await auditAssistedCandidate({ projectRoot: '/project', baselineCommit: 'original',
      candidateCommit: 'candidate', jobId: 'job-1', attemptId: 'assessment-1', configuredAudit: port });
    expect(result.state).toBe('passed');
    expect(result.result?.provider).toEqual(provider);
    expect(result.result?.checks).toEqual(provider.summary.checks);

    const blocked: ConfiguredAuditPort = { ...port, async run() { return { ...audit, verdict: 'fail' }; } };
    expect((await auditAssistedCandidate({ projectRoot: '/project', baselineCommit: 'original',
      candidateCommit: 'candidate', jobId: 'job-1', attemptId: 'assessment-2', configuredAudit: blocked })).state).toBe('failed');
  });

  it('reports a candidate configuration conflict without asserting an audit passed', async () => {
    const port: ConfiguredAuditPort = {
      async read() { return configuration; },
      async run() { throw new Error('Captured audit policy conflicts with candidate'); },
    };
    const result = await auditAssistedCandidate({ projectRoot: '/project', baselineCommit: 'original',
      candidateCommit: 'candidate', jobId: 'job-1', attemptId: 'assessment-1', configuredAudit: port });
    expect(result).toMatchObject({ state: 'unavailable', result: null,
      requestedSourceCommit: 'candidate', detail: 'Captured audit policy conflicts with candidate' });
  });
});
