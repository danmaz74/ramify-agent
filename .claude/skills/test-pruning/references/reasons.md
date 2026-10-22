# Pruning reasons

One owner per behavior. Every reason below names the rule, what goes, who
keeps the coverage, how the scripts and a reading surface it, and the traps.
Section codes match `scripts/find-candidates.py --reason`.

Contents: R1 scenario twins · R2 boundary workflow wrappers · R3 other tools ·
R4 multi-layer duplicates · R5 sweeps · R6 compatibility · R7 doubles ·
R8 locks · R9 dead · R10 real waits · Not a reason

## R1. Vitest copies of Cucumber scenarios

Rule: [Scenarios Are Never Duplicated in Integration Tests](../../../../docs/harness.principles.md#scenarios-are-never-duplicated-in-integration-tests).
A scenario is the complete statement; its Vitest copy is less complete and
costs a run per audit.

- Delete: the `<name>.test.ts` whose assertions a `steps/<name>.ts` already
  makes, and any `helpers/<name>.ts` method that only greps source or config
  text (that is `check:self` and the type check's job).
- Owner: the feature file plus its step file, run by the `agent-scenarios`
  check.
- Detect: R1 lists step files with a same-basename test and helper. Confirm by
  diffing the helper calls the step makes against the ones the test makes.
- Trap: a pending scenario (`@ramify-pending`) has a step file that never
  runs. Only the harness moves a scenario's state or rewrites a feature, so
  leave the feature and step alone and note the pending scenario for the
  plan's architect. Do not hand-prune duplicate feature copies.

## R2. Boundary files that are workflow tests with one native call

Rule: a file in the `boundaries` project holds the minimal native witness
(Git objects, installed CLI or daemon, audit producer, kernel). A scripted run
in front of the native call belongs to the node project, where it already is.

- Delete or shrink: boundary files that call `startRun`, `openRuns`,
  `runAcceptedHandback`, `runDependencyGate` or a twin's helper with a
  `realBoundary` flag; the node twin owns the workflow. Keep the one assertion
  that needs the tool, moved into the smallest existing witness of that tool.
- Fold: several files that each start a Ramify daemon for one `materialize`
  or `check` become one file with a single daemon in `beforeAll`.
- Owner: the node twin for workflow facts; one named witness per native
  claim (for example `iteration-gate-integration` for a real commit with the
  gate trailer; `project-boundary-audit.integration` for a nested audit).
- Detect: R2 lists registry files that use run helpers or spawn the CLI, and
  generic `whyFakeCannotProve` sentences shared by three or more entries.
  Read the file: if every assertion but one would pass on fakes, it is R2.
- Trap: a file whose cost is a production settle bound expiring (a 30 s
  `stopSettleMs`) is not R2; shorten the bound in the test's policy.
- Always update `src/tests/test-boundaries.json`: remove the entry, or edit
  `owningCases` to the surviving titles, and make `whyFakeCannotProve`
  case-specific, naming the node twin it complements.

## R3. Tests of other tools' behavior

Rule: this repository never asserts the behavior of ramify-audit, Ramify,
Cucumber, Vitest, Node, the kernel or an SDK. One named canary file per
dependency is the only exception, and it says so in its header. The canaries
are `subs/harness/subs/audit/src/tests/audit-conformance.test.ts` (ramify-audit,
sixteen numbered facts against the pinned SDK), `subs/harness/subs/ledger/src/tests/killed-writer.test.ts`
(the kernel: a write that has entered the kernel survives SIGKILL, which
`torn-line` replay depends on) and the `pi-agent` file (the Pi SDK). A
canary is never an R3 deletion; a second file proving the same tool fact is.

- Delete: a second conformance or partial-selection suite beside the canary;
  Vitest launched inside Vitest to observe worker reuse; `execFile` timeout
  or env passing; V8 or `JSON.stringify` error text; SDK defaults such as
  `reserveTokens` asserted outside the canary; raw CLI exit codes and output
  text inside otherwise useful cases.
- Owner: the tool's own suite (ramify-audit and Ramify have checkouts beside
  this one). For a fact this code depends on, keep one assertion in the
  canary file.
- Trap: `reserveTokens` and similar names also appear as fixture data in
  files that never touch the SDK; a hit outside the SDK's own module is
  usually data, not an assertion about the tool.
- Detect: R3 greps titles and bodies. Also look for many `tsx src/main.ts`
  spawns in one file: the spawn is 1.2 s each and usually proves the CLI
  parses arguments, which `cli.test.ts` does in process.

## R4. The same behavior proven at two or more layers

Rule: a module function on fakes owns a transition; one recovery row owns a
crash point; one composed run owns a workflow. Everything else is a copy.

Shapes seen:
- Restart matrices: the same flow cut at N writes, each a full run, all
  asserting "one commit, one handback, no repeated work". Owner: the
  recovery table's row for that write, or a ledger-prefix replay test.
- A recovery table copied under other names in another module.
- A shared flow (`runAcceptedHandback('revision')`) run in several files so
  each can inspect one thing. Owner: one run in one file, with every
  inspection attached.
- Review or lifecycle cases that exist twice by title in two modules.
- A cross-cutting policy ("work outlives the allowance", "an unavailable fork
  falls back") retested once per caller with a full run. Owner: one unit test
  of the policy plus one composed run.
- Mode variants under one title (`ordinary`, `restart`, `repair`,
  `legacy-restart`, ...) where the packet content is already a unit test.
- Module-to-module copies in the in-memory tier (a projections test repeating
  a kpi test's cases by name).
- Detect: R4a identical titles across files, R4b one acceptance tag (CA12,
  CF06, PB3-D04 ...) in three or more files, R4c basename twins. Then read
  both and decide which layer is the owner: the lowest one that can state the
  behavior.
- Trap: twins with the same name and different behavior exist (a
  `before-ingestion` pair that tests warning replay in one file and blocked
  repair in the other). Compare assertions, not titles.
- Trap: a matching acceptance tag is not an owner. `review-lifecycle` CF04
  had no CF04 in `check-findings-composition`; its CF06 and CF07 matched by
  tag while the titles differed. The owner must contain the assertion, and
  when the owner's case is itself being reduced (a sweep moving to stress), a
  boundary only the sweep covered has no owner and stays.
- Move, then assess: run-driving describes that live in a module other than
  the engine they exercise (task-workflow tests that run work-coordination)
  may have no owner at all. Move them beside the engine's run tests first;
  delete only what an existing run test there already proves.

## R5. Exhaustive sweeps in the ordinary suite

Rule: `docs/testing.spec.md` sends performance, exhaustive and scale probes
to `*.stress.ts` under `vitest.stress.config.ts`, absent from audit
discovery. The ordinary suite keeps a small counterexample per distinct
behavior.

- Move: every-cursor query loops, every-prefix restart loops, every role ×
  every path products, "nothing changed" sweeps run twice (in process and
  over HTTP).
- Keep in the ordinary file: cursors 0, mid, last, last+1; about five cuts;
  one representative per enum branch.
- Detect: R5 titles and `toBeGreaterThan(<big>)` on a case count. A test that
  asserts how many cases it generated is a sweep.

## R6. Run-state compatibility and retired-limit tests

Rule: [run state is disposable](../../../../AGENTS.md#run-state-and-compatibility).
No legacy readers, dual formats or "remains readable" obligations.

- Delete: cases titled legacy, compatible, earlier-run, "left behind", and
  cases that only check a limit the production code no longer reads. Delete
  the dead policy fields with them.
- Detect: R6. Read before deleting: "legacy" is also a product term in some
  modules (a legacy context return is a protocol branch, not run-state
  compatibility).
- Trap: "former allowance" in a title does not mean the limit is retired.
  `grep` the policy field in production first. `invocationAbsoluteMs` is
  still the command hold, and the tests saying a reached allowance never
  refuses pending work guard the continuity principle in
  `docs/harness-recovery.principles.md`. Such a behavior keeps one owner, the
  fake-timer unit test (`run-bounds` "a healthy held command is not
  interrupted by the former absolute allowance"); only its full-run copies go.
- Trap: a test that the decoder refuses an earlier run policy rather than
  adapting it (`plan-evidence-compatibility`) enforces this rule and stays.

## R7. Tests of test doubles

Rule: a helper's refusals (unstated, unused or exhausted scripted answers,
refused process launches) are proven by its consumers' teardown
(`assertComplete`, `assertAnswered`, `expectNoProcesses`). Helpers have no
test files.

- Delete: `*-boundaries.test.ts` files whose subject is the scripted answer
  machinery; fidelity suites that prove a fake matches a port (keep one
  contract suite per fake); assertions that read a double's own state
  (`git.commits()`, `git.operations()`, `git.minted()`), which echo what the
  script constructed and break on refactors that change no behavior.
- Detect: R7 flags files with no production import and a double signal, and
  files with five or more double-state reads.
- Guard: remove state readers from the double's public surface; one Git
  double, not six.
- Trap: classify by what the assertions are about, never by the file name.
  `audit-check-execution.test.ts` is the fake-backed twin of a boundary case,
  not a double test; `*-compatibility` may enforce a rule (see R6). A mixed
  file (`direct-check-execution`: four script-exhaustion cases, three
  executor cancellation and abort cases) is split, not deleted.
- Trap: a registered boundary file that spawns the CLI has no production
  import either; it is R2 or R3 material, never R7.

## R8. Enum, constant, schema-shape and prose locks

Rule: never assert a schema's option list, a constant, a prompt sentence or
a serialized blob unless a consumer's behavior depends on it. TypeScript
`never` already proves exhaustiveness.

- Delete: `schema.options).toEqual([...])`, `Object.keys(shape).toHaveLength`,
  `toContain('<a sentence of prompt text>')`, hand-kept indexes of other
  tests' titles, regexes over test sources or CSS.
- Keep: a prose assertion when a downstream parser or an agent instruction
  depends on that exact wording, and the test says which.
- Detect: R8.

## R9. Dead, vacuous or broken

- Registry entries whose `owningCases` no longer match a title; registered
  files that never run (`skipIf` on an env variable); a version constant that
  makes every "rejects" assertion vacuous; a test asserting the string its
  own fixture script emits; manual scripts pointing at moved test files.
- Detect: R9, then run the file: a vacuous case passes with its subject
  removed.
- Trap: an env-gated file is not dead when the testing spec retains it.
  `fixture-trials.test.ts` is the opt-in trial runner `docs/testing.spec.md`
  says keeps its setup and optional skips, and it is registered. Deleting it
  is a decision for the user that also changes that spec sentence; list it,
  do not prune it.

## R10. Tests that wait on the wall clock

Rule: `docs/testing.spec.md`: timing rules use controlled clocks or
observable ordering, never elapsed time. A test that sleeps, polls with a
long deadline, or carries a minutes-long timeout pays real seconds on every
audit and proves nothing a fake clock could not.

- Fix, never keep as is: `setTimeout`/sleep of a second or more; a scripted
  `stall` of a second or more; `until`/`waitFor` deadlines in minutes; a test
  timeout argument of 60 s or more; a `beforeAll` timeout in minutes. Replace
  with `vi.useFakeTimers()` plus `advanceTimersByTimeAsync`, or wait on the
  event the test actually needs. The owner is the same test on a controlled
  clock (the `run-bounds` fake-timer cases are the pattern).
- Detect: the measured side is the reliable one. `suite-durations.py` names
  every test over 30 s as a real-wait suspect; a single test over a minute
  is one until shown otherwise. The static side, R10, lists sleeps and
  stalls of a second or more in files that never call `vi.useFakeTimers`,
  and test timeout caps of five minutes or more. A `timeout` option passed to
  a spawned process or a configured `timeoutMs` under test is a cap, not a
  wait, and is not listed.
- Trap: a long timeout is sometimes a safety net on a CPU-heavy composed run
  rather than a wait. Confirm with the measured duration: a 180 s timeout on
  a 6 s test is noise, a 15 minute test is a wait. A production settle bound
  expiring (`stopSettleMs`) is fixed in the test's policy, not by a longer
  timeout.

## Not a reason

- Cost alone. A slow test with a unique claim stays; fix the mechanism (an
  unread policy delay, whole-journal cloning, an unmocked store, or an R10
  wall-clock wait) instead.
- A plan number in the file name. Rename, do not delete.
- A boundary witness under ten seconds with a true native claim.
- A failing or flaky test. Fix it; a flake hides a timing or ordering defect
  that deletion would bury.
