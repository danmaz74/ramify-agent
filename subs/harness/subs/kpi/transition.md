# Bounded KPI provider transition

## Current: legacy ownership retired

The nine duplicate parent implementations and the parent `src/kpi/` directory
are removed, with no forwarding files. The five coordinator runtime suites and
the parent pure metrics/delivered duplicate suites are retired after mapping to
independent child assertions. The overlapping snapshot case was relocated
verbatim into child `lines.test.ts`. Coordinating trial/unguarded-write tests now
call real selected child originals. The scope adapter uses literal results and
errors, not child-to-itself comparisons.

`sessionMetrics`, SessionEntry/SessionMetrics, `componentSubtotal`,
`scopeSizePolicy` and `projectOnlySize` are private to this owner. Other selected
contracts remain because actual collection, projections or root callers use
them or their named signature closure. No new testing-only production API.

Current inventory/checks: harness `measurement-integration.md` and
`measurement-retirement.md`. Exact case preservation:
`src/tests/measurement-parity/README.md` under harness. Full committed default
audit, root results.md and feature disposition remain operator-owned.

## Historical receipts (not current retirement status)

### Standalone continuation — partial, not baseline retirement

The remaining invocation qualification rules formerly constructed in parent
`steps/runner.ts` now execute in the real child's `capture.ts` through factual
inputs. The selected entry points and companion are `invocationReadSize`,
`invocationScopeSize`, `invocationScopeFailure`, `InvocationScopeDeclaration`.
The parent retains delivered-input translation, snapshot/location acquisition,
ordering and durable commits. Four new child `scope-size-recipe.test.ts` cases
preserve independent exact absent-snapshot, missing-declaration, failure and
read-selection assertions. See harness `measurement-integration.md` for the
case/rule comparison and the corrected call-through collection spy seam.

No old production/test file is retired in this partial delivery. Historical
comparators remain genuinely distinct; exhaustive legacy case mapping, pure-test
relocation, removal of parent `src/kpi/` and exposure minimization remain owed.
Do not interpret the focused tests or source movement as Plan46 acceptance.
Earlier failed/skipped/interrupted receipts below remain historical evidence.

## ga-0005 patch-integrity repair

Original audit receipt `20261014T103040Z-9c4e05:ga-0005` assessed
`49a7eb7dbcfd87912321c830dd6c38be165b4fd2` under ramify-audit.json,
requested/executed ramify-partial, composed verdict fail. Exact failed check:
patch-integrity / git-diff-check, `subs/harness/subs/kpi/src/exploration.ts:147:
new blank line at EOF.` This repair removes only that extra terminal blank
line; calculations, contracts and assertions are unchanged. The failed receipt
and candidate remain historical evidence, not reclassified by a focused pass.

The supplied audit reports agent-typecheck, agent-structure, agent-web-build,
agent-tests and agent-scenarios passing. Recorded test totals: 412 files passed,
1 skipped of413; 3428 tests passed,2 skipped of3430,0 failed. Cucumber:6 scenarios
and61 steps passed,0 failed/skipped/undefined. Aggregate counts are partial-audit
provider evidence, not proof of whole configured discovery execution; skipped
cases retain their status and their names were not supplied in this repair
brief. Structure retains analysis coverage limits. No new whole-suite command
or direct audit was run by engineer.

Repair verification at
`plans/kpi-extraction/.harness/jobs/20261014T103040Z-9c4e05/invocations/inv-0053/shell/001.log`
asserts exactly one terminal newline and no blank EOF line. Exact focused command
`npm run test:quick -- subs/harness/subs/kpi/src/tests/exploration.test.ts subs/harness/subs/kpi/src/tests/efficiency.test.ts`
passes10 tests (7 exploration,3 efficiency),0 failed/skipped. This does not erase
ga-0005 or establish patch-integrity acceptance; the next committed gate owns
verification and may reuse applicable provider evidence. Prior required type,
structural and full focused selections are retained below. No new policy/error,
consumer migration or cap-001/composed completion is claimed.


## Recorded-fact provider iteration (current candidate)

Comparison basis: accepted `8d0fe4760e490014dc46b8e8ded2b68b5e9773c4`,
starting candidate `c50a478956edcf018feeb100682b0bf9f02170f9`, and unchanged
current harness `src/kpi` baseline bodies/tests. Earlier receipts below remain
historical, not current audit claims. This iteration adds real child metrics.ts,
lineage.ts, exploration.ts, efficiency.ts, guarding.ts and sessions.ts; only
selected reading vocabulary is added to the parent declaration. No baseline
production/test, projections, root, registration, configuration or feature edit.
No consumer migration, cap-001/composed/requesting-consumer acceptance is claimed.

### Ownership, consumers and complete selected API

The production import inventory was checked across src, scripts and harness:
projections metrics.ts needs kpiMetrics/comparableScopeMetrics and policies,
InvocationFacts, guardingReport, lineageMetrics/LineageInputs and policy,
explorationDetails/SearchCount/SearchCounts and invocationTiming. Projections
lineage.ts needs LineageInputs/SegmentFacts/StartKind. Harness port-events.ts
needs estimateRecordedCharge and ExplorationObservation. Harness steps/runner.ts
needs declaredRoots; this execution adapter remains there, outside this move.
Session summary is the selected recorded-fact provider contract, currently used
by the retained harness line-events test; no production sessionMetrics consumer
was found in that bounded inventory. Root/scripts have no selected production
metric/session imports. Future consumer integration remains separately scoped.

Child declaration exposes to parent the entry points above, sessionMetrics,
and owner-local signature closure:
InvocationFacts, MetricInputs, ScopeComparison; LineageInputs, SegmentFacts,
SegmentUsage, StartKind; ExplorationObservation, ExplorationMetrics, SearchCount,
SearchCounts; InvocationTiming, RecordedCharge, ChargeInput; GuardingReport,
GuardVerdictCounts; SessionEntry, SessionMetrics. All three policy constants have
explicit literal signatures. Foreign named companions remain original harness
Metric, LineageMetric, Role, Observation, InvocationOutcome, LineEventSummary,
ScopeSize, ContinueReason, DegradeRelation and ReplaceRelation, which harness owns
and already receives in its source. No foreign wire/schema definition is copied,
no ReturnType/private-shape derivation or writable collaborator is introduced.

Parent extra exposure is only roles, replaceReasonSchema and rawOutputGapKinds
with CoverageGapKind/ObservationOf/ObservationType closure. The two initial
missing-companion diagnostics were repaired before implementation continued.
These descendant reading exposures apply across the harness subtree, not only
KPI. Public/browser and writer exposure are unchanged. Child source uses child
capture/projectOnlySize and delivered contracts, never parent calculators.
Testing-only real baseline comparators use pre-existing selected exposures.
No private helpers are exposed solely for tests; explorationIdentity/searchCount
stay private, observedElapsedMs is module-local sharing with efficiency and is
not declared as a consumer API. ChargeInput is owned by its calculator.

Rules now implemented in the child (temporary parent duplicates still exist):
metrics private metric/ratio/observedCount/readable/sizeGap/lines,
bytesPerChangedLine/overBaseline/sessionsOf/historiesOf/sessionWeightedTotal,
usageTotals/usageMetrics/adaptationMetrics/byRole/repeatedBudgetReturns,
blockedWrites/isObservationGap/observationCoverage and comparable calculations;
lineage measurement/startOf/measures/figureOf/mean/profile/ended/globalRoles,
localFork/forkCost/continuationGrowth/repairCost/degradedStarts/replacements,
served/forksServed; exploration identity/status/duration/dedup/conflict rules;
efficiency recorded amount and boundary/duration rules; guarding verdict/tool/
mutation/excursion/gap aggregation; session change/usage/end aggregation.
Harness acquisition, immutable record reading, lifecycle, commits, rates and
observation production remain with their owners. No new process, analyzer,
pricing lookup, policy, score or error is introduced.

### Formula and per-case parity inventory

Known baseline arithmetic is preserved: weights10/30 and scopes1000/3000 over
B10000 give numerator100000, denominator40, mean2500, ratio0.25, inverse4.
Unknown second scope at weight3 retains subtotal10000 over known weight10 and
coverage1/2, not zero. Partial component buckets retain weighted known bytes but
not complete-size denominator weight. Unattributed lines prevent a whole-run
ratio. Captured zero subtotal differs from absent size; zero delivered weight is
not-applicable, failed history is unavailable. Corresponding project50/120 and
total90/200 remain distinct. Continued scopes use per-component maxima; degraded
fresh model histories count again while harness session count does not.
Lineage means require every segment input, retain missing-first evidence order,
actual/requested/degraded starts, generation and local forks. Usage categories
remain input/cache-read/cache-write/output. Recorded charges are category tokens
* recorded rate / 1000000: 100/50/0/10 at2/.2/0/8 yields .00029 USD; absent
rates/usage leave total null and preserve known components. Parallel10ms tools
sum20ms with wall10ms and explicit milestone4ms. Replay uses invocation,
operation, session, turn, call and kind; conflicting facts are excluded and
unknown statuses retain search coverage. Guarding remains descriptive. Session
entries include every end and unchanged repair attempt.

All original baseline tests are retained unchanged for later owner retirement.
The following map uses source-order case numbers (not new policy IDs):

| Baseline source / case | Child evidence / retained owner |
| --- | --- |
| harness kpi-metrics 1 weighted mean/ratio/inverse/gate attempts | metrics same named case, full real baseline answer equality |
| 2 missing size/known subtotal | same named case, full equality |
| 3 zero weight | same named case, full equality |
| 4 unattributed delivered lines | same named case, full equality |
| 5 surviving/shared delivered share | same named case, full equality |
| 6 no accepted commit/failed Git | same named case, full equality |
| 7 historical size policy | same named case, full equality |
| 8 unavailable B | same named case, full equality |
| 9 separate usage/unreported session | same named case, full equality |
| 10 continued maxima/all session ends | same named case, full equality |
| 11 blocked calls/unguarded qualification | same named case, full equality |
| 12 unreadable observations | same named case, full equality |
| 13 raw-output gaps | same named case, full equality |
| 14 no writer | same named case, full equality |
| 15 corresponding project/total baselines | same named case, full comparable answer equality |
| 16 partial sizes/unattributed overlap | same named case, full comparable and KPI equality |
| 17 missing/zero B, zero weight, policy/snapshot, measured zero | same named case, full comparable equality |
| 18 captured partial zero versus absent size | same named case, full equality |
| harness plan23-exploration 1 known bytes/read counts/duration/zero matches | exploration same named case, full equality; literal expected identity replaces private helper import |
| 2 replay/inheritance versus new identity fields | same named case, full equality |
| 3 unknown bytes/files/status/duration/failed/log limit | same named case, full equality |
| 4 conflicting replay/timestamp duration | same named case, full equality |
| 5 partial outside-scope status | same named case, full equality |
| 6 wholly unknown/no searches | same named case, full equality |
| 7 failed search/unknown matches | same named case, full equality |
| 8-9 declaredRoots directories/unknown placement | retained execution adapter tests only, no child assignment/index discovery |
| 10 parallel/wall/milestone/missing/out-of-bounds | efficiency same named case, full real baseline timing equality |
| 11 recorded charge categories/missing rate or usage | efficiency same named case; expected values plus whitespace-only production body/signature comparison, no baseline charge exposure added |
| harness line-events 1-7 snapshots/ownership and 8 collection | retained coordinating owner; not moved into session tests |
| 9 failed/stopped/repaired/context-limited/unchanged sessions and usage gap | sessions same named case, original expected figures; whitespace-only body/signature equality, no parent session calculator exposure |
| harness unguarded-write sole native execution case | retained at owner; child guarding scripts recorded facts and preserves its report assertions without copying execution service |

Projections lineage-metrics has 14 real query/session/disk-composition cases,
not standalone pure tests: all remain at their owner. Child lineage supplies
recorded-fact equivalents for cases1 fork profiles,2 growth,3 repair profiles,
4 degraded rates,5 separate fallback,7 replacements/forks served,8 ordering/policy,
9 local-source forks,10 unavailable context/usage subtotals,11 missing previous
context,13 unknown-start coverage and14 empty group/no generation2. They retain
the corresponding expected values/evidence, with full real baseline
lineageMetrics equality on each input. Case6 project session list/run snapshot
counts and case12 actual ENOENT observation-log path/error remain projection-only
integration cases; no disk reader or service was copied. A recorded reason is
supplied in child facts, not discovered by the calculator.

New small provider cases are metrics19 distinct degraded model histories;
lineage13 unended/wholly unknown starts/empty replacement denominator;
efficiency3 conflicting duration exclusion; guarding3 recorded shell report,
verdict/attribution/sorted counts and unnamed snapshot gap (no baseline pure
file found); sessions2 empty zero and earlier unavailable usage. These preserve
existing baseline rules, no changed expectation or new policy/error.

Runtime equality compares all fields and order, not merely selected numbers:
metrics19, lineage13, exploration7 and guarding3 compare against real baseline
answers on every call in their wrappers; efficiency3 compares timing calls
only. Charges and sessions lack selected baseline function exposure, so runtime
cross-provider comparison is unrun there; matching production bodies/signatures
(ignore whitespace only), both old/new focused expectations and schema/type
checks are narrower evidence, not a fabricated independent oracle. Existing
baseline/source fixtures and child pure facts remain temporary duplicates.

### Current evidence and limitations

Project-root logs are under
`plans/kpi-extraction/.harness/jobs/20261014T103040Z-9c4e05/invocations/inv-0052/shell/`.
007 and011: npm run type-check passed all four compilers; npm run check:self
completed/passed with partial coverage, 15 owners,947 sources,92 resources,
0 errors/warnings,457 analysis limits,0 denied accesses. Hook deadline-exceeded
results verified nothing; these completed structural checks supply subsequent
evidence. No engineer command failed and no selected test skipped.

008 initial and011 comparator-enhanced exact command:

```
npm run test:quick -- subs/harness/subs/kpi/src/tests/metrics.test.ts subs/harness/subs/kpi/src/tests/lineage.test.ts subs/harness/subs/kpi/src/tests/exploration.test.ts subs/harness/subs/kpi/src/tests/efficiency.test.ts subs/harness/subs/kpi/src/tests/guarding.test.ts subs/harness/subs/kpi/src/tests/sessions.test.ts subs/harness/subs/kpi/src/tests/scope-size-recipe.test.ts subs/harness/subs/kpi/src/tests/measurement.test.ts subs/harness/subs/kpi/src/tests/setup-attribution.test.ts subs/harness/subs/kpi/src/tests/delivered-change.test.ts
```

130 passed in10 files: metrics19,lineage13,exploration7,efficiency3,guarding3,
sessions2,scope21,measurement8,setup38,delivered16. Zero failed/skipped/unrun
within this selection. 009 baseline exact command:

```
npm run test:quick -- subs/harness/src/tests/kpi-metrics.test.ts subs/harness/src/tests/plan23-exploration-metrics.test.ts subs/harness/src/tests/line-events.test.ts subs/harness/subs/projections/src/tests/lineage-metrics.test.ts
```

52 passed in4 files: KPI18,exploration11,line-events9,projections lineage14;
zero failed/skipped/unrun in selection. These production coordination tests
still use old providers, not migrated consumers.

012 authoritative configured vitest list --filesOnly --json discovers447 files,
all10 KPI tests in node and25 projections files. Discovery is not execution.
Process guard, configured projects/exclusions and exact native registrations
are unchanged. No native file moved or exemption added; native witnesses are
unrun here. Complete suite, Cucumber, web build and default committed audit are
unrun by engineer; gate owns that audit. No scenario binding added.

012 refreshed all four ordinary/testing areas together;013 records metadata
and declaration closure at one revision
`rev/1:82037a30-96a7-4a92-91d0-73a0eb600b88:13`: KPI ordinary39/testing78,
harness ordinary1/testing27 analysis limits, each truncated4. Required reading
vocabulary pages and parent-received six child calculation pages are present
in ordinary and testing areas. Bounded page reads verify selected signatures;
coverage limits are retained, never proof that an absent interface is unavailable.
013 verifies charge body/signature equality; initial session comparison differed
only by return trailing comma, restored to baseline punctuation and014 verifies
session body/signature equality. This did not change behavior or expectations.

Final015 repeats both exact commands above after baseline session punctuation
restoration: same130 child and52 baseline passes, zero failures/skips. It also
passes all four type checks and check:self with the same partial coverage and
457 analysis limits. Final016 refreshes all four areas at one revision
`rev/1:82037a30-96a7-4a92-91d0-73a0eb600b88:15`, with unchanged ordinary/testing
coverage39/78 and1/27, each truncated4; revision13 above is the earlier bounded
page-read evidence, not merged metadata. Signature text is unchanged by return
punctuation. All14 final file guard receipts in exact root cwd and window
2026-10-14T13:39:39.635Z through13:39:47.841Z are ordinary (`native:false`),
with zero allowed launches and zero refused attempts. Guard SHA-256
`af06ff2a7e01558bb334f12694d81ae7b703c501eee11afd62c6d0fa3da7806d`,
registration SHA-256
`5d41a78c29317736864e1ac6027bd962f20b04cba8b22884c02638ff1b71587c`.
016 retains the individual receipts; native integration is still unrun.

### Temporary retirement and next owner work (not completion)

Parent retains all six original production bodies and their pure helpers;
remove them only with real consumer migrations and selected child re-exposure
through harness to projections. Current declarations deliberately do not replace
old descendant algorithms or add browser APIs. Retire all18 old harness pure KPI
cases and9 pure exploration/timing/charge cases after consumers migrate, retaining
2 declaredRoots adapter cases. Retire old M5 session test duplication after
provider integration, retaining8 line/collection cases. Projections14 and native
unguarded-write stay at coordinating owners. Child baseline comparators then
must be retired with the removed baselines, retaining independent assertions.

Invocation lineEvents/ownerOf/takeLineSnapshot extraction is still separate;
trial-report destination protection remains harness-owned. All earlier capture,
setup and delivered duplicate retirement obligations below still apply.
Production migrations, real querying/collection/reopen/root integration,
old-directory retirement and final cap-001/composed evidence are required next.
The parent still knows old rules until that work removes them. The new contract
cost is immutable recorded measurement facts and complete named type closure,
not parent callbacks containing domain rules or new writable authority.


## Baseline brief-byte repair (retained partial and current conformance)

The accepted child boundary `0396e5aa8758c4ad4e393902e23ebb294608a9fd`
contained an unauthorized brief-byte policy change. rq-0005's review identified
that baseline `subs/harness/src/kpi/capture.ts` replaces a brief hash's bytes
with the last supplied entry, whereas the child threw on inconsistent bytes.
Plan revision 7 requires baseline behavior. This repair removes only that added
exception; the ordered Map replacement/deduplication and source-path hash/byte
conflict rejection are unchanged. It does not tighten factual preconditions.

Exact behavior for the retained same-hash counterexample: ordered bytes [5,6]
previously threw `Conflicting delivered brief bytes for h` in the child, and now
produce brief6; reversed [6,5] previously threw and now produce brief5. Identical
[5,5] still produces brief5. Baseline source inspection shows the same last-entry
replacement. Same-path hash conflict (h/5 versus other/5) or byte conflict
(h/5 versus h/6) still throws `Conflicting delivered support revisions for same`
in either order. The retained tests now assert those results and final scope
bytes rather than the unauthorized brief error. All other cases remain.

Historical ga-0003 and review evidence are not superseded or reclassified as
passing by this repair. The continuation below records the prior unauthorized
policy claim and its prior receipts as historical facts, not current authority.
The original supplied assignment does not include the ga-0003 receipt details;
no new verdict for it is inferred here.

At the retained cap-001.i04 partial boundary, real baseline comparison on these
added conflict/order facts was blocked in child-owned tests:
the child testing received capture.ts page lists DeclaredScope, baselineScope,
rootModuleOfSnapshot and scopeSize, not deliveredScopeInputs. The supplied view
has 78 analysis limits (ordinary 39), so absence alone is not proof. Architect
consultation verified that the parent declaration's selected descendant exposure
omits deliveredScopeInputs and its DeliveredManifest input contracts. No private
parent import, copied calculator or KPI fake was added. A harness-owned testing
comparator with authorized exposure, or harness-owned verification, is needed
for execution parity on these exact cases. Existing parent baseline cases can
still be run unchanged, but do not exercise inconsistent brief bytes.

No parent production/configuration, frozen scenarios or consumers are changed;
all other provider work, consumer migrations, cap-001 and composed completion
remain deferred. The gate owns the committed default audit.

### Current harness-owned execution parity and receipts

The narrow conformance table in `../../src/tests/scope-size-recipe.test.ts`
uses the existing local baseline import and the parent-received real child
`deliveredScopeInputs` and `scopeSize`. Harness owns manifest translation; no
helper, new exposure, fake, copied calculator or private cross-owner import is
needed. Plain `DeliveredManifest` entries with required metadata preserve the
inconsistent byte facts instead of re-hashing text. The corresponding factual
entries keep order, hash, bytes and sources unchanged.

Seven real baseline/child comparisons execute: three complete successful
`DeliveredScopeInputs` and final `ScopeSize` answers for [5,6], [6,5], [5,5]
(expected brief/total6,5,5), and four same-source hash/byte conflicts in both
orders. Errors remain Error with exact message
`Conflicting delivered support revisions for same`; both implementations are
called, and unexpected success fails. Stack locations are execution-specific,
not compared. All existing parent15 and child21 scope cases are preserved.

Harness testing access was verified against the supplied refreshed revision
`rev/1:f4c829fe-9f73-4302-97dd-c52909514d9e:30`, page
`subs/harness/src/tests/.ramify/children/subs/harness/subs/kpi/src/capture.ts.md`.
It receives deliveredScopeInputs, DeliveredScopeInputs, DeclaredScope,
DeliveredSupportEntry, DeliveredSupportSource and scopeSize. The harness testing
view has 27 source-analysis limits, ordinary1; child testing78/ordinary39.
These coverage limits remain explicit; absence is not proof of unavailability.

Current logs are under
`plans/kpi-extraction/.harness/jobs/20261014T103040Z-9c4e05/invocations/inv-0046/shell/`.
`004.log`: required command
`npm run test:quick -- subs/harness/src/tests/scope-size-recipe.test.ts subs/harness/subs/kpi/src/tests/scope-size-recipe.test.ts subs/harness/subs/kpi/src/tests/measurement.test.ts`
passed all 51 cases in 3 files: harness scope22 (including 7 real comparisons),
child scope21, child measurement8; 0 failed/skipped/unrun in this selection.
`001.log` records the same 51 passing cases before the readonly-array type fix.
`002.log` records an initial type-check failure (two TS4104 readonly-array
assignments); check:self was unrun then because of command chaining. Explicit
array copies corrected those assignments without changing facts.
`003.log`: npm run type-check passed all four compiler commands, then
npm run check:self completed/passed with partial coverage: 15 owners, 933 sources,
92 resources, 0 errors/warnings, 456 analysis limits, 0 denied accesses.
The intervening edit hook's deadline-exceeded check verified nothing; the
completed check:self supplies subsequent structural evidence.

The committed default audit remains gate-owned, pending this completion proposal.
Other tests/native witnesses, scenarios and web build are unrun by this engineer;
no whole-suite command, cap-001 completion or composed acceptance is claimed.
Historical partial/review/ga-0003 receipts below retain their original basis.

### Historical cap-001.i04 repair verification receipts and limits

Commands ran from project root; logs are under
`plans/kpi-extraction/.harness/jobs/20261014T103040Z-9c4e05/invocations/inv-0043/shell/`.
`001.log`: `npm run test:quick -- subs/harness/subs/kpi/src/tests/scope-size-recipe.test.ts subs/harness/subs/kpi/src/tests/measurement.test.ts subs/harness/src/tests/scope-size-recipe.test.ts`
passed 44 cases in 3 files: child scope21, child measurement8, baseline scope15;
zero failed/skipped, none unrun within that selection. The baseline15 do not
include the added inconsistent brief/order case; real baseline execution of that
case remains unrun pending authorized testing access.
`002.log`: `npm run type-check` passed all four compiler commands;
`npm run check:self` completed/passed with partial coverage, 15 owners,
933 sources, 0 errors/warnings, 456 analysis limits. Supplied view coverage limits
remain ordinary39/testing78 at revision
`rev/1:f4c829fe-9f73-4302-97dd-c52909514d9e:25`.
No whole-suite command was run. Other tests, native witnesses, scenarios, web
build and committed default audit are unrun by this engineer; these receipts
neither erase historical ga-0003/review evidence nor claim composed acceptance.

## Historical snapshot/scope provider continuation

Comparison basis: unchanged parent capture.ts and baseline tests at candidate
`c2a1ad1f02669ac9d06a63b560bd831c5a79522b`; accepted attribution boundary
`4563684b93785fb5076b98a25311a6ebbf9dd936`. The historical bootstrap evidence
below is retained, not relabelled as current verification.

### Ownership and selected API

`src/capture.ts` now owns DeclaredScope, scopeSizePolicy, baselineScope,
captureSnapshot, scopeSize, componentSubtotal, projectOnlySize, revisionMismatch,
rootModuleOfSnapshot and deliveredScopeInputs. Private rules remain private:
selectModules, isDescendant, ownedSource, apiViews, architectView,
supportDocuments, directoryBytes and measuredDirectory. No pure helper is exposed
merely for tests. Production exports target forthcoming harness collection and
projections comparisons, not a browser API. No durable writer enters KPI.

New owner-local companions are SnapshotRequest, DeliveredScopeInputs,
DeliveredSupportEntry and DeliveredSupportSource; all are exposed to parent.
DeclaredScope recursively uses primitives and anonymous location/file facts.
SnapshotRequest names original harness SnapshotId, ViewIdentity and evidence
RamifyCli. Scope calculations name original MeasurementSnapshot, ScopeComponent
and ScopeSize and retain original measurementSnapshotSchema/scopeSizeSchema
validation. No schema or durable record definition was copied or derived.

Parent declaration adds only SnapshotId reading exposure and selected evidence
relays: readMeasurement, MeasurementRead, MeasurementDocument, ModuleMeasurement,
documentSchema, moduleSchema, architectViewDirectory, RamifyCli, RamifyRun,
RamifyCheckResult, CheckProvider, MaterializeResult, OwnershipQueryResult,
OwnershipAnswer, OwnershipPath, RawOwnershipEvidence, ProviderFailureEvidence,
RecoveryEvidence. The last ownership/failure contracts close the existing
RamifyCli class's members, not an extra KPI analyzer. Toolkit signature types
(CheckedPath, AffectedDocument, ProjectOwnership, StageExecution,
CliFailureDocument) remain installed package types. Existing parent evidence
access already receives this closure. The descendant exposures apply across the
harness subtree; public/browser parent exposures are unchanged. Initial Ramify
closure diagnostics for three companions were repaired, not ignored.

Current ordinary and testing received pages were refreshed together at
`rev/1:d0001883-7e08-4e19-9c18-bf8fcf94f85e:19`: ordinary coverage 39,
testing 78, each truncated 4. Required measurement, CLI, record, SnapshotId and
ViewIdentity pages are present in both areas. These retain source-analysis
limitations; absent entries are not evidence of absent capabilities. Earlier
supplied revision 15 and first local refresh 14 are historical, not combined
with revision 19. Unsupported materialize --module and --help calls claimed no
result; --from src and --from src/tests succeeded.

### Factual adapter recipe for the later harness assignment

Keep writeScopeMeasurement/readScopeMeasurement and invocationScope, planSupportPath,
locationFiles, inventoryPath, fileBytes, supportDocument and plan/package discovery
with harness. Translate WriteScope base modules/bootstrap/provider modules to
unique exactOwners, included child scopes to subtrees, nested-project directories
to nestedProjects, extras to locations. Read scope stays a separate proxy. Obtain
location bytes/files/absent/unreadable facts at invocation start, retaining error
text and every forward-slash path; no callback carries counting policy.

For delivered inputs, map manifest.entries in their current order to
`{kind, source, hash, bytes, sources: [{path, hash, bytes}]}`. Do not flatten or
pre-deduplicate, re-hash, substitute expanded entry bytes for source bytes, or
read current disk. Pass that ordered array and the declared selection to KPI
`deliveredScopeInputs`; use its scope and supplementary answer. Empty-source
non-null entries count their source; null-source role-instructions/procedure/skill/
tool-declaration count synthetic delivered-inputs/kind/hash identities. Briefs
count by hash unless the same source/hash/bytes is already support. Environment
entries without sources are not support. Same path with incompatible hash OR
bytes throws the baseline error. The prior iteration additionally rejected same
brief hash with conflicting byte counts instead of silently replacing the earlier
count (new counterexample, not baseline parity claim). That was an unauthorized
policy difference; the current repair restores last-entry bytes as described above.

Call captureSnapshot with the evidence-owned CLI, current head/view, snapshot ID,
ordered captured supplementary facts and signal. KPI computes raw UTF-8 producer
SHA-256 locally using node:crypto (same bytes as parent prompt sha256), retains
producer document/revision and acquisition reasons and counts published architect
files recursively. Harness continues choosing collection time and committing
returned records. No collection/query/root production consumer is migrated here.

### Complete baseline case map

Baseline scope-size-recipe has 15 cases in source order. Child scope tests preserve
their expected figures/reasons and ordering without execution implementation imports:

| Baseline case | Child evidence / retained coordination |
| --- | --- |
| 1 B support/architect dedup | same named case, 950 support and 7305 total |
| 2 role support/brief | same named case, 550 documents + 700 brief |
| 3 absent support | same named case, unavailable not zero |
| 4 inventoried extra/soft read | factual p/a plus three exact extra paths, 760; WriteScope translation retained parent |
| 5 outside/absent extra | same facts/reasons, 600 |
| 6 unreadable extra | same EACCES reason/buckets, subtotal600; on-disk ENOTDIR/absent/file adapter assertions remain parent |
| 7 child subtree/nested/bootstrap | translated exact/subtree/nested facts, unknown new owner, known510 without new owner; WriteScope discovery retained parent |
| 8 contract provider whole | adapter-only assertion remains parent, no provider rule moved |
| 9 revision mismatch | same reasons, support subtotal950 only |
| 10 omitted architect view | same zero/unknown components |
| 11 independent baseline/writer | same project120/50 and total200/90 |
| 12 delivered inherited sources | ordered factual repeated entries, 20+10 source bytes, brief5, shared brief0, synthetic schema6, conflict; manifest construction retained parent |
| 13 partial bootstrap/support/policy | same known725/project520, mismatch200 and historical policy subtotal0 |
| 14 per-file/aggregate overlap | same held10+new7 and aggregate17 arithmetic; read/write adapter checks retained parent |
| 15 unselected/selected support | same 860 and710 totals |

Thus 14 scope baseline behavioral cases have child provider evidence; the sole
adapter-only case and mixed adapter assertions remain unchanged with harness.
Child scope has 19 expanded cases: these 14 plus subtree overlap, two hash/byte
source conflicts, brief byte conflict and unavailable API-view subtotal1230.
No baseline expectation was changed.

Baseline measurement has 13 cases: measurementCase 1 (run freezes B/job.json),
2 (invocation records snapshot/size), and4 (run still starts/failed readiness)
remain coordinating integration cases. Cases3 (producer cannot measure),5
(subtree overlap),6 (unknown new module) and7 (architect publication) have child
provider cases with identical behavioral assertions; case7 supplies a small real
published directory rather than invoking materialization. The six subsequent
script-boundary cases (caught Git/Ramify/candidate arguments, unused required
materialization, exhausted mutation, ownership argument/exhaustion) remain
harness helper checks. Child measurement additionally tests exact raw-byte hash,
producer extra field/revision/head/support retention and three invalid-document
states; total8. CLI answers alone are scripted, never KPI calculation.
Attribution source/contracts/tests are unchanged: setup38 and delivered16.

### Temporary duplicates and consumers still owed

All old production bodies and baseline tests remain, not forwarders. Retire the
parent snapshot/scope/delivered-support algorithms and their private rule helpers
only with real consumer migrations. Parent execution adapters must call the new
provider, not retain policies in callbacks. Existing run/service.ts,
steps/runner.ts and projections metrics.ts still call baseline bodies; old internal
KPI helpers, run collectors and root qualification remain untouched. The full
remaining inventory below still applies, including old attribution duplicates.
No provider/requester, composed acceptance or scenario binding is claimed.

### Current focused verification

Project-root logs: plans/kpi-extraction/.harness/jobs/20261014T103040Z-9c4e05/
invocations/inv-0037/shell/. 004.log: check:self passes, 15 owners/933 sources,
0 errors/warnings, 456 analysis limits (partial coverage); all four type-check
commands pass. Exact four child quick filters pass 81 cases: scope19,
measurement8, setup38, delivered16, zero failures/skips. 005.log: exact baseline
scope15 + measurement13 pass (28 total), zero failures/skips. 006.log summarizes
baseline run and authoritative configured discovery from005: 441 files, all four
KPI files in node and25 projections files. Discovery is not execution. Config
and guard/native registrations are unchanged. No new exemptions/processes or
whole-suite engineer run. Native witnesses, Cucumber, web build and full committed
default audit are unrun here and belong to the gate. Focused passing baseline
coordination still exercises the old provider, not a migrated requester.

## Historical attribution bootstrap

## Authority and comparison basis

This iteration bootstraps the real untagged `ramify-agent/harness/kpi` direct child.
The guarded declaration write succeeded under assignment
`b5b3e2a4f0a67bb5b48359a4b2d26ec959920f8cc4f28ee4836237c3eedb87c5`,
ownership evidence `20886c25acfb37b2560ed3cc6f61101617231041efb30f90dd102dfe3bd078a2`.
There was no new bootstrap refusal. Initial hook deadlines did not verify changes.
Initial materialization failed because the first declaration referenced not-yet-created
sources; reducing it to the module header allowed materialization, and the final
selected exposures were restored after implementing their sources. An attempted
materialization of the not-yet-created tests directory returned invalid-location;
the later ordinary/testing refresh succeeded. Neither failure was a passing check.

Baseline is the current unchanged `subs/harness/src/kpi/` implementation and its
selected tests at candidate `e7bb3e4c3c3d2e5096406adc0e051240863c033e`.
Historical assignment refusals remain historical, not verification for this child.
No baseline production, baseline tests, root/scripts, projections, runtime,
registrations, configuration or features were edited.

## Selected contracts and signature closure

The child exposes to parent only:

- `verifySetupLineIdentities`, `SetupLineIdentityInput`, `RecordedSetupDelta`,
  `SetupCandidatePartition`, `SetupLineMappingFacts`, `SetupSourceLine`,
  `SetupAddedLineFact`, `SetupDeletedLineFact` from `setup-attribution.ts`.
- `deliveredChange`, `DeliveredChangeRequest`, `DeliveredChange`,
  `HarnessLineIdentities`, `cachedChangeHistory` from `delivered.ts`.

`HarnessLineIdentities` closes the verifier return contract; it contains only
primitive fields and anonymous entries. Setup input types recursively name every
listed companion. Delivered request additionally names the original harness
`LineEventSummary` (and its harness schema-defined anonymous reading fields),
while delivered behavior and cache name evidence `ChangeHistory`. History closure
is evidence `ChangedFile`, `LineCommit`, and its tuple `LineRange` (also exposed
as `GitLineRange`). Primitive collections, promises and `AbortSignal` are standard
library types. The parent already receives these original evidence types and owns
its line-event vocabulary. No copied/derived cross-owner definitions are introduced.
Private helpers are not production APIs.

The child ordinary imports resolve `../../evidence/src/git.js` and
`../../../src/run/records.js`. Tests independently resolve
`../../../evidence/src/git.js` and `../../../../src/run/records.js`.
Both refreshed pages explicitly list the required evidence and record types.
No parent declaration edit was necessary: existing selected descendant reading
exposures already suffice. These apply throughout the harness subtree, not only
KPI; no additional visibility, algorithms or browser exposure were added here.

Final compared ordinary/testing API evidence is one analysis revision:
`rev/1:d0001883-7e08-4e19-9c18-bf8fcf94f85e:12`.
Ordinary `_meta.json`: coverage 39, truncated 4. Testing: coverage 78, truncated 4.
These are limitations, not proof of complete signature analysis. Original supplied
parent views were revision `rev/1:f4c829fe-9f73-4302-97dd-c52909514d9e:2`
with one ordinary and 27 testing limits; they are not combined with the refreshed
child views. The complete structural command passes with partial coverage (455
analysis limits), not a claim that every project access was proven.

## Baseline parity and duplicate retirement map

Both production files have identical normalized source text to their baseline
apart from relocated imports, comments and the explicit `limit: number = 512`
annotation (same value and behavior). Production helpers retained in both copies:

- setup: `present`, `position`, `hash`, `path`, `key`, `sources`, `equalSources`,
  `verifySetupLineIdentities` including local `index`, `unknown`, `set` helpers;
  `Kind` and `Partition` remain private types.
- delivered: `deliveredChange` including `unattribute`, `tally`, `setupLine`,
  `add` helpers, `unanswered`, `cachedChangeHistory` including `kept`; private
  `Tally` remains local. All public contracts are duplicated until composition.

Complete pure setup fixture/case normalized comparison passes, including all
parameter tables. Complete pure delivered fixture/case comparison passes ignoring
trivia, relocated imports and trailing commas. This textual comparison is not an
independent semantic oracle; identical baseline expectations execute against both
real providers. No calculation, reason/error text, ordering or policy was revised.
The first attempted TypeScript scanner comparison failed because installed
TypeScript 7 no longer exports the old parser API; it established no parity.
The subsequent read-only text comparisons establish the stated narrower evidence.

Every duplicated pure setup test body from
`subs/harness/src/tests/plan23-trial-attribution.test.ts` is now in
`src/tests/setup-attribution.test.ts` (38 expanded cases):

1. Surviving shifted setup in mixed same commit/file.
2. Addition with irrelevant other-writer source proof absent.
3. Deletion with irrelevant other-remover mapping absent.
4. Reverted setup leaves same-commit agent lines.
5. Later writer rewrite with matching setup text.
6. FINAL rename authenticates original source path.
7. Ambiguous same-text source position.
8. Arbitrary BASE-to-before deleting successor.
9. Missing arbitrary-before lineage.
10. Wrong removing successor.
11. Later writer deletion.
12. BASE rename for deletion.
13. Chain table: missing, BASE not first, FINAL not last, duplicate.
14. Before revision older than BASE.
15. Facts table: stale FINAL, stale BASE, wrong blob, binary/unreadable,
    wrong source hash.
16. Independent deletion and unrelated verified subtotal with unknown addition.
17. Unknown setup commit affects path candidates only.
18. Compatible record union.
19. Unknown wins union.
20. Duplicate table: record, facts, source position, FINAL position.
21. Invalid FINAL positions: zero, negative, fraction, NaN.
22. Missing direct-diff and invalid candidate errors.
23. Outside/traversing origin path.
24. LF, CRLF and missing EOF LF authentication.
25. Complete full reversion yields empty identities.

Its `sha`, `rule`, `other`, `record`, `fact`, `input`, `result`, `expected`, and
`deletion` fixture bodies are also duplicated. Retire the parent's pure describe
and those fixtures after root integration; retain its final scratch-cwd
coordination test and its scope/working-directory helpers with harness.

Every duplicated pure delivered test body from
`subs/harness/src/tests/delivered-change.test.ts` is now in
`src/tests/delivered-change.test.ts` (15 baseline cases):

1. Later rewrite and deleted-base remover.
2. Harness commits/paths and binary path.
3. Shared per-path split and unnamed added line.
4. Unreadable shared writers and unrecorded commit.
5. Not-applicable and failed Git unavailable, not zero.
6. Cached repeated reads and rejection retry.
7. Exact setup commit/path with later writer edit.
8. Overlap unknown with unrelated known subtotal.
9. Shared complete shell snapshots versus collection loss.
10. Pure rename and reverted final diff zero.
11. Mixed setup/agent same commit/path exact positions.
12. Reverted setup and stale FINAL mapping.
13. BASE deletion identities and removing commit.
14. Unknown setup mapping retains unattributed weight.
15. One recorded writer cannot claim overlap; unrelated path stays known;
    recorded global overlap gap refuses guessing.

Its `base`, `harnessCommit`, `first`, `second`, `final`, `Script`, `scripted`,
`lines`, `range`, `file`, `summary`, and `request` fixtures remain duplicated.
Retire those parent pure bodies and fixtures only after integration, retaining
`Plan23 overlapping line snapshots retain known path deltas with an explicit
attribution limit` as harness-owned lineEvents coordination. Child adds one small
bounded FIFO eviction/key-separation case (16 total cases). No witness registration
moves are required because the baseline witnesses have not moved.

## Remaining owner-scoped migration inventory

Historical pre-line-composition inventory: all eleven old production files existed;
the current line seam below retires lines.ts, leaving ten. None is a forwarder:

| File | Remaining responsibility |
| --- | --- |
| setup-attribution.ts | Replace root/projections consumers with child through harness re-exposure; remove old verifier/contracts/helpers. |
| delivered.ts | Replace harness cache and projections attribution consumers; remove old contracts/algorithms. |
| capture.ts | Scope rules, snapshots/measurement acquisition coordination and size calculation; separate provider rules from harness execution adapters. Includes baselineScope, write/readScopeMeasurement, deliveredScopeInputs, invocationScope, captureSnapshot, scopeSize, componentSubtotal, projectOnlySize, revisionMismatch, directoryBytes, fileBytes, rootModuleOfSnapshot, inventoryPath, supportDocument, planSupportPath. |
| lines.ts (now removed) | lineEvents/takeLineSnapshot and contracts now child-owned; ownerOf/owns retained unchanged at harness measurement/owners.ts. |
| efficiency.ts | Recorded charge estimation and invocation timing rules. |
| exploration.ts | Search counts, identities, elapsed time, details/metrics; declaredRoots coordination inputs. |
| guarding.ts | Guarding report/count rules. |
| lineage.ts | lineage/2 metric rules and companions. |
| metrics.ts | kpi/1 formulas, scope-size/2 policy, comparable scope metrics and companions. |
| sessions.ts | Session metrics and companions. |
| trial-report.ts | Execution/qualification destination protection, not KPI ownership; preserve outside-project/symlink protection. |

Historical production import inventory before the line-composition iteration
(current line-consumer replacements are recorded below):

- `scripts/trial-attribution.ts`: exact verifier/source-fact types and trialReportDestination.
- harness `run/service.ts`: capture adapters, history cache, lineEvents/snapshots.
- `steps/runner.ts`: scope inputs/size and declaredRoots.
- `run/port-events.ts`: recorded charge and ExplorationObservation.
- `work/engineer-equipment.ts`, `reviews/signals.ts`, `run/excursions.ts`: ownerOf.
- projections `metrics.ts`: exact setup contracts, deliveredChange, scope helpers,
  guarding, lineage, KPI/comparable formulas, exploration details and timing.
- projections `lineage.ts`: lineage contracts.
- Internal old KPI imports must be retired with their algorithms, not redirected
  via forwarding files. Existing harness root/descendant exposures must be replaced
  by selected child behavior re-exposures when those consumers migrate.

Tests still depending on the old directory include the two bounded baseline files,
`fixture-trials`, `plan23-trial-attribution.boundary`, `line-events`, `kpi-metrics`,
`plan23-exploration-metrics`, `unguarded-write`, `plan25-combined-delivery`,
`scope-size-recipe`, `plan23-observation-integration`, and helper modules
`measurement-flow`, `recovery-git`, `gate-git`. Split provider rules from owner
coordination in later assignments; preserve all native claims. Root collector
qualification remains root-owned. Projections' 25 configured files remain discovered.

Before line composition the parent still knew every old algorithm. Only after execution,
projections and root composition will it no longer need their implementation
knowledge. The new reading-input cost is exact authenticated line facts, ordered
history and recorded line events; no writable authority or acquisition knowledge
moves. Actual requesting-consumer/provider verification, broader rules extraction,
whole old-directory retirement and cap-001/scenario acceptance remain owed.

## Verification receipts and limitations

Commands ran at the project root. Complete logs are under
`plans/kpi-extraction/.harness/jobs/20261014T103040Z-9c4e05/invocations/inv-0031/shell/`:

- `006.log`: `npm run check:self` passed, 15 owners/930 sources, 0 errors,
  0 warnings, 455 analysis limits, partial coverage; `npm run type-check` passed
  all four declared compiler checks.
- `007.log`: exact child quick filters: 2 files, 54 passed (38 setup, 16 delivered),
  zero failed/skipped. Exact baseline/root filters: 3 files, 82 passed (39 setup
  including coordination, 16 delivered including lineEvents, 27 root collector),
  zero failed/skipped.
- `008.log`: authoritative configured `vitest list --filesOnly --json`, 439 files,
  both KPI tests in `node`, 25 projections tests. Discovery is not execution.
- `010.log`, `011.log`, `012.log`: comparison, refreshed view metadata and guard receipts.

For exact cwd and test window `2026-10-14T11:44:19.787Z` through
`2026-10-14T11:44:21.024Z`, all five guard receipts are ordinary (`native:false`),
with zero allowed/native launches and zero refused attempts. Guard SHA-256
`af06ff2a7e01558bb334f12694d81ae7b703c501eee11afd62c6d0fa3da7806d`,
registration SHA-256 `5d41a78c29317736864e1ac6027bd962f20b04cba8b22884c02638ff1b71587c`.
A separate earlier root collector receipt printed in 012 is outside this window
and is not counted. No guard, native registrations or configured discovery were
changed. No whole-suite engineer run occurred. Native witnesses (unchanged),
Cucumber, web build, and the complete committed default audit were not run here;
the gate owns the audit. Focused passes do not claim composed acceptance.

## Line-observation composition (current candidate)

Continues accepted `782fbe391da43b9bd1711b98dea472a72a90806d`.
Historical ga-0005 failure and recorded skips remain historical; ga-0006 passed
following its EOF-only repair. No claim here replaces those committed outcomes.
This candidate's default committed audit is requested through the gate, not run
by the engineer; its outcome is not yet known when this inventory is written.

### Ownership and complete consumer map

`LineChange`, `LineSnapshot`, `LineEventRequest`, `takeLineSnapshot` and
`lineEvents` moved from harness `src/kpi/lines.ts` to child `src/lines.ts`.
Arithmetic, sorting, failure reasons, binary-byte comparison and overlap policy
are unchanged. `ownerOf` and private `owns` moved unchanged to harness
`src/measurement/owners.ts`. The old lines.ts is deleted, not a forwarder.
Shell 020 proves absence; the extended `projections-pure` test also requires
ENOENT and applies the existing no-writing-primitives tripwire to both new files.

Complete former lines.ts production consumers:

| Consumer (harness src) | Current import / responsibility |
| --- | --- |
| run/service.ts | ../../subs/kpi/src/lines.js: lineEvents, takeLineSnapshot, LineSnapshot |
| reviews/signals.ts | ../measurement/owners.js: ownerOf |
| work/engineer-equipment.ts | ../measurement/owners.js: ownerOf |
| run/excursions.ts | ../measurement/owners.js: ownerOf |

Testing consumers `helpers/gate-git.ts` and `helpers/recovery-git.ts` now import
child LineChange; `delivered-change.test.ts` imports child lineEvents. The retained
`line-events.test.ts` imports child LineChange only; it invokes measurement through
real production run service, not a substituted KPI. The source search has no old
lines import; only the explicit removal assertion refers to that old path.
The child imports original evidence `GitService`/`gitService` and `ArchitectIndex`,
harness ownerOf and the original LineEventSummary/schema. No process, writer,
ledger, assignment, policy callback or duplicate owner lookup was introduced.

Harness owns timing, accepted boundary selection and `recordLineEvents`, including
its unchanged writeFileAtomic path, formatted JSON plus LF and original schema.
The retained integration case now additionally compares the entire persisted
record and exact JSON formatting. It still verifies both Git calls use the accepted
scenario boundary, exact line deltas, invocation identity and owners. No KPI fake
is used. The parent no longer needs line-delta algorithms; it retains execution
and general ownership knowledge. Scope adapters and all other old KPI algorithms,
root/projections consumer migration and full directory retirement remain owed.

Child declaration exposes the five owner-local contracts/entry points to parent.
Harness descendant exposure selects ownerOf and original ArchitectIndex closure
(ModuleEntry, SymbolRecord, ExposureChannel). GitService's typeof members require
its full original function closure: commonDirectory, isAncestor, recoveryStatus,
trackedPaths, ignoreStatus, previewCandidateTree, currentHead, isCleanRepository,
createRunBranch, inspectRunBranch, commitAccepted, findCommitByTrailer,
findCommitByTrailers, changedPaths, changedEntries, diffNameStatus, diffNumstat,
commitNameStatus, worktreeLineChanges and worktreePatch; named companion closure
is CommitTrailer, IgnoreStatus, IgnoreRule and CandidateTreePreview. This broad
reading/acquisition exposure is the cost of retaining the specified original
GitService seam, not permission to write run state. It applies to all harness
descendants, not parent/browser. Existing testing helpers mockGit, architectIndex
and moduleEntry are selectively exposed to descendant tests; no new fake is added.

### Complete moved/retained case map

All nine original harness `line-events.test.ts` cases are accounted for:

| Original exact case | Current owner/file |
| --- | --- |
| the two snapshots around a session give its own lines, and the view gives each path its owner | child tests/lines.test.ts |
| a session that changed nothing has an empty summary; a path with no owner is counted as unmapped | child tests/lines.test.ts |
| a snapshot that could not be taken is a coverage gap, never a zero | child tests/lines.test.ts |
| a path no module's contents hold is unmapped, and is never attributed to the root | child tests/lines.test.ts |
| a binary file carries its byte count and no invented line count | child tests/lines.test.ts |
| a change made and put back between the snapshots delivered nothing, and the count stays complete | child tests/lines.test.ts |
| the owner of a path is the module whose own contents hold it | harness tests/owners.test.ts |
| the summary beside the invocation names what that invocation wrote | harness tests/line-events.test.ts retained/strengthened |
| failed, stopped, repaired, context-limited and no-change sessions are all in the session set | already ported child tests/sessions.test.ts; parent duplicate retired |

New child case: binary byte changes and overlapping writers retain sorted partial
contributions (also decreasing additions clamp at zero and unchanged binary bytes
produce no second delta). New harness owner case: deepest matching area wins
independent of order and native separators; includes area-prefix and exact
README rejection. All original assertions remain represented. Existing child
sessions test has the original session/end/change/usage assertions plus its
separate empty-input/unknown-total case. Native cases and registrations stay
with their original coordinating owners; no registrations or discovery change.

### Current verification and access limitations

Logs: `plans/kpi-extraction/.harness/jobs/20261014T103040Z-9c4e05/invocations/inv-0059/shell/`.

- 013 and 023: type-check passed all configured compiler checks; check:self
  completed/passed, partial coverage, 15 owners, 950 sources, 0 errors/warnings,
  457 analysis limits and 0 denied accesses. Interim deadline-exceeded hook checks
  were not passes; the completed full structural check supersedes that limitation.
- 018: exact quick filters for child lines (7), child sessions (2), harness owners
  (2), line-events (1), delivered-change (16), review-signals (10), read-excursions
  (7), plan23-observation-integration (38): 8 files, 83 passed, 0 failed/skipped.
- 022: exact projections-pure quick filter: 3 passed, 0 failed/skipped. Exact
  registered measurement.boundary filter: 2 passed, 0 failed/skipped, retains
  installed producer/native Git and actual run collection. Other native files
  were unchanged and not engineer-run; full native execution belongs to the gate.
- 023: final exact line-events filter after JSON-byte assertion: 1 passed,
  0 failed/skipped (repeat execution, not another unique case).
- 020: authoritative configured discovery: 449 files, new lines/owners and retained
  line-events in node; all 25 projections files still discovered. Discovery is
  not execution. Configurations, compiler manifests, guard and registrations unchanged.
- 025/026: ordinary run receipts at this cwd from 14:22:43.954Z through
  14:22:51.060Z on 2026-10-14 have zero allowed/refused launches. Purity and final
  coordinating run receipts also have zero allowed/refused. Native measurement
  receipt 14:24:37.210Z..14:25:12.421Z records 76 API observations and zero refused
  attempts (API observations are not successful process counts). Guard and registry
  hashes match the historical hashes above.

019 refreshed both ordinary/testing areas for both owners; 020/021 inspected
required received signatures. One candidate analysis revision is
`rev/1:1d1361bf-756c-4b12-93ea-79c35045daf2:1`: harness ordinary/testing coverage
limits 1/27, KPI ordinary/testing 39/78, each truncated 4. Required child line API,
original GitService/gitService, ArchitectIndex closure, ownerOf, original durable
records and testing helper pages are present. These limited views cannot establish
absence of other capabilities. The supplied revision 67 and earlier revisions
remain historical and are not combined with this candidate state.

Unique focused cases: 88 passed across 10 files, zero failures/skips; final one-case
rerun passed. Complete Cucumber, web build, remaining native witnesses, full tests
and the default committed audit are unrun by this engineer and remain gate-owned.
This evidence proves one real line-collection seam, not scope/calculator,
root/projections or complete cap-001/scenario acceptance.

### ga-0007 failure and bounded repair

Preserved audit receipt `20261014T103040Z-9c4e05:ga-0007`, audited candidate
`4839baa35960d3b8ffe582a41eb00d061f3c323c`, verdict fail/check-failed.
Requested ramify-partial executed full due to drift-cap (39 paths versus limit 25,
compared with full-audit base bad37865e1a3518b1a5d3a9923044d494a420025).
agent-tests: 447 files passed, 1 failed, 1 skipped of 449; 3823 tests passed,
1 failed, 2 skipped of 3826. These skips remain recorded; their identities are
not supplied by the repair briefing. Exact failed case:
`subs/harness/src/tests/composition.test.ts`:
`the acceptance matrix, composed > every case has exactly one owning iteration, and its owning tests are present by name and belong to that iteration`.
Diagnostic: `M5: subs/harness/src/tests/line-events.test.ts has no test named
"M5: every session counts, whatever ended it"`.
Other configured checks passed: patch-integrity, typecheck, structure, web-build,
and scenarios (6 passed/0 failed/0 skipped; 61 steps passed/0 failed/0 skipped/
0 undefined). Counts for other non-test checks are unknown as supplied.

Cause is the retained frozen acceptance citation navigating to the retired parent
session duplicate. The bounded repair adds an exact M5 navigation mapping to the
existing child `sessions.test.ts`, following the existing exact M2 moved-file
mapping. Frozen citations, titles, unique iteration ownership, owning results-note
checks and all assertions remain intact; no contract artifact, test discovery,
registration or production implementation changed. Collection stays harness-owned.

Repair log `invocations/inv-0060/shell/001.log` under the same job: exact quick
filters composition (13) and child sessions (2), 15 passed/0 failed/0 skipped;
type-check and check:self passed (partial structural coverage, 457 analysis limits,
0 errors/warnings/denied accesses). The current supplied requester views are
revision `rev/1:f4c829fe-9f73-4302-97dd-c52909514d9e:89`, limits 1/27/39/78;
no new cross-owner import is required for this repair. This focused pass neither
erases ga-0007 nor proves a flake. The next gate selects execution/reuse and owns
the qualifying committed audit verdict; no full audit was run by the engineer.

## i13 — comparator ownership corrected; composed selection still partial

The five child behavior suites retain all describe/test identities, inputs,
literal/schema/error expectations and fixtures. Parent baseline imports and
parity-only assertions are removed; timing/exploration/guarding/comparable
wrappers become direct local calls, computed metrics/lineage keep schema parsing.
First preserved complete genuine parent/child comparisons in coordinating
harness `src/tests/measurement-parity/`, with harness-local fixture copies.
No private child fixture imports, production helpers, declarations or provider
algorithms changed. Temporary coordinator suites last until assigned case-mapped
parent baseline retirement; no parent bodies retire here.

Exact one-to-one map (same basename and all test titles/bodies, in order):

| Child `src/tests/` file | Harness `src/tests/measurement-parity/` file | Cases each | Baseline comparisons |
| --- | --- | ---: | --- |
| efficiency.test.ts | efficiency.test.ts | 3 | 5 timing sites, all end/milestone/duration edge inputs; charge-only case not parity |
| exploration.test.ts | exploration.test.ts | 7 | 11 details sites (5 through metrics helper), source replay/conflicts, unknown search statuses, collection limits |
| guarding.test.ts | guarding.test.ts | 3 | 4 report sites, shell/gaps/verdicts/empty input |
| lineage.test.ts | lineage.test.ts | 13 | 13 computed sites, recorded and missing starts, local/global forks, degradation/repair/generations |
| metrics.test.ts | metrics.test.ts | 19 | 21 KPI sites plus 9 comparable sites, complete/partial/zero/missing/incompatible evidence |

[Coordinator receipt](../../src/tests/measurement-parity/README.md) gives exact
commands, all compared inputs/case groups, discovery and remaining owner-local
baselines. Inv-0089 shell/008 proves all seven copied suite/fixture files exact
apart from defining imports before repair; shell/016 verifies child/coordinator
test bodies remain byte-identical. Child tests have no parent KPI imports.
Harness baseline reads remain in owner-local kpi-metrics.test.ts,
plan23-exploration-metrics.test.ts and unguarded-write.test.ts, inventoried for
future retirement; no re-exposure was restored to satisfy tests.

Current inv-0089 receipts: shell/009 `npm run type-check && npm run check:self`
passes all four TypeScript projects and structure, with partial coverage:
15 owners, 959 sources, 92 resources, 18502 accesses; 13694 allowed, 0 denied,
4802 external; 0 errors, 0 warnings, 458 limits. Not-checked deadline hooks remain
not passes. Shell/010 exact five-child/five-parity `test:quick` selection passes
10 files/90 tests, zero failures/skips, with counts in the table.

Shell/011 required i12 nine-file quick selection **failed**: eight files/68 tests
passed, one suite failed with zero tests. Retained projections kpi-metrics.test.ts
contains only JSON discovery output: `No test suite found`. No write to that file
by this invocation; no origin inference. Projections tests cannot be repaired on
this assignment. Advisory architect confirmed preserve failure and return partial
for recorded restoration of all three original query cases/child import migration.
Other exact counts: lineage 14, efficiency 1, observation 9, setup 4, session 1,
run-protocol 9, projections-pure 3, root collector 27. The root/script original
examples still execute actual child/relocated validator; repeated/reopened actual
HTTP and durable/event/process evidence stays unchanged and passed. Shell/012
separate exact attribution boundary selection passes seven native cases, no skips.
Shell/015 configured discovery lists all 19 exact node files plus native file,
including five added parity suites; discovering the defective file is not a pass.

Shell/013–014 refresh separate root/projections/KPI ordinary/testing areas at
`rev/1:9ef78384-9e9a-4944-94f2-d73967d04806:35`: coverage limits root 39/77,
projections 39/69, KPI 39/78; truncations 2/2, 4/4, 4/4. These incomplete views
cannot prove absence; supplied revision 24 and historical revisions stay separate.

Gate owns committed default audit over the retained composed candidate; no audit
requested for the failed selection. Historical failed audits/i09/i11/i12 limits
are not erased; two opt-in fixture skips remain unrerun/not passing. Still owed:
composed weighted 2500/100000/40, missing writer subtotal, zero versus failed
history, complete cache/rates/search-conflict cases, full selected feature evidence
and assigned parent-body/pure-test retirement. No scenario binding, capability
completion or task handback.
