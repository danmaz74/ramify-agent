# Standalone repair-history acceptance progress

This is retained candidate work, not qualification of the stopped full run
20261014T050940Z-e081d1. The sc005 source at d38a4694 remains baseline.

## Implemented

Harness-owned Cucumber steps for sc006 and the exact seven sc007 examples use
`src/tests/helpers/projection-repair-history.ts`. The ordinary discoverable
`src/tests/projection-repair-history.test.ts` executes the same eight fixtures.
`helpers/repair-export-fixture.ts` now owns the retained run setup formerly local
to `repair-export-command.test.ts`; every existing command assertion is retained.

The fixtures use real RunLog/commitRecord retained incident and payload bodies,
the real child RunQueries, the real harness authenticator, and the real repair
export command. The only substituted effect is commandExecution at the external
tracker boundary. Query inventories include every run file's bytes and mtime.
Invalid command inventories leave damaged incident/payload materializations and
all other run files untouched, with zero external calls and exit status 2.
Each invalid stimulus asserts its specific validator diagnostic, the child's
unreadable code and exact evidence (empty arrays for these lifecycle failures),
and the command's corresponding refusal. Valid export checks stable identity,
non-export evidence, initial identity lookup and retry lookup/update payload,
JSON output/exit status, terminal preservation and child lifecycle preservation.

A small direct-import/direct-call text witness supplements real behavioral
checks for the two consumers' shared authenticator. It is deliberately not a
whole-program call-graph or capability analysis and establishes nothing about
the complete sc008 production surface.

## Verification

Latest focused run: shell/014.log in standalone invocation inv-0001, job
20261014T074907Z-4a0773:

- 26 Vitest tests passed across projection-repair-history.test.ts,
  repair-export-command.test.ts and child repair-reading.test.ts.
- npm run type-check passed (all configured compiler projects).
- Prepared focused Cucumber selection executed 9 scenarios: sc006 and all seven
  sc007 examples passed; sc008 is undefined (six missing steps). 86 steps passed,
  six undefined. Exit status 1, not acceptance. No ambiguity or zero execution.

`npm run check:self` in shell/012.log completed and passed with partial coverage:
0 errors, 0 warnings, 455 analysis limits. In particular `RunQueries`,
`readConsultations` and `consultationText` have signature-inferred limits:
companions of their inferred signatures were not verified. Supplied harness
ordinary/testing API views also carry the briefing's 1/26 coverage limits.
A typecheck pass does not establish explicit Ramify signature exposure closure.

## Remaining / smallest next assignment

sc008 has not been bound. The projections child's guarded source/declaration and
its owned tests are not writable in this standalone harness assignment. Delegate
a bounded child assignment to review and, where necessary, make explicit the
named signature companions of RunQueries/readConsultations/consultationText,
retain explicit exposure, and add child-owned read-only production-port witnesses
(no writer/service/command injection or calls) using its own supplied ordinary
and testing API views. Deliver the real tests and honest analysis limitations,
not a writable testing interface. Then assign the harness sc008 bindings and
ordinary witness for real consumer imports, web/private boundaries and configured
discovery, reusing that delivery and the existing parent integration fixtures.
No production behavior, feature, audit configuration, dependency pin, run record
or child-owned file was edited here. No stopped-run scenario state is claimed.

## Later operator assessment

The signature-inference limits above did not demonstrate a missing import or
companion: actual child and parent imports type-check, and Ramify reports no
denied access. A later parent-owned sc008 fixture binds the six remaining
steps using real consumer imports, current ordinary/testing API metadata,
explicit child declarations, the frozen reading port, production source and
configured discovery. The latest frozen feature then passed all 14 expanded
cases, with no child declaration or production edit. The limits remain stated
in [the architecture comparison](../subs/projections/notes/architecture-comparison.md)
and final qualification evidence; this historical partial report remains the
record of what that standalone session submitted.
