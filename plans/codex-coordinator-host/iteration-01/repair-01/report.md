# Iteration 1 repair: history races and response settlement

Repairs `cf-0001` and `cf-0002` from assessment `as-0001` of candidate
`6369acc5883e842c8ca4e412ab6972d74676eff7`. This remains iteration
`it-b5d1118a-52a5-49b1-a8a8-848d7c8fdb4a` of job
`20261019T190943Z-7fd938`. The [original qualification](../report.md) remains
historical evidence; this report and its artifacts describe the repair.

`readThread` captures the thread observation revision before requesting history.
A delayed snapshot cannot replace a newer adopted observation. Once input
admission or live turn/status events establish control state, historical reads
remain inspection and cannot revoke that authority. They cannot erase an active
turn, resurrect a completed turn, remove uncertain admission, or replace the
current interruption target. Explicit thread start/resume still establishes
runtime state through its existing operations.

Response writes now have independent bounded delivery waiters. Provider failure,
stop, delivery timeout and write rejection settle the caller as `uncertain`.
Failure clears the waiter and its timer while preserving the request reservation.
Late write completion cannot emit a resolved observation, reopen the request or
allow another delivery. No public interface, process supervisor, permission policy
or protected document changes.

Regressions exercise delayed idle snapshots both before admission and after its
acknowledgement; stale active snapshots before and after completion; an old
snapshot arriving after a replacement turn starts; out-of-order observations;
and blocked response writes followed by exit, stop, timeout or write failure.
The response cases check rejection, retained reservation, one actual write and
no late resolved event.

| Verification from the project root | Result |
| --- | --- |
| Focused ordinary provider and assistance consumer tests | 34 passed in two files; zero native/refused process attempts. |
| Exact registered native coordinator-provider boundary tests | Two passed; six native API observations, zero refused attempts. |
| `npm run type-check` | All four configured TypeScript projects passed. |
| `npm run check:self` | Passed; zero errors, warnings or denied accesses. Coverage remains partial with 781 analysis limits. |
| `git diff --check` on the repair | Passed. |

[Compressed command logs](verification/), [selected process receipts](test-process-receipts.json)
and [changed-source fingerprints](source-sha256.json) retain the focused evidence.
The native process implementation is unchanged; its witnesses verify the repaired
adapter through the real assistance consumer. The installed-provider exercise
was not repeated because these deterministic race/failure repairs introduce no
new provider protocol or process behavior. The original live limitations remain.
No full audit, new iteration, I2 feature work or independent assessment was run.
The coordinator owns reassessment and its existing execution notes.
