# Prompt review: reviewer design (inv-0012, ses-0010, rq-0003.a01)

Run `20261011T104510Z-0e1b47`, plan `status-badge-tone`, collection-review
fixture, `openai-codex/gpt-6.1-sol:high`, pi 0.87.1, harness 5169117. Reviewed
candidate e6356f5 (diff base 9792902, the harness's scenarios commit over the
fixture baseline 0244ce2).

## Summary

The design review got what it needed and its verdict is supported. The task
message delivered the complete 5-path patch, the iteration's intent, the
guidance list with hashes and a usable submission contract. The inherited
orientation (inv-0011) had already delivered the full text of all three
guidance files at the same hashes. The reviewer submitted `concerns: []`,
`missing: []` with all five changed paths inspected, and the harness accepted it
on the first call. Checking each guidance clause against the patch myself
(see [Observed effects](#observed-effects)) found no design problem the guidance
lets a reviewer name.

The main defect is contradictory guidance-reuse instructions on the orientation
fork. Procedure step 1 says to reuse guidance with the same known identity.
The guidance section says to read each file with `snapshot_read` "if this
session has not read one of them yet". On a fork from an orientation that had no
`snapshot_read` tool, that condition is always true. The block that carried the
inherited guidance was also re-sent as "Withdrawn; this block no longer
applies." The reviewer re-read all three guidance files first. Those reads were
13,369 of 19,469 returned bytes (68.7%), took two extra model requests on the
work item's critical path and cost about 29% of the invocation's estimated
charge. Exploration was otherwise proportionate. Smaller amounts of
review-kind-irrelevant material were delivered, about 3.8 KB of the 24.3 KB
message, with no observed effect.

## Coverage

- Kind: reviewer `design`, procedure `procedure:reviewer:design` (SHA-256
  `edb7d4ec…bec1`, source version 3), role package `reviewer/4`, prompt hash
  `9e94dcef…ec18e`. One variant, one instance.
- IDs: invocation inv-0012; harness session ses-0010 (pi session
  `0a653a82-d48a-4436-98ee-daea589595d8`, turn 2); forked from ses-0009 /
  inv-0011 at checkpoint `44468bab-ea52-4c48-b2b0-affba0167746`
  (orientation key `07ec2fa2…`, reason `design-orientation`); review request
  rq-0003; attempt rq-0003.a01 (`result: complete`, `settles: true`, no check
  findings); submission hash `ca5291ba…c0c7`.
- Artifacts read (evidence root
  `/home/app/ramify-trial-evidence/status-badge-tone-gpt61-20261011T104510Z/collection-review/`):
  - run records under `plans/status-badge-tone/.harness/jobs/20261011T104510Z-0e1b47/`:
    `invocations/inv-0012/{invocation,submission,outcome}.json`, `observations.jsonl`;
    `transcripts/ses-0010.jsonl` (all 21 entries); `reviews/rq-0003/request.json`,
    `reviews/rq-0003/attempts/01/{attempt,submission}.json`;
    `reviews/orientations/07ec2fa2208c2e0c.json`; `events.jsonl` sequences 62–131;
    `input/plan.md`.
  - native requests: first
    `plans/.harness/session-operations/store/payloads/b52bc3b2…80f3` (via
    [native-first.json](../invocations/inv-0012/native-first.json)) and last
    `…/3bb20ad0…15ac5`. The six intermediate requests were not opened
    individually; their usage is in the transcript and observations.
  - derived extracts: [packet.json](../invocations/inv-0012/packet.json),
    [task.md](../invocations/inv-0012/task.md), [inventory.json](../inventory.json),
    [summary.json](../summary.json) (fork boundary), `metrics.json` at the evidence root.
  - candidate (git copy): `cucumber.js` and the feature file at e6356f5; branch log.
  - harness source at 5169117 (clean main, the run revision):
    [design-review.procedure.md](../../../../subs/harness/src/prompts/design-review.procedure.md),
    [reviews/src/message.ts](../../../../subs/harness/subs/reviews/src/message.ts),
    [steps/reviewer.ts](../../../../subs/harness/src/steps/reviewer.ts),
    [prompts/blocks.ts](../../../../subs/harness/src/prompts/blocks.ts). Source
    only explains where captured text came from. Delivery is established by the
    captured native requests.
- Inherited history is included only through the fork point: inv-0011's
  orientation message, its `submit_orientation` call and the accepted result.
  The native first request holds exactly these as input items 0–2.

## Required information

| Need | How it was met | Assessment |
| --- | --- | --- |
| Objective | Direct: goal "Review e6356f5…", context block "Design review rq-0003 of iteration wi-001.i01", current task `design` | Met |
| Standard (design guidance) | Inherited: full text of README.md, subs/workspace/README.md, subs/workspace/subs/shared-ui/README.md in the orientation message, headed with the same 12-hex hashes the review lists. Also reachable with `snapshot_read` | Met twice; see F1 on the conflicting reuse instruction |
| Relevant plan constraints | Direct: "The iteration" block (assignment goal, approach, completion evidence), e.g. "Keep the primitive prop-driven and browser-safe" and "coexist with the runner's registered World" | Met. The plan itself is not the design standard and was correctly not supplied |
| Authority and write scope | System prompt: "You change nothing and decide nothing"; `writer: false`; snapshot tools only | Met, consistent |
| Current state | Direct: candidate commit and tree, base, gate ga-0002 passed, 5 changed paths with complete patches (10,443 patch bytes) | Met |
| Dependencies / surrounding source | Pointers: starting points (status-badge.tsx, tests, feature, cucumber.js) plus `snapshot_read`/`snapshot_search` | Met through clear pointers and available tools |
| Execution location | Snapshot tools resolve candidate-relative paths. The `workingDirectory` block names a harness attempt directory the reviewer cannot use | Usable. The location block is irrelevant (F3) |
| Verification expectations | Procedure "What a concern is" and "Coverage": ground must be read with `snapshot_read` in this review, every changed path named once | Met |
| Expected submission | `submit_review` declared in an `additional_tools` input item with the schema in its description; developer message "Active tools: … submit_review" | Met; accepted first try |

Nothing required was missing or inaccessible. The context block explained that
the `assignment` path in the request JSON is a harness record, not a candidate
file. The reviewer did not try to read it.

## Findings

### F1. Guidance-reuse instructions conflict on the orientation fork (medium)

- IDs: inv-0012, rq-0003; parent inv-0011.
- Location: [task.md](../invocations/inv-0012/task.md) line 35, section "The
  guidance this design is judged against": "If this session has not read one of
  them yet, read it with `snapshot_read` before you judge." Line 332, procedure
  step 1: "Reuse earlier understanding of captured guidance with the same known
  identity. Refresh guidance whose identity changed or cannot be established."
  The text originates unconditionally in
  [message.ts](../../../../subs/harness/subs/reviews/src/message.ts) (the `kind === 'design'` branch).
- Expected: on a fork from an orientation whose guidance hashes equal the
  request's (here b72856422e9d, f5cdda73289e and 8cec99d7e15b in both), the
  reviewer judges from inherited understanding. It calls `snapshot_read` only on
  a guidance file it cites as a concern's ground, as the procedure's concern
  section and the system prompt already require.
- Observed: the first three model requests each read one guidance file (README.md
  12,019 B, subs/workspace/README.md 757 B, shared-ui README.md 593 B). The first
  thinking summary (transcript n=3) shows the reviewer noticing and settling the
  tension: "The guidance suggests that identities can be reusable, but … I
  should check the current session." No concern was reported, so these reads
  grounded nothing.
- Why the conflict always fires: the orientation's tools were only
  `submit_orientation` ("you have no tool but the designated submission tool").
  "Has not read … with `snapshot_read`" is therefore true for every orientation
  fork, and the instruction effectively mandates re-reading all guidance. That
  cancels what the orientation fork was meant to save.
- Impact: efficiency only, with no correctness effect. Confidence is high that
  the instructions conflict and medium that this conflict caused the re-reads.
  The thinking summary is a provider-generated summary, and a model might
  re-read under step 1 alone out of caution.
- Correction direction: make the guidance-section line depend on start mode and
  orientation identity. For a fork from a matching orientation, state that the
  session's orientation showed each file at the listed hash and that
  `snapshot_read` is needed only to ground a concern. Keep the current wording
  for fresh starts and for orientation-identity mismatches.

### F2. The inherited guidance block is re-sent as withdrawn (low)

- IDs: inv-0012.
- Location: [task.md](../invocations/inv-0012/task.md) line 324: "# Block
  brief:support:design-guidance / Withdrawn; this block no longer applies." The
  manifest records `brief:support:design-guidance` with effect `remove`. The
  review step's `literalSections` in [steps/reviewer.ts](../../../../subs/harness/src/steps/reviewer.ts) omits the key, and
  the block delta in [blocks.ts](../../../../subs/harness/src/prompts/blocks.ts) renders the generic withdrawal.
- Expected: the inherited guidance stays usable as the understanding step 1
  reuses. Its orientation-only framing ("You review nothing yet. Submit the
  paths you read") is what should be superseded.
- Observed: read literally, the current message says the only inherited copy of
  the guidance "no longer applies", which reinforces F1's re-read instruction.
  Causal contribution cannot be separated from F1.
- Impact: low. Confidence is medium that a model reads it as invalidating the
  content.
- Correction direction: keep the key (or a reduced successor block saying the
  guidance text above remains the captured standard at the listed hashes),
  rather than emitting a generic withdrawal on the orientation-to-review delta.

### F3. Review-kind-irrelevant material in the current message (low)

Measured as UTF-8 bytes of [task.md](../invocations/inv-0012/task.md) sections
(24,297 B total, equal to the manifest's `currentMessage.bytes`):

- Three "Harness pending-tag binding" paragraphs, 1,233 B, carrying producer
  inv-0007 and submission attribution. They give provenance for scope and code
  review. A design judgment does not use them.
- `brief:requirements`, 938 B: the raw `review-request/1` JSON. It repeats the
  candidate, base, tree, gate and guidance hashes given in other blocks, and its
  `assignment` path needs the 550 B context disclaimer.
- `environment:limits`, 1,075 B: run, iteration and command budgets a reviewer
  cannot act on. It was re-sent only because `invocationAbsoluteMs` changed from
  600000 to 599962 against the inherited block.
- `environment:supportPaths`, 227 B: harness source paths
  (`subs/harness/src/prompts/…`) that do not exist in the candidate and cannot be
  read with the snapshot tools.
- `environment:workingDirectory`, 343 B: an absolute host path. The system
  prompt says "You have no access to the working directory."

That is about 3.8 KB (about 16%) of the message. Each request carried it as
cached prefix after the first. No clarification, failed read or misuse
coincided with it. Correction direction: select these blocks by review kind and
role equipment. Omit or summarize limits and support paths for snapshot-only
reviewers, and drop pending-tag attribution from design reviews.

### F4. Inherited orientation material of low relevance (informational, no change proposed)

- Inherited input items 0–2 (orientation message 17,821 characters, of which
  12,024 are guidance text; orientation submission; result). Within the root
  README, "Running it" (about 2.9 KB), "Trial records" (about 0.4 KB) and
  "Independence" (about 1.1 KB) do not bear on a presentation-primitive change.
  Offsets were measured in the decoded text, which is nearly all ASCII.
- The inherited `environment:projectRoot` (an absolute host path) was not
  withdrawn. The inherited `environment:views` (the architect-view path) was
  correctly replaced with `[]`. The inherited orientation procedure ("you have
  no tool but…") was superseded by the current task and the developer
  active-tools message, and no inherited tool was called.
- This is mostly cached prefix: the first request read 4,864 tokens from cache,
  matching inv-0011's 4,992-token request. Guidance files are captured whole
  for hash identity, so section-level trimming would weaken that identity. No
  issue requiring correction was found here.

### F5. One read per model request (low)

- IDs: inv-0012.
- Observed: 7 reads in 7 consecutive requests, each issuing one call, although
  `parallel_tool_calls: true`. Every target was known from the first message:
  the three guidance files and the starting points.
- Impact: about 2.4–3.8 s of model latency per request. Without F1, the four
  remaining reads could have been one or two requests. This is model behavior;
  no instruction asks for or against batching. Confidence that a prompt change
  would help is low.
- Correction direction (optional): a line in the reviewer system prompt saying
  independent snapshot reads may be issued together.

No issue was found with tool availability, paths, the submission schema, or the
coverage contract. There were no placeholders, no rejected submissions and no
tool errors. The top-level native `tools` array still declared only
`submit_orientation` (kept for prefix identity). The current tools arrived in an
`additional_tools` input item with an explicit active-tools developer message,
and the model used only active tools.

## Observed effects

Timeline: the iteration closed on ga-0002 at 10:51:53 (seq 69). rq-0001/2/3
were recorded together. The orientation inv-0011 started at 10:52:17, when
rq-0001 finished, and took 9.9 s. inv-0012 ran from 10:52:27.58 to 10:52:58.10.
inv-0010 (architect) ended at 10:52:30, so rq-0003 was the last thing before the
work-item gate ga-0003 at 10:53:00. Its duration was on the critical path.

- Requests and reads (transcript n=3…17): read README.md → subs/workspace/README.md
  → shared-ui README.md → status-badge.tsx → shared-ui module.ramify →
  cucumber.js → the feature file → `submit_review` (accepted, n=18).
- F1 effect (correlated, with stated rationale in the thinking summary): requests
  n=5 and n=7 exist only because of the guidance re-reads. They took 2,686 +
  2,836 ms of model time and cost $0.00844 + $0.00259 (transcript `detail.cost`).
  The README results then rode as cached prefix in five later requests, roughly
  $0.002 more by estimate. Together that is about $0.013 of the $0.044
  invocation (about 29%) and about 5.5 s of 30.5 s. These are attributions under
  the assumption that the other reads would have followed in the same order.
- Proportionality of the other reads (6,100 B): status-badge.tsx (1,664 B)
  shows the whole component beside the patch. module.ramify (597 B) confirms
  that the exposure `StatusBadge, StatusBadgeProps … tagged [ui, browser] to
  parent` still covers the inline tone union. The root README says to read
  descriptions with READMEs. The feature file (1,730 B) was needed because the
  patch hunk omits sc-003's `Then` steps and examples. cucumber.js (2,109 B),
  prompted by a starting point, confirms that the steps directory is collected.
  That is closer to a correctness question but cheap. There were no searches,
  no repeated reads and no patch re-fetches.
- Verdict support (my independent comparison of guidance clauses with the
  patch): the badge stays a prop-driven, browser-safe primitive with no record,
  review or protocol knowledge (shared-ui README). There is no new exposure,
  barrel or `index.ts` (root README "No owner is a package, and there is no
  `index.ts`"). Tests stay under Node as static markup ("components are
  rendered to static markup"). Steps sit in `src/tests/steps/` beside
  `src/tests/features/` (root README "Step definitions and feature files sit in
  the conventional directories"), and they key state on the World instance
  without importing `integration-tests` support. The Node-only helper
  `badge-markup.ts` lives in the `[testing, ui]` tests area, not the browser
  source. The empty concern list is supported. The same empty submission hash
  `ca5291ba…` from the code (inv-0008) and scope (inv-0009) reviews agrees
  without proving it.
- Cache at the fork: [summary.json](../summary.json) records instructions, tools,
  prompt cache key and parent input preserved as prefix. The first request read
  4,864 cached tokens and wrote 7,757 new ones (the 24.3 KB review message).
  Later requests had cache shares of 78–97%. No boundary defect was found.

## Suggested corrections

1. In the design-review message, make the guidance-section instruction
   start-aware. On a fork from an orientation whose guidance identity matches
   the request, say the guidance was shown in this session at the listed hashes
   and that `snapshot_read` is required only for a file cited as a concern's
   ground. Keep the existing line for fresh starts or mismatched identity (F1).
2. Do not render the orientation-to-review delta as a generic withdrawal of
   `brief:support:design-guidance`. Retain the key, or replace it with a short
   block stating the inherited text remains the captured standard (F2).
3. For snapshot-only reviewers, omit or condense `environment:limits` and
   `environment:supportPaths`, drop the raw request JSON when its fields are
   restated, and leave pending-tag attribution to the review kinds that use it
   (F3).
4. Optionally note in the reviewer system prompt that independent snapshot
   reads may be issued in one turn (F5).

## Evidence gaps

- Reasoning is encrypted (`reasoning.encrypted_content`). Only short
  provider-generated thinking summaries (440 B and 433 B) are retained, so the
  cause of the re-reads is inferred from one summary sentence and the
  instruction text, not established.
- Only the first and last of the eight native requests were opened. The six
  intermediate requests are assumed to be the last request's prefixes, which is
  consistent with monotonically growing cache reads and the transcript.
- The transcript's `action.path` shows absolute host paths
  (`/tmp/claude-1000/…/badge-run-61/…`) while the model's inputs were
  candidate-relative. This is display resolution; the absolute paths were not
  delivered to the model as tool results.
- `metrics.json` `evaluation.invocations[].request` is null for every invocation,
  including inv-0012. The join to rq-0003 comes from
  `reviews/rq-0003/attempts/01/attempt.json` and event seq 99.
- Byte sizes are UTF-8 bytes of captured text. Token figures are provider usage
  from the transcript. Per-section token costs are not recorded and were not
  estimated. The cost attribution for F1 is a reconstruction under the stated
  ordering assumption.
- No architect view or API view was delivered to this task (`views: []`), so
  view effectiveness does not apply.
