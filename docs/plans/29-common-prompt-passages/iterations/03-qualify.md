# Iteration 3: qualify and document the integrated result

[Plan](../main-plan.md) · [Acceptance](../acceptance.md)

## Prerequisites and owners

Iteration 2's committed integration and receipt, all C/D cases resolved.
Owner: harness integrated tests and current documentation. Read the main plan,
the first two receipts, `docs/harness.spec.md`, session-observation documentation
and `docs/testing.spec.md`. Serialize any overlapping Plan 28 integration.

## Goal

Qualify the exact final implementation, with truthful receipts and no new
performance or semantic-benefit claim.

## Deliverables and verification

- Own Q01–Q03. Exercise scripted joined workflows with fresh/continued/forked
  input, a repair, a legacy admitted operation and ordinary fresh fallback.
  Preserve the entire configured full-audit scope.
- Run the focused integrated checks from the repository root:

  ```sh
  npm run test:quick -- subs/harness/src/tests/plan25-combined-delivery.test.ts subs/harness/src/tests/plan23-task-prompts.test.ts subs/harness/src/tests/nonfunctional-submissions.test.ts subs/harness/src/tests/nonfunctional-repair.test.ts
  npm run type-check
  npm run check:self
  ```

- Update `docs/harness.spec.md` to replace its current per-field environment
  delivery contract with common passages/current facts and retained historical
  compatibility. Update `docs/metrics/session-observations.md` if its wording
  assumes per-field environment deliveries; describe actual manifest provenance
  without adding counters or changing historical metric meanings. Keep Plans
  25/26 and historical trial receipts unchanged.
- Commit the final integration candidate, then run the plan's configured full
  nested audit from the repository root. If source changes after qualification,
  qualify the resulting candidate again. Do not call focused tests a full audit.
- Record actual outcomes and limitations, including baseline/final commit IDs,
  relevant focused checks, type/self-checks, full-audit artifacts, retained
  rendered examples and the manual prompt-contract review. No paid trial,
  performance target or forced external provider check is part of this work.

## Exit and handoff

Write `03-results.md` linking every acceptance case to its evidence. Mark the
plan complete only after implementation and required verification finish.
Report skipped/unrun checks accurately. Final documentation receipt changes
identify the source commit qualified by the audit; never imply a later source
change was audited. Preserve unrelated working-tree changes and leave any
publication to the separately authorized implementation scope.
