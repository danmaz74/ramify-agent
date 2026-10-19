# Iteration 1 repair: terminal identity at correlated frame dispatch

Repairs `cf-0007` from assessment `as-0006` of candidate
`31b70c2e655841e6394a634fd21a92fbbfe88ea4`. This remains iteration
`it-b5d1118a-52a5-49b1-a8a8-848d7c8fdb4a` of job
`20261019T190943Z-7fd938`. The preceding assessment records `cf-0006`
resolved and the composed audit passing. Earlier reports retain their original
provenance and qualification limits.

A correlated `turn/start` result now decodes its turn at response-frame dispatch.
An explicit terminal result immediately enters the same exact-identity terminal
reconciliation used by notifications. Later same-ID start notifications therefore
receive the recorded terminal outcome before they can install active control or
replace a different live identity. Admission remains reserved until the send
continuation verifies its generation and returns its outcome. Running replies
retain the existing revision fence and uncertainty rules.

Publishing terminal proof at dispatch also preserves a different turn started
between the terminal reply and a stale same-ID start. Clearing the stale identity
only in the later send continuation would lose that different identity. Later
status-only activity, provider errors and unloaded status retain their existing
authority. Invalid turn results reject the correlated operation as uncertain;
they publish no terminal proof and leave observation/control of the connection
available.

The actual `prepareCoordinatorProvider` consumer reproduces the reported batch:
terminal reply, same-ID start and optionally a following idle notification. Both
cases assert the returned completed outcome, stale interruption rejection without
a wire interrupt, idle projection from empty history and successful follow-up
input. The reproduction was run before the production edit; both cases failed
because interruption of the completed identity was accepted. Its compressed log
retains that expected failing baseline separately from final verification.

Additional ordinary cases cover a different live identity surviving the stale
start and later idle, status-only activity retaining busy control, a newer provider
error surviving a failed turn result and stale start, and malformed terminal data
retaining uncertainty without publishing terminal proof. The opt-in ordering
probe adds 108 traces: completed/interrupted/failed terminal results, interleaved
continuations and single dispatch batches, all six reply/start/idle permutations,
and twelve selected independent-identity/status sequences. The existing 1,680
admission-ordering traces and 64 status/outcome/history traces remain intact.

| Verification from the isolated project root | Result |
| --- | --- |
| Focused ordinary provider and assistance consumer tests | 91 passed in two files; zero native/refused process attempts. |
| Opt-in ordering and status probes | Four tests passed in two files: 1,852 total traces, including 108 added terminal-reply traces; zero native/refused process attempts. |
| Exact registered native coordinator-provider witnesses | Both passed; six native API observations, zero refused attempts. |
| `npm run type-check` | All four configured TypeScript projects passed. |
| `npm run check:self` | Passed; zero errors, warnings or denied accesses. Coverage remains partial with 781 analysis limits. |
| `git diff --check` | Passed. |

[Commands and compressed logs](verification/), [exact final-run process
receipts](test-process-receipts.json) and [source fingerprints](source-sha256.json)
retain the evidence. Receipts select the exact isolated root and absolute test
paths: final ordinary tests began at 22:11:30 UTC, ordering and native tests at
22:11:38 UTC, on 2026-10-19. The failing reproduction began at 22:09:13 UTC.
These finite scripts establish the tested adapter ordering behavior; they do not
measure the frequency of an ordering in the installed CLI.

The production change stays within provider protocol handling. Tests also touch
the actual assistance consumer. Public interfaces, declarations, protected
contracts, audit configuration and permissions require no changes. No broad
review, full audit or live provider exercise was run. The coordinator retains
reassessment, the original live-provider qualification limits and future I2/I3
obligations. Its uncommitted execution notes remain outside this repair commit.
