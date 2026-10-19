# Iteration 1: durable session persistence

Implemented against execution baseline `85ed836c5b0e410bdd1a7b759a5ca89f0d85cee4`
(source baseline `3cf06e52cbb2996a8d4db7a6f7cf9527dcd611ac`). This is the first
of six outcomes; committed-candidate RA assessment remains the coordinator's gate.
The [original baseline](../../../docs/analysis/2026-10-19-harness-decomposition/baseline.json)
and its collector are unchanged. [Input manifest](manifest.json) retains producer
versions, commands, byte counts and hashes; [after summary](after-summary.json)
authenticates the actual source inventory and compares the separate
[execution baseline](../evaluation/execution-baseline.json).

## Ownership and contracts

The real [session-store child](../../../subs/harness/subs/session-store/README.md)
owns the existing 406-line implementation, ledger reconstruction, immutable bodies
and payloads, detached reads, captured commits, atomic multi-record CAS, validation,
shared in-process writer domains and close/reopen behavior. Persisted names,
schemas, error identities and optional-context availability rules are preserved.
It makes no workflow-completion decisions. No compatibility forwarder remains at
the former `subs/harness/src/run/session-store.ts` path.

The agent still owns `SessionStore`, `SessionStoreCommit` and `SessionStoreRecord`.
The child's ordinary API exposes `openSessionStore`, `LedgerSessionStoreOptions`
and `LedgerSessionStore` to its parent. The harness re-exposes these to descendants
for the existing Pi native restoration witness. Its four production consumers are:

| Workflow | Actual consumer |
| --- | --- |
| Assistance | `subs/harness/src/assistance/runtime.ts` |
| Autonomous execution | `subs/harness/src/run/session-operations.ts` |
| Administration | `subs/harness/src/run/beads-storage.ts` |
| Qualification | `subs/harness/src/qualification/live-session.ts` |

All four import the child's actual implementation. The optional spike adapter and
all affected tests/mock declarations also use its new path. The parent retains
project lock acquisition and exposes `acquireSessionStoreLock` with only
`held()`/`release()` through `SessionStoreLock`. The child receives no lock record,
mutable run, service, scheduler or workflow map. This adapter uses the same
`acquireProjectLock`, lock path, liveness and release mechanism as before.

The ledger remains a sibling provider. Parent declarations re-expose the existing
open/atomic operations and their signature companions; `syncDirectory` is included
because cache tests wrap the actual atomic module. No general support framework
or new persistence mechanism was introduced.

## Tests and compatibility

Pure persistence cases from the former mixed `plan23-session-store.test.ts` now
live in the child, with the existing cache test and two opt-in stress files. The
mixed parent test retains actual agent/session-operation integration, crash and
reconstruction witnesses, and the `HarnessSessionOperations` append cases.
The directory-scoped memory adapter and its three workflow-contract tests also
moved to the child. Its two helper exports are exposed only from testing source
to the parent. The existing configured setup path stays in place and mocks the
new implementation path; ordinary workflows still execute real session logic
without bulk disk persistence. Stress files remain outside configured discovery.

A new exact registered native child witness opens two local adapters, verifies a
separate OS process is refused before and after the first adapter closes, proves
the second still reads, and then verifies a new process reopens unchanged durable
records after the final close. The existing lock holder/takeover/PID-reuse and Pi
process-restoration registrations and claims remain intact. The registry adds
one file and one owning case; no exemption, discovery narrowing or guard change.

The qualification timeout regression now uses controlled timers after observing
driver entry. Its previous 20 ms wall-clock race could expire before dispatch
under concurrent filesystem/check work. The assertion still proves timeout,
Stop/drainage, one admitted dispatch and unavailable stopped state; no production
timeout, retry, skip or requirement changed.

| Verification | Result |
| --- | --- |
| [Focused persistence/workflow/assistance/MCP/administrative/qualification tests](focused-tests.log) | 8 files, 125 tests passed |
| [Recovery/standalone/repair/context-loss/conversation regressions](consumer-regressions.log) | 6 files, 93 tests passed |
| [Native child exclusion, existing lock and Pi restoration](native-tests.log) | 3 files, 8 tests passed |
| [Type-check](type-check.log) | Passed all configured TypeScript projects |
| [check:self](check-self.log) | Passed; 17 owners, zero errors/denied accesses, partial coverage |
| [Configured discovery](discovery.json) | Four child test files in ordinary/native projects; two stress files absent |
| [Process receipts](process-receipts.json) | Final runs: 18 receipts, 17 files, zero refused launches; Pi includes its restoration process |
| [API and architect refresh](after-api.log) | Completed revision 6; 17 modules; 35 targets |

Relevant ordinary and testing requester catalogs were inspected after refresh:
the harness receives the real child's three ordinary symbols; only its testing
catalog receives the memory helper; both child catalogs receive the narrow lock
contract, agent contracts/errors and ledger APIs. The Pi testing catalog receives
the re-exposed real store. Catalog identities, sizes and metadata are retained
in the summary. Generated views are not edited or committed. Existing producer
inference/namespace/nonliteral/shared-global limits remain explicit; a successful
check is not a claim of complete dependency analysis. No full audit was run here;
RA performs configured committed-candidate qualification.

## Actual structural observations

These are actual owners measured with Ramify 0.5.2, rather than the proposal's
hypothetical allocation. Counts are bytes and owned files, not tokens or effort.

| Metric | Harness before | Harness after | New session-store child |
| --- | ---: | ---: | ---: |
| Production source files | 223 | 222 | 1 |
| Production source bytes | 3,490,588 | 3,468,530 | 22,661 |
| Production resource files / bytes | 39 / 194,999 | 39 / 194,999 | 0 / 0 |
| Testing source files / bytes | 424 / 5,542,743 | 419 / 5,475,547 | 7 / 71,227 |
| Documentation files / bytes | 2 / 143,601 | 2 / 144,190 | 2 / 1,433 |
| Ordinary API bytes | 220,310 | 220,941 | 306,687 |
| Testing API bytes | 223,871 | 224,733 | 320,766 |
| Cross-owner production file pairs consumed | 393 | 394 | 4 |
| Production external consumer files | 83 | 84 | 4 |

The child has four provider file dependencies across agent, ledger and the parent
lock owner; ten resolved imported original symbols and no unresolved selections
on these observed accesses. Its four production consumer files are all currently
harness-owned. Thirteen test-source consumers include helpers and stress files;
eleven touch more than one production owner. These are direct source imports,
not test execution counts or proof of independent tasks.

The child's ordinary catalog has 104 physical files; its testing catalog has
117. Existing ancestor exposures explain substantial unrelated available API
context. Both carry four truncation notes, and all project catalogs preserve their
coverage metadata. Extracting one source file did not reduce the parent's API
size. The mutual parent/child dependency is explicit: composition consumes the
store while the store consumes the existing lock adapter. This iteration resolves
the durable-store boundary; later workflow extractions still need their own
contracts. These observations do not establish better context delivery.

The original persistence probe selected all 16 test modules due partial coverage.
The new actual-owner persistence probe selects all 17, again with
`partial-coverage`. This establishes no audit-selection saving and justifies no
omitted check. Before/after producer outputs and the evolving-owner collector
are retained beside this result; no historical collector was repurposed.

## Operational observations and remaining work

[Before observations](before-observations.json) were captured before editing;
independent [availability analysis](../evaluation/observations-availability.json)
found no accepted comparable historical persistence task. Native token/cache and
exclusive active-effort accounting are unavailable. Focused qualification wall
intervals are in logs (3.33 s, 71.73 s and 3.73 s); they are neither exclusive
engineering time nor a valid before/after speed comparison. Engineering read the
plan, commitments, module guidance, production store/callers, testing setup and
requester catalogs, then integrated this boundary in one worker assignment.
Coordinator and RA work remain separate observations; no complete combined effort
estimate is claimed. Corrected local qualification failures are not hidden in a
productivity claim. Structural moves do not add delivered-work credit or change
the frozen search-space denominator.

No protected path changed: no principles/specifications, package/lockfile,
.gitignore, compiler/test/build configuration, ramify-agent.json or
ramify-audit.json edits. The native registry addition is the exact new witness
described above. There is no remaining implementation blocker for iteration 1.
RA must assess the committed candidate; later iterations and cumulative final-plan
acceptance remain outstanding.
