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
