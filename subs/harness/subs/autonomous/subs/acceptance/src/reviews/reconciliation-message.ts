import { reconciliationFactsMessage, type ReconciliationFactsContent } from '../../../../../reviews/src/reconciliation-message.js';

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
    ...(basis.requests.some(request => request.result === 'not-verified') ? { context: 'An advisory review was unavailable. Choose complete with a short rationale in the brief to continue, or correct with a concrete goal to seek relevant verification. No finding or user approval is needed for this choice. Preserve the unavailable result; do not automatically repeat broad review.' } : {}),
    authority: `You may waive a signal whose modules are \`${packet.module}\` or beneath it.`,
    ...(packet.capabilityContext === undefined ? {} : { context: `${basis.requests.some(request => request.result === 'not-verified') ? 'An advisory review was unavailable. Choose continuation in the brief or a correction goal for relevant verification; no finding or user approval is needed. ' : ''}This task coordinates consumer module \`${packet.capabilityContext.consumer}\` and provider module \`${packet.capabilityContext.provider}\`. Read both owners' source and tests before deciding a correction. The module below is the requesting work item's waiver authority, not a limit on task design or assignments.` }),
  });
}
