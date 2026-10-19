# Iteration 1 repair: consistent snapshot adoption

Repairs `cf-0003` from assessment `as-0002` of candidate
`ebcc95b93f6e4f5bb255bf169d8fe43e517e0926`. This remains iteration
`it-b5d1118a-52a5-49b1-a8a8-848d7c8fdb4a` of job
`20261019T190943Z-7fd938`. The [previous repair](../repair-01/report.md)
and [original qualification](../report.md) retain their historical provenance.
This report supersedes the previous repair's description of snapshot adoption.

Start, resume and read now capture an observation basis before their RPC. Each
thread's status and active identity retain their own observation revisions.
Notifications create control state even before a verified session exists; only
successful identity/persistence validation adopts it for input or interruption.
An older snapshot cannot replace a field observed after its basis. Returned
sessions/history include the reconciled status and any known terminal outcome,
so assistance retention sees the same current state as input admission.

The authority rules are applied consistently:

| Transition | Result |
| --- | --- |
| Snapshot alone establishes active or idle state | A fresh snapshot can refresh it; an older concurrent snapshot cannot. |
| Live turn starts or input is acknowledged | Retain its exact identity against arbitrary empty/idle or older-turn history. A fresh snapshot proving that same identity terminal can finish it. |
| Live turn completes | Remember its terminal identity/outcome; older in-progress snapshots or duplicate start observations cannot resurrect it. Completion of another turn cannot clear the current identity. |
| Live idle status arrives | Clear the interruption identity and retain idle authority. Retire the known/superseded identity without inventing a terminal turn status. Corroborating history cannot demote this authority. |
| Active status arrives before initial adoption | Retain its value while permitting the corresponding snapshot to supply a previously unknown active identity. A known identity remains protected by the live active status. |
| Input is awaiting acknowledgement or its outcome is uncertain | History/session snapshots cannot alter the reservation or prove rejection. Concurrent input remains blocked. |
| Input acknowledgement follows newer notifications | Reconcile against its admission basis and terminal/retired identities; do not overwrite a newer completion, idle status or different current turn. |
| Submission is explicitly rejected | Roll back only the unchanged admission fields and advance their revisions; preserve newer observations and reject older concurrent history. |

Terminal retention stores identity/outcome facts and the latest projected turn,
not another conversation history. Idle alone does not manufacture a completion
message or outcome. No new public contract, permission override, supervisor
protocol, protected document/configuration or I2 feature changes. The bounded
response-delivery repair from `cf-0002` remains unchanged.

The real `prepareCoordinatorProvider` consumer is covered for start and resume:
a session reply, completion notification and idle notification are dispatched
synchronously before the promise continuation. Retention observes idle/completed,
a fresh read remains idle, interruption of the completed identity emits no RPC,
and follow-up input succeeds. Companion consumer cases dispatch an idle reply
then a new running turn; input stays busy and only that new identity can be
interrupted. These scripts execute the actual provider driver and consumer, not
a mocked provider API. They qualify supported ordering, not its frequency in
the installed CLI.

Additional regressions cover completion before a session reply; fresh idle
correction of snapshot-only active resume; exact terminal proof against a live
turn; status-only adoption and history; notifications without verified adoption;
resume during uncertain input; batched read/resume and new-turn notifications;
acknowledgement/completion/idle; an old completion against a new turn; explicit
rejection followed by newer notifications or late history; and live idle with no
known identity. Earlier history-race and response-settlement regressions remain.

| Verification from the project root | Result |
| --- | --- |
| Focused ordinary provider and assistance tests | 55 passed in two files; zero native or refused process attempts. |
| Exact registered native coordinator-provider boundary tests | Two passed; six native API observations, zero refused attempts. |
| `npm run type-check` | All four configured TypeScript projects passed. |
| `npm run check:self` | Passed; zero errors, warnings or denied accesses. Coverage remains partial with 781 analysis limits. |
| `git diff --check` | Passed. |

[Compressed logs](verification/), [exact-run process receipts](test-process-receipts.json)
and [changed-source fingerprints](source-sha256.json) retain this verification.
The selected receipts are for the exact isolated project root and absolute test
files, starting at 20:32:19 UTC on 2026-10-19. The unchanged native witness still
checks provider-exit and active-process descendant settlement, unrelated process
survival and persistent history through assistance preparation.

No full audit, separate review or new installed-provider exercise was run.
Protocol/process behavior is unchanged; the bounded installed Astra/Sol exercise
and its limitations remain the original historical qualification. This repair
does not qualify live file/user-input requests, stopping an active native worker,
or future host/HTTP/disconnect behavior. The coordinator owns reassessment and
execution notes, which were preserved outside this repair's staged files.
