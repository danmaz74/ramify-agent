import { createHash, randomUUID } from 'node:crypto';
import { open as openFile, realpath } from 'node:fs/promises';
import { resolve } from 'node:path';
import { z } from 'zod';
import { currentHead, isCleanRepository, resolveCommit as gitResolveCommit } from '../../subs/evidence/src/git.js';
import { replayCheckFindingEvents } from '../../subs/check-findings/src/replay.js';
import { decideCheckFindingChange } from '../../subs/check-findings/src/decide.js';
import type { CheckFindingCommand, CheckFindingEntry, CheckFindingState } from '../../subs/check-findings/src/interfaces/check-findings.js';
import { decideFindingTransaction } from '../check-findings/transition.js';
import { canonicalJson, CommandLedger, CommandRejection } from '../jobs/commands.js';
import { jobIdSchema, planIdSchema } from '../interfaces/protocol/ids.js';
import { commandIdSchema } from '../interfaces/protocol/jobs.js';
import { jobSchemaVersion, listJobDirectories, newJobId, readJobDocument, planStateDirectory } from '../jobs/records.js';
import { readPlan } from '../plans/discover.js';
import { acquireProjectLock, type ProjectLock } from '../store/lock.js';
import { ensureStateDirectory } from '../store/state-directory.js';
import { assistedDirectory, AssistedStore, type AssistedEvent } from './store.js';
import { defaultProtectionRules, inspectProtectedInputs } from './protection.js';
import {
  assessmentRequestSchema, assistedOutcomeSchema, assistedIterationSchema, iterationRequestSchema, type AssistedIteration, type IterationRequest, type AssessmentRequest, type AssistanceOptions, type AssistedProtection,
  type AssistedAssessment, type AssistedJob, type AssistedOutcome, type AssessorContext,
} from './contracts.js';

const planStartSchema = z.object({ planId: planIdSchema, commandId: commandIdSchema,
  protection: z.object({ explicitPaths: z.array(z.string()).optional(), excludedPaths: z.array(z.string()).optional(),
    guardedPaths: z.array(z.string()).optional(), additions: z.enum(['protect', 'allow']).optional() }).strict().optional(),
}).strict();
const findingAnswerSchema = z.object({ planId: planIdSchema, jobId: jobIdSchema, assessmentId: z.string(),
  checkFinding: z.string(), request: z.string(), option: z.string().min(1), userName: z.string().min(1), authority: z.string().min(1), commandId: commandIdSchema }).strict();
export type FindingAnswerRequest = z.infer<typeof findingAnswerSchema>;
const protectionAcceptSchema = z.object({ planId: planIdSchema, jobId: jobIdSchema, assessmentId: z.string(), path: z.string().min(1),
  userName: z.string().min(1), authority: z.string().min(1), commandId: commandIdSchema }).strict();
export type ProtectionAcceptRequest = z.infer<typeof protectionAcceptSchema>;
export type PlanStartRequest = z.infer<typeof planStartSchema>;
export interface PlanStartResponse { readonly planId: string; readonly jobId: string; readonly planHash: string }
export interface AssessmentAdmission { readonly planId: string; readonly jobId: string; readonly assessmentId: string; readonly status: AssistedAssessment['status'] }
export interface ExecutionSummary { readonly planId: string; readonly jobId: string; readonly kind: 'assisted' | 'manual' | 'implementation'; readonly createdAt: string; readonly detail: string }

/** One configured project writer. Closing it releases the existing project lock. */
export class AssistanceService {
  readonly projectRoot: string;
  private readonly lock: ProjectLock;
  private readonly options: AssistanceOptions;
  private readonly stores = new Map<string, AssistedStore>();
  private readonly commands = new CommandLedger();
  private readonly controllers = new Map<string, AbortController>();
  private readonly executions = new Set<Promise<void>>();
  private queue: Promise<unknown> = Promise.resolve();
  private closed = false;
  private closing: Promise<void> | undefined;

  private constructor(projectRoot: string, lock: ProjectLock, options: AssistanceOptions) {
    this.projectRoot = projectRoot;
    this.lock = lock;
    this.options = options;
  }

  static async open(options: AssistanceOptions): Promise<AssistanceService> {
    const projectRoot = await realpath(resolve(options.projectRoot));
    const lock = await acquireProjectLock(projectRoot);
    const service = new AssistanceService(projectRoot, lock, options);
    try { await service.load(); return service; }
    catch (error) { await lock.release(); throw error; }
  }

  async close(): Promise<void> { this.closing ??= this.shutdown(); await this.closing; }

  private async shutdown(): Promise<void> {
    this.closed = true;
    for (const controller of this.controllers.values()) controller.abort();
    await Promise.allSettled([...this.executions]);
    try {
      await this.write(async () => {
        for (const store of this.stores.values()) for (const assessment of store.assessments()) {
          if (assessment.status !== 'queued' && assessment.status !== 'running') continue;
          const interrupted: AssistedAssessment = { ...assessment, revision: assessment.revision + 1, status: 'interrupted', error: 'Server stopped before assessment completed' };
          await store.record({ type: 'assessment-transition', assessment: interrupted }, interrupted);
        }
      }, true);
    } finally {
      await this.queue;
      await this.lock.release();
    }
  }

  private now(): Date { return this.options.now?.() ?? new Date(); }
  private key(planId: string, jobId: string): string { return `${planId}\0${jobId}`; }
  private async write<T>(action: () => Promise<T>, allowClosing = false): Promise<T> {
    const previous = this.queue;
    let release!: () => void;
    this.queue = new Promise<void>(resolveQueue => { release = resolveQueue; });
    await previous;
    try {
      if (this.closed && !allowClosing || !await this.lock.held()) throw new Error('Assistance service no longer owns the project');
      return await action();
    } finally { release(); }
  }

  private async load(): Promise<void> {
    for (const { planId, jobId } of await listJobDirectories(this.projectRoot)) {
      const document = await readJobDocument(`${assistedDirectory(this.projectRoot, planId, jobId)}/job.json`);
      if ((document as { kind?: unknown } | null)?.kind !== 'assisted'
        && !await this.hasAssistedStart(assistedDirectory(this.projectRoot, planId, jobId))) continue;
      const store = await AssistedStore.open(this.projectRoot, planId, jobId);
      this.stores.set(this.key(planId, jobId), store);
      for (const line of store.ledger.replay()) {
        const event = line.transaction.event;
        if (event.type === 'assisted-started' || event.type === 'iteration-started' || event.type === 'assessment-requested' || event.type === 'finding-answer-recorded' || event.type === 'protection-accepted') this.commands.remember(event.command);
      }
      for (const assessment of store.assessments()) {
        if (assessment.status === 'queued' || assessment.status === 'running') {
          const interrupted: AssistedAssessment = { ...assessment, revision: assessment.revision + 1, status: 'interrupted', error: 'Server ended before assessment completed' };
          await store.record({ type: 'assessment-transition', assessment: interrupted }, interrupted);
        }
      }
    }
  }

  private async hasAssistedStart(directory: string): Promise<boolean> {
    let file;
    try { file = await openFile(`${directory}/events.jsonl`, 'r'); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
      throw error;
    }
    try {
      const bytes = Buffer.alloc(16_384);
      const { bytesRead } = await file.read(bytes, 0, bytes.length, 0);
      const first = bytes.subarray(0, bytesRead).toString('utf8').split('\n')[0];
      try { return (JSON.parse(first ?? '') as { event?: { type?: unknown } }).event?.type === 'assisted-started'; }
      catch { return false; }
    } finally { await file.close(); }
  }

  /** Register an execution around the exact conventional plan. Retry returns the same job. */
  async planStart(input: PlanStartRequest): Promise<PlanStartResponse> {
    const request = planStartSchema.parse(input);
    return this.write(async () => {
      const command = { commandId: request.commandId, expectedVersion: 0, type: 'plan-start', planId: request.planId, execution: 'assisted', protection: request.protection };
      const admitted = this.commands.admit(command);
      if (admitted.kind === 'repeat') {
        const original = [...this.stores.values()].find(store => store.job.jobId === admitted.receipt.jobId);
        if (!original) throw new Error('Accepted registration no longer has its job');
        return { planId: original.job.planId, jobId: original.job.jobId, planHash: original.job.plan.sha256 };
      }
      const plan = await readPlan(this.projectRoot, request.planId);
      if (!plan || plan.status !== 'readable') throw new CommandRejection('invalid-request', `Plan ${request.planId} is ${plan?.status === 'unreadable' ? `unreadable: ${plan.message}` : 'not found'}`);
      const planHash = createHash('sha256').update(plan.markdown).digest('hex');
      const protection: AssistedProtection = this.options.registrationProtection
        ? await this.options.registrationProtection(this.projectRoot, request.planId, request.protection)
        : await this.defaultProtection(request.protection);
      await ensureStateDirectory(planStateDirectory(this.projectRoot, request.planId), { gitignore: true });
      const occupied = new Set((await listJobDirectories(this.projectRoot)).filter(entry => entry.planId === request.planId).map(entry => entry.jobId));
      let jobId = newJobId(this.now());
      while (occupied.has(jobId)) jobId = newJobId(this.now());
      const job: AssistedJob = {
        schema: jobSchemaVersion, kind: 'assisted', planId: request.planId, jobId,
        createdAt: this.now().toISOString(), projectRoot: this.projectRoot,
        plan: { path: plan.path, storedAt: 'input/plan.md', sha256: planHash }, protection,
      };
      const accepted = this.commands.accept(command, admitted.contentHash, jobId, 1, this.now());
      const store = await AssistedStore.create(this.projectRoot, job, plan.markdown, accepted);
      this.stores.set(this.key(request.planId, jobId), store);
      this.commands.remember(accepted);
      return { planId: request.planId, jobId, planHash };
    });
  }

  private async defaultProtection(policy: PlanStartRequest['protection']): Promise<AssistedProtection> {
    const rules = defaultProtectionRules(policy);
    const before = await currentHead(this.projectRoot);
    const inputs = await inspectProtectedInputs({ projectRoot: this.projectRoot, rules }).then(value => ({ value, error: null }), error => ({ value: null, error: error instanceof Error ? error.message : String(error) }));
    const after = await currentHead(this.projectRoot);
    const stable = before !== '' && before === after;
    return {
      baselineCommit: stable ? before : null,
      rules: { ...rules, explicitPaths: [...rules.explicitPaths], excludedPaths: [...rules.excludedPaths], guardedPaths: [...rules.guardedPaths] },
      gaps: inputs.value === null ? [] : [...inputs.value.gaps],
      unavailable: [stable ? null : before === '' ? 'Git HEAD is unavailable' : 'Git HEAD changed during registration', inputs.error].filter(Boolean).join('; ') || null,
    };
  }

  /** Admit and launch an assessment. Transport return does not own its lifetime. */
  async iterationAssess(input: AssessmentRequest): Promise<AssessmentAdmission> {
    const request = assessmentRequestSchema.parse(input);
    return this.write(() => this.admitAssessment(request, { expectedVersion: 0, type: 'iteration-assess', ...request }));
  }

  /** Capture native work or submit its candidate without changing assessment policy. */
  async iteration(input: Extract<IterationRequest, { action: 'start' }>): Promise<AssistedIteration>;
  async iteration(input: Extract<IterationRequest, { action: 'end' }>): Promise<AssessmentAdmission>;
  async iteration(input: IterationRequest): Promise<AssistedIteration | AssessmentAdmission>;
  async iteration(input: IterationRequest): Promise<AssistedIteration | AssessmentAdmission> {
    const request = iterationRequestSchema.parse(input);
    return this.write(async () => {
      const store = this.requireStore(request.planId, request.jobId);
      const command = { expectedVersion: 0, type: 'iteration', ...request };
      // Replay before observing Git: a lost response must retain the original facts.
      const admitted = this.commands.admit(command);
      if (request.action === 'end') {
        const iteration = store.iterations().find(item => item.id === request.iterationId);
        if (!iteration) throw new CommandRejection('not-found', `Iteration ${request.iterationId} does not belong to ${request.planId}/${request.jobId}`);
        return this.admitAssessment({ planId: request.planId, jobId: request.jobId, commandId: request.commandId,
          kind: 'iteration', base: iteration.base, candidate: request.candidate, brief: iteration.brief,
          acceptance: request.acceptance, requirementDocuments: request.requirementDocuments,
          ...(request.previousAssessment === undefined ? {} : { previousAssessment: request.previousAssessment }),
        }, command, { iterationId: iteration.id, focusModule: iteration.focusModule,
          ...(request.additionalContext === undefined ? {} : { additionalContext: request.additionalContext }) });
      }
      if (admitted.kind === 'repeat') {
        const original = store.ledger.replay().map(line => line.transaction.event)
          .find(event => event.type === 'iteration-started' && event.command.commandId === request.commandId);
        if (original?.type !== 'iteration-started') throw new CommandRejection('conflict', 'Command ID belongs to another execution');
        return original.iteration;
      }
      const head = async () => {
        try {
          const value = await (this.options.currentHead ?? currentHead)(this.projectRoot);
          return /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/u.test(value) ? value : null;
        } catch { return null; }
      };
      const before = await head();
      let base: string;
      try { base = await (this.options.resolveCommit ?? gitResolveCommit)(this.projectRoot, request.base ?? 'HEAD'); }
      catch (error) { throw new CommandRejection('invalid-request', `Cannot resolve iteration base: ${error instanceof Error ? error.message : String(error)}`); }
      let cleanliness: 'clean' | 'dirty' | 'unknown' = 'unknown', cleanlinessError: string | null = null;
      try { cleanliness = await (this.options.isCleanRepository ?? isCleanRepository)(this.projectRoot) ? 'clean' : 'dirty'; }
      catch (error) { cleanlinessError = error instanceof Error ? error.message : String(error); }
      const after = await head();
      if (request.base === undefined && (before === null || before !== after || base !== before)) {
        throw new CommandRejection('invalid-request', 'Git HEAD is unavailable or changed during iteration start; retry with a stable checkout or an explicit base');
      }
      const iteration = assistedIterationSchema.parse({ schema: 'ramify-agent.iteration/1', id: `it-${randomUUID()}`,
        planId: request.planId, jobId: request.jobId, startedAt: this.now().toISOString(), base, brief: request.brief, focusModule: request.focusModule,
        provenance: { baseSource: request.base === undefined ? 'head' : 'explicit', requestedBase: request.base ?? null,
          checkoutHead: before, checkoutHeadAfter: after, cleanliness, cleanlinessError } });
      const accepted = this.commands.accept(command, admitted.contentHash, store.job.jobId, store.ledger.version + 1, this.now());
      await store.startIteration({ type: 'iteration-started', command: accepted, iteration });
      this.commands.remember(accepted);
      return iteration;
    });
  }

  /** Shared admission and assessor composition for legacy and recorded iterations. Caller holds the writer. */
  private async admitAssessment(request: AssessmentRequest, command: { commandId: string; expectedVersion: number; [key: string]: unknown },
    metadata: Pick<AssistedAssessment['request'], 'iterationId' | 'focusModule' | 'additionalContext'> = {}): Promise<AssessmentAdmission> {
    const store = this.requireStore(request.planId, request.jobId);
    const admitted = this.commands.admit(command);
    if (admitted.kind === 'repeat') {
      const earlier = store.ledger.replay().find(line => line.transaction.event.type === 'assessment-requested'
        && line.transaction.event.command.commandId === request.commandId)?.transaction.event;
      if (!earlier || earlier.type !== 'assessment-requested') throw new CommandRejection('conflict', 'Command ID belongs to another execution');
      return { planId: request.planId, jobId: request.jobId, assessmentId: earlier.assessment.id, status: store.assessment(earlier.assessment.id)!.status };
    }
    const resolveCommit = this.options.resolveCommit ?? gitResolveCommit;
    const base = await resolveCommit(this.projectRoot, request.base);
    const candidate = await resolveCommit(this.projectRoot, request.candidate);
    const planBaseline = request.planBaseline === undefined ? undefined : await resolveCommit(this.projectRoot, request.planBaseline);
    const requirementDocuments = await Promise.all(request.requirementDocuments.map(async document => {
      if (document.path.startsWith('/') || document.path.includes('\\') || document.path.includes('\0')
        || document.path.split('/').some(part => part === '' || part === '.' || part === '..')) {
        throw new CommandRejection('invalid-request', `Requirement document path must be project-relative: ${document.path}`);
      }
      return { path: document.path, revision: await resolveCommit(this.projectRoot, document.revision) };
    }));
    if (request.previousAssessment !== undefined && store.assessment(request.previousAssessment) === undefined) {
      throw new CommandRejection('invalid-request', `Previous assessment ${request.previousAssessment} does not belong to ${request.planId}/${request.jobId}`);
    }
    if (request.kind === 'final' && store.job.protection.baselineCommit !== null && planBaseline !== store.job.protection.baselineCommit) {
      throw new CommandRejection('invalid-request', `Final plan baseline differs from the registered execution baseline ${store.job.protection.baselineCommit}`);
    }
    const id = `as-${String(store.assessments().length + 1).padStart(4, '0')}`;
    const { commandId: _commandId, ...submitted } = request;
    const assessment: AssistedAssessment = {
      schema: 'ramify-agent.assessment/1', id, planId: request.planId, jobId: request.jobId,
      requestedAt: this.now().toISOString(), request: { ...submitted, ...metadata, base, candidate, requirementDocuments,
        ...(planBaseline === undefined ? {} : { planBaseline }) },
      status: 'queued', revision: 1, stages: [], outcome: null, error: null,
    };
    const accepted = this.commands.accept(command, admitted.contentHash, store.job.jobId, store.ledger.version + 1, this.now());
    await store.record({ type: 'assessment-requested', command: accepted, assessment }, assessment);
    this.commands.remember(accepted);
    this.launch(store, id);
    return { planId: request.planId, jobId: request.jobId, assessmentId: id, status: 'queued' };
  }

  private launch(store: AssistedStore, assessmentId: string): void {
    const controller = new AbortController();
    const key = this.key(store.job.planId, store.job.jobId) + '\0' + assessmentId;
    this.controllers.set(key, controller);
    const execution = this.execute(store, assessmentId, controller).finally(() => {
      this.controllers.delete(key);
      this.executions.delete(execution);
    });
    this.executions.add(execution);
  }

  private async execute(store: AssistedStore, id: string, controller: AbortController): Promise<void> {
    try {
      await this.transition(store, id, assessment => ({ ...assessment, status: 'running', error: null }));
      if (controller.signal.aborted) return;
      const assessor = this.options.assessor;
      const context: AssessorContext = {
        projectRoot: this.projectRoot, job: store.job, assessment: store.assessment(id)!,
        planMarkdown: await store.capturedPlan(), signal: controller.signal,
        checkpoint: async (name, evidence) => {
          if (!/^[a-z][a-z0-9-]*$/u.test(name)) throw new TypeError('Assessment stage name must be a safe lowercase slug');
          await this.transition(store, id, assessment => ({ ...assessment,
            stages: [...assessment.stages.filter(stage => stage.name !== name), { name, evidence, completedAt: this.now().toISOString() }],
          }));
        },
        stages: () => store.assessment(id)?.stages ?? [],
        assessments: () => store.assessments(),
        findingState: () => this.findingState(store),
        recordFindings: (commands, key) => this.recordFindings(store, id, commands, key),
      };
      const outcome = assessor ? assistedOutcomeSchema.parse(await assessor(context)) : {
        gate: 'incomplete' as const, summary: 'Assessment pipeline is unavailable', repairs: [], decisions: [], gaps: ['Required audit and review stages are unavailable'], evidence: [],
      };
      if (controller.signal.aborted) return;
      await this.transition(store, id, assessment => ({ ...assessment, status: 'completed', outcome, error: null, completedAt: this.now().toISOString() }));
    } catch (error) {
      if (controller.signal.aborted) return;
      await this.transition(store, id, assessment => ({ ...assessment, status: 'interrupted', error: error instanceof Error ? error.message : String(error) })).catch(() => undefined);
    }
  }

  private async transition(store: AssistedStore, id: string, update: (assessment: AssistedAssessment) => Omit<AssistedAssessment, 'revision'> | AssistedAssessment): Promise<void> {
    await this.write(async () => {
      const current = store.assessment(id);
      if (!current || current.status === 'cancelled' || current.status === 'completed') return;
      const assessment: AssistedAssessment = { ...update(current), revision: current.revision + 1 };
      await store.record({ type: 'assessment-transition', assessment }, assessment);
    }, true);
  }

  private findingState(store: AssistedStore): CheckFindingState {
    const events = store.ledger.replay().flatMap(line => line.transaction.event.type === 'findings-recorded' || line.transaction.event.type === 'finding-answer-recorded' || line.transaction.event.type === 'protection-accepted'
      ? line.transaction.event.checkFindings : []);
    const replayed = replayCheckFindingEvents(events);
    if (!replayed.ok) throw new Error(`Assisted findings do not replay: ${replayed.rejection.message}`);
    return replayed.state;
  }

  private async recordFindings(store: AssistedStore, id: string, commands: readonly CheckFindingCommand[], key?: string): Promise<void> {
    await this.write(async () => {
      const assessment = store.assessment(id);
      if (!assessment) throw new Error(`Unknown assessment ${id}`);
      if (assessment.status !== 'running') throw new Error(`Assessment ${id} is ${assessment.status}; findings cannot be recorded`);
      const hash = key === undefined ? undefined : createHash('sha256').update(canonicalJson(commands)).digest('hex');
      if (key !== undefined) {
        const earlier = store.ledger.replay().map(line => line.transaction.event)
          .find(event => event.type === 'findings-recorded' && event.assessmentId === id && event.key === key);
        if (earlier?.type === 'findings-recorded') {
          if (earlier.hash !== hash) throw new CommandRejection('conflict', `Finding operation key ${key} was already used for different commands`);
          return;
        }
      }
      if (commands.length === 0) return;
      const decided = decideFindingTransaction<AssistedEvent, { readonly type: 'findings-recorded'; readonly data: {
        readonly assessmentId: string; readonly key?: string; readonly hash?: string;
        readonly checkFindings: readonly import('../../subs/check-findings/src/interfaces/check-findings.js').CheckFindingEvent[];
      } }>(this.findingState(store), () => ({ commands, compose: result => ({ event: {
        type: 'findings-recorded', data: { assessmentId: id, ...(key === undefined ? {} : { key, hash }), checkFindings: result.events },
      } }) }), input => ({ type: 'findings-recorded', ...input.data, checkFindings: [...input.data.checkFindings] }));
      if (decided.kind === 'refused') throw new Error(decided.refusal.message);
      if (decided.kind === 'replayed') return;
      await store.ledger.append(decided.transaction);
    });
  }

  /** Observation is read only; it never resumes or starts assessment work. */
  assessmentStatus(planId: string, jobId: string, assessmentId: string): Pick<AssistedAssessment, 'id' | 'status' | 'revision' | 'error'> & { stages: string[] } {
    const assessment = this.requireAssessment(planId, jobId, assessmentId);
    return { id: assessment.id, status: assessment.status, revision: assessment.revision, error: assessment.error, stages: assessment.stages.map(stage => stage.name) };
  }

  assessmentResult(planId: string, jobId: string, assessmentId: string): (AssistedOutcome & { completedAt?: string }) | null {
    const assessment = this.requireAssessment(planId, jobId, assessmentId);
    return assessment.outcome === null ? null : { ...assessment.outcome, ...(assessment.completedAt === undefined ? {} : { completedAt: assessment.completedAt }) };
  }

  assessmentDetail(planId: string, jobId: string, assessmentId: string): AssistedAssessment {
    return this.requireAssessment(planId, jobId, assessmentId);
  }

  async assessmentCancel(planId: string, jobId: string, assessmentId: string): Promise<AssistedAssessment> {
    const key = this.key(planId, jobId) + '\0' + assessmentId;
    this.controllers.get(key)?.abort();
    await this.transition(this.requireStore(planId, jobId), assessmentId, assessment => ({ ...assessment, status: 'cancelled', error: null }));
    return this.requireAssessment(planId, jobId, assessmentId);
  }

  async assessmentResume(planId: string, jobId: string, assessmentId: string): Promise<AssessmentAdmission> {
    const store = this.requireStore(planId, jobId);
    const assessment = this.requireAssessment(planId, jobId, assessmentId);
    const key = this.key(planId, jobId) + '\0' + assessmentId;
    if (this.controllers.has(key)) return { planId, jobId, assessmentId, status: assessment.status };
    if (assessment.status !== 'interrupted') throw new CommandRejection('conflict', `Assessment ${assessmentId} is ${assessment.status}; only interrupted work resumes`);
    this.launch(store, assessmentId);
    return { planId, jobId, assessmentId, status: 'queued' };
  }

  listAssessments(planId: string, jobId: string): AssistedAssessment[] { return this.requireStore(planId, jobId).assessments(); }
  assistedJob(planId: string, jobId: string): AssistedJob { return this.requireStore(planId, jobId).job; }
  async jobDetail(planId: string, jobId: string): Promise<{ job: AssistedJob; planMarkdown: string; iterations: Array<AssistedIteration & { status: 'started' | 'submitted'; assessmentIds: string[] }> }> {
    const store = this.requireStore(planId, jobId);
    const assessments = store.assessments();
    return { job: store.job, planMarkdown: await store.capturedPlan(), iterations: store.iterations().map(iteration => {
      const assessmentIds = assessments.filter(assessment => assessment.request.iterationId === iteration.id).map(assessment => assessment.id);
      return { ...iteration, status: assessmentIds.length === 0 ? 'started' as const : 'submitted' as const, assessmentIds };
    }) };
  }
  findings(planId: string, jobId: string): CheckFindingEntry[] { return [...this.findingState(this.requireStore(planId, jobId)).findings.values()]; }

  /** Persist an existing user's answer to an offered choice; it never edits source or waives a check. */
  async findingAnswer(input: FindingAnswerRequest): Promise<{ checkFinding: string; request: string; option: string; receipt: { commandId: string; jobId: string; sequence: number; acceptedAt: string } }> {
    const request = findingAnswerSchema.parse(input);
    return this.write(async () => {
      const store = this.requireStore(request.planId, request.jobId);
      const assessment = this.requireAssessment(request.planId, request.jobId, request.assessmentId);
      const command = { ...request, type: 'finding-answer', expectedVersion: 0 };
      const admitted = this.commands.admit(command);
      if (admitted.kind === 'repeat') return { checkFinding: request.checkFinding, request: request.request, option: request.option, receipt: admitted.receipt };
      const entry = this.findingState(store).findings.get(request.checkFinding);
      if (!entry) throw new CommandRejection('not-found', `CheckFinding ${request.checkFinding} does not belong to ${request.planId}/${request.jobId}`);
      if (entry.pendingUserDecision !== request.request) throw new CommandRejection('conflict', `${request.checkFinding} does not await ${request.request}`);
      const decision = entry.decisions.find(item => item.id === request.request);
      if (decision?.decision.action !== 'request-user-decision' || !decision.decision.options.some(item => item.id === request.option)) {
        throw new CommandRejection('invalid-request', `Option ${request.option} is not offered by ${request.request}`);
      }
      const stage = assessment.stages.find(item => entry.reports.some(report => report.observation.evidence
        .some(evidence => evidence.ref === `assessments/${assessment.id}/stages/${item.name}.json`)));
      if (!stage) throw new CommandRejection('conflict', `${request.checkFinding} has no retained stage evidence from assessment ${assessment.id}`);
      const stageCandidate = (stage.evidence as { candidateCommit?: unknown } | null)?.candidateCommit;
      if (stageCandidate !== undefined && stageCandidate !== assessment.request.candidate) {
        throw new CommandRejection('conflict', `Stage ${stage.name} concerns another candidate`);
      }
      const latest = entry.reports.at(-1);
      if (!latest) throw new Error(`${request.checkFinding} has no report`);
      const accepted = this.commands.accept(command, admitted.contentHash, store.job.jobId, store.ledger.version + 1, this.now());
      const findingCommand: CheckFindingCommand = { type: 'dispose', checkFinding: request.checkFinding, expectedRevision: entry.revision,
        decision: { actor: { kind: 'user', name: request.userName }, source: latest.source,
          rationale: `${request.userName} selected ${request.option} under governing record ${request.authority}`,
          evidence: [{ kind: 'governing-record', ref: request.authority, hash: null }, { kind: 'assessment-stage', ref: `assessments/${assessment.id}/stages/${stage.name}.json`, hash: null }],
          communication: { mode: 'quiet' }, decision: { action: 'answer-user-decision', request: request.request, option: request.option } } };
      const decided = decideFindingTransaction<AssistedEvent, { readonly type: 'finding-answer-recorded'; readonly data: {
        readonly assessmentId: string; readonly command: typeof accepted;
        readonly checkFindings: readonly import('../../subs/check-findings/src/interfaces/check-findings.js').CheckFindingEvent[];
      } }>(this.findingState(store), () => ({ commands: [findingCommand], compose: result => ({ event: {
        type: 'finding-answer-recorded', data: { assessmentId: assessment.id, command: accepted, checkFindings: result.events },
      } }) }), carrier => ({ type: 'finding-answer-recorded', ...carrier.data, checkFindings: [...carrier.data.checkFindings] }));
      if (decided.kind !== 'transaction') throw new CommandRejection('conflict', decided.kind === 'refused' ? decided.refusal.message : 'Answer was already recorded');
      await store.ledger.append(decided.transaction);
      this.commands.remember(accepted);
      return { checkFinding: request.checkFinding, request: request.request, option: request.option, receipt: accepted.receipt };
    });
  }

  /** Accept one exact retained protected change with an already-authorized user's choice. */
  async protectionAccept(input: ProtectionAcceptRequest): Promise<{ path: string; checkFinding: string; request: string; option: 'accept-exact-change'; receipt: { commandId: string; jobId: string; sequence: number; acceptedAt: string } }> {
    const request = protectionAcceptSchema.parse(input);
    return this.write(async () => {
      const store = this.requireStore(request.planId, request.jobId);
      const assessment = this.requireAssessment(request.planId, request.jobId, request.assessmentId);
      const command = { ...request, type: 'protection-accept', expectedVersion: 0 };
      const admitted = this.commands.admit(command);
      if (admitted.kind === 'repeat') {
        const earlier = store.ledger.replay().map(line => line.transaction.event).find(event => event.type === 'protection-accepted' && event.command.commandId === request.commandId);
        if (earlier?.type !== 'protection-accepted') throw new CommandRejection('conflict', 'Command ID belongs to another execution');
        const choice = earlier.checkFindings.find(event => event.type === 'check-finding-decided' && event.data.decision.decision.action === 'request-user-decision');
        if (choice?.type !== 'check-finding-decided') throw new Error('Accepted protection choice has no request');
        return { path: earlier.path, checkFinding: choice.data.checkFinding, request: choice.data.decision.id,
          option: 'accept-exact-change' as const, receipt: admitted.receipt };
      }
      if (assessment.status !== 'completed') throw new CommandRejection('conflict', `Assessment ${assessment.id} has not completed`);
      const protection = assessment.stages.find(stage => stage.name === 'protection')?.evidence as {
        baselineCommit?: unknown; candidateCommit?: unknown; violations?: Array<{ path?: unknown; before?: unknown; after?: unknown }>;
      } | undefined;
      if (!protection || protection.baselineCommit !== store.job.protection.baselineCommit
        || protection.candidateCommit !== assessment.request.candidate || !Array.isArray(protection.violations)) {
        throw new CommandRejection('conflict', `Assessment ${assessment.id} has no matching protection evidence`);
      }
      const exact = protection.violations.find(change => change.path === request.path);
      if (!exact) throw new CommandRejection('invalid-request', `Protection stage does not report ${request.path} as an unauthorized change`);
      const state = this.findingState(store);
      const matches = [...state.findings.values()].filter(entry => entry.standing === 'open'
        && entry.verification.kind === 'check' && entry.verification.required
        && entry.verification.producer === 'check:protection' && entry.verification.obligation.subject === `protected:${request.path}`
        && entry.reports.at(-1)?.attempt === assessment.id);
      if (matches.length !== 1) throw new CommandRejection('conflict', `Expected one current required protection finding for ${request.path} from ${assessment.id}; found ${matches.length}`);
      const entry = matches[0]!;
      if (entry.pendingUserDecision !== null) throw new CommandRejection('conflict', `${entry.id} already awaits a user decision`);
      const latest = entry.reports.at(-1)!;
      const stageRef = `assessments/${assessment.id}/stages/protection.json`;
      const evidence = [{ kind: 'assessment-stage', ref: stageRef, hash: null }, { kind: 'governing-record', ref: request.authority, hash: null }];
      const asking: CheckFindingCommand = { type: 'dispose', checkFinding: entry.id, expectedRevision: entry.revision,
        decision: { actor: { kind: 'harness', reason: 'Record the user-authorized exact protected change' }, source: latest.source,
          rationale: `The protected change to ${request.path} needs an exact choice before acceptance.`, evidence, communication: { mode: 'quiet' },
          decision: { action: 'request-user-decision', authority: { kind: 'governing-record', ref: request.authority },
            conflicts: [{ text: `Protected ${request.path}: ${canonicalJson({ before: exact.before ?? null, after: exact.after ?? null })}`, document: request.path,
              revision: store.job.protection.baselineCommit ?? 'unavailable' }],
            options: [{ id: 'accept-exact-change', summary: 'Accept this exact protected change', consequence: 'Only the recorded before and after identities are excepted.' },
              { id: 'restore', summary: 'Restore the protected file', consequence: 'A later candidate must restore or otherwise repair the file.' }] } } };
      const proposed = decideCheckFindingChange(state, asking);
      if (!proposed.ok) throw new CommandRejection('conflict', proposed.rejection.message);
      const requested = proposed.events.find(event => event.type === 'check-finding-decided');
      if (requested?.type !== 'check-finding-decided') throw new Error('Decision request allocated no decision ID');
      const answer: CheckFindingCommand = { type: 'dispose', checkFinding: entry.id, expectedRevision: entry.revision + 1,
        decision: { actor: { kind: 'user', name: request.userName }, source: latest.source,
          rationale: `${request.userName} authorized the exact protected change to ${request.path} under ${request.authority}`,
          evidence, communication: { mode: 'quiet' }, decision: { action: 'answer-user-decision', request: requested.data.decision.id, option: 'accept-exact-change' } } };
      const accepted = this.commands.accept(command, admitted.contentHash, store.job.jobId, store.ledger.version + 1, this.now());
      const decided = decideFindingTransaction<AssistedEvent, { readonly type: 'protection-accepted'; readonly data: {
        readonly assessmentId: string; readonly path: string; readonly command: typeof accepted;
        readonly checkFindings: readonly import('../../subs/check-findings/src/interfaces/check-findings.js').CheckFindingEvent[];
      } }>(state, () => ({ commands: [asking, answer], compose: result => ({ event: {
        type: 'protection-accepted', data: { assessmentId: assessment.id, path: request.path, command: accepted, checkFindings: result.events },
      } }) }), carrier => ({ type: 'protection-accepted', ...carrier.data, checkFindings: [...carrier.data.checkFindings] }));
      if (decided.kind !== 'transaction') throw new CommandRejection('conflict', decided.kind === 'refused' ? decided.refusal.message : 'Choice was already recorded');
      await store.ledger.append(decided.transaction);
      this.commands.remember(accepted);
      return { path: request.path, checkFinding: entry.id, request: requested.data.decision.id, option: 'accept-exact-change', receipt: accepted.receipt };
    });
  }
  listAssistedJobs(): AssistedJob[] { return [...this.stores.values()].map(store => store.job); }

  /** Shared plan/job directory discovery, including the kinds this service does not drive. */
  async listExecutions(planId?: string): Promise<ExecutionSummary[]> {
    if (planId !== undefined) planIdSchema.parse(planId);
    const summaries: ExecutionSummary[] = [];
    for (const entry of await listJobDirectories(this.projectRoot)) {
      if (planId !== undefined && entry.planId !== planId) continue;
      const document = await readJobDocument(`${assistedDirectory(this.projectRoot, entry.planId, entry.jobId)}/job.json`);
      if (document === null || typeof document !== 'object') continue;
      const record = document as { kind?: unknown; createdAt?: unknown; planId?: unknown; jobId?: unknown };
      if (record.kind !== 'implementation' && record.kind !== 'manual' && record.kind !== 'assisted') continue;
      if (record.planId !== entry.planId || record.jobId !== entry.jobId || typeof record.createdAt !== 'string') continue;
      summaries.push({ planId: entry.planId, jobId: entry.jobId, kind: record.kind, createdAt: record.createdAt,
        detail: `plans/${entry.planId}/.harness/jobs/${entry.jobId}/job.json` });
    }
    return summaries.sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.jobId.localeCompare(b.jobId));
  }

  private requireStore(planId: string, jobId: string): AssistedStore {
    planIdSchema.parse(planId); jobIdSchema.parse(jobId);
    const store = this.stores.get(this.key(planId, jobId));
    if (!store) throw new CommandRejection('not-found', `Assisted job ${planId}/${jobId} does not exist`);
    return store;
  }

  private requireAssessment(planId: string, jobId: string, assessmentId: string): AssistedAssessment {
    const assessment = this.requireStore(planId, jobId).assessment(assessmentId);
    if (!assessment) throw new CommandRejection('not-found', `Assessment ${assessmentId} does not belong to ${planId}/${jobId}`);
    return assessment;
  }
}
