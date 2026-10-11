# Prompt review: context-selector main (inv-0005)

Run `20261011T104510Z-0e1b47`, plan `status-badge-tone`, collection-review
fixture, `openai-codex/gpt-6.1-sol:high`, pi 0.87.1, ramify-agent `5169117`
(clean main). Evidence root:
`/home/app/ramify-trial-evidence/status-badge-tone-gpt61-20261011T104510Z/`.
Run-record paths below are relative to
`collection-review/plans/status-badge-tone/.harness/jobs/20261011T104510Z-0e1b47/`.
Native-request item numbers refer to the `input` array of
[inv-0005/native-first.json](../invocations/inv-0005/native-first.json).

## Summary

The prompt was adequate for its task, and the selection it produced served
the assignment and engineering that followed. ses-0005 forked from ses-0004
at the end of inv-0004's orientation. The fork point is turn 1, checkpoint
`934882cf-750a-4bb9-bf37-de6e9a8f1434`. The child inherited the
orientation briefing and exploration history as items 0–53, about 80 KB of
request JSON. Appended to that were the selector role, the
`submit_context_selection` declaration, an active-tools notice and a
3,881-byte task. The task lists the catalog's only selectable elements,
nfr-001 to nfr-004, each in full.

The agent made one model request (6.7 s model time, 7.06 s invocation) and
no tool calls. It selected all four elements, with reasons that use facts
from the inherited exploration. The submission was accepted first time. The
harness appended the resulting 10-element package to ses-0004. inv-0006
then wrote an assignment whose approach covers all four NFRs, using only its
submission call. The assignment cites all 10 elements, inv-0007 received the
four NFRs whole, and the run's non-functional assessment `nfa-001` judged
all four satisfied in round 1.

There are no blocking or high-severity issues. The findings are low or
informational. Three of them recur from the
[2026-10-09 review](../../2026-10-09-status-badge-tone-plan25-postmortem/reviews/context-selection.md)
and are still present at `5169117`:

- The selector's reasons, conditions and uncertainty never reach the
  architect or engineer.
- "You may read a captured document" gives no usable path, and the working
  directory is an empty `selector-workspace`.
- Inherited orientation-only blocks are not withdrawn at the fork.

## Coverage

- Kind: context-selector, procedure `procedure:context-selector:main`
  (package `context-selector/2`), one variant: a fork of the local
  architect's orientation session.
- Covered ID: inv-0005. Harness session ses-0005, pi session
  `4fad71ba-93d3-4bd1-9864-bccd5ecafa66` turn 2, forked from ses-0004 /
  inv-0004 (pi session `1e001881-f69a-4184-ab07-b0601168e3d2`, turn 1,
  checkpoint `934882cf…`). Work item wi-001, attempt 1.
- Artifacts read:
  - Derived extracts:
    [packet.json](../invocations/inv-0005/packet.json),
    [task.md](../invocations/inv-0005/task.md),
    [native-first.json](../invocations/inv-0005/native-first.json) (also the
    last request, since `nativeRequestCount` is 1),
    [inventory.json](../inventory.json), [tools.json](../tools.json) and the
    inv-0005 and inv-0006 boundary entries in [summary.json](../summary.json).
  - Run records: `invocations/inv-0005/{invocation,inputs,submission,outcome}.json`,
    `invocations/inv-0005/observations.jsonl`, `transcripts/ses-0005.jsonl`
    (7 records, all inline), `events.jsonl` sequences 35–50,
    `work/wi-001/orientation/5dbdabe0….txt`,
    `work/wi-001/selection/42378b2b….json`, the empty
    `work/wi-001/selector-workspace/`, `input/plan.md`,
    `analysis/catalog/8b8dc5c5….json`,
    `work-items/wi-001/iterations/01/assignment.json` and
    `nonfunctional/assessments/nfa-001.json`.
  - Downstream evidence only: inv-0006 and inv-0007 `task.md`, `packet.json`
    and `native-first.json`, plus their outcomes.
  - Harness source at the recorded revision, used for reconstruction:
    [prompts.ts](../../../../subs/harness/src/context-selection/prompts.ts),
    [recorded.ts](../../../../subs/harness/src/context-selection/recorded.ts),
    [delivery.ts](../../../../subs/harness/src/context-selection/delivery.ts)
    and `selectElements` in
    [service.ts](../../../../subs/harness/src/run/service.ts) (about line 5060).
- Generated views were not needed. The selector's profile includes no view
  (`scope.size`: "the role's profile does not include the global view"), and
  the inherited view reads are judged from their captured tool outputs, not
  from the post-run copy.

## Required information

| Need | Where it came from | Assessment |
|---|---|---|
| Objective | `task` block ("Perform selection for {"workItem":"wi-001"}"), the selector role (developer item 54) and the procedure block | Met directly. |
| Elements to judge | `brief:support:## Non-functional requirements of the plan:0` holds the four NFRs whole. The package header lists `Elements: nfr-001, nfr-002, nfr-003, nfr-004` | Met directly. The catalog holds no fixed or recommendation element, which matches the list. The message does not state that explicitly, but the role's "lists every … of the run's catalog" makes the list complete. |
| Work item goal, FRs and module | Inherited `brief:goal`, `brief:requirements` and `## Your module` (item 0) | Inherited. Still current. |
| Current state of the badge, tests and callers | Inherited reads of `status-badge.tsx`, `status-badge.test.tsx`, the feature and `module.ramify`, plus the accepted `submit_work_orientation` call (item 52, 3,428 bytes) | Inherited and used. The reasons "existing static-markup tests" and "default labels and custom labels" restate facts from these reads. |
| Authority and write scope | Role: "You do not waive requirements, assign work, or edit files". Policy `writer: false`, `scope: null` | Met. The selector writes nothing, and the inherited default write scope is irrelevant to it. |
| Waiver semantics and later verification | "Omitting an element never waives it: every non-functional and fixed element is assessed against the final candidate" | Met directly, in both the brief and the procedure. |
| Execution location | `environment:workingDirectory`, the empty `work/wi-001/selector-workspace` | Stated. No reads were needed. Reading a document would have needed an absolute path; see F2. |
| Captured document, if a doubt arises | NFR headings say "from plans/status-badge-tone/plan.md". The inherited `environment:projectRoot` and the inherited rule "Any project-relative path in this briefing resolves from the project root" | Reachable only by composing an absolute path. The task names no path or location (F2). Not exercised. |
| Expected submission | `submit_context_selection`, with the complete JSON schema in its description (item 55). The task says "Submit only through …" | Met. Parameters are declared as `{"type":"object","properties":{}}`, but the model complied on the first attempt. |
| Dependencies and verification commands | None apply to this read-only selection | Not needed. |

### Usable instructions

The agent could identify the task and submit with its actual tools. The
system instructions are still the inherited local-architect text (4,361
bytes, kept for prefix reuse). The selector role arrives as a developer
message, followed by `Active tools: read, grep, ls, submit_context_selection.
Inactive historical tools must not be called.` The inherited system prompt's
"Follow the procedure key and hash selected by the current task" and the
task header's "This selection supersedes every prior task selection"
resolve the role change. The task contains no unresolved placeholders.

The phrase "answer with IDs only" could clash with the schema's required
`reason` field. The procedure resolves this by contrasting IDs with
"no passage, heading or line range". Three residual mismatches had no
effect: the unresolvable support paths (F3), the un-withdrawn orientation
blocks (F4) and the missing document pointer (F2).

## Findings

### F1. Selector reasons, conditions and uncertainty are recorded but not delivered (low, design)

- IDs: inv-0005, and downstream inv-0006 and inv-0007.
- Location: `work/wi-001/selection/42378b2b….json` keeps the selector's
  reasons, for example nfr-001: "Adding tone to the shared badge must retain
  its presentation-only ownership and prop-driven rendering…". The package
  appended to ses-0004 is item 54 of inv-0006's first request
  (`brief:support:work-item-package`). It renders each NFR with the
  catalog's "Conditions: none recorded. / Uncertainty: none recorded." The
  strings "prop-driven rendering" and "regression coverage" occur 0 times
  in inv-0006's and inv-0007's first native requests.
  `readRecordedContextSelection` calls `deliverPackage(catalog,
  planDeviations, selection.package)`, which renders from element IDs only.
- Expected: the procedure asks for "your reason, the conditions under which
  it applies and your uncertainty". Downstream roles should either receive
  these, or the procedure should say they are an audit record.
- Observed: the architect and engineer receive only the IDs and the catalog
  text. Here the effect was nil, because all conditions were `[]`, all
  uncertainty was `""` and every element was selected. When a selector
  narrows an element with a condition, the package's "Conditions: none
  recorded" would read as authoritative and the narrowing would be lost
  silently.
- Confidence: high on delivery (captured bytes plus source at the run
  revision). Low on future impact.
- Correction: render the selector's reason and conditions beside each
  selected element, labelled as the selector's judgment. Alternatively, state
  in the selector procedure that they are recorded for audit only.

### F2. "Read a captured document" has no usable pointer from the selector's working directory (low)

- IDs: inv-0005.
- Location: the NFR brief and the procedure block say "You may read a
  captured document to settle a doubt". `environment:workingDirectory` is
  `…/jobs/20261011T104510Z-0e1b47/work/wi-001/selector-workspace`, which
  `selectElements` creates empty (`mkdir`, service.ts about line 5069) and
  which is still empty in the post-run copy. The NFR headings name
  `plans/status-badge-tone/plan.md`, a project-relative path.
- Expected: a document the agent is invited to read should be named by an
  absolute path, or by a path that resolves from the stated working
  directory.
- Observed: the inherited system prompt says "Relative paths in your tool
  calls resolve against [the working directory]". A direct
  `read plans/status-badge-tone/plan.md` would therefore look inside the
  empty workspace. The path is reachable only by joining the inherited
  `environment:projectRoot` to the heading path, under the inherited
  briefing rule for project-relative paths. Other roles in this run read
  either the project plan (inv-0002) or the captured copy at
  `plans/status-badge-tone/.harness/jobs/…/input/plan.md` (inv-0001,
  inv-0003). The selector is not told which of the two counts as
  "captured".
  It had no doubt and made no read, so there was no effect.
- Confidence: high on the pointer gap. Whether pi's `read` would accept the
  absolute path for this role is untested.
- Correction: name the captured document's absolute path in the selector
  task, or omit the invitation when the elements are delivered whole.

### F3. `environment:supportPaths` names harness-repository files that do not resolve (low)

- IDs: inv-0005.
- Location: the appended block lists
  `subs/harness/src/context-selection/selector.system.md` and
  `…/selector.procedure.md` (240 bytes).
- Expected: an environment pointer should be readable from the agent's
  working directory, or be absent.
- Observed: these are ramify-agent source paths, outside the target
  project, and relative to an empty working directory. Their contents are
  already delivered as the role message and the procedure block. Nothing
  explains the block. No read was attempted.
- Correction: drop support paths from agent-visible environment blocks.
  They are provenance and already sit in the manifest's `sources`.
  Alternatively, mark them as provenance and not reading targets.

### F4. Inherited orientation-only blocks stay current at the fork (low)

- IDs: inv-0005.
- Location: item 0 carries `brief:support:# Orientation task:0` ("Submit
  your orientation using `submit_work_orientation`") and
  `procedure:local-architect:orientation`. Neither is withdrawn in the
  appended message. The inherited system prompt also says "When something
  is uncertain, decide, and record it in the outline". In contrast,
  inv-0006's continuation explicitly withdraws the orientation task block
  ("Withdrawn; this block no longer applies.").
- Expected: blocks the current task no longer uses are withdrawn, as the
  continuation does.
- Observed: under the block semantics ("Current value; replaces any earlier
  value for this key") the orientation task block remains in force. The
  task header, the selected procedure hash and the active-tools notice
  disambiguate, and the agent called only `submit_context_selection`. No
  effect.
- Correction: emit the same withdrawals at a context-selection fork that
  the continuation emits. They are appended content, so the cached prefix
  is unaffected.

### F5. Duplicated closing instruction (informational)

The paragraph "Select, by ID, the elements … answer with IDs only." (about
330 bytes) ends the NFR brief block, and the procedure block restates it
(722 bytes). Both are short, appended once and consistent. There is no
issue beyond the duplication. Keeping one copy, in the procedure, would
also keep the NFR block limited to element text.

### F6. Submission declaration carries its schema only in the description (informational)

Item 55 declares `submit_context_selection` with `"parameters":
{"type":"object","properties":{}}` and `"strict": null`. The 600-byte
schema sits in the description. The model produced schema-valid input on
the first attempt, with no rejection (`rejectedSubmissions: 0`). No issue
was observed in this instance. Other reviews of this run cover the same
declaration pattern.

### F7. Inherited history is mostly irrelevant to this decision but cached (informational, relevance vs cost)

- Measurement: UTF-8 byte length of each JSON-serialized `input` item in
  native-first.json. Total input is 86,001 bytes. Instructions are 4,361
  bytes and tools 4,111 bytes; the whole request is 94,888 bytes. Provider
  tokens come from recorded usage, not from bytes.
- Relevant to the selection, about 11 KB:
  - goal and FRs, about 2.2 KB
  - README and `module.ramify`, 1.05 KB
  - `status-badge.tsx`, 1,256 bytes
  - `status-badge.test.tsx`, 1,030 bytes
  - the feature, 1,527 bytes
  - the accepted orientation call, 3,428 bytes, the best single summary
- Not bearing on this decision, about 34 KB of tool outputs plus their call
  items:
  - architect-view grep, 8,718 bytes
  - ordinary and testing API-view greps, 9,773 bytes
  - two identical `vocabulary.ts.md` reads, 3,252 bytes each
  - `world.ts`, 4,359 bytes
  - `package.json`, `cucumber.js`, `vitest.config.ts` and `tsconfig.json`,
    4,419 bytes
  - `_meta.json` reads, 335 bytes
- Also not bearing on it, about 6 KB of briefing blocks: declared checks,
  limits, views, write scope and engineer bounds.
- Opaque: 8,049 bytes of encrypted reasoning.
- Relevance: for choosing among four plan-wide NFRs on a one-work-item
  plan, roughly half the inherited bytes did not matter. They were retained
  as the parent's exact prefix. `summary.json` records equal instructions,
  tools, model and `prompt_cache_key`, with the parent's 51 items preserved
  as a prefix. Narrowing them would mean giving up the fork.
- Cost: the first and only request read 13,824 of 19,547 prompt tokens from
  cache (70.7%). It sent 5,723 new tokens and produced 176 output tokens,
  for an estimated $0.0146 at recorded rates, $0.0114 of it new input. The
  parent's last request had already read 16,256 of 17,526 tokens from
  cache. With the prefix preserved, the child's lower cache read is not
  explained by prompt changes, and the cause is unknown. inv-0006 read the
  same 13,824. That is a matter for the cache review.
- Counterfactual: a fresh compact selector would need only the goal, the
  orientation summary and the NFRs, about 7 KB. Whether that would be
  cheaper depends on cache behavior that was not measured here, so this is
  not recommended as a change on this evidence.

## Observed effects

- inv-0005, `transcripts/ses-0005.jsonl` n=1–7: start at 10:48:29.105Z;
  user message n=2; a single assistant tool call n=3, with no `read`, `grep`
  or `ls`; verdict `accepted` at n=4; ended `submitted` at n=6. There was no
  clarification, repeated discovery, tool error, rejection or repair.
- The selection reasons cite inherited facts: nfr-002's "default labels and
  custom labels", nfr-003's "public props addition and neutral default",
  and nfr-004's "existing static-markup tests". This links them to the
  parent's reads, inferred from wording only. Usefulness of the inherited
  history is therefore supported. Adequacy at delivery time stands on its
  own: every element was delivered whole, the objective and schema were
  explicit, and the work-item state was inherited.
- Downstream, `events.jsonl` 42–50 runs from `context-selection-recorded`
  through `context-package-appended` (ses-0004, checkpoint `9c0cd2f0…`) to
  `invocation-started` inv-0006, `continued`. inv-0006 made one tool call,
  `submit_work_item_result`, with 0 rejections. Its assignment `wi-001.i01`
  cites the 10-element package `74601e3a…`. Its `approach` and
  `completionEvidence` encode each NFR:
  - nfr-001: "do not add knowledge of reviews, records or protocols"
  - nfr-002: "Preserve Passed/Failed defaults, custom-label behavior"
  - nfr-003: "absence of required consumer edits", in `completionEvidence`
  - nfr-004: "Retain the existing unit tests and add real static-markup
    tests"
- inv-0007's task carries the four NFRs whole in
  `brief:support:assignment-package`. `nfa-001` reports nfr-001 to nfr-004
  `satisfied` in round 1.
- Causal and correlated effects differ. The selection causally determined
  that all four NFR texts reached the architect and engineer. The
  engineering success and NFR satisfaction correlate with that, but nothing
  shows they depended on it. The architect's inherited orientation already
  covered caller compatibility and label independence.
- No omission or excess coincided with a problem. F1–F4 had no observable
  effect in this run.

## Suggested corrections

1. Decide whether selector reasons and conditions are delivered or are
   audit-only, and say which in `selector.procedure.md` (F1). This is the
   only finding that could silently change downstream behavior on a larger
   catalog.
2. Give the selector the captured document's absolute path, or remove the
   invitation to read it (F2).
3. Withdraw orientation-only blocks at the context-selection fork, matching
   the continuation's withdrawals (F4). Remove or relabel
   `environment:supportPaths` (F3).
4. Keep one copy of the closing selection instruction (F5).
5. Leave the inherited prefix as it is (F7). Its relevance is partial, but
   it is the cache-reusable state and the source of the facts the reasons
   use. Revisit only with a measured fresh-versus-fork comparison.

## Evidence gaps

- Reasoning is encrypted: 8,049 bytes inherited, and `reasoningTokens: 0`
  is reported for the child's response. Use of inherited facts is inferred
  from the submission's wording.
- Only the native request is retained, not the provider's response body.
  The display transcript stores the call input inline, and it matches
  `submission.json`.
- `selector-workspace` is empty in the post-run copy. Nothing records
  writes to it, so I assume it was empty during the run.
- No read was attempted, so whether pi's `read` would accept an absolute
  path outside the working directory for this role is unverified (F2).
- The cause of the child's cache read falling short of the parent's
  preserved prefix (13,824 against 16,256 tokens or more) is unknown.
  Expiry, routing and provider behavior cannot be separated with this
  evidence.
- That downstream packages render from IDs only is shown by captured
  inv-0006 and inv-0007 bytes. The general claim rests on harness source
  at `5169117`, which the run recorded as clean main.
