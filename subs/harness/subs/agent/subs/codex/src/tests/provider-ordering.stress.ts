import { test } from 'vitest';
import { checkAdmissionOrdering, checkTerminalReplyOrdering } from './ordering.js';

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

test('terminal reply permutations and newer independent evidence preserve terminal identity across statuses and dispatch boundaries', async () => {
  for (const terminal of ['completed', 'interrupted', 'failed'] as const) for (const batch of [false, true]) {
    for (const order of permutations(['ack', 'same-start', 'idle'])) await checkTerminalReplyOrdering(order, 'idle', null, batch, terminal);
    for (const [order, expected, identity] of [
      [['ack', 'other-start', 'same-start'], 'active', 'other'],
      [['ack', 'same-start', 'other-start'], 'active', 'other'],
      [['same-start', 'ack', 'other-start'], 'active', 'other'],
      [['other-start', 'ack', 'same-start'], 'active', 'other'],
      [['ack', 'other-start', 'same-start', 'idle'], 'active', 'other'],
      [['ack', 'other-start', 'other-complete', 'same-start'], 'idle', null],
      [['ack', 'active', 'same-start'], 'active', null],
      [['ack', 'same-start', 'active'], 'active', null],
      [['same-start', 'active', 'ack'], 'idle', null],
      [['ack', 'systemError', 'same-start'], 'systemError', null],
      [['ack', 'notLoaded', 'same-start'], 'notLoaded', null],
      [['same-start', 'systemError', 'ack'], 'systemError', null],
    ] as const) await checkTerminalReplyOrdering(order, expected, identity, batch, terminal);
  }
});
