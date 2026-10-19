# Iteration 1 configured-test repair

Assessment `as-0004` stopped after the configured `agent-tests` check failed for
candidate `70723cbe1ed56d18a9fe34db85f5d4f99dc58d79`; it performed no semantic
review. The earlier `cf-0004` repair remains pending semantic reassessment, not a
new reproduced concern. Audit report commit:
`ea11646bd5895b44b142081d0d78389e5cf49962`, run reference
`refs/audited/runs/2026-10-19T21-16-48Z-70723cbe1`.

The [diagnostic extract](failed-audit-extract.json) retains the exact failing
case, evidence hash, discovery completeness and counts. All 449 expected files
ran: 447 passed, one failed, one skipped; tests were 3,595 passed, one failed,
two skipped. The sole failure was
`CA20 CA32: restart settles an unstarted provider attempt before resuming the same pending assignment`
in `capability-recovery.test.ts`. Its cleanup stop was rejected as stale:
“The job is at version 82, not 81”, at the lifecycle stop admission/version check.

The test waited for replacement writer acquisition, then read the current cursor
and sent stop while normal invocation preparation could still append a ledger
revision. Writer acquisition explicitly precedes delivered-input and operation
identity preparation. The production optimistic concurrency rejection was
correct; the test assumed that acquisition meant startup writes had settled.

The test now signals when the resumed scripted provider reaches an abortable
`await` after preparation. It explicitly verifies that the acquisition cursor is
older and receives `stale-version`, then stops with the current stable cursor.
The original checks still verify confirmed former-writer release before its
replacement, exactly two acquisitions, one assignment, one stopped job, no
failure, no premature capability settlement/handback and no other entry dispatch.
The test uses observable ordering rather than a delay or a retry that could mask
an unrelated error. Production code and public/protected contracts are unchanged.

| Verification from the isolated project root | Result |
| --- | --- |
| Exact failed case by name | One passed; 15 other cases excluded by the explicit name filter. |
| Complete focused recovery test file | All 16 passed; zero native/refused process attempts. |
| `npm run type-check` | All four configured TypeScript projects passed. |
| `npm run check:self` | Passed; zero errors, warnings or denied accesses. Coverage remains partial with 781 analysis limits. |
| `git diff --check` | Passed. |

[Commands and compressed logs](verification/), [exact process receipts](test-process-receipts.json)
and [changed-source fingerprint](source-sha256.json) retain this verification.
Receipts select the exact isolated root and absolute test path for the runs
starting at 21:19:01 and 21:19:41 UTC on 2026-10-19. This repair changes one test
file; it does not rerun or modify the Codex provider qualification. No full audit,
semantic review, live exercise, protected edits or I2 implementation was run.
The coordinator owns the next audit/assessment and its existing execution notes.
