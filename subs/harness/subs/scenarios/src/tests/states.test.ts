import { describe, expect, test } from 'vitest';
import {
  applyScenarioEvent,
  boundState,
  carriesPendingTag,
  countScenarioStates,
  initialScenarioStates,
  reduceScenarioStates,
  scenarioEventTypes,
  scenarioStateSchema,
  type ScenarioEvent,
  type ScenarioState,
} from '../states.js';

const bound = (id: string): ScenarioEvent => ({ type: 'obligation-bound', data: { id } });
const reported = (id: string, judgment: 'done' | 'bound'): ScenarioEvent => ({ type: 'obligation-reported', data: { id, judgment } });

describe('PB3-D12: three states, each entered by one accepted submission', () => {
  test('the states are pending, bound and done, and the events are the binding and the report', () => {
    expect(scenarioStateSchema.options).toEqual(['pending', 'bound', 'done']);
    expect(scenarioEventTypes).toEqual(['obligation-bound', 'obligation-reported']);
  });

  const table: { event: ScenarioEvent; from: ScenarioState; to: ScenarioState }[] = [
    { event: bound('scenario:first'), from: 'pending', to: 'bound' },
    { event: bound('scenario:first'), from: 'bound', to: 'bound' },
    // A binding of a done scenario records its fakes and leaves it done.
    { event: bound('scenario:first'), from: 'done', to: 'done' },
    { event: reported('scenario:first', 'done'), from: 'pending', to: 'done' },
    { event: reported('scenario:first', 'done'), from: 'bound', to: 'done' },
    { event: reported('scenario:first', 'done'), from: 'done', to: 'done' },
    // Only the architect's revision moves a done one back.
    { event: reported('scenario:first', 'bound'), from: 'done', to: 'bound' },
  ];
  for (const { event, from, to } of table) {
    test(`${event.type}${event.type === 'obligation-reported' ? ` ${event.data.judgment}` : ''} from ${from}: ${to}`, () => {
      const states = new Map<string, ScenarioState>([['scenario:first', from], ['scenario:second', 'pending']]);
      expect(applyScenarioEvent(states, event)).toEqual(new Map([['scenario:first', to], ['scenario:second', 'pending']]));
      expect(states.get('scenario:first')).toBe(from);
    });
  }

  test('an event naming another kind of obligation leaves the scenario states as they are', () => {
    const states = initialScenarioStates(['scenario:first']);
    expect(applyScenarioEvent(states, reported('capability:other', 'done'))).toBe(states);
    expect(applyScenarioEvent(states, bound('test-001'))).toBe(states);
  });

  test('boundState never undoes a done', () => {
    expect(scenarioStateSchema.options.map(boundState)).toEqual(['bound', 'bound', 'done']);
  });
});

describe('reducing a run\'s events', () => {
  test('a binding, a direct done report and a revision, counted by state', () => {
    const states = reduceScenarioStates(['scenario:first', 'scenario:second', 'scenario:third', 'scenario:fourth'], [
      bound('scenario:first'),
      reported('scenario:second', 'done'),
      reported('scenario:third', 'done'),
      bound('scenario:third'),
      reported('scenario:third', 'bound'),
    ]);
    expect([...states.entries()]).toEqual([['scenario:first', 'bound'], ['scenario:second', 'done'], ['scenario:third', 'bound'], ['scenario:fourth', 'pending']]);
    expect(countScenarioStates(states)).toEqual({ pending: 1, bound: 2, done: 1 });
  });

  test('no events leave every scenario pending', () => {
    expect(countScenarioStates(reduceScenarioStates(['scenario:first', 'scenario:second'], []))).toEqual({ pending: 2, bound: 0, done: 0 });
  });
});

describe('PB3-D06: the pending tag', () => {
  test('is carried only while a scenario is pending; it comes off at bound and at a direct done', () => {
    expect(scenarioStateSchema.options.filter(carriesPendingTag)).toEqual(['pending']);
  });
});
