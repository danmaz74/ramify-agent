import { reconciliationFactsMessage, type ReconciliationFactsContent } from '../../subs/reviews/src/reconciliation-message.js';

import type { ReconciliationBasis } from './reconciliation.js';

/*
 * The first message of a reconciliation fork: one bounded packet holding
 * everything the assessment needs, whether the fork started from the local
 * architect's completion request or fresh. It names the audited source,
 * the review coverage with its gaps, each CheckFinding of the attention set
 * with its reports and decisions, the work item's other CheckFindings, the
 * goals of its iterations and its earlier rounds. Larger bodies are named
 * by their record path, which the fork can read.
 */

export interface ReconciliationPacket extends ReconciliationFactsContent {
  readonly basis: ReconciliationBasis;
  /** The work item's module, within which this architect may waive. */
  readonly module: string;
  readonly owner?: 'work item' | 'capability task';
  readonly capabilityContext?: { readonly consumer: string; readonly provider: string };

}

export function reconciliationMessage(packet: ReconciliationPacket): string {
  const { basis } = packet;
  return reconciliationFactsMessage({
    ...packet, id: basis.id, owner: packet.owner ?? 'work item', round: basis.round,
    source: basis.source,
    introduction: `# Reconciliation ${basis.id} of ${basis.workItem} — round ${basis.round}\n\nThe ${packet.owner ?? 'work item'} requested completion. Assess the CheckFindings below together, in one submission.`,
    authority: `You may waive a signal whose modules are \`${packet.module}\` or beneath it.`,
    ...(packet.capabilityContext === undefined ? {} : { context: `This task coordinates consumer module \`${packet.capabilityContext.consumer}\` and provider module \`${packet.capabilityContext.provider}\`. Read both owners' source and tests before deciding a correction. The module below is the requesting work item's waiver authority, not a limit on task design or assignments.` }),
  });
}
