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
