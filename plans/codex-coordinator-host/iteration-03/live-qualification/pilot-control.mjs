// Exact operator actions for this disposable pilot. No automatic approvals.
import { readFile, writeFile, appendFile } from 'node:fs/promises';
import { resolve, relative, join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { coordinatorStatus, coordinatorControl } from '../../../../subs/harness/subs/assistance/src/coordinator-client.ts';
import { readCoordinator } from '../../../../subs/harness/subs/assistance/src/coordinator-store.ts';
import { processIdentity } from '../../../../subs/harness/subs/assistance/src/coordinator-recovery.ts';

const evidence = resolve('plans/codex-coordinator-host/iteration-03/live-qualification');
const target = JSON.parse(await readFile(join(evidence, 'pilot-target.json'), 'utf8'));
const action = process.argv[2] ?? 'status';
const status = await coordinatorStatus(target.root);
const record = status.record;
const retained = { at: new Date().toISOString(), ...status };
if (action === 'status') {
  if (process.argv[3]) await writeFile(join(evidence, process.argv[3]), JSON.stringify(retained, null, 2) + '\n');
  console.log(JSON.stringify({ at: retained.at, stale: status.stale, id: record.id, generation: record.generation, resumeFrom: record.resumeFrom, recovery: record.recovery, phase: record.phase, jobId: record.jobId, threadId: record.threadId, turn: record.turn, pending: record.pending, workers: record.workers, assessments: status.assessments, cursor: record.cursor, error: record.error }, null, 2));
} else if (action === 'wait') {
  const { runtime } = await readCoordinator(target.root, record.id);
  const response = await fetch(`${runtime.endpoint}/watch?after=${record.cursor}&wait=30000`, { headers: { authorization: `Bearer ${runtime.token}` }, signal: AbortSignal.timeout(35000) });
  const update = await response.json();
  await appendFile(join(evidence, 'watch-observations.jsonl'), JSON.stringify({ at: new Date().toISOString(), ...update }) + '\n');
  console.log(JSON.stringify({ id: update.snapshot.record.id, phase: update.snapshot.record.phase, turn: update.snapshot.record.turn, pending: update.snapshot.record.pending, workers: update.snapshot.record.workers, assessments: update.snapshot.assessments, events: update.events, cursor: update.cursor }, null, 2));
} else if (action === 'command-hash') {
  const request = record.pending.find(request => request.itemId === process.argv[3]);
  if (request?.kind !== 'command-approval') throw new Error('Exact pending command required');
  console.log(JSON.stringify({ itemId: request.itemId, command: request.command, sha256: createHash('sha256').update(request.command ?? '').digest('hex') }));
} else if (action === 'approve-once') {
  const key = process.argv[3];
  const request = record.pending.find(request => request.id === key || request.itemId === key || key?.startsWith('mcp:') && request.kind === 'mcp-elicitation' && JSON.parse(request.id)[3] === Number(key.slice(4)));
  if (!request) throw new Error('Exact operator-selected request is no longer pending');
  let response;
  if (request.kind === 'command-approval') {
    if (request.cwd === null || relative(target.root, resolve(request.cwd)).startsWith('..') || relative(target.root, resolve(request.cwd)).startsWith('/')) throw new Error('Command cwd is outside this inspected pilot');
    const suppliedHash = process.argv[4];
    const actualHash = createHash('sha256').update(request.command ?? '').digest('hex');
    if (suppliedHash !== actualHash) throw new Error(`Inspect exact command first and supply SHA-256 ${actualHash}`);
    const once = request.choices.find(choice => choice.effect === 'once');
    if (!once) throw new Error('No one-time choice');
    response = { kind: 'approval', choiceId: once.id };
  } else if (request.kind === 'mcp-elicitation' && request.serverName === `ramify_host_${record.generation.replaceAll('-', '')}` && Object.keys(request.schema.properties ?? {}).length === 0) {
    response = { kind: 'mcp-elicitation', action: 'accept', content: {} };
  } else if (request.kind === 'file-approval') {
    const inspected = JSON.parse(await readFile(join(evidence, process.argv[4]), 'utf8'));
    if (inspected.request.id !== request.id || !inspected.patchSha256 || !inspected.paths?.every(path => !relative(target.root, resolve(path)).startsWith('..'))) throw new Error('Patch is not an exact inspected pilot edit');
    const once = request.choices.find(choice => choice.effect === 'once');
    if (!once) throw new Error('No one-time choice');
    response = { kind: 'approval', choiceId: once.id };
  } else throw new Error('This helper supports only explicitly inspected once operations and empty RA consent');
  const commandId = `recovery-pilot-once:${request.generation}:${request.itemId ?? JSON.parse(request.id)[3]}`;
  const result = await coordinatorControl(target.root, record.id, { action: 'respond', commandId, requestId: request.id, response }, 30000);
  await appendFile(join(evidence, 'operator-responses.jsonl'), JSON.stringify({ at: new Date().toISOString(), authorization: 'Exact inspected disposable pilot operation; once only; existing policy unchanged', request, response, commandId, result }) + '\n');
  console.log(JSON.stringify(result, null, 2));
} else if (action === 'crash-owned-host') {
  if (status.stale) throw new Error('Inspect live fixture owner before deliberate crash');
  const identity = await processIdentity(record.owner.pid);
  if (identity?.identity.split(':').at(-1) !== record.owner.processStart) throw new Error('Fixture host process identity changed');
  const name = process.argv[3];
  if (!name) throw new Error('Provide evidence filename');
  const git = args => execFileSync('git', args, { cwd: target.root, encoding: 'utf8' }).trim();
  const before = { ...retained, head: git(['rev-parse', 'HEAD']), diff: git(['diff', '--stat']), sourceSha256: createHash('sha256').update(await readFile(join(target.root, 'src/duration.js'))).digest('hex'), ownerIdentity: identity };
  await writeFile(join(evidence, name), JSON.stringify(before, null, 2) + '\n');
  process.kill(record.owner.pid, 'SIGKILL');
  console.log(JSON.stringify({ killedExactOwnedHost: record.owner.pid, identity, coordinatorId: record.id, jobId: record.jobId, head: before.head }));
} else if (action === 'guardian') {
  const receipt = JSON.parse(await readFile(record.guardian.path, 'utf8'));
  const result = { at: new Date().toISOString(), coordinatorId: record.id, receipt, guardianProcess: await processIdentity(receipt.pid), hostProcess: await processIdentity(record.owner.pid), providerProcess: record.readiness === null ? null : await processIdentity(record.readiness.process.providerPid), supervisorProcess: record.readiness === null ? null : await processIdentity(record.readiness.process.supervisorPid) };
  if (process.argv[3]) await writeFile(join(evidence, process.argv[3]), JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify(result, null, 2));
} else throw new Error(`Unsupported pilot action ${action}`);
