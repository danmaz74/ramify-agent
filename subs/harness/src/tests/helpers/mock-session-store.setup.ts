import { afterAll, vi } from 'vitest';
import { forgetMemorySessionStores } from '../../../subs/session-store/src/tests/helpers/memory-session-store.js';

// Real workflow/session logic, with a cheap persistence boundary. Small tests
// of the disk adapter explicitly unmock their own subject.
vi.mock('../../../subs/session-store/src/session-store.js', async () => {
  const { openMemorySessionStore } = await import('../../../subs/session-store/src/tests/helpers/memory-session-store.js');
  return { openSessionStore: openMemorySessionStore };
});
afterAll(forgetMemorySessionStores);
