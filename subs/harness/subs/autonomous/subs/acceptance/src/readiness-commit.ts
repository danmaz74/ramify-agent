import { join } from 'node:path';
import { z } from 'zod';
import type { GateHost, CommittingGates } from './committing-gate.js';
import { commitForGate } from './gates.js';

const text = z.string().min(1);
export const readinessRepairOperationSchema = z.object({ schema: z.literal('ramify-agent.readiness-repair-operation/1'),
  id: text, occurrenceId: text.optional(), revision: z.int().positive().optional(), head: text, tree: text, message: text,
}).strict();
export type ReadinessRepairOperation = z.infer<typeof readinessRepairOperationSchema>;
export const readinessRepairOperationPath = (id: string): string => join('readiness', 'repairs', id, 'operation.json');
const resultPath = (id: string): string => join('readiness', 'repairs', id, 'result.json');
export const readinessRepairResultSchema = z.object({ schema: z.literal('ramify-agent.readiness-repair-result/1'), id: text, commit: text, tree: text,
  acknowledgement: z.object({ reconciled: z.boolean(), diagnostic: z.string().nullable() }).strict(),
}).strict();

/** Commit an observed ordinary candidate correction with the same authority and commit reconciliation as other gates. */
export async function commitReadinessRepair(host: GateHost, gates: CommittingGates, operation: ReadinessRepairOperation): Promise<string> {
  operation = readinessRepairOperationSchema.parse(operation);
  const completed = host.observe().history.events.filter(event => event.type === 'readiness-repair-committed').find(event => event.data.id === operation.id);
  if (completed) {
    if (completed.data.tree !== operation.tree || operation.occurrenceId !== undefined && completed.data.occurrenceId !== operation.occurrenceId || operation.revision !== undefined && completed.data.revision !== operation.revision) throw new Error('Readiness repair commit changed its candidate identity');
    const body = host.observe().history.lines.find(entry => entry.sequence === completed.sequence)?.transaction.records.find(record => record.path === resultPath(operation.id));
    const result = readinessRepairResultSchema.parse(body?.body);
    if (result.id !== operation.id || result.commit !== completed.data.commit || result.tree !== operation.tree) throw new Error('Readiness repair completion does not match its committed result');
    if (await host.candidates.commitTree(host.projectRoot, completed.data.commit) !== operation.tree) throw new Error('Retained readiness repair commit no longer names its recorded candidate');
    return completed.data.commit;
  }
  const reconciling = host.observe().pendingEffects.includes(`readiness-repair:${operation.id}`);
  const effect = host.effect<{ commit: string; diagnostic: string | null }>({
    trackGate: true, key: `readiness-repair:${operation.id}`,
    intent: () => ({ event: { type: 'readiness-repair-committing', data: { id: operation.id, ...(operation.occurrenceId === undefined ? {} : { occurrenceId: operation.occurrenceId }), ...(operation.revision === undefined ? {} : { revision: operation.revision }), tree: operation.tree } },
      records: [{ path: readinessRepairOperationPath(operation.id), id: operation.id, revision: 1, body: operation }] }),
    perform: async () => {
      host.requireSettled('Readiness repair commit requires confirmed writer settlement');
      let commit: string | null;
      let diagnostic: string | null = null;
      const identity = [{ key: 'Ramify-Run', value: host.identity.jobId }, { key: 'Ramify-Gate', value: operation.id }];
      try {
        commit = await commitForGate(host.projectRoot, host.identity.jobId, operation.id, operation.message, undefined, host.git, async () => {
          const current = await host.previewCandidateTree();
          if (current.tree !== operation.tree) throw new Error('Readiness candidate changed after it was captured');
          const authority = await gates.candidateAuthority( { checkpoint: 'readiness', subject: {} });
          if (authority.authorityUnavailable || authority.rules.some(rule => rule.outcome !== 'passed')) throw new Error(`Readiness repair authority is unavailable: ${authority.authorityUnavailable ?? authority.rules.flatMap(rule => rule.violations.map(violation => `${violation.path}: ${violation.detail}`)).join('; ')}`);
          await host.git.createRunBranch(host.projectRoot, host.identity.jobId);
          if ((await host.previewCandidateTree()).tree !== operation.tree) throw new Error('Run branch creation changed the recorded readiness candidate');
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
      if (await host.candidates.commitTree(host.projectRoot, source) !== operation.tree) throw new Error('Readiness repair commit does not name the recorded candidate tree');
      return { commit: source, diagnostic };
    },
    complete: ({ commit, diagnostic }) => ({ event: { type: 'readiness-repair-committed', data: { id: operation.id, ...(operation.occurrenceId === undefined ? {} : { occurrenceId: operation.occurrenceId }), ...(operation.revision === undefined ? {} : { revision: operation.revision }), tree: operation.tree, commit } },
      records: [{ path: resultPath(operation.id), id: operation.id, revision: 1, body: readinessRepairResultSchema.parse({ schema: 'ramify-agent.readiness-repair-result/1', id: operation.id, commit, tree: operation.tree,
        acknowledgement: { reconciled: reconciling || diagnostic !== null, diagnostic } }) }] }),
  });
  return (await effect).commit;
}
