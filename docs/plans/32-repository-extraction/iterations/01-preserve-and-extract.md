# Iteration 1: preserve work and extract history

[Plan](../main-plan.md) · [Acceptance](../acceptance.md)

## Prerequisites and owners

Owner: the migration candidate, persistent backups, disposable extracted
repository and this plan's receipt. Work only in isolated copies/checkouts;
the user's source checkout and live jobs are not write targets. There is no
dependency on completing Plans 30/31, but active work needs a recorded handoff
before its environment can be retired.

## Goal

Produce a history-preserving agent root from an exact selected candidate while
all local work and old evidence remain recoverable.

## Read first

- Main plan: current evidence, history contract and workspace contract.
- Agent `AGENTS.md`, `CLAUDE.md`, manifest/lockfile and local skill symlinks.
- Execution-time Git status, refs, worktrees and Git common directories for all
  three projects; active implementation/run receipts, including Plan 30.
- [GitHub extraction guidance](https://docs.github.com/en/get-started/using-git/splitting-a-subfolder-out-into-a-new-repository).

## Deliverables

- Inventory exact repo/branch/commit and working-tree/index state, relevant
  untracked skills/plans, durable ignored run evidence, active jobs, local-only
  branches and worktree dependencies. Record host backup/workspace paths.
- Preserve refs/required objects and working-tree/evidence content separately.
  Keep any reflog-only objects needed by active work; record restore commands.
- Assemble a committed isolated candidate containing intended completed work,
  current plans and skills. Assign every other agent branch/worktree a recorded
  continuation/migration/archive disposition. Never blanket-stage user changes.
- Record the new remote target/visibility and the two reviewed companion commit
  IDs. Verify availability without publishing or moving a source checkout.
- Filter a disposable clone with the documented subdirectory command; retain
  commit mapping and the untouched source repository archive.
- Write `01-results.md` with candidate identities, backups, pending-work
  dispositions and comparison evidence. Keep bulk artifacts outside the repo.

## Verification

Own E01–E04. Restore the archive into a scratch location and verify relevant
refs/blobs and selected dirty/untracked content. Compare the extracted root
tree to the candidate agent subtree before standalone edits. Inspect retained
history/authorship and the mapping. Verify original HEAD/index/file fingerprints
did not change. Old audit refs remain archived under their original identity.

## Exit and handoff

The selected agent content/history is preserved and extracted. Hand iteration 2
the extracted root/commit, original candidate, commit map, local skill source,
provider defaults and an inventory of remaining branches/jobs. Missing or
unrecoverable local work prevents completion of this iteration.
