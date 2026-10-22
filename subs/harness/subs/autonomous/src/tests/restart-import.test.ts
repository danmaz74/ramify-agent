


import { expect, test } from 'vitest';
import { restartWorkflowEntries, validateRestartImport } from '../run/restart-import.js';
import { committedRecords } from '../run/committed-records.js';
import { recordHash } from '../../../../src/jobs/committed-reader.js';
import { recoveryHash } from '../run/recovery-admission.js';
import { invocationSchema } from '../../../task-execution/src/records.js';
import { decideCheckFindingChange } from '../../../check-findings/src/decide.js';
import { emptyCheckFindingState } from '../../../check-findings/src/replay.js';

import { concern, report } from '../../../../src/tests/helpers/check-findings.js';



import { unsettledRequests } from '../../subs/acceptance/src/reviews/state.js';
import { constructedRecord, constructedRun, hash, item, type Line } from '../../../../src/tests/helpers/constructed.js';

function retained() {
  const record = constructedRecord();
  const invocation = invocationSchema.parse({ schema: 'ramify-agent.invocation/1', id: 'inv-0060', role: 'local-architect', work: { workItem: 'work-item:third' }, attempt: 3,
    session: { requested: 'continued', actual: 'continued', ref: 'obsolete-point' },
    prompt: { package: 'local-architect/18', hash, manifest: { entries: [{ key: 'tool:submit_work_orientation' }, { key: 'tool:submit_work_item_result' }] } },
    scope: { write: null, measurement: null, size: null }, writer: false, base: 'accepted-head', startedAt: record.createdAt });
  const finding = decideCheckFindingChange(emptyCheckFindingState(), report(concern({ workItem: 'work-item:third', summary: 'Authenticate review pointer timestamp' })));
  if (!finding.ok) throw new Error(finding.rejection.message);
  const lines: Line[] = [{ type: 'analysis-accepted', data: { invocation: 'inv-0001', entries: 3, hypotheses: 0, registry: 0, workItems: 3, scenarios: 8,
    scenarioIds: Array.from({ length: 8 }, (_, n) => `scenario:reported-${n + 1}`), warnings: [],
    catalog: { context: 0, functional: 0, nonFunctional: 0, fixed: 0, recommendation: 0 }, findings: [],
    evidence: { catalog: { path: `analysis/catalog/${hash}.json`, hash }, incorporation: { path: `analysis/incorporation/${hash}.json`, hash } } },
    records: [1, 2, 3].map(n => ({ path: `work-items/${['work-item:first', 'work-item:second', 'work-item:third'][n - 1]!}.json`, body: item(['work-item:first', 'work-item:second', 'work-item:third'][n - 1]!, { entry: ['capability:first', 'capability:second', 'capability:third'][n - 1]! }) })) },
  { type: 'work-item-completed', data: { workItem: 'work-item:first', gate: 'ga-0002' } },
  { type: 'work-item-completed', data: { workItem: 'work-item:second', gate: 'ga-0004' } },
  ...Array.from({ length: 8 }, (_, n): Line => ({ type: 'obligation-reported', data: { id: `scenario:reported-${n + 1}`, judgment: 'done', basedOnRevision: 0, revision: 1, where: 'Retained architect report', by: 'inv-0057', submission: hash } })),
  { type: 'check-findings-recorded', data: { cause: { kind: 'producer', producer: 'review:scope', attempt: 'rq-0001.a01' }, checkFindings: finding.events } },
  { type: 'review-request-recorded', data: { request: 'rq-0001', workItem: 'work-item:third', iteration: 'work-item:third.i01', kind: 'scope', gate: 'ga-0009', candidate: 'accepted-head' } },
  { type: 'review-attempt-started', data: { request: 'rq-0001', attempt: 'rq-0001.a01', invocation: 'inv-0059', session: 'ses-0047', requestedStart: 'fresh' } },
  { type: 'review-attempt-finished', data: { request: 'rq-0001', attempt: 'rq-0001.a01', result: 'not-verified', reason: 'stopped', settles: true, checkFindings: [] } },
  { type: 'work-item-started', data: { workItem: 'work-item:third', module: 'collection-review/workspace/reviews', origin: 'entry' } },
  { type: 'invocation-started', data: { invocation: invocation.id, role: invocation.role, session: 'ses-0039', work: invocation.work, start: 'continued' },
    records: [{ path: 'invocations/inv-0060/invocation.json', body: invocation }] },
  { type: 'invocation-ended', data: { invocation: invocation.id, ended: 'context-budget-reached', submission: null, session: 'ses-0039', kept: false, finished: 'not-kept' } },
  { type: 'session-finished', data: { session: 'ses-0039', reason: 'run-ended' } },
  { type: 'job-failed', data: { reason: 'internal', message: 'Module architect ended without a result (context-budget-reached)', evidence: [] } }];
  return { record, entries: constructedRun(lines, record).entries, sourceDigest: hash };
}
function retainedImport() {
  const source = retained();
  const excluded = new Set(['job-failed', 'session-finished']);
  const body = { schema: 'ramify-agent.restart-import/1', sourceRun: source.record.jobId,
    sourceVersion: source.entries.length, sourceDigest: hash, sourceRecord: source.record, ancestors: [],
    inventory: source.entries.filter(entry => !excluded.has(entry.transaction.event.type)),
    records: source.entries.flatMap(entry => entry.transaction.records.map(record => ({ ...record, sourceRun: source.record.jobId, sequence: entry.sequence, hash: recordHash(record.body) }))),
    pending: { kind: 'invocation', sourceRun: source.record.jobId, role: 'local-architect', work: { workItem: 'work-item:third' }, originalInvocation: 'inv-0060', submission: 'submit_work_item_result' },
    preserved: [], inapplicable: [], outstanding: [], recognizedEffects: [] };
  return validateRestartImport({ ...body, digest: recoveryHash(body) });
}

test('linked successors remain readable without creating another inventory', () => {
  const seed = retainedImport();
  const imported = restartWorkflowEntries(seed);
  expect(imported.every(entry => entry.sequence < 0 && entry.source.runId === seed.sourceRun)).toBe(true);
  const records = committedRecords(imported);
  expect(records.workItems.map(item => item.id)).toEqual(['work-item:first', 'work-item:second', 'work-item:third']);
  expect(records.invocations.get('inv-0060')?.work).toEqual({ workItem: 'work-item:third' });
  expect(imported.map(entry => entry.transaction.event.type)).not.toContain('job-failed');
  expect(unsettledRequests(imported.map(entry => entry.transaction.event))).toHaveLength(1);
});

test('retained import validates essential task and accepted-result evidence', () => {
  const seed = retainedImport();
  expect(validateRestartImport(seed).digest).toBe(seed.digest);
  const altered = structuredClone(seed);
  altered.records[0]!.body = { changed: true };
  expect(() => validateRestartImport(altered)).toThrow('digest');
});
