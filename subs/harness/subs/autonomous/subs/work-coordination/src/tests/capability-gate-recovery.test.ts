import { afterEach, test } from 'vitest';
import { runAcceptedHandback } from '../../../../../../src/tests/helpers/acceptance-flow.js';

const cleanup: Array<() => Promise<void>> = [];
afterEach(async () => { for (const close of cleanup.splice(0).reverse()) await close(); });

test('a combined capability check pause resumes the accepted handback boundary without repeating provider or consumer engineer work',
  () => runAcceptedHandback('deferred', cleanup, false, undefined, true), 60_000);
