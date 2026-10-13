import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, test } from 'vitest';
import { planRestartImport, restartWorkflowEntries, validateRestartImport } from '../run/restart-import.js';
import { committedRecords, recordHash } from '../work/committed.js';
import { recoveryHash, type RecoveryIdentity } from '../run/recovery-admission.js';
import { invocationSchema } from '../run/records.js';
import { decideCheckFindingChange } from '../../subs/check-findings/src/decide.js';
import { emptyCheckFindingState, replayCheckFindingEvents } from '../../subs/check-findings/src/replay.js';
import { carriedCheckFindings, RunLog } from '../run/log.js';
import { concern, report, decision, dispose } from './helpers/check-findings.js';
import { checkFindingStateOf, replayCheckFindingState } from '../check-findings/state.js';
import { commitCheckFindingChange } from '../check-findings/transition.js';
import { Mutex } from '../jobs/mutex.js';
import { unsettledRequests, reviewStateOf } from '../reviews/state.js';
import { constructedRecord, constructedRun, hash, item, type Line } from './helpers/constructed.js';

function retained() {
  const record = constructedRecord();
  const invocation = invocationSchema.parse({ schema: 'ramify-agent.invocation/1', id: 'inv-0060', role: 'local-architect', work: { workItem: 'wi-003' }, attempt: 3,
    session: { requested: 'continued', actual: 'continued', ref: 'obsolete-point' },
    prompt: { package: 'local-architect/18', hash, manifest: { entries: [{ key: 'tool:submit_work_orientation' }, { key: 'tool:submit_work_item_result' }] } },
    scope: { write: null, measurement: null, size: null }, writer: false, base: 'accepted-head', startedAt: record.createdAt });
  const finding = decideCheckFindingChange(emptyCheckFindingState(), report(concern({ workItem: 'wi-003', summary: 'Authenticate review pointer timestamp' })));
  if (!finding.ok) throw new Error(finding.rejection.message);
  const lines: Line[] = [{ type: 'analysis-accepted', data: { invocation: 'inv-0001', entries: 3, hypotheses: 0, registry: 0, workItems: 3, scenarios: 8, warnings: [],
    catalog: { context: 0, functional: 0, nonFunctional: 0, fixed: 0, recommendation: 0 }, findings: [],
    evidence: { catalog: { path: `analysis/catalog/${hash}.json`, hash }, incorporation: { path: `analysis/incorporation/${hash}.json`, hash } } },
    records: [1, 2, 3].map(n => ({ path: `work-items/wi-00${n}.json`, body: item(`wi-00${n}`, { entry: `entry-${n}` }) })) },
  { type: 'work-item-completed', data: { workItem: 'wi-001', gate: 'ga-0002' } },
  { type: 'work-item-completed', data: { workItem: 'wi-002', gate: 'ga-0004' } },
  ...Array.from({ length: 8 }, (_, n): Line => ({ type: 'obligation-reported', data: { id: `sc-00${n + 1}`, judgment: 'done', basedOnRevision: 0, revision: 1, where: 'Retained architect report', by: 'inv-0057', submission: hash } })),
  { type: 'check-findings-recorded', data: { cause: { kind: 'producer', producer: 'review:scope', attempt: 'rq-0001.a01' }, checkFindings: finding.events } },
  { type: 'review-request-recorded', data: { request: 'rq-0001', workItem: 'wi-003', iteration: 'wi-003.i01', kind: 'scope', gate: 'ga-0009', candidate: 'accepted-head' } },
  { type: 'review-attempt-started', data: { request: 'rq-0001', attempt: 'rq-0001.a01', invocation: 'inv-0059', session: 'ses-0047', requestedStart: 'fresh' } },
  { type: 'review-attempt-finished', data: { request: 'rq-0001', attempt: 'rq-0001.a01', result: 'not-verified', reason: 'stopped', settles: true, checkFindings: [] } },
  { type: 'work-item-started', data: { workItem: 'wi-003', module: 'collection-review/workspace/reviews', origin: 'entry' } },
  { type: 'invocation-started', data: { invocation: invocation.id, role: invocation.role, session: 'ses-0039', work: invocation.work, start: 'continued' },
    records: [{ path: 'invocations/inv-0060/invocation.json', body: invocation }] },
  { type: 'invocation-ended', data: { invocation: invocation.id, ended: 'context-budget-reached', submission: null, session: 'ses-0039', kept: false, finished: 'not-kept' } },
  { type: 'session-finished', data: { session: 'ses-0039', reason: 'run-ended' } },
  { type: 'job-failed', data: { reason: 'internal', message: 'Module architect ended without a result (context-budget-reached)', evidence: [] } }];
  return { record, entries: constructedRun(lines, record).entries, sourceDigest: hash };
}
function identity(): RecoveryIdentity {
  return { candidate: { head: 'accepted-head', tree: 'tree', index: 'index', staged: [], unstaged: [], untracked: [], files: [] },
    runtime: { harness: 'old-runtime', provider: 'provider', contracts: { policy: 'policy', records: 'records', submissions: 'submissions', equipment: 'equipment', authority: 'authority' } },
    configuration: { identity: 'configuration', policy: {} }, capturedInputs: [], durableIdentity: hash, acceptedHead: 'accepted-head' };
}

describe('authenticated restart workflow import', () => {
  test('retains the Plan 43 post-analysis shape and reconstructs the exact architect task', () => {
    const source = retained(), before = structuredClone(source);
    const planned = planRestartImport(source);
    expect(planned.blockers).toEqual([]);
    expect(planned.seed?.pending).toEqual({ kind: 'invocation', sourceRun: source.record.jobId, role: 'local-architect', work: { workItem: 'wi-003' }, originalInvocation: 'inv-0060', submission: 'submit_work_item_result' });
    const initialized = restartWorkflowEntries(planned.seed!);
    expect(initialized.map(entry => entry.transaction.event.type)).not.toContain('job-failed');
    expect(initialized.map(entry => entry.transaction.event.type)).not.toContain('session-finished');
    expect(initialized.filter(entry => entry.transaction.event.type === 'work-item-completed')).toHaveLength(2);
    expect(initialized.filter(entry => entry.transaction.event.type === 'obligation-reported')).toHaveLength(8);
    expect(committedRecords(initialized).workItems).toHaveLength(3);
    expect(initialized.every(entry => entry.sequence < 0 && entry.source.sequence > 0 && entry.source.runId === source.record.jobId)).toBe(true);
    const replayed = replayCheckFindingEvents(initialized.flatMap(entry => carriedCheckFindings(entry.transaction.event)));
    expect(replayed.ok && replayed.state.findings.get('cf-0001')?.standing).toBe('open');
    expect(planned.seed!.outstanding).toContain('check-finding:cf-0001');
    expect(unsettledRequests(initialized.map(entry => entry.transaction.event)).map(request => request.id)).toEqual(['rq-0001']);
    expect(reviewStateOf(initialized.map(entry => entry.transaction.event)).get('rq-0001')?.attempts).toHaveLength(1);
    expect(source).toEqual(before);
  });
  test('producer repair retains completion history while requiring responsible reassessment', () => {
    const source = retained(), before = identity(), after = structuredClone(before);
    after.runtime.harness = 'repaired-runtime';
    const planned = planRestartImport({ ...source, sourceIdentity: before, currentIdentity: after });
    expect(planned.seed!.inventory.filter(entry => entry.transaction.event.type === 'work-item-completed')).toHaveLength(2);
    const initialized = restartWorkflowEntries(planned.seed!);
    expect(initialized.filter(entry => entry.transaction.event.type === 'work-item-completed')).toHaveLength(0);
    expect(initialized.filter(entry => entry.transaction.event.type === 'obligation-reported')).toHaveLength(0);
    expect(planned.seed!.outstanding).toContain('Responsible architect reassessment of imported completion reports');
    expect(committedRecords(initialized).workItems).toHaveLength(3);
  });
  test('hash-valid but inconsistent pending identity cannot invent an authority', () => {
    const seed = structuredClone(planRestartImport(retained()).seed!);
    seed.pending.originalInvocation = 'inv-0001';
    const { digest: _digest, ...body } = seed;
    seed.digest = recoveryHash(body);
    expect(() => validateRestartImport(seed)).toThrow('exact source invocation');
  });
  test('a subsequent successor retains original run-qualified proof without renewing work identities', () => {
    const first = retained(), seed = planRestartImport(first).seed!;
    const record = { ...first.record, jobId: '20261013T080000Z-fedcba' };
    const physical = constructedRun([{ type: 'job-interrupted', data: { message: 'Interrupted successor' } }], record).entries.map(entry => ({ ...entry, transaction: { ...entry.transaction, event: { ...entry.transaction.event, jobId: record.jobId } } }));
    const planned = planRestartImport({ record, entries: [...restartWorkflowEntries(seed), ...physical], previousImport: seed, sourceDigest: hash });
    expect(planned.blockers).toEqual([]);
    expect(planned.seed!.ancestors).toEqual([{ sourceRun: seed.sourceRun, sourceVersion: seed.sourceVersion, sourceDigest: hash, importDigest: seed.digest }]);
    expect(planned.seed!.pending.sourceRun).toBe(first.record.jobId);
    expect(planned.seed!.records.every(reference => reference.sourceRun === first.record.jobId)).toBe(true);
    expect(committedRecords(restartWorkflowEntries(planned.seed!)).workItems.map(work => work.id)).toEqual(['wi-001', 'wi-002', 'wi-003']);
  });
  test('authenticates a lost acknowledgement receipt without inventing gate qualification', () => {
    const source = retained();
    const operation = { schema: 'ramify-agent.gate-operation/2', checkpoint: 'work-item', request: {
      id: 'ga-0010', runId: source.record.jobId, projectRoot: '/project', directory: '/source/gates/ga-0010', head: 'accepted-head',
      audit: { mode: 'project-default' }, subject: { workItem: 'wi-003' }, proposedBy: 'inv-0060', repairRound: 0,
      infrastructureAttempt: 0, limits: { repairRounds: 3, infrastructureRetries: 3 },
    }, guardedChanges: [], rules: [], unauthorized: false, ruleFailed: false, timeoutMs: 1000, message: 'Work item checkpoint' };
    const lines: Line[] = source.entries.map(entry => ({ type: entry.transaction.event.type, data: entry.transaction.event.data, records: entry.transaction.records }));
    lines.splice(-1, 0, { type: 'gate-committing', data: { gate: 'ga-0010', checkpoint: 'work-item' }, records: [{ path: 'gates/ga-0010/operation.json', body: operation }] });
    const entries = constructedRun(lines, source.record).entries;
    const receipt = { sourceRun: source.record.jobId, gate: 'ga-0010', commit: 'settled-commit', tree: 'settled-tree',
      recordHash: recordHash(operation), proposedBy: 'inv-0060', checkpoint: 'work-item' as const, subjectWorkItem: 'wi-003' };
    const planned = planRestartImport({ ...source, entries, recognizedEffects: [receipt] });
    expect(planned.blockers).toEqual([]);
    expect(planned.seed!.recognizedEffects).toEqual([receipt]);
    expect(restartWorkflowEntries(planned.seed!).some(entry => entry.transaction.event.type === 'gate-attempted')).toBe(false);
    const corrupted = structuredClone(planned.seed!);
    corrupted.recognizedEffects[0]!.subjectWorkItem = 'wi-001';
    const { digest: _digest, ...body } = corrupted;
    corrupted.digest = recoveryHash(body);
    expect(() => validateRestartImport(corrupted)).toThrow('original operation authority');
    expect(planRestartImport({ ...source, entries, recognizedEffects: [{ ...receipt, recordHash: 'b'.repeat(64) }] }).blockers).toEqual([expect.stringContaining('authenticated operation record')]);
  });
  test('refuses a hash-valid import whose decomposition names a missing dependency', () => {
    const seed = structuredClone(planRestartImport(retained()).seed!);
    const bodyRecord = seed.records.find(record => record.path === 'work-items/wi-003.json')!;
    (bodyRecord.body as { startedFor: string | null }).startedFor = 'wi-missing';
    bodyRecord.hash = recordHash(bodyRecord.body);
    const inventoryRecord = seed.inventory.flatMap(entry => entry.transaction.records).find(record => record.path === bodyRecord.path)!;
    (inventoryRecord.body as { startedFor: string | null }).startedFor = 'wi-missing';
    const { digest: _digest, ...body } = seed;
    seed.digest = recoveryHash(body);
    expect(() => validateRestartImport(seed)).toThrow('missing dependency');
  });
  test('keeps qualified predecessor restart and resume proofs distinct from successor execution', () => {
    const first = retained(), previousImport = planRestartImport(first).seed!;
    const record = { ...first.record, jobId: '20261013T090000Z-fedcba' };
    const command = { commandId: 'prepare-chain', contentHash: hash, receipt: { commandId: 'prepare-chain', jobId: record.jobId, sequence: 1, acceptedAt: record.createdAt } };
    const entries = constructedRun([
      { type: 'restart-prepared', data: { sourceRun: first.record.jobId, sourceCursor: previousImport.sourceVersion, sourceDigest: hash, importDigest: previousImport.digest,
        importPath: 'restart/import.json', generation: 1, occurrenceId: 'restart-resume-1', revision: 1, command } },
      { type: 'operation-recovery-resumed', data: { occurrenceId: 'restart-resume-1', revision: 2, group: 1, command: { ...command, commandId: 'resume-chain', receipt: { ...command.receipt, commandId: 'resume-chain', sequence: 2 } } } },
      { type: 'job-interrupted', data: { message: 'Interruption after authorized qualification invalidation' } },
    ], record).entries.map(entry => ({ ...entry, transaction: { ...entry.transaction, event: { ...entry.transaction.event, jobId: record.jobId } } }));
    const planned = planRestartImport({ record, entries, previousImport, sourceDigest: hash });
    expect(planned.blockers).toEqual([]);
    const proof = restartWorkflowEntries(planned.seed!).filter(entry => ['restart-prepared', 'operation-recovery-resumed'].includes(entry.transaction.event.type));
    expect(proof.map(entry => entry.source)).toEqual([{ runId: record.jobId, sequence: 1 }, { runId: record.jobId, sequence: 2 }]);
    expect(proof.every(entry => entry.sequence < 0)).toBe(true);
    expect(restartWorkflowEntries(planned.seed!).some(entry => entry.transaction.event.type === 'job-interrupted')).toBe(false);
  });
  test('reopens a successor decision against an imported finding only after validated initialization', async () => {
    const source = retained(), seed = planRestartImport(source).seed!;
    const directory = await mkdtemp(join(tmpdir(), 'restart-finding-'));
    try {
      const path = join(directory, 'events.jsonl'), runId = '20261013T090000Z-abcdef';
      const log = await RunLog.open(path, runId);
      await log.append({ type: 'restart-prepared', data: { sourceRun: seed.sourceRun, sourceCursor: seed.sourceVersion, sourceDigest: seed.sourceDigest,
        importDigest: seed.digest, importPath: 'restart/import.json', generation: 1, occurrenceId: 'restart-resume-1', revision: 1,
        command: { commandId: 'prepare-finding', contentHash: hash, receipt: { commandId: 'prepare-finding', jobId: runId, sequence: 1, acceptedAt: source.record.createdAt } } } });
      // Early cached reads must be replaced when the immutable seed arrives.
      expect(checkFindingStateOf(log.ledger).findings.size).toBe(0);
      log.installWorkflowImport(restartWorkflowEntries(seed));
      expect(checkFindingStateOf(log.ledger).findings.get('cf-0001')?.standing).toBe('open');
      expect(replayCheckFindingState(log.ledger.replay()).findings.get('cf-0001')?.standing).toBe('open');
      const changed = await commitCheckFindingChange({ log, mutex: new Mutex() }, () => ({
        commands: [dispose('cf-0001', 1, decision({ action: 'waive', authority: { kind: 'user-decision', ref: 'operator-review' }, acceptedRisk: 'medium', uncertainty: 'Reviewed timestamp evidence' }, { actor: { kind: 'user', name: 'operator' } }))],
        compose: decided => ({ event: { type: 'check-findings-recorded', data: { cause: { kind: 'user-response', command: 'waive-imported-finding' }, checkFindings: [...decided.events] } } }),
      }));
      expect(changed.kind).toBe('committed');
      const bytes = await readFile(path);
      await expect(RunLog.open(path, runId)).rejects.toThrow('CheckFinding events do not replay');
      const reopened = await RunLog.open(path, runId, undefined, true);
      reopened.installWorkflowImport(restartWorkflowEntries(seed));
      expect(checkFindingStateOf(reopened.ledger).findings.get('cf-0001')).toMatchObject({ standing: 'closed', reason: 'waived', revision: 2 });
      expect(reopened.version).toBe(2);
      expect(reopened.ownEvents).toHaveLength(2);
      expect(await readFile(path)).toEqual(bytes);
      const invalid = await RunLog.open(path, runId, undefined, true);
      expect(() => invalid.installWorkflowImport([])).toThrow('imported CheckFinding history does not replay');
    } finally { await rm(directory, { recursive: true, force: true }); }
  });
  test.each(['job-completed', 'job-stopped'] as const)('preserves refusal meaning for %s', type => {
    const source = retained();
    const final = source.entries.at(-1)!;
    const event = { ...final.transaction.event, type, data: type === 'job-completed' ? { gate: 'final', commit: null, workItems: 3 } : { settled: true } };
    const entries = [...source.entries.slice(0, -1), { ...final, transaction: { ...final.transaction, event } }] as typeof source.entries;
    expect(planRestartImport({ ...source, entries }).seed).toBeNull();
  });
});
