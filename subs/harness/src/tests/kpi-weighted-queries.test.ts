import { test } from 'vitest';
import { weightedQueryFixture } from './helpers/kpi-weighted-queries.js';

test('sc-002: public metrics preserve independent weighted arithmetic and writer evidence', async () => {
  const fixture = await weightedQueryFixture('complete');
  try { await fixture.exercise(); fixture.arithmetic(); fixture.ratios(); fixture.evidence(); } finally { await fixture.close(); }
});
test('sc-003: public metrics retain unknown source qualification and known subtotal', async () => {
  const fixture = await weightedQueryFixture('missing');
  try { await fixture.exercise(); fixture.unavailable(); fixture.subtotal(); fixture.missing(); fixture.notZero(); } finally { await fixture.close(); }
});
test('sc-004: public metrics distinguish known-zero delivery from failed history without losing recorded costs', async () => {
  const fixture = await weightedQueryFixture('zero');
  try { await fixture.exercise(); fixture.zero(); fixture.costs(); await fixture.failedHistory(); } finally { await fixture.close(); }
});
