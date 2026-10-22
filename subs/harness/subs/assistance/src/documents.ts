import { createHash } from 'node:crypto';
import type { DocumentManifest } from '../../plan-evidence/src/interfaces/contracts.js';
import { gitCandidateSource, type CandidateSource } from '../../evidence/src/git.js';
import { readVerifiedTextBlobBytes as readCandidateDocument } from '../../evidence/src/git-text.js';
import { planIdSchema } from '../../../src/interfaces/protocol/ids.js';

export { readVerifiedTextBlobBytes as readCandidateDocument } from '../../evidence/src/git-text.js';

export interface AssistanceDocument {
  readonly id: string;
  readonly path: string;
  readonly kind: 'plan' | 'principle';
  readonly sha256: string;
  /** Filename and location alone do not establish adoption. */
  readonly adoption: 'undetermined';
}

export interface AssistanceDocuments {
  readonly storage: 'git-references';
  readonly baselineCommit: string;
  readonly manifest: DocumentManifest;
  readonly documents: readonly AssistanceDocument[];
  readonly gaps: {
    readonly missing: DocumentManifest['missing'];
    readonly unreadablePrinciples: DocumentManifest['principlesScan']['unreadable'];
  };
}

/** Capture the job's plan input as a reference to immutable source. */
export async function captureAssistanceDocuments(input: {
  readonly projectRoot: string;
  readonly planId: string;
  readonly planMarkdown: string;
  readonly baselineCommit: string;
}): Promise<AssistanceDocuments> {
  planIdSchema.parse(input.planId);
  const path = `plans/${input.planId}/plan.md`;
  const sha256 = createHash('sha256').update(input.planMarkdown).digest('hex');
  const document = { id: `document:${input.planId}-plan`, path, kind: 'plan' as const, sha256, bytes: Buffer.byteLength(input.planMarkdown),
    storedAt: 'input/plan.md', revision: { commit: null, dirty: null } };
  return { storage: 'git-references', baselineCommit: input.baselineCommit,
    manifest: { schema: 'ramify-agent.document-manifest/2', root: document.id, documents: [document], missing: [],
      principlesScan: { status: 'empty', unreadable: [] } },
    documents: [{ id: document.id, path, kind: 'plan', sha256, adoption: 'undetermined' }],
    gaps: { missing: [], unreadablePrinciples: [] } };
}

export function requireCurrentAssistanceDocuments(value: unknown): AssistanceDocuments {
  if (typeof value !== 'object' || value === null || !('storage' in value) || value.storage !== 'git-references'
    || !('documents' in value) || !Array.isArray(value.documents)
    || value.documents.some(document => typeof document !== 'object' || document === null || 'text' in document)) {
    throw new Error('Assisted document capture must use storage git-references without inline document text');
  }
  return value as AssistanceDocuments;
}

/** Resolve only a retained document identity; Git bytes must still match the captured manifest. */
export async function readAssistanceDocument(input: {
  readonly projectRoot: string; readonly planMarkdown: string; readonly documents: AssistanceDocuments;
  readonly id: string; readonly candidates?: CandidateSource;
}): Promise<string> {
  const documents = requireCurrentAssistanceDocuments(input.documents);
  const document = documents.documents.find(document => document.id === input.id);
  if (!document) throw new Error('No retained document at that identity');
  const captured = documents.manifest.documents.find(item => item.id === document.id);
  if (!captured || captured.path !== document.path || captured.sha256 !== document.sha256) throw new Error('Retained document identity differs from its manifest');
  let bytes: Uint8Array;
  if (document.id === documents.manifest.root) bytes = new TextEncoder().encode(input.planMarkdown);
  else {
    const source = input.candidates ?? gitCandidateSource;
    const entry = (await source.treeEntries(input.projectRoot, documents.baselineCommit)).find(entry => entry.path === captured.path);
    if (!entry) throw new Error(`Committed document ${captured.path} is unavailable`);
    bytes = await readCandidateDocument(input.projectRoot, documents.baselineCommit, entry, source);
  }
  if (bytes.length !== captured.bytes || createHash('sha256').update(bytes).digest('hex') !== captured.sha256) {
    throw new Error(`Document ${captured.path} differs from its retained content identity`);
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}
