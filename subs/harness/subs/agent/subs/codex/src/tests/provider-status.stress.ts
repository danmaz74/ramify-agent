import { test } from 'vitest';
import { checkStatusOutcome } from './status-outcomes.js';

test('all 64 status/outcome/history traces preserve provider observations independently of admission', async () => {
  for (const outcome of ['rejected', 'running', 'completed', 'uncertain'] as const)
    for (const status of ['active', 'idle', 'systemError', 'notLoaded'] as const)
      for (const position of ['before', 'after'] as const)
        for (const history of ['idle', 'active'] as const)
          await checkStatusOutcome(outcome, status, position, history);
});
