| # | Location | What it tolerates | Old form still produced? | Class | Est. lines | Consumers affected |
|---|---|---|---|---|---|---:|---|
| 1 | Projections’ standalone-session reader and fixtures | Sessions under `plans/.harness/sessions/` | No | A | ~5,500 | Harness HTTP and web session pages |
| 2 | Autonomous linked-successor import reader | Copied successor runs initialized by `restart-prepared` | No | A | ~450 | Harness projections and execution map |
| 3 | Assistance document and review readers | Inline documents, earlier discovery policy and earlier source-verification markers | No | A | ~350 | Assistance assessment only |
| 4 | Task delivery and operation-intent readers | Delivered-inputs `/1`, harness-operation `/1`, pre-block context | No execution writer; old manifest helper default remains | A | ~300 | Task execution, projections and metrics |
| 5 | Run-policy adoption | `run-policy/7` runs without resource continuity | No default production writer | A | ~200 | Autonomous and manual execution |
| 6 | Non-functional round replay | Count-forced exhaustion after a repaired last round | No | A | ~100 | Acceptance and projections |
| 7 | Session-store journal replay | Inline-body `session-store-commit` transactions | No | A | ~80 | Session-store owner only |
| 8 | KPI readers and acquisition fallback | `scope-size/1` and measurement without a delivered manifest | No production writer/caller | A | ~70 | KPI and metrics projections |
| 9 | Submission and tool-input judges | Obsolete rejection bounds and exhaustion accessors | No production caller supplies judge bounds | A | ~40 | Execution equipment and manual sessions |
| 10 | Run-snapshot protocol defaults | Responses omitting breakpoint and automatic-repair state | No | A | ~30 | CLI/web protocol readers |
| 11 | Assignment-boundary compatibility checks | Write scopes missing captured boundary information | No current scope constructor | A | ~25 | Ownership repair and inherited scope |
| 12 | Pi transcript and observation schemas | Pi `0.87.1` records alongside `1.3.0` | No | A | ~20 | Pi adapter, observations and projections |

Inspected checkout: `44a8811f`. Estimates include associated compatibility-only tests and fixtures, not just production code. They exclude retained audit evidence and historical implementation receipts.

No finding requires a conversion of committed project configuration. No finding requires a ramify.ts or ramify-audit pin change. This package is private, and neither companion repository declares a dependency on it. The affected consumers are within ramify-agent.

## 1. Earlier standalone-session storage

**Locations**

- `subs/harness/subs/projections/src/standalone-records.ts:9–145`
- `subs/harness/subs/projections/src/session-queries.ts:44–58,73–81,150–181,231–280`
- `subs/harness/subs/projections/src/sessions.ts:191–215`
- `subs/harness/src/http/app.ts:319–334`
- `subs/harness/src/interfaces/protocol/sessions.ts:51–58,333–350`
- `subs/web/src/session-progress.ts:19,146`
- `subs/web/src/session-page.tsx:82–83,202`
- `subs/harness/src/tests/helpers/legacy-sessions/`
- `subs/harness/subs/projections/src/tests/helpers/legacy-sessions/`

**Evidence.** Commit `aebc693c` moved `session` onto the manual-run invocation runner and removed its standalone-record writer. The current reader explicitly says nothing writes this layout anymore. Current sessions write `plans/sessions/.harness/jobs/<id>/`.

The two tracked fixture directories contain **30 files and 4,680 lines**. Additional compatibility coverage lives in `session-queries.test.ts`, `session-reading.test.ts`, `continuity-projections.test.ts` and `helpers/projection-compatibility.ts`.

**Removal.** Delete the old record schemas, directory scanner, cache, standalone HTTP endpoints, protocol variants and web branches. Delete the old-layout fixtures and their exclusive tests. Keep current manual-run sessions, transcript paging and shared body/file readers.

**If verification is wrong.** A current session producer would become invisible to the session browser. Earlier standalone sessions intentionally become unreadable.

## 2. Linked-successor imports

**Locations**

- `subs/harness/subs/autonomous/src/run/restart-import.ts:1–135`
- `subs/harness/subs/autonomous/src/run/log.ts:79–81,828–845,874`
- `subs/harness/subs/autonomous/src/run/records.ts:189`
- `subs/harness/subs/autonomous/src/run/service.ts:1283–1306,2525,2719–2720`
- `subs/harness/subs/projections/src/inputs.ts:169–172`
- `subs/harness/subs/projections/src/snapshot.ts:75`
- `subs/harness/subs/projections/src/events.ts:37–42`
- `subs/harness/subs/autonomous/src/tests/restart-import.test.ts:54–84`

**Evidence.** Commit `32a18569` introduced copied successors. Commit `4b1a2c5d` removed their producer functions, including import construction, materialization and artifact copying. Current `prepareRestart`, at `service.ts:1894–1917`, appends `job-continued` to the existing run. It creates no import inventory.

**Removal.** Delete import decoding, provenance authentication, imported workflow installation, negative-sequence handling, restart initialization events and successor-only projection provenance. Delete corresponding tests and composition exemptions.

Keep ordinary same-run continuation and its settlement checks.

**If verification is wrong.** A current operation that still creates imported successors would fail at service startup. Existing copied successors intentionally stop loading.

## 3. Earlier assisted document and review formats

**Locations**

- `subs/harness/subs/assistance/src/documents.ts:17–35,44–45,59–68,73–115,117–184`
- `subs/harness/subs/assistance/src/assessment.ts:46,151–174,451–474`
- `subs/harness/subs/assistance/src/tests/assistance-assessment.test.ts:429–555`
- `subs/harness/subs/assistance/src/tests/assistance-documents.test.ts:119–121`

**Evidence.** Commit `1badd7fc` added qualification of historical inline documents. Commit `13c15cb1` stopped calling that qualifier, changed fresh document capture to immutable references, and changed review production from `git-exact-text/1` to `candidate-inspection/1`.

Current review writes use `candidate-inspection/1` at `assessment.ts:273,279`. Current document capture writes `storage: 'git-references'`. Full discovery remains reachable from production only to regenerate an earlier artifact under its earlier capture policy.

**Removal.** Delete `qualifyLegacyDocuments`, inline-text compatibility members, the saved-inline-document branch, historical discovery regeneration and the old/no-marker review-verification branches. Delete their synthetic old-stage tests.

Keep current candidate-source verification and reconciliation of current-run findings.

**If verification is wrong.** A current assessor checkpointing an earlier shape would no longer resume. Earlier assisted executions intentionally lose that support.

## 4. Delivered-inputs `/1` and harness-operation `/1`

**Locations**

- `subs/harness/subs/task-execution/src/delivery/delivered-manifest.ts:29,46–51`
- `subs/harness/subs/task-execution/src/session-operations.ts:47,80–96,390–410`
- `subs/harness/src/interfaces/protocol/runs.ts:1590–1600`
- `subs/harness/subs/task-execution/src/tests/plan25-blocks.test.ts:95–135,158–175`
- `subs/harness/src/tests/plan25-block-sessions.test.ts:153–210`
- `docs/metrics/session-observations.md:23,39–53`

**Evidence.** Commit `e3da96c2` introduced dual readers. Commit `f2c5e85a` replaced fresh operation production with `/2` and briefing occurrences.

Current fresh intents use `/2` at `session-operations.ts:424`. Both production manifest call sites explicitly request `/2`: `delivery/packet.ts:164` and `session-operations.ts:213`. The helper’s `/1` default survives for old-format tests, not an execution path.

**Removal.** Keep one intent schema and one manifest schema. Remove the `/1` helper default, old-task rendering comparison, old-format test constructors and compatibility assertions. Require the request hash that current fresh intents always capture.

Do not delete effective-block reconciliation wholesale: replaced, withdrawn or incompletely inherited blocks remain current runtime cases. Likewise, append replay still handles crashes between engine completion and harness recording.

**If verification is wrong.** An overlooked production caller relying on the helper default would change format. Retrying earlier `/1` operations intentionally stops working.

## 5. Earlier run-policy adoption

**Locations**

- `subs/harness/subs/autonomous/src/run/records.ts:85–89`
- `subs/harness/subs/autonomous/subs/work-coordination/src/capability/policy.ts:6–8,29–40`
- `subs/harness/subs/autonomous/src/run/service.ts:386–387,1304–1305,2692–2698`
- `subs/harness/subs/task-workflow/src/steps/manual.ts:165–171,293`
- `subs/harness/subs/task-workflow/src/steps/runner.ts:108,459`
- `subs/harness/subs/autonomous/src/run/log.ts:82`
- `docs/plans/45-architect-progress-checkpoints/main-plan.md:160–181,247,290–309,430–440`

**Evidence.** Commit `bfa1dda8` introduced continuity and adoption. `defaultRunPolicy` now always captures `run-policy/8`, continuity and recovery at `subs/harness/src/run/policy.ts:179–184`. Adoption executes only when continuity is absent.

The remaining `/7` admission and effective-policy overlay support earlier runs. Plan 45 is still proposed, but prescribes additional adoption and legacy-reader work.

**Removal.** Accept only the current policy, require its captured continuity/recovery members, and remove adoption events, effective-policy overlays and adoption hooks. Remove obsolete adoption requirements from executable plan requirements and acceptance scenarios.

Keep historical implementation receipts unchanged. Do not classify every captured count as removable solely because it is old: several are still written or referenced today.

**If verification is wrong.** An injected current policy without continuity would fail validation instead of being upgraded.

## 6. Count-forced non-functional exhaustion

**Locations**

- `subs/harness/subs/nonfunctional/src/rounds.ts:12–13,35–38,75–83`
- `subs/harness/subs/autonomous/subs/acceptance/src/nonfunctional-phase.ts:61,71,186,218,236–239,263`
- `subs/harness/subs/autonomous/subs/acceptance/src/tests/nonfunctional-phase.test.ts:124–131`

**Evidence.** Commit `d9154e68` removed count-based continuation limits and added `forcedLegacyExhaustion` plus `legacyCountClosure` to replay earlier closures.

Current round decisions close repaired, unresolved rounds as `continue`. Exhaustion without a repair remains current behavior; exhaustion solely because the repaired round reached `maxRounds` does not.

**Removal.** Delete the exceptional old-closure recognition, legacy maximum plumbing and its tests. Retain ordinary exhaustion, external candidate invalidation and semantic round validation.

**If verification is wrong.** A current writer producing a repaired count-exhausted round would be rejected during replay.

## 7. Inline-body session-store transactions

**Locations**

- `subs/harness/subs/session-store/src/session-store.ts:28–31,59–63,135–146,201–218,231`
- `subs/harness/subs/session-store/src/tests/plan23-session-store-cache.test.ts:281–288,367–370`

**Evidence.** Commit `dfc5a31d` introduced header transactions and content-addressed record bodies. Current commits write only `session-store-commit/2`, at `session-store.ts:309`.

The earlier transaction variant is produced by compatibility tests. Its replay branch requires the separate `serializedRecords` map and detached-read fallback.

**Removal.** Delete the earlier event schema, inline replay branch, serialized-record cache and mixed-journal tests. Read current record bodies through their authenticated body references.

Keep JSON normalization, CAS, ownership validation and optional-context handling. Those serve current inputs and runtime loss.

**If verification is wrong.** An overlooked inline transaction writer would create journals the store refuses.

## 8. Earlier KPI policy and package fallback

**Locations**

- `subs/harness/subs/kpi/src/run-records.ts:9–10`
- `subs/harness/subs/task-execution/src/records.ts:46–47`
- `subs/harness/src/interfaces/protocol/runs.ts:1602`
- `subs/harness/subs/kpi/src/capture.ts:152–159`
- `subs/harness/subs/kpi/src/metrics.ts:54,87,153–154,349`
- `subs/harness/subs/kpi/src/measurement/inputs.ts:42–60`
- `subs/harness/src/tests/measurement-inputs.test.ts:34`
- `subs/harness/subs/kpi/src/tests/metrics.test.ts:86–90,182`

**Evidence.** Current snapshot and scope construction use `scope-size/2`; `capture.ts:11` defines that policy. The earlier version survives in schemas and incomparable-policy branches.

Commit `2383b860` integrated delivered-manifest scope acquisition. The only production `invocationScope` caller, `steps/runner.ts:592`, supplies `packet.manifest`. Package-file and brief-size fallback remains test-only.

**Removal.** Restrict run measurements to `/2`, delete earlier-policy handling and tests, and require the delivered manifest in `invocationScope`. Remove fallback-only package, plan-ID and brief arguments.

Keep revision mismatch and unavailable-measurement handling.

**If verification is wrong.** A current caller without a manifest would fail instead of estimating from package inventory.

## 9. No-op rejection-limit compatibility

**Locations**

- `subs/harness/subs/task-execution/src/submissions.ts:66–67,166–179`
- `subs/harness/subs/autonomous/subs/work-coordination/src/work/engineer-equipment.ts:97–98,407`
- `subs/harness/subs/task-workflow/src/steps/run.ts:688`
- `subs/harness/subs/task-workflow/src/sessions/single.ts:467`
- `subs/harness/subs/task-execution/src/tests/submission-corrections.test.ts:25,47,56`

**Evidence.** Commit `d9154e68` removed rejection-count termination. Both optional `bound` arguments are ignored. `ToolInputJudge.exhausted` always returns false. Production judge construction no longer supplies bounds.

**Removal.** Delete ignored judge options, the constant-false accessor, equipment forwarding and dependent dead `endedAs` callbacks. Remove compatibility-only test arguments.

This does not justify deleting every `invalid-submission` outcome: other paths must be considered separately.

**If verification is wrong.** An overlooked caller expecting exhaustion would lose that behavior. The current accessor already cannot provide it.

## 10. Defaults for earlier run snapshots

**Locations**

- `subs/harness/src/interfaces/protocol/runs.ts:489–495`
- `subs/harness/subs/projections/src/snapshot.ts:72–74`
- `subs/harness/src/tests/execution-breakpoints-http.test.ts:113–114`
- `subs/harness/subs/projections/src/tests/automatic-repair-incidents.test.ts:54–59`

**Evidence.** Commits `82789bbd` and `b92cf8af` added the breakpoint and automatic-repair projections with compatibility defaults.

Current `snapshotOf` explicitly supplies `automaticRepairs`, `breakpoint` and `recovery`, including empty or null values. The omission tests manufacture earlier responses by deleting those properties.

**Removal.** Require those current response fields and remove old-response defaulting tests.

Keep the optional breakpoint selector on run creation and stored ordinary runs. “No breakpoint selected” remains current behavior.

**If verification is wrong.** A current response producer omitting these fields would fail protocol validation.

## 11. Missing assignment-boundary information

**Locations**

- `subs/harness/src/work/scope.ts:82–87,489,529–542`
- `subs/harness/subs/autonomous/subs/work-coordination/src/work/inherited-scope.ts:21`
- `subs/harness/src/tests/write-scope-submission.test.ts:186–188`
- `subs/harness/src/tests/inherited-scope.test.ts:63`

**Evidence.** Commit `810758a1` added the captured assignment boundary. The current constructor at `scope.ts:489` always writes its version and `nestedDeclarations`.

`missingHistoricalAuthority` exists to admit the older schema and then report that it lacks permission evidence.

**Removal.** Require the current captured fields and delete old-record absence checks and their tests. Remove the version marker itself if it has no remaining purpose after the schema becomes single-format.

Keep historical permission projection for current-run repair and all actual ownership restrictions.

**If verification is wrong.** A current scope producer omitting those fields would fail at decoding rather than later at repair admission.

## 12. Pi `0.87.1` record acceptance

**Locations**

- `subs/harness/subs/agent/subs/pi/src/preservation.ts:89,188`
- `subs/harness/subs/agent/src/interfaces/port.ts:482`
- `subs/harness/subs/task-execution/src/observations.ts:53`
- `subs/harness/src/interfaces/protocol/runs.ts:1642`
- `subs/harness/subs/projections/src/tests/continuity-projections.test.ts:14`
- `subs/harness/subs/task-execution/src/tests/execution-observations.test.ts:9`

**Evidence.** Commit `ce817036` upgraded the adapter and retained the earlier transcript version. Current writes use package version `1.3.0` at `session-operations.ts:214` and observation source `pi@1.3.0:SettingsManager` at line 244. Installed serialization explicitly requires `1.3.0`.

**Removal.** Remove the earlier package-version and observation-source alternatives. Remove old-version parameterized cases and update ordinary fixtures to current producer values.

Keep provider/model variation and opaque native request observations.

**If verification is wrong.** An overlooked current adapter emitting the earlier identity would be rejected.

## Areas inspected with nothing to remove

- **Stored role spellings.** These are current identifiers, not reader aliases. Production still requests `global-fork` in `coordination.ts:2240,2498`, `contract-engineer` at `4754`, and `nonfunctional-repair-engineer` in `acceptance.ts:2175`. Display-name mapping does not establish a replacement stored format.

- **Recovery resume fields.** The executor no longer reads occurrence, revision or repair declarations in `service.ts:2701–2745`. However, current `src/recovery-client.ts:19–23,52–63` still constructs them, and `src/cli.ts:225–256` still accepts the flags. Under the requested producer rule, these are not an isolated reader removal. The current CLI producer must change with the schema.

- **Restart prepare adapter.** Unlike copied-successor imports, the command is still produced by `src/restart-client.ts:47` and `subs/web/src/restart.tsx:56`. It continues failed/interrupted terminal runs. `resumeRecovery` rejects terminal runs at `service.ts:2708`. Deleting the adapter would remove current behavior.

- **Optional `settlementConfirmed`.** Current code still omits it. `service.ts:2153` omits it when an admitted exchange has no outcome. `execution.ts:104` can return before execution without the member. Its optionality is not solely historical.

- **Review-orientation records.** They are still produced at `acceptance.ts:808–825` and consumed by current design reviews and manual review preparation. Current orientation production omits `transportInvocations`, so that optional member cannot simply become required.

- **Scenario obligations and assignments.** `assignment.obligations` remains an optional current submission field at `work/assignment.ts:166–171`. Current feature selection and engineer briefing still use it. Missing scenario citations are also still produced by `scenarios/src/records.ts:127–166` before later processing. No old-only assignment reader was established.

- **Review inspection inventories.** Current review declaration schemas still offer `inspected`, `missing` and `coverageGap`; the assisted prompt still requests `coverageGap` when more than twenty material concerns remain. Their “legacy” comments do not prove the fields are no longer produced.

- **Project configuration and provider answers.** No verified dual-format removal was established for `ramify-agent.json`, `ramify-audit.json` or test-boundary configuration. The affected and ownership CLI documents are distinct current provider operations, not merely older versions of one operation.

- **Recovery and runtime variation.** Same-run crash recovery, effect deduplication, optional conversation loss, fresh-session reconstruction, retries, settlement checks and unavailable evidence remain current behavior. They were not counted as compatibility layers.

- **Retained evidence.** Historical results, published audit evidence and receipts were not counted as deletable fixtures. `docs/.superseded/` and generated `.ramify` views were excluded. No files were modified, and no tests or audits were run.
