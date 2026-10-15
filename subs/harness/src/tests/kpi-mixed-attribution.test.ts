import { test } from 'vitest';
import { mixedAttributionFixture } from './helpers/kpi-mixed-attribution.js';

test('real setup verifier feeds accepted-final delivered change with exact mixed-path weights, reverts and uncertainty', async () => {
  const fixture = mixedAttributionFixture();
  fixture.authenticate();
  await fixture.exercise();
  fixture.exact();
  await fixture.reverts();
  await fixture.uncertainty();
});
