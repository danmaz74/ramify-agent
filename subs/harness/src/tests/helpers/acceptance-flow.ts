import { checkFindingStateOf } from '../../check-findings/state.js';
import { acceptanceBoundaries } from './acceptance-boundaries.js';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect } from 'vitest';
import type { Script } from '../../../subs/agent/src/scripted.js';
import { gitService } from '../../../subs/evidence/src/git.js';
import { checkCommand, type Checkpoint } from '../../../subs/autonomous/subs/acceptance/src/checks/records.js';
import type { ConfiguredAuditInput } from '../../../subs/audit/src/check-execution.js';
import { localCommandAudit, mappedAudit } from './direct-check-execution.js';
import { requestCompletion } from './analysis.js';
import { copyCapabilityFixture, openCapabilityRuns } from '../../../subs/autonomous/subs/work-coordination/src/tests/helpers/capability.js';
import { assign, edit, outline, submit, treeInputs, write } from './iterations.js';
import { rootDescription } from './root-description.js';
import { runLayout } from '../../../subs/autonomous/src/run/records.js';
import { testReviewPolicy } from '../../../subs/autonomous/subs/acceptance/src/tests/helpers/candidates.js';
import { runEventsOnDisk, runPath, startRun, stopRun, testPolicy, until } from './runs.js';

const a = 'capability-coordination/a';
const b = 'capability-coordination/b';
const d = 'capability-coordination/d';
const p = 'capability-coordination';
const composedSummary = 'Delivered A caller subs/a/src/caller.ts and test subs/a/src/tests/caller.test.ts using actual B readFact, with independent literal Fresh fact: old from B. Provider integration evidence: accepted A iteration and combined configured tests for A and B; D compatibility is retained. capability-example:render-source is required delegated composition; capability-example:provider-source states immediate B conformance.';
const remainingConsumer = 'The requesting A module architect retains scenario:review-source and the broader person-review goal in capability-example:review-source; those consumer obligations remain open.';
const acceptanceDivision = [
  { decision: 'capability-example:provider-source establishes immediate provider/caller conformance', reason: 'The returned fact and source define the B interface used by A.', evidence: ['subs/b/src/fact.ts', 'subs/b/src/tests/fact.test.ts'] },
  { decision: 'capability-example:render-source requires delegated composed A/B acceptance', reason: 'The requested result must render the actual B source through A; provider-only evidence is insufficient.', evidence: ['subs/a/src/caller.ts', 'subs/a/src/tests/caller.test.ts'] },
  { decision: 'capability-example:review-source remains broader consumer acceptance with A module architect', reason: 'The delegated render capability supports the person-review flow, whose registered scenario:review-source remains A responsibility.', evidence: ['scenario:review-source'] },
];

export async function runAcceptedHandback(mode: 'revision' | 'deferred' | 'reload' | 'drift' | 'restart' | 'verify-restart' |
  'concern-submission-restart' | 'repair-exhaustion', cleanups: Array<() => Promise<void>>,
  /** Inspects the settled run of the full revision flow. */
  inspect?: (run: { readonly root: string; readonly planId: string; readonly runId: string }) => Promise<void>, infrastructureRecovery = false, handbackCommitDrift = false, staleRecovery = false, isolation = false): Promise<void> {
  const fixture = await copyCapabilityFixture(); cleanups.push(fixture.remove);
  const names = { request: 'capability-request:render-source-fact', task: 'capability-task:provide-source-fact',
    work: 'work-item:richer-a-fact', deferred: 'work-item:b-entry', scenario: 'scenario:review-source' };
  const encode = (value: string) => encodeURIComponent(value);
  const examples = ['capability-example:render-source', 'capability-example:provider-source', 'capability-example:review-source'];
  const external = acceptanceBoundaries(fixture.root, mode, infrastructureRecovery);
  cleanups.push(async () => external.assertComplete());
  let architect = 0;
  let reviewer = 0;
  let reconciliationTurns = 0;
  let raisedConcern = false;
  let originalEngineer = true;
  let localTurn = 0;
  let deferredBriefing = '';
  let driftFeedback = '';
  let lastCapabilityPrompt = '';
  let correctionAssigned = false;
  let planExercised = false;
  let planCorrected = false;
  let resuming = false;
  let suspendedContinuationStarted = false;
  let repairContinuationStarted = false;
  let originalRequest = '';
  let handbackMaterialized = false;
  const flowScripted: Script = spec => {
    // Callback perception includes inherited packets. Route only by the newest
    // renderer-owned objective and the actual current working directory.
    const objective = [...spec.prompt.matchAll(/^Perform [^\n]+ for (\{[^\n]*\}); use the current evidence and designated submission\.$/gmu)].at(-1);
    const work = objective === undefined ? {} : JSON.parse(objective[1]!) as { workItem?: string; iteration?: string };
    const current = spec.prompt.slice(spec.prompt.lastIndexOf('Briefing revision:'));
    const latest = (expression: RegExp) => [...spec.prompt.matchAll(expression)].at(-1);
    if (spec.submission.name === 'submit_work_item_result') {
      if (work.workItem === 'work-item:b-entry') {
        deferredBriefing = spec.prompt;
        return [{ kind: 'wait', ms: 60_000 }];
      }
      return localTurn++ === 0 ? submit(assign(a, {}, outline())) : submit({ ...requestCompletion(),
        reports: [{ id: 'scenario:review-source', judgment: 'done', basedOnRevision: 0 }] });
    }
    if (spec.submission.name === 'submit_capability_qualification') {
      const [, request, invocation] = latest(/Use request (capability-request:[a-z0-9-]+) and invocation (inv-\d+)/gu)!;
      return submit({ kind: 'delegate-capability', request, invocation, provider: b,
        taskKey: request === names.request ? 'draft:capability-task:provide-source-fact' : 'draft:capability-task:revised-source-fact',
        placementReason: 'B owns the source fact', constraints: [], requirementRefs: [] });
    }
    if (spec.role === 'engineer') {
      if (originalEngineer) {
        originalEngineer = false;
        external?.stage('suspended');
        return submit({ kind: 'capability-needed', summary: 'A has an unfinished caller', request: {
          requestKey: 'draft:capability-request:render-source-fact', need: 'Render a fact with its source', usage: [{ path: 'subs/a/src/caller.ts', symbol: 'renderA', use: 'Render B fact', prospective: false }],
          constraints: ['D retains the old label'], knownInterface: { kind: 'none-known' },
          examples: [{ key: 'draft:capability-example:render-source', title: 'shows source', code: "expect(renderA()).toBe('Fresh fact: old from B')", designation: 'pseudocode' },
            { key: 'draft:capability-example:provider-source', title: 'provider returns source', code: "expect(readFact()).toEqual({text:'old', source:'B'})", designation: 'pseudocode' },
            { key: 'draft:capability-example:review-source', title: 'person reviews source', code: "expect(personReviewsSource()).toBe('B')", designation: 'pseudocode' }],
        } }, edit('caller.ts', 'Fact: ${value}', 'Fresh fact: ${value}'),
        write('extra.ts', "export const sourceHint = 'B';\n"),
        edit('tests/caller.test.ts', "toBe('Fact: old')", "toBe('unfinished')"));
      }
      const owner = work.iteration?.startsWith('capability-task:') ? [[a, 'subs/a/src'], [b, 'subs/b/src'], [d, 'subs/d/src'], [p, 'src']].find(([, directory]) => spec.scope.workingDirectory === join(fixture.root, directory!))?.[0] : undefined;
      if (owner === b) { external?.stage('provider'); return submit({ kind: 'partial', summary: 'B added the source field for combined verification', findings: [], unfinished: [] },
        write('../docs/prior.txt', 'B-owned prior assignment documentation\n'),
        write('fact.ts', "export interface FactResult { text: string; source: string }\nexport const readFact = (): FactResult => ({ text: 'old', source: 'B' });\n"),
        write('tests/fact.test.ts', "import { expect, test } from 'vitest';\nimport { readFact } from '../fact.js';\ntest('B returns the independently specified fact', () => expect(readFact()).toEqual({ text: 'old', source: 'B' }));\n")); }
      if (owner === d) { external?.stage('consumer'); return submit({ kind: 'partial', summary: 'D migrated its typed use for combined verification', findings: [], unfinished: [] },
        write('consumer.ts', "import { readFact } from '../../b/src/fact.js';\nexport function legacyLabel(): string { return readFact().text.toUpperCase(); }\n")); }
      if (owner === p) { external?.stage('exposed'); return submit({ kind: 'partial', summary: 'P exposed the signature companion for combined verification', findings: [], unfinished: [] },
        write('../module.ramify', rootDescription('capability-coordination', 'expose-sub readFact, FactResult from b to descendants\n')),
        write('assembly.ts', "import { renderA } from '../subs/a/src/caller.js';\nexport const render = () => renderA();\n")); }
      if (owner === a && current.includes('independent literal')) { external?.stage('corrected'); return submit({ kind: 'completion-proposed', summary: 'A repaired the circular oracle', findings: [] },
        write('tests/caller.test.ts', "import { expect, test } from 'vitest';\nimport { renderA } from '../caller.js';\ntest('A renders the source', () => expect(renderA()).toBe('Fresh fact: old from B'));\n")); }
      if (owner === a) { external?.stage('integrated'); return submit({ kind: 'completion-proposed', summary: 'A integrated the real B result', findings: [] },
        write('caller.ts', "import { readFact } from '../../b/src/fact.js';\nexport function renderA(): string { const fact = readFact(); return `Fresh fact: ${fact.text} from ${fact.source}`; }\n"),
        write('tests/caller.test.ts', "import { expect, test } from 'vitest';\nimport { renderA } from '../caller.js';\ntest('A renders the source', () => expect(renderA()).toBe(renderA()));\n")); }
      expect(spec.prompt).toContain(composedSummary);
      expect(spec.prompt).toContain(remainingConsumer);
      expect(spec.prompt).toContain('Inspect and reuse the delivered caller source and tests');
      expect(spec.prompt).toMatch(/capabilities\/capability-task%3Aprovide-source-fact\/plan\/3.json/u);
      expect(spec.prompt).toMatch(/gates\/ga-\d+\/attempt.json/u);
      expect(readFileSync(join(fixture.root, 'subs/a/src/caller.ts'), 'utf8')).toContain("import { readFact } from '../../b/src/fact.js'");
      expect(readFileSync(join(fixture.root, 'subs/a/src/tests/caller.test.ts'), 'utf8')).toContain("toBe('Fresh fact: old from B')");
      suspendedContinuationStarted = true;
      if (mode === 'restart' || mode === 'verify-restart' || mode === 'concern-submission-restart') return resuming
        ? submit({ kind: 'completion-proposed', summary: 'A resumed after restart with the accepted result', findings: [] })
        : [{ kind: 'wait', ms: 60_000 }];
      if (mode === 'deferred' || mode === 'reload') return submit({ kind: 'completion-proposed', summary: 'A resumed with the accepted result', findings: [] });
      return submit({ kind: 'capability-needed', summary: 'A found a post-handback integration issue', request: {
        requestKey: 'draft:capability-request:revise-source-fact', need: 'Revise the B result for A integration',
        usage: [{ path: 'subs/a/src/caller.ts', symbol: 'renderA', use: 'Integrate the returned result', prospective: false }],
        constraints: ['Preserve D compatibility'], knownInterface: { kind: 'insufficient',
          path: 'subs/b/src/fact.ts', symbol: 'readFact', missing: 'A needs an additional provenance rule' },
        examples: [{ key: 'draft:capability-example:provenance-rule', title: 'provenance rule', code: "expect(renderA()).toContain('B')", designation: 'pseudocode' }],
        revises: { task: 'capability-task:provide-source-fact', reason: 'A integration exposed a missing provenance rule' },
      } });
    }
    if (spec.role === 'reviewer') {
      reviewer += 1;
      const changedPaths = spec.prompt.split('## The changed paths\n\n').at(-1)?.split('\n\n')[0] ?? '';
      const paths = [...changedPaths.matchAll(/^- [A-Z] (.+)$/gmu)].map(match => match[1]!);
      const concern = { findingKey: 'draft:finding:circular-test-oracle',
        summary: 'A expected value copies the implementation', consequence: 'The assertion cannot catch a wrong result',
        rationale: 'The candidate calls renderA on both sides', uncertainty: 'low', remedy: 'Use an independent literal',
        locations: [{ path: 'subs/a/src/tests/caller.test.ts', startLine: 3, endLine: 3 }], suggests: null, risk: 'medium', ground: null };
      const shouldRaise = !raisedConcern && paths.includes('subs/a/src/tests/caller.test.ts') &&
        readFileSync(join(fixture.root, 'subs/a/src/tests/caller.test.ts'), 'utf8').includes('toBe(renderA())');
      if (shouldRaise) raisedConcern = true;
      return [...paths.map(path => ({ kind: 'tool' as const, tool: 'snapshot_diff', input: { path } })),
        { kind: 'submit', input: { inspected: paths, missing: [], concerns: shouldRaise ? [concern] : [] } }];
    }
    if (spec.submission.name === 'submit_reconciliation') {
      reconciliationTurns += 1;
      const id = latest(/### `(finding:[a-z0-9-]+)`/gu)?.[1];
      if (id === undefined) return submit({ relations: [], dispositions: [], next: { kind: 'complete' },
        brief: 'The accepted correction closed the finding; no new concern needs attention.' });
      const firstRound = reconciliationTurns === 1;
      const report = latest(/- `(cfr-\d+)` by /gu)?.[1];
      if (!firstRound && report === undefined) throw new Error(`Reconciliation lacks its report: ${spec.prompt}`);
      return submit({ relations: [], dispositions: [{ checkFinding: id,
        rationale: firstRound ? 'The circular test oracle needs an independent expected value.'
          : 'The repaired test now asserts the independent literal from the original request.',
        communication: { mode: 'quiet' },
        action: firstRound ? { action: 'repair' } : { action: 'fixed', reassessed: [report] },
      }], next: firstRound ? { kind: 'correct', goal: 'Repair the A test with an independent expected literal.' } : { kind: 'complete' },
      brief: firstRound ? 'The A test oracle copies the implementation; assign an independent literal.' : 'The independent literal fixes the review concern.' });
    }
    if (spec.role === 'capability-architect') {
      lastCapabilityPrompt = spec.prompt;
      const [, task, revision, invocation] = latest(/Use task (capability-task:[a-z0-9-]+), planRevision (\d+) and invocation (inv-\d+)/gu)!;
      if (task === 'capability-task:revised-source-fact') return [{ kind: 'wait', ms: 60_000 }];
      architect += 1;
      if (mode === 'repair-exhaustion') {
        const runId = activeService!.listRuns('need')[0]!.jobId;
        const failed = activeService!.events('need', runId)!.filter(event => event.type === 'gate-attempted' && event.data.verdict === 'failed');
        if (failed.length >= 4) {
          // This next actual architect turn proves repair remains available.
          // Hold it before another gate can race the settled attempt assertions.
          repairContinuationStarted = true;
          return [{ kind: 'wait', ms: 60_000 }];
        }
      }
      const basis = { task, planRevision: Number(revision), invocation };
      const assignOwner = (owner: string, purpose: string) => submit({ ...basis, kind: 'assign', assignment: assign(owner, {
        goal: purpose, approach: purpose, completionEvidence: 'Real source and tests',
      }).assignment });
      if (current.includes('requires a correction assignment')) {
        correctionAssigned = true;
        return assignOwner(a, 'Repair the A test with an independent literal');
      }
      if (mode === 'drift' && current.includes('Source changed after gate')) {
        driftFeedback = spec.prompt;
        return [{ kind: 'wait', ms: 60_000 }];
      }
      if (architect === 1) return [{ kind: 'await', until: async () => {
        const runId = activeService!.listRuns('need')[0]!.jobId;
        originalRequest = await readFile(runPath(fixture.root, 'need', runId, `capabilities/requests/${encode(names.request)}.json`), 'utf8');
      } }, ...assignOwner(b, 'Add the source field')];
      if (architect === 2) return submit({ ...basis, kind: 'partial', progress: 'B source field delivered; required real A/B composition is not yet implemented',
        unfinished: ['Migrate compatibility callers, expose the companion and integrate the real B result in A'] });
      if (architect === 3) return assignOwner(d, 'Migrate D typed use');
      if (architect === 4) return assignOwner(p, 'Expose the companion');
      if (architect === 5) return assignOwner(a, 'Integrate A');
      // The handback is the architect's done report on the delegated
      // outcome, made once at the revision its briefing shows. It cites no
      // test file; what it concluded about the example is summary text.
      const outcomePattern = new RegExp(`- ${task} \\(delegated outcome\\): (pending|bound|done), revision (\\d+)`, 'gu');
      const outcome = latest(outcomePattern);
      if (outcome === undefined) throw new Error(`The capability briefing lacks ${task}'s obligation line`);
      const handback = (atRevision: number) => ({ ...basis, planRevision: atRevision, kind: 'request-handback',
        summary: composedSummary,
        interfaces: [{ path: 'subs/b/src/fact.ts', symbols: ['readFact', 'FactResult'], use: 'Call readFact and render its source' }], limitations: [remainingConsumer],
        reports: outcome[1] === 'done' ? [] : [{ id: task, judgment: 'done', basedOnRevision: Number(outcome[2]), where: 'subs/a/src/tests/caller.test.ts' }] });
      if (architect >= 6 && !planExercised) {
        planExercised = true;
        return [
          { kind: 'tool', tool: 'update_capability_plan', input: { task, basedOn: Number(revision), invocation,
            reason: 'State the A example as the consumer renders it while ordinary review judges its oracle',
            changes: { decisions: acceptanceDivision, useCases: [
              { id: 'capability-example:render-source', expectedBehavior: 'Fresh fact: old from B', derivedFrom: ['capability-example:render-source'] },
              { id: 'capability-example:provider-source', expectedBehavior: 'B returns old fact with source B', derivedFrom: ['capability-example:provider-source'] },
              { id: 'capability-example:review-source', expectedBehavior: 'Person reviews the source B', derivedFrom: ['capability-example:review-source'] },
            ] } } },
          { kind: 'submit', input: handback(Number(revision) + 1) },
        ];
      }
      if (!correctionAssigned || planCorrected) return submit(handback(Number(revision)));
      planCorrected = true;
      return [
        { kind: 'tool', tool: 'update_capability_plan', input: { task, basedOn: Number(revision), invocation,
          reason: 'The earlier oracle compared the value to itself; the A test now asserts the independent literal from the original request',
          changes: { decisions: acceptanceDivision, useCases: [
            { id: 'capability-example:render-source', expectedBehavior: 'Renders the independent literal Fresh fact: old from B', derivedFrom: ['capability-example:render-source'] },
            { id: 'capability-example:provider-source', expectedBehavior: 'B returns old fact with source B', derivedFrom: ['capability-example:provider-source'] },
            { id: 'capability-example:review-source', expectedBehavior: 'Person reviews the source B', derivedFrom: ['capability-example:review-source'] },
          ] } } },
        { kind: 'submit', input: handback(Number(revision) + 1) },
      ];
    }
    return [];
  };
  const scripted: Script = spec => {
      if (spec.submission.name === 'submit_intake') {
        const documents = [...spec.prompt.matchAll(/^- (document:[a-z0-9-]+) \(plan\):/gmu)].map(match => match[1]!);
        return submit({ goal: 'Expose the richer B fact to A.', elements: [], incorporation: {
          documents: documents.map(document => ({ document, scenarios: true, uncertainty: '' })), missing: [],
        } });
      }
      if (spec.submission.name === 'submit_principle_elements') return submit({ elements: [] });
      if (spec.submission.name === 'submit_catalog_check') return submit({ corrections: [], entries: [], scenarios: [] });
      if (spec.role === 'initial-architect') return submit({ elements: [], entries: [
        { capabilityKey: 'draft:capability:richer-a-fact', description: 'A renders the richer B fact.', owner: a,
          functionalRequirementKeys: [], functionalAcceptanceKeys: [], contextKeys: [], citations: [] },
        { capabilityKey: 'draft:capability:b-entry', description: 'B supplies the fact.', owner: b,
          functionalRequirementKeys: [], functionalAcceptanceKeys: [], contextKeys: [], citations: [] },
      ], hypotheses: [], coverageLimits: [], scenarios: [
        { scenarioKey: 'draft:scenario:review-source', entryCapabilityKey: 'draft:capability:richer-a-fact',
          origin: { kind: 'architect' }, functionalAcceptanceKeys: [],
          gherkin: 'Scenario: Review source\n  When A renders the B fact\n  Then the source is shown' },
        { scenarioKey: 'draft:scenario:provide-source', entryCapabilityKey: 'draft:capability:b-entry',
          origin: { kind: 'architect' }, functionalAcceptanceKeys: [],
          gherkin: 'Scenario: Provide source\n  When B provides a fact\n  Then its source is present' },
      ], integrationScenarios: [] });
    return flowScripted(spec);
  };
  // Hold the already accepted coordinator at confirmed settlement until the
  // concern review's close has begun. This fixes the race ordering without a
  // timer or a late result completing an owning action.
  let coordinatorSettled = false;
  let releaseCoordinator!: () => void;
  const coordinatorClosing = new Promise<void>(resolve => { releaseCoordinator = resolve; });
  let closingVerification: Promise<void> | undefined;
  let closeVerification: (() => Promise<void>) | undefined;
  let activeService: Awaited<ReturnType<typeof openCapabilityRuns>>['service'] | undefined;
  // The ordinary matrix answers configured policy with explicit synthetic
  // responses. The actual boundary witness runs the owners' Vitest and tsc
  // commands in place; its audit record remains synthetic provider evidence.
  const realChecks = external?.audit ?? localCommandAudit({
    tests: [join(fixture.root, 'node_modules/.bin/vitest'), 'run',
      'subs/a/src/tests/caller.test.ts', 'subs/b/src/tests/fact.test.ts', 'subs/d/src/tests/consumer.test.ts'],
    'type-check': [join(process.cwd(), 'node_modules/.bin/tsc'), '--noEmit', '-p', 'tsconfig.json'],
  });
  const failingCombinedChecks = mappedAudit(({ check }) => check.kind === 'tests'
    ? { outcome: { kind: 'completed', exitCode: 1 }, stdout: 'Combined capability repair fixture failure' }
    : {});
  const gateContexts: string[] = [];
  let inheritedAuthorityChecked = false;
  let infrastructureInterrupted = false;
  const options = { git: external?.git ?? gitService, ...(external === undefined ? {} : { candidates: external.candidates, ramify: external.ramify, provisionalSourceGit: external.sourceGit }),
    script: scripted, inputs: treeInputs(),

    configuredAudit: infrastructureRecovery ? { read: realChecks.read, async run(input: ConfiguredAuditInput) {
        if (!infrastructureInterrupted && await gateCheckpoint(fixture.root, input) === 'work-item') {
          infrastructureInterrupted = true;
          return { status: 'failed' as const, requestId: `${input.runId}:${input.attemptId}`, mode: input.mode, nested: input.nested ?? false, projects: null, discovery: null,
            requestedSourceCommit: input.sourceCommit, auditedSourceCommit: null, reused: false, reuse: null, requestedMode: null, executedMode: null,
            fallbackReason: null, verdict: null, reportCommit: null, runRef: null, treeRef: null, definition: { path: input.configuration.path, blob: input.configuration.blob },
            detail: 'Settled combined capability check service is unavailable', provider: { status: 'failed', error: { code: 'ENOENT', message: 'Settled combined capability check service is unavailable', retryable: false } }, checks: {} };
        }
        return realChecks.run(input);
      } } : mode === 'repair-exhaustion' ? { read: realChecks.read, async run(input: ConfiguredAuditInput) {
        const checkpoint = await gateCheckpoint(fixture.root, input);
        gateContexts.push(`${input.attemptId}:${checkpoint}`);
        // The exhaustion fixture states a failure only for the bounded
        // task's ordinary completion gate.
        return checkpoint === 'work-item' && external === undefined ? failingCombinedChecks.run(input) : realChecks.run(input);
      } } : realChecks,
    afterWrite: async (write: string, runId: string) => {
      // The event is committed before its body is materialized; this callback follows both.
      if (write === 'capability-handed-back') handbackMaterialized = true;
      const event = activeService?.events('need', runId)?.at(-1);
      const gate = activeService?.events('need', runId)?.filter(entry => entry.type === 'gate-attempted').at(-1);
      if (mode === 'revision' && write === 'capability-assigned' && event?.type === 'capability-assigned' && event.data.sequence === 4) {
        const assignment = JSON.parse(await readFile(runPath(fixture.root, 'need', runId, 'work-items/capability-task%3Aprovide-source-fact/iterations/04/assignment.json'), 'utf8'));
        const active = activeService!['runs'].get(`need/${runId}`)!;
        const request = { checkpoint: 'iteration' as const, subject: { workItem: 'work-item:richer-a-fact', iteration: assignment.id } };
        const paths = ['module.ramify', 'src/assembly.ts', 'subs/b/src/fact.ts', 'subs/b/src/tests/fact.test.ts', 'subs/d/src/consumer.ts', 'subs/b/docs/prior.txt'];
        for (const path of paths) {
          const hash = createHash('sha256').update(await readFile(join(fixture.root, path))).digest('hex');
          expect(assignment.coordination.startingPaths).toContainEqual({ path, hash });
        }
        const positive = await activeService!['gates'](active).candidateAuthority(request);
        expect(positive.rules.find(rule => rule.rule === 'write-scope')?.outcome).toBe('passed');
        expect(positive.ownership?.paths.filter(seed => paths.includes(seed.path)).map(seed => [seed.path, seed.status, seed.module, seed.exclusion]).sort()).toEqual(
          paths.map(path => [path, 'owned', path.startsWith('subs/b/') ? b : path.startsWith('subs/d/') ? d : p, null]).sort());
        const file = join(fixture.root, 'subs/b/src/fact.ts');
        const original = await readFile(file);
        await writeFile(file, `${original.toString()}\n// unassigned later bytes\n`);
        const changed = await activeService!['gates'](active).candidateAuthority(request);
        expect(changed.rules.find(rule => rule.rule === 'write-scope')?.violations).toContainEqual(expect.objectContaining({ path: 'subs/b/src/fact.ts' }));
        await writeFile(file, original);
        const declaration = join(fixture.root, 'subs/b/module.ramify');
        const declared = await readFile(declaration);
        for (const line of ['external "docs"', 'owned-nested-project "docs"']) {
          await writeFile(declaration, `${declared.toString()}\n${line}\n`);
          const narrowed = await activeService!['gates'](active).candidateAuthority(request);
          expect(narrowed.rules.find(rule => rule.rule === 'write-scope')?.violations).toContainEqual(expect.objectContaining({ path: 'subs/b/docs/prior.txt' }));
        }
        await writeFile(declaration, declared);
        inheritedAuthorityChecked = true;
      }
      if (mode === 'drift' && !handbackCommitDrift && write === 'gate-committed' && gate?.type === 'gate-attempted' &&
        gate.data.checkpoint === 'work-item' && gate.data.verdict === 'passed') {
        external?.stage('drift');
        writeFileSync(join(fixture.root, 'subs/b/src/fact.ts'), `${readFileSync(join(fixture.root, 'subs/b/src/fact.ts'), 'utf8')}\n// concurrent source edit after the passing gate\n`);
      }
      if (write === 'capability-verification-started' && (isolation || staleRecovery)) {
        const active = activeService!['runs'].get(`need/${runId}`)!;
        const coordinator = activeService!['coordination'](active);
        if (isolation) {
          const observation = coordinator['ports'].observe();
          const context = activeService!['runnerContext'](active);
          for (const name of ['log', 'mutex', 'starting', 'live', 'writer']) expect(name in context).toBe(false);
          const version = active.log.version;
          const authority = JSON.stringify(active.log.ledger.replay());
          const events = context.events();
          Reflect.set(events.at(-1)!.data, 'task', 'mutated-invocation-observer');
          Reflect.set(context.record(observation.history.lines.flatMap(line => line.transaction.records)[0]!.path, 'first')!.body as object, 'childMutation', true);
          const policy = context.policy;
          Reflect.set(policy.limits, 'writerSettleMs', -1);
          expect(active.policy.limits.writerSettleMs).not.toBe(-1);
          const publicEvents = activeService!.events('need', runId)!;
          Reflect.set(publicEvents.at(-1)!.data, 'task', 'mutated-events-reader');
          Reflect.set(activeService!.recordOf('need', runId)!.policy.limits, 'writerSettleMs', -1);
          expect(active.record.policy.limits.writerSettleMs).not.toBe(-1);
          const source = activeService!.committed('need', runId)!;
          Reflect.set(source.record.policy.limits, 'writerSettleMs', -1);
          Reflect.set(source.entries.at(-1)!.transaction.event.data, 'task', 'mutated-projector');
          Reflect.set(source.entries.flatMap(line => line.transaction.records)[0]!.body as object, 'childMutation', true);
          const list = activeService!.committedRuns('need');
          Reflect.set(list[0]!.entries.flatMap(line => line.transaction.records)[0]!.body as object, 'listMutation', true);
          expect(JSON.stringify(active.log.ledger.replay())).toBe(authority);
          expect(active.log.version).toBe(version);
          const counters = structuredClone(checkFindingStateOf(active.log.ledger).counters);
          const refused = await coordinator['ports'].commitFinding(({ state }) => {
            Reflect.set(state.counters, 'findings', -1);
            return { stale: 'mutation isolation witness appends nothing' };
          });
          expect(refused.kind).toBe('refused');
          expect(checkFindingStateOf(active.log.ledger).counters).toEqual(counters);
          expect(active.log.version).toBe(version);
          const gateIndex = await activeService!['gateHost'](active).refreshIndex();
          if (gateIndex !== null) {
            const before = JSON.stringify(active.index);
            const nested = [...gateIndex.modules.values()][0];
            expect(nested).toBeDefined();
            Reflect.set(nested as object, 'gateMutation', true);
            expect(JSON.stringify(active.index)).toBe(before);
          }

          const authoritative = JSON.stringify(active.log.ledger.replay());
          // The history is frozen, so each attempt is refused and nothing needs restoring.
          const last = observation.history.events.at(-1)!;
          expect(Reflect.set(last.data, 'task', 'mutated-child')).toBe(false);
          const record = observation.history.lines.flatMap(line => line.transaction.records).at(0)!;
          expect(Reflect.set(record.body as object, 'childMutation', true)).toBe(false);
          expect(JSON.stringify(active.log.ledger.replay())).toBe(authoritative);
          const refreshed = await coordinator['ports'].refreshIndex();
          if (refreshed !== null) {
            const before = JSON.stringify(active.index);
            const nested = [...refreshed.modules.values()][0];
            expect(nested).toBeDefined();
            Reflect.set(nested as object, 'childMutation', true);
            expect(JSON.stringify(active.index)).toBe(before);
            Reflect.deleteProperty(nested as object, 'childMutation');
          }
        }
        if (staleRecovery) {
          const request = active.log.all('review-request-recorded').find(entry => entry.data.workItem === 'capability-task:provide-source-fact')!;
          expect(request).toBeDefined();
          await activeService!['write'](active, { type: 'review-request-recorded', data: { ...request.data, request: 'rq-9999' } });
        }
      }
      if (handbackCommitDrift && write === 'capability-verification-started') {
        external?.stage('drift');
        writeFileSync(join(fixture.root, 'subs/b/src/fact.ts'), `${readFileSync(join(fixture.root, 'subs/b/src/fact.ts'), 'utf8')}\n// concurrent source edit after accepted verification\n`);
      }
      // Independent review events may advance the ledger tail before this
      // write observer runs. Identify the submitted reviewer by its invocation,
      // while its request still has no combined completion record.
      const current = activeService?.events('need', runId) ?? [];
      if (write === 'capability-assignment-settled' && event?.type === 'capability-assignment-settled' && event.data.assignment === 'capability-task:provide-source-fact.i03') {
        // Provider and compatibility edits alone have not implemented required
        // A/B composition; the coordinator must still assign the real A caller.
        expect(current.some(entry => entry.type === 'capability-handed-back')).toBe(false);
        expect(current.some(entry => entry.type === 'obligation-reported' && entry.data.id === 'capability-task:provide-source-fact' && entry.data.judgment === 'done')).toBe(false);
      }
      const pendingReview = current.filter(entry => entry.type === 'review-request-recorded').at(-1);
      const latestReviewer = current.filter(entry => entry.type === 'invocation-started' && entry.data.role === 'reviewer').at(-1);
      const pendingSubmission = latestReviewer?.type === 'invocation-started' && current.some(entry =>
        entry.type === 'invocation-ended' && entry.data.invocation === latestReviewer.data.invocation && entry.data.ended === 'submitted') &&
        pendingReview?.type === 'review-request-recorded' && !current.some(entry => entry.type === 'review-attempt-finished' && entry.data.request === pendingReview.data.request);
      const boundary = mode === 'verify-restart' && write === 'capability-verification-started' ||
        mode === 'concern-submission-restart' && write === 'invocation-ended' && reviewer === 1 && pendingSubmission;
      if (boundary && closingVerification === undefined) {
        if (mode === 'concern-submission-restart') await until(() => coordinatorSettled, 30_000);
        closingVerification = closeVerification?.();
      }
    },
    policy: root => {
      const base = testPolicy(root, { recovery: infrastructureRecovery });
      return { ...base, reviews: testReviewPolicy(), commands: { ...base.commands,
        typeCheck: checkCommand({ argv: [join(process.cwd(), 'node_modules/.bin/tsc'), '--noEmit', '-p', 'tsconfig.json'], cwd: root, timeoutMs: 30_000 }),
        ramifyCheck: base.commands.ramifyCheck,
      } };
    } } satisfies Parameters<typeof openCapabilityRuns>[1];
  const opened = await openCapabilityRuns(fixture.root, options);
  if (mode !== 'concern-submission-restart') cleanups.push(() => opened.service.close());
  activeService = opened.service;
  closeVerification = () => {
    const closed = opened.service.close();
    releaseCoordinator();
    return closed;
  };
  if (mode === 'concern-submission-restart') {
    cleanups.push(async () => { releaseCoordinator(); await opened.service.close(); });
    const settle = opened.service['runner'].settleSession.bind(opened.service['runner']);
    opened.service['runner'].settleSession = async (...args) => {
      const result = await settle(...args);
      const invocation = args[0].events().filter(event => event.type === 'invocation-started').find(event => event.data.invocation === args[1]);
      if (!coordinatorSettled && planExercised && invocation?.data.role === 'capability-architect') {
        expect(result.confirmed).toBe(true);
        coordinatorSettled = true;
        await coordinatorClosing;
      }
      return result;
    };
  }
  const receipt = await opened.service.execute(startRun('need'));
  if (infrastructureRecovery) {
    await until(() => (opened.service.events('need', receipt.jobId) ?? []).some(event => event.type === 'operation-recovery-paused'), 30_000);
    const paused = (await opened.service.recoveryInspection('need', receipt.jobId))!;
    expect(paused).toMatchObject({ boundary: { kind: 'gate', checkpoint: 'work-item', work: { workItem: 'capability-task:provide-source-fact' } }, evidence: { classification: 'check-execution' } });
    const before = (opened.service.events('need', receipt.jobId) ?? []).filter(event => event.type === 'invocation-started' && event.data.role === 'engineer');
    await opened.service.execute({ commandId: 'restore-combined-capability-check', expectedVersion: 0, type: 'resume-recovery', payload: {
      planId: 'need', jobId: receipt.jobId } });
    await until(() => (opened.service.events('need', receipt.jobId) ?? []).some(event => event.type === 'capability-handed-back'), 30_000);
    const handed = (opened.service.events('need', receipt.jobId) ?? []).find(event => event.type === 'capability-handed-back')!;
    const after = (opened.service.events('need', receipt.jobId) ?? []).filter(event => event.sequence < handed.sequence && event.type === 'invocation-started' && event.data.role === 'engineer');
    expect(after).toEqual(before);
    const gates = (opened.service.events('need', receipt.jobId) ?? []).filter(event => event.type === 'gate-attempted' && event.data.checkpoint === 'work-item');
    expect(gates.map(event => event.type === 'gate-attempted' ? event.data.verdict : '')).toEqual(['not-verified', 'passed']);
  }
  if (mode === 'verify-restart' || mode === 'concern-submission-restart') {
    await until(() => closingVerification !== undefined, 120_000).catch(async error => {
      const current = await runEventsOnDisk(fixture.root, 'need', receipt.jobId);
      throw new Error(`${String(error)}; architect ${architect}; gates ${JSON.stringify(current.filter(event => event.type === 'gate-attempted'))}; tail ${JSON.stringify(current.slice(-12))}`);
    });
    await closingVerification;
    const before = await runEventsOnDisk(fixture.root, 'need', receipt.jobId);
    if (mode === 'verify-restart') expect(before.filter(event => event.type === 'capability-verification-started')).toHaveLength(1);
    expect(before.filter(event => event.type === 'capability-handed-back')).toHaveLength(0);
    if (mode === 'concern-submission-restart') {
      const request = before.filter(event => event.type === 'review-request-recorded').at(-1);
      expect(request).toBeDefined();
      expect(before.some(event => event.type === 'review-attempt-started' && event.data.request === request?.data.request)).toBe(true);
      expect(before.some(event => event.type === 'review-attempt-finished' && event.data.request === request?.data.request)).toBe(false);
      const reviewerInvocations = new Set(before.flatMap(event => event.type === 'invocation-started' && event.data.role === 'reviewer'
        ? [event.data.invocation] : []));
      expect(before.some(event => event.type === 'invocation-ended' && event.data.ended === 'submitted' &&
        reviewerInvocations.has(event.data.invocation))).toBe(true);
    }
    const discarded = mode === 'concern-submission-restart'
      ? before.filter(event => event.type === 'invocation-started' && event.data.role === 'capability-architect').at(-1)
      : undefined;
    const discardedPath = discarded?.type === 'invocation-started' ? runLayout.outcome(discarded.data.invocation) : undefined;
    const discardedBytes = discardedPath === undefined ? undefined : await readFile(runPath(fixture.root, 'need', receipt.jobId, discardedPath));
    if (discarded?.type === 'invocation-started') {
      expect(coordinatorSettled).toBe(true);
      expect(JSON.parse(discardedBytes!.toString())).toMatchObject({ invocation: discarded.data.invocation,
        ended: 'submitted', disposition: 'superseded', settled: { confirmed: true } });
      expect(before.find(event => event.type === 'invocation-ended' && event.data.invocation === discarded.data.invocation)?.data)
        .toMatchObject({ kept: false, finished: 'run-ended' });
    }
    const gates = before.filter(event => event.type === 'gate-attempted').length;
    const reviews = before.filter(event => event.type === 'review-attempt-finished').length;
    resuming = true;
    const reopened = await openCapabilityRuns(fixture.root, options);
    cleanups.push(() => reopened.service.close());
    await until(() => (reopened.service.events('need', receipt.jobId) ?? []).some(event =>
      event.type === 'capability-handed-back' && handbackMaterialized || event.type === 'job-failed'), 60_000).catch(async error => {
      const current = await runEventsOnDisk(fixture.root, 'need', receipt.jobId);
      throw new Error(`${String(error)}; architect ${architect}, reviewer ${reviewer}; warnings ${JSON.stringify(reopened.warnings)}; tail ${JSON.stringify(current.slice(-18))}`);
    });
    const after = await runEventsOnDisk(fixture.root, 'need', receipt.jobId);
    if (staleRecovery) {
      expect(after.filter(event => event.type === 'capability-handed-back')).toHaveLength(0);
      expect(after.find(event => event.type === 'job-failed')?.data).toMatchObject({ reason: 'recovery-exhausted', message: expect.stringContaining('completion basis: rq-9999 is not settled') });
      const verified = after.find(event => event.type === 'capability-verification-started')!;
      expect(after.filter(event => event.type === 'invocation-started' && event.sequence > verified.sequence && event.data.role !== 'reviewer')).toEqual([]);
      await reopened.service.settled('need', receipt.jobId);
      return;
    }
    expect(after.filter(event => event.type === 'job-failed'), JSON.stringify(after.slice(-15))).toHaveLength(0);
    expect(after.filter(event => event.type === 'capability-handed-back')).toHaveLength(1);
    if (discarded?.type === 'invocation-started') {
      expect(await readFile(runPath(fixture.root, 'need', receipt.jobId, discardedPath!))).toEqual(discardedBytes);
      expect(after.filter(event => event.type === 'capability-coordinator-resumed' && event.data.invocation === discarded.data.invocation)).toEqual([]);
      expect(after.filter(event => event.type === 'obligation-reported' && event.data.by === discarded.data.invocation)).toEqual([]);
      const replacement = after.filter(event => event.type === 'session-opened' && event.data.role === 'capability-architect' &&
        event.data.replaces?.session === discarded.data.session);
      expect(replacement).toHaveLength(1);
      const replaced = replacement[0];
      if (replaced?.type !== 'session-opened') throw new Error('Missing recorded coordinator reconstruction');
      expect(replaced.data).toMatchObject({ replaces: { reason: 'reconstructed' } });
      const replacementEnd = after.find(event => event.type === 'invocation-ended' && event.data.session === replaced.data.session);
      expect(replacementEnd?.data).toMatchObject({ degraded: { requested: 'continue', actual: 'fresh' } });
      const restoredPrompt = reopened.agent!.sessions.find(session => session.spec.role === 'capability-architect')!.spec.prompt;
      const planStart = restoredPrompt.indexOf('Current plan: ');
      const planEnd = restoredPrompt.indexOf('\n\n# Block ', planStart);
      expect(planStart).toBeGreaterThanOrEqual(0); expect(planEnd).toBeGreaterThan(planStart);
      expect(JSON.parse(restoredPrompt.slice(planStart + 'Current plan: '.length, planEnd))).toMatchObject({
        schema: 'ramify-agent.capability-plan/2', task: 'capability-task:provide-source-fact', revision: 2, basedOn: 1,
        decisions: acceptanceDivision,
        useCases: [{ id: 'capability-example:render-source', expectedBehavior: 'Fresh fact: old from B' },
          { id: 'capability-example:provider-source', expectedBehavior: 'B returns old fact with source B' },
          { id: 'capability-example:review-source', expectedBehavior: 'Person reviews the source B' }],
      });
    }
    const alreadyPassedTaskGate = before.some(event => event.type === 'gate-attempted' &&
      event.data.checkpoint === 'work-item' && event.data.verdict === 'passed');
    const expectedNewGates = mode === 'concern-submission-restart' ? 2 : alreadyPassedTaskGate ? 0 : 1;
    expect(after.filter(event => event.type === 'gate-attempted'), JSON.stringify({ before: before.slice(-12), after: after.slice(-18) }))
      .toHaveLength(gates + expectedNewGates);
    const reviewEvents = after.filter(event => event.type === 'review-attempt-finished');
    if (mode === 'verify-restart') expect(reviewEvents).toHaveLength(reviews);
    expect(after.filter(event => event.type === 'review-request-recorded').length).toBeGreaterThan(0);
    if (mode === 'concern-submission-restart') {
      const replayedReviewers = after.filter((event): event is Extract<typeof event, { type: 'invocation-started' }> =>
        event.type === 'invocation-started' && event.data.role === 'reviewer');
      const originalReviewers = before.filter((event): event is Extract<typeof event, { type: 'invocation-started' }> =>
        event.type === 'invocation-started' && event.data.role === 'reviewer');
      const sameReviewers = replayedReviewers.filter(event => event.data.work.iteration === originalReviewers[0]?.data.work.iteration);
      expect(sameReviewers, JSON.stringify({ before: before.filter(event => event.type.startsWith('review-') ||
        (event.type === 'invocation-started' && event.data.role === 'reviewer') ||
        event.type === 'invocation-ended').slice(-14), after: after.filter(event => event.type.startsWith('review-') ||
        (event.type === 'invocation-started' && event.data.role === 'reviewer') ||
        event.type === 'invocation-ended').slice(-16) })).toHaveLength(1);
      const firstRequest = before.find(event => event.type === 'review-request-recorded');
      if (firstRequest?.type !== 'review-request-recorded') throw new Error('The concern review request was not recorded');
      const finished = after.filter((event): event is Extract<typeof event, { type: 'review-attempt-finished' }> =>
        event.type === 'review-attempt-finished' && event.data.request === firstRequest.data.request);
      expect(finished).toHaveLength(1);
      expect(finished[0]?.data.attempt).toBe(`${firstRequest.data.request}.a01`);
      expect(finished[0]?.data.checkFindings.filter(finding => finding.type === 'check-finding-opened')).toHaveLength(1);
    }
    await until(() => suspendedContinuationStarted || (reopened.service.events('need', receipt.jobId) ?? []).some(event => event.type === 'job-failed'), 30_000);
    expect(suspendedContinuationStarted).toBe(true);
    expect((reopened.service.events('need', receipt.jobId) ?? []).filter(event => event.type === 'job-failed')).toHaveLength(0);
    expect(await readFile(runPath(fixture.root, 'need', receipt.jobId, 'capabilities/requests/capability-request%3Arender-source-fact.json'), 'utf8')).toBe(originalRequest);
    const recoveredHandback = JSON.parse(await readFile(runPath(fixture.root, 'need', receipt.jobId, 'capabilities/capability-task%3Aprovide-source-fact/handback.json'), 'utf8'));
    expect(recoveredHandback).toMatchObject({ summary: composedSummary, limitations: [remainingConsumer], plan: { revision: 3 } });
    await stopStable(reopened.service, receipt.jobId);
    await reopened.service.settled('need', receipt.jobId);
    return;
  }
  await until(() => mode === 'drift' && !handbackCommitDrift ? driftFeedback.length > 0
    : mode === 'repair-exhaustion' ? repairContinuationStarted || (opened.service.events('need', receipt.jobId) ?? []).some(event => event.type === 'job-failed')
    : (opened.service.events('need', receipt.jobId) ?? []).some(event =>
      event.type === 'capability-handed-back' && handbackMaterialized || event.type === 'job-failed'), 120_000).catch(async error => {
    const events = await runEventsOnDisk(fixture.root, 'need', receipt.jobId);
    const gate = events.filter(event => event.type === 'gate-attempted').at(-1);
    const body = gate?.type === 'gate-attempted' ? JSON.parse(await readFile(runPath(fixture.root, 'need', receipt.jobId,
      `gates/${gate.data.gate}/attempt.json`), 'utf8')) as { provider?: unknown; commands?: unknown } : null;
    throw new Error(`${String(error)}; architect ${architect}, reviewer ${reviewer}; prompt ${lastCapabilityPrompt.slice(-2200)}; gate ${JSON.stringify(body)}; last events ${JSON.stringify(events.slice(-18))}`);
  });
  const events = await runEventsOnDisk(fixture.root, 'need', receipt.jobId);
  if (mode === 'reload') {
    expect(events.filter(event => event.type === 'job-failed'), JSON.stringify({ events: events.slice(-20),
      sessions: opened.agent?.sessions.map(session => ({ role: session.spec.role, submission: session.spec.submission.name,
        verdicts: session.verdicts })) })).toHaveLength(0);
    expect(events.filter(event => event.type === 'capability-handed-back' && event.data.task === names.task)).toHaveLength(1);
    const handedBack = events.find(event => event.type === 'capability-handed-back' && event.data.task === names.task)!;
    expect(events.some(event => event.type === 'capability-verification-started' && event.data.task === names.task)).toBe(true);
    expect(events.some(event => event.type === 'gate-attempted' && event.data.checkpoint === 'work-item' && event.data.verdict === 'passed')).toBe(true);
    const request = JSON.parse(await readFile(runPath(fixture.root, 'need', receipt.jobId,
      `capabilities/requests/${encode(names.request)}.json`), 'utf8'));
    const task = JSON.parse(await readFile(runPath(fixture.root, 'need', receipt.jobId,
      `capabilities/${encode(names.task)}/task.json`), 'utf8'));
    const handback = JSON.parse(await readFile(runPath(fixture.root, 'need', receipt.jobId,
      `capabilities/${encode(names.task)}/handback.json`), 'utf8'));
    expect(request).toMatchObject({ schema: 'ramify-agent.capability-request/2', id: names.request,
      parent: { id: names.work }, original: { examples: examples.map(id => ({ id })) } });
    expect(task).toMatchObject({ schema: 'ramify-agent.capability-task/2', id: names.task,
      request: names.request, parent: { id: names.work } });
    expect(handback).toMatchObject({ schema: 'ramify-agent.capability-handback/2', task: names.task,
      request: names.request, summary: composedSummary, limitations: [remainingConsumer] });
    expect(events.some(event => event.type === 'capability-assignment-settled' && event.data.task === names.task &&
      event.data.outcome === 'accepted')).toBe(true);
    await until(() => deferredBriefing.length > 0 || (opened.service.events('need', receipt.jobId) ?? []).some(event =>
      event.type === 'job-failed'), 30_000);
    expect(deferredBriefing, JSON.stringify({ tail: (opened.service.events('need', receipt.jobId) ?? []).slice(-12),
      sessions: opened.agent?.sessions.slice(-5).map(session => ({ role: session.spec.role, submission: session.spec.submission.name,
        verdicts: session.verdicts })) })).toContain(`Task ${names.task} returned tree`);
    expect(deferredBriefing).toContain(`Plan ${names.task}`);
    expect(deferredBriefing).toContain(composedSummary);
    const consumerEvents = opened.service.events('need', receipt.jobId) ?? [];
    expect(consumerEvents.some(event => event.type === 'iteration-closed' && event.sequence > handedBack.sequence &&
      event.data.iteration === `${names.work}.i01` && event.data.outcome === 'accepted')).toBe(true);
    expect(consumerEvents.some(event => event.type === 'work-item-completed' && event.sequence > handedBack.sequence &&
      event.data.workItem === names.work)).toBe(true);
    await stopStable(opened.service, receipt.jobId);
    await opened.service.settled('need', receipt.jobId);
    await opened.service.close();
    const reopened = await openCapabilityRuns(fixture.root, options);
    cleanups.push(() => reopened.service.close());
    const replayed = reopened.service.events('need', receipt.jobId) ?? [];
    expect(replayed.filter(event => event.type === 'capability-handed-back' && event.data.task === names.task)).toHaveLength(1);
    expect(reopened.service.committed('need', receipt.jobId)?.entries.flatMap(line => line.transaction.records)
      .some(record => record.path === `capabilities/${encode(names.task)}/handback.json`)).toBe(true);
    return;
  }
  if (mode === 'repair-exhaustion') {
    expect(repairContinuationStarted).toBe(true);
    expect(events.filter(event => event.type === 'job-failed'),
      JSON.stringify({ gateContexts, tail: events.slice(-20).map(event => [event.type, event.data]) })).toEqual([]);
    const architectInvocations = new Set(events.flatMap(event => event.type === 'invocation-started' &&
      event.data.role === 'capability-architect' ? [event.data.invocation] : []));
    const failedGateIds = events.flatMap(event => event.type === 'gate-attempted' &&
      event.data.verdict === 'failed' ? [event.data.gate] : []);
    const attempts = await Promise.all(failedGateIds.map(async gate =>
      JSON.parse(await readFile(runPath(fixture.root, 'need', receipt.jobId,
        `gates/${gate}/attempt.json`), 'utf8')) as {
          id: string; proposedBy: string | null; repairRound: number; cause: string | null;
        }));
    const combined = attempts.filter(attempt => attempt.proposedBy !== null && architectInvocations.has(attempt.proposedBy));
    expect(combined.map(attempt => attempt.repairRound)).toEqual([0, 1, 2, 3]);
    expect(events.filter(event => event.type === 'capability-handed-back')).toHaveLength(0);
    expect(events.filter(event => event.type === 'work-item-completed' && event.data.workItem === 'work-item:richer-a-fact')).toHaveLength(0);
    const job = JSON.parse(await readFile(runPath(fixture.root, 'need', receipt.jobId, 'job.json'), 'utf8')) as {
      policy: { limits: { repairRoundsPerWorkItemGate: number } } };
    expect(job.policy.limits.repairRoundsPerWorkItemGate).toBe(3);
    // The architect's done report stands beside the raw failed gates: no
    // failure rewrote it, and it did not pass the task's verification.
    const outcomeReports = events.filter(event => event.type === 'obligation-reported' && event.data.id === 'capability-task:provide-source-fact');
    expect(outcomeReports.map(event => event.type === 'obligation-reported' ? [event.data.judgment, event.data.revision] : null)).toEqual([['done', 1]]);
    expect(failedGateIds.length).toBeGreaterThanOrEqual(4);
    expect(attempts.every(attempt => attempt.cause !== null)).toBe(true);
    await stopStable(opened.service, receipt.jobId);
    await opened.service.settled('need', receipt.jobId);
    return;
  }
  if (handbackCommitDrift) {
    const verified = events.find(event => event.type === 'capability-verification-started');
    expect(verified).toBeDefined();
    expect(events.filter(event => event.type === 'capability-handed-back')).toHaveLength(0);
    expect(events.filter(event => event.type === 'job-failed')).toEqual([expect.objectContaining({
      data: expect.objectContaining({ message: expect.stringContaining('candidate changed before its atomic handback') }),
    })]);
    expect(events.filter(event => event.type === 'invocation-started' && event.sequence > verified!.sequence)).toEqual([]);
    await opened.service.settled('need', receipt.jobId);
    return;
  }
  if (mode === 'drift') {
    expect(driftFeedback).toContain('Source changed after gate');
    expect(events.filter(event => event.type === 'capability-handed-back')).toHaveLength(0);
    expect(events.filter(event => event.type === 'gate-attempted' && event.data.verdict === 'passed').length).toBeGreaterThan(0);
    expect(readFileSync(join(fixture.root, 'subs/b/src/fact.ts'), 'utf8')).toContain('concurrent source edit');
    await stopStable(opened.service, receipt.jobId);
    await opened.service.settled('need', receipt.jobId);
    return;
  }
  const lastGate = events.filter(event => event.type === 'gate-attempted').at(-1);
  const lastGateBody = lastGate?.type === 'gate-attempted' ? JSON.parse(await readFile(runPath(fixture.root, 'need', receipt.jobId,
    `gates/${lastGate.data.gate}/attempt.json`), 'utf8')) as {
      cause: string;
      commands: Array<{ kind: string; outcome: string; providerCheckId?: string; output: { tail: string } }>;
      provider?: { checks: Record<string, { passed: boolean; vitest?: { reason: string; files: Array<{ path: string; state: string }> };
        commands?: Record<string, { passed: boolean; vitest?: { reason: string; files: Array<{ path: string; state: string }> } }> }> };
    } : null;
  expect(events.filter(event => event.type === 'job-failed'), JSON.stringify({ tail: events.slice(-12),
    architect, reviewer, lastCapabilityPrompt: lastCapabilityPrompt.slice(-1600),
    gate: lastGateBody === null ? null : { cause: lastGateBody.cause,
      commands: lastGateBody.commands.map(command => [command.kind, command.outcome, command.output.tail.slice(-300)]) } })).toHaveLength(0);
  expect(events.filter(event => event.type === 'capability-handed-back')).toHaveLength(1);
  if (mode === 'revision') expect(inheritedAuthorityChecked).toBe(true);
  // PB3-D08: the handback followed the architect's done report on capability-task:provide-source-fact,
  // which cited no test file and recorded no per-example state. PB3-D10: the
  // consumer's own scenario is still its module architect's to report.
  const handedBack = events.find(event => event.type === 'capability-handed-back')!;
  const outcomeReport = events.find(event => event.type === 'obligation-reported' && event.data.id === 'capability-task:provide-source-fact');
  expect(outcomeReport?.type === 'obligation-reported' ? [outcomeReport.data.judgment, outcomeReport.data.where] : null)
    .toEqual(['done', 'subs/a/src/tests/caller.test.ts']);
  expect(outcomeReport!.sequence).toBeLessThan(handedBack.sequence);
  expect(events.some(event => event.type === 'obligation-reported' && event.data.id === 'scenario:review-source')).toBe(false);
  expect(events.some(event => event.type === 'work-item-completed' && event.data.workItem === 'work-item:richer-a-fact')).toBe(false);
  const plans = await Promise.all([1, 2, 3].map(async revision => JSON.parse(await readFile(runPath(fixture.root, 'need', receipt.jobId,
    `capabilities/capability-task%3Aprovide-source-fact/plan/${revision}.json`), 'utf8')) as { originalExamples: string[]; useCases: Array<Record<string, unknown>>; decisions: typeof acceptanceDivision; compatibility: string[] }));
  expect(plans.map(plan => plan.originalExamples)).toEqual(Array.from({ length: 3 }, () => ['capability-example:render-source', 'capability-example:provider-source', 'capability-example:review-source']));
  expect(plans.slice(1).map(plan => plan.decisions)).toEqual([acceptanceDivision, acceptanceDivision]);
  expect(plans.every(plan => plan.compatibility.includes('D retains the old label'))).toBe(true);
  expect(plans.flatMap(plan => plan.useCases).every(useCase => !('coverage' in useCase))).toBe(true);
  const taskSettlements = events.filter((event): event is Extract<typeof event, { type: 'capability-assignment-settled' }> =>
    event.type === 'capability-assignment-settled' && event.data.task === 'capability-task:provide-source-fact');
  expect(taskSettlements.filter(event => event.data.outcome === 'partial')).toHaveLength(3);
  expect(taskSettlements.filter(event => event.data.outcome === 'accepted').length).toBeGreaterThanOrEqual(1);
  expect(events.filter(event => event.type === 'review-attempt-finished').length).toBeGreaterThan(0);
  expect(events.filter((event): event is Extract<typeof event, { type: 'reconciliation-assessed' }> =>
    event.type === 'reconciliation-assessed' && event.data.workItem === 'capability-task:provide-source-fact')
    .map(event => event.data.next)).toEqual(['correct', 'complete']);
  expect(events.filter(event => event.type === 'capability-assigned' && event.data.corrects === 'capability-task:provide-source-fact.rc01')).toHaveLength(1);
  expect(events.filter(event => event.type === 'iteration-closed' && event.data.checkFindings?.some(finding =>
    finding.type === 'check-finding-decided' && finding.data.decision.decision.action === 'claim-repair'))).toHaveLength(1);
  // Every configured check passed. Actual child-test execution is established
  // by the dedicated real-boundary witness; ordinary answers are synthetic.
  expect(lastGateBody?.commands).toEqual([]);
  const lastChecks = lastGateBody?.provider?.checks as Record<string, { passed: boolean; output: string }> | undefined;
  expect(Object.entries(lastChecks ?? {}).map(([id, check]) => [id, check.passed])).toEqual([
    ['tests', true], ['type-check', true], ['ramify-check', true],
  ]);
  expect(lastChecks!['tests']!.output).toContain('subs/a/src/tests/caller.test.ts');
  expect(lastChecks!['tests']!.output).toContain('subs/b/src/tests/fact.test.ts');
  const handback = JSON.parse(await readFile(runPath(fixture.root, 'need', receipt.jobId,
    'capabilities/capability-task%3Aprovide-source-fact/handback.json'), 'utf8')) as { deltaFromSuspension: string[]; returnedTree: string };
  expect(handback.deltaFromSuspension).toContain('subs/b/src/fact.ts');
  expect(handback.deltaFromSuspension).toContain('subs/a/src/tests/caller.test.ts');
  expect(handback.deltaFromSuspension).not.toContain('subs/a/src/extra.ts');
  expect(handback).toMatchObject({ summary: composedSummary, limitations: [remainingConsumer] });
  const acceptedCaller = events.find(event => event.type === 'capability-assignment-settled' && event.data.assignment === 'capability-task:provide-source-fact.i05' && event.data.outcome === 'accepted');
  expect(acceptedCaller).toBeDefined();
  expect(acceptedCaller!.sequence).toBeLessThan(handedBack.sequence);
  const request = JSON.parse(await readFile(runPath(fixture.root, 'need', receipt.jobId,
    'capabilities/requests/capability-request%3Arender-source-fact.json'), 'utf8')) as { source: { tree: string } };
  expect(await readFile(runPath(fixture.root, 'need', receipt.jobId, 'capabilities/requests/capability-request%3Arender-source-fact.json'), 'utf8')).toBe(originalRequest);
  expect(JSON.parse(originalRequest).original).toMatchObject({ constraints: ['D retains the old label'], examples: [
    { id: 'capability-example:render-source', code: "expect(renderA()).toBe('Fresh fact: old from B')" },
    { id: 'capability-example:provider-source', code: "expect(readFact()).toEqual({text:'old', source:'B'})" },
    { id: 'capability-example:review-source', code: "expect(personReviewsSource()).toBe('B')" },
  ] });
  expect(events.filter(event => event.type === 'work-item-completed' && event.data.workItem === 'work-item:b-entry')).toHaveLength(0);
  const handbackEvent = events.find(event => event.type === 'capability-handed-back')!;
  await until(() => (opened.service.events('need', receipt.jobId) ?? []).some(event => event.type === 'invocation-started' &&
    event.sequence > handbackEvent.sequence && event.data.role === 'engineer' && event.data.work.iteration === 'work-item:richer-a-fact.i01'), 30_000);
  const continued = opened.service.events('need', receipt.jobId)!;
  expect(continued.filter(event => event.type === 'invocation-started' && event.sequence > handbackEvent.sequence &&
    event.data.role === 'engineer' && event.data.work.iteration === 'work-item:richer-a-fact.i01')).toHaveLength(1);
  if (mode === 'restart') {
    const resumedA = continued.find(event => event.type === 'invocation-started' && event.sequence > handbackEvent.sequence &&
      event.data.role === 'engineer' && event.data.work.iteration === 'work-item:richer-a-fact.i01');
    if (resumedA?.type !== 'invocation-started') throw new Error('A continuation did not start');
    await until(() => (opened.service.events('need', receipt.jobId) ?? []).some(event =>
      event.type === 'writer-acquired' && event.data.invocation === resumedA.data.invocation) && suspendedContinuationStarted, 30_000);
    await opened.service.close();
    resuming = true;
    const reopened = await openCapabilityRuns(fixture.root, options);
    cleanups.push(() => reopened.service.close());
    expect(reopened.recovery.effects, JSON.stringify({ recovery: reopened.recovery,
      tail: (await runEventsOnDisk(fixture.root, 'need', receipt.jobId)).slice(-12) })).toContainEqual(
      expect.stringContaining('continued unfinished tasks through ordinary execution'));
    await until(() => (reopened.service.events('need', receipt.jobId) ?? []).some(event =>
      event.type === 'iteration-closed' && event.data.iteration === 'work-item:richer-a-fact.i01') ||
      (reopened.service.events('need', receipt.jobId) ?? []).some(event => event.type === 'job-failed'), 45_000);
    const restarted = await runEventsOnDisk(fixture.root, 'need', receipt.jobId);
    expect(restarted.filter(event => event.type === 'job-failed'), JSON.stringify(restarted.slice(-15))).toHaveLength(0);
    expect(restarted.filter(event => event.type === 'capability-handed-back' && event.data.task === 'capability-task:provide-source-fact')).toHaveLength(1);
    expect(restarted.filter(event => event.type === 'iteration-closed' && event.data.iteration === 'work-item:richer-a-fact.i01')).toHaveLength(1);
    expect(restarted.filter(event => event.type === 'invocation-started' && event.data.work.iteration === 'work-item:richer-a-fact.i01' &&
      event.sequence > handbackEvent.sequence).length).toBeGreaterThanOrEqual(2);
    await stopStable(reopened.service, receipt.jobId);
    await reopened.service.settled('need', receipt.jobId);
    return;
  }
  if (mode === 'deferred') {
    await until(() => deferredBriefing.length > 0 || (opened.service.events('need', receipt.jobId) ?? []).some(event =>
      event.type === 'job-failed'), 30_000).catch(async error => {
        const current = await runEventsOnDisk(fixture.root, 'need', receipt.jobId);
        throw new Error(`${String(error)}; after handback ${JSON.stringify(current.slice(-25))}`);
      });
    if (deferredBriefing.length === 0) {
      const current = await runEventsOnDisk(fixture.root, 'need', receipt.jobId);
      const gates = await Promise.all(current.filter(event => event.type === 'gate-attempted' && event.data.checkpoint === 'work-item')
        .map(async event => event.type === 'gate-attempted'
          ? JSON.parse(await readFile(runPath(fixture.root, 'need', receipt.jobId, `gates/${event.data.gate}/attempt.json`), 'utf8')) : null));
      throw new Error(`B did not start: ${JSON.stringify({ events: current.slice(-30), gates })}`);
    }
    expect(deferredBriefing).toContain('# Intervening capability work');
    expect(deferredBriefing).toContain('Task capability-task:provide-source-fact returned tree');
    expect(deferredBriefing).toContain('Plan capability-task:provide-source-fact');
    expect(deferredBriefing).toContain('readFact, FactResult at subs/b/src/fact.ts');
    expect(deferredBriefing).toContain(composedSummary);
    expect(deferredBriefing).toContain(remainingConsumer);
    expect(deferredBriefing).toContain('Reassess its prior outline, decisions and any unexecuted assignment against the current source before assigning it.');
    const current = opened.service.events('need', receipt.jobId)!;
    expect(current.filter(event => event.type === 'iteration-assigned' && event.sequence > handbackEvent.sequence)).toHaveLength(0);
    await stopStable(opened.service, receipt.jobId);
    await opened.service.settled('need', receipt.jobId);
    return;
  }
  await until(() => (opened.service.events('need', receipt.jobId) ?? []).some(event => event.type === 'capability-delegated' &&
    event.data.task === 'capability-task:revised-source-fact'), 30_000).catch(async error => {
      const events = await runEventsOnDisk(fixture.root, 'need', receipt.jobId);
      const failed = events.filter(event => event.type === 'invocation-ended' && event.data.ended === 'failed').at(-1);
      const failedOutcome = failed?.type === 'invocation-ended' ? await readFile(runPath(fixture.root, 'need', receipt.jobId, runLayout.outcome(failed.data.invocation)), 'utf8') : null;
      throw new Error(`${String(error)}; failed outcome ${failedOutcome}; post-handback events ${JSON.stringify(events.slice(-20))}`);
    });
  // The ledger event becomes observable before its record files finish
  // materializing. Wait for the projection this assertion actually reads.
  let revisionTaskText = '';
  await until(async () => {
    try {
      revisionTaskText = await readFile(runPath(fixture.root, 'need', receipt.jobId,
        'capabilities/capability-task%3Arevised-source-fact/task.json'), 'utf8');
      return true;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false;
      throw error;
    }
  }, 30_000);
  const revisionTask = JSON.parse(revisionTaskText) as { revises?: { handback: { id: string; hash: string }; sourceRevision: string } };
  const localQualifications = (opened.service.events('need', receipt.jobId) ?? []).filter(event => event.type === 'invocation-started' && event.data.role === 'local-architect' && event.data.work.request !== undefined);
  expect(localQualifications).toHaveLength(2);
  const firstQualification = localQualifications[0]!;
  const nextQualification = localQualifications[1]!;
  if (firstQualification.type !== 'invocation-started' || nextQualification.type !== 'invocation-started') throw new Error('Qualification identities are unavailable');
  const acceptedParent = JSON.parse(await readFile(runPath(fixture.root, 'need', receipt.jobId, runLayout.outcome(firstQualification.data.invocation)), 'utf8')) as { session: { ref: string } };
  const originalAction = JSON.parse(await readFile(runPath(fixture.root, 'need', receipt.jobId, runLayout.invocation(firstQualification.data.invocation)), 'utf8')) as { session: { from: string } };
  const nextAction = JSON.parse(await readFile(runPath(fixture.root, 'need', receipt.jobId, runLayout.invocation(nextQualification.data.invocation)), 'utf8')) as { session: { from: string } };
  expect(nextQualification.data.session).toBe(firstQualification.data.session);
  expect(nextAction.session.from).toBe(acceptedParent.session.ref);
  expect(nextAction.session.from).not.toBe(originalAction.session.from);
  expect(revisionTask.revises?.handback.id).toBe('capability-task:provide-source-fact');
  expect(revisionTask.revises?.sourceRevision).toBeTruthy();
  expect((opened.service.events('need', receipt.jobId) ?? []).filter(event => event.type === 'capability-handed-back' &&
    event.data.task === 'capability-task:provide-source-fact')).toHaveLength(1);
  await stopStable(opened.service, receipt.jobId);
  await opened.service.settled('need', receipt.jobId);
  await inspect?.({ root: fixture.root, planId: 'need', runId: receipt.jobId });
}

async function stopStable(service: Awaited<ReturnType<typeof openCapabilityRuns>>['service'], jobId: string): Promise<void> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const current = service.events('need', jobId)!;
    try { await service.execute(stopRun('need', jobId, current.at(-1)!.sequence)); return; }
    catch (error) { if (!String(error).includes('at version')) throw error; }
  }
  throw new Error('The capability run did not yield a stable stop version');
}

/** The checkpoint of the gate a configured request belongs to: its operation record, or readiness, which writes none. */
async function gateCheckpoint(root: string, input: ConfiguredAuditInput): Promise<Checkpoint> {
  try {
    const operation = JSON.parse(await readFile(join(root, 'plans/need/.harness/jobs', input.runId, 'gates', input.attemptId, 'operation.json'), 'utf8')) as
      { checkpoint?: Checkpoint; body?: { checkpoint?: Checkpoint } };
    return operation.checkpoint ?? operation.body?.checkpoint ?? 'readiness';
  } catch {
    return 'readiness';
  }
}
