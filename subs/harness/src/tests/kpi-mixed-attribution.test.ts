import { test, expect } from 'vitest';
import { assertMixedEvidence, mixedSetupInput, mixedAttributionFixture } from './helpers/kpi-mixed-attribution.js';

test('literal oracle rejects shifted positions, wrong bytes/origins and incomplete direct ranges independently of KPI', () => {
  for (const mode of ['surviving', 'reverted', 'unknown'] as const) assertMixedEvidence(mode);
  const input = mixedSetupInput();
  const fact = input.facts[0]!;
  for (const badLine of [
    { ...fact.finalAdded![0]!, line: 5 },
    { ...fact.finalAdded![0]!, hash: 'bad-line-bytes' },
    { ...fact.finalAdded![0]!, originCommit: input.final },
    { ...fact.finalAdded![0]!, originLine: 3 },
  ]) expect(() => assertMixedEvidence('surviving', { ...input, facts: [{ ...fact, finalAdded: [badLine, fact.finalAdded![1]!] }] })).toThrow();
  expect(() => assertMixedEvidence('surviving', { ...input, records: [{ ...input.records[0]!, beforeBlobHash: 'bad-blob' }] })).toThrow();
  expect(() => assertMixedEvidence('surviving', { ...input, facts: [{ ...fact, baseDeleted: fact.baseDeleted!.map(line => ({ ...line, removingCommit: input.final })) }] })).toThrow();
  expect(() => assertMixedEvidence('surviving', input, [
    { before: 'src/mixed.ts', after: 'src/mixed.ts', binary: false, added: [[2, 1]], deleted: [[2, 2]] },
    { before: 'src/overlap.ts', after: 'src/overlap.ts', binary: false, added: [[1, 2]], deleted: [] },
  ])).toThrow();
});

test('real setup verifier feeds accepted-final delivered change with exact mixed-path weights, reverts and uncertainty', async () => {
  const fixture = mixedAttributionFixture();
  fixture.authenticate();
  await fixture.exercise();
  fixture.exact();
  await fixture.reverts();
  await fixture.uncertainty();
});
