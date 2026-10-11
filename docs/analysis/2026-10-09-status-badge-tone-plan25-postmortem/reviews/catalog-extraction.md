# Catalog-extractor prompt review: intake and catalog check

Run `20261009T193340Z-51f42e`, plan `status-badge-tone`, collection-review
fixture, model `openai-codex/gpt-5.6-sol:high`, pi 0.87.1, harness revision
474ffa58.

## Summary

Both catalog-extractor invocations received what they needed and finished
correctly. Each made two model calls, read only the captured plan, and had its
designated submission accepted on the first attempt. The intake (inv-0001)
recorded the plan's three Constraints bullets and its third Acceptance bullet
as four non-functional elements. It wrote a goal close to the plan's wording and
judged the plan's Gherkin binding. The check (inv-0003) returned no corrections
for the ten resulting elements. I compared those elements with the captured
plan and agree that the reading is faithful and complete: every Request,
Constraints and Acceptance statement and the opening paragraph appears once.
All findings are low severity, and none had an observable effect in this run.
The captured plan was delivered twice, once in the message and once through the
required read. Every invocation also carried environment blocks that this role
cannot use. Among them is a `supportPaths` pointer to harness-relative paths
that do not resolve from the working directory. The task line ends in the
literal artifact `for {}`. The check's framing splits the support text across
block headers. Its submission schema names fields (`capability`, scenario `key`)
that the message never connects to the entries and scenarios it lists; the run
did not exercise this. I found no unusable instruction, missing tool, schema
mismatch, wrong path or conflicting guidance.

## Coverage

| Kind / variant | Invocation | Session lineage | Evidence coverage |
|---|---|---|---|
| catalog-extractor, procedure `intake` (`procedure:catalog-extractor:intake`, sha256 6c5393fb…) | inv-0001 | Fresh (requested and actual). Harness session ses-0001, pi session cb76b510-8e44-4737-aafa-ac7a3fa1f3a6, turn 1 from checkpoint turn 0; not kept after submission | Packet (correlation `f3c8c11d….json`), native first and last provider requests (`d27b00a0…`, `57952d05…`), transcript ses-0001, observations, submission, outcome. Reasoning is retained only as summaries. |
| catalog-extractor, procedure `check` (`procedure:catalog-extractor:check`, sha256 dd5af49e…) | inv-0003 | Fresh (requested and actual). Harness session ses-0003, pi session 3b0ed27b-d588-44be-8388-d36f442eb9e5, turn 1 from checkpoint turn 0; not kept | Packet (correlation `c002a99c….json`), native first and last provider requests (`d470184f…`, `25f28364…`), transcript ses-0003, observations, submission, outcome. Reasoning is retained only as summaries. |

Both invocations share the same role instructions (hash 588601e8…, 3,748 bytes,
delivered as the provider `instructions`). They also share the built-in tools
`read`, `grep` and `ls`. Only the submission tool and the message differ. The
retained provider requests match the packets. In both invocations the
`instructions` equal the role instructions, and the user message equals the
packet's `message` byte for byte. The second request in each invocation keeps
the first request as an exact prefix, with the same tools and the same
`prompt_cache_key`. Neither invocation inherited history.

The `attempt: 2` in inv-0003's `invocation.json` counts this role's run-level
invocations. It is not a retry, and the events record no earlier check attempt.

Timeline: inv-0001 ran from 19:33:41.317 to 19:33:54.252 (12.9 s). The initial
architect, inv-0002, ran next. inv-0003 ran from 19:34:42.277 to 19:34:52.581
(10.3 s). `analysis-accepted` followed at 19:34:52.604, with catalog counts of
context 1, functional 5 and non-functional 4.

## Required information

| Need | inv-0001 intake | inv-0003 check |
|---|---|---|
| Objective | Met directly. The procedure block and the `# Current task: intake` header state it. The task line reads `Perform intake for {}` (finding 3). | Met directly. The procedure block, the support heading "Check the reading of doc-001" and the task header state it. The task line reads `Perform check for {}`. |
| Source document | Met directly and through a pointer. The full plan appears in `brief:requirements`, and the absolute captured path appears in the support block. The two are duplicates (finding 1). | Same as the intake. |
| Plan constraints relevant to the task | Met. The procedure limits the submission to non-functional and recommendation elements ("Do not submit functional or context elements: the architect reads those"). The role instructions define every kind and give "tests kept in step with changed text" as a non-functional example. | Met. The procedure's correction rules, kind rules and reference-list rules are present. |
| Authority and write scope | Met. "You change nothing" appears in the role instructions. All tools are read-only, and the policy sets `writer: false`. | Same as the intake. |
| Current state | Met. The support block gives scenario blocks with line numbers that match the captured file (34–38 and 40–43) and "Missing references to judge: none". | Met. It gives all ten elements as downstream readers receive them, the one entry with its requirement, acceptance and context references, and the two scenarios with their references. |
| Dependencies | Not applicable. | Satisfied by the accepted intake and architect analysis, which are rendered into the message. |
| Execution location | Met. `projectRoot` and `workingDirectory` are given, and the captured file is named by an absolute path. The `supportPaths` entries do not resolve from that directory (finding 2). | Same as the intake. |
| Verification expectations | Met. The role instructions say the harness checks shape, documents and citations, and returns every error with its path. | Same as the intake. |
| Expected submission | Met. The tool is named three times. The full JSON Schema is in the tool description, and the declared `inputSchema` is `{type: object}`. The model followed the description schema on its first try. | Met for the empty-corrections path that was used. The mapping from listed entries and scenarios to schema fields is implicit (finding 5) and was not exercised. |
| Use of the output downstream | Partly stated. The procedure says principles readers use the goal. The accepted goal also became the initial architect's `brief:goal` (finding 6). | Not needed. |

Nothing required was missing, contradictory, stale or inaccessible at delivery
time.

## Findings

### 1. The captured plan is delivered twice

Severity: low. Affected: inv-0001, inv-0003.

Location: `invocations/inv-0001/task.md` lines 8–55 (`# Block
brief:requirements`, 1,644 bytes) and line 61 ("Read each captured plan
document in full at its captured file"). The same pair appears in inv-0003's
`task.md`, lines 8–55 and 61. The role instructions also say: "Read the
captured files named in the message, at their absolute paths: they are the
bytes this run captured." Source: `subs/harness/src/run/service.ts` near line
4740, `const requirements = request.task?.requirements ?? [<captured plan>]`.

Expected goal: the agent reads the captured bytes once and works from them.

Observed mismatch: the message already contains the whole plan, rendered as a
single list item (`- # A tone for the status badge`). The agent still followed
the instruction and read the file. The read returned 1,544 bytes, which added
about 370–480 input tokens to the second call. The second-call input grew by
485 tokens in inv-0001 and 472 in inv-0003, a growth that includes the
first-call tool-call item. The copy in the message is not the captured bytes:
it is prefixed with `- `, and the support block's line numbers refer to the
file, not the message.

Impact and confidence: no behavioral effect. The cost is about 370 tokens of
plan in each provider call. Both calls in each invocation were uncached, so
four calls carried it. The cost grows with plan size and with the number of
captured documents. Confidence is high that this is duplication.

Correction direction: for catalog-extractor tasks, pass an empty `requirements`
list or a one-line pointer, and keep the read as the authoritative source. The
read cannot be dropped instead, because the role relies on reading the
captured bytes and on file line numbers.

### 2. Environment blocks this role cannot use, including unresolvable support paths

Severity: low. Affected: inv-0001, inv-0003.

Location: `task.md` blocks `environment:limits` (1,074 bytes),
`environment:views` (1,166 bytes, the architect view path with 15 module
names), `environment:supportPaths` (228–229 bytes) and the null-valued
`candidate`, `snapshot` and `cucumberConfiguration` blocks (349 bytes together).
Source: `service.ts` near lines 4790–4794 builds the same environment for every
role. `views` defaults to the architect view whenever one is materialized.

Excerpt:

```
"supportPaths": [
  "subs/harness/src/analysis/catalog-extractor.system.md",
  "subs/harness/src/analysis/intake.procedure.md"
]
```

Expected goal: give only the fields that bear on reading captured documents and
submitting a reading.

Observed mismatch: the catalog extractor reads no architecture, so the views
block does not bear on its task. Of the 28 limits, only
`rejectedSubmissionsPerTurn` relates to its work. The `supportPaths` are
harness-relative provenance paths. They do not exist under the working
directory: the retained project copy has no `subs/harness/`. Their content is
already delivered as the role instructions and the procedure block. The block
is therefore a pointer the agent cannot follow and does not need.

Impact and confidence: none observed. Neither invocation listed, searched or
tried these paths. Together the blocks come to about 2.8 KB, roughly 640 input
tokens per provider call by the ratio method described below, so about 2,500
uncached tokens across the four calls. A model that follows pointers could
waste a failed read on `supportPaths`. That is a hypothesis; it did not happen
here. Confidence is high that the content is irrelevant to this role.

Correction direction: select environment fields by role. For the catalog
extractor, keep `projectRoot`, `workingDirectory`, `availableTools` and, if
wanted, `rejectedSubmissionsPerTurn`. Omit `views` and the null fields. Either
drop `supportPaths` from the message and keep it in the manifest, which already
records sources and hashes, or label it as provenance outside the project.

### 3. The task line ends in a literal `{}`

Severity: low. Affected: inv-0001 (line 215), inv-0003 (line 347).

Excerpt: `Perform intake for {}; use the current evidence and designated
submission.` Source: `service.ts:4786`, ``Perform ${kind} for
${JSON.stringify(request.work)}``. Run-level tasks have `work: {}`.

Expected goal: a task line that names what is to be done.

Observed mismatch: the line looks like an unfilled placeholder and names
nothing. The plan and the document are identified elsewhere, in the goal and
support blocks.

Impact and confidence: no effect observed. The agent took its target from the
support block. Confidence is high in the cause.

Correction direction: when `work` is empty, omit the `for …` clause, or name the
plan (intake) or the document (check, for example `doc-001`).

### 4. Block framing overhead and support text split across block headers

Severity: low. Affected: mainly inv-0003; inv-0001 to a lesser degree.

Location: inv-0003 `task.md` lines 57–75:

```
# Block brief:support:# Check the reading of doc-001:0
...
The 10 elements read from it, as every later reader receives them:


# Block brief:support:# Plan context package:0
Current value; replaces any earlier value for this key.
# Plan context package

Catalog: 9420af41…
Elements: ctx-001, fr-001, …
Deviations: none
```

Expected goal: the elements follow their lead-in without interruption, and the
framing serves a fresh single-turn task.

Observed mismatch: the support text was split at its own Markdown headings into
six briefing blocks. As a result, the lead-in sentence and the elements are
separated by block headers. Block keys carry Markdown markers (`brief:support:##
Context:0`). Each split block also repeats a level-one `# Block` header above
the original heading levels. inv-0003 has 18 blocks and inv-0001 has 13, and
every one carries "Current value; replaces any earlier value for this key."
That is 56 bytes each: about 1.0 KB in inv-0003 and 0.7 KB in inv-0001. The
messages are fresh ("based on: none (full)"), so there is no earlier value to
replace. The "Plan context package" block (312 bytes, with a catalog hash and
"Deviations: none") does not bear on checking fidelity. The role instructions
add a paragraph about inherited procedure bodies and "explicit replacements and
withdrawals" (about 330 bytes). The catalog extractor always runs fresh in this
run.

Impact and confidence: none observed. The agent returned a correct empty
correction list. This finding concerns readability and size, not correctness.
Confidence is medium that the split harms a weaker model, and low that it
mattered here.

Correction direction: keep each support section as one block. Omit the
replacement sentence when the message is a full fresh briefing. Drop the "Plan
context package" header lines from the check. For roles that are always fresh,
shorten the role paragraph to "Follow the procedure selected by the current
task."

### 5. Check submission field names are not connected to the listed entries and scenarios

Severity: low (latent, not exercised). Affected: inv-0003.

Location: inv-0003 `task.md` lines 182–184 ("Entry
render-status-badge-with-tone: …", "Scenario given-warning-tone of
render-status-badge-with-tone: cites fr-004."). The procedure, lines 212–216,
says "list the entry in `entries` … and the scenario in `scenarios` with its
complete new `refs`". The `submit_catalog_check` schema requires
`entries[].capability` and `scenarios[].key`.

Expected goal: a correction that re-cites entries or scenarios can identify them
without guessing.

Observed mismatch: neither the message nor the procedure says that the entry
name is the `capability` value, or that `given-warning-tone` (rather than the
qualified "given-warning-tone of …") is the scenario `key`.

Impact and confidence: nothing happened in this run because the submission had
no corrections. A check that retires a cited element would need the mapping,
and the harness's error feedback would probably let it recover after a
rejection. That is a hypothesis. Confidence is high that the mapping is
implicit.

Correction direction: render the identifiers in schema terms, for example
"Entry (capability `render-status-badge-with-tone`)" and "Scenario (key
`given-warning-tone`, entry `render-status-badge-with-tone`)".

### 6. The intake procedure understates who uses the goal

Severity: low (informational). Affected: inv-0001.

Location: inv-0001 `task.md` lines 77–79: "The readers of the principles
documents use it to judge which of their rules bear on this plan." The accepted
goal appears verbatim as `brief:goal` in inv-0002's `task.md`, line 6.

Expected goal: the intake knows that its goal opens the architect's brief.

Observed mismatch: the stated audience is only the principles readers, and this
run had none (`principlesScan.status: "empty"`). The goal actually served the
initial architect.

Impact and confidence: none. The goal was accurate and close to the plan's
words. Confidence is high in the description gap and low in any effect.

Correction direction: add one clause saying that the goal also opens the
architect's brief.

### Items reviewed with no issue found

- Tools. `read`, `grep` and `ls` plus the designated submission tool were
  sufficient. Each invocation used one `read` with the absolute captured path
  and one submission.
- Submission schemas. The JSON Schema is embedded in the tool description with
  a bare `{type: object}` input schema. Both submissions validated on the first
  attempt, with zero rejections.
- Division of labour. The intake did not submit functional or context
  elements. The third Acceptance bullet ("The badge's existing tests still
  pass, and the tone has tests of its own.") went to the intake as
  non-functional. This agrees with the role's example "tests kept in step with
  changed text". The architect did not duplicate it. The boundary between an
  acceptance statement and a test-maintenance constraint is a judgment call,
  but the delivered text supported the choice that was made.
- Scenario incorporation. `scenarios: true` was correct, and the harness then
  materialized both scenarios.
- Fidelity of the check. No element is stronger or weaker than its source, and
  none is missing. The plan itself repeats one requirement (fr-003 and fr-005);
  that is not an extraction fault.
- Paths and working directory. All paths except `supportPaths` were correct
  and absolute.
- Conflicts between inherited and current guidance. There were none, because
  both sessions were fresh.

## Observed effects

Sequence for inv-0001, from observations and transcript ses-0001:

1. Call 1: 3,690 input tokens and 112 output tokens (25 reasoning). Reasoning
   summary: "Planning full file read for NFR analysis". The call issued `read`
   on the absolute captured path.
2. The read returned 1,544 bytes in 26 ms.
3. Call 2: 4,175 input tokens and 495 output tokens. The call issued
   `submit_intake`, which was accepted.

Sequence for inv-0003, from ses-0003:

1. Call 1: 5,175 input tokens and 99 output tokens. The call issued `read`.
2. The read returned 1,544 bytes.
3. Call 2: 5,647 input tokens and 358 output tokens. Reasoning summary:
   "Verifying fidelity of scenario citations / Assessing combined testing
   requirements". The call issued `submit_catalog_check` with empty lists,
   which was accepted.

There were no clarifications, repeated discovery, tool errors, rejected
submissions or repairs. The duplicated and irrelevant content coincided with no
behavioral cost. Its only observed effect is input size. I cannot attribute
any behavior to it causally, and the clean completion does not by itself show
that the extra content was harmless for other plans or models.

Size method: per-section provider token counts are not recorded, and no
tokenizer was available to me. I used the ratio of measured first-call input
tokens to the bytes delivered in that call: instructions, message and
serialized tool declarations. That ratio is 16,139 bytes to 3,690 tokens for
inv-0001 and 22,862 bytes to 5,175 tokens for inv-0003, about 4.4 bytes per
token. By this estimate, the content named in findings 1, 2 and 4 is about
5.3 KB in inv-0001 and 6.2 KB in inv-0003. That is roughly 1,200 and 1,400
tokens per call. All four calls were uncached, so about 5,200 input tokens were
billed for this content across the two invocations. At the recorded rate of
4 USD per million new input tokens, that is about 0.02 USD. The cost is small
per run and recurs on every run.

Materialized views: not applicable. The architect view (revision
`rev/1:a4552a91…:1`, coverage "cut: 11", "detailsUnavailable: 4") was
advertised in `environment:views`, but these tasks have no
architecture-discovery need. Neither invocation read, listed or searched a
view or project source. The only exploration was one read of the captured plan
in each invocation (two reads in total, 3,088 returned bytes, zero searches).
The project-copy views now on disk reflect the state after the run and were not
needed for this review.

Cache observation, outside this review's scope and passed on for the cache
review: in both invocations the second call carried the first request as an
exact prefix with the same `prompt_cache_key`, yet reported `cacheRead: 0`.
Other invocations in the run did get cache hits on early follow-up calls, for
example inv-0002 call 2 (8,064 cached) and inv-0013 call 2 (4,096 cached). In
these two invocations the second request was sent within about 30 ms of the
first response. The cause is unknown from the retained evidence. If both
second calls had hit the cache in full, the estimated saving would be
(3,690 + 5,175) × 3.6 USD per million, about 0.03 USD. This is a counterfactual
estimate.

## Correction suggestions

1. For the catalog extractor, have the task builder pass `requirements: []`, or
   a one-line pointer such as "The captured plan is doc-001; read it at the path
   below." Keep the mandatory read as the authoritative source (finding 1).
   Validation: rerun an intake and a check on this fixture and confirm the same
   submissions with lower first-call input.
2. Make the environment fields role-specific. For the catalog extractor, drop
   `views`, `candidate`, `snapshot`, `cucumberConfiguration` and all limits
   except `rejectedSubmissionsPerTurn`. Remove `supportPaths` from the message,
   or label it as harness provenance that is not readable from the project
   (finding 2).
3. Replace `Perform ${kind} for ${JSON.stringify(work)}` with a phrase that
   omits the clause when `work` is empty, or that names the plan or document
   (finding 3).
4. Keep each support section in one briefing block, omit "Current value;
   replaces …" on full fresh briefings, and drop the "Plan context package"
   header from the check. For fresh-only roles, shorten the role paragraph on
   procedure inheritance (finding 4).
5. In the check message, label entries with `capability` and scenarios with
   `key` exactly as the schema expects. A fixture with a deliberately
   misclassified element would validate the re-citation path (finding 5).
6. Add a clause to the intake procedure saying that the goal also opens the
   architect's brief (finding 6).

## Evidence gaps

- Reasoning is retained only as short summaries (encrypted content is not
  readable). I cannot tell whether the agent noticed that the plan was already
  in the message before it read the file.
- The missing-reference path of the intake (`incorporation.missing` with
  `source` offsets) and every correction path of the check (`add`, `rewrite`,
  `replace`, `entries`, `scenarios`) went unexercised. Their usability is
  assessed from the delivered text only.
- Per-section token counts are estimates by byte ratio, not provider
  measurements.
- The paths in the prompts point to the original run location under
  `/tmp/claude-1000/…/scratchpad/trial/collection-review`. I verified that
  `supportPaths` cannot be resolved against the retained copy at
  `/home/app/ramify-trial-evidence/…/collection-review`, not against the
  original directory. The layout is the same, so the conclusion is very likely
  to hold.
- The cause of the second-call cache misses is not determinable from the
  retained requests and usage records.
