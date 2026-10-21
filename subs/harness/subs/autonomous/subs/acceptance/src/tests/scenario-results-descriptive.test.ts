import { expect, test } from 'vitest';
import { scenarioResultsOf, untrackedScenarioCounts } from '../checks/scenario-results.js';
import type { GateAttempt } from '../checks/records.js';

test('audit result reader restores descriptive identity tags alongside legacy tags', () => {
  const scenario = (tag: string) => ({ uri: 'src/tests/features/preview.feature', line: 3, tags: [tag], outcome: 'passed', steps: [
    { text: 'a preview is rejected', status: 'passed', definitionLocations: [] },
  ] });
  const gate = { provider: { checks: { scenarios: { cucumberMessages: { status: 'read', run: { scenarios: [
    scenario('@ramify-scenario-reject-missing-predecessor'), scenario('@ramify-sc-001'), scenario('@project-owned'),
  ] } } } } } } as unknown as GateAttempt;
  expect(scenarioResultsOf(gate).map(result => result.id)).toEqual(['scenario:reject-missing-predecessor', 'sc-001']);
  expect(untrackedScenarioCounts(gate)).toEqual({ passed: 1, failed: 0, skipped: 0 });
});
