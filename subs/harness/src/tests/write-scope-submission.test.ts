import { mkdir, writeFile, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { ownershipAnswerOfAffected, type OwnershipAnswer } from '../../subs/evidence/src/ownership-evidence.js';
import { guardedChildProcess, resetSpawnAttempts, spawnAttempts } from './helpers/process-guard.js';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
vi.mock('node:child_process', async importOriginal => guardedChildProcess(await importOriginal<typeof import('node:child_process')>()));
import type { AffectedDocument } from 'ramify.ts/cli';
import { RamifyCli } from '../../subs/evidence/src/ramify-cli.js';
import { historicalScopeDecisions, missingHistoricalAuthority, checkWriteScope, defaultWriteScopeOf, type ScopeCapture } from '../work/scope.js';
import { defaultWriteScopeSection } from '../../subs/autonomous/src/work/session.js';
import { temporaryDirectory } from './helpers/fixture.js';
import { architectIndex, moduleEntry } from './helpers/views.js';

/*
 * A submitted write scope is judged at submission against one ownership
 * answer: the `included` entries, the capture itself and the placement of
 * each `extra` file. Every refusal is a submission error with its path, so
 * the architect corrects it in the same turn instead of the run failing
 * after the outline is committed. The provider answers literal facts here.
 */

type Topology = AffectedDocument['selection']['scope']['ownership'];

const topology: Topology = {
  modules: [
    { id: 'app', parent: null, directory: '.' },
    { id: 'app/ui', parent: 'app', directory: 'subs/ui' },
    { id: 'app/ui/widgets', parent: 'app/ui', directory: 'subs/ui/subs/widgets' },
    { id: 'app/store', parent: 'app', directory: 'subs/store' },
  ],
  exclusions: [
    { kind: 'owned-nested-project', directory: 'subs/ui/tools/cli', owner: 'app/ui' },
    { kind: 'external', directory: 'subs/ui/vendor', owner: null },
    { kind: 'scratch', directory: 'subs/ui/src/tmp', owner: 'app/ui' },
    { kind: 'owned-nested-project', directory: 'subs/ui/subs/widgets/demo', owner: 'app/ui/widgets' },
  ],
};

/** The provider's answer for these facts: each seed by its innermost exclusion and owner. */
class LiteralOwnership extends RamifyCli {
  readonly queries: string[][] = [];

  constructor(private readonly configuration = 'tsconfig.json') {
    super({ executable: '/nonexistent/no-ramify', timeoutMs: 0 });
  }

  override async queryOwnershipAnswer(root: string, paths: readonly string[] = ['.']): Promise<OwnershipAnswer> {
    return ownershipAnswerOfAffected(await this.queryOwnership(root, paths));
  }
  override async queryOwnership(projectRoot: string, paths: readonly string[] = ['.']): Promise<AffectedDocument> {
    this.queries.push([...paths]);
    const inside = (path: string, directory: string) => directory === '.' || path === directory || path.startsWith(`${directory}/`);
    const seeds = paths.map(path => {
      const exclusion = topology.exclusions.filter(entry => inside(path, entry.directory)).sort((a, b) => b.directory.length - a.directory.length)[0] ?? null;
      const owner = topology.modules.filter(module => inside(path, module.directory)).sort((a, b) => b.directory.length - a.directory.length)[0]!;
      if (exclusion !== null && exclusion.owner === null) return { path, status: 'excluded', module: null, basis: 'excluded', exclusion, kind: null, selects: [] };
      return { path, status: 'owned', module: exclusion?.owner ?? owner.id, basis: 'containment', exclusion, kind: 'inert', selects: [] };
    });
    return { schemaVersion: 'ramify.affected-cli/4', root: projectRoot, mode: 'batch', ramifyVersion: 'literal',
      revision: { sequence: null, inputId: 'literal' }, selection: { schemaVersion: 'ramify.affected/4', inputId: 'literal', paths: seeds,
        scope: { root: projectRoot, selection: 'given', configuration: this.configuration, invokedFrom: projectRoot, walkedAreas: [], ownership: topology },
        changedModules: [], affectedModules: [], testModules: [], selection: 'dependency-closure', widening: [], coverage: { status: 'complete', notes: [] }, analysisCheck: 'passed' } } as unknown as AffectedDocument;
  }
}

const cleanups: Array<() => Promise<void>> = [];
beforeEach(() => resetSpawnAttempts());
afterEach(async () => {
  for (const cleanup of cleanups.splice(0)) await cleanup();
  expect(spawnAttempts()).toEqual([]);
});

const entry = (directory: string) => ({ directory, reason: 'The work needs it whole', instructions: 'Verify it at its root' });

async function check(scope: Partial<Pick<ScopeCapture, 'base' | 'extra'>>, ramify = new LiteralOwnership()) {
  const directory = await temporaryDirectory();
  cleanups.push(directory.remove);
  const result = await checkWriteScope({ projectRoot: directory.path, ramify, index: null, view: { status: 'placeholder' }, revision: 1,
    base: scope.base ?? { module: 'app/ui', included: [] }, extra: scope.extra ?? [], read: [], bootstrap: [], rationale: 'r' });
  return { ...result, ramify };
}

describe('included entries', () => {
  test('a directory inside the owner is already part of the base, and the error says to remove it', async () => {
    const { scope, errors, ramify } = await check({ base: { module: 'app/ui', included: [entry('subs/ui/src/tests')] } });
    expect(scope).toBeNull();
    expect(errors).toEqual([{
      path: 'assignment.scope.base.included.0.directory',
      message: '"subs/ui/src/tests" lies inside the own contents of "app/ui", which the base already gives the module engineer whole; remove this entry',
      expected: 'one of "subs/ui/subs/widgets", "subs/ui/tools/cli", or no entry',
    }]);
    // One ownership query judged the whole scope.
    expect(ramify.queries).toEqual([['.', 'subs/ui/src/tests']]);
  });

  test('a directory that is not an immediate child or an owned nested-project root is refused', async () => {
    const sibling = await check({ base: { module: 'app/ui', included: [entry('subs/store')] } });
    expect(sibling.errors).toEqual([expect.objectContaining({ path: 'assignment.scope.base.included.0.directory',
      message: '"subs/store" is neither an immediate child module directory of "app/ui" nor an owned nested-project root' })]);
    const grandchild = await check({ base: { module: 'app', included: [entry('subs/ui/subs/widgets')] } });
    expect(grandchild.errors.map(error => error.path)).toEqual(['assignment.scope.base.included.0.directory']);
  });

  test('a nested project of a child needs that child included too', async () => {
    const alone = await check({ base: { module: 'app/ui', included: [entry('subs/ui/subs/widgets/demo')] } });
    expect(alone.errors).toEqual([expect.objectContaining({ path: 'assignment.scope.base.included.0.directory',
      message: expect.stringContaining('belongs to "app/ui/widgets", which is neither the assigned owner nor inside an included child') })]);
    const withChild = await check({ base: { module: 'app/ui', included: [entry('subs/ui/subs/widgets'), entry('subs/ui/subs/widgets/demo')] } });
    expect(withChild.errors).toEqual([]);
  });

  test('an immediate child and an owned nested-project root are accepted and captured with their kinds', async () => {
    const { scope, errors } = await check({ base: { module: 'app/ui', included: [entry('subs/ui/subs/widgets'), entry('subs/ui/tools/cli')] } });
    expect(errors).toEqual([]);
    expect(scope!.resolved.included.map(included => [included.directory, included.kind, included.owner])).toEqual([
      ['subs/ui/subs/widgets', 'child-subtree', 'app/ui/widgets'], ['subs/ui/tools/cli', 'owned-nested-project', 'app/ui'],
    ]);
  });

  test('a repeated directory and a blank reason are refused at their paths', async () => {
    const { errors } = await check({ base: { module: 'app/ui', included: [entry('subs/ui/subs/widgets'), { ...entry('subs/ui/subs/widgets') },
      { directory: 'subs/ui/tools/cli', reason: ' ', instructions: 'i' }] } });
    expect(errors.map(error => error.path)).toEqual(['assignment.scope.base.included.1.directory', 'assignment.scope.base.included.2.reason']);
  });
});

describe('extra files', () => {
  test('a file in an excluded region or in a nested project the scope does not include is refused; another owner\'s file is accepted', async () => {
    const { errors } = await check({ extra: [
      { path: 'subs/ui/vendor/lib.ts', purpose: 'consumer' },
      { path: 'subs/ui/tools/cli/main.ts', purpose: 'consumer' },
      { path: 'subs/store/src/store.ts', purpose: 'consumer' },
    ] });
    expect(errors).toEqual([
      expect.objectContaining({ path: 'assignment.scope.extra.0.path', message: '"subs/ui/vendor/lib.ts" lies in the external region "subs/ui/vendor", which no assignment opens, so no engineer could write it' }),
      expect.objectContaining({ path: 'assignment.scope.extra.1.path', message: '"subs/ui/tools/cli/main.ts" lies in the owned nested project "subs/ui/tools/cli", which this scope does not include, so no engineer could write it' }),
    ]);
    const included = await check({ base: { module: 'app/ui', included: [entry('subs/ui/tools/cli')] }, extra: [{ path: 'subs/ui/tools/cli/main.ts', purpose: 'consumer' }] });
    expect(included.errors).toEqual([]);
  });
});

test('a capture that throws is a rejection of the scope, not a failure', async () => {
  const { scope, errors } = await check({}, new LiteralOwnership('../outside/tsconfig.json'));
  expect(scope).toBeNull();
  expect(errors).toEqual([{ path: 'assignment.scope', message: 'The write scope cannot be captured: Provider configuration is outside the captured project',
    expected: 'a scope the installed provider can capture' }]);
});

test('the default write scope names the owner, the only valid included directories and the guarded files beneath it', () => {
  const index = architectIndex([moduleEntry('app', '', null), moduleEntry('app/ui', 'subs/ui', 'app'),
    moduleEntry('app/ui/widgets', 'subs/ui/subs/widgets', 'app/ui'), moduleEntry('app/store', 'subs/store', 'app')]);
  const guarded = ['package.json', 'subs/ui/package.json', 'subs/ui/tsconfig.json', 'subs/ui/subs/widgets/package.json'];
  const scope = defaultWriteScopeOf(index, 'app/ui', topology, guarded)!;
  expect(scope).toEqual({ module: 'app/ui', directory: 'subs/ui', children: [{ module: 'app/ui/widgets', directory: 'subs/ui/subs/widgets' }],
    nestedProjects: ['subs/ui/tools/cli'], guarded: ['subs/ui/package.json', 'subs/ui/tsconfig.json'] });
  expect(defaultWriteScopeOf(index, 'app/absent', topology, guarded)).toBeUndefined();
  // Without the provider's answer the view names the owner and its children, and the nested-project roots are unknown.
  expect(defaultWriteScopeOf(index, 'app/ui', null, guarded)).toEqual({ ...scope, nestedProjects: null,
    guarded: ['subs/ui/package.json', 'subs/ui/tsconfig.json'] });
  expect(defaultWriteScopeOf(null, 'app/ui', null, guarded)).toBeUndefined();
  expect(defaultWriteScopeSection([scope]).join('\n')).toBe([
    '## Default write scope',
    '',
    '- `app/ui`: the base gives its engineer `subs/ui/` whole — `module.ramify`, `README.md`, all of `src/` with `src/tests/` and `src/interfaces/`, other documentation and auxiliary source — except the directories below.',
    '  - Immediate child modules: `subs/ui/subs/widgets` (`app/ui/widgets`).',
    '  - Owned nested-project roots: `subs/ui/tools/cli`.',
    '  - Guarded files, writable only with an authorization: `subs/ui/package.json`, `subs/ui/tsconfig.json`.',
    '',
    'Those child and nested-project directories are the only valid `included` values, and `included` is `[]` unless the iteration needs one of them whole. An included child brings its whole subtree, every module beneath it included.',
    '',
  ].join('\n'));
  expect(defaultWriteScopeSection([{ ...scope, nestedProjects: null }]).join('\n')).toContain('Owned nested-project roots: unavailable, because the ownership query gave no answer.');
});


test('captured children stay closed while exact sibling extras retain their file authority', async () => {
  const captured = await check({ extra: [{ path: 'subs/store/README.md', purpose: 'consumer' }] });
  const scope = captured.scope!;
  const root = scope.resolved.ownership.root;
  expect(scope.resolved.excluded).toContain(`${root}/subs/ui/subs/widgets`);
  expect(scope.resolved.excluded).not.toContain(`${root}/subs/store`);
  const retained = { latest: null, reference: null, paths: new Map<string, boolean>() };
  expect(historicalScopeDecisions(scope, retained, ['subs/ui/src/a.ts', 'subs/ui/subs/widgets/src/a.ts', 'subs/store/README.md', 'subs/store/src/a.ts', 'subs/ui/vendor/a.ts', 'subs/ui/tools/cli/a.ts']).map(item => item.allowed))
    .toEqual([true, false, true, false, false, false]);
  const older = { ...scope, resolved: { ...scope.resolved, boundaryVersion: undefined } };
  expect(missingHistoricalAuthority(older)).toEqual(['verified non-included child directory capture']);
  expect(() => historicalScopeDecisions(older, retained, ['subs/ui/src/a.ts'])).toThrow('Historical repair lacks');
});

test('fresh evidence can remove a temporary restriction but never expand the assignment', async () => {
  const captured = await check({});
  const scope = captured.scope!;
  const root = scope.resolved.ownership.root;
  const latest = await captured.ramify.queryOwnershipAnswer(root, ['subs/ui/src/a.ts', 'subs/store/src/a.ts']);
  const retained = { latest, reference: null, paths: new Map([['subs/ui/src/a.ts', false]]) };
  expect(historicalScopeDecisions(scope, retained, ['subs/ui/src/a.ts', 'subs/store/src/a.ts']).map(item => item.allowed)).toEqual([false, false]);
  retained.paths.set('subs/ui/src/a.ts', true);
  expect(historicalScopeDecisions(scope, retained, ['subs/ui/src/a.ts', 'subs/store/src/a.ts']).map(item => item.allowed)).toEqual([true, false]);
});

test('historical permission protects hard segments and unapproved declarations even in owned scratch', async () => {
  const { scope } = await check({});
  const retained = { latest: null, reference: null, paths: new Map<string, boolean>() };
  const paths = ['subs/ui/.git/config', 'subs/ui/src/node_modules/x.ts', 'subs/ui/src/.ramify/x',
    'subs/ui/.ramify-architect/x', 'subs/ui/.ramify.tmp-session/x', 'subs/ui/.ramify-architect.old-session/x',
    'subs/ui/src/tmp/module.ramify', 'subs/ui/src/tmp/new/module.ramify', 'subs/ui/src/tmp/ordinary.ts'];
  expect(historicalScopeDecisions(scope!, retained, paths).map(item => item.allowed)).toEqual([false, false, false, false, false, false, false, false, true]);
});


test('included nested projects retain existing declarations without following protected trees or aliases', async () => {
  const directory = await temporaryDirectory(); cleanups.push(directory.remove);
  const nested = 'subs/ui/tools/cli';
  for (const path of [nested, `${nested}/subs/child`, `${nested}/.git`, `${nested}/node_modules/pkg`]) {
    await mkdir(join(directory.path, path), { recursive: true });
    await writeFile(join(directory.path, path, 'module.ramify'), 'captured declaration');
  }
  await symlink(join(directory.path, nested, '.git'), join(directory.path, nested, 'alias'), 'dir');
  const result = await checkWriteScope({ projectRoot: directory.path, ramify: new LiteralOwnership(), index: null,
    view: { status: 'placeholder' }, revision: 1, base: { module: 'app/ui', included: [entry(nested)] },
    extra: [], read: [], bootstrap: [], rationale: 'nested project repair' });
  expect(result.errors).toEqual([]);
  const scope = result.scope!;
  expect(scope.resolved.nestedDeclarations?.map(entry => entry.path).sort()).toEqual([`${nested}/module.ramify`, `${nested}/subs/child/module.ramify`]);
  const paths = [`${nested}/module.ramify`, `${nested}/subs/child/module.ramify`, `${nested}/subs/new/module.ramify`, `${nested}/.git/module.ramify`, `${nested}/alias/module.ramify`];
  expect(historicalScopeDecisions(scope, { latest: null, reference: null, paths: new Map() }, paths).map(entry => entry.allowed)).toEqual([true, true, false, false, false]);
});

test('explicit contract directory extras keep their existing owner region while nested exclusions remain closed', async () => {
  const { scope, errors } = await check({ extra: [{ path: 'subs/store', purpose: 'contract', kind: 'directory' }] });
  expect(errors).toEqual([]);
  expect(scope!.resolved.excluded).not.toContain(`${scope!.resolved.ownership.root}/subs/store`);
  expect(historicalScopeDecisions(scope!, { latest: null, reference: null, paths: new Map() }, ['subs/store/src/store.ts']).map(entry => entry.allowed)).toEqual([true]);
});
