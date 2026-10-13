# Query composition preparation — local baseline and focused evidence

## Identity and evidence limits

Observed 2026-10-13, first inventory at 22:21:31 UTC, before edits. Provenance is reconciled using the architect's supplied read-only `inspect_git` evidence, not engineer Git inspection:

- Selected implementation baseline: `bfa26ee27b7ee396c4780887d4e26061433051e0`.
- Materialized-scenario / supplied accepted boundary and architect-observed current HEAD: `92a515c69765589932b94c22418f86e2ea756142`, whose parent is the selected implementation baseline. The architect inspected the parent-to-HEAD diff and reports that it adds only the harness-generated pending acceptance feature.
- Initial architect pre-implementation status returned no entries. Current architect status reports exactly five retained changed paths: `subs/harness/README.md`, `subs/harness/query-composition-baseline.md`, `subs/harness/src/http/app.ts`, `subs/harness/src/http/query-source.ts` and `subs/harness/src/tests/http-query-source.test.ts`. This is retained dirty preparation, not a clean current tree.
- A future gate candidate will capture the retained preparation and this reconciliation under the harness's commit workflow. Its identity and qualification are not established here; a candidate commit alone is not acceptance.

The prior iteration remains partial historical evidence: at that time engineer Git commands were prohibited, no read-only Git tool was supplied, and the architect consultation could not then supply verified current HEAD. That was the reason for the partial return, not a continuing provenance obstruction after the supplied architect reconciliation. No engineer Git command was run.

Historical received API delivery revision: `rev/1:46f94cbc-4873-41d7-9437-3133f3734acd:4`; current preparation verification delivery: `rev/1:46f94cbc-4873-41d7-9437-3133f3734acd:15`. Each has ordinary 1 / testing 17 source-analysis limits as supplied for its respective assignment. Absence is not evidence of unavailability. Historical inventory/import observations, current source inspection and subsequent check output remain separate evidence, not a combined complete architect-view revision. No child views or child companion closure are claimed.

## Measured production inventory

Method: Python pathlib recursive `.ts`/`.tsx` files in source areas, excluding tests, generated `.ramify`, node_modules and fixtures; line counts are `read_bytes().splitlines()` including comments/blanks. Exact-owner means harness `src/` only; subtree includes existing descendants' source. Declared owned nested projects (`fixtures/capability-coordination`, `fixtures/capability-coordination-nested`, `fixtures/collection-review`) are excluded, not analyzed. Existing child trees: ledger, check-findings, audit, reviews, plan-evidence, scenarios, evidence, agent (including Pi), nonfunctional.

| Scope | Before preparation files | Lines |
| --- | ---: | ---: |
| Harness exact-owner production | 238 | 67,275 |
| Harness subtree production | 291 | 79,686 |
| Old projections directory | 23 | 6,000 |

The initial exact-owner script incorrectly required a nested `src` path component and returned zero; corrected calculation used harness/src as the source root. Corrected owner/subtree counts were measured after composition edits and subtract exactly the added 15-line helper and net 2 app lines; projection count was directly measured before editing and remains unchanged. These are local filesystem measurements and a back-calculated preparation baseline, not independently enumerated Git blobs, tracked-file inventories or complete architect-view coverage. Supplied architect provenance identifies the historical boundaries but does not convert these counts into an independently measured commit inventory.

Old projection file line counts: analysis 252; capability-tasks 104; check-findings 615; consultations 220; events 461; execution-map 483; execution-modules 157; execution-pages 154; inputs 279; lineage 111; merge-readiness 187; metrics 651; module-capabilities 252; progress 240; queries 288; repairs 27; scenarios 165; session-queries 386; sessions 230; snapshot 225; standalone-records 144; tree 31; work 338 (all `.ts`).

Preparation adds one 15-line production helper and 2 net app lines: exact-owner candidate 239 files / 67,292 lines; subtree 292 / 79,703. Ownership and query bodies do not move. Counts establish neither reduced cognitive complexity nor extraction completion.

## Consumers, entry points and reading categories

Bounded production import search under harness/src (excluding tests/views) found two consumer files, not the authoring estimate of three:

- `http/app.ts`: RunQueries, SessionQueries, currentModuleTree, ProjectionError, ExecutionPageError. createApp now constructs one frozen RunSource via `http/query-source.ts` and injects it into both real query classes. No query bodies are callbacks in the helper. Getters preserve dynamic values; closures call the original receiver. Only projectRoot, agentName, committed, committedRuns, runVersions, candidateSource and changeHistory are present. No RunService commands, ledger, writers or executor are passed. Existing HTTP error mapping, command dispatch, recoveryInspection and restartInspection still call the service where appropriate and are unchanged.
- `consultations/command.ts`: readConsultations and consultationText; unchanged.
- `run/repair-export-command.ts` no longer imports a projection: it directly consumes `authenticateRepairHistory` from harness-owned run/repair-history.ts. `projections/repairs.ts` consumes that same validator and translates RepairHistoryError to ProjectionError. Preserve this delivered admission policy, rather than recreating a projector-dependent command.

Likely reading dependencies for later extraction, from local projection imports: public protocol schemas/types; committed run/history decoders and durable schemas; analysis/work/contracts/frontier facts; scenario and CheckFinding selection/replay; review/capability/deviation/readiness state; KPI/lineage/audit/scenario evidence presentation; module-tree/view loading; selected Git candidate/change-history ports; transcript/body/page reading; historical standalone-session decoding; consultation records/submissions and ledger JSON-lines reading; harness-owned repair authentication. Node filesystem/path/crypto and zod remain implementation dependencies. This is categorization, not proof of sufficient future child exposures.

No new production exposure is added. Architect follow-up must select consultation and repair reader entry points, verify all child signature companions and selected reading ports through newly generated ordinary/testing views, and check visibility across the full descendant subtree. Existing descendant command/store exposures remain unchanged; this helper does not pass them to readers. No writable RunService exposure is needed for this preparation.

## Public wire exposure baseline

Harness declaration has 12 browser-tagged wildcard exports to parent from interfaces/protocol/{evidence,ids,queries,errors,jobs,paths,execution-map,capability-tasks,runs,check-findings,transcripts,sessions}. Root declaration explicitly re-exposes named harness contracts to descendants. Measured named re-export counts by those protocol comment groups: evidence 15, ids 4, queries 15, errors 5, jobs 17, paths 3, execution-map 32, capability-tasks 6, runs 170, check-findings 68, transcripts 28, sessions 48. Names remain in root module.ramify; wildcard closure remains defined by the protocol files and supplied views, not inferred from counts. Neither declaration nor protocol files were edited. Browser safety/tag continuity is retained, not newly certified with complete coverage. Server and lock-error parent entry points and consultation/repair-export CLI parent entry points remain unchanged and are not new browser exports.

## Focused compatibility evidence (not a gate/scenario verdict)

From project root, exact command:

```sh
npm test -- --maxWorkers=4 subs/harness/src/tests/http-query-source.test.ts subs/harness/src/tests/http.test.ts subs/harness/src/tests/session-queries.test.ts subs/harness/src/tests/projections-pure.test.ts subs/harness/src/tests/run-projections.test.ts subs/harness/src/tests/recovery-http.test.ts subs/harness/src/tests/repair-export-command.test.ts
npm run type-check
npm run check:self
```

Initial focused run: 40 passed, 1 failed in the new test because it used temporaryDirectory.root instead of .path. Corrected the test fixture API usage (no expectation weakened). Re-run at 22:23:34 UTC: all 7 files / 41 tests passed, exit 0. Individual counts: composition 1, HTTP 9, sessions 2, pure projections 3, run projections 7, recovery HTTP 3, repair export command 16. The new helper test uses FakeReadingService, real RunQueries/SessionQueries and local scripted candidate/history dependencies; it checks exact keys, freeze/non-writable descriptors, receiver binding, selected-port identity, live agent getter, response equivalence and projection refusals. Existing HTTP suites exercise actual createApp, supported retained sessions, cursors, errors and recovery; the pure query suite compares project files/logs before and after. This is focused compatibility coverage, not every public query combination.

Type-check passed (all four configured tsc commands). check:self completed and passed with partial coverage: 13 owners, 882 source files, 0 errors, 0 warnings, 379 analysis limits; 13,286 allowed, 0 denied, 4,568 external accesses. These check limits are separate from supplied API view coverage. Full output is retained by the harness shell receipts (003 initial failure, 004 passing combined run; 001/002 inventory and import measurements; 005 wire declarations).

Current preparation verification reran the exact command block above, starting at 22:29:12 on 2026-10-13: 7 files / 41 tests passed; type-check passed all four configured tsc commands; check:self completed and passed with partial coverage, 13 owners, 882 source files, 0 errors, 0 warnings and 379 analysis limits (13,286 allowed, 0 denied, 4,568 external accesses). Combined command exit 0. Complete current receipt: `plans/projections-extraction/.harness/jobs/20261013T215727Z-a3e5c9/invocations/inv-0016/shell/001.log`. Inspection confirmed the retained helper, real-query test and createApp wiring; no source/test correction was needed, and README navigation remains retained.

No whole-suite Vitest, Cucumber or final audit was run manually. No feature/binding was changed, child created, test moved, dependency/configuration changed or extraction scenario declared complete. Committed audit qualification belongs to the gate, and responsible architect scenario judgments remain separate. Provenance reconciliation and focused check health support submission of this preparation for gate capture only; future extraction, provider/exposure selection, signature-companion closure and all scenario bindings remain outside this repair.
