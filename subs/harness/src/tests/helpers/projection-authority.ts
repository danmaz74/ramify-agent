import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { RunQueries, type RunSource } from '../../../subs/projections/src/queries.js';
import type { CommittedRun } from '../../../subs/projections/src/inputs.js';
import { scenarioRecordSchema, scenarioSourceHash } from '../../../subs/scenarios/src/records.js';
import type { GateAttempt } from '../../checks/records.js';
import { invocationSchema, invocationOutcomeSchema, runLayout } from '../../run/records.js';
import { capabilityListResponseSchema, scenarioListResponseSchema, metricsResponseSchema } from '../../interfaces/protocol/runs.js';
import { at, constructedRun, hash, item, registered, reviews, runId, type Line } from './constructed.js';
import { size, usage, find } from './metric-fixtures.js';
import { captureProjectionFiles } from './projection-consumers.js';

const plan = 'review-notes';
const sourceRun = '20260920T080000Z-decafe';
const where = 'subs/workspace/subs/reviews/src/notes.ts — retained architect judgment';

/** Retained provider-shaped audit evidence, not an audit invocation. */
function audit(id: string, passed: boolean): Line {
  const verdict = passed ? 'passed' : 'failed';
  const body: GateAttempt = {
    schema: 'ramify-agent.gate-attempt/3', id, checkpoint: 'iteration', subject: { workItem: 'wi-001', iteration: 'wi-001.i01' },
    proposedBy: 'inv-engineer', repairRound: passed ? 1 : 0, infrastructureAttempt: 0,
    head: 'a'.repeat(40), commit: null, audited: 'a'.repeat(40), evidence: null,
    audit: { requestId: `retained-${id}`, mode: 'project-default', status: 'completed', definition: { path: 'ramify-audit.json', blob: 'b'.repeat(40) },
      requestedSourceCommit: 'a'.repeat(40), auditedSourceCommit: 'a'.repeat(40), requestedMode: 'full', executedMode: 'full', fallbackReason: null,
      reuse: null, verdict: passed ? 'pass' : 'fail', detail: 'Scripted retained audit', nested: false, projects: null, discovery: null },
    provider: { result: {}, checks: { scenarios: { cucumberMessages: { status: 'read', run: { scenarios: ['sc-001', 'sc-002'].map(scenario => ({
      uri: 'retained.feature', line: 1, tags: [`@ramify-${scenario}`], outcome: passed ? 'passed' : 'failed',
      steps: [{ text: 'Then the retained behavior holds', status: verdict, definitionLocations: [], ...(passed ? {} : { errorMessage: 'Recorded failure, not a withdrawn judgment' }) }],
    })) } } } } },
    guardedChanges: [], commands: [], verdict, cause: passed ? null : 'check-failed', next: passed ? 'accept' : 'repair',
  };
  return { type: 'gate-attempted', data: { gate: id, checkpoint: body.checkpoint, verdict, next: body.next }, records: [{ path: runLayout.gate(id), body }] };
}

function metricEvidence(id: string, session: string, partial: boolean): Line[] {
  const invocation = invocationSchema.parse({
    schema: 'ramify-agent.invocation/1', id, role: 'engineer', work: {}, attempt: 1,
    session: { requested: 'fresh', actual: 'fresh', ref: '' }, prompt: { package: 'engineer', hash, inputsHash: hash },
    scope: { write: null, measurement: null, size: partial ? size(80, 'architect-view') : size(100) },
    writer: false, base: 'a'.repeat(40), startedAt: '2026-09-21T08:00:00.000Z',
  });
  const outcome = invocationOutcomeSchema.parse({
    schema: 'ramify-agent.invocation-outcome/1', invocation: id, ended: 'submitted', rejectedSubmissions: 0, disposition: 'applied',
    session: { ref: `scripted-${id}`, mode: 'fresh' }, submission: null,
    settled: { confirmed: true, at: '2026-09-21T08:00:01.000Z', groupsKilled: 0, lateWrites: [] },
    outsideScope: [], usage: partial ? { unavailable: 'Retained provider did not report usage' } : usage, elapsedMs: 1,
  });
  return [
    { type: 'session-opened', data: { session, role: 'engineer', work: {}, executor: 'scripted', model: null } },
    { type: 'invocation-started', data: { invocation: id, role: 'engineer', session, work: {}, start: 'opened' }, records: [{ path: runLayout.invocation(id), body: invocation }] },
    { type: 'invocation-ended', data: { invocation: id, session, ended: 'submitted', submission: null, kept: true }, records: [{ path: runLayout.outcome(id), body: outcome }] },
  ];
}

/** Real child readers over schema-validated retained records and imported ledger identities.
 * External processes, agents and audit acquisition are deliberately not supplied by the reading port.
 */
export async function recordedProjectionAuthority() {
  const root = await mkdtemp(join(tmpdir(), 'projection-authority-'));
  try {
    const scenarios = ['sc-001', 'sc-002', 'sc-003'].map(id => {
      const source = [`Scenario: ${id}`, '  Given a retained note', '  When it is read', '  Then its identity remains'];
      return scenarioRecordSchema.parse({ schema: 'ramify-agent.scenario/1', id, kind: 'entry', entry: 'read-note', owner: reviews,
        origin: { kind: 'architect', refs: ['fr-002'] }, partOf: null, subScenarios: [], name: id, source, hash: scenarioSourceHash(source),
        file: 'subs/workspace/subs/reviews/src/tests/features/review-notes/read-note.feature' });
    });
    const lines: Line[] = [
      { type: 'job-started', data: {} },
      { type: 'analysis-accepted', data: { invocation: 'inv-architect', entries: 1, hypotheses: 0, registry: 1, workItems: 1, scenarios: 3, warnings: [] }, records: [
        { path: at('registry', 'read-note'), body: registered('read-note') },
        { path: 'work-items/wi-001/item.json', body: item('wi-001', { entry: 'read-note' }) },
        ...scenarios.map(body => ({ path: `scenarios/${body.id}.json`, body })),
      ] },
      { type: 'work-item-started', data: { workItem: 'wi-001' } },
      ...['sc-001', 'sc-002'].map(id => ({ type: 'obligation-bound' as const, data: { id, fakes: [], by: 'inv-engineer', submission: hash } })),
      { type: 'obligation-reported', data: { id: 'sc-001', judgment: 'done', basedOnRevision: 0, revision: 1, where, by: 'inv-architect', submission: hash } },
      audit('ga-0001', false), audit('ga-0002', true),
      ...metricEvidence('inv-0001', 'ses-0001', false), ...metricEvidence('inv-0002', 'ses-0002', true),
    ];
    const built = constructedRun(lines, undefined, root);
    const retained: CommittedRun = { ...built, entries: built.entries.map(entry => ({ ...entry, source: { runId: sourceRun, sequence: entry.sequence + 100 } })) };
    // Serialize and reopen the fixture before querying; answers are not supplied by callbacks.
    const path = join(root, 'retained-history.json');
    await writeFile(path, JSON.stringify(retained));
    const run: CommittedRun = JSON.parse(await readFile(path, 'utf8'));
    const original = JSON.stringify(run);
    const files = await captureProjectionFiles(root);
    const source: RunSource = Object.freeze({ projectRoot: root, agentName: 'scripted',
      committed: (p: string, r: string) => p === plan && r === runId ? run : undefined,
      committedRuns: (p: string) => p === plan ? [run] : [],
      runVersions: () => [{ planId: plan, runId, version: run.entries.length }],
    });
    const queries = new RunQueries(source);
    async function read() {
      return {
        progress: capabilityListResponseSchema.parse(await queries.capabilities(plan, runId)),
        scenarios: scenarioListResponseSchema.parse(await queries.scenarios(plan, runId)),
        metrics: metricsResponseSchema.parse(await queries.metrics(plan, runId)),
      };
    }
    let answer: Awaited<ReturnType<typeof read>> | undefined;
    function current() { assert.ok(answer, 'The query step must execute first'); return answer; }
    return {
      retainedSources() {
        assert.ok(run.entries.every(entry => entry.source?.runId === sourceRun));
        assert.equal(run.entries.find(entry => entry.transaction.event.type === 'obligation-reported')!.source!.sequence, 106);
      },
      async exercise() { answer = await read(); assert.deepEqual(await read(), answer); },
      authority() {
        const { progress, scenarios: list } = current();
        assert.deepEqual(list.scenarios.map(one => [one.id, one.state]), [['sc-001', 'done'], ['sc-002', 'bound'], ['sc-003', 'pending']]);
        for (const one of list.scenarios.slice(0, 2)) {
          assert.deepEqual(one.gates.map(gate => [gate.gate, gate.status, gate.verdict]), [['ga-0001', 'failed', 'failed'], ['ga-0002', 'passed', 'passed']]);
          assert.equal(one.gates[0]!.failure?.message, 'Recorded failure, not a withdrawn judgment');
        }
        assert.equal(list.obligations.find(one => one.id === 'sc-002')!.report, null);
        assert.deepEqual(progress.capabilities.map(one => [one.state, one.scenarios]), [['working', { done: 1, total: 3 }]]);
        assert.deepEqual(list.obligations.find(one => one.id === 'sc-001')!.report, {
          judgment: 'done', revision: 1, basedOnRevision: 0, where, invocation: 'inv-architect', submission: hash,
          sequence: 106, sourceRun, at: run.entries[5]!.at,
        });
      },
      provenance() {
        const { metrics, scenarios: list } = current();
        const missingUsage = find(metrics.metrics, 'usage-tokens.input');
        assert.equal(missingUsage.state, 'unavailable'); assert.equal(missingUsage.value, null);
        assert.equal(missingUsage.subtotal, 100); assert.deepEqual(missingUsage.coverage, { covered: 1, total: 2 });
        assert.ok(missingUsage.evidence.some(text => text.includes('Retained provider did not report usage')), JSON.stringify(missingUsage));
        const weighted = find(metrics.metrics, 'session-weighted-total');
        assert.equal(weighted.state, 'unavailable'); assert.equal(weighted.value, null);
        assert.equal(weighted.subtotal, 180);
        assert.deepEqual(weighted.coverage, { covered: 1, total: 2 });
        assert.deepEqual(weighted.evidence, ['ses-0002: architect-view unavailable']);
        assert.deepEqual(list.obligations.find(one => one.id === 'sc-002')!.binding, {
          fakes: [], invocation: 'inv-engineer', submission: hash, sourceRun, sequence: 105, at: run.entries[4]!.at,
        });
        assert.deepEqual(list.scenarios[0]!.origin, { kind: 'architect', refs: ['fr-002'] });
      },
      async unchanged() {
        const before = current();
        assert.deepEqual(await read(), before);
        assert.equal(JSON.stringify(run), original, 'Query mutated retained completion/provenance evidence');
        assert.deepEqual(await captureProjectionFiles(root), files, 'Query wrote or repaired retained files');
        assert.equal(run.entries.filter(entry => entry.transaction.event.type === 'obligation-reported').length, 1);
        assert.equal(run.entries.filter(entry => entry.transaction.event.type === 'work-item-completed').length, 0);
      },
      close: () => rm(root, { recursive: true, force: true }),
    };
  } catch (error) { await rm(root, { recursive: true, force: true }); throw error; }
}
