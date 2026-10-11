# Status-badge-tone postmortem on gpt-6.1-sol — 11 October 2026

Run `20261011T104510Z-0e1b47` completed the status-badge-tone plan on
`openai-codex/gpt-6.1-sol:high`, from harness `5169117`. One work item in
`shared-ui` took one iteration. Every gate passed on its first attempt, the
code, scope and design reviews returned no concerns, and the non-functional
round closed satisfied. `trial verify` placed all five changed paths inside
wi-001.i01's recorded write scope and the `.gitignore` change in recorded
scratch setup, with a clean tree. These are separate observations. The gates
establish that the configured suite passed. The local architect's reports and
the non-functional assessment establish semantic acceptance. The verifier
establishes the change boundary.

Compared with the Plan 25 run on `gpt-5.6-sol:high`, this run took 145 s
longer: 541.7 s against 396.5 s. It made 65 model calls against 39. The
recorded estimate was $0.658 against $1.187, but only because the model's
recorded rates are half as high. Priced at the same rates, this run used 26%
more. The extra wall time is model time. This model produced output at about
30 tokens per second against about 50. In three invocations it also issued one
tool call per request although parallel calls were enabled.

The harness findings with an observed effect are these:

- The completion continuation submitted without the required `outline` once
  (finding 1). The procedure delivered in this run never says completion
  needs one.
- The design reviewer re-read all of its orientation's guidance (finding 2).
  This recurs from Plan 25, and this time it sat on the critical path.
- Declared-check and test-pointer blocks were read as instructions to open
  configuration files. This cost five requests in the scope review and
  similar reads in three other roles (finding 4).

The one Plan 25 correction that landed between the runs worked. The engineer
prompt now says what the API view covers. This run's engineer made no empty
view search and opened no foreign source, against four empty searches and a
15.9 KB foreign grep in Plan 25.

This report applies the
[ramify-agent-postmortem skill](../../.claude/skills/ramify-agent-postmortem/SKILL.md).
Delegated prompt reviews, derived inventories and the derivation script are in
[2026-10-11-status-badge-tone-gpt61-postmortem/](2026-10-11-status-badge-tone-gpt61-postmortem/).
The script is the Plan 25 one, pointed at this run's evidence. The analysis
made no implementation change and ran no new trial, test or audit. The only
process started for it was a model-free `serve` on the scratchpad copy, to
read the metrics projection.

| Identity | Retained value |
| --- | --- |
| Target project / plan | Collection Review / `status-badge-tone` |
| Run | `20261011T104510Z-0e1b47` |
| Comparison run | `20261009T193340Z-51f42e` (harness `474ffa58` as recorded; the Plan 25 merge is `ab3dde9` in this repository's extracted history; see the [Plan 25 postmortem](2026-10-09-status-badge-tone-plan25-postmortem.md)) |
| Harness source | `5169117` (clean `main`), `/workspaces/ramify-agent` |
| Command | `npm run real-session -- --project <copy> --plan status-badge-tone --model openai-codex/gpt-6.1-sol:high` |
| Evidence root | `/home/app/ramify-trial-evidence/status-badge-tone-gpt61-20261011T104510Z/` (copy of the trial directory without `node_modules`, with `real-session.log` and `metrics.json`) |
| Fixture baseline / final | `0244ce24` / `e6356f5d` |
| Model / pi / policies | `openai-codex/gpt-6.1-sol:high` / 0.87.1 / `kpi/1`, `scope-size/2`, `lineage/1` |
| Prompt packages | the same versions as Plan 25: `initial-architect/3`, `catalog-extractor/1`, `local-architect/11`, `context-selector/2`, `engineer/8`, `reviewer/4`, `nonfunctional-coordinator/2` |
| Run interval (UTC) | 10:45:10.784–10:54:12.453; 541.7 s |
| Activity | 13 invocations, 13 prompt instances in 12 kinds, 11 sessions, 65 model calls, 122 tool calls |
| Recovery | One rejected submission (inv-0010), six tool errors; no failed invocation, gate repair, degraded start, compaction or budget return |

The Plan 25 raw evidence directory no longer exists in this container. The
comparison uses that postmortem's committed report, inventory and summary.

Prompt text changed between the runs at the same package versions. The
engineer and local-architect system prompts now state the API view's scope and
where package declarations are. The three review procedures now say that
coverage lists name changed paths only. An `architect-consultation` task kind
and the `consult_architect` tool were added. No session in this run called it.

## Timeline

| Offset (s) | Event | Plan 25 (s) |
| --- | --- | --- |
| 0–14.5 | Intake (inv-0001, catalog-extractor) | 13.5 |
| 14.5–115.5 | Initial analysis (inv-0002): 1 entry capability, 0 hypotheses, 1 work item | 48.0 |
| 115.5–126.1 | Catalog check (inv-0003); analysis accepted | 10.4 |
| 126.2–135.5 | Readiness gate ga-0001 passed at attempt 1 | 9.8 |
| 135.5–146.7 | Scratch ignore rule, scenarios materialized, wi-001 started | 11.8 |
| 146.7–198.3 | Local orientation (inv-0004) | 33.9 |
| 198.3–205.4 | Context selection fork (inv-0005); package appended | 6.3 |
| 205.5–239.8 | Assignment continuation (inv-0006); wi-001.i01 assigned | 22.5 |
| 245.8–387.6 | Engineer (inv-0007), sc-001..sc-003 bound without fakes | 105.1 |
| 393.0–403.0 | Iteration gate ga-0002 passed; three reviews requested | 10.2 |
| 403.0–467.3 | Code review (inv-0008) and scope review fork (inv-0009) in the two review slots; completion continuation (inv-0010) from 411.5; design orientation (inv-0011) from 426.8, when the code review freed a slot; design review fork (inv-0012) to 467.3 | 29.1 |
| 469.2–469.4 | Work-item gate ga-0003 passed; wi-001 completed | 0.3 |
| 471.4–530.9 | Non-functional assessment (inv-0013), round 1 satisfied | 62.2 |
| 532.8–541.7 | Final gate ga-0004 passed; run completed | 13.3 |

The run's review policy allows two concurrent review attempts
(`policy.reviews.concurrency: 2` in `job.json`). The completion continuation
is not a review attempt, so it ran beside them. The design chain is an
orientation and then a fork, and it could not start until a slot freed. It
then ran 40.5 s and ended 27.4 s after the completion (439.9 s), so the
work-item gate waited for it. In Plan 25 the one-call scope review freed its
slot after 8 s and the design chain ended before the completion. Here the
scope review took 25 s (finding 4) and the code review 23.6 s.

## Prompt-kind coverage

Eleven reviewers covered all 13 instances. Each reviewed its kind against the
packet, the native first request, inherited history up to the start point, the
transcript, the submission and the outcome.

| Kind (package, procedure) | Instances | Start | Review | Highest severity |
| --- | --- | --- | --- | --- |
| Intake (catalog-extractor/1, intake) | inv-0001 | fresh | [catalog-extraction](2026-10-11-status-badge-tone-gpt61-postmortem/reviews/catalog-extraction.md) | low |
| Catalog check (catalog-extractor/1, check) | inv-0003 | fresh | same | low |
| Initial analysis (initial-architect/3, main) | inv-0002 | fresh | [initial-analysis](2026-10-11-status-badge-tone-gpt61-postmortem/reviews/initial-analysis.md) | medium |
| Local orientation (local-architect/11, orientation) | inv-0004 | fresh | [local-orientation](2026-10-11-status-badge-tone-gpt61-postmortem/reviews/local-orientation.md) | low |
| Context selection (context-selector/2, main) | inv-0005 | fork of inv-0004 | [context-selection](2026-10-11-status-badge-tone-gpt61-postmortem/reviews/context-selection.md) | low |
| Assignment (local-architect/11, main) | inv-0006 | continued | [local-assignment-and-completion](2026-10-11-status-badge-tone-gpt61-postmortem/reviews/local-assignment-and-completion.md) | low |
| Completion (local-architect/11, main inherited) | inv-0010 | continued | same | medium |
| Engineering (engineer/8, main) | inv-0007 | fresh | [engineering](2026-10-11-status-badge-tone-gpt61-postmortem/reviews/engineering.md) | low |
| Code review (reviewer/4, code) | inv-0008 | fresh | [code-review](2026-10-11-status-badge-tone-gpt61-postmortem/reviews/code-review.md) | low |
| Scope review (reviewer/4, scope) | inv-0009 | fork of inv-0006 | [scope-review](2026-10-11-status-badge-tone-gpt61-postmortem/reviews/scope-review.md) | medium |
| Design orientation (reviewer/4, orientation) | inv-0011 | fresh | [design-orientation](2026-10-11-status-badge-tone-gpt61-postmortem/reviews/design-orientation.md) | medium |
| Design review (reviewer/4, design) | inv-0012 | fork of inv-0011 | [design-review](2026-10-11-status-badge-tone-gpt61-postmortem/reviews/design-review.md) | medium |
| Non-functional assessment (nonfunctional-coordinator/2, assessment) | inv-0013 | fresh | [nonfunctional-assessment](2026-10-11-status-badge-tone-gpt61-postmortem/reviews/nonfunctional-assessment.md) | low |

Every reviewer found the required information delivered, or obtainable
through a usable pointer and an available tool. One exception was material:
the completion's `outline` requirement, which only the tool schema stated
(finding 1). The reviewers who checked a verdict against the change confirmed
it: code, scope, design and the four non-functional verdicts.

## Findings

Findings are ordered by observed impact and recurrence. A finding is observed
unless marked as a hypothesis.

### 1. Medium (causal): the completion procedure does not say an outline is required

This affects inv-0010. Its first `submit_work_item_result` was rejected at
10:52:18.471Z with `outline: Invalid input: expected object, received
undefined`. The submission schema requires `outline` on `request-completion`
and makes it optional on `assign`. The procedure delivered in this run was
`local-architect-capability.procedure.md`, and it never describes the fields
of a completion request. It mentions the outline only for guarded-file
authorizations and breaking changes. The procedure that documents the
requirement, `local-architect.procedure.md`, is delivered only when
`capabilityWorkflow` is false. The model's reasoning summary shows the
omission was deliberate: "There's no need for an outline or to keep the
original." It resubmitted 12 s later with a full outline (revision 2), which
was accepted. The rejection cost one request, 11.9 s and an estimated
$0.0093, about a quarter of inv-0010's cost. It was off the critical path,
because the design chain ended later.

The provider-facing parameters of every submission tool are
`{"type":"object","properties":{}}`, with the full schema (17.5 KB here) as
text in the tool description. This is deliberate: in
`subs/harness/subs/agent/subs/pi/src/session-operations.ts`, a permissive
schema lets the harness validate input and return every error at once.
Plan 25 recorded the same shape, and that model made no omission. Two of
this run's sessions remarked on it in their reasoning (inv-0001, and inv-0013:
"no arguments are defined"). That the shape contributed to the omission is a hypothesis.

The fix is to state in the capability-workflow procedure what a completion
request carries, the outline included. Whether the provider-facing parameters
could list required top-level fields while keeping harness validation is a
separate design question. Validate on a repeat by counting rejected
submissions by field.

The rejection was recorded with an empty `callId`
(`invocations/inv-0010/observations.jsonl` n=21), although the transcript and
the tool-start observation carry `call_d33d48d6…`. `runner.ts:791` calls
`judge.judge(input)` without the call ID, so the default `''` is recorded.
Without the ID a rejection can be matched to its call only by time and
attempt number, and it has no deduplication key.

### 2. Medium (recurrence, now on the critical path): the design orientation cannot spare its fork a re-read

This affects inv-0011 and inv-0012, and recurs from Plan 25 finding 2. The
orientation procedure says design reviews "continue from what you have read
here". The fork's message, however, marks the guidance block "Withdrawn; this
block no longer applies". Its guidance section says to read each file with
`snapshot_read` "if this session has not read one of them yet", and the
reviewer role accepts only `snapshot_read` results as grounds. The
orientation has no `snapshot_read` tool, so on such a fork that condition is
always true. The design reviewer's first three calls re-read all three READMEs
(13,369 bytes already in its context). That was 68.7% of its returned bytes,
two extra requests and about 5.5 s. It submitted no concerns, so it never
used them as grounds. The wording comes from
`subs/harness/subs/reviews/src/message.ts`.

This time the design chain gated the work-item gate (see the timeline), so
the re-read added directly to wall time. The orientation itself cost $0.0128
and 9.9 s, and with one design review in the run it saved about $0.0092 of
cached input. The fix is unchanged from Plan 25. Either guidance delivered in
the orientation, matched by hash, counts as read, or the orientation reads
through `snapshot_read` itself. Alternatively, skip the separate orientation
when only one design review is expected. Validate with a plan that has two or
more iterations in one work item.

### 3. Medium: the initial architect reads the live plan, not the captured one

This affects inv-0001, inv-0002 and inv-0003, and recurs from Plan 25
finding 4, where it was rated low. The plan arrives as one
`brief:requirements` bullet, 1,544 bytes and identical to `input/plan.md`. The
initial architect's `<plan>` block then arrives empty, because the harness
strips the duplicate. The initial architect was given no captured-file path,
so it re-read the live `plans/status-badge-tone/plan.md`. The catalog
extractor's procedures also require reading the captured file, which cost
each of inv-0001 and inv-0003 one model call (about 4 s). The two files were
identical in this run. If the plan had been edited after the run started,
though, the analysis would have been made from a different plan than the one
the run captured and its catalog checks read. That integrity risk is why this
report raises the severity. Deliver the plan once, in the plan block, with its
captured path. The requirements section can then point to it.

### 4. Medium (recurrence, wider): declared-check and pointer blocks read as reading lists

This affects inv-0002, inv-0007, inv-0008 and inv-0009. It extends Plan 25
finding 1, which recorded the code reviewer's configuration reads.

- The initial architect is read-only and has no shell, yet the declared-checks
  block tells it to "Inspect their configuration". Three configuration reads
  followed (7.3 s).
- The code reviewer read the four listed configuration files first, in the
  listed order (7,255 bytes).
- The engineer read `ramify-audit.json` (2.8 KB), which repeated checks its
  prompt already listed.
- The scope reviewer spent five of its seven requests reading
  `ramify-audit.json`, `ramify-agent.json`, `package.json` and `cucumber.js`
  and listing `src/tests/`. None of these bears on scope. Its reasoning summary
  reads "I'll need the mandated reference readings, along with a list of
  tests". The fresh code reviewer read the same five targets, so the blocks
  caused this, not the fork's inheritance. The five requests took 11.8 of the
  scope review's 23.6 s of model time and $0.027 of its $0.057. The blocks
  are worded as instructions: "Read these…", "inspect with snapshot_list".

This model made one tool call per request in the scope review, so each
pointer became a model round trip. That multiplied the cost of the pointers
more than in Plan 25, where the scope reviewer made one call with no tools.

The rest of the environment material recurs unchanged from Plan 25 finding 1.
Every fresh role still receives nine environment blocks, 3.1–6.4 KB per
message. `supportPaths` names harness-repository prompt files that do not
exist in the target project. `environment:views` advertises
`.ramify-architect` to snapshot-only roles whose tools refuse it. The full
run `limits` block goes to every role. In fresh sessions, every block carries
a "Current value; replaces any earlier value for this key" banner. The
reviewers measured the unusable share at 2.8–5.3 KB, or 16–20% of a
message.

The fix is to phrase declared checks and pointers as information ("the gate
runs these; open them only if a concern depends on them"), and to select
environment blocks per role and task. Validate by counting configuration
reads per kind on a repeat.

The scope fork also carries about 134 KB of inherited architect history, of
which about 5 KB helps a scope review: the assignment's outline and write
scope. The prefix is exactly preserved and cached, so the cost is small per
request. Every extra request, however, re-reads at least 26K cached tokens,
about 183K of the fork's 254K cache reads. The fork keeps the architect's
system prompt, which names `read`, `grep`, `ls` and `.ramify-architect`
searches. It has no observed effect, and keeping it is what makes the prefix
reusable. Whether the scope review should fork from the assignment at all is
the design question already raised in Plan 25.

### 5. Low: view navigation gaps produced tool errors and noisy searches

- **inv-0002:** the architect view's README says to read `<module>/module.json`,
  but the view's directories drop the root name. One `ls` failed and a second
  recovered.
- **inv-0002:** coverage limits are again given only as counts (`cut: 11`,
  `detailsUnavailable: 4`). A whole-view grep for them returned 15.5 KB, mostly
  irrelevant (recurs from Plan 25 finding 6).
- **inv-0004:** the role prompt says to search `.ramify/children`, but
  `shared-ui` has no children. Both greps failed with "Path not found", and the
  submission then called the child views "unavailable".
- **inv-0004:** the orientation dumped view pages with `grep "."`. A search for
  `support` matched every "supporting" count line (8.7 KB).
- **inv-0007:** the API view shows `ReviewStatus` only as
  `z.infer<typeof reviewStatusSchema>`. The values are in a separate entry that
  a name search does not reveal. The engineer took them from its own module.

Name the records behind coverage limits, make the README path match the
layout, and mention `children` only when the module has children. A short
layout hint would help agents navigate view pages.

### 6. Low: `snapshot_diff` refuses unchanged files

This affects inv-0013. Asked for a diff of a file the candidate did not
change, `snapshot_diff` returns an error (`snapshot.ts:307`). The message's
`changedPaths` already showed the three files were unchanged, so the calls
only repeated that. These were three of the run's six tool errors. An empty
diff with a note would be the more useful answer.

### 7. Low: smaller recurring gaps

- **Placeholder task lines** (inv-0001, inv-0002, inv-0003, inv-0013): the
  tasks still read `Perform intake for {}` and similar (Plan 25 finding 5).
- **Context selection** (inv-0005): the selector's reasons and conditions are
  recorded but not delivered. The package shows "Conditions: none recorded".
  "You may read a captured document" gives no path the empty workspace can
  resolve. Two orientation-only blocks remain current at the fork.
- **Completion** (inv-0010): about 6.5 KB of its 11.5 KB task repeats earlier
  material, such as the bounds block, all the scenario text, and sc-003's step
  bindings four times. "Earlier outlines" gives only a count.
- **Completion during reviews** (inv-0010): the procedure says completion is
  refused while reviews remain, but the harness accepted it during in-flight
  reviews and settled them before the gate. The behavior is safe, but the text
  misdescribes it.
- **Non-functional assessment** (inv-0013): the assessment procedure keeps an
  action paragraph although no action tool is offered. The prompt asks to
  preserve requirement wording that the schema has no field for. The starting
  points omit the badge's two callers, which one search found.

### No issue found

The reviewers found no issue with task identity, authority, write scope, the
assignment (inv-0006), the focused scenario command, the submission contracts
of the other kinds, or the fork and continuation mechanics. Inactive inherited
submission tools were never called after a fork. The design-guidance set was
the right one: the three ancestor READMEs of the only changed module.

## Status of the Plan 25 findings

| Plan 25 finding | Status in this run |
| --- | --- |
| 1. Run-wide environment blocks | Unchanged; part of finding 4 |
| 2. Design orientation cannot spare its fork a re-read | Unchanged; finding 2, now on the critical path |
| 3. Engineer prompt omits the API view's scope | **Fixed.** No empty view search, no foreign-source grep, packages taken from `package.json` and existing tests |
| 4. Plan delivered twice, its block empty | Unchanged; finding 3, severity raised |
| 5. Placeholder task lines | Unchanged |
| 6. Coverage limits reported only as counts | Unchanged; part of finding 5 |
| 7. A test guarantee changed unnoticed | Not repeated. This engineer kept the existing tests unchanged, and the non-functional assessment checked that |
| 8. Scope reviewer's fork and duplicated package | Fork shape unchanged; see the scope review |
| 9. Smaller local-architect gaps | Mostly unchanged; part of finding 7 |

## Architect discovery

| Invocation | Classified calls | Architect view | API view | Direct source/tests | Other docs | Configuration | Unknown | View-first / source-first / fallback episodes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| inv-0002 initial architect | 15 (10 discovery) | 9 (60%; 90% of discovery) | 0 | 1 (6.7%) | 2 (13.3%) | 3 (20%) | 0 | 2 / 0 / 1 |
| inv-0004 local orientation | 24 | 1 (4.2%) | 10 (41.7%, 2 failed) | 8 (33.3%: 6 own module, 2 foreign) | 1 (4.2%) | 4 (16.7%) | 0 | 2 / 2 / 1 |
| inv-0006, inv-0010 | no discovery | — | — | — | — | — | — | — |

The denominators are each invocation's classified tool calls, excluding
submissions. Plan 25 excluded configuration and verification calls, so the
shares are not directly comparable (Plan 25: inv-0002, 11 of 11 in the
architect view; inv-0004, 10 of 17 in the API view). No path was read twice
in either invocation.

The initial architect's view lookups answered the owner and consumer
questions. Its one source fallback read `status-badge.tsx` (1.3 KB) for the
actual markup that one scenario quotes. That was a focused follow-up, not
rediscovery. The orientation's fallback looked for the global World
registration, which is a side effect rather than a symbol, so no view could
show it. Of its two source-first episodes, neither was avoidable rediscovery.
The orientation's view use was noisy, though (finding 5).

## Engineer capability use

| Need | Scope | Source of information | Outcome |
| --- | --- | --- | --- |
| N1 `ReviewStatus` type in ordinary source | API view (ordinary) | Existing type-only import; the view's `[type-only]` marker matches | Used correctly |
| N2 status values in the step file | API view (testing) | Testing view searched, then narrowed from the module's own `StatusBadgeProps` | Used correctly; no import needed |
| N3 coexisting with the `integration-tests` World | Outside both views (side effect) | Delivered instruction not to import its internals | Local `WeakMap` state; focused run passed the hooks |
| Packages: `react`, `react-dom/server`, `@cucumber/cucumber`, `vitest`, `node:assert` | Outside the view | `package.json` and the module's existing tests | Used correctly; no `node_modules` read |

There were three Ramify needs. A view was consulted for 3 of 3. None needed
provider-source inspection, none was used incorrectly, none was left
unresolved, and no capability request was warranted. All were verified by
focused runs and gate ga-0002. The engineer's 11 discovery calls were 2 in a
view, 5 in its own module, 3 in project configuration and 1 in the
harness-generated focused profile, with none in foreign source. They returned
14,036 bytes, all before the first edit at 53 s. Plan 25's engineer made
three empty view greps for packages, one empty search for step-file
precedent and one 15.9 KB foreign grep.

## Metrics

Usage reconciles: the 65 per-call usage observations sum to the invocation
totals of 209,042 new input, 915,840 cache-read, 0 cache-write and 14,784
output tokens. The estimated cost is $0.658 from recorded rates
(`pi-ai@0.87.1` model runtime: $2/M new input, $0.10/M cached input, $10/M
output). The run used a ChatGPT subscription, so the estimate is not an
invoice. The largest contributors were the initial architect ($0.120, 101 s,
16 calls), the engineer ($0.097, 140 s, 9 calls) and the local orientation
($0.082, 52 s, 6 calls).

Exploration recorded 79 reads, 21 searches, 186,011 returned bytes and
15.4 s of tool time. It also recorded 2 repeated reads and 3 broad searches.
The run had six tool errors (one failed `ls`, two failed greps, three refused
diffs) and one rejected submission. `observation-coverage` is 12 of 13: the
engineer's shell is unguarded, as the guarding statement records.

Three recording issues limit what the collection answers:

- **Outside-scope count:** `outsideScopeSearches` is 0, but only 2 of the 21
  searches have a known outside-scope status. The other 19 are `null`, and
  `kpi/exploration.ts` notes them only as per-call coverage strings. The 0 is
  a subtotal of 2, not a measurement of 21.
- **Review request link:** every entry of `evaluation.invocations[]` has
  `request: null`, including the four reviewer invocations. Reviewers had to
  link inv-0008, inv-0009 and inv-0012 to their review requests by hand.
- **Rejection call ID:** the empty `callId` on rejections (finding 1).

As in Plan 25, `lineage/1` measures only forks of the global architect's
context generation. The three local forks (inv-0005, inv-0009, inv-0012)
appear in no lineage metric, and `forks-served.generation-1` is 0. Pi's
`grep` "No matches found" result did not occur in this run, so whether it is
still left out of `zeroMatchSearches` was not exercised. Failed searches
("Path not found") are not counted separately from searches.

### Comparison with Plan 25

The two runs share the plan, the fixture, the prompt package versions and the
policies. They differ in model and in the prompt-text changes listed above.
Both are single runs, so the differences are descriptive.

| Measure | Plan 25 `51f42e` (`gpt-5.6-sol`) | This run (`gpt-6.1-sol`) |
| --- | --- | --- |
| Wall time | 396.5 s | 541.7 s |
| Summed model time | 338.7 s | 502.8 s |
| Model calls | 39 | 65 |
| Tool calls / per request | 143 / 3.7 | 122 / 1.9 |
| New input / cache-read / output tokens | 168,422 / 406,016 / 17,538 | 209,042 / 915,840 / 14,784 |
| Estimated cost, own rates | $1.187 | $0.658 |
| Estimated cost at `gpt-5.6-sol` rates | $1.187 | $1.498 |
| Estimated cost at `gpt-6.1-sol` rates | $0.553 | $0.658 |
| Output rate (output tokens over model time) | about 52 tokens/s | about 29 tokens/s |
| Initial analysis | 4 calls, 48 s | 16 calls, 101 s |
| Engineer | 9 calls, 103 s, task 26,665 B | 9 calls, 140 s, task 29,670 B |
| Scope review | 1 call, 8 s | 7 calls, 25 s |
| Design review | 2 calls, 9 s | 8 calls, 31 s |
| Review phase (ga-0002 to ga-0003) | 32.1 s | 66.4 s |
| Completion task bytes | 7,737 | 11,468 |
| Rejected submissions / tool errors | 0 / 0 | 1 / 6 |

The model behavior differs in two ways. First, output was slower. Each
invocation's output rate fell, from 36–64 to 13–36 tokens per second. Second,
there were more model round trips. The initial architect, the scope reviewer
and the design reviewer each made exactly one tool call per request, although
every request set `parallel_tool_calls: true` with the same parameters as
Plan 25. Most of the extra requests came from the initial analysis: 15
single-call steps and then a 57 s submission request with 82% of its output.
Within sessions, more requests meant more cache reads, so cache reads rose
2.3 times while new input rose 24%. The fresh code reviewer batched the
same five configuration reads that the forked scope reviewer serialized, and
the forked design reviewer also serialized. The scope reviewer's reasoning
wondered about "old multi-tool definitions". That a fork's inherited tool
history encourages serial calls is a hypothesis, and the fresh initial
architect's serial calls argue against it as the whole cause. These are model
properties, but the
harness findings above set how many round trips there are to serialize. For
a model like this one, findings 2–4 cost more.

The larger review messages (code +4.2 KB, scope +4.1 KB, design +4.3 KB) are
mostly the larger change. This run's patch was 150 inserted lines across five
files, against four files in Plan 25, and review messages carry complete
patches.

## Cache reuse at session boundaries

| Child | Kind | Mode | Parent last request (new + cached) | First call after the boundary: new / cached | Cached share of first call | Cached share of parent prompt | Prefix preserved | Gap | First-call cost |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| inv-0005 | context selection | fork | inv-0004: 17,526 | 5,723 / 13,824 | 70.7% | 78.9% | yes | 7.1 s | $0.0146 |
| inv-0006 | assignment | continued | inv-0004: 17,526 | 12,410 / 13,824 | 52.7% | 78.9% | yes | 37.8 s | $0.0371 |
| inv-0009 | scope review | fork | inv-0006: 26,234 | 10,495 / 26,112 | 71.3% | 99.5% | yes | 172.7 s | $0.0244 |
| inv-0010 | completion | continued | inv-0006: 26,234 | 4,108 / 26,112 | 86.4% | 99.5% | yes | 178.7 s | $0.0113 |
| inv-0012 | design review | fork | inv-0011: 4,992 | 7,757 / 4,864 | 38.5% | 97.4% | yes | 6.2 s | $0.0167 |

"Prefix preserved" means that the provider instructions, the tools, the
`prompt_cache_key` and the parent's full input array were identical at the
start of the child's first request. The cached share of the parent prompt is
the first call's cache read divided by the parent's last request input (new
plus cached). The design fork's 4,864 cached tokens are not a miss. They are
97% of a small base, the orientation's whole prompt.

Three boundaries reused essentially the whole inherited prefix. The two from
inv-0004 did not. Both read 13,824 tokens, which is the prompt of inv-0004's
fourth request (1,393 + 12,544, rounded to the provider's apparent 128-token
granularity). The parent's sixth and last request (17,526) was not reused,
although the prefix was byte-identical and the gaps were 7.1 s and 37.8 s.
Plan 25 reused 99.4% at the same two boundaries. The cause cannot be
determined from the retained requests. Pricing the 3,702-token shortfall at
the new rather than the cached rate, it cost about $0.014 across the two
boundaries.

Four follow-up requests within a session read nothing from cache: inv-0002
call 14 (16,950 new tokens), inv-0004 call 3, inv-0008 call 2 and inv-0013
call 2. In each, the instructions, tools, cache key and input prefix matched
the previous request exactly. Plan 25 had three such misses. The cause is
presumably on the provider side. Pricing the previous prompts at the cached
rather than the new rate, the four misses cost about $0.074, 11% of the run's
estimate.

## Evidence gaps

- **Views:** the run-time materialized views were not retained. The copy holds
  post-run revisions: the architect view `:12` and the API views `:4`, against
  `:1` and `:2` at run time. View findings rely on tool results stored in
  transcripts, revision identities and post-run content.
- **Reasoning:** reasoning is retained only as encrypted items and short
  summaries, so motives are inferred from summaries and call order.
- **Sizes:** per-block sizes are UTF-8 bytes. Tokens are recorded only per
  request.
- **Search details:** search observations lack scanned bytes and matched
  files. 19 of 21 searches have no outside-scope status.
- **Plan 25 evidence:** the raw evidence is gone from this container, so the
  comparison relies on its committed derived artifacts.
- **Focused profile:** the engineer's harness-generated profile under
  `src/tmp/` is missing from the copy.
- **Unexercised paths:** reuse of one design orientation across several
  reviews, the catalog check's correction path, CheckFindings, architect
  consultation, and calls to inactive inherited tools.

## Suggested next steps

A correction for each finding, with the principle it serves and the
measurement that would validate it, is proposed in
[2026-10-11-status-badge-tone-gpt61-corrections.md](2026-10-11-status-badge-tone-gpt61-corrections.md).

1. State the completion request's fields, the outline included, in
   `local-architect-capability.procedure.md` (finding 1). Pass the call ID to
   the submission judge so rejections carry it. Count rejected submissions by
   field on the next run.
2. Resolve the design reviewer's ground rule for orientation-delivered
   guidance, or skip orientation for a single review (finding 2). Consider
   whether the design chain should get a slot ahead of the scope review when
   only two are allowed. Validate on a plan with two iterations.
3. Deliver the plan once, with its captured path, and stop the initial
   architect from reading the live file (finding 3).
4. Rephrase declared-check and test-pointer blocks as information, and select
   environment blocks per role (finding 4). Count configuration reads per kind
   on a repeat.
5. Fix the view navigation gaps and name the records behind coverage limits
   (finding 5). Return an empty diff for unchanged files (finding 6).
6. Report `outsideScopeSearches` with its known coverage, fill
   `evaluation.invocations[].request` for reviewers, and add local forks to
   the lineage metrics.
7. To separate model effects from harness effects, repeat this plan on
   `gpt-5.6-sol:high` at `5169117`. A comparison at the same harness revision
   would show how much of the time and call increase belongs to the model.
