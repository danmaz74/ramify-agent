import { mkdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { z } from 'zod';
import { openLedger, type Ledger } from '../../ledger/src/ledger.js';
import { acceptedCommandSchema } from '../../../src/interfaces/protocol/jobs.js';
import { checkFindingEventsField } from '../../../src/check-findings/records.js';
import { commitRecord, recoverCommits } from '../../../src/jobs/commit.js';
import { jobsDirectory } from '../../../src/jobs/records.js';
import { writeFileAtomic, writeFileExclusive } from '../../ledger/src/atomic.js';
import { approvalFinalizationSchema } from './approval.js';
import { assistedAssessmentSchema, assistedIterationSchema, assistedJobSchema, type AssistedAssessment, type AssistedEvidenceReference, type AssistedIteration, type AssistedJob } from './contracts.js';

export const assistedEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('assisted-started'), command: acceptedCommandSchema }).strict(),
  z.object({ type: z.literal('iteration-started'), command: acceptedCommandSchema, iteration: assistedIterationSchema }).strict(),
  z.object({ type: z.literal('assessment-requested'), command: acceptedCommandSchema, assessment: assistedAssessmentSchema }).strict(),
  z.object({ type: z.literal('assessment-transition'), assessment: assistedAssessmentSchema, checkFindings: checkFindingEventsField.optional() }).strict(),
  z.object({ type: z.literal('findings-recorded'), assessmentId: z.string(), key: z.string().min(1).optional(), hash: z.string().optional(), checkFindings: checkFindingEventsField }).strict(),
  z.object({ type: z.literal('coordinator-decision-recorded'), assessmentId: z.string(), reviewRationale: z.string().optional(), finalization: approvalFinalizationSchema.nullable().optional(), command: acceptedCommandSchema, checkFindings: checkFindingEventsField }).strict(),
  z.object({ type: z.literal('finding-answer-recorded'), assessmentId: z.string(), command: acceptedCommandSchema, checkFindings: checkFindingEventsField }).strict(),
  z.object({ type: z.literal('protection-accepted'), assessmentId: z.string(), path: z.string(), command: acceptedCommandSchema, checkFindings: checkFindingEventsField, finalization: approvalFinalizationSchema.nullable().optional() }).strict(),
]);
export type AssistedEvent = z.infer<typeof assistedEventSchema>;

export function assistedDirectory(projectRoot: string, planId: string, jobId: string): string {
  return join(jobsDirectory(projectRoot, planId), jobId);
}

export class AssistedStore {
  readonly ledger: Ledger<AssistedEvent>;
  readonly job: AssistedJob;
  readonly directory: string;

  private constructor(directory: string, job: AssistedJob, ledger: Ledger<AssistedEvent>) {
    this.directory = directory;
    this.job = job;
    this.ledger = ledger;
  }

  static async open(projectRoot: string, planId: string, jobId: string): Promise<AssistedStore> {
    const directory = assistedDirectory(projectRoot, planId, jobId);
    const ledger = await openLedger({ logPath: join(directory, 'events.jsonl'), recordsRoot: directory, eventSchema: assistedEventSchema });
    if (ledger.replay()[0]?.transaction.event.type !== 'assisted-started') throw new Error('Assisted job has no committed start');
    await recoverCommits(ledger);
    const job = assistedJobSchema.parse(JSON.parse(await readFile(join(directory, 'job.json'), 'utf8')));
    if (job.planId !== planId || job.jobId !== jobId || job.projectRoot !== projectRoot) throw new Error('Assisted job identity differs from its directory or project');
    return new AssistedStore(directory, job, ledger);
  }

  static async create(projectRoot: string, job: AssistedJob, planMarkdown: string, command: z.infer<typeof acceptedCommandSchema>): Promise<AssistedStore> {
    const directory = assistedDirectory(projectRoot, job.planId, job.jobId);
    const { mkdir } = await import('node:fs/promises');
    const { writeFileExclusive } = await import('../../ledger/src/atomic.js');
    await mkdir(join(directory, 'input'), { recursive: true });
    await writeFileExclusive(join(directory, job.plan.storedAt), planMarkdown);
    const ledger = await openLedger({ logPath: join(directory, 'events.jsonl'), recordsRoot: directory, eventSchema: assistedEventSchema });
    await commitRecord(ledger, { event: { type: 'assisted-started', command }, records: [{ path: 'job.json', id: job.jobId, revision: 1, body: job }] });
    return new AssistedStore(directory, job, ledger);
  }

  assessments(): AssistedAssessment[] {
    const latest = new Map<string, AssistedAssessment>();
    for (const line of this.ledger.replay()) {
      const event = line.transaction.event;
      if (event.type === 'assessment-requested' || event.type === 'assessment-transition') latest.set(event.assessment.id, event.assessment);
    }
    return [...latest.values()];
  }

  assessment(id: string): AssistedAssessment | undefined { return this.assessments().find(item => item.id === id); }

  iterations(): AssistedIteration[] {
    return this.ledger.replay().flatMap(line => line.transaction.event.type === 'iteration-started' ? [line.transaction.event.iteration] : []);
  }

  async startIteration(event: Extract<AssistedEvent, { type: 'iteration-started' }>): Promise<void> {
    await commitRecord(this.ledger, { event, records: [{ path: `iterations/${event.iteration.id}.json`, id: event.iteration.id, revision: 1, body: event.iteration }] });
  }

  async record(event: AssistedEvent, assessment?: AssistedAssessment): Promise<void> {
    if (assessment) {
      await commitRecord(this.ledger, { event, records: [
        { path: `assessments/${assessment.id}/rev-${String(assessment.revision).padStart(4, '0')}.json`, id: assessment.id, revision: assessment.revision, body: assessment },
        ...assessment.stages.map(stage => ({ path: `assessments/${assessment.id}/stages/${stage.name}.json`, id: `${assessment.id}:${stage.name}`,
          revision: assessment.revision, body: stage.evidence })),
      ] });
    } else await this.ledger.append({ event, records: [] });
  }

  async capturedPlan(): Promise<string> {
    const markdown = await readFile(join(this.directory, this.job.plan.storedAt), 'utf8');
    const { createHash } = await import('node:crypto');
    if (createHash('sha256').update(markdown).digest('hex') !== this.job.plan.sha256) throw new Error('Captured plan differs from the registered content identity');
    return markdown;
  }

  async retainEvidence(evidence: unknown): Promise<AssistedEvidenceReference> {
    const content = JSON.stringify(evidence);
    if (content === undefined) throw new TypeError('Assisted evidence has no JSON representation');
    const bytes = new TextEncoder().encode(content);
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    const reference = { path: `evidence/${sha256}.json`, sha256 };
    await mkdir(join(this.directory, 'evidence'), { recursive: true });
    const path = join(this.directory, reference.path);
    await writeFileExclusive(path, bytes);
    // Re-derived bytes with this identity also repair a missing or corrupted artifact.
    if (!Buffer.from(await readFile(path)).equals(Buffer.from(bytes))) await writeFileAtomic(path, bytes);
    await this.readEvidence(reference);
    return reference;
  }

  async readEvidence(reference: AssistedEvidenceReference): Promise<unknown> {
    if (!/^[a-f0-9]{64}$/u.test(reference.sha256) || reference.path !== `evidence/${reference.sha256}.json`) throw new Error('Invalid assisted evidence reference');
    const bytes = await readFile(join(this.directory, reference.path));
    if (createHash('sha256').update(bytes).digest('hex') !== reference.sha256) throw new Error('Retained assisted evidence differs from its content identity');
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)) as unknown;
  }
}
