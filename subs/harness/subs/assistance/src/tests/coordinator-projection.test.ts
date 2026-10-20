import { expect, test } from 'vitest';
import { coordinatorProjection } from '../coordinator-projection.js';
import type { CodexPendingRequest } from '../../../agent/subs/codex/src/interfaces/provider.js';

// A short secret can coincide with every metadata field; content redaction must
// never alter the values needed to recognize, validate or answer a request.
test.each(['1', 'e', 'inProgress'])('confidential content projection preserves control metadata for secret %s', secret => {
  const projection = coordinatorProjection(new Set([secret]));
  const id = `${secret}:${'handle'.repeat(2000)}`;
  const base = { id, generation: secret, threadId: secret, turnId: secret, itemId: secret };
  const user: CodexPendingRequest = { ...base, kind: 'user-input', blocking: true, questions: [{ id: secret, header: secret, question: secret, secret: false, allowOther: false, options: [{ label: secret, description: secret }] }] };
  expect(projection.pending(user)).toEqual({ ...user, questions: [{ ...user.questions[0]!, header: '[credential removed]', question: '[credential removed]', options: [{ label: secret, description: '[credential removed]' }] }] });
  const approval: CodexPendingRequest = { ...base, kind: 'file-approval', reason: secret, writeRoot: secret, choices: [{ id: secret, effect: 'once', label: secret, commandPrefix: [secret], network: { host: secret, action: 'allow' } }] };
  expect(projection.pending(approval)).toEqual({ ...approval, reason: '[credential removed]', writeRoot: '[credential removed]', choices: [{ ...approval.choices[0]!, label: '[credential removed]' }] });
  const form: CodexPendingRequest = { ...base, kind: 'mcp-elicitation', serverName: secret, mode: 'form', message: secret, schema: { type: 'object', properties: { [secret]: { type: 'string', enum: [secret], const: secret, description: secret, default: secret, examples: [secret] } }, required: [secret] } };
  expect(projection.pending(form)).toEqual({ ...form, message: '[credential removed]', schema: { type: 'object', properties: { [secret]: { type: 'string', enum: [secret], const: secret, description: '[credential removed]' } }, required: [secret] } });
  expect(projection.event({ kind: 'request-resolved', id })).toEqual({ kind: 'request-resolved', id });
  expect(projection.event({ kind: 'thread-status', threadId: secret, status: 'active' })).toEqual({ kind: 'thread-status', threadId: secret, status: 'active' });
  expect(projection.event({ kind: 'worker-thread', threadId: secret, parentThreadId: secret, model: secret, ephemeral: false })).toEqual({ kind: 'worker-thread', threadId: secret, parentThreadId: secret, model: secret, ephemeral: false });
  expect(projection.event({ kind: 'turn', threadId: secret, turn: { id, status: 'inProgress', error: secret, messages: [{ role: 'assistant', text: secret }], work: [{ id, kind: secret, status: secret, model: secret, operation: secret, workerThreadIds: [secret], activity: secret }] } })).toMatchObject({ threadId: secret, turn: { id, status: 'inProgress', error: '[credential removed]', messages: [{ role: 'assistant', text: '[credential removed]' }], work: [{ id, kind: secret, status: secret, model: secret, operation: secret, workerThreadIds: [secret], activity: secret }] } });
});
