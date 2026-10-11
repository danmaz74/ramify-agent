# Prompt review: nonfunctional-coordinator assessment

Run `20261009T193340Z-51f42e`, plan `status-badge-tone`, harness revision
474ffa58, model `openai-codex/gpt-5.6-sol:high`, pi 0.87.1.

## Summary

The single non-functional assessment prompt (inv-0013, fresh session ses-0011)
gave the coordinator what it needed. The prompt carried the goal, the four NFRs
verbatim, read-only authority and the candidate tree. It also gave named
comparisons with their changed paths, precise starting points, an explicit
source-analysis evidence rule and a usable submission contract. The coordinator
read the badge, its tests, the scenario and steps, both callers, the callers'
tests, the vocabulary type, the module declaration and the runner configuration.
It submitted four `satisfied` results that were accepted on the first attempt,
and round 1 closed satisfied. Checked against the candidate source
(b999ea9 / tree 4e706c2d), all four verdicts are correct.

The weaknesses are small. The grounding for nfr-004 overstates how well the
"existing tests" survived. The existing test file was rewritten, not left intact,
and the result's uncertainty field does not mention this. nfr-003 does not
address the one rendering difference that unchanged callers now show
(`data-tone="neutral"`). About 3.3 kB of the 13.7 kB task message is
environment material that this read-only task cannot use, including a view path
that its tools cannot reach. The task line contains an unresolved
`for {}` placeholder. Some tool calls rediscovered facts the prompt already
supplied, such as diffs of added files and of callers absent from
`changedPaths`, about 4.2 kB of 39.6 kB returned. None of these issues caused a
rejection, a clarification or a wrong verdict.

## Coverage

| Item | IDs | Evidence used |
| --- | --- | --- |
| Invocation | inv-0013 (operation inv-0013) | `J/invocations/inv-0013/{invocation,submission,outcome}.json`, `observations.jsonl` |
| Session | ses-0011, pi session `4d8bb57a-c1b5-4934-ad4c-3582c17c3586`, fresh, source checkpoint `e5076b3a…` turn 0 | `J/transcripts/ses-0011.jsonl` (41 entries) |
| Delivered prompt | packet `requestHash 87f859dc…`, message blob `1facc15f…` (13,710 B), role instructions `3fdc182d…` (1,044 B), procedure hash `52d191a9…` | `D/invocations/inv-0013/{packet,task,native-first}.json`; correlation `O/correlations/operations/66645e67….json` |
| Native requests | 5 (first `b1e471a8…`, last `2d72b05e…`) | `D/invocations/inv-0013/native-first.json`, inventory |
| Model calls | 5: transcript entries 3, 11, 21, 28, 37; usage observations 2, 34, 76, 104, 140 | observations, transcript |
| Tool calls | 30 (15 snapshot_read, 6 snapshot_diff, 3 snapshot_list, 6 snapshot_search) + 1 submission | transcript, observations |
| Records produced | nfa-001, cand-001, round 1 (`outcome: satisfied`, no investigation/repair) | `J/nonfunctional/**` |
| Context checked | captured plan `J/input/plan.md`; candidate source via `git show b999ea9:` in the project copy; gate ga-0003 (work-item, passed on b999ea9) | project copy, `J/gates/` |

This is the run's only instance of this kind, and there are no continuation,
fork or retry variants. The harness source at 474ffa58 was used only to
explain the placeholder (`subs/harness/src/run/service.ts:4786`) and the
evidence sentence (`subs/harness/src/nonfunctional/prompts.ts:9`).

## Required information

| Need | Status | Where / note |
| --- | --- | --- |
| Objective | Met directly | `brief:goal`, `brief:support:context:0`, `procedure:…:assessment`, task block |
| NFR wording and IDs | Met directly | `brief:requirements`: nfr-001..004 verbatim, "Deviations: none" |
| Wider plan intent (Request/Acceptance) | Obtainable via pointer, not signposted | Each NFR header names `plans/status-badge-tone/plan.md`. That file is in the candidate tree and inside `readScope ["."]` (only `.harness` dirs are excluded), but the prompt never says it may be read. The coordinator did not read it. |
| Authority / write scope | Met directly | "Do not edit source", read-only tool set, `policy.authority.writer false` |
| Current state | Met directly | `brief:support:nonfunctional-source`: head, tree, `run-start` comparison listing 5 changed paths, empty `accepted-boundary` |
| Dependencies (callers of the badge) | Obtainable with available tools | Not in the starting points. One `snapshot_search StatusBadge` (entry 3) found both callers, which matches a `git grep` of the candidate. |
| Execution location | Met directly, with inapplicable extras | Snapshot tools take candidate-relative paths. The absolute `projectRoot`/`workingDirectory` cannot be used with these tools. |
| Verification expectations | Met directly | "Analysis of the source is sufficient evidence, including for requirements about tests or behavior; choose undetermined only when the source cannot settle…" This matches the operator's source-analysis decision. |
| Evidence exclusions | Met directly, with one inconsistency | Git metadata, generated views and run records are excluded. The `environment:views` block still advertises `.ramify-architect`, and the role text allows "adequate Ramify evidence". |
| Expected submission | Met directly | `submit_nonfunctional_assessment`; the schema appears in the tool description (provider `parameters` is only `{type: object}`). Accepted first time with 0 rejections. |
| Stale or contradictory information | None material | Starting-point notes come from inv-0006/inv-0007 and matched the candidate. |

## Per-NFR grounding

| NFR | Verdict | Grounding inspected | Adequacy |
| --- | --- | --- | --- |
| nfr-001 presentation primitive, tone as prop | satisfied | Full `status-badge.tsx` (imports, props, render), `module.ramify` (tags `[ui, browser]`, exposes only `StatusBadge`, `StatusBadgeProps`), README, `vocabulary.ts` | Adequate. The coordinator saw the whole file, so no hidden imports were possible. The pre-existing `ReviewStatus` type import was reasoned about explicitly and named in the uncertainty field. |
| nfr-002 status/label meaning; tone never changes the word | satisfied | Render expression `label ?? defaultLabels[status]`, with tone used only in `data-tone`; unit tests and scenario steps | Adequate. The data-flow argument is decisive, and the tests corroborate it. |
| nfr-003 no feature view changes; callers render as today | satisfied | Both callers read in full, two caller diffs (unchanged), both caller tests (all `toContain` assertions) | The verdict is correct, but the grounding is incomplete. Every existing badge now renders an extra `data-tone="neutral"` attribute. The result neither mentions this nor checks the stylesheet: `subs/workspace/src/styles.css` has rules only for `data-status`, so appearance is unchanged. It also does not cite the plan, which requires the neutral default. See F2. |
| nfr-004 existing tests still pass; tone has own tests | satisfied | Test file and its run-start diff, feature, steps, vitest/cucumber/package/tsconfig discovery | The conclusion is supportable: evidence item 4 shows that the original assertions remain valid against the new expression. Evidence item 1 overstates how much of the test file survived, and the uncertainty field omits that the existing tests were edited. See F1. |

## Findings

### F1: nfr-004 evidence overstates how much of the existing tests survived (low)

This affects inv-0013 and nfa-001/nfr-004.

The artifact is `J/invocations/inv-0013/submission.json`, results[3].evidence[0]:
"The existing static-markup test suite retains its original guarantees for
default status words, custom labels, and `data-status`…". The uncertainty
field reads: "No material source-level uncertainty."

The goal of this NFR is to establish that the badge's pre-existing tests still
hold, which makes it a preservation requirement. At run start
(`git diff 58ffecde b999ea9 -- …/status-badge.test.tsx`), the file's two
original tests were both renamed. The custom-label test's input was also
changed from `<StatusBadge status="failed" label="No revisions" />` to add
`tone="critical"`. As a result, the original no-tone custom-label case is no
longer exercised exactly as it was. The coordinator read this diff (entry 9),
but its result presents the file as retained and records no uncertainty.

Evidence item 4 (the label path does not depend on tone, so the original
assertions remain valid) supports the verdict, and the work-item audit ga-0003
passed on the same commit. The verdict is therefore right, but a reader of
nfa-001 would not learn that the "existing" tests were rewritten. Confidence
is high: the diff and the submission text are unambiguous.

The correction direction is to tell the coordinator, for NFRs about preserved
tests or callers, to state whether the pre-existing items are unchanged,
modified or removed relative to the base. Where they were modified, it should
argue preservation of the original assertions and record the modification
under uncertainty. This belongs in the assessment procedure or in
`nonfunctional/prompts.ts`, not in any one NFR.

### F2: nfr-003 does not address the new attribute on unchanged callers (low)

This affects inv-0013 and nfa-001/nfr-003.

The artifact is results[2]. The evidence there argues source compatibility and
unchanged caller tests, and the uncertainty field reads: "No material
source-level uncertainty."

"Rendering the badge as they do today" includes markup and appearance.
Unchanged callers now emit `data-tone="neutral"`. That is intended by the
plan's Request ("A badge rendered without a tone reads as `neutral`"), and it
is invisible because `styles.css` keys only on `data-status`. Neither fact was
inspected or cited. The prompt's package carries only the Constraints-derived
NFR text, not the Request that makes the extra attribute intended. The plan
file is reachable through the path named in each NFR header, but the prompt
does not point to it as context.

The verdict is correct, so the impact is limited to auditability. Confidence
in the gap is high. Whether the attribute should count as a change in
rendering is a judgment call.

The correction direction is a one-line note in `brief:support:context:0`. It
should say that the plan document named in each NFR header is in the readable
tree and may be read for intent, without being treated as evidence.
Alternatively, the package could include the plan's request bullets as
non-authoritative context.

### F3: environment blocks the task cannot use (low; relevance, not cost)

This affects inv-0013.

The artifact is `D/invocations/inv-0013/task.md`. The relevant blocks are
`environment:views` (1,166 B, which advertises
`…/collection-review/.ramify-architect`), `environment:supportPaths` (237 B,
harness-internal `subs/harness/src/nonfunctional/*.md`),
`environment:limits` (1,074 B, run-wide limits such as `maxWorkItems` and
`forkRetriesPerRequest`), `environment:cucumberConfiguration` (133 B, `null`),
`environment:projectRoot` and `environment:workingDirectory` (424 B, absolute
paths) and the duplicate `environment:candidate`/`environment:snapshot`
(292 B, the same hash already given in the goal and source blocks).

The goal is to give a read-only, snapshot-only assessor only the context it can
act on. The mismatch is that the snapshot tools exclude `.ramify-architect`,
and the context block says generated views are excluded from source evidence,
so the views block is both inaccessible and inconsistent with the evidence
rule. The support paths are not in the target project. The agent has no
filesystem or shell tools, so absolute roots are unusable.

These blocks total 3,326 B, which is 18.6% of the 17,839-byte first-request
prefix (instructions 1,044 B + tools 3,085 B + message 13,710 B). The
provider reported 4,230 uncached input tokens for that prefix. A
byte-proportional estimate puts these blocks at about 790 tokens. This is a
proportional estimate, not a tokenizer measurement; hashes and JSON probably
tokenize more densely. Later calls read the prefix from cache (cacheRead
4,096–12,544), so the cost is small. The relevance problem remains. No
observed effect: no call targeted views, support paths or absolute paths.
Confidence is high.

The correction direction is to omit the views, supportPaths and
cucumberConfiguration blocks, and to omit limits unrelated to submission
rejection, for roles whose tool set cannot use them. Collapse candidate and
snapshot into the source block.

### F4: action instructions inside the assessment procedure (low)

This affects inv-0013.

The artifact is `procedure:nonfunctional-coordinator:assessment`, paragraph 2
(332 B): "When asked for an action, use the named action tool to request a
sequential investigation, one repair batch, or closure…". The role text also
contains a 392-byte paragraph about investigation and repair.

The goal is for the assessment procedure to describe the assessment only.
This task has no action tool, and nothing asks for an action. The paragraph
belongs to the action procedure. The role text is shared across
coordinator tasks and is reasonably kept as a cacheable prefix, so only the
procedure paragraph is extraneous. No observed effect. Confidence is high.

The correction direction is to move that paragraph to the action procedure.

### F5: wording-preservation instructions the submission schema cannot carry (low)

This affects inv-0013.

The artifacts are the role text ("Preserve their wording and the difference
between stated and inferred conditions"), the context block ("Carry their
wording and stated/inferred conditions forward unchanged") and the procedure
("Preserve the element wording"). The submission schema allows only `nfr`,
`result`, `inspectedScope`, `evidence` and `uncertainty`, with
`additionalProperties: false`.

The goal is that the instructions are actionable with the given schema. They
are not: there is no field for wording or conditions. The coordinator
reasonably ignored them, and all conditions were "none recorded". With
recorded conditions, a model could try to add fields and be rejected. No
observed effect. Confidence is high that the instructions cannot be acted on,
and low that this would ever cause a rejection.

The correction direction is to rephrase for assessment as "judge against the
element's exact wording and conditions; do not restate them", or to add
fields if preservation must be recorded.

### F6: unresolved placeholder in the task line (low, cosmetic)

This affects inv-0013.

The artifact is the task block: "Perform assessment for {}; use the current
evidence and designated submission." The source is
`subs/harness/src/run/service.ts:4786`, which does
`JSON.stringify(request.work)` for plan-level work.

The goal is a meaningful task line. The plan-level work is empty, so the line
renders as `{}`. No observed effect, because the goal block states the subject.
Confidence is high.

The correction direction is to render a subject for plan-level tasks (for
example "the plan's NFR catalog at <tree>") or to omit the clause.

### F7: rediscovery of facts already in the source block (low)

This affects inv-0013, entries 11 and 28.

The `run-start` comparison already lists 5 changed paths. The two
feature-view files are absent from that list, and the feature and steps files
are marked `A`. Even so, the coordinator diffed both callers (entry 11,
results "The candidate did not change …", 292 B). It also diffed the added
steps and feature files after reading them in full (entry 28, 3,934 B
duplicating 3,455 B already read). It listed `shared-ui`, whose contents the
starting points already named (28 B).

The goal is that supplied comparison facts are used rather than re-derived.
These calls amount to 4,254 B of 39,602 B returned (10.7%) and four of the 30
calls. They are correlated with the prompt's generic "inspect … using
snapshot_list/read/search/diff" wording, and with the absence of a note that
paths missing from `changedPaths` are unchanged and that `A` files have no
prior content. The evidence does not show causation. The cost is small
because the calls ran in parallel batches. Confidence is medium.

The correction direction is one sentence in the source block: paths not listed
are unchanged against that base, and an `A` diff equals the file's content.

### F8: passing audit withheld for a "tests still pass" requirement (informational; operator decision)

This affects inv-0013 and nfr-004.

The context block says "Pointer notes, earlier completion claims and green
audits do not establish fixed/NFR satisfaction". Gate ga-0003 (work-item,
`verdict passed`) audited exactly b999ea9 at 19:38:56, three seconds before
the candidate was prepared.

Under the operator's rule, source analysis settles this NFR, and the
coordinator did so. To approximate "still pass", it spent the entry 21–28
calls (`package.json`/`tsconfig.json` searches and reads, `cucumber.js`,
`vitest.config.ts`, about 5.8 kB) establishing that the runners can discover
the tests. This is consistent with the decision and is not a defect.

If useful, the gate verdict on the same tree could be supplied as
supplementary, non-decisive context for NFRs that name test execution. This
would leave the source-analysis rule unchanged. It is the operator's call.

## No issue found

- The task was identifiable and the submission usable. The only submission
  passed validation first time (`rejectedSubmissions 0`).
- All declared tools existed and behaved as described. The `snapshot_diff`
  enum offered exactly the two named comparisons, and no tool error occurred.
- Authority was unambiguous: there were no edit attempts, and `outsideScope`
  was empty.
- The starting points were accurate and decisive: the first call batch read
  all four relevant files and the two key diffs in parallel.
- The missing caller pointers cost one search.
- Nothing in the inherited context applied: the session was fresh at a
  turn-0 checkpoint, and `manifest.inheritedPoint` was null.
- Exploration was proportionate overall: 5 model calls, 62 s, an estimated
  $0.144, and 15 unique files for 4 NFRs spanning the badge, its two callers
  and the test runners. Every file read except the redundancies in F7 served
  at least one result.

## Observed effects

- Entry 3: one parallel batch covered all starting points (4 reads, 2 diffs)
  plus the caller search. The pointers were used as intended.
- Entry 11: the callers, the vocabulary, the module declaration and README,
  and two redundant caller diffs (F7).
- Entries 21–28: runner discovery for nfr-004 (F8), caller tests for nfr-003,
  and two redundant diffs of added files (F7).
- Entry 37: a single submission, accepted.
- No clarification, rejection, retry or repair occurred.
- The omissions in F1 and F2 did not change any verdict. They affect only how
  self-explaining nfa-001 is.
- The extraneous blocks (F3, F4) correlate with no behavior; the agent never
  referred to them.

## Correction suggestions

1. In the assessment procedure or `nonfunctional/prompts.ts`, for
   preservation requirements, require stating whether existing tests or
   callers are unchanged, modified or removed relative to the base, and
   recording modifications under uncertainty (F1).
2. Say that the plan document named in each NFR header is readable for intent,
   or include the plan's request bullets as non-authoritative context (F2).
3. Trim environment blocks to what the role's tools can use. Drop views,
   supportPaths, cucumberConfiguration and the run-wide limits. Fold
   candidate and snapshot into the source block (F3).
4. Move the action paragraph out of the assessment procedure (F4).
5. Make the wording-preservation instructions match the schema (F5).
6. Render a real subject for plan-level task lines (F6).
7. Note in the source block that unlisted paths are unchanged and that `A`
   diffs equal file content (F7).
8. Optionally, surface the same-tree gate verdict as supplementary context
   for test-execution NFRs (F8; operator decision).

## Evidence gaps

- Model reasoning is encrypted. Only summary headings are visible (for example
  "Verifying TypeScript assertions and test modifications" at entry 37), so
  whether the coordinator consciously weighed the test edits (F1) is
  inferred, not observed.
- Token shares per block are byte-proportional estimates against the measured
  4,230-token first call. No provider tokenizer was applied.
- The readability of `plans/status-badge-tone/plan.md` through snapshot tools
  is inferred from `readScope` and the exclusions plus the candidate tree. The
  agent never tried it.
- Only `native-first.json` was inspected directly among the native payloads.
  Later requests were assumed to keep the same instructions and tools, based
  on the cache-read pattern and a fresh session, without being compared byte
  for byte.
- The contents of the ga-0003 audit report were not examined beyond its
  attempt record's verdict and audited commit.
