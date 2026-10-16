import type { AgentEvent, ToolDefinition, ToolResult } from '../../../src/interfaces/port.js';
import type { SessionExecutionBindings, SessionExecutionIdentity, SessionOperationKey, SessionOperations, SessionToolDeclaration } from '../../../src/interfaces/session-operations.js';

const architects = new Set(['initial-architect', 'global-fork', 'local-architect', 'capability-architect']);
const engineers = new Set(['engineer', 'contract-engineer', 'nonfunctional-repair-engineer']);
const readers = new Set(['read', 'grep', 'ls', 'find']);
const writers = new Set([...readers, 'edit', 'write', 'shell']);

/** Role-specific experimental tool; children never receive this declaration. */
export function subagentDeclaration(role: string): SessionToolDeclaration | null {
  if (!architects.has(role) && !engineers.has(role)) return null;
  return {
    name: 'subagent', mutating: false,
    description: 'Delegate independent tasks to concurrent subagents with separate contexts. Architects receive read-only explorers; engineers receive implementation workers sharing their working directory and write scope. Assign disjoint files, review results and integrate work before submitting.',
    inputSchema: { type: 'object', additionalProperties: false, required: ['tasks'], properties: {
      tasks: { type: 'array', minItems: 1, items: { type: 'object', additionalProperties: false, required: ['task'], properties: {
        task: { type: 'string', minLength: 1, description: 'Concrete task, relevant evidence, expected result, and (for implementation) exclusive files to edit.' },
      } } },
    } },
  };
}

const report: SessionToolDeclaration = {
  name: 'report_subagent', description: 'Return your findings, changes, verification results and unresolved issues to the coordinating parent.',
  mutating: false, inputSchema: { type: 'object', additionalProperties: false, required: ['summary'], properties: { summary: { type: 'string', minLength: 1 } } },
};

/** All child activity belongs to the parent's invocation, with distinct effect and observation identities. */
function parentEvent(event: AgentEvent, prefix: string, identity: SessionExecutionIdentity): AgentEvent {
  const identified = { ...event, execution: identity,
    ...(event.observation ? { observation: { ...event.observation, sourceId: `${prefix}:${event.observation.sourceId}` } } : {}),
    ...('callId' in event ? { callId: `${prefix}:${event.callId}` } : {}),
  };
  if (event.type === 'message' && event.role === 'assistant') return { ...identified, type: 'message', role: 'assistant',
    text: event.text, usage: event.usage, detail: event.detail,
    blocks: event.blocks.map(block => block.type === 'tool-call' ? { ...block, callId: `${prefix}:${block.callId}` } : block),
  };
  // Native compaction boundaries remain in the child's retained history. Child
  // context estimates must not replace the parent's context observation or review.
  if (event.type === 'context-observed' || event.type === 'compaction') return { type: 'progress', source: 'model-stream', execution: identity };
  return identified;
}

/**
 * A delegation is an ordinary journaled parent effect. Each worker is a fresh
 * durable Pi session in the same store. Only the coordinator can submit to the
 * harness. Incomplete effects remain uncertain under the normal recovery rules.
 */
export function subagentTool(operations: SessionOperations, key: SessionOperationKey, parent: SessionExecutionBindings,
  declarations: readonly SessionToolDeclaration[], tools: readonly ToolDefinition[]): ToolDefinition | null {
  const declaration = subagentDeclaration(parent.task.role);
  if (!declaration || !declarations.some(item => item.name === declaration.name)) return null;
  return { ...declaration, async execute(value, signal, callId): Promise<ToolResult> {
    const tasks = (value as { tasks?: { task?: unknown }[] } | null)?.tasks;
    if (!Array.isArray(tasks) || !tasks.length || tasks.some(item => !item || typeof item.task !== 'string' || !item.task.trim())) {
      return { text: 'Provide a nonempty tasks array with a nonempty task string for each subagent.', isError: true };
    }
    if (!callId) throw new Error('Delegation requires a durable parent call identity');
    const identity = await operations.operationIdentity(key.runId, key.operationId);
    if (!identity || signal.aborted) throw new Error('Parent operation is unavailable or stopped');
    const snapshot = await operations.inspect(key.runId, identity.sessionId);
    if (!snapshot) throw new Error('Parent instructions are unavailable');
    const allowed = engineers.has(parent.task.role) ? writers : readers;
    const selected = declarations.filter(tool => allowed.has(tool.name) && snapshot.activeTools.includes(tool.name));
    const childDeclarations = [...selected, report];
    const initialInstructions = [snapshot.initialInstructions, ...snapshot.additions.map(item => item.text),
      'You are a delegated subagent. The preceding parent instructions provide project constraints and scope. Work only on the delegated task below. Your coordinator owns architectural decisions, integration and harness submission. You cannot delegate further. Return your result through report_subagent; parent submission instructions do not apply to you.',
      engineers.has(parent.task.role)
        ? 'You share the coordinator working directory. Edit only the files assigned to you; other workers may be editing other files. Preserve their changes. Report changes and focused verification accurately.'
        : 'Explore using the supplied read-only tools. Return concrete evidence and file references; do not implement changes.',
    ].join('\n\n');
    const outcomes = await Promise.allSettled(tasks.map(async (item, index) => {
      const prefix = `${key.operationId}:subagent:${callId}:${index + 1}`;
      const childKey = { runId: key.runId, operationId: prefix };
      const task = { ...parent.task, role: 'subagent', submissionTool: report.name,
        message: `# Coordinator's current task\n${parent.task.message}\n\n# Your delegated task\n${item.task}`,
        validatorIdentity: `${prefix}:report`, destinationIdentity: `${prefix}:result`,
      };
      const policy = { ...parent.policy, validator: { subagentReport: 1 }, destination: { parentOperation: key.operationId, callId, index } };
      const scopedId = (id: string) => `${prefix}:${id}`;
      const bindings: SessionExecutionBindings = {
        task, policy,
        tools: tools.filter(tool => selected.some(item => item.name === tool.name)).map(tool => ({ ...tool,
          execute: (input, childSignal, id) => tool.execute(input, childSignal, id === undefined ? undefined : scopedId(id)),
        })),
        currentAuthority: async () => !signal.aborted && await parent.currentAuthority(parent.task, parent.policy),
        guard: parent.guard ? call => parent.guard!({ ...call, callId: scopedId(call.callId) }) : undefined,
        afterMutation: parent.afterMutation ? call => parent.afterMutation!({ ...call, callId: scopedId(call.callId) }) : undefined,
        onEvent: event => { if (!signal.aborted) parent.onEvent(parentEvent(event, prefix, identity)); },
        submission: { name: report.name, async accept(input) {
          return typeof (input as { summary?: unknown } | null)?.summary === 'string' && (input as { summary: string }).summary.trim()
            ? { accepted: true } : { accepted: false, errors: ['A nonempty summary is required.'] };
        } },
        publish: async () => undefined,
      };
      if (signal.aborted) throw new Error('Parent stopped before child creation');
      const created = await operations.create({ ...childKey, operationId: `${prefix}:create`, initialInstructions,
        declarations: childDeclarations, activate: childDeclarations.map(tool => tool.name), policy });
      if (!created.point || created.status !== 'completed') throw new Error(created.reason ?? 'Child creation failed');
      if (signal.aborted) throw new Error('Parent stopped before child dispatch');
      const handle = await operations.continue({ ...childKey, sessionId: created.point.sessionId, expectedPoint: created.point,
        task, policy, bindings, additions: [], toolChange: { add: [], activate: [], inactivate: [] } });
      let stopping: Promise<unknown> | undefined;
      const stop = () => { stopping ??= handle.stop(); void stopping.catch(() => undefined); };
      signal.addEventListener('abort', stop, { once: true });
      if (signal.aborted) stop();
      try {
        const receipt = await handle.settled();
        if (receipt.status === 'completed' && receipt.outcome?.kind === 'submitted') return {
          task: index + 1, operationId: prefix, status: 'completed', summary: (receipt.outcome.input as { summary: string }).summary,
        };
        return { task: index + 1, operationId: prefix, status: receipt.status === 'completed' ? 'incomplete' : receipt.status,
          reason: receipt.reason ?? `Child ended with ${receipt.outcome?.kind ?? 'no outcome'}` };
      } finally { signal.removeEventListener('abort', stop); await stopping; }
    }));
    const results = outcomes.map((outcome, index) => outcome.status === 'fulfilled' ? outcome.value
      : { task: index + 1, operationId: `${key.operationId}:subagent:${callId}:${index + 1}`, status: 'failed', reason: String(outcome.reason) });
    return { text: JSON.stringify({ results }), isError: results.some(result => result.status !== 'completed') };
  } };
}
