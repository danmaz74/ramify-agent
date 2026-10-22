# Compatibility-layer removal, continuation plan: assisted dogfooding

Working note for executing
[plans/compatibility-layer-removal-continuation/plan.md](../../plans/compatibility-layer-removal-continuation/plan.md)
through the assisted path. The records plan's note is
[2026-10-22-compatibility-layer-removal-records-dogfooding.md](2026-10-22-compatibility-layer-removal-records-dogfooding.md).

## Checkouts

- Harness: `/workspaces/ramify-agent`, branch `main` at `58a685db`, which
  includes the merged Plan 42 (`b090d493`) and the merged records plan
  (`c4dc1f77`). Pins `ramify.ts` 0.5.2 and `ramify-audit` 0.12.0, installed
  pi 1.3.0 and codex 0.163.0 unchanged from the records run.
- Target: `/workspaces/worktrees/compat-continuation-assisted-20261022`,
  branch `feat/compat-continuation-assisted-20261022`, created from `main`
  at `58a685db` with `npm ci`. Clean at launch.

## Deliverable

The seven retired continuation, policy and limit forms removed as the plan
requires, with the three documentation changes, in four iterations, assessed
by ramify-agent per iteration and cumulatively.

## Execution

Launched 2026-10-22 14:31 UTC from the harness checkout:

```sh
./node_modules/.bin/tsx src/main.ts coordinate start \
  --project /workspaces/worktrees/compat-continuation-assisted-20261022 \
  --plan compatibility-layer-removal-continuation --replace-mcp ramify-agent \
  --model gpt-6-astra --worker-model gpt-6-sol --assessment-model openai/gpt-6-sol \
  --message-file <task directions> --timeout-ms 540000 --json
```

- Coordinator `coord-1a60d4d2-c18c-42d8-b1ba-c15e235cbfa9`, Codex thread
  `01a16405-e007-7fd3-90f4-66152f1382c0`, endpoint `http://127.0.0.1:32869`,
  owner PID 3540476.
- Assisted job `20261022T143108Z-5a8e97`, records under
  `plans/compatibility-layer-removal-continuation/.harness/jobs/20261022T143108Z-5a8e97/`
  in the target worktree.
- Task directions: the plan's four proposed iterations, 1 and 3 in parallel
  where files do not overlap, 2 in parallel with anything, 4 last; re-verify
  each finding by identifier before removal; a worker that sees a constraint
  contradict an outcome says so rather than leaving work undone; if the
  final assessment lacks full-suite evidence, run `npm test` once on the final
  candidate and re-request the final.

## Iterations 1 to 3 in parallel

The coordinator started iterations 1 (`it-6afbeffe`, autonomous readers),
2 (`it-e20c4375`, assisted document and review readers) and 3 (`it-8efbd46c`,
rounds and judges) together, as the task directions allowed.

- Iteration 2 ended on `826a688a` ("Remove retired assisted document and
  review readers"). `as-0001` cleared its audit (default mode, 4218 root
  tests) and came back action-required with two review findings:
  `finding:predecessor-retired-review-reused` (a retired predecessor review
  can still be reused through predecessor selection, retained answers and
  approval) and `finding:phase-event-advertises-retired-round-cap` (the
  phase-start event still announces `maxRounds: 3` after the round cap was
  retired). Reconciliation related them as distinct and combined them into
  one repair goal.
- Iteration 3 ended on `f39ca09a` ("Remove retired round and judge limits").
  `as-0002` failed its audit at 15:13: 26 failing tests, none of them
  timeouts, all caused by the candidate itself. The candidate narrowed
  `runSingleSession` to `run-policy/8` only, which the plan requires, but
  the test helper `subs/harness/src/tests/helpers/runs.ts` still builds
  `run-policy/7` records for non-continuity runs, so 21 single-session tests,
  two scratch-setup tests and the two single-session boundary tests end
  `not-started`. The remaining failure is the union-producer inventory in
  `composition.test.ts`, which names a nonfunctional-phase test the
  candidate renamed. Reconciliation left both review findings open on this
  candidate and noted the failed audit as a separate required check. Audit
  report `e890c4ed`, evidence
  `evidence/cffe2fc92f381a138c51f00e2e44f0f86a829ed3241c0eda8ed8a8a0d4acec11.json`.
- No observer intervention: the regressions are within the workers' reach
  and the findings need no plan clarification.
- Iteration 1 ended on `b0506b91` ("Remove successor-run continuation
  compatibility"), stacked on `65ef491b` (repair of the predecessor-review
  finding) and the other two candidates. `as-0003` review opened
  `finding:retired-log-reported-as-absent`: a run log beginning with the
  retired `restart-prepared` event is skipped with a generic "unreadable or
  incompatible" note instead of the diagnostic the plan's acceptance table
  requires. Its audit (report `7da47875`, full suite) failed with 60 failures
  in 37 files: 16 timeouts under load, and the rest mostly scripted-Git
  fakes seeing an unscripted candidate-tree preview
  ("Git was asked for tree preview 1; this scenario scripts 0",
  "previewCandidateTree: expected 'revision-03' to be 'revision-01'"), which
  points at the candidate's committing-gate change. The reviewer could not
  run tests in its detached checkout (`vite` missing there), so review
  evidence was code-only; the audit covered the gap.
- `as-0004` on `55fd5566` (16:47): review opened
  `finding:unrelated-load-errors-blamed-on-run-log` (the new refusal
  attributes every load failure to `events.jsonl`, including malformed
  `job.json`) and `finding:provider-failure-test-replaced-with-normal-end`
  (fixture commit `55fd5566` swapped a failed contract-engineer invocation
  for a normal end). Audit report `6a8c5892` failed with 8 failures in 5
  files, down from 60: four fixtures still lacking a scripted tree preview,
  a stale composition inventory entry, one review-stop recovery case and
  the known unstable plan-evidence test. Reconciliation confirmed the
  retired-log finding fixed and set both review repairs as goals.
- Observer message not delivered. At 16:14 I queued a note asking the
  coordinator to record why the KPI and acceptance fixture expectations
  changed (the fixtures moved from the retired policy 7 to the current
  policy 8, which previews trees and attributes lines differently; the old
  expectations pass on `main`). `coordinate send` answered `busy` on every
  retry for an hour: the coordinator's single Codex turn has spanned the
  whole run since 14:31, so a send can only land after an interrupt. The
  review caught the fixture-weakening pattern on its own at `as-0004`, so
  the interrupt was not justified and the note was dropped. Harness
  observation: an observer has no way to hand the coordinator a non-urgent
  note during a long turn; a queued-for-next-idle delivery would fit.
- `as-0005` on `ef9cd085` (17:18, after `5e1571a2` scripted the
  engineer-failure fixtures and `ef9cd085` typed the load refusal by failed
  record and restored the failed-provider witness): review with no concerns,
  audit passed in partial mode (report `1d64488e`), gate clear at 17:38.
  The iteration 1 to 3 stack is accepted; iteration 4 follows.

## Iteration 4

Started 17:41 (`it-5911b972`, base `ef9cd085`). Candidate `f64fa67f`
("Remove retired snapshot, scope, and recovery command forms", 33 files) at
17:48, then `368cb831` moved the remaining fixtures to the current snapshot
and scope forms. `as-0008` (18:01) on `368cb831`: audit passed the full suite
(report `0340e819`; the known unstable plan-evidence test timed out once and
cleared on retry); review opened
`finding:nonfunctional-write-scope-error-lacks-record` (the tightened write
scope schema refuses a retired nonfunctional repair assignment with raw
schema issues instead of the diagnostic naming the record and expected form);
protection reported `docs/harness.spec.md` as a protected change without an
exact authorization. Gate action-required with one repair goal.

Protection acceptance recorded by the coordinator. At 18:20:53 the coordinator
called `protection_accept` for `docs/harness.spec.md` (blob `075bc67f` to
`05988345`) with actor "user Dan", citing as governing record the task
directions ("the three documentation changes the plan requires") and the
plan's constraints, which name exactly these two sentence replacements. The
diff contains only those replacements. The usage guide says the command
records an existing user decision and the coordinator must not treat its own
explanation as authorization; Dan was not shown the exact diff before the
acceptance. The observer had raised the diff to Dan at 18:20 and had no
answer yet. Governance observation: plan-level authorization of a named edit
was treated as acceptance of the exact diff; whether that is acceptable is
Dan's call, and restoring the baseline content would clear the check.
- `4436c2e6` ("Name current scope form in nonfunctional assignment
  refusals", 18:21) repaired the diagnostic. `as-0009` (18:22): review with
  no concerns, protection authorized, audit passed (partial mode, 17 min:
  the selector reached the root module, so the root vitest suite ran whole;
  only the codex and pi nested suites were narrowed). Gate incomplete at
  18:46 with the finding fixed and one evidence gap: the reviewer ran before
  the audit finished and saw only its start, and no full-suite result exists
  for the pinned commit, so the plan's final verification obligation is
  neither met nor failed. This is the gap the task directions anticipate for
  the final: run `npm test` once on the final candidate and re-request.

## Final cumulative assessment

`as-0010` (kind final, requested 18:47) on `4436c2e6` against the registered
baseline `58a685db`: audit reused the as-0009 pass for the same tree,
protection authorized, whole-plan review found every removal, the CLI
narrowing, the three documents and the diagnostics in place. Gate incomplete
at 18:50 with the anticipated evidence gap only: the plan requires a full
`npm test` on the final candidate, and the assisted audit ran in partial
mode (`subs/harness/subs/assistance/src/audit.ts` hard-codes
`project-default` for every assisted audit, including the final). The
partial run had in fact executed the whole root suite (440 files), but its
mode label is partial, so the reviewer cannot take it as full-suite
evidence. The review asked for the directed native-worker `npm test` once at
this exact candidate and a reassessment, which the task directions already
instruct.
- Partial-audit observation written up separately in
  [2026-10-22-partial-audit-narrowing.md](2026-10-22-partial-audit-narrowing.md).
- Directed full-suite run and the clarification that ended it. The
  coordinator had a worker run `npm test` unthrottled on `4436c2e6` at
  18:56 (load average 14 on the 12-core host): 5 failures, four timeouts
  (coordinator-publication and project-boundary boundary tests at 120 s,
  the known unstable plan-evidence test, contract-revision-scripted at
  25 s) and one HTTP 409 race in the execution-breakpoints boundary test.
  It re-requested the final as `as-0011` at 19:00 with that evidence,
  stating it did not establish a full-suite pass. Dan asked why the plan
  demands more than the audit. Trace: the plan's constraints require only
  type-check, check:self and the configured audit; the "full `npm test`"
  phrase came from the iteration 4 recommendation written when the plan
  was adapted to assisted execution (`10d6ef19`), and the task directions
  repeated the records-run workaround. The configured agent-tests check is
  `npm test --maxWorkers=4`, so the separate run duplicated the audit under
  worse conditions. At 19:02 the observer interrupted the coordinator's
  turn (the only way to deliver a message, see above) and sent a
  requirement clarification: the configured audit is the plan's test
  verification; a separate run is not required and its load failures are
  not findings. The coordinator was asked to commit the clarification as
  `requirements-2026-10-22-verification.md` and re-request the final with
  it pinned. Lessons: do not write "full npm test" into a plan's
  verification notes when the audit already runs the suite; the harness
  should let an assisted final request a full-mode audit instead of a
  worker rerun (`subs/harness/subs/assistance/src/audit.ts` hard-codes
  `project-default`).

## Outcome

Dan closed the plan at 19:05 on the configured audit: "if the current version
passed audit, consider the plan done". State at close:

- Deliverable: branch of `/workspaces/worktrees/compat-continuation-assisted-20261022`,
  code candidate `4436c2e6` (15 commits on the registered baseline
  `58a685db`), plus `daf90764` (the verification clarification in the plan
  directory) and the audit flakiness counter commit that follows it.
- Verification of `4436c2e6`: configured audit passed (`as-0009`, report
  `61b07cbd`, partial mode that executed 440 of 498 test files; the full
  audits at `0340e819` on the previous commit `368cb831` and at `6a8c5892`
  earlier also passed every non-test check). Whole-plan review accepted at
  `as-0010` with no repairs or decisions. Protection: the one protected
  change (`docs/harness.spec.md`) authorized as `cfd-0015`. Every review
  finding of the run (six) was repaired and confirmed fixed.
- Not obtained: a clear final gate. `as-0010` and `as-0011` were incomplete
  and action-required only over the separate full `npm test` reading;
  `as-0012`, re-requested on `daf90764` with the clarification pinned, was
  interrupted when the host was stopped at 19:05.
- Harness host stopped with `coordinate stop` (descendants settled,
  supervisor exited). Job `20261022T143108Z-5a8e97`, iterations
  `it-6afbeffe`, `it-e20c4375`, `it-8efbd46c`, `it-5911b972`, assessments
  `as-0001` to `as-0012`.
- Elapsed: 14:31 to 19:05, four and a half hours, of which about 108 minutes
  were audits and roughly two hours the test-fixture migration from the
  retired run policy.

Merge into `main` is pending. `main` moved to `e75972b5` (ramify-audit
0.12.1) after the registration baseline, so the branch needs `main` merged in
and a verification of the merged tree before a merge commit, as the records
plan did.
