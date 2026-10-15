import { test } from 'vitest';
import { historyUsageFixture, assertLineage, assertUsage } from './helpers/kpi-history-usage.js';
import { reopenedKpiFixture } from './helpers/kpi-reopened-queries.js';

test('actual fresh fallback, local fork and unknown start compose through real metrics and session queries', async () => {
  const fixture = await historyUsageFixture('lineage');
  try { assertLineage(await fixture.exercise()); } finally { await fixture.close(); }
});
test('recorded usage categories, partial charges and replay/conflict/unknown searches compose through session evaluation', async () => {
  const fixture = await historyUsageFixture('usage');
  try { assertUsage(await fixture.exercise()); } finally { await fixture.close(); }
});
test('reopened metric/session HTTP and in-process reads preserve durable bytes and sequence without acquisition', async () => {
  const fixture = await reopenedKpiFixture();
  try { await fixture.capture(); await fixture.reopen(); fixture.compatible(); await fixture.unchanged(); fixture.noAcquisition(); }
  finally { await fixture.close(); }
});
