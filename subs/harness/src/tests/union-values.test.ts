import { afterEach, describe, expect, test } from 'vitest';
import { openLedger } from '../../subs/ledger/src/ledger.js';
import { readCommitted } from '../jobs/commit.js';
import { runEventSchema, type RunEvent } from '../../subs/autonomous/src/run/log.js';
import { ObservationLog, observationSchema, type ObservationInput } from '../../subs/task-execution/src/observations.js';
import { decisionViewSchema, metricSchema, metricStateSchema } from '../interfaces/protocol/runs.js';
import { RunQueries } from '../../subs/projections/src/queries.js';
import type { CommittedRun } from '../../subs/projections/src/inputs.js';
import { createQuerySource } from '../http/query-source.js';
import { constructedRun } from './helpers/constructed.js';
import { runLayout, runSchemas } from '../../subs/autonomous/src/run/records.js';
import { assignableKindSchema, assignmentBodySchema } from '../../subs/autonomous/subs/work-coordination/src/work/assignment.js';
import { shellInputSchema, shellJsonSchema } from '../tools/shell.js';
import { temporaryDirectory } from './helpers/fixture.js';

/*
 * The record and protocol rules a consumer relies on: what the readers
 * refuse, what replays keep, and what a submission cannot state. TypeScript
 * already proves each union exhaustive.
 */

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) await cleanup();
});

/** A ledger of its own, for writing one record and reading it back. */
async function ledger() {
  const directory = await temporaryDirectory();
  cleanups.push(directory.remove);
  const log = await openLedger<RunEvent>({
    logPath: `${directory.path}/events.jsonl`,
    recordsRoot: directory.path,
    eventSchema: runEventSchema,
  });
  let sequence = 0;
  return {
    directory: directory.path,
    async roundTrip<T>(path: string, body: unknown, schema: { schema: string; body: { parse(value: unknown): T } }): Promise<T> {
      sequence += 1;
      await log.append({
        event: runEventSchema.parse({
          sequence, jobId: '20260920T101500Z-3f9a1c', at: new Date().toISOString(),
          type: 'job-failed', data: { reason: 'internal', message: 'a record written for its own sake', evidence: [] },
        }),
        records: [{ path, id: path, revision: 1, body }],
      });
      const read = await readCommitted(log, path, schema as never);
      if (read.kind !== 'valid') throw new Error(`${path}: ${read.kind}`);
      return read.value as T;
    },
    log,
  };
}

function queriesOf(run: CommittedRun) {
  return new RunQueries(createQuerySource({ projectRoot: '/nonexistent', agentName: 'scripted',
    committed: () => run, committedRuns: () => [run], runVersions: () => [],
  }));
}

describe('the run log', () => {
  test('the prepared invocation event round-trips its original identity through the ledger', async () => {
    const store = await ledger();
    const event = { sequence: 1, jobId: '20260920T101500Z-3f9a1c', at: '2026-09-20T10:15:00.000Z', type: 'invocation-prepared' as const, data: { invocation: 'inv-0001' } };
    expect(runEventSchema.parse(event)).toEqual(event);
    await store.log.append({ event, records: [] });
    const restored = await openLedger<RunEvent>({ logPath: `${store.directory}/events.jsonl`, recordsRoot: store.directory, eventSchema: runEventSchema });
    expect(restored.replay().map(entry => entry.transaction.event)).toEqual([event]);
    expect(runEventSchema.safeParse({ ...event, data: { invocation: 'inv-0001', changedTask: true } }).success).toBe(false);
  });

  test('an event of an unknown type is refused', () => {
    expect(runEventSchema.safeParse({
      sequence: 1, jobId: '20260920T101500Z-3f9a1c', at: '2026-09-20T10:15:00.000Z', type: 'map-validated', data: {},
    }).success).toBe(false);
  });
});

describe('the record unions', () => {
  test('a record of an unsupported version is a failure with evidence, never an absent record', async () => {
    const store = await ledger();
    await store.roundTrip(runLayout.measurement('ms-0003'), {
      schema: 'ramify-agent.measurement-snapshot/1',
      id: 'ms-0003', policy: 'scope-size/2', head: '', measure: { unavailable: 'x' }, view: null, supplementary: [],
    }, runSchemas.measurement);
    const read = await readCommitted(store.log, runLayout.measurement('ms-0003'), runSchemas.readiness);
    expect(read.kind).toBe('unsupported-version');
    if (read.kind !== 'unsupported-version') return;
    expect(read.schema).toBe('ramify-agent.measurement-snapshot/1');

    const absent = await readCommitted(store.log, runLayout.measurement('ms-9999'), runSchemas.measurement);
    expect(absent.kind).toBe('invalid');
  });
});

describe('the observation log', () => {
  test('the exploration usage and timing variants round-trip their exact values and stable identities', async () => {
    const directory = await temporaryDirectory(); cleanups.push(directory.remove);
    const path = `${directory.path}/observations.jsonl`;
    const at = new Date('2026-09-20T10:15:00.000Z');
    const inputs: ObservationInput[] = [
      { type: 'exploration', data: { id: 'run/op/inv/call/read', invocationId: 'inv-0001', operationId: 'op-0001', role: 'engineer', sessionId: 'ses-0001', turn: 1, callId: 'call-0001', kind: 'read', requestedScope: ['src/a.ts'], resolvedScope: ['src/a.ts'], files: ['src/a.ts'], returnedBytes: 0, startedAt: null, endedAt: null, elapsedMs: null, outcome: 'completed', broad: false, outsideScope: false, coverage: ['Duration unavailable'] } },
      { type: 'usage', data: { usage: { input: 100, output: 20, cacheRead: 40, cacheWrite: 10, total: 170 }, charge: null, modelElapsedMs: null } },
      { type: 'model-duration', data: { elapsedMs: 0 } },
      { type: 'tool-start', data: { callId: 'call-0001', tool: 'read', kind: 'read', requestedScope: ['src/a.ts'], startedAt: null } },
      { type: 'tool-duration', data: { callId: 'call-0001', startedAt: null, endedAt: null, elapsedMs: null, coverage: ['Duration unavailable'] } },
      { type: 'milestone', data: { kind: 'first-designated-submission', at: null } },
    ].map((input, index) => ({ ...input, sourceId: `fixed-observation-${index + 1}` })) as ObservationInput[];
    const log = await ObservationLog.open(path);
    for (const input of inputs) expect(await log.record(input, at)).toBe(true);
    const expected = inputs.map((input, index) => ({ n: index + 1, at: at.toISOString(), ...input }));
    expect(log.observations).toEqual(expected);
    const restored = await ObservationLog.open(path);
    expect(restored.observations).toEqual(expected);
    for (const input of inputs) expect(await restored.record(input, at)).toBe(false);
    expect(restored.observations).toEqual(expected); expect(restored.replays).toBe(6);
    for (const line of expected) expect(observationSchema.safeParse({ ...line, data: { ...line.data, unexpected: true } }).success).toBe(false);
    expect(observationSchema.safeParse({ ...expected[2], data: { elapsedMs: -1 } }).success).toBe(false);
  });
});

describe('the harness tools an engineer is given', () => {
  test('the shell takes a command and an optional timeout, and nothing else', () => {
    expect(shellInputSchema.safeParse({ command: 'npm run build' }).success).toBe(true);
    expect(shellInputSchema.safeParse({ command: 'npm run build', timeoutMs: 1_000 }).success).toBe(true);
    expect(shellInputSchema.safeParse({ command: '' }).success).toBe(false);
    expect(shellInputSchema.safeParse({ command: 'true', timeoutMs: 0 }).success).toBe(false);
    expect(shellInputSchema.safeParse({ command: 'true', cwd: '/elsewhere' }).success).toBe(false);
    // No field for anything the harness already knows: not the invocation,
    // not the working directory, not the scope.
    const properties = (shellJsonSchema as { properties: Record<string, unknown> }).properties;
    expect(Object.keys(properties).sort()).toEqual(['command', 'timeoutMs']);
  });
});

describe('the submissions an architect makes', () => {
  test('every kind a local architect may assign, and the revision only a contract iteration carries', () => {
    const base = {
      stage: 0,
      goal: 'g',
      approach: 'a',
      scope: { base: { module: 'shop/orders', included: [] }, extra: [], read: [], rationale: 'r' },
      citedElements: [],
      externalCapabilities: [],
      completionEvidence: 'e',
    };
    for (const kind of assignableKindSchema.options) {
      expect(assignmentBodySchema.safeParse({ ...base, kind }).success).toBe(true);
    }
    // The agreement is named; the revision number is not, because the
    // harness fills it and no submission chooses one.
    const revising = assignmentBodySchema.parse({ ...base, kind: 'contract', revisesContract: 'contract:case-001' });
    expect(revising.revisesContract).toBe('contract:case-001');
    expect(assignmentBodySchema.safeParse({ ...base, kind: 'contract', revisesContract: 'contract:case-001', revision: 2 }).success).toBe(false);
    expect(assignmentBodySchema.safeParse({ ...base, kind: 'integration' }).success).toBe(false);

    // Both arms of the base a submission may state. The broad one carries
    // its rationale; the schema accepts a blank one so the rule beside it can
    // say what is missing, and a base with neither shape is refused.
    const broad = { base: { modules: ['shop', 'shop/orders'], rationale: 'the guarantee changes in both' }, extra: [], read: [], rationale: 'r' };
    expect(assignmentBodySchema.safeParse({ ...base, kind: 'breaking', scope: broad }).success).toBe(true);
    expect(assignmentBodySchema.safeParse({ ...base, kind: 'breaking', scope: { ...broad, base: { modules: ['shop'], rationale: '' } } }).success).toBe(true);
    expect(assignmentBodySchema.safeParse({ ...base, kind: 'breaking', scope: { ...broad, base: { modules: [] as string[], rationale: 'r' } } }).success).toBe(false);
    expect(assignmentBodySchema.safeParse({ ...base, kind: 'breaking', scope: { ...broad, base: { module: 'shop', modules: ['shop'], rationale: 'r' } } }).success).toBe(false);

    // An authorization is a path and a reason. The record that authorizes it
    // is the harness's, so the submission has no field for one.
    expect(assignmentBodySchema.safeParse({ ...base, kind: 'ordinary', authorizations: [{ path: 'vitest.config.ts', rationale: 'r' }] }).success).toBe(true);
    expect(assignmentBodySchema.safeParse({
      ...base, kind: 'ordinary',
      authorizations: [{ path: 'vitest.config.ts', rationale: 'r', by: { id: 'work-item:case-001', revision: 1, hash: 'd'.repeat(64) } }],
    }).success).toBe(false);
  });
});

describe('the run protocol a client reads', () => {
  const hash64 = 'a'.repeat(64);

  test('every metric state is representable, and only a measured metric has a value', () => {
    const base = { id: 'm', unit: 'u', policyVersion: 'kpi/1', measurementPolicy: null, numerator: null, denominator: null, subtotal: null, coverage: null, evidence: [], note: null };
    for (const state of metricStateSchema.options) {
      expect(metricSchema.safeParse({ ...base, state, value: state === 'measured' ? 1 : null }).success).toBe(true);
      expect(metricSchema.safeParse({ ...base, state, value: state === 'measured' ? null : 0 }).success).toBe(false);
    }
  });

  test('every kind of decision is produced from the record that holds it, and no choice is copied', async () => {
    const outlineRef = { id: 'work-item:case-001', revision: 1, hash: hash64 };
    const run = constructedRun([
      { type: 'job-started', data: {} },
      {
        type: 'outline-revised', data: {},
        records: [{ path: 'work-items/wi-001/outline/1.json', body: {
          schema: 'ramify-agent.work-item-outline/2', workItem: 'work-item:case-001', revision: 1, invocation: 'inv-0002', changes: 'c',
          decomposition: { kind: 'staged', rationale: 'r' }, reuse: [],
          breakingChanges: [{ guarantee: 'g', reason: 'why', affectedConsumers: ['shop/web'], citations: [] }],
          stages: [{ title: 't', approach: 'breaking', dependsOn: [], note: '' }], hypothesesSeen: [], revisionReason: '',
        } }],
      },
      {
        type: 'iteration-assigned', data: {},
        records: [{ path: 'work-items/wi-001/iterations/01/assignment.json', body: {
          schema: 'ramify-agent.iteration-assignment/2', id: 'it-case-01', workItem: 'work-item:case-001', outline: outlineRef, stage: 0, kind: 'breaking',
          goal: 'g', approach: 'a',
          scope: {
            revision: 1, base: { modules: ['shop', 'shop/web'], rationale: 'the guarantee changes in both' }, extra: [], read: [], bootstrap: [], rationale: 'r',
            resolved: { boundaryVersion: 'ramify-agent.assignment-boundary/1', nestedDeclarations: [], excluded: [], included: [], ownership: { provider: 'ramify.affected-cli/4', ramifyVersion: 'scripted-lifecycle-only', inputId: 'scripted-scope', configuration: 'tsconfig.json', root: '/p', modules: [{ id: 'app', parent: null, directory: '.' }], exclusions: [] }, roots: ['/p/src'], files: [], view: { status: 'placeholder' } },
          },
          externalCapabilities: [], completionEvidence: 'e', evidenceObligations: [],
          gate: { checkpoint: 'breaking-iteration', tests: { policy: 'all-project', exactOwners: [], subtrees: [], extraSuites: [] } },
          guarded: [], authorizations: [{ path: 'package.json', rationale: 'the request supersedes it', by: outlineRef }],
        } }],
      },
      {
        type: 'decision-accepted', data: {},
        records: [{ path: 'decisions/gd-001.json', body: {
          schema: 'ramify-agent.placement-decision/2', id: 'placement-decision:case-001', authority: 'global', request: 'placement-request:case-001', workItem: 'work-item:case-001', invocation: 'inv-0003',
          question: 'Where?', outcome: 'reuse', capability: 'capability:send-email', changesExistingSymbols: false, owner: 'shop', rationale: 'r', constraints: [], uncertainties: [],
          evidence: { view: { status: 'placeholder' }, citations: [], gaps: [] },
          registry: [{ id: 'capability:send-email', revision: 1, hash: hash64 }], hypothesisRevisions: [{ id: 'hypothesis:mail', revision: 2, hash: hash64 }], brief: 'b',
        } }],
      },
      {
        type: 'contract-registered', data: {},
        records: [{ path: 'contracts/ct-001/1.json', body: {
          schema: 'ramify-agent.contract/3', id: 'contract:case-001', revision: 1, capability: { id: 'capability:send-email', revision: 1, hash: hash64 }, decision: 'placement-decision:case-001',
          authority: { kind: 'provider', owner: 'shop', rationale: 'r' }, provider: 'shop', behavior: 'b', mode: 'fake-backed',
          artifacts: { interface: [], conformance: [], fake: [], exposure: [] }, establishedBy: { iteration: 'it-case-01', gate: 'ga-0002' },
        } }],
      },
    ]);
    const { decisions } = await queriesOf(run).decisions('review-notes', run.record.jobId);
    for (const decision of decisions) decisionViewSchema.parse(decision);
    expect(decisions.map(decision => decision.kind)).toEqual(['plan-revision', 'breaking', 'scope', 'placement', 'contract']);
    expect([...new Set(decisions.map(decision => decision.kind))].sort()).toEqual([...decisionViewSchema.options.map(option => option.shape.kind.value)].sort());
    expect(decisions.find(decision => decision.kind === 'scope')).toMatchObject({ broad: true, modules: ['shop', 'shop/web'], authorizations: [{ path: 'package.json', by: 'work-item:case-001@1' }] });
    expect(decisions.find(decision => decision.kind === 'placement')).toMatchObject({ hypotheses: [{ id: 'hypothesis:mail', revision: 2 }], registry: ['capability:send-email'] });
  });
});
