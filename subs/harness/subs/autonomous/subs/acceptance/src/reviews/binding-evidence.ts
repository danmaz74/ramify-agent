import { createHash } from 'node:crypto';
import { parseRecordedEngineerSubmission } from '../../../work-coordination/src/work/engineer.js';

/** Committed acceptance supplies identity; exact candidate/rendering bytes supply attribution. */
export function pendingBindingEvidence(input: { readonly path: string; readonly scenario: string; readonly invocation: string;
  readonly submission: string; readonly submissionBytes: Uint8Array; readonly candidateBytes: string; readonly expectedBytes: string | undefined }) {
  if (input.expectedBytes === undefined || input.candidateBytes !== input.expectedBytes
    || createHash('sha256').update(input.submissionBytes).digest('hex') !== input.submission) return null;
  let raw: unknown;
  try { raw = JSON.parse(new TextDecoder().decode(input.submissionBytes)); } catch { return null; }
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null;
  let proposal;
  try { proposal = parseRecordedEngineerSubmission(raw); } catch { return null; }
  if (proposal.kind !== 'completion-proposed' || !proposal.bindings.some(binding => binding.id === input.scenario)) return null;
  return { path: input.path, scenario: input.scenario, invocation: input.invocation, submission: input.submission,
    sha256: createHash('sha256').update(input.candidateBytes).digest('hex') };
}
