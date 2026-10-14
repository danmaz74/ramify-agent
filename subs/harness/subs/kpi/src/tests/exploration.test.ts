import { describe, expect, test } from 'vitest';
import { explorationDetails, type ExplorationObservation, type ExplorationMetrics } from '../exploration.js';
function explorationMetrics(input: readonly ExplorationObservation[], limits: readonly string[] = []): ExplorationMetrics {
  return explorationDetails(input, limits).metrics;
}
import { observation, fixture } from './exploration-fixtures.js';

describe('Plan23 F6 exploration over recorded calls only', () => {
  test('known returned bytes/duration, unique and repeated reads, and broad zero-match searches', () => {
    const { metrics, zeroMatchSearches } = explorationDetails(fixture);
    expect(metrics).toMatchObject({ reads: 3, uniqueFilesRead: 2, repeatedReads: 1, returnedBytes: 22,
      searches: 2, broadSearches: 1, outsideScopeSearches: 1, toolElapsedMs: 17 });
    expect(zeroMatchSearches).toBe(1);
    expect(metrics.coverage).toEqual(['["inv1","op1","session1",1,"r3","read"]: duration unknown']);
    expect(metrics).not.toHaveProperty('scannedBytes');
  });
  test('copied/replayed/inherited rows retain source identity; new operation/invocation/turn/kind adds a call', () => {
    const first = fixture[0]!;
    expect(explorationMetrics([first, { ...first, id: 'replayed' }, { ...first, id: 'inherited-copy' }])).toMatchObject({ reads: 1, returnedBytes: 10, toolElapsedMs: 5, coverage: [] });
    const additional = [{ ...first, operationId: 'op2' }, { ...first, invocationId: 'inv2' }, { ...first, turn: 2 }, { ...first, kind: 'search' as const }];
    expect(explorationMetrics([first, ...additional])).toMatchObject({ reads: 4, searches: 1, returnedBytes: 50 });
  });
  test('unknown bytes/files/breadth/duration and failed calls stay explicit, not fabricated zero evidence', () => {
    const metrics = explorationMetrics([observation('binary', { files: null, returnedBytes: null, elapsedMs: null, resolvedScope: null, outcome: 'failed', coverage: ['binary bytes not collected'] }),
      observation('search', { kind: 'search', files: null, broad: null, outsideScope: null })], ['observation log truncated']);
    expect(metrics).toMatchObject({ reads: 1, searches: 1, returnedBytes: 10 });
    expect(metrics.coverage.join('\n')).toContain('returned bytes unknown');
    expect(metrics.coverage.join('\n')).toContain('files read unknown');
    expect(metrics.coverage.join('\n')).toContain('duration unknown');
    expect(metrics.coverage.join('\n')).toContain('search breadth unknown');
    expect(metrics.coverage).toContain('observation log truncated');
    expect(explorationDetails([observation('s', { kind: 'search', files: null })]).zeroMatchSearches).toBe(0);
  });
  test('conflicting replays are excluded with a limit, and explicit timestamps give duration without scanned-byte estimates', () => {
    const first = fixture[0]!;
    expect(explorationMetrics([first, { ...first, returnedBytes: 11 }])).toMatchObject({ reads: 0, returnedBytes: 0, coverage: [expect.stringContaining('conflicting observations')] });
    expect(explorationMetrics([observation('t', { elapsedMs: null, startedAt: '2026-01-01T00:00:00.000Z', endedAt: '2026-01-01T00:00:00.010Z' })]).toolElapsedMs).toBe(10);
  });
});

describe('search counts publish their coverage', () => {
  const search = (id: string, extra: Partial<ExplorationObservation> = {}) => observation(id, { kind: 'search', files: ['a.ts'], ...extra });
  test('an unknown outside-scope status makes the count partial with its known subtotal, never zero', () => {
    const { metrics, searches } = explorationDetails([search('s1', { outsideScope: true }), search('s2', { outsideScope: false }),
      search('s3', { outsideScope: null }), search('s4', { outsideScope: null })]);
    expect(metrics.outsideScopeSearches).toBe(1);
    expect(searches.outsideScope).toEqual({ state: 'partial', known: 1, coverage: { covered: 2, total: 4 } });
    expect(searches.broad).toEqual({ state: 'measured', known: 0, coverage: { covered: 4, total: 4 } });
  });
  test('no known status is unavailable, and no search is not applicable', () => {
    expect(explorationDetails([search('s1', { outsideScope: null, broad: null })]).searches)
      .toMatchObject({ outsideScope: { state: 'unavailable', known: 0, coverage: { covered: 0, total: 1 } }, broad: { state: 'unavailable' } });
    expect(explorationDetails([observation('r1')]).searches)
      .toMatchObject({ completed: 0, failed: 0, outsideScope: { state: 'not-applicable', coverage: { covered: 0, total: 0 } } });
  });
  test('a failed search is counted apart and is not a zero-match search; unknown matches leave zero matches partial', () => {
    const { searches, zeroMatchSearches } = explorationDetails([search('found', { files: ['a.ts'] }), search('none', { files: [] }), search('unknown', { files: null }),
      search('missing-path', { outcome: 'failed', files: [], resolvedScope: null })]);
    expect(searches).toMatchObject({ completed: 3, failed: 1 });
    expect(zeroMatchSearches).toBe(1);
    expect(searches.zeroMatch).toEqual({ state: 'partial', known: 1, coverage: { covered: 2, total: 3 } });
  });
});
