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
    resolveCommit: async (_root, revision) => revision, ...(assessor ? { assessor } : {}) };
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
    expect(await call('assessment_status', { plan_id: 'sample', job_id: started.jobId, assessment_id: secondAssessment.assessmentId })).toMatchObject({ status: 'completed' });
  });
});
