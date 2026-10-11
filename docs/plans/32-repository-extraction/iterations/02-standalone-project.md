# Iteration 2: make the agent project self-contained

[Plan](../main-plan.md) · [Acceptance](../acceptance.md)

## Prerequisites and owners

Iteration 1 complete. Owner: extracted agent root instructions/configuration,
`skills/module-architect/`, active documentation and minimal runtime path fixes
required for extraction. Do not change toolkit model rules, module ownership or
provider versions merely to make migration easier.

## Goal

Ordinary development and architect prompt loading work from an agent root that
has no parent toolkit repository or companion source checkout.

## Read first

- Main plan: runtime boundaries and history contract; iteration 1 receipt.
- Root `AGENTS.md`, `CLAUDE.md`, `.gitignore`, `.npmrc`, manifests, compiler and
  runner configurations, `ramify-audit.json` and `docs/testing.spec.md`.
- `subs/harness/src/prompts/packages.ts`, the original skill and its referenced
  guidance; `subs/harness/subs/evidence/src/ramify-cli.ts`.
- Current README, principles/glossary and active Plans 30/31 commands; preserve
  historical evidence identities and do not read `docs/.superseded/`.

## Deliverables

- Complete local dependency/build/scratch/generated-view/editor-state ignores,
  preserving the parent generated-view family's precise names and near misses.
- Replace the external skill symlink with a complete real-file snapshot. Carry
  necessary referenced guidance, upstream notices and source commit provenance;
  fix local paths so required runtime reads cannot escape the repository.
- State applicable writing/development instructions locally. Fix current links,
  root command examples and old containing-repository assumptions. Historical
  receipts retain their original commands, paths and hashes as historical data.
- Preserve installed exact provider pins, registry configuration, local CLI
  lookup, React handling, module contracts and complete configured test selection.
- Record standalone preparation, worktree setup and cross-project release/packed
  experiment workflows. Write `02-results.md` with changes and limits.

## Verification

Own E05–E09. Prepare a fresh extracted checkout outside any toolkit tree, with
no companions. Run `npm ci`, focused affected tests, `npm run type-check`,
`npm run check:self` and `npm run build:web`. Load a default architect package
using the existing constructor and installed fixtures, without a model call;
check carried reference targets. Use `git check-ignore` on representative exact
generated names and authored/near-miss controls. Validate active local links.
Full qualification remains iteration 4's configured audit.

## Exit and handoff

Standalone operation and skill loading pass. Hand off the committed extracted
candidate, carried skill provenance, exact pins, focused outcomes and supported
root setup/commands. Record any inherited failure separately; do not report it
as fixed or passed without evidence.
