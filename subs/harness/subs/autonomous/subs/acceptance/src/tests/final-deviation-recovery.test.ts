import { afterEach, expect, test } from 'vitest';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createScriptedAgent } from '../../../../../agent/src/scripted.js';
import type { ConfiguredAuditPort } from '../../../../../audit/src/check-execution.js';
import { copyFixture } from '../../../../../../src/tests/helpers/fixture.js';
import { fixtureScratchGit, mockGit } from '../../../../../../src/tests/helpers/mock-git.js';
import { scriptedCandidates } from './helpers/candidates.js';
import { declaringScenarios } from '../../../../../../src/tests/helpers/declarations.js';
import { passingAudit } from '../../../../../../src/tests/helpers/direct-check-execution.js';
import { emptyAnalysis, openRuns, runPath, startRun, testPolicy, until } from '../../../../../../src/tests/helpers/runs.js';
import { gateDiagnostics } from '../checks/diagnostics.js';
import { gateAttemptSchema } from '../gate-records.js';
import { runLayout } from '../../../../src/run/records.js';
import { RunQueries } from '../../../../../projections/src/queries.js';
import { createQuerySource } from '../../../../../../src/http/query-source.js';

const cleanup: Array<() => Promise<void>> = [];
afterEach(async () => { for (const close of cleanup.splice(0).reverse()) await close(); });

test.each(['target', 'configuration'] as const)('a final %s repair retains earlier exhausted deviations and records its new assessment separately', async area => {
  const copy = await copyFixture(); cleanup.push(copy.remove);
  const obligation = 'The service must answer within 50 milliseconds.';
  await writeFile(join(copy.root, 'plans/review-notes/plan.md'), `# Review notes\n\n${obligation}\n`);
  const tree = 'a'.repeat(40);
  const repairedTree = 'b'.repeat(40); let changed = false, head = 'base';
  const path = area === 'configuration' ? 'ramify-audit.json' : 'src/operator-repair.ts';
  const repairedBytes = area === 'configuration' ? 'corrected executable lookup' : 'export const corrected = true;\n';
  const originalFiles = area === 'configuration' ? { [path]: 'original executable lookup' } : {};
  if (area === 'configuration') await writeFile(join(copy.root, path), originalFiles[path]!);
  const git = fixtureScratchGit(mockGit({ currentHead: async () => head, isCleanRepository: async () => true,
    createRunBranch: async () => ({ branch: 'ramify-agent-run/fixture', created: true }), changedPaths: async () => changed ? [path] : [], changedEntries: async () => [],
    findCommitByTrailers: async () => null, commitAccepted: async () => { if (!changed) return null; head = 'corrected-head'; return head; },
    previewCandidateTree: async () => ({ repositoryRoot: copy.root, head, tree: changed ? repairedTree : tree }),
    recoveryStatus: async () => ({ index: 'index', staged: [], unstaged: changed && head === 'base' && area === 'configuration' ? [path] : [], untracked: changed && head === 'base' && area === 'target' ? [path] : [] }),
  }));
  const sourceCandidates = scriptedCandidates(copy.root, { base: { tree, base: 'base', files: originalFiles, changes: [] }, [tree]: { tree, base: 'base', files: originalFiles, changes: [] },
    [repairedTree]: { tree: repairedTree, base: 'base', files: { [path]: repairedBytes }, changes: [{ status: area === 'configuration' ? 'M' : 'A', path }] },
    'corrected-head': { tree: repairedTree, base: 'base', files: { [path]: repairedBytes }, changes: [{ status: area === 'configuration' ? 'M' : 'A', path }] } });
  const candidates = { ...sourceCandidates, treeEntries: async (root: string, commit: string) => (await sourceCandidates.treeEntries(root, commit)).map(entry => ({ ...entry, objectId: (commit === repairedTree || commit === 'corrected-head' ? 'd' : 'c').repeat(40) })) };
  const agent = createScriptedAgent(declaringScenarios(spec => {
    if (spec.submission.name === 'submit_intake') return [{ kind: 'submit', input: {
      goal: obligation, elements: [{ key: 'latency', kind: 'non-functional', document: 'doc-001', text: obligation, conditions: [], uncertainty: '' }],
      incorporation: { documents: [{ document: 'doc-001', scenarios: true, uncertainty: '' }], missing: [] },
    } }];
    if (spec.role === 'initial-architect') return [{ kind: 'submit', input: emptyAnalysis() }];
    if (spec.submission.name === 'submit_nonfunctional_assessment') return [{ kind: 'submit', input: {
      kind: 'assessment', results: [{ nfr: 'nfr-001', result: 'not-satisfied', inspectedScope: ['subs/workspace'], evidence: ['Observed 87 milliseconds'], uncertainty: 'Load varies' }],
    } }];
    if (spec.submission.name === 'submit_nonfunctional_action') return [{ kind: 'submit', input: {
      kind: 'close', deviations: [{ nfr: 'nfr-001', proposedAlternative: 'Use a cached read', uncertainty: 'Load varies' }],
    } }];
    return [];
  }));
  const audit = passingAudit(); let calls = 0;
  const configuredAudit: ConfiguredAuditPort = { read: async (root, sourceCommit) => {
    const config = await audit.read(root, sourceCommit);
    if (area !== 'configuration') return config;
    const corrected = sourceCommit === repairedTree || sourceCommit === 'corrected-head';
    return { ...config, blob: corrected ? 'corrected-config-blob' : 'original-config-blob', checks: [{ id: 'required-typecheck',
      executor: { kind: 'command', commands: [{ cmd: corrected ? '/installed/bin/npm' : '/missing/bin/npm', args: ['run', 'type-check'] }] } }] };
  }, run: async input => {
    calls += 1;
    if (calls === 2) return { status: 'failed', requestId: `${input.runId}:${input.attemptId}`, mode: input.mode, nested: input.nested ?? false,
      projects: null, discovery: null, requestedSourceCommit: input.sourceCommit, auditedSourceCommit: null, reused: false, reuse: null,
      requestedMode: null, executedMode: null, fallbackReason: null, verdict: null, reportCommit: null, runRef: null, treeRef: null,
      definition: { path: input.configuration.path, blob: input.configuration.blob }, detail: 'Required executable missing',
      provider: { status: 'failed', error: { code: 'ENOENT', message: 'Required executable missing', retryable: false } }, checks: {} };
    // Script the provider's successful checks against the requested definition.
    const answer = await audit.run({ ...input, configuration: await audit.read(input.projectRoot, input.sourceCommit) });
    return { ...answer, definition: { path: input.configuration.path, blob: input.configuration.blob } };
  } };
  const { service } = await openRuns(copy.root, { git, candidates, agent, configuredAudit, policy: root => testPolicy(root, { recovery: true }) });
  cleanup.push(() => service.close());
  const receipt = await service.execute(startRun('review-notes'));
  await until(() => service.events('review-notes', receipt.jobId)!.some(event => event.type === 'operation-recovery-paused') || service.getRun('review-notes', receipt.jobId)?.state === 'failed');
  const inspection = (await service.recoveryInspection('review-notes', receipt.jobId))!;
  expect(inspection, JSON.stringify(service.getRun('review-notes', receipt.jobId)?.failure)).not.toBeNull();
  expect(inspection).toMatchObject({ state: 'paused', canResume: true, boundary: { kind: 'gate' }, evidence: { classification: 'check-execution' } });
  const before = service.events('review-notes', receipt.jobId)!.filter(event => event.type === 'nonfunctional-assessed');
  expect(before).toHaveLength(1); expect(calls).toBe(2);
  await writeFile(join(copy.root, path), repairedBytes); changed = true;
  await service.execute({ commandId: 'environment-correction', expectedVersion: 0, type: 'resume-recovery', payload: {
    planId: 'review-notes', jobId: receipt.jobId } });
  await service.settled('review-notes', receipt.jobId);
  const events = service.events('review-notes', receipt.jobId)!;
  expect(events.at(-1)?.type).toBe('job-completed'); expect(calls).toBe(3);
  expect(events.filter(event => event.type === 'nonfunctional-assessed')).toHaveLength(2);
  expect(events.filter(event => event.type === 'nonfunctional-final-invalidated')).toHaveLength(1);
  expect(events.filter(event => event.type === 'gate-attempted' && event.data.checkpoint === 'final')).toHaveLength(3);
  const refusal = events.find(event => event.type === 'gate-attempted' && event.data.next === 'return-to-local-architect')!;
  if (refusal.type !== 'gate-attempted') throw new Error('Missing applicability boundary');
  const record = gateAttemptSchema.parse(JSON.parse(await readFile(runPath(copy.root, 'review-notes', receipt.jobId, runLayout.gate(refusal.data.gate)), 'utf8')));
  const explanation = (await gateDiagnostics(record, 'local-architect')).summary.join('\n');
  expect(explanation).toContain('candidate');
  expect(events.filter(event => event.type === 'external-candidate-observed')).toHaveLength(1);
  const deviations = events.filter(event => event.type === 'nonfunctional-deviation-recorded');
  expect(deviations).toHaveLength(2);
  expect(new Set(deviations.map(event => event.data.assessment)).size).toBe(2);
  const readiness = await new RunQueries(createQuerySource(service)).mergeReadiness('review-notes', receipt.jobId, service.getRun('review-notes', receipt.jobId)!.version);
  expect(readiness.readiness).toMatchObject({ status: 'pending-review', checkFindings: [deviations[1]!.data.checkFinding] });
  expect(events.at(-1)).toMatchObject({ type: 'job-completed', data: { planDeviations: 1 } });
  const attempted = events.filter(event => event.type === 'gate-attempted').map(event => event.data.gate);
  expect(new Set(attempted).size).toBe(attempted.length);
  expect(git.unexpected).toEqual([]);
});
