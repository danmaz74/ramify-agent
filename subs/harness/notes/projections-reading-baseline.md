# Reading extraction: preparatory baseline and consumer need

## Identity and evidence limits

The assignment supplies accepted boundary `be865851bd18f13c9f06e41263dbaabd834af993`. This is historical harness evidence, not an independently verified clean current checkout. Git was not invoked. Current files were inspected before test edits; source/commit equality and current cleanliness remain unverified under the active tools. Do not label this a clean committed execution baseline without workflow confirmation.

The supplied failed materialization reported maxRetainedFactBytes=100663296, observed=101089001, exit 2, blocked acquisition through decision, and no complete refresh. Its last completed historical revision was `rev/1:c87c7a1b-a4bc-4dca-85f2-ac349f6a5ee1:1`, input `input/1:c8cea36f5810565a29ccdf0bb7e4ac654f8f237a6e0ce8d3f30067662f9bcbfa`. None of those pages were combined with refreshed pages below.

The installed pinned CLI was retried, without pin/configuration/exclusion changes:

`node_modules/.bin/ramify materialize --view architect --view api --from subs/harness --root /workspaces/worktrees/projections-extraction-target-20261013`

Exit 0, 46.9s, 3 targets, 5678 entries, 2740361 bytes written. New analysis identity: `rev/1:6e013028-127f-4af7-9ce7-14714d945066:1`, input `input/1:862bcd8d0265f4af1e074a745701ea7f262e1fe1a443c1921205d910974ddae0`. Architect metadata: coverage=5, cut=1474, detailsUnavailable=15, dynamicTitles=35; ordinary API coverage=1/truncated=2; testing API coverage=17/truncated=2. These producer counts are retained literally, not interpreted as complete coverage. Successful materialization resolves the observed resource failure for this retry only. Missing entries do not prove absence. This revision precedes the characterization test edits; it is not a candidate architecture comparison.

## Bounded inventory at that revision

`harness/module.json` identifies harness with no tags and nine direct children: agent, audit, check-findings, evidence, ledger, nonfunctional, plan-evidence, reviews, scenarios (Pi nested under agent). Exact-owner files=614 versus subtree=766; production sourceFiles=236 versus 289; testing sourceFiles=378 versus 477. These are producer inventories, not a whole-project line baseline or proof of cognitive improvement. Owned nested projects are `subs/harness/fixtures/capability-coordination`, `subs/harness/fixtures/capability-coordination-nested`, and `subs/harness/fixtures/collection-review`; their contents were not inventoried/interpreted.

Direct filesystem inventory of the existing production projections directory: 23 TypeScript files, 6091 lines. Files: analysis, capability-tasks, check-findings, consultations, events, execution-map, execution-modules, execution-pages, inputs, lineage, merge-readiness, metrics, module-capabilities, progress, queries, repairs, scenarios, session-queries, sessions, snapshot, standalone-records, tree, work. Source inspection is supplemental bounded evidence, not generated importability evidence.

Static production import lookup over harness ordinary source found three importing files:

- `http/app.ts`: ProjectionError, ExecutionPageError, currentModuleTree, RunQueries, SessionQueries. The HTTP adapter instantiates both readers from RunService but separates command routes and translates their errors through public schemas.
- `consultations/command.ts`: readConsultations and consultationText. The CLI owns option conflicts, format refusal, newline JSON, text/detail selection and exit 0/2.
- `run/repair-export-command.ts`: runView and automaticRepairsOf. This is not merely a response consumer: it authenticates history before recoverCommits, retained payload authentication, external tracker calls and export revision commits. A future response-projector dependency must not remain the effects-admission boundary.

Lookup of root and web ordinary TypeScript found no direct projections path imports. This is bounded static lookup, not proof about arbitrary computed imports. No other production caller was observed in that lookup.

## Ownership and available reading contracts

The current parent declaration exposes public protocol files (evidence, ids, queries, errors, jobs, paths, execution-map, capability-tasks, runs, check-findings, transcripts, sessions) to its parent with browser tags. The root explicitly re-exposes selected protocol symbols to descendants. Server/CLI entry points are separate; projection implementation is not publicly exposed there. Preserve these declarations and names, including repair types relayed through runs, rather than broad-exposing Node projectors to browser clients.

RunSource currently belongs to queries.ts and supplies projectRoot, agentName, committed/committedRuns/runVersions and optional CandidateSource/ChangeHistory. CommittedRun/CommittedLine in inputs.ts contain record, directory, committed events/body refs and optional original run/sequence provenance. The ordinary received evidence pages describe CandidateSource as committed-object reading and ChangeHistory as injected delivered-change attribution reading. The new reader should own its input port; it must not receive writable service, ledger, command or agent interfaces. Signature companions need explicit exposure, including response/error contracts and consultation inspection types that currently use inference/private shapes.

TranscriptPages, persistence, content bodies and paging remain harness-owned; session reader composes them. KPI capture/calculation/attribution remain harness-owned; metrics presentation composes selected reading contracts. Durable record schemas/reducers remain harness-owned, including actively written standalone formats. Historical reader compatibility decoding may move. Repair validation currently mixes authentication and presentation in projections/repairs.ts; extract one shared harness-owned authenticated-history implementation before replacing both callers, and translate its facts/errors in the child. Do not copy validation into two owners.

The intended provider location is `subs/harness/subs/projections`, identity `ramify-agent/harness/projections`, no ordinary tags. No child, declarations, consumer imports, production code or query bodies were changed in this iteration. Placement/exposure authorization remains future work.

## Characterization retained and strengthened

- consultation-inspection.test.ts now asserts actual CLI JSON success status/stderr, exact text/detail results, session-filtered JSON and unchanged durable files/dispatch count alongside existing nested exchange/provenance/usage assertions.
- session-queries.test.ts adds repeated real HTTP run-session/list/finished standalone equality checks over scripted real service/reopen composition. Existing ordering, cursor, body authorization, historical sessions and polling assertions remain.
- repair-export-command.test.ts adds five small committed-history counterexamples: record identity mismatch, revision gap, invalid transition, original evidence change, and export modifying non-export evidence. Each asserts reader unreadable refusal and command exit 2, no exporter calls, unchanged events and damaged materialized payload still damaged: authentication precedes recovery. Non-export revisions use a nonterminal fixture because the real RunLog correctly refuses incident appends after terminal failure. Existing valid terminal export, symlink identity, pending/conflicting exports, lock and recovery assertions remain. Invocation/session conflict and unverified continuation remain explicit provider verification needs, not claimed new test coverage.
- http.test.ts, execution-map-http.test.ts and projections-pure.test.ts exercise real HTTP/query behavior, version/errors/bounded map and no-write purity; none are extraction completion evidence.

Focused run initially failed three new cases at fixture creation: RunLog refuses repair-incident-recorded after job-failed. Fixed fixture setup to preserve that invariant (no production change). Subsequent named run of all six files passed: 6 files, 32 tests, exit 0, 10.3s. No whole suite or Cucumber run and no scenario binding.

`npm run type-check`: exit 0, 13.0s. `npm run check:self`: exit 0, 25.4s; producer says execution completed, check passed, coverage partial; 0 errors/warnings, 378 analysis limits, 13 owners, 878 sources, 73 resources, 17825 accesses. Individual write hooks timed out/not-checked and are not passes. Explicit check:self provides later bounded structural evidence, not full audit qualification. The gate owns committed audit and verdict.

## Remaining comparison and delegation

The future comparison must identify candidate revision separately and inventory exact versus subtree ownership, all production callers/exposures, protocol/browser surfaces, test discovery and native registrations. Parent should cease understanding record-to-response mapping, execution maps, query cache/compatibility internals; costs include read-only input contracts, transitive signature exposures and shared authentication facts. Counts alone cannot establish improvement. Independently qualified baseline cleanliness and complete evidence are still not claimed. Preserve active discovery/process guard and every old assertion; no scenario is complete until real consumer imports use the extracted implementation and the committed gate qualifies it.
