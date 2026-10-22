import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { invocationEvaluationSchema } from '../../../../src/interfaces/protocol/runs.js';
import { transcriptEntrySchema } from '../../../../src/interfaces/protocol/transcripts.js';
import { evaluationOf, readObservationLog } from '../metrics.js';
import { observationSchema } from '../../../task-execution/src/observations.js';
import { invocationSchema } from '../../../task-execution/src/records.js';
const at = '2026-10-13T06:00:00.000Z';
const nativeSettings = { source: 'pi@1.3.0:SettingsManager' as const, compaction: { enabled: true, reserveTokens: 16384, keepRecentTokens: 20000 },
  occupancy: 'current' as const, projectedTokens: null, coverage: ['Projected request size unavailable'] };
const invocation = invocationSchema.parse({ schema: 'ramify-agent.invocation/1', id: 'inv-0001', role: 'reviewer', work: { request: 'review-frozen' },
  attempt: 1, session: { requested: 'fresh', actual: 'fresh', ref: '' }, prompt: { package: 'reviewer', hash: 'a'.repeat(64), inputsHash: 'a'.repeat(64) },
  scope: { write: null, measurement: null, size: null }, writer: false, base: 'frozen', startedAt: at });

test('projection refuses a complete retired-source observation while preserving malformed-row coverage', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'ramify-context-projection-'));
  const path = join(directory, 'observations.jsonl');
  try {
    const current = observationSchema.parse({ n: 1, at, type: 'context', data: { tokens: 10, window: 100, threshold: null, native: nativeSettings } });
    const retired = { ...current, n: 2, data: { ...current.data, native: { ...nativeSettings, source: nativeSettings.source.replace('1.3.0', [0, 87, 1].join('.')) } } };
    await writeFile(path, `${JSON.stringify(current)}\n${JSON.stringify(retired)}\n`);
    await expect(readObservationLog(path, 'observations.jsonl')).rejects.toThrow('observations.jsonl observation record: expected pi@1.3.0:SettingsManager');
    const nullSource = { ...current, n: 2, data: { ...current.data, native: { ...nativeSettings, source: null } } };
    const numericSource = { n: 3, at, type: 'compaction', data: { native: { source: 87 } } };
    await writeFile(path, `${JSON.stringify(current)}\n${JSON.stringify(nullSource)}\n${JSON.stringify(numericSource)}\n{malformed}\npartial`);
    const recovered = await readObservationLog(path, 'observations.jsonl');
    expect(Array.isArray(recovered) ? recovered.map(row => row.type) : recovered).toEqual(['context', 'coverage-gap']);
    if (Array.isArray(recovered)) expect(recovered[1]).toMatchObject({ data: { kind: 'observation-truncated', detail: expect.stringContaining('3 unreadable rows') } });
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('context projection preserves Pi settings, missing estimates and failed compaction without manufacturing usage', () => {
  const source = 'pi@1.3.0:SettingsManager' as const;
  const native = { ...nativeSettings, source };
  const observations = [observationSchema.parse({ n: 1, at, type: 'context', data: { tokens: null, window: null, threshold: null, native } }),
    observationSchema.parse({ n: 2, at, type: 'compaction', data: { trigger: 'overflow', succeeded: false, before: null, after: null, error: 'Summary unavailable', native } })];
  const projected = invocationEvaluationSchema.parse(evaluationOf({ invocation, observations, outcome: null, lines: null }));
  expect(projected.context).toEqual({ observations: [{ at, tokens: null, window: null, native }],
    compactions: [{ at, trigger: 'overflow', succeeded: false, before: null, after: null, error: 'Summary unavailable', native }], coverage: [] });
  expect(projected.usage).toEqual({ unavailable: 'the invocation has not ended' });
  expect(projected.ended).toBeNull();
  expect(JSON.stringify(projected.context)).not.toContain('188000');
});
test('missing context observations are a coverage gap and compaction transcript settings remain readable', () => {
  const projected = invocationEvaluationSchema.parse(evaluationOf({ invocation, observations: [], outcome: null, lines: null }));
  expect(projected.context).toEqual({ observations: [], compactions: [], coverage: ['Current context occupancy and model window were not observed'] });
  const native = nativeSettings;
  const entry = { n: 1, at, type: 'compaction', invocation: invocation.id, phase: 'ended', reason: 'overflow', tokensBefore: null,
    tokensAfter: null, aborted: false, errorText: 'Summary unavailable', native };
  expect(transcriptEntrySchema.parse(entry)).toEqual(entry);
  const { native: _legacyMissing, ...historical } = entry;
  expect(transcriptEntrySchema.parse(historical)).toEqual(historical);
});
