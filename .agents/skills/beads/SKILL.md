---
name: beads
description: Record, inspect or resolve deferred issues in ramify-agent itself. Keep plan execution in harness records; optional target-project issue administration is performed by separate configured harness sessions.
---

# Deferred ramify-agent issues

Follow the [repository scope](../../../AGENTS.md#deferred-ramify-agent-issues).
Use this skill for issues in ramify-agent itself that are left for resolution
outside a plan. A plan's assignments, progress and acceptance remain in the
harness's own records.

The optional `beads` setting in a target project's `ramify-agent.json` enables
separate administrative harness sessions for related existing issues at plan
start and finish. Their tracker workspace is explicitly configured and captured
for the run. Ordinary implementation roles receive no Beads tools or workflow
guidance. Those administrative sessions do not create issues, synchronize
trackers, or determine execution or acceptance. This skill does not replace
that lifecycle or authorize ad hoc updates to another project's tracker.

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
