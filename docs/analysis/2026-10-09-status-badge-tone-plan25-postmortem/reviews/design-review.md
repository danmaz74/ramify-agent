# Prompt review: reviewer `design`

Run `20261009T193340Z-51f42e`, plan `status-badge-tone`, collection-review fixture,
model `openai-codex/gpt-5.6-sol:high`, pi 0.87.1, harness revision 474ffa58.

## Summary

The design review (inv-0012, ses-0010, forked from the orientation inv-0010 at
its turn-1 point) had what it needed: the iteration intent, the canonical
changed-path list, complete patches for all four changed paths, the guidance
list with hashes, working snapshot tools and a clear submission contract. It
read the three guidance files and all four changed files in one parallel turn,
then submitted no concerns with every path inspected, accepted first time, in two
model calls and 9.4 s. "No concerns" is a sound outcome under the procedure: the
listed guidance is module prose about ownership, tags and placement, and the
change keeps the tone inside the shared-ui primitive as a prop, which is what
that prose asks. The prompt's main weakness is a conflict about reusing the
inherited guidance. Step 1 says to reuse it, while the guidance block and the
grounding rule require a fresh `snapshot_read`. The reviewer re-read all 13.8 KB of
guidance it already held, which made the orientation redundant. A further
roughly 5.5 KB of appended material repeated information already present.
Inherited and appended material were otherwise consistent: the fork withdrew the
orientation's guidance block, replaced the procedure and tools, and reset the
views.

## Coverage

| ID | Value |
| --- | --- |
| Invocation | inv-0012 (kind `reviewer:design`, task `design`) |
| Harness session | ses-0010; pi session `8ae8d6c4-26bd-4cca-bcbe-40a3881cef1a`, turn 2 |
| Fork source | ses-0009 / inv-0010, point `6c97a9a3…` turn 1, checkpoint `8dcf71ca…`, reason `design-orientation` |
| Review request and attempt | rq-0003, attempt rq-0003.a01, gate ga-0002, candidate b999ea9 (tree 4e706c2), base c76c24e |
| Native requests | 2: `O/store/payloads/8cb3ec2c…769f` (first), `029c8e00…94d6` (last) |
| Submission | `J/invocations/inv-0012/submission.json` and `J/reviews/rq-0003/attempts/01/submission.json`: 4 inspected, 0 missing, 0 concerns |

All instances of this kind in the run are covered; there is only one.

Evidence read: `D/invocations/inv-0012/{task.md,packet.json,native-first.json}`,
both native payloads, `J/invocations/inv-0012/{invocation.json,observations.jsonl,submission.json}`,
`J/reviews/rq-0003/{request.json,attempts/01/attempt.json}`,
`J/transcripts/ses-0010.jsonl`, `J/events.jsonl`, `J/input/plan.md`, and the
candidate in the project copy (`git show b999ea9:…`) to judge the outcome. Harness
source at 474ffa58 (`design-review.procedure.md`, `reviewer.system.md`,
`subs/reviews/src/{inputs,message}.ts`, `src/run/service.ts`) was used only to
explain.

## Delivered context

Inherited (manifest `delivery: inherited`, identical prefix confirmed by
`summary.json` `boundaries[inv-0012].prefix`: instructions, tools, input and
`prompt_cache_key` equal): role instructions 2,795 bytes; tool
`submit_orientation`; the orientation's 17,761-byte user message, including the
12,350-byte guidance block; the orientation's reasoning item,
`submit_orientation` call (1,185 bytes of arguments) and its 41-byte acceptance.

Appended: an `additional_tools` item declaring `snapshot_list`, `snapshot_read`,
`snapshot_search`, `snapshot_diff` and `submit_review` (2,238 bytes for
`submit_review`); a developer item "Active tools: snapshot_list, snapshot_read,
snapshot_search, snapshot_diff, submit_review. Inactive historical tools must not
be called."; and a 20,042-byte user message. Its main appended blocks were the
raw request in `brief:requirements` (936), `brief:support:context:0` (548), "The
iteration" (1,358), the guidance list (458), the changed paths with two
pending-tag binding notes (1,622), `candidate-diff` (7,339), `starting-points`
(2,622), `brief:support:design-guidance` withdrawn (79),
`procedure:reviewer:design` (2,087), environment updates including `limits` again
(1,073) and `views: []`, and the task selection (425).

Provider usage: call 1 had 6,588 new input tokens, 4,864 cached and 256 output;
call 2 had 5,983 new, 11,264 cached and 258 output. The estimated charge was $0.0670.
Token figures for sections use about 4.24 bytes per token, derived from inv-0010's
single call; they are estimates.

## Required information

| Need | Status | Evidence |
| --- | --- | --- |
| Objective | Met directly | `brief:goal` "Review b999ea9…"; `brief:support:context:0`; task selection |
| Standard to judge against | Met directly as a list with hashes; content inherited and obtainable through `snapshot_read` | guidance block lists three paths with 12-hex hashes; the inherited orientation message holds full text; the reviewer re-read all three |
| Iteration intent and plan constraints | Met directly (architect's restatement) | "The iteration" goal, approach, completion evidence. The plan's constraints themselves (`input/plan.md`: the badge "stays a presentation primitive of the shared UI… the tone arrives as a prop") are not delivered, but the shared-ui README says the same, and the procedure confines the standard to listed guidance |
| Current state, candidate identity | Met directly | candidate, tree, base, gate ga-0002 passed |
| Changed paths and patches | Met directly | canonical list of 4 paths and complete patches (6,957 patch bytes) |
| Surrounding source | Obtainable via pointer and tool | "Read the surrounding source where a patch alone does not show the design"; `snapshot_read` available and used |
| Authority and write scope | Met (inherited role) | "You change nothing and decide nothing" |
| Execution location | Met | paths relative to the candidate root; `workingDirectory` is an empty attempt workspace that no tool uses |
| Verification and coverage expectations | Met directly | "Name every changed path once: in `inspected`… or in `missing`" |
| Expected submission | Met directly | `submit_review` schema in the tool declaration; "No concern and nothing missing says the candidate's design follows the listed guidance; that is a valid review" |

Nothing required was missing, stale or inaccessible. One instruction conflict is
described in R1.

## Findings

### R1. Conflicting instructions on reusing inherited guidance cause a full re-read

Severity: low to medium (cost and duplication; it also removes the orientation's
value, see `design-orientation.md` O1). Affected IDs: inv-0012, rq-0003, inv-0010.

Location and excerpts. `procedure:reviewer:design` step 1: "Reuse earlier
understanding of captured guidance with the same known identity. Refresh guidance
whose identity changed or cannot be established." The same procedure: "Its ground
is that guidance file, read with `snapshot_read` in this review even if an earlier
conversation already showed it to you." The guidance block: "If this session has
not read one of them yet, read it with `snapshot_read` before you judge." The
inherited role: "Inherited understanding never substitutes for current snapshot
evidence."

Expected goal. With identical hashes (the request's full hashes match the
orientation record's), step 1 implies that no refresh is needed for judging, and
a fresh read is needed only to cite a file as ground for a concern.

Observed mismatch. "Before you judge" and "this session has not read" (the
orientation session saw the text in a message, not through `snapshot_read`) push
the other way. The reviewer's first turn read all three guidance files in
parallel with the changed files (observations n 4 to 9; payload `029c8e00…`
items 8 to 10 and 15 to 17), 13,824 bytes, before it had any concern. The
guidance was then in context twice: the inherited 12,350-byte block, which was
withdrawn as a brief but remains in history, and the line-numbered re-read.

Impact and confidence. Roughly 3.3k uncached input tokens in call 2 (estimate,
about $0.013), plus the orientation call that this behavior made pointless. The
re-read follows the literal "read it… before you judge" instruction, so the
evidence is causal and high confidence. Correctness was unaffected.

Correction direction. Use one rule. Either accept hash-matched guidance delivered
by the harness (inherited from an orientation) as citable ground, verifying any
quote against the captured text; or keep the fresh-read rule and change the
guidance block to "read a guidance file with `snapshot_read` only when you will
cite it as a concern's ground", which drops "before you judge". Align the role's
"Inherited understanding never substitutes…" sentence with whichever rule is
chosen.

### R2. Appended material that repeats what the message already says

Severity: low. Affected IDs: inv-0012.

Location and excerpts. The `D/invocations/inv-0012/task.md` blocks:

- `brief:requirements` (936 bytes) is the raw review-request JSON. Its candidate,
  base, gate, tree and guidance hashes are restated in `brief:support:context:0`
  and the guidance list, and its `assignment` path is then declared unusable
  ("that record is not a candidate file readable with snapshot tools").
- `brief:support:starting-points` (2,622 bytes) lists six entries for three
  paths, all among the four changed paths whose complete patches are already
  supplied. Three are the engineer's self-descriptions of its own work ("Real-provider
  Cucumber bindings with per-scenario World state", "Static-markup coverage for
  tones and wording preservation").
- The two "Harness pending-tag binding" notes (820 bytes) give provenance for
  the feature-file tag removal, which matters to scope and code review more than
  to design.
- `environment:limits` is re-sent in full (1,073 bytes). Its only change is
  `invocationAbsoluteMs` 600000 to 599965, and none of the 29 limits governs a
  read-only reviewer.

Expected goal. Every appended block is new, applicable information for judging
the design.

Observed mismatch. About 5.4 KB (roughly 1.3k tokens, estimated) is duplicated
or not applicable. The engineer's self-descriptions are labeled "producer
judgments, not verified current facts", which is correct, but they are still
the producer's framing in a review that is meant to be independent.

Impact and confidence. No observed effect: the reviewer read the actual files and
did not echo the notes. The cost is small. High confidence on the content; low
impact.

Correction direction. For design reviews, drop `starting-points` when every
listed path is a changed path with a supplied patch, or at least drop the
`engineer accepted result` notes. Render `brief:requirements` as a one-line
reference instead of the full request JSON. Send `environment:limits` to
reviewers only if a limit applies to them, and never as a full block for a
remaining-time value.

### R3. No issue: "no concerns" was reached with adequate inspection

Affected IDs: inv-0012, rq-0003.

The reviewer inspected all four changed paths by full `snapshot_read`, beyond
the supplied patches, which the procedure allows for surrounding source. It also
read all three guidance files. Its reasoning summary before submitting was
"Confirming tone enum placement and styling scope / Verifying test world interface
and patch submission", which corresponds to the two design questions the guidance
can ground. On placement, the shared-ui README makes the badge's owner responsible for
"the presentation primitives that more than one feature view needs". On the
stylesheet, the workspace README makes Workspace own "the application
stylesheet". I checked the candidate independently.
`subs/workspace/subs/shared-ui/module.ramify` still exposes `StatusBadge,
StatusBadgeProps … tagged [ui, browser] to parent`, and the tone is an inline
literal union, so it adds no signature companion. Neither caller changed
(`catalog-card.tsx`, `review-result.tsx`). The steps file is in the module's
`src/tests/steps/`, as the root README directs. Three items could have been
weighed and were not raised. None is grounded in the listed guidance, so their
absence is not a prompt defect:

- `status-badge.tsx` lines 7 to 8 still say "It is deliberately tiny: a status
  and an optional label" after `tone` was added. This stale comment is code-review
  territory.
- The tone list is repeated in the step guard `isStatusBadgeTone`
  (`status-badge-tone.steps.tsx`) instead of being derived from
  `StatusBadgeProps['tone']`. This is a minor test-side duplication with no
  guidance rule against it.
- `subs/workspace/src/styles.css` has no `data-tone` rule. The plan only requires
  the attribute to be readable, so this is a scope question, not a design one.

The fixture holds no `*.principles.md`, so the design standard is topology-only
module prose. This limits what any design review of this project can name, and
it is a property of the project rather than of the prompt.

### R4. No issue: fork mechanics and tool transition

Affected IDs: inv-0012, inv-0010. The top-level tools stayed
`[submit_orientation]` to preserve the cached prefix (`toolsEqual: true`). The
new tools arrived through `additional_tools`, with the developer note "Inactive
historical tools must not be called." The model called only `snapshot_read` and
`submit_review`. The orientation's `brief:support:design-guidance` was explicitly
withdrawn, `views` was reset to `[]`, and the orientation procedure was superseded
by "This selection supersedes every prior task selection." No inherited
instruction conflicted with current guidance apart from R1. Cache reuse worked:
4,864 of 11,452 input tokens on call 1 (share 0.42) came from cache.

### R5. Minor: the role's list of acceptable grounds is broader than the design procedure's

Severity: low, no observed effect. Affected IDs: inv-0012.

The inherited role lists grounds "such as a principles document, the plan, a
feature file, a README or a test", while the design procedure says "Only the
listed guidance is the standard" and "Its ground is that guidance file". The plan
is readable in the candidate (`plans/status-badge-tone/plan.md`), so a design
reviewer could ground a concern in it against the procedure. The current task's
procedure takes precedence and no concern was raised, so this had no effect.
Correction direction: make the role text say that the procedure of each review
kind defines which files may ground a concern.

## Observed effects

Sequence (`J/invocations/inv-0012/observations.jsonl`, `J/events.jsonl` 96 to 102):

1. 19:38:39.678: the fork opens.
2. Call 1 (4,338 ms) issues seven parallel `snapshot_read` calls: three guidance
   files and four changed files, 20,366 returned bytes per exploration metrics,
   with no repeated reads, searches or errors.
3. Call 2 (4,434 ms) submits `submit_review` with all four paths in `inspected`
   and no concerns. It is accepted at 19:38:49.037, with zero rejections.

There were no clarifications, tool errors, wrong submissions or repairs. The only
effect attributable to the prompt is the duplicate guidance read (R1), which is
causal. Success does not by itself prove adequacy. The adequacy judgment rests on
the delivered content in the Required information table, assessed at delivery
time, and on the independent candidate check in R3.

## Correction suggestions

1. Resolve the reuse and grounding conflict (R1). Prefer letting hash-matched
   orientation guidance serve as ground, or limit fresh reads to files about to
   be cited.
2. Trim design-review appendages that repeat the message (R2): starting points
   that only list changed paths, the raw request JSON, and re-sent limits.
3. State in the role that each review kind's procedure defines admissible
   grounds (R5).

## Evidence gaps

Reasoning is encrypted; only the short reasoning summaries are retained, so the
basis for "no concerns" beyond those summaries is inferred from the reads and the
candidate. Section token counts are byte-ratio estimates, not tokenizer
measurements. With one iteration and one design review, the run cannot show how
inherited guidance behaves across several forks of one orientation. The display
transcript stores `snapshot_read` paths as absolute scratchpad paths
(`/tmp/claude-1000/…/collection-review/README.md`), while the native request
shows the relative argument `{"path":"README.md"}`. I treated the native payload
as authoritative.
