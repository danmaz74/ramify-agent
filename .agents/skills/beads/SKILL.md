---
name: beads
description: Record, inspect or resolve deferred issues in ramify-agent itself that are left for work outside a plan. Use only for that issue backlog, not plan execution, general task tracking, project memory or target-project issues.
---

# Deferred ramify-agent issues

Follow the [repository scope](../../../AGENTS.md#deferred-ramify-agent-issues).
Use Beads only for issues in ramify-agent itself that are left for resolution
outside a plan. A plan's assignments, progress and acceptance remain in the
harness's own records.

## Inspect and record an issue

Use the `bd` CLI on demand. Identify the existing workspace with `bd where`,
then search for an existing issue with `bd search` and inspect it with `bd show`
before creating or changing a record. Prefer `--json` for structured output.

When filing a deferred issue, record the observed harness problem, supporting
evidence and why it remains outside the plan. A target-project failure alone
is not evidence of a ramify-agent defect. Use `bd create` for a new issue or
`bd update` for an existing one; preserve prior evidence.

When taking up a deferred issue, use `bd update <id> --claim`. Close it with
`bd close <id> --reason=...` only when its resolution is verified. Moving the
issue into a plan does not establish that it is fixed.

Use supported CLI operations rather than editing database or passive-export
files. Do not run `bd edit`, which opens an interactive editor. Git commits,
pushes and tracker synchronization retain their separate authorization.
