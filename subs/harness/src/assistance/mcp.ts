import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod';
import type { AssistanceService } from './service.js';

/** Thin MCP transport. Every operation delegates to the harness-owned service. */
export function createAssistanceMcpServer(service: AssistanceService): McpServer {
  const server = new McpServer({ name: 'ramify-agent-assistance', version: '1.0.0' });
  const answer = async (operation: () => Promise<unknown> | unknown) => {
    try {
      const value = await operation();
      return { content: [{ type: 'text' as const, text: JSON.stringify(value) }], structuredContent: { result: value } };
    } catch (error) {
      const kind = error instanceof Error ? error.name : 'Error';
      const message = error instanceof Error ? error.message : String(error);
      return { isError: true, content: [{ type: 'text' as const, text: `${kind}: ${message}` }] };
    }
  };
  const ids = { plan_id: z.string(), job_id: z.string() };
  const assessmentId = { ...ids, assessment_id: z.string() };
  server.registerTool('plan_start', { description: 'Register a new assisted execution for plans/<plan-id>/plan.md.',
    inputSchema: z.object({ plan_id: z.string(), execution: z.literal('assisted').default('assisted'), command_id: z.string(),
      protection: z.object({ explicit_paths: z.array(z.string()).optional(), excluded_paths: z.array(z.string()).optional(),
        guarded_paths: z.array(z.string()).optional(), additions: z.enum(['protect', 'allow']).optional() }).optional() }) },
  args => answer(() => service.planStart({ planId: args.plan_id, commandId: args.command_id,
    ...(args.protection === undefined ? {} : { protection: {
      ...(args.protection.explicit_paths === undefined ? {} : { explicitPaths: args.protection.explicit_paths }),
      ...(args.protection.excluded_paths === undefined ? {} : { excludedPaths: args.protection.excluded_paths }),
      ...(args.protection.guarded_paths === undefined ? {} : { guardedPaths: args.protection.guarded_paths }),
      ...(args.protection.additions === undefined ? {} : { additions: args.protection.additions }),
    } }) })));
  server.registerTool('plan_executions', { description: 'List implementation, manual and assisted executions for a plan.',
    inputSchema: z.object({ plan_id: z.string().optional() }) },
  args => answer(() => service.listExecutions(args.plan_id)));
  server.registerTool('job_detail', { description: 'Read the captured plan and registration baseline, protected paths and setup gaps.',
    inputSchema: z.object(ids) },
  args => answer(() => service.jobDetail(args.plan_id, args.job_id)));
  const iterationIds = { ...ids, command_id: z.string() };
  server.registerTool('iteration', { description: 'Record native work starting, or submit a committed candidate for assessment. Focus is advisory; repairs reuse the iteration ID.',
    inputSchema: z.discriminatedUnion('action', [
      z.object({ ...iterationIds, action: z.literal('start'), brief: z.string(), focus_module: z.string().nullable(), base: z.string().optional() }).strict(),
      z.object({ ...iterationIds, action: z.literal('end'), iteration_id: z.string(), candidate: z.string(),
        acceptance: z.array(z.string()).default([]), requirement_documents: z.array(z.object({ path: z.string(), revision: z.string() })).default([]),
        previous_assessment: z.string().optional(), additional_context: z.string().optional() }).strict(),
    ]) },
  args => answer(() => service.iteration(args.action === 'start'
    ? { planId: args.plan_id, jobId: args.job_id, commandId: args.command_id, action: 'start', brief: args.brief,
      focusModule: args.focus_module, ...(args.base === undefined ? {} : { base: args.base }) }
    : { planId: args.plan_id, jobId: args.job_id, commandId: args.command_id, action: 'end', iterationId: args.iteration_id,
      candidate: args.candidate, acceptance: args.acceptance, requirementDocuments: args.requirement_documents,
      ...(args.previous_assessment === undefined ? {} : { previousAssessment: args.previous_assessment }),
      ...(args.additional_context === undefined ? {} : { additionalContext: args.additional_context }) })));
  server.registerTool('iteration_assess', { description: 'Submit a fixed Git candidate for delegated assessment. Returns promptly with an assessment ID.',
    inputSchema: z.object({ ...ids, base: z.string(), candidate: z.string(), kind: z.enum(['iteration', 'final']).default('iteration'),
      brief: z.string(), acceptance: z.array(z.string()).default([]), plan_baseline: z.string().optional(),
      requirement_documents: z.array(z.object({ path: z.string(), revision: z.string() })).default([]),
      previous_assessment: z.string().optional(), command_id: z.string() }) },
  args => answer(() => service.iterationAssess({ planId: args.plan_id, jobId: args.job_id, base: args.base, candidate: args.candidate,
    kind: args.kind, brief: args.brief, acceptance: args.acceptance,
    ...(args.plan_baseline === undefined ? {} : { planBaseline: args.plan_baseline }),
    requirementDocuments: args.requirement_documents,
    ...(args.previous_assessment === undefined ? {} : { previousAssessment: args.previous_assessment }),
    commandId: args.command_id })));
  server.registerTool('assessment_status', { description: 'Read concise assessment status without starting work.', inputSchema: z.object(assessmentId) },
  args => answer(() => service.assessmentStatus(args.plan_id, args.job_id, args.assessment_id)));
  server.registerTool('assessment_result', { description: 'Read the compact gate result when assessment completed.', inputSchema: z.object(assessmentId) },
  args => answer(() => service.assessmentResult(args.plan_id, args.job_id, args.assessment_id)));
  server.registerTool('assessment_detail', { description: 'Read detailed retained assessment evidence on demand.', inputSchema: z.object(assessmentId) },
  args => answer(() => service.assessmentDetail(args.plan_id, args.job_id, args.assessment_id)));
  server.registerTool('assessment_cancel', { description: 'Cancel only the named assessment.', inputSchema: z.object(assessmentId) },
  args => answer(() => service.assessmentCancel(args.plan_id, args.job_id, args.assessment_id)));
  server.registerTool('assessment_resume', { description: 'Explicitly resume interrupted assessment work using retained stages.', inputSchema: z.object(assessmentId) },
  args => answer(() => service.assessmentResume(args.plan_id, args.job_id, args.assessment_id)));
  server.registerTool('finding_list', { description: 'Read retained findings and pending choices for one assisted execution.', inputSchema: z.object(ids) },
  args => answer(() => service.findings(args.plan_id, args.job_id)));
  server.registerTool('finding_answer', { description: 'Record an already-authorized user answer to one offered option. Requires the actual user name and governing record; no source edit or waiver is made.',
    inputSchema: z.object({ ...assessmentId, check_finding: z.string(), request: z.string(), option: z.string(), user_name: z.string(), authority: z.string(), command_id: z.string() }) },
  args => answer(() => service.findingAnswer({ planId: args.plan_id, jobId: args.job_id, assessmentId: args.assessment_id,
    checkFinding: args.check_finding, request: args.request, option: args.option, userName: args.user_name, authority: args.authority, commandId: args.command_id })));
  server.registerTool('protection_accept', { description: 'Record an already-authorized user acceptance of one exact protected change from a completed assessment. The change identities stay in the protection stage; no source edit or automatic waiver is made.',
    inputSchema: z.object({ ...assessmentId, path: z.string(), user_name: z.string(), authority: z.string(), command_id: z.string() }) },
  args => answer(() => service.protectionAccept({ planId: args.plan_id, jobId: args.job_id, assessmentId: args.assessment_id,
    path: args.path, userName: args.user_name, authority: args.authority, commandId: args.command_id })));
  return server;
}

/** Start the official SDK's stdio transport over the configured service. */
export function serveAssistanceStdio(service: AssistanceService): ReturnType<typeof serveStdio> {
  return serveStdio(() => createAssistanceMcpServer(service));
}
