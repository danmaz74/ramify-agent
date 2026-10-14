# Legacy KPI retirement: scoped source handoff

## Scope and provenance

Implemented against current supplied source (accepted boundary supplied as
f8e8aa724dd5e7c78b1bca9301b8295b2fab3951). No Git command was run; this report
makes no independently inspected HEAD/tree or starting-cleanliness claim.
The plan, AGENTS.md and docs/testing.spec.md were read. Scope is harness and its
existing KPI/projections children, not root result captures or execution tracking.
No commit, default audit, full suite, feature binding, provider pin, configuration,
protocol, score, UI or durable format change was made.

## Final source ownership and actual consumers

The entire `subs/harness/src/kpi/` directory is absent, including all nine
remaining implementations: capture, delivered, efficiency, exploration, guarding,
lineage, metrics, sessions and setup-attribution. No forwarding file remains.
A resolved-relative-import scan across root src, scripts and subs found no
remaining import into that retired directory. Production consumers already used
the child before deletion; none was redirected to a substitute calculator.

| Child source / responsibility | Actual consumer / coordinating responsibility retained |
| --- | --- |
| lines.ts: snapshots, per-invocation deltas, overlap/binary/unmapped qualifications | harness run/service.ts chooses snapshot timing and commits original returned records |
| capture.ts: snapshot construction, scope accounting, delivered-source identity rules, invocation qualification | run/service.ts baseline; measurement/inputs.ts translates manifests/write/read scopes and acquires locations; steps/runner.ts selects collection timing and commits invocation |
| delivered.ts: surviving BASE→FINAL weight, exact setup exclusions, shared writers, bounded history cache | run/service.ts owns cached reading dependency; projections metrics.ts supplies recorded writers/Git facts |
| setup-attribution.ts: exact revision-bound line verification | projections metrics.ts and root scripts/trial-attribution.ts; root/native consumers retain actual verifier use |
| metrics.ts: KPI and corresponding project/total comparison | projections metrics.ts; no browser calculator contract |
| lineage.ts: actual/requested history, generations, degradation/replacement/order | projections lineage.ts/metrics.ts translate durable recorded facts |
| exploration.ts: source dedup, unknown/conflicting search coverage | projections metrics.ts and harness run/port-events.ts observation vocabulary |
| efficiency.ts: recorded timing and category rates | projections metrics.ts and harness run/port-events.ts recorded charge observations |
| guarding.ts: descriptive coverage, tools/gaps | projections metrics.ts; real unguarded-write native test |
| sessions.ts: private pure aggregation | owner-local sessions tests only; not a selected production API |

General ownership lookup stays in harness measurement/owners.ts. Trial external
report destination and symlink protection stay in qualification/trial-report.ts.
Evidence owns Git/measurement/CLI acquisition contracts. Harness is still the
only durable writer. The existing invocationReadSize/invocationScopeSize/failure
seam is unchanged: exact absent-snapshot two-component result, unknown single
owned-source replacement, declared failure snapshot/subtotal/reason, and
read-size assignment before location acquisition all remain child rules.

The parent no longer needs the formulas, component-state rules, identity
algorithms or cache implementation formerly duplicated there. It still pays the
explicit integration cost of translating prompt/assignment facts into declared
scope and delivered-support entries, and supplying authenticated Git/recorded
facts. No parent callback implements measurement rules; no writable run service
is passed to the child. No new neutral definitions module was introduced.

## Final selected API and signature companions

The child declaration exposes only selected entries with their named child-owned
companions. No algorithm file is exposed wholesale.

| Source | Selected entries and child-owned signature closure |
| --- | --- |
| lines.ts | takeLineSnapshot, lineEvents; LineChange, LineSnapshot, LineEventRequest |
| capture.ts | captureSnapshot, baselineScope, scopeSize, revisionMismatch, rootModuleOfSnapshot, deliveredScopeInputs, invocationReadSize, invocationScopeSize, invocationScopeFailure; SnapshotRequest, DeclaredScope, DeliveredScopeInputs, DeliveredSupportEntry, DeliveredSupportSource, InvocationScopeDeclaration |
| setup-attribution.ts | verifySetupLineIdentities; SetupLineIdentityInput, RecordedSetupDelta, SetupCandidatePartition, SetupLineMappingFacts, SetupSourceLine, SetupAddedLineFact, SetupDeletedLineFact |
| delivered.ts | deliveredChange, cachedChangeHistory; DeliveredChangeRequest, DeliveredChange, HarnessLineIdentities |
| metrics.ts | kpiMetrics, comparableScopeMetrics, kpiPolicyVersion, measurementPolicyVersion; InvocationFacts, MetricInputs, ScopeComparison |
| lineage.ts | lineageMetrics, lineagePolicyVersion; LineageInputs, SegmentFacts, SegmentUsage, StartKind |
| exploration.ts | explorationDetails; ExplorationObservation, ExplorationMetrics, SearchCount, SearchCounts |
| efficiency.ts | invocationTiming, estimateRecordedCharge; InvocationTiming, ChargeInput, RecordedCharge |
| guarding.ts | guardingReport; GuardingReport, GuardVerdictCounts |

Removed selected APIs: sessionMetrics and SessionEntry/SessionMetrics companions;
componentSubtotal; scopeSizePolicy; projectOnlySize. All current uses were
inspected: remaining callers are internal child implementation/tests. Private
helpers remain exported within the owner's files for meaningful local tests, not
exposed across the module boundary. No parent re-exposure of those names remains
(the parent did not previously re-expose them). Child public policy constants used
by projections remain, as does revisionMismatch used by run/service.ts.

Parent descendant re-exposures retain the scope, delivered, timing, exploration,
guarding, lineage, metrics and setup selected closures needed by projections.
Parent-to-root re-exposures retain HarnessLineIdentities and the exact setup
verifier/input/mapping closure for the root qualification script. Foreign signature
companions remain governed by their existing evidence/harness protocol/record
owners; they were not copied or inferred to circumvent exposure.

## Test ownership and exact preservation

[Case map](src/tests/measurement-parity/README.md) maps every retired duplicate
body to independent surviving fixtures/literals/schema/errors, not equalities.
The five coordinator suites (45 cases) retire; their real-parent comparisons
served their transitional purpose. Parent metrics18 and delivered16 cases map to
child originals, with the overlapping snapshot body relocated verbatim to child
lines.test.ts. Child delivered additionally retains its independent bounded-cache
case. Parent exploration keeps the two assignment-root adapter cases; seven pure
exploration and two timing/charge cases survive independently in the child.
Nine pure parent scope cases retire to same-title child evidence. Remaining parent
scope cases exercise real manifest/write/read/location adapters against literal
results and exact errors, never child-to-itself equalities.

Operator review additionally retired the parent pure setup-identity section after
verifying complete fixture/assertion identity with the child setup suite (ignoring
imports, comments and blank lines only). The distinct parent execution cwd case
remains. The earlier39-case parent trial selection below describes the pre-cleanup
source; child setup assertions and the unguarded native execution case remain. Projections and root collector
source/tests are unchanged. Native registration, process guards and both inherited
opt-in skips are unchanged. Historical failed/limited/interrupted receipts remain
labelled history in integration/transition notes and measurement-parity/history.md.

## Executed verification

Commands were executed from the project root. Complete exact command selections
and output are in this standalone invocation's shell receipts, numbered below;
these are local execution facts, not committed audit or scenario acceptance.

- shell/023: exact 11 child files plus parent scope/measurement-inputs/exploration/
  trial files: 15 files, 206 tests passed, exit0. The requested unguarded-write
  filter is correctly excluded from quick discovery because it is registered
  native; it was separately run below. This run preceded removal of eight more
  redundant parent scope bodies (then21 cases, now13); none of its passes is
  presented as execution of those retired bodies on the final candidate.
- shell/025: exact composed selection: parent scope(13), measurement(13),
  steps-run(11), observation-integration(38), run-protocol(9), projections-pure(3);
  projections kpi-metrics(7), usage/search(3), lineage(14), efficiency(1),
  observation-presentation(9), setup(4), session-reading(1); root collector(27).
  14 files/153 tests passed, exit0. This includes literal weighted2500/100000/40,
  ratio.25/reduction4, missing subtotal10000/weight10, zero versus failed history,
  recorded cache/rate/search qualifications and repeated/reopened pure queries.
- shell/026: exact unchanged registered native measurement, trial attribution and
  unguarded-write witnesses: 3 files/10 cases passed, exit0 (2+7+1). Real Git/CLI,
  actual invocation cwd, external report destination and destination refusal stay
  under the existing native process restrictions.
- shell/028: authoritative configured `vitest list --filesOnly` with those exact
  selections and retired filters: 28 node files and3 boundaries files discovered;
  no retired metrics/delivered/coordinator file discovered. No discovery setting
  or registration changed. No JSON positional-output ambiguity was used.
- shell/030 and final shell/035: `npm run type-check && npm run check:self`,
  both exit0. All four
  TypeScript projects pass. Structural execution completed/passed with partial
  analysis coverage: 15 owners,942 sources,94 resources,18416 accesses;
  13609 allowed,0 denied,4801 external; 0 errors,0 warnings,457 analysis limits.
  Earlier not-checked/deadline-exceeded mutation hooks were not passes.
- shell/034: after adding an explicit whole-legacy-directory-absent assertion
  (in addition to the existing lines.ts-absent assertion), exact projections-pure,
  parent scope and child lines selections passed: 3 files/24 cases, exit0.
- shell/027 and032: supported materialization for harness, KPI and projections,
  ordinary/testing areas. Harness received pages confirm invocation factual seam
  and removal of private names; projections receives the child metrics/signature
  closure via harness. Analysis coverage/truncation limitations remain explicit;
  refreshed API views and full self-check are not claims of exhaustive analysis.
  All six areas have revision rev/1:d9cc0d7e-bcb2-49ea-9f17-323877833e58:13;
  harness ordinary/testing coverage limits1/27, KPI39/80, projections39/71;
  four truncations in each area (shell/033).

No focused execution failures occurred. Two exploratory read-only compiler-API
comparison attempts failed (missing package-relative lib entry; unavailable
createPrinter); a bounded source comparison then supplied the case/body map.
These are not test failures or accepted comparison evidence.

## Remaining operator obligations

Commit/review/decompose this scoped candidate, reconcile source facts into root
results.md and captured feature disposition without changing historical receipts,
and obtain the configured committed default composed audit. Full Cucumber,
web-build, other native witnesses and whole-run default audit were not run here.
The two inherited opt-in skips were neither removed nor relabelled passed.
Semantic all-ten-example and plan acceptance remain the responsible operator's
judgment. Passing focused tests alone is not a claim that Plan46 is accepted.


## Operator review follow-up

After the standalone engineer settled, operator review retained its delivery at
7babce6c and removed the last duplicate pure setup-identity section as mapped
above. The real child keeps every original fixture and assertion; the parent keeps
the distinct execution cwd test. The exact focused selection of child
setup-attribution, parent plan23-trial-attribution and parent scope-size-recipe
passed52 cases across3 files. All four TypeScript projects and check:self passed
again (0 errors,0 denied accesses,457 analysis limits; partial structural coverage).
These operator checks are separate from the engineer receipts and do not establish
committed audit or full-plan acceptance.


The first committed default audit ofba8b9cdd selected full execution and found
one stale current-navigation failure: M4 in composition.test.ts still searched
for the retired parent metrics test. Report118a891d429a226f3ee412f607bf0b132c2e8a46
retains3754 passed,1 failed and2 opt-in skips; the other five checks passed.
Operator review updated the current M4 lookup to the real child metrics file,
following existing M2/M5 relocation handling. Frozen matrix citations and historical
iteration results retain their original paths, titles, ownership and assertions.
The exact composition selection then passed13/13. A new default configured audit
is required for this correction; the failed report and readiness-failed run remain
failed history, with no accepted scenario dispositions.
