import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { invocationEvaluationSchema } from '../../../../src/interfaces/protocol/runs.js';
import { evaluationOf, outsideScopeEvidenceOf, readObservationLog } from '../metrics.js';
import type { Observation } from '../../../task-execution/src/observations.js';
import { invocationOutcomeSchema, invocationSchema } from '../../../task-execution/src/records.js';
import { hash } from '../../../../src/tests/helpers/constructed.js';

const paths = ['subs/validation/README.md', 'subs/validation/module.ramify'];
const at = '2026-10-11T15:00:00.000Z';
const snapshot: Observation = { n: 258, at, type: 'mutation', data: {
  callId: null, paths, added: null, deleted: null, observedBy: 'snapshot', toolFailed: false, attributable: false,
} };
const invocation = invocationSchema.parse({ schema: 'ramify-agent.invocation/1', id: 'inv-0012', role: 'engineer',
  work: { workItem: 'wi-001', iteration: 'wi-001.i01' }, attempt: 1,
  session: { requested: 'fresh', actual: 'fresh', ref: '' }, prompt: { package: 'engineer', hash, inputsHash: hash },
  scope: { write: null, measurement: null, size: null }, writer: true, base: 'before', startedAt: at,
});
const outcome = invocationOutcomeSchema.parse({ schema: 'ramify-agent.invocation-outcome/1', invocation: invocation.id,
  ended: 'submitted', rejectedSubmissions: 0, disposition: 'applied', submission: null,
  settled: { confirmed: true, at, groupsKilled: 0, lateWrites: [] }, outsideScope: paths, usage: { unavailable: 'scripted' }, elapsedMs: 1,
});
const directories: string[] = [];
afterEach(async () => { for (const directory of directories.splice(0)) await rm(directory, { recursive: true, force: true }); });

test('a recorded tool mutation establishes attribution while retaining the separate candidate snapshot', () => {
  const tool: Observation = { ...snapshot, n: 257, data: { ...snapshot.data, paths: [paths[0]!], observedBy: 'tool', callId: 'write-1', attributable: true } };
  const evidence = outsideScopeEvidenceOf(paths, [tool, snapshot]);
  expect(evidence[0]).toMatchObject({ attributable: true, observations: [
    { number: 257, observedBy: 'tool', callId: 'write-1', attributable: true },
    { number: 258, observedBy: 'snapshot', attributable: false },
  ] });
  expect(evidence[1]!.attributable).toBe(false);
});

test.each([[], { unavailable: 'observations.jsonl is missing' }])('older outcomes without mutation evidence retain unknown attribution (%j)', observations => {
  const evaluation = invocationEvaluationSchema.parse(evaluationOf({ invocation, outcome, observations, lines: null }));
  expect(evaluation.outsideScope).toEqual(paths);
  expect(evaluation.outsideScopeEvidence).toEqual(paths.map(path => ({ path, attributable: null, observations: [], uncertainty: expect.any(String) })));
  const { outsideScopeEvidence: ignored, ...olderResponse } = evaluation;
  expect(invocationEvaluationSchema.parse(olderResponse).outsideScopeEvidence).toBeUndefined();
});

test('corrupt mutation rows preserve known snapshot provenance and explicitly incomplete attribution', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'plan36-attribution-corrupt-'));
  directories.push(directory);
  const path = join(directory, 'observations.jsonl');
  await writeFile(path, `{corrupt}\n${JSON.stringify(snapshot)}\n`);
  const observations = await readObservationLog(path, 'observations.jsonl');
  const evidence = outsideScopeEvidenceOf(paths, observations);
  expect(evidence[0]).toMatchObject({ attributable: false, observations: [{ number: 258, observedBy: 'snapshot', attributable: false }],
    uncertainty: expect.stringContaining('1 unreadable rows'),
  });
  await writeFile(path, '{corrupt}\n');
  expect(outsideScopeEvidenceOf(paths, await readObservationLog(path, 'observations.jsonl'))[0]).toMatchObject({
    attributable: null, observations: [], uncertainty: expect.stringContaining('Mutation evidence is incomplete'),
  });
});

test('unknown current placement retains mutation attribution without becoming an outside-scope metric', () => {
  const unknown = invocationOutcomeSchema.parse({ ...outcome, outsideScope: [], unknownPlacement: paths, placementFailure: 'Invalid acquisition' });
  const value = invocationEvaluationSchema.parse(evaluationOf({ invocation, outcome: unknown, observations: [snapshot], lines: null }));
  expect(value.outsideScope).toEqual([]);
  expect(value.outsideScopeEvidence).toEqual([]);
  expect(value.unknownPlacement).toEqual(paths);
  expect(value.placementFailure).toBe('Invalid acquisition');
  expect(value.unknownPlacementEvidence).toEqual(paths.map(path => ({ path, attributable: false, observations: [{ number: 258, callId: null, observedBy: 'snapshot', attributable: false }], uncertainty: null })));
});
