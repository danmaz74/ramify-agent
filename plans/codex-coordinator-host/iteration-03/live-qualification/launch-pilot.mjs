// Run only after the source owner explicitly reports a passing smoke test.
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const evidence = resolve('plans/codex-coordinator-host/iteration-03/live-qualification');
const metadata = JSON.parse(await readFile(join(evidence, 'pilot-target.json'), 'utf8'));
const action = process.argv[2] ?? 'start';
if (!['start', 'resume', 'fresh'].includes(action)) throw new Error('Expected start, resume, or fresh');
const marker = process.argv[3];
if (!marker) throw new Error('Supply the retained smoke-pass/launch label');
const sourceFiles = new Map();
for (const directory of ['subs/harness/subs/agent/subs/codex/src', 'subs/harness/subs/assistance/src']) {
  for (const entry of await readdir(directory, { withFileTypes: true })) if (entry.isFile() && /\.(?:ts|py)$/.test(entry.name)) sourceFiles.set(join(directory, entry.name), true);
}
for (const path of ['src/main.ts', 'subs/harness/src/owned-tree-kernel.ts', 'subs/harness/src/owned-tree-kernel.py', '.agents/skills/ramify-agent-coordinate/SKILL.md']) sourceFiles.set(path, true);
const fingerprints = {};
for (const file of [...sourceFiles.keys()].sort()) fingerprints[file] = createHash('sha256').update(await readFile(file)).digest('hex');
await writeFile(join(evidence, `${marker}-source-sha256.json`), JSON.stringify(fingerprints, null, 2) + '\n');
const args = ['--import', 'tsx', 'src/main.ts', 'coordinate', action === 'start' ? 'start' : 'resume', '--project', metadata.root, '--command-id', `recovery-pilot-${marker}`, '--json', '--assessment-model', metadata.assessmentModel];
if (action === 'start') args.push('--plan', metadata.planId, '--model', metadata.coordinatorModel, '--worker-model', metadata.workerModel, '--replace-mcp', 'ramify-agent', '--message-file', join(evidence, 'initial-directions.txt'));
else {
  if (!process.argv[4]) throw new Error('Resume requires the exact previous coordinator ID');
  args.push('--id', process.argv[4]);
  if (action === 'fresh') args.push('--fresh-thread');
  if (process.argv[5]) args.push('--message-file', join(evidence, process.argv[5]));
}
const startedAt = new Date().toISOString();
const result = spawnSync(process.execPath, args, { cwd: resolve('.'), encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, timeout: 240000 });
await writeFile(join(evidence, `${marker}-stdout.json`), result.stdout ?? '');
await writeFile(join(evidence, `${marker}-stderr.log`), result.stderr ?? '');
const receipt = { startedAt, returnedAt: new Date().toISOString(), sourceHead: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), launcher: { pid: process.pid, parentPid: process.ppid }, command: [process.execPath, ...args], exitCode: result.status, signal: result.signal, error: result.error?.message ?? null, qualification: 'Executed from an agent shell tool; this process and CLI exit before subsequent observer/control calls. PTY closure is separately recorded by the enclosing tool when selected; arbitrary UI disappearance is not implied.' };
await writeFile(join(evidence, `${marker}-launch-receipt.json`), JSON.stringify(receipt, null, 2) + '\n');
console.log(JSON.stringify(receipt, null, 2));
if (result.status !== 0) { console.error(result.stderr); console.error(result.stdout); process.exitCode = result.status ?? 1; }
