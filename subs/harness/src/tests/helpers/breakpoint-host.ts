import { access, readFile, writeFile } from 'node:fs/promises';
import { startServerWith } from '../../http/server.js';
import { createScriptedAgent } from '../../../subs/agent/src/scripted.js';
import { analysis, currentAnalysis, entry } from './analysis.js';
import { assign, outline, submit, treeInputs } from './iterations.js';
import { testPolicy } from './runs.js';
import { unchangedGit } from './unchanged-run.js';
import { scenariosCommit } from './scripted-git.js';
import { fixtureScratchGit } from './scratch-git.js';
import { FakeRamifyCli } from './fake-ramify.js';
import { passingAudit } from './direct-check-execution.js';
import { declaringScenarios } from './declarations.js';

/*
 * The native host of execution-breakpoints-process.boundary.test.ts, run as
 * `node --import tsx breakpoint-host.ts <setup.json>`. It serves the fixture
 * with a scripted agent whose engineer waits for the release file, writes its
 * URL and PID to the ready file, and closes on SIGTERM.
 */

const plan = 'review-notes', module = 'collection-review/workspace/reviews';
const input = JSON.parse(await readFile(process.argv[2]!, 'utf8')) as { root: string; ready: string; release: string };
const scripted = (role: string) => role === 'initial-architect'
  ? submit(currentAnalysis(analysis([entry('review-note', module)]), 'document:review-notes-plan')) : role === 'local-architect' ? submit(assign(module, {}, outline())) : [];
const agent = createScriptedAgent(declaringScenarios(spec => spec.role === 'engineer' ? [
  { kind: 'await', until: async () => { while (true) { try { await access(input.release); return; } catch { await new Promise(done => setTimeout(done, 10)); } } } },
  { kind: 'message', text: 'Native hosted explanation.' }, { kind: 'end', message: 'Native hosted explanation.' },
] : scripted(spec.role)));
const host = await startServerWith({ projectRoot: input.root, port: 0, agent, ramify: new FakeRamifyCli(), runs: {
  inputs: treeInputs(), policy: testPolicy, configuredAudit: passingAudit(), stopGraceMs: 500,
  git: fixtureScratchGit(unchangedGit(input.root, [scenariosCommit(plan), scenariosCommit(plan)])),
} });
await writeFile(input.ready, JSON.stringify({ url: host.url, pid: process.pid, recovery: host.recovery }));
process.once('SIGTERM', () => { void host.close().then(() => process.exit(0)); });
