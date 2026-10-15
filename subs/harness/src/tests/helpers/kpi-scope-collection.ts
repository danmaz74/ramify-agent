import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { RamifyCli, type RamifyRun } from '../../../subs/evidence/src/ramify-cli.js';
import { captureSnapshot, invocationScopeSize, type DeliveredScopeInputs } from '../../../subs/kpi/src/capture.js';
import { deliveredScopeInputs, deliveredSupportEntries, writeScopeMeasurement } from '../../measurement/inputs.js';
import { buildDeliveredManifest, type DeliveredInput } from '../../prompts/delivered-manifest.js';
import type { MeasurementSnapshot, ScopeSize } from '../../run/records.js';
import type { WriteScope } from '../../work/scope.js';

const bucket = (production: number, tests: number, documentation: number, views: number) => ({
  production: { sourceFiles: 1, sourceBytes: production, resourceFiles: 0, resourceBytes: 0 },
  tests: { sourceFiles: 1, sourceBytes: tests, resourceFiles: 0, resourceBytes: 0 },
  documentation: { files: 1, bytes: documentation }, views: { ordinaryBytes: views, testsBytes: 0 },
});

/** Script only the external measurement document, never the KPI answer. */
export class FakeScopeMeasurementCli extends RamifyCli {
  readonly calls: string[] = [];
  readonly document = {
    schema: 'ramify.measure/2', revision: 'rev/1:g:1', root: '/scope-fixture', ownershipRule: 'nearest', views: 'measured',
    modules: [
      { id: 'p', dir: '', parent: null, exact: bucket(100, 0, 10, 5), subtree: bucket(1100, 200, 30, 25) },
      { id: 'p/a', dir: 'subs/a', parent: 'p', exact: bucket(400, 100, 10, 10), subtree: bucket(400, 100, 10, 10) },
      { id: 'p/b', dir: 'subs/b', parent: 'p', exact: bucket(600, 100, 10, 10), subtree: bucket(600, 100, 10, 10) },
    ], files: [],
  };
  override async run(argv: readonly string[], cwd: string): Promise<RamifyRun> {
    assert.equal(cwd, '/scope-fixture');
    assert.deepEqual(argv, ['measure', '--root', '/scope-fixture', '--format', 'json']);
    this.calls.push('measure');
    assert.equal(this.calls.length, 1, 'only one acquisition is scripted');
    return { code: 0, stdout: JSON.stringify(this.document), stderr: '' };
  }
}

export function scopeCollectionFixture() {
  const role: DeliveredInput = { key: 'role', kind: 'role-instructions', text: 'expanded instructions', source: 'role.md', revision: 'v1',
    sources: [{ path: 'role.md', hash: 'r', bytes: 20 }, { path: 'skill.md', hash: 's', bytes: 10 }] };
  const brief: DeliveredInput = { key: 'brief', kind: 'brief', text: 'brief', source: 'brief.md', revision: 'b1' };
  const manifest = buildDeliveredManifest({ inheritedPoint: 'point1', inherited: [role, brief], appended: [role, brief] });
  const write: WriteScope = {
    revision: 1, base: { module: 'p/a', included: [] }, extra: [], read: ['p/b'], bootstrap: [], rationale: 'overlap fixture',
    resolved: { roots: [], files: [], excluded: [], view: { status: 'placeholder' },
      included: [{ directory: '.', kind: 'child-subtree', owner: 'p', reason: 'overlapping subtree', instructions: '', projectInstructions: [] }],
      ownership: { provider: 'ramify.affected-cli/4', ramifyVersion: '0', inputId: 'i', configuration: 'tsconfig.json', root: '/scope-fixture', modules: [], exclusions: [] } },
  };
  const cli = new FakeScopeMeasurementCli();
  let delivered: DeliveredScopeInputs | undefined;
  let snapshot: MeasurementSnapshot | undefined;
  let size: ScopeSize | undefined;
  const current = () => { assert.ok(delivered); assert.ok(snapshot); assert.ok(size); return { delivered, snapshot, size }; };
  return {
    async collect() {
      const declared = writeScopeMeasurement(write, ['p/a']);
      delivered = deliveredScopeInputs(declared, manifest);
      snapshot = await captureSnapshot({ id: 'ms-0001', ramify: cli, projectRoot: '/scope-fixture', head: 'base',
        view: { status: 'materialized', revision: 'rev/1:g:1', input: 'input/1:x', coverageLimits: [] }, supplementary: delivered.supplementary });
      size = invocationScopeSize(snapshot, delivered, delivered.scope, 'engineer', true);
    },
    identities() {
      const facts = deliveredSupportEntries(manifest);
      assert.deepEqual(facts[0]!.sources, [{ path: 'role.md', hash: 'r', bytes: 20 }, { path: 'skill.md', hash: 's', bytes: 10 }]);
      assert.deepEqual(facts[2]!.sources, facts[0]!.sources);
      const { delivered, size } = current();
      assert.deepEqual(delivered.scope.exactOwners, ['p/a']);
      assert.deepEqual(delivered.scope.subtrees, ['p']);
      assert.deepEqual(delivered.scope.supportDocuments, ['role.md', 'skill.md']);
      assert.equal(delivered.scope.brief, 5);
      assert.deepEqual(delivered.supplementary, [{ path: 'role.md', bytes: 20 }, { path: 'skill.md', bytes: 10 }]);
      assert.equal(size.bytes, 1390); // source 1330 + views 25 + support 30 + brief 5, not summed owners.
      assert.equal(size.coverage, 'complete');
    },
    captured() {
      const { delivered, snapshot, size } = current();
      assert.deepEqual(snapshot, {
        schema: 'ramify-agent.measurement-snapshot/1', id: 'ms-0001', policy: 'scope-size/2', head: 'base',
        measure: { revision: 'rev/1:g:1', document: cli.document, hash: createHash('sha256').update(JSON.stringify(cli.document)).digest('hex') },
        view: { status: 'materialized', revision: 'rev/1:g:1', input: 'input/1:x', coverageLimits: [] }, supplementary: [...delivered.supplementary],
      });
      assert.deepEqual(size.components.map(component => [component.component, component.state, component.bytes]), [
        ['owned-source', 'measured', 1330], ['api-views', 'measured', 25], ['architect-view', 'measured', 0], ['support-documents', 'measured', 35],
      ]);
      assert.deepEqual({ policy: size.policy, snapshot: size.snapshot, subtotal: size.subtotal }, { policy: 'scope-size/2', snapshot: 'ms-0001', subtotal: 1390 });
      assert.deepEqual(cli.calls, ['measure']);
    },
    incompatible() {
      const { delivered, snapshot } = current();
      const changed: MeasurementSnapshot = { ...snapshot, view: { status: 'materialized', revision: 'rev/1:g:2', input: 'input/1:x', coverageLimits: [] } };
      const result = invocationScopeSize(changed, delivered, delivered.scope, 'engineer', true);
      assert.equal(result.bytes, null); assert.equal(result.subtotal, 35); assert.equal(result.coverage, 'partial');
      assert.deepEqual(result.components.map(component => [component.component, component.state, component.bytes]), [
        ['owned-source', 'unavailable', null], ['api-views', 'unavailable', null], ['architect-view', 'measured', 0], ['support-documents', 'measured', 35],
      ]);
      for (const component of result.components.slice(0, 2)) {
        assert.match(component.reason!, /rev\/1:g:1/); assert.match(component.reason!, /rev\/1:g:2/);
      }
    },
  };
}
