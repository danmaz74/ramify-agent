import type { DecisionBody, ForkSubmission, LocalDecisionBody, PlacementRequestBody, RegistryChange } from '../../architecture/submission.js';
import type { LocalArchitectSubmissionInput } from '../../work/submission.js';

/*
 * The submissions of the placement chain, as a test writes them. Nothing
 * here simulates a transition: each one goes through the same judge, the
 * same schema and the same rules an agent's would.
 */

/** One decision body, with the smallest honest evidence. */
export function decision(extra: Partial<DecisionBody> = {}): DecisionBody {
  return {
    question: 'Where does this behavior belong?',
    outcome: 'reuse',
    capability: 'capability:send-email',
    changesExistingSymbols: false,
    owner: 'shop/orders',
    rationale: 'The behavior the request needs is what this module already owns.',
    constraints: [],
    uncertainties: [],
    evidence: { citations: [], gaps: [] },
    ...extra,
  };
}

/** One registry entry as a decision states it. */
export function registryChange(extra: Partial<RegistryChange> & Pick<RegistryChange, 'capability' | 'owner'>): RegistryChange {
  return {
    behavior: `The module provides ${extra.capability}.`,
    consumers: [],
    ...extra,
  };
}

/** A fork's decision submission, with its brief. */
export function forkDecision(extra: Partial<Extract<ForkSubmission, { kind: 'decision' }>> = {}): ForkSubmission {
  return {
    kind: 'decision',
    decision: decision(),
    registry: [],
    hypothesisRevisions: [],
    brief: 'The capability stays where the registry already places it.',
    ...extra,
  };
}

/** A fork that could not decide. It is never appended and is never a decision. */
export function forkPartial(findings: readonly string[] = ['two modules could own it'], gaps: readonly string[] = ['no dependency facts']): ForkSubmission {
  return { kind: 'partial', findings: [...findings], gaps: [...gaps] };
}

/** The request body a module architect submits. */
export function placementRequest(extra: Partial<PlacementRequestBody> = {}): PlacementRequestBody {
  return {
    requestKey: 'draft:placement-request:send-email',
    forCapability: 'capability:send-email',
    question: 'Where does sending an email belong?',
    requiredBehavior: 'One message per completed order, with the order reference in it.',
    findings: [],
    candidates: [],
    unresolved: [],
    hypotheses: [],
    localDecisions: [],
    ...extra,
  };
}

/** A module architect asking the plan architect where a capability belongs. */
export function requestPlacement(extra: Partial<PlacementRequestBody> = {}): LocalArchitectSubmissionInput {
  return { kind: 'request-placement', request: placementRequest(extra) };
}

/** One placement a module architect decided within its own authority. */
export function localDecision(body: Partial<DecisionBody>, registry: readonly RegistryChange[] = []): LocalDecisionBody {
  return { decisionKey: 'draft:placement-decision:send-email', decision: decision(body), registry: [...registry] };
}

/** A module architect reporting that its request cannot be met as stated. */
export function unresolved(
  conflict = 'The comparison cannot be served as an MCP tool: the project has no MCP surface to serve it from.',
  evidence: readonly string[] = ['plans/revision-diff/plan.md, lines 11–12, ask for an MCP tool `catalog.compare`.'],
): LocalArchitectSubmissionInput {
  return { kind: 'unresolved', requestKey: 'draft:unresolved-request:missing-mcp', conflict, evidence: [...evidence] };
}

/** The plan architect's answer to an unresolved request: a plan deviation, keeping what the conflict allows. */
export function forkDeviation(extra: Partial<Extract<ForkSubmission, { kind: 'deviation' }>['deviation']> = {}): ForkSubmission {
  return {
    kind: 'deviation',
    deviation: {
      deviationKey: 'draft:plan-deviation:mcp-query', findingKey: 'draft:finding:mcp-query',
      amends: ['functional-requirement:compare-revisions-request'],
      instead: 'Serve the comparison through the tRPC query `catalog.compare` only; the MCP tool is not built.',
      why: 'No module of the project serves MCP, and adding a protocol surface is beyond this plan.',
      rejected: [{ alternative: 'Create an MCP module under the workspace', reason: 'It would be a new protocol surface no requirement of the plan describes.' }],
      loss: 'An MCP client cannot compare revisions.',
      workItems: [],
      scenarios: [],
      ...extra,
    },
  };
}

/** The plan architect finding that no deviation leaves anything of the plan worth doing. */
export function forkNothingPossible(reason = 'Every requirement of the plan rests on the missing surface.'): ForkSubmission {
  return { kind: 'nothing-possible', reason, evidence: ['plans/revision-diff/plan.md, lines 9–14'] };
}

/** The plan architect's answer that the conflict lies in how the gate runs: an environment problem for the operator. */
export function forkEnvironment(
  diagnosis = 'The work-item gate runs `npm test`, whose tests import `dist/src`; nothing builds `dist` in the gate\'s worktree, so every attempt fails before a test runs.',
  suggestion = 'Declare a build step in `ramify-agent.json` that runs before the gate\'s tests.',
): ForkSubmission {
  return { kind: 'environment', problemKey: 'draft:environment-problem:missing-build',
    findingKey: 'draft:finding:missing-build', diagnosis, suggestion };
}

export { decision as placementDecisionFixture };
