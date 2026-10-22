# sc-004 bounded compatibility qualification

Parent-owned integration: `src/tests/helpers/projection-compatibility.ts`, `src/tests/projection-compatibility.test.ts`, and `src/tests/steps/projection-compatibility.ts`. Real RunService is closed and reopened under a newly acquired project lock; fresh public RunQueries/SessionQueries and real HTTP app are constructed. FakeQueryEffects scripts only external agent/audit/evidence/export collaborators. Existing consumer/paging scenarios and assertions remain intact.

## Tested matrix

- Supported `ramify-agent.job/3` with current constructed policy: completed retained run, version 11, independent expected event transitions and session state/model/finish, recorded transcript bytes, HTTP/direct equivalence.
- Historical `ramify-agent.session/2`, retired run-policy form, outcome `/1`: finished with recorded prompt and submitted outcome; interrupted with deliberately removed outcome, null outcome/evaluation end. Public transcript pages match installed retained entries and HTTP.
- Committed hypothesis `/999`: unsupported-version; `/1` with required fields absent: unreadable. Both include the concrete `plans/review-notes/.harness/jobs/<id>/hypotheses/hyp-001.json` evidence. Invalid bodies are committed by the real ledger as setup stimuli, not decoded in parent query code.
- Historical session `/999` and `/2` missing required fields, both retaining supported policy: unsupported-version/unreadable respectively, concrete `plans/.harness/sessions/<id>/session.json` evidence. Exact HTTP refusal matches direct code/message/evidence. Session listing retains all four failures as unserved entries rather than absence.

## Boundaries

Fixture installation, interrupted-outcome removal, invalid-record commitment, and initial service recovery precede capture. The malformed hypothesis emits the existing closed-iteration-scratch cleanup warning once per open; it is explicitly bounded, not globally silenced. Reopening reports no interruptions/rematerializations for this terminal matrix. Only lock replacement is excluded from the pre/post *service reopening* comparison. Repeated queries before and after reopening compare every retained file's bytes, identity, mtime and size, including event logs, with no query exclusions; external effect counters stay zero. No production recovery behavior or decoder was changed.

## Verification

Named six-file Vitest run: 6 files / 11 tests passed, including new compatibility, existing consumer/paging/session integration and child committed/session-reading regressions. `npm run type-check` passed. `npm run check:self` passed with partial coverage: 0 errors, 0 warnings, 455 analysis limits (not complete companion verification).

Exact prepared focused Cucumber command for wi-001.i04, configuration SHA-256 `0c5ffba1fd31ac104b7e9ec975aa8c076a91f5e79d2c694eee405a85c738ce0a`: 14 scenarios, 4 passed (sc-001 through sc-004), 10 undefined; 116 steps, 63 passed, 53 undefined; exit 1. Undefined cases are unassigned sc-005/sc-006/sc-007 examples/sc-008, not passing claims. Shell receipts 009/011/012 retain check output under the active job's invocation shell directory. Committed gate qualification is still required.

## Limits

This is a small compatibility matrix, not every historical durable version/policy, active-run interruption, damaged log, cache invalidation or recovery/rematerialization corpus. Child-focused terminal caching and public parent polling witnesses supply adjacent regressions, not exhaustive qualification. Supplied API view revision `rev/1:0e05c3d2-9e47-41db-931e-0647ee29bd66:47` has 1 ordinary and 26 testing coverage limits; missing entries cannot prove absence. No remaining progress/repair scenarios or final architecture acceptance are claimed.
