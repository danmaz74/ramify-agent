import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { ObservationLog } from '../observations.js';
import { PortEventRecorder } from '../port-events.js';
import { ExcursionWatcher } from '../excursions.js';

test('current Pi context settings and compaction failure remain honest evidence without a harness threshold', async () => {
  const source = 'pi@1.3.0:SettingsManager' as const;
  const directory = await mkdtemp(join(tmpdir(), 'ramify-context-observation-'));
  try {
    const observations = await ObservationLog.open(join(directory, 'observations.jsonl'));
    const recorder = new PortEventRecorder({ projectRoot: directory, observations,
      context: { compaction: 'allowed', budgetTokens: 150000, budgetFraction: 0.7, reportReserveTokens: 2400 },
      excursions: new ExcursionWatcher({ projectRoot: directory, index: null, scope: undefined }),
      judge: { countImplementationRejection: () => async () => undefined } });
    const native = { source,
      compaction: { enabled: true, reserveTokens: 16384, keepRecentTokens: 20000 }, occupancy: 'current' as const,
      projectedTokens: null, coverage: ['Projected request estimator is unavailable through the installed public API'] };
    await recorder.record({ type: 'context-observed', tokens: 205728, window: 272000, native });
    await recorder.record({ type: 'compaction', phase: 'ended', reason: 'overflow', tokensBefore: 205728,
      tokensAfter: null, aborted: false, errorText: 'Compaction provider unavailable', native });
    expect(observations.observations).toEqual([
      expect.objectContaining({ type: 'context', data: { tokens: 205728, window: 272000, threshold: null, native } }),
      expect.objectContaining({ type: 'compaction', data: { trigger: 'overflow', succeeded: false, before: 205728,
        after: null, error: 'Compaction provider unavailable', native } }),
    ]);
    const reopened = await ObservationLog.open(join(directory, 'observations.jsonl'));
    expect(reopened.observations).toEqual(observations.observations);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('reopening a complete observation with a retired native source refuses the log', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ramify-context-replay-'));
  const path = join(directory, 'observations.jsonl');
  try {
    const log = await ObservationLog.open(path);
    await log.record({ type: 'context', data: { tokens: 10, window: 100, threshold: null,
      native: { source: 'pi@1.3.0:SettingsManager', compaction: { enabled: true, reserveTokens: 16, keepRecentTokens: 20 },
        occupancy: 'current', projectedTokens: null, coverage: [] } } });
    const current = JSON.parse((await readFile(path, 'utf8')).trim()) as { data: { native: { source: string } } };
    const retired = { ...current, data: { ...current.data, native: { ...current.data.native, source: current.data.native.source.replace('1.3.0', [0, 87, 1].join('.')) } } };
    await writeFile(path, `${JSON.stringify(current)}\n${JSON.stringify(retired)}\n`);
    await expect(ObservationLog.open(path)).rejects.toThrow(`${path} observation record: expected pi@1.3.0:SettingsManager`);
    await writeFile(path, `${JSON.stringify(current)}\n{malformed}\npartial`);
    const recovered = await ObservationLog.open(path);
    expect(recovered.observations.map(row => row.type)).toEqual(['context', 'coverage-gap']);
    expect(recovered.observations[1]).toMatchObject({ data: { kind: 'observation-truncated', detail: expect.stringContaining('1 unreadable rows') } });
  } finally { await rm(directory, { recursive: true, force: true }); }
});
