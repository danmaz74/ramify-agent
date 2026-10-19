import { z } from 'zod';
import { AjvJsonSchemaValidator } from '@modelcontextprotocol/server/validators/ajv';
import type { JsonSchemaValidator, JsonSchemaType } from '@modelcontextprotocol/server';
import type { CodexApprovalChoice, CodexPendingRequest, CodexThread, CodexTurn, CodexWorkItem } from './interfaces/provider.js';

export const object = z.record(z.string(), z.unknown());
export const text = z.string().min(1);
export const rpcId = z.union([z.string(), z.number().int()]);
export const mcpFormValidator = (schema: Readonly<Record<string, unknown>>): JsonSchemaValidator<unknown> => new AjvJsonSchemaValidator().getValidator(schema as JsonSchemaType);
export const status = z.enum(['inProgress', 'completed', 'interrupted', 'failed']);
const item = z.object({ id: text, type: text }).passthrough();
const turn = z.object({ id: text, status, error: z.object({ message: z.string() }).nullable(), items: z.array(item) }).passthrough();
const thread = z.object({ id: text, parentThreadId: z.string().nullable(), ephemeral: z.literal(false), cwd: text, model: z.string().nullable(), cliVersion: text,
  status: z.object({ type: z.enum(['idle', 'active', 'notLoaded', 'systemError']) }).passthrough(), turns: z.array(turn) }).passthrough();
export function workItem(value: unknown): CodexWorkItem {
  const parsed = item.parse(value);
  return { id: parsed.id, kind: parsed.type,
    ...(typeof parsed.status === 'string' ? { status: parsed.status } : {}),
    ...(typeof parsed.model === 'string' ? { model: parsed.model } : {}),
    ...(Array.isArray(parsed.receiverThreadIds) ? { workerThreadIds: z.array(text).parse(parsed.receiverThreadIds) } : typeof parsed.agentThreadId === 'string' ? { workerThreadIds: [parsed.agentThreadId] } : {}),
    ...(typeof parsed.tool === 'string' ? { operation: parsed.tool } : {}),
    ...(parsed.type === 'subAgentActivity' && typeof parsed.kind === 'string' ? { activity: parsed.kind } : {}) };
}
export function projectTurn(value: unknown): CodexTurn {
  const parsed = turn.parse(value);
  const messages: { role: 'user' | 'assistant'; text: string }[] = [];
  for (const entry of parsed.items) {
    if (entry.type === 'agentMessage') messages.push({ role: 'assistant', text: z.string().parse(entry.text) });
    if (entry.type === 'userMessage') {
      const parts = z.array(object).parse(entry.content);
      messages.push({ role: 'user', text: parts.filter(part => part.type === 'text').map(part => z.string().parse(part.text)).join('\n') });
    }
  }
  return { id: parsed.id, status: parsed.status, error: parsed.error?.message ?? null, messages,
    work: parsed.items.filter(entry => !['userMessage', 'agentMessage', 'reasoning'].includes(entry.type)).map(workItem) };
}
export function projectThread(value: unknown): CodexThread {
  const parsed = thread.parse(value);
  return { id: parsed.id, parentThreadId: parsed.parentThreadId, ephemeral: false, cwd: parsed.cwd, model: parsed.model, cliVersion: parsed.cliVersion,
    status: parsed.status.type, turns: parsed.turns.map(projectTurn) };
}

const decision = z.union([z.enum(['accept', 'acceptForSession', 'decline', 'cancel']),
  z.object({ acceptWithExecpolicyAmendment: z.object({ execpolicy_amendment: z.array(z.string()) }).strict() }).strict(),
  z.object({ applyNetworkPolicyAmendment: z.object({ network_policy_amendment: z.object({ host: text, action: z.enum(['allow', 'deny']) }).strict() }).strict() }).strict()]);
export type WireDecision = z.infer<typeof decision>;
function choice(value: WireDecision, index: number): CodexApprovalChoice {
  const id = String(index);
  if (value === 'accept') return { id, label: 'Approve once', effect: 'once' };
  if (value === 'acceptForSession') return { id, label: 'Approve for this session', effect: 'session' };
  if (value === 'decline') return { id, label: 'Decline', effect: 'deny' };
  if (value === 'cancel') return { id, label: 'Cancel', effect: 'cancel' };
  if ('acceptWithExecpolicyAmendment' in value) return { id, label: 'Approve and amend command policy', effect: 'policy', commandPrefix: value.acceptWithExecpolicyAmendment.execpolicy_amendment };
  return { id, label: 'Amend network policy', effect: 'policy', network: value.applyNetworkPolicyAmendment.network_policy_amendment };
}
const identity = z.object({ threadId: text, turnId: text, itemId: text }).passthrough();
export function pendingRequest(generation: string, method: string, id: string | number, params: unknown, occurrence = 0): { request: CodexPendingRequest; decisions: readonly WireDecision[] } {
  const fallback = object.safeParse(params);
  const info = fallback.success ? fallback.data : {};
  const base = { generation, id: JSON.stringify([generation, typeof id, id, occurrence, info.threadId ?? null, info.turnId ?? null]),
    threadId: typeof info.threadId === 'string' ? info.threadId : null, turnId: typeof info.turnId === 'string' ? info.turnId : null,
    itemId: typeof info.itemId === 'string' ? info.itemId : null };
  try {
    if (method === 'item/commandExecution/requestApproval') {
      const p = identity.extend({ reason: z.string().nullish(), command: z.string().nullish(), cwd: z.string().nullish(),
        availableDecisions: z.array(decision).nullish(), additionalPermissions: z.unknown().optional() }).parse(params);
      // Permission overlays require a richer review than the supported choices describe.
      if (p.additionalPermissions != null) throw new Error('Additional permission overlay needs an unsupported permissions review');
      const decisions = p.availableDecisions ?? ['accept', 'acceptForSession', 'decline', 'cancel'];
      return { request: { ...base, kind: 'command-approval', reason: p.reason ?? null, command: p.command ?? null, cwd: p.cwd ?? null, choices: decisions.map(choice) }, decisions };
    }
    if (method === 'item/fileChange/requestApproval') {
      const p = identity.extend({ reason: z.string().nullish(), grantRoot: z.string().nullish() }).parse(params);
      const decisions = ['accept', 'acceptForSession', 'decline', 'cancel'] as const;
      return { request: { ...base, kind: 'file-approval', reason: p.reason ?? null, writeRoot: p.grantRoot ?? null, choices: decisions.map(choice) }, decisions };
    }
    if (method === 'item/tool/requestUserInput') {
      const p = identity.extend({ isBlocking: z.boolean(), questions: z.array(z.object({ id: text, header: z.string(), question: text,
        isSecret: z.boolean(), isOther: z.boolean(), options: z.array(z.object({ label: text, description: z.string() })).nullable() })).min(1) }).parse(params);
      if (new Set(p.questions.map(q => q.id)).size !== p.questions.length) throw new Error('Duplicate question identity');
      return { request: { ...base, kind: 'user-input', blocking: p.isBlocking,
        questions: p.questions.map(q => ({ id: q.id, header: q.header, question: q.question, secret: q.isSecret, allowOther: q.isOther, options: q.options })) }, decisions: [] };
    }
    if (method === 'mcpServer/elicitation/request') {
      const p = z.object({ threadId: text, turnId: text.nullish(), serverName: text, message: text, mode: z.enum(['form', 'openai/form', 'openaiForm']), requestedSchema: object }).parse(params);
      // Support finite primitive forms. URL/browser flows and nested or opaque
      // schemas remain visible unsupported requests rather than blind approvals.
      const shape = z.object({ type: z.literal('object'), properties: z.record(z.string(), object) }).passthrough().parse(p.requestedSchema);
      if (Object.keys(shape.properties).length > 32 || Object.values(shape.properties).some(field => !['string', 'number', 'integer', 'boolean', 'array'].includes(String(field.type)) || field.type === 'array' && (field.items as Record<string, unknown> | undefined)?.type !== 'string')) throw new Error('MCP form needs unsupported nested or non-primitive content');
      mcpFormValidator(shape);
      return { request: { ...base, kind: 'mcp-elicitation', serverName: p.serverName, message: p.message, mode: p.mode, schema: shape }, decisions: [] };
    }
    throw new Error(`Unsupported provider request ${method}`);
  } catch (failure) {
    return { request: { ...base, kind: 'unsupported', method, reason: String(failure) }, decisions: [] };
  }
}
