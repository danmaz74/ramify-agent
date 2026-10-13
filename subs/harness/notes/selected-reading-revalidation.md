# Selected reading preparation: current revalidation

This records only the bounded harness-owned preparation, not extraction acceptance
or cap-001 completion. Current task candidate is
`18c47f8d8b72f7b62e142ea2da78c76ee5566784`; accepted boundary supplied by the task
is `bfce1039705665501dfa1918569d469a98f34496`. Neither was inspected with Git.
The prior candidate already contains the reading facade, selected descendant
exposures, owned collision-free aliases and tests. They were reused rather than
reimplemented. Historical receipts in `selected-reading-dependencies.md` remain
historical, not fresh verification.

## Exact changes and inventory

Changes authored in this invocation:

- `subs/harness/src/tests/transcript-reader.test.ts`: strengthen the existing
  real facade case with a deliberately nonmatching hash's retained raw bytes,
  confirming existing ContentStore read semantics and unchanged bytes/mtime.
  Digest authentication remains the authority reader's job, not a new store
  policy. No existing expectation was weakened.
- `subs/harness/notes/selected-reading-revalidation.md`: this evidence record.

The retained preparation's exact 12-file list, named exposure inventory,
recursive companion index and remaining gaps are in
`subs/harness/notes/selected-reading-dependencies.md`. Its original list is not
claimed as a new diff in this invocation. `subs/harness/module.ramify` remains
the literal named symbol inventory: explicit selected owned reading exports and
direct-child reading relays; browser/public parent declarations are unchanged.
No new writer, command executor, writable service, persistence or agent/audit
invocation was exposed. Existing inherited writable availability was left alone.

Fresh multiline import census covers every production projection import,
including multiline protocol imports: 23 files, 6,000 lines. Exact statements
and symbol names are retained in the current receipt `shell/003.log` below.
The per-file parent/sibling dependency index in the prior note still matches
this census. No query body, caller, paging/cache policy, durable format or
public wire contract changed, and no child was created. In particular the
consultation projector still imports ContentStore locally; its eventual child
migration must use openContentReader instead, not expose ContentStore.

Transcript descendant inventory and companions:

- `transcripts/store.ts`: ContentReader, openContentReader. Reader offers only
  read(hash); facade is frozen, exact one-property object, bound to existing
  ContentStore behavior. No directory/put/path/store/cache is obtainable from it.
- `transcripts/writer.ts`: readBody, readTranscript, TranscriptRead. readBody
  accepts ContentReader; ContentStore remains structurally usable by existing
  writer callers. File/blob/inline and failure policies are unchanged.
- `transcripts/pages.ts`: TranscriptPages, PageBounds, TranscriptPageRead.
- `interfaces/protocol/transcripts.ts`: TranscriptBody, TranscriptEntry,
  transcriptBodySchema, transcriptEntrySchema; referenced wire schemas and
  inferred signature closure retain the producer's analysis limitations.

Other retained named companion sets include HistoryEntry with committed-history
admission; ReplayedCapabilityState with replay; DurableRunSnapshot/Notice with
runSnapshot; RunSessionMoment, points, relations and transition types with the
session reducer; DeviationOrigin with merge-readiness; committed work/iteration,
registry/placement/contract/capability records; accepted evidence Incorporation,
ElementCatalog/DocumentManifest; KPI decoded invocation/scope/observation/lineage
facts; sibling LedgerEntry/Transaction/RecordBody/JsonLines, scenario state/ID,
nonfunctional assessment/round facts, and CheckFinding committed state and report
companions. The complete individual names, schemas and defining files remain
explicit in module.ramify, not blanket implementation-file exports.

Shared authenticateRepairHistory, RepairHistoryError, RepairHistoryEntry and
ValidatedRepairIncident exposures are reused with RunEvent and repair facts.
Fresh source inspection confirms repair-export authentication at line 48 still
precedes recoverCommits at line 49. Command and authentication source unchanged.

## Remaining foreign-owner gaps

Bounded supplied ordinary-view pages reconfirm these original contracts, not
absence of implementation:

1. `ramify-agent/harness/evidence`,
   `subs/harness/subs/evidence/src/git.ts`: ChangeHistory requires ChangedFile,
   LineCommit and the owner's LineRange. That LineRange conflicts with the
   distinct existing agent LineRange descendant relay. Deferred reading closure:
   ChangeHistory, ChangedFile, LineRange and harness kpi/delivered.ts's
   deliveredChange exposure. The owner must arrange collision-free original
   bindings; no foreign-source alias workaround or structural substitution was
   added. Future queries/metrics reading ports require this closure.
2. `ramify-agent/harness/check-findings`,
   `subs/harness/subs/check-findings/src/interfaces/check-findings.ts`:
   CheckFindingSummary.materialChoice requires CheckFindingMaterialChoice,
   conflicting with the unchanged harness public wire name. Deferred:
   CheckFindingSummary, CheckFindingDetailView, CheckFindingListView,
   CheckFindingSelection; `src/queries.ts` selectCheckFindings and its
   CheckFindingQueryInput/checkFindingQuerySchema companions. The supplied
   function page is truncated, so its complete signature is not verified here;
   the prior checker identified the input companion. Responsible-owner
   coordination is needed, not a wire-type substitution or copied contract.

No out-of-scope owner sources/declarations were edited. These gaps are unresolved
subsequent dependencies, not accepted omissions or a completed reading closure.

## Fresh focused checks

All receipts below are under
`plans/projections-extraction/.harness/jobs/20261013T215727Z-a3e5c9/invocations/inv-0029/`.

- `shell/004.log`: exact supported focused command from project root:
  `npm test -- --maxWorkers=4 subs/harness/src/tests/http-query-source.test.ts subs/harness/src/tests/http.test.ts subs/harness/src/tests/session-queries.test.ts subs/harness/src/tests/consultation-inspection.test.ts subs/harness/src/tests/transcript-reader.test.ts subs/harness/src/tests/transcript-writer.test.ts subs/harness/src/tests/transcript-pages.test.ts subs/harness/src/tests/transcript-run.test.ts`.
  Exit 0, 8 files/48 tests passed: respectively 1, 9, 2, 6, 3, 21, 4, 2.
  No failing cases or diagnostics. Facade/body/missing/hash/error/raw-content and
  bytes/mtime assertions run against real filesystem reading facilities;
  existing consumer tests retain their scripted external boundaries.
- `shell/005.log`: npm run type-check, exit 0, no compiler diagnostics. All four
  declared root/web/scripts/browser-acceptance tsc configurations ran.
- Same receipt: npm run check:self, exit 0, execution completed/check passed,
  **coverage partial**. 13 owners, 883 source files, 75 resources, 17,875 accesses;
  0 errors, 0 warnings, 444 analysis limits; 13,292 allowed, 0 denied,
  4,577 external. Limit categories remain signature-inferred, nonliteral-target,
  namespace-escape and shared-global. Inferred schema/signature companions are
  not fully verified. The test-edit mutation hook timed out/not-checked; this
  later explicit structure run is separate passing partial-coverage evidence,
  not a reinterpretation of that hook as a pass.

No whole-suite Vitest/Cucumber or committed/final audit was run manually. The
harness owns audit selection/verdict. Focused results establish neither all
need-001 behaviors nor extraction acceptance.

## API refresh limitation

Supported ordinary/testing API refresh was requested through advisory
consultation. The architect identified a documented materialize route but
confirmed it cannot grant command/output-write authority. No explicit generated
output-write route/tool is supplied in this assignment (generated API edits are
excluded); no shell workaround or manual generated edit was attempted.
Refresh therefore remains unavailable/requested, not completed.

The only supplied producer revision remains
`rev/1:46f94cbc-4873-41d7-9437-3133f3734acd:19`, ordinary 1 and testing 17
source-analysis limits, used separately. Absence is not proof of unavailability.
No new producer revision is asserted from check:self. Because the child does
not exist, neither ordinary nor testing child importability is established.
Next workflow must resolve foreign closures, refresh coherent views, implement
and verify actual child imports and real consumers; none is completed here.
