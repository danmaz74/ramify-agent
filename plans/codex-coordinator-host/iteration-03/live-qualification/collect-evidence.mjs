import { readFile, writeFile, readdir, access } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { homedir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { release } from 'node:os';
import { gunzipSync } from 'node:zlib';
import { processIdentity } from '../../../../subs/harness/subs/assistance/src/coordinator-recovery.ts';
const evidence = resolve('plans/codex-coordinator-host/iteration-03/live-qualification');
const metadata = JSON.parse(await readFile(join(evidence, 'pilot-target.json'), 'utf8'));
const git = args => execFileSync('git', args, { cwd: metadata.root, encoding: 'utf8' }).trim();
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const coordinators = join(metadata.root, 'plans/.harness/coordinators');
const records = [];
const privateTokens = [];
for (const name of await readdir(coordinators)) {
  if (!name.startsWith('coord-')) continue;
  const record = JSON.parse(await readFile(join(coordinators, name, 'record.json'), 'utf8'));
  const runtime = await readFile(join(coordinators, name, 'runtime.json'), 'utf8').then(JSON.parse).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
  if (runtime?.token) privateTokens.push(runtime.token);
  const guardian = record.guardian ? JSON.parse(await readFile(record.guardian.path, 'utf8')) : null;
  records.push({ id: record.id, generation: record.generation, resumeFrom: record.resumeFrom, recovery: record.recovery, jobId: record.jobId, threadId: record.threadId, phase: record.phase, model: record.model, workerModel: record.workerModel, assessmentModel: record.assessmentModel, replaceMcp: record.replaceMcp, endpoint: record.endpoint, owner: record.owner, provider: record.readiness?.process, guardian, settledIdentities: { host: await processIdentity(record.owner.pid), guardian: guardian ? await processIdentity(guardian.pid) : null, provider: record.readiness ? await processIdentity(record.readiness.process.providerPid) : null, supervisor: record.readiness ? await processIdentity(record.readiness.process.supervisorPid) : null }, workers: record.workers, ownershipReleased: record.ownershipReleased, settlement: record.settlement });
}
const jobIds = (await readdir(join(metadata.root, 'plans/duration-labels/.harness/jobs'))).sort();
if (jobIds.length !== 1) throw new Error('Pilot unexpectedly contains multiple jobs');
const jobRoot = join(metadata.root, 'plans/duration-labels/.harness/jobs', jobIds[0]);
const job = JSON.parse(await readFile(join(jobRoot, 'job.json'), 'utf8'));
const assessments = [];
for (const id of (await readdir(join(jobRoot, 'assessments'))).sort()) {
  const directory = join(jobRoot, 'assessments', id);
  const revisions = (await readdir(directory)).filter(name => /^rev-\d+\.json$/.test(name)).sort();
  const timeline = [];
  for (const file of revisions) {
    const bytes = await readFile(join(directory, file));
    const record = JSON.parse(bytes.toString());
    timeline.push({ file, sha256: hash(bytes), revision: record.revision, status: record.status, error: record.error, stageNames: record.stages.map(stage => stage.name) });
  }
  const bytes = await readFile(join(directory, revisions.at(-1)));
  const record = JSON.parse(bytes.toString());
  const audit = record.stages.find(stage => stage.name === 'audit')?.evidence;
  assessments.push({ id, status: record.status, revision: record.revision, request: record.request, outcome: record.outcome, completedAt: record.completedAt, source: join(directory, revisions.at(-1)), sourceSha256: hash(bytes), timeline, audit: { state: audit?.state, requestedSourceCommit: audit?.requestedSourceCommit, auditedSourceCommit: audit?.auditedSourceCommit, reused: audit?.result?.reused, reportCommit: audit?.result?.reportCommit, runRef: audit?.result?.runRef, treeRef: audit?.result?.treeRef, requestedMode: audit?.result?.requestedMode, executedMode: audit?.result?.executedMode, checks: Object.fromEntries(Object.entries(audit?.result?.provider?.summary?.checks ?? {}).map(([id, result]) => [id, { passed: result.passed, status: result.status }])) } });
}
const codexHome = process.env.CODEX_HOME ?? join(homedir(), '.codex');
const historyFiles = execFileSync('rg', ['--files', join(codexHome, 'sessions')], { encoding: 'utf8' }).trim().split('\n');
const ids = new Set(records.flatMap(record => [record.threadId, ...record.workers.map(worker => worker.id)]).filter(Boolean));
const histories = [];
for (const id of ids) {
  const path = historyFiles.find(file => file.includes(id));
  if (!path) throw new Error(`Persistent native history missing for ${id}`);
  const rows = (await readFile(path, 'utf8')).split('\n').filter(Boolean).map(JSON.parse);
  const meta = rows.find(row => row.type === 'session_meta')?.payload;
  const turns = rows.filter(row => row.type === 'turn_context').map(row => ({ turnId: row.payload.turn_id, model: row.payload.model, cwd: row.payload.cwd, approvalPolicy: row.payload.approval_policy, sandboxPolicy: row.payload.sandbox_policy }));
  const calls = rows.filter(row => row.type === 'response_item' && ['custom_tool_call', 'function_call'].includes(row.payload.type)).map(row => row.payload);
  const raCalls = calls.filter(call => /mcp__ramify_host_[a-f0-9]+__(?:job_detail|iteration_assess|assessment_resume|assessment_wait|assessment_result)/.test(call.input ?? call.name ?? '')).map(call => ({ callId: call.call_id, tools: [...new Set((call.input ?? call.name).match(/mcp__ramify_host_[a-f0-9]+__[a-z_]+/g) ?? [])], assessmentId: (call.input ?? '').match(/assessment_id:\s*"(as-\d+)"/)?.[1] }));
  histories.push({ threadId: id, path, parentThreadId: meta?.parent_thread_id ?? null, historyMode: meta?.history_mode, cliVersion: meta?.cli_version, turns, raCalls });
}
const configAfter = hash(await readFile(join(codexHome, 'config.toml')));
const artifacts = await readdir(evidence);
const matches = [];
for (const name of artifacts) {
  const raw = await readFile(join(evidence, name));
  const bytes = name.endsWith('.gz') ? gunzipSync(raw) : raw;
  if (privateTokens.some(token => bytes.includes(Buffer.from(token)))) matches.push(name);
}
const readable = path => access(path).then(() => true, () => false);
const result = { collectedAt: new Date().toISOString(), target: metadata.root, baseline: metadata.baseline, candidate: git(['rev-parse', 'HEAD']), workingTree: git(['status', '--short']), changedFiles: git(['diff', '--name-only', metadata.baseline, 'HEAD']).split('\n'), jobIds, jobId: jobIds[0], protection: job.protection, assessments, coordinators: records, histories, runtime: { platform: process.platform, kernel: release(), node: process.version, python: execFileSync('python3', ['--version'], { encoding: 'utf8' }).trim() }, configuration: { globalBeforeSha256: metadata.globalConfigSha256, globalAfterSha256: configAfter, unchanged: configAfter === metadata.globalConfigSha256, policyOverrides: [] }, credentials: { codexAuthReadable: await readable(join(codexHome, 'auth.json')), piAuthReadable: await readable(join(process.env.PI_CODING_AGENT_DIR ?? join(homedir(), '.pi/agent'), 'auth.json')), bearerArtifactsScanned: artifacts.length, privateBearerValuesTested: privateTokens.length, matchingArtifacts: matches }, launchLimit: 'Agent shell tools and their PTY/launcher/CLI process completion were observed. Arbitrary UI/session disappearance and container loss were not exercised.', sourceBinding: 'Each launch retains its exact source fingerprint, including local source changes. Later guardian durability refinements are qualified by the source owner native witnesses.' };
await writeFile(join(evidence, 'pilot-final-evidence.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ candidate: result.candidate, jobId: result.jobId, baseline: result.baseline, workingTree: result.workingTree, assessments: assessments.map(a => ({ id: a.id, kind: a.request.kind, status: a.status, gate: a.outcome.gate })), globalConfigUnchanged: result.configuration.unchanged, privateBearerMatches: matches, records: records.length, historyThreads: histories.length }, null, 2));
