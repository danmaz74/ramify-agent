# Failed gate and bounded citation repair

Original candidate: `09e9d235a54654ca8f5dbb92b150296c918f3d8c`.
Original receipt: ga-0010, audit `20261013T215727Z-a3e5c9:ga-0010`,
requested/executed ramify-partial, composed verdict fail, two outstanding
ledger failures, failed check agent-tests. The original receipt and candidate
remain retained by the workflow; this note does not replace them.

Exact failed cases:

- `subs/harness/src/tests/composition.test.ts`, node:
  `every value of every union has a producer > the union list is complete, and every value is produced by a composed run, by a named test, or is named with the reason it has none`.
  ENOENT opening the former parent execution-map-projection.test.ts at
  composition.test.ts:1283. Its producedElsewhere citation at line 812 now
  points to `subs/harness/subs/projections/src/tests/execution-map-projection.test.ts`.
  Union, values, test title and validation assertions are unchanged. This is
  a migration-related navigation repair, not removal of producer coverage.
- `subs/harness/src/tests/restart-git.boundary.test.ts`, boundaries:
  `restart preparation and resumed branch setup preserve native source refs index and dirty files`.
  CommandRejection: `The job is at version 10, not 9`, at
  CommandLedger.requireVersion (jobs/commands.ts:72) and run/service.ts:3765.
  No restart test or production code was changed. Source waits for
  invocation-started, performs Git/file assertions, then reads a version for
  stopRun. An intervening transition is possible, but causation is unproven.

Provider counts for the failed audit: 385 files (2 failed, 382 passed,
1 skipped); 3277 tests (2 failed, 3273 passed, 2 skipped). Structure,
type-check, web build and patch-integrity passed. Scenarios reported pass
with zero scenarios and zero steps: not acceptance execution evidence.

After the citation repair, exact diagnostic command from project root:

```
npm test -- --maxWorkers=4 subs/harness/src/tests/composition.test.ts subs/harness/src/tests/restart-git.boundary.test.ts
npm run type-check
npm run check:self
```

Focused result: exit 0, 2 files / 15 tests passed (composition 14,
restart boundary 1), using the existing native-boundary registration.
Type-check exit 0. Complete structural check exit 0, completed/passed with
partial coverage: 0 errors, 0 warnings, 447 analysis limits; 14 owners,
915 source files, 90 resources, 18466 accesses. Outputs are retained under
inv-0074 shell/001.log and shell/002.log. A bounded scan of harness testing
TypeScript found no remaining literal citations to the five removed parent
focused paths.

The diagnostic passing restart run neither erases ga-0010 nor establishes a
flake or unrelated baseline defect. Advisory consultation instructed no
restart synchronization change, and supports proposing this bounded citation
repair for the existing gate workflow to qualify. No manual whole audit,
process exemption, weakened check or cosmetic execution-forcing mutation was
performed. The provider may reuse evidence; only a qualifying gate verdict
can establish acceptance.

Current supplied API evidence revision is
`rev/1:6fb6dafb-b976-4f1e-b8b3-fa44398352a2:61`, with unchanged source-area
coverage limits (harness ordinary/testing 1/26; projections 39/67). This repair
adds no import or exposure. Earlier materialization and focused regression
receipts remain historical evidence for their explicitly named state.
