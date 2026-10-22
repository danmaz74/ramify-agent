import { describe, expect, test } from 'vitest';
import { reportSourceLines } from '../work/obligations.js';
import { fixtureProjection, reported, submissionHash } from './helpers/obligations.js';

describe('PB3-C06: the accepted source since a report', () => {
  test('a report made against earlier accepted source is shown beside it as provenance; one against the current source is not', () => {
    const report = reported({ id: 'scenario:keep-history-is-used', judgment: 'done', basedOnRevision: 0, revision: 1, by: 'inv-0005', submission: submissionHash('d') });
    const owned = [...fixtureProjection([report]).obligations.values()];
    const lines = reportSourceLines(owned, () => 'revision-01', 'revision-02');
    expect(lines[0]).toBe('# Accepted source since your reports');
    expect(lines.filter(line => line.startsWith('- '))).toEqual(['- scenario:keep-history-is-used: last reported done against accepted source revision-01']);
    expect(reportSourceLines(owned, () => 'revision-02', 'revision-02')).toEqual([]);
  });
});
