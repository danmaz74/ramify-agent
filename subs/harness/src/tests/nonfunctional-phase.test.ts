import { describe, expect, it } from 'vitest';
import type { LedgerEntry, RecordBody } from '../../subs/ledger/src/ledger.js';
import type { RunEvent } from '../../subs/autonomous/src/run/log.js';
import { runEventSchema } from '../../subs/autonomous/src/run/log.js';
import { runLayout } from '../../subs/autonomous/src/run/records.js';
import { replayNonfunctionalPhase } from '../../subs/autonomous/src/run/nonfunctional-phase.js';
import { decideNonfunctionalRound } from '../../subs/nonfunctional/src/rounds.js';
import { workLayout } from '../../subs/autonomous/src/work/records.js';

const oid = (character: string) => character.repeat(40);
const hash = 'e'.repeat(64);
const first = { tree: oid('a'), head: oid('b'), preparedAt: '2026-09-25T00:00:00.000Z' };
const second = { tree: oid('c'), head: oid('b'), preparedAt: '2026-09-25T00:01:00.000Z' };
const nfrIds = ['nfr-001'];
const result = (status: 'satisfied' | 'not-satisfied' | 'undetermined') => ({
  nfr: 'nfr-001', result: status, inspectedScope: ['src/'], evidence: [],
  uncertainty: status === 'undetermined' ? 'Intermediate evidence unavailable' : '',
});
const assessment = (id: string, candidate: typeof first, phase: 'initial' | 'after-repair', status: ReturnType<typeof result>['result']) => ({
  schema: 'ramify-agent.nonfunctional-assessment/1', id, candidate, round: 1, phase,
  coordinatorInvocation: `inv-${id}`, results: [result(status)],
});
const initial = assessment('nfa-001', first, 'initial', 'undetermined');
const reassessed = assessment('nfa-002', second, 'after-repair', 'satisfied');
const record = (path: string, id: string, body: unknown): RecordBody => ({ path, id, revision: 1, body });
function entry(type: string, data: unknown, records: readonly RecordBody[] = [], sequence = 1): LedgerEntry<RunEvent> {
  const at = '2026-09-25T00:00:00.000Z';
  return { sequence, at, transaction: { event: runEventSchema.parse({ sequence, at, jobId: 'job-001', type, data }), records } };
}
const prepared = (id: string, candidate: typeof first, sequence: number) => entry('candidate-prepared', { candidate: id, tree: candidate.tree }, [
  record(runLayout.candidate(id), id, { schema: 'ramify-agent.prepared-candidate/1', candidate, scenarioRenderingHash: hash, writerSettled: true }),
], sequence);
const assessed = (value: typeof initial, candidateId: string, sequence: number) => entry('nonfunctional-assessed',
  { assessment: value.id, candidate: candidateId, round: 1, phase: value.phase },
  [record(runLayout.assessment(value.id), value.id, value)], sequence);
const marker = entry('nonfunctional-phase-started', { catalogHash: hash, maxRounds: 3 }, [], 1);
const investigated = entry('nonfunctional-investigated', { round: 1, invocation: 'inv-investigate', assessment: initial.id, nfrs: nfrIds }, [], 4);
const assigned = entry('nonfunctional-repair-assigned', {
  round: 1, assignment: 'nfr-repair-001', assessment: initial.id, candidate: 'cand-001', nfrs: nfrIds, startingModule: 'app',
}, [record(runLayout.nonfunctionalRepairAssignment('nfr-repair-001'), 'nfr-repair-001', {
  schema: 'ramify-agent.nonfunctional-repair-assignment/1', id: 'nfr-repair-001', round: 1,
  assessment: initial.id, candidate: 'cand-001', nfrs: nfrIds, startingModule: 'app',
  task: 'Improve evidence', evidence: [], uncertainty: '',
  guarded: [], scope: { revision: 1, base: { modules: ['app'], rationale: 'One captured repair batch' }, extra: [], read: [], bootstrap: [], rationale: 'Improve evidence',
    resolved: { roots: ['/p'], files: [], excluded: [], included: [], view: { status: 'placeholder' },
      ownership: { provider: 'ramify.affected-cli/4', ramifyVersion: 'scripted-lifecycle-only', inputId: 'scripted-scope', configuration: 'tsconfig.json', root: '/p', modules: [{ id: 'app', parent: null, directory: '.' }], exclusions: [] } } },
})], 5);
const repaired = entry('nonfunctional-repair-committed', { round: 1, invocation: 'inv-repair', assignment: 'nfr-repair-001' }, [], 6);
const closed = entry('nonfunctional-round-closed', { round: 1, record: 'nfr-round-001', outcome: 'satisfied' }, [
  record(runLayout.nonfunctionalRound(1), 'nfr-round-001', {
    schema: 'ramify-agent.nonfunctional-round/1', number: 1, initial: initial.id,
    investigation: 'inv-investigate', repair: 'nfr-repair-001', reassessment: reassessed.id, outcome: 'satisfied',
  }),
], 9);
const stream = [marker, prepared('cand-001', first, 2), assessed(initial, 'cand-001', 3), investigated, assigned, repaired,
  prepared('cand-002', second, 7), assessed(reassessed, 'cand-002', 8), closed];

describe('committed non-functional phase replay', () => {
  it('reopens assessment after an authenticated final correction, despite a legacy one-round marker', () => {
    const oldMarker = entry('nonfunctional-phase-started', { catalogHash: hash, maxRounds: 1 });
    const gate = entry('gate-attempted', { gate: 'gate-final', checkpoint: 'final', verdict: 'failed', next: 'correct' }, [], 10);
    const started = entry('invocation-started', { invocation: 'inv-final', role: 'global-fork', session: 'ses-0001',
      work: { request: 'final-correction-gate-final' }, start: 'opened' }, [], 11);
    const ended = entry('invocation-ended', { invocation: 'inv-final', ended: 'submitted', submission: hash,
      session: 'ses-0001', kept: false, finished: 'work-closed' }, [], 12);
    const item = { schema: 'ramify-agent.work-item/1', id: 'wi-099', module: 'app',
      origin: { finalVerification: 'gate-final' }, goal: 'Correct the failed check',
      requirementRefs: [], acceptanceRefs: [], contextRefs: [], startedFor: null };
    const planned = entry('final-correction-planned', { gate: 'gate-final', invocation: 'inv-final',
      workItem: item.id, candidate: 'cand-002', assessment: 'nfa-002', round: 1 },
    [record(workLayout.item(item.id), item.id, item)], 13);
    const replay = replayNonfunctionalPhase([oldMarker, ...stream.slice(1), gate, started, ended, planned], nfrIds, 1);
    expect(replay).toMatchObject({ ok: true, value: { final: null, input: { externalContinuations: [1] } } });
    if (replay.ok) expect(decideNonfunctionalRound(replay.value.input)).toMatchObject({ action: 'prepare-candidate', round: 2 });
    expect(replayNonfunctionalPhase([oldMarker, ...stream.slice(1), gate, started, ended,
      { ...planned, transaction: { ...planned.transaction, records: [] } }], nfrIds, 1)).toMatchObject({ ok: false, reason: expect.stringContaining('co-committed') });
  });
  it('reassesses a changed candidate without recovery admission and retains earlier assessment evidence', () => {
    const invalidated = entry('nonfunctional-final-invalidated', { round: 1, candidate: 'cand-002', assessment: 'nfa-002', tree: oid('d') }, [], 10);
    const repaired = replayNonfunctionalPhase([...stream, invalidated], nfrIds, 3);
    expect(repaired).toMatchObject({ ok: true, value: { final: null, input: {
      closedRounds: [{ number: 1, outcome: 'satisfied', reassessment: 'nfa-002' }], externalContinuations: [1],
    } } });
    if (repaired.ok) expect(decideNonfunctionalRound(repaired.value.input)).toEqual({ action: 'prepare-candidate', round: 2, phase: 'initial' });
    expect(replayNonfunctionalPhase([...stream, invalidated], nfrIds, 3)).toMatchObject({ ok: true, value: { final: null } });
    const wrong = entry('nonfunctional-final-invalidated', { occurrenceId: 'opr-0001', revision: 3, round: 1,
      candidate: 'cand-wrong', assessment: 'nfa-002', tree: oid('9') }, [], 11);
    expect(replayNonfunctionalPhase([...stream, wrong], nfrIds, 3)).toMatchObject({ ok: false, reason: expect.stringContaining('another final assessment') });
    const exhaustedMarker = entry('nonfunctional-phase-started', { catalogHash: hash, maxRounds: 1 });
    expect(replayNonfunctionalPhase([exhaustedMarker, ...stream.slice(1), invalidated], nfrIds, 1)).toMatchObject({ ok: true, value: { final: null } });
  });
  it('reconstructs valid crash prefixes and the next permitted step', () => {
    const expected = ['prepare-candidate', 'prepare-candidate', 'assess', 'investigate', 'repair-or-close', 'repair-or-close', 'prepare-candidate', 'assess', 'close', 'stop'];
    for (let length = 0; length <= stream.length; length += 1) {
      const replay = replayNonfunctionalPhase(stream.slice(0, length), nfrIds, 3);
      expect(replay.ok).toBe(true);
      if (replay.ok) expect(decideNonfunctionalRound(replay.value.input).action).toBe(expected[length]);
    }
    const afterRepair = replayNonfunctionalPhase(stream.slice(0, 7), nfrIds, 3);
    expect(afterRepair).toMatchObject({ ok: true, value: { candidateId: 'cand-002', initialCandidateId: 'cand-001', repair: { assignment: 'nfr-repair-001' } } });
  });

  it('retains the closed assessment and count for finalization', () => {
    const replay = replayNonfunctionalPhase(stream, nfrIds, 3);
    expect(replay).toMatchObject({ ok: true, value: { final: { candidateId: 'cand-002', assessment: { id: 'nfa-002' } }, input: { closedRounds: [{ number: 1, outcome: 'satisfied' }] } } });
  });

  it('advances from a committed continuing round without resetting the count', () => {
    const unresolved = assessment('nfa-002', second, 'after-repair', 'not-satisfied');
    const continuation = entry('nonfunctional-round-closed', { round: 1, record: 'nfr-round-001', outcome: 'continue' }, [
      record(runLayout.nonfunctionalRound(1), 'nfr-round-001', {
        schema: 'ramify-agent.nonfunctional-round/1', number: 1, initial: initial.id,
        investigation: 'inv-investigate', repair: 'nfr-repair-001', reassessment: unresolved.id, outcome: 'continue',
      }),
    ], 9);
    const replay = replayNonfunctionalPhase([...stream.slice(0, 7), assessed(unresolved, 'cand-002', 8), continuation], nfrIds, 3);
    expect(replay).toMatchObject({ ok: true, value: { input: { closedRounds: [{ number: 1, outcome: 'continue' }] } } });
    if (replay.ok) expect(decideNonfunctionalRound(replay.value.input)).toMatchObject({ action: 'prepare-candidate', round: 2 });
  });

  it('resumes a count-exhausted repaired round under its captured marker and retains explicit closure', () => {
    const oldMarker = entry('nonfunctional-phase-started', { catalogHash: hash, maxRounds: 1 });
    const unresolved = assessment('nfa-002', second, 'after-repair', 'not-satisfied');
    const legacyClosed = entry('nonfunctional-round-closed', { round: 1, record: 'nfr-round-001', outcome: 'exhausted' }, [
      record(runLayout.nonfunctionalRound(1), 'nfr-round-001', {
        schema: 'ramify-agent.nonfunctional-round/1', number: 1, initial: initial.id,
        investigation: 'inv-investigate', repair: 'nfr-repair-001', reassessment: unresolved.id, outcome: 'exhausted',
      }),
    ], 9);
    // The caller's current policy may have changed; the marker identifies the old forced closure.
    const resumed = replayNonfunctionalPhase([oldMarker, ...stream.slice(1, 7), assessed(unresolved, 'cand-002', 8), legacyClosed], nfrIds, 3);
    expect(resumed).toMatchObject({ ok: true, value: { input: { maxRounds: 1, closedRounds: [{ outcome: 'exhausted', repair: 'nfr-repair-001' }] } } });
    if (resumed.ok) expect(decideNonfunctionalRound(resumed.value.input)).toEqual({ action: 'prepare-candidate', round: 2, phase: 'initial' });
    const explicit = entry('nonfunctional-round-closed', { round: 1, record: 'nfr-round-001', outcome: 'exhausted' }, [
      record(runLayout.nonfunctionalRound(1), 'nfr-round-001', {
        schema: 'ramify-agent.nonfunctional-round/1', number: 1, initial: initial.id,
        investigation: 'inv-investigate', repair: null, reassessment: null, outcome: 'exhausted',
      }),
    ], 5);
    const closedByCoordinator = replayNonfunctionalPhase([oldMarker, prepared('cand-001', first, 2), assessed(initial, 'cand-001', 3), investigated, explicit], nfrIds, 3);
    expect(closedByCoordinator).toMatchObject({ ok: true });
    if (closedByCoordinator.ok) expect(decideNonfunctionalRound(closedByCoordinator.value.input)).toEqual({ action: 'stop', closedRounds: 1, outcome: 'exhausted' });
  });

  it('ends the phase when a round closes without a repair', () => {
    const unresolved = assessment('nfa-001', first, 'initial', 'not-satisfied');
    const closure = (outcome: 'continue' | 'exhausted') => entry('nonfunctional-round-closed', { round: 1, record: 'nfr-round-001', outcome }, [
      record(runLayout.nonfunctionalRound(1), 'nfr-round-001', {
        schema: 'ramify-agent.nonfunctional-round/1', number: 1, initial: unresolved.id,
        investigation: null, repair: null, reassessment: null, outcome,
      }),
    ], 4);
    const opened = [marker, prepared('cand-001', first, 2), assessed(unresolved, 'cand-001', 3)];
    const replay = replayNonfunctionalPhase(opened, nfrIds, 3);
    if (replay.ok) expect(decideNonfunctionalRound(replay.value.input)).toEqual({ action: 'repair-or-close', round: 1, unresolved: ['nfr-001'] });
    const exhausted = replayNonfunctionalPhase([...opened, closure('exhausted')], nfrIds, 3);
    expect(exhausted).toMatchObject({ ok: true, value: { final: { candidateId: 'cand-001' } } });
    if (exhausted.ok) expect(decideNonfunctionalRound(exhausted.value.input)).toEqual({ action: 'stop', closedRounds: 1, outcome: 'exhausted' });
    expect(replayNonfunctionalPhase([...opened, closure('continue')], nfrIds, 3)).toMatchObject({ ok: false, reason: expect.stringContaining('disagrees') });
  });

  it('rejects missing or conflicting co-committed evidence', () => {
    expect(replayNonfunctionalPhase([marker, entry('candidate-prepared', { candidate: 'cand-001', tree: first.tree })], nfrIds, 3)).toMatchObject({ ok: false, reason: expect.stringContaining('co-committed') });
    const wrongTree = prepared('cand-001', first, 1);
    const tampered = entry('candidate-prepared', { candidate: 'cand-001', tree: second.tree }, wrongTree.transaction.records);
    expect(replayNonfunctionalPhase([marker, tampered], nfrIds, 3)).toMatchObject({ ok: false, reason: expect.stringContaining('tree differs') });
    expect(replayNonfunctionalPhase([marker, stream[1]!, assessed(initial, 'cand-999', 3)], nfrIds, 3)).toMatchObject({ ok: false, reason: expect.stringContaining('no matching prepared') });
    const wrongHead = assessed({ ...initial, candidate: { ...first, head: oid('f') } }, 'cand-001', 2);
    expect(replayNonfunctionalPhase([marker, stream[1]!, wrongHead], nfrIds, 3)).toMatchObject({ ok: false, reason: expect.stringContaining('candidate disagree') });
  });

  it('rejects a new candidate before repair and closure without reassessment', () => {
    expect(replayNonfunctionalPhase([marker, stream[1]!, stream[2]!, prepared('cand-002', second, 4)], nfrIds, 3)).toMatchObject({ ok: false, reason: expect.stringContaining('prior candidate was consumed') });
    expect(replayNonfunctionalPhase([...stream.slice(0, 7), closed], nfrIds, 3)).toMatchObject({ ok: false });
    const falseSatisfied = entry('nonfunctional-round-closed', { round: 1, record: 'nfr-round-001', outcome: 'satisfied' }, [
      record(runLayout.nonfunctionalRound(1), 'nfr-round-001', {
        schema: 'ramify-agent.nonfunctional-round/1', number: 1, initial: initial.id,
        investigation: 'inv-investigate', repair: null, reassessment: null, outcome: 'satisfied',
      }),
    ], 4);
    expect(replayNonfunctionalPhase(stream.slice(0, 4).concat(falseSatisfied), nfrIds, 3)).toMatchObject({ ok: false, reason: expect.stringContaining('disagrees with assessed results') });
  });

  it('refuses a closed round whose earlier assessment omitted the fixed NFR', () => {
    const missing = assessed({ ...initial, results: [] }, 'cand-001', 2);
    expect(replayNonfunctionalPhase([marker, stream[1]!, missing, investigated, closed], nfrIds, 3)).toMatchObject({
      ok: false, reason: expect.stringContaining('does not cover fixed NFR IDs'),
    });
  });

  it('rejects forged repair authority and investigation without progress', () => {
    const satisfied = assessed(assessment('nfa-001', first, 'initial', 'satisfied'), 'cand-001', 3);
    expect(replayNonfunctionalPhase([marker, stream[1]!, satisfied, assigned], nfrIds, 3)).toMatchObject({
      ok: false, reason: expect.stringContaining('repair assignment is not permitted'),
    });
    const repeated = entry('nonfunctional-investigated', {
      round: 1, invocation: 'inv-investigate-again', assessment: initial.id, nfrs: nfrIds,
    });
    expect(replayNonfunctionalPhase(stream.slice(0, 4).concat(repeated), nfrIds, 3)).toMatchObject({
      ok: false, reason: expect.stringContaining('adds no new NFR evidence'),
    });
    const fabricated = entry('nonfunctional-repair-assigned', {
      ...assigned.transaction.event.data, nfrs: ['nfr-999'],
    }, assigned.transaction.records);
    expect(replayNonfunctionalPhase(stream.slice(0, 4).concat(fabricated), nfrIds, 3)).toMatchObject({
      ok: false, reason: expect.stringContaining('repair assignment targets'),
    });
  });
});
