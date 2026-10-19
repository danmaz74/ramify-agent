import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { SessionOperations } from '../../../agent/src/interfaces/session-operations.js';
import type { ConfiguredAuditResult } from '../../../audit/src/check-execution.js';
import { scriptedCandidates, type ScriptedCommit } from '../../../autonomous/subs/acceptance/src/tests/helpers/candidates.js';
import { decideCheckFindingChange } from '../../../check-findings/src/decide.js';
import { validateReconciliationForExecution } from '../../../reviews/src/reconciliation.js';
import type { AssistedReviewSubmission } from '../../../reviews/src/assisted.js';
import { findingDetails, reportReviewConcerns } from '../findings.js';
import { AssistanceService } from '../service.js';
import { finalizeApproval } from '../approval.js';
import { emptyCheckFindingState } from '../../../check-findings/src/replay.js';
import { createAssessor, type AssessmentDependencies } from '../assessment.js';
import type { AssistedProtection } from '../contracts.js';
import { captureAssistanceDocuments, type AssistanceDocuments } from '../documents.js';

const baseline = 'a'.repeat(40), first = 'b'.repeat(40), repaired = 'c'.repeat(40);
const roots: string[] = [], services: AssistanceService[] = [];
const protection: AssistedProtection = { baselineCommit: baseline,
  rules: { explicitPaths: [], excludedPaths: [], guardedPaths: [], additions: 'protect' }, gaps: [], unavailable: null };
const audit = (candidate: string, state: 'passed' | 'failed' = 'passed') => ({ state, requestedSourceCommit: candidate,
  auditedSourceCommit: candidate, detail: state === 'passed' ? 'configured audit passed' : 'configured audit failed',
  result: { definition: { path: 'ramify-audit.json', blob: 'fixed-selection' } } as ConfiguredAuditResult });
const outcome = async (service: AssistanceService, jobId: string, assessmentId: string) => {
  await vi.waitFor(() => expect(service.assessmentStatus('sample', jobId, assessmentId).status).toMatch(/completed|interrupted/u));
  const detail = service.assessmentDetail('sample', jobId, assessmentId);
  expect(detail.status, detail.error ?? 'assessment did not complete').toBe('completed');
  return detail.outcome!;
};

async function setup(commits: Record<string, ScriptedCommit>, deps: Omit<AssessmentDependencies, 'candidates'>, planMarkdown = '# Plan\nThe feature returns 2.\n') {
  const root = await mkdtemp(join(tmpdir(), 'assistance-assessment-')); roots.push(root);
  await mkdir(join(root, 'plans', 'sample'), { recursive: true });
  await writeFile(join(root, 'plans', 'sample', 'plan.md'), planMarkdown);
  const candidates = scriptedCandidates(root, commits);
  const service = await AssistanceService.open({ projectRoot: root, registrationProtection: async () => protection,
    resolveCommit: async (_root, revision) => revision === 'HEAD' ? baseline : revision, currentHead: async () => baseline, isCleanRepository: async () => true, assessor: createAssessor({ ...deps, candidates }) });
  services.push(service);
  const job = await service.planStart({ planId: 'sample', commandId: 'start' });
  const assess = async (candidate: string, base: string, commandId: string, extra: Record<string, unknown> = {}) => {
    const admitted = await service.iterationAssess({ planId: 'sample', jobId: job.jobId, base, candidate,
      kind: 'iteration', brief: 'Implement the feature.', acceptance: ['The feature returns 2.'], requirementDocuments: [], commandId, ...extra });
    return { id: admitted.assessmentId, outcome: await outcome(service, job.jobId, admitted.assessmentId) };
  };
  return { service, job, candidates, assess };
}

const unusedOperations = async (): Promise<SessionOperations> => ({} as SessionOperations);
const source = (value: string, base: string, extras: Partial<ScriptedCommit> = {}): ScriptedCommit => ({
  tree: `tree-${value}`, base, changes: [{ status: 'M', path: 'src/feature.ts' }],
  files: { 'src/feature.ts': `export const feature = ${value};\n`, 'src/dependency.ts': 'export const dependency = true;\n' }, ...extras,
});

const reviewReport = (candidate: string, concern = false): AssistedReviewSubmission => ({
  inspected: ['src/feature.ts'], missing: [],
  concerns: concern ? [{ summary: 'Feature returns 1 instead of 2', consequence: 'Acceptance behavior fails', rationale: 'The candidate returns 1',
    uncertainty: 'None', remedy: 'Return 2', locations: [{ path: 'src/feature.ts', startLine: 1, endLine: 1 }], suggests: null,
    risk: 'medium', ground: null }] : [],
  codeAssessment: concern ? 'Behavior is incorrect.' : 'Feature returns 2.', scopeAssessment: 'The feature is within the requested outcome.',
  design: { needed: false, reason: 'No interface change.', assessment: 'Dependency ownership is preserved.' },
  requirements: [
    { ref: 'captured-plan', outcome: concern ? 'unmet' : 'met', explanation: concern ? 'Feature returns 1.' : 'Feature returns 2.', evidencePaths: concern ? [] : ['src/feature.ts'] },
    { ref: 'acceptance-1', outcome: concern ? 'unmet' : 'met', explanation: concern ? 'Feature returns 1.' : 'Feature returns 2.', evidencePaths: concern ? [] : ['src/feature.ts'] },
  ],
});

afterEach(async () => {
  for (const service of services.splice(0)) await service.close();
  for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true });
});

describe('assisted assessment pipeline with real service records', () => {
  it('carries a semantic repair across candidates and closes it only after fresh source assessment', async () => {
    const visits: string[] = [];
    const { service, job, assess } = await setup({ [baseline]: source('0', baseline), [first]: source('1', baseline),
      [repaired]: source('2', first, { comparisons: { [baseline]: { changes: [{ status: 'M', path: 'src/feature.ts' }] } } }) }, {
      operations: unusedOperations, audit: async input => audit(input.candidateCommit),
      review: async input => {
        visits.push(input.candidate);
        const report = reviewReport(input.candidate, input.candidate === first);
        const validated = input.prepared.validate(report);
        expect(validated).toMatchObject({ ok: true });
        if (!validated.ok) throw new Error(JSON.stringify(validated.errors));
        return { status: 'submitted', value: validated.value, operationId: input.operationId, sessionId: `script-${visits.length}`, eventCount: 1 };
      },
      reconcile: async input => {
        const isRepair = input.candidate === first;
        if (!isRepair) await input.tools.find(tool => tool.name === 'snapshot_read')!.execute({ path: 'src/feature.ts' }, new AbortController().signal);
        const submission = { relations: [], dispositions: [{ checkFinding: 'cf-0001', rationale: isRepair ? 'Behavior needs correction.' : 'Fresh candidate returns 2.',
          communication: { mode: 'quiet' }, action: isRepair ? { action: 'repair' } : { action: 'fixed', reassessed: ['cfr-0001'] } }],
          next: isRepair ? { kind: 'correct', goal: 'Return 2.' } : { kind: 'complete' }, brief: isRepair ? 'Repair feature.' : 'Feature repaired.' };
        const validated = await input.submission.validate(submission);
        expect(validated).toMatchObject({ ok: true });
        if (!validated.ok) throw new Error(JSON.stringify(validated.errors));
        return { status: 'submitted', value: validated.value, operationId: input.operationId, sessionId: 'script-reconcile', eventCount: 1 };
      },
    });
    const a = await assess(first, baseline, 'assess-first');
    expect(a.outcome.gate).toBe('action-required');
    expect(a.outcome.repairs.join(' ')).toContain('Feature returns 1');
    const b = await assess(repaired, first, 'assess-repair', { previousAssessment: a.id });
    expect(b.outcome.gate).toBe('clear');
    expect(visits).toEqual([first, repaired]);
    expect(service.assessmentDetail('sample', job.jobId, a.id).outcome?.gate).toBe('action-required');
  });

  it('retains a large complete audit beside the bounded ledger and resumes it after reload without rerunning the provider', async () => {
    const diagnostics = 'diagnostic evidence\n'.repeat(Math.ceil(3 * 1024 * 1024 / 20));
    const auditResult = { ...audit(first), result: { definition: { path: 'ramify-audit.json', blob: 'fixed-selection' },
      diagnostics, reportRef: 'refs/audited/runs/original', provenance: { requested: first, original: baseline, tail: 'complete-provider-tail' } } as unknown as ConfiguredAuditResult };
    const runAudit = vi.fn(async () => auditResult);
    let reviews = 0;
    const dependencies: Omit<AssessmentDependencies, 'candidates'> = { operations: unusedOperations, audit: runAudit,
      review: async input => {
        if (++reviews === 1) throw new Error('Interrupt after retained audit checkpoint');
        const tool = input.prepared.tools.definitions.find(tool => tool.name === 'assessment_evidence')!;
        const firstChunk = JSON.parse((await tool.execute({ ref: 'assessments/as-0001/stages/audit.json' }, new AbortController().signal)).text);
        expect(firstChunk.totalChars).toBe(JSON.stringify(auditResult).length);
        expect(firstChunk.nextOffset).toBeGreaterThan(0);
        const tail = JSON.parse((await tool.execute({ ref: 'assessments/as-0001/stages/audit.json', offset: firstChunk.totalChars - 160 }, new AbortController().signal)).text);
        expect(tail.content).toContain('complete-provider-tail');
        return { status: 'submitted', value: reviewReport(first), operationId: input.operationId, sessionId: 'large-audit-review', eventCount: 1 };
      } };
    const { service, job, candidates } = await setup({ [baseline]: source('0', baseline), [first]: source('2', baseline) }, dependencies);
    const admitted = await service.iterationAssess({ planId: 'sample', jobId: job.jobId, base: baseline, candidate: first,
      kind: 'iteration', brief: 'Implement feature.', acceptance: ['The feature returns 2.'], requirementDocuments: [], commandId: 'large-audit' });
    await vi.waitFor(() => expect(service.assessmentStatus('sample', job.jobId, admitted.assessmentId).status).toBe('interrupted'));
    const stage = service.assessmentDetail('sample', job.jobId, admitted.assessmentId).stages.find(stage => stage.name === 'audit')!;
    expect(stage.evidence).toMatchObject({ schema: 'ramify-agent.assisted-audit-reference/1', state: 'passed', requestedSourceCommit: first });
    const reference = stage.evidence as { artifact: { path: string; sha256: string } };
    const directory = join(service.projectRoot, 'plans/sample/.harness/jobs', job.jobId);
    const bytes = await readFile(join(directory, reference.artifact.path));
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(reference.artifact.sha256);
    expect(JSON.parse(bytes.toString())).toEqual(auditResult);
    const log = await readFile(join(directory, 'events.jsonl'), 'utf8');
    expect(log).not.toContain('complete-provider-tail');
    expect(Math.max(...log.trim().split('\n').map(line => Buffer.byteLength(line)))).toBeLessThan(128 * 1024);
    await service.close();
    await rm(join(directory, 'assessments/as-0001/stages/audit.json'));
    const reopened = await AssistanceService.open({ projectRoot: service.projectRoot, assessor: createAssessor({ ...dependencies, candidates }) });
    services.push(reopened);
    expect(JSON.parse(await readFile(join(directory, 'assessments/as-0001/stages/audit.json'), 'utf8'))).toEqual(stage.evidence);
    await reopened.assessmentResume('sample', job.jobId, admitted.assessmentId);
    await vi.waitFor(() => expect(reviews).toBe(2));
    expect((await outcome(reopened, job.jobId, admitted.assessmentId)).gate).toBe('clear');
    expect(runAudit).toHaveBeenCalledTimes(1);
    expect(reopened.assessmentDetail('sample', job.jobId, admitted.assessmentId).stages.some(stage => stage.name === 'approval-readiness')).toBe(true);
    const completed = reopened.assessmentDetail('sample', job.jobId, admitted.assessmentId);
    expect(finalizeApproval({ assessment: completed, assessments: [completed], job: reopened.assistedJob('sample', job.jobId),
      state: emptyCheckFindingState(), commandId: 'retained-audit-readiness', finalizedAt: new Date().toISOString() }))
      .toMatchObject({ outcome: { gate: 'clear' } });
  });

  it('passes stored outcome, advisory focus and supplemental context through the real recorded-iteration composition', async () => {
    const { service, job } = await setup({ [baseline]: source('0', baseline), [first]: source('2', baseline) }, {
      operations: unusedOperations, audit: async input => audit(input.candidateCommit),
      review: async input => {
        expect(input.prepared.message).toContain('Original intended outcome');
        expect(input.prepared.message).toContain('Declared module focus: subs/harness');
        expect(input.prepared.message).toContain('cross-module changes are allowed');
        expect(input.prepared.message).toContain('Consumer verification completed');
        const validated = input.prepared.validate(reviewReport(input.candidate));
        if (!validated.ok) throw new Error(JSON.stringify(validated.errors));
        return { status: 'submitted', value: validated.value, operationId: input.operationId, sessionId: 'recorded-review', eventCount: 1 };
      },
    });
    const ids = { planId: 'sample', jobId: job.jobId };
    const iteration = await service.iteration({ ...ids, action: 'start', brief: 'Original intended outcome', focusModule: 'subs/harness', commandId: 'work' });
    const admitted = await service.iteration({ ...ids, action: 'end', iterationId: iteration.id, candidate: first,
      acceptance: ['The feature returns 2.'], requirementDocuments: [], additionalContext: 'Consumer verification completed', commandId: 'candidate' });
    expect((await outcome(service, job.jobId, admitted.assessmentId)).gate).toBe('clear');
    expect(service.assessmentDetail('sample', job.jobId, admitted.assessmentId).request.brief).toBe('Original intended outcome');
    expect(service.assessmentResult('sample', job.jobId, admitted.assessmentId)).toMatchObject({ gate: 'clear', completedAt: expect.any(String) });
  });

  it('resumes a supported report with binary candidate evidence and an unread supplemental artifact without a coverage gate', async () => {
    const files = { ...source('2', baseline).files, 'evidence.gz': 'opaque\0candidate bytes', 'history.gz': 'unrelated\0history' };
    const initial = { ...source('0', baseline), files: { ...files, 'src/feature.ts': 'export const feature = 0;\n' } };
    const { service, job, candidates } = await setup({ [baseline]: initial, [first]: { ...source('2', baseline), files } }, {
      operations: unusedOperations, audit: async input => audit(input.candidateCommit),
      review: async input => {
        expect(input.prepared.tools.definitions.map(tool => tool.name)).toContain('shell');
        const report = reviewReport(input.candidate);
        const checked = input.prepared.validate({ ...report, inspected: [], missing: [{ path: 'history.gz', reason: 'Unrelated historical artifact.' }],
          limitations: ['Historical artifact was not needed.'], requirements: report.requirements.map(answer => ({ ...answer, evidencePaths: ['evidence.gz'] })) });
        if (!checked.ok) throw new Error(JSON.stringify(checked.errors));
        await input.onSubmitted?.(checked.value, { sessionId: 'ordinary-inspection', operationId: input.operationId, eventCount: 1 });
        throw new Error('Interrupted after accepted ordinary inspection');
      },
    });
    const admitted = await service.iterationAssess({ planId: 'sample', jobId: job.jobId, base: baseline, candidate: first,
      kind: 'iteration', brief: 'Implement the feature.', acceptance: ['The feature returns 2.'], requirementDocuments: [], commandId: 'ordinary-inspection' });
    await vi.waitFor(() => expect(service.assessmentStatus('sample', job.jobId, admitted.assessmentId).status).toBe('interrupted'));
    await service.close();
    const resumed = await AssistanceService.open({ projectRoot: service.projectRoot, assessor: createAssessor({ candidates,
      operations: unusedOperations, review: async () => { throw new Error('Accepted assessment must be reused'); } }) }); services.push(resumed);
    const beforeResume = resumed.assessmentStatus('sample', job.jobId, admitted.assessmentId).revision;
    await resumed.assessmentResume('sample', job.jobId, admitted.assessmentId);
    await vi.waitFor(() => expect(resumed.assessmentStatus('sample', job.jobId, admitted.assessmentId).revision).toBeGreaterThan(beforeResume));
    expect((await outcome(resumed, job.jobId, admitted.assessmentId)).gate).toBe('clear');
    expect(candidates.calls.some(call => call.startsWith('readBlob') && /(?:evidence|history)\.gz/u.test(call))).toBe(false);
  });

  it.each(['missing', 'corrupt'] as const)('recovers a compact document checkpoint and complete immutable evidence after restart (%s artifact)', async mode => {
    const companion = '# Companion narrative retained only in immutable Git';
    const principle = '# Principle narrative retained only in immutable Git';
    const pinned = '# Explicit pinned requirement remains delivered';
    const planMarkdown = '# Plan\nThe feature returns 2. [Companion](../../docs/companion.md)\n';
    const initial = { ...source('0', baseline), files: { ...source('0', baseline).files,
      'docs/companion.md': companion, 'quality.principles.md': principle, 'docs/pinned.md': pinned } };
    let reviews = 0;
    const dependencies: Omit<AssessmentDependencies, 'candidates'> = {
      operations: unusedOperations, audit: async input => audit(input.candidateCommit),
      review: async input => {
        if (++reviews === 1) throw new Error('Interrupted after compact document checkpoint');
        expect(input.prepared.message).not.toContain('quality.principles.md');
        expect(input.prepared.message).not.toContain(principle);
        expect(input.prepared.message).not.toContain(pinned);
        expect(input.prepared.message).toContain('docs/pinned.md');
        const tool = input.prepared.tools.definitions.find(tool => tool.name === 'assessment_evidence')!;
        const stages = JSON.parse((await tool.execute({ ref: 'assessments/as-0001/stages/documents.json' }, new AbortController().signal)).text) as { content: string };
        expect(JSON.parse(stages.content)).toMatchObject({ storage: 'git-references' });
        for (const [path, text] of [['plans/sample/plan.md', planMarkdown], ['docs/companion.md', companion], ['quality.principles.md', principle]]) {
          const first = JSON.parse((await tool.execute({ ref: `baseline:${path}`, limit: 8 }, new AbortController().signal)).text) as { content: string; nextOffset: number };
          const rest = JSON.parse((await tool.execute({ ref: `baseline:${path}`, offset: first.nextOffset }, new AbortController().signal)).text) as { content: string; nextOffset: null };
          expect(rest.nextOffset).toBeNull();
          expect(first.content + rest.content).toBe(text);
        }
        const report = reviewReport(input.candidate);
        const validated = input.prepared.validate({ ...report, requirements: [...report.requirements,
          { ref: 'requirement-document-1', outcome: 'met', explanation: 'Pinned requirement verified.', evidencePaths: ['src/feature.ts'] }] });
        if (!validated.ok) throw new Error(JSON.stringify(validated.errors));
        return { status: 'submitted', value: validated.value, operationId: input.operationId, sessionId: 'compact-evidence-review', eventCount: 1 };
      },
    };
    const { service, job, candidates } = await setup({ [baseline]: initial, [first]: source('2', baseline) }, dependencies, planMarkdown);
    const admitted = await service.iterationAssess({ planId: 'sample', jobId: job.jobId, base: baseline, candidate: first,
      kind: 'iteration', brief: 'Implement the feature.', acceptance: ['The feature returns 2.'], commandId: 'compact-evidence',
      requirementDocuments: [{ path: 'docs/pinned.md', revision: baseline }] });
    await vi.waitFor(() => expect(service.assessmentStatus('sample', job.jobId, admitted.assessmentId).status).toBe('interrupted'));
    const detail = service.assessmentDetail('sample', job.jobId, admitted.assessmentId);
    expect(detail.error).toContain('Interrupted after compact document checkpoint');
    const stage = detail.stages.find(stage => stage.name === 'documents')!;
    expect(stage.evidence).toMatchObject({ schema: 'ramify-agent.assisted-document-reference/1', baselineCommit: baseline });
    const reference = stage.evidence as { artifact: { path: string; sha256: string } };
    expect(JSON.stringify(stage.evidence)).not.toContain(companion);
    expect(JSON.stringify(stage.evidence)).not.toContain(principle);
    const directory = join(service.projectRoot, 'plans/sample/.harness/jobs', job.jobId);
    const artifact = JSON.parse(await readFile(join(directory, reference.artifact.path), 'utf8'));
    expect(artifact).toMatchObject({ storage: 'git-references', documents: expect.any(Array) });
    expect(JSON.stringify(artifact)).not.toContain(companion); expect(JSON.stringify(artifact)).not.toContain(principle);
    const log = await readFile(join(directory, 'events.jsonl'), 'utf8');
    expect(log).not.toContain(companion); expect(log).not.toContain(principle);
    await service.close();
    await rm(join(directory, 'assessments', admitted.assessmentId, 'stages/documents.json'));
    if (mode === 'missing') await rm(join(directory, reference.artifact.path));
    else await writeFile(join(directory, reference.artifact.path), 'corrupted artifact');
    const reopened = await AssistanceService.open({ projectRoot: service.projectRoot,
      assessor: createAssessor({ ...dependencies, candidates }) });
    services.push(reopened);
    expect(JSON.parse(await readFile(join(directory, 'assessments', admitted.assessmentId, 'stages/documents.json'), 'utf8'))).toEqual(stage.evidence);
    await reopened.assessmentResume('sample', job.jobId, admitted.assessmentId);
    await vi.waitFor(() => expect(reopened.assessmentDetail('sample', job.jobId, admitted.assessmentId).revision).toBeGreaterThan(detail.revision));
    expect((await outcome(reopened, job.jobId, admitted.assessmentId)).gate).toBe('clear');
    expect(reopened.assessmentDetail('sample', job.jobId, admitted.assessmentId).requestedAt).toBe(detail.requestedAt);
    expect(JSON.parse(await readFile(join(directory, reference.artifact.path), 'utf8'))).toEqual(artifact);
  });

  it('restores a missing historical compact document catalog using its original discovery policy', async () => {
    const planMarkdown = '# Plan\nThe feature returns 2. [Companion](../../docs/companion.md)\n';
    const initial = { ...source('0', baseline), files: { ...source('0', baseline).files,
      'docs/companion.md': '# Companion constraint', 'quality.principles.md': '# Relevant quality' } };
    const { service, job, candidates } = await setup({ [baseline]: initial, [first]: source('2', baseline) },
      { operations: unusedOperations, audit: async input => audit(input.candidateCommit) }, planMarkdown);
    await service.close();
    let original: AssistanceDocuments | undefined;
    const old = await AssistanceService.open({ projectRoot: service.projectRoot, resolveCommit: async (_root, revision) => revision,
      assessor: async context => {
        original = await captureAssistanceDocuments({ projectRoot: context.projectRoot, planId: 'sample',
          planMarkdown: context.planMarkdown, baselineCommit: baseline, candidates, discoverReferences: true });
        await context.checkpoint('documents', { schema: 'ramify-agent.assisted-document-reference/1', baselineCommit: baseline,
          artifact: await context.retainEvidence(original) });
        throw new Error('Historical executor stopped after compact capture');
      } }); services.push(old);
    const admitted = await old.iterationAssess({ planId: 'sample', jobId: job.jobId, base: baseline, candidate: first,
      kind: 'iteration', brief: 'Implement the feature.', acceptance: ['The feature returns 2.'], requirementDocuments: [], commandId: 'legacy-compact' });
    await vi.waitFor(() => expect(old.assessmentStatus('sample', job.jobId, admitted.assessmentId).status).toBe('interrupted'));
    const detail = old.assessmentDetail('sample', job.jobId, admitted.assessmentId);
    const stage = detail.stages.find(stage => stage.name === 'documents')!.evidence as { artifact: { path: string; sha256: string } };
    expect(original!.documents.map(document => document.path)).toContain('docs/companion.md');
    const artifact = join(service.projectRoot, 'plans/sample/.harness/jobs', job.jobId, stage.artifact.path);
    await old.close();
    await rm(artifact);
    const resumed = await AssistanceService.open({ projectRoot: service.projectRoot, assessor: createAssessor({ candidates,
      operations: unusedOperations, audit: async input => audit(input.candidateCommit), review: async input => {
        expect(input.prepared.message).not.toContain('# Companion constraint');
        const checked = input.prepared.validate(reviewReport(input.candidate));
        if (!checked.ok) throw new Error(JSON.stringify(checked.errors));
        return { status: 'submitted', value: checked.value, operationId: input.operationId, sessionId: 'legacy-compact-review', eventCount: 1 };
      } }) }); services.push(resumed);
    await resumed.assessmentResume('sample', job.jobId, admitted.assessmentId);
    await vi.waitFor(() => expect(resumed.assessmentDetail('sample', job.jobId, admitted.assessmentId).revision).toBeGreaterThan(detail.revision));
    expect((await outcome(resumed, job.jobId, admitted.assessmentId)).gate).toBe('clear');
    expect(JSON.parse(await readFile(artifact, 'utf8'))).toEqual(original);
    expect(resumed.assessmentDetail('sample', job.jobId, admitted.assessmentId).stages.find(item => item.name === 'documents')!.evidence).toEqual(stage);
  });

  it.each(['valid', 'lossy-principle', 'lossy-companion', 'cached-lossy-companion'] as const)('verifies resumed legacy inline documents without changing their historical records (%s)', async scenario => {
    const lossy = scenario !== 'valid';
    const root = await mkdtemp(join(tmpdir(), 'assistance-legacy-documents-')); roots.push(root);
    await mkdir(join(root, 'plans/sample'), { recursive: true });
    const planMarkdown = '# Plan\nThe feature returns 2. [Companion](../../docs/companion.md)\n';
    await writeFile(join(root, 'plans/sample/plan.md'), planMarkdown);
    const historicalText = '\uFFFD';
    const bodies = { 'plans/sample/plan.md': planMarkdown, 'docs/companion.md': historicalText, 'quality.principles.md': historicalText };
    const entries = Object.entries(bodies).map(([path, text], index) => ({ id: `doc-${String(index + 1).padStart(3, '0')}`, path,
      kind: path.endsWith('.principles.md') ? 'principle' as const : 'plan' as const, sha256: createHash('sha256').update(text).digest('hex'), bytes: Buffer.byteLength(text),
      storedAt: index === 0 ? 'input/plan.md' : `input/documents/doc-${String(index + 1).padStart(3, '0')}.bin`, revision: { commit: null, dirty: null } }));
    const legacy: AssistanceDocuments = { baselineCommit: baseline,
      manifest: { schema: 'ramify-agent.document-manifest/1', root: 'doc-001', documents: entries, missing: [], principlesScan: { status: 'complete', unreadable: [] } },
      documents: entries.map(entry => ({ id: entry.id, path: entry.path, kind: entry.kind, sha256: entry.sha256,
        text: entry.id === 'doc-001' ? 'Historical root copy is not authority' : historicalText, adoption: 'undetermined' })),
      gaps: { missing: [], unreadablePrinciples: [] } };
    const old = await AssistanceService.open({ projectRoot: root, registrationProtection: async () => protection,
      resolveCommit: async (_root, revision) => revision, assessor: async context => {
        await context.checkpoint('documents', legacy);
        if (scenario === 'cached-lossy-companion') await context.checkpoint('review-accepted', { result: { status: 'submitted', value: reviewReport(first), operationId: 'legacy-review', sessionId: 'legacy-session', eventCount: 1 }, bindings: [], read: [], inspected: [] });
        throw new Error('Legacy executor stopped');
      } });
    services.push(old);
    const job = await old.planStart({ planId: 'sample', commandId: 'register-legacy' });
    const admitted = await old.iterationAssess({ planId: 'sample', jobId: job.jobId, base: baseline, candidate: first, kind: 'iteration',
      brief: 'Implement the feature.', acceptance: ['The feature returns 2.'], requirementDocuments: [], commandId: 'legacy-assess' });
    await vi.waitFor(() => expect(old.assessmentStatus('sample', job.jobId, admitted.assessmentId).status).toBe('interrupted'));
    const original = old.assessmentDetail('sample', job.jobId, admitted.assessmentId);
    await old.close();
    const files = { ...source('0', baseline).files, ...bodies };
    const candidates = scriptedCandidates(root, { [baseline]: { ...source('0', baseline), files }, [first]: { ...source('2', baseline), files: { ...files, 'src/feature.ts': 'export const feature = 2;\n' } } });
    const listed = candidates.treeEntries.bind(candidates);
    vi.spyOn(candidates, 'treeEntries').mockImplementation(async (project, commit) => (await listed(project, commit)).map(entry => {
      if (entry.path !== 'docs/companion.md' && entry.path !== 'quality.principles.md') return entry;
      const invalid = scenario === 'lossy-principle' || lossy && entry.path === 'docs/companion.md';
      const bytes = invalid ? Buffer.from([0xf0, 0x90, 0x80]) : Buffer.from(historicalText);
      return { ...entry, bytes: bytes.length, objectId: createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex') };
    }));
    const resumed = await AssistanceService.open({ projectRoot: root, assessor: createAssessor({ candidates, operations: unusedOperations,
      audit: async input => audit(input.candidateCommit), review: async input => {
        expect(scenario).not.toBe('cached-lossy-companion');
        const tool = input.prepared.tools.definitions.find(tool => tool.name === 'assessment_evidence')!;
        const call = (ref: string) => tool.execute({ ref }, new AbortController().signal);
        const capturedPlan = JSON.parse((await call('baseline:plans/sample/plan.md')).text) as { content: string };
        expect(capturedPlan.content).toBe(planMarkdown);
        for (const path of ['docs/companion.md', 'quality.principles.md']) {
          const answer = await call(`baseline:${path}`);
          if (scenario === 'lossy-principle' || lossy && path === 'docs/companion.md') expect(answer).toMatchObject({ isError: true, text: expect.stringContaining('could not be decoded exactly') });
          else expect(JSON.parse(answer.text).content).toBe(historicalText);
        }
        const documentStage = JSON.parse((await call(`assessments/${admitted.assessmentId}/stages/documents.json`)).text) as { content: string };
        const projection = JSON.parse(documentStage.content) as AssistanceDocuments;
        expect(projection).toEqual(legacy);
        const report = reviewReport(input.candidate);
        const checked = input.prepared.validate({ ...report, requirements: report.requirements.map(answer => lossy && answer.ref === 'captured-plan'
          ? { ...answer, outcome: 'uncertain', explanation: 'Required legacy companion text is unavailable.', evidencePaths: [] } : answer) });
        if (!checked.ok) throw new Error(JSON.stringify(checked.errors));
        return { status: 'submitted', value: checked.value, operationId: input.operationId, sessionId: 'legacy-source-review', eventCount: 1 };
      } }) });
    services.push(resumed);
    await resumed.assessmentResume('sample', job.jobId, admitted.assessmentId);
    await vi.waitFor(() => expect(resumed.assessmentDetail('sample', job.jobId, admitted.assessmentId).revision).toBeGreaterThan(original.revision));
    const result = await outcome(resumed, job.jobId, admitted.assessmentId);
    expect(result.gate).toBe(lossy && scenario !== 'cached-lossy-companion' ? 'incomplete' : 'clear');
    if (lossy && scenario !== 'cached-lossy-companion') expect(result.gaps.join(' ')).toContain('Required legacy companion text is unavailable');
    expect(resumed.assessmentDetail('sample', job.jobId, admitted.assessmentId).stages.find(stage => stage.name === 'documents')?.evidence).toEqual(legacy);
  });

  it.each(['valid-review', 'lossy-review', 'lossy-base', 'valid-conflict', 'lossy-conflict', 'unproven-closure', 'applied-fixed', 'applied-supersede', 'applied-lossy', 'valid-applied', 'user-applied'] as const)(
    'revalidates accepted historical candidate judgments before applying them after restart (%s)', async scenario => {
      const root = await mkdtemp(join(tmpdir(), 'assistance-legacy-judgments-')); roots.push(root);
      await mkdir(join(root, 'plans/sample'), { recursive: true });
      await writeFile(join(root, 'plans/sample/plan.md'), '# Plan\nThe feature returns 2.\n');
      const applied = scenario.startsWith('applied-') || scenario === 'valid-applied' || scenario === 'user-applied';
      const closure = scenario === 'unproven-closure' || applied;
      const reconciliation = scenario.includes('conflict') || closure;
      const report = reviewReport(first, reconciliation);
      const old = await AssistanceService.open({ projectRoot: root, registrationProtection: async () => protection,
        resolveCommit: async (_root, revision) => revision, assessor: async context => {
          const bindings = report.concerns.map(() => ({ ground: null, credibility: 'ungrounded' as const, modules: [] }));
          const reviewed = { result: { status: 'submitted', value: report,
            operationId: 'legacy-review', sessionId: 'legacy-session', eventCount: 1 }, bindings, read: ['src/feature.ts'], inspected: ['src/feature.ts'] };
          await context.checkpoint('review-accepted', reviewed);
          if (reconciliation) {
            await context.recordFindings(reportReviewConcerns({ assessment: context.assessment.id, tree: 'tree-2', report, bindings,
              evidence: { kind: 'assisted-review', ref: `assessments/${context.assessment.id}/stages/review.json`, hash: `sha256:${createHash('sha256').update(`${JSON.stringify(reviewed, null, 2)}\n`).digest('hex')}` } }), 'review-reports');
            const state = context.findingState();
            const details = findingDetails(state);
            const proposed = { relations: [], dispositions: [{ checkFinding: 'cf-0001', rationale: 'Historical source judgment.',
              communication: { mode: 'quiet' }, action: closure
                ? scenario === 'applied-supersede' ? { action: 'supersede', reassessed: ['cfr-0001'], replacement: 'Historical replacement judgment.' } : { action: 'fixed', reassessed: ['cfr-0001'] }
                : { action: 'request-user-decision', conflicts: [{ document: 'docs/authority.md', text: '\uFFFD' }],
                  options: [{ id: 'restore', summary: 'Restore source', consequence: 'Repair candidate.' },
                    { id: 'retain', summary: 'Retain source', consequence: 'Keep candidate.' }] } }],
              next: { kind: closure ? 'complete' : 'await-user' }, brief: 'Historical reconciliation.' };
            const checked = await validateReconciliationForExecution(proposed, {
              id: `${context.assessment.id}-reconciliation`, owner: context.job.jobId,
              attention: new Map(details.map(detail => [detail.summary.id, { revision: detail.summary.revision,
                reason: detail.summary.reason, awaiting: detail.summary.awaiting, risk: detail.summary.risk, modules: detail.summary.modules }])),
              held: new Map(details.map(detail => [detail.summary.id, detail.summary.revision])),
              actor: { kind: 'agent', role: 'assisted-reconciler', invocation: 'legacy-reconciliation' },
              source: { kind: 'tree', id: 'tree-2' }, authority: { kind: 'governing-record', ref: context.job.plan.storedAt }, responsible: { kind: 'run' },
              waiverRefusal: () => 'requires coordinator authority', evidence: () => [{ kind: 'assisted-reconciliation', ref: 'legacy', hash: null }],
              // This is the pre-fix acquisition behavior: the old executor
              // accepted a replacement character without checking blob identity.
              document: async () => ({ text: '\uFFFD', revision: 'tree-2' }),
              decide: command => { const changed = decideCheckFindingChange(state, command); return changed.ok ? null : changed.rejection; },
            });
            if (!checked.ok) throw new Error(JSON.stringify(checked.errors));
            await context.checkpoint('reconciliation-accepted', { status: 'submitted', value: checked.value,
              operationId: 'legacy-reconciliation', sessionId: 'legacy-reconciliation-session', eventCount: 1,
              ...(scenario === 'valid-applied' || scenario === 'applied-lossy' ? { exactSourceReads: ['src/feature.ts'] } : {}) });
            if (applied) await context.recordFindings(checked.value.commands, 'reconciliation-decisions');
            if (scenario === 'user-applied') {
              const current = context.findingState().findings.get('cf-0001')!;
              const common = { actor: { kind: 'user' as const, name: 'Fixture reviewer' }, source: { kind: 'tree' as const, id: 'tree-2' },
                rationale: 'Actual subsequent user decision.', evidence: [], communication: { mode: 'quiet' as const } };
              await context.recordFindings([
                { type: 'dispose', checkFinding: current.id, expectedRevision: current.revision,
                  decision: { ...common, decision: { action: 'reopen', cause: { kind: 'decision' } } } },
                { type: 'dispose', checkFinding: current.id, expectedRevision: current.revision + 1,
                  decision: { ...common, decision: { action: 'waive', authority: { kind: 'user-decision', ref: 'fixture-user-choice' },
                    acceptedRisk: 'medium', uncertainty: 'The reviewer accepts this semantic risk.' } } },
              ], 'actual-user-decision');
            }
          }
          throw new Error('Legacy executor stopped after accepted judgment');
        } });
      services.push(old);
      const job = await old.planStart({ planId: 'sample', commandId: 'register' });
      const admitted = await old.iterationAssess({ planId: 'sample', jobId: job.jobId, base: baseline, candidate: first, kind: 'iteration',
        brief: 'Implement the feature.', acceptance: ['The feature returns 2.'], requirementDocuments: [], commandId: 'assess' });
      await vi.waitFor(() => expect(old.assessmentStatus('sample', job.jobId, admitted.assessmentId).status).toBe('interrupted'));
      const original = old.assessmentDetail('sample', job.jobId, admitted.assessmentId);
      const historical = original.stages;
      const historicalDecisions = old.findings('sample', job.jobId)[0]?.decisions ?? [];
      if (applied) expect(old.findings('sample', job.jobId)[0]?.standing).toBe('closed');
      await old.close();
      const candidates = scriptedCandidates(root, {
        [baseline]: source('0', baseline, { files: { ...source('0', baseline).files,
          ...(scenario === 'lossy-base' ? { 'src/feature.ts': '\uFFFD' } : {}) } }),
        [first]: source('2', baseline, { files: { ...source('2', baseline).files, 'docs/authority.md': '\uFFFD',
          ...(scenario === 'lossy-review' || scenario === 'applied-lossy' ? { 'src/feature.ts': '\uFFFD' } : {}) } }),
        [repaired]: source('2', first, { comparisons: { [baseline]: { changes: [{ status: 'M', path: 'src/feature.ts' }] } } }),
      });
      const listed = candidates.treeEntries.bind(candidates);
      vi.spyOn(candidates, 'treeEntries').mockImplementation(async (project, commit) => (await listed(project, commit)).map(entry => {
        if (entry.path !== 'docs/authority.md' && !(entry.path === 'src/feature.ts' &&
          ((scenario === 'lossy-review' || scenario === 'applied-lossy') && commit === first || scenario === 'lossy-base' && commit === baseline))) return entry;
        const bytes = scenario === 'valid-conflict' ? Buffer.from('\uFFFD') : Buffer.from([0xf0, 0x90, 0x80]);
        return { ...entry, bytes: bytes.length, objectId: createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex') };
      }));
      if (scenario === 'applied-supersede') {
        // Going straight to a new assessment must also find and reopen an
        // already-applied old closure, without resuming its original owner.
        let directReconciliations = 0;
        const direct = await AssistanceService.open({ projectRoot: root, resolveCommit: async (_root, revision) => revision,
          assessor: createAssessor({ candidates, operations: unusedOperations, audit: async input => audit(input.candidateCommit),
            review: async input => {
              const validated = input.prepared.validate(reviewReport(input.candidate));
              if (!validated.ok) throw new Error(JSON.stringify(validated.errors));
              return { status: 'submitted', value: validated.value, operationId: input.operationId, sessionId: 'direct-review', eventCount: 1 };
            }, reconcile: async input => {
              directReconciliations++;
              expect(input.message).toContain('cf-0001');
              return { status: 'incomplete', reason: 'The reopened historical concern still needs fresh resolution.', operationId: input.operationId, eventCount: 1 };
            },
          }) }); services.push(direct);
        const fresh = await direct.iterationAssess({ planId: 'sample', jobId: job.jobId, base: baseline, candidate: first,
          kind: 'iteration', brief: 'Reassess the old finding.', acceptance: ['The feature returns 2.'], requirementDocuments: [], commandId: 'direct-fresh' });
        expect((await outcome(direct, job.jobId, fresh.assessmentId)).gate).toBe('incomplete');
        expect(directReconciliations).toBe(1);
        expect(direct.findings('sample', job.jobId)[0]?.reason).toBe('reopened');
        expect(direct.assessmentStatus('sample', job.jobId, admitted.assessmentId).status).toBe('interrupted');
        await direct.close();
      }
      const currentAssessor = createAssessor({ candidates, operations: unusedOperations,
        audit: async input => audit(input.candidateCommit),
        review: async () => { throw new Error('Accepted review must remain the original immutable report'); },
        reconcile: async () => { throw new Error('Accepted reconciliation must not be replaced'); },
      });
      let injectedCrash = false;
      let resumed = await AssistanceService.open({ projectRoot: root, assessor: context => currentAssessor({ ...context,
        recordFindings: async (commands, key) => {
          await context.recordFindings(commands, key);
          if (scenario === 'applied-fixed' && key?.startsWith('source-invalidation-') && !injectedCrash) {
            injectedCrash = true;
            throw new Error('Stopped after committing source-proof invalidation');
          }
        },
      }) });
      services.push(resumed);
      await resumed.assessmentResume('sample', job.jobId, admitted.assessmentId);
      await vi.waitFor(() => expect(resumed.assessmentDetail('sample', job.jobId, admitted.assessmentId).revision).toBeGreaterThan(original.revision));
      if (scenario === 'applied-fixed') {
        await vi.waitFor(() => expect(resumed.assessmentStatus('sample', job.jobId, admitted.assessmentId).status).toBe('interrupted'));
        expect(injectedCrash).toBe(true);
        const beforeRestart = resumed.assessmentDetail('sample', job.jobId, admitted.assessmentId).revision;
        expect(resumed.findings('sample', job.jobId)[0]?.reason).toBe('reopened');
        await resumed.close();
        resumed = await AssistanceService.open({ projectRoot: root, assessor: currentAssessor }); services.push(resumed);
        await resumed.assessmentResume('sample', job.jobId, admitted.assessmentId);
        await vi.waitFor(() => expect(resumed.assessmentDetail('sample', job.jobId, admitted.assessmentId).revision).toBeGreaterThan(beforeRestart));
      }
      const result = await outcome(resumed, job.jobId, admitted.assessmentId);
      const valid = scenario === 'valid-review' || scenario === 'valid-conflict' || scenario === 'valid-applied';
      expect(result.gate).toBe(valid ? scenario === 'valid-review' ? 'clear' : 'action-required' : 'incomplete');
      if (!valid) expect(result.gaps.join(' ')).toContain(closure && scenario !== 'applied-lossy' ? 'no retained exact source-read provenance' : 'could not be decoded exactly from Git');
      const finding = resumed.findings('sample', job.jobId)[0];
      if (scenario === 'valid-conflict') expect(finding?.pendingUserDecision).not.toBeNull();
      else if (scenario === 'valid-applied') expect(finding?.reason).toBe('fixed-by-assessment');
      else if (scenario === 'user-applied') expect(finding?.reason).toBe('waived');
      else if (reconciliation) { expect(finding?.pendingUserDecision).toBeNull(); expect(finding?.standing).toBe('open'); }
      expect(finding?.decisions.slice(0, historicalDecisions.length) ?? []).toEqual(historicalDecisions);
      if (applied && scenario !== 'valid-applied' && scenario !== 'user-applied') {
        expect(finding?.decisions.filter(decision => decision.decision.action === 'reopen')).toHaveLength(1);
        expect(finding?.reason).toBe('reopened');
      }
      for (const stage of historical) expect(resumed.assessmentDetail('sample', job.jobId, admitted.assessmentId).stages.find(item => item.name === stage.name)).toEqual(stage);
      if (applied && scenario !== 'valid-applied' && scenario !== 'user-applied') {
        await resumed.close();
        let reconciliationCalls = 0, closeOnFreshEvidence = false;
        const fresh = await AssistanceService.open({ projectRoot: root, resolveCommit: async (_root, revision) => revision, assessor: createAssessor({ candidates, operations: unusedOperations,
          audit: async input => audit(input.candidateCommit), review: async input => {
            // A valid current read can assess a repaired file even when its
            // malformed base patch is unavailable for automatic delivery.
            await input.prepared.tools.definitions.find(tool => tool.name === 'snapshot_read')!.execute({ path: 'src/feature.ts' }, new AbortController().signal);
            const validated = input.prepared.validate(reviewReport(input.candidate));
            if (!validated.ok) throw new Error(JSON.stringify(validated.errors));
            return { status: 'submitted', value: validated.value, operationId: input.operationId, sessionId: 'fresh-review', eventCount: 1 };
          }, reconcile: async input => {
            reconciliationCalls++;
            expect(input.message).toContain('cf-0001');
            if (!closeOnFreshEvidence) return { status: 'incomplete', reason: 'Fresh reconciliation has not established a resolution.', operationId: input.operationId, eventCount: 1 };
            await input.tools.find(tool => tool.name === 'snapshot_read')!.execute({ path: 'src/feature.ts' }, new AbortController().signal);
            const validated = await input.submission.validate({ relations: [], dispositions: [{ checkFinding: 'cf-0001', rationale: 'Fresh exact current source resolves the concern.',
              communication: { mode: 'quiet' }, action: { action: 'fixed', reassessed: ['cfr-0001'] } }], next: { kind: 'complete' }, brief: 'Reassessed and fixed.' });
            if (!validated.ok) throw new Error(JSON.stringify(validated.errors));
            return { status: 'submitted', value: validated.value, operationId: input.operationId, sessionId: 'fresh-reconciliation', eventCount: 1 };
          },
        }) }); services.push(fresh);
        const assessFresh = async (commandId: string) => {
          const accepted = await fresh.iterationAssess({ planId: 'sample', jobId: job.jobId, base: first, candidate: repaired, kind: 'iteration',
            brief: 'Reassess the reopened concern.', acceptance: ['The feature returns 2.'], requirementDocuments: [], previousAssessment: admitted.assessmentId, commandId });
          return outcome(fresh, job.jobId, accepted.assessmentId);
        };
        expect((await assessFresh('fresh-unresolved')).gate).toBe('incomplete');
        expect(reconciliationCalls).toBe(1);
        expect(fresh.findings('sample', job.jobId)[0]?.standing).toBe('open');
        closeOnFreshEvidence = true;
        expect((await assessFresh('fresh-fixed')).gate).toBe('clear');
        expect(reconciliationCalls).toBe(2);
        expect(fresh.findings('sample', job.jobId)[0]?.reason).toBe('fixed-by-assessment');
        expect((await assessFresh('fresh-valid-reuse')).gate).toBe('clear');
        expect(reconciliationCalls).toBe(2);
        expect(fresh.findings('sample', job.jobId)[0]?.decisions.filter(decision => decision.decision.action === 'reopen')).toHaveLength(1);
      }
    });

  it('refuses replacement characters from malformed candidate bytes as verbatim user-decision authority', async () => {
    const document = 'docs/authority.md';
    let reconciliationCalls = 0;
    const initial = { ...source('0', baseline), files: { ...source('0', baseline).files, [document]: '\uFFFD' } };
    const candidate = { ...source('1', baseline), files: { ...source('1', baseline).files, [document]: '\uFFFD' } };
    const { service, job, candidates, assess } = await setup({ [baseline]: initial, [first]: candidate }, {
      operations: unusedOperations, audit: async input => audit(input.candidateCommit),
      review: async input => {
        const validated = input.prepared.validate(reviewReport(input.candidate, true));
        if (!validated.ok) throw new Error(JSON.stringify(validated.errors));
        return { status: 'submitted', value: validated.value, operationId: input.operationId, sessionId: 'malformed-authority-review', eventCount: 1 };
      },
      reconcile: async input => {
        reconciliationCalls++;
        const proposed = { relations: [], dispositions: [{ checkFinding: 'cf-0001', rationale: 'A supposed document conflict.',
          communication: { mode: 'quiet' }, action: { action: 'request-user-decision', conflicts: [{ document, text: '\uFFFD' }],
            options: [{ id: 'restore', summary: 'Restore source', consequence: 'Repair the candidate.' },
              { id: 'retain', summary: 'Retain source', consequence: 'Keep the candidate.' }] } }], next: { kind: 'await-user' }, brief: 'Resolve the supposed conflict.' };
        const validated = await input.submission.validate(proposed);
        expect(validated.ok).toBe(false);
        if (!validated.ok) expect(validated.errors).toEqual(expect.arrayContaining([expect.objectContaining({
          path: 'dispositions.0.action.conflicts.0.document', message: expect.stringContaining('neither an element') })]));
        return { status: 'incomplete', reason: 'Malformed source text is unavailable for conflict verification.', operationId: input.operationId, eventCount: 1 };
      },
    });
    const originalEntries = candidates.treeEntries.bind(candidates);
    const raw = Buffer.from([0xf0, 0x90, 0x80]);
    vi.spyOn(candidates, 'treeEntries').mockImplementation(async (root, commit) => (await originalEntries(root, commit)).map(entry => entry.path === document
      ? { ...entry, bytes: raw.length, objectId: createHash('sha1').update(`blob ${raw.length}\0`).update(raw).digest('hex') } : entry));
    const result = await assess(first, baseline, 'malformed-authority');
    expect(reconciliationCalls).toBe(1);
    expect(result.outcome.gate).toBe('incomplete');
    expect(result.outcome.gaps.join(' ')).toContain('Malformed source text is unavailable');
    expect(service.findings('sample', job.jobId)[0]?.pendingUserDecision).toBeNull();
  });

  it.each(['unmet', 'uncertain'] as const)('retains prior %s acceptance without duplicate concerns across unavailable same-iteration follow-up', async standing => {
    let reviews = 0;
    const { service, job } = await setup({ [baseline]: source('0', baseline), [first]: source('1', baseline),
      [repaired]: source('2', first, { comparisons: { [baseline]: { changes: [{ status: 'M', path: 'src/feature.ts' }] } } }) }, {
      operations: unusedOperations, audit: async input => audit(input.candidateCommit),
      review: async input => {
        reviews++;
        if (reviews === 2) return { status: 'incomplete', reason: 'Advisory provider unavailable', operationId: input.operationId, eventCount: 1 };
        const report = reviewReport(input.candidate);
        if (reviews === 1) report.requirements[1] = { ref: 'acceptance-1', outcome: standing, explanation: 'Feature still requires relevant verification.', evidencePaths: [] };
        return { status: 'submitted', value: report, operationId: input.operationId, sessionId: 'script', eventCount: 1 };
      },
    });
    const ids = { planId: 'sample', jobId: job.jobId };
    const iteration = await service.iteration({ ...ids, action: 'start', brief: 'Implement the feature.', focusModule: null, commandId: 'begin' });
    const end = async (candidate: string, commandId: string, previousAssessment?: string) => {
      const admitted = await service.iteration({ ...ids, action: 'end', iterationId: iteration.id, candidate,
        acceptance: ['The feature returns 2.'], requirementDocuments: [], commandId, ...(previousAssessment ? { previousAssessment } : {}) });
      await outcome(service, job.jobId, admitted.assessmentId);
      return admitted.assessmentId;
    };
    const initial = await end(first, 'initial-requirement');
    expect(service.findings('sample', job.jobId)).toEqual([]);
    const unavailable = await end(first, 'unchanged-follow-up', initial);
    await service.reviewContinue({ ...ids, assessmentId: unavailable, rationale: 'Continue advisory work only.', commandId: 'continue-unavailable' });
    const held = service.assessmentResult('sample', job.jobId, unavailable)!;
    expect(held.gate).toBe(standing === 'unmet' ? 'action-required' : 'incomplete');
    expect([...held.repairs, ...held.gaps].join(' ')).toContain('acceptance-1: Feature still requires relevant verification.');
    const verified = await end(repaired, 'verified-repair', unavailable);
    expect(service.assessmentResult('sample', job.jobId, verified)?.gate).toBe('clear');
  });

  it('lets the coordinator continue unavailable advisory review while preserving its stage', async () => {
    const { service, job, assess } = await setup({ [baseline]: source('0', baseline), [first]: source('2', baseline) }, {
      operations: unusedOperations, audit: async input => audit(input.candidateCommit),
      review: async input => ({ status: 'incomplete', reason: 'Provider unavailable', operationId: input.operationId, eventCount: 1 }),
    });
    const initial = await assess(first, baseline, 'unavailable');
    expect(initial.outcome.gate).toBe('incomplete');
    await service.reviewContinue({ planId: 'sample', jobId: job.jobId, assessmentId: initial.id,
      rationale: 'Configured checks and engineer evidence suffice for this advisory assessment.', commandId: 'continue-advisory' });
    expect(service.assessmentResult('sample', job.jobId, initial.id)?.gate).toBe('clear');
    expect(service.assessmentDetail('sample', job.jobId, initial.id).stages.find(stage => stage.name === 'review')?.evidence).toMatchObject({ result: { status: 'incomplete' } });
    expect(service.assessmentDetail('sample', job.jobId, initial.id).coordinatorDecisions).toEqual([{ commandId: 'continue-advisory', rationale: 'Configured checks and engineer evidence suffice for this advisory assessment.' }]);
  });

  it('retains actual unmet acceptance when a coordinator leaves a discretionary concern', async () => {
    const { service, job, assess } = await setup({ [baseline]: source('0', baseline), [first]: source('1', baseline) }, {
      operations: unusedOperations, audit: async input => audit(input.candidateCommit),
      review: async input => ({ status: 'submitted', value: reviewReport(input.candidate, true), operationId: input.operationId, sessionId: 'script', eventCount: 1 }),
      reconcile: async input => ({ status: 'incomplete', reason: 'Unavailable advisory reconciliation', operationId: input.operationId, eventCount: 1 }),
    });
    const initial = await assess(first, baseline, 'unmet');
    await service.findingDecide({ planId: 'sample', jobId: job.jobId, assessmentId: initial.id, checkFinding: 'cf-0001', action: 'leave', rationale: 'Do not pursue suggestion.', commandId: 'leave-suggestion' });
    await service.reviewContinue({ planId: 'sample', jobId: job.jobId, assessmentId: initial.id, rationale: 'Coordinator selects remaining acceptance repair.', commandId: 'continue-reconciliation' });
    const effective = service.assessmentResult('sample', job.jobId, initial.id)!;
    expect(effective.gate).toBe('action-required');
    expect(effective.repairs.join(' ')).toContain('acceptance-1');
  });

  it.each(['leave', 'defer'] as const)('records coordinator %s and verifies a correction without repeating broad review', async action => {
    const review = vi.fn(async (input: Parameters<NonNullable<AssessmentDependencies['review']>>[0]) => {
      const value = input.prepared.message.includes('Optional readability work is outside useful scope.') ? reviewReport(input.candidate) : { ...reviewReport(input.candidate), concerns: [{ ...reviewReport(input.candidate, true).concerns[0]!,
        summary: 'Optional improvement', consequence: 'Could improve readability' }] };
      return { status: 'submitted' as const, value, operationId: input.operationId, sessionId: 'script', eventCount: 1 };
    });
    const { service, job, assess } = await setup({ [baseline]: source('0', baseline), [first]: source('2', baseline),
      [repaired]: source('2', first, { comparisons: { [baseline]: { changes: [{ status: 'M', path: 'src/feature.ts' }] } } }) }, { operations: unusedOperations, audit: async input => audit(input.candidateCommit), review,
      reconcile: async input => {
        const validated = await input.submission.validate({ relations: [], dispositions: [{ checkFinding: 'cf-0001', rationale: 'Coordinator can select useful work.',
          communication: { mode: 'quiet' }, action: { action: 'repair' } }], next: { kind: 'correct', goal: 'Consider suggestion.' }, brief: 'Suggestion retained.' });
        if (!validated.ok) throw new Error(JSON.stringify(validated.errors));
        return { status: 'submitted', value: validated.value, operationId: input.operationId, sessionId: 'script', eventCount: 1 };
      } });
    const initial = await assess(first, baseline, 'initial');
    expect(initial.outcome.gate).toBe('action-required');
    const request = { planId: 'sample', jobId: job.jobId, assessmentId: initial.id, checkFinding: 'cf-0001', action,
      rationale: 'Optional readability work is outside useful scope.', commandId: 'ordinary-decision' };
    const receipt = await service.findingDecide(request);
    expect(await service.findingDecide(request)).toEqual(receipt);
    expect(service.assessmentResult('sample', job.jobId, initial.id)?.gate).toBe('clear');
    expect(service.findings('sample', job.jobId)[0]!.decisions.at(-1)?.actor.kind).toBe('agent');
    const verified = await assess(repaired, first, 'verify', { previousAssessment: initial.id });
    expect(verified.outcome.gate).toBe('clear');
    expect(review).toHaveBeenCalledTimes(1);
    expect(service.assessmentDetail('sample', job.jobId, verified.id).stages.find(stage => stage.name === 'review-policy')?.evidence).toMatchObject({ mode: 'not-run' });
    const extra = await assess(repaired, first, 'purposeful', { previousAssessment: verified.id, reviewReason: 'Inspect substantial new behavior.' });
    expect(review).toHaveBeenCalledTimes(2);
    expect(service.assessmentDetail('sample', job.jobId, extra.id).stages.find(stage => stage.name === 'review-policy')?.evidence).toMatchObject({ mode: 'broad', reason: 'Inspect substantial new behavior.' });
    await service.close();
    const reopened = await AssistanceService.open({ projectRoot: service.projectRoot }); services.push(reopened);
    expect(await reopened.findingDecide(request)).toEqual(receipt);
    expect(reopened.findings('sample', job.jobId)[0]!.decisions.some(decision => decision.rationale === request.rationale)).toBe(true);
  });

  it('keeps an audit failure and original-baseline protected edit actionable across a later candidate', async () => {
    const contract = 'docs/contract.spec.md';
    const changed = { ...source('1', baseline), files: { ...source('1', baseline).files, [contract]: 'weakened\n' },
      changes: [{ status: 'M', path: 'src/feature.ts' }, { status: 'M', path: contract }] };
    const later = { ...source('2', first), files: { ...source('2', first).files, [contract]: 'weakened\n' },
      comparisons: { [baseline]: { changes: [{ status: 'M', path: 'src/feature.ts' }, { status: 'M', path: contract }] } } };
    const { assess } = await setup({ [baseline]: { ...source('0', baseline), files: { ...source('0', baseline).files, [contract]: 'strict\n' } }, [first]: changed, [repaired]: later }, {
      operations: unusedOperations, audit: async input => audit(input.candidateCommit, input.candidateCommit === first ? 'failed' : 'passed'),
      review: async input => {
        const paths = input.prepared.message.includes('M docs/contract.spec.md') ? ['src/feature.ts', contract] : ['src/feature.ts'];
        const report = { ...reviewReport(input.candidate), inspected: paths };
        const validated = input.prepared.validate(report);
        if (!validated.ok) throw new Error(JSON.stringify(validated.errors));
        return { status: 'submitted', value: validated.value, operationId: input.operationId, sessionId: 'script-review', eventCount: 1 };
      },
    });
    const a = await assess(first, baseline, 'assess-failure');
    expect(a.outcome.gate).toBe('action-required');
    expect(a.outcome.repairs.join(' ')).toContain('configured audit failed');
    expect([...a.outcome.repairs, ...a.outcome.decisions].join(' ')).toContain(contract);
    const b = await assess(repaired, first, 'assess-later', { previousAssessment: a.id });
    expect(b.outcome.gate).toBe('action-required');
    expect([...b.outcome.repairs, ...b.outcome.decisions].join(' ')).toContain(contract);
    expect(b.outcome.repairs.join(' ')).not.toContain('configured audit failed');
  });

  it('returns failed configured checks directly without semantic review or reconciliation', async () => {
    const { assess } = await setup({ [baseline]: source('0', baseline), [first]: source('1', baseline) }, {
      operations: unusedOperations, audit: async input => audit(input.candidateCommit, 'failed'),
      review: async () => { throw new Error('Semantic review must not run after failed audit'); },
      reconcile: async () => { throw new Error('Reconciliation must not run after failed audit'); },
    });
    const result = await assess(first, baseline, 'assess-missing');
    expect(result.outcome.gate).toBe('action-required');
    expect(result.outcome.gaps).toEqual([]);
    expect(result.outcome.repairs.join(' ')).toContain('configured audit failed');
  });

  it.each([false, true])('retains unavailable linked evidence for semantic applicability (required: %s)', async required => {
    const baselineSource = { ...source('0', baseline), files: { ...source('0', baseline).files,
      'docs/context.md': '[Historical evidence](/archive/result.json) [Local history](missing.md) [Binary evidence](payload.bundle)', 'docs/payload.bundle': '\uFFFD' } };
    const { service, job, assess, candidates } = await setup({ [baseline]: baselineSource, [first]: source('2', baseline) }, {
      operations: unusedOperations, audit: async input => audit(input.candidateCommit),
      review: async input => {
        expect(input.prepared.message).not.toContain('/archive/result.json');
        expect(input.prepared.message).not.toContain('docs/missing.md');
        expect(input.prepared.message).not.toContain('docs/payload.bundle');
        expect(input.prepared.message).toContain('original plan is available on demand');
        const report = reviewReport(input.candidate);
        const validated = input.prepared.validate({ ...report,
          scopeAssessment: required ? 'Required supporting evidence is unavailable.' : 'The historical references do not govern this outcome.',
          requirements: report.requirements.map(answer => answer.ref === 'captured-plan' && required
            ? { ...answer, outcome: 'uncertain', explanation: 'Applicable required evidence docs/payload.bundle is unavailable.', evidencePaths: [] } : answer) });
        if (!validated.ok) throw new Error(JSON.stringify(validated.errors));
        return { status: 'submitted', value: validated.value, operationId: input.operationId, sessionId: 'qualification-review', eventCount: 1 };
      },
    }, '# Plan\nThe feature returns 2. [Context](../../docs/context.md)\n');
    const result = await assess(first, baseline, 'assess-unavailable-reference');
    expect(result.outcome.gate).toBe(required ? 'incomplete' : 'clear');
    expect(candidates.calls.some(call => call.includes('/archive/') || call.includes('docs/missing.md'))).toBe(false);
    if (required) expect(result.outcome.gaps.join(' ')).toContain('Applicable required evidence');
    const reference = service.assessmentDetail('sample', job.jobId, result.id).stages.find(stage => stage.name === 'documents')!.evidence as { artifact: { path: string } };
    const evidence = JSON.parse(await readFile(join(service.projectRoot, 'plans/sample/.harness/jobs', job.jobId, reference.artifact.path), 'utf8'));
    expect(evidence).toMatchObject({ gaps: { missing: [], unreadablePrinciples: [] } });
    expect(candidates.calls.some(call => call.includes('docs/context.md') || call.includes('docs/payload.bundle'))).toBe(false);
  });

  it.each(['missing', 'binary'] as const)('reports a meaningful required-guidance limitation after on-demand inspection (%s)', async kind => {
    const initial = { ...source('0', baseline), files: { ...source('0', baseline).files, ...(kind === 'binary' ? { 'docs/required.md': 'header\0payload' } : {}) } };
    const { assess } = await setup({ [baseline]: initial, [first]: source('2', baseline) }, {
      operations: unusedOperations, audit: async input => audit(input.candidateCommit),
      review: async input => {
        expect(input.prepared.message).not.toContain('header\0payload');
        const tool = input.prepared.tools.definitions.find(tool => tool.name === 'assessment_evidence')!;
        const answer = await tool.execute({ ref: 'requirement-document-1' }, new AbortController().signal);
        expect(answer.isError).toBe(true);
        const report = reviewReport(input.candidate);
        const validated = input.prepared.validate({ ...report, requirements: [...report.requirements,
          { ref: 'requirement-document-1', outcome: 'uncertain', explanation: `Required document docs/required.md unavailable: ${answer.text}`, evidencePaths: [] }] });
        if (!validated.ok) throw new Error(JSON.stringify(validated.errors));
        return { status: 'submitted', value: validated.value, operationId: input.operationId, sessionId: 'pinned-document-review', eventCount: 1 };
      },
    });
    const result = await assess(first, baseline, 'assess-pinned', { requirementDocuments: [{ path: 'docs/required.md', revision: baseline }] });
    expect(result.outcome.gate).toBe('incomplete');
    expect(result.outcome.gaps.join(' ')).toContain('Required document docs/required.md');
    if (kind === 'binary') expect(result.outcome.gaps.join(' ')).toContain('binary NUL bytes');
  });

  it('does not make unselected unreadable principles an initial review obligation', async () => {
    const initial = { ...source('0', baseline), files: { ...source('0', baseline).files, 'quality.principles.md': '# Quality' } };
    const { assess, candidates } = await setup({ [baseline]: initial, [first]: source('2', baseline) }, {
      operations: unusedOperations, audit: async input => audit(input.candidateCommit),
      review: async input => {
        await input.prepared.tools.definitions.find(tool => tool.name === 'snapshot_read')!.execute({ path: 'src/feature.ts' }, new AbortController().signal);
        const validated = input.prepared.validate(reviewReport(input.candidate));
        if (!validated.ok) throw new Error(JSON.stringify(validated.errors));
        return { status: 'submitted', value: validated.value, operationId: input.operationId, sessionId: 'unreadable-principle-review', eventCount: 1 };
      },
    });
    candidates.fail('readBlob', baseline);
    const result = await assess(first, baseline, 'assess-unreadable-principle');
    expect(result.outcome.gate).toBe('clear');
    expect(result.outcome.gaps).toEqual([]);
    expect(candidates.calls.some(call => call.includes('quality.principles.md'))).toBe(false);
  });

  it('retains twenty material concerns without promoting legacy coverage prose to another required gap', async () => {
    const { assess } = await setup({ [baseline]: source('0', baseline), [first]: source('1', baseline) }, {
      operations: unusedOperations, audit: async input => audit(input.candidateCommit),
      review: async input => {
        const base = reviewReport(input.candidate, true);
        const report = { ...base, concerns: Array.from({ length: 20 }, (_, index) => ({
          ...base.concerns[0]!, summary: `Material behavior ${index + 1} is incorrect`,
        })), coverageGap: 'Further behavior remains unassessed after twenty concerns.' };
        const validated = input.prepared.validate(report);
        expect(validated).toMatchObject({ ok: true });
        if (!validated.ok) throw new Error(JSON.stringify(validated.errors));
        return { status: 'submitted', value: validated.value, operationId: input.operationId, sessionId: 'script-review', eventCount: 1 };
      },
      reconcile: async input => ({ status: 'incomplete', reason: 'Reconciliation did not produce a valid disposition',
        operationId: input.operationId, eventCount: 1 }),
    });
    const result = await assess(first, baseline, 'assess-overflow');
    expect(result.outcome.gate).toBe('incomplete');
    expect(result.outcome.gaps.join(' ')).not.toContain('Further behavior remains unassessed after twenty concerns.');
    expect(result.outcome.gaps.join(' ')).toContain('Reconciliation unavailable');
    expect(result.outcome.repairs.filter(repair => repair.includes('Material behavior'))).toHaveLength(20);
    expect(result.outcome.repairs.join(' ')).toContain('Material behavior 20 is incorrect');
  });

  it('finishes final repair through focused follow-up while retaining the complete plan on demand', async () => {
    const messages: string[] = [];
    const plan = '# Plan\nThe feature returns 2.\nKeep the unchanged dependency.\n';
    const { service, job } = await setup({ [baseline]: source('0', baseline), [first]: source('1', baseline),
      [repaired]: source('2', first, { comparisons: { [baseline]: { changes: [{ status: 'M', path: 'src/feature.ts' }] } } }) }, {
      operations: unusedOperations, audit: async input => audit(input.candidateCommit),
      review: async input => {
        messages.push(input.prepared.message);
        const report = reviewReport(input.candidate);
        if (input.candidate === first) report.requirements = report.requirements.map(answer => ({ ...answer,
          outcome: 'unmet', explanation: 'The feature still returns 1.' }));
        else {
          const retained = await input.prepared.tools.definitions.find(tool => tool.name === 'assessment_evidence')!.execute({ ref: 'captured-plan' }, new AbortController().signal);
          expect(JSON.parse(retained.text).content).toContain(plan.trim());
        }
        return { status: 'submitted', value: report, operationId: input.operationId, sessionId: 'final-review', eventCount: 1 };
      },
    }, plan);
    const final = async (candidate: string, commandId: string, previousAssessment?: string) => {
      const admitted = await service.iterationAssess({ planId: 'sample', jobId: job.jobId, base: first, candidate,
        kind: 'final', brief: 'Complete the plan.', acceptance: ['The feature returns 2.'], requirementDocuments: [],
        planBaseline: baseline, commandId, ...(previousAssessment === undefined ? {} : { previousAssessment }) });
      return { id: admitted.assessmentId, result: await outcome(service, job.jobId, admitted.assessmentId) };
    };
    const initial = await final(first, 'final-initial');
    expect(initial.result.gate).toBe('action-required');
    const repairedFinal = await final(repaired, 'final-repair', initial.id);
    expect(repairedFinal.result.gate).toBe('clear');
    expect(messages[0]).toContain(plan.trim());
    expect(messages[1]).not.toContain(plan.trim());
    expect(messages[1]).toContain('Do not restart the whole catalog by default.');
    expect(messages[1]).toContain('The feature still returns 1.');
    expect(service.assessmentDetail('sample', job.jobId, repairedFinal.id).stages.find(stage => stage.name === 'review-policy')?.evidence)
      .toMatchObject({ mode: 'focused-follow-up', previousAssessment: initial.id });
  });

  it('uses the original plan baseline for final diff and freshly reads an unchanged dependency', async () => {
    const reviewBases: string[] = [], dependencyReads: string[] = [];
    const { service, job, assess } = await setup({ [baseline]: source('0', baseline), [first]: source('1', baseline),
      [repaired]: source('2', first, { comparisons: { [baseline]: { changes: [{ status: 'M', path: 'src/feature.ts' }] } } }) }, {
      operations: unusedOperations, audit: async input => audit(input.candidateCommit),
      review: async input => {
        reviewBases.push(input.prepared.message.match(/Base: ([a-f0-9]+); candidate/u)?.[1] ?? 'missing');
        const read = await input.prepared.tools.definitions.find(tool => tool.name === 'snapshot_read')!.execute({ path: 'src/dependency.ts' }, new AbortController().signal);
        dependencyReads.push(read.text);
        const validated = input.prepared.validate(reviewReport(input.candidate));
        if (!validated.ok) throw new Error(JSON.stringify(validated.errors));
        return { status: 'submitted', value: validated.value, operationId: input.operationId, sessionId: 'script-review', eventCount: 1 };
      },
    });
    const local = await assess(first, baseline, 'assess-local');
    expect(local.outcome.gate).toBe('clear');
    const admitted = await service.iterationAssess({ planId: 'sample', jobId: job.jobId, base: first, candidate: repaired,
      kind: 'final', brief: 'Complete integration.', acceptance: ['The feature returns 2.'], requirementDocuments: [],
      planBaseline: baseline, previousAssessment: local.id, commandId: 'assess-final' });
    const final = await outcome(service, job.jobId, admitted.assessmentId);
    expect(final.gate).toBe('clear');
    expect(reviewBases).toEqual([baseline, baseline]);
    expect(dependencyReads).toHaveLength(2);
    expect(dependencyReads.every(text => text.includes('dependency = true'))).toBe(true);
  });
});
