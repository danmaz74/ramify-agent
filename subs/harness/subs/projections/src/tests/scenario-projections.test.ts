import { describe, expect, test } from 'vitest';
import { scenarioListResponseSchema } from '../../../../src/interfaces/protocol/runs.js';
import { runView } from '../inputs.js';
import { capabilityProgressOf } from '../progress.js';
import { analysisScenariosOf, scenarioListOf } from '../scenarios.js';
import { scenarioSourceHash, type ScenarioRecord } from '../../../scenarios/src/records.js';
import { at as recordAt, constructedRun, item, registered, reviews, type Line } from '../../../../src/tests/helpers/constructed.js';
import { plan } from '../../../../src/tests/helpers/integration-scenario.js';

describe('over constructed records', () => {
  const source = (name: string) => [`Scenario: ${name}`, '  Given a note', '  When it is written', '  Then it is shown'];
  const record = (id: string, entry: string | null, extra: Partial<ScenarioRecord> = {}): ScenarioRecord => ({
    schema: 'ramify-agent.scenario/2',
    id,
    kind: entry === null ? 'integration' : 'entry',
    entry,
    owner: reviews,
    origin: entry === null ? { kind: 'plan', planScenario: 'plan-scenario:write-note', ref: { document: 'document:plan', lines: [12, 16] } } : { kind: 'architect', refs: ['functional-requirement:write-note'] },
    partOf: null,
    subScenarios: [],
    citedElements: [],
    name: id,
    source: source(id),
    hash: scenarioSourceHash(source(id)),
    file: `subs/workspace/subs/reviews/src/tests/features/${plan}/${entry ?? 'integration'}.feature`,
    ...extra,
  });
  const warning = { kind: 'duplicate-architect-steps', scenarios: ['scenario:case-002', 'scenario:case-003'], message: 'scenario:case-002 and scenario:case-003 have identical steps' };
  const lines: Line[] = [
    { type: 'job-started', data: {} },
    {
      type: 'analysis-accepted', data: { invocation: 'inv-0001', entries: 2, hypotheses: 0, registry: 3, workItems: 2, scenarios: 5, scenarioIds: ['scenario:case-001', 'scenario:case-002', 'scenario:case-003', 'scenario:case-004', 'scenario:case-005'], warnings: [warning] },
      records: [
        { path: recordAt('registry', 'write-note'), body: registered('capability:write-note') },
        { path: recordAt('registry', 'show-note'), body: registered('capability:show-note') },
        { path: recordAt('registry', 'store-note'), body: registered('capability:store-note', { origin: 'global-decision', decision: 'gd-001' }) },
        { path: 'work-items/work-item:case-001/item.json', body: item('work-item:case-001', { entry: 'capability:write-note' }) },
        { path: 'work-items/work-item:case-002/item.json', body: item('work-item:case-002', { entry: 'capability:show-note' }) },
        ...[
          record('scenario:case-001', 'capability:write-note', { partOf: 'scenario:case-005' }),
          record('scenario:case-002', 'capability:show-note', { partOf: 'scenario:case-005' }),
          record('scenario:case-003', 'capability:show-note'),
          record('scenario:case-004', 'capability:show-note'),
          record('scenario:case-005', null, { subScenarios: ['scenario:case-001', 'scenario:case-002'] }),
        ].map(body => ({ path: `scenarios/${body.id}.json`, body })),
      ],
    },
    { type: 'obligation-bound', data: { id: 'scenario:case-001', fakes: [], by: 'inv-0003', submission: 'a'.repeat(64) } },
    { type: 'obligation-reported', data: { id: 'scenario:case-001', judgment: 'done', basedOnRevision: 0, revision: 1, by: 'inv-0004', submission: 'b'.repeat(64) } },
    { type: 'obligation-bound', data: { id: 'scenario:case-002', fakes: ['FakeNoteStore'], by: 'inv-0005', submission: 'f'.repeat(64) } },
    { type: 'obligation-bound', data: { id: 'scenario:case-003', fakes: [], by: 'inv-0005', submission: 'f'.repeat(64) } },
  ];

  test('every state, the entry\'s work item, an integration scenario without its work item yet, and no gate that did not run it', () => {
    const list = scenarioListResponseSchema.parse(scenarioListOf(runView(constructedRun(lines))));
    expect(list.scenarios.map(one => [one.id, one.state, one.workItem, one.gates])).toEqual([
      ['scenario:case-001', 'done', 'work-item:case-001', []],
      ['scenario:case-002', 'bound', 'work-item:case-002', []],
      ['scenario:case-003', 'bound', 'work-item:case-002', []],
      ['scenario:case-004', 'pending', 'work-item:case-002', []],
      ['scenario:case-005', 'pending', null, []],
    ]);
    expect(list.scenarios[0]!.origin).toEqual({ kind: 'architect', refs: ['functional-requirement:write-note'] });
    expect(list.scenarios[4]!.origin).toEqual({ kind: 'plan', planScenario: 'plan-scenario:write-note', lines: [12, 16] });
    // Before the analysis is accepted there is nothing to list.
    expect(scenarioListOf(runView(constructedRun(lines.slice(0, 1))))).toEqual({ scenarios: [], total: 0, obligations: [] });
  });

  test('PB3-D04 the list carries each obligation with its responsible owner, its binding\'s fakes, its architect report and its where text, and the scenario states are its statuses', () => {
    const hash = 'c'.repeat(64);
    const where = 'subs/workspace/subs/reviews/src/notes.ts — writeNote';
    const obligationLines: Line[] = [
      ...lines,
      { type: 'capability-delegated', data: { task: 'cap-001', request: 'need-001', parent: 'work-item:case-002', invocation: 'inv-0006', planRevision: 1 } },
      { type: 'obligation-registered', data: { id: 'test:case-001', kind: 'test', responsible: { kind: 'work-item', id: 'work-item:case-001' }, by: 'inv-0007', submission: hash, description: 'A note written twice is kept once' } },
      { type: 'obligation-reported', data: { id: 'scenario:case-001', judgment: 'done', basedOnRevision: 1, revision: 2, where, by: 'inv-0007', submission: hash } },
      { type: 'obligation-reported', data: { id: 'cap-001', judgment: 'done', basedOnRevision: 0, revision: 1, by: 'inv-0008', submission: 'd'.repeat(64) } },
      { type: 'obligation-reported', data: { id: 'cap-001', judgment: 'bound', basedOnRevision: 1, revision: 2, by: 'inv-0009', submission: 'e'.repeat(64) } },
    ];
    const list = scenarioListResponseSchema.parse(scenarioListOf(runView(constructedRun(obligationLines))));
    expect(list.obligations.map(one => [one.id, one.kind, one.responsible, one.status, one.revision, one.report?.judgment ?? null, one.report?.where ?? null])).toEqual([
      ['scenario:case-001', 'scenario', { kind: 'work-item', id: 'work-item:case-001' }, 'done', 2, 'done', where],
      ['scenario:case-002', 'scenario', { kind: 'work-item', id: 'work-item:case-002' }, 'bound', 0, null, null],
      ['scenario:case-003', 'scenario', { kind: 'work-item', id: 'work-item:case-002' }, 'bound', 0, null, null],
      ['scenario:case-004', 'scenario', { kind: 'work-item', id: 'work-item:case-002' }, 'pending', 0, null, null],
      ['scenario:case-005', 'scenario', { kind: 'integration-scenario', id: 'scenario:case-005' }, 'pending', 0, null, null],
      ['cap-001', 'outcome', { kind: 'capability-task', id: 'cap-001' }, 'bound', 2, 'bound', null],
      ['test:case-001', 'test', { kind: 'work-item', id: 'work-item:case-001' }, 'pending', 0, null, null],
    ]);
    expect(list.obligations.find(one => one.id === 'test:case-001')).toMatchObject({ description: 'A note written twice is kept once', registeredBy: { invocation: 'inv-0007', submission: hash } });
    // PB3-D12: the binding's fakes, with the invocation that bound it.
    expect(list.obligations.find(one => one.id === 'scenario:case-002')!.binding).toMatchObject({ fakes: ['FakeNoteStore'], invocation: 'inv-0005', submission: 'f'.repeat(64) });
    expect(list.obligations.find(one => one.id === 'scenario:case-004')!.binding).toBeNull();
    // The scenario states are the same statuses.
    expect(list.scenarios.map(one => [one.id, one.state])).toEqual(list.obligations.filter(one => one.kind === 'scenario').map(one => [one.id, one.status]));
  });

  test('the review carries the warnings of the acceptance, and each entry counts its own scenarios only', () => {
    const view = runView(constructedRun(lines));
    const review = analysisScenariosOf(view);
    expect(review.warnings).toEqual([warning]);
    expect(review.scenarios.map(one => one.id)).toEqual(['scenario:case-001', 'scenario:case-002', 'scenario:case-003', 'scenario:case-004', 'scenario:case-005']);
    expect(capabilityProgressOf(view).map(row => [row.capability, row.scenarios])).toEqual([
      ['capability:write-note', { done: 1, total: 1 }],
      ['capability:show-note', { done: 0, total: 3 }],
      ['capability:store-note', null],
    ]);
  });
});
