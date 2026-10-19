# Iteration 1 repair: provider status independent of admission

Repairs `cf-0006` from assessment `as-0005` of candidate
`b658cbcc2d4e3c256e256e07b3f2b3eefed57536`. That assessment reported its audit
passed and resolved `cf-0004` and `cf-0005`. This remains iteration
`it-b5d1118a-52a5-49b1-a8a8-848d7c8fdb4a` of job
`20261019T190943Z-7fd938`. Earlier reports retain historical provenance;
this report supersedes [repair 03](../repair-03/report.md)'s rule discarding
thread-status observations during admission. The [original installed-provider
qualification](../report.md) was not repeated.

Every provider status observation is retained independently of an admitted input.
Effective control derives from provider status, the admission reservation, exact
live identity and any activity that has not yet identified its turn. Explicit
RPC rejection releases only that request's reservation. Newer active, error or
unloaded observations remain authoritative; empty/stale history cannot erase
them. Idle can update provider status without claiming an unknown request or
known live turn has finished.

An active status with no turn identity remains conservative busy evidence until
an authoritative idle or a causally newer identity identifies the activity. A
start notification identifies activity directly; a fresh active history read
can identify its running turn. Terminal history for an older identity does not
identify newer activity. A reply can identify observations preceding its frame,
so the driver records its observation revision synchronously at correlated frame
dispatch, before asynchronous continuations run. This preserves later active or
unavailable observations when a reply and notifications arrive in one batch.

| Transition | Result |
| --- | --- |
| Idle -> admission -> status active -> explicit rejection | Retain active, release only admission, refuse another input without emitting another `turn/start`. Fresh active or empty-idle history cannot erase unidentified activity. |
| Error/unloaded during rejected or uncertain admission | Preserve the observation and explicit request outcome. Idle history alone cannot claim provider recovery or rejection of an uncertain request. |
| Status followed by successful start reply | Its exact identity can identify preceding activity; the live turn stays busy and interruptible until matching terminal evidence. |
| Successful reply followed by a status in the same dispatch batch | Retain the newer status. Idle alone cannot finish acknowledged live work; later active/unavailable evidence survives the promise continuation. |
| Terminal reply followed by status-only active | The submitted turn is complete, but newer unidentified activity stays busy until authoritative idle or identity evidence. |
| Old known turn completes after status-only activity | Record its own terminal outcome; do not attribute newer unidentified work to that old identity. |
| Exact matching terminal proof while provider error remains | Settle that turn without claiming provider recovery. Authoritative idle or an actual new start can restore usable control. |
| A different turn starts and finishes after a running reply frame | Keep the acknowledged request uncertain unless its own terminal proof is available; a different identity's completion cannot prove its outcome. |

The actual `prepareCoordinatorProvider` regression reproduces idle, input,
status-only active and RPC rejection. Both fresh active history and empty idle
history retain active control and refuse a second input. Active history can
supply interruption identity; authoritative idle then permits follow-up input.
The earlier start/resume adoption, exact-identity admission, response-delivery,
uncertainty and native settlement regressions remain.

Small ordinary regressions cover rejection, running/terminal success, unknown
acceptance, unavailable status, recovery and identity binding. The separate
`provider-status.stress.ts` probe covers all 64 combinations of four request
outcomes, four provider statuses, observation before/after reply (or timeout),
and active/idle history. Its expected public results are a declarative table;
it does not inspect internal fields. Both exhaustive probes retain the process
guard and remain outside ordinary/audit discovery as required by
[the testing contract](../../../../docs/testing.spec.md).

| Verification from the isolated project root | Result |
| --- | --- |
| Focused ordinary provider and assistance tests | 85 passed in two files; zero native/refused process attempts. |
| Opt-in ordering and status probes | Three tests passed in two files: 1,680 ordering sequences plus 64 outcome/status/history traces; zero native/refused process attempts. |
| Exact registered native coordinator-provider witnesses | Both passed; six native API observations, zero refused attempts. |
| `npm run type-check` | All four configured TypeScript projects passed. |
| `npm run check:self` | Passed; zero errors, warnings or denied accesses. Coverage remains partial with 781 analysis limits. |
| `git diff --check` | Passed. |

[Commands and compressed logs](verification/), [exact process receipts](test-process-receipts.json)
and [source fingerprints](source-sha256.json) retain this repair's evidence.
Receipts select the exact isolated root and absolute test paths. Ordinary and
stress runs began at 21:39:01 UTC; the native run began at 21:39:20 UTC, all on
2026-10-19. These finite scripts qualify adapter behavior and supported dispatch
ordering, not the frequency of any ordering in the installed CLI.

No public interface, provider wire field, supervisor protocol, permission,
protected contract/configuration or I2 feature changes. No broad review, full
audit or new live exercise was run. Live file/user-input requests, stopping an
active native worker and future host/HTTP/disconnect behavior retain their
original qualification limits. The coordinator owns reassessment and its dirty
execution notes, which remain outside this repair commit.
