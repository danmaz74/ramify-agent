---
name: ramify-agent-postmortem
description: Analyze a plan implementation run made with ramify-agent to identify improvements in delivered pi prompts, materialized architect and API views, collected run metrics, and LLM cache reuse during continuation and the first call after a fork. Use for retrospective run analysis, rather than implementation or live workflow recovery.
---

# ramify-agent postmortem

Explain how a plan implementation went and what would improve the next run.
Ground findings in the selected run's retained evidence. Cover prompt adequacy
and excess, materialized-view effectiveness, collected metrics, and caching on
continuations and forks.
This is an analysis workflow; implementation changes or new paid pi trials
require a request covering that work.

## Establish the run and its goals

Identify the target project, plan, run ID, execution checkout and recorded
ramify-agent/pi revisions. Resolve ambiguous run selection before attributing
findings. Read the applicable project instructions and the captured plan,
accepted clarifications and decisions. Use the versions available during the
run; current source and later plans can explain improvements but cannot prove
what the run delivered.

Read [evidence discovery](references/evidence.md) to locate run records, task
packets, transcripts, metrics definitions and session lineage. Inventory what
is available and what is missing. Preserve source artifacts and existing work.
Do not repair run state or restart execution as part of a postmortem.

Build a short timeline connecting plan goals, work items, invocations,
submissions, reviews, audit results, retries and the final recorded outcome.
Distinguish agent declarations, automated verification and the responsible
architect's semantic acceptance. A passing audit establishes the configured
test suite's health; it does not itself establish plan completion.

## Inventory the prompts actually delivered

Discover prompt kinds from this run. Group by role and task/procedure, splitting
materially different prompt or tool variants. Include initial tasks,
continuations, forks, reviews, repair/retry tasks and harness-appended messages
when present. Do not treat the current template catalog as the list of prompts
sent during the run.

For every instance, correlate invocation/session/operation IDs, task goal,
requested and actual start, parent point, delivered system instructions,
user/task messages, tool declarations and submission contract. Resolve transcript
body references. Include inherited history only through the recorded continuation
or fork point; later parent turns were not available to the child. Track each
instance's evidence coverage, including prompts that cannot be reconstructed.

Separate captured delivered bytes, reconstruction from the recorded revision,
and assumptions. Template source alone cannot verify actual delivery. A display
transcript may omit provider transformations or tools; record that limit.

## Delegate prompt analysis by kind

Use subagents to review **every observed prompt kind**. Give each subagent one
kind and its variants; large groups can be split into disjoint invocation sets.
Bound concurrency to available slots and queue remaining groups. Each instance
must be covered; summaries may group identical prompts while still checking
their different task inputs and inherited context. Do not silently substitute
a sample for full coverage. If delegation is unavailable, disclose the limitation
and which reviews were performed directly.

Provide reviewers the captured goals and instructions, exact delivered prompts,
inherited context at the relevant point, available tools and paths, and subsequent
actions/submissions. Give artifact locations and IDs rather than an entire run
dump. Ask for an independent assessment without supplying suspected findings.
Reviewers analyze evidence and return results to the parent; they do not edit
the implementation or run records.

Each reviewer should answer:

- **Required information:** What did this task need at this point: objective,
  relevant plan constraints, authority and write scope, current state, dependencies,
  execution location, verification expectations and expected submission? Which
  needs were met directly, inherited, or obtainable through a clear pointer and
  available tool? Which were missing, contradictory, stale or inaccessible?
- **Usable instructions:** Could the agent identify the task and complete its
  submission with its actual tools? Look for unresolved placeholders, wrong
  paths/cwd, unavailable tools, mismatched schemas, obsolete instructions and
  conflicts between inherited and current task guidance.
- **Extraneous information:** Which specific sections, duplicated material or
  inherited history did not support this task? Explain why removal, a narrower
  selection or a pointer would preserve required information. Estimate size in
  bytes or measured tokens, naming the method; do not equate characters with
  provider tokens. Retained cacheable instructions can be useful even when
  repeated, so assess relevance separately from cache cost.
- **Observed effect:** Did omissions or excess coincide with clarification,
  repeated discovery, tool errors, wrong submissions, repairs or task failure?
  Cite the sequence, distinguish causal evidence from correlation, and assess
  adequacy at delivery time before using later behavior to explain impact.

Necessary information need not all be pasted into the prompt. Expected project
discovery through an actionable pointer is different from information the agent
could not obtain. Likewise, success alone does not prove the prompt was adequate,
and length alone does not prove excess.

Require each reviewer to return the kind/variants and all covered IDs, a compact
required-information assessment, findings with excerpts and locations, observed
effects, concrete correction suggestions, and evidence gaps. Explicitly record
when no issue was found. The parent reconciles overlapping or conflicting
findings against the raw artifacts and checks the inventory for unreviewed kinds
or instances.

## Evaluate materialized-view effectiveness

Assess both whether agents used the views and whether the available information
helped them complete their tasks. Correlate prompts, inherited context, tool
arguments/results and subsequent decisions. A view read shows access; evidence
of a resulting decision or correct API use supports usefulness. Information
delivered in a task packet or inherited history can be used without a new read.

First establish which architect/API views were available to each role at each
point, their revision/input identities, and materialization failures, stale
content, coverage limits or truncated details. Separate missing or insufficient
views from agent failure to discover or use an adequate view. Current generated
files do not establish what was available during a historical run.

### Architects: views versus direct codebase discovery

Identify architecture-discovery episodes: finding existing behavior, its owner,
relationships or a suitable placement. Classify their reads/searches by target:
architect view, consumer API view, direct source/tests, other documentation,
mixed or unknown. Resolve cwd, paths, globs and ignored-directory behavior from
actual commands; a recursive source search does not implicitly search the
hidden generated views. Keep architecture discovery separate from later source
inspection for implementation detail or verification.

Report counts and shares of classified discovery calls by role/task, with the
denominator and unknown/mixed calls explicit. Include unique targets, repeated
searches, returned bytes and observed time where collected. Also report episode
counts for view-first discovery, direct-source-first discovery, and source
fallback after a view lookup. Avoid classifying an entire mixed call as view use.

For source-first or fallback episodes, determine whether the relevant available
view could answer the question, why the agent searched source, and the result.
Distinguish a useful focused follow-up from avoidable broad rediscovery. Cite
examples of successful discovery, missed behavior/owners, unnecessary exploration,
or view shortcomings. Usage shares alone do not establish effectiveness.

### Engineers: using foreign capabilities through API views

Inventory each need to use a capability outside the engineer's module, including
attempts that ended in a new-capability request or failure. For each need, trace
the question through available API documentation, lookup or delivered context,
selected symbol/provider, import and call, and observed verification/handback.
Use the consuming source area's API view: ordinary and testing views are
independent, and the architect view cannot establish consumer importability.
Dependencies outside the API view's documented scope remain separate.

Assess whether the view supplied usable signatures, companion types, behavioral
documentation and import guidance for the actual consumer file. Did the engineer
find and correctly apply that information, need provider-source inspection,
guess an API, choose an unavailable/type-only symbol for a value use, or request
a capability already available? If nothing suitable was available, assess
whether the view supported the correct handoff rather than treating that as a
failed lookup. Coverage limits mean absence cannot prove no API exists.

Report capability-need counts and outcomes: use supported by view information,
additional source discovery, incorrect use, unresolved need and unknown evidence.
Define denominators, show overlapping outcomes explicitly and retain IDs and
examples. Distinguish information supplied, consulted, applied and successfully
verified; do not infer these stages from a view-read count or a passing whole-run
audit. Include needs where no view was consulted, and mark no relevant needs as
not applicable.

Connect view findings to prompt reviewers' context assessments and exploration
metrics. Recommend changes to discovery instructions, delivery/materialization,
view content or source-follow-up guidance according to the observed cause.
Preserve role authority and view scope rather than optimizing for a target
view-usage percentage.

## Analyze collected metrics

Inventory the metrics actually collected and their policy/schema versions.
Use the recorded definitions and units. Distinguish implemented observations
from proposed measurements; do not require fields absent from an older run.
Check coverage, unavailable values and known subtotals before interpreting totals.

Analyze run totals and distributions by role/task kind, work item, session start
mode and successful/failed/retried outcome where evidence supports those groups.
Explain the largest contributors and outliers, relating them to the timeline
and prompt findings. Include these dimensions when collected:

- Input, cache-read, cache-write and output usage; provider charges and estimates
  from recorded rates, with their provenance kept distinct.
- Wall time, model/tool/check time, milestone delays and waits; concurrent
  durations must not be summed and presented as run wall time.
- Tool calls, reads, unique/repeated files, searches, broad/outside-scope searches,
  zero-match searches and returned bytes. Returned bytes are not scanned bytes.
- Continuations, forks, fresh starts/fallbacks, retries, repairs, lost context,
  compactions and budget returns, preserving their recorded distinctions.
- Existing scope/change/efficiency measures, using their defined denominators
  and attribution limits. Change size does not establish task difficulty or
  implementation quality.

Reconcile aggregates with underlying observations where possible. Deduplicate
replayed/inherited records by their original identity; inherited history is not
a new billable call. Do not add per-call usage to invocation totals for the same
calls. Unknown values remain unknown, and zero denominators remain explicit.

Evaluate the usefulness of the collection itself: which questions it answers,
which metrics mislead or overlap, and which specific missing observations prevent
a conclusion. Propose additional collection only for a concrete unanswered
question. Compare runs only when goals, scope, models, policies and coverage are
sufficiently comparable; state differences and limits.

## Analyze cache reuse at session boundaries

Use actual operations and provider usage, not the requested mode or a `fork`
label alone. Continuing history and reusing provider prompt cache are separate
observations. Determine the provider/model and the run's usage-field semantics
before calculating uncached input or cache ratios. Categories may overlap; use
an explicitly justified denominator rather than assuming they are additive.

Examine every continuation boundary and every fork's **first model request
after the fork**, before later tool turns can warm the child's cache. Report
that first-call measurement separately from the whole invocation/session total.
If only aggregate usage exists, first-call cache reuse is unknown.

For each boundary, correlate source point, last relevant parent request,
first child/continued request, timestamps, model/provider, system instructions,
ordered tool declarations and inherited messages. Compare the effective provider
prefix when retained request evidence permits it. Otherwise describe the
reconstruction and what cannot be verified. Inspect prompt/tool replacement,
ordering changes, rewritten or duplicated history, compaction, fresh fallback,
and appended task material as possible explanations for lost reuse.

Keep cache eligibility, measured cache hits and explanations distinct. Even a
preserved prefix does not guarantee a hit; expiry, provider behavior or missing
request evidence can leave the reason unknown. Cite the run's retained settings
or authoritative provider documentation when needed rather than inventing cache
lifetimes or thresholds.

Summarize boundary counts and measured coverage by task kind/start mode, showing
first-call new input, cache reads/writes, output, valid cache ratios and charges
where available. Include both good reuse and missed opportunities. Use recorded
rates for historical cost; label estimated savings and the counterfactual.
Do not claim a shorter fresh prompt is cheaper than cached inherited context
without an appropriate comparison.

## Produce an actionable postmortem

Write the report to the requested destination; otherwise use the target
ramify-agent checkout's `docs/analysis/` with a date and plan/run identifier.
Keep delegated artifacts in a distinct postmortem directory, outside the run's
authoritative records, when useful for traceability.

Lead with the recorded outcome and the improvements supported by evidence.
Include a prompt-kind coverage table, architect discovery counts/shares and
engineer capability-use outcomes, metrics findings, a cache-boundary table with
a dedicated first-post-fork-call column, and explicit evidence gaps.
For each finding record severity, affected role/task and IDs, artifact location
and excerpt, expected goal, observed mismatch, impact/confidence and correction
direction. Separate observed findings, hypotheses and potential improvements.

Prioritize corrections by observed impact and recurrence. Suggest concrete
prompt changes or context selections, materialized-view improvements, metric
corrections, session/prefix changes, and the focused comparison or measurement
that would validate each improvement.
Preserve relevant instructions and submission contracts when proposing removals.
Do not convert retrospective semantic judgments into harness heuristics or
automatic task-completion decisions. Analysis does not itself demonstrate that
a proposed change improves a later run.
