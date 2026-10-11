# Prompt review: reviewer scope (inv-0009, ses-0008, rq-0002.a01)

Run `20261011T104510Z-0e1b47`, plan `status-badge-tone`, collection-review
fixture, `openai-codex/gpt-6.1-sol:high`, pi 0.87.1, harness ramify-agent
5169117. Evidence root:
`/home/app/ramify-trial-evidence/status-badge-tone-gpt61-20261011T104510Z/`
(paths below without a prefix are relative to its
`collection-review/plans/status-badge-tone/.harness/jobs/20261011T104510Z-0e1b47/`).

## Summary

The scope-review prompt was adequate, and the verdict is supported. The
delivered message supplied the iteration's goal, approach and completion
evidence, all ten cited plan elements, the canonical changed-path list and
complete patches. The patches are identical to `git diff 9792902 e6356f5`,
10,443 bytes. The message also attributed the feature-file tag removal to
the harness. The reviewer submitted once, with five paths inspected, nothing
missing and no concerns, and the harness accepted it. My own reading of the
plan, the patch and the two unchanged callers finds no gap in either
direction, no less and no more.

Only the first and last of the seven model requests had a purpose. The first
read the plan, which the procedure's grounding rule requires before a concern
can cite it. The last submitted. The five in between read `ramify-audit.json`,
`ramify-agent.json`, `package.json` and `cucumber.js`, then listed
`src/tests/`. None of this bears on scope. The reviewer's own reasoning says it
took the "Declared project checks" and "Candidate test pointers" blocks as
mandatory ("I'll need the mandated reference readings, along with a list of
tests"). The fresh code reviewer (inv-0008) made the same five calls, so the
task blocks caused them, not the inheritance. These five requests took
11.8 s of the 23.6 s of model time and $0.0269 of the $0.0572 estimated
charge.

The inheritance did not make this exploration necessary, but it multiplied
its cost. Every request carried the architect's cached prefix: 26,112 tokens
on the first call and at least that on each later one. That is about 183K of
the 254,336 cache-read tokens. The fork preserved the prefix exactly, and the
first post-fork call hit the cache at 71%. About 5 KB of the roughly 134 KB
inherited request bytes supports this task: the assignment submission's
outline and write scope. The rest is the architect's orientation task,
exploration, tools and assignment procedure. The reviewer also issued its
calls one per request, while the fresh code reviewer batched the same calls
in one request. Its first reasoning shows uncertainty about the "old
multi-tool definitions". The link to the fork is a hypothesis.

## Coverage

- Kind: `reviewer:scope`, prompt package `reviewer/4`, procedure
  `procedure:reviewer:scope` (SHA-256 `1a71d29c…44ede`, source
  [scope-review.procedure.md](../../../../subs/harness/src/prompts/scope-review.procedure.md),
  file hash `87f983e7…dd67f3d`, which matches the file at 5169117). Role
  instructions
  [reviewer.system.md](../../../../subs/harness/src/prompts/reviewer.system.md)
  (hash `c600081d…f5ec1d`, which also matches). One variant: a fork of the
  local architect.
- Covered IDs: invocation inv-0009, harness session ses-0008 (pi session
  `ba339987-f3bb-46d9-bb0d-81a0e74e5ffb`), review request rq-0002, attempt
  rq-0002.a01, work item wi-001, iteration wi-001.i01, gate ga-0002,
  candidate `e6356f5` (tree `6074e7d4…`), diff base `9792902`. Fork source:
  ses-0004 (`1e001881-…`) at turn 2, checkpoint `defda554-…`, which is the end
  of inv-0006 (the assignment). The inherited history therefore covers inv-0004
  (orientation), the inv-0005 context package delivered into ses-0004, and
  inv-0006. It includes nothing from inv-0010, which continued ses-0004
  concurrently from the same point.
- Artifacts read:
  - Run records: `reviews/rq-0002/request.json`,
    `reviews/rq-0002/attempts/01/{attempt,submission}.json`,
    `invocations/inv-0009/{invocation,submission,outcome,observations}.json[l]`
    (the delivered-inputs manifest is in `invocation.json`),
    `transcripts/ses-0008.jsonl`, `events.jsonl` sequences 60–110.
  - Native requests: the first native request, both as the extract
    [native-first.json](../invocations/inv-0009/native-first.json) and as
    payload `fe2529bf…a2ff`.
  - Derived extracts: [packet.json](../invocations/inv-0009/packet.json),
    [task.md](../invocations/inv-0009/task.md), and the inv-0009 rows of
    [inventory.json](../inventory.json), [tools.json](../tools.json) and
    [summary.json](../summary.json).
  - Candidate source: the plan, the feature file and the callers in the
    evidence repository at `e6356f5`.
  - Harness source:
    [starting-inputs.ts](../../../../subs/harness/src/work/starting-inputs.ts)
    and [review-step.ts](../../../../subs/harness/src/steps/review-step.ts).
  - For comparison only: the transcripts of inv-0008 and inv-0012 (ses-0007,
    ses-0010).
- The submission hash `ca5291ba…c0c7` is shared by inv-0008, inv-0009 and
  inv-0012 because the three review submissions have the same content. This
  is not a record defect.

## Required information

| Need | Status at delivery | Where |
| --- | --- | --- |
| Objective | Met directly | `brief:goal` "Review e6356f5…", and `# Current task: scope` with "Active role: reviewer" |
| Intent: goal, approach, completion evidence | Met directly; the inherited assignment submission also holds it | `brief:support:## The iteration:0` (2,313 B); inherited `submit_work_item_result` call (input item 59) |
| Plan constraints | Met directly, plus a pointer to the plan with an available tool | `assignment-package` quotes all ten elements whole; the plan is at `plans/status-badge-tone/plan.md` and is read with `snapshot_read` |
| Write scope of the iteration | Partly direct (rationale only); the concrete scope comes only through inheritance | The task gives "Its write scope's rationale". `scope.base.module = collection-review/workspace/shared-ui`, no `included`/`extra`, and the outline's "No stylesheet, feature-view, runner configuration or foreign contract change is needed" are in inherited item 59 only |
| Reviewer authority | Met directly | reviewer role ("You change nothing and decide nothing"); procedure ("You have no authority over the assignment") |
| Current state | Met directly | candidate, tree, base, "its gate ga-0002 passed", changed-path list, complete patches (10,443 B) |
| Harness-produced changes | Met directly | "The audited diff includes harness-produced changes; no feature or pending-tag patch is hidden", plus three pending-tag binding attributions |
| Dependencies | None needed | no foreign capability or deviation (`Deviations: none`) |
| Execution location | Met, with stale noise | reviewer role: "Every path is relative to the candidate's root". `environment:workingDirectory` names an empty attempt workspace, and the inherited `environment:projectRoot` absolute path is neither replaced nor withdrawn |
| Verification expectations | Met | gate passed. "this reader does not execute them" |
| Expected submission | Met | `submit_review` schema in the tool description, coverage rule in the procedure. Accepted first time |

No required information was missing, contradictory or inaccessible. A fresh
start (`reviewStartOf` falls back to fresh when no assignment is recorded)
would lose the concrete write scope and the outline's stated exclusions. Here
the changed paths all lie in `subs/workspace/subs/shared-ui/src/`, so that gap
would not have changed the verdict.

### The verdict against the delivered change

I checked each element against the patch. The results:

- fr-001: an optional four-value `tone` union on the exported props.
- fr-002, fr-003, fr-004, fr-005: `data-tone={tone}` on the same span, with
  a default of `'neutral'`.
- nfr-001: no new import or domain knowledge.
- nfr-002: the label expression is unchanged.
- nfr-003: `catalog-card.tsx` and `review-result.tsx` still render
  `StatusBadge` unchanged at `e6356f5`.
- nfr-004: the existing unit tests are untouched and new tone tests are added.

The approach's specific asks are met:

- the nullish label fallback, which the `@ts-expect-error` test covers;
- static-markup assertions on the same parsed span;
- per-World state through a `WeakMap`, without replacing the World;
- no edits to root configuration or harness feature files beyond the
  disclosed tag removal.

The test helper `badge-markup.ts` and the edge-case labels are test support
for the asked-for coverage, not unasked behavior. "No concerns" is supported.
Gate ga-0002 passing establishes suite health, not scope.

## Findings

### F1. Setup and test-pointer blocks drive non-scope reads (medium)

- IDs: inv-0009 (and, recurring, inv-0008).
- Location: [task.md](../invocations/inv-0009/task.md), blocks
  `brief:support:## Declared project checks:0` (866 B) and
  `brief:support:## Candidate test pointers:0` (1,479 B). Generated by
  `declaredCheckInputs` in
  [starting-inputs.ts](../../../../subs/harness/src/work/starting-inputs.ts)
  and included for every review kind except design
  ([review-step.ts](../../../../subs/harness/src/steps/review-step.ts):
  `if (kind !== 'design')`).
- Excerpts: "Read these project-relative references with
  snapshot_read/snapshot_list in the audited candidate." and
  "`subs/workspace/subs/shared-ui/src/tests/`: inspect with snapshot_list;
  read named files with snapshot_read."
- Expected: a scope review judges intent against the patch. Check
  configuration matters only when a concern would rest on it, and the gate
  had already passed.
- Observed: transcript n=3, thinking: "I'll need the mandated reference
  readings, along with a list of tests". Then n=5, 7, 9 and 11 read the four
  pointers in the order listed, and n=13 lists `src/tests/`. That listing
  returned 54 B naming only entries the changed paths already showed. At n=15
  the thinking reads: "The directive 'read named files snapshot_read' likely
  tests the pointer". None of the reads informed a concern or the coverage
  list. `package.json` and `cucumber.js` were unchanged and already present,
  at the base revision, in the inherited history (items 29 and 30).
- Impact: five of seven requests, 11,815 ms of 23,574 ms model time,
  $0.0269 of $0.0572 estimated, with 188,800 cache-read tokens in those
  requests. The cost per run is small and there was no effect on correctness.
  The scope review was not the critical path: design review rq-0003 finished
  later, at 10:52:58. Confidence is high for cause: the agent's own reasoning
  names the blocks, and the fresh code reviewer read the same five targets.
- Correction direction:
  - Omit `setup` and the test-directory pointer from scope reviews.
  - Otherwise, phrase both as optional, for example "Read only if a concern
    depends on how checks or tests are configured".
  - State in the scope procedure that the supplied patches and the plan are
    sufficient for a complete review.

### F2. The inherited architect prefix is mostly irrelevant, and its cost scales with request count (low)

- IDs: inv-0009, fork from ses-0004 at the end of inv-0006.
- Location: [native-first.json](../invocations/inv-0009/native-first.json).
  Inherited request bytes, measured as compact-JSON UTF-8 bytes of each
  request part:

  | Inherited part | Bytes |
  | --- | --- |
  | architect `instructions` | 4,361 |
  | top-level tools | 3,978 |
  | orientation task (item 0) | 20,187 |
  | orientation calls, results and reasoning (items 1–53; 39,169 B of tool output text) | 59,795 |
  | context package (item 54) | 3,129 |
  | architect tool additions (item 55, mostly the 20,393 B `submit_work_item_result` schema) | 21,233 |
  | assignment task (item 57) | 11,684 |
  | assignment reasoning, submission and result (items 58–60) | 9,044 |

  The total is about 133.6 KB. Appended reviewer material is 38,064 B: role
  2,880, tools 3,923, active-tools note 169, task 31,092.
- Expected: inheritance should carry the assignment intent the reviewer would
  otherwise lack.
- Observed: the relevant part is the assignment call in item 59, 4,985 B:
  outline, write scope and stated exclusions. Base-source reads of the badge,
  its test and the feature file, about 4.2 KB, are marginal context, and the
  reviewer role says "Inherited understanding never substitutes for current
  snapshot evidence". The other material is architect orientation and
  assignment procedure, view searches, World and `.ramify-architect` lookups,
  and tool schemas, none of which a scope review uses. The context package
  (3,129 B) is also delivered again as `assignment-package` (2,973 B), and
  the iteration intent appears both in item 59 and in `## The iteration`.
- Cache: the prefix was preserved: instructions, tools and input prefix are
  equal, the prompt-cache key is the same, and the boundary is recorded in
  [summary.json](../summary.json). The first call read 26,112 tokens from
  cache and took 10,495 new tokens (71% cached) after a 2 min 53 s gap.
  Requests 2 to 7 each read 36,480 to 39,424 cached tokens.
- Impact: this is an estimate, not a measurement. A fresh reviewer given
  the same appended material plus the item-59 fields would carry roughly 10K
  tokens per request. The scaling uses the about 4.5 bytes per token observed
  for this call's new portion, a ratio that is uncertain for encrypted
  reasoning. Against the observed seven requests, that removes about 183K
  cached tokens (about $0.018 at the recorded $0.10/M), with a similar
  first-call new input. If F1 is corrected and the review takes two requests,
  the inherited prefix costs about 52K cached tokens (about $0.005).
  Relevance is low, but because the prefix is cached its cost stays small
  unless requests multiply. Confidence: medium.
- Correction direction: keep the fork, which carries the assignment cheaply
  and exactly, but fix F1 first. Alternatively, render the assignment's
  `outline.changes` and concrete `scope` in the scope task and compare a fresh
  start on the same candidate. The comparison should measure requests, cache
  reads and concern quality.

### F3. Architect-era instructions and environment remain in force beside the reviewer role (low)

- IDs: inv-0009.
- Location: request `instructions` is still the local-architect system
  prompt: "You are the local architect of one module…", "`read`, `grep` and
  `ls` … are your only way to look at the project", and "search the
  `.ramify-architect/` directory". The reviewer role is a developer message
  (item 61): "You have no access to the working directory… a generated view
  such as `.ramify-architect/` are refused". The inherited
  `environment:projectRoot` (an absolute checkout path) and
  `environment:cucumberConfiguration: null` are not reset. The new
  `environment:workingDirectory` names an empty attempt workspace that the
  reviewer cannot use. `environment:supportPaths` lists harness source files
  (`subs/harness/src/prompts/…`) that do not exist in the candidate.
- Expected: one coherent role and path frame.
- Observed: the delta mechanism withdrew all 12 architect brief blocks
  (1,066 B of withdrawal notices), selected `procedure:reviewer:scope`, and
  said "Inactive historical tools must not be called". The agent used only
  snapshot tools with candidate-relative paths. It made no inactive-tool
  call, no rejected tool input and no refused path. Its first reasoning says
  "the reviewer's scope is not concerning architecture".
- Impact: no observed effect. This is a latent risk for a weaker model or a
  longer review. Confidence: high that the conflict is present, low that it
  matters here.
- Correction direction: when forking into another role, set or withdraw
  every environment field the new role does not use, such as `projectRoot`,
  `cucumberConfiguration` and `supportPaths`. Add one sentence to the
  appended role stating that it supersedes the earlier system role's tools
  and paths.

### F4. Calls serialized after the fork (low, hypothesis)

- IDs: inv-0009, with inv-0008 and inv-0012 for comparison.
- Location: transcript n=3: "I can use a parallel wrapper with the current
  tools, but I'm wondering about the old multi-tool definitions and if the
  wrapper is still active. I want to be careful to avoid just making calls
  without clarity." The request sets `parallel_tool_calls: true`.
- Observed: six independent calls went out in six requests. The fresh code
  reviewer (ses-0007) issued the same five pointer calls plus one more in a
  single request. The design reviewer, also a fork (ses-0010), serialized
  as well. In the inherited ses-0004 history the architect itself batched
  seven, eight and six calls.
- Impact: had they been batched, the five pointer reads would have needed one
  request instead of five. That would have saved about four requests of
  about 38K cached tokens each and about 9 s. Confidence that the fork's tool
  replacement caused the serialization: low. Two forked reviewers against one
  fresh one is a correlation.
- Correction direction: no prompt change on this evidence alone. Count
  requests per tool call by start mode across more runs before acting.

### F5. Directional references point the wrong way (low)

- Location: `## What the plan asks of it` contains no elements but says
  "the elements above are unchanged". The elements arrive later, in
  `assignment-package`. The procedure says "the elements of the plan the
  message below renders" and "The elements below ground a concern", yet the
  procedure block comes after them. It also says "`suggests` may name a
  CheckFinding the message below lists", but no check-finding list is
  rendered; the attempt records `checkFindings: []`.
- Observed: no effect.
- Correction direction: refer to blocks by name rather than position, and
  state "no check findings" when the list is empty.

No issue was found with the following:

- the submission contract;
- the coverage rule, which the delivered complete patches satisfied without
  any re-read;
- the plan-ground rule;
- the harness pending-tag attribution, which pre-empted a false "edited a
  harness feature file" concern ("I've also acknowledged the feature harness
  tags").

## Observed effects

- Sequence: ses-0008 n=2 (task) → n=3 plan read (needed for grounding) → n=5,
  7, 9, 11 configuration reads and n=13 list (F1, serialized: F4) → n=15
  submit → n=16 accepted. The invocation ran from 10:51:54.007 to
  10:52:19.157 (25.1 s). It had no rejected submissions, no tool errors and no
  clarification. It made no consultation, and none was available to it.
- Causal evidence: F1. The agent's reasoning names the blocks as mandatory,
  and the order of its calls matches the order of the listed pointers.
- Correlation only: F4 (serialization) and any role confusion from F3.
- The inheritance (F2) did not cause discovery. The agent did not re-read
  inherited files in place of the patch. The two configuration files it
  re-read were among the pointers it would have read anyway, as inv-0008
  shows.
- Outcome: rq-0002.a01 `complete`, `settles: true`, zero concerns. It agrees
  with the code and design reviews and with my own reading.

## Suggested corrections

1. For `kind === 'scope'`, drop the declared-checks `setup` and the
   test-directory pointer. Alternatively, mark them optional with a stated
   purpose. Add to the scope procedure: "The supplied patches and the plan are
   sufficient; read other files only to ground a concern." Validate on a
   re-run of this fixture. Expect two requests (plan read and submit), cache
   reads below 70K tokens, and an unchanged verdict.
2. Keep the fork, but render `outline.changes` and the concrete
   `assignment.scope` in the scope task. Then a fresh fallback is not weaker,
   and a future fork-versus-fresh comparison can be made fairly.
3. On role-changing forks, reset or withdraw unused inherited environment
   fields, and state in the appended role that it supersedes the earlier
   system role's tools and paths.
4. Name blocks instead of using "above" and "below", and render "no check
   findings" explicitly.
5. Measurement: record the number of tool calls per model request in the
   per-invocation evaluation. Also distinguish `snapshot_list` listings from
   content searches: the "1 search" in the metrics is a directory listing.

## Evidence gaps

- Reasoning content is encrypted, both the inherited items and the reviewer's
  own, 11,444 B of encrypted content in the first request. The transcript's
  thinking blocks are summaries. The cause of serialization (F4) cannot be
  confirmed from them.
- Section sizes are byte counts: compact-JSON UTF-8 for native items, and the
  manifest's `bytes` for blocks. Provider tokens per section were not
  recorded. Token figures for the counterfactual are scaled estimates.
- No cache-lifetime or eviction evidence is retained. The first-call hit is
  measured, but the reason why exactly 26,112 of the parent's 26,234 input
  tokens hit is provider behavior and is not explained by the records.
- Read observations record `outsideScope: null`. The `snapshot_list` call is
  classified as `search`, with matched files and scanned bytes not reported.
- Whether the reviewer drew on inherited base-source content cannot be
  established. Its reasoning does not mention it, and nothing it submitted
  depends on it.
- The execution checkout and attempt workspace under `/tmp/claude-1000/…` are
  not part of the evidence copy. Candidate content was verified from the
  copied repository at `e6356f5`.
