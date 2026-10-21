import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { RunLog } from '../../../../src/run/log.js';
import { commitCapabilityTransition } from '../../../../src/run/capability-transition.js';
import { capabilityLayout, capabilityPlanSchema, capabilityRequestSchema, capabilitySchemas, descriptiveCapabilityNeedInputSchema, identifyCapabilityNeed, type CapabilityPlan } from '../capability/records.js';
import { committedRecords } from '../../../../src/run/committed-records.js';
import { recordHash } from '../../../../../../src/jobs/committed-reader.js';
import { capabilityFixtureIds, copyCapabilityFixture, fixturePlan, fixtureRequest, fixtureTask } from './helpers/capability.js';
import { descriptiveCapabilityEngineerSubmissionSchema } from '../work/engineer.js';
import { descriptiveQualificationActionSchema, qualificationActionSchema } from '../capability/submission.js';
import { obligationsOf } from '../work/obligations.js';
import { submissionHash } from './helpers/obligations.js';
import { mockGit } from '../../../../../../src/tests/helpers/mock-git.js';
import { FakeRamifyCli } from '../../../../../../src/tests/helpers/fake-ramify.js';
import { openRuns, runPath } from '../../../../../../src/tests/helpers/runs.js';
import { RunQueries } from '../../../../../projections/src/queries.js';
import { createQuerySource } from '../../../../../../src/http/query-source.js';

const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map(directory => rm(directory, { recursive: true, force: true }))); });

describe('capability records', () => {
  it('descriptive submission choices retain explicit qualification and unsuitable outcomes', () => {
    expect(descriptiveCapabilityEngineerSubmissionSchema.safeParse({ kind: 'unsuitable', reason: 'scope',
      detail: 'The provider owns the requested write.' }).success).toBe(true);
    const request = 'capability-request:render-source-fact';
    const invocation = 'inv-0001';
    const choices = [
      { kind: 'satisfy-with-existing', request, invocation,
        api: { owner: 'capability-coordination/b', path: 'subs/b/src/fact.ts', symbol: 'readFact' },
        guidance: 'Read the existing fact.', evidence: ['subs/b/src/fact.ts'] },
      { kind: 'delegate-capability', request, invocation, provider: 'capability-coordination/b',
        placementReason: 'B owns the fact.', constraints: [], requirementRefs: [], taskKey: 'draft:capability-task:provide-source-fact' },
      { kind: 'request-placement', request, invocation, problem: 'The owner is unknown.', evidence: ['subs/b/module.ramify'] },
      { kind: 'unresolved', request, invocation, problem: 'The source is unavailable.', evidence: ['subs/b/src/fact.ts'] },
    ];
    expect(choices.map(choice => descriptiveQualificationActionSchema.safeParse(choice).success)).toEqual([true, true, true, true]);
    expect(choices.map(choice => qualificationActionSchema.safeParse(choice).success)).toEqual([true, true, true, true]);
    expect(descriptiveQualificationActionSchema.safeParse({ ...choices[1], taskKey: undefined }).success).toBe(false);
  });

  it('accepts descriptive request, example and task identities together and replays exact relationships', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'descriptive-capability-'));
    directories.push(directory);
    const logPath = join(directory, 'events.jsonl');
    const log = await RunLog.open(logPath, 'job-001');
    const requestId = 'capability-request:resolve-review-predecessors';
    const taskId = 'capability-task:provide-review-predecessor-resolution';
    const exampleId = 'capability-example:reject-unknown-predecessor';
    const original = fixtureRequest();
    const input = descriptiveCapabilityNeedInputSchema.parse({
      requestKey: `draft:${requestId}`,
      ...original.original,
      examples: original.original.examples.map(example => ({ key: `draft:${exampleId}`, title: example.title,
        code: example.code, designation: example.designation })),
    });
    expect(descriptiveCapabilityNeedInputSchema.safeParse({ ...input, examples: input.examples.map(example => ({
      ...example, designation: 'executable',
    })) }).success).toBe(true);
    const request = capabilityRequestSchema.parse({ ...original, schema: 'ramify-agent.capability-request/2', id: requestId,
      original: identifyCapabilityNeed(requestId, input) });
    const task = { ...fixtureTask(request), schema: 'ramify-agent.capability-task/2' as const, id: taskId };
    const plan = { ...fixturePlan(request, task), schema: 'ramify-agent.capability-plan/2' as const };
    await commitCapabilityTransition(log, { type: 'capability-requested', data: {
      request: request.id, parent: request.parent.id, assignment: request.assignment, invocation: request.invocation,
    } }, [{ path: capabilityLayout.request(request.id), id: request.id, revision: 1, body: request }]);
    await expect(commitCapabilityTransition(log, { type: 'capability-requested', data: {
      request: request.id, parent: request.parent.id, assignment: request.assignment, invocation: request.invocation,
    } }, [{ path: capabilityLayout.request(request.id), id: request.id, revision: 1, body: request }])).rejects.toThrow();
    const afterRequest = log.ledger.replay().length;
    const colliding = { ...request, id: 'capability-request:separate-review-predecessor', invocation: 'inv-0003' };
    await expect(commitCapabilityTransition(log, { type: 'capability-requested', data: {
      request: colliding.id, parent: colliding.parent.id, assignment: colliding.assignment, invocation: colliding.invocation,
    } }, [{ path: capabilityLayout.request(colliding.id), id: colliding.id, revision: 1, body: colliding }]))
      .rejects.toThrow('example ID collides');
    expect(log.ledger.replay()).toHaveLength(afterRequest);
    const corrected = { ...colliding, original: { ...colliding.original, examples: [
      { ...colliding.original.examples[0]!, id: 'capability-example:separate-review-predecessor', designation: 'executable' as const },
    ] } };
    await commitCapabilityTransition(log, { type: 'capability-requested', data: {
      request: corrected.id, parent: corrected.parent.id, assignment: corrected.assignment, invocation: corrected.invocation,
    } }, [{ path: capabilityLayout.request(corrected.id), id: corrected.id, revision: 1, body: corrected }]);
    const beforeFault = log.ledger.replay().length;
    await expect(commitCapabilityTransition(log, { type: 'capability-delegated', data: {
      task: task.id, request: request.id, parent: request.parent.id, invocation: 'inv-0002', planRevision: 1,
    } }, [
      { path: capabilityLayout.task(task.id), id: task.id, revision: 1, body: task },
      { path: capabilityLayout.plan(task.id, 1), id: task.id, revision: 1,
        body: { ...plan, originalExamples: ['capability-example:foreign-example'] } },
    ])).rejects.toThrow('Original example capability-example:foreign-example requires a case');
    expect(log.ledger.replay()).toHaveLength(beforeFault);
    await commitCapabilityTransition(log, { type: 'capability-delegated', data: {
      task: task.id, request: request.id, parent: request.parent.id, invocation: 'inv-0002', planRevision: 1,
    } }, [
      { path: capabilityLayout.task(task.id), id: task.id, revision: 1, body: task },
      { path: capabilityLayout.plan(task.id, 1), id: task.id, revision: 1, body: plan },
    ]);
    const exchange = { schema: 'ramify-agent.capability-exchange/2', id: 'cx-0001', task: task.id,
      request: request.id, planRevision: 1, question: 'Which source must A show?', references: ['subs/a/src/caller.ts'], answer: null };
    await commitCapabilityTransition(log, { type: 'capability-exchange-opened', data: {
      task: task.id, exchange: exchange.id, invocation: 'inv-0002',
    } }, [{ path: capabilityLayout.exchange(task.id, exchange.id, 1), id: exchange.id, revision: 1, body: exchange }]);
    const answered = { ...exchange, answer: { invocation: 'inv-0005', text: 'Show B source metadata', objections: [] } };
    await commitCapabilityTransition(log, { type: 'capability-exchange-answered', data: {
      task: task.id, exchange: exchange.id, invocation: 'inv-0005',
    } }, [{ path: capabilityLayout.exchange(task.id, exchange.id, 2), id: exchange.id, revision: 2, body: answered }]);
    const reopened = await RunLog.open(logPath, 'job-001');
    const records = committedRecords(reopened.ledger.replay());
    expect(records.capabilityRequests.get(requestId)?.original.examples[0]?.id).toBe(exampleId);
    expect(records.capabilityRequests.get(corrected.id)?.original.examples[0]?.designation).toBe('executable');
    expect(records.capabilityTasks.get(taskId)?.request).toBe(requestId);
    expect(records.capabilityPlans.get(taskId)?.[0]?.originalExamples).toEqual([exampleId]);
    expect(records.capabilityExchanges.get(exchange.id)?.at(-1)?.answer?.text).toBe('Show B source metadata');
    expect(capabilityLayout.task(taskId)).toContain('capability-task%3A');
  });

  it('CA01 accepts a known-insufficient API and validates prospective usage structurally', () => {
    const original = fixtureRequest();
    const revised = { ...original, original: { ...original.original,
      knownInterface: { kind: 'insufficient', path: 'subs/b/src/result.ts', symbol: 'readResult', missing: 'The new fact' },
      usage: [{ path: 'subs/a/src/new-caller.ts', use: 'Call the new result reader', prospective: true, module: 'a' }],
    } };
    expect(capabilityRequestSchema.safeParse(revised).success).toBe(true);
    expect(capabilityRequestSchema.safeParse({ ...revised, original: { ...revised.original,
      usage: [{ path: 'subs/a/src/new-caller.ts', use: 'Call the new result reader', prospective: true }],
    } }).success).toBe(false);
  });

  it('CA01 keeps request evidence and admits delegation beyond a captured work-unit count', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'capability-records-'));
    directories.push(directory);
    const path = join(directory, 'events.jsonl');
    const log = await RunLog.open(path, 'job-001');
    const request = fixtureRequest();
    await commitCapabilityTransition(log, { type: 'capability-requested', data: {
      request: request.id, parent: request.parent.id, assignment: request.assignment, invocation: request.invocation,
    } }, [{ path: capabilityLayout.request(request.id), id: request.id, revision: 1, body: request }]);
    const task = { ...fixtureTask(), limits: { ...fixtureTask().limits, maxWorkUnits: 1 } };
    const plan = fixturePlan();
    await commitCapabilityTransition(log, { type: 'capability-delegated', data: {
      task: task.id, request: request.id, parent: request.parent.id, invocation: 'inv-0002', planRevision: 1,
    } }, [
      { path: capabilityLayout.task(task.id), id: task.id, revision: 1, body: task },
      { path: capabilityLayout.plan(task.id, 1), id: task.id, revision: 1, body: plan },
    ]);
    const reopened = await RunLog.open(path, 'job-001');
    const record = await reopened.ledger.readRecord(capabilityLayout.request(request.id), capabilitySchemas.request);
    expect(record).toEqual({ kind: 'valid', value: request });
    expect(committedRecords(reopened.ledger.replay()).capabilityRequests.get(request.id)?.original).toEqual(request.original);
    expect(committedRecords(reopened.ledger.replay()).capabilityTasks.get(task.id)?.deferredWorkItems).toEqual(['wi-002']);
  });

  it('CA11 preserves original examples and old plan revisions across a corrected oracle', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'capability-revision-'));
    directories.push(directory);
    const log = await RunLog.open(join(directory, 'events.jsonl'), 'job-001');
    const request = fixtureRequest();
    const task = fixtureTask();
    const plan = fixturePlan();
    await commitCapabilityTransition(log, { type: 'capability-requested', data: { request: request.id, parent: 'wi-001', assignment: request.assignment, invocation: request.invocation } },
      [{ path: capabilityLayout.request(request.id), id: request.id, revision: 1, body: request }]);
    await commitCapabilityTransition(log, { type: 'capability-delegated', data: { task: task.id, request: request.id, parent: 'wi-001', invocation: 'inv-0002', planRevision: 1 } }, [
      { path: capabilityLayout.task(task.id), id: task.id, revision: 1, body: task },
      { path: capabilityLayout.plan(task.id, 1), id: task.id, revision: 1, body: plan },
    ]);
    const revision: CapabilityPlan = { ...plan, revision: 2, basedOn: 1, revisionReason: 'Independent D test disproved the expected value',
      useCases: [{ ...plan.useCases[0]!, expectedBehavior: 'A formats the corrected value' }],
    };
    await commitCapabilityTransition(log, { type: 'capability-plan-revised', data: { task: task.id, revision: 2, basedOn: 1, invocation: 'inv-0002' } },
      [{ path: capabilityLayout.plan(task.id, 2), id: task.id, revision: 2, body: revision }]);
    const saved = committedRecords(log.ledger.replay()).capabilityPlans.get(task.id);
    expect(saved).toHaveLength(2);
    expect(saved?.[0]).toEqual(plan);
    expect(saved?.[1]?.originalExamples).toEqual([capabilityFixtureIds.example]);
    // PB3-D09: the original request and its example stay as they were asked;
    // the revised case carries no coverage state and requires no test.
    expect(committedRecords(log.ledger.replay()).capabilityRequests.get(request.id)).toEqual(request);
    expect(saved?.[1]?.useCases).toEqual([{ id: capabilityFixtureIds.example, expectedBehavior: 'A formats the corrected value', derivedFrom: [capabilityFixtureIds.example] }]);
    expect(capabilityPlanSchema.safeParse({ ...revision, useCases: [{ ...revision.useCases[0]!, coverage: { state: 'exercised', tests: ['a-format'] } }] }).success).toBe(false);
    await expect(commitCapabilityTransition(log, { type: 'capability-plan-revised', data: { task: task.id, revision: 3, basedOn: 2, invocation: 'inv-0002' } },
      [{ path: capabilityLayout.plan(task.id, 3), id: task.id, revision: 3, body: { ...revision, revision: 3, basedOn: 2, useCases: [
        { id: 'a-extra', expectedBehavior: 'A formats a second fact', derivedFrom: [capabilityFixtureIds.example] },
      ] } }])).rejects.toThrow();
    await expect(commitCapabilityTransition(log, { type: 'capability-plan-revised', data: { task: task.id, revision: 3, basedOn: 2, invocation: 'inv-0002' } },
      [{ path: capabilityLayout.plan(task.id, 3), id: task.id, revision: 3, body: { ...revision, revision: 3, basedOn: 2, originalExamples: [] } }])).rejects.toThrow();
    expect(log.count('capability-plan-revised')).toBe(1);
  });

  it('PB3-D08 refuses a handback outside verification and materializes one with no per-example coverage state, leaving the request unchanged', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'capability-handback-'));
    directories.push(directory);
    const path = join(directory, 'events.jsonl');
    const log = await RunLog.open(path, 'job-001');
    const request = fixtureRequest();
    const task = fixtureTask(request);
    const plan = fixturePlan(request, task);
    await commitCapabilityTransition(log, { type: 'capability-requested', data: { request: request.id, parent: 'wi-001', assignment: request.assignment, invocation: request.invocation } },
      [{ path: capabilityLayout.request(request.id), id: request.id, revision: 1, body: request }]);
    await commitCapabilityTransition(log, { type: 'capability-delegated', data: { task: task.id, request: request.id, parent: 'wi-001', invocation: 'inv-0002', planRevision: 1 } }, [
      { path: capabilityLayout.task(task.id), id: task.id, revision: 1, body: task },
      { path: capabilityLayout.plan(task.id, 1), id: task.id, revision: 1, body: plan },
    ]);
    const handback = {
      schema: 'ramify-agent.capability-handback/1' as const, task: task.id, request: request.id,
      plan: { id: task.id, revision: plan.revision, hash: recordHash(plan) },
      sourceRevision: 'source-1', returnedTree: 'b'.repeat(64), deltaFromSuspension: ['subs/a/src/caller.ts'],
      summary: 'A uses B; the original example now formats the fact as asked',
      interfaces: [{ path: 'subs/b/src/result.ts', symbols: ['readResult'], use: 'A formats the fact' }],
      compatibility: [], checks: [{ id: 'gate-1', revision: 1, hash: 'c'.repeat(64) }], reviews: [], limitations: [],
    };
    // The structural boundaries stay: no handback while the task is not
    // verifying, nor one naming a plan other than the current revision.
    await expect(commitCapabilityTransition(log, { type: 'capability-handed-back', data: { task: task.id, handback: task.id, invocation: 'inv-0002' } },
      [{ path: capabilityLayout.handback(task.id), id: task.id, revision: 1, body: handback }])).rejects.toThrow('verified coordinator authority is required');
    await commitCapabilityTransition(log, { type: 'capability-verification-started', data: { task: task.id, invocation: 'inv-0002' } }, []);
    await expect(commitCapabilityTransition(log, { type: 'capability-handed-back', data: { task: task.id, handback: task.id, invocation: 'inv-0002' } },
      [{ path: capabilityLayout.handback(task.id), id: task.id, revision: 1, body: { ...handback, plan: { ...handback.plan, hash: 'd'.repeat(64) } } }]))
      .rejects.toThrow('resolved structural evidence');
    expect(log.count('capability-handed-back')).toBe(0);
    // The plan's one case still has no coverage, cited evidence or test list,
    // and the handback is accepted: the outcome is the architect's to report.
    expect(Object.keys(plan.useCases[0]!).sort()).toEqual(['derivedFrom', 'expectedBehavior', 'id']);
    await commitCapabilityTransition(log, { type: 'capability-handed-back', data: { task: task.id, handback: task.id, invocation: 'inv-0002' } },
      [{ path: capabilityLayout.handback(task.id), id: task.id, revision: 1, body: handback }]);
    const reopened = await RunLog.open(path, 'job-001');
    expect(await reopened.ledger.readRecord(capabilityLayout.handback(task.id), capabilitySchemas.handback)).toEqual({ kind: 'valid', value: handback });
    expect(committedRecords(reopened.ledger.replay()).capabilityRequests.get(request.id)).toEqual(request);
    expect(committedRecords(reopened.ledger.replay()).capabilityPlans.get(task.id)).toEqual([plan]);
  });
});

describe('PB3-D01 PB3-D05: registrations beside the capability records', () => {
  it('PB3-D01 registers a case and a test through the real ledger without changing the original request, examples or plan cases', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'capability-registration-'));
    directories.push(directory);
    const path = join(directory, 'events.jsonl');
    const log = await RunLog.open(path, 'job-001');
    const request = fixtureRequest();
    const task = fixtureTask(request);
    const plan = fixturePlan(request, task);
    await commitCapabilityTransition(log, { type: 'capability-requested', data: { request: request.id, parent: 'wi-001', assignment: request.assignment, invocation: request.invocation } },
      [{ path: capabilityLayout.request(request.id), id: request.id, revision: 1, body: request }]);
    await commitCapabilityTransition(log, { type: 'capability-delegated', data: { task: task.id, request: request.id, parent: 'wi-001', invocation: 'inv-0002', planRevision: 1 } }, [
      { path: capabilityLayout.task(task.id), id: task.id, revision: 1, body: task },
      { path: capabilityLayout.plan(task.id, 1), id: task.id, revision: 1, body: plan },
    ]);
    const by = { by: 'inv-0002', submission: submissionHash('f') };
    const responsible = { kind: 'capability-task' as const, id: task.id };
    await log.append({ type: 'obligation-registered', data: { id: `${task.id}.case.${capabilityFixtureIds.example}`, kind: 'scenario', responsible, ...by, case: capabilityFixtureIds.example } });
    await log.append({ type: 'obligation-registered', data: { id: 'test-001', kind: 'test', responsible, ...by, description: 'B keeps the old text for D' } });
    await log.append({ type: 'obligation-reported', data: { id: task.id, judgment: 'done', basedOnRevision: 0, revision: 1, ...by } });
    // A registration of the wrong shape is no log line.
    await expect(log.append({ type: 'obligation-registered', data: { id: 'test-002', kind: 'test', responsible, ...by } as never })).rejects.toThrow();

    const reopened = await RunLog.open(path, 'job-001');
    const committed = committedRecords(reopened.ledger.replay());
    expect(committed.capabilityRequests.get(request.id)).toEqual(request);
    expect(committed.capabilityPlans.get(task.id)).toEqual([plan]);
    expect(committed.capabilityPlans.get(task.id)?.[0]?.originalExamples).toEqual([capabilityFixtureIds.example]);
    const { obligations } = obligationsOf({ scenarios: [], workItems: [], events: reopened.events });
    expect([...obligations.values()].map(one => [one.id, one.kind, one.status, one.revision, one.case, one.description])).toEqual([
      [task.id, 'outcome', 'done', 1, null, null],
      [`${task.id}.case.${capabilityFixtureIds.example}`, 'scenario', 'pending', 0, capabilityFixtureIds.example, null],
      ['test-001', 'test', 'pending', 0, null, 'B keeps the old text for D'],
    ]);
  });

  it('PB3-D05 refuses an old-policy run holding scenario declarations and coverage records, naming both versions, and never reads them as reports', async () => {
    const fixture = await copyCapabilityFixture();
    directories.push(fixture.root);
    const id = '20261007T170000Z-000001';
    const directory = runPath(fixture.root, 'need', id, '');
    await mkdir(join(directory, 'capabilities', 'cap-001', 'plan'), { recursive: true });
    const plan = { ...fixturePlan(), revision: 2, basedOn: 1, useCases: [{ ...fixturePlan().useCases[0]!, coverage: { state: 'exercised', tests: ['subs/a/src/tests/caller.test.ts'] } }] };
    const files: Record<string, string> = {
      'job.json': JSON.stringify({ schema: 'ramify-agent.job/4', kind: 'implementation', jobId: id, planId: 'need', policy: { version: 'run-policy/6' } }),
      'events.jsonl': [
        { type: 'scenario-declared', data: { scenario: 'sc-001', by: 'inv-0003', state: 'declared' } },
        { type: 'scenario-implemented', data: { scenario: 'sc-001', gate: 'ga-0004' } },
      ].map(line => JSON.stringify(line)).join('\n') + '\n',
      'capabilities/cap-001/plan/2.json': JSON.stringify(plan),
    };
    for (const [file, text] of Object.entries(files)) await writeFile(join(directory, file), text);
    const ramify = new FakeRamifyCli();
    const opened = await openRuns(fixture.root, { production: true, git: mockGit(), ramify, script: () => [] });
    try {
      expect(opened.recovery.skipped).toEqual([`need/${id}`]);
      const refusal = /Run policy run-policy\/6 is refused by run-policy\/8; a fresh run is required/u;
      expect(() => opened.service.getRun('need', id)).toThrow(refusal);
      expect(() => opened.service.committed('need', id)).toThrow(refusal);
      const queries = new RunQueries(createQuerySource(opened.service));
      await expect(queries.scenarios('need', id)).rejects.toThrow(refusal);
      expect((await queries.list('need')).unserved).toEqual([expect.objectContaining({ jobId: id, code: 'unsupported-version', message: expect.stringMatching(refusal) })]);
      for (const [file, text] of Object.entries(files)) expect(await readFile(join(directory, file), 'utf8')).toBe(text);
      expect(ramify.calls).toEqual([]);
    } finally {
      await opened.service.close();
    }
  }, 60_000);
});
