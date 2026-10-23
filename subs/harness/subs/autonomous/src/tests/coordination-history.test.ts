import { join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { temporaryDirectory } from '../../../../src/tests/helpers/fixture.js';
import { coordinationHistory } from '../run/coordination-history.js';
import { RunLog } from '../run/log.js';

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0)) await cleanup(); });

test('the coordination history is one frozen object per log version', async () => {
  const directory = await temporaryDirectory();
  cleanups.push(directory.remove);
  const log = await RunLog.open(join(directory.path, 'events.jsonl'), '20261023T000000Z-000000');
  await log.append({ type: 'review-requested', data: {} });

  const first = coordinationHistory(log);
  expect(coordinationHistory(log)).toBe(first);
  expect(first.events).toBe(log.events);
  expect(Object.isFrozen(first)).toBe(true);
  expect(() => { (first.events as unknown[]).push(first.events[0]); }).toThrow(TypeError);

  await log.append({ type: 'review-requested', data: {} });
  const second = coordinationHistory(log);
  expect(second).not.toBe(first);
  expect(second.events.map(event => event.sequence)).toEqual([1, 2]);
  expect(first.events).toHaveLength(1);
});
