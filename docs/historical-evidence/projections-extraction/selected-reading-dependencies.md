# Selected reading-dependency preparation (not extraction)

This preparation leaves all 23 `src/projections/*.ts` files and all query bodies
in place. Current measured total: 6,000 lines (`wc -l`, receipt below). No
`subs/projections` child exists or is created. HTTP/CLI composition, including
`http/query-source.ts`'s frozen seven-key dynamic reader, is unchanged.
Nothing here establishes extraction acceptance or cap-001 completion.

## Exact files changed by this preparation

All paths are project-relative:

- `subs/harness/module.ramify`
- `subs/harness/README.md`
- `subs/harness/notes/selected-reading-dependencies.md`
- `subs/harness/src/transcripts/store.ts`
- `subs/harness/src/transcripts/writer.ts`
- `subs/harness/src/tests/transcript-reader.test.ts`
- `subs/harness/src/run/committed-history.ts`
- `subs/harness/src/run/merge-readiness.ts`
- `subs/harness/src/run/snapshot.ts`
- `subs/harness/src/run/sessions.ts`
- `subs/harness/src/run/records.ts`
- `subs/harness/src/capability/state.ts`

Temporary foreign alias attempts in `src/kpi/delivered.ts` and
`src/check-findings/state.ts` were removed completely; those files have no net
preparation change. No other owner's source, generated view, feature, runner,
configuration, dependency, browser/public wire declaration or durable format was
changed. Existing writable descendant availability was not expanded or cleaned
up.

## Reading-only transcript facility

`ContentReader` names only `read(hash): Promise<string | null>`.
`openContentReader(directory)` returns a frozen one-own-property object whose
closure binds to an existing `ContentStore`. It opens/creates nothing during
construction and exposes neither the store, directory, `path`, `put`, nor the
store's cache. `ContentStore` remains unexposed. Reading retains the existing
hash-format check, ENOENT/null behavior, raw-content semantics and other errors;
no new digest verification or persistence policy is introduced.

`readBody` now accepts `ContentReader`, not `ContentStore`. Existing writer
callers still work structurally. Inline/blob/file branches, relative-path
refusal and file-error/null policy are unchanged. New real-filesystem tests
assert frozen/exact facade keys and prototype, detached-method binding,
missing-directory no-creation, invalid hash/error propagation, inline/blob/file
bodies, missing files/blobs, traversal refusal and repeated bytes/mtime
invariance. Transcript reads retain missing, malformed complete-line and torn
last-line evidence without rewriting. Existing writer/paging/run tests remain.

Named transcript exposure inventory (all to descendants):

- `transcripts/store.ts`: `ContentReader`, `openContentReader`.
- `transcripts/writer.ts`: `readBody`, `readTranscript`, `TranscriptRead`.
- `transcripts/pages.ts`: `TranscriptPages`, `PageBounds`, `TranscriptPageRead`.
- `interfaces/protocol/transcripts.ts`: `TranscriptBody`, `TranscriptEntry`,
  `transcriptBodySchema`, `transcriptEntrySchema` (named companions).

## Direct production dependency inventory

The complete literal symbol inventory, including every protocol import and its
projection caller, was captured by the read-only import scan in
`plans/projections-extraction/.harness/jobs/20261013T215727Z-a3e5c9/invocations/inv-0026/shell/002.log`.
The original import statements were also captured in `shell/001.log` under the
same invocation directory. Those are inspection receipts, not child API views.
The following index covers every one of the 23 production projection files;
paths here are relative to harness `src/` unless a child owner is stated.
Local `./` projection imports stay inside the future reader. Node built-ins and
`zod` are package dependencies, not cross-module project contracts.

| Projection | Parent-owned behavior/data dependencies (besides protocol imports) | Sibling-owned direct dependencies |
| --- | --- | --- |
| analysis.ts | `analysis/records.ts`: Hypothesis; `run/records.ts`: runLayout; `work/frontier.ts`: capabilityOf; `analysis/evidence.ts`: readAcceptedEvidence | plan-evidence/catalog: elementKinds |
| capability-tasks.ts | `capability/state.ts`: replayCapabilityState; `reviews/state.ts`: reviewStateOf | none |
| check-findings.ts | `check-findings/state.ts`: replayCheckFindingState; `reviews/records.ts`: reviewAttemptSchema, reviewRequestSchema, ReviewAttempt, ReviewRequest; `reviews/state.ts`: reviewCoverage, reviewStateOf; `run/log.ts`: terminalRunEvents, RunEvent; `deviations/records.ts`: planDeviationSchema, PlanDeviation; `deviations/readiness-decision.ts`: currentDeviationDecision; `run/nonfunctional-records.ts`: nonfunctionalDeviationSchema | check-findings/queries: selectCheckFindings; check-findings/interfaces: CheckFindingActor, CheckFindingDecision, CheckFindingEntry, CheckFindingReport, CheckFindingState, CheckFindingSummary |
| consultations.ts | `consultations/records.ts`: consultationId, consultationLayout, consultationStartSchema, consultationOutcomeSchema, ConsultationStart, ConsultationOutcome; `consultations/submissions.ts`: architectAnswerSchema; `run/log.ts`: runEventSchema; `run/records.ts`: invocationSchema, invocationOutcomeSchema, manualRunRecordSchema, runRecordSchema, runLayout, Invocation, InvocationOutcome; `transcripts/store.ts`: ContentStore (NOT exposed; future consumer must use openContentReader); `transcripts/writer.ts`: readBody, readTranscript | ledger/jsonl: readJsonLines |
| events.ts | `run/log.ts`: RunEvent, RunEventOf; `run/records.ts`: SessionPoint; `run/sessions.ts`: pointLabel | none |
| execution-map.ts | `checks/records.ts`: GateAttempt; `checks/scenario-results.ts`: scenarioResultsOf | scenarios/records: ScenarioRecord |
| execution-modules.ts | `run/records.ts`: invocationSchema, lineEventSummarySchema, runLayout, LineEventSummary | none |
| execution-pages.ts | protocol only | none |
| inputs.ts | `analysis/records.ts`: hypothesisSchema, Hypothesis; `jobs/records.ts`: jobSchemaVersion, jobsDirectory; `run/policy.ts`: runPolicyVersion; `run/log.ts`: RunEvent; `run/records.ts`: entryAssignmentsSchema, gateAttemptSchema, gateAuditOutcomeSchema, runLayout, runRecordSchema, EntryAssignments, RunRecord; `work/committed.ts`: committedRecords, CommittedRecords; `run/committed-history.ts`: validateCommittedHistory, CommittedHistoryError, unsupportedCommittedVersion; `work/records.ts`: workItemOutlineSchema, WorkItemOutline; `contracts/records.ts`: contractRecordSchema, ContractRecord; `work/iterations.ts`: iterationAssignmentSchema, IterationAssignment | none |
| lineage.ts | `kpi/lineage.ts`: LineageInputs, SegmentFacts, StartKind; `run/observations.ts`: Observation; `run/records.ts`: ForkRelation, ReplaceRelation | none |
| merge-readiness.ts | `analysis/evidence.ts`: AcceptedEvidence; `deviations/readiness-decision.ts`: currentDeviationDecision; `deviations/finding.ts`: deviationHash; `deviations/records.ts`: planDeviationSchema; `deviations/nonfunctional.ts`: nonfunctionalDeviationHash; `check-findings/state.ts`: replayCheckFindingState; `run/nonfunctional-phase.ts`: replayNonfunctionalPhase; `nonfunctional/submissions.ts`: assessedElements; `run/merge-readiness.ts`: projectMergeReadiness, FinalAuditFacts, ReadinessDeviation; `run/nonfunctional-records.ts`: nonfunctionalDeviationSchema, MergeReadiness; `run/records.ts`: invocationOutcomeSchema, runLayout; `checks/records.ts`: GateAttempt | nonfunctional/interfaces: assessmentSchema; nonfunctional/rounds: decideNonfunctionalRound |
| metrics.ts | `kpi/setup-attribution.ts`: verifySetupLineIdentities, RecordedSetupDelta, SetupAddedLineFact, SetupCandidatePartition, SetupDeletedLineFact, SetupLineMappingFacts; `work/scratch.ts`: scratchIgnoreRule; `checks/accepted.ts`: acceptedCommit; `kpi/capture.ts`: baselineScope, rootModuleOfSnapshot, scopeSize; `kpi/delivered.ts`: deliveredChange, DeliveredChange; `kpi/guarding.ts`: guardingReport; `kpi/lineage.ts`: lineageMetrics, lineagePolicyVersion, LineageInputs; `kpi/metrics.ts`: comparableScopeMetrics, kpiMetrics, kpiPolicyVersion, measurementPolicyVersion, InvocationFacts; `kpi/exploration.ts`: explorationDetails, SearchCount, SearchCounts; `kpi/efficiency.ts`: invocationTiming; `run/observations.ts`: observationSchema, Observation; `run/sessions.ts`: invocationSessions; `run/log.ts`: RunEvent; `run/records.ts`: lineEventSummarySchema, measurementSnapshotSchema, runLayout, Invocation, InvocationOutcome, LineEventSummary, MeasurementSnapshot | evidence/git: CandidateSource, ChangeHistory, LineCommit |
| module-capabilities.ts | `run/records.ts`: ModuleProposal | none |
| progress.ts | `work/records.ts`: WorkItem | none |
| queries.ts | `run/log.ts`: RunEvent; `run/records.ts`: runLayout; `run/snapshot.ts`: runSnapshot; `analysis/evidence.ts`: readAcceptedEvidence | evidence/git: CandidateSource, ChangeHistory |
| repairs.ts | `run/repair-history.ts`: authenticateRepairHistory, RepairHistoryError | none |
| scenarios.ts | `checks/records.ts`: GateAttempt; `checks/scenario-results.ts`: scenarioResultsOf; `run/feature-files.ts`: trackedScenarios, TrackedScenarios; `work/frontier.ts`: capabilityOf; `work/records.ts`: integrationScenarioOf; `work/obligations.ts`: obligationsOf | scenarios/records: ScenarioRecord |
| session-queries.ts | `run/records.ts`: runLayout; `transcripts/pages.ts`: TranscriptPages, PageBounds, TranscriptPageRead; `transcripts/writer.ts`: readTranscript | none |
| sessions.ts | `run/log.ts`: terminalRunEvents; `run/records.ts`: SessionId; `run/sessions.ts`: InvalidSessionTransitionError, reduceSessions, RunSession | none |
| snapshot.ts | `check-findings/state.ts`: replayCheckFindingState; `deviations/records.ts`: environmentProblemSchema; `run/snapshot.ts`: runSnapshot | none |
| standalone-records.ts | `run/records.ts`: invocationOutcomeSchema, invocationSchema, scopeSizeSchema; `work/engineer.ts`: capabilityEngineerSubmissionKinds, engineerSubmissionKinds, engineerSubmissionSchema; `work/iterations.ts`: writeScopeSchema (defined in work/scope.ts), testSelectionPolicySchema | none |
| tree.ts | protocol only | evidence/views: loadModuleTree |
| work.ts | `checks/records.ts`: GateAttempt; `work/failure.ts`: digestLines; `work/records.ts`: originKindOf, WorkItem; `work/iterations.ts`: IterationAssignment; `analysis/evidence.ts`: readAcceptedEvidence, AcceptedEvidence; `context-selection/delivery.ts`: deliverPackage; `deviations/records.ts`: packageDeviation, planDeviationSchema; `run/records.ts`: runLayout | plan-evidence/catalog: PackageDeviation |

Protocol imports come from the harness-owned `interfaces/protocol/` files
`evidence`, `ids`, `runs`, `queries`, `check-findings`, `capability-tasks`,
`execution-map`, `sessions`, `transcripts` and `repairs`. Their exact selected
names (plus recursive alias/schema companions) are spelled out individually in
`module.ramify`'s selected reading block; no new wildcard exposure was added.
The literal direct-import receipt distinguishes direct names from companions.
The existing browser-tagged parent wildcard exports are unchanged.

## Named exposure and companion inventory

`module.ramify` is the exact named inventory, organized by defining source file
for harness-owned symbols and by direct child for sibling relays. The inventory
includes data/schema companions recursively (e.g. committed records include
registry, work-item, iteration, placement, contract and capability records;
validated evidence includes Incorporation, ElementCatalog and DocumentManifest;
KPI requests include decoded invocation, scope, observation and lineage facts;
session reduction includes RunSession/RunSessions, SessionMoment, points,
relations, SessionTransitionFrom and failure reasons). No implementation file
was blanket-exposed. Inferred schema signatures still have producer limits,
so this is not a claim of complete compiler-derived companion verification.

Owned collision-free bindings preserve the same original declarations:

| Defining file | Selected descendant binding | Original retained binding |
| --- | --- | --- |
| capability/state.ts | ReplayedCapabilityState | CapabilityState |
| run/snapshot.ts | DurableRunSnapshot, DurableRunNotice | RunSnapshot, RunNotice |
| run/sessions.ts | RunSessionMoment | SessionMoment |
| run/records.ts | runSessionFinishReasonSchema | sessionFinishReasonSchema |

`HistoryEntry` in `run/committed-history.ts` and `DeviationOrigin` in
`run/merge-readiness.ts` now have source exports, with their owned readers and
companions explicitly exposed. Their definitions and query behavior are
unchanged. The supported checker resolved these owned aliases without the
previous collisions, but future child views must still demonstrate the actual
consumer import bindings and signature companions.

Sibling relay closure selected from the supplied ordinary API pages:

- evidence: existing CandidateSource/tree read relays retained; add LineCommit,
  ModuleEntry, loadModuleTree. ChangeHistory closure is blocked below.
- ledger: readJsonLines, JsonLines; LedgerEntry, Transaction, RecordBody.
  Neither Ledger, openLedger nor append/materialize/effect facilities added.
- nonfunctional: assessmentSchema, Assessment, candidateSchema, Candidate;
  decideNonfunctionalRound, RoundDecisionInput, RoundDecision, ClosedRound,
  Outcome, Phase, roundSchema. This is committed-fact calculation, not execution.
- plan-evidence: elementKinds, ElementCatalog/elementCatalogSchema,
  PackageCitation/packageCitationSchema, PackageDeviation/packageDeviationSchema,
  DocumentManifest/documentManifestSchema; existing deviationNotice retained.
- scenarios: ScenarioRecord/scenarioRecordSchema, ScenarioId/scenarioIdSchema,
  ScenarioStates, ScenarioState/scenarioStateSchema.
- check-findings: committed CheckFindingState/Entry/Report/Decision and their
  explicit named companions in the declaration; no writable ingestion/service
  entry. Summary/selection closure is blocked below.

Existing `authenticateRepairHistory`, `RepairHistoryError`,
`RepairHistoryEntry`, `ValidatedRepairIncident`, RunEvent/runEventSchema and
repair protocol companions are reused, not duplicated. Export authentication
still precedes `recoverCommits` in `run/repair-export-command.ts` (lines 48–49).
The command, repair validator and query are untouched by this preparation.

## Remaining foreign-owner gaps (verified conflicts, not API absence)

The necessary contracts exist in the supplied harness ordinary view. This
iteration cannot safely relay the full reading closure under their present
names, while retaining public exports and inherited contracts unchanged:

1. **ramify-agent/harness/evidence**, `subs/harness/subs/evidence/src/git.ts`:
   `ChangeHistory` and `ChangedFile` name the owner's `LineRange`. Relaying that
   name collides with the existing agent `LineRange` relay in harness. These are
   different originals, not contracts to substitute by structural resemblance.
   Deferred: ChangeHistory, ChangedFile, LineRange and the parent
   `kpi/delivered.ts` deliveredChange exposure. Existing production metrics and
   queries are unchanged; their future child ports and metric reading require
   this history contract.
2. **ramify-agent/harness/check-findings**,
   `subs/harness/subs/check-findings/src/interfaces/check-findings.ts`:
   `CheckFindingSummary.materialChoice` names CheckFindingMaterialChoice,
   colliding with the distinct unchanged public wire type in
   `harness/src/interfaces/protocol/check-findings.ts`. Deferred:
   CheckFindingSummary, CheckFindingDetailView, CheckFindingListView,
   CheckFindingSelection, and `src/queries.ts` selectCheckFindings. Its signature
   also requires CheckFindingQueryInput and checkFindingQuerySchema; the API
   page's rendered function signature was truncated, and the checker identified
   this additional companion. These contracts are needed by the future child's
   check-findings projection, not replaced by the public wire definitions.

Attempting parent source re-export aliases for these foreign types was rejected
as `foreign-original`: an `expose-src` declaration may not select their foreign
originals. Both attempts were removed, as were the blocked new descendant
relay chains, leaving no standing Ramify violations. No foreign-owner edits
were attempted. Provider coordination is still required to complete the
selected reading surface before child integration. The approved preparation is
therefore retained as partial, not declared ready for extraction.

## Checks and coverage limits

Supported focused command from project root:

`npm test -- --maxWorkers=4 subs/harness/src/tests/http-query-source.test.ts subs/harness/src/tests/http.test.ts subs/harness/src/tests/session-queries.test.ts subs/harness/src/tests/consultation-inspection.test.ts subs/harness/src/tests/transcript-reader.test.ts subs/harness/src/tests/transcript-writer.test.ts subs/harness/src/tests/transcript-pages.test.ts subs/harness/src/tests/transcript-run.test.ts`

Final focused result: **8 files, 48 cases passed**, exit 0. File counts:
http-query-source 1, http 9, session-queries 2, consultation-inspection 6,
transcript-reader 3, transcript-writer 21, transcript-pages 4, transcript-run 2.
The new reader cases are the exact facade surface, body-policy compatibility,
and non-mutating missing/malformed/torn transcript reads. No case or existing
expectation was weakened. Initial focused run also passed 48 cases.

`npm run type-check`: exit 0, both before and after alias repairs. It executes
root, web, scripts and browser-acceptance TypeScript configurations. No compiler
diagnostics; this does not establish a nonexistent child's imports.

`npm run check:self`: initial exit 1 / invalid-project / coverage not-run,
with seven name collisions (the five owned original names above, counting
RunSnapshot and RunNotice separately, plus two foreign names). Subsequent
foreign alias attempts and incomplete-relay errors were diagnosed by mutation
hooks and removed. Final command: exit 0, execution completed, check passed,
**coverage partial**: 13 owners, 883 source files, 75 resources, 17,875 accesses;
0 errors, 0 warnings, 444 analysis limits; 13,292 allowed, 0 denied, 4,577 external.
Limits: 428 signature-inferred, 6 nonliteral-target, 5 namespace-escape,
5 shared-global. Harness ordinary/testing source contributed 326
signature-inferred and 3 namespace-escape diagnostics. Exposed schemas and
inferred constants, including runLayout, have unverified inferred companion
coverage; a passing check must not be described as complete analysis.

Receipts under
`plans/projections-extraction/.harness/jobs/20261013T215727Z-a3e5c9/invocations/inv-0026/shell/`:
`017.log` initial focused tests; `018.log` initial type-check; `019.log` failed
initial check; `023.log` final focused tests; `024.log` final type-check;
`025.log` complete final check (105,561 bytes, not just its tail); `026.log`
measured 23-file baseline and repair effect-order inspection; `027.log` limit
breakdown. These are ordinary local checks, not committed gate audit receipts.
No full Vitest/Cucumber suite, web build or final audit was run manually.

Ordinary/testing API refresh was requested by advisory consultation. No
supported refresh tool or producer command is available in this assignment;
the architect confirmed this limitation. Generated views were never edited.
Only supplied **pre-edit** API evidence is available:
`rev/1:46f94cbc-4873-41d7-9437-3133f3734acd:19`, with one ordinary and 17 testing
source-analysis limits. Their absence cannot prove an API unavailable. The
check:self output does not assert received-view refresh or a new API producer
revision. No child exists, so neither ordinary nor testing child importability
is established. Subsequent harness preparation must supply one coherent
refreshed producer revision, retain its limits, and verify actual child imports.
