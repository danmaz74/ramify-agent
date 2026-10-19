import { test } from 'vitest';
import { checkAdmissionOrdering } from './ordering.js';

function* permutations(values: readonly string[]): Generator<string[]> {
  if (values.length === 0) { yield []; return; }
  for (const [index, value] of values.entries()) for (const tail of permutations(values.filter((_, i) => i !== index))) yield [value, ...tail];
}

test('all 120 running-turn permutations with interleaved continuations and one dispatch batch preserve busy and interruption through old events, new start, acknowledgement and idle', async () => {
  for (const order of permutations(['old-start', 'old-complete', 'new-start', 'ack', 'idle'])) for (const batch of [false, true]) await checkAdmissionOrdering(order, batch);
});

test('all 720 terminal-turn permutations with interleaved continuations and one dispatch batch require matching completion, including completion before acknowledgement or duplicate start', async () => {
  for (const order of permutations(['old-start', 'old-complete', 'new-start', 'new-complete', 'ack', 'idle'])) for (const batch of [false, true]) await checkAdmissionOrdering(order, batch);
});
