# Why partial audits did not narrow the ramify-agent suite

Observed during the assisted run of
[compatibility-layer-removal-continuation](2026-10-22-compatibility-layer-removal-continuation-dogfooding.md)
on 2026-10-22, with ramify-audit 0.12.0 as pinned by that worktree and
Ramify 0.5.2. The audits ran from the target worktree
`/workspaces/worktrees/compat-continuation-assisted-20261022`; evidence
references below are commits and refs in that repository.

## Summary

Three of the run's nine assisted audits executed in `ramify-partial` mode.
Each still ran the root Vitest suite almost whole and took as long as a full
audit, about 17 minutes. The selector did narrow, but by excluding the owned
trees of unselected modules, and for any source change in this repository
Ramify's consumer answer selects 18 of the 25 declared modules, including
`subs/harness` and the root. Those two own 66 percent of the suite's test
time. The seven modules left out own 0.3 percent.

This is ramify-audit behaving as its
[partial-audit specification](https://github.com/danmaz74/ramify-audit/blob/720d88d365a47a0b2691b62aec46ae5ced695fc2/docs/partial-audit.spec.md)
describes, applied to a module graph where nearly everything is a transitive
dependency of the harness module. Nothing was changed as a result.

## The audits

| Assessment | Candidate | Requested mode | Executed mode | Root Vitest invocation | Vitest time | Audit wall time |
|---|---|---|---|---|---|---|
| as-0001 | `826a688a` | partial | full (drift cap: 119 paths) | 498 files | | 17 min |
| as-0002 | `f39ca09a` | partial | partial | 441 files, no file targets | | 32 min, 16 of them waiting for as-0001's lease |
| as-0003 | `b0506b91` | partial | full (drift cap: 71 paths) | 498 files | | 24 min, with 16 test timeouts |
| as-0004 | `55fd5566` | partial | full (drift cap: 30 paths) | 498 files | | 17 min |
| as-0005 | `ef9cd085` | partial | partial | 439 files, no file targets | 848 s of 858 s | 17 min |
| as-0006, as-0007 | `ef9cd085` | partial | reused as-0005 | none | | seconds |
| as-0008 | `368cb831` | partial | full (drift cap: 54 paths) | 498 files | | 17 min |
| as-0009 | `4436c2e6` | partial | partial | 440 files, no file targets | 847 s of 856 s | 17 min |

Sources: the audit evidence documents under
`plans/compatibility-layer-removal-continuation/.harness/jobs/20261022T143108Z-5a8e97/evidence/`
(`result.requestedMode`, `result.executedMode`, `result.fallbackReason`,
`checks.agent-tests.commands.agent-vitest.invocationGroups`) and the report
commits `1d64488e` (as-0005) and `61b07cbd` (as-0009), whose
`reports/audit/partial-selection.json` records the selection.

The full audits were forced by the drift cap: more than 25 distinct changed
paths had selected a module since the chain's last full audit. Every
iteration candidate of this plan exceeded that.

## What a partial audit selected

as-0009 is the clearest case: its candidate changed two files, one source
file and its test, both owned by `ramify-agent/harness/autonomous/acceptance`.

From `61b07cbd:reports/audit/partial-selection.json`:

- `ramify.answer.changedModules`: `ramify-agent/harness/autonomous/acceptance`.
- `ramify.answer.affectedModules`: 17 modules, the changed one plus its
  consumers up to `ramify-agent/harness` and the root `ramify-agent`, and
  `ramify-agent/web`.
- `outcome.selectedModules`: 18 directories. Unselected: `subs/harness/subs/agent`,
  `check-findings`, `ledger`, `nonfunctional`, `plan-evidence`, `recovery`
  and `scenarios`.
- `directTests`: the one changed test file, reason `discovered-isolated-test`.
- `narrowedCommands[agent-vitest].invocationGroups[0]`: the root `npm test`
  with `--exclude` for each unselected module's tree and the usual ignored
  paths, and no file targets. Groups 2 and 3 run the `codex` and `pi` nested
  projects by directory.

as-0005 changed files in three modules (`harness`, `autonomous`,
`projections`) and reached the same 18 selected modules with the same seven
exclusions. as-0002 changed six modules and excluded six.

This is the specification's rule: "Keep required tests of selected modules by
ownership ... excluding unselected modules' owned contents", with Ramify's
answer alone deciding which modules a changed path selects. The direct
test-file selection runs in addition to the selected modules' suites, not
instead of them, and a whole command target subsumes its file targets.

## Where the suite's time is

Per-file durations from the full audit at `0340e819`
(`reports/audit/agent-tests.txt`, 498 files, 4207 tests, four workers),
summed per owning module:

| Owning module | Test files | Summed file-seconds | Share |
|---|---|---|---|
| `subs/harness` (its own `src/tests`) | 194 | 1768 | 59.2% |
| `subs/harness/subs/autonomous/subs/work-coordination` | 38 | 364 | 12.2% |
| root (`src/tests`) | 10 | 214 | 7.2% |
| `subs/harness/subs/autonomous/subs/acceptance` | 39 | 172 | 5.8% |
| `subs/harness/subs/assistance` | 21 | 147 | 4.9% |
| `subs/harness/subs/evidence` | 21 | 135 | 4.5% |
| all other modules | 175 | 185 | 6.2% |
| the seven modules partial mode excluded | 59 | 10 | 0.3% |

The harness module's own tests are composition and protocol tests over the
whole harness. They are the suite's cost, and `ramify-agent/harness` is a
consumer of every module beneath it, so every source change selects it.

## Why nothing is saved

Three facts combine:

1. Selection is by module ownership, and the unit of execution is a
   module's whole owned tree. A selected module runs every test it owns.
2. Ramify's consumer answer for any harness module includes
   `ramify-agent/harness` and the root, because those modules import from
   their descendants. The answer is correct: the composition tests in
   `subs/harness/src/tests` exercise the changed code.
3. The modules that are not consumers of a typical change are small leaves
   with fast tests.

So the narrowing removes about 58 of 498 files and about ten seconds of
file time, and the audit's other checks (typecheck, web build, self-check,
Cucumber scenarios) run regardless of mode. Partial mode pays off in this
repository only when a candidate changes test files alone, or when it reuses
a prior audit of the same tree, as as-0006 and as-0007 did.

## Options

These are options for the ramify-audit project, not decisions.

- **File-level selection inside a selected module.** The specification
  already follows incoming Ramify paths for changed support files. Doing the
  same for changed source would let a selected consumer module run only the
  tests that import the changed exports, directly or through helpers, rather
  than its whole owned tree. Dynamic, data and global-state relationships
  would remain limitations, as they are for support selection today.
- **An ownership boundary below the root for composition tests.** If the
  harness's composition tests were owned by a module that is selected only
  when a declared contract or exposure changes, routine internal changes
  would not drag them in. That is a ramify-agent layout choice as much as an
  audit one, and it would weaken the current guarantee that a consumer's
  tests run whenever a provider changes.
- **Accept the cost and rely on reuse.** The lease and reuse-before-lease
  behaviors already make an unchanged tree free. The drift cap of 25 paths
  is what forced four of this run's audits to full mode; raising it would not
  have made them faster, since partial costs the same here.

Partial mode's correctness was not in question in any of these audits: the
narrowed runs found the same failures the full runs did and carried the known
unstable test as a warning.
