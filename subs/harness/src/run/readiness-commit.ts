import { join } from 'node:path';
import { z } from 'zod';
import type { GateHost, GateRun, CommittingGates } from './committing-gate.js';
import { commitForGate } from './gates.js';
import { authenticatedExternalRepairs } from './recovery-gate.js';

const text = z.string().min(1);
export const readinessRepairOperationSchema = z.object({ schema: z.literal('ramify-agent.readiness-repair-operation/1'),
  id: text, occurrenceId: text, revision: z.int().positive(), head: text, tree: text, message: text,
}).strict();
export type ReadinessRepairOperation = z.infer<typeof readinessRepairOperationSchema>;
export const readinessRepairOperationPath = (id: string): string => join('readiness', 'repairs', id, 'operation.json');
const resultPath = (id: string): string => join('readiness', 'repairs', id, 'result.json');
export const readinessRepairResultSchema = z.object({ schema: z.literal('ramify-agent.readiness-repair-result/1'), id: text, commit: text, tree: text,
  acknowledgement: z.object({ reconciled: z.boolean(), diagnostic: z.string().nullable() }).strict(),
}).strict();

/** A dirty operator repair before readiness gets its own settled, authenticated commit effect. */
export async function commitReadinessRepair<R extends GateRun>(run: R, host: GateHost<R>, gates: CommittingGates<R>, operation: ReadinessRepairOperation): Promise<string> {
  operation = readinessRepairOperationSchema.parse(operation);
  const authenticate = () => {
    const repair = authenticatedExternalRepairs(run.log.ledger.replay()).find(repair => repair.admission.after.candidate.tree === operation.tree
      && run.log.ledger.replay().some(entry => entry.sequence === repair.sequence && entry.transaction.event.type === 'operation-recovery-resumed'
        && entry.transaction.event.data.occurrenceId === operation.occurrenceId && entry.transaction.event.data.revision === operation.revision));
    if (!repair) throw new Error('Readiness repair commit has no matching authenticated operator admission');
    return repair;
  };
  authenticate();
  const completed = run.log.all('readiness-repair-committed').find(event => event.data.id === operation.id);
  if (completed) {
    if (completed.data.tree !== operation.tree || completed.data.occurrenceId !== operation.occurrenceId || completed.data.revision !== operation.revision) throw new Error('Readiness repair commit changed its candidate identity');
    const body = run.log.ledger.replay().find(entry => entry.sequence === completed.sequence)?.transaction.records.find(record => record.path === resultPath(operation.id));
    const result = readinessRepairResultSchema.parse(body?.body);
    if (result.id !== operation.id || result.commit !== completed.data.commit || result.tree !== operation.tree) throw new Error('Readiness repair completion does not match its committed result');
    if (await host.candidates.commitTree(host.projectRoot, completed.data.commit) !== operation.tree) throw new Error('Retained readiness repair commit no longer names its admitted candidate');
    return completed.data.commit;
  }
  const reconciling = run.log.ledger.pendingEffects().some(pending => pending.key === `readiness-repair:${operation.id}`);
  const effect = run.log.ledger.effect<{ commit: string; diagnostic: string | null }>({
    key: `readiness-repair:${operation.id}`, serialize: work => run.mutex.run(work),
    intent: () => ({ event: run.log.next({ type: 'readiness-repair-committing', data: { id: operation.id, occurrenceId: operation.occurrenceId, revision: operation.revision, tree: operation.tree } }),
      records: [{ path: readinessRepairOperationPath(operation.id), id: operation.id, revision: 1, body: operation }] }),
    perform: async () => {
      run.writer.requireSettled('Readiness repair commit requires confirmed writer settlement');
      let commit: string | null;
      let diagnostic: string | null = null;
      const identity = [{ key: 'Ramify-Run', value: run.jobId }, { key: 'Ramify-Gate', value: operation.id }];
      try {
        commit = await commitForGate(host.projectRoot, run.jobId, operation.id, operation.message, undefined, host.git, async () => {
          authenticate();
          const current = await host.previewCandidateTree();
          if (current.tree !== operation.tree) throw new Error('Readiness candidate changed after operator admission');
          const authority = await gates.candidateAuthority(run, { checkpoint: 'readiness', subject: {} });
          if (authority.authorityUnavailable || authority.rules.some(rule => rule.outcome !== 'passed')) throw new Error(`Readiness repair authority is unavailable: ${authority.authorityUnavailable ?? authority.rules.flatMap(rule => rule.violations.map(violation => `${violation.path}: ${violation.detail}`)).join('; ')}`);
          await host.git.createRunBranch(host.projectRoot, run.jobId);
          if ((await host.previewCandidateTree()).tree !== operation.tree) throw new Error('Run branch creation changed the admitted readiness candidate');
        });
      } catch (error) {
        diagnostic = error instanceof Error ? error.message : String(error);
        // An acknowledged error may follow a successful commit. Look it up;
        // an absent acknowledgement never authorizes blindly replaying it.
        const found = await host.git.findCommitByTrailers(host.projectRoot, identity);
        if (found === null) throw error;
        commit = found;
      }
      const source = commit ?? await host.git.currentHead(host.projectRoot);
      if (await host.candidates.commitTree(host.projectRoot, source) !== operation.tree) throw new Error('Readiness repair commit does not name the admitted candidate tree');
      return { commit: source, diagnostic };
    },
    complete: ({ commit, diagnostic }) => ({ event: run.log.next({ type: 'readiness-repair-committed', data: { id: operation.id, occurrenceId: operation.occurrenceId, revision: operation.revision, tree: operation.tree, commit } }),
      records: [{ path: resultPath(operation.id), id: operation.id, revision: 1, body: readinessRepairResultSchema.parse({ schema: 'ramify-agent.readiness-repair-result/1', id: operation.id, commit, tree: operation.tree,
        acknowledgement: { reconciled: reconciling || diagnostic !== null, diagnostic } }) }] }),
  });
  run.gating = effect;
  try { return (await effect).commit; } finally { if (run.gating === effect) run.gating = undefined; }
}
