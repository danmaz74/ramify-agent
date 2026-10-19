# Ordinary repair workflows use the configured store adapter

Assessment `as-0004` audited candidate
`e30a881d661736bdb597c45564d7db683ac9fe4a`. Its outstanding configured audit
failure was the ordinary test `second supported preparation fault refuses after
one repair invocation`, which exceeded the unchanged 5,000 ms Vitest test bound.
The review-lifetime implementation itself had no reported repair finding.
[Exact diagnostic and audit references](audit-failure.json) retain the failed
status; passing local checks do not retroactively pass that assessment.

The mixed `automatic-project-repair.test.ts` globally unmocked the disk session
store to support five missing/corrupt optional-payload restart cases. This forced
all its ordinary repair workflow cases through bulk session persistence, contrary
to the [test boundary contract](../../../../docs/testing.spec.md). Candidate
`693ed890f2cc3844482b355b0fe071fcbdc4c443` had not changed this file and therefore
did not itself repair that boundary.

The five actual-file payload cases now live in
`subs/harness/src/tests/automatic-project-repair-persistence.test.ts` and explicitly
unmock the real store. The existing ordinary workflow file uses the configured
directory-scoped memory adapter. Both use one shared scenario/incident helper;
fixtures, real workflow logic, durable run-ledger assertions, recovery behavior,
case titles, optional-context corruption/missing bytes and assertion coverage are
preserved. The formerly timed-out case additionally asserts that the session-store
disk directory is absent, so its intended workflow boundary cannot silently return
to bulk persistence. Its durable run records remain real.

The complete configured discovery includes both files in the guarded `node`
project. No native process claim, boundary registry entry, test timeout, retry,
skip, runner configuration or production behavior changed. No protected file
changed; the coordinator's current execution notes are included unchanged.

| Local verification | Result |
| --- | --- |
| [Both exact repair files](focused-tests.log) | 2 files, all 16 original cases passed |
| [Type-check](type-check.log) | All configured TypeScript projects passed |
| [check:self](check-self.log) | Passed, zero errors/denied accesses; existing partial coverage retained |
| [Configured discovery](discovery.json) | Both exact files discovered in guarded ordinary Node project |
| Patch integrity | Staged and committed diff checks pass |

No duplicate full audit was run. The joint source still includes the prior broad
review-only correction and independently verified bounded evidence artifacts.
Configured reassessment of the new committed candidate remains the coordinator's
next gate.
