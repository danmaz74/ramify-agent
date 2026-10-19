# Coordinator host execution

Target: `/workspaces/worktrees/codex-coordinator-host`, branch
`feat/codex-coordinator-host`. Original checkout and its live MCP owner remain
untouched. The decomposition prerequisite uses its recorded user-authorized native
completion, whole-plan review and passing audit; historical RA gates are unchanged.

Plan `codex-coordinator-host`, assisted job `20261019T190943Z-7fd938`.
Original registered baseline: `1a87d832b6890f0658e7024faed78487815b7823`.
Registration command: `codex-host-register-20261019-01`. Protection has no setup
gaps. Captured plan and governing design are committed at that baseline.

RA uses the official MCP client bridge at
`/tmp/codex-coordinator-host-mcp/bridge.mjs`, socket
`/tmp/codex-coordinator-host-mcp/socket`, helper
`/tmp/codex-coordinator-host-mcp/call.py`. The implementation at
`/workspaces/ramify-agent` serves this isolated target with Pi
`openai/gpt-6-astra:high`. This is the ordinary assisted MCP service, not an
autonomous harness run. Send MCP requests as JSON on the helper's stdin.

Iteration 1: `it-b5d1118a-52a5-49b1-a8a8-848d7c8fdb4a`, started
`2026-10-19T19:09:54.466Z`, clean base equal to the registered baseline.
Start command `codex-host-i1-start-01`. Focus
`subs/harness/subs/agent/subs/codex`. Active native Sol worker
`/root/codex_provider` implements provider, consumer contract, verification and
candidate commit. No assessment submitted yet. Next: submit the committed
iteration with the governing design pinned to the original baseline.

Iteration 2 follows the provider assessment and delivers the detached host,
shared HTTP MCP, controls and supplied-registration skill handling. Iteration 3
completes recovery and cumulative qualification. Preserve the original baseline
and reuse iteration IDs for repairs. Final cumulative assessment is separate.
