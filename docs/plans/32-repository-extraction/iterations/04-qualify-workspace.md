# Iteration 4: qualify persistence and the extracted agent candidate

[Plan](../main-plan.md) · [Acceptance](../acceptance.md)

## Prerequisites and owners

Iteration 3 committed and its real test container usable. Owner: qualification
receipts, disposable persistence/isolation witnesses and any extraction-induced
fix within earlier iteration boundaries. Container recreation targets only the
test environment; retain the original developer container and active jobs.

## Goal

Prove source persistence and runtime isolation, then qualify the exact clean
extracted agent candidate through its complete configured audit.

## Read first

- Main plan: verification/completion and workspace/history contracts.
- Iterations 1–3 receipts and the actual Compose mounts.
- Agent `docs/testing.spec.md`, `ramify-audit.json`, current provider pins,
  affected prompt tests and project-declared native witnesses.

## Deliverables

- Before/after receipt for recreation with a local branch/commit, staged and
  unstaged source edits, an untracked authored file, a linked worktree and an
  evidence artifact. Retain file/HEAD/index identities and real worktree Git
  operations proving common-directory availability after recreation.
- Independent source-isolation witness: temporarily hide/move companion sources
  in the disposable environment and exercise installed CLI/default architect
  package behavior. Do not modify real companion checkout locations.
- Execute the exact clean extracted candidate's audit from its root:

  ```sh
  node_modules/.bin/ramify-audit audit --cwd . --full --nested --json
  ```

- Retain container/bootstrap configuration and shell checks alongside project
  audit outcomes. If a fix changes candidate runtime/configuration content,
  commit it and rerun affected witnesses plus final candidate qualification.
- Write `04-results.md` naming candidate, pins, host/container/tool identities,
  cases, full audit evidence and explicit skips/limits. A receipt-only follow-up
  commit must name the implementation candidate it qualifies.

## Verification

Own E17–E20. Use actual Docker recreation and real filesystem/Git operations
for persistence. Use installed packages with companions absent for isolation.
Do not substitute scripted tests for these native claims or run a direct whole
suite. Preserve all configured regression projects and report failed/unrun cases.

## Exit and handoff

Persistence/isolation witnesses and the clean agent audit pass. Hand iteration 5
the exact publishable candidate, qualified tool/configuration versions, source
archive and recorded remote target. Publication is not claimed by this iteration.
