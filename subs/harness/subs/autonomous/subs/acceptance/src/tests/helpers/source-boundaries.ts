import { Acceptance, type AcceptanceInput, type AcceptancePorts } from '../../acceptance.js';
import { CommittingGates } from '../../committing-gate.js';
import { gateFixturePorts } from './gate-ports.js';
import type { CandidateSource, GitService } from '../../../../../../evidence/src/git.js';
import type { RamifyCli } from '../../../../../../evidence/src/ramify-cli.js';
import type { OwnershipAnswer } from '../../../../../../evidence/src/ownership-evidence.js';
import type { Candidate } from '../../../../../../nonfunctional/src/interfaces/contracts.js';
import type { RenderedFeatureFile } from '../../../../../../scenarios/src/rendering.js';
import type { SnapshotComparison } from '../../../../../../reviews/src/snapshot.js';

export interface ProducerBoundary {
  verifyProducerCommit(files: readonly RenderedFeatureFile[], commit: string): Promise<void>;
  renderProducerFeatures(files: readonly RenderedFeatureFile[]): Promise<void>;
  renderedFeatureAllowed(path: string, hash: string, answer: OwnershipAnswer): Promise<boolean>;
}

/** The real source-verification operations; no lifecycle service or unused write authority. */
export function producerBoundary(input: { readonly projectRoot: string; readonly git: GitService; readonly candidates: CandidateSource; readonly ramify: RamifyCli }): ProducerBoundary {
  const gates = new CommittingGates(gateFixturePorts(undefined, { projectRoot: input.projectRoot, ramify: input.ramify }));
  const acceptance = new Acceptance({ ...input, gates } as unknown as AcceptanceInput, {} as AcceptancePorts);
  return { verifyProducerCommit: (files, commit) => acceptance.verifyProducerCommit(files, commit),
    renderProducerFeatures: files => acceptance.renderProducerFeatures(files),
    renderedFeatureAllowed: (path, hash, answer) => gates.renderedFeatureAllowed(path, hash, answer) };
}

export interface NonfunctionalSourceBoundary {
  nonfunctionalSourceInputs(candidate: Candidate): Promise<{ readonly sections: readonly { readonly key: string; readonly text: string }[]; readonly comparisons: readonly SnapshotComparison[] }>;
}

/** Historical-source probes bind only their retained boundaries and candidate reader. */
export function nonfunctionalSourceBoundary(projectRoot: string, candidates: CandidateSource, record: unknown, base: string, runStart: string | undefined): NonfunctionalSourceBoundary {
  const acceptance = new Acceptance({ projectRoot, directory: projectRoot, candidates, record } as AcceptanceInput, {
    coordination: { accepted: () => base }, recordedRunBase: () => runStart,
    observe: () => ({ history: { lines: [], events: [] } }),
  } as unknown as AcceptancePorts);
  return { nonfunctionalSourceInputs: candidate => acceptance['nonfunctionalSourceInputs'](candidate) };
}
