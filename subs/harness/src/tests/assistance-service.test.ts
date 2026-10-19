import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AssistanceService } from '../assistance/service.js';
import { assistedAssessmentSchema, type AssistanceOptions, type AssistedProtection, type Assessor } from '../assistance/contracts.js';
import { reportCommand } from '../check-findings/report.js';
import { concern } from './helpers/check-findings.js';

const commit = 'a'.repeat(40);
const other = 'b'.repeat(40);
const protection: AssistedProtection = { baselineCommit: commit,
  rules: { explicitPaths: [], excludedPaths: [], guardedPaths: [], additions: 'protect' }, gaps: [], unavailable: null };
const roots: string[] = [];
const services: AssistanceService[] = [];

async function fixture(assessor?: Assessor, overrides: Partial<AssistanceOptions> = {}): Promise<{ root: string; open: () => Promise<AssistanceService> }> {
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
    resolveCommit: async (_root, revision) => revision === 'HEAD' ? commit : revision, currentHead: async () => commit, isCleanRepository: async () => true, ...(assessor === undefined ? {} : { assessor }), ...overrides };
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
    expect(first.finalization).toBeUndefined();
    expect(service.assessmentResult('sample', job.jobId, admitted.assessmentId)?.gate).toBe('action-required');
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

describe('native iteration records', () => {
  it('captures focus, broader assignments and honest Git provenance without assessment', async () => {
    const assessor = vi.fn<Assessor>();
    let head = commit, clean: boolean | Error = false;
    const { open } = await fixture(assessor, { currentHead: async () => head,
      resolveCommit: async (_root, revision) => revision === 'HEAD' ? head : commit,
      isCleanRepository: async () => { if (clean instanceof Error) throw clean; return clean; },
      now: () => new Date('2026-10-18T12:00:00Z') });
    const service = await open();
    const job = await service.planStart({ planId: 'sample', commandId: 'register' });
    const ids = { planId: 'sample', jobId: job.jobId };
    const focused = await service.iteration({ ...ids, action: 'start', brief: 'Implement freely', focusModule: 'subs/harness', commandId: 'focus' });
    expect(focused).toMatchObject({ base: commit, brief: 'Implement freely', focusModule: 'subs/harness', startedAt: '2026-10-18T12:00:00.000Z',
      provenance: { baseSource: 'head', requestedBase: null, checkoutHead: commit, checkoutHeadAfter: commit, cleanliness: 'dirty', cleanlinessError: null } });
    head = other; clean = new Error('status unavailable');
    const broad = await service.iteration({ ...ids, action: 'start', base: 'stable-tag', brief: 'Integrate owners', focusModule: null, commandId: 'broad' });
    expect(broad).toMatchObject({ base: commit, focusModule: null, provenance: { baseSource: 'explicit', requestedBase: 'stable-tag', checkoutHead: other,
      checkoutHeadAfter: other, cleanliness: 'unknown', cleanlinessError: 'status unavailable' } });
    expect(broad.id).not.toBe(focused.id);
    expect((await service.jobDetail('sample', job.jobId)).iterations).toEqual([
      { ...focused, status: 'started', assessmentIds: [] }, { ...broad, status: 'started', assessmentIds: [] },
    ]);
    expect(assessor).not.toHaveBeenCalled();
    await expect(service.iteration({ ...ids, action: 'start', brief: 'Bad focus', focusModule: '../outside', commandId: 'invalid-path' })).rejects.toThrow('project-relative');
  });

  it('replays starts before volatile Git observations, recovers their files, and conflicts on changed input', async () => {
    const head = vi.fn(async () => commit), clean = vi.fn(async () => true), resolve = vi.fn(async () => commit);
    let time = '2026-10-18T12:00:00Z';
    const { root, open } = await fixture(undefined, { currentHead: head, isCleanRepository: clean, resolveCommit: resolve, now: () => new Date(time) });
    let service = await open();
    const job = await service.planStart({ planId: 'sample', commandId: 'register' });
    const start = { planId: 'sample', jobId: job.jobId, action: 'start' as const, brief: 'Same outcome', focusModule: null, commandId: 'start-work' };
    const first = await service.iteration(start);
    await service.close(); services.splice(services.indexOf(service), 1);
    const path = join(root, 'plans', 'sample', '.harness', 'jobs', job.jobId, 'iterations', `${first.id}.json`);
    await rm(path);
    time = '2026-10-18T14:00:00Z'; head.mockRejectedValue(new Error('HEAD moved or disappeared')); clean.mockRejectedValue(new Error('unavailable')); resolve.mockRejectedValue(new Error('revision disappeared'));
    service = await open();
    expect(await service.iteration(start)).toEqual(first);
    expect(JSON.parse(await readFile(path, 'utf8'))).toEqual(first);
    expect(head).toHaveBeenCalledTimes(2); expect(clean).toHaveBeenCalledTimes(1); expect(resolve).toHaveBeenCalledTimes(1);
    await expect(service.iteration({ ...start, brief: 'Changed outcome' })).rejects.toThrow('different command');
    expect((await service.jobDetail('sample', job.jobId)).iterations).toHaveLength(1);
  });

  it('rejects invalid revisions and a moving default HEAD without registering invented source', async () => {
    const head = vi.fn<NonNullable<AssistanceOptions['currentHead']>>().mockResolvedValueOnce(commit).mockResolvedValueOnce(other);
    const resolve = vi.fn<NonNullable<AssistanceOptions['resolveCommit']>>().mockResolvedValueOnce(commit).mockRejectedValueOnce(new Error('unknown revision'));
    const { open } = await fixture(undefined, { currentHead: head, resolveCommit: resolve });
    const service = await open(); const job = await service.planStart({ planId: 'sample', commandId: 'register' });
    const start = { planId: 'sample', jobId: job.jobId, action: 'start' as const, brief: 'Outcome', focusModule: null, commandId: 'work' };
    await expect(service.iteration(start)).rejects.toThrow('changed during iteration start');
    await expect(service.iteration({ ...start, base: 'missing' })).rejects.toThrow('Cannot resolve iteration base: unknown revision');
    expect((await service.jobDetail('sample', job.jobId)).iterations).toEqual([]);
  });

  it('links cumulative repairs, retains start timing, and returns while assessment is held', async () => {
    let time = '2026-10-18T12:00:00Z';
    let release!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; });
    const assessor = vi.fn<Assessor>(async context => {
      expect(context.assessment.request).toMatchObject({ base: commit, brief: 'Original outcome', focusModule: 'subs/harness' });
      if (context.assessment.request.candidate === other) { await held; return { gate: 'action-required', summary: 'Repair needed', repairs: ['fix'], decisions: [], gaps: [], evidence: [] }; }
      return { gate: 'clear', summary: 'Repaired', repairs: [], decisions: [], gaps: [], evidence: [] };
    });
    const { root, open } = await fixture(assessor, { now: () => new Date(time) });
    let service = await open(); const job = await service.planStart({ planId: 'sample', commandId: 'register' });
    const ids = { planId: 'sample', jobId: job.jobId };
    const iteration = await service.iteration({ ...ids, action: 'start', brief: 'Original outcome', focusModule: 'subs/harness', commandId: 'work' });
    time = '2026-10-18T12:02:00Z';
    const end = { ...ids, action: 'end' as const, iterationId: iteration.id, candidate: other, commandId: 'candidate',
      acceptance: ['scenario-1'], requirementDocuments: [{ path: 'docs/requirement.md', revision: 'HEAD' }], additionalContext: 'Cross-module consumer changed' };
    const first = await service.iteration(end);
    await vi.waitFor(() => expect(assessor).toHaveBeenCalledTimes(1));
    expect(service.assessmentResult('sample', job.jobId, first.assessmentId)).toBeNull();
    expect(service.assessmentDetail('sample', job.jobId, first.assessmentId).completedAt).toBeUndefined();
    expect(service.assessmentDetail('sample', job.jobId, first.assessmentId).request).toMatchObject({ acceptance: ['scenario-1'],
      requirementDocuments: [{ path: 'docs/requirement.md', revision: commit }], additionalContext: 'Cross-module consumer changed' });
    time = '2026-10-18T12:03:00Z'; release();
    await vi.waitFor(() => expect(service.assessmentStatus('sample', job.jobId, first.assessmentId).status).toBe('completed'));
    const firstDetail = service.assessmentDetail('sample', job.jobId, first.assessmentId);
    expect(firstDetail).toMatchObject({ requestedAt: '2026-10-18T12:02:00.000Z', completedAt: '2026-10-18T12:03:00.000Z' });
    expect(Date.parse(firstDetail.requestedAt) - Date.parse(iteration.startedAt)).toBe(120_000);
    expect(Date.parse(firstDetail.completedAt!) - Date.parse(firstDetail.requestedAt)).toBe(60_000);
    time = '2026-10-18T12:04:00Z';
    const repair = await service.iteration({ ...end, commandId: 'repair', candidate: 'c'.repeat(40), previousAssessment: first.assessmentId });
    await vi.waitFor(() => expect(service.assessmentStatus('sample', job.jobId, repair.assessmentId).status).toBe('completed'));
    const repaired = service.assessmentDetail('sample', job.jobId, repair.assessmentId);
    expect(repaired.request).toMatchObject({ iterationId: iteration.id, base: commit, previousAssessment: first.assessmentId });
    expect(Date.parse(repaired.completedAt!) - Date.parse(iteration.startedAt)).toBe(240_000);
    await service.close(); services.splice(services.indexOf(service), 1);
    await rm(join(root, 'plans', 'sample', '.harness', 'jobs', job.jobId, 'assessments', first.assessmentId), { recursive: true });
    service = await open();
    expect(await service.iteration(end)).toMatchObject({ assessmentId: first.assessmentId });
    expect(service.assessmentDetail('sample', job.jobId, first.assessmentId)).toEqual(firstDetail);
    expect(assessor).toHaveBeenCalledTimes(2);
    expect((await service.jobDetail('sample', job.jobId)).iterations).toEqual([{ ...iteration, status: 'submitted', assessmentIds: [first.assessmentId, repair.assessmentId] }]);
    await expect(service.iteration({ ...end, candidate: commit })).rejects.toThrow('different command');
  });

  it('keeps overlapping iterations distinct and rejects wrong-job iteration references before launch', async () => {
    const assessor = vi.fn<Assessor>(async () => ({ gate: 'incomplete', summary: 'Unavailable', repairs: [], decisions: [], gaps: ['review'], evidence: [] }));
    const { open } = await fixture(assessor); const service = await open();
    const job = await service.planStart({ planId: 'sample', commandId: 'register' });
    const otherJob = await service.planStart({ planId: 'sample', commandId: 'register-other' });
    const start = { planId: 'sample', jobId: job.jobId, action: 'start' as const, brief: 'Outcome', focusModule: null };
    const a = await service.iteration({ ...start, commandId: 'a' }), b = await service.iteration({ ...start, commandId: 'b' });
    const end = { planId: 'sample', jobId: job.jobId, action: 'end' as const, iterationId: a.id, candidate: other, commandId: 'end', acceptance: [], requirementDocuments: [] };
    await expect(service.iteration({ ...end, jobId: otherJob.jobId })).rejects.toThrow('does not belong');
    await expect(service.iteration({ ...end, iterationId: `it-${'0'.repeat(36)}` })).rejects.toThrow('does not belong');
    expect(assessor).not.toHaveBeenCalled();
    const assessment = await service.iteration(end);
    await vi.waitFor(() => expect(service.assessmentDetail('sample', job.jobId, assessment.assessmentId).completedAt).toBeDefined());
    const detail = await service.jobDetail('sample', job.jobId);
    expect(detail.iterations.map(item => [item.id, item.assessmentIds])).toEqual([[a.id, [assessment.assessmentId]], [b.id, []]]);
    const legacy = await service.iterationAssess(request(job.jobId, 'legacy'));
    await vi.waitFor(() => expect(service.assessmentStatus('sample', job.jobId, legacy.assessmentId).status).toBe('completed'));
    const { completedAt: _completedAt, ...historical } = service.assessmentDetail('sample', job.jobId, legacy.assessmentId);
    expect(assistedAssessmentSchema.parse(historical).completedAt).toBeUndefined();
    expect(historical.request.iterationId).toBeUndefined(); expect(historical.request.focusModule).toBeUndefined();
    expect((await service.jobDetail('sample', job.jobId)).iterations).toHaveLength(2);
    await expect(service.iterationAssess({ ...request(job.jobId, 'bad-final'), kind: 'final', planBaseline: other })).rejects.toThrow('registered execution baseline');
  });

  it('retains clock inconsistencies rather than manufacturing positive elapsed intervals', async () => {
    let time = '2026-10-18T12:00:00Z';
    const { open } = await fixture(async () => {
      time = '2026-10-18T11:59:00Z';
      return { gate: 'clear', summary: 'Verified with clock adjustment', repairs: [], decisions: [], gaps: [], evidence: [] };
    }, { now: () => new Date(time) });
    const service = await open(); const job = await service.planStart({ planId: 'sample', commandId: 'register' });
    const ids = { planId: 'sample', jobId: job.jobId };
    const iteration = await service.iteration({ ...ids, action: 'start', brief: 'Root module work', focusModule: '.', commandId: 'work' });
    time = '2026-10-18T12:01:00Z';
    const admission = await service.iteration({ ...ids, action: 'end', iterationId: iteration.id, candidate: other, acceptance: [], requirementDocuments: [], commandId: 'end' });
    await vi.waitFor(() => expect(service.assessmentStatus('sample', job.jobId, admission.assessmentId).status).toBe('completed'));
    const result = service.assessmentDetail('sample', job.jobId, admission.assessmentId);
    expect(Date.parse(result.completedAt!) - Date.parse(result.requestedAt)).toBe(-120_000);
    expect(Date.parse(result.completedAt!) - Date.parse(iteration.startedAt)).toBe(-60_000);
    expect(await service.iteration({ ...ids, action: 'end', iterationId: iteration.id, candidate: other, acceptance: [], requirementDocuments: [], commandId: 'end' })).toMatchObject({ assessmentId: admission.assessmentId });
    expect(service.assessmentDetail('sample', job.jobId, admission.assessmentId).completedAt).toBe(result.completedAt);
  });

  it('preserves submission time and absent completion across interruption and explicit resume', async () => {
    let time = '2026-10-18T12:00:00Z', calls = 0;
    const { open } = await fixture(async context => {
      if (++calls === 1) {
        await context.checkpoint('audit', { passed: true });
        await new Promise<void>(resolve => context.signal.addEventListener('abort', () => resolve(), { once: true }));
      }
      return { gate: 'incomplete', summary: 'No review', repairs: [], decisions: [], gaps: ['review'], evidence: [] };
    }, { now: () => new Date(time) });
    let service = await open(); const job = await service.planStart({ planId: 'sample', commandId: 'register' });
    const ids = { planId: 'sample', jobId: job.jobId };
    const iteration = await service.iteration({ ...ids, action: 'start', brief: 'Work', focusModule: null, commandId: 'work' });
    time = '2026-10-18T12:01:00Z';
    const end = { ...ids, action: 'end' as const, iterationId: iteration.id, candidate: other, commandId: 'end', acceptance: [], requirementDocuments: [] };
    const admission = await service.iteration(end);
    await vi.waitFor(() => expect(service.assessmentStatus('sample', job.jobId, admission.assessmentId).stages).toEqual(['audit']));
    await service.close(); services.splice(services.indexOf(service), 1);
    service = await open(); time = '2026-10-18T12:10:00Z';
    expect(await service.iteration(end)).toMatchObject({ assessmentId: admission.assessmentId, status: 'interrupted' });
    expect(service.assessmentDetail('sample', job.jobId, admission.assessmentId).completedAt).toBeUndefined();
    expect(calls).toBe(1);
    await service.assessmentResume('sample', job.jobId, admission.assessmentId);
    await vi.waitFor(() => expect(service.assessmentStatus('sample', job.jobId, admission.assessmentId).status).toBe('completed'));
    expect(service.assessmentDetail('sample', job.jobId, admission.assessmentId)).toMatchObject({ requestedAt: '2026-10-18T12:01:00.000Z', completedAt: '2026-10-18T12:10:00.000Z' });
  });
});

/** Hold real assessment transitions while tests control completion and observer time. */
async function waitingAssessment() {
  let enter!: (context: Parameters<Assessor>[0]) => void;
  const entered = new Promise<Parameters<Assessor>[0]>(resolve => { enter = resolve; });
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  const { open } = await fixture(async context => {
    enter(context);
    await Promise.race([held, new Promise<void>(resolve => context.signal.addEventListener('abort', () => resolve(), { once: true }))]);
    return { gate: 'clear', summary: 'Verified', repairs: [], decisions: [], gaps: [], evidence: [] };
  });
  const service = await open();
  const job = await service.planStart({ planId: 'sample', commandId: 'start-wait' });
  const { assessmentId } = await service.iterationAssess(request(job.jobId));
  const context = await entered;
  const ids = ['sample', job.jobId, assessmentId] as const;
  return { service, context, ids, release };
}

describe('blocking assessment observation', () => {
  it('keeps default waiters asleep through stage progress and wakes all on completion', async () => {
    const { service, context, ids, release } = await waitingAssessment();
    const completed = vi.fn();
    const first = service.assessmentWait(...ids).then(result => { completed(); return result; });
    const second = service.assessmentWait(...ids);
    await context.checkpoint('audit', { passed: true });
    expect(completed).not.toHaveBeenCalled();
    release();
    for (const result of await Promise.all([first, second])) {
      expect(result).toMatchObject({ reason: 'settled', status: 'completed', stages: ['audit'] });
    }
    expect(await service.assessmentWait(...ids)).toMatchObject({ reason: 'settled', status: 'completed' });
  });

  it('allows progress observation and detects a revision that changed before subscription', async () => {
    const { service, context, ids, release } = await waitingAssessment();
    const before = service.assessmentStatus(...ids).revision;
    const progress = service.assessmentWait(...ids, { afterRevision: before });
    await context.checkpoint('audit', { passed: true });
    expect(await progress).toMatchObject({ reason: 'changed', status: 'running', revision: before + 1 });
    expect(await service.assessmentWait(...ids, { afterRevision: before })).toMatchObject({ reason: 'changed', revision: before + 1 });
    release();
    await service.assessmentWait(...ids);
  });

  it('returns current status at the 15-minute deadline without writing or cancelling', async () => {
    const { service, context, ids, release } = await waitingAssessment();
    const before = service.assessmentDetail(...ids);
    vi.useFakeTimers();
    try {
      const observed = vi.fn();
      const waiting = service.assessmentWait(...ids).then(result => { observed(); return result; });
      await vi.advanceTimersByTimeAsync(899_999);
      expect(observed).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      expect(await waiting).toEqual({ ...service.assessmentStatus(...ids), reason: 'timeout' });
      expect(service.assessmentDetail(...ids)).toEqual(before);
      expect(context.signal.aborted).toBe(false);
      expect(vi.getTimerCount()).toBe(0);
    } finally { vi.useRealTimers(); release(); }
    expect(await service.assessmentWait(...ids)).toMatchObject({ status: 'completed' });
  });

  it('aborts one observation without affecting other waiters or the assessment', async () => {
    const { service, context, ids, release } = await waitingAssessment();
    const controller = new AbortController();
    const waiting = service.assessmentWait(...ids, {}, controller.signal);
    const rejected = expect(waiting).rejects.toThrow('Stop observing');
    const other = service.assessmentWait(...ids);
    controller.abort(new Error('Stop observing'));
    await rejected;
    expect(context.signal.aborted).toBe(false);
    await expect(service.assessmentWait(...ids, {}, controller.signal)).rejects.toThrow('Stop observing');
    release();
    expect(await other).toMatchObject({ reason: 'settled', status: 'completed' });
  });

  it('wakes on explicit assessment cancellation', async () => {
    const { service, ids } = await waitingAssessment();
    const waiting = service.assessmentWait(...ids);
    await service.assessmentCancel(...ids);
    expect(await waiting).toMatchObject({ reason: 'settled', status: 'cancelled' });
  });

  it('wakes on assessment failure', async () => {
    let fail!: (error: Error) => void;
    const held = new Promise<never>((_resolve, reject) => { fail = reject; });
    let enter!: () => void;
    const entered = new Promise<void>(resolve => { enter = resolve; });
    const { open } = await fixture(async () => { enter(); return held; });
    const service = await open();
    const job = await service.planStart({ planId: 'sample', commandId: 'start-failure' });
    const { assessmentId } = await service.iterationAssess(request(job.jobId));
    const ids = ['sample', job.jobId, assessmentId] as const;
    const waiting = service.assessmentWait(...ids);
    await entered;
    fail(new Error('Provider failed'));
    expect(await waiting).toMatchObject({ reason: 'settled', status: 'interrupted', error: 'Provider failed' });
  });

  it('rejects outstanding observations on shutdown and preserves interrupted recovery', async () => {
    const { service, ids } = await waitingAssessment();
    const waiting = expect(service.assessmentWait(...ids)).rejects.toThrow('Assistance service closed');
    await service.close();
    await waiting;
    expect(service.assessmentStatus(...ids).status).toBe('interrupted');
    await expect(service.assessmentWait(...ids)).rejects.toThrow('Assistance service closed');
  });

  it('validates identities and bounded wait options without starting work', async () => {
    const { service, ids, release } = await waitingAssessment();
    for (const options of [{ timeoutMs: -1 }, { timeoutMs: 900_001 }, { timeoutMs: 0.5 }, { afterRevision: 0 }]) {
      await expect(service.assessmentWait(...ids, options)).rejects.toThrow();
    }
    await expect(service.assessmentWait(ids[0], ids[1], 'as-9999')).rejects.toThrow('does not belong');
    expect(await service.assessmentWait(...ids, { timeoutMs: 0 })).toMatchObject({ reason: 'timeout', status: 'running' });
    release();
    await service.assessmentWait(...ids);
  });
});
