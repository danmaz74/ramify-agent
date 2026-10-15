import { it } from 'vitest';
import { rootQualificationFixture } from './helpers/root-qualification.js';

it('sc-010 real root collector/verifier and destination contracts retain baseline behavior', async () => {
  const fixture = await rootQualificationFixture();
  try {
    await fixture.exercise();
    fixture.compatibility();
    await fixture.protection();
    await fixture.browser();
  } finally { await fixture.close(); }
});
