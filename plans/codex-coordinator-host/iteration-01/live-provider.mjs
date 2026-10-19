// Run from the project root: node --import tsx plans/codex-coordinator-host/iteration-01/live-provider.mjs
// An opt-in installed-provider exercise, deliberately outside ordinary discovery.
import { mkdtemp, readFile, writeFile, rm, readdir } from 'node:fs/promises';
import { tmpdir, homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { prepareCoordinatorProvider } from '../../../subs/harness/subs/assistance/src/coordinator-provider.ts';

const root = await mkdtemp(join(tmpdir(), 'ramify-codex-live-'));
const output = resolve('plans/codex-coordinator-host/iteration-01/live-provider.json');
const evidence = { startedAt: new Date().toISOString(), target: root, configuration: { disabledGlobalStdio: ['ramify-agent'], policyOverrides: [], environment: 'inherited unchanged except private supervisor settlement bound' }, phases: [], events: [], settlements: [] };
let provider;
const configPath = join(process.env.CODEX_HOME ?? join(homedir(), '.codex'), 'config.toml');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const configBefore = await readFile(configPath).then(digest).catch(() => null);
evidence.configuration.globalConfigPath = configPath;
evidence.configuration.globalConfigBeforeSha256 = configBefore;
const launch = { cwd: root, configOverrides: ['mcp_servers.ramify-agent.enabled=false'], requestTimeoutMs: 60_000, settlementTimeoutMs: 10_000 };
const thread = { cwd: root, model: 'gpt-6-astra' };
const approvedRead = request => request.kind === 'command-approval' && request.cwd === root && request.command === "/usr/bin/zsh -lc 'cat qualification.txt'";
function observe(event) {
  if (event.kind === 'assistant-delta') return;
  evidence.events.push({ at: new Date().toISOString(), ...event });
  if (event.kind === 'pending-request' && approvedRead(event.request)) {
    // Explicit bounded test-operator authorization: this exact disposable read only.
    const choice = event.request.choices.find(choice => choice.effect === 'once');
    if (choice === undefined) return;
    const response = { kind: 'approval', choiceId: choice.id };
    evidence.phases.push({ kind: 'test-operator-approval', request: event.request, response, authorization: 'Coordinator authorized approve-once for the exact disposable qualification.txt read; no policy change' });
    void provider.respond(event.request.id, response).then(() => evidence.phases.push({ kind: 'test-operator-response-written', requestId: event.request.id })).catch(error => { evidence.phases.push({ kind: 'test-operator-response-error', error: String(error) }); });
  }
  if (event.kind === 'turn' || event.kind === 'pending-request' || event.kind === 'provider-exit' || event.kind === 'provider-error') console.log(JSON.stringify(event));
}
async function turn(message) {
  let timer;
  let close = () => {};
  const outcome = new Promise((resolve, reject) => {
    timer = setTimeout(() => reject(new Error('Bounded live qualification exceeded 240 seconds')), 240_000);
    close = provider.observe(event => {
      if (event.kind === 'turn' && event.threadId === evidence.threadId && event.turn.status !== 'inProgress') resolve(event.turn);
      if (event.kind === 'pending-request' && !approvedRead(event.request)) reject(new Error('Live exercise requires operator response; request retained in evidence'));
      if (event.kind === 'provider-exit') reject(new Error('Live provider exited'));
    });
  });
  // A transport failure before acknowledgement still releases this observer.
  void outcome.catch(() => undefined);
  try {
    const submitted = await provider.send(evidence.threadId, message);
    evidence.phases.push({ kind: 'turn-submitted', turnId: submitted.id });
    const completed = await outcome;
    if (completed.status !== 'completed') throw new Error(`Live turn did not complete: ${JSON.stringify(completed)}`);
    return completed;
  } finally { clearTimeout(timer); close(); }
}
try {
  await writeFile(join(root, 'qualification.txt'), 'ramify-native-equipment-token-9482\n');
  await writeFile(join(root, 'AGENTS.md'), '# Provider qualification\nThis directory is a disposable provider exercise. Read qualification.txt and report the token. Never modify files, install software, start an MCP owner or implement a feature. Native worker qualification is explicitly authorized.\n');
  const prepared = await prepareCoordinatorProvider({ launch, thread, workerModel: 'gpt-6-sol', retain: async (session, readiness) => {
    evidence.threadId = session.thread.id;
    evidence.readiness = readiness;
    evidence.session = session;
    evidence.phases.push({ kind: 'persistent-thread-retained', at: new Date().toISOString() });
    await writeFile(output, JSON.stringify(evidence, null, 2) + '\n');
  } });
  provider = prepared.provider;
  provider.observe(observe);
  evidence.equipment = { ...prepared.equipment, models: prepared.equipment.models.filter(m => ['gpt-6-astra', 'gpt-6-sol'].includes(m.id)) };
  await turn('This is a bounded provider equipment qualification, not implementation work. Read qualification.txt with your actual shell tool using the exact command `cat qualification.txt` with workdir set to this directory. Explicitly spawn one native worker using gpt-6-sol (fork_turns="none") to read the same file using its shell, with the exact command `cat qualification.txt` and workdir set to this directory, and return the token and its model. Wait for that worker to finish using native collaboration tools. Report the token, native worker identity/model, and the tools actually used. Do not modify any files or implement any feature.');
  const workerIds = [...new Set(evidence.events.filter(event => event.kind === 'work' && event.threadId === evidence.threadId).flatMap(event => event.item.workerThreadIds ?? []))];
  const workers = [];
  for (const workerId of workerIds) workers.push(await provider.readThread(workerId));
  evidence.nativeWorkers = workers;
  if (!workers.some(worker => worker.model === 'gpt-6-sol' && worker.parentThreadId === evidence.threadId && worker.turns.some(turn => turn.status === 'completed' && turn.work.some(item => item.kind === 'commandExecution' && item.status === 'completed')))) throw new Error('Actual native Sol worker identity/model and completed shell execution were not observed');
  const before = await provider.readThread(evidence.threadId);
  if (!before.turns.some(turn => turn.status === 'completed' && turn.messages.some(message => message.role === 'assistant' && message.text.includes('ramify-native-equipment-token-9482')))) throw new Error('Coordinator did not finish the native equipment turn');
  evidence.phases.push({ kind: 'history-read-before-stop', thread: before });
  const firstSettlement = await provider.stop();
  evidence.settlements.push(firstSettlement);
  if (!firstSettlement.confirmed) throw new Error('First provider was not confirmed settled; no replacement is authorized');
  const resumed = await prepareCoordinatorProvider({ launch, thread, workerModel: 'gpt-6-sol', resumeThreadId: evidence.threadId, retain: async (session, readiness) => {
    evidence.phases.push({ kind: 'same-thread-resumed', threadId: session.thread.id, ephemeral: session.thread.ephemeral, readiness });
  } });
  provider = resumed.provider;
  provider.observe(observe);
  const after = await provider.readThread(evidence.threadId);
  if (after.id !== before.id || after.ephemeral !== false || after.turns.length < before.turns.length) throw new Error('Persistent thread history was not recovered');
  evidence.phases.push({ kind: 'history-read-after-restart', thread: after });
  await turn('Provider history qualification only: from the preceding conversation, report the exact token and worker model without invoking tools, creating another worker, or modifying files.');
  evidence.finalHistory = await provider.readThread(evidence.threadId);
  evidence.configuration.globalConfigAfterSha256 = await readFile(configPath).then(digest).catch(() => null);
  evidence.configuration.globalConfigUnchanged = evidence.configuration.globalConfigAfterSha256 === configBefore;
  if (!evidence.configuration.globalConfigUnchanged) throw new Error('Global provider configuration changed during qualification');
  evidence.targetFiles = (await readdir(root)).sort();
  if (JSON.stringify(evidence.targetFiles) !== JSON.stringify(['AGENTS.md', 'qualification.txt'])) throw new Error('Disposable target acquired unexpected files');
  if ((await readFile(join(root, 'qualification.txt'), 'utf8')) !== 'ramify-native-equipment-token-9482\n') throw new Error('Disposable read fixture changed');
  evidence.outcome = 'passed';
} catch (error) {
  evidence.outcome = 'failed';
  evidence.error = String(error);
  console.error(evidence.error);
  process.exitCode = 1;
} finally {
  if (provider !== undefined) evidence.settlements.push(await provider.stop());
  evidence.finishedAt = new Date().toISOString();
  await writeFile(output, JSON.stringify(evidence, null, 2) + '\n');
  if (evidence.settlements.length > 0 && evidence.settlements.every(s => s.confirmed)) await rm(root, { recursive: true, force: true });
}
