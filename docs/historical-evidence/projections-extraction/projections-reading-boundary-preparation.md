# Reading boundary preparation — blocked, source preserved

## Identity and disposition

Execution observation only; no delegated outcome, consumer case, extraction, or plan progress is completed. Selected baseline: `592a05b17b45d0dc2514011766d06a4d4ab78afa`, as confirmed in the assignment. The environment separately names candidate `44218a0eb1043ed9e5c1046af98956add1f611c0`; do not conflate these identities. No Git command was run by this engineer. The requester note `projections-extraction-successor-baseline.md` remains unchanged, including its historical limitations. Current observations below supersede neither historical receipts nor acceptance.

Only this note was authored. Production bodies, consumers, tests, declarations, wire exports, browser tags, root relays and discovery/registry configuration remain unchanged. Intended scaffold paths are `subs/harness/subs/projections/module.ramify`, `README.md`, `src/`, and `src/tests/`. None was created: introducing an untagged child now would immediately grant it prohibited command execution and writable session authority. A minimal declaration would be `ramify 1` / `module projections`, but it is not a safe reading boundary under the current relays.

## Supported declaration conflict

Installed provider is pinned `ramify.ts` 0.5.1. Its README describes parent/subtree sharing. Verified implementation: `node_modules/ramify.ts/dist/subs/analysis/subs/descriptions/src/parse.js`, `LineParser.destinations()`, accepts only bare `parent` or `descendants`; anything else raises `invalid-destination` with “Expected the bare destination parent or descendants.” `expose-sub` cannot assign tags. No supported named-child destination or descendant exclusion is established. No speculative declaration was tried.

The before/after declaration comparison is **identical**, not a narrowed candidate. Exact conflicting harness lines:

```
expose-sub commitAccepted, createRunBranch, isCleanRepository from evidence to descendants
expose-sub runCommand, childEnvironment, outputTailBytes, CommandRequest, CommandRun, CommandOutcome, CommandOutput, CommandRunner from evidence to descendants
expose-src openSessionStore, LedgerSessionStoreOptions, LedgerSessionStore from "run/session-store.ts" to descendants
expose-sub SessionStore, SessionStoreRecord, SessionStoreCommit, SessionStoreExpected, TranscriptPayloadId from agent to descendants
```

`runCommand` and `CommandRunner` are active ordinary audit dependencies, not merely test conveniences. Audit `src/focused-check.ts:4-5` imports runCommand, childEnvironment, CommandRun, CommandRunner, and defaults to runCommand at line 25. Audit `src/test-lock.ts:3-4` imports outputTailBytes, CommandRun, CommandRunner; `src/check-execution.ts:26` imports childEnvironment. Testing consumers include audit `src/tests/audit-conformance.test.ts` (commitAccepted/createRunBranch/isCleanRepository), `test-lock.test.ts` and `test-lock.boundary.test.ts` (CommandRunner), and `workspace-preparation.boundary.test.ts` (childEnvironment). Removing the relay breaks legitimate consumers. Evidence's own source/tests use their local writer/executor and do not depend on this harness relay.

Pi `src/tests/plan23-transport.boundary.test.ts:12` imports harness openSessionStore. Pi ordinary `src/pi-agent.ts:2` and `src/session-operations.ts:11` import agent-owned SessionStore; testing `plan23-event-observations.test.ts`, `plan23-prefix-preservation.test.ts`, and `helpers/session.ts` import its companions. The agent branch already owns those contracts; narrowing a harness relay may not affect that branch's own route, but it cannot be replaced by selective-child grammar. Testing-only exposure may address openSessionStore after coordinated route verification; it does not solve audit's ordinary command requirement. These are observed consumers, not an exhaustive proof under partial analysis.

Advisory architect consultation confirmed this conflict and recommended partial, not an unsafe scaffold. It authorized no new scope, tags, module, consumer changes, or acceptance edits. A responsible architect must arrange supported access/composition with the existing owners or reconcile the frozen requirement with the provider's semantics. Intended non-use by projections is not absence from its received API. A structure pass cannot establish the stronger reading-only constraint.

## Current API evidence and structure

Incoming ordinary/testing views separately supplied revision `rev/1:9ef105b0-e402-4b75-a4d7-c5f6f526f471:6`, with respectively 1 and 17 source-analysis limits. Ordinary view has children only; testing has children and external. Bounded received-interface searches and pages were used for CandidateSource, ChangeHistory, loadModuleTree and readJsonLines.

Separate current refresh requests:

* `ramify materialize --from . --root <projectRoot>` from harness/src: exit 0, revision 1, two targets, 1089 entries, 358071 bytes written.
* `ramify materialize --from tests --root <projectRoot>`: exit 0, revision 1, two targets, 1089 entries, two unchanged targets.

The provider refreshes the module's ordinary/testing areas together even when invoked separately. Both current `_meta.json` files identify coherent revision `rev/1:1bf3c1ac-ed45-428e-a8a8-088d43a65adb:1`; ordinary area coverage 1, truncated 2; tests area coverage 17, truncated 2. Coverage and truncation are retained limitations, not proof of unavailable APIs. No child exists to refresh/check independently. No generated file was hand-edited.

`npm run check:self` invokes the installed provider's fresh batch structure check: exit 0, execution completed, check passed, **coverage partial**, all listed stages completed. 13 owners, 880 source files, 74 resources, 17847 accesses; 0 errors, 0 warnings, 379 analysis limits; 13275 allowed, 0 denied, 4566 external. This is the unchanged project's structure evidence, not evidence that a hypothetical child is reading-only. No unsupported scoped check was substituted.

## Import census and authority classification

All 23 production files were inventoried using anchored multiline import-statement extraction (`^import\\b[\\s\\S]*?;`, with whitespace normalized), not a one-line grep that misses multiline members. The exact complete import statements, their module specifiers, aliases/type modifiers, and per-file headings are retained in the harness-owned execution receipt `plans/projections-extraction/.harness/jobs/20261013T211437Z-569b39/invocations/inv-0017/shell/007.log` (inventory before materialization). This note indexes that receipt, not captured plan content. A prior AST census attempt failed because TypeScript 7's installation lacks `lib/typescript.js`; it contributed no evidence. No imports were changed.

Current census: 23 files, exactly 6000 lines (newline count). By file, lines and reading responsibility:

| File in harness/src/projections | Lines | External-to-future-child dependencies (protocol and intra-projector imports remain fully listed in receipt) |
| --- | ---: | --- |
| analysis.ts | 252 | Hypothesis; runLayout; capabilityOf; readAcceptedEvidence; plan-evidence elementKinds |
| capability-tasks.ts | 104 | replayCapabilityState; reviewStateOf |
| check-findings.ts | 615 | selectCheckFindings and CheckFindingActor/Decision/Entry/Report/State/Summary; replayCheckFindingState; reviewAttemptSchema/reviewRequestSchema, ReviewAttempt/ReviewRequest; reviewCoverage/reviewStateOf; terminalRunEvents/RunEvent; planDeviationSchema/PlanDeviation; currentDeviationDecision; nonfunctionalDeviationSchema |
| consultations.ts | 220 | createHash; readFile; join/resolve/relative/isAbsolute; z; ledger readJsonLines; consultationId/Layout/StartSchema/OutcomeSchema, ConsultationStart/Outcome; architectAnswerSchema; runEventSchema; invocationSchema/invocationOutcomeSchema/manualRunRecordSchema/runRecordSchema/runLayout, Invocation/InvocationOutcome; ContentStore; readBody/readTranscript |
| events.ts | 461 | RunEvent/RunEventOf; SessionPoint; pointLabel |
| execution-map.ts | 483 | scenarios ScenarioRecord; GateAttempt; scenarioResultsOf |
| execution-modules.ts | 157 | invocationSchema/lineEventSummarySchema/runLayout, LineEventSummary |
| execution-pages.ts | 154 | createHash (plus wire validation/bounds) |
| inputs.ts | 279 | readdir/readFile; join/relative; z; hypothesisSchema/Hypothesis; jobSchemaVersion/jobsDirectory; runPolicyVersion; RunEvent; entryAssignmentsSchema/gateAttemptSchema/gateAuditOutcomeSchema/runLayout/runRecordSchema, EntryAssignments/RunRecord; committedRecords/CommittedRecords; validateCommittedHistory/CommittedHistoryError/unsupportedCommittedVersion; workItemOutlineSchema/WorkItemOutline; contractRecordSchema/ContractRecord; iterationAssignmentSchema/IterationAssignment |
| lineage.ts | 111 | LineageInputs/SegmentFacts/StartKind; Observation; ForkRelation/ReplaceRelation |
| merge-readiness.ts | 187 | AcceptedEvidence; nonfunctional assessmentSchema/decideNonfunctionalRound; currentDeviationDecision/deviationHash/planDeviationSchema/nonfunctionalDeviationHash; replayCheckFindingState/replayNonfunctionalPhase; assessedElements; projectMergeReadiness/FinalAuditFacts/ReadinessDeviation; nonfunctionalDeviationSchema/MergeReadiness; invocationOutcomeSchema/runLayout; GateAttempt |
| metrics.ts | 651 | createHash/readFile; verifySetupLineIdentities with RecordedSetupDelta/SetupAddedLineFact/SetupCandidatePartition/SetupDeletedLineFact/SetupLineMappingFacts; scratchIgnoreRule; CandidateSource/ChangeHistory/LineCommit; acceptedCommit; baselineScope/rootModuleOfSnapshot/scopeSize; deliveredChange/DeliveredChange; guardingReport; lineageMetrics/lineagePolicyVersion/LineageInputs; comparableScopeMetrics/kpiMetrics/kpiPolicyVersion/measurementPolicyVersion/InvocationFacts; explorationDetails/SearchCount/SearchCounts; invocationTiming; observationSchema/Observation; invocationSessions; RunEvent; lineEventSummarySchema/measurementSnapshotSchema/runLayout, Invocation/InvocationOutcome/LineEventSummary/MeasurementSnapshot |
| module-capabilities.ts | 252 | ModuleProposal (and wire evidence isWithin/ModuleTree/ViewIdentity) |
| progress.ts | 240 | WorkItem |
| queries.ts | 288 | CandidateSource/ChangeHistory; RunEvent; runLayout/runSnapshot; readAcceptedEvidence |
| repairs.ts | 27 | authenticateRepairHistory/RepairHistoryError |
| scenarios.ts | 165 | ScenarioRecord; GateAttempt; scenarioResultsOf; trackedScenarios/TrackedScenarios; capabilityOf; integrationScenarioOf; obligationsOf |
| session-queries.ts | 386 | open/readdir/readFile/stat; join/relative; z type; runLayout; TranscriptPages/PageBounds/TranscriptPageRead; readTranscript |
| sessions.ts | 230 | join; terminalRunEvents; SessionId; InvalidSessionTransitionError/reduceSessions/RunSession |
| snapshot.ts | 225 | replayCheckFindingState; environmentProblemSchema; runSnapshot |
| standalone-records.ts | 144 | join/z; invocationOutcomeSchema/invocationSchema/scopeSizeSchema; capabilityEngineerSubmissionKinds/engineerSubmissionKinds/engineerSubmissionSchema; writeScopeSchema/testSelectionPolicySchema |
| tree.ts | 31 | evidence loadModuleTree |
| work.ts | 338 | GateAttempt; digestLines; originKindOf/WorkItem; IterationAssignment; readAcceptedEvidence/AcceptedEvidence; deliverPackage; packageDeviation/planDeviationSchema; PackageDeviation; runLayout |

Every `../interfaces/protocol/` import is a harness-owned wire contract; preserve exact symbols in the receipt and their schema versions/browser promises, not a Node implementation relay to web. Every `./` import is internal reading implementation proposed to move with the child, not a reason to blanket-expose projectors. Node built-ins and zod have no Ramify exposure requirement. The `../../subs/` imports are existing owner behavior to relay selectively, not copy.

Active durable/schema authority stays harness-owned: run/log, records, policy, sessions reducer, committed-history, work/committed and work/records/iterations, contracts/records, analysis/records/evidence, consultation records/submissions, review/deviation/check-finding/capability/nonfunctional state. Reader-only standalone compatibility decoding can move later; no current writer lives in that old reader file. Transcript indexing/persistence remain transcripts-owned in harness; KPI acquisition/calculation remains kpi-owned in harness. Shared repair authentication and committed-history admission remain single harness implementations, also used directly by repair export before effects.

## Exact known signature companions and unresolved selection

These are existing reading candidates, **not newly exposed interfaces**:

* RunSource belongs with the future consumer: projectRoot, agentName, committed, committedRuns, runVersions, optional CandidateSource/ChangeHistory. CommittedRun includes RunRecord, directory and readonly CommittedLine[]; CommittedLine includes RunEvent, source runId/sequence, timestamp and committed record bodies. Never substitute RunService or RunLog.
* authenticateRepairHistory takes readonly RepairHistoryEntry[] and returns readonly ValidatedRepairIncident[]; RepairHistoryEntry/ValidatedRepairIncident/RepairHistoryError and decoded RunEvent plus repair record/stage/ID/candidate/result/export companions are already exposed by harness to descendants. Preserve exactly that authority.
* validateCommittedHistory, CommittedHistoryError, unsupportedCommittedVersion are reading candidates; its signature names currently private `HistoryEntry`. An explicit owner companion decision/export is still needed; do not derive it from function types or duplicate it.
* TranscriptPages.page(path: string, after: number, bounds: PageBounds): Promise<TranscriptPageRead>; PageBounds, TranscriptPageRead and TranscriptEntry with its recursively named wire companions must accompany it. readTranscript returns TranscriptRead. readBody(root: string, store: ContentStore, body: TranscriptBody): Promise<string | null> currently names a writable class. ContentStore exposes put as well as path/read, so exposing readBody unchanged requires forbidden ContentStore access. Select an owner-defined reading-only body contract before extraction; do not expose ContentStore or TranscriptWriter.
* readJsonLines(path: string): Promise<JsonLines>; JsonLines is readonly records/discardedPartial/completeBytes. Preserve read-only JsonLines contract, not appendJsonLine/discardPartialLine/withJsonLineAppender. loadModuleTree(projectRoot) returns revision/input/ModuleEntry[]; ModuleEntry and its named members need relay alongside it.
* CandidateSource names commitTree, treeEntries, readBlob, grepTree, diffNameStatus, diffPatch signatures. Existing harness relay already lists these with TreeEntry/TreeMatch; ChangeHistory requires ChangedFile, LineRange and LineCommit. Full transitive companion closure still requires provider review. Evidence GitError currently mentions CommandOutcome, so blanket relaying every error from that file is unsafe.
* ConsultationInspection is currently inferred via Awaited<ReturnType<typeof readConsultations>>. Its explicit outward result/recursive companion closure remains owed; no workaround type was introduced. Intended outward read entry points remain RunQueries, SessionQueries, currentModuleTree, ProjectionError, ExecutionPageError, readConsultations, consultationText and ConsultationInspectionOptions/ConsultationInspection, plus necessary signature companions.

No final selected exposure set was applied: full companion closure and reading-only body seam selection are explicitly unfinished, alongside the earlier declaration obstruction. Do not assign the child implementation as if its boundary were ready.

## Test/helper and native inventory — zero moves

Current old-directory importer census: 47 testing/helper files under harness/src/tests (receipt `shell/010.log`). Exact relative names:

```
acceptance-trial.test.ts
accepted-commit.test.ts
analysis-plan-evidence.test.ts
automatic-repair-incidents.test.ts
capability-records.test.ts
capability-tasks-projection.test.ts
check-findings-projection.test.ts
composition.test.ts
consultation-inspection.test.ts
continuity-projections.test.ts
execution-breakpoints.test.ts
execution-map-causal.test.ts
execution-map-durable.test.ts
execution-map-modules.test.ts
execution-map-pages.test.ts
execution-map-projection.test.ts
final-deviation-recovery.test.ts
gate-progress.test.ts
helpers/constructed.ts
helpers/legacy-sessions.ts
helpers/measurement-flow.ts
http.test.ts
integration-scenarios.test.ts
kpi-metrics.test.ts
lineage-metrics.test.ts
nonfunctional-deviation-runtime.test.ts
nonfunctional-recovery.test.ts
nonfunctional-run.boundary.test.ts
nonfunctional-run.test.ts
operation-recovery-callers.test.ts
plan13-composed-functional.test.ts
plan23-observation-integration.test.ts
plan25-combined-delivery.test.ts
plan36-mutation-attribution.test.ts
progress.test.ts
project-boundary-audit.integration.test.ts
projections-pure.test.ts
recovery-snapshot.test.ts
repair-export-command.test.ts
review-lifecycle.test.ts
review-stop.test.ts
run-projections.test.ts
scenario-projections.test.ts
session-lifecycle.test.ts
session-queries.test.ts
transcript-run.test.ts
union-values.test.ts
```

Pure provider candidates include run-projections, capability-tasks-projection, check-findings-projection, scenario-projections, progress, execution-map-{projection,pages,modules,causal,durable}, and historical reader cases. These are prospective classification, not authorized moves. HTTP, CLI, repair export, lifecycle/recovery/full-run/native composition stay harness-owned. Mixed session/KPI/lineage tests and helpers require case-level ownership and testing exposure decisions before relocation. projections-pure retains its source tripwire; assertions and process guards were not weakened.

Exact native-registry intersection (`src/tests/test-boundaries.json`) is unchanged:

* `subs/harness/src/tests/nonfunctional-run.boundary.test.ts`: boundary “Actual audit and accepted Git tree for composed nonfunctional work”; owning case “an empty fixed catalog records a candidate-bound empty assessment and audits its exact tree”.
* `subs/harness/src/tests/project-boundary-audit.integration.test.ts`: boundary “Actual nested producer discovery, recovery and cancellation”; five owning cases: full nested final F4 PB3-E05 audit of every eligible project/external skip/nested failure; indeterminate nested discovery remains unverified; readiness nested failure before branch then identical final reuse; F4 PB3-E06 exact recovered root/nested invocation identities without rerun; cancellation settles process/workspace before replacement. Exact original strings remain in registry at lines 325-335.

Registry whyFakeCannotProve for both: “The owning cases assert actual installed tool, published report/Git object or kernel process behavior; a scripted answer cannot establish that boundary.” Neither native file moves. Root registry is outside scope. No new exemption, fixture exclusion, or discovery setting was introduced. Existing child test discovery remains unchanged; no feature bindings were added or guessed Cucumber selection run.

## Focused verification

Executed exact assigned command from project root:

```
npm test -- subs/harness/src/tests/consultation-inspection.test.ts subs/harness/src/tests/execution-map-http.test.ts subs/harness/src/tests/http.test.ts subs/harness/src/tests/projections-pure.test.ts subs/harness/src/tests/session-queries.test.ts subs/harness/src/tests/repair-export-command.test.ts --maxWorkers=4
```

Exit 0, six files, 38 tests passing: consultation-inspection 6; execution-map-http 2; http 9; projections-pure 3; session-queries 2; repair-export-command 16. Runner duration 9.06 seconds. Receipt `shell/008.log` retains exact output and refresh. Real existing reader/consumer code with existing scripted external boundaries, not extracted-provider evidence.

`npm run type-check`: exit 0 (all four configured tsc invocations). `npm run check:self`: exit 0 with partial coverage as above. Receipt `shell/009.log` retains both and full diagnostics. No whole-suite Vitest/Cucumber, web build, or complete committed audit was run by the engineer; the gate owns committed default-mode audit.

## Before/after architectural comparison and next work

Before and after are identical ownership: 23 local query files/6000 lines, two production importing consumers (`http/app.ts`, `consultations/command.ts`), with repair-export-command no longer importing projection code at baseline. There is no decrease in parent implementation knowledge and no new contract cost yet, because no implementation moved. Historical exact-owner/subtree filesystem counts in the requester note remain historical; the current fresh provider structure census above is differently defined and must not be substituted for those counts. Nine existing direct harness children remain; projections is not a tenth child yet. Public wire/tag/root-relay surface is unchanged.

Remaining preparation: reconcile command and session relay isolation with supported declarations and legitimate consumers; authorize any necessary coordinated owner work; choose the reading-only transcript body seam; complete explicit signature companion closure and selected harness exposures; then safely bootstrap/refresh/check the child. Subsequent provider implementation and later harness consumer wiring must still verify need-001.ex01-ex04 with real HTTP/CLI/session/repair composition and the selected generated feature. This partial record binds/completes none of them.
