# Prompt review: reviewer design-orientation (inv-0011)

Run `20261011T104510Z-0e1b47`, plan `status-badge-tone`, collection-review
fixture, `openai-codex/gpt-6.1-sol:high`, pi 0.87.1, ramify-agent
`5169117d382c054fa10781acbc81c4abf7a76e01`. Evidence root (post-run copy):
`/home/app/ramify-trial-evidence/status-badge-tone-gpt61-20261011T104510Z/`.

## Summary

The orientation prompt did its own job. It delivered the right guidance for
this change: the three ancestor READMEs of the only changed module,
`shared-ui`. The project holds no `*.principles.md`. The objective and the
submission were clear. One model request produced an accepted, accurate
submission, with no rejection, tool error or clarification.

The orientation did not do what it exists for. The design fork (inv-0012)
inherited the guidance text, then was told that the guidance block was
withdrawn. It was also told to read any guidance not yet read "with
`snapshot_read`". The role's grounding rule accepts only files read with
`snapshot_read` in the review. The fork therefore re-read all three guidance
files as its first three tool calls, which returned 13,369 bytes that were
already in its context. The only benefit the orientation actually delivered
was prefix caching: the fork's first call read 4,864 cached tokens. That small
number is not a cache miss. It covers 97% of the orientation's whole
4,992-token prompt, so the base was used completely, and the base was simply
small. With one design review in the run, the orientation cost more than it
saved.

## Coverage

- Kind: reviewer `design-orientation` (`procedure:reviewer:orientation`,
  SHA-256 `e1fe7c5d…a67da449`, prompt package `reviewer/4`). There is one
  variant and one instance: inv-0011, harness session ses-0009, pi session
  `ae5ffcc0-c3f1-42f8-b75e-961a9aaf3663`. It started fresh and made one native
  request with 0 cache reads. It recorded orientation `07ec2fa2208c2e0c…`
  (event 96, `review-orientation-recorded`) for request rq-0003.
- The artifacts I read for inv-0011:
  - The derived extracts [packet.json](../invocations/inv-0011/packet.json),
    [task.md](../invocations/inv-0011/task.md) and
    [native-first.json](../invocations/inv-0011/native-first.json).
  - The retained native payload
    `collection-review/plans/.harness/session-operations/store/payloads/94264647f9b2…`,
    which is also the last payload. It is byte-equal to the extract's
    `request`, and its input text equals `task.md` (17,833 bytes, sha256
    `441c25ae8254…`).
  - The run records `invocations/inv-0011/{invocation,inputs,submission,outcome}.json`,
    `observations.jsonl`, `transcripts/ses-0009.jsonl`,
    `reviews/orientations/07ec2fa2208c2e0c.json`, `reviews/rq-0001…0003/request.json`,
    events 72 and 90–108, and `input/plan.md`.
- What I read to judge the fork's use of the orientation: the inv-0012
  `packet.json`, `task.md` and `native-first.json`, its `observations.jsonl`
  usage records, `transcripts/ses-0010.jsonl`, `submission.json`, and the
  `tools.json` and `inventory.json` entries. The design review itself is
  assessed in a separate review.
- Source at the recorded revision, used only to explain selection and
  wording:
  [reviewer-orientation.system.md](../../../../subs/harness/src/prompts/reviewer-orientation.system.md),
  [reviewer.system.md](../../../../subs/harness/src/prompts/reviewer.system.md),
  [steps/reviewer.ts](../../../../subs/harness/src/steps/reviewer.ts),
  [reviews/src/inputs.ts](../../../../subs/harness/subs/reviews/src/inputs.ts)
  (`guidancePaths`, `orientationKey`) and
  [reviews/src/message.ts](../../../../subs/harness/subs/reviews/src/message.ts)
  (`orientationMessage`, the design guidance section).

## Required information

The task was to read the captured design guidance and submit every guidance
path once, with a short account of what it asks of a design. It also had to
leave a session point that design reviews of the same guidance selection can
fork from.

| Need | Delivery | Assessment |
| --- | --- | --- |
| Objective | `brief:goal`, `brief:requirements`, `procedure:reviewer:orientation`, `task` | Met directly and consistently. |
| Plan constraints | None | Correctly absent. The orientation key covers guidance, package, model, context, scope and execution, not the plan ([inputs.ts](../../../../subs/harness/subs/reviews/src/inputs.ts) `orientationKey`), so plan text would prevent reuse. |
| Authority and write scope | Role prompt ("You change nothing and decide nothing"), procedure, `policy.authority.writer: false` | Met. |
| Current state (the guidance) | `brief:support:design-guidance`, 12,350 bytes: root `README.md` (10,705 bytes with its heading), `subs/workspace/README.md` (725), `subs/workspace/subs/shared-ui/README.md` (590), each with a sha256 prefix | Met directly. These are the right files: the candidate changed only `subs/workspace/subs/shared-ui/**`, `guidancePaths` takes principles documents and then ancestor READMEs, and the project has no `*.principles.md`. The shared-ui README grounds the plan's constraint that the badge "stays a presentation primitive of the shared UI". |
| Dependencies | None | Not applicable. |
| Execution location | `environment:projectRoot`, `environment:workingDirectory` | Not needed, since there are no file tools. The values are irrelevant but harmless. |
| Verification expectations | Procedure: "Name in `read` every guidance path the message gives". The validator requires each given path exactly once | Met. The prompt does not say "exactly once", but it did not need to. |
| Expected submission | `submit_orientation` declaration. The JSON schema is in the description, and the declared `parameters` is the empty `{"type":"object","properties":{}}` | Met. The model produced a valid submission on the first call. |
| Fork-base purpose | Procedure: "each design review of an iteration continues from what you have read here" | Stated. The fork's own prompt contradicts it later (F1). |

Nothing the orientation itself needed was missing, stale or inaccessible.

## Findings

### F1. Medium: the fork cannot use the orientation's reading, so the guidance is read twice

- **IDs:** inv-0011 (base), inv-0012 (fork), rq-0003, orientation `07ec2fa2208c`.
- **Where:**
  - The inv-0011 procedure says "Later, each design review of an iteration
    continues from what you have read here".
  - The orientation's `read` field lists the three paths, although no tool
    read them.
  - The inv-0012 message, block `brief:support:design-guidance`, says
    "Withdrawn; this block no longer applies." Its
    `## The guidance this design is judged against` block says "If this
    session has not read one of them yet, read it with `snapshot_read` before
    you judge."
  - The inherited role prompt, shared by both instances, says "Name only a
    file you read with `snapshot_read` in this review; an earlier
    conversation … does not count".
- **Expected:** a design fork continues from an orientation that already holds
  the guidance with matching hashes. It treats that guidance as read and
  fetches only the candidate files it needs.
- **Observed:** the fork received the guidance as an inherited block, a
  withdrawal of that block, and an instruction tied to `snapshot_read`.
  - Its first three tool calls were `snapshot_read` of `README.md`,
    `subs/workspace/README.md` and `subs/workspace/subs/shared-ui/README.md`
    (`tools.json`; transcript ses-0010, n=3–8). They returned
    12,019 + 757 + 593 = 13,369 bytes, all line-numbered copies of text
    already in the context.
  - They ran one per model request, although `parallel_tool_calls` was true.
    That added about 6 s (10:52:33.66 to 10:52:39.42) and two extra requests.
  - The second request's new input was 3,486 tokens, mostly the root README,
    and it was carried as cached input through six later requests.
  - The fork's submission had no concerns, so it never needed a ground. The
    re-read was compliance with the instruction, not grounding.
- **Impact and confidence:** the orientation's semantic content had no
  realized value. Its only effect was the cached prefix (F3). Confidence is
  high that the instructions directed the re-read: the withdrawal, the
  "has not read … with `snapshot_read`" wording and the grounding rule all
  point the same way. Whether the model would have re-read without them is
  unknown. The fork's reasoning summary ("I should check the current session")
  is too thin to settle this.
- **Correction direction:** give the two kinds one shared notion of "read".
  Either:
  - keep the orientation's guidance block in effect in the fork rather than
    withdrawing it; let a hash-matched orientation entry count as a readable
    ground; and have the design message say the guidance is already in
    context with these hashes, asking for `snapshot_read` only when a hash
    differs; or
  - stop delivering the guidance inline and orient through the same
    `snapshot_read` tool the design review must use.

  Under either option, the orientation's `read` field should mean what the
  design review means by read.

### F2. Low: the orientation's environment blocks carry about 3.4 KB that this task cannot use

- **IDs:** inv-0011.
- **Where:** in `task.md`:
  - `environment:views` (1,190 bytes) names
    `…/collection-review/.ramify-architect` and 15 modules.
  - `environment:limits` (1,073 bytes) holds 28 run and invocation limits.
  - `environment:supportPaths` (229 bytes) names
    `subs/harness/src/prompts/reviewer.system.md` and
    `…/reviewer-orientation.system.md`, which are harness repository paths.
  - `environment:projectRoot` (231) and `environment:workingDirectory` (341)
    hold absolute run paths.
  - `environment:candidate` (109), `environment:snapshot` (107) and
    `environment:cucumberConfiguration` (133) are all null.
- **Expected:** environment fields that the orientation, or a fork that
  inherits them, can act on.
- **Observed:** the orientation has no tool. The reviewer role says "You have
  no access to the working directory" and that `.ramify-architect/` is
  refused. The design step itself builds `views: []`, and inv-0012 resets
  `environment:views` to `[]`, which shows that the orientation's views value
  was never meant for reviewers. Of 3,558 environment bytes, only
  `environment:availableTools` (145) supports this task. Sizes are UTF-8 bytes
  from the delivered-inputs manifest.
- **Impact and confidence:** it had no observed effect. The model ignored the
  blocks. The cost is small and is cacheable prefix in the fork. The one
  substantive problem is the `views` mismatch: a pointer to a view the role
  forbids. Confidence is high.
- **Correction direction:** build the orientation's environment the way the
  design step does: `views: []`, and no harness source paths presented as if
  readable. Alternatively, make it exactly what the design fork will need, so
  the fork does not re-send unchanged blocks; inv-0012 re-sent an identical
  1,073-byte `limits`.

### F3. Low (informational): a fork base this small caches little, and the orientation does not pay for itself with one design review

- **IDs:** inv-0011, inv-0012.
- **Where:**
  - The inv-0011 usage was input 4,992, cache read 0 and output 283, an
    estimated $0.012814 at recorded rates, over 9,931 ms.
  - The first inv-0012 request had input 7,757 and cache read 4,864.
  - Native requests: `instructions` (2,795 bytes), the tools array and
    `input[0]` are byte-identical across the two requests, under the same
    `prompt_cache_key` `ae5ffcc0-…`. The fork appends snapshot tools as a
    later `additional_tools` developer item.
- **Expected:** a fork base gets the most reuse when it holds the material
  that is constant across the forks it serves.
- **Observed:**
  - The prefix was preserved exactly. 4,864 is 38 × 128, and every usage value
    in inv-0012 is a multiple of 128, consistent with 128-token cache blocks
    (an inference about the provider). The fork therefore reused all of the
    orientation's prompt that could be cached.
  - The 7,757 new tokens are the fork's own additions: the orientation's
    submission replay (1,686 bytes JSON), the snapshot tool declarations
    (about 4 KB), and the 24,297-byte design message. That message includes a
    10,826-byte diff, `procedure:reviewer:design` (2,214 bytes), the
    `submit_review` declaration (2,230 bytes) and an unchanged `limits` block.
  - Of these, the procedure, the declarations and `limits` are the same for
    every design review and could be part of the shared base.
  - The first fork request saved about 4,864 × ($2.00 − $0.10)/M ≈ $0.0092
    against a fresh start. The orientation cost $0.0128 and added 9.9 s to
    the design review's critical path: rq-0003 was queued at 10:51:53.796,
    the orientation ran 10:52:17.557–10:52:27.497, and the fork started at
    10:52:27.583.
  - Reuse across iterations did not occur, because the run had one design
    review (rq-0001 is code, rq-0002 is scope).
- **Impact and confidence:** this has no effect on correctness. The economics
  depend on how many design reviews share one orientation key. Confidence is
  high in the measurements and medium in the cache-block inference.
- **Correction direction:** if orientations are kept, move the constant parts
  of the design review into the base: the design procedure, the snapshot and
  `submit_review` declarations, and stable environment. That way each fork
  adds only its candidate-specific briefing. Consider skipping the
  orientation, or running it off the critical path, when only one design
  review per guidance key is expected. Fix F1 first, since the semantic reuse
  is what justifies the base.

### F4. Low: the inherited role prompt describes tools and paths the orientation does not have

- **IDs:** inv-0011.
- **Where:** in the role instructions (`instructions`, 2,795 bytes), the
  `## Your tools` section lists `snapshot_diff`, `snapshot_read`,
  `snapshot_list` and `snapshot_search`, and says "Every path is relative to
  the candidate's root". `environment:candidate` is null, and
  `environment:availableTools` is `["submit_orientation"]`.
- **Expected:** no conflicting tool guidance.
- **Observed:** the procedure resolves the conflict explicitly ("you have no
  tool but the designated submission tool"), the role's first paragraph
  anticipates this task ("may prepare design guidance"), and the model called
  only `submit_orientation`.
- **Impact and confidence:** no effect was observed. The shared text is what
  lets the fork's `instructions` and prefix stay identical, so the redundancy
  is useful as a cacheable prefix. Confidence is high.
- **Correction direction:** none required. If it is touched, keep the role
  text identical across both kinds and leave the narrowing to the procedure.

### No issue found

- **Guidance selection:** the set is right for this change, as described in
  [Required information](#required-information). Possible refinement: the
  root README says each `module.ramify` carries the reasons for its exposures
  ("Read them together with each owner's README"), and the fork read
  `subs/workspace/subs/shared-ui/module.ramify` (597 bytes) itself. Including
  the changed module's description in the guidance would be a policy choice,
  not a defect seen here.
- **Root README size:** about 6.7 KB of the root README is operational
  material with little bearing on a badge prop: `Running it` 2,930 bytes,
  `The scenario harness` 2,266, `Independence` 1,080 and `Trial records` 400,
  measured as UTF-8 bytes per heading. The guidance is whole project-owned
  files, intentionally change-agnostic and hash-bound, so trimming it is not a
  prompt correction.
- **Submission content:** the summary (about 1.5 KB) accurately restates the
  three files: the self-contained package, tRPC-only browser, explicit
  directional exposures without barrels, access profiles, Node-based tests,
  the shared-ui primitive and the core owners' exclusion. It invents nothing.
  The record keeps it, but no later prompt cites it; the fork sees it only as
  the replayed tool call.
- **Usable instructions:** there are no unresolved placeholders, wrong paths
  that matter, mismatched schemas or unavailable submission tools. The empty
  `parameters` object, with the schema only in the description, caused no
  rejection.

## Observed effects

| Sequence | Event | Relation to the prompt |
| --- | --- | --- |
| ses-0009 n=2–3, 10:52:17.688 → 10:52:27.423 | One request; the model calls `submit_orientation` with three paths and a summary | The prompt was sufficient; no exploration was possible or needed. |
| ses-0009 n=4–5; event 95 | Verdict `accepted`, 0 rejected submissions, `kept: true` | — |
| event 96 | `review-orientation-recorded`, outcome `oriented` | — |
| event 97; inv-0012 first request | Fork ses-0010 opens; cache read 4,864 of the base's 4,992 input tokens | Causal: the byte-identical prefix enabled the reuse. The size is bounded by the orientation's size (F3). |
| ses-0010 n=3–8 | `snapshot_read` of all three guidance files, one per request | Causally tied to the fork's withdrawal and its `snapshot_read` instructions (F1). Whether the model would skip the reads otherwise is untested. |
| inv-0012 submission | No concerns, so no ground cited | The re-read was not needed for grounding in this instance. |

There was no clarification, tool error, repair or failure attributable to the
orientation prompt. Its success alone does not show the orientation was useful
to the fork. F1 shows that it was not, beyond caching.

## Suggested corrections

1. Make the orientation count as reading, in the design review's sense. Keep
   the guidance block in effect in the fork; tell the fork the guidance is in
   context with these hashes; and accept hash-matched orientation guidance as
   a ground, or else orient through `snapshot_read`. (F1)
2. Build the orientation's environment like the design step's: `views: []`
   and no harness source paths. Otherwise make it identical to what the fork
   needs, so the fork sends only changed blocks. (F2)
3. If orientations remain, move the material that is constant across design
   reviews (design procedure, snapshot and `submit_review` declarations,
   stable limits) into the base. Skip the orientation, or run it off the
   critical path, when one design review per key is expected. (F3)

## Evidence gaps

- Token counts per block are not recorded. Section sizes are UTF-8 bytes from
  the delivered-inputs manifest or measured from `task.md`, and token figures
  are provider totals per request. Byte-to-token ratios are not assumed.
- The 128-token cache granularity is inferred from the recorded values, not
  documented in the run.
- ses-0009 records no reasoning text, so how the model handled the conflicting
  role tool list cannot be inspected. The 283 output tokens may include hidden
  reasoning.
- The counterfactual in F1 is unobserved: whether the fork would have skipped
  the re-read if the guidance block had stayed in effect.
- The orientation's start, 24 s after rq-0003 was queued, coincides with
  inv-0008 ending (10:52:17.51). The slot wait is inferred from timestamps,
  because no scheduling record states it.
- The architect view named in `environment:views` was not examined; nothing
  could read it in this task.
