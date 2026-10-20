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
candidate commit. I1 accepted candidate `c1b7cb75206acff82bbaf3940f1e7d2b14f49c9a`.
Assessment `as-0007` completed `clear`, with no repairs, decisions or gaps.
Assessments `as-0001` through `as-0007` share the original I1 start/base.
End command `codex-host-i1-end-07`. Governing design is pinned to the original
baseline. Detailed review remains in RA; engineering evidence under `iteration-01/`.
Native `/root/provider_control_repair` is idle. `/root/codex_provider` owns I2.

Iteration 2 `it-6e074b47-5d55-43ca-86c7-412b2ea44f83` started
`2026-10-19T22:33:15.498Z`, base `c1b7cb75206acff82bbaf3940f1e7d2b14f49c9a`,
command `codex-host-i2-start-01`; dirty provenance is only these coordinator notes.
I2 substantive assessment `as-0009` is complete at
`8785a35e7d14610e4883a684714587a781a14934`; only exact protected service
specification authorization remains (`cf-0008`), intentionally held for final
approval. No other repairs, decisions or gaps. End command `codex-host-i2-end-02`.
Native host/CLI and bridge workers delivered evidence in `iteration-02/`; the
real disposable pilot reached clear iteration and final gates. The actual
900000ms HTTP witness passed. Original launch qualification limits remain explicit.

I3 `it-089cd173-032b-4ab1-86ce-b2ca09a541a4` started
`2026-10-20T00:32:03.369Z`, command `codex-host-i3-start-01`, base I2 candidate;
dirty provenance is only these notes. Preserve original registered baseline and job. Native
`/root/codex_provider` owns recovery, provider integration and end-to-end
qualification. I3 implementation is complete and the local candidate is ready for
submission. Engineering and focused verification are recorded in
[iteration-03/report.md](iteration-03/report.md): 191 focused tests in 13 files,
including 15 registered native cases, all TypeScript configurations and self-check
pass. The [disposable live recovery pilot](iteration-03/live-qualification/report.md)
completed clear iteration and final gates for exact pilot candidate
`a3469c87dabdb928d130fd39b28330acc507c133`, preserved its original job/baseline,
and confirmed settlement of all owned process identities. Exact cumulative service
specification authorization remains held for final approval (`cf-0008`). I3
implementation assessment and final cumulative assessment are separate and still
required; the coordinator will record their assessment IDs after submission.
