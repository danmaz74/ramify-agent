# Successor reading extraction: consumer-first baseline

## Identity and limits

This is current execution observation, not plan progress or acceptance. The assignment's boundary is `592a05b17b45d0dc2514011766d06a4d4ab78afa`. The assigning architect previously observed empty Git status and that HEAD; advisory consultation could not freshly reconfirm them because its active tools had no Git inspection. The engineer did not invoke Git. Fresh clean-baseline confirmation remains owed before implementation; no production or contract edits have begun. Preceding `1c023ce1621bf9b3b79a334c2881b31c3934c6ca` retains partial shared repair-history work and explicitly establishes no acceptance. Historical notes remain untouched.

Both supplied source-area API views belong to `rev/1:9ef105b0-e402-4b75-a4d7-c5f6f526f471:3`: ordinary has one source-analysis limit; testing has 17. They are separate views, not combined importability evidence. Ordinary has children only; testing has children and external. No projections provider entry was found in bounded RunQueries/SessionQueries/RunSource/readConsultations/tree/repair searches. Coverage limits mean this is not proof of absence. Physical direct children currently number nine, and no projections directory is among them. Generated inventories from older revisions in projections-reading-baseline.md are historical, not current counts.

## Current bounded filesystem inventory

The old production directory has 23 TypeScript files, 6,000 lines: analysis, capability-tasks, check-findings, consultations, events, execution-map, execution-modules, execution-pages, inputs, lineage, merge-readiness, metrics, module-capabilities, progress, queries, repairs, scenarios, session-queries, sessions, snapshot, standalone-records, tree, work.

Under harness/src excluding generated views and tmp, there are 238 ordinary and 378 testing TypeScript files (616 exact-owner source files). Its descendant subs/ tree has 152 TypeScript files under the same exclusions, yielding 768 subtree source files. These filesystem counts are not generated analysis inventories, do not count docs/resources/nested fixtures, and establish no cognitive improvement. Inventory commands precede this note edit. The direct children are agent (Pi nested beneath it), audit, check-findings, evidence, ledger, nonfunctional, plan-evidence, reviews, scenarios. Their agent/model, audit producer, evidence/Git/CLI, persistence, domain-query and evaluation responsibilities stay with those owners; this work does not extract them again. Three owned fixture projects remain excluded from engineering scope.

## Actual consumers and authority

Start points inspected first:

* http/app.ts imports ProjectionError, ExecutionPageError, currentModuleTree, RunQueries and SessionQueries from the old directory. createApp constructs both readers from runs. Public schema validation and error translation, commands, debug/restart/recovery adapter behavior remain harness-owned.
* consultations/command.ts imports readConsultations/consultationText. It owns mutually exclusive --id/--session, text/json format refusal, JSON indentation/newline, detail selection, stdout/stderr and exit 0/2.
* run/repair-export-command.ts now has **no projection import**. It directly calls validateCommittedHistory and authenticateRepairHistory before recoverCommits, retained payload admission and external export. Preserve this delivered authority, its project lock and terminal-state/export guarantees. The old three-caller authoring description is stale: the bounded ordinary static lookup now finds two importing production files.

RunService's committed, committedRuns and runVersions are structurally the reading source, not a reason to expose the service. RunSource's committed-input contract should live with the reader: projectRoot, agentName, committed runs/version census, optional injected CandidateSource/ChangeHistory. CommittedLine includes original run/sequence provenance. CommittedRun includes durable RunRecord, directory and complete entries. Every named signature companion needs explicit exposure, not inferred-type workarounds.

The ordinary evidence pages confirm CandidateSource and ChangeHistory as reading contracts with companions, and loadModuleTree supplies revision/input/modules. Reading dependencies discovered in the projectors include harness durable schemas/reducers/admission, accepted evidence, review/check-finding state, KPI calculations, TranscriptPages/readTranscript/readBody and existing child reading APIs. Expose selected reading symbols and their companions through the parent, not whole implementation files. Query bodies must move, not remain parent callbacks. ContentStore also offers writes: choose a genuinely reading-only dependency rather than automatically exposing its entire class. Historic standalone-records explicitly says no current writer remains; its compatibility decoding can move. Actively written formats stay harness-owned.

Shared repair authentication is already one harness-owned implementation in run/repair-history.ts, taking decoded RunEvent and committed bodies, returning latest records/lifecycle facts. projections/repairs.ts translates RepairHistoryError to ProjectionError and adds interrupted display/invocation enrichment without changing durable stage. Keep this split. run/committed-history.ts supplies durable-version admission to both reader and exporter.

## Exposure and browser comparison baseline

Parent declaration currently exposes protocol files to its parent tagged browser (evidence, ids, queries, errors, jobs, paths, execution-map, capability-tasks, runs, check-findings, transcripts, sessions). Root declaration explicitly relays protocol symbols to descendants. No projector is exposed through this wire surface. Preserve names/versions/tags and root relays; do not relay Node reader implementation to web. Existing descendant exposure includes repair authentication/facts/errors, decoded RunEvent/schema and repair schema companions; it does not expose RunLog or RunService. Other existing descendant contracts include command execution and production session persistence for their current consumers: a new reading child must not receive these writable interfaces just because broad parent descendants already receive some of them. Whole-subtree exposure review remains required after declaration design, independently in ordinary/testing views. No new declaration was written here.

## Tests and discovery

Current Node discovery is src/tests/**/*.test.ts plus subs/**/src/**/*.test.ts; child tests are already selected. Fixture/tmp/web exclusions and root process-guard setup must remain unchanged. No runner/configuration change is needed merely for this child. Registry intersection with old-projection importers is exactly:

* subs/harness/src/tests/nonfunctional-run.boundary.test.ts
* subs/harness/src/tests/project-boundary-audit.integration.test.ts

Keep these integration files with harness, preserving exact registrations. Root registry is outside this write scope; any required registration migration must be reported, not edited here.

Static lookup found 47 importing testing/helper files. Provider-focused candidates include run-projections, execution-map projection/pages/modules/causal/durable, progress/scenario/check-findings/capability-tasks projection and historical reader cases; assignment and helper exposure must be coordinated before moves. HTTP, consultation CLI, repair export, full-run, recovery and native integration stay with harness. Preserve every assertion, including retained strengthened CLI equality/status, repeated session reads, immutability, all eight invalid repair history counterexamples and source tripwires. projections-pure.test.ts contains an old-directory source tripwire which must follow the implementation, not be removed. Test-private projectors should not become ordinary public API solely to retain parent tests; migrate focused tests instead.

Current focused baseline execution: npm test naming consultation-inspection.test.ts, execution-map-http.test.ts, http.test.ts, projections-pure.test.ts, session-queries.test.ts and repair-export-command.test.ts, --maxWorkers=4, exit 0; six files, **38 executed passing tests**, 9.4 seconds tool elapsed. Real query/consumer code used with existing scripted external boundaries. This is baseline characterization, not extracted-provider acceptance. No Cucumber scenarios executed or bound here. No fake proves provider completion.

## Delegation and unfinished acceptance

Request committed-evidence-reading-provider from ramify-agent/harness/projections, preserving current inputs/outputs/errors and original examples. Proposed symbol names/signatures are provisional until the architect resolves explicit reading dependencies and signature companions. The child is not in this engineer's write scope; no provider is implemented in the parent or its intended directory.

Handback must include real provider source/test pointers, ordinary/testing exposure evidence at a coherent refreshed revision, discovery/assertion preservation and requesting HTTP/CLI consumer verification (not only provider-local checks). Then parent resumes wiring remaining imports, old directory removal, ordinary/testing/browser/subtree review and sc-001/sc-008 binding with nonzero focused Cucumber execution using the supplied selection. Fresh baseline verification, type-check/check:self, candidate comparison, remaining composed behaviors sc-002 through sc-007 and committed default-mode complete final qualification remain owed. Passing provider checks or this focused baseline do not complete those obligations. The gate owns committed audit and acceptance.
