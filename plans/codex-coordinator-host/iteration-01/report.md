# Iteration 1: persistent Codex provider

Implemented the provider slice of the [plan](../plan.md) and
[governing design](../../../docs/architecture/agent-assistance/codex-coordinator-host.proposal.md).
Original baseline: `1a87d832b6890f0658e7024faed78487815b7823`.
Assisted job: `20261019T190943Z-7fd938`.
Iteration: `it-b5d1118a-52a5-49b1-a8a8-848d7c8fdb4a`.
The coordinator receives the candidate commit ID separately at handoff.

The new `agent/codex` owner adapts a dedicated stdio app-server. Its typed
contract covers initialization and process identity, equipment inspection,
persistent thread start/read/resume, idle input, pending requests and validated
responses, observations, parent interruption and local owned-process settlement.
Wire objects and decoding stay private. The agent parent exposes the factory
and signature companions; the harness re-exposes them to descendants. The
assistance owner consumes that actual exposure in `prepareCoordinatorProvider`.
No existing Pi session or assistance service contract changes.

Assistance verifies declared Astra/native-worker equipment, the selected worker
model and any required MCP tools. It verifies `ephemeral: false`, retains the
thread/process identity through its host callback, and checks loaded-thread
equipment before returning input authority. It preserves instructions and
permission policy by leaving their provider configuration untouched. Resume
verifies the exact supplied thread; it never silently creates a replacement.

Correlation preserves numeric versus string request identities. Timeouts and
lost replies distinguish unavailable reads from uncertain mutations. In-flight
or uncertain input cannot be replayed by another send or erased by a history
read. Pending identities include provider generation, occurrence and thread/turn.
Only offered approval choices and exact question identities are accepted.
Unsupported requests remain visible. Observer removal and observer exceptions
have no execution effect. Progress omits hidden reasoning and tool bodies;
completed conversation messages are not retained in another provider history.

The private Linux/Python supervisor uses `PR_SET_CHILD_SUBREAPER`, kernel start
identities and repeated ancestry inspection. Stop kills/reaps only its dedicated
local descendants, including double-forked commands in a separate session, and
confirms settlement only after `ECHILD` and supervisor closure. Provider exit
leaves supervision available. An observation timeout or failed supervisor remains
explicitly unconfirmed. Parent interrupt acknowledges only the parent request;
it never establishes worker settlement or assessment cancellation. External
services retain separate ownership.

## Verification

All commands ran at `/workspaces/worktrees/codex-coordinator-host`.

| Command | Outcome |
| --- | --- |
| `npm run test:quick -- subs/harness/subs/agent/subs/codex/src/tests/provider.test.ts subs/harness/subs/assistance/src/tests/coordinator-provider.test.ts` | 24 tests passed; both process-guard receipts have zero native/refused attempts. |
| `npm run test:boundaries -- subs/harness/subs/assistance/src/tests/coordinator-provider.boundary.test.ts` | Two exact registered native cases passed. |
| `npm run type-check` | Passed all four configured TypeScript projects. |
| `npm run check:self` | Passed; zero errors/warnings/denied accesses. Coverage remains partial with 781 reported analysis limits. |
| `node --import tsx plans/codex-coordinator-host/iteration-01/live-provider.mjs` | Passed the bounded installed-provider exercise described below. |

The ordinary cases cover out-of-order correlation, malformed frames and errors,
non-ephemeral verification, lost replies, concurrent history/submission races,
parent-versus-worker outcomes, offered policy amendments, response races and
stale identities, unsupported requests, exact question answers, file approvals,
interruption and explicit uncertain settlement. Assistance tests execute the
real protocol driver and consumer together, including missing equipment,
retention failure and supplied-thread resume.

The exact native boundary registration is additive in
[`src/tests/test-boundaries.json`](../../../src/tests/test-boundaries.json).
Its two cases establish actual subreaper adoption and settlement with an active
scripted provider and after that provider exits. They verify the orphan PID and
supervisor are gone, an unrelated process remains alive, and another dedicated
provider reads the same persistent fixture history. The scripted provider is
explicitly named and performs no inference. The
[process receipts](test-process-receipts.json) retain the selected cwd/time
windows and six native API observations; observations are not a child count.

[Verification logs](verification/) retain the focused commands, complete
compressed structural output, and refreshed ordinary/testing API and architect
views. Materialized views are generated and uncommitted. The assistance views
contain `createCodexProvider`, its signature companions, and test-only scripted
equipment in the testing view. `check:self` verifies the real imports and
exposures. [Source fingerprints](source-sha256.json) identify the delivered files.
No full audit or RA assessment was launched by this worker.

## Installed-provider qualification

[Retained live evidence](live-provider.json) records `codex-cli 0.161.0`,
Astra coordinator and native Sol worker identity/model/lineage from provider
history, completed shell work, scoped approval request/response identities,
persistent history before/after restart, and two confirmed settlements.
The parent turn is observed independently of the worker turn. A second app-server
resumes the same non-ephemeral coordinator and completes a history-only follow-up
that recalls the qualification token and worker model.

The disposable target contains only `AGENTS.md` and `qualification.txt`; the
exercise implements no feature; the fixture bytes are verified unchanged. Launch-time overrides
disable the explicitly identified global `ramify-agent` stdio entry for these
providers. The retained before/after SHA-256 values verify the global provider
configuration is unchanged. Unrelated MCP configuration remains inherited.
No shared daemon command is used.

This devcontainer's default sandbox could not initialize for shell execution.
The bounded test operator had explicit coordinator authorization to approve
once only `/usr/bin/zsh -lc 'cat qualification.txt'` in the exact disposable
cwd, separately for the parent and worker request. The provider's policy and
sandbox settings were preserved. This qualifies real approval decoding and
response delivery; it does not establish unattended shell execution under this
sandbox configuration. There is no approval automation in production code.

The native transport is qualified on Linux `6.8.0-85-generic`, Python `3.11.2`
and toolkit `0.5.2`. [Protocol provenance](protocol-qualification.json) records
the installed schema-generation command and relevant schema hashes. Local
installed schemas were inspected first, with
[official OpenAI App Server documentation](https://learn.chatgpt.com/docs/app-server)
used for protocol context. The adapter diagnoses actual missing equipment and
protocol failures rather than rejecting changed version strings.

## Remaining plan work

This iteration supplies a reusable assistance consumer, rather than the detached
operator host. Iterations 2 and 3 still own HTTP MCP/control, listener readiness,
project ownership and job admission, command receipts, bounded reconnect records,
CLI controls, supplied-registration skill handling and continuation policy.

Installed-provider file-change approval, structured user-input, active native
worker interruption/stop, disconnect survival and real RA assessment continuity
were not exercised here. File/user-input decoding and interruption were scripted;
local process settlement was exercised against native orphan processes. Terminal
versus Codex-tool detached launch conditions and HTTP MCP inheritance remain
separate host qualification obligations. These limitations do not imply final
plan acceptance.

No existing specification, principles document, package pin or guarded runtime
configuration was edited. The only configuration change is the explicitly
required exact native test-boundary entry. No push or tracker synchronization
was performed.
