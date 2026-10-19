import type { ReviewCommit } from '../../../autonomous/subs/acceptance/src/review-finish.js';
import { commitCheckFindingChange, decideCheckFindingTransaction } from '../../../../src/check-findings/transition.js';
import type { AcceptanceJournal } from '../../../autonomous/subs/acceptance/src/acceptance-journal.js';
import { coordinationHistory } from '../../../autonomous/src/run/coordination-history.js';
import { readFile } from 'node:fs/promises';
import type { ConfiguredAuditPort } from '../../../audit/src/check-execution.js';
import type { CandidateSource, GitService } from '../../../evidence/src/git.js';
import type { RamifyCli } from '../../../evidence/src/ramify-cli.js';
import type { ArchitectIndex } from '../../../evidence/src/views.js';
import type { RunFailureReason } from '../../../../src/interfaces/protocol/runs.js';
import { canonicalJson } from '../../../../src/jobs/commands.js';
import { commitRecord, type RecordRef as CommitRecord } from '../../../../src/jobs/commit.js';
import { sha256 } from '../../../../src/prompts/packages.js';
import { AfterHandling } from '../../../autonomous/subs/acceptance/src/after-handling.js';
import { CommittingGates } from '../../../autonomous/subs/acceptance/src/committing-gate.js';
import { trackedScenarios } from '../../../autonomous/subs/acceptance/src/feature-files.js';
import type { RunEvent, RunEventInput, RunLog } from '../../../autonomous/src/run/log.js';
import { runLayout } from '../../../autonomous/src/run/records.js';
import type { ManualRun } from './manual.js';

/*
 * The committing gates and the after-handling an implementation run uses,
 * hosted by a manual run. A manual run writes through the same ledger
 * transactions; it has no driver to notify, no stop and no readers to wake,
 * and what only an implementation run can supply, such as a plan's
 * deviations or a correction's close, is an error with its reason rather
 * than a substitute.
 */

const message = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/** A handling step a manual run cannot take, or a failure the run would end with: the command stops with its detail. */
export class HandlingStopped extends Error {
  constructor(readonly reason: RunFailureReason | 'not-run', detail: string, readonly records: readonly string[] = []) {
    super(detail);
    this.name = 'HandlingStopped';
  }
}

/** What a manual run's hosts are built from. */
export interface ManualHostContext {
  readonly projectRoot: string;
  readonly git: GitService;
  readonly candidates: CandidateSource;
  readonly ramify: RamifyCli;
  readonly configuredAudit: ConfiguredAuditPort;
  /** The architect view as the project stands now. */
  readonly refresh: (projectRoot: string) => Promise<ArchitectIndex | null>;
  readonly warn: (text: string) => void;
}

/** One write to the manual run's ledger, as the invocation runner commits it. */
export function manualWrite(run: ManualRun, input: RunEventInput, records: readonly CommitRecord[] = []): Promise<'committed' | 'already-committed' | 'ended'> {
  return run.mutex.run(async () => {
    if (run.log.terminal) return 'ended';
    if (records.length === 0) {
      await run.log.append(input);
      return 'committed';
    }
    return commitRecord(run.log.ledger, { event: run.log.next(input), records: [...records] });
  });
}

/** The committing gates over a manual run. */
export function manualGates(context: ManualHostContext, run: ManualRun): CommittingGates {
  return new CommittingGates({
    ...manualAcceptanceJournal(run),
    requireSettled: reason => run.writer.requireSettled(reason),
    projectRoot: context.projectRoot,
    git: context.git,
    ramify: context.ramify,
    configuredAudit: context.configuredAudit,
    write: (input, records) => manualWrite(run, input, records),
    afterWrite: async () => undefined,
    warn: context.warn,
    // A manual run captures no plan documents: its tracked feature files are what only the harness writes.
    harnessFiles: async () => trackedScenarios(run.log.ledger.replay()).records.map(record => record.file),
    // A manual run captured no audit definition at its start; the candidate's committed one is read.
    auditDefinition: async (sourceCommit) => context.configuredAudit.read(context.projectRoot, sourceCommit),
    previewCandidateTree: () => context.git.previewCandidateTree(context.projectRoot),
    candidates: context.candidates,
    refreshIndex: async () => {
      try {
        const index = await context.refresh(context.projectRoot);
        if (index !== null) run.index = index;
        return structuredClone(index);
      } catch (error) {
        context.warn(`Manual run ${run.jobId}: the architect view could not be refreshed: ${message(error)}`);
        return null;
      }
    },
    ignoring: () => false,
  });
}

/** The after-handling over a manual run, with its gates. */
export function manualHandling(context: ManualHostContext, gates: CommittingGates, run: ManualRun): AfterHandling {
  return new AfterHandling({
    ...manualAcceptanceJournal(run),
    projectRoot: context.projectRoot,
    git: context.git,
    candidates: context.candidates,
    gates,
    write: (input, records) => manualWrite(run, input, records),
    afterWrite: async () => undefined,
    warn: context.warn,
    ignoring: () => false,
    fail: async (reason, detail, records) => { throw new HandlingStopped(reason, detail, records); },
    closeCorrection: async (workItem, closing) => {
      throw new HandlingStopped('not-run', `${closing.data.iteration} corrects reconciliation ${closing.corrects} of ${workItem}; closing a correction claims its CheckFindings' repair, which only an implementation run applies`);
    },
    citeCurrentDeviations: async () => {
      throw new Error('a manual run holds no element catalog, so no plan deviation is cited');
    },
    orientationIdentity: () => 'a manual run keys no design orientation, so its design review starts fresh with the guidance in its packet',
    wakeReviews: () => undefined,
  });
}

/** One invocation's accepted submission, read from its file and checked against the hash its end recorded. */
export async function acceptedSubmission(run: ManualRun, invocation: string): Promise<
  | { readonly ok: true; readonly role: string; readonly started: RunEvent & { type: 'invocation-started' }; readonly raw: Record<string, unknown>; readonly hash: string }
  | { readonly ok: false; readonly reason: string }
> {
  const started = run.log.all('invocation-started').find(event => event.data.invocation === invocation);
  if (started === undefined) return { ok: false, reason: `the manual run records no invocation ${invocation}` };
  const ended = run.log.all('invocation-ended').find(event => event.data.invocation === invocation);
  if (ended === undefined) return { ok: false, reason: `invocation ${invocation} has not ended` };
  if (ended.data.ended !== 'submitted' || ended.data.submission === null) {
    return { ok: false, reason: `invocation ${invocation} ended ${ended.data.ended} with no accepted submission` };
  }
  let bytes: Buffer;
  try { bytes = await readFile(run.path(runLayout.submission(invocation))); }
  catch (error) { return { ok: false, reason: `the accepted submission of ${invocation} cannot be read: ${message(error)}` }; }
  if (sha256(bytes) !== ended.data.submission) {
    return { ok: false, reason: `the submission file of ${invocation} changed after it was accepted: it no longer has the hash ${ended.data.submission} its end recorded` };
  }
  let raw: unknown;
  try { raw = JSON.parse(bytes.toString('utf8')) as unknown; }
  catch { return { ok: false, reason: `the accepted submission of ${invocation} is not JSON` }; }
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, reason: `the accepted submission of ${invocation} is not an object` };
  return { ok: true, role: started.data.role, started, raw: raw as Record<string, unknown>, hash: ended.data.submission };
}

/** The value of an accepted submission without the schema literal the harness stores beside it. */
export function submissionValue(raw: Record<string, unknown>): Record<string, unknown> {
  const { schema: _schema, ...value } = raw;
  return value;
}

/** The last transition the manual run's log holds, as a reader names it. */
export function lastTransition(log: RunLog): string {
  const last = log.events.at(-1);
  return last === undefined ? 'none: the log is empty' : `#${last.sequence} ${last.type}`;
}

/** Whether two bodies are the same record. */
export function sameBody(a: unknown, b: unknown): boolean {
  return canonicalJson(a) === canonicalJson(b);
}

/** Lifecycle-local adapter: shared acceptance gets immutable reads and accepted transactions only. */
export function manualAcceptanceJournal(run: ManualRun): AcceptanceJournal {
 const prepared = new WeakMap<object, import('../../../ledger/src/ledger.js').Transaction<RunEvent>>();
 return {
  identity: { jobId: run.jobId, planId: run.planId, directory: run.directory, base: run.base },
  observe: () => ({ history: coordinationHistory(run.log), version: run.log.version, terminal: structuredClone(run.log.terminal), policy: structuredClone(run.policy), pendingEffects: run.log.ledger.pendingEffects().map(effect => effect.key), index: structuredClone(run.index) }),
  publish: decide => run.mutex.run(async () => { const proposal = await decide(); if (proposal.transaction !== undefined) { const { event, records, at } = proposal.transaction; await run.log.ledger.append({ event: run.log.next(event, at), records }); } return proposal.value; }),
  decideFinding: (build, at) => {
    const decided = decideCheckFindingTransaction(run.log, ({ state }) => build({ state: structuredClone(state) }), at);
    if (decided.kind !== 'transaction') return decided;
    const publication = Object.freeze({ kind: 'prepared-finding-publication' as const });
    prepared.set(publication, decided.transaction);
    return { kind: 'transaction', transaction: publication };
   },
  effect: spec => { const transaction = (value: import('../../../autonomous/subs/acceptance/src/acceptance-journal.js').AcceptanceTransaction) => { if ('kind' in value) { const held = prepared.get(value); if (held === undefined) throw new Error('Unrecognized finding publication'); return held; } return { event: run.log.next(value.event), records: value.records }; }; const intent = spec.intent;
   const apply = () => run.log.ledger.effect({ ...spec, ...(spec.serialization === 'whole' ? {} : { serialize: <T>(work: () => Promise<T>) => run.mutex.run(work) }), intent: typeof intent === 'function' ? () => transaction(intent()) : transaction(intent), complete: result => transaction(spec.complete(result)) });
   const effect = spec.serialization === 'whole' ? run.mutex.run(apply) : apply();
   if (spec.trackGate) run.gating = effect; void effect.finally(() => { if (run.gating === effect) run.gating = undefined; }).catch(() => undefined); return effect;
  },
  write: (input, records) => manualWrite(run, input, records), afterWrite: async () => undefined,
 };
}

export function manualReviewCommit(run: ManualRun): ReviewCommit {
 return { events: () => coordinationHistory(run.log).events, commit: (build, at) => commitCheckFindingChange(run, ({ state }) => build({ state }), at) };
}
