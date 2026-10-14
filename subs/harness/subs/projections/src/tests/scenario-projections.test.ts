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
    schema: 'ramify-agent.scenario/1',
    id,
    kind: entry === null ? 'integration' : 'entry',
    entry,
    owner: reviews,
    origin: entry === null ? { kind: 'plan', planScenario: 'ps-01', ref: { lines: [12, 16] } } : { kind: 'architect', refs: ['fr-002'] },
    partOf: null,
    subScenarios: [],
    name: id,
    source: source(id),
    hash: scenarioSourceHash(source(id)),
    file: `subs/workspace/subs/reviews/src/tests/features/${plan}/${entry ?? 'integration'}.feature`,
    ...extra,
  });
  const warning = { kind: 'duplicate-architect-steps', scenarios: ['sc-002', 'sc-003'], message: 'sc-002 and sc-003 have identical steps' };
  const lines: Line[] = [
    { type: 'job-started', data: {} },
    {
      type: 'analysis-accepted', data: { invocation: 'inv-0001', entries: 2, hypotheses: 0, registry: 3, workItems: 2, scenarios: 5, warnings: [warning] },
      records: [
        { path: recordAt('registry', 'write-note'), body: registered('write-note') },
        { path: recordAt('registry', 'show-note'), body: registered('show-note') },
        { path: recordAt('registry', 'store-note'), body: registered('store-note', { origin: 'global-decision', decision: 'gd-001' }) },
        { path: 'work-items/wi-001/item.json', body: item('wi-001', { entry: 'write-note' }) },
        { path: 'work-items/wi-002/item.json', body: item('wi-002', { entry: 'show-note' }) },
        ...[
          record('sc-001', 'write-note', { partOf: 'sc-005' }),
          record('sc-002', 'show-note', { partOf: 'sc-005' }),
          record('sc-003', 'show-note'),
          record('sc-004', 'show-note'),
          record('sc-005', null, { subScenarios: ['sc-001', 'sc-002'] }),
        ].map(body => ({ path: `scenarios/${body.id}.json`, body })),
      ],
    },
    { type: 'obligation-bound', data: { id: 'sc-001', fakes: [], by: 'inv-0003', submission: 'a'.repeat(64) } },
    { type: 'obligation-reported', data: { id: 'sc-001', judgment: 'done', basedOnRevision: 0, revision: 1, by: 'inv-0004', submission: 'b'.repeat(64) } },
    { type: 'obligation-bound', data: { id: 'sc-002', fakes: ['FakeNoteStore'], by: 'inv-0005', submission: 'f'.repeat(64) } },
    { type: 'obligation-bound', data: { id: 'sc-003', fakes: [], by: 'inv-0005', submission: 'f'.repeat(64) } },
  ];

  test('every state, the entry\'s work item, an integration scenario without its work item yet, and no gate that did not run it', () => {
    const list = scenarioListResponseSchema.parse(scenarioListOf(runView(constructedRun(lines))));
    expect(list.scenarios.map(one => [one.id, one.state, one.workItem, one.gates])).toEqual([
      ['sc-001', 'done', 'wi-001', []],
      ['sc-002', 'bound', 'wi-002', []],
      ['sc-003', 'bound', 'wi-002', []],
      ['sc-004', 'pending', 'wi-002', []],
      ['sc-005', 'pending', null, []],
    ]);
    expect(list.scenarios[0]!.origin).toEqual({ kind: 'architect', refs: ['fr-002'] });
    expect(list.scenarios[4]!.origin).toEqual({ kind: 'plan', planScenario: 'ps-01', lines: [12, 16] });
    // Before the analysis is accepted there is nothing to list.
    expect(scenarioListOf(runView(constructedRun(lines.slice(0, 1))))).toEqual({ scenarios: [], total: 0, obligations: [] });
  });

  test('PB3-D04 the list carries each obligation with its responsible owner, its binding\'s fakes, its architect report and its where text, and the scenario states are its statuses', () => {
    const hash = 'c'.repeat(64);
    const where = 'subs/workspace/subs/reviews/src/notes.ts — writeNote';
    const obligationLines: Line[] = [
      ...lines,
      { type: 'capability-delegated', data: { task: 'cap-001', request: 'need-001', parent: 'wi-002', invocation: 'inv-0006', planRevision: 1 } },
      { type: 'obligation-registered', data: { id: 'test-001', kind: 'test', responsible: { kind: 'work-item', id: 'wi-001' }, by: 'inv-0007', submission: hash, description: 'A note written twice is kept once' } },
      { type: 'obligation-reported', data: { id: 'sc-001', judgment: 'done', basedOnRevision: 1, revision: 2, where, by: 'inv-0007', submission: hash } },
      { type: 'obligation-reported', data: { id: 'cap-001', judgment: 'done', basedOnRevision: 0, revision: 1, by: 'inv-0008', submission: 'd'.repeat(64) } },
      { type: 'obligation-reported', data: { id: 'cap-001', judgment: 'bound', basedOnRevision: 1, revision: 2, by: 'inv-0009', submission: 'e'.repeat(64) } },
    ];
    const list = scenarioListResponseSchema.parse(scenarioListOf(runView(constructedRun(obligationLines))));
    expect(list.obligations.map(one => [one.id, one.kind, one.responsible, one.status, one.revision, one.report?.judgment ?? null, one.report?.where ?? null])).toEqual([
      ['sc-001', 'scenario', { kind: 'work-item', id: 'wi-001' }, 'done', 2, 'done', where],
      ['sc-002', 'scenario', { kind: 'work-item', id: 'wi-002' }, 'bound', 0, null, null],
      ['sc-003', 'scenario', { kind: 'work-item', id: 'wi-002' }, 'bound', 0, null, null],
      ['sc-004', 'scenario', { kind: 'work-item', id: 'wi-002' }, 'pending', 0, null, null],
      ['sc-005', 'scenario', { kind: 'integration-scenario', id: 'sc-005' }, 'pending', 0, null, null],
      ['cap-001', 'outcome', { kind: 'capability-task', id: 'cap-001' }, 'bound', 2, 'bound', null],
      ['test-001', 'test', { kind: 'work-item', id: 'wi-001' }, 'pending', 0, null, null],
    ]);
    expect(list.obligations.find(one => one.id === 'test-001')).toMatchObject({ description: 'A note written twice is kept once', registeredBy: { invocation: 'inv-0007', submission: hash } });
    // PB3-D12: the binding's fakes, with the invocation that bound it.
    expect(list.obligations.find(one => one.id === 'sc-002')!.binding).toMatchObject({ fakes: ['FakeNoteStore'], invocation: 'inv-0005', submission: 'f'.repeat(64) });
    expect(list.obligations.find(one => one.id === 'sc-004')!.binding).toBeNull();
    // The scenario states are the same statuses.
    expect(list.scenarios.map(one => [one.id, one.state])).toEqual(list.obligations.filter(one => one.kind === 'scenario').map(one => [one.id, one.status]));
  });

  test('the review carries the warnings of the acceptance, and each entry counts its own scenarios only', () => {
    const view = runView(constructedRun(lines));
    const review = analysisScenariosOf(view);
    expect(review.warnings).toEqual([warning]);
    expect(review.scenarios.map(one => one.id)).toEqual(['sc-001', 'sc-002', 'sc-003', 'sc-004', 'sc-005']);
    expect(capabilityProgressOf(view).map(row => [row.capability, row.scenarios])).toEqual([
      ['write-note', { done: 1, total: 1 }],
      ['show-note', { done: 0, total: 3 }],
      ['store-note', null],
    ]);
  });
});
