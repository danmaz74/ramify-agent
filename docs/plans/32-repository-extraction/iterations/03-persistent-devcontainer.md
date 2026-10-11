# Iteration 3: implement the persistent three-repository devcontainer

[Plan](../main-plan.md) · [Acceptance](../acceptance.md)

## Prerequisites and owners

Iteration 2 committed. Owner: agent `.devcontainer/`,
`development.code-workspace` and development instructions. Use disposable
companions for destructive/error witnesses; real companion dirty work is
preserved. Choose host paths, credential mounts and pinned CLI versions before
building; record them without storing secrets.

## Goal

Opening the agent repository provides one usable environment with independently
editable, persistently stored companion repositories.

## Read first

- Main plan: layout, bootstrap, lifecycle and runtime contracts.
- Iterations 1/2 receipts and the reviewed two companion commit IDs.
- Existing toolkit `.devcontainer/` as adaptation input, not as a runtime
  prerequisite; preserve user changes there.
- Each selected companion's committed setup instructions, manifest and audit;
  Dev Container/Docker/VS Code references linked from the main plan.

## Deliverables

- Agent-owned Dockerfile/Compose/devcontainer files with the parent bind mount,
  scoped dependency volumes, narrow build context, Node 22/non-root user,
  Chromium, PID reaping and documented shutdown/restart behavior.
- Fixed two-entry `companion-repos.json`, creation setup and read-only status
  scripts. Missing repos clone at reviewed commits onto editable development
  branches; existing repos remain on their current branches with source intact.
- Refuse wrong/non-Git existing directories before installation. Clone/install
  failures are explicit and retries preserve authored work. No automatic updates,
  resets, cleans, npm links, source aliases or full test-suite setup hooks.
- Persistent credentials/agent/Pi state through documented local mounts;
  lightweight startup checks and pinned CLI versions. Keep toolkit Studio
  configuration in the toolkit. Add editor folders and usable agent/web ports.
- Document first creation, explicit preparation after lockfile changes, startup,
  status, ordinary commands and volume ownership. Write `03-results.md`.

## Verification

Own E10–E16. Check shell syntax and rendered Compose/devcontainer/workspace
configuration. Build/start a real test container with a dedicated host parent.
Exercise missing, existing clean, existing dirty, changed-default, wrong-remote,
non-Git and failed-clone/install cases; retain commands and before/after state.
Re-run setup and reconnect; verify no checkout/CLI update or dependency install
on startup. Exercise development commands, browser tooling and editor closure.
Do not perform a machine reboot just to test an opt-in restart configuration;
report the level of restart evidence actually collected.

## Exit and handoff

All bootstrap/lifecycle cases pass with usable independent checkouts. Hand off
the committed configuration, exact tool/provider identities, persistent test
workspace, mount/port choices and case receipts to iteration 4.
