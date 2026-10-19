# Harness decomposition execution notes

## Execution identity

- Target: `/workspaces/worktrees/harness-decomposition`, branch `refactor/harness-decomposition`.
- Source and immutable proposal baseline: `3cf06e52cbb2996a8d4db7a6f7cf9527dcd611ac`.
- Registered execution/protection baseline: `85ed836c5b0e410bdd1a7b759a5ca89f0d85cee4`. Its only differences from the source baseline are the captured plan, proposal, baseline JSON and historical collector; production source is unchanged.
- Plan: `harness-decomposition`; job: `20261019T065548Z-f298d1`.
- Captured plan SHA-256: `f82acb9c349018ceeb4a278a4b472a87dc0d370680e4919f14c6fc553baae4df`.
- Registration protection has no gaps. Default guarded configuration and principle/specification selection apply.
- Stable assessor: `/workspaces/worktrees/passive-waiting` at source baseline, with recorded passing audit `refs/audited/runs/2026-10-19T05-51-00Z-3cf06e52c`.

## Transport and continuation

Native RA tools were not exposed to this session. A persistent official SDK MCP client connects to the stable assessor over stdio, targeting the implementation worktree. Its local adapter is `/tmp/harness-decomposition-mcp/bridge.mjs`; requests use `/tmp/harness-decomposition-mcp/call.py` with a JSON MCP tool request on stdin. The Unix socket is `/tmp/harness-decomposition-mcp/socket`. This adapter forwards actual MCP operations; RA retains its ordinary durable records. Preserve the single live owner of this target. The existing MCP process targeting the original repository remains separate and untouched.

On reconnect, call `plan_executions` and `job_detail` for these IDs. Recover assessments through RA, never edit its durable records. If the temporary adapter is lost, reconnect an official client to the same stable assessor and target after confirming project ownership. Do not start a new execution to reset evidence.

## Active outcome

Iteration 1: shared durable session persistence and all real consumers.

- Iteration: `it-9b118795-62fe-4210-ae0f-d3cc5b087e82`.
- Started: `2026-10-19T06:56:02.597Z` (UTC).
- Base: `85ed836c5b0e410bdd1a7b759a5ca89f0d85cee4`; clean observed start, captured from HEAD.
- Focus: `subs/harness/subs/session-store`.
- Native Sol implementation worker: `/root/session_store`.
- Independent Sol evaluation worker: `/root/evaluation`, restricted to comparison evidence under `evaluation/`.
- Candidate: `7e399e6b13ada2214b41a82c6eddfb03636da953`.
- Submitted assessment: `as-0001`; awaiting completed compact result.
- Local verification: 218 ordinary tests, 8 native cases, TypeScript and Ramify structural checks passed. No protected changes reported.

Follow the six ordered outcomes in the captured plan. The implementation worker owns cross-owner integration; the coordinator submits each candidate and observes RA. Independent evaluation does not authorize a dependent extraction before the current gate. Next: retrieve the completed compact result for `as-0001`; repair within the same iteration if required, otherwise start iteration 2 assistance extraction. Worker `/root/session_store` is available for related outcomes; evaluation worker completed its baseline artifacts.
