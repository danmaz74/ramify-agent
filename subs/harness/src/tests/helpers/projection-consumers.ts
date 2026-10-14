import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { AddressInfo } from 'node:net';
import { discoverDocuments } from '../../../subs/plan-evidence/src/discovery.js';
import type { ChangeHistory } from '../../../subs/evidence/src/git.js';
import { RamifyCli } from '../../../subs/evidence/src/ramify-cli.js';
import { createScriptedAgent } from '../../../subs/agent/src/scripted.js';
import type { ConfiguredAuditPort } from '../../../subs/audit/src/check-execution.js';
import { RunQueries } from '../../../subs/projections/src/queries.js';
import { SessionQueries } from '../../../subs/projections/src/session-queries.js';
import { createApp } from '../../http/app.js';
import { createQuerySource } from '../../http/query-source.js';
import { runConsultationsCommand } from '../../consultations/command.js';
import { consultationId, consultationLayout, type ConsultationStart, type ConsultationOutcome } from '../../consultations/records.js';
import { sessionPointReference } from '../../run/session-operations.js';
import { commitRecord } from '../../jobs/commit.js';
import { RunLog } from '../../run/log.js';
import { runLayout } from '../../run/records.js';
import { repairExportPayloadPath } from '../../run/repair-export.js';
import { RunService } from '../../run/service.js';
import { acquireProjectLock } from '../../store/lock.js';
import { ContentStore } from '../../transcripts/store.js';
import { TranscriptWriter } from '../../transcripts/writer.js';
import { protocolPaths as paths } from '../../interfaces/protocol/paths.js';
import { errorResponseSchema } from '../../interfaces/protocol/errors.js';
import { analysisResponseSchema, decisionListResponseSchema, workItemListResponseSchema, capabilityListResponseSchema, scenarioListResponseSchema, metricsResponseSchema, runResponseSchema, runListResponseSchema, runEventPageSchema } from '../../interfaces/protocol/runs.js';
import { runSessionsResponseSchema, sessionTranscriptResponseSchema, sessionUpdatesResponseSchema } from '../../interfaces/protocol/sessions.js';
import { constructedRecord, runId } from './constructed.js';
import { repairExportFixture } from './repair-export-fixture.js';

/** External collaborators only: the readers, HTTP answers and service are real. */
export class FakeQueryEffects extends RamifyCli {
  readonly calls = { agent: 0, audit: 0, exporter: 0, evidence: 0 };
  readonly agent = createScriptedAgent(() => { this.calls.agent++; throw new Error('Query invoked agent'); });
  readonly audit: ConfiguredAuditPort = {
    read: async () => { this.calls.audit++; throw new Error('Query read audit'); },
    run: async () => { this.calls.audit++; throw new Error('Query ran audit'); },
  };
  readonly history: ChangeHistory = {
    commitsBetween: async (_root, from, to) => { assert.equal(from, to); return []; },
    changedFiles: async () => { throw new Error('No recorded change range'); },
    lineOrigins: async () => { throw new Error('No recorded line origins'); },
    lineLastSeen: async () => { throw new Error('No recorded line last-seen'); },
  };
  readonly commandExecution = async () => { this.calls.exporter++; throw new Error('Query invoked command/exporter'); };
  override async run(): Promise<never> { this.calls.evidence++; throw new Error('Query launched evidence CLI'); }
  override async stopDaemon(): Promise<void> { /* No daemon was started by this fake. */ }
}
const plan = 'review-notes';
const session = 'ses-0001';
const at = '2026-10-10T10:00:00.000Z';
const inline = (text: string) => ({ stored: 'inline' as const, text, bytes: Buffer.byteLength(text) });
const question = '  Exact question\nnew facts.  ';
const answer = '  Accepted but undelivered\nanswer.  ';
const bodyText = 'Recorded transcript body\nwith exact whitespace.  \n';

export async function captureProjectionFiles(root: string) {
  const files: Record<string, { bytes: string; ino: number; dev: number; mtime: number; size: number }> = {};
  async function walk(directory: string): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else { const info = await stat(path); files[path] = { bytes: (await readFile(path)).toString('base64'), ino: info.ino, dev: info.dev, mtime: info.mtimeMs, size: info.size }; }
    }
  }
  await walk(root); return files;
}

export async function recordedProjectionConsumers() {
  const root = await mkdtemp(join(tmpdir(), 'projection-consumers-'));
  const directory = join(root, 'plans', plan, '.harness', 'jobs', runId);
  await mkdir(directory, { recursive: true });
  await writeFile(join(root, 'project.txt'), 'Retained project content\n');
  await writeFile(join(root, 'plans', plan, 'plan.md'), '# Retained query fixture\n');
  const documents = await discoverDocuments(root, plan, { commit: 'a'.repeat(40), dirty: false });
  const manifestBytes = JSON.stringify(documents.manifest);
  for (const document of documents.manifest.documents) {
    const destination = join(directory, document.storedAt);
    await mkdir(join(destination, '..'), { recursive: true });
    await writeFile(destination, documents.bytes.get(document.id)!);
  }
  await writeFile(join(directory, runLayout.documentManifest), manifestBytes);
  const record = constructedRecord();
  record.manifest = { ...record.manifest, planHash: documents.manifest.documents[0]!.sha256,
    documentManifest: { path: runLayout.documentManifest, hash: createHash('sha256').update(manifestBytes).digest('hex') },
    source: { commit: 'a'.repeat(40), dirty: false } };
  await writeFile(join(directory, runLayout.record), JSON.stringify(record));
  const log = await RunLog.open(join(directory, runLayout.events), runId);
  await log.append({ type: 'document-manifest-committed', data: { manifest: runLayout.documentManifest, hash: record.manifest.documentManifest.hash, documents: documents.manifest.documents.length } });
  await log.append({ type: 'job-started', data: { command: { commandId: 'recorded-start', contentHash: 'a'.repeat(64), receipt: { commandId: 'recorded-start', jobId: runId, sequence: 1, acceptedAt: at } } } });
  await log.append({ type: 'session-opened', data: { session, role: 'engineer', work: {}, executor: 'scripted', model: 'recorded-model' } });
  await log.append({ type: 'invocation-started', data: { invocation: 'inv-0001', session, role: 'engineer', work: {}, start: 'opened' } });
  const writer = new TranscriptWriter({ session, path: join(directory, runLayout.transcript(session)), root: directory,
    store: new ContentStore(join(directory, runLayout.blobs)), inlineBytes: 1, now: () => new Date(at) });
  await writeFile(join(directory, 'retained.txt'), 'Recorded file body\n');
  const entry = await writer.append(async bodies => ({ type: 'message', invocation: 'inv-0001', role: 'user', blocks: [
    { type: 'text', body: await bodies.text(bodyText) }, { type: 'text', body: await bodies.file(join(directory, 'retained.txt')) },
  ] }));
  await writer.drain();
  await log.append({ type: 'invocation-ended', data: { invocation: 'inv-0001', session, ended: 'submitted', submission: null, kept: false, finished: 'work-closed' } });
  const start: ConsultationStart = { schema: 'ramify-agent.consultation-start/1', id: consultationId('inv-0001', 'ask'), caller: {
    invocation: 'inv-0001', session, role: 'engineer', toolCall: 'ask', work: {} }, parent: null,
    target: { role: 'local-architect', run: { planId: plan, runId }, session: 'ses-0003', point: { session: 'ses-0003', invocation: 'inv-original' },
      ref: sessionPointReference(runId, { sessionId: 'original', kind: 'turn', turn: 1, checkpoint: 'L0' }) }, globalTarget: null,
    startedAt: at, message: inline(question), request: { session, entry: null } };
  const outcome: ConsultationOutcome = { schema: 'ramify-agent.consultation-outcome/1', id: start.id, status: 'cancelled', endedAt: '2026-10-10T10:00:01.000Z',
    child: { invocation: 'inv-child', session: 'ses-0002' }, accepted: { submission: 'invocations/inv-child/submission.json', answer: inline(answer) },
    error: { code: 'cancelled', message: inline('Cancelled before delivery') }, delivery: 'unknown', result: null };
  await commitRecord(log.ledger, { event: log.next({ type: 'consultation-started', data: { consultation: start.id, caller: 'inv-0001', toolCall: 'ask', parent: null } }),
    records: [{ path: consultationLayout.start(start.id), id: start.id, revision: 1, body: start }] });
  await commitRecord(log.ledger, { event: log.next({ type: 'consultation-finished', data: { consultation: start.id, status: 'cancelled', delivery: 'unknown' } }),
    records: [{ path: consultationLayout.outcome(start.id), id: start.id, revision: 1, body: outcome }] });
  const second = { ...start, id: consultationId('inv-0001', 'again'), caller: { ...start.caller, toolCall: 'again' } };
  await commitRecord(log.ledger, { event: log.next({ type: 'consultation-started', data: { consultation: second.id, caller: 'inv-0001', toolCall: 'again', parent: null } }),
    records: [{ path: consultationLayout.start(second.id), id: second.id, revision: 1, body: second }] });
  await commitRecord(log.ledger, { event: log.next({ type: 'consultation-finished', data: { consultation: second.id, status: 'cancelled', delivery: 'unknown' } }),
    records: [{ path: consultationLayout.outcome(second.id), id: second.id, revision: 1, body: { ...outcome, id: second.id } }] });
  const repair = repairExportFixture(root, runId);
  await commitRecord(log.ledger, { event: log.next({ type: 'repair-incident-recorded', data: { incidentId: 'apr-0001', revision: 1, stage: 'refused' } }),
    records: [{ path: runLayout.repairIncident('apr-0001', 1), id: 'apr-0001', revision: 1, body: repair.incident },
      { path: repairExportPayloadPath('apr-0001', 1), id: 'apr-0001', revision: 1, body: repair }] });
  await log.append({ type: 'job-completed', data: { gate: 'ga-recorded', commit: 'a'.repeat(40), workItems: 0 } });
  const effects = new FakeQueryEffects();
  const lock = await acquireProjectLock(root);
  const { service, recovery } = await RunService.open({ projectRoot: root, lock, agent: effects.agent, ramify: effects,
    inputs: { capture: async () => { throw new Error('No evidence capture'); }, index: async () => null, changes: async () => [], refresh: async () => null },
    configuredAudit: effects.audit, commandExecution: effects.commandExecution, changeHistory: effects.history,
    repairIncidentExport: { executable: '/tools/scripted-exporter', workspace: root }, warn: message => { throw new Error(message); } });
  assert.deepEqual(recovery.skipped, []);
  const source = createQuerySource(service);
  const queries = new RunQueries(source);
  const sessions = new SessionQueries(source);
  const server = createApp({ projectRoot: root, runs: service }).listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  const delivered = new Map<string, string>();
  function stable(key: string, value: unknown) {
    const bytes = JSON.stringify(value);
    if (delivered.has(key)) assert.equal(bytes, delivered.get(key), `Repeated answer changed: ${key}`);
    else delivered.set(key, bytes);
  }
  const get = async (path: string, expected = 200) => {
    const response = await fetch(origin + path); assert.equal(response.status, expected, path);
    const value: unknown = await response.json(); stable(path, value); return value;
  };
  const version = 11;
  assert.equal(log.events.at(-1)!.sequence, version);
  const snapshot = await captureProjectionFiles(root);
  const events = await readFile(join(directory, runLayout.events), 'utf8');
  const hash = createHash('sha256').update(bodyText).digest('hex');
  async function exercise() {
    for (let round = 0; round < 3; round++) {
      const run = runResponseSchema.parse(await queries.run(plan, runId));
      assert.equal(run.run.state, 'completed'); assert.equal(run.run.version, version);
      assert.deepEqual(run.run.automaticRepairs, { attempted: 0, refused: 1, incidents: run.run.automaticRepairs.incidents });
      assert.equal(run.run.automaticRepairs.incidents.length, 1);
      const incident = run.run.automaticRepairs.incidents[0]!;
      assert.equal(incident.incidentId, 'apr-0001'); assert.equal(incident.stage, 'refused'); assert.equal(incident.revision, 1);
      assert.deepEqual(incident.export, repair.incident.export);
      assert.deepEqual(incident.harnessError, repair.incident.harnessError);
      assert.deepEqual(incident.admission, { admitted: false, reason: 'No assignment' });
      const httpRun = runResponseSchema.parse(await get(paths.run(plan, runId)));
      assert.deepEqual(httpRun, run);
      const list = runListResponseSchema.parse(await get(paths.runs(plan)));
      assert.deepEqual(list.runs.map(row => [row.jobId, row.state, row.version]), [[runId, 'completed', version]]);
      const page = runEventPageSchema.parse(await queries.events(plan, runId, 0));
      assert.deepEqual(page.events.map(row => row.sequence), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
      assert.deepEqual(await get(paths.runEvents(plan, runId, 0)), page);
      // Expected from the recorded stimulus, not another projector's output.
      assert.deepEqual(page.events.map(row => row.transition), [
        'document-manifest-committed', 'job-started', 'session-opened', 'invocation-started',
        'invocation-ended', 'consultation-started', 'consultation-finished',
        'consultation-started', 'consultation-finished', 'repair-incident-recorded', 'job-completed',
      ]);
      const summaries = runSessionsResponseSchema.parse(await sessions.runSessions(plan, runId));
      assert.equal(summaries.total, 1); assert.equal(summaries.version, version);
      assert.deepEqual(summaries.sessions.map(row => [row.session, row.state, row.finished, row.model]), [[session, 'finished', 'work-closed', 'recorded-model']]);
      assert.deepEqual(await get(paths.runSessions(plan, runId)), summaries);
      assert.deepEqual(await get(paths.runSession(plan, runId, session)), await sessions.runSession(plan, runId, session));
      const transcript = sessionTranscriptResponseSchema.parse(await sessions.transcript({ source: 'run', planId: plan, runId, session }, 0));
      assert.deepEqual(transcript.page.entries, [entry]);
      assert.deepEqual(await get(paths.runSessionTranscript(plan, runId, session, 0)), transcript);
      assert.deepEqual(await sessions.runBody(plan, runId, hash), { content: bodyText, bytes: Buffer.byteLength(bodyText), truncated: false });
      assert.deepEqual(await get(paths.runBody(plan, runId, hash)), { content: bodyText, bytes: Buffer.byteLength(bodyText), truncated: false });
      assert.deepEqual(await sessions.runFile(plan, runId, session, 'retained.txt'), { content: 'Recorded file body\n', bytes: 19, truncated: false });
      assert.deepEqual(await get(paths.runSessionFile(plan, runId, session, 'retained.txt')), { content: 'Recorded file body\n', bytes: 19, truncated: false });
      const globalSessions = await sessions.list(0);
      assert.equal(globalSessions.total, 1); assert.deepEqual(globalSessions.sessions.map(row => row.ref), [{ source: 'run', planId: plan, runId, session }]);
      const initialPoll = await sessions.updates(plan, runId, 0, [{ session, after: 0 }]);
      assert.deepEqual(initialPoll.sessions.map(row => row.session), [session]);
      assert.deepEqual(initialPoll.transcripts[0]!.page.entries, [entry]);
      assert.deepEqual(await get(paths.runSessionUpdates(plan, runId, 0, [{ session, after: 0 }])), initialPoll);
      const poll = sessionUpdatesResponseSchema.parse(await sessions.updates(plan, runId, version, [{ session, after: 1 }]));
      assert.deepEqual(poll.sessions, []); assert.deepEqual(poll.transcripts[0]!.page.entries, []);
      assert.deepEqual(await get(paths.runSessionUpdates(plan, runId, version, [{ session, after: 1 }])), poll);
      assert.deepEqual(analysisResponseSchema.parse(await queries.analysis(plan, runId)), {
        plan: { markdown: '# Retained query fixture\n', hash: record.manifest.planHash }, analysis: { status: 'pending' },
      });
      assert.deepEqual(decisionListResponseSchema.parse(await queries.decisions(plan, runId)), { decisions: [], total: 0 });
      assert.deepEqual(workItemListResponseSchema.parse(await queries.workItems(plan, runId)), { workItems: [], total: 0 });
      assert.deepEqual(capabilityListResponseSchema.parse(await queries.capabilities(plan, runId)), { capabilities: [], total: 0 });
      assert.deepEqual(scenarioListResponseSchema.parse(await queries.scenarios(plan, runId)), { scenarios: [], total: 0, obligations: [] });
      metricsResponseSchema.parse(await queries.metrics(plan, runId));
      for (const [path, read] of [
        [paths.runAnalysis(plan, runId), () => queries.analysis(plan, runId)],
        [paths.runDecisions(plan, runId), () => queries.decisions(plan, runId)],
        [paths.runWorkItems(plan, runId), () => queries.workItems(plan, runId)],
        [paths.runCapabilities(plan, runId), () => queries.capabilities(plan, runId)],
        [paths.runScenarios(plan, runId), () => queries.scenarios(plan, runId)],
        [paths.runMetrics(plan, runId), () => queries.metrics(plan, runId)],
      ] as const) assert.deepEqual(await get(path), await read());
      assert.equal(errorResponseSchema.parse(await get(paths.runSession(plan, runId, 'ses-9999'), 404)).error.code, 'not-found');
      assert.equal(errorResponseSchema.parse(await get(paths.runBody(plan, runId, 'not-a-hash'), 400)).error.code, 'invalid-request');
      const json = await runConsultationsCommand({ run: directory, format: 'json' });
      stable('consultations-json', json);
      assert.equal(json.exitStatus, 0); assert.equal(json.stderr, '');
      const view = JSON.parse(json.stdout);
      assert.equal(view.schema, 'ramify-agent.consultation-inspection/1'); assert.equal(view.count, 2);
      assert.deepEqual(view.consultations.map((row: { id: string; question: string; status: string }) => [row.id, row.question, row.status]), [[start.id, question, 'cancelled'], [second.id, question, 'cancelled']]);
      assert.equal(view.consultations[0].accepted.text, answer);
      assert.equal(view.consultations[0].error.text, 'Cancelled before delivery');
      assert.equal(view.consultations[0].delivery.observed, 'unknown');
      assert.equal(json.stdout, JSON.stringify(view, null, 2) + '\n');
      const text = await runConsultationsCommand({ run: directory });
      stable('consultations-text', text);
      assert.equal(text.exitStatus, 0); assert.equal(text.stderr, '');
      const expectedText = [
        `Consultations: 2 (run ${runId})`,
        ...[start, second].flatMap(call => [
          `${call.id} — engineer ${session}/inv-0001 {}`,
          `  ${JSON.stringify(question)} — cancelled; elapsed 1000ms; delivery unknown`,
          '  Target local-architect: {"session":"ses-0003","invocation":"inv-original"}; model unknown',
          '  Usage null; complete=false',
          `  Records ${consultationLayout.start(call.id)}; ${consultationLayout.outcome(call.id)}`,
          '  Request transcripts/ses-0001.jsonl:?; fork transcripts/ses-0002.jsonl',
          '  Caller result ?; subsequent transcripts/ses-0001.jsonl:?',
          '  Limit: Child transcript missing',
          '  Limit: Child invocation has no completed outcome',
          `  Limit: invocations/inv-child/observations.jsonl cannot be read: ENOENT: no such file or directory, open '${join(directory, 'invocations/inv-child/observations.jsonl')}'`,
          '  Chain usage known subtotal null; complete=false',
        ]),
        'Usage known subtotal null; complete=false',
        'cumulative top-level call time (not session wall time): 2000ms; known subtotal=2000ms',
        'Recorded caller tool results and subsequent transcript pointers do not establish model consumption or usefulness',
      ].join('\n') + '\n';
      assert.equal(text.stdout, expectedText);
      assert.deepEqual(await runConsultationsCommand({ run: directory, id: start.id, session }), { stdout: '', stderr: `Cannot read consultations from ${directory}: Choose --id or --session, not both\n`, exitStatus: 2 });
    }
  }
  return { root, directory, effects, exercise,
    capture: async () => { assert.deepEqual(await captureProjectionFiles(root), snapshot); },
    unchanged: async () => { assert.deepEqual(await captureProjectionFiles(root), snapshot); assert.equal(await readFile(join(directory, runLayout.events), 'utf8'), events); assert.equal(service.events(plan, runId)!.at(-1)!.sequence, version); },
    noEffects: () => assert.deepEqual(effects.calls, { agent: 0, audit: 0, exporter: 0, evidence: 0 }),
    composition: async () => {
      assert.ok(Object.isFrozen(source)); assert.deepEqual(Object.keys(source).sort(), ['agentName', 'candidateSource', 'changeHistory', 'committed', 'committedRuns', 'projectRoot', 'runVersions']);
      for (const file of ['../../http/app.ts', '../../consultations/command.ts']) {
        const code = await readFile(new URL(file, import.meta.url), 'utf8'); assert.ok(code.includes("../../subs/projections/src/"));
      }
    },
    oldTreeAbsent: async () => { await assert.rejects(readdir(new URL('../../projections/', import.meta.url)), { code: 'ENOENT' }); },
    close: async () => { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); await service.close(); await rm(root, { recursive: true, force: true }); },
  };
}
