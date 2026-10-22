import { createHash } from 'node:crypto';
import { expect, test } from 'vitest';
import { invocationSchema } from '../../../task-execution/src/records.js';
import { evaluationOf } from '../metrics.js';

// Split from parent composition: the same recorded input, with no run coordination.
test('plain efficiency projections retain original checkpoint and skill identities, unknown scope and complete current scope without inventing charges', () => {
  const skill = 'Exact supplied skill bytes\n';
  const hash = createHash('sha256').update(skill).digest('hex');
  const point = { sessionId: 'original-session', kind: 'checkpoint' as const, turn: 2, checkpoint: 'original-brief' };
  const manifest = { schema: 'ramify-agent.delivered-inputs/2', inheritedPoint: null, hash,
    entries: [{ key: 'supplied-skill', kind: 'skill', source: 'skills/supplied/SKILL.md', revision: 'recorded-r1', hash, bytes: Buffer.byteLength(skill), delivery: 'appended', sources: [] }],
    currentMessage: { hash, bytes: Buffer.byteLength(skill) } };
  const oldSize = { policy: 'scope-size/2', snapshot: 'ms-original', bytes: null, subtotal: 0, coverage: 'partial',
    components: [{ component: 'owned-source', detail: 'Original source unavailable', state: 'unknown', bytes: null, reason: 'Not captured in the original record' }] };
  const invocation = invocationSchema.parse({ schema: 'ramify-agent.invocation/1', id: 'original-op', role: 'engineer', work: {}, attempt: 1,
    session: { requested: 'continued', actual: 'continued', ref: 'original-brief', from: 'original-brief' },
    sessionOperation: { runId: 'original-run', operationId: 'original-op', sessionId: point.sessionId, turn: 3, sourcePoint: point, point },
    prompt: { package: 'engineer', hash, inputsHash: hash, manifest }, scope: { write: null, measurement: null, size: oldSize },
    writer: false, base: 'original-base', startedAt: '2026-10-08T00:00:00.000Z' });
  const projected = evaluationOf({ invocation, outcome: null, observations: [], lines: null }).efficiency!;
  expect(projected.operation?.point).toEqual(point);
  expect(projected.manifest).toEqual(manifest);
  expect(projected.declared).toEqual(oldSize);
  expect(projected.chargeTotal).toBeNull();
  expect(projected.charges).toEqual([]);
  projected.manifest!.entries[0]!.sources.push({ path: 'client-only', hash, bytes: 0 });
  expect(evaluationOf({ invocation, outcome: null, observations: [], lines: null }).efficiency?.manifest).toEqual(manifest);
  const currentSize = { ...oldSize, policy: 'scope-size/2' as const, bytes: 7, subtotal: 7, coverage: 'complete' as const,
    components: [{ component: 'owned-source' as const, detail: 'Exact current source', state: 'measured' as const, bytes: 7 }] };
  expect(evaluationOf({ invocation: { ...invocation, scope: { ...invocation.scope, size: currentSize } }, outcome: null, observations: [], lines: null }).efficiency?.declared).toEqual(currentSize);
  const retiredManifest = { ...manifest, schema: manifest.schema.replace(/2$/, '1') };
  expect(() => evaluationOf({ invocation: { ...invocation, prompt: { ...invocation.prompt, manifest: retiredManifest } }, outcome: null, observations: [], lines: null })).toThrow('Delivered manifest for invocation original-op: expected ramify-agent.delivered-inputs/2');
  const retiredSize = { ...oldSize, policy: oldSize.policy.replace(/2$/, '1') };
  expect(() => evaluationOf({ invocation: { ...invocation, scope: { ...invocation.scope, size: retiredSize as unknown as NonNullable<typeof invocation.scope.size> } }, outcome: null, observations: [], lines: null })).toThrow('Run measurement for invocation original-op: expected scope-size/2');
});
