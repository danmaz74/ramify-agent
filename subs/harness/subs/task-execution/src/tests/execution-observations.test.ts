import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { ObservationLog } from '../observations.js';
import { PortEventRecorder } from '../port-events.js';
import { ExcursionWatcher } from '../excursions.js';

test.each(['pi@0.87.1:SettingsManager', 'pi@1.3.0:SettingsManager'] as const)('%s context settings and compaction failure remain honest evidence without a harness threshold', async source => {
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
