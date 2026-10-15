# KPI collection composition: sc-001 / sc-007 qualification history

## Current repair: clean-checkout contract assertions

The original proposal below failed committed gate ga-0002 on candidate bc69529e564a875ae6bca49393e17861fe3f8b9c. Preserve audit 20261014T222715Z-84f064:ga-0002, report 9b6cbbed0b08044d16161cfe9542ac239cf2b4f9, ref refs/audited/runs/2026-10-14T23-30-40Z-bc69529e5. Its composed verdict was fail with two outstanding failures. Cucumber sc-001 at provider-backed-run-measurements.feature:15 failed its initial Given on missing src/.ramify projections queries.ts.md; the Vitest case `real execution collects and persists KPI measurements for the composed HTTP readers` failed contracts() on missing src/.ramify KPI capture.ts.md. These generated/gitignored pages were absent in the actual clean audit worktree according to the operator's read-only verification. This is a reproducibility defect in my fixture, not infrastructure flakiness. The supplied audit reports Vitest 3361 passed/1 failed/2 existing skips over 417 selected files, Cucumber 7 passed/1 failed (84 passed/1 failed/6 skipped steps); type/self/build/patch checks passed. Local focused passes did not establish clean-checkout reproducibility.

Both failing sites are repaired. The Given and contracts() now assert committed child module declarations: the original capture/line/query symbols and every companion previously checked remain required with the correct defining file and parent audience. Actual imported RunQueries/SessionQueries methods are checked, and committed production consumer imports of captureSnapshot/takeLineSnapshot/lineEvents/invocationScopeSize and named scope types are asserted. Required configured type/self checks enforce the real typed import/access contracts; these textual checks do not manufacture compiler evidence or claim exhaustive signature analysis. The retired parent kpi directory assertion remains. All collection, persistence, baseline, scope, line, populated-session and HTTP assertions are unchanged.

Both new helpers and both step files were scanned. There is no runtime requester-API-page read remaining. module.ramify is a committed declaration filename, and the .ramify-architect directory in the stimulus is deliberately published factual measurement evidence inside the disposable fixture, not an assumed engineer API view. No file-exists skip, generated-view commit, materialization/process exemption, feature/discovery/configuration change or provider-internal change was introduced.

Current engineer-only API inspection uses ordinary and testing views separately at supplied revision rev/1:0c6c53d9-7f36-47b4-b6a2-204adb9819d4:36, retaining ordinary1/testing28 coverage limits. Capture/line/query originals and named companions remain received; truncated/inferred signatures still limit exhaustive closure claims. Generated views are not prerequisites for executing these tests.

Repair verification (inv-0016 receipts): shell/004.log reran exactly the 20-file test:quick selection listed below: 217 passed, exit0, no failures/skips. It also ran all four configured type-check projects (exit0) and check:self (exit0, completed/passed, partial coverage; 0 errors/warnings/denied, 457 limits, 18478 accesses). shell/005.log used the unchanged exact prepared config/profile/file selection: sc-001/sc-007 passed; sc-002/003/004/005/006/008/009 undefined; 9 scenarios (2 passed,7 undefined), 110 steps (66 passed,44 undefined), exit1, no failed/ambiguous/skipped cases. The seven unassigned undefined cases remain uncompleted. Native witnesses were not rerun during this contract-only repair; the earlier exact 4-file/21-pass receipt remains historical evidence.

No repaired clean committed audit was independently run or claimed here; the gate owns candidate commitment and configured audit selection/reuse. ga-0002 remains failed until the responsible workflow supplies a qualifying verdict for the repair. No Git command, clean-worktree mutation or whole-suite audit bypass occurred. Remaining orchestration/ancestry/browser/unassigned-scenario limits below still apply.

## Original proposal evidence (historical; superseded runtime API checks)

This is a bounded completion proposal, not a committed-audit verdict or completion of the plan. Historical acceptance/ancestry identities and readiness reports in the assignment are supplied receipts, not independently inspected here. No Git command, history repair, merge or push was performed. Interrupted histories remain incomplete. Root results.md remains preliminary and untouched.

## Current implementation

- Exact frozen bindings: src/tests/steps/kpi-run-collection.ts and kpi-scope-collection.ts. Effective default/prepared configurations and existing globally loaded step expressions were inspected; the prepared run found no ambiguity. No feature, discovery, exemption, declaration, protocol or production algorithm changed.
- sc-001 drives the existing two-work-item scripted protocol stimulus through real RunService/shared InvocationRunner, captures the real KPI snapshot/scopes/line events, and reads the actual durable records. Notes and drafts have accepted external Git commit answers. Real RunQueries and populated SessionQueries/runSessions/runSession are consumed in-process and through loopback HTTP.
- Independent assertions include the external document/hash, source510/API10 writer components, owned line1 added/1 deleted with nonbinary bytes=null, measured baseline source1330/API25/architect6 plus unique recorded support, kpi/1, scope-size/2, lineage/2, and session evaluation line/scope values. HTTP answers preserve the complete in-process responses, not just metrics from an empty session fixture.
- The new module is absent from the first frozen measurement document. Its resulting unknown scope retains null complete value/numerator, complete-size weight1, coverage3/4, known byte-line subtotal, and the explicit missing-module/not-zero reason. This qualification is asserted rather than changed to measured merely to pass the test.
- sc-007 translates real WriteScope and delivered manifests, then uses real captureSnapshot/invocationScopeSize. Repeated role/skill identities retain bytes20/10 and brief5; exact p/a plus subtree p counts source1330/API25/support35 only once, total1390. Captured snapshot/document/hash and component order are independently asserted. Incompatible rev/1:g:1 versus rev/1:g:2 retains unavailable owned/API components, measured unselected architect0, support35 and subtotal35.
- Reusable helpers use node:assert so Cucumber does not import Vitest. Scratch response helpers were factored into scratch-git.ts, re-exported from mock-git.ts for existing users. candidates.ts, scripted-git.ts and protocol-ports.ts keep their existing assertions using node:assert; runs.ts imports the runner-neutral scratch helper. Existing protocol stimuli are reused, not a new workflow framework.
- Manual steps-run regression adds explicit null baseline measurement, exact owned-source/support-documents component order and partial/null complete value assertions. Existing provider qualification regressions remain child-owned.

## Fake/fixture inventory

KPI calculators are never substituted. FakeScopeMeasurementCli scripts only external Ramify measurement JSON. FakeRunMeasurementCli extends existing FakeRamifyCli for CLI/ownership answers, and uses those factual buckets. FakeRunChangeHistory scripts only Git history/diff/origin/last-seen answers. createFakeRunLineGit scripts Git working-tree line snapshots. createFakeRunExecutionPorts names the existing protocolPorts combination of scripted external Git/candidate/audit/agent/command answers. Agents execute guarded fixture edits; these are not ledger/query answers supplied by a calculator fake. Temporary projects, loopback servers and services are disposed.

Bindings proposed:
- sc-001: FakeRunMeasurementCli, FakeScopeMeasurementCli, FakeRamifyCli, FakeRunChangeHistory, createFakeRunLineGit, createFakeRunExecutionPorts.
- sc-007: FakeScopeMeasurementCli.

## Focused execution receipts

Tool shell logs are preserved by the running harness under its invocation's shell directory. Counts below are per command, not additive unique totals.

`npm run test:quick --` with these exact project-relative filters (shell/027.log): **20 files, 217 passed, exit0, no skips**:

```
subs/harness/src/tests/kpi-run-collection.test.ts
subs/harness/src/tests/kpi-scope-collection.test.ts
subs/harness/src/tests/measurement-inputs.test.ts
subs/harness/src/tests/measurement.test.ts
subs/harness/src/tests/scope-size-recipe.test.ts
subs/harness/src/tests/steps-run.test.ts
subs/harness/src/tests/steps-from-run.test.ts
subs/harness/src/tests/projections-pure.test.ts
subs/harness/subs/kpi/src/tests/measurement.test.ts
subs/harness/subs/kpi/src/tests/scope-size-recipe.test.ts
subs/harness/subs/kpi/src/tests/lines.test.ts
subs/harness/subs/kpi/src/tests/metrics.test.ts
subs/harness/subs/kpi/src/tests/efficiency.test.ts
subs/harness/subs/kpi/src/tests/exploration.test.ts
subs/harness/subs/kpi/src/tests/lineage.test.ts
subs/harness/subs/kpi/src/tests/delivered-change.test.ts
subs/harness/subs/kpi/src/tests/setup-attribution.test.ts
subs/harness/subs/projections/src/tests/kpi-metrics.test.ts
subs/harness/subs/projections/src/tests/efficiency-provenance.test.ts
subs/harness/subs/projections/src/tests/lineage-metrics.test.ts
```

These include unchanged independent weighted2500/numerator100000/denominator40, ratio.25/reduction4, missing-scope subtotals, zero versus failed-history, timing/charges/search uncertainty, lineage, setup and scope qualifications. Measurement flow retains its actual-provider call-through spies and returned snapshot/invocation durable equality assertions.

Additional `test:quick` exact filters (shell/030.log): **4 files, 64 passed, exit0, no skips**:

```
subs/harness/src/tests/steps-run.test.ts
subs/harness/src/tests/plan23-observation-integration.test.ts
subs/harness/src/tests/plan23-exploration-metrics.test.ts
subs/harness/src/tests/composition.test.ts
```

Latest changed-fixture/manual recheck after the last source correction (shell/032.log): **3 files, 13 passed, exit0**: kpi-run-collection.test.ts, kpi-scope-collection.test.ts, steps-run.test.ts under subs/harness/src/tests/.

`npm run test:boundaries --` exact unchanged registered files (shell/029.log): **4 files, 21 passed, exit0, no skips**:

```
subs/harness/src/tests/measurement.boundary.test.ts
subs/harness/src/tests/plan23-trial-attribution.boundary.test.ts
subs/harness/src/tests/unguarded-write.test.ts
subs/harness/subs/evidence/src/tests/git.test.ts
```

Installed measurement, actual Git, public trial attribution CLI/target cwd, and shell mutation witnesses remain at their existing registrations. No native exemption was introduced.

Latest `npm run type-check`: **exit0**, all four configured TypeScript projects (shell/032.log).
Latest `npm run check:self`: **exit0, completed/passed, partial coverage; 0 errors, 0 warnings, 0 denied, 457 analysis limits**, 15 owners/949 source files/18479 accesses (shell/032.log). Some edit-time checks timed out and verified nothing; they are not counted as passes.

## Prepared generated feature

The exact prepared cucumber-focused-70135bd2c8f341fc.json / ramify-focused command selects only provider-backed-run-measurements.feature, enabling its pending scenarios. Latest shell/034.log: **9 scenarios: 2 passed (sc-001/sc-007), 7 undefined (sc-002/003/004/005/006/008/009); 110 steps: 66 passed, 44 undefined; exit1**. No failed, ambiguous, skipped or zero-execution result is being called passing. Unassigned cases remain undefined, not completed or newly bound. The earlier feature run (shell/021.log) failed sc-001's initial overly specific declaration-text assertion; it was corrected to check the actual received projections contract, not a guessed declaration spelling.

Other earlier focused failures were fixture mistakes: metrics uses policyVersion rather than policy; nonbinary line summaries deliberately retain bytes=null; history is read twice before the explicit HTTP round rather than once; a bootstrapped owner absent from the frozen document is unavailable rather than measured; and a class-field initializer read a constructor parameter property before initialization. Each was investigated/corrected without modifying provider behavior. The transient missing lineEventsSchema import was corrected to the existing lineEventSummarySchema. Original logs remain receipts; later passing runs do not relabel them.

## Access and remaining limits

Requester ordinary/testing views were used separately at supplied revision rev/1:0c6c53d9-7f36-47b4-b6a2-204adb9819d4:3 (ordinary1/testing28 coverage limits). Named capture, line and query companions are checked in both views; full check:self finds no denied import. View absence under limits and truncated/inferred signatures do not establish exhaustive signature closure. The old parent production kpi directory remains absent.

Runner prepareInvocation was inspected: invocationReadSize precedes location acquisition; null snapshot skips acquisition; the local readSize survives a later failure; child invocationScopeSize/invocationScopeFailure supply qualifications before the harness commits invocation-prepared. No new end-to-end acquisition-failure injection was added. Existing child scope qualification cases, unchanged runner source, live collection and manual regression are the evidence decomposition; they do not constitute exhaustive orchestration-failure coverage.

No concrete missing provider/exposure capability was found. Native installed conformance comes from the unchanged registered witnesses, not synthetic CLI facts. Historical merged-base identities/cleanliness are supplied observations, not independently verified in this task. Later usage/search-specific session acceptance (sc-008), the seven unassigned scenarios, browser build/acceptance and root final report remain outside this binding proposal. No direct whole suite, default audit or browser run was executed; the gate owns committed verification and its verdict.
