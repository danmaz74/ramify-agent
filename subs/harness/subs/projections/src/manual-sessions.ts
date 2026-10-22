import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { jobIdSchema } from '../../../src/interfaces/protocol/ids.js';
import { jobSchemaVersion, jobsDirectory } from '../../../src/jobs/records.js';
import { runEventSchema, type RunEvent } from '../../autonomous/src/run/log.js';
import { runLayout } from '../../autonomous/src/run/records.js';
import { readJsonLines } from '../../ledger/src/jsonl.js';
import { invocationOutcomeSchema, invocationSchema, type Invocation, type InvocationOutcome } from '../../task-execution/src/records.js';
import { manualRunRecordSchema, type ManualRunRecord } from '../../task-workflow/src/steps/records.js';
import { ProjectionError } from './inputs.js';

/** A current manual run's committed session input; reading it never opens a writer. */
export interface ManualSessionRun {
  readonly record: ManualRunRecord;
  readonly directory: string;
  readonly events: readonly RunEvent[];
  readonly records: {
    readonly invocations: ReadonlyMap<string, Invocation>;
    readonly outcomes: ReadonlyMap<string, InvocationOutcome>;
  };
}

/** Only current manual runs under the sessions plan are session sources. */
export async function manualSessionIds(root: string): Promise<readonly string[]> {
  const directory = jobsDirectory(root, 'sessions');
  try {
    return (await readdir(directory, { withFileTypes: true }))
      .filter(entry => entry.isDirectory() && jobIdSchema.safeParse(entry.name).success)
      .map(entry => entry.name).sort();
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}

export async function manualSessionRun(root: string, runId: string): Promise<ManualSessionRun | null> {
  if (!jobIdSchema.safeParse(runId).success) return null;
  const directory = join(jobsDirectory(root, 'sessions'), runId);
  const recordPath = join(directory, runLayout.record);
  let text: string;
  try { text = await readFile(recordPath, 'utf8'); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null; throw error; }
  let body: unknown;
  try { body = JSON.parse(text) as unknown; }
  catch { throw new ProjectionError('unreadable', `Manual run ${runId} has an unreadable record`, [recordPath]); }
  if (body === null || typeof body !== 'object' || (body as { kind?: unknown }).kind !== 'manual') return null;
  if (typeof (body as { schema?: unknown }).schema === 'string' && (body as { schema?: unknown }).schema !== jobSchemaVersion) {
    throw new ProjectionError('unsupported-version', `Manual run ${runId} declares an unsupported record version`, [recordPath]);
  }
  const parsed = manualRunRecordSchema.safeParse(body);
  if (!parsed.success || parsed.data.jobId !== runId || parsed.data.planId !== 'sessions' || parsed.data.projectRoot !== root) {
    throw new ProjectionError('unreadable', `Manual run ${runId} has an invalid record`, [recordPath]);
  }
  const eventsPath = join(directory, runLayout.events);
  let lines: readonly unknown[];
  try { lines = (await readJsonLines(eventsPath)).records; }
  catch { throw new ProjectionError('unreadable', `Manual run ${runId} has an unreadable event log`, [eventsPath]); }
  const events: RunEvent[] = [];
  const invocations = new Map<string, Invocation>();
  const outcomes = new Map<string, InvocationOutcome>();
  for (const [index, line] of lines.entries()) {
    const transaction = line as { event?: unknown; records?: unknown };
    const event = runEventSchema.safeParse(transaction?.event);
    if (!event.success || event.data.jobId !== runId || event.data.sequence !== index + 1 || !Array.isArray(transaction.records)) {
      throw new ProjectionError('unreadable', `Manual run ${runId} has an invalid event`, [eventsPath, `line ${index + 1}`]);
    }
    events.push(event.data);
    for (const record of transaction.records) {
      if (record === null || typeof record !== 'object') continue;
      const item = record as { path?: unknown; body?: unknown };
      if (typeof item.path !== 'string') continue;
      if (/^invocations\/[^/]+\/invocation\.json$/.test(item.path)) {
        const parsed = invocationSchema.safeParse(item.body);
        if (!parsed.success) throw new ProjectionError('unreadable', `Manual run ${runId} has an invalid invocation`, [join(directory, item.path)]);
        invocations.set(parsed.data.id, parsed.data);
      } else if (/^invocations\/[^/]+\/outcome\.json$/.test(item.path)) {
        const parsed = invocationOutcomeSchema.safeParse(item.body);
        if (!parsed.success) throw new ProjectionError('unreadable', `Manual run ${runId} has an invalid invocation outcome`, [join(directory, item.path)]);
        outcomes.set(parsed.data.invocation, parsed.data);
      }
    }
  }
  return { record: parsed.data, directory, events, records: { invocations, outcomes } };
}
