# Prompt review: local-architect orientation (inv-0004)

Run `20261011T104510Z-0e1b47`, plan `status-badge-tone`, collection-review
fixture, `openai-codex/gpt-6.1-sol:high`, pi 0.87.1, ramify-agent 5169117
(prompt package `local-architect/11`). Work item wi-001,
`collection-review/workspace/shared-ui`. Reviewed from the post-run evidence
copy at `/home/app/ramify-trial-evidence/status-badge-tone-gpt61-20261011T104510Z/`.

## Summary

The orientation prompt was adequate. Its objective, scope, location, pointers
and submission contract were all usable with the read-only tools it had. The
agent made 24 discovery calls in 51.6 s and its one submission was accepted
first time (`rejectedSubmissions: 0`). I checked the submitted understanding
against the source it read and found it accurate.

No high or medium issue was found. The low-severity issues are:

- A generic role instruction told the agent to search `.ramify/children` and
  `tests/.ramify/children`. The briefing did not say that this module has no
  children, so both greps failed with `Path not found`. The submission then
  said the child views were "unavailable".
- `environment:supportPaths` delivers harness-repository prompt source paths
  that do not resolve from the project root. `environment:cucumberConfiguration`
  is a hard-coded `null` even though the project has a `cucumber.js`.
- About 2.3 KB of block headers and 3.2 KB of repeated absolute project-root
  paths make up much of the 19.5 KB message. Most of the remaining "excess"
  (write scope, checks, engineer bounds) is for later turns: ses-0004 is
  continued by deltas that do not deliver those blocks again.
- The agent's one architect-view search had a pattern that matched
  `supporting`, so it returned 8.7 KB of noise. It then went to source, which
  was justified: the fact it needed is not in the view.

Two requests in this invocation lost provider cache reuse even though their
request prefixes were byte-identical. The cause is unknown.

## Coverage

- Kind: `local-architect:orientation`, one variant (fresh start, full
  briefing `37bc5695…`, `based on: none (full)`). Covered ID: **inv-0004**,
  harness session ses-0004, pi session `1e001881-f69a-4184-ab07-b0601168e3d2`,
  turn 1. Only transcript entries n=1–36 (through the `point` record for
  inv-0004) were used. The later inv-0006 and inv-0010 turns are out of scope
  except where noted as later context.
- Artifacts read:
  - Delivered bytes (captured): the native request
    `collection-review/plans/.harness/session-operations/store/payloads/21cd701f…`
    and its extract [native-first.json](../invocations/inv-0004/native-first.json).
    Its `instructions` are 4,361 B, the `tools` JSON is 4,111 B and the single
    user `input_text` is 19,534 B. `diff` showed the input text is identical to
    [task.md](../invocations/inv-0004/task.md). Also read: the task packet
    [packet.json](../invocations/inv-0004/packet.json), the other five native
    requests of this invocation (located by `prompt_cache_key`), and
    `nativeLast` `a1e05f60…`.
  - Run records under `plans/status-badge-tone/.harness/jobs/20261011T104510Z-0e1b47/`:
    `invocations/inv-0004/{invocation,inputs,submission,outcome}.json`,
    `observations.jsonl`, `transcripts/ses-0004.jsonl` (inline tool
    arguments/results), `events.jsonl` sequences 32–37, `input/plan.md`,
    `analysis/catalog/8b8dc5c5….json` and `work-items/wi-001/item.json`.
  - Derived: [inventory.json](../inventory.json) row inv-0004.
  - Reconstruction only: the post-run views. `.ramify-architect/_meta.json` is
    at revision `…:12`, but the delivered revision was `…:1`. The
    `shared-ui/src{,/tests}/.ramify/_meta.json` files are at `…:4`, but the
    delivered revision was `…:2`.
  - Harness source at the recorded revision, which is today's HEAD 5169117:
    [local-architect.system.md](../../../../subs/harness/src/prompts/local-architect.system.md),
    [orientation.procedure.md](../../../../subs/harness/src/context-selection/orientation.procedure.md),
    [tasks.ts](../../../../subs/harness/src/prompts/tasks.ts),
    [local-architect.ts](../../../../subs/harness/src/steps/local-architect.ts)
    and [targets.ts](../../../../subs/harness/src/consultations/targets.ts).

## Required information

Inherited context: none. The session was opened fresh (`requested`/`actual`
`fresh`, `inheritedPoint: null`). The "Consultation context: global-fork,
session ses-0002, point inv-0002" line names the pinned point that
`consult_architect` would fork. It is not history delivered to this session.

| Need | How it was supplied | Assessment |
|---|---|---|
| Objective | `brief:goal`, the five fr elements plus ctx-001 quoted verbatim, `# Orientation task`, the procedure block and `# Current task: orientation` | Met directly |
| Plan constraints | The catalog's nfr-001…nfr-004 are withheld by design ("Non-functional, fixed and recommendation elements are selected after orientation"). The goal sentence paraphrases nfr-002/nfr-003 ("without changing status or label meaning or requiring changes to existing callers"). nfr-004, "existing tests still pass, and the tone has tests of its own", appears only as "Tests that state the acceptance are part of the work." | Adequate for orientation. The agent read the existing tests anyway. |
| Authority and write scope | System prompt: "You change nothing… no file… no command". Tools were read-only. `## Default write scope` was also delivered. | Met. The write scope serves later turns. |
| Current state | Absolute pointers to the README, `module.ramify`, `src/`, the test area, the feature file and the step directory ("observed files: (none)") | Met through pointers and `read`/`ls` |
| Dependencies | Both API-view roots, with revision and coverage count, and the architect-view root with its module list | Met. Not stated: the API views have no `children/` because the module has no children. The write-scope block does say "Immediate child modules: none". |
| Execution location | `projectRoot` and `workingDirectory` (absolute), plus the rule that relative tool paths resolve from the working directory and briefing paths from the project root | Met. The agent resolved `../../../../../` to the project root correctly every time. |
| Verification expectations | Declared checks with config pointers, and scenario-completion rules | More than orientation needs. The pointers to `package.json` and `cucumber.js` were used. |
| Expected submission | `submit_work_orientation`. The schema is carried in the tool description, and the provider `parameters` are `{type: object, properties: {}}` by design ([tasks.ts](../../../../subs/harness/src/prompts/tasks.ts): "Schema appears once, in this declaration's description"). The procedure explains the fields and optional `startingPoints`. | Met. Accepted on the first call. |

**Usable instructions.** The agent could identify the task and submit it with
the tools it had. No unresolved placeholders were found. Both tool-call cwd
interpretation and project-relative submission paths worked. These are the
mismatches I found:

- The generic `.ramify/children` instruction (see F1).
- `supportPaths` are not reachable from the project (see F2).
- `cucumberConfiguration: null` although `cucumber.js` exists (see F2).
- Role text that belongs to other turns: "decide, and record it in the
  outline" and "If the harness returns a failing gate". The orientation
  procedure says instead to "Preserve uncertainty… submit… open questions",
  and the task says it supersedes. No effect was observed.
- `## Declared project checks` ends "shell refuses whole suites and watch
  mode", but this role has no shell.

## Architecture discovery

Every call was resolved from its recorded arguments against the working
directory
`/tmp/claude-1000/.../badge-run-61/collection-review/subs/workspace/subs/shared-ui/src`.
The project root is five levels up. I cross-checked each call against the
`resolvedScope` field in `observations.jsonl`.

**Denominator:** 24 discovery calls, made up of 14 `read`, 5 `grep` and 5 `ls`.
The metric counts `ls` as a search, which gives 10 searches. The
`submit_work_orientation` call is excluded. Returned bytes are output only;
the 39,128 B total equals `exploration.metrics.returnedBytes`.

| Target | Calls | Share of 24 | Returned bytes | Calls |
|---|---|---|---|---|
| Consumer API view (`src/.ramify/`, `src/tests/.ramify/`) | 10 | 41.7% | 16,652 | 4 grep (`pattern "."`, `limit 50`) on `external`/`children` of both areas, 2 of them failed `Path not found`. 2 `ls`. 2 reads of `contracts/src/interfaces/vocabulary.ts.md`. 2 `_meta.json` reads. |
| Architect view (`.ramify-architect/`) | 1 | 4.2% | 8,718 | grep `World\|support\|cucumber`, limit 40, truncated |
| Direct source/tests | 12 | 50.0% | 13,234 | Own module, 6 calls: `module.ramify`, `ls src`, `status-badge.tsx`, `ls tests`, `status-badge.test.tsx`, the feature file. Root configuration, 4 calls: `package.json`, `cucumber.js`, `vitest.config.ts`, `tsconfig.json`. Foreign source, 2 calls: `ls subs/integration-tests/src/support`, `world.ts`. |
| Other documentation | 1 | 4.2% | 524 | `shared-ui/README.md` |
| Mixed or unknown | 0 | 0% | 0 | — |

All 24 targets are unique, with no repeated read and no repeated search. The
content still overlapped in two places:

- The two `vocabulary.ts.md` reads returned identical text (3,252 B each; the
  transcript bodies compare equal). Reading both follows the instruction that
  each view applies to its own area.
- Each `grep "."` returned the first 50 lines of the same pages, about 4.7 KB
  per area, before the full reads. The pattern was used as a dump, not a
  question.

Discovery episodes, grouped by question:

1. **What does shared-ui receive?** View-first: API views, for both ordinary
   source and tests. The view answered it: `ReviewStatus` comes from
   contracts, and the test area also receives the catalog-core fixture.
   `status-badge.tsx` imports
   `../../contracts/src/interfaces/vocabulary.js`, but the agent did not open
   contracts source, so this episode needed no source fallback.
2. **How are the scenarios run and loaded?** Direct-source-first: four root
   configuration files. The briefing pointed there ("Inspect their
   configuration"), and the views do not model runner globs. The post-run
   architect view lists `vitest.config.ts` only as an unsupported supporting
   declaration (reconstruction).
3. **What Cucumber World or support already exists that badge steps must live
   with?** View-first, then **source fallback**: the architect-view grep, then
   `ls support` and `world.ts`. The view could have answered part of it. Its
   grep hit showed `CollectionReviewWorld` as an internal of
   `integration-tests` with `"cut":["sig"]`. The post-run view (revision
   `…:12`, a reconstruction) has no entry for the `setWorldConstructor`
   registration, and that global registration was what the agent recorded.
   The agent went to source because the side effect is not a symbol fact.
   The view's grep was also noisy: `support` matched `"supporting"` counts in
   every `module.json` and README line, and the 40-match limit was reached.
   Reading `.ramify-architect/integration-tests/behavior.jsonl` directly would
   have been the targeted lookup.
4. **What the module does today.** Local source and tests, as the procedure
   directs ("Explore your module's README, declaration and relevant source").
   This is local evidence, not architecture discovery, so it is not counted as
   a fallback.

**Episode counts:** 2 view-first (episodes 1 and 3), 2 direct-source-first
(episodes 2 and 4, both briefing- or procedure-directed), and 1 source fallback
after a view lookup (episode 3).

The views were used and applied: `ReviewStatus` appears in the submission
("available through the ordinary-source contracts API view"), and so does the
coverage caveat. The agent did not use the architect view's `usedBy` data to
check the existing callers named by the goal. An optional prop made that check
unnecessary for orientation.

## Findings

**F1 — Low.** inv-0004, local-architect role prompt and briefing.

- Location:
  [local-architect.system.md](../../../../subs/harness/src/prompts/local-architect.system.md)
  lines 39–41: "search `.ramify/external` and `.ramify/children` … use
  `tests/.ramify/external` and `tests/.ramify/children`". The briefing names
  only the view roots.
- Expected: The agent should only search view directories that exist, or the
  briefing should say that a leaf module has no `children/` view.
- Observed: In transcript n=3 the agent issued all four greps in parallel. Two
  failed (n=8 and n=10: `Path not found: …/src/.ramify/children` and
  `…/src/tests/.ramify/children`). The submission later says "their child
  views are unavailable". The children views are absent because there are no
  child modules, not because something is withheld.
- Impact and confidence: Two wasted calls (380 B) and a slightly misleading
  claim. The cause is clear: the prompt's literal paths were searched before
  any `ls`. Confidence is high.
- Correction direction: Render the existing subdirectories of each view in
  `## Your module` ("external/ only; no children: the module declares none").
  Alternatively, phrase the role text as "search the `external/` and
  `children/` directories that the briefing lists".

**F2 — Low.** inv-0004, the environment blocks.

- Location: [task.md](../invocations/inv-0004/task.md) blocks
  `environment:supportPaths` (242 B) and `environment:cucumberConfiguration`
  (133 B).
  - `supportPaths` contains `"subs/harness/src/prompts/local-architect.system.md"`
    and `"subs/harness/src/context-selection/orientation.procedure.md"`. These
    come from
    [`deliveredSupportPaths`](../../../../subs/harness/src/prompts/tasks.ts),
    which returns harness prompt sources. The `collection-review/subs/`
    directory contains only `integration-tests` and `workspace`.
  - `cucumberConfiguration` is set to `null` unconditionally at
    [local-architect.ts](../../../../subs/harness/src/steps/local-architect.ts)
    line 107.
- Expected: Environment fields describe the agent's environment.
- Observed: One field holds provenance paths that do not resolve from the
  stated project root. The other states no Cucumber configuration while
  `cucumber.js` exists and the briefing tells the agent to inspect it.
- Impact and confidence: No observed effect; the agent ignored both fields
  and read `cucumber.js`. This is a latent risk of a wasted lookup or a wrong
  inference. Confidence is high that the content is wrong.
- Correction direction: Omit `supportPaths` from agent-facing environments,
  since the manifest already records provenance. Omit `cucumberConfiguration`
  or populate it, rather than sending a constant `null`.

**F3 — Low.** inv-0004, briefing size and duplication. Sizes are UTF-8 byte
lengths of the `# Block` segments of `task.md`, which is identical to the
delivered input text.

- Formatting boilerplate:
  - The 24 `# Block <key>` and "Current value; replaces any earlier value for
    this key." headers take 2,306 B. The 56-byte "replaces" line is vacuous on
    a `based on: none (full)` briefing, which accounts for 1,344 B.
  - The absolute project root (120 B) appears 27 times, for 3,240 B (16.6% of
    the message). Absolute paths do let tools use them directly, so this is a
    size note, not an error.
- Duplicated content:
  - `module-pointers` (1,443 B) repeats the README, declaration, source, test
    area and API-view paths already given in `## Your module`.
  - `environment:workingDirectory` repeats the module's working directory.
  - `environment:limits` (1,076 B) duplicates the timeouts in `## The bounds of
    an engineer` (420 B). Most of it is run-level (`maxWorkItems`,
    `runAbsoluteMs`, `budgetReturnsPerIteration`). Only
    `rejectedSubmissionsPerTurn` bears on this turn.
  - `environment:candidate` and `environment:snapshot` (220 B) are both null.
- Expected vs observed: These do not mislead, but they do not support
  orientation either.
- Relevance and cost: The continuation inv-0006 is a delta briefing that does
  not deliver the write scope, checks or bounds again (see its block list). So
  `## Default write scope` (767 B), `## Declared project checks` (1,836 B),
  `## The bounds of an engineer`, the capability registry and the scenario
  binding guidance are session-forward material, not excess for ses-0004.
  Within one session they are a one-time, cacheable cost.
- Impact and confidence: No observed effect. The remaining excess, roughly
  3–5 KB once the session-forward material is excluded, is small next to the
  4.4 KB of instructions and 4.1 KB of tools. Confidence is medium on the
  relevance judgement.
- Correction direction: Drop the "replaces" line on full briefings. Merge
  `module-pointers` into `## Your module`. Send only the per-turn limits.
  Consider one project-root token per message with paths relative to it.
  Measure the token effect before claiming a saving.

**F4 — Low (agent search technique; prompt-adjacent).** inv-0004, transcript
n=3 and n=27.

- Excerpts: `grep {"path":".ramify/external","pattern":".","limit":50}`, and
  `grep {"path":"../../../../../.ramify-architect","pattern":"World|support|cucumber","limit":40}`.
- Expected: Targeted view lookups.
- Observed:
  - Dump-style greps hit their limits (`[50 matches limit reached…]`).
  - The architect grep returned 8,718 B, mostly `"supporting"` count lines. The
    one useful hit was the `integration-tests/behavior.jsonl`
    `CollectionReviewWorld` line.
- Impact: About 18 KB of returned output (46% of the invocation's returned
  bytes) came from four dump/noisy greps. The orientation was still correct.
  The prompt says "search the `.ramify-architect/` directory" but gives no
  layout, such as `<module path>/module.json`, `behavior.jsonl` or
  `supporting.jsonl`, that would invite a direct read. Confidence that a
  layout hint would help: low to medium (hypothesis).
- Correction direction: Add a one-line layout hint for both views (`ls` the
  view first; per-module files; the API view's `external/<path>.md` pages).

**F5 — Info.** Withheld plan constraints (nfr-001…nfr-004) are signposted and
by design. The goal sentence carries nfr-002/nfr-003, and nothing in this turn
needed the rest. No issue.

**F6 — Info.** The submission schema is delivered as a JSON string in the
tool description, with an empty `parameters` object. The harness validates
it; this is intentional, as described in `tasks.ts`. The model produced a
valid payload with project-relative `startingPoints` on the first call. No
issue observed.

## Observed effects

- **Tool errors:** 2 (n=8 and n=10), caused by F1. The agent recovered in the
  next batch with `ls .ramify` and `ls tests/.ramify` (n=13–14) and did not
  retry. The only lasting effect is the "child views are unavailable" wording.
- **Clarification and consultation:** none. `consult_architect` was available
  and not used. `questions: []`.
- **Repeated discovery:** no repeated paths. The content overlap is listed
  under Architecture discovery.
- **Submissions:** one, accepted (n=33 `verdict: accepted`). Outcome
  `ended: submitted`, `disposition: applied`. Event 36 records
  `work-orientation-recorded`. No repair or retry. Later context: inv-0005
  (context selector) forked from the inv-0004 point, inv-0006 continued it,
  and all four run gates passed. That later success is consistent with
  adequacy but does not establish it.
- **Correlation, not cause:** F2 and F3 coincided with no measurable behavior
  change. Two calls (the feature file and `package.json`) partly re-read
  material the briefing already contained or pointed to. Re-reading the
  feature file confirmed its `@ramify-pending` tags, so it was not wasted.
- **Usage:** 6 native requests, all made by inv-0004.
  - Totals: input 31,896, cacheRead 44,928, output 1,391 (total 78,215).
    Estimated charge $0.0822 from recorded rates.
  - First call: 6,739 input tokens, 0 cached. That is expected for a fresh
    session.
  - Within-invocation cache: all six requests share the same `instructions`,
    the same tool JSON and a preserved input prefix (checked by comparing the
    retained payloads). Even so, request 3 (n=72) had `cacheRead 0` after a
    9,580-token prompt, and request 5 (n=108) cached only 9,472 of the prior
    13,937 tokens. The prefix did not change, so the cause is unknown
    (provider-side).
  - Estimated counterfactual if both requests had reused the prior prompt:
    about 14,000 fewer uncached tokens, roughly $0.027 at the recorded
    $2.00/M and $0.10/M rates. This is a rough estimate, not a measured
    saving.

## Suggested corrections

1. Render each API view's actual subdirectories in the briefing, and make the
   role text conditional on them (F1). To validate, rerun this fixture's
   orientation and check that no `.ramify/children` greps are made.
2. Remove `supportPaths` from agent-facing environments, and omit or populate
   `cucumberConfiguration` (F2).
3. Trim full-briefing boilerplate, merge `module-pointers` into `## Your
   module`, and send only per-turn limits. Keep the session-forward blocks
   (F3). To validate, compare the first-call input tokens, and check that the
   inv-0006 organization quality is unchanged.
4. Add a brief view-layout hint so the agent reads a view page directly rather
   than running `grep "."` dumps (F4). To validate, measure view returned bytes
   per answered question.
5. Metrics: every search observation records `outsideScope: null` with
   "outside-scope status unknown", yet the aggregate reports
   `outsideScopeSearches: 0`. The two failed `Path not found` greps are not
   distinguished from successful searches in `zeroMatchSearches: 0`.
   [session-observations.md](../../../metrics/session-observations.md) says
   unknown values "are never zero". Report the aggregate as unknown when any
   contributing observation is unknown, and count failed searches separately.

## Evidence gaps

- Reasoning content is not retained: the thinking blocks at n=27, n=29 and
  n=32 have 0 bytes, with encrypted reasoning only. So why the agent chose its
  greps, and why it raised no questions, is inferred from its actions.
- The views as delivered are not retained in the copy. The architect view was
  delivered at `…:1` and the API views at `…:2`; the copy holds `…:12` and
  `…:4`. The tool results captured in the transcript show what was returned.
  The claims about view content beyond those results (no `setWorldConstructor`
  entry, `vitest.config.ts` as a supporting declaration) come from the
  post-run copy and are reconstructions.
- The cause of the within-invocation cache misses cannot be determined from
  the retained evidence. The prefixes were identical and `prompt_cache_key`
  was constant.
- `grep` observations do not report matched-file identities or scanned bytes,
  as their coverage notes say. Returned bytes are output only.
- Byte sizes are UTF-8 lengths. Tokens are measured only per request, by the
  provider. No per-block token counts exist, so the sizes in F3 are not
  converted to tokens.
