import { prepareOutlinePublication, prepareAssignmentPublication } from '../../subs/work-coordination/src/work/publication.js';
import { obligationProjection, integrationItemsDue } from '../../subs/work-coordination/src/work/history.js';
import { coordinationHistory } from './coordination-history.js';
import { readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import type { CandidateSource, GitService } from '../../../evidence/src/git.js';
import type { PackageCitation } from '../../../plan-evidence/src/interfaces/catalog.js';
import { orientationKey, readGuidance } from '../../../reviews/src/inputs.js';
import { openCandidateSnapshot, type CandidateSnapshot } from '../../../reviews/src/snapshot.js';

import { type ContractRecord } from '../../subs/work-coordination/src/contracts/records.js';

import { isContained, resolveRealTarget } from '../../../../src/guard/resolve-contained-path.js';
import type { RunFailureReason } from '../../../../src/interfaces/protocol/runs.js';

import { commitRecord, type RecordRef as CommitRecord } from '../../../../src/jobs/commit.js';
import { sha256 } from '../../../../src/prompts/packages.js';
import { pendingBindingEvidence } from '../../../../src/reviews/binding-evidence.js';
import { reviewLayout, reviewRequestId, reviewRequestSchema, type ForkPoint, type ReviewRequest } from '../../../../src/reviews/records.js';
import { reviewStateOf } from '../../../../src/reviews/state.js';
import { committedBody } from '../../../../src/steps/runner.js';
import { committedRecords } from './committed-records.js';
import { engineerSubmissionSchema } from '../../subs/work-coordination/src/work/engineer.js';

import { iterationAssignmentSchema, iterationLayout, iterationResultSchema, type IterationAssignment, type IterationResult } from '../../subs/work-coordination/src/work/iterations.js';
import { type WriteScope } from '../../../../src/work/scope.js';
import { bindingEventsToRecord, obligationEventsToRecord, type ObligationActor, type ObligationBinding, type ObligationRegistration, type ObligationReport } from '../../subs/work-coordination/src/work/obligations.js';
import { type WorkItem, type WorkItemOutline } from '../../subs/work-coordination/src/work/records.js';
import { type OutlineBody } from '../../subs/work-coordination/src/work/submission.js';
import { releasableScratchModules, removeScratchDirectories } from '../../subs/work-coordination/src/work/scratch.js';
import type { CommittingGates, GateRun } from './committing-gate.js';
import { expectedFeatureFiles, writtenScenarios } from './feature-files.js';
import type { RunEventInput, RunEventOf } from './log.js';
import { declaredModuleDirectories } from '../../../../src/run/project-config.js';
import { gateAttemptSchema, runLayout, type ReviewKind } from './records.js';
import { type ArchitectRef, type DurableRecordRef as RecordRef } from '../../../task-execution/src/records.js';
import type { RunWrite } from './log.js';

/*
 * What the harness records after an accepted submission, as far as it is a
 * function of records: the obligations an architect reported, the bindings
 * a module engineer proposed, an iteration's close and the review requests an
 * accepted iteration owes. An implementation run and a manual run's `after`
 * share it; each names, through its host, how it writes and fails, and what
 * only it can supply: a correction's close, a package citation and the
 * identity a design orientation is keyed by.
 */

const message = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/**
 * Whether a completion's outline changes nothing in the committed revision:
 * the plan is the same, and the reason is the committed one or the one the
 * harness gives a completion that carried no outline. A new reason states a
 * revision.
 */

/** What one review question binds besides the candidate. */
export type ReviewInputs = Pick<ReviewRequest, 'guidance' | 'forkPoint'> & Partial<Pick<ReviewRequest, 'inputsUnavailable' | 'source'>>;

/** What the after-handling asks of a run. */
export interface HandlingHost<R extends GateRun> {
  readonly projectRoot: string;
  readonly git: GitService;
  readonly candidates: CandidateSource;
  readonly gates: CommittingGates<R>;
  write(run: R, input: RunEventInput, records?: readonly CommitRecord[]): Promise<'committed' | 'already-committed' | 'ended'>;
  afterWrite(write: RunWrite, runId: string): Promise<void>;
  warn(text: string): void;
  ignoring(run: R): boolean;
  /** Ends the run with the reason; a manual run's handling stops with the detail as its error. */
  fail(run: R, reason: RunFailureReason, detail: string, records?: readonly string[]): Promise<void>;
  /** Closes an accepted correction with its repair claims, on the same line as the close. */
  closeCorrection(run: R, workItem: string, closing: {
    readonly data: Omit<RunEventOf<'iteration-closed'>['data'], 'checkFindings'>;
    readonly record: CommitRecord;
    readonly corrects: string;
    readonly gate: string;
    readonly commit: string;
    readonly invocation: string | null;
  }): Promise<void>;
  /** Cites elements with every plan deviation recorded so far; throws where no catalog is held. */
  citeCurrentDeviations(run: R, elements: readonly string[]): Promise<PackageCitation>;
  /** Who a design orientation is keyed by, or why the run names none. */
  orientationIdentity(run: R): { readonly packageHash: string | null; readonly agent: string; readonly model: string | null } | string;
  /** Wakes the run's review readers, where it has any. */
  wakeReviews(run: R): void;
}

/** The after-handling of one kind of run. */
export class AfterHandling<R extends GateRun> {
  constructor(private readonly host: HandlingHost<R>) {}

  /**
   * Records every review request owed for one accepted iteration, once per
   * key, before the driver passes it. The candidate's tree is read first,
   * outside the mutex; the key is checked and the identifier counted under
   * it. Answers the requests it recorded: none for a key already recorded,
   * a run that has ended, or a candidate whose tree cannot be read, which
   * is warned about.
   */
  async requestReviews(run: R, closed: { readonly workItem: string; readonly iteration: string; readonly gate: string; readonly commit: string }): Promise<string[]> {
    const policy = run.policy.reviews;
    if (policy === undefined) return [];
    let tree: string;
    try {
      tree = await this.host.candidates.commitTree(this.host.projectRoot, closed.commit);
    } catch (error) {
      // A request binds its tree; without one there is nothing to review
      // against, and the gap is the missing request, stated here.
      this.host.warn(`Run ${run.jobId}: no review of ${closed.iteration} was requested; the tree of ${closed.commit} could not be read: ${message(error)}`);
      return [];
    }
    const number = Number.parseInt(closed.iteration.slice(closed.iteration.lastIndexOf('.i') + 2), 10);
    const base = this.host.gates.acceptedBefore(run, closed.gate);
    const assignment = iterationLayout.assignment(closed.workItem, number);
    // Each question's captured inputs are read before the mutex, as the tree is.
    const inputs = new Map<ReviewKind, ReviewInputs>();
    for (const kind of policy.kinds) inputs.set(kind, await this.reviewInputs(run, kind, { ...closed, assignment, base }));
    const recorded: string[] = [];
    for (const kind of policy.kinds) {
      const outcome = await run.mutex.run(async () => {
        if (run.log.terminal) return null;
        const existing = [...reviewStateOf(run.log.events).values()]
          .find(request => request.iteration === closed.iteration && request.candidate === closed.commit && request.kind === kind);
        if (existing !== undefined) return null;
        const id = reviewRequestId(run.log.count('review-request-recorded') + 1);
        const request = reviewRequestSchema.parse({
          schema: 'ramify-agent.review-request/1',
          id,
          key: { iteration: closed.iteration, candidate: closed.commit, kind, policy: policy.version },
          workItem: closed.workItem,
          assignment,
          base,
          gate: closed.gate,
          tree,
          ...inputs.get(kind)!,
        } satisfies ReviewRequest);
        await commitRecord(run.log.ledger, {
          event: run.log.next({
            type: 'review-request-recorded',
            data: { request: id, workItem: closed.workItem, iteration: closed.iteration, kind, gate: closed.gate, candidate: closed.commit },
          }),
          records: [{ path: reviewLayout.request(id), id, revision: 1, body: request }],
        });
        return id;
      });
      if (outcome !== null) recorded.push(outcome);
    }
    this.host.wakeReviews(run);
    return recorded;
  }

  /**
   * What one question of one candidate is given besides the candidate, and
   * the point its reviewer starts from. Code review needs nothing more and
   * never forks. Scope review binds the plan excerpts the assignment cites
   * and the module architect's pinned point at the assignment. Design review
   * binds the guidance it selects from the candidate and the orientation
   * key of that selection. An input that cannot be read is recorded as
   * such: the attempt then says what it lacked.
   */
  async reviewInputs(
    run: R,
    kind: ReviewKind,
    closed: { readonly workItem: string; readonly iteration: string; readonly commit: string; readonly assignment: string; readonly base: string },
  ): Promise<ReviewInputs> {
    const none: ReviewInputs = { guidance: [], forkPoint: { kind: 'none' } };
    if (kind === 'code' || kind === 'scope') {
      // Both read the assignment package from its record; scope review adds
      // the plan deviations recorded by the time it is requested.
      let source: PackageCitation | undefined;
      try {
        const assignment = iterationAssignmentSchema.parse(committedBody(run, closed.assignment));
        source = assignment.source === undefined || kind === 'code' ? assignment.source
          : await this.host.citeCurrentDeviations(run, assignment.source.elements);
      } catch (error) {
        return { ...none, inputsUnavailable: `The ${kind} review's assignment package could not be cited: ${message(error)}` };
      }
      if (kind === 'code') return { ...none, ...(source === undefined ? {} : { source }) };
      const assigned = run.log.all('iteration-assigned').find(event => event.data.iteration === closed.iteration);
      const capabilityAssigned = run.log.all('capability-assigned').find(event => event.data.assignment === closed.iteration);
      const pinned = assigned?.data.architectRef ?? capabilityAssigned?.data.architectRef;
      const forkPoint: ForkPoint = pinned === undefined || pinned === null
        ? { kind: 'unavailable', reason: pinned === null ? 'The module architect\'s session was not kept after the assignment' : 'The assignment recorded no pinned point of the module architect' }
        : { kind: 'session', session: pinned.session, ref: pinned.ref };
      return { guidance: [], forkPoint, ...(source === undefined ? {} : { source }) };
    }
    try {
      const snapshot = await openCandidateSnapshot(this.host.candidates, this.host.projectRoot, { commit: closed.commit, base: closed.base });
      const guidance = (await readGuidance(this.host.candidates, this.host.projectRoot, snapshot)).map(({ ref, hash }) => ({ ref, hash }));
      if (guidance.length === 0) return { ...none, forkPoint: { kind: 'unavailable', reason: 'The candidate holds no guidance to judge a design against' } };
      const identity = this.host.orientationIdentity(run);
      if (typeof identity === 'string') return { guidance, forkPoint: { kind: 'unavailable', reason: identity } };
      const key = orientationKey({
        guidance,
        packageHash: identity.packageHash,
        agent: identity.agent,
        model: identity.model,
        context: run.policy.context.reviewer,
        scope: { projectRoot: this.host.projectRoot, workItem: closed.workItem, authority: 'read-only-candidate' },
        execution: { history: 'complete', compaction: 'pi-native-automatic', snapshot: 'current-request-candidate' },
      });
      return { guidance, forkPoint: { kind: 'orientation', key } };
    } catch (error) {
      return { ...none, forkPoint: { kind: 'unavailable', reason: `The candidate's guidance could not be read: ${message(error)}` } };
    }
  }

  /** Commits the `IterationResult` and closes the iteration. It is the last write of that iteration. */
  async closeIteration(
    run: R,
    item: WorkItem,
    number: number,
    assignment: IterationAssignment,
    body: {
      readonly outcome: IterationResult['outcome'];
      readonly invocations: readonly string[];
      readonly findings: readonly string[];
      readonly gate: string | null;
      readonly commit: string | null;
      readonly recommendation?: string | undefined;
      /** Where a module engineer ended without a result: its digest and its analysis. */
      readonly failure?: IterationResult['failure'] | undefined;
    },
  ): Promise<IterationResult> {
    // The notices are read from the commit itself, never from an agent's
    // words, so a run that repeats the effect derives the same ones.
    const notices = await this.host.gates.committedModules(run, body.commit, assignment.id, body.gate);
    const proposalInvocation = body.gate === null ? body.invocations.at(-1)
      : gateAttemptSchema.parse(committedBody(run, runLayout.gate(body.gate))).proposedBy;
    const submissionBytes = proposalInvocation == null ? undefined
      : await readIfExists(run.path(runLayout.submission(proposalInvocation)));
    const retainedSubmission = proposalInvocation == null ? null
      : committedRecords(run.log.ledger.replay()).outcomes.get(proposalInvocation)?.submission;
    if (retainedSubmission != null && (submissionBytes === undefined || sha256(submissionBytes) !== retainedSubmission.hash)) {
      throw new Error(`Engineer ${proposalInvocation} has changed or missing submission bytes`);
    }
    const rawSubmission = submissionBytes === undefined ? null : JSON.parse(submissionBytes.toString('utf8')) as Record<string, unknown>;
    const submitted = rawSubmission?.schema === 'ramify-agent.engineer-submission/1'
      ? engineerSubmissionSchema.safeParse((({ schema: _schema, ...value }) => value)(rawSubmission)) : null;
    const startingPoints = submitted?.success && ['completion-proposed', 'partial'].includes(submitted.data.kind)
      && 'startingPoints' in submitted.data ? submitted.data.startingPoints : undefined;
    const result = iterationResultSchema.parse({
      schema: 'ramify-agent.iteration-result/1',
      iteration: assignment.id,
      ...(assignment.coordination === undefined ? {} : { coordination: assignment.coordination }),
      outcome: body.outcome,
      invocations: [...body.invocations],
      gate: body.gate,
      commit: body.commit,
      findings: [...body.findings],
      changedAssumptions: [],
      ...(startingPoints === undefined ? {} : { startingPoints }),
      ...(body.recommendation === undefined ? {} : { recommendation: body.recommendation }),
      artifacts: [],
      ...(body.failure === undefined ? {} : { failure: body.failure }),
    } satisfies IterationResult);

    const data = { workItem: item.id, iteration: assignment.id, outcome: result.outcome, gate: result.gate, commit: result.commit, notices };
    const recordOwner = assignment.coordination?.kind === 'capability-task' ? assignment.coordination.id : item.id;
    const record = { path: iterationLayout.result(recordOwner, number), id: assignment.id, revision: 1, body: result };
    const corrects = assignment.coordination?.kind === 'capability-task'
      ? run.log.all('capability-assigned').find(event => event.data.assignment === assignment.id)?.data.corrects
      : run.log.all('iteration-assigned').find(event => event.data.iteration === assignment.id)?.data.corrects;
    if (result.outcome === 'accepted' && result.gate !== null && result.commit !== null && corrects !== undefined) {
      await this.host.closeCorrection(run, recordOwner, { data, record, corrects, gate: result.gate, commit: result.commit, invocation: body.invocations.at(-1) ?? null });
    } else {
      await this.host.write(run, { type: 'iteration-closed', data }, [record]);
    }
    await this.host.afterWrite('iteration-closed', run.jobId);
    await this.cleanupClosedScratch(run);
    return result;
  }

  /** A closed assignment releases scratch only when no other assignment in its module remains open. */
  async cleanupClosedScratch(run: R): Promise<void> {
    const records = committedRecords(run.log.ledger.replay());
    // Contract revision can supersede an assignment by committing its result
    // with evidence-reopened, without a separate iteration-closed event.
    const closed = new Set(records.results.keys());
    const engineerAssignments = new Set([
      ...run.log.all('iteration-assigned').map(event => event.data.iteration),
      ...run.log.all('capability-assigned').map(event => event.data.assignment),
    ]);
    const declared = await declaredModuleDirectories(this.host.projectRoot);
    const directoriesOf = (scope: WriteScope): string[] => {
      const captured = scope.resolved.roots.flatMap(root => {
        const path = relative(this.host.projectRoot, root).replaceAll('\\', '/');
        return path === 'src' ? [''] : path.endsWith('/src') ? [path.slice(0, -'/src'.length)] : [];
      });
      return [...new Set([...declared, ...captured].filter(directory => {
        const src = join(this.host.projectRoot, directory, 'src');
        return scope.resolved.roots.some(root => root === src || isContained(root, src));
      }))];
    };
    const assignments = [...records.assignments.values()]
      .filter(assignment => engineerAssignments.has(assignment.id))
      .map(assignment => ({ id: assignment.id, modules: directoriesOf(assignment.scope) }));
    for (const iteration of closed) {
      const removable = releasableScratchModules(iteration, assignments, closed);
      if (removable.length === 0) continue;
      const removed = await removeScratchDirectories(this.host.projectRoot, removable, this.host.git);
      if (removed.preservedTracked.length > 0 && !run.log.all('scratch-preserved').some(entry =>
        entry.data.iteration === iteration && entry.data.paths.join('\0') === removed.preservedTracked.join('\0'))) {
        await this.host.write(run, { type: 'scratch-preserved', data: { iteration, paths: [...removed.preservedTracked] } });
      }
    }
  }

  /**
   * Records an accepted architect submission's registrations and reports,
   * each as its own event naming the invocation and the submission's hash.
   * What the same accepted submission already recorded is not recorded
   * again, so a replayed action applies each effect once.
   */
  async recordObligations(run: R, actor: ObligationActor, invocation: string,
    submission: { readonly registrations: readonly ObligationRegistration[]; readonly reports: readonly ObligationReport[] }): Promise<boolean> {
    if (submission.registrations.length === 0 && submission.reports.length === 0) return true;
    const hash = run.log.all('invocation-ended').find(event => event.data.invocation === invocation)?.data.submission ?? null;
    if (hash === null) {
      await this.host.fail(run, 'internal', `Invocation ${invocation} reported obligations without a recorded accepted submission`, [runLayout.outcome(invocation)]);
      return false;
    }
    for (const input of obligationEventsToRecord(submission, actor, { by: invocation, submission: hash }, obligationProjection(coordinationHistory(run.log)), run.log.events)) {
      // A done report that makes every sub-scenario of an integration
      // scenario done commits that scenario's work item with it.
      const due = input.type === 'obligation-reported' && input.data.judgment === 'done' ? integrationItemsDue(coordinationHistory(run.log), input.data.id) : [];
      if (await this.host.write(run, input, due) === 'ended') return false;
      // A crash between two reports of one submission leaves the rest to
      // the replay, which records each once.
      if (input.type === 'obligation-reported') await this.host.afterWrite('obligation-reported', run.jobId);
      if (this.host.ignoring(run)) return false;
    }
    return !this.host.ignoring(run);
  }

  /** Attribute only the rendering and accepted bindings preceding this exact candidate gate. */
  async reviewPendingBindings(run: R, request: ReviewRequest, snapshot: CandidateSnapshot) {
    return pendingBindingsOf(run, request, snapshot, this.host);
  }

  /**
   * Records an accepted engineer proposal's bindings, each as its own
   * `obligation-bound` event naming the invocation and the submission's hash.
   * What the same accepted submission already recorded is not recorded
   * again, so a replayed action applies each binding once.
   */
  async recordBindings(run: R, invocation: string, bindings: readonly ObligationBinding[]): Promise<boolean> {
    if (bindings.length === 0) return true;
    const hash = run.log.all('invocation-ended').find(event => event.data.invocation === invocation)?.data.submission ?? null;
    if (hash === null) {
      await this.host.fail(run, 'internal', `Invocation ${invocation} bound obligations without a recorded accepted submission`, [runLayout.outcome(invocation)]);
      return false;
    }
    for (const input of bindingEventsToRecord(bindings, { by: invocation, submission: hash }, run.log.events)) {
      if (await this.host.write(run, input) === 'ended') return false;
    }
    return !this.host.ignoring(run);
  }

  /**
   * The outline revision an accepted module architect submission carries,
   * written once for its invocation: a repeated handling of the same
   * invocation answers the revision it already wrote. A completion request
   * that changes nothing in the committed outline, because it carried none
   * or carried the committed body as it stands, writes no revision: its
   * `outline-revised` names the committed revision it stands on, marked
   * `unchanged`, with no record. Null once the run accepts nothing more.
   */
  async reviseOutline(run: R, input: {
    readonly item: WorkItem;
    readonly invocation: string;
    readonly outline: OutlineBody;
    readonly hypothesesSeen: readonly RecordRef[];
    /** The architect's pinned point a completion request records with its revision; absent for an assignment's. */
    readonly architectRef?: ArchitectRef | null | undefined;
  }): Promise<{ readonly outline: WorkItemOutline; readonly written: boolean; readonly unchanged: boolean } | null> {
    const { transition, ...result } = prepareOutlinePublication(coordinationHistory(run.log), input);
    if (transition === undefined) return result;
    await this.host.write(run, transition.event, transition.records);
    await this.host.afterWrite('outline-revised', run.jobId);
    return this.host.ignoring(run) ? null : result;
  }

  /**
   * Commits an accepted assignment: its record, the local decisions committed
   * with it, and the \`iteration-assigned\` that names the invocation, the
   * architect's pinned point and the reconciliation it corrects. Null once
   * the run accepts nothing more.
   */
  async recordAssignment(run: R, input: {
    readonly item: WorkItem;
    readonly number: number;
    readonly invocation: string;
    readonly assignment: IterationAssignment;
    readonly decisions: readonly string[];
    readonly localRecords: readonly CommitRecord[];
    readonly architectRef: ArchitectRef | null;
  }): Promise<IterationAssignment | null> {
    const transition = prepareAssignmentPublication(coordinationHistory(run.log), input);
    await this.host.write(run, transition.event, transition.records);
    await this.host.afterWrite('iteration-assigned', run.jobId);
    return this.host.ignoring(run) ? null : input.assignment;
  }
}

// Ledger-only projections the handling and the run share.

/**
 * The pending-tag bindings a review of the candidate is told about: each
 * accepted binding committed before the request's gate whose scenario file
 * the candidate changed, with its verified provenance.
 */
export async function pendingBindingsOf(run: Pick<GateRun, 'log' | 'planId' | 'jobId'> & { path(relative: string): string }, request: ReviewRequest,
  snapshot: CandidateSnapshot, host: { readonly candidates: CandidateSource; readonly projectRoot: string }) {
  const lines = run.log.ledger.replay();
  const gate = lines.findIndex(line => line.transaction.event.type === 'gate-committing' && line.transaction.event.data.gate === request.gate);
  if (gate < 0) return [];
  const prefix = lines.slice(0, gate + 1);
  const tracked = writtenScenarios(prefix);
  const expected = new Map(expectedFeatureFiles(tracked, { planId: run.planId, runId: run.jobId }).map(file => [file.path, file.content]));
  const changed = new Set(snapshot.changes.map(change => change.path));
  const bindings: Array<{ path: string; sha256: string; scenario: string; invocation: string; submission: string }> = [];
  for (const line of prefix) {
    const event = line.transaction.event;
    if (event.type !== 'obligation-bound') continue;
    const scenario = tracked.records.find(record => record.id === event.data.id);
    if (!scenario || !changed.has(scenario.file) || snapshot.entries.get(scenario.file)?.kind !== 'file') continue;
    const end = prefix.find(item => item.transaction.event.type === 'invocation-ended' && item.transaction.event.data.invocation === event.data.by
      && item.transaction.event.data.submission === event.data.submission);
    if (!end) continue;
    const submission = await readIfExists(run.path(runLayout.submission(event.data.by)));
    if (submission === undefined || sha256(submission) !== event.data.submission) continue;
    const bytes = await host.candidates.readBlob(host.projectRoot, request.key.candidate, scenario.file);
    const evidence = pendingBindingEvidence({ path: scenario.file, scenario: scenario.id, invocation: event.data.by, submission: event.data.submission,
      submissionBytes: submission, candidateBytes: bytes, expectedBytes: expected.get(scenario.file) });
    if (evidence !== null) bindings.push(evidence);
  }
  return bindings;
}

/**
 * A scope widened by the guarded paths an architect authorized: each one the
 * engineer may write through the guarded tools, recorded beside the scope it
 * widens by that one file.
 */


/** The contract artifacts in force, each with the agreement that names it: the guarded set an assignment captures. */


/**
 * Registered evidence an iteration must satisfy, derived and never
 * submitted: a provider work item runs the agreed suite against the real
 * implementation, and a verification runs its consumer's tests with the fake
 * replaced.
 */

async function readIfExists(path: string): Promise<Buffer | undefined> {
  try {
    return await readFile(path);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw error;
  }
}
