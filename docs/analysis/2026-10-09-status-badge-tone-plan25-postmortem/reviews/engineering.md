# Prompt review: engineer `engineering` (inv-0007)

Run `20261009T193340Z-51f42e`, plan `status-badge-tone`, collection-review fixture,
`openai-codex/gpt-5.6-sol:high`, pi 0.87.1, harness revision 474ffa58.

## Summary

The single engineering instance, inv-0007, was a fresh session (ses-0006, pi session
`fb5f0c3c-…`), with no inherited history beyond its role instructions. It received a
complete and usable task. The briefing set out the goal, the architect's approach, the
plan elements, the write scope, both API views, the scenarios with their feature path,
an exact focused Cucumber command, the declared checks, starting points and the
submission schema. The engineer read its own module first. It changed
`status-badge.tsx`, extended the existing Vitest file and added a step file. It ran
focused Vitest, the given focused Cucumber command, `npm run type-check` and the
declared `ramify check`, and its first submission was accepted. Gate ga-0002 then
passed on b999ea9.

The work needed no new import of a Ramify-application capability from another module.
The one foreign Ramify symbol involved, `ReviewStatus` from `contracts`, was already
imported type-only and only flows through the module's own `StatusBadgeProps`.

The four empty greps were real negatives. Three of them searched the testing API view
for package APIs (`@cucumber/cucumber`, `react-dom/server`, `vitest`, `assert`), which
the view does not cover by design. The system prompt orders a view-first search but
never says that packages and built-ins are outside the view. The fourth searched for
precedent module-owned step files, and none existed. The cost was small: 3 view
greps, 3 view listings, 2 `_meta.json` reads and one 15.9 KB foreign grep. No error,
repair or wrong submission followed.

The other findings are low-severity duplication or structure issues in the briefing:

- The Cucumber configuration appears twice.
- The view paths appear three times.
- The run-wide limits block is mostly irrelevant here.
- `supportPaths` names harness-internal files.
- A misplaced section preamble and a broken sentence in "Completion evidence".

## Coverage

| Kind | Instance | Session | Start | Model calls | Tool calls | Evidence used |
|---|---|---|---|---|---|---|
| engineer `engineering` (`procedure:engineer:main`, package `engineer/8`, role source `engineer-capability.system.md`) | inv-0007 (wi-001 / wi-001.i01, attempt 1) | ses-0006, fresh, checkpoint `a8b1e4a3…` | 2026-10-09T19:36:23Z, 103.2 s | 9 | 21 discovery (10 read, 11 ls/grep), 2 edit, 1 write, 4 shell, 1 submit | Captured delivered bytes: `D/invocations/inv-0007/task.md` (= `packet.message`, verified byte-equal), `native-first.json` (system instructions, 7 tool declarations, input). Transcript `J/transcripts/ses-0006.jsonl` with blobs; `J/invocations/inv-0007/{invocation,submission,outcome}.json`, `observations.jsonl`; run commit b999ea9; gate `J/gates/ga-0002` |

This is the only engineering instance in the run. No variant, continuation, repair or
retry of this kind occurred. The role-instruction source is the capability-workflow
variant (`engineer-capability.system.md`, package `engineer/8`). `packages.ts:321-325`
selects it whenever `capabilityWorkflow` is not `false`, so this is the intended
selection, not a mismatch.

## Required information

| Need at this point | Status | Where |
|---|---|---|
| Objective | Met directly | `brief:goal`, `brief:requirements`, approach block |
| Plan constraints (fr-001..005, nfr-001..004) | Met directly | `assignment-package` block (2,990 B) |
| Authority and write scope | Met directly | "What you may write": `subs/workspace/subs/shared-ui/`; the feature file is read-only ("Never edit a feature file") |
| Current state, starting files | Met directly, plus pointers | Starting points for `status-badge.tsx`, the test file and the feature file; boundary commit c76c24e. The engineer read all three first (#3). |
| Execution location (cwd, project root) | Met directly | Block text and `environment:workingDirectory`/`projectRoot`; all relative paths resolved correctly |
| Foreign dependencies (API views) | Met by pointer | "What you may import" names both views with their revision and coverage count. The views existed at dispatch: file mtimes 19:36:23 equal the invocation start, and the revision `rev/1:a4552a91…:4` matches. This is post-run project-copy state (see evidence gaps). |
| Package and test-framework APIs (Cucumber, react-dom/server, assert) | Obtainable by pointer, but not stated as outside the views | The own test file shows `renderToStaticMarkup`. `package.json` and `cucumber.js` are named as configuration pointers. The support globs name `subs/integration-tests/src/support/*.ts`. Nothing says where package APIs are documented, or that they are absent from the API view. |
| Scenario-runner conventions (World, hooks, step location) | Partly met | Candidate step dir, support import globs and focused profile are given. The project-wide World (`setWorldConstructor(CollectionReviewWorld)` in integration-tests) is reachable only through the support glob pointer. |
| Verification expectations | Met | Exact focused Cucumber command, declared checks, and the whole-suite refusal. The focused Vitest command is not given, but the briefing points to the package scripts, and the engineer derived it correctly. |
| Expected submission | Met | `submit_iteration_result` declaration with the full schema; obligations sc-001 and sc-002 with `{id, fakes}` |
| Missing, contradictory, stale or inaccessible | Minor only | Coverage limits are given only as counts (1 and 2), and `_meta.json` holds nothing more. The module-pointers block says to read `_meta.json` for limits, while the system prompt says not to search for missing metadata (F4). `supportPaths` names files that do not exist in the target project (F3). |

The instructions were usable. The engineer identified the task, used only declared
tools, stayed in scope (`outcome.outsideScope: []`), copied the focused command verbatim
(#36) and submitted once (`rejectedSubmissions: 0`). It found no unresolved
placeholders, wrong paths or schema mismatches.

## Capability use

Needs are counted for the three consumer files: ordinary `status-badge.tsx`, and
testing `tests/status-badge.test.tsx` and `tests/steps/status-badge-tone.steps.tsx`.
Existing imports that the change left untouched and did not newly rely on (`vitest`
in the test file, `react` types) are excluded.

| ID | Need (consumer file, area) | Provider / kind | In API-view scope? | View: supplied / consulted / applied | Route actually taken | Import / use | Verification | Outcome |
|---|---|---|---|---|---|---|---|---|
| C1 | `ReviewStatus` for `StatusBadgeProps.status` (`status-badge.tsx`, ordinary) | `contracts`, `src/interfaces/vocabulary.ts`, type | Yes | Supplied: the ordinary view lists `ReviewStatus [type-only]`. Not consulted: the engineer listed `.ramify` and read `_meta.json` (#20) but never opened `vocabulary.ts.md`. Applied implicitly. | Pre-existing `import type`, left unchanged | Correct; type-only use matches `[type-only]` | Post-write hook 001 passed, type-check passed, `ramify check` passed, gate ga-0002 pass | Supported. The view would have answered, but no lookup was needed. |
| C2 | `ReviewStatus` values `'passed'`/`'failed'` in step props (`steps.tsx`, testing) | `contracts`, reached through the own-module `StatusBadgeProps` | Yes: the tests view lists `ReviewStatus` and `reviewStatusSchema` (enum `failed`/`passed`) | Supplied. Not consulted. | Values taken from own `defaultLabels` (#6) | No foreign import; literals checked through the own props type | Hook 003 passed; focused Cucumber 2/2; type-check | Supported from own source; the view was not needed |
| C3 | `Given`/`When`/`Then` (`steps.tsx`, testing) | Package `@cucumber/cucumber` | No: packages are outside the view | Searched the tests view (#11, #16, #24): empty | Foreign-source idiom in `subs/integration-tests/src/steps/collection-review.steps.ts` (#23) | `import { Given, Then, When } from '@cucumber/cucumber'` | Focused Cucumber: 2 scenarios, 9 steps passed (#41) | Outside view scope; extra source discovery; correct use |
| C4 | `renderToStaticMarkup` (`steps.tsx`, `test.tsx`, testing) | Package `react-dom/server` | No | Searched the tests view (#11, #16): empty | Own test file (#7) | Correct | Focused Vitest 3/3; focused Cucumber | Outside view scope; own-module example; correct |
| C5 | `assert` (`steps.tsx`, testing) | Built-in `node:assert/strict` | No | Searched the tests view (#16, pattern `assert`): empty | Foreign-source idiom (#23, line 1 of the integration-tests steps) | Correct | Focused Cucumber | Outside view scope; extra source discovery; correct |
| C6 | Per-scenario World state and hooks loaded by the runner (`steps.tsx`, testing) | `integration-tests` support: `setWorldConstructor(CollectionReviewWorld)`, `After` → `closeAll()`. Registered by the runner, not imported | No (runtime registration). The tests view does not list `CollectionReviewWorld`, so importing it would be unavailable. | Searched the tests view (#24, `cucumber`): empty | `cucumber.js` (#19), then a grep of integration-tests (#23, which showed `world.ts:131 setWorldConstructor`) | No import. Own structural `interface StatusBadgeWorld` typed as `this`, state reset in each `Given` | Focused Cucumber "2 hooks (2 passed)" (the foreign `After` hook ran harmlessly) | Outside view scope; extra source discovery; correct, and it avoided an unavailable import |

Counts use a denominator of six needs. All six were verified by focused runs, hooks and
gate ga-0002, and none was incorrect, unresolved or unknown.

- **In API-view scope:** 2 (C1, C2). The view supplied both, both were supported without consulting it, and both were applied correctly. No view page was opened.
- **Outside API-view scope (packages, built-ins, runner registration):** 4 (C3–C6).
  - Three needed source discovery outside the module (C3, C5, C6, all through one foreign grep, #23).
  - One was answered by the module's own test (C4).
  - Three were preceded by an empty view search for package terms (C3, C4, C5), and C6 overlaps through #24.

No `capability-needed` request was submitted, and none was warranted.

Discovery classification (21 calls; returned bytes from `observations.jsonl` exploration records):

| Target | Calls | Share | Returned bytes |
|---|---|---|---|
| Own module (README, `module.ramify`, source, test, feature, `ls tests`) | 6 | 29% | 4,338 |
| Consumer API view, testing area (`tests/.ramify`: 3 ls, 3 grep, 1 `_meta`) | 7 | 33% | 249 |
| Consumer API view, ordinary area (`.ramify`: 1 ls, 1 `_meta`) | 2 | 10% | 189 |
| Project configuration (`package.json`, `tsconfig.json`, `cucumber.js`) | 3 | 14% | 3,781 |
| Foreign source (broad `subs` glob grep; integration-tests ls and grep) | 3 | 14% | 15,973 |

There were no mixed or unknown calls. The view was consulted first, and the
engineer fell back to foreign source after the view lookups. That fallback was right,
because the questions concerned package idioms and runner support, which the view
cannot answer.

## Findings

### F1: View-first instruction does not say packages and built-ins are outside the API view

Severity: low. Affected: inv-0007 calls #11, #16 and #24 (three of the four empty
greps), plus the view listings #10, #15 and #21.

The artifact is the delivered system instructions (`native-first.json.instructions`,
source `engineer-capability.system.md:81-104`):

> **Search your module's API view before opening foreign source or proposing a new cross-module interface.** … Each view is complete for its own source area … The view mirrors project paths, one page per source file

Expected goal: the engineer should know that the view covers only this project's
modules, and that package and built-in APIs come from the manifest, existing imports
and package documentation.

Observed mismatch: the instructions do not mention that packages and built-ins are
excluded. In the first turn the engineer grepped `tests/.ramify` for
`cucumber|Given|When|Then|renderToStaticMarkup|expect` (#11). Its next reasoning
summary was "Inspecting test imports for API view" (#13). It then grepped
`tests/.ramify/external` for `@cucumber/cucumber|…|assert|react-dom/server|vitest`
(#16) and for `cucumber` (#24). All three returned "No matches found". These were
true negatives: GNU grep and rg on the retained view reproduce the empty results.
After that, the engineer took the idioms from integration-tests source (#23).

Impact and confidence: about 6 view calls (238 returned bytes), a few hundred output
tokens and roughly 0.5 s of tool time. There was no error or wrong use, and the run
outcome was unaffected. The correlation is clear. The causal link is moderate: the
reasoning summary names the view as the target for "test imports".

Correction direction: add one sentence to the engineer system prompts, for example:
"The view lists only symbols this project's modules expose to yours; packages and
Node built-ins are never in it. Take their usage from the manifest and existing
imports." `materialized-api-view.spec.md` already states this scope. It also matches
"Dependencies outside the API view's documented scope remain separate" in the
postmortem skill.

### F2: Scenario-binding guidance gives runner-support globs but not resolved support files or a precedent

Severity: low. Affected: #17 (broad empty grep) and #23 (15,932 B, 65% of all bytes
this invocation got back).

The artifact is the briefing blocks "Binding a scenario" and "scenario-files"
(`task.md` lines 114-123 and 281-287):

> Step directory: `…/shared-ui/src/tests/steps`; observed files: (none). Observed files do not establish what the runner loads. Inspect its declared configuration.

and the support line `{"import":["subs/integration-tests/src/support/*.ts", …]}`.

Expected goal: the engineer needs to know what World and hooks its step definitions
run under, and what a step file in this project looks like.

Observed mismatch: the information could be reached through the glob pointer, but the
briefing names no resolved support file and no existing step file. The engineer
grepped all of `subs` for `**/src/tests/steps/*` precedents (#17). That search was
empty, because no module-owned step file existed at c76c24e. It then grepped
integration-tests with `-C 4`, which returned the whole step file plus repeated
feature context. The engineer got what it needed from this: `setWorldConstructor`,
the `@cucumber/cucumber` and `node:assert/strict` imports, and the
`this: CollectionReviewWorld` style. It then correctly avoided importing the foreign
World.

Impact and confidence: one wasted broad search and one oversized return. The
returned bytes stayed in context for the 6 later calls, mostly as cached input. High
confidence in the sequence. The effect is efficiency only.

Correction direction: in the scenario-files block, list the support files the
effective configuration resolves to, and one existing step file as a format
example, marked as navigation help. Optionally note that the runner registers one
project-wide World and that a module's step file should not import it unless the
module receives it.

### F3: Duplicated and run-wide material in the task message

Severity: low. Affected: the inv-0007 task message (26,665 B).

Artifacts, with sizes from `task.md`:

- `environment:cucumberConfiguration` (2,756 B) repeats the argv, support globs,
  environment names and configuration hash already in "Exact focused scenario
  command" (1,508 B).
- `environment:views` (648 B) repeats the view paths, revisions and coverage already
  given in "What you may import" (1,172 B) and "module-pointers" (1,298 B). The view
  paths are stated three times.
- `environment:limits` (1,075 B) lists 26 run-wide limits. Only `commandTimeoutMs`
  (which the system prompt refers to) and arguably `rejectedSubmissionsPerTurn` bear
  on an engineer. Entries such as `maxPlacementRequests`,
  `nonfunctionalRoundsPerPlan`, `cycleReplansPerWorkItem` and `runAbsoluteMs` do not.
- `environment:supportPaths` (243 B):
  `["subs/harness/src/prompts/engineer-capability.system.md", "…procedure.md"]`.
  These are harness-checkout paths that do not exist in the target project, and
  nothing tells the agent what they are for. `tasks.ts:112-114`
  (`deliveredSupportPaths`) emits them for provenance.
- Each of the 27 blocks repeats "Current value; replaces any earlier value for this
  key." (about 1.5 KB in total). This is protocol overhead, and it matters more for
  continuations than for a fresh session.

Expected goal: a fresh engineer needs the information once, in the form it will act on.

Observed mismatch: about 4.5 KB is clearly redundant or irrelevant: the
cucumberConfiguration block, the environment views block, about 900 B of limits and
supportPaths. That is roughly 17% of the message.

Token method: the first call's measured input was 11,324 tokens for 48,236 delivered
bytes (system 9,966 B, tool JSON 10,534 B, input JSON 27,736 B), about 4.26 B per
token. Proportionally, the redundant part is about 1,050 tokens. This is a byte-ratio
estimate, not a provider token count.

Relevance and cache cost: the first call had `cacheRead: 0` (fresh session), and the
8 later calls read 11–22k cached tokens each. After the first call, the excess
cost about 0.1× the new-input rate. There is no sign it caused confusion, and the
engineer did not open `supportPaths`.

Correction direction:

- Deliver the Cucumber configuration once, as the focused-command block plus its identity hash.
- Drop `environment:views` when the briefing's import section is present, or the reverse.
- Narrow `limits` to the role's fields.
- Keep `supportPaths` in the manifest rather than in the agent's message.

### F4: Instruction to read view metadata that adds nothing and conflicts with the system prompt

Severity: low. Affected: #14 and #26.

The artifact is the module-pointers block (`task.md:277-278`):

> Observed API view: `…/src/.ramify/`. Read its metadata for revision and coverage limits; absence under coverage limits is not proof.

The system prompt says the opposite:

> The current task names the supplied view paths, module identities and coverage. Use those paths only. Retain unavailable or incomplete details explicitly; do not search for missing metadata

Expected goal: the engineer should have one consistent statement of what it knows
about the view's coverage.

Observed mismatch: the engineer read both `_meta.json` files. They contain only
`{"schema","module","area","revision","coverage":1|2}`, which the task already
stated. The coverage limits themselves are never described anywhere the engineer
can reach.

Impact and confidence: two small reads (335 B) and no decision changed. High
confidence.

Correction direction:

- Remove "Read its metadata…" from the module-pointers block, since the import section already states revision and coverage.
- If the count matters, deliver the limit descriptions (for example the `signature-inferred` coverage notes) rather than a bare number.

### F5: Section preamble separated from its content; broken sentence

Severity: low (clarity only). Affected: `task.md` lines 20-27 and 63-65.

The artifact is "What the plan asks of this iteration", whose whole body is:

> The elements your assignment cites, whole, with the plan deviations in force when it was assigned. … Your starting module is `collection-review/workspace/shared-ui`. Your working directory is …

The elements themselves appear ten blocks later, in `brief:support:assignment-package`.
The cause is in `work/engineer.ts:381-384`: the package moved into its own block, and
the preamble and the cwd sentence stayed behind.

"Completion evidence" reads "…name their files to the project's runner from
`shell`,\nInspect the project's declared audit and package scripts…". The comma
splice comes from `engineer.ts:432-433` when `briefing.setup` is absent.

Expected goal: each section heading should introduce the content under it.

Observed mismatch: as described above.

Impact: none observed, because the engineer read the elements and the package
scripts. High confidence that it is a template artifact.

Correction direction: move the preamble into the assignment-package block, give the
cwd sentence its own heading or move it into "What you may write", and end the
`shell` sentence with a period or join the fallback line properly.

### No issue found

- Goal, approach, plan elements and obligations: complete and consistent with each
  other and with the feature file.
- Write scope and guarded-file rules: clear. There were no refused writes and
  `outsideScope` was empty.
- Exact focused scenario command: correct, copied verbatim and passed (#41). The
  note that the default profile excludes `@ramify-pending` was accurate and avoided a
  false "0 scenarios" run.
- Submission schema and binding instructions: the first submission was accepted,
  with `bindings: [{sc-001, []}, {sc-002, []}]` matching the no-fakes approach.
- Ramify import and companion rules: followed. The engineer added an inline literal
  union for `tone`, so no new named type needed exposure, and the post-write checks
  (hooks 001–003) and completion check (hook 008) passed. As an informational note
  outside this prompt's scope: a future feature view that wants to name the tone type
  would have no exposed named type, and the system prompt tells consumers not to
  derive one. Nothing in this plan required that (nfr-003).
- The declared structural check was reachable and was used (#43). The engineer ran
  it although only the gate requires it, which is consistent with "run relevant
  checks".

## Observed effects

The sequence was as follows:

1. Turn 1 (#3) made 9 parallel calls. Five read the briefing's starting points and
   the module's onboarding files. Two listed the tests directory and the testing
   view. One grepped the testing view for runner and assertion terms (empty, #11).
   One read `package.json`.
2. Turn 2 (#13, "Inspecting test imports for API view") read `tests/.ramify/_meta`,
   listed `tests/.ramify/external` (`subs/` only) and grepped it for package names
   (empty, #16). It also grepped `subs` for module-owned step precedents (empty,
   #17), and read `tsconfig.json` and `cucumber.js`.
3. Turn 3 (#20) listed the view down one more level (`workspace/`), stopped short of
   any page, grepped it for `cucumber` (empty, #24), and read the ordinary view's
   `_meta`. In the same turn it grepped integration-tests (15.9 KB, #23), which gave
   it the World and the import idioms.
4. Turns 4–6 made the three edits, each with a passing post-write hook. Turn 7 ran
   focused Vitest (3 passed), focused Cucumber (2 scenarios, 9 steps, 2 hooks
   passed) and type-check. Turn 8 ran `ramify check` (completed, passed, coverage
   partial). Turn 9 submitted, and the submission was accepted.

F1's omission coincides with three of the empty greps and very likely caused them.
F2 accounts for the fourth empty grep and the large foreign return. Neither led to
clarification, a tool error, a wrong import, a repair or a rejected submission. The
discovery phase took about 31 s of wall time (19:36:23 to 19:36:54) across three
model calls. The whole invocation took 103 s and 168,847 tokens in total (26,001
new input, 138,368 cache read, 4,478 output). F3 to F5 had no observable effect.

## Correction suggestions

1. In `engineer-capability.system.md` and `engineer.system.md`, state the API view's
   scope next to the view-first rule: project modules only, with packages,
   built-ins and runner-registered support excluded and taken from the manifest and
   existing imports (F1).
2. In the engineer scenario-files block, list the support files resolved from the
   effective Cucumber configuration and one existing step file as a navigation
   example. Note that a project-wide World may be registered there and that its
   class is importable only if the API view lists it (F2).
3. De-duplicate the task message. Keep one Cucumber configuration block and one
   statement of the view paths, narrow `limits` to role-relevant fields, and keep
   `supportPaths` in the manifest rather than the delivered message (F3).
4. Remove the "Read its metadata for revision and coverage limits" line from
   module-pointers, or deliver the coverage-limit descriptions themselves (F4).
5. Fix the preamble placement and the comma splice in `work/engineer.ts` (F5).

## Evidence gaps

- The API views are not retained as a snapshot. The files examined are post-run state
  in the project copy (`collection-review/subs/workspace/subs/shared-ui/src/{,tests/}.ramify/`).
  Their mtimes (19:36:23, the dispatch time) and revision (`…:4`) match the delivered
  task, so they were most likely the views available to inv-0007, but this is
  inferred rather than captured.
- `_meta.json` records coverage limits only as counts (1 ordinary, 2 testing). What
  those limits were could not be recovered from the view. The `ramify check`
  coverage notes in `J/invocations/inv-0007/shell/004.log` suggest
  `signature-inferred` companion limits, but this review did not map them to the
  view counts.
- The transcript holds only short reasoning summaries, so causal attribution for the
  view greps rests on the summary "Inspecting test imports for API view" and on the
  order of the calls.
- Pi grep's handling of `.gitignore` for the explicitly named ignored `.ramify`
  directory was not tested directly. The empty results were confirmed as true
  negatives by GNU grep and rg against the retained files, so this gap does not
  affect the findings.
