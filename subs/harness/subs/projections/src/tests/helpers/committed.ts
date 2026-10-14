import { runRecordSchema } from '../../../../../src/run/records.js';
import { runEventSchema } from '../../../../../src/run/log.js';
import type { CommittedRun } from '../../inputs.js';
import type { RunSource } from '../../queries.js';

const at = '2026-10-13T00:00:00.000Z';
const hash = 'a'.repeat(64);
const context = { compaction: 'forbidden', budgetTokens: null, budgetFraction: null, reportReserveTokens: 0 };
const command = { argv: ['never-execute'], cwd: '.', env: [], envAdditions: {}, timeoutMs: 1 };
export function committedRun(directory: string): CommittedRun {
  const record = runRecordSchema.parse({
    schema: 'ramify-agent.job/3', jobId: '20261013T000000Z-c0ffee', planId: 'reader-test',
    kind: 'implementation', agent: 'scripted', createdAt: at,
    manifest: { planHash: hash, documentManifest: { path: 'input/documents.json', hash }, source: null,
      versions: { architectPrompt: null, procedure: null, skill: null, ramify: null }, architectView: { status: 'placeholder' } },
    prompts: {}, policy: { version: 'run-policy/8', contract: 'plan21-whole-owner-and-architect-reporting/1',
      limits: { repairRoundsPerIteration: 1, repairRoundsPerWorkItemGate: 1, infrastructureRetriesPerGate: 1,
        forkRetriesPerRequest: 1, budgetReturnsPerIteration: 1, sessionReconstructionsPerWork: 1,
        cycleReplansPerWorkItem: 1, rejectedSubmissionsPerTurn: 1, rejectedToolInputsPerTurn: 1,
        readinessRecoveries: 1, stopSettleMs: 1, writerSettleMs: 1, invocationIdleMs: 1,
        invocationAbsoluteMs: 1, maxIterationsPerWorkItem: 1, maxWorkItems: 1, maxPlacementRequests: 1,
        maxInvocationsPerRun: 1, runAbsoluteMs: 1 },
      context: { 'initial-architect': context, 'global-fork': context, 'local-architect': context, engineer: context },
      transcript: { inlineBodyBytes: 32 }, commands: { typeCheck: command, ramifyCheck: command, ramifyChanged: command, hookTimeoutMs: 1 } },
    projectConfig: { path: 'ramify-agent.json', hash: null, invalid: 'Scripted reading witness' },
    baseline: { unavailable: 'No acquired baseline' }, planScenarios: { scenarios: [], limitations: [] }, reviewStop: false,
  });
  const event = runEventSchema.parse({ sequence: 1, jobId: record.jobId, at, type: 'restart-branch-ready', data: { branch: 'candidate', head: 'head', tree: 'tree' } });
  return { record, directory, entries: [{ sequence: 1, at, transaction: { event, records: [] } }] };
}

/** Scripted committed reading inputs, with no writable collaborator. */
export class FakeCommittedSource implements RunSource {
  readonly agentName = undefined;
  constructor(readonly projectRoot: string, public run: CommittedRun) {}
  committed(planId: string, runId: string) { return planId === this.run.record.planId && runId === this.run.record.jobId ? this.run : undefined; }
  committedRuns(planId: string) { return planId === this.run.record.planId ? [this.run] : []; }
  runVersions() { return [{ planId: this.run.record.planId, runId: this.run.record.jobId, version: this.run.entries.at(-1)?.sequence ?? 0 }]; }
}
