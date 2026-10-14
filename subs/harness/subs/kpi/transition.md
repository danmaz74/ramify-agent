# Bounded KPI provider transition

## Snapshot/scope provider continuation (current iteration)

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
bytes throws the baseline error. Additionally, the requested factual boundary
rejects same brief hash with conflicting byte counts instead of silently
replacing the earlier count (new counterexample, not baseline parity claim).

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

All eleven old production files still exist; none is a forwarder:

| File | Remaining responsibility |
| --- | --- |
| setup-attribution.ts | Replace root/projections consumers with child through harness re-exposure; remove old verifier/contracts/helpers. |
| delivered.ts | Replace harness cache and projections attribution consumers; remove old contracts/algorithms. |
| capture.ts | Scope rules, snapshots/measurement acquisition coordination and size calculation; separate provider rules from harness execution adapters. Includes baselineScope, write/readScopeMeasurement, deliveredScopeInputs, invocationScope, captureSnapshot, scopeSize, componentSubtotal, projectOnlySize, revisionMismatch, directoryBytes, fileBytes, rootModuleOfSnapshot, inventoryPath, supportDocument, planSupportPath. |
| lines.ts | Pure lineEvents rules versus takeLineSnapshot acquisition; ownerOf must retain a selected general ownership-query contract for non-KPI users. |
| efficiency.ts | Recorded charge estimation and invocation timing rules. |
| exploration.ts | Search counts, identities, elapsed time, details/metrics; declaredRoots coordination inputs. |
| guarding.ts | Guarding report/count rules. |
| lineage.ts | lineage/2 metric rules and companions. |
| metrics.ts | kpi/1 formulas, scope-size/2 policy, comparable scope metrics and companions. |
| sessions.ts | Session metrics and companions. |
| trial-report.ts | Execution/qualification destination protection, not KPI ownership; preserve outside-project/symlink protection. |

Current production import inventory (no consumer migrated in this iteration):

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

The parent currently still knows every old algorithm. Only after execution,
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
