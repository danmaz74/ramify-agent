import { mkdir, realpath, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, test } from 'vitest';
import { findingsOf } from '../hooks/post-write.js';
import { baselineScope, captureSnapshot, scopeSize } from '../../subs/kpi/src/capture.js';
import { privateRamify } from '../../subs/evidence/src/ramify-cli.js';
import { architectViewDirectory, loadArchitectIndex, readApiView, readArchitectMeta } from '../../subs/evidence/src/views.js';
import { copyFixture, temporaryDirectory } from './helpers/fixture.js';
import { ancestorStepFile, exposing } from './helpers/integration-scenario.js';

/*
 * The installed Ramify over small temporary projects, with one private
 * daemon for the file. Each case calls the harness's adapter directly
 * (materialize, check, ownership or measure) and reads what the real
 * command line produced; no run, Git or gate takes part.
 */

/*
 * The daemon spawns its compiler helper from the directory of the command
 * that starts it, which must outlive the daemon. A small project of its own
 * is that directory: started from this checkout, the daemon would first
 * analyze all of it.
 */
let daemon: Awaited<ReturnType<typeof privateRamify>>;
let home: Awaited<ReturnType<typeof temporaryDirectory>>;
beforeAll(async () => {
  home = await temporaryDirectory();
  await put(home.path, { 'module.ramify': 'ramify 1\nroot module home\n', 'tsconfig.json': tsconfig, 'src/index.ts': 'export const home = 1;\n' });
  daemon = await privateRamify({ timeoutMs: 180_000 });
  await daemon.ramify.run(['check', '--changed', 'src/index.ts', '--format', 'json', '--deadline', '1'], home.path);
}, 180_000);
afterAll(async () => { await daemon?.dispose(); await home?.remove(); }, 120_000);

const cleanups: Array<() => Promise<void>> = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0).reverse()) await cleanup(); });

const tsconfig = `${JSON.stringify({
  compilerOptions: { target: 'ES2022', module: 'NodeNext', moduleResolution: 'NodeNext', strict: true },
  include: ['src/**/*.ts', 'scripts/**/*.ts', 'subs/**/src/**/*.ts'],
})}\n`;

/** A marked root project `app` holding the given files, beside its description and compiler configuration. */
async function project(files: Readonly<Record<string, string>>, description = 'ramify 1\nroot module app\n'): Promise<string> {
  const directory = await temporaryDirectory();
  cleanups.push(directory.remove);
  const root = await realpath(directory.path);
  await put(root, { 'module.ramify': description, 'tsconfig.json': tsconfig, 'src/index.ts': 'export const app = 1;\n', ...files });
  return root;
}

async function put(root: string, files: Readonly<Record<string, string>>): Promise<void> {
  for (const [path, content] of Object.entries(files)) {
    await mkdir(dirname(join(root, path)), { recursive: true });
    await writeFile(join(root, path), content);
  }
}

async function materialized(root: string): Promise<void> {
  const result = await daemon.ramify.materialize(root);
  expect(result.ok, result.ok ? '' : result.message).toBe(true);
}

describe('ownership and project roots', () => {
  test('a marked root reports owned-unwired docs as ignored, analyzes auxiliary scripts and excludes an owned nested project', async () => {
    const docs = ['docs/notes.md', 'docs/notes.ts'];
    const root = await project({
      'docs/notes.md': '# Notes\n', 'docs/notes.ts': 'export const notes = 1;\n',
      'scripts/probe.ts': 'export const probe = 1;\n',
      'engine/module.ramify': 'ramify 1\nroot module engine\n', 'engine/src/engine.ts': 'export const engine = 1;\n',
    }, 'ramify 1\nroot module app\nowned-unwired "docs"\nowned-nested-project "engine"\n');
    const answer = await daemon.ramify.queryOwnership(root, ['.', ...docs, 'scripts/probe.ts', 'engine/src/engine.ts']);
    expect(answer.schemaVersion).toBe('ramify.affected-cli/4');
    expect(answer.selection.inputId).toBe(answer.revision.inputId);
    expect(answer.selection.scope.root).toBe(root);
    expect(answer.selection.scope.ownership.exclusions.filter(item => item.kind === 'owned-nested-project').map(item => item.directory)).toEqual(['engine']);
    for (const path of docs) {
      expect(answer.selection.paths.find(item => item.path === path)).toMatchObject({
        status: 'owned', module: 'app', kind: 'ignored', selects: [],
        exclusion: { kind: 'owned-unwired', directory: 'docs', owner: 'app' },
      });
    }
    expect(answer.selection.paths.find(item => item.path === 'scripts/probe.ts')).toMatchObject({
      status: 'owned', module: 'app', kind: 'auxiliary-source', selects: ['app'], exclusion: null,
    });
    expect(answer.selection.paths.find(item => item.path === 'engine/src/engine.ts')).toMatchObject({
      status: 'owned', module: 'app', kind: 'ignored', selects: [],
      exclusion: { kind: 'owned-nested-project', directory: 'engine' },
    });
  }, 120_000);

  test('a materialization started in a nested module selects the marked project and both API source areas', async () => {
    const root = await project({
      'subs/core/module.ramify': 'ramify 1\nmodule core\n',
      'subs/core/src/core.ts': 'export const core = 1;\n',
      'subs/core/src/tests/core-fixture.ts': 'export const coreFixture = 1;\n',
    });
    const args = ['materialize', '--view', 'architect', '--view', 'api', '--from', '.'];
    let result = await daemon.ramify.run(args, join(root, 'subs/core'));
    for (let retry = 0; retry < 2 && result.code === 2 && result.stdout.includes('superseded'); retry += 1) {
      result = await daemon.ramify.run(args, join(root, 'subs/core'));
    }
    expect(result.code, result.stderr || result.stdout).toBe(0);
    expect(result.stdout).toContain(`Root: ${root}`);
    const meta = await readArchitectMeta(root);
    const index = await loadArchitectIndex(root);
    expect(meta.schema).toBe('ramify.architect-view/3');
    expect(index.input).toBe(meta.input);
    const entry = index.modules.get('app/core');
    expect(entry).toBeDefined();
    for (const area of ['src', 'src/tests'] as const) {
      const view = await readApiView(root, entry!, area);
      expect(view?.module).toBe(entry!.module);
      expect(view?.revision).toBe(meta.revision);
      expect(view?.area).toBe(area);
    }
  }, 120_000);
});

describe('the materialized architect view', () => {
  test('a module created after a materialization enters the refreshed view', async () => {
    const root = await project({});
    await materialized(root);
    expect((await loadArchitectIndex(root)).modules.has('app/notes')).toBe(false);

    await put(root, {
      'subs/notes/module.ramify': 'ramify 1\nmodule notes\n',
      'subs/notes/src/store/notes.ts': 'export const noteLimit = 500;\n',
    });
    await materialized(root);
    const refreshed = await loadArchitectIndex(root);
    expect(refreshed.modules.get('app/notes')?.dir).toBe('subs/notes');
  }, 120_000);

  test('a fake beside its real provider is recorded under its fake name', async () => {
    const root = await project({
      'subs/limits/module.ramify': 'ramify 1\nmodule limits\n',
      'subs/limits/src/interfaces/note-limit.ts': "export const noteLimitCases = [{ note: 'a short note', within: true }];\n",
      'subs/limits/src/fakes/note-limit.fake.ts': 'export function createNoteLimitFake() {\n  return { withinLimit: (note: string) => note.length <= 500 };\n}\n',
      'subs/limits/src/note-limit.ts': 'export function createNoteLimit() {\n  return { withinLimit: (note: string) => note.length <= 500 };\n}\n',
    });
    await materialized(root);
    const index = await loadArchitectIndex(root);
    const records = index.symbols.get('app/limits') ?? [];
    const fromTheFake = records.filter(record => record.file.includes('note-limit.fake'));
    expect(fromTheFake.map(record => record.name)).toContain('createNoteLimitFake');
    for (const record of fromTheFake) expect(record.name).toContain('Fake');
    const real = records.find(record => record.name === 'createNoteLimit');
    expect(real?.file).not.toContain('.fake');
  }, 120_000);

  test('the measurement producer measures owned source, and the architect view once it is published', async () => {
    const root = await project({ 'subs/core/module.ramify': 'ramify 1\nmodule core\n', 'subs/core/src/core.ts': 'export const core = 1;\n' });
    const capture = (id: string) => captureSnapshot({ id, ramify: daemon.ramify, projectRoot: root, head: '', view: null, supplementary: [] });
    const viewOnly = { exactOwners: [], subtrees: [], apiViews: false, architectView: true, supportDocuments: [] };

    const without = await capture('ms-0001');
    if ('unavailable' in without.measure) throw new Error(without.measure.unavailable);
    expect(without.measure.revision).toMatch(/^rev\//u);
    expect(without.measure.hash).toMatch(/^[0-9a-f]{64}$/u);
    const owned = scopeSize(without, baselineScope('app', [])).components.find(component => component.component === 'owned-source');
    expect(owned).toMatchObject({ state: 'measured' });
    expect(owned!.bytes).toBeGreaterThan(0);
    expect(scopeSize(without, viewOnly).components.find(component => component.component === 'architect-view')).toMatchObject({ state: 'unavailable', bytes: null });

    await materialized(root);
    const withView = await capture('ms-0002');
    const published = withView.supplementary.find(entry => entry.path === architectViewDirectory);
    expect(published?.bytes).toBeGreaterThan(0);
    const size = scopeSize(withView, viewOnly);
    expect(size.components.find(component => component.component === 'architect-view')).toMatchObject({ state: 'measured', bytes: published!.bytes });
    expect(size.coverage).toBe('complete');
  }, 120_000);
});

describe('the complete check', () => {
  test('an ancestor\'s test import passes through expose-test, and is denied once the exposure is removed', async () => {
    const ancestor = 'src/tests/steps/integration.steps.ts';
    const tagsModule = 'subs/tags/module.ramify';
    const root = await project({
      'subs/notes/module.ramify': exposing('notes', 'reviewNoteSteps', 'review-note.steps.ts'),
      'subs/notes/src/notes.ts': 'export const notesLimit = 500;\n',
      'subs/notes/src/tests/steps/review-note.steps.ts': "export const reviewNoteSteps = 'review-note';\n",
      [tagsModule]: exposing('tags', 'reviewTagsSteps', 'review-tags.steps.ts'),
      'subs/tags/src/tags.ts': 'export const tagsLimit = 500;\n',
      'subs/tags/src/tests/steps/review-tags.steps.ts': "export const reviewTagsSteps = 'review-tags';\n",
      [ancestor]: ancestorStepFile,
    });
    const listed = (report: unknown) => findingsOf(report).map(finding => `${finding.code} ${finding.file ?? '(no file)'}:${finding.line ?? ''} ${finding.message}`);
    const checked = await daemon.ramify.checkComplete(root);
    expect(listed(checked.report)).toEqual([]);
    expect([checked.outcome, checked.exitCode]).toEqual(['checked', 0]);

    await writeFile(join(root, tagsModule), 'ramify 1\nmodule tags\n');
    const unexposed = await daemon.ramify.checkComplete(root);
    expect(unexposed.exitCode).not.toBe(0);
    expect(findingsOf(unexposed.report).map(finding => finding.file)).toEqual([ancestor]);
  }, 120_000);

  test('a fresh copy of the collection-review fixture checks with no error and no warning', async () => {
    // Fifty test files copy this fixture and assume it satisfies Ramify's rules.
    const fixture = await copyFixture();
    cleanups.push(fixture.remove);
    const result = await daemon.ramify.checkComplete(fixture.root);
    const report = (result.report ?? {}) as {
      readonly outcome?: { readonly execution?: unknown; readonly check?: unknown };
      readonly warnings?: readonly { readonly code?: unknown; readonly files?: readonly unknown[] }[];
      readonly summary?: { readonly errors?: unknown; readonly warnings?: unknown; readonly denied?: unknown };
    };
    const errors = findingsOf(report).map(finding => [
      finding.code,
      finding.file === null ? '(no file)' : `${finding.file}${finding.line === null ? '' : `:${finding.line}`}`,
      finding.message,
    ].join(' '));
    expect(errors).toEqual([]);
    expect([report.summary?.errors, report.summary?.denied, report.summary?.warnings]).toEqual([0, 0, 0]);
    expect([result.outcome, result.exitCode, report.outcome?.execution, report.outcome?.check]).toEqual(['checked', 0, 'completed', 'passed']);
    expect((report.warnings ?? []).map(warning => `${String(warning.code)} ${(warning.files ?? []).join(', ')}`)).toEqual([]);
  }, 300_000);
});
