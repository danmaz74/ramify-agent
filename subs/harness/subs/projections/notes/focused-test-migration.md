# Focused query-test migration slice

Baseline: accepted consumer integration `69fc709a5c352678f0ea4a263080fbce1b3e0fe5`.
This note supplements, not rewrites, the historical extraction receipts.

## Ownership and assertion preservation

Moved from harness `src/tests/` to projections `src/tests/`:
- execution-map-causal.test.ts (5 cases)
- execution-map-modules.test.ts (5 cases)
- execution-map-projection.test.ts (9 cases)
- run-projections.test.ts (7 cases)

Only import paths changed in these files; fixture construction, comments and
assertions remain unchanged. All private projectors resolve locally, not to
parent copies. Before removing parent execution-map-pages.test.ts, comparing
both files after their five import lines established identical remaining bodies.
The existing child file retains all three page cases; it passed in configured
Node discovery before the parent duplicate was removed.

Child exact test inventory grows from six to ten files; parent loses five
focused files. Production remains 23 child implementation files with unchanged
public entries, private projector visibility and untagged header. Parent old
production copies remain. No HTTP/CLI/recovery/full-run coordination moved.
No protocol schemas, browser tags, configuration or process exemptions changed.
The exact native-boundary registry contains none of these five parent paths.

Fixtures remain harness-owned. Narrow expose-test declarations relay only at,
constructedRun, hash, item, obligation, registered, requirement, reviews and
Line. Explicit signature annotations now name ConsumerRequirement and
ProviderObligation rather than leaving their return contracts inferred.
Existing RunRecord, RunEvent, RegistryEntry, WorkItem and contract companions
are selected descendant reading exposures. CommittedRun/CommittedLine are
re-exposed from their child owner to satisfy constructedRun's return signature;
they contain decoded committed input, not writer authority. scenarioSourceHash
is re-exposed alongside the existing scenario reading schema from its owner.
No private projector or new writable service is exposed. The parent no longer
needs to own these focused projector regressions; the cost is an explicit
parent fixture-testing relay and its reading companions, not copied helpers.

## API evidence and limitations

Initial supplied revision: `rev/1:6fb6dafb-b976-4f1e-b8b3-fa44398352a2:47`.
After declaration and fixture changes, `ramify materialize --from` refreshed
harness and projections ordinary/testing views from the same revision:
`rev/1:9b82a079-933a-45bb-a606-ee2096cbbf58:1` (both commands exit 0).

Read the refreshed child testing page
`src/tests/.ramify/external/subs/harness/src/tests/helpers/constructed.ts.md`:
all nine selected symbols are present, including Line and constructedRun's
CommittedRun result. Reading companion pages under that same external root
include run/log.ts (RunEvent), run/records.ts (RunRecord), analysis/records.ts
(RegistryEntry), work/records.ts (WorkItem), contracts/records.ts
(ConsumerRequirement/ProviderObligation), checks/records.ts (GateAttempt and
companions), and interfaces/protocol execution-map/evidence/runs schemas.
The scenario records page includes scenarioSourceHash with its readonly string
array input and string result. Parent children/projections/inputs.ts confirms
CommittedRun -> RunRecord + CommittedLine -> RunEvent, matching the defining
signatures. Child private imports require no foreign exposure.

Source-area coverage limits remain: harness ordinary 1/testing 26; projections
ordinary 39/testing 67. Truncated pages: harness 4 per area; projections 3 per
area. These are partial evidence, not proof of absent APIs or globally complete
companion coverage. No generated view was hand-edited.

## Exact verification

Run from project root, final source state:

```
npm test -- --maxWorkers=4 subs/harness/subs/projections/src/tests/execution-map-causal.test.ts subs/harness/subs/projections/src/tests/execution-map-modules.test.ts subs/harness/subs/projections/src/tests/execution-map-projection.test.ts subs/harness/subs/projections/src/tests/run-projections.test.ts subs/harness/subs/projections/src/tests/execution-map-pages.test.ts subs/harness/subs/projections/src/tests/committed-queries.test.ts subs/harness/subs/projections/src/tests/continuity-projections.test.ts subs/harness/subs/projections/src/tests/consultation-reading.test.ts subs/harness/subs/projections/src/tests/session-reading.test.ts subs/harness/subs/projections/src/tests/repair-reading.test.ts subs/harness/src/tests/http-query-source.test.ts subs/harness/src/tests/http.test.ts subs/harness/src/tests/consultation-inspection.test.ts
npm run type-check
npm run check:self
```

Focused runner: exit 0, 13 files / 60 tests passed. Per-file counts in listed
order: 5, 5, 9, 7, 3, 3, 4, 4, 1, 2, 1, 9, 7. Existing child six and parent
HTTP/query-source/consultation integration all remain healthy. Type-check
(including root, web, scripts and browser-acceptance configs): exit 0.
check:self: exit 0, completed/passed with partial coverage; 14 owners, 915
source files, 90 resources, 18466 accesses; 0 errors, 0 warnings, 447 analysis
limits, 13816 allowed, 0 denied, 4644 external. No new inferred-signature
finding remains for constructed fixture exports. The initial missing
CommittedRun companion diagnostic was repaired before verification. A README
hook timed out/not-checked; the subsequent complete check is the recorded
structural evidence, not that hook.

Full outputs are retained by the invocation shell receipts: final focused run
018.log, type/structural run 017.log, materialization 015.log and companion
inspection 016.log (under the invocation's shell evidence directory).
Discovery remains `subs/**/src/**/*.test.ts`, ordinary root process guarded.
These focused checks do not qualify all tests or scenarios. Whole-suite and
committed final audit are gate-owned; no acceptance features or bindings were
edited and no scenario completion is claimed.

## Remaining old-tree dependencies (next bounded slices)

Bounded literal scan of harness src/tests for `../projections/` found these 40
files (includes helper paths with `../../projections/`):

- acceptance-trial.test.ts
- accepted-commit.test.ts
- analysis-plan-evidence.test.ts
- automatic-repair-incidents.test.ts
- capability-records.test.ts
- capability-tasks-projection.test.ts
- check-findings-projection.test.ts
- composition.test.ts
- continuity-projections.test.ts
- execution-breakpoints.test.ts
- execution-map-durable.test.ts
- final-deviation-recovery.test.ts
- gate-progress.test.ts
- helpers/legacy-sessions.ts
- helpers/measurement-flow.ts
- http.test.ts (temporary unservedRun fixture only; real query uses child)
- integration-scenarios.test.ts
- kpi-metrics.test.ts
- lineage-metrics.test.ts
- nonfunctional-deviation-runtime.test.ts
- nonfunctional-recovery.test.ts
- nonfunctional-run.boundary.test.ts
- nonfunctional-run.test.ts
- operation-recovery-callers.test.ts
- plan13-composed-functional.test.ts
- plan23-observation-integration.test.ts
- plan25-combined-delivery.test.ts
- plan36-mutation-attribution.test.ts
- progress.test.ts
- project-boundary-audit.integration.test.ts
- projections-pure.test.ts (also structural old-directory expectation)
- recovery-snapshot.test.ts
- repair-export-command.test.ts (private baseline fixtures; real command uses child)
- review-lifecycle.test.ts
- review-stop.test.ts
- scenario-projections.test.ts
- session-lifecycle.test.ts
- session-queries.test.ts
- transcript-run.test.ts
- union-values.test.ts

This literal scan is navigation evidence, not an exhaustive dependency graph.
Production-tree deletion and all further test migrations remain deferred.
Full-run/recovery/HTTP/CLI tests, especially execution-map-durable, stay with
the coordinating parent even when their remaining private fixture seams are
adapted in future slices.
