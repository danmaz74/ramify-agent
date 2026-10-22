# Test pruning, 2026-10-22

The suite's cost pyramid was inverted: nine percent of the tests took ninety
percent of the time, because the same behaviors were proven at several
layers and because Vitest copies of Cucumber scenarios, boundary files that
wrapped whole workflows, and exhaustive sweeps all ran on every audit. The
pruning applied the rules of [the test-pruning skill](../../.claude/skills/test-pruning/SKILL.md)
in five parallel slices on branch `test-pruning`, merged, and qualified with
one full audit. Each commit on the branch names the owner that keeps the
coverage of what it removed; this note summarizes by reason.

## Shape before and after

Before, report commit 635d4752 (4 workers):

| tier | files | tests | seconds | share | s/test |
|---|---|---|---|---|---|
| memory | 261 | 2325 | 113 | 4% | 0.05 |
| tmp | 54 | 594 | 48 | 2% | 0.08 |
| run | 121 | 1060 | 1405 | 48% | 1.33 |
| boundary | 63 | 232 | 1384 | 47% | 5.96 |

499 files, 4211 tests, 863 s wall, 2949 summed file-seconds.

After, report commit 18691f9d on commit 8d93290f (full audit, verdict pass):

| tier | files | tests | seconds | share | s/test |
|---|---|---|---|---|---|
| memory | 236 | 2119 | 120 | 7% | 0.06 |
| tmp | 50 | 557 | 53 | 3% | 0.09 |
| run | 119 | 919 | 1158 | 65% | 1.26 |
| boundary | 49 | 184 | 444 | 25% | 2.41 |

454 files, 3779 tests, 407 s wall, 1775 summed file-seconds. The boundary
tier fell by two thirds; the run tier is now the cost, and its remaining
weight is production mechanics rather than copies (whole-journal cloning,
session record re-parsing, an fsync per ledger append). Three boundary
tests still run over 30 s, all process-host witnesses:
`coordinator-publication.boundary` startup crashes (53 s),
`execution-breakpoints-process.boundary` B17 (31 s) and
`coordinator-launch.boundary` detached host (30 s).

Discovery after: 454 files (382 node, 49 boundaries, 23 web); 49 test files
deleted, 4 added (`installed-ramify.boundary`, `engineer-runs`,
`report-provenance`, `test-boundaries-manifest`), 4 stress files added.

## Deletions by reason

R1, scenario twins (f18baacb, 0d0d1d8e): the ten `kpi-*` and `projection-*`
Vitest files and `root-qualification.test.ts` called exactly the helper
methods their same-named step files call. The bound scenarios under
`features/kpi-extraction` and `features/projections-extraction` own them;
the helpers used by one step file were folded into it. The one fact no
owner asserted (a repeated export updates the same issue) moved into
`repair-export-command.test.ts`.

R2, boundary files that wrapped workflows: `capability-acceptance.boundary`
and `capability-dependencies.boundary` (c9ec7af0, the tree claim is
`capability-delegation.boundary` CA30), `plan21-workflows.integration`
(d3b23d08), `iterations-integration` (0f22129f, `iteration-gate-integration`),
`run-protocol-materialization.integration` (2a060370, projections
`progress.test.ts` and `progress-fixture.test.ts`), the single-session
boundary pair (a2f75199), and the shell-tool, hook-checks and
recorded-environment boundaries (9e178949, `run-command.boundary`). Six
installed-Ramify witnesses folded into `installed-ramify.boundary.test.ts`
with one daemon (c4ab0f61, 14 s in place of 330 s). Coordinator-launch
(8a8c2b31), coordinator-publication (87659924), the audit runner-truth F2
case (e9c3fa6f), the nested Vitest launches of `test-boundaries.integration`
(1b3c4652) and the breakpoint process host (1fb17d95) were cut to their
native claims.

R3, other tools' behavior (c8b24aec, 0f22129f, a2f75199, 9e178949,
ac56f515): Pi SDK phases and defaults, V8 message text, ramify-audit summary
and exit output, Node's `execFile` timeout, and a test lock's self-emitted
line. The canaries are `audit-conformance`, `killed-writer` and `pi-agent`,
labeled as such.

R4, the same behavior at several layers: 22 `run-recovery` rows owned by
the composed recovery table (4273b4b1); the capability restart families
(c97480e0, de6b79de), non-functional and repair restarts (f23c847c),
review-lifecycle CF06 crash copies (c6e231ba), per-caller unavailable-fork
copies (3783c2cf), operation-recovery-callers 16 runs to 2 (5a6f94d5),
reconciliation brief-crash copies (9e8d6963), the contract delegation family
(4ebed88a), one shared plan25 revision run (6d916ac8), engineer run tests
moved beside work-coordination's runs (a82c0fc4), plan-numbered variants
(a82bbb4f), scenario state transitions (821651c0), breakpoint pipelines
(65331e88), ledger re-runs in commit and commit-recovery (a2fde4eb),
catalog cases (ec8063dc), in-memory module duplicates (ab00b7ab) and web
page copies of component cases (a0f05ae4).

R5, sweeps to stress (5f1b5007, 3162b9de, ea397ef1, c8b24aec):
`composition.stress.ts`, `projections-pure.stress.ts`,
`check-findings-composition.stress.ts` and `all-role-continuity.stress.ts`.
The ordinary files keep cursors 0, mid, last and last+1, six recovery cuts
of different kinds, and two roles.

R6, run-state compatibility (a82bbb4f, 4273b4b1, 9e8d6963, 40a2bb30):
legacy-record and restart-shape variants, the Plan 1 mapping directory, the
one-round earlier policy, and the full-run copies of the historical
allowance guard; its owner is the fake-timer case in `run-bounds.test.ts`.

R7, tests of doubles (f4df36e1, 2d170f5c, 025a3860): the `*-boundaries`
double tests, `run-event-reader`, `workflow-session-store`, the four agent
fidelity files, `scripted-cli` and the helper test `preview-git.test.ts`.
`scripted.test.ts` is the one fake contract suite; helper test files are out
of discovery.

R8, locks (ec380b4d, f541cac3, d7ade3ea, c8781e6f, d780c3ee, d7a6f3c0,
a0f05ae4): prompt sentences, limit and version constants, option lists,
member counts, usage sentences and CSS source regexes. Kept: the rule that
no submission schema names an ID the harness knows, and the three usage
synopsis lines of `cli.test.ts`.

R9, dead or vacuous (6c25b232, 77da1a9c, e9c3fa6f, d3b23d08, 8d93290f,
ac56f515, 75452bff): the Plan 13, 14 and 21 browser-acceptance scripts and
their export hooks, registry cases that no longer matched a title, and the
`plan-evidence-review-unavailable` fixture that corrupted its catalog until
the case timed out (now 3 s).

R10, wall-clock waits: the real 2 s shell wait in `run-bounds` (40a2bb30)
and CA20's 30 s settle bounds (c9ec7af0, 3.3 s). CF07's 1.5 s stall stays:
its late, stop-ignoring submission depends on it.

## Found on the way

A stop sent at `writer-acquired` can reach `job-stopped` without the
engineer's `invocation-ended` or `session-finished`. The composition query
sweep used to delay the run enough to hide it; `runToEnd` now holds the run
at the stopping write until the stop is accepted (49cc7f95). The production
ordering is recorded in `docs/todo.md` §5.

## Left for a decision

- `workspace-preparation.boundary` registers schema 4 while the fixture is
  schema 6; three assertions fail when the boundary runs for real. A patch
  that moves the fixture to schema 6 is saved beside the slice B notes.
- `fixture-trials.test.ts` is env-gated and never runs in the audit, but
  `docs/testing.spec.md` retains it as the opt-in trial runner. Deleting it
  changes that sentence.
- Production leftovers the tests exposed: `capabilityRecoveryBoundaries`
  names `capability-gate-recorded`, which is never emitted; the
  `recoveryRuntime` option and `policy.recovery.baseDelayMs/maxDelayMs` are
  never read; `contextBudgetReached` may be dead.
- Deferred mechanics, not pruning: one Git double in place of six,
  whole-journal cloning in `coordination-history.ts`, session record
  re-parsing, `createScriptedAgent`'s home, the unused `runDependencyDecision`
  branches, and renaming the plan-numbered test files by subject.
