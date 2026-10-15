# KPI extraction results

## Final run outcome — operator receipt, 2026-10-15

Continuation run `20261014T222715Z-84f064` completed at event 1119 after both
work items and all ten acceptance examples were architect-accepted. The final
implementation commit is `9ddef5c0271bab3dc2a108bd99f3faafcd3ba077`, tree
`1f9b6b4724179fa86f850aed854f98a873e117af`, on
`ramify-agent-run/20261014T222715Z-84f064`. The operator independently observed
its clean checkout, unchanged captured-plan and restored-native hashes, and
incorporation ancestry. The original interrupted run remains historical.

Final gate `ga-0014` freshly passed all six configured checks with requested and
executed mode `full`, nested discovery complete, and one configured project
(the root). Report `eb6d44eb88633cdfbceecfc35e0809471bb6e66b`, ref
`refs/audited/runs/2026-10-15T05-50-16Z-9ddef5c02`, binds that exact commit/tree.
It has no reused baseline. Its results are:

- Regression: 3766 passed, two inherited opt-in skips, zero failures; all 455
  configured files accounted for (454 passed, one skipped).
- Cucumber: 16 scenarios and 252 steps passed, including all ten KPI examples
  and six prior projections scenarios; zero failed, skipped or undefined cases.
  The step count includes hooks.
- Type checks, patch integrity, structural verification and web build passed.
  Structural coverage is partial: 457 analysis limits, zero errors, warnings or
  denied accesses; this remains an explicit verification limit.
- Audit duration: 729.057 seconds; regression duration: 665.338 seconds.

The operator then ran `node_modules/.bin/ramify-audit audit --cwd . --json` on
the clean implementation commit. Exit 0 reused this exact fresh full report,
with no ignored changed paths, chain depth zero and zero outstanding failures.
That default invocation supplied applicable evidence without a second execution.

### Merge standing and current-main qualification

The completed run's public merge-readiness response at version 1119 is
`pending-review`: assessment `nfa-003` on the same candidate tree leaves 32
evidence judgments undetermined, recorded as `cf-0002` through `cf-0033`.
No user acceptance, rejection or waiver has been submitted. These cover
historical/process evidence excluded from the source-only assessment and final
candidate/audit facts that became available after it ran. The passing final
gate preserves that assessment rather than rewriting unknowns as satisfied.

Main independently advanced to `8374e17e036211dce2653079b17e93dc10be5147`,
adopting ramify-audit 0.9.3. A conflict-free detached merge preview was prepared
at `46fd84c7027cb4b5cf92ddefaf0be298a0bd7cbf`, tree
`4ae657ae91c14d3dab013c5276acd8e09b7e6339`, with its own `npm ci` installation.
Its default audit selected full execution because 104 changed paths exceeded
the drift limit of 25. That full integration audit failed one regression case:
`review-questions.test.ts` expected six review dispatches and observed five.
Report `990ca205298f657a4bde2a8e102cefd8b73fcee5`, ref
`refs/audited/runs/2026-10-15T06-05-50Z-46fd84c70`, retains the failure: 3765
tests passed, one failed, two inherited skips; all 16 scenarios/252 steps and
the other five checks passed. The earlier extraction gate remains separately
passed.

The unchanged four-case file passed a focused rerun. The fixture's attempt
and settlement bounds are both 60000 ms; wall-clock advancement after the
completion request can legitimately expire its final queued review. This case
witnesses fork fallback, so the operator supplied a scheduler clock fixed at
the case's captured start time. All six exact dispatch, degradation, failure
and invocation-uniqueness assertions remain. A first trial using a hard-coded
past date passed with timer-overflow warnings; the captured-start correction
passed all four cases without those warnings. Production deadlines are unchanged.

The four-line test-only fix is `b2b6cd4eae1ac4d37f9de379096bfe244c018393`
in the review checkout and `c79dc70d407652c1fff6405837bb58ca2a92864d`
on the extraction branch. Its default integration audit retry passed, report
`0eb97f09a8abf7b33aeef09d138ec20e717d7cdf`, ref
`refs/audited/runs/2026-10-15T06-12-33Z-b2b6cd4ea`, tree
`86eaa58ce579b4f24ad5294fa542a685085caa34`. The auditor selected partial scope:
all five selected checks passed, including the exact carried failure's four-case
file (four passed, zero failures/skips); scenarios reuse the full integration
report. Composition is pass, chain depth one, zero outstanding failures;
duration 87.01 seconds. The earlier failed full report remains unchanged.
Neither source branch nor main has been merged or pushed.

### Remaining limits and contribution attribution

Fetching the completed run's session list from frozen runtime `f24924a7…`
exposed an existing protocol error: HTTP 500 rejects
`sessions[60].work.nonfunctionalRepair`. The durable work schema includes that
field, while the strict transcript work schema omits it. Those schemas and
the session projection are unchanged from baseline `0c74a7d2` through the
implementation commit. Deferred harness issue `ramify-agent-ewk` records the
exact response and affected surfaces; no schema or implementation repair is
claimed. Metrics and merge-readiness queries succeeded. The supported historical
reader qualification below retains its stated limits.

This final receipt is an operator report-only follow-up after the completed
run's idle server was stopped and settled. Implementation, tests, declarations,
configuration, frozen plans and authoritative execution records are unchanged.
The implementation's gate identity above remains separate from this document's
later commit. The remaining sections preserve the earlier contributions and
their evidence at the time they were written, including their pending checks,
failures, repair incidents, supplied provenance and interrupted-run limits.
No performance or provider cache benefit is claimed.

## Consolidated delivery report — nfr-repair-001

This is the current root-owned reconciliation for supplied source tree
`0441c1d02896b9feef34f20b772836e3f0ca4f09`, not a final acceptance or audit
verdict. The harness handback and repaired root qualification are consolidated
below. The historical record following this section is preserved verbatim;
its “in progress”, “current”, pending items and old paths describe those earlier
contributions, not a new assessment of this source. In particular, the original
run remains interrupted/incomplete. **Final clean committed qualification is
pending.** No future final gate pass or self-referential final commit is claimed.

### Evidence authority and identity ledger

This documentation repair read the existing owner reports, retirement case map,
root qualification source and available accepted investigation submission
`plans/kpi-extraction/.harness/jobs/20261014T222715Z-84f064/invocations/inv-0074/submission.json`
before using its findings. The investigation inspected surviving independent
assertions and native registrations without execution; it did not authenticate
historical deleted bodies or execution artifacts. Its broader observations are
used here only to reconcile the assigned nfr-005/nfr-028 reporting defect.

Source assertions, attributed execution receipts and supplied provenance are
separate evidence classes. Test source demonstrates assertions exist, not that
they executed. Counts/hashes below are attributed to the cited owner/operator
receipts; this repair did not authenticate their original command outputs,
audit objects, ancestry or historical clean status. **No new authenticated
execution of tests, scenarios, type checks, build or audit is supplied by this
repair.** The available evidence does not establish the later final gate.

| Identity | Available value and authority |
| --- | --- |
| Projections acceptance / incorporation | Supplied `f227116f16514dd3500b2f4ae1e716272af1845a` / `9f63d4e4660fba64c004941b2acab2c95eec46fc`; linear incorporation, not a two-parent merge. The old `9f63d5a2` is a transcription error. |
| Original implementation baseline / materialization | Supplied `bad37865e1a3518b1a5d3a9923044d494a420025` / `dd35d5a2d03f3dc1e0bf1de60ae6de2587023b1f`. |
| Original bootstrap / run | Supplied runtime `7515b630217b71ef83f203e8cb73c2642a001532` / `20261014T103040Z-9c4e05`; not the continuation runtime or a completed original run. |
| Continuation bootstrap | Operator-supplied `f24924a7cae1af97cc3e626e507a14d131682338`, tree `1e76616d1161dc23adb1a26498f12d79351a67c2`, report `2434a9023a22a78a3ffd285fee2d343b53fa0b94`. This supplies the provenance previously unavailable in the harness handback, not independent verification here. |
| Continuation run / baseline | `20261014T222715Z-84f064`; supplied pre-scenario commit `41c8e9f247344e3e5e01c5bae6ba69bf2f4a295c`, readiness tree `39494a0d1e847cc36c26b662c7a610c8a54e6abb`, report `5a3101bdbc451fd2621a4b6ecb9adb747ad2bffc`. Harness handback separately records continuation materialization `19b4bb0c4a94dee0fe8d2d23cb929a507349a79d`. |
| Owner handback boundaries | Harness supplied start `37d9d41a6ccd9f2165df9e249a41f4e6c515f5b7`; root supplied accepted boundary `c633eeb62a67457c8465f3128eff6b12e52ccbcc`. These are distinct contribution boundaries. |
| Inspected prepared candidate | Task-supplied head `6009091597f970e7abf91723e3fa9460e35f13dc`, tree `0441c1d02896b9feef34f20b772836e3f0ca4f09`; accepted-boundary comparison has no changed paths. That binds supplied source, not historical preservation, clean qualification or a later accepted final candidate. |
| Final candidate | **Unavailable/pending:** the later gate must record its own committed candidate and qualification. This report does not invent its own final commit identity. |

The canonical authored-plan sibling remains `main-plan.md`; this report is
`docs/plans/46-kpi-extraction/results.md`, outside captured `plans/kpi-extraction`.
Original and continuation preparation reports, audit refs, runtime versions and
terminal-restart limitations remain in the unchanged historical sections below.

### Consolidated source and API ownership comparison

The final inventory in [measurement-retirement.md](../../../subs/harness/measurement-retirement.md),
[measurement-integration.md](../../../subs/harness/measurement-integration.md) and
[kpi-delivery-handback.md](../../../subs/harness/kpi-delivery-handback.md) replaces
the early parent-directory description as the current ownership comparison:

| Responsibility formerly in parent KPI implementation | Current defining owner / actual consumer and retained cost |
| --- | --- |
| Snapshot/component accounting, deduplication, revisions, invocation qualification | Ordinary untagged KPI `capture.ts`; harness `run/service.ts` supplies baseline/scope facts. `measurement/inputs.ts` translates delivered manifests, source/hash/bytes, exact-owner/subtree/nested/read selections and acquires locations. `steps/runner.ts` obtains read size before location acquisition, qualifies success/failure through KPI, then commits scope. |
| Line snapshots/deltas, overlap/binary/unmapped qualifications | KPI `lines.ts`; harness chooses collection timing and commits returned records. |
| Accepted-final attribution, exact setup exclusions, shared writers, bounded history cache | KPI `delivered.ts` and `setup-attribution.ts`; projections `metrics.ts` supplies recorded writers/history. Root `scripts/trial-attribution.ts` authenticates raw objects/diffs/blame and calls the actual selected verifier, retaining adaptation, durable-effect correlation and CLI 0/1/2 distinctions. |
| Metrics/comparison, lineage, exploration, guarding, recorded timing/charges | KPI `metrics.ts`, `lineage.ts`, `exploration.ts`, `guarding.ts`, `efficiency.ts`; actual projections metrics/lineage consumers and harness `run/port-events.ts` use selected entries. Session aggregation is child-private. |
| General owner lookup and protected report destination | Remain harness `measurement/owners.ts` (reviews, equipment, excursions and lines consumers) and `qualification/trial-report.ts` (root trial/live-trial/live-session consumers). Contract-validation lookup in `contracts/parity.ts` is not a duplicate calculator. |
| Execution and effects | Harness retains admission, scheduling, settlement, recovery and **sole durable writing**. Evidence owns Git/measurement/CLI acquisition contracts. No writable service or ledger is a KPI input. |

The legacy `subs/harness/src/kpi/` directory has been removed, not converted to
forwarders. The handback's bounded resolved-relative-import scan found no imports
into it; this is not universal dynamic-import evidence. No algorithms were
changed by this reporting repair.

Selected public entries/companions, rather than whole implementation files, are:

- Capture: `captureSnapshot`, `baselineScope`, `scopeSize`, `revisionMismatch`,
  `rootModuleOfSnapshot`, `deliveredScopeInputs`, `invocationReadSize`,
  `invocationScopeSize`, `invocationScopeFailure`; `SnapshotRequest`,
  `DeclaredScope`, `DeliveredScopeInputs`, `DeliveredSupportEntry`,
  `DeliveredSupportSource`, `InvocationScopeDeclaration`.
- Lines/delivered/setup: `takeLineSnapshot`, `lineEvents`, `LineChange`,
  `LineSnapshot`, `LineEventRequest`; `deliveredChange`, `cachedChangeHistory`,
  `DeliveredChangeRequest`, `DeliveredChange`, `HarnessLineIdentities`;
  `verifySetupLineIdentities`, `SetupLineIdentityInput`, `RecordedSetupDelta`,
  `SetupCandidatePartition`, `SetupLineMappingFacts`, `SetupSourceLine`,
  `SetupAddedLineFact`, `SetupDeletedLineFact`.
- Metrics/lineage: `kpiMetrics`, `comparableScopeMetrics`, `kpiPolicyVersion`,
  `measurementPolicyVersion`, `InvocationFacts`, `MetricInputs`, `ScopeComparison`;
  `lineageMetrics`, `lineagePolicyVersion`, `LineageInputs`, `SegmentFacts`,
  `SegmentUsage`, `StartKind`.
- Exploration/efficiency/guarding: `explorationDetails`, `ExplorationObservation`,
  `ExplorationMetrics`, `SearchCount`, `SearchCounts`; `invocationTiming`,
  `estimateRecordedCharge`, `InvocationTiming`, `ChargeInput`, `RecordedCharge`;
  `guardingReport`, `GuardingReport`, `GuardVerdictCounts`.

Removed selections are `sessionMetrics`, `SessionEntry`, `SessionMetrics`,
`componentSubtotal`, `scopeSizePolicy`, `projectOnlySize`; local helpers are not
public APIs. Foreign companions remain evidence-owned Git/history/measurement/CLI
and harness-owned records/observation/protocol vocabulary, not copied definitions.
Harness selected descendant re-exposures give projections access even when imports
name defining child files. Parent re-exposures give root the verifier and full
input/mapping/identity closure. Root descendant exposures remain protocol-only,
not browser-tagged KPI algorithms. Declaration assertions are not exhaustive
transitive browser-bundle proof.

The descendant grants cover the **whole harness subtree**, including agent/Pi,
audit, check-findings, evidence, KPI, ledger, nonfunctional, plan-evidence,
projections and scenarios. This visibility, factual translation and signature
coordination remain integration costs; they do not prove every descendant uses
every grant or give KPI process/writing authority. Nested owned fixture projects
remain separate trees.

Requester evidence must not be merged across revisions. Harness ordinary/testing
views were separately reported at `rev/1:0c6c53d9-7f36-47b4-b6a2-204adb9819d4:102`,
with nine selected pages byte-identical but separate access rights and limits
1/28. Root ordinary/testing refresh after restoration was separately reported at
`rev/1:600cf346-c915-4a3c-aa7f-5ce986315dc3:12`, limits 39/80, two truncations
each, exposing verifier/input/line-fact/return companions and destination helper.
The harness slice supplied no current root/projections requester pages; the later
root slice does not retroactively fill its projections gap. Earlier revisions and
the task's supplied revision/coverage remain distinct observations. Truncated and
inferred signatures prevent exhaustive closure claims; absence is not proof of
unavailability.

### Actual moved, retired and retained tests

The [case map](../../../subs/harness/src/tests/measurement-parity/README.md)
provides ordered/same-title assertion mappings, not just suite names. Investigation
inv-0074 corroborates current independent literals/schema/errors/order assertions
and native registrations. Exact old-body equivalence remains attributed to the
retirement inspection, not freshly authenticated from deleted Git blobs here.

| Retired/moved source | Independent surviving assertions / retained boundary |
| --- | --- |
| Five transitional coordinator suites, 45 bodies | Child efficiency3, exploration7, guarding3, lineage13, metrics19. Transitional parent/child equalities retire, not the independent oracles. `measurement-parity` now contains README/history only. |
| Parent metrics18 | Child metrics cases1–18 plus existing case19: schema parsing, weighted100000/40=2500, ratio.25/inverse4, missing subtotal10000/weight10, overlap/partial states, unavailable versus zero, fresh-history4000. |
| Parent delivered16 | Fifteen same-title child delivered attribution/cache cases; overlapping snapshot body relocated to child `lines.test.ts` (added3/deleted0 with partial overlapping-writers reason). Child's additional bounded-cache case remains; it is not a benefit claim. |
| Parent pure exploration7 and timing/charge2 | Child exploration and efficiency independent counts, timing, category charges and uncertainty. Parent retains two assignment-root/declaredRoots adapter cases; child retains conflicting-duration and guarding cases. |
| Parent pure scope duplicates/private API assertions | Child `scope-size-recipe.test.ts` retains corresponding-component120/50 and200/90, partial520/725, policy/revision mismatch, support dedup and missing/unselected qualifications. Retirement prose counts nine pure cases; the detailed map also identifies the private subtotal assertion. No new historical count is inferred. Parent retains actual manifest/write/read/location adapters, repeated brief hash orders and exact conflict Error name/message. |
| Parent pure setup-identity section | Child `setup-attribution.test.ts` retains shifted/renamed positions, exact BASE deletions, unknown/stale/invalid/missing partitions, union and reversion assertions. Normalized identity is an attributed operator comparison. Parent `plan23-trial-attribution.test.ts` retains distinct assigned-module cwd case. |
| Invocation qualification / composed consumers | Child retains absent-snapshot ordered components/subtotal25, missing-declaration replacement, failure snapshot/subtotal520/EACCES and read precedence710 through failure. Parent steps-run retains actual manual partial qualification; measurement/provider persistence, HTTP/protocol/session and reopened queries remain independently asserted. |
| Root collection and acceptance | All 27 collector cases remain root-owned, with factored raw Git helpers plus composed root qualification/browser declaration assertions. No child tests moved to root. |
| Registered native witnesses | Measurement2 installed-producer/publication-size, attribution7 real Git/CLI/cwd/destination/renamed/deletion/refusal, unguarded-write1 actual shell mutation/outside-scope/durable gate witness. Same exact registry/discovery/guards; native file damage was restored exactly before the later root receipt. |

All eleven child KPI suites and retained composed adapters are reported executed
in the handback. Native registrations and surviving source are evidence of
coverage definitions, not independent proof of execution. The seven restored
native titles and exact restoration provenance remain below. No interrupted-run
record, test, registration or discovery configuration is changed by this repair.

### Acceptance examples — evidenced outcomes, not status labels

Rows sc-001–009 consolidate the harness handback's inv-0051 prepared execution
claim (9 scenarios/137 steps); sc-010 uses post-restoration inv-0064 (1/15).
These are separate focused receipts, not additive whole-suite coverage or plan
acceptance. Fixtures script external ports only and call real providers/consumers.

| Example | Actual independently asserted outcome and qualification |
| --- | --- |
| sc-001 | Real run/provider acquisition persists snapshot/hash, source510/API10 writer scope and line1 added/1 deleted; baseline1330/API25/architect6 plus support. Populated session/evaluation and HTTP equal real in-process queries. Missing new-module scope stays unknown with null complete value/numerator and coverage3/4, not zero. |
| sc-002 | Public metrics assert (1000×10+3000×30)/40=2500, numerator100000/denominator40, baseline10000, ratio.25/inverse4, ordered writers and complete coverage. |
| sc-003 | Missing writer source leaves complete value/numerator null/unavailable; known subtotal10000/weight10, coverage1/2 and unknown weight3 of total13 remain explicit. It is not 10000/13 or missing-as-zero. |
| sc-004 | Known-zero delivery is not-applicable, distinct from failed-history unavailable with actual reason. Recorded session scope remains measured. Recorded category charges remain available at .00116 USD per invocation in both cases; no new pricing aggregate is invented. |
| sc-005 | Corrected complete literal BASE/mixed/intermediate/FINAL trees independently authenticate positions2/3 before real verifier→deliveredChange. Normal six units = setup2+writer2+uncertain overlap2; intermediate reverted writer0. Setup reversion yields setup0+writer2+overlap2; unknown additions retain setup1+writer1+unavailable2+overlap2 and exact reasons. Negative oracle rejects old position5/hash/origin/removal/truncated-range facts. Earlier position5/6 passes were invalid factual qualification, not repaired successes. |
| sc-006 | Five invocations/four sessions/five histories, coverage5/5, fresh degradation and scope subtotal1500 (not merged1400). Baseline unavailable, local fork3000 distinct from global, unknown global fork coverage0/1 and degraded fork partial1/2. |
| sc-007 | Real translation/capture qualifies repeated identities/overlap once: source1330/API25/support35, total1390. Incompatible revisions leave owned/API unavailable while support35 survives; no silent cross-revision sum. |
| sc-008 | Usage categories100 new/40 cache-read/10 cache-write/20 output; known recorded charge subtotal.00025 USD, missing output rate leaves complete charge null. Exact replay dedups; conflicting identity remains qualified, one search survives with outside-scope unavailable0/1. |
| sc-009 | Supported historical disk fixture (optional operation-ledger linkage omitted), actual close/reopen, repeated metrics/session/detail HTTP/in-process parity, acquisition counters zero, full file bytes and event sequence11 unchanged. Git history reads allowed; not proof of every historical version or modern operation-ledger behavior. |
| sc-010 | Real root collector/verifier authenticates FINAL setup line2, ordered mixed entries, unavailable added positions versus verified no-deletion[], fully reverted empty identities and exits[0,1,2,0]. Real filesystem accepts external destination, refuses in-project/alias/symlink destinations and preserves target bytes. Root declaration assertions preserve protocol-only descendant exposures; not exhaustive bundle proof. |

### Verification consolidation and limitations

Receipt roots are
`plans/kpi-extraction/.harness/jobs/20261014T222715Z-84f064/invocations/`.
The following are **reported executions**, not reruns in this documentation repair:

- `inv-0051/shell/003.log`: quick selection, 33 files/301 cases, exit0/no skips;
  eleven KPI suites included. Three stale projections filters selected nothing,
  not passes. Full exact broad filter text is not reproduced in the handback;
  its original log is required to authenticate the command, not an inferred list.
- `inv-0051/shell/009.log`: `npm run test:quick --` the exact files
  `lineage-metrics.test.ts efficiency-provenance.test.ts plan23-observation-presentation.test.ts plan23-setup-attribution.test.ts`, each under
  `subs/harness/subs/projections/src/tests/`: 4 files/28 cases, exit0/no skips;
  lineage repeats earlier coverage.
- `inv-0051/shell/015.log`: `npm run test:quick --` the exact files
  `owners.test.ts read-excursions.test.ts ownership-repair-equipment.test.ts composition.test.ts line-events.test.ts plan25-combined-delivery.test.ts`, each
  under `subs/harness/src/tests/`: 6 files/28 cases, exit0/no skips.
- `inv-0051/shell/004.log`: `npm run test:boundaries -- subs/harness/src/tests/measurement.boundary.test.ts subs/harness/src/tests/plan23-trial-attribution.boundary.test.ts subs/harness/src/tests/unguarded-write.test.ts && npm run type-check && npm run check:self`:
  3 files/10 native cases (2+7+1), four TypeScript projects, chain exit0.
  Structure partial: 457 analysis limits, zero errors/warnings/denied accesses.
  `016.log` separately reports explicit post-document `npm run check:self` exit0;
  cold/not-checked mutation hooks are not passes.
- `inv-0051/shell/005.log`: `node_modules/.bin/cucumber-js --config subs/harness/src/tmp/ramify-focused/wi-001.i08/cucumber-focused-70135bd2c8f341fc.json --profile ramify-focused`:
  9/137 pass, exit0, no failed/ambiguous/undefined/pending/skipped outcomes;
  config SHA-256 `70135bd2c8f341fc02ec9fd12ac7af9b722181fd154d73ae1aa67cbde06c88e0`.
  `006.log`'s 454 configured files are discovery, not 454-file execution.
- `inv-0064/shell/005.log`: `npm run test:quick -- src/tests/plan23-trial-collector.test.ts src/tests/root-qualification.test.ts`:
  2 files/28 cases; `npm run test:boundaries -- subs/harness/src/tests/plan23-trial-attribution.boundary.test.ts`:
  1 file/7 native cases, exit0/no skips, after exact restoration.
- `inv-0064/shell/006.log`: prepared root config
  `src/tmp/ramify-focused/wi-002.i02/cucumber-focused-00bc7d8836ee746d.json`, profile
  `ramify-focused`, SHA-256 `00bc7d8836ee746d06e7ff1f7919ec9711768ba060f6d411db970f7b05526fd0`:
  1/15 pass, exit0/no failed/undefined/ambiguous/skipped outcomes. `007.log` reports
  `npm run type-check`, `npm run check:self`, `npm run build:web` exit0;
  structure partial457 limits, build488 modules with existing >500 kB advisory.

Per-command counts overlap and must not be summed into unique coverage. Earlier
fully spelled selections and failures remain in
[kpi-collection-qualification.md](../../../subs/harness/kpi-collection-qualification.md),
[kpi-mixed-attribution-qualification.md](../../../subs/harness/kpi-mixed-attribution-qualification.md),
[kpi-weighted-query-qualification.md](../../../subs/harness/kpi-weighted-query-qualification.md)
and [kpi-query-qualification.md](../../../subs/harness/kpi-query-qualification.md).
Those notes are unchanged: ga-0002's generated-view reproducibility failure,
partial features with undefined steps, invalid original sc-005 fixture,
development schema/type/lock/category/rate/warning-count failures, unrun native
checks in some slices, timed-out hooks and unauthorized `/tmp` redirect remain
history, not newly successful checks.

Retirement audit `118a891d429a226f3ee412f607bf0b132c2e8a46` remains failed:
3754 passed/1 failed/2 opt-in skips; focused corrected M4 13/13 did not rewrite
it. Root's initial 27-pass/1-fail expectation correction, accidental native
JSON overwrite, pre-damage passes and exact restoration remain separately
recorded below. Two inherited whole-suite opt-in skips were not relabeled passed.

Audit provenance below remains supplied, not fresh execution here: ga-0007 full
on `37d9d41a…`/tree `ecd48288…`, report `f1fca4af…`, claimed3765 tests/two skips
and15 scenarios/222 steps; ga-0008 freshly checked patch/type/structure/build
while reusing tests/scenarios; ga-0009 reused composed evidence. ga-0010 on
`fb7edc86…` failed patch-integrity despite supplied passing tests/scenarios;
ga-0011 on `b7f62cdf…` reused that failed record. Operator force-default recovery
on `b7f62cdf…`/tree `947c1057…`, report `f67750ca…`, freshly passed non-test checks
and reused tests/scenarios; it was not a fresh whole-suite run or later ordinary
gate. Complete identities/refs/counts remain in their historical receipts below.

### Remaining delivery obligations

This reconciliation completes the bounded documentation integration, not NFR
satisfaction or final semantic acceptance. Pending are the later **clean committed
candidate identity and candidate-bound configured qualification**, its own final
audit/report verdict and coordinator reassessment. Original execution artifacts,
ancestry, historical byte-equivalence and final clean status are not authenticated
by consolidating prose. Acquire existing authoritative receipts if authentication
is needed; do not replace unknowns with inferred passes. No implementation,
tests, frozen scenarios, declarations, discovery, audit configuration or captured
run records were edited. No performance or provider cache benefit is claimed.

## Historical record (unchanged)

## Status

Implementation in progress. The original run retained audited source e99a3ae8
and passing partial query-test additions but is blocked by an interrupted
consultation effect without a completion receipt. The continuation worktree
retains those source changes at 4b6c1744, and incorporates the three independently
committed guidance changes through main 0c74a7d2. Its own execution must establish
all acceptance outcomes and final qualification. No scenario completion,
performance benefit or cache benefit is claimed here.

The sections below retain the original root-baseline handback and its historical
paths and commands. They describe that early iteration, not the present source:
root setup qualification now imports the real child verifier; destination
validation is in harness qualification utilities. The executable plan's
continuation baseline identifies the remaining ownership and acceptance work.

## Preparation provenance (supplied, not re-executed here)

The assigning architect relayed the operator's environment-resumption evidence:

- Projections acceptance source: `f227116f16514dd3500b2f4ae1e716272af1845a`.
- Incorporation into target main: `9f63d4e4660fba64c004941b2acab2c95eec46fc`, linear/fast-forward, not a claimed two-parent merge. The earlier short `9f63d5a2` was a transcription error.
- Incorporated default audit: report `716fa5b80215672e1fd679021317341763623098`, ref `refs/audited/runs/2026-10-14T08-28-04Z-9f63d4e46`; producer reports all six checks passed, composed pass, zero outstanding failures. Separate focused frozen-feature evidence reports 14/14 expanded scenarios and 144/144 steps passing. The old stopped ledger remains four-done/four-pending.
- Selected implementation baseline: `bad37865e1a3518b1a5d3a9923044d494a420025`, immediate child of incorporation, adding only the two identical Plan 46 inputs; preparation cleanliness was operator-inspected.
- Scenario materialization / last accepted boundary: `dd35d5a2d03f3dc1e0bf1de60ae6de2587023b1f`, child of that baseline, historically inspected clean. This is not the incorporation identity.
- Bootstrap runtime (distinct from target source): `7515b630217b71ef83f203e8cb73c2642a001532`; report `912edbfbd073bec0f7688b4f85ea9a6fb71050f1`, ref `refs/audited/runs/2026-10-14T10-28-50Z-7515b6302`, producer reports all six checks passing after two bootstrap-only corrections.
- Run: `20261014T103040Z-9c4e05`; readiness `ga-0001` passed at event 65 per supplied preparation evidence.

Historical `ur-001`/`ep-001` held implementation for missing incorporation provenance. Operator evidence resolved that uncertainty without placement, requirement or scenario changes; the earlier uncertainty did not prove incorporation absent.

## Root baseline and required handback

`scripts/trial-attribution.ts` currently imports the parent implementation `verifySetupLineIdentities` and `SetupAddedLineFact`, `SetupDeletedLineFact`, `SetupSourceLine` from `subs/harness/src/kpi/setup-attribution.ts`, and re-exports `trialReportDestination` from `subs/harness/src/kpi/trial-report.ts`. It authenticates raw Git object bytes, exact diff coverage and blame mappings before invoking the verifier. Preserve this recipe, injected external `TrialGitCommand` seam, unavailable reasons, result ordering and exit distinctions (0 verified no non-setup delta; 1 non-setup delta; 2 unavailable/no accounting facts).

Actual report consumers include `scripts/live-trial.ts` (validated destination before report write) and `scripts/plan23-live-session.ts` (`--trial-report-destination`). Destination validation remains execution/qualification responsibility, not KPI measurement responsibility.

The required child implementation and its actual execution/projections composition need harness ownership. Preserve merged projections, harness sole durable writing, selected signature companions and root protocol-only descendant exposures. Root integration must use the actual defining selected paths after handback, not old-directory forwarders, copied algorithms, parent calculators or KPI fakes. No source imports or native witness registrations have been changed here; no tests moved or removed.

Ordinary and testing root views were separately inspected at supplied revision `rev/1:63dff527-5c2f-4381-881a-491a6166735e:3`, with 39 and 77 coverage limits respectively. Both contain the current verifier/input companions and destination contract; `HarnessLineIdentities` is separately listed in delivered.ts. These are current-parent access observations, not extracted-provider evidence; absence elsewhere is not proof of unavailability. Refreshed ordinary/testing access evidence and browser-boundary assertions remain owed after handback.

## Current focused baseline execution

Executed from target root, 2026-10-14:

- `npm run test:quick -- src/tests/plan23-trial-collector.test.ts`: exit 0; 1 file, 27/27 tests passed, no skipped cases reported. Full log: `plans/kpi-extraction/.harness/jobs/20261014T103040Z-9c4e05/invocations/inv-0016/shell/001.log`.
- `npm run test:boundaries -- subs/harness/src/tests/plan23-trial-attribution.boundary.test.ts`: exit 0; 1 file, 7/7 registered native witnesses passed, no skipped cases reported. Full log: same invocation `shell/002.log`. Exact registrations retained in `src/tests/test-boundaries.json`.

The preserved root cases cover authenticated append; mixed later edits; dirty bytes/modes; revert to zero; missing EOF newline replacement; arbitrary setup-before boundary; object mode changes; same-commit unrecorded changes; absent files; corrupt objects; invalid UTF-8 versus legitimate U+FFFD; binary NUL; missing first-parent base; wrong source path; incomplete blame; truncated/header-only diffs; nested prefixes; absent/no-op records; wrong run/commit; correlated durable events; valid external destination and in-project/aliased/symlink refusals; versioned command input; and exit 0/1/2 distinctions. Native witnesses additionally establish actual Git/CLI behavior, shifted/renamed identities and assigned target cwd.

These passing checks establish baseline behavior only, not extraction acceptance. No failed baseline checks occurred. Current prepared Cucumber execution, type checks, `npm run check:self`, browser build and full committed audit were not run in this pre-delegation phase. No scenario is claimed passing; nonzero passing prepared sc-010 execution and fresh integration checks remain required on return. Full configured execution belongs to the gate.

## Continuation root qualification contribution — current, incomplete

This section supersedes only the root compatibility observations above, not their
historical execution receipts. The assignment supplied last accepted boundary
`c633eeb62a67457c8465f3128eff6b12e52ccbcc`; no Git identity or cleanliness was
independently inspected in this contribution. Final candidate identity and the
whole-suite committed audit remain pending with the gate and integration stage.
The interrupted original execution has not been relabeled successful.

### Retained ownership and changed-source rationale

Production root code was already using the extraction and was left unchanged.
`scripts/trial-attribution.ts` authenticates raw Git objects, exact diff coverage,
first-parent history and blame before calling the real
`verifySetupLineIdentities` at
`subs/harness/subs/kpi/src/setup-attribution.ts`. That defining path is received
through the harness's selected parent re-exposures, not direct ownership bypass.
The child owns verification; the root owns command acquisition, durable-effect
correlation, result adaptation and CLI 0/1/2 distinctions. No KPI algorithm or
answer substitute was added. Destination validation remains
`subs/harness/src/qualification/trial-report.ts`, re-exported by the root script;
`live-trial.ts` and `plan23-live-session.ts` remain its consumers. Harness durable
writing and progress/recovery behavior were not changed.

Changed root sources:

- `src/tests/helpers/trial-qualification.ts`: factors the existing small raw Git
  fixture recipe from the collector test without changing its examples. The
  explicitly named `scriptedTrialGitFake` implements `TrialGitCommand`, checks
  ordered arguments and project, and rejects unexpected, exhausted and unused
  answers independently of collector error handling. Its answers are Git bytes,
  not verifier outputs.
- `src/tests/plan23-trial-collector.test.ts`: imports the factored helpers;
  all 27 independent assertions/cases remain at root, including authentication,
  uncertainty, mode/dirty changes, surviving identities and CLI distinctions.
- `src/tests/helpers/root-qualification.ts`, `src/tests/root-qualification.test.ts`
  and `src/tests/steps/root-qualification.ts`: share the real composed root
  qualification examples and bind the frozen sc-010 wording. Real small disk
  examples test external, in-project, canonical alias and symlink destinations.
- `src/tests/helpers/root-browser-surface.ts`: checks every root production
  descendant exposure is a harness re-exposure of a declared protocol export,
  preserves representative metric/run schemas and policies, and rejects selected
  implementation names. This declaration check, not the web build alone,
  establishes the tested root browser boundary. It is not a proof about every
  possible transitive browser dependency.

No feature, guarded configuration, process guard or registration edits were
intended or made through file-edit tools. No tests were moved into root from a
child. **An accidental shell overwrite of a child test occurred later; see the
blocking incident below.**

### Case and consumer/companion mapping

| Case | Root consumer / test | Provider / result |
| --- | --- | --- |
| Authenticated append | collector, shared sc-010 fixture | Real KPI verifier; exact FINAL line 2 for setup commit; added 1/deleted 0, exit 0 |
| Mixed setup and later agent line | same | Ordered setup and final entries; only setup line excluded, remaining added 1, exit 1 |
| Invalid source identity | same | Real verifier returns unknown added positions, verified empty deletion positions; collector retains exact unavailable reason and null accounting, exit 2 |
| Fully reverted setup | same | Verified empty identities and zero counts, no path exemption, exit 0; not conflated with unavailable |
| External destination | report destination adapter | Real filesystem returns external path |
| Project/aliased project/symlink file | same | Real filesystem refuses outside-project violations and symlink file; target bytes remain unchanged |
| Browser API | root declaration helper | Protocol exports retained; KPI implementation not re-exposed by root to descendants |
| Additional authentication and CLI cases | retained 27-case collector file | Missing EOF, shifted BASE deletions, absent blobs, corrupt objects, UTF-8/NUL, incomplete diff/blame/history, prefixes, dirty bytes/modes, record correlation and versioned input all retained |

Ordinary and testing requester views were independently read before edits at
supplied revision `rev/1:20f7f702-1e06-4a2a-916d-69c17e4e9319:4` (39 and 80
coverage limits). After edits, `ramify materialize --from src` and
`ramify materialize --from src/tests` refreshed both areas at coherent revision
`rev/1:600cf346-c915-4a3c-aa7f-5ce986315dc3:8`; each area's selected pages were
read separately. Ordinary has coverage 39/truncated 2; testing has coverage
80/truncated 2. Absence is not proof of unavailability. The refresh occurred
**after** the native-file damage described below, so this is selected contract
access evidence, not evidence of a healthy complete candidate.

Both areas list `verifySetupLineIdentities`, `SetupLineIdentityInput`,
`SetupCandidatePartition`, `RecordedSetupDelta`, `SetupLineMappingFacts`,
`SetupSourceLine`, `SetupAddedLineFact`, `SetupDeletedLineFact` in the child
setup-attribution page and the return companion `HarnessLineIdentities` in the
child delivered page; both list `trialReportDestination` in harness qualification.
Harness declaration lines 185–188 select these contracts for root. The root
script actually names the three line-fact types and verifier; the input aggregate
and nested companions remain selected for clean consumer use. This makes the
cost of exposing authenticated facts explicit without exposing private algorithms
or giving the child process/durable-writing authority. Project-wide projections
ownership conclusions still require the harness/integration contribution.

### Focused execution receipts and limitation

Logs below are relative to
`plans/kpi-extraction/.harness/jobs/20261014T222715Z-84f064/invocations/inv-0061/shell/`.
These are focused command logs, not full audit artifacts.

- `006.log`: initial quick run exit 1, 27 passed/1 failed. The new invalid-source
  expectation incorrectly marked deletions unknown although this example has no
  deleted lines. It was corrected to `deleted: []`, retaining unknown additions,
  the unavailable reason, null accounting and exit 2. No existing assertion was
  weakened or production behavior changed.
- `007.log`: `npm run test:quick -- src/tests/plan23-trial-collector.test.ts src/tests/root-qualification.test.ts`, exit 0, 2 files/28 tests passed; then
  `npm run test:boundaries -- subs/harness/src/tests/plan23-trial-attribution.boundary.test.ts`, exit 0, 1 file/7 tests passed. No skips reported.
- `008.log`: exact prepared Cucumber config
  `src/tmp/ramify-focused/wi-002.i01/cucumber-focused-00bc7d8836ee746d.json`, profile
  `ramify-focused`, exit 0: **1 scenario and 15 steps passed**, no failed,
  undefined or skipped cases reported. sc-010 uses `scriptedTrialGitFake` only at
  raw Git acquisition, with real collector/verifier and filesystem destinations.
  Config identity is `00bc7d8836ee746d06e7ff1f7919ec9711768ba060f6d411db970f7b05526fd0`.
  Global root and child support globs and loaded expressions were inspected
  before adding bindings; no conflicting sc-010 definitions were found.
- `009.log`: `npm run type-check`, `npm run check:self`, `npm run build:web` all
  exit 0 in sequence. Structural check: completed/passed with partial coverage,
  0 errors/0 warnings, 457 analysis limits, 0 denied accesses. Web build: 488
  transformed modules; existing large-chunk advisory retained. These all ran
  **before** the accidental overwrite, not against the damaged current tree.
- `010.log`: requester view refreshes succeeded (revision 8); the attempted
  focused discovery command caused the incident below, so its empty output is
  not usable witness-selection evidence.
- `011.log`: separately read refreshed selected pages and metadata. Safe
  `vitest list --filesOnly --json` with no following filename, piped through a
  bounded grep, lists all three exact files. This confirms configured paths,
  **not valid witness source or passing execution after the damage**.

### Historical blocking verification incident — restored in follow-up below

After all passing runs above, the following command in `010.log` was mistaken:

```text
node_modules/.bin/vitest list --filesOnly --json subs/harness/src/tests/plan23-trial-attribution.boundary.test.ts src/tests/plan23-trial-collector.test.ts src/tests/root-qualification.test.ts
```

Installed Vitest consumed the first filename as its JSON output destination and
replaced **`subs/harness/src/tests/plan23-trial-attribution.boundary.test.ts`**
with a JSON file list. The current child witness is damaged despite its earlier
7/7 pass. No restoration was attempted under root-only write authority.
The assigning architect was consulted and advised returning partial for an
explicitly scoped owner restoration from verified pre-command candidate bytes.
Use immutable Git bytes only if confirmed identical, otherwise the complete
original content retained in `001.log` (the pre-edit `cat` receipt). Restore exact
bytes without behavioral or registration changes, compare them to the verified
original, then rerun the registered file and affected root checks.

The exact registration remains unchanged at
`src/tests/test-boundaries.json`, entry for this file, boundary “Native Git
scratch attribution and target cwd through the public trial attribution CLI”.
Its seven owning cases, all inspected before damage, are:

1. `public trial attribution CLI verifies the exact established scratch append from original Git objects`
2. `public trial attribution CLI attributes missing EOF newline replacement as two setup additions and one deletion`
3. `public trial attribution CLI preserves shifted setup identities and retains later same-file agent lines`
4. `public trial attribution CLI proves reverted setup empty without exempting remaining agent lines`
5. `public trial attribution CLI refuses mixed unknown binary dirty and symlink setup exemptions`
6. `prepared trial tool uses actual assigned module src cwd and external report destination`
7. `native Git authenticates renamed nested-project source positions and arbitrary setup-before deletions`

The configured Node discovery includes `subs/**/src/**/*.test.ts`, validates exact
registered paths against original discovery, selects the registry for the
`boundaries` project and excludes registered files from guarded ordinary Node
tests. These checks/guards were not edited. Post-restoration evidence is **unrun**;
no current complete-candidate passing result, clean committed audit, final
integration outcome or plan acceptance is claimed. Root sc-010 binding exists,
but this contribution returns partial because native coverage must be restored
by an authorized owner before qualification can be completed.

## Root repaired-candidate follow-up (wi-002.i02)

The preceding incident/partial report is historical, not the current native-file
state. Exact restoration is now complete; retained root helpers, all collector
assertions, the sc-010 binding and the case/ownership/companion mapping above
remain unchanged. No native witness was redesigned and no other harness file,
registration, process guard or configuration was edited in this follow-up.
Final integrated default committed audit/report qualification remains pending;
these focused results do not establish plan acceptance.

### Exact restoration provenance

Receipts here are relative to
`plans/kpi-extraction/.harness/jobs/20261014T222715Z-84f064/invocations/inv-0064/shell/`.

- `001.log` records the accepted boundary's native source from commit
  `c633eeb62a67457c8465f3128eff6b12e52ccbcc` (a commit identity, not a tree ID).
- `002.log` confirms that its complete 15,377-byte blob occurs exactly once in
  the original pre-incident `inv-0061/shell/001.log`. No discrepancy was found.
- `003.log` verifies restored bytes equal that blob exactly, SHA-256
  `5ea14e37a5bff3cf86e2a2bd895fddca382022bb6d1d7fa03f1505607add6fff`,
  and shows no native-file diff against the accepted boundary. This is exact
  historical restoration, not reconstruction of equivalent tests.

The installed Vitest option declaration was inspected in `009.log`: list's
`json` accepts `[true/path]`, confirming the prior filename-as-destination cause.
No further discovery command was executed. Successful focused configured
execution below establishes selection of the restored registered file without
an output-destination hazard. Read-only Git inspection was used only for
provenance/diffs/status; repository state was not changed through Git.

### Fresh post-restoration verification

- `004.log`: inspected package scripts, current prepared/default Cucumber
  configuration, retained binding, shared qualification and browser assertions,
  and testing rules. `009.log` inspects global support-glob expression matches:
  only the retained root binding matches sc-010 wording. A missing empty nested
  glob is not evidence of a missing binding; prepared execution resolves loading.
- `005.log`: exact required `npm run test:quick -- src/tests/plan23-trial-collector.test.ts src/tests/root-qualification.test.ts`, exit 0: 2 files,
  **28/28 tests passed** (all 27 retained collector cases plus the composed root
  qualification case). Exact required `npm run test:boundaries -- subs/harness/src/tests/plan23-trial-attribution.boundary.test.ts`, exit 0:
  **7/7 native tests passed**, one registered file. No failed/skipped cases
  reported. The seven exact owning-case names above remain the mapping.
- `006.log`: current prepared command/config
  `src/tmp/ramify-focused/wi-002.i02/cucumber-focused-00bc7d8836ee746d.json`,
  profile `ramify-focused`, config SHA-256
  `00bc7d8836ee746d06e7ff1f7919ec9711768ba060f6d411db970f7b05526fd0`:
  exit 0, **1 scenario/15 steps passed**, no failures, undefined, ambiguous or
  skipped cases reported. Binding sc-010 names `scriptedTrialGitFake` solely as
  the raw external Git seam. The real collector and KPI verifier execute;
  actual canonical/aliased project and symlink-file destinations are refused.
  Exact identities/order, mixed changes, unavailable addition versus verified
  no-deletion `[]`, null unavailable accounting and exits 0/1/2 remain asserted.
  Root descendant exposures are checked as protocol-only, not implementation.
- `007.log`: required `npm run type-check`, `npm run check:self`, and
  `npm run build:web` all exit 0 in sequence. Structure completed/passed with
  partial coverage: 457 analysis limits, zero errors/warnings/denied accesses;
  15 owners/964 source files/96 resources. Build transformed 488 modules and
  retained the >500 kB chunk advisory; no configuration was weakened.
- `008.log` and the first command of `009.log`: two unsuccessful CLI help
  probes (unsupported `--help`, then unsupported view `agent`), exit-2
  diagnostics, no result claimed and no materialization. These are not failed
  project checks. The supported materialization below succeeded.

Pre-damage passes and the corrected initial new-test failure remain historical
in the earlier section. No fresh project check failed, no skips were reported,
and no retries or process exemptions were introduced. Whole-suite Vitest,
whole-suite Cucumber, clean committed default audit, final candidate identity
and final integrated report are deliberately unrun/unestablished here: the gate
and later integrated stage own them. Interrupted-run limitations above remain.

### Separately refreshed requester APIs

`011.log` records supported `ramify materialize --from src` and
`ramify materialize --from src/tests`, both exit 0 after restoration. `012.log`
locates selected contracts in each separate view; `013.log` reads the bounded
selected pages independently and records metadata. Both represent revision
`rev/1:600cf346-c915-4a3c-aa7f-5ce986315dc3:12`:

- Ordinary `src/.ramify`: 39 coverage limits, 2 truncated entries. Its selected
  KPI setup-attribution/delivered pages contain the verifier, input aggregate,
  the nested/input line-fact companions listed above and return
  `HarnessLineIdentities`; harness qualification supplies destination validation.
- Testing `src/tests/.ramify`: 80 coverage limits, 2 truncated entries.
  Its separately read selected pages contain those same contracts and companions
  and destination function; ordinary access was not used to infer testing access.

These are selected access observations with incomplete coverage, not proof that
unlisted APIs are unavailable. The supplied revision-15 environment and earlier
revision-8 observations remain separately identified historical evidence; they
are not combined with this refreshed revision as a single analysis state.
Project-wide ownership and final semantic judgments remain the coordinating
architect's responsibility.

### Gate ga-0010 and bounded repair

The gate's default audit `20261014T222715Z-84f064:ga-0010` of candidate
`fb7edc86206769ac6f0a2fa9e2e330ccdbd07e54` requested/executed ramify-partial
and composed **fail**. The sole failed check was patch-integrity:
`docs/plans/46-kpi-extraction/results.md:308: new blank line at EOF.`
This follow-up removes that trailing blank line while retaining the report.
The failed candidate and original producer evidence remain historical; no
passing re-audit was claimed at that repair's handback. Subsequent reuse and
operator recovery are recorded below; the next gate owns its own verdict.

The supplied producer record reports typecheck, structure, web build, tests and
scenarios passed. Tests: 420 files passed/1 skipped, 3371 tests passed/2 skipped,
zero failures. Scenarios: 16 passed, 252 steps passed, zero failures/skips/undefined.
The audit waited for `/tmp/ramify-audit-tests.lock`. React Flow dimension/style
warnings and the web large-chunk advisory remain qualifications. Counts for
non-test checks were unknown. Cucumber messages were read at producer artifact
`reports/audit/cucumber/agent-scenarios/commands/agent-cucumber.ndjson`.
These are gate-supplied records, not a fresh direct whole-suite run by this
engineer; no complete audit was run during this repair.

### ga-0011 reuse and operator audit recovery

Gate `20261014T222715Z-84f064:ga-0011` on
`b7f62cdff2bc67346545ad89d003ca3032db173b` composed fail by reusing the
older failed `fb7edc86206769ac6f0a2fa9e2e330ccdbd07e54` record. Audit
applicability ignores the sole changed path, this report. Its repeated EOF
failure is reused evidence, not evidence that the corrected file still had
that error. Both failed gates remain history; tests and unrelated code were
not changed to invalidate reuse.

Operator-supplied recovery observations (not this engineer's execution): clean
committed `b7f62cdff2bc67346545ad89d003ca3032db173b` was verified and
`git diff --check HEAD^ HEAD` exited 0. The operator ran the documented
`node_modules/.bin/ramify-audit audit --cwd . --force --json` from the target
root, without `--full` or selection override. It exited 0 at
2026-10-15T05:00:40Z, duration 46.289s: report
`f67750ca693c80b9181a21da8ef8fd57f148a814`, ref
`refs/audited/runs/2026-10-15T05-00-40Z-b7f62cdff`, tree
`947c1057ab96516922fbc71054c43c45f7d32f4f`. Requested/executed mode was
ramify-partial: patch/type/structure/build freshly passed, tests/scenarios
reused prior passing evidence, composed pass with zero outstanding failures.
Root full report remains `f1fca4afdcaacd31c31031027e93d48e36024b6c`.
Read-only operator receipts: `/tmp/kpi-force-default-audit-20261015.json` and
`/tmp/kpi-force-default-audit-20261015.exit`. This operator-forced refresh
repairs applicability for the next ordinary gate; it is not automatic gate
execution, a fresh whole-suite run, or a rewrite of either failed gate.
Final full gate and semantic judgment remain required.

### Additional operator-supplied continuation provenance

The following are supplied operator observations, not this engineer's Git
inspections or substitutes for target acceptance:

- Serving bootstrap `/workspaces/worktrees/kpi-restart-provider-fix-20261014`
  at `f24924a7cae1af97cc3e626e507a14d131682338` was independently checked
  clean. Its passing composed audit report is
  `2434a9023a22a78a3ffd285fee2d343b53fa0b94`, ref
  `refs/audited/runs/2026-10-14T21-47-34Z-f24924a7c`, tree
  `1e76616d1161dc23adb1a26498f12d79351a67c2`: six selected checks passed,
  3306 regression tests passed/two existing skips, chain depth two, no
  outstanding failures. Runtime: openai-codex/gpt-6.1-sol, ramify.ts 0.5.1,
  ramify-audit 0.8.0, Pi 0.87.1; no packed companion provider.
- Current run `20261014T222715Z-84f064`, branch
  `ramify-agent-run/20261014T222715Z-84f064`, captured pre-scenario source
  `41c8e9f247344e3e5e01c5bae6ba69bf2f4a295c`. Readiness report
  `5a3101bdbc451fd2621a4b6ecb9adb747ad2bffc`, ref
  `refs/audited/runs/2026-10-14T22-46-28Z-41c8e9f24`, tree
  `39494a0d1e847cc36c26b662c7a610c8a54e6abb`: six fresh checks passed,
  3755 regression tests passed/two existing skips. Its six scenarios were
  prior projections coverage, not Plan 46 acceptance. Captured plan: 375 lines,
  SHA-256 `1aff9ceaaa92bfe0f6763afb17ac3ec445c3c2e86a3fbc38ca5952c850260673`.
- Projections incorporation `9f63d4e4660fba64c004941b2acab2c95eec46fc`
  remains linear, not a two-parent merge; operator's ancestry check to
  `c633eeb62a67457c8465f3128eff6b12e52ccbcc` exited 0.
- Target ga-0007 audited `37d9d41a6ccd9f2165df9e249a41f4e6c515f5b7`:
  passing report `f1fca4afdcaacd31c31031027e93d48e36024b6c`, ref
  `refs/audited/runs/2026-10-15T01-36-58Z-37d9d41a6`, tree
  `ecd48288f1ad5390ca86687d03bdfdedf0d65047`. Auditor selected full for
  26-path drift over limit 25, not an operator override. Six checks passed;
  3765 tests passed/two existing skips/zero failures, 454 files accounted;
  15 scenarios (nine current KPI/six prior projections), 222 steps passed.
  Documentation gate ga-0008 report
  `55aa5243e7e6e27970eb6de456d20fa19463549b` freshly ran patch/type/structure/
  build and reused tests/scenarios; ga-0009 reused that composed report.
  Neither is a fresh whole-suite execution.
- inv-0057 closed cf-0001 fixed by reassessment, not waiver/supersession.
  The invalid original fixture, erroneous done judgment, early operator handoff
  and scoped repair remain history. Original run `20261014T103040Z-9c4e05`
  is interrupted/incomplete; the separate terminal-restart importer limitation
  remains. Bootstrap fixes and standalone/operator contributions are separate
  from this run's delivery.
- The user rejected per-engineer pauses. The captured setting cannot be changed
  through this runtime's public protocol; an external client releases remaining
  occurrences automatically without manual review. They are not user-requested
  approvals. Future starts must omit breakpoints unless explicitly requested.

Final target identity, clean status and qualifying final integrated audit/report
remain unestablished here. No performance or cache improvement is claimed.
