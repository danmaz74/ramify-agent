import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { loadArchitectIndex } from '../../subs/evidence/src/views.js';
import { piBuiltinDeclarations } from '../../subs/agent/subs/pi/src/session-operations.js';
import { loadPromptPackages } from '../prompts/packages.js';
import { defaultRunPolicy } from '../run/policy.js';
import { constructOrientationStep } from '../steps/local-architect.js';
import { renderStep } from '../steps/render.js';
import { consultationFixture, answer, ask } from './helpers/consultations.js';
import { localViewInputsOf } from '../../subs/autonomous/subs/work-coordination/src/work/view-inputs.js';

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0)) await cleanup(); });
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'coverage-delivery-'));
  cleanups.push(() => rm(root, { recursive: true, force: true }));
  const write = async (path: string, bytes: string) => {
    await mkdir(join(root, path, '..'), { recursive: true }); await writeFile(join(root, path), bytes);
  };
  const module = 'app/owner';
  await write('.ramify-architect/_meta.json', JSON.stringify({ schema: 'ramify.architect-view/3', revision: 'architect-R', input: 'architect-I',
    modules: 1, cut: 13, dependencies: 'measured', dependencyScope: 'production' }));
  await write('.ramify-architect/unusual/module.json', JSON.stringify({ schema: 'ramify.architect-module/3', module, dir: 'pkg', parent: null, children: [], tags: [], areas: ['src', 'src/tests'] }));
  const records = Array.from({ length: 13 }, (_, number) => ({ module, name: `S${number}`, file: 'pkg/src/a.ts', cut: ['sig'] }));
  await write('.ramify-architect/unusual/behavior.jsonl', records.map(record => JSON.stringify(record)).join('\n'));
  await write('.ramify-architect/unusual/supporting.jsonl', '');
  await mkdir(join(root, 'pkg/src'), { recursive: true });
  return { root, write, module, index: await loadArchitectIndex(root), view: { status: 'materialized' as const, revision: 'architect-R', input: 'architect-I', coverageLimits: ['cut: 13'] } };
}

test('local orientation packet bounds coverage and separates ordinary/testing identities from readable architect details', async () => {
  const f = await fixture();
  for (const [area, revision] of [['src', 'ordinary-R'], ['src/tests', 'testing-R']] as const) {
    await f.write(`pkg/${area}/.ramify/_meta.json`, JSON.stringify({ revision, coverage: 1 }));
    await mkdir(join(f.root, `pkg/${area}/.ramify/external`), { recursive: true });
  }
  // Directory aliases must resolve to the declared module, without guessing generated paths.
  const views = await localViewInputsOf(f.root, 'pkg', f.index, f.view);
  expect(views.map(view => view.revision)).toEqual(['ordinary-R', 'testing-R']);
  expect(views[0]!.modules).toEqual([f.module]);
  expect(views[1]!.coverage).toEqual(['one source-analysis limit that may have left a received API out of this view, so absence is not proof of unavailability']);
  const policy = defaultRunPolicy({ projectRoot: f.root });
  const { packages } = await loadPromptPackages({ capabilityWorkflow: false });
  const step = constructOrientationStep({ schema: 'ramify-agent.step-inputs/1', run: { planId: 'P', runId: 'R' }, attempt: 1,
    capabilityWorkflow: false, limits: policy.limits, context: { compaction: 'forbidden', budgetTokens: null, budgetFraction: null, reportReserveTokens: 0 },
    role: 'local-architect', phase: 'orientation', work: { workItem: 'W' }, workingDirectory: { project: 'pkg/src' }, start: { kind: 'fresh' },
    requirements: ['Inspect relevant module coverage'], known: { declaredChecks: { checks: [], paths: [] }, modules: [], testAreas: [], scenarioFeatures: [], stepDirectories: [] },
    architectView: views, briefing: { item: { schema: 'ramify-agent.work-item/1', id: 'W', module: f.module, origin: { entry: 'work' }, goal: 'Inspect module',
      requirementRefs: [], acceptanceRefs: [], contextRefs: [], startedFor: null }, onboarding: { path: 'pkg/README.md', purpose: null },
      views: { evidence: null, unavailable: 'Fixture API pages are provided through current view references' }, hypotheses: [], registry: [], decisions: [], outlines: [] },
  }, { projectRoot: f.root, packages });
  expect(step.equipment.builtinTools).toEqual(['read', 'grep', 'ls']);
  const rendered = await renderStep(step, { projectRoot: f.root, packages, builtinDeclarations: piBuiltinDeclarations, operationId: 'orientation' });
  const delivered = rendered.packet.additions.find(addition => addition.key === 'environment:views')!.text;
  expect(delivered).toContain('13 limited records:');
  expect(delivered).toContain('1 more.');
  expect(delivered).toContain('revision `architect-R`, input `architect-I`');
  expect(delivered).toContain('.ramify-architect/unusual/behavior.jsonl');
  expect(delivered).toContain('.ramify-architect/unusual/supporting.jsonl');
  expect(rendered.declarations.map(declaration => declaration.name)).toContain('read');
  expect(JSON.parse((await readFile(join(f.root, '.ramify-architect/unusual/behavior.jsonl'), 'utf8')).split('\n').at(-1)!).name).toBe('S12');
});

test('the no-API fallback supplies bounded module coverage and missing-index access stays explicit', async () => {
  const f = await fixture();
  const views = await localViewInputsOf(f.root, f.module, f.index, f.view);
  expect(views).toHaveLength(1);
  expect(views[0]!.path.project).toBe('.ramify-architect');
  expect(views[0]!.coverage.join('\n')).toContain('13 limited records:');
  expect(views[0]!.coverage.join('\n')).toContain('.ramify-architect/unusual/behavior.jsonl');
  const missing = await localViewInputsOf(f.root, f.module, null, f.view);
  expect(missing[0]!.coverage.join('\n')).toContain('detail access unavailable: no generated index was captured');
  expect(await localViewInputsOf(f.root, f.module, null, { status: 'placeholder' })).toEqual([]);
});


test('a local consultation retains the bounded coverage block and exact detail pointers', async () => {
  const f = await fixture();
  const prepared = await localViewInputsOf(f.root, f.module, f.index, f.view);
  const views = prepared.map(view => ({ ...view, path: view.path.project }));
  const consultation = await consultationFixture(cleanups, input => input.task.submissionTool === 'answer_architect_consultation'
    ? [answer()] : [ask(), { kind: 'submit', input: {} }], undefined, views);
  await cp(join(f.root, '.ramify-architect'), join(consultation.directory, '.ramify-architect'), { recursive: true });
  const result = await consultation.caller('engineer', consultation.seeds['local-architect']!);
  expect(result.ended, result.error).toBe('submitted');
  const child = consultation.seen.find(input => input.task.submissionTool === 'answer_architect_consultation')!;
  const inherited = await Promise.all(child.session.transcript.map(entry => consultation.store.getPayload(entry.payloadId)
    .then(bytes => bytes === null ? '' : new TextDecoder().decode(bytes))));
  const packet = inherited.join('\n') + child.task.message + child.session.additions.map(addition => addition.text).join('\n');
  expect(packet).toContain('13 limited records:');
  expect(packet).toContain('.ramify-architect/unusual/behavior.jsonl');
  expect(packet).toContain('architect-I');
  expect(child.session.activeTools).toEqual(['read', 'grep', 'ls', 'subagent', 'answer_architect_consultation']);
});

test('a refreshed architect view cannot serve detail pointers for an older captured index', async () => {
  const f = await fixture();
  await f.write('.ramify-architect/_meta.json', JSON.stringify({ schema: 'ramify.architect-view/3', revision: 'new-R', input: 'new-I',
    modules: 1, cut: 13, dependencies: 'measured', dependencyScope: 'production' }));
  const views = await localViewInputsOf(f.root, f.module, f.index, f.view);
  const text = views[0]!.coverage.join('\n');
  expect(text).toContain('revision `architect-R`, input `architect-I`');
  expect(text).toContain('current architect metadata has revision `new-R`, input `new-I`');
  expect(text).toContain('differs from this summary');
  expect(text).not.toContain('.ramify-architect/unusual/behavior.jsonl');
});


test('refreshed matching metadata supplies totals independently of the original manifest limits', async () => {
  const f = await fixture();
  const views = await localViewInputsOf(f.root, f.module, f.index, { ...f.view, revision: 'old-R', input: 'old-I', coverageLimits: ['cut: 99'] });
  const text = views[0]!.coverage.join('\n');
  expect(text).toContain('cut: 13');
  expect(text).not.toContain('cut: 99');
  expect(text).toContain('revision `architect-R`, input `architect-I`');
  expect(views[0]!.revision).toBe('architect-R');
});
