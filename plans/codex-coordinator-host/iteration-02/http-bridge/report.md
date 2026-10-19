# HTTP bridge engineering evidence

Date: 2026-10-19. Worktree: `/workspaces/worktrees/codex-coordinator-host`.
Runtime: Node `v22.23.3`; installed official MCP client/server `2.3.1`.

The assistance owner now has `nodeFetchHandler`, which consumes a Node request
body through one Fetch stream and forwards response status, headers, separate
cookies and streamed bytes. It flushes headers before reading response events,
waits for Node's drain notification before the next Fetch read, and cancels the
response reader when an unfinished response or incomplete request disconnects.
Normal completed request closure preserves the observation signal. A failed
response stream closes the socket without scheduling an unhandled response error.
The bridge owns no assistance service or MCP framing.

`configureLongWaitHttpServer` disables the body-receiving request deadline, retains
a 60-second header-receiving deadline, and sets socket inactivity and keepalive
deadlines to 960,000 ms. The host worker composes this helper with its listener.
The native witness uses a 950,000 ms client tool deadline above the service's
900,000 ms observation interval.

## Verification

| Command | Result |
| --- | --- |
| `npm run test:quick -- subs/harness/subs/assistance/src/tests/http-bridge.test.ts` | Six controlled cases pass; [retained output](ordinary.log). |
| `npm run test:boundaries -- subs/harness/subs/assistance/src/tests/http-bridge.boundary.test.ts` | The two-case witness version passes in 901.05 seconds, with 900.41 seconds in tests; [retained output](native-long-wait.log). |
| `npm run test:boundaries -- subs/harness/subs/assistance/src/tests/http-bridge.boundary.test.ts -t 'native HTTP'` | Three short native cases pass; [retained output](native-short.log). The filter leaves the already-exercised long case unselected. |
| `node_modules/.bin/tsc --noEmit --pretty false` | Passes after the bridge error-path repair. |
| `npm run check:self` | Passes: zero errors, zero warnings, 781 analysis limits; partial coverage. |

The long witness runs the actual `AssistanceService`, existing MCP registration,
official SDK client and server transports, and native loopback HTTP. External
Git, protection and assessor answers are explicitly scripted. It starts real
held assessment work, disconnects the first observing client, reconnects through
a second SDK connection and explicitly cancels that observation, then reconnects
through a third SDK connection. Both abandoned observation signals abort while
the assessor's work signal remains active. The third call requests 900,000 ms,
asserts actual monotonic elapsed time is at least 900,000 ms, and receives
`status: running, reason: timeout`. Releasing the scripted assessor then produces
a completed assessment through the same service. Client closure never closes the
shared service or cancels assessment work.

The long process started at 22:37:53 UTC and completed successfully. Its loaded
test file had the streaming/disconnect case and long-wait case. While it ran,
two additional short native cases established actual Node backpressure/drain
ordering and failed-stream socket behavior; those pass against the final source
in the separate short run. The later production repair only changes the
already-failed response-stream branch, which the long wait does not use. The
final registered file contains all four cases, without skipped cases in source.
The coordinator's candidate assessment runs the complete configured projects.

## Registry changes and integration

The bridge native file has an exact entry in
[`src/tests/test-boundaries.json`](../../../../src/tests/test-boundaries.json).
At the host worker's request, the same registry edit adds its exact
`coordinator-host.boundary.test.ts` and `coordinator-launch.boundary.test.ts`
entries. Those entries cover actual listener/authentication and ownership races,
SDK disconnection, detached CLI survival, reconnect and native descendant
settlement. Their external/provider answers remain scripted. The host worker
owns their implementation and results.

Bridge implementation and initial tests are committed as `0e3ad1ff`. The
follow-up includes the stream-error repair, extra native case, registry additions
and this evidence. No specification or runner configuration was edited for the
bridge. Root facade and host/MCP/service integration belong to the host worker;
this evidence does not substitute for the live-model pilot or independent
candidate assessment.
