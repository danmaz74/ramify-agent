import { test } from 'vitest';
import { scopeCollectionFixture } from './helpers/kpi-scope-collection.js';

test('execution adapters preserve repeated delivered identities, overlapping scopes and incompatible revisions through real capture', async () => {
  const fixture = scopeCollectionFixture();
  await fixture.collect();
  fixture.identities();
  fixture.captured();
  fixture.incompatible();
});
