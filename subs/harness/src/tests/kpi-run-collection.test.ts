import { test } from 'vitest';
import { runCollectionFixture } from './helpers/kpi-run-collection.js';

test('real execution collects and persists KPI measurements for the composed HTTP readers', async () => {
  const fixture = await runCollectionFixture();
  try {
    await fixture.exercise();
    fixture.provider();
    await fixture.persisted();
    await fixture.http();
    await fixture.contracts();
  } finally { await fixture.close(); }
}, 60000);
