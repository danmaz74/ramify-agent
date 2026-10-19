# Harness decomposition proposal and evaluation

**Date:** 2026-10-19. **Status:** proposed architecture and evaluation approach;
implementation has not started under this proposal.

The [assisted implementation plan](../../plans/harness-decomposition/plan.md)
turns these responsibilities and evaluation requirements into implementation
outcomes, acceptance and a proposed iteration sequence.

Separate assisted assessment and autonomous implementation into distinct workflow
owners. Extract shared session persistence and task execution. Within autonomous
implementation, separate planning, work coordination and acceptance while retaining
one authority for accepted run transitions.

The intended benefit is that an engineer can change one responsibility with less
unrelated orientation and less integration work. Module count, smaller files and
smaller declared scopes are supporting observations, not evidence of that benefit.
The initial measurements favor extracting session persistence and assistance first.
They also show that moving existing directories alone would preserve substantial
coupling in the autonomous workflow.

This proposal follows the [harness principles](../harness.principles.md), adopted
[recovery principles](../harness-recovery.principles.md), and
[measurement principles](../metrics/measurement-principles.md). The
[assistance direction](agent-assistance/approach.principles.md) supplies the reason
for making shared facilities independently useful; its proposed status remains
unchanged. The [assisted iteration records plan](../../plans/assisted-iteration-records/plan.md)
describes a feature, not this ownership migration.

## Proposed owners

```text
harness                         Application composition and public facade
├── assistance                  Native-agent workflow and assessment lifecycle
├── autonomous                  Autonomous run lifecycle and coordination
│   ├── planning                Plan interpretation and accepted initial analysis
│   ├── work-coordination       Placement, assignments and capability delegation
│   └── acceptance              Gates, reconciliation and completion
├── task-execution              Executing and observing one prepared agent task
├── session-store               Durable session records and payloads
└── existing children           Agent, evidence, ledger, audit, reviews,
                                check-findings, projections, KPI, scenarios,
                                plan-evidence, nonfunctional rules, recovery
```

These are responsibility boundaries. The file allocation used for measurement
below is an initial approximation, with mixed responsibilities explicitly left
unresolved. Creating the complete tree in one mechanical move is not the proposed
implementation strategy.

| Owner | Responsibility | Principal boundary |
| --- | --- | --- |
| Harness | Application composition, project ownership and common configuration, public entry points and browser-safe protocol facade. | Construct services; expose their supported contracts to callers. |
| Assistance | Plan registration, iteration records, assessment admission and stages, finding follow-up, protected-change acceptance, reconnect/resume behavior, and its MCP adapter. | Registered plan and candidate request → durable assessment and compact outcome. |
| Autonomous | Run admission, stop/resume, ordering of planning, work and acceptance, and authoritative commit of accepted workflow transitions. | User command or completed activity → next authorized activity and committed run state. |
| Planning | Intake, extraction, validation and accepted initial analysis, including the hypothesis, registry and initial scenarios. | Captured plan inputs → accepted analysis or unresolved questions. |
| Work coordination | Placement, frontier scheduling, assignment construction, contract obligations, capability delegation and consumer/provider handback. | Committed work and results → next assignment or coordination decision. |
| Acceptance | Candidate qualification, review settlement, reconciliation, obligation satisfaction and completion eligibility. | Candidate, requirements and evidence → assessment and proposed accepted transitions. |
| Task execution | Equipment binding, submission handling, cancellation and settlement, transcripts, observations, session reuse and ordinary fresh-session fallback. | Prepared task and supplied authority → observed execution result. |
| Session store | Durable session records, immutable payloads, validation and reconstruction through the ledger. | Session-store operations → retained session history with explicit availability. |

### Assistance

Keep [service](../../subs/harness/src/assistance/service.ts),
[store](../../subs/harness/src/assistance/store.ts),
[assessment](../../subs/harness/src/assistance/assessment.ts), protection and finding
adapters, and the thin MCP transport in one child initially. Admission, retries,
checkpointing and completion share a durable lifecycle. Splitting these files into
separate modules would add interfaces across the same transitions.

The assessor continues to compose audit, review, findings and evidence providers.
It owns assisted assessment policy. Autonomous acceptance owns its own policy;
similar mechanics do not establish an identical lifecycle. Move a shared helper
only when both callers can describe the same behavior through a small contract.

### Session persistence and task execution

[Session persistence](../../subs/harness/src/run/session-store.ts) already serves
assisted assessment, autonomous session operations, Beads administration and
qualification. Its durable records are distinct from accepted workflow state.
The neutral agent module continues receiving its `SessionStore` interface; it
does not acquire harness persistence policy.

[InvocationRunner](../../subs/harness/src/steps/runner.ts) already serves managed
runs, manual steps and standalone sessions. Use that shared behavior as the
starting point for task execution. Narrow `RunnerRun`, `RunnerHost` and task inputs
before extraction. Role-specific prompt prose, task construction and semantic
acceptance stay with the workflow that defines them. Generic delivery, recording
and session mechanics can move. The seed allocation includes
[HarnessSessionOperations](../../subs/harness/src/run/session-operations.ts), but
its task-policy and effect-handling details require separation before the whole
file can belong to a neutral execution owner.

### Autonomous coordination and acceptance

The [current autonomous implementation design](autonomous-implementation-loop.md)
provides the behavioral starting point. Its initial hypothesis formation maps to
planning; module work items, placement and capability coordination map to work
coordination; real verification, return and testing gates map to acceptance.
Its deterministic execution ownership maps to the autonomous parent and shared
task execution. These are software ownership boundaries, not new agent roles;
the adopted execution and recovery principles continue to govern their behavior.

Moving [RunService](../../subs/harness/src/run/service.ts) into a child establishes
the workflow owner, but does not decompose its 12,450 lines. Methods implementing
planning, coordination and acceptance must move with their decisions and tests.

Keep capability coordination with work coordination initially. Its depth-first
task stack and handback rules are distinct, but depend on the same assignments,
obligations and frontier scheduling. A later capability child is justified only
if it substantially reduces what must be understood together.

Keep reconciliation and completion together. Their decision basis includes the
assessed candidate, accepted-source lineage, unresolved findings and satisfied
obligations. The current [after-handling](../../subs/harness/src/run/after-handling.ts)
and [committing gates](../../subs/harness/src/run/committing-gate.ts) demonstrate
shared automated/manual behavior and host interfaces worth preserving.

The broad [committed-record projection](../../subs/harness/src/work/committed.ts)
currently joins analysis, placement, contracts, work, capability and invocation
records. It needs small reading contracts and domain selectors; moving it to one
child unchanged would make that child the common dependency for unrelated work.

## State and dependency rules

Workflow owners supply immutable committed facts and prepared tasks. Children
return observations, assessments or proposed transitions. The workflow validates
and commits accepted transitions through the existing ledger. Projections read
committed results. Session persistence records session history independently of
whether a work item is complete.

Do not pass the mutable private `Run` object to every child. Its log, mutexes,
writer, sessions, review queue and recovery state would recreate the existing
coupling. Keep atomic transitions atomic; a module boundary must not turn one
accepted transition into independently committed partial decisions. The harness
subtree remains the owner of durable state, with the existing project exclusion
and settlement guarantees.

Contracts follow the behavior that governs them. Retain the harness public facade
and browser-safe contracts; move domain definitions with their owners and
re-expose supported contracts where needed. Avoid a general contracts or utilities
module. HTTP and MCP adapters do not need independent modules merely because
their transports differ.

Most current `assistance/`, `run/`, `steps/` and `work/` imports are same-owner
accesses. They are not proof that a new child may import those symbols. Verify
each new consumer's ordinary and testing API catalogs, and add deliberate ancestor
re-exposures or narrow injected ports. A wholesale exposure of existing internals
would defeat the proposed boundary.

Preserve existing provider responsibilities: evidence acquires project facts;
audit adapts the audit provider; reviews prepares inspection evidence and validates
submissions; check-findings owns finding identity and disposition rules; ledger
owns durability; projections owns read-only presentation. Recovery remains small
shared re-entry policy. It must not become a second workflow engine.

## Measured baseline

The [baseline data](../analysis/2026-10-19-harness-decomposition/baseline.json) records
source commit `3cf06e52cbb2996a8d4db7a6f7cf9527dcd611ac`, Ramify `0.5.2` and
ramify-audit `0.9.3`, source hashes, producer identities, the allocation rules and
the sampled commits. Source was unchanged from that commit when measured;
unrelated documentation changes existed in the worktree.

Ramify supplies ownership, file inventory, resolved application accesses and
module metrics. The [collector](../analysis/2026-10-19-harness-decomposition/collect.py)
aggregates those facts, counts physical lines and examines Git history. It does
not resolve imports or implement a competing ownership analyzer.

| Current harness measure | Value | Interpretation |
| --- | ---: | --- |
| Direct child modules | 12 | Existing decomposition, before this proposal. |
| Own production source files | 223 | Excludes child-owned source. |
| Own production source bytes | 3,490,588 | UTF-8 bytes, including types, comments and whitespace. |
| Own production physical lines | 60,237 | Includes blank lines and comments. |
| Subtree production source files / bytes | 314 / 4,681,322 | Parent still owns about 75% of source bytes. |
| Own testing source files / bytes | 424 / 5,542,743 | Test source and helpers, not a count of independent tests. |
| Current ordinary API catalog bytes | 220,310 | Available external context; not measured prompt delivery. |
| `run/service.ts` lines / bytes | 12,450 / 791,608 | About 23% of parent production bytes concentrated in one file. |

### Prospective source allocation

This experiment assigns whole existing files to the proposed owners. The exact
mapping is in `allocationRules` and `files` in the baseline. It deliberately leaves
`run/service.ts` and other mixed source in an **autonomous remainder**. The task
execution row is a seed, not its completed interface or predicted final size.
Existing child implementations remain outside these eight groups.

| Proposed group | Files | Physical lines | Source bytes | Dependency files outside group | Imported original identities outside group |
| --- | ---: | ---: | ---: | ---: | ---: |
| Assistance | 13 | 2,230 | 158,935 | 37 | 89 |
| Session store | 1 | 406 | 22,651 | 4 | 10 |
| Task execution seed | 16 | 4,458 | 248,958 | 38 | 124 |
| Autonomous planning | 6 | 1,133 | 62,272 | 15 | 52 |
| Autonomous work coordination | 49 | 10,788 | 570,892 | 49 | 147 |
| Autonomous acceptance | 36 | 7,301 | 392,093 | 67 | 225 |
| Harness facade and shared application support | 25 | 5,418 | 270,020 | 19 | 33 |
| Autonomous remainder | 77 | 28,503 | 1,764,767 | 156 | 739 |

Dependency files count direct production dependencies outside a proposed group,
including existing children. Imported originals count distinct resolved original
identities, including types, across those dependencies. Neither is a proposed
public API size or a count of new exposures required. External packages and Node
builtins are excluded. Counts overlap across rows and must not be summed into
unique project totals.

The small session store already serves four production consumer files. Assistance's
one production consumer outside its group is the root project's
[`src/main.ts`](../../src/main.ts), which calls `startAssistanceServer` through the
parent exposure already declared in the
[harness module](../../subs/harness/module.ramify). Preserving that entry point
should keep caller adaptation small. Assistance still imports 89 distinct
originals from outside its group, so this narrow consumer interface does not
establish that its provider dependencies are cheap to extract.

The facade allocation is also provisional and mixes responsibilities.
[`jobs/records.ts`](../../subs/harness/src/jobs/records.ts) owns job identity,
layout and version recognition; [`jobs/commands.ts`](../../subs/harness/src/jobs/commands.ts)
owns command replay and version admission; [`store/lock.ts`](../../subs/harness/src/store/lock.ts)
owns state-writer exclusion. These are behavioral responsibilities beyond a
public facade. Preserve genuinely shared invariants through narrow contracts and
place workflow-specific lifecycle behavior with its workflow owner. The group
has 148 production consumer files outside it, the most of any proposed group;
[`interfaces/protocol/runs.ts`](../../subs/harness/src/interfaces/protocol/runs.ts)
is the second-largest parent production file at 1,719 lines. Retaining the browser
protocol does not justify leaving every domain definition or shared mechanism in
the facade. Its eventual size and interfaces remain to be resolved, as do the
execution seed's.

The remainder still holds about 51% of parent source bytes. Naming the other
groups therefore does not establish a small autonomous coordinator. Moving mixed
methods, narrowing shared records and assigning their tests are substantive work.

### Boundary costs and test concentration

In the move-only experiment, seven groups form one strongly connected component:
the facade, session store, task execution seed, planning, coordination, acceptance
and autonomous remainder. Assistance is outside that component. Edges include
type dependencies; this is mutual source dependency, not proof of a runtime cycle.
Composition and shared contracts can legitimately create edges. Inspect their
meaning rather than imposing a blanket zero-cycle target.

The session store joins this component through just one outbound file pair
within the proposed-group graph: `run/session-store.ts` imports `store/lock.ts`
in the facade group. Its other three production dependency files belong to the
existing agent and ledger modules, outside that graph. The cycle therefore
identifies a shared lock dependency to expose narrowly; it does not establish
broad dependence on autonomous policy. Extraction must preserve writer exclusion.

Examples of direct file-pair dependencies show where interface work is needed:

| Consumer → provider group | Distinct directed file pairs |
| --- | ---: |
| Autonomous remainder → work coordination | 175 |
| Work coordination → autonomous remainder | 40 |
| Autonomous remainder → acceptance | 74 |
| Acceptance → autonomous remainder | 39 |
| Task execution seed → autonomous remainder | 26 |

The task execution dependency on workflow internals is especially relevant: a
shared runtime should receive task facts and authority without importing the
autonomous scheduler. File moves alone do not achieve that property.

| Group | Testing source files importing it directly | Of those, files also importing other proposed groups |
| --- | ---: | ---: |
| Assistance | 9 | 2 |
| Session store | 11 | 5 |
| Task execution seed | 95 | 85 |
| Planning | 40 | 38 |
| Work coordination | 119 | 103 |
| Acceptance | 105 | 84 |

These are direct-import counts, including helpers. They omit transitive exercise
and overlap across rows. They identify likely test migration and integration
work; they do not predict how many tests an audit will run.

### Change locality and verification breadth

The latest 40 non-merge commits touching current harness-owned production files
include 21 that touch one proposed group within that inventory. The stronger
locality measure also excludes commits changing other current production owners:

| Group | Commits touching group | Only this group within parent production | No other current production group or owner |
| --- | ---: | ---: | ---: |
| Assistance | 13 | 10 | 7 |
| Session store | 1 | 0 | 0 |
| Task execution seed | 11 | 2 | 1 |
| Planning | 0 | 0 | 0 |
| Work coordination | 5 | 0 | 0 |
| Acceptance | 10 | 0 | 0 |
| Harness facade and shared application support | 8 | 1 | 1 |
| Autonomous remainder | 25 | 8 | 6 |

Of assistance's 10 commits limited to one proposed parent-source group, one also
changes the reviews child and two change plan-evidence. Thus seven of its 13
commits are local across the measured production inventory. This supports its
cohesion without implying isolation from provider changes. Planning is unobserved
in this sample: zero commits supply no evidence for or against its cohesion.
Work coordination appears in five commits, all involving another proposed group;
acceptance likewise has no single-group commit among its 10. These observations
support investigating their interfaces rather than assuming independent change.
Counts overlap across rows because one commit can touch several groups.

The sample includes recent refactors, recovery work and assisted features. Commits
are not independent tasks. Deleted and moved-away production files are excluded;
tests and documentation are not part of the production grouping. The baseline
also retains edits to other current production owners so parent-local changes
are not mistaken for project-wide isolation. This sample cannot estimate the
future frequency or cost of cross-module changes.

A real `ramify affected` probe for `assistance/service.ts` selected **all 16 test
modules**, with `partial-coverage` as the widening reason. The structural check
passed with zero errors and denied accesses, but reported partial analysis
coverage: 438 inferred-signature notes, nine namespace escapes, six nonliteral
targets and five shared-global notes. The generated ordinary API view also
reports truncation. Retain these limits when interpreting missing dependencies
or API entries.

Consequently, this proposal cannot claim narrower audits from smaller ownership.
After extraction, observe actual provider selection and its widening reasons;
do not narrow verification manually. This probe is module selection evidence,
not a ramify-audit execution or a timing result.

## Prospective evaluation

Evaluate a structural change against the same accepted behavior and the total
cost of reaching it. Keep the raw observations and coverage alongside any
summary. Do not combine the measures into an arbitrary score.

| Question | Measure and source | How to interpret the comparison |
| --- | --- | --- |
| Does a focused engineer need less unrelated knowledge? | Owner production, resource, documentation and generated API bytes from Ramify; actual unique/repeated reads, searches and returned bytes from existing invocation observations. | Static inventory is potential context. Returned bytes are delivered tool output, not scanned source or model context. Compare the same task family. |
| Do boundaries hide decisions? | Direct external dependency files, distinct imported original identities, exposed contracts, and references to workflow internals in execution/session providers. | Recompute after extraction. Review the contract meanings and broad mutable inputs; a low count alone is insufficient. |
| Does ordinary work stay local? | For each accepted task, production owners changed, interface changes, integration repairs and coordinator/worker exchanges. | Count tasks as well as commits. Cross-module edits can be appropriate; record why a boundary required repeated discovery or rework. |
| Does the complete task use less time and model work? | End-to-end task elapsed time; invocation counts; actual fresh/continue/fork starts; provider input, cache-read, cache-write and output usage; repair attempts. | Include coordination, review, repair and failed attempts. Keep provider/model/accounting differences visible; do not add overlapping durations into wall time. |
| Is delivered context more useful? | Existing inherited/appended manifest bytes and declared/read-scope components; context estimates and compaction triggers where recorded. | Separate potential scope, physical delivery and observed model context. A fork is not evidence of cache reuse. |
| Is verification cheaper without losing coverage? | Actual audit selected/omitted checks, widening and fallback reasons, gate attempts, elapsed audit time and final acceptance. | Hold configured checks and required final verification constant. Smaller modules do not justify skipped checks. |

The [session observation guide](../metrics/session-observations.md) identifies
existing records and query fields. Use them for harness-managed Pi activity where
available. Native Codex/Claude engineering sessions are not automatically covered
by those observations: use accessible host records with their provenance, or mark
the metric unavailable. Assisted iteration timestamps describe elapsed intervals,
not continuous agent effort or exclusive implementation time. Overlapping
iterations, pauses and assessment waits remain visible.

Choose representative real tasks in four families: assistance lifecycle, shared
session persistence, task execution across automated/manual entry points, and
autonomous acceptance. Retain before/after source identities, task requirements,
model and reasoning settings, provider versions, audit configuration, accepted
outcomes and all attempts. Where practical, perform comparable tasks on isolated
before/after revisions with fresh contexts and alternate order to limit learning
effects. Otherwise report the comparison as descriptive rather than causal.

Record a baseline for each available task family before changing its boundary.
Report individual results and sample size; use medians and ranges only once there
are multiple observations. Missing usage or timing is unknown, never zero. Source
size and changed lines are not task difficulty. A directory move must not inflate
delivered-work credit or change the frozen whole-project search-space denominator.
Follow the [existing token-efficiency policy](../metrics/token-efficiency.md) if
that measure is used, without making it the sole acceptance criterion.

Retain an extraction when the interface hides a coherent responsibility and
comparable work shows less unrelated orientation or rework without an offsetting
increase in coordination and qualification cost. Revise or combine boundaries
when repeated tasks require the same internals on both sides. No numerical
improvement is claimed by this proposal; real before/after task measurements are
still prospective.

## Migration and preserved behavior

1. Extract session persistence with its supported contract and callers. Preserve
   payload and record compatibility, serialization, settlement and availability.
2. Extract assistance as one owner. Resolve provider access explicitly and retain
   registration, iteration identity, assessment retries, approval finalization
   and original plan/candidate provenance.
3. Narrow task execution inputs and extract shared execution mechanics. Preserve
   role-specific construction and the common managed/manual/standalone lifecycle.
4. Establish the autonomous owner, then extract planning, coordination and
   acceptance with their decisions, records and tests. Reconsider their exact
   boundaries using the observed dependency and change costs.

This order expresses dependencies, not a prescribed iteration per module.
Provider changes and their consumers can be implemented together. Do not add
required agent handoffs, editing restrictions or permission requests to make the
module tree fit an implementation process.

Preserve the existing [test boundaries](../testing.spec.md). Useful integration
anchors include [shared gate and after-handling tests](../../subs/harness/src/tests/steps-gate-after.test.ts),
[manual step execution](../../subs/harness/src/tests/steps-run.test.ts),
[run recovery](../../subs/harness/src/tests/run-recovery.test.ts),
[composed recovery](../../subs/harness/src/tests/composition-recovery.test.ts),
[capability acceptance](../../subs/harness/src/tests/capability-acceptance.integration.test.ts),
and assisted [service](../../subs/harness/src/tests/assistance-service.test.ts) and
[MCP](../../subs/harness/src/tests/assistance-mcp.test.ts) integration.

Each implemented extraction requires structural/type checks, relevant behavior
tests and the default configured audit on its committed candidate. Preserve
historical records and browser contracts, fresh-session task reconstruction,
candidate-bound acceptance, atomic accepted transitions and read-only queries.
The baseline check and selection probe in this document do not qualify a future
implementation.

## Reproducing the baseline

Use the source commit above in a prepared checkout with the exact provider pins.
From its root, refresh the generated views and gather producer output:

```sh
node_modules/.bin/ramify materialize --view architect --view api --from subs/harness/src
node_modules/.bin/ramify check --batch --root . --format json > /tmp/harness-decomposition-check.json
node_modules/.bin/ramify measure --format json > /tmp/harness-decomposition-measure.json
node_modules/.bin/ramify affected --path subs/harness/src/assistance/service.ts --format json > /tmp/harness-decomposition-affected.json
python3 /path/to/proposal/collect.py /tmp/harness-decomposition-check.json /tmp/harness-decomposition-measure.json /tmp/harness-decomposition-affected.json > /tmp/harness-decomposition-baseline.json
```

`/path/to/proposal/collect.py` names the collector linked above, retained outside
the historical checkout if necessary. The collector requires unchanged harness
source and verifies every source/resource hash in the check inventory against
disk and every file byte count against the measurement inventory. The resident
architect, measure and affected results must share a revision. Batch and resident
input identities are retained separately. New process identities and unrelated
worktree inventories can change producer hashes; compare source identity,
coverage and metric values rather than demanding identical whole-report bytes.

For an implemented candidate, revise the allocation to actual owners before
repeating the comparison. Preserve this original baseline and its mapping; do not
silently redefine it to improve the result. Actual future API catalog sizes and
consumer access must come from newly materialized views.
