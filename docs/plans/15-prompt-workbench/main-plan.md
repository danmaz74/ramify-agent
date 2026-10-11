# Plan 15: the prompt workbench

**Date:** 2026-09-26. **Status:** superseded by [Plan 30](../30-harness-steps/main-plan.md) for capture and replay (2026-10-10); not implemented as written. **Source inspected:** ramify-agent
`5a1934aa`. The [decisions to confirm](#decisions-to-confirm-before-coding)
are open.

## Outcome

A person improving a role's prompt picks a recorded invocation from a real
run. The workbench puts a fresh agent session in the same situation that
invocation started in: the same project tree, generated views, system
prompt, first message, tools, guard, checks, validator, bounds and model. It
runs the session to its end, evaluates the result and discards the copy. It
then repeats the trial with edited prompt templates and compares the
variants.

```text
real run ── invocation start ──> case.json + tree snapshot ref      (harness, always on)
                                     │
      ramify-agent case export ──────┘──> case directory             (harness CLI)
                                              │
bench import ─> bench render (no model) ─> bench run experiment ─> report
                     │                          │
                     └── ramify-agent replay ───┘ per trial, in a disposable copy
                         (--render-only | --agent pi | --agent fake)
```

The work is split between two projects:

- **ramify-agent** gains what only the harness can supply:
  - capture of each invocation's starting situation;
  - export of that capture as a portable case;
  - a `replay` command that starts one role invocation from a case, built by
    the same functions a run uses;
  - an override directory for prompt templates.
- **The bench** is a separate application in `ramify-agent/bench/`, with its
  own package, lockfile, compiler scope and tests. It owns cases on disk,
  project copies, experiments, repetition, evaluation and reports. It consumes
  ramify-agent only through its CLI, its record files and the schemas its
  package entry exports. It never imports harness source or pi.

## Why this plan is needed

Prompt changes are tested today by full runs of 15 to 60 minutes, or by
hand-made replays. The [contract engineer investigation](../../analysis/2026-09-26-contract-engineer-replay.md)
shows the cost of a hand-made replay:

- Its [runner](../../analysis/2026-09-26-contract-engineer-replay/replay.mts)
  imports harness internals by relative path from an extracted copy of the
  trial's harness revision.
- It reassembles the session spec by hand and reuses the captured prompt text.
- It works for one invocation at fixed absolute paths.

Nothing verifies that such a replay matches what the run gave the agent, so
a prompt tuned on it may be tuned on a replica.

An inventory at `5a1934aa` shows what a faithful replay lacks:

| Part of the starting situation | Recorded today |
| --- | --- |
| System prompt, first message | Exactly, in the transcript `started` entry and `blobs/` |
| Model, thinking level | Yes |
| Working tree | No. `invocation.base` is the last accepted commit, and engineers often start on uncommitted trees after partial iterations or failed gates. |
| Working directory, tool set, equipment configuration | No. The spec built at `run/service.ts:3717` holds closures and is not written. |
| Validator evidence | No. It is built at turn start from run state, and parts are re-read live (`declarationContext`, `contractsConsumedBy`, the registry). |
| Harness revision, pi version | No |
| Template contents | Hashes only. Templates load from fixed `import.meta.url` paths (`prompts/packages.ts:37-68`), with no override. |

Two defects surfaced during this inventory, and both are fixed here because
the template validation in iteration 2 would refuse them:

- `nonfunctional/coordinator.system.md:5` and `nonfunctional/repair.system.md:3`
  write `{procedure}`. `fill` replaces only `{{…}}`, so the coordinator and
  the repair engineer never receive their procedure.
- `context-selection/selector.system.md` has neither `{{procedure}}` nor
  `{{submissionSchema}}`. `selector.procedure.md` is hashed into the package
  and never rendered.

## What binds this plan

- **ramify-agent's [instructions](../../../AGENTS.md).** The harness is the
  only writer of durable state and owns the formats it publishes.
- **The bench's dependency direction.** The bench depends on ramify-agent
  exactly as ramify-agent depends on the toolkit:
  - through a `file:..` link;
  - through the CLI and the files it writes;
  - through schemas exported for types and validation only.

  Nothing in ramify-agent imports from the bench, names it or reads its files.
- **Test and audit rules.** No test calls a model; every test uses the scripted
  agent. Iterations run type checks, focused tests and `npm run check:self`.
  The full suite runs only through ramify-audit, on the baseline and on the
  final commit.
- **The replay does not reinterpret.** It builds the spec from captured
  inputs with the same functions the run calls: renderers, message builders,
  equipment and validators. Where it cannot, it refuses and says why. A
  replay that silently differs from the run is the failure this plan exists
  to prevent.

## The subdirectory

The bench lives in `ramify-agent/bench/`, the arrangement the toolkit already
uses for `ramify-agent/`:

- **Configuration.** It has its own `package.json`, `package-lock.json`,
  `tsconfig.json`, `vitest.config.ts` and `README.md`. ramify-agent's
  `tsconfig.json` selects only `src/**` and `subs/**/src/**`, and its Vitest
  projects include only those trees, so the bench is outside both today.
  Iteration 5 adds an explicit `"bench"` exclusion anyway, as the toolkit
  excludes `ramify-agent`.
- **Ramify.** It is a nested independent project with its own configuration,
  which the [CLI invocation contract](../../../../docs/architecture/cli-invocation.spec.md#files-outside-modules)
  leaves silent. In this version it has no `module.ramify`; see
  [decision 2](#decisions-to-confirm-before-coding).
- **Generated files.** Its cases, copies and results go under a gitignored
  `bench/work/`, unless `BENCH_HOME` names another place.
- **Extraction.** It moves with ramify-agent when that project leaves this
  repository, or to its own repository. Nothing in ramify-agent has to change
  for either move.

## Contract to implement

### 1. Invocation capture (harness)

The harness captures every invocation at the end of `startInvocation`
(`run/service.ts:3534`), after the transcript's `started` entry. It captures
every standalone session at the same point in `sessions/single.ts`. Capture
has two parts.

**Tree snapshot.** A new named operation in the evidence module's
`GitService` does the following:

1. Writes the working tree into a temporary index:
   `read-tree HEAD`, `add --all`, `write-tree`, as
   `evidence/src/candidate-tree.ts:46` already does.
2. Commits that tree with `HEAD` as parent.
3. Points `refs/ramify-agent/snapshots/<run>/<invocation>` at it.

Ignored files are excluded, as in every candidate tree. That covers
`node_modules`, generated views and the run directory. The working tree,
the index and `HEAD` are never touched. The run's scripted `GitService` gains
the operation. Real Git is exercised only in the evidence module's own Git
tests.

**`invocations/<id>/case.json`**, schema `ramify-agent.invocation-case/1`,
committed with the `invocation-started` records. Standalone sessions write
`sessions/<id>/case.json`.

| Field | Content |
| --- | --- |
| `invocation` | Run, invocation, session, role, turn (such as an extractor turn and its document), work, attempt |
| `runtime` | Harness revision and whether its checkout was dirty; executor name and version; requested model |
| `project` | Root as captured, run directory as captured, `base`, `snapshot` commit, architect view input identity, API view identities |
| `prompt` | Package, package hash, `inputsHash`, the transcript blob hashes of the system prompt and first message |
| `session` | Start mode; for `fork` and `continue`, the parent ref |
| `equipment` | Working directory relative to the root or the run directory; built-ins; each harness tool's name, description, input schema, action and mutation; the submission tool's name, description and schema; write scope and guarded paths, relative; test policy; context policy; bounds |
| `replay` | For a replayable role, `{ kind: <role>, inputs }` holding the message builder's input and the validator's evidence as the run passed them, serialized with their existing schemas, plus the run-directory files they cite. For any other role, `{ kind: 'unavailable', reason }`. |

The first version supplies `replay.inputs` for fresh starts of three roles
([decision 1](#decisions-to-confirm-before-coding)):

| Role | Builder input | Validator evidence |
| --- | --- | --- |
| engineer | `IterationBriefing`, including the delivered package text, handoff, failed gate and scenarios | `EngineerEvidence`: kind, obligation, scenarios, seams, open findings, a declaration-context snapshot, registry providers |
| contract engineer | `ContractBriefing` | `ContractEvidence`, with the index identity (the index is re-materialized from the snapshot) |
| initial architect | The `analysisMessage` inputs: run record fields, plan text, `ExtractionInputs`, incorporation | `AnalysisEvidence` minus the index, which is re-materialized; the captured documents it cites |

A start by `continue` or `fork`, or a reconstructed session, records
`unavailable` with its reason. Evidence the validator reads from the file
system, such as the engineer's completion check or the contract validator's
`stat`, is not captured. The replay reads it from its copy, which holds the
same tree.

### 2. Prompt overrides and template validation (harness)

- `PromptPackageOptions.promptDirectory` names an overlay root. For each
  template path (`prompts/…`, `analysis/…`, `context-selection/…`,
  `nonfunctional/…`), a file present under the overlay replaces the built-in
  one, and an absent file keeps it.
- The manifest records each file's origin (`built-in` or `override`) and its
  hash, so a package hash says which variant ran.
- Loading validates every template. A `{{name}}` its renderer does not supply,
  or a supplied name the system template never uses, is an error before any
  session starts. So is a single-brace `{name}` that matches a supplied name.
- The option is threaded through `RunServiceOptions` and `SingleSessionOptions`
  and exposed as a flag on `serve`, `session` and `replay`.
- The two defects above are fixed in their templates, and the version
  comments of those packages are raised.

### 3. Case export and replay (harness)

```text
ramify-agent case export --run <run dir> --invocation <inv-NNNN> --out <dir>
ramify-agent case export --session <session dir> --out <dir>
ramify-agent replay --case <dir> --project <copy> [--prompts <dir>]
                    [--render-only | --agent pi [--model <provider/model[:level]>] | --agent fake --script <file>]
                    [--records <dir>] [--gate]
```

**`case export`** writes a self-contained case directory:

- `case.json`;
- the run-directory files the inputs cite;
- the recorded transcript, its blobs and pi's session file, under `reference/`;
- a Git bundle with the snapshot commit and its history, plus `base`;
- `export.json`, which holds the harness revision that exported it.

It refuses an `unavailable` case.

**`replay`**:

1. Refuses when the copy's `HEAD` tree is not the snapshot tree, or the copy
   is dirty.
2. Takes the project lock and materializes the views. A differing architect
   view input identity is recorded as a fidelity difference.
3. Loads the packages, with the overlay if given. Renders the system prompt
   and first message with the role's renderer and builder from
   `replay.inputs`, substituting the copy's root and a replay run directory
   for the captured absolute paths.
4. Builds the equipment, guard, post-write hook, submission judge, bounds and
   context policy with the functions the run uses.
5. Writes a fidelity report to `replay.json`, which compares:
   - the system prompt and first message with the reference blobs, after path
     substitution;
   - the tool definitions with `case.json`;
   - the view input identity;
   - the harness revision and executor version.

   Each item is `equal`, `variant` (it differs and a prompt overlay was
   given), `different` or `unknown`.
6. With `--render-only`, stops there and writes the rendered texts. Otherwise
   it starts one session through a shared invocation runner and writes the
   records `session` writes today under `--records`. `--gate` runs the
   engineer's iteration checkpoint, as `session --gate` does.

The invocation runner is extracted from `sessions/single.ts:331-508`, and
`session` and `replay` both use it. The run keeps `runSession`. The drift
test in iteration 3 is what binds replay rendering to the run.

**Exit status:** 0 when the session submitted and any gate passed; 1 when the
session ended any other way; 2 when the replay was refused or could not
start. A `different` fidelity item does not refuse a replay. It is reported,
and the bench decides.

**Package surface:**

- a `bin` entry, `ramify-agent`, a shell wrapper that runs `tsx src/main.ts`
  from the package's own directory;
- an `exports` entry, `./cases`, for the case, replay-result and session
  record schemas, as TypeScript source until the project is built for
  release.

### 4. The bench (separate application)

```text
npm run bench -- import (--run <dir> --invocation <id> | --session <dir>) --name <case>
npm run bench -- cases
npm run bench -- render --case <name> [--prompts <dir>] [--harness current|recorded|<path>]
npm run bench -- run <experiment.json>
npm run bench -- report <results dir>
```

- **Import.** Calls `ramify-agent case export` into `work/cases/<name>/`. A
  case may hold `expectations.json`, written by a person.
- **Copy.** A trial copy is a clone of the case bundle, checked out at the
  snapshot. Dependencies come from a seed cache keyed by lockfile hash, which
  runs `npm ci` once per seed; an experiment may add setup commands. The copy
  is deleted after evaluation unless `--keep` is given. Its patch against the
  snapshot is kept.
- **Harness.** A variant runs the current ramify-agent by default. With
  `recorded`, the bench prepares a Git worktree of the case's harness
  revision, with dependencies from the current checkout, and runs that
  revision's `replay`. This keeps old cases usable after the harness changes.
- **Render.** Runs `replay --render-only` and prints the fidelity report and
  a diff of each rendered text against the reference. It costs no model call.
- **Experiment** (`ramify-agent-bench.experiment/1`):

  ```json
  {
    "name": "contract-design-procedure",
    "cases": ["contract-i02"],
    "variants": {
      "baseline": {},
      "design-first": { "prompts": "variants/design-first" }
    },
    "repeats": 3,
    "parallel": 2,
    "model": "recorded",
    "gate": false
  }
  ```

  Each trial writes `work/results/<experiment>/<stamp>/<variant>/<case>/<n>/`,
  holding `replay.json`, the records, the patch and `evaluation.json`.
- **Evaluation** (`ramify-agent-bench.evaluation/1`) reads only the records:
  - the outcome;
  - submissions accepted and rejected;
  - tool calls by action, failed calls and guard denials;
  - reads outside scope;
  - post-write findings raised and standing;
  - tokens in, out and cached;
  - cost, elapsed time and peak context;
  - changed paths;
  - the gate verdict, where one ran.

  Expectations are simple checks on the submission (a JSON pointer that
  equals or matches a value, or a minimum count), on changed paths (globs that
  must or must not change) and on reads (globs that must not be read).
- **Report.** `report.md` and `report.json` give, per case and variant, the
  count of submitted, gated and expectation-passing trials, and the mean,
  minimum and maximum of each numeric measure. They also include:
  - the recorded original as a reference row;
  - the fidelity summary;
  - the rendered prompt diff against the baseline variant;
  - links to every trial's transcript, for the side-by-side reading that
    judges quality in this version.

## Failure cases the design must prevent

| Problem | Required behavior |
| --- | --- |
| A replay built by code other than the run's drifts unnoticed | The drift test renders every replayable invocation of a scripted run and requires `equal` on every item |
| A replay starts on a different tree than the recorded one | `replay` refuses when the copy's `HEAD` tree is not the snapshot or the copy is dirty |
| Capture changes the project | The snapshot uses a temporary index; the working tree, index and `HEAD` are unchanged, verified before and after |
| An overlay template drops a placeholder, or leaves one unfilled, and the session runs with a broken prompt | Loading refuses before any session starts |
| A continued or forked invocation replayed as a fresh one | Its case is `unavailable` with the reason, and export refuses it |
| Differences hidden inside a mean | The report lists every trial with its outcome and links, beside the aggregates |
| The bench grows a copy of harness logic | The bench imports only the exported schemas and calls only the CLI; its tests fail if it imports any other ramify-agent path |
| A case goes stale after a harness change | The fidelity report names the differing items, and `--harness recorded` replays on the capturing revision |
| A variant's hash does not say what changed | The manifest records each file's origin and hash, and `replay.json` carries the manifest |

## Implementation order and evidence

Tests use the scripted agent and fixtures only. Each iteration runs
`npm run type-check`, the changed owners' focused tests and
`npm run check:self` from `ramify-agent/`, and from iteration 5 the bench's
own type check and tests. The full suites run only through ramify-audit, with
`audit/plan15-prompt-workbench.request.json`. That request is derived from
Plan 14's and adds `bench-typecheck` and `bench-tests`, with the bench's
dependencies installed in the audit worktree the way ramify-agent's are.

| Iteration | Change | Exit evidence |
| --- | --- | --- |
| 0. Baseline | The audit request; ramify-audit on the baseline commit | Audit result recorded |
| 1. Capture | `GitService` snapshot operation; `ramify-agent.invocation-case/1` in `interfaces/protocol/cases.ts`; capture in `startInvocation` and `single.ts`; replay inputs for the three roles; `unavailable` for every other start | A scripted run on the fixture writes a `case.json` for every invocation; the three roles' fresh starts carry inputs that parse with their schemas; forks and continues are `unavailable` with reasons; the Git module's own test shows the snapshot tree equals the working tree with an untracked file and leaves `status`, index and `HEAD` unchanged |
| 2. Overrides | `promptDirectory` overlay, origins in the manifest, template validation, the coordinator, repair and selector template fixes | An overlay replacing one file changes only that file's hash and origin; an unfilled, unknown or single-brace placeholder is refused at load with its file and name; every built-in package loads and validates |
| 3. Export and render | `case export`; `replay --render-only`; path substitution; fidelity report; the invocation runner extracted from `single.ts` | Drift test: a scripted run covering the three roles is exported and each case is replayed render-only in a copy at another path; the system prompt, first message, tool definitions and view identity are all `equal`. It runs in the ordinary suite from here on |
| 4. Replay | Session start from a case with the fake agent and pi; `replay.json`; `--gate`; `bin` and `exports` | A scripted replay writes the same record set as `session`; an overlay yields `variant` on the system prompt only; a dirty copy or a wrong tree exits 2 before any session; `session`'s existing tests pass unchanged on the shared runner |
| 5. Bench foundation | `ramify-agent/bench/` package; exclusions; `AGENTS.md` section and `docs/README.md` entry; import, seed cache, copies, render | Bench tests import a case produced by a scripted standalone session on the fixture, prepare two copies from one seed, render with and without an overlay and show the diff; a check fails on any ramify-agent import other than the exported entry |
| 6. Experiments | Experiment runner, parallel trials, evaluation, expectations, report, `--harness recorded` | A scripted experiment of two variants × two repeats on one case gives a report with every trial listed, correct aggregates and expectation results; copies are removed; a recorded-revision trial runs from a prepared worktree |
| 7. Real trial | Cases captured from one real run, stopped at its review stop, and one standalone engineer session; one experiment on the contract engineer's design procedure or an engineer prompt; final audit | Reported separately with cost and time, asked for before it starts; never inferred from scripted tests. ramify-audit passes on the final commit |

## Acceptance matrix

| Case | Required observable result | Iteration |
| --- | --- | --- |
| WB01 | Every invocation and standalone session has a `case.json`; each role outside the first set, or each start outside `fresh`, says why it is `unavailable` | 1 |
| WB02 | The snapshot commit's tree equals the working tree at invocation start, including untracked unignored files, and capture changes neither the tree, the index nor `HEAD` | 1 |
| WB03 | An overlay replaces only the files it holds, and the manifest shows each file's origin and hash | 2 |
| WB04 | A broken placeholder in any template, built-in or overlay, is refused before a session starts | 2 |
| WB05 | The coordinator and repair engineer receive their procedures, and the selector its procedure and schema | 2 |
| WB06 | A replay without an overlay renders a byte-identical system prompt and first message after path substitution, and identical tool definitions | 3 |
| WB07 | A case exported on one path replays on another | 3 |
| WB08 | `replay` refuses a copy whose tree or cleanliness does not match, with exit 2 | 4 |
| WB09 | A replayed session writes the standalone session record set and a `replay.json` with fidelity, outcome and usage | 4 |
| WB10 | An overlay's effect shows as `variant` on the system prompt and nowhere else | 4 |
| WB11 | The bench runs with its own install and tests, and ramify-agent's type check, suite and `check:self` are unaffected by its presence | 5 |
| WB12 | The bench imports nothing from ramify-agent but its exported entry | 5 |
| WB13 | Two copies of one case are independent and share one dependency install | 5 |
| WB14 | An experiment report lists every trial, aggregates per variant and case, and shows the reference row, fidelity and prompt diff | 6 |
| WB15 | A case replays on its recorded harness revision | 6 |
| WB16 | A real experiment runs the recorded model end to end on the three roles' cases | 7 |

## Not in this plan

- Replaying continued, forked or reconstructed invocations: the global fork,
  local architect turns, scope and design reviews, reconciliation and
  engineer repair. Their cases need the parent's pi session file and a fork
  in the copy. The capture's `session` field already records the parent ref.
- The catalog extractor, the code reviewer, the failure analyst, the context
  selector and the non-functional coordinator. Each needs only a replay adapter
  of the kind iteration 1 adds. The catalog extractor is the first candidate.
- Backfilling cases from runs made before iteration 1.
- LLM judges, rubric scoring and chained outcomes, such as whether an
  architect's assignment leads to a passing engineer session.
- A web view of experiments.
- Varying the delivered package text (Plan 14's package creator); the case
  holds it as delivered.
- Changes to `RunService.runSession` beyond the capture hook.

## Decisions to confirm before coding

1. **The first roles are the engineer, the contract engineer and the initial
   architect, fresh starts only.** The engineer and the contract engineer are
   the roles whose prompts are being worked on now, and the initial architect
   covers the read-only architect path. The catalog extractor follows next.
2. **The bench is a plain package, not a Ramify project, in this version.**
   It then needs no `module.ramify` or `check:self`. Making it one later
   changes no contract.
3. **A case captures the builder's inputs, with the rendered text kept as a
   reference.** Templates can then change, and so can the builders when a
   variant runs another harness checkout.
4. **Substituting the copy's absolute paths counts as the same situation.**
   Keeping the recorded paths would forbid parallel trials.
5. **Only runs made after iteration 1 yield cases.** The hand-made contract
   replay stays as an analysis artifact.
6. **Evaluation in this version is mechanical measures, person-written
   expectations and side-by-side reading.** A judge model is added only after
   a first experiment shows which quality questions the measures miss.
7. **Cases and results live in the gitignored `bench/work/`.** A case holds
   a full-history bundle. A curated case can be committed elsewhere later if
   its size allows.
8. **A variant may name a harness checkout: `current`, `recorded` or a
   path.** Without this, a case captured before a harness change cannot be
   replayed faithfully.
9. **Template validation fixes the three broken templates.** This changes
   what the non-functional coordinator, the repair engineer and the selector
   receive in real runs, which is a behavior change beyond the bench.
