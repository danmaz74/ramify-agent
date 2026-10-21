import { createHash } from 'node:crypto';
import type { AgentEvent, JsonSchema, ToolDefinition } from '../../agent/src/interfaces/port.js';
import type { SessionOperations, SessionExecutionPolicy, SessionTaskInput, SessionToolDeclaration } from '../../agent/src/interfaces/session-operations.js';
import type { SubmissionValidation } from '../../task-execution/src/submissions.js';
import { rejectionAnswer } from '../../task-execution/src/submissions.js';
import type { AssistedReviewSubmission } from '../../reviews/src/assisted.js';
import { assistedReviewDeclarationSchema } from '../../reviews/src/assisted.js';
import type { PreparedReview } from '../../reviews/src/preparation.js';
import { z } from 'zod';

/** One independent Pi assessment over a pinned candidate. The caller owns stage records. */
export interface PiAssessmentInput<T> {
  readonly operations: SessionOperations;
  readonly runId: string;
  readonly operationId: string;
  readonly projectRoot: string;
  readonly candidate: string;
  readonly tree: string;
  readonly message: string;
  readonly systemPrompt: string;
  readonly tools: readonly ToolDefinition[];
  readonly submission: {
    readonly name: string;
    readonly description: string;
    readonly inputSchema: JsonSchema;
    readonly validate: (value: unknown) => SubmissionValidation<T> | Promise<SubmissionValidation<T>>;
  };
  readonly currentAuthority?: (() => Promise<boolean>) | undefined;
  /** Persist the validated report before Pi receives an accepted submission verdict. */
  readonly onSubmitted?: ((value: T, evidence: { readonly sessionId: string; readonly operationId: string; readonly eventCount: number }) => Promise<void>) | undefined;
  readonly onEvent?: ((event: AgentEvent) => void) | undefined;
  readonly signal?: AbortSignal | undefined;
}

export type PiAssessmentResult<T> =
  | { readonly status: 'submitted'; readonly value: T; readonly operationId: string; readonly sessionId: string; readonly eventCount: number }
  | { readonly status: 'incomplete'; readonly reason: string; readonly operationId: string; readonly sessionId?: string; readonly eventCount: number };

const hash = (value: unknown): string => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const policy: SessionExecutionPolicy = {
  context: { compaction: 'allowed', budgetTokens: null, budgetFraction: null, reportReserveTokens: 0 },
  authority: { kind: 'candidate-read-only' }, validator: { kind: 'assessment-submission' }, destination: { kind: 'assisted-assessment' },
};

/** Uses the existing durable Pi session operations and exposes only supplied read tools. */
export async function runPiAssessment<T>(input: PiAssessmentInput<T>): Promise<PiAssessmentResult<T>> {
  const incomplete = (reason: string, eventCount: number, sessionId?: string): PiAssessmentResult<T> => ({
    status: 'incomplete', reason, operationId: input.operationId, ...(sessionId ? { sessionId } : {}), eventCount,
  });
  if (input.signal?.aborted) return incomplete('Assessment was cancelled before Pi started', 0);
  const declarations: SessionToolDeclaration[] = [
    ...input.tools.map(tool => ({ name: tool.name, description: tool.description, inputSchema: tool.inputSchema, mutating: tool.mutating ?? false })),
    { name: input.submission.name, description: input.submission.description, inputSchema: input.submission.inputSchema, mutating: false },
  ];
  if (declarations.some(item => item.mutating)) throw new Error('Assessment tools must be read only');
  if (new Set(declarations.map(item => item.name)).size !== declarations.length) throw new Error('Assessment tool names must be distinct');
  const created = await input.operations.create({ runId: input.runId, operationId: `${input.operationId}:create`,
    initialInstructions: input.systemPrompt, declarations, activate: declarations.map(item => item.name), policy });
  if (created.status !== 'completed' || !created.point) return incomplete(`Pi session unavailable: ${created.reason ?? created.status}`, 0);
  const sessionId = created.point.sessionId;
  if (input.signal?.aborted) return incomplete('Assessment was cancelled before Pi started', 0, sessionId);
  const task: SessionTaskInput = {
    role: 'assisted-assessment', message: input.message, submissionTool: input.submission.name,
    environment: { workingDirectory: input.projectRoot, candidate: input.candidate, snapshot: input.tree, limits: {} },
    policyIdentity: hash(policy), validatorIdentity: hash({ tool: input.submission.name, schema: input.submission.inputSchema }),
    destinationIdentity: hash({ runId: input.runId, operationId: input.operationId }),
  };
  let accepted: T | undefined;
  let eventCount = 0;
  const handle = await input.operations.continue({ runId: input.runId, operationId: input.operationId,
    sessionId, expectedPoint: created.point, task, additions: [], toolChange: { add: declarations, activate: declarations.map(item => item.name), inactivate: [] }, policy,
    bindings: { task, policy, tools: input.tools, submission: { name: input.submission.name, async accept(value, signal) {
      if (signal.aborted) return { accepted: false, final: true, errors: ['Assessment was cancelled'] };
      const verdict = await input.submission.validate(value);
      if (!verdict.ok) return { accepted: false, errors: [rejectionAnswer(verdict.errors)] };
      await input.onSubmitted?.(verdict.value, { sessionId, operationId: input.operationId, eventCount });
      accepted = verdict.value;
      return { accepted: true };
    } }, currentAuthority: async () => !input.signal?.aborted && (await input.currentAuthority?.() ?? true),
    onEvent(event) { eventCount++; try { input.onEvent?.(event); } catch { /* The durable session engine owns transcript evidence. */ } }, publish: async () => undefined },
  });
  const stop = () => { void handle.stop(); };
  input.signal?.addEventListener('abort', stop, { once: true });
  if (input.signal?.aborted) stop();
  try {
    // Review lifetime follows actual provider settlement or explicit cancellation.
    // Observation deadlines belong to assessment_wait and do not stop this work.
    const receipt = await handle.settled();
    if (receipt.status !== 'completed' || receipt.outcome?.kind !== 'submitted') {
      return incomplete(`Pi assessment ${receipt.status}: ${receipt.reason ?? receipt.outcome?.kind ?? 'no accepted submission'}`, eventCount, sessionId);
    }
    // A terminal receipt replay has no in-memory validator result. Never infer it from prose.
    if (accepted === undefined) return incomplete('Pi submitted in a prior operation; the accepted report must be read from its retained assessment record', eventCount, sessionId);
    return { status: 'submitted', value: accepted, operationId: input.operationId, sessionId, eventCount };
  } finally {
    input.signal?.removeEventListener('abort', stop);
  }
}

export interface AssistedPiReviewInput extends Omit<PiAssessmentInput<AssistedReviewSubmission>, 'message' | 'systemPrompt' | 'tools' | 'submission'> {
  readonly kind?: 'iteration' | 'final';
  readonly prepared: Omit<PreparedReview, 'validate'> & { readonly validate: (value: unknown) => SubmissionValidation<AssistedReviewSubmission> };
}

export function runAssistedPiReview(input: AssistedPiReviewInput): Promise<PiAssessmentResult<AssistedReviewSubmission>> {
  return runPiAssessment({ ...input, message: input.prepared.message, tools: input.prepared.tools.definitions,
    systemPrompt: input.kind === 'final'
      ? 'You assess final plan completeness, cross-iteration integration, remaining fixed/nonfunctional obligations and architectural quality. Reuse accepted iteration evidence with explained applicability; revisit behavior for later changes, conflicting evidence, unresolved limitations or concrete integration concerns. Avoid unnecessary complexity and preserve clean modularity. Raise architectural findings only for concrete practical consequences and propose the smallest useful correction, avoiding speculative redesign or settled issues without new evidence. Full records, source and individual/cumulative diffs are available on demand. Do not edit source. Preserve genuine uncertainty, unmet requirements and exact protection authority. Submit only through submit_assisted_review.'
      : 'You are an independent reviewer of one pinned candidate. Review code and intended scope together. Use the supplied candidate inspection tools, including shell. Select relevant inspection and report meaningful limitations without an exhaustive file inventory. Do not edit source. A claim about an audit is limited to the factual audit status in the task. Answer each acceptance reference, including absent implementation. Submit only through submit_assisted_review.',
    submission: { name: 'submit_assisted_review', description: input.kind === 'final' ? 'Submit the final plan completeness, integration, architecture and remaining-obligation assessment.' : 'Submit the combined code, scope, design-need and acceptance coverage report.',
      inputSchema: z.toJSONSchema(assistedReviewDeclarationSchema(input.kind), { io: 'input' }) as JsonSchema, validate: input.prepared.validate },
  });
}
