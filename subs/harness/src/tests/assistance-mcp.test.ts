import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Client, InMemoryTransport } from '@modelcontextprotocol/client';
import { AssistanceService } from '../assistance/service.js';
import { createAssistanceMcpServer } from '../assistance/mcp.js';
import type { AssistanceOptions, AssistedProtection } from '../assistance/contracts.js';

const baseline = 'a'.repeat(40), candidate = 'b'.repeat(40);
const protection: AssistedProtection = { baselineCommit: baseline,
  rules: { explicitPaths: [], excludedPaths: [], guardedPaths: [], additions: 'protect' }, gaps: [], unavailable: null };
const roots: string[] = [], services: AssistanceService[] = [], connections: Array<{ client: Client; server: ReturnType<typeof createAssistanceMcpServer> }> = [];

async function fixture(assessor?: AssistanceOptions['assessor']) {
  const root = await mkdtemp(join(tmpdir(), 'assistance-mcp-')); roots.push(root);
  await mkdir(join(root, 'plans', 'sample'), { recursive: true });
  await writeFile(join(root, 'plans', 'sample', 'plan.md'), '# Protocol fixture\n');
  const options: AssistanceOptions = { projectRoot: root, registrationProtection: async () => protection,
    resolveCommit: async (_root, revision) => revision === 'HEAD' ? baseline : revision, currentHead: async () => baseline, isCleanRepository: async () => true, ...(assessor ? { assessor } : {}) };
  const open = async () => { const service = await AssistanceService.open(options); services.push(service); return service; };
  return { root, open };
}

async function connect(service: AssistanceService) {
  const server = createAssistanceMcpServer(service);
  const client = new Client({ name: 'assistance-protocol-test', version: '1.0.0' });
  const [clientSide, serverSide] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverSide), client.connect(clientSide)]);
  connections.push({ client, server });
  const call = async (name: string, args: Record<string, unknown>) => {
    const result = await client.callTool({ name, arguments: args });
    if (result.isError) throw new Error(result.content.map(item => item.type === 'text' ? item.text : '').join('\n'));
    return (result.structuredContent as { result: unknown }).result;
  };
  return { client, server, call };
}

afterEach(async () => {
  for (const { client, server } of connections.splice(0).reverse()) { await client.close(); await server.close(); }
  for (const service of services.splice(0).reverse()) await service.close();
  for (const root of roots.splice(0).reverse()) await rm(root, { recursive: true, force: true });
});

describe('official MCP client over linked transport', () => {
  it('waits through MCP, keeps other calls available, and cancels observation independently', async () => {
    let release!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; });
    const { open } = await fixture(async context => {
      await Promise.race([held, new Promise<void>(resolve => context.signal.addEventListener('abort', () => resolve(), { once: true }))]);
      return { gate: 'clear', summary: 'Verified', repairs: [], decisions: [], gaps: [], evidence: [] };
    });
    const service = await open();
    const { client, call } = await connect(service);
    const job = await call('plan_start', { plan_id: 'sample', command_id: 'start-wait' }) as { jobId: string };
    const submitted = await call('iteration_assess', { plan_id: 'sample', job_id: job.jobId, base: baseline, candidate,
      brief: 'Held assessment', command_id: 'assess-wait' }) as { assessmentId: string };
    const ids = { plan_id: 'sample', job_id: job.jobId, assessment_id: submitted.assessmentId };
    const observe = vi.spyOn(service, 'assessmentWait');
    const controller = new AbortController();
    const waiting = client.callTool({ name: 'assessment_wait', arguments: ids }, { signal: controller.signal, timeout: 930_000 });
    const rejected = expect(waiting).rejects.toThrow();
    await vi.waitFor(() => expect(observe).toHaveBeenCalledTimes(1));
    const signal = observe.mock.calls[0]![4]!;
    expect(signal.aborted).toBe(false);
    expect(await call('assessment_status', ids)).toMatchObject({ status: 'running' });
    controller.abort();
    await rejected;
    await vi.waitFor(() => expect(signal.aborted).toBe(true));
    expect(await call('assessment_status', ids)).toMatchObject({ status: 'running' });
    expect(await call('assessment_wait', { ...ids, timeout_ms: 0 })).toMatchObject({ reason: 'timeout', status: 'running' });
    await expect(call('assessment_wait', { ...ids, timeout_ms: 900_001 })).rejects.toThrow();
    const completed = call('assessment_wait', ids);
    release();
    expect(await completed).toMatchObject({ reason: 'settled', status: 'completed' });
    expect(await call('assessment_result', ids)).toMatchObject({ gate: 'clear' });
  });

  it('initializes, discovers tools, registers once, observes a result and reconnects to the same job', async () => {
    let assessments = 0;
    const { open } = await fixture(async () => { assessments++; return { gate: 'incomplete', summary: 'Review unavailable', repairs: [], decisions: [], gaps: ['review'], evidence: [] }; });
    const service = await open();
    const { client, server, call } = await connect(service);
    const tools = (await client.listTools()).tools.map(tool => tool.name);
    expect(tools).toEqual(expect.arrayContaining(['plan_start', 'job_detail', 'iteration_assess', 'assessment_status', 'assessment_result', 'assessment_cancel']));
    const started = await call('plan_start', { plan_id: 'sample', execution: 'assisted', command_id: 'start-1' }) as { planId: string; jobId: string };
    expect(await call('plan_start', { plan_id: 'sample', execution: 'assisted', command_id: 'start-1' })).toMatchObject(started);
    expect(await call('job_detail', { plan_id: 'sample', job_id: started.jobId })).toMatchObject({ job: { jobId: started.jobId }, planMarkdown: '# Protocol fixture\n' });
    const admitted = await call('iteration_assess', { plan_id: 'sample', job_id: started.jobId, base: baseline, candidate,
      brief: 'One bounded change.', acceptance: ['It works.'], command_id: 'assess-1' }) as { assessmentId: string };
    expect(await call('iteration_assess', { plan_id: 'sample', job_id: started.jobId, base: baseline, candidate,
      brief: 'One bounded change.', acceptance: ['It works.'], command_id: 'assess-1' })).toMatchObject({ assessmentId: admitted.assessmentId });
    await vi.waitFor(async () => expect(await call('assessment_status', { plan_id: 'sample', job_id: started.jobId,
      assessment_id: admitted.assessmentId })).toMatchObject({ status: 'completed' }));
    expect(await call('assessment_result', { plan_id: 'sample', job_id: started.jobId, assessment_id: admitted.assessmentId })).toMatchObject({ gate: 'incomplete' });
    const executions = await call('plan_executions', { plan_id: 'sample' }) as Array<{ jobId: string }>;
    expect(executions.map(item => item.jobId)).toContain(started.jobId);
    await client.close(); await server.close(); connections.pop();
    const second = await connect(service);
    expect(await second.call('plan_start', { plan_id: 'sample', execution: 'assisted', command_id: 'start-1' })).toMatchObject(started);
    expect(await second.call('assessment_result', { plan_id: 'sample', job_id: started.jobId, assessment_id: admitted.assessmentId })).toMatchObject({ gate: 'incomplete' });
    expect(assessments).toBe(1);
  });

  it('cancels only the named assessment while another assessment completes', async () => {
    let entered!: () => void;
    const firstEntered = new Promise<void>(resolve => { entered = resolve; });
    const { open } = await fixture(async context => {
      if (context.assessment.request.brief === 'hold') {
        entered();
        await new Promise<void>(resolve => context.signal.addEventListener('abort', () => resolve(), { once: true }));
        return { gate: 'incomplete', summary: 'Cancelled', repairs: [], decisions: [], gaps: ['cancelled'], evidence: [] };
      }
      return { gate: 'incomplete', summary: 'Independent assessment', repairs: [], decisions: [], gaps: ['review'], evidence: [] };
    });
    const service = await open(); const { call } = await connect(service);
    const started = await call('plan_start', { plan_id: 'sample', command_id: 'start-2' }) as { jobId: string };
    const args = { plan_id: 'sample', job_id: started.jobId, base: baseline, candidate, acceptance: [], kind: 'iteration' };
    const firstAssessment = await call('iteration_assess', { ...args, brief: 'hold', command_id: 'assess-hold' }) as { assessmentId: string };
    await firstEntered;
    const secondAssessment = await call('iteration_assess', { ...args, brief: 'finish', command_id: 'assess-finish' }) as { assessmentId: string };
    await vi.waitFor(async () => expect(await call('assessment_status', { plan_id: 'sample', job_id: started.jobId,
      assessment_id: secondAssessment.assessmentId })).toMatchObject({ status: 'completed' }));
    expect(await call('assessment_cancel', { plan_id: 'sample', job_id: started.jobId, assessment_id: firstAssessment.assessmentId })).toMatchObject({ status: 'cancelled' });
    expect(await call('assessment_detail', { plan_id: 'sample', job_id: started.jobId, assessment_id: firstAssessment.assessmentId })).not.toHaveProperty('completedAt');
    expect(await call('assessment_status', { plan_id: 'sample', job_id: started.jobId, assessment_id: secondAssessment.assessmentId })).toMatchObject({ status: 'completed' });
  });
  it('starts focused and broader work, ends and repairs through the same tool, and retrieves retained identities', async () => {
    let release!: () => void;
    const held = new Promise<void>(resolve => { release = resolve; });
    const contexts: Array<Record<string, unknown>> = [];
    const { open } = await fixture(async context => {
      contexts.push(context.assessment.request);
      await held;
      return { gate: 'clear', summary: 'Candidate verified', repairs: [], decisions: [], gaps: [], evidence: [] };
    });
    const service = await open(); const { client, call } = await connect(service);
    const tool = (await client.listTools()).tools.find(item => item.name === 'iteration');
    expect(tool).toBeDefined();
    const job = await call('plan_start', { plan_id: 'sample', command_id: 'register' }) as { jobId: string };
    const ids = { plan_id: 'sample', job_id: job.jobId };
    const start = { ...ids, action: 'start', brief: 'Keep the original outcome', focus_module: 'subs/harness', command_id: 'work' };
    const iteration = await call('iteration', start) as { id: string; startedAt: string; base: string };
    expect(iteration).toMatchObject({ base: baseline, focusModule: 'subs/harness', brief: 'Keep the original outcome', provenance: { cleanliness: 'clean' } });
    expect(await call('iteration', start)).toEqual(iteration);
    const broader = await call('iteration', { ...start, command_id: 'broader', focus_module: null }) as { id: string };
    expect(broader).toMatchObject({ focusModule: null }); expect(broader.id).not.toBe(iteration.id);
    expect(contexts).toEqual([]);
    await expect(call('iteration', { ...start, brief: 'Replaced' })).rejects.toThrow('different command');
    await expect(call('iteration', { ...ids, action: 'start', brief: 'Missing explicit focus', command_id: 'bad-start' })).rejects.toThrow();
    const end = { ...ids, action: 'end', iteration_id: iteration.id, candidate, command_id: 'candidate',
      acceptance: ['scenario-1'], requirement_documents: [{ path: 'docs/spec.md', revision: 'HEAD' }], additional_context: 'Includes another owner' };
    const first = await call('iteration', end) as { assessmentId: string };
    expect(await call('iteration', end)).toMatchObject({ assessmentId: first.assessmentId });
    await vi.waitFor(() => expect(contexts).toHaveLength(1));
    expect(contexts[0]).toMatchObject({ base: baseline, candidate, brief: start.brief, iterationId: iteration.id, focusModule: 'subs/harness',
      additionalContext: 'Includes another owner', acceptance: ['scenario-1'], requirementDocuments: [{ path: 'docs/spec.md', revision: baseline }] });
    expect(await call('assessment_result', { ...ids, assessment_id: first.assessmentId })).toBeNull();
    await expect(call('iteration', { ...end, command_id: 'overwrite', brief: 'Overwrite original' })).rejects.toThrow();
    release();
    await vi.waitFor(async () => expect(await call('assessment_detail', { ...ids, assessment_id: first.assessmentId })).toMatchObject({ status: 'completed', completedAt: expect.any(String) }));
    const repair = await call('iteration', { ...end, command_id: 'repair', candidate: 'c'.repeat(40), previous_assessment: first.assessmentId }) as { assessmentId: string };
    expect(repair.assessmentId).not.toBe(first.assessmentId);
    expect(await call('job_detail', ids)).toMatchObject({ iterations: [
      { id: iteration.id, status: 'submitted', assessmentIds: [first.assessmentId, repair.assessmentId], startedAt: iteration.startedAt },
      { id: broader.id, status: 'started', assessmentIds: [] },
    ] });
  });

});
