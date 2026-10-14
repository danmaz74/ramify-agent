# Projections

Read-only Node query provider, a direct untagged child of harness. This owner
contains all 23 baseline query implementations formerly owned at
`subs/harness/src/projections/`. Parent copies remain an explicit temporary
baseline: parent caller integration and deletion are subsequent work. HTTP,
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
npm test -- --maxWorkers=4 subs/harness/subs/projections/src/tests/committed-queries.test.ts subs/harness/subs/projections/src/tests/execution-map-pages.test.ts subs/harness/subs/projections/src/tests/continuity-projections.test.ts subs/harness/subs/projections/src/tests/consultation-reading.test.ts subs/harness/subs/projections/src/tests/repair-reading.test.ts subs/harness/subs/projections/src/tests/session-reading.test.ts
```

Real queries read scripted committed inputs or retained historical files.
Baseline cursor-page and continuity assertions are preserved; targeted
consultation reading assertions retain partial-evidence, exact-answer and
hash-refusal behavior. Existing parent tests and native boundary registrations
remain untouched, including the parent HTTP/CLI/full-run/no-write composition
assertions. This provider-only step does not establish real HTTP/query-source,
session-query or consultation CLI integration. Configured Node discovery
includes `subs/**/src/**/*.test.ts`; ordinary tests retain root process guarding
and receive no new exemptions.
