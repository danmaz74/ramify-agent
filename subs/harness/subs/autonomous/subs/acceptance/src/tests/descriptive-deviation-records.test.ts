import { expect, test } from 'vitest';
import {
  descriptiveUnresolvedRequestId, deviationLayout, environmentProblemSchema,
  unresolvedRequestSchema,
} from '../deviations/records.js';
import { environmentCommands } from '../deviations/environment.js';
import { emptyCheckFindingState } from '../../../../../check-findings/src/replay.js';
import { unsupportedCommittedVersion } from '../../../../src/run/committed-history.js';

test('descriptive unresolved and environment records retain explicit versions and reversible paths', () => {
  const request = descriptiveUnresolvedRequestId('work-item:preview-revision', 2);
  expect(request).toBe('unresolved-request:preview-revision-architect-conflict-2');
  expect(deviationLayout.request(request)).toBe('requests/unresolved-request%3Apreview-revision-architect-conflict-2.json');
  expect(decodeURIComponent(deviationLayout.request(request).slice('requests/'.length, -'.json'.length))).toBe(request);
  expect(unresolvedRequestSchema.parse({ schema: 'ramify-agent.unresolved-request/2', id: request,
    workItem: 'work-item:preview-revision', requester: 'root', invocation: 'invoke-2', conflict: 'A dependency is missing', evidence: [],
  }).id).toBe(request);
  expect(unresolvedRequestSchema.safeParse({ schema: 'ramify-agent.unresolved-request/2', id: 'ur-002',
    workItem: 'work-item:preview-revision', requester: 'root', invocation: 'invoke-2', conflict: 'A dependency is missing', evidence: [],
  }).success).toBe(false);
  expect(unresolvedRequestSchema.safeParse({ schema: 'ramify-agent.unresolved-request/1', id: 'ur-002',
    workItem: 'wi-001', requester: 'root', invocation: 'invoke-2', conflict: 'A dependency is missing', evidence: [],
  }).success).toBe(true);

  const problem = { schema: 'ramify-agent.environment-problem/2', id: 'environment-problem:missing-provider-tool', request,
    workItem: 'work-item:preview-revision', invocation: 'invoke-3', diagnosis: 'The provider executable is missing',
    suggestion: 'Install the provider', findingKey: 'draft:finding:missing-provider-tool', checkFinding: 'finding:missing-provider-tool' };
  expect(environmentProblemSchema.safeParse(problem).success).toBe(true);
  expect(environmentProblemSchema.safeParse({ ...problem, findingKey: 'finding:missing-provider-tool' }).success).toBe(false);
  expect(deviationLayout.environment(problem.id)).toBe('environment/environment-problem%3Amissing-provider-tool.json');
  const commands = environmentCommands(emptyCheckFindingState(), environmentProblemSchema.parse(problem),
    { conflict: 'The provider is unavailable' }, 'root');
  expect(commands[0]).toMatchObject({ type: 'report', report: { findingKey: 'draft:finding:missing-provider-tool' } });
  expect(commands[1]).toMatchObject({ type: 'dispose', checkFinding: 'finding:missing-provider-tool' });
  for (const kind of ['unresolved-request', 'plan-deviation', 'environment-problem']) {
    expect(unsupportedCommittedVersion(`ramify-agent.${kind}/2`)).toBeNull();
  }
});
