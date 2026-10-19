import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import type { RamifyRun } from '../../../subs/evidence/src/ramify-cli.js';
import type { ChangeHistory, LineRange } from '../../../subs/evidence/src/git.js';
import { RunQueries } from '../../../subs/projections/src/queries.js';
import { SessionQueries } from '../../../subs/projections/src/session-queries.js';
import { createApp } from '../../http/app.js';
import { createQuerySource } from '../../http/query-source.js';
import { protocolPaths } from '../../interfaces/protocol/paths.js';
import { metricsResponseSchema } from '../../interfaces/protocol/runs.js';
import { runSessionsResponseSchema } from '../../interfaces/protocol/sessions.js';
import { measurementSnapshotSchema, lineEventSummarySchema, type MeasurementSnapshot } from '../../../subs/kpi/src/run-records.js';
import { runLayout } from '../../../subs/autonomous/src/run/records.js';
import { invocationSchema, type Invocation } from '../../../subs/task-execution/src/records.js';
import { FakeRamifyCli } from './fake-ramify.js';
import { treeInputs } from './iterations.js';
import { protocolPolicy, protocolTarget, notesDirectory } from './protocol.js';
import { protocolPorts } from './protocol-ports.js';
import type { ScriptedGit } from './scripted-git.js';
import { openRuns, runPath, startRun } from './runs.js';
import { FakeScopeMeasurementCli } from './kpi-scope-collection.js';

/** External CLI facts; all capture, runner, attribution and query algorithms are real. */
export class FakeRunMeasurementCli extends FakeRamifyCli {
  readonly measurements: string[] = [];
  constructor(readonly root: string) { super(); this.document.root = root; }
  readonly document = {
    ...new FakeScopeMeasurementCli().document,
    modules: [
      { ...new FakeScopeMeasurementCli().document.modules[0]!, id: 'collection-review', dir: '' },
      { ...new FakeScopeMeasurementCli().document.modules[1]!, id: 'collection-review/workspace', dir: 'subs/workspace', parent: 'collection-review' },
      { ...new FakeScopeMeasurementCli().document.modules[1]!, id: 'collection-review/workspace/reviews', dir: 'subs/workspace/subs/reviews', parent: 'collection-review/workspace' },
      { ...new FakeScopeMeasurementCli().document.modules[1]!, id: 'collection-review/workspace/reviews/notes', dir: notesDirectory, parent: 'collection-review/workspace/reviews' },
    ],
  };
  override async run(argv: readonly string[], cwd: string): Promise<RamifyRun> {
    assert.equal(cwd, this.root);
    if (argv[0] !== 'measure') return super.run(argv, cwd);
    assert.deepEqual(argv, ['measure', '--root', this.root, '--format', 'json']);
    this.measurements.push('measure');
    return { code: 0, stdout: JSON.stringify(this.document), stderr: '' };
  }
}

export class FakeRunChangeHistory implements ChangeHistory {
  readonly calls: string[] = [];
  constructor(readonly root: string) {}
  private range(root: string, from: string, to: string) {
    assert.equal(root, this.root); assert.equal(from, 'protocol-base'); assert.equal(to, 'drafts-revision');
  }
  async commitsBetween(root: string, from: string, to: string) {
    this.range(root, from, to); this.calls.push('commits');
    return ['scenarios-revision', 'notes-revision', 'drafts-revision'];
  }
  async changedFiles(root: string, from: string, to: string) {
    this.range(root, from, to); this.calls.push('changes');
    return [{ before: `${notesDirectory}/src/notes.ts`, after: `${notesDirectory}/src/notes.ts`, binary: false, added: [[1, 1] as const], deleted: [[1, 1] as const] }];
  }
  async lineOrigins(root: string, from: string, to: string, path: string, lines: readonly LineRange[]) {
    this.range(root, from, to); assert.equal(path, `${notesDirectory}/src/notes.ts`); assert.deepEqual(lines, [[1, 1]]); this.calls.push('origins');
    return [{ line: 1, commit: 'notes-revision', boundary: false }];
  }
  async lineLastSeen(root: string, from: string, to: string, path: string, lines: readonly LineRange[]) {
    this.range(root, from, to); assert.equal(path, `${notesDirectory}/src/notes.ts`); assert.deepEqual(lines, [[1, 1]]); this.calls.push('last-seen');
    return [{ line: 1, commit: 'notes-revision', boundary: false }];
  }
}

/** Existing deterministic Git/candidate/agent/audit/command answers, shared with protocol regression. */
export const createFakeRunExecutionPorts = protocolPorts;

export function createFakeRunLineGit(root: string, git: ScriptedGit, notesChanged: () => boolean): ScriptedGit {
  return new Proxy(git, { get(target, property, receiver) {
    if (property === 'worktreeLineChanges') return async (project: string, base: string) => {
      assert.equal(project, root); assert.equal(base, git.head());
      return notesChanged() ? [{ path: `${notesDirectory}/src/notes.ts`, added: 1, deleted: 1, binary: false, bytes: 28 }] : [];
    };
    return Reflect.get(target, property, receiver);
  } });
}

/** Committed declarations are present in clean checkouts; requester views are engineer evidence only.
 * The configured type/self checks validate the actual typed imports and access decisions. */
async function parentContracts(declarationPath: string, file: string, symbols: readonly string[]): Promise<void> {
  const text = await readFile(new URL(declarationPath, import.meta.url), 'utf8');
  const exposed = text.split('\n').map(line => line.replace(/\/\/.*$/, '').trim())
    .flatMap(line => {
      const match = /^expose-src\s+(.+?)\s+from\s+"([^"]+)"\s+to\s+parent$/.exec(line);
      return match?.[2] === file ? match[1]!.split(',').map(name => name.trim()) : [];
    });
  for (const symbol of symbols) assert.ok(exposed.includes(symbol), `${declarationPath}: missing parent exposure ${symbol} from ${file}`);
}

export async function projectionImplementationBase(): Promise<void> {
  await parentContracts('../../../subs/projections/module.ramify', 'queries.ts', ['RunQueries', 'RunSource']);
  await parentContracts('../../../subs/projections/module.ramify', 'session-queries.ts', ['SessionQueries']);
  assert.equal(typeof RunQueries.prototype.metrics, 'function');
  assert.equal(typeof SessionQueries.prototype.runSessions, 'function');
  assert.equal(typeof SessionQueries.prototype.runSession, 'function');
}

export async function runCollectionFixture() {
  const target = await protocolTarget(false);
  const { root } = target;
  const ports = createFakeRunExecutionPorts(root);
  const ramify = new FakeRunMeasurementCli(root);
  const history = new FakeRunChangeHistory(root);
  const inputs = treeInputs();
  const viewPath = '.ramify-architect';
  let notesChanged = false;
  const git = createFakeRunLineGit(root, ports.git, () => notesChanged);
  const { service } = await openRuns(root, { ...ports, git, ramify, changeHistory: history,
    script: spec => {
      const steps = ports.script(spec);
      if (steps.some(step => step.kind === 'tool' && step.tool === 'edit')) notesChanged = true;
      return steps;
    },
    inputs: { ...inputs, async capture(...args) {
      await mkdir(join(root, viewPath), { recursive: true });
      await writeFile(join(root, viewPath, 'README.md'), 'view!\n');
      return inputs.capture(...args);
    } }, policy: projectRoot => protocolPolicy(projectRoot) });
  let runId: string | undefined;
  let snapshot: MeasurementSnapshot | undefined;
  let invocations: Invocation[] = [];
  let metrics: ReturnType<typeof metricsResponseSchema.parse> | undefined;
  let sessions: ReturnType<typeof runSessionsResponseSchema.parse> | undefined;
  let server: ReturnType<ReturnType<typeof createApp>['listen']> | undefined;
  async function exercise() {
    const receipt = await service.execute(startRun('review-notes'));
    runId = receipt.jobId;
    await service.settled('review-notes', runId);
    const state = service.getRun('review-notes', runId);
    assert.equal(state?.state, 'completed', JSON.stringify(state));
    const directory = runPath(root, 'review-notes', runId);
    snapshot = measurementSnapshotSchema.parse(JSON.parse(await readFile(join(directory, runLayout.measurement('ms-0001')), 'utf8')));
    for (const id of await readdir(join(directory, 'invocations'))) {
      const path = join(directory, runLayout.invocation(id));
      invocations.push(invocationSchema.parse(JSON.parse(await readFile(path, 'utf8'))));
    }
    const source = createQuerySource(service);
    metrics = metricsResponseSchema.parse(await new RunQueries(source).metrics('review-notes', runId));
    sessions = runSessionsResponseSchema.parse(await new SessionQueries(source).runSessions('review-notes', runId));
  }
  function collected() { assert.ok(runId); assert.ok(snapshot); assert.ok(metrics); assert.ok(sessions); return { runId, snapshot, metrics, sessions }; }
  return {
    exercise,
    provider() {
      const { snapshot } = collected();
      assert.deepEqual(snapshot.measure, { revision: 'rev/1:g:1', document: ramify.document,
        hash: createHash('sha256').update(JSON.stringify(ramify.document)).digest('hex') });
      assert.equal(snapshot.policy, 'scope-size/2'); assert.ok(ramify.measurements.length > 0);
      assert.ok(invocations.some(row => row.role === 'engineer' && row.scope.size?.policy === 'scope-size/2'));
      assert.ok(ports.git.commits().some(commit => commit.id === 'notes-revision'));
      assert.ok(ports.git.commits().some(commit => commit.id === 'drafts-revision'));
    },
    async persisted() {
      const { runId, snapshot } = collected();
      const record = JSON.parse(await readFile(runPath(root, 'review-notes', runId, runLayout.record), 'utf8'));
      assert.equal(record.baseline.measurement.id, snapshot.id);
      assert.ok(invocations.length > 3);
      const writer = invocations.find(row => row.role === 'engineer' && row.scope.size?.bytes !== null)!;
      assert.ok(writer); assert.equal(writer.scope.measurement?.id, snapshot.id);
      assert.deepEqual(writer.scope.size!.components.map(component => component.component), ['owned-source', 'api-views', 'architect-view', 'support-documents']);
      assert.equal(writer.scope.size!.components[0]!.bytes, 510);
      assert.equal(writer.scope.size!.components[1]!.bytes, 10);
      const lines = lineEventSummarySchema.parse(JSON.parse(await readFile(runPath(root, 'review-notes', runId, runLayout.lineEvents(writer.id)), 'utf8')));
      assert.equal(lines.invocation, writer.id);
      assert.deepEqual(lines.paths, [{ path: `${notesDirectory}/src/notes.ts`, owner: 'collection-review/workspace/reviews/notes', added: 1, deleted: 1, binary: false, bytes: null }]);
      assert.equal(lines.coverage, 'complete'); assert.deepEqual(lines.gaps, []);
    },
    async http() {
      const { runId, metrics, sessions } = collected();
      assert.equal(metrics.policyVersion, 'kpi/1');
      assert.equal(metrics.measurementPolicy, 'scope-size/2');
      assert.equal(metrics.lineage.policyVersion, 'lineage/2');
      const support = new Map(collected().snapshot.supplementary.filter(entry => entry.path !== '.ramify-architect').map(entry => [entry.path, entry.bytes]));
      const supportBytes = [...support.values()].reduce((sum, bytes) => sum + bytes, 0);
      assert.deepEqual(metrics.baseline, { state: 'measured', snapshot: 'ms-0001', bytes: 1330 + 25 + 6 + supportBytes });
      assert.ok(sessions.sessions.length > 0);
      const writer = invocations.find(row => row.role === 'engineer' && row.scope.size?.bytes !== null)!;
      const evaluation = sessions.sessions.flatMap(session => session.invocations).find(row => row.invocation === writer.id)!.evaluation;
      assert.ok(evaluation);
      assert.equal(evaluation.role, 'engineer'); assert.equal(evaluation.writer, true);
      assert.deepEqual(evaluation.lines, { coverage: 'complete', paths: 1, added: 1, deleted: 1, gaps: [] });
      assert.equal(evaluation.efficiency?.declared?.policy, 'scope-size/2');
      assert.equal(evaluation.efficiency?.declared?.components[0]!.bytes, 510);
      assert.equal(evaluation.efficiency?.declared?.components[1]!.bytes, 10);
      assert.deepEqual(metrics.evaluation.invocations.find(row => row.invocation === writer.id), evaluation);
      assert.deepEqual(history.calls, ['commits', 'changes', 'origins', 'last-seen', 'commits', 'changes', 'origins', 'last-seen']);
      const weighted = metrics.metrics.find(metric => metric.id === 'scope-bytes-per-changed-line');
      assert.ok(weighted); assert.equal(weighted.state, 'unavailable', JSON.stringify(weighted));
      assert.equal(weighted.value, null); assert.equal(weighted.numerator, null);
      assert.equal(weighted.denominator, 1); assert.deepEqual(weighted.coverage, { covered: 3, total: 4 });
      const proposed = invocations.find(row => row.role === 'engineer' && row.scope.size?.components[0]?.state === 'unknown')!;
      assert.ok(proposed); assert.equal(proposed.scope.size!.bytes, null);
      assert.equal(weighted.subtotal, writer.scope.size!.bytes! + proposed.scope.size!.subtotal);
      assert.ok(weighted.evidence.some(line => line.includes('no measured module for collection-review/workspace/reviews/notes/drafts; a module that does not exist yet has an unknown size, not a zero one')));
      assert.equal(weighted.policyVersion, 'kpi/1'); assert.equal(weighted.measurementPolicy, 'scope-size/2');
      assert.ok(weighted.evidence.includes('delivered change protocol-bas..drafts-revis'));
      server = createApp({ projectRoot: root, runs: service }).listen(0, '127.0.0.1');
      await new Promise<void>(resolve => server!.once('listening', resolve));
      const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      const get = async (path: string) => { const response = await fetch(origin + path); assert.equal(response.status, 200); return response.json(); };
      assert.deepEqual(await get(protocolPaths.runMetrics('review-notes', runId)), metrics);
      assert.deepEqual(await get(protocolPaths.runSessions('review-notes', runId)), sessions);
      const queries = new SessionQueries(createQuerySource(service));
      for (const session of sessions.sessions) assert.deepEqual(await get(protocolPaths.runSession('review-notes', runId, session.session)), await queries.runSession('review-notes', runId, session.session));
    },
    async contracts() {
      await parentContracts('../../../subs/kpi/module.ramify', 'capture.ts', [
        'captureSnapshot', 'SnapshotRequest', 'invocationScopeSize', 'DeclaredScope', 'DeliveredScopeInputs', 'InvocationScopeDeclaration',
      ]);
      await parentContracts('../../../subs/kpi/module.ramify', 'lines.ts', ['takeLineSnapshot', 'lineEvents', 'LineSnapshot', 'LineEventRequest', 'LineChange']);
      await projectionImplementationBase();
      // These committed production consumers are typed and checked by the configured type/self checks.
      for (const [path, names] of [
        ['../../run/service.ts', ['captureSnapshot', 'takeLineSnapshot', 'lineEvents']],
        ['../../steps/runner.ts', ['invocationScopeSize', 'DeclaredScope']],
        ['../../measurement/inputs.ts', ['DeliveredScopeInputs', 'DeclaredScope']],
      ] as const) {
        const source = await readFile(new URL(path, import.meta.url), 'utf8');
        const imports = source.match(/\bimport\s+(?:type\s+)?\{[^}]*\}\s+from ['"][^'"]*subs\/kpi\/src\/(?:capture|lines)\.js['"];?/g)?.join('\n') ?? '';
        for (const name of names) assert.match(imports, new RegExp(`\\b${name}\\b`), `${path}: typed KPI consumer import ${name}`);
      }
      await assert.rejects(readdir(new URL('../../kpi/', import.meta.url)), { code: 'ENOENT' });
    },
    async close() {
      if (server) await new Promise<void>((resolve, reject) => server!.close(error => error ? reject(error) : resolve()));
      await service.close();
      try { ports.git.assertComplete(); } finally { await target.remove(); }
    },
  };
}
