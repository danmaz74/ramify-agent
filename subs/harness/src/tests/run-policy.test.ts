import { afterEach, describe, expect, test } from 'vitest';
import { diagnosisChecks } from '../../subs/autonomous/subs/acceptance/src/checks/checkpoint.js';
import { defaultRunPolicy } from '../run/policy.js';
import { runPolicySchema } from '../../subs/autonomous/src/run/records.js';
import { RunService, type RunServiceOptions } from '../run/lifecycle.js';
import { copyFixture } from './helpers/fixture.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

/*
 * The policy a run captures: the bounds it ran under and the commands it
 * reached the project through. It is hardcoded and recorded, not
 * configurable while the run runs, so an exhaustion is reproducible.
 *
 * `env` names the variables the harness's allowlist gives the child and holds
 * no value of one; `recorded-environment.test.ts` covers what that keeps out.
 */

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) await cleanup();
});

describe('the captured commands', () => {
  test('production constructor refuses policy injection before creating a service', async () => {
    await expect(RunService.open({ policy: () => defaultRunPolicy({ projectRoot: '/project' }) } as unknown as RunServiceOptions))
      .rejects.toThrow('Production run policy is fixed');
  });
  test('name the environment the harness built and capture no test command', () => {
    const policy = defaultRunPolicy({ projectRoot: '/project' });
    expect(runPolicySchema.parse(policy)).toEqual(policy);
    // No test command is captured: a run's gates ask the committed audit,
    // whose definition names the project's suites and scenario checks.
    expect(Object.keys(policy.commands).sort()).toEqual(['hookTimeoutMs', 'ramifyChanged', 'ramifyCheck', 'typeCheck']);
    for (const command of [policy.commands.typeCheck, policy.commands.ramifyCheck]) {
      expect(command.cwd).toBe('/project');
      expect(command.env).toContain('PATH');
      expect(command.env).not.toContain('NODE_OPTIONS');
      expect(command.envAdditions).toEqual({});
    }
  });

  test('every role has its context policy, and a role with none is refused', () => {
    const policy = defaultRunPolicy({ projectRoot: '/project' });
    for (const context of Object.values(policy.context)) expect(context).toEqual({ compaction: 'allowed', budgetTokens: null, budgetFraction: null, reportReserveTokens: 0 });
    const { engineer: _dropped, ...partial } = policy.context;
    expect(runPolicySchema.safeParse({ ...policy, context: partial }).success).toBe(false);
    // A policy without the reviewer's context is refused.
    const { reviewer: _reviewer, ...earlier } = policy.context;
    expect(runPolicySchema.safeParse({ ...policy, version: 'run-policy/2', context: earlier, reviews: undefined }).success).toBe(false);
  });
});

describe('new-run policy does not infer packages', () => {
  test('an unrelated manifest and a deep setup-only manifest add no command to the policy', async () => {
    const fixture = await copyFixture();
    cleanups.push(fixture.remove);
    for (const directory of ['subs/unrelated', 'subs/a/subs/b/subs/c/subs/d/tools']) {
      await mkdir(join(fixture.root, directory), { recursive: true });
      await writeFile(join(fixture.root, directory, 'package.json'), JSON.stringify({ scripts: { test: 'vitest run' } }));
    }
    const policy = defaultRunPolicy({ projectRoot: fixture.root });
    expect(Object.keys(policy.commands).sort()).toEqual(['hookTimeoutMs', 'ramifyChanged', 'ramifyCheck', 'typeCheck']);
  }, 60_000);
});

describe('the checkpoint policy', () => {
  test('a standalone diagnosis runs the project\'s setup, its type check and a complete Ramify check, and no test', () => {
    const policy = defaultRunPolicy({ projectRoot: '/project' });
    const checks = diagnosisChecks(policy.commands, [{ name: 'build', command: ['npm', 'run', 'build'] }], '/project');
    expect(checks.map(check => check.kind)).toEqual(['setup', 'type-check', 'ramify-check']);
    expect(checks[0]!.command.cwd).toBe('/project');
    expect(checks[1]!.command).toEqual(policy.commands.typeCheck);
    expect(checks[2]!.command).toEqual(policy.commands.ramifyCheck);
    expect(diagnosisChecks(policy.commands, [], '/project').map(check => check.kind)).toEqual(['type-check', 'ramify-check']);
  });
});
