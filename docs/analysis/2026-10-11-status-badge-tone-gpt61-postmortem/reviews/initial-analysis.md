# Prompt review: initial-architect initial-analysis (inv-0002)

Run `20261011T104510Z-0e1b47`, plan `status-badge-tone`, collection-review
fixture, `openai-codex/gpt-6.1-sol:high`, pi 0.87.1, ramify-agent 5169117
(clean main). inv-0002 ran in harness session ses-0002, a fresh start (pi
session `c6a0cf78-2df9-4986-88ac-93e02939c1c9`), from 10:45:25.319Z to
10:47:06.304Z.

## Summary

The prompt was adequate for the task. The agent identified the objective, the
owner (`collection-review/workspace/shared-ui`) and both plan scenarios. It
submitted once, with no rejected tool inputs or submissions, and inv-0003's
catalog check returned no corrections (`analysis-accepted`, events.jsonl
sequence 18: 1 entry, 0 hypotheses, 1 work item, 3 scenarios, no warnings).

The 16 model requests were 15 serial single-tool steps (about 43 s) followed
by one submission request (57.05 s, 2,372 output tokens, 82% of the
invocation's 2,895 output tokens). Every request emitted exactly one tool call,
even though `parallel_tool_calls` was `true`. About half the wall time is
therefore the inherent cost of composing the analysis. Of the 15 exploration
steps, 6 to 7 trace to prompt or view defects rather than to the task:

- an empty `<plan>` wrapper, which led to a plan re-read (1 request);
- a view-README path convention that does not match the view's directory
  layout, which caused a failed `ls` and a recovery `ls` (2 requests);
- a declared-checks block written for engineers, which preceded three
  runner-configuration reads (3 requests);
- a broad coverage-limit grep whose 15.5 KB result the agent did not need
  (1 request, partly a model choice).

None of these changed the outcome. The most consequential is the plan
delivery: the message announces the plan and then delivers an empty wrapper,
and it gives only the live plan path, not the captured file.

## Coverage

| Kind | Variant | IDs | Start |
|---|---|---|---|
| initial-architect `main` (procedure `procedure:initial-architect:main`, SHA-256 `76bb97e1…b60b`; task `initial-analysis`) | the only one | inv-0002 / ses-0002 / operation `inv-0002` | fresh, no inherited point (`manifest.inheritedPoint: null`) |

Artifacts read (evidence root
`/home/app/ramify-trial-evidence/status-badge-tone-gpt61-20261011T104510Z/`):

- Delivered bytes:
  - the first and all 16 native requests for prompt cache key `c6a0cf78-…`
    under `collection-review/plans/.harness/session-operations/store/payloads/`
    (first `b200751a…`, last `22279730…`);
  - the derived [`native-first.json`](../invocations/inv-0002/native-first.json),
    [`packet.json`](../invocations/inv-0002/packet.json) and
    [`task.md`](../invocations/inv-0002/task.md). `task.md` equals the native
    request's input text apart from a trailing newline.
- Run records under `collection-review/plans/status-badge-tone/.harness/jobs/20261011T104510Z-0e1b47/`:
  - `invocations/inv-0002/{invocation,submission,outcome}.json`;
  - `transcripts/ses-0002.jsonl`, with tool results resolved from `blobs/`;
  - `events.jsonl` sequences 9 to 18, `input/plan.md`, `input/documents.json`
    and `invocations/inv-0003/submission.json`.
- Projections: [`inventory.json`](../inventory.json),
  [`tools.json`](../tools.json), and `metrics.json` (`evaluation.invocations`,
  policy `kpi/1`).
- Harness source at the run's revision 5169117, used only to explain
  observations: [service.ts](../../../../subs/harness/src/run/service.ts),
  [task-support.ts](../../../../subs/harness/src/work/task-support.ts),
  [starting-inputs.ts](../../../../subs/harness/src/work/starting-inputs.ts),
  [initial-analysis.procedure.md](../../../../subs/harness/src/prompts/initial-analysis.procedure.md)
  and [initial-architect.system.md](../../../../subs/harness/src/prompts/initial-architect.system.md).

Delivered composition, from the manifest's per-entry `bytes` (UTF-8 bytes of
the block text, not tokens):

| Part | Bytes |
|---|---|
| System instructions, rendered from the role source (2,916 B) and the module-architect skill source (3,361 B), the skill adapted for this role | 6,146 |
| Four tool declarations, of which `submit_initial_analysis` is 5,861 B | 8,022 |
| Task message, 19 blocks | 20,893 |

The first request was billed 8,159 input tokens with no cache read.

## Required information

| Need | Status at delivery |
|---|---|
| Objective | Met directly. The system prompt ("Your one turn is the run's initial analysis"), the procedure and the `# Current task: initial-analysis` block all state it. The task line renders `Perform initial-analysis for {}`, an empty work object, which is cosmetic. |
| Plan text and constraints | Met, but contradictory. The whole plan arrived only as one bullet of `brief:requirements` (1,644 B), starting `- # A tone for the status badge`. The `# Plan "status-badge-tone"` block announces "The plan, as `plans/status-badge-tone/plan.md` read when this run started (doc-001):" and then delivers `<plan>\n</plan>` (see F1). The accepted intake's non-functional elements nfr-001 to nfr-004 arrived as JSON (1,487 B), together with the instruction not to classify them again. |
| Plan scenarios | Met directly: ps-01 and ps-02, with the plan's line numbers. |
| Authority and write scope | Met. "You change nothing"; the only tools are read, grep, ls and the submit tool; `scope.write: null`, `writer: false`. |
| Current state | Met by pointer: architect view path, revision `rev/1:…:1`, input identity, coverage counts (`cut: 11; detailsUnavailable: 4`) and source commit `0244ce24…`. How a module identity maps to a view directory is not stated, and the view's own README states it wrongly (F3). |
| Dependencies | Met: the accepted intake (inv-0001) was delivered whole. |
| Execution location | Met: `environment:projectRoot` and `workingDirectory`; relative paths resolved. `environment:supportPaths` lists harness-repository paths that do not resolve from this working directory (F6), but their content is already inline. |
| Verification expectations | Met. The harness validation rules and their order are in the procedure; the system prompt notes that rejected submissions are limited. The role needed no test commands; the declared-checks block is extraneous (F2). |
| Expected submission | Met. The full JSON Schema is in the tool description; the procedure covers keys, refs, origins and the restating rule. Accepted on the first attempt. |
| Discovery guidance | Met by pointer. The skill's reference links are absolute paths into `/workspaces/ramify-agent/skills/…`, and `read` opened one successfully (transcript n=7). The reference still prescribes `rg` and shell, which the role lacks (F4). |

## Architecture discovery

Available views: only the architect view
(`environment:views`, revision `rev/1:703779dd-cce1-490f-843d-1647a6f11987:1`).
No consumer API view was named for this role. The post-run copy of
`.ramify-architect/` is at revision `…:12` with a different input, so this
review uses only the tool results retained in the transcript. It does not
reconstruct the view from the post-run files.

All 15 non-submission tool calls, classified from their actual arguments
(working directory = project root; no call used a glob except the grep):

| # | n | Tool and target | Class | Returned bytes | Request s |
|---|---|---|---|---|---|
| 1 | 3 | read `.ramify-architect/_meta.json` | architect view | 329 | 1.91 |
| 2 | 5 | read `plans/status-badge-tone/plan.md` | other documentation (plan) | 1,544 | 2.63 |
| 3 | 7 | read `/workspaces/ramify-agent/skills/module-architect/references/discovery.md` | other documentation (skill) | 1,855 | 2.94 |
| 4 | 9 | read `.ramify-architect/README.md` | architect view | 7,983 | 2.08 |
| 5 | 11 | ls `.ramify-architect/collection-review/workspace/shared-ui`, which **failed**: "Path not found" | architect view | 192 | 3.51 |
| 6 | 13 | ls `.ramify-architect` | architect view | 106 | 3.44 |
| 7 | 15 | read `.ramify-architect/workspace/shared-ui/module.json` | architect view | 1,862 | 2.81 |
| 8 | 17 | read `…/shared-ui/behavior.jsonl` | architect view | 703 | 2.24 |
| 9 | 19 | read `…/shared-ui/supporting.jsonl` | architect view | 433 | 2.27 |
| 10 | 21 | read `…/shared-ui/tests.jsonl` | architect view | 344 | 2.91 |
| 11 | 23 | grep `cut\|Unavailable\|unknown\|unavailable`, path `.ramify-architect`, glob `*.json*` | architect view | 15,492 (truncated at 500-char lines) | 6.47 |
| 12 | 25 | read `subs/workspace/subs/shared-ui/src/status-badge.tsx` | direct source | 1,256 | 2.75 |
| 13 | 27 | read `package.json` | other (runner configuration) | 1,108 | 2.12 |
| 14 | 29 | read `cucumber.js` | other (runner configuration) | 1,823 | 2.03 |
| 15 | 31 | read `vitest.config.ts` | other (runner configuration) | 638 | 3.12 |

Request seconds run from the previous tool result to the assistant message
that emitted the call, from transcript timestamps. The returned bytes total
35,668, which equals `exploration.metrics.returnedBytes`.

**Counts and shares.**

- **All 15 calls:**
  - architect view: 9 (60%), 27,444 B returned, 27.6 s;
  - consumer API view: 0;
  - direct source/tests: 1 (6.7%);
  - other documentation: 2 (13.3%);
  - runner configuration: 3 (20%);
  - mixed or unknown: 0.
- **The 10 architecture-discovery calls** (finding the owner, existing
  behavior, consumers and the view's coverage), excluding the plan, the skill
  reference and the runner configuration: architect view 9 (90%), direct
  source 1 (10%).
- **Targets and repeats:** 15 unique targets, with no repeated read or search.
  The two `ls` calls name different paths: the second corrects the first.
- **Searches:** 1 grep and 2 listings, all confined to `.ramify-architect/`.
  The grep named the gitignored view directory explicitly, so the tool's
  `.gitignore` behavior did not hide it. No recursive source search was made.

**Episodes.**

| Episode | Calls | Type | Result |
|---|---|---|---|
| E1: who owns the badge, what it renders, its consumers and tests | 4–10, then 12 | view-first, then source fallback | Owner, consumers (catalog/ui, reviews/ui/pure-ui), `StatusBadgeProps {status; label?}` with no tone, and the test titles all came from the view and are cited in the submission. |
| E2: coverage limits | 1, 11 | view-only | `_meta.json` already gave the counts. The grep located the `cut` records but mostly returned test titles and `"unknown": 0` counts. |

Totals: 2 view-first episodes, 0 direct-source-first episodes, 1 source
fallback after a view lookup.

**The fallback (call 12).** The view answered the architecture question.
`behavior.jsonl` gave the exact signature `StatusBadge({ status, label })`
and its documentation ("`data-status` carries the status itself…").
`supporting.jsonl` showed that the props have no tone, and `module.json` gave
the owner's purpose ("beginning with the status badge"). The source added the
concrete markup: a `span.status-badge` element and the
`label ?? defaultLabels[status]` fallback. The agent's own coverage limit
states the reason: "to establish the actual attribute rendering and
default/custom label behavior beyond the bounded signature". The read is
reflected in the architect Scenario Outline's `data-status` and label
assertions and in a source citation. It was focused and cheap (1,256 B, one
request), permitted by the skill ("inspect source only as the selected
workflow permits. Record every source file read"), and recorded. It was a
useful follow-up, not avoidable rediscovery.

**Effectiveness.** The view's map led straight to the owner without any source
search, and the agent made no ownership error. The accepted entry
(`render-status-badge-with-tone`, owner `…/shared-ui`) became wi-001 in that
module (events sequence 29). View friction was confined to the README's
directory convention (F3) and its shell-oriented search advice (F4).

## Findings

### F1: The plan wrapper is empty and the root plan's captured path is not given (Medium)

- **IDs:** inv-0002, block `brief:support:# Plan "status-badge-tone":0`
  (236 B).
- **Location:** [task.md](../invocations/inv-0002/task.md) and the native
  request input.
- **Excerpt:**

  ```
  The plan, as `plans/status-badge-tone/plan.md` read when this run started (doc-001):

  <plan>
  </plan>
  ```

- **Cause, at the recorded revision:** `analysis` passes the plan as
  `requirements: [plan]` ([service.ts:4406](../../../../subs/harness/src/run/service.ts)).
  `taskSupportSections` then deletes every separately delivered text from the
  prompt ([task-support.ts:4-22](../../../../subs/harness/src/work/task-support.ts),
  called from `task-brief.ts:60`), which empties the `<plan>` element that
  `analysisMessage` built ([service.ts:11056-11067](../../../../subs/harness/src/run/service.ts)).
  The plan survives only as a single list item under `# Requirements`, with
  its own headings nested in the bullet.
- **Expected:** procedure step 1 says "Read the plan in the message below, in
  full, and every accompanying plan document the message lists, at its
  captured path". The plan should therefore appear once, where the message
  says it is, and a captured-file path should be given if a read is expected.
- **Observed:** the agent's second call read the live
  `plans/status-badge-tone/plan.md`, not the captured `input/plan.md`. Its
  submission records: "The captured plan file was read in full at
  plans/status-badge-tone/plan.md; it agrees with the requirements and
  supplied plan scenarios despite the empty plan wrapper in the briefing."
  The two files are byte-identical in the post-run copy (`cmp`; sha256
  `c9e33f71…` in `input/documents.json`).
- **Impact:** 1 request (2.63 s, 1,544 B) and a correctness risk. The live
  path is not the captured input, so a plan edited after the run started
  would have been analysed instead of the captured one, and the agent would
  have called it captured.
- **Confidence:** high for the mechanism. Causation of the re-read is likely
  but not certain: the agent cites the empty wrapper, but step 1 may also have
  prompted the read.
- **Correction direction:** keep the plan inside `<plan>` and do not also
  deliver it as a requirements bullet, or replace the wrapper with a pointer
  to the requirements block. Give the captured file path
  (`.harness/jobs/<run>/input/plan.md`) wherever the procedure says
  "captured path".

### F2: A declared-checks block written for engineers was delivered to a read-only, shell-less role (Low)

- **IDs:** inv-0002, block `brief:support:declared-checks` (1,820 B).
- **Excerpt:** "These are declared checks, not a focused command. Inspect
  their configuration for how to run particular tests. The gate runs the
  audit; shell refuses whole suites and watch mode." The block follows this
  with configuration pointers to `ramify-audit.json`, `ramify-agent.json`,
  `package.json` and `cucumber.js`. The text comes from
  [starting-inputs.ts:64](../../../../subs/harness/src/work/starting-inputs.ts).
- **Expected:** the initial analysis runs no tests, and this role has no
  shell (`availableTools: read, grep, ls, submit_initial_analysis`). The block
  meets no information need of this task, and its shell sentence names a tool
  the role lacks.
- **Observed:** calls 13 to 15 read `package.json`, `cucumber.js` and
  `vitest.config.ts`: 3 requests, 7.27 s, 3,569 B. The submission's
  coverageLimits then carry a test-selection note ("focused badge regression
  tests can be selected with npm test -- …") that the analysis does not use.
- **Impact:** small. The match between the block's pointers and the reads,
  and the resulting note, make the link likely, but reasoning text was not
  retained, so the cause is unproven.
- **Correction direction:** omit declared checks from the initial-architect
  brief, or render a role-appropriate variant without the instruction to
  inspect configuration or the shell sentence.

### F3: The view README's module-path convention does not match the view's layout (Low, view content)

- **IDs:** inv-0002, transcript n=10 to n=14.
- **Excerpt (in-run README, n=10):** "For one module, read
  <module>/module.json, behavior.jsonl and tests.jsonl." The module map below
  that line, and `environment:views.modules`, list identities such as
  `collection-review/workspace/shared-ui`. The view stores that module under
  `.ramify-architect/workspace/shared-ui/`.
- **Observed:** the agent expanded `<module>` to the identity, and
  `ls .ramify-architect/collection-review/workspace/shared-ui` failed. It then
  listed `.ramify-architect`, inferred the layout and read the correct files.
  Cost: 2 requests, 6.95 s, and one failed tool call (the "failed" entry in
  `exploration.metrics.coverage`).
- **Confidence:** high. The failed path is the literal substitution.
- **Correction direction:** in the Ramify architect view, either state the
  path rule ("identity without the root segment") or print each module's view
  directory in the map. Alternatively, include the directory in the harness's
  `environment:views` block.

### F4: Discovery guidance assumes a shell and `rg` (Low)

- **IDs:** inv-0002, transcript n=8 (the reference as returned) and n=10.
- **Excerpts:**
  - `references/discovery.md`: "Use `rg -l` or `rg -c` over `*.jsonl` to
    locate candidate files" and "repeat the bounded search with shell `rg`".
  - The view README: "rg -n -i '<terms>' .ramify-architect/".
- **Expected and observed:** the skill text inlined in the system prompt was
  adapted ("There is no shell"), but the reference it routes to was not. The
  agent substituted the `grep` and `read` tools. There was no error and no
  clarification.
- **Impact:** none observed. A conflict between inherited reference guidance
  and the role's tools remains for weaker models.
- **Correction direction:** adapt the referenced discovery text for
  tool-only roles, or have the system prompt say that `rg` means the `grep`
  tool.

### F5: The coverage-limit instruction invited a whole-view grep (Low)

- **IDs:** inv-0002, call 11 (n=23), the only request with notable reasoning
  before it (95 reasoning tokens, 6.47 s).
- **Excerpts:**
  - Procedure step 15: "Record in `coverageLimits` every statement the view
    makes about what it could not establish".
  - System prompt: "Retain unavailable or incomplete details explicitly; do
    not search for missing metadata".
- **Observed:** the pattern `cut|Unavailable|unknown|unavailable` over every
  `*.json*` file in the view returned 15,492 B, the largest result of the
  invocation. It was truncated, consisted mostly of test titles containing
  "unknown" and `"unknown": 0` counters, and added 4,164 uncached input tokens
  to the next request. The submission's coverage statement relies on
  `_meta.json` and the shared-ui records, which the agent already had.
- **Impact:** 1 request and about 15 KB of low-value context. The cause is
  partly the model's pattern choice.
- **Correction direction:** say that `_meta.json`'s counts plus the per-record
  `cut` markers on cited records satisfy step 15, and that no project-wide
  search is needed.

### F6: Environment fields with no use for this task (Low, relevance)

- **Fields (manifest bytes):**
  - `environment:limits`, 1,074 B: mostly iteration, repair and placement
    budgets of other roles; the only relevant limit,
    `rejectedSubmissionsPerTurn`, is already paraphrased in the system prompt;
  - `environment:supportPaths`, 277 B: harness-relative paths such as
    `subs/harness/src/prompts/initial-architect.system.md`, which do not exist
    under the project root, and whose content is already inline;
  - `candidate`, `snapshot` and `cucumberConfiguration`, 349 B in total: null
    values;
  - `workingDirectory`, 241 B: duplicates `projectRoot`;
  - 19 repetitions of "Current value; replaces any earlier value for this
    key." (about 1.1 KB): fresh session, nothing to replace.
- **Total:** about 3 KB of the 20.9 KB message.
- **Observed effect:** none. The agent never tried to read a support path.
  This content was cached within the session after the first request, so its
  cost was small. The issue is relevance, not cache cost.
- **Correction direction:** select environment fields by role. Drop or mark
  support paths that are not readable from the working directory.

### No issue found

- **Submission contract:** the 5.8 KB JSON Schema sits in the tool
  description while the declared `parameters` is an empty object. The same
  pattern appears for inv-0001, inv-0003 and inv-0004. Here the first
  submission was accepted, so no defect was observed for this kind.
- **Scenario rules:** the plan scenarios were restated exactly.
  `integrationScenarios` and `proposed` were correctly unused.
- **Hypotheses:** zero hypotheses is consistent with "Record no hypothesis
  that restates an entry". The extension is local to the entry's owner.
- **Procedure and inherited guidance:** the session was fresh, so there was no
  inherited history to conflict with the current task.

### Observation, not a defect in this run: entry-versus-extension semantics

The procedure says an entry capability "is always new", and it offers
`changesExistingSymbols` only on hypotheses. This plan's entry extends an
existing exposed symbol (`StatusBadge`, `StatusBadgeProps`) that has two
recorded consumers. The entry schema has no field for that fact. The agent put
it in citation notes ("this is the existing primitive to extend"). Whether
downstream break analysis needed it is outside this review. Without retained
reasoning, no effect on the 57 s submission request can be shown.

## Observed effects

- **Request budget:** 16 requests, 100.28 s of model time
  (`modelElapsedMs` 99,097) and 0.556 s of tool time. By purpose:

  | Purpose | Requests | Seconds |
  |---|---|---|
  | View orientation and discovery | 9 | 27.6 |
  | Plan re-read | 1 | 2.6 |
  | Skill reference | 1 | 2.9 |
  | Source | 1 | 2.75 |
  | Runner configuration | 3 | 7.3 |
  | Submission | 1 | 57.05 |

  Requests traceable to F1, F3 and F2 (6 requests, 16.9 s): F1 re-read,
  2.6 s; F3 failed and recovery `ls`, 7.0 s; F2 configuration reads, 7.3 s.
  F5 accounts for one more request (6.5 s). The agent never issued two calls
  in one response, so every step cost a full model round trip.
- **Errors:** one tool error, the failed `ls` (F3), recovered on the next
  call. There were no clarification attempts, rejected tool inputs or
  rejected submissions (`rejectedSubmissions: 0`), no repair, and the
  catalog check (inv-0003) made no corrections.
- **Cache:**
  - Every native request kept identical instructions and tools (one hash
    across all 16) and extended the previous input exactly.
  - Request 14 (n=29, the request that issued the `cucumber.js` read) nonetheless had a full
    miss: `cacheRead: 0` and 16,950 new input tokens, an estimated $0.0341 of
    the invocation's $0.1196 (28.5%). The next request read 16,384 cached
    tokens again.
  - The retained prefix rules out a prompt-side cause. The reason is unknown
    and provider-side, not attributable to this prompt.
  - Invocation totals: input 37,176 tokens, cacheRead 162,944, output 2,895.
- **Causality:**
  - The F3 error is causal: the failed path is the literal README
    substitution.
  - F1 is strongly correlated: the agent names the empty wrapper.
  - F2 is correlated: the reads match the block's pointers.
  - F5 is partly a model choice.
- **Delivery-time adequacy:** judged before using later behavior, the prompt
  gave every needed fact or a working pointer. The defects added steps but
  removed no information the agent needed.

## Suggested corrections

1. **F1:** deliver the plan once, inside its announced `<plan>` wrapper or
   through an explicit pointer to the requirements block, and give the
   captured file path for the root plan. To validate: a rerun of this fixture
   shows no plan read, or a read of `input/plan.md`.
2. **F3 (Ramify architect view):** print each module's view directory in the
   README map, or state the identity-to-directory rule. Alternatively add
   `directory` to `environment:views`. To validate: no failed `ls` and no
   root listing before the first `module.json` read.
3. **F2:** remove declared checks from the initial-architect brief, or render
   a variant without "Inspect their configuration" and the shell sentence. To
   validate: no reads of runner configuration in the analysis.
4. **F5:** clarify that step 15 is satisfied by the `_meta.json` counts and
   the `cut` markers on cited records.
5. **F4 and F6:** adapt the discovery reference to tool-only roles, and
   select environment fields by role (limits, null fields, unreadable support
   paths).
6. **Optional:** to reduce round trips on this provider, encourage batching
   of independent reads (the request allowed parallel calls). This affects
   speed, not adequacy; measure it by requests per invocation in a comparison
   run.

## Evidence gaps

- Reasoning content was not retained. The thinking blocks have empty text and
  only `reasoningTokens` counts survive (95, 26 and 385 at n=23, 25 and 33).
  The motives for the plan re-read and the configuration reads rest on the
  submission's own coverage-limit text and on the order of the reads.
- The post-run architect view is revision `…:12` with input `a349017e…`, not
  the run's `…:1`. View contents during the run are known only from the
  retained tool results. Files the agent did not read, including which 11
  records were cut and which 4 lack details, cannot be verified for the run's
  revision.
- Per-request start times are not recorded. Request durations are derived
  from transcript timestamps (previous tool result to the assistant message)
  and sum to 100.28 s, against 99,097 ms recorded model time.
- Plan equality: the live plan and the captured plan are identical in the
  post-run copy. That they were identical at the moment of the read (10:45:29Z)
  is inferred.
- Cause of the request-14 cache miss: the provider's eviction or routing is
  not observable from the retained evidence.
- The harness-source explanations of F1 and F2 come from the run's recorded
  revision (5169117, clean). The delivery itself is established by the native
  request bytes, not by that source.
