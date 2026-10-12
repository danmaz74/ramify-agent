# Plan 40 development qualification

**Date:** 2026-10-12. **Status:** Focused development checks pass; stage-one
qualification remains open. No clean committed qualification audit was run.

## Candidate and providers

The reviewable, uncommitted candidate is in
`/workspaces/worktrees/ownership-recovery-agent`, branch
`fix/ownership-recovery`, based on
`3820eb42117651cb6fb1f29a5839e7d5b6000f88`. That base is not a qualification
identity for the modified source. No consumer commit, push or sync was made.
The manifest pins `ramify.ts@0.4.3`, `ramify-audit@0.8.0` and
`@earendil-works/pi-coding-agent@0.87.1`; the installed Ramify executable
answered `0.4.3`.

Consumer recovery uses the existing `affected --batch` compatibility carrier
until verified released ownership-command support is adopted. Successful
scripted new-carrier tests do not establish installation or release adoption.

## Focused results

Commands ran from the candidate root. No direct whole suite or audit ran.

```sh
npm run test:quick -- subs/harness/src/tests/decision-correction-workflow.test.ts subs/harness/src/tests/inherited-scope.test.ts subs/harness/src/tests/project-facts-recovery.test.ts subs/harness/src/tests/ownership-authority.test.ts subs/harness/src/tests/ownership-repair-equipment.test.ts subs/harness/src/tests/ownership-repair-guard.test.ts subs/harness/src/tests/ownership-repair-ledger.test.ts subs/harness/src/tests/ownership-mutation-classification.test.ts subs/harness/src/tests/write-guard.test.ts subs/harness/src/tests/write-scope-submission.test.ts subs/harness/src/tests/plan36-mutation-attribution.test.ts subs/harness/src/tests/gate-not-verified.test.ts subs/harness/src/tests/gate-repair-routing.test.ts subs/harness/src/tests/engineer-api-preparation.test.ts subs/harness/subs/evidence/src/tests/ownership-evidence.test.ts subs/harness/subs/evidence/src/tests/ramify-cli.test.ts subs/web/src/tests/plan36-evaluation-attribution.test.tsx --maxWorkers=4
```

This run passed **17 files, 120 tests** at 07:30:28 UTC. The subsequently
corrected recovered-gate path received its own focused run:

```sh
npm run test:quick -- subs/harness/src/tests/ownership-mutation-classification.test.ts --maxWorkers=4
```

It passed **one file, nine tests** at 07:34:22 UTC, including recovered
uncommitted invalid-acquisition and runtime-unavailability cases. These totals
overlap and must not be added as unique coverage.

The composed workflow regression covers both local and capability architects:
an admitted declaration edit creates a missing-export state; several subsequent
historically admitted repair writes retain useful unrelated work; partial
findings reach the architect; correction produces a fresh assignment; a fresh
engineer restores the declaration and obtains current evidence before
acceptance. Other cases cover absent and missing-blob repair authority returning
through the existing environment path. These are scripted symbolic
reconstructions motivated by the
[retained failed run](../../analysis/2026-10-12-revision-preview-rerun.md),
not a replay of its target. Original artifacts remain unchanged. The tests use
real guard, equipment, records and workflow logic with scripted external
ownership, Git, command and audit answers. No filesystem checkpoint is used.

Existing registered native compatibility witnesses ran against installed 0.4.3:

```sh
npm run test:boundaries -- subs/harness/subs/evidence/src/tests/project-boundary.test.ts subs/harness/src/tests/write-guard.boundary.test.ts subs/harness/src/tests/engineer-api-preparation.boundary.test.ts --maxWorkers=1
```

The first run had **two passed files and one failed file; 11 passed and two
failed tests**. The write-guard failures exposed stale test expectations:
creating an unapproved declaration under inert/scratch ownership was still
expected to pass, and a deliberately incomplete scope omitted the now-required
project root. The fixtures now assert unapproved module creation is refused and
use a complete guard receiving no placement answers. The focused rerun passed
**one file, six tests**:

```sh
npm run test:boundaries -- subs/harness/src/tests/write-guard.boundary.test.ts --maxWorkers=1
```

The other two passing native files were not rerun. Across the three files the
final compatibility results are **13 passed tests**. This establishes the
existing installed CLI boundary, not the unreleased ownership command.

After the recovered-gate follow-up finished all production edits, both
`npm run type-check` and `npm run check:self` passed. The structural result was
completed, check passed, partial coverage: **zero errors, zero warnings and 359
analysis limits**, covering 13 owners, 808 source files and 72 resources.
An earlier passing type-check is interim evidence only.

[Process observations](development-process-evidence.json) retain the exact cwd
and run windows. The 17-file ordinary run and final one-file ordinary follow-up
each recorded zero allowed native API observations and zero refused attempts.
The initial three native files recorded 49 allowed API observations; the
one-file native rerun recorded 33, with zero refused attempts. API observations
are not successful child-process counts, performance results or semantic
authority.

## Remaining qualification limits

External provider release adoption, exact consumer pin update and installed new
ownership-command qualification remain pending. The reviewed native witness is
kept outside test discovery as
[a draft](ownership-recovery.boundary.test.ts.draft); it must use the final
released support configuration before registration and execution. Its installed
adapter claim is separate from the scripted composed regression.

The opt-in [ownership-query cost probe](../../../scripts/ownership-query-cost.ts)
is authored but unrun. Its interface is:

```sh
node_modules/.bin/tsx scripts/ownership-query-cost.ts --output /absolute/new-receipt.json --samples 5 --warmups 1
```

Optional repeated `--project <root> --path <relative target>` pairs replace the
default collection-review fixture and harness selections. The probe refuses an
existing output path, alternates ownership/affected operation order, retains raw
timings and results, records first invocations, version/pin/manifest/lockfile and
consumer identities, and distinguishes each operation's input domain. Only
successful comparable acquisitions are eligible for comparison; failed or
unsupported answers remain raw failure evidence. It measures independent
process queries on an unchanged candidate as a repeated per-write query model,
not end-to-end write latency. It provides no cold OS-cache guarantee, daemon or
harness cache. No latency improvement is claimed before measurement.

A clean committed candidate and the default
`node_modules/.bin/ramify-audit audit --cwd . --json` remain required for
stage-one qualification. That audit must retain all configured checks/projects;
this receipt has no audit identity, evidence ref or passing full-suite claim.
The user's current instructions do not authorize commits. Stage-one Beads work
remains open under `ramify-agent-570.6`; conditional stage-two checkpoint
measurement and adoption remain separate and unimplemented.
