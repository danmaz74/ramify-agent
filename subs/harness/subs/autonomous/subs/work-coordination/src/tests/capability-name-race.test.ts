import { readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { afterEach, expect, test, vi } from 'vitest';
import { copyCapabilityFixture, openCapabilityRuns } from './helpers/capability.js';
import { acceptanceBoundaries } from '../../../../../../src/tests/helpers/acceptance-boundaries.js';
import { assign, edit, outline, submit, treeInputs, write } from '../../../../../../src/tests/helpers/iterations.js';
import { openRuns, runPath, startRun, stopRun, until } from '../../../../../../src/tests/helpers/runs.js';
import { expectNoProcesses, forgetExternalTools } from '../../../../../../src/tests/helpers/external-tools.js';
import { commitCapabilityTransition } from '../../../../src/run/capability-transition.js';
import { capabilityLayout, capabilityNeedInputSchema, identifyCapabilityNeed, type CapabilityHandback, type CapabilityPlan, type CapabilityRequest, type CapabilityTask } from '../capability/records.js';
import { captureProvisionalSource } from '../capability/source.js';
import { runLayout } from '../../../../src/run/records.js';
import { recordHash } from '../../../../../../src/jobs/committed-reader.js';
import { parseRecordedEngineerSubmission } from '../work/engineer.js';

const boundary = vi.hoisted(() => ({ beforeDelegation: null as null | ((log: unknown) => Promise<void>) }));
vi.mock('../../../../src/run/capability-transition.js', async original => {
  const actual = await original<typeof import('../../../../src/run/capability-transition.js')>();
  return { ...actual, commitCapabilityTransition: async (...args: Parameters<typeof actual.commitCapabilityTransition>) => {
    if (args[1].type === 'capability-delegated' && boundary.beforeDelegation !== null) {
      const interleave = boundary.beforeDelegation;
      boundary.beforeDelegation = null;
      await interleave(args[0]);
    }
    return actual.commitCapabilityTransition(...args);
  } };
});

vi.mock('node:child_process', async original =>
  (await import('../../../../../../src/tests/helpers/process-guard.js')).guardedChildProcess(await original<typeof import('node:child_process')>()));

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  try { boundary.beforeDelegation = null; for (const cleanup of cleanups.splice(0).reverse()) await cleanup(); expectNoProcesses(); }
  finally { forgetExternalTools(); }
});

const consumer = 'capability-coordination/a';
const provider = 'capability-coordination/b';
const firstRequest = 'capability-request:render-source-fact';
const firstExample = 'capability-example:render-source-fact';

test('recorded engineer replay accepts only the current submission schema', () => {
  const body = { kind: 'unsuitable', reason: 'scope', detail: 'The assignment does not include the source owner' };
  expect(parseRecordedEngineerSubmission({ schema: 'ramify-agent.engineer-submission/2', ...body })).toEqual(body);
  expect(() => parseRecordedEngineerSubmission({ schema: 'ramify-agent.engineer-submission/1', ...body }))
    .toThrow('Unsupported recorded engineer submission schema');
  expect(() => parseRecordedEngineerSubmission({ schema: 'ramify-agent.engineer-submission/3', ...body }))
    .toThrow('Unsupported recorded engineer submission schema');
});

test.each(['request', 'example', 'none'] as const)(
  'descriptive %s collision/recovery keeps the accepted engineer task and source', async collision => {
  const fixture = await copyCapabilityFixture(); cleanups.push(fixture.remove);
  const answers = acceptanceBoundaries(fixture.root, 'descriptive');
  cleanups.push(async () => answers.assertAnswered());
  let service: Awaited<ReturnType<typeof openCapabilityRuns>>['service'] | undefined;
  let interleaved = false;
  let restarted = false;
  let engineerTurns = 0;
  const original = { kind: 'capability-needed', summary: 'A needs the source fact', request: {
    requestKey: `draft:${firstRequest}`, need: 'Render a B fact with its source in A',
    usage: [{ path: 'subs/a/src/caller.ts', symbol: 'renderA', use: 'Render B source', prospective: false }],
    constraints: ['Keep the old D label'], knownInterface: { kind: 'none-known' },
    examples: [{ key: `draft:${firstExample}`, title: 'shows source',
      code: "expect(renderA()).toBe('Fact: old from B')", designation: 'pseudocode' }],
    suggestedProvider: { module: provider, reason: 'B owns the fact' },
  } } as const;
  const corrected = { ...original, request: { ...original.request,
    requestKey: collision === 'request' ? 'draft:capability-request:render-source-fact-in-a' : original.request.requestKey,
    examples: [{ ...original.request.examples[0]!, key: collision === 'example'
      ? 'draft:capability-example:render-source-fact-in-a' : original.request.examples[0]!.key }] } };
  const options: Parameters<typeof openCapabilityRuns>[1] = {
    git: answers.git, candidates: answers.candidates, ramify: answers.ramify,
    provisionalSourceGit: answers.sourceGit, configuredAudit: answers.audit,
    inputs: treeInputs(),
    script: spec => {
      if (spec.submission.name === 'submit_intake') {
        const documents = [...spec.prompt.matchAll(/^- (document:[a-z0-9-]+) \(plan\):/gmu)].map(match => match[1]!);
        return submit({ goal: 'Render the B source fact in A.', elements: [], incorporation: {
          documents: documents.map(document => ({ document, scenarios: true, uncertainty: '' })), missing: [],
        } });
      }
      if (spec.submission.name === 'submit_principle_elements') return submit({ elements: [] });
      if (spec.submission.name === 'submit_catalog_check') return submit({ corrections: [], entries: [], scenarios: [] });
      if (spec.role === 'initial-architect') return submit({ elements: [], entries: [
        { capabilityKey: 'draft:capability:richer-a-fact', description: 'A renders the source fact.', owner: consumer,
          functionalRequirementKeys: [], functionalAcceptanceKeys: [], contextKeys: [], citations: [] },
        { capabilityKey: 'draft:capability:b-entry', description: 'B provides the source fact.', owner: provider,
          functionalRequirementKeys: [], functionalAcceptanceKeys: [], contextKeys: [], citations: [] },
      ], hypotheses: [], coverageLimits: [], scenarios: [
        { scenarioKey: 'draft:scenario:review-source', entryCapabilityKey: 'draft:capability:richer-a-fact',
          origin: { kind: 'architect' }, functionalAcceptanceKeys: [],
          gherkin: 'Scenario: Review source\n  When A renders the B fact\n  Then the source is shown' },
        { scenarioKey: 'draft:scenario:provide-source', entryCapabilityKey: 'draft:capability:b-entry',
          origin: { kind: 'architect' }, functionalAcceptanceKeys: [],
          gherkin: 'Scenario: Provide source\n  When B provides a fact\n  Then its source is present' },
      ], integrationScenarios: [] });
      if (spec.submission.name === 'submit_work_item_result') return submit(assign(consumer, {}, outline()));
      if (spec.role === 'engineer') {
        engineerTurns += 1;
        if (engineerTurns === 2 && collision !== 'none') expect(spec.prompt).toContain(`request.${collision === 'request' ? 'requestKey' : 'examples.0.key'}`);
        if (engineerTurns > (collision === 'none' ? 1 : 2)) return [{ kind: 'wait', ms: 60_000 }] as const;
        if (engineerTurns === 1) { answers.stage('suspended'); return submit(original,
          edit('caller.ts', 'Fact: ${value}', 'Fresh fact: ${value}'),
          write('extra.ts', "export const sourceHint = 'B';\n"),
          edit('tests/caller.test.ts', "toBe('Fact: old')", "toBe('unfinished')")); }
        return submit(corrected);
      }
      if (spec.submission.name === 'submit_capability_qualification') {
        if (!restarted) return [{ kind: 'wait', ms: 60_000 }] as const;
        const basis = [...spec.prompt.matchAll(/Use request (capability-request:[a-z0-9-]+) and invocation (inv-\d+)/gmu)].at(-1);
        if (basis === undefined) throw new Error('Recovered qualification lost the accepted request basis');
        return submit({ kind: 'satisfy-with-existing', request: basis[1], invocation: basis[2],
          api: { owner: provider, path: 'subs/b/src/fact.ts', symbol: 'readFact' },
          guidance: 'Use the existing source-bearing fact', evidence: ['B exposes readFact with the source'] });
      }
      return [];
    },
    afterWrite: async (write, runId) => {
      if (write !== 'capability-source-captured' || interleaved || collision === 'none') return;
      interleaved = true;
      const active = service!['runs'].get(`need/${runId}`)!;
      const started = active.log.events.flatMap(event => event.type === 'invocation-started' && event.data.role === 'engineer' ? [event] : []).at(-1)!;
      if (started.type !== 'invocation-started') throw new Error('No engineer basis for the competing acceptance');
      const acceptedBase = await answers.git.currentHead(fixture.root);
      const planHash = createHash('sha256').update(await readFile(join(active.directory, runLayout.capturedPlan))).digest('hex');
      const competingId = collision === 'request' ? firstRequest : 'capability-request:other-source-fact';
      const source = await captureProvisionalSource({ projectRoot: fixture.root, runDirectory: active.directory,
        git: answers.git, sourceGit: answers.sourceGit, request: competingId,
        writerSettledBy: 'inv-competing-author', invocationScoped: true, acceptedBase,
        changedPaths: await answers.git.changedPaths(fixture.root, acceptedBase) });
      const proposed = capabilityNeedInputSchema.parse({ ...original.request,
        requestKey: `draft:${competingId}`,
        examples: [{ ...original.request.examples[0]!, key: `draft:${collision === 'request' ? 'capability-example:competing-source-fact' : firstExample}` }] });
      const competitor: CapabilityRequest = { schema: 'ramify-agent.capability-request/2', id: competingId,
        parent: { kind: 'work-item', id: started.data.work.workItem! }, assignment: started.data.work.iteration!,
        invocation: 'inv-competing-author', consumer, requirementPackage: { id: runLayout.capturedPlan, revision: 1,
          hash: planHash }, continuation: { session: 'ses-competing-author', point: null }, source,
        summary: 'The competing authorized author described the same source behavior',
        original: identifyCapabilityNeed(proposed) };
      await commitCapabilityTransition(active.log, { type: 'capability-requested', data: {
        request: competitor.id, parent: competitor.parent.id, assignment: competitor.assignment,
        invocation: competitor.invocation,
      } }, [{ path: capabilityLayout.request(competitor.id), id: competitor.id, revision: 1, body: competitor }]);
      await commitCapabilityTransition(active.log, { type: 'capability-qualified', data: {
        request: competitor.id, invocation: 'inv-competing-qualification', outcome: 'satisfied',
        evidence: ['The competing author found the source-bearing B API'],
      } }, []);
    },
  };
  const open = () => collision === 'none'
    ? openRuns(fixture.root, { ...options, production: true })
    : openCapabilityRuns(fixture.root, options);
  const opened = await open();
  service = opened.service; cleanups.push(() => service!.close());
  const receipt = await service.execute(startRun('need'));
  if (collision === 'none') {
    const job = JSON.parse(await readFile(runPath(fixture.root, 'need', receipt.jobId, runLayout.record), 'utf8')) as Record<string, unknown>;
  }
  const expectedRequests = collision === 'none' ? 1 : 2;
  await until(() => (service!.events('need', receipt.jobId) ?? []).filter(event => event.type === 'capability-requested').length >= expectedRequests
    || (service!.events('need', receipt.jobId) ?? []).some(event => event.type === 'job-failed'), 30_000);
  const events = service.events('need', receipt.jobId) ?? [];
  expect(events.some(event => event.type === 'job-failed'), JSON.stringify(events.filter(event => event.type === 'job-failed'))).toBe(false);
  expect(engineerTurns).toBe(expectedRequests);
  expect(events.filter(event => event.type === 'capability-requested')).toHaveLength(expectedRequests);
  const correctedId = collision === 'request' ? 'capability-request:render-source-fact-in-a' : firstRequest;
  await until(async () => stat(runPath(fixture.root, 'need', receipt.jobId, capabilityLayout.request(correctedId)))
    .then(() => true, () => false), 30_000);
  const stored = JSON.parse(await readFile(runPath(fixture.root, 'need', receipt.jobId, capabilityLayout.request(correctedId)), 'utf8')) as CapabilityRequest;
  expect(stored.original.examples[0]?.id).toBe(collision === 'example' ? 'capability-example:render-source-fact-in-a' : firstExample);
  const starts = events.flatMap(event => event.type === 'invocation-started' && event.data.role === 'engineer' ? [event] : []);
  expect(starts).toHaveLength(expectedRequests);
  if (collision !== 'none') {
    expect(starts[1]?.data.work.iteration).toBe(starts[0]?.data.work.iteration);
    expect(starts[1]?.data.session).toBe(starts[0]?.data.session);
    const rejectedSnapshot = runPath(fixture.root, 'need', receipt.jobId,
      `capabilities/snapshots/${encodeURIComponent(firstRequest)}.${encodeURIComponent(starts[0]!.data.invocation)}.json`);
    await expect(stat(rejectedSnapshot)).rejects.toMatchObject({ code: 'ENOENT' });
  }
  expect(await stat(runPath(fixture.root, 'need', receipt.jobId, stored.source.snapshot))).toBeDefined();
  const retry = service['runs'].get(`need/${receipt.jobId}`)!;
  const requestCount = retry.log.ledger.replay().filter(line => line.transaction.event.type === 'capability-requested').length;
  // Replaying a committed logical request does not append another entity.
  const accepted = retry.log.ledger.replay().find(line => line.transaction.event.type === 'capability-requested'
    && line.transaction.event.data.request === correctedId)!;
  const repeated = await commitCapabilityTransition(retry.log, { type: 'capability-requested', data: {
    request: stored.id, parent: stored.parent.id, assignment: stored.assignment, invocation: stored.invocation,
  } }, accepted.transaction.records);
  expect(repeated).toEqual(accepted.transaction.event);
  expect(retry.log.ledger.replay().filter(line => line.transaction.event.type === 'capability-requested')).toHaveLength(requestCount);
  const acceptedInvocation = starts.at(-1)!.data.invocation;
  const acceptedBytes = await readFile(runPath(fixture.root, 'need', receipt.jobId, runLayout.submission(acceptedInvocation)));
  await service.close();
  restarted = true;
  const reloaded = await open();
  service = reloaded.service;
  await until(() => (service!.events('need', receipt.jobId) ?? []).filter(event => event.type === 'invocation-started'
    && event.data.role === 'engineer').length > expectedRequests
    || (service!.events('need', receipt.jobId) ?? []).some(event => event.type === 'job-failed'), 30_000);
  const afterReload = service.events('need', receipt.jobId) ?? [];
  expect(afterReload.filter(event => event.type === 'job-failed'), JSON.stringify(afterReload.slice(-10))).toEqual([]);
  expect(afterReload.filter(event => event.type === 'capability-requested')).toHaveLength(expectedRequests);
  expect(afterReload.some(event => event.type === 'capability-qualified' && event.data.request === correctedId)).toBe(true);
  expect(await readFile(runPath(fixture.root, 'need', receipt.jobId, runLayout.submission(acceptedInvocation)))).toEqual(acceptedBytes);
  const resumed = afterReload.flatMap(event => event.type === 'invocation-started' && event.data.role === 'engineer' ? [event] : []);
  expect(resumed.at(-1)?.data.work.iteration).toBe(starts[0]?.data.work.iteration);
  let stopped = false;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const version = service.getRun('need', receipt.jobId)!.version;
    try { await service.execute(stopRun('need', receipt.jobId, version)); stopped = true; break; }
    catch (error) { if (!String(error).includes('at version')) throw error; }
  }
  expect(stopped).toBe(true);
  await service.settled('need', receipt.jobId);
}, 60_000);

test('a nested descriptive request resumes its accepted provider assignment after reload', async () => {
  const fixture = await copyCapabilityFixture(); cleanups.push(fixture.remove);
  const answers = acceptanceBoundaries(fixture.root, 'descriptive');
  cleanups.push(async () => answers.assertAnswered());
  let service: Awaited<ReturnType<typeof openCapabilityRuns>>['service'] | undefined;
  let restarted = false;
  let engineerTurns = 0;
  const nestedId = 'capability-request:normalize-source-fact';
  const parentTask = 'capability-task:provide-source-fact';
  const options: Parameters<typeof openCapabilityRuns>[1] = {
    git: answers.git, candidates: answers.candidates, ramify: answers.ramify,
    provisionalSourceGit: answers.sourceGit, configuredAudit: answers.audit,
    inputs: treeInputs(),
    script: spec => {
      if (spec.submission.name === 'submit_intake') {
        const documents = [...spec.prompt.matchAll(/^- (document:[a-z0-9-]+) \(plan\):/gmu)].map(match => match[1]!);
        return submit({ goal: 'Render the B source fact in A.', elements: [], incorporation: {
          documents: documents.map(document => ({ document, scenarios: true, uncertainty: '' })), missing: [],
        } });
      }
      if (spec.submission.name === 'submit_principle_elements') return submit({ elements: [] });
      if (spec.submission.name === 'submit_catalog_check') return submit({ corrections: [], entries: [], scenarios: [] });
      if (spec.role === 'initial-architect') return submit({ elements: [], entries: [
        { capabilityKey: 'draft:capability:richer-a-fact', description: 'A renders the source fact.', owner: consumer,
          functionalRequirementKeys: [], functionalAcceptanceKeys: [], contextKeys: [], citations: [] },
        { capabilityKey: 'draft:capability:b-entry', description: 'B provides the source fact.', owner: provider,
          functionalRequirementKeys: [], functionalAcceptanceKeys: [], contextKeys: [], citations: [] },
      ], hypotheses: [], coverageLimits: [], scenarios: [
        { scenarioKey: 'draft:scenario:review-source', entryCapabilityKey: 'draft:capability:richer-a-fact',
          origin: { kind: 'architect' }, functionalAcceptanceKeys: [],
          gherkin: 'Scenario: Review source\n  When A renders the B fact\n  Then the source is shown' },
        { scenarioKey: 'draft:scenario:provide-source', entryCapabilityKey: 'draft:capability:b-entry',
          origin: { kind: 'architect' }, functionalAcceptanceKeys: [],
          gherkin: 'Scenario: Provide source\n  When B provides a fact\n  Then its source is present' },
      ], integrationScenarios: [] });
      if (spec.submission.name === 'submit_work_item_result') return submit(assign(consumer, {}, outline()));
      if (spec.role === 'engineer') {
        engineerTurns += 1;
        if (engineerTurns === 1) {
          answers.stage('suspended');
          return submit({ kind: 'capability-needed', summary: 'A needs B source', request: {
            requestKey: `draft:${firstRequest}`, need: 'Render the B fact with its source in A',
            usage: [{ path: 'subs/a/src/caller.ts', symbol: 'renderA', use: 'Render B source', prospective: false }],
            constraints: [], knownInterface: { kind: 'none-known' },
            examples: [{ key: `draft:${firstExample}`, title: 'shows source',
              code: "expect(renderA()).toContain('B')", designation: 'pseudocode' }],
          } }, edit('caller.ts', 'Fact: ${value}', 'Fresh fact: ${value}'),
          write('extra.ts', "export const sourceHint = 'B';\n"),
          edit('tests/caller.test.ts', "toBe('Fact: old')", "toBe('unfinished')"));
        }
        if (engineerTurns === 2) return submit({ kind: 'capability-needed', summary: 'B needs normalized source', request: {
          requestKey: `draft:${nestedId}`, need: 'Normalize B source before handing it to A',
          usage: [{ path: 'subs/b/src/fact.ts', symbol: 'readFact', use: 'Normalize source', prospective: false }],
          constraints: [], knownInterface: { kind: 'none-known' },
          examples: [{ key: 'draft:capability-example:normalize-source-fact', title: 'normalizes source',
            code: "expect(readFact()).toContain('B')", designation: 'pseudocode' }],
        } });
        return [{ kind: 'wait', ms: 60_000 }] as const;
      }
      if (spec.submission.name === 'submit_capability_qualification') {
        const basis = [...spec.prompt.matchAll(/Use request (capability-request:[a-z0-9-]+) and invocation (inv-\d+)/gmu)].at(-1);
        if (basis === undefined) throw new Error('Qualification lost the accepted request basis');
        if (basis[1] === firstRequest) return submit({ kind: 'delegate-capability', request: basis[1],
          invocation: basis[2], provider, placementReason: 'B owns the source fact', constraints: [],
          requirementRefs: [], taskKey: `draft:${parentTask}` });
        if (!restarted) return [{ kind: 'wait', ms: 60_000 }] as const;
        return submit({ kind: 'satisfy-with-existing', request: basis[1], invocation: basis[2],
          api: { owner: provider, path: 'subs/b/src/fact.ts', symbol: 'readFact' },
          guidance: 'Use the existing B fact reader', evidence: ['B readFact preserves the source'] });
      }
      if (spec.role === 'capability-architect') {
        const basis = [...spec.prompt.matchAll(/Use task (capability-task:[a-z0-9-]+), planRevision (\d+) and invocation (inv-\d+)/gmu)].at(-1);
        if (basis === undefined) throw new Error('Parent coordinator lost its task basis');
        return submit({ task: basis[1], planRevision: Number(basis[2]), invocation: basis[3], kind: 'assign',
          assignment: assign(provider, { goal: 'Supply B source', approach: 'Inspect the source',
            completionEvidence: 'B returns source' }).assignment });
      }
      return [];
    },
  };
  const first = await openCapabilityRuns(fixture.root, options);
  service = first.service; cleanups.push(() => service!.close());
  const receipt = await service.execute(startRun('need'));
  await until(() => (service!.events('need', receipt.jobId) ?? []).some(event => event.type === 'capability-requested'
    && event.data.request === nestedId) || (service!.events('need', receipt.jobId) ?? []).some(event => event.type === 'job-failed'), 30_000);
  const before = service.events('need', receipt.jobId) ?? [];
  expect(before.filter(event => event.type === 'job-failed'), JSON.stringify(before.slice(-12))).toEqual([]);
  const nested = JSON.parse(await readFile(runPath(fixture.root, 'need', receipt.jobId, capabilityLayout.request(nestedId)), 'utf8')) as CapabilityRequest;
  const acceptedBytes = await readFile(runPath(fixture.root, 'need', receipt.jobId, runLayout.submission(nested.invocation)));
  const snapshotBytes = await readFile(runPath(fixture.root, 'need', receipt.jobId, nested.source.snapshot));
  await service.close();
  restarted = true;
  service = (await openCapabilityRuns(fixture.root, options)).service;
  await until(() => (service!.events('need', receipt.jobId) ?? []).filter(event => event.type === 'invocation-started'
    && event.data.role === 'engineer' && event.data.work.iteration === nested.assignment).length >= 2
    || (service!.events('need', receipt.jobId) ?? []).some(event => event.type === 'job-failed'), 30_000);
  const after = service.events('need', receipt.jobId) ?? [];
  expect(after.filter(event => event.type === 'job-failed'), JSON.stringify(after.slice(-12))).toEqual([]);
  expect(after.filter(event => event.type === 'capability-requested').map(event => event.data.request))
    .toEqual([firstRequest, nestedId]);
  expect(after.filter(event => event.type === 'capability-delegated').map(event => event.data.task))
    .toEqual([parentTask]);
  expect(after.some(event => event.type === 'capability-qualified' && event.data.request === nestedId)).toBe(true);
  expect(await readFile(runPath(fixture.root, 'need', receipt.jobId, runLayout.submission(nested.invocation)))).toEqual(acceptedBytes);
  expect(await readFile(runPath(fixture.root, 'need', receipt.jobId, nested.source.snapshot))).toEqual(snapshotBytes);
  const nestedStarts = after.flatMap(event => event.type === 'invocation-started' && event.data.role === 'engineer'
    && event.data.work.iteration === nested.assignment ? [event] : []);
  expect(nestedStarts).toHaveLength(2);
  expect(nestedStarts[1]?.data.work.iteration).toBe(nested.assignment);
  let stopped = false;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const version = service.getRun('need', receipt.jobId)!.version;
    try { await service.execute(stopRun('need', receipt.jobId, version)); stopped = true; break; }
    catch (error) { if (!String(error).includes('at version')) throw error; }
  }
  expect(stopped).toBe(true);
  await service.settled('need', receipt.jobId);
}, 60_000);

test('an intervening accepted task name returns to the same qualification task before delegation', async () => {
  const fixture = await copyCapabilityFixture(); cleanups.push(fixture.remove);
  const answers = acceptanceBoundaries(fixture.root, 'descriptive');
  cleanups.push(async () => answers.assertAnswered());
  let service: Awaited<ReturnType<typeof openCapabilityRuns>>['service'] | undefined;
  let competitor: CapabilityRequest | undefined;
  let qualificationTurns = 0;
  const taskKey = 'draft:capability-task:provide-source-fact';
  const correctedTaskKey = 'draft:capability-task:provide-source-fact-in-a';
  const opened = await openCapabilityRuns(fixture.root, {
    git: answers.git, candidates: answers.candidates, ramify: answers.ramify,
    provisionalSourceGit: answers.sourceGit, configuredAudit: answers.audit,
    inputs: treeInputs(),
    script: spec => {
      if (spec.submission.name === 'submit_intake') {
        const documents = [...spec.prompt.matchAll(/^- (document:[a-z0-9-]+) \(plan\):/gmu)].map(match => match[1]!);
        return submit({ goal: 'Render the B source fact in A.', elements: [], incorporation: {
          documents: documents.map(document => ({ document, scenarios: true, uncertainty: '' })), missing: [],
        } });
      }
      if (spec.submission.name === 'submit_principle_elements') return submit({ elements: [] });
      if (spec.submission.name === 'submit_catalog_check') return submit({ corrections: [], entries: [], scenarios: [] });
      if (spec.role === 'initial-architect') return submit({ elements: [], entries: [
        { capabilityKey: 'draft:capability:richer-a-fact', description: 'A renders the source fact.', owner: consumer,
          functionalRequirementKeys: [], functionalAcceptanceKeys: [], contextKeys: [], citations: [] },
        { capabilityKey: 'draft:capability:b-entry', description: 'B provides the source fact.', owner: provider,
          functionalRequirementKeys: [], functionalAcceptanceKeys: [], contextKeys: [], citations: [] },
      ], hypotheses: [], coverageLimits: [], scenarios: [
        { scenarioKey: 'draft:scenario:review-source', entryCapabilityKey: 'draft:capability:richer-a-fact',
          origin: { kind: 'architect' }, functionalAcceptanceKeys: [],
          gherkin: 'Scenario: Review source\n  When A renders the B fact\n  Then the source is shown' },
        { scenarioKey: 'draft:scenario:provide-source', entryCapabilityKey: 'draft:capability:b-entry',
          origin: { kind: 'architect' }, functionalAcceptanceKeys: [],
          gherkin: 'Scenario: Provide source\n  When B provides a fact\n  Then its source is present' },
      ], integrationScenarios: [] });
      if (spec.submission.name === 'submit_work_item_result') return submit(assign(consumer, {}, outline()));
      if (spec.role === 'engineer') { answers.stage('suspended'); return submit({ kind: 'capability-needed',
        summary: 'A needs the source fact', request: { requestKey: `draft:${firstRequest}`,
          need: 'Render a B fact with its source in A',
          usage: [{ path: 'subs/a/src/caller.ts', symbol: 'renderA', use: 'Render B source', prospective: false }],
          constraints: ['Keep the old D label'], knownInterface: { kind: 'none-known' },
          examples: [{ key: `draft:${firstExample}`, title: 'shows source',
            code: "expect(renderA()).toBe('Fact: old from B')", designation: 'pseudocode' }],
          suggestedProvider: { module: provider, reason: 'B owns the fact' },
        } }, edit('caller.ts', 'Fact: ${value}', 'Fresh fact: ${value}'),
        write('extra.ts', "export const sourceHint = 'B';\n"),
        edit('tests/caller.test.ts', "toBe('Fact: old')", "toBe('unfinished')")); }
      if (spec.submission.name === 'submit_capability_qualification') {
        qualificationTurns += 1;
        if (qualificationTurns === 2) {
          expect(spec.prompt).toContain('taskKey');
          expect(spec.prompt).toContain(taskKey);
        }
        const request = [...spec.prompt.matchAll(/Use request (capability-request:[a-z0-9-]+) and invocation (inv-\d+)/gmu)].at(-1);
        if (request === undefined) throw new Error('The qualification lost its request basis');
        return submit({ kind: 'delegate-capability', request: request[1], invocation: request[2], provider,
          placementReason: 'B owns the source fact', constraints: [], requirementRefs: [],
          taskKey: qualificationTurns === 1 ? taskKey : correctedTaskKey });
      }
      if (spec.role === 'capability-architect') return [{ kind: 'wait', ms: 60_000 }];
      return [];
    },
    afterWrite: async (write, runId) => {
      if (write !== 'capability-source-captured' || competitor !== undefined) return;
      const active = service!['runs'].get(`need/${runId}`)!;
      const started = active.log.events.flatMap(event => event.type === 'invocation-started' && event.data.role === 'engineer' ? [event] : []).at(-1)!;
      const requestId = 'capability-request:competing-source-fact';
      const acceptedBase = await answers.git.currentHead(fixture.root);
      const planHash = createHash('sha256').update(await readFile(join(active.directory, runLayout.capturedPlan))).digest('hex');
      const source = await captureProvisionalSource({ projectRoot: fixture.root, runDirectory: active.directory,
        git: answers.git, sourceGit: answers.sourceGit, request: requestId,
        writerSettledBy: 'inv-competing-author', invocationScoped: true, acceptedBase,
        changedPaths: await answers.git.changedPaths(fixture.root, acceptedBase) });
      const need = capabilityNeedInputSchema.parse({
        requestKey: `draft:${requestId}`, need: 'Provide another B source fact',
        usage: [{ path: 'subs/a/src/caller.ts', symbol: 'renderA', use: 'Render B source', prospective: false }],
        constraints: [], knownInterface: { kind: 'none-known' },
        examples: [{ key: 'draft:capability-example:competing-source-fact', title: 'shows source',
          code: "expect(renderA()).toContain('B')", designation: 'pseudocode' }],
      });
      competitor = { schema: 'ramify-agent.capability-request/2', id: requestId,
        parent: { kind: 'work-item', id: started.data.work.workItem! }, assignment: started.data.work.iteration!,
        invocation: 'inv-competing-author', consumer, requirementPackage: { id: runLayout.capturedPlan,
          revision: 1, hash: planHash }, continuation: { session: 'ses-competing-author', point: null },
        source, summary: 'Another accepted author needs the B source fact', original: identifyCapabilityNeed(need) };
      await commitCapabilityTransition(active.log, { type: 'capability-requested', data: {
        request: competitor.id, parent: competitor.parent.id, assignment: competitor.assignment,
        invocation: competitor.invocation,
      } }, [{ path: capabilityLayout.request(competitor.id), id: competitor.id, revision: 1, body: competitor }]);
      boundary.beforeDelegation = async raw => {
        const log = raw as typeof active.log;
        const request = competitor!;
        const id = taskKey.slice('draft:'.length);
        const task: CapabilityTask = { schema: 'ramify-agent.capability-task/2', id, request: request.id,
          parent: request.parent, originatingAssignment: request.assignment, consumer, provider,
          placementReason: 'B owns the source fact', authority: [{ owner: consumer, reason: 'Consumer integration' },
            { owner: provider, reason: 'Provider behavior' }], relatedEntries: [], deferredWorkItems: [], source: request.source,
          limits: { maxAssignments: 12, maxWorkUnits: 64, maxInvocations: 400 } };
        const example = request.original.examples[0]!;
        const plan: CapabilityPlan = { schema: 'ramify-agent.capability-plan/2', task: task.id,
          revision: 1, basedOn: 0, updatedBy: 'inv-competing-qualification', revisionReason: 'Initial competing request',
          need: request.original.need, proposedInterface: 'B exposes its source fact',
          useCases: [{ id: example.id, expectedBehavior: example.title, derivedFrom: [example.id] }],
          compatibility: [], outline: ['Inspect B behavior'], decisions: [], openQuestions: [], requirementRefs: [],
          originalExamples: [example.id] };
        await commitCapabilityTransition(log, { type: 'capability-delegated', data: {
          task: id, request: request.id, parent: request.parent.id, invocation: 'inv-competing-qualification', planRevision: 1,
        } }, [{ path: capabilityLayout.task(id), id, revision: 1, body: task },
          { path: capabilityLayout.plan(id, 1), id, revision: 1, body: plan }]);
        await commitCapabilityTransition(log, { type: 'capability-verification-started', data: {
          task: id, invocation: 'inv-competing-qualification',
        } }, []);
        const handback: CapabilityHandback = { schema: 'ramify-agent.capability-handback/2', task: id,
          request: request.id, plan: { id, revision: 1, hash: recordHash(plan) }, sourceRevision: 'source-1',
          returnedTree: 'b'.repeat(40), deltaFromSuspension: [], summary: 'B source behavior is available',
          interfaces: [{ path: 'subs/b/src/fact.ts', symbols: ['readFact'], use: 'A renders B source' }],
          compatibility: [], checks: [{ id: 'gate-competing', revision: 1, hash: 'c'.repeat(64) }],
          reviews: [], limitations: [] };
        await commitCapabilityTransition(log, { type: 'capability-handed-back', data: {
          task: id, handback: id, invocation: 'inv-competing-qualification',
        } }, [{ path: capabilityLayout.handback(id), id, revision: 1, body: handback }]);
      };
    },
  });
  service = opened.service; cleanups.push(() => service!.close());
  const receipt = await service.execute(startRun('need'));
  const correctedId = correctedTaskKey.slice('draft:'.length);
  await until(() => (service!.events('need', receipt.jobId) ?? []).some(event =>
    event.type === 'capability-delegated' && event.data.task === correctedId)
    || (service!.events('need', receipt.jobId) ?? []).some(event => event.type === 'job-failed'), 30_000);
  const events = service.events('need', receipt.jobId) ?? [];
  expect(events.filter(event => event.type === 'job-failed')).toEqual([]);
  expect(qualificationTurns).toBe(2);
  expect(events.filter(event => event.type === 'capability-delegated').map(event => event.data.task))
    .toEqual([taskKey.slice('draft:'.length), correctedId]);
  const starts = events.flatMap(event => event.type === 'invocation-started' && event.data.role === 'local-architect'
    && event.data.work.request === firstRequest ? [event] : []);
  expect(starts).toHaveLength(2);
  expect(starts[1]?.data.work.request).toBe(starts[0]?.data.work.request);
  expect(starts[1]?.data.session).toBe(starts[0]?.data.session);
  const active = service['runs'].get(`need/${receipt.jobId}`)!;
  const tasks = active.log.ledger.replay().flatMap(line => line.transaction.records)
    .filter(record => record.path.endsWith('/task.json'));
  expect(tasks).toHaveLength(2);
  expect((tasks[0]!.body as CapabilityTask).request).toBe(competitor!.id);
  expect((tasks[1]!.body as CapabilityTask).request).toBe(firstRequest);
  expect(await stat(runPath(fixture.root, 'need', receipt.jobId, competitor!.source.snapshot))).toBeDefined();
  const accepted = active.log.ledger.replay().find(line => line.transaction.event.type === 'capability-delegated'
    && line.transaction.event.data.task === correctedId)!;
  const repeated = await commitCapabilityTransition(active.log, { type: 'capability-delegated', data: {
    task: correctedId, request: firstRequest, parent: starts[0]!.data.work.workItem!,
    invocation: starts[1]!.data.invocation, planRevision: 1,
  } }, accepted.transaction.records);
  expect(repeated).toEqual(accepted.transaction.event);
  expect(active.log.ledger.replay().filter(line => line.transaction.event.type === 'capability-delegated')).toHaveLength(2);
  let stopped = false;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const version = service.getRun('need', receipt.jobId)!.version;
    try { await service.execute(stopRun('need', receipt.jobId, version)); stopped = true; break; }
    catch (error) { if (!String(error).includes('at version')) throw error; }
  }
  expect(stopped).toBe(true);
  await service.settled('need', receipt.jobId);
}, 60_000);
