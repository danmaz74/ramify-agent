import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createQuerySource } from '../../http/query-source.js';
import { RunQueries, type RunSource } from '../../../subs/projections/src/queries.js';
import { SessionQueries } from '../../../subs/projections/src/session-queries.js';
import { currentModuleTree } from '../../../subs/projections/src/tree.js';
import { readConsultations, consultationText } from '../../../subs/projections/src/consultations.js';
import { Given, When, Then } from '@cucumber/cucumber';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../..');
const child = 'subs/harness/subs/projections';
const required = [
  'RunQueries', 'RunSource', 'SessionQueries', 'CommittedRun', 'CommittedLine',
  'ProjectionError', 'currentModuleTree', 'ExecutionPageError', 'ExecutionCoreIndex',
  'CheckFindingListQuery', 'readConsultations', 'consultationText',
  'ConsultationInspectionOptions', 'ConsultationInspection', 'Usage', 'UsageTotal', 'Category',
] as const;

async function contents(path: string): Promise<string> { return readFile(join(root, path), 'utf8'); }

async function sourceFiles(path: string): Promise<string[]> {
  const found: string[] = [];
  for (const entry of await readdir(join(root, path), { withFileTypes: true })) {
    const next = join(path, entry.name);
    if (entry.isDirectory() && entry.name !== 'tests') found.push(...await sourceFiles(next));
    else if (entry.isFile() && /\.[cm]?[jt]sx?$/.test(entry.name)) found.push(next);
  }
  return found;
}

async function recordedProjectionSurface() {
  const declaration = await contents(`${child}/module.ramify`);
  assert.match(declaration, /^ramify 1\nmodule projections\n/m);
  assert.doesNotMatch(declaration, /^tags?\s/m);
  const ordinary = JSON.parse(await contents(`${child}/src/.ramify/_meta.json`));
  const testing = JSON.parse(await contents(`${child}/src/tests/.ramify/_meta.json`));
  assert.equal(ordinary.module, 'ramify-agent/harness/projections');
  assert.equal(ordinary.area, 'ordinary');
  assert.equal(testing.module, ordinary.module);
  assert.equal(testing.area, 'tests');
  assert.equal(testing.revision, ordinary.revision);
  // These views report coverage limits; successful imports and the Ramify
  // check provide the additional evidence, not an invented complete view.
  assert.equal(typeof ordinary.coverage, 'number');
  assert.equal(typeof testing.coverage, 'number');
  const exposures = new Map<string, string>();
  for (const match of declaration.matchAll(/^expose-(?:src|test) (.+) from "([^"]+)" to parent$/gm)) {
    for (const name of match[1]!.split(',').map(value => value.trim())) exposures.set(name, match[2]!);
  }
  return {
    async importedConsumers() {
      const input: RunSource = {
        projectRoot: root, agentName: undefined,
        committed: () => undefined, committedRuns: () => [], runVersions: () => [],
      };
      const source = createQuerySource(input);
      assert(Object.isFrozen(source));
      assert.deepEqual(Object.keys(source).sort(), [
        'agentName', 'candidateSource', 'changeHistory', 'committed',
        'committedRuns', 'projectRoot', 'runVersions',
      ]);
      assert(new RunQueries(source));
      assert(new SessionQueries(source));
      assert.equal(typeof currentModuleTree, 'function');
      assert.equal(typeof readConsultations, 'function');
      assert.equal(typeof consultationText, 'function');
      const http = await contents('subs/harness/src/http/app.ts');
      const cli = await contents('subs/harness/subs/autonomous/subs/work-coordination/src/consultations/command.ts');
      const exporter = await contents('subs/harness/subs/autonomous/src/run/repair-export-command.ts');
      assert.match(http, /new RunQueries\(source\)/);
      assert.match(http, /new SessionQueries\(source\)/);
      assert.match(cli, /from ['"](?:\.\.\/)+projections\/src\/consultations\.js['"]/);
      assert.match(exporter, /authenticateRepairHistory/);
    },
    exposed() {
      for (const name of required) assert(exposures.has(name), `${name} needs an explicit child exposure`);
      assert.equal(exposures.get('RunQueries'), 'queries.ts');
      assert.equal(exposures.get('RunSource'), 'queries.ts');
      assert.equal(exposures.get('CommittedRun'), 'inputs.ts');
      assert.equal(exposures.get('CommittedLine'), 'inputs.ts');
    },
    async readOnly() {
      const forbidden = /\b(?:RunService|RunLog|commitRecord|writeFile|appendFile|mkdir|rm|spawn|execFile|commandExecution|runCommand|openSessionStore)\b/;
      for (const file of await sourceFiles(`${child}/src`)) {
        const source = await contents(file);
        assert.doesNotMatch(source, /from ['"]node:child_process['"]/, file);
        for (const statement of source.matchAll(/import\s+(?:type\s+)?(?:\{[\s\S]*?\}|[^;]+?)\s+from\s+['"]([^'"]+)['"]/g)) {
          const imported = statement[0];
          assert.doesNotMatch(imported, forbidden, `${file}: writable symbol import`);
          assert.doesNotMatch(statement[1]!, /(?:run\/service|jobs\/commit|run\/repair-export-command|run-command|ledger\/src\/writer)/, file);
        }
        assert.doesNotMatch(source, /\.(?:append|commit|write|execute|spawn)\(/, `${file}: writer call`);
      }
      const queries = await contents(`${child}/src/queries.ts`);
      const port = queries.match(/export interface RunSource\s*\{([\s\S]*?)\n\}/)?.[1];
      assert(port, 'The reader port is explicit');
      for (const name of ['committed', 'committedRuns', 'runVersions', 'candidateSource', 'changeHistory']) {
        assert.match(port, new RegExp(`\\b${name}\\b`));
      }
      assert.doesNotMatch(port, forbidden);
      const parent = await contents('subs/harness/module.ramify');
      const committedInputs = parent.match(/^expose-sub (.+) from projections to descendants$/m)?.[1]?.split(',').map(name => name.trim()) ?? [];
      for (const name of ['CommittedRun', 'CommittedLine']) assert(committedInputs.includes(name), `${name} is exposed to descendants`);
      const selected = parent.slice(parent.indexOf('// Selected reading dependencies'), parent.indexOf('// Temporary local guards'));
      assert(selected.startsWith('// Selected reading dependencies'), 'Selected child inputs are declared');
      assert.doesNotMatch(selected, /\b(?:RunService|RunLog|commitRecord|runCommand|commitTree|spawn|execFile|writeFile|openSessionStore)\b/);
      assert.doesNotMatch(declaration, /\b(?:RunService|RunLog|commitRecord|runCommand|commitTree|spawn|execFile|writeFile|openSessionStore)\b/);
    },
    async privateToWeb() {
      for (const file of await sourceFiles('subs/web/src')) {
        const source = await contents(file);
        assert.doesNotMatch(source, /subs\/projections\/src|\bRunQueries\b|\bSessionQueries\b/, file);
      }
      assert.doesNotMatch(await contents('module.ramify'), /\bRunQueries\b|\bSessionQueries\b/);
      assert.doesNotMatch(await contents('subs/web/module.ramify'), /\bRunQueries\b|\bSessionQueries\b/);
    },
    async discovered() {
      const vitest = await contents('vitest.config.ts');
      const cucumber = JSON.parse(await contents('cucumber.json'));
      assert(vitest.includes("'subs/**/src/**/*.test.ts'"));
      assert(cucumber.default.paths.includes('subs/*/src/tests/features/**/*.feature'));
      assert(cucumber.default.import.includes('subs/*/src/tests/steps/**/*.ts'));
      assert((await readdir(join(root, child, 'src/tests'))).some(name => name.endsWith('.test.ts')));
      assert((await readdir(join(root, 'subs/harness/src/tests'))).some(name => name === 'committed-run-refusals.test.ts'));
    },
  };
}

let fixture: Awaited<ReturnType<typeof recordedProjectionSurface>> | undefined;
function current() { if (!fixture) throw new Error('Projection surface fixture not prepared'); return fixture; }
Given('the extracted module and its ordinary and testing API views', async () => { fixture = await recordedProjectionSurface(); });
When('its real consumers and tests import the contracts they need', async () => { await current().importedConsumers(); });
Then('each imported symbol and signature companion has explicit valid exposure', () => { current().exposed(); });
Then("the child's production source imports, calls or receives by injection no writable run service, ledger writer or command executor, with no new writable exposure for it", async () => { await current().readOnly(); });
Then('private projectors and Node implementation are unavailable to web production code', async () => { await current().privateToWeb(); });
Then('focused child tests and parent integration tests remain in configured discovery', async () => { await current().discovered(); });
