import { writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { AgentEvent } from '../../../subs/agent/src/interfaces/port.js';
import { ExcursionWatcher } from '../../../subs/task-execution/src/excursions.js';
import { ObservationLog, type Observation } from '../../../subs/task-execution/src/observations.js';
import { PortEventRecorder } from '../../../subs/task-execution/src/port-events.js';
import { openCandidateSnapshot, snapshotTools } from '../../../subs/reviews/src/snapshot.js';
import { scriptedCandidates } from '../../../subs/autonomous/subs/acceptance/src/tests/helpers/candidates.js';
import { temporaryDirectory } from './fixture.js';

/** The original deliberately partial Plan23 evidence, not a durable Invocation. */
export interface Plan23Identity {
  runId: string; operationId: string; sessionId: string; turn: number;
  sourcePoint: { sessionId: string; turn: number; kind: 'checkpoint'; checkpoint: string };
}
export interface Plan23Invocation {
  id: string; role: 'engineer'; work: Record<string, never>; writer: boolean; startedAt: string; sessionOperation: Plan23Identity;
}
export interface Plan23Usage { input: number; cacheRead: number; cacheWrite: number; output: number; total: number }
export interface Plan23Outcome {
  ended: 'submitted'; outsideScope: never[]; usage: Plan23Usage;
  settled: { at: string; confirmed: boolean; groupsKilled: number; lateWrites: never[] };
}
export const plan23Time = (seconds: number): string => `2026-10-08T00:00:${String(seconds).padStart(2, '0')}.000Z`;
export const plan23Identity: Plan23Identity = { runId: 'run', operationId: 'inv-1', sessionId: 'original-session', turn: 2, sourcePoint: { sessionId: 'original-session', turn: 1, kind: 'checkpoint', checkpoint: 'brief-C1' } };
export const plan23Invocation: Plan23Invocation = { id: 'inv-1', role: 'engineer', work: {}, writer: true, startedAt: plan23Time(0), sessionOperation: plan23Identity };
export const plan23Outcome: Plan23Outcome = { ended: 'submitted', outsideScope: [], usage: { input: 100, cacheRead: 40, cacheWrite: 10, output: 20, total: 170 }, settled: { at: plan23Time(5), confirmed: true, groupsKilled: 0, lateWrites: [] } };
const t = plan23Time;
const identity = plan23Identity;
const usageEvent: AgentEvent = { type: 'message', role: 'assistant', blocks: [], text: '', detail: { model: null, thinkingLevel: null, stopReason: null, error: null, reasoningTokens: null, cost: null, cacheWrites: null },
  usage: plan23Outcome.usage, execution: identity,
  observation: { sourceId: 'message-7', at: t(3), elapsedMs: 120, charge: { model: 'fixed/model', sourceRevision: 'captured-model-r1', ratesPerMillion: { newInput: 2, cachedInput: 0.5, cacheWrite: 3, output: 4 } } } };
export type Plan23Stimulus = 'snapshot' | 'restoration' | 'failed-search' | 'undeclared' | 'duration' | 'milestone' | 'usage' | 'torn' | 'conflict' | 'reopened';
export interface Plan23RestoreFacts {
  usageBefore: number; contextBefore: number; lastBefore: Observation | undefined;
  duplicateAccepted: boolean; contextAccepted: boolean; usageAfter: number; contextAfter: number;
}
/** Only plain evidence escapes. Writable log/recorder/candidate tools stay here. */
export interface Plan23RecordedFixture {
  path: string; root: string; rows: readonly Observation[]; laterRows: readonly Observation[];
  restoredRows: readonly Observation[]; returnedBytes: number; usage: Plan23Usage;
  restore: Plan23RestoreFacts | null; cleanup: () => Promise<void>;
}
async function edited(recorder: PortEventRecorder, callId: string, seconds: number) {
  await recorder.record({ type: 'tool-started', tool: 'edit', callId, input: {}, action: { kind: 'write', paths: ['src/a.ts'] }, mutating: true, execution: identity, observation: { sourceId: `${callId}:start`, at: t(seconds) } });
  await recorder.record({ type: 'tool-finished', tool: 'edit', callId, isError: false, reachedTool: true, execution: identity, observation: { sourceId: `${callId}:end`, at: t(seconds + 1), elapsedMs: 10 } });
}
async function explored(recorder: PortEventRecorder, callId: string, kind: 'read' | 'search', root: string, bytes: number | null, files: string[] | null, seconds: number) {
  const action = kind === 'read' ? { kind, path: 'src/a.ts', range: null } : { kind, path: '..', glob: '**/*.ts', pattern: 'absent' };
  await recorder.record({ type: 'tool-started', tool: kind, callId, input: {}, action, mutating: false, execution: identity, observation: { sourceId: `${callId}:start`, at: t(seconds) } });
  await recorder.record({ type: 'tool-finished', tool: kind, callId, isError: false, reachedTool: true, execution: identity,
    observation: { sourceId: `${callId}:end`, at: t(seconds + 1), elapsedMs: 10, returnedBytes: bytes, files, resolvedScope: [kind === 'read' ? join(root, 'src/a.ts') : join(root, '..')], coverage: kind === 'search' ? ['Scanned bytes unavailable'] : [] } });
}
export async function recordPlan23Stimulus(kind: Plan23Stimulus): Promise<Plan23RecordedFixture> {
  const directory = await temporaryDirectory();
  try {
    const path = join(directory.path, 'observations.jsonl'); const observations = await ObservationLog.open(path);
    const reviewer = kind === 'snapshot' || kind === 'undeclared';
    const recorder = new PortEventRecorder({ projectRoot: directory.path,
      ...(kind === 'snapshot' ? { workingDirectory: join(directory.path, 'reviews/workspace') } : {}), observations,
      invocation: { id: 'inv-1', role: reviewer ? 'reviewer' : 'engineer', startedAt: t(0), submissionTool: reviewer ? 'submit_review' : 'submit', declaredPaths: kind === 'undeclared' ? [] : kind === 'snapshot' ? [directory.path] : [join(directory.path, 'src')] },
      context: { compaction: 'forbidden', budgetTokens: null, budgetFraction: null, reportReserveTokens: 0 }, excursions: new ExcursionWatcher({ projectRoot: directory.path, index: null, scope: undefined }), judge: { countImplementationRejection: () => async () => {} } });
    recorder.identify(identity);
    let returnedBytes = 0;
    let rows: readonly Observation[] = [];
    let laterRows: readonly Observation[] = [];
    let restoredRows: readonly Observation[] = [];
    let restore: Plan23RestoreFacts | null = null;
    if (kind === 'snapshot') {
      const source = scriptedCandidates(directory.path, { c1: { tree: 't1', base: 'c0', changes: [{ status: 'M', path: 'src/a.ts' }], files: { 'src/a.ts': 'export const a = 1;\n' } } });
      const snapshot = await openCandidateSnapshot(source, directory.path, { commit: 'c1', base: 'c0' });
      const tools = snapshotTools(snapshot, source, directory.path);
      const calls = [['snapshot_read', { path: 'src/a.ts' }], ['snapshot_read', { path: 'src/a.ts', startLine: 1, lineCount: 1 }], ['snapshot_list', {}], ['snapshot_search', { path: 'src', pattern: 'absent' }], ['snapshot_diff', {}], ['snapshot_diff', { path: 'src/a.ts' }]] as const;
      for (const [index, [name, input]] of calls.entries()) {
        const tool = tools.definitions.find(tool => tool.name === name)!;
        const action = tool.action?.(input) ?? { kind: 'harness' as const }; const callId = `snapshot-${index}`;
        await recorder.record({ type: 'tool-started', tool: name, input, callId, action, mutating: false, execution: identity, observation: { sourceId: `${callId}:start`, at: t(index + 1) } });
        const result = await tool.execute(input, new AbortController().signal); returnedBytes += Buffer.byteLength(result.text);
        const target = action.kind === 'read' || action.kind === 'search' ? action.path : null;
        await recorder.record({ type: 'tool-finished', tool: name, callId, isError: result.isError === true, reachedTool: true, execution: identity,
          observation: { sourceId: `${callId}:finish`, at: t(index + 2), elapsedMs: 10, returnedBytes: Buffer.byteLength(result.text), resolvedScope: target === null ? null : [target], files: action.kind === 'read' && target ? [target] : null, coverage: action.kind === 'search' ? ['Matched file identities not reported'] : [] } });
      }
    } else if (kind === 'restoration') {
      await explored(recorder, 'r1', 'read', directory.path, 7, [join(directory.path, 'src/a.ts')], 1);
      await explored(recorder, 'r2', 'read', directory.path, 5, [join(directory.path, 'src/a.ts')], 2);
      await explored(recorder, 's1', 'search', directory.path, 0, [], 3); await edited(recorder, 'e1', 4);
      await recorder.record(usageEvent); await recorder.record(usageEvent);
    } else if (kind === 'failed-search') {
      await recorder.record({ type: 'tool-started', tool: 'grep', callId: 'missing', input: {}, action: { kind: 'search', path: 'docs/absent', glob: null, pattern: 'x' }, mutating: false, execution: identity, observation: { sourceId: 'missing:start', at: t(1) } });
      await recorder.record({ type: 'tool-finished', tool: 'grep', callId: 'missing', isError: true, reachedTool: true, errorText: 'Path not found', execution: identity, observation: { sourceId: 'missing:end', at: t(2), elapsedMs: 5, returnedBytes: 14, files: null, resolvedScope: null, coverage: [] } });
      await explored(recorder, 's1', 'search', join(directory.path, 'src', 'sub'), 0, [], 3);
    } else if (kind === 'undeclared') {
      await explored(recorder, 's1', 'search', join(directory.path, 'src'), 0, ['src/a.ts'], 1);
    } else if (kind === 'duration') {
      await recorder.record(usageEvent); await recorder.drain(); rows = [...observations.observations];
      await explored(recorder, 'r1', 'read', directory.path, 7, [join(directory.path, 'src/a.ts')], 1); await edited(recorder, 'e1', 2);
    } else if (kind === 'milestone') {
      await explored(recorder, 'r1', 'read', directory.path, 7, [join(directory.path, 'src/a.ts')], 1); await explored(recorder, 's1', 'search', directory.path, 0, [], 2);
      await recorder.record({ type: 'tool-started', tool: 'shell', callId: 'c1', input: {}, action: { kind: 'command', command: 'ls' }, mutating: false, execution: identity, observation: { sourceId: 'c1:start', at: t(3) } });
      await recorder.drain(); rows = [...observations.observations];
      await recorder.record({ type: 'tool-started', tool: 'shell', callId: 'c2', input: {}, action: { kind: 'command', command: 'sed -i' }, mutating: true, execution: identity, observation: { sourceId: 'c2:start', at: t(4) } });
    } else if (kind === 'torn') {
      await explored(recorder, 'r', 'read', directory.path, 9, null, 1);
      await writeFile(path, `${await readFile(path, 'utf8')}{broken}\n{"trailing":`);
    } else {
      await recorder.record(usageEvent);
      if (kind === 'conflict') await explored(recorder, 'read', 'read', directory.path, 3, [], 1);
      if (kind === 'reopened') {
        const usage = observations.observations.find(row => row.type === 'usage')!;
        const context = { n: usage.n + 2, at: t(4), type: 'context', data: { tokens: null, window: null, threshold: null } };
        await writeFile(path, `${JSON.stringify(usage)}\n{broken complete JSON}\n${JSON.stringify(context)}\n{torn`);
        const reopened = await ObservationLog.open(path);
        const usageBefore = reopened.count('usage'); const contextBefore = reopened.count('context'); const lastBefore = reopened.observations.at(-1);
        const duplicateAccepted = await reopened.record({ type: 'usage', sourceId: usage.sourceId!, data: usage.data });
        const contextAccepted = await reopened.record({ type: 'context', data: { tokens: 0, window: null, threshold: null } });
        const again = await ObservationLog.open(path); restoredRows = [...again.observations];
        restore = { usageBefore, contextBefore, lastBefore, duplicateAccepted, contextAccepted, usageAfter: again.count('usage'), contextAfter: again.count('context') };
      }
    }
    await recorder.drain();
    if (kind === 'duration' || kind === 'milestone') laterRows = [...observations.observations]; else rows = [...observations.observations];
    if (kind === 'restoration') restoredRows = [...(await ObservationLog.open(path)).observations];
    return { path, root: directory.path, rows, laterRows, restoredRows, returnedBytes, usage: recorder.usage, restore, cleanup: directory.remove };
  } catch (error) { await directory.remove(); throw error; }
}
