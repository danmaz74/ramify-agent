import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { invocationEvaluationSchema, metricsResponseSchema, workItemResponseSchema } from '../interfaces/protocol/runs.js';
import { runView } from '../projections/inputs.js';
import { evaluationOf, metricsOf, outsideScopeEvidenceOf, readObservationLog } from '../projections/metrics.js';
import { workItemOf } from '../projections/work.js';
import type { Observation } from '../run/observations.js';
import { gateAttemptSchema, invocationOutcomeSchema, invocationSchema, runLayout } from '../run/records.js';
import { iterationAssignmentSchema, iterationResultSchema } from '../work/iterations.js';
import { constructedRecord, constructedRun, hash, item, reviews } from './helpers/constructed.js';

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
const attributedTool: Observation = { ...snapshot, n: 257, data: { ...snapshot.data,
  callId: 'write-1', observedBy: 'tool', attributable: true,
} };
const projectionObservations = [snapshot, attributedTool];
const directories: string[] = [];
afterEach(async () => { for (const directory of directories.splice(0)) await rm(directory, { recursive: true, force: true }); });

test.each(projectionObservations)('candidate differences preserve recorded provenance across metrics and work projections without changing settlement (%j)', async observation => {
  const directory = await mkdtemp(join(tmpdir(), 'plan36-attribution-'));
  directories.push(directory);
  const observationsPath = join(directory, runLayout.observations(invocation.id));
  await mkdir(dirname(observationsPath), { recursive: true });
  const bytes = `${JSON.stringify(observation)}\n`;
  await writeFile(observationsPath, bytes);
  const assignment = iterationAssignmentSchema.parse({ schema: 'ramify-agent.iteration-assignment/1', id: 'wi-001.i01', workItem: 'wi-001',
    outline: { id: 'wi-001', revision: 1, hash }, stage: 0, kind: 'ordinary', goal: 'Settle provider work.', approach: 'Implement provider.',
    scope: { revision: 1, base: { module: reviews, included: [] }, extra: [], read: [], bootstrap: [], rationale: 'Provider ownership.',
      resolved: { excluded: [], included: [], roots: [], files: [], view: { status: 'placeholder' },
        ownership: { provider: 'ramify.affected-cli/4', ramifyVersion: 'scripted', inputId: 'scope', configuration: 'tsconfig.json', root: '/p', modules: [{ id: 'app', parent: null, directory: '.' }], exclusions: [] } } },
    externalCapabilities: [], completionEvidence: 'Focused checks.', evidenceObligations: [], guarded: [], authorizations: [],
    gate: { checkpoint: 'iteration', tests: { policy: 'owned-by-scope', exactOwners: [], subtrees: [], extraSuites: [] } },
  });
  const result = iterationResultSchema.parse({ schema: 'ramify-agent.iteration-result/1', iteration: assignment.id,
    outcome: 'accepted', invocations: [invocation.id], gate: 'ga-001', commit: 'accepted', findings: [], changedAssumptions: [], artifacts: [],
  });
  const gate = gateAttemptSchema.parse({ schema: 'ramify-agent.gate-attempt/3', id: 'ga-001', checkpoint: 'iteration',
    subject: { workItem: 'wi-001', iteration: assignment.id }, proposedBy: invocation.id, repairRound: 0, infrastructureAttempt: 0,
    head: 'before', commit: 'accepted', audited: 'accepted', evidence: null, guardedChanges: [], rules: [], commands: [], verdict: 'passed', cause: null, next: 'accept',
  });
  const run = constructedRun([
    { type: 'analysis-accepted', data: {}, records: [{ path: 'work-items/wi-001/item.json', body: item('wi-001', { entry: 'provider' }) }] },
    { type: 'iteration-assigned', data: {}, records: [{ path: 'assignment.json', body: assignment }] },
    { type: 'invocation-started', data: { invocation: invocation.id, role: 'engineer', session: 'ses-001', work: invocation.work }, records: [{ path: runLayout.invocation(invocation.id), body: invocation }] },
    { type: 'invocation-ended', data: { invocation: invocation.id, ended: 'submitted' }, records: [{ path: runLayout.outcome(invocation.id), body: outcome }] },
    { type: 'gate-attempted', data: {}, records: [{ path: 'gates/ga-001/attempt.json', body: gate }, { path: 'result.json', body: result }] },
  ], constructedRecord(), directory);
  const original = JSON.stringify(run);
  const view = runView(run);
  const metrics = metricsResponseSchema.parse(await metricsOf(view));
  const work = workItemResponseSchema.parse(await workItemOf(view, 'wi-001'));
  const evidence = paths.map(path => ({ path, attributable: observation.data.attributable,
    observations: [{ number: observation.n, callId: observation.data.callId, observedBy: observation.data.observedBy,
      attributable: observation.data.attributable }], uncertainty: null,
  }));
  expect(metrics.evaluation.invocations[0]!.outsideScope).toEqual(paths);
  expect(metrics.evaluation.invocations[0]!.outsideScopeEvidence).toEqual(evidence);
  expect(metrics.evaluation.outsideScope).toEqual(evidence.map(({ path, ...proof }) => ({
    invocation: invocation.id, role: 'engineer', workItem: 'wi-001', iteration: assignment.id, path, evidence: proof,
  })));
  expect(work.iterations[0]!.invocations[0]!.outsideScopeEvidence).toEqual(evidence);
  expect(work.iterations[0]!.result).toMatchObject({ outcome: 'accepted', gate: 'ga-001', commit: 'accepted' });
  expect(work.iterations[0]!.gates[0]!.verdict).toBe('passed');
  expect(JSON.stringify(run)).toBe(original);
  expect(await readFile(observationsPath, 'utf8')).toBe(bytes);
});

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
