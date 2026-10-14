import { describe, expect, test } from 'vitest';
import { standaloneSessionState, type SessionOutcomeRecord } from '../standalone-records.js';

describe('a standalone session', () => {
  test('is finished once its outcome is written, and interrupted without one', () => {
    expect(standaloneSessionState({ session: 'x' } as unknown as SessionOutcomeRecord)).toBe('finished');
    expect(standaloneSessionState(null)).toBe('interrupted');
  });
});
