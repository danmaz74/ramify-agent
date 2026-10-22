import { describe, expect, it } from 'vitest';
import { assessmentCoverage, assessmentSchema, assessedCandidateMatches, candidateSchema } from '../interfaces/contracts.js';

const candidate = candidateSchema.parse({ tree: 'a'.repeat(40), head: 'commit-1', preparedAt: '2026-09-25T12:00:00.000Z' });
const assessment = assessmentSchema.parse({
  schema: 'ramify-agent.nonfunctional-assessment/2', id: 'nfa-001', candidate, round: 1,
  phase: 'initial', coordinatorInvocation: 'inv-0001',
  results: [{ nfr: 'non-functional-requirement:response-time', result: 'undetermined', inspectedScope: ['src'], evidence: [], uncertainty: 'Needs an intermediate observation' }],
});

describe('assessment identity and coverage', () => {
  it('requires every NFR once for the exact candidate tree', () => {
    expect(assessmentCoverage(assessment, ['non-functional-requirement:response-time'])).toEqual([]);
    expect(assessmentCoverage(assessment, ['non-functional-requirement:response-time', 'non-functional-requirement:uptime'])).toEqual(['missing non-functional-requirement:uptime']);
    expect(assessmentCoverage({ ...assessment, results: [...assessment.results, assessment.results[0]!] }, ['non-functional-requirement:response-time'])).toEqual(['duplicate non-functional-requirement:response-time']);
    expect(assessedCandidateMatches(assessment, candidate.tree)).toBe(true);
    expect(assessedCandidateMatches(assessment, 'b'.repeat(40))).toBe(false);
  });

  it('requires an explicit empty assessment when no NFR exists', () => {
    const empty = assessmentSchema.parse({ ...assessment, results: [] });
    expect(assessmentCoverage(empty, [])).toEqual([]);
    expect(candidateSchema.safeParse({ ...candidate, tree: 'c'.repeat(63) }).success).toBe(false);
  });
});
