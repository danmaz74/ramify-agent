import { expect, test } from 'vitest';
import { runView } from '../inputs.js';
import { reachOf } from '../sessions.js';
import type { RunSession } from '../../../autonomous/src/run/sessions.js';
import { constructedRun } from '../../../../src/tests/helpers/constructed.js';
import { capabilityProjectionLines as lines, capabilityContractRun } from '../../../autonomous/subs/work-coordination/src/tests/helpers/capability-projection.js';

test('CA24: registry/contract decoding keeps its contract records', () => {
  const run = capabilityContractRun();
  expect(runView(run).records.contracts.get('contract:format-b-fact')).toMatchObject({ mode: 'fake-backed',
    artifacts: { fake: [{ path: 'subs/reviews/src/fakes/fact.fake.ts' }] } });
});

test('CA23 CA34: capability architect sessions reach task identity, not a similarly named registry capability', () => {
  const view = runView(constructedRun(lines()));
  const session = { role: 'capability-architect', work: { capabilityTask: 'cap-001', request: 'need-001' } } as RunSession;
  expect(reachOf(view, session)).toEqual({ kind: 'capability-task', task: 'cap-001', request: 'need-001',
    assignment: null, module: null });
});
