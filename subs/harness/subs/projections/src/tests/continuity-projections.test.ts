import { expect, test } from 'vitest';
import { invocationEvaluationSchema } from '../../../../src/interfaces/protocol/runs.js';
import { transcriptEntrySchema } from '../../../../src/interfaces/protocol/transcripts.js';
import { evaluationOf } from '../metrics.js';
import { observationSchema } from '../../../task-execution/src/observations.js';
import { invocationSchema } from '../../../task-execution/src/records.js';
const at = '2026-10-13T06:00:00.000Z';
const nativeSettings = { source: 'pi@1.3.0:SettingsManager' as const, compaction: { enabled: true, reserveTokens: 16384, keepRecentTokens: 20000 },
  occupancy: 'current' as const, projectedTokens: null, coverage: ['Projected request size unavailable'] };
const invocation = invocationSchema.parse({ schema: 'ramify-agent.invocation/1', id: 'inv-0001', role: 'reviewer', work: { request: 'review-frozen' },
  attempt: 1, session: { requested: 'fresh', actual: 'fresh', ref: '' }, prompt: { package: 'reviewer', hash: 'a'.repeat(64), inputsHash: 'a'.repeat(64) },
  scope: { write: null, measurement: null, size: null }, writer: false, base: 'frozen', startedAt: at });

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
