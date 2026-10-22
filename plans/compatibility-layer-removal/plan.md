# Remove readers for retired run-state forms

This is an overview, not an execution input. The removal is executed as two
plans, split so that the second can wait for the descriptive-identifier work
(Plan 42) that edits the same files:

- [Remove readers for retired session, delivery and measurement forms](../compatibility-layer-removal-records/plan.md):
  inventory findings 1, 4, 7, 8 and 12, about 6,000 lines. Independent of
  Plan 42; starts first.
- [Remove readers for retired continuation, policy and limit forms](../compatibility-layer-removal-continuation/plan.md):
  inventory findings 2, 3, 5, 6, 9, 10 and 11 plus the `recovery resume`
  fields, about 1,300 lines. Registered after Plan 42 merges into `main`.

## Problem

The harness still reads, adopts or tolerates twelve record forms that no
current code produces: an earlier standalone-session layout, copied successor
runs, inline assisted documents and `git-exact-text/1` reviews, `/1` delivery
manifests and operation intents, `run-policy/7` runs, count-forced
non-functional exhaustion, inline-body session-store transactions,
`scope-size/1` measurements and manifest-less scope estimates, ignored
rejection bounds, run snapshots without breakpoint and repair state, write
scopes without a captured assignment boundary, and Pi `0.87.1` identities.
Together they are about 7,200 lines of production code, tests and fixtures. The
verified inventory is
[Removable compatibility layers](../../docs/analysis/2026-10-22-removable-compatibility-layers.md)
with its
[ramify-agent report](../../docs/analysis/2026-10-22-removable-compatibility-layers/ramify-agent.md).

The repository rule in
[Run state and compatibility](../../AGENTS.md#run-state-and-compatibility)
makes run state disposable: a finished run stays finished, an unfinished run
restarts from its plan on current code, and nothing keeps reading an older
run-state form. Both plans apply that rule. The combined result is one current
form per durable record kind, one session layout, same-run continuation only,
and no policy adoption. No long-lived committed file changes shape, so no
conversion script is needed.

## Why two plans

Plan 42's assisted branch changes 24 of the 65 files the inventory names.
The overlap is concentrated in the autonomous run records, service and log,
the projections of successor provenance, the assistance assessor and the
judge construction, which are the continuation plan's targets. The session
layout, delivery manifests, measurement and Pi identity files are untouched
by Plan 42 apart from one schema literal and one nearby hunk.

An assisted execution captures its plan and a fixed protection baseline at
registration and assesses the cumulative result against that baseline. One
job spanning the Plan 42 merge would carry Plan 42's whole diff, including its
guarded-file changes, into the compatibility plan's cumulative assessment.
Two plans with their own baselines avoid that. Each part is self-contained:
its required behavior, constraints, acceptance and identifier evidence are
carved from the original plan without changing them.

## Sequencing

1. Register and run the records plan on a worktree off `main`.
2. Merge Plan 42 into `main`.
3. Re-verify the continuation plan's findings against `main`, then register
   and run it.
