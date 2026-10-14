# kpi

Measurement and attribution rules. This ordinary, untagged direct harness child
owns snapshot construction, scope-size/2 accounting, delivered-support identity
rules, pure exact setup-line verification, delivered-change attribution and
recorded-fact KPI, lineage, exploration, timing/charge, guarding and session rules.

## Current continuation status

Invocation qualification now also belongs to `capture.ts`:
`invocationReadSize` selects recorded read facts before acquisition;
`invocationScopeSize` qualifies absent snapshots and missing declarations and
merges delivered support identities; `invocationScopeFailure` preserves the
declared snapshot/non-support subtotal and acquisition reason. Their factual
companion is `InvocationScopeDeclaration`; there is no execution callback.
The harness acquires inputs and remains the sole durable writer. Four independent
child recipe cases assert exact answers/order/reasons and read behavior; actual
collection/query and native witnesses remain with their coordinating owners.

This continuation is partial: the old parent duplicates/parity files and their
case-mapped retirement/API minimization are still owed. Historical transition
receipts below are not a final source ownership report or all-ten-scenario
acceptance. See harness `measurement-integration.md` for the new rule map and
observed checks; see `transition.md` for historical evidence preserved unchanged.

## Contracts and invariants

- `src/lines.ts`: `takeLineSnapshot` uses the original evidence `GitService`;
  `lineEvents` computes per-invocation deltas, sorted paths, binary byte changes,
  unmapped counts and explicit failure/overlap gaps. General `ownerOf` lives in
  harness `src/measurement/owners.ts`, not in the calculator. Harness run service
  chooses before/after timing and writes the returned original line-events/1 record.

- `src/capture.ts`: `captureSnapshot` reads the evidence-owned measurement
  producer and published architect bytes. It preserves raw producer SHA-256,
  revision, document and unavailable reasons. `scopeSize` consumes `DeclaredScope`
  factual selections and captured location bytes, deduplicating source, API,
  architect and support components. Unknown totals retain known disjoint buckets;
  incompatible revisions clear state-bound buckets. `deliveredScopeInputs` consumes
  ordered `DeliveredSupportEntry` facts, not manifests or prompt packages; source
  identity conflicts throw, repeated briefs count once by hash using the last
  supplied entry's bytes (including inconsistent byte counts), as in the baseline.
  Acquisition of
  assignment locations and execution/package discovery stays with harness.
- `src/setup-attribution.ts`: `verifySetupLineIdentities` accepts authenticated
  ordered Git facts, recorded setup deltas and complete direct-diff partitions.
  It returns revision-bound `HarnessLineIdentities`. No lineage guessing,
  same-text alignment, path exemption or count subtraction is permitted.
  Unknown (`null`) is distinct from verified absence (`[]`). Invalid candidate
  identity or missing direct-diff partitions throws the original errors.
- `src/delivered.ts`: `deliveredChange` reads evidence-owned `ChangeHistory` and
  harness-owned recorded `LineEventSummary` facts. It compares BASE with accepted
  FINAL, counts only surviving change, splits shared commits by recorded per-path
  additions/deletions, and preserves binary paths, unattributed reasons, ordering,
  partial subtotals, unavailable and not-applicable outcomes.
- `src/metrics.ts`: `kpiMetrics` retains kpi/1 ordering, units and evidence.
  Delivered weights are surviving BASE-to-FINAL lines, not gross session edits.
  Missing sizes retain known byte-line subtotals and complete-size weight;
  unattributed weight prevents a whole-run ratio. Zero weight is not-applicable.
  `comparableScopeMetrics` compares corresponding project-only and total sizes
  under scope-size/2 and the same frozen snapshot. Continued model histories
  count each component at its maximum; a degraded fresh start counts another
  history, not another harness session. Usage categories stay separate.
- `src/lineage.ts`: `lineageMetrics` keeps lineage/2 and glossary order. Actual
  starts govern grouping; unknown starts retain requested groups but lack
  coverage. Local-source forks are separate from global generations; degraded
  fresh starts inherit nothing. Replacement reasons use harness vocabulary.
- `src/exploration.ts`: `explorationDetails` consumes recorded observations in
  call order, deduplicates source identity (not storage row id), excludes
  conflicting replays and retains unknown scope/match/duration status. Known
  subtotals are not complete counts. No scanned-byte estimates. `declaredRoots`
  stays with harness execution; KPI does not discover assignment/prompt roots.
- `src/efficiency.ts`: `invocationTiming` separates wall boundaries from summed
  tool durations and retains explicit milestones and coverage. Recorded charge
  components use tokens times their recorded category rates per million; a
  missing usage/rate leaves that component and complete total unknown, without
  discarding other components. No rate lookup or inferred cache saving.
- `src/guarding.ts`: `guardingReport` describes guarded versus unguarded tools,
  sorted unique excursions and gap counts. Its original completeness policy is
  descriptive, not proof of scope compliance or a gate license.
- `src/sessions.ts`: `sessionMetrics` counts every supplied invocation including
  failed, stopped, repaired, context-limited and unchanged entries. Any missing
  usage makes the token total unknown; empty entries are a known zero.
- `cachedChangeHistory` keeps argument-keyed promises, evicts oldest entries past
  its bound (default 512), and discards rejected answers. Hits do not refresh FIFO.

The harness remains composition owner and the sole durable writer. The child
receives reading contracts only, never a run/ledger service, prompt, assignment,
process launcher or measurement acquisition implementation. Git stays evidence-owned.
There is no browser KPI API. The declaration exposes selected behavior and every
owner-local named signature companion to the parent; foreign companions are
already received by that parent from their governing owners.

## Tests

Follow the root [testing rules](../../../../docs/testing.spec.md). Tests in
`src/tests/` script only external Git answers and exercise the real provider.
Run from the project root:

```
npm run test:quick -- subs/harness/subs/kpi/src/tests/metrics.test.ts subs/harness/subs/kpi/src/tests/lineage.test.ts subs/harness/subs/kpi/src/tests/exploration.test.ts subs/harness/subs/kpi/src/tests/efficiency.test.ts subs/harness/subs/kpi/src/tests/guarding.test.ts subs/harness/subs/kpi/src/tests/sessions.test.ts subs/harness/subs/kpi/src/tests/scope-size-recipe.test.ts subs/harness/subs/kpi/src/tests/measurement.test.ts subs/harness/subs/kpi/src/tests/setup-attribution.test.ts subs/harness/subs/kpi/src/tests/delivered-change.test.ts
```

The process guard, configured discovery and exact native registrations are
unchanged. Scratch-cwd and lineEvents collection coordination remain harness-owned.
See [transition inventory](transition.md) for retained baseline duplicates,
comparison evidence, access limitations and subsequent owner-scoped migration.
Owned calculation tests also compare full answers with the real, temporarily
retained baseline through existing testing exposures; no KPI fake is used.
Sessions and recorded charges retain baseline bodies and expected cases but lack
selected baseline function exposure for a child runtime comparator. Run service
now consumes real child line measurement; other calculator, scope adapter,
root and projections composition remains owed. This one seam does not establish
whole old-directory retirement or cap-001 completion.

Focused line checks: `npm run test:quick -- subs/harness/subs/kpi/src/tests/lines.test.ts subs/harness/src/tests/owners.test.ts subs/harness/src/tests/line-events.test.ts`.
