# Prompt review: engineer main (inv-0007)

Run `20261011T104510Z-0e1b47`, plan `status-badge-tone`, collection-review
fixture, `openai-codex/gpt-6.1-sol:high`, pi 0.87.1, ramify-agent `5169117`
(clean main). Evidence root:
`/home/app/ramify-trial-evidence/status-badge-tone-gpt61-20261011T104510Z/`.
Run-record paths below are relative to
`collection-review/plans/status-badge-tone/.harness/jobs/20261011T104510Z-0e1b47/`
unless they are absolute.

## Summary

The prompt was adequate. The engineer had what it needed at delivery, and the
pointers it used resolved with its tools. It finished in 140 s, made 18 tool
calls, and its single `completion-proposed` submission was accepted with no
rejection. ga-0002 then passed all four configured checks. The reviewers
(inv-0008, inv-0009, inv-0012) recorded no concerns. The engineer made no
consultation, hit no tool errors, did no repair, and read no foreign source or
`node_modules`.

There were three needs for a capability owned by another module. The API
views were consulted for all three, and each was resolved correctly without a
new foreign import and without inspecting the provider's source. No
capability request was needed.

There are no high or medium findings. The low findings are about redundancy
and structure:

- About 7 KB of the 29,670-byte task message duplicates other blocks or does
  not apply to this task. The focused Cucumber command appears twice, the
  absolute project root appears 35 times (4,200 B), and 27 fresh-session
  "replaces any earlier value" banners take 1,512 B.
- The completion-evidence block has a broken sentence. It gives no focused
  Vitest command and points to the audit configuration. The engineer read
  `ramify-audit.json` (2,844 B returned), which only repeated the declared
  checks the prompt already listed.
- `environment:supportPaths` gives the engineer harness-internal prompt paths
  (`subs/harness/src/prompts/engineer-capability.*.md`), which do not resolve
  in the target project.
- The block "What the plan asks of this iteration" announces the plan
  elements but holds the working-directory sentence. The elements arrive nine
  blocks later, in `assignment-package`.
- The API view documents `ReviewStatus` only as
  `z.infer<typeof reviewStatusSchema>`. A name search therefore does not show
  its values. The engineer got them from its own source, so nothing was
  affected.

## Coverage

- Kind: engineer, procedure `procedure:engineer:main`
  (SHA-256 `0d4cb9c3…8655`), package `engineer/8`, one variant. The role text
  comes from `subs/harness/src/prompts/engineer-capability.system.md` and the
  procedure from `engineer-capability.procedure.md`, as the run's
  `prompts/manifest.json` records for `engineer/8`. This is the package's
  mapping, not a mis-selection.
- Instance: inv-0007, harness session ses-0006, pi session
  `7dec2997-2fc2-4fa8-9227-36d22c7e8ca8`. It was requested and started fresh,
  with `inheritedPoint: null`. Work wi-001.i01 in
  `collection-review/workspace/shared-ui`, binding sc-001, sc-002 and sc-003.
  Gate ga-0002 passed, and the change is commit `e6356f5` (baseline
  `0244ce2`, accepted boundary `9792902`).
- Artifacts read:
  - Captured delivery: `invocations/inv-0007/invocation.json` (delivered-input
    manifest), `submission.json`, `outcome.json`, `observations.jsonl` (via
    [inventory.json](../inventory.json)) and `transcripts/ses-0006.jsonl`, with
    its blobs resolved.
  - The first and last native requests:
    `collection-review/plans/.harness/session-operations/store/payloads/8c6f168e…1956`
    and `…/9152da07…2e0c`, plus their extracts
    [packet.json](../invocations/inv-0007/packet.json),
    [task.md](../invocations/inv-0007/task.md) and
    [native-first.json](../invocations/inv-0007/native-first.json).
  - Run state: `events.jsonl` (sequences 50–72), the gate ga-0002 records, the
    review submissions inv-0008 through inv-0013, and `git show e6356f5` in
    the copy.
  - Views and project files: the post-run API views under
    `collection-review/subs/workspace/subs/shared-ui/src/.ramify/` and
    `src/tests/.ramify/`, `subs/integration-tests/module.ramify` and
    `src/support/*.ts`.
  - Harness source at `5169117`: `subs/harness/src/prompts/tasks.ts`
    (`deliveredSupportPaths`, `TaskPacket`).
- Captured delivered bytes:
  - System instructions: 10,522 B. The native `instructions` equal blob
    `181b18f7…7a83`, and the first and last native requests are identical.
  - User message: 29,670 B, a single message. The native text equals
    `task.md` and blob `0c519f04…380b`.
  - Tool declarations: eight tools, with a 10,982 B declarations blob.
    `submit_iteration_result` accounts for 5,869 B.
  - The last native request has one user message and 17 call/output pairs.
    The harness appended no messages mid-session: every post-write check
    decision had `text: null`.
- Reconstruction: the API views in the copy carry revision
  `rev/1:703779dd-cce1-490f-843d-1647a6f11987:4` and timestamps of 10:49. That
  is the same revision the briefing names and before the invocation's 10:49:16
  start. I treat them as the delivered views. That is a reconstruction, not a
  retained snapshot.

## Required information

| Need | Status | Where |
|---|---|---|
| Objective | Met directly | `brief:goal`, `brief:requirements`, and the closing "Current task: engineering" block |
| Plan constraints | Met directly | `assignment-package` (fr-001–fr-005, nfr-001–nfr-004) and the architect's approach block |
| Authority and write scope | Met directly | "What you may write" (`subs/workspace/subs/shared-ui/` only), guarded-file rules in the procedure, feature-file refusal in "Binding a scenario" |
| Current state | Met through a pointer | Boundary `9792902` and "Inspect the current files". `starting-points` named the four files the engineer read first, and the step directory was observed empty |
| Dependencies | Met directly or through a pointer | API-view paths for both source areas with revision and coverage count. The approach says to coexist with the registered World and not to import integration-test internals. `cucumber.js` was given as a pointer |
| Execution location | Met directly | `environment:workingDirectory` and `projectRoot`. The system prompt explains how relative paths resolve and when to `cd` to the root |
| Verification | Met for Cucumber; Vitest through a pointer | An exact focused Cucumber command, with the reason a plain run would skip pending scenarios. No focused Vitest command, only "Inspect the project's declared audit and package scripts". The engineer derived `npm test -- <file>` from `package.json` |
| Expected submission | Met directly | `submit_iteration_result` with the full schema in its description. Binding rules appear in "Obligations to bind" and the procedure |

Nothing needed at delivery was missing, contradictory or out of reach. The
coverage limits ("coverage limits: 1" for `src`, "2" for `src/tests`) are
given as counts without saying what they are. They did not affect any
decision here (see Evidence gaps).

**Usable instructions.** There were no unresolved placeholders. Every
absolute path resolved in the run's execution checkout, and every tool the
task named (`read`, `grep`, `ls`, `edit`, `write`, `shell`,
`consult_architect`, `submit_iteration_result`) was declared. The `shell`
tool description says commands run "in the project's working directory",
while the system prompt calls it the starting module's `src/`. The engineer
always used an explicit `cd <root> &&`, so the ambiguity had no effect.

The submission tool's `parameters` is `{"type":"object","properties":{}}`,
with the real schema in its description. A comment on `TaskPacket` in
`tasks.ts` calls this deliberate ("Schema appears once, in this declaration's
description"). The first submission was valid.

## Foreign capability use

Denominator: needs, counted by symbol and consuming source area, to use a
project capability owned outside `collection-review/workspace/shared-ui`.
There were three.

| # | Need | Consumer area and view | Delivered or consulted | Selected symbol and provider | Import and call | Verification | Outcome |
|---|---|---|---|---|---|---|---|
| N1 | The status vocabulary the badge's props are written in | Ordinary `src/` (`status-badge.tsx`); `src/.ramify/` | grep `ReviewStatus\|StatusBadge\|World` in `.ramify/external` (n=10–11). The page shows `ReviewStatus` `[type-only]` | `ReviewStatus` from `contracts` (`src/interfaces/vocabulary.ts`), received through workspace | The existing `import type { ReviewStatus } from '../../contracts/src/interfaces/vocabulary.js'` was kept unchanged. The new `tone` prop is an inline literal union, so there was no new named type to expose | Post-write check passed (n=17). ga-0002 type check and structure passed | Supported by the view: the type-only use matches. No source inspection |
| N2 | Turning a Gherkin `status` string into a `ReviewStatus` value | Testing `src/tests/` (step file); `src/tests/.ramify/` | The same grep in `tests/.ramify/external` (n=12), the correct independent view. The page is identical to the ordinary one | No foreign import. The step narrows with `status === 'passed' \|\| status === 'failed'` and assigns to the local `StatusBadgeProps` | — | Focused Cucumber run, 6 scenarios and 33 steps passed (n=33). ga-0002 passed | Resolved without a foreign import. The values came from the module's own `defaultLabels`, not from the view (see F5) |
| N3 | Living alongside the Cucumber World and hooks registered by `integration-tests` | Testing `src/tests/steps/`; `src/tests/.ramify/` | grep for `World` in both views: no match. The approach said to keep the registered World and not import unexposed internals, and the `cucumber.js` comments say support code registers the World and hooks | Nothing selected. `CollectionReviewWorld` is not exposed: `integration-tests/module.ramify` "exposes nothing" | Steps take `this: object` and keep their state in a module-local `WeakMap` keyed by World. Nothing is imported | The focused run reported "2 hooks (2 passed)", so the `After` hook's `this.closeAll()` ran on the registered World. ga-0002 scenarios passed | Correct handling. View absence plus the instruction led to the right choice, with no guessing and no request |

Counts out of 3 needs:

- 3/3 had a view consulted.
- 3/3 needed no source inspection.
- 0/3 were used incorrectly.
- 0/3 were left unresolved.
- 0/3 ended in a capability request.
- 0/3 have unknown evidence.

Outcomes overlap:

- 1/3 (N1) used a received symbol, with the view's type-only marker matching
  how it was used.
- 2/3 (N2, N3) were resolved by not importing anything foreign.

On information supplied by the view:

- Signature: supplied for `ReviewStatus`, but only as an alias.
- Companion type: `reviewStatusSchema`, with the values `failed` and
  `passed`, was on the same page. The engineer neither read it nor needed it.
- Behavioral documentation: "The verdict of one review" was on the schema
  entry.
- Import guidance: the `[type-only]` marker, and the briefing's "Import from
  the real source file". These were applied.

The view could not establish that a symbol was absent, because coverage is
limited. For N3 the instruction is what settled it.

Packages and built-ins are outside the view's scope and counted separately:

- The packages used were `react` (`ReactElement`, already there),
  `react-dom/server` (`renderToStaticMarkup`), `@cucumber/cucumber`
  (`Given`, `When`, `Then`), `vitest` (`it.each`, `describe.each`) and
  `node:assert/strict`.
- All were taken from `package.json` and the existing test's patterns, with
  no `node_modules` reads.
- Verification: the focused Vitest run (26 tests) and Cucumber run, then the
  ga-0002 type check.

**Discovery calls**

There were 11 discovery calls: 9 `read` and 2 `grep`. The other 7 calls were
4 writes, 2 focused-test `shell` runs and 1 submission.

| Target | Calls | Returned bytes |
|---|---|---|
| API views (`.ramify/external`, `tests/.ramify/external`) | 2 (18%) | 2,386 |
| Own-module source, tests, docs and declaration (README, `module.ramify`, `status-badge.tsx`, its test, the harness-written feature) | 5 (45%) | 4,865 |
| Project configuration (`package.json`, `cucumber.js`, `ramify-audit.json`) | 3 (27%) | 5,775 |
| Harness-generated focused profile (`src/tmp/ramify-focused/…json`) | 1 (9%) | 1,010 |
| Foreign module source | 0 | 0 |
| `node_modules` | 0 | 0 |
| Unknown or mixed | 0 | 0 |

Returned bytes total 14,036, matching the observation metrics. No search was
broad or outside scope, and none returned zero matches.

Discovery happened in two parallel batches before the first edit. That first
edit (the first-engineering-action milestone) came 53 s after the start.
There was no repeated discovery after that. Each view was searched with an
explicit `path`, as the system prompt directs for gitignored views, and both
returned results.

## Findings

**F1. Low.** Duplicated and repeated material in the task message. inv-0007,
[task.md](../invocations/inv-0007/task.md).

- Excerpts: the `# Exact focused scenario command` block (1,773 B) gives the
  argv, "Support/world/loader: {…}" and the environment names. Then
  `environment:cucumberConfiguration` (2,973 B) repeats the same argv,
  config path, support globs and environment names as escaped JSON.
- The root `/tmp/claude-1000/…/badge-run-61/collection-review` (120 B)
  occurs 35 times, about 4,200 B.
- The banner "Current value; replaces any earlier value for this key."
  appears 27 times (1,512 B) in a fresh, full briefing with nothing earlier
  to replace.
- The view paths appear three times: "What you may import" (1,221 B),
  `environment:views` (649 B) and `module-pointers` (1,443 B).
- Expected: one statement of each fact. Observed: about 5–7 KB of the
  29,670 B message (UTF-8 bytes, measured by splitting `task.md` on block
  headers) is duplication.
- Impact: none observed. It is cacheable after the first request, which
  showed 12,344 new input tokens and no cache reads, as a fresh session
  should. Relevance is low, but this is not a correctness issue.
  Confidence: high.
- Correction: give the focused command once, as prose with the argv, and keep
  the JSON identity in the record rather than the message. Use
  project-relative paths wherever the system prompt already explains how they
  resolve. Drop the banners on a full (`based on: none`) briefing.

**F2. Low.** The completion-evidence block names no focused Vitest command,
and its pointer led to a redundant read. inv-0007, block
`brief:support:## Completion evidence:0`.

- Excerpt: "To see how particular tests run before you propose completion,
  name their files to the project's runner from `shell`, Inspect the
  project's declared audit and package scripts for its focused test
  command." The comma splices two sentences.
- Expected: a focused unit-test command for the owned test area, as the
  scenario command was given.
- Observed: the engineer read `package.json` (needed for
  `npm test -- <file>`) and `ramify-audit.json` (n=14, 2,844 B). The audit
  file repeated the argv already listed in `declared-checks`.
- Impact: one unnecessary read of about 2.8 KB, with no error. The cause is
  plausibly the pointer, which names the audit file. Confidence: medium.
- Correction: fix the sentence. Where the runner is known from the declared
  checks, state the focused form, for example
  `cd <root> && npm test -- <test file>`. Point to the audit file only when
  the declared checks do not settle it.

**F3. Low.** `environment:supportPaths` gives the agent paths it cannot
resolve.

- Excerpt:
  `"supportPaths": ["subs/harness/src/prompts/engineer-capability.system.md", "subs/harness/src/prompts/engineer-capability.procedure.md"]`
  (244 B). They come from `deliveredSupportPaths` in
  `subs/harness/src/prompts/tasks.ts`.
- Expected: environment fields the agent can act on.
- Observed: these are harness-repository paths with no counterpart under the
  project root. Their file names also say "capability" on a main task. The
  engineer did not use them.
- Impact: none observed. They could send an agent looking for files that do
  not exist. Confidence: high.
- Correction: keep provenance in the delivered-input manifest only, and drop
  the field from the engineer message.

**F4. Low.** Some content sits in the wrong block. inv-0007,
`brief:support:## What the plan asks of this iteration:0` and
`# Exact focused scenario command`.

- Excerpt: the heading block says "The elements your assignment cites,
  whole, with the plan deviations in force…". It then holds only "Your
  starting module is … Your working directory is …". The elements arrive
  nine blocks later in `assignment-package`.
- Separately, "Consultation context: local-architect, session ses-0004 …
  Inherited observations may be stale" is appended to the focused-command
  block. In a fresh session nothing is inherited.
- Expected: each heading holds its own content.
- Impact: none observed, because the engineer used the plan elements
  correctly. Confidence: high.
- Correction: put the package under its announcing heading. Move the
  cwd/start-module sentence to the environment, and the consultation target
  next to the `consult_architect` mention.

**F5. Low (view content).** `ReviewStatus` is documented only as an alias.
Both views:
`external/subs/workspace/subs/contracts/src/interfaces/vocabulary.ts.md`.

- Excerpt: "## `ReviewStatus` [type-only] … `type ReviewStatus = z.infer<typeof reviewStatusSchema>;`".
  The values appear only in the separate `reviewStatusSchema` entry:
  `ZodEnum<{ failed: "failed"; passed: "passed"; }>`.
- Observed: the engineer's case-sensitive grep with `-C 3` on `ReviewStatus`
  (n=11–12) showed the alias but not the values. The engineer took
  `'passed' | 'failed'` from its own `defaultLabels` instead.
- Impact: none here. A consumer without a local copy of the values would
  need a second lookup. Confidence: medium.
- Correction: show the resolved type for `z.infer` aliases, or link the
  alias to its schema entry.

**F6. Low (relevance only).** Most of `environment:limits` (1,076 B) is
run-level policy, such as `maxPlacementRequests`,
`nonfunctionalRoundsPerPlan`, `cycleReplansPerWorkItem` and `maxWorkItems`.
The system prompt references only `commandTimeoutMs`. Together with the null
`candidate` and `snapshot` blocks (220 B), roughly 1 KB does not support
this task. Impact: none. Correction: select the limits each role uses.

**No issue found:**

- Write scope and guarded files.
- Binding and submission contract: valid on the first attempt, with all
  three IDs and empty `fakes`.
- Instructions on API-view search and the separation of view areas: followed
  exactly.
- Package guidance.
- Focused Cucumber profile: it worked as described and enabled the pending
  scenarios.
- Tools: none failed.

The system prompt's conditional sections were not exercised: the exposure
guidance (611 B) and the refusal-to-capability flow (1,099 B). They are
standing role rules that are relevant to the role, and I would not remove
them.

## Observed effects

- Run sequence: two parallel discovery batches (n=3–15). Then an edit to
  `status-badge.tsx` (n=16), new `tests/badge-markup.ts` (n=19), an extended
  unit test (n=22) and a new `tests/steps/status-badge-tone.steps.tsx`
  (n=25). Every post-write check passed with 0 findings. Then the focused
  Vitest run (26 passed, n=30), the focused Cucumber run (6 scenarios and 33
  steps passed, n=33), and the submission (n=34), which was accepted at n=36.
- Outcome: `rejectedSubmissions: 0`, `outsideScope: []`, no consultation and
  no `isError` tool result. ga-0002 passed at 10:51:53, and code, scope and
  design reviewers found no concerns.
- F2 coincides with one redundant read. That link is correlation supported by
  the text of the pointer, not proof. No other omission or excess lines up
  with clarification, a repair or a wrong submission.
- Usage:
  - 9 native requests.
  - Tokens: input 21,433 new, 134,784 cache read (86% of input tokens), 0
    cache write, 4,036 output.
  - Charge: estimated at USD 0.0967 from the recorded rates (provenance
    `estimated-from-recorded-rates`).
  - Time: model 122.6 s of 140.0 s.

## Suggested corrections

1. Make the task message carry each fact once (F1, F6): one focused-command
   statement, project-relative paths, no banners on a full briefing, and
   role-selected limits. To validate, compare the first-request input size
   and the time to first engineering action on the same fixture.
2. Give a focused unit-test command next to the scenario command, and fix
   the comma splice (F2). Validate by checking whether the read of
   `ramify-audit.json` goes away.
3. Remove `supportPaths` from the agent-facing environment (F3).
4. Put the plan elements under their announcing heading, and move the
   cwd and consultation sentences to where they belong (F4).
5. In the API view, show the resolved literal type for schema-derived
   aliases, or link the alias to the schema entry (F5). This is a toolkit
   materialization change.

## Evidence gaps

- The API views are post-run files whose revision matches the briefing. No
  retained view snapshot exists. Their materialization time, 10:49 before the
  start, supports but does not prove what was delivered.
- What the coverage limits are (1 for `src`, 2 for `src/tests`) is not
  recorded in `_meta.json` or the briefing, only their counts. Whether
  `integration-tests` symbols fall under a limit cannot be checked from the
  view. The `module.ramify` text settles it for this review.
- The harness-generated focused profile under `src/tmp/` is gitignored and
  absent from the copy. Its content is known only from the transcript read at
  n=15.
- Reasoning bodies are empty in the transcript (n=10 and n=34 have blank
  `[thinking]`). Only summaries for n=16 survive, so why the engineer read
  `ramify-audit.json` and the focused profile is inferred.
- Grep output repeats overlapping context blocks (lines 33–36 twice in
  n=11–12). That is a pi tool presentation detail, and the bytes returned are
  as recorded.
