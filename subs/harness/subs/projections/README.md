# Projections

Read-only Node query provider, a direct untagged child of harness. This owner
contains all 23 baseline query implementations formerly owned at
`subs/harness/src/projections/`. Parent copies still support 9 remaining
test/helper files; retirement is incomplete. Public-query parent integration
now uses this real child, including native audit/recovery, persisted execution
maps and repair-export presentation. See `notes/retirement-progress.md` for the
current assertion map and exact outstanding imports. HTTP,
CLI, run coordination, durable/public protocol authority and repair-export
admission have not moved here.

`RunQueries` and `SessionQueries` consume child-owned `RunSource`,
`CommittedRun` and `CommittedLine`: committed decoded input plus selected Git
reading ports, never a writable run service. Query decoding, presentation,
provenance, version refusals, session caches and cursors are owned here.
`currentModuleTree` reads the existing view loader. `readConsultations` and
`consultationText` read/render retained exchanges using `openContentReader`,
`readBody` and `readTranscript`, without transcript persistence policy.
Repair presentation uses harness `authenticateRepairHistory` and
`RepairHistoryError`; no validator or effect admission is duplicated.

The exact explicit parent surface and owned companions are in `module.ramify`.
No browser tags, descendant exports or private projector exports are added.
Parent-owned public/durable return/parameter types and sibling reading port
companions already belong to/are received by harness; they are not copied or
redefined here. Reading dependencies resolve to parent `../../../src/` and
sibling `../../<owner>/src/`, never generated views. See
`notes/extraction-inventory.md` for file and resolved dependency inventory and
`notes/verification.md` for diagnostics and evidence limitations.

## Owned tests

Run from the project root:

```
npm test -- --maxWorkers=4 subs/harness/subs/projections/src/tests/execution-map-causal.test.ts subs/harness/subs/projections/src/tests/execution-map-modules.test.ts subs/harness/subs/projections/src/tests/execution-map-projection.test.ts subs/harness/subs/projections/src/tests/run-projections.test.ts subs/harness/subs/projections/src/tests/committed-queries.test.ts subs/harness/subs/projections/src/tests/execution-map-pages.test.ts subs/harness/subs/projections/src/tests/continuity-projections.test.ts subs/harness/subs/projections/src/tests/consultation-reading.test.ts subs/harness/subs/projections/src/tests/repair-reading.test.ts subs/harness/subs/projections/src/tests/session-reading.test.ts subs/harness/subs/projections/src/tests/efficiency-provenance.test.ts
```

Real queries read scripted committed inputs or retained historical files.
Baseline cursor-page and continuity assertions are preserved; targeted
consultation reading assertions retain partial-evidence, exact-answer and
hash-refusal behavior. The focused causal, module-map, structured-evidence and run-projection tests
now import private projectors locally. The parent page test had an identical
non-import body to this owner's page test and was removed without losing cases.
Constructed committed-input fixtures remain parent-owned, received only through
selected testing contracts with reading-type companions; no service is copied
or injected. HTTP/CLI/full-run/recovery integration stays with harness, including
`execution-map-durable.test.ts`; native boundary registrations are unchanged.
The efficiency-provenance witness is split from parent composition with the
same recorded fixture and assertions. The six focused repair, CheckFinding,
KPI-reading, lineage, progress and scenario test families now live here (58
cases); parent ledger, KPI calculation, real-run and HTTP cases remain with
harness. KPI fixture values are shared through selected parent testing contracts,
and CheckFinding construction uses selected pure decide/replay relays. Run the
six corresponding `src/tests/*.test.ts` files by exact name from the project
root; see the current assertion and verification map in retirement-progress.md. The identical parent continuity duplicate
is retired; this owner retains all four cases. See
`notes/focused-test-migration.md` for the earlier slice's receipt and
`notes/retirement-progress.md` for current progress and the remaining old-tree
inventory. Focused test health is not scenario completion. Configured Node discovery
includes `subs/**/src/**/*.test.ts`; ordinary tests retain root process guarding
and receive no new exemptions.
