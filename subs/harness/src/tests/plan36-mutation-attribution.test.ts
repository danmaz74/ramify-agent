import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { metricsResponseSchema, workItemResponseSchema } from '../interfaces/protocol/runs.js';
import { RunQueries } from '../../subs/projections/src/queries.js';
import type { Observation } from '../../subs/task-execution/src/observations.js';
import { gateAttemptSchema, runLayout } from '../../subs/autonomous/src/run/records.js';
import { invocationOutcomeSchema, invocationSchema } from '../../subs/task-execution/src/records.js';
import { iterationAssignmentSchema, iterationResultSchema } from '../../subs/autonomous/subs/work-coordination/src/work/iterations.js';
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
  const queries = new RunQueries({ projectRoot: directory, agentName: undefined,
    committed: () => run, committedRuns: () => [run], runVersions: () => [] });
  const metrics = metricsResponseSchema.parse(await queries.metrics(run.record.planId, run.record.jobId));
  const work = workItemResponseSchema.parse(await queries.workItem(run.record.planId, run.record.jobId, 'wi-001'));
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
