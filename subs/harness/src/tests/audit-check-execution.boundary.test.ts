import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';

import { gateDiagnostics } from '../../subs/autonomous/subs/acceptance/src/checks/diagnostics.js';
import { inPlaceCheckExecution } from '../../subs/autonomous/subs/acceptance/src/checks/execution.js';
import { runGate } from '../../subs/autonomous/subs/acceptance/src/checks/gate.js';
import { checkCommand, type GateAttempt } from '../../subs/autonomous/subs/acceptance/src/checks/records.js';
import { scenarioResultsOf } from '../../subs/autonomous/subs/acceptance/src/checks/scenario-results.js';
import type { PlannedCheck } from '../../subs/autonomous/subs/acceptance/src/checks/verify.js';
import {
  auditDefinition, commandCheck, configuredGate, configuredRepository, privateConfiguredAudit, recordingOwnership,
  type ConfiguredRepository,
} from './helpers/configured-repository.js';

/*
 * A committing gate asks the project's committed audit about the commit it
 * made, through the installed provider: the harness plans no test, no
 * scenario run and no selection. These witnesses run real Vitest, Cucumber
 * and `ramify affected` in the provider's worktrees, under a private test
 * lock.
 */

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0).reverse()) await cleanup(); });

beforeAll(() => {
  process.env.GIT_CONFIG_GLOBAL = '/dev/null';
  process.env.GIT_CONFIG_SYSTEM = '/dev/null';
});

async function repository(files: Readonly<Record<string, string>>, prefix?: string): Promise<ConfiguredRepository & { readonly head: string }> {
  const created = await configuredRepository(files, prefix);
  cleanups.push(created.remove);
  return created;
}

async function audit(ownership = recordingOwnership()) {
  const created = await privateConfiguredAudit(ownership);
  cleanups.push(created.remove);
  return { ...created, ownership };
}

async function scratch(prefix: string): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), prefix));
  cleanups.push(() => rm(path, { recursive: true, force: true }));
  return path;
}

interface RawCheck {
  readonly status: string;
  readonly output?: string;
  readonly vitest?: { readonly files?: ReadonlyArray<{ readonly path: string; readonly state: string }> };
  readonly commands?: Readonly<Record<string, { readonly vitest?: { readonly files?: ReadonlyArray<{ readonly path: string; readonly state: string }> } }>>;
}

function checksOf(gate: GateAttempt): Record<string, RawCheck> {
  return (gate.provider?.checks ?? {}) as Record<string, RawCheck>;
}

/** Every test file a Vitest check's commands report, with its state. */
function vitestFiles(gate: GateAttempt, check: string): string[] {
  const raw = checksOf(gate)[check];
  if (raw === undefined) return [];
  const files = [...(raw.vitest?.files ?? []), ...Object.values(raw.commands ?? {}).flatMap(command => command.vitest?.files ?? [])];
  return [...new Set(files.map(file => `${file.path} ${file.state}`))].sort();
}

/*
 * F2: one Ramify root with a child and a grandchild, two Vitest
 * configurations (one with its own root and an auxiliary test outside
 * `src/tests`, one with custom file names and an excluded file), and a
 * Cucumber check whose committed profile runs every scenario not tagged
 * `@ramify-pending`.
 */
const steps = (module: string, value: number, text: string) => [
  'import assert from \'node:assert/strict\';',
  'import { Given, Then } from \'@cucumber/cucumber\';',
  `import { ${module}Value } from '../../${module}.js';`,
  '',
  'let seen = 0;',
  `Given('the ${text} value', () => { seen = ${module}Value; });`,
  `Then('the ${text} value is ${value}', () => { assert.equal(seen, ${value}); });`,
  '',
].join('\n');

const f2Definition = (ignorePaths: readonly string[]) => auditDefinition([
  commandCheck('source-vitest', [{ name: 'source', cmd: 'npm', args: ['run', 'test:source'], parser: 'vitest' }]),
  commandCheck('aux-vitest', [{ name: 'aux', cmd: 'npm', args: ['run', 'test:aux'], parser: 'vitest' }]),
  commandCheck('scenarios', [{ name: 'cucumber', cmd: 'npm', args: ['run', 'test:scenarios'], parser: 'cucumber' }]),
], { ignorePaths });

const f2Files: Readonly<Record<string, string>> = {
  'module.ramify': 'ramify 1\nroot module f2\n',
  'package.json': `${JSON.stringify({
    name: 'f2', version: '0.0.0', private: true, type: 'module',
    scripts: {
      'test:source': 'vitest run --config vitest.source.config.mjs',
      'test:aux': 'vitest run --config vitest.aux.config.mjs',
      'test:scenarios': 'NODE_OPTIONS=\'--import tsx\' cucumber-js',
    },
  }, null, 2)}\n`,
  'tsconfig.json': '{"compilerOptions":{"module":"NodeNext","moduleResolution":"NodeNext","target":"ES2022","strict":true,"skipLibCheck":true},"include":["src","subs","checks"]}\n',
  'vitest.source.config.mjs': 'export default { test: { include: [\'src/tests/**/*.check.ts\', \'subs/**/src/tests/**/*.check.ts\'], exclude: [\'**/node_modules/**\', \'**/excluded.check.ts\'] } };\n',
  'vitest.aux.config.mjs': 'export default { root: \'./checks\', test: { include: [\'**/*.test.ts\'] } };\n',
  'cucumber.json': `${JSON.stringify({ default: {
    paths: ['src/tests/features/**/*.feature', 'subs/*/src/tests/features/**/*.feature', 'subs/*/subs/*/src/tests/features/**/*.feature'],
    import: ['src/tests/steps/**/*.ts', 'subs/*/src/tests/steps/**/*.ts', 'subs/*/subs/*/src/tests/steps/**/*.ts'],
    tags: 'not @ramify-pending',
  } }, null, 2)}\n`,
  'ramify-audit.json': f2Definition(['docs/**']),
  'src/root.ts': 'export const rootValue = 1;\n',
  'src/tests/root.check.ts': 'import { expect, test } from \'vitest\';\nimport { rootValue } from \'../root.js\';\ntest(\'root custom name\', () => { expect(rootValue).toBe(1); });\n',
  'src/tests/excluded.check.ts': 'import { test } from \'vitest\';\ntest(\'excluded by the runner\', () => { throw new Error(\'never runs\'); });\n',
  'checks/aux.test.ts': 'import { expect, test } from \'vitest\';\ntest(\'auxiliary root\', () => { expect(1).toBe(1); });\n',
  'subs/a/module.ramify': 'ramify 1\nmodule a\n',
  'subs/a/src/a.ts': 'export const aValue = 2;\n',
  'subs/a/src/tests/child.check.ts': 'import { expect, test } from \'vitest\';\nimport { aValue } from \'../a.js\';\ntest(\'child custom name\', () => { expect(aValue).toBe(2); });\n',
  'subs/a/src/tests/features/child.feature': [
    'Feature: Child',
    '',
    '  @ramify-scenario-child-value-is-bound',
    '  Scenario: the child value is bound',
    '    Given the child value',
    '    Then the child value is 2',
    '',
    '  @ramify-scenario-a-pending-child-scenario @ramify-pending',
    '  Scenario: a pending child scenario',
    '    Given a step nobody has written',
    '',
  ].join('\n'),
  'subs/a/src/tests/steps/child.steps.ts': steps('a', 2, 'child'),
  // A sibling whose path begins with the child's: ownership is by module,
  // never by path prefix.
  'subs/ab/module.ramify': 'ramify 1\nmodule ab\n',
  'subs/ab/src/ab.ts': 'export const abValue = 4;\n',
  'subs/ab/src/tests/ab.check.ts': 'import { expect, test } from \'vitest\';\nimport { abValue } from \'../ab.js\';\ntest(\'collision sibling\', () => { expect(abValue).toBe(4); });\n',
  'subs/a/subs/grand/module.ramify': 'ramify 1\nmodule grand\n',
  'subs/a/subs/grand/src/grand.ts': 'export const grandValue = 3;\n',
  'subs/a/subs/grand/src/tests/grand.check.ts': 'import { expect, test } from \'vitest\';\nimport { grandValue } from \'../grand.js\';\ntest(\'grand custom name\', () => { expect(grandValue).toBeGreaterThan(2); });\n',
  'subs/a/subs/grand/src/tests/features/grand.feature': [
    'Feature: Grand',
    '',
    '  @ramify-scenario-grand-value-is-bound',
    '  Scenario: the grand value is bound',
    '    Given the grand value',
    '    Then the grand value is 3',
    '',
  ].join('\n'),
  'subs/a/subs/grand/src/tests/steps/grand.steps.ts': steps('grand', 3, 'grand'),
};

describe('configured committed execution over F2 (runner truth)', () => {
  it('reads real Vitest and Cucumber results from a full baseline, keeps both identities on reuse, and fails a partial gate on an ambiguous step', { timeout: 600_000 }, async () => {
    const f2 = await repository(f2Files, 'ramify-agent-f2-');
    const { audit: port } = await audit();
    const gate = (sourceCommit: string, attemptId: string) => configuredGate(port, f2, { captured: f2.head, sourceCommit, attemptId });

    // The first gate after readiness: no baseline exists, so the provider
    // executes the default request in full.
    const baseline = await gate(f2.head, 'ga-0001');
    expect(baseline.audit, JSON.stringify(baseline.provider?.result).slice(0, 2000)).toMatchObject({
      status: 'completed', mode: 'project-default', requestedSourceCommit: f2.head, auditedSourceCommit: f2.head,
      requestedMode: 'ramify-partial', executedMode: 'full', verdict: 'pass', reuse: null,
    });
    expect([baseline.verdict, baseline.cause, baseline.commands]).toEqual(['passed', null, []]);
    // Custom names and the auxiliary root are the runner's discoveries.
    expect(vitestFiles(baseline, 'source-vitest')).toEqual([
      'src/tests/root.check.ts passed', 'subs/a/src/tests/child.check.ts passed', 'subs/a/subs/grand/src/tests/grand.check.ts passed',
      'subs/ab/src/tests/ab.check.ts passed',
    ]);
    expect(vitestFiles(baseline, 'aux-vitest').join('\n')).toContain('aux.test.ts passed');
    // The bound scenarios run; the pending one is left out by the committed profile.
    expect(scenarioResultsOf(baseline).map(result => `${result.id} ${result.status}`)).toEqual(['scenario:child-value-is-bound passed', 'scenario:grand-value-is-bound passed']);
    expect(scenarioResultsOf(baseline).find(result => result.id === 'scenario:grand-value-is-bound')?.binding.map(entry => entry.definition))
      .toEqual([expect.stringContaining('subs/a/subs/grand/src/tests/steps/grand.steps.ts'), expect.stringContaining('grand.steps.ts')]);

    // An ignored documentation change: the provider answers with the
    // baseline's evidence, and the gate keeps both source identities.
    const docs = await f2.commit('documentation only', { 'docs/guide.md': '# Guide\n' });
    const reused = await gate(docs, 'ga-0002');
    expect(reused.audit).toMatchObject({
      status: 'completed', requestedSourceCommit: docs, auditedSourceCommit: f2.head, verdict: 'pass',
      reuse: { auditedCommit: f2.head, ignoredChangedPaths: ['docs/guide.md'] },
    });
    expect([reused.verdict, reused.audited, reused.commands, reused.evidence]).toEqual(['passed', docs, [], baseline.evidence]);

    // An ambiguous step is the producer's failure of the scenario check.
    const ambiguous = await f2.commit('ambiguous grandchild step', {
      'subs/a/subs/grand/src/tests/steps/duplicate.steps.ts': 'import { Given } from \'@cucumber/cucumber\';\nGiven(\'the grand value\', () => undefined);\n',
    });
    const failing = await gate(ambiguous, 'ga-0003');
    expect(failing.audit).toMatchObject({ status: 'completed', executedMode: 'ramify-partial', verdict: 'fail' });
    expect([failing.verdict, failing.cause, failing.next]).toEqual(['failed', 'check-failed', 'repair']);
    expect(scenarioResultsOf(failing).map(result => `${result.id} ${result.status}`)).toEqual(['scenario:grand-value-is-bound ambiguous']);
    expect(checksOf(failing)['scenarios']?.status).toBe('fail');
    const briefing = (await gateDiagnostics(failing, 'engineer')).summary.join('\n');
    expect(briefing).toContain('scenario:grand-value-is-bound');
  });
});

/*
 * F4's root: a project without a root `module.ramify`, so every request
 * executes in full, with an explicit ignored documentation tree.
 */
describe('applicable reuse over F4\'s root project', () => {
  async function f4(counter: string) {
    const program = `require('fs').appendFileSync(${JSON.stringify(counter)}, 'ran\\n')`;
    const definition = (ignorePaths: readonly string[]) => auditDefinition([
      commandCheck('root-command', [{ name: 'root', cmd: 'node', args: ['-e', program] }]),
    ], { ignorePaths });
    const repository_ = await repository({ 'package.json': '{"name":"f4-root","private":true}\n', 'src/index.js': 'export const value = 1;\n', 'ramify-audit.json': definition(['docs/**']) }, 'ramify-agent-f4-');
    return { repository: repository_, definition };
  }

  async function runs(counter: string): Promise<number> {
    return existsSync(counter) ? (await readFile(counter, 'utf8')).split('\n').filter(Boolean).length : 0;
  }

  it('reuses applicable full evidence across an ignored-only change, keeping both source identities and executing nothing', { timeout: 300_000 }, async () => {
    const counter = join(await scratch('ramify-agent-f4-counter-'), 'runs');
    const { repository: root } = await f4(counter);
    const { audit: port } = await audit();
    const first = await configuredGate(port, root, { captured: root.head, sourceCommit: root.head, attemptId: 'ga-0001' });
    // The provider's default for a project that is not a Ramify project is full.
    expect(first.audit).toMatchObject({ status: 'completed', mode: 'project-default', requestedMode: 'full', executedMode: 'full', verdict: 'pass', reuse: null });
    expect(await runs(counter)).toBe(1);

    const docs = await root.commit('documentation only', { 'docs/guide.md': '# Guide\n' });
    const reused = await configuredGate(port, root, { captured: root.head, sourceCommit: docs, attemptId: 'ga-0002' });
    expect(reused.audit).toMatchObject({
      status: 'completed', requestedSourceCommit: docs, auditedSourceCommit: root.head, verdict: 'pass',
      reuse: { auditedCommit: root.head, ignoredChangedPaths: ['docs/guide.md'] },
    });
    expect(reused.evidence).toEqual(first.evidence);
    expect([reused.verdict, reused.audited, reused.commands]).toEqual(['passed', docs, []]);
    expect(await runs(counter)).toBe(1);

    // A source change is not ignored: a fresh full execution.
    const source = await root.commit('source change', { 'src/index.js': 'export const value = 2;\n' });
    const fresh = await configuredGate(port, root, { captured: root.head, sourceCommit: source, attemptId: 'ga-0003' });
    expect(fresh.audit).toMatchObject({ status: 'completed', auditedSourceCommit: source, reuse: null, verdict: 'pass' });
    expect(await runs(counter)).toBe(2);
  });

  it('a changed ignore list refuses the active run and needs a new baseline, never reusing evidence recorded under the old list', { timeout: 300_000 }, async () => {
    const counter = join(await scratch('ramify-agent-f4-policy-counter-'), 'runs');
    const { repository: root, definition } = await f4(counter);
    const { audit: port } = await audit();
    const first = await configuredGate(port, root, { captured: root.head, sourceCommit: root.head, attemptId: 'ga-0001' });
    expect(first.audit?.verdict).toBe('pass');

    const policy = await root.commit('ignore notes too', { 'ramify-audit.json': definition(['docs/**', 'notes/**']) });
    const refused = await configuredGate(port, root, { captured: root.head, sourceCommit: policy, attemptId: 'ga-0002' });
    expect([refused.verdict, refused.cause, refused.audit?.status]).toEqual(['not-verified', 'infrastructure', 'failed']);
    expect(await runs(counter)).toBe(1);

    const rebased = await configuredGate(port, root, { captured: policy, sourceCommit: policy, attemptId: 'ga-0003', runId: 'run-new-policy' });
    expect(rebased.audit).toMatchObject({ status: 'completed', auditedSourceCommit: policy, reuse: null, verdict: 'pass' });
    expect(await runs(counter)).toBe(2);
    const notes = await root.commit('notes only', { 'notes/n.md': 'note\n' });
    const reused = await configuredGate(port, root, { captured: policy, sourceCommit: notes, attemptId: 'ga-0004', runId: 'run-new-policy' });
    expect(reused.audit).toMatchObject({ reuse: { auditedCommit: policy, ignoredChangedPaths: ['notes/n.md'] }, verdict: 'pass' });
    expect(await runs(counter)).toBe(2);
  });
});

describe('configured gate outcomes', () => {
  async function plain(checks: readonly unknown[], extra: Readonly<Record<string, string>> = {}, setupCommands?: readonly unknown[]) {
    return repository({ 'package.json': '{"name":"plain","private":true}\n', ...extra, 'ramify-audit.json': auditDefinition(checks, setupCommands === undefined ? {} : { setupCommands }) });
  }

  it('a failing configured command fails the gate with its output and no invented command record', { timeout: 120_000 }, async () => {
    const root = await plain([
      commandCheck('passing', [{ name: 'passing', cmd: 'node', args: ['-e', 'console.log("typed")'] }]),
      commandCheck('failing', [{ name: 'failing', cmd: 'node', args: ['-e', 'console.error("assertion failed in src/x.test.ts"); process.exit(3)'] }]),
    ]);
    const { audit: port } = await audit();
    const started: Parameters<typeof configuredGate>[2]['started'] = [];
    const attempt = await configuredGate(port, root, { captured: root.head, sourceCommit: root.head, attemptId: 'ga-0001', started });
    expect(attempt.audit).toMatchObject({ status: 'completed', verdict: 'fail', definition: { path: 'ramify-audit.json' } });
    expect([attempt.verdict, attempt.cause, attempt.next, attempt.commands]).toEqual(['failed', 'check-failed', 'repair', []]);
    expect(attempt.evidence?.reportCommit).toMatch(/^[0-9a-f]{40}$/u);
    expect(checksOf(attempt)['failing']).toMatchObject({ status: 'fail' });
    expect(started!.map(command => [command.kind, command.name])).toEqual([['configured', 'passing'], ['configured', 'failing']]);
    const summary = (await gateDiagnostics(attempt, 'engineer')).summary.join('\n');
    expect(summary).toContain('failing');
    expect(summary).toContain('assertion failed in src/x.test.ts');
  });

  it('a failing harness rule fails a passing audit, still without a command record', { timeout: 120_000 }, async () => {
    const root = await plain([commandCheck('passing', [{ name: 'passing', cmd: 'node', args: ['-e', 'process.exit(0)'] }])]);
    const { audit: port } = await audit();
    const attempt = await configuredGate(port, root, {
      captured: root.head, sourceCommit: root.head, attemptId: 'ga-0001',
      rules: [{ rule: 'fake-naming', outcome: 'failed', violations: [{ rule: 'fake-naming', path: 'src/fake.ts', detail: 'a fake is named like the real provider' }] }],
    });
    expect(attempt.audit?.verdict).toBe('pass');
    expect([attempt.verdict, attempt.cause, attempt.commands]).toEqual(['failed', 'check-failed', []]);
  });

  it('a setup command that exits non-zero is the candidate\'s failure, and no check runs after it', { timeout: 120_000 }, async () => {
    const marker = join(await scratch('ramify-agent-setup-marker-'), 'check-ran');
    const root = await plain(
      [commandCheck('after-setup', [{ name: 'after', cmd: 'node', args: ['-e', `require("fs").writeFileSync(${JSON.stringify(marker)}, "ran")`] }])],
      {},
      [{ name: 'build', cmd: 'node', args: ['-e', 'console.error("src/a.ts(1,1): error TS2304: Cannot find name x."); process.exit(2)'] }],
    );
    const { audit: port } = await audit();
    const attempt = await configuredGate(port, root, { captured: root.head, sourceCommit: root.head, attemptId: 'ga-0001' });
    expect(attempt.audit?.status).toBe('failed');
    expect(attempt.audit?.detail).toMatch(/^setup-command-failed/u);
    expect([attempt.verdict, attempt.cause, attempt.next, attempt.evidence]).toEqual(['failed', 'check-failed', 'repair', null]);
    expect(existsSync(marker)).toBe(false);
  });

  it('a setup command that does not finish in time is infrastructure, not a failure of the source', { timeout: 120_000 }, async () => {
    const root = await plain(
      [commandCheck('after-setup', [{ name: 'after', cmd: 'node', args: ['-e', 'process.exit(0)'] }])],
      {},
      [{ name: 'slow', cmd: 'node', args: ['-e', 'setTimeout(() => {}, 60000)'], timeoutMs: 500 }],
    );
    const { audit: port } = await audit();
    const attempt = await configuredGate(port, root, { captured: root.head, sourceCommit: root.head, attemptId: 'ga-0001' });
    expect(attempt.audit?.status).toBe('failed');
    expect(attempt.audit?.detail).toMatch(/^setup-command-timed-out/u);
    expect([attempt.verdict, attempt.cause, attempt.next]).toEqual(['not-verified', 'timeout', 'retry-infrastructure']);
  });

  it('cancellation answers nothing for the commit and publishes no evidence', { timeout: 120_000 }, async () => {
    const marker = join(await scratch('ramify-agent-cancel-marker-'), 'started');
    const root = await plain([commandCheck('waiting', [{ name: 'wait', cmd: 'node', args: ['-e', `require("fs").writeFileSync(${JSON.stringify(marker)}, "x"); setInterval(() => {}, 1000)`] }])]);
    const ownership = recordingOwnership();
    const { audit: port } = await audit(ownership);
    const controller = new AbortController();
    const running = configuredGate(port, root, { captured: root.head, sourceCommit: root.head, attemptId: 'ga-0001', signal: controller.signal });
    const deadline = Date.now() + 60_000;
    while (!existsSync(marker) && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 25));
    controller.abort();
    const attempt = await running;
    expect(attempt.audit?.status).toBe('cancelled');
    expect([attempt.verdict, attempt.evidence, attempt.audited]).toEqual(['not-verified', null, null]);
    expect(ownership.cleaned).toEqual(ownership.intended);
    expect(await root.git('for-each-ref', 'refs/audited')).toBe('');
  });

  it('the audit producer supplies timeout evidence independently of the historical gate bound', { timeout: 120_000 }, async () => {
    const root = await plain([commandCheck('waiting', [{ name: 'wait', cmd: 'node', args: ['-e', 'setInterval(() => {}, 1000)'], timeoutMs: 500 }])]);
    const { audit: port } = await audit();
    const attempt = await configuredGate(port, root, { captured: root.head, sourceCommit: root.head, attemptId: 'ga-0001', timeoutMs: 1 });
    expect(attempt.audit).toMatchObject({ status: 'completed', verdict: 'fail' });
    expect(checksOf(attempt)['waiting']).toMatchObject({ status: 'fail', runnerError: { kind: 'timeout' } });
    expect([attempt.verdict, attempt.cause, attempt.next]).toEqual(['not-verified', 'timeout', 'retry-infrastructure']);
  });

  it('reopens the exact completed request without executing its checks again', { timeout: 120_000 }, async () => {
    const counter = join(await scratch('ramify-agent-recovery-counter-'), 'runs');
    const root = await plain([commandCheck('counted', [{ name: 'count', cmd: 'node', args: ['-e', `require("fs").appendFileSync(${JSON.stringify(counter)}, "ran\\n")`] }])]);
    const { audit: port } = await audit();
    const first = await configuredGate(port, root, { captured: root.head, sourceCommit: root.head, attemptId: 'ga-0001' });
    const again = await configuredGate(port, root, { captured: root.head, sourceCommit: root.head, attemptId: 'ga-0001' });
    expect(again.audit?.requestId).toBe(first.audit?.requestId);
    expect(again.evidence).toEqual(first.evidence);
    expect((await readFile(counter, 'utf8')).split('\n').filter(Boolean)).toHaveLength(1);
  });
});

describe('a standalone session\'s in-place diagnosis', () => {
  it('runs its type-check and Ramify check in the working tree and publishes nothing', async () => {
    const root = await scratch('ramify-agent-in-place-');
    const command = (script: string) => checkCommand({ argv: [process.execPath, '-e', script], cwd: root, timeoutMs: 30_000 });
    const checks: PlannedCheck[] = [
      { kind: 'type-check', command: command('console.log("typed")') },
      { kind: 'ramify-check', command: command('console.error("rule broken"); process.exit(1)') },
    ];
    const directory = await scratch('ramify-agent-in-place-output-');
    const attempt = await runGate(inPlaceCheckExecution, 'iteration', { id: 'ga-0001', projectRoot: root, directory, head: 'a'.repeat(40) as GateAttempt['head'], checks });
    expect(attempt.commands.map(record => [record.kind, record.outcome])).toEqual([['type-check', 'passed'], ['ramify-check', 'failed']]);
    expect([attempt.verdict, attempt.audited, attempt.evidence, attempt.audit]).toEqual(['failed', null, null, undefined]);
  });
});
