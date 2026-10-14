# Real projection consumer integration (focused candidate evidence)

HTTP imports `ProjectionError`, `ExecutionPageError`, `currentModuleTree`,
`RunQueries` and `SessionQueries` directly from the projections child.
Consultation inspection imports the child's `readConsultations` and
`consultationText`. `createQuerySource` changed only its RunSource import:
its frozen seven keys, dynamic getters, bound reading closures and
candidate/history ports remain unchanged. Commands retain RunService separately.
No child implementation, declaration, public protocol, configuration or process
registration was changed. The old parent projection tree is intentionally
retained for later cleanup; private baseline test fixtures are not real-child
integration evidence by themselves.

## Focused execution

All paths below are under `subs/harness/src/tests/`. The exact five files were
run together using `npm test -- <five paths> --maxWorkers=4 --reporter=verbose`.
Latest run: 34/34 cases passed, five files passed (shell/009.log):

- `http-query-source.test.ts`: 1/1; frozen seven-key port, receiver binding,
  dynamic metadata, omitted writable collaborators, real child queries and
  child ProjectionError identity for run/session misses. FakeReadingService
  scripts input facts only; the providers are real.
- `http.test.ts`: 9/9; PB3-R01 unsupported historical policies (including missing
  policy), child error identity and actual HTTP 422 translation; project/plan
  answers, protocol errors, module-tree unavailable/unreadable/available,
  assets and invalid project root.
- `session-queries.test.ts`: 2/2 ST09 cases; real HTTP run and historical
  standalone sessions, lineage/evaluations, transcripts/bodies, cursors,
  invalid requests and missing records, partial/malformed tails, finished
  caching, polling selection and state changes. Repeated HTTP cached queries
  compare all regular project files by SHA-256 and mtime, including event bytes.
- `consultation-inspection.test.ts`: 6/6 C13-C16 cases; real child and CLI JSON,
  exact text/status, nested exchange ordering/filtering, accepted/cancelled
  versus absent delivery, unknown/malformed refusals, partial tails and missing
  mirrors, partial usage, pre-feature logs and incomplete correlated delivery.
  Existing recursive byte hashes/mtime and scripted-agent counters remain.
- `repair-export-command.test.ts`: 16/16; added real public child RunQueries.run
  presentation/refusals alongside every retained private baseline assertion.
  Record/event identity mismatch, revision gap, invalid lifecycle, changed
  original evidence, export-only evidence violation, invocation/session conflict
  and unverified continuation all refuse before command recovery/export.
  Unsupported/malformed durable history preserves code and path evidence.
  Valid terminal export preserves identity/lifecycle/payload; repeated child
  queries compare durable bytes/mtime and event sequence with exporter count
  unchanged. Symlink identity, pending/unavailable CLI, conflicting tracker
  identities, lock and copy-recovery assertions remain intact.

Original need-001.ex01-ex05 behavior families retained: narrow composition and
error identity/translation; consultation JSON/text/refusals; paging/polling/cache
boundaries; historical compatibility and explicit missing/unsupported evidence;
shared repair presentation versus independent command admission. This is not a
cap-001 completion report or a parent scenario acceptance claim.

Earlier focused run shell/004.log passed 34/34 before the added HTTP filesystem
capture. Shell/007.log then had 33 passes and one ST09 failure: fetch failed,
ECONNRESET at session-queries.test.ts:196 (metrics read). The snapshot initially
retained Buffers in a deep equality comparison; it now compares SHA-256 byte
identities and mtimes (same regular-file coverage). Shell/009.log passed after
that change. The failure is retained, not claimed to prove a flake or erased by
the later pass. These are focused runs, not committed-audit qualification.

Complete shell outputs are retained under
`plans/projections-extraction/.harness/jobs/20261013T215727Z-a3e5c9/invocations/inv-0063/shell/`.
`010.log` contains the final complete type-check/check:self diagnostics (`006.log`
retains the earlier run): both commands
exited zero; structure completed/passed with partial coverage, 0 errors,
0 warnings, 447 analysis limits, 14 owners, 916 source files, 90 resources,
18474 accesses (13821 allowed, 0 denied, 4647 external).

## Boundary and admission inspection

Child repairs.ts consumes the single parent authenticateRepairHistory and
translates RepairHistoryError to its own ProjectionError. Parent
run/repair-export-command.ts imports no child projector: validateCommittedHistory
and authenticateRepairHistory run before recoverCommits, then external export.
HTTP uses the child error constructors in its instanceof translations, retaining
code, message, current version and projection evidence.

Received API revision: rev/1:6fb6dafb-b976-4f1e-b8b3-fa44398352a2:28.
Parent ordinary/testing limits: 1 / 26. Child ordinary/testing limits supplied
by the producer: 39 / 67. These are separate source areas, not complete
signature-companion analysis. Truncated query signatures were checked against
specific child source methods; absence from limited views proves nothing.
No generated view was edited/imported. No full suite, Cucumber or manual audit
was run. Full committed qualification belongs to the gate; broader cleanup
and scenario acceptance remain open.
