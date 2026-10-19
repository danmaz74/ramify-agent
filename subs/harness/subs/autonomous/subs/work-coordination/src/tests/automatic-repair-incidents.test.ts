import { afterEach, expect, test } from 'vitest';
import { join } from 'node:path';
import { RunLog } from '../../../../src/run/log.js';
import { temporaryDirectory } from '../../../../../../src/tests/helpers/fixture.js';

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0)) await cleanup(); });

test('terminal logs permit tracker export evidence and refuse a new repair invocation', async () => {
  const directory = await temporaryDirectory(); cleanups.push(directory.remove);
  const log = await RunLog.open(join(directory.path, 'events.jsonl'), '20260921T080000Z-c0ffee');
  await log.append({ type: 'job-stopped', data: { settled: true } });
  expect(log.next({ type: 'repair-export-recorded', data: { incidentId: 'apr-0001', revision: 2, state: 'exported' } }).type).toBe('repair-export-recorded');
  expect(() => log.next({ type: 'repair-incident-recorded', data: { incidentId: 'apr-0001', revision: 2, stage: 'running' } })).toThrow(/ended/);
});
