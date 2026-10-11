# Status-badge-tone postmortem after Plan 25 — 9 October 2026

Run `20261009T193340Z-51f42e` completed the status-badge-tone plan on the first
run of ramify-agent with Plan 25 merged (`474ffa58`). One work item in
`shared-ui` took one iteration. Every gate passed on its first attempt, the
code, scope and design reviews each returned no concerns, and the
non-functional round closed satisfied. `trial verify` found every change
inside the recorded write scope or recorded setup, with a clean tree. These
are separate observations: the gates establish configured suite health, the
local architect's reports and the non-functional assessment establish
semantic acceptance, and the verifier establishes the change boundary.

No finding in this run caused a rejection, repair, retry or wrong outcome.
The improvements supported by evidence are all efficiency or clarity
corrections. The ones that recur most are run-wide environment blocks that
most roles cannot use, a placeholder task line, and a plan that is delivered
twice. The engineer prompt lacks the one sentence that would have prevented
three empty API-view searches. The design orientation could not save its
fork any work because the design instructions require re-reading the guidance
it summarized.

Plan 25's carried-forward blocks are visible in the run. The completion
continuation (inv-0011) appended no environment block and no procedure, and
its task was 7,737 bytes, against 14,373 bytes for the same task in the
previous repeat. Every continuation and fork kept its provider prefix
exactly, and each boundary's first call read 98–99% of the parent's last
prompt from cache.

This report applies the
[ramify-agent-postmortem skill](../../.claude/skills/ramify-agent-postmortem/SKILL.md).
Delegated prompt reviews, derived inventories and the derivation script are in
[2026-10-09-status-badge-tone-plan25-postmortem/](2026-10-09-status-badge-tone-plan25-postmortem/).
No implementation change, new trial, test run or audit was performed during
the analysis.

| Identity | Retained value |
| --- | --- |
| Target project / plan | Collection Review / `status-badge-tone` |
| Run | `20261009T193340Z-51f42e` |
| Comparison run | `20261009T181051Z-4c5bfc` (harness `4179fa00`, see the [repeat postmortem](2026-10-09-status-badge-tone-repeat-postmortem.md)) |
| Harness source | `474ffa58` (Merge completed Plan 25), clean detached worktree `/home/app/ramify-status-badge-20261009-latest` |
| Evidence root | `/home/app/ramify-trial-evidence/status-badge-tone-plan25-20261009T193340Z/` (copy of the trial directory without `node_modules`, `real-session.log`, `metrics.json`) |
| Fixture baseline / final | `58ffecde` / `b999ea9a` |
| Model / pi / policies | `openai-codex/gpt-5.6-sol:high` / 0.87.1 / `kpi/1`, `scope-size/2`, `lineage/1` |
| Run interval (UTC) | 19:33:40.728–19:40:17.267; 396.5 s |
| Activity | 13 invocations, 13 prompt instances in 12 kinds, 11 sessions, 39 model calls, 143 tool calls |
| Recovery | None: no rejected submission, failed invocation, gate repair, degraded start, compaction or budget return |

## Timeline

| Offset (s) | Event |
| --- | --- |
| 0–13.5 | Intake (inv-0001, catalog-extractor) |
| 13.5–61.5 | Initial analysis (inv-0002): 1 entry capability, 0 hypotheses, 1 work item |
| 61.5–71.9 | Catalog check (inv-0003); analysis accepted |
| 71.9–81.7 | Readiness gate ga-0001 passed at attempt 1 |
| 84.0–93.5 | Scenarios materialized, wi-001 started, hypotheses delivered |
| 93.5–127.4 | Local orientation (inv-0004) |
| 127.4–133.7 | Context selection fork (inv-0005); package appended |
| 133.8–154.3 | Assignment continuation (inv-0006); iteration wi-001.i01 assigned at 156.3 |
| 162.6–267.7 | Engineer (inv-0007), both scenarios bound without fakes |
| 273.5–283.7 | Iteration gate ga-0002 passed; three reviews requested |
| 283.9–313.0 | Code review (inv-0008), scope review fork (inv-0009), design orientation (inv-0010) and design review fork (inv-0012), alongside the completion continuation (inv-0011) |
| 315.5–315.8 | Work-item gate ga-0003 passed; wi-001 completed |
| 318.4–380.6 | Non-functional assessment (inv-0013), round 1 satisfied |
| 383.1–396.4 | Final gate ga-0004 passed; run completed |

The completion request was accepted at 19:38:53.649, 24 ms after the code
reviewer's `submit_review` was accepted (19:38:53.625). The review attempt's
`finishedAt` of 19:38:53.742 is recorded after its session closed. The
procedure's rule that `request-completion` is refused while a review
requirement remains was therefore not violated. One delegated review had
read the order of the `finishedAt` field as a race; the raw transcripts
refute that.

## Prompt-kind coverage

Seven reviewers covered all 13 instances, each against its packet, native
first request, inherited history at its start point, transcript, submission
and outcome.

| Kind (package, procedure) | Instances | Start | Review | Highest severity |
| --- | --- | --- | --- | --- |
| Intake (catalog-extractor/1, intake) | inv-0001 | fresh | [catalog-extraction](2026-10-09-status-badge-tone-plan25-postmortem/reviews/catalog-extraction.md) | low |
| Catalog check (catalog-extractor/1, check) | inv-0003 | fresh | same | low |
| Initial analysis (initial-architect/3, main) | inv-0002 | fresh | [initial-analysis](2026-10-09-status-badge-tone-plan25-postmortem/reviews/initial-analysis.md) | low |
| Local orientation (local-architect/11, orientation) | inv-0004 | fresh | [local-orientation](2026-10-09-status-badge-tone-plan25-postmortem/reviews/local-orientation.md) | low |
| Context selection (context-selector/2, main) | inv-0005 | fork of inv-0004 | [context-selection](2026-10-09-status-badge-tone-plan25-postmortem/reviews/context-selection.md) | low |
| Assignment (local-architect/11, main) | inv-0006 | continued | [local-assignment-and-completion](2026-10-09-status-badge-tone-plan25-postmortem/reviews/local-assignment-and-completion.md) | low |
| Completion (local-architect/11, main inherited) | inv-0011 | continued | same | low |
| Engineering (engineer/8, main) | inv-0007 | fresh | [engineering](2026-10-09-status-badge-tone-plan25-postmortem/reviews/engineering.md) | low |
| Code review (reviewer/4, code) | inv-0008 | fresh | [code-review](2026-10-09-status-badge-tone-plan25-postmortem/reviews/code-review.md) | low |
| Scope review (reviewer/4, scope) | inv-0009 | fork of inv-0006 | [scope-review](2026-10-09-status-badge-tone-plan25-postmortem/reviews/scope-review.md) | low |
| Design orientation (reviewer/4, orientation) | inv-0010 | fresh | [design-orientation](2026-10-09-status-badge-tone-plan25-postmortem/reviews/design-orientation.md) | medium |
| Design review (reviewer/4, design) | inv-0012 | fork of inv-0010 | [design-review](2026-10-09-status-badge-tone-plan25-postmortem/reviews/design-review.md) | low–medium |
| Non-functional assessment (nonfunctional-coordinator/2, assessment) | inv-0013 | fresh | [nonfunctional-assessment](2026-10-09-status-badge-tone-plan25-postmortem/reviews/nonfunctional-assessment.md) | low |

Every reviewer found the required information delivered or obtainable through
a usable pointer, and found that each agent could identify its task and
complete its submission with its actual tools.

## Findings

Findings are ordered by observed impact and recurrence. A finding is observed
unless marked as a hypothesis.

### 1. Medium (recurrence): run-wide environment blocks reach roles that cannot use them

The finding affects all 13 invocations. The environment blocks account for
35,373 of the 246,321 appended bytes (14.4%, from the delivered-input
manifests). `environment:limits` (1,073–1,074 bytes, 10,736 in total) is sent
to every role, as the full run budget. `environment:supportPaths` names
harness-internal prompt files, for example
`subs/harness/src/nonfunctional/coordinator.system.md` in inv-0013, which do
not exist in the target project. `environment:views` advertises
`.ramify-architect` to reviewers whose snapshot tools refuse it, and inv-0006's
replacement `views` block drops the architect view its procedure tells it to
use. Null `candidate`, `snapshot` and `cucumberConfiguration` blocks are sent
to roles without candidates or scenarios. In the engineer's message, the
2,755-byte Cucumber configuration repeats the focused-command block.

The four reviewers that measured it put the unusable share at 2–3.4 KB per
invocation, or 12–19% of a first request. The cost is small: one uncached
first call per fresh session, about 4.3 bytes per token, and well under $0.01
per invocation. The declared-check pointers also caused the code reviewer to
read `ramify-audit.json` and `ramify-agent.json` (3.8 KB); its reasoning
summary reads "Inspecting config pointers". The initial architect's three
configuration reads coincide with the same block, but that link is a
correlation only.

The fix is to select environment blocks per role and task, so that roles
receive only the blocks their tools and decisions can use. `supportPaths`
should be dropped where the agent cannot resolve it. The
`limits` block should carry only the remaining value relevant to the
invocation. Validate the change by comparing first-request bytes per kind and
the counts of configuration reads on a repeat run.

### 2. Medium: the design orientation cannot spare its fork a re-read

This affects inv-0010 and inv-0012. The orientation summarized 12,350 bytes of
delivered design guidance in one call ($0.0249, 7.1 s). The fork's procedure
step 1 says "Reuse earlier understanding", but the guidance block says "If
this session has not read one… read it with snapshot_read before you judge",
and the grounding rule says that earlier conversation never counts as ground.
The design reviewer then re-read all three guidance READMEs (13,824 bytes),
following the "before you judge" wording. The orientation key includes the
work item, and this run had one design review, so no later review could have
reused it. This was off the critical path: the design review ended before the
code review and the completion did.

The fix is to decide which material the design reviewer may take as already
read. Either the orientation's summary, delivered as recorded and hashed
guidance, counts as ground, or the separate orientation call should be
skipped when only one design review is expected. Validate with a run that has
two or more iterations in one work item, where reuse can be measured.

### 3. Low (likely causal): the engineer prompt omits the API view's scope

This affects inv-0007. The capability system prompt
(`engineer-capability.system.md:81-104`) says to search the API view before
opening foreign source, but never says that packages and built-ins are
outside the view. Three greps of `src/tests/.ramify` and `src/tests/.ramify/external` looked for
`@cucumber/cucumber`, `react-dom/server`, `vitest` and `node:assert` and
returned "No matches found". The engineer's reasoning summary between them
reads "Inspecting test imports for API view". It then took the imports from
its own test file and from a 15.9 KB grep of `integration-tests` source. That
grep was 65% of the engineer's returned bytes. The scenario-binding section
gives support-file globs but no resolved step-file examples, which correlates
with the fourth empty search.

The fix is one sentence in the view section: the view covers the
project's Ramify application source; packages and built-ins are imported as
the module's existing files import them. Optionally, name an existing step
file and the support files that register the World. Validate by counting
empty view searches in the next engineer transcript.

### 4. Low: the plan arrives twice, and its own block arrives empty

This affects inv-0001, inv-0002 and inv-0003. The captured plan is delivered as one
`brief:requirements` bullet (1,644 bytes). The initial architect's `<plan>`
block then arrives empty, because `taskSupportSections` strips the duplicate
(`service.ts` 4874–4886). The initial architect re-read the live `plan.md`,
and both catalog-extractor procedures also require reading the captured file.
Deliver the plan in one place, preferably the plan block. The requirements
section can then point to it.

### 5. Low: placeholder task lines

The tasks of inv-0001, inv-0002, inv-0003 and inv-0013 read `Perform intake for
{}` and similar lines, from `JSON.stringify(request.work)` on an empty work
object at `service.ts:4786`. No agent was confused, but the line carries
nothing. When the work object is empty, render the task without the
`for` clause.

### 6. Low: coverage limits are reported only as counts

This affects inv-0002 and inv-0007. The briefing says "cut: 11; detailsUnavailable: 4"
without naming which records are affected. The initial architect grepped the
whole architect view with a guessed marker shape and got 9,579 bytes of noise
(27% of its returned bytes). The engineer read both `_meta.json` files and
gained nothing, because "Read its metadata for revision and coverage limits"
conflicts with "do not search for missing metadata". Name the affected modules or
records, or state that none touch the work item's modules.

### 7. Low: a test guarantee changed without anyone noticing

This affects inv-0007, inv-0008 and inv-0013. The engineer renamed both original badge tests and
added `tone="critical"` to the custom-label test. The label-without-tone
shape that `catalog-card` renders therefore no longer has its own unit test.
The default scenario still exercises a badge without a tone. The
non-functional assessment of nfr-004 says the existing tests kept "their
original guarantees" with no uncertainty, and the code reviewer did not raise
the change. Two delegated reviewers found it independently. The verdicts
still hold, because the original assertions remain valid. This is a semantic
judgment for the operator rather than a candidate for a harness rule. It does
suggest that the code-review procedure should ask explicitly whether edited
existing tests still cover their original cases.

### 8. Low: the scope reviewer's fork and its duplicated package

This affects inv-0009. The scope review forked from the local architect after the
assignment, appended the work-item package again (the same hash as the
inherited copy, about 3 KB uncached), and announced 12 withdrawal notices
(1,066 bytes) for the architect's still-current blocks. The notices are
correct; the duplicate package is not needed. The reviewer made one model turn
with no tool calls and credited all four paths from the delivered patches,
which its procedure allows. There is a design question for the operator, not
a defect: the fork makes the assignment's author its scope reviewer.

### 9. Low: smaller local-architect gaps

These affect inv-0004, inv-0005, inv-0006 and inv-0011; details are in the
local reviews. The selector's reasons and conditions are recorded but not
delivered. The package shows "Conditions: none recorded" from the catalog
instead. The completion continuation re-sent about 2.4 KB of blocks with no
new information, including an empty "Earlier outlines". The completion was
not told the review state before it submitted, so it relied on the harness
refusing an early completion. The orientation found its API interfaces by
grepping every view line (about 23 KB returned to read 6.9 KB of views),
because the view has no page index.

### No issue found

The reviewers found no issue with task identity, authority, write scope,
submission schemas, the focused scenario command, or fork and continuation
mechanics. Inactive inherited submission tools were never called after a
fork.

## Architect discovery

| Invocation | Discovery calls | Architect view | API view | Direct source/tests | Module docs | Unknown | View-first / source-first / fallback episodes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| inv-0002 initial architect | 11 | 11 (100%) | 0 | 0 | 0 | 0 | 3 / 0 / 0 |
| inv-0004 local orientation | 17 | 0 | 10 (58.8%) | 5 (29.4%) | 2 (11.8%) | 0 | 1 / 1 / 0 |
| inv-0006, inv-0011 | 0 discovery (inv-0011: 5 verification calls) | — | — | — | — | — | — |

The denominator is each invocation's architecture-discovery calls. Calls for
implementation detail, configuration and verification are excluded. The
initial architect's view lookups answered the owner and consumer questions
directly; their facts went into the entry's citations. The local architect's
single source-first episode was a focused project grep for `StatusBadge`
callers and the stylesheet. The architect view could have named the callers,
which the module README already listed, but not their call shapes or the
CSS. The grep was not avoidable rediscovery.

## Engineer capability use

| Need | Scope | Source of information | Outcome |
| --- | --- | --- | --- |
| C1 `ReviewStatus` type | API view (ordinary) | Existing import in the module's own file | Used correctly; no view page read |
| C2 status values in steps | API view (testing) | Module's own `StatusBadgeProps` | Used correctly |
| C3 `@cucumber/cucumber` | Outside the view | `integration-tests` source grep | Used correctly after empty view search |
| C4 `react-dom/server` | Outside the view | Module's own test file | Used correctly after empty view search |
| C5 `node:assert/strict` | Outside the view | `integration-tests` source grep | Used correctly after empty view search |
| C6 runner World and hooks | Outside the view (foreign testing source) | `integration-tests` source grep | Avoided importing the unlisted `CollectionReviewWorld`; typed `this` locally |

There were six needs. None was used incorrectly, left unresolved or unknown,
and no new-capability request was submitted or warranted. All six were
verified by focused runs and gate ga-0002. The view supplied what was in its
scope; the extra discovery is finding 3.

## Metrics

Usage reconciles: the per-call usage observations sum to the invocation
totals of 168,422 new input, 406,016 cache-read, 0 cache-write and 17,538
output tokens. The estimated cost is $1.187 from recorded rates
(`pi-ai@0.87.1` model runtime, $4/M new input, $0.40/M cached input, $20/M
output). The largest contributors were the engineer ($0.249, 103 s, 9
calls), the initial architect ($0.141) and the non-functional assessment
($0.144, 62 s). The review phase ran four sessions concurrently between 284 s
and 313 s, so per-invocation times are not summed into wall time. Harness
time between invocations was short: the three model-free gates took 10 s,
10 s and 13 s, the work-item gate 0.3 s, and work-item setup 9.5 s.

Exploration recorded 79 reads, 42 searches, 198,581 returned bytes and
25.4 s of tool time. It also recorded 4 repeated reads, 5 broad searches and
3 searches outside the write scope. The pi `grep` "No matches found" results
(4, all in inv-0007) are not counted in `zeroMatchSearches`, which recorded 0.
Search observations do not report scanned bytes or matched files.

`lineage/1` defines fork generations by the global architect's context
generation. Its fork metrics are therefore "not applicable" in this run, and
the three local forks that did occur (inv-0005, inv-0009, inv-0012) appear in
no lineage metric. Their first-call reuse below had to be derived from raw
observations. If local-fork cost is a recurring question, add local-fork
segments to the lineage policy.

### Comparison with the previous repeat

The comparison run used the same plan, model, pi version and policies on
harness `4179fa00`, before Plan 25 and the reviews-module delivery. Both are
single runs, so the differences are descriptive and do not establish causes.

| Measure | Repeat `4c5bfc` | This run |
| --- | --- | --- |
| Wall time | 405.4 s | 396.5 s |
| Model calls | 51 | 39 |
| New input / cache-read / output tokens | 153,410 / 593,408 / 17,735 | 168,422 / 406,016 / 17,538 |
| Estimated cost | $1.206 | $1.187 |
| Tool calls | 154 | 143 |
| Scope review | 6 calls, $0.137, 30 s | 1 call, $0.056, 8 s |
| Completion task bytes | 14,373 | 7,737 |
| Engineer | 9 calls, $0.170, 76 s, task 21,351 B | 9 calls, $0.249, 103 s, task 26,665 B |
| Code review | 3 calls, $0.074 | 5 calls, $0.118 |

Fewer calls and much smaller cache reads left the cost almost unchanged,
because new input rose. The engineer's larger task message and doubled output
are the largest single increase. Finding 1 accounts for part of the message
growth, but this comparison cannot attribute the extra output or time.

## Cache reuse at session boundaries

| Child | Kind | Mode | Parent last request (new + cached) | First call after the boundary: new / cached | Cached share of first call | Cached share of parent prompt | Prefix preserved | Gap |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| inv-0005 | context selection | fork | inv-0004: 17,386 | 2,291 / 17,280 | 88.3% | 99.4% | yes | 6.4 s |
| inv-0006 | assignment | continued | inv-0004: 17,386 | 8,897 / 17,280 | 66.0% | 99.4% | yes | 24.8 s |
| inv-0009 | scope review | fork | inv-0006: 26,177 | 9,528 / 25,984 | 73.2% | 99.3% | yes | 140 s |
| inv-0011 | completion | continued | inv-0006: 26,177 | 3,375 / 25,984 | 88.5% | 99.3% | yes | 149 s |
| inv-0012 | design review | fork | inv-0010: 4,975 | 6,588 / 4,864 | 42.5% | 97.8% | yes | 5 s |

"Prefix preserved" means that the provider instructions, tools,
`prompt_cache_key` and the parent's full input array were identical at the
start of the child's first request. The cached share of the parent prompt is
the first call's cache read divided by the parent's last request input
(new plus cached). It shows that every boundary reused essentially the whole
inherited prefix. The new input on each first call is the appended task,
whose size the prompt findings address. Inv-0009's 9,528 uncached tokens
exceed the fresh code reviewer's whole first request, mostly because of the
duplicated package (finding 8) and environment blocks (finding 1).

Within sessions, every follow-up request also preserved its prefix. Three
nevertheless read nothing from cache: inv-0001 call 2, inv-0003 call 2 and
inv-0004 call 3 (13,276 new tokens). The previous repeat had cache hits on
the first two. The cause cannot be determined from the retained requests and
is presumably on the provider side. Pricing the previous request's prompt at
the cached rather than the new rate, the misses cost about $0.06.

## Evidence gaps

- The run-time materialized views were not retained. The project copy holds
  post-run revisions; for example, the architect view is revision `:11`
  against `:1` at run time. View findings rely on file times, revision
  identities and post-run content.
- Reasoning is retained only as encrypted items and short summaries, so
  motives are inferred from summaries and call order.
- Per-block token figures are byte-ratio estimates (about 4.2–4.4 bytes per
  token from measured first calls), not tokenizer counts.
- Search observations lack scanned bytes and matched files, and the empty pi
  `grep` results are not counted as zero-match searches.
- Several paths were not exercised: reuse of one design orientation across
  reviews, correction paths in the catalog check, CheckFindings, and calls to
  inactive inherited tools.
- The display transcript's `systemPrompt` label for forked reviewer sessions
  names the reviewer role, while the provider received the architect's
  instructions with the reviewer role as an appended developer message. Only
  the native request shows this.

## Suggested next steps

1. Select environment blocks per role and task (finding 1), and validate by
   comparing first-request bytes per kind and configuration reads on a repeat.
2. Resolve the design reviewer's ground rule for orientation-delivered
   guidance, or skip orientation for a single review (finding 2). Validate on
   a plan with two iterations.
3. Add the API-view scope sentence to the engineer prompt (finding 3), and
   count empty view searches on the next run.
4. Deliver the plan once and drop the empty `for {}` clause (findings 4–5).
5. Name the records behind coverage limits (finding 6).
6. Consider retaining the run-time view revision listing, counting pi's empty
   `grep` results as zero-match searches, and adding local forks to the
   lineage metrics, so that the next postmortem can measure these directly.
