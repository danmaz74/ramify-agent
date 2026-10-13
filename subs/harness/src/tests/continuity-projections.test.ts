import { expect, test } from 'vitest';
import { invocationEvaluationSchema } from '../interfaces/protocol/runs.js';
import { transcriptEntrySchema } from '../interfaces/protocol/transcripts.js';
import { evaluationOf } from '../projections/metrics.js';
import { observationSchema } from '../run/observations.js';
import { invocationSchema } from '../run/records.js';
const at = '2026-10-13T06:00:00.000Z';
const native = { source: 'pi@0.87.1:SettingsManager' as const, compaction: { enabled: true, reserveTokens: 16384, keepRecentTokens: 20000 },
  occupancy: 'current' as const, projectedTokens: null, coverage: ['Projected request size unavailable'] };
const invocation = invocationSchema.parse({ schema: 'ramify-agent.invocation/1', id: 'inv-0001', role: 'reviewer', work: { request: 'review-frozen' },
  attempt: 1, session: { requested: 'fresh', actual: 'fresh', ref: '' }, prompt: { package: 'reviewer', hash: 'a'.repeat(64), inputsHash: 'a'.repeat(64) },
  scope: { write: null, measurement: null, size: null }, writer: false, base: 'frozen', startedAt: at });

test('context projection preserves native settings, missing estimates and failed compaction without manufacturing usage', () => {
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
  const entry = { n: 1, at, type: 'compaction', invocation: invocation.id, phase: 'ended', reason: 'overflow', tokensBefore: null,
    tokensAfter: null, aborted: false, errorText: 'Summary unavailable', native };
  expect(transcriptEntrySchema.parse(entry)).toEqual(entry);
  const { native: _legacyMissing, ...historical } = entry;
  expect(transcriptEntrySchema.parse(historical)).toEqual(historical);
});

test.each(['run-policy/7', 'run-policy/8'])('standalone compatibility reader accepts %s and retains resource-pending as suspended without rewriting records', async version => {
  const { readFile, writeFile } = await import('node:fs/promises');
  const { join } = await import('node:path');
  const { temporaryDirectory } = await import('./helpers/fixture.js');
  const { installLegacySessions } = await import('./helpers/legacy-sessions.js');
  const { SessionQueries } = await import('../projections/session-queries.js');
  const { sessionsDirectory, sessionLayout } = await import('../projections/standalone-records.js');
  const made = await temporaryDirectory();
  try {
    const ids = await installLegacySessions(made.path);
    const directory = join(made.path, sessionsDirectory, ids.finished);
    const recordPath = join(directory, sessionLayout.session);
    const outcomePath = join(directory, sessionLayout.outcome);
    const record = JSON.parse(await readFile(recordPath, 'utf8'));
    const outcome = JSON.parse(await readFile(outcomePath, 'utf8'));
    await writeFile(recordPath, JSON.stringify({ ...record, policy: { ...record.policy, version } }));
    await writeFile(outcomePath, JSON.stringify({ ...outcome, ended: 'resource-pending', submission: null }));
    const before = [await readFile(recordPath, 'utf8'), await readFile(outcomePath, 'utf8')];
    const source = { projectRoot: made.path, agentName: undefined, committed: () => undefined, committedRuns: () => [], runVersions: () => [] };
    const queries = new SessionQueries(source);
    const pending = await queries.standaloneSession(ids.finished);
    expect(pending.session.state).toBe('suspended');
    expect(pending.outcome?.ended).toBe('resource-pending');
    expect([await readFile(recordPath, 'utf8'), await readFile(outcomePath, 'utf8')]).toEqual(before);
    // Resource-pending is not cached as terminal; later owner completion is read.
    await writeFile(outcomePath, JSON.stringify(outcome));
    expect((await queries.standaloneSession(ids.finished)).outcome?.ended).toBe('submitted');
  } finally { await made.remove(); }
});
