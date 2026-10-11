# Scope-review prompt review

The scope reviewer received the fixed assignment, its exact parent context and
the frozen candidate needed for a complete review. It inspected all four changed
patches and the candidate plan, then returned no concerns on its first
submission. The clearest improvement is to remove the redundant changed-path
lookup and encourage batching independent snapshot inspections. The fork retains
substantial obsolete orientation/assignment machinery; any reduction should be
measured against its cache benefit rather than assumed cheaper.

## Coverage and evidence

Covered kind **reviewer / scope**, its only observed instance `inv-0009`, operation
`inv-0009`, review `rq-0002`, work item `wi-001`, iteration `wi-001.i01`, display
session `ses-0008`, provider session
`94636d11-acf8-4219-932c-3f94fcdace1f`. Requested and actual start were fork.
The source is parent `ses-0004`, invocation `inv-0006`, provider session
`f6dc3e74-3857-443b-886b-e1b9244b9aaf`, turn 2, checkpoint
`32f2345f-86f3-4054-931a-1971872678bc`. Later parent invocation `inv-0010` is
outside that point and was not available to the child.

Evidence labels:

- **C:** [operation packet](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/.harness/session-operations/correlations/operations/00959ba1b4e3c20e9adfea496c9b99c4f3d235e30ab7f97ae02811cfdf2a97f4.json), including source, context/history, additions, task declarations and policy.
- **T:** [ses-0008 transcript](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/status-badge-tone/.harness/jobs/20261009T132856Z-07ccc4/transcripts/ses-0008.jsonl), referenced by JSONL `n` fields and with blobs resolved.
- **N:** [first native request](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/.harness/session-operations/store/payloads/d2133c0e53cf03b0e817e1571b74f498f8d404c887ac40224c4aeaa4b27646d3), recorded at [session-ledger.jsonl:379](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/.harness/session-operations/store/session-ledger.jsonl:379).
- **M:** [measurements.json](/ramify/ramify-agent/docs/analysis/2026-10-09-status-badge-tone-postmortem/measurements.json), inventory entry inv-0009 indexes all eleven raw native requests; inv-0006 indexes the parent requests used for exact prefix comparison.
- **A:** [fixed assignment](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/status-badge-tone/.harness/jobs/20261009T132856Z-07ccc4/work-items/wi-001/iterations/01/assignment.json).
- **S:** [submission](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/status-badge-tone/.harness/jobs/20261009T132856Z-07ccc4/invocations/inv-0009/submission.json).
- **O:** [outcome](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/status-badge-tone/.harness/jobs/20261009T132856Z-07ccc4/invocations/inv-0009/outcome.json).
- **OBS:** [observations](/home/app/ramify-trial-evidence/status-badge-tone-20261009/collection-review/plans/status-badge-tone/.harness/jobs/20261009T132856Z-07ccc4/invocations/inv-0009/observations.jsonl).

The candidate is `afef5487213d7c2729e95e4e5956e6bb30059390`, tree
`2a89ca2d463c9ed79ef5d1e5898111d18d807d14`, gate `ga-0002`, base
`44a1f25d246a9ca2609654ca274002acdbbd90ad`. C's current message is 13,915
UTF-8 bytes. The role addition is 2,546 bytes. Captured fixed goal, approach,
completion evidence and scope rationale agree with A; the reviewer also inherits
the accepted assignment submission at exactly the source point.

## What the fork actually delivered

N contains 91 initial provider input items. Its first 84 items exactly equal the
parent inv-0006 last native request's input array. They include the orientation
task, its source/API discovery and accepted outline; the supplied context-selector
packet; the assignment task; and the parent's current-state check. Items 84-86
then contain the parent's final reasoning, `submit_work_item_result` assignment
call and accepted tool result. Thus the child receives the actual assignment
handback, including exact scope and constraints, rather than a later parent
assessment or the engineer's unverified description.

Items 87-90 append the current reviewer role, additional snapshot tool
declarations, an active-tool instruction and the scope task. N's final user text
exactly equals C's message. The source native `instructions` and global `tools`
are preserved unchanged across the parent boundary and all eleven child
requests. Those global tools are read, grep, ls and submit_work_orientation;
they do **not** establish the current active handlers. N item 88 declares
snapshot_list/read/search/diff and submit_review, while item 89 explicitly says:

> Active tools: snapshot_list, snapshot_read, snapshot_search, snapshot_diff, submit_review. Inactive historical tools must not be called.

C's declarations expose precisely those five tools, its authority is
`writer: false` with no write scope, and its validator/destination are
submit_review for inv-0009. Actual calls all use current snapshot handlers and
submit_review successfully. This role transition is usable; preserved historical
declarations are not evidence the reviewer could use live-source tools or submit
a new architect assignment.

The source baseline says “You are the local architect” and the appended current
role says “You review iterations.” The latest active-tool message and current
task make the transition explicit. No observed role confusion, live-source call,
architect submission, unavailable-tool error or stale-candidate judgment occurred.
The current prompt also marks twelve obsolete briefing sections as no longer
applicable, reducing ambiguity while retaining their bytes in history.

## Required-information assessment

| Need at delivery | Assessment |
| --- | --- |
| Objective and fixed intent | Met directly and inherited: fixed optional-tone goal/approach and completion evidence, all cited plan elements and no deviations, parent assignment submission before fork point. |
| Candidate/current state | Met: exact commit/tree/base, passed gate, canonical changed paths and harness attribution for both feature-tag edits. |
| Scope | Met: write-scope rationale and inherited assignment scope; no children/nested projects/guarded changes needed. Current scope reviewer has no authority to change the assignment. |
| Authority and tools | Met through current role/tool additions plus explicit active-tool list and policy. Historical tools are inactive. Concern risk/grounding rules and architect ownership are clear. |
| Plan grounding | Met: explicit candidate plan path and snapshot_read tool. T n=14 reads the actual plan before submission. |
| Verification expectations | Met: inspect candidate for requested/missing/extra behavior; no rerun is permitted or required. Current declared checks/configuration pointers are available and five candidate documents are read. |
| Submission/completeness | Met: submit_review schema, all changed paths once inspected or missing, grounded concerns only through actual file reads. All four paths covered and first submission accepted. |
| Historical materialized views | Available as parent discovery context but not current review tools. Current role explicitly refuses generated views; source patch/plan inspection is valid review verification, not architect discovery. |

The serialized request retains the same durable assignment-record path seen in
the code-review prompt; it is not a candidate snapshot file. Here no read of that
path occurred and the actual assignment was already inherited/pasted. It remains
a minor metadata cleanup opportunity, without observed impact in inv-0009.

## Observed review and metrics

The child makes five snapshot_diff calls (one pathless list followed by the four
changed patches), five snapshot_read calls (plan, audit definition, agent config,
package and Cucumber config), then submit_review. All eleven calls succeed and
each occupies a separate model/tool turn (T n=3-25). Every changed path appears
once in `inspected`; no missing paths or concerns are submitted (S). The changed
component, tests, harness feature tags and real-component step implementation
are all inspected through their patches. Unlike the code review, the scope task
does not need a full read of each changed file when the patch shows enough;
patch-only coverage is explicitly permitted.

The eleven tool-result bodies return 15,421 UTF-8 bytes including snapshot line
numbers and submission acknowledgement. This is raw returned output, not scanned
source bytes or provider tokens. M again reports all exploration read/search/
returned-byte totals as zero, although snapshot evidence shows five full-file
reads and five diff calls. The snapshot coverage issue is the same measurement
finding documented in the code-review report; it must not become a claim that
the scope reviewer did not inspect the candidate.

The first post-fork model call records 20,569 new input tokens and 6,656
cache-read tokens, a measured cache-read share of **24.448%** of new-plus-cached
input, with 77 output tokens (OBS n=2). Whole-invocation totals are 27,061 new
input, 297,344 cache reads and 794 output over 36,632 ms (O). Later calls have
warmed substantial child context; that aggregate cannot replace first-post-fork
reuse. Native instructions/global-tool identity and inherited-prefix preservation
are proven, but they do not explain every uncached token or guarantee cache hits.

## Findings

### SR-01 — Low: redundant changed-path lookup despite the supplied canonical list

**Affected:** inv-0009, C generic review briefing versus scope procedure and T
n=3-4. **Expected:** use the provided canonical changed list and immediately read
its four patches. The current procedure says “Use the supplied canonical
changed-path list; if unavailable, list paths once with `snapshot_diff`.”
**Observed:** the generic briefing says “Read snapshot_diff first”; the reviewer
calls `snapshot_diff {}` and receives exactly the four paths already pasted.

**Impact/confidence:** high confidence in one redundant tool/model turn. The
procedure already supplies a usable resolution; no harmful review omission or
incorrect result followed. The code reviewer correctly went directly to per-path
diffs under similar guidance, so this is not a necessary cost of the tools.
**Correction:** align generic wording with the current procedure: read patches
for supplied paths; list paths only if absent. Do not weaken candidate coverage
or hide harness-produced edits. Record whether the extra discovery/model turn
disappears in a focused comparison.

### SR-02 — Low: independent snapshot inspections are serialized across ten model turns

**Affected:** inv-0009, actual task execution T n=3-22 and eleven native requests.
**Expected improvement:** batch independent per-path patches and requested
configuration/plan reads when their inputs are already known. **Observed:** one
tool is called per assistant model response, even for the four supplied patches
and four supplied configuration pointers. All retained native requests permit
`parallel_tool_calls: true`. No result-dependent path selection is needed for
those fixed inputs.

**Impact/confidence:** high confidence in serial execution and opportunities to
batch known paths; only a potential latency/input-cost improvement is supported.
There is no controlled proof that the prompt caused serialization, or that
parallel submission of the dynamically added snapshot tools would improve this
run. **Correction:** add concise procedure guidance to group independent patch
reads, then group required known candidate documents. Validate transport/tool
support for such calls and measure model-call count, latency and charges without
reducing scope coverage. Do not turn batching into a completeness heuristic.

### SR-03 — Low: preserved history contains obsolete machinery far beyond the fixed scope intent

**Affected:** inv-0009's inherited provider prefix. **Expected assessment:** retain
the exact fixed assignment and useful discovery while identifying content that
is irrelevant to this scope review. **Observed:** the initial orientation user
message alone is 15,947 UTF-8 bytes, and the inherited architect additional-tools
block at N item 76 serializes to 20,525 UTF-8 bytes using compact JSON, mainly a
large submit_work_item_result schema. The parent's assignment user task is
11,080 text bytes. Old capability-registry, placement, hypotheses and engineer-
bound sections remain physically present despite twelve current invalidation
messages. They support the original architect workflow rather than new scope
judgment; the accepted assignment handback/current scope brief already state
the settled choice.

**Impact/confidence:** high confidence in retained obsolete machinery, moderate
confidence about a narrower equivalent context. These sizes identify specific
material, not an all-removable total; they are neither provider tokens nor
estimated savings. History also supplies useful ownership/current-state evidence
and a cacheable parent prefix. **Correction:** investigate a scope-review fork
point or compact review-specific context that preserves assignment decisions,
citations, goal/approach and no-later-parent-turn semantics while omitting
orientation exploration and obsolete schemas. Compare measured first-call cache
reuse and total charges against the current preserved fork. A shorter fresh
prompt is not proven cheaper than this cached history.

## No-issue results and limits

No essential requirement, current tool declaration, candidate identity or
submission information was missing. No role-transition failure, write attempt,
test/provider call, concern-grounding rejection or rejected submission occurred.
The report of no concerns is a valid complete scope review, rather than proof
from the harness that the plan is semantically complete. The responsible
architect owns subsequent completion judgment.

The exact parent request prefix plus final accepted assignment are verified from
raw native evidence, and all eleven child requests retain the preserved baseline.
Provider-internal tokenization/cache behavior remains unobserved beyond recorded
usage. Prompt verbosity, redundant lookup and serial inspection coincide with
the observed request count, but a new comparison is required to quantify the
effect of the suggested changes. This retrospective performed no new execution,
tests, provider calls or evidence mutations.
