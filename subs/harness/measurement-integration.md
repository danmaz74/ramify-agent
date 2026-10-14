# Collection composition

## Boundary and facts

This slice integrates collection, not query/root migration or cap-001 acceptance.
The preceding accepted line-provider boundary is
`f02b4fd2ad04fd6ea3e63630e9b76d8fc7b29ab1` (ga-0008; rq-0014 without concerns).
The historical ga-0007 navigation failure, its repair and historical skips remain
historical receipts, not replaced by these focused results.

Production composition (paths below are relative to harness):

- `src/run/service.ts`: imports real child capture/baseline/scope/revision/root
  helpers and bounded history cache. `freezeBaseline` acquires plan/package
  support, asks `subs/kpi/src/capture.ts` for the snapshot, performs the existing
  bounded view refresh retry and writes the exact returned record with
  `writeOnce`. Its job baseline reference hashes those serialized bytes.
- `src/steps/runner.ts`: shared run/step preparation translates the delivered
  packet, supplies the frozen snapshot plus delivered supplementary facts and
  acquired extra locations to child `scopeSize`. It records the returned size
  through `prepareInvocation` -> `this.write` -> the existing run writer.
  No KPI writer/ledger/assignment implementation is supplied to the child.
  A standalone manual step with no baseline still records delivered support
  and an explicitly unavailable owned-source component; it does not invent a
  measurement document.
- `src/run/port-events.ts`: passes separately recorded new-input, cache-read,
  cache-write and output usage and recorded rates to child
  `estimateRecordedCharge`. Harness adds sourceRevision, records the observation
  and deduplicates replay source IDs. ExplorationObservation now comes from the
  child; production of observations and session settlement remain here.

`src/measurement/inputs.ts` is execution acquisition/translation only:

| Execution input | Facts supplied |
| --- | --- |
| WriteScope.base + bootstrap + providers | exactOwners, first-seen unique names |
| resolved included child-subtree / owned-nested-project | subtrees / nestedProjects |
| extra path | location path, invocation-start bytes and per-file project-relative identities; absent vs unreadable preserved |
| read names | independent exact-owner read proxy, never added to writer scope |
| DeliveredManifest.entries | ordered kind/source/hash/bytes/sources; source list order, hashes and bytes copied verbatim |
| LoadedPackage legacy fallback | captured plan path and ordered package paths, UTF-8 brief byte length |
| Actual delivery | child deduplicates support and briefs, detects conflicting revisions; current disk/text/package inventory never replaces delivered byte facts |
| ArchitectIndex + declared selection | observation directory roots (including architect view/extra paths); unresolved owners keep unknown status |

Filesystem enumeration and support-path utilities are acquisition, not scope
arithmetic. `declaredRoots` lives here rather than among exploration algorithms.
The parent does not implement delivered identity policy, scope overlap accounting,
snapshot hashing, revision compatibility, or known-subtotal rules in callbacks.
The no-snapshot and collection-error coverage records remain execution decisions.
The cost of the seam is explicit factual arrays and translation, rather than
passing prompt/assignment implementations into the measurement owner.

## Evidence and retained compatibility

- `src/tests/helpers/measurement-flow.ts`, case 2, observes real child capture
  and scope calls without replacing them; the durable snapshot equals the
  returned snapshot and invocation size equals a returned provider size.
  Cases 1–7 retain baseline, absent producer, overlap, unknown owner and
  publication assertions. Native cases 1 and 7 retain their exact registration.
- `src/tests/steps-run.test.ts`, standalone resource-return case: real child
  delivered-input call, committed invocation support component equality and
  retained pending candidate/assignment. This exercises the production manual
  runner, with no frozen snapshot (explicit partial coverage).
- `src/tests/measurement-inputs.test.ts`: exact ordered factual mapping,
  conflicting facts left intact for provider judgment, legacy package fallback,
  UTF-8 brief bytes and delivered-facts precedence.
- `src/tests/scope-size-recipe.test.ts`: original overlap, bootstrap, nested,
  absent/ENOTDIR extra-location and revision cases use adapters + child.
  Historical owner-local calculator comparisons preserve both byte orders for
  repeated brief hashes, equal bytes, and both orders of hash/byte conflicts,
  including complete error equality. These are historical receipts, not a
  second production provider.
- `src/tests/plan25-combined-delivery.test.ts` and
  `src/tests/plan23-observation-integration.test.ts` retain all cases. The latter
  now also observes the real charge provider, checks original usage/rate
  arguments and persisted charge-result parity across restoration.
- `src/tests/plan23-exploration-metrics.test.ts` retains declaredRoots cases
  against the execution adapter; unrelated historical algorithms remain local.

Ordinary/testing received pages were inspected separately under
`src/.ramify/children` and `src/tests/.ramify/children`, supplied analysis revision
`rev/1:f4c829fe-9f73-4302-97dd-c52909514d9e:92`. Coverage limits are respectively
1 and 27; absence is not evidence of unavailability. Capture pages contain
DeclaredScope, DeliveredScopeInputs, DeliveredSupportEntry, DeliveredSupportSource
and SnapshotRequest. Efficiency exposes ChargeInput/RecordedCharge;
exploration exposes ExplorationObservation; delivered exposes cachedChangeHistory.
SnapshotRequest's RamifyCli is received from evidence and SnapshotId/ViewIdentity
and durable result types remain harness-owned. No inferred ReturnType substitute
or undeclared foreign type import is used. Type checking and structural checking
cover actual calls, while inferred-signature/namespace analysis limitations
remain explicitly limits, not proof of complete static signature analysis.
No browser/protocol exposure or descendant exposure was broadened.

## Focused verification (2026-10-14)

- `npm run type-check`: passed (including web and script configurations).
- `npm run check:self`: passed with partial analysis coverage (no denied
  accesses/errors); analysis limits are not erased by that result.
- Required five-file quick selection: 87/87 passed. Final seven-file selection
  adds measurement-inputs and plan23-exploration-metrics: 100/100 passed,
  7 files, zero failures/skips. Run start 15:07:41 UTC. Per-file process receipts:
  zero allowed native calls and zero refused attempts in all seven files.
- `npm run test:boundaries -- subs/harness/src/tests/measurement.boundary.test.ts`:
  2/2 passed, zero failures/skips, start 15:06:55 UTC. Exact witness registration,
  guards and configuration unchanged. Receipt shows 76 allowed API observations,
  zero refused; Ramify observations include 3 measure, 2 materialize, 1 check,
  2 version, 1 ownership and 1 daemon command. These are API observations, not
  an assertion that every observation is a distinct successful process.
- Installed `vitest list --filesOnly --json`: 450 configured files; all seven
  focused files in node, exact measurement witness in boundaries, all 11 child
  KPI files and 25 projections files discovered in node. Discovery is not
  execution: broader provider/query/root suites, scenarios and web build were
  not run directly in this slice. The gate owns the committed default audit.

## Committed audit failure and repair

Audit `20261014T103040Z-9c4e05:ga-0009` evaluated candidate
`2383b8601009795acb5dae55a994c85d82a02e12`: requested and executed
ramify-partial, composed verdict **fail**. Exact failure:
`subs/harness/src/kpi/exploration.ts:174: new blank line at EOF`
from patch-integrity (`git diff --check HEAD^ HEAD`). The repair removes only
that extra trailing blank line; no algorithm or test guarantee changes.

The same receipt reports agent-tests pass: 415 files passed, 1 skipped,
0 failed (416 total); 3431 tests passed, 2 skipped, 0 failed (3433 total).
Agent-scenarios passed: 6 scenarios and 61 steps, zero failed/skipped/undefined.
Agent-structure, agent-typecheck and agent-web-build passed (counts unspecified).
Those results retain their actual producer scope and skips; they do not turn
ga-0009 into a pass or establish broader requester acceptance. The next gate
owns verification of the repair and may reuse applicable evidence.

## Remaining retirement and integration

Retain old parent KPI bodies while projections/root still consume them. No
forwarder is added. Parent `kpi-metrics.test.ts`, `delivered-change.test.ts` and
algorithm portions of `plan23-exploration-metrics.test.ts` are retirement
candidates once their provider/query case maps are reconciled. The mixed
`scope-size-recipe.test.ts` must keep adapter/acquisition and historical parity
cases here while child algorithm cases remain child-owned. Measurement native
and collection workflows stay with harness; do not remove or re-register their
witnesses merely because calculators moved. Query/root consumers and complete
old-directory removal require their scoped follow-up; no scenario binding or
requester acceptance is claimed here.

## Shared attribution bridge: partial candidate

Starting candidate: `2ea6ad3cbf176f574b5a5a17a241beb9171b9491`; accepted
baseline: `96cb99ac457d5b5cdf6a2187539bc4660b074ddd`. This is not cap-001 or
scenario completion. The selected minimal bridge revealed a retained signature
closure conflict; no committed audit is requested by this partial handback.

### Authored changes and ownership

- `module.ramify`: selected delivered/setup descendant declarations and three
  matching root-facing declarations now relay the same KPI child originals.
  Other six algorithm declarations and all protocol authority are untouched.
- Root `scripts/trial-attribution.ts`: exactly two specifier substitutions,
  verifier/three fact types to child `setup-attribution.js`, destination re-export
  to harness `qualification/trial-report.js`. Raw object/blob/diff/blame
  authentication, injected `TrialGitCommand`, event correlation, ordering,
  reasons, schemas and exits remain unchanged.
- Projections `src/metrics.ts`: exactly four specifier substitutions (setup,
  delivered, two inline HarnessLineIdentities references); implementation and
  all other query imports remain unchanged. Exact targeted-edit receipts verify
  the authored substitution set; no independent Git whole-tree diff is claimed.
- `src/qualification/trial-report.ts`: byte-identical relocation from
  `src/kpi/trial-report.ts` (successful `cmp` before removal, no forwarder).
  SHA-256: `a54f18986d3ca604c30ce4491c381eee2d676265831ec8c6aa43e08edb89b2fb`.
  Fixture-trials destination import and native boundary verifier import alone
  changed. No tests, registrations, process guards or configuration weakened;
  no process/analyzer/KPI fake added and root tests not edited.

### Refreshed requester access and closure limitation

API materialization succeeded for actual root and projections, both ordinary
and testing areas. Before consumer imports the four areas were at
`rev/1:9ef78384-9e9a-4944-94f2-d73967d04806:14` (root limits 39/77,
truncated 2/2; projections limits 41/71, truncated 4/4).
After imports they share revision
`rev/1:9ef78384-9e9a-4944-94f2-d73967d04806:17`: root ordinary/testing limits
39/77 and truncated 2/2; projections ordinary/testing limits 39/69 and
truncated 4/4. These are partial views, not proof of absent APIs.

Selected verifier closure is visible in the child setup/delivered pages:
verifySetupLineIdentities -> SetupLineIdentityInput -> RecordedSetupDelta,
SetupCandidatePartition, SetupLineMappingFacts -> SetupSourceLine,
SetupAddedLineFact, SetupDeletedLineFact; result HarnessLineIdentities has only
inline entries/primitives. Both audiences select those same originals.
Descendant deliveredChange additionally selects DeliveredChangeRequest,
DeliveredChange, HarnessLineIdentities, with existing evidence ChangeHistory and
harness LineEventSummary (inferred schema signature remains an analysis limit).

**Global companion closure nevertheless fails.** Retained parent
`src/kpi/metrics.ts:7` imports parent DeliveredChange. Its MetricInputs.delivered
at line 65 and comparableScopeMetrics parameter at line 501 still denote that
parent original, not the newly exposed child original. `module.ramify:122`
therefore produces two `exposed-without-companion` errors. Structural TypeScript
compatibility and successful view materialization do not resolve original
symbol identity. Advisory consultation required partial and explicitly did not
authorize changing the retained metrics contract or migrating more query rules.

### Actual execution and original examples

Evidence logs are under
`plans/kpi-extraction/.harness/jobs/20261014T103040Z-9c4e05/invocations/inv-0083/shell/`:

- `005.log`: type-check completed without diagnostics; check:self exit 1,
  completed/failed/partial. 15 owners, 952 source files, 92 resources,
  18475 accesses; 13677 allowed, 0 denied, 4792 external. Two companion errors,
  zero warnings, 461 analysis limits. `009.log` independently records
  TYPE_CHECK_EXIT=0 for all four configured TypeScript projects.
- `003.log` and `007.log`: successful requester materializations; `004.log`,
  `008.log`, `009.log`: revisions, limits and bounded closure inspection.
  `002.log` first rejected duplicate --from (exit 2), with no refresh claimed;
  corrected separate commands succeeded. Early transient missing-file hook and
  deadline-exceeded/not-checked hooks were not passes.
- `006.log`: required quick selection executed 4 files, 35 tests passed,
  zero failures/skips: root collector 27, projections setup 4, kpi metrics 3,
  session reading 1. Fixture-trials was not selected by quick discovery.
  Native attribution boundary executed all 7 registered tests, all passed,
  zero failures/skips, including renamed nested-project source/deletion facts.
- `007.log`: explicit fixture-trials boundary selection discovered its 2 opt-in
  cases, both skipped (environment selectors unset), zero executed. Those live
  fixture trials are not claimed passing. No full audit/scenario/web build was
  run here.

All original root examples ran unchanged against the actual child and relocated
validator in `src/tests/plan23-trial-collector.test.ts`:

| Example | Observed outcome |
| --- | --- |
| ex01 | Exact authenticated append excludes precisely added line 2; setupOnly true, added 1/deleted 0. Root command input case invokes actual collector with scripted raw external answers. Native CLI append case also passes. |
| ex02 | Corrupt object identity and incomplete blame/direct diff coverage return unavailable, no setup exemption or invented zero. Exact no-record/unchanged-effect cases retain their separate semantics. Native unknown/binary cases pass. |
| ex03 | Same-file later edits retain non-setup accounting; reverted setup gives verified empty identities, no exemption. Root exit case preserves 0 verified setup/zero, 1 non-setup/mode changes, 2 missing/unavailable evidence; schema rejection retained. Native shifted/reverted/dirty cases pass. |
| ex04 | External destination accepted; internal and directory alias into project rejected as outside; existing symlink file refused and its real target still reads literal `before`. This unchanged-byte assertion runs via relocated validator, not a fake. Native prepared target cwd/external report case passes. |

Configured discovery inspected in root `vitest.config.ts` and
`src/tests/test-boundaries.json`: node/web quick projects exclude registered
native files, boundary project selects exact registrations. Automatic ordinary
process guard and native boundary setup remain enabled. Root `module.ramify`
inspection shows descendant re-exports only selected protocol vocabulary and
test controls, not setup verifier, deliveredChange or trialReportDestination.
Harness Node attribution contracts remain parent-only or internal descendant
reading seams; no root browser-production KPI exposure was introduced.

### i12 query migration — partial, no audit acceptance

The six remaining descendant groups now re-expose received child originals,
including their named companions. Seven projections specifier substitutions
(six in metrics.ts, one in lineage.ts) complete the bounded parent-KPI reference
migration; no query reconstruction or parent/child algorithm edit. The i11 root
script and validator migration is retained without further change. All parent
algorithm bodies and all existing tests remain for later case-mapped retirement.
See [projections integration](subs/projections/kpi-integration.md) for selected
signature inventory, exact focused case counts, limitations and retained files.

Strengthened the existing coordinating projections-pure completed-run case,
without renaming/deleting cases: repeated in-process metrics/evaluated sessions
and targeted session reads equal captured answers; reopened HTTP metrics/session
answers equal those originals. Existing complete durable-byte/event-sequence,
resting-project, no-new-Git and process assertions all still pass. Updated the
source purity tripwire to actual child metrics/guarding. No KPI fake.

Current receipts: inv-0086 shell/009.log: four configured type-check projects
passed, nine exact quick files / 71 tests passed, zero failed/skipped. shell/010.log:
seven exact native attribution tests passed; check:self **failed**, completed
partial coverage, 15 owners / 952 sources / 92 resources / 18476 accesses,
13672 allowed / 6 denied / 4792 external, 6 errors / 0 warnings / 458 limits.
The i11 two companion errors are absent, but a structural pass is not claimed.

The six current errors are not-visible imports of parent baseline algorithms in
five child KPI test files: efficiency.test.ts:3 invocationTiming;
exploration.test.ts:3 explorationDetails; guarding.test.ts:3 guardingReport;
lineage.test.ts:4 lineageMetrics; metrics.test.ts:6 comparableScopeMetrics and
kpiMetrics. KPI child tests are outside the authorized subtree. Advisory
architect explicitly confirmed no authority to edit them or restore parent
exposures; replacing parity comparisons with self-comparisons is not a repair.
A recorded child-test scope correction and preserved substantive expectations
are needed. Candidate remains intact for that decision.

shell/010.log refresh and shell/011.log metadata: root ordinary/testing and
projections ordinary/testing share rev/1:9ef78384-9e9a-4944-94f2-d73967d04806:22;
root coverage limits 39/77, truncations 2/2; projections 39/69, truncations 4/4.
shell/012.log confirms exact configured node/native file discovery. Initial
shell/011.log default JSON discovery returned no file evidence and is not used.
The bounded projections TypeScript scan contains no parent KPI references.

Historical 35 quick / seven native passes, two opt-in skips and original two
companion failures retain their historical status. The opt-in fixture cases
were not rerun this iteration: still not passing. Full selected weighted,
missing-writer, zero-vs-failed-history and cache/rates/conflicting-search query
cases, structural correction, parent implementation/pure-test retirement and
full selected feature evidence remain owed. No committed default audit was
requested for this structurally failing candidate. No capability/scenario
completion claim; gate owns audit verdicts and qualifications.

### Historical and pending responsibilities

Historical i09 nine collisions, blocked refresh, deadline/not-checked hook and
unrun checks remain failures/limitations. i10 linkage restoration type-check,
check:self and requester materialization established only their recorded partial
access evidence, not algorithm or composed-query parity. ga-0009 failure and
its actual tests/scenario counts above remain historical, with no flake claim
or replacement by these focused successes. Gate owns committed default audit,
including historical evidence reuse/skips and failure qualifications.

Next assignment must reconcile the retained parent metrics companion original
with selected child exposure before claiming composition acceptance. Independent
baseline whole-tree/diff confirmation remains architect/gate evidence. Full
remaining query rules, parent directory/pure-test retirement and composed
HTTP/reopen/feature evidence are still pending. No performance/cache benefit,
capability completion or scenario completion is claimed.

### i13 coordinator parity repair — partial

See [exact parity map and execution receipt](src/tests/measurement-parity/README.md)
for all commands, cases and limits. Genuine complete parent/child suites were
preserved before removing illegal child comparators. Every test identity/body
maps unchanged from `subs/kpi/src/tests/<basename>` to
`src/tests/measurement-parity/<basename>`; local fixture copies preserve exact
bytes/values apart from defining imports. No private child fixture/test import,
production/declaration write, baseline API restoration or self-comparison.
Temporary parity lifetime ends only on assigned case-mapped parent retirement.

| Basename | Cases each, child/coordinator | Compared calls (static sites) |
| --- | ---: | --- |
| efficiency.test.ts | 3/3 | invocationTiming 5; charge-only case is literal, not parity |
| exploration.test.ts | 7/7 | explorationDetails 11, including 5 via explorationMetrics |
| guarding.test.ts | 3/3 | guardingReport 4 |
| lineage.test.ts | 13/13 | lineageMetrics via computed 13 |
| metrics.test.ts | 19/19 | kpiMetrics via computed 21; comparableScopeMetrics 9 |

Inv-0089 shell/008 verifies seven exact copies before child edits; 016 verifies
all child/coordinator test bodies still byte-identical. Child wrappers now call
local originals directly, or keep schema parsing without parent equality.
Owner-local baseline accesses remain inventoried in harness kpi-metrics.test.ts,
plan23-exploration-metrics.test.ts and unguarded-write.test.ts. The bounded scans
find no parent KPI access in child tests, projections TypeScript or root tests.

Inv-0089 receipts: shell/009 `npm run type-check && npm run check:self` exit 0:
four TypeScript projects pass; structure completed/passed/partial, 15 owners,
959 sources, 92 resources, 18502 accesses; 13694 allowed, 0 denied, 4802 external;
0 errors, 0 warnings, 458 limits. Deadline/not-checked hooks are not passes.
010 exact five-child/five-parity quick selection: 10 files/90 tests passed,
zero failures/skips. 011 exact i12 nine-file selection **fails**, 8 files/68 tests
passed, one suite failed/0 tests, no skips. Current retained projections
`src/tests/kpi-metrics.test.ts` contains JSON discovery output instead of tests;
exact error `No test suite found`. This invocation did not write it; origin is
unknown. Advisory architect confirmed no authority to repair projections tests.
Preserve failure; seek recorded narrow restoration of all original three query
cases and child imports from known valid source. Other file counts: lineage 14,
efficiency 1, observation 9, setup 4, session 1, run-protocol 9,
projections-pure 3, root collector 27. Unchanged repeated/reopened actual HTTP,
durable/event/process evidence passed. 012 separate exact native attribution
selection passes all seven cases, zero failures/skips (initial chained command
was stopped by quick failure). Root ex01–ex04 run against actual child/relocated
validator; root script's two actual defining specifiers remain unchanged.

013–014 separate materializations: root/projections/KPI ordinary/testing share
`rev/1:9ef78384-9e9a-4944-94f2-d73967d04806:35`; coverage limits 39/77,
39/69, 39/78 respectively; truncations 2/2, 4/4, 4/4. Limited views cannot prove
absence. 015 exact configured discovery lists 19 node files plus one native file,
including all five new parity suites; discovery is not execution success.
019–020 inspect separate root/projections ordinary/testing received pages.

Partial: projections suite restoration requires recorded authority. Gate owns
committed default audit over retained composition; none requested for this failed
selection. Historical i09/i11/i12 failures and original audits are preserved;
two opt-in fixture skips remain unrerun/not passing. Still owed: meaningful
composed weighted 2500/100000/40, missing writer subtotal, zero versus failed
history, complete cache/rates/search-conflict cases, full feature evidence and
assigned parent-body/pure-test case-mapped retirement. No scenario binding,
capability completion or task handback claim.

### i14 repair and candidate audit request

Exact original projections query suite restored from architect-supplied accepted
source: 208 lines, SHA-256
`7a1cc048269a5bed8a576153d644698f676d4d3941f8a57107786cd6616a6fee`.
No production/declaration/configuration/native registration or other test edits;
genuine coordinator comparators and child expectations remain intact. Exact Git
baseline equality is left to read-only architect/gate inspection, not claimed
from line count or hash alone. See projections kpi-integration.md for restoration
and individual query case receipt.

Inv-0092 shell/001: `npm run type-check && npm run check:self`, exit 0;
four TS projects pass; completed/passed/partial structure, 15 owners, 959 sources,
93 resources, 18523 accesses; 13711 allowed, 0 denied, 4806 external, 0 errors,
0 warnings, 458 analysis limits. Shell/002 repeats the exact nine-file quick
command from the parity README: 9 files/71 passed tests, zero failures/skips,
including all three restored query bodies and unchanged real repeated/reopened
HTTP/durable/event/process evidence. Shell/003 repeats its exact ten-file
child/coordinator quick command: 90 passed tests, then
`npm run test:boundaries -- subs/harness/src/tests/plan23-trial-attribution.boundary.test.ts`:
all seven registered native cases pass. Zero failures/skips in both selections.
Shell/004 read-only configured `vitest list` with all 20 exact positional filters
and `--filesOnly --json` discovers 19 node files and one boundaries file;
execution, not discovery, establishes nonzero restored tests. No output redirect.

Supplied current separate ordinary/testing views are revision
`rev/1:3cece7ea-0e52-4da5-9660-7f392bbef834:38`, limits harness 1/27,
root 39/78, projections 39/70, KPI 39/79; incomplete views cannot prove absence.
Historical revisions remain separately labelled. Preserve inv-0089 shell/011
exit-1/no-suite/zero-tests with eight-file/68 passes, its 90 and seven passes,
all original failed audits and real reuse limitations; recovery does not erase
failure or establish provenance. Two historical opt-in skips are unrerun and
not passing. Gate owns committed default audit over this retained candidate,
including actual reuse/skip/failure qualifications; no full audit run by engineer.
Still owed: composed weighted/partial/history/cache/rates/search variants,
case-mapped baseline retirement and selected feature evidence. This audit request
is not capability/scenario completion or handback.
