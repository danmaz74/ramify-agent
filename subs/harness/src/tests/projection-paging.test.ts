import { test } from 'vitest';
import { recordedProjectionPaging } from './helpers/projection-paging.js';

test('real child and HTTP preserve execution/transcript boundaries and changed-session polling', async () => {
  const fixture = await recordedProjectionPaging();
  try { await fixture.boundaries(); } finally { await fixture.close(); }
});
test('real child and HTTP retain stale-version and invalid-cursor refusals', async () => {
  const fixture = await recordedProjectionPaging();
  try { await fixture.refusals(); } finally { await fixture.close(); }
});
test('finished-session cached answers repeat without file or external effects', async () => {
  const fixture = await recordedProjectionPaging();
  try { await fixture.cache(); } finally { await fixture.close(); }
});
