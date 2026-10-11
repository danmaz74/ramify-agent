# Iteration 5: publish the repository and complete the cutover

[Plan](../main-plan.md) · [Acceptance](../acceptance.md)

## Prerequisites and owners

Iteration 4 complete. Owner: new agent remote, persistent host workspace,
toolkit cleanup in an isolated checkout, old-container migration and final
handoff. The new remote/visibility and qualified candidate are recorded; active
work has an explicit continuation destination. Never retire an environment
still needed by a live implementation or inaccessible Git common directory.

## Goal

Make the independent repository the ordinary development home, remove its
current tree from Ramify, and retain recovery access to all old local work.

## Read first

- Main plan: history, completion and deferrals; iterations 1–4 receipts.
- Toolkit `AGENTS.md`, `CLAUDE.md`, root manifest/configuration, module boundary,
  `README.md`, audit and current development instructions.
- Actual host mounts and all remaining toolkit/audit/agent worktree common
  directories. Re-inventory branches and dirty files before moving anything.

## Deliverables

- Create/use the recorded agent remote and publish the qualified branch/history;
  fresh-clone verification names the same implementation candidate and license.
  Retain this plan and its authored skill assets. Do not rewrite Ramify history.
- Establish the persistent host workspace. Transfer existing companion source,
  local branches and dirty files using the preservation contract; keep their
  complete Git metadata. Recreate or repair linked-worktree locations deliberately
  and verify Git operations before removing an old location.
- In an isolated toolkit checkout, remove `ramify-agent/` with a normal commit;
  remove its `worktree:prepare` entry, `external "ramify-agent"` declaration,
  dedicated compiler/audit exclusions and active instructions/links. Preserve
  historical evidence/docs and unrelated dirty work. Update setup/docs that
  otherwise expect agent dependencies in toolkit worktrees.
- Qualify the exact cleaned toolkit candidate with its declared released audit
  CLI from that candidate's instructions. Do not substitute a direct full suite.
  If agent runtime/configuration changed during publication, requalify its exact
  new candidate using iteration 4's gates.
- Cut over only after new-repository retrieval, persistent companion/worktree
  operations and both candidate qualifications pass. Retain the old environment
  archive; do not delete it as a completion requirement.
- Write `05-results.md` with published commits, mapping/archive/evidence paths,
  pending branch destinations, cases, setup/reconnect instructions and rollback:
  reopen preserved old checkouts/container paths without deleting new work.

## Verification

Own E21–E24. Fresh-clone retrieval and ordinary setup exercise the new remote.
Compare transferred source and dirty-state fingerprints; inspect independent
remotes and mounted common directories; operate all remaining linked worktrees.
Search toolkit active setup/config/docs for dangling agent references and run
the declared toolkit audit on its clean cleanup candidate. Reconcile all 24
cases with exact evidence locations and honest outcomes.

## Exit and handoff

The independent repository is published and usable, toolkit cleanup is qualified,
source/worktrees/evidence remain recoverable, and daily development uses the
persistent new workspace. Missing publication, failed qualification or lost
local work means the plan remains incomplete. Plans 30/31 continue from their
explicitly recorded branches/candidates; this migration does not implement them.
