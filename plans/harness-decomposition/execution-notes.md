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
- Candidate: `ed9a61330fa6e3f7d72d34197e7fb840beffc13c`.
- Current assessment: `as-0003`, linked to `as-0002` (audit/protection passed; review exceeded its configured deadline); awaiting compact result.
- Local verification: 218 ordinary tests, 8 native cases, TypeScript and Ramify structural checks passed. No protected changes reported.

Follow the six ordered outcomes in the captured plan. The implementation worker owns cross-owner integration; the coordinator submits each candidate and observes RA. Independent evaluation does not authorize a dependent extraction before the current gate. Next: retrieve the completed compact result for `as-0003`; repair within the same iteration if required, otherwise start iteration 2 assistance extraction. Worker `/root/session_store` is available for related outcomes; evaluation worker completed its baseline artifacts.

Assessor startup now explicitly selects `openai/gpt-6-astra:high`; offline readiness verifies preservation capabilities. Same stable code, target, execution and original baseline retained.

The stable runtime now receives `timeoutMs: 1800000` through `/tmp/harness-decomposition-mcp/assessor-30min.mjs`, using unchanged service/runtime/MCP composition and shutdown order. Observer waits remain 15 minutes. No assessment was cancelled or accepted on elapsed time.

Iteration 2 read-only reconnaissance identified a cohesive move of all 13 assistance files and 12 related tests. Candidate concern binding, reconciliation core, review scheduling and generic finding transactions need separation from autonomous wrappers. Shared job/command/lock/audit-workspace mechanisms retain explicit support ownership. No protected configuration change is currently expected. No iteration 2 source edits have begun.

## User correction: review has no elapsed-time cancellation

The user rejected fixed review time limits on 2026-10-19: “there should be no such thing.” Remove review execution deadlines rather than increasing them. Observation waits remain bounded and do not cancel work; explicit cancellation and genuine failures remain meaningful.

- Corrective iteration: `it-4e134ddb-6972-4282-9fa2-b15b0bab201a`.
- Started: `2026-10-19T07:36:25.002Z` (UTC).
- Base: `ed9a61330fa6e3f7d72d34197e7fb840beffc13c`; dirty provenance reflects coordinator execution-note changes only.
- Worker: `/root/session_store`; assistance extraction has not begun.
- The already-running `as-0003` remains untouched while the source correction is prepared. The temporary 30-minute bootstrap is superseded by this user requirement and must be retired when the corrected assessor is qualified.
