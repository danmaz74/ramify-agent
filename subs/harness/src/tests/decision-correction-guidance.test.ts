import { describe, expect, test } from 'vitest';
import { loadPromptPackages } from '../prompts/packages.js';

// These checks establish that the correction paths are offered and named, not their wording.
describe('correction paths offered by the active prompt packages', () => {
  test.each([true, false])('an engineer may hand work back through partial, capability=%s', async capabilityWorkflow => {
    const { packages } = await loadPromptPackages({ capabilityWorkflow });
    const engineer = packages.get('engineer')!;
    expect(engineer.submissionKinds).toContain('partial');
    expect(engineer.procedure).toContain('`partial`');
  });

  test.each([true, false])('a coordinator may submit unresolved, capability=%s', async capabilityWorkflow => {
    const { packages } = await loadPromptPackages({ capabilityWorkflow });
    for (const role of ['local-architect', ...(capabilityWorkflow ? ['capability-architect' as const] : [])] as const) {
      const loaded = packages.get(role)!;
      expect(loaded.submissionKinds).toContain('unresolved');
      expect(loaded.procedure).toContain('`unresolved`');
    }
  });

  test('the plan architect may answer through a deviation', async () => {
    const { packages } = await loadPromptPackages();
    expect(packages.get('global-fork')!.procedure).toContain('`deviation`');
  });
});
