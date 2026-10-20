import { readFile, appendFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { coordinatorStatus } from '../../../../subs/harness/subs/assistance/src/coordinator-client.ts';
import { readCoordinator } from '../../../../subs/harness/subs/assistance/src/coordinator-store.ts';
const evidence = resolve('plans/codex-coordinator-host/iteration-03/live-qualification');
const target = JSON.parse(await readFile(join(evidence, 'pilot-target.json'), 'utf8'));
const knownHead = process.argv[2] ?? target.baseline;
const waitThroughAssessment = process.argv[3] === 'assessment';
for (const deadline = Date.now() + 900000; Date.now() < deadline;) {
  const status = await coordinatorStatus(target.root);
  const r = status.record;
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: target.root, encoding: 'utf8' }).trim();
  const view = { at: new Date().toISOString(), stale: status.stale, id: r.id, threadId: r.threadId, jobId: r.jobId, phase: r.phase, turn: r.turn, recovery: r.recovery, pending: r.pending, workers: r.workers, assessments: status.assessments, head, cursor: r.cursor, error: r.error };
  if (status.stale || r.pending.length || head !== knownHead || !waitThroughAssessment && status.assessments.some(a => a.status === 'running') || r.turn?.status !== 'inProgress' || r.phase !== 'ready') {
    await appendFile(join(evidence, 'actionable-observations.jsonl'), JSON.stringify(view) + '\n');
    console.log(JSON.stringify(view, null, 2));
    break;
  }
  const { runtime } = await readCoordinator(target.root, r.id);
  const response = await fetch(`${runtime.endpoint}/watch?after=${r.cursor}&wait=30000`, { headers: { authorization: `Bearer ${runtime.token}` }, signal: AbortSignal.timeout(35000) });
  const update = await response.json();
  await appendFile(join(evidence, 'watch-observations.jsonl'), JSON.stringify({ at: new Date().toISOString(), ...update }) + '\n');
}
