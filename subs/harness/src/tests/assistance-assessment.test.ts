import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { SessionOperations } from '../../subs/agent/src/interfaces/session-operations.js';
import type { ConfiguredAuditResult } from '../../subs/audit/src/check-execution.js';
import { scriptedCandidates, type ScriptedCommit } from './helpers/candidates.js';
import { AssistanceService } from '../assistance/service.js';
import { createAssessor, type AssessmentDependencies } from '../assistance/assessment.js';
import type { AssistedProtection } from '../assistance/contracts.js';

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

const reviewReport = (candidate: string, concern = false) => ({
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
        expect(input.prepared.message).toContain('baseline:quality.principles.md');
        expect(input.prepared.message).not.toContain(principle);
        expect(input.prepared.message).toContain(pinned);
        const tool = input.prepared.tools.definitions.find(tool => tool.name === 'assessment_evidence')!;
        const stages = JSON.parse((await tool.execute({ ref: 'assessments/as-0001/stages/documents.json' }, new AbortController().signal)).text) as { content: string };
        expect(JSON.parse(stages.content)).toMatchObject({ storage: 'git-references' });
        for (const [path, text] of [['plans/sample/plan.md', planMarkdown], ['docs/companion.md', companion], ['quality.principles.md', principle]]) {
          const first = JSON.parse((await tool.execute({ ref: `baseline:${path}`, limit: 8 }, new AbortController().signal)).text) as { content: string; nextOffset: number };
          const rest = JSON.parse((await tool.execute({ ref: `baseline:${path}`, offset: first.nextOffset }, new AbortController().signal)).text) as { content: string; nextOffset: null };
          expect(rest.nextOffset).toBeNull();
          expect(JSON.parse(first.content + rest.content).text).toBe(text);
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

  it('returns incomplete with a required review gap while retaining a material audit repair', async () => {
    const { assess } = await setup({ [baseline]: source('0', baseline), [first]: source('1', baseline) }, {
      operations: unusedOperations, audit: async input => audit(input.candidateCommit, 'failed'),
      review: async input => ({ status: 'incomplete', reason: 'Pi stopped before a valid report', operationId: input.operationId, eventCount: 1 }),
    });
    const result = await assess(first, baseline, 'assess-missing');
    expect(result.outcome.gate).toBe('incomplete');
    expect(result.outcome.gaps.join(' ')).toContain('Required review unavailable');
    expect(result.outcome.repairs.join(' ')).toContain('configured audit failed');
  });

  it.each([false, true])('retains unavailable linked evidence for semantic applicability (required: %s)', async required => {
    const baselineSource = { ...source('0', baseline), files: { ...source('0', baseline).files,
      'docs/context.md': '[Historical evidence](/archive/result.json) [Local history](missing.md) [Binary evidence](payload.bundle)', 'docs/payload.bundle': '\uFFFD' } };
    const { service, job, assess, candidates } = await setup({ [baseline]: baselineSource, [first]: source('2', baseline) }, {
      operations: unusedOperations, audit: async input => audit(input.candidateCommit),
      review: async input => {
        expect(input.prepared.message).toContain('/archive/result.json');
        expect(input.prepared.message).toContain('docs/missing.md');
        expect(input.prepared.message).toContain('docs/payload.bundle');
        expect(input.prepared.message).toContain('ambiguous replacement characters without Git blob identity');
        expect(input.prepared.message).toContain('not automatically additional obligations');
        expect(input.prepared.message).toContain('mark the affected requirement uncertain');
        expect(input.prepared.message).toContain('Outside-project targets were not read and must not be accessed');
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
    expect(evidence).toMatchObject({ gaps: { outsideProject: [{ target: '/archive/result.json', judgment: 'unjudged' }], missing: [{ target: 'docs/missing.md' }], unreadableDocuments: [{ path: 'docs/payload.bundle', judgment: 'unjudged' }] } });
  });

  it('keeps an explicitly pinned unreadable document as a required gap despite a submitted review', async () => {
    const { assess } = await setup({ [baseline]: source('0', baseline), [first]: source('2', baseline) }, {
      operations: unusedOperations, audit: async input => audit(input.candidateCommit),
      review: async input => {
        const validated = input.prepared.validate(reviewReport(input.candidate));
        if (!validated.ok) throw new Error(JSON.stringify(validated.errors));
        return { status: 'submitted', value: validated.value, operationId: input.operationId, sessionId: 'pinned-document-review', eventCount: 1 };
      },
    });
    const result = await assess(first, baseline, 'assess-pinned', { requirementDocuments: [{ path: 'docs/required.md', revision: baseline }] });
    expect(result.outcome.gate).toBe('incomplete');
    expect(result.outcome.gaps.join(' ')).toContain('Required document docs/required.md');
  });

  it('keeps an explicitly pinned binary requirement unavailable rather than accepting decoded text', async () => {
    const initial = { ...source('0', baseline), files: { ...source('0', baseline).files, 'docs/required.md': 'header\0payload' } };
    const { assess } = await setup({ [baseline]: initial, [first]: source('2', baseline) }, {
      operations: unusedOperations, audit: async input => audit(input.candidateCommit),
      review: async input => {
        expect(input.prepared.message).not.toContain('header\0payload');
        const validated = input.prepared.validate(reviewReport(input.candidate));
        if (!validated.ok) throw new Error(JSON.stringify(validated.errors));
        return { status: 'submitted', value: validated.value, operationId: input.operationId, sessionId: 'binary-pinned-review', eventCount: 1 };
      },
    });
    const result = await assess(first, baseline, 'assess-binary-pinned', { requirementDocuments: [{ path: 'docs/required.md', revision: baseline }] });
    expect(result.outcome.gate).toBe('incomplete');
    expect(result.outcome.gaps.join(' ')).toContain('Required document docs/required.md');
    expect(result.outcome.gaps.join(' ')).toContain('binary NUL bytes');
  });

  it('keeps unreadable principles deterministic even when the review otherwise reports clear', async () => {
    const initial = { ...source('0', baseline), files: { ...source('0', baseline).files, 'quality.principles.md': '# Quality' } };
    const { assess, candidates } = await setup({ [baseline]: initial, [first]: source('2', baseline) }, {
      operations: unusedOperations, audit: async input => audit(input.candidateCommit),
      review: async input => {
        const validated = input.prepared.validate(reviewReport(input.candidate));
        if (!validated.ok) throw new Error(JSON.stringify(validated.errors));
        return { status: 'submitted', value: validated.value, operationId: input.operationId, sessionId: 'unreadable-principle-review', eventCount: 1 };
      },
    });
    candidates.fail('readBlob', baseline);
    const result = await assess(first, baseline, 'assess-unreadable-principle');
    expect(result.outcome.gate).toBe('incomplete');
    expect(result.outcome.gaps.join(' ')).toContain('Principle evidence quality.principles.md is unavailable');
  });

  it('retains twenty material concerns and gates unfinished review coverage as incomplete', async () => {
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
    expect(result.outcome.gaps.join(' ')).toContain('Further behavior remains unassessed after twenty concerns.');
    expect(result.outcome.repairs.filter(repair => repair.includes('Material behavior'))).toHaveLength(20);
    expect(result.outcome.repairs.join(' ')).toContain('Material behavior 20 is incorrect');
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
