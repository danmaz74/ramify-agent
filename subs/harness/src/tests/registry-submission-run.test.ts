import { readFile } from 'node:fs/promises';
import { afterEach, expect, test } from 'vitest';
import { localArchitectInputSchema } from '../work/submission.js';
import { judgeWorkTurn } from '../steps/local-architect.js';
import type { WorkTurnStepInputs } from '../steps/inputs.js';
import { RunLog } from '../run/log.js';
import { runLayout } from '../run/records.js';
import { committedRecords } from '../work/committed.js';
import { copyFixture } from './helpers/fixture.js';
import { analysis, entry, requestCompletion } from './helpers/analysis.js';
import { assign, byRole, completionProposed, outline, submit, treeInputs } from './helpers/iterations.js';
import { installTestRunner, onlyRun, runEventsOnDisk, runPath, startRun } from './helpers/runs.js';
import { assertUnchangedGit, openUnchangedRuns } from './helpers/unchanged-run.js';
import { scenariosCommit } from './helpers/scripted-git.js';
import { expectNoProcesses, forgetExternalTools } from './helpers/external-tools.js';
import { FakeRamifyCli } from './helpers/fake-ramify.js';

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  try {
    for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
    assertUnchangedGit();
    expectNoProcesses();
  } finally { forgetExternalTools(); }
});

// The historical local work-item form has no dedicated preflight tool.
// Its stateless judge is also used by final submission; exercise both and
// inspect the service transaction with scripted Git, CLI and audit answers.
test('retained registration graph passes a stateless judgment, rejects a duplicate, then commits with its assignment once', async () => {
  const retained = localArchitectInputSchema.parse(JSON.parse(await readFile(
    new URL('./helpers/registry-submission/inv-0006.json', import.meta.url), 'utf8',
  )));
  if (retained.kind !== 'assign') throw new Error('Expected retained assignment');
  const fixture = await copyFixture();
  cleanups.push(fixture.remove);
  await installTestRunner(fixture.root);
  const reviews = 'collection-review/workspace/reviews';
  // Keep the captured graph verbatim, in reverse order to exercise a forward
  // sibling link. The small fixture has its own plan, scope and obligations.
  const input = { ...assign(reviews, { externalCapabilities: retained.assignment.externalCapabilities }, outline()),
    localDecisions: [...retained.localDecisions].reverse() };
  const duplicate = structuredClone(input);
  duplicate.localDecisions.push(structuredClone(duplicate.localDecisions[0]!));
  const ramify = new FakeRamifyCli();
  let preflight = false;
  let rejectionChecked = false;
  const opened = await openUnchangedRuns(fixture.root, {
    ramify, inputs: treeInputs(),
    unchangedCheckpoints: [scenariosCommit('review-notes'), 'wi-001.i01', 'wi-001', 'final verification of plan "review-notes"'],
    script: byRole({
      'initial-architect': [submit(analysis([entry('preview-proposed-revision-chain', reviews)]))],
      'local-architect': [[
        { kind: 'await', until: async () => {
          const jobId = onlyRun(opened.service, 'review-notes').jobId;
          const events = await runEventsOnDisk(fixture.root, 'review-notes', jobId);
          const started = events.filter(event => event.type === 'invocation-started' && event.data.role === 'local-architect').at(-1);
          if (started?.type !== 'invocation-started') throw new Error('Missing architect invocation');
          const inputs = JSON.parse(await readFile(runPath(fixture.root, 'review-notes', jobId,
            runLayout.stepInputs(started.data.invocation)), 'utf8')) as WorkTurnStepInputs;
          const ledger = runPath(fixture.root, 'review-notes', jobId, runLayout.events);
          const before = await readFile(ledger, 'utf8');
          const result = await judgeWorkTurn({ inputs }, input, {
            index: await treeInputs().refresh(fixture.root), ramify, projectRoot: fixture.root,
          });
          expect(result.verdict).toMatchObject({ ok: true });
          expect(result.prepared).toBeDefined();
          expect(await readFile(ledger, 'utf8')).toBe(before);
          preflight = true;
        } },
        { kind: 'submit', input: duplicate },
        { kind: 'await', until: async () => {
          const jobId = onlyRun(opened.service, 'review-notes').jobId;
          const log = await RunLog.open(runPath(fixture.root, 'review-notes', jobId, runLayout.events), jobId);
          const state = committedRecords(log.ledger.replay());
          expect(state.registry.map(entry => entry.capability)).toEqual(['preview-proposed-revision-chain']);
          expect(state.decisions.size).toBe(0);
          expect(state.assignments.size).toBe(0);
          rejectionChecked = true;
        } },
        { kind: 'submit', input },
      ], submit(requestCompletion())],
      engineer: [submit(completionProposed())],
    }),
  });
  cleanups.push(() => opened.service.close());
  const receipt = await opened.service.execute(startRun('review-notes'));
  await opened.service.settled('review-notes', receipt.jobId);
  expect(preflight).toBe(true);
  expect(rejectionChecked).toBe(true);
  expect(onlyRun(opened.service, 'review-notes').state).toBe('completed');
  const sessions = opened.agent!.sessions.filter(session => session.spec.submission.name === 'submit_work_item_result');
  expect(sessions[0]!.verdicts).toMatchObject([{ accepted: false }, { accepted: true }]);
  const rejected = sessions[0]!.verdicts[0] as { errors: string[] };
  expect(rejected.errors.join('\n')).toContain('localDecisions.3.registry.0.capability');

  const log = await RunLog.open(runPath(fixture.root, 'review-notes', receipt.jobId, runLayout.events), receipt.jobId);
  const lines = log.ledger.replay();
  const transactions = lines.filter(line => line.transaction.event.type === 'iteration-assigned');
  expect(transactions).toHaveLength(1);
  const records = transactions[0]!.transaction.records;
  const registries = records.filter(record => record.path.startsWith('registry/')).map(record => record.body);
  expect(registries).toHaveLength(3);
  expect(registries).toEqual(input.localDecisions.map(local => expect.objectContaining({
    ...local.registry[0], revision: 1, origin: 'local-decision',
  })));
  expect(records.filter(record => record.path.startsWith('decisions/'))).toHaveLength(3);
  const state = committedRecords(lines);
  expect(state.assignments.get('wi-001.i01')!.externalCapabilities).toEqual(retained.assignment.externalCapabilities);
  expect([...state.decisions.values()]).toHaveLength(3);
  expect(registries).toContainEqual(expect.objectContaining({ capability: 'resolve-chain-predecessors',
    consumers: [{ capability: 'evaluate-proposed-revision-chain', workItem: 'wi-001' }] }));
}, 180_000);
