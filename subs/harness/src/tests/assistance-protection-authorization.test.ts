import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SessionOperations } from '../../subs/agent/src/interfaces/session-operations.js';
import type { CandidateSource } from '../../subs/evidence/src/git.js';
import type { ConfiguredAuditResult } from '../../subs/audit/src/check-execution.js';
import { createAssessor } from '../assistance/assessment.js';
import { AssistanceService } from '../assistance/service.js';
import type { AssistedProtection } from '../assistance/contracts.js';
import { scriptedCandidates, type ScriptedCommit } from './helpers/candidates.js';

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

async function fixture() {
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
  const service = await AssistanceService.open({ projectRoot: root, registrationProtection: async () => protection,
    resolveCommit: async (_project, revision) => revision,
    assessor: createAssessor({ candidates, operations: async () => ({} as SessionOperations),
      audit: async input => ({ state: 'passed', requestedSourceCommit: input.candidateCommit,
        auditedSourceCommit: input.candidateCommit, detail: 'configured audit passed',
        result: { definition: { path: 'ramify-audit.json', blob: 'fixed-selection' } } as ConfiguredAuditResult }),
      review: async input => {
        const read = await input.prepared.tools.definitions.find(tool => tool.name === 'snapshot_read')!
          .execute({ path: contract }, new AbortController().signal);
        expect(read.text).toContain('feature returns');
        const report = { inspected: [contract], missing: [], concerns: [], codeAssessment: 'The feature returns 2.',
          scopeAssessment: 'The candidate implements the captured plan.', design: { needed: false,
            reason: 'No interface change.', assessment: 'No ownership change.' },
          requirements: [
            { ref: 'captured-plan', outcome: 'met', explanation: 'The feature returns 2.', evidencePaths: [contract] },
            { ref: 'acceptance-1', outcome: 'met', explanation: 'The feature returns 2.', evidencePaths: [contract] },
          ] } as const;
        const validated = input.prepared.validate(report);
        if (!validated.ok) throw new Error(JSON.stringify(validated.errors));
        return { status: 'submitted', value: validated.value, operationId: input.operationId,
          sessionId: 'scripted-review', eventCount: 1 };
      },
    }) });
  services.push(service);
  const job = await service.planStart({ planId: 'sample', commandId: 'start' });
  const assess = async (base: string, candidate: string) => {
    const admitted = await service.iterationAssess({ planId: 'sample', jobId: job.jobId, base, candidate,
      kind: 'iteration', brief: 'Keep the feature returning 2.', acceptance: ['The feature returns 2.'],
      requirementDocuments: [], commandId: `assess-${candidate}` });
    await vi.waitFor(() => expect(service.assessmentStatus('sample', job.jobId, admitted.assessmentId).status).toMatch(/completed|interrupted/u));
    const result = service.assessmentDetail('sample', job.jobId, admitted.assessmentId);
    expect(result.status, result.error ?? 'assessment did not complete').toBe('completed');
    return result;
  };
  return { root, service, job, assess };
}

afterEach(async () => {
  for (const service of services.splice(0)) await service.close();
  for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true });
});

describe('exact protection authorization through an assisted assessment', () => {
  it('requires an authorized choice, then accepts only its retained Git entry and closes by fresh check evidence', async () => {
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
    const closed = service.findings('sample', job.jobId).find(item => item.id === initialFinding!.id)!;
    expect(closed.standing).toBe('closed');
    expect(closed.decisions.at(-1)?.decision).toMatchObject({ action: 'fix-by-check',
      witness: { producer: 'check:protection', attempt: same.id, outcome: 'passed', coverage: 'complete' } });
    const sameStageBytes = await readFile(join(root, 'plans', 'sample', '.harness', 'jobs', job.jobId,
      'assessments', same.id, 'stages', 'protection.json'));
    expect(closed.decisions.at(-1)?.evidence).toContainEqual(expect.objectContaining({
      ref: `assessments/${same.id}/stages/protection.json`,
      hash: `sha256:${createHash('sha256').update(sameStageBytes).digest('hex')}`,
    }));

    const changedAgain = await assess(retained, diverged);
    expect(changedAgain.outcome?.gate).toBe('action-required');
    expect(changedAgain.outcome?.repairs.join(' ')).toContain(contract);
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
});
