import { describe, expect, test } from 'vitest';
import { baselineScope, deliveredScopeInputs, projectOnlySize, scopeSize, type DeclaredScope, type DeliveredSupportEntry } from '../capture.js';
import type { MeasurementSnapshot, ScopeComponent } from '../../../../src/run/records.js';

const bucket = (bytes: number, tests = 0, documentation = 0, views = 0) => ({
  production: { sourceFiles: 1, sourceBytes: bytes, resourceFiles: 0, resourceBytes: 0 },
  tests: { sourceFiles: 1, sourceBytes: tests, resourceFiles: 0, resourceBytes: 0 },
  documentation: { files: 1, bytes: documentation }, views: { ordinaryBytes: views, testsBytes: 0 },
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
      { path: 'plans/x/plan.md', bytes: 50 }, { path: 'engineer.system.md', bytes: 300 },
      { path: 'skills/SKILL.md', bytes: 200 }, { path: 'architect.system.md', bytes: 400 },
      { path: 'skills/SKILL.md', bytes: 200 }, { path: '.ramify-architect', bytes: 5000 },
    ],
  };
}
const component = (components: readonly ScopeComponent[], name: ScopeComponent['component']) => components.find(entry => entry.component === name)!;
function scope(extra: Partial<DeclaredScope>): DeclaredScope {
  return { exactOwners: [], subtrees: [], apiViews: false, architectView: false, supportDocuments: [], ...extra };
}
const entry = (extra: Partial<DeliveredSupportEntry>): DeliveredSupportEntry => ({ kind: 'skill', source: null, hash: 'h', bytes: 5, sources: [], ...extra });

describe('scope-size/2 counts each file once', () => {
  test('B counts every support document once, and the architect view in its own component only', () => {
    const taken = snapshot();
    const size = scopeSize(taken, baselineScope('p', taken.supplementary.map(entry => entry.path)));
    expect(size.policy).toBe('scope-size/2');
    expect(component(size.components, 'architect-view')).toMatchObject({ state: 'measured', bytes: 5000 });
    expect(component(size.components, 'support-documents')).toMatchObject({ state: 'measured', bytes: 950, buckets: { documents: 950 } });
    expect(size.bytes).toBe(1100 + 200 + 30 + 25 + 5000 + 950);
  });
  test('a role is measured over its own support documents and the brief it was delivered', () => {
    const size = scopeSize(snapshot(), scope({ exactOwners: ['p/a'], supportDocuments: ['plans/x/plan.md', 'engineer.system.md', 'skills/SKILL.md', 'skills/SKILL.md'], brief: 700 }));
    expect(component(size.components, 'support-documents')).toMatchObject({ state: 'measured', bytes: 1250, buckets: { documents: 550, brief: 700 }, detail: '3 distinct documents: plans/x/plan.md, engineer.system.md, skills/SKILL.md; the delivered brief' });
  });
  test('a support document the snapshot did not capture leaves the component unavailable, never zero', () => {
    const size = scopeSize(snapshot(), scope({ supportDocuments: ['nowhere.md'] }));
    expect(component(size.components, 'support-documents')).toMatchObject({ state: 'unavailable', bytes: null, reason: expect.stringContaining('nowhere.md') });
    expect(size.bytes).toBeNull();
  });
});
describe('scope-size/2 measures supplied writer facts', () => {
  test('an extra location counts the inventoried files beneath it that the selection does not hold, each once; the soft read scope counts nothing', () => {
    const size = scopeSize(snapshot(), scope({ exactOwners: ['p/a'], locations: [{ path: 'subs/b/src/fakes', bytes: null }, { path: 'subs/b/src/fakes/b.ts', bytes: null }, { path: 'subs/a/src/a.ts', bytes: null }] }));
    expect(component(size.components, 'owned-source')).toMatchObject({ state: 'measured', bytes: 760, buckets: { production: 650, tests: 100, documentation: 10 } });
  });
  test('an extra location outside the inventory counts its bytes on disk, and one absent when the invocation started counts nothing', () => {
    const size = scopeSize(snapshot(), scope({ exactOwners: ['p/a'], locations: [{ path: 'package.json', bytes: 90 }, { path: 'subs/a/new.ts', bytes: null }] }));
    const owned = component(size.components, 'owned-source');
    expect(owned).toMatchObject({ state: 'measured', bytes: 600, buckets: { 'outside-inventory': 90 } });
    expect(owned.detail).toContain('package.json (extra, outside Ramify\'s inventory, bytes on disk)');
    expect(owned.detail).toContain('subs/a/new.ts (extra, absent when the invocation started)');
  });
  test('an extra location that cannot be read is a coverage limit with its error, not an absent location', () => {
    const unreadable = scopeSize(snapshot(), scope({ exactOwners: ['p/a'], locations: [{ path: 'package.json', bytes: 90 }, { path: 'vendor/blob', bytes: null, files: [], unreadable: 'EACCES: permission denied' }] }));
    const owned = component(unreadable.components, 'owned-source');
    expect(owned).toMatchObject({ state: 'unavailable', bytes: null, reason: 'the bytes on disk of an extra location could not be read when the invocation started: vendor/blob: EACCES: permission denied', buckets: { 'outside-inventory': 90 } });
    expect(owned.detail).toContain('vendor/blob (extra, unreadable when the invocation started)');
    expect(unreadable).toMatchObject({ bytes: null, subtotal: 600, coverage: 'partial' });
  });
  test('an included child subtree counts as a subtree, an owned nested project is named without bytes, and a bootstrapped module is unknown until it exists', () => {
    const declared = scope({ exactOwners: ['p/a', 'p/a/new'], subtrees: ['p/b'], nestedProjects: ['subs/a/nested'], apiViews: true });
    const owned = component(scopeSize(snapshot(), declared).components, 'owned-source');
    expect(owned).toMatchObject({ state: 'unknown', bytes: null, reason: expect.stringContaining('p/a/new') });
    expect(owned.detail).toContain('p/b (subtree)');
    expect(owned.detail).toContain('subs/a/nested (owned nested project, not inventoried by Ramify and outside the proxy, as in B)');
    expect(component(scopeSize(snapshot(), scope({ exactOwners: ['p/a'], nestedProjects: ['subs/a/nested'] })).components, 'owned-source')).toMatchObject({ state: 'measured', bytes: 510 });
  });
});
describe('scope-size/2 never merges numbers of two revisions', () => {
  test('a measurement of another revision than the view leaves every measured component but the support documents unavailable, with the reason', () => {
    const taken = snapshot({ viewRevision: 'rev/1:g:2' });
    const size = scopeSize(taken, baselineScope('p', taken.supplementary.map(entry => entry.path)));
    for (const name of ['owned-source', 'api-views', 'architect-view'] as const) expect(component(size.components, name)).toMatchObject({ state: 'unavailable', bytes: null, reason: expect.stringContaining('revision rev/1:g:1 and the architect view of revision rev/1:g:2') });
    expect(component(size.components, 'support-documents')).toMatchObject({ state: 'measured', bytes: 950 });
    expect(size).toMatchObject({ bytes: null, subtotal: 950, coverage: 'partial' });
  });
  test('a scope without the architect view keeps that component measured at zero, but its source is still of the other state', () => {
    const size = scopeSize(snapshot({ viewRevision: 'rev/1:g:2' }), scope({ exactOwners: ['p/a'] }));
    expect(component(size.components, 'architect-view')).toMatchObject({ state: 'measured', bytes: 0 });
    expect(component(size.components, 'owned-source')).toMatchObject({ state: 'unavailable', bytes: null });
  });
});
describe('Plan23 F6 delivered scope and partial byte arithmetic', () => {
  test('independent 100/20/30/50 baseline and 40/10/15/20/5 writer have 120/200 and 50/90 bytes', () => {
    const taken = snapshot({ supplementary: [{ path: '.ramify-architect', bytes: 30 }, { path: 'baseline-support.md', bytes: 50 }, { path: 'role.md', bytes: 20 }] });
    taken.measure = { revision: 'rev/1:g:1', hash: 'a'.repeat(64), document: { schema: 'ramify.measure/2', revision: 'rev/1:g:1', views: 'measured', modules: [{ id: 'p', parent: null, exact: bucket(60, 0, 0, 10), subtree: bucket(100, 0, 0, 20) }, { id: 'p/a', parent: 'p', exact: bucket(40, 0, 0, 10), subtree: bucket(40, 0, 0, 10) }], files: [] } };
    const baseline = scopeSize(taken, baselineScope('p', ['baseline-support.md', 'baseline-support.md', '.ramify-architect/README.md']));
    const writer = scopeSize({ ...taken, supplementary: [{ path: '.ramify-architect', bytes: 15 }, { path: 'role.md', bytes: 20 }] }, scope({ exactOwners: ['p/a'], apiViews: true, architectView: true, supportDocuments: ['role.md', 'role.md', '.ramify-architect/module.json'], brief: 5 }));
    expect(projectOnlySize(baseline).bytes).toBe(120); expect(baseline.bytes).toBe(200);
    expect(projectOnlySize(writer).bytes).toBe(50); expect(writer.bytes).toBe(90);
  });
  test('actually delivered sources deduplicate inherited support/brief while unused package files are absent', () => {
    const role = entry({ kind: 'role-instructions', source: 'role.md', hash: 'expanded', bytes: 21, sources: [{ path: 'role.md', hash: 'r', bytes: 20 }, { path: 'skill.md', hash: 's', bytes: 10 }] });
    const brief = entry({ kind: 'brief', source: 'brief.md', hash: 'b' });
    const delivered = deliveredScopeInputs(scope({}), [role, brief, role, brief, entry({ kind: 'environment' })]);
    expect(delivered.scope.supportDocuments).toEqual(['role.md', 'skill.md']); expect(delivered.scope.brief).toBe(5);
    expect(delivered.supplementary).toEqual([{ path: 'role.md', bytes: 20 }, { path: 'skill.md', bytes: 10 }]);
    expect(delivered.scope.supportDocuments).not.toContain('unused-skill.md'); expect(delivered.scope.supportDocuments).not.toContain('brief.md');
    const once = deliveredScopeInputs(scope({}), [brief, entry({ source: 'brief.md', hash: 'b' })]);
    expect(once.scope.brief).toBe(0); expect(once.supplementary).toEqual([{ path: 'brief.md', bytes: 5 }]);
    const declaration = entry({ kind: 'tool-declaration', hash: 'schema', bytes: 6 });
    expect(deliveredScopeInputs(scope({}), [declaration, declaration]).supplementary).toEqual([{ path: 'delivered-inputs/tool-declaration/schema', bytes: 6 }]);
    expect(() => deliveredScopeInputs(scope({}), [role, { ...role, sources: [{ path: 'role.md', hash: 'different-revision', bytes: 21 }] }])).toThrow('Conflicting delivered support revisions');
  });
  test('partial support and new bootstrap preserve known disjoint buckets, while mixed state/policy bytes are rejected', () => {
    const partial = scopeSize(snapshot(), scope({ exactOwners: ['p/a', 'p/new'], apiViews: true, supportDocuments: ['skills/SKILL.md', 'missing.md'], brief: 5 }));
    expect(partial).toMatchObject({ bytes: null, subtotal: 725, coverage: 'partial' }); expect(projectOnlySize(partial)).toMatchObject({ bytes: null, subtotal: 520 });
    expect(scopeSize(snapshot({ viewRevision: 'rev/2' }), scope({ exactOwners: ['p/a'], apiViews: true, supportDocuments: ['skills/SKILL.md'] }))).toMatchObject({ bytes: null, subtotal: 200 });
    const mismatched = scopeSize(snapshot({ viewRevision: 'rev/2' }), scope({ exactOwners: ['p/a'], supportDocuments: ['skills/SKILL.md'] }));
    expect(component(mismatched.components, 'api-views')).toMatchObject({ state: 'measured', bytes: 0 });
    expect(component(mismatched.components, 'architect-view')).toMatchObject({ state: 'measured', bytes: 0 });
    expect(component(mismatched.components, 'owned-source')).toMatchObject({ state: 'unavailable', bytes: null, reason: expect.stringContaining('two states') });
    expect(component(scopeSize(snapshot({ viewRevision: 'rev/2' }), scope({ apiViews: false })).components, 'owned-source')).toMatchObject({ state: 'measured', bytes: 0 });
    expect(scopeSize({ ...snapshot(), policy: 'scope-size/1' }, scope({ exactOwners: ['p/a'], supportDocuments: ['skills/SKILL.md'] }))).toMatchObject({ bytes: null, subtotal: 0 });
  });
  test('outside inventory per-file identities remove held/extra/read overlaps: held10 + new7 adds only7', () => {
    const taken = snapshot();
    taken.measure = { revision: 'rev/1:g:1', hash: 'a'.repeat(64), document: { schema: 'ramify.measure/2', revision: 'rev/1:g:1', views: 'measured', modules: [{ id: 'p', parent: null, exact: bucket(10), subtree: bucket(10) }], files: [{ path: 'src/held.ts', owner: 'p', area: 'ordinary', bytes: 10 }] } };
    const files = [{ path: 'src/held.ts', bytes: 10 }, { path: 'src/new.txt', bytes: 7 }];
    expect(scopeSize(taken, scope({ exactOwners: ['p'], locations: [{ path: 'src', bytes: 17, files }, { path: 'src/new.txt', bytes: 7, files: files.slice(1) }] })).bytes).toBe(17);
    expect(scopeSize(taken, scope({ locations: [{ path: 'outside/new.txt', bytes: 7 }, { path: 'outside', bytes: 17 }, { path: 'outside', bytes: 17 }] })).bytes).toBe(17);
  });
  test('support in an unselected owner still counts, whereas a selected inventoried file counts once', () => {
    const name = 'subs/b/src/b.ts';
    expect(scopeSize(snapshot(), scope({ exactOwners: ['p/a'], supportDocuments: [name] })).bytes).toBe(860);
    expect(scopeSize(snapshot(), scope({ exactOwners: ['p/b'], supportDocuments: [name] })).bytes).toBe(710);
  });
});

test('overlapping subtrees and duplicate exact owners count once', () => {
  const measured = scopeSize(snapshot(), scope({ subtrees: ['p', 'p/a', 'p'], exactOwners: ['p/a', 'p/b', 'p/b'], apiViews: true }));
  expect(measured.bytes).toBe(1355);
});
test.each([{ hash: 'other', bytes: 5 }, { hash: 'h', bytes: 6 }])('conflicting source hash or bytes are rejected: %j', conflict => {
  expect(() => deliveredScopeInputs(scope({}), [entry({ source: 'same' }), entry({ source: 'same', ...conflict })])).toThrow('Conflicting delivered support revisions for same');
});
test('repeated brief hash cannot silently replace different bytes', () => {
  expect(() => deliveredScopeInputs(scope({}), [entry({ kind: 'brief' }), entry({ kind: 'brief', bytes: 6 })])).toThrow('Conflicting delivered brief bytes');
});
test('API-view omissions retain known disjoint subtotal', () => {
  const taken = snapshot();
  if ('unavailable' in taken.measure) throw new Error('fixture');
  const document = taken.measure.document as { modules: { exact: { views?: unknown } }[] };
  delete document.modules[2]!.exact.views;
  const measured = scopeSize(taken, scope({ exactOwners: ['p/a', 'p/b'], apiViews: true }));
  expect(component(measured.components, 'api-views')).toMatchObject({ bytes: null, buckets: { ordinary: 10, tests: 0 }, reason: 'ramify measure omitted API-view bytes for p/b' });
  expect(measured).toMatchObject({ bytes: null, subtotal: 1230, coverage: 'partial' });
});
