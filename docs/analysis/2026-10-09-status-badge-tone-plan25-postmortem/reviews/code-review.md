# Prompt review: reviewer `code` (inv-0008)

Run `20261009T193340Z-51f42e`, plan `status-badge-tone`, collection-review fixture,
`openai-codex/gpt-5.6-sol:high`, pi 0.87.1, harness revision 474ffa58 (merged Plan 25).
Paths below use J for the retained job directory, O for the retained session-operations
directory and D for this postmortem directory, as defined in the parent brief.

## Summary

The code reviewer was a fresh session (ses-0007) asked to review audited candidate
b999ea9 (tree 4e706c2, base c76c24e, gate ga-0002 passed) for review request rq-0001.
Its delivered packet gave it everything a code review of this four-file change needed:
the iteration goal, approach and completion evidence, all ten cited plan elements whole,
the complete 6,957-byte patch for every changed path, the harness attribution for the
feature-file tag removal, candidate-relative pointers, a read-only snapshot tool set that
matched the role text, and a coherent submission schema. The reviewer used that packet
well: it read every changed file in full at the candidate, checked the Cucumber runner
configuration that loads the new step file, searched for every caller of `StatusBadge`,
read both callers and the stylesheet, searched for duplicate step text, read the plan,
and then submitted `no concerns` with all four paths inspected (accepted first time,
19 tool calls in 4 parallel batches, 5 model requests, 29.0 s). I found no missed
defect of medium or high risk in the candidate, so I judge `no concerns` to be a
defensible result reached with adequate inspection. The prompt findings are all low:
a lead-in heading left empty by block splitting, no explicit candidate path for the
plan in the code variant, a configuration pointer list that induced reads of files that
cannot bear on a code review, and about 2 KB of environment material (limits, absolute
directories, harness-repository support paths) that a read-only reviewer cannot use.
None of these had an observable effect on the outcome.

## Coverage

| Kind | Variant | Invocation | Session | Review request | Start (requested/actual) | Evidence used |
|---|---|---|---|---|---|---|
| reviewer:code | fresh, review of audited candidate with delivered diff (Plan 25 reviews module) | inv-0008 | ses-0007 (pi 460782bf-06b6-4167-a462-5e4aa9216533) | rq-0001, attempt rq-0001.a01 | fresh / fresh | packet D/invocations/inv-0008/packet.json; delivered message D/invocations/inv-0008/task.md (23,732 bytes, hash 25193e38…); native first provider request D/invocations/inv-0008/native-first.json; transcript J/transcripts/ses-0007.jsonl; J/reviews/rq-0001/{request.json,attempts/01/attempt.json,attempts/01/submission.json}; J/invocations/inv-0008/{invocation.json,outcome.json}; events 71, 76–78, 83, 103–104 |

There is one instance of this kind in the run. All of it was reviewed. The harness source
at /home/app/ramify-status-badge-20261009-latest/ramify-agent (subs/harness/subs/reviews/src/message.ts)
was read only to explain the observed block layout.

## What was delivered

The provider request (native-first.json) carried the reviewer role instructions as
`instructions` (2,849 bytes), five tools (`snapshot_list`, `snapshot_read`,
`snapshot_search`, `snapshot_diff`, `submit_review`; 3,981 bytes of JSON) and one user
message: the briefing (task.md). The first request measured 7,527 input tokens, none
cached. That gives about 4.2 bytes per provider token for this request (31.6 KB of
instructions, tools and input), which is the ratio used for the token estimates below.

The briefing's blocks, with sizes from the delivered-inputs manifest:

| Block | Bytes | Role for this task |
|---|---|---|
| role:reviewer (system) | 2,795 | required |
| tool:submit_review | 2,230 | required (schema embedded in description) |
| brief:goal | 129 | required (one line naming the candidate) |
| brief:requirements | 737 | raw review-request JSON; duplicates the context block |
| brief:support:context:0 | 546 | required (candidate, tree, base, gate) |
| brief:support:## The iteration:0 | 1,358 | required (goal, approach, completion evidence) |
| brief:support:## What the plan asks of it:0 | 211 | heading and lead-in only; see C1 |
| brief:support:## The changed paths:0 | 800 | required |
| brief:support:## Declared project checks:0 | 900 | partly useful; see C3 |
| brief:support:## Candidate test pointers:0 | 1,068 | useful (test area, pending-tag provenance) |
| brief:support:assignment-package | 2,989 | required (ten cited elements whole) |
| brief:support:candidate-diff | 7,339 | required (complete patches) |
| brief:support:starting-points | 2,622 | navigation help; largely restates changed paths |
| procedure:reviewer:code | 1,894 | required |
| environment:* (9 blocks) | 2,577 | candidate/snapshot/tools useful; limits, absolute directories, support paths, empty views and null Cucumber configuration not usable; see C4 |
| task | 419 | required |

## Required information

| Need at this point | Status | Where |
|---|---|---|
| Objective (review the audited candidate for defects) | met directly | brief:goal, context block, procedure step 3 |
| Iteration intent (goal, approach, completion evidence) | met directly | `## The iteration` block (task.md lines 22–29) |
| Plan constraints (fr-001…fr-005, nfr-001…nfr-004, ctx-001) | met directly | assignment-package (task.md lines 80–178) |
| Authority (read only, decides nothing) | met directly | role instructions; tools are read-only |
| Write scope of the iteration | not needed for a code review; not delivered | (scope variant carries the rationale) |
| Current state (candidate, base, gate result) | met directly | context block; environment candidate/snapshot |
| The change itself | met directly | complete patches for all four paths (candidate-diff) |
| Why a "never edit" feature file changed | met directly | pending-tag binding lines (task.md lines 75–77) and line 49 |
| Dependencies and callers | obtainable via available tool | `snapshot_search` / `snapshot_read`; the reviewer did this |
| Execution location | met directly | "Every path is relative to the candidate's root" (role); starting points say the same |
| Verification expectations (what the gate ran) | met directly | Declared project checks; gate ga-0002 passed |
| A readable ground for concerns (plan, tests, README) | obtainable via pointer, but indirect for the plan | element headings name `plans/status-badge-tone/plan.md`; no statement that the candidate holds it (scope variant has one); see C2 |
| Expected submission | met directly | submit_review description carries the full schema; Coverage section of procedure |
| Existing CheckFindings | not applicable | none existed; the procedure still refers to "a CheckFinding the message below lists" |

Nothing required was missing, contradictory, stale or inaccessible.

## Usable instructions

The reviewer could identify the task and submit with its actual tools. No unresolved
placeholders were found. The role text, procedure and tool list agree on the five snapshot
tools. The procedure tells the reviewer to use the supplied patches and fetch others only
when missing; the reviewer never needed `snapshot_diff`. The procedure's coverage rule
("Name every changed path once: in `inspected` when you read its patch or content") matched
the harness check: the submission naming all four paths was accepted on the first call.
Two instructions are slightly off without consequence: the procedure refers to "a
CheckFinding the message below lists" when the message lists none (the harness omits the
section when empty, message.ts line 119), and `environment:supportPaths` names harness
repository files that snapshot tools cannot read (C4).

## Findings

### C1. The plan-elements heading is emptied by block splitting (low)

Affected: reviewer:code, inv-0008 (the same layout occurs in inv-0009).
Location: D/invocations/inv-0008/task.md lines 31–35 and 80. Excerpt:
"## What the plan asks of it / The elements the assignment cites, whole, as its engineer
received them." The block then ends; the elements appear 45 lines later in a separate
block `brief:support:assignment-package`, after the changed paths, declared checks and
test pointers.
Expected: the heading and its lead-in introduce the elements directly, as the message
builder composes them (subs/harness/subs/reviews/src/message.ts lines 82–88 push the
lead-in followed by `briefing.package`).
Observed: the block serializer splits the package out as a literal section
(`support:assignment-package`), leaving a heading whose content is a sentence pointing at
nothing adjacent. In the same way the patch payload is moved from the changed-paths block
into `brief:support:candidate-diff`, so "Use the supplied changed-path list and complete
patches delivered in this message" (line 49) precedes the patches by 130 lines.
Impact and confidence: the reviewer clearly found and used both the elements and the
patches, so no effect is observed. High confidence in the mismatch, low impact on this
small packet; a larger packet with several literal sections would make the orphaned
lead-ins harder to follow.
Correction direction: keep the lead-in and the package in one block, or make the lead-in
name the block that holds the elements ("the elements are in the plan context package
below"). Same for the diff instruction.

### C2. The code variant does not say the candidate holds the plan (low)

Affected: reviewer:code, inv-0008.
Location: task.md has no counterpart of the scope variant's line "The candidate holds the
plan as `plans/status-badge-tone/plan.md`. To name it as a concern's ground, read it with
`snapshot_read`." (present in inv-0009 task.md line 39; message.ts line 90 emits it only
for `kind === 'scope'`). The code procedure meanwhile says a concern's ground may be "the
assignment's plan … read with `snapshot_read`" and "a concern about them is grounded in a
file the candidate holds".
Expected: a code reviewer that wants to ground a plan-based concern knows the readable
path without a search.
Observed: the path was obtainable from the element headings ("from
plans/status-badge-tone/plan.md"), and the reviewer did reach it: a step-text search over
the whole candidate (transcript n19–20) hit `plans/status-badge-tone/plan.md`, and the
reviewer read it at n24–25. No extra call can be attributed to the missing sentence with
confidence, because the search had its own purpose (checking for duplicate step
definitions).
Impact and confidence: low; the information was obtainable and was obtained.
Correction direction: emit the plan-document sentence for code reviews as well, since the
code procedure names the plan as a valid ground.

### C3. The declared-check pointer list induces reads that cannot inform a code review (low)

Affected: reviewer:code, inv-0008.
Location: task.md lines 53–65, "Configuration/support pointer: `ramify-audit.json`",
"`ramify-agent.json`", "`package.json`", "`cucumber.js`", followed by "Read these
project-relative references with snapshot_read/snapshot_list in the audited candidate."
Expected: pointers that help judge whether a change can fail or break a caller.
Observed: the reviewer's first reasoning summary was "Inspecting config pointers and test
directories", and its first batch (n3) read all four files (returned 1,359 + 2,105 + 3,717
+ 104 = 7,285 bytes). `cucumber.js` was useful: it shows the step glob
`subs/**/src/tests/steps/**/*.{ts,tsx}` and the `not @ramify-pending` filter, which is how
the new step file and the tag removal take effect. `package.json` is marginally useful.
`ramify-audit.json` (3,717 bytes) and `ramify-agent.json` (104 bytes) restate the check
commands already listed and cannot ground a code concern on an audited candidate whose
gate passed. The sequence links the reads to the pointer directly (the reasoning summary
names the pointers), so this is causal, not just correlated.
Impact and confidence: about 3.8 KB returned (roughly 900 tokens at the measured ratio),
re-read as cached input on four later requests. Low cost; high confidence about the cause.
Correction direction: for code reviews, list only the runner configuration that determines
whether changed tests or step files are collected (here `cucumber.js`, `vitest`
configuration) and drop the audit and agent configuration pointers; the check commands
themselves can stay as one line each.

### C4. Environment blocks a read-only reviewer cannot use (low)

Affected: reviewer:code, inv-0008 (same blocks in inv-0009).
Location: task.md lines 405–493. `environment:limits` (1,073 bytes: repair rounds, run
limits, command timeouts, placement limits), `environment:projectRoot` and
`environment:workingDirectory` (absolute paths, 524 bytes; the role says "You have no
access to the working directory"), `environment:supportPaths` (223 bytes:
`subs/harness/src/prompts/reviewer.system.md`, `…/code-review.procedure.md`, which are
harness repository paths, not candidate paths, so `snapshot_read` cannot open them),
`environment:views` (`[]`) and `environment:cucumberConfiguration` (`null`).
`environment:availableTools`, `candidate` and `snapshot` repeat the tool declarations and
the context block.
Expected: environment fields the reviewer can act on.
Observed: none of these fields was used; no tool call referenced them. About 2.0 KB of
unusable fields (roughly 490 tokens, estimated with the measured 4.2 bytes per token), of
which the support paths are the only one that could mislead (a reviewer told to read
"support paths" with candidate-relative tools would get a refusal).
Impact and confidence: no observed effect; low relevance cost and negligible cache cost.
Correction direction: omit limits, absolute directories and harness support paths from
reviewer packets, or mark support paths as provenance rather than readable references.

### C5. Duplicated navigation material (informational)

`brief:requirements` (737 bytes) is the raw review-request JSON, including an
`assignment` path that the context block then explains is not readable; the same facts are
in prose in the context block. `brief:support:starting-points` (2,622 bytes) lists six
pointers, of which all six paths are the changed paths already listed with full patches
(three architect notes at the base and three engineer notes at the candidate). The
engineer notes are producer judgments the procedure tells the reviewer not to trust. No
effect observed; the reviewer read the changed files because the procedure asks for the
surrounding source, not because of these pointers. Relevance is low; cost is about 800
tokens uncached on the first request. Correction direction: drop the raw request JSON
from reviewer briefs, and drop starting points whose path is already a changed path.

## Did the reviewer have what it needed to find real problems?

Yes. For a code review the decisive inputs are the complete patches, the surrounding
source, the callers and the runner configuration. The patches were delivered whole; the
rest was reachable and was reached. I checked the candidate independently against the
plan and found:

The tone union, default and `data-tone` attribute match fr-001 to fr-005 exactly; both
callers (`catalog-card.tsx` with `status` and `label`, `review-result.tsx` with `status`
only) compile and render unchanged, satisfying nfr-003; the label path is untouched,
satisfying nfr-002; the steps exercise the real badge, keep state on the per-scenario
World, and are collected by the existing Cucumber glob.

Possible observations a reviewer could have raised, none of which I would rate above low:
the file-level doc comment of `status-badge.tsx` still says "It is deliberately tiny: a
status and an optional label" (stale documentation, which the procedure classes as style);
the existing custom-label test now also passes `tone="critical"`, so the exact caller shape
"custom label, no tone" used by `catalog-card.tsx` is no longer exercised by a test
(nfr-004 says "The badge's existing tests still pass"; the original assertions are kept, so
this is a coverage nuance, not a failing promise); the stylesheet gains no `data-tone`
rules, but fr-002 only requires that the stylesheet can read the attribute. The reviewer's
reasoning summaries show it considered the stylesheet ("Assessing tone styling and feature
edits") and test reliability ("Assessing prop type and test reliability"). `no concerns`
is therefore a defensible judgment, not an under-inspected one.

## Observed effects

The sequence in J/transcripts/ses-0007.jsonl:

| n | Action | Note |
|---|---|---|
| 3–12 | 9 parallel calls: read all four changed files in full, list the test directory, read `package.json`, `cucumber.js`, `ramify-audit.json`, `ramify-agent.json` | reasoning summary "Inspecting config pointers and test directories" (C3) |
| 13–18 | search `StatusBadge` and `status-badge\|data-tone` (one in `src`, zero matches), list steps and source | caller and stylesheet discovery |
| 19–23 | search the step texts across the candidate; read both callers and `subs/workspace/src/styles.css` | duplicate-step check and nfr-003 |
| 24–25 | read `plans/status-badge-tone/plan.md` | grounding source (C2) |
| 26–28 | `submit_review` with four inspected paths, nothing missing, no concerns; accepted | first submission accepted |

Usage: 5 requests, 17,795 new input tokens, 49,536 cached, 1,351 output (reasoning 716
tokens summed over the requests); estimated charge about $0.118 at the recorded rates
($4/M new, $0.40/M cached, $20/M output). First request: 7,527 new, 0 cached. No rejected
submissions, no tool errors, one zero-match search (`src`, a legitimate negative check).

No prompt omission or excess coincided with clarification, repeated discovery, tool errors
or a wrong submission. The only behavior traceable to prompt content is the four
configuration reads (C3).

## Correction suggestions

1. Keep each lead-in with the material it introduces when blocks are split into literal
   sections (C1). Validate by checking the next run's reviewer task.md for headings whose
   block contains only a lead-in.
2. Emit "The candidate holds the plan as …" for code reviews too (C2).
3. Narrow the code-review pointer list to runner configuration that decides which changed
   tests run (C3). Validate by comparing configuration reads in the next comparable code
   review.
4. Remove `environment:limits`, the absolute directories and harness support paths from
   reviewer packets (C4), and drop the raw request JSON and starting points that duplicate
   changed paths (C5). Preserve the candidate, tree, base, gate, complete patches,
   pending-tag provenance and the submission contract.

## Evidence gaps

Reasoning content is retained only as summary headings (for example "Assessing prop type
and test reliability"); the actual considerations behind `no concerns` cannot be read, so
the claim that the reviewer weighed the stylesheet and the test changes rests on headings
and on which files it opened. Search observations do not record scanned bytes or matched
file identities (observations coverage notes). The `ses-0007` transcript records the role
text as `systemPrompt`; the native request confirms it was delivered as `instructions`,
which matches here. No CheckFindings existed, so the CheckFinding instruction was not
exercised.
