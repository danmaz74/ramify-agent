import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, expect, test } from 'vitest';
import { consultationId, consultationLayout, type ConsultationStart, type ConsultationOutcome } from '../../../autonomous/subs/work-coordination/src/consultations/records.js';
import { readConsultations, consultationText } from '../consultations.js';
import { temporaryDirectory } from './helpers/fixture.js';
import { committedRun } from './helpers/committed.js';
const cleanup: Array<() => Promise<void>> = [];
afterEach(async () => { for (const close of cleanup.splice(0).reverse()) await close(); });
const at = '2026-10-10T10:00:00.000Z';
const inline = (text: string) => ({ stored: 'inline' as const, text, bytes: Buffer.byteLength(text) });

async function fixture() {
  const dir = await temporaryDirectory(); cleanup.push(dir.remove);
  await writeFile(join(dir.path, 'job.json'), JSON.stringify({ schema: 'ramify-agent.job/3', kind: 'manual', planId: 'P', jobId: 'R', createdAt: at,
    projectRoot: dir.path, base: '', branch: null, origin: 'step-run', policy: committedRun(dir.path).record.policy }));
  const start: ConsultationStart = { schema: 'ramify-agent.consultation-start/1', id: consultationId('inv-caller', 'ask'), caller: {
    invocation: 'inv-caller', session: 'ses-0001', role: 'engineer', toolCall: 'ask', work: { workItem: 'W', iteration: 'W.i01' } }, parent: null,
    target: { role: 'local-architect', run: { planId: 'P', runId: 'R' }, session: 'ses-0003', point: { session: 'ses-0003', invocation: 'inv-original' },
      ref: '{"schema":"ramify-agent.session-point/1","runId":"R","point":{"sessionId":"original","kind":"turn","turn":1,"checkpoint":"L0"}}' }, globalTarget: null,
    startedAt: at, message: inline('  Exact question\nnew facts.  '), request: { session: 'ses-0001', entry: null } };
  const outcome: ConsultationOutcome = { schema: 'ramify-agent.consultation-outcome/1', id: start.id, status: 'cancelled', endedAt: '2026-10-10T10:00:01.000Z',
    child: { invocation: 'inv-child', session: 'ses-0002' }, accepted: { submission: 'invocations/inv-child/submission.json', answer: inline('  Accepted but undelivered\nanswer.  ') },
    error: { code: 'cancelled', message: inline('Cancelled before delivery') }, delivery: 'unknown', result: null };
  type Row = { type: string; data: unknown; records?: Array<{ path: string; id: string; revision: number; body: unknown }> };
  async function events(rows: Row[], partial = '') {
    await writeFile(join(dir.path, 'events.jsonl'), rows.map((row, i) => JSON.stringify({ sequence: i + 1, at,
      event: { sequence: i + 1, at, jobId: 'R', type: row.type, data: row.data }, records: row.records ?? [] })).join('\n') + (rows.length > 0 ? '\n' : '') + partial);
  }
  const begin: Row = { type: 'consultation-started', data: { consultation: start.id, caller: start.caller.invocation, toolCall: 'ask', parent: null },
    records: [{ path: consultationLayout.start(start.id), id: start.id, revision: 1, body: start }] };
  const end: Row = { type: 'consultation-finished', data: { consultation: start.id, status: outcome.status, delivery: outcome.delivery },
    records: [{ path: consultationLayout.outcome(start.id), id: start.id, revision: 1, body: outcome }] };
  return { dir: dir.path, start, outcome, begin, end, events };
}
async function bytes(directory: string): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  async function walk(path: string) { for (const entry of await readdir(path, { withFileTypes: true })) {
    const target = join(path, entry.name); if (entry.isDirectory()) await walk(target); else files[target] = `${(await stat(target)).mtimeMs}:${createHash('sha256').update(await readFile(target)).digest('hex')}`;
  } }
  await walk(directory); return files;
}

test('accepted answers, exact text and cancellation evidence remain distinct from absent delivery', async () => {
  const f = await fixture(); await f.events([f.begin, f.end]);
  const before = await bytes(f.dir);
  const view = await readConsultations({ run: f.dir, id: f.start.id });
  expect(view.consultations[0]).toMatchObject({ question: '  Exact question\nnew facts.  ',
    accepted: { text: '  Accepted but undelivered\nanswer.  ' }, error: { text: 'Cancelled before delivery' },
    delivery: { observed: 'unknown', recordedOutcome: 'unknown', result: null, modelConsumption: 'unknown' } });
  expect(consultationText(view, true)).toContain('Accepted but undelivered');
  await expect(readConsultations({ run: f.dir, id: 'no-such-call' })).rejects.toThrow('Unknown consultation');
  expect(await bytes(f.dir)).toEqual(before);
});

test('C14: unfinished child correlation uses actual invocation and opened session, partial tail/missing mirrors are never repaired', async () => {
  const f = await fixture();
  await f.events([f.begin, { type: 'session-opened', data: { session: 'ses-0002', role: 'local-architect', work: { request: f.start.id }, executor: 'scripted', model: 'selected/model', fork: { from: f.start.target.point, reason: 'architect-consultation', briefs: [] } } },
    { type: 'invocation-started', data: { invocation: 'inv-child', role: 'local-architect', session: 'ses-0002', work: { request: f.start.id }, start: 'opened' } }], '{unfinished');
  const before = await bytes(f.dir); const view = await readConsultations({ run: f.dir });
  expect(view.consultations[0]).toMatchObject({ status: 'incomplete', elapsedMs: null, child: { invocation: 'inv-child', session: 'ses-0002', model: 'selected/model' }, delivery: { observed: 'unknown' } });
  expect(view.usage.complete).toBe(false); expect(view.cumulativeCallTime.totalMs).toBeNull(); expect(view.limits[0]).toContain('unfinished');
  expect(await bytes(f.dir)).toEqual(before);
});

test('C15: missing/truncated provider usage retains known categories as a subtotal; overlapping top-level times are cumulative', async () => {
  const f = await fixture();
  const second = { ...f.start, id: consultationId('inv-caller', 'again'), caller: { ...f.start.caller, toolCall: 'again' } };
  await f.events([f.begin, f.end, { ...f.begin, data: { ...f.begin.data as object, consultation: second.id, toolCall: 'again' }, records: [{ path: consultationLayout.start(second.id), id: second.id, revision: 1, body: second }] },
    { ...f.end, data: { consultation: second.id, status: 'cancelled', delivery: 'unknown' }, records: [{ path: consultationLayout.outcome(second.id), id: second.id, revision: 1, body: { ...f.outcome, id: second.id, child: { invocation: 'inv-other', session: 'ses-0004' } } }] }]);
  await mkdir(join(f.dir, 'invocations', 'inv-child'), { recursive: true });
  await writeFile(join(f.dir, 'invocations', 'inv-child', 'observations.jsonl'), JSON.stringify({ n: 1, at, type: 'usage', data: { usage: { input: 10, output: 3, cacheRead: 2, cacheWrite: 1, total: 16 }, charge: null, modelElapsedMs: null } }) + '\n{truncated');
  const view = await readConsultations({ run: f.dir });
  expect(view.usage).toMatchObject({ complete: false, total: null, knownSubtotal: { input: 10, output: 3, cacheRead: 2, cacheWrite: 1, total: 16 } });
  expect(view.consultations[0]!.usage.limits.join(' ')).toContain('trailing partial=true');
  expect(view.consultations[1]!.usage.knownSubtotal).toBeNull();
  expect(view.cumulativeCallTime).toMatchObject({ knownSubtotalMs: 2000, totalMs: 2000, complete: true });
});

test('C14: child acceptance committed before consultation outcome stays known, with hash verification and incomplete delivery', async () => {
  const f = await fixture();
  const accepted = JSON.stringify({ schema: 'ramify-agent.architect-consultation-answer/1', answer: '  Exact accepted answer\n  ' });
  const hash = createHash('sha256').update(accepted).digest('hex');
  await mkdir(join(f.dir, 'invocations', 'inv-child'), { recursive: true });
  await writeFile(join(f.dir, 'invocations', 'inv-child', 'submission.json'), accepted);
  await f.events([f.begin,
    { type: 'invocation-started', data: { invocation: 'inv-child', role: 'local-architect', session: 'ses-0002', work: { request: f.start.id }, start: 'opened' } },
    { type: 'invocation-ended', data: { invocation: 'inv-child', session: 'ses-0002', ended: 'submitted', submission: hash, kept: false, finished: 'not-kept' }, records: [{
      path: 'invocations/inv-child/outcome.json', id: 'inv-child', revision: 1, body: { schema: 'ramify-agent.invocation-outcome/1', invocation: 'inv-child', ended: 'submitted',
        rejectedSubmissions: 0, disposition: 'applied', submission: { hash }, settled: { confirmed: true, at, groupsKilled: 0, lateWrites: [] }, outsideScope: [], usage: { unavailable: 'not reported' }, elapsedMs: 100 }
    }] }]);
  const view = await readConsultations({ run: f.dir });
  expect(view.consultations[0]).toMatchObject({ status: 'incomplete', accepted: { text: '  Exact accepted answer\n  ' }, references: { outcome: null }, delivery: { observed: 'unknown' } });
  await writeFile(join(f.dir, 'invocations', 'inv-child', 'submission.json'), accepted + ' ');
  await expect(readConsultations({ run: f.dir })).rejects.toThrow('hash mismatch');
});
