import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import { architectViewDirectory } from '../../subs/evidence/src/views.js';
import { scopeSize, type DeclaredScope } from '../../subs/kpi/src/capture.js';
import { deliveredManifestScopeInputs as deliveredScopeInputs, invocationScope, readScopeMeasurement, writeScopeMeasurement } from '../../subs/kpi/src/measurement/inputs.js';
import type { MeasurementSnapshot } from '../../subs/kpi/src/run-records.js';
import type { ScopeComponent } from '../../subs/task-execution/src/records.js';
import type { LoadedPackage } from '../prompts/packages.js';
import { buildDeliveredManifest, type DeliveredInput, type DeliveredManifest } from '../../subs/task-execution/src/delivery/delivered-manifest.js';
import type { WriteScope } from '../work/scope.js';

const directories: string[] = [];
afterEach(async () => { for (const directory of directories.splice(0)) await rm(directory, { recursive: true, force: true }); });

/*
 * The `scope-size/2` recipe over a constructed snapshot: each file once,
 * the architect view in its own component only, a role's own support
 * documents and brief, the write scope's extra locations and nested
 * projects, and no numbers merged from two revisions.
 */

const bucket = (bytes: number, tests = 0, documentation = 0, views = 0) => ({
  production: { sourceFiles: 1, sourceBytes: bytes, resourceFiles: 0, resourceBytes: 0 },
  tests: { sourceFiles: 1, sourceBytes: tests, resourceFiles: 0, resourceBytes: 0 },
  documentation: { files: 1, bytes: documentation },
  views: { ordinaryBytes: views, testsBytes: 0 },
});

function snapshot(options: { viewRevision?: string; supplementary?: MeasurementSnapshot['supplementary'] } = {}): MeasurementSnapshot {
  const document = {
    schema: 'ramify.measure/2', revision: 'rev/1:g:1', root: '/project', ownershipRule: 'nearest', views: 'measured',
    modules: [
      { id: 'p', dir: '', parent: null, exact: bucket(100, 0, 10, 5), subtree: bucket(1100, 200, 30, 25) },
      { id: 'p/a', dir: 'subs/a', parent: 'p', exact: bucket(400, 100, 10, 10), subtree: bucket(400, 100, 10, 10) },
      { id: 'p/b', dir: 'subs/b', parent: 'p', exact: bucket(600, 100, 10, 10), subtree: bucket(600, 100, 10, 10) },
    ],
    files: [
      { path: 'src/main.ts', owner: 'p', area: 'ordinary', kind: 'source', bytes: 100 },
      { path: 'subs/a/src/a.ts', owner: 'p/a', area: 'ordinary', kind: 'source', bytes: 400 },
      { path: 'subs/b/src/b.ts', owner: 'p/b', area: 'ordinary', kind: 'source', bytes: 350 },
      { path: 'subs/b/src/fakes/b.ts', owner: 'p/b', area: 'ordinary', kind: 'source', bytes: 250 },
      { path: 'subs/b/src/tests/b.test.ts', owner: 'p/b', area: 'tests', kind: 'source', bytes: 100 },
    ],
  };
  return {
    schema: 'ramify-agent.measurement-snapshot/1', id: 'ms-0001', policy: 'scope-size/2', head: '',
    measure: { revision: 'rev/1:g:1', document, hash: 'a'.repeat(64) },
    view: { status: 'materialized', revision: options.viewRevision ?? 'rev/1:g:1', input: 'input/1:x', coverageLimits: [] },
    supplementary: options.supplementary ?? [
      { path: 'plans/x/plan.md', bytes: 50 },
      { path: 'engineer.system.md', bytes: 300 },
      { path: 'skills/SKILL.md', bytes: 200 },
      { path: 'architect.system.md', bytes: 400 },
      // A second role's package carries the same skill.
      { path: 'skills/SKILL.md', bytes: 200 },
      { path: architectViewDirectory, bytes: 5000 },
    ],
  };
}

const component = (components: readonly ScopeComponent[], name: ScopeComponent['component']) => components.find(entry => entry.component === name)!;

function scope(extra: Partial<DeclaredScope>): DeclaredScope {
  return { exactOwners: [], subtrees: [], apiViews: false, architectView: false, supportDocuments: [], ...extra };
}

// Pure support arithmetic cases are independently asserted in KPI scope-size-recipe.

describe('scope-size/2 measures what a writer was given to write', () => {
  const writeScope = (extra: WriteScope['extra'], included: WriteScope['resolved']['included'] = [], bootstrap: WriteScope['bootstrap'] = []): WriteScope => ({
    revision: 1, base: { module: 'p/a', included: [] }, extra, read: ['p/b'], bootstrap, rationale: 'r',
    resolved: {
      roots: [], files: [], view: { status: 'placeholder' }, excluded: [], included,
      ownership: { provider: 'ramify.affected-cli/4', ramifyVersion: '0', inputId: 'i', configuration: 'tsconfig.json', root: '/project', modules: [], exclusions: [] },
    },
  });

  test('an extra location counts the inventoried files beneath it that the selection does not hold, each once; the soft read scope counts nothing', () => {
    const declared = writeScopeMeasurement(writeScope([
      { path: 'subs/b/src/fakes', purpose: 'fake', kind: 'directory' },
      { path: 'subs/b/src/fakes/b.ts', purpose: 'fake-injection' },
      { path: 'subs/a/src/a.ts', purpose: 'consumer' },
    ]));
    expect(declared.exactOwners).toEqual(['p/a']);
    const size = scopeSize(snapshot(), { ...declared, apiViews: false });
    // p/a exactly (400 + 100 + 10), and b.ts's 250 bytes once; a.ts is already held.
    expect(component(size.components, 'owned-source')).toMatchObject({ state: 'measured', bytes: 760, buckets: { production: 650, tests: 100, documentation: 10 } });
  });

  test('an extra location that cannot be read is a coverage limit with its error, not an absent location', async () => {
    const unreadable = scopeSize(snapshot(), scope({ exactOwners: ['p/a'], locations: [{ path: 'package.json', bytes: 90 }, { path: 'vendor/blob', bytes: null, files: [], unreadable: 'EACCES: permission denied' }] }));
    const owned = component(unreadable.components, 'owned-source');
    expect(owned).toMatchObject({ state: 'unavailable', bytes: null, reason: 'the bytes on disk of an extra location could not be read when the invocation started: vendor/blob: EACCES: permission denied', buckets: { 'outside-inventory': 90 } });
    expect(owned.detail).toContain('vendor/blob (extra, unreadable when the invocation started)');
    expect(unreadable).toMatchObject({ bytes: null, subtotal: 510 + 90, coverage: 'partial' });
    // On disk: an absent location counts nothing, and a path through a file,
    // which is not a directory, is unreadable with the system's error.
    const root = await mkdtemp(join(tmpdir(), 'ramify-agent-scope-location-')); directories.push(root);
    await writeFile(join(root, 'notes.txt'), '12345');
    const loaded = { files: [] } as unknown as LoadedPackage;
    const measured = await invocationScope(root, 'plan', scope({ locations: [{ path: 'absent', bytes: null }, { path: 'notes.txt/inner', bytes: null }, { path: 'notes.txt', bytes: null }] }), loaded, 'brief');
    expect(measured.locations).toEqual([
      { path: 'absent', bytes: null, files: [] },
      { path: 'notes.txt/inner', bytes: null, files: [], unreadable: expect.stringContaining('ENOTDIR') },
      { path: 'notes.txt', bytes: 5, files: [{ path: 'notes.txt', bytes: 5 }] },
    ]);
  });

  test('an included child subtree counts as a subtree, an owned nested project is named without bytes, and a bootstrapped module is unknown until it exists', () => {
    const declared = writeScopeMeasurement(writeScope([], [
      { directory: 'subs/a/subs/c', kind: 'child-subtree', owner: 'p/b', reason: 'r', instructions: 'i', projectInstructions: [] },
      { directory: 'subs/a/nested', kind: 'owned-nested-project', owner: 'p/a', reason: 'r', instructions: 'i', projectInstructions: [] },
    ], [{ capability: { id: 'cap-1', revision: 1, hash: 'b'.repeat(64) }, owner: 'p/a/new', parent: 'p/a', directory: 'subs/a/subs/new' }]));
    expect(declared).toMatchObject({ exactOwners: ['p/a', 'p/a/new'], subtrees: ['p/b'], nestedProjects: ['subs/a/nested'] });
    const owned = component(scopeSize(snapshot(), declared).components, 'owned-source');
    expect(owned).toMatchObject({ state: 'unknown', bytes: null, reason: expect.stringContaining('p/a/new') });
    expect(owned.detail).toContain('p/b (subtree)');
    expect(owned.detail).toContain('subs/a/nested (owned nested project, not inventoried by Ramify and outside the proxy, as in B)');
    const withoutNew = writeScopeMeasurement(writeScope([], [
      { directory: 'subs/a/nested', kind: 'owned-nested-project', owner: 'p/a', reason: 'r', instructions: 'i', projectInstructions: [] },
    ]));
    expect(component(scopeSize(snapshot(), withoutNew).components, 'owned-source')).toMatchObject({ state: 'measured', bytes: 510 });
  });

  test('a contract engineer is given its provider whole beside its write scope', () => {
    expect(writeScopeMeasurement(writeScope([]), ['p/b']).exactOwners).toEqual(['p/a', 'p/b']);
  });
});

// Pure revision comparison cases live with the child-owned implementation.

describe('delivered-manifest adapter preserves recorded facts', () => {
  // Harness owns manifest translation and has testing access to the real child.
  // Plain metadata preserves deliberately inconsistent delivered byte facts;
  // building a manifest from text would re-hash and erase this counterexample.
  test.each([
    { bytes: [5, 6], expected: 6 },
    { bytes: [6, 5], expected: 5 },
    { bytes: [5, 5], expected: 5 },
  ])('same brief hash with ordered bytes $bytes retains last bytes $expected', ({ bytes, expected }) => {
    const manifest: DeliveredManifest = {
      schema: 'ramify-agent.delivered-inputs/1', inheritedPoint: null, currentMessage: null, hash: 'manifest',
      entries: bytes.map((bytes, index) => ({
        key: `brief-${index}`, kind: 'brief', source: null, revision: null,
        hash: 'h', bytes, delivery: 'appended', sources: [],
      })),
    };
    const declared = scope({});
    const delivered = deliveredScopeInputs(declared, manifest);
    expect(delivered).toEqual({ scope: { ...declared, brief: expected }, supplementary: [] });
    const taken = snapshot({ supplementary: [...delivered.supplementary] });
    expect(scopeSize(taken, delivered.scope).bytes).toBe(expected);
  });

  test.each([
    { conflict: 'hash', reverse: false, hash: 'other', bytes: 5 },
    { conflict: 'hash', reverse: true, hash: 'other', bytes: 5 },
    { conflict: 'bytes', reverse: false, hash: 'h', bytes: 6 },
    { conflict: 'bytes', reverse: true, hash: 'h', bytes: 6 },
  ])('same-source $conflict conflict preserves complete error, reverse=$reverse', ({ reverse, hash, bytes }) => {
    const sources = [{ path: 'same', hash: 'h', bytes: 5 }, { path: 'same', hash, bytes }];
    if (reverse) sources.reverse();
    const manifest: DeliveredManifest = {
      schema: 'ramify-agent.delivered-inputs/1', inheritedPoint: null, currentMessage: null, hash: 'manifest',
      entries: sources.map((source, index) => ({
        key: `skill-${index}`, kind: 'skill', source: source.path, revision: null,
        hash: source.hash, bytes: source.bytes, delivery: 'appended', sources: [source],
      })),
    };
    const error = (run: () => unknown) => {
      try { run(); } catch (caught) {
        expect(caught).toBeInstanceOf(Error);
        if (caught instanceof Error) return { name: caught.name, message: caught.message };
        throw caught;
      }
      throw new Error('Expected delivered support conflict');
    };
    expect(error(() => deliveredScopeInputs(scope({}), manifest))).toEqual({ name: 'Error', message: 'Conflicting delivered support revisions for same' });
  });
});

describe('Plan23 F6 delivered scope and partial byte arithmetic', () => {
  // Pure corresponding-baseline case is owned by KPI scope-size-recipe.test.ts.

  test('actually delivered sources deduplicate inherited support/brief while unused package files are absent', () => {
    const role: DeliveredInput = { key: 'role', kind: 'role-instructions', text: 'expanded instructions', source: 'role.md', revision: 'v1',
      sources: [{ path: 'role.md', hash: 'r', bytes: 20 }, { path: 'skill.md', hash: 's', bytes: 10 }] };
    const brief: DeliveredInput = { key: 'brief', kind: 'brief', text: 'brief', source: 'brief.md', revision: 'b1' };
    const manifest = buildDeliveredManifest({ inheritedPoint: 'point1', inherited: [role, brief], appended: [role, brief,
      { key: 'environment', kind: 'environment', text: 'current environment', source: null, revision: null }] });
    const delivered = deliveredScopeInputs(scope({}), manifest);
    expect(delivered.scope.supportDocuments).toEqual(['role.md', 'skill.md']);
    expect(delivered.scope.brief).toBe(5);
    expect(delivered.supplementary).toEqual([{ path: 'role.md', bytes: 20 }, { path: 'skill.md', bytes: 10 }]);
    expect(delivered.scope.supportDocuments).not.toContain('unused-skill.md');
    expect(delivered.scope.supportDocuments).not.toContain('brief.md');
    const commonFile: DeliveredInput = { key: 'same-source', kind: 'skill', text: 'brief', source: 'brief.md', revision: 'b1' };
    const once = deliveredScopeInputs(scope({}), buildDeliveredManifest({ inheritedPoint: null, inherited: [], appended: [brief, commonFile] }));
    expect(once.scope.brief).toBe(0);
    expect(once.supplementary).toEqual([{ path: 'brief.md', bytes: 5 }]);
    const declaration: DeliveredInput = { key: 'tool', kind: 'tool-declaration', text: 'schema', source: null, revision: null };
    const declared = deliveredScopeInputs(scope({}), buildDeliveredManifest({ inheritedPoint: 'point1', inherited: [declaration], appended: [declaration] }));
    expect(declared.supplementary).toEqual([{ path: expect.stringMatching(/^delivered-inputs\/tool-declaration\//), bytes: 6 }]);
    expect(() => deliveredScopeInputs(scope({}), buildDeliveredManifest({ inheritedPoint: 'point1', inherited: [role],
      appended: [{ ...role, sources: [{ path: 'role.md', hash: 'different-revision', bytes: 21 }] }] }))).toThrow('Conflicting delivered support revisions');
  });

  test('outside inventory per-file identities remove held/extra/read overlaps: held10 + new7 adds only7', () => {
    const taken = snapshot();
    taken.measure = { revision: 'rev/1:g:1', hash: 'a'.repeat(64), document: { schema: 'ramify.measure/2', revision: 'rev/1:g:1', views: 'measured',
      modules: [{ id: 'p', parent: null, exact: bucket(10, 0, 0, 0), subtree: bucket(10, 0, 0, 0) }],
      files: [{ path: 'src/held.ts', owner: 'p', area: 'ordinary', bytes: 10 }] } };
    const files = [{ path: 'src/held.ts', bytes: 10 }, { path: 'src/new.txt', bytes: 7 }];
    const measured = scopeSize(taken, scope({ exactOwners: ['p'], locations: [{ path: 'src', bytes: 17, files }, { path: 'src/new.txt', bytes: 7, files: files.slice(1) }] }));
    expect(measured.bytes).toBe(17);
    expect(scopeSize(taken, scope({ locations: [{ path: 'outside/new.txt', bytes: 7 }, { path: 'outside', bytes: 17 }, { path: 'outside', bytes: 17 }] })).bytes).toBe(17);
    const write = { base: { module: 'p', included: [] }, extra: [], read: ['p/a', 'p/a'], bootstrap: [], rationale: '', revision: 1,
      resolved: { included: [], roots: [], files: [], excluded: [], view: { status: 'placeholder' }, ownership: { provider: 'ramify.affected-cli/4', ramifyVersion: '0', inputId: 'i', configuration: 'tsconfig.json', root: '/project', modules: [], exclusions: [] } } } as WriteScope;
    expect(readScopeMeasurement(write).exactOwners).toEqual(['p/a']);
    expect(writeScopeMeasurement(write).exactOwners).toEqual(['p']);
  });

});
