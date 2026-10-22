import { test } from 'vitest';
import { recordedProjectionAuthority } from './helpers/projection-authority.js';

// Same concrete retained-record witness as the real sc005 Cucumber bindings.
test('extracted progress, scenarios and metrics retain authority and same-run provenance without writes', async () => {
  const fixture = await recordedProjectionAuthority();
  try {
    fixture.sameRunSources();
    await fixture.exercise();
    fixture.authority();
    fixture.provenance();
    await fixture.unchanged();
  } finally { await fixture.close(); }
});
