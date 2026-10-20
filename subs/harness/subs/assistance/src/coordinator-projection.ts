import type { CodexEvent, CodexPendingRequest } from '../../agent/subs/codex/src/interfaces/provider.js';

/** Redact display content without changing the opaque handles used for control. */
export function coordinatorProjection(privateValues: ReadonlySet<string>) {
  const text = (value: string): string => {
    let selected = value;
    for (const secret of privateValues) selected = selected.replaceAll(secret, '[credential removed]');
    return selected.slice(0, 8192);
  };
  const nullable = (value: string | null) => value === null ? null : text(value);
  const schema = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(schema);
    if (value === null || typeof value !== 'object') return value;
    return Object.fromEntries(Object.entries(value).flatMap(([key, entry]) => {
      if (key === 'default' || key === 'examples') return [];
      if (['title', 'description', '$comment'].includes(key) && typeof entry === 'string') return [[key, text(entry)]];
      // Property names and enum/const values are response handles, not display text.
      if (['properties', '$defs', 'definitions'].includes(key) && entry !== null && typeof entry === 'object') return [[key, Object.fromEntries(Object.entries(entry).map(([name, field]) => [name, schema(field)]))]];
      if (['items', 'additionalProperties', 'allOf', 'anyOf', 'oneOf', 'not'].includes(key)) return [[key, schema(entry)]];
      return [[key, structuredClone(entry)]];
    }));
  };
  const pending = (request: CodexPendingRequest): CodexPendingRequest => {
    switch (request.kind) {
      case 'command-approval': return { ...request, reason: nullable(request.reason), command: nullable(request.command), cwd: nullable(request.cwd), choices: request.choices.map(choice => ({ ...choice, label: text(choice.label) })) };
      case 'file-approval': return { ...request, reason: nullable(request.reason), writeRoot: nullable(request.writeRoot), choices: request.choices.map(choice => ({ ...choice, label: text(choice.label) })) };
      case 'user-input': return { ...request, questions: request.questions.map(question => ({ ...question, header: text(question.header), question: text(question.question), options: question.options?.map(option => ({ ...option, description: text(option.description) })) ?? null })) };
      case 'mcp-elicitation': return { ...request, message: text(request.message), schema: schema(request.schema) as Readonly<Record<string, unknown>> };
      case 'unsupported': return { ...request, reason: text(request.reason) };
    }
  };
  const event = (value: CodexEvent): CodexEvent => {
    switch (value.kind) {
      case 'pending-request': return { ...value, request: pending(value.request) };
      case 'provider-error': return { ...value, message: text(value.message) };
      case 'assistant-delta': return { ...value, text: text(value.text) };
      case 'turn': return { ...value, turn: { ...value.turn, error: nullable(value.turn.error), messages: value.turn.messages.map(message => ({ ...message, text: text(message.text) })), work: structuredClone(value.turn.work) } };
      default: return structuredClone(value);
    }
  };
  return { text, nullable, pending, event };
}
