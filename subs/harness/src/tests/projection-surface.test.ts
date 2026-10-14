import { test } from 'vitest';
import { recordedProjectionSurface } from './helpers/projection-surface.js';

test('the extracted reader has named contracts, a read-only port and private Node implementation', async () => {
  // The generated API views are inspected by the focused feature after
  // materialization; this ordinary test also runs in a fresh checkout.
  const fixture = await recordedProjectionSurface(false);
  await fixture.importedConsumers();
  fixture.exposed();
  await fixture.readOnly();
  await fixture.privateToWeb();
  await fixture.discovered();
});
