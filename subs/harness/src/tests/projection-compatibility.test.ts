import { test } from 'vitest';
import { recordedCompatibility } from './helpers/projection-compatibility.js';

test('sc-004 real service reopening retains supported answers, explicit refusals and query boundaries', async () => {
  const fixture = await recordedCompatibility();
  try { await fixture.reopen(); await fixture.supported(); await fixture.refused(); await fixture.unchanged(); }
  finally { await fixture.close(); }
}, 60_000);
