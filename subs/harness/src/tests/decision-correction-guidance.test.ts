import { describe, expect, test } from 'vitest';
import { loadPromptPackages } from '../prompts/packages.js';

// These checks establish delivered instructions, not agent judgment or a live run.
describe('correction guidance delivered by the active prompt packages', () => {
  test('architect stable instructions also cover advisory forks and preserve authority', async () => {
    const { packages } = await loadPromptPackages();
    for (const role of ['initial-architect', 'local-architect', 'capability-architect', 'global-fork'] as const) {
      const system = packages.get(role)!.system;
      expect(system).toContain('simplest sufficient correction');
      expect(system).toContain('interfaces,');
      expect(system).toContain('plausible simpler alternative');
      expect(system).toContain('During an advisory consultation');
      expect(system).toContain('advice changes no');
      expect(system).toContain('current authority');
      expect(system).toContain('through `partial` to its assigning architect');
    }
    const system = packages.get('nonfunctional-coordinator')!.system;
    expect(system).toContain('simplest sufficient correction');
    expect(system).toContain('decision\'s current authority');
  });

  test.each([true, false])('fresh and continued engineer procedures retain discovery and partial handoff, capability=%s', async capabilityWorkflow => {
    const { packages } = await loadPromptPackages({ capabilityWorkflow });
    const engineer = packages.get('engineer')!;
    expect(engineer.procedure).toContain('On every fresh or continued step-writing task');
    expect(engineer.procedure).toContain('globally loaded support files and expressions');
    expect(engineer.procedure).toContain('unavailable configuration evidence');
    expect(engineer.procedure).toContain('World state');
    expect(engineer.procedure).toContain('Discovery alone does not establish');
    expect(engineer.procedure).toContain('zero executed scenarios is not passing acceptance');
    expect(engineer.procedure).toContain('return `partial`');
    expect(engineer.procedure).toContain('separate verified facts from');
    expect(engineer.procedure).toContain('A partial result ends this engineer session');
    expect(engineer.procedure).toContain('current acceptance and scope');
    expect(engineer.submissionKinds).toContain('partial');
  });

  test.each([true, false])('coordinators compare resolutions and prepare a fresh corrected assignment, capability=%s', async capabilityWorkflow => {
    const { packages } = await loadPromptPackages({ capabilityWorkflow });
    for (const role of ['local-architect', ...(capabilityWorkflow ? ['capability-architect' as const] : [])] as const) {
      const loaded = packages.get(role)!;
      expect(loaded.procedure).toContain('ask the plan architect to evaluate it before');
      expect(loaded.procedure).toContain('you submit\n`unresolved`');
      expect(loaded.procedure).toContain('fresh engineer');
      expect(loaded.procedure).toContain('completed and remaining work');
      expect(loaded.procedure).toContain('current acceptance and scope');
      expect(loaded.procedure).toContain('bound or completed scenarios cannot be reworded');
      expect(loaded.submissionKinds).toContain('unresolved');
    }
  });

  test('plan architect guidance exposes the pending-only deviation without bypassing its criteria', async () => {
    const { packages } = await loadPromptPackages();
    const global = packages.get('global-fork')!;
    expect(global.procedure).toContain('A collision alone does not justify a');
    expect(global.procedure).toContain('Use the existing `deviation` fields');
    expect(global.procedure).toContain('old\nand new scenario text');
    expect(global.procedure).toContain('Only pending scenarios may be reworded');
    expect(global.procedure).toContain('user-review findings, continuation limits and decision behavior');
    expect(packages.get('initial-architect')!.procedure).toContain('may reword only pending scenarios');
  });
});
