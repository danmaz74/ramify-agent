# Compatibility layer removal, records part: assisted execution

The user asked for `plans/compatibility-layer-removal-records/plan.md` to run
through the assisted path while Plan 42 (descriptive identifiers) continues on
its own branch. The original single plan was split on 2026-10-22 into a records
part and a continuation part; see the
[overview](../../plans/compatibility-layer-removal/plan.md).

## Checkouts

- Harness checkout: `/workspaces/ramify-agent`, branch `main`. This is the
  latest ramify-agent: 180 commits ahead of `origin/main`; `ramify.ts` pin
  0.5.2 and `ramify-audit` pin 0.12.0 match the installed packages; Pi 1.3.0;
  `node_modules` installed after the last lockfile commit `cb78623a`. The Codex
  coordinator and module-work skills under `~/.codex/skills/` link to this
  checkout's `.agents/skills/`.
- Target worktree: `/workspaces/worktrees/compat-records-assisted-20261022`,
  branch `feat/compat-records-assisted-20261022`, created from `main` and
  fast-forwarded to the commit that adds the split plans. Dependencies
  installed independently with `npm ci`.
- Plan 42's assisted job keeps running in
  `/workspaces/worktrees/plan42-assisted-20261021` under its own project lock
  and its own harness worktree; the two executions share no checkout.

## Deliverable

The records plan: the earlier session layout, `/1` delivery manifests and
intents, inline-body session-store transactions, `scope-size/1` and Pi
`0.87.1` readers removed, with the plan's acceptance assessed by ramify-agent
per committed iteration and cumulatively.

## Execution

Launched 2026-10-22T07:03:59Z from the harness checkout at `91f6de7c`:

```sh
node --import tsx src/main.ts coordinate start \
  --project /workspaces/worktrees/compat-records-assisted-20261022 \
  --plan compatibility-layer-removal-records --replace-mcp ramify-agent \
  --model gpt-6-astra --worker-model gpt-6-sol --assessment-model openai/gpt-6-sol \
  --message-file <task directions> --timeout-ms 540000 --json
```

- Coordinator: `coord-0cecf031-e777-451d-bfce-8406012afb1b`, Codex thread
  `01a1626c-8191-74e1-a8b9-357358ee84bb`, endpoint `http://127.0.0.1:41279`,
  owner PID 2003584.
- Assisted job: `20261022T070359Z-22e31a`, records under
  `plans/compatibility-layer-removal-records/.harness/jobs/20261022T070359Z-22e31a/`
  in the target worktree; baseline commit `91f6de7c`.
- Task directions: implement the plan's three proposed iterations, iteration 1
  alone and 2 and 3 in parallel where files do not overlap; respect the
  reserved-for-continuation constraint strictly; commit candidates on the
  branch; let RA run the configured audit; finish with the cumulative final
  assessment.

Observe with `coordinate status --project <target> --json` and
`coordinate watch --project <target> --id <coordinator> --after <cursor> --json`
from the harness checkout.

## Iteration 1 and the listing revision

- `it-7d81699b` (sessions, focus `subs/harness/subs/projections`). Candidate
  `3f4c17cb` removed the earlier layout; `as-0001` passed audit and returned
  `incomplete` with two coverage findings (no HTTP witness listing two
  manual-run sessions; a lost committed-run refusal witness).
- Repair `9016bb1d` closed both; `as-0002` passed audit and returned
  `incomplete` with two new findings about the newly added manual-session
  listing: run links the service cannot serve, and a crashed session shown as
  live. On main, manual runs were never listed, so these were gaps of a new
  listing rather than regressions.
- The user directed that listing manual sessions is not required. The pinned
  revision `plans/compatibility-layer-removal-records/requirements-2026-10-22.md`
  (main `af5f4fd5`) replaces the listing scenario. The coordinator's turn was
  busy on the moot repair (`8f3dfa90`, `as-0003`), so the external observer
  sent `coordinate interrupt` and then `coordinate send` with the revision; the
  coordinator cancelled `as-0003` and produced `57d32530`, which deletes the
  manual-sessions reader and commits the revision document byte-identical to
  main's copy.

## Iterations 1 to 3 after the revision

- Iteration 1 ended on `b296e344` (drop the unreachable session reach, verify
  reopened-run parity); `as-0005` cleared with the pinned revision.
- Iteration 3 (`it-0752018b`, session store) produced `a5493bc2`, which
  removes the retired inline-body transaction replay; `as-0006` cleared.
- Iteration 2 (`it-bf0cb314`, focus `subs/harness/subs/task-execution`) took
  five candidates:
  - `fac40f91` removed the retired delivery, Pi identity and measurement
    readers. `as-0007` returned `action-required`: `cf-0007`, retired Pi
    observation rows were swallowed as corrupt rows instead of refused with a
    diagnostic; `cf-0008`, the configured audit failed because the
    union-producer test in `subs/harness/src/tests/composition.test.ts` found
    `scope-size/1` in `scopeSizeViewSchema` with no producer. The worker had
    left that enum arm on purpose: the plan's reserved-for-continuation
    constraint said only the manifest, intent and observation schemas change
    in `runs.ts`, while the plan's identifier evidence required `scope-size/1`
    gone from `src/` and `subs/`. A plan-authoring contradiction, not a
    harness defect. The observer committed the pinned clarification
    `requirements-2026-10-22b.md` (main `e80206be`, also widening the
    constraint wording), interrupted the coordinator because it had just
    requested `as-0008` on a candidate that would fail the same check, and
    sent the clarification.
  - `abb6b6ac` repaired `cf-0007`. `as-0008` passed review except `cf-0009`:
    the new refusal also fired for JSON-valid rows with a null or numeric
    `native.source`, which should stay coverage gaps. Its audit re-reported
    `cf-0008` as expected.
  - `c0c2b510` narrowed the enum to the `scope-size/2` literal and committed
    the clarification byte-identical. `31e1cc57` then moved five historical
    extraction notes from `subs/harness/notes/` and
    `subs/harness/subs/projections/notes/` to
    `docs/historical-evidence/projections-extraction/`, unchanged, with README
    links updated: a literal reading of "nowhere in `src/` or `subs/`". The
    observer judged the move coherent and let it stand rather than interrupt
    the repair in flight. Lesson: an identifier-evidence sentence should name
    source files, or exclude notes, explicitly.
  - `fda967e4` repaired `cf-0009`. `as-0009` passed the audit (closing
    `cf-0008`) and opened `cf-0010`: a measurement file holding JSON `null`
    now threw in the KPI baseline reader instead of returning the unavailable
    baseline, because the schema access had moved outside the guarded block.
  - `c7819bea` repaired `cf-0010`; `as-0010` opened `cf-0011`, a test-coverage
    gap (the malformed-root test asserted only the baseline). `b01860cb`
    strengthened the test; `as-0011` cleared at 11:06 UTC.
- Observer mishap: a `coordinate send` retried while the coordinator was busy
  admits the command identity with the message content of the first attempt.
  Editing the message file before a later retry made the host reject the
  command ("Command identity conflicts with its admitted arguments"). Use a
  new command identifier after changing the message.

## Final cumulative assessment

`as-0012` (kind `final`, base `91f6de7c`, candidate `b01860cb`, both
revisions pinned) completed at 11:09 UTC with gate `incomplete`. Protection
clean, review without concerns, audit `passed`, but approval readiness recorded
one verification gap: the plan's completion condition asks for the full test
suite on the cumulative result, and the final audit reused the default-mode
evidence of `as-0011`, which covered type-check, self-check and the 13 focused
KPI tests selected by the last commit's drift.

Harness finding: `subs/harness/subs/assistance/src/audit.ts` hard-codes
`mode: 'project-default'` for every assisted assessment, including `final`,
whereas the autonomous acceptance path runs its final checkpoint with
`audit: 'full', nested: true`
(`subs/harness/subs/autonomous/subs/acceptance/src/checks/checkpoint.ts`).
The coordinator has no way to request a full-scope audit, so a final
cumulative assessment whose last candidate is small can never present
full-suite evidence; default mode scopes the audit from the candidate's parent
rather than from the plan baseline. Fix candidate: run `final` assessments
with `mode: 'full'`, or let the assessment request carry the mode. Left for a
harness fix outside this run; the live host (PID 2003584) runs the older code.

The coordinator closed the gap itself. A worker ran `npm test -- --maxWorkers=4`
on unchanged `b01860cb` (11:09 to 11:27 UTC): 4136 passed, 1 failed, 2
skipped. The failure was a 25 s timeout of the unchanged
`subs/harness/subs/autonomous/subs/work-coordination/src/tests/contract-revision-scripted.test.ts`
(observed 25.13 s; this job's earlier full audits ran it in about 18 s) while
another session's four-worker audit shared the 12-core host at a load average
near 9. `as-0013` (11:28 to 11:39) accepted the implementation conclusions and
opened `cf-0012`, the unmet full-suite condition, with the instruction not to
weaken the test or call the partial audit a full pass. The coordinator
investigated the environment read-only, found the same contention, and ran one
complete suite at `--maxWorkers=2` (11:41 to 12:04): exit 0, 4137 passed, 2
skipped, no test, timeout or source change. `as-0014` (12:05 to 12:07) decided
`cf-0012` fixed on that evidence and completed with gate `clear`.

## Outcome

- Branch `feat/compat-records-assisted-20261022` at `b01860cb`, 13 commits
  above baseline `91f6de7c`: 129 files changed, 892 insertions, 6204 deletions.
  Two pinned requirement documents are committed on the branch and on main.
- The five retired identifiers appear nowhere in `src/` or `subs/`; the
  session-store event union carries `session-store-commit/2` only; the two
  fixture trees and the compatibility helper are gone.
- Fourteen assessments: six iteration ends (`as-0005`, `as-0006`, `as-0011`
  clear), twelve check findings decided fixed or moot, three final passes.
- Harness findings for follow-up: the assisted final audit's fixed default
  scope (above); the busy-send command identity conflict (above). Plan
  authoring lessons: a file-scoped "only these schemas change" constraint must
  not contradict identifier evidence; identifier evidence should name source
  files explicitly.
- Elapsed 07:04 to 12:08 UTC. The host (PID 2003584) and coordinator thread
  were left running for inspection; `coordinate stop` closes them.
