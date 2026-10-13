import type { RunSource } from '../projections/queries.js';

/** The HTTP readers receive reading ports, never the service's writable surface. */
export function createQuerySource(source: RunSource): RunSource {
  return Object.freeze({
    get projectRoot() { return source.projectRoot; },
    get agentName() { return source.agentName; },
    committed: (planId: string, runId: string) => source.committed(planId, runId),
    committedRuns: (planId: string) => source.committedRuns(planId),
    runVersions: () => source.runVersions(),
    get candidateSource() { return source.candidateSource; },
    get changeHistory() { return source.changeHistory; },
  });
}
