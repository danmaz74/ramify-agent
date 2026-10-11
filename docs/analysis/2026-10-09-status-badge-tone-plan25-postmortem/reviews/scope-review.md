# Prompt review: reviewer `scope` (inv-0009)

Run `20261009T193340Z-51f42e`, plan `status-badge-tone`, collection-review fixture,
`openai-codex/gpt-5.6-sol:high`, pi 0.87.1, harness revision 474ffa58 (merged Plan 25).
Paths below use J for the retained job directory, O for the retained session-operations
directory and D for this postmortem directory, as defined in the parent brief.

## Summary

The scope reviewer (ses-0008, review request rq-0002) was forked from the local
architect's session ses-0004 at the point right after inv-0006 submitted the work-item
outline and the assignment that the engineer then implemented. Its first and only
provider request preserved the parent's last request as an exact prefix (same
instructions, same top-level tools, the parent's 57 input items unchanged) and appended
the parent's own final turn, the reviewer role as a developer message, the reviewer tools
as `additional_tools`, an active-tools notice and the 25,827-byte review briefing. That
briefing gave the reviewer the assignment intent, the ten cited elements whole, the plan's
candidate path, the complete patches for all four changed paths and the pending-tag
provenance; the inherited history added the architect's reading of the module, both
callers and the stylesheet. With that, the reviewer submitted `no concerns` after one model
turn (276 reasoning tokens, zero tool calls, 7.7 s), crediting all four paths as inspected
through the delivered patches, which the procedure explicitly allows. For a 6,957-byte,
four-file candidate whose callers the changed-path list shows to be untouched, I judge the
information adequate and the conclusion defensible, though the evidence cannot show how
carefully the single turn weighed the plan. The many small appended `brief:support:*`
entries (12 entries, 78–105 bytes, 1,066 bytes together) are withdrawal notices for the
local architect's inherited briefing blocks; the set is exactly the architect blocks that
were still in force, so it is complete and not redundant. The redundancy that does exist
is elsewhere: the appended plan context package is byte-identical in content to the
inherited work-item package that the same message withdraws (about 3 KB), the "elements
above" lead-in refers to elements that come later, and the irrelevant environment and
configuration material of the code variant recurs. The inherited architect context is
large (about 26k cached tokens) and only partly relevant, but it was served from cache at
99% of the parent's prompt, so its cost was about $0.010. A structural question remains:
the fork makes the author of the assignment its scope reviewer, which limits the review's
independence from that assignment.

## Coverage

| Kind | Variant | Invocation | Session | Review request | Start (requested/actual) | Fork source | Evidence used |
|---|---|---|---|---|---|---|---|
| reviewer:scope | fork of the local architect after its main assignment (Plan 25 reviews module, delivered diff) | inv-0009 | ses-0008 (provider session key 827b658b…, inherited) | rq-0002, attempt rq-0002.a01 | fork / fork | ses-0004 at inv-0006, point turn 2, checkpoint a9cdf8b9-3046-4312-9731-ef2a4f73b52c | packet D/invocations/inv-0009/packet.json (manifest with inherited/appended delivery); delivered message D/invocations/inv-0009/task.md (25,827 bytes, hash 220e7735…); native first and only provider request D/invocations/inv-0009/native-first.json; D/summary.json `boundaries[]` entry for inv-0009; transcript J/transcripts/ses-0008.jsonl; inherited history in native-first input items 0–59 (parent transcript J/transcripts/ses-0004.jsonl not separately needed); J/reviews/rq-0002/{request.json,attempts/01/attempt.json,attempts/01/submission.json}; events 72, 80–82, 84–86 |

There is one instance of this kind in the run, and it was fully reviewed. Inherited
history is considered only through the recorded fork point (the parent's assignment
submission and its accepted result, input items 57–59). The harness source at
/home/app/ramify-status-badge-20261009-latest/ramify-agent (subs/harness/subs/reviews/src/message.ts,
subs/harness/src/prompts/blocks.ts, subs/harness/subs/agent/subs/pi/src/session-operations.ts)
was read only to explain layout and tool activation.

## What the provider received

The request in native-first.json has 64 input items (158,265 bytes of input JSON). The
summary's prefix comparison records `instructionsEqual`, `toolsEqual`,
`providerInputPreservedAsPrefix` and `promptCacheKeyEqual` all true against inv-0006's
last request.

| Items | Content | JSON bytes | Delivery | Relevance to the scope review |
|---|---|---|---|---|
| `instructions` | local-architect system prompt (local-architect/11) | 4,045 | inherited | conflicting role identity, superseded later; see S4 |
| top-level `tools` | `read`, `grep`, `ls`, `submit_work_orientation` | 3,590 | inherited | inactive for the reviewer; see S4 |
| 0 | architect orientation briefing (goal, requirements, module, scenarios, checks, write scope, registry, placement, engineer bounds, pointers, orientation procedure, environment) | 18,537 | inherited | partly relevant (module and scenario context); rest withdrawn or superseded |
| 10–11, 16–17, 28–30, 46–47 | architect reads of README, `module.ramify`, `package.json`, `cucumber.js`, base source, base test, base feature file; caller greps for `StatusBadge` and `status-badge` with context | 18,576 | inherited | relevant: caller shapes and stylesheet for nfr-003, module purpose for nfr-001 |
| 31–36, 38–39, 44–45 | API view metadata, two whole-view greps, vocabulary reads | 24,966 | inherited | not relevant to scope |
| 1, 18, 37, 50, 57 | encrypted reasoning items | 14,072 | inherited (57 is the parent's last output) | opaque |
| 51–53 | orientation submission and the work-item package | about 5,700 | inherited | package relevant (duplicated later; S1) |
| 54–56 | `additional_tools` (`inspect_git`, `submit_work_item_result` schema), active-tools notice, main-procedure briefing | 32,840 | inherited | not relevant (architect authority and procedure) |
| 58–59 | inv-0006 `submit_work_item_result` call (outline and assignment with scope) and its acceptance | 4,088 | inherited (parent output, not in parent prompt) | relevant: the assignment the candidate is judged against |
| 60 | reviewer role instructions as developer message | 2,883 | appended | required |
| 61 | `additional_tools`: five snapshot tools and `submit_review` | 4,041 | appended | required |
| 62 | "Active tools: snapshot_list, snapshot_read, snapshot_search, snapshot_diff, submit_review. Inactive historical tools must not be called." | 172 | appended | required |
| 63 | review briefing (task.md) | 26,937 | appended | mostly required; see the block table |

Appended manifest entries total 30,788 bytes; inherited entries total 57,574 bytes
(D/invocations/inv-0009/packet.json `packet.manifest.entries[].delivery`). Byte sizes of
input items are JSON sizes and include escaping.

Appended briefing blocks:

| Block | Bytes | Note |
|---|---|---|
| briefing-state | 171 | revision 76acb9ac…, "based on: cfdc8bba… (post-fork)" |
| brief:goal, brief:requirements, brief:support:context:0 | 129, 1,006, 547 | candidate and request identity; requirements is raw JSON including the fork point |
| brief:support:## The iteration:0 | 1,570 | goal, approach, completion evidence, write-scope rationale |
| brief:support:## What the plan asks of it:0 | 607 | deviation notice and the plan's candidate path; elements are elsewhere (S2) |
| brief:support:## The changed paths:0, ## Declared project checks:0, ## Candidate test pointers:0 | 800, 900, 1,068 | changed paths required; checks and test pointers of little use to scope (S3) |
| brief:support:assignment-package | 2,989 | identical in content to the inherited work-item package (S1) |
| brief:support:candidate-diff | 7,339 | complete patches; required |
| brief:support:starting-points | 2,622 | all six paths are changed paths |
| 12 withdrawals of brief:support:* | 1,066 | see below |
| procedure:reviewer:scope | 2,296 | required |
| environment:* (7 blocks) | 2,231 | workingDirectory, candidate, snapshot, limits, availableTools, views (`[]`), supportPaths |
| task | 422 | "Current task: scope … This selection supersedes every prior task selection." |

## The small appended `brief:support:*` entries

Each is a withdrawal notice rendered by subs/harness/src/prompts/blocks.ts line 24 as
"# Block <key> / Withdrawn; this block no longer applies." (task.md lines 368–414). The
twelve keys are `## What the plan asks`, `## The scenarios of this work item`,
`## Your module`, `## Default write scope`, `## Hypotheses you received`,
`## The capability registry`, `## Placement decided for this work item`,
`## The bounds of an engineer`, `# Registered obligations`, `work-item-package`,
`module-pointers` and `scenario-files`. I compared them with the inherited manifest
entries: every architect `brief:support:*` block still in force at the fork point is
either withdrawn here or replaced (`## Declared project checks` is re-set), and
`# Orientation task` is not withdrawn again because inv-0006's briefing had already
withdrawn it. None is withdrawn twice and none was never set. The withdrawals matter:
`# Registered obligations` told the architect it could report obligations `done`, and
`## Default write scope` and `## The bounds of an engineer` describe authority a reviewer
does not hold. Their total cost is 1,066 bytes, roughly 250 tokens (estimated at the
4.2 bytes per token measured on inv-0008's first request), uncached. One record-keeping
mismatch: the manifest names the inherited package entry `append:context:4646e400…`, while
the briefing text and its withdrawal use `brief:support:work-item-package`, so the manifest
alone does not show which inherited entry that withdrawal targets.

## Required information

| Need at this point | Status | Where |
|---|---|---|
| Objective (does the candidate do what the assignment asked, no less and no more) | met directly | procedure:reviewer:scope steps 1–3 |
| Assignment intent | met directly and inherited | `## The iteration` (task.md lines 22–30); the assignment call itself, item 58 |
| Write scope | rationale met directly; base module `collection-review/workspace/shared-ui` only inherited (item 58) | task.md line 29 |
| Plan elements and deviations | met directly (elements whole, "Deviations: none") and inherited (identical package, item 53) | assignment-package block |
| Plan document as a readable ground | met directly | "The candidate holds the plan as `plans/status-badge-tone/plan.md`" (line 39) |
| Which conversation is intent | met directly | procedure step 1: "what it said after the assignment is not part of that intent"; the fork point is the assignment itself |
| Authority (read only, cannot change the assignment) | met directly | reviewer role (developer message) and procedure ("You have no authority over the assignment") |
| Current state (candidate, base, gate) | met directly | context block, environment candidate/snapshot |
| The change | met directly | complete patches for all four paths |
| Why the "never edit" feature file changed | met directly | pending-tag binding lines and "no feature or pending-tag patch is hidden" |
| Caller shapes, stylesheet, module purpose | inherited (base state) and still current, because the changed-path list shows those files unchanged | items 10–11, 46–47 |
| Tools and submission | met directly | `additional_tools` item 61, active-tools notice item 62, schema in the `submit_review` description |
| Existing CheckFindings | not applicable | none existed |

Nothing required was missing or inaccessible. One contradiction exists between the
inherited system instructions and the appended reviewer role (S4); it had no observed
effect. Inherited source reads are of the base, not the candidate; the role states
"Inherited understanding never substitutes for current snapshot evidence", and the
delivered patches cover every changed line.

## Usable instructions

The reviewer identified the task and submitted correctly on its first call with an
actually available tool. The active-tools notice resolved which of the eleven declared
tools (four top-level, seven in two `additional_tools` items) were usable. The procedure's
coverage rule allows patches delivered in the message to count as inspection, so the
zero-call submission was valid by contract. No placeholders, wrong paths or schema
mismatches were found.

## Findings

### S1. The appended plan package repeats the inherited package it withdraws (low)

Affected: reviewer:scope, inv-0009.
Location: task.md lines 83–181 (`# Block brief:support:assignment-package`) and line 404
(`# Block brief:support:work-item-package / Withdrawn`); inherited item 53 (`# Block
brief:support:work-item-package`). The review request's source hash
`27ea883fd07e894cae9fead20e16342ddd8443b3a55fe0f85d51b23d663a6afb` is the same package the
inherited main briefing names ("Use the accepted work-item package 27ea883f…").
Expected: a fork that already holds the cited elements whole receives them once.
Observed: the body after "# Plan context package" is identical in both blocks (2,988 and
2,991 bytes; only the block key differs). The message withdraws the inherited key and
sets the same text under a new key.
Impact and confidence: about 3 KB (roughly 700 tokens) of uncached input on the only
request, about $0.003. High confidence in the duplication; no behavioral effect.
Correction direction: when the cited elements equal the inherited package by hash, keep
the inherited block (or reference it by hash) and withdraw only what differs. Keep the
re-send for fresh reviews and for packages narrowed by `citedElements` or deviations.

### S2. Lead-in and deviation notice refer to material that is not where they say (low)

Affected: reviewer:scope, inv-0009 (the code variant has the same split; see
code-review.md C1).
Location: task.md line 36: "The elements the assignment cites, whole. Each plan deviation
amends the elements it names for the rest of this run, under its own authority; the
elements above are unchanged. Where a deviation amends an element, judge the candidate
against the element as the deviation amends it …". The elements are not above; they are
in `brief:support:assignment-package`, 47 lines later, and the package says "Deviations:
none".
Expected: the elements follow their lead-in, and the deviation instruction appears only
when deviations exist.
Observed: message.ts lines 82–88 compose the lead-in with the package, but the block
serializer moves the package into its own literal section, leaving the lead-in alone and
"above" wrong. The deviation sentences are emitted unconditionally.
Impact and confidence: low; the model found the elements. It is the kind of text that
becomes misleading once deviations exist and several literal sections are present.
Correction direction: keep lead-in and package in one block, and emit the deviation
paragraph only when the package lists deviations.

### S3. Irrelevant material repeated from the code variant (low)

Affected: reviewer:scope, inv-0009.
Location: task.md `## Declared project checks` (900 bytes, including the four
configuration pointers), `## Candidate test pointers` (1,068 bytes), `starting-points`
(2,622 bytes, every path already a changed path), `environment:limits` (1,073 bytes),
`environment:supportPaths` (224 bytes, harness repository paths
`subs/harness/src/prompts/reviewer.system.md` and `…/scope-review.procedure.md` that
snapshot tools cannot read), `environment:workingDirectory` (317 bytes, an absolute
path the role says it cannot access) and `brief:requirements` (1,006 bytes of raw request
JSON).
Expected: a scope review needs intent, elements, changed paths and patches; check commands
and run limits do not bear on "no less and no more".
Observed: none of this was used (zero tool calls). About 7.2 KB (roughly 1,700 tokens) of
the 26.9 KB appended briefing has no role in a scope judgment; the starting-point notes
are mildly useful as engineer claims to compare with the patches.
Impact and confidence: no behavioral effect; about $0.007 of uncached input at the recorded
rate. Medium confidence that removing it loses nothing for scope reviews.
Correction direction: select briefing sections by review kind; omit declared checks,
limits, absolute directories and harness support paths from scope reviews.

### S4. Inherited architect identity and tools remain above the reviewer role (low, hypothesis)

Affected: reviewer:scope, inv-0009.
Location: native-first.json `instructions` (local-architect/11: "You are the local
architect of one module … You decide what the work item needs … Your session continues
across turns. If the harness returns a failing gate to you, you are the same session")
and top-level `tools` (`read`, `grep`, `ls`, `submit_work_orientation`); item 60 is the
reviewer role ("You change nothing and decide nothing … You have no access to the
working directory"); item 62 is the active-tools notice.
Expected: one unambiguous role and tool set for the current task.
Observed: the provider request carries two role definitions and a top-level tool list that
includes working-directory tools the reviewer must not use; the precedence rests on the
later developer message, the "Active tools … Inactive historical tools must not be called"
notice and the task line "This selection supersedes every prior task selection". This is
the deliberate cost of preserving the cached prefix (subs/harness/subs/agent/subs/pi/src/session-operations.ts
lines 155–166). In this run the model used only active tools and submitted correctly.
Impact and confidence: no observed effect. Whether a call to the inactive `read` would be
refused or executed is not shown by this run. Low confidence that it matters for a
one-turn review.
Correction direction: none required for cache reasons; keep the explicit active-tools
notice. Record in the transcript start entry that provider `instructions` stayed the
architect's (see evidence gaps).

### S5. The scope reviewer is the author of the assignment it judges (observation)

Affected: reviewer:scope, inv-0009; review request rq-0002 `forkPoint` ses-0004.
Location: task.md procedure lines 432–449: "Ask of the candidate as a whole: does it do
what the assignment asked, no less and no more? … You have no authority over the
assignment: challenge it by reporting, never by assuming it changed."
Expected: a scope review that can catch a gap between the plan and the candidate,
including one the assignment itself introduced.
Observed: the fork inherits the architect's own reasoning and its assignment (item 58),
including decisions such as leaving the stylesheet unchanged (the architect grepped the
stylesheet in orientation, items 41 and 47) and extending existing tests. The fork gives
the reviewer exactly the understanding that produced the assignment, which helps judge
"did the engineer do what I asked" and does little to test "was what I asked what the plan
needs". The procedure invites challenging the assignment, but this reviewer is poorly
placed to do it.
Impact and confidence: in this run I found no plan gap that the assignment introduced and
the reviewer missed (see below), so there is no observed harm. This is a design
observation, not a defect of the delivered prompt.
Correction direction: if plan-versus-assignment gaps matter, give that question to a
reviewer that does not inherit the assigning session, or state in the scope procedure that
the reviewer should re-read the cited elements against the candidate rather than against
its own outline.

## Did the reviewer have what it needed, and was `no concerns` adequately reached?

The decisive inputs for a scope judgment were all present before the first token: the
intent, the elements, the full diff, the plan path, and the explanation of the
harness-produced feature-file change, which otherwise would look like an out-of-scope edit
of a file "Agents never edit". The inherited caller and stylesheet reads stayed valid
because the changed-path list shows those files unchanged. Checking the candidate against
the ten elements myself: fr-001 to fr-005 are implemented exactly; nfr-001 holds (the tone
is a prop, nothing about records or reviews is added); nfr-002 holds; nfr-003 holds (no
caller changed, both callers still compile); nfr-004 holds in substance (the original
assertions remain and tone tests were added), with the nuance that the existing
custom-label test now also passes `tone="critical"`, so the shape "custom label, no tone"
used by `catalog-card.tsx` is no longer exercised by a unit test. No behavior beyond the
assignment was added; the only extra edit is the doc comment above `StatusBadge`, which
describes the new attribute. The stylesheet has no `data-tone` rules, but fr-002 asks only
that the stylesheet can read the attribute, and ctx-001 is context that "nothing
assesses". `no concerns` is therefore the correct outcome or very close to it; at most a
low-risk note on the modified existing test was available.

Whether the reviewer actually weighed these points cannot be established. Its one turn
had 276 reasoning tokens and the retained summary headings are "Reviewing patch
completeness and scope" and "Confirming patch sufficiency for submission". It read
nothing at the candidate, including the plan it was pointed to; reading was only required
to ground a concern. The contract makes a concern cost at least one `snapshot_read` while
`no concerns` costs nothing, which is a structural incentive toward the cheaper outcome.
This is a hypothesis; this run gives no example of a suppressed concern.

## Observed effects

| n (ses-0008) | Event | Note |
|---|---|---|
| 1 | started, fork from ses-0004 at inv-0006, reason `scope-review` | transcript records the reviewer role as `systemPrompt` |
| 2 | user message: briefing (25,827 bytes) | |
| 3 | one assistant turn: `submit_review` with four inspected paths, nothing missing, no concerns | 9,528 new, 25,984 cached, 374 output (276 reasoning) |
| 4–5 | harness verdict accepted | first submission accepted |
| 6–7 | ended `submitted`, actual mode fork | 7.7 s wall, 7.1 s model |

The submission is identical to inv-0008's (both recorded with submission hash
0f1e89f8…). First and only request charge, estimated at the recorded rates: $0.0381 new
input, $0.0104 cached input, $0.0075 output, $0.0560 in total. The cached 25,984 tokens
cover 99% of the parent inv-0006 prompt (8,897 + 17,280 = 26,177 tokens), so the inherited
history cost about one tenth of its uncached price. The 9,528 uncached tokens are the
parent's final turn (items 57–59, 8.6 KB of JSON, which was output in the parent and so not
part of its cached prompt) plus the 34.0 KB appended reviewer material (items 60–63). The
uncached part alone is larger than the whole first request of the fresh code reviewer
(7,527 tokens); S1 and S3 account for roughly 2.4k of those tokens.

No omission or excess coincided with clarification, repeated discovery, tool errors,
rejected submissions or repairs. The zero-tool-call path correlates with the delivered
complete patches and the inherited reading; I treat that as the intended effect of
delivering the diff in the packet (Plan 25), not as a defect.

## Correction suggestions

1. Skip re-sending the plan package when the fork already holds it under the same hash
   (S1); measure the appended bytes and uncached first-call tokens on the next comparable
   scope fork.
2. Keep lead-ins with their material and emit the deviation paragraph only when deviations
   exist (S2).
3. Select briefing sections by review kind: drop declared checks, configuration pointers,
   run limits, absolute directories and harness support paths from scope reviews (S3).
   Preserve intent, elements, plan path, changed paths, complete patches, pending-tag
   provenance, the procedure and the submission contract.
4. Keep the withdrawal notices; they are complete and cheap. Optionally render them as one
   block listing the withdrawn keys, which would save about 600 bytes.
5. Decide whether scope review is meant to test the assignment as well as the candidate; if
   so, do not fork it from the assigning session or tell it explicitly to judge against the
   cited elements before its own outline (S5). A focused comparison would run the same
   candidate through a fresh and a forked scope reviewer with a seeded plan-versus-assignment
   gap.

## Evidence gaps

The transcript start record for ses-0008 names the reviewer role (hash c620b6c2…, 2,795
bytes) as `systemPrompt`, while the provider request's `instructions` were the local
architect's (4,045 bytes, `instructionsEqual: true` against the parent in D/summary.json);
only the native request shows what the model actually had in the system slot. Reasoning is
retained as encrypted items and summary headings only, so the depth of the single review
turn is unknown. Whether an inactive inherited tool (`read`, `grep`, `ls`) would have been
refused if called is not exercised in this run. The manifest key for the inherited package
(`append:context:4646e400…`) does not match the block key its withdrawal names, so
matching withdrawals to inherited entries required reading the inherited text.
