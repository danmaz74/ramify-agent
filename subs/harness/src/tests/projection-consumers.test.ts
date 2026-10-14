import { test } from 'vitest';
import { recordedProjectionConsumers } from './helpers/projection-consumers.js';

test('sc-001/sc-002 real child HTTP/CLI queries preserve retained answers and cause no effects', async () => {
  const fixture = await recordedProjectionConsumers();
  try {
    await fixture.capture();
    await fixture.exercise();
    await fixture.composition();
    await fixture.oldTreeAbsent();
    await fixture.unchanged();
    fixture.noEffects();
  } finally { await fixture.close(); }
}, 60_000);
