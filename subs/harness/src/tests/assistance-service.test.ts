import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AssistanceService } from '../assistance/service.js';
import type { AssistanceOptions, AssistedProtection, Assessor } from '../assistance/contracts.js';
import { reportCommand } from '../check-findings/report.js';
import { concern } from './helpers/check-findings.js';

const commit = 'a'.repeat(40);
const other = 'b'.repeat(40);
const protection: AssistedProtection = { baselineCommit: commit,
  rules: { explicitPaths: [], excludedPaths: [], guardedPaths: [], additions: 'protect' }, gaps: [], unavailable: null };
const roots: string[] = [];
const services: AssistanceService[] = [];

async function fixture(assessor?: Assessor): Promise<{ root: string; open: () => Promise<AssistanceService> }> {
  const root = await mkdtemp(join(tmpdir(), 'assistance-service-'));
  roots.push(root);
  await mkdir(join(root, 'plans', 'sample'), { recursive: true });
  await writeFile(join(root, 'plans', 'sample', 'plan.md'), '# First plan\n');
  const options: AssistanceOptions = { projectRoot: root, registrationProtection: async (_project, _plan, policy) => ({
    ...protection, rules: { ...protection.rules,
      explicitPaths: [...(policy?.explicitPaths ?? protection.rules.explicitPaths)],
      excludedPaths: [...(policy?.excludedPaths ?? protection.rules.excludedPaths)],
      guardedPaths: [...(policy?.guardedPaths ?? protection.rules.guardedPaths)],
      additions: policy?.additions ?? protection.rules.additions },
  }),
    resolveCommit: async (_root, revision) => revision === 'HEAD' ? commit : revision, ...(assessor === undefined ? {} : { assessor }) };
  return { root, open: async () => { const service = await AssistanceService.open(options); services.push(service); return service; } };
}

afterEach(async () => {
  for (const service of services.splice(0)) await service.close();
  for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true });
});

const request = (jobId: string, commandId = 'assess-1') => ({ planId: 'sample', jobId, base: commit,
  candidate: other, kind: 'iteration' as const, brief: 'Implemented the first change.', acceptance: ['scenario-1'], requirementDocuments: [], commandId });

describe('assisted jobs and assessments', () => {
  it('captures a plan once, returns the original registration on retry after reopening, and discovers mixed kinds', async () => {
    const { root, open } = await fixture();
    let service = await open();
    const first = await service.planStart({ planId: 'sample', commandId: 'start-1' });
    expect(await readFile(join(root, 'plans', 'sample', '.harness', 'jobs', first.jobId, 'input', 'plan.md'), 'utf8')).toBe('# First plan\n');
    await writeFile(join(root, 'plans', 'sample', 'plan.md'), '# Changed later\n');
    await service.close();
    services.splice(services.indexOf(service), 1);
    await rm(join(root, 'plans', 'sample', '.harness', 'jobs', first.jobId, 'job.json'));
    service = await open();
    expect(await service.planStart({ planId: 'sample', commandId: 'start-1' })).toEqual(first);
    await expect(service.planStart({ planId: 'sample', commandId: 'start-1-extra' })).resolves.toMatchObject({ planId: 'sample' });
    await expect(service.planStart({ planId: 'other', commandId: 'start-1' })).rejects.toThrow('different command');
    const manual = join(root, 'plans', 'sample', '.harness', 'jobs', 'manual1');
    await mkdir(manual, { recursive: true });
    await writeFile(join(manual, 'job.json'), JSON.stringify({ kind: 'manual', planId: 'sample', jobId: 'manual1', createdAt: new Date().toISOString() }));
    expect((await service.listExecutions('sample')).map(item => item.kind).sort()).toEqual(['assisted', 'assisted', 'manual']);
    expect(service.assistedJob('sample', first.jobId).plan.sha256).toBe(first.planHash);
  });

  it('freezes registration protection choices and treats a changed policy under one command ID as a conflict', async () => {
    const { open } = await fixture();
    const service = await open();
    const policy = { explicitPaths: ['docs/requirements/'], excludedPaths: ['docs/drafts/'], additions: 'allow' as const };
    const first = await service.planStart({ planId: 'sample', commandId: 'start-policy', protection: policy });
    expect(service.assistedJob('sample', first.jobId).protection.rules).toMatchObject(policy);
    expect(await service.planStart({ planId: 'sample', commandId: 'start-policy', protection: policy })).toEqual(first);
    await expect(service.planStart({ planId: 'sample', commandId: 'start-policy',
      protection: { ...policy, additions: 'protect' } })).rejects.toThrow('different command');
  });

  it('retries assessment admission without another assessor call and keeps observation quiet', async () => {
    const assessor = vi.fn<Assessor>(async context => {
      await context.checkpoint('audit', { passed: true });
      return { gate: 'incomplete', summary: 'Reviews unavailable', repairs: [], decisions: [], gaps: ['reviews'], evidence: ['audit'] };
    });
    const { open } = await fixture(assessor);
    const service = await open();
    const job = await service.planStart({ planId: 'sample', commandId: 'start' });
    const admitted = await service.iterationAssess(request(job.jobId));
    await vi.waitFor(() => expect(service.assessmentStatus('sample', job.jobId, admitted.assessmentId).status).toBe('completed'));
    expect(await service.iterationAssess(request(job.jobId))).toMatchObject({ assessmentId: admitted.assessmentId });
    expect(assessor).toHaveBeenCalledTimes(1);
    expect(service.assessmentStatus('sample', job.jobId, admitted.assessmentId).stages).toEqual(['audit']);
    expect(service.assessmentResult('sample', job.jobId, admitted.assessmentId)?.gate).toBe('incomplete');
    await expect(service.iterationAssess({ ...request(job.jobId), candidate: commit })).rejects.toThrow('different command');
  });

  it('pins requirement document versions and rejects paths outside the project', async () => {
    const { open } = await fixture();
    const service = await open();
    const job = await service.planStart({ planId: 'sample', commandId: 'start' });
    const submitted = await service.iterationAssess({ ...request(job.jobId), requirementDocuments: [{ path: 'docs/requirements.md', revision: 'HEAD' }] });
    expect(service.assessmentDetail('sample', job.jobId, submitted.assessmentId).request.requirementDocuments).toEqual([{ path: 'docs/requirements.md', revision: commit }]);
    await expect(service.iterationAssess({ ...request(job.jobId, 'bad-document'), requirementDocuments: [{ path: '../other.md', revision: 'HEAD' }] })).rejects.toThrow('project-relative');
  });

  it('interrupts on server termination, resumes explicitly with retained stages, and rejects another job link', async () => {
    let calls = 0;
    const assessor: Assessor = async context => {
      calls += 1;
      if (calls === 1) {
        await context.checkpoint('audit', { passed: true });
        await new Promise<void>(resolve => context.signal.addEventListener('abort', () => resolve(), { once: true }));
        return { gate: 'incomplete', summary: 'Interrupted', repairs: [], decisions: [], gaps: ['review'], evidence: [] };
      }
      expect(context.stages().map(stage => stage.name)).toEqual(['audit']);
      return { gate: 'incomplete', summary: 'Review unavailable', repairs: [], decisions: [], gaps: ['review'], evidence: [] };
    };
    const { open } = await fixture(assessor);
    let service = await open();
    const job = await service.planStart({ planId: 'sample', commandId: 'start' });
    const otherJob = await service.planStart({ planId: 'sample', commandId: 'another-start' });
    const admitted = await service.iterationAssess(request(job.jobId));
    await vi.waitFor(() => expect(service.assessmentStatus('sample', job.jobId, admitted.assessmentId).stages).toEqual(['audit']));
    await service.close();
    services.splice(services.indexOf(service), 1);
    service = await open();
    expect(service.assessmentStatus('sample', job.jobId, admitted.assessmentId).status).toBe('interrupted');
    expect(calls).toBe(1);
    await expect(service.iterationAssess({ ...request(otherJob.jobId, 'other-assess'), previousAssessment: admitted.assessmentId })).rejects.toThrow('does not belong');
    await service.assessmentResume('sample', job.jobId, admitted.assessmentId);
    await vi.waitFor(() => expect(service.assessmentStatus('sample', job.jobId, admitted.assessmentId).status).toBe('completed'));
    expect(calls).toBe(2);
  });

  it('keeps findings in their execution and replays a stable finding operation once', async () => {
    const assessor: Assessor = async context => {
      if (context.job.planId === 'sample' && context.assessment.request.brief === 'with finding') {
        const command = reportCommand({ ...concern({ tree: context.assessment.request.candidate }), owner: { kind: 'run' } });
        await context.recordFindings([command], 'review:one');
        await context.recordFindings([command], 'review:one');
      }
      return { gate: 'incomplete', summary: `${context.findingState().findings.size} findings`, repairs: [], decisions: [], gaps: ['audit'], evidence: [] };
    };
    const { open } = await fixture(assessor);
    const service = await open();
    const first = await service.planStart({ planId: 'sample', commandId: 'start-1' });
    const second = await service.planStart({ planId: 'sample', commandId: 'start-2' });
    const a = await service.iterationAssess({ ...request(first.jobId, 'assess-a'), brief: 'with finding' });
    const b = await service.iterationAssess({ ...request(second.jobId, 'assess-b'), brief: 'without finding' });
    await vi.waitFor(() => {
      expect(service.assessmentStatus('sample', first.jobId, a.assessmentId).status).toBe('completed');
      expect(service.assessmentStatus('sample', second.jobId, b.assessmentId).status).toBe('completed');
    });
    expect(service.assessmentResult('sample', first.jobId, a.assessmentId)?.summary).toBe('1 findings');
    expect(service.assessmentResult('sample', second.jobId, b.assessmentId)?.summary).toBe('0 findings');
  });

  it('records an authorized user answer once against retained assessment evidence', async () => {
    const assessor: Assessor = async context => {
      await context.checkpoint('protection', { candidateCommit: context.assessment.request.candidate, violations: ['plan.md'] });
      const evidence = { kind: 'assessment-stage', ref: `assessments/${context.assessment.id}/stages/protection.json`, hash: null };
      const report = reportCommand({ ...concern({ tree: context.assessment.request.candidate }), owner: { kind: 'run' },
        observation: { kind: 'review-concern', summary: 'Protected file changed', evidence: [evidence], locations: [] } });
      await context.recordFindings([report], 'protection:report');
      await context.recordFindings([{ type: 'dispose', checkFinding: 'cf-0001', expectedRevision: 1, decision: {
        actor: { kind: 'agent', role: 'reconciler', invocation: 'assessment-1' }, source: { kind: 'tree', id: context.assessment.request.candidate },
        rationale: 'The protected change needs an authorized choice', evidence: [evidence], communication: { mode: 'quiet' },
        decision: { action: 'request-user-decision', authority: { kind: 'governing-record', ref: 'plan.md' },
          conflicts: [{ text: 'Protected requirement changed', document: 'plan.md', revision: 'base' }],
          options: [{ id: 'accept-exact-change', summary: 'Accept exact change', consequence: 'This candidate may retain it' },
            { id: 'restore', summary: 'Restore file', consequence: 'Worker repairs candidate' }] },
      } }], 'protection:choice');
      return { gate: 'action-required', summary: 'Protected change needs decision', repairs: [], decisions: ['cf-0001'], gaps: [], evidence: [evidence.ref] };
    };
    const { root, open } = await fixture(assessor);
    const service = await open();
    const job = await service.planStart({ planId: 'sample', commandId: 'start' });
    const admitted = await service.iterationAssess(request(job.jobId));
    await vi.waitFor(() => expect(service.assessmentStatus('sample', job.jobId, admitted.assessmentId).status).toBe('completed'));
    const path = join(root, 'plans', 'sample', '.harness', 'jobs', job.jobId, 'assessments', admitted.assessmentId, 'stages', 'protection.json');
    expect(JSON.parse(await readFile(path, 'utf8'))).toMatchObject({ candidateCommit: other });
    const answer = { planId: 'sample', jobId: job.jobId, assessmentId: admitted.assessmentId,
      checkFinding: 'cf-0001', request: 'cfd-0001', option: 'accept-exact-change', userName: 'Owner', authority: 'decision-42', commandId: 'answer-1' };
    const first = await service.findingAnswer(answer);
    expect(await service.findingAnswer(answer)).toEqual(first);
    expect(service.findings('sample', job.jobId)[0]?.reason).toBe('user-decision-answered');
    await expect(service.findingAnswer({ ...answer, commandId: 'answer-2', option: 'restore' })).rejects.toThrow('does not await');
  });

  it('holds the project lock until an aborted assessor drains and persists interruption', async () => {
    let entered!: () => void;
    let release!: () => void;
    const started = new Promise<void>(resolve => { entered = resolve; });
    const drain = new Promise<void>(resolve => { release = resolve; });
    const { open } = await fixture(async () => {
      entered();
      await drain;
      return { gate: 'incomplete', summary: 'Stopped', repairs: [], decisions: [], gaps: ['review'], evidence: [] };
    });
    const service = await open();
    const job = await service.planStart({ planId: 'sample', commandId: 'start' });
    const admitted = await service.iterationAssess(request(job.jobId));
    await started;
    const closing = service.close();
    await expect(open()).rejects.toThrow('holds the project lock');
    release();
    await closing;
    services.splice(services.indexOf(service), 1);
    const reopened = await open();
    expect(reopened.assessmentStatus('sample', job.jobId, admitted.assessmentId).status).toBe('interrupted');
  });

  it('accepts only an exact protected change through one receipted user choice', async () => {
    const assessor: Assessor = async context => {
      const stage = { baselineCommit: commit, candidateCommit: context.assessment.request.candidate,
        changes: [{ path: 'plan.md', status: 'M', before: { kind: 'file', objectId: '1'.repeat(40) }, after: { kind: 'file', objectId: '2'.repeat(40) }, authorizedBy: null }],
        violations: [{ path: 'plan.md', status: 'M', before: { kind: 'file', objectId: '1'.repeat(40) }, after: { kind: 'file', objectId: '2'.repeat(40) }, authorizedBy: null }] };
      await context.checkpoint('protection', stage);
      await context.recordFindings([reportCommand({ producer: 'check:protection', attempt: context.assessment.id,
        reportKey: 'protected:plan.md', owner: { kind: 'run' }, source: { kind: 'tree', id: context.assessment.request.candidate },
        issueKey: 'protected:plan.md', verification: { kind: 'check', producer: 'check:protection',
          obligation: { subject: 'protected:plan.md', revision: 1 }, selection: 'rules-v1', required: true },
        observation: { kind: 'check-failed', summary: 'Protected file changed',
          evidence: [{ kind: 'assessment-stage', ref: `assessments/${context.assessment.id}/stages/protection.json`, hash: null }], locations: [] },
        judgment: null, suggests: null, credibility: 'objective', modules: [] })], 'protection-report');
      return { gate: 'action-required', summary: 'Protected change', repairs: [], decisions: ['plan.md'], gaps: [], evidence: [] };
    };
    const { open } = await fixture(assessor);
    let service = await open();
    const job = await service.planStart({ planId: 'sample', commandId: 'start' });
    const admitted = await service.iterationAssess(request(job.jobId));
    await vi.waitFor(() => expect(service.assessmentStatus('sample', job.jobId, admitted.assessmentId).status).toBe('completed'));
    const input = { planId: 'sample', jobId: job.jobId, assessmentId: admitted.assessmentId,
      path: 'plan.md', userName: 'Owner', authority: 'decision-42', commandId: 'protection-accept-1' };
    await expect(service.protectionAccept({ ...input, path: 'other.md' })).rejects.toThrow('does not report');
    const first = await service.protectionAccept(input);
    expect(first).toMatchObject({ path: 'plan.md', checkFinding: 'cf-0001', request: 'cfd-0001', option: 'accept-exact-change' });
    expect(await service.protectionAccept(input)).toEqual(first);
    expect(service.findings('sample', job.jobId)[0]?.reason).toBe('user-decision-answered');
    await service.close();
    services.splice(services.indexOf(service), 1);
    service = await open();
    expect(await service.protectionAccept(input)).toEqual(first);
    await expect(service.protectionAccept({ ...input, authority: 'another-record' })).rejects.toThrow('different command');
  });
});
