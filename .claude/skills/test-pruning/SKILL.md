---
name: test-pruning
description: Prune redundant and inefficient tests from ramify-agent's Vitest and Cucumber suite by applying its test-pyramid rules - measure the suite's cost tiers from the latest audit report, classify candidates by reason (Vitest copies of Cucumber scenarios, boundary files that wrap whole workflows, tests of other tools, the same behavior proven at several layers, exhaustive sweeps, run-state compatibility tests, tests of test doubles, constant and prose locks, dead tests), verify the surviving owner of each behavior, delete or demote, then re-qualify. Use when asked to prune, dedupe, slim, speed up or review the test suite, after a plan or dogfooding run adds tests, when the audit's agent-tests check gets slower, or when a new test file duplicates a Cucumber scenario or a boundary twin.
---

# Test pruning

Keep one owner per behavior, at the lowest layer that can state it. Delete
the copies. Fix, never delete, a test whose only fault is being slow or flaky.

Rules this skill enforces, in priority order:
1. [Scenarios Are Never Duplicated in Integration Tests](../../../docs/harness.principles.md#scenarios-are-never-duplicated-in-integration-tests):
   the Cucumber scenario is complete; its Vitest copy goes.
2. [Testing ramify-agent](../../../docs/testing.spec.md): ordinary tests on
   fakes, a short fixed boundary set registered in
   `src/tests/test-boundaries.json`, sweeps in `*.stress.ts`.
3. [Run state is disposable](../../../AGENTS.md#run-state-and-compatibility):
   no compatibility tests for earlier runs.
4. This repository never asserts the behavior of ramify-audit, Ramify,
   Cucumber, Vitest, Node, the kernel or an SDK; one named canary per
   dependency.

Read [references/reasons.md](references/reasons.md) for each reason's rule,
owner, detection and traps before classifying.

## 1. Measure

From the repository root:

```sh
python3 .claude/skills/test-pruning/scripts/suite-durations.py --out <scratch>/durations
```

It reads `reports/audit/agent-tests.txt` from the newest `refs/audited/by-tree`
report commit (or `--ref <commit>`, `--text <file>`) and prints the tier
table, the costliest files with layer flags, cumulative share, cost by
directory and the slowest tests. Summed file-seconds depend on the worker
count the audit used, so compare shares and ranks across runs, not seconds.
A healthy shape: the in-memory tier holds most tests at a few percent of the
time; nine percent of tests taking ninety percent of the time is inverted.

Do not run the whole suite directly to measure; the audit report is the
evidence, and a full audit belongs to the qualification step.

## 2. Find candidates

```sh
python3 .claude/skills/test-pruning/scripts/find-candidates.py > <scratch>/candidates.md
python3 .claude/skills/test-pruning/scripts/find-candidates.py --reason R1 R4
```

Every hit is a candidate, never a verdict. Read the file before deciding.
For a whole-suite sweep, delegate reading by slice to subagents (boundary
project; harness root; each large module tree; the rest) with the durations
table and the reasons reference, and ask each for: layer of every costly
file, the owner of each duplicated behavior with `file:test title` evidence,
and a verdict per file (delete, shrink to named cases, fold, move to stress,
keep). A fifth agent on mechanics (profiles, import graphs, polling, settle
bounds) separates "slow because it is a copy" from "slow because of a
production cost", which is fixed rather than pruned.

## 3. Decide

For each candidate record: reason code, the test or cases to remove, the
owner that keeps the coverage, estimated seconds and lines, and risk. A
deletion needs a named owner whose assertion covers the same behavior or
native fact; "probably covered" is not an owner. When two layers both state a
behavior, the owner is the lowest one that can state it: a module function
on fakes beats a recovery row beats a composed run beats a boundary witness.

Act autonomously where the owner is verified. List for the user only the
cases where the two candidates differ in substance, where a native claim has
no cheaper witness, or where a scenario is pending and its Vitest twin is the
only running check.

## 4. Prune

- Delete whole files with `git rm`; delete cases by editing; for sweeps,
  create `<name>.stress.ts` beside the file and keep the counterexample set.
- Boundary files: update `src/tests/test-boundaries.json` in the same change
  (remove the entry, or rewrite `owningCases` to the surviving titles and
  make `whyFakeCannotProve` case-specific, naming the node twin).
- Scenario twins: delete the Vitest file, fold the helper into the step
  file, keep the feature, step and `agent-scenarios` check. Never edit a
  feature file or a scenario's state by hand.
- Shared flows run many times: keep one run per file and attach the other
  files' inspections to it, rather than deleting their assertions.
- Delete dead policy fields, export hooks and helpers that the removed tests
  were the last users of. `grep` for each removed helper export.
- Do not touch `docs/.superseded/`, fixtures under `subs/harness/fixtures/`,
  or `subs/harness/subs/scenarios/src/tests/golden/*.feature` (renderer
  fixtures, not scenarios).

## 5. Verify and qualify

1. Run the owner of every deleted behavior and every edited file:
   `npm run test:quick -- <files>`; boundary owners with
   `npm run test:boundaries -- <files>`; a new stress file with
   `npm run test:stress -- <file>`.
2. `npm run type-check` and `npm run check:self`.
3. Commit, then from the clean checkout run the audit in default mode:
   `node_modules/.bin/ramify-audit audit --cwd . --json`. Add `--full` only
   when the user asked for full qualification, and say why before running.
4. Rerun `suite-durations.py` on the new report and compare the tier table
   with step 1.

## 6. Record and guard

Write a short analysis under `docs/analysis/<date>-test-pruning.md`: tier
table before and after, each deletion with its reason code and owner, open
items left for the user. Then close the door the deleted tests came in by:
- rejecting generic `whyFakeCannotProve` sentences in the registry;
- naming test files by behavior, never by plan number;
- excluding `**/tests/helpers/**/*.test.ts` from discovery when helper tests
  were deleted;
- removing state readers from doubles whose readers were deleted.
