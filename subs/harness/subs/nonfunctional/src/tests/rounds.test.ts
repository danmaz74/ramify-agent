import { describe, expect, it } from 'vitest';
import { assessmentSchema, candidateSchema, roundSchema } from '../interfaces/contracts.js';
import { decideNonfunctionalRound, requireRepairPermitted, type RoundDecisionInput } from '../rounds.js';

const candidate = candidateSchema.parse({ tree: 'a'.repeat(40), head: null, preparedAt: '2026-09-25T12:00:00.000Z' });
const repairedCandidate = candidateSchema.parse({ ...candidate, tree: 'b'.repeat(40) });
const result = (nfr: string, status: 'satisfied' | 'not-satisfied' | 'undetermined') => ({
  nfr, result: status, inspectedScope: ['src'], evidence: [], uncertainty: status === 'undetermined' ? 'Need an observation' : '',
});
const assessment = (round: number, phase: 'initial' | 'after-repair', results: ReturnType<typeof result>[], tree = candidate.tree) =>
  assessmentSchema.parse({ schema: 'ramify-agent.nonfunctional-assessment/2', id: 'nfa-001', candidate: { ...candidate, tree }, round, phase, coordinatorInvocation: 'inv-001', results });
const closed = (number: number, outcome: 'satisfied' | 'continue' | 'exhausted' | 'unavailable') =>
  roundSchema.parse({ schema: 'ramify-agent.nonfunctional-round/1', number, initial: 'nfa-001', investigation: null, repair: null, reassessment: null, outcome });
const base: RoundDecisionInput = {
  nfrIds: ['non-functional-requirement:response-time', 'non-functional-requirement:uptime'], maxRounds: 3, closedRounds: [], candidate, initial: null,
  investigated: false, repairCommitted: false, reassessment: null,
};

describe('nonfunctional round decision', () => {
  it('an admitted external candidate change uses the next remaining round without rewriting prior closure', () => {
    const original = closed(1, 'satisfied');
    const ended = { ...base, candidate: null, closedRounds: [original] };
    expect(decideNonfunctionalRound(ended)).toEqual({ action: 'stop', closedRounds: 1, outcome: 'satisfied' });
    expect(decideNonfunctionalRound({ ...ended, externalContinuations: [1] })).toEqual({ action: 'prepare-candidate', round: 2, phase: 'initial' });
    expect(original.outcome).toBe('satisfied');
    expect(decideNonfunctionalRound({ ...ended, maxRounds: 1, externalContinuations: [1] })).toMatchObject({ action: 'prepare-candidate', round: 2 });
    expect(() => decideNonfunctionalRound({ ...ended, externalContinuations: [1, 1] })).toThrow('distinct closed rounds');
    expect(() => decideNonfunctionalRound({ ...ended, externalContinuations: [2] })).toThrow('distinct closed rounds');
    const exhausted = { ...ended, maxRounds: 2, closedRounds: [original, closed(2, 'satisfied')], externalContinuations: [1] };
    expect(decideNonfunctionalRound(exhausted)).toEqual({ action: 'stop', closedRounds: 2, outcome: 'satisfied' });
    expect(() => decideNonfunctionalRound({ ...exhausted, externalContinuations: [] })).toThrow('only a continuing round');
  });
  it('requires explicit complete matching evidence, including for an empty catalog', () => {
    expect(decideNonfunctionalRound({ ...base, candidate: null }).action).toBe('prepare-candidate');
    expect(decideNonfunctionalRound(base)).toEqual({ action: 'assess', round: 1, phase: 'initial' });
    expect(decideNonfunctionalRound({ ...base, nfrIds: [] })).toEqual({ action: 'assess', round: 1, phase: 'initial' });
    expect(decideNonfunctionalRound({ ...base, nfrIds: [], initial: assessment(1, 'initial', []) })).toEqual({
      action: 'close', round: 1, outcome: 'satisfied', unresolved: [],
    });
    expect(decideNonfunctionalRound({ ...base, candidate: null, recoveryExhausted: true })).toEqual({ action: 'unavailable', round: 1 });
    expect(() => decideNonfunctionalRound({ ...base, initial: assessment(1, 'initial', [result('non-functional-requirement:response-time', 'satisfied')]) })).toThrow('missing non-functional-requirement:uptime');
    expect(() => decideNonfunctionalRound({ ...base, initial: assessment(1, 'initial', [result('non-functional-requirement:response-time', 'satisfied'), result('non-functional-requirement:response-time', 'satisfied')]) })).toThrow('duplicate non-functional-requirement:response-time');
    expect(() => decideNonfunctionalRound({ ...base, initial: assessment(1, 'initial', [result('non-functional-requirement:response-time', 'satisfied'), result('non-functional-requirement:unknown', 'satisfied')]) })).toThrow('unknown non-functional-requirement:unknown');
    expect(() => decideNonfunctionalRound({ ...base, initial: assessment(1, 'after-repair', [result('non-functional-requirement:response-time', 'satisfied'), result('non-functional-requirement:uptime', 'satisfied')]) })).toThrow('must be initial');
    expect(() => decideNonfunctionalRound({ ...base, initial: assessment(1, 'initial', [result('non-functional-requirement:response-time', 'satisfied'), result('non-functional-requirement:uptime', 'satisfied')], repairedCandidate.tree) })).toThrow('candidate differs');
  });

  it('investigates uncertainty before one optional repair and reassesses every NFR', () => {
    const initial = assessment(1, 'initial', [result('non-functional-requirement:response-time', 'undetermined'), result('non-functional-requirement:uptime', 'satisfied')]);
    expect(decideNonfunctionalRound({ ...base, initial })).toEqual({ action: 'investigate', round: 1, undetermined: ['non-functional-requirement:response-time'] });
    expect(() => decideNonfunctionalRound({ ...base, initial, repairCommitted: true })).toThrow('investigation before repair');
    expect(decideNonfunctionalRound({ ...base, initial, investigated: true })).toEqual({
      action: 'repair-or-close', round: 1, unresolved: ['non-functional-requirement:response-time'],
    });
    expect(requireRepairPermitted({ ...base, initial, investigated: true })).toBe(1);
    expect(() => requireRepairPermitted({ ...base, initial })).toThrow('not permitted');
    expect(() => requireRepairPermitted({ ...base, initial, investigated: true, repairCommitted: true, candidate: repairedCandidate })).toThrow('not permitted');
    expect(decideNonfunctionalRound({ ...base, initial, investigated: true, repairCommitted: true, candidate: null })).toEqual({
      action: 'prepare-candidate', round: 1, phase: 'after-repair',
    });
    expect(decideNonfunctionalRound({ ...base, initial, investigated: true, repairCommitted: true, candidate: repairedCandidate })).toEqual({
      action: 'assess', round: 1, phase: 'after-repair',
    });
    expect(() => decideNonfunctionalRound({ ...base, initial, investigated: true, repairCommitted: true, candidate: repairedCandidate,
      reassessment: assessment(1, 'after-repair', [result('non-functional-requirement:response-time', 'satisfied')], repairedCandidate.tree) })).toThrow('missing non-functional-requirement:uptime');
    expect(() => decideNonfunctionalRound({ ...base, initial, investigated: true, repairCommitted: true, candidate: repairedCandidate,
      reassessment: assessment(1, 'after-repair', [result('non-functional-requirement:response-time', 'satisfied'), result('non-functional-requirement:uptime', 'satisfied')]) })).toThrow('candidate differs');
    expect(decideNonfunctionalRound({ ...base, initial, investigated: true, repairCommitted: true, candidate: repairedCandidate,
      reassessment: assessment(1, 'after-repair', [result('non-functional-requirement:response-time', 'satisfied'), result('non-functional-requirement:uptime', 'satisfied')], repairedCandidate.tree) })).toEqual({
      action: 'close', round: 1, outcome: 'satisfied', unresolved: [],
    });
  });

  it('continues useful rounds beyond the captured legacy limit and stops on a coordinator closure', () => {
    const unresolved = [result('non-functional-requirement:response-time', 'not-satisfied'), result('non-functional-requirement:uptime', 'satisfied')];
    expect(decideNonfunctionalRound({ ...base, initial: assessment(1, 'initial', unresolved) })).toEqual({
      action: 'repair-or-close', round: 1, unresolved: ['non-functional-requirement:response-time'],
    });
    expect(decideNonfunctionalRound({ ...base, closedRounds: [closed(1, 'continue'), closed(2, 'continue')], initial: assessment(3, 'initial', unresolved) })).toEqual({
      action: 'repair-or-close', round: 3, unresolved: ['non-functional-requirement:response-time'],
    });
    expect(decideNonfunctionalRound({ ...base, maxRounds: 1, initial: assessment(1, 'initial', unresolved) })).toEqual({
      action: 'repair-or-close', round: 1, unresolved: ['non-functional-requirement:response-time'],
    });
    expect(decideNonfunctionalRound({ ...base, maxRounds: 2, closedRounds: [closed(1, 'continue')], initial: assessment(2, 'initial', unresolved) })).toEqual({
      action: 'repair-or-close', round: 2, unresolved: ['non-functional-requirement:response-time'],
    });
    expect(decideNonfunctionalRound({ ...base, candidate: null, closedRounds: [closed(1, 'continue'), closed(2, 'continue'), closed(3, 'exhausted')] })).toEqual({
      action: 'stop', closedRounds: 3, outcome: 'exhausted',
    });
    expect(decideNonfunctionalRound({ ...base, maxRounds: 1, candidate: null, closedRounds: [closed(1, 'exhausted')] })).toEqual({
      action: 'stop', closedRounds: 1, outcome: 'exhausted',
    });
    expect(decideNonfunctionalRound({ ...base, maxRounds: 2, candidate: null, closedRounds: [closed(1, 'continue'), closed(2, 'exhausted')] })).toEqual({
      action: 'stop', closedRounds: 2, outcome: 'exhausted',
    });
    const oldCountClosure = { ...closed(3, 'exhausted'), repair: 'repair-003', reassessment: 'nfa-006' };
    expect(decideNonfunctionalRound({ ...base, candidate: null, closedRounds: [closed(1, 'continue'), closed(2, 'continue'), oldCountClosure] })).toEqual({
      action: 'prepare-candidate', round: 4, phase: 'initial',
    });
    expect(decideNonfunctionalRound({ ...base, candidate: null, closedRounds: [closed(1, 'continue'), closed(2, 'continue'), oldCountClosure,
      closed(4, 'continue')] })).toEqual({ action: 'prepare-candidate', round: 5, phase: 'initial' });
    expect(() => decideNonfunctionalRound({ ...base, closedRounds: [closed(2, 'continue')] })).toThrow('consecutive');
    expect(decideNonfunctionalRound({ ...base, candidate: null, closedRounds: [closed(1, 'continue'), closed(2, 'continue'), closed(3, 'continue')] })).toEqual({ action: 'prepare-candidate', round: 4, phase: 'initial' });
    expect(decideNonfunctionalRound({ ...base, maxRounds: 1, candidate: null, closedRounds: [closed(1, 'continue'), closed(2, 'continue')] })).toEqual({ action: 'prepare-candidate', round: 3, phase: 'initial' });
    expect(() => decideNonfunctionalRound({ ...base, closedRounds: [{ ...closed(1, 'continue'), repair: 'repair-001' }] })).toThrow('requires reassessment');
    expect(() => decideNonfunctionalRound({ ...base, closedRounds: [{ ...closed(1, 'continue'), reassessment: 'nfa-002' }] })).toThrow('requires repair');
  });
});
