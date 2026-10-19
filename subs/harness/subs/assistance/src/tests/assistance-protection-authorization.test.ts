import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SessionOperations } from '../../../agent/src/interfaces/session-operations.js';
import type { CandidateSource } from '../../../evidence/src/git.js';
import type { ConfiguredAuditResult } from '../../../audit/src/check-execution.js';
import { emptyCheckFindingState } from '../../../check-findings/src/replay.js';
import { finalizeApproval } from '../approval.js';
import { createAssessor } from '../assessment.js';
import { AssistanceService } from '../service.js';
import type { AssistedProtection } from '../contracts.js';
import { scriptedCandidates, type ScriptedCommit } from '../../../autonomous/subs/acceptance/src/tests/helpers/candidates.js';

const baseline = 'a'.repeat(40), edited = 'b'.repeat(40), retained = 'c'.repeat(40);
const diverged = 'd'.repeat(40), restored = 'e'.repeat(40);
const contract = 'docs/contract.spec.md';
const originalText = 'The feature returns 2.\n';
const acceptedText = 'The feature returns 2 with a revised contract.\n';
const otherText = 'The feature returns 3.\n';
const roots: string[] = [], services: AssistanceService[] = [];

const blobId = (value: string): string => createHash('sha1').update(`blob ${Buffer.byteLength(value)}\0${value}`).digest('hex');
const source = (base: string, text: string, changed = true): ScriptedCommit => ({
  tree: `tree-${base}-${blobId(text)}`, base,
  changes: changed ? [{ status: 'M', path: contract }] : [],
  files: { [contract]: text, 'src/feature.ts': 'export const feature = 2;\n' },
  comparisons: base === baseline ? undefined : { [baseline]: { changes: text === originalText ? [] : [{ status: 'M', path: contract }] } },
});

async function fixture(options: { second?: boolean; pending?: boolean; plainUnmet?: boolean; gap?: boolean; auditFailed?: boolean; auditReused?: boolean; reviewMissing?: boolean; semantic?: boolean } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'assistance-protection-authorization-'));
  roots.push(root);
  await mkdir(join(root, 'plans', 'sample'), { recursive: true });
  await writeFile(join(root, 'plans', 'sample', 'plan.md'), '# Plan\nThe feature returns 2.\n');
  const commits: Record<string, ScriptedCommit> = {
    [baseline]: source(baseline, originalText, false),
    [edited]: source(baseline, acceptedText),
    [retained]: source(edited, acceptedText),
    [diverged]: source(retained, otherText),
    [restored]: source(edited, originalText),
  };
  if (options.second) for (const entry of Object.values(commits)) {
    (entry.files as Record<string, string>)['docs/other.spec.md'] = entry === commits[baseline] ? originalText : acceptedText;
    (entry.changes as Array<{ status: string; path: string }>).push(...(entry === commits[baseline] ? [] : [{ status: 'M', path: 'docs/other.spec.md' }]));
  }
  // Same tree under a new commit is the concrete authorization regression.
  commits[retained] = { ...commits[retained]!, tree: commits[edited]!.tree };
  const scripted = scriptedCandidates(root, commits);
  const candidates: CandidateSource = {
    ...scripted,
    treeEntries: async (project, commit, signal) => (await scripted.treeEntries(project, commit, signal)).map(entry => {
      const file = commits[commit]!.files[entry.path]!;
      return { ...entry, objectId: blobId(typeof file === 'string' ? file : file.symlink) };
    }),
  };
  const protection: AssistedProtection = { baselineCommit: baseline,
    rules: { explicitPaths: [], excludedPaths: [], guardedPaths: [], additions: 'protect' }, gaps: [], unavailable: null };
  const audit = vi.fn(async (input: { candidateCommit: string }) => ({ state: options.auditFailed ? 'failed' as const : 'passed' as const,
    requestedSourceCommit: input.candidateCommit, auditedSourceCommit: options.auditReused ? baseline : input.candidateCommit, detail: 'configured audit',
    result: { definition: { path: 'ramify-audit.json', blob: 'fixed-selection' } } as ConfiguredAuditResult }));
  const review = vi.fn(async (input: Parameters<NonNullable<import('../assessment.js').AssessmentDependencies['review']>>[0]) => {
        if (options.reviewMissing) return { status: 'incomplete' as const, reason: 'Review unavailable', operationId: input.operationId, eventCount: 0 };
        const read = await input.prepared.tools.definitions.find(tool => tool.name === 'snapshot_read')!
          .execute({ path: contract }, new AbortController().signal);
        expect(read.text).toContain('feature returns');
        if (options.second) await input.prepared.tools.definitions.find(tool => tool.name === 'snapshot_read')!
          .execute({ path: 'docs/other.spec.md' }, new AbortController().signal);
        const report = { inspected: options.second ? [contract, 'docs/other.spec.md'] : [contract], missing: [], concerns: options.semantic ? [{ summary: 'Implementation defect', consequence: 'Feature fails', rationale: 'Source defect', uncertainty: 'None', remedy: 'Repair implementation', locations: [{ path: contract, startLine: 1, endLine: 1 }], suggests: null, risk: 'medium', ground: null }] : [], codeAssessment: 'The feature returns 2.',
          scopeAssessment: 'The candidate implements the captured plan.', design: { needed: false,
            reason: 'No interface change.', assessment: 'No ownership change.' },
          requirements: [
            { ref: 'captured-plan', outcome: 'met', explanation: 'The feature returns 2.', evidencePaths: [contract] },
            { ref: 'acceptance-1', outcome: options.pending || options.plainUnmet ? 'unmet' : 'met', explanation: 'Owner approval required.', evidencePaths: [contract],
              ...(options.pending ? { pendingProtection: options.second ? [contract, 'docs/other.spec.md'] : [contract] } : {}) },
          ], ...(options.gap ? { coverageGap: 'Consumer evidence unavailable.' } : {}) };
        const validated = input.prepared.validate(report);
        if (!validated.ok) throw new Error(JSON.stringify(validated.errors));
        return { status: 'submitted' as const, value: validated.value, operationId: input.operationId,
          sessionId: 'scripted-review', eventCount: 1 };
  });
  let clock = new Date('2026-10-18T20:00:00.000Z');
  const serviceOptions = { now: () => clock, projectRoot: root, registrationProtection: async () => protection, resolveCommit: async (_project: string, revision: string) => revision,
    assessor: createAssessor({ candidates, operations: async () => ({} as SessionOperations), audit, review,
      reconcile: async input => {
        const validated = await input.submission.validate({ relations: [], dispositions: [{ checkFinding: 'cf-0002', rationale: 'Implementation still needs repair.',
          communication: { mode: 'quiet' }, action: { action: 'repair' } }], next: { kind: 'correct', goal: 'Repair behavior.' }, brief: 'Repair remains.' });
        if (!validated.ok) throw new Error(JSON.stringify(validated.errors));
        return { status: 'submitted', value: validated.value, operationId: input.operationId, sessionId: 'scripted-reconcile', eventCount: 1 };
      } }) };
  const service = await AssistanceService.open(serviceOptions);
  services.push(service);
  const job = await service.planStart({ planId: 'sample', commandId: 'start' });
  const assess = async (base: string, candidate: string, kind: 'iteration' | 'final' = 'iteration') => {
    const admitted = await service.iterationAssess({ planId: 'sample', jobId: job.jobId, base, candidate,
      kind, ...(kind === 'final' ? { planBaseline: baseline } : {}), brief: 'Keep the feature returning 2.', acceptance: ['The feature returns 2.'],
      requirementDocuments: [], commandId: `assess-${candidate}` });
    await vi.waitFor(() => expect(service.assessmentStatus('sample', job.jobId, admitted.assessmentId).status).toMatch(/completed|interrupted/u));
    const result = service.assessmentDetail('sample', job.jobId, admitted.assessmentId);
    expect(result.status, result.error ?? 'assessment did not complete').toBe('completed');
    return result;
  };
  return { root, service, job, assess, audit, review, serviceOptions, gitCalls: scripted.calls, setTime: (time: string) => { clock = new Date(time); } };
}

afterEach(async () => {
  for (const service of services.splice(0)) await service.close();
  for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true });
});

describe('exact protection authorization through an assisted assessment', () => {
  it('requires an authorized choice, then accepts only its retained Git entry without fabricating same-tree repair evidence', async () => {
    const { root, service, job, assess } = await fixture();
    const first = await assess(baseline, edited);
    expect(first.outcome?.gate).toBe('action-required');
    const initial = first.stages.find(stage => stage.name === 'protection')!.evidence as { violations: Array<{ path: string; before: { objectId: string }; after: { objectId: string } }> };
    expect(initial.violations).toMatchObject([{ path: contract, before: { objectId: blobId(originalText) }, after: { objectId: blobId(acceptedText) } }]);
    const stagePath = join(root, 'plans', 'sample', '.harness', 'jobs', job.jobId, 'assessments', first.id, 'stages', 'protection.json');
    const stageBytes = await readFile(stagePath);
    const stageHash = `sha256:${createHash('sha256').update(stageBytes).digest('hex')}`;
    const initialFinding = service.findings('sample', job.jobId).find(item => item.verification.kind === 'check' && item.verification.producer === 'check:protection');
    expect(initialFinding).toBeDefined();
    expect(initialFinding!.reports.at(-1)?.observation.evidence).toContainEqual(expect.objectContaining({
      ref: `assessments/${first.id}/stages/protection.json`, hash: stageHash,
    }));
    const accepted = await service.protectionAccept({ planId: 'sample', jobId: job.jobId, assessmentId: first.id,
      path: contract, userName: 'Owner', authority: 'owner-decision-47', commandId: 'accept-contract' });
    expect(accepted.option).toBe('accept-exact-change');
    const chosen = service.findings('sample', job.jobId).find(item => item.id === initialFinding!.id)!;
    const answer = chosen.decisions.find(item => item.id !== accepted.request && item.actor.kind === 'user');
    expect(answer).toMatchObject({ actor: { kind: 'user', name: 'Owner' },
      decision: { action: 'answer-user-decision', request: accepted.request, option: 'accept-exact-change' } });
    const answerPath = join(root, 'plans', 'sample', '.harness', 'jobs', job.jobId,
      'check-findings', initialFinding!.id, 'decisions', `${answer!.id}.json`);
    const answerBytes = await readFile(answerPath);
    expect(JSON.parse(answerBytes.toString())).toMatchObject({ id: answer!.id, checkFinding: initialFinding!.id,
      actor: { kind: 'user', name: 'Owner' }, decision: { request: accepted.request, option: 'accept-exact-change' },
      evidence: [{ ref: `assessments/${first.id}/stages/protection.json` }, { ref: 'owner-decision-47' }] });
    const answerHash = createHash('sha256').update(answerBytes).digest('hex');

    const same = await assess(edited, retained);
    expect(same.outcome?.gate).toBe('clear');
    const sameProtection = same.stages.find(stage => stage.name === 'protection')!.evidence as {
      changes: Array<{ path: string; authorizedBy: { id: string; hash: string } | null }>;
      violations: unknown[];
    };
    expect(sameProtection.violations).toEqual([]);
    expect(sameProtection.changes).toMatchObject([{ path: contract, authorizedBy: { id: answer!.id, revision: 1, hash: answerHash } }]);
    const historical = service.findings('sample', job.jobId).find(item => item.id === initialFinding!.id)!;
    expect(historical.standing).toBe('open');
    expect(historical.decisions.at(-1)?.decision.action).toBe('answer-user-decision');
    expect(historical.decisions.some(decision => decision.decision.action === 'fix-by-check')).toBe(false);

    const changedAgain = await assess(retained, diverged);
    expect(changedAgain.outcome?.gate).toBe('action-required');
    expect(changedAgain.outcome?.repairs.join(' ')).toContain(contract);
    const different = await service.protectionAccept({ planId: 'sample', jobId: job.jobId, assessmentId: changedAgain.id,
      path: contract, userName: 'Owner', authority: 'different-exact-change', commandId: 'accept-different-change' });
    expect(different.finalization?.outcome.gate).toBe('clear');
    expect(different.finalization?.authorities[0]?.id).not.toBe(accepted.finalization?.authorities[0]?.id);
  });

  it('clears a protected edit restored to the original baseline without any authorization', async () => {
    const { service, job, assess } = await fixture();
    const first = await assess(baseline, edited);
    expect(first.outcome?.gate).toBe('action-required');
    const repair = await assess(edited, restored);
    expect(repair.outcome?.gate).toBe('clear');
    expect(service.findings('sample', job.jobId).filter(item => item.verification.kind === 'check'
      && item.verification.producer === 'check:protection').every(item => item.standing === 'closed')).toBe(true);
    expect(repair.stages.find(stage => stage.name === 'protection')?.evidence).toMatchObject({ changes: [], violations: [] });
  });

  it('finalizes the unchanged pre-reviewed candidate atomically with approval and replays after restart', async () => {
    const { service, job, assess, audit, review, serviceOptions, gitCalls, setTime } = await fixture({ pending: true });
    const original = await assess(baseline, edited, 'final');
    const input = { planId: 'sample', jobId: job.jobId, assessmentId: original.id,
      path: contract, userName: 'Owner', authority: 'conversation-approval', commandId: 'accept' };
    const callsBeforeApproval = [...gitCalls];
    setTime('2026-10-18T20:01:00.000Z');
    const accepted = await service.protectionAccept(input);
    expect(accepted.finalization).toMatchObject({ candidate: edited, baseline, planHash: service.assistedJob('sample', job.jobId).plan.sha256,
      outcome: { gate: 'clear' }, authorities: [{ id: expect.any(String), hash: expect.stringMatching(/^[a-f0-9]{64}$/u) }] });
    expect(service.assessmentResult('sample', job.jobId, original.id)).toMatchObject({ gate: 'clear', finalization: accepted.finalization });
    expect(service.assessmentDetail('sample', job.jobId, original.id)).toMatchObject({ outcome: original.outcome,
      finalizations: [accepted.finalization] });
    expect(await service.protectionAccept(input)).toEqual(accepted);
    const decisions = structuredClone(service.findings('sample', job.jobId));
    const laterCommand = { ...input, commandId: 'duplicate-new-command', userName: 'Other owner', authority: 'later-conversation' };
    setTime('2026-10-18T20:02:00.000Z');
    await expect(service.protectionAccept(laterCommand)).rejects.toThrow('already accepted');
    expect(service.findings('sample', job.jobId)).toEqual(decisions);
    expect(service.assessmentResult('sample', job.jobId, original.id)?.finalization).toEqual(accepted.finalization);
    expect(accepted.finalization).toMatchObject({ commandId: input.commandId, finalizedAt: '2026-10-18T20:01:00.000Z' });
    await service.close();
    services.splice(services.indexOf(service), 1);
    const reopened = await AssistanceService.open(serviceOptions);
    services.push(reopened);
    expect(await reopened.protectionAccept(input)).toEqual(accepted);
    setTime('2026-10-18T20:03:00.000Z');
    await expect(reopened.protectionAccept({ ...laterCommand, commandId: 'duplicate-after-restart' })).rejects.toThrow('already accepted');
    expect(reopened.findings('sample', job.jobId)).toEqual(decisions);
    expect(reopened.assessmentDetail('sample', job.jobId, original.id).finalizations).toEqual([accepted.finalization]);
    expect(reopened.assessmentResult('sample', job.jobId, original.id)).toMatchObject({ gate: 'clear', finalization: accepted.finalization });
    expect(audit).toHaveBeenCalledTimes(1);
    expect(review).toHaveBeenCalledTimes(1);
    expect(gitCalls).toEqual(callsBeforeApproval);
  });

  it('requires every exact protected difference and every typed requirement dependency', async () => {
    const { service, job, assess, audit, review } = await fixture({ second: true, pending: true });
    const original = await assess(baseline, edited);
    const input = { planId: 'sample', jobId: job.jobId, assessmentId: original.id,
      path: contract, userName: 'Owner', authority: 'conversation-approval', commandId: 'accept-first' };
    const first = await service.protectionAccept(input);
    expect(first.finalization?.outcome.gate).toBe('action-required');
    expect(service.assessmentResult('sample', job.jobId, original.id)?.gate).toBe('action-required');
    const second = await service.protectionAccept({ ...input, path: 'docs/other.spec.md', commandId: 'accept-second' });
    expect(second.finalization?.outcome.gate).toBe('clear');
    expect(second.finalization?.authorities).toHaveLength(2);
    expect(audit).toHaveBeenCalledTimes(1);
    expect(review).toHaveBeenCalledTimes(1);
    // Retrying an older receipt does not overwrite the later completed result.
    expect(await service.protectionAccept(input)).toEqual(first);
    expect(service.assessmentResult('sample', job.jobId, original.id)?.gate).toBe('clear');
  });

  it('preserves exact user authority after a coordinator continues unavailable advisory review', async () => {
    const { service, job, assess, audit, review } = await fixture({ reviewMissing: true });
    const original = await assess(baseline, edited);
    const ids = { planId: 'sample', jobId: job.jobId, assessmentId: original.id };
    await service.reviewContinue({ ...ids, rationale: 'Configured checks and engineer inspection suffice.', commandId: 'continue' });
    expect(service.assessmentResult('sample', job.jobId, original.id)?.gate).toBe('action-required');
    const accepted = await service.protectionAccept({ ...ids, path: contract, userName: 'Owner', authority: 'actual-user-approval', commandId: 'accept' });
    expect(accepted.finalization?.outcome.gate).toBe('clear');
    expect(service.assessmentResult('sample', job.jobId, original.id)?.gate).toBe('clear');
    expect(audit).toHaveBeenCalledTimes(1);
    expect(review).toHaveBeenCalledTimes(1);
  });

  it.each([
    [{ plainUnmet: true }, 'action-required'],
    [{ gap: true }, 'clear'],
    [{ auditFailed: true }, 'action-required'],
    [{ reviewMissing: true }, 'incomplete'],
    [{ semantic: true }, 'action-required'],
  ] as const)('preserves unrelated assessment gates for %j', async (options, gate) => {
    const { service, job, assess, audit, review } = await fixture(options);
    const original = await assess(baseline, edited);
    const accepted = await service.protectionAccept({ planId: 'sample', jobId: job.jobId, assessmentId: original.id,
      path: contract, userName: 'Owner', authority: 'conversation-approval', commandId: 'accept' });
    expect(service.assessmentResult('sample', job.jobId, original.id)?.gate).toBe(gate);
    if ('auditFailed' in options || 'reviewMissing' in options) expect(accepted.finalization).toBeUndefined();
    expect(audit).toHaveBeenCalledTimes(1);
    expect(review).toHaveBeenCalledTimes('auditFailed' in options ? 0 : 1);
  });


  it('refuses transferring retained readiness across candidates, requirements, plans or prerequisite evidence', async () => {
    const { service, job, assess } = await fixture();
    const original = await assess(baseline, edited);
    const captured = service.assistedJob('sample', job.jobId);
    const input = { assessment: original, job: captured, assessments: [original], state: emptyCheckFindingState(),
      commandId: 'accept', finalizedAt: new Date().toISOString() };
    for (const changed of [
      { ...original, request: { ...original.request, candidate: diverged } },
      { ...original, request: { ...original.request, acceptance: ['Different requirements.'] } },
      { ...original, stages: original.stages.filter(stage => stage.name !== 'approval-readiness') },
      { ...original, stages: original.stages.map(stage => stage.name === 'audit' ? { ...stage, evidence: { state: 'passed' } } : stage) },
      { ...original, status: 'interrupted' as const },
    ]) expect(finalizeApproval({ ...input, assessment: changed })).toBeNull();
    expect(finalizeApproval({ ...input, job: { ...captured, plan: { ...captured.plan, sha256: '0'.repeat(64) } } })).toBeNull();
    expect(finalizeApproval({ ...input, job: { ...captured, protection: { ...captured.protection, baselineCommit: restored } } })).toBeNull();
  });


  it('retains a provider-verified audit reuse for the exact requested candidate', async () => {
    const { service, job, assess, audit } = await fixture({ auditReused: true });
    const original = await assess(baseline, edited);
    const accepted = await service.protectionAccept({ planId: 'sample', jobId: job.jobId, assessmentId: original.id,
      path: contract, userName: 'Owner', authority: 'conversation-approval', commandId: 'accept' });
    expect(accepted.finalization?.outcome.gate).toBe('clear');
    expect(service.assessmentDetail('sample', job.jobId, original.id).stages.find(stage => stage.name === 'audit')?.evidence)
      .toMatchObject({ requestedSourceCommit: edited, auditedSourceCommit: baseline });
    expect(audit).toHaveBeenCalledTimes(1);
  });

});
